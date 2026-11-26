// Scene 24 (synthesis): "What would you write beside ninety percent?"
// Complete library handoff: 90/100 headline -> 9/10 renewals vs 8/10 floor -> retained Q100 miss -> reproducible audit trail.
import {
  CASES,
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  metricReadout,
  runAmbientPhase,
  scoreCases,
  tweenCue,
  txt,
} from '../parts.mjs';

const TOTAL_B = scoreCases('B');
const RENEWALS = CASES.filter((r) => r.category === 'renewal');
const PASSES_B = RENEWALS.filter((r) => r.B).length; // 9

export default function synthesis(s, c) {
  const phase = s.value(0);
  const showAsk = s.value(0);
  const showCount = s.value(0);
  const showFloor = s.value(0);
  const liftMiss = s.value(0);
  const showScope = s.value(0);
  const showRecord = s.value(0);
  const showRegression = s.value(0);

  const bgAura = aura(0, 20, 620, '#14384436', '#2e221420');
  const title = heroTitle(['What Would You Write', 'Beside Ninety Percent?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.accent,
    eyebrow: 'SYNTHESIS · INSPECTABLE RELEASE HANDOFF',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const cnt = showCount.value;
    const flr = showFloor.value;
    const miss = liftMiss.value;
    const nodes = [];

    // Top-right headline metric (always visible from t=0)
    nodes.push(
      metricReadout('LIBRARY ASSISTANT B · HEADLINE', `${TOTAL_B.correct} / ${TOTAL_B.total}`, {
        x: 855,
        y: -430,
        valueSize: 64,
        color: ROLE.B,
        glow: 10,
        sub: '90.0% overall across 100 cases',
        anchor: 'right',
      }),
    );

    // Prediction prompt before count reveal (strictly non-overlapping with slips/readout)
    const askOp = (0.35 + 0.65 * showAsk.value) * fadeOut(cnt);
    if (askOp > 0.02) {
      nodes.push(
        lumBar(0, -10, 1240, 210, {
          color: ROLE.focus,
          fillOpacity: 0.1,
          strokeWidth: 2.2,
          glow: 7,
          radius: 14,
          opacity: askOp,
        }),
        txt(
          'A colleague asks: can Assistant B handle renewals?',
          0,
          -45,
          38,
          COSMOS.ink,
          'serif',
        ).opacity(askOp),
        txt('What evidence must sit beside that 90% number?', 0, 25, 38, ROLE.focus, 'serif')
          .glow(8, ROLE.focus)
          .opacity(askOp),
      );
    }

    // Revealed 10 renewal slips (Q91..Q100) + Q100 lifting down into retained inspection chamber
    const cntOp = fadeIn(cnt);
    if (cntOp > 0.02) {
      const startX = -765;
      const stepX = 170;
      const rowY = -135;

      RENEWALS.forEach((item, i) => {
        const isMiss = !item.B; // Q100
        const baseX = startX + i * stepX;
        const easeM = miss * miss * (3 - 2 * miss);
        const cx = isMiss ? baseX + (660 - baseX) * easeM : baseX;
        const cy = isMiss ? rowY + (115 - rowY) * easeM : rowY;
        const col = isMiss ? ROLE.fail : ROLE.pass;
        nodes.push(
          lumBar(cx, cy, 146, 78, {
            color: col,
            fillOpacity: isMiss ? 0.28 : 0.2,
            strokeWidth: isMiss ? 3.0 : 2.2,
            glow: isMiss ? 12 * pulse : 7,
            radius: 10,
            opacity: cntOp,
          }),
          txt(`${item.id} ${isMiss ? '×' : '✓'}`, cx, cy, 30, col, 'mono').opacity(cntOp),
        );
      });

      // Left readout: 9/10 renewals + 8/10 predeclared requirement
      nodes.push(
        txt('RENEWAL SLICE SCORE', -440, 35, 26, COSMOS.muted, 'mono').opacity(cntOp),
        txt(`${PASSES_B} / ${RENEWALS.length} passed`, -440, 102, 54, ROLE.pass, 'mono')
          .glow(9, ROLE.pass)
          .opacity(cntOp),
      );
      if (flr > 0.02) {
        nodes.push(
          txt('Predeclared library floor: 8 / 10 (CLEARED)', -440, 182, 28, ROLE.focus, 'mono')
            .glow(6, ROLE.focus)
            .opacity(cntOp * flr),
        );
      }

      // Right readout: Q100 retained failure inspection (strictly left of Q100 descent path)
      if (miss > 0.02) {
        nodes.push(
          txt('RETAINED MISS FOR REVIEW', 275, 82, 26, ROLE.fail, 'mono')
            .glow(6, ROLE.fail)
            .opacity(cntOp * miss),
          txt('Keep Q100 + answer to verify scorer', 275, 142, 26, COSMOS.muted, 'sans').opacity(
            cntOp * miss,
          ),
        );
      }
    }

    // Bottom 3-step handoff trail (strictly non-overlapping crossfades)
    const scOp = showScope.value * fadeOut(showRecord.value) * fadeOut(showRegression.value);
    const recOp = fadeIn(showRecord.value) * fadeOut(showRegression.value);
    const regOp = fadeIn(showRegression.value);

    if (scOp > 0.02) {
      nodes.push(
        txt(
          'Point estimate settled on these 10 renewal cases (not a substitute for larger CI bounds)',
          0,
          345,
          30,
          COSMOS.muted,
          'sans',
        ).opacity(scOp),
      );
    }
    if (recOp > 0.02) {
      nodes.push(
        txt(
          'To reproduce: retain input, actual output, frozen scoring rule, and full attempt cost',
          0,
          345,
          32,
          ROLE.A,
          'sans',
        )
          .glow(7, ROLE.A)
          .opacity(recOp),
      );
    }
    if (regOp > 0.02) {
      nodes.push(
        txt(
          'Any case used to improve the scorer moves permanently into regression · next: fresh desk',
          0,
          345,
          32,
          ROLE.exposed,
          'sans',
        )
          .glow(8, ROLE.exposed)
          .opacity(regOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'summary-ask', showAsk, 1, { duration: 0.4 });
  tweenCue(s, c, 'summary-count', showCount, 1, { duration: 0.5, after: true });
  tweenCue(s, c, 'summary-floor', showFloor, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'summary-miss', liftMiss, 1, { duration: 0.75 });
  tweenCue(s, c, 'summary-scope', showScope, 1, { duration: 0.45 });
  tweenCue(s, c, 'summary-record', showRecord, 1, { duration: 0.45 });
  tweenCue(s, c, 'summary-regression', showRegression, 1, { duration: 0.45, after: true });
}
