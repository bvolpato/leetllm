import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import clockContract from './stages/clock-contract.mjs';
import mediaOwners from './stages/media-owners.mjs';
import detectAndCommit from './stages/detect-and-commit.mjs';
import vadWorksheet from './stages/vad-worksheet.mjs';
import echoLoop from './stages/echo-loop.mjs';
import partialTranscripts from './stages/partial-transcripts.mjs';
import batchRecognition from './stages/batch-recognition.mjs';
import overlapTimeline from './stages/overlap-timeline.mjs';
import speakInChunks from './stages/speak-in-chunks.mjs';
import speakableGate from './stages/speakable-gate.mjs';
import operationLedger from './stages/operation-ledger.mjs';
import clauseQueue from './stages/clause-queue.mjs';
import bargeIn from './stages/barge-in.mjs';
import alignmentLedger from './stages/alignment-ledger.mjs';
import cascadedVsNative from './stages/cascaded-vs-native.mjs';
import nativeSession from './stages/native-session.mjs';
import providerInterruption from './stages/provider-interruption.mjs';
import pcmContract from './stages/pcm-contract.mjs';
import audioRepresentation from './stages/audio-representation.mjs';
import transportAndBuffer from './stages/transport-and-buffer.mjs';
import deadlineTransport from './stages/deadline-transport.mjs';
import servingPressure from './stages/serving-pressure.mjs';
import prefixReuse from './stages/prefix-reuse.mjs';
import cacheEconomics from './stages/cache-economics.mjs';
import mediaAffinity from './stages/media-affinity.mjs';
import releaseMetrics from './stages/release-metrics.mjs';
import transfer from './stages/transfer.mjs';
import freshInterruption from './stages/fresh-interruption.mjs';
export { voiceLateAck, voiceReconcile, voiceWorksheet } from './arithmetic.mjs';
export { voiceDirection } from './construction.mjs';
export { holdSounds } from './echo-probe.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'voice-agents',
  validateModel,
  scenes: [
    subjectIntro,
    clockContract,
    mediaOwners,
    detectAndCommit,
    vadWorksheet,
    echoLoop,
    partialTranscripts,
    batchRecognition,
    overlapTimeline,
    speakInChunks,
    speakableGate,
    clauseQueue,
    bargeIn,
    alignmentLedger,
    operationLedger,
    cascadedVsNative,
    nativeSession,
    providerInterruption,
    pcmContract,
    audioRepresentation,
    transportAndBuffer,
    deadlineTransport,
    servingPressure,
    prefixReuse,
    cacheEconomics,
    mediaAffinity,
    releaseMetrics,
    transfer,
    freshInterruption,
  ],
});
export const draw = definition.draw;
export default definition;
