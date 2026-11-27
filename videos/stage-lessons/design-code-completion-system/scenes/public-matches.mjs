import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export function buildPublicMatches(s, c) {
  s.add(aura(-460, -40, 560, ROLE.model, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'PROVENANCE & BEHAVIOR',
      'Check public-code matches',
      'and test permission boundaries',
      {
        x: -860,
        y: -445,
        accent: ROLE.model,
        size: 46,
      },
    ),
  );

  const matchT = s.value(0);
  const testT = s.value(0);
  c.on('cc-public-index', () =>
    s.play(matchT.to(1, { duration: clampDur(c, c.cue('cc-public-index').start, 0.55) })),
  );
  c.on('cc-public-matches-1', () =>
    s.play(testT.to(1, { duration: clampDur(c, c.cue('cc-public-matches-1').start, 0.55) })),
  );

  // Proposed suggestion anchor at top
  s.add(
    rect(1120, 74, { fill: '#0c1528', stroke: ROLE.ed, width: 2.5, radius: 10 }).at(-280, -182),
  );
  s.add(
    txt(
      'PROPOSED:  return graph.allows(user, repo, scope="branch")',
      -810,
      -182,
      28,
      ROLE.ed,
      'mono',
      'left',
    ),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const m = matchT.value;
        const t = testT.value;
        const nodes = [];

        // Left branch: Provenance / public-code index check
        nodes.push(
          beamWithPhotons(
            [
              [-540, -142],
              [-540, -44],
            ],
            ROLE.model,
            0,
          ),
        );
        nodes.push(txt('1. PUBLIC-CODE MATCH CHECK', -840, -4, 28, ROLE.model, 'mono', 'left'));
        const provItems = [
          { y: 60, txt: 'ORG POLICY: BLOCK OR SHOW REFERENCE', col: COSMOS.ink },
          { y: 118, txt: 'INDEX: PUBLIC GITHUB (PERIODIC REFRESH)', col: ROLE.focus },
          { y: 176, txt: '0 MATCHES != LICENSE CLEARANCE', col: ROLE.warn },
          { y: 234, txt: 'REVIEW PROVENANCE & ATTRIBUTION', col: COSMOS.muted },
        ];
        provItems.forEach((it, idx) => {
          const al = idx === 0 ? 1 : 0.4 + 0.6 * m;
          nodes.push(glowDot(-825, it.y, { radius: 7, color: it.col, glow: 7, opacity: al }));
          nodes.push(txt(it.txt, -798, it.y, 26, it.col, 'mono', 'left').opacity(al));
        });

        // Vertical separator
        nodes.push(line([10, -44], [10, 310], { stroke: '#233152', width: 2 }));

        // Right branch: Application behavior & signature verification
        const tAlpha = 0.3 + 0.7 * t;
        nodes.push(
          beamWithPhotons(
            [
              [140, -142],
              [140, -44],
            ],
            ROLE.ok,
            0,
            { alpha: tAlpha },
          ),
        );
        nodes.push(
          txt('2. APPLICATION BEHAVIOR CHECK', 56, -4, 28, ROLE.ok, 'mono', 'left').opacity(tAlpha),
        );

        const tests = [
          { y: 60, label: 'API SIGNATURE:', val: 'does graph.allows() exist?', col: ROLE.ed },
          { y: 126, label: 'IN-SCOPE CASE:', val: 'ALLOW permitted repo', col: ROLE.ok },
          { y: 192, label: 'OUT-OF-SCOPE:', val: 'DENY unpermitted repo', col: ROLE.fail },
          {
            y: 258,
            label: 'CHECK VERSION:',
            val: 'verify against installed library',
            col: ROLE.focus,
          },
        ];
        tests.forEach((tc) => {
          nodes.push(glowDot(70, tc.y, { radius: 7, color: tc.col, glow: 7, opacity: tAlpha }));
          nodes.push(txt(tc.label, 96, tc.y, 26, tc.col, 'mono', 'left').opacity(tAlpha));
          nodes.push(txt(tc.val, 412, tc.y, 26, COSMOS.ink, 'mono', 'left').opacity(tAlpha));
        });

        // Bottom takeaway
        nodes.push(line([-860, 356], [840, 356], { stroke: '#233152', width: 2 }));
        nodes.push(
          txt(
            'KEEPING A SUGGESTION RECORDS AN EDIT  |  ONLY EXECUTING BOTH PERMISSION CASES PROVES BEHAVIOR',
            0,
            420,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(0.4 + 0.6 * t),
        );

        return group(...nodes);
      },
    ),
  );
}
