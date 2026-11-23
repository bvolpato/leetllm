import { cueProgress } from '../arithmetic.mjs';
import { OBSERVATION_CUES } from '../fixtures.mjs';
import { observationSnapshot } from '../construction.mjs';
import { authorize } from '../model.mjs';
import { card, code, text, visualFocus } from '../defaults.mjs';
export function drawObservationLoop(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  {
    const s = observationSnapshot(beat, progress2, state.cues),
      rowOne = 330,
      rowTwo = 650;
    const model = visualFocus(ctx, api, 'observation-loop-object-model-turn-1-11', () =>
        card(ctx, api, 'Model turn 1', 120, rowOne, 330, themeColors.blue, 105),
      ),
      call = visualFocus(ctx, api, 'observation-loop-object-lookup-book-b7-12', () =>
        card(ctx, api, 'lookup book B7', 650, rowOne, 390, themeColors.cyan, 105),
      ),
      service = visualFocus(ctx, api, 'observation-loop-object-library-service-13', () =>
        card(ctx, api, 'Library service', 1340, rowOne, 390, themeColors.green, 105),
      );
    code(ctx, api, 'call_id: read-7', 845, 545, 28, themeColors.yellow, 'center');
    const connect = (from, to, color, progress = null) => {
      const r = api.connect(ctx, from, to, {
        color,
        gap: 18,
        width: 3,
      });
      if (progress !== null)
        components.particle({
          points: [r.from, r.to],
          progress,
          fill: color,
          radius: 9,
        });
    };
    connect(model, call, themeColors.blue, beat === 0 ? phase(progress2, 0, 0.12) : null);
    if (beat > 0 || progress2 >= 0.12)
      connect(
        call,
        service,
        themeColors.cyan,
        beat === 0 ? phase(progress2, 0.12, OBSERVATION_CUES.result) : null,
      );
    let result = null,
      observation = null,
      next = null;
    if (s.resultReceived) {
      const resultLabel = `${s.visibleResult.available_copies} copies available`;
      result = visualFocus(ctx, api, 'observation-returned-count', () =>
        card(ctx, api, resultLabel, 1340, rowTwo, 390, themeColors.green, 105),
      );
      connect(
        service,
        result,
        themeColors.green,
        beat === 0
          ? cueProgress(
              state.cues,
              'observation-receive-count',
              phase(progress2, OBSERVATION_CUES.result, OBSERVATION_CUES.result + 0.12),
            )
          : null,
      );
    }
    if (s.linkStarted) {
      observation = visualFocus(ctx, api, 'observation-linked-record', () =>
        card(
          ctx,
          api,
          s.resultAdmitted ? 'Accepted read-7\nB7 · 3 copies' : 'Matching call ID\nread-7',
          650,
          rowTwo,
          390,
          s.resultAdmitted ? themeColors.green : themeColors.yellow,
          105,
          29,
        ),
      );
      if (result)
        connect(
          result,
          observation,
          themeColors.yellow,
          beat === 0 ? phase(progress2, OBSERVATION_CUES.linkStart, OBSERVATION_CUES.linked) : null,
        );
    }
    if (beat > 0 && observation) {
      next = visualFocus(ctx, api, 'observation-model-turn-two', () =>
        card(ctx, api, 'Model turn 2', 120, rowTwo, 330, themeColors.cyan, 105),
      );
      connect(
        observation,
        next,
        themeColors.cyan,
        beat === 1 ? phase(progress2, 0, OBSERVATION_CUES.answer) : null,
      );
    }
    if (beat > 0 && s.answerVisible) {
      visualFocus(ctx, api, 'observation-evidence-answer', () =>
        card(ctx, api, s.visibleAnswer, 610, 565, 700, themeColors.cyan, 65, 28),
      );
      [
        ['transport', 'Transport\n' + s.visibleObservation.transport],
        ['business-result', 'Available\n' + s.visibleObservation.available_copies + ' copies'],
        ['source', 'Source\n' + s.visibleObservation.source],
        ['retrieval-time', 'Retrieved\n' + s.visibleObservation.retrieved],
      ].forEach(([id, label], i) =>
        visualFocus(ctx, api, 'observation-' + id, () =>
          card(ctx, api, label, 130 + 420 * i, 925, 390, themeColors.cyan, 85, 23),
        ),
      );
    }
    if (beat === 0) {
      const note = !s.resultReceived
        ? 'The lookup is still in flight'
        : !s.resultAdmitted
          ? 'Service data arrived; the runtime checks its call ID'
          : `Admitted result for ${s.visibleObservation.call_id}`;
      text(
        ctx,
        api,
        note,
        960,
        590,
        28,
        s.resultAdmitted ? themeColors.green : themeColors.yellow,
        'center',
      );
      {
      }
    } else if (beat === 1) {
      if (!s.answerVisible)
        text(
          ctx,
          api,
          'The second turn reads the linked result before answering',
          960,
          880,
          30,
          themeColors.yellow,
          'center',
        );
      {
      }
    } else {
      const descriptionProgress = OBSERVATION_CUES.description,
        proposalProgress = OBSERVATION_CUES.proposal,
        policyProgress = OBSERVATION_CUES.policy;
      const allowed = authorize(
        {
          reader: 'lena',
        },
        'hold',
        'B7',
      );
      let description = null,
        proposal = null,
        policy = null;
      if (
        state.cues?.['observation-untrusted-description']
          ? state.cues['observation-untrusted-description'].phase !== 'before'
          : progress2 >= descriptionProgress
      )
        description = visualFocus(ctx, api, 'observation-book-description', () =>
          card(
            ctx,
            api,
            `Book text · “${s.visibleObservation.description.toLowerCase()}”`,
            125,
            815,
            500,
            themeColors.yellow,
            92,
            26,
          ),
        );
      if (
        state.cues?.['observation-write-proposal']
          ? state.cues['observation-write-proposal'].phase !== 'before'
          : progress2 >= proposalProgress
      )
        proposal = visualFocus(
          ctx,
          api,
          'observation-loop-object-model-proposal-place-hold-on-b7-21',
          () =>
            card(
              ctx,
              api,
              'Model proposal · place hold on B7',
              710,
              815,
              500,
              themeColors.cyan,
              92,
              25,
            ),
        );
      if (
        state.cues?.['observation-policy-gate']
          ? state.cues['observation-policy-gate'].phase !== 'before'
          : progress2 >= policyProgress
      )
        policy = visualFocus(
          ctx,
          api,
          'observation-loop-object-allowed-trusted-grant-allowed-denied-trusted-grant-22',
          () =>
            card(
              ctx,
              api,
              allowed ? 'Trusted grant · allowed' : 'Denied · trusted grant missing',
              1295,
              815,
              500,
              allowed ? themeColors.green : themeColors.pink,
              92,
              25,
            ),
        );
      if (description && proposal)
        connect(
          description,
          proposal,
          themeColors.cyan,
          phase(progress2, descriptionProgress, proposalProgress),
        );
      if (proposal && policy)
        connect(
          proposal,
          policy,
          allowed ? themeColors.green : themeColors.pink,
          phase(progress2, proposalProgress, policyProgress),
        );
      {
      }
    }
  }
}
export default {
  id: 'observation-loop',
  draw: drawObservationLoop,
  cues: [
    'observation-loop-beat-1-focus-1',
    'observation-receive-count',
    'observation-record-outcome',
    'observation-attach-call-id',
    'observation-loop-beat-2-focus-1',
    'observation-loop-beat-2-focus-2',
    'observation-untrusted-description',
    'observation-write-proposal',
    'observation-policy-gate',
  ],
};
