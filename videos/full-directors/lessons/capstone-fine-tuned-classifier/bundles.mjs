import { C, beat, cue, mix } from './studio.mjs';
import { fallback } from '../../../films/capstone-fine-tuned-classifier/model.mjs';

export const policy = Object.freeze({
  bundle_version: 'intake_bundle_v2',
  label_version: 'escalation-policy-v1',
  gate_receipt_version: 'access-intake-gate-v1',
  split_manifest_version: 'access-intake-split-2026-05',
  tokenizer_version: 'encoder_v1',
  model_version: 'encoder_v1',
  input_policy_version: 'access-intake-input-v1',
  max_length: 256,
  threshold: 0.35,
  fallback_route: 'human_review_now',
});
export function policyMatches(candidate) {
  return (
    candidate !== null &&
    Object.keys(candidate).length === Object.keys(policy).length &&
    Object.entries(policy).every(
      ([field, value]) => Object.hasOwn(candidate, field) && candidate[field] === value,
    )
  );
}
export const route = (input, bundle = policy) =>
  policyMatches(bundle) ? fallback(input.score, input.count, input.text) : 'Human fallback';
export const inputs = [
  { name: 'Policy question', text: 'Where is the access policy?', count: 8, score: 0.18 },
  { name: 'Blank text', text: '', count: 2, score: 0.04 },
  { name: 'Unavailable', text: 'Where is the guide?', count: 9, score: null },
  { name: 'Nonfinite', text: 'Malformed score', count: 5, score: NaN },
  { name: 'Boolean', text: 'Boolean score', count: 8, score: false },
  { name: 'Oversized', text: 'Long ticket', count: 257, score: 0.01 },
];
export function fullTicket(appendException) {
  const content = appendException ? 255 : 254;
  const count = content + 2;
  return { content, count, fits: count <= policy.max_length, appendException };
}
function tokenTape(p, ticket) {
  const { content, count, appendException } = ticket;
  p.paper(106, 326, 1695, 342);
  p.cap('Full tokenized input', 145, 382);
  const labels = ['[CLS]', 'log × 254', ...(appendException ? ['exception'] : []), '[SEP]'];
  const xs = appendException ? [157, 392, 997, 1463] : [157, 392, 997];
  const ws = appendException ? [207, 575, 435, 238] : [207, 575, 238];
  labels.forEach((word, j) => {
    p.box(xs[j], 448, ws[j], 100, j === 2 && appendException ? C.rose : C.mint, 8);
    p.mid(word, xs[j] + ws[j] / 2, 499, 42, C.ink, { max: ws[j] - 12 });
  });
  const lastContentEdge = appendException ? 1432 : 967;
  p.line(392, 564, lastContentEdge, 564, C.teal, 3);
  p.mid(content + ' content tokens', (392 + lastContentEdge) / 2, 609, 43, C.teal);
  p.num(content + ' + 2 = ' + count, 112, 793, 78);
  if (ticket.fits) p.stamp('Fits the 256-token policy', 1000, 746, C.teal, 791);
}
export const validLabel = (l) => Number.isInteger(l) && (l === 0 || l === 1);
export const normalized = (text) => text.trim().toLowerCase().replace(/\s+/g, ' ');
export function trainingInput(p, k) {
  p.surface();
  const b = beat(k);
  if (b <= 2) {
    p.title('Read the values in the original JSON');
    p.paper(107, 269, 1704, 549);
    p.grid(
      151,
      361,
      1603,
      ['ID', 'Ticket text', 'Raw label', 'Read as'],
      [
        ['F07', 'Please review my freeze exception.', 1, 'integer'],
        ['D09', 'Where is the guide?', 'true', 'Boolean'],
        ...(b === 2 ? [['D10', ' WHERE  IS  THE GUIDE? ', 0, 'integer']] : []),
      ],
      [0.14, 0.47, 0.19, 0.2],
      { step: 102, size: 45 },
    );
    if (cue(k, 1, 'before the library') && !validLabel(true))
      p.stamp('Reject Boolean label', 146, 862, C.rust);
    if (b === 2 && normalized(' WHERE  IS  THE GUIDE? ') === normalized('Where is the guide?'))
      p.txt('D09 and D10 share normalized text.', 889, 900, 41);
    return;
  }
  if (b < 5) {
    p.title('Count the whole ticket before fitting');
    const ticket = fullTicket(!!cue(k, 4, 'Append the word exception'));
    tokenTape(p, ticket);
    if (!ticket.fits && cue(k, 4, 'The validator raises'))
      p.stamp('ValueError   /   preparation stops', 1000, 746, C.rust, 810);
    if (cue(k, 4, 'At serving time'))
      p.txt('At serving time, the same full ticket goes to human review.', 121, 947, 45);
    return;
  }
  p.title('Four different uses of labeled tickets');
  p.grid(
    118,
    295,
    1678,
    ['Partition', 'What it decides', 'Changes weights?'],
    [
      ['Training', 'Parameter updates', 'Yes'],
      ['Development', 'Checkpoint choice', 'No'],
      ['Selection', 'Review cutoff', 'No'],
      ['Gate', 'Frozen policy verdict', 'No'],
    ],
    [0.27, 0.47, 0.26],
    { step: 116, size: 49 },
  );
  p.txt('Pin the seed, tokenizer, class order and length rule with the weights.', 127, 930, 44);
}
export const developmentLoss = [0.48, 0.31, 0.38];
export function checkpoint(p, k) {
  p.surface();
  const b = beat(k);
  p.title(b <= 2 ? 'Which epoch do we take home?' : 'Rebuild the selected run');
  if (b <= 2) {
    p.cap('Illustrative development loss', 122, 271);
    p.line(141, 728, 1082, 728, C.muted);
    const min = Math.min(...developmentLoss),
      chosen = cue(k, 1, 'Record its path');
    developmentLoss.forEach((v, i) => {
      const x = 205 + 287 * i,
        h = v * 740;
      p.box(x, 728 - h, 165, h, chosen && v === min ? C.teal : '#9cb8a8', 8);
      p.mid(v.toFixed(2), x + 82, 694 - h, 44);
      p.mid('Epoch ' + (i + 1), x + 82, 803, 42);
    });
    p.txt('Batch size  16', 1223, 353, 44);
    p.txt('Learning rate  2 × 10⁻⁵', 1223, 438, 42);
    if (chosen) p.stamp('Restore epoch 2', 1208, 562, C.teal);
    if (b === 2) p.txt('Serving uses a cutoff on score[1].', 1185, 773, 42, C.ink, { max: 631 });
    return;
  }
  p.paper(119, 269, 823, 614);
  p.cap('Environment on record', 159, 335);
  ['Python + project lock', 'Transformers 5.17', 'Resolved package versions'].forEach((s, i) =>
    p.txt(s, 160, 446 + i * 97, 48),
  );
  p.paper(999, 269, 800, 614);
  p.cap(b === 3 ? 'Locked environment' : 'Versioned output directory', 1041, 335);
  const lines =
    b === 3
      ? ['Install from the saved lock', 'Stop if project and lock disagree']
      : b === 4
        ? ['Keep the previous run', 'New directory for this run', 'Checkpoints and model export']
        : [
            'Selected checkpoint + base revision',
            'Weights, tokenizer + label mapping',
            'Length policy, seed + data hashes',
          ];
  lines.forEach((s, i) => p.txt(s, 1041, 446 + i * 97, 45, C.ink, { max: 710 }));
  if (b === 6) p.stamp('Approved bytes   /   read-only to scorer', 105, 916, C.teal, 1200);
}
export function reload(p, k) {
  p.surface();
  const b = beat(k);
  if (b <= 2) {
    p.title('Open a fixed, verified export');
    p.paper(115, 264, 1704, 572);
    p.grid(
      162,
      345,
      1599,
      ['Files in the approved inventory', 'What the scorer checks'],
      [
        ['config.json', 'Listed file, regular file, matching SHA-256'],
        ['model.safetensors', 'Listed file, regular file, matching SHA-256'],
        ['tokenizer.json + other retained files', 'Exact flat inventory and every digest'],
      ],
      [0.49, 0.51],
      { step: 121, size: 42 },
    );
    p.txt(
      b === 1
        ? 'Reject an extra file, missing file or link before loading.'
        : 'Keep files fixed from the first hash check through inference.',
      130,
      917,
      47,
    );
    return;
  }
  if (b <= 4) {
    p.title('Read the score owned by human review');
    p.cap('Two-class example', 112, 297);
    const scores = [0.88, 0.12];
    ['Column 0   /   Guarded agent', 'Column 1   /   Human review'].forEach((s, j) => {
      let y = 391 + 191 * j;
      p.txt(s, 130, y, 43);
      p.box(828, y - 28, 890, 56, '#d3d8c8', 12);
      p.box(828, y - 28, 890 * scores[j], 56, j ? C.teal : C.blue, 10);
      p.num(scores[j].toFixed(2), 1394, y + 76, 48);
    });
    p.txt(
      b === 3
        ? 'Local reload   ·   eval()   ·   inference mode'
        : 'Winning routine confidence   0.88      →      review score   1 − 0.88 = 0.12',
      126,
      882,
      48,
      C.ink,
      { max: 1665 },
    );
    return;
  }
  p.title('What leaves the local scorer?');
  p.paper(106, 241, 833, 361);
  p.cap('Worker output   /   scores', 151, 306);
  p.txt('Fixture ID', 151, 411, 61, C.ink, { face: 'Serif' });
  p.txt('Review score', 151, 515, 61, C.ink, { face: 'Serif' });
  p.paper(978, 241, 829, 361);
  p.cap('Worker output   /   separate metadata', 1022, 306);
  p.txt('Fixture and manifest digests', 1022, 411, 46);
  p.txt('Input policy and library versions', 1022, 515, 46, C.ink, { max: 744 });
  if (cue(k, 5, 'The evaluator keeps')) {
    p.box(107, 682, 1699, 154, C.dark, 12);
    p.txt('Evaluator’s independent reference', 151, 720, 37, C.mint);
    p.txt('Approved manifest', 150, 790, 56, C.page, { face: 'Serif' });
    p.txt('Read-only to the scorer', 1022, 788, 46, C.page);
  }
  if (b === 6) p.txt('A worker can change a writable manifest along with its export.', 123, 944, 44);
}
export function fallbackScene(p, k) {
  p.surface('desk');
  p.title('When the scorer has no usable answer');
  const release = cue(k, 2, 'An unchecked comparison');
  p.phone(1001, 256, 0.49, 'Manual intake', !!release, release ? 'Review queue' : 'Stand by');
  const set = [inputs[1], inputs[5], inputs[2], inputs[3]];
  set.forEach((t, i) => {
    const y = 328 + i * 120;
    p.paper(114, y - 45, 790, 88);
    p.txt(t.name, 144, y, 45);
    p.txt(release ? route(t) : '?', 522, y, 40, release ? C.rust : C.muted);
  });
  p.txt('Count full input before inference.', 122, 907, 47);
}
export function invalidComparison(p, k) {
  p.surface('lab');
  const b = beat(k);
  if (b >= 4) {
    p.title('Does the last word still fit?');
    const ticket = fullTicket(!!cue(k, 4, 'The new total'));
    tokenTape(p, ticket);
    if (!ticket.fits && cue(k, 5, 'send it to a person'))
      p.stamp('Over 256   /   ' + route({ ...inputs[5], count: ticket.count }), 1000, 746, C.rust, 791);
    if (cue(k, 5, 'Count that review'))
      p.txt('Preserve the full ticket for the reviewer and count it in queue load.', 122, 947, 43);
    return;
  }
  p.title('The same comparison can hide two different states');
  const routes = [inputs[0], inputs[3]],
    raw = cue(k, 1, 'Should both tickets go');
  p.grid(
    116,
    326,
    1688,
    ['Score', 'Raw ≥ 0.35', 'Validation', 'Intake'],
    routes.map((r, i) => {
      const resolved = i ? cue(k, 2, 'Send that ticket') : cue(k, 2, 'so the ticket enters');
      return [
        String(r.score),
        raw ? (r.score >= 0.35 ? 'True' : 'False') : '?',
        resolved ? (Number.isFinite(r.score) ? 'Valid' : 'Invalid') : '·',
        resolved ? route(r) : '·',
      ];
    }),
    [0.18, 0.24, 0.24, 0.34],
    { step: 185, size: 57 },
  );
  if (b === 3) p.txt('Timeout  →  caller handles failure  →  manual intake', 127, 872, 49);
}
export function serving(p, k) {
  p.surface();
  const b = beat(k);
  if (b === 1) {
    const changed = cue(k, 1, 'a changed fallback');
    const sample = changed ? { ...policy, fallback_route: 'guarded_agent' } : policy;
    p.title('Check the entire bundle first');
    p.grid(
      116,
      295,
      1692,
      ['Setting', 'Approved v2', 'Submitted bundle'],
      [
        ['Model', policy.model_version, policy.model_version],
        ['Length policy', 256, 256],
        ['Review cutoff', 0.35, 0.35],
        ['Fallback', 'Human review', changed ? ['Guarded agent', C.rust] : 'Human review'],
      ],
      [0.33, 0.32, 0.35],
      { step: 104, size: 46 },
    );
    if (!policyMatches(sample)) p.stamp('Invalid bundle   /   human review', 119, 869, C.rust, 1220);
    return;
  }
  if (b < 4) {
    p.title(b === 2 ? 'Admit the input before scoring' : 'Equality reaches the human queue');
    const r = b === 2 ? inputs[5] : { ...inputs[0], score: 0.35 };
    p.grid(
      120,
      320,
      1680,
      ['Policy', 'Text', 'Full length', 'Score', 'Intake'],
      [['Pinned v2', 'Present', r.count, b === 2 ? 'Skipped' : r.score, route(r)]],
      [0.18, 0.16, 0.2, 0.19, 0.27],
      { step: 190, size: 56 },
    );
    p.txt(
      b === 2
        ? '257 exceeds the 256-token policy.'
        : 'Compare a finite numeric score in [0, 1] with the frozen cutoff.',
      130,
      767,
      50,
    );
    return;
  }
  p.title('Serving-layer fixtures');
  p.grid(
    109,
    261,
    1701,
    ['Input', 'Full tokens', 'Supplied score', 'Intake'],
    inputs.map((r) => [r.name, r.count, r.count > 256 ? 'Unused' : String(r.score), route(r)]),
    [0.29, 0.19, 0.22, 0.3],
    { step: 90, size: 42 },
  );
  p.txt(
    b === 4
      ? 'These fixtures exercise the routing function.'
      : 'Measure the real endpoint, including failures and fallback load.',
    124,
    941,
    43,
  );
}
export const records = [
  ['r-104', 'v2', 'guarded'],
  ['r-105', 'v2', 'human'],
  ['r-106', 'v1', 'guarded'],
];
export const stringAdmit = ([id, version, lane]) =>
  !!id.trim() && version === 'v2' && lane === 'guarded';
