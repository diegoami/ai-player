"""Upload an approved series through youtube3's own plan/run flow.

The owner authorizes the upload. The prepared offline batch keeps its
subtitles; the derived upload batch omits them when captions are deferred and
publishes with the requested visibility. The plan, the queue, the checkpoints
and the shared per-channel upload ledger all belong to installed youtube3
2.10.0: nothing here reimplements uploads, OAuth, captions or recovery.
"""
import argparse
import importlib.util
from pathlib import Path
import sys

spec = importlib.util.spec_from_file_location('workflow', Path(__file__).with_name('geoclick-youtube.py'))
w = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w)

AFRICA_QUEUE = 'rendered/africa-eight-20261102/youtube-publishing/queue.json'


def series_entry(config, series_id):
    candidates = [config['offline_series'], *config.get('additional_offline_series', [])]
    matches = [s for s in candidates if s['id'] == series_id]
    if len(matches) != 1:
        raise ValueError('Unknown series')
    return matches[0]


def upload_batch(config, series_id, privacy):
    """The prepared batch, without caption rows, publishing at the chosen visibility."""
    entry = series_entry(config, series_id)
    folder = w.ROOT / entry['publishing_dir']
    source = w.read(folder / 'batch.json')
    production = w.read(w.ROOT / entry['ledger'])
    if production['status'] != 'complete' or any(e['status'] != 'complete' for e in production['episodes']):
        raise ValueError('Production ledger is not complete')
    expected = [str((w.ROOT / episode['video']).resolve()) for episode in production['episodes']]
    document = {'schema': source['schema'], 'settings': dict(source['settings']), 'playlists': list(source['playlists']),
                'entries': []}
    document['settings']['privacy'] = privacy
    for row in source['entries']:
        settings = dict(row['settings'])
        settings.pop('subtitles', None)
        document['entries'].append({'id': row['id'], 'file': row['file'], 'episode': row['episode'],
                                    'settings': settings})
    actual = [str(Path(row['file']).resolve()) for row in document['entries']]
    if actual != expected:
        raise ValueError('Upload batch is not the canonical series masters')
    for row in document['entries']:
        if not Path(row['file']).is_file():
            raise ValueError('Missing approved master')
        if not Path(row['settings']['thumbnail']).is_file():
            raise ValueError('Missing approved thumbnail')
    return folder, document


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--series', required=True)
    parser.add_argument('--privacy', choices=('private', 'unlisted', 'public'), default='unlisted')
    args = parser.parse_args()

    config = w.read(w.CONFIG)
    Client, captions, publish, batch, queue, secrets = w.library()
    folder, document = upload_batch(config, args.series, args.privacy)
    batch_path = folder / 'batch-upload.json'
    if batch_path.exists():
        if w.read(batch_path) != document:
            raise ValueError('Existing upload batch differs; inspect rather than overwrite')
    else:
        w.save(batch_path, document)

    plan_path = folder / 'plan-upload.json'
    queue_path = folder / 'queue-upload.json'
    ledger = w.read(w.ROOT / AFRICA_QUEUE)['ledger']
    record = {'started_at': w.now(), 'policy': f'authorized {args.series} upload; captions deferred; publish {args.privacy}',
              'batch': str(batch_path), 'plan': str(plan_path), 'queue': str(queue_path),
              'ledger': ledger, 'uploaded': [], 'errors': []}

    client = Client(secrets, profile=config['profile'])
    if client.signed_in_channel()['id'] != config['channel_id']:
        raise ValueError('Signed-in channel mismatch')

    entries = batch.resolve_batch(batch_path)
    plan = batch.plan_batch(client, entries)
    batch.save_plan(plan, plan_path)
    if queue_path.exists():
        raise FileExistsError('Upload queue already exists; resume the original queue')
    queue.initialize_queue(plan, queue_path, ledger_path=ledger)

    with w.observe_errors([(queue.jobs, 'apply_publishing_job')], record['errors']):
        result = queue.run_queue(client, queue_path, resume=True)
    for identity, row in result['entries'].items():
        record['uploaded'].append({'entry': identity, 'video_id': row['video_id'], 'state': row['state'],
                                   'playlists': row['playlists']})
    record['state'] = result['state']
    record['finished_at'] = w.now()
    w.save(folder / 'upload-run.json', record)
    print({'state': record['state'], 'errors': record['errors'], 'entries': record['uploaded']}, flush=True)
    return 0 if result['state'] == 'completed' else 2


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print({'state': 'blocked', 'error_type': type(error).__name__, 'error': w.error_info(error)})
        sys.exit(2)
