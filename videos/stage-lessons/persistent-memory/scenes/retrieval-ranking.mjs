// Scene 5: retrieval-ranking - Which replay goes into the prompt?
// Live multi-factor stacked score ruler computed directly from RANKING (0.50 sim + 0.30 recency +
// 0.20 importance): similarity gives older retry a small lead (0.475 vs 0.450) -> half-life
// prediction pause! -> recency reverses the lead (0.272 vs 0.075) -> importance yields 0.882 vs
// 0.610 -> unbounded log(1+1e6) explodes to 2.76 off-scale!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  RANKING,
  ROLE,
  UNBOUNDED_FREQ,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function retrievalRanking(s, c) {
  const pulse = s.value(0);
  const simOn = s.value(0);
  const halfLifeNote = s.value(0);
  const ageReveal = s.value(0);
  const impOn = s.value(0);
  const totalOn = s.value(0);
  const freqBlowup = s.value(0);

  const header = cinemaHeader(
    'MULTI-FACTOR RETRIEVAL SCORING',
    'Which replay goes',
    'into the prompt?',
    {
      accent: ROLE.score,
      size: 50,
    },
  );

  const stageAura = aura(200, 40, 620, '#ffd1661c', '#5ce1e61a');

  const scoreEq = glowTex(
    String.raw`S = 0.50\,\text{sim} + 0.30\cdot 2^{-\Delta t / 168\text{h}} + 0.20\,\text{imp}`,
    { x: 250, y: -340, size: 32, color: ROLE.score, glow: 7 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const sm = simOn.value;
      const hl = halfLifeNote.value;
      const ag = ageReveal.value;
      const im = impOn.value;
      const tt = totalOn.value;
      const fr = freqBlowup.value;
      const nodes = [];

      // Score ruler: 0.0 -> 1.0 across x in [-430..+570] (scale = 1000 px / unit)
      const x0 = -430;
      const x1 = 570;
      const scale = x1 - x0;
      const ys = [-85, 75];

      nodes.push(
        txt(
          'BLUE: SIM (0.5)   ·   EMERALD: RECENCY (0.3)   ·   GOLD: IMPORTANCE (0.2)',
          -840,
          -185,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
        line([x0, -145], [x0, 265], { stroke: '#344770', width: 2.4 }),
        line([x1, -145], [x1, 265], { stroke: ROLE.score, width: 2.4, dash: [6, 6] }),
        txt('0.0', x0, 295, 26, COSMOS.dim, 'mono', 'center'),
        txt('0.5', x0 + scale * 0.5, 295, 26, COSMOS.dim, 'mono', 'center'),
        txt('1.0 CAP', x1, 295, 26, ROLE.score, 'mono', 'center'),
      );

      RANKING.forEach((cand, i) => {
        const y = ys[i];
        const wSim = cand.contributions.similarity * scale * (0.2 + sm * 0.8);
        const wRec = cand.contributions.recency * scale * ag;
        const wImp = cand.contributions.importance * scale * im;
        const isWinner = i === 0;

        nodes.push(
          txt(
            isWinner ? 'YESTERDAY REPLAY' : '2-WK OLD RETRY',
            -840,
            y - 14,
            26,
            isWinner && ag > 0.35 ? ROLE.ok : COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            isWinner ? 'sim 0.90 · 24h · imp 0.8' : 'sim 0.95 · 336h · imp 0.3',
            -840,
            y + 24,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );

        // Similarity segment (blue)
        nodes.push(
          rect(Math.max(8, wSim), 56, {
            fill: ROLE.episodic,
            stroke: '#93c5fd',
            width: 1.5,
            radius: 7,
          })
            .at(x0 + wSim * 0.5, y)
            .opacity(0.9),
        );

        // Recency segment (emerald): strictly withheld until `rank-age`!
        if (wRec > 4) {
          nodes.push(
            rect(wRec, 56, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 7 })
              .at(x0 + wSim + wRec * 0.5, y)
              .glow(isWinner ? 9 : 4, ROLE.ok)
              .opacity(0.9),
          );
        }

        // Importance segment (gold)
        if (wImp > 4) {
          nodes.push(
            rect(wImp, 56, { fill: ROLE.score, stroke: '#ffffff', width: 1.5, radius: 7 })
              .at(x0 + wSim + wRec + wImp * 0.5, y)
              .glow(isWinner ? 9 : 4, ROLE.score)
              .opacity(0.9),
          );
        }

        // Right numeric score label
        const endX = x0 + wSim + wRec + wImp + 18;
        const curVal =
          cand.contributions.similarity * (0.2 + sm * 0.8) +
          cand.contributions.recency * ag +
          cand.contributions.importance * im;
        nodes.push(
          txt(
            tt > 0.35 ? cand.score.toFixed(3) : curVal.toFixed(3),
            endX,
            y,
            28,
            isWinner && tt > 0.35 ? ROLE.ok : COSMOS.ink,
            'mono',
            'left',
          ),
        );
      });

      // Row 3: Unbounded log-frequency blowup (2.76 > 1.0 cap!)
      if (fr > 0.05) {
        const yF = 205;
        const blowW = 1140 * fr; // visibly crashes PAST the 1.0 CAP line!
        nodes.push(
          txt('IRRELEVANT (1M READS)', -840, yF, 26, ROLE.fail, 'mono', 'left').opacity(fr),
          rect(Math.max(12, blowW), 50, { fill: ROLE.fail, stroke: '#ffffff', width: 2, radius: 7 })
            .at(x0 + blowW * 0.5, yF)
            .glow(12, ROLE.fail)
            .opacity(0.9 * fr),
          txt(
            `0.2 · ln(1 + 10⁶) ≈ ${UNBOUNDED_FREQ.toFixed(2)}  (BREAKS [0, 1] SCALE!)`,
            x0 + 24,
            yF,
            26,
            '#070910',
            'mono',
            'left',
          ).opacity(fr),
        );
      }

      // Bottom prediction prompt / result banner
      if (hl > 0.3 && ag < 0.05) {
        nodes.push(
          txt(
            'Half-life = 1 week (24h vs 336h). Which bar will be longer after adding age?',
            0,
            360,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (fr > 0.35) {
        nodes.push(
          txt(
            'CAP / NORMALIZE EVERY TERM TO [0, 1] SO FREQUENCY CANNOT DROWN RELEVANCE',
            0,
            360,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).glow(7, ROLE.fail),
        );
      } else if (tt > 0.35) {
        nodes.push(
          txt(
            'YESTERDAY REPLAY WINS: 0.882 vs 0.610 · LOOK UP LIVE BRANCHES DIRECTLY',
            0,
            360,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).glow(7, ROLE.ok),
        );
      } else if (ag > 0.35) {
        nodes.push(
          txt(
            'YESTERDAY TAKES THE LEAD: 24h AGE TERM IS >3× LONGER THAN 336h (0.075)',
            0,
            360,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).glow(6, ROLE.ok),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, scoreEq, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('rank-sim', () => {
    s.play(simOn.to(1, { duration: clampDur(c, c.cue('rank-sim').start, 0.4) }));
  });
  c.on('rank-half-life', () => {
    s.play(halfLifeNote.to(1, { duration: clampDur(c, c.cue('rank-half-life').start, 0.35) }));
  });
  // Strict prediction withholding!
  c.after('rank-age', () => {
    s.play(ageReveal.to(1, { duration: clampDur(c, c.cue('rank-age').end, 0.45) }));
  });
  c.on('rank-importance', () => {
    s.play(impOn.to(1, { duration: clampDur(c, c.cue('rank-importance').start, 0.4) }));
  });
  c.after('rank-total', () => {
    s.play(totalOn.to(1, { duration: clampDur(c, c.cue('rank-total').end, 0.35) }));
  });
  c.on('rank-frequency', () => {
    s.play(freqBlowup.to(1, { duration: clampDur(c, c.cue('rank-frequency').start, 0.5) }));
  });
}
