import { cosineSimilarity, orderAudit } from '../arithmetic.mjs';
import { NOVELTY_EXAMPLE } from '../fixtures.mjs';
import { screenCandidates } from '../model.mjs';
import {
  centeredText,
  clauseComplete,
  clauseProgress,
  filledRectangle,
  footer,
  tag,
} from '../defaults.mjs';
const { references, proposals, cutoff } = NOVELTY_EXAMPLE;
const [b, c] = proposals;
const firstRun = screenCandidates(proposals, references, cutoff);
const replayB = { ...b, votes: [0.8, 0.7] };
const replay = screenCandidates([replayB, c], references, cutoff);
const closest = (vector, pool) => Math.max(...pool.map((ref) => cosineSimilarity(vector, ref)));

function drawPool(ctx, api, beat) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  const reset = beat > 2;
  const compared = !reset && p('pool-c') > 0;
  const checking = p('pool-new-score');
  const withheld = reset && p('pool-withhold') === 1 && replay[0].passedGates === 4;
  const admitted = p('pool-accept') === 1 && replay[1].passedGates === 5;
  const keptB = !reset && p('pool-b-admitted') === 1 && firstRun[0].passedGates === 5;
  const stopped = !reset && p('pool-c-rejected') === 1 && firstRun[1].passedGates === 3;

  focus.target('pool-members', () => {
    api.text(ctx, 'Accepted references', 155, 302, 37, C.muted);
    const members = ['[1, 0]', '[0, 1]'];
    if (keptB) members.push('B');
    if (admitted) members.push('C');
    members.forEach((name, j) => {
      const x = 570 + 230 * j;
      api.rect(ctx, x, 247, 200, 82, C.panel, C.blue);
      api.text(ctx, name, x + 100, 303, 38, C.blue, 'center');
    });
    if (keptB || p('pool-vote-change') > 0) {
      const vote = orderAudit(...(reset ? replayB : b).votes);
      api.text(ctx, 'Row B   ·   score for the proposed answer', 155, 389, 28, C.muted);
      api.text(
        ctx,
        'Forward ' + vote.forwardA.toFixed(2) + '    /    Reversed ' + vote.remappedA.toFixed(2),
        772,
        389,
        30,
        C.ink,
      );
    }
    if (withheld) api.text(ctx, 'B withheld by judge', 1760, 389, 31, C.pink, 'right');
  });

  focus.target('pool-scale', () => {
    const left = 190,
      right = 1720,
      y = 661;
    const at = (v) => api.lerp(left, right, (v - 0.7) / 0.3);
    const oldScore = closest(c.vector, [...references, b.vector]);
    const recheckedScore = closest(c.vector, references);
    const firstScore = closest(b.vector, references);
    const value = reset
      ? api.lerp(oldScore, recheckedScore, checking)
      : compared
        ? oldScore
        : firstScore;
    const label = reset
      ? checking === 1
        ? 'C against original references'
        : checking > 0
          ? 'Rechecking C'
          : 'Earlier comparison of C with B'
      : compared
        ? 'C compared with B'
        : 'B against original references';
    api.text(ctx, label, left, 480, 44, C.ink);
    api.line(ctx, left, y, right, y, C.muted, 4);
    api.text(ctx, '0.70', left, y + 64, 34, C.muted, 'center');
    api.text(ctx, '1.00', right, y + 64, 34, C.muted, 'center');
    api.line(ctx, at(cutoff), y - 42, at(cutoff), y + 20, C.yellow, 4);
    api.text(ctx, 'Cutoff  ' + cutoff.toFixed(2), at(cutoff), y + 64, 36, C.yellow, 'center');
    if (p('pool-rule') > 0) {
      const x = at(value);
      api.circle(ctx, x, y, 15, C.cyan);
      if (!reset || checking === 0 || checking === 1)
        api.text(ctx, value.toFixed(value > 0.99 ? 6 : 4), x, y - 66, 42, C.cyan, 'center');
    }
    api.text(ctx, 'Maximum cosine similarity', left, y + 139, 32, C.muted);
  });
  focus.target('pool-decision', () => {
    let label = 'B is under review';
    if (keptB) label = 'B admitted to this fixture pool';
    if (stopped) label = 'C rejected against B';
    if (reset)
      label = withheld
        ? 'Which references should decide C’s next comparison?'
        : 'Replay   ·   same proposals and cutoff';
    if (p('pool-recheck') === 1) label = 'Recheck C against the finally accepted rows';
    if (p('pool-judge') === 1) label = 'C clears novelty   ·   judge decision pending';
    if (admitted) label = 'C wins in both orders   ·   add C to the pool';
    api.text(ctx, label, 960, 961, 40, stopped ? C.pink : admitted ? C.green : C.ink, 'center');
  });
}

