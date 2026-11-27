// A joined video must keep one set of H.264 decoder settings. MP4 stores one set at the start of
// the file. VLC and FFmpeg adapt when a later clip changes them, but QuickTime and Quick Look stop
// decoding, so an FFmpeg decode alone cannot find this problem.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const FIELDS = new Set([
  'profile_idc',
  'level_idc',
  'max_num_ref_frames',
  'max_dec_frame_buffering',
  'max_num_reorder_frames',
  'log2_max_frame_num_minus4',
  'log2_max_pic_order_cnt_lsb_minus4',
  'time_scale',
  'num_units_in_tick',
  'entropy_coding_mode_flag',
  'weighted_pred_flag',
  'weighted_bipred_idc',
  'pic_init_qp_minus26',
  'transform_8x8_mode_flag',
]);
const ROW = /\]\s+\d+\s+(\w+)\s+[01]+\s*=\s*(-?\d+)/;

/** Apple documents level 4.2 for H.264 at 1080p60. */
export const MAX_LEVEL = 42;

/** Each decoder setting in an FFmpeg trace_headers log, with every value it takes. */
export function parseDecoderSettings(log) {
  const settings = new Map();
  for (const row of log.split('\n')) {
    const match = row.match(ROW);
    if (!match || !FIELDS.has(match[1])) continue;
    if (!settings.has(match[1])) settings.set(match[1], new Set());
    settings.get(match[1]).add(Number(match[2]));
  }
  return settings;
}

function readTraceSettings(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'ffmpeg',
      [
        '-hide_banner',
        '-i',
        file,
        '-map',
        '0:v:0',
        '-c',
        'copy',
        '-bsf:v',
        'trace_headers',
        '-f',
        'null',
        '-',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    const settings = new Map();
    const lines = createInterface({ input: child.stderr, crlfDelay: Infinity });
    lines.on('line', (row) => {
      if (!row.includes('=')) return;
      const match = row.match(ROW);
      if (!match || !FIELDS.has(match[1])) return;
      let values = settings.get(match[1]);
      if (!values) {
        values = new Set();
        settings.set(match[1], values);
      }
      values.add(Number(match[2]));
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(settings)
        : reject(new Error(`ffmpeg exited with ${code} while reading ${file}`)),
    );
  });
}

/** Throw if a video changes its decoder settings, or uses a level that Apple does not document. */
export async function assertDecoderSettings(file, { maxLevel = MAX_LEVEL } = {}) {
  const settings = await readTraceSettings(file);
  if (!settings.has('level_idc')) throw new Error(`${file}: no H.264 decoder settings found`);
  const changing = [...settings]
    .filter(([, values]) => values.size > 1)
    .map(([name, values]) => `${name} (${[...values].join(', ')})`);
  if (changing.length)
    throw new Error(
      `${file}: decoder settings change inside the file, so QuickTime cannot play it: ${changing.join('; ')}. Encode every joined clip with the same settings.`,
    );
  const [level] = settings.get('level_idc');
  if (level > maxLevel)
    throw new Error(`${file}: H.264 level ${level / 10} is above ${maxLevel / 10}`);
  return settings;
}
