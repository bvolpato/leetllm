const phraseStarts = {
  'c05-b01': ['Here are the eight ways'],
  'c06-b02': ['Suppose the sample makes', 'two routers tie and the'],
  'c08-b10': ['gives loss complexity about point two two eight', 'confidence term alone is about'],
  'c09-b04': ['plus one over gamma minus one', 'total one point five'],
  'c13-b01': ['Someone copies ticket thirty-eight', 'until there are forty scored rows'],
};

export function prepareLearningTheoryCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
    if (entry.beat.id === 'c09-b04') {
      // Group the denominator in the captions without changing the spoken word clock.
      const term = entry.words.findIndex(({ text }, i) =>
        text === 'plus' && entry.words.slice(i, i + 6).map(word => word.text).join(' ') ===
          'plus one over gamma minus one.');
      if (term < 0) throw new Error('Expected the excess prediction risk denominator.');
      entry.words = entry.words.map((word, i) => {
        if (i === term + 3) return { ...word, text: '(' + word.text };
        if (i === term + 5) return { ...word, text: 'one).' };
        return word;
      });
    }
  }
}
