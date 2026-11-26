// Scene 33: Two replays of the last ticket (DOUBLE PREDICTION: 7 matching IDs ns A vs B -> 0 reused; 64/96 MiB -> 32 missing -> 96/96; split replay attempt 1 vs attempt 2 -> right starts!).
import {
  COSMOS,
  FRESH_DIFF_NS,
  FRESH_TOKENS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  kvHandoff,
  line,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function freshHandoff(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = 7 leading token IDs match path stored in ns A (page size 4)
  // 1 = request needs namespace B
  // 2 = B transfer attempt 2: 64 / 96 MiB arrived -> PREDICT HOLD 1 (reuse from A? missing MiB?)
  // 3 = reveal: B reuses 0 positions from A!
  // 4 = reveal: 32 MiB missing!
  // 5 = last 32 MiB arrive -> 96 / 96 MiB full, waiting for ready event
  // 6 = split into Left replay (event Attempt 1) vs Right replay
  // 7 = Right replay (event Attempt 2) -> PREDICT HOLD 2 (Which replay can start decode?)
  // 8 = reveal: ONLY Right replay starts decode; Left holds!
  // 9 = Right replay follows ready event into decode step
  // 10 = Right reader uses all 3 blocks (both still 0 from A; next lesson: slime)
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61c', '#6ee7b71a');
  const title = heroTitle(['Final Handoff:', 'Two Replays of Ticket B'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'NAMESPACE ISOLATION + ATTEMPT-ID DECODE GATE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st <= 5) {
      // Part 1: Namespace A vs B (7 tokens, page 4) + B's 96 MiB transfer
      const needB = st >= 1;
      const showBuf = st >= 2;
      const showZero = st >= 3;
      const showMiss = st >= 4;
      const filled = st >= 5;

      const startX = -380;
      const pitch = 165;
      nodes.push(
        txt('Stored in A', -770, -172, 26, ROLE.prefill, 'mono', 'left'),
        txt(
          needB ? 'Request in B' : 'Request',
          -770,
          -78,
          26,
          needB ? COSMOS.gold : ROLE.prefill,
          'mono',
          'left',
        ),
      );

      FRESH_TOKENS.forEach((tok, i) => {
        const cx = startX + i * pitch + (i >= 4 ? 26 : 0);
        nodes.push(
          glassCell(cx, -172, 140, 72, ROLE.prefill, { fill: '#10213d', glow: 6 }),
          txt(tok, cx, -172, 30, COSMOS.ink, 'mono'),
          glassCell(cx, -78, 140, 72, needB ? COSMOS.gold : ROLE.radix, {
            fill: needB ? '#201c10' : '#0e2436',
            glow: 6,
          }),
          txt(tok, cx, -78, 30, COSMOS.ink, 'mono'),
        );
      });

      // First 4-token page bracket + reuse answer (strictly withheld until st >= 3!)
      nodes.push(
        line([startX - 70, -24], [startX + 3 * pitch + 70, -24], { color: ROLE.radix, width: 3 }),
        txt('1st full page (4 tokens)', startX + 1.5 * pitch, 8, 26, ROLE.radix, 'mono'),
        txt(
          showZero
            ? `Reuse from A: ${FRESH_DIFF_NS.reusable} positions`
            : 'Reuse from A: ? positions',
          560,
          8,
          28,
          showZero ? ROLE.fail : COSMOS.gold,
          'mono',
        ),
      );

      // B's own 96 MiB transfer (3 x 32 MiB blocks)
      if (showBuf) {
        const recvMiB = filled ? 96 : 64;
        const missMiB = 96 - recvMiB;
        nodes.push(
          txt(
            'B OWN TRANSFER · ATTEMPT #2 (96 MiB = 3 x 32 MiB)',
            -770,
            86,
            26,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            showMiss
              ? `${recvMiB} / 96 MiB  |  ${missMiB} MiB missing`
              : `${recvMiB} / 96 MiB  |  ? MiB missing`,
            770,
            86,
            26,
            filled ? ROLE.decode : COSMOS.gold,
            'mono',
            'right',
          ),
        );
        for (let i = 0; i < 3; i++) {
          const cx = -510 + i * 510;
          const ok = i < 2 || filled;
          nodes.push(
            glassCell(cx, 178, 475, 96, ok ? ROLE.radix : COSMOS.gold, {
              fill: ok ? '#0e2536' : '#201c10',
              glow: ok ? 8 : 6,
            }),
            txt(`Block ${i + 1}: 32 MiB`, cx, 156, 26, ok ? ROLE.radix : COSMOS.gold, 'mono'),
            txt(ok ? 'RECEIVED' : 'PENDING', cx, 200, 26, ok ? COSMOS.ink : COSMOS.gold, 'mono'),
          );
        }
      }
    } else {
      // Part 2: Forked Replay (Left: Attempt 1 vs Right: Attempt 2)
      const rightReady = st >= 7;
      const revealed = st >= 8;
      const reading = st >= 10;

      const leftGate = kvHandoff({
        reserved: 96,
        received: 96,
        currentAttempt: 2,
        readyAttempt: 1,
        readerReady: true,
      });
      const rightGate = kvHandoff({
        reserved: 96,
        received: 96,
        currentAttempt: 2,
        readyAttempt: 2,
        readerReady: true,
      });

      nodes.push(
        txt(
          'SAME REQUEST B · 96 / 96 MiB FULL · COMPATIBLE LAYOUT · WAITING FOR ATTEMPT #2',
          0,
          -205,
          26,
          ROLE.prefill,
          'mono',
        ),
      );

      const trials = [
        { name: 'LEFT REPLAY', cx: -425, ev: 'Event: Attempt #1', evShown: true, gate: leftGate },
        {
          name: 'RIGHT REPLAY',
          cx: 425,
          ev: 'Event: Attempt #2',
          evShown: rightReady,
          gate: rightGate,
        },
      ];

      trials.forEach((tr) => {
        const canGo = tr.gate.canDecode;
        const col = !revealed ? COSMOS.gold : canGo ? ROLE.decode : ROLE.fail;
        nodes.push(
          glassCell(tr.cx, 35, 760, 400, col, {
            fill: !revealed ? '#12182b' : canGo ? '#0d2922' : '#2a1220',
            glow: revealed ? 11 : 6,
          }),
          txt(tr.name, tr.cx, -120, 30, COSMOS.ink, 'mono'),
          txt('Buffer: 96 / 96 MiB (3 blocks)', tr.cx, -62, 26, ROLE.radix, 'mono'),

          glassCell(
            tr.cx,
            18,
            560,
            84,
            tr.evShown ? (revealed ? (canGo ? ROLE.decode : ROLE.fail) : ROLE.prefill) : COSMOS.dim,
            {
              fill: '#0e172a',
              glow: 7,
            },
          ),
          txt(
            tr.evShown ? tr.ev : 'Awaiting ready event',
            tr.cx,
            18,
            30,
            tr.evShown ? COSMOS.ink : COSMOS.dim,
            'mono',
          ),

          glassCell(tr.cx, 140, 560, 96, col, {
            fill: !revealed ? '#201c10' : canGo ? '#0e3428' : '#331322',
            glow: 10,
          }),
          txt(
            !revealed
              ? 'Read KV?'
              : canGo
                ? reading
                  ? 'DECODING ALL 3 BLOCKS'
                  : 'START DECODE (OPEN)'
                : 'HOLD (STALE EVENT)',
            tr.cx,
            140,
            30,
            col,
            'mono',
          ),
        );
      });
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 292, { radius: 6, color: st >= 8 ? ROLE.decode : COSMOS.gold }),
      txt(
        st <= 1
          ? 'Seven tokens match A (page 4), while our request requires Namespace B.'
          : st === 2
            ? 'Predict: How many positions can B reuse from A, and how many MiB of B transfer are missing?'
            : st === 3
              ? 'B reuses 0 positions from A: cross-namespace pages cannot be shared.'
              : st === 4
                ? 'B still needs 32 MiB (96 - 64 = 32).'
                : st === 5
                  ? 'All 96 MiB are now resident; hold right here before any ready event arrives.'
                  : st === 6
                    ? 'Left replay gets ready event Attempt #1; Right replay awaits its event...'
                    : st === 7
                      ? 'Predict: Both workers wait for Attempt #2. Left gets #1, Right gets #2. Which can start?'
                      : st <= 9
                        ? 'Only Right starts decode (Attempt #2); Left holds.'
                        : 'Right replay decodes all 3 blocks (both still 0 from A). Next: slime RL rollout & trainer.',
        0,
        355,
        28,
        st === 2 || st === 7 ? COSMOS.gold : st >= 8 ? ROLE.decode : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['fresh-path', 0],
    ['fresh-b', 1],
    ['fresh-input', 2],
    ['sg-fresh-zero', 3, true],
    ['sg-fresh-missing', 4, true],
    ['sg-fresh-fill', 5, true],
    ['fresh-stamps', 6],
    ['sg-fresh-ready', 7],
    ['sg-fresh-decode', 8, true],
    ['fresh-launch', 9],
    ['fresh-read', 10, true],
  ]);
}
