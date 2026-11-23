---
{
  "id": "design-real-time-voice-ai-agent",
  "slug": "design-real-time-voice-ai-agent",
  "title": "Real-Time Voice AI Agent",
  "shortDescription": "A caller inquires about incident 4219. Design a real-time voice agent that achieves sub-500ms time-to-first-audio, handles instant barge-in interruption, and reconciles confirmed playout.",
  "difficulty": "Hard",
  "category": "System Design",
  "section": "System Design Capstones",
  "coverImage": "illustrations/_generated/voice_agent_dark.png",
  "companies": [
    "OpenAI",
    "Google",
    "Hume AI",
    "ElevenLabs",
    "Retell AI"
  ],
  "prerequisites": [
    "image-generation-diffusion-models",
    "multimodal-llms-architecture-design",
    "inference-mechanics-ttft-tps-kv-cache",
    "kv-cache-paged-attention-llm-serving",
    "continuous-batching-request-scheduling",
    "speculative-decoding",
    "model-gateways-routing-fallbacks",
    "function-calling-tool-use-llms"
  ],
  "relatedQuestions": [
    "design-conversational-ai-support-bot",
    "design-reasoning-agent-test-time-compute",
    "computer-use-gui-browser-agents",
    "observability-monitoring-llm-systems",
    "model-gateways-routing-fallbacks",
    "design-multi-tenant-llm-serving-platform"
  ],
  "order": 9,
  "keyConceptsTested": [
    "Speech-to-Text",
    "Text-to-Speech",
    "WebRTC",
    "Voice Activity Detection",
    "Turn Detection",
    "Streaming Inference",
    "Prefix-Aware Prompt Caching",
    "KV Cache Management",
    "Speculative Decoding",
    "Interruption Handling",
    "Multimodal LLMs",
    "Latency Budgets",
    "Jitter Buffers",
    "NetEQ"
  ]
}
---

A real-time voice agent must listen, answer, and stop speaking without losing track of the conversation. A caller dials an incident response hotline and asks, "What is incident four two one nine?" Two seconds later, incoming audio frames still reach the server, but no answer has reached the speaker. To the caller, a slow model and a dropped call feel indistinguishable.

The serving lessons explained time-to-first-token, caching, and streaming. Those clocks stop when a token leaves the server. The caller hears an answer only when playback starts on the device. The inspectable default is a cascade of speech-to-text, a language model, and text-to-speech. Native audio is the comparison once that path has a budget. The Python examples are CPU simulations of timing and state contracts, not recordings, speech-model calls, or measured service benchmarks.

In a study of question-response sequences across ten languages, Stivers et al. found a mean response offset of 208ms, with language-specific means within about 250ms of it.[^stivers2009] Use that result as context when setting a latency objective. Target a 500ms speech-end-to-first-audio <span data-glossary="slo">SLO</span>, measured separately for each supported network and device group.

```checkpoint
What makes voice agents harder than text chat?
---
Voice is continuous and time-sensitive. Silence, overlap, jitter, and interruptions are part of the interface, so the system must stream every stage and maintain state about what the user actually heard.
```

## The latency illusion

If the agent takes too long to reply, the caller assumes the system missed the prompt and repeats it. That second attempt overlaps the late first answer, and the call unravels.

Before picking a model, name the clock you need to win. If acoustic speech ends at `0ms` but endpointing commits at `300ms`, no decoder can recover those 300ms. If first audio is late after a quick commit, look at generation, synthesis, transport, and playout instead.

A useful product target for this incident line is a measured <span data-glossary="time-to-first-audio">time-to-first-audio (TTFA)</span> budget around 500ms on the network and device slices you intend to support. Endpoint policy, tools, model choice, and jitter move the distribution, so ship from p50/p95, not from one lucky trace. Research systems such as AudioPaLM and SpeechGPT showed that speech-native models can collapse some of the speech-recognition, language-model, and speech-synthesis hops,[^rubenstein2023][^zhang2023a] but cascaded pipelines remain the right default when you need inspectable transcripts, vendor swaps, or deterministic tool gates. Some of those hops can begin before the caller finishes reciting the incident number, and the pipeline must explicitly coordinate them.

```checkpoint
Why might a team set a 500ms first-audio target instead of accepting a 2-second pause?
---
Human turn-taking expects quick feedback. A measured first-audio target near 500ms can preserve conversational flow on supported paths; a two-second silent tail is much more likely to be perceived as a missed turn or failed call.
```

## One packet through the incident-status agent

Speech-to-text can start during the utterance. A factual answer and any tool with a side effect have to wait for a committed turn. The audio still passes through four core stages before the caller hears a response:

1. **Listen (Voice Activity Detection):** The system detects when the caller starts speaking and when speech concludes. VAD gates speech boundaries; a separate noise-suppression stage reduces noise mixed with speech.
2. **Transcribe (Speech-to-Text):** Audio is converted to text. This must happen *while* the caller is speaking (streaming), rather than waiting for acoustic silence.
3. **Think (Large Language Model):** The model may prepare from stable partial transcripts, but the orchestrator must not speak a factual answer or execute a side effect until turn-commit policy accepts the input. Once committed, it streams the answer in speakable chunks.
4. **Speak (Text-to-Speech):** The voice synthesis engine reads the first few words as soon as they arrive from the LLM, without waiting for the full sentence.

Those overlaps must deliver first audio inside the measured latency budget while supporting seamless interruption. Set that budget before choosing components.

## The latency budget: a worked example

The hotline requires full-duplex communication: the caller can interrupt at any time, the agent queries incident state, and first audio arrives within the target budget.

### Core requirements for full-duplex voice
- Maintain a full-duplex channel: the caller can interrupt while the agent is speaking.
- Turn speech into a committed incident query, not a guess from the first partial.
- Look up incident 4219 and summarize severity without blocking the first spoken clause.
- Start speaking as soon as a stable clause exists.
- Mute speaker playback the instant user speech is detected.

### Example service objectives
- Speech-end to first audio: Track p50 and <span data-glossary="p95-latency">p95</span> from the acoustic end of user speech to first played assistant audio. This is the user-visible end-to-end clock; an operations line might start with a p95 target of 500ms on declared network slices.
- Commit to first audio: Track the internal clock from accepted turn commitment to first played audio. A route might start with a p95 target of 400ms. This excludes endpointing delay and makes post-commit LLM, TTS, and playout regressions easier to isolate.
- Mute on <span data-glossary="barge-in">barge-in</span>: Track user-speech onset to muted playback; a product might set a p95 target of 100ms.
- Concurrency: Size media and inference tiers from forecast active sessions and measured per-session work, rather than assuming `10k+`.
- Audio path: Negotiate supported codecs and sample rates, then measure jitter, loss, and intelligibility by device class.
- Availability: Choose an error budget for the call product and include media-connect, model, and tool failure modes.

### Latency budget breakdown

Use 500ms speech-end TTFA and 400ms commit-to-audio as example targets, not laws of physics. A deployed route must report both distributions across p50, p95, and p99 <span data-glossary="tracing">traces</span> rather than a single happy-path budget.

<figure>
  <img src="illustrations/_generated/latency_budget_dark.png" alt="A synthetic voice schedule starts at acoustic speech end. Turn commit spans 0–60 ms, STT finalization 0–100 ms, the LLM clause 60–240 ms, the TTS chunk 210–345 ms, and playout 345–380 ms. First audio is 380 ms from speech end and 320 ms from turn commit. STT was already streaming during speech." />
  <figcaption>The user clock starts at acoustic speech end. The internal clock starts later at turn commit. Streaming work overlaps both, which is why first audio is 380ms rather than the 510ms serial sum.</figcaption>
</figure>

Trace the ranges from one shared event: acoustic speech end at `0ms`. Streaming STT has already been consuming frames during the utterance, so only its finalization tail remains after speech ends. Read-only preparation may also be warm before commit. <span data-glossary="text-to-speech">TTS</span> starts only after an accepted turn yields a stable speakable clause.

Keep the two clocks separate. Speech-end TTFA includes endpointing and commit delay. Commit-to-audio starts at the accepted boundary and measures the internal response path. Streaming <span data-glossary="speech-to-text">STT</span> begins during speech rather than waiting for either clock.

Consider this representative schedule for a user query. At 60ms the endpoint policy accepts that the turn ended, while STT finalization completes by 100ms. The first clause acknowledges the inquiry without asserting facts about an incident whose status remains unresolved:

| Stage | Position relative to acoustic speech end | What's happening |
|-------|------------------------------------------|------------------|
| **Streaming STT partials** | Begin during speech, often before `0ms` | Decoder emits "What is incident" while the caller is still talking |
| **Turn commit** | `0-60ms` | Semantic end-of-turn accepts that the caller's query is complete rather than relying solely on a fixed silence threshold |
| **STT finalization tail** | `0-100ms` | Final transcript catches up with audio already streamed during speech |
| **First speakable LLM tokens / clause fragment** | `60-240ms` | Post-commit generation streams tokens; a speakable fragment can be ready before the full clause ends |
| **First TTS chunk** | `210-345ms` | Synthesizer starts on the first speakable fragment (here at 210ms), while the clause may still finish at 240ms |
| **Playout buffer** | `345-380ms` | Jitter buffer smooths network <span data-glossary="variance">variance</span> before the speaker |

If the post-speech spans ran one after another, their durations would add to about 510ms. In practice:
- STT begins decoding before the caller finishes saying "incident," preventing acoustic decoding cost from stacking after speech ends.
- The orchestrator can pre-classify intent or start a cancellable read-only lookup from stable words; it can't commit an incident number, speak a result, or perform a side effect from an unstable transcript.
- After turn commitment, TTS starts synthesizing a speakable acknowledgement such as "I'll check that," before the full clause is finished. This overlap lets the TTS window open at 210ms while the LLM clause window still ends at 240ms. Finding the incident remains a separate tool result.
- The `0-60ms` commit window assumes semantic end-of-turn or an early-commit policy, not a fixed ~300ms silence threshold alone. Pure silence endpointing that waits ~300ms after speech end can't hit a 60ms commit; use the longer silence budget only when semantic EOT is unavailable or unreliable.

