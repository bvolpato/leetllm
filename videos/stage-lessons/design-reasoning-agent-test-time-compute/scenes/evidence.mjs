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

export function buildEvidence(s, c) {
  s.add(aura(-460, -40, 560, ROLE.focus, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.fail, COSMOS.bg));

  s.add(
    cinemaHeader(
      'BOUNDARY & FRESHNESS',
      'Where does the reading land',
      'when latency and age move?',
      {
        x: -860,
        y: -445,
        accent: ROLE.focus,
        size: 46,
      },
    ),
  );

  const move300 = s.value(0);
  const boundRev = s.value(0);
  const late31 = s.value(0);
  const refRev = s.value(0);

  c.on('evidence-move', () =>
    s.play(move300.to(1, { duration: clampDur(c, c.cue('evidence-move').start, 0.6) })),
  );
  // Strict prediction withholding for BOTH beats!
  c.after('evidence-boundary', () =>
    s.play(boundRev.to(1, { duration: clampDur(c, c.cue('evidence-boundary').end, 0.45) })),
  );
  c.on('evidence-late', () =>
    s.play(late31.to(1, { duration: clampDur(c, c.cue('evidence-late').start, 0.55) })),
  );
  c.after('evidence-refresh', () =>
    s.play(refRev.to(1, { duration: clampDur(c, c.cue('evidence-refresh').end, 0.45) })),
  );

  const rbVerdict = advise({ ...observation, latency: 300 }, 110); // ROLLBACK
  const staleVerdict = advise({ ...observation, latency: 300 }, 131); // REFRESH EVIDENCE

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const m3 = move300.value;
        const br = boundRev.value;
        const l31 = late31.value;
        const rr = refRev.value;
        const nodes = [];

        // p95 Ruler 0 .. 400 ms across [-760 .. +760]
        const x0 = -760;
        const x1 = 760;
        const mapMs = (ms) => x0 + (ms / 400) * (x1 - x0);
        const yR = -60;

        const bands = [
          { a: 0, b: 200, label: 'CONTINUE (<200)', col: ROLE.ok },
          { a: 200, b: 300, label: 'HOLD (200..299)', col: ROLE.focus },
          { a: 300, b: 400, label: 'ROLLBACK (>=300)', col: ROLE.fail },
        ];
        bands.forEach((b) => {
          const xa = mapMs(b.a);
          const xb = mapMs(b.b);
          nodes.push(
            rect(xb - xa - 4, 58, { fill: b.col, stroke: null, radius: 6 })
              .at((xa + xb) * 0.5, yR)
              .opacity(0.24),
            txt(b.label, (xa + xb) * 0.5, yR, 26, b.col, 'mono', 'center'),
          );
        });

        nodes.push(line([x0, yR + 50], [x1, yR + 50], { stroke: '#344770', width: 3 }));
        [0, 100, 200, 240, 300, 400].forEach((ms) => {
          const tx = mapMs(ms);
          nodes.push(
            line([tx, yR + 42], [tx, yR + 58], { stroke: '#5c74a8', width: 2 }),
            txt(`${ms}`, tx, yR + 88, 26, ms === 300 ? ROLE.fail : COSMOS.muted, 'mono', 'center'),
          );
        });

        // Sliding marker from 240 -> 300 ms
        const curMs = Math.round(240 + 60 * m3);
        const mx = mapMs(240 + 60 * m3);
        const mCol = rr > 0.5 ? ROLE.warn : br > 0.5 ? ROLE.fail : ROLE.focus;
        nodes.push(
          glowDot(mx, yR - 46, { radius: 10, color: mCol, glow: 12 }),
          txt(`${curMs} ms`, mx, yR - 86, 28, mCol, 'mono', 'center'),
        );

        // Freshness clock strip (0 .. 40 s across [-500 .. +500])
        const yClk = 115;
        const c0 = -500;
        const c1 = 500;
        const mapS = (sec) => c0 + (sec / 40) * (c1 - c0);
        const x30 = mapS(30);
        const curAge = Math.round(10 + 21 * l31);
        const ax = mapS(10 + 21 * l31);

        nodes.push(
          txt('RECEIPT AGE', -840, yClk, 26, COSMOS.muted, 'mono', 'left'),
          rect(x30 - c0, 36, { fill: ROLE.ok, stroke: null, radius: 5 })
            .at((c0 + x30) * 0.5, yClk)
            .opacity(0.24),
          rect(c1 - x30, 36, { fill: ROLE.fail, stroke: null, radius: 5 })
            .at((x30 + c1) * 0.5, yClk)
            .opacity(0.24),
          txt('VALID 0..30 s', (c0 + x30) * 0.5, yClk, 26, ROLE.ok, 'mono', 'center'),
          txt('STALE (>30)', (x30 + c1) * 0.5, yClk, 26, ROLE.fail, 'mono', 'center'),
          glowDot(ax, yClk - 36, { radius: 9, color: l31 > 0.5 ? ROLE.fail : ROLE.ok, glow: 10 }),
          txt(`age = ${curAge} s`, 560, yClk, 28, l31 > 0.5 ? ROLE.fail : ROLE.ok, 'mono', 'left'),
        );

        // Bottom verdict strip with strict prediction withholding
        nodes.push(line([-860, 208], [840, 208], { stroke: '#233152', width: 2 }));

        let cap = 'AT 240 ms · AGE 10 s';
        let val = 'HOLD';
        let col = ROLE.focus;
        let sub = 'SMOKE PASS · REVISION 7 MATCHED';

        if (rr > 0.5) {
          cap = 'AGE 31 s > 30 s WINDOW';
          val = `WITHHOLD -> ${staleVerdict}`;
          col = ROLE.warn;
          sub = 'REVISION + FRESHNESS ALWAYS COME BEFORE THRESHOLD COMPARISON';
        } else if (l31 > 0.5) {
          cap = 'AT 300 ms · AGE 31 s';
          val = 'STILL SUPPORT ROLLBACK?';
          col = ROLE.focus;
          sub = 'THE READING CROSSED 300 ms, BUT THE CLOCK PASSED 30 s';
        } else if (br > 0.5) {
          cap = 'AT EXACT 300 ms BOUNDARY';
          val = `${rbVerdict} (>= 300)`;
          col = ROLE.fail;
          sub = 'EQUALITY BELONGS TO ROLLBACK';
        } else if (m3 > 0.5) {
          cap = 'AT EXACT 300 ms · AGE 10 s';
          val = 'HOLD OR ROLLBACK?';
          col = ROLE.focus;
          sub = 'DOES THE BOUNDARY ITSELF TRIGGER ROLLBACK?';
        }

        nodes.push(metricReadout(cap, val, 0, 326, { color: col, size: 46, sub }));
        return group(...nodes);
      },
    ),
  );
}
