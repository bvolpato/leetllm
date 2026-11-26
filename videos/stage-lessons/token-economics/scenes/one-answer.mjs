// Scene 3: one-answer - Which part of this call costs more?
// Glowing billing-rate multiplier beams (1,800 x $2.50/M vs 180 x $15.00/M).
// Strict prediction withholding during beat 1; `multiply-rates` grows dollar bars & `one-answer-total` closes at $0.00720.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  coldMicro,
  driftValue,
  glowBar,
  glowTex,
  guardedDynamic,
  quadArcPts,
  standard,
  txt,
  usd,
} from '../parts.mjs';

export default function oneAnswer(s, c) {
  const pulseT = s.value(0);
  const rateReveal = s.value(0);
  const countReveal = s.value(0);
  const chargeProg = s.value(0);
  const totalReveal = s.value(0);

  const inChargeMicro = 1800 * standard.input; // 4500 = $0.00450
  const outChargeMicro = 180 * standard.output; // 2700 = $0.00270

  const header = cinemaHeader(
    'GPT-5.4 STANDARD · 2026-09-21',
    'Rate vs. volume:',
    'which costs more?',
    {
      x: -860,
      y: -415,
      accent: ROLE.input,
      size: 52,
    },
  );

  const sceneAura = aura(120, 40, 680, '#5ce1e622', '#ff6b8b1a');

  // MathJax total equation revealed ONLY on `one-answer-total`
  const totalEq = glowTex(String.raw`\$0.00450 + \$0.00270 = \$0.00720`, {
    x: 240,
    y: 355,
    size: 46,
    color: ROLE.cached,
    glow: 9,
  });

  const canvas = guardedDynamic(
    () => 1,
    () => {
      const rV = rateReveal.value;
      const cV = countReveal.value;
      const ch = chargeProg.value;
      const tot = totalReveal.value;
      const p = pulseT.value;

      const nodes = [];

      // Column headers
      nodes.push(
        txt('VOLUME', -680, -210, 26, COSMOS.muted, 'mono'),
        txt('RATE CARD  (6x OUTPUT)', -110, -210, 26, COSMOS.muted, 'mono'),
        txt('DOLLAR CHARGE', 530, -210, 26, COSMOS.muted, 'mono'),
      );

      // Row 1: Input (y = -75)
      const yIn = -75;
      const inPts = quadArcPts([-490, yIn], [210, yIn], -32);
      nodes.push(
        txt('ORDINARY INPUT', -860, yIn - 48, 26, ROLE.input, 'mono', 'left'),
        txt(
          cV > 0.2 ? '1,800 tokens' : 'Input tokens',
          -860,
          yIn + 6,
          40,
          COSMOS.ink,
          'mono',
          'left',
        ),
        beamWithPhotons(inPts, ROLE.input, p, {
          width: 4.0,
          glow: 10,
          photonCount: 2,
          alpha: 0.45 + 0.55 * rV,
        }),
        txt(`$${standard.input.toFixed(2)} / 1M`, -110, yIn - 56, 34, ROLE.input, 'mono').glow(
          6,
          ROLE.input,
        ),
        txt('1x baseline', -110, yIn + 46, 26, COSMOS.muted, 'mono'),
      );

      // Input charge bar (withheld until `multiply-rates`)
      if (ch > 0.02) {
        nodes.push(
          glowBar(245, yIn, 415, 34, ch, { fill: ROLE.input, glow: 10 }),
          txt(usd(inChargeMicro * ch, 5), 860, yIn, 34, ROLE.input, 'mono', 'right').glow(
            7,
            ROLE.input,
          ),
          txt('1,800 x $2.50 / 10^6', 245, yIn + 56, 26, ROLE.input, 'mono', 'left').opacity(ch),
        );
      } else {
        nodes.push(
          glowBar(245, yIn, 415, 34, 0, { fill: ROLE.input, border: '#35486e', glow: 0 }),
          txt('?', 860, yIn, 34, COSMOS.muted, 'mono', 'right'),
        );
      }

      // Row 2: Output (y = 135)
      const yOut = 135;
      const outPts = quadArcPts([-490, yOut], [210, yOut], 32);
      nodes.push(
        txt('GENERATED OUTPUT', -860, yOut - 48, 26, ROLE.output, 'mono', 'left'),
        txt(
          cV > 0.2 ? '180 tokens' : 'Output tokens',
          -860,
          yOut + 6,
          40,
          COSMOS.ink,
          'mono',
          'left',
        ),
        beamWithPhotons(outPts, ROLE.output, (p + 0.4) % 1, {
          width: 4.0,
          glow: 10,
          photonCount: 2,
          alpha: 0.45 + 0.55 * rV,
        }),
        txt(`$${standard.output.toFixed(2)} / 1M`, -110, yOut - 56, 34, ROLE.output, 'mono').glow(
          6,
          ROLE.output,
        ),
        txt('6x input rate', -110, yOut + 46, 26, ROLE.output, 'mono'),
      );

      // Output charge bar (same dollar scale: max = $0.00450 -> 415px, so output = 3/5 = 0.6)
      if (ch > 0.02) {
        const outFrac = (outChargeMicro / inChargeMicro) * ch;
        nodes.push(
          glowBar(245, yOut, 415, 34, outFrac, { fill: ROLE.output, glow: 10 }),
          txt(usd(outChargeMicro * ch, 5), 860, yOut, 34, ROLE.output, 'mono', 'right').glow(
            7,
            ROLE.output,
          ),
          txt('180 x $15.00 / 10^6', 245, yOut + 56, 26, ROLE.output, 'mono', 'left').opacity(ch),
        );
      } else {
        nodes.push(
          glowBar(245, yOut, 415, 34, 0, { fill: ROLE.output, border: '#4e2f44', glow: 0 }),
          txt('?', 860, yOut, 34, COSMOS.muted, 'mono', 'right'),
        );
      }

      // Bottom left rule & question/conclusion
      nodes.push(
        txt('price = tokens x rate / 1,000,000', -860, 355, 28, COSMOS.muted, 'mono', 'left'),
      );

      if (tot > 0.3) {
        nodes.push(
          txt(
            `10x volume beats 6x rate  ·  ${usd(coldMicro, 5)} full precision`,
            -860,
            420,
            28,
            ROLE.cached,
            'sans',
            'left',
          ).opacity(tot),
        );
      } else if (cV > 0.4) {
        nodes.push(
          txt(
            '10x more input tokens vs 6x higher output rate  ·  Which costs more?',
            -860,
            420,
            28,
            ROLE.cached,
            'sans',
            'left',
          ).glow(5, ROLE.cached),
        );
      }

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, canvas);
  driftValue(s, c, pulseT, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('dated-rate-card', () => {
    const t = c.cue('dated-rate-card').start;
    s.play(rateReveal.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('input-output-counts', () => {
    const t = c.cue('input-output-counts').start;
    s.play(countReveal.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('multiply-rates', () => {
    const t = c.cue('multiply-rates').start;
    s.play(chargeProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.show('one-answer-total', totalEq);
  c.on('one-answer-total', () => {
    const t = c.cue('one-answer-total').start;
    s.play(totalReveal.to(1, { duration: clampDur(c, t, 0.35) }));
  });
}
