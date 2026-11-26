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

export function buildVotingBaseline(s, c) {
  s.add(aura(-460, -40, 560, ROLE.fail, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'MAJORITY VOTE VS DIVERSITY',
      'A majority label can',
      'preserve a shared mistake',
      {
        x: -860,
        y: -445,
        accent: ROLE.fail,
        size: 46,
      },
    ),
  );

  const blockedOn = s.value(0);
  const beamOn = s.value(0);

  c.on('ra-voting-baseline-0-2', () =>
    s.play(blockedOn.to(1, { duration: clampDur(c, c.cue('ra-voting-baseline-0-2').start, 0.5) })),
  );
  c.on('ra-voting-baseline-1-1', () =>
    s.play(beamOn.to(1, { duration: clampDur(c, c.cue('ra-voting-baseline-1-1').start, 0.55) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const bl = blockedOn.value;
        const bm = beamOn.value;
        const nodes = [];

        // Top: Self-Consistency 5 votes (3 A vs 2 B)
        const yV = -165;
        nodes.push(
          txt('SELF-CONSISTENCY VOTE (5 ATTEMPTS)', -840, yV - 62, 26, ROLE.focus, 'mono', 'left'),
        );
        const votes = ['A', 'A', 'B', 'A', 'B'];
        votes.forEach((v, idx) => {
          const x = -720 + idx * 175;
          const isA = v === 'A';
          const col = isA ? (bl > 0.5 ? ROLE.fail : ROLE.warn) : ROLE.ok;
          nodes.push(
            rect(140, 62, { fill: '#0b1224', stroke: col, width: 2.8, radius: 10 })
              .at(x, yV)
              .glow(isA && bl > 0.5 ? 8 : 4, col),
            txt(`TRY ${idx + 1}: ${v}`, x, yV, 26, col, 'mono', 'center'),
          );
        });

        nodes.push(
          txt(
            bl > 0.5 ? 'WINNER: A (3-2) -> BLOCKED EDGE!' : 'MAJORITY: A = 3  |  B = 2',
            510,
            yV,
            28,
            bl > 0.5 ? ROLE.fail : ROLE.warn,
            'mono',
            'center',
          ),
          txt(
            'REPEATING A MISTAKE WINS THE VOTE  |  EXACT COMPATIBILITY CHECK MUST FILTER THE WINNER',
            0,
            yV + 78,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );

        // Bottom: Token Beam (committed to v2) vs Plan-Level Diversity (v2 shim + v1 patch)
        nodes.push(line([-860, -10], [840, -10], { stroke: '#233152', width: 2 }));
        const bAlpha = 0.3 + 0.7 * bm;

        nodes.push(
          txt('TOKEN BEAM (SAME COMMITMENT)', -840, 56, 28, ROLE.warn, 'mono', 'left').opacity(
            bAlpha,
          ),
          dotItem(-825, 128, '1. parser v2 -> retry timeout', ROLE.warn, { opacity: bAlpha }),
          dotItem(-825, 188, '2. parser v2 -> wrap exception', ROLE.warn, { opacity: bAlpha }),
          dotItem(-825, 248, '3. parser v2 -> fallback cache', ROLE.warn, { opacity: bAlpha }),
          txt('ALL 3 LOCKED INTO PARSER v2', -825, 326, 26, ROLE.fail, 'mono', 'left').opacity(
            bAlpha,
          ),
        );

        nodes.push(line([20, 44], [20, 354], { stroke: '#233152', width: 2 }).opacity(bAlpha));

        nodes.push(
          txt('PLAN-LEVEL ALTERNATIVES', 70, 56, 28, ROLE.ok, 'mono', 'left').opacity(bAlpha),
          dotItem(85, 138, 'PLAN 1: Add compatibility shim for v2', ROLE.agent, {
            opacity: bAlpha,
          }),
          dotItem(85, 212, 'PLAN 2: Keep parser v1 & patch sanitizer', ROLE.ok, {
            opacity: bAlpha,
          }),
          txt(
            'TWO GENUINELY DIFFERENT REPAIR STRATEGIES',
            85,
            326,
            26,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(bAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
