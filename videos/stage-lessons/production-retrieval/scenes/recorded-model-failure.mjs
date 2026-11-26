// Scene 13 (recorded-model-failure): "What did the model read?"
// Forensic comparison bench pairing 3 recorded Qwen3-1.7B replies with their exact prompt sources,
// persistent "Unknown labels: 0" indicator proving label checks alone miss bad inequality & clock
// errors, and deterministic code-checked verdicts strictly withheld with `after: true`.
import { dynamic, group } from 'vizmatic/stage';
import {
  CORPUS,
  COSMOS,
  ROLE,
  RULE,
  RUN,
  answerFromEvidence,
  assertEqual,
  callerTag,
  cinemaAtmosphere,
  heroTitle,
  lumBar,
  packParents,
  playCue,
  runPhase,
  statusPill,
  textLines,
  tweenCue,
  txt,
  unknownSourceLabels,
  wrapLines,
} from '../parts.mjs';

export default function recordedModelFailure(s, c) {
  const keyRule = CORPUS.find((item) => item.id === 'eu-key-v2').text;
  const sessionRule = CORPUS.find((item) => item.id === 'eu-session-v1').text;
  const sessionOnly = packParents(
    RUN.hits.filter((hit) => hit.record.documentId === 'eu-session'),
    RUN.caller,
  );

  const quotes = [
    'Yes, it may rotate automatically [E1].',
    'The service-account key may rotate automatically because it is stale for less than 14 days and the risk signal is at most 48 hours old [E1].',
    "The service-account key's risk signal is 48 hours old, which is less than the 30-day expiration for idle browser sessions [E1]. Therefore, it may rotate automatically.",
  ];

  // Build-time invariants verifying all 3 recorded cases have 0 unknown labels
  const checkedTen = answerFromEvidence(
    { intent: 'rotation_eligibility', staleDays: RULE.requestDays, signalHours: RULE.requestHours },
    RUN.packed,
  );
  const checkedFifteen = answerFromEvidence(
    { intent: 'rotation_eligibility', staleDays: RULE.outsideDays, signalHours: RULE.requestHours },
    RUN.packed,
  );
  const checkedSession = answerFromEvidence(
    { intent: 'rotation_eligibility', staleDays: RULE.requestDays, signalHours: RULE.requestHours },
    sessionOnly,
  );
  assertEqual(unknownSourceLabels(quotes[0], ['E1', 'E2']).length, 0, 'run 1 unknown labels = 0');
  assertEqual(unknownSourceLabels(quotes[1], ['E1', 'E2']).length, 0, 'run 2 unknown labels = 0');
  assertEqual(unknownSourceLabels(quotes[2], ['E1']).length, 0, 'run 3 unknown labels = 0');
  assertEqual(checkedTen.decision, 'eligible', 'run 1 checked eligible');
  assertEqual(checkedFifteen.decision, 'ineligible', 'run 2 checked ineligible');
  assertEqual(checkedSession.decision, 'abstain', 'run 3 checked abstain');

  const phase = s.value(0);
  // Case index: 0 = 10d both, 1 = 15d both, 2 = 10d session-only
  const caseIdx = s.value(0);
  const showReply = s.value(0);
  const faultHighlight = s.value(0); // 1 = bad inequality / wrong clock highlighted
  // Footer mode: 0=wait, 1=run1 eligible, 2=run2 ineligible, 3=ask source?, 4=run3 abstain
  const footMode = s.value(0);

  const title = heroTitle(['What Did the', 'Model Read?'], {
    x: -855,
    y: -440,
    size: 54,
    lineHeight: 64,
    accent: ROLE.request,
    eyebrow: 'RECORDED QWEN3-1.7B REPLIES · LOGIC VS CITATION LABELS',
  });

  const keyLines = wrapLines(keyRule, 42);
  const sesLines = wrapLines(sessionRule, 42);
  const replyWrapped = quotes.map((q) => wrapLines(q, 42));

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const ci = Math.round(caseIdx.value);
    const sr = showReply.value;
    const fh = faultHighlight.value;
    const fm = Math.round(footMode.value);

    const days = ci === 1 ? RULE.outsideDays : RULE.requestDays;
    const isSessionOnly = ci === 2;

    const nodes = [callerTag(1)];

    // Top-right request reading pill
    nodes.push(
      statusPill(`INPUT: ${days} DAYS STALE  /  ${RULE.requestHours}H SIGNAL`, 525, -340, {
        color: ci === 1 ? ROLE.warn : ROLE.focus,
        width: 560,
        height: 48,
      }),
    );

    // Left column: Supplied prompt sources
    const leftCx = -450;
    if (!isSessionOnly) {
      nodes.push(
        lumBar(leftCx, -100, 810, 225, {
          color: ROLE.policy,
          fillAlpha: 0.08,
          strokeWidth: 2.2,
          glow: 7,
          radius: 14,
        }),
        txt('[E1]  KEY POLICY', -825, -182, 26, ROLE.policy, 'mono', 'left'),
        ...textLines(keyLines, -825, -130, { size: 28, lineHeight: 42, color: COSMOS.ink }),

        lumBar(leftCx, 150, 810, 175, {
          color: ROLE.session,
          fillAlpha: 0.08,
          strokeWidth: 2.0,
          glow: 6,
          radius: 14,
        }),
        txt('[E2]  SESSION POLICY', -825, 92, 26, ROLE.session, 'mono', 'left'),
        ...textLines(sesLines, -825, 144, { size: 28, lineHeight: 42, color: COSMOS.muted }),
      );
    } else {
      nodes.push(
        lumBar(leftCx, 10, 810, 260, {
          color: ROLE.session,
          fillAlpha: 0.11,
          strokeWidth: 2.4,
          glow: 9,
          radius: 14,
        }),
        txt(
          '[E1]  SESSION POLICY  (ONLY PACKED SOURCE)',
          -825,
          -82,
          26,
          ROLE.session,
          'mono',
          'left',
        ),
        ...textLines(sesLines, -825, -24, { size: 30, lineHeight: 44, color: COSMOS.ink }),
        txt('Key policy absent from this prompt', -825, 94, 26, ROLE.warn, 'mono', 'left'),
      );
    }

    // Right column: Recorded Qwen3-1.7B reply + label checker badge
    const rightCx = 445;
    const replyCol = ci === 0 ? ROLE.admitted : fh > 0.3 ? ROLE.danger : ROLE.request;
    nodes.push(
      lumBar(rightCx, 20, 820, 415, {
        color: replyCol,
        fillAlpha: 0.09,
        strokeWidth: 2.4,
        glow: 8 + fh * 6,
        radius: 16,
      }),
      txt('RECORDED QWEN3-1.7B REPLY (EXCERPT)', 65, -150, 26, ROLE.request, 'mono', 'left'),
    );

    if (sr > 0.1) {
      nodes.push(
        ...textLines(replyWrapped[ci], 65, -90, {
          size: 28,
          lineHeight: 44,
          color: COSMOS.ink,
          opacity: sr,
        }),
        statusPill('UNKNOWN LABELS: 0', 225, 168, {
          color: ROLE.admitted,
          width: 315,
          height: 46,
          opacity: sr,
        }),
      );
      if (ci === 1 && fh > 0.3) {
        nodes.push(
          statusPill('FALSE: 15 > 14!', 625, 168, {
            color: ROLE.danger,
            width: 315,
            height: 46,
            opacity: fh * pulse,
          }),
        );
      } else if (ci === 2 && fh > 0.3) {
        nodes.push(
          statusPill('WRONG CLOCK: SESSIONS!', 625, 168, {
            color: ROLE.danger,
            width: 375,
            height: 46,
            opacity: fh * pulse,
          }),
        );
      }
    } else {
      nodes.push(
        txt(
          ci === 2 ? 'Evaluating prompt with session page only...' : 'Awaiting recorded reply...',
          rightCx,
          20,
          28,
          COSMOS.dim,
          'mono',
          'center',
        ),
      );
    }

    // Discrete bottom verdict
    const footMap = [
      {
        text: 'Compare recorded Qwen replies against code-checked rules',
        col: COSMOS.muted,
        font: 'sans',
      },
      { text: 'Checked: ELIGIBLE  [E1]', col: ROLE.admitted, font: 'mono' },
      { text: 'Checked: INELIGIBLE  [E1]  (15 > 14)', col: ROLE.danger, font: 'mono' },
      {
        text: 'Only the session page is [E1]. What key-rotation claim does it support?',
        col: ROLE.focus,
        font: 'serif',
      },
      { text: 'Checked: ABSTAIN  ·  keep numerical checks in code', col: ROLE.warn, font: 'mono' },
    ];
    const ft = footMap[Math.max(0, Math.min(footMap.length - 1, fm))];
    nodes.push(txt(ft.text, -855, 415, 30, ft.col, ft.font, 'left').glow(fm > 0 ? 7 : 0, ft.col));

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.request, ROLE.danger), title, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'ten-reply', showReply, 1, { dur: 0.5 });
  playCue(s, c, 'ten-check', () => s.play(footMode.to(1, { duration: 0.001 })), {
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'fifteen-input',
    () =>
      s.play(
        caseIdx.to(1, { duration: 0.001 }),
        showReply.to(0, { duration: 0.001 }),
        faultHighlight.to(0, { duration: 0.001 }),
        footMode.to(0, { duration: 0.001 }),
      ),
    { dur: 0.1 },
  );
  tweenCue(s, c, 'fifteen-reply', showReply, 1, { dur: 0.5 });
  tweenCue(s, c, 'bad-comparison', faultHighlight, 1, { dur: 0.45 });
  playCue(s, c, 'fifteen-check', () => s.play(footMode.to(2, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'back-to-ten',
    () =>
      s.play(
        showReply.to(0, { duration: 0.001 }),
        faultHighlight.to(0, { duration: 0.001 }),
        footMode.to(0, { duration: 0.001 }),
      ),
    { dur: 0.1 },
  );
  playCue(s, c, 'session-only', () => s.play(caseIdx.to(2, { duration: 0.001 })), { dur: 0.1 });
  playCue(s, c, 'ask-source', () => s.play(footMode.to(3, { duration: 0.001 })), { dur: 0.1 });
  tweenCue(s, c, 'last-reply', showReply, 1, { after: true, dur: 0.45 });
  tweenCue(s, c, 'wrong-clock', faultHighlight, 1, { dur: 0.45 });
  playCue(s, c, 'abstention', () => s.play(footMode.to(4, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
}
