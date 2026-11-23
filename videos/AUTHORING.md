# Authoring lessons and visual stages

The [teaching standard](TEACHING_STANDARD.md) defines what a lesson must teach. This guide defines how to organize its code. Readable source is part of the deliverable, alongside the narration, pictures, and review evidence.

For a film rewrite, use the [editor brief](EDITOR_PROMPT.md) to plan the spoken lines and the action together. It pairs worked examples with the lines the audience hears.

## Plan the explanation before the machinery

Read the current article, reader chapter, quiz, and selected film. Choose one central question and carry a concrete example to its answer. Give intuition, derivations, and visible intermediate states the time they need. Put advanced variants after that result, with a clear reason to introduce each one. Use familiar analogies and physical models when they lower the entry cost, then connect their objects to the real computation.

Use `vizmatic/stage` for new motion explanations and inspect the installed release's object catalog and documented APIs before implementing custom geometry. Build a representative scene with the intended transforms, morphs, camera direction, and mathematical objects before scaling the approach to the whole lesson. Keep stable object identities and let motion expose their relationships. Existing Canvas films and animated TSX figures can be maintained in their supported paths.

Treat article, book, and film as coordinated explanations of the same idea. When an example changes, reconcile values, symbols, captions, diagrams, and adjacent-lesson handoffs. A source fingerprint can flag a change; editorial review determines whether the selected film still teaches the revised lesson.

## Cut from the brand animation to the first teaching picture

Every export plays the four-second LeetLLM animation and chime. At 00:04.000, the film cuts directly to the object the viewer will follow. For example, show the covered word and the labeled probability strip as soon as the animation ends. In Stage, put the object in the initial scene. In Canvas, paint it at scene time zero. Leave the logo and the opening transition to the renderer.

Keep narration, score, captions, and visual cues relative to their scene. The renderer places the first lesson chapter at 00:04.000. Existing lessons that specify `opening: lesson` receive the same branded opening. New lessons can omit the field.

If a prediction caption includes the answer too soon, put the phrase that begins the answer in the beat's `caption_starts` list. The new caption starts when the narrator reaches that phrase. See the [caption rules](README.md#render).

## Keep the lesson entry small

Use ordinary JavaScript modules. Put the stage order in the entry, numerical models in their own modules, and each meaningful stage in its own file. Each ordered stage entry corresponds to a narration scene ID. A long stage can compose additional stage files, as the KV Cache film's `shrink` stage does.

```text
videos/
  lessons/example.lesson.yaml
  films/example/
    index.mjs
    defaults.mjs
    model.mjs
    stages/
      opening.mjs
      accumulation.mjs
      prediction.mjs
```

Stage files can import shared defaults, models, and reusable visual pieces directly. Keep common typography, color roles, and drawing conventions in `defaults.mjs`. Create mutable visual objects once per film build, with explicit ownership when they carry between stages.

Add a test-data or drawing-helper module when it has a clear responsibility. A short lesson does not need every possible file. A long lesson should not put unrelated models, drawing helpers, and scene implementations in one function.

Canvas lessons use the existing audited painter:

```js
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { drawOpening } from './stages/opening.mjs';
import { drawAccumulation } from './stages/accumulation.mjs';
import { drawPrediction } from './stages/prediction.mjs';

const definition = defineCanvasLesson({
  id: 'example',
  validateModel,
  scenes: [
    { id: 'opening', draw: drawOpening },
    { id: 'accumulation', draw: drawAccumulation },
    { id: 'prediction', draw: drawPrediction },
  ],
});

export const { draw } = definition;
export { validateModel };
export default definition;
```

The compatibility file in `animations/` can re-export the entry and existing public model functions while callers migrate. It must not contain a second implementation of the lesson.

Stage lessons use `defineStageLesson` from the same module. Each stage module provides a `build(stage, clock, narrationScene)` function. The composer uses the existing [measured Stage clock](stage-lessons/README.md); it does not introduce another scheduler. Keep cross-scene objects and their ownership explicit.

A continuous film can compose its imported stage builders inside `stageLesson`. Create its shared defaults once in that build, return named objects from a stage that creates them, and pass those objects explicitly to later stages. The Attention film demonstrates this pattern with persistent query and key geometry.

## Separate the model from its picture

The model owns the inputs, units, calculations, and decisions. Scene code turns that state into a picture. Use named parameters and return values that describe the subject, such as `radius`, `acceptedRequests`, or `prefixState`.

Keep numerical functions deterministic and independent of the drawing context. Derive operands, labels, geometry, and verdicts from the same state. Distinguish an intermediate construction from its settled result, and use an approximation sign when displaying a rounded mathematical value.

Share a helper when it expresses a reusable operation. Keep a topic-specific calculation with its lesson. Avoid large context objects that expose every local variable to every scene.

## Distinguish operations from results

The narration YAML declares each spoken phrase once. Its phrase must match exactly once in the corresponding beat.

```yaml
visual_cues:
  - id: add-contribution
    phrase: Add this contribution to the running total
    targets: [running-total]
  - id: completed-total
    phrase: The total is twelve
    targets: [running-total]
```

For Canvas scenes, use `operationProgress(state, 'add-contribution')` to animate the addition. Use `resultAfter(state, 'completed-total')` to reveal its settled answer. Both helpers require resolved narration cues and reject unknown IDs. Progress approaching one does not grant permission to display a completed result.

For Stage scenes, `clock.on()` starts an operation and `clock.after()` reveals a result after its complete phrase. Keep the input change, question, prediction pause, and answer distinct. Preserve known information while the new operation develops.

## Play a sound during a narration hold

