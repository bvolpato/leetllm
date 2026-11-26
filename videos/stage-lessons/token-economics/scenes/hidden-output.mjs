// Scene 8: hidden-output - An incomplete answer can consume its output budget
// Glowing segmented output core: 1,024 amber reasoning tokens nested inside 1,186 rose output total.
// Mode 0: Inspect nested breakdown. Mode 1: Single billing ($0.01779) vs double-count ($0.03315).
// Mode 2: Reasoning-only incomplete call (1,800 input + 1,024 reasoning = $0.01986, 0 visible answer).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  HIDDEN_OUT,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowBar,
  guardedDynamic,
  txt,
  usd,
} from '../parts.mjs';

export default function hiddenOutput(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = breakdown, 1 = single vs double, 2 = incomplete reasoning-only
  const p0 = s.value(0);
  const p1 = s.value(0);
  const p2 = s.value(0);

  const header = cinemaHeader(
    'REASONING TOKEN BILLING',
    'Hidden reasoning',
    'fills the output cap',
    {
      x: -860,
      y: -415,
      accent: ROLE.reasoning,
      size: 52,
    },
  );

  const sceneAura = aura(100, 30, 680, '#fb923c24', '#ff6b8b1a');

  // Modes 0 & 1 share the 1,186 output core strip (with smooth bottom readout swap)
  const mode01 = guardedDynamic(
    () => fadeOutHalf(Math.max(0, mode.value - 1)),
    (a) => {
      const m = mode.value;
      const a0 = fadeOutHalf(m) * a;
      const a1 = fadeInHalf(m) * a;
      const stripX = -820;
      const stripW = 1640;
      const reasonW = stripW * (HIDDEN_OUT.reasoningTokens / HIDDEN_OUT.totalTokens);
      const otherW = stripW - reasonW;

      const nodes = [
        txt('REPORTED OUTPUT TOTAL  ·  1,186 TOKENS', 0, -195, 28, ROLE.output, 'mono').opacity(a),

        // Outer rose shell framing the whole 1,186 output total
        rect(stripW + 16, 114, { fill: '#190f1d', stroke: ROLE.output, width: 2.6, radius: 14 })
          .at(0, -80)
          .glow(8, ROLE.output)
          .opacity(a),

        // Nested 1,024 amber reasoning core
        rect(reasonW - 6, 88, { fill: '#3b240c', stroke: ROLE.reasoning, width: 2.4, radius: 10 })
          .at(stripX + reasonW * 0.5, -80)
          .glow(10, ROLE.reasoning)
          .opacity(a),
        txt(
          '1,024 reasoning (nested inside)',
          stripX + reasonW * 0.5,
          -80,
          32,
          ROLE.reasoning,
          'mono',
        ).opacity(a),

        // Remaining 162 tokens
        rect(otherW - 6, 88, { fill: '#351324', stroke: ROLE.output, width: 2.2, radius: 10 })
          .at(stripX + reasonW + otherW * 0.5, -80)
          .opacity(a),
        txt('162', stripX + reasonW + otherW * 0.5, -80, 30, ROLE.output, 'mono').opacity(a),
      ];

      if (a0 > 0.02) {
        const u = p0.value;
        nodes.push(
          txt(
            '1,024 reasoning + 162 formatting / visible text = 1,186 total',
            0,
            82,
            32,
            COSMOS.ink,
            'sans',
          ).opacity(a0),
          txt(
            'Do not add the nested reasoning detail a second time',
            0,
            172,
            34,
            ROLE.cached,
            'sans',
          )
            .glow(6, ROLE.cached)
            .opacity(Math.max(0.3, u) * a0),
          txt(
            'The non-reasoning remainder can include formatting, not only visible words',
            0,
            345,
            28,
            COSMOS.muted,
            'sans',
          ).opacity(a0),
        );
      }

      if (a1 > 0.02) {
        const u = p1.value;
        nodes.push(
          // Left: Correct single billing
          txt('CORRECT  ·  PRICE OUTPUT ONCE', -450, 75, 26, ROLE.ok, 'mono').opacity(a1),
          txt('1,186 x $15 / 1M', -450, 138, 32, COSMOS.ink, 'mono').opacity(a1),
          txt(usd(HIDDEN_OUT.singleMicro, 5), -450, 212, 48, ROLE.ok, 'mono')
            .glow(9, ROLE.ok)
            .opacity(a1),

          // Right: Double-count mistake
          txt('DOUBLE COUNT ERROR', 430, 75, 26, ROLE.fail, 'mono').opacity(Math.max(0.2, u) * a1),
          txt('(1,186 + 1,024) x $15 / 1M', 430, 138, 30, ROLE.fail, 'mono').opacity(
            Math.max(0.2, u) * a1,
          ),
          txt(`${usd(HIDDEN_OUT.doubleMicro, 5)}  ·  2x REASONING`, 430, 212, 38, ROLE.fail, 'mono')
            .glow(9, ROLE.fail)
            .opacity(Math.max(0.2, u) * a1),

          txt(
            'Reasoning detail explains the output total; it is not a second charge',
            0,
            355,
            28,
            COSMOS.muted,
            'sans',
          ).opacity(a1),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 2: Incomplete call consuming all 1,024 output tokens on reasoning
  const mode2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, mode.value - 1)),
    (a) => {
      const u = p2.value;
      const nodes = [
        txt('INCOMPLETE CALL  ·  0 VISIBLE ANSWER TOKENS', 0, -195, 28, ROLE.fail, 'mono')
          .glow(6, ROLE.fail)
          .opacity(a),

        // Full bar consumed by 1,024 amber reasoning tokens
        glowBar(-820, -90, 1640, 72, Math.max(0.25, u), {
          fill: ROLE.reasoning,
          border: ROLE.output,
          glow: 10,
          opacity: a,
        }),
        txt(
          '1,024 / 1,024 output tokens spent on reasoning  ·  0 visible text',
          0,
          -2,
          30,
          ROLE.reasoning,
          'mono',
        ).opacity(a),

        // Two billed charges
        txt('Ordinary input: 1,800 tokens', -450, 105, 28, ROLE.input, 'mono').opacity(a),
        txt(usd(HIDDEN_OUT.incompleteInputMicro, 5), -450, 168, 42, ROLE.input, 'mono').opacity(a),

        txt('Reasoning output: 1,024 tokens', 450, 105, 28, ROLE.output, 'mono').opacity(a),
        txt(usd(HIDDEN_OUT.incompleteOutputMicro, 5), 450, 168, 42, ROLE.output, 'mono').opacity(a),

        txt(
          `INCOMPLETE CALL STILL COSTS ${usd(HIDDEN_OUT.incompleteTotalMicro, 5)}`,
          0,
          280,
          42,
          ROLE.cached,
          'mono',
        )
          .glow(9, ROLE.cached)
          .opacity(Math.max(0.3, u) * a),
        txt(
          'Inspect stop_reason with usage  ·  output cap covers reasoning & formatting',
          0,
          375,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode01, mode2);
  driftValue(s, c, pulseT, 3.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('te-hidden-output-0', () => {
    const t = c.cue('te-hidden-output-0').start;
    s.play(p0.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-hidden-output-1', () => {
    const t = c.cue('te-hidden-output-1').start;
    s.play(p1.to(1, { duration: clampDur(c, t, 0.65) }));
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(mode.to(2, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-hidden-output-2', () => {
    const t = c.cue('te-hidden-output-2').start;
    s.play(p2.to(1, { duration: clampDur(c, t, 0.75) }));
  });
}
