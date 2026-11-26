// Scene 26: Can the decode worker read this buffer? (DOUBLE PREDICTION: 384/512 -> 128 missing; attempt 7 stale -> HOLD; attempt 8 L2 -> READ; replay L1 -> HOLD!)
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  kvHandoff,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function transferFailure(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = 3/4 segments (384/512 MiB) PREDICT HOLD 1 ("How much still has to arrive?")
  // 1 = 128 MiB missing!
  // 2 = last block arrives (512/512 MiB)
  // 3 = ready event #7 arrives for attempt 8 -> STALE -> HOLD!
  // 4 = ready event #8 arrives (attempt matches!)
  // 5 = compatible L2 + attempt 8 -> READ KV OPEN!
  // 6 = replay with layout L1 vs required L2 -> PREDICT HOLD 2 ("Can this reader start?")
  // 7 = HOLD DECODE! (incompatible layout)
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61a', '#ff6b8b18');
  const title = heroTitle(['Can the Decode Worker', 'Read This KV Buffer?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.fail,
    eyebrow: 'P/D HANDOFF SAFETY · BYTES · ATTEMPT ID · LAYOUT',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;

    const received = st >= 2 ? 512 : 384;
    const signal = st >= 4 ? 8 : st === 3 ? 7 : null;
    const isReplay = st >= 6;
    const layout = isReplay ? 'L1' : 'L2';
    const handoff = kvHandoff({
      reserved: 512,
      received,
      currentAttempt: 8,
      readyAttempt: signal,
      readerReady: signal !== null,
      layout: layout === 'L2',
    });

    const nodes = [];

    // Header bar for active transfer attempt
    nodes.push(
      txt(
        'R42 · CURRENT DECODE ATTEMPT #8 (RESERVED 512 MiB)',
        -760,
        -205,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        isReplay ? 'REPLAY: SENDER LAYOUT L1' : 'ORIGINAL TRANSFER',
        760,
        -205,
        26,
        isReplay ? COSMOS.gold : ROLE.prefill,
        'mono',
        'right',
      ),
    );

    // 4 segments of 128 MiB each
    for (let i = 0; i < 4; i++) {
      const cx = -570 + i * 380;
      const filled = i < 3 || st >= 2;
      nodes.push(
        glassCell(cx, -108, 355, 102, filled ? ROLE.radix : COSMOS.gold, {
          fill: filled ? '#0e2536' : '#201c10',
          glow: filled ? 8 : 6,
        }),
        txt(`Block ${i + 1}: 128 MiB`, cx, -132, 26, filled ? ROLE.radix : COSMOS.gold, 'mono'),
        txt(filled ? 'RECEIVED' : 'EMPTY', cx, -82, 28, filled ? COSMOS.ink : COSMOS.gold, 'mono'),
      );
    }

    // Byte count & missing readout (strictly withheld during step 0!)
    const missingLabel =
      st === 0
        ? 'Received: 384 / 512 MiB  |  Missing: ? MiB'
        : `Received: ${received} / 512 MiB  |  Missing: ${handoff.missing} MiB`;
    nodes.push(txt(missingLabel, 0, -14, 28, st === 0 ? COSMOS.gold : ROLE.radix, 'mono'));

    // 3 Gate check cards: Layout, Ready Event, Decode Consumer Verdict
    const layoutOk = layout === 'L2';
    const eventOk = signal === 8;

    const layoutCardCol = !isReplay ? ROLE.prefill : st >= 7 ? ROLE.fail : COSMOS.gold;
    const layoutCardFill = !isReplay ? '#10213d' : st >= 7 ? '#2c1120' : '#221c10';
    nodes.push(
      glassCell(-520, 145, 480, 185, layoutCardCol, {
        fill: layoutCardFill,
        glow: isReplay ? 10 : 7,
      }),
      txt('1. KV LAYOUT CHECK', -520, 88, 26, COSMOS.muted, 'mono'),
      txt('Required: L2', -520, 142, 28, COSMOS.ink, 'mono'),
      txt(
        `Received: ${layout}`,
        -520,
        196,
        30,
        layoutOk ? ROLE.decode : st >= 7 ? ROLE.fail : COSMOS.gold,
        'mono',
      ),

      glassCell(0, 145, 480, 185, eventOk ? ROLE.decode : signal === 7 ? ROLE.fail : COSMOS.dim, {
        fill: eventOk ? '#0d2922' : signal === 7 ? '#2c1120' : '#0b101d',
        glow: signal !== null ? 9 : 2,
      }),
      txt('2. READY EVENT', 0, 88, 26, COSMOS.muted, 'mono'),
      txt('Required: Attempt #8', 0, 142, 28, COSMOS.ink, 'mono'),
      txt(
        signal === null ? 'No event yet' : `Event: Attempt #${signal}`,
        0,
        196,
        30,
        eventOk ? ROLE.decode : signal === 7 ? ROLE.fail : COSMOS.muted,
        'mono',
      ),
    );

    // Decode Worker Verdict card (strictly withheld on step 0 & step 6!)
    const showVerdict = st === 3 || st === 5 || st === 7;
    const verdictTxt =
      st === 0
        ? 'Awaiting bytes'
        : st === 6
          ? 'Read KV?'
          : showVerdict
            ? handoff.canDecode
              ? 'READ KV (OPEN)'
              : 'HOLD DECODE'
            : 'Waiting...';
    const verdictCol =
      st === 6 || st === 0
        ? COSMOS.gold
        : showVerdict
          ? handoff.canDecode
            ? ROLE.decode
            : ROLE.fail
          : COSMOS.muted;

    nodes.push(
      glassCell(520, 145, 480, 185, verdictCol, {
        fill:
          showVerdict && handoff.canDecode
            ? '#0d2922'
            : showVerdict && !handoff.canDecode
              ? '#2c1120'
              : '#181928',
        glow: 11,
      }),
      txt('3. DECODE WORKER', 520, 88, 26, COSMOS.muted, 'mono'),
      txt(verdictTxt, 520, 162, 34, verdictCol, 'mono'),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 278, { radius: 6, color: verdictCol }),
      txt(
        st === 0
          ? 'Predict: 3 of 4 segments (128 MiB each) arrived. How much still has to arrive?'
          : st === 1
            ? '128 MiB are missing (512 - 384 = 128).'
            : st === 2
              ? 'All 512 MiB are now in the destination buffer.'
              : st === 3
                ? 'Ready event #7 belongs to an earlier attempt: reader must HOLD even with full bytes.'
                : st === 4
                  ? 'Ready event #8 arrives: model, layout L2, dtype, and positions match.'
                  : st === 5
                    ? 'All checks pass: decode worker reads KV.'
                    : st === 6
                      ? 'Predict: Same 512 MiB & current event #8, but sender used L1 (receiver expects L2). Start?'
                      : 'HOLD decode: reading L1 bytes as L2 corrupts KV. Retry with compatible layout or cancel.',
        0,
        352,
        28,
        st === 0 || st === 6 ? COSMOS.gold : st === 7 || st === 3 ? ROLE.fail : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['transfer-segments', 0],
    ['transfer-short', 1, true],
    ['transfer-last-block', 2, true],
    ['transfer-old', 3, true],
    ['transfer-current', 4, true],
    ['transfer-read', 5, true],
    ['transfer-layout', 6],
    ['transfer-hold', 7, true],
  ]);
}
