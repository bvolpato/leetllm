import { group, line } from 'vizmatic/stage';
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

export function buildDiagnosticRepair(s, c) {
  s.add(aura(-460, -40, 560, ROLE.warn, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'DIAGNOSTIC PLAYBOOK',
      'Pair each visible symptom',
      'with the causal stage to check',
      {
        x: -860,
        y: -445,
        accent: ROLE.warn,
        size: 46,
      },
    ),
  );

  const stage2 = s.value(0);
  const pulse = s.value(0);
  driftValue(s, c, pulse, 2.0);

  c.on('cc-diagnostic-repair-1', () =>
    s.play(stage2.to(1, { duration: clampDur(c, c.cue('cc-diagnostic-repair-1').start, 0.6) })),
  );

  const rows = [
    {
      sym: 'LANDED IN WRONG PLACE',
      check: 'REPLAY EDIT, LATE REPLY, PAINT + TAB CHECKS',
      col: ROLE.fail,
      group: 0,
    },
    {
      sym: 'SLOW DOT METHOD LOOKUP',
      check: 'CHECK LSP RECEIVER TYPE RESOLUTION',
      col: ROLE.ed,
      group: 0,
    },
    {
      sym: 'CONFLICTS WITH NEXT LINE',
      check: 'INSPECT SUFFIX + CHECKPOINT INFILL FORMAT',
      col: ROLE.focus,
      group: 0,
    },
    {
      sym: 'WRONG FUNCTION SENT',
      check: 'COMPARE CARET VS PARSER FUNCTION RANGE',
      col: ROLE.warn,
      group: 0,
    },
    {
      sym: 'POOR PREFIX CACHE HITS',
      check: 'DIFF LEADING IDs, POLICY SCOPE, EVICTION, REPLICA',
      col: ROLE.model,
      group: 1,
    },
    {
      sym: 'LATENCY / ACCEPTANCE SPIKE',
      check: 'SPLIT STAGES + SHOWN/RETAINED; CHANGE ONE LEVER',
      col: ROLE.ok,
      group: 1,
    },
  ];

  s.add(txt('OBSERVED SYMPTOM', -835, -242, 26, COSMOS.muted, 'mono', 'left'));
  s.add(txt('FIRST CAUSAL CHECK', -24, -242, 26, COSMOS.muted, 'mono', 'left'));
  s.add(line([-860, -214], [840, -214], { stroke: '#233152', width: 2 }));

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const s2 = stage2.value;
        const p = pulse.value;
        const nodes = [];

        rows.forEach((r, idx) => {
          const y = -148 + idx * 94;
          const active = r.group === 0 ? (s2 < 0.5 ? 1 : 0.65) : 0.25 + 0.75 * s2;
          nodes.push(glowDot(-825, y, { radius: 8, color: r.col, glow: 8, opacity: active }));
          nodes.push(txt(r.sym, -795, y, 26, r.col, 'mono', 'left').opacity(active));
          nodes.push(
            beamWithPhotons(
              [
                [-200, y],
                [-52, y],
              ],
              r.col,
              p + idx * 0.16,
              { photonCount: active > 0.7 ? 1 : 0, alpha: active },
            ),
          );
          nodes.push(txt(r.check, -24, y, 26, COSMOS.ink, 'mono', 'left').opacity(active));
        });

        nodes.push(line([-860, 408], [840, 408], { stroke: '#233152', width: 2 }));
        nodes.push(
          txt(
            'CHANGE ONE CAUSAL LEVER ON A FIXED REPLAY  |  PRESERVE ORIGINAL EDITOR SNAPSHOT',
            0,
            464,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(0.45 + 0.55 * s2),
        );

        return group(...nodes);
      },
    ),
  );
}
