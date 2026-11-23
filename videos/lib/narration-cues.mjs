import { lexicalTokens, timedWordTokens } from './captions.mjs';

const slug = /^[a-z][a-z0-9-]*$/;
const colors = new Set(['cyan', 'blue', 'yellow', 'pink', 'green', 'red']);
const allowed = new Set(['id', 'phrase', 'targets', 'color', 'linger', 'caption_boundary']);
const smooth = (value) => {
  const p = Math.max(0, Math.min(1, value));
  return p * p * (3 - 2 * p);
};

function phraseSpan(say, phrase, fail) {
  const source = lexicalTokens(say),
    match = lexicalTokens(phrase),
    positions = [];
  if (!match.length) fail('phrase must contain spoken words');
  for (let i = 0; i <= source.length - match.length; i++) {
    if (match.every((word, offset) => word === source[i + offset])) positions.push(i);
  }
  if (positions.length !== 1)
    fail(
      `phrase must match exactly once in its narration; found ${positions.length}: ${JSON.stringify(phrase)}`,
    );
  return { first: positions[0], last: positions[0] + match.length - 1 };
}

export function validateVisualCues(scene) {
  const ids = new Set(),
    cues = [];
  for (const [beat, entry] of scene.beats.entries()) {
    if (entry.visual_cues === undefined) continue;
    if (!Array.isArray(entry.visual_cues))
      throw new Error(`${scene.id}/${beat}: visual_cues must be an array`);
    for (const cue of entry.visual_cues) {
      const fail = (message) => {
        throw new Error(`${scene.id}/${beat}/${cue?.id ?? 'cue'}: ${message}`);
      };
      if (
        !cue ||
        typeof cue !== 'object' ||
        Array.isArray(cue) ||
        Object.keys(cue).some((key) => !allowed.has(key))
      )
        fail('invalid visual cue fields');
      if (!slug.test(cue.id ?? '') || ids.has(cue.id))
        fail('cue IDs must be unique slugs within the scene');
      ids.add(cue.id);
      if (typeof cue.phrase !== 'string' || !cue.phrase.trim()) fail('phrase is required');
      if (cue.caption_boundary !== undefined && typeof cue.caption_boundary !== 'boolean')
        fail('caption_boundary must be a boolean');
      if (
        !Array.isArray(cue.targets) ||
        !cue.targets.length ||
        cue.targets.some((id) => !slug.test(id)) ||
        new Set(cue.targets).size !== cue.targets.length
      )
        fail('targets must be nonempty unique semantic IDs');
      if (cue.color !== undefined && !colors.has(cue.color) && !/^#[a-f0-9]{6}$/i.test(cue.color))
        fail('invalid cue color');
      if (
        cue.linger !== undefined &&
        (!Number.isFinite(cue.linger) || cue.linger < 0 || cue.linger > 2)
      )
        fail('linger must be between0and2seconds');
      cues.push({
        ...cue,
        targets: [...cue.targets],
        beat,
        ...phraseSpan(entry.say, cue.phrase, fail),
      });
    }
  }
  return cues;
}

/** Return opted-in phrase starts in the same lexical coordinates as timedWordTokens. */
export function captionBoundaryTokens(scene) {
  const boundaries = scene.beats.map((beat, index) => {
    if (beat.caption_starts === undefined) return [];
    const fail = (reason) => {
      throw new Error(`${scene.id}/${index}: caption_starts ${reason}`);
    };
    if (!Array.isArray(beat.caption_starts)) fail('must be a list of spoken phrases');
    return beat.caption_starts.map((phrase) => {
      if (typeof phrase !== 'string' || !phrase.trim()) fail('requires nonempty phrases');
      return { ceilMsAt: phraseSpan(beat.say, phrase, fail).first };
    });
  });
  for (const cue of validateVisualCues(scene)) {
    if (cue.caption_boundary === true) boundaries[cue.beat].push(cue.first);
  }
  return boundaries;
}

export function resolveSceneCues(scene, timing, sounds = timing.sounds) {
  const declarations = validateVisualCues(scene),
    mapped = new Map();
  return declarations
    .map((cue) => {
      const sound = sounds?.find((sound) => sound.beatIndex === cue.beat) ?? sounds?.[cue.beat];
      const beat = timing.beats[cue.beat],
        say = scene.beats[cue.beat].say;
      if (!sound?.words?.length || beat?.say !== say)
        throw new Error(
          `${scene.id}/${cue.id}: measured matching narration is required for visual cues`,
        );
      if (!mapped.has(cue.beat)) mapped.set(cue.beat, timedWordTokens(sound.words, say));
      const tokens = mapped.get(cue.beat),
        first = sound.words[tokens[cue.first].wordIndex],
        last = sound.words[tokens[cue.last].wordIndex];
      const start = beat.start + first.start,
        end = beat.start + last.end;
      if (!(end > start) || end > beat.end + 0.2)
        throw new Error(`${scene.id}/${cue.id}: phrase timing must fit the measured speech`);
      const { first: _first, last: _last, ...declaration } = cue;
      return { ...declaration, start, end, color: cue.color ?? 'cyan', linger: cue.linger ?? 0.65 };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id));
}

export function sampleNarrationCues(cues, time) {
  return Object.fromEntries(
    cues.map((cue) => {
      const progress = Math.max(0, Math.min(1, (time - cue.start) / (cue.end - cue.start)));
      const active = time >= cue.start && time < cue.end + cue.linger;
      const strength = active
        ? Math.min(smooth((time - cue.start) / 0.18), smooth((cue.end + cue.linger - time) / 0.25))
        : 0;
      return [
        cue.id,
        {
          ...cue,
          phase: time < cue.start ? 'before' : time < cue.end ? 'during' : 'after',
          progress,
          active,
          strength,
          reveal: smooth((time - cue.start) / 0.24),
        },
      ];
    }),
  );
}
