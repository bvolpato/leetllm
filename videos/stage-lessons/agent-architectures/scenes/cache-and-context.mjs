// Scene 10: cache-and-context - Where do the repeated tokens go?
// Interactive 10-column window morphing from 2-block bounded window (45,500 tokens)
// back to full prefix-cached staircase (72,000 cached-read blue + 15,500 cache-write gold),
// tracing Call 1's gold write becoming Call 2's blue cached read!
import { group, rect } from 'vizmatic/stage';
import {
  BOUNDED_LEDGER,
  COSMOS,
  FULL_LEDGER,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function cacheAndContext(s, c) {
  const pulse = s.value(0);
  const boundOn = s.value(0);
  const restoreFull = s.value(0); // 0 = bounded 2-block cap, 1 = full prefix-cached staircase
  const cachedHi = s.value(0);
  const writtenHi = s.value(0);
  const baseWriteHi = s.value(0);
  const baseReadHi = s.value(0);

  const header = cinemaHeader(
    'BOUNDED WINDOW VS PREFIX CACHE',
    'Where do the repeated',
    'tokens go?',
    {
      accent: ROLE.focus,
      size: 48,
    },
  );

  const stageAura = aura(220, 40, 640, '#ffd1661c', '#60a5fa1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const bd = boundOn.value;
      const rf = restoreFull.value;
      const ch = cachedHi.value;
      const wh = writtenHi.value;
      const bw = baseWriteHi.value;
      const br = baseReadHi.value;
      const nodes = [];

      const colW = 88;
      const gap = 36;
      const xStart = -560;
      const baseY = 270;
      const baseH = 52;
      const blkH = 34;
      const blkGap = 4;

      for (let k = 0; k < 10; k++) {
        const cx = xStart + k * (colW + gap);
        const isFirst = k === 0;
        // Base block: gold (write once) on Call 1 when restored, blue (cached read) on Calls 2..10
        const baseCol = rf > 0.45 ? (isFirst ? ROLE.focus : ROLE.host) : ROLE.host;
        const baseNode = rect(colW, baseH, {
          fill: baseCol,
          stroke: '#ffffff',
          width: 1.4,
          radius: 6,
        })
          .at(cx, baseY - baseH * 0.5)
          .opacity(0.9);
        if ((isFirst && bw > 0.35) || (k === 1 && br > 0.35)) baseNode.glow(10, baseCol);
        nodes.push(baseNode, txt(`C${k + 1}`, cx, baseY + 34, 26, COSMOS.muted, 'mono', 'center'));

        const maxBlocks = rf > 0.45 ? k : Math.min(k, 2);
        for (let b = 0; b < maxBlocks; b++) {
          const isTopNew = b === k - 1;
          const col = rf > 0.45 ? (isTopNew ? ROLE.focus : ROLE.host) : ROLE.action;
          const cy = baseY - baseH - 6 - b * (blkH + blkGap) - blkH * 0.5;
          const blk = rect(colW, blkH, { fill: col, stroke: '#ffffff', width: 1.0, radius: 5 })
            .at(cx, cy)
            .opacity(rf > 0.45 ? (isTopNew ? 0.94 : 0.78) : 0.84);
          if ((isTopNew && wh > 0.35) || (!isTopNew && ch > 0.35)) blk.glow(7, col);
          nodes.push(blk);
        }
      }

      // Left diagnostic metrics
      if (rf < 0.45) {
        nodes.push(
          txt('2-BLOCK SLIDING WINDOW', -840, -180, 26, ROLE.action, 'mono', 'left'),
          txt(
            `TOTAL: ${BOUNDED_LEDGER.total.toLocaleString()} TOKENS`,
            -840,
            -120,
            34,
            ROLE.ok,
            'mono',
            'left',
          )
            .glow(7, ROLE.ok)
            .opacity(0.45 + bd * 0.55),
          txt(
            'Verify older observations are not still needed',
            -840,
            -56,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else {
        nodes.push(
          txt('FULL PREFIX CACHE (10 CALLS)', -840, -180, 26, ROLE.focus, 'mono', 'left'),
          txt(
            `CACHED READS (BLUE):  ${FULL_LEDGER.read.toLocaleString()}`,
            -840,
            -120,
            30,
            ROLE.host,
            'mono',
            'left',
          ).glow(ch > 0.3 ? 7 : 0, ROLE.host),
          txt(
            `NEW WRITES (GOLD):    ${FULL_LEDGER.written.toLocaleString()}`,
            -840,
            -64,
            30,
            ROLE.focus,
            'mono',
            'left',
          ).glow(wh > 0.3 ? 7 : 0, ROLE.focus),
        );
        if (bw > 0.05 || br > 0.05) {
          nodes.push(
            txt(
              br > 0.4
                ? 'Call 1 gold write -> Call 2+ blue cached read'
                : 'Call 1 writes base once in gold',
              -840,
              6,
              26,
              br > 0.4 ? ROLE.host : ROLE.focus,
              'mono',
              'left',
            ).opacity(Math.max(bw, br)),
          );
        }
      }

      nodes.push(
        txt(
          'Invoice = read rates + write rates + output + tools + retries',
          0,
          365,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-cache-and-context-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-cache-and-context-0').start, 0.25) }));
  });
  c.on('context-bounded', () => {
    s.play(boundOn.to(1, { duration: clampDur(c, c.cue('context-bounded').start, 0.35) }));
  });
  c.on('context-restore', () => {
    s.play(restoreFull.to(1, { duration: clampDur(c, c.cue('context-restore').start, 0.4) }));
  });
  c.on('context-cached', () => {
    s.play(cachedHi.to(1, { duration: clampDur(c, c.cue('context-cached').start, 0.35) }));
  });
  c.on('context-written', () => {
    s.play(writtenHi.to(1, { duration: clampDur(c, c.cue('context-written').start, 0.35) }));
  });
  c.on('aa-cache-and-context-1', () => {
    s.play(
      baseWriteHi.to(0.4, { duration: clampDur(c, c.cue('aa-cache-and-context-1').start, 0.25) }),
    );
  });
  c.on('context-base', () => {
    s.play(baseWriteHi.to(1, { duration: clampDur(c, c.cue('context-base').start, 0.35) }));
  });
  c.on('context-base-read', () => {
    s.play(baseReadHi.to(1, { duration: clampDur(c, c.cue('context-base-read').start, 0.35) }));
  });
}