export const boundAdmit = (r) => stringAdmit(r.fields) && r.trusted && r.fields[0] === r.current;
export const checks = [
  { fields: ['r-104', 'v2', 'guarded'], trusted: true, current: 'r-104' },
  { fields: ['r-103', 'v2', 'guarded'], trusted: true, current: 'r-104' },
  { fields: ['r-104', 'v2', 'guarded'], trusted: false, current: 'r-104' },
];
export function pinned(p, k) {
  p.surface();
  const b = beat(k);
  p.title(
    b <= 2 ? 'Which route can enter the guarded agent?' : 'Bind the decision to the current request',
  );
  if (b <= 2) {
    p.grid(
      114,
      310,
      1704,
      ['Ticket', 'Bundle', 'Proposed lane', 'String check'],
      records.map((r) => [...r, stringAdmit(r) ? 'Pass' : 'Block']),
      [0.22, 0.22, 0.3, 0.26],
      { step: 141, size: 56 },
    );
    p.txt('Active bundle   v2', 123, 882, 52, C.teal);
    return;
  }
  if (b >= 4) {
    const answer = cue(k, 5, 'The signature on the second');
    p.cap('Current ticket  r-104   /   active v2   /   all three propose guarded intake', 118, 265, 27);
    p.grid(
      115,
      368,
      1690,
      ['Record', 'Bound ticket', 'Issuer', 'Intake'],
      checks.map((r, i) => [
        i + 1,
        r.fields[0],
        r.trusted ? 'Trusted' : 'Unverified',
        answer ? (boundAdmit(r) ? 'Admit' : 'Block') : '?',
      ]),
      [0.18, 0.28, 0.27, 0.27],
      { step: 123, size: 49 },
    );
    if (cue(k, 5, 'A separate gate')) {
      p.lock(125, 851, 0.65);
      p.txt('Access changes approved    0', 236, 904, 49);
    }
    return;
  }
  p.paper(114, 281, 850, 537);
  p.cap('Local test record', 159, 349);
  ['Ticket     r-104', 'Bundle   v2', 'Route     guarded'].forEach((s, i) =>
    p.txt(s, 159, 448 + i * 88, 48),
  );
  p.stamp('Strings match', 171, 714, C.teal);
  p.cap('Required at the consumer', 1022, 349);
  ['Authenticated producer', 'Same current ticket', 'Same approved configuration'].forEach((s, i) =>
    p.txt(s, 1022, 447 + i * 94, 48, C.ink, { max: 782 }),
  );
}
export function shadow(p, k) {
  p.surface();
  const b = beat(k);
  if (b < 3) {
    p.title('Trace a missed call back to its source');
    p.paper(111, 270, 1699, 550);
    p.grid(
      156,
      346,
      1609,
      ['Retained item', 'What it lets you recover'],
      [
        ['Label guide + data card', 'Which requests require a person'],
        ['Frozen split + fixture manifest', 'Which accounts, texts and labels were used'],
        ['Scoring run + evaluation report', 'Which bundle produced the missed score'],
      ],
      [0.47, 0.53],
      { step: 125, size: 46 },
    );
    if (b === 2) p.stamp('Miss   →   ticket   →   run   →   bundle', 137, 887, C.teal, 1240);
    return;
  }
  if (b < 5) {
    p.title('Shadow proposals beside human outcomes');
    p.cap('Illustrative queue   /   cutoff 0.35', 124, 236);
    const outcomes = cue(k, 3, 'record it and its time'),
      proposals = cue(k, 3, 'Save its proposed route');
    p.grid(
      110,
      332,
      1698,
      ['Ticket', 'Live routing', 'Shadow score / route', 'Human outcome'],
      ['A', 'B', 'C'].map((s, i) => {
        const score = [0.28, 0.67, 0.31][i];
        return [
          s,
          'People',
          proposals ? score.toFixed(2) + '   ' + (score >= 0.35 ? 'Review' : 'Agent') : '…',
          outcomes && i < 2 ? ['Routine  09:12', 'Required  09:18'][i] : 'Pending',
        ];
      }),
      [0.14, 0.25, 0.29, 0.32],
      { step: 133, size: 46, accent: 2 },
    );
    p.txt(
      b === 3
        ? 'The proposal leaves live routing with people.'
        : 'Count missing labels, required misses and workload by slice.',
      125,
      904,
      47,
    );
    return;
  }
  p.title('Rollback travels as one bundle');
  const reverted = cue(k, 5, 'together');
  p.paper(112, 282, 1700, 512);
  p.cap('Approved rollback inventory', 153, 350);
  ['Weights', 'Tokenizer', 'Preprocessing', 'Calibrator', 'Threshold', 'Fallback'].forEach((s, i) => {
    const x = 160 + (i % 3) * 546,
      y = 472 + Math.floor(i / 3) * 142;
    p.txt(s, x, y, 47);
    p.txt(reverted ? 'Previous bundle' : 'Current bundle', x, y + 59, 33, reverted ? C.teal : C.muted);
  });
  p.txt('The prior route depends on the prior cutoff as well as the weights.', 123, 913, 45);
}
