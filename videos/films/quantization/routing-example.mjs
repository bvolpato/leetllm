export const requestedDock = 7;
export const routeReplies = [
  { name: 'Source model', json: '{"dock":7}' },
  { name: 'Four-bit file A', json: '{"dock":1}' },
].map((reply) => {
  const dock = JSON.parse(reply.json).dock;
  return { ...reply, dock, correct: dock === requestedDock };
});

export const routingTrial = {
  requests: 100,
  minimumCorrect: 85,
  source: { parsed: 90, correct: 85 },
  fileA: { parsed: 95, correct: 80 },
};

export function drawRequest(ctx, api, { replies, parsed, checked }) {
  const { C } = api;
  api.focus.target('parcel-request', () => {
    api.text(ctx, 'Parcel request', 140, 295, 38, C.muted);
    api.text(ctx, 'Send this parcel to dock ' + requestedDock + '.', 140, 390, 70, C.ink);
  });
  for (const [i, reply] of routeReplies.entries()) {
    const x = 150 + 875 * i;
    const color = i ? C.cyan : C.blue;
    api.focus.target('parcel-replies', () => {
      api.text(ctx, reply.name, x, 535, 42, color);
      api.line(ctx, x, 568, x + 755, 568, color, 4);
      if (replies > 0)
        api.components.fade(replies, () =>
          api.text(ctx, reply.json, x, 700, 77, C.ink, 'left', 'mono'),
        );
      if (parsed) api.text(ctx, 'JSON parses', x, 798, 37, C.muted);
    });
    if (checked)
      api.focus.target('parcel-result', () => {
        const verdict = reply.correct ? 'Requested dock' : 'Wrong dock';
        api.text(
          ctx,
          'Dock ' + reply.dock + '   ·   ' + verdict,
          x,
          915,
          47,
          reply.correct ? C.green : C.red,
        );
      });
  }
}
