import { directedCue, freshPositionFrame } from '../construction.mjs';
import { dot, rotatePair } from '../arithmetic.mjs';
import { drawUnitPair } from '../unit-pair.mjs';

export function drawFreshPositionContract(ctx, scene, state, api) {
  const { C, text, line, circle, focus, components } = api;
  const { beat } = state;
  const model = freshPositionFrame(state);
  const { queryPosition: m, keyPosition: n, phaseIndex: used } = model;
  const label = (v, x, y, size, color) => text(ctx, v, x, y, size, color, 'center');
  const cue = (id, b) => directedCue(state, id, b);
  const moving = beat >= 3;
  const travel = api.ease(cue('move-in-memory', 3));
  const copied = cue('copy-key', 4) > 0;
  const extraTurn = api.ease(cue('rotate-again', 4));
  const showSecondScore = cue('second-score', 4) > 0;
  const key = rotatePair([1, 0], used * 0.4);
  const secondTurn = dot(rotatePair([1, 0], m * 0.4), rotatePair(key, used * 0.4));
  const slotX = (slot) => 1060 + 292 * slot;

  label('Unrotated Q and K each start at [1, 0]    ·    0.4 rad per position', 960, 252, 35, C.ink);
  label((beat === 4 ? 'Full pass · query ' : 'Query position ') + m, 475, 355, 43, C.cyan);
  focus.target('phase-dial', () => {
    if (model.phaseKnown || beat === 1) {
      drawUnitPair(ctx, api, {
        x: 475,
        y: 592,
        radius: 177,
        queryAngle: m * 0.4,
        keyAngle: used * 0.4,
      });
    } else {
      circle(ctx, 475, 592, 177, 'transparent', '#465267', 2);
      label('?', 475, 617, 70, C.ink);
    }
  });
  if (beat === 4 && copied) {
    focus.target('cache-read', () => {
      label('Cache read · key ID ' + n + ' in slot 0', 1352, 355, 38, C.ink);
      drawUnitPair(ctx, api, {
        x: 1352,
        y: 592,
        radius: 177,
        queryAngle: m * 0.4,
        keyAngle: used * 0.4 * (1 + extraTurn),
      });
    });
  } else {
    label('Physical cache slots', 1352, 355, 38, C.ink);
    focus.target('cache-slots', () => {
      for (let slot = 0; slot < 3; slot++) {
        const x = slotX(slot);
        line(ctx, x - 125, 647, x + 125, 647, C.muted, 3);
        line(ctx, x - 125, 607, x - 125, 647, C.muted, 3);
        line(ctx, x + 125, 607, x + 125, 647, C.muted, 3);
        label('slot ' + slot, x, 711, 34, C.muted);
      }
      const x = api.lerp(slotX(model.slot), slotX(0), travel);
      const y = 567 - 92 * Math.sin(travel * Math.PI);
      components.card({
        id: 'stored-key',
        label: 'key ID ' + n,
        x: x - 107,
        y: y - 45,
        width: 214,
        height: 90,
        fontSize: 34,
        fill: C.panel,
        stroke: C.yellow,
        textColor: C.yellow,
        radius: 12,
      });
    });
  }
  focus.target('phase-calculation', () => {
    const relative = model.phaseKnown || moving ? model.relativePhase.toFixed(1) : '?';
    label(
      '(' + (beat === 0 ? '?' : used) + ' - ' + m + ') × 0.4 = ' + relative + ' rad',
      475,
      874,
      39,
      C.pink,
    );
    const scoreLabel = moving ? 'Reference dot product' : 'Dot product';
    label(
      scoreLabel + '  ' + (model.scoreKnown ? model.score.toFixed(3) : '?'),
      475,
      970,
      47,
      C.green,
    );
  });
  focus.target('builder-input', () => {
    if (moving) {
      label(
        copied ? 'Copy stored K    ' + model.score.toFixed(3) : 'Copy stored K    ?',
        1350,
        863,
        39,
        copied ? C.green : C.ink,
      );
      label(
        showSecondScore ? 'Rotate again    ' + secondTurn.toFixed(3) : 'Rotate again    ?',
        1350,
        958,
        39,
        showSecondScore ? C.red : C.ink,
      );
    } else {
      label('Key rotation uses', 1350, 852, 35, C.muted);
      label(
        beat === 0 ? '2 or ' + n + '?' : (used === n ? 'logical ID  ' : 'slot number  ') + used,
        1350,
        944,
        49,
        beat === 0 ? C.ink : used === n ? C.yellow : C.red,
      );
    }
  });
}
export default {
  id: 'fresh-position-contract',
  draw: drawFreshPositionContract,
  cues: [
    'choose-input',
    'rp-fresh-position-contract-1-0',
    'rp-fresh-position-contract-1-1',
    'rp-fresh-position-contract-1-2',
    'rp-fresh-position-contract-2-0',
    'rp-fresh-position-contract-2-1',
    'move-in-memory',
    'choose-copy',
    'copy-key',
    'rotate-again',
    'second-score',
  ],
};
