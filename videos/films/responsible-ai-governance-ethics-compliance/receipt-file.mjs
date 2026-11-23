// The proposal and its reviewer receipts share one traffic scale.
export function drawReceiptFile(ctx, api, file) {
  const { C, focus, text, line, rect } = api;
  const left = 455;
  const right = 1265;
  const x = (share) => left + ((right - left) * share) / 25;

  focus.target('case-identity', () => {
    text(ctx, file.proposal.candidate + '   /   Production', 110, 251, 49, C.ink);
    text(
      ctx,
      `Model ${file.proposal.artifact}   ·   Policy ${file.proposal.policy}   ·   Evaluation ${file.proposal.evidence}`,
      1800,
      245,
      32,
      C.ink,
      'right',
    );
  });
  text(ctx, 'Source    Untrusted evaluation note', 110, 316, 29, C.muted);
  if (file.deployment)
    focus.target('deployment-record', () => {
      text(ctx, file.deployment, 1800, 316, 29, C.cyan, 'right');
    });

  function row(label, share, y, status, color) {
    text(ctx, label, 110, y + 13, 39, C.ink);
    line(ctx, left, y, right, y, C.muted, 2);
    if (share > 0) rect(ctx, left, y - 11, x(share) - left, 22, color, undefined, 3);
    if (share !== null) api.circle(ctx, x(share), y, 15, color);
    if (status) text(ctx, status, 1350, y + 12, 34, color);
  }

  focus.target('request-file', () => {
    for (let tick = 0; tick <= 25; tick += 5) {
      text(ctx, tick + '%', x(tick), 395, 28, C.muted, 'center');
      line(ctx, x(tick), 414, x(tick), 426, C.muted, 2);
    }
    row('Request', file.position, 465, file.requestLabel, C.yellow);
  });
  focus.target('receipt-lines', () => {
    text(ctx, 'Reviewer receipts', 110, 544, 27, C.muted);
    if (file.receiptComparison) text(ctx, file.receiptComparison, 1350, 544, 28, C.yellow);
    file.rows.forEach(({ role, share, status, denied }, i) => {
      const y = 608 + i * 85;
      row(role, share, y, status, denied ? C.pink : share === null ? C.muted : C.cyan);
      if (file.requiredShare != null)
        api.circle(ctx, x(file.requiredShare), y, 15, C.bg, C.yellow, 4);
    });
    if (file.roleNote) text(ctx, file.roleNote, 110, 795, 30, C.muted);
  });

  focus.target('gate-record', () => {
    line(ctx, 110, 835, 1800, 835, C.muted, 2);
    text(ctx, 'Application gate', 110, 895, 29, C.muted);
    text(ctx, file.gate, 110, 965, 43, file.gateColor ?? C.ink);
    text(ctx, 'Executor record', 1140, 895, 29, C.muted);
    text(ctx, file.effect, 1140, 965, 41, file.effectColor ?? C.ink);
    if (file.appeal) text(ctx, file.appeal, 110, 1030, 32, C.cyan);
  });
}

export function receiptRow(role, receipt, reviewedProposal) {
  if (!receipt) return { role, share: null, status: 'No receipt' };
  const denied = receipt.decision === 'DENIED';
  return {
    role,
    denied,
    share: reviewedProposal.target,
    status: (denied ? 'Denied for ' : 'Signed for ') + reviewedProposal.target + '%',
  };
}
