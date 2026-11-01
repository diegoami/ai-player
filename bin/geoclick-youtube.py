"""GeoClick policy/orchestration only. youtube3 owns auth, jobs and recovery.

audit/migrate/prepare are offline. plan/verify read the account. resume writes only
the eleven already uploaded videos and their existing playlist.
"""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
from importlib.metadata import version
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'config/geoclick-youtube.json'


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def save(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    os.replace(temp, path)


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def linked(description, url):
    if url in description:
        return description
    line = 'Full playlist: ' + url + '\n'
    if 'Play GeoClick:' in description:
        return description.replace('Play GeoClick:', line + 'Play GeoClick:', 1)
    return description.rstrip() + '\n\n' + line.rstrip()


def error_info(error):
    """Only safe error categories, including youtube3's suppressed contexts."""
    seen, codes, status = set(), set(), None
    while error is not None and id(error) not in seen:
        seen.add(id(error))
        if hasattr(error, 'content') and hasattr(error, 'resp'):
            status = getattr(error.resp, 'status', status)
            try:
                codes.update(row.get('reason', 'unrecognized_reason') for row in
                             json.loads(error.content).get('error', {}).get('errors', []))
            except (ValueError, TypeError, AttributeError):
                pass
        error = error.__cause__ or error.__context__
    allowed = {'quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded',
               'userRateLimitExceeded', 'insufficientPermissions', 'forbidden',
               'videoNotFound', 'playlistNotFound', 'captionExists', 'invalidValue',
               'badRequest', 'invalidMetadata', 'uploadLimitExceeded'}
    return {'http_status': status,
            'reason_codes': sorted(c if c in allowed else 'unrecognized_reason' for c in codes)}


class Blocked(Exception):
    pass


def library():
    if version('youtube3') != '2.10.0':
        raise ValueError('This workflow requires installed youtube3 2.10.0')
    # Same Windows-principal setup as the installed youtube3 launcher (SSH).
    # All credential handling remains exclusively inside YoutubeClient.
    if os.name == 'nt':
        principal = subprocess.run(['whoami'], capture_output=True, text=True, check=True).stdout.strip()
        if '\\' in principal:
            domain, user = principal.rsplit('\\', 1)
            os.environ.update(USERDOMAIN=domain, USERNAME=user)
    from youtube3 import YoutubeClient, captions, publish, publishing_batch, publishing_queue
    from youtube3.cli.common import DEFAULT_SECRETS
    return YoutubeClient, captions, publish, publishing_batch, publishing_queue, DEFAULT_SECRETS


def inventory(config, batch_module, queue_module):
    rows, shared = [], set()
    for series in config['series']:
        folder = ROOT / series['publishing_dir']
        qpath = folder / 'queue.json'
        queue = queue_module.load_queue(qpath)
        batch = batch_module.resolve_batch(folder / 'batch.json')  # local only
        production = read(ROOT / series['ledger'])
        if production['status'] != 'complete' or len(batch) != len(production['episodes']):
            raise ValueError('Incomplete or mismatched production ledger')
        if (queue['plan']['channel_id'], queue['plan']['profile']) != (config['channel_id'], config['profile']):
            raise ValueError('Queue destination mismatch')
        shared.add(str(Path(queue['ledger']).resolve()))
        for i, (entry, episode) in enumerate(zip(batch, production['episodes'], strict=True)):
            child = Path(str(qpath) + '.jobs') / (entry['id'] + '.json')
            job = read(child)
            identity = queue['entries'][entry['id']]['video_id']
            if identity != series['video_ids'][i] or job['video_id'] != identity or job['stages']['upload'] != 'successful':
                raise ValueError('Known upload ID/checkpoint mismatch; refusing upload recovery')
            master = (ROOT / episode['video']).resolve()
            if Path(entry['file']).resolve() != master or Path(job['upload']['file']['path']).resolve() != master:
                raise ValueError('Publishing input is not the approved canonical master')
            report = read(master.parent / 'verification.json')
            if report['visualReview'] != 'passed':
                raise ValueError('Unreviewed master')
            rows.append({'series': series['id'], 'entry': entry['id'], 'video_id': identity,
                         'queue': qpath, 'child': child, 'job': job, 'master': master,
                         'queue_state': queue['entries'][entry['id']]['state']})
    if len(rows) != 11 or len({r['video_id'] for r in rows}) != 11 or len(shared) != 1:
        raise ValueError('Expected eleven unique known videos and one shared upload ledger')
    ledger = Path(shared.pop())
    records = read(ledger)
    if records['channel_id'] != config['channel_id']:
        raise ValueError('Shared ledger channel mismatch')
    for row in rows:
        q = queue_module.load_queue(row['queue'])
        fingerprint = q['fingerprints'][row['entry']]
        if (records['uploads'].get(fingerprint, {}).get('video_id') != row['video_id']
                or records['uploads'][fingerprint]['state'] != 'uploaded'):
            raise ValueError('Shared ledger lost a known video; inspect rather than reset')
    return rows, ledger


def backup(config, rows, ledger):
    destination = ROOT / config['operations_dir'] / 'migration-backup'
    manifest = destination / 'manifest.json'
    if manifest.exists():
        return
    sources = {ledger, ROOT / config['release_state']}
    for row in rows:
        sources.update([row['queue'], row['child'], row['queue'].parent / 'batch.json', row['queue'].parent / 'plan.json'])
    for name in ('publish-all.py', 'publish.py', 'resume-publication.ps1'):
        sources.add(rows[-1]['queue'].parent / name)
    copies = []
    for i, source in enumerate(sorted(sources, key=str)):
        if not source.exists():
            raise ValueError('Missing operational backup input')
        target = destination / f'{i:02d}-{source.name}'
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and digest(target) != digest(source):
            raise ValueError('Incomplete migration backup requires inspection')
        if not target.exists():
            shutil.copy2(source, target)
        copies.append({'source': str(source), 'backup': str(target), 'sha256': digest(target)})
    save(manifest, {'created_at': now(), 'files': copies})


def migrate(config, rows, ledger):
    backup(config, rows, ledger)
    operations = ROOT / config['operations_dir']
    originals = {r['source']: r['sha256'] for r in read(operations / 'migration-backup/manifest.json')['files']}
    folder = rows[-1]['queue'].parent
    python_shim = '''# Managed by ai-player: compatibility entrypoint, no publishing logic.
import runpy
import sys
from pathlib import Path
aliases = {'apply': 'resume', 'retry': 'resume', 'prepare': 'audit'}
mode = sys.argv[1] if len(sys.argv) > 1 else 'audit'
sys.argv = ['geoclick-youtube.py', aliases.get(mode, mode)]
runpy.run_path(str(Path(__file__).resolve().parents[3] / 'bin/geoclick-youtube.py'), run_name='__main__')
'''
    powershell_shim = '''# Managed by ai-player: compatibility entrypoint, no publishing logic.
$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\\..\\..')).Path
& (Join-Path $repositoryRoot 'bin/geoclick-youtube.ps1') -Mode resume
exit $LASTEXITCODE
'''
    for name, content in [('publish-all.py', python_shim), ('publish.py', python_shim), ('resume-publication.ps1', powershell_shim)]:
        path = folder / name
        if path.read_text(encoding='utf-8') == content:
            continue
        if digest(path) != originals[str(path)]:
            raise ValueError('Legacy script changed since backup; preserve owner changes')
        path.write_text(content, encoding='utf-8')
    prior = read(ROOT / config['release_state'])
    planned = []
    for row in rows:
        metadata = row['job']['metadata']
        planned.append({'series': row['series'], 'entry': row['entry'], 'video_id': row['video_id'],
                        'queue': str(row['queue']), 'job_checkpoint': str(row['child']),
                        'approved_master': str(row['master']), 'captions': row['job'].get('subtitles', []),
                        'desired_privacy': 'public', 'title': metadata['title'],
                        'cached_description_with_playlist_link': linked(metadata['description'], config['links']['playlist']),
                        'pending_stages': [k for k, v in row['job']['stages'].items() if v not in ('successful', 'skipped')]})
    save(operations / 'operating-plan.json', {'prepared_at': now(), 'account_access': False,
         'metadata_provenance': 'Local immutable job checkpoints; fresh remote descriptions are reconciled by resume before writing.',
         'profile': config['profile'], 'channel_id': config['channel_id'], 'playlist_id': config['playlist_id'],
         'playlist_title': config['playlist_title'], 'playlist_desired_privacy': 'public', 'playlist_cover': 'Preserve existing screenshot-based cover; never call image/cover APIs.',
         'shared_upload_ledger': str(ledger), 'release_state': str(ROOT / config['release_state']),
         'last_attempt_state': prior.get('state'), 'last_error': prior.get('last_error'),
         'write_scope': 'Only these eleven existing videos and their existing playlist. No new uploads.', 'videos_in_order': planned,
         'offline_asia_batch': str(ROOT / config['offline_series']['publishing_dir'] / 'batch.json'),
         'asia_upload_authorized': False})
    print('Migrated: original scripts backed up; three legacy entrypoints delegate to ai-player. Queues, IDs and ledger remain in place. Offline operating plan saved.')


def snapshot(client, config, ids):
    videos = client.youtube.videos().list(part='snippet,status', id=','.join(ids)).execute(num_retries=0).get('items', [])
    if {v['id'] for v in videos} != set(ids) or any(v['snippet']['channelId'] != config['channel_id'] for v in videos):
        raise ValueError('Video count/ownership mismatch')
    playlists = client.youtube.playlists().list(part='snippet,status', id=config['playlist_id']).execute(num_retries=0).get('items', [])
    if len(playlists) != 1 or playlists[0]['snippet']['channelId'] != config['channel_id']:
        raise ValueError('Playlist ownership mismatch')
    if playlists[0]['snippet']['title'] != config['playlist_title']:
        raise ValueError('Playlist title changed; inspect before continuing')
    members, token = [], None
    while True:
        options = dict(part='snippet,contentDetails', playlistId=config['playlist_id'], maxResults=50)
        if token:
            options['pageToken'] = token
        page = client.youtube.playlistItems().list(**options).execute(num_retries=0)
        members.extend(v['contentDetails']['videoId'] for v in page.get('items', []))
        token = page.get('nextPageToken')
        if not token:
            break
    return {'observed_at': now(), 'videos': {v['id']: v for v in videos},
            'playlist': playlists[0], 'members': members}


def verification(config, observed, ids, baseline=None):
    members = observed['members']
    order_ok = [v for v in members if v in ids] == ids and all(members.count(v) == 1 for v in ids)
    checks = {'playlist_public': observed['playlist']['status']['privacyStatus'] == 'public',
              'playlist_order_and_no_duplicates': order_ok}
    if baseline:
        checks['other_playlist_members_preserved'] = [v for v in members if v not in ids] == [v for v in baseline['members'] if v not in ids]
        checks['playlist_metadata_and_cover_preserved'] = observed['playlist']['snippet'] == baseline['playlist']['snippet']
    videos = []
    for identity in ids:
        v = observed['videos'][identity]
        videos.append({'id': identity, 'title': v['snippet']['title'], 'privacy': v['status']['privacyStatus'],
                       'playlist_link_present': config['links']['playlist'] in v['snippet'].get('description', '')})
        if baseline:
            before = baseline['videos'][identity]
            checks[f'{identity}_other_metadata_preserved'] = (
                {k: v['snippet'].get(k) for k in ('title', 'tags', 'categoryId', 'defaultLanguage', 'defaultAudioLanguage')}
                == {k: before['snippet'].get(k) for k in ('title', 'tags', 'categoryId', 'defaultLanguage', 'defaultAudioLanguage')})
            checks[f'{identity}_description_preserved_plus_link'] = v['snippet'].get('description', '') == linked(before['snippet'].get('description', ''), config['links']['playlist'])
            fields = ('embeddable', 'license', 'publicStatsViewable', 'selfDeclaredMadeForKids', 'containsSyntheticMedia')
            checks[f'{identity}_other_status_preserved'] = {k: v['status'].get(k) for k in fields} == {k: before['status'].get(k) for k in fields}
    checks['videos_public_and_linked'] = all(v['privacy'] == 'public' and v['playlist_link_present'] for v in videos)
    return {'observed_at': observed['observed_at'], 'checks': checks, 'videos': videos,
            'playlist_members': members, 'completed': all(checks.values())}


@contextmanager
def observe_errors(modules, recorded):
    """Observe refusals hidden by library checkpoints; do not replace their logic."""
    originals = []
    for module, name in modules:
        original = getattr(module, name)
        def wrapped(*args, _original=original, **kwargs):
            try:
                return _original(*args, **kwargs)
            except BaseException as error:
                info = error_info(error)
                if info['http_status'] is not None:
                    recorded.append(info)
                raise
        originals.append((module, name, original))
        setattr(module, name, wrapped)
    try:
        yield
    finally:
        for module, name, original in originals:
            setattr(module, name, original)


def release(mode, config, rows, ledger, modules):
    Client, captions, publish, batch, queue, secrets = modules
    state_path = ROOT / config['release_state']
    state = read(state_path)
    operations = ROOT / config['operations_dir']
    errors = []
    run = {'started_at': now(), 'mode': mode, 'accepted_actions': [], 'errors': errors}
    ids = [r['video_id'] for r in rows]
    try:
        client = Client(secrets, profile=config['profile'])
        if client.signed_in_channel()['id'] != config['channel_id']:
            raise ValueError('Signed-in channel mismatch')
        if mode == 'resume':
            pending = next(r for r in rows if r['entry'] == config['pending_entry'])
            if pending['queue_state'] != 'completed':
                run['current_operation'] = {'stage': 'youtube3_queue_recovery', 'video_id': pending['video_id']}
                state['current_operation'] = run['current_operation']
                save(state_path, state)
                save(operations / 'last-run.json', run)
                with observe_errors([(captions, 'plan_caption'), (captions, 'apply_caption'),
                                     (batch, 'ensure_playlist_member')], errors):
                    # Existing stage-specific retry continues the remaining stages,
                    # membership and its original unlisted publication, never upload.
                    q = queue.load_queue(pending['queue'])
                    stage = 'playlist' if q['entries'][pending['entry']]['error'] == 'playlist' else pending['job'].get('failed_stage')
                    result = queue.run_queue(client, pending['queue'], resume=True, retry=True,
                                             select=[pending['entry']], stage=stage)
                if result['entries'][pending['entry']]['state'] != 'completed':
                    raise Blocked('youtube3 recovery stopped; inspect its retained checkpoints')
                run['accepted_actions'].append({'stage': 'captions_membership_and_original_publication', 'video_id': pending['video_id']})
                save(operations / 'last-run.json', run)
        observed = snapshot(client, config, ids)
        save(operations / 'last-observation.json', observed)
        if mode == 'verify':
            baseline_path = operations / 'release-baseline.json'
            report = verification(config, observed, ids, read(baseline_path) if baseline_path.exists() else None)
            save(operations / 'verification.json', report)
            print(json.dumps(report, indent=2))
            return 0 if report['completed'] else 2
        baseline = operations / 'release-baseline.json'
        if mode == 'resume' and not baseline.exists():
            save(baseline, observed)
        # Reconcile fresh remote descriptions, preserving owner edits since the old plan.
        for identity in ids:
            v = observed['videos'][identity]
            row = state.setdefault('videos', {}).setdefault(identity, {})
            row.update(title=v['snippet']['title'], description=linked(v['snippet'].get('description', ''), config['links']['playlist']), desired_privacy='public')
            row['state'] = 'verified' if v['status']['privacyStatus'] == 'public' and config['links']['playlist'] in v['snippet'].get('description', '') else 'pending'
        save(operations / 'consolidated-plan.json', {'created_at': now(), 'profile': config['profile'],
             'channel_id': config['channel_id'], 'playlist_id': config['playlist_id'],
             'video_ids_in_order': ids, 'videos': state['videos'], 'shared_ledger': str(ledger)})
        if mode == 'plan':
            print('Read-only plan saved: eleven known videos, public visibility, playlist links. No account writes.')
            return 0
        save(state_path, state)
        for identity in ids:
            row = state['videos'][identity]
            if row['state'] == 'verified':
                continue
            state['current_operation'] = {'stage': 'video_description_and_publication', 'video_id': identity}
            save(state_path, state)
            plan = publish.plan_publish(client, identity, description=row['description'], privacy='public')
            if plan['errors']:
                raise Blocked('youtube3 refused metadata validation')
            if plan['changes'].get('description', (None,))[0] not in (None, observed['videos'][identity]['snippet'].get('description', '')):
                raise Blocked('Description changed concurrently; inspect a fresh plan')
            publish.apply_publish(client, plan)
            action = {'at': now(), 'stage': 'video_description_and_publication', 'video_id': identity, 'state': 'applied'}
            state.setdefault('operations', []).append(action)
            run['accepted_actions'].append(action)
            row['state'] = 'applied'
            save(state_path, state)
            save(operations / 'last-run.json', run)
        if observed['playlist']['status']['privacyStatus'] != 'public':
            state['current_operation'] = {'stage': 'playlist_publication'}
            save(state_path, state)
            # youtube3 has no playlist-visibility helper; update only status.
            # Never send snippet, images or cover data.
            client.youtube.playlists().update(part='status', body={'id': config['playlist_id'], 'status': {'privacyStatus': 'public'}}).execute(num_retries=0)
            action = {'at': now(), 'stage': 'playlist_publication', 'state': 'applied'}
            state.setdefault('operations', []).append(action)
            run['accepted_actions'].append(action)
            save(state_path, state)
        final = snapshot(client, config, ids)
        save(operations / 'last-observation.json', final)
        report = verification(config, final, ids, read(baseline))
        save(operations / 'verification.json', report)
        state['verification'] = report
        state['state'] = 'completed' if report['completed'] else 'verification_required'
        if report['completed']:
            state.pop('last_error', None)
        save(state_path, state)
        run['state'] = state['state']
        save(operations / 'last-run.json', run)
        print(json.dumps({'state': state['state'], 'accepted_actions': run['accepted_actions'], 'checks': report['checks']}, indent=2))
        return 0 if report['completed'] else 2
    except BaseException as error:
        info = error_info(error)
        if info['http_status'] is not None:
            errors.append(info)
        run.update(state='blocked', stopped_at=now(), error_type=type(error).__name__)
        state.update(state='blocked', last_attempt_at=now(), last_error=errors[-1] if errors else {'reason_codes': ['checkpoint_or_validation_block']})
        state.setdefault('attempts', []).append(run)
        save(state_path, state)
        save(operations / 'last-run.json', run)
        # No readback, mutation retry, caption polling, or subsequent account calls.
        print(json.dumps({'state': 'blocked', 'error_type': type(error).__name__, 'errors': errors,
                          'accepted_actions_this_run': run['accepted_actions'],
                          'next': 'Inspect checkpoints; rerun resume only when quota/access permits.'}, indent=2))
        return 2


def prepare(config, batch_module, captions):
    series = config['offline_series']
    production = read(ROOT / series['ledger'])
    if production['status'] != 'complete':
        raise ValueError('Offline series is not complete')
    folder = ROOT / series['publishing_dir']
    folder.mkdir(parents=True, exist_ok=True)
    entries, manifest = [], []
    for i, episode in enumerate(production['episodes'], 1):
        if episode['status'] != 'complete':
            raise ValueError('Unapproved episode')
        master = (ROOT / episode['video']).resolve()
        report = read(master.parent / 'verification.json')
        if report['visualReview'] != 'passed':
            raise ValueError('Unreviewed episode')
        subtitle = master.parent / 'subtitles.en.srt'
        caption_report = captions.check_caption(subtitle)
        thumbnail = folder / f'asia-{i:02d}-{episode["id"]}.jpg'
        if not thumbnail.exists():
            trace = read(master.parent / 'trace.json')
            second = trace['turns'][0]['start'] - trace['trimStart'] + 4
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', str(second), '-i', str(master), '-frames:v', '1', '-vf', 'scale=1280:720', '-q:v', '2', str(thumbnail)], check=True, capture_output=True)
        text = (f'Learn {episode["title"]} with GeoClick: locations, interesting facts and geographic memory hooks.\n\n'
                f'Asia lesson {i} of 7. Places covered: {", ".join(episode["places"])}.\n\n'
                'This seven-part edition has 49 teaching stops. Cyprus counts once, with its divided island explained; '
                'Bahrain, Maldives and Singapore use labelled supplemental geographic views. Asian Russia is briefly '
                'oriented because its full country stop was in the Europe series. Map targets do not settle disputed political status or boundaries.\n\n'
                'Prepared geography lesson, not a scored quiz. English narration by John (synthetic voice); optional English captions.\n\n'
                f'Full playlist: {config["links"]["playlist"]}\nPlay GeoClick: {config["links"]["game"]}\n'
                f'GeoClick source code: {config["links"]["geoclick_repository"]}\nVideo production tools: {config["links"]["ai_player_repository"]}\n\n#GeoClick #LearnGeography #Asia')
        entries.append({'id': f'asia-{i:02d}-{episode["id"]}', 'file': str(master), 'episode': i,
                        'settings': {'title': f'Learn Asia: {episode["title"]} | GeoClick Geography {i}/7',
                                     'description': text, 'thumbnail': str(thumbnail),
                                     'tags': ['GeoClick', 'Asia', 'learn geography', episode['title']],
                                     'subtitles': [{'file': str(subtitle), 'language': 'en', 'name': 'English', 'draft': False}]}})
        manifest.append({'episode': i, 'master': str(master), 'master_sha256': digest(master),
                         'caption': caption_report, 'thumbnail': str(thumbnail), 'status': 'offline-prepared-not-upload-authorized'})
    document = {'schema': 'youtube3.publishing-batch.v1',
                'settings': {'profile': config['profile'], 'expected_channel_id': config['channel_id'], 'privacy': 'private',
                             'category_id': '27', 'default_language': 'en', 'default_audio_language': 'en', 'notify_subscribers': False},
                'playlists': [config['playlist_id']], 'entries': entries}
    path = folder / 'batch.json'
    if path.exists() and read(path) != document:
        raise ValueError('Existing offline batch differs; inspect rather than overwrite')
    if not path.exists():
        save(path, document)
    batch_module.resolve_batch(path)
    save(folder / 'offline-manifest.json', {'prepared_at': now(), 'account_writes': False, 'upload_authorized': False,
         'native_youtube3_plan_and_queue': 'Not created; youtube3 plan needs account reads. No upload command is exposed by the existing-video release workflow.', 'entries': manifest})
    print('Offline prepared: seven canonical Asia masters, captions, screenshot thumbnails and all four links. No account access or writes.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['audit', 'migrate', 'prepare', 'plan', 'resume', 'verify'], default='audit', nargs='?')
    args = parser.parse_args()
    config = read(CONFIG)
    modules = library()
    rows, ledger = inventory(config, modules[3], modules[4])
    if args.mode == 'audit':
        print(json.dumps({'youtube3_version': version('youtube3'), 'profile': config['profile'], 'channel_id': config['channel_id'],
                          'playlist_id': config['playlist_id'], 'shared_ledger': str(ledger), 'account_access': False,
                          'known_videos': [{'entry': r['entry'], 'video_id': r['video_id'], 'queue_state': r['queue_state']} for r in rows]}, indent=2))
        return 0
    if args.mode == 'prepare':
        prepare(config, modules[3], modules[1])
        return 0
    if args.mode == 'migrate':
        with modules[4].locked(ROOT / config['operations_dir'] / 'workflow.lock'):
            migrate(config, rows, ledger)
        return 0
    operations = ROOT / config['operations_dir']
    with modules[4].locked(operations / 'workflow.lock'):
        backup(config, rows, ledger)
        return release(args.mode, config, rows, ledger, modules)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        # Never dump exception messages, request URLs, token data or tracebacks.
        print(json.dumps({'state': 'blocked', 'error_type': type(error).__name__, 'error': error_info(error)}))
        sys.exit(2)
