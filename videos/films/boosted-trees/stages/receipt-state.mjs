import { boostCue } from '../construction.mjs';
import { storedCutoff } from '../boundary-replay.mjs';
import { APRIL_SCORED_ROWS, MAY_EVIDENCE } from '../fixtures.mjs';
import { cellText, chapterText, dot, line, outlineBox } from '../defaults.mjs';

const probes = [0, 96].map((id) => APRIL_SCORED_ROWS.find((job) => job.id === id));

function parity(ctx, api, state) {
  const { C } = api;
  const cue = (id, beat) => boostCue(state, id, beat);
  const reference = cue('receipt-reference', 2) > 0;
  const strict = cue('receipt-strict', 2) > 0;
  const repair = cue('parity-repair', 3);
  const testedAgain = cue('parity-replay', 3) === 1;
  const inclusive = repair === 1;
  cellText(ctx, api, 'Stored cutoff     ' + storedCutoff, 960, 295, C.yellow, 42);
  api.focus.target('parity-inputs', () => {
    chapterText(ctx, api, 'April job / model score', 150, 427, 33, C.muted);
    probes.forEach((job, i) => {
      const y = 600 + 200 * i;
      chapterText(ctx, api, 'Job ' + job.id, 150, y, 36, C.ink);
      chapterText(ctx, api, job.score, 150, y + 58, 32, C.cyan);
    });
  });
  for (const [i, x] of [960, 1480].entries()) {
    api.focus.target(i ? 'parity-serving' : 'parity-reference', () => {
      cellText(ctx, api, i ? 'Serving code' : 'Reference', x, 419, C.muted, 32);
      if (i ? strict : reference)
        cellText(
          ctx,
          api,
          i && !inclusive ? 'score > cutoff' : 'score >= cutoff',
          x,
          490,
          C.ink,
          41,
        );
      for (const [j, job] of probes.entries()) {
        const visible = i
          ? repair > 0
            ? testedAgain
            : cue(j ? 'parity-equal' : 'parity-above', 3) === 1
          : reference;
        const alert = !i || inclusive ? job.score >= storedCutoff : job.score > storedCutoff;
        cellText(
          ctx,
          api,
          visible ? (alert ? 'alert' : 'quiet') : '?',
          x,
          635 + 200 * j,
          visible ? (alert ? C.yellow : C.pink) : C.muted,
          44,
        );
      }
    });
  }
  for (const y of [534, 724, 904]) line(ctx, api, 145, y, 1755, y, C.muted, 1);
  const summary = testedAgain
    ? 'Both probes agree after restoring equality.'
    : repair > 0
      ? 'Replaying both jobs…'
      : cue('parity-equal', 3) === 1
        ? 'Job 96 missed its deadline. The new rule kept it quiet.'
        : 'Will the same jobs reach the operator?';
  cellText(ctx, api, summary, 960, 995, C.ink, 34);
}
function shadow(ctx, api, state) {
  const { C } = api;
  const copy = boostCue(state, 'receipt-shadow', 4);
  const paired = boostCue(state, 'receipt-outcome', 4);
  cellText(ctx, api, 'One request, two paths', 960, 298, C.ink, 44);
  line(ctx, api, 290, 472, 1470, 472, C.blue, 6);
  dot(ctx, api, 620, 472, C.blue, 14);
  chapterText(ctx, api, 'Live request', 220, 415, 38, C.blue);
  cellText(ctx, api, 'Job continues', 1460, 415, C.blue, 38);
  api.focus.target('shadow-copy', () => {
    line(ctx, api, 620, 472, 1040, 723, C.muted, 4);
    dot(ctx, api, 620 + 420 * copy, 472 + 251 * copy, C.cyan, 17);
    cellText(ctx, api, 'Shadow model', 1040, 810, C.cyan, 38);
    if (copy === 1) cellText(ctx, api, 'Log the score', 1040, 883, C.ink, 32);
  });
  api.focus.target('shadow-outcome', () => {
    if (paired > 0) {
      line(ctx, api, 1070, 723, 1070 + 440 * paired, 723, C.yellow, 4);
      line(ctx, api, 1470, 472, 1470 + 40 * paired, 472 + 251 * paired, C.blue, 4);
      if (paired === 1) {
        dot(ctx, api, 1510, 723, C.yellow, 15);
        cellText(ctx, api, 'Score + outcome', 1510, 810, C.yellow, 35);
      }
    }
  });
}

