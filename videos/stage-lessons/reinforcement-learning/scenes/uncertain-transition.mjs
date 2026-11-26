// Scene 6: uncertain-transition - "When the requester walks away"
// Left: 100 luminous probability-mass orbs (10x10 constellation) flipping emerald <-> rose as p changes.
// Right: Live expected-return arithmetic, glowing MathJax law E[Ask] = 59 - 113 p, and glowing
//        return ruler with Review 54 benchmark and strictly withheld Ask marker until prediction reveal.
import { fadeIn, linear } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  evidenceValue,
  glowTex,
  guardedDynamic,
  heroTitle,
  indifferenceProbability,
  playCue,
  returns,
  rule,
  safeDur,
  txt,
} from '../parts.mjs';
import { drawReturnRuler, drawRiskConstellation, modelMix } from '../desk.mjs';

export default function uncertainTransition(s, c) {
  const title = heroTitle(['When the requester', 'walks away'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.approve,
  });

  const p = s.value(0); // abandonment percentage in [0, 25]
  const showKey = s.value(0);
  const showReview = s.value(0);
  const showMarker = s.value(0);
  const showRegions = s.value(0);

  // Arithmetic readout stage:
  // 0: verified reply +59
  // 1: + leave -4 - 50
  // 2: + leave -54
  // 3: weighted mix 0.75*59 + 0.25*(-54)
  // 4: swing (+59 vs -54, +113 per 100)
  // 5: 5-point lead (Ask 59 vs Review 54)
  // 6: equation mode (glowTex shown)
  const arithStage = s.value(0);

  // Bottom verdict/prompt stage:
  // 0: key note, 1: predict question, 2: verdict (Review 54), 3: hidden during sweep,
  // 4: gain (+1.13), 5: tie (4.42%), 6: regions verdict
  const footStage = s.value(0);

  const eqLaw = glowTex('\\mathbb{E}[\\text{Ask}] = 59 - 113\\,p', {
    x: 435,
    y: -145,
    size: 46,
    color: ROLE.evidence,
    glow: 8,
  });

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const nodes = [];
      const pv = p.value;
      const as = Math.round(arithStage.value);
      const fs = Math.round(footStage.value);

      // Left: 100-orb probability constellation
      nodes.push(
        txt('Chance after asking for proof', -465, -265, 30, ROLE.state, 'sans', 'center').opacity(
          alpha,
        ),
        ...drawRiskConstellation(pv, { cx: -465, cy: 40, spacing: 52, orbRadius: 14, alpha }),
        rule(-65, -280, -65, 420, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      );

      // Right top: Expected return title + dynamic arithmetic stage (zero overlap!)
      const rx = 435;
      nodes.push(
        txt('Expected return at the desk', rx, -340, 32, COSMOS.ink, 'serif', 'center').opacity(
          alpha,
        ),
      );

      if (as === 0) {
        nodes.push(
          txt(`Verified reply: +${returns.evidence}`, rx, -170, 40, ROLE.evidence, 'mono', 'center')
            .glow(6, ROLE.evidence)
            .opacity(alpha),
        );
      } else if (as === 1) {
        nodes.push(
          txt(
            `Verified reply: +${returns.evidence}`,
            rx,
            -205,
            36,
            ROLE.evidence,
            'mono',
            'center',
          ).opacity(alpha),
          txt('Leave: -4 - 50', rx, -135, 38, ROLE.approve, 'mono', 'center')
            .glow(6, ROLE.approve)
            .opacity(alpha),
        );
      } else if (as === 2) {
        nodes.push(
          txt(
            `Verified reply: +${returns.evidence}`,
            rx,
            -205,
            36,
            ROLE.evidence,
            'mono',
            'center',
          ).opacity(alpha),
          txt('Leave: -54', rx, -135, 40, ROLE.approve, 'mono', 'center')
            .glow(7, ROLE.approve)
            .opacity(alpha),
        );
      } else if (as === 3) {
        nodes.push(
          txt(modelMix(25), rx, -195, 34, ROLE.gold, 'mono', 'center')
            .glow(6, ROLE.gold)
            .opacity(alpha),
          txt(
            'Weighted mean across possible outcomes',
            rx,
            -130,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (as === 4) {
        nodes.push(
          txt('Reply +59   vs   Leave -54', rx, -200, 36, COSMOS.ink, 'mono', 'center').opacity(
            alpha,
          ),
          txt(
            'Each 1% flip changes mean by 1.13',
            rx,
            -135,
            28,
            ROLE.evidence,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (as === 5) {
        nodes.push(
          txt('Ask 59   vs   Review 54', rx, -200, 38, ROLE.gold, 'mono', 'center').opacity(alpha),
          txt('5-point lead at p = 0%', rx, -135, 28, ROLE.evidence, 'sans', 'center').opacity(
            alpha,
          ),
        );
      } else if (as === 6) {
        nodes.push(
          txt(
            'p = fraction of requesters who leave',
            rx,
            -72,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      // Right middle: Glowing Expected Return Ruler (strictly withholds Ask marker until mean!)
      nodes.push(
        ...drawReturnRuler(pv, {
          x0: 40,
          x1: 830,
          y: 165,
          min: 27,
          max: 63,
          ticks: [30, 40, 50, 60],
          showReview: showReview.value > 0.5,
          showMarker: showMarker.value > 0.5,
          showRegions: showRegions.value > 0.5,
          alpha,
        }),
      );

      // Bottom status / prediction / verdict line (strictly one message at a time)
      if (fs === 0 && showKey.value > 0.5) {
        nodes.push(
          txt(
            'Each glowing orb represents 1% of possible outcomes.',
            rx,
            390,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(showKey.value * alpha),
        );
      } else if (fs === 1) {
        nodes.push(
          txt('Ask for proof or send to review?', rx, 390, 36, ROLE.gold, 'serif', 'center')
            .glow(8, ROLE.gold)
            .opacity(alpha),
        );
      } else if (fs === 2) {
        nodes.push(
          txt('Send to review · 54 beats 30.75', rx, 390, 36, ROLE.review, 'serif', 'center')
            .glow(8, ROLE.review)
            .opacity(alpha),
        );
      } else if (fs === 4) {
        nodes.push(
          txt(
            '+1.13 mean return per 1% fewer abandonments',
            rx,
            390,
            28,
            ROLE.evidence,
            'mono',
            'center',
          ).opacity(alpha),
        );
      } else if (fs === 5) {
        nodes.push(
          txt('Break-even tie at p = 5 / 113 ≈ 4.42%', rx, 390, 34, ROLE.gold, 'mono', 'center')
            .glow(8, ROLE.gold)
            .opacity(alpha),
        );
      } else if (fs === 6) {
        nodes.push(
          txt(
            'p < 4.42%: Ask for proof   ·   p > 4.42%: Review',
            rx,
            390,
            30,
            COSMOS.ink,
            'sans',
            'center',
          )
            .glow(5, ROLE.state)
            .opacity(alpha),
        );
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.approve, ROLE.evidence), title, layer);

  playCue(s, c, 'certain', (d) => s.play(showKey.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'review-line', (d) => s.play(showReview.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'quarter', (d) => s.play(p.to(25, { duration: d })), { after: true, dur: 1.0 });
  playCue(s, c, 'costs', (d) => s.play(arithStage.to(1, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'abandoned', (d) => s.play(arithStage.to(2, { duration: d })), {
    after: true,
    dur: 0.25,
  });
  playCue(s, c, 'weigh', (d) => s.play(arithStage.to(3, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'predict', (d) => s.play(footStage.to(1, { duration: d })), { dur: 0.3 });

  // Prediction reveal (strictly after cues!)
  playCue(s, c, 'mean', (d) => s.play(showMarker.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'winner', (d) => s.play(footStage.to(2, { duration: d })), {
    after: true,
    dur: 0.3,
  });

  // Sweep p smoothly from 25% -> 0%
  c.on('sweep', () => {
    const dur = safeDur(c, c.cue('sweep').start, c.cue('gain').start - c.cue('sweep').start);
    s.play(
      arithStage.to(4, { duration: 0.2 }),
      footStage.to(3, { duration: 0.2 }),
      p.to(0, { duration: dur, ease: linear }),
    );
  });
  playCue(s, c, 'gain', (d) => s.play(footStage.to(4, { duration: d })), {
    after: true,
    dur: 0.25,
  });
  playCue(s, c, 'lead', (d) => s.play(arithStage.to(5, { duration: d })), {
    after: true,
    dur: 0.25,
  });
  playCue(s, c, 'equation', (d) => s.play(arithStage.to(6, { duration: Math.min(0.08, d) })), {
    dur: 0.08,
  });
  c.on(
    'equation',
    () => {
      s.add(eqLaw);
      s.play(fadeIn(eqLaw, { duration: 0.3 }));
    },
    0.16,
  );

  playCue(
    s,
    c,
    'tie',
    (d) =>
      s.play(
        p.to(indifferenceProbability * 100, { duration: d }),
        footStage.to(5, { duration: 0.25 }),
      ),
    { after: true, dur: 0.85 },
  );
  playCue(
    s,
    c,
    'regions',
    (d) => s.play(showRegions.to(1, { duration: d }), footStage.to(6, { duration: 0.25 })),
    { after: true, dur: 0.4 },
  );
}
