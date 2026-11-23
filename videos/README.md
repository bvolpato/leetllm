# LeetLLM video lessons

Every lesson video follows the [video teaching standard](TEACHING_STANDARD.md), which sets the rules for accuracy, completeness, and review. The [delivery plan](DELIVERY_PLAN.md) describes how the remaining lessons reach it.

For a full-length directed lesson, edit its picture in `videos/full-directors/lessons/<id>/film.mjs` and its speech in the adjacent `narration.json`. From the repository root, one command renders the lesson with the four-second LeetLLM opening, the course voice, a quiet background score, timed English captions, and chapters.

```sh
node videos/full-directors/render.mjs agent-orchestration --out build/agent-orchestration.mp4
```

To preview a chapter while editing, use the still-image command in the [full-length film guide](full-directors/README.md).

Use the [authoring guide](AUTHORING.md) for readable stage files, shared defaults,
numerical models, measured result cues, and reproducible source assets.

The video pipeline is reusable across technical subjects. Each lesson supplies
its own scene markup, narration script, and animation module; the shared renderer,
audit tools, and Vizmatic library provide timing, math, transitions,
Canvas components, and MP4 export. Keep authored sources and dependency locks in
Git. Generated MP4s, review frames, archives, and speech caches stay under ignored
build directories.

The web and video packages pin the published `vizmatic@0.8.3` release. Use
Node.js `^22.18.0 || >=24.11.0` and npm 11.21.0 for the video package. From the repository root:

```bash
cd videos
node check-npm-release-age.mjs package-lock.json
npm ci --ignore-scripts
```

The published-runtime CI job installs that public package from the integrity-bound npm lockfile and checks the legacy lessons and production contracts. The seven-day release-age guard permits only the exact tested first-party `vizmatic@0.8.3` release to bypass its cooldown. Every other package and version keeps the age rule.

For local review movies, build the exact merged Vizmatic revision in `vizmatic-review.commit` and link it into an isolated video installation. Retain that clean source checkout while movies depend on it, and record its commit and renderer hashes with each review. The compatibility workflow checks the same pin and upstream `main`. Follow the storage-admitted setup in [CI and runtime compatibility](CI_COMPATIBILITY.md). These source changes are newer than the npm release; the production package pins remain unchanged.

The renderer
hashes Vizmatic's distributed runtime, including imported chunks and renderer
font/emoji assets, alongside its entry, package metadata and dependency lock.
A change to that engine invalidates cached scenes and production audit bindings.
The batch source freeze also rejects engine changes during a run.

The [visual teaching rubric](visual-teaching-rubric.json) guides the current
collection-wide improvement pass. Its target is 95/100 with explicit clarity and
animation floors. Every lesson needs its own evidence and decision. A target
does not override an observed weakness or establish superiority to another creator.

`render.mjs` writes paragraph captions from the measured word events. Use
`npm --prefix videos run render` for a complete collection render. The collection
and batch workflows also run the caption finalizer to verify the exported cues
and update their delivery evidence before visual audits.

## Choose the H.264 encoder

The course renderer uses `libx264` by default. For a 1080p30 review on a Mac with a compatible Vizmatic installation, add `--h264-encoder videotoolbox` to `node videos/render.mjs`. The renderer selects one encoder before it paints the movie. If hardware encoding is unavailable, it uses `libx264` for the full film. The verification receipt records the requested encoder and the encoder used for the intro and scenes.

For a course rewrite, pass the same `--h264-encoder videotoolbox` option to both `rewrite-cohort.py freeze` and `rewrite-cohort.py render`. Each freeze identifies its encoder preference so a retry can verify its master.

## Run a prepared render cohort

The Linux cohort runner renders one film at a time by default. To prepare a new Vizmatic 0.8.1 cohort for up to four concurrent films, set the cohort definition’s `policyId` to `vizmatic-0.8.1-parallel-4-v1`. Bind that definition’s path and SHA-256 in the release spec before you materialize the consumer. Prepare and approve each job with that consumer. The CLI help lists the inputs for each step.

```bash
node videos/tools/render-cohort.mjs help
node videos/tools/render-cohort.mjs run --cohort /path/to/prepared-cohort --jobs 4
```

The runner reserves 3 GiB per active film above the 40 GiB free-space floor. Each film writes to its own job directory. If a worker fails or the controller receives SIGINT or SIGTERM, the controller stops its active process groups and waits for them before it releases the cohort lock. Jobs still in the queue remain eligible for a later run. Previously approved serial cohorts keep their original policy.

## Local visual teaching review

### Publication curation

Use [the publication rubric](curation-rubric.json) to choose which lectures
deserve posting. This is a separate editorial decision from the earlier
95-point technical/editorial improvement target. A POST recommendation needs
90/100, every dimension floor, no material blockers, an individual judgment of
every authored scene, and exact movie/source/image bindings. A long generic
introduction or conclusion can block publication even when its labels fit.

`REWORK` is an internal recommendation. Its catalog decision stays
`QUARANTINE` until the changed movie earns a fresh review. Keep the short
LeetLLM opening. Use a prediction, visible construction and same-example payoff
to replace static lesson summaries. New numbers or motion should explain a
change in the model, experiment or system state.

```bash
# Render and audit a fresh full collection. The batch also creates encoded-review
# frames from the exact movies and receipts in this output directory.
node videos/batch.mjs --collection videos/collections/complete-curriculum.json \
  --output build/video-curation-20261027/input --jobs 6 --threads 2 --no-package

# Bind those current renders to reviewer assignments.
node videos/prepare-curation-review.mjs \
  --input build/video-curation-20261027/input \
  --collection videos/collections/complete-curriculum.json \
  --output build/video-curation-20261027/assignments \
  --shards 6 --rotate 1

# Once review JSON files are in the explicit reviews directory, require a
# complete curation bound to those fresh assignments and current renders.
node videos/curate.mjs \
  --assignment build/video-curation-20261027/assignments/assignment.json \
  --reviews build/video-curation-20261027/reviews \
  --output build/video-curation-20261027/curation.json \
  --require-complete --require-current-render

# Build POST / QUARANTINE tabs, reasons, scene judgments and CSV/Markdown tables.
node videos/curation-gallery.mjs \
  --catalog build/video-curation-20261027/curation.json \
  --output build/video-curation-review-20261027

# Find candidate text-heavy states in registered native source-frame samples.
node videos/audit-text-density.mjs \
  --assignment build/video-curation-20261027/assignments/assignment.json \
  --output build/video-curation-20261027/text-density.json
```

The batch runner freezes lesson and video-tool inputs, including the render
runtime, throughout rendering. Let it finish before changing those inputs, then
prepare assignments from its completed output. Assignment generation rejects
renders whose current source fingerprint has changed.

The curation gallery runs locally at
`http://localhost:18470/video-curation-review-20261027/` on the build-directory
server. Movies stay in their existing build directories. The generator creates
links and source snapshots; it does not copy or upload the movies.

Density diagnostics count visible prose, numeric tokens and label footprint,
with mathematical objects reported separately. They inspect registered source
samples rather than performing OCR on every encoded frame. A low word count
does not establish visual teaching value. Every POST needs positive editorial
evidence that the animation makes the explanation worth watching.

The catalog records the engine used for the reviewed movie and whether its
full render fingerprint still matches the current checkout. An engine upgrade
does not rewrite the earlier visual review. Changed authored scenes require a
new export and review. Baseline curation is labeled separately from the current
regenerated collection. The final readiness command names its assignment and
review paths explicitly; the default paths may refer to baseline material.
Combining `--require-current-render` and `--require-complete` rejects an
incomplete or stale final collection.

### Earlier technical/editorial gallery

Generate the current collection review without copying or uploading movies:

```bash
node videos/visual-teaching-gallery.mjs
```

The output is `build/video-visual-teaching-review-20261023/index.html`. The existing
build-directory server serves it at
`http://localhost:18470/video-visual-teaching-review-20261023/`. The gallery covers
all 199 lessons with searchable table and card views, current scripts, source
downloads, independent findings, evidence links and native 16:9 video playback.

Source reviews come from the six `build/visual-teaching-*/review.json` shards.
Pass repeated `--source-review FILE` options to select a new complete set of
review shards while preserving earlier records. IDs must belong to the collection
and appear once across the selected files.
Retained decisions require matching animation and markup hashes and complete
scene coverage. Independent findings remain visible until their resolution is
recorded. Source acceptance, technical verification and final movie approval have
separate labels. Previous scores describe the earlier reviewed export.

By default, the generator checks the four current visual-teaching render waves.
Pass repeated `--render-root DIR` options to choose other deliveries, including a
later consolidated collection. A replacement becomes the primary player only
when its current source fingerprint, movie and delivery hashes, geometry,
occlusion, encoded frames, text, declared motion and paragraph captions verify.
It remains labeled editorial review pending. Missing or stale checks leave the
original playable, with the candidate available separately for inspection.

