// Scene 12: self-consistency - Vote on proposals before any real effect
// Three sampled reasoning paths (Patch, Rollback, Patch) converging into a 2-to-1
// majority vote -> removing Vote 3 creates a 1-to-1 tie routed to review -> host
// approval gate + correlated stale-log warning.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function selfConsistency(s, c) {
  const pulse = s.value(0);
  const majOn = s.value(0);
  const tieOn = s.value(0);
  const revOn = s.value(0);
  const hostOn = s.value(0);
  const staleOn = s.value(0);

  const header = cinemaHeader(
    'SELF-CONSISTENCY VOTING',
    'Vote on proposals',
    'before any real effect',
    {
      accent: ROLE.policy,
      size: 48,
    },
  );

  const stageAura = aura(160, 40, 620, '#a78bfa1e', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const mj = majOn.value;
      const ti = tieOn.value;
      const rv = revOn.value;
      const hs = hostOn.value;
      const st = staleOn.value;
      const nodes = [];

      const voteYs = [-150, 20, 190];
      const voteLabels = ['PATCH', 'ROLLBACK', 'PATCH'];
      const voteCols = [ROLE.ok, ROLE.action, ROLE.ok];
      const tallyPt = [110, 20];
      const hostPt = [600, 20];

      voteYs.forEach((vy, i) => {
        const drop3 = i === 2 && ti > 0.45 && st < 0.35;
        const alpha = drop3 ? 0.2 : 1;
        const col = st > 0.35 ? ROLE.fail : voteCols[i];
        nodes.push(
          orbNode(-640, vy, `P${i + 1}`, col, { radius: 44, opacity: alpha }),
          txt(
            st > 0.35 ? 'STALE -> WRONG' : voteLabels[i],
            -565,
            vy,
            26,
            col,
            'mono',
            'left',
          ).opacity(alpha),
          beamWithPhotons(
            quadArcPts([-240, vy], [tallyPt[0] - 96, tallyPt[1]], (i - 1) * 18),
            col,
            p * 1.1 + i * 0.3,
            {
              alpha,
              width: 3.2,
            },
          ),
        );
      });

      const isTie = ti > 0.45 && st < 0.35;
      const tallyCol = st > 0.35 ? ROLE.fail : isTie ? ROLE.caution : ROLE.ok;
      const tallyText = st > 0.35 ? '3/3 BAD' : isTie ? '1 : 1' : mj > 0.3 ? '2 / 3' : 'TALLY';
      const tallySub =
        st > 0.35 ? 'Shared stale evidence' : isTie ? 'Needs review' : 'Patch majority';

      nodes.push(
        orbNode(tallyPt[0], tallyPt[1], tallyText, tallyCol, { radius: 76, sub: tallySub }),
        beamWithPhotons(
          [
            [tallyPt[0] + 98, tallyPt[1]],
            [hostPt[0] - 78, hostPt[1]],
          ],
          hs > 0.3 ? ROLE.host : '#2f406b',
          p * 1.1 + 0.5,
          { alpha: 0.35 + hs * 0.65, width: 3.4 },
        ),
        orbNode(hostPt[0], hostPt[1], 'HOST', ROLE.host, {
          radius: 64,
          sub: hs > 0.3 ? 'Checks auth + op_id' : 'Sandbox / read-only',
          opacity: 0.4 + hs * 0.6,
        }),
      );

      nodes.push(
        line([-840, 315], [840, 315], { stroke: '#25355a', width: 2 }).opacity(0.6),
        txt(
          st > 0.35
            ? 'COMPARE VOTING VS SINGLE RUN AT EQUAL TOTAL MODEL & TOOL BUDGET'
            : rv > 0.35
              ? 'NO STRICT MAJORITY -> ROUTE TO HUMAN REVIEW'
              : 'Sample isolated read-only paths before touching external state',
          0,
          368,
          26,
          st > 0.35 ? ROLE.fail : rv > 0.35 ? ROLE.caution : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('aa-self-consistency-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-self-consistency-0').start, 0.25) }));
  });
  c.on('vote-majority', () => {
    s.play(majOn.to(1, { duration: clampDur(c, c.cue('vote-majority').start, 0.35) }));
  });
  c.on('vote-tie', () => {
    s.play(tieOn.to(1, { duration: clampDur(c, c.cue('vote-tie').start, 0.35) }));
  });
  c.on('vote-review', () => {
    s.play(revOn.to(1, { duration: clampDur(c, c.cue('vote-review').start, 0.35) }));
  });
  c.on('aa-self-consistency-1', () => {
    s.play(hostOn.to(1, { duration: clampDur(c, c.cue('aa-self-consistency-1').start, 0.35) }));
  });
  c.on('aa-self-consistency-2', () => {
    s.play(staleOn.to(1, { duration: clampDur(c, c.cue('aa-self-consistency-2').start, 0.35) }));
  });
}
