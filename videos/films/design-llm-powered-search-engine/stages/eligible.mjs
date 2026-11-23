import { spoken } from '../construction.mjs';
import { mix } from '../arithmetic.mjs';

export function drawEligible(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => spoken(scene, state, id);
  const take = cue('eligible-take').progress;
  const discard = cue('eligible-discard').progress;
  const filter = cue('eligible-before').progress;
  const refill = cue('eligible-refill').progress;
  const rows = [
    ['roadmap@1', 'workspace-b', C.pink, false],
    ['policy@1', 'superseded', C.pink, false],
    ['policy@2', 'current', C.blue, true],
    ['exception@1', 'current', C.green, true],
  ];
  const y = (i) => 370 + i * 116;
  const slotY = (i) => 405 + i * 150;
  api.text(ctx, 'Alice   /   workspace-a   /   engineering', 150, 253, 35, C.ink);
  api.focus.target('eligible-population', () => {
    api.text(ctx, 'Candidate order inside the trusted service', 150, 321, 32, C.muted);
    rows.forEach(([id, status, color, allowed], i) => {
      const ink = !allowed && filter > 0 ? C.muted : color;
      api.text(ctx, String(i + 1), 155, y(i) + 45, 32, C.muted);
      api.text(ctx, id, 226, y(i) + 45, 42, ink);
      api.text(ctx, status, 680, y(i) + 41, 29, ink);
      if (!allowed && filter > 0)
        api.line(ctx, 220, y(i) + 63, 220 + 580 * filter, y(i) + 63, C.pink, 3);
    });
  });
  api.focus.target('eligible-slots', () => {
    api.text(ctx, 'Two retrieval slots', 1120, 321, 38, C.ink);
    for (let i = 0; i < 2; i++) {
      api.rect(ctx, 1100, slotY(i), 625, 101, C.panel, C.muted, 7);
      api.text(ctx, String(i + 1), 1140, slotY(i) + 65, 30, C.muted);
    }
    const transfer = (row, slot, p, opacity) => {
      if (p <= 0 || opacity <= 0) return;
      const [id, , color] = rows[row];
      if (p < 1) {
        const x = mix(924, 1048, p);
        const top = mix(y(row) + 12, slotY(slot) + 27, p);
        api.rect(ctx, x, top, 36, 46, C.panel, color, 3);
        api.line(ctx, x + 8, top + 14, x + 27, top + 14, color, 2);
        api.line(ctx, x + 8, top + 24, x + 23, top + 24, color, 2);
      }
      if (p <= 0.8) return;
      api.components.fade((opacity * (p - 0.8)) / 0.2, () => {
        api.text(ctx, id, 1215, slotY(slot) + 68, 38, color);
      });
    };
    for (let slot = 0; slot < 2; slot++) {
      transfer(slot, slot, take, 1 - discard);
      transfer(slot + 2, slot, refill, 1);
    }
  });
  api.focus.target('eligible-count', () => {
    if (refill > 0 && refill < 1) {
      api.text(ctx, 'Filling the two slots…', 1100, 772, 36, C.ink);
    } else if (cue('eligible-discard').phase === 'after') {
      const usable = refill === 1 ? rows.filter((row) => row[3]).slice(0, 2).length : 0;
      api.text(
        ctx,
        `${usable} usable passages in the two slots`,
        1100,
        772,
        36,
        usable ? C.green : C.pink,
      );
    }
    const prompt = cue('eligible-predict').phase !== 'before' && !discard;
    api.text(
      ctx,
      prompt
        ? 'After the access and revision checks, how many slots still hold evidence?'
        : filter > 0
          ? 'Check eligibility across the candidates, then take two.'
          : 'Take two from the global list, then check each selected passage.',
      150,
      939,
      36,
      C.ink,
    );
  });
}

export default {
  id: 'eligible',
  draw: drawEligible,
  cues: [
    'eligible-order',
    'eligible-take',
    'eligible-predict',
    'eligible-discard',
    'eligible-before',
    'eligible-refill',
  ],
};
