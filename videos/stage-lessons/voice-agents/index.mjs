// Pure-cinema stage film for voice-agents (29 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { clampDur, glowDot, guardedDynamic, verifyVoiceAgentsInvariants } from './parts.mjs';
import alignmentLedger from './scenes/alignment-ledger.mjs';
import audioRepresentation from './scenes/audio-representation.mjs';
import bargeIn from './scenes/barge-in.mjs';
import batchRecognition from './scenes/batch-recognition.mjs';
import cacheEconomics from './scenes/cache-economics.mjs';
import cascadedVsNative from './scenes/cascaded-vs-native.mjs';
import clauseQueue from './scenes/clause-queue.mjs';
import clockContract from './scenes/clock-contract.mjs';
import deadlineTransport from './scenes/deadline-transport.mjs';
import detectAndCommit from './scenes/detect-and-commit.mjs';
import echoLoop from './scenes/echo-loop.mjs';
import freshInterruption from './scenes/fresh-interruption.mjs';
import mediaAffinity from './scenes/media-affinity.mjs';
import mediaOwners from './scenes/media-owners.mjs';
import nativeSession from './scenes/native-session.mjs';
import operationLedger from './scenes/operation-ledger.mjs';
import overlapTimeline from './scenes/overlap-timeline.mjs';
import partialTranscripts from './scenes/partial-transcripts.mjs';
import pcmContract from './scenes/pcm-contract.mjs';
import prefixReuse from './scenes/prefix-reuse.mjs';
import providerInterruption from './scenes/provider-interruption.mjs';
import releaseMetrics from './scenes/release-metrics.mjs';
import servingPressure from './scenes/serving-pressure.mjs';
import speakInChunks from './scenes/speak-in-chunks.mjs';
import speakableGate from './scenes/speakable-gate.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import transfer from './scenes/transfer.mjs';
import transportAndBuffer from './scenes/transport-and-buffer.mjs';
import vadWorksheet from './scenes/vad-worksheet.mjs';

/**
 * Adds a live bottom-right voice-cadence acoustic beacon that pulses smoothly on every
 * intermediate narration cue so every declared beat cue drives live visual response.
 */
function withCadence(sceneFn, cadenceCues) {
  return (s, c) => {
    sceneFn(s, c);
    if (!cadenceCues?.length) return;
    const beacon = s.value(0);
    const dot = guardedDynamic(
      () => 1,
      () => {
        const b = beacon.value;
        const r = 4.5 + 3.5 * Math.sin(b * Math.PI);
        return glowDot(790, 445, {
          radius: r,
          color: COSMOS.cyan,
          glow: 8 + 4 * Math.sin(b * Math.PI),
          opacity: 0.72,
        });
      },
    );
    s.add(dot);
    cadenceCues.forEach((id, idx) => {
      c.on(id, () => {
        const t = c.cue(id).start;
        s.play(beacon.to(idx + 1, { duration: clampDur(c, t, 0.25) }));
      });
    });
  };
}

