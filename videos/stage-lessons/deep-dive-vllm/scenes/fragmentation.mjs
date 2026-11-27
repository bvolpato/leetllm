// Scene 03: Derive the wasted space before introducing blocks (12 reserved vs 7 used -> 5 internal waste; 2+3 free vs 4 needed -> external fragmentation; 4-token blocks + div/mod addressing).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function fragmentation(s, c) {
  // step: 0=reserved 12, 1=internal 12-7=5, 2=external 2+3<4, 3=paged 4-pos blocks, 4=div/mod address formula
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1a', '#ff6b8b16');
  const title = heroTitle(['Internal vs External', 'Fragmentation'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'WHY PAGE KV MEMORY · CONTIGUOUS WASTE VS FIXED BLOCKS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 2) {
      // Top: Contiguous 12-slot reservation (7 occupied t0..t6, 5 wasted)
      nodes.push(
        txt(
          'CONTIGUOUS RESERVATION (12 POSITIONS RESERVED · 7 USED)',
          -855,
          -245,
          26,
          ROLE.r0,
          'mono',
          'left',
        ),
      );
      const cw = 132;
      const cg = 10;
      for (let i = 0; i < 12; i++) {
        const cx = -855 + cw * 0.5 + i * (cw + cg);
        const used = i < 7;
        const hiWaste = !used && st >= 1;
        nodes.push(
          glassCell(cx, -172, cw, 78, used ? ROLE.r0 : hiWaste ? COSMOS.gold : COSMOS.dim, {
            fill: used ? '#11223d' : hiWaste ? '#291f0e' : '#0b101d',
            glow: used || hiWaste ? 6 : 2,
          }),
          txt(
            used ? `t${i}` : 'waste',
            cx,
            -172,
            26,
            used ? COSMOS.ink : hiWaste ? COSMOS.gold : COSMOS.dim,
            'mono',
          ),
        );
      }
      nodes.push(
        txt(
          st >= 1
            ? 'INTERNAL FRAGMENTATION: 12 - 7 = 5 UNUSED SLOTS INSIDE RESERVATION'
            : '7 ACTIVE TOKENS + 5 RESERVED EMPTY SLOTS',
          0,
          -90,
          26,
          st >= 1 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
      );

      // Bottom: External fragmentation (2 free + 3 free cannot fit 4 contiguous)
      nodes.push(
        txt(
          'SCATTERED FREE HOLES (5 FREE OVERALL · REQUEST NEEDS 4 CONTIGUOUS)',
          -855,
          16,
          26,
          ROLE.bad,
          'mono',
          'left',
        ),
      );
      // Run A: 2 free
      for (let i = 0; i < 2; i++) {
        const cx = -785 + i * 144;
        nodes.push(
          glassCell(cx, 95, 134, 82, ROLE.good, { fill: '#0e2824', glow: 6 }),
          txt('free', cx, 95, 26, ROLE.good, 'mono'),
        );
      }
      // Busy separator
      nodes.push(
        glassCell(-420, 95, 240, 82, COSMOS.dim, { fill: '#151b2b', glow: 2 }),
        txt('OCCUPIED', -420, 95, 26, COSMOS.muted, 'mono'),
      );
      // Run B: 3 free
      for (let i = 0; i < 3; i++) {
        const cx = -180 + i * 144;
        nodes.push(
          glassCell(cx, 95, 134, 82, ROLE.good, { fill: '#0e2824', glow: 6 }),
          txt('free', cx, 95, 26, ROLE.good, 'mono'),
        );
      }
      // Incoming 4-slot request
      for (let i = 0; i < 4; i++) {
        const cx = 360 + i * 138;
        nodes.push(
          glassCell(cx, 95, 128, 82, ROLE.bad, { fill: '#2c1321', glow: st >= 2 ? 10 : 4 }),
          txt(`req${i}`, cx, 95, 26, ROLE.bad, 'mono'),
        );
      }

      nodes.push(
        txt(
          st >= 2
            ? 'EXTERNAL FRAGMENTATION: 2 + 3 free, no 4-slot fit'
            : 'Contiguous allocators require one uninterrupted run',
          0,
          208,
          26,
          st >= 2 ? ROLE.bad : COSMOS.muted,
          'mono',
        ),
      );
    } else if (st === 3) {
      // Paged 4-position blocks
      nodes.push(
        txt('LOGICAL SEQUENCE (7 TOKENS: t0 .. t6)', -855, -245, 26, ROLE.r0, 'mono', 'left'),
      );
      for (let i = 0; i < 7; i++) {
        const cx = -760 + i * 245;
        nodes.push(
          glassCell(cx, -165, 215, 82, i < 4 ? ROLE.kv : ROLE.r1, { fill: '#102033', glow: 7 }),
          txt(`t${i}`, cx, -165, 32, COSMOS.ink, 'mono'),
        );
      }

      // Two non-adjacent physical blocks
      nodes.push(
        glassCell(-430, 65, 760, 175, ROLE.kv, { fill: '#0d222e', glow: 9 }),
        txt('LOGICAL 0  ->  PHYSICAL BLOCK 12 (FULL)', -430, 12, 26, ROLE.kv, 'mono'),
      );
      for (let j = 0; j < 4; j++) {
        const cx = -700 + j * 180;
        nodes.push(
          glassCell(cx, 92, 160, 74, ROLE.kv, { fill: '#123042', glow: 5 }),
          txt(`t${j}`, cx, 92, 28, COSMOS.ink, 'mono'),
        );
      }

      nodes.push(
        glassCell(430, 65, 760, 175, ROLE.r1, { fill: '#1a1530', glow: 9 }),
        txt('LOGICAL 1  ->  PHYSICAL BLOCK 41 (1 EMPTY TAIL)', 430, 12, 26, ROLE.r1, 'mono'),
      );
      for (let j = 0; j < 4; j++) {
        const cx = 160 + j * 180;
        const empty = j === 3;
        nodes.push(
          glassCell(cx, 92, 160, 74, empty ? COSMOS.gold : ROLE.r1, {
            fill: empty ? '#261f0e' : '#231942',
            glow: empty ? 8 : 5,
          }),
          txt(empty ? '1 free' : `t${4 + j}`, cx, 92, 28, empty ? COSMOS.gold : COSMOS.ink, 'mono'),
        );
      }

      nodes.push(
        txt(
          'External fragmentation disappears; unused capacity shrinks to at most 1 partial tail block',
          0,
          230,
          26,
          ROLE.good,
          'sans',
        ),
      );
    } else {
      // Beat 2: Address math pos = 4 * logical + offset -> physical ID
      const pos = 6;
      const logical = Math.floor(pos / 4);
      const offset = pos % 4;
      const phys = [12, 41][logical];
      nodes.push(
        txt(
          'ZERO-BASED POSITION ADDRESSING (BLOCK SIZE = 4)',
          -855,
          -245,
          26,
          ROLE.kv,
          'mono',
          'left',
        ),
      );
      for (let i = 0; i < 8; i++) {
        const cx = -745 + i * 212;
        const isSel = i === pos;
        nodes.push(
          glassCell(cx, -165, 192, 82, isSel ? COSMOS.gold : i < 4 ? ROLE.kv : ROLE.r1, {
            fill: isSel ? '#2a200d' : '#101c30',
            glow: isSel ? 12 : 4,
          }),
          txt(`pos ${i}`, cx, -165, 28, isSel ? COSMOS.gold : COSMOS.ink, 'mono'),
        );
      }

      nodes.push(
        glassCell(-550, 20, 480, 130, COSMOS.gold, { fill: '#221b0e', glow: 8 }),
        txt('POSITION j', -550, -14, 26, COSMOS.muted, 'mono'),
        txt(`j = ${pos}`, -550, 38, 38, COSMOS.gold, 'mono'),

        glassCell(0, 20, 520, 130, ROLE.kv, { fill: '#0e2432', glow: 8 }),
        txt('FLOOR DIV + REMAINDER', 0, -14, 26, COSMOS.muted, 'mono'),
        txt(`logical = ${logical}  |  offset = ${offset}`, 0, 38, 32, ROLE.kv, 'mono'),

        glassCell(560, 20, 480, 130, ROLE.good, { fill: '#0e2a24', glow: 9 }),
        txt('BLOCK TABLE LOOKUP', 560, -14, 26, COSMOS.muted, 'mono'),
        txt(`physical ${phys} [ ${offset} ]`, 560, 38, 34, ROLE.good, 'mono'),

        glowTex(
          String.raw`j = 6 = 4 \cdot 1 + 2 \;\Longrightarrow\; \text{table}[1] = 41,\; \text{offset } 2`,
          {
            x: 0,
            y: 195,
            size: 40,
            color: COSMOS.gold,
            glow: 6,
          },
        ),
      );
    }

    nodes.push(
      txt(
        st <= 2
          ? 'Contiguous reservation leaks both internal and external capacity'
          : st === 3
            ? 'Physical placement changes freely without permuting logical token order'
            : 'Real block sizes depend on the attention backend; logical addressing stays identical',
        0,
        378,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['vv-fragmentation-op-0', 0],
    ['vv-fragmentation-internal', 1],
    ['vv-fragmentation-external', 2],
    ['vv-fragmentation-op-1', 3],
    ['vv-fragmentation-op-2', 4],
  ]);
}
