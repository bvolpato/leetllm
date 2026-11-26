// Scene 03: Will the return statement still run?: Raw HTML page to clean extracted body + 4-space indentation check.
import {
  COSMOS,
  aura,
  extractionFixture,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  markDecoration,
  photonStream,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function extract(s, c) {
  const phase = s.value(0);
  const navDim = s.value(0);
  const bodySelect = s.value(0);
  const proseCopy = s.value(0);
  const navDrop = s.value(0);
  const codeCopy = s.value(0);
  const policyTag = s.value(0);
  const sourceTypes = s.value(0);

  const bgAura = aura(0, 10, 620, '#16284d2a', '#a78bfa12');
  const title = heroTitle(['Extract the Body,', 'Keep the Spaces'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'INGESTION & EXTRACTION · SOURCE PAGE P1',
  });

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const nd = navDim.value;
    const bs = bodySelect.value;
    const pc = proseCopy.value;
    const dr = navDrop.value;
    const cc = codeCopy.value;
    const pt = policyTag.value;
    const st = sourceTypes.value;

    const leftX = -460;
    const rightX = 460;
    const rowStart = -180;
    const rowPitch = 94;

    const nodes = [
      txt('RAW RESPONSE · PAGE P1', leftX, -255, 28, COSMOS.blue, 'mono'),
      txt('EXTRACTED RECORD · C', rightX, -255, 28, COSMOS.cyan, 'mono'),
    ];

    // Source rows on left
    extractionFixture.forEach((row, i) => {
      const y = rowStart + i * rowPitch;
      const isNav = row.role !== 'body';
      const isCode = Boolean(row.code);
      const op = isNav ? 1 - 0.55 * nd - 0.25 * dr : 1;
      const stroke = isNav
        ? COSMOS.rose
        : isCode
          ? COSMOS.violet
          : bs > 0.5
            ? COSMOS.cyan
            : COSMOS.blue;

      nodes.push(
        glassCell(leftX, y, 710, 74, stroke, {
          fill: isNav ? '#181020' : isCode ? '#13162c' : '#0f1a2f',
          glow: !isNav && bs > 0.5 ? 8 : 2,
          opacity: op,
          dash: isNav ? [8, 6] : undefined,
        }),
        txt(
          row.text,
          leftX - 325,
          y + 2,
          30,
          isNav ? COSMOS.rose : isCode ? COSMOS.violet : COSMOS.ink,
          isCode ? 'mono' : 'sans',
          'left',
        ).opacity(op),
        txt(
          isNav ? row.role.toUpperCase() : isCode ? 'CODE' : 'BODY',
          leftX + 325,
          y + 2,
          26,
          isNav ? COSMOS.rose : COSMOS.muted,
          'mono',
          'right',
        ).opacity(op),
      );
    });

    // Glowing bracket highlighting selected body rows (indices 1..4)
    if (bs > 0.02) {
      const topY = rowStart + 1 * rowPitch - 42;
      const botY = rowStart + 4 * rowPitch + 42;
      nodes.push(
        glowingTrail(
          [
            [leftX - 375, topY],
            [leftX - 390, topY],
            [leftX - 390, botY],
            [leftX - 375, botY],
          ],
          { color: COSMOS.cyan, width: 4, glow: 10, opacity: bs },
        ),
      );
    }

    // Photon transfer conduits across the center
    const bodyRows = extractionFixture.filter((r) => r.role === 'body');
    bodyRows.forEach((row, idx) => {
      const srcY = rowStart + (idx + 1) * rowPitch;
      const dstY = rowStart + (idx + 1) * rowPitch;
      const copyAmt = row.code ? cc : pc;
      if (copyAmt > 0.02) {
        nodes.push(
          ...photonStream([leftX + 365, srcY], [rightX - 365, dstY], 0, ph + idx * 0.6, {
            color: row.code ? COSMOS.violet : COSMOS.cyan,
            count: 3,
            opacity: copyAmt,
          }),
          glassCell(rightX, dstY, 710, 74, row.code ? COSMOS.violet : COSMOS.cyan, {
            fill: row.code ? '#141730' : '#0f1c32',
            glow: 8,
            opacity: copyAmt,
          }),
          txt(
            row.text,
            rightX - 325,
            dstY + 2,
            30,
            row.code ? COSMOS.violet : COSMOS.ink,
            row.code ? 'mono' : 'sans',
            'left',
          ).opacity(copyAmt),
        );
      }
    });

    // Highlight the 4 leading spaces before `return a + b`!
    if (cc > 0.5) {
      const retY = rowStart + 4 * rowPitch;
      for (let sp = 0; sp < 4; sp++) {
        nodes.push(
          markDecoration(
            rect(14, 6, { fill: COSMOS.gold, stroke: null, radius: 3 })
              .at(rightX - 317 + sp * 18, retY + 22)
              .glow(6, COSMOS.gold)
              .opacity(cc),
          ),
        );
      }
      nodes.push(
        txt(
          '4 leading spaces intact · Python block valid',
          rightX,
          retY + 82,
          28,
          COSMOS.gold,
          'mono',
        )
          .glow(6, COSMOS.gold)
          .opacity(cc),
      );
    }

    // Bottom lineage & policy ribbon
    if (pt > 0.02) {
      nodes.push(
        txt(
          'LINEAGE: source_id = P1  ·  extraction_policy = v1.4  ·  raw HTML preserved',
          0,
          388,
          28,
          COSMOS.emerald,
          'mono',
        )
          .glow(6, COSMOS.emerald)
          .opacity(pt),
      );
    }
    if (st > 0.02) {
      nodes.push(
        txt(
          'Inspect prose, code, tables, and equations on their own sources before scaling',
          0,
          444,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(st),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('extract-b1-1', () =>
    s.play(navDim.to(1, { duration: remainDuration(c, 'extract-b1-1', 0.6) })),
  );
  c.on('extract-b1-2', () =>
    s.play(bodySelect.to(1, { duration: remainDuration(c, 'extract-b1-2', 0.7) })),
  );
  c.on('extract-b2-1', () =>
    s.play(proseCopy.to(1, { duration: remainDuration(c, 'extract-b2-1', 0.8) })),
  );
  c.on('extract-b2-2', () =>
    s.play(navDrop.to(1, { duration: remainDuration(c, 'extract-b2-2', 0.6) })),
  );
  c.on('extract-code', () =>
    s.play(codeCopy.to(1, { duration: remainDuration(c, 'extract-code', 0.9) })),
  );
  c.on('extract-b3-1', () =>
    s.play(policyTag.to(1, { duration: remainDuration(c, 'extract-b3-1', 0.6) })),
  );
  c.on('extract-b3-2', () =>
    s.play(sourceTypes.to(1, { duration: remainDuration(c, 'extract-b3-2', 0.6) })),
  );
}
