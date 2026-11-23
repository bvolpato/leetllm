#!/usr/bin/env node
import path from 'node:path';
import { parseArgs } from 'node:util';
import { prepareCohortJob, approveCohortJob, runCohort } from '../lib/render-cohort.mjs';
import { materializeReleaseConsumer } from '../lib/release-consumer.mjs';

const [command, ...args] = process.argv.slice(2);
const { values } = parseArgs({
  args,
  options: {
    root: { type: 'string' },
    'authority-root': { type: 'string' },
    cohort: { type: 'string' },
    subject: { type: 'string' },
    job: { type: 'string' },
    approval: { type: 'string' },
    help: { type: 'boolean' },
    jobs: { type: 'string' },
    spec: { type: 'string' },
    destination: { type: 'string' },
  },
});
const required = (name) => {
  if (!values[name]) throw new Error(`--${name} is required`);
  return path.resolve(values[name]);
};

async function main() {
  if (values.help || command === 'help') {
    console.log(
      'materialize --root SOURCE_REPOSITORY --authority-root WORKSPACE --spec EXACT_RELEASE_INPUTS.json --destination NEW_CONSUMER',
    );
    console.log(
      'prepare --root INSTALLED_RELEASE_CONSUMER --authority-root REPOSITORY --cohort NEW_COHORT --subject EXACT_INPUTS.json',
    );
    console.log(
      'approve --job JOB.json --authority-root REPOSITORY --approval CURRENT_SOURCE_RUNTIME_GATE.json',
    );
    console.log('run --cohort COHORT_DIRECTORY [--jobs 1..4]');
    console.log(
      'For four concurrent films, set policyId to vizmatic-0.8.1-parallel-4-v1 in the 0.8.1 definition before materializing its release consumer. Prepare and approve the jobs as usual, then run:',
    );
    console.log('node videos/tools/render-cohort.mjs run --cohort COHORT_DIRECTORY --jobs 4');
    console.log('The default is one film at a time.');
    console.log(
      'Version 2 subjects use the installed consumer’s bound 0.8.1 cohort definition and a separate cohort directory. Legacy version 1 subjects keep their exact 0.8.0 policy.',
    );
    console.log(
      'Preparation preserves selected sources, runtime and retained speech. Approval is separate; every new movie still needs an independent encoded review.',
    );
    return;
  }
  if (values.jobs !== undefined && command !== 'run') throw new Error('--jobs applies only to run');
  if (values.jobs !== undefined && !/^[1-4]$/.test(values.jobs))
    throw new Error('--jobs must be an integer from 1 to 4');
  if (command === 'materialize')
    console.log(
      await materializeReleaseConsumer({
        sourceRoot: required('root'),
        authorityRoot: required('authority-root'),
        specFile: required('spec'),
        destination: required('destination'),
      }),
    );
  else if (command === 'prepare')
    console.log(
      await prepareCohortJob({
        consumerRoot: required('root'),
        authorityRoot: required('authority-root'),
        cohortRoot: required('cohort'),
        subjectFile: required('subject'),
      }),
    );
  else if (command === 'approve')
    console.log(
      (
        await approveCohortJob({
          jobFile: required('job'),
          approvalFile: required('approval'),
          authorityRoot: required('authority-root'),
        })
      ).state,
    );
  else if (command === 'run')
    console.log(
      `Completed ${await runCohort(required('cohort'), { jobs: Number(values.jobs ?? 1) })} film jobs`,
    );
  else throw new Error('Use materialize, prepare, approve, run, or help');
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = error.exitCode ?? 1;
});
