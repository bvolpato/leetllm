// The opening and the repair review use the same two records and signature lines.
export function releaseNote(
  ctx,
  api,
  { results, rerun, otherChecks, requested, advice, approval, question },
) {
  const { C, focus } = api;
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  const rule = (x, y, end) => api.line(ctx, x, y, end, y, '#555961', 2);

  api.rect(ctx, 100, 222, 1070, 725, C.panel, undefined, 8);
  write('Offline checks', 150, 302, 51, C.ink, 'serif');
  write('returns-rerank-v3', 150, 360, 30, C.muted, 'mono');
  rule(150, 397, 1110);
  write('Reader denied access', 150, 460, 32);
  write('B17', 598, 460, 35, C.muted, 'mono');
  if (rerun) write('B18', 897, 460, 35, C.cyan, 'mono');

  ['Snippet', 'Citation'].forEach((label, i) => {
    const y = 555 + i * 137;
    focus.target('receipt-' + i, () => {
      write(label, 150, y, 46, C.ink, 'serif');
      write('Expected: deny', 150, y + 47, 28, C.muted);
      if (results[i]) write('Text returned', 598, y, 36, C.pink);
      else rule(598, y + 3, 792);
    });
    if (rerun) {
      focus.target('rerun-' + i, () => {
        if (rerun[i]) write('Denied', 897, y, 38, C.green);
        else rule(897, y + 3, 1070);
      });
    }
  });
  rule(150, 779, 1110);
  focus.target('other-checks', () => {
    write(
      rerun ? 'Other release checks' : 'Fixtures selected to test access',
      150,
      858,
      30,
      C.muted,
    );
    if (rerun)
      write(
        otherChecks ? 'Passed' : 'Awaiting review',
        786,
        858,
        31,
        otherChecks ? C.green : C.muted,
      );
  });

  write('Friday release note', 1232, 292, 48, C.ink, 'serif');
  write('Scheduled for broad release', 1232, 352, 29, C.muted);
  focus.target('proposal', () => {
    write('Product asks for', 1232, 459, 30, C.muted);
    write(requested ? '5% canary' : '…', 1232, 533, 58, C.yellow, 'serif');
  });
  rule(1232, 575, 1798);
  focus.target('advice', () => {
    write('Nia recommends', 1232, 637, 30, C.muted);
    if (advice) write(advice, 1232, 708, 47, C.cyan, 'serif');
    else rule(1232, 710, 1692);
  });
  focus.target('signature', () => {
    write('Canary approval', 1232, 799, 30, C.muted);
    write(
      approval ? 'Priya approved 5%' : 'Awaiting Priya',
      1232,
      862,
      42,
      approval ? C.green : C.ink,
      'serif',
    );
  });
  if (question) focus.target('question', () => write(question, 110, 1019, 40, C.yellow, 'serif'));
}
