// Scene 1: intro: "Which row scores the next word?"
// Full-bleed glowing prompt stream "function returns the _" with live blinking cursor,
// vertical 4-feature bar spectra underneath each word, orbiting 3D residual stream slab,
// and causal look-back sweep strictly withheld until select-query / carry-row.
import { gridPlane3d, line } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  wireframeSlab3d,
} from '../../cinematic-kit.mjs';
import { INPUT, ROLE, WORDS, arcPts, cinemaAtmosphere, fmt, lumBar, playCue } from '../parts.mjs';

export default function intro(s, c) {
  const title = heroTitle(['Which row scores', 'the next word?'], {
    x: -850,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.attn,
  });

  // Compact orbiting 3D residual-stream highway on upper right
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.06,
    distance: 15.6,
    unit: 62,
    focus: [0, 0, 0.25],
  }).at(640, -340);

  const floor3d = gridPlane3d({
    x: [-2.8, 2.8],
    y: [-2.0, 2.0],
    z: -1.0,
    step: 1,
    color: '#2c3d69',
    opacity: 0.45,
  });
  const slab0 = wireframeSlab3d([-1.5, 0, 0.2], 0.55, 1.15, 0.32, {
    color: ROLE.stream,
    width: 2.2,
    glow: 6,
  });
  const slab1 = wireframeSlab3d([0, 0, 0.2], 0.55, 1.15, 0.32, {
    color: ROLE.attn,
    width: 2.2,
    glow: 6,
  });
  const slab2 = wireframeSlab3d([1.5, 0, 0.2], 0.55, 1.15, 0.32, {
    color: ROLE.query,
    width: 2.8,
    glow: 10,
  });
  view3d.add(floor3d, ...slab0, ...slab1, ...slab2);

  // Reactive animation channels
  const prefixIn = s.value(0.25);
  const rowsIn = s.value(0);
  const selectThe = s.value(0); // WITHHELD until Beat 1 select-query!
  const spanSweep = s.value(0); // Causal read arc from pos 2 back to pos 0
  const lookupShow = s.value(0); // Beat 2 lookup ID 2
  const cursorPulse = s.value(0);

  const stageVis = s.value(1);
  const wordXs = [-650, -170, 270];
  const wordY = -98;
  const cursorX = 485;

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const pIn = prefixIn.value;
    const rIn = rowsIn.value;
    const sel = selectThe.value;
    const sp = spanSweep.value;
    const lk = lookupShow.value;
    const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(cursorPulse.value * Math.PI * 10));
    const nodes = [];

    // Floating prompt tokens across center-top
    WORDS.forEach((word, i) => {
      const isLast = i === 2;
      const col = isLast && sel > 0.3 ? ROLE.query : COSMOS.ink;
      const tNode = txt(
        word,
        wordXs[i],
        wordY,
        isLast && sel > 0.3 ? 68 : 62,
        col,
        'serif',
        'center',
      ).opacity(pIn * alpha);
      if (isLast && sel > 0.3) tNode.glow(9, ROLE.query);
      nodes.push(tNode);
    });

    // Blinking prediction cursor after "the"
    nodes.push(
      lumBar(cursorX, wordY, 14, 72, {
        color: ROLE.attn,
        fillOpacity: 0.75,
        strokeWidth: 2,
        glow: 12,
        radius: 4,
        opacity: pulse * pIn * alpha,
      }),
      txt('next?', cursorX + 100, wordY, 32, COSMOS.muted, 'mono', 'center').opacity(
        (0.55 + 0.45 * sel) * pIn * alpha,
      ),
    );

    // 4-feature vertical bar spectra underneath each word
    const barSpacing = 84;
    const baseY = 195;
    const maxBarH = 128;

    WORDS.forEach((_, i) => {
      const cx = wordXs[i];
      const isLast = i === 2;
      const col = isLast && sel > 0.3 ? ROLE.query : ROLE.stream;
      const rowOp = (0.18 + 0.82 * rIn) * alpha;

      nodes.push(
        txt(`pos ${i}`, cx, -12, 28, col, 'mono', 'center').opacity(rowOp),
        line([cx - 165, baseY], [cx + 165, baseY], { stroke: '#415380', width: 2.2 }).opacity(
          rowOp,
        ),
      );

      INPUT[i].forEach((val, j) => {
        const bx = cx + (j - 1.5) * barSpacing;
        const h = Math.max(8, val * maxBarH * Math.max(0.08, rIn));
        nodes.push(
          lumBar(bx, baseY - h / 2, 34, h, {
            color: col,
            fillOpacity: isLast && sel > 0.3 ? 0.46 : 0.3,
            strokeWidth: 2.2,
            glow: isLast && sel > 0.3 ? 10 : 5,
            radius: 5,
            opacity: rowOp,
          }),
          txt(
            fmt(val, 2),
            bx,
            baseY + 38,
            26,
            isLast && sel > 0.3 ? ROLE.query : COSMOS.muted,
            'mono',
            'center',
          ).opacity(rowOp),
        );
      });
    });

    // Prediction prompt during Beat 0 (hidden once select-query fires)
    if (sel < 0.2) {
      nodes.push(
        txt('Which row scores the token at the cursor?', 0, 345, 34, ROLE.query, 'serif', 'center')
          .glow(7, ROLE.query)
          .opacity((1 - sel * 5) * rIn * alpha),
      );
    }

    // Causal read arc sweeping back from "the" across all 3 positions (ONLY AFTER select-query + carry-row!)
    if (sp > 0.03) {
      const rightX = wordXs[2] + 150;
      const targetLeft = wordXs[0] - 150;
      const curLeft = wordXs[2] - 150 + (targetLeft - (wordXs[2] - 150)) * sp;
      const bracketY = 285;
      nodes.push(
        glowingTrail(
          [
            [curLeft, bracketY - 14],
            [curLeft, bracketY],
            [rightX, bracketY],
            [rightX, bracketY - 14],
          ],
          {
            gradientColors: [ROLE.stream, ROLE.attn, ROLE.query],
            width: 4.2,
            glow: 10,
            opacity: alpha,
          },
        ),
        glowDot(curLeft, bracketY, { radius: 7, color: ROLE.attn, glow: 12, opacity: alpha }),
      );
      if (sp > 0.65) {
        nodes.push(
          txt(
            '"the" at position 2 can read all three positions (0, 1, 2)',
            -120,
            345,
            30,
            ROLE.attn,
            'mono',
            'center',
          )
            .glow(6, ROLE.attn)
            .opacity(((sp - 0.65) / 0.35) * alpha),
        );
      }
      // Subtle glowing read arcs above the words
      [0, 1].forEach((k) => {
        const pts = arcPts(
          [wordXs[2], wordY - 52],
          [wordXs[k], wordY - 52],
          k === 0 ? -115 : -72,
          26,
        );
        const count = Math.max(2, Math.round(pts.length * sp));
        nodes.push(
          glowingTrail(pts.slice(0, count), {
            gradientColors: [ROLE.query, ROLE.attn],
            width: 3.4,
            glow: 8,
            opacity: 0.78 * alpha,
          }),
        );
      });
    }

    // Beat 2 footer: vocabulary ID 2 lookup (single crisp string, no transient flash)
    if (lk > 0.05) {
      nodes.push(
        txt(
          '"the"  ->  vocabulary ID 2   (1 block · 1 head)',
          0,
          415,
          32,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(7, ROLE.query)
          .opacity(lk * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.attn, ROLE.query), title, view3d, mainLayer);

  // Continuous bounded 3D orbit + blinking cursor across the whole scene
  const fullSpan = Math.max(1, c.end - c.start - 0.65);
  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.22, phi: 0.96, distance: 14.2 },
    { startOffset: 0.15, endMargin: 0.55 },
  );
  c.at(0.1, () => {
    s.play(cursorPulse.to(1, { duration: fullSpan }));
  });

  // Beat 0: show prompt and feature bars (withhold which row wins!)
  playCue(s, c, 'enter-prefix', (d) => s.play(prefixIn.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'enter-rows', (d) => s.play(rowsIn.to(1, { duration: d })), { dur: 0.75 });

  // Beat 1: reveal "the" at position 2 and sweep causal read bracket across all 3 positions
  playCue(s, c, 'select-query', (d) => s.play(selectThe.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'carry-row', (d) => s.play(spanSweep.to(1, { duration: d })), { dur: 0.85 });

  // Beat 2: vocabulary ID 2 lookup
  playCue(s, c, 'lookup-start', (d) => s.play(lookupShow.to(1, { duration: d })), { dur: 0.6 });
}
