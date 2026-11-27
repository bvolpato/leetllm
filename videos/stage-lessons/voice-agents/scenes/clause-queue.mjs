// Scene 12: clause-queue - When can these words go to the synthesizer?
// Punctuation flush (comma after "open"), 52-char space-lookback split, and bounded TTS audio
// queue (8 synthesized vs 2 played -> backpressure pause so barge-in stays crisp!).
import { group, line, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function clauseQueue(s, c) {
  const commaFlush = s.value(0);
  const spaceSplit = s.value(0);
  const queueFill = s.value(0);
  const queuePause = s.value(0);

  const header = cinemaHeader(
    'CLAUSE CHUNKING & BACKPRESSURE',
    'When can words go',
    'to the synthesizer?',
    {
      x: -860,
      y: -445,
      accent: ROLE.audio,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const cf = commaFlush.value;
      const sp = spaceSplit.value;
      const qf = queueFill.value;
      const qp = queuePause.value;
      const nodes = [];

      // Top lane: Clause Flush Rules (Comma vs 52-char Space Lookback)
      const topY = -135;
      if (sp < 0.5) {
        nodes.push(
          txt(
            'RULE 1: FLUSH ON PUNCTUATION (, . ? !)',
            -840,
            topY - 58,
            26,
            ROLE.audio,
            'mono',
            'left',
          ),
          txt(
            '"Incident 4219 is open,"',
            -840,
            topY + 2,
            30,
            cf > 0.4 ? ROLE.ok : COSMOS.ink,
            'mono',
            'left',
          ).glow(cf > 0.4 ? 7 : 0, ROLE.ok),
          txt(
            cf > 0.4 ? '-> SENT TO TTS IMMEDIATELY' : '-> waiting for comma...',
            -280,
            topY + 2,
            26,
            cf > 0.4 ? ROLE.ok : COSMOS.muted,
            'mono',
            'left',
          ),
          txt(
            'LLM keeps writing: "severity one, database failover..."',
            -840,
            topY + 62,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );
      } else {
        nodes.push(
          txt(
            'RULE 2: NO PUNCTUATION -> 52-CHAR SPACE LOOKBACK',
            -840,
            topY - 58,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
          txt(
            'FLUSH THROUGH "is"  (<= 52 chars)',
            -840,
            topY + 2,
            28,
            ROLE.ok,
            'mono',
            'left',
          ).glow(7, ROLE.ok),
          txt(
            'HOLD "investigating" UNTIL TEXT ENDS',
            -840,
            topY + 62,
            26,
            ROLE.warn,
            'mono',
            'left',
          ),
        );
      }

      // Bottom lane: Bounded Audio Playout Queue (8 synthesized slots vs 2 played!)
      const qY = 120;
      const slotCount = 8;
      const sw = 152;
      const gap = 22;
      const qx0 = -((slotCount * sw + (slotCount - 1) * gap) * 0.5);

      nodes.push(
        txt(
          qp > 0.4
            ? 'AUDIO QUEUE AT LIMIT: PAUSE TTS PRODUCTION!'
            : 'AUDIO QUEUE: 8 SYNTHESIZED  ·  ONLY 2 PLAYED',
          0,
          qY - 76,
          28,
          qp > 0.4 ? ROLE.cut : ROLE.focus,
          'mono',
          'center',
        ).glow(qp > 0.4 ? 8 : 0, ROLE.cut),
      );

      for (let i = 0; i < slotCount; i++) {
        const cx = qx0 + i * (sw + gap) + sw * 0.5;
        const played = i < 2;
        const queued = i >= 2 && (qf > 0.3 || i < 4);
        const col = played ? ROLE.ok : queued ? (qp > 0.4 ? ROLE.cut : ROLE.warn) : '#25355a';
        nodes.push(
          rect(sw, 62, { fill: '#0b1428', stroke: col, width: 3, radius: 8 })
            .at(cx, qY)
            .glow(played || (queued && qp > 0.4) ? 7 : 0, col),
          txt(
            played ? `P${i + 1} OK` : queued ? `Q${i + 1}` : `slot ${i + 1}`,
            cx,
            qY,
            26,
            col,
            'mono',
            'center',
          ),
        );
      }

      // Top-right tradeoff rule
      nodes.push(
        txt('CHUNKING TRADEOFF', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Per token -> voice stutters', 480, -378, 26, ROLE.warn, 'mono', 'center'),
        txt('Full paragraph -> slow first sound', 480, -334, 26, ROLE.fail, 'mono', 'center'),
      );

      nodes.push(
        txt(
          qp > 0.4
            ? 'Bounded backlog keeps barge-in crisp and avoids wasted TTS synthesis'
            : 'Watch decimals & abbreviations when tuning lookback splits for a voice',
          0,
          310,
          26,
          qp > 0.4 ? ROLE.cut : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('clause-flush', () => {
    s.play(commaFlush.to(1, { duration: clampDur(c, c.cue('clause-flush').start, 0.35) }));
  });
  c.on('clause-long', () => {
    s.play(spaceSplit.to(1, { duration: clampDur(c, c.cue('clause-long').start, 0.4) }));
  });
  c.on('queue-fill', () => {
    s.play(queueFill.to(1, { duration: clampDur(c, c.cue('queue-fill').start, 0.4) }));
  });
  c.on('queue-bound', () => {
    s.play(queuePause.to(1, { duration: clampDur(c, c.cue('queue-bound').start, 0.4) }));
  });
}
