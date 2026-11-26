import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  accepted,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  glowMeter,
  guardedDynamic,
  metricReadout,
  retained,
  sum,
  txt,
} from '../parts.mjs';

export function buildMetricDenominators(s, c) {
  s.add(aura(-460, -40, 540, ROLE.ed, COSMOS.bg));
  s.add(aura(460, 120, 540, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'DENOMINATOR DISCIPLINE',
      'Separate distinct suggestions',
      'from retained original chars',
      {
        x: -860,
        y: -445,
        accent: ROLE.ed,
        size: 46,
      },
    ),
  );

  const accT = s.value(0);
  const retT = s.value(0);
  const partialT = s.value(0);
  const studyT = s.value(0);

  c.on('cc-accept75', () =>
    s.play(accT.to(1, { duration: clampDur(c, c.cue('cc-accept75').start, 0.55) })),
  );
  c.on('cc-retain39-64', () =>
    s.play(retT.to(1, { duration: clampDur(c, c.cue('cc-retain39-64').start, 0.55) })),
  );
  c.on('cc-partial-distinct', () =>
    s.play(partialT.to(1, { duration: clampDur(c, c.cue('cc-partial-distinct').start, 0.55) })),
  );
  c.on('cc-metric-denominators-2', () =>
    s.play(studyT.to(1, { duration: clampDur(c, c.cue('cc-metric-denominators-2').start, 0.55) })),
  );

  // Left table: 4 completed IDs + 1 explicit censored row
  const tableRows = [
    { id: 'S1', ins: `${accepted[0]}`, ret: `${retained[0]}`, win: 'DONE', col: ROLE.fail },
    { id: 'S2', ins: `${accepted[1]}`, ret: `${retained[1]}`, win: 'DONE', col: ROLE.ok },
    { id: 'S3', ins: `${accepted[2]}`, ret: `${retained[2]}`, win: 'DONE', col: ROLE.focus },
    { id: 'S4', ins: `${accepted[3]}`, ret: `${retained[3]}`, win: 'DONE', col: COSMOS.muted },
    { id: 'S5', ins: '24', ret: '?', win: 'CENSORED', col: ROLE.warn },
  ];

  s.add(txt('ID', -835, -225, 26, COSMOS.muted, 'mono', 'left'));
  s.add(txt('INSERTED', -710, -225, 26, COSMOS.muted, 'mono', 'left'));
  s.add(txt('RETAINED', -485, -225, 26, COSMOS.muted, 'mono', 'left'));
  s.add(txt('WINDOW', -265, -225, 26, COSMOS.muted, 'mono', 'left'));
  s.add(line([-850, -196], [-45, -196], { stroke: '#233152', width: 2 }));

  tableRows.forEach((r, idx) => {
    const y = -132 + idx * 82;
    s.add(glowDot(-822, y, { radius: 7, color: r.col, glow: 7 }));
    s.add(txt(r.id, -792, y, 28, r.col, 'mono', 'left'));
    s.add(txt(r.ins, -660, y, 28, COSMOS.ink, 'mono', 'center'));
    s.add(txt(r.ret, -435, y, 28, r.col, 'mono', 'center'));
    s.add(txt(r.win, -265, y, 26, r.col, 'mono', 'left'));
    if (idx === 3) {
      s.add(line([-850, y + 40], [-45, y + 40], { stroke: ROLE.warn, width: 2, dash: [8, 6] }));
    }
  });

  s.add(txt('S5 EXCLUDED FROM RATE (NOT DELETED)', -835, 275, 26, ROLE.warn, 'mono', 'left'));

  // Right side: two glowing ratio gauges + rules
  const insTotal = sum(accepted);
  const retTotal = sum(retained);
  const retPct = ((retTotal / insTotal) * 100).toFixed(1);

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const a = accT.value;
        const r = retT.value;
        const p = partialT.value;
        const st = studyT.value;
        const nodes = [];

        // Ratio 1: Acceptance
        nodes.push(txt('DISTINCT ACCEPTANCE RATE', 65, -225, 26, ROLE.ed, 'mono', 'left'));
        nodes.push(
          glowMeter(65, -158, 760, 42, 0.75 * Math.max(0.25, a), {
            fill: ROLE.ed,
            glow: a > 0.5 ? 10 : 4,
          }),
        );
        nodes.push(
          txt(
            a > 0.5 ? '3 accepted IDs / 4 shown IDs = 75.0%' : '3 accepted IDs / 4 shown IDs',
            65,
            -98,
            28,
            a > 0.5 ? ROLE.ed : COSMOS.ink,
            'mono',
            'left',
          ),
        );

        // Ratio 2: Retention
        nodes.push(txt('ORIGINAL-CHAR RETENTION', 65, -10, 26, ROLE.ok, 'mono', 'left'));
        nodes.push(
          glowMeter(65, 56, 760, 42, (retTotal / insTotal) * Math.max(0.25, r), {
            fill: ROLE.ok,
            glow: r > 0.5 ? 10 : 4,
          }),
        );
        nodes.push(
          txt(
            r > 0.5
              ? `${retTotal} retained / ${insTotal} inserted = ${retPct}%`
              : `${retTotal} original chars / ${insTotal} inserted`,
            65,
            116,
            28,
            r > 0.5 ? ROLE.ok : COSMOS.ink,
            'mono',
            'left',
          ),
        );

        // Rule badges below (open typography)
        if (p > 0.3) {
          nodes.push(
            txt(
              'PARTIAL ACCEPTS ON 1 ID = 1 ACCEPTED SUGGESTION',
              65,
              214,
              26,
              ROLE.focus,
              'mono',
              'left',
            ).opacity(p),
          );
          nodes.push(
            txt(
              '0 SHOWN OR 0 INSERTED -> RATE UNDEFINED',
              65,
              264,
              26,
              COSMOS.muted,
              'mono',
              'left',
            ).opacity(p),
          );
        }

        if (st > 0.3) {
          nodes.push(line([-860, 354], [840, 354], { stroke: '#233152', width: 2 }).opacity(st));
          nodes.push(
            metricReadout('2022 COPILOT STUDY', '27% ACCEPT', -510, 434, {
              color: ROLE.model,
              size: 40,
            }).opacity(st),
          );
          nodes.push(
            txt(
              'ACCEPTANCE TRACKED SELF-REPORTED PRODUCTIVITY MORE CLOSELY THAN PERSISTENCE',
              210,
              434,
              26,
              COSMOS.ink,
              'mono',
              'center',
            ).opacity(st),
          );
        }

        return group(...nodes);
      },
    ),
  );
}
