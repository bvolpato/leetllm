import {Studio} from './studio.mjs';
import {drawFish,checkFish} from './fish.mjs';
import {forward,coefficients,training,reverse,sampler,checkPixels} from './pixels.mjs';
import {score,transport,attention,guidance,checkField} from './field.mjs';
import {compression,budget,recovery,ending,checkService} from './service.mjs';

const painters=[drawFish,forward,coefficients,training,reverse,score,transport,sampler,attention,guidance,compression,budget,recovery,ending];
export default {
  title:'Diffusion: How Noise Becomes an Image',
  draw(ctx,clock){painters[clock.beat.chapterIndex](new Studio(ctx),clock);},
  check(){checkFish();checkPixels();checkField();checkService();},
};
