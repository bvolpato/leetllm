// Scene 11: pair-supervision - "A positive label comes from a stated relation"
// Pure Cinema: glowing concentric semantic Venn rings (animals > dogs) with a traveling exemplar orb
// exposing directional entailment, beside visual Sentence-BERT vs Supervised SimCSE schematics.
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowArc,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  playOn,
  rule,
  txt,
} from '../parts.mjs';

export default function pairSupervision(s, c) {
  const hiEntail = s.value(0);
  const reverseT = s.value(0);
  const showSbert = s.value(0);
  const showSimcse = s.value(0);

  const title = heroTitle(['A positive label comes from', 'a stated directional relation'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.positive,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const he = hiEntail.value;
    const rt = reverseT.value;
    const sb = showSbert.value;
    const sc = showSimcse.value;
    const nodes = [];

    // Left: Concentric semantic Venn sets (animals > dogs)
    const cx = -450;
    const cy = 60;
    const rOuter = 275;
    const dogCx = cx - 72;
    const dogCy = cy + 42;
    const rInner = 128;

    nodes.push(
      glowRing(cx, cy, rOuter, ROLE.unrelated, { width: 3.2, glow: 8, fillAlpha: 0.08 }),
      glowRing(dogCx, dogCy, rInner, ROLE.positive, {
        width: he > 0.3 && rt < 0.5 ? 4.4 : 3.2,
        glow: he > 0.3 && rt < 0.5 ? 13 : 8,
        fillAlpha: 0.16,
      }),
      txt('animals', cx, cy - rOuter + 52, 34, ROLE.unrelated, 'serif', 'center'),
      txt('dogs', dogCx, dogCy + rInner - 44, 32, ROLE.positive, 'serif', 'center'),
    );

    // Traveling gold exemplar orb: inside dogs -> outside into animals\dogs (horse!)
    const startPt = [dogCx, dogCy - 14];
    const endPt = [cx + 150, cy + 16];
    const orbX = startPt[0] + (endPt[0] - startPt[0]) * rt;
    const orbY = startPt[1] + (endPt[1] - startPt[1]) * rt - 38 * Math.sin(Math.PI * rt);
    if (rt > 0.05) {
      nodes.push(
        glowArc(startPt, endPt, -55, { color: ROLE.competitor, width: 3, glow: 6, opacity: rt }),
      );
    }
    nodes.push(
      glowDot(orbX, orbY, {
        radius: 12,
        color: rt > 0.5 ? ROLE.competitor : ROLE.focus,
        glow: 15,
      }),
    );
    if (rt < 0.08) {
      nodes.push(
        txt('puppy', orbX, orbY - 36, 28, ROLE.focus, 'mono', 'center').opacity(1 - rt / 0.08),
      );
    } else if (rt > 0.92) {
      nodes.push(
        txt('horse', orbX, orbY - 36, 28, ROLE.competitor, 'mono', 'center').opacity(
          (rt - 0.92) / 0.08,
        ),
      );
    }

    // Directional relation header above right column (mutually exclusive A8 true)
    nodes.push(rule(25, -340, 25, 420, COSMOS.rule, 1.8).opacity(0.55));
    const rx = 465;
    if (rt < 0.5) {
      nodes.push(
        txt('puppy running  →  animal running', rx, -275, 34, ROLE.positive, 'sans', 'center')
          .glow(7, ROLE.positive)
          .opacity(1 - rt * 2),
        txt('ENTAILMENT (VALID POSITIVE)', rx, -225, 26, COSMOS.muted, 'mono', 'center').opacity(
          1 - rt * 2,
        ),
      );
    } else {
      const op = (rt - 0.5) * 2;
      nodes.push(
        txt('animal running  ↛  puppy running', rx, -275, 34, ROLE.competitor, 'sans', 'center')
          .glow(7, ROLE.competitor)
          .opacity(op),
        txt('REVERSE FAILS (COULD BE A HORSE)', rx, -225, 26, ROLE.focus, 'mono', 'center').opacity(
          op,
        ),
      );
    }

    // Right middle: Sentence-BERT Siamese NLI schematic (vector strips u, v, |u - v|)
    const sbY = -45;
    const sbOp = 0.28 + 0.72 * sb;
    nodes.push(
      txt('1. Original Sentence-BERT (NLI)', 105, sbY - 82, 30, ROLE.anchor, 'mono', 'left')
        .glow(sb > 0.4 ? 6 : 0, ROLE.anchor)
        .opacity(sbOp),
      lumBar(225, sbY, 170, 56, { color: ROLE.anchor, fillAlpha: 0.24, glow: 7, opacity: sbOp }),
      txt('u', 225, sbY, 32, COSMOS.ink, 'mono', 'center').opacity(sbOp),
      lumBar(420, sbY, 170, 56, { color: ROLE.unrelated, fillAlpha: 0.24, glow: 7, opacity: sbOp }),
      txt('v', 420, sbY, 32, COSMOS.ink, 'mono', 'center').opacity(sbOp),
      lumBar(630, sbY, 200, 56, { color: ROLE.violet, fillAlpha: 0.26, glow: 8, opacity: sbOp }),
      txt('|u − v|', 630, sbY, 30, COSMOS.ink, 'mono', 'center').opacity(sbOp),
      txt(
        'concat [u, v, |u − v|]  ->  3-way NLI classifier',
        rx,
        sbY + 62,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(sbOp),
    );

    // Right bottom: Supervised SimCSE contrastive pull/push diagram
    const scY = 235;
    const scOp = 0.28 + 0.72 * sc;
    nodes.push(
      rule(105, 85, 835, 85, COSMOS.rule, 1.4).opacity(0.5),
      txt('2. Supervised SimCSE (Contrastive)', 105, scY - 92, 30, ROLE.positive, 'mono', 'left')
        .glow(sc > 0.4 ? 6 : 0, ROLE.positive)
        .opacity(scOp),
      // Anchor orb in middle, entailment pulled in (green), contradiction pushed out (rose)
      glowRing(rx, scY, 30, ROLE.anchor, { width: 3, glow: 9, opacity: scOp }),
      txt('q', rx, scY, 30, COSMOS.ink, 'mono', 'center').opacity(scOp),
      arrow([rx - 185, scY], [rx - 44, scY], { stroke: ROLE.positive, width: 4.5, tip: 15 })
        .glow(8, ROLE.positive)
        .opacity(scOp),
      txt('entailment (+)', rx - 210, scY - 36, 28, ROLE.positive, 'sans', 'center').opacity(scOp),
      arrow([rx + 44, scY], [rx + 185, scY], { stroke: ROLE.competitor, width: 4.5, tip: 15 })
        .glow(8, ROLE.competitor)
        .opacity(scOp),
      txt('contradiction (−)', rx + 210, scY - 36, 28, ROLE.competitor, 'sans', 'center').opacity(
        scOp,
      ),
      txt(
        'Encode each document once -> reuse vector for many queries',
        rx,
        scY + 95,
        26,
        ROLE.focus,
        'sans',
        'center',
      ).opacity(scOp),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.positive, ROLE.unrelated), title, stageLayer);

  playOn(s, c, 'cl-pair-supervision-entail', (d) => hiEntail.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-pair-supervision-reverse', (d) => reverseT.to(1, { duration: d }), 1.25);
  playOn(s, c, 'cl-pair-supervision-sbert', (d) => showSbert.to(1, { duration: d }), 0.55);
  playOn(s, c, 'cl-pair-supervision-simcse', (d) => showSimcse.to(1, { duration: d }), 0.55);
}
