// The lesson `softmax` as a narrated film. One file for each scene, in the order of lesson.yaml.
import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import classNotPosition from './scenes/class-not-position.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';
import entropyReference from './scenes/entropy-reference.mjs';
import exponentials from './scenes/exponentials.mjs';
import gradient from './scenes/gradient.mjs';
import gradientChain from './scenes/gradient-chain.mjs';
import intro from './scenes/intro.mjs';
import loss from './scenes/loss.mjs';
import lossInputContract from './scenes/loss-input-contract.mjs';
import mass from './scenes/mass.mjs';
import scores from './scenes/scores.mjs';
import teacherForcing from './scenes/teacher-forcing.mjs';
import temperature from './scenes/temperature.mjs';
import temperatureLimits from './scenes/temperature-limits.mjs';
import tokenReduction from './scenes/token-reduction.mjs';
import transfer from './scenes/transfer.mjs';
import update from './scenes/update.mjs';
import vocabularyTiles from './scenes/vocabulary-tiles.mjs';
import weightedReduction from './scenes/weighted-reduction.mjs';
import smoothingEquilibrium from './scenes/smoothing-equilibrium.mjs';
import squaredVsCe from './scenes/squared-vs-ce.mjs';

export default narratedLesson({
  id: 'softmax',
  scenes: {
    intro,
    scores,
    exponentials,
    mass,
    loss,
    'gradient-chain': gradientChain,
    gradient,
    update,
    temperature,
    transfer,
    'entropy-reference': entropyReference,
    'squared-vs-ce': squaredVsCe,
    'loss-input-contract': lossInputContract,
    'temperature-limits': temperatureLimits,
    'smoothing-equilibrium': smoothingEquilibrium,
    'teacher-forcing': teacherForcing,
    'token-reduction': tokenReduction,
    'class-not-position': classNotPosition,
    'weighted-reduction': weightedReduction,
    'vocabulary-tiles': vocabularyTiles,
    'earned-transfer': earnedTransfer,
  },
});
