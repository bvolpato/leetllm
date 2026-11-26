import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DEADLINE_ROWS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildFreshDeadline(s, c) {
  s.add(aura(-460, -40, 560, ROLE.focus, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader('DEADLINE TRANSFER (6,000 CAP)', 'Can D start before', 'the deadline closes?', {
      x: -860,
      y: -445,
      accent: ROLE.focus,
      size: 46,
    }),
  );

  const waitRev = s.value(0);
  const recRev = s.value(0);
  const fitRev = s.value(0);
  const deadOn = s.value(0);
  const retRev = s.value(0);

  // Strict prediction withholding on Beat 0 -> Beat 1 answers!
  c.after('ra-fresh-deadline-1-0', () =>
    s.play(waitRev.to(1, { duration: clampDur(c, c.cue('ra-fresh-deadline-1-0').end, 0.45) })),
  );
  c.after('deadline-receipt', () =>
    s.play(recRev.to(1, { duration: clampDur(c, c.cue('deadline-receipt').end, 0.5) })),
  );
  c.after('ra-fresh-deadline-1-1', () =>
    s.play(fitRev.to(1, { duration: clampDur(c, c.cue('ra-fresh-deadline-1-1').end, 0.45) })),
  );
  c.on('ra-fresh-deadline-1-2', () =>
    s.play(deadOn.to(1, { duration: clampDur(c, c.cue('ra-fresh-deadline-1-2').start, 0.45) })),
  );
  c.after('ra-fresh-deadline-1-4', () =>
    s.play(retRev.to(1, { duration: clampDur(c, c.cue('ra-fresh-deadline-1-4').end, 0.45) })),
  );

  // 6,000-token bar across [-760 .. +760] (1520 px)
  const x0 = -760;
  const fullW = 1520;
  const pxPerTok = fullW / 6000;

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const wt = waitRev.value;
        const rc = recRev.value;
        const ft = fitRev.value;
        const dl = deadOn.value;
        const rt = retRev.value;
        const nodes = [];

        const yBar = -75;
        nodes.push(
          txt(
            'CAP = 6,000 TOKENS   |   C COMPLETED (HOLD ADVISORY, 900 TOK)',
            -760,
            yBar - 118,
            26,
            ROLE.ok,
            'mono',
            'left',
          ),
          rect(fullW, 78, { fill: '#0b1224', stroke: '#344770', width: 2.8, radius: 8 }).at(
            0,
            yBar,
          ),
        );
        [0, 1500, 3000, 4500, 6000].forEach((tk) => {
          const rx = x0 + tk * pxPerTok;
          nodes.push(
            line([rx, yBar - 48], [rx, yBar - 40], { stroke: '#5c74a8', width: 2 }),
            txt(`${tk}`, rx, yBar - 76, 26, COSMOS.muted, 'mono', 'center'),
          );
        });

        // C spent 900 (completed hold advisory!)
        const cW = 900 * pxPerTok;
        nodes.push(
          rect(cW - 4, 68, { fill: ROLE.ok, stroke: null, radius: 6 })
            .at(x0 + cW * 0.5 + 2, yBar)
            .glow(rt > 0.5 ? 11 : 6, ROLE.ok),
          txt('C: 900', x0 + cW * 0.5 + 2, yBar, 26, '#050811', 'mono', 'center'),
        );

        // A: 2000 held -> settles at 1400 spent after deadline-receipt
        const aTok = rc > 0.5 ? 1400 : 2000;
        const aW = aTok * pxPerTok;
        nodes.push(
          rect(aW - 4, 68, { fill: rc > 0.5 ? ROLE.agent : ROLE.tool, stroke: null, radius: 6 }).at(
            x0 + cW + aW * 0.5 + 2,
            yBar,
          ),
          txt(
            rc > 0.5 ? 'A: 1,400' : 'A HELD 2,000',
            x0 + cW + aW * 0.5 + 2,
            yBar,
            26,
            '#050811',
            'mono',
            'center',
          ),
        );

        // B: 2000 held
        const bW = 2000 * pxPerTok;
        nodes.push(
          rect(bW - 4, 68, { fill: ROLE.warn, stroke: null, radius: 6 }).at(
            x0 + cW + aW + bW * 0.5 + 2,
            yBar,
          ),
          txt('B HELD 2,000', x0 + cW + aW + bW * 0.5 + 2, yBar, 26, '#050811', 'mono', 'center'),
        );

        // D: admitted 1500 ONLY after fitRev!
        const dW = 1500 * pxPerTok;
        if (ft > 0.5) {
          nodes.push(
            rect(dW - 4, 68, { fill: ROLE.model, stroke: null, radius: 6 })
              .at(x0 + cW + aW + bW + dW * 0.5 + 2, yBar)
              .glow(8, ROLE.model),
            txt(
              'D HELD 1,500',
              x0 + cW + aW + bW + dW * 0.5 + 2,
              yBar,
              26,
              '#050811',
              'mono',
              'center',
            ),
          );
        } else {
          // Pending D request bracket below bar
          nodes.push(
            rect(dW, 56, {
              fill: '#0b1224',
              stroke: ROLE.focus,
              width: 2.6,
              radius: 8,
              dash: [9, 6],
            }).at(x0 + fullW - dW * 0.5, 58),
            txt(
              'D WANTS 1,500 TOKENS',
              x0 + fullW - dW * 0.5,
              58,
              26,
              ROLE.focus,
              'mono',
              'center',
            ),
          );
        }

        // Bottom live ledger readouts with strict prediction withholding
        nodes.push(line([-860, 162], [840, 162], { stroke: '#233152', width: 2 }));

        let freeVal = '? FREE';
        let freeCol = ROLE.focus;
        let decTitle = 'CAN D START NOW? DOES A=1,400 MAKE ROOM?';
        let decVal = '[ ? ]';
        let decCol = ROLE.focus;
        let sub = 'C=900 SPENT · A=2,000 HELD · B=2,000 HELD · D WANTS 1,500';

        if (rt > 0.5) {
          freeVal = `${DEADLINE_ROWS.admitted.free} FREE`;
          freeCol = ROLE.ok;
          decTitle = 'DEADLINE CLOSED · B + D STAY RESERVED (3,500)';
          decVal = 'RETURN COMPLETED C';
          decCol = ROLE.ok;
          sub = 'C FINISHED WITH QUALIFYING EVIDENCE; DEPLOYMENT STAYS IN OWNER HANDS';
        } else if (dl > 0.5) {
          freeVal = '200 FREE';
          freeCol = ROLE.warn;
          decTitle = 'DEADLINE ARRIVED';
          decVal = 'KEEP B & D RESERVED';
          decCol = ROLE.warn;
          sub = 'DO NOT FREE IN-FLIGHT CALLS UNTIL USAGE OR CANCEL IS CONFIRMED';
        } else if (ft > 0.5) {
          freeVal = `${DEADLINE_ROWS.admitted.free} FREE`;
          freeCol = ROLE.ok;
          decTitle = 'D ADMITTED (1,500 RESERVED)';
          decVal = '200 TOKENS LEFT';
          decCol = ROLE.ok;
          sub = 'A FREED 600 -> 1,700 FREE -> D FITS';
        } else if (rc > 0.5) {
          freeVal = `${DEADLINE_ROWS.receipt.free} FREE`;
          freeCol = ROLE.ok;
          decTitle = 'A SETTLED AT 1,400 (+600 FREED)';
          decVal = '1,700 FREE -> D FITS!';
          decCol = ROLE.ok;
          sub = '1,100 + 600 = 1,700 >= 1,500 NEEDED BY D';
        } else if (wt > 0.5) {
          freeVal = `${DEADLINE_ROWS.initial.free} FREE`;
          freeCol = ROLE.warn;
          decTitle = '1,100 FREE < 1,500 NEEDED';
          decVal = 'AT FIRST D WAITS';
          decCol = ROLE.warn;
          sub = 'WAITING FOR A RECEIPT TO FREE UNUSED CAPACITY';
        }

        nodes.push(
          metricReadout('LEDGER FREE', freeVal, -520, 296, { color: freeCol, size: 44 }),
          metricReadout(decTitle, decVal, 220, 296, { color: decCol, size: 42 }),
          txt(sub, 0, 444, 26, COSMOS.muted, 'mono', 'center'),
        );

        return group(...nodes);
      },
    ),
  );
}
