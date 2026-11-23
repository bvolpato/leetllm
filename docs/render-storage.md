# Latest-only generated storage

Keep the latest usable outputs and the inputs required by current work. The storage targets are 20 GiB for the entire root `build/` directory and 150 GiB for the entire external project directory. New ledgers reject legacy-byte exemptions. External copies, installed runtimes, source snapshots, media and caches all count toward their store's target.

Retain the latest verified export for each lesson, the current published book, the current gallery source and snapshot, and compact current verification records. Keep frozen source, provider audio, word events, timelines and the runtime needed by active jobs. Preserve unique uncommitted source before removing a worktree. A new failed attempt does not supersede the last usable export.

Remove superseded candidate movies, scene previews, screenshots, contact sheets, old review archives and obsolete working copies. They do not need byte-for-byte reconstruction recipes when the user has retired their history. Do not copy prior review history into a new snapshot. Current consumer dependencies remain protected until those consumers finish.

## Retiring superseded history

Use an explicit keep manifest with canonical absolute paths and a reason for each retained file, symlink or tree. Derive it from current plans, dependency inventories, publication manifests and active processes. A directory timestamp does not establish which export is usable. Keep only the necessary leaf when an older directory contains a current input.

```sh
node scripts/prune-build-history.mjs plan --root /absolute/repository/build --keep keep.json --output /tmp/latest-build-plan.json
node scripts/prune-build-history.mjs apply --plan /tmp/latest-build-plan.json --sha256 EXACT_PLAN_SHA --guard scripts/lib/retention-process-guard.mjs --guard-sha256 EXACT_GUARD_SHA --verify-only
sudo -n node scripts/prune-build-history.mjs apply --plan /tmp/latest-build-plan.json --sha256 EXACT_PLAN_SHA --guard scripts/lib/retention-process-guard.mjs --guard-sha256 EXACT_GUARD_SHA
```

External cleanup also requires `--external-project-root /absolute/external/project`. Plans stay outside the root they prune. The independent Linux guard checks live process paths, file descriptors, memory maps, mounts and Docker bind mounts. Removal checks path identities and uses anchored atomic claims; symlink targets are never traversed. The privileged apply can remove retired read-only snapshots without changing permissions on shared files. Remove registered historical worktrees through their owning Git repository after preserving unique source and checking inactivity. After a partial failure, review any retained `.latest-only-claim-*` entries and create a fresh plan before resuming.

Before external removal, record conservative exclusive allocation with `scripts/account-build-history.mjs`. Hardlink groups earn credit only when all names are being removed. After a successful removal, bind its removed paths to that accounting receipt and measure the remaining root directory. Apply the SHA-bound `reconcile-prune` receipt to the existing ledger. Reconciliation preserves live external leases, prevents duplicate credit, and removes the retired root legacy allowance. A whole-host free-space change is not an attributable cleanup credit.

## Admission

All new `render-inspection.mjs run` invocations require a measured budget ledger. The ledger serializes reservations across controllers. Missing ledgers, unknown locks and overlapping output leases refuse admission. Exhausted budgets pause new work while existing reserved workers finish. Completion releases the reservation and charges actual allocated growth, including failed attempts. Cleanup does not earn an automatic credit; remeasure after a verified prune and initialize a new ledger only when all old leases are reconciled.

The controller defaults to a 2 GiB reservation per render and 512 MiB per audio preparation. Set larger explicit reservations when measured film size requires them. Each owned child has an output-growth watcher. Exceeding the reservation or failing to measure the output stops the identity-verified owned process group. The watcher samples periodically, so allow a safety reserve for growth between samples. This is cooperative admission for declared outputs, not an operating-system filesystem quota. Unrelated writers and immutable retained data must remain in the measured baseline.

Inventory does not follow symlinks and counts each regular-file inode once within each root. A scan with live writers is non-atomic. Freeze new admission and record active writers before adopting its measurement. Do not omit external copies or count a symlink relocation as reclaimed project storage.

```sh
node scripts/render-storage.mjs inventory build /mnt/bbackup/leetllm-video-delivery-20261108
```

Create a reviewed measurement JSON with this shape. `measurementSha256` is supplied by the CLI from the exact file hash. `legacyBytes` must be zero in both stores. `protectedBytes` records current retained data. An over-target footprint blocks admission until it is reduced; it does not make an active input disposable.

```json
{
  "kind": "leetllm.measured-storage-budget",
  "measuredAt": "2026-11-08T18:30:00.000Z",
  "stores": {
    "root": {
      "path": "/absolute/repository/build",
      "usageBytes": 0,
      "legacyBytes": 0,
      "protectedBytes": 0,
      "safetyBytes": 1073741824
    },
    "external": {
      "path": "/mnt/bbackup/leetllm-video-delivery-20261108",
      "usageBytes": 0,
      "legacyBytes": 0,
      "protectedBytes": 0,
      "safetyBytes": 8589934592
    }
  }
}
```

