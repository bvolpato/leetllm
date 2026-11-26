// Scene 12 (slices): "Where did the seven extra renewal passes come from?"
// Aligned Q91..Q100 renewal rows with +7/-7 conservation balance and 8/10 critical slice gate.
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  scoreCases,
  tweenCue,
  txt,
} from '../parts.mjs';
import { drawRenewalSheet } from '../renewals.mjs';

const DIFF_REN = scoreCases('B', 'renewal').correct - scoreCases('A', 'renewal').correct; // +7
const DIFF_ORD = scoreCases('B', 'ordinary').correct - scoreCases('A', 'ordinary').correct; // -7

export default function slices(s, c) {
  const phase = s.value(0);
  const openSheet = s.value(0);
  const hiMode = s.value(0); // 1=shared pass, 2=shared miss, 3=switches, 4=shared failure Q100
  const showGain = s.value(0);
  const showAsk = s.value(0);
  const showOrd = s.value(0);
  const showLoss = s.value(0);
  const showNet = s.value(0);
  const showFloor = s.value(0);
  const showGate = s.value(0);

  const bgAura = aura(0, 40, 620, '#13384434', '#2c221420');
  const title = heroTitle(['Where Did the Seven Extra', 'Renewal Passes Come From?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.pass,
    eyebrow: 'SLICE ACCOUNTING · CONSERVATION OF NET GAIN',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const mode = Math.round(hiMode.value);
    const nodes = [];

    const hiIdx =
      mode === 1
        ? [0, 1]
        : mode === 2 || mode === 4
          ? [9]
          : mode === 3
            ? [2, 3, 4, 5, 6, 7, 8]
            : [];
    const hiCol = mode === 2 || mode === 4 ? ROLE.fail : mode === 3 ? ROLE.pass : ROLE.focus;

    // Top-right rule indicator (crossfades from same-100 lock to 8/10 requirement)
    const lockOp = fadeOut(showFloor.value);
    const flrOp = fadeIn(showFloor.value);
    if (lockOp > 0.02) {
      nodes.push(
        txt('SAME 100 LIBRARY QUESTIONS', 855, -395, 28, COSMOS.muted, 'mono', 'right').opacity(
          lockOp,
        ),
        txt('Both totals: 90 / 100', 855, -348, 30, ROLE.A, 'mono', 'right').opacity(lockOp),
      );
    }
    if (flrOp > 0.02) {
      nodes.push(
        txt('PREDECLARED RENEWAL GATE', 855, -395, 28, ROLE.focus, 'mono', 'right')
          .glow(6, ROLE.focus)
          .opacity(flrOp),
        txt('Minimum 8 / 10 renewals', 855, -348, 32, ROLE.focus, 'mono', 'right').opacity(flrOp),
      );
    }

    const sheet = drawRenewalSheet({
      left: -835,
      top: -155,
      rowGap: 155,
      showOrdinaryA: showOrd.value,
      showOrdinaryB: showOrd.value,
      showMarksA: 0.35 + 0.65 * openSheet.value,
      showMarksB: 0.35 + 0.65 * openSheet.value,
      highlightIndices: hiIdx,
      highlightColor: hiCol,
      highlightOpacity: mode > 0 ? 1 : 0,
      opacity: 1,
      pulse,
    });
    nodes.push(...sheet.nodes);

    // Conservation balance row at y = 215
    if (showLoss.value > 0.02) {
      nodes.push(
        lumBar(-540, 215, 420, 74, {
          color: ROLE.fail,
          fillOpacity: 0.2,
          strokeWidth: 2.6,
          glow: 9,
          radius: 10,
          opacity: showLoss.value,
        }),
        txt(`ORDINARY:  ${DIFF_ORD}`, -540, 215, 34, ROLE.fail, 'mono')
          .glow(7, ROLE.fail)
          .opacity(showLoss.value),
      );
    }
    if (showNet.value > 0.02) {
      nodes.push(
        lumBar(0, 215, 420, 74, {
          color: ROLE.focus,
          fillOpacity: 0.2,
          strokeWidth: 2.6,
          glow: 9,
          radius: 10,
          opacity: showNet.value,
        }),
        txt(`NET CHANGE:  ${DIFF_REN + DIFF_ORD}`, 0, 215, 34, ROLE.focus, 'mono')
          .glow(7, ROLE.focus)
          .opacity(showNet.value),
      );
    }
    if (showGain.value > 0.02) {
      nodes.push(
        lumBar(540, 215, 420, 74, {
          color: ROLE.pass,
          fillOpacity: 0.2,
          strokeWidth: 2.6,
          glow: 9,
          radius: 10,
          opacity: showGain.value,
        }),
        txt(`RENEWALS:  +${DIFF_REN}`, 540, 215, 34, ROLE.pass, 'mono')
          .glow(7, ROLE.pass)
          .opacity(showGain.value),
      );
    }

    // Bottom prompt / gate verdict (strict non-overlapping crossfade)
    const askOp = showAsk.value * fadeOut(showNet.value);
    const gateOp = showGate.value;
    if (askOp > 0.02) {
      nodes.push(
        txt('Where did the overall +7 gain go?', 0, 345, 40, ROLE.focus, 'serif')
          .glow(8, ROLE.focus)
          .opacity(askOp),
      );
    }
    if (gateOp > 0.02) {
      nodes.push(
        txt(
          'A: 2/10 (FAIL)     ·     B: 9/10 (CLEARS 8/10 GATE)     ·     Keep Q100 retained',
          0,
          345,
          34,
          ROLE.pass,
          'mono',
        )
          .glow(8, ROLE.pass)
          .opacity(gateOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'slice-open', openSheet, 1, { duration: 0.5 });
  tweenCue(s, c, 'shared-pass', hiMode, 1, { duration: 0.05 });
  tweenCue(s, c, 'shared-miss', hiMode, 2, { duration: 0.05 });
  tweenCue(s, c, 'switches', hiMode, 3, { duration: 0.05 });
  tweenCue(s, c, 'gain', showGain, 1, { duration: 0.45, after: true });
  c.on('offset-ask', () => {
    s.play(showAsk.to(1, { duration: 0.4 }));
    s.play(showOrd.to(1, { duration: 0.4 }));
  });
  tweenCue(s, c, 'ordinary-loss', showOrd, 1, { duration: 0.25 });
  tweenCue(s, c, 'loss-count', showLoss, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'net-zero', showNet, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'renewal-floor', showFloor, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'slice-fire', showGate, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'shared-failure', hiMode, 4, { duration: 0.05 });
}
