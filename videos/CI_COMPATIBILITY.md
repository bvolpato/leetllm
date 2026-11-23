# CI and runtime compatibility

The video package and lockfile use the published `vizmatic@0.8.3`. For local review movies, `vizmatic-review.commit` selects the exact merged source revision of `bvolpato/vizmatic`. This development build includes changes after the npm release without changing the production dependency pin. CI also checks upstream `main` for compatibility with the next library changes.

## CI jobs

| Job                                                   | Runtime                                                                  | Checks                                                                                                                                                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Video checks (published Vizmatic)                     | The registry package installed by `npm ci --ignore-scripts`              | The top-level Node test suite, including the cold registry snapshot, provenance, release authority, and legacy compatibility tests. It also retains the existing package, editorial, export, lesson, stage, and text audit commands. |
| Stage compatibility (Vizmatic main, development only) | A fresh checkout of upstream `main`, built with its frozen pnpm lockfile | The narrated adapter suite in `test/upstream/`, every rebuilt folder lesson, the registered legacy stage films, the runtime capability regression, and runtime hashing tests.                                                        |
| Film compatibility (pinned Vizmatic review build) | The commit in `vizmatic-review.commit`, built with its frozen pnpm lockfile | The same stage suite plus the Flash Attention, Diffusion, Voice Agents, and Fairness Audits canvas films. |

Every job validates the npm lockfile release ages and audits the video dependencies. Both source builds use upstream's pnpm release-age policy and frozen lockfile. They disable install scripts, run the package build explicitly, and audit the upstream dependency graph.

Each source job links its built checkout into an isolated video installation. The job summary and its `vizmatic-review-runtime` or `vizmatic-main-runtime` artifact record the upstream commit and the hashes of the renderer and dependency lock. Use these values when comparing a local render with CI.

The shared stage adapter checks the installed runtime's capabilities. Narrated lessons require the `narrated` export and `stage.firstSceneTransitions.cut` so the first teaching frame appears at the end of the brand animation. The compatibility test verifies that first frame when both are available, an explicit setup error otherwise, and legacy compilation in either case. The development suite discovers rebuilt folders through `index.mjs` or a draft or promoted lesson script, requires both the index and a script, compiles every scene through the existing rebuild adapter, and samples each scene's SVG on estimated timing. A missing entry, an incomplete lesson, or a compile error fails that job.

These development checks do not run speech synthesis, encode a movie, establish measured cue timing, or replace the full film, motion, coverage, editorial, and delivery gates. The published job retains those existing commands and reports their failures. No coverage gate or production check is skipped to make a development build pass.

## Local validation in isolated worktrees

Use Node.js 22 and npm 11.21.0. The upstream checkout declares its pnpm version in `packageManager`. Run these commands from the committed LeetLLM revision you want to check. They create a detached LeetLLM worktree and a separate, exact-SHA Vizmatic checkout under `build/`. They never use the mutable sibling checkout.

Measure storage and select an existing budget ledger using [the storage protocol](../docs/render-storage.md). Replace the budget path below. The setup reserves 3 GiB for source and installed dependencies; increase it if the measured inputs require more. Reuse the resulting workspace for the current review batch instead of reinstalling or advancing its renderer.

```bash
repo=$(git rev-parse --show-toplevel)
review_ref=$(cat "$repo/videos/vizmatic-review.commit")
ci_root="$repo/build/vizmatic-review-$review_ref"
storage_budget=/absolute/current-storage-budget
admit_review() {
  local bytes=$1
  shift
  node "$repo/scripts/render-storage.mjs" admit \
    --budget "$storage_budget" --store root --bytes "$bytes" \
    --output "$ci_root" -- "$@"
}

admit_review 3221225472 bash -s -- "$repo" "$ci_root" "$review_ref" <<'SH'
set -euo pipefail
repo=$1
ci_root=$2
review_ref=$3
test ! -e "$ci_root"
git -C "$repo" worktree add --detach "$ci_root/leetllm.com" HEAD
test "$(cat "$ci_root/leetllm.com/videos/vizmatic-review.commit")" = "$review_ref"
git init -q "$ci_root/vizmatic"
git -C "$ci_root/vizmatic" fetch --depth=1 https://github.com/bvolpato/vizmatic.git "$review_ref"
git -C "$ci_root/vizmatic" checkout -q --detach FETCH_HEAD
test "$(git -C "$ci_root/vizmatic" rev-parse HEAD)" = "$review_ref"

cd "$ci_root/leetllm.com/videos"
node check-npm-release-age.mjs package-lock.json
npm ci --ignore-scripts
npm audit --audit-level=low
mkdir -p "$ci_root/tmp"
SH

cd "$ci_root/leetllm.com/videos"
# Keep test output in the admitted workspace and canonicalize macOS path aliases.
export TMPDIR="$(node -e 'process.stdout.write(require("node:fs").realpathSync(process.argv[1]))' "$ci_root/tmp")"
```

