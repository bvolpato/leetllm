// Scene 07: payload: "How many bytes does one row take?"
// View 1: Luminous compression beams (FP32 -> INT8 -> 1-bit -> PQ-96) + shared codebook orb
//         + retained FP32 originals memory slab.
// View 2: 50M rows × 768 dims volumetric scaling bars (153.6 GB -> 38.4 GB -> 4.8 GB).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';

export default function payload(s, c) {
  const fp32 = 1536 * 4; // 6144 B
  const int8 = 1536;
  const sign = 192;
  const pq = 96;

  const vMain = s.value(1);
  const vScale = s.value(0);
  const pFp32 = s.value(0);
  const pInt8 = s.value(0);
  const pSign = s.value(0);
  const pPq = s.value(0);
  const showBook = s.value(0);
  const showOrig = s.value(0);

  const title = heroTitle(['How many bytes', 'does one row take?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.code,
    eyebrow: 'VECTOR PAYLOAD SIZING',
  });

  // View 1: 1M rows × 1,536 dims compression beams
  const mainLayer = guardedDynamic(vMain, (alpha) => {
    const barL = -590;
    const maxW = 760;
    const rows = [
      {
        name: 'FP32',
        bytes: fp32,
        prog: pFp32.value,
        color: ROLE.query,
        detail: '6,144 B  ·  5.72 GiB / 1M',
        y: -225,
      },
      {
        name: 'INT8 SQ',
        bytes: int8,
        prog: pInt8.value,
        color: ROLE.code,
        detail: '1,536 B  ·  4× smaller',
        y: -135,
      },
      {
        name: '1-bit sign',
        bytes: sign,
        prog: pSign.value,
        color: ROLE.violet,
        detail: '192 B  ·  32× smaller',
        y: -45,
      },
      {
        name: 'PQ-96',
        bytes: pq,
        prog: pPq.value,
        color: ROLE.A,
        detail: '96 B  ·  92 MiB / 1M (64×)',
        y: 45,
      },
    ];

    const nodes = [
      txt(
        '1,000,000 ROWS  ×  1,536 DIMENSIONS',
        855,
        -395,
        28,
        COSMOS.muted,
        'mono',
        'right',
      ).opacity(alpha),
      line([barL, -268], [barL, 92], { stroke: '#4c608e', width: 2.5 }).opacity(alpha),
    ];

    rows.forEach((r) => {
      const w = Math.max(12, (r.bytes / fp32) * maxW * r.prog);
      nodes.push(
        txt(
          r.name,
          barL - 28,
          r.y,
          30,
          r.prog > 0.05 ? r.color : COSMOS.muted,
          'mono',
          'right',
        ).opacity(alpha),
        // Subtle full-span capacity track rail visible from t=0 (keeps canvas balanced)
        lumBar(barL + maxW / 2, r.y, maxW, 46, {
          color: '#344770',
          fillAlpha: 0.08,
          strokeWidth: 1.4,
          glow: 0,
          opacity: 0.75 * alpha,
        }),
      );
      if (r.prog > 0.02) {
        nodes.push(
          lumBar(barL + w / 2, r.y, w, 46, {
            color: r.color,
            fillAlpha: 0.34,
            strokeWidth: 2.4,
            glow: 8,
            opacity: r.prog * alpha,
          }),
          txt(r.detail, barL + maxW + 28, r.y, 28, COSMOS.ink, 'mono', 'left').opacity(
            r.prog * alpha,
          ),
        );
      }
    });

    // Lower section: shared codebooks slot + retained FP32 shelf (structural guides visible from t=0)
    nodes.push(
      rule(-850, 128, 850, 128, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt(
        'SHARED PQ CODEBOOKS',
        -690,
        222,
        26,
        showBook.value > 0.3 ? ROLE.gold : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'RETAINED ORIGINALS FOR RESCORING',
        155,
        212,
        26,
        showOrig.value > 0.3 ? ROLE.query : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(495, 282, 680, 56, {
        color: showOrig.value > 0.3 ? ROLE.query : '#344770',
        fillAlpha: showOrig.value > 0.3 ? 0.3 : 0.08,
        strokeWidth: showOrig.value > 0.3 ? 2.5 : 1.6,
        glow: showOrig.value > 0.3 ? 9 : 0,
        opacity: alpha,
      }),
      glowRing(-765, 275, 42, showBook.value > 0.3 ? ROLE.gold : '#3a4e7a', {
        width: 2.8,
        glow: showBook.value > 0.3 ? 10 : 0,
        opacity: alpha,
      }),
    );

    const bOp = showBook.value * alpha;
    if (bOp > 0.02) {
      nodes.push(
        txt('1.5', -765, 275, 28, ROLE.gold, 'mono').opacity(bOp),
        txt(
          '96 books × 256 centers × 16 floats = 1.5 MiB',
          -690,
          274,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(bOp),
        txt(
          'Links, labels, replicas & metadata add on top',
          -690,
          326,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(bOp),
      );
    }

    const oOp = showOrig.value * alpha;
    if (oOp > 0.02) {
      nodes.push(
        txt('Full FP32 copy still owes 5.72 GiB', 495, 282, 30, COSMOS.ink, 'mono').opacity(oOp),
        txt('Can live on cold storage or disk', 155, 350, 26, COSMOS.muted, 'sans', 'left').opacity(
          oOp,
        ),
      );
    }

    return group(...nodes);
  });

  // View 2: 50M rows × 768 dims volumetric scaling bars
  const scaleLayer = guardedDynamic(vScale, (alpha) => {
    const barL = -560;
    const maxW = 1040;
    const items = [
      { label: 'FP32', rowB: '3,072 B / row', gb: 153.6, color: ROLE.query, y: -115 },
      { label: 'INT8 SQ', rowB: '768 B / row', gb: 38.4, color: ROLE.code, y: 25 },
      { label: 'PQ-96', rowB: '96 B / row', gb: 4.8, color: ROLE.A, y: 165 },
    ];

    const nodes = [
      txt(
        'SCALED STORE  ·  50,000,000 ROWS  ×  768 DIMS',
        -855,
        -240,
        30,
        ROLE.gold,
        'mono',
        'left',
      )
        .glow(6, ROLE.gold)
        .opacity(alpha),
      line([barL, -175], [barL, 225], { stroke: '#4c608e', width: 2.5 }).opacity(alpha),
    ];

    items.forEach((it) => {
      const w = Math.max(24, (it.gb / 153.6) * maxW);
      nodes.push(
        txt(it.label, barL - 30, it.y - 14, 34, it.color, 'mono', 'right').opacity(alpha),
        txt(it.rowB, barL - 30, it.y + 24, 26, COSMOS.dim, 'mono', 'right').opacity(alpha),
        lumBar(barL + w / 2, it.y, w, 64, {
          color: it.color,
          fillAlpha: 0.34,
          strokeWidth: 2.6,
          glow: 9,
          opacity: alpha,
        }),
        txt(`${it.gb.toFixed(1)} GB`, barL + w + 28, it.y, 38, it.color, 'mono', 'left')
          .glow(7, it.color)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Decimal GB of row payload alone  ·  codebooks, graph links & originals add separately',
        -855,
        335,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.code, ROLE.query), title, mainLayer, scaleLayer);

  playCue(s, c, 'fp32', (d) => s.play(pFp32.to(1, { duration: d })), { after: true, dur: 0.9 });
  playCue(s, c, 'int8', (d) => s.play(pInt8.to(1, { duration: d })), { after: true, dur: 0.9 });
  playCue(s, c, 'sign', (d) => s.play(pSign.to(1, { duration: d })), { after: true, dur: 0.7 });
  playCue(s, c, 'codes', (d) => s.play(pPq.to(1, { duration: d })), { after: true, dur: 0.9 });
  playCue(s, c, 'book', (d) => s.play(showBook.to(1, { duration: d })), { after: true, dur: 0.55 });
  playCue(s, c, 'originals', (d) => s.play(showOrig.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'scale', (d) => s.play(swapVis(vMain, vScale, d)), { dur: 0.7 });
}
