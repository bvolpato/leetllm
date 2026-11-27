// Scene 30: incident-evidence - Contain foreign evidence before tuning the queue
// Beat 0: Return to A/B postmortem leak -> contain leaking path first & preserve scoped audit traces.
// Beat 1: Diagnose delay via 7 telemetry signals + revisit 5-page demand vs 4 -> 5 available pages.
// Beat 2: Multi-tenant mixed workload & fault-injection evaluation matrix.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

const TELEMETRY = [
  'Queue age',
  'Admitted work',
  'Active seqs',
  'KV occupancy',
  'Preemptions',
  'Adapter misses',
  'Stage latency',
];

const STRESS_MIX = [
  ['Short summaries', ROLE.B],
  ['Long prompts', ROLE.A],
  ['Adapter churn', ROLE.adapter],
  ['Cache misses', ROLE.kv],
  ['Disconnects', ROLE.warn],
  ['Worker loss', ROLE.fail],
  ['Quota outage', ROLE.held],
  ['Overload tails', ROLE.ok],
];

export default function incidentEvidence(s, c) {
  const b0On = s.value(0);
  const leakShown = s.value(0);
  const containedOn = s.value(0);
  const b1On = s.value(0);
  const diagOn = s.value(0);
  const addCapOn = s.value(0);
  const b2On = s.value(0);

  const stageAura = aura(0, 20, 760, '#ff6b8b1a', '#6ee7b716');
  const header = cinemaHeader(
    'INCIDENT TRIAGE & EVALUATION',
    'Contain foreign evidence',
    'before tuning the queue',
    { x: -860, y: -450, accent: ROLE.fail, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const cont = containedOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const diag = diagOn.value > 0.5;
      const addCap = addCapOn.value > 0.5;
      const b2 = b2On.value > 0.5;

      const nodes = [];

      if (!b1 && !b2) {
        // Beat 0: Return to A/B leak -> contain first!
        nodes.push(
          rect(660, 185, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
            .at(-500, -110)
            .glow(7, ROLE.A),
          txt('WORKSPACE A  ·  PRIVATE POSTMORTEM', -500, -152, 26, ROLE.A, 'mono', 'center'),
          txt('Permitted reader: Carol only', -500, -96, 30, COSMOS.ink, 'sans', 'center'),

          rect(660, 185, { fill: '#220f1a', stroke: ROLE.B, width: 2.8, radius: 16 })
            .at(500, -110)
            .glow(7, ROLE.B),
          txt('WORKSPACE B  ·  BOB’S REQUEST', 500, -152, 26, ROLE.B, 'mono', 'center'),
          txt('Not authorized for A-private', 500, -96, 30, COSMOS.ink, 'sans', 'center'),
        );

        if (!cont) {
          nodes.push(
            beamWithPhotons(
              [
                [-165, -110],
                [165, -110],
              ],
              ROLE.fail,
              0,
              { width: 5, glow: 10 },
            ),
            rect(1260, 128, { fill: '#280f1a', stroke: ROLE.fail, width: 3.0, radius: 16 })
              .at(0, 150)
              .glow(10, ROLE.fail),
            txt(
              leakShown.value > 0.5
                ? 'ACTIVE CROSS-TENANT LEAK:  A-private reached B'
                : 'Inspecting opening incident...',
              0,
              150,
              32,
              ROLE.fail,
              'mono',
              'center',
            ),
          );
        } else {
          nodes.push(
            line([0, -210], [0, 0], { stroke: ROLE.ok, width: 10 }).glow(12, ROLE.ok),
            rect(1260, 128, { fill: '#0b221b', stroke: ROLE.ok, width: 3.0, radius: 16 })
              .at(0, 150)
              .glow(10, ROLE.ok),
            txt(
              'LEAKING PATH CONTAINED  ·  AUDIT EVIDENCE PRESERVED',
              0,
              150,
              31,
              ROLE.ok,
              'mono',
              'center',
            ),
          );
        }

        nodes.push(
          txt(
            'Adding GPU replicas cannot repair an authorization bug: fix identity, retrieval, and cache boundaries.',
            0,
            378,
            28,
            ROLE.focus,
            'sans',
            'center',
          ),
        );
      } else if (b1 && !b2) {
        // Beat 1: Separate 7 telemetry metrics + 5-page demand vs 4 -> 5 available pages
        nodes.push(
          rect(660, 118, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 14 }).at(
            -490,
            -168,
          ),
          txt('REQUEST DEMAND:  5 PAGES', -490, -168, 32, ROLE.A, 'mono', 'center'),

          rect(660, 118, {
            fill: addCap ? '#0b221b' : '#240f19',
            stroke: addCap ? ROLE.ok : ROLE.fail,
            width: 3.0,
            radius: 14,
          })
            .at(490, -168)
            .glow(9, addCap ? ROLE.ok : ROLE.fail),
          txt(
            addCap ? 'WORKER CAPACITY:  5 PAGES (FIT)' : 'WORKER CAPACITY:  4 PAGES (SHORT)',
            490,
            -168,
            30,
            addCap ? ROLE.ok : ROLE.fail,
            'mono',
            'center',
          ),

          txt(
            diag
              ? 'DIAGNOSTIC SIGNALS BY TENANT & ROUTE (MODERATE UTIL CAN HIDE KV PRESSURE)'
              : 'SEPARATE COMPETING DELAY EXPLANATIONS',
            0,
            -46,
            26,
            ROLE.focus,
            'mono',
            'center',
          ),
        );

        TELEMETRY.forEach((metric, idx) => {
          const row = Math.floor(idx / 4);
          const col = idx % 4;
          const count = row === 0 ? 4 : 3;
          const startX = row === 0 ? -615 : -410;
          const cx = startX + col * 410;
          const cy = 62 + row * 126;
          const isKv = idx === 3;
          const stroke = isKv ? ROLE.held : diag ? ROLE.shared : '#31426b';
          nodes.push(
            rect(370, 90, { fill: '#0b1224', stroke, width: isKv ? 3.0 : 2.2, radius: 14 })
              .at(cx, cy)
              .glow(isKv ? 9 : diag ? 4 : 0, stroke),
            txt(metric, cx, cy, 27, isKv ? ROLE.held : COSMOS.ink, 'mono', 'center'),
          );
        });

        nodes.push(
          txt(
            addCap
              ? 'Add capacity only for the measured constraint.'
              : 'Compare queue age, KV occupancy, preemptions, and adapter misses per tenant.',
            0,
            395,
            29,
            addCap ? ROLE.ok : COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 2: Mixed-workload & fault-injection evaluation harness
        nodes.push(
          txt(
            'MULTI-TENANT STRESS & FAULT-INJECTION BENCHMARK',
            840,
            -395,
            26,
            ROLE.ok,
            'mono',
            'right',
          ),
        );
        STRESS_MIX.forEach(([label, col], idx) => {
          const cx = -630 + (idx % 4) * 420;
          const cy = -80 + Math.floor(idx / 4) * 215;
          nodes.push(
            rect(384, 155, { fill: '#0b1224', stroke: col, width: 2.8, radius: 16 })
              .at(cx, cy)
              .glow(6, col),
            txt(label, cx, cy, 30, col, 'mono', 'center'),
          );
        });
        nodes.push(
          rect(1660, 114, { fill: '#0b1e1b', stroke: ROLE.ok, width: 2.8, radius: 16 }).at(0, 355),
          txt(
            'Record hardware, engine, precision, lengths & warmup; compare per-tenant tail latency & goodput.',
            0,
            355,
            27,
            ROLE.ok,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'mt-incident-evidence-b0', b0On, 1);
  stepAfter(s, c, 'mt-incident-evidence-s0-0', leakShown, 1);
  stepAfter(s, c, 'mt-incident-evidence-s0-1', containedOn, 1);
  stepOn(s, c, 'mt-incident-evidence-b1', b1On, 1);
  stepAfter(s, c, 'mt-incident-evidence-s1-1', diagOn, 1);
  stepOn(s, c, 'mt-incident-evidence-s1-3', addCapOn, 1);
  stepOn(s, c, 'mt-incident-evidence-b2', b2On, 1);
}
