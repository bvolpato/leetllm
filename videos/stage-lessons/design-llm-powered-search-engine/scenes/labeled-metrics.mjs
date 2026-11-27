// Scene 27: labeled-metrics - Measure retrieval identity coverage against actual labels
// Real `searchMetrics`: Beat 0 deduplicates ['Policy','Policy','FAQ'] -> ['Policy','FAQ'];
// Beat 1 computes binary DCG / Ideal DCG with MathJax formula;
// Beat 2 shows Recall 0.5000 / nDCG 0.6131 -> repairs to ['Policy','Exception'] = 1.0000 / 1.0000.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  METRICS_FULL,
  METRICS_HALF,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowMeter,
  glowTex,
  guardedDynamic,
  mix,
  txt,
} from '../parts.mjs';

export default function labeledMetrics(s, c) {
  const startOn = s.value(0);
  const dedupProg = s.value(0);
  const beat1On = s.value(0);
  const formulaOn = s.value(0);
  const beat2On = s.value(0);
  const halfOn = s.value(0);
  const bothOn = s.value(0);

  const header = cinemaHeader('RETRIEVAL METRICS', 'Measure deduplicated', 'Recall and nDCG', {
    accent: ROLE.ok,
    size: 46,
  });

  const stageAura = aura(0, 50, 700, '#6ee7b71a', '#ffd16618');

  const ndcgEq = glowTex(
    '\\mathrm{nDCG}@K = \\frac{\\sum_{i=1}^{K} \\frac{\\mathrm{rel}_i}{\\log_2(i+1)}}{\\mathrm{IDCG}@K}',
    { x: 430, y: -375, size: 36, color: ROLE.focus, glow: 7 },
  ).hide();

  const view = guardedDynamic(
    () => 1,
    () => {
      const dd = dedupProg.value;
      const b1 = beat1On.value > 0.5;
      const fm = formulaOn.value > 0.5;
      const b2 = beat2On.value > 0.5;
      const hf = halfOn.value > 0.5;
      const bt = bothOn.value > 0.5;

      const curMetrics = bt ? METRICS_FULL : METRICS_HALF;
      const curRanked = bt ? ['Policy', 'Exception'] : ['Policy', 'FAQ'];
      const gold = ['Policy', 'Exception'];
      const nodes = [
        txt(
          'GOLD AUTHORIZED SET:  { Policy, Exception }   (K = 2)',
          -855,
          -238,
          28,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(0.65 + 0.35 * startOn.value),
      ];

      if (!b1 && !b2) {
        // Beat 0: First fade out duplicate Policy (0..0.45), THEN slide FAQ left (0.55..1.0) so borders never cross!
        const slideT = Math.max(0, Math.min(1, (dd - 0.55) / 0.45));
        const faqX = mix(540, 0, slideT);
        nodes.push(
          txt(
            'RAW RANKED CANDIDATES -> DEDUPLICATE FIRST',
            -855,
            -152,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),

          rect(440, 128, { fill: '#0d1924', stroke: ROLE.ok, width: 2.8, radius: 14 })
            .at(-540, -15)
            .glow(8, ROLE.ok),
          txt('Rank 1: Policy', -540, -15, 32, ROLE.ok, 'mono', 'center'),
        );

        if (dd < 0.45) {
          const dupAlpha = Math.max(0, 1 - dd / 0.45);
          nodes.push(
            rect(440, 128, {
              fill: '#131222',
              stroke: ROLE.deny,
              width: 2.8,
              dash: [8, 6],
              radius: 14,
            })
              .at(0, -15)
              .opacity(dupAlpha),
            txt('Duplicate: Policy', 0, -15, 30, ROLE.deny, 'mono', 'center').opacity(dupAlpha),
          );
        }

        nodes.push(
          rect(440, 128, { fill: '#0d1527', stroke: '#4b5f8f', width: 2.4, radius: 14 }).at(
            faqX,
            -15,
          ),
          txt(
            slideT > 0.5 ? 'Rank 2: FAQ' : 'Rank 3: FAQ',
            faqX,
            -15,
            32,
            COSMOS.muted,
            'mono',
            'center',
          ),

          txt(
            'A second copy of Policy earns zero extra hits.',
            -855,
            195,
            32,
            ROLE.focus,
            'serif',
            'left',
          ),
          txt(
            'Empty gold set -> returns N/A (not a failed retrieval).  Nonpositive K is rejected.',
            -855,
            285,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else {
        // Beats 1 & 2: Observed vs Ideal discounted gain + Recall & nDCG readouts
        curRanked.forEach((doc, i) => {
          const x = -440 + i * 880;
          const isGold = gold.includes(doc);
          const col = isGold ? ROLE.ok : COSMOS.dim;
          nodes.push(
            rect(740, 96, { fill: '#0d1626', stroke: col, width: isGold ? 2.8 : 2, radius: 12 })
              .at(x, -145)
              .glow(isGold ? 7 : 0, col),
            txt(
              `Rank ${i + 1}:  ${doc}  (${isGold ? 'relevant = 1' : 'irrelevant = 0'})`,
              x,
              -145,
              28,
              col,
              'mono',
              'center',
            ),
          );
        });

        nodes.push(
          txt('OBSERVED DISCOUNTED GAIN', -855, -30, 26, ROLE.policy, 'mono', 'left'),
          txt('IDEAL DISCOUNTED GAIN', 60, -30, 26, ROLE.ok, 'mono', 'left'),
        );

        for (let i = 0; i < 2; i++) {
          const y = 45 + i * 112;
          const obs = gold.includes(curRanked[i]) ? 1 / Math.log2(i + 2) : 0;
          const idl = 1 / Math.log2(i + 2);
          nodes.push(
            txt(
              `r=${i + 1}: ${obs ? '1' : '0'} / log2(${i + 2}) = ${obs.toFixed(4)}`,
              -855,
              y - 24,
              26,
              ROLE.focus,
              'mono',
              'left',
            ),
            glowMeter(-855, y + 18, 720, 30, obs, { fill: ROLE.policy }),

            txt(
              `r=${i + 1}: 1 / log2(${i + 2}) = ${idl.toFixed(4)}`,
              60,
              y - 24,
              26,
              ROLE.ok,
              'mono',
              'left',
            ),
            glowMeter(60, y + 18, 720, 30, idl, { fill: ROLE.ok }),
          );
        }

        if (b2 && (hf || bt)) {
          nodes.push(
            txt(
              `RECALL@2 = ${curMetrics.recall.toFixed(4)}`,
              -855,
              308,
              38,
              bt ? ROLE.ok : ROLE.focus,
              'mono',
              'left',
            ).glow(8, bt ? ROLE.ok : ROLE.focus),
            txt(
              `nDCG@2 = ${curMetrics.ndcg.toFixed(4)}`,
              60,
              308,
              38,
              bt ? ROLE.ok : ROLE.focus,
              'mono',
              'left',
            ).glow(8, bt ? ROLE.ok : ROLE.focus),
            txt(
              bt
                ? 'Both found -> 1.0 / 1.0. Check synthesis next.'
                : 'Policy + FAQ -> Recall 0.50, nDCG 0.6131',
              -855,
              386,
              28,
              COSMOS.muted,
              'sans',
              'left',
            ),
          );
        } else if (fm) {
          nodes.push(
            txt(`DCG = ${curMetrics.dcg.toFixed(4)}`, -855, 315, 34, ROLE.policy, 'mono', 'left'),
            txt(`Ideal DCG = ${curMetrics.ideal.toFixed(4)}`, 60, 315, 34, ROLE.ok, 'mono', 'left'),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, ndcgEq, view);
  c.on('se-labeled-metrics-0', () => {
    s.play(startOn.to(1, { duration: clampDur(c, c.cue('se-labeled-metrics-0').start, 0.35) }));
  });
  c.on('se-labeled-metrics-dedup', () => {
    s.play(
      dedupProg.to(1, { duration: clampDur(c, c.cue('se-labeled-metrics-dedup').start, 0.75) }),
    );
  });
  c.on('se-labeled-metrics-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-labeled-metrics-1').start, 0.25) }));
  });
  c.show('se-labeled-metrics-1', ndcgEq);
  c.on('se-labeled-metrics-formula', () => {
    s.play(
      formulaOn.to(1, { duration: clampDur(c, c.cue('se-labeled-metrics-formula').start, 0.35) }),
    );
  });
  c.on('se-labeled-metrics-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-labeled-metrics-2').start, 0.25) }));
  });
  c.on('se-labeled-metrics-half', () => {
    s.play(halfOn.to(1, { duration: clampDur(c, c.cue('se-labeled-metrics-half').start, 0.35) }));
  });
  c.on('se-labeled-metrics-both', () => {
    s.play(bothOn.to(1, { duration: clampDur(c, c.cue('se-labeled-metrics-both').start, 0.35) }));
  });
}