This candidate trace plays first audio 380ms after acoustic speech end and 320ms after turn commit. Those numbers describe one path, not a <span data-glossary="rollout">rollout</span> decision. Ship only after measuring p50/p95 for both clocks alongside incorrect-commit rate, <span data-glossary="endpointing">endpointing</span> aggressiveness, model size, and network jitter.

<!-- leetllm: test, output=show -->
```python title="accounting-for-overlapped-first-audio.py"
import json

# One synthetic schedule, in milliseconds after acoustic speech end.
spans = {
    "endpoint_commit": (0, 60),
    "stt_finalization": (0, 100),
    "llm_first_clause": (60, 240),
    "tts_first_chunk": (210, 345),
    "playout_buffer": (345, 380),
}
speech_end_ms = 0
turn_commit_ms = spans["endpoint_commit"][1]
first_audio_ms = spans["playout_buffer"][1]
speech_end_target_ms = 500
commit_target_ms = 400

print(json.dumps({
    "sequential_sum_ms": sum(end - start for start, end in spans.values()),
    "speech_end_to_first_audio_ms": first_audio_ms - speech_end_ms,
    "commit_to_first_audio_ms": first_audio_ms - turn_commit_ms,
    "speech_end_target_ms": speech_end_target_ms,
    "commit_target_ms": commit_target_ms,
    "meets_speech_end_trace_target": first_audio_ms - speech_end_ms <= speech_end_target_ms,
    "meets_commit_trace_target": first_audio_ms - turn_commit_ms <= commit_target_ms,
    "ship_decision_requires_p95": True,
}, indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{
  "sequential_sum_ms": 510,
  "speech_end_to_first_audio_ms": 380,
  "commit_to_first_audio_ms": 320,
  "speech_end_target_ms": 500,
  "commit_target_ms": 400,
  "meets_speech_end_trace_target": true,
  "meets_commit_trace_target": true,
  "ship_decision_requires_p95": true
}
```
<!-- leetllm: output:end -->

```checkpoint
Why is the sequential latency sum misleading?
---
Production voice pipelines overlap stages. STT starts during speech, reversible preparation can start from stable partials, and TTS can synthesize the first accepted clause before the full answer is done. Measure speech-end-to-audio for user experience and commit-to-audio for the internal response path.
```

## How the pieces fit together

The architecture usually separates three concerns: client-side capture and playback, a latency-sensitive media edge, and the inference pipeline. Picture a call where the LLM p95 stays flat but mobile callers begin hearing gaps. That points first to packet timing, echo, or playout state at the media edge, not to model execution. Decoupling transport from inference makes that diagnosis possible.

In many deployments, a media gateway terminates <span data-glossary="webrtc">WebRTC (Web Real-Time Communication)</span> or SIP (Session Initiation Protocol), handles jitter buffers and routing, then forwards audio to inference over an internal low-latency link.[^perkins2021] A media gateway can serve a 1:1 assistant; multi-party rooms use an SFU (Selective Forwarding Unit) to selectively forward participant streams. Serious deployments also benefit from a dedicated ingress tier close to the user.

Within inference, the voice pipeline orchestrates turn detection, STT or native-audio encoding, LLM reasoning, tool calls, and TTS or audio decoding. A conversation state manager sits alongside the pipeline, keeping track of dialogue turns, client playout offsets, and tool results so the model only commits to what the user heard.

<figure>
  <img src="illustrations/_generated/voice_agent_dark.png" alt="The voice hot path runs microphone, media edge, turn detection and STT, LLM and tools, then TTS and playout. A separate local-VAD lane mutes and cancels speech with a p95 target under 100 ms. A confirmed-playout lane stores client acknowledgments in the heard ledger for the next turn." />
  <figcaption>Keep the speech path short. Mute-on-barge-in and confirmed-playout accounting run in side lanes so they don't add hops to every audio packet.</figcaption>
</figure>

The top row is the hot path. The bottom lanes are control planes: mute as soon as local VAD detects caller speech, then record only audio whose playout the client acknowledged. A healthy model can't repair a media path that has already missed its playout deadline.

```checkpoint
Why split media transport from inference orchestration?
---
Audio transport handles jitter, packet loss, echo, routing, and playback timing. Inference handles STT, tools, LLM, and TTS. Their failure modes and scaling profiles differ.
```

## Knowing when to listen: voice activity detection

Voice Activity Detection (VAD) gives the system frame-level evidence that the user is speaking. During an incident-status query, that evidence can initiate capture and trigger instant muting, but it cannot determine whether the caller's thought is complete.

VAD isn't the same thing as turn detection. VAD estimates speech presence in audio windows. Turn detection (endpointing) decides when the user's *turn* has finished. A hybrid policy can combine silence duration, transcript stability, and a model's estimate of semantic completeness. That permits different waits for "incident four ..." and "thank you," rather than treating every pause alike.[^livekit2026turn] Local VAD can still provide the fast interruption signal.

Consider a caller saying, "incident four ... two ... one ... nine" with pauses between digits. Frame-level VAD may observe brief silence after four; a naive endpoint committing there dispatches an incomplete identifier downstream. Semantic endpointing holds the turn through those pauses, then commits once the request is semantically complete. The faster signal mutes playback, while the richer signal owns transcript and tool commitment.

Client-side VAD can mute without a network round trip; withholding silence from upload is a separate capture policy. Server-side detection centralizes tuning and can use richer context. The state machine below processes 20ms frame speech probabilities; production VAD models such as Silero VAD enforce specific sample rates (8 kHz or 16 kHz) and frame sizes.[^silero2021]

<!-- leetllm: test, output=show -->
```python title="knowing-when-to-listen-voice-activity.py"
from collections import deque
from dataclasses import asdict, dataclass
import json

@dataclass
class VADEvent:
    type: str
    frame: int
    audio_ms: int

class VoiceActivityDetector:
    """Detect speech boundaries from one probability per 20ms audio frame."""

    def __init__(
        self,
        frame_ms: int = 20,
        speech_threshold: float = 0.5,
        silence_duration_ms: int = 60,
        prefix_padding_ms: int = 40,
    ):
        if frame_ms <= 0 or silence_duration_ms <= 0 or prefix_padding_ms < 0:
            raise ValueError("invalid frame, silence, or padding duration")
        if not (0.0 <= speech_threshold <= 1.0):
            raise ValueError("threshold must be finite and in [0, 1]")
        self.frame_ms = frame_ms
        self.speech_threshold = speech_threshold
        self.silence_frames_required = (silence_duration_ms + frame_ms - 1) // frame_ms
        self.pre_roll = deque(maxlen=(prefix_padding_ms + frame_ms - 1) // frame_ms)
        self.next_frame = 0
        self.speech_frames: list[int] = []
        self.in_speech = False
        self.trailing_silence = 0

    def process_frame(self, frame_id: int, probability: float) -> VADEvent | None:
        """Return speech boundary events for one audio frame."""
        if frame_id != self.next_frame:
            raise ValueError("frames must be contiguous from zero")
        if probability is True or probability is False or not (0.0 <= probability <= 1.0):
            raise ValueError("probability must be finite and in [0, 1]")
        self.next_frame += 1
        if probability >= self.speech_threshold:
            if not self.in_speech:
                self.in_speech = True
                self.speech_frames = list(self.pre_roll)
                self.speech_frames.append(frame_id)
                self.trailing_silence = 0
                return VADEvent("speech_start", frame_id, len(self.speech_frames) * self.frame_ms)
            self.speech_frames.append(frame_id)
            self.trailing_silence = 0
            return None

        if not self.in_speech:
            self.pre_roll.append(frame_id)
            return None

        self.speech_frames.append(frame_id)
        self.trailing_silence += 1
        if self.trailing_silence < self.silence_frames_required:
            return None

        utterance_frames = self.speech_frames[:-self.trailing_silence]
        self.in_speech = False
        self.speech_frames = []
        self.trailing_silence = 0
        self.pre_roll.clear()
        self.pre_roll.extend(range(frame_id - self.silence_frames_required + 1, frame_id + 1))
        return VADEvent("speech_end", frame_id, len(utterance_frames) * self.frame_ms)

probabilities = [0.04, 0.08, 0.66, 0.74, 0.69, 0.22, 0.15, 0.09]
detector = VoiceActivityDetector()
assert VoiceActivityDetector(silence_duration_ms=61).silence_frames_required == 4
events = []

for frame_id, probability in enumerate(probabilities):
    event = detector.process_frame(frame_id, probability)
    if event:
        events.append(asdict(event))

print(json.dumps(events, indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[
  {
    "type": "speech_start",
    "frame": 2,
    "audio_ms": 60
  },
  {
    "type": "speech_end",
    "frame": 7,
    "audio_ms": 100
  }
]
```
<!-- leetllm: output:end -->

The demo uses 60ms of silence so its output fits in eight frames. `audio_ms` counts retained frames, including pre-roll; it isn't the amount of detected speech. A 61ms threshold needs four 20ms frames (80ms), so the code rounds up. It also rejects missing or reordered frames rather than silently shortening time. A live implementation needs a policy for gaps, maximum utterance length, and flushing when the stream closes.

A phone support bot might experiment with 300ms, then tune false cutoffs against lag. Semantic endpointing can hold through a pause inside an incident number or commit earlier when the request appears complete. Measure both latency and cutoffs across pause-heavy speech, accents, noise, and supported languages.[^livekit2026turn]

### VAD deployment: client vs. server

Choosing where to run VAD changes responsiveness, bandwidth, and operational control.

| Feature | Client-Side VAD | Server-Side Detection |
| :--- | :--- | :--- |
| **Barge-in reaction** | Can mute local playout without a network round trip | Includes transport delay before server action reaches playback |
| **Bandwidth** | Can suppress silence if upload policy uses its output | Receives the configured upstream stream continuously |
| **Operational control** | Requires testing across device/browser classes | Centralizes threshold and model tuning |
| **Turn consistency** | Device signals may differ | Can apply one server-side commit policy |
| **Data exposure** | Reduced only if capture/upload policy withholds silent frames | Depends on retained audio and server policy |