Fresh scores and final approval require `--editorial FILE`. That JSON names
`"rubric": "videos/visual-teaching-rubric.json"` and provides a `lessons` array.
Each row records `id`, `movieSha256`, `sourceFingerprint`, all `reviewedScenes`,
`viewedImages` with paths and SHA-256 hashes from that movie's encoded-review
bundle, `overallScore`, the rubric's six `dimensionScores`, `readyForYoutube`,
`findings` and `blockers`. Approval requires current bindings, no open findings,
the rubric's score and dimension floors, and all technical checks. The generator
never derives a new editorial score from a source decision or an older score.
Findings from a review bound to the playing movie appear in its detail panel.
A source correction awaiting an export remains open against the old movie until
a new encoded review closes it. Reviews for other exports remain linked as
history and do not change the playing movie's score.

A retained source can receive a fresh editorial review of its original movie.
Bind that row to the original receipt and add `authoredSourceSha256` with
`animation` and `markup` hashes for the exact retained files. Original technical
receipts, authored-source hashes, sample coverage, and text, motion and caption
bindings still have to verify. Recorded historical audit-tool and render-engine
provenance stays explicit. Revised sources require a
matching new export before approval; their original movie remains a comparison.
When several current editorial records exist, their scores are shown separately
and every bound reviewer must clear acceptance before the movie is approved.
The table shows the lowest current bound score. Put derived contact pages,
source previews and separately extracted frames in `additionalViewedImages`,
with their hashes and provenance. The gallery links those supporting views;
only registered images from the exact movie's encoded-review bundle satisfy
the `viewedImages` evidence gate.

Regenerate after source changes, render completion or updated review decisions.
The generated `review-data.json` keeps exact hashes and pending checks available
for inspection. This local gallery does not deploy or publish the collection.

When localized corrections finish in separate render directories, assemble a
single complete collection from an explicit selection:

```bash
node videos/assemble-delivery.mjs \
  --collection videos/collections/complete-curriculum.json \
  --selection build/final-export-selection.json \
  --output build/video-final-delivery
node videos/audit-audio.mjs --input build/video-final-delivery --jobs 8
```

The selection has a `lessons` array with `id`, `sourceDirectory`, and the exact
`movieSha256` for every canonical lesson. Assembly rejects missing or duplicate
IDs, changed movies, stale sources, and failed production gates. It creates
relative directory links, retains the original verification receipts, and
records the measured duration. Keep the selected render directories beside the
assembled directory. Editorial review and audio measurements remain separate
gates. Assembly performs no upload or publication.

## YouTube selection and private review gallery

The [publication rubric](publication-rubric.json) selects the current video when
its visuals make the subject substantially easier to learn than the article.
Keep requires 82/100 overall, visual learning value 30/40, explanation 20/25,
visual execution 19/25, standalone viewing 6/10, the existing production score
of at least 90/100, and no publication blocker. Production quality and video
suitability remain separate scores. A skipped lesson includes a specific reason
and the treatment needed for reconsideration.

The [annotated decisions](reviews/youtube-selection.json) bind every decision to
its source fingerprint, encoded movie hash, reviewed scene IDs, and sampled
image hashes. The scope covers complete scripts, all scene overviews, sampled
motion, and native frames for keeps and borderline decisions. It does not claim
continuous manual playback or complete audible listening.

From the repository root, prepare current encoded evidence and regenerate the
gallery after the curriculum's existing rendering and packaging steps:

```bash
node videos/prepare-publication-review.mjs
node videos/private-gallery/prepare-assets.mjs
node videos/theme-study.mjs
node videos/publication-gallery.mjs \
  --input build/video-complete-curriculum \
  --selection videos/reviews/youtube-selection.json \
  --output build/youtube-gallery \
  --asset-manifest build/video-youtube-curation-20261021/assets/manifest.json \
  --asset-base-url / \
  --theme-study build/video-youtube-curation-20261021/themes
```

Changed movies, scripts, sampled evidence, or rubric criteria require a new
editorial review. `merge-publication-reviews.mjs` validates five complete review
shards before writing the canonical selection. Its input directory also contains
the assignment lists and current material bundles. The gallery generator rejects
missing decisions, stale evidence, and decisions that contradict the cutoff.

The hosted review gallery uses an owner-private Sites project with an R2 binding
named `BUCKET`. Sites dispatch protects the HTML, captions, posters, and video
byte-range requests. Keep that owner-only policy when deploying. The
[private worker](private-gallery/worker.mjs) streams media without buffering whole
movies and returns private, non-cacheable responses. Uploads are immutable and
verified against R2's stored SHA-256 checksum.

Use the Sites skill's source and private-publication workflow with
`private-gallery/package.mjs` to embed the generated HTML/JS/CSS/data in its
separate checkout. Upload generated assets with `private-gallery/upload.mjs`;
pass the exact Site origin and its service-access token through the hidden stdin
prompt. Keep credentials in session memory. The uploader verifies every stored
asset and compares a byte range from every video with the local movie. Generated
movies, posters, palette-study PNGs, archives, and credentials stay outside Git.

Public lesson recordings use the dedicated `leetllm-videos` R2 bucket at
`videos.leetllm.com`. The [video delivery guide](../docs/video-delivery.md)
explains immutable uploads, full-file and seek verification, caching, and the
article availability manifest. `publish-r2.mjs` updates that manifest only after
all selected public assets pass verification. The Learn list and article toolbar
open recordings in a native popup player.

`theme-study.mjs` renders the same attention, PCA, and quantization states in navy,
neutral charcoal, and warm paper without changing production renderer sources.
The samples are palette studies. A production palette change also needs component
defaults, formulas, icons, transitions, and the full rendered curriculum checked.

Narrated lessons use an editable scene language, a dedicated
animation module per lesson, and a shared rendering pipeline. Each script builds
the concepts from first principles, develops them through visual examples, and
returns to their practical limits. Each opens with a shared four-second LeetLLM
logo reveal and a quiet synthesized chime. The lesson then gives an introduction that
presents the subject, explains why it matters, and previews what the viewer will
learn. The articles supply the source material.

