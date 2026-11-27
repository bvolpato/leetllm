import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  dotItem,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export function buildEvictionArchitecture(s, c) {
  s.add(aura(-460, -40, 560, ROLE.fail, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.model, COSMOS.bg));

  s.add(
    cinemaHeader(
      'KV EVICTION & RECURRENCE',
      'Losing rare KV state',
      'changes what the model sees',
      {
        x: -860,
        y: -445,
        accent: ROLE.model,
        size: 46,
      },
    ),
  );

  const vaseOn = s.value(0);
  const recOn = s.value(0);

  c.on('ra-eviction-architecture-0-1', () =>
    s.play(
      vaseOn.to(1, { duration: clampDur(c, c.cue('ra-eviction-architecture-0-1').start, 0.5) }),
    ),
  );
  c.on('ra-eviction-architecture-1-0', () =>
    s.play(
      recOn.to(1, { duration: clampDur(c, c.cue('ra-eviction-architecture-1-0').start, 0.55) }),
    ),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const vs = vaseOn.value;
        const rc = recOn.value;
        const nodes = [];

        // Top: KV eviction strips (rare high-magnitude slot protected by VaSE)
        const yEv = -140;
        nodes.push(
          txt(
            'KV CACHE SLOTS  (VaSE PROTECTS RARE LARGE-MAGNITUDE VALUES)',
            -840,
            yEv - 72,
            26,
            ROLE.warn,
            'mono',
            'left',
          ),
        );
        const slots = [
          { t: 'tok 1', rare: false },
          { t: 'tok 2', rare: false },
          { t: 'RARE |V|>>1', rare: true },
          { t: 'tok 4', rare: false },
          { t: 'tok 5', rare: false },
          { t: 'tok 6', rare: false },
        ];
        slots.forEach((sl, idx) => {
          const x = -715 + idx * 285;
          const col = sl.rare ? (vs > 0.5 ? ROLE.focus : ROLE.fail) : ROLE.agent;
          const op = sl.rare ? 1 : vs > 0.5 && idx % 2 === 1 ? 0.3 : 0.85;
          nodes.push(
            rect(240, 62, { fill: '#0b1224', stroke: col, width: sl.rare ? 3.2 : 2.2, radius: 8 })
              .at(x, yEv)
              .glow(sl.rare ? 9 : 3, col)
              .opacity(op),
            txt(sl.t, x, yEv, 26, col, 'mono', 'center').opacity(op),
          );
        });

        nodes.push(
          txt(
            vs > 0.5
              ? 'EVICTING RARE VALUES CAUSED REPEATED FAILED LOOPS · VaSE PROTECTS THEM & SAMPLES OTHERS'
              : 'RECOVERING AN EVICTED KV STATE FROM SAVED TEXT REQUIRES RECOMPUTATION',
            0,
            yEv + 78,
            26,
            vs > 0.5 ? ROLE.focus : COSMOS.muted,
            'mono',
            'center',
          ),
        );

        // Bottom: Recurrent-Depth Architecture (3.5B model looping through trained block with shared KV)
        nodes.push(line([-860, 12], [840, 12], { stroke: '#233152', width: 2 }));
        const rAlpha = 0.3 + 0.7 * rc;

        nodes.push(
          txt(
            'RECURRENT-DEPTH LATENT REASONING (3.5B PUBLISHED MODEL)',
            -840,
            78,
            26,
            ROLE.model,
            'mono',
            'left',
          ).opacity(rAlpha),
        );

        const yLoop = 212;
        nodes.push(
          rect(240, 64, { fill: '#0b1224', stroke: ROLE.agent, width: 2.5, radius: 8 })
            .at(-680, yLoop)
            .opacity(rAlpha),
          txt('TOKEN IN', -680, yLoop, 26, ROLE.agent, 'mono', 'center').opacity(rAlpha),
          beamWithPhotons(
            [
              [-550, yLoop],
              [-350, yLoop],
            ],
            ROLE.agent,
            0,
            { alpha: rAlpha },
          ),
          rect(520, 94, { fill: '#0d152b', stroke: ROLE.model, width: 3.2, radius: 10 })
            .at(-100, yLoop)
            .glow(10, ROLE.model)
            .opacity(rAlpha),
          txt(
            'RECURRENT BLOCK (k PASSES)',
            -100,
            yLoop - 16,
            26,
            ROLE.model,
            'mono',
            'center',
          ).opacity(rAlpha),
          txt(
            'SHARES KV STATE ACROSS PASSES',
            -100,
            yLoop + 22,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(rAlpha),
          beamWithPhotons(
            [
              [170, yLoop],
              [290, yLoop],
            ],
            ROLE.ok,
            0,
            { alpha: rAlpha },
          ),
          rect(260, 64, { fill: '#0b1224', stroke: ROLE.ok, width: 2.5, radius: 8 })
            .at(430, yLoop)
            .opacity(rAlpha),
          txt('TOKEN OUT', 430, yLoop, 26, ROLE.ok, 'mono', 'center').opacity(rAlpha),
        );

        nodes.push(
          dotItem(
            -840,
            360,
            'VARYING PASSES TUNES PER-TOKEN COMPUTE · REQUIRES RECURRENT WEIGHTS + RUNTIME LOOP SUPPORT',
            COSMOS.muted,
            { opacity: rAlpha },
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
