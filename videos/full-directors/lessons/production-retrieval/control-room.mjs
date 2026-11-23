import {
  C,
  box,
  line,
  circle,
  poly,
  txt,
  para,
  small,
  title,
  paper,
  key,
  tab,
  cursor,
  thread,
  seal,
  mix,
  ease,
  cues,
  row,
} from './art.mjs';
import {
  run,
  rules,
  trace,
  exact,
  picks,
  governingRecall,
  report,
  ragReleaseGate,
  REQUIRED_RAG_GATES,
  cases,
  verdict,
  canRelease,
  currentAuthorityDecision,
} from './evidence.mjs';
import { plane } from './reading-room.mjs';

export function diagnosis(c, k) {
  const { at } = cues(k);
  const missing = at(2, 'rule never appears'),
    parent = at(2, 'child is right'),
    claim = at(3, 'complete evidence reaches');
  title(c, 'Read back a single request');
  const rows = [
    ['Request', 'Luna · EU', 'Bundle A · permitted trace'],
    [
      'Candidates',
      missing && !parent ? 'No key hit' : run.hits[0].record.id,
      missing && !parent ? 'Check ingestion, scope and scoring' : 'Eligible candidate',
    ],
    [
      'Parent',
      missing && !parent ? '—' : parent && !claim ? 'No matching section' : rules[0].parentId,
      parent && !claim ? 'Check revision, grant and budget' : '',
    ],
    [
      'Packed evidence',
      missing && !claim ? '—' : 'E1 · eu-access-v2',
      claim ? 'Key ≤ 14 days · signal ≤ 48 hours' : '',
    ],
    [
      'Reply',
      missing && !claim ? '—' : claim ? 'Eligible for 30 days. [E1]' : 'Eligible. [E1]',
      claim ? 'Compare the claim with E1' : '',
    ],
  ];
  paper(c, 80, 121, 1036, 416);
  small(c, 'STAGE', 113, 167);
  small(c, 'OBSERVED', 360, 167);
  small(c, 'INSPECT', 748, 167);
  rows.forEach(([a, b, d], i) => {
    const y = 220 + i * 63;
    const failed =
      (claim && i === 4) || (parent && !claim && i === 2) || (missing && !parent && i === 1);
    if (failed) box(c, 94, y - 35, 1008, 51, '#f0cfb0');
    txt(c, a, 113, y, 23);
    txt(c, b, 359, y, 21, failed ? C.red : C.ink, 'Mono');
    txt(c, d, 749, y, 18, failed ? C.red : C.dim);
    line(c, 108, y + 14, 1092, y + 14, C.rule, 1);
  });
  if (claim)
    small(
      c,
      'Replay the same packed context with generation and claim checks.',
      82,
      594,
      C.gold,
      19,
    );
}
function volume(c, x, y, id, held = false) {
  const red = id === 'R',
    odd = ['X', 'Y'].includes(id);
  const w = 63,
    h = red ? 100 : 81 + (typeof id === 'number' ? (id % 4) * 4 : 0),
    color = red ? C.red : odd ? '#70556f' : '#45657b';
  box(c, x + 4, y - h + 2, w, h, '#10222a5e', 3);
  box(c, x, y - h, w, h, color, 3);
  line(c, x + 7, y - h + 2, x + 7, y - 3, '#fff3d44d', 2);
  for (const y0 of [y - h + 9, y - 9])
    line(c, x + 10, y0, x + w - 7, y0, odd ? C.coral : '#b9cabc', 1.4);
  if (red) key(c, x + w / 2, y - h + 29, 0.67, C.cream);
  txt(c, id, x + w / 2, y - 26, 24, held ? C.gold : C.white, 'Serif', 600, 'center');
}
export function recall(c, k) {
  const { at, beat } = cues(k),
    start = ease(at(1, 'run a faster approximate search', 1.1)),
    exchange = ease(at(4, 'put R in its place', 0.8)),
    back = at(5, 'Return to the first search');
  const swapping = at(4, 'Take volume eight out') && !back;
  const swapped = exchange === 1 && !back,
    mid = swapping && exchange < 1;
  const listed = swapped ? picks.map((id) => (id === 8 ? 'R' : id)) : picks,
    counts = governingRecall(exact, listed, ['R']);
  title(c, 'Where is Luna’s required passage?');
  const xx = (i) => 163 + i * 91;
  small(c, 'EXACT', 53, 231, C.sky);
  small(c, 'TOP 10', 53, 258, C.sky);
  for (let i = 0; i < 10; i++) {
    volume(c, xx(i), 267, exact[i]);
    txt(c, i + 1, xx(i) + 31, 300, 15, C.sky, 'Mono', 500, 'center');
  }
  box(c, 146, 268, 931, 9, '#d9c69e');
  if (start > 0) {
    small(c, at(5, 'every returned hit fits') ? 'PACKED' : 'ANN', 53, 459, C.sky);
    for (let i = 0; i < 10; i++) {
      if (i === 7 && mid) {
        c.save();
        c.globalAlpha = exchange;
        volume(c, mix(xx(8), xx(i), exchange), mix(267, 479, exchange), 'R');
        c.restore();
      } else {
        c.save();
        c.globalAlpha = start;
        volume(c, xx(i), mix(410, 479, start), listed[i], listed[i] === 'R');
        c.restore();
      }
    }
    box(c, 146, 479, 931, 14, '#b67964');
    circle(c, 223, 508, 14, C.deep);
    circle(c, 1007, 508, 14, C.deep);
  }
  const firstCount = at(3, 'Eight of ten'),
    taskCount = at(3, 'recovered none');
  if (firstCount && !mid) {
    txt(
      c,
      'Exact neighbors   ' + Math.round(counts.ann * 10) + '/10',
      158,
      596,
      28,
      C.cream,
      'Serif',
    );
  }
  if (taskCount && !mid) {
    txt(
      c,
      'Required rule   ' + counts.task + '/1',
      656,
      596,
      28,
      counts.task ? C.mint : C.gold,
      'Serif',
    );
  }
  if (at(5, 'every returned hit fits'))
    small(c, 'All ten returned volumes enter the prompt.', 158, 640, C.sky);
}
function latencyTrack(c, stages, extent, y, width = 916) {
  const x0 = 125;
  let offset = 0;
  const colors = [C.mint, '#82bdc1', '#c5b0c3', '#a9b9e2', '#e2b77b', '#b5cf9e'];
  stages.forEach((d, i) => {
    box(c, x0 + (offset / extent) * width, y, (d / extent) * width, 49, colors[i]);
    offset += d;
  });
  line(c, x0, y + 49, x0 + width, y + 49, C.sky, 1);
}
export function latency(c, k) {
  const { at, beat } = cues(k),
    budgetCase = beat >= 4;
  title(c, budgetCase ? 'One deadline for the request' : 'Time on the request clock');
  if (budgetCase) {
    const caps = trace.localPassingStages,
      total = caps.reduce((a, b) => a + b, 0);
    small(c, 'STAGE TIMES   /   EACH WITHIN ITS CAP', 100, 164, C.sky);
    caps.forEach((t, i) => {
      const x = 105 + i * 209;
      txt(c, t + ' ms', x, 242, 35, C.cream, 'Serif');
      small(c, ['Auth', 'Retrieval', 'Packing', 'Startup', 'Generate'][i], x, 285, C.sky);
    });
    latencyTrack(c, caps, 1100, 365);
    const deadlineX = 125 + (916 * 1000) / 1100;
    line(c, deadlineX, 317, deadlineX, 455, C.coral, 4);
    txt(c, '1,000 ms deadline', deadlineX, 493, 22, C.coral, 'Sans', 500, 'right');
    if (at(4, 'sum to one thousand fifty'))
      txt(c, total.toLocaleString('en-US') + ' ms elapsed', 124, 550, 32, C.gold, 'Serif');
    if (beat === 5)
      small(c, 'Propagate the remaining deadline and reserve time for fallback.', 125, 611, C.sky);
    return;
  }
  const first = at(1, 'caller sees token one'),
    generated = at(2, 'following four hundred ten'),
    logged = at(3, 'trace write finishes'),
    buffer = at(3, 'try buffered delivery'),
    done = at(3, 'whole checked reply');
  const vals = trace.stages.map((s) => s.duration),
    n = generated ? 5 : 4,
    stages = buffer ? [...vals, 15] : vals.slice(0, n);
  small(c, 'SERIAL STAGES  /  MILLISECONDS', 71, 145, C.sky);
  const labels = ['Authorize', 'Retrieve', 'Pack', 'Model startup', 'Generate', 'Validate'];
  stages.forEach((d, i) => {
    let x = 70 + i * 187;
    txt(c, d + ' ms', x, 211, 31, C.cream, 'Serif');
    small(c, labels[i], x, 248, C.sky);
  });
  latencyTrack(c, stages, 800, 325);
  const pos = (t) => 125 + (916 * t) / 800;
  if (first) {
    line(c, pos(341), 291, pos(341), 397, C.cream, 2);
    txt(
      c,
      buffer ? 'Model token 1' : 'First visible token',
      pos(341) - 8,
      434,
      22,
      C.cream,
      'Sans',
      500,
      'right',
    );
    txt(c, '341 ms', pos(341) - 9, 465, 24, C.gold, 'Mono', 600, 'right');
  }
  if (generated) {
    const mark = done ? trace.completion + 15 : trace.completion;
    line(c, pos(mark), 291, pos(mark), 395, C.cream, 2);
    txt(
      c,
      done ? 'First visible reply' : 'Generation ends',
      pos(mark),
      434,
      21,
      C.cream,
      'Sans',
      500,
      'right',
    );
    txt(c, mark + ' ms', pos(mark), 465, 24, C.gold, 'Mono', 600, 'right');
  }
  if (logged && !buffer) {
    small(c, 'Separate trace write', 112, 564, C.sky);
    line(c, 433, 556, 942, 556, C.sky, 2);
    tab(c, trace.traceComplete + ' ms', 952, 560, C.blue);
  }
  if (buffer) small(c, 'Buffered reply     /     validate after generation', 112, 563, C.mint, 20);
}
export function replay(c, k) {
  const { at } = cues(k);
  const mutate = at(2, 'changes one number'),
    decide = at(3, 'Block it'),
    passed = at(1, 'This run passes');
  title(c, 'Replay the frozen answer');
  const answers = [cases[0].result, mutate ? cases[3].result : cases[0].result];
  for (let i = 0; i < 2; i++) {
    const x = 65 + i * 558,
      ans = answers[i],
      limit = Number(ans.text.match(/limit (\d+)/)[1]);
    paper(c, x, 143, 510, 344, i ? C.white : C.paper);
    small(c, i ? 'CANDIDATE REPLY' : 'REVIEWED EXPECTATION', x + 24, 190, i ? C.blue : C.teal);
    txt(c, 'Eligible. [E1]', x + 24, 263, 41, C.ink, 'Serif');
    row(c, x + 25, 322, 459, 'Key limit', limit + ' days', i && mutate ? C.red : C.teal);
    row(c, x + 25, 384, 459, 'Signal limit', '48 hours');
    small(c, 'eu-access-v2    /    10 d · 48 h', x + 26, 452, C.dim);
  }
  if (mutate ? decide : passed) {
    const ok = answers[0].text === answers[1].text;
    seal(c, ok ? 'CASE PASSES' : 'BLOCK   /   UNSUPPORTED LIMIT', 641, 554, ok ? C.mint : C.coral);
  }
  if (at(4, 'start with the reply'))
    small(c, 'Replay generation with this exact parent.', 641, 611, C.sky);
}
export function gates(c, k) {
  const { beat, at } = cues(k);
  if (beat <= 2) {
    title(c, 'When all five stages meet their bounds');
    const show = at(2, 'That gives'),
      count = at(1, 'Each extra stage', 2);
    const w = 829;
    for (let i = 0; i <= 5; i++) {
      const y = 137 + i * 68,
        p = 0.95 ** i;
      small(c, i ? 'After ' + i : 'Requests', 61, y + 27, C.sky, 18);
      if (i === 0 || count >= i / 5) {
        box(c, 228, y, w * p, 38, i === 0 ? '#748d91' : i === 5 ? C.gold : C.mint, 2);
        if (i === 0 || i === 1 || show)
          txt(c, (100 * p).toFixed(i > 1 ? 1 : 0) + '%', 245, y + 26, 21, C.deep, 'Mono', 600);
      }
    }
    small(
      c,
      show
        ? 'For independent stages, P(all five) = 0.95⁵. Measure request totals to find their p95.'
        : 'Five independent stages, each with a 95% success probability.',
      62,
      600,
      C.cream,
      18,
    );
    return;
  }
  const reviewed = at(4, 'Switch to the reviewed'),
    missing = at(4, 'Remove the lifecycle'),
    num = at(5, 'number one'),
    falseRow = at(5, 'Boolean false');
  let state = reviewed ? 'reviewed' : 'wrong';
  if (missing) state = 'missing';
  if (num) state = 'numeric';
  const r = report(beat === 6 ? 'reviewed' : state);
  if (falseRow && beat === 5) r.lifecycle = false;
  title(c, beat === 6 ? 'From fixture to integration trial' : 'Read the release report');
  paper(c, 83, 111, 653, 493);
  small(c, 'REQUIRED GATE', 115, 158);
  small(c, 'RESULT', 548, 158);
  REQUIRED_RAG_GATES.forEach((name, i) => {
    const y = 214 + i * 66;
    const present = Object.hasOwn(r, name);
    row(c, 116, y, 581, name, present ? String(r[name]) : '—', r[name] === true ? C.teal : C.red);
  });
  const ok = ragReleaseGate(r);
  seal(c, ok ? 'COMPLETE' : 'BLOCK', 794, 224, ok ? C.mint : C.coral);
  para(
    c,
    beat === 6
      ? 'Exercise real identity, model and load. Use held-out questions and a canary rollback condition.'
      : state === 'missing'
        ? 'The lifecycle result is missing.'
        : state === 'numeric'
          ? falseRow
            ? 'The lifecycle gate failed.'
            : 'The lifecycle value is a number.'
          : reviewed
            ? 'All six Boolean checks passed.'
            : 'The frozen case failed on the 30-day claim.',
    790,
    309,
    335,
    26,
    C.cream,
    'Serif',
  );
}
export function finalPractice(c, k) {
  const { beat, at } = cues(k);
  function measuredReveal(phrase, captionStart = phrase) {
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart });
  }

  const days = 13;
  const initialHours = 47;
  const changedHours = 49;
  const evidence = rules[0];
  if (at(4, 'Return the pointer to C')) {
    title(c, 'A separate request before deletion');
    const progress =
      beat === 4 ? ease(measuredReveal('Change the signal to forty-nine hours')) : 1;
    const answer = beat === 5 && measuredReveal('Ineligible under E one') === 1;
    const explain = answer && measuredReveal('forty-eight-hour edge', false) === 1;
    plane(c, {
      days,
      hours: progress ? changedHours : initialHours,
      signalChange: progress ? { from: initialHours, progress } : undefined,
      result: answer ? verdict(days, changedHours) : '',
      label: evidence.sourceId,
      tag: '',
      explainSignalLimit: explain,
    });
    small(c, 'Bundle C   /   grant current', 799, 109, C.sky, 18);
    return;
  }
  const deleted = beat > 2 || (beat === 2 && measuredReveal('deletes the key document') === 1),
    swing = ease(at(2, 'Roll the serving pointer back', 0.85)),
    canSend = canRelease([evidence], [], deleted ? [evidence.documentId] : []),
    discard = !canSend && (beat > 3 || (beat === 3 && measuredReveal('Discard the draft') === 1)),
    invalidated = discard && (beat > 3 || measuredReveal('Invalidate the entry and abstain') === 1);
  const cacheCheck = ease(at(3, 'Check the current deletion record', 0.8));
  const rollbackCheck = ease(at(3, 'Bundle B still points', 0.8));
  title(c, 'Luna’s outbox');
  small(c, `${days}-day key   /   ${initialHours}-hour signal`, 690, 71, C.sky, 19);
  const bx = [100, 350];
  for (let i = 0; i < 2; i++) {
    const x = bx[i];
    box(c, x, 192, 216, 180, i ? C.teal : C.blue, 8);
    small(c, 'BUNDLE ' + (i ? 'C' : 'B'), x + 18, 224, C.white);
    paper(c, x + 15, 247, 185, 102);
    key(c, x + 44, 277, 0.57);
    txt(c, evidence.documentId, x + 67, 283, 18, C.ink, 'Mono');
    txt(c, '“up to 14 days”', x + 27, 309, 18, C.ink, 'Serif');
    txt(c, '“at most 48 hours”', x + 27, 336, 18, C.ink, 'Serif');
  }
  const px = mix(456, 205, swing);
  line(c, 331, 122, px, 177, C.gold, 4);
  circle(c, 331, 122, 7, C.gold);
  poly(
    c,
    [
      [px - 8, 174],
      [px + 8, 174],
      [px, 188],
    ],
    C.gold,
  );
  small(c, 'Serving pointer', 109, 128, C.sky);
  paper(c, 98, 422, 468, 113, deleted ? '#f0d2bd' : '#d7e5cf');
  small(c, deleted ? 'TOMBSTONE OUTSIDE THE INDEX' : 'CURRENT SERVING RECORD', 117, 458, C.dim, 19);
  txt(
    c,
    `${deleted ? 'Deleted' : 'Permitted'}   /   ${evidence.documentId}`,
    117,
    507,
    26,
    deleted ? C.red : C.teal,
  );
  box(c, 634, 147, 490, 388, '#11242d', 12);
  small(c, 'OUTBOX   /   TO LUNA', 661, 193, C.sky);
  if (discard) {
    line(c, 659, 252, 1095, 252, '#536c73', 1);
    txt(c, 'Draft discarded', 664, 328, 38, C.cream, 'Serif');
  } else {
    paper(c, 654, 216, 450, 157, C.white);
    small(c, 'CACHED DRAFT   /   FROM C', 678, 254);
    const decision = verdict(days, initialHours);
    txt(
      c,
      `${decision[0].toUpperCase() + decision.slice(1)}. [${evidence.sourceId}]`,
      678,
      320,
      41,
      C.ink,
      'Serif',
    );
    tab(c, 'Send', 1004, 493, C.teal);
    if (at(2, 'Your cursor is on Send')) cursor(c, 1042, 486);
  }

  box(c, 656, 403, 446, 49, '#284650', 4);
  small(c, invalidated ? 'Cache invalidated' : 'Cached evidence', 672, 434, C.sky, 20);
  txt(
    c,
    `${evidence.sourceId} / ${evidence.documentId}`,
    1087,
    434,
    21,
    C.cream,
    'Mono',
    600,
    'right',
  );
  if (cacheCheck) {
    const x = mix(656, 566, cacheCheck);
    const y = mix(428, 477, cacheCheck);
    line(c, 656, 428, x, y, C.coral, 3);
    circle(c, x, y, 5, C.coral);
  }
  if (rollbackCheck) {
    const y = mix(372, 422, rollbackCheck);
    line(c, 208, 372, 208, y, C.coral, 3);
    circle(c, 208, y, 5, C.coral);
  }
  if (invalidated) seal(c, currentAuthorityDecision({ deleted }).toUpperCase(), 663, 504, C.gold);
}
