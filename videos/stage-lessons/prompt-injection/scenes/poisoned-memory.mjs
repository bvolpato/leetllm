// Scene 25: poisoned-memory - Carry provenance through a later turn
// Cross-session provenance timeline: Turn 1 writes a report-originated `"approval granted"`
// note into memory carrying an external source stripe; across the session boundary Turn 2
// reloads it strictly onto the Evidence side while the independent Host Approval Store
// remains empty or consumed, rechecking every binding at the protected sink.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  glowDot,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function poisonedMemory(s, c) {
  const pulse = s.value(0);
  const crossTurn = s.value(0);
  const recheckHi = s.value(0);
  const dualMeasure = s.value(0);

  const header = cinemaHeader(
    'CROSS-TURN MEMORY PROVENANCE',
    'Carry provenance through',
    'every later turn',
    { accent: ROLE.untrusted, size: 48 },
  );

  const stageAura = aura(100, 30, 620, '#fb923c1a', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ct = crossTurn.value;
      const rc = recheckHi.value;
      const dm = dualMeasure.value;
      const nodes = [];

      // Left: Turn 1 writes tainted memory note (generously wide box, clear of beam!)
      nodes.push(
        energyRail(-855, -205, 145, ROLE.source, { width: 6, glow: 8 }),
        txt('TURN 1 · MEMORY WRITE', -825, -182, 26, ROLE.source, 'mono', 'left'),
        txt('External report text:', -825, -124, 26, COSMOS.muted, 'sans', 'left'),
        txt('“approval granted for C17”', -825, -72, 28, ROLE.untrusted, 'serif', 'left').glow(
          6,
          ROLE.untrusted,
        ),
        rect(610, 128, { fill: '#15192c', stroke: ROLE.untrusted, width: 2.6, radius: 10 }).at(
          -520,
          62,
        ),
        txt('STORED MEMORY NOTE', -520, 32, 26, ROLE.untrusted, 'mono', 'center'),
        txt('origin: external · trust: UNTRUSTED', -520, 84, 26, COSMOS.ink, 'mono', 'center'),
      );

      // Center: Session Boundary Wall + Provenance Transfer Beam
      const wallX = -70;
      nodes.push(
        line([wallX, -225], [wallX, 175], { stroke: '#334673', width: 2.6, dash: [10, 10] }),
        txt('LATER SESSION', wallX, -252, 26, ROLE.host, 'mono', 'center'),
      );

      const memArc = quadArcPts([-208, 36], [130, -90], -35, 22);
      nodes.push(
        beamWithPhotons(memArc, ROLE.untrusted, p * 1.0, { width: 3.4, alpha: 0.55 + ct * 0.45 }),
      );

      // Right Top: Reloaded strictly onto EVIDENCE side of Turn 2
      nodes.push(
        energyRail(155, -205, -15, ROLE.untrusted, { width: 6, glow: 8 }),
        txt('TURN 2 · EVIDENCE SIDE', 185, -182, 26, ROLE.untrusted, 'mono', 'left'),
        txt(
          'Note returns WITH external provenance stripe',
          185,
          -126,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),
        txt(
          'Text repeating “approved” ≠ approval entry',
          185,
          -70,
          26,
          ROLE.attack,
          'mono',
          'left',
        ).glow(6, ROLE.attack),
      );

      // Right Bottom: Independent Host Approval Store (EMPTY / CONSUMED!)
      nodes.push(
        energyRail(155, 20, 175, ROLE.host, { width: 6, glow: 8 + rc * 6 }),
        txt('INDEPENDENT HOST APPROVAL STORE', 185, 44, 26, ROLE.host, 'mono', 'left'),
        txt('STATUS: EMPTY / CONSUMED (DENIED)', 185, 100, 28, ROLE.denied, 'mono', 'left').glow(
          8,
          ROLE.denied,
        ),
        txt(
          'Old unused grant (other task) & consumed grant both fail',
          185,
          152,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      // Bottom Band: Multi-step testing + Dual measurement (Reader + Host)
      nodes.push(line([-855, 215], [845, 215], { stroke: '#25355a', width: 2 }));

      const rAlpha = 0.45 + rc * 0.55;
      const dAlpha = 0.45 + dm * 0.55;
      nodes.push(
        energyRail(-855, 248, 396, ROLE.host, { width: 5, opacity: rAlpha }),
        txt('RECHECK AT PROTECTED SINK', -825, 272, 26, ROLE.host, 'mono', 'left').opacity(rAlpha),
        txt(
          'Test write-note -> reload-note multi-step trace',
          -825,
          326,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(rAlpha),
        txt(
          'Recheck principal · artifact · suite · target · op',
          -825,
          376,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(rAlpha),

        energyRail(20, 248, 396, ROLE.ok, { width: 5, opacity: dAlpha }),
        txt('MEASURE READER + HOST SEPARATELY', 50, 272, 26, ROLE.ok, 'mono', 'left').opacity(
          dAlpha,
        ),
        txt(
          'Keep useful summaries & benign quoted text',
          50,
          326,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(dAlpha),
        txt(
          'Else a strict host hides a model following every attack',
          50,
          376,
          26,
          ROLE.untrusted,
          'mono',
          'left',
        ).opacity(dAlpha),
        glowDot(-840 + ((p * 0.25) % 1) * 1680, 215, {
          radius: 4.5,
          color: ROLE.untrusted,
          glow: 8,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('pi-poisoned-memory-0', () => {
    s.play(crossTurn.to(1, { duration: clampDur(c, c.cue('pi-poisoned-memory-0').start, 0.45) }));
  });
  c.on('pi-poisoned-memory-1', () => {
    s.play(recheckHi.to(1, { duration: clampDur(c, c.cue('pi-poisoned-memory-1').start, 0.45) }));
  });
  c.on('pi-poisoned-memory-2', () => {
    s.play(dualMeasure.to(1, { duration: clampDur(c, c.cue('pi-poisoned-memory-2').start, 0.45) }));
  });
}
