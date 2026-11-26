// Scene 19: latency - Measure the first checked claim separately from the first token
// Five-lane tail-latency waterfall (0..1000 ms) sweeping to Draft TTFT (800 ms) then
// First Checked Claim (980 ms), emphasizing per-request end-to-end distributions.
import { group, line, rect } from 'vizmatic/stage';
import {
  CLOCK_OVERLAP,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function latency(s, c) {
  const pulse = s.value(0);
  const depOn = s.value(0);
  const clockMs = s.value(0);
  const distOn = s.value(0);

  const header = cinemaHeader(
    'TAIL-LATENCY WATERFALL',
    'First checked claim',
    'trails first draft token',
    {
      accent: ROLE.clock,
      size: 46,
    },
  );

  const stageAura = aura(100, 40, 700, '#5ce1e61a', '#ffd16618');

  const lanes = [
    { label: 'Plan', y: -175, bars: [{ s: 0, e: 40, tag: '40', col: ROLE.policy }] },
    { label: 'Retrieve', y: -85, bars: [{ s: 0, e: 260, tag: 'raw query 260', col: ROLE.query }] },
    {
      label: 'Rerank / Pack',
      y: 5,
      bars: [
        { s: 260, e: 350, tag: '90', col: ROLE.rewrite },
        { s: 350, e: 370, tag: '', col: ROLE.focus },
      ],
    },
    {
      label: 'Draft / Claim',
      y: 95,
      bars: [
        { s: 370, e: 800, tag: 'first draft 430', col: ROLE.query },
        { s: 800, e: 900, tag: '100', col: ROLE.policy },
      ],
    },
    { label: 'Verify', y: 185, bars: [{ s: 900, e: 980, tag: '80', col: ROLE.ok }] },
  ];

  const view = guardedDynamic(
    () => 1,
    () => {
      const t = clockMs.value;
      const dist = distOn.value > 0.5;
      const x0 = -540;
      const x1 = 820;
      const mapMs = (ms) => x0 + (ms / 1000) * (x1 - x0);
      const nodes = [];

      // Horizontal ruler & clean bottom ticks (never cross lane text!)
      nodes.push(line([x0, 230], [x1, 230], { stroke: '#334873', width: 2.5 }));
      for (const tick of [0, 200, 400, 600, 800, 1000]) {
        const tx = mapMs(tick);
        nodes.push(
          line([tx, 230], [tx, 246], { stroke: '#4d6599', width: 2.5 }),
          txt(`${tick} ms`, tx, 274, 26, COSMOS.muted, 'mono', 'center'),
        );
      }

      // Lanes, planned stage footprints (always visible -> zero empty space), and animated fill bars
      lanes.forEach((lane) => {
        nodes.push(
          txt(lane.label, -855, lane.y, 28, COSMOS.ink, 'mono', 'left'),
          rect(x1 - x0, 56, { fill: '#0d1527', stroke: '#334873', width: 1.8, radius: 8 }).at(
            (x0 + x1) * 0.5,
            lane.y,
          ),
        );
        lane.bars.forEach((bar) => {
          const fx0 = mapMs(bar.s);
          const fw = Math.max(12, mapMs(bar.e) - fx0);
          // Planned stage outline footprint
          nodes.push(
            rect(fw, 48, {
              fill: '#121d36',
              stroke: bar.col,
              width: 1.8,
              dash: [6, 5],
              radius: 7,
            })
              .at(fx0 + fw * 0.5, lane.y)
              .opacity(0.68),
          );
          const reached = Math.min(bar.e, t);
          if (reached > bar.s + 1) {
            const bw = Math.max(8, mapMs(reached) - fx0);
            nodes.push(
              rect(bw, 48, { fill: bar.col, stroke: null, radius: 7 })
                .at(fx0 + bw * 0.5, lane.y)
                .glow(7, bar.col)
                .opacity(0.92),
            );
            if (bar.tag && fw > 90 && reached >= bar.e - 2) {
              nodes.push(txt(bar.tag, fx0 + fw * 0.5, lane.y, 26, '#070910', 'mono', 'center'));
            }
          }
        });
      });

      // Playhead marker positioned cleanly above & below lanes (never crosses bar text!)
      const px = mapMs(t);
      nodes.push(
        line([px, -250], [px, -218], { stroke: ROLE.focus, width: 4 }).glow(9, ROLE.focus),
        glowDot(px, -250, { radius: 6, color: ROLE.focus, glow: 10 }),
        line([px, 224], [px, 244], { stroke: ROLE.focus, width: 4 }).glow(9, ROLE.focus),
      );

      // Endpoint readouts
      const draftReady = t >= CLOCK_OVERLAP.draft - 1;
      const checkReady = t >= CLOCK_OVERLAP.checked - 1;
      nodes.push(
        txt(
          `DRAFT TTFT: ${draftReady ? `${CLOCK_OVERLAP.draft} ms` : 'pending'}`,
          -855,
          336,
          32,
          draftReady ? ROLE.query : COSMOS.dim,
          'mono',
          'left',
        ).glow(draftReady ? 6 : 0, ROLE.query),
        txt(
          `FIRST CHECKED CLAIM: ${checkReady ? `${CLOCK_OVERLAP.checked} ms` : 'pending'}`,
          100,
          336,
          32,
          checkReady ? ROLE.ok : COSMOS.dim,
          'mono',
          'left',
        ).glow(checkReady ? 7 : 0, ROLE.ok),
        txt(
          dist
            ? 'Measure per-request end-to-end distributions; summing stage p95s is NOT end-to-end p95.'
            : 'Plan (40 ms) overlaps raw retrieval (260 ms) when retrieval does not need the rewrite.',
          -855,
          404,
          28,
          dist ? ROLE.focus : COSMOS.muted,
          'sans',
          'left',
        ).opacity(0.65 + 0.35 * depOn.value),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('latency-beat-1-focus-2', () => {
    s.play(depOn.to(1, { duration: clampDur(c, c.cue('latency-beat-1-focus-2').start, 0.3) }));
  });
  c.on('latency-beat-1-focus-1', () => {
    s.play(clockMs.to(800, { duration: clampDur(c, c.cue('latency-beat-1-focus-1').start, 1.4) }));
  });
  c.on('latency-beat-2-focus-1', () => {
    s.play(clockMs.to(980, { duration: clampDur(c, c.cue('latency-beat-2-focus-1').start, 0.9) }));
  });
  c.on('latency-beat-2-focus-2', () => {
    s.play(distOn.to(1, { duration: clampDur(c, c.cue('latency-beat-2-focus-2').start, 0.35) }));
  });
}
