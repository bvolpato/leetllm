// Scene 5: conditional-mask - What share of the next draw goes to fa?
// Value prefix {"status":", three rows (passed=2, fa=3, chatty=5 -> 10 unit weight cubes).
// On weights-remove, crimson laser crosses out chatty's 5 cubes (denominator 10 -> 5).
// STRICT prediction withholding during Beat 1 hold (3.0s): final 40% / 60% shares stay hidden
// until c.after('weights-result')!
import { group, line, rect } from 'vizmatic/stage';
import {
  COND_ALLOWED,
  COND_PROBS,
  COND_TOKENS,
  COND_WEIGHTS,
  COSMOS,
  ROLE,
  VALUE_PREFIX,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowTex,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function conditionalMask(s, c) {
  const pulse = s.value(0);
  const expOn = s.value(0);
  const removeOn = s.value(0);
  const resultOn = s.value(0);

  const header = cinemaHeader(
    'CONDITIONAL RENORMALIZATION',
    'What share of the next',
    'draw goes to fa?',
    { accent: ROLE.prefix, size: 50 },
  );

  const stageAura = aura(220, 40, 640, '#ffd1661c', '#5ce1e618');

  const ratioEq = glowTex(
    String.raw`P(\text{fa} \mid \text{legal}) = \frac{3}{2 + 3} = \frac{3}{5} = 60\%`,
    { x: 380, y: -370, size: 36, color: ROLE.legal, glow: 8 },
  );

  const totalW = COND_WEIGHTS.reduce((a, b) => a + b, 0);
  const survivingW = COND_ALLOWED.reduce((a, i) => a + COND_WEIGHTS[i], 0);

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ex = expOn.value;
      const rm = removeOn.value;
      const rs = resultOn.value;
      const nodes = [];

      nodes.push(
        txt(`PREFIX: ${VALUE_PREFIX}`, -840, -230, 32, ROLE.prefix, 'mono', 'left').glow(
          6,
          ROLE.prefix,
        ),
        txt('TOKEN', -830, -158, 26, COSMOS.muted, 'mono', 'left'),
        txt('LOGIT', -580, -158, 26, COSMOS.muted, 'mono', 'center'),
        txt('EXP(LOGIT) WEIGHT BLOCKS', -200, -158, 26, ROLE.fsm, 'mono', 'center'),
        txt('BEFORE', 300, -158, 26, COSMOS.muted, 'mono', 'center'),
        txt('AFTER MASK', 620, -158, 26, ROLE.legal, 'mono', 'center'),
        line([-840, -128], [840, -128], { stroke: '#28385e', width: 2 }),
      );

      COND_TOKENS.forEach((tok, i) => {
        const y = -45 + i * 124;
        const w = COND_WEIGHTS[i];
        const ok = COND_ALLOWED.includes(i);
        const struck = !ok && rm > 0.35;
        const rowCol = struck ? COSMOS.dim : i === 1 ? ROLE.legal : ROLE.fsm;

        nodes.push(
          txt(tok, -830, y, 40, rowCol, 'mono', 'left').glow(!struck && rs > 0.4 ? 8 : 0, rowCol),
          txt(`ln ${w}`, -580, y, 34, COSMOS.ink, 'mono', 'center'),
        );

        // Glowing unit weight cubes
        const cubeX0 = -400;
        for (let j = 0; j < w; j++) {
          const cx = cubeX0 + j * 82;
          const cubeCol = struck ? '#2c334a' : i === 1 ? ROLE.legal : ROLE.fsm;
          const cube = rect(64, 52, {
            fill: ex > 0.3 ? cubeCol : '#131b31',
            stroke: struck ? ROLE.prune : cubeCol,
            width: 2.2,
            radius: 8,
          })
            .at(cx, y)
            .opacity(ex > 0.05 ? (struck ? 0.38 : 0.92 * ex) : 0.35);
          if (ex > 0.4 && !struck) cube.glow(7, cubeCol);
          nodes.push(cube);
        }

        // Crimson strike beam across chatty's 5 cubes (label cleanly underneath!)
        if (struck) {
          nodes.push(
            line([cubeX0 - 42, y], [cubeX0 + (w - 1) * 82 + 42, y], {
              stroke: ROLE.prune,
              width: 5.5,
            })
              .glow(11, ROLE.prune)
              .opacity(rm),
            txt('PRUNED (ILLEGAL)', cubeX0 - 32, y + 54, 26, ROLE.prune, 'mono', 'left').opacity(
              rm,
            ),
          );
        }

        // Before probability (20%, 30%, 50%)
        if (ex > 0.15) {
          nodes.push(
            txt(
              `${(w * 100) / totalW}%`,
              300,
              y,
              34,
              struck ? COSMOS.dim : COSMOS.ink,
              'mono',
              'center',
            ).opacity(ex),
          );
        } else {
          nodes.push(txt('·', 300, y, 30, COSMOS.dim, 'mono', 'center'));
        }

        // After-mask probability (strictly withheld until weights-result!)
        if (rs > 0.05) {
          const pct = Math.round(COND_PROBS[i] * 100);
          nodes.push(
            txt(`${pct}%`, 620, y, 42, ok ? rowCol : COSMOS.dim, 'mono', 'center')
              .glow(ok ? 10 : 0, rowCol)
              .opacity(rs),
          );
          if (ok) {
            const arc = quadArcPts([380, y], [540, y], i === 0 ? -24 : 24);
            nodes.push(beamWithPhotons(arc, rowCol, p * 1.2 + i * 0.4, { alpha: rs, width: 3.4 }));
          }
        } else {
          nodes.push(
            txt(
              rm > 0.35 ? (ok ? '? %' : '0%') : '?',
              620,
              y,
              36,
              rm > 0.35 && ok ? ROLE.prefix : COSMOS.dim,
              'mono',
              'center',
            ),
          );
        }
      });

      // Bottom denominator transformation bar
      if (rm < 0.05) {
        nodes.push(
          txt('TOTAL WEIGHT = 2 + 3 + 5 = 10 UNITS', -840, 345, 32, COSMOS.ink, 'mono', 'left'),
        );
      } else if (rs < 0.05) {
        nodes.push(
          txt(
            `SURVIVING DENOMINATOR: 10 -> ${survivingW} UNITS  (2 + 3)`,
            -840,
            340,
            32,
            ROLE.prefix,
            'mono',
            'left',
          ).glow(7, ROLE.prefix),
          txt('What share goes to fa?', 290, 340, 34, ROLE.prefix, 'serif', 'left').glow(
            6,
            ROLE.prefix,
          ),
        );
      } else {
        nodes.push(
          txt(
            'DENOMINATOR 10 -> 5  ·  RATIO 2 : 3 PRESERVED  (40% vs 60%)',
            -840,
            345,
            30,
            ROLE.legal,
            'mono',
            'left',
          )
            .glow(7, ROLE.legal)
            .opacity(rs),
          txt(
            'Shift by max finite logit in code',
            300,
            345,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(rs),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  c.show('weights-result', ratioEq, { after: true });
  driftValue(s, c, pulse, 4.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('weights-exp', () => {
    s.play(expOn.to(1, { duration: clampDur(c, c.cue('weights-exp').start, 0.45) }));
  });
  c.on('weights-remove', () => {
    s.play(removeOn.to(1, { duration: clampDur(c, c.cue('weights-remove').start, 0.45) }));
  });
  // Strict prediction withholding: reveal 60% / 40% AFTER spoken answer!
  c.after('weights-result', () => {
    s.play(resultOn.to(1, { duration: clampDur(c, c.cue('weights-result').end, 0.45) }));
  });
}
