// Scene 19 (decision): "Which input changes the decision?"
// Live launch scorecard stress-tests: 1) move p95 latency to 1,490 ms (prediction hold -> Speed FAILS!) -> restore; 2) raise lift bar to +5.0 pp (prediction hold -> Lift FAILS!) -> reset; 3) flip SRM alert -> HALTS before lift!
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  WARN_COLOR,
  aura,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function decisionScene(s, c) {
  const phase = s.value(0);
  const latMs = s.value(1260); // -> 1490 -> 1260
  const showAskSpeed = s.value(0);
  const showSpeedFail = s.value(0);
  const reqLift = s.value(2.0); // -> 5.0 -> 2.0
  const showAskEffect = s.value(0);
  const showEffectFail = s.value(0);
  const srmOn = s.value(0);
  const showStop = s.value(0);

  const bgAura = aura(0, 20, 640, '#3a183b2e', '#133a4a24');
  const title = heroTitle(['Joint Launch Scorecard:', 'Every Gate Must Clear'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: BAD_COLOR,
    eyebrow: 'PRACTICE STRESS-TESTS ON LAUNCH GATES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const ms = Math.round(latMs.value);
    const latDelta = ms - 1180;
    const req = reqLift.value;
    const isSrm = srmOn.value > 0.5;

    const speedPass = latDelta <= 150;
    const liftPass = 4.0 >= req;

    const gates = [
      {
        name: '1. Traffic Integrity (SRM)',
        val: isSrm ? 'ALERT ACTIVE (χ² > 10.83)' : 'CLEAN (50/50 split)',
        pass: !isSrm,
        reveal: true,
      },
      {
        name: '2. Resolution 95% CI > 0',
        val: isSrm ? 'BLOCKED (do not compute)' : '[+1.0, +7.0] pp',
        pass: !isSrm,
        reveal: true,
      },
      {
        name: `3. Observed Lift ≥ +${req.toFixed(1)} pp`,
        val: isSrm ? 'BLOCKED' : `+4.0 pp vs +${req.toFixed(1)} pp bar`,
        pass: !isSrm && liftPass,
        reveal: req < 3.5 || showEffectFail.value > 0.5,
      },
      {
        name: '4. p95 Latency Δ ≤ +150 ms',
        val: isSrm ? 'BLOCKED' : `${ms} ms (+${latDelta} ms vs 1,180)`,
        pass: !isSrm && speedPass,
        reveal: ms < 1350 || showSpeedFail.value > 0.5,
      },
      {
        name: '5. Grounding Upper < +0.50 pp',
        val: isSrm ? 'BLOCKED' : '+0.70 pp (original HOLD)',
        pass: false,
        reveal: true,
      },
    ];

    const nodes = [
      txt(
        'LAUNCH SCORECARD (PRACTICE COPIES: ORIGINAL BRIEF INTACT)',
        -855,
        -245,
        26,
        CTRL_COLOR,
        'mono',
        'left',
      ),
    ];

    gates.forEach((g, idx) => {
      const y = -165 + idx * 92;
      const badge = isSrm && idx > 0 ? 'STOPPED' : !g.reveal ? 'CHECK?' : g.pass ? 'PASS' : 'FAIL';
      const col =
        isSrm && idx > 0 ? COSMOS.muted : !g.reveal ? WARN_COLOR : g.pass ? GOOD_COLOR : BAD_COLOR;
      nodes.push(
        lumBar(0, y, 1710, 72, {
          color: col,
          fillOpacity: g.pass ? 0.12 : 0.18,
          glow: g.pass ? 5 : 8,
        }),
        txt(g.name, -825, y, 28, COSMOS.ink, 'mono', 'left'),
        txt(g.val, -110, y, 28, col, 'mono', 'left'),
        txt(badge, 725, y, 28, col, 'mono'),
      );
    });

    // Bottom non-overlapping prediction prompts & verdicts
    const q1Op = showAskSpeed.value * Math.max(0, 1 - showSpeedFail.value * 2.6);
    if (q1Op > 0.02) {
      nodes.push(
        txt(
          'Rewrite p95 moved to 1,490 ms (+310 ms). Which additional condition fails?',
          -855,
          345,
          30,
          WARN_COLOR,
          'serif',
          'left',
        )
          .glow(7, WARN_COLOR)
          .opacity(q1Op),
      );
    }

    const q2Op =
      Math.max(0, (showAskEffect.value - 0.45) / 0.55) *
      Math.max(0, 1 - showEffectFail.value * 2.6);
    if (q2Op > 0.02) {
      nodes.push(
        txt(
          'Required lift raised to +5.0 pp (CI still > 0). Does +4.0 pp meet the bar?',
          -855,
          345,
          30,
          WARN_COLOR,
          'serif',
          'left',
        )
          .glow(7, WARN_COLOR)
          .opacity(q2Op),
      );
    }

    const sFailOp =
      Math.max(0, (showSpeedFail.value - 0.45) / 0.55) * Math.max(0, 1 - showAskEffect.value * 2.6);
    if (sFailOp > 0.02) {
      nodes.push(
        txt(
          'Speed FAILS (+310 ms > +150 ms). Resolution lift never buys extra latency budget.',
          -855,
          345,
          28,
          BAD_COLOR,
          'mono',
          'left',
        )
          .glow(6, BAD_COLOR)
          .opacity(sFailOp),
      );
    }

    const eFailOp =
      Math.max(0, (showEffectFail.value - 0.45) / 0.55) * Math.max(0, 1 - showStop.value * 2.6);
    if (eFailOp > 0.02) {
      nodes.push(
        txt(
          'Observed lift falls short (+4.0 < +5.0 pp) even though CI is strictly above zero!',
          -855,
          345,
          28,
          BAD_COLOR,
          'mono',
          'left',
        )
          .glow(6, BAD_COLOR)
          .opacity(eFailOp),
      );
    }

    const stOp = Math.max(0, (showStop.value - 0.45) / 0.55);
    if (stOp > 0.02) {
      nodes.push(
        txt(
          'SRM ALERT HALTS BEFORE LIFT: trace incident IDs through assignment & joins first!',
          -855,
          345,
          28,
          BAD_COLOR,
          'mono',
          'left',
        )
          .glow(8, BAD_COLOR)
          .opacity(stOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'slow', latMs, 1490, { duration: 0.55 });
  tweenCue(s, c, 'ask-speed', showAskSpeed, 1, { duration: 0.4 });
  tweenCue(s, c, 'speed-fail', showSpeedFail, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'restore', latMs, 1260, { duration: 0.5 });
  tweenCue(s, c, 'five', reqLift, 5.0, { duration: 0.55 });
  tweenCue(s, c, 'ask-effect', showAskEffect, 1, { duration: 0.4 });
  tweenCue(s, c, 'effect-fail', showEffectFail, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'reset', reqLift, 2.0, { duration: 0.45 });
  tweenCue(s, c, 'flag', srmOn, 1, { duration: 0.45 });
  tweenCue(s, c, 'stop', showStop, 0.8, { duration: 0.4 });
  tweenCue(s, c, 'trace', showStop, 1, { duration: 0.4 });
}
