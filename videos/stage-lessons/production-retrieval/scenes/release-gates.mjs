// Scene 20 (release-gates): "Replay one frozen answer"
// Twin glowing diff spectrometer comparing Frozen Expectation (limit 14, [E1], eligible) against
// Candidate Reply (control passes -> mutates limit 14 -> 30 while keeping eligible & [E1]),
// field-by-field parity locks, and strict prediction withholding before `blocked`.
import { dynamic, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RULE,
  assertEqual,
  callerTag,
  cinemaAtmosphere,
  heroTitle,
  lumBar,
  playCue,
  releaseCases,
  runPhase,
  statusPill,
  textLines,
  tweenCue,
  txt,
  wrapLines,
} from '../parts.mjs';

export default function releaseGates(s, c) {
  const cases = releaseCases();
  const control = cases.find((entry) => entry.id === 'current-rule').result;
  const altered = cases.find((entry) => entry.id === 'wrong-limit-mutation').result;
  const checkExact = (cand) =>
    cand.decision === control.decision &&
    cand.cited.join() === control.cited.join() &&
    cand.text === control.text;
  assertEqual(checkExact(control), true, 'control passes');
  assertEqual(checkExact(altered), false, 'mutated limit fails');

  const formatReply = (ans) => ans.text.replace(', signal age ', ', risk-signal age ');
  const expectedLines = wrapLines(formatReply(control), 36);
  const mutatedLines = wrapLines(formatReply(altered), 36);

  const phase = s.value(0);
  const showCandidate = s.value(0);
  const mutated = s.value(0);
  const sameFieldsLit = s.value(0);
  const limitDiffLit = s.value(0);
  const candLimitLit = s.value(0);
  const investigateLit = s.value(0);
  // Verdict mode: 0=setup, 1=PASS (after control-result), 2=ask gate?, 3=BLOCK (after blocked)
  const verdictMode = s.value(0);

  const title = heroTitle(['Replay One', 'Frozen Answer'], {
    x: -855,
    y: -440,
    size: 54,
    lineHeight: 64,
    accent: ROLE.policy,
    eyebrow: 'FROZEN RELEASE REPLAY · STATED-LIMIT DIFF GATE',
  });

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const sc = showCandidate.value;
    const mut = mutated.value > 0.5;
    const sfl = sameFieldsLit.value;
    const ldl = limitDiffLit.value;
    const cll = candLimitLit.value;
    const inv = investigateLit.value;
    const vm = Math.round(verdictMode.value);

    const nodes = [callerTag(1)];

    // Left: Frozen Expectation
    const leftCx = -455;
    nodes.push(
      lumBar(leftCx, -55, 800, 315, {
        color: inv > 0.3 ? ROLE.focus : ROLE.policy,
        fillAlpha: 0.08 + inv * 0.07,
        strokeWidth: 2.4,
        glow: 8 + inv * 6,
        radius: 16,
      }),
      txt('FROZEN EXPECTATION  ·  CASES[0]', -825, -172, 26, ROLE.policy, 'mono', 'left'),
      ...textLines(expectedLines, -825, -112, {
        size: 30,
        lineHeight: 46,
        color: COSMOS.ink,
      }),
    );
    if (ldl > 0.3) {
      nodes.push(
        statusPill(`SOURCE LIMIT: ${RULE.days} DAYS`, -645, 58, {
          color: ROLE.admitted,
          width: 340,
          height: 46,
          opacity: ldl,
        }),
      );
    }

    // Right: Candidate Reply (swaps cleanly to mutated text on `mutation`)
    const rightCx = 445;
    const candCol = vm === 3 ? ROLE.danger : mut ? ROLE.warn : ROLE.request;
    nodes.push(
      lumBar(rightCx, -55, 800, 315, {
        color: candCol,
        fillAlpha: 0.08 + sc * 0.04,
        strokeWidth: 2.4,
        glow: 8 * Math.max(0.3, sc),
        radius: 16,
      }),
      txt(
        mut ? 'MUTATED CANDIDATE REPLY' : 'REVIEWED CANDIDATE REPLY',
        75,
        -172,
        26,
        candCol,
        'mono',
        'left',
      ),
    );
    if (sc > 0.1) {
      nodes.push(
        ...textLines(mut ? mutatedLines : expectedLines, 75, -112, {
          size: 30,
          lineHeight: 46,
          color: COSMOS.ink,
          opacity: sc,
        }),
      );
    } else {
      nodes.push(
        txt('Replaying frozen request...', rightCx, -45, 28, COSMOS.dim, 'mono', 'center'),
      );
    }
    if (cll > 0.3) {
      nodes.push(
        statusPill('CANDIDATE PROMISES: 30 DAYS!', 305, 58, {
          color: ROLE.danger,
          width: 460,
          height: 46,
          opacity: cll * pulse,
        }),
      );
    }

    // Middle parity check bar: 3 separate release fields (Decision, Citation, Stated Limit)
    const parityY = 205;
    const checks = [
      {
        x: -570,
        title: 'DECISION',
        val: sc > 0.2 ? 'eligible == eligible' : 'pending',
        col: sfl > 0.3 ? ROLE.focus : sc > 0.2 ? ROLE.admitted : COSMOS.muted,
      },
      {
        x: 0,
        title: 'CITATION',
        val: sc > 0.2 ? '[E1] == [E1]' : 'pending',
        col: sfl > 0.3 ? ROLE.focus : sc > 0.2 ? ROLE.admitted : COSMOS.muted,
      },
      {
        x: 570,
        title: 'STATED LIMIT',
        val:
          vm === 3 ? '14 != 30  (FAIL)' : mut ? '14 vs 30  (?)' : sc > 0.2 ? '14 == 14' : 'pending',
        col: vm === 3 ? ROLE.danger : mut ? ROLE.warn : sc > 0.2 ? ROLE.admitted : COSMOS.muted,
      },
    ];
    checks.forEach((chk) => {
      nodes.push(
        lumBar(chk.x, parityY, 510, 112, {
          color: chk.col,
          fillAlpha: 0.1,
          strokeWidth: 2.2,
          glow: chk.col === ROLE.danger ? 11 * pulse : 6,
          radius: 14,
        }),
        txt(chk.title, chk.x, parityY - 26, 26, COSMOS.muted, 'mono', 'center'),
        txt(chk.val, chk.x, parityY + 22, 30, chk.col, 'mono', 'center'),
      );
    });

    // Runner call readout
    const callText =
      vm === 3
        ? 'run_case(CASES[0], answerer=wrong_limit)'
        : mut
          ? 'Same frozen case  ·  candidate answerer'
          : 'run_case(CASES[0])';
    nodes.push(txt(callText, -855, 326, 26, COSMOS.muted, 'mono', 'left'));

    // Discrete bottom verdict (strictly withheld until `control-result` / `blocked` after:true)
    const verdicts = [
      {
        text: 'Hold caller, policy, and expected answer fixed during candidate replay',
        col: COSMOS.muted,
        font: 'sans',
      },
      {
        text: 'PASS  ·  decision, citation, and stated limit all reproduced',
        col: ROLE.admitted,
        font: 'mono',
      },
      {
        text: 'Still says eligible and cites [E1], but promises 30 days. Should it pass?',
        col: ROLE.focus,
        font: 'serif',
      },
      {
        text: 'BLOCK  ·  stated limit (30) contradicts governing policy (14)',
        col: ROLE.danger,
        font: 'mono',
      },
    ];
    const vd = verdicts[Math.max(0, Math.min(verdicts.length - 1, vm))];
    nodes.push(txt(vd.text, -855, 415, 32, vd.col, vd.font, 'left').glow(vm > 0 ? 8 : 0, vd.col));

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.danger), title, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'control', showCandidate, 1, { dur: 0.55 });
  playCue(s, c, 'control-result', () => s.play(verdictMode.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'mutation',
    () => s.play(mutated.to(1, { duration: 0.08 }), verdictMode.to(0, { duration: 0.05 })),
    { dur: 0.15 },
  );
  tweenCue(s, c, 'same-fields', sameFieldsLit, 1, { dur: 0.45 });
  playCue(s, c, 'ask-gate', () => s.play(verdictMode.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'blocked', () => s.play(verdictMode.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  tweenCue(s, c, 'different-limit', limitDiffLit, 1, { dur: 0.45 });
  tweenCue(s, c, 'candidate-limit', candLimitLit, 1, { dur: 0.45 });
  tweenCue(s, c, 'investigate', investigateLit, 1, { dur: 0.5 });
}
