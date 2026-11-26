// Scene 3: The words in the runbooks (Multi-query vocabulary expansion + dedup + cap)
import {
  COSMOS,
  PROPOSALS,
  VARIANTS,
  aura,
  expandQueries,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeFanout3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function vocabularyExpansion(s, c) {
  const phase = s.value(0);
  const vocabStage = s.value(0); // 0 -> 1 (burst) -> 2 (queue) -> 3 (capacity)
  const slotStage = s.value(0); // 0 -> 1 (first) -> 2 (dup) -> 3 (next) -> 4 (last) -> 5 (extra)

  const bgAura = aura(0, 10, 680, '#12345e26', '#291a5216');
  const title = heroTitle(['The Words in', 'the Runbooks'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'MULTI-QUERY EXPANSION · ORIGINAL + 3 BOUNDED SLOTS',
  });

  const { view: stage3d, orbit: orbit3d } = makeFanout3D(590, 10, phase);
  const accepted = expandQueries('peak demand handling', PROPOSALS, 3).slice(1);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const vs = vocabStage.value;
    const ss = slotStage.value;
    const pulse = 0.74 + 0.26 * Math.sin(p * 3.8);

    const nodes = [
      txt('3D MULTI-QUERY FAN-OUT', 590, -345, 26, COSMOS.cyan, 'mono'),
      txt('3 distinct search hypotheses on same corpus', 590, 360, 26, COSMOS.muted, 'sans'),

      // Original query header bar
      glassCell(-340, -172, 1030, 74, COSMOS.blue, { fill: '#10203b', glow: 6 }),
      txt('ORIGINAL (KEPT):', -830, -170, 26, COSMOS.blue, 'mono', 'left'),
      txt('"peak demand handling"', -530, -170, 30, COSMOS.ink, 'sans', 'left'),

      // Left column: 5 incoming proposals with dedup & cap decisions
      txt('INCOMING PROPOSALS (5)', -855, -96, 26, COSMOS.muted, 'mono', 'left'),
      // Right-middle column: 3 additional search slots
      txt('ADDITIONAL SLOTS (LIMIT 3)', -268, -96, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    const proposalMeta = [
      { label: PROPOSALS[0].trim(), status: '#1', col: COSMOS.blue, thr: 0.6 },
      { label: PROPOSALS[1].trim(), status: 'dup', col: COSMOS.amber, thr: 1.6 },
      { label: PROPOSALS[2].trim(), status: '#2', col: COSMOS.cyan, thr: 2.6 },
      { label: PROPOSALS[3].trim(), status: '#3', col: COSMOS.gold, thr: 3.6 },
      { label: PROPOSALS[4].trim(), status: 'cap', col: COSMOS.rose, thr: 4.6 },
    ];

    proposalMeta.forEach((item, idx) => {
      const y = -28 + idx * 74;
      const decided = ss >= item.thr;
      const isSkip = idx === 1 || idx === 4;
      const border = decided ? item.col : COSMOS.dim;
      nodes.push(
        glassCell(-575, y, 560, 60, border, {
          fill: decided && isSkip ? '#26141a' : '#11182c',
          glow: decided ? 6 : 2,
          radius: 10,
        }),
        txt(
          item.label,
          -838,
          y + 2,
          26,
          decided && isSkip ? COSMOS.muted : COSMOS.ink,
          'sans',
          'left',
        ),
        txt(
          decided ? item.status : '...',
          -312,
          y + 2,
          26,
          decided ? item.col : COSMOS.dim,
          'mono',
          'right',
        ),
      );
    });

    const slotMeta = [
      { title: 'SLOT 1 · BURST QUOTA', text: accepted[0], col: COSMOS.blue, vThr: 0.5, sThr: 0.6 },
      { title: 'SLOT 2 · QUEUE', text: accepted[1], col: COSMOS.cyan, vThr: 1.5, sThr: 2.6 },
      { title: 'SLOT 3 · CAPACITY', text: accepted[2], col: COSMOS.gold, vThr: 2.5, sThr: 3.6 },
    ];

    slotMeta.forEach((slot, idx) => {
      const y = -8 + idx * 124;
      const admitted = ss >= slot.sThr;
      const previewed = vs >= slot.vThr;
      nodes.push(
        glassCell(-46, y, 444, 102, admitted ? slot.col : previewed ? COSMOS.muted : COSMOS.dim, {
          fill: admitted ? '#0f2338' : '#11182c',
          glow: admitted ? 8 * pulse : 2,
        }),
        txt(slot.title, -252, y - 24, 26, admitted ? slot.col : COSMOS.muted, 'mono', 'left'),
        txt(
          admitted ? slot.text : previewed ? 'runbook term ready' : 'empty slot',
          -252,
          y + 20,
          26,
          admitted ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ),
      );
    });

    const bottomCol = ss >= 4.6 ? COSMOS.emerald : COSMOS.cyan;
    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(
        ss >= 4.6
          ? 'Keep original + 3 unique variants · skip case duplicates and overflow'
          : 'Expand clear subjects into runbook vocabulary under a strict slot cap',
        -812,
        370,
        28,
        bottomCol,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 12);
  orbit3d(s, c);

  c.on('variant-burst', () => s.play(vocabStage.to(1, { duration: 0.35 })));
  c.on('variant-queue', () => s.play(vocabStage.to(2, { duration: 0.35 })));
  c.on('variant-capacity', () => s.play(vocabStage.to(3, { duration: 0.35 })));
  c.on('variant-first', () => s.play(slotStage.to(1, { duration: 0.35 })));
  c.on('variant-repeat', () => s.play(slotStage.to(2, { duration: 0.35 })));
  c.on('variant-next', () => s.play(slotStage.to(3, { duration: 0.35 })));
  c.on('variant-last', () => s.play(slotStage.to(4, { duration: 0.35 })));
  c.on('variant-extra', () =>
    s.play(slotStage.to(5, { duration: remainDuration(c, 'variant-extra', 0.4) })),
  );
}
