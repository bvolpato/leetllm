#!/usr/bin/env -S uv run --script
# /// script
# requires-python = "==3.12.*"
# dependencies = ["numpy==2.2.6"]
# ///
"""Run the article's exact experiment fence and export its figure inputs."""
import csv
import hashlib
import io
import json
import platform
import re
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parent
article = (root.parent / 'content.md').read_text()
blocks = re.findall(r'```python title="reward_shaping_study.py"\n(.*?)\n```', article, re.S)
if len(blocks) != 1:
    raise ValueError('Expected exactly one named experiment fence')
source = blocks[0]
namespace = {'__name__': '__article_experiment__'}
exec(compile(source, 'reward_shaping_study.py', 'exec'), namespace)

columns = ['seed', 'early_sparse', 'early_shaped', 'final_sparse', 'final_shaped', 'steps_sparse', 'steps_shaped']
rows = [dict(zip(columns, row)) for row in namespace['rows']]
stream = io.StringIO(newline='')
writer = csv.DictWriter(stream, fieldnames=columns, lineterminator='\n')
writer.writeheader()
writer.writerows(rows)
row_bytes = stream.getvalue().encode()
(root / 'primary_seed_rows.csv').write_bytes(row_bytes)

summary = {
    'early_mean': float(namespace['early_delta'].mean()),
    'early_low': float(namespace['interval_low']),
    'early_high': float(namespace['interval_high']),
    'final_mean': float(namespace['final_delta'].mean()),
    'final_low': float(namespace['final_low']),
    'final_high': float(namespace['final_high']),
    'unpaired_low': float(namespace['unpaired_low']),
    'unpaired_high': float(namespace['unpaired_high']),
    'regressed': int(np.sum(namespace['early_delta'] < 0)),
    'supported': bool(namespace['supported']),
}
result = {'rows': rows, 'summary': summary}
result_bytes = (json.dumps(result, indent=2, allow_nan=False) + '\n').encode()
(root / 'study_results.json').write_bytes(result_bytes)
config = {key: namespace[key] for key in ['N_STATES', 'GOAL', 'GAMMA', 'ALPHA', 'EPSILON', 'TRAIN_EPISODES', 'MAX_STEPS', 'EARLY_EPISODES', 'EVAL_EPISODES', 'SLIP_PROBABILITY', 'BOOTSTRAP_REPLICATES', 'SEEDS']}
manifest = {
    'status': 'worked-run-not-preregistered',
    'experiment_source_sha256': hashlib.sha256(source.encode()).hexdigest(),
    'exporter_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'config': config,
    'config_sha256': hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest(),
    'python': platform.python_version(),
    'numpy': np.__version__,
    'os': platform.system(),
    'architecture': platform.machine(),
    'outputs': {
        'primary_seed_rows.csv': hashlib.sha256(row_bytes).hexdigest(),
        'study_results.json': hashlib.sha256(result_bytes).hexdigest(),
    },
}
(root / 'artifact_manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('Exported actual seed rows, figure data, and artifact manifest')
