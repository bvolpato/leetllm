import { paragraphCaptions, timedWordTokens } from './captions.mjs';
import { wordCaptions } from './lesson.mjs';
import { captionBoundaryTokens, validateVisualCues } from './narration-cues.mjs';

export const paragraphPolicy = 'paragraphs-sentence-boundaries';
export const teachingPolicy = 'teaching-phrases-and-reveals';

export function captionsForBeat(scene, policy) {
  const authored = captionBoundaryTokens(scene);
  if (policy === paragraphPolicy) {
    return (beat, index) =>
      paragraphCaptions(
        scene.sounds[index].words,
        scene.start + beat.start,
        beat.say,
        authored[index],
      );
  }
  if (policy !== teachingPolicy) throw new Error('Unknown caption policy: ' + policy);
  const cues = validateVisualCues(scene);
  return (beat, index) => {
    const words = scene.sounds[index].words;
    const tokens = timedWordTokens(words, beat.say);
    const firstToken = new Map();
    for (const [i, token] of tokens.entries()) {
      if (!firstToken.has(token.wordIndex)) firstToken.set(token.wordIndex, i);
    }
    const boundaries = [...authored[index]];
    const addStart = (wordIndex) => {
      if (wordIndex > 0 && words[wordIndex - 1].end > words[wordIndex].start) return;
      boundaries.push({ ceilMsAt: firstToken.get(wordIndex) });
    };
    for (const cue of cues.filter((item) => item.beat === index)) {
      addStart(tokens[cue.first].wordIndex);
    }
    const written = [...beat.say.matchAll(/[\p{L}\p{N}]+/gu)];
    const anchorWords = new Set([0, words.length]);
    for (const boundary of boundaries) {
      anchorWords.add(tokens[boundary.ceilMsAt ?? boundary].wordIndex);
    }
    const anchors = [...anchorWords].sort((a, b) => a - b);
    const starts = new Set();
    for (let i = 0; i < anchors.length - 1; i++) {
      const from = anchors[i];
      const to = anchors[i + 1];
      const start = from === 0 ? 0 : written[firstToken.get(from)].index;
      const end = to === words.length ? beat.say.length : written[firstToken.get(to)].index;
      const segment = beat.say.slice(start, end).trim();
      for (const phrase of wordCaptions(words.slice(from, to), 0, segment)) {
        starts.add(phrase.start);
      }
    }
    for (const [i, word] of words.entries()) {
      let token = firstToken.get(i);
      if (token === undefined || !starts.has(word.start)) continue;
      while (token > 0 && !/\s/u.test(beat.say[written[token].index - 1])) token--;
      const groupStart = tokens[token].wordIndex;
      if (firstToken.get(groupStart) === token) addStart(groupStart);
    }
    return paragraphCaptions(words, scene.start + beat.start, beat.say, boundaries);
  };
}

export function teachingCaptions(scene) {
  return scene.beats.flatMap(captionsForBeat(scene, teachingPolicy));
}
