// Scene 29: cycle-and-progress - Did the second pass make progress?
// Canonical JSON key-sort + space-preservation check -> 4-call A B A B trace between 5
// cursor readings: all 5 flat -> flagged (rose) -> final cursor advances (prediction pause!) ->
// detector lets it continue! Computed via periodicWithoutProgress!
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  periodicWithoutProgress,
  txt,
} from '../parts.mjs';

const FLAGGED_FLAT = periodicWithoutProgress(['A', 'B', 'A', 'B'], ['c0', 'c0', 'c0', 'c0', 'c0']);
const FLAGGED_PROG = periodicWithoutProgress(['A', 'B', 'A', 'B'], ['c0', 'c0', 'c0', 'c0', 'c1']);

export default function cycleAndProgress(s, c) {
  const pulse = s.value(0);
  const traceOn = s.value(0);
  const stillOn = s.value(0);
  const flagOn = s.value(0);
  const advanceOn = s.value(0);
  const contReveal = s.value(0);

  const header = cinemaHeader(
    'PROGRESS-AWARE CYCLE DETECTION',
    'Did the second pass',
    'make real progress?',
    {
      accent: ROLE.action,
      size: 48,
    },
  );

  const stageAura = aura(160, 40, 620, '#5ce1e61e', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const tr = traceOn.value;
      const st = stillOn.value;
      const fl = flagOn.value;
      const ad = advanceOn.value;
      const ct = contReveal.value;
      const nodes = [];

      // Top canonical encoding rail
      nodes.push(
        txt(
          'CANONICAL IDENTITY: sort keys · strip outer whitespace · KEEP "team id" space · reject NaN/Inf',
          0,
          -185,
          26,
          ROLE.host,
          'mono',
          'center',
        ),
      );

      // 5 cursor readings at y = 135, 4 calls (A, B, A, B) floating above at y = -25
      const curXs = [-680, -340, 0, 340, 680];
      const calls = ['A', 'B', 'A', 'B'];
      const curY = 135;
      const actY = -25;
      const isAdv = ad > 0.35;

      for (let i = 0; i < 4; i++) {
        const ax = (curXs[i] + curXs[i + 1]) * 0.5;
        const col = i >= 2 && fl > 0.35 && !isAdv ? ROLE.fail : ROLE.action;
        nodes.push(orbNode(ax, actY, calls[i], col, { radius: 42, opacity: 0.4 + tr * 0.6 }));
        if (i < 3) {
          nodes.push(
            beamWithPhotons(
              [
                [ax + 48, actY],
                [ax + 292, actY],
              ],
              col,
              p * 1.1 + i * 0.25,
              { alpha: 0.35 + tr * 0.65, width: 3.2 },
            ),
          );
        }
      }

      // Cursor line (flat when stagnant, steps UP at final node when progress occurs!)
      for (let i = 0; i < 5; i++) {
        const x = curXs[i];
        const y = i === 4 && isAdv ? curY - 58 : curY;
        const isLastAdv = i === 4 && isAdv;
        const col = isLastAdv ? ROLE.ok : fl > 0.35 && !isAdv ? ROLE.fail : ROLE.focus;
        if (i > 0) {
          const prevY = i - 1 === 4 && isAdv ? curY - 58 : curY;
          nodes.push(
            line([curXs[i - 1] + 22, prevY], [x - 22, y], {
              stroke: isLastAdv ? ROLE.ok : '#344770',
              width: isLastAdv ? 4.5 : 2.6,
            }).glow(isLastAdv ? 9 : 0, ROLE.ok),
          );
        }
        nodes.push(
          circle(18, { fill: '#0b1224', stroke: col, width: 3.4 })
            .at(x, y)
            .glow(isLastAdv || (fl > 0.35 && !isAdv) ? 9 : 4, col)
            .opacity(0.45 + st * 0.55),
          txt(isLastAdv ? 'c1 (+1)' : 'c0', x, y + 48, 26, col, 'mono', 'center').opacity(
            0.45 + st * 0.55,
          ),
        );
      }

      // Verdict banner at bottom (strict prediction withholding when `advanceOn` fires!)
      if (isAdv && ct < 0.05) {
        nodes.push(
          txt(
            'Same A, B, A, B calls, final cursor advanced! Should detector flag?',
            0,
            325,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (ct > 0.05) {
        nodes.push(
          txt(
            `PROGRESS DETECTED (flag=${FLAGGED_PROG}) -> CONTINUE IF BUDGET ALLOWS`,
            0,
            310,
            28,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(8, ROLE.ok)
            .opacity(ct),
          txt(
            'Catches periods 1..3 · Avoid display timestamps as progress · Keep hard limits',
            0,
            365,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(ct),
        );
      } else if (fl > 0.05) {
        nodes.push(
          txt(
            `REPEATED SUFFIX (A, B) + 0 CURSOR PROGRESS (flag=${FLAGGED_FLAT}) -> FLAGGED!`,
            0,
            325,
            28,
            ROLE.fail,
            'mono',
            'center',
          )
            .glow(8, ROLE.fail)
            .opacity(fl),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('cycle-space', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('cycle-space').start, 0.25) }));
  });
  c.on('cycle-start', () => {
    s.play(traceOn.to(1, { duration: clampDur(c, c.cue('cycle-start').start, 0.35) }));
  });
  c.on('cycle-still', () => {
    s.play(stillOn.to(1, { duration: clampDur(c, c.cue('cycle-still').start, 0.35) }));
  });
  c.on('cycle-flag', () => {
    s.play(flagOn.to(1, { duration: clampDur(c, c.cue('cycle-flag').start, 0.35) }));
  });
  c.on('cycle-change', () => {
    s.play(advanceOn.to(1, { duration: clampDur(c, c.cue('cycle-change').start, 0.4) }));
  });
  c.on('cycle-ask', () => {
    s.play(advanceOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('cycle-continue', () => {
    s.play(contReveal.to(1, { duration: clampDur(c, c.cue('cycle-continue').end, 0.35) }));
  });
}
