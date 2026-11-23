import assert from 'node:assert/strict';
export function callPlan(leaves = 8) {
  assert(Number.isInteger(leaves) && leaves >= 1);
  return {
    leafCalls: leaves,
    mergeCalls: leaves - 1,
    total: 2 * leaves - 1,
  };
}
export function characterPlan(window = 512) {
  assert(Number.isInteger(window) && window > 0);
  const source = 'deprecation policy '.repeat(300),
    reserve = 32,
    leafPrefix = 'Summarize policy: ',
    mergePrefix = 'Merge policy summaries: ';
  const allowance = window - reserve - leafPrefix.length;
  const minimumMerge = mergePrefix.length + 16 + 1 + 16 + reserve;
  assert(allowance > 0 && minimumMerge <= window, 'merge cannot fit');
  let calls = 0,
    leaves = 0,
    largestInput = 0,
    largestSource = 0;
  const visit = (text) => {
    if (text.length <= allowance) {
      calls++;
      leaves++;
      largestInput = Math.max(largestInput, leafPrefix.length + text.length);
      largestSource = Math.max(largestSource, text.length);
      return;
    }
    const mid = Math.floor(text.length / 2);
    visit(text.slice(0, mid));
    visit(text.slice(mid));
    calls++;
    largestInput = Math.max(largestInput, mergePrefix.length + 33);
  };
  visit(source);
  return {
    source: source.length,
    window,
    reserve,
    overhead: leafPrefix.length,
    allowance,
    minimumMerge,
    largestSource,
    largestInput,
    total: largestInput + reserve,
    calls,
    leaves,
  };
}
export function previewForHistory(text, limit = 40) {
  assert(Number.isInteger(limit) && limit >= 0);
  const marker = '...[truncated]';
  return text.length <= limit
    ? text
    : limit <= marker.length
      ? marker.slice(0, limit)
      : text.slice(0, limit - marker.length) + marker;
}
