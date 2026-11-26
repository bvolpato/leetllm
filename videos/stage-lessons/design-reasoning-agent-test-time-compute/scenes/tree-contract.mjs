import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dotItem,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export function buildTreeContract(s, c) {
  s.add(aura(-460, -40, 560, ROLE.model, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.focus, COSMOS.bg));

  s.add(
    cinemaHeader(
      'FRONTIER VS COMPLETED VAULT',
      'A completed plan survives',
      'the next depth frontier',
      {
        x: -860,
        y: -445,
        accent: ROLE.focus,
        size: 46,
      },
    ),
  );

  const deferOn = s.value(0);
  const depthOn = s.value(0);

  c.on('ra-tree-contract-0-2', () =>
    s.play(deferOn.to(1, { duration: clampDur(c, c.cue('ra-tree-contract-0-2').start, 0.5) })),
  );
  c.on('ra-tree-contract-1-1', () =>
    s.play(depthOn.to(1, { duration: clampDur(c, c.cue('ra-tree-contract-1-1').start, 0.55) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const df = deferOn.value;
        const dp = depthOn.value;
        const nodes = [];

        // Top: Eligibility Gate (cutoff 0.35 + exact check)
        nodes.push(
          txt(
            'BEAM CONFIG: WIDTH = 2 SLOTS   |   MIN SCORE >= 0.35',
            -840,
            -210,
            26,
            ROLE.agent,
            'mono',
            'left',
          ),
          rect(760, 148, { fill: '#0b1224', stroke: ROLE.fail, width: 2.6, radius: 10 }).at(
            -460,
            -88,
          ),
          txt('DEFER SECURITY FIX  (score 0.39)', -810, -120, 28, ROLE.fail, 'mono', 'left'),
          txt('0.39 >= 0.35 cutoff  (PASSES SCORE)', -810, -76, 26, ROLE.warn, 'mono', 'left'),
          txt(
            'EXACT CHECK: UNFIXED ADVISORY -> REJECTED',
            -810,
            -34,
            26,
            ROLE.fail,
            'mono',
            'left',
          ).opacity(0.4 + 0.6 * df),
        );

        // Right: Separate Completed Plans Vault
        nodes.push(
          rect(780, 148, { fill: '#0b1224', stroke: ROLE.focus, width: 2.8, radius: 10 })
            .at(450, -88)
            .glow(dp > 0.5 ? 10 : 4, ROLE.focus),
          txt('COMPLETED PLANS VAULT (ISOLATED)', 95, -120, 28, ROLE.focus, 'mono', 'left'),
          txt(
            dp > 0.5
              ? 'Patch sanitizer (0.96) + Add shim (0.70)'
              : 'SEPARATE FROM UNFINISHED FRONTIER SLOTS',
            95,
            -76,
            26,
            dp > 0.5 ? ROLE.ok : COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            'UNFINISHED PINS NEVER DISPLACE VERIFIED PLAN',
            95,
            -34,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );

        // Bottom: Depth Limit 1 -> 2 -> 3 comparison table
        nodes.push(line([-860, 44], [840, 44], { stroke: '#233152', width: 2 }));
        const dAlpha = 0.35 + 0.65 * dp;

        const rows = [
          {
            d: 'DEPTH 1',
            beam: 'Keep v1 (0.81), Pin v2 (0.74)',
            vault: 'empty (unfinished pins only)',
            col: ROLE.warn,
            y: 120,
          },
          {
            d: 'DEPTH 2',
            beam: 'frontier empty (all expanded)',
            vault: 'Patch sanitizer (0.96) FINISHES',
            col: ROLE.ok,
            y: 212,
          },
          {
            d: 'DEPTH 3',
            beam: 'no further expansion',
            vault: 'Patch sanitizer (0.96) STAYS INTACT',
            col: ROLE.focus,
            y: 304,
          },
        ];

        rows.forEach((r) => {
          nodes.push(
            txt(r.d, -840, r.y, 28, r.col, 'mono', 'left').opacity(dAlpha),
            txt(r.beam, -610, r.y, 26, COSMOS.muted, 'mono', 'left').opacity(dAlpha),
            txt(r.vault, 120, r.y, 26, r.col, 'mono', 'left').opacity(dAlpha),
          );
        });

        nodes.push(
          dotItem(
            -840,
            408,
            'BRANCHES DROPPED FROM BEAM ARE GONE UNLESS EXPLICITLY RETAINED',
            COSMOS.muted,
            { opacity: dAlpha },
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
