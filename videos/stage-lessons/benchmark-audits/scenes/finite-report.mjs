// Scene 22 (finite-report): "Validate the evidence before applying the release rule"
// Strict telemetry firewall catching Booleans, NaN comparison bypasses, Infinity, and out-of-range values.
import {
  COSMOS,
  RELEASES,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowArrow,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const BALANCED = RELEASES.find((r) => r.id === 'Balanced');
const SPECIALIST = RELEASES.find((r) => r.id === 'Specialist');

const CHECKS = [
  '1. Actual int / float  (reject Booleans)',
  '2. Finite value  (reject NaN, +Inf, -Inf)',
  '3. Valid rate domain  (rate in [0, 1])',
  '4. Non-negative ops  (ms >= 0, cost >= 0)',
];

export default function finite(s, c) {
  const phase = s.value(0);
  const focusTyped = s.value(0);
  const focusDomain = s.value(0);
  const actNan = s.value(0);
  const showNanFalse = s.value(0);
  const showNaive = s.value(0);
  const showReject = s.value(0);
  const actValid = s.value(0);
  const showSpecialist = s.value(0);
  const cuePulse = s.value(0);

  const bgAura = aura(-60, 20, 620, '#361a2e38', '#14324c20');
  const title = heroTitle(['Validate Telemetry Before', 'Applying Any Release Gate'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.fail,
    eyebrow: 'STRICT SCHEMA & FINITENESS · THE NAN TRAP',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const nan = actNan.value;
    const val = actValid.value;
    const spec = showSpecialist.value;
    const nodes = [];

    // Top warning ribbon of invalid inputs during phases 0 and 1
    const badOp = fadeOut(val);
    if (badOp > 0.02) {
      nodes.push(
        txt(
          'INVALID INPUTS BLOCKED:   True   ·   NaN   ·   Infinity   ·   missing   ·   -1   ·   rate > 1',
          0,
          -235,
          28,
          focusDomain.value > 0.3 || nan > 0.3 ? ROLE.fail : ROLE.accent,
          'mono',
        )
          .glow(focusDomain.value > 0.3 ? 8 : 4, ROLE.fail)
          .opacity(badOp),
      );
    }

    // LEFT PANEL: Live telemetry packet (Balanced -> NaN Trap -> Balanced -> Specialist)
    const leftX = -435;
    const isNanMode = nan > 0.5 && val < 0.5;
    const isSpecMode = val > 0.5 && spec > 0.5;
    const activeCand = isSpecMode ? SPECIALIST : BALANCED;

    if (!isNanMode) {
      const boxCol = isSpecMode ? ROLE.accent : ROLE.pass;
      nodes.push(
        txt(
          isSpecMode ? 'CANDIDATE: SPECIALIST' : 'CANDIDATE: BALANCED',
          leftX,
          -150,
          30,
          boxCol,
          'mono',
        ).glow(6, boxCol),
        lumBar(leftX, 35, 660, 290, {
          color: boxCol,
          fillOpacity: 0.16,
          strokeWidth: 2.6,
          glow: 9,
          radius: 14,
        }),
        txt(`policy = ${activeCand.quality}`, leftX - 250, -52, 34, COSMOS.ink, 'mono', 'left'),
        txt(`schema = ${activeCand.schema}`, leftX - 250, 4, 34, COSMOS.ink, 'mono', 'left'),
        txt(
          `ms     = ${activeCand.ms}${isSpecMode ? '  (> 900!)' : ''}`,
          leftX - 250,
          60,
          34,
          isSpecMode ? ROLE.fail : COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          `cost   = ${activeCand.cost}${isSpecMode ? '  (> 0.015!)' : ''}`,
          leftX - 250,
          116,
          34,
          isSpecMode ? ROLE.fail : COSMOS.ink,
          'mono',
          'left',
        ),
      );
    } else {
      const showF = showNanFalse.value;
      nodes.push(
        txt('ORDERED COMPARISON TRAP', leftX, -150, 30, ROLE.fail, 'mono').glow(7, ROLE.fail),
        lumBar(leftX, 35, 660, 290, {
          color: ROLE.fail,
          fillOpacity: 0.22,
          strokeWidth: 3.0,
          glow: 12 * pulse,
          radius: 14,
        }),
        txt(
          showF > 0.5 ? 'NaN < 0.98   ->   False' : 'NaN < 0.98',
          leftX,
          -20,
          38,
          showF > 0.5 ? ROLE.focus : COSMOS.ink,
          'mono',
        ).glow(showF > 0.5 ? 8 : 0, ROLE.focus),
        txt(
          showF > 0.5 ? 'NaN > 900    ->   False' : 'NaN > 900',
          leftX,
          68,
          38,
          showF > 0.5 ? ROLE.focus : COSMOS.ink,
          'mono',
        ).glow(showF > 0.5 ? 8 : 0, ROLE.focus),
      );
    }

    // Center firewall arrow
    nodes.push(
      glowArrow([-85, 35], [45, 35], isNanMode ? ROLE.fail : ROLE.A, { width: 3.6, tip: 13 }),
    );

    // RIGHT PANEL: 4-layer strict reference validator firewall
    const rightX = 445;
    nodes.push(txt('STRICT REFERENCE VALIDATOR', rightX, -150, 28, ROLE.A, 'mono'));
    CHECKS.forEach((chk, i) => {
      const cy = -75 + i * 74;
      const hi =
        (i === 0 && focusTyped.value > 0.3 && !isNanMode) ||
        (i === 1 && isNanMode && showReject.value > 0.3);
      const col = hi ? ROLE.focus : ROLE.A;
      nodes.push(
        lumBar(rightX, cy, 740, 58, {
          color: col,
          fillOpacity: hi ? 0.32 : 0.14,
          strokeWidth: hi ? 3.2 : 2.0,
          glow: hi ? 14 * pulse : 5,
          radius: 9,
        }),
        txt(chk, rightX - 340, cy, 26, hi ? ROLE.focus : COSMOS.ink, 'mono', 'left'),
      );
    });

    // Bottom verdict slot with strict non-overlapping crossfades
    const nOp = showNaive.value * fadeOut(showReject.value) * fadeOut(val);
    const rOp = fadeIn(showReject.value) * fadeOut(val);
    const bOp = fadeIn(val) * fadeOut(spec);
    const spOp = fadeIn(spec);

    if (nOp > 0.02) {
      nodes.push(
        txt('Naive check ADMITS NaN!', 0, 345, 38, ROLE.fail, 'sans')
          .glow(9, ROLE.fail)
          .opacity(nOp),
      );
    }
    if (rOp > 0.02) {
      nodes.push(
        txt('Strict validator -> REJECT', 0, 345, 38, ROLE.focus, 'sans')
          .glow(8, ROLE.focus)
          .opacity(rOp),
      );
    }
    if (bOp > 0.02) {
      nodes.push(
        txt(
          'Balanced: valid telemetry + clears quality, schema, latency, and cost gates',
          0,
          345,
          34,
          ROLE.pass,
          'sans',
        )
          .glow(8, ROLE.pass)
          .opacity(bOp),
      );
    }
    if (spOp > 0.02) {
      nodes.push(
        txt(
          'Specialist: policy = 1.0, yet 1800 ms is 2x the 900 ms ceiling · keep telemetry beside decision',
          0,
          345,
          30,
          ROLE.accent,
          'sans',
        )
          .glow(7, ROLE.accent)
          .opacity(spOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'finite-report-phase-0', focusTyped, 0, { duration: 0.1 });
  tweenCue(s, c, 'ba-finite-report-typed', focusTyped, 1, { duration: 0.4 });
  tweenCue(s, c, 'ba-finite-report-domain', focusDomain, 1, { duration: 0.4 });
  tweenCue(s, c, 'finite-report-phase-1', actNan, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-finite-report-nan', showNanFalse, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'finite-admits', showNaive, 1, { duration: 0.35 });
  tweenCue(s, c, 'invalid-nan', showReject, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'ba-finite-report-reject', cuePulse, 1, { duration: 0.25 });
  tweenCue(s, c, 'finite-report-phase-2', actValid, 1, { duration: 0.5 });
  tweenCue(s, c, 'specialist-record', showSpecialist, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-finite-report-scope', cuePulse, 2, { duration: 0.25 });
}
