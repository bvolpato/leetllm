// Scene 28: earned-context: "What survives the restart?"
// Finale synthesizing packing + durable receipts + required-record recovery across 3 prediction beats:
// B0-B1: 2,600 budget -> 3 required records = 1,000 -> old export (1,800) overflows to 2,800 -> skip ->
//        current runbook (1,200) fits -> 2,200 used / 400 free (withheld during B0!).
// B2-B3: Saved collection receipt vs trace.json rev 2 -> prediction "Can old receipt certify?" ->
//        B3 stale stop -> inspect & reissue receipt -> summary omits approval policy ->
//        prediction "Which file tells who approves rollback?"
// B4: Restore approval policy -> incident lead -> next ready task: verify cause!
import {
  CONTEXT_FRESH,
  COSMOS,
  FRESH_PACK,
  ROLE,
  aura,
  checkMark,
  chip,
  contextFreshResumeFixture,
  cornerBrackets,
  crossMark,
  ease,
  fmt,
  group,
  guardedDynamic,
  hash,
  heroTitle,
  limitMarker,
  playCue,
  recheckCollection,
  short,
  swapVis,
  tokenRail,
  txt,
} from '../parts.mjs';

export default function earnedContext(s, c) {
  const vPack = s.value(1);
  const vReceipt = s.value(0);
  const packReq = s.value(0); // WITHHELD until B1 ce-earned-1000!
  const tryExport = s.value(0);
  const skipExport = s.value(0);
  const packRunbook = s.value(0);

  const mutateTrace = s.value(0);
  const showStale = s.value(0); // WITHHELD until B3 ce-earned-stale!
  const doInspect = s.value(0);
  const reissue = s.value(0);
  const omitAuth = s.value(0);
  const restoreAuth = s.value(0); // WITHHELD until B4 ce-earned-authorizer!
  const showRole = s.value(0);
  const showNext = s.value(0);

  // Compute exact saved, mutated, and reissued hashes directly from recovery.mjs & construction.mjs
  const baseFx = contextFreshResumeFixture();
  const savedReport = baseFx.receipts['collect-receipt'].sha256;
  const savedTrace = baseFx.receipts['collect-receipt'].inputSha256['trace.json'];
  const savedAuth = baseFx.receipts['collect-receipt'].inputSha256['authorization.json'];
  const rev2TraceText = '{"trace":"R17","revision":2,"status":403}';
  const rev2TraceHash = hash(rev2TraceText);
  const reFx = contextFreshResumeFixture();
  reFx.files['trace.json'] = rev2TraceText;
  recheckCollection(reFx);
  const freshTraceSaved = reFx.receipts['collect-receipt'].inputSha256['trace.json'];

  const bgAura = aura(0, 20, 820, '#14335c2a', '#14352822');
  const title = heroTitle(['What survives', 'the restart?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.note,
  });

  // View 1 (B0-B1): 2,600-unit packing desk
  const packLayer = guardedDynamic(vPack, (alpha) => {
    const rq = ease(packReq.value);
    const ex = ease(tryExport.value);
    const sk = ease(skipExport.value);
    const rb = ease(packRunbook.value);

    const x0 = -855;
    const railW = 1680;
    const maxScale = 2850;
    const limitX = x0 + (FRESH_PACK.budget / maxScale) * railW;

    const showOverflow = ex > 0.35 && sk < 0.5;
    const segs = [
      { units: 200, color: ROLE.evidence, alpha: 0.28 + 0.72 * rq },
      { units: 500, color: ROLE.cache, alpha: 0.28 + 0.72 * rq },
      { units: 300, color: ROLE.note, alpha: 0.28 + 0.72 * rq },
    ];
    if (showOverflow) {
      segs.push({ units: 1800, color: ROLE.poison, alpha: ex, outline: true });
    } else if (rb > 0.25) {
      segs.push({ units: 1200, color: ROLE.units, alpha: rb });
    }

    const usedText =
      rb > 0.4
        ? '2,200 (400 free)'
        : showOverflow
          ? '2,800 OVER!'
          : rq > 0.4
            ? '1,000 used'
            : '0 / 2,600 packed';

    const nodes = [
      txt('BUDGET AFTER RESERVES: 2,600 UNITS', 855, -405, 32, ROLE.units, 'mono', 'right').opacity(
        alpha,
      ),

      // Five candidate records laid across two spacious rows so chips never crowd
      txt(
        'CANDIDATE RECORDS (REQUIRED FIRST, THEN PRIORITY)',
        x0,
        -265,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      chip('Task: 200 (req)', -565, -195, {
        color: ROLE.evidence,
        size: 26,
        minW: 310,
        opacity: alpha,
      }),
      chip('Trace: 500 (req)', 0, -195, { color: ROLE.cache, size: 26, minW: 320, opacity: alpha }),
      chip('Approval: 300 (req)', 565, -195, {
        color: ROLE.note,
        size: 26,
        minW: 360,
        opacity: alpha,
      }),
      chip(sk > 0.4 ? 'Old export: 1800 (SKIP)' : 'Old export: 1800 (#1)', -280, -110, {
        color: sk > 0.4 ? ROLE.poison : ROLE.tool,
        size: 26,
        minW: 420,
        opacity: alpha * (sk > 0.4 ? 0.55 : 1),
      }),
      chip('Runbook: 1200 (#2)', 280, -110, {
        color: rb > 0.4 ? ROLE.units : ROLE.evidence,
        size: 26,
        minW: 360,
        glow: rb > 0.4 ? 12 : 5,
        opacity: alpha,
      }),

      // Packing rail
      tokenRail({
        x0,
        y: 55,
        width: railW,
        total: maxScale,
        height: 74,
        segments: segs,
        opacity: alpha,
      }),
      limitMarker(limitX, -15, 125, ROLE.units, 'Limit: 2,600', { size: 28, opacity: alpha }),

      txt(
        usedText,
        x0,
        205,
        48,
        rb > 0.4 ? ROLE.note : showOverflow ? ROLE.poison : ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),

      // Prediction prompt (B0) -> Steady B1 summary (avoids brief intermediate swaps!)
      txt(
        rq > 0.4
          ? 'Pack required first (1,000), skip oversized optional items, then fit what remains.'
          : 'Which optional record fits alongside all three required records?',
        0,
        355,
        34,
        rb > 0.4 ? ROLE.note : showOverflow ? ROLE.poison : ROLE.units,
        'serif',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  // View 2 (B2-B4): Receipt verification, trace rev 2 mutation, reissue, missing approval policy -> verify cause
  const receiptLayer = guardedDynamic(vReceipt, (alpha) => {
    const mt = ease(mutateTrace.value);
    const st = ease(showStale.value);
    const ins = ease(doInspect.value);
    const re = ease(reissue.value);
    const om = ease(omitAuth.value);
    const ra = ease(restoreAuth.value);
    const rl = ease(showRole.value);
    const nx = ease(showNext.value);

    const traceSaved = re > 0.4 ? freshTraceSaved : savedTrace;
    const traceCur = mt > 0.4 ? rev2TraceHash : savedTrace;
    const traceMatch = traceSaved === traceCur;
    const authInPacket = om < 0.4 || ra > 0.4;

    const rows = [
      { name: 'report.json', saved: short(savedReport), cur: short(savedReport), match: true },
      {
        name: mt > 0.4 ? 'trace.json (rev 2)' : 'trace.json (rev 1)',
        saved: short(traceSaved),
        cur: short(traceCur),
        match: traceMatch,
      },
      { name: 'authorization.json', saved: short(savedAuth), cur: short(savedAuth), match: true },
    ];

    const nodes = [
      // Left: Saved vs Current SHA-256 Receipt Table
      cornerBrackets(
        -450,
        5,
        800,
        440,
        re > 0.4 ? ROLE.note : st > 0.4 ? ROLE.poison : ROLE.evidence,
        {
          arm: 30,
          width: 3,
          opacity: alpha,
        },
      ),
      txt(
        re > 0.4 ? 'REISSUED COLLECTION RECEIPT' : 'SAVED COLLECTION RECEIPT',
        -815,
        -170,
        26,
        re > 0.4 ? ROLE.note : ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
      txt('FILE', -815, -108, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('SAVED', -460, -108, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('CURRENT', -285, -108, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
    ];

    rows.forEach((row, i) => {
      const y = -35 + i * 84;
      const showMismatch = !row.match && st > 0.4;
      const col = showMismatch ? ROLE.poison : row.match ? ROLE.note : ROLE.units;
      nodes.push(
        txt(row.name, -815, y, 27, COSMOS.ink, 'mono', 'left').opacity(alpha),
        txt(row.saved, -460, y, 27, ROLE.evidence, 'mono', 'left').opacity(alpha),
        txt(row.cur, -285, y, 27, col, 'mono', 'left').opacity(alpha),
      );
      if (row.match) {
        nodes.push(checkMark(-88, y, 22, ROLE.note, alpha));
      } else if (st > 0.4) {
        nodes.push(crossMark(-88, y, 22, ROLE.poison, alpha * st));
      } else {
        nodes.push(txt('?', -88, y, 30, ROLE.units, 'mono', 'center').opacity(alpha));
      }
    });

    // Right: Next Call Packet + Active Task Status
    const rightCol = nx > 0.4 ? ROLE.note : !authInPacket ? ROLE.poison : ROLE.evidence;
    nodes.push(
      cornerBrackets(455, 5, 790, 440, rightCol, { arm: 30, width: 3, opacity: alpha }),
      txt('RESTART WORKING SET (NEXT CALL)', 95, -170, 26, rightCol, 'mono', 'left').opacity(alpha),
      chip('Task (200)', 235, -80, { color: ROLE.evidence, size: 26, minW: 260, opacity: alpha }),
      chip('Trace rev 2 (500)', 595, -80, {
        color: ROLE.cache,
        size: 26,
        minW: 320,
        opacity: alpha,
      }),
      chip('Runbook (1200)', 235, 20, { color: ROLE.units, size: 26, minW: 260, opacity: alpha }),
      authInPacket
        ? chip(rl > 0.4 ? 'Approval: incident lead' : 'Approval policy (300)', 595, 20, {
            color: ROLE.note,
            size: 26,
            minW: 360,
            glow: ra > 0.4 ? 12 : 6,
            opacity: alpha,
          })
        : chip('REQUIRED RECORD OMITTED (?)', 595, 20, {
            color: ROLE.poison,
            size: 26,
            minW: 360,
            glow: 10,
            opacity: alpha,
          }),

      // Next ready task strip inside right region
      txt(
        nx > 0.4
          ? 'NEXT READY TASK: verify cause'
          : ins > 0.4 && re < 0.4
            ? 'Rechecking R17 -> 403 against rev 2...'
            : 'Next task waits on verified receipt & working set',
        95,
        142,
        28,
        nx > 0.4 ? ROLE.note : ROLE.units,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Bottom prediction / answer readout (strictly withheld on both B2 & B3 prediction beats!)
    const msg =
      nx > 0.4
        ? 'Approval policy restored (incident lead). Next ready task: why did R17 return 403?'
        : ra > 0.4
          ? 'Read approval policy back in: names the incident lead.'
          : om > 0.4
            ? 'One required record was dropped from the call. Which file names the rollback approver?'
            : re > 0.4
              ? 'Fresh receipt issued for report.json and both declared inputs.'
              : st > 0.4
                ? 'STOP: trace.json fingerprint changed -> inspect revised trace before resuming.'
                : mt > 0.4
                  ? 'Trace rev 2 arrived while report stayed unchanged. Can the old receipt still certify?'
                  : 'Compare Saved receipt prefixes against Current files on disk.';

    nodes.push(
      txt(
        msg,
        0,
        360,
        32,
        nx > 0.4 || ra > 0.4 ? ROLE.note : st > 0.4 && re < 0.4 ? ROLE.poison : ROLE.units,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, packLayer, receiptLayer);

  // B1 reveals (after B0 prediction hold)
  playCue(s, c, 'ce-earned-1000', (d) => s.play(packReq.to(1, { duration: d })));
  playCue(s, c, 'ce-earned-attempt', (d) => s.play(tryExport.to(1, { duration: d })));
  playCue(s, c, 'ce-earned-skip', (d) => s.play(skipExport.to(1, { duration: d })));
  playCue(s, c, 'ce-earned-2200', (d) => s.play(packRunbook.to(1, { duration: d })));

  // B2 swap to receipt & trace rev 2 mutation (withhold stale verdict!)
  playCue(s, c, 'ce-earned-saved', (d) => s.play(swapVis(vPack, vReceipt, d)));
  playCue(s, c, 'ce-earned-mutation', (d) => s.play(mutateTrace.to(1, { duration: d })));

  // B3 reveal stale verdict -> inspect -> reissue -> omit approval policy (withhold file answer!)
  playCue(s, c, 'ce-earned-stale', (d) => s.play(showStale.to(1, { duration: d })));
  playCue(s, c, 'ce-earned-inspect', (d) => s.play(doInspect.to(1, { duration: d })));
  playCue(s, c, 'ce-earned-receipt', (d) => s.play(reissue.to(1, { duration: d })));
  playCue(s, c, 'ce-earned-omit', (d) => s.play(omitAuth.to(1, { duration: d })));

  // B4 reveal approval policy -> incident lead -> verify cause!
  playCue(s, c, 'ce-earned-authorizer', (d) => s.play(restoreAuth.to(1, { duration: d })));
  playCue(s, c, 'ce-earned-role', (d) => s.play(showRole.to(1, { duration: d })));
  playCue(s, c, 'ce-earned-next', (d) => s.play(showNext.to(1, { duration: d })));
}
