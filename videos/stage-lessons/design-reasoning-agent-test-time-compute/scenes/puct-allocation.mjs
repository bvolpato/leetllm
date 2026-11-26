import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PUCT_AFTER_B,
  PUCT_GOOD_A,
  PUCT_INIT_A,
  PUCT_INIT_B,
  PUCT_ZERO_A,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildPuctAllocation(s, c) {
  s.add(aura(-460, -40, 560, ROLE.agent, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.focus, COSMOS.bg));

  s.add(
    cinemaHeader('PUCT SEARCH ALLOCATION', 'Which branch gets', 'the next visit?', {
      x: -860,
      y: -445,
      accent: ROLE.focus,
      size: 46,
    }),
  );

  const bonusOn = s.value(0);
  const initRev = s.value(0);
  const goodOn = s.value(0);
  const zeroOn = s.value(0);
  const badRev = s.value(0);

  c.on('puct-bonus', () =>
    s.play(bonusOn.to(1, { duration: clampDur(c, c.cue('puct-bonus').start, 0.5) })),
  );
  // Strict prediction withholding: first winner A revealed ONLY after puct-initial!
  c.after('puct-initial', () =>
    s.play(initRev.to(1, { duration: clampDur(c, c.cue('puct-initial').end, 0.45) })),
  );
  c.on('puct-update', () =>
    s.play(goodOn.to(1, { duration: clampDur(c, c.cue('puct-update').start, 0.55) })),
  );
  c.on('puct-bad-update', () =>
    s.play(zeroOn.to(1, { duration: clampDur(c, c.cue('puct-bad-update').start, 0.55) })),
  );
  // Strict prediction withholding: replay winner B revealed ONLY after puct-bad-result!
  c.after('puct-bad-result', () =>
    s.play(badRev.to(1, { duration: clampDur(c, c.cue('puct-bad-result').end, 0.45) })),
  );

  // Horizontal scale: 0 .. 1.2 across [-320 .. +520] (700 px per 1.0)
  const x0 = -320;
  const pxPerUnit = 700;

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const bn = bonusOn.value;
        const ir = initRev.value;
        const gd = goodOn.value;
        const zr = zeroOn.value;
        const br = badRev.value;
        const nodes = [];

        // Formula anchor
        nodes.push(
          txt(
            'PUCT(i) = Q(i)  +  c * P(i) * sqrt(N) / (1 + n_i)    (c = 1)',
            0,
            -232,
            28,
            ROLE.agent,
            'mono',
            'center',
          ),
        );

        // Compute live values for Branch A and Branch B
        let qA = PUCT_INIT_A.Q;
        let bA = PUCT_INIT_A.bonus;
        let qB = PUCT_INIT_B.Q;
        let bB = PUCT_INIT_B.bonus;
        let subA = 'prior 0.20 · N=16 · n=1';
        let subB = 'prior 0.15 · N=16 · n=1';

        if (zr > 0.5) {
          qA = PUCT_ZERO_A.Q;
          bA = PUCT_ZERO_A.bonus;
          qB = PUCT_AFTER_B.Q;
          bB = PUCT_AFTER_B.bonus;
          subA = 'out=0 -> Q=0.25 (N=17, n=2)';
          subB = 'prior 0.15 · N=17 · n=1';
        } else if (gd > 0.5) {
          qA = PUCT_GOOD_A.Q;
          bA = PUCT_GOOD_A.bonus;
          qB = PUCT_AFTER_B.Q;
          bB = PUCT_AFTER_B.bonus;
          subA = 'out=1 -> Q=0.75 (N=17, n=2)';
          subB = 'prior 0.15 · N=17 · n=1';
        }

        const showBonus = bn > 0.4 || ir > 0.4;
        const yA = -95;
        const yB = 65;

        // Branch A stacked bar
        const qAW = qA * pxPerUnit;
        const bAW = showBonus ? bA * pxPerUnit : 0;
        nodes.push(
          txt('BRANCH A', -840, yA - 18, 28, ROLE.agent, 'mono', 'left'),
          txt(subA, -840, yA + 24, 26, COSMOS.muted, 'mono', 'left'),
          rect(qAW, 54, { fill: ROLE.agent, stroke: null, radius: 6 })
            .at(x0 + qAW * 0.5, yA)
            .opacity(0.9),
          txt(`Q=${qA.toFixed(2)}`, x0 + qAW * 0.5, yA, 26, '#050811', 'mono', 'center'),
        );
        if (bAW > 10) {
          nodes.push(
            rect(bAW - 4, 54, { fill: ROLE.focus, stroke: null, radius: 6 })
              .at(x0 + qAW + bAW * 0.5 + 2, yA)
              .glow(7, ROLE.focus),
            txt(`+${bA.toFixed(2)}`, x0 + qAW + bAW * 0.5 + 2, yA, 26, '#050811', 'mono', 'center'),
          );
        }
        nodes.push(
          txt(
            showBonus ? `= ${(qA + bA).toFixed(2)}` : 'Q=0.50 + ?',
            x0 + qAW + bAW + 24,
            yA,
            28,
            ROLE.focus,
            'mono',
            'left',
          ),
        );

        // Branch B stacked bar
        const qBW = qB * pxPerUnit;
        const bBW = showBonus ? bB * pxPerUnit : 0;
        nodes.push(
          txt('BRANCH B', -840, yB - 18, 28, ROLE.ok, 'mono', 'left'),
          txt(subB, -840, yB + 24, 26, COSMOS.muted, 'mono', 'left'),
          rect(qBW, 54, { fill: ROLE.ok, stroke: null, radius: 6 })
            .at(x0 + qBW * 0.5, yB)
            .opacity(0.9),
          txt(`Q=${qB.toFixed(2)}`, x0 + qBW * 0.5, yB, 26, '#050811', 'mono', 'center'),
        );
        if (bBW > 10) {
          nodes.push(
            rect(bBW - 4, 54, { fill: ROLE.focus, stroke: null, radius: 6 })
              .at(x0 + qBW + bBW * 0.5 + 2, yB)
              .glow(7, ROLE.focus),
            txt(`+${bB.toFixed(2)}`, x0 + qBW + bBW * 0.5 + 2, yB, 26, '#050811', 'mono', 'center'),
          );
        }
        nodes.push(
          txt(
            showBonus ? `= ${(qB + bB).toFixed(2)}` : 'Q=0.50 + ?',
            x0 + qBW + bBW + 24,
            yB,
            28,
            ROLE.ok,
            'mono',
            'left',
          ),
        );

        // Bottom verdict strip with strict prediction withholding
        nodes.push(line([-860, 188], [840, 188], { stroke: '#233152', width: 2 }));

        let cap = 'TIED Q = 0.50  |  P(A)=0.20 > P(B)=0.15';
        let val = 'WHICH BRANCH NEXT?';
        let col = ROLE.focus;
        let sub = 'HIGHER PRIOR GETS LARGER EXPLORATION BONUS AT TIED VISITS';

        if (br > 0.5) {
          cap = `A = ${PUCT_ZERO_A.total.toFixed(2)}  <  B = ${PUCT_AFTER_B.total.toFixed(2)}`;
          val = 'VISIT B NEXT';
          col = ROLE.ok;
          sub = 'LOWER OBSERVED VALUE MOVED A BELOW B; EXACT COMPATIBILITY STILL REQUIRED';
        } else if (zr > 0.5) {
          cap = 'REPLAY VISIT WITH OUTCOME = 0 (Q_A -> 0.25)';
          val = 'WHICH BRANCH NOW?';
          col = ROLE.focus;
          sub = 'BONUS STAYED IDENTICAL; COMPARE THE TWO BAR ENDS';
        } else if (gd > 0.5) {
          cap = `OUTCOME = 1 -> A = ${PUCT_GOOD_A.total.toFixed(2)} vs B = ${PUCT_AFTER_B.total.toFixed(2)}`;
          val = 'A STILL LEADS (> 1.0)';
          col = ROLE.agent;
          sub = 'SELECTION SCORE EXCEEDS 1.0 BECAUSE IT ADDS BONUS TO ESTIMATE';
        } else if (ir > 0.5) {
          cap = 'A = 0.50 + 0.40 = 0.90  |  B = 0.50 + 0.30 = 0.80';
          val = 'VISIT A FIRST';
          col = ROLE.agent;
          sub = 'AT UNVISITED PARENT BONUS = 0, SO TIES NEED A STARTING RULE';
        }

        nodes.push(metricReadout(cap, val, 0, 318, { color: col, size: 46, sub }));
        return group(...nodes);
      },
    ),
  );
}
