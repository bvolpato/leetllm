// Scene 06: Decode a global rank and check its owning groups (Rank 27 -> mod/div -> tp=3, cp=0, dp=3, pp=0; rebuild 3+24=27; TP=[24..27], DP=[3,11,19,27], PP=[27,59]).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meshCoords,
  meshGroup,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function rankAlgorithm(s, c) {
  const phase = s.value(0);
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#ffd16618');
  const title = heroTitle(['Decode Rank 27', '& Verify Its Groups'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.tp,
    eyebrow: 'REMAINDER & INTEGER DIVISION · RANK GENERATOR',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;
    const cd = meshCoords(27);
    const tpG = meshGroup(27, 'tp');
    const dpG = meshGroup(27, 'dp');
    const ppG = meshGroup(27, 'pp');

    const divs = [
      { k: 'TP (size 4)', eq: `27 % 4 = ${cd.tp}`, next: '27 // 4 = 6', col: ROLE.tp, x: -570 },
      { k: 'CP (size 2)', eq: `6 % 2 = ${cd.cp}`, next: '6 // 2 = 3', col: ROLE.cp, x: -190 },
      { k: 'DP (size 4)', eq: `3 % 4 = ${cd.dp}`, next: '3 // 4 = 0', col: ROLE.dp, x: 190 },
      { k: 'PP (size 2)', eq: `0 % 2 = ${cd.pp}`, next: '3 + 24 = 27!', col: ROLE.pp, x: 570 },
    ];

    const nodes = [
      txt('DECODING GLOBAL RANK 27  (TP=4, CP=2, DP=4, PP=2)', 0, -225, 28, COSMOS.gold, 'mono'),
    ];
    divs.forEach((d) => {
      nodes.push(
        glassCell(d.x, -95, 340, 174, d.col, { fill: '#111b31', glow: st < 2 ? 9 : 4 }),
        txt(d.k, d.x, -148, 26, d.col, 'mono'),
        txt(d.eq, d.x, -94, 32, COSMOS.ink, 'mono'),
        txt(d.next, d.x, -38, 26, COSMOS.gold, 'mono'),
      );
    });

    // Bottom 3 peer group cards
    nodes.push(
      glassCell(-550, 145, 480, 168, st >= 3 ? ROLE.tp : COSMOS.dim, {
        fill: st >= 3 ? '#0f1d36' : '#0a0f1c',
        glow: st === 3 ? 11 : 4,
      }),
      txt('TP GROUP', -550, 96, 26, ROLE.tp, 'mono'),
      txt(`[ ${tpG.join(', ')} ]`, -550, 158, 30, st >= 3 ? COSMOS.ink : COSMOS.dim, 'mono'),

      glassCell(0, 145, 480, 168, st >= 4 ? ROLE.dp : COSMOS.dim, {
        fill: st >= 4 ? '#0d2624' : '#0a0f1c',
        glow: st === 4 ? 11 : 4,
      }),
      txt('PURE DP GROUP', 0, 96, 26, ROLE.dp, 'mono'),
      txt(`[ ${dpG.join(', ')} ]`, 0, 158, 30, st >= 4 ? COSMOS.ink : COSMOS.dim, 'mono'),

      glassCell(550, 145, 480, 168, st >= 5 ? ROLE.pp : COSMOS.dim, {
        fill: st >= 5 ? '#1f153a' : '#0a0f1c',
        glow: st >= 5 ? 11 : 4,
      }),
      txt('PP PARTNER', 550, 96, 26, ROLE.pp, 'mono'),
      txt(`[ ${ppG.join(', ')} ]`, 550, 158, 30, st >= 5 ? COSMOS.ink : COSMOS.dim, 'mono'),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 285, { radius: 6, color: COSMOS.gold }),
      txt(
        'Batch count uses PURE DP replicas; dense gradient ownership can span DP × CP peers',
        0,
        360,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['mg-rank-algorithm-b0', 0],
    ['mg-rank-rebuild', 1],
    ['mg-rank-algorithm-b1', 2],
    ['mg-rank-tp-group', 3],
    ['mg-rank-dp-group', 4],
    ['mg-rank-pp-group', 5],
  ]);
}