Many production systems use both: local VAD to mute playback without a network round trip, plus server-side turn detection to accept turn boundaries. A local false positive is an interruption defect; a server false positive can truncate a number or fire a tool. Log each event with its type and device class: speech onset and turn completion are different events, so their timestamp difference alone isn't a disagreement.

<figure>
  <img src="illustrations/_generated/vad_topology_dark.png" alt="Audio splits into local voice activity detection, which mutes playback without waiting for the network, and server endpointing, which commits a stable transcript boundary. A decision trace records speech onset and turn endpoint separately by device class." />
  <figcaption>Local speech onset can mute playback; server turn completion permits commitment. Trace both decisions by event type and device, then compare equivalent boundaries when investigating a mismatch.</figcaption>
</figure>

```checkpoint
Why run both local VAD and server-side turn detection?
---
Local VAD can mute local playback quickly and can suppress silence before upload when configured to do so. Server-side detection (silence endpointing plus a semantic end-of-turn model) gives centralized boundaries and richer context for deciding when the turn is truly complete, beyond the moment audio goes quiet.
```

### Acoustic echo cancellation (AEC)

<span data-glossary="echo-cancellation">Acoustic echo cancellation (AEC)</span> prevents the agent from hearing itself. When the agent speaks and the user interrupts, the microphone picks up both the user's voice and the agent's own output playing from the speaker. Without AEC, the VAD would trigger on the agent's voice, creating an echo loop where the agent transcribes its own speech and responds to it.

Modern browser capture stacks expose echo-cancellation constraints so applications can request microphone input with system or remote audio removed before it reaches VAD and STT.[^w3cMediaCapture] The browser or device owns that processing, and implementations vary. Treat the constraint as a request, then test the resulting audio path across speaker volume, microphone placement, rooms, and device classes.

One common failure is deploying voice agents without AEC testing in real acoustic environments. Laptop speakers and microphones placed close together, as in mobile phones, create strong echo that untested AEC configurations may fail to suppress. The symptom is immediate: the agent interrupts itself.

```checkpoint
What happens if echo cancellation fails during agent playback?
---
The microphone can capture the agent's own voice, VAD treats it as user speech, STT transcribes it, and the agent can interrupt or respond to itself.
```

## From sound to text: speech-to-text

Two primary approaches exist for real-time STT. Streaming STT allows the system to recognize "What is incident" before the caller finishes pronouncing the word. That early text is useful only if the orchestrator knows which actions are safe to reverse.

### Streaming STT (recommended for latency)

Streaming STT sends partial transcripts as audio arrives, allowing the LLM to pre-read the turn and start cancellable, read-only preparation before the utterance is complete. Provider SDKs differ, but the <span data-glossary="state-machine">state machine</span> must separate unstable interim text from committed text that may enter history, trigger tools, or reach TTS.

<!-- leetllm: test, output=show -->
```python title="streaming-stt-recommended-for-latency.py"
from dataclasses import asdict, dataclass
import json

@dataclass
class TranscriptEvent:
    kind: str
    text: str
    stable_prefix: str

def common_prefix(left: str, right: str) -> str:
    shared = []
    for left_word, right_word in zip(left.split(), right.split()):
        if left_word != right_word:
            break
        shared.append(left_word)
    return " ".join(shared)

def emit_transcript_events(partials: list[tuple[str, bool]]) -> list[TranscriptEvent]:
    events = []
    previous_text = ""

    for text, is_final in partials:
        if is_final is not True and is_final is not False:
            raise ValueError("is_final must be boolean")
        stable_prefix = text if is_final else common_prefix(previous_text, text)

        if is_final:
            events.append(TranscriptEvent("final", text, stable_prefix))
        else:
            events.append(TranscriptEvent("interim", text, stable_prefix))
        previous_text = text

    return events

partials = [
    ("What is", False),
    ("What is incident", False),
    ("What is incident number four two", False),
    ("What is incident number four two one nine?", True),
]

print(json.dumps([asdict(event) for event in emit_transcript_events(partials)], indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[
  {
    "kind": "interim",
    "text": "What is",
    "stable_prefix": ""
  },
  {
    "kind": "interim",
    "text": "What is incident",
    "stable_prefix": "What is"
  },
  {
    "kind": "interim",
    "text": "What is incident number four two",
    "stable_prefix": "What is incident"
  },
  {
    "kind": "final",
    "text": "What is incident number four two one nine?",
    "stable_prefix": "What is incident number four two one nine?"
  }
]
```
<!-- leetllm: output:end -->

The shared-prefix heuristic is intentionally conservative: it only exposes words repeated across two successive hypotheses. Even that prefix is tentative because a provider can revise earlier words later. Ask what should happen when the partial reads `Close incident four two one nine`: classify it and prefetch a read-only record, but don't write history, speak a result, or close anything. The commit boundary matters most when a partial transcript changes meaning. An incident lookup may be safe to prefetch and discard; closing an incident or promising mitigation status isn't.

<!-- leetllm: test, output=show -->
```python title="gating-work-on-transcript-commit.py"
import json

def permitted_actions(text: str, committed: bool) -> list[str]:
    if committed is not True and committed is not False:
        raise ValueError("committed must be boolean")
    actions = ["classify_intent"]
    if "incident" in text.lower():
        actions.append("prefetch_read_only_status")
    if committed:
        actions.extend(["write_history", "speak_response"])
        if "close" in text.lower():
            actions.append("ask_for_close_confirmation")
    return actions

events = [
    {"text": "Close incident four two one nine", "committed": False},
    {"text": "Show incident four two one nine", "committed": True},
    {"text": "Show incident four two one nine", "committed": "false"},
]

decisions = []
for event in events:
    try:
        decisions.append({"committed": event["committed"], "actions": permitted_actions(**event)})
    except ValueError as error:
        decisions.append({"committed": event["committed"], "error": str(error)})

assert "speak_response" not in permitted_actions(events[0]["text"], False)
assert "speak_response" in permitted_actions(events[1]["text"], True)
assert "error" in decisions[2]
print(json.dumps(decisions, indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[
  {
    "committed": false,
    "actions": [
      "classify_intent",
      "prefetch_read_only_status"
    ]
  },
  {
    "committed": true,
    "actions": [
      "classify_intent",
      "prefetch_read_only_status",
      "write_history",
      "speak_response"
    ]
  },
  {
    "committed": "false",
    "error": "committed must be boolean"
  }
]
```
<!-- leetllm: output:end -->

JSON `false` is a boolean; `"false"` is a nonempty string and therefore truthy in Python. The third event must be rejected rather than committing speech and history. Validate the adapter's flags before this gate; a well-typed flag still needs an authoritative turn/transcript decision and caller authorization.

### End-of-utterance STT

Using a batch recognizer such as Whisper[^radford2022] after an endpoint event is much simpler, but it adds the endpoint wait and full decode after the user stops talking.

<!-- leetllm: test, output=show -->
```python title="end-of-utterance-stt-simpler-slightly-higher.py"
import json

def batch_stt_timeline(speech_ms: int, endpoint_ms: int, decode_ms: int) -> dict[str, int | str]:
    acoustic_speech_end_ms = speech_ms
    turn_commit_ms = acoustic_speech_end_ms + endpoint_ms
    transcript_ready_ms = turn_commit_ms + decode_ms
    return {
        "approach": "end-of-utterance",
        "speech_ms": speech_ms,
        "endpoint_ms": endpoint_ms,
        "decode_ms": decode_ms,
        "acoustic_speech_end_ms": acoustic_speech_end_ms,
        "turn_commit_ms": turn_commit_ms,
        "first_transcript_ms": transcript_ready_ms,
    }

print(json.dumps(batch_stt_timeline(speech_ms=1200, endpoint_ms=300, decode_ms=450), indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{
  "approach": "end-of-utterance",
  "speech_ms": 1200,
  "endpoint_ms": 300,
  "decode_ms": 450,
  "acoustic_speech_end_ms": 1200,
  "turn_commit_ms": 1500,
  "first_transcript_ms": 1950
}
```
<!-- leetllm: output:end -->

| Approach | Latency | Complexity |
|----------|---------|-----------|
| **Streaming STT** | Measure first partial, stable text, and final transcript separately | Revisions and turn state |
| **End-of-utterance** | Endpoint wait plus decode; 750ms after speech in this trace | Simpler scheduling |

```checkpoint
When is batch STT acceptable, and when is it a bad fit?
---
Batch STT suits recordings and may suit short commands or prototypes whose latency budget permits it. For a live call, measure the endpoint wait plus decode cost before accepting the simpler design.
```

## Speak a first clause, not a full plan

After turn commitment, the LLM should emit a stable first speakable clause without waiting for a long response plan. Before commitment, the system may only do reversible preparation. That makes <span data-glossary="ttft">Time-to-First-Token (TTFT)</span> relevant without letting an unstable transcript become spoken truth. The serving mechanics are in [Inference Mechanics](/learn/inference-mechanics-ttft-tps-kv-cache).

Long reasoning and slow tools are a poor fit for the acknowledgement path unless measurements still meet the TTFA objective. The agent can say an honest status quickly, run the slow work in the background, and speak the result when it lands.

Give the first clause one concise job: communicate verified facts immediately. Separate the spoken channel from display text: avoid reading Markdown syntax aloud, pronounce incident digits deliberately, and keep clauses short. This template example formats an already verified status; it does not call an LLM or stream tokens.

