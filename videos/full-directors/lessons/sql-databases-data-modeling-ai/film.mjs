import {
  opening,
  durability,
  relations,
  schema,
  select,
  pattern,
  join,
  nullTime,
  validity,
  overlap,
} from './archive.mjs';
import {
  permits,
  roles,
  counts,
  groups,
  deletion,
  catches,
  publish,
  connections,
  exportsScene,
  retries,
  outbox,
} from './reading-room.mjs';
import {
  indexPath,
  plans,
  meaning,
  vectorTurn,
  history,
  closing,
  september,
} from './retrieval.mjs';
import { check } from './counter-model.mjs';
import { prepareCaptions } from './captions.mjs';

const painters = [
  opening,
  durability,
  relations,
  schema,
  select,
  pattern,
  join,
  nullTime,
  validity,
  overlap,
  permits,
  roles,
  counts,
  groups,
  deletion,
  catches,
  publish,
  connections,
  exportsScene,
  retries,
  outbox,
  indexPath,
  plans,
  meaning,
  vectorTurn,
  history,
  closing,
  september,
];

export default {
  title: 'Which Policy Can This Answer Trust?',
  draw(ctx, clock) {
    painters[clock.beat.chapterIndex](ctx, clock);
  },
  check,
  preparePicture: prepareCaptions,
};
