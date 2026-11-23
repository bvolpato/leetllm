import { bankAddress } from '../arithmetic.mjs';
import { borderedRect, detailEquation } from '../defaults.mjs';
import { finished, label, progress } from '../workbench.mjs';

const bankX = (bank) => 270 + bank * 47;
const column = 3;

function drawRequests(ctx, state, api) {
  const { C } = api;
  const paddingBeat = state.beat === 1;
  const padded = finished(state, 1, 'padded-map');
  const count = 1 + Math.floor(31 * progress(state, 0, 'bank-requests'));

  label(ctx, api, padded ? 'Same lanes after one-word row padding' : '32 banks for four-byte words', 960, 290, 36, C.ink);
  for (let bank = 0; bank < 32; bank++) {
    const x = bankX(bank);
    borderedRect(ctx, api, x, 400, 41, 57, C.muted);
    label(ctx, api, bank, x + 20, 437, 21, C.muted);
  }
  api.focus.target('bank-words', () => {
    for (let lane = 0; lane < count; lane++) {
      const selected = paddingBeat && lane === 1;
      const repair = progress(state, 1, selected ? 'padding-repair' : 'padded-map');
      const from = bankAddress(lane, column).bank;
      const to = bankAddress(lane, column, 33).bank;
      const x = bankX(from + (to - from) * repair);
      const y = 480 + lane * 11 * (1 - repair);
      const color = selected ? C.yellow : C.pink;
      const mark = () => borderedRect(ctx, api, x, y, 41, 8, color, color);
      if (selected) api.focus.target('gemm-bank-lane', mark);
      else mark();
    }
  });

  const old = bankAddress(1, column);
  if (paddingBeat) {
    if (!padded) label(ctx, api, 'Retained baseline · 32 words per row', 980, 779, 28, C.muted);
    api.focus.target('gemm-bank-lane', () => {
      label(ctx, api, `Before padding · lane 1 → word ${old.word} → bank ${old.bank}`, 610, 355, 31, C.muted);
      if (finished(state, 1, 'padded-lane')) {
        const { word, bank } = bankAddress(1, column, 33);
        label(ctx, api, `Lane 1 → word ${word} → bank ${bank}`, 1300, 355, 31, C.yellow);
      }
    });
  } else {
    const requests = Array.from({ length: Math.min(count, 3) }, (_, lane) =>
      `Lane ${lane} → word ${bankAddress(lane, column).word}`);
    label(ctx, api, count === 1 ? '32 lanes → the same word' : requests.join('     '), 960, 355, 29, C.pink);
  }
  api.focus.target('gemm-bank-map', () =>
    detailEquation(ctx, api,
      padded ? '(33l+3)\\bmod32=(l+3)\\bmod32' : count === 1 ? '3\\bmod32=3' : '(32l+3)\\bmod32=3',
      960, 875, 42, padded ? C.green : C.pink, 'center'));
  const note = paddingBeat
    ? padded ? 'One distinct word in each bank' : 'One mark for each distinct word'
    : count === 1 ? 'All lanes request word 3 · one broadcast' : 'One mark for each distinct word in bank 3';
  label(ctx, api, note, 960, 960, 30, C.muted);
}

function drawPermutation(ctx, state, api) {
  const { C } = api;
  const swap = progress(state, 2, 'xor-layout');
  const colors = [C.blue, C.pink, C.cyan, C.green];
  const readCues = ['read-first', 'read-second', 'read-third', 'read-fourth'];
  const row = 1;
  const readOrder = [0, 1, 2, 3].map((col) => col ^ row);
  label(ctx, api, 'Read the four entries of row 1 in order', 960, 290, 36, C.ink);
  api.focus.target('gemm-xor-map', () =>
    detailEquation(ctx, api, 'p=c\\oplus r\\quad(r=1)', 960, 388, 43, C.yellow, 'center'));
  api.focus.target('xor-words', () => {
    for (let col = 0; col < 4; col++) {
      const address = readOrder[col];
      const startX = 400 + col * 300;
      const x = startX + (address - col) * 300 * swap;
      const y = 610 + (col % 2 === 0 ? -120 : 120) * Math.sin(Math.PI * swap);
      label(ctx, api, 'physical ' + col, startX + 105, 465, 30, C.muted);
      borderedRect(ctx, api, x, y, 210, 100, colors[col]);
      label(ctx, api, 'logical ' + col, x + 105, y + 63, 36, colors[col]);
      if (swap === 1 && finished(state, 2, readCues[col])) {
        label(ctx, api, ['1st read', '2nd read', '3rd read', '4th read'][col], x + 105, 803, 32, C.yellow);
      }
    }
  });
  if (finished(state, 2, 'read-fourth')) {
    label(ctx, api, 'Read physical columns  ' + readOrder.join(' → '), 960, 920, 39, C.ink);
  }
}

export function drawBanks(ctx, scene, state, api) {
  if (state.beat === 2) drawPermutation(ctx, state, api);
  else drawRequests(ctx, state, api);
}

export default {
  id: 'banks', draw: drawBanks,
  cues: ['bank-requests', 'padding-repair', 'padded-lane', 'padded-map', 'xor-layout',
    'read-first', 'read-second', 'read-third', 'read-fourth'],
};
