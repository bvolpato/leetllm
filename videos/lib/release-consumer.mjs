import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { productionSourceManifest } from './lesson-production.mjs';
import { releaseIdentity, validateCohortDefinition } from './cohort-definition.mjs';
import {
  fileRecord,
  copyVerifiedFile,
  privateInstallEnvironment,
  readJson,
  writeJson,
  inside,
  verifiedRecord,
  preserveAuthorities,
  dependencyInventory,
  availableBytes,
} from './cohort-files.mjs';
import { assertDiskAdmission } from './render-cohort.mjs';

const exec = promisify(execFile);
export const RELEASE_COMMIT = '7530fdbd20f3186c7b273f98cb4ee463368db1c1';
export const RELEASE_TAG = 'ddf5a3830bb1de09dd9e2ea14c16240e38ac994f';
export const UPLOAD_SHA1 = 'f74bcb529923394a4bd2f6fe9895af7e0c491706';

/** Validate package identity before extraction. Registry availability remains a distinct gate. */
export function validateReleaseSpec(spec) {
  const release = releaseIdentity(spec.runtimeVersion);
  if (
    spec.version !== 1 ||
    spec.sourceCommit !== release.sourceCommit ||
    spec.sourceTag !== release.sourceTag ||
    spec.uploadSha1 !== release.uploadSha1 ||
    !['registry-tarball', 'accepted-upload-payload'].includes(spec.distribution)
  )
    throw new Error(
      `Expected the exact signed v${spec.runtimeVersion} release and accepted upload identity`,
    );
  if (
    spec.distribution === 'registry-tarball' &&
    (spec.registry?.gitHead !== release.sourceCommit ||
      spec.registry?.shasum !== release.uploadSha1 ||
      !spec.registry?.integrity)
  )
    throw new Error('Published registry authority is incomplete');
  if (spec.distribution === 'accepted-upload-payload' && spec.registry !== null)
    throw new Error('A locally materialized upload must leave public registry authority null');
  if (
    !Array.isArray(spec.overlays) ||
    spec.overlays.length !== 2 ||
    !['pnpm-lock.yaml', 'pnpm-workspace.yaml'].every(
      (name) => spec.overlays.filter((file) => file.path === name).length === 1,
    ) ||
    spec.overlays.some((file) => file.sourceCommit !== release.sourceCommit)
  )
    throw new Error('Declare only the signed release lock and workspace overlays');
  if (
    spec.runtimeVersion === '0.8.1' &&
    (spec.distribution !== 'registry-tarball' ||
      typeof spec.cohortDefinition?.path !== 'string' ||
      !/^[a-f0-9]{64}$/.test(spec.cohortDefinition?.sha256 ?? ''))
  )
    throw new Error('The 0.8.1 cohort requires public registry authority and a bound definition');
}

/** npm archives may contain only regular package files and directories. */
export async function extractReleasePackage(tarball, target, spec) {
  const runtimeVersion = spec.runtimeVersion ?? '0.8.0';
  releaseIdentity(runtimeVersion);
  const bytes = await fs.readFile(tarball);
  const sha1 = createHash('sha1').update(bytes).digest('hex');
  if (sha1 !== spec.uploadSha1)
    throw new Error('Package payload differs from the accepted upload digest');
  if (spec.registry?.integrity) {
    const match = /^sha512-([A-Za-z0-9+/=]+)$/.exec(spec.registry.integrity);
    if (!match || createHash('sha512').update(bytes).digest('base64') !== match[1])
      throw new Error('Package payload differs from registry integrity');
  }
  const names = (await exec('tar', ['-tzf', tarball], { maxBuffer: 10 * 1024 ** 2 })).stdout
    .trim()
    .split('\n');
  const metadata = (await exec('tar', ['-tvzf', tarball], { maxBuffer: 10 * 1024 ** 2 })).stdout
    .trim()
    .split('\n');
  if (
    !names.length ||
    names.some(
      (name) =>
        !name.startsWith('package/') ||
        name.includes('\\') ||
        name.split('/').includes('..') ||
        /[\x00-\x1f]/.test(name),
    ) ||
    metadata.length !== names.length ||
    metadata.some((line) => !['-', 'd'].includes(line[0])) ||
    new Set(names).size !== names.length
  )
    throw new Error('Unsafe npm package archive: require confined regular files without aliases');
  await fs.mkdir(target);
  await exec('tar', ['-xzf', tarball, '--no-same-owner', '--no-same-permissions', '-C', target]);
  const root = path.join(target, 'package');
  const metadataJson = await readJson(path.join(root, 'package.json'));
  if (metadataJson.name !== 'vizmatic' || metadataJson.version !== runtimeVersion)
    throw new Error(`Extracted package is not Vizmatic v${runtimeVersion}`);
  return root;
}

