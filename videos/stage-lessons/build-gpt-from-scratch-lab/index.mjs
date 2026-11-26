// Cinematic Vizmatic 0.10.0 stage film for Build a Tiny GPT from Scratch (18 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyGptLabInvariants } from './parts.mjs';
import architectureChoices from './scenes/architecture-choices.mjs';
import byteBoundaries from './scenes/byte-boundaries.mjs';
import changedContract from './scenes/changed-contract.mjs';
import checkpoints from './scenes/checkpoints.mjs';
import compactDenominator from './scenes/compact-denominator.mjs';
import corpusExposure from './scenes/corpus-exposure.mjs';
import forward from './scenes/forward.mjs';
import generationChoice from './scenes/generation-choice.mjs';
import intro from './scenes/intro.mjs';
import kernelDiagnostics from './scenes/kernel-diagnostics.mjs';
import loss from './scenes/loss.mjs';
import mask from './scenes/mask.mjs';
import prelnBlock from './scenes/preln-block.mjs';
import resumeFork from './scenes/resume-fork.mjs';
import resume from './scenes/resume.mjs';
import streamBoundaries from './scenes/stream-boundaries.mjs';
import targets from './scenes/targets.mjs';
import vocab from './scenes/vocab.mjs';

export default cinematicLesson({
  id: 'build-gpt-from-scratch-lab',
  accent: COSMOS.cyan,
  invariants: verifyGptLabInvariants,
  scenes: {
    intro,
    targets,
    'byte-boundaries': byteBoundaries,
    vocab,
    'compact-denominator': compactDenominator,
    'corpus-exposure': corpusExposure,
    'stream-boundaries': streamBoundaries,
    mask,
    forward,
    loss,
    'preln-block': prelnBlock,
    checkpoints,
    'generation-choice': generationChoice,
    resume,
    'resume-fork': resumeFork,
    'architecture-choices': architectureChoices,
    'kernel-diagnostics': kernelDiagnostics,
    'changed-contract': changedContract,
  },
});
