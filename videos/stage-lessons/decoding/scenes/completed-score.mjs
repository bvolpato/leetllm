// Scene 7: completed-score: "Score the ending event and retain the stop reason"
// Extends "degraded ." (0.180) and "in recovery" (0.270) with explicit EOS edges (0.9 vs 0.5),
// withholding completed products (0.162 vs 0.135) until AFTER dec-eos-products, then contrasting
// complete-only vs prefix-allowed stop-reason contracts.
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, fmt, lumBar, playCue } from '../parts.mjs';

export default function completedScore(s, c) {
  const title = heroTitle(['Score the ending event', '& keep the stop reason'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.winner,
  });

  const showEos = s.value(0.25);
  const showCompleted = s.value(0);
  const showContracts = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const eos = showEos.value;
    const comp = showCompleted.value > 0.4;
    const cont = showContracts.value;

    const rows = [
      {
        label: 'degraded .',
        prefix: 0.18,
        eosP: 0.9,
        finalP: 0.162,
        y: -155,
        col: ROLE.base,
        winsAfter: true,
      },
      {
        label: 'in recovery',
        prefix: 0.27,
        eosP: 0.5,
        finalP: 0.135,
        y: 35,
        col: ROLE.valid,
        winsAfter: false,
      },
    ];

    nodes.push(
      txt('Prefix score', -620, -255, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('EOS event', -100, -255, 26, ROLE.active, 'mono', 'center').opacity(alpha),
      txt('Completed score', 525, -255, 26, ROLE.winner, 'mono', 'center').opacity(alpha),
    );

    rows.forEach((row) => {
      const y = row.y;
      const winCol = comp && row.winsAfter ? ROLE.winner : row.col;

      // Prefix pill
      nodes.push(
        lumBar(-620, y, 420, 78, {
          color: row.col,
          fillOpacity: 0.24,
          strokeWidth: 2.4,
          glow: 8,
          radius: 12,
          opacity: alpha,
        }),
        txt(
          `${row.label}  (${fmt(row.prefix, 2)})`,
          -620,
          y,
          30,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        // Glowing edge to EOS
        glowingTrail(
          [
            [-405, y],
            [-235, y],
          ],
          { color: ROLE.active, width: 3.6, glow: 8, opacity: Math.max(0.3, eos) * alpha },
        ),
        // EOS edge pill
        lumBar(-100, y, 250, 74, {
          color: ROLE.active,
          fillOpacity: 0.22 * eos,
          strokeWidth: 2.4,
          glow: 9 * eos,
          radius: 37,
          opacity: Math.max(0.3, eos) * alpha,
        }),
        txt(`× EOS ${fmt(row.eosP, 1)}`, -100, y, 30, ROLE.active, 'mono', 'center').opacity(
          Math.max(0.3, eos) * alpha,
        ),
        // Glowing edge to Completed bar
        glowingTrail(
          [
            [30, y],
            [215, y],
          ],
          { color: comp ? winCol : COSMOS.dim, width: 3.6, glow: comp ? 10 : 3, opacity: alpha },
        ),
      );

      // Completed probability bar + value
      const barL = 230;
      const barMaxW = 390;
      const w = comp ? (row.finalP / 0.2) * barMaxW : 0;
      nodes.push(
        lumBar(barL + barMaxW / 2, y, barMaxW, 44, {
          color: '#2b395e',
          fillOpacity: 0.16,
          strokeWidth: 1.6,
          glow: 2,
          radius: 7,
          opacity: alpha,
        }),
      );
      if (comp) {
        nodes.push(
          lumBar(barL + w / 2, y, Math.max(12, w), 38, {
            color: winCol,
            fillOpacity: row.winsAfter ? 0.58 : 0.34,
            strokeWidth: row.winsAfter ? 3.0 : 2.0,
            glow: row.winsAfter ? 12 : 6,
            radius: 6,
            opacity: alpha,
          }),
          txt(fmt(row.finalP, 3), barL + barMaxW + 30, y, 34, winCol, 'mono', 'left')
            .glow(row.winsAfter ? 8 : 3, winCol)
            .opacity(alpha),
        );
      } else {
        nodes.push(
          txt('?', barL + barMaxW + 40, y, 36, COSMOS.muted, 'mono', 'left').opacity(alpha),
        );
      }
    });

    if (comp && cont < 0.25) {
      nodes.push(
        txt(
          'Scoring EOS reverses the ranking: 0.162 > 0.135  |  output limit has no EOS',
          0,
          175,
          30,
          ROLE.winner,
          'serif',
          'center',
        )
          .glow(6, ROLE.winner)
          .opacity(alpha),
      );
    }

    // Beat 2: Two side-by-side return-contract rails (EOS vs Length-limit)
    if (cont > 0.08) {
      const ry = 250;
      nodes.push(
        glowingTrail(
          [
            [-800, ry - 30],
            [-60, ry - 30],
          ],
          { color: ROLE.valid, width: 4.5, glow: 10, opacity: cont * alpha },
        ),
        glowDot(-800, ry - 30, { radius: 7, color: ROLE.valid, glow: 12, opacity: cont * alpha }),
        txt(
          'EOS observed  |  complete response',
          -430,
          ry + 16,
          30,
          ROLE.valid,
          'mono',
          'center',
        ).opacity(cont * alpha),
        txt(
          'Complete-only decoder accepts only scored EOS',
          -430,
          ry + 62,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(cont * alpha),
        glowingTrail(
          [
            [60, ry - 30],
            [800, ry - 30],
          ],
          { color: ROLE.pruned, width: 4.5, glow: 10, opacity: cont * alpha },
        ),
        glowDot(800, ry - 30, { radius: 7, color: ROLE.pruned, glow: 12, opacity: cont * alpha }),
        txt(
          'Budget reached  |  truncated prefix',
          430,
          ry + 16,
          30,
          ROLE.pruned,
          'mono',
          'center',
        ).opacity(cont * alpha),
        txt(
          'Retain stop_reason; never invent an unscored EOS',
          430,
          ry + 62,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(cont * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.winner), title, mainLayer);

  playCue(s, c, 'dec-completed-score-1', (d) => s.play(showEos.to(1, { duration: d })), {
    dur: 0.75,
  });
  playCue(s, c, 'dec-completed-score-2', (d) => s.play(showEos.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-eos-products', (d) => s.play(showCompleted.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'dec-completed-score-3', (d) => s.play(showContracts.to(1, { duration: d })), {
    dur: 0.7,
  });
}
