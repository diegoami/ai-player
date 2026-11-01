"""No-network regression tests for release scope, preservation and quota stops."""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('geoclick_youtube', Path(__file__).resolve().parents[1] / 'bin/geoclick-youtube.py')
workflow = importlib.util.module_from_spec(spec)
spec.loader.exec_module(workflow)


class WorkflowTests(unittest.TestCase):
    def test_offline_prepare_does_not_require_operational_queues(self):
        config = {'offline_series': {'id': 'asia'}}
        modules = (object(), object(), object(), object(), object(), object())
        with patch.object(workflow, 'read', return_value=config), patch.object(workflow, 'library', return_value=modules), patch.object(workflow, 'inventory', side_effect=AssertionError('must not inspect account queues')), patch.object(workflow, 'prepare') as prepare, patch('sys.argv', ['geoclick-youtube.py', 'prepare', '--series', 'africa']):
            self.assertEqual(workflow.main(), 0)
            prepare.assert_called_once_with(config, modules[3], modules[1], 'africa')

    def test_africa_offline_batch_keeps_uploads_unauthorized(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            series = {'id': 'africa', 'ledger': 'coverage.json', 'publishing_dir': 'offline'}
            config = {'offline_series': {'id': 'asia'}, 'additional_offline_series': [series], 'profile': 'owner', 'channel_id': 'channel', 'playlist_id': 'playlist', 'links': dict(playlist='playlist-url', game='game-url', geoclick_repository='geoclick-url', ai_player_repository='tools-url')}
            episodes = []
            for i in range(1, 9):
                episode = {'id': f'region-{i}', 'title': f'Region {i}', 'status': 'complete', 'video': f'episode-{i}/master.mp4', 'places': ['A']}
                episodes.append(episode)
                workflow.save(root / f'episode-{i}/verification.json', {'visualReview': 'passed'})
                (root / episode['video']).write_bytes(b'approved master')
                (root / f'episode-{i}/subtitles.en.srt').write_text('caption', encoding='utf-8')
                (root / 'offline').mkdir(exist_ok=True)
                (root / f'offline/africa-{i:02d}-region-{i}.jpg').write_bytes(b'existing screenshot')
            workflow.save(root / 'coverage.json', {'status': 'complete', 'episodes': episodes})
            batch = types.SimpleNamespace(resolve_batch=lambda path: None)
            captions = types.SimpleNamespace(check_caption=lambda path: {'sha256': workflow.digest(path)})
            with patch.object(workflow, 'ROOT', root), patch.object(workflow.subprocess, 'run', side_effect=AssertionError('thumbnail already exists')), contextlib.redirect_stdout(io.StringIO()):
                workflow.prepare(config, batch, captions, 'africa')
            result = workflow.read(root / 'offline/batch.json')
            self.assertEqual(len(result['entries']), 8)
            self.assertEqual(result['settings']['privacy'], 'private')
            self.assertFalse(result['settings']['notify_subscribers'])
            self.assertIn('8/8', result['entries'][-1]['settings']['title'])
            for entry in result['entries']:
                self.assertTrue(all(url in entry['settings']['description'] for url in config['links'].values()))
            self.assertFalse(workflow.read(root / 'offline/offline-manifest.json')['upload_authorized'])

    def test_link_is_inserted_among_links_once(self):
        original = 'Owner text\n\nPlay GeoClick: game\nSource: repo\n'
        desired = workflow.linked(original, 'playlist-url')
        self.assertEqual(desired.replace('Full playlist: playlist-url\n', ''), original)
        self.assertEqual(workflow.linked(desired, 'playlist-url'), desired)

    def test_suppressed_quota_error_is_sanitized(self):
        class Refusal(Exception):
            resp = types.SimpleNamespace(status=403)
            content = json.dumps({'error': {'errors': [{'reason': 'quotaExceeded'}]}, 'credential': 'never-output'}).encode()
        try:
            try:
                raise Refusal('sensitive URL')
            except Refusal:
                raise ValueError('library wrapper') from None
        except ValueError as error:
            self.assertEqual(workflow.error_info(error), {'http_status': 403, 'reason_codes': ['quotaExceeded']})

    def fixture(self, members=None):
        config = {'channel_id': 'channel', 'playlist_id': 'playlist', 'playlist_title': 'Title', 'links': {'playlist': 'playlist-url'}}
        baseline = {'observed_at': 'before', 'playlist': {'snippet': {'title': 'Title', 'thumbnails': {'url': 'existing-cover'}}, 'status': {'privacyStatus': 'unlisted'}},
                    'members': ['a', 'b'] if members is None else members,
                    'videos': {i: {'snippet': {'title': i, 'description': 'Original\nPlay GeoClick: game', 'tags': ['keep'], 'categoryId': '27'}, 'status': {'privacyStatus': 'unlisted', 'license': 'youtube'}} for i in ['a', 'b']}}
        final = copy.deepcopy(baseline)
        final['playlist']['status']['privacyStatus'] = 'public'
        for video in final['videos'].values():
            video['status']['privacyStatus'] = 'public'
            video['snippet']['description'] = workflow.linked(video['snippet']['description'], 'playlist-url')
        return config, baseline, final

    def test_release_verifies_order_duplicates_cover_and_other_metadata(self):
        config, baseline, final = self.fixture()
        self.assertTrue(workflow.verification(config, final, ['a', 'b'], baseline)['completed'])
        for mutation in ('order', 'duplicate', 'cover', 'title', 'description', 'license'):
            changed = copy.deepcopy(final)
            if mutation == 'order': changed['members'].reverse()
            elif mutation == 'duplicate': changed['members'].append('a')
            elif mutation == 'cover': changed['playlist']['snippet']['thumbnails'] = {}
            elif mutation == 'title': changed['videos']['a']['snippet']['title'] = 'changed'
            elif mutation == 'description': changed['videos']['a']['snippet']['description'] += ' unexpected edit'
            else: changed['videos']['a']['status']['license'] = 'changed'
            self.assertFalse(workflow.verification(config, changed, ['a', 'b'], baseline)['completed'], mutation)

    def test_queue_stop_causes_no_readback_or_publication(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            workflow.save(root / 'release.json', {'operations': [], 'videos': {'v': {'state': 'pending'}}})
            config = {'profile': 'owner', 'channel_id': 'channel', 'pending_entry': 'last', 'release_state': 'release.json', 'operations_dir': 'ops'}
            row = {'entry': 'last', 'video_id': 'v', 'queue_state': 'failed', 'queue': root / 'queue.json', 'job': {'failed_stage': 'subtitles'}}
            client = types.SimpleNamespace(signed_in_channel=lambda: {'id': 'channel'})
            calls = []
            def stopped(*args, **kwargs):
                calls.append(kwargs)
                return {'entries': {'last': {'state': 'failed'}}}
            queue = types.SimpleNamespace(load_queue=lambda p: {'entries': {'last': {'error': 'subtitles'}}}, run_queue=stopped)
            captions = types.SimpleNamespace(plan_caption=lambda: None, apply_caption=lambda: None)
            batch = types.SimpleNamespace(ensure_playlist_member=lambda: None)
            modules = (lambda *a, **k: client, captions, object(), batch, queue, None)
            with patch.object(workflow, 'ROOT', root), patch.object(workflow, 'snapshot', side_effect=AssertionError('must not read again')), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(workflow.release('resume', config, [row], root / 'ledger.json', modules), 2)
            self.assertEqual(calls, [{'resume': True, 'retry': True, 'select': ['last'], 'stage': 'subtitles'}])
            self.assertEqual(workflow.read(root / 'ops/last-run.json')['accepted_actions'], [])
            self.assertEqual(workflow.read(root / 'release.json')['operations'], [])

    def test_publish_quota_stops_without_final_readback(self):
        class Refusal(Exception):
            resp = types.SimpleNamespace(status=403)
            content = b'{"error":{"errors":[{"reason":"quotaExceeded"}]}}'
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            config, baseline, _ = self.fixture()
            config.update(profile='owner', pending_entry='a', release_state='release.json', operations_dir='ops')
            workflow.save(root / 'release.json', {'operations': [], 'videos': {}})
            rows = [{'entry': i, 'video_id': i, 'queue_state': 'completed'} for i in ['a', 'b']]
            client = types.SimpleNamespace(signed_in_channel=lambda: {'id': 'channel'})
            calls = []
            def refused(client, identity, **kwargs):
                calls.append(identity)
                raise Refusal('never print request details')
            modules = (lambda *a, **k: client, None, types.SimpleNamespace(plan_publish=refused), None, None, None)
            with patch.object(workflow, 'ROOT', root), patch.object(workflow, 'snapshot', return_value=baseline) as observed, contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(workflow.release('resume', config, rows, root / 'ledger.json', modules), 2)
            self.assertEqual(calls, ['a'])
            self.assertEqual(observed.call_count, 1)
            report = workflow.read(root / 'ops/last-run.json')
            self.assertEqual(report['accepted_actions'], [])
            self.assertEqual(report['errors'][0]['reason_codes'], ['quotaExceeded'])

    def test_successful_release_is_idempotent_and_only_updates_playlist_status(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            config, baseline, _ = self.fixture()
            config.update(profile='owner', pending_entry='a', release_state='release.json', operations_dir='ops')
            workflow.save(root / 'release.json', {'operations': [], 'videos': {}})
            live, writes = copy.deepcopy(baseline), []
            rows = [{'entry': i, 'video_id': i, 'queue_state': 'completed'} for i in ['a', 'b']]
            def update(**kwargs):
                writes.append(('playlist', kwargs))
                self.assertEqual(kwargs, {'part': 'status', 'body': {'id': 'playlist', 'status': {'privacyStatus': 'public'}}})
                live['playlist']['status']['privacyStatus'] = 'public'
                return types.SimpleNamespace(execute=lambda **kw: {})
            client = types.SimpleNamespace(signed_in_channel=lambda: {'id': 'channel'}, youtube=types.SimpleNamespace(playlists=lambda: types.SimpleNamespace(update=update)))
            def plan(client, identity, description, privacy):
                return {'video_id': identity, 'description': description, 'privacy': privacy, 'errors': [],
                        'changes': {'description': (live['videos'][identity]['snippet']['description'], description)}}
            def apply(client, planned):
                writes.append(('video', planned['video_id']))
                v = live['videos'][planned['video_id']]
                v['snippet']['description'] = planned['description']
                v['status']['privacyStatus'] = planned['privacy']
            modules = (lambda *a, **k: client, None, types.SimpleNamespace(plan_publish=plan, apply_publish=apply), None, None, None)
            with patch.object(workflow, 'ROOT', root), patch.object(workflow, 'snapshot', side_effect=lambda *a: copy.deepcopy(live)), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(workflow.release('resume', config, rows, root / 'ledger.json', modules), 0)
                first_writes = copy.deepcopy(writes)
                self.assertEqual(workflow.release('resume', config, rows, root / 'ledger.json', modules), 0)
                self.assertEqual(writes, first_writes)
            self.assertEqual([w[1] for w in writes if w[0] == 'video'], ['a', 'b'])
            self.assertTrue(workflow.read(root / 'ops/verification.json')['completed'])


if __name__ == '__main__':
    unittest.main()
