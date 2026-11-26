// Scene 18: padding: "Did the actor survive the batch?"
// Direct callback to Scene 2: glowing dog trajectory extends into a 6th padded slot,
// forking into a rose unmasked decay (0.331) vs an emerald skipped preservation (0.382).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DOG_TRACE,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function padding(s, c) {
  const title = heroTitle(['Did the actor', 'survive the batch?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.dog,
  });

  const xs = [-675, -405, -135, 135, 405, 675];
  const baseY = 235;
  const topY = -125;
  const pt = (i, v) => [xs[i], baseY - v * (baseY - topY)];
  const vals = DOG_TRACE.states.slice(1); // [0, 0.664, 0.535, 0.448, 0.382]

  const showPadSlot = s.value(0);
  const runProg = s.value(0);
  const skipProg = s.value(0);
  const showQ = s.value(0);
  const showPayoff = s.value(0);

  // Static original 5-word dog trace
  const baseTrailPts = vals.map((v, i) => pt(i, v));
  const staticNodes = [
    line([xs[0] - 65, baseY], [xs[5] + 65, baseY], { stroke: '#556894', width: 3 }),
    txt('h = 0', xs[0] - 88, baseY, 28, COSMOS.muted, 'mono', 'right'),
    ...DOG_TRACE.words.map((word, i) =>
      tokenPill(word, xs[i], -248, word === 'dog' ? ROLE.dog : ROLE.input, {
        w: 170,
        h: 54,
        size: 28,
      }),
    ),
    glowingTrail(baseTrailPts, { color: ROLE.dog, width: 5.5, glow: 11 }),
    ...vals.flatMap((v, i) => {
      const p = pt(i, v);
      const list = [glowDot(p[0], p[1], { radius: 8, color: ROLE.dog, glow: 12 })];
      if (i >= 1) {
        list.push(txt(fmt(v, 3), p[0], p[1] - 42, 30, ROLE.dog, 'mono', 'center'));
      }
      return list;
    }),
  ];

  const liveLayer = guardedDynamic(
    () => 1,
    () => {
      const nodes = [];

      if (showPadSlot.value > 0.02) {
        nodes.push(
          tokenPill('padding (0)', xs[5], -248, COSMOS.dim, {
            w: 196,
            h: 54,
            size: 26,
            dash: [8, 6],
            opacity: showPadSlot.value,
          }),
        );
      }

      // Rose branch: unmasked extra update (0.382 -> 0.331)
      if (runProg.value > 0.02) {
        const a = pt(4, DOG_TRACE.final);
        const b = pt(5, DOG_TRACE.padded);
        const cur = [a[0] + (b[0] - a[0]) * runProg.value, a[1] + (b[1] - a[1]) * runProg.value];
        nodes.push(
          glowingTrail([a, cur], { color: ROLE.warn, width: 5.2, glow: 11 }),
          glowDot(cur[0], cur[1], { radius: 8.5, color: ROLE.warn, glow: 12 }),
        );
        if (runProg.value > 0.85) {
          nodes.push(
            txt(
              `run  ${fmt(DOG_TRACE.padded, 3)}`,
              b[0],
              b[1] + 44,
              30,
              ROLE.warn,
              'mono',
              'center',
            ),
          );
        }
      }

      // Emerald branch: skipped update preserving 0.382
      if (skipProg.value > 0.02) {
        const a = pt(4, DOG_TRACE.final);
        const b = pt(5, DOG_TRACE.final);
        const cur = [a[0] + (b[0] - a[0]) * skipProg.value, a[1] + (b[1] - a[1]) * skipProg.value];
        nodes.push(
          line(a, cur, { stroke: ROLE.cell, width: 5.2, dash: [14, 8] }).glow(10, ROLE.cell),
          glowDot(cur[0], cur[1], { radius: 8.5, color: ROLE.cell, glow: 12 }),
        );
        if (skipProg.value > 0.85) {
          nodes.push(
            txt(
              `skip  ${fmt(DOG_TRACE.final, 3)}`,
              b[0],
              b[1] - 44,
              30,
              ROLE.cell,
              'mono',
              'center',
            ),
          );
        }
      }

      if (showQ.value > 0.02 && showPayoff.value < 0.02) {
        nodes.push(
          txt(
            'If a test only checks the predicted animal, will it catch the extra update?',
            0,
            355,
            32,
            ROLE.gold,
            'serif',
            'center',
          ).opacity(showQ.value),
        );
      }

      if (showPayoff.value > 0.02) {
        nodes.push(
          txt(
            'Both stay above 0 (both predict dog)  ->  compare hidden states directly!',
            0,
            355,
            32,
            ROLE.cell,
            'mono',
            'center',
          ).opacity(showPayoff.value),
        );
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.dog, ROLE.warn), title, ...staticNodes, liveLayer);

  playCue(s, c, 'pad-slot', (d) => s.play(showPadSlot.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'unmasked-ending', (d) => s.play(runProg.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'preserved-ending', (d) => s.play(skipProg.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'actor-padding-question', (d) => s.play(showQ.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(
    s,
    c,
    'opening-payoff',
    (d) => s.play(showQ.to(0, { duration: d * 0.4 }), showPayoff.to(1, { duration: d * 0.6 })),
    { dur: 0.55 },
  );
}
