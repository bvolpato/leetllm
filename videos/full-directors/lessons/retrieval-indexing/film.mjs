import { brush, paper, night, atlas } from './studio.mjs';
import { kitchenScenes, checkKitchen } from './cookbook.mjs';
import { manualScenes, checkManual } from './manual.mjs';
import { atlasScenes, checkAtlas } from './atlas.mjs';

const practiceCaptions = {
  'c25-b01': ['Move only the query', 'from four point nine to five point two', 'You still get one probe', 'Which passage will it return', 'and how many distances will it check', 'including the centers'],
  'c25-b02': ['The distances to the centers', 'are five point two and four point eight', 'so the right list opens', 'Two passages live there'],
  'c25-b03': ['A flat scan would find the same passage in three'],
  'c25-b05': ['At five point two', 'the extra probe adds a distance check', 'and returns the same guide', 'Compare each result'],
  'c25-b06': ['Then use relevance judgments and measured latency', 'on held-out questions to decide which setting to keep', 'The next lesson starts with those passages in hand', 'and follows the model’s choice of the next token'],
};

const scenes = [...kitchenScenes, ...manualScenes, ...atlasScenes];
export default {
  title: 'How an Index Finds the Right Documents',
  preparePicture(schedule) {
    for (const entry of schedule) {
      const phrases = practiceCaptions[entry.beat.id];
      if (!phrases) continue;
      for (const phrase of phrases) entry.markCaption(phrase);
      entry.cueWordIndices = new Set(entry.cueWordIndices);
    }
  },
  draw(ctx, clock) {
    const index = clock.beat.chapterIndex;
    const palette = index < 8 ? paper : index < 16 || index === 23 ? night : atlas;
    scenes[index](brush(ctx, clock, palette));
  },
  check() {
    checkKitchen();
    checkManual();
    checkAtlas();
  },
};
