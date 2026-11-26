// Scene 23: serving-pressure - Follow growing conversation state into queue and memory pressure
// Growing voice context bar, paged KV block allocation (does NOT make logical state free!),
// and speculative draft-vs-target verification lane.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  glowMeter,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function servingPressure(s, c) {
  const phase = s.value(0);
  const growOn = s.value(0);
  const dropOn = s.value(0);
  const pagedOn = s.value(0);
  const specOn = s.value(0);

  const header = cinemaHeader(
    'LONG-CALL SERVING PRESSURE',
    'Growing state drives',
    'queue & KV pressure',
    {
      x: -860,
      y: -445,
      accent: ROLE.warn,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#f59e0b1a', '#a78bfa18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const gr = growOn.value;
      const dr = dropOn.value;
      const pg = pagedOn.value;
      const sp = specOn.value;
      const nodes = [];

      // Left column: Growing retained context & TTFT queue pressure
      const lx = -840;
      const ctxFrac = 0.35 + gr * 0.55;
      nodes.push(
        txt('RETAINED CONVERSATION CONTEXT', lx, -185, 26, ROLE.audio, 'mono', 'left'),
        glowMeter(lx, -135, 720, 28, ctxFrac, { fill: gr > 0.4 ? ROLE.warn : ROLE.audio, glow: 8 }),
        txt(
          dr > 0.4
            ? 'KEEP: final turns + verified tool results'
            : 'LONG CALLS GROW KV & QUEUE DEPTH',
          lx,
          -72,
          26,
          dr > 0.4 ? ROLE.ok : ROLE.warn,
          'mono',
          'left',
        ),
        txt(
          dr > 0.4
            ? 'DROP: unstable interim STT & unheard text'
            : 'Inspect context & queues before swapping models',
          lx,
          -24,
          26,
          dr > 0.4 ? ROLE.cut : COSMOS.muted,
          'mono',
          'left',
        ),
      );

      // Bottom-left: Paged KV blocks (grow & trim in blocks, still consumes memory!)
      const pgY = 120;
      const pgAlpha = 0.4 + pg * 0.6;
      nodes.push(
        txt('PAGED KV ALLOCATION (BLOCKS)', lx, pgY - 62, 26, ROLE.media, 'mono', 'left').opacity(
          pgAlpha,
        ),
      );
      for (let i = 0; i < 6; i++) {
        const bx = lx + 46 + i * 116;
        const used = i < 4;
        const col = used ? ROLE.media : '#2c3d66';
        nodes.push(
          rect(96, 52, { fill: '#0b1428', stroke: col, width: 2.8, radius: 6 })
            .at(bx, pgY)
            .glow(used ? 6 : 0, col)
            .opacity(pgAlpha),
          txt(used ? `BLK ${i + 1}` : 'free', bx, pgY, 26, col, 'mono', 'center').opacity(pgAlpha),
        );
      }
      nodes.push(
        txt(
          'avoids contiguous copy · logical state NOT free!',
          lx,
          pgY + 62,
          26,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(pgAlpha),
      );

      // Right column: Speculative Decoding Draft -> Target Verify
      const rx = 120;
      const spAlpha = 0.35 + sp * 0.65;
      nodes.push(
        line([60, -210], [60, 205], { stroke: '#2c3d66', width: 2.5 }),
        txt('SPECULATIVE DECODING', rx, -185, 26, ROLE.policy, 'mono', 'left').opacity(spAlpha),
        txt('Draft model -> proposes tokens', rx, -120, 26, ROLE.audio, 'mono', 'left').opacity(
          spAlpha,
        ),
        txt('Target model -> verifies batch', rx, -65, 26, ROLE.ok, 'mono', 'left').opacity(
          spAlpha,
        ),
        txt('Net gain depends on:', rx, 10, 26, ROLE.focus, 'mono', 'left').opacity(spAlpha),
        txt('  acceptance rate vs overhead', rx, 58, 26, COSMOS.ink, 'mono', 'left').opacity(
          spAlpha,
        ),
        txt('Measure real first-audio & clause!', rx, 130, 26, ROLE.ok, 'mono', 'left').opacity(
          spAlpha,
        ),
      );

      // Top-right rule
      nodes.push(
        txt('SERVING DIAGNOSTIC', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('long-session TTFT jump -> check KV!', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
      );

      nodes.push(
        line([-840, 260], [840, 260], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'Measure actual first-audio & clause completion, not just cache hit or draft counts',
          0,
          330,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.warn,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('va-serving-pressure-0-1', () => {
    s.play(growOn.to(1, { duration: clampDur(c, c.cue('va-serving-pressure-0-1').start, 0.4) }));
  });
  c.on('va-serving-pressure-0-2', () => {
    s.play(dropOn.to(1, { duration: clampDur(c, c.cue('va-serving-pressure-0-2').start, 0.35) }));
  });
  c.on('va-serving-pressure-1-0', () => {
    s.play(pagedOn.to(1, { duration: clampDur(c, c.cue('va-serving-pressure-1-0').start, 0.35) }));
  });
  c.on('va-serving-pressure-1-2', () => {
    s.play(specOn.to(1, { duration: clampDur(c, c.cue('va-serving-pressure-1-2').start, 0.4) }));
  });
}
