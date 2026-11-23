import { MESSAGES, PERMITTED_NOTE_IDS } from '../fixtures.mjs';
import { clamp, eligibleTopK, mix } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';

const policy = eligibleTopK();
const permittedIds = new Set(PERMITTED_NOTE_IDS);
const trackX = (index) => 380 + 495 * index;

export function drawEligibility(ctx, scene, state, api) {
  const { C } = api;
  const late = q(state, 'eligibility-late', 0);
  const early = q(state, 'eligibility-early', 1);
  const select = q(state, 'eligibility-select', 1, 0.58, 0.9);
  withFocus(ctx, api, 'eligibility-results', () => {
    drawText(ctx, api, 'One caller  /  may read M2 and M3', 155, 282, 37, C.ink);
    drawText(ctx, api, 'Score, then lower ID', 155, 355, 29, C.muted);
    for (let i = 0; i < policy.ranked.length; i++) {
      const { id, score } = policy.ranked[i];
      const x = trackX(i);
      const allowed = permittedIds.has(id);
      drawText(ctx, api, 'M' + id, x + 130, 444, 51, C.ink, 'center', 'mono');
      drawText(ctx, api, MESSAGES[id].short, x + 130, 498, 29, C.ink, 'center');
      drawText(
        ctx,
        api,
        score + (score === 1 ? ' point' : ' points'),
        x + 130,
        555,
        30,
        C.cyan,
        'center',
      );
      drawText(
        ctx,
        api,
        allowed ? 'Allowed' : 'Locked',
        x + 130,
        610,
        27,
        allowed ? C.green : C.pink,
        'center',
      );
    }
    // The bracket first covers the globally ranked pair. Move it only on the replay.
    const left = mix(trackX(0) - 35, trackX(1) - 35, early);
    const right = left + 825;
    api.path(
      ctx,
      [
        { x: left, y: 629 },
        { x: left, y: 661 },
        { x: right, y: 661 },
        { x: right, y: 629 },
      ],
      { color: early === 1 ? C.green : C.yellow, width: 5 },
    );
    drawText(ctx, api, 'Selected pair', left + 412, 713, 29, C.ink, 'center');
    drawText(ctx, api, late === 1 ? 'Return' : 'Selected IDs', 150, 844, 36, C.ink);
    for (let i = 0; i < 2; i++) api.rect(ctx, 507 + i * 516, 775, 415, 106, C.panel, C.muted, 12);
    const [kept] = policy.selectedThenFiltered;
    if (late < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - late;
      drawCard(ctx, api, 'M' + policy.ranked[0].id, 538 - late * 170, 795, 352, 66, C.pink);
      ctx.restore();
    }
    const firstX = mix(1054, 538, clamp((late - 0.5) * 2));
    drawCard(ctx, api, 'M' + kept.id, firstX, 795, 352, 66, C.cyan);
    if (select > 0) {
      const next = policy.filteredThenSelected[1];
      drawCard(ctx, api, 'M' + next.id, mix(1420, 1054, select), 795, 352, 66, C.green);
    }
    if (late === 1 && early === 0)
      drawText(ctx, api, 'One empty slot', 1232, 944, 31, C.pink, 'center');
    if (select === 1)
      drawText(
        ctx,
        api,
        'Both slots filled from the permitted notes',
        965,
        944,
        31,
        C.green,
        'center',
      );
  });
}

export default {
  id: 'eligibility',
  draw: drawEligibility,
  cues: ['eligibility-late', 'eligibility-early', 'eligibility-select'],
};