Narration follows [Narration that leaves room to think](../CONTENT_GUIDELINES.md#narration-that-leaves-room-to-think).
The voice explains the reasoning and draws attention to useful changes. Exact
arithmetic and repeated values remain on screen, with spoken numbers chosen for
the step they help the viewer understand. Review the whole script for rhythm and
check each explanation against its animation before rendering.

Language examples follow [Everyday English in language examples](../CONTENT_GUIDELINES.md#everyday-english-in-language-examples).
Use familiar words and grammatical sentences for tokenization, attention, and
word-order demonstrations. Keep technical labels on the system components.
Check that narration, visible words, and connections agree, then verify affected
token counts, merge choices, attention calculations, and segmentation scores
before rendering.

## Visual storytelling

See [Director’s cuts](director-cuts/README.md) for the short course editions, their editable scenes and the commands to inspect stills or render a movie.

Build an explanation through changes the viewer can follow. Keep an input,
token, weight, or answer recognizable as it becomes an intermediate result and
then an output. Introduce one action at a time, leave its result readable, and
carry useful context into the next step.

Time each construction to its spoken beat. Reveal a curve as values are
evaluated, move a secant toward a tangent, merge the actual token occurrences,
or redistribute a rounding residual into the remaining weights. Keep labels
and axes stable while the quantities they describe change. A moving point
should explain a changing quantity or a causal connection.

Review motion inside the beat, including adjacent frames around a transformation.
Beginning, middle, and end samples can hide a snap, an early completed reveal,
or a long unexplained still. Preserve pauses for prediction and reading. Motion
measurements can locate still sections; visual judgment determines whether a
construction teaches the idea clearly.

Treat each scene's visual description as a promise to the viewer. If the voice
says a value moves, a subset changes, or a calculation is revealed, render that
specific change during the same beat. Keep selected tokens and request identities
consistent across transitions. Show the inputs to a worked calculation before
its answer, including denominators, units, thresholds, and any supplied values.
Use an approximation sign when displaying rounded arithmetic. Leave answers
hidden long enough for a spoken prediction to be useful.

Give each narrated decision state its own beat. When a clock advances through
several cutoffs, separate those explanations and hold each result while the
voice explains it. Derive the visible ranking, metric labels, bars, and threshold
decision from the same current data snapshot. Label a displayed batch slice or
subset explicitly while showing the shape of the complete operation.

Keep running quantities and complete references distinct. Restrict a partial
sum to the terms already revealed, and derive trace footers from the current
snapshot. Label a target equation or full-fixture summary explicitly while the
construction is still in progress. A green test result must come from an
executed comparison; its reveal timing controls presentation only.

Check the plotted data as well as the painted geometry. Assert that every
intended point is admitted, including domain endpoints, and that curve domains
contain the values the explanation promises to show. Vizmatic keeps complete
scatter markers visible at inclusive domain edges; leave clearance around the
axes for their radii. Keep task identities readable throughout timeline growth.

Numerical assertions verify the simulation; frame audits verify geometry and
paint coverage. Review the narration against the rendered states separately.
A passing calculation or layout audit cannot establish that an animation teaches
the claimed mechanism. Check fixed graph diagrams especially carefully when the
script promises a changing queue, matrix product, evidence gate, or sampling step.

Derive quantitative labels and geometry from the same current model state. When
changing units, such as logits becoming probabilities, change the axis and labels
together. A transition can withhold quantitative labels until its geometry uses
the new scale. Keep prediction questions visible through their pauses, then reveal
the answer at its narrated cue.

Treat the end of a spoken clause as a state checkpoint. Complete the named
result by that point and keep it readable through the cue's hold. Build later
rows and receipts at their own cues. Derive plotted coordinates, labels, and
downstream inputs from one model snapshot. Keep a fixed value at its labeled
coordinate while its transfer or emphasis animates. Check each cue's target
against the specific input, candidate, or path being described.

Encoded inspection also reports content holds lasting at least six seconds and
adds representative frames to the review sheets. Compare those holds with the
narration to find constructions that finish early or remain still while the
voice describes a change. Reading and prediction pauses can be intentional;
the diagnostic supplies review candidates rather than a motion quota.

Check for established objects disappearing and rebuilding at narrated beat
boundaries with the separate continuity diagnostic:

```bash
node videos/audit-continuity.mjs --lesson agent-recovery --input build/video-review-renders --output build/continuity-review.json
```

Use `--all` for the curriculum. The tool compares measured source-rendered states
before and after each boundary, with two early probes to ignore brief fades.
It records repeated labels, substantial geometry, narration and exact input
hashes. Review each candidate against the script. A deliberate comparison or
reset can be useful; the report supplies no automatic editorial score. Scenes
whose current script differs from the measured timeline are explicitly skipped.

Check narrated changes inside their measured word windows with a second
diagnostic before bulk rendering:

```bash
node videos/audit-narrated-motion.mjs --all --input build/video-review-renders/previews --output build/narrated-motion-review.json
```

This tool selects action phrases and compares native pixels inside the declared
targets. It disables focus glow, corner annotations, context dimming, and scene
entrance opacity while retaining the cues' progress and reveal state. A highlight
alone therefore cannot satisfy the motion check. Contact sheets show the sampled
sequence, and the report binds the source, measured timeline, tool, and engine.

Review each candidate against its script. A comparison can hold a finished
result, and a cue can emphasize a stationary reference beside a moving object.
Pixel change establishes neither the mathematical result nor the meaning of
the change. Check both the named subject and its visible consequence, then
repeat the diagnostic when its bound sources change.

The compact `overview.png` shows one representative frame per scene. The full
contact sheet and scene sheets retain the sampled beat states for closer review.

## Editorial quality scores

For a new review pass, create a fresh ignored output directory and prepare the
current encoded evidence:

```bash
node videos/prepare-publication-review.mjs --output build/video-review
node videos/build-motion-atlases.mjs --output build/video-review
node videos/review-coverage.mjs --output build/video-review \
  --reviewers build/video-review --revisions build/video-revisions
node videos/audit-labels.mjs --all --input build/video-complete-curriculum \
  --output build/video-review/label-diagnostics.json
```

The motion atlas selects the most active narrated beat in every scene from the
decoded frame measurements. Four-scene pages keep the samples readable. Reviewer
records identify the images actually viewed and their hashes. The coverage table
separates those sampled visual reviews, full temporal decode, structural checks,
caption and playback evidence, and current-source reproducibility. Replacement
movies retain their own review and production gates. Existing movies stay
available for comparison.

The checked review records are in [reviews/visual-audit](reviews/visual-audit).
Pass `--reviewers videos/reviews/visual-audit` to load them when rebuilding the
coverage gallery. Their scores remain bound to the recorded movie and image
hashes; a changed export needs a matching review.

The label diagnostic compares actual glyph masks when they are available, so a
small text collision can be found even when the enclosing text boxes overlap by
only a few percent. Its candidates still need visual review. The full render
audit also checks layout, containers, connections, and later paint coverage.

Use `--all-frames` to catch collisions between the default three samples per beat:

```bash
node videos/audit-labels.mjs --lesson optimizers \
  --input build/video-complete-curriculum --all-frames --painted-text \
  --output build/video-review/optimizer-labels-all-frames.json --fail-on-warnings
```

This inspects registered text and math on every authored scene frame. Supply the
matching measured `timeline.json` files and check each report's `timingSource`;
missing timelines use estimates. The report includes local frame numbers and
global times for candidate review. Brand frames, later paint occlusion and final
encoded pixels require their separate checks. The collision rules and default
sampling remain the same.

`--painted-text` captures actual text paint calls and rasterizes complete glyph
masks with their font, alignment and transform. This avoids truncated native
font measurements. It also flags substantial text-box overlaps as separate
readability candidates, since interleaved labels can be confusing even when
their glyph pixels do not intersect. Unsupported paint operations appear as
warnings. Review these candidates visually before treating them as defects.

The [quality rubric](quality-rubric.json) assigns 25 points for correctness,
20 for teaching, 20 for visual clarity, 15 for explanatory animation,
15 for narration and pacing, and 5 for production and accessibility.
Review the complete script, every scene overview, motion sequences, and critical
native-resolution frames. Record concrete deductions and unresolved defects.
Automated checks support the review; they cannot establish teaching quality.
Scores of 85–94 indicate strong work, while 95–100 is reserved for exceptional
execution. A score records the stated inspection scope and does not imply
continuous playback or a complete listening review.

Each review binds its scores to the rubric, encoded movie SHA-256, and render-source
fingerprint. Replacing one invalidates the score. Reviewed image hashes are
verified and their files travel with the portable gallery. The gallery shows the
dimension breakdown, remaining refinements, rubric, and a sortable table with
CSV and Markdown downloads. To publish a complete current review:

```bash
uv run videos/quality.py --input build/video-complete-curriculum \
  --reviews videos/reviews/complete-curriculum.json
# Include the same review in the portable source-and-media archive:
uv run videos/package.py --input build/video-complete-curriculum \
  --lessons $(node -p 'JSON.parse(require("fs").readFileSync("videos/collections/complete-curriculum.json")).lessons.map(x=>x.id).join(" ")') \
  --require-text-ink --require-motion \
  --reviews videos/reviews/complete-curriculum.json
# Measure the full encoded audio separately:
node videos/audit-audio.mjs --input build/video-complete-curriculum
```

A review can set `minimumScore` to require a quality threshold for the entire
collection. Publication rejects any lower score before changing the gallery.
Scores remain derived from the rubric dimensions and require current movie
and reviewed-image evidence.

The audio audit measures integrated loudness, true peak, and long silences
against measured word boundaries. It also checks that the provider word events
cover the complete authored transcript, flagging truncated or repeated text.
Its review candidates do not establish
pronunciation quality or vocal expression. Keep full listening claims separate
from these measurements.

The reveal audit flags stable text repeatedly submitted at zero opacity across
sampled beats. It catches unreachable card labels such as a fourth reveal in a
three-beat scene. Use measured timelines when available:

```bash
node videos/audit-reveals.mjs --all --validate --fail-on-warnings \
  --input build/video-complete-curriculum --output build/reveal-audit.json
```

CI uses estimated timing when rendered timelines are absent. This sampled
draw-site diagnostic covers native text calls; math, SVG, later occlusion and
short reveal windows need their separate audits and visual review. Check the
spoken explanation against the changing states as well.
The report also lists clusters of at least three text labels below 25% opacity
at middle or late beat samples. Review these candidates for explanations that
remain too dim while the voice discusses them. Intentional transitions may
produce candidates; these do not fail the unreachable-text check.

The label audit checks registered text bounds at the same three points in every
narrated beat on a native 1920×1080 canvas. It reports intersecting labels for
visual review, including shallow formula and heading collisions:

```bash
node videos/audit-labels.mjs --all --validate --fail-on-warnings \
  --input build/video-complete-curriculum --output build/label-audit.json
```

This check covers registered labels at sampled times. Use encoded text-ink,
occlusion and frame inspection alongside it to review raster content and motion
between those samples.

The arrowhead audit finds registered arrow endpoints covered by later-painted
filled circles. It also checks whether a later-painted hollow circle's stroke
crosses any part of the triangular head. It uses effective paint opacity and
affine circle geometry. Use its candidates to inspect result markers, graph
nodes and moving transfer particles:

```bash
node videos/audit-arrowheads.mjs --all --estimated --output build/arrowhead-audit.json
node videos/audit-arrowheads.mjs --lesson transformer --input build/videos-next \
  --all-frames --output build/transformer-arrowheads.json
```

Each lesson report records its timing source. Missing measured timelines fall
back to estimates. `--all-frames` checks every authored source frame; the shared
opening and encoded pixels have separate checks. Inspect the flagged frames
before changing the illustration. Preserve a mathematical endpoint with a small
filled point behind the vector, or place a labeled reference beside it. Keep
moving values beside growing arrows, and clear transfer particles before they
reach the whole head. A hollow marker around the tip can still cross its sides.
Earlier-painted rings, other shapes, clipping and encoded pixels require
separate inspection. These source checks complement finite visual review.

Add `--closed-paths` to inspect simple closed teaching curves with round strokes,
including references painted before an arrow. The optional diagnostic captures
native linear path commands and their affine transforms without changing the
rendered pixels:

```bash
node videos/audit-arrowheads.mjs --lesson linear-algebra --input build/videos-next \
  --all-frames --closed-paths --output build/linear-algebra-paths.json
```

The report separates geometric intersection candidates from unsupported paths.
It supports convex clips only when they contain the entire stroke. Curved native
commands, ambiguous stroke matches and partial clips remain unsupported; these
also fail `--fail-on-warnings`. Inspect candidates in context: a vector crossing
a unit circle can be part of the explanation. Marker enclosures and encoded
appearance still need visual review.

## Concept icons

The [concept gallery](assets/concepts/gallery.html) contains 267 original SVG
symbols spanning learning, probability, retrieval, agents, serving, evaluation,
adaptation, compression and generation. Its source index covers 269 article
bundles and 757 glossary entries. Serve this directory through HTTP to browse
symbols, teaching briefs, source evidence and dark/light SVG downloads. The
packaged video player links to a browsable copy.

`assets/concepts/catalog.json` separates the available identifying symbol from
the preferred teaching representation. A diagram or simulation brief describes
the larger explanation to build. Each source records its review basis, current
SHA-256 and selected concepts. The opportunity review covers metadata, structure,
visual cues and selected full sections; it is separate from an editorial or
factual audit. Sources without a selected reusable symbol remain available for
custom illustration work.

```bash
# Rebuild or verify against the full repository corpus:
node videos/atlas.mjs
node videos/atlas.mjs --check
# Export the portable SVG collection, gallery and source index:
uv run videos/export-atlas.py --output build/videos-next/leetllm-concept-atlas.zip
```

The portable collection has no runtime package dependencies. Its relative SVG,
JSON and HTML files can move together into a dedicated project. Browse it with
any local HTTP server. The curation inputs live in `assets/concepts/curation/`.
After changing a source article or glossary entry, review its visual links and
update the matching curation record, review basis and SHA-256 before rebuilding.
CI rejects missing or stale source reviews.

The canonical SVGs use transparent 64 × 64 canvases and named `data-part`
elements. `assets/concepts/manifest.json` defines their teaching meanings and
the two color palettes. Keep each symbol paired with its existing label when
introducing a concept. Use the mathematical diagram to show the operation.

```javascript
import { drawConcept } from '../lib/concepts.mjs';

// Coordinates and size use the lesson's 1920 × 1080 logical canvas.
drawConcept(ctx, api, 'router', 800, 380, 96, {
  label: 'Router',
  parts: { 'chosen-route': 1 },
});
```

Each catalog object requires a visible label and appears with complete geometry.
Its label moves with the symbol. Animate its position, assignment or relevant
parts to explain a change. Decorative badges and outline reveals are prohibited;
the painter rejects the old `progress` option. Keep branding in the reusable
LeetLLM opening. `opacity` and the `parts` map control explanatory emphasis.
`theme: 'light'` applies the light palette.
The painter flattens SVG curves into audited vector paths, preserving
container membership, paint order and text-occlusion checks. Use the surrounding
painted card as a connector endpoint.
SVG geometry, the palette manifest and the icon renderer enter every video
fingerprint, so editing an icon invalidates old render receipts. The source
archive includes the SVG collection and gallery.

## Reusable scene components

Each lesson receives `api.components`, backed by Vizmatic's
`createCanvasComponents`. Use its panels, labeled cards, matrices, token rows,
particles, and fades when composing a scene. These components draw through the
same checked primitives as the rest of the lesson. Their labels, child shapes,
opacity, and connector anchors remain visible to layout and occlusion checks.

```javascript
export function draw(ctx, scene, state, api) {
  const { components, C } = api;
  const input = components.card({
    x: 300, y: 350, width: 260, height: 100, label: 'Birds',
    fill: C.panel, stroke: C.blue, textColor: C.ink,
  });
  const output = components.card({
    x: 1100, y: 350, width: 260, height: 100, label: 'sing',
    fill: C.panel, stroke: C.cyan, textColor: C.ink,
  });
  const route = api.connect(ctx, input, output, { color: C.cyan, gap: 12 });
  components.particle({ points: [route.from, route.to], progress: state.beatP, fill: C.yellow });
  components.matrix({
    values: [[1, 0], [0, 1]], x: 800, y: 620, cellSize: 96,
    style: { fill: C.panel, stroke: C.cyan, textColor: C.ink, font: 'mono' },
  });
}
```

Cards and panels return the original painted geometry, including audit metadata.
Pass it directly to `api.connect`. A panel's optional callback runs inside a
container scope; `scope: 'label'` restricts checks to its labels. Use `math`
inside a panel callback for TeX. `opacity` fades the whole card, while
`labelOpacity` reveals its text separately. `matrix` accepts `format` and
`cellStyle` callbacks for numeric formatting, highlights, and staged reveals.
`tokenRow` accepts literal `values`, `centerX` or `x`, and a `reveal` amount;
Vizmatic's exported `layoutTokenRow` supplies matching positions for custom
letter transformations.

The lessons use this shared layer. Their numerical simulations, camera
coordinates, and teaching sequences remain in the lesson modules. Add new
general components to Vizmatic and update the pinned package here so future
lessons share the implementation. Keep the SVG concept catalog portable.

`api.teaching` adds shared axes, clipped curve traces, scatter plots, bar charts,
and flow graphs. Its geometry remains visible to the same audits. Axes reserve
space outside the plot for ticks and labels. Flow graphs paint edges before
their cards and preserve live connector references. Vizmatic also exports
deterministic sampling, matrix multiplication, stable softmax, entropy, and
vector helpers for computed examples.

For discrete simulations, Vizmatic's `createCueTrack` holds a snapshot until an
explicit `{ beat, at }` cue. Derive the visible numbers, bars, and decisions from
that snapshot. Cue IDs are unique across the initial state and all later cues;
an exact cue position selects the new state. Progress one equals the start of
the following beat.

`api.teaching.transfer` coordinates a checked connector and its optional moving
particle. Supply the painted source and target shapes with the same local
opacities used to paint them. The connector uses their minimum opacity and
reserves clearance for its stroke and particle. Hidden endpoints produce no
route; endpoints with insufficient space report an error. The host's shared
scene opacity still applies once to the whole construction.

`api.teaching.grid` paints a dense grid with one checked panel and row/column
paths. It returns cell bounds for labels, selections, and animated highlights.
Use exported `layoutCellGrid` when only the geometry is needed. Labels and sparse
highlights remain visible to container and occlusion checks.

`api.teaching.timeline` shows a supplied trace across named lanes. Pass a single
current `time` and reuse its returned interval `elapsed` values for counters.
Future intervals stay hidden, elapsed fills grow to that time, and concurrent
work uses separate lanes. The returned painted shapes support checked transfers.

`api.teaching.allocation` keeps a shared capacity scale across named parts. It
returns `used`, `remaining`, part bounds, and painted shapes, including an
explicit free region. Derive the displayed totals from those values. The helper
rejects an over-capacity allocation; use `layoutAllocation` for custom diagrams
that share the same geometry.

Use `axes({ equalUnits: true, ... })` when a picture represents angles, vector
lengths, unit circles, or Euclidean neighbor distances. Vizmatic fits and centers
the coordinate ranges inside the requested bounds with the same pixels per unit
on both axes. Ordinary charts can keep their independent axis scales. Check the
rendered geometry as well as the calculated values.

The [forty-lesson collection](collections/visual-curriculum.json) selects new
topics across geometry, learning, neural networks, language models, training,
systems, retrieval, and agents. Each has its own narration, animation module,
source article, and numerical model checks. Prepare and render the collection:

```bash
node videos/batch.mjs --collection visual-curriculum --validate-only
node videos/batch.mjs --collection visual-curriculum --prepare-only
node videos/batch.mjs --collection visual-curriculum --jobs 2 --threads 2 --resume
uv run videos/serve.py --input build/video-curriculum --port 18463
```

The batch runner freezes source inputs, warms the shared intro and speech cache,
and bounds parallel work. Each lesson passes rendering, full measured-frame
occlusion checks, encoded-media inspection, text-visibility checks, and declared
motion-region checks before packaging. Logs and machine-readable delivery
receipts stay in the ignored output directory.
`--no-manifest` lets individual renderer workers leave the aggregate manifest
to the batch runner. `--audio-only` prepares speech and timing sidecars.

The batch runner retries a narration stage up to three times when Edge returns
an audio clip shorter than its word timings. The renderer rebuilds that invalid
clip and reuses valid speech caches. Each attempt retains its log; other errors
and cancellation stop the stage.

The [visual discoveries collection](collections/visual-discoveries.json) adds
forty distinct articles on uncertainty and reinforcement learning, model memory
and vision, data pipelines, alignment, security, and AI systems. Its output stays
separate from the earlier collection:

```bash
node videos/batch.mjs --collection visual-discoveries --validate-only
node videos/batch.mjs --collection visual-discoveries --jobs 4 --threads 2
uv run videos/export-media.py \
  --input build/video-discoveries/leetllm-visual-discoveries.zip \
  --output build/video-discoveries/leetllm-40-more-videos.zip
uv run videos/serve.py --input build/video-discoveries --port 18465
```

The [visual laboratory collection](collections/visual-laboratory.json) adds forty
lectures on search, embedding geometry, model memory, agent recovery, evidence,
training, and GPU execution. Each lesson has its own article, scene markup, and
simulation module. It writes to a separate directory, preserving the previous
collections:

```bash
node videos/batch.mjs --collection visual-laboratory --validate-only
node videos/batch.mjs --collection visual-laboratory --jobs 4 --threads 2
uv run videos/export-media.py \
  --input build/video-laboratory/leetllm-visual-laboratory.zip \
  --output build/video-laboratory/leetllm-40-laboratory-videos.zip
uv run videos/serve.py --input build/video-laboratory --port 18466
```

The [curriculum completion collection](collections/curriculum-completion.json)
contains the remaining 69 visible curriculum articles. Together with the 130
earlier lessons, it covers all 199 articles in the canonical roadmap. The
collection preserves the roadmap order and keeps its media separate:

```bash
node videos/batch.mjs --collection curriculum-completion --validate-only
node videos/batch.mjs --collection curriculum-completion --jobs 4 --threads 2
uv run videos/export-media.py \
  --input build/video-completion/leetllm-curriculum-completion.zip \
  --output build/video-completion/leetllm-69-remaining-videos.zip
uv run videos/serve.py --input build/video-completion --port 18467
```

The [complete curriculum collection](collections/complete-curriculum.json)
selects all 199 lessons in roadmap order for a fresh full-series build:

```bash
node videos/batch.mjs --collection complete-curriculum --validate-only
node videos/batch.mjs --collection complete-curriculum --jobs 4 --threads 2
```

During a collection review, `--keep-going` lets independent lessons finish after
an isolated render or audit failure. The receipt records each failed lesson;
the collection remains failed until every lesson passes. Source changes and
cancellation still stop scheduling, and eight failed lessons stop the pass.
Speech preparation keeps its bounded failure behavior.

To reuse existing narration after an animation-only change, first plan then
apply the verified cache copy:

```bash
node videos/reuse-narration.mjs --collection videos/collections/complete-curriculum.json --output build/video-review-renders
node videos/reuse-narration.mjs --collection videos/collections/complete-curriculum.json --output build/video-review-renders --apply
```

The tool requires an exact passage, voice and rate match, receipt-bound audio and
word-timing hashes, and matching adapter code. It accepts only the explicitly
verified uv release-age metadata difference in the earlier adapter. Changed
passages require synthesis. The cache-copy receipt records original files and
hashes; existing cache files are preserved.

When rendering failed after speech preparation, add `--prepared` to allow reuse
from the input batch's `previews/` directory. The tool requires a completed audio
phase with matching timeline, audio and word-event hashes. The report labels that
source as `completed-audio-phase`; it establishes speech provenance independently
of the unfinished video. It never creates a movie receipt for a failed render.

## Render

Requirements: Node.js `^22.18.0 || >=24.11.0`, npm 11.21.0, `uv` 0.13.4 or newer, and FFmpeg/ffprobe with libx264
and AAC. Lesson fonts come from the Vizmatic checkout, so renders match on macOS and
Linux. Only CJK text needs a system font: Noto Sans CJK on Linux, or Hiragino Sans GB
or Songti on macOS. The font list is in `lib/fonts.mjs`.

```bash
cd videos
node check-npm-release-age.mjs package-lock.json
npm ci --ignore-scripts
npm test
uv run test/package_test.py
uv run test/tts_test.py
npm run validate
# Check every actual-timing frame without encoding movies:
node render.mjs --all --audit
npm run preview
npm run render
# Once the selected videos pass their media checks:
node inspect.mjs
node audit-occlusion.mjs --all
uv run package.py
# Start the local review player with reliable seeking:
uv run serve.py
```

New lessons use the film path in [`stage-lessons/`](stage-lessons/README.md). It
shares the narration, caption, delivery, and packaging steps below, and it has
real morphing, equation morphs, 3D, and bloom.

From the repository root, render one lesson:

```bash
node videos/render.mjs --lesson gradients-backprop
node videos/render.mjs --lesson tokenization
node videos/render.mjs --lesson reward-modeling
node videos/render.mjs --lesson quantization
```

Outputs go to `build/videos/<id>/`, outside the web application's build and Git
sources. Each lesson produces:

- `<id>.mp4`: 1920 × 1080, 30 fps, H.264/yuv420p, stereo AAC at 48 kHz,
  with narration, embedded chapter markers, and fast-start metadata. The picture
  contains no burned subtitles or progress bar.
- `<id>.srt` and `<id>.vtt`: paragraph captions from the authored narration and
  Edge's measured word boundaries. Packaging applies the final paragraph policy.
- `<id>.script.md` and `<id>.chapters.txt`: the spoken script and chapter times.
- `contact-sheet.png`, numbered PNGs, and a frame gallery: visual review samples
  from the beginning, middle, and end of every spoken beat.
- `timeline.json`: measured speech durations and the resulting scene timings.
- `verification.json`: source/render fingerprints, media properties, output hash,
  and full decode result.

`node videos/inspect.mjs` decodes and measures every encoded MP4 frame. It extracts
full-resolution early, middle, and late frames for every beat, scene boundaries,
the shared intro, and the largest temporal changes. Its `encoded-review/` folder
contains per-scene contact sheets and a report of blank-content runs and temporal
changes. These candidates need visual judgment, including the expected scene
fades and beat cuts identified in the report.

The renderer records layout coverage for every exported frame in
`frame-audit.json`. It checks label collisions, card padding, canvas bounds, and
finite geometry. Shared connection helpers compute arrow endpoints from object
boundaries. A skipped frame or an unresolved layout error prevents delivery.
These checks complement visual review of motion, composition, and mathematical
meaning; their report distinguishes full-frame automatic checks from sampled
visual inspection.

The intro is reusable outside these lessons:

```bash
node videos/render.mjs --intro-only --output build/video-brand-review
```

This produces `build/video-brand-review/brand/leetllm-intro.mp4` and a contact
sheet. The canonical brain/circuit mark is copied from `web/public/icon.svg` to
`videos/assets/leetllm-mark.svg`; `lib/brand.mjs` draws and animates that vector.
Packaging also places the shared intro at `build/videos/leetllm-intro.mp4`.

`uv run videos/package.py` from the repository root discovers the source catalog,
normalizes paragraph captions, refreshes affected text and motion audit receipts,
and verifies the selected output hashes, then creates `build/videos/index.html` and
`build/videos/leetllm-video-lessons.zip`. The archive includes the MP4s,
captions, chapter lists, narration scripts, storyboards, frame galleries, and an
editable `videos/` copy of this pipeline with the package manifest and lockfile
for restoring its dependencies through `npm ci`. Development exports using the
local Vizmatic link also require the matching sibling checkout described above. It also
includes the shared content guidelines, motion-audit reports, and the motion-audit tool.
The review player links each report beside its lesson. The bundle also includes
the source articles with their reference catalog under `web/src/content/`. The archive can be extracted
and rendered using the same directory layout and commands.
To watch the existing movies after extracting the archive, run
`uv run videos/serve.py --input .` from the extracted directory.

Caption cues keep each authored narration paragraph together. A paragraph that
exceeds 320 characters or 30 seconds can split at a sentence ending. A single
long sentence stays intact. Explicit paragraph breaks remain separate cues.
Caption starts and ends follow the measured first and last spoken words.

For a prediction or answer reveal, set `caption_boundary: true` on a selected `visual_cues` declaration. A new caption starts with that cue's phrase at its first measured word, even inside a sentence. Earlier text stays in order in the preceding caption. To split a caption without adding a visual cue, give the beat a `caption_starts` list of unique spoken phrases. Each phrase starts a caption at the first whole millisecond at or after its first measured word. Other cues keep the paragraph policy. The phrase must start at a separate authored word and a nonoverlapping provider word event. A split inside a word or event fails rather than guessing a time or delaying the caption.

To regenerate captions for an existing collection using its measured timelines:

```bash
node videos/regenerate-captions.mjs --input build/video-complete-curriculum \
  --all --refresh-audits
```

This updates SRT/VTT files, timeline captions, frame-gallery annotations, and
delivery checksums while preserving the MP4 bytes and render fingerprints.
`--refresh-audits` refreshes the receipt-bound text visibility and motion reports.
Use `--check` to verify the current captions without changing files. Packaging
performs this normalization automatically and verifies the final paragraph cues.
After repackaging, rerun the audio audit to bind its measurements to the updated
manifest, timeline, and delivery receipts.

Regeneration reads cue declarations from `timeline.json`, including `beats[].visual_cues[].caption_boundary`. It does not load the current lesson YAML or trust cached `visualCues` times. For an older delivery, changing YAML alone does not migrate its retained timeline. Prepare a separate candidate with the reviewed cue metadata on its matching measured beats and update its timeline checksum before regeneration. Preserve its recorded narration, word events, timing, and render provenance. Regenerate and run `--check` on that candidate before any publication. The generator hash includes cue alignment code, so older caption revisions require regeneration even when their caption text stays the same. Caption regeneration preserves the MP4 and does not update rendered visual behavior or certify current-source reproducibility.

For a smaller review download, extract the movies, SRT/VTT captions, chapters,
and narration scripts from a complete verified bundle:

```bash
uv run videos/export-media.py \
  --input build/video-curriculum/leetllm-visual-curriculum.zip \
  --output build/video-curriculum/leetllm-40-videos.zip
```

The exporter checks each delivered file against the bundle's recorded hash and
writes a portable manifest with relative paths. It keeps an existing output
archive intact if validation fails. The complete bundle retains the editable
pipeline, source articles, SVG gallery, and frame-review evidence.

By default, the exporter copies the original MP4 byte for byte. To add a selectable English subtitle track, install FFmpeg and FFprobe on your path and pass `--embed-english-subtitles` when creating the portable ZIP.

```bash
uv run videos/export-media.py \
  --input build/video-curriculum/leetllm-visual-curriculum.zip \
  --output build/video-curriculum/leetllm-40-videos-subtitled.zip \
  --embed-english-subtitles
```

The option accepts chaptered H.264/AAC lesson movies with separate SRT and WebVTT captions. It checks the two sidecars against each other and against the measured timeline when the bundle includes its checksum. It copies the audio and video tracks, embeds the English cues as MP4 timed text, and keeps the original sidecars and script. Before replacing the output ZIP, it verifies the embedded text and cue times, compares the audio, video, and chapter samples, and decodes the movie. The portable manifest records the exported MP4 checksum and byte count. Its `subtitleTrack.sourceMovieSha256` field identifies the original movie.

Run `uv run videos/serve.py --port 18461`, then open
`http://127.0.0.1:18461/`. The local-only
server supports byte ranges so the native player can seek without downloading
the whole movie first.

## The six-lesson visual series

| Lesson ID | Visual construction |
| --- | --- |
| `attention` | Query/key geometry, conserved softmax mass, and weighted value mixtures |
| `rope` | Paired rotations, relative position, and fast and slow frequency clocks |
| `lora` | Rank-one lines, rank-two planes, and a computed low-rank adapter path |
| `moe` | Router competition, weighted expert outputs, and dispatch queues |
| `kv-cache` | Causal reuse, physical block allocation, and copy-on-write branches |
| `diffusion` | Seeded Gaussian corruption, exact toy score fields, and particle transport |

Render each selected lesson into the batch output directory:

```bash
for lesson in attention rope lora moe kv-cache diffusion; do
  node videos/render.mjs --lesson "$lesson" --output build/videos-next
  node videos/inspect.mjs --lesson "$lesson" --input build/videos-next
  node videos/audit-occlusion.mjs --lesson "$lesson" --input build/videos-next
done
uv run videos/package.py --input build/videos-next \
  --lessons attention rope lora moe kv-cache diffusion \
  --archive leetllm-six-video-lessons.zip
uv run videos/serve.py --input build/videos-next --port 18462
```

Open `http://127.0.0.1:18462/` to review the six lessons. `--lessons` preserves
the requested order. Omitting it selects every lesson discovered from the YAML
files. The archive contains the complete editable pipeline and its source
articles, so the same validation and rendering commands work after extraction.

Git tracks scene markup, animation code, behavioral checks, the renderer, and
the Vizmatic version and integrity in the package lock. Generated movies, review frames, archives, and
speech caches stay under ignored build directories. Regeneration needs the
documented local tools and access to the selected speech provider. An empty
speech cache triggers synthesis again; Edge's live voice can change over time.
Retain the local speech cache when you need the same narration bytes.

The movie, captions, timeline, scripts, and review frames are built in a staging
directory. After media validation succeeds, the complete lesson replaces the
published lesson directory. A failed build preserves the previous delivery;
a failed directory swap rolls back. One previous delivery remains under
`build/videos/.staging/`. The receipt records checksums for every delivered file,
and packaging rejects changed or mismatched sidecars.

Preview, storyboard, full-frame-audit, and audio-only commands write to `build/videos/previews/<id>/`
(or `previews/<id>/` under the requested output root). They preserve the published
movie and its sidecars. Speech and scene renders are cached separately in
`.audio-cache/` and `.scene-cache/`. Changes to narration, voice, adapter code,
actual audio bytes, timing data, markup, or drawing code invalidate the appropriate cache.
An exclusive per-lesson lock prevents simultaneous writers. If a process is
forcibly stopped, confirm its PID has exited before removing its `.staging/<id>.lock`
file and restarting the render; the next run recovers an interrupted directory swap.

Useful iteration commands:

```bash
# Exercise every beat and visual without a network request.
node videos/render.mjs --all --validate

# Check every actual-timing frame, including intermediate movement.
node videos/render.mjs --all --audit

# Render storyboards without generating speech or MP4s (estimated timing).
node videos/render.mjs --all --storyboard

# Review sampled frames with actual synthesized speech timings.
node videos/render.mjs --all --preview

# Prepare speech, measured timelines, and captions.
node videos/render.mjs --all --audio-only

# Faster, smaller review export; use a different output directory.
node videos/render.mjs --lesson tokenization --width 960 --fps 15 \
  --output build/videos-review

# Update the same local delivery as the lessons evolve.
# Fresh renders export paragraph captions directly. This also refreshes older exports.
node videos/render.mjs --all
node videos/regenerate-captions.mjs --all
node videos/inspect.mjs
node videos/audit-text-ink.mjs --all --actual
node videos/audit-motion.mjs --all --input build/videos
uv run videos/package.py --require-text-ink --require-motion
```

`--threads` limits each encoder's CPU threads; the default is four. Speech
synthesis uses at most two simultaneous requests per renderer process. The
default `--all` render processes lessons sequentially.

## Automatic layout review

`--audit` checks every frame using measured speech timings. It collects findings
across the selected lessons and exits unsuccessfully when a rule fails. Each
`previews/<id>/layout-review.html` links clean and annotated full-resolution
frames, exact timestamps, affected objects, and the first and last affected
frames. `layout-review.json` and `frame-audit.json` retain the numerical evidence.
Final deliveries include the same rule coverage and a layout review page.

The registered checks cover labels against glyph ink, paths, connectors, and
shape borders; text hidden by later opaque shapes; children escaping containers;
filled tiles crossing panel boundaries; clipped strokes; and connectors detached
from their painted nodes. Paint order and declared clipping determine what is
actually visible. Fading geometry enters the global collision checks at 25%
opacity. Small antialiasing contacts have a tolerance; the report lists the
applied rules.

Use `api.container(ctx, bounds, draw, { id, padding })` for a panel's children.
It protects shapes, labels, paths, and internal connectors throughout their
animation. Draw the panel itself before entering the scope. Use `api.path` for
polylines and `api.trace` for progressive reveals. A path's `clip` rectangle
applies to both painting and checking. Pass the shapes returned by `api.rect`
or `api.circle` to `api.connect`; use `api.groupBounds` over those shapes for
a group. Every member must be visible and painted in the current frame. To draw
an arrow behind a node, keep its bounds object and update that same object with
`Object.assign(node, api.rect(...))` after connecting. The audit rejects missing
painted nodes, stale references, and geometry that differs from the painted node.
Raw Canvas paint inside lesson
animations fails the audit, which prevents future curves from bypassing it.
Place flow particles behind cards so the cards naturally hide their edges as
they enter and leave.

`inspect.mjs` separately decodes every encoded frame, rejects incomplete movies
and unexplained blank frames, and extracts scene, beat, and temporal-change
samples. Its reduced-resolution metrics screen for blankness and changes.
Full-resolution samples support visual review of the encoded result.

`audit-text-ink.mjs` checks whether solid-color native text paints discernible
pixels at its actual position, transform, clipping and opacity. It catches a
label whose foreground equals the panel behind it. Final batch inspection runs
this check automatically and rejects missing, failed or stale evidence. The
packager's `--require-text-ink` flag also requires that evidence in every selected
delivery and includes the report in the review bundle.

```bash
node videos/audit-text-ink.mjs --lesson gradients-backprop --input build/videos --actual
```

The default checks the endpoints and five positions in every spoken beat using
the measured final timeline. `--every-frame` checks all measured frames; pixel
readbacks make that mode slower. Reports state their coverage and bind the
movie, rendering sources, timeline, receipt and audit code by hash. This rule
covers solid-color `fillText` at paint time. Math, SVG, later occlusion and the
encoded image retain their separate checks and visual review. Prefer named
`components.panel({ fill, stroke, ... })` fields for panel styling.

`audit-occlusion.mjs` adds a separate check for several later-painted fills
collectively covering a label. It measures their combined coverage over glyph
ink, so a row of small tiles can be detected even when each tile covers too
little text to trigger the individual-shape rule. The complete measured-frame
report is bound to the movie, rendering sources, and audit tool. Packaging
requires a passing report. `--validate` uses estimated beat samples for offline
iteration and CI; final packaging requires the complete measured-frame mode.

`audit-motion.mjs` samples three positions inside each narrated beat that declares
`motion_check`. It compares native encoded pixels inside that authored region and
binds `motion-audit.json` to the movie, measured timeline, lesson markup, render
receipt, and audit code. Batch inspection runs this after text visibility checks;
resume evidence rejects a missing, stale, or failed declared check. The strict
packager re-runs the encoded audit and includes its report and CLI in the editable
archive. With `--require-motion`, packaging also requires at least one declared
teaching region per lesson. Choose a region containing an explanatory change,
such as assignment, accumulated outcomes or narrowing uncertainty. Exclude
headers, branding and decorative activity. Its coverage field counts only
declared regions, so undeclared beats remain outside this check. The report
identifies changed pixels across sampled moments; reviewers judge whether the
movement explains the lesson well.

These gates detect specified defects. Composition, teaching clarity, visual
rhythm, and meaningful motion still require review of the lesson. Inspect the
generated evidence and watch the transitions before describing a video as ready.

## Scene markup, version 1

Save one `lessons/<id>.lesson.yaml` file and one `animations/<id>.mjs` module.
IDs are lowercase slugs; scene IDs must be unique within a lesson.

```yaml
version: 1
id: example
title: A visual explanation
source: foundations/some-article/content.md
sources:
  - title: An original reference
    url: https://example.org/reference
scenes:
  - id: move-the-parameter
    title: Read the slope
    visual: A point moves along the loss curve as the parameter decreases.
    beats:
      - say: A positive slope means an upward nudge makes the loss larger near this point.
        hold: 0.45
      - say: Subtract a scaled gradient and watch the prediction move closer to the target.
        hold: 0.65
```

`say` is spoken narration. `hold` is the pause after that beat, in seconds.
`visual` records the intended animation for authors and reviewers; the dedicated
module selects the drawing using `scene.id`. Optional `params` can carry data
specific to the lesson. The runtime does not execute YAML expressions.

There are no guessed word-per-minute timings in a final export. Each beat is
synthesized separately, measured with ffprobe, and placed on the timeline with its
pause. A scene starts with 400 ms of visual lead-in and ends with a 300 ms visual
tail, rounded up to a whole video frame. PCM audio is trimmed or padded to the
same durations before concatenation. AAC is encoded once for the final film.

### Narration cues

Attach visual changes to a unique spoken phrase in the same beat:

```yaml
- say: Subtract a scaled gradient and watch the prediction move closer to the target.
  visual_cues:
    - id: update-weight
      phrase: Subtract a scaled gradient
      targets: [weight, prediction]
      color: yellow
      linger: 0.65
```

Cue IDs are unique within a scene. Targets identify actual painted objects.
Phrases must match exactly once in the beat, ignoring case and punctuation.
The renderer resolves their first and last words against measured provider
events and rejects missing, ambiguous, or incomplete timings. Holds extend
reading time without stretching the spoken transformation.

```js
const progress = api.focus.progress('update-weight', state.beatP);
const weight = initialWeight - progress * learningRate * gradient;
api.focus.target('weight', () => drawWeight(weight));
api.focus.target('prediction', () => drawPrediction(weight));
api.focus.reveal('update-weight', () => drawCompletedStep());
```

`progress` follows the phrase and remains complete afterward. `reveal` retains
geometry while hidden and keeps the result visible afterward. Both support
random frame order. The fallback progress supports unmeasured storyboards.
Use `api.components.card({ focusTarget: 'weight', ... })`, graph node or edge
`focusTarget`, grid `cellFocusTarget(row, column)`, matrix `cellStyle`, timeline
intervals, or allocation parts when the shared component owns the drawing.

The renderer tracks each target's native painted bounds as it moves, keeps it
bright, dims surrounding marks, and adds label-safe corner annotations. Several
nearby parts can share an ID; distant plots remain separate. Focus the changing
sample, equation term, path, cell, or computed result. Remove duplicate prose
and introduce calculations in the order the narration explains them.

Declare another word cue when the next clause introduces a different operation
or result. Resolve it from provider word events instead of adding fixed seconds
to a neighboring cue. Keep completed constructions visible through recaps;
start a new simulation when the script introduces a new experiment or view.

Before rendering, run `audit-narration-cues.mjs --assignment FILE --output DIR`
against the checksum-bound measured baseline. It samples three native frames
per phrase, checks target visibility and layout, and records source, framework,
and engine hashes. Each lesson row binds the exact measured `timeline.json` and
`verification.json` hashes used to resolve its word timings. The audit checks
that those files and its source, helper, framework, and rendering engine stay
stable through the run. Text density and text-only targets are review
diagnostics.
These samples precede the final movie's full frame audits and encoded review;
they do not establish continuous playback or teaching quality.
Add `--all-frames` to check every measured lesson frame for layout, attachments,
label collisions, and aggregate later-paint glyph occlusion before encoding.
It also checks each narrated target throughout its spoken phrase for presence,
finite positive bounds within the 1920 by 1080 frame, oversized bounds, and
recorded paint alpha below 0.35. Bounds may extend by at most half a pixel to
allow for transformed geometry. An onset allowance of 120 ms, capped at 20
percent of the phrase, lets a brief reveal begin. The report records the
aggregate checked-target counts and failing frames; sampled native frames keep
their target bounds and recorded alpha. These checks report geometry and
recorded alpha; they do not assess aesthetics, readability, or encoded video
quality. The shared intro is checked separately by the production renderer.
Before a collection render, run `verify-narration-preflight.mjs --assignment FILE
--report FILE --output FILE`, repeating `--report` for each audit shard. This
rejects stale source or engine hashes, missing frames or scenes, failed checks,
changed narration or measured baseline hashes, modified contact images, and
uncued explanatory beats. It rechecks source, baseline, report, contact image,
tool, framework, and engine bindings at completion. Keep the accepted proof
with the batch receipt; source freezing then protects the render itself.

### Source-preview narration cue review

`render.mjs --preview` creates measured narration timings without a production
export receipt. Prepare a source-only bundle before running the cue audit:

```bash
lesson_id=attention
node videos/prepare-preview-audit.mjs \
  --lesson "$lesson_id" \
  --timeline "build/my-preview/previews/$lesson_id/timeline.json" \
  --output "build/source-preview-audit-$lesson_id"
node videos/audit-narration-cues.mjs \
  --assignment "build/source-preview-audit-$lesson_id/assignment.json" \
  --selection "build/source-preview-audit-$lesson_id/selection.json" \
  --lesson "$lesson_id" --all-frames \
  --output "build/source-preview-audit-$lesson_id/all-frames"
node videos/verify-narration-preflight.mjs \
  --assignment "build/source-preview-audit-$lesson_id/assignment.json" \
  --selection "build/source-preview-audit-$lesson_id/selection.json" \
  --report "build/source-preview-audit-$lesson_id/all-frames/review.json" \
  --output "build/source-preview-audit-$lesson_id/preflight.json"
```

The preparer checks scene order, exact narration and holds, voice, rate, and
complete measured word events. It applies the renderer's 400 ms lead-in, speech
durations, authored holds, 300 ms tail, and frame rounding. Schedule fields may
vary by at most one microsecond; frame counts must match exactly. Word events
may end up to the existing 200 ms TTS padding allowance past audio duration.
Every cue must resolve inside the scene frame window and cover at least one
frame inside measured audio after the shared onset allowance. The report binds
authored YAML and animation, validation helpers, timeline, and tool hashes.

The clearly marked `verification.json` contains only a timeline hash. It has no
movie hash, full-decode result, or encoded-frame audit, so it cannot satisfy
export or publication checks. This workflow reviews source animation states
only; it does not assess an encoded movie or certify audio, rendering, or
publication readiness.

Use the sampled content-visibility diagnostic to catch nearly empty scene
entrances before rendering:

```bash
node videos/audit-content-visibility.mjs \
  --assignment build/review-assignment.json \
  --selection build/measured-export-selection.json \
  --prepared --all --output build/content-visibility.json
```

The assignment lists lesson IDs; the selection maps them to checksum-bound
`sourceDirectory` values. `--prepared` also accepts completed audio-phase
receipts when a full movie has not finished. This diagnostic renders native
source states at six early scene times and measures the encoded audit's content
region after downsampling. Repeated misses block the diagnostic; a single
transition sample remains an explicit review candidate. The report records
source, timeline, narration, tool and engine hashes. Short gaps between samples
still require the encoded decoder's every-frame check.

After a movie passes inspection, extract its exact word-aligned native frames:

```bash
node videos/extract-narration-cue-frames.mjs \
  --input build/video-review-renders --lesson attention \
  --output build/encoded-cue-frames
```

This samples early, middle and late frames in each measured cue window and binds
their hashes to the actual MP4, receipt and timeline. Review the named object,
its intermediate states and the held result against the spoken clause. A cue
that highlights an old value or a summary badge needs a source correction even
when its registered bounds pass. Use a separate output directory for replacement
movies so the earlier evidence remains available.

Add `--after-cues` to inspect results two frames after each spoken phrase and
again after its highlight clears. These extra native MP4 samples help reveal a
completed calculation, ownership loss, or committed state that silently resets.
The samples stay outside the scene exit fade. Review their meaning against the
next clause; some later state changes are intentional. Registered scene sheets
also include long holds and the end of each scene.

## Animation modules

```js
export function draw(ctx, scene, state, api) {
  const { C, circle, text, swap } = api;
  const [a, b] = swap(600, 520, 1300, 520, state.beatP);
  circle(ctx, a.x, a.y, 40, C.cyan);
  circle(ctx, b.x, b.y, 40, C.yellow);
  text(ctx, 'chosen', a.x, a.y + 90, 34, C.cyan, 'center');
  text(ctx, 'rejected', b.x, b.y + 90, 34, C.yellow, 'center');
}
```

The content coordinate system is always 1920 × 1080. Use x = 100–1820 and
y = 205–985 for lesson content. The framework draws the scene heading above
that area. Native Canvas2D paths, transforms, and clipping are
available. Captions remain optional player tracks in the exported sidecars.

The shared brand intro has its own timeline entry. Every narration scene,
caption cue, and chapter starts four seconds later than the lesson-only timing.
The per-scene clocks and speech durations keep their original values.

State contains `t`, `duration`, overall progress `p`, zero-based `beat`, progress
within that beat `beatP`, content `opacity`, `sceneIndex`, and `sceneCount`.
Frame generation is deterministic. Derive movement from these values rather
than clocks or random numbers.

`lib/scene.mjs` provides the palette, text, rounded rectangles, circles, lines,
arrowheads, smooth interpolation, staged progress, and collision-free swaps on
opposite arcs. `rect` and `circle` return geometry; `connect` anchors an arrow
to the two boundaries and returns its route for moving markers. `labelScope`
checks labels against a card's padded interior. Keep connectors and moving
signals on the same returned route.
Text supports `sans`, `mono`, `serif`, and `cjk` fonts and explicit line
breaks. Keep explanatory labels brief and usually at least 30 px at the content
size. `drawFrame` reports label bounds, clipped labels, and raw TeX accidentally
passed to the native text helper.

Use `math` for mathematical notation, including subscripts and powers:

```js
const { math, C } = api;
math(ctx, String.raw`\hat y = W_x x^2`, 960, 440, 58, C.cyan, 'center');
math(ctx, String.raw`\frac{\partial L}{\partial w}`, 960, 590, 58, C.yellow, 'center');
```

The helper uses Vizmatic's `renderMathSvg`, which compiles real TeX into
self-contained MathJax SVG glyph paths. Cached raster images preserve the TeX
baseline, fractions, scalable delimiters, and proper scripts. Keep symbolic
expressions fixed where possible; draw changing numeric readouts separately so
an animation does not compile a new formula on every frame. Neither typesetting
nor font loading needs a browser or network request during rendering.

Vizmatic supplies `defineAnimation` and `sampleAnimation` for parallel
speech-position and opacity tracks. Their durations are milliseconds. The
renderer samples these timelines once per MP4 frame. Custom Canvas painters draw
the mathematical geometry. Vizmatic's `renderRgbaVideo` streams the frames
to FFmpeg; its `tracePolyline`, `pointAlongPath`, and `arcSwap` primitives provide
curve reveals, moving markers, and position exchanges. The exporter consumes
one frame at a time, supports cancellation, and preserves existing outputs when
a render fails. It supports MP4 directly without a GIF conversion stage.

The web illustration tools and video renderer use the published, exact-pinned
`vizmatic@0.8.3`. Its npm metadata identifies source commit
`1ffb0dad82c3a28093b0ffdd44ddd7384b8c5cd6`. Local review movies use the separate
merged source pin in `vizmatic-review.commit`. Each isolated render job keeps its own
frozen engine copy and records the exact built engine, package metadata and
dependency lock. Vizmatic is topic-agnostic; LeetLLM scripts supply the teaching
sequence and use its reusable primitives, math, Canvas components, teaching
charts, event timelines, capacity allocation strips, camera projection, path
morphing, and numerical utilities.

Both package managers permit only the exact tested first-party `vizmatic@0.8.3`
release to bypass the seven-day registry age window. Other versions and
dependencies follow the normal age policy.

The lesson API exposes `interpolateCamera`, `projectWorldPoint`,
`createPolylineMorph`, and `morphPolyline` from Vizmatic. Prepare a reusable
polyline morph once, then sample it inside a beat and paint the resulting points
through `api.path` so transformed geometry remains audited. Camera projection
uses the same checked paint path for projected points, labels, and connections.

Changing shared components or the package lock invalidates existing render
receipts. Rerender affected lessons before packaging a new movie delivery.
Previously exported movies and their source archives retain their original
provenance.

Prepare a new clean checkout when changing the review pin between render batches.
Keep the previous checkout while active jobs still use it. Frozen render workspaces
keep their accepted engine and source bytes throughout rendering and review.
The delivery receipts distinguish those historical engine versions from the
current authoring and CI pin.

## Speech adapters

Canvas and Stage lessons share the narrator in [narration.json](narration.json). Write each beat's spoken text in its `say` field. The renderer uses the Wolf film's American English voice, Kokoro `af_heart` at 1.12× speed, and uses Kokoro's measured word timings for the picture and captions. The adapter runs locally with the cached Kokoro-82M model and voice.

The final film mix introduces a quiet stereo score after the four-second logo. The course group selects the palette. Production systems use low tones, applied projects and agents use open tones, and core lessons use warm tones. New lessons without a course group use their article topic. The lesson ID seeds the music. Measured speech and chapter starts guide chord and texture changes. The mixer lowers the score when its measured level exceeds the dialogue target range. It then applies the course mastering targets of −16 LUFS and −1.5 dBTP.

To audition an excerpt, use a mono or stereo PCM16 narration WAV with the original logo lead, beat times, and scene times in seconds. Pass `--timing timing.json` with `{"beats":[4.2,12.5],"scenes":[4.0]}`. The same command can score an entire lesson.

```bash
node videos/tools/course-bed.mjs --lesson model-monitoring --voice voice.wav --timing timing.json --out mix.wav --receipt score.json
```

The `audioBed` delivery record identifies the library revision, seed, palette, and hashes of the input voice, applied score, final mix, and encoded audio. It records RMS and peak levels during speech and pauses. The renderer first checks the installed Vizmatic soundbed tools. Older picture engines fetch the pinned tools on first use, verify their checksums, and reuse them from the local cache.


```bash
node videos/render.mjs --lesson gradients-backprop
```

For a local render, set `LEETLLM_KOKORO_WARM=1` to keep one narrator model loaded while a film records its missing lines. The host allows two warm models by default. To synthesize narration for four films at once, set `LEETLLM_KOKORO_SLOTS=4` for all four render processes. Each film releases its model after the last line.

On an Apple Silicon Mac, set `LEETLLM_KOKORO_DEVICE=mps` to let one warm worker use the GPU. Other workers use the CPU and check for a free GPU before each take. When the GPU becomes available, one worker moves its loaded model to it. If MPS fails during recording, the worker retries that take on the CPU and uses the CPU for its remaining takes. The default device is CPU. Both devices use the configured narrator and reuse validated recordings.

To reuse measured takes across output directories, set `LEETLLM_SPEECH_CACHE` to a shared directory. Published course runs use the same narrator profile when they reuse recordings. The source manifest and measured timeline identify the adapter and its SHA-256.

## Add another article

Follow [the shared editorial guidance](../CONTENT_GUIDELINES.md#state-the-idea-directly)
for narration, scene titles, and on-screen labels. Explain the mechanism and its
consequences directly. Replace stock contrasts such as "Y, not X" and defensive
"not a promise of" disclaimers with the example's actual scope, the conditions
under which a limitation appears, and the measurement the viewer should make.
Preserve meaningful technical negation and uncertainty. Read each complete
script aloud, compare it with the source article, and review visible labels in
the sampled frames before generating the final speech and MP4.

Read the complete article and identify the prerequisite ideas the lesson must
teach. Open with the subject, a concrete reason to care, and a visual question
that gives viewers a reason to keep watching. State what they will understand
by the end, then move into the conceptual progression. Choose examples that let viewers
predict, observe, and explain each step. Write narration for speech and visual
beats for the animation. Implement its animation module using the shared
primitives, then validate, inspect the storyboard, generate speech, and render.
Inspect frames at the start, middle, and end of important transitions. Check
numerical states as well as final labels. A successful encode does not establish
that the explanation is correct.

Build the visual story around an object the viewer can follow: a weight moving
on a loss curve, a token pair merging, a preference shifting a score, or a value
snapping to a quantization grid. Preserve that object's identity across the
transition. Let motion expose the mechanism, then hold the result while the
voice interprets it. Use a moving probe, residual, or before-and-after alignment
when it helps the learner compare outcomes. Reframe to direct attention as the
question changes. Keep decorative pulses and simultaneous moving elements
subordinate to that explanation.

The framework automates timing, audio reuse, captions, encoding, chapters, and
media verification. The adaptation and the mathematical animations remain
deliberately authored per lesson. Nothing is uploaded or published by these
commands.

### Narration stream deadlines

The speech adapter allows 180 seconds for a complete synthesis while retaining a
45 second receive-silence timeout and a 10 second connection timeout. A measured
worked explanation of 102 words took 61.16 seconds to arrive despite only 41.75 seconds
of speech. A 45 second total deadline incorrectly interrupted that healthy stream.
Each request keeps bounded retries and commits audio and word times atomically.
The three unchanged reference films can use
`--tts-script videos/adapters/edge-reference-20261106.py` with their original
verified speech cache. That immutable adapter preserves the original cache and
receipt provenance; new complete narration uses `videos/tts.py`.
