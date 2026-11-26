// Scene 03: From a logical key to its cache slot: div/mod lookup for k5 -> (14, 1) and k8 -> (6, 0).
import {
  ADDR_5,
  ADDR_8,
  COSMOS,
  PAGE_SIZE,
  R2_PAGES,
  ROLE,
  aura,
  buildPagedKvRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function pages(s, c) {
  const phase = s.value(0);
  const entryVal = s.value(0);
  const slotVal = s.value(0);
  const askK5 = s.value(0);
  const revK5 = s.value(0);
  const askK8 = s.value(0);
  const revK8 = s.value(0);

  const bgAura = aura(430, 20, 520, '#5ce1e622', '#ffd16618');
  const { view: kv3d } = buildPagedKvRig3d(entryVal, slotVal, phase, { x: 440, y: 20, unit: 102 });

  const title = heroTitle(['Logical Key to', 'Cache Slot'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: ROLE.r2,
    eyebrow: 'PAGED KV INDIRECTION · PAGE SIZE = 4',
    subtitle: 'entry = pos // 4,  slot = pos % 4',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const a5 = askK5.value;
    const r5 = revK5.value;
    const a8 = askK8.value;
    const r8 = revK8.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('3D PHYSICAL KV PAGES (R2 ORDER: 3, 14, 6)', 440, -405, 26, COSMOS.cyan, 'mono').glow(
        5,
        COSMOS.cyan,
      ),
      txt(
        r8 > 0.5
          ? 'Page 6 holds k8 in slot 0; slots 1..3 are unused tail'
          : r5 > 0.5
            ? 'Gold cage locks onto Page 14, slot 1 for k5'
            : 'Four slots per physical page, numbered 0..3',
        440,
        420,
        26,
        r8 > 0.5 ? ROLE.good : r5 > 0.5 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    ];

    // Three 4-slot page rows stacked cleanly on the left side
    R2_PAGES.forEach((pageId, entryIdx) => {
      const rowY = -125 + entryIdx * 138;
      const isK5Page = r5 > 0.5 && a8 < 0.5 && entryIdx === 1;
      const isK8Page = r8 > 0.5 && entryIdx === 2;
      nodes.push(
        txt(
          `entry ${entryIdx} -> Page ${pageId}`,
          -855,
          rowY - 52,
          26,
          isK5Page || isK8Page ? COSMOS.gold : ROLE.r2,
          'mono',
          'left',
        ),
      );
      for (let slot = 0; slot < PAGE_SIZE; slot++) {
        const keyIdx = entryIdx * PAGE_SIZE + slot;
        const occupied = keyIdx < 9;
        const isTarget5 = r5 > 0.5 && a8 < 0.5 && keyIdx === 5;
        const isTarget8 = r8 > 0.5 && keyIdx === 8;
        const isTarget = isTarget5 || isTarget8;
        const cx = -765 + slot * 195;

        // Withhold k5/k8 location labels while prediction is active!
        let cellLabel = occupied ? `k${keyIdx}` : '·';
        if (keyIdx === 5 && r5 < 0.5) cellLabel = '?';
        if (keyIdx === 8 && r8 < 0.5) cellLabel = '?';

        const stroke = isTarget ? COSMOS.gold : occupied ? ROLE.r2 : COSMOS.dim;
        const fill = isTarget ? '#2c2210' : occupied ? '#102438' : '#0b101d';
        nodes.push(
          glassCell(cx, rowY + 12, 174, 72, stroke, {
            fill,
            glow: isTarget ? 11 * pulse : occupied ? 4 : 0,
            dash: occupied ? undefined : [8, 6],
            opacity: occupied ? 0.95 : 0.55,
          }),
          txt(
            `s${slot}: ${cellLabel}`,
            cx,
            rowY + 12,
            28,
            isTarget ? COSMOS.gold : occupied ? COSMOS.ink : COSMOS.dim,
            'mono',
          ),
        );
      }
    });

    // Bottom computation readout box (strictly withheld until answer cues!)
    let bannerCol = COSMOS.muted;
    let line1 = 'Pages in R2 logical order: [3, 14, 6]';
    let line2 = 'Serving engine owns the page table';

    if (a5 > 0.5 && r5 < 0.5) {
      bannerCol = COSMOS.gold;
      line1 = 'Predict: where does key 5 live?';
      line2 = 'Compute entry = 5 // 4 and slot = 5 % 4';
    } else if (r5 > 0.5 && a8 < 0.5) {
      bannerCol = ROLE.good;
      line1 = `5 // 4 = 1 (Page ${ADDR_5.page}) · 5 % 4 = ${ADDR_5.slot}`;
      line2 = `Key 5 -> Page ${ADDR_5.page}, slot ${ADDR_5.slot}`;
    } else if (a8 > 0.5 && r8 < 0.5) {
      bannerCol = COSMOS.gold;
      line1 = 'Now try key 8: 8 // 4 and 8 % 4?';
      line2 = 'Check the third entry in [3, 14, 6]';
    } else if (r8 > 0.5) {
      bannerCol = ROLE.good;
      line1 = `8 // 4 = 2 (Page ${ADDR_8.page}) · 8 % 4 = ${ADDR_8.slot}`;
      line2 = `Key 8 -> Page ${ADDR_8.page}, slot ${ADDR_8.slot} (tail = 1 of 4)`;
    }

    nodes.push(
      glassCell(-472, 348, 765, 112, bannerCol, { fill: '#0e172a', glow: 8 }),
      txt(line1, -472, 324, 30, bannerCol, 'mono').glow(5, bannerCol),
      txt(line2, -472, 372, 26, COSMOS.ink, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, kv3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, kv3d, { theta: -0.2, phi: 0.92 });

  c.on('pages-five', () => s.play(askK5.to(1, { duration: remainDuration(c, 'pages-five', 0.4) })));
  c.after('pages-address', () => {
    s.play(revK5.to(1, { duration: remainAfter(c, 'pages-address', 0.4) }));
    s.play(entryVal.to(1, { duration: remainAfter(c, 'pages-address', 0.55) }));
    s.play(slotVal.to(1, { duration: remainAfter(c, 'pages-address', 0.55) }));
  });
  c.on('pages-eight', () =>
    s.play(askK8.to(1, { duration: remainDuration(c, 'pages-eight', 0.4) })),
  );
  c.after('pages-tail', () => {
    s.play(revK8.to(1, { duration: remainAfter(c, 'pages-tail', 0.4) }));
    s.play(entryVal.to(2, { duration: remainAfter(c, 'pages-tail', 0.55) }));
    s.play(slotVal.to(0, { duration: remainAfter(c, 'pages-tail', 0.55) }));
  });
}