async function treeRecords(root) {
  const files = [];
  async function visit(relative = '') {
    for (const name of (await fs.readdir(path.join(root, relative))).sort()) {
      if (!relative && name === 'node_modules') continue;
      const file = path.join(root, relative, name),
        info = await fs.lstat(file);
      if (info.isDirectory()) await visit(path.posix.join(relative, name));
      else if (info.isFile())
        files.push({ ...(await fileRecord(file)), path: path.posix.join(relative, name) });
      else throw new Error(`Release package contains a nonregular entry: ${file}`);
    }
  }
  await visit();
  return files;
}

async function install(command, args, cwd, logFile) {
  try {
    const result = await exec(command, args, {
      cwd,
      timeout: 600000,
      maxBuffer: 20 * 1024 ** 2,
      env: await privateInstallEnvironment(path.dirname(logFile)),
    });
    await fs.writeFile(logFile, result.stdout + result.stderr, { flag: 'wx' });
  } catch (error) {
    await fs.writeFile(
      logFile,
      String(error.stdout ?? '') + String(error.stderr ?? '') + '\n' + error.message,
      { flag: 'wx' },
    );
    throw error;
  }
}

async function copyClosure(sourceRoot, repository, manifest) {
  const aliases = [];
  for (const file of manifest.closure.files) {
    const original = await verifiedRecord(sourceRoot, file);
    const target = path.resolve(repository, file.resolvedPath);
    if (!inside(repository, target)) throw new Error(`Consumer file escapes root: ${file.path}`);
    await fs.mkdir(path.dirname(target), { recursive: true });
    try {
      await copyVerifiedFile(original, target);
    } catch (error) {
      if (error.code !== 'EEXIST' || (await fileRecord(target)).sha256 !== file.sha256) throw error;
    }
    if (file.path !== file.resolvedPath) aliases.push({ name: file.path, target });
  }
  for (const alias of aliases) {
    const output = path.resolve(repository, alias.name);
    if (!inside(repository, output)) throw new Error(`Consumer alias escapes root: ${alias.name}`);
    await fs.mkdir(path.dirname(output), { recursive: true });
    try {
      await fs.symlink(path.relative(path.dirname(output), alias.target), output);
    } catch (error) {
      if (error.code !== 'EEXIST' || (await fs.realpath(output)) !== alias.target) throw error;
    }
  }
}

