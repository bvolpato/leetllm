import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyNeuralNetworksInvariants } from './shared.mjs';
import {
  affineIdentity,
  collapse,
  forwardScene,
  hinges,
  puzzle,
  scorer,
} from './scenes/act1-xor-forward.mjs';
import {
  activationProducts,
  batch,
  bounded,
  parameterScale,
  parameters,
  smooth,
  transpose,
} from './scenes/act2-activations-params.mjs';
import {
  backwardScene,
  cornerCheck,
  earnedGradientTransfer,
  outputDenominator,
  residual,
  savedValues,
  update,
} from './scenes/act3-backprop-training.mjs';
import {
  approximationConditions,
  approximationScene,
  checkedRiskReport,
  payoff,
  stable,
  units,
} from './scenes/act4-stability-approx-payoff.mjs';

export default cinematicLesson({
  id: 'neural-networks',
  accent: COSMOS.gold,
  invariants: verifyNeuralNetworksInvariants,
  scenes: {
    puzzle,
    collapse,
    hinges,
    scorer,
    forward: forwardScene,
    'affine-identity': affineIdentity,
    bounded,
    smooth,
    'activation-products': activationProducts,
    parameters,
    'parameter-scale': parameterScale,
    batch,
    transpose,
    residual,
    backward: backwardScene,
    'output-denominator': outputDenominator,
    'saved-values': savedValues,
    update,
    'corner-check': cornerCheck,
    'earned-gradient-transfer': earnedGradientTransfer,
    units,
    stable,
    'checked-risk-report': checkedRiskReport,
    approximation: approximationScene,
    'approximation-conditions': approximationConditions,
    payoff,
  },
});
