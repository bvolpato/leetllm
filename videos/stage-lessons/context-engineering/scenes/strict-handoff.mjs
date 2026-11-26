// Scene 14: strict-handoff: "What can the lead accept from the worker?"
// Prediction 1 (B0 -> B1): 1,599-byte envelope + 2 trailing spaces -> 1,601 bytes vs 1,600-byte limit.
// B2: Undo 2 spaces -> open 3-field JSON contract (claim, source_ids, next_check).
// Prediction 2 (B3 -> B4): Worker claims HTTP 200 vs cited trace-17 HTTP 403 -> withhold -> fix to 403 -> match!
import {
  COSMOS,
  ENVELOPE_200,
  ENVELOPE_403,
  ENVELOPE_PADDED,
  HANDOFF_LIMIT,
  ROLE,
  TRACE,
  aura,
  checkMark,
  cornerBrackets,
  crossMark,
  ease,
  fmt,
  group,
  guardedDynamic,
  heroTitle,
  limitMarker,
  playCue,
  rect,
  swapVis,
  txt,
} from '../parts.mjs';

export default function strictHandoff(s, c) {
  const viewBytes = s.value(1);
  const viewVerify = s.value(0);
  const addSpaces = s.value(0);
  const askOpen = s.value(0);
  const stopAt1601 = s.value(0); // WITHHELD until B1 handoff-stop!
  const openTrace = s.value(0);
  const ask200 = s.value(0);
  const reject200 = s.value(0); // WITHHELD until B4 handoff-reject!
  const fix403 = s.value(0);
  const promote403 = s.value(0);

  const bgAura = aura(0, 0, 820, '#14335c28', '#2c142624');
  const title = heroTitle(['What can the lead', 'accept from the worker?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.units,
  });

  // View 1 (B0-B1): Magnified wire byte ruler (1,596 .. 1,602)
  const byteLayer = guardedDynamic(viewBytes, (alpha) => {
    const add = ease(addSpaces.value);
    const ask = ease(askOpen.value);
    const stp = ease(stopAt1601.value);

    const bytes = add > 0.4 ? ENVELOPE_PADDED.bytes : ENVELOPE_200.bytes;
    const from = HANDOFF_LIMIT - 4; // 1596
    const cellW = 215;
    const startX = -752;

    const nodes = [
      txt(
        'LAST BYTE POSITIONS ON THE WIRE (JSON OBJECT + TRAILING SPACES)',
        -855,
        -245,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 7; i++) {
      const pos = from + i;
      const cx = startX + i * cellW + cellW / 2;
      const filled = pos <= bytes;
      const excess = stp > 0.4 && pos > HANDOFF_LIMIT;
      const col = !filled ? '#2b385a' : excess ? ROLE.poison : ROLE.evidence;

      nodes.push(
        txt(fmt(pos), cx, -155, 28, excess ? ROLE.poison : COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
        rect(cellW - 18, 108, {
          fill: filled ? (excess ? '#2c1220' : '#10203a') : '#0b1020',
          stroke: col,
          width: filled ? 2.8 : 1.6,
          radius: 10,
        })
          .at(cx, -65)
          .glow(filled ? 8 : 0, col)
          .opacity(alpha),
      );
      if (filled) {
        nodes.push(
          txt('space', cx, -65, 32, excess ? ROLE.poison : COSMOS.ink, 'mono', 'center').opacity(
            alpha,
          ),
        );
      }
    }

    // 1,600-byte boundary marker between cell 4 (1600) and cell 5 (1601)
    const cutX = startX + 5 * cellW;
    nodes.push(
      limitMarker(cutX, -185, 30, ROLE.units, '1,600-byte limit', { size: 28, opacity: alpha }),

      txt('WIRE LENGTH RECEIVED', -855, 130, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(
        `${fmt(bytes)} bytes`,
        -855,
        195,
        58,
        stp > 0.4 ? ROLE.poison : ROLE.evidence,
        'mono',
        'left',
      )
        .glow(10, stp > 0.4 ? ROLE.poison : ROLE.evidence)
        .opacity(alpha),

      // Verdict / prediction prompt (strictly withheld during B0!)
      txt(
        stp > 0.4
          ? 'STOP at 1,601 bytes: rejected BEFORE UTF-8 decoding or JSON parsing.'
          : ask > 0.2
            ? 'Two trailing spaces added (1,601 bytes). Will the receiver open this copy?'
            : 'Every trailing space counts on the wire before decoding.',
        0,
        345,
        34,
        stp > 0.4 ? ROLE.poison : ROLE.units,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  // View 2 (B2-B5): Opened 1,599-byte JSON contract vs cited trace-17
  const verifyLayer = guardedDynamic(viewVerify, (alpha) => {
    const op = ease(openTrace.value);
    const a2 = ease(ask200.value);
    const rj = ease(reject200.value);
    const fx = ease(fix403.value);
    const pr = ease(promote403.value);

    const env = fx > 0.4 ? ENVELOPE_403 : ENVELOPE_200;
    const item = env.result.item;
    const leftCol = pr > 0.4 ? ROLE.note : rj > 0.4 && fx < 0.4 ? ROLE.poison : ROLE.evidence;

    const nodes = [
      // Left: Opened 3-field JSON envelope
      cornerBrackets(-450, 0, 780, 420, leftCol, { arm: 32, width: 3, opacity: alpha }),
      txt(
        `OPENED ENVELOPE  (${fmt(env.bytes)} bytes <= 1,600)`,
        -805,
        -165,
        26,
        leftCol,
        'mono',
        'left',
      ).opacity(alpha),
      txt('claim:', -805, -80, 28, ROLE.evidence, 'mono', 'left').opacity(alpha),
      txt(item.claim, -560, -80, 42, fx > 0.4 ? ROLE.note : ROLE.units, 'mono', 'left').opacity(
        alpha,
      ),
      txt('source_ids:', -805, 8, 28, ROLE.evidence, 'mono', 'left').opacity(alpha),
      txt('["trace-17"]', -560, 8, 32, COSMOS.ink, 'mono', 'left').opacity(alpha),
      txt('next_check:', -805, 92, 28, ROLE.evidence, 'mono', 'left').opacity(alpha),
      txt(item.next_check, -560, 92, 27, COSMOS.muted, 'sans', 'left').opacity(alpha),
      txt(
        'UTF-8 valid | unique keys | 3 fields',
        -805,
        168,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),

      // Right: Cited authorized source record (trace-17)
      cornerBrackets(450, 0, 760, 420, op > 0.3 ? ROLE.evidence : ROLE.rule, {
        arm: 32,
        width: 3,
        opacity: alpha,
      }),
      txt('AUTHORIZED ARCHIVE RECORD', 110, -165, 26, ROLE.evidence, 'mono', 'left').opacity(alpha),
      txt('trace-17', 110, -85, 36, ROLE.evidence, 'mono', 'left').opacity(alpha),
      txt(
        op > 0.3 ? `${TRACE.trace}   ${TRACE.path}` : 'Ready for host lookup',
        110,
        0,
        34,
        op > 0.3 ? COSMOS.ink : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        op > 0.3 ? `HTTP ${TRACE.status}` : 'Status unread',
        110,
        100,
        62,
        op > 0.3 ? ROLE.poison : COSMOS.dim,
        'serif',
        'left',
      ).opacity(alpha),
    ];

    if (pr > 0.4) {
      nodes.push(checkMark(680, 100, 42, ROLE.note, alpha * pr));
    } else if (rj > 0.4 && fx < 0.4) {
      nodes.push(crossMark(680, 100, 42, ROLE.poison, alpha * rj));
    }

    // Bottom status / prediction prompt (strictly withheld during B3!)
    const msg =
      pr > 0.4
        ? 'Values match (HTTP 403). Keep status + trace-17 together for the lead.'
        : fx > 0.4
          ? 'Worker claim updated to HTTP 403 (still 1,599 bytes): rechecking...'
          : rj > 0.4
            ? 'WITHHOLD HTTP 200. Trace-17 records HTTP 403.'
            : a2 > 0.2
              ? 'Worker says HTTP 200; trace says 403. Can the lead record 200?'
              : 'All 3 contract fields & authorized source ID passed schema check.';
    const msgCol = pr > 0.4 ? ROLE.note : rj > 0.4 && fx < 0.4 ? ROLE.poison : ROLE.units;

    nodes.push(txt(msg, 0, 355, 34, msgCol, 'serif', 'center').opacity(alpha));

    return group(...nodes);
  });

  s.add(bgAura, title, byteLayer, verifyLayer);

  playCue(s, c, 'handoff-add', (d) => s.play(addSpaces.to(1, { duration: d })));
  playCue(s, c, 'handoff-question', (d) => s.play(askOpen.to(1, { duration: d })));
  // Prediction 1 reveal ONLY in B1!
  playCue(s, c, 'handoff-stop', (d) => s.play(stopAt1601.to(1, { duration: d })));
  // B2 sequential swap from byte ruler to opened 3-field envelope
  playCue(s, c, 'handoff-undo', (d) => s.play(swapVis(viewBytes, viewVerify, d)));
  playCue(s, c, 'handoff-open', (d) => s.play(openTrace.to(1, { duration: d })));
  playCue(s, c, 'handoff-compare', (d) => s.play(ask200.to(1, { duration: d })));
  // Prediction 2 reveal ONLY in B4!
  playCue(s, c, 'handoff-reject', (d) => s.play(reject200.to(1, { duration: d })));
  playCue(s, c, 'handoff-correct', (d) => s.play(fix403.to(1, { duration: d })));
  playCue(s, c, 'handoff-promote', (d) => s.play(promote403.to(1, { duration: d })));
}
