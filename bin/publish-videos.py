"""Publish the GeoClick videos that already exist on YouTube. Captions deferred.

ai-player owns scope, ordering and the playlist; youtube3 owns every API call.
Metadata, thumbnails and visibility go through youtube3's own publish
plan/apply; playlist seats go through youtube3's own ensure_playlist_member.
No caption read, plan or insert happens here: the owner deferred subtitles.

Native plans and checkpoints are never rewritten. Where a queued publication
target still names an older visibility, the run records it and the caption
recovery route is youtube3's own per-video captions upload, not a queue
resume, so a released video can never be made private again by a rerun.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import sys

spec = importlib.util.spec_from_file_location('workflow', Path(__file__).with_name('geoclick-youtube.py'))
w = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w)

AFRICA_DIR = 'rendered/africa-eight-20261102/youtube-publishing'
ASIA_DIR = 'rendered/asia-seven-20261101/youtube-publishing'
MODULES = {}


class Blocked(Exception):
    """A refusal that must stop the run without guessing."""


def africa_targets(config):
    """The eight uploaded Africa videos and their approved screenshot thumbnails."""
    batch = w.read(w.ROOT / AFRICA_DIR / 'batch.json')
    plan = w.read(w.ROOT / AFRICA_DIR / 'plan.json')
    queue = w.read(w.ROOT / AFRICA_DIR / 'queue.json')
    if plan['channel_id'] != config['channel_id'] or plan['profile'] != config['profile']:
        raise ValueError('Africa plan destination mismatch')
    rows = []
    for entry in batch['entries']:
        identity = entry['id']
        video_id = queue['entries'][identity]['video_id']
        child = Path(str(w.ROOT / AFRICA_DIR / 'queue.json') + '.jobs') / (identity + '.json')
        job = w.read(child)
        if not video_id or job['video_id'] != video_id or job['stages']['upload'] != 'successful':
            raise ValueError('Africa entry has no accepted upload ID')
        rows.append({'entry': identity, 'video_id': video_id,
                     'thumbnail': entry['settings']['thumbnail']})
    if len(rows) != 8:
        raise ValueError('Expected eight Africa uploads')
    return rows


def tag_targets(config, series_id):
    """The accepted video IDs of one uploaded series, for a targeted metadata edit."""
    for series in [*config['series'], config['offline_series'], *config.get('additional_offline_series', [])]:
        if series.get('id') == series_id:
            return list(series.get('video_ids') or [])
    return []


def uploaded_targets(config):
    """Every series uploaded through the native flow, with its accepted video IDs."""
    rows = []
    candidates = [*config['series'], config['offline_series'], *config.get('additional_offline_series', [])]
    for series in candidates:
        folder = w.ROOT / series.get('publishing_dir', '')
        queue_path = folder / 'queue-upload.json'
        if not series.get('video_ids') or not queue_path.exists():
            continue
        queue = w.read(queue_path)
        for entry in queue['plan']['entries']:
            video_id = queue['entries'][entry['id']]['video_id']
            if video_id:
                rows.append({'series': series['id'], 'entry': entry['id'], 'video_id': video_id})
    return rows


def known_targets(config):
    """The eleven already released US and Europe videos, in playlist order."""
    rows = []
    for series in config['series']:
        for index, video_id in enumerate(series['video_ids']):
            rows.append({'series': series['id'], 'video_id': video_id, 'index': index})
    if len(rows) != 11:
        raise ValueError('Expected eleven known videos')
    return rows


def asia_targets(config):
    """The seven uploaded Asia videos and their approved screenshot thumbnails."""
    batch = w.read(w.ROOT / ASIA_DIR / 'batch-upload.json')
    queue = w.read(w.ROOT / ASIA_DIR / 'queue-upload.json')
    if queue['plan']['channel_id'] != config['channel_id'] or queue['plan']['profile'] != config['profile']:
        raise ValueError('Asia queue destination mismatch')
    rows = []
    for entry in batch['entries']:
        identity = entry['id']
        video_id = queue['entries'][identity]['video_id']
        child = Path(str(w.ROOT / ASIA_DIR / 'queue-upload.json') + '.jobs') / (identity + '.json')
        job = w.read(child)
        if not video_id or job['video_id'] != video_id or job['stages']['upload'] != 'successful':
            raise ValueError('Asia entry has no accepted upload ID')
        rows.append({'entry': identity, 'video_id': video_id,
                     'thumbnail': entry['settings']['thumbnail']})
    if len(rows) != 7:
        raise ValueError('Expected seven Asia uploads')
    return rows


def queued_targets(video_ids):
    """What the native plans still say about visibility, for the record only."""
    rows = []
    for folder in ('rendered/usa-five-20261101/youtube-publishing',
                   'rendered/europe-six-20261101/youtube-publishing',
                   AFRICA_DIR, ASIA_DIR):
        queue_path = w.ROOT / folder / 'queue.json'
        if not queue_path.exists():
            continue
        queue = w.read(queue_path)
        for entry in queue['plan']['entries']:
            identity = entry['id']
            child = Path(str(queue_path) + '.jobs') / (identity + '.json')
            job = w.read(child) if child.exists() else entry['job']
            video_id = job.get('video_id') or queue['entries'][identity]['video_id']
            if video_id in video_ids:
                rows.append({'queue': folder, 'entry': identity, 'video_id': video_id,
                             'queued_privacy': job['publication']['privacy'],
                             'publication_stage': job['stages'].get('publication'),
                             'captions_pending': job['stages'].get('subtitles') != 'successful'})
    return rows


def read_videos(client, config, ids):
    """The videos' own snippet and status. The API accepts at most 50 IDs per call."""
    videos = []
    for start in range(0, len(ids), 50):
        chunk = ids[start:start + 50]
        videos.extend(client.youtube.videos().list(part='snippet,status', id=','.join(chunk)).execute(num_retries=0).get('items', []))
    if {v['id'] for v in videos} != set(ids):
        raise ValueError('Video count mismatch')
    for video in videos:
        if video['snippet']['channelId'] != config['channel_id']:
            raise ValueError('Video belongs to another channel')
    return {v['id']: v for v in videos}


