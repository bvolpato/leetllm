// Scene 09: rotary-grid: 2D RoPE dual-circle phase rotors (row pair + column pair) & shift invariance.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  circle,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  txt,
  visionRotary,
} from '../parts.mjs';

export default function rotaryGrid(s, c) {
  const qRow = s.value(0);
  const qCol = s.value(0);
  const kRow = s.value(0);
  const kCol = s.value(0);
  const showFooter = s.value(0);
  const showNote = s.value(0);

  const bgAura = aura(-60, 20, 740, '#14345a2a', '#26184422');
  const title = heroTitle(['2D Rotary Positions:', 'Row & Column Phase Pairs'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.pos,
  });

  const eq = glowTex(
    String.raw`q \cdot k = \cos(\Delta r \cdot 90^\circ) + \cos(\Delta c \cdot 90^\circ)`,
    { x: 260, y: -395, size: 34, color: ROLE.patch, glow: 6 },
  );

  function rotorDisk(cx, cy, r, label, qAngleDeg, kAngleDeg, alpha) {
    const qa = (qAngleDeg * Math.PI) / 180;
    const ka = (kAngleDeg * Math.PI) / 180;
    const qx = cx + Math.cos(qa) * (r - 12);
    const qy = cy - Math.sin(qa) * (r - 12);
    const kx = cx + Math.cos(ka) * (r - 12);
    const ky = cy - Math.sin(ka) * (r - 12);
    return group(
      circle(r, { fill: '#0e172c', stroke: '#2c426e', width: 2.4 }).at(cx, cy).opacity(alpha),
      line([cx - r, cy], [cx + r, cy], { stroke: '#213358', width: 1.5 }).opacity(alpha),
      line([cx, cy - r], [cx, cy + r], { stroke: '#213358', width: 1.5 }).opacity(alpha),
      arrow([cx, cy], [qx, qy], { stroke: ROLE.patch, width: 4.5, head: 14 })
        .glow(8, ROLE.patch)
        .opacity(alpha),
      arrow([cx, cy], [kx, ky], { stroke: ROLE.pos, width: 4.5, head: 14 })
        .glow(8, ROLE.pos)
        .opacity(alpha),
      txt(label, cx, cy - r - 30, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt(
        `Q: ${Math.round(qAngleDeg)} deg`,
        cx - 95,
        cy + r + 34,
        26,
        ROLE.patch,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        `K: ${Math.round(kAngleDeg)} deg`,
        cx + 95,
        cy + r + 34,
        26,
        ROLE.pos,
        'mono',
        'center',
      ).opacity(alpha),
    );
  }

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const qr = qRow.value;
    const qc = qCol.value;
    const kr = kRow.value;
    const kc = kCol.value;
    const exact = visionRotary([Math.round(qr), Math.round(qc)], [Math.round(kr), Math.round(kc)]);
    const dr = Math.round(kr - qr);
    const dc = Math.round(kc - qc);

    const nodes = [
      rotorDisk(-500, 15, 145, 'ROW PAIR (x0, x1)', qr * 90, kr * 90, alpha),
      rotorDisk(0, 15, 145, 'COL PAIR (x2, x3)', qc * 90, kc * 90, alpha),

      // Right live coordinate + relative-offset score column
      txt('TOY 4-DIM HEAD (90 deg/step)', 290, -145, 26, ROLE.patch, 'mono', 'left').opacity(alpha),
      txt(
        `Q pos = (${Math.round(qr)}, ${Math.round(qc)})`,
        290,
        -75,
        32,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        `K pos = (${Math.round(kr)}, ${Math.round(kc)})`,
        290,
        -15,
        32,
        ROLE.pos,
        'mono',
        'left',
      ).opacity(alpha),
      txt(`Offset (Δr, Δc) = (${dr}, ${dc})`, 290, 55, 30, COSMOS.ink, 'mono', 'left').opacity(
        alpha,
      ),
      txt(`Score = ${exact.score.toFixed(1)}`, 290, 135, 44, ROLE.ok, 'mono', 'left')
        .glow(10, ROLE.ok)
        .opacity(alpha * (0.35 + 0.65 * showFooter.value)),

      // Bottom takeaway
      txt(
        'Relative offset preserved under translation; Qwen2.5-VL uses spatial 2D RoPE + 28px multiples + 2x2 merge',
        0,
        335,
        26,
        showNote.value > 0.3 ? ROLE.bridge : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha * (0.35 + 0.65 * showNote.value)),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'rotary-grid-beat-0', (d) => s.play(showFooter.to(0.5, { duration: d })));
  playCue(s, c, 'rotary-grid-beat-1', (d) => s.play(showFooter.to(1, { duration: d })));
  playCue(s, c, 'rotary-key-row', (d) => s.play(kRow.to(1, { duration: d })));
  playCue(s, c, 'rotary-translate', (d) =>
    s.play(
      qRow.to(2, { duration: d }),
      qCol.to(3, { duration: d }),
      kRow.to(3, { duration: d }),
      kCol.to(3, { duration: d }),
    ),
  );
  playCue(s, c, 'rotary-grid-beat-2', (d) => s.play(showNote.to(1, { duration: d })));
}
