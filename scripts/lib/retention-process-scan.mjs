import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const inside = (root, value) =>
  value === root ||
  value.startsWith(root.endsWith(path.sep) ? root : `${root}${path.sep}`);
const decodeProcPath = (value) =>
  value.replace(/\\([0-7]{3})/g, (_, octal) =>
    String.fromCharCode(Number.parseInt(octal, 8)),
  );

/** Indexes candidate ancestors and descendants without scanning every candidate. */
export function candidatePathIndex(root, candidates) {
  const paths = [...new Set(candidates.map((entry) => entry.path))].sort();
  const exact = new Set(paths);
  const contains = (value) => inside(root, value);
  function matches(value, directory = false) {
    if (!contains(value)) return [];
    const found = new Set();
    let current = value;
    while (contains(current)) {
      if (exact.has(current)) found.add(current);
      if (current === root) break;
      current = path.dirname(current);
    }
    if (directory) {
      const prefix = value.endsWith(path.sep) ? value : `${value}${path.sep}`;
      let low = 0;
      let high = paths.length;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (paths[middle] < prefix) low = middle + 1;
        else high = middle;
      }
      for (let i = low; i < paths.length && paths[i].startsWith(prefix); i++)
        found.add(paths[i]);
    }
    return [...found];
  }
  return { contains, matches };
}

export function processIdentity(text) {
  const end = text.lastIndexOf(")");
  if (end < 0) throw new Error("Malformed Linux process identity");
  const fields = text
    .slice(end + 2)
    .trim()
    .split(/\s+/);
  if (fields.length < 20) throw new Error("Incomplete Linux process identity");
  return {
    pid: Number(text.slice(0, text.indexOf(" "))),
    parentPid: Number(fields[1]),
    state: fields[0],
    kernelThread: (Number(fields[6]) & 0x00200000) !== 0,
    startTime: fields[19],
  };
}

export function mountConflicts(root, candidates, mountInfo) {
  const matches = [];
  const index = candidatePathIndex(root, candidates);
  for (const line of mountInfo.split("\n").filter(Boolean)) {
    const fields = line.split(" ");
    if (fields.length < 7 || !line.includes(" - "))
      throw new Error("Malformed Linux mount information");
    const mount = decodeProcPath(fields[4]);
    if (mount === root || !inside(root, mount)) continue;
    for (const candidate of index.matches(mount, true))
      matches.push({ candidate, mount });
  }
  return matches;
}

