import { desk } from './studio.mjs';
import { checkEvidence } from './evidence.mjs';
import { opening, approval, appeal, packageFile, closing } from './release.mjs';
import { intake, actors, prohibitions, highRisk, modelDuties, dates } from './intake.mjs';
import { register, evaluation, results, access, audit, privacy } from './replay.mjs';

const painters = [
  opening,
  intake,
  actors,
  prohibitions,
  highRisk,
  modelDuties,
  dates,
  register,
  evaluation,
  results,
  access,
  audit,
  privacy,
  approval,
  appeal,
  packageFile,
  closing,
];
export default {
  title: 'Responsible AI Governance Through Replayable Evidence',
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(2, 2);
    desk(ctx);
    painters[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
  check: checkEvidence,
};
