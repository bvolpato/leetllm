import { after, decision, ledger, river, runHolds } from '../circulation.mjs';

function comparison(ctx, api, x, keys, offered, dispatch, received, observed, graded) {
  const { C } = api;
  const second = keys[1];
  const run = runHolds(river, received ? keys : keys.slice(0, 1));
  const sent = dispatch > 0 || received;
  const count = sent ? '2 write dispatches' : '1 write dispatch';
  let status = 'reply lost';
  if (sent) status = 'awaiting reply';
  if (received) status = run.attempts[1].replay ? 'saved receipt' : 'new receipt';
  if (graded) {
    const holds = run.read.count === 1 ? 'hold' : 'holds';
    status = run.read.count + ' ' + holds + (run.passed ? ' · pass' : ' · fail');
  }
  api.text(
    ctx,
    second === 'op-17' ? 'Reuse the key' : 'Issue a new key',
    x,
    277,
    41,
    C.ink,
    'left',
    'serif',
  );
  api.text(ctx, 'First write   op-17', x, 345, 34, C.muted);
  api.text(
    ctx,
    (sent ? 'Second write   ' : 'Proposed retry   ') + (offered ? second : '?'),
    x,
    408,
    40,
    C.yellow,
  );
  if (sent && !received) {
    api.line(ctx, x, 435, x + 730, 435, C.muted, 2);
    api.circle(ctx, x + 730 * dispatch, 435, 9, C.yellow);
  }
  ledger(ctx, api, {
    x,
    y: 455,
    w: 740,
    task: river,
    account: run.account,
    heading: observed ? 'Independent account read' : 'Library backend',
    showKeys: true,
    summary: count + '   ·   ' + status,
    accent: graded ? (run.passed ? C.green : C.pink) : C.muted,
  });
}

export default {
  id: 'recovery',
  cues: [
    'retry-read',
    'read-observation',
    'lost-reply',
    'uncertain-write',
    'choose-keys',
    'offer-new-key',
    'send-same',
    'reconcile-id',
    'send-new',
    'new-key-risk',
    'inspect-retries',
    'recovery-contract',
    'recovery-probes',
  ],
  draw(ctx, scene, state, api) {
    const { C, focus } = api;
    if (state.beat === 0) {
      focus.target('read-path', () => {
        api.text(ctx, 'Catalog read', 160, 300, 42, C.blue, 'left', 'serif');
        api.text(ctx, 'Dispatch 1', 160, 418, 34, C.muted);
        api.text(ctx, 'Timeout', 160, 490, 50, C.yellow);
        if (focus.visible('retry-read')) {
          api.text(ctx, 'Dispatch 2', 682, 418, 34, C.muted);
          api.text(
            ctx,
            after(state, 'read-observation') ? 'B7 returned' : 'Retry lookup',
            682,
            490,
            50,
            C.blue,
          );
        }
      });
      focus.target('write-path', () => {
        api.line(ctx, 160, 555, 1720, 555, '#344451', 3);
        api.text(ctx, 'Hold request', 160, 663, 42, C.cyan, 'left', 'serif');
        api.text(ctx, 'op-17', 160, 772, 50, C.ink);
        if (focus.visible('lost-reply')) api.text(ctx, 'Reply lost', 682, 772, 50, C.yellow);
        if (focus.visible('uncertain-write')) api.text(ctx, 'Did it commit?', 1240, 772, 48, C.ink);
      });
      return;
    }
    const sentSame = after(state, 'reconcile-id');
    const sentNew = after(state, 'new-key-risk');
    const read = after(state, 'inspect-retries'),
      graded = after(state, 'recovery-contract');
    focus.target('same-key', () =>
      comparison(
        ctx,
        api,
        150,
        ['op-17', 'op-17'],
        true,
        focus.progress('send-same', 0),
        sentSame,
        read,
        graded,
      ),
    );
    focus.target('new-key', () =>
      comparison(
        ctx,
        api,
        1025,
        ['op-17', 'op-18'],
        focus.visible('offer-new-key'),
        focus.progress('send-new', 0),
        sentNew,
        read,
        graded,
      ),
    );
    focus.target('decision', () => {
      if (focus.visible('recovery-probes'))
        decision(ctx, api, 'Next probe: let permission expire before the retry.');
      else if (graded)
        decision(ctx, api, 'Two dispatches in each run. Only one run kept exactly one hold.');
      else if (state.beat === 1 && focus.visible('choose-keys'))
        decision(ctx, api, 'Which retry will leave exactly one B7 hold?');
    });
  },
};
