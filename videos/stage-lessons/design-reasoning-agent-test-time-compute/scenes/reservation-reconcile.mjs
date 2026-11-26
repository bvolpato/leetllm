import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildReservationReconcile(s, c) {
  s.add(aura(-460, -40, 560, ROLE.warn, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.fail, COSMOS.bg));

  s.add(
    cinemaHeader(
      'IDEMPOTENT SETTLEMENT',
      'What if the same receipt',
      'arrives twice or conflicts?',
      {
        x: -860,
        y: -445,
        accent: ROLE.warn,
        size: 46,
      },
    ),
  );

  const sameRev = s.value(0);
  const confOn = s.value(0);
  const overOn = s.value(0);
  const timeOn = s.value(0);

  // Strict prediction withholding: duplicate stays at 900 revealed ONLY after receipt-same!
  c.after('receipt-same', () =>
    s.play(sameRev.to(1, { duration: clampDur(c, c.cue('receipt-same').end, 0.45) })),
  );
  c.on('receipt-conflict', () =>
    s.play(confOn.to(1, { duration: clampDur(c, c.cue('receipt-conflict').start, 0.45) })),
  );
  c.on('receipt-over', () =>
    s.play(overOn.to(1, { duration: clampDur(c, c.cue('receipt-over').start, 0.5) })),
  );
  c.on('receipt-timeout', () =>
    s.play(timeOn.to(1, { duration: clampDur(c, c.cue('receipt-timeout').start, 0.5) })),
  );

  const x0 = -760;
  const fullW = 1520;
  const pxPerTok = fullW / 4000;

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const sm = sameRev.value;
        const cf = confOn.value;
        const ov = overOn.value;
        const tm = timeOn.value;
        const nodes = [];

        // Top: Steady 4,000-token ledger bar (A=900 spent, B=1500 held, C=1500 held, 100 free)
        const yBar = -150;
        const aW = 900 * pxPerTok;
        const bW = 1500 * pxPerTok;
        const cW = 1500 * pxPerTok;

        nodes.push(
          txt(
            'LEDGER STATE (CAP = 4,000 TOKENS)',
            -760,
            yBar - 66,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
          rect(fullW, 68, { fill: '#0b1224', stroke: '#344770', width: 2.5, radius: 8 }).at(
            0,
            yBar,
          ),
          rect(aW - 4, 60, { fill: ROLE.ok, stroke: null, radius: 6 }).at(x0 + aW * 0.5 + 2, yBar),
          txt('A SPENT 900', x0 + aW * 0.5 + 2, yBar, 26, '#050811', 'mono', 'center'),
          rect(bW - 4, 60, { fill: ROLE.tool, stroke: null, radius: 6 }).at(
            x0 + aW + bW * 0.5 + 2,
            yBar,
          ),
          txt('B HELD 1,500', x0 + aW + bW * 0.5 + 2, yBar, 26, '#050811', 'mono', 'center'),
          rect(cW - 4, 60, { fill: ROLE.model, stroke: null, radius: 6 }).at(
            x0 + aW + bW + cW * 0.5 + 2,
            yBar,
          ),
          txt('C HELD 1,500', x0 + aW + bW + cW * 0.5 + 2, yBar, 26, '#050811', 'mono', 'center'),
        );

        // Middle: 4 delivery cases cleanly aligned
        const cases = [
          {
            label: '1. DUPLICATE (A, 900)',
            outcome: sm > 0.5 ? 'IDEMPOTENT: STAY AT 900' : 'SHOULD SPENT BAR MOVE? [ ? ]',
            col: sm > 0.5 ? ROLE.ok : ROLE.focus,
            alpha: 1,
            y: -15,
          },
          {
            label: '2. CONFLICT (A, 950)',
            outcome: 'REJECT & RECONCILE (SAME ID, DIFFERENT USAGE)',
            col: ROLE.fail,
            alpha: 0.25 + 0.75 * cf,
            y: 72,
          },
          {
            label: '3. OVERUSE (B, 1600 > 1500)',
            outcome: 'RAISE ERROR · KEEP B RESERVATION · RECONCILE BACKEND',
            col: ROLE.fail,
            alpha: 0.25 + 0.75 * ov,
            y: 159,
          },
          {
            label: '4. TIMEOUT (B NO RECEIPT)',
            outcome: 'KEEP B HELD UNTIL USAGE OR CONFIRMED CANCEL',
            col: ROLE.warn,
            alpha: 0.25 + 0.75 * tm,
            y: 246,
          },
        ];

        cases.forEach((cs) => {
          nodes.push(
            txt(cs.label, -840, cs.y, 26, cs.col, 'mono', 'left').opacity(cs.alpha),
            txt(cs.outcome, -210, cs.y, 26, COSMOS.ink, 'mono', 'left').opacity(cs.alpha),
          );
        });

        // Bottom durability rule
        nodes.push(line([-860, 326], [840, 326], { stroke: '#233152', width: 2 }));
        nodes.push(
          metricReadout(
            'CONCURRENCY & CRASH SAFETY',
            'SERIALIZE RESERVATIONS · STORE RECEIPTS BY CALL ID',
            0,
            408,
            { color: ROLE.agent, size: 32 },
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
