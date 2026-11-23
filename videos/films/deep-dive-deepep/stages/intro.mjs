import { hidden } from '../fixtures.mjs';
import { routeReplayComparison } from '../model.mjs';
import { text } from '../defaults.mjs';

const { cached, rebuilt } = routeReplayComparison();
const pair = (choices) => choices.map((k) => 'E' + k).join(' / ');
const row = 'a   [' + hidden.a.join(', ') + ']';
const chips = [420, 1500];
const chipEdge = [
  [282, 546], [282, 742], [260, 764], [-260, 764], [-282, 742],
  [-282, 304], [-260, 282], [260, 282], [282, 304], [282, 420],
];

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  const progress = (id) => state.cues?.[id]?.progress ?? 0;
  const done = (id) => state.cues?.[id]?.phase === 'after';
  const changed = b > 1 || (b === 1 && done('de-intro-change'));
  const repaired = b === 2 && done('de-intro-rebuild');
  const selected = changed ? rebuilt.experts : cached.experts;
  const saved = repaired ? rebuilt.experts : cached.experts;
  const firstPass =
    0.24 + 0.28 * Math.min(1, state.t / 1.25) + 0.48 * progress('de-intro-dispatch');
  const crossing = repaired ? progress('de-intro-deliver') : b === 0 ? firstPass : 1;
  const expansion = repaired ? progress('de-intro-expand') : 0;
  const arrived = repaired ? done('de-intro-deliver') : crossing >= 1;
  const wrong = b === 2 && done('de-intro-wrong') && !repaired;
  const label = (value, x, y, size, color) => text(ctx, api, value, x, y, size, color, 'center');

  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('de-intro-ranks', () => {
    for (const [rank, cx] of chips.entries()) {
      for (let dx = -210; dx <= 210; dx += 60) {
        api.rect(ctx, cx + dx - 8, 262, 16, 24, C.muted, undefined, 3);
        api.rect(ctx, cx + dx - 8, 760, 16, 24, C.muted, undefined, 3);
      }
      const facing = rank === 0 ? 1 : -1;
      const edge = chipEdge.map(([dx, y]) => ({ x: cx + facing * dx, y }));
      api.path(ctx, edge, { color: C.blue, fill: C.panel, width: 3 });
      label('GPU ' + rank, cx, 375, 62, C.ink);
      for (let local = 0; local < 2; local++) {
        const expert = 2 * rank + local;
        const x = cx + (local ? 134 : -134);
        const active = saved.includes(expert) && (!rank || arrived);
        const color = wrong && expert === cached.experts[0] ? C.pink : active ? C.cyan : C.muted;
        if (active) {
          api.line(ctx, cx, 539, x, 636, color, 5);
          if (repaired && expansion > 0) {
            api.circle(ctx, cx + (x - cx) * expansion, 539 + 97 * expansion, 17, C.yellow);
          }
        }
        api.rect(ctx, x - 117, 649, 234, 78, C.bg, color, 11);
        label('Expert ' + expert, x, 701, 39, color);
      }
    }
    label('GPU link', 960, 431, 32, C.blue);
    const packetX = chips[0] + (chips[1] - chips[0]) * crossing;
    const left = chips[0] + 118;
    if (packetX - 118 > left) api.line(ctx, left, 483, packetX - 118, 483, C.blue, 6);
    if (packetX + 140 < chips[1]) api.arrow(ctx, packetX + 118, 483, chips[1], 483, C.blue, 6);
    const packet = (x) => {
      api.rect(ctx, x - 112, 436, 224, 94, C.yellow, undefined, 14);
      label(row, x, 499, 44, C.bg);
    };
    if (!repaired) packet(chips[0]);
    packet(packetX);
  });

  api.focus.target('de-intro-choices', () => {
    if (b === 0) {
      label('Router choice    ' + pair(selected), 960, 904, 45, C.ink);
    } else {
      label('Router now    ' + pair(selected), chips[0], 898, 43, C.yellow);
      label('Saved handle    ' + pair(saved), chips[1], 898, 43, C.cyan);
    }
  });
  api.focus.target('de-intro-decision', () => {
    if (b === 1 && progress('de-intro-question') > 0)
      label('Which expert would the cached route visit by mistake?', 960, 1000, 40, C.ink);
    if (wrong) label('The old handle still sends a to expert 0', 960, 1000, 40, C.pink);
    if (repaired && done('de-intro-expand'))
      label('One row crosses the link. Both experts get a slot.', 960, 1000, 40, C.ink);
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'de-intro-choices',
    'de-intro-dispatch',
    'de-intro-change',
    'de-intro-question',
    'de-intro-wrong',
    'de-intro-rebuild',
    'de-intro-deliver',
    'de-intro-expand',
  ],
};
