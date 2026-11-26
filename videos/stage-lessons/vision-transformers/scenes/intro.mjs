// Scene 01: intro: 3-row resized strip vs 9-row native crop for req_7f3a vs req_7838.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  labeledId,
  nativeStrip,
  pixelStripNodes,
  playCue,
  proposedId,
  rect,
  resizedStrip,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const showLocate = s.value(0);
  const showNative = s.value(0);
  const showMatch = s.value(0);

  const bgAura = aura(-80, 0, 740, '#14335a2a', '#24184020');
  const title = heroTitle(['Which ID Opens', 'the Incident Trace?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.patch,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const loc = showLocate.value;
    const nat = showNative.value;
    const mat = showMatch.value;

    const nodes = [
      // Top row: Resized 3-row strip (672 -> 224, 3x3 area average)
      txt(
        'RESIZED SCREENSHOT (224px WIDE): 3 PIXEL ROWS FOR ID BESIDE RETRY',
        -855,
        -225,
        26,
        loc > 0.2 ? ROLE.pos : ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),
      pixelStripNodes(resizedStrip, -855, -185, 68, 38, { tint: ROLE.warn, opacity: alpha }),
      rect(68 * 16 + 14, 38 * 3 + 14, {
        fill: '#00000000',
        stroke: ROLE.pos,
        width: 3,
        radius: 10,
      })
        .at(-855 + 68 * 8, -185 + 38 * 1.5)
        .opacity(alpha * (0.2 + 0.8 * loc)),
      txt('3 rows x 16 cells', 310, -128, 28, ROLE.warn, 'mono', 'left').opacity(alpha),

      // Middle row: Native 9-row crop (quiet grid from t=0, illuminates on intro-magnify)
      txt(
        'NATIVE CROP (ORIGINAL RESOLUTION): 9 PIXEL ROWS',
        -855,
        -15,
        26,
        nat > 0.2 ? ROLE.patch : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.35 + 0.65 * nat)),
      pixelStripNodes(nativeStrip, -855, 25, 22.6, 12.6, {
        tint: ROLE.patch,
        opacity: alpha * (0.14 + 0.86 * nat),
      }),
      txt('9 rows x 48 pixels', 310, 82, 28, ROLE.patch, 'mono', 'left').opacity(
        alpha * (0.35 + 0.65 * nat),
      ),

      // Bottom row: Two proposed readings (neutral until intro-match!)
      txt('PROPOSED READINGS', -855, 220, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      chipPill(labeledId, -560, 305, {
        w: 360,
        h: 82,
        color: mat > 0.4 ? ROLE.ok : ROLE.patch,
        fill: mat > 0.4 ? '#0f2d24' : '#10182d',
        size: 38,
        glow: mat > 0.4 ? 14 : 6,
        opacity: alpha,
      }),
      chipPill(proposedId, -100, 305, {
        w: 360,
        h: 82,
        color: mat > 0.4 ? ROLE.warn : ROLE.patch,
        fill: mat > 0.4 ? '#2b1420' : '#10182d',
        size: 38,
        glow: mat > 0.4 ? 8 : 6,
        opacity: alpha * (1 - 0.35 * mat),
      }),
    ];

    if (mat > 0.15) {
      nodes.push(
        txt('MATCH: open f + ending a', 150, 305, 32, ROLE.ok, 'mono', 'left')
          .glow(8, ROLE.ok)
          .opacity(alpha * mat),
      );
    } else {
      nodes.push(
        txt('Which reading fits both strokes?', 150, 305, 30, ROLE.pos, 'sans', 'left').opacity(
          alpha * (0.35 + 0.65 * nat),
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'intro-locate', (d) => s.play(showLocate.to(1, { duration: d })));
  playCue(s, c, 'intro-magnify', (d) => s.play(showNative.to(1, { duration: d })));
  // Strict prediction withholding: reveal verdict only after intro-match phrase completes.
  playCue(s, c, 'intro-match', (d) => s.play(showMatch.to(1, { duration: d })), { after: true });
}
