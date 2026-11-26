// Scene 4: prefix-reuse - The same prompt at two input prices
// Full 1,800-token beam splits at 1,280 into gold cached read ($0.25/M) + cyan 520 suffix ($2.50/M).
// Below, Cold ($0.00720) vs Warm ($0.00432) waterfalls lock their rose output segment to identical endpoints.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  coldMicro,
  dashedRule,
  driftValue,
  guardedDynamic,
  prefixMicro,
  standard,
  txt,
  usd,
} from '../parts.mjs';

export default function prefixReuse(s, c) {
  const pulseT = s.value(0);
  const readProg = s.value(0); // 0 -> 1 on `read-prefix`
  const suffixProg = s.value(0); // 0 -> 1 on `price-suffix`
  const outputProg = s.value(0); // 0 -> 1 on `keep-output`

  const readMicro = 1280 * standard.cached; // 320 -> $0.00032
  const ordMicro = 520 * standard.input; // 1300 -> $0.00130
  const outMicro = 180 * standard.output; // 2700 -> $0.00270
  const coldInMicro = 1800 * standard.input; // 4500 -> $0.00450

  const header = cinemaHeader('PROMPT PREFIX CACHING', 'Same 1,800 tokens,', 'two input prices', {
    x: -860,
    y: -415,
    accent: ROLE.cached,
    size: 52,
  });

  const sceneAura = aura(0, 60, 740, '#ffd16622', '#ff6b8b18');

  const stageCanvas = guardedDynamic(
    () => 1,
    () => {
      const rp = readProg.value;
      const sp = suffixProg.value;
      const op = outputProg.value;
      const nodes = [];

      // Upper glowing 1,800-token strip spanning x = -840..840 (width = 1680)
      const stripX = -840;
      const stripW = 1680;
      const stripY = -175;
      const prefixW = stripW * (1280 / 1800); // 1194.7
      const suffixW = stripW - prefixW; // 485.3

      // Base ordinary cyan strip
      nodes.push(
        rect(stripW, 74, { fill: '#112a3a', stroke: ROLE.input, width: 2.2, radius: 10 }).at(
          stripX + stripW * 0.5,
          stripY,
        ),
      );
      // Animated gold cache-read overlay over first 1,280 tokens
      if (rp > 0.01) {
        const w = prefixW * rp;
        nodes.push(
          rect(w, 70, { fill: '#3b2e10', stroke: ROLE.cached, width: 2.6, radius: 8 })
            .at(stripX + w * 0.5, stripY)
            .glow(10, ROLE.cached),
        );
      }

      // Labels cleanly above the strip so the gold overlay never crosses text
      nodes.push(
        txt(
          'POLICY PREFIX  ·  1,280 TOKENS',
          stripX + prefixW * 0.5,
          stripY - 62,
          28,
          rp > 0.4 ? ROLE.cached : COSMOS.ink,
          'mono',
        ),
        txt('ORDER  ·  520', stripX + prefixW + suffixW * 0.5, stripY - 62, 28, ROLE.input, 'mono'),
      );

      // Split charge readouts directly beneath the prompt strip
      if (rp > 0.4) {
        nodes.push(
          txt(
            `Cache read: 1,280 x $0.25/M = ${usd(readMicro, 5)}`,
            stripX,
            -92,
            28,
            ROLE.cached,
            'mono',
            'left',
          )
            .glow(6, ROLE.cached)
            .opacity(rp),
        );
      }
      if (sp > 0.2) {
        nodes.push(
          txt(
            `Ordinary suffix: 520 x $2.50/M = ${usd(ordMicro, 5)}`,
            stripX + stripW,
            -92,
            28,
            ROLE.input,
            'mono',
            'right',
          )
            .glow(6, ROLE.input)
            .opacity(sp),
        );
      }

      // Lower unified dollar scale comparing Cold vs Warm (output endpoints LOCKED vertically!)
      // Scale: total cold width = 1080px => 0.15 px per microdollar
      const scale = 1080 / coldMicro;
      const barStart = -440;
      const splitX = barStart + coldInMicro * scale; // exact x where output starts on BOTH rows
      const outW = outMicro * scale;

      // Dashed vertical anchor lines framing the invariant output column
      nodes.push(
        dashedRule(splitX, 15, splitX, 345, ROLE.output, { width: 2.2, opacity: 0.72 }),
        dashedRule(splitX + outW, 15, splitX + outW, 345, ROLE.output, {
          width: 2.2,
          opacity: 0.72,
        }),
      );

      // Row 1: Cold call (y = 85)
      const yCold = 85;
      const coldInW = coldInMicro * scale;
      nodes.push(
        txt('COLD CALL', -840, yCold, 30, COSMOS.ink, 'mono', 'left'),
        rect(coldInW - 4, 56, { fill: '#102b3d', stroke: ROLE.input, width: 2.2, radius: 8 })
          .at(splitX - coldInW * 0.5, yCold)
          .glow(6, ROLE.input),
        rect(outW, 56, { fill: '#351324', stroke: ROLE.output, width: 2.4, radius: 8 })
          .at(splitX + outW * 0.5, yCold)
          .glow(7, ROLE.output),
        txt(usd(coldMicro, 5), 840, yCold, 36, COSMOS.ink, 'mono', 'right'),
      );

      // Row 2: Warm call with prefix read (y = 225)
      const yWarm = 225;
      const warmOrdW = ordMicro * scale;
      const warmReadW = readMicro * scale;
      const warmVis = Math.max(sp, op);
      if (warmVis > 0.05) {
        nodes.push(
          txt('PREFIX READ', -840, yWarm, 30, ROLE.cached, 'mono', 'left').opacity(warmVis),
          rect(warmReadW - 2, 56, { fill: '#3c2f10', stroke: ROLE.cached, width: 2.4, radius: 6 })
            .at(splitX - warmOrdW - warmReadW * 0.5, yWarm)
            .glow(8, ROLE.cached)
            .opacity(warmVis),
          rect(warmOrdW - 4, 56, { fill: '#102b3d', stroke: ROLE.input, width: 2.2, radius: 8 })
            .at(splitX - warmOrdW * 0.5, yWarm)
            .glow(6, ROLE.input)
            .opacity(warmVis),
          rect(outW, 56, { fill: '#351324', stroke: ROLE.output, width: 2.6, radius: 8 })
            .at(splitX + outW * 0.5, yWarm)
            .glow(op > 0.3 ? 12 : 7, ROLE.output)
            .opacity(warmVis),
          txt(usd(prefixMicro, 5), 840, yWarm, 36, ROLE.ok, 'mono', 'right')
            .glow(8, ROLE.ok)
            .opacity(warmVis),
        );
      }

      // Bottom takeaway
      nodes.push(
        txt(
          op > 0.3
            ? `Same 180 output tokens (${usd(outMicro, 5)})  ·  Saving ${usd(coldMicro - prefixMicro, 5)} on input alone`
            : 'Repricing 1,280 prefix tokens shifts only the input segment',
          0,
          405,
          30,
          op > 0.3 ? ROLE.output : COSMOS.muted,
          'sans',
        ).glow(op > 0.3 ? 5 : 0, ROLE.output),
      );

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, stageCanvas);
  driftValue(s, c, pulseT, 3.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('read-prefix', () => {
    const t = c.cue('read-prefix').start;
    s.play(readProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('price-suffix', () => {
    const t = c.cue('price-suffix').start;
    s.play(suffixProg.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('keep-output', () => {
    const t = c.cue('keep-output').start;
    s.play(outputProg.to(1, { duration: clampDur(c, t, 0.45) }));
  });
}
