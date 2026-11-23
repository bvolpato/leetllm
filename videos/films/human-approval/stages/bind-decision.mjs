import { PROPOSAL } from '../fixtures.mjs';
import { digest } from '../model.mjs';
import { cueClock, footer, trafficStrip } from '../routing.mjs';

function packet(ctx, api, x, label, proposal, showDigest, color) {
  const { C } = api;
  api.text(ctx, label, x, 305, 48, color, 'left', 'serif');
  api.text(
    ctx,
    'Tenant ' + proposal.tenant + '   /   version ' + proposal.version,
    x,
    372,
    32,
    C.muted,
  );
  api.text(ctx, 'Reranker v17  ·  shadow → canary', x, 461, 35, C.ink);
  api.text(ctx, 'Target share', x, 532, 32, C.muted);
  api.text(ctx, proposal.trafficPercent + '%', x + 765, 536, 52, color, 'right');
  trafficStrip(ctx, api, x, 566, 770, proposal.trafficPercent, color);
  api.text(ctx, 'Requires revision ' + proposal.revision, x, 709, 35, C.ink);
  api.text(ctx, proposal.evidence.join('   /   '), x, 765, 30, C.muted);
  if (showDigest)
    api.text(
      ctx,
      'Digest ' + digest(proposal).slice(0, 12) + '…',
      x,
      849,
      31,
      color,
      'left',
      'mono',
    );
}

export function drawBindDecision(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const saved = cue('bind-save').phase === 'after';
  const clicked = cue('bind-click').phase === 'after';
  const eligible = cue('bind-eligible').phase === 'after';
  const changed = cue('bind-edit').phase === 'after';
  const working = changed ? { ...PROPOSAL, trafficPercent: 10 } : PROPOSAL;
  const visible = cue('bind-worker').phase !== 'before';
  const compared = cue('bind-reject').phase === 'after';
  api.focus.target('stored', () =>
    packet(
      ctx,
      api,
      110,
      'Stable proposal packet · ' + PROPOSAL.operationId,
      PROPOSAL,
      cue('bind-hash').phase === 'after',
      C.yellow,
    ),
  );
  api.focus.target('working', () => {
    if (visible) packet(ctx, api, 1040, 'Working copy', working, !changed || compared, C.blue);
  });
  api.focus.target('decision', () => {
    if (!clicked) {
      if (cue('bind-click').phase === 'during')
        api.text(ctx, 'Casey’s review session', 110, 914, 35, C.yellow);
      return;
    }
    api.text(
      ctx,
      saved ? 'Casey · approve · saved' : 'Casey · approve',
      110,
      914,
      35,
      saved ? C.green : C.yellow,
    );
    if (!visible) {
      const status = saved
        ? 'Eligible reviewer · immutable decision stored'
        : eligible
          ? 'Eligible reviewer · saving'
          : 'Pending save';
      api.text(ctx, status, 1040, 914, 33, saved ? C.green : C.muted);
    }
  });
  api.focus.target('comparison', () => {
    if (compared) {
      const match = digest(PROPOSAL) === digest(working);
      footer(
        ctx,
        api,
        match
          ? 'The full digests match.'
          : 'The full digests differ. Submit the edited packet for review.',
        match ? C.green : C.pink,
      );
    } else if (changed)
      footer(ctx, api, 'Does the saved decision cover this smaller canary?', C.yellow);
    else if (visible) footer(ctx, api, 'The full digests match.', C.green);
  });
}
export default {
  id: 'bind-decision',
  draw: drawBindDecision,
  cues: [
    'bind-evidence',
    'bind-hash',
    'bind-click',
    'bind-eligible',
    'bind-save',
    'bind-worker',
    'bind-edit',
    'bind-ask',
    'bind-reject',
  ],
};
