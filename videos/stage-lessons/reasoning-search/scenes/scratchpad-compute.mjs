// Scene 2: scratchpad-compute - Where does the next step get its two?
// Orbiting 3D decoder stack & KV-cache memory prism paired with a live 2D prefix rail:
// prefix [6, -, 4, =] passes through the 3D transformer layers, proposes token 2,
// appends it into the retained KV prefix, and feeds the longer prefix into the next pass.
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  glowTex,
  guardedDynamic,
  orbNode,
  orbRadius,
  orbitScene,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function scratchpadCompute(s, c) {
  const pulse = s.value(0);
  const passOn = s.value(0);
  const tokenOn = s.value(0);
  const appendOn = s.value(0);
  const readOn = s.value(0);
  const cacheOn = s.value(0);
  const capOn = s.value(0);

  const header = cinemaHeader(
    'AUTOREGRESSIVE SCRATCHPAD',
    'Where does the next step',
    'get its two?',
    { accent: ROLE.path, size: 48 },
  );

  const stageAura = aura(340, 20, 620, '#5ce1e620', '#a78bfa1c');

  // Orbiting 3D decoder stack + KV cache feedback prism on the right stage
  const stack3d = cinematic3d({
    theta: -0.74,
    phi: 1.02,
    distance: 15.0,
    unit: 106,
    focus: [0, 0, 1.1],
  }).at(390, 20);

  stack3d.add(
    gridPlane3d({
      x: [-3.0, 3.0],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // 3 stacked decoder layer slabs
  addBox3D(stack3d, -1.6, -1.1, 0.2, 3.2, 2.2, 0.42, ROLE.service, ROLE.service, {
    faceOpacity: 0.72,
    edgeGlow: 7,
  });
  addBox3D(stack3d, -1.6, -1.1, 1.05, 3.2, 2.2, 0.42, ROLE.model, ROLE.model, {
    faceOpacity: 0.78,
    edgeGlow: 8,
  });
  addBox3D(stack3d, -1.6, -1.1, 1.9, 3.2, 2.2, 0.42, ROLE.path, ROLE.path, {
    faceOpacity: 0.82,
    edgeGlow: 9,
  });

  // Glowing 3D forward pass and scratchpad append feedback loop
  addArc3D(stack3d, [-1.4, 0, 0.42], [0, 0, 2.32], ROLE.path, {
    lift: 0.55,
    pulseVal: pulse,
    phaseOffset: 0.0,
  });
  addArc3D(stack3d, [1.4, 0, 2.32], [-1.4, 1.35, 0.42], ROLE.focus, {
    lift: 0.85,
    pulseVal: pulse,
    phaseOffset: 0.45,
  });

  const capEq = glowTex(String.raw`\text{poly}(n)\text{ CoT tokens} \;\Rightarrow\; \text{P}`, {
    x: -440,
    y: 350,
    size: 36,
    color: ROLE.focus,
    glow: 8,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ps = passOn.value;
      const tk = tokenOn.value;
      const ap = appendOn.value;
      const rd = readOn.value;
      const kv = cacheOn.value;
      const cp = capOn.value;
      const nodes = [];

      // Left stage: live token prefix rail [6] [-] [4] [=] + animated [2]
      const baseTokens = ['6', '-', '4', '='];
      const startX = -810;
      const stepX = 128;
      const rowY = -140;

      nodes.push(
        txt('RETAINED PREFIX (KV CACHE)', startX, -225, 26, ROLE.service, 'mono', 'left'),
        txt('3D DECODER LAYER STACK', 390, -425, 26, ROLE.path, 'mono', 'center'),
      );

      baseTokens.forEach((tok, i) => {
        const x = startX + 46 + i * stepX;
        nodes.push(
          orbNode(x, rowY, tok, kv > 0.35 ? ROLE.service : ROLE.path, {
            radius: 44,
            glow: 7,
            size: 32,
          }),
        );
        if (i < baseTokens.length - 1) {
          const [a, b] = trimSeg([x, rowY], [x + stepX, rowY], 48, 48);
          nodes.push(line(a, b, { stroke: '#344770', width: 2.6 }));
        }
      });

      // Proposed token "2" starts below in output slot, then arcs into slot 4 on appendOn
      if (tk > 0.05) {
        const destX = startX + 46 + 4 * stepX;
        const destY = rowY;
        const srcX = -320;
        const srcY = 65;
        const tx = srcX + (destX - srcX) * ap;
        const ty = srcY + (destY - srcY) * ap - Math.sin(ap * Math.PI) * 55;
        nodes.push(
          orbNode(tx, ty, '2', ROLE.focus, {
            radius: 46,
            glow: 12,
            size: 34,
            opacity: tk,
          }),
        );
        if (ap < 0.35) {
          nodes.push(
            txt('PROPOSED SUBTOTAL', srcX, srcY + 78, 26, ROLE.focus, 'mono', 'center').opacity(
              tk * (1 - ap * 2.5),
            ),
          );
        }
      }

      // Forward pass beam from prefix down to layer readout
      const prefixRight = ap > 0.6 ? startX + 46 + 4 * stepX : startX + 46 + 3 * stepX;
      const layerNodePos = [-620, 65];
      if (ps > 0.05) {
        const rLay = orbRadius('LAYERS', 50);
        nodes.push(
          beamWithPhotons(
            quadArcPts([prefixRight, rowY + 52], [layerNodePos[0] + rLay, layerNodePos[1]], 65),
            rd > 0.35 ? ROLE.focus : ROLE.path,
            p * 1.1,
            { alpha: ps, width: 3.4 },
          ),
          orbNode(layerNodePos[0], layerNodePos[1], 'LAYERS', ROLE.model, {
            radius: 50,
            glow: 10,
            opacity: ps,
          }),
        );
      }

      if (rd > 0.05) {
        const nextPos = [-280, 65];
        const [a, b] = trimSeg(
          layerNodePos,
          nextPos,
          orbRadius('LAYERS', 50) + 10,
          orbRadius('NEXT?', 48) + 10,
        );
        nodes.push(
          beamWithPhotons([a, b], ROLE.ok, p * 1.2 + 0.3, { alpha: rd, width: 3.6 }),
          orbNode(nextPos[0], nextPos[1], 'NEXT?', ROLE.ok, {
            radius: 48,
            glow: 10,
            opacity: rd,
          }),
        );
      }

      // Status caption on left (never contradicts updated state!)
      const statusText =
        cp > 0.35
          ? 'Merrill & Sabharwal: poly steps -> poly-time expressivity'
          : kv > 0.35
            ? 'KV cache reuses projections; each new token runs all layers'
            : rd > 0.35
              ? 'Next forward pass reads subtotal 2 from the prefix'
              : 'Each decoder pass appends one candidate token';
      const statusCol =
        cp > 0.35 ? ROLE.focus : kv > 0.35 ? ROLE.service : rd > 0.35 ? ROLE.ok : COSMOS.muted;

      nodes.push(
        txt(statusText, -840, 220, 26, statusCol, 'mono', 'left'),
        txt(
          kv > 0.35
            ? 'Hidden reasoning tokens still bill layers + context attention'
            : 'Model-generated subtotal (not an arithmetic oracle)',
          -840,
          266,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          '3 LAYER SLABS  ·  GOLD ARC = APPEND TO PREFIX',
          390,
          425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, stack3d, header, overlay);
  orbitScene(s, c, stack3d, { theta: -0.18, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('scratch-pass', () => {
    s.play(passOn.to(1, { duration: clampDur(c, c.cue('scratch-pass').start, 0.35) }));
  });
  c.on('scratch-token', () => {
    s.play(tokenOn.to(1, { duration: clampDur(c, c.cue('scratch-token').start, 0.35) }));
  });
  c.on('scratch-append', () => {
    s.play(appendOn.to(1, { duration: clampDur(c, c.cue('scratch-append').start, 0.55) }));
  });
  c.on('scratch-read', () => {
    s.play(readOn.to(1, { duration: clampDur(c, c.cue('scratch-read').start, 0.35) }));
  });
  c.on('scratch-cache', () => {
    s.play(cacheOn.to(1, { duration: clampDur(c, c.cue('scratch-cache').start, 0.35) }));
  });
  c.show('scratch-capacity', capEq);
  c.on('scratch-capacity', () => {
    s.play(capOn.to(1, { duration: clampDur(c, c.cue('scratch-capacity').start, 0.35) }));
  });
}
