// Scene 26: lost-reply - An unknown reply does not erase an accepted effect
// Living Idempotency Ledger Circuit: op-17 creates RB2041 in service ledger while return
// reply drops mid-flight -> same-key retry returns replay RB2041 -> reusing op-17 for
// R2099 triggers a rose conflict -> final proposal count stays strictly 1!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  orbNode,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function lostReply(s, c) {
  const pulse = s.value(0);
  const createdOn = s.value(0);
  const lostOn = s.value(0);
  const replayOn = s.value(0);
  const changeOn = s.value(0);
  const conflictOn = s.value(0);
  const countOneOn = s.value(0);
  const prodRuleOn = s.value(0);

  const header = cinemaHeader(
    'IDEMPOTENT RETRY LEDGER',
    'A lost reply does not',
    'erase an accepted effect',
    {
      accent: ROLE.focus,
      size: 48,
    },
  );

  const stageAura = aura(160, 40, 620, '#ffd1661c', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const cr = createdOn.value;
      const ls = lostOn.value;
      const rp = replayOn.value;
      const ch = changeOn.value;
      const cf = conflictOn.value;
      const c1 = countOneOn.value;
      const pr = prodRuleOn.value;
      const nodes = [];

      const callerPt = [-600, 0];
      const ledgerPt = [160, 0];
      const countPt = [640, 0];

      // Outbound request beam (caller -> ledger)
      const outCol = cf > 0.35 ? ROLE.fail : rp > 0.35 ? ROLE.ok : ROLE.action;
      const outLabel =
        cf > 0.35
          ? 'op-17 + R2099 -> MISMATCH CONFLICT!'
          : ch > 0.35
            ? 'Reuse op-17 with R2099...'
            : rp > 0.35
              ? 'Retry op-17 + R1842 -> REPLAY RB2041'
              : 'Send op-17 (R1842 rollback proposal)';

      nodes.push(
        txt(outLabel, -220, -145, 28, outCol, 'mono', 'center').glow(6, outCol),
        beamWithPhotons(
          quadArcPts(
            [callerPt[0] + 66, callerPt[1] - 25],
            [ledgerPt[0] - 78, ledgerPt[1] - 25],
            -75,
          ),
          outCol,
          p * 1.1,
          {
            width: 3.8,
          },
        ),
        orbNode(callerPt[0], callerPt[1], 'CALLER', ROLE.host, {
          radius: 60,
          sub: ls > 0.35 && rp < 0.35 ? 'Outcome: UNKNOWN' : 'Checks auth every call',
        }),
        orbNode(
          ledgerPt[0],
          ledgerPt[1],
          cr > 0.35 ? 'RB2041' : 'LEDGER',
          cr > 0.35 ? ROLE.ok : ROLE.plan,
          {
            radius: 70,
            sub: cr > 0.35 ? 'key=op-17 · R1842' : 'Proposal ledger',
          },
        ),
        beamWithPhotons(
          [
            [ledgerPt[0] + 76, ledgerPt[1]],
            [countPt[0] - 66, countPt[1]],
          ],
          ROLE.ok,
          p * 0.9,
          { alpha: 0.4 + cr * 0.6, width: 3.2 },
        ),
        orbNode(
          countPt[0],
          countPt[1],
          cr > 0.35 ? 'COUNT: 1' : 'COUNT: 0',
          cr > 0.35 ? ROLE.ok : COSMOS.dim,
          {
            radius: 60,
            sub: c1 > 0.35 ? 'Strictly 1 proposal!' : 'Durable state',
          },
        ),
      );

      // Return reply arc (breaks mid-flight when lost, heals emerald on replay!)
      if (ls > 0.05 && rp < 0.35) {
        nodes.push(
          beamWithPhotons(quadArcPts([ledgerPt[0] - 76, 28], [-190, 95], 35), ROLE.fail, p * 1.3, {
            alpha: ls,
            width: 3.6,
          }),
          txt('REPLY LOST IN TRANSIT!', -220, 155, 28, ROLE.fail, 'mono', 'center')
            .glow(8, ROLE.fail)
            .opacity(ls),
        );
      } else if (rp > 0.35) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([ledgerPt[0] - 76, 28], [callerPt[0] + 66, 28], 95),
            cf > 0.35 ? ROLE.fail : ROLE.ok,
            p * 1.2 + 0.5,
            { width: 3.8 },
          ),
          txt(
            cf > 0.35
              ? 'CONFLICT REJECTED · RB2041 UNCHANGED'
              : 'REPLAY RETURNS RB2041 (NO DUPLICATE)',
            -220,
            165,
            28,
            cf > 0.35 ? ROLE.fail : ROLE.ok,
            'mono',
            'center',
          ).glow(7, cf > 0.35 ? ROLE.fail : ROLE.ok),
        );
      }

      nodes.push(
        line([-840, 290], [840, 290], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          pr > 0.35
            ? 'BIND ACTOR + FULL PAYLOAD ATOMICALLY · RECONCILE IF DEDUP EXPIRED'
            : 'Authorization is verified on every request, including replays',
          0,
          350,
          26,
          pr > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-lost-reply-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-lost-reply-0').start, 0.25) }));
  });
  c.on('proposal-create', () => {
    s.play(createdOn.to(1, { duration: clampDur(c, c.cue('proposal-create').start, 0.35) }));
  });
  c.on('proposal-lost', () => {
    s.play(lostOn.to(1, { duration: clampDur(c, c.cue('proposal-lost').start, 0.35) }));
  });
  c.on('aa-lost-reply-1', () => {
    s.play(replayOn.to(0.5, { duration: clampDur(c, c.cue('aa-lost-reply-1').start, 0.25) }));
  });
  c.on('proposal-replay', () => {
    s.play(replayOn.to(1, { duration: clampDur(c, c.cue('proposal-replay').start, 0.35) }));
  });
  c.on('proposal-change-input', () => {
    s.play(changeOn.to(1, { duration: clampDur(c, c.cue('proposal-change-input').start, 0.35) }));
  });
  c.on('proposal-conflict', () => {
    s.play(conflictOn.to(1, { duration: clampDur(c, c.cue('proposal-conflict').start, 0.35) }));
  });
  c.on('proposal-count', () => {
    s.play(countOneOn.to(1, { duration: clampDur(c, c.cue('proposal-count').start, 0.35) }));
  });
  c.on('aa-lost-reply-2', () => {
    s.play(prodRuleOn.to(1, { duration: clampDur(c, c.cue('aa-lost-reply-2').start, 0.35) }));
  });
}
