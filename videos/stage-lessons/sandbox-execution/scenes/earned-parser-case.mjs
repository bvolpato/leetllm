// Scene 13 (earned-parser-case): "A fresh report in slot A"
// Transfer finale: fresh urn:fresh XML report grading -> Slot A containment & scratch reset gate
// with orbiting 3D isolation shield and generation-8 admission.
import {
  COSMOS,
  FRESH_CASES,
  FRESH_REPORT_XML,
  NEXT_WORKER_ID,
  ROLE,
  WORKER_ID,
  buildSandboxCage3d,
  cinemaAtmosphere,
  crossSwap,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  parserIdentities,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  verdictAxes,
  verifyInvariant,
} from '../parts.mjs';

export default function earnedParserCase(s, c) {
  const actual = parserIdentities(FRESH_REPORT_XML);
  verifyInvariant(actual.join('|') === 'payments::retry', 'fresh report yields payments::retry');
  verifyInvariant(
    verdictAxes({ functional: true, enforcedDeny: true, terminated: true, reset: false }).slot ===
      'quarantined',
    'leftover scratch file quarantines slot A',
  );
  verifyInvariant(
    verdictAxes({ functional: true, enforcedDeny: true, terminated: true, reset: true }).slot ===
      'reusable',
    'empty scratch listing makes slot A reusable',
  );

  const xmlLines = FRESH_REPORT_XML.split('\n').filter((l) => l.includes('<testcase'));
  const kidsList = xmlLines.map((l) => l.slice(l.indexOf('>') + 1, l.lastIndexOf('</testcase>')));
  const reasons = ['keep first (1 row)', 'skipped wins', 'nested too deep', 'duplicate ignored'];

  const phase = s.value(0);
  const modeParse = s.value(1);
  const modeSlot = s.value(0);

  // Phase 0: Fresh report grading
  const caseHot = FRESH_CASES.map(() => s.value(0));
  const caseAct = FRESH_CASES.map(() => s.value(0));
  const parseAsk = s.value(0);
  const parseAns = s.value(0);

  // Phase 1: Slot A admission bay
  const showConn = s.value(0);
  const showDeny = s.value(0);
  const showEmptyJob = s.value(0);
  const showBase = s.value(0);
  const showLeftover = s.value(0);
  const showClean = s.value(0);
  const bayStarted = s.value(0);
  const gateStarted = s.value(0);
  const slotAsk = s.value(0);
  const slotQuar = s.value(0);
  const slotReady = s.value(0);
  const g8Admit = s.value(0);
  const showLate = s.value(0);
  const showIgnored = s.value(0);
  const passHot = s.value(0);
  const showWorkstation = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.pass, ROLE.host);
  const { view: cage3d } = buildSandboxCage3d(phase, slotQuar, {
    x: 640,
    y: -325,
    theta: -0.7,
    phi: 1.05,
    distance: 22.5,
    unit: 72,
    innerColor: ROLE.pass,
    ringColor: ROLE.host,
    outerColor: ROLE.mark,
  });

  const title = heroTitle(['A Fresh Report', 'in Slot A'], {
    x: -860,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.pass,
    eyebrow: 'EARNED TRANSFER  /  PARSE & ADMIT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const mp = modeParse.value;
    const ms = modeSlot.value;
    const nodes = [];

    nodes.push(
      txt('SLOT A CONTAINMENT SHIELD', 640, -458, 26, ROLE.host, 'mono').glow(5, ROLE.host),
    );

    // === PHASE 0: Fresh XML report grading ===
    if (mp > 0.02) {
      const lx = -860;
      const topY = -170;
      nodes.push(
        txt(
          'report.xml  /  xmlns="urn:fresh"  /  class="payments"',
          lx,
          topY,
          28,
          ROLE.evidence,
          'mono',
          'left',
        ).opacity(mp),
        rule(lx, topY + 28, 360, topY + 28, ROLE.evidence, 2).opacity(mp),
      );

      FRESH_CASES.forEach((tc, i) => {
        const y = topY + 86 + i * 90;
        const hot = caseHot[i].value;
        const act = caseAct[i].value;
        nodes.push(
          lumBar(-10, y, 1700, 74, {
            color: act > 0.5 && i === 0 ? ROLE.pass : hot > 0.4 ? ROLE.mark : COSMOS.rule,
            fillOpacity: hot > 0.4 ? 0.14 : 0.07,
            strokeWidth: hot > 0.4 ? 2.2 : 1.5,
            glow: hot > 0.4 ? 8 : 0,
            opacity: mp,
          }),
          txt(tc.name, lx + 24, y, 32, COSMOS.ink, 'mono', 'left').opacity(mp),
          txt(
            kidsList[i],
            lx + 260,
            y,
            30,
            hot > 0.4 ? ROLE.mark : ROLE.evidence,
            'mono',
            'left',
          ).opacity(mp),
        );
        if (act > 0.02) {
          nodes.push(
            txt(
              reasons[i],
              815,
              y,
              28,
              i === 0 ? ROLE.pass : COSMOS.muted,
              'sans',
              'right',
            ).opacity(mp * act),
          );
        }
      });

      const fy = 335;
      if (parseAsk.value > 0.02) {
        nodes.push(
          txt(
            'Which rows should the validator expect, in order?',
            lx,
            fy,
            40,
            ROLE.mark,
            'serif',
            'left',
          )
            .glow(8, ROLE.mark)
            .opacity(mp * parseAsk.value),
        );
      }
      if (parseAns.value > 0.02) {
        nodes.push(
          lumBar(-255, fy, 1210, 74, {
            color: ROLE.pass,
            fillOpacity: 0.18,
            strokeWidth: 2.5,
            glow: 10,
            opacity: mp * parseAns.value,
          }),
          txt(
            `EXPECTED:  1 row  ->  ${actual[0]}`,
            lx + 24,
            fy,
            34,
            ROLE.pass,
            'mono',
            'left',
          ).opacity(mp * parseAns.value),
        );
      }
    }

    // === PHASE 1: Slot A Containment & Scratch Reset Bay ===
    if (ms > 0.02) {
      const lx = -860;
      const rx = 20;
      const topY = -215;

      // Left column: Run evidence dossier
      nodes.push(
        txt(`RUN EVIDENCE  /  ${WORKER_ID}`, lx, topY, 26, ROLE.host, 'mono', 'left').opacity(ms),
        rule(lx, topY + 24, -60, topY + 24, ROLE.host, 2).opacity(ms),
        lumBar(lx + 390, topY + 86, 780, 62, {
          color: passHot.value > 0.4 ? ROLE.mark : ROLE.pass,
          fillOpacity: 0.16,
          strokeWidth: 2.2,
          glow: 9,
          opacity: ms,
        }),
        txt(`PASS  /  ${actual[0]}`, lx + 24, topY + 86, 30, ROLE.pass, 'mono', 'left').opacity(ms),
      );

      if (showConn.value > 0.02) {
        nodes.push(
          txt(
            'Egress probe: connection failed (why?)',
            lx,
            topY + 178,
            28,
            ROLE.mark,
            'sans',
            'left',
          ).opacity(ms * showConn.value),
        );
      }
      if (showDeny.value > 0.02) {
        nodes.push(
          glowDot(lx + 12, topY + 178, {
            radius: 8,
            color: ROLE.pass,
            opacity: ms * showDeny.value,
          }),
          txt(
            'Policy log: outbound connection DENIED',
            lx + 36,
            topY + 178,
            28,
            ROLE.host,
            'sans',
            'left',
          ).opacity(ms * showDeny.value),
        );
      }
      if (showEmptyJob.value > 0.02) {
        nodes.push(
          glowDot(lx + 12, topY + 244, {
            radius: 8,
            color: ROLE.pass,
            opacity: ms * showEmptyJob.value,
          }),
          txt(
            'Job processes remaining: 0',
            lx + 36,
            topY + 244,
            28,
            ROLE.pass,
            'mono',
            'left',
          ).opacity(ms * showEmptyJob.value),
        );
      }
      if (showBase.value > 0.02) {
        nodes.push(
          glowDot(lx + 12, topY + 310, {
            radius: 8,
            color: ROLE.pass,
            opacity: ms * showBase.value,
          }),
          txt(
            'All other baseline reset checks passed',
            lx + 36,
            topY + 310,
            28,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(ms * showBase.value),
        );
      }

      // Right column: Scratch directory + Slot A admission bay
      nodes.push(
        txt('SCRATCH DIRECTORY CHECK', rx, topY, 26, ROLE.host, 'mono', 'left').opacity(ms),
        rule(rx, topY + 24, 855, topY + 24, ROLE.host, 2).opacity(ms),
        txt('Expected baseline:', rx, topY + 78, 26, COSMOS.muted, 'mono', 'left').opacity(ms),
        txt('[]', rx + 340, topY + 78, 34, ROLE.pass, 'mono', 'left').opacity(ms),
        txt('Observed in slot A:', rx, topY + 148, 26, COSMOS.muted, 'mono', 'left').opacity(ms),
      );
      if (showLeftover.value > 0.02) {
        nodes.push(
          txt('["last-report.xml"]', rx + 340, topY + 148, 30, ROLE.candidate, 'mono', 'left')
            .glow(8, ROLE.candidate)
            .opacity(ms * showLeftover.value),
        );
      }
      if (showClean.value > 0.02) {
        nodes.push(
          txt('[]   (rescan clean)', rx + 340, topY + 148, 30, ROLE.pass, 'mono', 'left')
            .glow(8, ROLE.pass)
            .opacity(ms * showClean.value),
        );
      }

      // Admission bay for worker-A / g8 (always visible in Phase 1 so lower canvas stays populated)
      const bayY = 125;
      const admit = g8Admit.value;
      const qVis = Math.max(showLeftover.value, showClean.value);
      const qOp = qVis * Math.max(0, 1 - admit * 3.4);
      const dOp = qVis * Math.max(0, (admit - 0.65) / 0.35);

      nodes.push(
        txt('SLOT A ADMISSION BAY', rx, bayY - 52, 26, ROLE.host, 'mono', 'left').opacity(ms),
        rule(rx, bayY - 26, 855, bayY - 26, ROLE.rule, 2).opacity(ms),
        lumBar(rx + 620, bayY + 34, 340, 76, {
          color: admit > 0.7 ? ROLE.pass : ROLE.host,
          fillOpacity: 0.14,
          strokeWidth: 2.2,
          dash: admit > 0.7 ? undefined : [8, 6],
          opacity: ms,
        }),
      );
      if (bayStarted.value < 0.5) {
        nodes.push(
          txt('slot A idle', rx + 620, bayY + 34, 26, COSMOS.muted, 'mono').opacity(ms),
          txt('awaiting reset checks', rx, bayY + 34, 26, COSMOS.dim, 'sans', 'left').opacity(ms),
        );
      }
      if (qOp > 0.02) {
        nodes.push(
          lumBar(rx + 150, bayY + 34, 290, 58, {
            color: ROLE.warn,
            fillOpacity: 0.2,
            strokeWidth: 2.2,
            glow: 9,
            opacity: ms * qOp,
          }),
          txt(NEXT_WORKER_ID, rx + 150, bayY + 34, 28, COSMOS.ink, 'mono').opacity(ms * qOp),
          txt('queued', rx + 150, bayY + 92, 26, COSMOS.muted, 'mono').opacity(ms * qOp),
        );
      }
      if (admit > 0.15 && admit < 0.85) {
        const px = rx + 305 + ((admit - 0.15) / 0.7) * 140;
        nodes.push(glowDot(px, bayY + 34, { radius: 10, color: ROLE.pass, glow: 14, opacity: ms }));
      }
      if (dOp > 0.02) {
        nodes.push(
          txt(
            NEXT_WORKER_ID,
            rx + 620,
            bayY + 34,
            28,
            showIgnored.value > 0.4 ? ROLE.mark : ROLE.pass,
            'mono',
          )
            .glow(8, ROLE.pass)
            .opacity(ms * dOp),
        );
      }

      // Bottom-left status strip (strictly non-overlapping)
      const fy = 295;
      nodes.push(rule(lx, fy - 56, -60, fy - 56, ROLE.rule, 2).opacity(ms));
      if (gateStarted.value < 0.5) {
        nodes.push(
          txt('REUSE GATE  /  VERIFY ALL CHECKS', lx, fy, 28, ROLE.host, 'mono', 'left').opacity(
            ms,
          ),
        );
      }
      if (slotAsk.value > 0.02) {
        nodes.push(
          txt('Can the next job take slot A?', lx, fy, 40, ROLE.mark, 'serif', 'left')
            .glow(8, ROLE.mark)
            .opacity(ms * slotAsk.value),
        );
      }
      if (slotQuar.value > 0.02) {
        nodes.push(
          lumBar(lx + 390, fy, 780, 72, {
            color: ROLE.candidate,
            fillOpacity: 0.18,
            strokeWidth: 2.5,
            glow: 10,
            opacity: ms * slotQuar.value,
          }),
          txt('KEEP SLOT A QUARANTINED', lx + 390, fy, 32, ROLE.candidate, 'mono').opacity(
            ms * slotQuar.value,
          ),
        );
      }
      if (slotReady.value > 0.02) {
        nodes.push(
          lumBar(lx + 390, fy, 780, 72, {
            color: ROLE.pass,
            fillOpacity: 0.18,
            strokeWidth: 2.5,
            glow: 10,
            opacity: ms * slotReady.value,
          }),
          txt('SLOT A REUSABLE', lx + 390, fy, 32, ROLE.pass, 'mono').opacity(ms * slotReady.value),
        );
      }
      if (showLate.value > 0.02) {
        nodes.push(
          txt('Late cleanup names worker-A / g7...', lx, fy, 32, ROLE.warn, 'mono', 'left').opacity(
            ms * showLate.value,
          ),
        );
      }
      if (showIgnored.value > 0.02) {
        nodes.push(
          lumBar(lx + 390, fy, 780, 72, {
            color: ROLE.host,
            fillOpacity: 0.18,
            strokeWidth: 2.2,
            glow: 9,
            opacity: ms * showIgnored.value,
          }),
          txt('g7 IGNORED  /  g8 KEEPS RUNNING', lx + 390, fy, 30, ROLE.host, 'mono').opacity(
            ms * showIgnored.value,
          ),
        );
      }
      if (showWorkstation.value > 0.02) {
        nodes.push(
          txt(
            'On your workstation, which files can a local agent read?',
            rx,
            fy + 64,
            28,
            ROLE.mark,
            'sans',
            'left',
          )
            .glow(6, ROLE.mark)
            .opacity(ms * showWorkstation.value),
        );
      }
    }

    return nodes;
  });

  s.add(bgAtmo, cage3d, title, live);
  runAmbientPhase(s, c, phase, 2.5);
  orbitScene(s, c, cage3d, { theta: 0.42, phi: 0.98 });

  // Beat 0 & 1: Fresh report grading
  FRESH_CASES.forEach((_, i) => {
    tweenCue(s, c, `ep-case-${i}`, caseHot[i], 1, { duration: 0.35 });
  });
  tweenCue(s, c, 'ep-predict', parseAsk, 1, { duration: 0.35 });
  crossSwap(s, c, 'ep-first', parseAsk, parseAns, { duration: 0.4, after: true });
  tweenCue(s, c, 'ep-first', caseAct[0], 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'ep-skip', caseAct[1], 1, { duration: 0.35 });
  tweenCue(s, c, 'ep-depth', caseAct[2], 1, { duration: 0.35 });
  tweenCue(s, c, 'ep-repeat', caseAct[3], 1, { duration: 0.35 });

  // Beat 2 & 3: Slot A checks, quarantine, rescan, g8 admission, late g7 ignored
  crossSwap(s, c, 'ep-receipt', modeParse, modeSlot, { duration: 0.45 });
  tweenCue(s, c, 'ep-connection', showConn, 1, { duration: 0.35 });
  crossSwap(s, c, 'ep-probe', showConn, showDeny, { duration: 0.4 });
  tweenCue(s, c, 'ep-empty-job', showEmptyJob, 1, { duration: 0.35 });
  tweenCue(s, c, 'ep-baseline', showBase, 1, { duration: 0.35 });
  c.on('ep-file', () => {
    bayStarted.set(1);
    s.play(showLeftover.to(1, { duration: 0.35 }));
  });
  c.on('ep-slot-question', () => {
    gateStarted.set(1);
    s.play(slotAsk.to(1, { duration: 0.35 }));
  });
  crossSwap(s, c, 'ep-quarantine', slotAsk, slotQuar, { duration: 0.4, after: true });
  crossSwap(s, c, 'ep-rescan', showLeftover, showClean, { duration: 0.4, after: true });
  crossSwap(s, c, 'ep-ready', slotQuar, slotReady, { duration: 0.4, after: true });
  c.after('ep-admit', () => {
    s.play(slotReady.to(0, { duration: 0.25 }), g8Admit.to(1, { duration: 0.85 }));
  });
  tweenCue(s, c, 'ep-late', showLate, 1, { duration: 0.35, after: true });
  crossSwap(s, c, 'ep-stays', showLate, showIgnored, { duration: 0.4 });
  tweenCue(s, c, 'ep-earned', passHot, 1, { duration: 0.4 });
  tweenCue(s, c, 'ep-workstation', showWorkstation, 1, { duration: 0.4 });
}
