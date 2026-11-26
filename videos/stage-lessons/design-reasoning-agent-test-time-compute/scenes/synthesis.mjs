import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  advise,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  metricReadout,
  observation,
  txt,
} from '../parts.mjs';

export function buildSynthesis(s, c) {
  s.add(aura(-460, -40, 560, ROLE.focus, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.fail, COSMOS.bg));

  s.add(
    cinemaHeader(
      'ONE SECOND AT THE DEADLINE',
      'Same text, same latency,',
      'one second older receipt',
      {
        x: -860,
        y: -445,
        accent: ROLE.fail,
        size: 46,
      },
    ),
  );

  const shift99 = s.value(0);
  const withholdRev = s.value(0);
  const acctRev = s.value(0);

  c.on('last-shift', () =>
    s.play(shift99.to(1, { duration: clampDur(c, c.cue('last-shift').start, 0.55) })),
  );
  // Strict prediction withholding on BOTH questions (C withheld + 3,500 held)!
  c.after('last-withhold', () =>
    s.play(withholdRev.to(1, { duration: clampDur(c, c.cue('last-withhold').end, 0.45) })),
  );
  c.after('last-account', () =>
    s.play(acctRev.to(1, { duration: clampDur(c, c.cue('last-account').end, 0.45) })),
  );

  const validAt100 = advise(observation, 130); // HOLD
  const staleAt99 = advise({ ...observation, observedAt: 99 }, 130); // REFRESH EVIDENCE

  // Time ruler 90 s .. 135 s across [-740 .. +740]
  const x0 = -740;
  const x1 = 740;
  const mapT = (sec) => x0 + ((sec - 90) / 45) * (x1 - x0);

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const sh = shift99.value;
        const wh = withholdRev.value;
        const ac = acctRev.value;
        const nodes = [];

        const yR = -70;
        const x100 = mapT(100);
        const x130 = mapT(130);
        const obsSec = sh > 0.5 ? 99 : 100;
        const xObs = mapT(obsSec);

        // 30-second eligibility window [100 .. 130]
        nodes.push(
          txt(
            'DEADLINE CLOCK STOPPED AT t = 130 s   |   ELIGIBLE WINDOW = [100 .. 130]',
            -740,
            yR - 110,
            26,
            ROLE.ok,
            'mono',
            'left',
          ),
          rect(x130 - x100, 62, { fill: ROLE.ok, stroke: ROLE.ok, width: 2, radius: 6 })
            .at((x100 + x130) * 0.5, yR)
            .opacity(0.2),
          txt('30 s ELIGIBLE WINDOW', (x100 + x130) * 0.5, yR, 26, ROLE.ok, 'mono', 'center'),
          line([x0, yR + 52], [x1, yR + 52], { stroke: '#344770', width: 3 }),
        );

        [90, 99, 100, 115, 130].forEach((sec) => {
          const tx = mapT(sec);
          const lblY = sec === 99 ? yR + 114 : yR + 82;
          nodes.push(
            line([tx, yR + 44], [tx, yR + 60], { stroke: '#5c74a8', width: 2 }),
            txt(
              `${sec}s`,
              tx,
              lblY,
              26,
              sec === 99 && sh > 0.5 ? ROLE.fail : sec === 130 ? ROLE.focus : COSMOS.muted,
              'mono',
              'center',
            ),
          );
        });

        // Observation marker (moves 100s -> 99s!)
        const obsCol = wh > 0.5 ? ROLE.fail : sh > 0.5 ? ROLE.warn : ROLE.ok;
        nodes.push(
          glowDot(xObs, yR - 46, { radius: 11, color: obsCol, glow: 12 }),
          txt(
            `OBSERVED t = ${obsSec} s (age = ${130 - obsSec} s)`,
            xObs,
            yR - 84,
            26,
            obsCol,
            'mono',
            'center',
          ),
        );

        // Open calls & candidate summary cleanly separated on two rows
        nodes.push(
          txt(
            'OPEN CALLS AT DEADLINE:  B (2,000)  +  D (1,500)',
            0,
            92,
            26,
            ROLE.warn,
            'mono',
            'center',
          ),
          txt(
            'CANDIDATE C TEXT: "Hold"  ·  rev 7  ·  240 ms  ·  smoke PASS',
            0,
            138,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );

        // Bottom readouts with STRICT prediction withholding on both answers!
        nodes.push(line([-860, 182], [840, 182], { stroke: '#233152', width: 2 }));

        let cVal = `${validAt100} (AGE 30 s INCLUSIVE)`;
        let cCol = ROLE.ok;
        if (wh > 0.5) {
          cVal = `WITHHOLD C -> ${staleAt99}`;
          cCol = ROLE.fail;
        } else if (sh > 0.5) {
          cVal = 'CAN OWNER RECEIVE C? [ ? ]';
          cCol = ROLE.focus;
        }

        let bVal = '2,000 + 1,500 OPEN';
        let bCol = COSMOS.muted;
        if (ac > 0.5) {
          bVal = '3,500 TOKENS HELD';
          bCol = ROLE.warn;
        } else if (sh > 0.5) {
          bVal = '? TOKENS HELD';
          bCol = ROLE.focus;
        }

        nodes.push(
          metricReadout('CANDIDATE C DECISION', cVal, -360, 316, { color: cCol, size: 38 }),
          metricReadout('B & D RESERVATIONS', bVal, 480, 316, { color: bCol, size: 40 }),
          txt(
            wh > 0.5
              ? 'ABSTAIN & TELL OWNER WHICH MEASUREMENT TO REFRESH · LATE RECEIPTS STILL RECONCILE'
              : 'REPLAY WITH ONLY OBSERVATION TIME SHIFTED FROM SECOND 100 TO 99',
            0,
            450,
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
