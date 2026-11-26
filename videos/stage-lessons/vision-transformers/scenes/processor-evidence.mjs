// Scene 02: processor-evidence: 672->224 3x3 box-average vs 224 native crop + 3-branch triage.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  nativeStrip,
  pixelStripNodes,
  playCue,
  resizedStrip,
  txt,
} from '../parts.mjs';

export default function processorEvidence(s, c) {
  const showResize = s.value(0);
  const showCrop = s.value(0);
  const triageMode = s.value(0); // 0=quiet, 1=check, 2=resize, 3=model, 4=unreadable

  const bgAura = aura(0, 0, 740, '#13325828', '#1f163c20');
  const title = heroTitle(['What Pixels Actually', 'Reach the Encoder?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.patch,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const r = showResize.value;
    const cr = showCrop.value;
    const tm = Math.round(triageMode.value);

    const nodes = [
      // Left: 672 -> 224 full resize (3x3 box average -> 3 rows)
      txt('FULL RESIZE (672 -> 224, 3x3 AVG)', -855, -215, 26, ROLE.warn, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * r),
      ),
      pixelStripNodes(resizedStrip, -855, -170, 48, 32, {
        tint: ROLE.warn,
        opacity: alpha * (0.3 + 0.7 * r),
      }),
      txt(
        '3 rows tall: strokes blur together',
        -855,
        -45,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha * (0.35 + 0.65 * r)),

      // Right: 224 native crop (keeps all 9 rows)
      txt('NATIVE CROP (224px AROUND RETRY)', 75, -215, 26, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.35 + 0.65 * cr),
      ),
      pixelStripNodes(nativeStrip, 75, -170, 16, 10.6, {
        tint: ROLE.ok,
        opacity: alpha * (0.2 + 0.8 * cr),
      }),
      txt('All 9 source rows preserved', 75, -45, 28, COSMOS.muted, 'sans', 'left').opacity(
        alpha * (0.35 + 0.65 * cr),
      ),

      // Bottom: Diagnostic 3-branch triage (quiet outline from t=0, highlights per cue)
      txt(
        'COMPARE FULL IMAGE vs NATIVE CROP AGAINST LABELED ID',
        -855,
        85,
        26,
        tm >= 1 ? ROLE.patch : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.4 + 0.6 * (tm >= 1 ? 1 : 0))),
    ];

    const branches = [
      {
        id: 2,
        x: -585,
        label: 'Only crop clear',
        action: 'Inspect resize / crop',
        color: ROLE.pos,
      },
      {
        id: 3,
        x: 0,
        label: 'Processed pixels clear',
        action: 'Trace encoder + bridge',
        color: ROLE.patch,
      },
      {
        id: 4,
        x: 585,
        label: 'Neither view legible',
        action: 'Leave lookup open',
        color: ROLE.warn,
      },
    ];

    branches.forEach((b) => {
      const active = tm === b.id;
      const seen = tm >= b.id;
      const op = active ? 1 : seen ? 0.68 : 0.34;
      nodes.push(
        chipPill(b.label, b.x, 185, {
          w: 520,
          h: 72,
          color: active ? b.color : COSMOS.rule,
          fill: active ? '#152340' : '#0d1426',
          size: 28,
          glow: active ? 12 : 0,
          opacity: alpha * op,
        }),
        txt(b.action, b.x, 265, 28, active ? b.color : COSMOS.muted, 'mono', 'center').opacity(
          alpha * op,
        ),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'processor-resize', (d) => s.play(showResize.to(1, { duration: d })));
  playCue(s, c, 'processor-crop', (d) => s.play(showCrop.to(1, { duration: d })));
  playCue(s, c, 'processor-check', (d) => s.play(triageMode.to(1, { duration: d })));
  playCue(s, c, 'processor-check-resize', (d) => s.play(triageMode.to(2, { duration: d })));
  playCue(s, c, 'processor-check-model', (d) => s.play(triageMode.to(3, { duration: d })));
  playCue(s, c, 'processor-unreadable', (d) => s.play(triageMode.to(4, { duration: d })));
}
