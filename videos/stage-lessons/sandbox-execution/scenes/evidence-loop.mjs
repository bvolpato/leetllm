// Scene 02 (evidence-loop): "Scan the report in order"
// Live luminous XML scanner + non-overlapping contract/attempt/edge-case laser matrix.
import {
  CASES,
  COSMOS,
  REPORT_XML,
  ROLE,
  cinemaAtmosphere,
  crossSwap,
  evidenceSnapshot,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  parserIdentities,
  repairSceneSnapshot,
  repairTrace,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

const oneCase = (children, attrs = 'classname="A" name="x"') =>
  `<testsuite xmlns="urn:junit" xmlns:other="urn:other"><testcase ${attrs}>${children}</testcase></testsuite>`;

const rejectsXml = (xml) => {
  try {
    parserIdentities(xml);
    return false;
  } catch {
    return true;
  }
};

export default function evidenceLoop(s, c) {
  const trace = repairTrace();
  const decisions = evidenceSnapshot(2, 1).decisions;
  const expectedRows = ['ReportParser::rejectsFailure', 'ReportParser::handlesError'];

  // Verify every edge case spoken in Beat 3 against the real parser model
  verifyInvariant(parserIdentities(REPORT_XML).join('|') === expectedRows.join('|'), '2 rows');
  verifyInvariant(parserIdentities(oneCase('<skipped/><error/>')).length === 0, 'skip wins');
  verifyInvariant(parserIdentities(oneCase('<other:failure/>')).length === 0, 'foreign ignored');
  verifyInvariant(
    parserIdentities(oneCase('<details><failure/></details>')).length === 0,
    'nested ignored',
  );
  verifyInvariant(
    parserIdentities(oneCase('<failure/><error/>')).join('|') === 'A::x',
    'both -> 1 row',
  );
  verifyInvariant(rejectsXml(oneCase('<failure/>', 'classname="A" name=" "')), 'blank rejected');
  verifyInvariant(rejectsXml('<testsuite>'), 'malformed XML rejected');

  const phase = s.value(0);
  const leftMode = s.value(0); // 0=contract, 1=attempt/repair, 2=edge-case table
  const mode0 = s.value(1);
  const mode1 = s.value(0);
  const mode2 = s.value(0);

  // Beat 0 contract highlights
  const litFail = s.value(0);
  const litId = s.value(0);
  const litOrder = s.value(0);
  const litDedupe = s.value(0);

  // Beat 1 attempt + packet
  const scanRow = s.value(-1);
  const showMissing = s.value(0);
  const pktStep = s.value(0);

  // Beat 2 repair + 4 rows
  const repaired = s.value(0);
  const nsHot = s.value(0);
  const rowDone = [s.value(0), s.value(0), s.value(0), s.value(0)];
  const showPassed = s.value(0);
  const showBroader = s.value(0);

  // Beat 3 edge cases (8 snippets + verdicts)
  const edgeSpec = [
    {
      code: '<skipped/><error/>',
      verdict: 'skip wins (0 rows)',
      color: COSMOS.muted,
      at: 'ev-skip',
      res: 'ev-skip-wins',
    },
    {
      code: '<other:failure/>',
      verdict: 'foreign ns ignored',
      color: COSMOS.muted,
      at: 'ev-foreign',
      res: 'ev-nocount',
    },
    {
      code: '<details><failure/></details>',
      verdict: 'nested ignored',
      color: COSMOS.muted,
      at: 'ev-nested',
      res: 'ev-nocount',
    },
    {
      code: '<failure/><error/>',
      verdict: '1 unique row',
      color: ROLE.pass,
      at: 'ev-both',
      res: 'ev-one',
    },
    {
      code: 'name=" "',
      verdict: 'rejected (error)',
      color: ROLE.candidate,
      at: 'ev-blank',
      res: 'ev-blank',
    },
    {
      code: '<testsuite>',
      verdict: 'malformed rejected',
      color: ROLE.candidate,
      at: 'ev-malformed',
      res: 'ev-malformed',
    },
    {
      code: 'if case.find(tag):',
      verdict: 'False on <failure/>!',
      color: ROLE.candidate,
      at: 'ev-truthy',
      res: 'ev-false',
    },
    {
      code: 'case.find(tag) is not None',
      verdict: 'True (explicit)',
      color: ROLE.pass,
      at: 'ev-exists',
      res: 'ev-exists',
    },
  ];
  const edgeCodeVis = edgeSpec.map(() => s.value(0));
  const edgeAnsVis = edgeSpec.map(() => s.value(0));
  const firstHot = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.evidence, ROLE.pass);
  const title = heroTitle(['Scan the Report', 'in Order'], {
    x: -860,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.evidence,
    eyebrow: 'EVIDENCE-DRIVEN REPAIR LOOP',
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = mode0.value;
    const m1 = mode1.value;
    const m2 = mode2.value;
    const sc = Math.round(scanRow.value);
    const missOp = showMissing.value;
    const rep = repaired.value;
    const ns = nsHot.value;
    const fHot = firstHot.value;
    const nodes = [];

    // Top-right: real 4-case XML fixture with live laser scanner & verdicts
    const rx = -400;
    const ry = -425;
    nodes.push(
      txt(
        '<testsuite xmlns="urn:junit">',
        rx,
        ry,
        26,
        ns > 0.4 ? ROLE.mark : ROLE.evidence,
        'mono',
        'left',
      ).glow(ns > 0.4 ? 10 : 4, ns > 0.4 ? ROLE.mark : ROLE.evidence),
    );

    const caseLines = [
      'X1  ReportParser::rejectsFailure  <failure/>',
      'X2  ReportParser::rejectsFailure  <failure/>',
      'X3  ReportParser::handlesError    <error/>',
      'X4  ReportParser::skipsSlowCase   <skipped/>',
    ];
    const keptFlags = [true, false, true, false];
    caseLines.forEach((lineStr, i) => {
      const y = ry + 50 + i * 54;
      const active = sc === i;
      const done = rowDone[i].value;
      const isDupFaded = m0 > 0.4 && litDedupe.value > 0.4 && i === 1;
      const isFirstPair = fHot > 0.4 && (i === 0 || i === 1);
      const col = isFirstPair
        ? ROLE.mark
        : active
          ? ROLE.mark
          : done > 0.5 && keptFlags[i]
            ? ROLE.pass
            : litFail.value > 0.4 && m0 > 0.4 && i < 3
              ? ROLE.mark
              : ROLE.ink;
      if (active) {
        nodes.push(
          lumBar(-40, y, 760, 46, {
            color: missOp > 0.5 && i === 0 ? ROLE.candidate : ROLE.mark,
            fillOpacity: 0.16,
            strokeWidth: 2,
            glow: 9,
          }),
        );
      }
      nodes.push(txt(lineStr, rx + 20, y, 26, col, 'mono', 'left').opacity(isDupFaded ? 0.35 : 1));
      if (done > 0.02) {
        nodes.push(
          txt(
            decisions[i].decision,
            855,
            y,
            26,
            keptFlags[i] ? ROLE.pass : COSMOS.muted,
            'mono',
            'right',
          ).opacity(done),
        );
      } else if (missOp > 0.02 && i === 0) {
        nodes.push(
          txt(trace.first.error, 855, y, 26, ROLE.candidate, 'mono', 'right')
            .glow(8, ROLE.candidate)
            .opacity(missOp),
        );
      }
    });
    nodes.push(txt('</testsuite>', rx, ry + 272, 26, ROLE.evidence, 'mono', 'left'));

    // Bottom-right: Validator expected output ledger (persistent anchor)
    const vx = 250;
    const vy = -72;
    nodes.push(
      txt('TRUSTED VALIDATOR  /  EXPECTED ROWS', vx, vy, 26, ROLE.pass, 'mono', 'left'),
      rule(vx, vy + 24, 855, vy + 24, ROLE.pass, 2),
    );
    expectedRows.forEach((rowStr, idx) => {
      const y = vy + 74 + idx * 66;
      const matched = idx === 0 ? rowDone[0].value : rowDone[2].value;
      const showRow = Math.max(litId.value, m1, m2);
      const showNum = Math.max(litOrder.value, m1, m2);
      if (showNum > 0.02) {
        nodes.push(
          txt(
            `${idx + 1}.`,
            vx,
            y,
            28,
            matched > 0.5 ? ROLE.pass : COSMOS.muted,
            'mono',
            'left',
          ).opacity(showNum),
        );
      }
      if (showRow > 0.02) {
        nodes.push(
          txt(
            rowStr,
            vx + 46,
            y,
            28,
            matched > 0.5 ? ROLE.pass : ROLE.evidence,
            'mono',
            'left',
          ).opacity(showRow),
        );
      }
      if (matched > 0.02) {
        nodes.push(glowDot(832, y, { radius: 8, color: ROLE.pass, glow: 12, opacity: matched }));
      }
    });

    if (showPassed.value > 0.02) {
      nodes.push(
        lumBar(552, 165, 605, 58, {
          color: ROLE.pass,
          fillOpacity: 0.18,
          strokeWidth: 2.2,
          glow: 9,
          opacity: showPassed.value,
        }),
        txt(`MATCH: ${repairSceneSnapshot(2).status}`, 552, 165, 28, ROLE.pass, 'mono').opacity(
          showPassed.value,
        ),
      );
    }
    if (showBroader.value > 0.02) {
      nodes.push(
        txt(
          'Other XML producers need their own fixture',
          vx,
          248,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showBroader.value),
      );
    }

    // Bottom-left panel: switches cleanly across m0 (contract), m1 (attempt/repair), m2 (edge cases)
    const lx = -860;
    const ly = -72;
    if (m0 > 0.02) {
      const cRules = [
        ['1. Report failed or errored tests', litFail.value],
        ['2. Identity format: class::name', litId.value],
        ['3. Preserve first-seen order', litOrder.value],
        ['4. Remove duplicate pairs', litDedupe.value],
      ];
      nodes.push(
        txt('FIXTURE CONTRACT', lx, ly, 26, ROLE.mark, 'mono', 'left').opacity(m0),
        rule(lx, ly + 24, 150, ly + 24, ROLE.rule, 2).opacity(m0),
      );
      cRules.forEach(([label, lit], i) => {
        nodes.push(
          txt(
            label,
            lx,
            ly + 74 + i * 64,
            30,
            lit > 0.4 ? COSMOS.ink : COSMOS.dim,
            'sans',
            'left',
          ).opacity(m0),
        );
      });
    }

    if (m1 > 0.02) {
      const codeStr =
        rep > 0.5
          ? 'if tags & {ns + "failure", ns + "error"}:'
          : 'if case.attrib["status"] == "failed":';
      const codeCol = rep > 0.5 ? ROLE.pass : missOp > 0.5 ? ROLE.candidate : ROLE.mark;
      nodes.push(
        txt(
          rep > 0.5 ? 'REPAIRED LOOKUP  (direct children + root ns)' : 'ATTEMPT 1 LOOKUP',
          lx,
          ly,
          26,
          codeCol,
          'mono',
          'left',
        ).opacity(m1),
        lumBar(-355, ly + 56, 1010, 56, {
          color: codeCol,
          fillOpacity: 0.16,
          strokeWidth: 2.2,
          glow: 9,
          opacity: m1,
        }),
        txt(codeStr, lx + 18, ly + 56, 28, COSMOS.ink, 'mono', 'left').opacity(m1),
      );

      // Bounded evidence packet fields
      const pStep = pktStep.value;
      const pktOpacity = m1 * (rep > 0.5 ? 0.52 : 1);
      const pktRows = [
        ['command', 'python parse.py report.xml'],
        ['exit code', '1'],
        ['exception', trace.first.error],
        ['stderr tail', `${trace.first.error} (byte-capped)`],
      ];
      if (pStep >= 0.5) {
        nodes.push(
          txt('BOUNDED REPAIR EVIDENCE', lx, ly + 132, 26, ROLE.evidence, 'mono', 'left').opacity(
            pktOpacity,
          ),
        );
      }
      pktRows.forEach(([k, v], i) => {
        if (pStep >= i + 0.5) {
          const y = ly + 180 + i * 54;
          nodes.push(
            txt(k, lx, y, 26, COSMOS.muted, 'mono', 'left').opacity(pktOpacity),
            txt(v, lx + 225, y, 26, ROLE.evidence, 'mono', 'left').opacity(pktOpacity),
          );
        }
      });
    }

    if (m2 > 0.02) {
      nodes.push(
        txt('EDGE-CASE CONTRACT PROBES', lx, ly - 18, 26, ROLE.mark, 'mono', 'left').opacity(m2),
        rule(lx, ly + 6, 175, ly + 6, ROLE.rule, 2).opacity(m2),
      );
      edgeSpec.forEach((item, i) => {
        const cVis = edgeCodeVis[i].value * m2;
        const aVis = edgeAnsVis[i].value * m2;
        const y = ly + 42 + i * 50;
        if (cVis > 0.02) {
          nodes.push(txt(item.code, lx, y, 26, ROLE.evidence, 'mono', 'left').opacity(cVis));
        }
        if (aVis > 0.02) {
          nodes.push(txt(item.verdict, 170, y, 26, item.color, 'sans', 'right').opacity(aVis));
        }
      });
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);
  runAmbientPhase(s, c, phase, 2.5);

  // Beat 0: Contract
  tweenCue(s, c, 'ev-fixture', leftMode, 0, { duration: 0.25 });
  tweenCue(s, c, 'ev-failed', litFail, 1, { duration: 0.35 });
  tweenCue(s, c, 'ev-identity', litId, 1, { duration: 0.35 });
  tweenCue(s, c, 'ev-order', litOrder, 1, { duration: 0.35 });
  tweenCue(s, c, 'ev-dedupe', litDedupe, 1, { duration: 0.35 });

  // Beat 1: Attempt 1 fails & captures bounded evidence
  c.onBeat(1, () => {
    s.play(mode0.to(0, { duration: 0.22 }));
  });
  c.on('ev-asks', () => {
    mode0.set(0);
    s.play(mode1.to(1, { duration: 0.25 }), scanRow.to(0, { duration: 0.25 }));
  });
  tweenCue(s, c, 'ev-missing', showMissing, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'ev-command', pktStep, 1, { duration: 0.25 });
  tweenCue(s, c, 'ev-exit', pktStep, 2, { duration: 0.25 });
  tweenCue(s, c, 'ev-error', pktStep, 3, { duration: 0.25 });
  tweenCue(s, c, 'ev-excerpt', pktStep, 4, { duration: 0.25 });

  // Beat 2: Repair & scan 4 rows
  c.on('ev-repair', () => {
    s.play(
      showMissing.to(0, { duration: 0.2 }),
      repaired.to(1, { duration: 0.4 }),
      scanRow.to(-1, { duration: 0.2 }),
    );
  });
  tweenCue(s, c, 'ev-namespace', nsHot, 1, { duration: 0.35 });
  CASES.forEach((_, i) => {
    c.on(`ev-row-${i}`, () => {
      s.play(scanRow.to(i, { duration: 0.2 }), rowDone[i].to(1, { duration: 0.35 }));
    });
  });
  c.after('ev-check', () => {
    s.play(scanRow.to(-1, { duration: 0.25 }), showPassed.to(1, { duration: 0.35 }));
  });
  tweenCue(s, c, 'ev-broader', showBroader, 1, { duration: 0.35 });

  // Beat 3: Edge cases
  crossSwap(s, c, 'ev-edge', mode1, mode2, { duration: 0.4 });
  tweenCue(s, c, 'ev-first', firstHot, 1, { duration: 0.4 });
  edgeSpec.forEach((item, i) => {
    tweenCue(s, c, item.at, edgeCodeVis[i], 1, { duration: 0.25 });
    tweenCue(s, c, item.res, edgeAnsVis[i], 1, { duration: 0.25, after: true });
  });
}