def read_members(client, config):
    members, token = [], None
    while True:
        options = dict(part='contentDetails', playlistId=config['playlist_id'], maxResults=50)
        if token:
            options['pageToken'] = token
        page = client.youtube.playlistItems().list(**options).execute(num_retries=0)
        members.extend(v['contentDetails']['videoId'] for v in page.get('items', []))
        token = page.get('nextPageToken')
        if not token:
            break
    return members


def apply_video(client, config, video_id, current, *, description=None, privacy=None, thumbnail=None, apply=True):
    """One safe update for one video: metadata, visibility and/or thumbnail."""
    publish = MODULES['publish']
    plan = publish.plan_publish(client, video_id, description=description,
                                 privacy=privacy, thumbnail=thumbnail)
    if plan['errors']:
        raise Blocked('youtube3 refused the plan: ' + '; '.join(plan['errors']))
    changed = [part for part in ('snippet', 'status') if plan[part] is not None]
    if description is not None and plan['changes'].get('description', (None,))[0] not in (None, current.get('description')):
        raise Blocked('Description changed concurrently; inspect a fresh plan')
    if not changed and plan['thumbnail'] is None:
        return {'video_id': video_id, 'state': 'unchanged', 'parts': []}
    if not apply:
        return {'video_id': video_id, 'state': 'would-apply', 'parts': changed,
                'thumbnail_planned': plan['thumbnail'] is not None}
    done = publish.apply_publish(client, plan)
    return {'video_id': video_id, 'state': 'applied', 'parts': done}


