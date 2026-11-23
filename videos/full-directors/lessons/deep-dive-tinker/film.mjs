import { opening, boundary, supervised, reward } from './clamp-and-tokens.mjs';
import { trajectory, adapter } from './training.mjs';
import { pipeline, snapshots } from './queue-and-snapshots.mjs';
import { check } from './model.mjs';

const chapters = [opening, boundary, supervised, reward, trajectory, adapter, pipeline, snapshots];
export default {
  title: 'Tinker: Follow the Update, Then the Sample',
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(1.5, 1.5);
    chapters[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
  check,
};
