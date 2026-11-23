import { narratedLesson } from "../../lib/narrated-lesson.mjs";
import intro from "./scenes/intro.mjs";
import recurrence from "./scenes/recurrence.mjs";
import shared from "./scenes/shared.mjs";
import eventOrder from "./scenes/event-order.mjs";
import vectorBuild from "./scenes/vector-build.mjs";
import actionHead from "./scenes/action-head.mjs";
import compressionAttention from "./scenes/compression-attention.mjs";
import actualCredit from "./scenes/actual-credit.mjs";
import gradients from "./scenes/gradients.mjs";
import matrixBound from "./scenes/matrix-bound.mjs";
import truncation from "./scenes/truncation.mjs";
import lstm from "./scenes/lstm.mjs";
import learnedLstm from "./scenes/learned-lstm.mjs";
import retention from "./scenes/retention.mjs";
import gru from "./scenes/gru.mjs";
import learnedGru from "./scenes/learned-gru.mjs";
import parameterGeometry from "./scenes/parameter-geometry.mjs";
import padding from "./scenes/padding.mjs";
import batchBoundaries from "./scenes/batch-boundaries.mjs";
import earnedTransfer from "./scenes/earned-transfer.mjs";

export default narratedLesson({
  id: "rnn-memory",
  scenes: {
    intro,
    recurrence,
    shared,
    "event-order": eventOrder,
    "vector-build": vectorBuild,
    "action-head": actionHead,
    "compression-attention": compressionAttention,
    "actual-credit": actualCredit,
    gradients,
    "matrix-bound": matrixBound,
    truncation,
    lstm,
    "learned-lstm": learnedLstm,
    retention,
    gru,
    "learned-gru": learnedGru,
    "parameter-geometry": parameterGeometry,
    padding,
    "batch-boundaries": batchBoundaries,
    "earned-transfer": earnedTransfer,
  },
});
