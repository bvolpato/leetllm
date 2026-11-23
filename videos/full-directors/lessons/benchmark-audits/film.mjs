import {
  renew,
  contract,
  gold,
  checker,
  trace,
  metrics,
  slices,
  summary,
  checkLibrary,
} from './library.mjs';
import {
  knowledge,
  mathSuite,
  harness,
  benchmarkAudit,
  preference,
  checkSuites,
} from './suites.mjs';
import {
  programs,
  estimator,
  judge,
  exposure,
  screening,
  perfect,
  wilson,
  paired,
  checkSampling,
} from './sampling.mjs';
import { gates, finite, packageRun, archiveGate, checkRelease } from './release.mjs';

const scenes = [
  renew,
  contract,
  gold,
  checker,
  trace,
  metrics,
  knowledge,
  mathSuite,
  harness,
  benchmarkAudit,
  preference,
  slices,
  programs,
  estimator,
  judge,
  exposure,
  screening,
  perfect,
  wilson,
  paired,
  gates,
  finite,
  packageRun,
  summary,
  archiveGate,
];

export default {
  title: 'Recover the Experiment Behind the Benchmark Score',
  draw(ctx, clock) {
    scenes[clock.beat.chapterIndex](ctx, clock);
  },
  check() {
    checkLibrary();
    checkSuites();
    checkSampling();
    checkRelease();
  },
};
