import assert from 'node:assert/strict';
import test from 'node:test';
import { checkLockfile, registryPackages } from '../check-npm-release-age.mjs';

const now = Date.parse('2026-10-21T12:00:00.000Z');
const cutoff = now - 7 * 24 * 60 * 60 * 1000;
const lock = {
  packages: {
    '': {},
    'node_modules/example': {
      name: 'example',
      version: '1.2.3',
      resolved: 'https://registry.npmjs.org/example/-/example-1.2.3.tgz',
    },
  },
};

test('accepts an explicit sibling checkout link while checking registry packages', () => {
  const linked = structuredClone(lock);
  linked.packages['../../vizmatic'] = { version: '0.8.3' };
  linked.packages['node_modules/vizmatic'] = { resolved: '../../vizmatic', link: true };
  assert.deepEqual([...registryPackages(linked).keys()], ['example']);
  delete linked.packages['node_modules/vizmatic'];
  assert.throws(() => registryPackages(linked), /no resolved source/);
});

test('accepts a registry release older than seven days', async () => {
  const result = await checkLockfile(lock, {
    now,
    lookup: async () => new Map([['example@1.2.3', new Date(cutoff - 1).toISOString()]]),
  });
  assert.equal(result.checked, 1);
});

test('rejects a registry release inside the seven-day window', async () => {
  await assert.rejects(
    checkLockfile(lock, {
      now,
      lookup: async () => new Map([['example@1.2.3', new Date(cutoff + 1).toISOString()]]),
    }),
    /inside the seven-day release window/,
  );
});

test('accepts the exact first-party Vizmatic release inside the seven-day window', async () => {
  const freshVizmatic = {
    packages: {
      '': {},
      'node_modules/vizmatic': {
        name: 'vizmatic',
        version: '0.10.0',
        resolved: 'https://registry.npmjs.org/vizmatic/-/vizmatic-0.10.0.tgz',
      },
    },
  };
  const result = await checkLockfile(freshVizmatic, {
    now,
    lookup: async () => new Map([['vizmatic@0.10.0', new Date(cutoff + 1).toISOString()]]),
  });
  assert.deepEqual(result, { checked: 0, exempted: 1, local: 0 });
});

test('still requires a valid registry timestamp for the exact first-party Vizmatic release', async () => {
  const freshVizmatic = {
    packages: {
      '': {},
      'node_modules/vizmatic': {
        name: 'vizmatic',
        version: '0.10.0',
        resolved: 'https://registry.npmjs.org/vizmatic/-/vizmatic-0.10.0.tgz',
      },
    },
  };
  await assert.rejects(
    checkLockfile(freshVizmatic, {
      now,
      lookup: async () => new Map(),
    }),
    /no valid npm publication timestamp/,
  );
});

test('requires every other Vizmatic version to age for seven days', async () => {
  for (const version of ['0.8.3', '0.9.0', '0.10.1']) {
    const freshVizmatic = structuredClone(lock);
    freshVizmatic.packages['node_modules/example'].name = 'vizmatic';
    freshVizmatic.packages['node_modules/example'].version = version;
    freshVizmatic.packages['node_modules/example'].resolved =
      `https://registry.npmjs.org/vizmatic/-/vizmatic-${version}.tgz`;
    await assert.rejects(
      checkLockfile(freshVizmatic, {
        now,
        lookup: async () => new Map([[`vizmatic@${version}`, new Date(cutoff + 1).toISOString()]]),
      }),
      /inside the seven-day release window/,
    );
  }
});

test('keeps enforcing the release age for fresh transitive dependencies', async () => {
  const withFreshTransitive = structuredClone(lock);
  withFreshTransitive.packages['node_modules/example/node_modules/transitive'] = {
    name: 'transitive',
    version: '2.0.0',
    resolved: 'https://registry.npmjs.org/transitive/-/transitive-2.0.0.tgz',
  };
  await assert.rejects(
    checkLockfile(withFreshTransitive, {
      now,
      lookup: async () =>
        new Map([
          ['example@1.2.3', new Date(cutoff - 1).toISOString()],
          ['transitive@2.0.0', new Date(cutoff + 1).toISOString()],
        ]),
    }),
    /transitive@2.0.0.*inside the seven-day release window/,
  );
});

test('fails closed when the registry omits a package timestamp', async () => {
  await assert.rejects(
    checkLockfile(lock, {
      now,
      lookup: async () => new Map(),
    }),
    /no valid npm publication timestamp/,
  );
});

test('fails closed when the registry returns a malformed publication timestamp', async () => {
  await assert.rejects(
    checkLockfile(lock, {
      now,
      lookup: async () => new Map([['example@1.2.3', 'tomorrow-ish']]),
    }),
    /no valid npm publication timestamp/,
  );
});

test('fails closed for a package with an unsupported source', async () => {
  const unsupported = structuredClone(lock);
  unsupported.packages['node_modules/example'].resolved =
    'https://github.com/example/example/archive/v1.2.3.tgz';
  await assert.rejects(checkLockfile(unsupported, { now }), /unsupported registry source/);
});

test('checks the published parent instead of bundled package entries', async () => {
  const bundled = structuredClone(lock);
  bundled.packages['node_modules/example/node_modules/embedded'] = {
    name: 'embedded',
    version: '2.0.0',
    inBundle: true,
  };
  const result = await checkLockfile(bundled, {
    now,
    lookup: async () => new Map([['example@1.2.3', new Date(cutoff - 1).toISOString()]]),
  });
  assert.equal(result.checked, 1);
});

test('uses exact scoped, nested, and aliased package identities from the lockfile', async () => {
  const identities = registryPackages({
    packages: {
      '': {},
      'node_modules/@scope/parent': {
        version: '3.2.1',
        resolved: 'https://registry.npmjs.org/@scope/parent/-/parent-3.2.1.tgz',
      },
      'node_modules/@scope/parent/node_modules/@nested/child': {
        version: '1.4.0',
        resolved: 'https://registry.npmjs.org/@nested/child/-/child-1.4.0.tgz',
      },
      'node_modules/parent-alias': {
        name: 'actual-package',
        version: '5.6.7',
        resolved: 'https://registry.npmjs.org/actual-package/-/actual-package-5.6.7.tgz',
      },
    },
  });

  assert.deepEqual(
    [...identities].map(([name, versions]) => [name, [...versions]]),
    [
      ['@scope/parent', ['3.2.1']],
      ['@nested/child', ['1.4.0']],
      ['actual-package', ['5.6.7']],
    ],
  );
});
