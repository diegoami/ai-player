"""No-network regression tests for the release read and the caption installer."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


publisher = load('publish_videos', ROOT / 'bin/publish-videos.py')
installer = load('install_captions', ROOT / 'bin/install-captions.py')


class ReleaseReadTests(unittest.TestCase):
    def test_video_read_asks_in_pages_of_fifty(self):
        """The API accepts at most 50 IDs per videos.list call."""
        calls = []

        def videos():
            def list_request(**kwargs):
                calls.append(kwargs['id'])
                ids = kwargs['id'].split(',')
                items = [{'id': i, 'snippet': {'channelId': 'channel'}, 'status': {}} for i in ids]
                return types.SimpleNamespace(execute=lambda **kw: {'items': items})
            return types.SimpleNamespace(list=list_request)

        client = types.SimpleNamespace(youtube=types.SimpleNamespace(videos=videos))
        ids = [f'video-{i:02d}' for i in range(53)]
        found = publisher.read_videos(client, {'channel_id': 'channel'}, ids)
        self.assertEqual([call.count(',') for call in calls], [49, 2])
        self.assertEqual(set(found), set(ids))

    def test_video_read_rejects_a_missing_video(self):
        def videos():
            return types.SimpleNamespace(list=lambda **kwargs: types.SimpleNamespace(
                execute=lambda **kw: {'items': []}))
        client = types.SimpleNamespace(youtube=types.SimpleNamespace(videos=videos))
        with self.assertRaises(ValueError):
            publisher.read_videos(client, {'channel_id': 'channel'}, ['a'])


class CaptionTargetTests(unittest.TestCase):
    def manifest(self, root):
        path = root / 'manifest.json'
        path.write_text(json.dumps({'episodes': [
            {'series': 'europe', 'episode': 6, 'id': 'baltic', 'youtube_video_id': 'keep',
             'files': [{'path': 'subtitles/europe/baltic/subtitles.en.srt', 'bytes': 1, 'sha256': 'x'}]},
            {'series': 'asia', 'episode': 1, 'id': 'levant', 'youtube_video_id': 'skip',
             'files': [{'path': 'subtitles/asia/levant/subtitles.en.srt', 'bytes': 1, 'sha256': 'x'}]},
            {'series': 'oceania-capitals', 'episode': 1, 'id': 'palau', 'youtube_video_id': None,
             'files': [{'path': 'subtitles/oceania-capitals/palau/subtitles.en.srt', 'bytes': 1, 'sha256': 'x'}]},
        ]}), encoding='utf-8')
        return path

    def test_targets_skip_captions_that_are_already_installed(self):
        with tempfile.TemporaryDirectory() as folder:
            path = self.manifest(Path(folder))
            with patch.object(installer, 'MANIFEST', path), patch.object(installer, 'captioned_already', return_value={'skip'}):
                rows = installer.targets()
            self.assertEqual([row['video_id'] for row in rows], ['keep'])

    def test_every_published_video_is_listed_once(self):
        manifest = installer.w.read(installer.MANIFEST)
        published = [episode['youtube_video_id'] for episode in manifest['episodes'] if episode.get('youtube_video_id')]
        config = installer.w.read(installer.w.CONFIG)
        known = [video_id
                 for series in [*config['series'], config['offline_series'], *config.get('additional_offline_series', [])]
                 for video_id in (series.get('video_ids') or [])]
        self.assertEqual(sorted(published), sorted(known))
        self.assertEqual(len(set(published)), len(published))
        rows = installer.targets()
        self.assertEqual(len(rows), len(published) - len(installer.captioned_already()))
        self.assertEqual(len({row['video_id'] for row in rows}), len(rows))


class CaptionInstallTests(unittest.TestCase):
    def test_quota_refusal_stops_the_run_and_records_progress(self):
        class Refusal(Exception):
            resp = types.SimpleNamespace(status=403)
            content = b'{"error":{"errors":[{"reason":"quotaExceeded"}]}}'

        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            caption = root / 'subtitles.en.srt'
            caption.write_text('1\n00:00:00,000 --> 00:00:02,000\nHello\n', encoding='utf-8')
            digest = installer.w.digest(caption)
            manifest = root / 'manifest.json'
            manifest.write_text(json.dumps({'episodes': [
                {'series': 'europe', 'episode': 6, 'id': 'baltic', 'youtube_video_id': 'first',
                 'files': [{'path': 'subtitles.en.srt', 'bytes': caption.stat().st_size, 'sha256': digest}]},
                {'series': 'asia', 'episode': 1, 'id': 'levant', 'youtube_video_id': 'second',
                 'files': [{'path': 'subtitles.en.srt', 'bytes': caption.stat().st_size, 'sha256': digest}]},
            ]}), encoding='utf-8')
            config = root / 'config.json'
            config.write_text(json.dumps({'profile': 'owner', 'channel_id': 'channel'}), encoding='utf-8')
            seen = []

            def upload(video_id, path, **kwargs):
                seen.append(video_id)
                if len(seen) > 1:
                    raise Refusal('quota')
                return {'result': {'id': 'caption-1'}}

            client = types.SimpleNamespace(signed_in_channel=lambda: {'id': 'channel'}, upload_caption=upload)
            captions = types.SimpleNamespace(check_caption=lambda path: {'sha256': digest})
            modules = (lambda *a, **k: client, captions, None, None, None, None)
            with patch.object(installer, 'MANIFEST', manifest), patch.object(installer, 'LEDGER', root / 'ledger.json'), \
                 patch.object(installer, 'captioned_already', return_value=set()), \
                 patch.object(installer.w, 'ROOT', root), patch.object(installer.w, 'CONFIG', config), \
                 patch.object(installer.w, 'library', return_value=modules), \
                 patch('sys.argv', ['install-captions.py']), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(installer.main(), 2)
            ledger = installer.w.read(root / 'ledger.json')
            self.assertEqual(ledger['state'], 'blocked')
            self.assertEqual(ledger['stopped']['reason'], 'quota_exhausted')
            self.assertEqual(ledger['stopped']['video_id'], 'second')
            self.assertEqual([row['video_id'] for row in ledger['installed']], ['first'])
            self.assertEqual(ledger['installed'][0]['caption_id'], 'caption-1')

    def test_changed_caption_bytes_are_refused(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            caption = root / 'subtitles.en.srt'
            caption.write_text('1\n00:00:00,000 --> 00:00:02,000\nHello\n', encoding='utf-8')
            manifest = root / 'manifest.json'
            manifest.write_text(json.dumps({'episodes': [
                {'series': 'europe', 'episode': 6, 'id': 'baltic', 'youtube_video_id': 'first',
                 'files': [{'path': 'subtitles.en.srt', 'bytes': 999, 'sha256': 'not-the-file'}]},
            ]}), encoding='utf-8')
            config = root / 'config.json'
            config.write_text(json.dumps({'profile': 'owner', 'channel_id': 'channel'}), encoding='utf-8')
            client = types.SimpleNamespace(signed_in_channel=lambda: {'id': 'channel'},
                                           upload_caption=lambda *a, **k: self.fail('must not upload changed bytes'))
            captions = types.SimpleNamespace(check_caption=lambda path: {'sha256': 'x'})
            modules = (lambda *a, **k: client, captions, None, None, None, None)
            with patch.object(installer, 'MANIFEST', manifest), patch.object(installer, 'LEDGER', root / 'ledger.json'), \
                 patch.object(installer, 'captioned_already', return_value=set()), \
                 patch.object(installer.w, 'ROOT', root), patch.object(installer.w, 'CONFIG', config), \
                 patch.object(installer.w, 'library', return_value=modules), \
                 patch('sys.argv', ['install-captions.py']), contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaises(ValueError):
                    installer.main()


if __name__ == '__main__':
    unittest.main()
