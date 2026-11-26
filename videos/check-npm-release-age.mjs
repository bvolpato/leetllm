#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const DAY_MS = 24 * 60 * 60 * 1000;
const RELEASE_AGE_DAYS = 7;
const REGISTRY = 'https://registry.npmjs.org/';
const MAX_CONCURRENT_QUERIES = 8;
// Vizmatic is a first-party package; only this exact tested release bypasses the age window.
const RELEASE_AGE_EXEMPTION = { name: 'vizmatic', version: '0.10.0' };

function packageNameFromLockPath(lockPath) {
  const marker = 'node_modules/';
  const index = lockPath.lastIndexOf(marker);
  if (index < 0) return null;
  const parts = lockPath.slice(index + marker.length).split('/');
  return parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

export function registryPackages(lock) {
  if (!lock || typeof lock.packages !== 'object' || !lock.packages) {
    throw new Error('package-lock.json must contain a packages object');
  }

  const packages = new Map();
  const localTargets = new Set(
    Object.values(lock.packages)
      .filter((entry) => entry.link === true)
      .map((entry) => entry.resolved),
  );
  for (const [lockPath, entry] of Object.entries(lock.packages)) {
    if (!lockPath || entry.link === true || entry.inBundle === true) continue;
    if (localTargets.has(lockPath) && !lockPath.includes('node_modules/')) continue;
    if (typeof entry.resolved !== 'string') {
      throw new Error(`${lockPath} has no resolved source; refusing to skip its release-age check`);
    }
    if (entry.resolved.startsWith('file:')) continue;

    let resolved;
    try {
      resolved = new URL(entry.resolved);
    } catch {
      throw new Error(`${lockPath} has an unsupported package source`);
    }
    if (resolved.origin !== REGISTRY.slice(0, -1) || resolved.protocol !== 'https:') {
      throw new Error(`${lockPath} uses an unsupported registry source: ${resolved.origin}`);
    }

    const name = entry.name || packageNameFromLockPath(lockPath);
    const version = entry.version;
    if (
      !name ||
      typeof version !== 'string' ||
      !/^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)
    ) {
      throw new Error(`${lockPath} has no valid registry package name or version`);
    }
    if (!packages.has(name)) packages.set(name, new Set());
    packages.get(name).add(version);
  }
  return packages;
}

export function assertPublishedBefore(name, version, publishedAt, cutoff) {
  const published = publicationTimestamp(name, version, publishedAt);
  if (published >= cutoff) {
    throw new Error(
      `${name}@${version} was published ${new Date(published).toISOString()}, inside the seven-day release window`,
    );
  }
}

function publicationTimestamp(name, version, publishedAt) {
  const published = typeof publishedAt === 'string' ? Date.parse(publishedAt) : NaN;
  if (!Number.isFinite(published)) {
    throw new Error(`${name}@${version} has no valid npm publication timestamp`);
  }
  return published;
}

async function mapLimit(items, limit, callback) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++];
        await callback(item);
      }
    }),
  );
}

export async function npmPublicationTimes(packages) {
  const results = new Map();
  const entries = [...packages.entries()];
  await mapLimit(entries, MAX_CONCURRENT_QUERIES, async ([name, versions]) => {
    const selectors = [...versions].map((version) => `time[${version}]`);
    let stdout;
    try {
      ({ stdout } = await execFileAsync(
        'npm',
        ['view', name, ...selectors, '--json', '--prefer-online', `--registry=${REGISTRY}`],
        {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024,
        },
      ));
    } catch {
      throw new Error(`could not query npm publication metadata for ${name}`);
    }

    let metadata;
    try {
      metadata = JSON.parse(stdout.trim());
    } catch {
      throw new Error(`npm returned invalid publication metadata for ${name}`);
    }
    for (const version of versions) {
      const selector = `time[${version}]`;
      const timestamp =
        selectors.length === 1 && typeof metadata === 'string' ? metadata : metadata?.[selector];
      results.set(`${name}@${version}`, timestamp);
    }
  });
  return results;
}

export async function checkLockfiles(
  locks,
  { now = Date.now(), lookup = npmPublicationTimes } = {},
) {
  const packages = new Map();
  let local = 0;
  for (const lock of locks) {
    const lockPackages = registryPackages(lock);
    local += Object.values(lock.packages).filter((entry) =>
      entry.resolved?.startsWith('file:'),
    ).length;
    for (const [name, versions] of lockPackages) {
      if (!packages.has(name)) packages.set(name, new Set());
      for (const version of versions) packages.get(name).add(version);
    }
  }
  const times = await lookup(packages);
  const cutoff = now - RELEASE_AGE_DAYS * DAY_MS;
  let checked = 0;
  let exempted = 0;
  for (const [name, versions] of packages) {
    for (const version of versions) {
      const publishedAt = times.get(`${name}@${version}`);
      if (name === RELEASE_AGE_EXEMPTION.name && version === RELEASE_AGE_EXEMPTION.version) {
        publicationTimestamp(name, version, publishedAt);
        exempted += 1;
        continue;
      }
      assertPublishedBefore(name, version, publishedAt, cutoff);
      checked += 1;
    }
  }
  return { checked, exempted, local };
}

export async function checkLockfile(lock, options = {}) {
  return checkLockfiles([lock], options);
}

async function main() {
  const lockfiles = process.argv.slice(2);
  if (lockfiles.length === 0) lockfiles.push('package-lock.json');
  const locks = await Promise.all(
    lockfiles.map(async (lockfile) => JSON.parse(await readFile(lockfile, 'utf8'))),
  );
  const { checked, exempted, local } = await checkLockfiles(locks);
  console.log(
    `Release-age check passed: ${checked} registry package versions exceed seven days${exempted ? `; ${exempted} exact first-party release exemption(s)` : ''}${local ? `; ${local} local package(s) are outside npm registry release timing` : ''}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Release-age check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
