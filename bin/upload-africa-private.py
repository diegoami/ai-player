"""Upload pending Africa masters only; youtube3 owns uploads and checkpoints."""
import importlib.util
from pathlib import Path
import sys

spec = importlib.util.spec_from_file_location('workflow', Path(__file__).with_name('geoclick-youtube.py'))
w = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w)


def main():
    folder = w.ROOT / 'rendered/africa-eight-20261102/youtube-publishing'
    path = folder / 'queue.json'
    Client, captions, publish, batch, queue, secrets = w.library()
    config = w.read(w.CONFIG)
    production = w.read(w.ROOT / 'src/lessons/africa-coverage.json')
    checkpoint = queue.load_queue(path)
    if (checkpoint['plan']['channel_id'], checkpoint['plan']['profile']) != (config['channel_id'], config['profile']):
        raise ValueError('Destination mismatch')
    expected = [str((w.ROOT / e['video']).resolve()) for e in production['episodes']]
    actual = [str(Path(e['job']['upload']['file']['path']).resolve()) for e in checkpoint['plan']['entries']]
    if production['status'] != 'complete' or len(expected) != 8 or actual != expected:
        raise ValueError('Canonical master mismatch')
    if any(e['job']['upload']['body']['status']['privacyStatus'] != 'private' for e in checkpoint['plan']['entries']):
        raise ValueError('Upload-only mode requires private visibility')
    run = {'started_at': w.now(), 'policy': 'private uploads only; native pause after accepted upload; all finishing stages deferred', 'uploaded': [], 'errors': []}
    w.save(folder / 'private-upload-run.json', run)
    client = Client(secrets, profile=config['profile'])
    original = queue.jobs.apply_publishing_job

    def upload_then_pause(*args, **kwargs):
        after = kwargs.get('after_stage')
        before = kwargs.get('before_stage')

        def upload_only(stage, job):
            return stage == 'upload' and (before is None or before(stage, job))

        def checkpoint_and_pause(stage, job):
            if after:
                after(stage, job)  # Native queue records the ID and shared ledger first.
            if stage == 'upload':
                queue.request_pause(path)

        kwargs['after_stage'] = checkpoint_and_pause
        kwargs['before_stage'] = upload_only
        return original(*args, **kwargs)

    queue.jobs.apply_publishing_job = upload_then_pause
    try:
        for entry in checkpoint['plan']['entries']:
            identity = entry['id']
            current = queue.load_queue(path)['entries'][identity]
            if current['video_id']:
                continue
            if current['state'] != 'pending':
                raise ValueError('Non-pending upload needs native recovery')
            with w.observe_errors([(queue.jobs, 'apply_publishing_job')], run['errors']):
                result = queue.run_queue(client, path, resume=True, select=[identity])
            accepted = result['entries'][identity]
            if run['errors'] or not accepted['video_id'] or accepted['state'] != 'paused':
                run.update(state='stopped', finished_at=w.now())
                w.save(folder / 'private-upload-run.json', run)
                print({'state': 'stopped', 'entry': identity, 'video_id': accepted['video_id'], 'errors': run['errors']}, flush=True)
                return 2
            run['uploaded'].append({'entry': identity, 'video_id': accepted['video_id']})
            w.save(folder / 'private-upload-run.json', run)
            print({'entry': identity, 'video_id': accepted['video_id'], 'state': 'uploaded-private-finishing-deferred'}, flush=True)
    finally:
        queue.jobs.apply_publishing_job = original
    run.update(state='private-uploads-complete', finished_at=w.now())
    w.save(folder / 'private-upload-run.json', run)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print({'state': 'stopped', 'error_type': type(error).__name__, 'error': w.error_info(error)})
        sys.exit(2)