def seat(client, config, video_id):
    """Add one playlist seat if it is missing. Never reorders what is there."""
    result = MODULES['batch'].ensure_playlist_member(client, config['playlist_id'], video_id)
    return {'video_id': video_id, 'state': result['state']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--step', choices=('us-europe', 'asia', 'africa', 'publish-new', 'north-america-tags', 'playlist', 'verify'), required=True)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    config = w.read(w.CONFIG)
    Client, captions, publish, batch, queue, secrets = w.library()
    MODULES.update({'publish': publish, 'batch': batch})
    link = config['links']['playlist']
    known = known_targets(config)
    africa = africa_targets(config)
    known_ids = [row['video_id'] for row in known]
    africa_ids = [row['video_id'] for row in africa]
    operations = w.ROOT / config['operations_dir']
    record = {'step': args.step, 'started_at': w.now(), 'dry_run': args.dry_run, 'actions': [], 'errors': []}

    client = Client(secrets, profile=config['profile'])
    if client.signed_in_channel()['id'] != config['channel_id']:
        raise ValueError('Signed-in channel mismatch')

    try:
        if args.step in ('us-europe', 'asia', 'africa'):
            rows = {'us-europe': known, 'asia': asia_targets(config), 'africa': africa}[args.step]
            ids = [row['video_id'] for row in rows]
            videos = read_videos(client, config, ids)
            for row in rows:
                video = videos[row['video_id']]
                description = w.linked(video['snippet'].get('description', ''), link)
                action = apply_video(client, config, row['video_id'], video['snippet'],
                                     description=description, privacy='public',
                                     thumbnail=row.get('thumbnail'), apply=not args.dry_run)
                if 'series' in row:
                    action['series'] = row['series']
                record['actions'].append(action)
                if action['state'] not in ('unchanged', 'would-apply'):
                    record['actions'].append(seat(client, config, row['video_id']))
            record['queued_publication_targets'] = queued_targets(ids)
        elif args.step == 'publish-new':
            # Every series uploaded through the native flow, made visible.
            # Already-public videos report no change and cost nothing.
            rows = uploaded_targets(config)
            if not rows:
                raise ValueError('No uploaded series are recorded')
            ids = [row['video_id'] for row in rows]
            videos = read_videos(client, config, ids)
            for identity in ids:
                video = videos[identity]
                description = w.linked(video['snippet'].get('description', ''), link)
                action = apply_video(client, config, identity, video['snippet'],
                                     description=description, privacy='public', apply=not args.dry_run)
                record['actions'].append(action)
        elif args.step == 'north-america-tags':
            # The published hashtag was written as "#North America"; YouTube
            # reads a space as the end of a tag. Only that token changes.
            ids = tag_targets(config, 'north-america')
            if not ids:
                raise ValueError('No North America video IDs are recorded')
            videos = read_videos(client, config, ids)
            for identity in ids:
                current = videos[identity]['snippet'].get('description', '')
                corrected = current.replace('#North America', '#NorthAmerica')
                if corrected == current:
                    record['actions'].append({'video_id': identity, 'state': 'unchanged'})
                    continue
                action = apply_video(client, config, identity, videos[identity]['snippet'],
                                     description=corrected, apply=not args.dry_run)
                record['actions'].append(action)
        elif args.step == 'playlist':
            playlist = client.youtube.playlists().list(part='snippet,status', id=config['playlist_id']).execute(num_retries=0).get('items', [])
            if len(playlist) != 1 or playlist[0]['snippet']['channelId'] != config['channel_id']:
                raise ValueError('Playlist ownership mismatch')
            if playlist[0]['snippet']['title'] != config['playlist_title']:
                raise ValueError('Playlist title changed; inspect before continuing')
            if playlist[0]['status']['privacyStatus'] != 'public':
                if args.dry_run:
                    record['actions'].append({'playlist': config['playlist_id'], 'state': 'would-publish'})
                else:
                    # YouTube refuses a status-only playlist update; the whole
                    # snippet is resent with its current values so the title,
                    # description and cover are untouched.
                    client.youtube.playlists().update(
                        part='snippet,status',
                        body={'id': config['playlist_id'], 'snippet': playlist[0]['snippet'],
                              'status': {'privacyStatus': 'public'}}).execute(num_retries=0)
                    record['actions'].append({'playlist': config['playlist_id'], 'state': 'published'})
            else:
                record['actions'].append({'playlist': config['playlist_id'], 'state': 'unchanged'})
        else:
            ids = known_ids + africa_ids
            if (w.ROOT / ASIA_DIR / 'queue-upload.json').exists():
                ids += [row['video_id'] for row in asia_targets(config)]
            ids += [row['video_id'] for row in uploaded_targets(config)
                    if row['video_id'] not in ids]
            videos = read_videos(client, config, ids)
            members = read_members(client, config)
            playlist = client.youtube.playlists().list(part='snippet,status', id=config['playlist_id']).execute(num_retries=0).get('items', [])
            report = {'observed_at': w.now(),
                      'playlist_privacy': playlist[0]['status']['privacyStatus'],
                      'playlist_members': members,
                      'videos': [{'id': i, 'privacy': videos[i]['status']['privacyStatus'],
                                  'playlist_link_present': link in videos[i]['snippet'].get('description', ''),
                                  'title': videos[i]['snippet']['title']} for i in ids],
                      'missing_from_playlist': [i for i in ids if i not in members],
                      'duplicate_members': sorted({m for m in members if members.count(m) > 1})}
            report['complete'] = (report['playlist_privacy'] == 'public'
                                   and not report['missing_from_playlist']
                                   and not report['duplicate_members']
                                   and all(v['privacy'] == 'public' and v['playlist_link_present'] for v in report['videos']))
            w.save(operations / 'publish-verification.json', report)
            record['report'] = report
            print(json.dumps({'step': 'verify', 'complete': report['complete'],
                              'missing_from_playlist': report['missing_from_playlist'],
                              'not_public': [v['id'] for v in report['videos'] if v['privacy'] != 'public'],
                              'without_link': [v['id'] for v in report['videos'] if not v['playlist_link_present']],
                              'playlist_privacy': report['playlist_privacy'],
                              'playlist_members': len(members)}, indent=2))
            return 0 if report['complete'] else 2
    except BaseException as error:
        info = w.error_info(error)
        record['errors'].append(info)
        record['state'] = 'blocked'
        record['finished_at'] = w.now()
        if not args.dry_run:
            w.save(operations / 'publish-run.json', record)
        print(json.dumps({'step': args.step, 'state': 'blocked', 'error_type': type(error).__name__,
                          'errors': record['errors'], 'accepted_actions': record['actions']}, indent=2))
        return 2

    record['state'] = 'dry-run' if args.dry_run else 'applied'
    record['finished_at'] = w.now()
    if not args.dry_run:
        w.save(operations / 'publish-run.json', record)
    print(json.dumps({'step': args.step, 'state': record['state'],
                      'accepted_actions': record['actions'],
                      'queued_publication_targets': record.get('queued_publication_targets', [])}, indent=2))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(json.dumps({'state': 'blocked', 'error_type': type(error).__name__, 'error': w.error_info(error)}))
        sys.exit(2)
