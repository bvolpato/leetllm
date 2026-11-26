// Scene 1: opening - "How many times will these workers fetch /guide?"
// Two workers step along glowing Python execution rails, both pausing before fetch(url).
// Strict prediction withholding: fetch log count and set update reveal ONLY after spoken cues!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  UNSAFE_LINES,
  ambientClock,
  cinemaAtmosphere,
  codeSpotlight,
  glowDot,
  glowPill,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function opening(s, c) {
  const title = sceneHeading(['How many times will these', 'workers fetch /guide?'], {
    accent: ROLE.workerB,
  });

  const amb = ambientClock(s, c);
  const lineA = s.value(0); // 0 -> 1 -> 2 -> 3
  const lineB = s.value(0); // 0 -> 1 -> 2 -> 3
  const activeCode = s.value(1);
  const showQuestion = s.value(0);
  const callCount = s.value(0); // 0 -> 1 (after opening-fetch-a) -> 2 (after opening-fetch-b)
  const seenAdded = s.value(0); // 0 -> 1 (after opening-record)
  const bAdded = s.value(0); // 0 -> 1 (opening-add-b)

  const codeX = 80;
  const codeY = -205;
  const lineH = 74;
  const laneAX = -665;
  const laneBX = -335;

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const yOf = (idx) => codeY + idx * lineH;
      const yA = yOf(lineA.value);
      const yB = yOf(lineB.value);
      const callsN = Math.round(callCount.value);
      const hasSeen = seenAdded.value > 0.5;
      const bothAdded = bAdded.value > 0.5;
      const qOn = showQuestion.value > 0.5 && callsN === 0;
      const focusIdx = Math.round(activeCode.value);

      const nodes = [
        // Vertical glowing execution rails split cleanly around A and B capsules (zero bleed at fade!)
        txt('WORKER A', laneAX, -295, 26, ROLE.workerA, 'mono', 'center').opacity(alpha),
        txt('WORKER B', laneBX, -295, 26, ROLE.workerB, 'mono', 'center').opacity(alpha),
        ...(yA - 42 > codeY - 24
          ? [
              line([laneAX, codeY - 24], [laneAX, yA - 42], {
                stroke: hexAlpha(ROLE.workerA, 0.35 * alpha),
                width: 4,
              }),
            ]
          : []),
        ...(yOf(3) + 28 > yA + 42
          ? [
              line([laneAX, yA + 42], [laneAX, yOf(3) + 28], {
                stroke: hexAlpha(ROLE.workerA, 0.35 * alpha),
                width: 4,
              }),
            ]
          : []),
        ...(yB - 42 > codeY - 24
          ? [
              line([laneBX, codeY - 24], [laneBX, yB - 42], {
                stroke: hexAlpha(ROLE.workerB, 0.35 * alpha),
                width: 4,
              }),
            ]
          : []),
        ...(yOf(3) + 28 > yB + 42
          ? [
              line([laneBX, yB + 42], [laneBX, yOf(3) + 28], {
                stroke: hexAlpha(ROLE.workerB, 0.35 * alpha),
                width: 4,
              }),
            ]
          : []),

        // Horizontal alignment guides strictly right of Worker B toward code lines
        ...[0, 1, 2, 3].map((i) =>
          line([laneBX + 96, yOf(i)], [codeX - 42, yOf(i)], {
            stroke: hexAlpha('#2b3b60', i === focusIdx ? 0.8 * alpha : 0.32 * alpha),
            width: i === focusIdx ? 2.4 : 1.4,
            dash: [6, 8],
          }),
        ),

        // Floating Python code spotlight (right side)
        codeSpotlight(UNSAFE_LINES, codeX, codeY, {
          lineH,
          size: 32,
          activeLines: [focusIdx],
          activeColor: callsN >= 2 ? ROLE.fail : ROLE.focus,
          beamW: 720,
          alpha,
        }),

        // Moving Worker A & Worker B capsules
        glowPill('A', laneAX, yA, ROLE.workerA, {
          size: 28,
          fixedW: 112,
          alpha,
          glow: 12,
        }),
        glowPill('B', laneBX, yB, ROLE.workerB, {
          size: 28,
          fixedW: 112,
          alpha,
          glow: 12,
        }),
      ];

      // Ambient pulse rings when both are paused on line 2 (fetch)
      if (lineA.value > 1.8 && lineB.value > 1.8 && callsN === 0) {
        nodes.push(
          glowDot(laneAX + 78, yOf(2), {
            radius: 6 + 3 * pulse,
            color: ROLE.focus,
            glow: 12,
            opacity: alpha,
          }),
          glowDot(laneBX + 78, yOf(2), {
            radius: 6 + 3 * pulse,
            color: ROLE.focus,
            glow: 12,
            opacity: alpha,
          }),
        );
      }

      // Live Watch Readouts below rails & code (y = 155 .. 265)
      const watchY = 175;
      const seenStr = hasSeen ? '{"/guide"}' : 'set()';
      const seenCol = hasSeen ? ROLE.ok : ROLE.focus;
      const callStr =
        callsN === 0
          ? qOn
            ? '[ ? ]'
            : '[]'
          : callsN === 1
            ? '["/guide"]'
            : '["/guide", "/guide"]';
      const callCol = callsN >= 2 ? ROLE.fail : callsN === 1 ? ROLE.workerA : ROLE.workerB;

      nodes.push(
        txt('SHARED SET: seen', -495, watchY - 58, 26, COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
        glowPill(seenStr, -495, watchY + 8, seenCol, {
          size: 32,
          fixedW: 410,
          alpha,
          glow: hasSeen ? 11 : 6,
        }),
        txt(
          hasSeen ? '1 unique entry' : '0 entries',
          -495,
          watchY + 72,
          26,
          seenCol,
          'mono',
          'center',
        ).opacity(alpha),

        txt('FETCH CALL LOG', 330, watchY - 58, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        glowPill(callStr, 330, watchY + 8, callCol, {
          size: 32,
          fixedW: 610,
          alpha,
          glow: callsN >= 2 ? 14 : 7,
        }),
        txt(
          callsN === 0
            ? qOn
              ? 'resume both workers -> ?'
              : '0 calls recorded'
            : callsN === 1
              ? '1 fetch call'
              : '2 fetch calls (duplicate!)',
          330,
          watchY + 72,
          26,
          callCol,
          'mono',
          'center',
        ).opacity(alpha),
      );

      // Bottom narrative prompt / takeaway (y = 345)
      const capY = 345;
      if (bothAdded) {
        nodes.push(
          txt(
            'Final set holds 1 URL while fetch ran twice. Count the call log in your test.',
            0,
            capY,
            28,
            ROLE.fail,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (qOn) {
        nodes.push(
          txt(
            'Both workers passed the empty check. How many calls will the log record?',
            0,
            capY,
            30,
            ROLE.focus,
            'serif',
            'center',
          )
            .glow(7, ROLE.focus)
            .opacity(alpha * (0.82 + 0.18 * pulse)),
        );
      } else if (callsN >= 1) {
        nodes.push(
          txt(
            callsN === 1
              ? 'Worker A invokes fetch("/guide")...'
              : 'Worker B invokes fetch("/guide") too!',
            0,
            capY,
            28,
            callsN >= 2 ? ROLE.fail : ROLE.workerA,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          txt(
            'Check-then-act without a lock lets two workers enter fetch together.',
            0,
            capY,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'CHECK-THEN-ACT RACE  ·  url = "/guide"',
          callsN >= 2
            ? 'SET: 1 ENTRY  ·  CALL LOG: 2 CALLS'
            : qOn
              ? 'BOTH PAUSED BEFORE FETCH'
              : 'STEPPING TWO WORKERS',
          { accent: callsN >= 2 ? ROLE.fail : ROLE.workerB, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.workerA, ROLE.workerB), title, layer);

  // Cue choreography (strict prediction withholding via after: true!)
  playCue(
    s,
    c,
    'opening-check',
    (d) => s.play(lineA.to(1, { duration: d }), activeCode.to(1, { duration: 0.12 })),
    { dur: 0.5 },
  );
  playCue(
    s,
    c,
    'opening-pause',
    (d) => s.play(lineA.to(2, { duration: d }), activeCode.to(2, { duration: 0.12 })),
    { dur: 0.5 },
  );
  playCue(
    s,
    c,
    'opening-b',
    (d) => s.play(lineB.to(1, { duration: d }), activeCode.to(1, { duration: 0.12 })),
    { dur: 0.45 },
  );
  playCue(s, c, 'opening-b', (d) => s.play(lineB.to(2, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'opening-a', () => s.play(activeCode.to(2, { duration: 0.12 })), { dur: 0.25 });
  playCue(s, c, 'opening-question', (d) => s.play(showQuestion.to(1, { duration: d })), {
    dur: 0.35,
  });

  // Strict reveals ONLY after spoken result clauses
  playCue(
    s,
    c,
    'opening-fetch-a',
    (d) => s.play(callCount.to(1, { duration: d }), activeCode.to(2, { duration: 0.1 })),
    { after: true, dur: 0.25 },
  );
  playCue(s, c, 'opening-fetch-b', (d) => s.play(callCount.to(2, { duration: d })), {
    after: true,
    dur: 0.25,
  });
  playCue(
    s,
    c,
    'opening-record',
    (d) =>
      s.play(
        lineA.to(3, { duration: d }),
        activeCode.to(3, { duration: 0.12 }),
        seenAdded.to(1, { duration: 0.25 }),
      ),
    { after: true, dur: 0.4 },
  );
  playCue(
    s,
    c,
    'opening-add-b',
    (d) => s.play(lineB.to(3, { duration: d }), bAdded.to(1, { duration: 0.25 })),
    { dur: 0.45 },
  );
}
