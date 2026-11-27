// Scene 11: cache-policy - Match the rendered prefix and its actual billing policy
// Mode 0: Two aligned prompt pipelines where Policy v3 -> v4 breaks the glowing prefix beam early.
// Mode 1: OpenAI GPT-5.6+ retention lifetimes (30 min = 1.25x, 12 hours = 2.5x, min 1,024 tokens).
// Mode 2: Anthropic retention lifetimes (5 min = 1.25x, 1 hour = 2.0x) + measure TTFT/ITL latency.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowBar,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function cachePolicy(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = prefix break, 1 = OpenAI TTLs, 2 = Anthropic TTLs
  const breakProg = s.value(0);
  const oaiProg = s.value(0);
  const antProg = s.value(0);

  const header = cinemaHeader(
    'PREFIX MATCH & RETENTION',
    'Match the rendered',
    'prefix & TTL policy',
    {
      x: -860,
      y: -415,
      accent: ROLE.cached,
      size: 52,
    },
  );

  const sceneAura = aura(0, 60, 720, '#ffd16620', '#ff6b8b18');

  // Mode 0: Rendered Prompt Prefix Match Break (Policy v3 -> v4)
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const broken = breakProg.value > 0.5;
      const p = 0;
      const segs = ['Instructions', 'Tool schema', 'Policy v3', 'Order 42'];
      const nodes = [
        txt('EARLIER REQUEST', -840, -188, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('CURRENT REQUEST', -840, 224, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      ];

      segs.forEach((label, i) => {
        const cx = -630 + i * 420;
        const topColor = i < 3 ? ROLE.cached : ROLE.input;
        const botLabel = i === 3 ? 'Order 77' : i === 2 && broken ? 'Policy v4' : label;
        const botMatch = i < 2 || (i === 2 && !broken);
        const botColor = botMatch ? ROLE.cached : ROLE.fail;

        // Top row block
        nodes.push(
          rect(370, 86, { fill: '#1a1e30', stroke: topColor, width: 2.4, radius: 12 })
            .at(cx, -108)
            .glow(7, topColor)
            .opacity(a),
          txt(label, cx, -108, 28, topColor, 'mono').opacity(a),
        );

        // Bottom row block
        nodes.push(
          rect(370, 86, {
            fill: botMatch ? '#2e240e' : '#351324',
            stroke: botColor,
            width: 2.6,
            radius: 12,
          })
            .at(cx, 145)
            .glow(botMatch ? 9 : 10, botColor)
            .opacity(a),
          txt(botLabel, cx, 145, 28, botColor, 'mono').opacity(a),
        );

        // Vertical beam linking matched prefix segments
        if (i < 3) {
          const linkColor = i === 2 && broken ? ROLE.fail : ROLE.ok;
          const pts = quadArcPts([cx, -58], [cx, 95], 0, 14);
          nodes.push(
            beamWithPhotons(pts, linkColor, (p + i * 0.25) % 1, {
              width: 3.4,
              glow: 9,
              photonCount: i === 2 && broken ? 0 : 1,
              alpha: a,
            }),
          );
        }
      });

      nodes.push(
        txt(
          broken
            ? 'Changing Policy v3 -> v4 snaps the cached prefix before Order 77'
            : 'Stable instructions, tool schema & policy prefix match identically',
          0,
          312,
          32,
          broken ? ROLE.fail : ROLE.ok,
          'sans',
        )
          .glow(6, broken ? ROLE.fail : ROLE.ok)
          .opacity(a),
        txt(
          'Keep stable material first  ·  count a read only when the provider reports one',
          0,
          388,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1: OpenAI GPT-5.6+ Cache Lifetimes & Write Multipliers
  const mode1 = guardedDynamic(
    () => Math.min(fadeInHalf(mode.value), fadeOutHalf(Math.max(0, mode.value - 1))),
    (a) => {
      const u = oaiProg.value;
      const nodes = [
        txt('OPENAI GPT-5.6+  ·  CHECKED NOV 2026', -840, -185, 28, ROLE.cached, 'mono', 'left')
          .glow(5, ROLE.cached)
          .opacity(a),

        // 30-minute default tier
        txt('30 MINUTES', -840, -70, 32, ROLE.cached, 'mono', 'left').opacity(a),
        glowBar(-460, -70, 960, 44, (30 / 720) * (0.4 + 0.6 * u) + 0.08, {
          fill: ROLE.cached,
          glow: 9,
          opacity: a,
        }),
        txt('1.25x base input', 840, -70, 32, ROLE.cached, 'mono', 'right').opacity(a),

        // 12-hour extended tier
        txt('12 HOURS', -840, 85, 32, ROLE.write, 'mono', 'left').opacity(a),
        glowBar(-460, 85, 960, 44, Math.max(0.25, u), {
          fill: ROLE.write,
          glow: 10,
          opacity: a,
        }),
        txt('2.50x base input', 840, 85, 32, ROLE.write, 'mono', 'right')
          .glow(7, ROLE.write)
          .opacity(a),

        txt(
          'MINIMUM VISIBLE PREFIX: 1,024 INPUT TOKENS',
          -840,
          232,
          30,
          ROLE.input,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'Read discounts & retention vary by model  ·  older cards have no separate write fee',
          -840,
          316,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  // Mode 2: Anthropic Cache Lifetimes + Latency Measurement
  const mode2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, mode.value - 1)),
    (a) => {
      const u = antProg.value;
      const nodes = [
        txt(
          'ANTHROPIC PROMPT CACHING  ·  CHECKED NOV 2026',
          -840,
          -185,
          28,
          ROLE.ok,
          'mono',
          'left',
        )
          .glow(5, ROLE.ok)
          .opacity(a),

        // 5-minute tier
        txt('5 MINUTES', -840, -70, 32, ROLE.cached, 'mono', 'left').opacity(a),
        glowBar(-460, -70, 960, 44, (5 / 60) * (0.4 + 0.6 * u) + 0.08, {
          fill: ROLE.cached,
          glow: 9,
          opacity: a,
        }),
        txt('1.25x base input', 840, -70, 32, ROLE.cached, 'mono', 'right').opacity(a),

        // 1-hour tier
        txt('1 HOUR', -840, 85, 32, ROLE.ok, 'mono', 'left').opacity(a),
        glowBar(-460, 85, 960, 44, Math.max(0.25, u), {
          fill: ROLE.ok,
          glow: 10,
          opacity: a,
        }),
        txt('2.00x base input', 840, 85, 32, ROLE.ok, 'mono', 'right').glow(7, ROLE.ok).opacity(a),

        txt(
          'PRICE ALONE CANNOT MEASURE WAIT TIME',
          -840,
          232,
          30,
          ROLE.output,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'Measure TTFT, time between tokens & end-to-end latency alongside token cost',
          -840,
          316,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode0, mode1, mode2);

  c.on('te-cache-policy-0', () => {
    const t = c.cue('te-cache-policy-0').start;
    s.play(breakProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-cache-policy-1', () => {
    const t = c.cue('te-cache-policy-1').start;
    s.play(oaiProg.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(mode.to(2, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-cache-policy-2', () => {
    const t = c.cue('te-cache-policy-2').start;
    s.play(antProg.to(1, { duration: clampDur(c, t, 0.7) }));
  });
}
