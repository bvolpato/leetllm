// Scene 5: status-model: "Text likelihood and observed status answer different questions"
// View 1 (Beat 0): 12-token supplied status row (degraded 0.45, in 0.30, on 0.15, broken 0.02,
//   8 separate 0.01 tail IDs) rendered as luminous probability bars.
// View 2 (Beats 1-2): Two-step status branches ("degraded -> ." vs "in -> recovery") with
//   products withheld until dec-status-products, then separated from live telemetry evidence.
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  STATUS_IDS,
  STATUS_ROW,
  branchPts,
  cinemaAtmosphere,
  fmt,
  glowRing,
  lumBar,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function statusModel(s, c) {
  const title = heroTitle(['Text likelihood vs', 'observed status'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const vRow = s.value(1);
  const vBranch = s.value(0);

  const revealCount = s.value(4); // 4 -> 12 tokens sweeping in
  const showProds = s.value(0);
  const showTelemetry = s.value(0);

  // VIEW 1: 12-token supplied distribution
  const rowLayer = guardedDynamic(vRow, (alpha) => {
    const nodes = [];
    const nShown = Math.round(Math.max(1, Math.min(12, revealCount.value)));

    nodes.push(
      txt(
        'Prefix: "The canary status is ..."',
        -845,
        -265,
        32,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(alpha),
      txt('12 separate tokens  |  sum = 1.00', 845, -265, 28, ROLE.active, 'mono', 'right').opacity(
        alpha,
      ),
    );

    // Top 4 named tokens as wide glowing bars on left
    const barL = -585;
    const barMaxW = 540;
    for (let i = 0; i < Math.min(4, nShown); i++) {
      const y = -155 + i * 110;
      const p = STATUS_ROW[i];
      const col = i === 0 ? ROLE.base : i === 1 ? ROLE.valid : i === 2 ? ROLE.active : ROLE.alt;
      const w = Math.max(14, (p / 0.5) * barMaxW);
      nodes.push(
        txt(STATUS_IDS[i], barL - 28, y, 32, col, 'mono', 'right').opacity(alpha),
        lumBar(barL + barMaxW / 2, y, barMaxW, 44, {
          color: '#2b395e',
          fillOpacity: 0.16,
          strokeWidth: 1.5,
          glow: 2,
          radius: 7,
          opacity: alpha,
        }),
        lumBar(barL + w / 2, y, w, 40, {
          color: col,
          fillOpacity: 0.48,
          strokeWidth: 2.5,
          glow: 10,
          radius: 7,
          opacity: alpha,
        }),
        txt(fmt(p, 2), barL + barMaxW + 26, y, 30, COSMOS.ink, 'mono', 'left').opacity(alpha),
      );
    }

    // Right constellation: 8 individual 0.01 tail tokens (2x4 luminous pills)
    nodes.push(
      txt('8 rare tail IDs (0.01 each)', 555, -190, 28, ROLE.heat, 'mono', 'center').opacity(alpha),
    );
    for (let t = 0; t < 8; t++) {
      const idx = 4 + t;
      const lit = idx < nShown;
      const tx = 395 + (t % 2) * 320;
      const ty = -105 + Math.floor(t / 2) * 105;
      nodes.push(
        lumBar(tx, ty, 260, 62, {
          color: lit ? ROLE.heat : COSMOS.dim,
          fillOpacity: lit ? 0.24 : 0.08,
          strokeWidth: lit ? 2.2 : 1.3,
          glow: lit ? 8 : 2,
          radius: 10,
          opacity: (lit ? 1 : 0.4) * alpha,
        }),
        txt(
          `tail ${t + 1} · 0.01`,
          tx,
          ty,
          26,
          lit ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    nodes.push(
      txt(
        'Each displayed word is one token; the 8 tail IDs remain 8 separate events.',
        0,
        395,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Two-step branch products + telemetry separation
  const branchLayer = guardedDynamic(vBranch, (alpha) => {
    const nodes = [];
    const prodReady = showProds.value > 0.4;
    const tel = showTelemetry.value;

    // Root node
    const rootPos = [-735, -60];
    nodes.push(
      glowRing(rootPos[0], rootPos[1], 56, ROLE.active, {
        width: 3,
        glow: 11,
        fillOpacity: 0.16,
        opacity: alpha,
      }),
      txt('status is', rootPos[0], rootPos[1], 28, COSMOS.ink, 'serif', 'center').opacity(alpha),
    );

    const paths = [
      {
        w1: 'degraded',
        p1: 0.45,
        w2: 'period (.)',
        p2: 0.4,
        prod: 0.18,
        y: -185,
        col: ROLE.base,
        tag: 'Greedy path',
      },
      {
        w1: 'in',
        p1: 0.3,
        w2: 'recovery',
        p2: 0.9,
        prod: 0.27,
        y: 65,
        col: ROLE.valid,
        tag: 'Higher product',
      },
    ];

    paths.forEach((row) => {
      const mX = -380;
      const lX = 20;
      const rX = 540;
      nodes.push(
        glowingTrail(branchPts([rootPos[0] + 58, rootPos[1]], [mX - 115, row.y]), {
          color: row.col,
          width: 4,
          glow: 9,
          opacity: alpha,
        }),
        lumBar(mX, row.y, 230, 68, {
          color: row.col,
          fillOpacity: 0.24,
          strokeWidth: 2.5,
          glow: 8,
          radius: 34,
          opacity: alpha,
        }),
        txt(`${row.w1} ${fmt(row.p1, 2)}`, mX, row.y, 28, COSMOS.ink, 'mono', 'center').opacity(
          alpha,
        ),
        glowingTrail(branchPts([mX + 115, row.y], [lX - 135, row.y]), {
          color: row.col,
          width: 4,
          glow: 9,
          opacity: alpha,
        }),
        lumBar(lX, row.y, 270, 68, {
          color: row.col,
          fillOpacity: 0.24,
          strokeWidth: 2.5,
          glow: 8,
          radius: 34,
          opacity: alpha,
        }),
        txt(`${row.w2} ${fmt(row.p2, 2)}`, lX, row.y, 28, COSMOS.ink, 'mono', 'center').opacity(
          alpha,
        ),
        glowingTrail(
          [
            [lX + 145, row.y],
            [rX - 175, row.y],
          ],
          { color: prodReady ? ROLE.winner : COSMOS.dim, width: 3.2, glow: 6, opacity: alpha },
        ),
        lumBar(rX, row.y, 330, 74, {
          color: prodReady ? (row.prod > 0.2 ? ROLE.winner : row.col) : COSMOS.dim,
          fillOpacity: prodReady ? 0.3 : 0.1,
          strokeWidth: prodReady ? 3 : 1.8,
          glow: prodReady ? 10 : 3,
          radius: 12,
          opacity: alpha,
        }),
        txt(
          prodReady
            ? `${fmt(row.p1, 2)} × ${fmt(row.p2, 2)} = ${fmt(row.prod, 2)}`
            : `${fmt(row.p1, 2)} × ${fmt(row.p2, 2)} = ?`,
          rX,
          row.y,
          28,
          prodReady ? (row.prod > 0.2 ? ROLE.winner : COSMOS.ink) : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Beat 2: Separate channel lines for Model Likelihood vs Observed Telemetry
    if (tel > 0.08) {
      const chY = 270;
      nodes.push(
        glowingTrail(
          [
            [-780, chY - 26],
            [-80, chY - 26],
          ],
          { color: ROLE.valid, width: 4, glow: 9, opacity: tel * alpha },
        ),
        glowDot(-780, chY - 26, { radius: 7, color: ROLE.valid, glow: 10, opacity: tel * alpha }),
        txt(
          'Model text ranking: "in recovery" (0.27)',
          -430,
          chY + 22,
          30,
          ROLE.valid,
          'serif',
          'center',
        ).opacity(tel * alpha),
        glowingTrail(
          [
            [80, chY - 26],
            [780, chY - 26],
          ],
          { color: ROLE.heat, width: 4, glow: 9, opacity: tel * alpha },
        ),
        glowDot(780, chY - 26, { radius: 7, color: ROLE.heat, glow: 10, opacity: tel * alpha }),
        txt(
          'Actual canary state: read deployment telemetry',
          430,
          chY + 22,
          30,
          ROLE.heat,
          'serif',
          'center',
        ).opacity(tel * alpha),
        txt(
          'A grammar constrains shape; only telemetry verifies real state.',
          0,
          395,
          30,
          ROLE.winner,
          'serif',
          'center',
        )
          .glow(6, ROLE.winner)
          .opacity(tel * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Path probability = product of conditional token probabilities.',
          0,
          350,
          30,
          COSMOS.muted,
          'serif',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.valid), title, rowLayer, branchLayer);

  playCue(s, c, 'dec-status-model-1', (d) => s.play(revealCount.to(12, { duration: d })), {
    dur: 1.4,
  });

  c.onBeat(1, () => s.play(swapVis(vRow, vBranch, 0.55)));
  playCue(s, c, 'dec-status-model-2', (d) => s.play(showProds.to(0.15, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'dec-status-products', (d) => s.play(showProds.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'dec-status-model-3', (d) => s.play(showTelemetry.to(1, { duration: d })), {
    dur: 0.7,
  });
}
