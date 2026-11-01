"""Copy exact approved caption bytes to Git; no account access or media copies."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from youtube3.captions import check_caption

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--series', choices=['usa', 'europe', 'asia', 'africa'], required=True)
    args = parser.parse_args()
    config = json.loads((ROOT / 'config/geoclick-youtube.json').read_text(encoding='utf-8'))
    candidates = [*config['series'], config['offline_series'], *config.get('additional_offline_series', [])]
    series = next(s for s in candidates if s['id'] == args.series)
    ledger = json.loads((ROOT / series['ledger']).read_text(encoding='utf-8'))
    if ledger['status'] != 'complete' or any(e['status'] != 'complete' for e in ledger['episodes']):
        raise ValueError('Only a completed approved series can be backed up')
    destination = ROOT / 'subtitles/manifest.json'
    manifest = json.loads(destination.read_text(encoding='utf-8'))
    entries, pending = [], []
    for number, episode in enumerate(ledger['episodes'], 1):
        source_dir = (ROOT / episode['video']).parent
        report = json.loads((source_dir / 'verification.json').read_text(encoding='utf-8'))
        if report['visualReview'] != 'passed':
            raise ValueError('Visual review is pending')
        files = []
        for extension in ['srt', 'vtt']:
            source = source_dir / f'subtitles.en.{extension}'
            target = ROOT / 'subtitles' / args.series / f'{number:02d}-{episode["id"]}' / source.name
            checked = check_caption(source)
            if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != checked['sha256']:
                raise ValueError('Existing caption backup differs; review before replacing')
            pending.append((source, target))
            files.append({'path': target.relative_to(ROOT).as_posix(), 'source': source.relative_to(ROOT).as_posix(),
                          'bytes': checked['bytes'], 'sha256': checked['sha256']})
        entries.append({'series': args.series, 'episode': number, 'id': episode['id'], 'ledger': series['ledger'],
                        'master': episode['video'], 'language': 'en',
                        'youtube_video_id': series.get('video_ids', [None] * len(ledger['episodes']))[number - 1] or episode.get('youtubeVideoId'), 'files': files})
    # Validate every source and existing destination before copying anything.
    for source, target in pending:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        if check_caption(source)['sha256'] != check_caption(target)['sha256']:
            raise ValueError('Backup fingerprint mismatch')
    retained = [e for e in manifest['episodes'] if e['series'] != args.series]
    order = {s['id']: i for i, s in enumerate(candidates)}
    manifest['episodes'] = sorted([*retained, *entries], key=lambda e: (order[e['series']], e['episode']))
    manifest['edition'] = 'November 2026 regional lessons'
    manifest['note'] = 'Exact caption bytes from approved canonical masters. Video IDs indicate known uploads, not visibility or caption installation. Entries without video IDs remain offline; no upload authorization is implied.'
    destination.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Backed up and validated {len(pending)} {args.series} subtitle files; other series retained.')


if __name__ == '__main__':
    main()
