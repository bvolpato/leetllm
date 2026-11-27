// Scene 2: receipt-anatomy - Price the usage categories in the receipt
// Orbiting 3D token-bucket prism projecting three luminous usage channels + dated rate identity.
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  USAGE_RECEIPT,
  addBox3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  fadeInNodes,
  fmtInt,
  glowBar,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function receiptAnatomy(s, c) {
  const pulseT = s.value(0);
  const usageReveal = s.value(0);
  const splitReveal = s.value(0);
  const idReveal = s.value(0);

  const header = cinemaHeader('PROVIDER RECEIPT', 'Separate every', 'billable bucket', {
    x: -860,
    y: -415,
    accent: ROLE.input,
    size: 52,
  });

  const sceneAura = aura(320, -10, 580, '#5ce1e626', '#a78bfa1c');

  // 3D Token Bucket Prism on the right
  const view3d = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 15.2,
    unit: 116,
    focus: [0, 0, 1.0],
  }).at(350, -10);

  view3d.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Ordinary input tower (1,800 -> height 2.8)
  addBox3D(view3d, -2.5, -0.7, 0.04, 1.3, 1.4, 2.7, ROLE.input, ROLE.input, {
    faceOpacity: 0.84,
    edgeGlow: 8,
  });

  // Cache reads slot (0 tokens -> glowing gold wireframe base)
  const readWire = addWireBox3D(view3d, -0.65, -0.7, 0.04, 1.3, 1.4, 0.45, ROLE.cached, {
    width: 2.2,
    opacity: 0.78,
    glow: 7,
  });

  // Output tower (180 tokens -> height 0.75, with inner reasoning ring shown on split)
  const outTower = addBox3D(view3d, 1.2, -0.7, 0.04, 1.3, 1.4, 0.85, ROLE.output, ROLE.output, {
    faceOpacity: 0.86,
    edgeGlow: 9,
  });

  // Identity halo ring above the 3D prisms (fades in on `dated-identity`)
  const identityFrame = hideNodes(
    addWireBox3D(view3d, -2.75, -1.0, 2.95, 5.5, 2.0, 0.35, ROLE.ok, {
      width: 2.0,
      opacity: 0.85,
      glow: 9,
    }),
  );

  const hud = guardedDynamic(
    () => 1,
    () => {
      const u = usageReveal.value;
      const sp = splitReveal.value;
      const id = idReveal.value;
      const nodes = [];

      // Left column: 3 glowing usage channels (no boxes, pure floating cinema bars)
      const bars = [
        {
          label: 'ORDINARY INPUT',
          tokens: USAGE_RECEIPT.ordinaryInput,
          color: ROLE.input,
          y: -155,
        },
        { label: 'CACHE READS', tokens: USAGE_RECEIPT.cachedInput, color: ROLE.cached, y: -15 },
        {
          label: 'GENERATED OUTPUT',
          tokens: USAGE_RECEIPT.output,
          color: ROLE.output,
          y: 125,
        },
      ];

      const maxTok = 1800;
      bars.forEach((b, idx) => {
        const fillFrac =
          idx === 0
            ? (b.tokens / maxTok) * (0.35 + 0.65 * u)
            : (b.tokens / maxTok) * Math.max(u, sp);
        nodes.push(
          txt(b.label, -860, b.y, 26, b.color, 'mono', 'left'),
          txt(`${fmtInt(b.tokens)} tokens`, -190, b.y, 28, COSMOS.ink, 'mono', 'right'),
          glowBar(-860, b.y + 42, 670, 22, fillFrac, { fill: b.color, glow: 8 }),
        );
      });

      if (sp > 0.05) {
        nodes.push(
          txt(
            'Reasoning tokens sit inside reported output',
            -860,
            232,
            26,
            ROLE.reasoning,
            'sans',
            'left',
          )
            .glow(5, ROLE.reasoning)
            .opacity(sp),
        );
      }

      // Bottom identity strip (floating monospace fields across the lower canvas)
      if (id > 0.05) {
        nodes.push(
          txt('RECEIPT & RATE IDENTITY', -860, 326, 26, ROLE.ok, 'mono', 'left')
            .glow(5, ROLE.ok)
            .opacity(id),
          txt(
            `${USAGE_RECEIPT.request}  ·  ${USAGE_RECEIPT.model} ${USAGE_RECEIPT.tier}  ·  ${USAGE_RECEIPT.region}`,
            -860,
            378,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(id),
          txt(
            `Outcome: ${USAGE_RECEIPT.outcome}  ·  Effective: ${USAGE_RECEIPT.priceEffectiveDate}  ·  USD`,
            -860,
            426,
            26,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(id),
        );
      } else {
        nodes.push(
          txt(
            `Request: ${USAGE_RECEIPT.request}  ·  Supplied usage counts`,
            -860,
            378,
            28,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );
      }

      // Clean 3D legend below the prisms
      nodes.push(
        txt('1,800 in', 85, 345, 26, ROLE.input, 'mono'),
        txt('0 read', 340, 345, 26, ROLE.cached, 'mono'),
        txt('180 out', 595, 345, 26, ROLE.output, 'mono'),
        txt(
          id > 0.5
            ? 'Price the receipt, not character estimates'
            : 'One rate per billable category',
          345,
          420,
          26,
          id > 0.5 ? ROLE.ok : COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(sceneAura, view3d, header, hud);
  orbitScene(s, c, view3d, { theta: -0.36, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });

  // Reference readWire/outTower cleanly so all 3D layers animate on cue
  c.on('provider-receipt', () => {
    const t = c.cue('provider-receipt').start;
    s.play(usageReveal.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('separate-categories', () => {
    const t = c.cue('separate-categories').start;
    s.play(splitReveal.to(1, { duration: clampDur(c, t, 0.4) }));
    fadeInNodes(s, c, t, [...readWire, ...outTower], 0.35);
  });
  c.on('dated-identity', () => {
    const t = c.cue('dated-identity').start;
    s.play(idReveal.to(1, { duration: clampDur(c, t, 0.45) }));
    fadeInNodes(s, c, t, identityFrame, 0.4);
  });
}
