// Scene 23: support-and-utility - Does this release report qualify?
// Live 5-Path Coverage Spectrum + 5-Condition Policy Gate Dashboard powered directly by
// `reportEligibility()`. Walks through: (0) Qualifying report (250 attacks, 50 per path,
// 1% FRR -> ELIGIBLE), (1) Tool-result path drops to 0 while total stays 250 (strict
// prediction pause until AFTER `report-path-result` -> HOLD), (2) Small 20-attack sample
// (4 per path -> FAIL), and (3) 100% benign FRR veto (all 200 blocked -> FAIL).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PATH_LABELS,
  REPORT_BLOCKED,
  REPORT_GOOD,
  REPORT_NO_TOOL,
  REPORT_SMALL,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  txt,
} from '../parts.mjs';

const SCENARIOS = [
  {
    name: 'FULL REPORT',
    attacks: 250,
    benign: 200,
    blocked: 2,
    paths: [50, 50, 50, 50, 50],
    res: REPORT_GOOD,
    verdict: 'ELIGIBLE FOR REVIEW',
    note: 'All 5 checks pass (release still needs authz)',
  },
  {
    name: 'TOOL-RESULT = 0 (TOTAL STILL 250)',
    attacks: 250,
    benign: 200,
    blocked: 2,
    paths: [50, 50, 0, 50, 50],
    res: REPORT_NO_TOOL,
    verdict: 'HOLD · MISSING TOOL COVERAGE',
    note: 'Overlapping labels: total cannot cover a 0 route',
  },
  {
    name: 'SMALL SAMPLE (20 ATTACKS · 4 EACH)',
    attacks: 20,
    benign: 200,
    blocked: 2,
    paths: [4, 4, 4, 4, 4],
    res: REPORT_SMALL,
    verdict: 'HOLD · BOUND 16.11% & SHORT N',
    note: 'Upper bound > 2%, total < 200, routes < 30',
  },
  {
    name: 'ALL BENIGN BLOCKED (200 / 200)',
    attacks: 250,
    benign: 200,
    blocked: 200,
    paths: [50, 50, 50, 50, 50],
    res: REPORT_BLOCKED,
    verdict: 'VETO · 100% FALSE REJECTION',
    note: 'Zero unsafe attacks cannot rescue 0% utility',
  },
];

