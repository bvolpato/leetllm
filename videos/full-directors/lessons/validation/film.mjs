import { prepareValidationCaptions } from './captions.mjs';
import { openingDesk, auditReplay, risk, roles, folds, checkRequests } from './requests.mjs';
import { calculation, people, scaler, selector, checkFits } from './fits.mjs';
import { deployments, arrivals, nested, threshold, auditQueue, checkCalendar } from './calendar.mjs';
import { librarySplit, lexical, fork, retention, checkManuals } from './manuals.mjs';

const painters = [
  openingDesk, auditReplay, risk, roles, folds, calculation, people, scaler, selector,
  deployments, arrivals, nested, threshold, auditQueue, librarySplit, lexical, fork, retention,
];

export default {
  title: 'Can a Model Handle New Data?',
  preparePicture(schedule) {
    const audit = schedule.find(({ beat }) => beat.id === 'c13-b06');
    for (const phrase of [
      'That point-four-nine request needed review',
      'The point-five-two request went to review',
      'and turned out to be routine',
      'Two true positives, one false alarm and one miss',
      'give F one of four over six',
      'The July-to-August drop could reflect',
      'selection, small samples or different traffic',
    ]) audit.markCaption(phrase);
    audit.cueWordIndices = new Set(audit.cueWordIndices);
    prepareValidationCaptions(schedule);
  },
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(1.5, 1.5);
    painters[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
  check() {
    checkRequests();
    checkFits();
    checkCalendar();
    checkManuals();
    return true;
  },
};

