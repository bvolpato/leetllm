// Scene 19: close: "Keep the shares"
// View 1: Keep shares 30%/70%, change Birds value [2,1] -> [2,3] -> withhold answer until spoken reveal
//         -> blue piece grows by +0.60 underneath green piece -> output [1.30, 2.30] -> W_O & residual context.
// View 2: Stylized glowing bird image cut into 4 ViT patches -> top-left query withheld -> all-4 bidirectional read beams!
import { circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  NEW_OUTPUT,
  NEW_WEIGHTS,
  ROLE,
  V,
  arcPts,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  shareRibbon,
  swapVis,
} from '../parts.mjs';

export default function close(s, c) {
  const wB = NEW_WEIGHTS[0]; // ~0.30
  const wS = NEW_WEIGHTS[1]; // ~0.70

  const title = heroTitle(['Keep the shares,', 'change the value'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.value,
  });
  const vitTitle = heroTitle(['Next up:', 'Vision Transformers'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.sing,
  });

  // Two views: 1) Value-edit stacks, 2) 4-patch ViT bird image close
  const vEdit = s.value(1);
  const vVit = s.value(0);

  // View 1 state
  const birdsV2 = s.value(V[0][1]); // 1 -> 3 (edited label shown early, bar grows AFTER answer!)
  const editedLabel = s.value(0); // 1 when Birds value shows [2, 3]
  const showEditQ = s.value(0);
  const growBar = s.value(0); // 0 until answer AFTER!

  // View 2 state (4-patch bird image)
  const cutPatches = s.value(0); // 0 = unified bird image, 1 = split into 4 patches
  const queryPatch = s.value(0); // highlights top-left patch
  const allBeams = s.value(0); // STRICTLY after all-patches!

  const editLayer = guardedDynamic(vEdit, (alpha) => {
    const el = editedLabel.value;
    const eq = showEditQ.value;
    const gb = growBar.value;
    const nodes = [];

    // Fixed shares ribbon at top
    nodes.push(
      shareRibbon({
        x: 0,
        y: -245,
        width: 960,
        height: 54,
        shares: NEW_WEIGHTS,
        colors: [ROLE.birds, ROLE.sing],
        labels: ['Birds', 'sing'],
        opacity: alpha,
      }),
      txt(
        el > 0.5
          ? 'v_Birds = [2, 3]  (was [2, 1])   ·   v_sing = [1, 2]'
          : 'v_Birds = [2, 1]   ·   v_sing = [1, 2]',
        0,
        -155,
        30,
        el > 0.5 ? ROLE.birds : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(el > 0.5 ? 6 : 0, ROLE.birds)
        .opacity(alpha),
    );

    // Two coordinate stacks (scale = 155 px/unit so 2.30 = 356 px fits cleanly!)
    const baseY = 290;
    const px = 155;
    const x1 = -280;
    const x2 = 280;

    const b0 = wB * 2; // 0.60
    const s0 = wS * 1; // 0.70
    const b1Val = 1 + 2 * gb; // stays at 1 until answer AFTER, then grows to 3!
    const b1 = wB * b1Val; // 0.30 -> 0.90
    const s1 = wS * 2; // 1.40 (unchanged size, rides up!)

    const hB0 = b0 * px;
    const hS0 = s0 * px;
    const hB1 = b1 * px;
    const hS1 = s1 * px;

    nodes.push(
      line([-520, baseY], [520, baseY], { stroke: '#556894', width: 2.5 }).opacity(alpha),
      txt('1st coordinate', x1, baseY + 42, 30, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('2nd coordinate', x2, baseY + 42, 30, COSMOS.ink, 'sans', 'center').opacity(alpha),

      // Stack 1 (unchanged: 0.60 + 0.70 = 1.30)
      lumBar(x1, baseY - hB0 / 2, 175, hB0, {
        color: ROLE.birds,
        fillOpacity: 0.45,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      lumBar(x1, baseY - hB0 - hS0 / 2, 175, hS0, {
        color: ROLE.sing,
        fillOpacity: 0.45,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt(
        `Birds: ${fmt(b0, 2)}`,
        x1 - 115,
        baseY - hB0 / 2,
        26,
        ROLE.birds,
        'mono',
        'right',
      ).opacity(alpha),
      txt(
        `sing: ${fmt(s0, 2)}`,
        x1 - 115,
        baseY - hB0 - hS0 / 2,
        26,
        ROLE.sing,
        'mono',
        'right',
      ).opacity(alpha),

      // Stack 2 (Birds blue grows underneath from 0.30 -> 0.90; sing green stays 1.40 and rides up!)
      lumBar(x2, baseY - hB1 / 2, 175, hB1, {
        color: ROLE.birds,
        fillOpacity: 0.5,
        strokeWidth: 2.6,
        glow: 10,
        opacity: alpha,
      }),
      lumBar(x2, baseY - hB1 - hS1 / 2, 175, hS1, {
        color: ROLE.sing,
        fillOpacity: 0.45,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt(
        `Birds: ${fmt(b1, 2)}`,
        x2 + 115,
        baseY - hB1 / 2,
        26,
        ROLE.birds,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        `sing: ${fmt(s1, 2)}`,
        x2 + 115,
        baseY - hB1 - hS1 / 2,
        26,
        ROLE.sing,
        'mono',
        'left',
      ).opacity(alpha),
    );

    if (gb > 0.5) {
      nodes.push(
        txt(fmt(NEW_OUTPUT[0], 2), x1, baseY - hB0 - hS0 - 38, 40, ROLE.query, 'mono', 'center')
          .glow(8, ROLE.query)
          .opacity(alpha),
        txt(fmt(b1 + s1, 2), x2, baseY - hB1 - hS1 - 38, 40, ROLE.query, 'mono', 'center')
          .glow(10, ROLE.query)
          .opacity(alpha),
        txt(
          '2nd coord rises by +0.60 (30% × +2)  →  [1.30, 2.30]',
          0,
          395,
          30,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(7, ROLE.query)
          .opacity(alpha),
      );
    } else if (eq > 0.2) {
      nodes.push(
        txt('?', x1, baseY - hB0 - hS0 - 38, 42, ROLE.query, 'mono', 'center').opacity(eq * alpha),
        txt('?', x2, baseY - hB1 - hS1 - 38, 42, ROLE.query, 'mono', 'center').opacity(eq * alpha),
        txt(
          'Which output number changes, and by how much?',
          0,
          395,
          32,
          ROLE.query,
          'serif',
          'center',
        )
          .glow(6, ROLE.query)
          .opacity(eq * alpha),
      );
    } else {
      nodes.push(
        txt(
          fmt(NEW_OUTPUT[0], 2),
          x1,
          baseY - hB0 - hS0 - 38,
          38,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          fmt(NEW_OUTPUT[1], 2),
          x2,
          baseY - hB1 - hS1 - 38,
          38,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Stylized Luminous Bird Image -> Cut into 4 ViT Patches -> Bidirectional Read Beams
  const vitLayer = guardedDynamic(vVit, (alpha) => {
    const cut = cutPatches.value;
    const qp = queryPatch.value;
    const ab = allBeams.value;
    const nodes = [];

    const cx = -110;
    const cy = 20;
    const split = cut * 42;
    const pw = 240;
    const ph = 185;

    const patchCenters = [
      [cx - pw / 2 - split, cy - ph / 2 - split], // P0 top-left (Query!)
      [cx + pw / 2 + split, cy - ph / 2 - split], // P1 top-right
      [cx - pw / 2 - split, cy + ph / 2 + split], // P2 bottom-left
      [cx + pw / 2 + split, cy + ph / 2 + split], // P3 bottom-right
    ];
    const patchNames = ['Patch 1 (query)', 'Patch 2', 'Patch 3', 'Patch 4'];

    // Draw the 4 patch tiles
    patchCenters.forEach(([px, py], i) => {
      const isQ = i === 0 && qp > 0.3;
      const isRead = ab > 0.3;
      const col = isQ ? ROLE.query : isRead ? ROLE.value : ROLE.sing;
      nodes.push(
        lumBar(px, py, pw, ph, {
          color: col,
          fillOpacity: isQ ? 0.28 : isRead ? 0.22 : 0.14,
          strokeWidth: isQ ? 3.2 : 2.2,
          glow: isQ ? 12 : isRead ? 8 : 5,
          radius: cut > 0.2 ? 12 : 2,
          opacity: alpha,
        }),
      );
      if (cut > 0.4) {
        const ly = i < 2 ? py - ph / 2 - 32 : py + ph / 2 + 36;
        nodes.push(
          txt(
            i === 0 && qp > 0.3 ? patchNames[0] : `Patch ${i + 1}`,
            px,
            ly,
            26,
            isQ ? ROLE.query : COSMOS.muted,
            'mono',
            'center',
          ).opacity(cut * alpha),
        );
      }
    });

    // Stylized glowing bird silhouette spanning the 4 patches
    const p0 = patchCenters[0];
    const p1 = patchCenters[1];
    const p2 = patchCenters[2];
    const p3 = patchCenters[3];
    // Head + eye in top-left, beak/wing in top-right, chest in bottom-left, tail in bottom-right
    nodes.push(
      circle(44, { fill: ROLE.birds, stroke: ROLE.sing, width: 2.5 })
        .at(p0[0] + 15, p0[1] + 10)
        .opacity(0.65 * alpha),
      glowDot(p0[0] + 28, p0[1] - 4, { radius: 6, color: ROLE.query, glow: 8, opacity: alpha }),
      glowingTrail(
        [
          [p1[0] - 85, p1[1] + 5],
          [p1[0] + 55, p1[1] - 48],
          [p1[0] + 75, p1[1] + 35],
        ],
        { color: ROLE.sing, width: 4.5, glow: 9, opacity: 0.85 * alpha },
      ),
      glowingTrail(
        [
          [p2[0] - 40, p2[1] - 45],
          [p2[0] + 55, p2[1] + 35],
          [p2[0] + 85, p2[1] + 10],
        ],
        { color: ROLE.birds, width: 4.5, glow: 9, opacity: 0.85 * alpha },
      ),
      glowingTrail(
        [
          [p3[0] - 70, p3[1] - 25],
          [p3[0] + 75, p3[1] + 45],
        ],
        { color: ROLE.head, width: 4.5, glow: 9, opacity: 0.85 * alpha },
      ),
    );

    // Glowing bidirectional attention beams from Patch 1 to ALL 4 patches (STRICTLY after all-patches!)
    if (ab > 0.05) {
      [p1, p2, p3].forEach((dst, idx) => {
        const pts = arcPts(p0, dst, idx === 0 ? -40 : idx === 1 ? -25 : 40, 22);
        const slice = pts.slice(0, Math.max(2, Math.round(pts.length * ab)));
        nodes.push(
          glowingTrail(slice, {
            gradientColors: [ROLE.query, ROLE.value],
            width: 4.5,
            glow: 11,
            opacity: ab * alpha,
          }),
        );
      });
      nodes.push(
        circle(62, { fill: null, stroke: ROLE.query, width: 3.5 })
          .at(p0[0], p0[1])
          .glow(10, ROLE.query)
          .opacity(ab * alpha),
      );
    }

    // Right side caption (withholds answer until all-patches!)
    const rx = 535;
    nodes.push(
      txt('Vision Transformer (ViT)', rx, -135, 34, ROLE.sing, 'serif', 'center').opacity(alpha),
      txt('4 image patches = 4 tokens', rx, -75, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );
    if (ab > 0.3) {
      nodes.push(
        txt('Full bidirectional attention', rx, 35, 32, ROLE.value, 'sans', 'center')
          .glow(7, ROLE.value)
          .opacity(ab * alpha),
        txt(
          'Reads all 4 patches (including itself)',
          rx,
          98,
          28,
          ROLE.query,
          'mono',
          'center',
        ).opacity(ab * alpha),
        txt(
          'Next lesson: Vision Transformers',
          rx,
          195,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(ab * alpha),
      );
    } else if (qp > 0.3) {
      nodes.push(
        txt('Which patches may', rx, 35, 34, ROLE.query, 'serif', 'center')
          .glow(6, ROLE.query)
          .opacity(qp * alpha),
        txt('Patch 1 read?', rx, 90, 34, ROLE.query, 'serif', 'center')
          .glow(6, ROLE.query)
          .opacity(qp * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.value, ROLE.birds), title, editLayer, vitLayer);

  // Beat 0: Edit Birds value [2,1] -> [2,3] -> withhold output jump!
  playCue(
    s,
    c,
    'edit',
    (d) => s.play(editedLabel.to(1, { duration: d }), birdsV2.to(3, { duration: d })),
    {
      dur: 0.5,
    },
  );
  playCue(s, c, 'predict-edit', (d) => s.play(showEditQ.to(1, { duration: d })), { dur: 0.45 });

  // Beat 1: Spoken reveal AFTER answer! Blue piece grows +0.60, green rides up -> [1.30, 2.30]
  playCue(s, c, 'answer', (d) => s.play(growBar.to(1, { duration: d })), {
    after: true,
    dur: 0.75,
  });

  // Beat 3: Switch to 4-patch ViT bird image -> cut -> highlight Patch 1 query (withhold beams!)
  c.swap('image', title, vitTitle);
  playCue(s, c, 'image', (d) => s.play(swapVis(vEdit, vVit, d)), { dur: 0.65 });
  playCue(s, c, 'cut', (d) => s.play(cutPatches.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'patch-query', (d) => s.play(queryPatch.to(1, { duration: d })), { dur: 0.55 });

  // Beat 4: Reveal all-4 bidirectional read beams AFTER all-patches!
  playCue(s, c, 'all-patches', (d) => s.play(allBeams.to(1, { duration: d })), {
    after: true,
    dur: 0.7,
  });
}
