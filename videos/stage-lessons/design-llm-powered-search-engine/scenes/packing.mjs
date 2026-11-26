// Scene 11: packing - A word budget for Alice's two sources
// Prediction beat: 18-word budget fits 15w exception (3 free), overhangs 12w policy.
// Strictly withholds "+9 more words" until `c.after('packing-answer')`, then expands budget 18 -> 27.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PACK_EXCEPTION_WORDS,
  PACK_EXTRA_WORDS,
  PACK_INITIAL_BUDGET,
  PACK_POLICY_WORDS,
  PACK_TOTAL_WORDS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function packing(s, c) {
  const pulse = s.value(0);
  const budgetOn = s.value(0);
  const excProg = s.value(0);
  const polProg = s.value(0);
  const askOn = s.value(0);
  const answerOn = s.value(0);
  const expandProg = s.value(0);

  const header = cinemaHeader('EVIDENCE PACKING', 'Fit whole passages', 'into one budget', {
    accent: ROLE.budget,
    size: 46,
  });

  const stageAura = aura(0, 40, 720, '#ffd1661c', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const ex = excProg.value;
      const pl = polProg.value;
      const ask = askOn.value > 0.5;
      const ans = answerOn.value > 0.5;
      const exp = expandProg.value;

      const curBudget = Math.round(
        PACK_INITIAL_BUDGET + (PACK_TOTAL_WORDS - PACK_INITIAL_BUDGET) * exp,
      );
      const excFits = ex > 0.5;
      const polFits = pl > 0.5 && curBudget >= PACK_TOTAL_WORDS;
      const packedWords = (excFits ? PACK_EXCEPTION_WORDS : 0) + (polFits ? PACK_POLICY_WORDS : 0);

      const x0 = -780;
      const x1 = 780;
      const mapW = (w) => x0 + (w / 30) * (x1 - x0);
      const trackY = 25;
      const trackH = 128;

      const nodes = [
        txt('WHOLE PASSAGES IN RETRIEVAL ORDER', -780, -215, 28, COSMOS.ink, 'mono', 'left'),
        txt('UNIT: REGEX WORDS', 780, -215, 26, COSMOS.muted, 'mono', 'right'),

        // Main packing rail (0..30 words)
        rect(x1 - x0, trackH, { fill: '#0b1223', stroke: '#324670', width: 2.5, radius: 12 }).at(
          0,
          trackY,
        ),
      ];

      // Exception block (0..15 words)
      if (ex > 0.05) {
        const w = (mapW(PACK_EXCEPTION_WORDS) - x0 - 10) * ex;
        nodes.push(
          rect(Math.max(12, w), 86, {
            fill: ROLE.exception,
            stroke: '#a7f3d0',
            width: 2,
            radius: 9,
          })
            .at(x0 + 5 + w * 0.5, trackY)
            .glow(9, ROLE.exception)
            .opacity(0.92),
        );
        if (ex > 0.75) {
          nodes.push(
            txt(
              `exception@1  ·  ${PACK_EXCEPTION_WORDS} words`,
              x0 + 26,
              trackY,
              30,
              '#070910',
              'mono',
              'left',
            ),
          );
        }
      }

      // Policy block (15..27 words) - hollow outline until budget reaches 27, then locks solid blue!
      if (pl > 0.05) {
        const sx = mapW(PACK_EXCEPTION_WORDS) + 4;
        const fullW = mapW(PACK_TOTAL_WORDS) - sx - 6;
        const w = fullW * pl;
        nodes.push(
          rect(Math.max(12, w), 86, {
            fill: polFits ? ROLE.policy : '#0d1629',
            stroke: ROLE.policy,
            width: 3,
            dash: polFits ? undefined : [8, 6],
            radius: 9,
          })
            .at(sx + w * 0.5, trackY)
            .glow(polFits ? 10 : 4, ROLE.policy)
            .opacity(0.94),
        );
        if (pl > 0.75) {
          nodes.push(
            txt(
              `policy@2  ·  ${PACK_POLICY_WORDS} words`,
              sx + 20,
              trackY,
              30,
              polFits ? '#070910' : ROLE.policy,
              'mono',
              'left',
            ),
          );
        }
      }

      // Ruler ticks
      for (const n of [0, 15, 18, 27, 30]) {
        const tx = mapW(n);
        nodes.push(
          line([tx, trackY + 72], [tx, trackY + 90], { stroke: '#4d6599', width: 2.5 }),
          txt(String(n), tx, trackY + 124, 26, COSMOS.muted, 'mono', 'center'),
        );
      }

      // Movable gold budget marker (18 -> 27), split above & below track so it never crosses block text
      const bx = mapW(curBudget);
      nodes.push(
        line([bx, trackY - 102], [bx, trackY - 64], { stroke: ROLE.budget, width: 5 }).glow(
          10,
          ROLE.budget,
        ),
        line([bx, trackY + 64], [bx, trackY + 90], { stroke: ROLE.budget, width: 5 }).glow(
          10,
          ROLE.budget,
        ),
        glowDot(bx, trackY - 102, { radius: 6, color: ROLE.budget, glow: 10 }),
        txt(`BUDGET: ${curBudget} WORDS`, bx, trackY - 134, 32, ROLE.budget, 'mono', 'center')
          .glow(7, ROLE.budget)
          .opacity(0.5 + 0.5 * budgetOn.value),
      );

      // Live packed counter
      nodes.push(
        txt(
          `${packedWords} of ${curBudget} words packed`,
          -780,
          232,
          34,
          COSMOS.ink,
          'mono',
          'left',
        ),
      );
      if (excFits && !polFits) {
        nodes.push(
          txt(`${curBudget - packedWords} spaces free`, 780, 232, 30, ROLE.budget, 'mono', 'right'),
        );
      }

      // Bottom prediction question -> answer -> final fit takeaway
      if (polFits) {
        nodes.push(
          txt(
            '27-word budget fits BOTH whole passages; real prompts use the model tokenizer.',
            -780,
            356,
            32,
            ROLE.ok,
            'serif',
            'left',
          ).glow(7, ROLE.ok),
        );
      } else if (ans) {
        nodes.push(
          txt(
            `+${PACK_EXTRA_WORDS} MORE WORDS NEEDED  (${PACK_POLICY_WORDS} needed - ${PACK_INITIAL_BUDGET - PACK_EXCEPTION_WORDS} free = ${PACK_EXTRA_WORDS})`,
            -780,
            356,
            32,
            ROLE.budget,
            'mono',
            'left',
          ).glow(8, ROLE.budget),
        );
      } else if (ask) {
        nodes.push(
          txt(
            'How many more words would let us pack both passages?',
            -780,
            356,
            36,
            ROLE.budget,
            'serif',
            'left',
          ).glow(7, ROLE.budget),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('packing-budget', () => {
    s.play(budgetOn.to(1, { duration: clampDur(c, c.cue('packing-budget').start, 0.3) }));
  });
  c.on('packing-exception', () => {
    s.play(excProg.to(1, { duration: clampDur(c, c.cue('packing-exception').start, 0.7) }));
  });
  c.on('packing-policy', () => {
    s.play(polProg.to(1, { duration: clampDur(c, c.cue('packing-policy').start, 0.7) }));
  });
  c.on('packing-ask', () => {
    s.play(askOn.to(1, { duration: clampDur(c, c.cue('packing-ask').start, 0.25) }));
  });
  // Strict prediction withholding: reveal "+9 more words" ONLY after "Nine more words" finishes.
  c.after('packing-answer', () => {
    s.play(answerOn.to(1, { duration: clampDur(c, c.cue('packing-answer').end, 0.25) }));
  });
  c.on('packing-expand', () => {
    s.play(expandProg.to(1, { duration: clampDur(c, c.cue('packing-expand').start, 0.75) }));
  });
}
