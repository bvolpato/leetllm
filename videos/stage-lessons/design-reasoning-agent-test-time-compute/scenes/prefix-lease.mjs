import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dotItem,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildPrefixLease(s, c) {
  s.add(aura(-460, -40, 560, ROLE.agent, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.warn, COSMOS.bg));

  s.add(
    cinemaHeader(
      'PREFIX REF-COUNTS & LEASES',
      'A shared prefix has',
      'readers and write boundaries',
      {
        x: -860,
        y: -445,
        accent: ROLE.agent,
        size: 46,
      },
    ),
  );

  const pruneOn = s.value(0);
  const cowOn = s.value(0);
  const relOn = s.value(0);

  c.on('ra-prefix-lease-1-1', () =>
    s.play(pruneOn.to(1, { duration: clampDur(c, c.cue('ra-prefix-lease-1-1').start, 0.5) })),
  );
  c.on('ra-prefix-lease-1-2', () =>
    s.play(cowOn.to(1, { duration: clampDur(c, c.cue('ra-prefix-lease-1-2').start, 0.5) })),
  );
  c.on('ra-prefix-lease-2-0', () =>
    s.play(relOn.to(1, { duration: clampDur(c, c.cue('ra-prefix-lease-2-0').start, 0.5) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const pr = pruneOn.value;
        const cw = cowOn.value;
        const rl = relOn.value;
        const nodes = [];

        const refs = cw > 0.5 ? 1 : pr > 0.5 ? 2 : 4;
        const reader = rl > 0.5 ? 0 : 1;

        // Top: Shared Prefix Page + 4 Branch handles
        nodes.push(
          rect(520, 118, { fill: '#0b1224', stroke: ROLE.focus, width: 3, radius: 10 })
            .at(-540, -110)
            .glow(8, ROLE.focus),
          txt('SHARED PREFIX PAGE', -540, -134, 28, ROLE.focus, 'mono', 'center'),
          txt(`REF COUNT = ${refs}`, -540, -86, 30, ROLE.agent, 'mono', 'center'),
        );

        const handles = [
          {
            name: 'BRANCH 1',
            state: pr > 0.5 ? 'PRUNED (REF -1)' : 'READING STEM',
            col: pr > 0.5 ? COSMOS.muted : ROLE.agent,
          },
          {
            name: 'BRANCH 2',
            state: pr > 0.5 ? 'PRUNED (REF -1)' : 'READING STEM',
            col: pr > 0.5 ? COSMOS.muted : ROLE.agent,
          },
          {
            name: 'BRANCH 3',
            state: cw > 0.5 ? 'COPY-ON-WRITE -> PRIVATE PAGE' : 'READING STEM',
            col: cw > 0.5 ? ROLE.ok : ROLE.agent,
          },
          { name: 'BRANCH 4', state: 'STILL HOLDS STEM REF', col: ROLE.focus },
        ];
        handles.forEach((h, i) => {
          const y = -205 + i * 68;
          nodes.push(
            txt(h.name, -180, y, 26, h.col, 'mono', 'left'),
            txt(h.state, 60, y, 26, h.col, 'mono', 'left'),
          );
        });

        // Middle: Device reader lease & reclamation boundary
        nodes.push(line([-860, 82], [840, 82], { stroke: '#233152', width: 2 }));

        nodes.push(
          metricReadout('ACTIVE DEVICE READERS', `${reader} IN-FLIGHT`, -480, 210, {
            color: reader > 0 ? ROLE.warn : ROLE.ok,
            size: 42,
            sub: reader > 0 ? 'losing suffix stays pinned' : 'safe to reclaim suffix pages',
          }),
          metricReadout('CACHE KEY CONTRACT', 'TOKENS + POS + MODEL + TENANT', 320, 210, {
            color: ROLE.agent,
            size: 32,
            sub: 'identical visible text alone is NOT a cache key',
          }),
        );

        nodes.push(
          dotItem(
            -840,
            378,
            'ADMISSION MUST USE LIVE WORKING SET + PAGE ROUNDING + METADATA (NOT JUST FINAL SHARED TOTAL)',
            COSMOS.muted,
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
