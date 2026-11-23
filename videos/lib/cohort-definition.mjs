import assert from 'node:assert/strict';

export const RELEASE_IDENTITIES = Object.freeze({
  '0.8.0': Object.freeze({
    sourceCommit: '7530fdbd20f3186c7b273f98cb4ee463368db1c1',
    sourceTag: 'ddf5a3830bb1de09dd9e2ea14c16240e38ac994f',
    uploadSha1: 'f74bcb529923394a4bd2f6fe9895af7e0c491706',
  }),
  '0.8.1': Object.freeze({
    sourceCommit: '6bea0e530f8b96d0687faf9a688f4b9b981bfd59',
    sourceTag: 'c016a945be3409c3f34ab047372afa3c1b5a93b2',
    uploadSha1: '007b17e671fae5c5792544fa8c846bd4e6781167',
  }),
});

export const V081_POLICY = Object.freeze({
  id: 'vizmatic-0.8.1-serial-v1',
  runtimeVersion: '0.8.1',
  diskFloorBytes: 40 * 1024 ** 3,
  attemptEnvelopeBytes: 3 * 1024 ** 3,
  simultaneousFilms: 1,
});

export const PARALLEL_POLICY = Object.freeze({
  ...V081_POLICY,
  id: 'vizmatic-0.8.1-parallel-4-v1',
  simultaneousFilms: 4,
});

export function cohortPolicy(policyId) {
  if (policyId === V081_POLICY.id) return V081_POLICY;
  if (policyId === PARALLEL_POLICY.id) return PARALLEL_POLICY;
  throw new Error('Unsupported cohort policy');
}

export function releaseIdentity(version) {
  if (typeof version !== 'string' || !Object.hasOwn(RELEASE_IDENTITIES, version))
    throw new Error(`Unsupported exact signed Vizmatic release: ${version}`);
  return RELEASE_IDENTITIES[version];
}

export function cohortSettings(mode) {
  if (!['stage', 'canvas'].includes(mode)) throw new Error('Unknown cohort rendering mode');
  return {
    width: 1920,
    fps: mode === 'stage' ? 60 : 30,
    threads: 2,
    workers: 2,
    quality: 'high',
  };
}

/** A new cohort explicitly selects subjects; it does not grant source or movie approval. */
export function validateCohortDefinition(definition) {
  const fields = ['version', 'id', 'runtimeVersion', 'policyId', 'subjects'];
  if (
    !definition ||
    Object.keys(definition).some((name) => !fields.includes(name)) ||
    definition.version !== 1 ||
    typeof definition.id !== 'string' ||
    !/^[a-z][a-z0-9-]*$/.test(definition.id) ||
    definition.runtimeVersion !== V081_POLICY.runtimeVersion ||
    !Array.isArray(definition.subjects) ||
    !definition.subjects.length
  )
    throw new Error('Unsupported cohort definition');
  cohortPolicy(definition.policyId);
  const ids = new Set();
  for (const subject of definition.subjects) {
    if (
      !subject ||
      Object.keys(subject).some((name) => !['id', 'mode'].includes(name)) ||
      typeof subject.id !== 'string' ||
      !/^[a-z][a-z0-9-]*$/.test(subject.id) ||
      !['stage', 'canvas'].includes(subject.mode) ||
      ids.has(subject.id)
    )
      throw new Error('Cohort subjects require distinct lesson IDs and explicit rendering modes');
    ids.add(subject.id);
  }
  return definition;
}

export function validateV2Plan(plan, definition) {
  validateCohortDefinition(definition);
  if (
    plan.version !== 2 ||
    plan.sourceManifest?.renderEngine?.version !== definition.runtimeVersion ||
    !definition.subjects.some(({ id, mode }) => id === plan.id && mode === plan.mode)
  )
    throw new Error('Plan is outside its exact 0.8.1 cohort definition');
  assert.deepEqual(
    plan.policy,
    cohortPolicy(definition.policyId),
    'Cohort policy differs from its reviewed version',
  );
  assert.deepEqual(
    plan.settings,
    cohortSettings(plan.mode),
    'Cohort settings differ from the cohort policy',
  );
}
