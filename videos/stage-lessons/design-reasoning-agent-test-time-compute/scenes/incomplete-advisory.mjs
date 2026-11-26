import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export function buildIncompleteAdvisory(s, c) {
  s.add(aura(-460, -40, 560, ROLE.fail, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader('COMPLETION GATE', 'All three drafts say Hold:', 'which one can ship?', {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    }),
  );

  const chargeOn = s.value(0);
  const tableOn = s.value(0);

  c.on('ra-incomplete-advisory-0-2', () =>
    s.play(
      chargeOn.to(1, { duration: clampDur(c, c.cue('ra-incomplete-advisory-0-2').start, 0.5) }),
    ),
  );
  c.on('ra-incomplete-advisory-1-1', () =>
    s.play(
      tableOn.to(1, { duration: clampDur(c, c.cue('ra-incomplete-advisory-1-1').start, 0.55) }),
    ),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const ch = chargeOn.value;
        const tb = tableOn.value;
        const nodes = [];

        // Top callout: 700-token incomplete draft still charged!
        nodes.push(
          rect(1660, 96, { fill: '#0b1224', stroke: ROLE.fail, width: 2.6, radius: 10 }).at(
            0,
            -172,
          ),
          txt(
            'DRAFT TEXT: "Hold"   |   SPENT: 700 TOKENS   |   STATUS: INCOMPLETE (OUTPUT CAP)',
            -800,
            -192,
            26,
            ROLE.fail,
            'mono',
            'left',
          ),
          txt(
            ch > 0.5
              ? 'ACTION: WITHHOLD DRAFT · CHARGE 700 TOKENS · RESERVE NEW CALL TO RETRY'
              : 'OUTPUT CAP CAN HIT EVEN BEFORE THE FIRST VISIBLE WORD',
            -800,
            -150,
            26,
            ch > 0.5 ? ROLE.warn : COSMOS.muted,
            'mono',
            'left',
          ),
        );

        // 3-Row comparison matrix
        const lx = -840;
        const c1 = -520;
        const c2 = -150;
        const c3 = 210;
        const c4 = 520;

        nodes.push(
          txt('DRAFT', lx, -60, 26, COSMOS.muted, 'mono', 'left'),
          txt('PROVIDER STATUS', c1, -60, 26, COSMOS.muted, 'mono', 'left'),
          txt('EVIDENCE', c2, -60, 26, COSMOS.muted, 'mono', 'left'),
          txt('TRIMMED TEXT', c3, -60, 26, COSMOS.muted, 'mono', 'left'),
          txt('CONTROLLER', c4, -60, 26, ROLE.focus, 'mono', 'left'),
          line([-860, -30], [840, -30], { stroke: '#233152', width: 2 }),
        );

        const rows = [
          {
            d: 'DRAFT 1',
            st: 'INCOMPLETE',
            ev: 'PASS',
            tx: '"Hold"',
            dec: 'WITHHOLD',
            col: ROLE.fail,
            y: 40,
          },
          {
            d: 'DRAFT 2',
            st: 'COMPLETED',
            ev: 'FAILED',
            tx: '"Hold"',
            dec: 'WITHHOLD',
            col: ROLE.fail,
            y: 136,
          },
          {
            d: 'DRAFT 3',
            st: 'COMPLETED',
            ev: 'PASS',
            tx: '"Hold" (!empty)',
            dec: 'SEND ADVICE',
            col: ROLE.ok,
            y: 232,
          },
        ];

        const tAlpha = 0.35 + 0.65 * tb;
        rows.forEach((r) => {
          nodes.push(
            glowDot(lx + 10, r.y, { radius: 8, color: r.col, glow: 8, opacity: tAlpha }),
            txt(r.d, lx + 34, r.y, 26, r.col, 'mono', 'left').opacity(tAlpha),
            txt(
              r.st,
              c1,
              r.y,
              26,
              r.st === 'COMPLETED' ? ROLE.ok : ROLE.fail,
              'mono',
              'left',
            ).opacity(tAlpha),
            txt(r.ev, c2, r.y, 26, r.ev === 'PASS' ? ROLE.ok : ROLE.fail, 'mono', 'left').opacity(
              tAlpha,
            ),
            txt(r.tx, c3, r.y, 26, COSMOS.ink, 'mono', 'left').opacity(tAlpha),
            txt(r.dec, c4, r.y, 28, r.col, 'mono', 'left')
              .glow(r.col === ROLE.ok ? 8 : 0, r.col)
              .opacity(tAlpha),
          );
        });

        nodes.push(
          line([-860, 326], [840, 326], { stroke: '#233152', width: 2 }),
          txt(
            'HANDLE TOOL CALLS AND REFUSALS BY RESPONSE TYPE BEFORE LOOKING FOR FINAL ADVICE',
            0,
            396,
            26,
            ROLE.agent,
            'mono',
            'center',
          ).opacity(tAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
