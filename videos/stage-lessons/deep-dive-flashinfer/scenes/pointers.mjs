// Scene 02: Two ways to find R2: separate prefix sums qo_indptr (rows) and kv_indptr (pages).
import {
  ALL_PAGES,
  COSMOS,
  PAGE_OFFSETS,
  QUERY_OFFSETS,
  ROLE,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function pointers(s, c) {
  const phase = s.value(0);
  const focusReq = s.value(0); // 0=R0, 1=R1, 2=R2

  const bgAura = aura(0, 40, 660, '#60a5fa1c', '#5ce1e61c');

  const title = heroTitle(['Two Ways to', 'Find R2'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: ROLE.r2,
    eyebrow: 'CSR PREFIX SUMS · TWO COORDINATE UNITS',
    subtitle: 'qo_indptr counts query rows; kv_indptr counts page IDs',
  });

  const reqColors = [ROLE.r0, ROLE.r1, ROLE.r2];
  const reqNames = ['R0', 'R1', 'R2'];

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const active = Math.round(focusReq.value);
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const nodes = [
      // Top strip: 8 query rows (qo_indptr = [0, 3, 4, 8])
      txt('QUERY ROWS  qo_indptr = [0, 3, 4, 8]', -855, -162, 28, COSMOS.gold, 'mono', 'left'),
      // Bottom strip: 6 page IDs (kv_indptr = [0, 2, 3, 6])
      txt('PAGE LIST   kv_indptr = [0, 2, 3, 6]', -855, 118, 28, ROLE.r2, 'mono', 'left'),
    ];

    // Draw 8 query row cells spanning x = -760 to +760
    const qStartX = -755;
    const qStep = 216;
    for (let i = 0; i < 8; i++) {
      const owner = i < 3 ? 0 : i < 4 ? 1 : 2;
      const isAct = owner === active;
      const isVis = owner <= active;
      const col = isVis ? reqColors[owner] : COSMOS.dim;
      const cx = qStartX + i * qStep;
      nodes.push(
        glassCell(cx, -82, 192, 92, isAct ? COSMOS.gold : col, {
          fill: isAct ? '#1b2645' : '#0d1528',
          glow: isAct ? 10 * pulse : isVis ? 4 : 0,
          opacity: isVis ? 0.96 : 0.35,
        }),
        txt(`row ${i}`, cx, -104, 26, COSMOS.muted, 'mono').opacity(isVis ? 1 : 0.4),
        txt(reqNames[owner], cx, -64, 30, col, 'mono').opacity(isVis ? 1 : 0.4),
      );
    }

    // Active top bracket under query strip
    const qLo = QUERY_OFFSETS[active];
    const qHi = QUERY_OFFSETS[active + 1];
    const qLeft = qStartX + qLo * qStep - 94;
    const qRight = qStartX + (qHi - 1) * qStep + 94;
    const qMid = (qLeft + qRight) * 0.5;
    const actCol = reqColors[active];
    nodes.push(
      line([qLeft, -22], [qLeft, -2], { stroke: COSMOS.gold, width: 3.5 }),
      line([qLeft, -2], [qRight, -2], { stroke: COSMOS.gold, width: 3.5 }).glow(6, COSMOS.gold),
      line([qRight, -2], [qRight, -22], { stroke: COSMOS.gold, width: 3.5 }),
      txt(
        `${reqNames[active]} queries: [${qLo}, ${qHi}) -> ${qHi - qLo} row${qHi - qLo > 1 ? 's' : ''}`,
        qMid,
        36,
        28,
        COSMOS.gold,
        'mono',
      ),
    );

    // Draw 6 page-index cells spanning x = -660 to +660
    const pStartX = -655;
    const pStep = 262;
    for (let i = 0; i < ALL_PAGES.length; i++) {
      const owner = i < 2 ? 0 : i < 3 ? 1 : 2;
      const isAct = owner === active;
      const isVis = owner <= active;
      const col = isVis ? reqColors[owner] : COSMOS.dim;
      const cx = pStartX + i * pStep;
      nodes.push(
        glassCell(cx, 198, 234, 92, isAct ? ROLE.r2 : col, {
          fill: isAct ? '#102b3d' : '#0d1528',
          glow: isAct ? 10 * pulse : isVis ? 4 : 0,
          opacity: isVis ? 0.96 : 0.35,
        }),
        txt(`idx ${i}`, cx, 176, 26, COSMOS.muted, 'mono').opacity(isVis ? 1 : 0.4),
        txt(`Page ${ALL_PAGES[i]}`, cx, 216, 30, col, 'mono').opacity(isVis ? 1 : 0.4),
      );
    }

    // Active bottom bracket under page strip
    const pLo = PAGE_OFFSETS[active];
    const pHi = PAGE_OFFSETS[active + 1];
    const pLeft = pStartX + pLo * pStep - 114;
    const pRight = pStartX + (pHi - 1) * pStep + 114;
    const pMid = (pLeft + pRight) * 0.5;
    const pageList = ALL_PAGES.slice(pLo, pHi).join(', ');
    nodes.push(
      line([pLeft, 258], [pLeft, 278], { stroke: actCol, width: 3.5 }),
      line([pLeft, 278], [pRight, 278], { stroke: actCol, width: 3.5 }).glow(6, actCol),
      line([pRight, 278], [pRight, 258], { stroke: actCol, width: 3.5 }),
      txt(
        `${reqNames[active]} pages: [${pLo}, ${pHi}) -> [${pageList}]`,
        pMid,
        320,
        28,
        actCol,
        'mono',
      ),
    );

    // Bottom semantic takeaway
    const footerMsg =
      active === 2
        ? 'R2 starts at query row 4, but page entry 3 -> open pages [3, 14, 6] in order'
        : active === 1
          ? 'Half-open intervals [start, next) keep query rows and page entries cleanly separate'
          : 'Start both prefix sums at 0: R0 takes rows [0, 3) and page entries [0, 2)';
    nodes.push(txt(footerMsg, 0, 412, 28, COSMOS.ink, 'sans'));

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pointers-first', () =>
    s.play(focusReq.to(0, { duration: remainDuration(c, 'pointers-first', 0.35) })),
  );
  c.on('pointers-middle', () =>
    s.play(focusReq.to(1, { duration: remainDuration(c, 'pointers-middle', 0.45) })),
  );
  c.on('pointers-last', () =>
    s.play(focusReq.to(2, { duration: remainDuration(c, 'pointers-last', 0.45) })),
  );
}
