// Scene 27: synthesis: "Can you get back to the trace?"
// Prediction beat (B0 hold=2.0): Drop `source: trace-17` from a compacted note ->
// "Can you recover the status from what's left?"
// B1 (`note-read`): Lookup returns NO KEY (null) -> re-compacting prose cannot restore the key.
// B2 (`note-pin`, `note-reread`): Restore original checked note & pin `trace-17` -> recovers HTTP 403!
import {
  COSMOS,
  FINDINGS,
  ROLE,
  TRACE,
  aura,
  checkMark,
  chip,
  cornerBrackets,
  crossMark,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  txt,
} from '../parts.mjs';

export default function synthesis(s, c) {
  const dropSource = s.value(0);
  const tryMissing = s.value(0); // WITHHELD until B1 note-read!
  const restorePin = s.value(0);
  const tryRestored = s.value(0);

  const bgAura = aura(0, 20, 820, '#14335c2a', '#2c142622');
  const title = heroTitle(['Can you get back', 'to the trace?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.evidence,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const dr = ease(dropSource.value);
    const tm = ease(tryMissing.value);
    const rp = ease(restorePin.value);
    const tr = ease(tryRestored.value);

    const hasSource = dr < 0.4 || rp > 0.4;
    const noteCol = rp > 0.4 ? ROLE.note : dr > 0.4 ? ROLE.units : ROLE.evidence;
    const lookupCol = tr > 0.4 ? ROLE.note : tm > 0.4 && rp < 0.4 ? ROLE.poison : ROLE.dim;

    const nodes = [
      // Left: Saved / Compacted Note
      cornerBrackets(-475, 10, 760, 420, noteCol, { arm: 32, width: 3.2, opacity: alpha }),
      txt(
        rp > 0.4
          ? 'RESTORED CHECKED NOTE (KEY PINNED)'
          : dr > 0.4
            ? 'SHORTENED NOTE (SOURCE DROPPED)'
            : 'SAVED CALLBACK NOTE',
        -820,
        -155,
        26,
        noteCol,
        'mono',
        'left',
      ).opacity(alpha),
      txt('finding:', -820, -70, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(FINDINGS[0].finding, -820, -10, 34, COSMOS.ink, 'serif', 'left').opacity(alpha),

      // Source ID slot
      txt('source:', -820, 90, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      hasSource
        ? chip('trace-17  (PINNED)', -475, 90, {
            color: rp > 0.4 ? ROLE.note : ROLE.evidence,
            size: 28,
            minW: 360,
            glow: rp > 0.4 ? 12 : 7,
            opacity: alpha,
          })
        : txt('(omitted)', -650, 90, 34, ROLE.poison, 'mono', 'left').opacity(alpha),

      // Status caption below source slot (never crosses text!)
      dr > 0.25 && dr < 0.95 && rp < 0.2
        ? crossMark(-235, 90, 32, ROLE.poison, alpha)
        : txt(
            hasSource ? 'Archive handle preserved' : 'Sentence still reads fine, key is gone',
            -820,
            172,
            26,
            hasSource ? ROLE.note : ROLE.units,
            'sans',
            'left',
          ).opacity(alpha),

      // Center lookup arrow
      glowArrow([-75, 10], [75, 10], lookupCol, { width: 4.5, opacity: alpha }),
      txt('archive[source]', 0, -42, 26, lookupCol, 'mono', 'center').opacity(alpha),

      // Right: Archive Lookup Slot
      cornerBrackets(475, 10, 760, 420, lookupCol, { arm: 32, width: 3.2, opacity: alpha }),
      txt('ARCHIVE LOOKUP RESULT', 130, -155, 26, lookupCol, 'mono', 'left').opacity(alpha),
    ];

    if (tr > 0.35) {
      nodes.push(
        checkMark(155, -50, 34, ROLE.note, alpha * tr),
        txt('trace-17 FOUND', 205, -50, 36, ROLE.note, 'mono', 'left').opacity(alpha * tr),
        txt(`${TRACE.trace}   ${TRACE.path}`, 130, 35, 36, COSMOS.ink, 'mono', 'left').opacity(
          alpha * tr,
        ),
        txt(`HTTP ${TRACE.status}`, 130, 128, 66, ROLE.note, 'serif', 'left')
          .glow(10, ROLE.note)
          .opacity(alpha * tr),
      );
    } else if (tm > 0.35 && rp < 0.4) {
      nodes.push(
        crossMark(155, -50, 34, ROLE.poison, alpha * tm),
        txt('NO KEY FOR ARCHIVE', 205, -50, 36, ROLE.poison, 'mono', 'left').opacity(alpha * tm),
        txt('lookup(undefined) -> null', 130, 35, 34, ROLE.poison, 'mono', 'left').opacity(
          alpha * tm,
        ),
        txt(
          'Re-compacting prose cannot restore the key.',
          130,
          122,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(alpha * tm),
      );
    } else {
      nodes.push(
        txt('Waiting on lookup...', 130, -15, 36, COSMOS.muted, 'serif', 'left').opacity(alpha),
        txt(
          rp > 0.4 ? 'Key trace-17 ready for retry' : 'Can the exact HTTP status be recovered?',
          130,
          65,
          28,
          ROLE.units,
          'sans',
          'left',
        ).opacity(alpha),
      );
    }

    // Bottom prediction / synthesis message (strictly withheld during B0, steady across B2!)
    const bottom =
      rp > 0.35
        ? 'A checked note with a pinned source ID buys a clean path back to archive evidence.'
        : tm > 0.35
          ? 'No key, no lookup: cap repeated prep attempts and record the gap.'
          : dr > 0.35
            ? 'Source ID dropped, prose intact. Can you recover the exact HTTP status?'
            : 'Tomorrow’s investigator needs the exact HTTP status from this callback note.';

    nodes.push(
      txt(
        bottom,
        0,
        360,
        32,
        tr > 0.35 ? ROLE.note : tm > 0.35 && rp < 0.4 ? ROLE.poison : ROLE.units,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'note-shorten', (d) => s.play(dropSource.to(1, { duration: d })));
  // Prediction reveal ONLY in B1 on note-read!
  playCue(s, c, 'note-read', (d) => s.play(tryMissing.to(1, { duration: d })));
  playCue(s, c, 'note-pin', (d) => s.play(restorePin.to(1, { duration: d })));
  playCue(s, c, 'note-reread', (d) => s.play(tryRestored.to(1, { duration: d })));
}
