import { fixedWindows, requiredPhrasesPresent } from './arithmetic.mjs';
import { RELEASE_WORD_CAP, REVISED_RULE, RUNBOOK } from './fixtures.mjs';
import { createHash } from 'node:crypto';
export function checkedParents({ version = 3, allowed = true, budget = 20 } = {}) {
  const text =
    'Rollback failure: page on-call within 15 minutes with deploy ID. Include the service name.';
  return {
    copies: 1,
    words: text.split(/\s+/).length,
    text,
    status: !allowed
      ? 'parent access denied'
      : version !== 3
        ? 'stale child-to-parent link'
        : budget < text.split(/\s+/).length
          ? 'context budget exceeded; select smaller complete evidence'
          : 'accepted',
  };
}
export function freshEvidence({ dropCondition = false, allowed = true, budget = 12 } = {}) {
  const words = REVISED_RULE.split(/\s+/),
    parts = [words.slice(0, 5), words.slice(5)],
    returned = dropCondition ? [parts[1]] : parts;
  const joined = returned.flat().join(' '),
    complete = ['Rollback failure', '20 minutes', 'deploy ID', 'service'].every((phrase) =>
      joined.includes(phrase),
    );
  return {
    words,
    parts,
    returned,
    joined,
    complete,
    parentWords: words.length,
    parentAdmitted: allowed && words.length <= budget,
  };
}
export function manifestChecksums() {
  const original = 'Rollback failure: page on-call within 15 minutes with deploy ID.',
    edited = original.replace('15', '20'),
    hash = (text) => createHash('sha256').update(text).digest('hex');
  return {
    original,
    edited,
    originalHash: hash(original),
    editedHash: hash(edited),
  };
}
export function lateChunkFixture() {
  const tokens = [
    {
      text: 'Owner',
      mayaFeature: 0.12,
    },
    {
      text: 'is',
      mayaFeature: 0.18,
    },
    {
      text: 'Maya',
      mayaFeature: 1.0,
    },
    {
      text: '…',
      mayaFeature: 0.43,
    },
    {
      text: 'page',
      mayaFeature: 0.72,
    },
    {
      text: 'the',
      mayaFeature: 0.68,
    },
    {
      text: 'service',
      mayaFeature: 0.7,
    },
    {
      text: 'owner',
      mayaFeature: 0.74,
    },
  ];
  const selected = [4, 5, 6, 7];
  const poolValues = selected.map((index) => tokens[index].mayaFeature);
  const pooledFeature = poolValues.reduce((sum, value) => sum + value, 0) / poolValues.length;
  return {
    tokens,
    selected,
    poolValues,
    pooledFeature,
    localOwnerFeature: 0,
  };
}
export function overlapExperiment() {
  return [0, 2, 4].map((overlap) => {
    const chunks = fixedWindows(RUNBOOK, 7, overlap);
    return {
      overlap,
      chunks: chunks.length,
      indexedWords: chunks.reduce((sum, chunk) => sum + chunk.words.length, 0),
      completeRuleChunks: chunks.filter((chunk) => requiredPhrasesPresent(chunk.text)).length,
    };
  });
}
export function headedSection() {
  const heading = 'Rollback failure';
  const rule = 'Page on-call within 15 minutes with deploy ID.';
  return {
    heading,
    rule,
    searchableText: heading + ': ' + rule,
    locator: 'incident-runbook-v3.pdf · page 7',
  };
}
export function parentExpansion({
  childVersion = 'runbook/v3',
  parentVersion = 'runbook/v3',
  authorized = true,
} = {}) {
  const child = {
    text: 'within 15 minutes',
    parentId: 'runbook-v3/page-7',
    version: childVersion,
  };
  const parent = {
    id: 'runbook-v3/page-7',
    text: 'Rollback failure: page on-call within 15 minutes with deploy ID.',
    version: parentVersion,
    authorized,
  };
  const admitted =
    child.parentId === parent.id && child.version === parent.version && parent.authorized;
  return {
    child,
    parent,
    admitted,
    context: admitted ? parent.text : null,
  };
}
export function answerabilityFixture() {
  const chunks = [
    {
      id: 'condition-only',
      text: 'Rollback failure: page on-call within',
    },
    {
      id: 'deadline-with-competing-rule',
      text: '15 minutes with deploy ID. Routine deploy notes archive within 14 days.',
    },
    {
      id: 'complete-rule',
      text: 'Rollback failure: page on-call within 15 minutes with deploy ID.',
    },
  ];
  return chunks.map((chunk) => ({
    ...chunk,
    phraseCheck: requiredPhrasesPresent(chunk.text),
  }));
}
export function releaseComparison() {
  return answerabilityFixture().map((candidate) => {
    const text = candidate.text.toLowerCase();
    const coverage = {
      condition: text.includes('rollback failure'),
      deadline: text.includes('15 minutes'),
      identifier: text.includes('deploy id'),
    };
    const wordCount = candidate.text.split(/\s+/).length;
    const answerable = Object.values(coverage).every(Boolean);
    const withinCap = wordCount <= RELEASE_WORD_CAP;
    return {
      ...candidate,
      wordCount,
      coverage,
      answerable,
      withinCap,
      releasable: answerable && withinCap,
    };
  });
}
