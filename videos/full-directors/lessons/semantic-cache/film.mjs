import { art } from './art.mjs';
import { checkCases } from './cases.mjs';
import {
  opening,
  contract,
  bytes,
  authorization,
  geometry,
  numeric,
  retrieval,
  gateOrder,
  indexVersion,
} from './requests.mjs';
import { scores, denominator, confidence, heldout } from './calibration.mjs';
import { freshness, cutover, fingerprint, admission } from './records.mjs';
import { windowTen, budget, latency, promotion } from './economics.mjs';
import { traces, tiers, diagnosis, cohortPractice, finalPractice } from './practice.mjs';

const chapters = [
  opening,
  contract,
  bytes,
  authorization,
  geometry,
  numeric,
  retrieval,
  gateOrder,
  indexVersion,
  (f) => scores(f, 10),
  denominator,
  (f) => scores(f, 12),
  confidence,
  heldout,
  freshness,
  cutover,
  fingerprint,
  admission,
  windowTen,
  budget,
  latency,
  promotion,
  traces,
  tiers,
  diagnosis,
  cohortPractice,
  finalPractice,
];
export default {
  title: 'When a Similar Question Can Reuse an Answer',
  check: checkCases,
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](art(ctx, clock));
  },
};
