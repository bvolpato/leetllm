// Scene 22: test-time-budget: "What can change after training ends?"
// Fixed 8B weights monolith branching optical beams into 1 -> 4 -> 16 independent 512-token
// drafts (8.19e12 -> 3.28e13 -> 1.31e14 FLOPs), plus Snell et al.'s adaptive MATH trade-off.
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, arcPts, cinemaAtmosphere, lumBar, playCue, scenePulse } from '../parts.mjs';

export default function testTimeBudget(s, c) {
  const title = heroTitle(['What can change', 'after training ends?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.tokens,
  });

  const modeGlow = s.value(0); // sl-test-time-budget-0
  const draftCount = s.value(1); // 1 -> 4 -> 16
  const mathVis = s.value(0); // sl-test-time-budget-2
  const pulse = s.value(0);

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const k = Math.max(1, Math.min(16, Math.round(draftCount.value)));
    const mv = mathVis.value;
    const p = pulse.value;

    // Left: Frozen 8B model weights monolith
    const modelX = -655;
    const modelY = 5;
    nodes.push(
      lumBar(modelX, modelY, 270, 220, {
        color: ROLE.params,
        fillOpacity: 0.36,
        strokeWidth: 3,
        glow: 12 + 4 * modeGlow.value,
        radius: 10,
        opacity: alpha,
      }),
      txt('8B weights', modelX, modelY - 22, 36, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('FROZEN', modelX, modelY + 26, 28, ROLE.params, 'mono', 'center')
        .glow(6, ROLE.params)
        .opacity(alpha),
      txt('2N = 16B FLOPs/tok', modelX, modelY + 150, 26, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
    );

    // Center-right: 4x4 grid of 512-token candidate drafts
    const gridLeft = -240;
    const cellW = 240;
    const cellH = 74;
    const gapX = 28;
    const gapY = 26;
    const gridTop = -175;

    for (let i = 0; i < 16; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cx = gridLeft + col * (cellW + gapX) + cellW / 2;
      const cy = gridTop + row * (cellH + gapY) + cellH / 2;
      const lit = i < k;

      nodes.push(
        lumBar(cx, cy, cellW, cellH, {
          color: lit ? ROLE.tokens : COSMOS.dim,
          fillOpacity: lit ? 0.36 : 0.06,
          strokeWidth: lit ? 2.4 : 1.2,
          glow: lit ? 9 : 0,
          radius: 7,
          opacity: (lit ? 1 : 0.42) * alpha,
        }),
        txt(`Draft ${i + 1}`, cx, cy, 26, lit ? COSMOS.ink : COSMOS.dim, 'mono', 'center').opacity(
          alpha,
        ),
      );

      // Luminous optical supply beam from frozen 8B weights to first column of active rows
      if (lit && col === 0) {
        const pts = arcPts([modelX + 135, modelY], [cx - cellW / 2, cy], (row - 1.5) * 18, 22);
        nodes.push(
          glowingTrail(pts, {
            color: ROLE.tokens,
            width: 2.8,
            glow: 7,
            core: false,
            opacity: 0.72 * alpha,
          }),
        );
      }
    }

    // Live FLOPs readout
    const totalFlops = k * 512 * 16e9;
    const expStr = totalFlops.toExponential(2);
    nodes.push(
      txt(
        `${k} draft${k > 1 ? 's' : ''} × 512 tok × 16B FLOPs  =  ${expStr} FLOPs`,
        0,
        280,
        34,
        ROLE.compute,
        'mono',
        'center',
      )
        .glow(8, ROLE.compute)
        .opacity(alpha),
      txt(
        mv > 0.3
          ? 'Snell et al. (MATH): adaptive test-time compute matched a ~14× larger model'
          : 'Dense generation only  ·  prompt, attention & verifier scoring add extra work',
        0,
        355,
        28,
        mv > 0.3 ? ROLE.optimal : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(mv > 0.3 ? 6 : 0, ROLE.optimal)
        .opacity(alpha),
      glowDot(-450 + ((p * 2.2) % 1) * 900, 412, {
        radius: 5,
        color: mv > 0.3 ? ROLE.optimal : ROLE.tokens,
        glow: 10,
        opacity: 0.75 * alpha,
      }),
    );

    return nodes;
  });

  const eq = glowTex('C_{\\text{gen}} = 2 N L_{\\text{out}} k', {
    x: 520,
    y: -365,
    size: 40,
    color: ROLE.compute,
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.tokens), title, stageLayer, eq);
  scenePulse(s, c, pulse);

  playCue(s, c, 'sl-test-time-budget-0', (d) => s.play(modeGlow.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(
    s,
    c,
    'sl-test-time-budget-1',
    (d) => s.play(draftCount.to(1, { duration: Math.min(0.25, d) })),
    {
      dur: 0.25,
    },
  );
  playCue(s, c, 'draft-one', (d) => s.play(draftCount.to(1, { duration: Math.min(0.25, d) })), {
    dur: 0.25,
  });
  playCue(s, c, 'draft-four', (d) => s.play(draftCount.to(4, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'draft-sixteen', (d) => s.play(draftCount.to(16, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'sl-test-time-budget-2', (d) => s.play(mathVis.to(1, { duration: d })), {
    dur: 0.9,
  });
}
