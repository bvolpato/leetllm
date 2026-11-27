// Scene 29: fresh-interruption - What can the next reply assume?
// Finale counterfactual: Reply 7 ("Lookup is ready." 300ms | "Owner has replied." 700ms),
// Alex cuts in at 560ms with receipt at 460ms -> STRICT prediction pause 1 (keeps "Lookup is ready."),
// late 700ms receipt for Reply 7 rejected while Reply 8 is active -> STRICT prediction pause 2 ->
// Tool record lets hotline answer "Yes, the owner replied."!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  WORKSHEET,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function freshInterruption(s, c) {
  const cutOn = s.value(0);
  const keep1Reveal = s.value(0); // STRICT after va-fresh-interruption-1-0!
  const reply8On = s.value(0);
  const lateRejectOn = s.value(0);
  const ask2On = s.value(0);
  const finalAnsReveal = s.value(0); // STRICT after fresh-answer!

  const chunks2 = WORKSHEET.freshChunks; // 300ms "Lookup is ready." | 700ms " Owner has replied."

  const header = cinemaHeader('FRESH INTERRUPTION TRANSFER', 'What can the next', 'reply assume?', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const ct = cutOn.value;
      const k1 = keep1Reveal.value;
      const r8 = reply8On.value;
      const lr = lateRejectOn.value;
      const a2 = ask2On.value;
      const fa = finalAnsReveal.value;
      const nodes = [];

      // Reply 7 two-sentence strip (0 .. 700 ms across x = [-780 .. +260])
      const x0 = -780;
      const x1 = 260;
      const mapMs = (ms) => x0 + (ms / 700) * (x1 - x0);
      const yStrip = -115;

      const x300 = mapMs(chunks2[0].endMs); // 300
      const x460 = mapMs(460);
      const x560 = mapMs(560);

      nodes.push(
        txt('REPLY #7 AUDIO STRIP (0 .. 700 ms)', x0, yStrip - 72, 26, ROLE.audio, 'mono', 'left'),
        rect(x300 - x0 - 6, 56, {
          fill: '#0b1428',
          stroke: k1 > 0.4 ? ROLE.ok : ROLE.audio,
          width: k1 > 0.4 ? 3.5 : 2.5,
          radius: 8,
        })
          .at((x0 + x300) * 0.5 - 3, yStrip)
          .glow(k1 > 0.4 ? 9 : 0, ROLE.ok),
        txt(
          '"Lookup is ready." (300 ms)',
          (x0 + x300) * 0.5,
          yStrip,
          26,
          k1 > 0.4 ? ROLE.ok : ROLE.audio,
          'mono',
          'center',
        ),
        rect(x1 - x300 - 6, 56, {
          fill: '#0b1428',
          stroke: k1 > 0.4 ? COSMOS.dim : ROLE.audio,
          width: 2.5,
          radius: 8,
        })
          .at((x300 + x1) * 0.5 + 3, yStrip)
          .opacity(k1 > 0.4 ? 0.45 : 0.95),
        txt(
          '"Owner has replied." (700 ms)',
          (x300 + x1) * 0.5,
          yStrip,
          26,
          k1 > 0.4 ? COSMOS.dim : ROLE.audio,
          'mono',
          'center',
        ).opacity(k1 > 0.4 ? 0.55 : 1),
      );

      // Receipt 460 ms & Cut-in 560 ms markers (start cleanly below strip text box!)
      if (ct > 0.1) {
        nodes.push(
          line([x460, yStrip + 34], [x460, yStrip + 72], { stroke: ROLE.ok, width: 4 })
            .glow(8, ROLE.ok)
            .opacity(ct),
          txt('ACK 460', x460 - 14, yStrip + 96, 26, ROLE.ok, 'mono', 'right').opacity(ct),
          line([x560, yStrip + 34], [x560, yStrip + 72], {
            stroke: ROLE.cut,
            width: 4,
            dash: [8, 6],
          })
            .glow(8, ROLE.cut)
            .opacity(ct),
          txt('CUT 560', x560 + 14, yStrip + 96, 26, ROLE.cut, 'mono', 'left').opacity(ct),
        );
      }

      // Right column: Durable Tool Record (never erased by interruption!)
      const rx = 585;
      nodes.push(
        line([335, -195], [335, 195], { stroke: '#2c3d66', width: 2.5 }),
        txt('TOOL RECORD (DURABLE)', rx, -160, 26, ROLE.tool, 'mono', 'center'),
        txt('owner_replied = TRUE', rx, -100, 28, ROLE.ok, 'mono', 'center').glow(7, ROLE.ok),
        txt('survives cut-in & reply #8!', rx, -46, 26, COSMOS.muted, 'mono', 'center'),
      );

      // Reply #8 & Late Receipt Rejection box on lower-right
      if (r8 > 0.35) {
        nodes.push(
          txt('ACTIVE: REPLY #8 (cursor 0)', rx, 45, 26, ROLE.audio, 'mono', 'center'),
          txt(
            lr > 0.4 ? 'LATE 700ms FOR #7 -> REJECTED!' : 'Late 700 ms receipt arrives...',
            rx,
            102,
            26,
            lr > 0.4 ? ROLE.cut : ROLE.warn,
            'mono',
            'center',
          ).glow(lr > 0.4 ? 8 : 0, ROLE.cut),
        );
      }

      // Lower-left: Frozen Conversation History
      const hy = 95;
      nodes.push(
        txt('CONVERSATION HISTORY:', x0, hy, 26, ROLE.focus, 'mono', 'left'),
        txt(
          k1 > 0.4 ? `KEPT: "${WORKSHEET.retained}"  (300 <= 460 ms)` : 'KEPT: [ ? ]',
          x0,
          hy + 50,
          28,
          k1 > 0.4 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        ),
      );

      // Top-right rule
      nodes.push(
        txt('TWO SURVIVING RECORDS', 500, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Frozen Heard History  +  Tool Record', 500, -378, 26, COSMOS.ink, 'mono', 'center'),
      );

      // Bottom prediction pauses & final answer!
      const botY = 305;
      if (fa > 0.35) {
        nodes.push(
          txt(
            'ANSWER: "Yes, the owner replied."  (GROUNDED IN TOOL RECORD!)',
            0,
            botY,
            30,
            ROLE.ok,
            'mono',
            'center',
          ).glow(9, ROLE.ok),
          txt(
            'Give Alex the news without assuming the interrupted sentence ever finished playing',
            0,
            botY + 54,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (a2 > 0.35) {
        nodes.push(
          txt(
            'Alex asks: "Did the owner reply?" What should the hotline tell Alex now?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (k1 < 0.35 && ct > 0.35) {
        nodes.push(
          txt(
            'Receipt = 460 ms, cut-in = 560 ms. Which sentence enters conversation history?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Freeze Reply #7 on interruption; reject stale receipts when Reply #8 opens',
            0,
            botY,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('fresh-cut', () => {
    s.play(cutOn.to(1, { duration: clampDur(c, c.cue('fresh-cut').start, 0.35) }));
  });
  c.after('va-fresh-interruption-1-0', () => {
    s.play(
      keep1Reveal.to(1, { duration: clampDur(c, c.cue('va-fresh-interruption-1-0').end, 0.4) }),
    );
  });
  c.on('fresh-switch', () => {
    s.play(reply8On.to(1, { duration: clampDur(c, c.cue('fresh-switch').start, 0.35) }));
  });
  c.after('va-fresh-interruption-2-1', () => {
    s.play(
      lateRejectOn.to(1, { duration: clampDur(c, c.cue('va-fresh-interruption-2-1').end, 0.35) }),
    );
  });
  c.on('fresh-decision', () => {
    s.play(ask2On.to(1, { duration: clampDur(c, c.cue('fresh-decision').start, 0.35) }));
  });
  c.after('fresh-answer', () => {
    s.play(finalAnsReveal.to(1, { duration: clampDur(c, c.cue('fresh-answer').end, 0.4) }));
  });
}
