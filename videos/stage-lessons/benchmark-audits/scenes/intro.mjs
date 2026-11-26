// Scene 01 (intro): "Which assistant should take the renewal desk?"
// Luminous 100-question constellation detaching Q91..Q100 renewals -> aligned 10-question comparison sheet.
import { par } from 'vizmatic/stage';
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
import { RENEWALS, drawRenewalSheet } from '../renewals.mjs';

const ALL_A = scoreCases('A');
const ALL_B = scoreCases('B');
const ORD_A = scoreCases('A', 'ordinary');
const ORD_B = scoreCases('B', 'ordinary');
const REN_A = scoreCases('A', 'renewal');
const REN_B = scoreCases('B', 'renewal');

export default function intro(s, c) {
  const phase = s.value(0);
  const pull = s.value(0);
  const tiedPulse = s.value(0);
  const modeSheet = s.value(0);
  const showOrdA = s.value(0);
  const showOrdB = s.value(0);
  const showAsk = s.value(0);
  const focusA = s.value(0);
  const showMarksA = s.value(0);
  const focusB = s.value(0);
  const showMarksB = s.value(0);
  const showQ93 = s.value(0);
  const showTasks = s.value(0);
  const showGrading = s.value(0);

  const bgAura = aura(300, 10, 620, '#2e221238', '#142a481e');
  const title = heroTitle(['Which Assistant Should', 'Take the Renewal Desk?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.accent,
    eyebrow: 'BENCHMARK AUDITS · HIDDEN SLICES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const m = modeSheet.value;
    const openOp = fadeOut(m);
    const sheetOp = fadeIn(m);
    const nodes = [];

    // ACT 1: 100-question constellation with Q91..Q100 detaching smoothly downward
    if (openOp > 0.02) {
      const tp = tiedPulse.value;
      nodes.push(
        metricReadout('ASSISTANT A · OVERALL', `${ALL_A.correct}/${ALL_A.total}`, {
          x: -855,
          y: -160,
          valueSize: 78,
          color: ROLE.A,
          glow: 10 + 6 * tp,
          sub: '90.0% across 100 library cases',
        }).opacity(openOp),
        metricReadout('ASSISTANT B · OVERALL', `${ALL_B.correct}/${ALL_B.total}`, {
          x: -855,
          y: 110,
          valueSize: 78,
          color: ROLE.B,
          glow: 10 + 6 * tp,
          sub: '90.0% across 100 library cases',
        }).opacity(openOp),
      );
      if (tp > 0.02) {
        nodes.push(
          lumBar(-896, -90, 6, 175, {
            color: ROLE.focus,
            fillOpacity: 0.9,
            strokeWidth: 0,
            glow: 10 * pulse,
            radius: 3,
            opacity: openOp * tp,
          }),
          lumBar(-896, 180, 6, 175, {
            color: ROLE.focus,
            fillOpacity: 0.9,
            strokeWidth: 0,
            glow: 10 * pulse,
            radius: 3,
            opacity: openOp * tp,
          }),
        );
      }

      // Right 10x10 glowing case constellation (Q1..Q100)
      const gLeft = -80;
      const gTop = -275;
      const stepX = 94;
      const stepY = 58;
      nodes.push(
        txt(
          '100 LIBRARY QUESTIONS (Q1 TO Q100)',
          gLeft + 425,
          -345,
          26,
          COSMOS.cyan,
          'mono',
        ).opacity(openOp),
      );

      CASES.forEach((item, idx) => {
        const col = idx % 10;
        const row = Math.floor(idx / 10);
        const isRen = item.category === 'renewal';
        const cx = gLeft + col * stepX;
        const cy = gTop + row * stepY + (isRen ? pull.value * 92 : 0);
        nodes.push(
          lumBar(cx, cy, 80, 44, {
            color: isRen ? ROLE.focus : COSMOS.dim,
            fillOpacity: isRen ? 0.44 : 0.16,
            strokeWidth: isRen ? 2.6 : 1.4,
            glow: isRen ? 10 * pulse : 2,
            radius: 6,
            opacity: openOp,
          }),
        );
        if (isRen) {
          nodes.push(txt(item.id, cx, cy, 26, COSMOS.ink, 'mono').opacity(openOp));
        }
      });

      const renY = gTop + 9 * stepY + pull.value * 92 + 64;
      nodes.push(
        txt('10 RENEWAL REQUESTS (Q91 TO Q100)', gLeft + 425, renY, 28, ROLE.focus, 'mono')
          .glow(6, ROLE.focus)
          .opacity(openOp),
      );
    }

    // ACT 2: Aligned 10-question renewal sheet for A & B
    if (sheetOp > 0.02) {
      const q93 = showQ93.value;
      const tsk = showTasks.value;
      const grd = showGrading.value;
      const hiIdx = tsk > 0.5 && q93 < 0.5 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : q93 > 0.02 ? [2] : [];
      const hiOp = Math.max(q93, tsk);

      const sheet = drawRenewalSheet({
        left: -835,
        top: -150,
        rowGap: 158,
        showOrdinaryA: showOrdA.value,
        showOrdinaryB: showOrdB.value,
        showMarksA: showMarksA.value,
        showMarksB: showMarksB.value,
        highlightIndices: hiIdx,
        highlightColor: ROLE.focus,
        highlightOpacity: hiOp,
        focusA: focusA.value,
        focusB: focusB.value,
        opacity: sheetOp,
        pulse,
      });
      nodes.push(...sheet.nodes);

      // Computed renewal counts (strictly after count-a / count-b)
      if (showMarksA.value > 0.02) {
        nodes.push(
          txt(
            `A:  ${ALL_A.correct} - ${ORD_A.correct} = ${REN_A.correct} / ${RENEWALS.length} renewals`,
            -420,
            215,
            34,
            ROLE.A,
            'mono',
          )
            .glow(6, ROLE.A)
            .opacity(sheetOp * showMarksA.value),
        );
      }
      if (showMarksB.value > 0.02) {
        nodes.push(
          txt(
            `B:  ${ALL_B.correct} - ${ORD_B.correct} = ${REN_B.correct} / ${RENEWALS.length} renewals`,
            380,
            215,
            34,
            ROLE.B,
            'mono',
          )
            .glow(6, ROLE.B)
            .opacity(sheetOp * showMarksB.value),
        );
      }

      // Bottom prompt/insight slot with strict non-overlapping crossfade
      const askOp = showAsk.value * fadeOut(q93) * fadeOut(tsk) * fadeOut(grd);
      const q93Op = fadeIn(q93) * fadeOut(tsk) * fadeOut(grd);
      const tskOp = fadeIn(tsk) * fadeOut(grd);
      const grdOp = fadeIn(grd);

      if (askOp > 0.02) {
        nodes.push(
          txt('Who answered more renewals correctly?', 0, 335, 40, ROLE.focus, 'serif')
            .glow(8, ROLE.focus)
            .opacity(sheetOp * askOp),
        );
      }
      if (q93Op > 0.02) {
        nodes.push(
          txt(
            'Q93: same renewal request · Assistant A missed · Assistant B passed',
            0,
            335,
            34,
            ROLE.focus,
            'sans',
          )
            .glow(7, ROLE.focus)
            .opacity(sheetOp * q93Op),
        );
      }
      if (tskOp > 0.02) {
        nodes.push(
          txt('Tasks decide what we ask', 0, 335, 36, ROLE.focus, 'sans')
            .glow(7, ROLE.focus)
            .opacity(sheetOp * tskOp),
        );
      }
      if (grdOp > 0.02) {
        nodes.push(
          txt(
            'Tasks decide what we ask · Scoring rule decides which answers count',
            0,
            335,
            34,
            ROLE.accent,
            'sans',
          )
            .glow(7, ROLE.accent)
            .opacity(sheetOp * grdOp),
        );
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  // Pull renewals downward during the opening beat
  c.at(0.15, () => {
    s.play(pull.to(1, { duration: 1.2 }));
  });
  tweenCue(s, c, 'tied-scores', tiedPulse, 1, { duration: 0.45 });
  tweenCue(s, c, 'renewal-file', modeSheet, 1, { duration: 0.6 });
  tweenCue(s, c, 'ordinary-a', showOrdA, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ordinary-b', showOrdB, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ask-renewals', showAsk, 1, { duration: 0.45 });
  tweenCue(s, c, 'open-a', focusA, 1, { duration: 0.35 });
  tweenCue(s, c, 'count-a', showMarksA, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'open-b', focusB, 1, { duration: 0.35 });
  tweenCue(s, c, 'count-b', showMarksB, 1, { duration: 0.45, after: true });
  c.on('one-renewal', () => {
    s.play(par(showAsk.to(0, { duration: 0.15 }), showQ93.to(1, { duration: 0.45 })));
  });
  c.on('tasks', () => {
    s.play(par(showQ93.to(0, { duration: 0.25 }), showTasks.to(1, { duration: 0.4 })));
  });
  tweenCue(s, c, 'grading', showGrading, 1, { duration: 0.5 });
}
