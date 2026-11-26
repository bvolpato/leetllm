import { group, line, rect } from 'vizmatic/stage';
import {
  BUDGET_ROWS,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildBudget(s, c) {
  s.add(aura(-460, -40, 560, ROLE.focus, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader('RESERVATION LEDGER', 'Will a third call fit', 'inside 4,000 tokens?', {
      x: -860,
      y: -445,
      accent: ROLE.focus,
      size: 46,
    }),
  );

  const askOn = s.value(0);
  const waitRev = s.value(0);
  const actOn = s.value(0);
  const freeRev = s.value(0);
  const admitRev = s.value(0);

  c.on('budget-ask', () =>
    s.play(askOn.to(1, { duration: clampDur(c, c.cue('budget-ask').start, 0.45) })),
  );
  // Strict prediction withholding on BOTH holds!
  c.after('budget-wait', () =>
    s.play(waitRev.to(1, { duration: clampDur(c, c.cue('budget-wait').end, 0.45) })),
  );
  c.on('budget-actual', () =>
    s.play(actOn.to(1, { duration: clampDur(c, c.cue('budget-actual').start, 0.55) })),
  );
  c.after('budget-free', () =>
    s.play(freeRev.to(1, { duration: clampDur(c, c.cue('budget-free').end, 0.45) })),
  );
  c.after('budget-admit', () =>
    s.play(admitRev.to(1, { duration: clampDur(c, c.cue('budget-admit').end, 0.5) })),
  );

  // 4,000-token bar across [-760 .. +760] (width = 1520 -> 0.38 px/tok)
  const x0 = -760;
  const fullW = 1520;
  const pxPerTok = fullW / 4000;

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const ak = askOn.value;
        const wt = waitRev.value;
        const ac = actOn.value;
        const fr = freeRev.value;
        const ad = admitRev.value;
        const nodes = [];

        // Top scale ruler
        const yBar = -70;
        nodes.push(
          txt(
            'FIXED REQUEST CAP = 4,000 GENERATED TOKENS',
            -760,
            yBar - 118,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
          rect(fullW, 80, { fill: '#0b1224', stroke: '#344770', width: 2.8, radius: 8 }).at(
            0,
            yBar,
          ),
        );
        [0, 1000, 2000, 3000, 4000].forEach((tk) => {
          const rx = x0 + tk * pxPerTok;
          nodes.push(
            line([rx, yBar - 48], [rx, yBar - 40], { stroke: '#5c74a8', width: 2 }),
            txt(`${tk}`, rx, yBar - 76, 26, COSMOS.muted, 'mono', 'center'),
          );
        });

        // Segment 1: A (1500 held -> settles to 900 spent)
        const aTok = ac > 0.5 ? 900 : 1500;
        const aW = aTok * pxPerTok;
        nodes.push(
          rect(aW - 4, 70, { fill: ac > 0.5 ? ROLE.ok : ROLE.agent, stroke: null, radius: 6 })
            .at(x0 + aW * 0.5 + 2, yBar)
            .glow(7, ac > 0.5 ? ROLE.ok : ROLE.agent),
          txt(
            ac > 0.5 ? 'A SPENT 900' : 'A HELD 1,500',
            x0 + aW * 0.5 + 2,
            yBar,
            26,
            '#050811',
            'mono',
            'center',
          ),
        );

        // Segment 2: B (1500 held)
        const bW = 1500 * pxPerTok;
        nodes.push(
          rect(bW - 4, 70, { fill: ROLE.tool, stroke: null, radius: 6 })
            .at(x0 + aW + bW * 0.5 + 2, yBar)
            .opacity(0.9),
          txt('B HELD 1,500', x0 + aW + bW * 0.5 + 2, yBar, 26, '#050811', 'mono', 'center'),
        );

        // Segment 3: C admitted (1500 held) ONLY after admitRev!
        const cW = 1500 * pxPerTok;
        if (ad > 0.5) {
          nodes.push(
            rect(cW - 4, 70, { fill: ROLE.model, stroke: null, radius: 6 })
              .at(x0 + aW + bW + cW * 0.5 + 2, yBar)
              .glow(8, ROLE.model),
            txt('C HELD 1,500', x0 + aW + bW + cW * 0.5 + 2, yBar, 26, '#050811', 'mono', 'center'),
          );
        }

        // Incoming C request bracket below bar (width = 1500 tokens)
        const yReq = 74;
        if (ak > 0.3 && ad <= 0.5) {
          const freeStartX = x0 + (aTok + 1500) * pxPerTok;
          nodes.push(
            rect(cW, 56, {
              fill: '#0b1224',
              stroke: fr > 0.5 ? ROLE.ok : wt > 0.5 ? ROLE.warn : ROLE.focus,
              width: 2.8,
              radius: 8,
              dash: [9, 6],
            }).at(Math.min(x0 + fullW - cW * 0.5, freeStartX + cW * 0.5), yReq),
            txt(
              'VERIFIER C WANTS 1,500 TOKENS',
              Math.min(x0 + fullW - cW * 0.5, freeStartX + cW * 0.5),
              yReq,
              26,
              fr > 0.5 ? ROLE.ok : ROLE.focus,
              'mono',
              'center',
            ),
          );
        }

        // Bottom live ledger readouts with strict prediction withholding
        nodes.push(line([-860, 174], [840, 174], { stroke: '#233152', width: 2 }));

        let freeStr = `${BUDGET_ROWS[0].free}`;
        let freeCol = ROLE.agent;
        let decTitle = 'CAN VERIFIER C START?';
        let decVal = '[ ? ]';
        let decCol = ROLE.focus;

        if (ad > 0.5) {
          freeStr = `${BUDGET_ROWS[2].free} FREE`;
          freeCol = ROLE.ok;
          decTitle = 'C ADMITTED (1,500 RESERVED)';
          decVal = '100 TOKENS LEFT';
          decCol = ROLE.ok;
        } else if (fr > 0.5) {
          freeStr = `${BUDGET_ROWS[1].free} FREE`;
          freeCol = ROLE.ok;
          decTitle = 'A FREED 600 UNUSED TOKENS';
          decVal = 'C FITS (1,600 >= 1,500)';
          decCol = ROLE.ok;
        } else if (ac > 0.5) {
          freeStr = '? FREE';
          freeCol = ROLE.focus;
          decTitle = 'A SETTLED AT 900 (B HOLDS 1,500)';
          decVal = 'HOW MUCH ROOM NOW?';
          decCol = ROLE.focus;
        } else if (wt > 0.5) {
          freeStr = '1,000 FREE';
          freeCol = ROLE.warn;
          decTitle = '1,000 FREE < 1,500 NEEDED';
          decVal = 'C WAITS';
          decCol = ROLE.warn;
        }

        nodes.push(
          metricReadout('FREE CAPACITY', freeStr, -460, 306, { color: freeCol, size: 44 }),
          metricReadout(decTitle, decVal, 260, 306, { color: decCol, size: 42 }),
          txt(
            'CHARGE GENERATORS, VERIFIERS & RETRIES TO THIS SAME LEDGER  |  COUNT INPUTS & TIME SEPARATELY',
            0,
            444,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