function queue(ctx, api, state) {
  const { C } = api;
  const [selected, all] = MAY_EVIDENCE;
  const total = all.tp + all.fp;
  const kept = selected.tp + selected.fp;
  const removed = Math.floor((total - kept) * boostCue(state, 'receipt-save', 5));
  const confirmed = boostCue(state, 'receipt-workload', 5) === 1;
  if (boostCue(state, 'receipt-next', 5) > 0) {
    reviewSlot(ctx, api, state);
    return;
  }
  api.focus.target('may-queue', () => {
    chapterText(ctx, api, 'May jobs', 190, 311, 43);
    for (let i = 0; i < total; i++) {
      const x = 190 + 51 * (i % 20);
      const y = 402 + 65 * Math.floor(i / 20);
      if (i >= total - removed) outlineBox(ctx, api, x, y, 39, 39, C.muted);
      else api.rect(ctx, x, y, 39, 39, i < selected.tp ? C.pink : C.blue, undefined, 0);
    }
    chapterText(ctx, api, 'Missed deadline', 220, 902, 29, C.pink);
    chapterText(ctx, api, 'On time', 590, 902, 29, C.blue);
    if (removed) chapterText(ctx, api, 'Outline = stayed quiet', 815, 902, 29, C.muted);
    if (confirmed || !removed)
      chapterText(
        ctx,
        api,
        (confirmed ? kept : total) + ' alerts',
        1715,
        435,
        61,
        C.yellow,
        'right',
      );
  });
}

function reviewSlot(ctx, api, state) {
  const { C } = api;
  const move = boostCue(state, 'receipt-rank', 6);
  const first = probes.reduce((a, b) => (a.score > b.score ? a : b));
  api.focus.target('may-next', () => {
    chapterText(ctx, api, 'Two April alerts', 225, 308, 52);
    chapterText(ctx, api, 'Model scores, rounded', 225, 370, 33, C.muted);
    chapterText(ctx, api, 'One review slot', 1185, 308, 52);
    chapterText(ctx, api, 'Higher score first', 1185, 370, 33, C.muted);
    outlineBox(ctx, api, 1170, 528, 510, 176, C.yellow, 4);
    if (move === 0) cellText(ctx, api, '?', 1425, 647, C.yellow, 84);
    for (const [i, job] of probes.entries()) {
      const travel = job === first ? move : 0;
      const startY = 440 + i * 224;
      const x = 225 + (1185 - 225) * travel;
      const y = startY + (543 - startY) * travel;
      api.rect(ctx, x, y, 480, 146, C.panel, undefined, 12);
      chapterText(ctx, api, 'Job ' + job.id, x + 28, y + 90, 46);
      chapterText(ctx, api, job.score.toFixed(3), x + 449, y + 92, 56, C.cyan, 'right');
    }
  });
}
export function drawReceiptState(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const { C } = api;
  const cue = (id, b) => boostCue(state, id, b);
  if (beat === 2 || beat === 3) {
    parity(ctx, api, state);
    return;
  }
  if (beat === 4) {
    shadow(ctx, api, state);
    return;
  }
  if (beat >= 5) {
    queue(ctx, api, state);
    return;
  }
  api.focus.target('receipt-state-model', () => {
    const changed = cue('receipt-model-change', 1) === 1;
    chapterText(ctx, api, 'Evaluation receipt', 195, 306, 40, C.cyan);
    const fields = [
      '50 trees on Jan–Mar',
      'Cutoff   ' + storedCutoff,
      'May cost   ' + MAY_EVIDENCE[0].cost + ' units',
      'Both required slices pass',
    ];
    for (const [i, field] of fields.entries()) chapterText(ctx, api, field, 195, 426 + i * 89, 34);
    line(ctx, api, 195, 762, 885, 762, C.muted, 2);
    if (cue('receipt-checksum', 0) === 1)
      chapterText(ctx, api, 'JSON hash   f0088a0e1691…', 195, 846, 32, C.cyan);
    chapterText(ctx, api, 'Fitted model', 1090, 306, 40, C.ink);
    cellText(ctx, api, 'Illustrative bytes', 1370, 438, C.muted, 31);
    for (let i = 0; i < 4; i++) {
      const x = 1140 + 149 * i;
      const highlight = changed && i === 1;
      outlineBox(ctx, api, x - 59, 491, 118, 112, highlight ? C.yellow : C.muted);
      cellText(ctx, api, highlight ? '01' : '00', x, 565, highlight ? C.yellow : C.ink, 40);
    }
    cellText(ctx, api, 'Model digest missing from receipt', 1370, 697, C.pink, 31);
    cellText(
      ctx,
      api,
      changed ? 'Same JSON hash after a model byte changed' : 'Operational checks pending',
      960,
      980,
      C.yellow,
      36,
    );
  });
}
export default {
  id: 'receipt-state',
  draw: drawReceiptState,
  cues: [
    'receipt-state-step-1',
    'receipt-checksum',
    'receipt-model-change',
    'receipt-state-step-2',
    'receipt-probes',
    'receipt-reference',
    'receipt-strict',
    'parity-above',
    'parity-equal',
    'parity-repair',
    'parity-replay',
    'receipt-shadow',
    'receipt-outcome',
    'receipt-queue',
    'receipt-save',
    'receipt-workload',
    'receipt-next',
    'receipt-rank',
  ],
};
