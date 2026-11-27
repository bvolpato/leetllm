// Scene 25: canary-controller - Contain a confirmed exposure before asking for more latency data
// 3 canary rollout_decision rows: (1) confirmed leak=1 even with missing latency -> ROLLBACK NOW!
// (2) missing/invalid metrics or err > 1% or p95 > 900ms -> HOLD, (3) leaks=0 & <= 1% & <= 900ms -> EXPAND!
import { group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function canaryController(s, c) {
  const rollOn = s.value(0);
  const expandOn = s.value(0);
  const boolTrapOn = s.value(0);

  const header = cinemaHeader('CANARY ROLLOUT CONTROLLER', 'Contain exposure', 'before more data', {
    x: -860,
    y: -445,
    accent: ROLE.fail,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#f43f5e18', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const rl = rollOn.value;
      const ex = expandOn.value;
      const bt = boolTrapOn.value;
      const nodes = [];

      // 3-Row Canary Rollout Decision Table
      const lx = -840;
      nodes.push(
        txt('WINDOW RECEIPT', lx, -205, 26, COSMOS.muted, 'mono', 'left'),
        txt('LEAKS', -420, -205, 26, COSMOS.muted, 'mono', 'center'),
        txt('ERR / p95', -80, -205, 26, COSMOS.muted, 'mono', 'center'),
        txt('DECISION', 450, -205, 26, ROLE.focus, 'mono', 'center'),
      );

      const rows = [
        {
          name: 'Row 1 (Exposure)',
          leaks: '1 (int)',
          metrics: 'missing / missing',
          dec: 'ROLLBACK NOW!',
          col: ROLE.fail,
          y: -120,
          alpha: 0.55 + rl * 0.45,
        },
        {
          name: 'Row 2 (Degraded)',
          leaks: '0 (int)',
          metrics: '> 1.0% or > 900 ms',
          dec: 'HOLD CANARY',
          col: ROLE.warn,
          y: -25,
          alpha: 0.4 + ex * 0.6,
        },
        {
          name: 'Row 3 (Inclusive)',
          leaks: '0 (int)',
          metrics: '1.0% & 900 ms (==)',
          dec: 'ELIGIBLE TO EXPAND',
          col: ROLE.ok,
          y: 70,
          alpha: 0.4 + ex * 0.6,
        },
      ];

      rows.forEach((r) => {
        nodes.push(
          txt(r.name, lx, r.y, 26, r.col, 'mono', 'left').opacity(r.alpha),
          txt(r.leaks, -420, r.y, 26, r.col, 'mono', 'center').opacity(r.alpha),
          txt(r.metrics, -80, r.y, 26, COSMOS.ink, 'mono', 'center').opacity(r.alpha),
          txt(r.dec, 450, r.y, 28, r.col, 'mono', 'center')
            .glow(r.alpha > 0.8 ? 7 : 0, r.col)
            .opacity(r.alpha),
        );
      });

      // Bottom: Python False == 0 trap & incident capture
      const bAlpha = 0.4 + bt * 0.6;
      nodes.push(
        line([-840, 155], [840, 155], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt('PYTHON TYPE HAZARD: False == 0 IS TRUE!', 0, 215, 28, ROLE.fail, 'mono', 'center')
          .glow(bt > 0.4 ? 8 : 0, ROLE.fail)
          .opacity(bAlpha),
        txt(
          'Accepting bool False as error_rate=0 makes a missing metric look healthy! Require real numeric types.',
          0,
          272,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(bAlpha),
        txt(
          'Record candidate, sample count & window · save complaints & incidents into next regression suite',
          0,
          332,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(bAlpha),
        txt('CONTAINMENT FIRST', 480, -425, 26, ROLE.fail, 'mono', 'center'),
        txt('Revoke leaked access & keep evidence', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('sd-canary-controller-0-result', () => {
    s.play(
      rollOn.to(1, { duration: clampDur(c, c.cue('sd-canary-controller-0-result').start, 0.35) }),
    );
  });
  c.on('sd-canary-controller-1-operation', () => {
    s.play(
      expandOn.to(1, {
        duration: clampDur(c, c.cue('sd-canary-controller-1-operation').start, 0.4),
      }),
    );
  });
  c.on('sd-canary-controller-2-operation', () => {
    s.play(
      boolTrapOn.to(1, {
        duration: clampDur(c, c.cue('sd-canary-controller-2-operation').start, 0.4),
      }),
    );
  });
}
