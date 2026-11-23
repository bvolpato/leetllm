import { fixedWindows } from './arithmetic.mjs';
import { REVISED_RULE } from './fixtures.mjs';
import { answerabilityFixture } from './model.mjs';

function passage(source, start, end) {
  const words = [...source.matchAll(/\S+/g)];
  const last = words[end - 1];
  return {
    start, end, length: end - start,
    text: source.slice(words[start].index, last.index + last[0].length),
  };
}

// The caller has already checked the version and permission of these hits.
// Charge each whole hit in rank order, then return selected spans in source order.
function pack(source, ranked, budget) {
  let used = 0;
  const selected = [];
  for (const span of ranked) {
    if (span.length + used > budget) continue;
    selected.push(span);
    used += span.length;
  }
  const returned = selected.toSorted((a, b) => a.start - b.start);
  const positions = new Set(returned.flatMap(({ start, end }) =>
    Array.from({ length: end - start }, (_, i) => start + i)));
  const words = source.split(/\s+/);
  return {
    words, ranked, selected, returned, budget, used,
    repeated: used - positions.size,
    // This labeled question requires the whole rule in this source version.
    complete: positions.size === words.length,
  };
}

const pagingRule = answerabilityFixture().find(candidate => candidate.id === 'complete-rule').text;
const pagingHits = [passage(pagingRule, 5, 10), passage(pagingRule, 0, 5)];
const revisedHits = fixedWindows(REVISED_RULE, 9, 6).toReversed()
  .map(({ start, end }) => passage(REVISED_RULE, start, end));
const revisedParent = passage(REVISED_RULE, 0, REVISED_RULE.split(/\s+/).length);

export function pagingContext(budget) {
  return pack(pagingRule, pagingHits, budget);
}

export function revisedContext(budget, { parent = false, allowed = true, version = 5 } = {}) {
  const candidates = parent ? [revisedParent] : revisedHits;
  return pack(REVISED_RULE, allowed && version === 5 ? candidates : [], budget);
}
