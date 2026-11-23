// The article's shell heredoc puts a newline after the last row.
const committedJsonl = `{"prompt": "Access request 101 status?", "expected": "approved", "prediction": "approved"}
{"prompt": "Access request 102 status?", "expected": "blocked", "prediction": "escalated"}
{"prompt": "Access request 103 status?", "expected": "restored", "prediction": "restored"}
`;
export const CHANGED_FIXTURE_JSONL = committedJsonl.replace(
  '"prediction": "escalated"',
  '"prediction": "blocked"',
);

function displayRows(jsonl) {
  return Object.freeze(jsonl.trimEnd().split('\n').map((line) => {
    const row = JSON.parse(line);
    const [, request] = /^Access request (\d+) status\?$/.exec(row.prompt);
    return { id: Number(request), ...row };
  }));
}

export const FIXTURE = displayRows(committedJsonl);
export const CHANGED_FIXTURE = displayRows(CHANGED_FIXTURE_JSONL);
export const OBSERVED_IMAGE_ID =
  'sha256:2304b977b6a5b1be1f742de38de5a5b1ef271570cb377f2d66893867b21f3e73';
export const MISSING_FIXTURE_ERROR =
  'ERROR: assets/access_requests.jsonl missing; commit the eval fixture';
export const PROJECT_FILES = Object.freeze([
  {
    path: 'Dockerfile',
    keep: true,
    copy: false,
  },
  {
    path: 'requirements.txt',
    keep: true,
    copy: true,
  },
  {
    path: 'scripts/score_access_requests.py',
    keep: true,
    copy: true,
  },
  {
    path: 'eval/access_requests.jsonl',
    keep: true,
    copy: true,
  },
  {
    path: '.env',
    keep: false,
    copy: false,
  },
  {
    path: '.venv/',
    keep: false,
    copy: false,
  },
  {
    path: 'models/example.bin',
    keep: false,
    copy: false,
  },
]);
export const FRESH_FIXTURE = Object.freeze(
  Array.from({ length: 7 }, (_, i) => {
    const expected = i % 2 ? 'blocked' : 'approved';
    return {
      id: 301 + i,
      prompt: `Access request ${301 + i} status?`,
      expected,
      prediction: i < 5 ? expected : 'restored',
    };
  }),
);
// The exercise sets this target before either run opens its input.
export const FRESH_EXPECTED_COUNTS = Object.freeze({ matches: 5, total: 7 });
export const FRESH_MOUNTED = Object.freeze(
  FRESH_FIXTURE.map((row) => (row.id === 305 ? { ...row, prediction: 'escalated' } : { ...row })),
);
export const FRESH_REPAIRED = Object.freeze(
  FRESH_MOUNTED.map((row) =>
    row.id === 305
      ? {
          ...row,
          prediction: FRESH_FIXTURE.find((committed) => committed.id === row.id).prediction,
        }
      : row,
  ),
);
