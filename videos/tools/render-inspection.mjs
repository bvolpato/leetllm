#!/usr/bin/env node
import path from 'node:path';
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { prepareInspection, runInspection } from '../lib/inspection-render.mjs';

const [command, ...args] = process.argv.slice(2);
const { values } = parseArgs({
  args,
  options: {
    root: { type: 'string' },
    destination: { type: 'string' },
    authority: { type: 'string' },
    'authority-sha256': { type: 'string' },
    'plan-sha256': { type: 'string' },
    'audio-timelines': { type: 'string' },
    'audio-only': { type: 'boolean' },
    ids: { type: 'string' },
    'audio-priority': { type: 'string' },
    'resume-interrupted': { type: 'boolean' },
    'render-priority': { type: 'string' },
    'state-file': { type: 'string' },
    'retry-empty-stage': { type: 'boolean' },
    'storage-budget': { type: 'string' },
    'render-reservation-bytes': { type: 'string' },
    'audio-reservation-bytes': { type: 'string' },
    limit: { type: 'string' },
    help: { type: 'boolean' },
  },
});
const required = (key) => {
  if (!values[key]) throw new Error(`--${key} is required`);
  return path.resolve(values[key]);
};

async function main() {
  if (values.help || command === 'help' || command === '--help') {
    console.log(
      'prepare --destination NEW_EXTERNAL_RUN --authority SOURCE_FREEZE.json --authority-sha256 SHA [--root REPOSITORY] [--audio-timelines ARRAY.json]',
    );
    console.log(
      'run --destination FROZEN_RUN --plan-sha256 SHA --storage-budget MEASURED_LEDGER [--audio-only] [--ids ID,ID] [--limit FIRST_N]',
    );
    console.log(
      'Recovery: --resume-interrupted. Priorities: --audio-priority ID,ID --render-priority ID,ID. Stage retries: --ids ID,ID --state-file progress-stage-NAME.json --retry-empty-stage.',
    );
    console.log(
      'One shared exact public 0.8.1 installation; source, direction and encoded review remain pending.',
    );
    return;
  }
  if (command === 'prepare') {
    const result = await prepareInspection({
      root: values.root ?? fileURLToPath(new URL('../../', import.meta.url)),
      destination: required('destination'),
      authority: { path: required('authority'), sha256: values['authority-sha256'] },
      audioTimelines: values['audio-timelines']
        ? JSON.parse(await readFile(required('audio-timelines'), 'utf8'))
        : [],
    });
    console.log(
      JSON.stringify({
        status: 'prepared',
        lessons: result.lessons.length,
        repository: result.repository,
      }),
    );
  } else if (command === 'run') {
    const limit = Number(values.limit ?? 199);
    if (!Number.isInteger(limit) || limit < 1 || limit > 199)
      throw new Error('--limit must be between 1 and 199');
    const result = await runInspection(required('destination'), {
      limit,
      planSha256: values['plan-sha256'],
      audioOnly: values['audio-only'],
      ids: values.ids?.split(','),
      audioPriority: values['audio-priority']?.split(','),
      resumeInterrupted: values['resume-interrupted'],
      renderPriority: values['render-priority']?.split(','),
      stateFile: values['state-file'],
      retryEmptyStage: values['retry-empty-stage'],
      storageBudget: required('storage-budget'),
      ...(values['render-reservation-bytes']
        ? { renderReservationBytes: Number(values['render-reservation-bytes']) }
        : {}),
      ...(values['audio-reservation-bytes']
        ? { audioReservationBytes: Number(values['audio-reservation-bytes']) }
        : {}),
    });
    console.log(
      JSON.stringify({
        status: result.status,
        completed: result.lessons.filter((entry) => entry.status === 'complete').length,
        failed: result.lessons.filter((entry) => entry.status === 'failed').length,
      }),
    );
    if (result.status === 'complete-with-failures') process.exitCode = 1;
  } else throw new Error('Use prepare, run, or help');
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
