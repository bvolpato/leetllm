// Scene 10: prefix-state - Keep cache residency, active references and exact reuse distinct
// Glowing 4-ID prefix block verification matrix: Stored Tenant A [10,20,30,40] vs Warm Hit,
// Cold Replica B, Early Edit [11,20,30,40], and Tenant B salt mismatch.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function prefixState(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=same warm hit, 2=cold/edit/tenant misses

  const header = cinemaHeader(
    'PREFIX CACHING & ISOLATION',
    'Residency, active refs',
    '& exact reuse',
    {
      x: -860,
      y: -420,
      accent: ROLE.focus,
      size: 52,
    },
  );

  const bgAura = aura(240, 40, 640, '#ffd1661c', '#5ce1e618');

  const stored = [10, 20, 30, 40];
  const cases = [
    {
      name: 'Warm Replica A',
      tenant: 'Tenant A',
      toks: [10, 20, 30, 40],
      resident: true,
      reuse: 4,
      beat: 0,
    },
    {
      name: 'Cold Replica B',
      tenant: 'Tenant A',
      toks: [10, 20, 30, 40],
      resident: false,
      reuse: 0,
      beat: 1,
    },
    {
      name: 'Early Token Edit',
      tenant: 'Tenant A',
      toks: [11, 20, 30, 40],
      resident: true,
      reuse: 0,
      beat: 1,
    },
    {
      name: 'Other Tenant Salt',
      tenant: 'Tenant B',
      toks: [10, 20, 30, 40],
      resident: true,
      reuse: 0,
      beat: 1,
    },
  ];

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const nodes = [
        txt('CACHED BLOCK ON REPLICA A', 40, -370, 26, ROLE.active, 'mono', 'left'),
        txt(
          'Tenant A · IDs [10, 20, 30, 40] · Evictable if ref=0',
          40,
          -315,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ),
      ];

      cases.forEach((row, rIdx) => {
        const show = row.beat === 0 || st >= 1.5;
        if (!show) return;
        const y = -135 + rIdx * 130;
        const hit = row.reuse > 0;
        const rowCol = hit ? ROLE.warm : ROLE.reject;

        nodes.push(
          txt(row.name, -860, y - 14, 28, COSMOS.ink, 'sans', 'left'),
          txt(
            `${row.tenant} · ${row.resident ? 'resident' : 'cold'}`,
            -860,
            y + 24,
            26,
            row.resident ? ROLE.active : ROLE.reject,
            'mono',
            'left',
          ),
        );

        row.toks.forEach((tk, j) => {
          const match = tk === stored[j] && row.tenant === 'Tenant A' && row.resident;
          const tCol = match ? ROLE.active : ROLE.reject;
          const cx = -230 + j * 145;
          nodes.push(
            rect(118, 66, {
              fill: match ? '#0f233a' : '#281321',
              stroke: tCol,
              width: 2.4,
              radius: 10,
            })
              .at(cx, y)
              .glow(match ? 6 : 4, tCol),
            txt(String(tk), cx, y, 28, tCol, 'mono'),
          );
        });

        // Laser verdict beam
        nodes.push(
          beamWithPhotons(
            [
              [315, y],
              [525, y],
            ],
            rowCol,
            p * 0.9,
            { width: 3.4, glow: 8, photonCount: 1 },
          ),
          txt(hit ? 'REUSE 4' : 'REUSE 0', 560, y, 30, rowCol, 'mono', 'left').glow(7, rowCol),
        );
      });

      const foot =
        st >= 1.5
          ? 'Scale-out onto cold replicas can raise TTFT until prefixes warm'
          : 'Active refs protect live readers; unreferenced cached blocks stay evictable';
      nodes.push(txt(foot, 0, 415, 28, st >= 1.5 ? ROLE.focus : COSMOS.muted, 'sans'));

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);
  driftValue(s, c, phase, 5.5, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-prefix-state-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-prefix-state-b1', step, 2, 0.35);
}