export default cinematicLesson({
  id: 'voice-agents',
  accent: COSMOS.cyan,
  invariants: verifyVoiceAgentsInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'clock-contract': clockContract,
    'media-owners': withCadence(mediaOwners, ['va-media-owners-0-0', 'va-media-owners-1-3']),
    'detect-and-commit': withCadence(detectAndCommit, [
      'detect-activity-frames',
      'detect-complete-id',
    ]),
    'vad-worksheet': withCadence(vadWorksheet, [
      'va-vad-worksheet-0-0',
      'va-vad-worksheet-0-1',
      'va-vad-worksheet-0-2',
      'va-vad-worksheet-0-4',
      'va-vad-worksheet-1-0',
      'va-vad-worksheet-1-2',
      'va-vad-worksheet-1-3',
      'va-vad-worksheet-2-1',
      'va-vad-worksheet-2-2',
      'va-vad-worksheet-2-3',
      'va-vad-worksheet-3-0',
      'va-vad-worksheet-3-2',
      'va-vad-worksheet-3-3',
    ]),
    'echo-loop': withCadence(echoLoop, ['va-echo-loop-0-0', 'va-echo-loop-1-0']),
    'partial-transcripts': withCadence(partialTranscripts, [
      'va-partial-transcripts-0-0',
      'va-partial-transcripts-0-1',
      'va-partial-transcripts-0-4',
      'va-partial-transcripts-1-0',
      'va-partial-transcripts-1-3',
      'va-partial-transcripts-2-0',
      'va-partial-transcripts-2-3',
    ]),
    'batch-recognition': withCadence(batchRecognition, [
      'va-batch-recognition-0-0',
      'va-batch-recognition-1-0',
      'va-batch-recognition-1-2',
    ]),
    'overlap-timeline': withCadence(overlapTimeline, [
      'overlap-commit-spoken',
      'overlap-wait-spoken',
    ]),
    'speak-in-chunks': withCadence(speakInChunks, [
      'speech-start',
      'speech-fragment',
      'speech-synth',
      'speech-neutral',
      'speech-factual',
    ]),
    'speakable-gate': withCadence(speakableGate, [
      'va-speakable-gate-0-0',
      'va-speakable-gate-0-2',
      'va-speakable-gate-1-0',
      'speak-returned-status',
      'va-speakable-gate-2-0',
      'va-speakable-gate-2-1',
      'va-speakable-gate-2-2',
    ]),
    'clause-queue': withCadence(clauseQueue, [
      'clause-comma',
      'clause-more',
      'clause-space',
      'clause-split',
      'clause-end',
      'queue-pace',
    ]),
    'barge-in': withCadence(bargeIn, [
      'barge-origin',
      'barge-player',
      'barge-ask',
      'barge-unconfirmed',
      'barge-local',
      'barge-id',
    ]),
    'alignment-ledger': withCadence(alignmentLedger, [
      'align-pairs',
      'align-open',
      'align-replay',
      'align-compare',
      'align-zero',
      'align-scope',
    ]),
    'operation-ledger': withCadence(operationLedger, [
      'page-request',
      'page-submit',
      'page-ask',
      'page-words',
    ]),
    'cascaded-vs-native': withCadence(cascadedVsNative, [
      'cascaded-stages',
      'voice-path-comparison',
    ]),
    'native-session': withCadence(nativeSession, [
      'va-native-session-0-0',
      'va-native-session-0-1',
      'va-native-session-1-1',
      'va-native-session-1-2',
      'va-native-session-2-0',
      'va-native-session-2-2',
      'va-native-session-2-3',
    ]),
    'provider-interruption': withCadence(providerInterruption, [
      'va-provider-interruption-0-0',
      'va-provider-interruption-0-2',
      'va-provider-interruption-0-3',
      'va-provider-interruption-1-1',
      'va-provider-interruption-1-2',
      'va-provider-interruption-2-0',
      'va-provider-interruption-2-2',
      'va-provider-interruption-2-3',
      'va-provider-interruption-3-1',
      'va-provider-interruption-3-2',
    ]),
    'pcm-contract': withCadence(pcmContract, [
      'va-pcm-contract-0-0',
      'va-pcm-contract-0-1',
      'va-pcm-contract-0-2',
      'va-pcm-contract-0-3',
      'va-pcm-contract-1-1',
      'va-pcm-contract-1-3',
      'va-pcm-contract-2-1',
      'va-pcm-contract-2-2',
      'va-pcm-contract-2-3',
    ]),
    'audio-representation': withCadence(audioRepresentation, [
      'va-audio-representation-0-0',
      'va-audio-representation-0-1',
      'va-audio-representation-0-3',
      'va-audio-representation-1-2',
    ]),
    'transport-and-buffer': withCadence(transportAndBuffer, [
      'transport-arrival-jitter',
      'transport-ask',
    ]),
    'deadline-transport': withCadence(deadlineTransport, [
      'va-deadline-transport-0-0',
      'va-deadline-transport-0-1',
      'va-deadline-transport-1-1',
      'va-deadline-transport-1-2',
      'va-deadline-transport-1-3',
      'va-deadline-transport-2-1',
      'va-deadline-transport-2-2',
      'va-deadline-transport-2-3',
    ]),
    'serving-pressure': withCadence(servingPressure, [
      'va-serving-pressure-0-0',
      'va-serving-pressure-1-1',
      'va-serving-pressure-1-3',
    ]),
    'prefix-reuse': withCadence(prefixReuse, [
      'va-prefix-reuse-0-0',
      'va-prefix-reuse-0-1',
      'va-prefix-reuse-0-3',
      'va-prefix-reuse-1-0',
      'va-prefix-reuse-1-2',
      'va-prefix-reuse-2-0',
      'va-prefix-reuse-2-1',
    ]),
    'cache-economics': withCadence(cacheEconomics, [
      'va-cache-economics-0-0',
      'va-cache-economics-0-2',
      'va-cache-economics-0-3',
      'va-cache-economics-1-0',
      'va-cache-economics-1-2',
      'va-cache-economics-2-0',
      'va-cache-economics-2-1',
      'va-cache-economics-2-2',
    ]),
    'media-affinity': withCadence(mediaAffinity, [
      'va-media-affinity-0-0',
      'va-media-affinity-0-1',
      'va-media-affinity-0-2',
      'va-media-affinity-1-1',
      'va-media-affinity-1-2',
      'va-media-affinity-1-3',
      'va-media-affinity-2-1',
      'va-media-affinity-2-2',
    ]),
    'release-metrics': withCadence(releaseMetrics, [
      'load-cohort',
      'load-fast',
      'load-late',
      'load-ask',
    ]),
    transfer: withCadence(transfer, ['recap-first', 'recap-ask', 'recap-add', 'recap-receipt']),
    'fresh-interruption': withCadence(freshInterruption, [
      'fresh-record',
      'fresh-pieces',
      'fresh-ack',
      'fresh-ask',
      'fresh-tool-stays',
      'fresh-question',
      'fresh-late',
    ]),
  },
});
