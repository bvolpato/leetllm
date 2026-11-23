import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import scene0 from './scenes/opening.mjs';
import scene1 from './scenes/forward.mjs';
import scene2 from './scenes/sensitivity.mjs';
import scene3 from './scenes/reverse-mode.mjs';
import scene4 from './scenes/one-update.mjs';
import scene5 from './scenes/gradient-check.mjs';
import scene6 from './scenes/autograd-buffer.mjs';
import scene7 from './scenes/local-rules.mjs';
import scene8 from './scenes/nonlinear-request.mjs';
import scene9 from './scenes/training-loop.mjs';
import scene10 from './scenes/batches.mjs';
import scene11 from './scenes/learning-rate.mjs';
import scene12 from './scenes/deep-gradients.mjs';
import scene13 from './scenes/initialization.mjs';
import scene14 from './scenes/diagnosis.mjs';
import scene15 from './scenes/validation.mjs';
import scene16 from './scenes/network-transfer.mjs';
import scene17 from './scenes/next-loss.mjs';
import signedRequest from './scenes/signed-request.mjs';
export default narratedLesson({
  id: 'training-backpropagation-gradient-descent',
  scenes: {
    'opening': scene0,
    'forward': scene1,
    'sensitivity': scene2,
    'reverse-mode': scene3,
    'one-update': scene4,
    'gradient-check': scene5,
    'autograd-buffer': scene6,
    'local-rules': scene7,
    'nonlinear-request': scene8,
    'training-loop': scene9,
    'batches': scene10,
    'learning-rate': scene11,
    'deep-gradients': scene12,
    'initialization': scene13,
    'diagnosis': scene14,
    'validation': scene15,
    'network-transfer': scene16,
    'next-loss': scene17,
    'signed-request': signedRequest,
  },
});
