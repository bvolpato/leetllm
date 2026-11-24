---
{
  "id": "design-real-time-voice-ai-agent",
  "slug": "design-real-time-voice-ai-agent",
  "title": "Real-Time Voice AI Agent",
  "shortDescription": "A caller asks about incident 4219. Design a real-time voice agent that achieves sub-500ms time-to-first-audio, handles instant barge-in interruption, and reconciles confirmed playout.",
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

A caller dials an operations hotline and asks, "What is incident four two one nine?" Two seconds pass in dead air. Audio packets are still flowing cleanly to the server, yet nothing plays from the speaker. To the caller, a slow model and a dropped line feel identical.

Text chat stops its clock when the first token leaves the inference server. A voice agent only wins when sound reaches the caller's ear, and it must stop talking the instant the caller cuts in without losing track of what was actually heard. Across ten languages, human question-response offsets average roughly 208 ms, with language-specific means clustered within about 250 ms of that mark.[^stivers2009] Aiming for a 500 ms speech-end-to-first-audio <span data-glossary="slo">service-level objective (SLO)</span> keeps conversation natural while giving the stack room for transcription, reasoning, synthesis, and network transport.

## The latency illusion

When an agent hesitates for two seconds, the caller assumes the line missed the prompt and repeats the question. That second attempt collides with the late first reply, and the call unravels.

Before tuning a single model weight, identify which clock is blowing the budget. If acoustic speech ends at 0 ms and endpointing waits 300 ms of silence before committing the turn, no GPU optimization can win back those 300 ms. Conversely, if turn commit fires at 60 ms yet audio plays at 900 ms, the bottleneck sits in generation, synthesis, transport, or playout buffering.

The <span data-glossary="time-to-first-audio">time-to-first-audio (TTFA)</span> target of 500 ms at p95 governs the cascaded pipeline below: streaming speech-to-text, a language model, and streaming text-to-speech. Speech-native models such as AudioPaLM and SpeechGPT demonstrated that a single multimodal architecture can collapse several of those hops.[^rubenstein2023][^zhang2023a] Even so, a cascaded pipeline remains the inspectable starting point whenever you need exact transcripts, modular vendor swaps, and strict tool checks.

## One packet through the incident-status agent

Speech recognition can start while the caller is still talking, whereas factual answers and state-changing tools must wait for a committed turn. Every turn crosses four cooperating stages:

1. **Listen (Voice Activity Detection):** Detect speech onset and pauses frame by frame so the client can mute immediately during interruptions; a separate noise-suppression filter cleans background noise mixed with speech.
2. **Transcribe (Speech-to-Text):** Decode audio incrementally while the caller speaks instead of waiting for silence.
3. **Think (Large Language Model):** Prefetch read-only context from stable partial transcripts if useful, then stream short speakable clauses once the turn commits.
4. **Speak (Text-to-Speech):** Synthesize audio from the first complete clause rather than waiting for the full reply.

## The latency budget: a worked example

A full-duplex hotline must let the caller interrupt mid-sentence, resolve incident 4219 without blocking the first spoken clause, and mute playback within 100 ms of new user speech.

### Example service objectives

- **Speech-end to first audio:** Track p50 and <span data-glossary="p95-latency">p95</span> from the acoustic end of caller speech to the first played audio frame (target: 500 ms p95 on supported network slices).
- **Commit to first audio:** Track p50 and p95 from accepted turn commitment to first played audio (target: 400 ms p95). Separating this internal clock isolates LLM, TTS, and playout regressions from endpointing changes.
- **Mute on <span data-glossary="barge-in">barge-in</span>:** Track user-speech onset to muted local speaker playback (target: 100 ms p95).
- **Concurrency and audio quality:** Size media and inference pools from measured per-session CPU/GPU load and codec negotiation, tracking jitter, packet loss, and call-connect errors inside one error budget.

### Latency budget breakdown

Measure every stage against one shared origin: acoustic speech end at `0 ms`. Because streaming <span data-glossary="speech-to-text">STT</span> runs continuously during speech and <span data-glossary="text-to-speech">TTS</span> starts as soon as the first speakable fragment leaves the LLM, overlapping stages beat their serial sum by 130 ms.

<figure>
  <img src="illustrations/_generated/latency_budget_dark.png" alt="Voice pipeline timeline starting at acoustic speech end (0 ms): turn commit 0 to 60 ms, STT finalization 0 to 100 ms, LLM first clause 60 to 240 ms, TTS first chunk 210 to 345 ms, and playout buffer 345 to 380 ms. First audio lands at 380 ms from speech end and 320 ms from turn commit." />
  <figcaption>The user clock begins at acoustic speech end (380 ms TTFA) while the internal clock begins at turn commit (320 ms). Stage overlap saves 130 ms compared with running the same durations serially (510 ms).</figcaption>
</figure>

| Stage | Window from speech end | Role in the turn |
| :--- | :--- | :--- |
| **Streaming STT partials** | Before `0 ms` | Emits "What is incident" while the caller is still speaking |
| **Turn commit** | `0–60 ms` | Semantic end-of-turn accepts the query without waiting 300 ms for pure silence |
| **STT finalization tail** | `0–100 ms` | Locks the final transcript on already-streamed frames |
| **LLM first clause** | `60–240 ms` | Streams tokens after commit; a speakable fragment opens at 210 ms |
| **TTS first chunk** | `210–345 ms` | Begins synthesizing the first fragment while the clause finishes |
| **Playout buffer** | `345–380 ms` | Jitter buffer smooths network <span data-glossary="variance">variance</span> before speaker playback |

Notice the dependence on semantic <span data-glossary="endpointing">endpointing</span>: a fixed 300 ms silence rule pushes turn commit to 300 ms, making a 320 ms post-commit path land at 620 ms instead of 380 ms. Always track both clocks across p50, p95, and p99 <span data-glossary="tracing">traces</span> alongside false-cutoff rate.

<!-- leetllm: test, output=show -->
```python title="accounting-for-overlapped-first-audio.py"
spans_ms = {
    "endpoint_commit": (0, 60),
    "stt_finalization": (0, 100),
    "llm_first_clause": (60, 240),
    "tts_first_chunk": (210, 345),
    "playout_buffer": (345, 380),
}

serial_sum = sum(end - start for start, end in spans_ms.values())
turn_commit = spans_ms["endpoint_commit"][1]
first_audio = spans_ms["playout_buffer"][1]

print(f"serial_sum_ms:                {serial_sum}")
print(f"speech_end_to_first_audio_ms: {first_audio} (target <= 500)")
print(f"commit_to_first_audio_ms:     {first_audio - turn_commit} (target <= 400)")
print(f"overlap_savings_ms:           {serial_sum - first_audio}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
serial_sum_ms:                510
speech_end_to_first_audio_ms: 380 (target <= 500)
commit_to_first_audio_ms:     320 (target <= 400)
overlap_savings_ms:           130
```
<!-- leetllm: output:end -->

## How the pieces fit together

Split the system into three layers with distinct failure modes: client capture and playback, a stateful media edge, and a stateless-per-turn inference tier. When mobile callers hear choppy audio while LLM p95 stays flat, that split immediately points to packet timing, echo, or jitter buffering at the media edge rather than GPU inference.

A media gateway terminates <span data-glossary="webrtc">WebRTC</span> (or SIP for telephony), manages jitter buffers and encryption, and streams decoded audio frames over a low-latency internal link to the inference orchestrator.[^perkins2021] Multi-party rooms add a Selective Forwarding Unit (SFU) to fan out streams. Alongside the hot path sit two fast side lanes: local voice-activity detection to mute playback immediately, and a confirmed-playout tracker that records only audio the client actually played.

<figure>
  <img src="illustrations/_generated/voice_agent_dark.png" alt="Hot path running microphone, media edge, turn detection and STT, LLM and tools, then TTS and playout. Side lanes handle local VAD mute under 100 ms p95 and client-confirmed playout tracking for conversation history." />
  <figcaption>Keep the audio hot path short. Barge-in muting and playout confirmation run in parallel control lanes so they add zero hops to normal media packets.</figcaption>
</figure>

## Knowing when to listen: voice activity detection

Voice Activity Detection (VAD) classifies short audio frames (typically 10–30 ms) as speech or silence. Frame-level VAD is fast enough to trigger immediate speaker muting, yet it cannot tell whether a caller finished speaking.

Suppose a caller recites "incident four ... two ... one ... nine" with brief pauses between digits. Pure silence VAD sees quiet frames after "four" and cuts the caller off mid-number. **Turn detection (endpointing)** solves this by combining silence duration, transcript stability, and a semantic end-of-turn model that waits longer after "incident four..." than after "thank you."[^livekit2026turn]

Production detectors such as Silero VAD operate on fixed sample rates (8 kHz or 16 kHz) and fixed frame sizes, retaining a short pre-roll buffer so the opening consonant of a word is never clipped.[^silero2021] The frame state machine below tracks contiguous 20 ms frames, preserves 40 ms of pre-roll on `speech_start`, and trims trailing silence on `speech_end`:

<!-- leetllm: test, output=show -->
```python title="knowing-when-to-listen-voice-activity.py"
from collections import deque
from dataclasses import dataclass

@dataclass
class VADEvent:
    kind: str
    frame: int
    retained_ms: int

class VoiceActivityDetector:
    def __init__(self, frame_ms: int = 20, threshold: float = 0.5,
                 silence_ms: int = 60, pre_roll_ms: int = 40):
        self.frame_ms = frame_ms
        self.threshold = threshold
        self.silence_frames_req = (silence_ms + frame_ms - 1) // frame_ms
        self.pre_roll: deque[int] = deque(maxlen=(pre_roll_ms + frame_ms - 1) // frame_ms)
        self.speech_frames: list[int] = []
        self.in_speech = False
        self.trailing_silence = 0

    def process_frame(self, frame_id: int, prob: float) -> VADEvent | None:
        if prob >= self.threshold:
            if not self.in_speech:
                self.in_speech = True
                self.speech_frames = list(self.pre_roll) + [frame_id]
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
        if self.trailing_silence < self.silence_frames_req:
            return None

        utterance = self.speech_frames[:-self.trailing_silence]
        self.in_speech = False
        self.speech_frames = []
        self.trailing_silence = 0
        self.pre_roll.clear()
        self.pre_roll.extend(range(frame_id - self.silence_frames_req + 1, frame_id + 1))
        return VADEvent("speech_end", frame_id, len(utterance) * self.frame_ms)

probs = [0.04, 0.08, 0.66, 0.74, 0.69, 0.22, 0.15, 0.09]
vad = VoiceActivityDetector(frame_ms=20, silence_ms=60, pre_roll_ms=40)
for fid, p in enumerate(probs):
    ev = vad.process_frame(fid, p)
    if ev:
        print(f"{ev.kind:12s} at frame {ev.frame}, retained={ev.retained_ms}ms")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
speech_start at frame 2, retained=60ms
speech_end   at frame 7, retained=100ms
```
<!-- leetllm: output:end -->

Notice two details: ceiling division ensures a 61 ms silence threshold requires four 20 ms frames (80 ms) rather than prematurely firing at 60 ms, and `retained_ms` includes the 40 ms pre-roll (frames 0–1) plus active speech (frames 2–4) while stripping trailing silence (frames 5–7). Live phone lines often start near 300 ms of silence fallback and add semantic endpointing to eliminate mid-number cutoffs.[^livekit2026turn]

### VAD deployment: client vs. server

| Dimension | Client-side VAD | Server-side turn detection |
| :--- | :--- | :--- |
| **Barge-in speed** | Mutes local speaker with zero network RTT | Delayed by uplink plus downlink transport |
| **Bandwidth** | Can suppress silent frames before upload | Receives continuous upstream audio |
| **Tuning consistency** | Varies across browser and mobile hardware | Single centralized threshold and semantic model |
| **Best responsibility** | Immediate speaker mute and local capture | Authoritative turn commitment and tool dispatch |

Running both works best: local VAD mutes playback immediately on speech onset, while server-side endpointing combines acoustic silence with semantic completeness to commit the turn. Log speech onset and turn commit as distinct event types per device class when diagnosing false interruptions.

<figure>
  <img src="illustrations/_generated/vad_topology_dark.png" alt="Audio splits into local VAD for instant playback muting and server endpointing for committed turn transcripts, recording both signals separately by device class." />
  <figcaption>Local VAD owns fast playback muting while server-side endpointing owns turn commitment. Log both events separately per device class to separate mute errors from premature turn cutoffs.</figcaption>
</figure>

### Acoustic echo cancellation (AEC)

<span data-glossary="echo-cancellation">Acoustic echo cancellation (AEC)</span> stops the agent from hearing itself. On speakerphone or laptop speakers, the microphone picks up both the caller's voice and the agent's playback. Without working AEC, VAD mistakes the agent's own speech for a caller interruption, mutes playback, transcribes its own sentence, and loops.

Browser media APIs let applications request echo cancellation on capture tracks,[^w3cMediaCapture] yet actual suppression quality depends heavily on OS audio drivers, speaker volume, and room acoustics. Test AEC on real phones and laptops at high speaker volume rather than relying on headphones in a quiet office.

## From sound to text: speech-to-text

Streaming recognition overlaps decoding with speech; batch recognition waits for the caller to stop talking.

### Streaming STT (recommended for latency)

Streaming STT emits incremental hypotheses while audio arrives. Those interim strings frequently revise earlier words, so the <span data-glossary="state-machine">state machine</span> must keep tentative partials separate from committed text.

Safe actions split sharply across the commit line: an unstable partial like `"Close incident four two"` can trigger intent classification or a discardable read-only prefetch, whereas writing conversation history, speaking factual claims, or firing a side-effecting tool must wait for a boolean `committed is True`. Reject non-boolean flags such as the string `"false"`, which evaluates truthy in Python.

<!-- leetllm: test, output=show -->
```python title="streaming-stt-and-commit-check.py"
def common_word_prefix(a: str, b: str) -> str:
    shared = []
    for w1, w2 in zip(a.split(), b.split()):
        if w1 != w2:
            break
        shared.append(w1)
    return " ".join(shared)

def allowed_actions(text: str, committed: object) -> list[str]:
    if committed is not True and committed is not False:
        raise ValueError("committed must be a boolean")
    actions = ["classify_intent"]
    if "incident" in text.lower():
        actions.append("prefetch_read_only_status")
    if committed:
        actions.extend(["write_history", "speak_response"])
        if "close" in text.lower():
            actions.append("request_close_confirmation")
    return actions

partials = [
    ("What is", False),
    ("What is incident", False),
    ("What is incident four two", False),
    ("What is incident four two one nine?", True),
]
prev = ""
for text, is_final in partials:
    stable = text if is_final else common_word_prefix(prev, text)
    print(f"final={str(is_final):5s} | stable={stable!r:36s} | actions={allowed_actions(text, is_final)}")
    prev = text

try:
    allowed_actions("Close incident 4219", "false")
except ValueError as err:
    print("string_flag_rejected:", err)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
final=False | stable=''                                   | actions=['classify_intent']
final=False | stable='What is'                            | actions=['classify_intent', 'prefetch_read_only_status']
final=False | stable='What is incident'                   | actions=['classify_intent', 'prefetch_read_only_status']
final=True  | stable='What is incident four two one nine?' | actions=['classify_intent', 'prefetch_read_only_status', 'write_history', 'speak_response']
string_flag_rejected: committed must be a boolean
```
<!-- leetllm: output:end -->

### End-of-utterance STT

Running a batch model such as Whisper[^radford2022] after silence fires simplifies orchestration, but every millisecond of decoding stacks after endpointing. For a 1,200 ms utterance with 300 ms endpointing and 450 ms decode, the transcript is not ready until 750 ms after speech ends, before the LLM or TTS even starts.

| Approach | Post-speech delay before LLM | Operational complexity |
| :--- | :--- | :--- |
| **Streaming STT** | 0–100 ms finalization tail | Must track interim revisions and turn state |
| **End-of-utterance STT** | Endpoint wait + full decode (~750 ms) | Simple stateless batch request |

## Speak a first clause, not a full plan

Once the turn commits, the LLM's <span data-glossary="ttft">time-to-first-token (TTFT)</span> dominates responsiveness (see [Inference Mechanics](/learn/inference-mechanics-ttft-tps-kv-cache)). Prompt the voice model to emit short, plain-spoken clauses without Markdown syntax, and test how TTS pronounces domain identifiers like `4219` or `sev-two` so spoken numbers never confuse a caller.

### Slow tools don't get to steal the first word

An incident lookup might finish in 90 ms; paging an on-call engineer might take 2.4 seconds. Reserve the downstream synthesis, transport, and playout window (for example, 200 ms out of a 400 ms post-commit budget) as a hard deadline: if the tool has not returned by 200 ms, emit an honest status acknowledgement ("I am checking that now") and report the real outcome asynchronously when the tool finishes.

Never blur service acceptance with human delivery, and never treat spoken confirmation as authorization. Verify caller permissions in the tool executor, deduplicate retries with an idempotency key,[^awsIdempotentApis2026] and record executed side effects independently of conversation playback: muting "I paged the owner" does not unsend a page.

<!-- leetllm: test, output=show -->
```python title="acknowledge-then-finish-slow-tools.py"
def first_speakable_clause(intent: str, tool_state: str, *,
                           authorized: bool, confirmed: bool = False,
                           status: str | None = None) -> str:
    if authorized is not True:
        return "I cannot perform that request with this session's permissions."
    if intent in {"page_owner", "close_incident"} and confirmed is not True:
        return "Please confirm that action and incident number."
    if tool_state == "failed":
        return "That request failed. No change was confirmed."
    if intent == "lookup_status" and tool_state == "succeeded" and status in {"open", "closed"}:
        return f"Incident 4219 is {status}."
    if intent == "page_owner" and tool_state == "succeeded":
        return "The paging service accepted the page."
    if intent == "close_incident" and tool_state == "succeeded":
        return "The incident service confirmed the close."
    return "I am checking the request and will share the result once it returns."

cases = [
    ("fast_lookup", first_speakable_clause("lookup_status", "succeeded", authorized=True, status="open")),
    ("slow_page",   first_speakable_clause("page_owner", "pending", authorized=True, confirmed=True)),
    ("unconfirmed", first_speakable_clause("close_incident", "succeeded", authorized=True, confirmed=False)),
    ("failed_page", first_speakable_clause("page_owner", "failed", authorized=True, confirmed=True)),
]
for label, phrase in cases:
    print(f"{label:12s}: {phrase}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
fast_lookup : Incident 4219 is open.
slow_page   : I am checking the request and will share the result once it returns.
unconfirmed : Please confirm that action and incident number.
failed_page : That request failed. No change was confirmed.
```
<!-- leetllm: output:end -->

### Serving optimizations that matter in voice

Long phone calls stress inference differently than single-turn chat because a 20-minute call accumulates thousands of context tokens while still demanding low TTFT on every reply:

- **Paged KV memory:** Allocators such as <span data-glossary="pagedattention">PagedAttention</span> let long calls grow and evict <span data-glossary="kv-cache">KV-cache</span> blocks without fragmentation across concurrent sessions.[^kwon2023]
- **Speculative decoding:** Draft-and-verify decoding can trim clause latency when acceptance is high on short conversational turns.[^leviathan2023]
- **Context hygiene:** Drop superseded interim transcripts and unplayed interrupted speech so long calls keep only committed turns, tool results, and confirmed spoken replies.
- **Prefix-aware prompt caching:** Order every prompt from most stable to most volatile: (1) system instructions and style rules, (2) tool schemas and examples, (3) append-only committed turns, and (4) dynamic call state (current timestamp, fresh tool result, playout cursor). Putting `current_time` at the top breaks prefix reuse on every turn. Where APIs require explicit cache breakpoints, place them right after the static prefix.[^openai2026promptcaching]

Account for cached reads, cache writes, and uncached input tokens separately:

$$
\text{input cost} = T_{\text{read}} C_{\text{read}} + T_{\text{write}} C_{\text{write}} + T_{\text{ordinary}} C_{\text{ordinary}}
$$

Here each $C$ is price per token (per-million price divided by $10^6$), and the three token buckets are disjoint. Keep text and audio token pricing separate, and remember that prefix caching cuts LLM prefill time without fixing slow endpointing, tools, or TTS.

## Speaking without waiting for the full answer: TTS with streaming

Waiting for a full paragraph before calling TTS adds seconds of silence, while synthesizing every individual <span data-glossary="token">token</span> destroys prosody. Buffer incoming tokens until a clause punctuation mark (`,`, `.`, `!`, `?`) or a soft character limit arrives without splitting mid-word, then hand each clause to streaming TTS immediately.

<!-- leetllm: test, output=show -->
```python title="speaking-without-waiting-for-the-full-answer.py"
def flush_speakable_clauses(tokens: list[str], max_chars: int = 52) -> list[str]:
    buf = ""
    clauses: list[str] = []
    for tok in tokens:
        buf += tok
        stripped = buf.strip()
        if stripped.endswith((",", ".", "!", "?")):
            clauses.append(stripped)
            buf = ""
        elif len(stripped) >= max_chars:
            cut = buf.rfind(" ", 0, max_chars + 1)
            if cut > 0:
                clauses.append(buf[:cut].strip())
                buf = buf[cut + 1:]
    if buf.strip():
        clauses.append(buf.strip())
    return clauses

tokens = [
    "Incident ", "4219 ", "is ", "still ", "open, ",
    "severity ", "is ", "sev-two. ",
    "I ", "can ", "text ", "the ", "incident ", "link.",
]
for i, clause in enumerate(flush_speakable_clauses(tokens), 1):
    print(f"clause {i}: {clause}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
clause 1: Incident 4219 is still open,
clause 2: severity is sev-two.
clause 3: I can text the incident link.
```
<!-- leetllm: output:end -->

Cap the downstream TTS audio queue as well: if synthesis runs much faster than real-time playback and buffers ten seconds of audio ahead of the speaker, an interruption has to drain or discard a large backlog.

### How parallel execution reduces latency

Stacking every stage serially pushes our incident query to 510 ms. Overlapping them hits 380 ms:

1. **VAD** monitors frames continuously without blocking audio flow.
2. **Streaming STT** decodes speech before `0 ms`, leaving only a short finalization tail.
3. **LLM** begins generating the committed reply at 60 ms and hands off the first speakable fragment at 210 ms.
4. **TTS** synthesizes that opening fragment in parallel while the LLM finishes the rest of the sentence.

<figure>
  <img src="illustrations/_generated/pipeline_overlap_dark.png" alt="Comparison on a 0 to 520 ms clock: serial execution finishes at 510 ms, while overlapping STT finalization, LLM clause streaming, and TTS synthesis delivers first audio at 380 ms, saving 130 ms." />
  <figcaption>Running the exact same stage durations serially lands at 510 ms; overlapping STT, clause streaming, and TTS lands first audio at 380 ms.</figcaption>
</figure>

## When the user interrupts: barge-in handling

Suppose the agent starts explaining mitigation for incident 4219 and the caller cuts in at 650 ms with "Wait, page the owner." Barge-in is a three-step state transition, not just a speaker mute:

1. **Stop playback immediately:** Local VAD mutes the audio sink (target: under 100 ms p95).
2. **Cancel in-flight work:** Abort upstream LLM and TTS streams for the superseded `response_id`.
3. **Reconcile conversation history:** Keep only the assistant text confirmed played by the client's latest playback acknowledgement cursor.

<figure>
  <img src="illustrations/_generated/barge_in_state_dark.png" alt="Client confirms playout through 520 ms when barge-in occurs at 650 ms while generated audio reaches 1120 ms. History retains Incident is open and discards the unconfirmed database failover clause." />
  <figcaption>At the 650 ms interruption, the client has confirmed playout through 520 ms. History keeps "Incident is open" and discards the unconfirmed remainder so the model never assumes the caller heard it.</figcaption>
</figure>

> **Key insight:** Tie every playout cursor and cancellation event to a unique `response_id`. A delayed 520 ms acknowledgement from canceled `reply-1` must never cancel or overwrite active `reply-2`, and once `reply-1` is canceled its heard cursor stays frozen.

<!-- leetllm: test, output=show -->
```python title="when-the-user-interrupts-barge-in-handling.py"
from dataclasses import dataclass

@dataclass
class PlayoutChunk:
    text: str
    text_end_char: int
    playout_end_ms: int

class InterruptionHandler:
    def __init__(self, pending_text: str, chunks: list[PlayoutChunk], response_id: str = "reply-1"):
        self.pending_text = pending_text
        self.chunks = chunks
        self.response_id = response_id
        self.cancelled = False
        self.frozen_cursor: int | None = None

    def accept_audio(self, response_id: str) -> bool:
        return response_id == self.response_id and not self.cancelled

    def reconcile(self, playout_cursor_ms: int, *, response_id: str) -> dict[str, str]:
        if response_id != self.response_id:
            raise ValueError("acknowledgement belongs to a different response")
        if self.frozen_cursor is None:
            self.frozen_cursor = playout_cursor_ms
        self.cancelled = True

        heard_chars = 0
        for chunk in self.chunks:
            if chunk.playout_end_ms <= self.frozen_cursor:
                heard_chars = chunk.text_end_char
            else:
                break
        return {
            "kept": self.pending_text[:heard_chars].rstrip(),
            "discarded": self.pending_text[heard_chars:].strip(),
        }

pending = "Incident is open because the database failover is still running."
chunks = [
    PlayoutChunk("Incident is", 11, 240),
    PlayoutChunk(" open", 16, 520),
    PlayoutChunk(" because the database", 37, 860),
    PlayoutChunk(" failover is still running.", 64, 1120),
]

reply1 = InterruptionHandler(pending, chunks, response_id="reply-1")
outcome = reply1.reconcile(playout_cursor_ms=520, response_id="reply-1")
# Late ACK for reply-1 cannot unfreeze history; reply-2 rejects stale reply-1 ACKs.
assert reply1.reconcile(1120, response_id="reply-1") == outcome
reply2 = InterruptionHandler(pending, chunks, response_id="reply-2")
try:
    reply2.reconcile(520, response_id="reply-1")
except ValueError as err:
    mismatch_err = str(err)

print("kept:     ", repr(outcome["kept"]))
print("discarded:", repr(outcome["discarded"]))
print("late_audio_accepted:", reply1.accept_audio("reply-1"))
print("cross_reply_guard:  ", mismatch_err)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
kept:      'Incident is open'
discarded: 'because the database failover is still running.'
late_audio_accepted: False
cross_reply_guard:   acknowledgement belongs to a different response
```
<!-- leetllm: output:end -->

RTP packet arrival does not confirm playout; only the client's playback sink knows which frames reached the speaker. Always keep completed tool execution records even if the spoken announcement was interrupted mid-sentence.

## Cascaded pipeline vs. native audio

Native speech-to-speech APIs such as OpenAI's Realtime API[^openai2025gptrealtime] and Google's Gemini Live API[^google2026geminilive] stream audio directly into and out of a multimodal model over persistent sessions. They eliminate explicit STT and TTS handoffs and preserve prosody, tone, and hesitation that text transcripts strip away.

Yet native audio does not eliminate transport, AEC, barge-in, or state reconciliation. Providers differ in how they handle interrupted context: some retain audio already sent to the client buffer rather than audio confirmed played,[^google2026geminiliveCapabilities] while others expose explicit truncation events such as `conversation.item.truncate` with `audio_end_ms` (and caution that asynchronous input transcripts are approximate).[^openai2026realtimeclientevents]

<figure>
  <img src="illustrations/_generated/cascaded_vs_native_audio_dark.png" alt="Cascaded pipeline places transcript inspection and tool checks inline between STT, LLM, and TTS; native audio emits speech directly with transcript, tool authorization, and tracing handled on side channels. Both require turn detection, interruption, and a confirmed playout cursor." />
  <figcaption>Cascaded pipelines expose text checkpoints directly inline. Native speech models cut handoffs, while transcripts, tool verification, VAD, and playout cursors move to parallel side channels.</figcaption>
</figure>

> **Common mistake:** Treating a model's WebSocket endpoint as a complete browser audio stack. Even when the speech API uses WebSockets, browser capture, echo cancellation, jitter buffering, and playout tracking still need an explicit owner, typically a WebRTC media edge forwarding PCM to the model session.

### Session shape

Stateful voice sessions multiplex audio chunks, partial transcripts, tool proposals, and client playout acknowledgements on one stream. Process every part of a multi-part server event rather than stopping after the audio branch,[^google2026geminiliveCapabilities] track received audio separately from confirmed playout, and never mistake a model's proposed `tool_call` event for execution permission.

PCM format mismatches also silently corrupt playout cursors. Many voice sessions ingest 16 kHz mono 16-bit PCM and output 24 kHz mono 16-bit PCM.[^google2026geminilive] Duration follows directly from sample count and sample rate:

$$
\text{duration (ms)} = \frac{\text{sample frames}}{\text{sample rate (Hz)}} \times 1000
$$

Relabeling a 24 kHz stream as 16 kHz without resampling stretches every 20 ms chunk (480 samples, 960 bytes) to 30 ms, slowing the voice by 50% and breaking interruption timestamps.

<!-- leetllm: test, output=show -->
```python title="session-and-pcm-accounting.py"
from fractions import Fraction

events = [
    {"type": "transcript_delta", "text": "Incident is"},
    {"type": "audio_delta", "audio_ms": 160},
    {"type": "playback_ack", "playout_cursor_ms": 160},
    {"type": "transcript_delta", "text": " still open."},
    {"type": "audio_delta", "audio_ms": 220},
    {"type": "tool_call", "name": "send_incident_link"},
]

received_ms = confirmed_ms = 0
transcript, tool_proposals = [], []
for ev in events:
    if ev["type"] == "audio_delta":
        received_ms += ev["audio_ms"]
    elif ev["type"] == "playback_ack":
        confirmed_ms = ev["playout_cursor_ms"]
    elif ev["type"] == "transcript_delta":
        transcript.append(ev["text"])
    elif ev["type"] == "tool_call":
        tool_proposals.append(ev["name"])

# 20 ms mono 16-bit PCM at 24 kHz output vs mislabeled 16 kHz playback.
output_samples = 24_000 * 20 // 1000
actual_ms = Fraction(output_samples * 1000, 24_000)
mislabeled_ms = Fraction(output_samples * 1000, 16_000)

print(f"transcript: {''.join(transcript)!r}, proposals: {tool_proposals}")
print(f"received={received_ms}ms, confirmed={confirmed_ms}ms, unconfirmed={received_ms - confirmed_ms}ms")
print(f"480 samples (960 B): {int(actual_ms)}ms at 24kHz vs {int(mislabeled_ms)}ms if mislabeled 16kHz")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
transcript: 'Incident is still open.', proposals: ['send_incident_link']
received=380ms, confirmed=160ms, unconfirmed=220ms
480 samples (960 B): 20ms at 24kHz vs 30ms if mislabeled 16kHz
```
<!-- leetllm: output:end -->

### Audio tokenization

Native speech models do not feed raw 16 kHz waveform samples directly into <span data-glossary="transformer">transformer</span> attention. Systems like AudioPaLM and SpeechGPT compress audio into discrete semantic and acoustic codec tokens (for instance, AudioPaLM's w2v-BERT encoder emits 25 semantic token positions per second, decoded back to waveforms via SoundStream tokens).[^rubenstein2023][^zhang2023a] The chosen codec bitrate and token layout determine how much pacing, emphasis, and emotional tone survive decoding.

### Trade-offs

| Dimension | Cascaded (`STT -> LLM -> TTS`) | Native speech-to-speech |
| :--- | :--- | :--- |
| **Latency** | Extra serialization hops; mitigated via streaming overlap | Fewer model hops; still needs VAD, AEC, and transport |
| **Prosody and tone** | Text bottleneck drops acoustic nuance | Retains vocal tone, pacing, and hesitation |
| **Debuggability and tools** | Clean text checkpoints and deterministic tool checks | Harder to inspect failures or align truncated audio |
| **Modularity** | Swap STT, LLM, or TTS independently | Coupled to one provider session API |

Choose cascaded pipelines when transcript inspection, deterministic tool verification, and component independence matter most; evaluate native audio when prosody and end-to-end conversational expressiveness are primary product goals.

## Moving audio across the internet

TCP delivers reliable, strictly ordered bytes. When one TCP segment drops, every later audio frame stalls behind retransmission, causing head-of-line blocking and audible stutter. WebRTC prefers UDP media paths with RTP/RTCP timing feedback ([RFC 8835](https://www.rfc-editor.org/rfc/rfc8835)), falling back to TURN relays or TCP/TLS only when firewalls block UDP.[^perkins2021] WebSockets over TCP fit signaling and server-to-server PCM links, while browser live media belongs on WebRTC (note that [RFC 9220](https://www.rfc-editor.org/info/rfc9220/) also defines WebSocket over HTTP/3, though ordered stream semantics still differ from deadline-aware media datagrams).

<figure>
  <img src="illustrations/_generated/transport_comparison_dark.png" alt="Four 20 ms packets with one lost frame at 60 ms: WebRTC conceals the 60 ms gap and plays the 80 ms packet on schedule, while TCP WebSocket stalls later bytes behind retransmission." />
  <figcaption>On a 20 ms packet cadence, WebRTC conceals a missing 60 ms frame and plays the 80 ms frame on time, whereas TCP blocks later audio until the lost byte range recovers.</figcaption>
</figure>

### Jitter buffers and packet loss concealment

Network jitter causes packets sent every 20 ms to arrive unevenly. A jitter buffer delays playback by a small cushion (often starting around 20–60 ms) so late packets still meet their playout deadline:

$$
\text{deadline} = \text{packet timestamp} + \text{buffer delay}
$$

A static buffer is simple but adds constant lag or starves under congestion; an **adaptive jitter buffer** such as WebRTC's NetEQ expands smoothly during bursts and shrinks when the network stabilizes.[^chromiumNeteq] When a packet misses its deadline completely, packet loss concealment (PLC) extrapolates or synthesizes a short fill frame rather than freezing playback.

### Protocol comparison: WebRTC vs. WebSocket

| Feature | WebRTC Media (UDP preferred) | WebSocket over TCP |
| :--- | :--- | :--- |
| **Transport** | UDP preferred; ICE/TURN relay or TCP/TLS fallback | TCP |
| **Loss handling** | Deadline-aware (PLC, optional NACK/FEC) | Reliable byte stream (head-of-line blocking) |
| **Congestion control** | Media-aware via RTP/RTCP feedback | TCP congestion window, unaware of playout deadlines |
| **Encryption** | Mandatory DTLS-SRTP | TLS (`wss://`) |
| **Best fit** | Browser and mobile live voice | Signaling, server-to-server PCM |

## Scaling to thousands of conversations

WebRTC workers are stateful: each worker holds DTLS encryption keys, SRTP cryptographic counters, adaptive jitter buffers, and the live playout cursor for its active calls. Round-robin routing mid-call breaks decryption immediately. Pin every call to one media worker with consistent hashing or connection-aware routing, and let stateless STT, LLM, and TTS GPU pools scale independently behind the media tier.

<figure>
  <img src="illustrations/_generated/scale_sessions_dark.png" alt="Voice packets hash to one sticky media worker holding DTLS and media state, fanning out audio and text work to independently scaled STT, LLM, and TTS pools." />
  <figcaption>Pin stateful DTLS and jitter-buffer sessions to one media worker while letting CPU/GPU inference pools scale independently behind it.</figcaption>
</figure>

Size concurrency from a realistic call mix (utterance length, silence ratio, barge-in frequency, tool rate, and network loss) rather than a bare session count, and define explicit worker-failover behavior: reconnect the client, restore confirmed history where available, and inform the caller cleanly.

<!-- leetllm: test, output=show -->
```python title="keeping-media-sessions-affine.py"
import hashlib

workers = ["media-a", "media-b", "media-c"]

def assign_worker(session_id: str) -> str:
    digest = int(hashlib.sha256(session_id.encode()).hexdigest(), 16)
    return workers[digest % len(workers)]

# Verify consistent affinity across packets and jitter deadline math.
routes = [assign_worker("call-session-4219") for _ in range(4)]
print("sticky_worker:", routes[0], "| consistent:", len(set(routes)) == 1)

# Packet timestamp 40 ms arrives at 78 ms: compare 35 ms vs 45 ms jitter buffer.
for buf_ms in (35, 45):
    deadline = 40 + buf_ms
    verdict = "play" if 78 <= deadline else "conceal"
    print(f"buffer={buf_ms}ms -> deadline={deadline}ms -> arrival 78ms: {verdict}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sticky_worker: media-a | consistent: True
buffer=35ms -> deadline=75ms -> arrival 78ms: conceal
buffer=45ms -> deadline=85ms -> arrival 78ms: play
```
<!-- leetllm: output:end -->

## Review the voice design

A clean demo on wired Ethernet hides almost every real voice failure. Evaluate clean, interrupted, and lossy mobile traces together, counting timeouts and silent turns inside the TTFA denominator so a fast p95 on successful calls cannot mask dropped replies. Track time-to-acknowledgement separately from time-to-useful-answer.

| Check | Pass criterion |
| :--- | :--- |
| **Speech-end TTFA** | p50 and p95 measured on declared network slices, including timeouts in the denominator |
| **Commit-to-audio** | Tracked separately from endpointing so LLM/TTS/playout regressions stay isolated |
| **Turn detection** | Local VAD mutes fast; server semantic endpointing prevents mid-number cutoffs |
| **Transcript safety** | Unstable partials may prefetch reads only; speech and side effects require boolean commit |
| **Slow tools** | Honest acknowledgement before the deadline; executor verifies auth and idempotency |
| **Barge-in** | Mute meets p95 target and history truncates to response-scoped confirmed playout |
| **Echo and transport** | AEC tested on real speakerphones; WebRTC jitter and PLC tuned under packet loss |

### Follow-up questions

- A 300 ms silence rule feeds a 320 ms post-commit path. What is speech-end TTFA, and which two changes bring it below 500 ms?
- A page tool succeeded, but the caller barged in before hearing the spoken confirmation. What belongs in tool state versus conversation history?
- After reconnecting a dropped WebRTC worker, how do you stop a stale audio chunk or playout ACK from mutating the new response?

### Evaluation rubric

- Separates acoustic speech end, turn commit, stable transcript, and client playout clocks.
- Overlaps STT, LLM clause streaming, and TTS without hiding endpointing, timeouts, or slow tool latency.
- Distinguishes transcript confidence, caller authorization, user confirmation, and backend execution results.
- Reconciles barge-in against response-scoped confirmed playout while keeping executed side effects intact.
- Justifies WebRTC vs. WebSocket, cascaded vs. native audio, and sticky media vs. elastic inference tiers from measured workloads.

```mastery-quiz
[
  {
    "question": "A call's acoustic speech ends at 1,000 ms, its turn commits at 1,300 ms, and first audio plays at 1,640 ms. Targets are 500 ms speech-end and 400 ms post-commit. Which diagnosis fits?",
    "options": [
      "640 ms and 340 ms; speech-end fails while post-commit passes.",
      "340 ms and 640 ms; speech-end passes while post-commit fails.",
      "640 ms and 640 ms; both fail because first playback stops both timers.",
      "340 ms and 340 ms; both pass because commit replaces speech end."
    ],
    "answer": "640 ms and 340 ms; speech-end fails while post-commit passes.",
    "explanation": "Speech-end TTFA is 1,640 - 1,000 = 640 ms (over 500 ms), while post-commit latency is 1,640 - 1,300 = 340 ms (under 400 ms). The 300 ms endpointing delay belongs only to the speech-end clock."
  },
  {
    "question": "A VAD retains quiet pre-roll and trims trailing silence. Frames are 30 ms, required silence is 61 ms, and pre-roll is 30 ms. Probabilities at frames 0 through 5 are [0.1, 0.7, 0.8, 0.2, 0.2, 0.2] with threshold 0.5. Which `speech_end` frame and retained duration result?",
    "options": [
      "Frame 4, 90 ms",
      "Frame 5, 90 ms",
      "Frame 5, 180 ms",
      "Frame 4, 60 ms"
    ],
    "answer": "Frame 5, 90 ms",
    "explanation": "61 ms requires three 30 ms silence frames (90 ms), so speech ends at frame 5 (frames 3, 4, 5 are silent). Trimming those three trailing frames leaves frame 0 (pre-roll) plus frames 1 and 2 (speech) = 3 * 30 = 90 ms."
  },
  {
    "question": "An interim transcript reads `Page incident 8316`, then revises to `Track incident 8316`. Event A carries boolean `committed=False`; event B carries string `committed=\"false\"`. What should happen?",
    "options": [
      "A speaks after prefetch; B converts the string and speaks.",
      "A speaks after prefetch; B is rejected.",
      "A may classify and prefetch a read; B is rejected.",
      "A may classify and prefetch a read; B commits speech because the string is nonempty."
    ],
    "answer": "A may classify and prefetch a read; B is rejected.",
    "explanation": "Uncommitted partials allow discardable read prefetching only, never speech or history writes. A nonempty string is truthy in Python and must be rejected rather than treated as a boolean flag."
  },
  {
    "question": "In case A, the caller confirmed page P47 and the paging service accepted it, though delivery is unknown. In case B, a committed turn and confirmation request page P48, but the executor permission check denies it. What is right?",
    "options": [
      "A reports the owner received the page; B dispatches because confirmation passed.",
      "A reports service acceptance without claiming delivery; B dispatches.",
      "A reports the owner received the page; B blocks dispatch.",
      "A reports service acceptance without claiming delivery; B blocks dispatch."
    ],
    "answer": "A reports service acceptance without claiming delivery; B blocks dispatch.",
    "explanation": "Service acceptance does not confirm human delivery. In B, caller confirmation never overrides the executor's active permission check."
  },
  {
    "question": "Reply A chunks are `Owner is` (end char 8, 180 ms), ` paged.` (15, 410 ms), ` ETA is` (22, 650 ms), and ` five minutes.` (36, 900 ms). Reply A cancels at ACK 450 ms. Later, after Reply B starts, a late ACK 900 ms arrives labeled Reply A. What happens?",
    "options": [
      "Keep `Owner is paged.`; leave Reply B untouched and Reply A frozen.",
      "Keep `Owner is paged. ETA is`; leave Reply B untouched.",
      "Keep `Owner is paged.`; cancel Reply B and extend Reply A.",
      "Keep `Owner is paged. ETA is`; cancel Reply B and extend Reply A."
    ],
    "answer": "Keep `Owner is paged.`; leave Reply B untouched and Reply A frozen.",
    "explanation": "At 450 ms, the last fully confirmed chunk ends at 410 ms (offset 15). Cancellation freezes Reply A permanently, and a stale Reply A event must never affect Reply B."
  },
  {
    "question": "A mono 16-bit PCM chunk has 960 sample frames produced at 48 kHz, but the sink plays it at 24 kHz without resampling. What are its intended duration, played duration, and raw byte size?",
    "options": [
      "Intended 40 ms; played 20 ms; 960 bytes.",
      "Intended 20 ms; played 40 ms; 960 bytes.",
      "Intended 40 ms; played 20 ms; 1,920 bytes.",
      "Intended 20 ms; played 40 ms; 1,920 bytes."
    ],
    "answer": "Intended 20 ms; played 40 ms; 1,920 bytes.",
    "explanation": "960 / 48,000 = 20 ms intended; 960 / 24,000 = 40 ms played. At 2 bytes per 16-bit mono sample, 960 * 2 = 1,920 bytes."
  },
  {
    "question": "A media packet with timestamp 40 ms arrives at 78 ms. Compare fixed jitter buffers of 35 ms and 45 ms using `deadline = timestamp + buffer`. What happens?",
    "options": [
      "Play at 35 ms; play at 45 ms; later packets gain 10 ms.",
      "Conceal at 35 ms; play at 45 ms; every packet gains 10 ms delay.",
      "Conceal at 35 ms; conceal at 45 ms; every packet gains 45 ms delay.",
      "Play at 35 ms; conceal at 45 ms; only this packet gains 10 ms."
    ],
    "answer": "Conceal at 35 ms; play at 45 ms; every packet gains 10 ms delay.",
    "explanation": "Deadlines are 75 ms and 85 ms, so arrival at 78 ms misses 35 ms (concealed) and meets 45 ms (played). Raising a fixed buffer by 10 ms shifts every packet's playout deadline by 10 ms."
  },
  {
    "question": "A prompt splits into 2,000 cached-read tokens ($0.20/M), 600 cache-write tokens ($1.25/M), and 400 ordinary tokens ($1.00/M). What is the input subtotal?",
    "options": [
      "$0.00092",
      "$0.00140",
      "$0.00155",
      "$0.00215"
    ],
    "answer": "$0.00155",
    "explanation": "Reads: 2000 * 0.20 / 1e6 = $0.00040. Writes: 600 * 1.25 / 1e6 = $0.00075. Ordinary: 400 * 1.00 / 1e6 = $0.00040. Sum = $0.00155."
  },
  {
    "question": "Out of 100 attempted calls on a mobile slice, 96 produce audio, 92 start audio within 500 ms, and 4 time out silently. The SLO requires at least 95% of attempted calls within 500 ms. Which report is accurate?",
    "options": [
      "92/96 = 95.8%; pass while tracking timeouts separately.",
      "96/100 = 96.0%; pass because audio eventually arrived.",
      "92/100 = 92.0%; pass because successful calls beat 95%.",
      "92/100 = 92.0%; fail the 95% target."
    ],
    "answer": "92/100 = 92.0%; fail the 95% target.",
    "explanation": "All 100 attempted calls belong in the denominator; dropping four silent timeouts inflates attainment to 95.8% and hides failed calls."
  }
]
```

> **Next:** Continue to [Reasoning Agent System Design](/learn/design-reasoning-agent-test-time-compute). This chapter kept extra thinking off the first-audio path so a live call could stay interruptible. The last system-design capstone asks the opposite question: when is a request hard enough that extra <span data-glossary="test-time-compute">test-time compute</span>, tools, and evidence checks should run before the system releases an answer or a side effect?
