// Scene 05: Where do the expert tokens go? 3x3 All-to-All transpose (col 1: 2, 20, 200) -> uneven [2,1,3] padded to 9 -> grouped Send/Recv variable exchange.
import {
  ALLTOALL_3X3,
  ALLTOALL_DEST,
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function alltoallLayout(s, c) {
  const phase = s.value(0);
  // step: 0=3x3 equal chunks, 1=uneven [2,1,3] padded to 9, 2=grouped Send/Recv without padding
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#a78bfa1e', '#ffd16618');
  const title = heroTitle(['Where Do the', 'Expert Tokens Go?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.r3,
    eyebrow: 'ALL-TO-ALL TRANSPOSE · UNEVEN MOE ROUTING',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st === 0) {
      nodes.push(
        txt('SOURCE ROWS (3 GPUS)', -440, -218, 28, ROLE.r0, 'mono'),
        txt('DEST ROWS (TRANSPOSED)', 440, -218, 28, ROLE.good, 'mono'),
      );
      for (let r = 0; r < 3; r++) {
        const y = -110 + r * 110;
        nodes.push(
          txt(`S${r}`, -745, y, 28, COSMOS.muted, 'mono'),
          txt(`D${r}`, 135, y, 28, r === 1 ? COSMOS.gold : COSMOS.muted, 'mono'),
        );
        for (let cIdx = 0; cIdx < 3; cIdx++) {
          const sx = -610 + cIdx * 170;
          const dx = 270 + cIdx * 170;
          const isMidCol = cIdx === 1;
          const isMidDest = r === 1;
          nodes.push(
            glassCell(sx, y, 146, 84, isMidCol ? COSMOS.gold : ROLE.r0, {
              fill: isMidCol ? '#261e0e' : '#0f1d36',
              glow: isMidCol ? 9 : 3,
            }),
            txt(
              String(ALLTOALL_3X3[r][cIdx]),
              sx,
              y,
              32,
              isMidCol ? COSMOS.gold : COSMOS.ink,
              'mono',
            ),
            glassCell(dx, y, 146, 84, isMidDest ? ROLE.good : ROLE.comm, {
              fill: isMidDest ? '#0d2924' : '#0e202c',
              glow: isMidDest ? 9 : 3,
            }),
            txt(
              String(ALLTOALL_DEST[r][cIdx]),
              dx,
              y,
              32,
              isMidDest ? ROLE.good : COSMOS.ink,
              'mono',
            ),
          );
        }
      }
    } else {
      nodes.push(
        txt('ONE SOURCE · 6 TOKENS TO 3 EXPERTS: [2, 1, 3]', 0, -220, 28, COSMOS.gold, 'mono'),
        glassCell(-430, -35, 760, 240, st === 1 ? ROLE.bad : COSMOS.dim, {
          fill: st === 1 ? '#2b1220' : '#0c1220',
          glow: st === 1 ? 10 : 2,
        }),
        txt(
          'EQUAL-CHUNK ALL-TO-ALL (PADDED)',
          -430,
          -110,
          28,
          st === 1 ? ROLE.bad : COSMOS.muted,
          'mono',
        ),
        txt('D0:[T,T,PAD] D1:[T,PAD,PAD] D2:[T,T,T]', -430, -36, 26, COSMOS.ink, 'mono'),
        txt('6 useful tokens -> 9 wire slots (3 wasted!)', -430, 36, 26, ROLE.bad, 'mono'),

        glassCell(430, -35, 760, 240, st === 2 ? ROLE.good : COSMOS.dim, {
          fill: st === 2 ? '#0d2924' : '#0c1220',
          glow: st === 2 ? 10 : 2,
        }),
        txt(
          'GROUPED SEND / RECV (VARIABLE)',
          430,
          -110,
          28,
          st === 2 ? ROLE.good : COSMOS.muted,
          'mono',
        ),
        txt('Group: send(2)->D0, send(1)->D1, send(3)->D2', 430, -36, 26, COSMOS.ink, 'mono'),
        txt('0 padding · peer & count must match both ends!', 430, 36, 26, ROLE.good, 'mono'),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 275, { radius: 6, color: st === 2 ? ROLE.good : COSMOS.gold }),
      txt(
        st === 2
          ? 'Group sends with matching receives so variable expert exchanges make forward progress'
          : st === 1
            ? 'Fixed-chunk AllToAll pads every destination up to max count (3 -> 9 slots)'
            : 'All-to-All transposes source-owned rows into destination-owned columns without reducing values',
        0,
        355,
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
    ['nc-alltoall-layout-b0-s0', 0],
    ['nc-alltoall-layout-b0-s1', 0],
    ['nc-alltoall-layout-b0-s2', 0],
    ['nc-alltoall-layout-b0-s3', 0],
    ['nc-alltoall-layout-b0-s4', 0],
    ['nc-alltoall-layout-b1-s0', 1],
    ['nc-alltoall-layout-b1-s1', 1],
    ['nc-alltoall-layout-b1-s2', 1],
    ['nc-alltoall-layout-b1-s3', 1],
    ['nc-alltoall-layout-b2-s0', 2],
    ['nc-alltoall-layout-b2-s1', 2],
    ['nc-alltoall-layout-b2-s2', 2],
    ['nc-alltoall-layout-b2-s3', 2],
  ]);
}
