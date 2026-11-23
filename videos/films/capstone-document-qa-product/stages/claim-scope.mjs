import { LAB_POLICY } from '../fixtures.mjs';

const approvalRule = LAB_POLICY.split('. ')[1];
const claims = [
  { text: 'Privileged access needs approval.', cue: 'claim-supported', supported: true },
  { text: 'Ordinary access needs approval too.', cue: 'claim-unsupported', supported: false },
];

function bracket(ctx, api, left, right, y, color) {
  api.path(
    ctx,
    [
      { x: left, y: y - 16 },
      { x: left, y },
      { x: right, y },
      { x: right, y: y - 16 },
    ],
    { color, width: 6 },
  );
}

function showScope(ctx, api, p) {
  const { C } = api;
  const left = 162;
  const privilegedEnd = 820;
  const ordinaryEnd = 1758;
  api.text(ctx, 'Privileged access', left, 507, 53, C.ink, 'left', 'serif');
  api.text(ctx, 'Ordinary access', 1095, 507, 53, C.ink, 'left', 'serif');
  const source = p('claim-source-scope');
  if (source > 0) {
    bracket(ctx, api, left, api.lerp(left, privilegedEnd, source), 554, C.blue);
    api.text(ctx, 'Covered by the policy sentence', left, 623, 33, C.blue);
  }
  const broaden = p('claim-broaden');
  if (broaden > 0) {
    bracket(ctx, api, left, api.lerp(privilegedEnd, ordinaryEnd, broaden), 708, C.yellow);
    api.text(ctx, 'Draft answer', left, 774, 30, C.yellow);
    api.text(
      ctx,
      '“All restores require manager approval.”',
      left,
      839,
      45,
      C.ink,
      'left',
      'serif',
    );
  }
  if (p('scope-broadening') === 1)
    api.text(ctx, 'The policy leaves ordinary access open.', left, 953, 39, C.pink);
}

function checkDraft(ctx, api, p) {
  const { C } = api;
  const left = 162;
  api.text(ctx, 'Caller’s question', left, 445, 30, C.muted);
  api.text(
    ctx,
    'Does ordinary access need manager approval?',
    left,
    515,
    50,
    p('claim-repair') > 0 ? C.yellow : C.ink,
    'left',
    'serif',
  );
  const removed = p('claim-drop-advice') === 1;
  api.text(ctx, 'Draft claims', left, 591, 30, C.muted);
  claims.forEach((claim, i) => {
    if (!claim.supported && removed) return;
    const y = 652 + i * 96;
    api.text(ctx, claim.text, left, y, 41, C.ink);
    if (p(claim.cue) === 1)
      api.text(
        ctx,
        claim.supported ? 'Supported by the policy' : 'No supporting words',
        1150,
        y,
        36,
        claim.supported ? C.green : C.pink,
      );
  });
  if (p('claim-abstain') === 1) {
    api.text(
      ctx,
      'Abstain on the ordinary-access question.',
      left,
      943,
      46,
      C.pink,
      'left',
      'serif',
    );
  } else if (!removed && p('claim-factscore') === 1) {
    const supported = claims.filter((claim) => claim.supported).length;
    api.text(
      ctx,
      supported + ' of ' + claims.length + ' draft claims supported',
      left,
      934,
      48,
      C.blue,
    );
  }
}

export function drawClaimScope(ctx, scene, state, api) {
  const { C, focus } = api;
  api.focus.target('claim-scope-mechanism', () => {
    api.text(ctx, 'Access policy', 162, 265, 30, C.blue);
    api.text(ctx, '“' + approvalRule + '”', 162, 337, 44, C.ink, 'left', 'serif');
    api.line(ctx, 162, 379, 1758, 379, C.blue, 3);
    const progress = (id) => focus.progress(id, 0);
    if (state.beat === 0) showScope(ctx, api, progress);
    else checkDraft(ctx, api, progress);
  });
}

export default {
  id: 'claim-scope',
  draw: drawClaimScope,
  cues: [
    'claim-source-scope',
    'claim-broaden',
    'scope-broadening',
    'claim-atomic',
    'claim-supported',
    'claim-unsupported',
    'claim-factscore',
    'claim-drop-advice',
    'claim-repair',
    'claim-abstain',
  ],
};
