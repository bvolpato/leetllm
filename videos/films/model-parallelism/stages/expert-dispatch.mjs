import { expertAssignments, mpClamp } from '../arithmetic.mjs';
import { parallelFooter, parallelRectangle, parallelText, parallelTile } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawExpertDispatch(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-expert-dispatch-' + name,
      q = state.cues?.[id];
    if (state.cues && !q) throw Error('Missing model-parallel cue ' + id);
    return q
      ? {
          q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          q: currentBeat < index ? 0 : currentBeat > index ? 1 : smoothstep(progress),
          done: currentBeat > index || (currentBeat === index && progress >= 0.92),
        };
  };
  const Q = (name, index) => cue(name, index).q,
    resultComplete = (name, index) => cue(name, index).done;
  api.focus.target('mp-expert-dispatch-mechanism', () => {
    const m = expertAssignments(),
      q = Q('dispatch', 1),
      arrived = Math.floor(q * m.assignments.length + 1e-9);
    parallelText(
      ctx,
      api,
      'Six token rows · two weighted assignments each',
      960,
      300,
      32,
      themeColors.ink,
      'center',
    );
    for (let token = 0; token < 6; token++)
      parallelTile(
        ctx,
        api,
        'T' + token + ' = ' + (token + 1),
        170 + token * 275,
        365,
        220,
        70,
        themeColors.blue,
      );
    if (currentBeat < 2)
      [0, 1].forEach((owner) => {
        const x = 180 + owner * 870;
        parallelRectangle(ctx, api, x, 535, 760, 280, owner ? themeColors.cyan : themeColors.blue);
        parallelText(
          ctx,
          api,
          'device ' + owner + ' owns E' + 2 * owner + ' / E' + (2 * owner + 1),
          x + 20,
          580,
          29,
          owner ? themeColors.cyan : themeColors.blue,
        );
        const rows = m.assignments.filter((a) => a.owner === owner);
        rows.forEach((a, i) => {
          const ix = m.assignments.indexOf(a);
          if (ix >= arrived) return;
          parallelTile(
            ctx,
            api,
            'T' + a.token + '→E' + a.expert,
            x + 20 + (i % 4) * 180,
            620 + Math.floor(i / 4) * 85,
            160,
            66,
            owner ? themeColors.cyan : themeColors.blue,
          );
        });
        if (resultComplete('loads', 1))
          parallelText(
            ctx,
            api,
            m.loads[owner] + ' assignments',
            x + 380,
            875,
            32,
            themeColors.yellow,
            'center',
          );
      });
    if (currentBeat === 1 && resultComplete('skew', 1))
      parallelText(
        ctx,
        api,
        'peak / average = 8 / 6 ≈ 1.33',
        960,
        950,
        32,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 2) {
      parallelRectangle(ctx, api, 155, 500, 1610, 445, themeColors.yellow, themeColors.bg);
      parallelText(
        ctx,
        api,
        'T3 input = 4 · E0 weight .75 · E2 weight .25',
        960,
        565,
        32,
        themeColors.blue,
        'center',
      );
      const a = m.assignments.filter((a) => a.token === 3);
      a.forEach((r, i) => {
        parallelTile(
          ctx,
          api,
          'E' + r.expert + '   ·   ' + (r.expert + 1) + ' × 4',
          250 + i * 880,
          630,
          610,
          85,
          i ? themeColors.cyan : themeColors.blue,
        );
        parallelText(
          ctx,
          api,
          resultComplete('expert', 2)
            ? `${r.raw} × ${r.gate} = ${r.weighted}`
            : 'weighted contribution: ?',
          555 + i * 880,
          790,
          33,
          i ? themeColors.cyan : themeColors.blue,
          'center',
        );
      });
      parallelText(
        ctx,
        api,
        resultComplete('combine', 2) ? '3 + 3 = 6' : 'combine at original T3: ?',
        960,
        905,
        36,
        resultComplete('combine', 2) ? themeColors.green : themeColors.muted,
        'center',
      );
    }
    parallelFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Each expert result returns to the token that requested it'
        : 'The router selects experts for each token',
    );
  });
}
export default {
  id: 'expert-dispatch',
  draw: drawExpertDispatch,
  cues: [
    'mp-expert-dispatch-0',
    'mp-expert-dispatch-owners',
    'mp-expert-dispatch-1',
    'mp-expert-dispatch-dispatch',
    'mp-expert-dispatch-loads',
    'mp-expert-dispatch-skew',
    'mp-expert-dispatch-2',
    'mp-expert-dispatch-premises',
    'mp-expert-dispatch-expert',
    'mp-expert-dispatch-combine',
  ],
};
