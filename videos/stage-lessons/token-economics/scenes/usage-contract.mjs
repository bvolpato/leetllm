// Scene 7: usage-contract - Normalize mutually exclusive token categories
// Mode 0: Disjoint 1,800-token strip slicing into 520 ordinary + 1,280 reads (OpenAI nested model).
// Mode 1: Validation guardrails (reject Boolean count, enforce reads + writes <= total & reasoning <= output).
// Mode 2: Anthropic separate fields (520 ordinary + 1,280 separate reads -> reconstruct 1,800 total).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowBar,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function usageContract(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = nested split, 1 = validation guards, 2 = anthropic separate
  const splitProg = s.value(0);
  const guardProg = s.value(0);
  const anthProg = s.value(0);

  const header = cinemaHeader('DISJOINT BUCKETS', 'Normalize every', 'provider receipt', {
    x: -860,
    y: -415,
    accent: ROLE.cached,
    size: 52,
  });

  const sceneAura = aura(120, 50, 680, '#5ce1e620', '#ffd1661c');

  // Mode 0: OpenAI nested prompt_tokens -> subtract reads & writes
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const u = splitProg.value;
      const stripX = -820;
      const stripW = 1640;
      const ordW = stripW * (520 / 1800);
      const readW = stripW - ordW;
      const nodes = [
        txt('OPENAI NESTED TOTAL  ·  1,800 INPUT TOKENS', 0, -185, 28, ROLE.cached, 'mono').opacity(
          a,
        ),
        rect(ordW - 6, 86, { fill: '#0f2b3d', stroke: ROLE.input, width: 2.6, radius: 10 })
          .at(stripX + ordW * 0.5, -75)
          .glow(8, ROLE.input)
          .opacity(a),
        txt('520 ordinary', stripX + ordW * 0.5, -75, 30, ROLE.input, 'mono').opacity(a),

        rect(readW - 6, 86, {
          fill: u > 0.2 ? '#3a2d0f' : '#102336',
          stroke: u > 0.2 ? ROLE.cached : ROLE.input,
          width: 2.6,
          radius: 10,
        })
          .at(stripX + ordW + readW * 0.5, -75)
          .glow(u > 0.2 ? 10 : 5, ROLE.cached)
          .opacity(a),
        txt(
          u > 0.2 ? '1,280 cache reads  ·  0 writes' : '1,280 nested inside prompt_tokens',
          stripX + ordW + readW * 0.5,
          -75,
          30,
          u > 0.2 ? ROLE.cached : COSMOS.ink,
          'mono',
        ).opacity(a),

        txt('ordinary = total - reads - writes', 0, 85, 42, COSMOS.ink, 'mono')
          .glow(6, ROLE.input)
          .opacity(a),
        txt('520 + 1,280 + 0 = 1,800 disjoint input tokens', 0, 175, 32, ROLE.ok, 'mono')
          .glow(7, ROLE.ok)
          .opacity(Math.max(0.25, u) * a),
        txt(
          'Price each bucket once  ·  reasoning stays inside reported output',
          0,
          345,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  // Mode 1: Type & Bounds Validation Guards
  const mode1 = guardedDynamic(
    () => Math.min(fadeInHalf(mode.value), fadeOutHalf(Math.max(0, mode.value - 1))),
    (a) => {
      const u = guardProg.value;
      const strict = u > 0.55;
      const nodes = [
        txt('VALIDATE BEFORE PRICING', 0, -190, 28, ROLE.input, 'mono').opacity(a),

        // Left: Rejected Boolean vs Accepted Integer
        rect(620, 108, {
          fill: '#351324',
          stroke: ROLE.fail,
          width: 2.6,
          radius: 14,
        })
          .at(-430, -45)
          .glow(9, ROLE.fail)
          .opacity(a),
        txt('count = true   ->   REJECT', -430, -45, 32, ROLE.fail, 'mono').opacity(a),

        rect(620, 108, {
          fill: '#0e2820',
          stroke: ROLE.ok,
          width: 2.6,
          radius: 14,
        })
          .at(430, -45)
          .glow(strict ? 11 : 6, ROLE.ok)
          .opacity(a),
        txt('count = 1   ->   EXACT INT', 430, -45, 32, ROLE.ok, 'mono').opacity(a),

        // Three structural invariants below
        txt(
          '1.  reads + writes <= total_input',
          -740,
          118,
          30,
          ROLE.cached,
          'mono',
          'left',
        ).opacity(a),
        txt('2.  reasoning <= reported_output', -740, 184, 30, ROLE.output, 'mono', 'left').opacity(
          a,
        ),
        txt(
          '3.  all rates finite & nonnegative  ·  keep unrounded decimals',
          -740,
          250,
          30,
          ROLE.input,
          'mono',
          'left',
        ).opacity(a),

        txt(
          'Reconcile rounding and adjustments against the invoice',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  // Mode 2: Anthropic Separate Fields Reconstructed to 1,800 Total
  const mode2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, mode.value - 1)),
    (a) => {
      const u = anthProg.value;
      const p = pulseT.value;
      const nodes = [
        txt(
          'ANTHROPIC SEPARATE FIELDS  ·  RECONSTRUCT TOTAL',
          0,
          -195,
          28,
          ROLE.ok,
          'mono',
        ).opacity(a),

        // Row 1: Ordinary input_tokens = 520
        txt('input_tokens (ordinary)', -830, -75, 28, ROLE.input, 'mono', 'left').opacity(a),
        glowBar(-340, -75, 860, 38, (520 / 1800) * Math.max(0.3, u), {
          fill: ROLE.input,
          glow: 9,
          opacity: a,
        }),
        txt('520 tokens', 820, -75, 30, ROLE.input, 'mono', 'right').opacity(a),

        // Row 2: cache_read_input_tokens = 1,280
        txt('cache_read_input_tokens', -830, 55, 28, ROLE.cached, 'mono', 'left').opacity(a),
        glowBar(-340, 55, 860, 38, (1280 / 1800) * Math.max(0.3, u), {
          fill: ROLE.cached,
          glow: 9,
          opacity: a,
        }),
        txt('1,280 tokens', 820, 55, 30, ROLE.cached, 'mono', 'right').opacity(a),

        // Converging photon arcs into reconstructed total
        beamWithPhotons(quadArcPts([180, -48], [180, 175], 0, 18), ROLE.ok, p, {
          width: 3.6,
          glow: 10,
          photonCount: 2,
          alpha: u * a,
        }),

        txt('520 + 1,280 = 1,800 total input', 0, 225, 42, ROLE.ok, 'mono')
          .glow(8, ROLE.ok)
          .opacity(Math.max(0.3, u) * a),
        txt(
          'Match model, tier, region, currency & rate date before quoting a total',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode0, mode1, mode2);
  driftValue(s, c, pulseT, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('te-usage-contract-0', () => {
    const t = c.cue('te-usage-contract-0').start;
    s.play(splitProg.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-usage-contract-1', () => {
    const t = c.cue('te-usage-contract-1').start;
    s.play(guardProg.to(1, { duration: clampDur(c, t, 0.8) }));
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(mode.to(2, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-usage-contract-2', () => {
    const t = c.cue('te-usage-contract-2').start;
    s.play(anthProg.to(1, { duration: clampDur(c, t, 0.75) }));
  });
}
