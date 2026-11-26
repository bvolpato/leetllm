// Scene 11 (answer-from-evidence): "Where does Luna's request land?"
// Luminous magnified 2D two-clock eligibility plot (staleDays vs signalHours) with glowing
// inclusive boundary edges (d <= 14, h <= 48), MathJax compound condition, animated gold beacon
// (10,48) -> (14,48) -> (15,48), and source swap to session-only dissolving limits -> ABSTAIN.
import { dynamic, group } from 'vizmatic/stage';
import { renderEligibilityMap } from '../eligibility-map.mjs';
import {
  COSMOS,
  ROLE,
  RULE,
  RUN,
  answerFromEvidence,
  assertEqual,
  callerTag,
  cinemaAtmosphere,
  glowTex,
  heroTitle,
  lumBar,
  packParents,
  playCue,
  runPhase,
  textLines,
  tweenCue,
  txt,
  wrapLines,
} from '../parts.mjs';

export default function answerFromEvidenceScene(s, c) {
  const [keySource] = RUN.packed;
  const onlySession = packParents(
    RUN.hits.filter(({ record }) => record.documentId === 'eu-session'),
    RUN.caller,
  );

  // Build-time checks on all 4 decisions shown in this scene
  const d10 = answerFromEvidence(
    { intent: 'rotation_eligibility', staleDays: RULE.requestDays, signalHours: RULE.requestHours },
    RUN.packed,
  );
  const d14 = answerFromEvidence(
    { intent: 'rotation_eligibility', staleDays: RULE.days, signalHours: RULE.hours },
    RUN.packed,
  );
  const d15 = answerFromEvidence(
    { intent: 'rotation_eligibility', staleDays: RULE.outsideDays, signalHours: RULE.hours },
    RUN.packed,
  );
  const dAbs = answerFromEvidence(
    { intent: 'rotation_eligibility', staleDays: RULE.outsideDays, signalHours: RULE.hours },
    onlySession,
  );
  assertEqual(d10.decision, 'eligible', '10d/48h eligible');
  assertEqual(d14.decision, 'eligible', '14d/48h corner eligible');
  assertEqual(d15.decision, 'ineligible', '15d/48h ineligible');
  assertEqual(dAbs.decision, 'abstain', 'session-only abstains');

  const phase = s.value(0);
  const showPoint = s.value(0);
  const showDayLimit = s.value(0);
  const showHourLimit = s.value(0);
  const staleDays = s.value(RULE.requestDays);
  const sessionMode = s.value(0); // 0 = EU key policy [E1], 1 = Session policy [E1]
  // Verdict mode (strictly gated with after:true on answer reveals):
  // 0 = waiting, 1 = eligible [E1] (10d), 2 = corner question?, 3 = eligible [E1] (corner),
  // 4 = ineligible [E1] (15d), 5 = source question?, 6 = abstain (no key rule)
  const verdictMode = s.value(0);

  const title = heroTitle(["Where Does Luna's", 'Request Land?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 62,
    accent: ROLE.policy,
    eyebrow: 'TWO-CLOCK ELIGIBILITY BOUNDARY · CITED DENIAL VS ABSTENTION',
  });

  const condEq = glowTex('d \\le 14 \\;\\land\\; h \\le 48', {
    x: 475,
    y: -315,
    size: 40,
    color: ROLE.policy,
    glow: 7,
  });

  const keyLines = wrapLines(keySource.text, 40);
  const sesLines = wrapLines(onlySession[0].text, 40);

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const sp = showPoint.value;
    const sdl = showDayLimit.value;
    const shl = showHourLimit.value;
    const sd = staleDays.value;
    const sm = sessionMode.value;
    const vm = Math.round(verdictMode.value);

    const hasRule = sm < 0.5;
    const mapVisLimits = hasRule ? 1 : 0;

    const nodes = [callerTag(1)];

    // Left: Magnified 2D eligibility map
    const map = renderEligibilityMap({
      x0: -795,
      y0: -195,
      w: 800,
      h: 470,
      staleDays: sd,
      signalHours: RULE.requestHours,
      showPoint: sp,
      showDayLimit: sdl * mapVisLimits,
      showHourLimit: shl * mapVisLimits,
      showRegion: Math.min(sdl, shl) * mapVisLimits,
      pulse,
    });
    nodes.push(...map.nodes);

    // Right: Active source panel + live reading telemetry
    const rx = 475;
    const srcCol = hasRule ? ROLE.policy : ROLE.session;
    nodes.push(
      lumBar(rx, -65, 760, 290, {
        color: srcCol,
        fillAlpha: 0.09,
        strokeWidth: 2.4,
        glow: 8,
        radius: 16,
      }),
      txt(
        hasRule ? '[E1]  EU KEY POLICY  (GOVERNING)' : '[E1]  SESSION POLICY  (ONLY SOURCE)',
        rx - 350,
        -172,
        26,
        srcCol,
        'mono',
        'left',
      ),
      ...textLines(hasRule ? keyLines : sesLines, rx - 350, -118, {
        size: 28,
        lineHeight: 44,
        color: COSMOS.ink,
      }),
    );

    // Live request coordinate readout on right
    const displayDays = Math.round(sd);
    nodes.push(
      lumBar(rx, 168, 760, 118, {
        color: ROLE.focus,
        fillAlpha: 0.08,
        strokeWidth: 2.0,
        glow: 6,
        radius: 14,
      }),
      txt('ACTIVE REQUEST COORDINATES', rx - 350, 134, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        `stale: ${displayDays} days  ·  signal: ${RULE.requestHours} hours`,
        rx - 350,
        186,
        30,
        ROLE.focus,
        'mono',
        'left',
      ).glow(7, ROLE.focus),
    );

    // Discrete bottom verdict (zero overlap, strictly withheld on prediction pauses)
    const verdicts = [
      { text: 'Plot stale days against risk-signal hours', col: COSMOS.muted, font: 'sans' },
      { text: 'ELIGIBLE  [E1]  ·  10 <= 14d, 48 <= 48h', col: ROLE.admitted, font: 'mono' },
      {
        text: 'At (14 days, 48 hours): Does the corner itself qualify?',
        col: ROLE.focus,
        font: 'serif',
      },
      { text: 'ELIGIBLE  [E1]  ·  corner qualifies (14 <= 14)', col: ROLE.admitted, font: 'mono' },
      { text: 'INELIGIBLE  [E1]  ·  cited denial (15 > 14d)', col: ROLE.danger, font: 'mono' },
      {
        text: 'Only the session page is [E1]. Can it give a denial?',
        col: ROLE.focus,
        font: 'serif',
      },
      { text: 'ABSTAIN  ·  no key-rotation boundary in this prompt', col: ROLE.warn, font: 'mono' },
    ];
    const vd = verdicts[Math.max(0, Math.min(verdicts.length - 1, vm))];
    nodes.push(txt(vd.text, -855, 422, 32, vd.col, vd.font, 'left').glow(vm > 0 ? 8 : 0, vd.col));

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.admitted), title, condEq, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'two-ages', showPoint, 1, { dur: 0.5 });
  tweenCue(s, c, 'key-limit', showDayLimit, 1, { dur: 0.55 });
  tweenCue(s, c, 'signal-limit', showHourLimit, 1, { dur: 0.55 });
  playCue(s, c, 'ten-result', () => s.play(verdictMode.to(1, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'to-corner',
    (d) => s.play(staleDays.to(RULE.days, { duration: d }), verdictMode.to(0, { duration: 0.001 })),
    { dur: 0.75 },
  );
  playCue(s, c, 'corner-question', () => s.play(verdictMode.to(2, { duration: 0.001 })), {
    dur: 0.1,
  });
  playCue(s, c, 'corner-result', () => s.play(verdictMode.to(3, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'one-day-more',
    (d) =>
      s.play(
        staleDays.to(RULE.outsideDays, { duration: d }),
        verdictMode.to(0, { duration: 0.001 }),
      ),
    { dur: 0.75 },
  );
  playCue(s, c, 'outside-result', () => s.play(verdictMode.to(4, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'only-session',
    () => s.play(sessionMode.to(1, { duration: 0.001 }), verdictMode.to(0, { duration: 0.001 })),
    { dur: 0.15 },
  );
  playCue(s, c, 'source-question', () => s.play(verdictMode.to(5, { duration: 0.001 })), {
    dur: 0.1,
  });
  playCue(s, c, 'no-rule', () => s.play(verdictMode.to(6, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
}