<!-- leetllm: test, output=show -->
```python title="thinking-before-the-user-finishes-llm.py"
import json

def voice_chunks(incident_status: dict[str, str]) -> list[str]:
    status = incident_status["status"]
    if status not in {"open", "closed"}:
        raise ValueError("a verified open or closed status is required")
    spoken_status = "still open" if status == "open" else "closed"
    reply = (
        f"Incident {incident_status['id']} is {spoken_status}. "
        f"Severity is {incident_status['severity']}. "
        "I can text you the incident link."
    )
    clauses = [part.strip() + "." for part in reply.split(".") if part.strip()]
    return clauses

transcript = "What is incident number four two one nine?"
chunks = voice_chunks(
    incident_status={"id": "4219", "severity": "sev-two", "status": "open"},
)

assert voice_chunks({"id": "4219", "severity": "sev-two", "status": "closed"})[0] == "Incident 4219 is closed."
print(json.dumps({
    "contains_incident": "incident" in transcript.lower(),
    "max_words_per_clause": max(len(clause.split()) for clause in chunks),
    "streamed_clauses": chunks,
}, indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{
  "contains_incident": true,
  "max_words_per_clause": 7,
  "streamed_clauses": [
    "Incident 4219 is still open.",
    "Severity is sev-two.",
    "I can text you the incident link."
  ]
}
```
<!-- leetllm: output:end -->

The formatter uses verified status rather than speculating before lookup completion. The caller provides an authorized, current tool result and verifies that offering to text a link is an active capability. For this hotline, test how TTS pronounces `4219` and `sev-two`: phonetically ambiguous output can misdirect the caller to an incorrect incident.

### Slow tools don't get to steal the first word

A status lookup, page request, or ticket creation can finish quickly or stall. Human acknowledgement is a separate event from a service accepting a page. If a result isn't ready by the first-clause deadline, speak an honest acknowledgement and continue the work asynchronously. Don't narrate a result you don't have yet.

Do not predict tool completion from average latency estimates. The helper consumes the actual tool state returned by the application: pending, succeeded, or failed. Its 200ms decision point reserves 200ms for synthesis, transport, and playout inside the 400ms post-commit budget, ensuring deterministic fallback when lookups run long.

<!-- leetllm: test, output=show -->
```python title="acknowledge-then-finish-slow-tools.py"
import json

COMMIT_TO_AUDIO_BUDGET_MS = 400
SPEECH_PATH_RESERVE_MS = 200

def first_speakable(intent: str, tool_state: str, *, authorized: bool,
                    confirmed: bool = False, status: str | None = None) -> str:
    if tool_state not in {"pending", "succeeded", "failed"}:
        raise ValueError("unknown tool state")
    if authorized is not True:
        return "I can't perform that request with this session's permissions."
    if intent in {"page_owner", "close_incident"} and confirmed is not True:
        return "Please confirm that action and incident number."
    if tool_state == "failed":
        return "That request failed. I haven't confirmed a change."
    if intent == "lookup_status" and tool_state == "succeeded" and status in {"open", "closed"}:
        return f"Incident 4219 is {status}."
    if intent == "page_owner" and tool_state == "succeeded":
        return "The paging service accepted the page."
    if intent == "close_incident" and tool_state == "succeeded":
        return "The incident service confirmed the close."
    return "I'm checking the request. I'll tell you when I have a result."

print(json.dumps([
    first_speakable("lookup_status", "succeeded", authorized=True, status="open"),
    first_speakable("page_owner", "pending", authorized=True, confirmed=True),
    first_speakable("close_incident", "succeeded", authorized=True),
], indent=2))
assert COMMIT_TO_AUDIO_BUDGET_MS - SPEECH_PATH_RESERVE_MS == 200
assert "failed" in first_speakable("page_owner", "failed", authorized=True, confirmed=True)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[
  "Incident 4219 is open.",
  "I'm checking the request. I'll tell you when I have a result.",
  "Please confirm that action and incident number."
]
```
<!-- leetllm: output:end -->

```checkpoint
Why separate spoken output from display formatting?
---
Markdown syntax and long preambles can sound awkward when read aloud. Produce short spoken clauses, and test identifier pronunciation separately from display text.
```

```checkpoint
What should the agent say if paging the owner takes 2.4 seconds?
---
After authorization and any required confirmation, acknowledge that the request is pending. Continue the tool asynchronously, and report acceptance or failure only after the service returns a result. Track delivery and human-read acknowledgment as separate states.
```

The helper only chooses words; it performs no operation and provides no authorization enforcement. The executor must bind a confirmed action to the authenticated caller, incident, tool arguments, and request ID. Caller ID alone isn't authentication. Recheck authorization before execution, deduplicate retries with an idempotency key, and preserve the service result separately from the spoken transcript. Muting "I paged the owner" can't undo a page already sent. After a timeout, reconcile the original operation rather than submitting a second page blindly.[^awsIdempotentApis2026]

### Serving optimizations that matter in voice

Live voice sessions stress inference differently from chat. TTFT matters more than long-form throughput because TTS can't speak until the first stable clause arrives. Session length also matters because a 20-minute call can accumulate enough context to make KV-cache management part of the latency budget, not a background infrastructure concern. If TTFT rises only on long calls, inspect context growth and cache pressure before swapping models.

- Paged KV caches: Long-lived sessions fragment memory if every request expects one contiguous <span data-glossary="kv-cache">KV-cache</span> region. <span data-glossary="pagedattention">PagedAttention</span>-style allocators let serving systems grow and trim per-session context without constant copying, which helps keep latency stable across many simultaneous calls.[^kwon2023]
- Speculative decoding: A draft model proposes <span data-glossary="token">tokens</span> that the target model verifies in parallel, reducing decode latency when acceptance and implementation overhead are favorable.[^leviathan2023] Measure TTFA and total clause latency on the served model pair to determine whether it improves the user-visible path.
- Aggressive context hygiene: Don't keep every interim transcript forever. Preserve final transcripts, tool results, and only the portion of assistant audio the user heard before barge-in.

#### Prompt caching is prefix economics

Prefix reuse needs matching leading tokens and a cached endpoint the next request can look up. Keep stable policy and examples first, volatile state later. OpenAI's guide, checked October 10, 2026, distinguishes earlier implicit caching from GPT-5.6-and-later explicit/implicit breakpoints.[^openai2026promptcaching] These Responses API rules aren't automatically the rules of a stateful audio session.

Build the prompt in this order:

1. Stable policy, output style, and safety instructions.
2. Stable tool definitions and few-shot examples.
3. Conversation history that grows by appending committed turns.
4. Dynamic call state such as current incident result, timestamp, or playback acknowledgement.

Putting `current_time=...` or a rolling account balance near the top changes early tokens and can turn every later request into a cache miss. Keep volatile facts in a suffix or tool result, but never move instructions merely to chase hits when doing so changes model behavior or the authorization boundary.

Stable text alone isn't sufficient. In the documented GPT-5.6-and-later case, an implicit write through `[stable policy][dynamic request A]` doesn't separately cache the shorter policy prefix. Replacing A with B misses that entry. An explicit breakpoint after the stable content can write a reusable endpoint; both requests must preserve that boundary and meet minimum length. A `prompt_cache_key` doesn't create the missing entry.[^openai2026promptcaching]

Measure economics directly:

$$
\text{input cost} = T_{\text{read}} C_{\text{read}} + T_{\text{write}} C_{\text{write}} + T_{\text{ordinary}} C_{\text{ordinary}}
$$

Use disjoint read, write, and ordinary-input counts. Some routes charge cache writes separately; OpenAI's current guide reports `cached_tokens` and `cache_write_tokens` for the newer mechanism.[^openai2026promptcaching] Each C is a price per token; divide a per-million price by one million. Sum text and audio costs separately. Where writes carry the ordinary rate, fold them into ordinary input. Measure total call cost and TTFA alongside hit fraction; a hit doesn't repair endpointing, tools, TTS, or playout.

```checkpoint
Why should the current incident status appear after stable voice instructions and tool schemas?
---
The status changes often, so placing it near the top changes early tokens. Preserve the stable prefix and, where required, its cache-write/lookup breakpoint. Verify usage metadata, write/read costs, latency, and unchanged behavior on the actual route.
```

```checkpoint
Why should interim transcripts not live forever in voice-agent context?
---
Interim text can be wrong and bloats long sessions. Keep final transcripts, tool results, and assistant audio actually heard; drop unstable partials and truncated speech.
```

## Speaking without waiting for the full answer: TTS with streaming

The first clause can be ready while the model is still writing the rest. The TTS engine takes the token stream, buffers a phrase, and synthesizes that chunk while later text is still arriving. The first chunk should answer the immediate question. Later chunks can carry detail.

Waiting for a full paragraph delays first audio. One TTS call per token makes the voice stutter. Buffer punctuation or a short character limit, then measure whether the clause sounds natural and arrives inside TTFA.

<!-- leetllm: test, output=show -->
```python title="speaking-without-waiting-for-the-full-answer.py"
import json

def flush_speakable_clauses(tokens: list[str], max_chars: int = 52) -> list[str]:
    if max_chars is True or max_chars is False or not isinstance(max_chars, int) or max_chars <= 0:
        raise ValueError("max_chars must be a positive integer")
    buffer = ""
    flushed = []

    for token in tokens:
        buffer += token
        stripped = buffer.strip()
        if stripped.endswith((",", ".", "!", "?")):
            flushed.append(stripped)
            buffer = ""
        elif len(stripped) >= max_chars:
            # A soft limit: never cut an unfinished word at a token boundary.
            split_at = buffer.rfind(" ", 0, max_chars + 1)
            if split_at > 0:
                flushed.append(buffer[:split_at].strip())
                buffer = buffer[split_at + 1:]

    if buffer.strip():
        flushed.append(buffer.strip())

    return flushed

tokens = [
    "Incident ", "4219 ", "is ", "still ", "open, ",
    "severity ", "is ", "sev-two. ",
    "I ", "can ", "text ", "the ", "incident ", "link."
]

print(json.dumps(flush_speakable_clauses(tokens), indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[
  "Incident 4219 is still open,",
  "severity is sev-two.",
  "I can text the incident link."
]
```
<!-- leetllm: output:end -->

This punctuation heuristic is deliberately small. It doesn't understand decimal numbers, abbreviations, code-switching, or prosody, and its size limit is soft. A real adapter needs provider-specific chunking, cancellation, and a bounded queue. If synthesis outruns playback, stop or pause production before queued audio creates a long interruption tail. Measure audio generation rate against playback duration as well as first-chunk latency.