export function drawAdmissionEconomics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  if (currentBeat >= 2) return drawPool(ctx, api, currentBeat);
  api.focus.target('admission-economics-mechanism', () => {
    if (currentBeat === 0) {
      const n = clauseComplete(ctx, api, 'two-judged') ? 2 : 6;
      centeredText(
        ctx,
        api,
        clauseComplete(ctx, api, 'two-judged')
          ? 'Selective gates leave two judged rows'
          : 'Six candidate IDs before judge admission',
        960,
        295,
        34,
        themeColors.blue,
      );
      for (let i = 0; i < 6; i++) {
        const x = 240 + i * 270,
          col = i < n ? themeColors.cyan : themeColors.muted;
        tag(ctx, api, 'C' + (i + 1), x, 445, col, 180);
        if (i >= n) centeredText(ctx, api, 'stopped', x, 555, 27, themeColors.pink);
      }
      if (clauseProgress(ctx, api, 'four-calls')) {
        const built = Math.floor(clauseProgress(ctx, api, 'four-calls') * 4);
        for (let i = 0; i < built; i++)
          filledRectangle(ctx, api, 230 + i * 110, 650, 107, 70, themeColors.cyan);
        if (clauseComplete(ctx, api, 'four-calls'))
          centeredText(ctx, api, '2 rows × 2 orders = 4 calls', 1190, 700, 35, themeColors.cyan);
        else
          centeredText(
            ctx,
            api,
            'Constructing both orders for each judged row',
            1190,
            700,
            30,
            themeColors.muted,
          );
      }
      if (clauseComplete(ctx, api, 'twelve-calls')) {
        filledRectangle(ctx, api, 230, 780, 1320, 70, themeColors.blue);
        centeredText(ctx, api, '6 rows × 2 orders = 12 calls', 960, 905, 35, themeColors.blue);
      }
    } else if (currentBeat === 1) {
      centeredText(
        ctx,
        api,
        'Reviewer labels · judge approves every row',
        960,
        295,
        35,
        themeColors.blue,
      );
      for (let i = 0; i < 100; i++)
        filledRectangle(
          ctx,
          api,
          180 + (i % 20) * 78,
          390 + Math.floor(i / 20) * 65,
          57,
          45,
          i < 98 ? themeColors.blue : themeColors.pink,
        );
      centeredText(ctx, api, '98 acceptable · 2 unacceptable', 960, 790, 34, themeColors.muted);
      if (clauseComplete(ctx, api, 'bad-denominator')) {
        centeredText(ctx, api, 'Overall agreement: 98/100 = 98%', 530, 915, 33, themeColors.blue);
        centeredText(ctx, api, 'False admission: 2/2 = 100%', 1450, 915, 33, themeColors.pink);
      }
    }
    footer(ctx, api, 'Supplied votes   ·   request counts exclude retries');
  });
}
export default {
  id: 'admission-economics',
  draw: drawAdmissionEconomics,
  cues: [
    'gate-cost',
    'two-judged',
    'four-calls',
    'twelve-calls',
    'bad-class',
    'bad-denominator',
    'pool-rule',
    'pool-b-admitted',
    'pool-c',
    'pool-c-rejected',
    'pool-replay',
    'pool-vote-change',
    'pool-withhold',
    'pool-question',
    'pool-recheck',
    'pool-new-score',
    'pool-judge',
    'pool-accept',
  ],
};
