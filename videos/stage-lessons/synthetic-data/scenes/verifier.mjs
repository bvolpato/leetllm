// Scene 06: What did each client collect? (Live search-fixture trace for C1 retry vs C4 oversized request)
import {
  COMPLIANT_RUN,
  COSMOS,
  FIXTURE_PAGE_LIMIT,
  FIXTURE_RETRY_LIMIT,
  OVERSIZED_RUN,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function verifier(s, c) {
  const phase = s.value(0);
  const sLimit = s.value(0);
  const sThrottle = s.value(0);
  const sSame = s.value(0);
  const sPage1 = s.value(0);
  const sNext = s.value(0);
  const sPred3 = s.value(0);
  const sThirdIn = s.value(0);
  const sThirdRes = s.value(0);
  const sComplete = s.value(0);
  const sOther = s.value(0);
  const sOverLim = s.value(0);
  const sOverStat = s.value(0);
  const sEmpty = s.value(0);

  const bgAura = aura(0, 20, 680, '#133a5c28', '#331a4016');

  const title = heroTitle(['What Did Each', 'Client Collect?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'EXECUTABLE VERIFIER · TWO-PAGE SEARCH FIXTURE',
  });

  const c1Trace = COMPLIANT_RUN.trace;
  const c4Trace = OVERSIZED_RUN.trace[0];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const lim = Math.max(0.75, sLimit.value);
    const thr = sThrottle.value;
    const sam = sSame.value;
    const p1 = sPage1.value;
    const nxt = sNext.value;
    const pr3 = sPred3.value;
    const t3i = sThirdIn.value;
    const t3r = sThirdRes.value;
    const cmp = sComplete.value;
    const oth = sOther.value;
    const ovl = sOverLim.value;
    const ovs = sOverStat.value;
    const emp = sEmpty.value;

    const cols = [-810, -595, -340, -135, 115, 420];
    const headers = ['CLIENT', 'CURSOR', 'LIMIT', 'HTTP', 'NEXT CURSOR', 'COLLECTED'];

    const nodes = [
      // Top contract ribbon
      glassCell(440, -340, 820, 74, COSMOS.blue, {
        fill: '#0e1d36',
        glow: 6,
        opacity: lim,
      }),
      txt(
        `FIXTURE: limit <= ${FIXTURE_PAGE_LIMIT}   ·   retries <= ${FIXTURE_RETRY_LIMIT}`,
        440,
        -338,
        26,
        COSMOS.blue,
        'mono',
      ),

      // Table header rail
      ...headers.map((h, k) => txt(h, cols[k], -196, 26, COSMOS.muted, 'mono', 'left')),
      line([-830, -166], [850, -166], { stroke: COSMOS.rule, width: 2.2 }),
    ];

    const rows = [
      {
        y: -102,
        visible: true,
        id: 'C1 / 1',
        cursor: 'start (null)',
        limit: String(c1Trace[0].request.limit),
        http: thr > 0.3 ? String(c1Trace[0].response.status) : '...',
        httpCol: thr > 0.3 ? COSMOS.amber : COSMOS.dim,
        next: thr > 0.3 ? 'none' : '...',
        names: thr > 0.3 ? '0 names (429)' : '...',
        border: thr > 0.3 ? COSMOS.amber : COSMOS.cyan,
      },
      {
        y: 6,
        visible: sam > 0.1 || p1 > 0.1,
        id: 'C1 / 2',
        cursor: sam > 0.2 ? 'start (retry)' : '?',
        limit: sam > 0.2 ? String(c1Trace[1].request.limit) : '...',
        http: p1 > 0.3 ? String(c1Trace[1].response.status) : '...',
        httpCol: p1 > 0.3 ? COSMOS.emerald : COSMOS.dim,
        next: nxt > 0.3 ? `"${c1Trace[1].response.nextCursor}"` : '...',
        names: p1 > 0.3 ? c1Trace[1].response.items.join(', ') : '...',
        border: nxt > 0.3 ? COSMOS.gold : COSMOS.cyan,
      },
      {
        y: 114,
        visible: pr3 > 0.1 || t3i > 0.1,
        id: 'C1 / 3',
        cursor: t3i > 0.5 ? `"${c1Trace[2].request.cursor}"` : '?',
        limit: t3i > 0.5 ? String(c1Trace[2].request.limit) : '...',
        http: t3r > 0.5 ? String(c1Trace[2].response.status) : '...',
        httpCol: t3r > 0.5 ? COSMOS.emerald : COSMOS.dim,
        next: t3r > 0.5 ? 'null' : '...',
        names: t3r > 0.5 ? COMPLIANT_RUN.result.items.join(', ') : '...',
        border: t3r > 0.5 ? COSMOS.emerald : COSMOS.gold,
      },
      {
        y: 238,
        visible: oth > 0.1 || ovl > 0.1,
        id: 'C4 / 1',
        cursor: 'start (null)',
        limit: ovl > 0.2 ? c4Trace.request.limit.toLocaleString('en-US') : '...',
        http: ovs > 0.5 ? String(c4Trace.response.status) : '...',
        httpCol: ovs > 0.5 ? COSMOS.rose : COSMOS.dim,
        next: ovs > 0.5 ? 'none' : '...',
        names: emp > 0.5 ? '0 names (rejected)' : '...',
        border: ovs > 0.5 ? COSMOS.rose : COSMOS.amber,
      },
    ];

    rows.forEach((r, idx) => {
      const alpha = r.visible ? 1 : 0.32;
      nodes.push(
        glassCell(10, r.y, 1680, 82, r.visible ? r.border : COSMOS.rule, {
          fill: r.visible ? '#0f1a2f' : '#0b101d',
          dash: r.visible ? undefined : [8, 8],
          glow: idx === 2 && pr3 > 0.3 && t3i < 0.5 ? 9 * pulse : r.visible ? 4 : 0,
          opacity: alpha,
        }),
      );
      if (r.visible) {
        nodes.push(
          txt(r.id, cols[0], r.y + 2, 28, COSMOS.blue, 'mono', 'left'),
          txt(
            r.cursor,
            cols[1],
            r.y + 2,
            28,
            idx === 2 && t3i < 0.5 ? COSMOS.gold : COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            r.limit,
            cols[2],
            r.y + 2,
            28,
            idx === 3 && ovl > 0.2 ? COSMOS.rose : COSMOS.ink,
            'mono',
            'left',
          ),
          txt(r.http, cols[3], r.y + 2, 28, r.httpCol, 'mono', 'left'),
          txt(
            r.next,
            cols[4],
            r.y + 2,
            28,
            idx === 1 && nxt > 0.3 ? COSMOS.gold : COSMOS.cyan,
            'mono',
            'left',
          ),
          txt(
            r.names,
            cols[5],
            r.y + 2,
            26,
            idx === 3 && emp > 0.5 ? COSMOS.rose : COSMOS.ink,
            'mono',
            'left',
          ),
        );
      } else {
        nodes.push(
          txt(`STEP ${idx + 1} · awaiting call`, cols[0], r.y + 2, 26, COSMOS.dim, 'mono', 'left'),
        );
      }
    });

    // Bottom verdict rail
    let verdictText = 'Run C1 on fresh fixture: watch how it handles HTTP 429';
    let verdictCol = COSMOS.cyan;
    if (pr3 > 0.3 && t3i < 0.5) {
      verdictText = 'PREDICT: Which cursor belongs in request 3?';
      verdictCol = COSMOS.gold;
    } else if (t3i > 0.5 && cmp < 0.5) {
      verdictText = 'C1 sends "page-2" -> collecting final page...';
      verdictCol = COSMOS.cyan;
    } else if (cmp > 0.5 && oth < 0.2) {
      verdictText = `C1 PASS · ${COMPLIANT_RUN.result.items.length} names collected · ${COMPLIANT_RUN.retryCount} retry · all limits <= ${FIXTURE_PAGE_LIMIT}`;
      verdictCol = COSMOS.emerald;
    } else if (oth > 0.2 && emp < 0.5) {
      verdictText = 'C4 running on fresh fixture copy · requesting 10,000 names...';
      verdictCol = COSMOS.amber;
    } else if (emp > 0.5) {
      verdictText =
        'C4 FAIL · HTTP 413 page limit exceeded · 0 names collected (save failing case)';
      verdictCol = COSMOS.rose;
    }

    nodes.push(
      glassCell(10, 368, 1680, 92, verdictCol, { fill: '#10192b', glow: 7 }),
      glowDot(-795, 368, { radius: 7, color: verdictCol }),
      txt(verdictText, -760, 370, 28, verdictCol, 'mono', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('fixture-limit', () => s.play(sLimit.to(1, { duration: 0.4 })));
  c.after('throttle-reply', () => s.play(sThrottle.to(1, { duration: 0.35 })));
  c.on('same-request', () => s.play(sSame.to(1, { duration: 0.4 })));
  c.after('page-one-names', () => s.play(sPage1.to(1, { duration: 0.35 })));
  c.after('next-value', () => s.play(sNext.to(1, { duration: 0.35 })));
  c.on('third-prediction', () => s.play(sPred3.to(1, { duration: 0.4 })));
  c.after('third-input', () => s.play(sThirdIn.to(1, { duration: 0.35 })));
  c.after('third-response', () => s.play(sThirdRes.to(1, { duration: 0.35 })));
  c.after('complete-client', () => s.play(sComplete.to(1, { duration: 0.35 })));
  c.on('other-proposal', () => s.play(sOther.to(1, { duration: 0.4 })));
  c.on('oversize-limit', () => s.play(sOverLim.to(1, { duration: 0.4 })));
  c.after('oversize-status', () => s.play(sOverStat.to(1, { duration: 0.35 })));
  c.after('empty-result', () =>
    s.play(sEmpty.to(1, { duration: remainDuration(c, 'empty-result', 0.4) })),
  );
}