### How parallel execution reduces latency

The end-to-end target starts at acoustic speech end. The internal target starts at turn commit. Those clocks only close if stages overlap:

- **VAD runs continuously**, watching frames as they arrive and contributing a speech-end signal to endpointing.
- **Streaming STT is already running during speech.** Silence doesn't start recognition; it helps the endpoint policy decide when the current turn may commit.
- **Reversible LLM preparation can start from stable STT partials.** Spoken or side-effecting work still waits for turn commitment.
- **TTS begins synthesizing** as soon as the committed response has a stable speakable clause, which may be well before the LLM finishes.
- **Audio playback begins** as soon as the first TTS chunk is ready.

On the incident trace, first audio is 380ms after speech end. If the same span durations ran one after another, first audio would be 510ms. The gain comes from schedule overlap: STT works during speech, and TTS starts while the LLM is still finishing its clause.

<figure>
  <img src="illustrations/_generated/pipeline_overlap_dark.png" alt="The same voice tasks on one 0–520 ms clock. Serial spans 0–60,60–160,160–340,340–475 and 475–510 ms finish at 510 ms. Overlapped spans 0–60,0–100,60–240,210–345 and 345–380 ms finish at 380 ms, saving 130 ms." />
  <figcaption>The left schedule adds the same durations used in the Python trace and lands at 510ms. The right schedule is the overlapped incident path: TTS starts during the LLM clause, and first audio plays at 380ms.</figcaption>
</figure>

```checkpoint
Why synthesize clauses instead of individual tokens or full paragraphs?
---
Token-level TTS sounds choppy, while paragraph-level TTS adds seconds. Clause buffering gives natural phrasing while keeping first audio fast.
```

## When the user interrupts: barge-in handling

When the user speaks over the agent ("barge-in"), the system must react immediately. A caller asks about an incident, the agent begins explaining mitigation, and the caller cuts in with "Wait, page the owner." The agent must halt audio output, cancel in-flight generation, and retain only what the caller actually heard. Treat this as a state transition rather than a simple client-side mute: the next conversation turn must resume from the heard boundary.

Local VAD fires the mute. Server endpointing still decides when the new user turn is committed. Those signals form one control loop: fast local action first, authoritative transcript boundary second.

1. **Stop Playback:** Halt the audio output. A support product might begin with a p95 mute target below 100ms, then tune against measured paths.
2. **Cancel Generation:** Abort in-flight TTS and LLM requests to save cost and compute.
3. **State Reconciliation:** Update conversation context to reflect *only* what the user heard.

<figure>
  <img src="illustrations/_generated/barge_in_state_dark.png" alt="The client confirms playout only through 520 ms. Barge-in arrives at 650 ms, while generated output extends to 1120 ms. History retains Incident is open, the confirmed span, and discards the unconfirmed remainder because the database failover is still running." />
  <figcaption>At 650ms the client acknowledgement cursor is 520ms, while the 860ms chunk is still unconfirmed. History keeps "Incident is open" and drops the unconfirmed mitigation clause.</figcaption>
</figure>

Stopping the speaker is only half of barge-in. Suppose the user interrupts at 650ms and the latest client playout acknowledgement reports a cursor of 520ms. The next model call should remember the clause through that cursor, not the mitigation text that was still buffered or in flight.

Use conservative reconciliation at audio-chunk boundaries. When VAD detects fresh user speech during agent playback, stop playout, cancel in-flight generation, and truncate assistant text to the portion confirmed by the latest client playout acknowledgement. Finer timestamps can reduce the amount discarded, but they must still describe playout, not output arrival or generation.

<!-- leetllm: test, output=show -->
```python title="when-the-user-interrupts-barge-in-handling.py"
from dataclasses import dataclass
import json

@dataclass
class PlayoutChunk:
    text: str
    text_end_char: int  # Exclusive end offset in pending_text.
    playout_end_ms: int


class InterruptionHandler:
    def __init__(self, pending_text: str, playout_chunks: list[PlayoutChunk], response_id: str = "reply-1"):
        if "".join(chunk.text for chunk in playout_chunks) != pending_text:
            raise ValueError("chunks must reconstruct the pending text")
        chars = previous_ms = 0
        for chunk in playout_chunks:
            if not chunk.text:
                raise ValueError("playout chunks must contain text")
            chars += len(chunk.text)
            if (chunk.text_end_char is True or chunk.text_end_char is False or not isinstance(chunk.text_end_char, int)
                    or chunk.playout_end_ms is True or chunk.playout_end_ms is False or not isinstance(chunk.playout_end_ms, int)
                    or chunk.text_end_char != chars or chunk.playout_end_ms <= previous_ms):
                raise ValueError("invalid text alignment or playout ordering")
            previous_ms = chunk.playout_end_ms
        self.pending_text = pending_text
        self.playout_chunks = playout_chunks
        self.response_id = response_id
        self.cancelled = False
        self.frozen_cursor = None

    def accept_audio(self, response_id: str) -> bool:
        return response_id == self.response_id and not self.cancelled

    def reconcile(self, playout_cursor_ms: int, *, response_id: str) -> dict[str, object]:
        if response_id != self.response_id:
            raise ValueError("playback acknowledgement belongs to a different response")
        duration = self.playout_chunks[-1].playout_end_ms if self.playout_chunks else 0
        if playout_cursor_ms is True or playout_cursor_ms is False or not isinstance(playout_cursor_ms, int) or not (0 <= playout_cursor_ms <= duration):
            raise ValueError("invalid response-local playout cursor")
        if self.frozen_cursor is None:
            self.frozen_cursor = playout_cursor_ms
        self.cancelled = True
        playout_cursor_ms = self.frozen_cursor
        heard_chars = self._chars_heard(playout_cursor_ms)
        spoken_text = self.pending_text[:heard_chars].rstrip()
        discarded_text = self.pending_text[heard_chars:].strip()
        return {
            "history_to_keep": [{"role": "assistant", "content": spoken_text}] if spoken_text else [],
            "discarded_generated_text": discarded_text,
        }

    def _chars_heard(self, playout_cursor_ms: int) -> int:
        heard_chars = 0
        for chunk in self.playout_chunks:
            if chunk.playout_end_ms <= playout_cursor_ms:
                heard_chars = chunk.text_end_char
            else:
                break
        return heard_chars

pending = "Incident is open because the database failover is still running."
chunks = [
    PlayoutChunk("Incident is", 11, 240),
    PlayoutChunk(" open", 16, 520),
    PlayoutChunk(" because the database", 37, 860),
    PlayoutChunk(" failover is still running.", 64, 1120),
]

# At the 650ms interrupt, the latest client acknowledgement is 520ms.
handler = InterruptionHandler(pending, chunks)
assert handler.accept_audio("reply-1") and not handler.accept_audio("old-reply")
result = handler.reconcile(playout_cursor_ms=520, response_id="reply-1")
assert not handler.accept_audio("reply-1")
assert handler.reconcile(1120, response_id="reply-1") == result  # A late event cannot extend the cancelled reply.
try:
    InterruptionHandler("Incident is open", [PlayoutChunk("Incident is open", 16.0, 520)])
except ValueError:
    pass
else:
    raise AssertionError("float text offset must be rejected before slicing")
try:
    InterruptionHandler("OK", [PlayoutChunk("", 0, 100), PlayoutChunk("OK", 2, 200)])
except ValueError as error:
    assert str(error) == "playout chunks must contain text"
else:
    raise AssertionError("empty chunks must be rejected before accumulating character offsets")
new_reply = InterruptionHandler(pending, chunks, response_id="reply-2")
try:
    new_reply.reconcile(520, response_id="reply-1")
except ValueError as error:
    assert str(error) == "playback acknowledgement belongs to a different response"
else:
    raise AssertionError("old response ACK must not cancel the new reply")
assert not new_reply.cancelled and new_reply.frozen_cursor is None
print(json.dumps(result, indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{
  "history_to_keep": [
    {
      "role": "assistant",
      "content": "Incident is open"
    }
  ],
  "discarded_generated_text": "because the database failover is still running."
}
```
<!-- leetllm: output:end -->

The implementation verifies that nonempty chunk text reconstructs the 64-character reply and that integer offsets increase with integer playout time. A float offset such as `16.0` compares equal to 16 but cannot slice a Python string, so reject it during alignment validation. Offset 16 keeps `pending_text[:16]`, or `"Incident is open"`. Zero acknowledged audio produces no assistant-history entry. Cancellation freezes the cursor and rejects late audio for that response; each new reply needs a new ID and state object.

A delayed `reply-1` acknowledgement can carry a valid 520ms cursor after `reply-2` starts. Checking the number alone would cancel the new reply and attach its words to the old playback event. The regression rejects that response mismatch before freezing any cursor or changing cancellation state. The adapter must also bind these events to the authenticated session.

"Heard" here means client-confirmed playout. A muted speaker, lost acknowledgement, or partially played chunk can leave human perception uncertain, so the latest ACK is a conservative lower bound. A live interruption protocol can obtain a final cursor after stopping the audio sink; it must bind that cursor to the correct session and response before updating history. RTP packet arrival alone does not confirm audio playout. Keep tool execution records even when their spoken description is discarded.

```checkpoint
Why must barge-in history use "heard" text, not generated text?
---
The user may interrupt before playback finishes. If history includes unheard generated text, the model assumes shared context that the user never received, causing confusing follow-ups.
```

## Cascaded pipeline vs. native audio

Design reviews often ask you to compare two families: cascaded `STT -> LLM -> TTS` pipelines and native speech-to-speech models. Early research systems such as AudioPaLM and SpeechGPT showed the idea was viable.[^rubenstein2023][^zhang2023a] Native audio is now a production API option. OpenAI's Realtime API supports live speech-to-speech sessions.[^openai2025gptrealtime] Google's Gemini Live API is a stateful WebSocket session with native audio, automatic voice-activity detection, barge-in, transcripts, and tool use.[^google2026geminilive]

