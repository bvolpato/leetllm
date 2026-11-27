// Scene 05 (event-maturity): "When can we score these incidents?"
// Shared clock across 3 incidents A, B, C (usable @ min 8, min 9 prediction hold -> all 3 pending! -> min 10 page on B -> min 18 page on C) -> ITT timeout trap (2/3 vs 2/2).
import { line } from 'vizmatic/stage';
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  WARN_COLOR,
  aura,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function eventMaturity(s, c) {
  const clockMin = s.value(0);
  const showUsable = s.value(0);
  const showAsk = s.value(0);
  const showPending = s.value(0);
  const showPageB = s.value(0);
  const showScore = s.value(0);
  const showPageC = s.value(0);
  const showItt = s.value(0);
  const dropTimeout = s.value(0);
  const showAudit = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#3a183b18');
  const title = heroTitle(['Event Maturity Clock', '& Intention-to-Treat'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: WARN_COLOR,
    eyebrow: 'WINDOW MATURITY & DENOMINATOR INTEGRITY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const m = clockMin.value;
    const isItt = showItt.value > 0.5;
    const tLeft = -660;
    const tRight = 560;
    const xM = (min) => tLeft + (min / 20) * (tRight - tLeft);

    const nodes = [];

    // Part 1: 3 incident maturity tracks (A, B, C)
    const trackOp = Math.max(0, 1 - showItt.value * 2.6);
    if (trackOp > 0.02) {
      const rows = [
        { id: 'Inc A', y: -165, res: 'RESOLVED', col: GOOD_COLOR },
        { id: 'Inc B', y: -50, res: 'UNRESOLVED', col: BAD_COLOR },
        { id: 'Inc C', y: 65, res: 'RESOLVED (10m)', col: GOOD_COLOR },
      ];
      nodes.push(
        txt(
          `SHARED CLOCK:  t = ${m.toFixed(1)} min`,
          -855,
          -250,
          28,
          WARN_COLOR,
          'mono',
          'left',
        ).opacity(trackOp),
        line([xM(10), -210], [xM(10), 125], {
          stroke: WARN_COLOR,
          width: 4,
          dash: [9, 6],
        })
          .glow(7, WARN_COLOR)
          .opacity(trackOp),
        txt('10m DEADLINE', xM(10), -235, 26, WARN_COLOR, 'mono').opacity(trackOp),
        rule(tLeft, 125, tRight, 125, COSMOS.muted, 2.5).opacity(trackOp),
        ...[0, 8, 10, 18, 20].map((tk) =>
          txt(`${tk}m`, xM(tk), 160, 26, tk === 10 ? WARN_COLOR : COSMOS.muted, 'mono').opacity(
            trackOp,
          ),
        ),
        // Live vertical clock sweep line (stays strictly between track rows)
        line([xM(m), -185], [xM(m), 125], { stroke: CTRL_COLOR, width: 3 }).opacity(trackOp * 0.85),
      );

      rows.forEach((r, idx) => {
        const scored = showScore.value > 0.5;
        const badge = !scored ? (showPending.value > 0.5 ? 'PENDING' : 'OPEN') : r.res;
        const bCol = !scored ? WARN_COLOR : r.col;
        nodes.push(
          txt(r.id, -855, r.y, 28, COSMOS.ink, 'mono', 'left').opacity(trackOp),
          rule(tLeft, r.y, tRight, r.y, COSMOS.rule, 3).opacity(trackOp),
          glowDot(xM(m), r.y, { radius: 8.5, color: bCol, glow: 10, opacity: trackOp }),
          txt(badge, 600, r.y, 26, bCol, 'mono', 'left').opacity(trackOp),
        );
        if (showUsable.value > 0.2) {
          nodes.push(
            glowDot(xM(8), r.y, { radius: 7, color: GOOD_COLOR, glow: 8, opacity: trackOp }),
            txt('usable @ 8m', xM(8) - 16, -215, 26, GOOD_COLOR, 'mono', 'right').opacity(
              trackOp * (idx === 0 ? 1 : 0),
            ),
          );
        }
        if (idx === 1 && showPageB.value > 0.2) {
          nodes.push(
            glowDot(xM(10), r.y, { radius: 9.5, color: BAD_COLOR, glow: 12, opacity: trackOp }),
            txt('PAGE @ 10m', xM(10) - 22, r.y + 34, 26, BAD_COLOR, 'mono', 'right').opacity(
              trackOp,
            ),
          );
        }
        if (idx === 2 && showPageC.value > 0.2) {
          nodes.push(
            glowDot(xM(18), r.y, { radius: 9.5, color: WARN_COLOR, glow: 10, opacity: trackOp }),
            txt('late page @ 18m', xM(18) - 20, r.y - 30, 26, WARN_COLOR, 'mono', 'right').opacity(
              trackOp,
            ),
          );
        }
      });

      // Strict prediction withholding at min 9
      const askOp = showAsk.value * Math.max(0, 1 - showPending.value * 2.6) * trackOp;
      if (askOp > 0.02) {
        nodes.push(
          txt(
            'At minute 9, which of these three incidents can enter the final count?',
            -855,
            285,
            32,
            WARN_COLOR,
            'serif',
            'left',
          )
            .glow(7, WARN_COLOR)
            .opacity(askOp),
        );
      }
      const pendOp = Math.max(0, (showPending.value - 0.45) / 0.55) * trackOp;
      if (pendOp > 0.02) {
        nodes.push(
          txt(
            showScore.value > 0.5
              ? 'At min 10: A & C resolved, B failed (page at 10m). C’s min-18 page is outside the window.'
              : 'NONE yet: all three are PENDING until the 10-minute deadline closes!',
            -855,
            285,
            28,
            showScore.value > 0.5 ? GOOD_COLOR : WARN_COLOR,
            'sans',
            'left',
          ).opacity(pendOp),
        );
      }
    }

    // Part 2: Intention-to-treat timeout denominator trap
    const ittOp = Math.max(0, (showItt.value - 0.45) / 0.55);
    if (ittOp > 0.02) {
      const dropped = dropTimeout.value > 0.5;
      nodes.push(
        txt(
          'INTENTION-TO-TREAT: 3 ASSIGNED TREATMENT INCIDENTS',
          -855,
          -245,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(ittOp),
        lumBar(-565, -90, 520, 110, {
          color: GOOD_COLOR,
          fillOpacity: 0.18,
          glow: 7,
          opacity: ittOp,
        }),
        txt('Trt #1: Usable (Resolved = 1)', -565, -90, 26, GOOD_COLOR, 'mono').opacity(ittOp),

        lumBar(0, -90, 520, 110, { color: GOOD_COLOR, fillOpacity: 0.18, glow: 7, opacity: ittOp }),
        txt('Trt #2: Usable (Resolved = 1)', 0, -90, 26, GOOD_COLOR, 'mono').opacity(ittOp),

        lumBar(565, -90, 520, 110, {
          color: BAD_COLOR,
          fillOpacity: dropped ? 0.05 : 0.2,
          dash: dropped ? [8, 6] : undefined,
          glow: dropped ? 3 : 8,
          opacity: (dropped ? 0.35 : 1) * ittOp,
        }),
        txt(
          dropped ? 'Trt #3: DROPPED!' : 'Trt #3: Rewrite timeout (0)',
          565,
          -90,
          26,
          BAD_COLOR,
          'mono',
        ).opacity((dropped ? 0.45 : 1) * ittOp),

        txt(
          dropped
            ? 'Filtered rate:  2 / 2 = 100%  (BIASED: hides policy failure!)'
            : 'Intention-to-Treat rate:  2 / 3 = 66.7%  (keeps timeouts in denominator)',
          -855,
          95,
          32,
          dropped ? BAD_COLOR : GOOD_COLOR,
          'mono',
          'left',
        )
          .glow(7, dropped ? BAD_COLOR : GOOD_COLOR)
          .opacity(ittOp),
      );
      if (showAudit.value > 0.02) {
        nodes.push(
          txt(
            'Same discipline for latency & audits: declare how timeouts & sampled audits count before launch',
            -855,
            240,
            28,
            COSMOS.cyan,
            'sans',
            'left',
          ).opacity(showAudit.value * ittOp),
        );
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'eight', clockMin, 8, { duration: 0.7 });
  tweenCue(s, c, 'usable', showUsable, 1, { duration: 0.4 });
  tweenCue(s, c, 'nine', clockMin, 9, { duration: 0.4 });
  tweenCue(s, c, 'ask', showAsk, 1, { duration: 0.4 });
  tweenCue(s, c, 'pending', showPending, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'deadline', clockMin, 10, { duration: 0.55 });
  tweenCue(s, c, 'page', showPageB, 1, { duration: 0.4 });
  tweenCue(s, c, 'score', showScore, 1, { duration: 0.45 });
  tweenCue(s, c, 'later', clockMin, 18, { duration: 0.7 });
  tweenCue(s, c, 'late-page', showPageC, 1, { duration: 0.45 });

  tweenCue(s, c, 'three', showItt, 1, { duration: 0.55 });
  c.on('keep', () => s.play(dropTimeout.to(0, { duration: 0.2 })));
  tweenCue(s, c, 'drop', dropTimeout, 1, { duration: 0.45 });
  tweenCue(s, c, 'restore', dropTimeout, 0, { duration: 0.45 });
  tweenCue(s, c, 'audit', showAudit, 1, { duration: 0.45 });
}
