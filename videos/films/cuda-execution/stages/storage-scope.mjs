import { tokenValues } from '../fixtures.mjs';
import { addressReceipt } from '../arithmetic.mjs';
import { mix, directed } from '../construction.mjs';
import {
  drawAddedAnimate,
  drawAddedCell,
  drawAddedLine,
  drawAddedNote,
  drawAddedP,
  drawAddedText,
} from '../defaults.mjs';
export function drawStorageScope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawAddedP(ctx, api, id) === 1;
  api.focus.target('storage-scope-construction', () => {
    if (currentBeat === 0) {
      drawAddedText(
        ctx,
        api,
        'A tensor allocation and a kernel’s working sets',
        160,
        285,
        33,
        themeColors.cyan,
      );
      const top = tokenValues.map((x, i) => {
        drawAddedCell(ctx, api, x, 180 + i * 195, 370, 165, 80, themeColors.blue, 33);
        return {
          x: 260 + i * 195,
          y: 450,
        };
      });
      drawAddedText(
        ctx,
        api,
        'device global memory · same eight values',
        180,
        335,
        27,
        themeColors.blue,
      );
      const p = drawAddedP(ctx, api, 'storage-working-set');
      drawAddedLine(ctx, api, 180, 650, 180, 870, themeColors.cyan, 3);
      drawAddedLine(ctx, api, 180, 870, 910, 870, themeColors.cyan, 3);
      drawAddedLine(ctx, api, 910, 870, 910, 650, themeColors.cyan, 3);
      drawAddedText(ctx, api, 'block-shared tile', 545, 930, 30, themeColors.cyan, 'center');
      for (let i = 0; i < 4; i++) {
        const q = drawAddedAnimate(ctx, api, p, i, 4);
        if (q > 0) {
          const x = mix(top[i].x, 270 + i * 150, q),
            y = mix(480, 790, q);
          drawAddedCell(ctx, api, tokenValues[i], x - 55, y - 36, 110, 65, themeColors.cyan, 30);
        }
      }
      api.rect(ctx, 1120, 650, 590, 220, themeColors.panel, themeColors.yellow, 3);
      drawAddedText(
        ctx,
        api,
        'thread-local registers',
        1415,
        700,
        30,
        themeColors.yellow,
        'center',
      );
      if (p > 0.6) {
        drawAddedCell(ctx, api, '3', 1200, 765, 120, 70, themeColors.yellow);
        drawAddedCell(ctx, api, '+ 1', 1450, 765, 140, 70, themeColors.yellow);
      }
      drawAddedNote(
        ctx,
        api,
        'The kernel loads a tile from global memory. The hardware manages the caches.',
      );
    } else if (currentBeat === 1) {
      drawAddedText(
        ctx,
        api,
        'Lane 7 reads word 7',
        160,
        285,
        33,
        themeColors.cyan,
      );
      const words = addressReceipt(tokenValues.map((_, index) => index)).rows;
      const last = words.at(-1);
      const steps = [
        ['word index', '7'],
        ['byte address', '7 × 4 = 28'],
        ['global segment', done('storage-segment') ? 'floor(28/32) = 0' : '?'],
      ];
      steps.forEach(([label, value], i) => {
        const x = 190 + (i % 2) * 840,
          y = 445 + Math.floor(i / 2) * 270;
        drawAddedText(ctx, api, label, x, y - 65, 28, themeColors.muted);
        drawAddedText(
          ctx,
          api,
          value,
          x,
          y + 35,
          43,
          i < 2 ? themeColors.blue : i === 2 ? themeColors.cyan : themeColors.yellow,
          'left',
          true,
        );
      });
      const load = directed(state, 'storage-eight-words', 1, 0.48, 0.69);
      const bank = directed(state, 'storage-bank', 1, 0.82, 0.94);
      if (load > 0) api.focus.target('storage-eight-word-tile', () => {
        drawAddedText(ctx, api, 'New shared tile · word 0 starts in bank 0', 1030, 630, 31, themeColors.cyan);
        words.forEach(({ word }, index) => {
          const left = 1030 + index * 93;
          const selected = word === last.word && bank > 0;
          drawAddedText(ctx, api, 'w' + word, left + 39, 686, 26, themeColors.muted, 'center');
          drawAddedCell(ctx, api, load * words.length >= index + 1 ? tokenValues[index] : '·',
            left, 706, 78, 62, selected ? themeColors.yellow : themeColors.cyan);
        });
        if (load === 1)
          drawAddedText(ctx, api, 'Bank for word ' + last.word + ' = ' +
            (bank === 1 ? last.word + ' mod 32 = ' + last.bank : '?'),
            1030, 858, 38, bank === 1 ? themeColors.yellow : themeColors.ink);
      });
      drawAddedNote(
        ctx,
        api,
        'The word index counts four-byte words. The byte address counts individual bytes.',
      );
    } else if (currentBeat < 4) {
      const offset = Math.round(7 * directed(state, 'storage-offset', 3));
      const receipt = addressReceipt(Array.from({ length: 32 }, (_, lane) => offset + lane));
      drawAddedText(ctx, api, 'One warp   /   32 consecutive four-byte words', 160, 285, 37, themeColors.ink);
      drawAddedText(ctx, api, 'One square per word', 165, 405, 32, themeColors.muted);
      api.focus.target('global-window', () => {
        for (let seg = 0; seg < 5; seg++) {
          const left = 165 + seg * 325;
          const used = receipt.segments.includes(seg);
          drawAddedText(ctx, api, 'segment ' + seg, left, 505, 28, used ? themeColors.cyan : themeColors.muted);
          for (let w = 0; w < 8; w++) {
            const word = 8 * seg + w;
            const occupied = word >= offset && word < offset + 32;
            api.rect(ctx, left + w * 37, 545, 33, 80, occupied ? themeColors.cyan : themeColors.panel, themeColors.muted, 1);
          }
          drawAddedText(ctx, api, 'bytes ' + seg * 32 + '–' + (seg * 32 + 31),
            left, 686, 27, themeColors.muted);
        }
      });
      drawAddedText(ctx, api, 'First address   ' + receipt.rows[0].address, 165, 798, 35, themeColors.ink);
      drawAddedText(ctx, api, 'Last address   ' + receipt.rows.at(-1).address, 965, 798, 35, themeColors.ink);
      drawAddedText(ctx, api, 'Useful   ' + receipt.requested + ' B', 165, 918, 37, themeColors.cyan);
      drawAddedText(ctx, api, receipt.segments.length + ' segments   /   ' + receipt.footprint + ' B',
        965, 918, 37, themeColors.yellow);
    } else {
      const count = Math.floor(32 * directed(state, 'storage-bank-pairs', 4));
      const words = Array.from({ length: count }, (_, lane) => lane * 34);
      const { rows, maxDistinctWords } = addressReceipt(words);
      const usedBanks = new Set(rows.map(row => row.bank));
      drawAddedText(ctx, api, 'Shared tile   /   lane i reads word 34 × i', 160, 280, 37, themeColors.ink);
      drawAddedText(ctx, api, 'Each dot is a different word requested from that bank', 160, 380, 32, themeColors.muted);
      api.focus.target('bank-stacks', () => {
        for (let bank = 0; bank < 32; bank++) {
          const x = 179 + (bank % 16) * 102, y = 585 + Math.floor(bank / 16) * 210;
          const entries = rows.filter(row => row.bank === bank);
          api.line(ctx, x - 32, y, x + 32, y, themeColors.muted, 3);
          entries.forEach((row, i) => api.circle(ctx, x, y - 23 - i * 37, 15,
            i ? themeColors.yellow : themeColors.cyan));
          drawAddedText(ctx, api, bank, x, y + 46, 27, themeColors.muted, 'center', true);
        }
      });
      drawAddedText(ctx, api, usedBanks.size + ' of 32 banks used', 180, 945, 37, themeColors.cyan);
      drawAddedText(ctx, api, 'Most words at one bank   ' + maxDistinctWords, 980, 945, 37, themeColors.yellow);
    }
  });
}
export default {
  id: 'storage-scope',
  draw: drawStorageScope,
  cues: ['storage-working-set', 'storage-segment', 'storage-eight-words', 'storage-bank', 'storage-stride', 'storage-offset', 'storage-bank-pairs'],
};
