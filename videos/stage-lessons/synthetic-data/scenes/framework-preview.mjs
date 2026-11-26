// Scene 14: Bind each generated column to its dependencies (NeMo Data Designer DAG + 2-row S12 local batch preview)
import {
  ADMISSION_FIXTURES,
  COMPLIANT_RUN,
  COSMOS,
  OVERSIZED_RUN,
  SEED_METADATA,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function frameworkPreview(s, c) {
  const phase = s.value(0);
  const sContract = s.value(0);
  const sVerify = s.value(0);
  const sDeps = s.value(0);
  const sPreview = s.value(0);
  const sReqs = s.value(0);
  const sRecs = s.value(0);
  const sGood = s.value(0);
  const sBad = s.value(0);

  const bgAura = aura(0, 15, 680, '#13385c2a', '#2b1c4e18');

  const title = heroTitle(['Bind Each Generated Column', 'to Its Dependencies'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'DECLARATIVE PIPELINES · DEPENDENCY DAG & BATCH PREVIEW',
  });

  const c1Row = ADMISSION_FIXTURES.find((r) => r.id === 'C1');
  const c4Row = ADMISSION_FIXTURES.find((r) => r.id === 'C4');

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    // Act 2: Two-row S12 batch preview side by side
    if (sPreview.value > 0.5) {
      const rq = sReqs.value > 0.2;
      const rc = sRecs.value > 0.2;
      const gd = sGood.value > 0.5;
      const bd = sBad.value > 0.5;

      const items = [
        {
          cx: -435,
          row: c1Row,
          run: COMPLIANT_RUN,
          revealed: gd,
          col: COSMOS.emerald,
          detail: COMPLIANT_RUN.result.items.join(' · '),
        },
        {
          cx: 435,
          row: c4Row,
          run: OVERSIZED_RUN,
          revealed: bd,
          col: COSMOS.rose,
          detail: `HTTP ${OVERSIZED_RUN.trace[0].response.status} · ${OVERSIZED_RUN.result.error}`,
        },
      ];

      const nodes = [
        txt(
          'SMALL-BATCH PREVIEW BEFORE SCALING (BOTH DESCEND FROM S12)',
          0,
          -196,
          26,
          COSMOS.cyan,
          'mono',
        ),
      ];

      items.forEach(({ cx, row, run, revealed, col, detail }) => {
        const leftX = cx - 355;
        nodes.push(
          glassCell(cx, 78, 790, 444, revealed ? col : COSMOS.blue, {
            fill: revealed ? (run.accepted ? '#0d2522' : '#261018') : '#0f1c32',
            glow: revealed ? 8 * pulse : 5,
          }),
          txt(`${row.id}  /  ${row.task}`, leftX, -104, 38, COSMOS.blue, 'mono', 'left'),
          txt(`seed_id: ${row.seed}`, cx + 355, -104, 26, COSMOS.muted, 'mono', 'right'),
          line([leftX, -66], [cx + 355, -66], { stroke: COSMOS.rule, width: 2 }),

          txt('FIRST REQUEST', leftX, -12, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            rq ? `limit = ${run.requests[0].limit.toLocaleString('en-US')}` : 'limit = pending...',
            leftX,
            42,
            38,
            rq ? (run.accepted ? COSMOS.cyan : COSMOS.amber) : COSMOS.dim,
            'mono',
            'left',
          ),

          txt('VERIFIER RECEIPT', leftX, 128, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            revealed
              ? `${run.result.items.length} names collected`
              : rc
                ? 'opening receipt...'
                : 'receipt unopened',
            leftX,
            184,
            38,
            revealed ? col : COSMOS.dim,
            'mono',
            'left',
          ),
          txt(
            revealed ? detail : 'store prompt + model + seed + receipt together',
            leftX,
            246,
            26,
            revealed ? COSMOS.ink : COSMOS.muted,
            'mono',
            'left',
          ),
        );
      });

      nodes.push(
        txt(
          'Store responses, receipts, seed, prompt & model versions · source permissions need separate evidence',
          0,
          368,
          26,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes);
    }

    // Act 1: Dependency-aware declarative column DAG
    const ctr = Math.max(0.75, sContract.value);
    const ver = sVerify.value;
    const dep = sDeps.value;

    const nodes = [
      // Column 1 inputs (left)
      glassCell(-465, -108, 680, 118, COSMOS.blue, { fill: '#0e1d36', glow: 6 }),
      txt(`INPUT 1: ${SEED_METADATA.id} · reviewed contract`, -465, -106, 28, COSMOS.blue, 'mono'),

      glassCell(-465, 68, 680, 118, COSMOS.blue, { fill: '#0e1d36', glow: 6 }),
      txt('INPUT 2: Generated search task', -465, 70, 28, COSMOS.blue, 'mono'),

      // Column 2 derived answer (top-right)
      glassCell(445, -20, 680, 134, COSMOS.cyan, {
        fill: '#0f2338',
        glow: ctr > 0.8 ? 8 * pulse : 4,
        opacity: ctr,
      }),
      txt('DERIVED COLUMN: Proposed answer', 445, -42, 28, COSMOS.cyan, 'mono'),
      txt('depends on (S12 contract, task)', 445, 8, 26, COSMOS.muted, 'sans'),

      // Trusted fixture (bottom-left)
      glassCell(-465, 258, 680, 118, ver > 0.2 ? COSMOS.gold : COSMOS.rule, {
        fill: ver > 0.2 ? '#231b0d' : '#0b101d',
        glow: ver > 0.2 ? 7 : 1,
        opacity: Math.max(0.74, ver),
      }),
      txt('INPUT 3: Trusted two-page fixture', -465, 260, 28, COSMOS.gold, 'mono'),

      // Verifier receipt (bottom-right)
      glassCell(445, 258, 680, 118, ver > 0.2 ? COSMOS.emerald : COSMOS.rule, {
        fill: ver > 0.2 ? '#0e2824' : '#0b101d',
        glow: ver > 0.2 ? 9 * pulse : 1,
        opacity: Math.max(0.74, ver),
      }),
      txt('DERIVED COLUMN: Verifier receipt', 445, 238, 28, COSMOS.emerald, 'mono'),
      txt(
        'recompute whenever answer changes!',
        445,
        282,
        26,
        ver > 0.2 ? COSMOS.ink : COSMOS.dim,
        'sans',
      ),

      // Dependency edges
      glowingArc([-118, -108], [98, -42], -12, { color: COSMOS.blue, width: 3.4, opacity: ctr }),
      glowingArc([-118, 68], [98, 2], 12, { color: COSMOS.blue, width: 3.4, opacity: ctr }),
      glowDot(98, -20, { radius: 6, color: COSMOS.cyan, opacity: ctr }),

      // Footer note
      txt(
        dep > 0.2
          ? 'NeMo Data Designer (Sep 2026 preprint): declarative columns, samplers, validation & live preview'
          : 'Change an upstream answer -> its old verification receipt is stale',
        0,
        390,
        26,
        dep > 0.2 ? COSMOS.cyan : COSMOS.muted,
        'sans',
      ),
    ];

    if (ver > 0.15) {
      nodes.push(
        glowingArc([445, 52], [445, 194], 0, { color: COSMOS.cyan, width: 3.6, opacity: ver }),
        glowingArc([-118, 258], [98, 258], 0, { color: COSMOS.gold, width: 3.6, opacity: ver }),
        glowDot(445, 194, { radius: 6, color: COSMOS.emerald, opacity: ver }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('column-contract', () => s.play(sContract.to(1, { duration: 0.45 })));
  c.on('column-verify', () => s.play(sVerify.to(1, { duration: 0.5 })));
  c.on('column-dependencies', () => s.play(sDeps.to(1, { duration: 0.45 })));
  c.on('preview-small', () => s.play(sPreview.to(1, { duration: 0.35 })));
  c.on('preview-requests', () => s.play(sReqs.to(1, { duration: 0.45 })));
  c.on('preview-receipts', () => s.play(sRecs.to(1, { duration: 0.45 })));
  c.after('preview-good', () => s.play(sGood.to(1, { duration: 0.35 })));
  c.after('preview-bad', () =>
    s.play(sBad.to(1, { duration: remainDuration(c, 'preview-bad', 0.4) })),
  );
}
