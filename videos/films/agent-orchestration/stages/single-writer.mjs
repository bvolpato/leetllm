import { RECEIPTS, REQUEST } from '../fixtures.mjs';
import { canWrite, proposal, reconciled, reconciledEffects, recordedEffects } from '../model.mjs';
import { cell, focusTarget, graphText, receiptCard, requestIdentity, text } from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching, phase } = api,
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = phase(progress, 0.05, 0.88);
  {
    const approved = beat > 0 || api.focus.progress('exact-approval', 0) > 0,
      version = beat === 2 ? 4 : 3,
      live = beat === 1 && api.focus.progress('live-revision-change', q) > 0.35 ? 4 : version;
    const packet = proposal(
        RECEIPTS.map((receipt) => ({
          ...receipt,
          version,
        })),
        {
          ...REQUEST,
          version,
        },
      ),
      permitted = canWrite(
        {
          ...packet,
          approved,
        },
        live,
        packet,
      );
    const written =
        beat === 2 && api.focus.progress('write-reply-lost', phase(progress, 0.1, 0.4)) > 0,
      recovered =
        beat === 2 && api.focus.progress('reconcile-operation', phase(progress, 0.65, 0.8)) >= 1;
    teaching.flowGraph({
      nodes: [
        {
          id: 'packet',
          focusTarget: 'exact-proposal',
          label: 'r17 · v' + version + ' · traffic 25%',
          x: 170,
          y: 420,
          width: 470,
          height: 110,
          color: themeColors.blue,
        },
        {
          id: 'approve',
          focusTarget: 'proposal-approval',
          label:
            beat === 2 ? 'Fresh v4 approval' : approved ? 'Exact v3 approval' : 'Review pending',
          x: 835,
          y: 420,
          width: 360,
          height: 110,
          color: approved ? themeColors.green : themeColors.yellow,
        },
        {
          id: 'writer',
          focusTarget: 'guarded-writer',
          label:
            live !== version
              ? 'Version changed: stop'
              : beat === 2
                ? written
                  ? 'One change recorded'
                  : 'Write waiting'
                : approved
                  ? 'Execution recheck'
                  : 'Effect unchanged',
          x: 1390,
          y: 420,
          width: 390,
          height: 110,
          color:
            live !== version ? themeColors.pink : written ? themeColors.green : themeColors.muted,
        },
      ],
      edges: [
        {
          from: 'packet',
          to: 'approve',
        },
        {
          from: 'approve',
          to: 'writer',
          color: live !== version ? themeColors.pink : themeColors.green,
        },
      ],
    });
    focusTarget(ctx, api, 'proposal-evidence', () =>
      graphText(
        ctx,
        api,
        'Request ' + packet.request + ' · evidence ' + packet.evidenceDigest.slice(0, 12),
        960,
        600,
        28,
        themeColors.muted,
        'center',
      ),
    );
    focusTarget(ctx, api, 'live-revision-check', () =>
      graphText(
        ctx,
        api,
        'Live revision ' + live + ' · proposal revision ' + version,
        960,
        665,
        36,
        live !== version ? themeColors.pink : themeColors.green,
        'center',
      ),
    );
    if (beat === 2) {
      const effects = written ? (recovered ? reconciledEffects : recordedEffects) : 0;
      const lost = focusTarget(ctx, api, 'operation-receipt', () =>
          receiptCard(
            ctx,
            api,
            api.focus.progress('write-reply-lost', progress) < 1
              ? 'op-18: ' + (written ? 'reply pending' : 'write pending')
              : 'op-18: reply lost',
            180,
            760,
            590,
            themeColors.yellow,
            95,
          ),
        ),
        result = focusTarget(ctx, api, 'effect-reconciliation', () =>
          receiptCard(
            ctx,
            api,
            recovered ? 'Reconciled: ' + reconciled.change : 'Outcome not yet reconciled',
            1140,
            760,
            610,
            recovered ? themeColors.green : themeColors.yellow,
            95,
          ),
        );
      api.connect(ctx, lost, result, {
        color: recovered ? themeColors.green : themeColors.muted,
        gap: 42,
        width: 3,
      });
      focusTarget(ctx, api, 'effect-reconciliation', () =>
        graphText(
          ctx,
          api,
          'Recorded effects: ' + effects,
          960,
          895,
          29,
          themeColors.muted,
          'center',
        ),
      );
    }
  }
}
export function drawSingleWriter(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const custom = currentBeat === 3;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {
    requestIdentity(ctx, api, 4);
    const expired = q(3) > 0.5;
    text(
      ctx,
      api,
      'Same proposed effect · approval binds exact current packet',
      960,
      370,
      34,
      themeColors.yellow,
      'center',
    );
    const fields = [
      'tenant7 / release-17 / r17/v4',
      'traffic 25% / evidence digest a91…',
      'policy P3 / expires 1060',
    ];
    fields.forEach((v, i) =>
      cell(
        ctx,
        api,
        v,
        350,
        440 + i * 135,
        1220,
        i === 2 && expired ? themeColors.pink : themeColors.blue,
      ),
    );
    text(
      ctx,
      api,
      expired
        ? 'now 1090: approval expired → STOP'
        : 'now 1000: check permission and live dependencies',
      960,
      910,
      37,
      expired ? themeColors.pink : themeColors.green,
      'center',
    );
    text(
      ctx,
      api,
      'Atomic target preconditions + durable dedup need destination evidence',
      960,
      1020,
      31,
      themeColors.yellow,
      'center',
    );
  };
  api.focus.target('single-writer-construction', body);
}
export default {
  id: 'single-writer',
  draw: drawSingleWriter,
  cues: [
    'concrete-proposal',
    'exact-approval',
    'writer-rechecks',
    'live-revision-change',
    'fresh-approval',
    'write-reply-lost',
    'reconcile-operation',
    'single-writer-construct-3',
  ],
};
