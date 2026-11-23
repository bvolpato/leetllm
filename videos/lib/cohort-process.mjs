import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

function abortError(signal) {
  const error = new Error(`Cohort interrupted by ${signal}`);
  error.name = 'AbortError';
  error.exitCode = signal === 'SIGINT' ? 130 : 143;
  return error;
}

/** Ordinary termination waits for the active worker lease; SIGKILL cannot be recovered. */
export async function withCohortSignals(callback, { signal } = {}) {
  const controller = new AbortController();
  const interrupt = (name) => controller.abort(abortError(name));
  const term = () => interrupt('SIGTERM'),
    int = () => interrupt('SIGINT');
  const forward = () =>
    controller.abort(
      signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason)),
    );
  process.on('SIGTERM', term);
  process.on('SIGINT', int);
  signal?.addEventListener('abort', forward, { once: true });
  if (signal?.aborted) forward();
  try {
    return await callback(controller.signal);
  } finally {
    process.removeListener('SIGTERM', term);
    process.removeListener('SIGINT', int);
    signal?.removeEventListener('abort', forward);
  }
}

/** Stop one owned group, wait its direct child and confirm remaining members are nonrunning. */
export function spawnCohortProcess(command, args, { signal, killAfterMs = 10000, ...options }) {
  if (process.platform !== 'linux')
    throw new Error('Cohort group supervision requires Linux /proc');
  signal?.throwIfAborted();
  const child = spawn(command, args, { ...options, detached: process.platform !== 'win32' });
  let leaseFinished = false,
    reason,
    escalation,
    stopping = false,
    stoppedAt,
    lastSignal,
    stopError;
  const send = (name) => {
    if (!child.pid || leaseFinished) return;
    lastSignal = name;
    try {
      process.kill(process.platform === 'win32' ? child.pid : -child.pid, name);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  };
  const stop = (cause) => {
    if (leaseFinished || stopping) return;
    stopping = true;
    stoppedAt = Date.now();
    reason ??= cause;
    try {
      send('SIGTERM');
    } catch (error) {
      stopError = error;
    }
    escalation = setTimeout(() => {
      try {
        send('SIGKILL');
      } catch (error) {
        stopError ??= error;
      }
    }, killAfterMs);
  };
  let checkExit = Promise.resolve();
  child.once('exit', (code, exitSignal) => {
    if (stopping) return;
    if (code !== 0) {
      stop(new Error(`Snapshot renderer exited ${code ?? exitSignal}`));
      return;
    }
    checkExit = groupMembers(child.pid)
      .then((members) => {
        if (members.some((member) => !['Z', 'X'].includes(member.state)))
          stop(new Error('Snapshot renderer exited with a descendant still running'));
      })
      .catch(stop);
  });
  const abort = () => stop(signal.reason);
  const completion = new Promise((resolve) => {
    child.once('error', (error) => resolve({ error }));
    child.once('close', (code, signal) => resolve({ code, signal }));
  }).then(async (result) => {
    await checkExit;
    try {
      let group;
      if (stopping && child.pid) {
        while (true) {
          const members = await groupMembers(child.pid);
          const live = members.filter((member) => !['Z', 'X'].includes(member.state));
          group = {
            id: child.pid,
            confirmedNonRunning: live.length === 0,
            live,
            nonRunning: members.filter((member) => ['Z', 'X'].includes(member.state)),
            lastSignal,
          };
          if (!live.length) break;
          if (Date.now() > stoppedAt + killAfterMs + 2000) {
            stopError ??= new Error(
              `Owned process group still running after SIGKILL: ${live.map((member) => member.pid).join(', ')}`,
            );
            break;
          }
          await delay(25);
        }
      }
      return {
        ...result,
        error: result.error ?? stopError,
        reason,
        directChildReaped: !result.error,
        group,
      };
    } catch (error) {
      // Observation cannot veto termination of the group we already own.
      if (stopping && child.pid) {
        try {
          send('SIGKILL');
          await delay(25);
        } catch (killError) {
          error = new AggregateError(
            [error, killError],
            'Group observation and termination failed',
          );
        }
      }
      return {
        ...result,
        error,
        reason,
        directChildReaped: !result.error,
        group: {
          id: child.pid,
          confirmedNonRunning: false,
          observationError: error.message,
          lastSignal,
        },
      };
    } finally {
      leaseFinished = true;
      clearTimeout(escalation);
      signal?.removeEventListener('abort', abort);
    }
  });
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  return { child, completion, stop };
}

async function groupMembers(groupId) {
  try {
    process.kill(-groupId, 0);
  } catch (error) {
    if (error.code === 'ESRCH') return [];
    throw error;
  }
  const members = await Promise.all(
    (await fs.readdir('/proc'))
      .filter((name) => /^\d+$/.test(name))
      .map(async (pid) => {
        try {
          const stat = await fs.readFile(`/proc/${pid}/stat`, 'utf8');
          const fields = stat
            .slice(stat.lastIndexOf(')') + 2)
            .trim()
            .split(/\s+/);
          if (Number(fields[2]) === groupId)
            return { pid: Number(pid), state: fields[0], parent: Number(fields[1]) };
        } catch (error) {
          if (error.code !== 'ENOENT' && error.code !== 'ESRCH') throw error;
        }
      }),
  );
  return members.filter(Boolean).sort((a, b) => a.pid - b.pid);
}

export async function runSerialCohort(jobs, worker, { signal }) {
  signal.throwIfAborted();
  for (const job of jobs) {
    signal.throwIfAborted();
    await worker(job, { signal });
    signal.throwIfAborted();
  }
  signal.throwIfAborted();
}

export async function runCohortPool(jobs, worker, { signal, concurrency }) {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1)
    throw new Error('Cohort concurrency must be a positive integer');
  const failure = new AbortController();
  const stop = AbortSignal.any([signal, failure.signal]);
  let next = 0;
  let active = 0;
  async function runSlot() {
    while (!stop.aborted && next < jobs.length) {
      const job = jobs[next++];
      active++;
      try {
        await worker(job, { signal: stop, activeJobs: () => active });
      } catch (error) {
        failure.abort(error);
      } finally {
        active--;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, runSlot));
  stop.throwIfAborted();
}
