// Scene 14: citation-support - Separate resolution, support, and coverage
// Beat 0: Three distinct verification gates (Resolution, Support, Coverage).
// Beat 1: Word-overlap checker failure: ACCEPTS negation ("NOT required") and REJECTS valid paraphrase!
// Beat 2: Semantic verifiers (NLI, TRUE, FActScore) calibrated against human labels.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function citationSupport(s, c) {
  const beat0On = s.value(0);
  const covOn = s.value(0);
  const beat1On = s.value(0);
  const negOn = s.value(0);
  const accOn = s.value(0);
  const paraOn = s.value(0);
  const beat2On = s.value(0);
  const calOn = s.value(0);

  const header = cinemaHeader(
    'CITATION VERIFICATION',
    'Separate resolution,',
    'support, and coverage',
    {
      accent: ROLE.exception,
      size: 46,
    },
  );

  const stageAura = aura(0, 50, 700, '#6ee7b71a', '#ff6b8b18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const cv = covOn.value > 0.5;
      const b1 = beat1On.value > 0.5;
      const ng = negOn.value > 0.5;
      const ac = accOn.value > 0.5;
      const pr = paraOn.value > 0.5;
      const b2 = beat2On.value > 0.5;
      const cl = calOn.value > 0.5;
      const nodes = [];

      if (b2) {
        // Beat 2: TRUE / FActScore / NLI Judge calibration against human labels
        nodes.push(
          txt(
            'SEMANTIC SUPPORT: NLI MODELS, LLM JUDGES, TRUE & FActScore',
            -855,
            -230,
            26,
            ROLE.query,
            'mono',
            'left',
          ),
        );
        const rows = [
          ['Reverses rule / drops date', 'FALSE ACCEPTANCE', ROLE.deny],
          ['Valid paraphrase of rule', 'FALSE REJECTION', ROLE.caution],
          ['Ambiguous / missing evidence', 'ABSTENTION', ROLE.focus],
        ];
        rows.forEach(([left, right, col], i) => {
          const y = -110 + i * 155;
          nodes.push(
            rect(680, 102, { fill: '#0d1528', stroke: ROLE.policy, width: 2.4, radius: 12 }).at(
              -500,
              y,
            ),
            txt(left, -500, y, 28, COSMOS.ink, 'sans', 'center'),

            beamWithPhotons(quadArcPts([-155, y], [155, y], 0, 14), col, 0, {
              width: 3.2,
              glow: cl ? 9 : 4,
            }),

            rect(680, 102, { fill: '#0d1526', stroke: col, width: cl ? 3.2 : 2.2, radius: 12 })
              .at(500, y)
              .glow(cl ? 9 : 3, col),
            txt(right, 500, y, 28, col, 'mono', 'center'),
          );
        });
        nodes.push(
          txt(
            'Calibrate all three rates against held-out human labels.',
            -855,
            356,
            30,
            ROLE.ok,
            'serif',
            'left',
          ),
        );
      } else if (b1) {
        // Beat 1: Word-overlap checker fails on negation AND paraphrase
        nodes.push(
          rect(1680, 108, { fill: '#0d1629', stroke: ROLE.policy, width: 2.8, radius: 14 }).at(
            0,
            -185,
          ),
          txt('DRAFT CLAIM:', -800, -185, 26, ROLE.policy, 'mono', 'left'),
          txt('"Security approval is required."', -530, -185, 36, COSMOS.ink, 'serif', 'left'),

          // Source A: contradiction with 100% word overlap!
          rect(790, 230, {
            fill: '#131221',
            stroke: ng ? ROLE.deny : ROLE.exception,
            width: 3,
            radius: 14,
          })
            .at(-445, 72)
            .glow(ng ? 9 : 4, ng ? ROLE.deny : ROLE.exception),
          txt(
            'SOURCE A (CONTRADICTION)',
            -805,
            -2,
            26,
            ng ? ROLE.deny : ROLE.exception,
            'mono',
            'left',
          ),
          txt(
            ng ? '"Security approval is NOT required."' : '"Security approval is required."',
            -805,
            72,
            31,
            ng ? ROLE.deny : COSMOS.ink,
            'serif',
            'left',
          ),
          txt(
            ac ? 'WORD CHECKER: ACCEPTS CONTRADICTION!' : 'All 4 claim words still appear',
            -805,
            142,
            26,
            ac ? ROLE.deny : COSMOS.muted,
            'mono',
            'left',
          ),

          // Source B: valid paraphrase with low word overlap!
          rect(790, 230, { fill: '#0d1924', stroke: ROLE.exception, width: 3, radius: 14 })
            .at(445, 72)
            .glow(pr ? 9 : 4, ROLE.exception),
          txt('SOURCE B (VALID PARAPHRASE)', 85, -2, 26, ROLE.exception, 'mono', 'left'),
          txt('"Authorization from the security', 85, 58, 30, COSMOS.ink, 'serif', 'left'),
          txt('team is mandatory."', 85, 102, 30, COSMOS.ink, 'serif', 'left'),
          txt(
            pr ? 'WORD CHECKER: REJECTS VALID SUPPORT!' : 'Same meaning, different vocabulary',
            85,
            150,
            26,
            pr ? ROLE.focus : COSMOS.muted,
            'mono',
            'left',
          ),
        );

        nodes.push(
          txt(
            'Lexical overlap misses negation and breaks on paraphrases.',
            0,
            315,
            32,
            ROLE.focus,
            'serif',
            'center',
          ),
        );
      } else {
        // Beat 0: Three independent questions: Resolution, Support, Coverage
        const cards = [
          {
            title: '1. RESOLUTION',
            desc: 'Does the citation locate a permitted revision and valid span?',
            col: ROLE.policy,
            y: -155,
          },
          {
            title: '2. SUPPORT',
            desc: 'Does that exact span support the claim, quantities, and conditions?',
            col: ROLE.exception,
            y: 25,
          },
          {
            title: '3. COVERAGE',
            desc: 'Do ALL material claims and required exceptions have evidence?',
            col: ROLE.focus,
            y: 205,
          },
        ];
        cards.forEach((item, i) => {
          const glow = i === 2 && cv ? 11 : 5;
          nodes.push(
            rect(1680, 134, {
              fill: '#0d1527',
              stroke: item.col,
              width: i === 2 && cv ? 3.4 : 2.6,
              radius: 14,
            })
              .at(0, item.y)
              .glow(glow, item.col)
              .opacity(0.65 + 0.35 * beat0On.value),
            txt(item.title, -800, item.y, 30, item.col, 'mono', 'left'),
            txt(item.desc, -420, item.y, 30, COSMOS.ink, 'sans', 'left'),
          );
        });
        nodes.push(
          txt(
            'A link to policy@2 can resolve cleanly while the answer still drops exception@1.',
            -840,
            375,
            29,
            ROLE.focus,
            'serif',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  c.on('se-citation-support-0', () => {
    s.play(beat0On.to(1, { duration: clampDur(c, c.cue('se-citation-support-0').start, 0.35) }));
  });
  c.on('se-citation-support-coverage', () => {
    s.play(
      covOn.to(1, { duration: clampDur(c, c.cue('se-citation-support-coverage').start, 0.3) }),
    );
  });
  c.on('se-citation-support-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-citation-support-1').start, 0.25) }));
  });
  c.on('se-citation-support-negation', () => {
    s.play(
      negOn.to(1, { duration: clampDur(c, c.cue('se-citation-support-negation').start, 0.3) }),
    );
  });
  c.on('se-citation-support-acceptance', () => {
    s.play(
      accOn.to(1, { duration: clampDur(c, c.cue('se-citation-support-acceptance').start, 0.3) }),
    );
  });
  c.on('se-citation-support-paraphrase', () => {
    s.play(
      paraOn.to(1, { duration: clampDur(c, c.cue('se-citation-support-paraphrase').start, 0.3) }),
    );
  });
  c.on('se-citation-support-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-citation-support-2').start, 0.25) }));
  });
  c.on('se-citation-support-assessment', () => {
    s.play(
      calOn.to(1, { duration: clampDur(c, c.cue('se-citation-support-assessment').start, 0.35) }),
    );
  });
}