/** Create a private release consumer. No primary packages, links or old authorities are changed. */
export async function materializeReleaseConsumer({
  specFile,
  authorityRoot,
  sourceRoot,
  destination,
}) {
  authorityRoot = await fs.realpath(authorityRoot);
  sourceRoot = await fs.realpath(sourceRoot);
  destination = path.resolve(destination);
  const spec = await readJson(specFile);
  validateReleaseSpec(spec);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  assertDiskAdmission(await availableBytes(path.dirname(destination)));
  await fs.mkdir(destination); // Never reuse an incomplete attempt.
  const status = { version: 1, state: 'materializing', createdAt: new Date().toISOString() };
  const stateFile = path.join(destination, 'materialization.json');
  await writeJson(stateFile, status);
  try {
    await copyVerifiedFile(
      await fileRecord(specFile),
      path.join(destination, 'release-inputs.json'),
    );
    if (
      JSON.stringify(await readJson(path.join(destination, 'release-inputs.json'))) !==
      JSON.stringify(spec)
    )
      throw new Error('Release input specification changed while preserving');
    const authorities = await preserveAuthorities(
      authorityRoot,
      spec.authorities,
      path.join(destination, 'authorities'),
    );
    let cohortDefinition;
    if (spec.runtimeVersion === '0.8.1') {
      const original = await verifiedRecord(authorityRoot, spec.cohortDefinition);
      const definition = validateCohortDefinition(await readJson(original.path));
      const selected = new Set();
      if (
        !Array.isArray(spec.subjects) ||
        !spec.subjects.length ||
        spec.subjects.some((subject) => {
          if (
            !definition.subjects.some(
              ({ id, mode }) => id === subject.id && mode === subject.mode,
            ) ||
            selected.has(subject.id)
          )
            return true;
          selected.add(subject.id);
          return false;
        })
      )
        throw new Error('Selected consumer subjects differ from the bound cohort definition');
      cohortDefinition = await copyVerifiedFile(
        original,
        path.join(destination, 'cohort-definition.json'),
      );
    }
    const originalTarball = await verifiedRecord(authorityRoot, spec.tarball);
    const tarball = path.join(destination, 'release.tgz');
    await copyVerifiedFile(originalTarball, tarball);
    const extracted = await extractReleasePackage(tarball, path.join(destination, 'unpack'), spec);
    const runtime = path.join(destination, 'vizmatic');
    await fs.rename(extracted, runtime);
    const publishedFiles = await treeRecords(runtime);
    const overlays = [];
    for (const overlay of spec.overlays) {
      const original = await verifiedRecord(authorityRoot, overlay.source);
      const output = path.join(runtime, overlay.path);
      const copied = await copyVerifiedFile(original, output);
      overlays.push({
        path: overlay.path,
        sourceCommit: overlay.sourceCommit,
        original,
        sha256: copied.sha256,
      });
    }
    const runtimeFiles = await treeRecords(runtime);
    // Source discovery uses the primary runtime only to enumerate inputs. Its engine authority is not adopted.
    const repository = path.join(destination, 'repository'),
      manifests = [];
    await fs.mkdir(repository);
    if (!Array.isArray(spec.subjects) || !spec.subjects.length)
      throw new Error('Declare the selected consumer subjects');
    for (const subject of spec.subjects) {
      const manifest = await productionSourceManifest({
        root: sourceRoot,
        id: subject.id,
        mode: subject.mode,
        ttsScript: subject.ttsScript,
      });
      await copyClosure(sourceRoot, repository, manifest);
      manifests.push(manifest);
    }
    await install(
      'pnpm',
      [
        'install',
        '--frozen-lockfile',
        '--prod',
        '--ignore-scripts',
        '--package-import-method=copy',
        '--store-dir',
        path.join(destination, 'pnpm-store'),
      ],
      runtime,
      path.join(destination, 'runtime-install.log'),
    );
    await install(
      'npm',
      ['ci', '--ignore-scripts'],
      path.join(repository, 'videos'),
      path.join(destination, 'consumer-install.log'),
    );
    if (JSON.stringify(await treeRecords(runtime)) !== JSON.stringify(runtimeFiles))
      throw new Error(
        'Dependency installation changed the exact release payload or signed overlays',
      );
    const finalManifests = [];
    for (const before of manifests) {
      const current = await productionSourceManifest({
        root: sourceRoot,
        id: before.id,
        mode: before.mode,
        ttsScript: before.ttsScript,
      });
      if (JSON.stringify(before) !== JSON.stringify(current))
        throw new Error(`Primary source moved during intake: ${before.id}`);
      const final = await productionSourceManifest({
        root: repository,
        id: before.id,
        mode: before.mode,
        ttsScript: before.ttsScript,
      });
      if (JSON.stringify(final.closure) !== JSON.stringify(before.closure))
        throw new Error(`Selected source changed while copying: ${before.id}`);
      finalManifests.push(final);
    }
    const proof = {
      version: 1,
      kind: 'leetllm.vizmatic-release-materialization',
      runtimeVersion: spec.runtimeVersion,
      ...(cohortDefinition ? { cohortDefinition } : {}),
      distribution: spec.distribution,
      sourceCommit: spec.sourceCommit,
      sourceTag: spec.sourceTag,
      registry: spec.registry,
      uploadSha1: spec.uploadSha1,
      tarball: await fileRecord(tarball),
      originalTarball,
      authorities,
      publishedFiles,
      overlays,
      runtimeFiles,
      inputs: await fileRecord(path.join(destination, 'release-inputs.json')),
      publicRegistryPayloadMaterialized: spec.distribution === 'registry-tarball',
      perFilmSourceRuntimeApproval: 'pending',
      encodedMovieApproval: false,
      dependencyInstallation:
        'Signed release lock/workspace overlays; isolated pinned installs with lifecycle scripts disabled.',
      sourceIntake: manifests,
      currentManifests: finalManifests,
      installedDependencies: await dependencyInventory(destination),
    };
    await writeJson(path.join(repository, 'runtime-materialization.json'), proof);
    status.state = 'materialized-awaiting-per-film-source-runtime-gates';
    status.proof = await fileRecord(path.join(repository, 'runtime-materialization.json'));
    await writeJson(stateFile, status, { replace: true });
    return repository;
  } catch (error) {
    status.state = 'materialization-blocked';
    status.failure = { at: new Date().toISOString(), message: error.message };
    await writeJson(stateFile, status, { replace: true });
    throw error;
  }
}
