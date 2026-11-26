// Scene 02: weight-payload: N*B/8 bytes, dense zeroing keeps all 16 slots, 23.9 GB (16-bit) vs 6 GB (4-bit) vs 8 GB artifact (7.6 GB worksheet).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function weightPayload(s, c) {
  const zeroDense = s.value(0);
  const showArtifact = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['What Does the Model', 'Artifact Actually Weigh?'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.weights,
  });

  const eq = glowTex(
    String.raw`\text{Bytes} = \frac{N \cdot B}{8} + \text{scales} + \text{metadata}`,
    {
      x: 340,
      y: -395,
      size: 32,
      color: ROLE.vram,
      glow: 6,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const zd = zeroDense.value;
    const art = showArtifact.value;
    const barX = -420;
    const maxW = 920;
    const maxGb = 25;

    const nodes = [
      txt(
        'GEMMA 4 12B (11.95B PARAMS): DECIMAL GB SCALE',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Uniform 16-bit', -855, -130, 28, ROLE.work, 'mono', 'left').opacity(alpha),
      lumBar(barX, -130, (23.9 / maxGb) * maxW, 34, ROLE.work, { opacity: alpha, maxTrackW: maxW }),
      txt('23.9 GB', barX + maxW + 26, -130, 30, ROLE.work, 'mono', 'left').opacity(alpha),

      txt('4-bit Codes Only', -855, -45, 28, ROLE.vram, 'mono', 'left').opacity(alpha),
      lumBar(barX, -45, (5.98 / maxGb) * maxW, 34, ROLE.vram, { opacity: alpha, maxTrackW: maxW }),
      txt('~6.0 GB', barX + maxW + 26, -45, 30, ROLE.vram, 'mono', 'left').opacity(alpha),

      txt('Ollama Artifact', -855, 40, 28, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * art),
      ),
      lumBar(barX, 40, (8.0 / maxGb) * maxW, 34, ROLE.gold, {
        opacity: alpha * (0.45 + 0.55 * art),
        maxTrackW: maxW,
      }),
      txt('8.0 GB (+draft/proj)', barX + maxW + 26, 40, 28, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * art),
      ),

      txt('Worksheet Weights', -855, 125, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * art),
      ),
      lumBar(barX, 125, (7.6 / maxGb) * maxW, 34, ROLE.ok, {
        opacity: alpha * (0.45 + 0.55 * art),
        maxTrackW: maxW,
      }),
      txt('7.6 GB', barX + maxW + 26, 125, 30, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * art),
      ),

      // Bottom 16-slot dense array proof: setting codes to 0 still keeps all 16 slots!
      txt(
        'DENSE ARRAY (16 SLOTS): ZEROING CODES STILL OCCUPIES ALL 16 SLOTS',
        -855,
        225,
        26,
        ROLE.weights,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 16; i++) {
      const cx = -805 + i * 106;
      nodes.push(
        rect(90, 56, {
          fill: zd > 0.3 ? '#1c182c' : '#112540',
          stroke: zd > 0.3 ? ROLE.gold : ROLE.weights,
          width: 2.2,
          radius: 8,
        })
          .at(cx, 295)
          .opacity(alpha),
        txt(
          zd > 0.3 ? '0' : `${(i * 3 + 1) % 9}`,
          cx,
          295,
          28,
          zd > 0.3 ? ROLE.gold : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'pl-weight-payload-0-2', (d) => s.play(zeroDense.to(1, { duration: d })));
  playCue(s, c, 'pl-weight-payload-1-1', (d) => s.play(showArtifact.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-weight-payload-0-0',
    'pl-weight-payload-0-1',
    'pl-weight-payload-1-0',
    'pl-weight-payload-1-2',
    'pl-weight-payload-1-3',
  ]);
}
