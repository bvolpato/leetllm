import { PROPOSAL, RELEASE_WINDOW } from '../fixtures.mjs';
import { envelopeFixture } from '../model.mjs';
import { cueClock, footer, trafficStrip } from '../routing.mjs';

export function drawSerializationCard(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const done = (id) => cue(id).phase === 'after';
  api.focus.target('serialization-card-mechanism', () => {
    if (state.beat === 0) {
      const original = envelopeFixture();
      const caller = envelopeFixture(done('intent-copy') ? 10 : 25);
      [original, caller].forEach((packet, index) => {
        const x = index ? 1040 : 110;
        const color = index ? C.blue : C.yellow;
        const field = packet.value;
        api.text(
          ctx,
          index ? 'Caller’s editable copy' : 'Owned review snapshot',
          x,
          327,
          46,
          color,
          'left',
          'serif',
        );
        api.text(ctx, field.resource + '    /    ' + field.tenant, x, 425, 37, C.ink);
        api.text(ctx, 'arguments.trafficPercent', x, 526, 31, C.muted, 'left', 'mono');
        api.text(ctx, String(field.arguments.trafficPercent), x + 765, 530, 55, color, 'right');
        trafficStrip(ctx, api, x, 563, 770, field.arguments.trafficPercent, color);
        api.text(ctx, 'Required revision ' + field.preconditions.generation, x, 719, 35, C.ink);
        if (done('intent-envelope') && (!index || !done('intent-copy') || done('intent-different')))
          api.text(ctx, packet.digest.slice(0, 12) + '…', x, 828, 38, color, 'left', 'mono');
      });
      footer(ctx, api, 'The stored snapshot owns its arguments and evidence references.');
    } else if (state.beat === 1) {
      api.text(ctx, 'One validated envelope', 110, 320, 47, C.ink, 'left', 'serif');
      api.text(ctx, 'schema 1   /   local-json-v1', 110, 395, 32, C.muted, 'left', 'mono');
      api.text(ctx, 'Serialized field', 120, 558, 34, C.muted);
      api.text(ctx, '"trafficPercent":25', 120, 665, 55, C.yellow, 'left', 'mono');
      api.arrow(ctx, 820, 639, 1075, 639, C.muted, 4);
      api.text(ctx, 'SHA-256 of all fields', 1150, 558, 34, C.muted);
      api.text(
        ctx,
        envelopeFixture().digest.slice(0, 12) + '…',
        1150,
        663,
        43,
        C.yellow,
        'left',
        'mono',
      );
      footer(
        ctx,
        api,
        done('intent-protected')
          ? 'The protected record links Casey to this digest.'
          : 'Both services need the same serialization rules.',
      );
    } else {
      api.text(ctx, 'Release · host record', 110, 322, 46, C.yellow, 'left', 'serif');
      api.text(ctx, 'Reranker v17    0% → 25%', 110, 421, 45, C.ink);
      api.text(ctx, 'Tenant platform   /   revision ' + PROPOSAL.revision, 110, 503, 33, C.ink);
      api.text(ctx, 'Live promotion requires a release manager', 110, 578, 31, C.ink);
      api.text(ctx, 'Review before tick ' + RELEASE_WINDOW.reviewBefore, 110, 669, 31, C.muted);
      api.text(ctx, 'Dispatch before tick ' + RELEASE_WINDOW.executeBefore, 110, 728, 31, C.muted);
      api.line(ctx, 955, 268, 955, 812, C.muted, 2);
      api.text(ctx, 'Ticket · external evidence', 1030, 322, 45, C.blue, 'left', 'serif');
      api.text(ctx, '“The evaluation looks ready.”', 1030, 453, 40, C.ink);
      api.text(ctx, 'Source: release ticket', 1030, 548, 32, C.muted);
      if (done('intent-escape')) api.text(ctx, 'Displayed as quoted text', 1030, 674, 32, C.blue);
      footer(
        ctx,
        api,
        done('intent-backend')
          ? 'Approve, reject or edit → authenticated decision service'
          : 'Casey can open the evaluation before deciding.',
        C.yellow,
      );
    }
  });
}
export default {
  id: 'serialization-card',
  draw: drawSerializationCard,
  cues: [
    'intent-envelope',
    'intent-copy',
    'intent-different',
    'intent-bytes',
    'intent-protected',
    'intent-escape',
    'intent-backend',
  ],
};
