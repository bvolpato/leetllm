export const MAX_CAPTION_CHARACTERS = 320;
export const MAX_CAPTION_SECONDS = 30;

export const lexicalTokens = (value) =>
  [...value.matchAll(/[\p{L}\p{N}]+/gu)].map((match) => match[0].toLocaleLowerCase('en'));

export function timedWordTokens(words, transcript) {
  if (!Array.isArray(words) || !words.length) throw new Error('Timed words are required');
  let previousStart = -Infinity,
    previousEnd = -Infinity;
  for (const [index, word] of words.entries()) {
    if (
      typeof word?.text !== 'string' ||
      !word.text.trim() ||
      !Number.isFinite(word.start) ||
      !Number.isFinite(word.end) ||
      word.start < 0 ||
      word.end < word.start ||
      word.start < previousStart ||
      word.end < previousEnd
    )
      throw new Error(`Invalid word boundary at index ${index}`);
    previousStart = word.start;
    previousEnd = word.end;
  }
  const tokens = words.flatMap((word, wordIndex) =>
    lexicalTokens(word.text).map((value) => ({ value, wordIndex })),
  );
  const authored = lexicalTokens(transcript);
  if (
    !authored.length ||
    authored.length !== tokens.length ||
    authored.some((value, index) => value !== tokens[index].value)
  ) {
    throw new Error('Transcript does not match timed word coverage');
  }
  return tokens;
}

const normalizeWhitespace = (value) => value.replace(/\s+/gu, ' ').trim();

const joinProviderText = (words) =>
  normalizeWhitespace(
    words
      .map((word) => word.text.trim())
      .join(' ')
      .replace(/\s+([,.;:!?])/gu, '$1')
      .replace(/([([{])\s+/gu, '$1')
      .replace(/\s+([)\]}])/gu, '$1'),
  );

const internalAbbreviations = new Set(['e.g', 'i.e', 'vs', 'u.s', 'u.k']);
const countryAbbreviations = new Set(['u.s', 'u.k']);
const sentenceStarters = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'because',
  'but',
  'each',
  'every',
  'for',
  'he',
  'here',
  'her',
  'his',
  'i',
  'if',
  'in',
  'it',
  'its',
  'many',
  'most',
  'next',
  'now',
  'once',
  'our',
  'she',
  'so',
  'some',
  'that',
  'the',
  'their',
  'these',
  'they',
  'this',
  'those',
  'then',
  'there',
  'we',
  'when',
  'while',
  'you',
]);
const numberedReferenceAbbreviations = new Set(['fig', 'no']);
const titleAbbreviations = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'rev',
  'sr',
  'jr',
  'st',
  'gen',
  'sen',
  'rep',
  'gov',
  'pres',
  'supt',
  'col',
  'lt',
  'cmdr',
  'capt',
  'sgt',
  'mt',
]);
const continuationAbbreviations = new Set([
  'etc',
  'approx',
  'dept',
  'fig',
  'no',
  'vol',
  'inc',
  'ltd',
]);

function isAbbreviation(text, periodIndex, matchEnd) {
  const before = text.slice(0, periodIndex).match(/([\p{L}.]+)$/u)?.[1] ?? '';
  const abbreviation = before.toLocaleLowerCase('en');
  const nextText = text.slice(matchEnd);
  const next = nextText.match(/\S/u)?.[0] ?? '';
  const nextWordText = nextText.match(/[\p{L}\p{N}]+/u)?.[0] ?? '';
  const nextWord = nextWordText.toLocaleLowerCase('en');
  if (
    countryAbbreviations.has(abbreviation) &&
    /^\p{Lu}/u.test(nextWordText) &&
    sentenceStarters.has(nextWord)
  )
    return false;
  if (internalAbbreviations.has(abbreviation)) return true;
  if (numberedReferenceAbbreviations.has(abbreviation) && /^\p{N}/u.test(next)) return true;
  if (titleAbbreviations.has(abbreviation) && /\p{Lu}/u.test(next)) return true;
  if (continuationAbbreviations.has(abbreviation) && /\p{Ll}/u.test(next)) return true;
  return before.length === 1 && /\p{Lu}/u.test(before) && /\p{Lu}/u.test(next);
}