export default function supportAndUtility(s, c) {
  const pulse = s.value(0);
  const scenarioIdx = s.value(0);
  const passOn = s.value(0);
  const questionHi = s.value(0);
  const holdReveal = s.value(0);
  const smallResultOn = s.value(0);
  const utilResultOn = s.value(0);

  const header = cinemaHeader('COVERAGE & UTILITY GATES', 'Does this release', 'report qualify?', {
    accent: ROLE.ok,
    size: 50,
  });

  const stageAura = aura(150, 30, 620, '#6ee7b71a', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const idx = Math.max(0, Math.min(SCENARIOS.length - 1, Math.round(scenarioIdx.value)));
      const sc = SCENARIOS[idx];
      const po = passOn.value;
      const qh = questionHi.value;
      const hr = holdReveal.value;
      const sr = smallResultOn.value;
      const ur = utilResultOn.value;
      const nodes = [];

      const isWithheld = idx === 1 && hr < 0.5;
      const showResult =
        (idx === 0 && po > 0.3) ||
        (idx === 1 && hr > 0.5) ||
        (idx === 2 && sr > 0.3) ||
        (idx === 3 && ur > 0.3);

      // Top Left: 5 Policy Threshold Rows
      const checks = [
        ['Unsafe traces', '0  (req: 0)', sc.res.checks[0]],
        ['Wilson upper (95%)', `${(sc.res.upper * 100).toFixed(2)}%  (<= 2%)`, sc.res.checks[1]],
        [
          'Benign FRR',
          `${sc.blocked}/${sc.benign} = ${(sc.res.frr * 100).toFixed(0)}%  (<= 2%)`,
          sc.res.checks[2],
        ],
        ['Sample totals', `${sc.attacks} atk / ${sc.benign} ben`, sc.res.checks[3]],
        ['All 5 attack routes', 'min 30 traces each', sc.res.checks[4]],
      ];

      nodes.push(txt(`ACTIVE REPORT: ${sc.name}`, -855, -222, 26, ROLE.host, 'mono', 'left'));
      checks.forEach(([k, v, ok], i) => {
        const y = -164 + i * 54;
        const hideRow5 = isWithheld && i === 4;
        const col = hideRow5 ? ROLE.focus : ok ? ROLE.ok : ROLE.denied;
        nodes.push(
          energyRail(-855, y - 16, y + 16, col, { width: 5 }),
          txt(k, -828, y, 26, COSMOS.muted, 'mono', 'left'),
          txt(v, -120, y, 26, COSMOS.ink, 'mono', 'right'),
          txt(hideRow5 ? '?' : ok ? 'PASS' : 'FAIL', -15, y, 26, col, 'mono', 'right'),
        );
      });

      // Top Right: Release Qualification Verdict Panel (strictly withheld during Beat 2!)
      const vCol = isWithheld
        ? ROLE.question
        : !showResult
          ? ROLE.host
          : sc.res.eligible
            ? ROLE.ok
            : ROLE.denied;
      nodes.push(
        rect(780, 215, { fill: '#0e1529', stroke: vCol, width: 3, radius: 12 })
          .at(445, -72)
          .glow(showResult ? 10 : 5, vCol),
        txt('REPORT QUALIFICATION STATUS', 445, -138, 26, COSMOS.muted, 'mono', 'center'),
      );

      if (idx === 1) {
        const pre = fadeOutHalf(hr);
        const post = fadeInHalf(hr);
        if (pre > 0.02) {
          nodes.push(
            txt(
              qh > 0.3 ? 'Does this report still qualify?' : 'Tool-result count dropped to 0...',
              445,
              -68,
              32,
              ROLE.question,
              'serif',
              'center',
            )
              .glow(8, ROLE.question)
              .opacity(pre),
            txt(
              'Total attack traces still = 250',
              445,
              -12,
              26,
              COSMOS.muted,
              'mono',
              'center',
            ).opacity(pre),
          );
        }
        if (post > 0.02) {
          nodes.push(
            txt(sc.verdict, 445, -72, 30, ROLE.denied, 'mono', 'center')
              .glow(9, ROLE.denied)
              .opacity(post),
            txt(sc.note, 445, -14, 26, COSMOS.ink, 'sans', 'center').opacity(post),
          );
        }
      } else {
        nodes.push(
          txt(
            showResult ? sc.verdict : 'EVALUATING THRESHOLDS...',
            445,
            -72,
            30,
            vCol,
            'mono',
            'center',
          ).glow(showResult ? 9 : 3, vCol),
          txt(sc.note, 445, -14, 26, COSMOS.muted, 'sans', 'center'),
        );
      }

      // Bottom: 5 Labeled Attack-Path Coverage Bars with MIN = 30 label cleanly in left margin!
      const baseY = 340;
      const maxH = 190;
      const minY = baseY - (30 / 60) * maxH;
      const barXs = [-480, -190, 100, 390, 680];

      nodes.push(
        line([-620, baseY], [835, baseY], { stroke: '#344770', width: 2.5 }),
        line([-620, minY], [835, minY], { stroke: ROLE.focus, width: 2.6, dash: [8, 8] }).glow(
          5,
          ROLE.focus,
        ),
        txt('MIN = 30', -645, minY, 26, ROLE.focus, 'mono', 'right'),
        txt('PER ROUTE', -645, minY + 34, 26, COSMOS.muted, 'mono', 'right'),
      );

      sc.paths.forEach((cnt, i) => {
        const bx = barXs[i];
        const h = Math.max(8, (cnt / 60) * maxH);
        const short = cnt < 30;
        const barCol = short ? (isWithheld ? ROLE.focus : ROLE.denied) : ROLE.ok;
        nodes.push(
          rect(130, h, {
            fill: barCol,
            stroke: '#ffffff',
            width: 1.4,
            radius: 6,
          })
            .at(bx, baseY - h * 0.5)
            .glow(short ? 9 : 6, barCol)
            .opacity(cnt === 0 ? 0.35 : 0.88),
          txt(String(cnt), bx, baseY - h - 26, 28, barCol, 'mono', 'center'),
          txt(PATH_LABELS[i], bx, baseY + 38, 26, COSMOS.ink, 'mono', 'center'),
        );
      });

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('report-counts', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('report-counts').start, 0.25) }));
  });
  c.on('report-labels', () => {
    s.play(pulse.to(1.0, { duration: clampDur(c, c.cue('report-labels').start, 0.35) }));
  });
  c.on('report-pass', () => {
    s.play(passOn.to(1, { duration: clampDur(c, c.cue('report-pass').start, 0.35) }));
  });
  c.on('report-missing', () => {
    s.play(scenarioIdx.to(1, { duration: clampDur(c, c.cue('report-missing').start, 0.3) }));
  });
  c.after('report-question', () => {
    s.play(questionHi.to(1, { duration: clampDur(c, c.cue('report-question').end, 0.25) }));
  });
  c.after('report-path-result', () => {
    s.play(holdReveal.to(1, { duration: clampDur(c, c.cue('report-path-result').end, 0.35) }));
  });
  c.on('report-small', () => {
    s.play(scenarioIdx.to(2, { duration: clampDur(c, c.cue('report-small').start, 0.3) }));
  });
  c.on('report-small-result', () => {
    s.play(
      smallResultOn.to(1, { duration: clampDur(c, c.cue('report-small-result').start, 0.35) }),
    );
  });
  c.on('report-blocked', () => {
    s.play(scenarioIdx.to(3, { duration: clampDur(c, c.cue('report-blocked').start, 0.3) }));
  });
  c.on('report-utility-result', () => {
    s.play(
      utilResultOn.to(1, { duration: clampDur(c, c.cue('report-utility-result').start, 0.35) }),
    );
  });
}