To let the viewer hear a signal, set `hold_sound` to its name on the narration beat. Export `holdSounds` from the film entry module. Each named entry takes a `sampleRate` in Hz and a mono `Float32Array` of PCM samples with values from -1 to 1. The signal starts when the spoken beat ends and must fit inside its `hold` in seconds. A Canvas scene can use `state.holdTime` to synchronize a playhead with those samples. The Voice Agents echo test draws and plays the same two notes.

## Make dependencies explicit

Relative imports form the lesson's source dependency graph. The shared `lessonSourceManifest` collector binds the entry, imported modules, narration, declared sample data, and local assets by path and content hash. Rendering, freezing, and editable packaging must use that same manifest.

Declare files read through the filesystem as inputs. A computed dynamic import requires an explicit target closure. A file outside the source root, an escaping symlink, an unresolved dependency, or a changed input must fail validation. Keep source assets local and reproducible during rendering. Fetching and preparing external material belongs in a separate preparation step.

Declare filesystem inputs that are not imports in `films/<id>/sources.json`. Its `files`, `assets`, and `dynamicImports` fields supplement the import graph. Paths are relative to the repository root. The collector hashes this sidecar and its declared inputs without executing author code. Tokenization uses it for the fallback fonts that its multilingual examples load from disk.

An illustration or paper figure needs its derivative image and source lineage metadata in the manifest. Preserve the source URL and version, source digest, locator, page or crop settings, derivative digest, and attribution. Show the material when it helps explain a particular claim, then connect it to the lesson's own construction. Keep citations legible and preserve the original figure's colors and meaning.

For Canvas lessons, prepare an embedded Vizmatic `ImageAsset` once with `prepareCanvasImage` from `lib/scene.mjs`. Draw the prepared result through `api.image(ctx, prepared, { x, y, width, height, fit: 'contain' })`. The painter records the fitted image bounds, applies the current transform and opacity, and uses its pixel alpha when checking whether it covers earlier text. `cover` fits a filled destination; an optional `crop` uses intrinsic image pixels. Keep the paper's white mat, caption, citation, and highlight as separate visual objects so each remains readable and can animate independently.

## Check changes at the right level

1. Validate the model and narration coverage before a full render.
2. Inspect meaningful intermediate states and adjacent frames around each completed result clause. Include the prediction hold.
3. Run layout and containment checks while objects move. A settled frame never guarantees that the transition is clear.
4. Inspect the encoded export independently. Bind its source, images, assets, and review to the exact delivered movie.

For a mechanical reorganization, preserve the original source and compare the exported model behavior and actual rendered states against that baseline. A formatting pass needs parser and AST checks; scene extraction also needs rendering parity. Neither replaces a fresh review of a changed explanation.

Keep historical review records intact. A current source manifest, an older encoded review, a continuous listening review, and native Apple playback verify different facts. Record each at its actual scope.

## Apply a reviewed closing change

Use `tools/apply-ending-patches.mjs` for an exact, independently reviewed final speech patch. The helper defaults to a read-only check:

```bash
node videos/tools/apply-ending-patches.mjs \
  --authorization build/closing-pilot/authorization.json \
  --archive build/closing-pilot/new-application
```

The authorization JSON binds the current `plan`, its `reviewedPlan`, the independent `peer`, `ownerHolds`, ordered `subjectIds`, and `protectedFiles`. File records contain repository-relative `path` and SHA-256 `sha256` fields. The peer must accept every subject in the reviewed plan without findings. Owner holds must confirm no active writer, and the coordinator must clear each subject against frozen live plans. A later structural source pointer requires bound `sourceLineage` or `sourceOverrides` evidence. Optional `preconditions` bind other required review records.

Each plan names the exact narration file, final scene and beat, old and new `say`, raw replacement offsets and literals, and expected whole-file digest. The helper checks a unique raw anchor, exact inverse, and parsed equality with only that speech change. An explicitly reviewed full closing cue phrase may change with its matching speech; its ID, targets, and other metadata stay exact. The next article and quoted support must still match their bound bytes.

Add `--apply` only within the authorized subject scope. The archive parent must already exist, and the new archive must be outside product sources without symlinks. Before writing, the helper archives all original narration, bound review inputs, and protected files. It then checks each current file again and replaces it atomically. Existing archives are never reused. If a batch stops partway, preserve its `incomplete.json` and inspect the recorded applied IDs before moving on.

A speech patch requires new provider audio and word timestamps for the changed beat. It does not renew an older coverage review, source approval, or movie. After separate generation authorization, use a new installed release consumer and isolated output directory:

```bash
node videos/render.mjs --lesson ID --audio-only \
  --tts-script videos/tts.py --output NEW_QA_OUTPUT --no-manifest
```

Run that command from the new consumer repository. Keep the actual TTS adapter, voice, rate, and provider bound. Never use the changed beat's old audio or word timings. Any reuse of unchanged beat pairs requires exact text and cache-key bindings in the approved intake. Resolve every cue in the changed beat against its new provider words, then inspect the whole final scene, earlier result transitions, and prediction hold at native resolution. Current coverage and factual review, source and runtime approval, immutable cohort preparation, and a new independent encoded review remain separate gates. The retained-audio-only cohort runner cannot generate missing speech.

## Write code for the next author

Use the configured formatter. Give calculations and important drawing steps names. Keep control flow, statements, and object definitions on readable lines. Preserve named geometry anchors such as `rowY`, `columnWidth`, and `axisOrigin` so an author can adjust the layout in one place. Scene extraction should keep those bindings instead of repeating their numeric literals throughout a file. Comments should explain an assumption, a mathematical convention, or a visual choice that the code cannot explain by itself.

Generated output may be compact. Authored models, scenes, illustrations, and tools must remain readable. Do not compress them to reduce file size or token usage.