Choose transport from where the audio lives: WebRTC for browser and mobile capture, a WebSocket session when your server already has PCM, and SIP when the caller is on the phone network. If the speech model only speaks WebSocket, terminate WebRTC at the media edge and forward PCM. Provider model catalogs change quickly, so verify current aliases when you implement the route.

Native models reduce model handoffs and can retain prosodic signals that a text-only boundary loses. They don't remove transport, VAD, AEC, or state-management problems. Gemini's capabilities guide still labels Live API Preview when checked October 10, 2026.[^google2026geminiliveCapabilities] Check each provider's history semantics: Gemini documents retaining information already sent to the client after interruption, which may include buffered, unplayed output. That isn't this application's confirmed-playout rule. Stop queued playback and define how to reconcile future context.[^google2026geminiliveCapabilities] OpenAI cautions that asynchronous input transcription is guidance, not an exact account of what its audio model perceived.[^openai2026realtimeclientevents]

Make the choice with a failure question: if a caller disputes what the agent said, can you inspect the transcript, tool decision, and exact played audio? Cascading exposes those boundaries and makes component swaps easier. Native audio may shorten the model path, but it still needs those side channels when policy, auditability, or deterministic tools matter.

<figure>
  <img src="illustrations/_generated/cascaded_vs_native_audio_dark.png" alt="Cascaded audio passes through STT, LLM and TTS, so transcript inspection and tool gates sit inline. A native speech model emits audio directly, with transcript, authorized tools and trace handled through side channels. Both paths require turn detection, interruption and a confirmed playout cursor." />
  <figcaption>Cascaded audio keeps text checkpoints inline. Native audio removes model hops, but transcript, policy, tracing, VAD, and barge-in still sit outside the speech model.</figcaption>
</figure>

> **⚠️ Common mistake:** Treating a model's WebSocket connection as a complete browser-audio stack. Direct WebSocket designs are possible, but capture, echo control, playout, and buffering still need an owner. A WebRTC media edge is one way to provide that boundary, not a prerequisite imposed by the model API.

Many commercial native-audio APIs use stateful sessions, not one-shot request/response calls. The client streams audio frames in, then receives incremental audio and transcript events back.

### Session shape

In this single-response simulation, `audio_delta` means output reached a client buffer, not a speaker. `playback_ack` is an invented application event emitted after the audio sink consumes a range; it isn't a provider event name. Both counters are response-local milliseconds. Real adapters must also track session, response, item, and audio-part IDs, plus duplicate events and cancellation.

Gemini can return multiple output parts in one server message. Process every part and applicable control field; an `if`/`elif` parser that handles only audio can silently miss a transcript, interruption, or tool event.[^google2026geminiliveCapabilities]

OpenAI's `conversation.item.truncate` accepts an assistant `item_id`, `content_index` (currently documented as `0`), and `audio_end_ms`. The API documents deleting server-side transcript text when truncating audio, not returning a precisely word-aligned prefix. Wait for its acknowledgement and handle errors. The local text-alignment example above is a separate application handler, not a reproduction of this provider's internal state.[^openai2026realtimeclientevents]

<!-- leetllm: test, output=show -->
```python title="session-shape.py"
from collections import defaultdict
import json

events = [
    {"type": "transcript_delta", "text": "Incident is"},
    {"type": "audio_delta", "audio_ms": 160},
    {"type": "playback_ack", "playout_cursor_ms": 160},
    {"type": "transcript_delta", "text": " still open."},
    {"type": "audio_delta", "audio_ms": 220},
    {"type": "tool_call", "name": "send_incident_link"},
]

state = defaultdict(list)
received_audio_ms = 0
confirmed_playout_ms = 0

for event in events:
    if event["type"] == "audio_delta":
        if event["audio_ms"] is True or event["audio_ms"] is False or not isinstance(event["audio_ms"], int) or event["audio_ms"] <= 0:
            raise ValueError("audio duration must be a positive integer")
        received_audio_ms += event["audio_ms"]
    elif event["type"] == "playback_ack":
        cursor = event["playout_cursor_ms"]
        if cursor is True or cursor is False or not isinstance(cursor, int) or cursor < confirmed_playout_ms or cursor > received_audio_ms:
            raise ValueError("playback acknowledgement must be monotonic and <= received audio")
        confirmed_playout_ms = cursor
    elif event["type"] == "transcript_delta":
        state["transcript"].append(event["text"])
    elif event["type"] == "tool_call":
        state["tool_calls"].append(event["name"])

print(json.dumps({
    "transcript_side_channel": "".join(state["transcript"]),
    "received_audio_ms": received_audio_ms,
    "confirmed_playout_ms": confirmed_playout_ms,
    "received_not_confirmed_ms": received_audio_ms - confirmed_playout_ms,
    "tool_calls": state["tool_calls"],
}, indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{
  "transcript_side_channel": "Incident is still open.",
  "received_audio_ms": 380,
  "confirmed_playout_ms": 160,
  "received_not_confirmed_ms": 220,
  "tool_calls": [
    "send_incident_link"
  ]
}
```
<!-- leetllm: output:end -->

The client received 380ms of output but confirmed only 160ms of playout. The remaining 220ms may be buffered, played but not yet acknowledged, or cancelled. This implementation conservatively excludes it. A tool-call event is only a proposal: collecting its name never authorizes execution. Keep provider credentials on a trusted server or use the provider's supported short-lived client credential flow; don't put a long-lived service key in a browser bundle. Scope session access and retention of recordings, transcripts, and identifiers to the call product's policy.

Tool scheduling also depends on the selected model. The current Gemini guide lists nonblocking function calls for Gemini 3.8 Live and sequential calls for Gemini 3.1 Flash Live Preview.[^google2026geminiliveCapabilities] Cancellation can discard a pending proposal; it can't undo a page that your executor already submitted. Keep operation records independently of spoken context.

### Sample rates and format negotiations

Gemini's overview lists little-endian 16-bit PCM, native 16kHz input and 24kHz output.[^google2026geminilive] Its capabilities guide also accepts other input rates when correctly declared and resamples them.[^google2026geminiliveCapabilities] Decode any transport codec before a PCM handoff. A MIME label describes the actual samples; changing the label isn't resampling.

How long is a 480-sample chunk? At 24kHz it is 20ms; at 16kHz it is 30ms. This matters both to playback and to the cursor used for interruption. The example counts mono sample frames and bytes, without generating or resampling speech:

<!-- leetllm: test, output=show -->
```python title="pcm-sample-rate-and-playout-duration.py"
import json
from fractions import Fraction

chunk_ms = 20
input_rate = 16_000
output_rate = 24_000
bytes_per_sample = 2  # Mono, 16-bit PCM; excludes protocol overhead.
input_samples = input_rate * chunk_ms // 1000
output_samples = output_rate * chunk_ms // 1000
actual_output_ms = Fraction(output_samples * 1000, output_rate)
mislabeled_output_ms = Fraction(output_samples * 1000, input_rate)

assert input_samples == 320 and output_samples == 480
assert actual_output_ms == 20 and mislabeled_output_ms == 30
print(json.dumps({
    "native_input_20ms_bytes": input_samples * bytes_per_sample,
    "output_20ms_bytes": output_samples * bytes_per_sample,
    "output_samples": output_samples,
    "correct_output_duration_ms": int(actual_output_ms),
    "duration_if_mislabeled_16khz_ms": int(mislabeled_output_ms),
}, indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{
  "native_input_20ms_bytes": 640,
  "output_20ms_bytes": 960,
  "output_samples": 480,
  "correct_output_duration_ms": 20,
  "duration_if_mislabeled_16khz_ms": 30
}
```
<!-- leetllm: output:end -->

At a wrong 16kHz playback setting, those output samples last 50% longer and the inferred cursor no longer matches intended time. Use the correct output rate or an actual resampler for the sink. Other channel counts and codecs need their own accounting; these byte counts describe this mono PCM calculation.

### Audio tokenization

Published native-audio systems commonly avoid feeding raw PCM directly into a <span data-glossary="transformer">transformer</span>. AudioPaLM and SpeechGPT use discrete speech representations rather than modeling every waveform sample as its own sequence element.[^rubenstein2023][^zhang2023a] AudioPaLM's w2v-BERT variant produces 25 semantic-token positions per second; its separate acoustic stages generate SoundStream codec tokens and then waveform audio. Those 25 positions aren't PCM packets or a billing rule for current APIs.[^rubenstein2023]

The model emits audio tokens or latents, acoustic decoding reconstructs waveform chunks, and the client plays them with a jitter buffer. Representation choice and voice conditioning determine which tone, pacing, and other paralinguistic cues survive; evaluate those cues after decoding at the target bitrate.

### Trade-offs

Native audio can avoid some model handoffs and retain paralinguistic features such as tone, hesitation, and emphasis that a strict text bottleneck removes. Benchmark latency and interaction quality on the target workload to measure its effect.

Native audio is also harder to debug and harder to control. Without a clean intermediate transcript, it's tougher to inspect failures, run deterministic tool policies, or align partially spoken output with conversation history. Modular pipelines are still easier to observe, test, and swap component by component.

```checkpoint
When should you prefer a cascaded STT-LLM-TTS pipeline over native audio?
---
Prefer cascaded pipelines when observability, deterministic tool policy, component swaps, transcript inspection, or compliance logs matter more than maximum prosody and theoretical latency.
```

## Moving audio across the internet

