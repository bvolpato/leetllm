import { COSTS } from '../fixtures.mjs';
import { BASELINE_DECISIONS } from '../model.mjs';
import { boostCue } from '../construction.mjs';
import { cellText, chapterText, line } from '../defaults.mjs';

const jobs = 100;
const missed = jobs * COSTS.risk;
const onTime = jobs - missed;

export function drawBaseline(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id, beat) => boostCue(state, id, beat);
  const risk = cue('baseline-risk', 0);
  const priority = cue('baseline-priority', 2) > 0;
  const tier = BASELINE_DECISIONS[priority ? 1 : 0];
  const quiet = cue('baseline-standard', 1) > 0;

  api.focus.target('baseline-risk', () => {
    chapterText(ctx, api, 'Expected per 100 jobs', 200, 301, 44);
    for (let i = 0; i < jobs; i++) {
      const x = 205 + (i % 10) * 46;
      const y = 357 + Math.floor(i / 10) * 46;
      const color = i >= Math.floor(risk * jobs) ? C.muted : i < missed ? C.pink : C.blue;
      api.rect(ctx, x, y, 35, 35, color, undefined, 4);
    }
    if (risk === 1) {
      chapterText(ctx, api, missed + ' miss', 200, 892, 37, C.pink);
      chapterText(ctx, api, onTime + ' on time', 420, 892, 37, C.blue);
    }
  });

  chapterText(ctx, api, 'Expected cost per job', 835, 301, 44);
  api.focus.target('baseline-alert-cost', () => {
    chapterText(ctx, api, 'Send alert', 835, 417, 43, C.yellow);
    if (risk === 1) {
      chapterText(
        ctx,
        api,
        onTime + ' false alarms × ' + COSTS.falseAlarm + ' ÷ ' + jobs,
        835,
        501,
        38,
      );
      const known = cue('baseline-alert-cost', 0) === 1;
      chapterText(
        ctx,
        api,
        known ? tier.alertCost.toFixed(2) + ' units' : '?',
        1740,
        501,
        52,
        C.yellow,
        'right',
      );
    }
  });

  line(ctx, api, 835, 574, 1740, 574, C.muted, 2);
  api.focus.target('baseline-quiet-cost', () => {
    chapterText(ctx, api, 'Stay quiet', 835, 663, 43, C.pink);
    if (quiet) {
      chapterText(ctx, api, missed + ' misses × ' + tier.missCost + ' ÷ ' + jobs, 835, 747, 38);
      const known = priority
        ? cue('baseline-priority-result', 3) === 1
        : cue('baseline-standard-result', 1) === 1;
      chapterText(
        ctx,
        api,
        known ? tier.noAlertCost.toFixed(2) + ' units' : '?',
        1740,
        747,
        52,
        C.pink,
        'right',
      );
    }
  });

  api.focus.target('baseline-choice', () => {
    let decision = 'What does it cost to alert?';
    if (quiet) decision = 'Standard job';
    if (cue('baseline-standard-action', 1) === 1) decision = 'Standard job   ·   leave it alone';
    if (priority) decision = 'Priority job   ·   which action costs less?';
    if (cue('baseline-priority-action', 3) === 1) decision = 'Priority job   ·   send the alert';
    cellText(ctx, api, decision, 960, 996, C.ink, 38);
  });
}

export default {
  id: 'baseline',
  draw: drawBaseline,
  cues: [
    'baseline-risk',
    'baseline-alert-cost',
    'baseline-standard',
    'baseline-standard-result',
    'baseline-standard-action',
    'baseline-priority',
    'baseline-priority-action',
    'baseline-priority-result',
  ],
};
