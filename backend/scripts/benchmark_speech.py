"""Run the same production queue against both engines on the target Mac."""
import argparse
import json
from pathlib import Path
import sys
import tempfile
import time

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from voice_service.service import NarrationService
from voice_service.api import GenerateRequest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--audio', required=True, type=Path)
    parser.add_argument('--transcript', required=True)
    parser.add_argument('--text', required=True)
    parser.add_argument('--engines', nargs='+', default=['omnivoice'], choices=['omnivoice', 'pocket'])
    args = parser.parse_args()
    root = Path(tempfile.mkdtemp(prefix='ppt-speech-benchmark-'))
    service = NarrationService(root)
    try:
        voice = service.create_profile('Benchmark', args.transcript, args.audio.resolve())
        print(f'Output directory: {root}', flush=True)
        for engine in args.engines:
            start = time.monotonic()
            request = GenerateRequest(voice_id=voice['id'], engine=engine, script=args.text)
            job = service.generate(request)
            while True:
                job = service.get_job(job['id'])
                if job['status'] in {'complete', 'failed', 'cancelled'}:
                    break
                time.sleep(.5)
            seconds = time.monotonic() - start
            result = {'engine': engine, 'elapsed_seconds': round(seconds, 2), 'status': job['status']}
            if job['status'] == 'complete':
                result['audio_seconds'] = job['result']['duration_ms'] / 1000
                result['audio_path'] = str(service.asset(job['result']['asset_id'], 'narration.wav'))
                result['aligned_words'] = len(job['result']['captions'])
                result['stage_metrics'] = job['result'].get('metrics', {})
            else:
                result['error'] = job.get('error')
            print(json.dumps(result, indent=2), flush=True)
    finally:
        service.close()


if __name__ == '__main__':
    main()
