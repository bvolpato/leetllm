import { prepareCaptions } from './captions.mjs';

import { C, instrument } from './instruments.mjs';
import { checkExamples } from './models.mjs';
import { slopes } from './slopes.mjs';
import { routes } from './routes.mjs';
import { storage } from './storage.mjs';
import { practice } from './practice.mjs';

const chapters = [...slopes, ...routes, ...storage, ...practice];

function draw(ctx, clock) {
  ctx.save();
  ctx.scale(1.6, 1.6);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, 1200, 675);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  chapters[clock.beat.chapterIndex](instrument(ctx, clock));
  ctx.restore();
}

export default { title: 'Gradients and Backprop', draw, check: checkExamples, preparePicture: prepareCaptions };