When moving live audio across the internet, transport choice sets baseline latency and jitter. For browser and mobile voice agents, WebRTC prefers a media-timed UDP path when available, but ICE/TURN deployments need relay and TCP/TLS fallback paths for restricted networks ([RFC 8835](https://www.rfc-editor.org/rfc/rfc8835)).

WebSockets remain useful for signaling, transcription-only streams, and server-to-server audio when the application owns media buffering. The comparison below uses WebSocket over TCP. [RFC 9220](https://www.rfc-editor.org/info/rfc9220/) also defines WebSocket over HTTP/3; verify the negotiated path instead of assuming every WebSocket uses TCP. Reliable ordering within its audio stream still differs from deadline-aware datagram delivery.

TCP provides reliable, ordered byte delivery with sequence numbers, acknowledgments, and retransmission. That's great for text and file transfer, but it creates head-of-line blocking for live audio. If one segment is lost, later bytes wait behind recovery. In voice, that often shows up as stuttery playout or latency spikes.

On a WebRTC UDP media path, loss handling is deadline-aware: the stream can keep moving while packet-loss concealment fills short gaps. For conversation, concealing a short lost frame may be preferable to delaying later audio for recovery; verify this trade-off under the network slices you serve.

<figure>
  <img src="illustrations/_generated/transport_comparison_dark.png" alt="Four 20 ms audio packets illustrate one missing frame. WebRTC conceals the 60 ms gap and plays the 80 ms packet on time. A TCP WebSocket must recover the missing byte rangeC before later bytesD and E can be delivered to the application." />
  <figcaption>These synthetic packets represent 20ms each. WebRTC can conceal the missing packet at the 60ms position and play the packet at 80ms; TCP must recover missing bytes before delivering later bytes.</figcaption>
</figure>

The deadline changes the protocol choice. RTP recovery helps only while a packet can still improve playout; TCP recovery must preserve byte order even if the voice moment has already passed. If a call is clean on wired networks but stutters on a mobile slice, compare packet arrival, buffer depth, concealment, and playout delay before blaming the model.

### Jitter buffers and packet loss concealment

Network jitter is variation in packet delay and arrival spacing. A receiver's jitter buffer holds packets before playback. A team might begin experiments around 20-60ms, then measure the delay/underrun tradeoff on supported paths: a larger buffer can hide more arrival variation while increasing conversational delay.

- Static Jitter Buffer: Fixed size (e.g., 50ms). Simple but risks underruns if jitter exceeds buffer size.
- Adaptive Jitter Buffer: Dynamically resizes based on network conditions. Expands during congestion (adding latency) and shrinks during stability (reducing latency).

Browser WebRTC stacks already include adaptive jitter buffers and packet loss concealment (PLC). NetEQ is a well-known WebRTC receiver implementation of this idea.[^chromiumNeteq] When packets arrive late or disappear, the receiver can stretch buffered audio, extrapolate from recent audio, or ask the decoder to synthesize concealment frames instead of stalling playout.

### Protocol comparison: WebRTC vs. WebSocket

| Feature | WebRTC Media (UDP Preferred, Fallbacks Possible) | WebSocket over TCP |
| :--- | :--- | :--- |
| **Transport** | UDP preferred; relay or TCP/TLS fallback paths possible | TCP |
| **Reliability Model** | **Media-timed** (may use NACK/FEC, but playout stays time-bounded) | **Byte-stream reliable** (lost bytes block later bytes) |
| **Latency Behavior** | **Low and stable when tuned** | **Can spike under loss** |
| **Congestion Control** | Media-aware adaptation via RTP/RTCP feedback (implementation-dependent) | Managed by the TCP stack, not by media playout deadlines |
| **Encryption** | Mandatory media encryption via DTLS-SRTP | TLS for `wss://`; plain `ws://` isn't encrypted |
| **Typical use here** | **Browser live media** | **Signaling or server PCM with application buffering** |

WebRTC media is richer than "UDP means drop packets." On UDP media paths it layers RTP (Real-time Transport Protocol) / RTCP (RTP Control Protocol) feedback, jitter buffers, packet loss concealment (PLC), and sometimes NACK (Negative Acknowledgment) or FEC (Forward Error Correction).[^perkins2021] ICE and TURN can select relay or fallback paths when direct UDP is unavailable ([RFC 8835](https://www.rfc-editor.org/rfc/rfc8835)). The design goal is timeliness: recover loss when it can still help, otherwise keep audio moving.

Using WebSockets as a drop-in replacement for WebRTC in browser live audio creates hidden work. You can ship with WebSockets, but you must own <span data-glossary="chunking">chunking</span>, playout buffering, <span data-glossary="backpressure">backpressure</span>, and worse behavior under packet loss.

```checkpoint
Why does WebRTC usually beat WebSockets for browser live audio?
---
WebRTC uses media-timed transport with jitter buffers, RTP/RTCP feedback, packet loss concealment, and time-bounded playout. TCP WebSockets can stall later audio behind lost bytes.
```

## Scaling to thousands of conversations

Suppose 10,000 callers connect during an incident drill. Connection count alone misses the work each session creates: media state, turn timing, model requests, and bursty <span data-glossary="gpu">GPU</span> demand. The ingress tier usually needs sticky routing or consistent hashing so packets for one conversation keep landing on the same media worker.

<figure>
  <img src="illustrations/_generated/scale_sessions_dark.png" alt="Voice session packets hash to one sticky media worker that owns DTLS and media state. Its audio, turn, and text requests fan out to independently scalable STT, LLM, and TTS pools." />
  <figcaption>Pin packet state to one media worker. Let STT, LLM, and TTS pools burst behind it, because their CPU and GPU profiles don't move together.</figcaption>
</figure>

The media tier scales by active sessions and network state. Inference scales by model pressure, which is why separating these tiers usually beats one giant "voice server" process. The routing sketch uses a stable modulo hash only to show affinity with a fixed worker set. A production router should define what happens when workers join or fail, often with connection-aware routing or consistent hashing to limit remapping.

Treat `10k+` as a load-test target. Declare the call mix: session duration, utterance and pause lengths, arrival bursts, output lengths, tool rate, codec, and network loss. Record media CPU, GPU queue time, active streams, reconnects, first-audio p50/p95, mute p95, and error rate. Set capacity where those SLOs hold with headroom; a session count alone does not define the operating point.

WebRTC connections carry session state. A specific media worker holds Datagram Transport Layer Security (DTLS) keys, Secure Real-time Transport Protocol (SRTP) state, jitter-buffer state, and often the client playout cursor. If a naive round-robin load balancer routes packets to a different worker mid-session, decryption and timing state break immediately.

Behind media workers, inference components should scale independently because their compute profiles differ. Turn detection and some STT stages often fit on CPU. Largest speech or LLM models usually need GPU. Independent scaling keeps GPU utilization high without overprovisioning lighter tiers. If one media worker dies, preserve the call's heard cursor and reconnect state where possible; otherwise make the recovery explicit, rebuild the session, and tell the caller what happened.

<!-- leetllm: test, output=show -->
```python title="keeping-media-sessions-affine.py"
import hashlib
import json

workers = ["media-a", "media-b", "media-c"]

def route(session_id: str) -> str:
    digest = int(hashlib.sha256(session_id.encode()).hexdigest(), 16)
    return workers[digest % len(workers)]

session_id = "call-session-4219"
packet_routes = [route(session_id) for _ in range(4)]
failed_worker = packet_routes[0]

print(json.dumps({
    "packet_routes": packet_routes,
    "single_worker_during_session": len(set(packet_routes)) == 1,
    "failed_worker": failed_worker,
    "recovery": "reconnect_and_rebuild_session",
}, indent=2))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
{
  "packet_routes": [
    "media-a",
    "media-a",
    "media-a",
    "media-a"
  ],
  "single_worker_during_session": true,
  "failed_worker": "media-a",
  "recovery": "reconnect_and_rebuild_session"
}
```
<!-- leetllm: output:end -->

```checkpoint
Why do WebRTC sessions need sticky routing?
---
A media worker holds DTLS keys, SRTP state, jitter buffers, and the client playout cursor. Moving packets to a different worker mid-session breaks decryption and timing state.
```



## Review the voice design

A tight first-audio objective depends on every handoff. A demo that answers incident 4219 once proves little: the design also needs an explicit response to jitter, interruptions, uncertain turn boundaries, and tools that can't finish inside the budget.

| Check | Pass when |
| --- | --- |
| Speech-end TTFA | p50 and p95 are measured on declared network slices, not inferred from one 380ms trace |
| Commit-to-audio | Isolated from endpointing so LLM, TTS, and playout regressions are visible |
| Turn detection | Local VAD mutes fast; server endpointing combines silence, stable words, and semantic completeness |
| Transcript commit | Unstable partials may prefetch reads; they may not write history, speak facts, or fire side effects |
| Slow tools | First audio is an honest acknowledgement; paging and closes wait for results or confirmation |
| Barge-in | p95 mute meets the product target, and history keeps text through confirmed playout only |
| Echo | AEC is tested on real devices, speaker volumes, and rooms |
| Transport | The negotiated path and loss behavior are measured; WebRTC or the application owns capture, buffering, and playback |
| Native audio | Chosen only after measuring latency, prosody, policy control, and the same confirmed-playout cursor rule |
| Prefix cache | Stable policy/tool content and usable cache boundaries; write/read usage, costs, and latency are checked |

Start with clean, interrupted, and degraded-network traces, then repeat over a declared workload. Include unsuccessful turns and timeouts in the attainment denominator. A p95 computed only over successful replies hides silence. Separate time to acknowledgement from time to useful answer so a fast filler phrase can't conceal a slow incident lookup. Compare endpoint false cutoffs, identifier accuracy, unauthorized tool attempts, mute latency, and task completion alongside speed.

Speech-end time and commit time are different clocks, and history should keep only the audio the caller actually heard.

### Follow-up questions

- A 300ms silence rule precedes a 320ms post-commit path. What is speech-end TTFA, and which changes could bring it below 500ms?
- A page succeeded, but the caller interrupted before hearing the acknowledgement. What survives in tool state and conversation history?
- How would you reject a delayed audio chunk or playout acknowledgement from a previous response after reconnecting?

### Evaluation rubric

- Distinguishes acoustic speech end, accepted turn, stable transcript, and client playout clocks.
- Calculates overlap without hiding endpointing, transport, failures, or the useful-answer delay.
- Separates transcript confidence, caller authorization, action confirmation, and service outcome.
- Reconciles interruptions with response-scoped playout state while preserving real tool effects.
- Justifies transport, model architecture, and capacity from measured workload and failure cases.

```mastery-quiz
[
  {
    "question": "A new call’s acoustic speech ends at 1,000 ms, its turn commits at 1,300 ms, and first audio plays at 1,640 ms. Point limits are 500 ms speech-end and 400 ms post-commit. Which paired diagnosis fits this trace?",
    "options": [
      "640 ms and 340 ms; the speech-end limit fails while the post-commit limit passes.",
      "340 ms and 640 ms; the speech-end limit passes while the post-commit limit fails.",
      "640 ms and 640 ms; both limits fail because first playback closes both timers.",
      "340 ms and 340 ms; both limits pass because commitment replaces the acoustic origin."
    ],
    "answer": "640 ms and 340 ms; the speech-end limit fails while the post-commit limit passes.",
    "explanation": "Subtract the appropriate origin: 1,640−1,000=640 and 1,640−1,300=340. The endpoint delay is 300 ms; it belongs to the speech-end clock but precedes the post-commit clock. An isolated trace represents a single point measurement rather than an aggregate population percentile."
  },
  {
    "question": "A frame detector retains configured quiet pre-roll and removes trailing silence from retained utterance duration. Frames last 30 ms, required silence is 61 ms and pre-roll is 30 ms. Probabilities at frames 0 through 5 are [0.1, 0.7, 0.8, 0.2, 0.2, 0.2], with speech threshold 0.5. Which end event and retained duration result?",
    "options": [
      "Frame 4, 90 ms",
      "Frame 5, 90 ms",
      "Frame 5, 180 ms",
      "Frame 4, 60 ms"
    ],
    "answer": "Frame 5, 90 ms",
    "explanation": "At the end of frame 4, the detector has seen only 60 ms of trailing silence. Frame 5 brings that to 90 ms and meets the 61 ms requirement. The detector trims frames 3 through 5. It keeps frame 0 as pre-roll and frames 1 and 2 as speech, for 3 × 30 = 90 ms. Retaining 180 ms counts all six frames, including the trailing silence. Ending at frame 4 with 60 ms also drops the pre-roll and keeps only the two speech frames."
  },
  {
    "question": "An interim transcript says Page incident 8316, then changes to Track incident 8316. Event A carries Boolean committed=false; event B carries the string committed=\"false\". Both reach the same typed gate. Which pair of actions is appropriate?",
    "options": [
      "A may commit speech after a prefetch; B may perform the same actions after string conversion.",
      "A may commit speech after a prefetch; B must be rejected before the gate branches.",
      "A may classify and prefetch an authorized read; B must be rejected before the gate branches.",
      "A may classify and prefetch an authorized read; B may commit speech because its flag is nonempty."
    ],
    "answer": "A may classify and prefetch an authorized read; B must be rejected before the gate branches.",
    "explanation": "An uncommitted hypothesis permits discardable authorized preparation but not history or speech. A nonempty Python string is truthy, yet it is not the Boolean required by this adapter. The revised hypothesis also shows why repeating partial words cannot authorize a page."
  },
  {
    "question": "Two fresh page traces arrive. In A, the authenticated caller confirmed page P47 and the paging service accepted it, but delivery status is unknown. In B, a committed turn and confirmation propose page P48 while the current executor permission check denies it. Which paired next step is justified?",
    "options": [
      "A may report that the owner received the page; B may dispatch because confirmation and commitment are complete.",
      "A may report service acceptance with delivery unconfirmed; B may dispatch because confirmation and commitment are complete.",
      "A may report that the owner received the page; B must withhold dispatch under the current permission decision.",
      "A may report service acceptance with delivery unconfirmed; B must withhold dispatch under the current permission decision."
    ],
    "answer": "A may report service acceptance with delivery unconfirmed; B must withhold dispatch under the current permission decision.",
    "explanation": "An accepted acknowledgment confirms message intake rather than recipient delivery or human reading. In B, turn acceptance and caller confirmation do not override the executor’s current authorization check. Speech state, authorization, execution and downstream outcome must remain distinct."
  },
  {
    "question": "Reply A consists of Owner is (offset 8, end 180 ms), paged. (offset 15, end 410 ms), ETA is (offset 22, end 650 ms), and five minutes. (offset 36, end 900 ms); leading spaces are included after the first chunk. It is cancelled with ACK 450 ms. A later ACK 900 ms is labeled Reply A after Reply B starts. Which history and mutation result follow the response-scoped state machine?",
    "options": [
      "Keep Owner is paged.; leave Reply B untouched and leave Reply A’s history frozen.",
      "Keep Owner is paged. ETA is; leave Reply B untouched and leave Reply A’s history frozen.",
      "Keep Owner is paged.; cancel Reply B and extend Reply A to its full 36 characters.",
      "Keep Owner is paged. ETA is; cancel Reply B and extend Reply A to its full 36 characters."
    ],
    "answer": "Keep Owner is paged.; leave Reply B untouched and leave Reply A’s history frozen.",
    "explanation": "The last complete chunk by 450 ms ends at 410 ms/offset 15. The 650 ms chunk is not complete. A cancelled reply cannot expand from a late ACK, and a response A event cannot mutate active response B. The chunk offsets include spaces."
  },
  {
    "question": "A mono 16-bit PCM chunk has 960 sample frames produced for 48 kHz playback. The sink instead consumes it at 24 kHz without resampling. Which duration and payload tuple is correct, excluding protocol overhead?",
    "options": [
      "Intended 40 ms; interpreted 20 ms; payload 960 bytes.",
      "Intended 20 ms; interpreted 40 ms; payload 960 bytes.",
      "Intended 40 ms; interpreted 20 ms; payload 1,920 bytes.",
      "Intended 20 ms; interpreted 40 ms; payload 1,920 bytes."
    ],
    "answer": "Intended 20 ms; interpreted 40 ms; payload 1,920 bytes.",
    "explanation": "Duration=sample frames/rate: 960/48,000=20 ms and 960/24,000=40 ms. Sixteen bits is two bytes per mono frame, so 960×2=1,920 bytes. Neither relabeling nor receiving a packet changes its samples."
  },
  {
    "question": "A media packet has timestamp 40 ms and arrives at 78 ms. Compare fixed buffers 35 ms and 45 ms using deadline=timestamp+buffer. Which disposition pair and extra delay result?",
    "options": [
      "Play with 35 ms; play with 45 ms; later slots gain 10 ms.",
      "Conceal with 35 ms; play with 45 ms; every slot gains 10 ms.",
      "Conceal with 35 ms; conceal with 45 ms; every slot gains 45 ms.",
      "Play with 35 ms; conceal with 45 ms; only this slot gains 10 ms."
    ],
    "answer": "Conceal with 35 ms; play with 45 ms; every slot gains 10 ms.",
    "explanation": "The deadlines are 75 ms and 85 ms. Arrival 78 misses 75 but meets 85. Increasing a fixed buffer by 10 ms shifts every playback deadline by 10 ms; it is not a free repair restricted to the lost packet."
  },
  {
    "question": "In a fresh response-local session trace, audio 120 ms arrives, ACK 120 ms follows, another 180 ms arrives, then ACK 210 ms and a tool-call proposal arrive. Which accounting and action tuple is justified?",
    "options": [
      "Received 300 ms; confirmed 210 ms; unconfirmed 90 ms; the proposal still needs executor authorization.",
      "Received 300 ms; confirmed 300 ms; unconfirmed 0 ms; the proposal still needs executor authorization.",
      "Received 300 ms; confirmed 210 ms; unconfirmed 90 ms; the tool event itself authorizes execution.",
      "Received 210 ms; confirmed 210 ms; unconfirmed 0 ms; the tool event itself authorizes execution."
    ],
    "answer": "Received 300 ms; confirmed 210 ms; unconfirmed 90 ms; the proposal still needs executor authorization.",
    "explanation": "Audio deltas sum 120+180=300 ms. The monotonic response-local cursor is 210 ms, so 90 ms remains unconfirmed. A proposed tool name is not an authenticated execution permit. Receipt and playback cannot be merged into one counter."
  },
  {
    "question": "A route reports disjoint input buckets: 2,000 cached-read tokens, 600 cache-write tokens and 400 ordinary tokens. List prices per million are $0.20, $1.25 and $1.00 respectively. What is this input subtotal before output or audio charges?",
    "options": [
      "$0.00092",
      "$0.00140",
      "$0.00155",
      "$0.00215"
    ],
    "answer": "$0.00155",
    "explanation": "Multiply each token count by its price per million, then divide by a million. The reads cost $0.00040, the writes cost $0.00075, and ordinary input costs $0.00040, for a total of $0.00155. Pricing the writes as reads gives $0.00092. Using the ordinary rate for the writes gives $0.00140. Charging the same 600 writes at both the write and ordinary rates adds $0.00060 to the correct subtotal and gives $0.00215."
  },
  {
    "question": "A declared network slice has 100 eligible attempted calls: 96 produce audio and 92 of those start within 500 ms; four calls time out. The release condition requires at least 95% of attempted calls inside 500 ms. Which report and point decision are sound?",
    "options": [
      "92/96=95.83% attainment; pass this condition while tracking timeouts separately.",
      "96/100=96% attainment; pass this condition because receiving audio is the deadline event.",
      "92/100=92% attainment; pass this condition because the successful-only fraction exceeds 95%.",
      "92/100=92% attainment; hold this condition despite the larger successful-only fraction."
    ],
    "answer": "92/100=92% attainment; hold this condition despite the larger successful-only fraction.",
    "explanation": "The declared denominator is all 100 attempted calls and the numerator is 92 deadline successes. Removing the four silent calls produces a different 95.83% statistic. Delayed audio arrival fails to satisfy the 500 ms requirement; a production rollout requires comprehensive quality, safety, and interruption evidence."
  }
]
```

> **Next:** Continue to [Reasoning Agent System Design](/learn/design-reasoning-agent-test-time-compute). This chapter kept extra thinking off the first-audio path so a live call could stay interruptible. The last system-design capstone asks the opposite question: when is a request hard enough that extra <span data-glossary="test-time-compute">test-time compute</span>, tools, and evidence checks should run before the system releases an answer or a side effect?
