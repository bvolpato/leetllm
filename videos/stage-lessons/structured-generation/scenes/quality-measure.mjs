// Scene 27: quality-measure - What does one mask cost?
// 3-act systems measurement dashboard:
//   Act 0: Cold TTFT (compile + prefill) vs Warm decode (model work overlapped with mask) + input tokens.
//   Act 1: Precision microsecond ratio gauge + glowing MathJax 40 us / 10,000 us = 0.4% (XGrammar).
//   Act 2: 4 luminous evaluation pillars (completion, schema, source truth, permission) contrasting
//          parse success against held-out task reasoning accuracy (Tam et al. 2024).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  MASK_METRICS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  glowMeter,
  glowTex,
  guardedDynamic,
  opticalRail,
  txt,
} from '../parts.mjs';

export default function qualityMeasure(s, c) {
  const act = s.value(0); // 0 = latency categories, 1 = 40 us / 10,000 us = 0.4%, 2 = 4 eval pillars
  const b0Hi = s.value(0);
  const compileOn = s.value(0);
  const maskOn = s.value(0);
  const inputOn = s.value(0);
  const ratioOn = s.value(0);
  const b2Hi = s.value(0);

  const header = cinemaHeader('LATENCY & TASK ACCURACY', 'What does one', 'mask cost?', {
    accent: ROLE.fsm,
    size: 50,
  });

  const stageAura = aura(220, 40, 640, '#5ce1e61e', '#6ee7b716');

  const ratioEq = glowTex(
    String.raw`\frac{40\,\mu\text{s}}{10{,}000\,\mu\text{s}} \times 100 = 0.4\%`,
    { x: 0, y: 196, size: 46, color: ROLE.legal, glow: 10 },
  );

  // Act 0: Cold compile vs Warm overlap + prompt token overhead
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const b0 = b0Hi.value;
      const co = compileOn.value;
      const mk = maskOn.value;
      const ip = inputOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'SEPARATE COLD COMPILATION FROM WARM DECODE WORK',
          -840,
          -215,
          26,
          ROLE.fsm,
          'mono',
          'left',
        ).opacity(a),
      );

      // Cold TTFT lane
      const yCold = -95;
      nodes.push(
        txt('COLD TTFT', -840, yCold, 30, ROLE.prefix, 'mono', 'left').opacity(a),
        rect(310, 74, { fill: '#221c0e', stroke: ROLE.prefix, width: 2.8, radius: 10 })
          .at(-375, yCold)
          .glow(co > 0.3 ? 9 : 2, ROLE.prefix)
          .opacity(a * (0.3 + 0.7 * co)),
        txt('COMPILE', -375, yCold, 28, ROLE.prefix, 'mono', 'center').opacity(
          a * (0.3 + 0.7 * co),
        ),
        rect(620, 74, { fill: '#101d36', stroke: ROLE.gpu, width: 2.8, radius: 10 })
          .at(120, yCold)
          .glow(b0 > 0.3 ? 6 : 2, ROLE.gpu)
          .opacity(a),
        txt('PREFILL', 120, yCold, 28, ROLE.gpu, 'mono', 'center').opacity(a),
      );

      // Warm decode model lane + overlapped mask lane
      const yWarm = 45;
      nodes.push(
        txt('WARM DECODE', -840, yWarm, 30, ROLE.gpu, 'mono', 'left').opacity(a),
        rect(740, 74, { fill: '#101d36', stroke: ROLE.gpu, width: 2.8, radius: 10 })
          .at(-160, yWarm)
          .glow(6, ROLE.gpu)
          .opacity(a),
        txt('GPU MODEL FORWARD PASS', -160, yWarm, 28, ROLE.gpu, 'mono', 'center').opacity(a),

        txt('WARM MASK', -840, yWarm + 112, 30, ROLE.legal, 'mono', 'left').opacity(
          a * (0.3 + 0.7 * mk),
        ),
        rect(250, 70, { fill: '#0e2824', stroke: ROLE.legal, width: 2.8, radius: 10 })
          .at(-405, yWarm + 112)
          .glow(mk > 0.3 ? 9 : 0, ROLE.legal)
          .opacity(a * (0.3 + 0.7 * mk)),
        txt('MASK', -405, yWarm + 112, 28, ROLE.legal, 'mono', 'center').opacity(
          a * (0.3 + 0.7 * mk),
        ),
        txt('overlapped with GPU', -245, yWarm + 112, 28, ROLE.legal, 'mono', 'left').opacity(
          a * mk,
        ),
      );

      // Schema & description input tokens
      if (ip > 0.05) {
        nodes.push(
          line([-840, 245], [840, 245], { stroke: '#25355a', width: 2 }).opacity(a * ip),
          txt(
            'ALSO MEASURE INPUT TOKENS SPENT ON SCHEMA DESCRIPTIONS & INSTRUCTIONS',
            -840,
            325,
            28,
            ROLE.fsm,
            'mono',
            'left',
          )
            .glow(7, ROLE.fsm)
            .opacity(a * ip),
        );
      } else {
        nodes.push(
          txt(
            'Measure cold vs warm distributions at your real serving batch sizes',
            -840,
            325,
            28,
            COSMOS.muted,
            'serif',
            'left',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Act 1: 40 us vs 10,000 us = 0.4%
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const rt = ratioOn.value;
      const nodes = [];

      nodes.push(
        opticalRail(-840, -195, -55, ROLE.fsm, { opacity: a }),
        txt('XGRAMMAR PAPER (2024)', -805, -178, 26, ROLE.fsm, 'mono', 'left').opacity(a),
        txt(`< ${MASK_METRICS.xgrammarUs} µs per mask`, -805, -112, 46, ROLE.fsm, 'mono', 'left')
          .glow(8, ROLE.fsm)
          .opacity(a),
        txt(
          'reported on its grammar-engine benchmark',
          -805,
          -62,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),

        opticalRail(40, -195, -55, ROLE.prefix, { opacity: a }),
        txt('AT 100 OUTPUT TOKENS / SEC', 75, -178, 26, ROLE.prefix, 'mono', 'left').opacity(a),
        txt(
          `${MASK_METRICS.usPerTok.toLocaleString()} µs / token`,
          75,
          -112,
          46,
          ROLE.prefix,
          'mono',
          'left',
        )
          .glow(8, ROLE.prefix)
          .opacity(a),
        txt('one token time budget on average', 75, -62, 26, COSMOS.muted, 'sans', 'left').opacity(
          a,
        ),

        // Full-width visual microsecond budget bar with tiny 0.4% glowing emerald sliver!
        txt(
          'MASK SHARE OF ONE 10,000 µs TOKEN BUDGET',
          -840,
          12,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        glowMeter(-840, 56, 1680, 26, 0.015, { fill: ROLE.legal, opacity: a }),
        txt(
          rt > 0.3
            ? 'End-to-end latency still includes prefill, batching, queuing, and network time'
            : 'Comparing reported mask time against a 10,000 µs token budget...',
          -840,
          345,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 2: 4 evaluation pillars (parse success != task accuracy!)
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const b2 = b2Hi.value;
      const nodes = [];

      nodes.push(
        txt(
          'MEASURE HELD-OUT DECISIONS ACROSS ALL FOUR AXES',
          -840,
          -205,
          26,
          ROLE.prefix,
          'mono',
          'left',
        ).opacity(a),
      );

      const pillars = [
        { x: -630, tag: '1. COMPLETE', sub: 'no truncation', col: ROLE.schema },
        { x: -210, tag: '2. SCHEMA', sub: 'strict local parse', col: ROLE.fsm },
        { x: 210, tag: '3. SOURCE', sub: 'matches log truth', col: ROLE.prefix },
        { x: 630, tag: '4. SCOPE', sub: 'host permission', col: ROLE.legal },
      ];

      pillars.forEach((pl) => {
        nodes.push(
          fsmNode(pl.x, -15, 78, pl.tag.slice(3), {
            color: pl.col,
            accepting: true,
            size: 26,
            opacity: a,
          }),
          txt(pl.tag, pl.x, 108, 28, pl.col, 'mono', 'center').opacity(a),
          txt(pl.sub, pl.x, 152, 26, COSMOS.muted, 'sans', 'center').opacity(a),
        );
      });

      nodes.push(
        line([-840, 220], [840, 220], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'PARSE SUCCESS CAN RISE WHILE REASONING ACCURACY DROPS',
          -840,
          294,
          30,
          ROLE.review,
          'mono',
          'left',
        )
          .glow(b2 > 0.3 ? 8 : 0, ROLE.review)
          .opacity(a),
        txt(
          'Tam et al. (2024): format constraints hurt some reasoning benchmarks · Benchmark your model & schema',
          -840,
          358,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);
  c.show('sg-mask-cost', ratioEq, { after: false });

  c.on('sg-quality-measure-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-quality-measure-0').start, 0.35) }));
  });
  c.on('sg-cost-compile', () => {
    s.play(compileOn.to(1, { duration: clampDur(c, c.cue('sg-cost-compile').start, 0.4) }));
  });
  c.on('sg-cost-mask', () => {
    s.play(maskOn.to(1, { duration: clampDur(c, c.cue('sg-cost-mask').start, 0.4) }));
  });
  c.on('sg-cost-input', () => {
    s.play(inputOn.to(1, { duration: clampDur(c, c.cue('sg-cost-input').start, 0.4) }));
  });
  c.on('sg-quality-measure-1', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('sg-quality-measure-1').start, 0.4) }));
  });
  c.on('sg-mask-cost', () => {
    s.play(ratioOn.to(1, { duration: clampDur(c, c.cue('sg-mask-cost').start, 0.4) }));
  });
  c.on('sg-quality-measure-2', () => {
    ratioEq.hide();
    s.play(act.to(2, { duration: clampDur(c, c.cue('sg-quality-measure-2').start, 0.4) }));
    s.play(b2Hi.to(1, { duration: clampDur(c, c.cue('sg-quality-measure-2').start, 0.4) }));
  });
}