Replace the example byte counts with actual measurements. Initialization creates a new directory and refuses an existing one.

```sh
node scripts/render-storage.mjs init --budget /absolute/new-budget --measurement measurement.json --sha256 EXACT_SHA
node scripts/render-storage.mjs status --budget /absolute/new-budget
node videos/tools/render-inspection.mjs run --destination /absolute/frozen-run --plan-sha256 EXACT_PLAN_SHA --storage-budget /absolute/new-budget
```

Wrap snapshot preparation and other cooperating generated-output commands with the same ledger. Supply every generated output root as a separate `--output`; outputs must be disjoint, canonical and confined to the selected store. Reserve the measured worst-case growth before starting the command.

```sh
node scripts/render-storage.mjs admit --budget /absolute/new-budget --store external --bytes 2147483648 --output /absolute/external/inspection/new-run -- node videos/tools/render-inspection.mjs prepare --destination /absolute/external/inspection/new-run --authority freeze.json --authority-sha256 EXACT_SHA
```

Loaded historical controllers do not hot-reload these hooks. Drain their children, retain their progress and attempt records, then restart through the current controller with an explicit code binding and budget. Do not call an old paused scheduler budget-enforced.

## Reproducible PCM cache eviction

For the latest retained generation, keep final movies, captions, chapters, actual provider MP3s and word events, measured timelines, source and locks, one runtime payload per required digest, and the compact current review/receipt record. A current derived cache may be pruned after its exact bytes have been reproduced from retained inputs. Being registered does not itself require permanent local retention, but a collector that requires a removed payload must hydrate it before verification. No placeholder or silently skipped hash substitutes for the payload. Superseded historical outputs follow the latest-only removal policy above.

The PCM tool supports the existing Canvas scene-audio recipe: stereo 48 kHz signed 16-bit PCM, beat audio plus measured holds, and the original container prefix/suffix. It does not infer a recipe for brand audio or other generators. Every file needs its own successful full-WAV SHA-256 replay. Toolchain, MP3, word-event and provenance hashes are rechecked before hydration or prune. Self-input inode aliases and shared WAV hardlinks are rejected.

```sh
node scripts/render-storage.mjs prove --wav /absolute/.scene-cache/lesson/01-scene.wav --timeline /absolute/timeline.json --scene SCENE_ID --renderer /absolute/frozen/render.mjs --ffmpeg /usr/bin/ffmpeg --output /absolute/ledger/new-recipe.json
node scripts/render-storage.mjs hydrate --recipe /absolute/ledger/new-recipe.json --sha256 EXACT_RECIPE_SHA --output /absolute/restored.wav
```

Hydration refuses an existing output, verifies the whole reconstructed hash, syncs the file, publishes with an exclusive hardlink and syncs its parent directory. It retains the recorded WAV header and creates no temporary PCM copy during proof.

Prune requires an independently reviewed guard module exporting `async function guard(recipe)`. Both calls must return `inactive: true`, `protectedInputsRetained: true`, and `canonicalPath` equal to the recipe's original real path. A held inactive namespace and a current privileged process observation must cover producers, open files, mounts and protected inputs. The batch operator owns this guard; the CLI has no `--assume-inactive` switch.

```sh
node scripts/render-storage.mjs prune --recipe /absolute/ledger/new-recipe.json --sha256 EXACT_RECIPE_SHA --ledger /absolute/durable-ledger --guard /absolute/reviewed-guard.mjs --guard-sha256 EXACT_GUARD_SHA
```

Both guard callbacks run before the rename. The tool writes and syncs its recipe and prepared tombstone outside the entire cache tree, atomically claims the file, verifies its moved identity/hash/link count, and only then unlinks that exact claimed file and syncs directories. An unexpected replacement is preserved for reconciliation. The completed receipt distinguishes logical bytes from exclusive allocated bytes. Retain prepared records even after interruption. A `pruned-reproducible-cache` receipt means the payload is absent until explicit hash-checked hydration, not that the old artifact remains available.

## Validation

```sh
node --test scripts/test/render-storage.test.mjs scripts/test/render-admission.test.mjs
node --test videos/test/inspection-render.test.mjs
```

The contracts execute the actual Canvas audio producer, exact prune/hydrate, late replacement/hardlink races, silent circular input rejection, asynchronous output failure, shared reservations and real over-budget children. These checks do not certify the contents or visual quality of a lesson.
