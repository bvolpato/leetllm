// Cinematic Vizmatic 0.10.0 stage film for RNN Memory (20 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyRnnInvariants } from './parts.mjs';
import actionHead from './scenes/action-head.mjs';
import actualCredit from './scenes/actual-credit.mjs';
import batchBoundaries from './scenes/batch-boundaries.mjs';
import compressionAttention from './scenes/compression-attention.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';
import eventOrder from './scenes/event-order.mjs';
import gradients from './scenes/gradients.mjs';
import gru from './scenes/gru.mjs';
import intro from './scenes/intro.mjs';
import learnedGru from './scenes/learned-gru.mjs';
import learnedLstm from './scenes/learned-lstm.mjs';
import lstm from './scenes/lstm.mjs';
import matrixBound from './scenes/matrix-bound.mjs';
import padding from './scenes/padding.mjs';
import parameterGeometry from './scenes/parameter-geometry.mjs';
import recurrence from './scenes/recurrence.mjs';
import retention from './scenes/retention.mjs';
import shared from './scenes/shared.mjs';
import truncation from './scenes/truncation.mjs';
import vectorBuild from './scenes/vector-build.mjs';

export default cinematicLesson({
  id: 'rnn-memory',
  accent: COSMOS.cyan,
  invariants: verifyRnnInvariants,
  scenes: {
    intro,
    recurrence,
    shared,
    'event-order': eventOrder,
    'vector-build': vectorBuild,
    'action-head': actionHead,
    'compression-attention': compressionAttention,
    'actual-credit': actualCredit,
    gradients,
    'matrix-bound': matrixBound,
    truncation,
    lstm,
    'learned-lstm': learnedLstm,
    retention,
    gru,
    'learned-gru': learnedGru,
    'parameter-geometry': parameterGeometry,
    padding,
    'batch-boundaries': batchBoundaries,
    'earned-transfer': earnedTransfer,
  },
});