On Linux, run the full published-runtime suite:

```bash
admit_review 1073741824 npm test
```

On macOS, run the portable published-runtime contracts below. Some existing full-suite tests require Linux `/proc` and `/etc/hostname`. Canonicalizing `TMPDIR` fixes path aliases but does not supply those Linux resources. CI runs the full suite on Linux.

```bash
admit_review 1073741824 node --test --test-concurrency=1 test/vizmatic-compatibility.test.mjs test/lesson-production.test.mjs test/cohort-definition.test.mjs test/render-engine.test.mjs test/check-npm-release-age.test.mjs
```

Build and check the pinned review runtime with the same commands as CI.

```bash
admit_review 1073741824 bash -s -- "$ci_root" "$review_ref" <<'SH'
set -euo pipefail
ci_root=$1
review_ref=$2
cd "$ci_root/vizmatic"
test "$(git rev-parse HEAD)" = "$review_ref"
test -z "$(git status --porcelain)"
corepack pnpm install --frozen-lockfile --ignore-scripts
corepack pnpm build
corepack pnpm audit --audit-level=low
git diff --exit-code

cd "$ci_root/leetllm.com/videos"
mv node_modules/vizmatic node_modules/.vizmatic-published
ln -s "$ci_root/vizmatic" node_modules/vizmatic
VIZMATIC_SOURCE_COMMIT="$review_ref" node --input-type=module > "$ci_root/runtime.json" <<'JS'
import { renderEngineProvenance } from './lib/render-engine.mjs';
console.log(JSON.stringify({
  sourceRepository: 'bvolpato/vizmatic',
  sourceCommit: process.env.VIZMATIC_SOURCE_COMMIT,
  renderEngine: renderEngineProvenance(),
}, null, 2));
JS
node --test --test-concurrency=1 test/upstream/*.test.mjs test/vizmatic-compatibility.test.mjs test/stage-lesson.test.mjs test/render-engine.test.mjs
node --test director-cuts/lesson-runtime/runtime.test.mjs full-directors/test/runtime.test.mjs
SH
```

The top-level `npm test` suite belongs to the published runtime. Run it before linking a source checkout. In particular, `test/lesson-production.test.mjs` must execute against the registry package. Its cold-install test remains active and must not be skipped or reinterpreted as a source-runtime test.

To render a local review copy, validate the film while the source build is linked, then render it with the usual output and admission settings. The example validates the canvas renderer. Add `--stage` for a rebuilt stage lesson such as `embedding-geometry`. Record the source commit and renderer hashes with the MP4.

```bash
admit_review 536870912 node render.mjs --lesson flash-attention --validate
```

Keep the source link, clean Vizmatic checkout, and `runtime.json` for the local review batch. Wrap movie generation with `admit_review` and a reservation sized for that movie, writing its outputs below `ci_root`. Keep its source commit and renderer identity with the outputs. Before starting a later session, verify the checkout still has the recorded SHA and no source changes, and compare fresh `renderEngineProvenance()` with `runtime.json`.

Restore the installed registry package before rerunning published-runtime checks:

```bash
test -L node_modules/vizmatic
unlink node_modules/vizmatic
mv node_modules/.vizmatic-published node_modules/vizmatic
```

Retire the workspace only after its jobs finish and its required sources, runtime identity, and latest usable movies are retained. Preserve unique uncommitted work. Use `git worktree remove "$ci_root/leetllm.com"` after verifying it is clean; follow the storage protocol for generated files and the remaining runtime checkout.

## Publication

Runtime provenance hashes the actual distributed files, package metadata, renderer assets, and dependency lock. A source build can report version `0.8.3` while containing newer code. Identify it by the pinned commit and recorded runtime hashes; the npm version alone does not identify that build.

Inspection still installs the exact public package and compares its provenance with the frozen source runtime. A linked development build fails that comparison. Cohort release specifications still require the recorded signed release identity and public registry authority. The development job changes neither contract and creates no delivery or release artifacts.

The pinned source build supports local movie work. Adopting it as a published production runtime requires a separate release and LeetLLM pin update; merging upstream does not change the npm package.
