export const offlineReceipt = {
  baseline: { quality: 0.84, tokens: 620, latency: 820 },
  candidate: { quality: 0.87, tokens: 790, latency: 970 },
  allowedGrowth: 15,
  latencyLimit: 1000,
  domain: [560, 830],
};

export const correctedReceipt = {
  baseline: { quality: 0.85, tokens: 500, latency: null },
  candidate: { quality: 0.88, tokens: 560, latency: 980 },
  allowedGrowth: 15,
  latencyLimit: 1000,
  domain: [460, 610],
};

export function checkReceipt(receipt, tokens = receipt.candidate.tokens) {
  const { baseline, candidate, allowedGrowth, latencyLimit } = receipt;
  const cap = (baseline.tokens * (100 + allowedGrowth)) / 100;
  return {
    cap,
    growth: (tokens / baseline.tokens - 1) * 100,
    pass:
      candidate.quality > baseline.quality && candidate.latency <= latencyLimit && tokens <= cap,
  };
}

// Keep the same positions for the operands as a receipt passes from one scene to the next.
export function drawReceipt(ctx, api, receipt, view) {
  const { C, focus } = api;
  const { baseline, candidate } = receipt;
  const { cap } = checkReceipt(receipt);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const [min, max] = view.zoom ? [cap - 3, cap + 3] : receipt.domain;
  const x = (n) => 215 + (1480 * (n - min)) / (max - min);
  text(view.name, 155, 250, 33, C.muted);
  function measure(id, name, xpos, value, rule, shown) {
    focus.target(id, () => {
      text(name, xpos, 345, 32, C.muted);
      text(shown ? value : '…', xpos, 425, 58, shown ? C.ink : C.muted);
      text(rule, xpos, 483, 30, C.muted);
    });
  }
  measure(
    'receipt-quality',
    'Quality score',
    170,
    baseline.quality.toFixed(2) + '  →  ' + candidate.quality.toFixed(2),
    'Candidate must improve',
    view.quality,
  );
  const latency =
    baseline.latency === null
      ? candidate.latency + ' ms'
      : baseline.latency + '  →  ' + candidate.latency + ' ms';
  measure(
    'receipt-latency',
    '95th percentile latency',
    1030,
    latency,
    'Candidate limit  ' + receipt.latencyLimit + ' ms',
    view.latency,
  );
  focus.target('token-ruler', () => {
    const y = 740;
    text(view.zoom ? 'One tick per token' : 'Tokens per request', 160, 595, 36);
    const allowance =
      (view.zoom ? 'Baseline  ' + baseline.tokens + '     ·     ' : '') +
      'Allowance  +' +
      receipt.allowedGrowth +
      '%';
    if (view.allowance) text(allowance, 1730, 595, 32, C.yellow, 'right');
    api.line(ctx, x(min), y, x(max), y, C.muted, 3);
    if (view.zoom) {
      for (let token = min; token <= max; token++) {
        api.line(ctx, x(token), y - 9, x(token), y + 12, C.muted, 3);
        text(String(token), x(token), y + 56, 28, C.muted, 'center');
      }
    } else if (view.base) {
      const baseX = x(baseline.tokens);
      api.circle(ctx, baseX, y, 10, C.blue);
      text('Baseline  ' + baseline.tokens, baseX, y + 85, 33, C.blue, 'center');
      if (view.room > 0) {
        const end = baseX + (x(cap) - baseX) * view.room;
        api.line(ctx, baseX + 1, y - 15, end, y - 15, C.yellow, 6);
      }
    }
    if (view.limit) {
      api.line(ctx, x(cap), y - 53, x(cap), y + (view.zoom ? 20 : 36), C.yellow, 5);
      text('Cap  ' + cap, x(cap) - 15, y - 72, 33, C.yellow, 'right');
    }
    if (view.marker !== undefined) {
      const at = x(view.marker);
      api.circle(ctx, at, y, 13, C.cyan);
      const label = Number.isInteger(view.marker) ? 'Candidate  ' + view.marker : 'Candidate';
      text(label, at + 10, y + (view.zoom ? 107 : 85), 33, C.cyan, 'center');
      if (view.bracket) {
        const left = Math.min(at, x(cap)),
          right = Math.max(at, x(cap));
        api.line(ctx, left, y + 26, left, y + 42, C.ink, 3);
        api.line(ctx, left, y + 42, right, y + 42, C.ink, 3);
        api.line(ctx, right, y + 26, right, y + 42, C.ink, 3);
      }
    }
  });
  focus.target('cost-decision', () => {
    const line = view.decision || ' ';
    api.line(ctx, 160, 882, 1760, 882, C.muted, 2);
    text(line, 960, 975, 42, view.color ?? C.ink, 'center');
  });
}
