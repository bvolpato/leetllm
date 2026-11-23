import { admissionReceipt } from '../arithmetic.mjs';
import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterEquation,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawAdmissionMath(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    { b: currentBeat, p: progress } = skyChapterModel('admission-math', state),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-admission-math-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Cumulative accepted still includes prior updates'
        : currentBeat === 1
          ? 'Remove consumed groups from both sides of the inequality'
          : 'Admission is the smaller of two free margins',
    );
    const zero = currentBeat === 2 && done('zero-staleness'),
      r = zero
        ? admissionReceipt({
            B: 2,
            S: 0,
            step: 1,
            accepted: 0,
            running: 0,
            workers: 2,
          })
        : admissionReceipt({
            B: 2,
            S: 2,
            step: 4,
            accepted: 10,
            running: 1,
            workers: 6,
          });
    if (currentBeat < 2) {
      const removed = currentBeat === 1 && R('consumed-block') > 0,
        parts = removed
          ? [
              {
                id: 'buffered',
                label: 'accepted, not consumed',
                value: r.accepted - r.consumed,
                color: themeColors.blue,
              },
              {
                id: 'running',
                label: 'running',
                value: r.running,
                color: themeColors.pink,
              },
            ]
          : [
              {
                id: 'consumed',
                label: 'already consumed',
                value: r.consumed,
                color: themeColors.muted,
              },
              {
                id: 'buffered',
                label: 'accepted, not consumed',
                value: r.accepted - r.consumed,
                color: themeColors.blue,
              },
              {
                id: 'running',
                label: 'running',
                value: r.running,
                color: themeColors.pink,
              },
            ];
      if (removed)
        drawSkyChapterBox(
          ctx,
          api,
          '6 already-consumed groups removed',
          180,
          510,
          650,
          120,
          themeColors.muted,
          31,
        );
      teaching.allocation({
        x: removed ? 945 : 180,
        y: 420,
        width: removed ? 765 : 1530,
        height: 350,
        capacity: removed ? r.budget : r.limit,
        parts,
        unit: 'groups',
        fontSize: 29,
        color: themeColors.ink,
        trackColor: themeColors.panel,
      });
      drawSkyChapterText(
        ctx,
        api,
        'B=2 · S=2 · current step=4',
        960,
        360,
        32,
        themeColors.yellow,
        'center',
      );
      if (!removed) {
        drawSkyChapterEquation(ctx, api, String.raw`10+1\le(2+4)\cdot2=12`, 960, 855, 45);
        drawSkyChapterText(
          ctx,
          api,
          'accepted = 6 consumed + 4 buffered',
          960,
          955,
          31,
          themeColors.blue,
          'center',
        );
      } else {
        drawSkyChapterEquation(ctx, api, String.raw`(10+1)-6=5\le2(2+1)=6`, 960, 855, 43);
        drawSkyChapterText(
          ctx,
          api,
          'Cumulative source → outstanding population; same identities',
          960,
          955,
          31,
          themeColors.cyan,
          'center',
        );
      }
    } else {
      const computed = done('worker-margin') || zero;
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['quantity', 'capacity margin', 'worker margin'],
          ['limit', r.limit, r.workers],
          ['charged / running', r.charged, r.running],
          [
            'available',
            computed ? r.capacityMargin : 'pending',
            computed ? r.workerMargin : 'pending',
          ],
        ],
        260,
        390,
        1400,
        410,
        30,
      );
      drawSkyChapterBox(
        ctx,
        api,
        computed ? 'admit at most ' + r.available : 'Admission result pending',
        600,
        850,
        720,
        110,
        computed ? themeColors.green : themeColors.muted,
        39,
      );
      if (zero)
        drawSkyChapterText(
          ctx,
          api,
          'Separate S=0, step 1 initial-state illustration',
          960,
          350,
          30,
          themeColors.pink,
          'center',
        );
    }
  });
}
export default {
  id: 'admission-math',
  draw: drawAdmissionMath,
  cues: [
    'sky-admission-math-b0',
    'sky-admission-math-b1',
    'sky-consumed-block',
    'sky-outstanding-bound',
    'sky-admission-math-b2',
    'sky-worker-margin',
    'sky-zero-staleness',
  ],
};
