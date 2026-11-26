// Scene 9: fusion - Fuse ranks without pretending their raw scores share a scale
// Signature orbiting 3D Multi-Branch Hybrid Search & RRF Fusion Manifold!
// Three elevated branch slabs (Lexical blue, Dense cyan, Authorized Rewrite violet) fire photon arcs
// into Policy and Exception RRF towers: exact tie (0.03252) breaks to Exception (0.04892 vs 0.04865).
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RRF_THREE_SCORES,
  RRF_TIE_SCORE,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  glowMeter,
  guardedDynamic,
  orbitScene,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function fusion(s, c) {
  const pulse = s.value(0);
  const scaleOn = s.value(0);
  const twoBranchProg = s.value(0);
  const tieHighlight = s.value(0);
  const rewriteOn = s.value(0);

  const header = cinemaHeader('HYBRID RANK FUSION', 'Fuse ranks across', 'independent branches', {
    accent: ROLE.query,
    size: 46,
  });

  const stageAura = aura(320, 20, 620, '#5ce1e622', '#a78bfa20');

  // Orbiting 3D Multi-Branch Fusion Manifold on right side
  const manifold = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 15.6,
    unit: 112,
    focus: [0, 0, 1.0],
  }).at(340, 15);

  manifold.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.8, 2.8],
      z: 0,
      step: 1.15,
      color: '#233459',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  // 3 elevated retrieval branch slabs at z = 2.2
  addBox3D(manifold, -2.7, -1.6, 2.1, 1.3, 1.1, 0.36, ROLE.lexical, ROLE.lexical, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });
  addBox3D(manifold, -0.65, -1.6, 2.1, 1.3, 1.1, 0.36, ROLE.dense, ROLE.dense, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });
  addBox3D(manifold, 1.4, -1.6, 2.1, 1.3, 1.1, 0.36, ROLE.rewrite, ROLE.rewrite, {
    faceOpacity: 0.82,
    edgeGlow: 9,
  });

  // 2 fused accumulator towers at z = 0.05..1.55 (Policy left, Exception right taller!)
  addBox3D(manifold, -1.7, 0.7, 0.05, 1.25, 1.25, 1.18, ROLE.policy, ROLE.policy, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });
  addBox3D(manifold, 0.45, 0.7, 0.05, 1.25, 1.25, 1.52, ROLE.exception, ROLE.exception, {
    faceOpacity: 0.86,
    edgeGlow: 10,
  });
  manifold.add(
    ...wireframeSlab3d([1.075, 1.325, 1.82], 0.68, 0.68, 0.16, {
      color: ROLE.focus,
      width: 2.5,
      glow: 9,
    }),
  );

  // Photon arcs from the 3 retrieval branches down into Policy & Exception towers
  addArc3D(manifold, [-2.05, -1.05, 2.1], [-1.08, 1.32, 1.24], ROLE.lexical, {
    lift: 0.55,
    pulseVal: pulse,
    phaseOffset: 0.0,
  });
  addArc3D(manifold, [0.0, -1.05, 2.1], [1.08, 1.32, 1.58], ROLE.dense, {
    lift: 0.65,
    pulseVal: pulse,
    phaseOffset: 0.33,
  });
  addArc3D(manifold, [2.05, -1.05, 2.1], [1.08, 1.32, 1.58], ROLE.rewrite, {
    lift: 0.7,
    pulseVal: pulse,
    phaseOffset: 0.66,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const tb = twoBranchProg.value;
      const rw = rewriteOn.value > 0.5;
      const sc = scaleOn.value > 0.5;
      const th = tieHighlight.value > 0.5;

      const polScore = rw ? RRF_THREE_SCORES.Policy : RRF_TIE_SCORE * Math.max(0.2, tb);
      const excScore = rw ? RRF_THREE_SCORES.Exception : RRF_TIE_SCORE * Math.max(0.2, tb);

      const nodes = [
        txt('3D MULTI-BRANCH RRF MANIFOLD', 340, -430, 26, ROLE.query, 'mono', 'center'),
        txt(
          'BLUE: LEXICAL  ·  CYAN: DENSE  ·  VIOLET: AUTHORIZED REWRITE',
          340,
          435,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),

        // Left side: ranked lists + live scores
        txt('BRANCH RANKINGS (k = 60)', -855, -230, 26, ROLE.focus, 'mono', 'left'),
        rect(780, 74, { fill: '#0d1528', stroke: ROLE.lexical, width: 2.4, radius: 10 }).at(
          -465,
          -155,
        ),
        txt(
          'Lexical: 1 Policy (1/61) · 2 Exc (1/62)',
          -830,
          -155,
          26,
          ROLE.lexical,
          'mono',
          'left',
        ),

        rect(780, 74, { fill: '#0c182a', stroke: ROLE.dense, width: 2.4, radius: 10 }).at(
          -465,
          -62,
        ),
        txt('Dense:   1 Exc (1/61) · 2 Policy (1/62)', -830, -62, 26, ROLE.dense, 'mono', 'left'),
      ];

      if (rw) {
        nodes.push(
          rect(780, 74, { fill: '#14122a', stroke: ROLE.rewrite, width: 2.8, radius: 10 })
            .at(-465, 31)
            .glow(8, ROLE.rewrite),
          txt(
            'Rewrite: 1 Exc (1/61) · 2 Policy (1/62)',
            -830,
            31,
            26,
            ROLE.rewrite,
            'mono',
            'left',
          ),
        );
      } else {
        nodes.push(
          txt(
            sc
              ? 'Raw BM25 & cosine scales never add directly'
              : 'Two active branches -> exact score tie',
            -855,
            31,
            26,
            th ? ROLE.focus : COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      // Live fused score meters
      nodes.push(
        txt(`Policy total:    ${polScore.toFixed(5)}`, -855, 138, 30, ROLE.policy, 'mono', 'left'),
        glowMeter(-855, 186, 720, 36, polScore / 0.055, { fill: ROLE.policy }),

        txt(
          `Exception total: ${excScore.toFixed(5)}`,
          -855,
          262,
          30,
          ROLE.exception,
          'mono',
          'left',
        ),
        glowMeter(-855, 310, 720, 36, excScore / 0.055, { fill: ROLE.exception }),

        txt(
          rw
            ? 'Exception leads (0.04892 > 0.04865) · rewrite is expansion, not evidence'
            : 'Tie at 0.03252 after Lexical + Dense branches',
          -855,
          388,
          26,
          rw ? ROLE.exception : ROLE.focus,
          'mono',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, manifold, header, overlay);
  orbitScene(s, c, manifold, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('fusion-beat-1-focus-2', () => {
    s.play(scaleOn.to(1, { duration: clampDur(c, c.cue('fusion-beat-1-focus-2').start, 0.35) }));
  });
  c.on('fusion-beat-1-focus-1', () => {
    s.play(
      twoBranchProg.to(1, { duration: clampDur(c, c.cue('fusion-beat-1-focus-1').start, 1.0) }),
    );
  });
  c.on('fusion-beat-2-focus-1', () => {
    s.play(
      tieHighlight.to(1, { duration: clampDur(c, c.cue('fusion-beat-2-focus-1').start, 0.35) }),
    );
  });
  c.on('fusion-beat-2-focus-2', () => {
    s.play(rewriteOn.to(1, { duration: clampDur(c, c.cue('fusion-beat-2-focus-2').start, 0.45) }));
  });
}
