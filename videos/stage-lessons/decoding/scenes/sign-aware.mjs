// Scene 21: sign-aware: "The sign branch moves seen logits downward"
// Signed zero-axis elevation visual for raw [2.4 (seen), -0.5 (seen), 0.7 (unseen)] with
// penalty theta = 1.2 and unique history {0, 1}. Shows positive dividing downward (2.4 -> 2.0),
// negative multiplying further downward (-0.5 -> -0.6), and unseen staying fixed (0.7 -> 0.7),
// revealing outputs AFTER dec-sign-values + MathJax piecewise rule.
import { line } from 'vizmatic/stage';
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  decodeRepetition,
  fmt,
  glowVector,
  lumBar,
  playCue,
} from '../parts.mjs';

export default function signAware(s, c) {
  const title = heroTitle(['Sign-aware repetition', 'moves seen logits down'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.alt,
  });

  const raw = [2.4, -0.5, 0.7];
  const out = decodeRepetition(raw, [0, 0, 1], 1.2);

  const showArrows = s.value(0.2);
  const showOut = s.value(0);
  const showRegimes = s.value(0);
  const showCaution = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const ar = showArrows.value;
    const done = showOut.value > 0.4;
    const reg = showRegimes.value;
    const caut = showCaution.value;

    nodes.push(
      txt(
        'history = [0, 0, 1]  ->  unique seen set {0, 1}   |   θ = 1.2',
        -845,
        -260,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Signed zero-axis elevation chart
    const zeroY = 125;
    const scaleY = 115; // 1 logit unit = 115 px
    const xs = [-520, 0, 520];
    const barW = 132;
    const labels = ['ID 0 (seen ×2)', 'ID 1 (seen ×1)', 'ID 2 (unseen)'];
    const ops = ['÷ 1.2', '× 1.2', 'unchanged'];

    // Zero baseline across frame
    nodes.push(
      line([-760, zeroY], [760, zeroY], { stroke: '#6c82b8', width: 2.8 }).opacity(alpha),
      txt('z = 0', -785, zeroY, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
    );

    raw.forEach((z0, i) => {
      const cx = xs[i];
      const z1 = out[i];
      const zCur = done ? z1 : z0;
      const h0 = Math.abs(z0) * scaleY;
      const y0Mid = z0 >= 0 ? zeroY - h0 / 2 : zeroY + h0 / 2;
      const hCur = Math.abs(zCur) * scaleY;
      const yCurMid = zCur >= 0 ? zeroY - hCur / 2 : zeroY + hCur / 2;
      const col = i === 2 ? ROLE.valid : i === 0 ? ROLE.base : ROLE.pruned;

      // Ghost original outline when transformed
      if (done && i < 2) {
        nodes.push(
          lumBar(cx - 88, y0Mid, barW * 0.72, h0, {
            color: COSMOS.dim,
            fillOpacity: 0.1,
            strokeWidth: 1.6,
            glow: 2,
            radius: 6,
            opacity: 0.55 * alpha,
          }),
          txt(
            fmt(z0, 1),
            cx - 88,
            z0 >= 0 ? zeroY - h0 - 28 : zeroY + h0 + 30,
            26,
            COSMOS.dim,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }

      // Active bar
      const activeX = done && i < 2 ? cx + 62 : cx;
      nodes.push(
        lumBar(activeX, yCurMid, barW, hCur, {
          color: done && i < 2 ? ROLE.winner : col,
          fillOpacity: 0.44,
          strokeWidth: 2.6,
          glow: 10,
          radius: 7,
          opacity: alpha,
        }),
        txt(
          done ? fmt(zCur, 1) : fmt(z0, 1),
          activeX,
          zCur >= 0 ? zeroY - hCur - 32 : zeroY + hCur + 34,
          32,
          done && i < 2 ? ROLE.winner : col,
          'mono',
          'center',
        )
          .glow(done ? 7 : 3, done && i < 2 ? ROLE.winner : col)
          .opacity(alpha),
        txt(labels[i], cx, -205, 30, col, 'mono', 'center').opacity(alpha),
        txt(ops[i], cx, 268, 30, i === 2 ? ROLE.valid : ROLE.alt, 'mono', 'center').opacity(
          Math.max(0.3, ar) * alpha,
        ),
      );

      // Downward shift arrow showing both seen tokens move DOWN
      if (i < 2 && ar > 0.25) {
        const ax = cx + 150;
        const ayTop = zeroY - z0 * scaleY;
        const ayBot = zeroY - z1 * scaleY;
        nodes.push(
          glowVector([ax, ayTop], [ax, ayBot + (ayBot - ayTop < 26 ? 26 : 0)], {
            color: ROLE.alt,
            width: 3.6,
            tipSize: 13,
            glow: 8,
            opacity: ar * alpha,
          }),
        );
      }
    });

    if (reg > 0.15 && caut < 0.35) {
      nodes.push(
        txt(
          'θ > 1 penalizes  ·  θ = 1 unchanged  ·  θ < 1 rewards  (once per unique ID)',
          0,
          345,
          28,
          ROLE.active,
          'mono',
          'center',
        ).opacity(reg * alpha),
      );
    }

    if (caut > 0.15) {
      nodes.push(
        txt(
          'CTRL-related runtime transform  |  watch repeated code names & cross-token probability shifts',
          0,
          400,
          28,
          ROLE.winner,
          'serif',
          'center',
        )
          .glow(6, ROLE.winner)
          .opacity(caut * alpha),
      );
    }

    return nodes;
  });

  const signEq = glowTex(
    "z'_i = \\begin{cases} z_i / \\theta & z_i > 0 \\\\ z_i \\cdot \\theta & z_i < 0 \\end{cases}",
    {
      x: 490,
      y: -365,
      size: 32,
      color: ROLE.alt,
    },
  );

  s.add(cinemaAtmosphere(ROLE.alt, ROLE.winner), title, signEq, mainLayer);

  playCue(s, c, 'dec-sign-aware-1', (d) => s.play(showArrows.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'dec-sign-values', (d) => s.play(showOut.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'dec-sign-aware-2', (d) => s.play(showRegimes.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'dec-sign-aware-3', (d) => s.play(showCaution.to(1, { duration: d })), {
    dur: 0.65,
  });
}
