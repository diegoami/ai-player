"""Retire the replaced videos: verify each ID is ours, delete it, and keep a
ledger of what was removed. youtube3 2.10.0 owns OAuth and the client; the
delete endpoint is not wrapped by the library, so this goes through the
client's own YouTube service exactly as the publishing flow goes through it
for reads and playlist updates. A deletion is refused for any video that is
not on this channel, and the run records every accepted deletion before the
next is attempted, so an interrupted run can be audited and resumed."""
import argparse
import importlib.util
import json
from pathlib import Path
import sys

spec = importlib.util.spec_from_file_location('workflow', Path(__file__).with_name('geoclick-youtube.py'))
w = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w)

LEDGER = w.ROOT / 'rendered' / 'youtube-publishing' / 'retired-videos.json'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ids', nargs='+', required=True, help='Video IDs to retire')
    parser.add_argument('--reason', required=True, help='Why each video is being retired')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    config = w.read(w.CONFIG)
    Client, captions, publish, batch, queue, secrets = w.library()
    client = Client(secrets, profile=config['profile'])
    if client.signed_in_channel()['id'] != config['channel_id']:
        raise ValueError('Signed-in channel mismatch')

    retired = {}
    if LEDGER.exists():
        for row in w.read(LEDGER).get('retired', []):
            retired[row['video_id']] = row

    actions = []
    for video_id in args.ids:
        if video_id in retired:
            actions.append({'video_id': video_id, 'state': 'already-retired'})
            continue
        details = client.video_details([video_id]).get(video_id)
        if details is None:
            actions.append({'video_id': video_id, 'state': 'not-found'})
            continue
        if details.get('snippet', {}).get('channelId') != config['channel_id']:
            actions.append({'video_id': video_id, 'state': 'refused-other-channel'})
            continue
        if args.dry_run:
            actions.append({'video_id': video_id, 'state': 'would-delete',
                            'title': details['snippet'].get('title')})
            continue
        client.youtube.videos().delete(id=video_id).execute(num_retries=0)
        row = {'video_id': video_id, 'title': details['snippet'].get('title'),
               'reason': args.reason, 'retired_at': w.now()}
        retired[video_id] = row
        actions.append({'video_id': video_id, 'state': 'deleted'})
        w.save(LEDGER, {'schema': 'ai-player.retired-videos.v1', 'retired': list(retired.values())})
        print(json.dumps(row), flush=True)

    print(json.dumps({'actions': actions, 'retired_total': len(retired)}, indent=2))
    blocked = [a for a in actions if a['state'] in ('refused-other-channel', 'not-found')]
    return 1 if blocked and args.dry_run is False and len(blocked) == len(actions) else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print({'state': 'blocked', 'error_type': type(error).__name__, 'error': w.error_info(error)})
        sys.exit(2)
