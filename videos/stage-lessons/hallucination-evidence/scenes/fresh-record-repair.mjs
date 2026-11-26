// Scene 19: The next update for INC-48291 (Final transfer: v1 stale citation stop -> v2 bind -> safe render)
import {
  COSMOS,
  CURRENT_RECORD,
  FRESH_BAD,
  FRESH_GOOD,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeEntailmentGraph3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshRecordRepair(s, c) {
  const phase = s.value(0);
  const showNewRec = s.value(0);
  const showBadCite = s.value(0);
  const showStop = s.value(0);
  const showBind = s.value(0);
  const showPrint = s.value(0);
  const showTrace = s.value(0);

  const bgAura = aura(0, 10, 680, '#12365c28', '#2a1c5216');
  const title = heroTitle(['The Next Update', 'for INC-48291'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: `FINAL TRANSFER · ADMITTED SNAPSHOT: ${CURRENT_RECORD.version.toUpperCase()}`,
  });

  const { view: stage3d, orbit: orbit3d } = makeEntailmentGraph3D(535, -15, phase, 'repair');

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sn = showNewRec.value;
    const sb = showBadCite.value;
    const st = showStop.value;
    const sBind = showBind.value;
    const sp = showPrint.value;
    const sTr = showTrace.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('3D VERSION-BOUND ENTAILMENT GRAPH', 535, -330, 26, COSMOS.cyan, 'mono'),
      txt(
        sp > 0.4
          ? 'Both claims bound to v2 -> SAFE TO SERVE'
          : sBind > 0.4
            ? 'Claims re-bound to v2 · check printed lines'
            : st > 0.4
              ? 'v1 citation fails BEFORE value compare!'
              : 'Inspect v2 record & claim citations',
        535,
        292,
        26,
        sp > 0.4
          ? COSMOS.emerald
          : sBind > 0.4
            ? COSMOS.gold
            : st > 0.4
              ? COSMOS.rose
              : COSMOS.muted,
        'mono',
      ),

      // Left top: Admitted v2 record
      txt(
        `ADMITTED RECORD (${CURRENT_RECORD.version})`,
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      glassCell(-440, -118, 830, 108, sn > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: sn > 0.3 ? 8 : 3,
      }),
      txt(
        `recovery_eta: ${CURRENT_RECORD.facts.recovery_eta}   |   status: ${CURRENT_RECORD.facts.status}`,
        -440,
        -116,
        27,
        COSMOS.emerald,
        'mono',
      ),

      // Left middle: Draft citations (v1 stale -> repaired to v2)
      glassCell(
        -440,
        38,
        830,
        148,
        sBind > 0.4 ? COSMOS.emerald : st > 0.4 ? COSMOS.rose : COSMOS.gold,
        {
          fill: sBind > 0.4 ? '#0e2624' : st > 0.4 ? '#28111a' : '#181e34',
          glow: st > 0.4 || sBind > 0.4 ? 9 * pulse : 3,
        },
      ),
      txt(
        sBind > 0.4
          ? 'ETA 15:10 UTC  -> cites v2   [SUPPORTED]'
          : `ETA 15:10 UTC  -> cites v1   [${st > 0.4 ? FRESH_BAD.verdicts[0].toUpperCase() : '?'}]`,
        -825,
        -4,
        26,
        sBind > 0.4 ? COSMOS.emerald : st > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'status: mitigated -> cites v2  [SUPPORTED]',
        -825,
        40,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Free prose: "Fully recovered." (UNVERIFIED!)',
        -825,
        82,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),

      // Left bottom: Gate decision & Safe printed sentences (strictly withheld!)
      glassCell(
        -440,
        224,
        830,
        152,
        sp > 0.4
          ? COSMOS.emerald
          : sBind > 0.4
            ? COSMOS.gold
            : st > 0.4
              ? COSMOS.rose
              : COSMOS.muted,
        {
          fill: sp > 0.4 ? '#0e2824' : sBind > 0.4 ? '#1b1710' : st > 0.4 ? '#28111a' : '#12182b',
          glow: sp > 0.4 ? 10 * pulse : sBind > 0.4 ? 6 : 3,
        },
      ),
      txt(
        sp > 0.4
          ? `ROUTE: ${FRESH_GOOD.route.toUpperCase()} (FROM VERIFIED FIELDS ONLY)`
          : sBind > 0.4
            ? 'BOTH MATCH v2 -> WHICH SENTENCES PRINT?  ?'
            : st > 0.4
              ? `ROUTE: ${FRESH_BAD.route.toUpperCase()} (WITHHOLD: STALE VERSION!)`
              : sb > 0.3
                ? 'CAN THIS DRAFT GO OUT WITH THESE CITATIONS?  ?'
                : 'Awaiting citation version check...',
        -825,
        180,
        26,
        sp > 0.4
          ? COSMOS.emerald
          : sBind > 0.4
            ? COSMOS.gold
            : st > 0.4
              ? COSMOS.rose
              : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        sp > 0.4
          ? 'Recorded recovery estimate: 15:10 UTC.'
          : sBind > 0.4
            ? 'Two supported v2 claims + one unverified free-prose claim'
            : st > 0.4
              ? 'Right digits cannot rescue a stale citation version!'
              : 'Version check runs BEFORE value comparison',
        -825,
        222,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        sp > 0.4
          ? 'Recorded status: mitigated.  ("Fully recovered" dropped!)'
          : sBind > 0.4
            ? 'Which sentences are safe to render?'
            : 'Re-bind citation to v2 and re-run the checker',
        -825,
        262,
        26,
        sp > 0.4 ? COSMOS.emerald : sBind > 0.4 ? COSMOS.gold : COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: sTr > 0.3 ? COSMOS.cyan : COSMOS.emerald }),
      txt(
        sTr > 0.3
          ? 'HTTP 200 only means the request succeeded: open the trace to verify what the reader actually saw'
          : 'Save the sent text alongside both claim verdicts and the admitted runbook version',
        -812,
        360,
        28,
        sTr > 0.3 ? COSMOS.cyan : COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 14);
  orbit3d(s, c);

  c.on('new-record', () => s.play(showNewRec.to(1, { duration: 0.45 })));
  c.on('cited-version', () => s.play(showBadCite.to(1, { duration: 0.45 })));
  c.after('version-stop', () => s.play(showStop.to(1, { duration: 0.45 })));
  c.on('bind-current', () => s.play(showBind.to(0.6, { duration: 0.4 })));
  c.on('recheck-version', () => s.play(showBind.to(1, { duration: 0.4 })));
  c.after('print-estimate', () => s.play(showPrint.to(0.6, { duration: 0.4 })));
  c.on('print-answer', () => s.play(showPrint.to(1, { duration: 0.4 })));
  c.on('save-receipt', () => s.play(showTrace.to(0.4, { duration: 0.35 })));
  c.on('request-log', () => s.play(showTrace.to(0.75, { duration: 0.35 })));
  c.on('open-trace', () =>
    s.play(showTrace.to(1, { duration: remainDuration(c, 'open-trace', 0.45) })),
  );
}
