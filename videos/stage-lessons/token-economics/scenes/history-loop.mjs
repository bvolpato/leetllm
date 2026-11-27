// Scene 13: history-loop - What did all five turns cost?
// Growing 5-turn agent history staircase (2,000 -> 6,000 input + 200 output per turn).
// Beat 1 spotlights Turn 5 (1.8c) and withholds whole-task total (`?`).
// Beat 2 `te-history-loop-1` & `five-turn-total` sum all 5 receipts to 6.5c (5c input + 1.5c output).
// Beat 3 `te-history-loop-2` sweeps gold cache-read across 14,000 repeated tokens -> 3.35c total.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cents,
  cinemaHeader,
  clampDur,
  fmtInt,
  guardedDynamic,
  historyUsage,
  priceMicroDollars,
  txt,
} from '../parts.mjs';

export default function historyLoop(s, c) {
  const pulseT = s.value(0);
  const rowsProg = s.value(0.2); // grows 1 -> 5 turns on `te-history-loop-0`
  const receiptsVis = s.value(0); // beat 1 shows individual receipts (withholding sum)
  const sumProg = s.value(0); // `te-history-loop-1` highlights 5 receipts
  const sumRevealed = s.value(0); // `five-turn-total` reveals 6.5c
  const reuseProg = s.value(0); // `te-history-loop-2` sweeps gold prefix reads -> 3.35c

  const coldModel = historyUsage(false);
  const warmModel = historyUsage(true);

  const header = cinemaHeader('5-TURN AGENT LOOP', 'Every turn resends', 'the growing history', {
    x: -860,
    y: -415,
    accent: ROLE.input,
    size: 52,
  });

  const sceneAura = aura(160, 40, 700, '#5ce1e622', '#ffd1661c');

  const stageCanvas = guardedDynamic(
    () => 1,
    () => {
      const rp = rowsProg.value;
      const rv = receiptsVis.value;
      const sp = sumProg.value;
      const sr = sumRevealed.value;
      const ru = reuseProg.value;

      const visibleRows = Math.max(1, Math.min(5, Math.round(rp * 5)));
      const barX = -650;
      const maxBarW = 860;
      const maxIn = 6000;

      const nodes = [
        txt('INPUT SENT THIS TURN', barX, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt('OUTPUT', 465, -210, 26, ROLE.output, 'mono'),
        txt(rv > 0.2 ? 'RECEIPT' : '', 835, -210, 26, ROLE.cached, 'mono', 'right'),
      ];

      let runningMicro = 0;

      for (let i = 0; i < visibleRows; i++) {
        const y = -132 + i * 94;
        const inp = coldModel.inputs[i];
        const rowReuse = Math.max(0, Math.min(1, ru * 4 - (i - 1) * 0.7));
        const readTok = Math.round(warmModel.reads[i] * rowReuse);
        const turnCost = priceMicroDollars(inp, readTok, 200);
        runningMicro += turnCost;

        const totalW = (inp / maxIn) * maxBarW;
        const readW = (readTok / maxIn) * maxBarW;
        const ordW = totalW - readW;

        nodes.push(txt(`Turn ${i + 1}`, -850, y, 28, COSMOS.ink, 'mono', 'left'));

        // Reused cache-read portion (gold)
        if (readW > 4) {
          nodes.push(
            rect(readW - 3, 52, { fill: '#3c2e10', stroke: ROLE.cached, width: 2.4, radius: 7 })
              .at(barX + readW * 0.5, y)
              .glow(8, ROLE.cached),
          );
        }
        // Ordinary fresh input portion (cyan)
        if (ordW > 4) {
          nodes.push(
            rect(ordW - 3, 52, { fill: '#0e2b3d', stroke: ROLE.input, width: 2.2, radius: 7 })
              .at(barX + readW + ordW * 0.5, y)
              .glow(6, ROLE.input),
          );
        }

        // Token count label right of bar
        nodes.push(
          txt(fmtInt(inp), barX + totalW + 22, y, 28, COSMOS.ink, 'mono', 'left'),
          txt('+200', 465, y, 28, ROLE.output, 'mono'),
        );

        // Receipt cost column (shown from beat 1 onward)
        if (rv > 0.2) {
          const isTurn5 = i === 4;
          const isSumLit = sp > 0.1 && i < Math.ceil(sp * 5);
          const col =
            ru > 0.1 ? ROLE.ok : isSumLit || (sr < 0.2 && isTurn5) ? ROLE.cached : COSMOS.ink;
          nodes.push(
            txt(cents(turnCost), 835, y, 32, col, 'mono', 'right')
              .glow(isTurn5 || isSumLit ? 7 : 0, col)
              .opacity(rv),
          );
        }
      }

      // Bottom summary / prediction prompt
      if (ru > 0.05) {
        nodes.push(
          txt(
            `14,000 cache reads  ·  6,000 ordinary  ·  1,000 output`,
            -850,
            365,
            28,
            ROLE.cached,
            'mono',
            'left',
          ).opacity(ru),
          txt(`TOTAL: ${cents(runningMicro)}`, 835, 365, 42, ROLE.ok, 'mono', 'right')
            .glow(9, ROLE.ok)
            .opacity(ru),
          txt(
            'Early edits, expiry, or different routing can remove assumed prefix reads',
            -850,
            422,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(ru),
        );
      } else if (sr > 0.2) {
        nodes.push(
          txt('FIVE RECEIPTS TOTAL: 6.5¢', -850, 365, 40, ROLE.cached, 'mono', 'left')
            .glow(9, ROLE.cached)
            .opacity(sr),
          txt(
            '5.0¢ input  +  1.5¢ output  (tool fees separate)',
            835,
            365,
            28,
            COSMOS.ink,
            'mono',
            'right',
          ).opacity(sr),
        );
      } else if (rv > 0.2) {
        // Beat 1 prediction hold: highlight Turn 5 (1.8¢), hide whole-task sum
        nodes.push(
          txt(
            'Last receipt: 1.8¢   ·   Whole 5-turn task: ?',
            -850,
            375,
            38,
            ROLE.cached,
            'serif',
            'left',
          )
            .glow(7, ROLE.cached)
            .opacity(rv),
        );
      } else {
        nodes.push(
          txt(
            visibleRows === 5
              ? '20,000 input positions  +  1,000 output tokens across 5 turns'
              : 'Each turn adds +200 output and +800 tool tokens to the prompt',
            -850,
            375,
            30,
            ROLE.input,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, stageCanvas);

  c.on('te-history-loop-0', () => {
    const t = c.cue('te-history-loop-0').start;
    s.play(rowsProg.to(1, { duration: clampDur(c, t, 1.0) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(receiptsVis.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-history-loop-1', () => {
    const t = c.cue('te-history-loop-1').start;
    s.play(sumProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('five-turn-total', () => {
    const t = c.cue('five-turn-total').start;
    s.play(sumRevealed.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('te-history-loop-2', () => {
    const t = c.cue('te-history-loop-2').start;
    s.play(reuseProg.to(1, { duration: clampDur(c, t, 0.85) }));
  });
}