export async function scanProcesses(
  request,
  { procRoot = "/proc", onlyPids } = {},
) {
  const startedAt = new Date().toISOString();
  const candidates = request.candidates;
  const candidateIndex = candidatePathIndex(request.root, candidates);
  const matches = [];
  const errors = [];
  const identities = new Map();
  const exited = new Set();
  let inspected = 0;
  let skippedNonUserspace = 0;
  const readIdentity = async (pid) =>
    processIdentity(await fs.readFile(`${procRoot}/${pid}/stat`, "utf8"));
  const ownIdentity = await readIdentity(process.pid);
  const exclusions = new Map([[ownIdentity.pid, ownIdentity.startTime]]);

  if (request.reader) {
    let current = ownIdentity;
    const visited = new Set();
    while (current.pid !== request.reader.pid && current.parentPid > 0) {
      if (visited.has(current.pid)) break;
      visited.add(current.pid);
      current = await readIdentity(current.parentPid);
    }
    if (
      current.pid !== request.reader.pid ||
      current.startTime !== request.reader.startTime
    )
      throw new Error("Apply reader is not an exact live scanner ancestor");
    exclusions.set(current.pid, current.startTime);
  }

  const names = onlyPids
    ? onlyPids.map(String)
    : (await fs.readdir(procRoot)).filter((name) => /^\d+$/.test(name));
  let cursor = 0;

  function record(pid, kind, value, isDirectory = false, fd) {
    if (!value.startsWith("/")) return;
    const normalized = (
      kind === "maps" ? decodeProcPath(value) : value
    ).replace(/ \(deleted\)$/, "");
    for (const candidate of candidateIndex.matches(normalized, isDirectory))
      matches.push({
        pid,
        startTime: identities.get(pid),
        kind,
        path: normalized,
        candidate,
        fd,
      });
  }

  async function inspect(name) {
    const pid = Number(name);
    let before;
    try {
      before = await readIdentity(pid);
    } catch (error) {
      if (!["ENOENT", "ESRCH"].includes(error.code))
        errors.push({
          pid,
          kind: "identity",
          code: error.code ?? error.message,
        });
      return;
    }
    if (exclusions.get(pid) === before.startTime) return;
    // Kernel threads and zombies have no live userspace filesystem context.
    if (before.kernelThread || ["Z", "X"].includes(before.state)) {
      skippedNonUserspace++;
      return;
    }
    inspected++;
    identities.set(pid, before.startTime);
    const pendingErrors = [];
    let cwd;
    const failed = (kind, error) =>
      pendingErrors.push({ pid, kind, code: error.code ?? error.message });
    for (const kind of ["cwd", "exe"]) {
      try {
        const value = await fs.readlink(`${procRoot}/${pid}/${kind}`);
        if (kind === "cwd") cwd = value.replace(/ \(deleted\)$/, "");
        record(pid, kind, value, kind === "cwd");
      } catch (error) {
        failed(kind, error);
      }
    }
    try {
      const argv = (await fs.readFile(`${procRoot}/${pid}/cmdline`, "utf8"))
        .split("\0")
        .filter(Boolean);
      for (const [index, argument] of argv.entries()) {
        if (["-e", "--eval", "-p", "--print", "-c"].includes(argv[index - 1]))
          continue;
        const value =
          argument.startsWith("-") && argument.includes("=")
            ? argument.slice(argument.indexOf("=") + 1)
            : argument;
        // Inspect whole path arguments, never substrings of scripts, URLs or prose.
        if (
          /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ||
          /[\n\r\0'"`{}();]/.test(value)
        )
          continue;
        const absolute = path.isAbsolute(value);
        const relative =
          !/\s/.test(value) &&
          (value.includes("/") ||
            (index === 1 && /\.(?:[cm]?js|ts|py|sh|bash|rb|pl)$/.test(value)));
        if (!absolute && (!relative || !cwd)) continue;
        record(
          pid,
          "argv-path",
          absolute ? path.normalize(value) : path.resolve(cwd, value),
          false,
          `argv[${index}]`,
        );
      }
    } catch (error) {
      failed("cmdline", error);
    }
    try {
      const descriptors = await fs.readdir(`${procRoot}/${pid}/fd`);
      await Promise.all(
        descriptors.map(async (fd) => {
          const file = `${procRoot}/${pid}/fd/${fd}`;
          try {
            const value = await fs.readlink(file);
            if (!candidateIndex.contains(value.replace(/ \(deleted\)$/, "")))
              return;
            const info = await fs.stat(file);
            record(pid, "fd", value, info?.isDirectory() ?? false, fd);
          } catch (error) {
            // A descriptor may close while the process remains alive.
            if (!["ENOENT", "ESRCH"].includes(error.code)) failed("fd", error);
          }
        }),
      );
    } catch (error) {
      failed("fd-directory", error);
    }
    try {
      const maps = await fs.readFile(`${procRoot}/${pid}/maps`, "utf8");
      for (const line of maps.split("\n")) {
        const file = line.match(/^\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+(\/.*)$/)?.[1];
        if (file) record(pid, "maps", file);
      }
    } catch (error) {
      failed("maps", error);
    }
    try {
      const after = await readIdentity(pid);
      if (
        after.startTime !== before.startTime ||
        ["Z", "X"].includes(after.state)
      ) {
        exited.add(pid);
        return;
      }
    } catch (error) {
      if (["ENOENT", "ESRCH"].includes(error.code)) {
        exited.add(pid);
        return;
      }
      failed("identity-after", error);
    }
    errors.push(...pendingErrors);
  }

  await Promise.all(
    Array.from({ length: 16 }, async () => {
      while (cursor < names.length) await inspect(names[cursor++]);
    }),
  );
  return {
    startedAt,
    completedAt: new Date().toISOString(),
    effectiveUid: process.getuid(),
    inspected,
    skippedNonUserspace,
    excludedExactIdentities: [...exclusions].map(([pid, startTime]) => ({
      pid,
      startTime,
    })),
    matches: matches.filter((match) => !exited.has(match.pid)),
    errors,
  };
}

export async function runFromStdin() {
  let bytes = "";
  for await (const chunk of process.stdin) {
    bytes += chunk;
    if (bytes.length > 16 * 1024 * 1024)
      throw new Error("Guard input exceeds limit");
  }
  const request = JSON.parse(bytes);
  const processes = await scanProcesses(request);
  const mountInfo = await fs.readFile("/proc/self/mountinfo", "utf8");
  const mounts = mountConflicts(request.root, request.candidates, mountInfo);
  process.stdout.write(JSON.stringify({ processes, mounts }) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runFromStdin();
