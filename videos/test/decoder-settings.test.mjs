import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { assertDecoderSettings, parseDecoderSettings } from '../lib/decoder-settings.mjs';

const encode = (file, ...settings) => {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc2=size=320x180:rate=30:duration=0.5',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    ...settings,
    file,
  ]);
  assert.equal(result.status, 0, String(result.stderr));
};

const join2 = (directory, first, second) => {
  const list = join(directory, 'list.ffconcat'),
    out = join(directory, 'joined.mp4');
  writeFileSync(list, `ffconcat version 1.0\nfile '${first}'\nfile '${second}'\n`);
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    list,
    '-c',
    'copy',
    out,
  ]);
  assert.equal(result.status, 0, String(result.stderr));
  return out;
};

test('a video joined from clips with one set of settings passes', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'decoder-settings-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const [a, b] = [join(directory, 'a.mp4'), join(directory, 'b.mp4')];
  encode(a, '-crf', '20', '-preset', 'fast');
  encode(b, '-crf', '20', '-preset', 'fast');
  const settings = await assertDecoderSettings(join2(directory, a, b));
  assert.equal(settings.get('pic_init_qp_minus26').size, 1);
});

test('a video joined from clips with different settings fails, as it does in QuickTime', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'decoder-settings-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const [a, b] = [join(directory, 'a.mp4'), join(directory, 'b.mp4')];
  // The brand intro and the film scenes differed in this way.
  encode(a, '-crf', '18', '-preset', 'medium');
  encode(b, '-crf', '15', '-preset', 'slow', '-tune', 'animation');
  await assert.rejects(
    assertDecoderSettings(join2(directory, a, b)),
    /decoder settings change inside the file.*max_num_ref_frames/,
  );
});

test('a level above what Apple documents fails', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'decoder-settings-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, 'high-level.mp4');
  encode(file, '-level', '5.0');
  await assert.rejects(assertDecoderSettings(file), /level 5 is above 4\.2/);
});

test('reads settings from a trace_headers log', () => {
  const log =
    '[trace_headers @ 0x1] 56          level_idc                                                00110010 = 50\n[trace_headers @ 0x1] 80    other_field     1 = 1\n';
  assert.deepEqual([...parseDecoderSettings(log).get('level_idc')], [50]);
  assert.equal(parseDecoderSettings(log).has('other_field'), false);
});
