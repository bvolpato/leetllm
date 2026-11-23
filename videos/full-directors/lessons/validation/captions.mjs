const phraseStarts = {
  'c16-b05': ['If you filter out easy prompts', 'the remaining test gets harder', 'Consider a model'],
  'c16-b06': ['Here a browsing tool can fetch'],
};

export function prepareValidationCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    // Preserve the picture reveal times while keeping the intact phrases in the caption track.
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
