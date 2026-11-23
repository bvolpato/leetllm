import { decode8, encode8, hexByte } from '../encoding.mjs';
import { settled } from '../timing.mjs';

const original = encode8(1, 'ocp');
const transcoded = encode8(original.value, 'fnuz');

export function drawContract(ctx, scene, state, api) {
  const { C } = api;
  const rawRead = settled(state, 'contract-read', 1);
  const changed = settled(state, 'contract-recode', 2);
  const checked = settled(state, 'contract-verify', 2);
  const received = changed ? transcoded.code : original.code;
  const value = decode8(received, 'fnuz');
  api.text(ctx, 'Byte in memory', 630, 320, 32, C.muted, 'center');
  api.text(ctx, 'Decoded value', 1210, 320, 32, C.muted, 'center');
  api.text(ctx, 'Multiply by 2', 1620, 320, 32, C.muted, 'center');
  for (const [i, code] of [original.code, received].entries()) {
    const y = 465 + 263 * i;
    api.text(ctx, i ? 'FNUZ' : 'OCP', 153, y + 14, 49, i ? C.cyan : C.blue);
    api.focus.target('contract-bytes', () => {
      const digits = code.toString(2).padStart(8, '0');
      for (let k = 0; k < 8; k++) {
        const px = 360 + k * 65;
        api.rect(ctx, px, y - 49, 62, 74, C.panel, k > 0 && k < 5 ? C.yellow : C.muted, 2);
        api.text(ctx, digits[k], px + 31, y, 38, k > 0 && k < 5 ? C.yellow : C.ink, 'center');
      }
      api.text(ctx, hexByte(code), 620, y + 94, 36, i ? C.cyan : C.blue, 'center');
    });
    api.focus.target('contract-decode', () => {
      const known = i === 0 || (changed ? checked : rawRead);
      const exponent = (code >> 3) & 15;
      const bias = i ? 8 : 7;
      const v = i ? value : original.value;
      api.text(ctx, '2^(' + exponent + ' − ' + bias + ')', 1210, y, 44, C.ink, 'center');
      api.text(ctx, known ? '= ' + v : '= ?', 1210, y + 94, 43, i ? C.cyan : C.blue, 'center');
      api.text(ctx, known ? v * 2 : '?', 1620, y + 24, 65, i ? C.cyan : C.blue, 'center');
    });
  }
  api.text(
    ctx,
    checked
      ? 'Both readers now deliver 1 to the multiplier.'
      : changed
        ? 'Read the replacement byte with bias 8.'
        : rawRead
          ? 'One byte, two different products.'
          : 'What does the second multiplier return?',
    960,
    986,
    40,
    C.ink,
    'center',
  );
}
export default {
  id: 'contract',
  draw: drawContract,
  cues: ['contract-field', 'contract-read', 'contract-recode', 'contract-verify'],
};
