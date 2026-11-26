// Scene 06: fim - Send both sides of the hole before generating
// File order (Prefix | [HOLE] | Suffix) morphing into causal FIM prompt order (PSM: PRE -> SUF -> MID -> gen)!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function fim(s, c) {
  const phase = s.value(0);
  const reorderOn = s.value(0);

  const header = cinemaHeader('FILL-IN-THE-MIDDLE (FIM)', 'Send both sides', 'before generating', {
    x: -860,
    y: -445,
    accent: ROLE.model,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#5ce1e618', '#a78bfa1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const ro = reorderOn.value;
      const nodes = [];

      // Top row: File Order (Prefix -> [HOLE] -> Suffix)
      const y1 = -120;
      nodes.push(
        txt(
          'FILE ORDER (CAUSAL DECODER CANNOT SEE SUFFIX YET)',
          -780,
          y1 - 68,
          26,
          ROLE.ed,
          'mono',
          'left',
        ),
        rect(480, 58, { fill: '#0b1428', stroke: ROLE.ed, width: 3, radius: 8 }).at(-540, y1),
        txt('PREFIX: is_allowed =', -540, y1, 26, ROLE.ed, 'mono', 'center'),
        rect(380, 58, { fill: '#0b1428', stroke: ROLE.focus, width: 3, radius: 8 }).at(-60, y1),
        txt('[ MISSING HOLE ]', -60, y1, 26, ROLE.focus, 'mono', 'center'),
        rect(520, 58, { fill: '#0b1428', stroke: ROLE.ok, width: 3, radius: 8 }).at(440, y1),
        txt('SUFFIX: return is_allowed', 440, y1, 26, ROLE.ok, 'mono', 'center'),
      );

      // Bottom row: FIM PSM Prompt Order (<PRE> Prefix <SUF> Suffix <MID> -> Generated Middle!)
      const y2 = 105;
      const roAlpha = 0.45 + ro * 0.55;
      nodes.push(
        txt(
          'FIM PSM PROMPT ORDER (MODEL SEES BOTH BOUNDARIES!)',
          -780,
          y2 - 68,
          26,
          ROLE.model,
          'mono',
          'left',
        ).opacity(roAlpha),
        rect(460, 58, { fill: '#0b1428', stroke: ROLE.ed, width: 3, radius: 8 })
          .at(-550, y2)
          .opacity(roAlpha),
        txt('<PRE>  PREFIX', -550, y2, 26, ROLE.ed, 'mono', 'center').opacity(roAlpha),
        rect(480, 58, { fill: '#0b1428', stroke: ROLE.ok, width: 3, radius: 8 })
          .at(-40, y2)
          .glow(8, ROLE.ok)
          .opacity(roAlpha),
        txt('<SUF>  SUFFIX', -40, y2, 26, ROLE.ok, 'mono', 'center').opacity(roAlpha),
        rect(520, 58, { fill: '#0b1428', stroke: ROLE.model, width: 3.4, radius: 8 })
          .at(500, y2)
          .glow(9, ROLE.model)
          .opacity(roAlpha),
        txt('<MID> -> graph.allows(req)', 500, y2, 26, ROLE.model, 'mono', 'center').opacity(
          roAlpha,
        ),
        beamWithPhotons(
          [
            [440, y1 + 36],
            [80, y2 - 36],
          ],
          ROLE.ok,
          p,
          { width: 3.6, photonCount: 2, alpha: roAlpha },
        ),
      );

      nodes.push(
        txt('CHECKPOINT CONTRACT', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Use exact trained sentinel token IDs', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
        line([-840, 215], [840, 215], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'Causal decoder attends left-to-right across BOTH Prefix & Suffix before emitting Middle',
          0,
          290,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.model,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.0);

  c.on('fim-beat-2-focus-1', () => {
    s.play(reorderOn.to(1, { duration: clampDur(c, c.cue('fim-beat-2-focus-1').start, 0.4) }));
  });
}
