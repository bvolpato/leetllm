// Scene 14: alignment-ledger - Does "open" make the cut?
// Magnified 1-ms boundary lens comparing 519 ms (keeps 11 chars: "Incident is") vs
// 520 ms (keeps 16 chars: "Incident is open"), plus strict int slice validation (no 16.0!).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  chunks,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  pendingText,
  txt,
  voiceReconcile,
} from '../parts.mjs';

export default function alignmentLedger(s, c) {
  const zoomOn = s.value(0);
  const slice11 = s.value(0); // STRICT after align-first!
  const slice16 = s.value(0); // STRICT after align-second!
  const valRules = s.value(0);
  const lateReject = s.value(0);

  const rec519 = voiceReconcile(pendingText, chunks, 519);
  const rec520 = voiceReconcile(pendingText, chunks, 520);

  const header = cinemaHeader('ALIGNMENT BOUNDARY LEDGER', 'Does “open” make', 'the cut?', {
    x: -860,
    y: -445,
    accent: ROLE.focus,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#ffd1661a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const zm = zoomOn.value;
      const s11 = slice11.value;
      const s16 = slice16.value;
      const vr = valRules.value;
      const lr = lateReject.value;
      const nodes = [];

      // Top seam table (4 chunks -> 64 total characters)
      const seamY = -165;
      const xs = [-630, -210, 210, 630];
      const names = [
        '0..240ms | char 11',
        '240..520ms | char 16',
        '520..860ms | char 37',
        '860..1120ms | char 64',
      ];
      const words = ['"Incident is"', '" open"', '" because the DB"', '" failover running."'];
      xs.forEach((x, idx) => {
        const hi = idx === 1;
        nodes.push(
          txt(words[idx], x, seamY, 26, hi ? ROLE.focus : ROLE.audio, 'mono', 'center'),
          txt(names[idx], x, seamY + 42, 26, hi ? ROLE.ok : COSMOS.muted, 'mono', 'center'),
        );
      });

      // Magnified 1-ms lens around 520 ms!
      const lensY = 30;
      const x518 = -380;
      const x519 = -80;
      const x520 = 220;
      const x521 = 520;
      nodes.push(
        txt(
          'MAGNIFIED 1 ms BOUNDARY LENS (SEAM AT 520 ms)',
          0,
          lensY - 102,
          26,
          ROLE.focus,
          'mono',
          'center',
        ),
        line([x518, lensY], [x521, lensY], { stroke: '#3b4f7d', width: 5 }),
        line([x520, lensY - 26], [x520, lensY + 26], { stroke: ROLE.ok, width: 4.5 }).glow(
          9,
          ROLE.ok,
        ),
        txt('520 ms SEAM', x520, lensY - 56, 26, ROLE.ok, 'mono', 'center'),
      );

      // Two competing client receipts: 519 ms vs 520 ms
      nodes.push(
        glowDot(x519, lensY, { radius: 8, color: ROLE.warn, glow: 10, opacity: 0.4 + zm * 0.6 }),
        txt('RECEIPT A: 519 ms', x519, lensY + 58, 26, ROLE.warn, 'mono', 'center').opacity(
          0.4 + zm * 0.6,
        ),
        glowDot(x520, lensY, { radius: 8, color: ROLE.ok, glow: 10, opacity: 0.4 + zm * 0.6 }),
        txt('RECEIPT B: 520 ms', x520, lensY + 58, 26, ROLE.ok, 'mono', 'center').opacity(
          0.4 + zm * 0.6,
        ),
      );

      // Reveal slice results ONLY after align-first / align-second!
      const resY = 175;
      if (s11 > 0.35 || s16 > 0.35) {
        nodes.push(
          txt(
            `519 ms -> endChar ${rec519.endChar}: "${rec519.retained}"`,
            -420,
            resY,
            28,
            ROLE.warn,
            'mono',
            'center',
          ).opacity(s11),
          txt(
            s16 > 0.35
              ? `520 ms -> endChar ${rec520.endChar}: "${rec520.retained}"`
              : '520 ms -> ?',
            420,
            resY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(s16 > 0.35 ? 7 : 0, ROLE.ok),
        );
      } else if (zm > 0.35) {
        nodes.push(
          txt(
            'Receipts at 519 ms vs 520 ms: which replay keeps the word "open"?',
            0,
            resY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            `All 4 chunks reconstruct all ${pendingText.length} characters strictly`,
            0,
            resY,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      // Top-right rule
      nodes.push(
        txt('WHOLE-CHUNK RULE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('last chunk with endMs <= receipt', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
      );

      // Bottom validation & late-receipt guard
      nodes.push(
        line([-840, 260], [840, 260], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          lr > 0.4
            ? 'FROZEN REPLY: LATE RECEIPTS CANNOT EXTEND HISTORY OR CANCEL NEXT REPLY'
            : vr > 0.4
              ? 'RECEIPT = 0 -> "" · REQUIRE STRICT INCREASING INTEGERS (REJECT 16.0 FLOAT!)'
              : 'Each seam binds an exact audio end time to an exclusive text offset',
          0,
          328,
          26,
          lr > 0.4 ? ROLE.cut : vr > 0.4 ? ROLE.warn : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('align-zoom', () => {
    s.play(zoomOn.to(1, { duration: clampDur(c, c.cue('align-zoom').start, 0.4) }));
  });
  c.after('align-first', () => {
    s.play(slice11.to(1, { duration: clampDur(c, c.cue('align-first').end, 0.35) }));
  });
  c.after('align-second', () => {
    s.play(slice16.to(1, { duration: clampDur(c, c.cue('align-second').end, 0.35) }));
  });
  c.on('align-type', () => {
    s.play(valRules.to(1, { duration: clampDur(c, c.cue('align-type').start, 0.35) }));
  });
  c.on('align-late', () => {
    s.play(lateReject.to(1, { duration: clampDur(c, c.cue('align-late').start, 0.35) }));
  });
}
