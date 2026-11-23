import { painterClock } from './press.mjs';
import { authority, admission, corpus, access, retrieval, support } from './collection.mjs';
import { requests, http, upgrades, scope, replay, rebuild } from './audit.mjs';
import {
  regions,
  budget,
  checkpoints,
  adjudication,
  lifecycle,
  shippingDesk,
} from './research.mjs';
import { checkEvidence } from './evidence.mjs';

const chapters = [
  authority,
  admission,
  corpus,
  access,
  retrieval,
  support,
  requests,
  http,
  upgrades,
  scope,
  replay,
  rebuild,
  regions,
  budget,
  checkpoints,
  adjudication,
  lifecycle,
  shippingDesk,
];
export default {
  title: 'Build and Audit a Document QA and Research Product',
  preparePicture(schedule) {
    const phrases = {
      'c06-b02': ['With identical copies', 'Now slip the word', 'into the lower sentence', 'Count again', 'Eight terms still match', 'and there are now nine distinct terms', 'between the two sentences'],
      'c06-b03': ['when J is above point eight', 'Will it accept this edited claim'],
      'c06-b04': ['Eight divided by nine is about point eight eight nine', 'Read the claim it just accepted', 'The policy permits restoration after verification', 'The extra word reverses that permission'],
    };
    for (const entry of schedule) {
      if (!phrases[entry.beat.id]) continue;
      for (const phrase of phrases[entry.beat.id]) entry.markCaption(phrase);
      entry.cueWordIndices = new Set(entry.cueWordIndices);
    }
  },
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(1.6, 1.6);
    chapters[clock.beat.chapterIndex](ctx, painterClock(clock));
    ctx.restore();
  },
  check: checkEvidence,
};
