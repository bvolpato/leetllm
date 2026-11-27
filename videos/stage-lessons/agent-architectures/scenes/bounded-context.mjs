// Scene 27: bounded-context - Stop loops and select the evidence each call needs
// Repeated action signature stalls a progress marker -> receipt store outside prompt
// feeds only relevant records into compact model context -> live 4-step submitted-token
// staircase (1000, 1200, 1400, 1600 -> 5,200 total from submittedTokens!).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  submittedTokens,
  txt,
} from '../parts.mjs';

const STEP_TOKS = submittedTokens(1000, 200, 4);
const STEP_SUM = STEP_TOKS.reduce((a, b) => a + b, 0);

export default function boundedContext(s, c) {
  const pulse = s.value(0);
  const storeOn = s.value(0);
  const selectOn = s.value(0);
  const growthOn = s.value(0);

  const header = cinemaHeader(
    'BOUNDED STATE & CONTEXT',
    'Stop loops and select',
    'only needed evidence',
    {
      accent: ROLE.action,
      size: 48,
    },
  );

  const stageAura = aura(160, 40, 620, '#5ce1e61e', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const st = storeOn.value;
      const sl = selectOn.value;
      const gr = growthOn.value;
      const nodes = [];

      // Left: Canonical Action + Stalled Progress Marker -> External Receipt Store -> Compact Context
      nodes.push(
        txt('LOOP DETECTOR', -840, -175, 26, ROLE.fail, 'mono', 'left'),
        txt(
          'Same canonical action · Progress = unchanged',
          -840,
          -125,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          '-> Switch strategy or stop before next dispatch',
          -840,
          -78,
          26,
          ROLE.caution,
          'sans',
          'left',
        ),
        line([-840, -25], [-100, -25], { stroke: '#25355a', width: 2 }).opacity(0.65),
        orbNode(-660, 130, 'STORE', ROLE.host, {
          radius: 56,
          sub: 'All full receipts',
          opacity: 0.4 + st * 0.6,
        }),
        beamWithPhotons(
          [
            [-596, 130],
            [-320, 130],
          ],
          ROLE.ok,
          p * 1.1,
          { alpha: 0.3 + sl * 0.7, width: 3.6 },
        ),
        orbNode(-250, 130, 'SELECT', ROLE.ok, {
          radius: 58,
          sub: 'Relevant subset',
          opacity: 0.35 + sl * 0.65,
        }),
      );

      // Right: 4-step submitted-token growth bars (1000, 1200, 1400, 1600 -> 5,200)
      const baseY = 235;
      const rx0 = 160;
      const colW = 110;
      const gap = 52;

      nodes.push(
        txt(
          `RESUBMITTED TOKENS (SUM = ${STEP_SUM.toLocaleString()})`,
          400,
          -175,
          26,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(0.45 + gr * 0.55),
      );

      STEP_TOKS.forEach((tok, i) => {
        const cx = rx0 + i * (colW + gap);
        const h = (tok / 1600) * 320 * (0.45 + gr * 0.55);
        const col = i === 3 ? ROLE.focus : ROLE.action;
        const bar = rect(colW, h, { fill: col, stroke: '#ffffff', width: 1.5, radius: 7 })
          .at(cx, baseY - h * 0.5)
          .opacity(0.88);
        if (gr > 0.4) bar.glow(7, col);
        nodes.push(
          bar,
          txt(`T${i + 1}`, cx, baseY + 34, 26, COSMOS.muted, 'mono', 'center'),
          txt(String(tok), cx, baseY - h - 24, 26, col, 'mono', 'center').opacity(0.45 + gr * 0.55),
        );
      });

      nodes.push(
        txt(
          'Compact working state keeps essential details without quadratic replay',
          0,
          365,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('bounded-context-b1-1', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('bounded-context-b1-1').start, 0.25) }));
  });
  c.on('bounded-context-b2-1', () => {
    s.play(storeOn.to(1, { duration: clampDur(c, c.cue('bounded-context-b2-1').start, 0.35) }));
  });
  c.on('bounded-context-b2-2', () => {
    s.play(selectOn.to(1, { duration: clampDur(c, c.cue('bounded-context-b2-2').start, 0.35) }));
  });
  c.on('bounded-context-b3-1', () => {
    s.play(growthOn.to(1, { duration: clampDur(c, c.cue('bounded-context-b3-1').start, 0.45) }));
  });
}