function sentenceEnds(text) {
  const ends = [];
  const terminalPunctuation = /[.!?]+["'’”)}\]»]*(?=\s|$)/gu;
  for (const match of text.matchAll(terminalPunctuation)) {
    const punctuationIndex = match.index + match[0].search(/[.!?]/u);
    const punctuation = match[0].match(/[.!?]+/u)?.[0] ?? '';
    if (
      punctuation.endsWith('.') &&
      isAbbreviation(text, punctuationIndex, match.index + match[0].length)
    )
      continue;
    ends.push(match.index + match[0].length);
  }
  return ends;
}

function sentenceUnits(text, transcriptTokens, tokenOffset = 0, boundaries = new Set()) {
  const phraseStarts = transcriptTokens.flatMap((token, index) => {
    if (!boundaries.has(tokenOffset + index)) return [];
    if (index === 0) return [0];
    const gapStart = transcriptTokens[index - 1].end;
    const gap = text.slice(gapStart, token.start);
    const whitespace = gap.search(/\s/u);
    if (whitespace < 0)
      throw new Error(
        `Caption boundary at token ${tokenOffset + index} requires a separate authored word`,
      );
    // Keep preceding word punctuation in place and give opening signs to the phrase.
    return [gapStart + whitespace + gap.slice(whitespace).search(/\S|$/u)];
  });
  const cuts = [...new Set([...sentenceEnds(text), ...phraseStarts, text.length])].sort(
    (a, b) => a - b,
  );
  const units = [];
  let start = 0;
  let tokenStart = 0;
  let tokenEnd = 0;
  for (const end of cuts) {
    while (tokenEnd < transcriptTokens.length && transcriptTokens[tokenEnd].end <= end) tokenEnd++;
    const content = text.slice(start, end).trim();
    if (content && tokenEnd === tokenStart && boundaries.has(tokenOffset + tokenStart)) continue;
    if (content && tokenEnd > tokenStart) {
      units.push({
        text: content,
        tokenStart: tokenOffset + tokenStart,
        tokenEnd: tokenOffset + tokenEnd,
        boundaryBefore: boundaries.has(tokenOffset + tokenStart),
      });
    }
    tokenStart = tokenEnd;
    start = end;
  }
  return units;
}

/**
 * Group timed speech into readable paragraph captions. Short paragraphs remain
 * together. Longer paragraphs split only after complete sentences, using the
 * authored transcript when its spoken-word coverage matches the provider events.
 * Optional lexical token indexes start new captions at measured word boundaries.
 */
export function paragraphCaptions(words, offset = 0, transcript = '', boundaryTokens = []) {
  if (!Array.isArray(words) || words.length === 0) throw new Error('Timed words are required');
  if (!Number.isFinite(offset) || offset < 0) throw new Error('Invalid caption offset');
  if (typeof transcript !== 'string') throw new Error('Transcript must be a string');

  let previousStart = -Infinity;
  let previousEnd = -Infinity;
  for (const [index, word] of words.entries()) {
    if (
      typeof word?.text !== 'string' ||
      !word.text.trim() ||
      !Number.isFinite(word.start) ||
      !Number.isFinite(word.end) ||
      word.start < 0 ||
      word.end < word.start ||
      word.start < previousStart ||
      word.end < previousEnd
    ) {
      throw new Error(`Invalid word boundary at index ${index}`);
    }
    previousStart = word.start;
    previousEnd = word.end;
  }

  const providerTokens = words.flatMap((word, wordIndex) =>
    lexicalTokens(word.text).map((value) => ({ value, wordIndex })),
  );
  const paragraphs = transcript.trim()
    ? transcript
        .split(/\r?\n[ \t]*\r?\n/gu)
        .map(normalizeWhitespace)
        .filter(Boolean)
    : [joinProviderText(words)];
  const transcriptTokens = paragraphs.flatMap((paragraph) => lexicalTokens(paragraph));

  if (
    !transcriptTokens.length ||
    transcriptTokens.length !== providerTokens.length ||
    transcriptTokens.some((token, index) => token !== providerTokens[index]?.value)
  ) {
    throw new Error('Transcript does not match timed word coverage');
  }

  if (!Array.isArray(boundaryTokens)) throw new Error('Caption boundaries must be token indexes');
  const boundaries = new Set();
  const ceilStarts = new Set();
  for (const token of boundaryTokens) {
    const index = token?.ceilMsAt ?? token;
    if (token?.ceilMsAt !== undefined) ceilStarts.add(index);
    boundaries.add(index);
    if (!Number.isInteger(index) || index < 0 || index >= providerTokens.length)
      throw new Error(`Invalid caption boundary token: ${index}`);
    const wordIndex = providerTokens[index].wordIndex;
    if (
      (index > 0 && providerTokens[index - 1].wordIndex === wordIndex) ||
      (wordIndex > 0 && words[wordIndex - 1].end > words[wordIndex].start)
    )
      throw new Error(`Caption boundary at token ${index} requires a separate measured word`);
  }

  let tokenOffset = 0;
  const paragraphsWithUnits = paragraphs.map((text) => {
    const tokens = [...text.matchAll(/[\p{L}\p{N}]+/gu)].map((match) => ({
      start: match.index,
      end: match.index + match[0].length,
    }));
    const units = sentenceUnits(text, tokens, tokenOffset, boundaries);
    tokenOffset += tokens.length;
    return units;
  });
  const timeAt = (tokenIndex) => words[providerTokens[tokenIndex].wordIndex];
  const captions = [];
  let group = [];

  const appendCue = (cue) => {
    const previous = captions.at(-1);
    if (previous && cue.start < previous.end) {
      previous.end = Math.max(previous.end, cue.end);
      previous.text = `${previous.text} ${cue.text}`;
    } else {
      captions.push(cue);
    }
  };

  const flush = () => {
    if (!group.length) return;
    const first = timeAt(group[0].tokenStart);
    const last = timeAt(group.at(-1).tokenEnd - 1);
    const measured = offset + first.start;
    const start = ceilStarts.has(group[0].tokenStart)
      ? Math.max(measured, Math.ceil(measured * 1000) / 1000)
      : measured;
    if (start > offset + last.end) throw new Error('Caption ends before its rounded start');
    appendCue({
      start,
      end: offset + last.end,
      text: group.map((unit) => unit.text).join(' '),
    });
    group = [];
  };

  for (const units of paragraphsWithUnits) {
    for (const unit of units) {
      if (unit.boundaryBefore) flush();
      const candidate = [...group, unit];
      const start = timeAt(candidate[0].tokenStart).start;
      const end = timeAt(candidate.at(-1).tokenEnd - 1).end;
      const text = candidate.map((item) => item.text).join(' ');
      if (
        group.length &&
        (text.length > MAX_CAPTION_CHARACTERS || end - start > MAX_CAPTION_SECONDS)
      )
        flush();
      group.push(unit);
    }
    flush();
  }
  return captions;
}
