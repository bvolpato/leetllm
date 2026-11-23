import { ink, muted, paper, brass, colors, sum, pct, fmt } from './studio.mjs';
import {
  enumByteTrace,
  enumToken,
  limitPrefix,
  valid,
  future,
  validMass,
  conditioned,
  OUTCOME_CANDIDATES as candidates,
  stepScores,
  thoughtTraversal,
  visits,
  correction,
  block,
  accept,
  audit,
  base,
  stablePolicy,
  retained,
} from './examples.mjs';

export function grammar(s) {
  const { b, on } = s;
  if (b <= 2) {
    const count = Math.round(6 * s.ramp(2, 'The letters spell', 1.1)) +
      Number(on(2, 'The quote closes')) + Number(on(2, 'does this object accept'));
    const state = enumByteTrace(enumToken, count);
    s.head('Token bytes', 'When can the matcher accept EOS?');
    s.label('Parser preview', 112, 310, 32);
    s.mono(state.current + '▏', 113, 406, 64);
    [...enumToken].forEach((v, i) => {
      s.tile(113 + i * 157, 546, 136, 115, v, i < count ? colors[0] : '#d5d3bf', 62);
    });
    s.tile(1469, 546, 279, 115, 'EOS', state.eosAllowed ? brass : '#c5c9b9', 58);
    s.label(
      state.complete
        ? 'Closing brace consumed   ·   accepting state'
        : count === 7
          ? 'Quote closed   ·   object still open'
          : 'Enum string open   ·   object still open',
      110,
      790,
      46,
    );
    s.label(
      'One candidate token carries the letters, the closing quote and the brace.',
      110,
      931,
      36,
    );
    return;
  }
  if (b >= 5) {
    const stopped = on(5, 'The token budget is exhausted');
    s.head('Emitted-token boundary', 'What can the decoder return here?');
    s.label('Emitted prefix', 112, 385, 40);
    s.mono(limitPrefix.current, 112, 531, 64);
    s.line(902, 363, 902, 680, ink, 5, [12, 9]);
    s.label('Next candidate   ·   one token', 1005, 385, 40);
    s.tile(1005, 470, 638, 130, enumToken, '#d5d3bf', 76);
    if (stopped) {
      s.label('String open   ·   object unfinished', 112, 745, 43, ink);
      s.label(limitPrefix.eosAllowed ? 'EOS allowed' : 'EOS blocked', 112, 843, 42);
      s.label('Remaining token slots', 1005, 745, 40);
      s.mono('0', 1507, 745, 55);
      s.label('Candidate was never emitted', 1005, 843, 42);
    }
    return;
  }
  const masked = on(3, 'masks quota'),
    guide = on(4, 'guide-derived allowlist');
  const names = ['quota', 'revoke', 'create', 'rename'],
    scores = [6, 4, 3, 2];
  const allowed = names.map((w) => (guide ? w === 'create' : masked ? w !== 'quota' : true));
  s.head(
    'First-step field',
    guide
      ? 'Apply the action from the retrieved guide'
      : masked
        ? 'Apply the JSON enum'
        : 'Read the unconstrained scores',
  );
  names.forEach((w, i) => {
    let x = 108 + i * 429;
    s.tile(x, 401, 397, 110, w, allowed[i] ? colors[i] : '#cac9b8', 60);
    s.mono(allowed[i] ? scores[i] : '−∞', x + 199, 615, 69, ink, 'center');
  });
  let win = names[allowed.indexOf(true)];
  s.label('Largest allowed score', 110, 792, 43);
  s.word(win, 739, 790, 74);
  s.label('Guide    create → deploy → revoke', 110, 922, 39);
}
export function laws(s) {
  const { b } = s;
  const m = b <= 2 ? future : b === 3 ? [1, 1] : future;
  const result = b === 3 ? valid : b >= 5 ? conditioned : b === 4 ? validMass : null;
  s.head(
    'Two valid strings',
    b === 3
      ? 'Renormalize at each prefix'
      : b >= 5
        ? 'Condition on reaching a valid ending'
        : 'Follow the valid edges',
  );
  ['A', 'B'].forEach((name, i) => {
    let y = 424 + i * 274;
    s.tile(114, y - 65, 218, 125, name, colors[i], 67);
    s.mono(fmt(valid[i]), 370, y, 52);
    s.line(550, y, 770, y, ink, 6);
    s.tile(782, y - 65, 217, 125, i ? 'y' : 'x', colors[i], 67);
    if (b >= 2) s.mono('× ' + fmt(m[i]), 1040, y, 52);
    if (result) s.mono((b >= 5 ? '÷ .58  ' : '') + '= ' + fmt(result[i]), 1770, y, 54, ink, 'right', 524);
    if (b === 2)
      s.label('Other continuations carry ' + pct(1 - m[i]) + ' and fail the grammar.', 112, y + 131, 34);
  });
  if (b >= 4)
    s.mono(
      'Total valid joint mass   ' +
        fmt(validMass[0]) +
        ' + ' +
        fmt(validMass[1]) +
        ' = ' +
        fmt(sum(validMass)),
      110,
      929,
      39,
    );
}
export function outcome(s) {
  const { b } = s,
    score = s.on(1, 'scores each with'),
    chosen = s.on(2, 'point nine six for A');
  const pick = candidates.reduce((a, v) => (a.score > v.score ? a : v));
  s.head('Best of three', 'Which finished answer does the evaluator select?');
  s.label('Complete candidate', 117, 336, 35);
  s.label('Generator log p', 1195, 336, 34);
  s.label('Outcome score', 1545, 336, 34);
  candidates.forEach((v, i) => {
    const y = 438 + i * 167;
    s.circle(152, y, 37, colors[i]);
    s.word(v.id, 152, y, 44, ink, 'center');
    s.word(v.text, 248, y, 54, ink, 'left', 'Serif', 893);
    s.mono(fmt(v.log), 1316, y, 45, ink, 'center');
    if (score) s.mono(fmt(v.score), 1663, y, 51, ink, 'center');
    if (chosen && v.id === pick.id) s.line(243, y + 56, 1774, y + 56, ink, 6);
  });
  const notes = [
    'Selection uses the highest supplied outcome score.',
    'Ranking a set changes which answers are returned.',
    'A test suite checks its cases. A proof checker checks its formal claim.',
    'Keep the candidate, evaluator and task judgment together.',
  ];
  if (chosen) s.label(notes[b - 1], 112, 934, 38);
}
export function processScores(s) {
  const b = s.b,
    changed = s.on(5, 'point nine nine'),
    scores = stepScores(changed),
    minimum = b >= 4;
  s.head('Process supervision', 'Which step received the low score?');
  s.label('Plan', 113, 322, 34);
  s.label('Steps in execution order', 373, 322, 34);
  s.label('Outcome', 1444, 322, 34);
  s.label('Minimum', 1662, 322, 34);
  candidates.slice(0, 2).forEach((v, i) => {
    const y = 398 + i * 293;
    s.word(v.id, 120, y + 58, 68);
    const names = v.text.split(' → ');
    names.forEach((w, j) => {
      const x = 357 + j * 340;
      s.tile(x, y, 321, 109, w, i === 1 && j === 0 && changed ? brass : colors[j], 49);
      if (b >= 3) s.mono(fmt(scores[i][j]), x + 160, y + 176, 47, ink, 'center');
    });
    s.mono(fmt(v.score), 1519, y + 60, 47, ink, 'center');
    if (minimum) s.mono(fmt(Math.min(...scores[i])), 1743, y + 60, 47, ink, 'center');
  });
  if (b >= 5) s.label('Guide requires create first. Plan B starts by revoking.', 110, 947, 39);
}
function tree(s, x, y, kind, visitsCount) {
  const w = 655,
    h = 274,
    pos = [];
  for (let i = 0; i < 7; i++) {
    const d = Math.floor(Math.log2(i + 1)),
      q = i + 1 - 2 ** d;
    pos.push([x + (w * (q + 0.5)) / 2 ** d, y + (h * d) / 2]);
  }
  const path = thoughtTraversal(kind, visitsCount).visited;
  pos.forEach(([xx, yy], i) => {
    if (i) {
      const [ax, ay] = pos[Math.floor((i - 1) / 2)];
      s.line(ax, ay, xx, yy, muted, 5);
    }
  });
  pos.forEach(([xx, yy], i) => {
    s.circle(xx, yy, 45, path.includes(i) ? brass : '#bdc8b7');
    s.word(['•', 'A', 'B', 'A1', 'A2', 'B1', 'B2'][i], xx, yy, 38, ink, 'center');
  });
  s.mono(
    path.map((i) => ['root', 'A', 'B', 'A1', 'A2', 'B1', 'B2'][i]).join(' → '),
    x + w / 2,
    y + 381,
    35,
    ink,
    'center',
    810,
  );
}
export function thoughts(s) {
  const { b } = s;
  if (b <= 2) {
    s.head('Tree of thoughts', 'Which partial solution gets another step?');
    const count = b === 1 ? 1 : Math.min(5, 1 + Math.floor(4 * s.ramp(2, 'Breadth-first visits', 2.7)));
    s.label('Breadth-first', 111, 344, 41);
    s.label('Depth-first', 1020, 344, 41);
    tree(s, 127, 448, 'breadth', count);
    tree(s, 1029, 448, 'depth', count);
    return;
  }
  const child = s.on(5, 'count one more visit'),
    parent = s.on(6, 'Send the same reward');
  const v = visits(child, parent);
  s.head('Monte Carlo tree search', b < 5 ? 'Allocate one more visit' : 'Back up the returned reward');
  s.tile(715, 320, 495, 99, 'parent', brass, 54);
  s.mono(fmt(v.total) + ' / ' + v.n + ' = ' + fmt(v.total / v.n), 961, 469, 39, ink, 'center');
  v.nodes.forEach((n, i) => {
    const x = 454 + i * 1010;
    s.line(961, 510, x, 605, i === 1 && b >= 5 ? '#98532e' : muted, 6);
    s.tile(x - 178, 611, 356, 98, i ? 'B' : 'A', i === 1 && b >= 5 ? brass : colors[i], 56);
    s.mono(fmt(n.total) + ' / ' + n.n + ' = ' + fmt(n.mean), x, 786, 42, ink, 'center');
    if (b >= 4 && !child) s.mono('U = ' + fmt(n.ucb, 2), x, 891, 41, ink, 'center');
  });
  if (child) s.label('Return   +0.20', 802, 884, 41);
}
export function balance(s) {
  const { b } = s,
    m = correction;
  if (b === 5 && s.on(5, 'If the target and draft already agree')) {
    s.head('Speculative sampling', 'When the draft matches the target');
    s.label('Draft q', 110, 392, 41);
    s.strip(m.target, ['create', 'revoke', 'rename'], 526, 351, 1275, 97);
    s.label('Target p', 110, 633, 41);
    s.strip(m.target, ['create', 'revoke', 'rename'], 526, 592, 1275, 97);
    s.mono('Accepted 1     rejected 0', 110, 893, 53);
    return;
  }
  s.head('Speculative sampling', 'Where should the rejected probability go?');
  const columns = [
    ['Draft q', m.draft],
    ['Target p', m.target],
  ];
  if (b >= 2) columns.push(['Accepted', m.accepted]);
  const norm = s.on(4, 'Every rejected draw'),
    corrected = s.on(4, 'Adding that correction');
  if (b >= 4) columns.push(norm ? ['Residual law', m.correction] : ['Positive p − q', m.residual]);
  if (corrected)
    columns.push([b === 5 ? 'Wrong redraw' : 'Corrected', b === 5 ? m.wrongRedraw : m.restored]);
  const dx = 1425 / columns.length;
  columns.forEach(([name, row], j) => {
    const x = 413 + (j + 0.48) * dx;
    s.label(name, x, 343, 35, muted, 'center', dx - 12);
    row.forEach((v, i) => {
      const yy = 455 + i * 159;
      s.mono(fmt(v, 2), x, yy, 53, ink, 'center');
      const w = dx * 0.72;
      s.rect(x - w / 2, yy + 44, w, 18, '#c3c7b7');
      s.rect(x - w / 2, yy + 44, w * v, 18, colors[i]);
    });
  });
  ['create', 'revoke', 'rename'].forEach((w, i) => s.word(w, 112, 455 + i * 159, 54));
  if (b >= 3) s.mono('Accepted ' + fmt(sum(m.accepted)) + '     rejected ' + fmt(m.rejected), 110, 906, 42);
  if (corrected)
    s.label(
      b === 5
        ? 'Redrawing from p gives create extra mass.'
        : 'The residual sends the rejected .20 to revoke.',
      938,
      906,
      34,
    );
}
export function verifyBlock(s) {
  const { b, on } = s,
    remove = on(4, 'rejects'),
    all = b >= 5;
  s.head(
    'Speculative block',
    all ? 'A separate block where all proposals pass' : 'Each target row belongs to a specific prefix',
  );
  s.label('Target context', 110, 348, 39);
  s.label(all ? 'Verified token' : 'Draft token', 923, 348, 39);
  s.label('Verification', 1420, 348, 39);
  const context = ['prompt', 'prompt + create', 'prompt + create a', 'prompt + create a key'];
  for (let i = 0; i < 4; i++) {
    const y = 411 + i * 128,
      invalid = remove && !all && i >= 2;
    s.mono(context[i], 111, y + 45, 37, invalid ? muted : ink);
    if (i < 3) {
      const tok = block[i];
      s.tile(920, y, 411, 91, tok.word, invalid || (remove && !all && i === 1) ? '#c6c6b5' : colors[i], 49);
      if (b >= 3 && !all && i < 2 && (i === 0 || on(3, 'At the next position'))) {
        s.mono('p/q   ' + fmt(tok.p) + ' / ' + fmt(tok.q), 927, y + 112, 30);
      }
      if (all) s.label('accepted', 1425, y + 45, 42);
      else if ((i === 0 && on(3, 'uniform point two')) || (i === 1 && remove)) {
        const ok = accept(tok.p, tok.q, tok.u);
        s.mono(
          fmt(tok.u) + (ok ? ' < ' : ' > ') + fmt(Math.min(1, tok.p / tok.q)) + (ok ? '   keep' : '   cut'),
          1425,
          y + 45,
          34,
        );
      } else if (invalid) s.label('discard row', 1425, y + 45, 37);
    } else
      s.label(
        all ? 'Draw one bonus token' : invalid ? 'Discard tentative KV state' : 'Target’s bonus row',
        920,
        y + 45,
        39,
      );
  }
  if (b === 4 && remove)
    s.label('Accepted prefix    create   +   one replacement drawn from the residual', 110, 969, 36);
  if (b === 6) s.label('Compare latency and throughput against the same target policy.', 110, 969, 36);
}
export function auditAnswers(s) {
  const b = s.b;
  if (b < 3) {
    s.head('Fixed probability row', 'How often does create come up in 2,000 draws?');
    const rows = [
      ['greedy', 1, 1],
      ['T = 2', stablePolicy(undefined, 2).probabilities[0], 0.457],
      ['top-p .90', retained(base.probabilities, 'p', 0.9).probabilities[0], 0.621],
    ];
    rows.slice(0, b === 1 ? 2 : 3).forEach(([name, expected, observed], i) => {
      const y = 396 + i * 166;
      s.label(name, 111, y, 42);
      s.rect(511, y - 31, 861, 63, '#d3d1bb');
      s.rect(511, y - 31, 861 * observed, 63, colors[i]);
      s.line(511 + 861 * expected, y - 48, 511 + 861 * expected, y + 47, ink, 6);
      s.mono(fmt(expected) + ' / ' + fmt(observed), 1779, y, 44, ink, 'right');
    });
    s.label('Tick   expected share          Ink   observed share', 111, 938, 39);
    return;
  }
  s.head('Whole-answer audit', 'Keep all 100 requests in each denominator');
  const cohortCount = b === 3 ? 1 : 2;
  audit.slice(0, cohortCount).forEach((r, i) => {
    const x = 117 + i * 871;
    s.label('Cohort ' + (i ? 'B' : 'A'), x, 343, 45);
    ['First word matches', 'Supported and complete', 'Length limit'].forEach((name, j) => {
      const yy = 436 + j * 148;
      s.label(name, x, yy, 34);
      s.mono(r[j] + ' / 100', x + 775, yy, 38, ink, 'right');
      s.rect(x, yy + 47, 777, 29, '#d1cfb9');
      s.rect(x, yy + 47, 7.77 * r[j], 29, colors[j]);
    });
  });
  s.label(
    b >= 5
      ? 'Fixed decoder and grader    ·    save the retrieval snapshot, settings, stop reason and answer.'
      : 'First-word agreement and complete-answer support count different events.',
    111,
    932,
    36,
  );
}
