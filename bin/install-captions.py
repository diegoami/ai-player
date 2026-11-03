"""Install the deferred English caption tracks on the already published videos.

ai-player owns scope, order and the local ledger of accepted caption IDs.
Installed youtube3 2.10.0 owns every account write: its own caption plan,
its own per-video upload, its own duplicate check. Nothing here reimplements
caption insertion, OAuth or recovery, and no native checkpoint or queue is
read for progress or rewritten.

The tracks are the exact approved bytes tracked in subtitles/, verified
against subtitles/manifest.json before anything is sent. Each video keeps its
current visibility, description, thumbnail and playlist seat; only a caption
track is added. A quota refusal stops the run immediately, and the accepted
IDs are recorded so the next run continues exactly where it stopped.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import sys

spec = importlib.util.spec_from_file_location('workflow', Path(__file__).with_name('geoclick-youtube.py'))
w = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w)

MANIFEST = w.ROOT / 'subtitles' / 'manifest.json'
LEDGER = w.ROOT / 'rendered' / 'youtube-publishing' / 'caption-installs.json'
QUOTA_REASONS = {'quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded', 'userRateLimitExceeded'}


def captioned_already():
    """Video IDs whose own native job checkpoints record a successful caption."""
    found = set()
    for queue_path in w.ROOT.glob('rendered/*/youtube-publishing/queue*.json'):
        jobs = Path(str(queue_path) + '.jobs')
        if not jobs.is_dir():
            continue
        for job_path in jobs.glob('*.json'):
            job = w.read(job_path)
            if job.get('stages', {}).get('subtitles') == 'successful' and job.get('video_id'):
                found.add(job['video_id'])
    return found


def targets(series_id=None):
    """The deferred tracks, in playlist order, from the tracked manifest."""
    manifest = w.read(MANIFEST)
    done = captioned_already()
    rows = []
    for episode in manifest['episodes']:
        video_id = episode.get('youtube_video_id')
        if not video_id or video_id in done:
            continue
        if series_id and episode['series'] != series_id:
            continue
        caption = next((row for row in episode['files'] if row['path'].endswith('.srt')), None)
        if caption is None:
            raise ValueError(f"No SRT backup for {episode['series']} episode {episode['episode']}")
        rows.append({'series': episode['series'], 'episode': episode['episode'], 'id': episode['id'],
                     'video_id': video_id, 'file': caption['path'], 'sha256': caption['sha256'],
                     'bytes': caption['bytes']})
    return rows


def accepted():
    """The local ledger of caption IDs already accepted for a video."""
    if LEDGER.exists():
        return {row['video_id']: row for row in w.read(LEDGER).get('installed', [])}
    return {}


def save_ledger(rows, state, stopped):
    w.save(LEDGER, {'schema': 'ai-player.caption-installs.v1', 'updated_at': w.now(), 'state': state,
                    'stopped': stopped, 'installed': list(rows.values())})


def quota_refused(error):
    """True when the refusal is the exhausted quota bucket, not a bad request."""
    seen, status, codes = set(), None, set()
    while error is not None and id(error) not in seen:
        seen.add(id(error))
        if hasattr(error, 'content') and hasattr(error, 'resp'):
            status = getattr(error.resp, 'status', status)
            try:
                codes.update(row.get('reason', '') for row in
                             json.loads(error.content).get('error', {}).get('errors', []))
            except (ValueError, TypeError, AttributeError):
                pass
        error = error.__cause__ or error.__context__
    return status == 403 and bool(codes & QUOTA_REASONS)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--series', help='Restrict to one series id from the manifest')
    parser.add_argument('--limit', type=int, default=0, help='Stop after this many installs in this run')
    parser.add_argument('--dry-run', action='store_true', help='List the tracks and verify their bytes offline')
    args = parser.parse_args()

    rows = targets(args.series)
    ledger = accepted()
    pending = [row for row in rows if row['video_id'] not in ledger]
    if args.dry_run:
        print(json.dumps({'pending': len(pending), 'already_installed': len(rows) - len(pending),
                          'targets': [{'series': r['series'], 'episode': r['episode'], 'video_id': r['video_id'],
                                       'file': r['file']} for r in pending]}, indent=2))
        return 0

    config = w.read(w.CONFIG)
    Client, captions, publish, batch, queue, secrets = w.library()
    client = Client(secrets, profile=config['profile'])
    if client.signed_in_channel()['id'] != config['channel_id']:
        raise ValueError('Signed-in channel mismatch')

    state, stopped, installed = 'completed', None, dict(ledger)
    done_this_run = 0
    for row in pending:
        if args.limit and done_this_run >= args.limit:
            break
        path = w.ROOT / row['file']
        if not path.is_file():
            raise ValueError(f"Missing tracked caption {row['file']}")
        digest = w.digest(path)
        if digest != row['sha256'] or path.stat().st_size != row['bytes']:
            raise ValueError(f"Tracked caption bytes changed: {row['file']}")
        captions.check_caption(path)
        try:
            result = client.upload_caption(row['video_id'], str(path), language='en', name='English',
                                           draft=False, apply=True)
            caption_id = result['result']['id']
        except ValueError as error:
            if 'already exists' not in str(error):
                raise
            tracks = [track for track in client.list_captions(row['video_id'])
                      if track['snippet'].get('language') == 'en' and track['snippet'].get('name') == 'English']
            if not tracks:
                raise
            caption_id = tracks[0]['id']
        except Exception as error:
            outcome = getattr(error, 'outcome', None)
            if outcome == 'unknown':
                tracks = [track for track in client.list_captions(row['video_id'])
                          if track['snippet'].get('language') == 'en' and track['snippet'].get('name') == 'English']
                if tracks:
                    installed[row['video_id']] = {**row, 'caption_id': tracks[0]['id'], 'state': 'accepted-after-uncertain-write'}
                    save_ledger(installed, state, stopped)
                    continue
                stopped = {'video_id': row['video_id'], 'reason': 'uncertain_write_not_found', 'inspect_before_retrying': True}
                state = 'blocked'
                break
            stopped = {'video_id': row['video_id'], 'reason': 'quota_exhausted' if quota_refused(error) else 'caption_write_failed',
                       'http_status': w.error_info(error).get('http_status')}
            state = 'blocked'
            break
        installed[row['video_id']] = {**row, 'caption_id': caption_id, 'state': 'installed',
                                      'installed_at': w.now()}
        done_this_run += 1
        save_ledger(installed, state, stopped)
        print(json.dumps({'video_id': row['video_id'], 'series': row['series'], 'episode': row['episode'],
                          'caption_id': caption_id}), flush=True)

    save_ledger(installed, state, stopped)
    remaining = [row['video_id'] for row in rows if row['video_id'] not in installed]
    print(json.dumps({'state': state, 'installed_this_run': len(installed) - len(ledger),
                      'installed_total': len(installed), 'remaining': len(remaining),
                      'remaining_video_ids': remaining, 'stopped': stopped}, indent=2))
    return 0 if state == 'completed' else 2


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print({'state': 'blocked', 'error_type': type(error).__name__, 'error': w.error_info(error)})
        sys.exit(2)
