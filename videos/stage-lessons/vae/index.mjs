// Autoencoders & VAEs: Full-bleed dark-cinema Vizmatic 0.10.0 stage film (25 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyVaeInvariants } from './shared.mjs';
import {
  bottleneck,
  codeTest,
  decoderPixel,
  intro,
  reconstruction,
  trainingBaseline,
} from './scenes/act1-bottleneck-recon.mjs';
import {
  evidenceGap,
  gradientPath,
  klLedger,
  objective,
  posterior,
  posteriorContract,
  sampling,
} from './scenes/act2-posterior-elbo.mjs';
import {
  collapse,
  collapseRepairs,
  freeBits,
  informationLedger,
  interpolation,
  likelihoodScale,
  trainedVae,
} from './scenes/act3-scale-collapse-info.mjs';
import {
  codePrior,
  codes,
  freshCollision,
  spatialBudget,
  vqGradients,
} from './scenes/act4-vq-spatial-collision.mjs';

export default cinematicLesson({
  id: 'vae',
  accent: COSMOS.violet,
  invariants: verifyVaeInvariants,
  scenes: {
    intro,
    bottleneck,
    'decoder-pixel': decoderPixel,
    reconstruction,
    'code-test': codeTest,
    'training-baseline': trainingBaseline,
    posterior,
    'posterior-contract': posteriorContract,
    'kl-ledger': klLedger,
    sampling,
    'gradient-path': gradientPath,
    objective,
    'evidence-gap': evidenceGap,
    'likelihood-scale': likelihoodScale,
    'trained-vae': trainedVae,
    collapse,
    'information-ledger': informationLedger,
    'collapse-repairs': collapseRepairs,
    'free-bits': freeBits,
    interpolation,
    codes,
    'vq-gradients': vqGradients,
    'code-prior': codePrior,
    'spatial-budget': spatialBudget,
    'fresh-collision': freshCollision,
  },
});
