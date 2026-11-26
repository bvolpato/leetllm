// Scene 9: normalized-stop: "A normalized prefix score can rise after extension"
// Dual aligned luminous trajectories: raw log score slips slightly left (-1.000 -> -1.01005)
// when appending a p = 0.99 token, while GNMT normalized score (alpha = 0.6) leaps right
// (-1.000 -> -0.9209) AFTER dec-normalized-improve, breaking monotone early-stop assumptions.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, decodeLengthScore, fmt, lumBar, playCue } from '../parts.mjs';

export default function normalizedStop(s, c) {
  const title = heroTitle(['A normalized score can', 'rise after extension'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.valid,
  });

  const appendT = s.value(0); // 0 -> 1 appends p = 0.99 token
  const improveT = s.value(0); // 0 -> 1 reveals normalized jump to -0.9209
  const warnVis = s.value(0);
  const stageVis = s.value(1);

  const rawEnd = -1 + Math.log(0.99); // -1.01005
  const normEnd = decodeLengthScore(rawEnd, 2, 0.6); // -0.92094

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const ap = appendT.value;
    const im = improveT.value;
    const rawCur = -1 + (rawEnd - -1) * ap;
    const normCur = -1 + (normEnd - -1) * im;
    const lenCur = ap > 0.5 ? 2 : 1;

    // Top live telemetry pills (length, raw score, appended token)
    nodes.push(
      lumBar(-560, -235, 340, 68, {
        color: ROLE.base,
        fillOpacity: 0.22,
        strokeWidth: 2.2,
        glow: 7,
        radius: 10,
        opacity: alpha,
      }),
      txt(`length L = ${lenCur}`, -560, -235, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
      lumBar(-50, -235, 560, 68, {
        color: ROLE.active,
        fillOpacity: 0.22,
        strokeWidth: 2.2,
        glow: 7,
        radius: 10,
        opacity: alpha,
      }),
      txt(`raw log P = ${fmt(rawCur, 5)}`, -50, -235, 30, ROLE.active, 'mono', 'center').opacity(
        alpha,
      ),
      lumBar(530, -235, 480, 68, {
        color: ap > 0.2 ? ROLE.winner : COSMOS.dim,
        fillOpacity: ap > 0.2 ? 0.24 : 0.08,
        strokeWidth: 2.2,
        glow: ap > 0.2 ? 9 : 2,
        radius: 10,
        opacity: alpha,
      }),
      txt(
        ap > 0.2 ? 'append p = 0.99 (+ln 0.99)' : 'awaiting next token',
        530,
        -235,
        28,
        ap > 0.2 ? ROLE.winner : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Aligned number lines: domain [-1.06, -0.88] -> x in [-430, 740]
    const xL = -430;
    const xR = 740;
    const mapX = (v) => xL + ((v - -1.06) / (-0.88 - -1.06)) * (xR - xL);
    const yRaw = -20;
    const yNorm = 185;

    // Shared reference ticks
    [-1.05, -1.0, -0.95, -0.9].forEach((tick) => {
      const tx = mapX(tick);
      nodes.push(
        line([tx, yRaw - 32], [tx, yNorm + 18], { stroke: '#233154', width: 1.5 }).opacity(
          0.65 * alpha,
        ),
        txt(fmt(tick, 2), tx, yRaw - 64, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    });

    // Track 1: Raw log score
    const xStart = mapX(-1.0);
    const xRaw = mapX(rawCur);
    nodes.push(
      txt('Raw log score', -470, yRaw, 32, ROLE.active, 'mono', 'right').opacity(alpha),
      line([xL, yRaw], [xR, yRaw], { stroke: '#4c6294', width: 3 }).opacity(alpha),
      glowDot(xStart, yRaw, { radius: 6, color: COSMOS.muted, glow: 4, opacity: 0.7 * alpha }),
      glowingTrail(
        [
          [xStart, yRaw],
          [xRaw, yRaw],
        ],
        { color: ROLE.pruned, width: 6, glow: 10, opacity: Math.max(0.2, ap) * alpha },
      ),
      glowDot(xRaw, yRaw, { radius: 11, color: ROLE.active, glow: 14, opacity: alpha }),
      txt(
        `${fmt(rawCur, 5)}${ap > 0.5 ? '  (fell slightly)' : ''}`,
        xRaw,
        yRaw + 54,
        28,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Track 2: Normalized score (alpha = 0.6)
    const xNorm = mapX(normCur);
    nodes.push(
      txt('Normalized (α = 0.6)', -470, yNorm, 32, ROLE.valid, 'mono', 'right').opacity(alpha),
      line([xL, yNorm], [xR, yNorm], { stroke: '#4c6294', width: 3 }).opacity(alpha),
      glowDot(xStart, yNorm, { radius: 6, color: COSMOS.muted, glow: 4, opacity: 0.7 * alpha }),
    );

    if (im > 0.06) {
      nodes.push(
        glowingTrail(
          [
            [xStart, yNorm],
            [xNorm, yNorm],
          ],
          {
            gradientColors: [ROLE.active, ROLE.valid, ROLE.winner],
            width: 6.5,
            glow: 14,
            opacity: alpha,
          },
        ),
        glowDot(xNorm, yNorm, { radius: 12, color: ROLE.valid, glow: 16, opacity: alpha }),
        txt(`${fmt(normCur, 4)}  (rose!)`, xNorm, yNorm + 68, 32, ROLE.valid, 'mono', 'center')
          .glow(8, ROLE.valid)
          .opacity(alpha),
      );
    } else {
      nodes.push(
        glowDot(xStart, yNorm, { radius: 10, color: ROLE.valid, glow: 12, opacity: alpha }),
        txt(
          ap > 0.4 ? 'L = 2 divisor grows -> normalized score = ?' : '-1.0000  (at L = 1)',
          xStart + 180,
          yNorm + 68,
          28,
          ap > 0.4 ? ROLE.winner : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    nodes.push(
      txt(
        warnVis.value > 0.3
          ? 'Early-stopping bounds must match the actual normalization rule.'
          : 'Raw log score can only fall along one prefix.',
        0,
        390,
        32,
        warnVis.value > 0.3 ? ROLE.winner : COSMOS.muted,
        'serif',
        'center',
      )
        .glow(warnVis.value > 0.3 ? 6 : 0, ROLE.winner)
        .opacity(alpha),
    );

    return nodes;
  });

  const denEq = glowTex('\\left(\\frac{5+2}{6}\\right)^{0.6} \\approx 1.0968', {
    x: 470,
    y: -385,
    size: 36,
    color: ROLE.valid,
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.valid), title, mainLayer);

  playCue(s, c, 'dec-normalized-stop-1', (d) => s.play(appendT.to(0.05, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-normalized-append', (d) => s.play(appendT.to(1, { duration: d })), {
    after: true,
    dur: 0.7,
  });
  c.show('dec-normalized-stop-2', denEq);
  playCue(s, c, 'dec-normalized-stop-2', (d) => s.play(warnVis.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'dec-normalized-improve', (d) => s.play(improveT.to(1, { duration: d })), {
    after: true,
    dur: 0.75,
  });
}
