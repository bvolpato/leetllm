import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { DOMParser } from '@xmldom/xmldom';
import { createCanvas, loadImage, Path2D } from '@napi-rs/canvas';
import { Resvg } from '@resvg/resvg-js';

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/concepts');
const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
const allowedElements = new Set([
  'svg',
  'title',
  'desc',
  'path',
  'rect',
  'circle',
  'line',
  'polyline',
  'polygon',
  'ellipse',
]);
const allowedPathCommands = new Set(['M', 'L', 'C', 'Q', 'Z']);
const paletteColors = new Set(Object.values(manifest.palette).map((color) => color.toUpperCase()));

function descendants(node) {
  const result = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.nodeType !== 1) continue;
    result.push(child, ...descendants(child));
  }
  return result;
}

function parseSvg(source, file) {
  const errors = [];
  let document;
  try {
    document = new DOMParser({
      onError: (level, message) => errors.push(`${level}: ${message}`),
    }).parseFromString(source, 'image/svg+xml');
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  assert.deepEqual(errors, [], `${file} must be valid XML`);
  return document.documentElement;
}

test('concept manifest gives every SVG a stable accessible meaning', async () => {
  assert.equal(manifest.version, 1);
  assert.equal(manifest.viewBox, '0 0 64 64');
  assert.ok(manifest.icons.length > 0);
  const ids = new Set();
  const files = new Set();
  const listed = new Set();

  for (const icon of manifest.icons) {
    assert.match(icon.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!ids.has(icon.id), `duplicate icon ID ${icon.id}`);
    ids.add(icon.id);
    assert.ok(!files.has(icon.file), `duplicate icon file ${icon.file}`);
    files.add(icon.file);
    assert.equal(icon.file, `${icon.id}.svg`);
    assert.ok(icon.title.trim());
    assert.ok(icon.meaning.trim());
    assert.ok(icon.category.trim());

    const source = await readFile(path.join(directory, icon.file), 'utf8');
    for (const color of new Set(source.match(/#[\da-fA-F]{6}/g) ?? [])) {
      assert.ok(
        Object.hasOwn(manifest.paletteVariants.light, color),
        `${icon.file} color ${color} needs a light theme mapping`,
      );
    }
    const root = parseSvg(source, icon.file);
    assert.equal(root.localName, 'svg');
    assert.equal(root.getAttribute('viewBox'), manifest.viewBox);
    assert.equal(root.getAttribute('role'), 'img');
    assert.equal(root.getAttribute('aria-labelledby'), 'title desc');
    assert.equal(root.getAttribute('xmlns'), 'http://www.w3.org/2000/svg');

    const elements = descendants(root);
    const names = new Set();
    for (const element of elements) {
      assert.ok(
        allowedElements.has(element.localName),
        `${icon.file} uses unsupported <${element.localName}>`,
      );
      if (['title', 'desc'].includes(element.localName)) continue;
      const part = element.getAttribute('data-part');
      assert.match(
        part,
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        `${icon.file} element lacks a named animation part`,
      );
      assert.ok(!names.has(part), `${icon.file} repeats data-part="${part}"`);
      names.add(part);

      for (const attribute of ['fill', 'stroke']) {
        const color = element.getAttribute(attribute);
        assert.ok(
          !color || color === 'none' || paletteColors.has(color.toUpperCase()),
          `${icon.file} uses non-palette ${attribute}=${color}`,
        );
      }
      assert.equal(
        element.hasAttribute('transform'),
        false,
        `${icon.file} must keep coordinates directly addressable`,
      );
      assert.equal(
        element.hasAttribute('href'),
        false,
        `${icon.file} must not load external assets`,
      );
      assert.equal(
        element.hasAttribute('style'),
        false,
        `${icon.file} should keep colors explicit`,
      );
      if (element.getAttribute('stroke') && element.getAttribute('stroke') !== 'none') {
        assert.equal(
          element.getAttribute('stroke-linecap'),
          'round',
          `${icon.file} should use rounded stroke caps`,
        );
        assert.equal(
          element.getAttribute('stroke-linejoin'),
          'round',
          `${icon.file} should use rounded stroke joins`,
        );
      }

      if (element.localName === 'path') {
        const normalized = new Path2D(element.getAttribute('d')).toSVGString();
        const commands = normalized.match(/[A-Za-z]/g) ?? [];
        assert.ok(
          commands.every((command) => allowedPathCommands.has(command)),
          `${icon.file} path has unsupported commands ${commands.join('')}`,
        );
        if (element.getAttribute('fill') !== 'none') {
          assert.equal(
            commands.filter((command) => command === 'M').length,
            1,
            `${icon.file} filled paths must contain one contour`,
          );
          assert.equal(
            commands.filter((command) => command === 'Z').length,
            1,
            `${icon.file} filled paths must close explicitly`,
          );
        }
      }
    }
    assert.equal(
      elements.find((element) => element.localName === 'title')?.textContent.trim(),
      icon.title,
      `${icon.file} title should match the catalog`,
    );
    assert.ok(
      elements.find((element) => element.localName === 'desc')?.textContent.trim(),
      `${icon.file} needs a description`,
    );
    listed.add(icon.file);
  }

  const actual = new Set((await readdir(directory)).filter((file) => file.endsWith('.svg')));
  assert.deepEqual(actual, listed, 'each SVG asset should have one manifest entry');
});

test('palette variants cover each canonical color and keep light strokes legible', () => {
  assert.deepEqual(Object.keys(manifest.paletteVariants).sort(), ['dark', 'light']);
  const light = manifest.paletteVariants.light;
  const dark = manifest.paletteVariants.dark;
  for (const color of paletteColors) {
    assert.match(light[color], /^#[0-9A-F]{6}$/);
    assert.equal(dark[color], color);
  }
  const luminance = (color) => {
    const channels = color
      .slice(1)
      .match(/../g)
      .map((hex) => Number.parseInt(hex, 16) / 255)
      .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  for (const [name, source] of Object.entries(manifest.palette)) {
    if (name === 'background' || name === 'panel') continue;
    assert.ok(
      1.05 / (luminance(light[source]) + 0.05) >= 3,
      `${name} needs visible contrast against white`,
    );
  }
});

test('every symbol rasterizes with visible padding inside its transparent canvas', async () => {
  for (const icon of manifest.icons) {
    const source = await readFile(path.join(directory, icon.file), 'utf8');
    const png = new Resvg(source, { fitTo: { mode: 'width', value: 256 } }).render().asPng();
    const image = await loadImage(png);
    const canvas = createCanvas(256, 256);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, 256, 256).data;
    let left = 256,
      top = 256,
      right = -1,
      bottom = -1;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        if (pixels[(y * 256 + x) * 4 + 3] < 4) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    assert.ok(right >= left && bottom >= top, `${icon.id} should render visible geometry`);
    assert.ok(
      left >= 4 && top >= 4 && right <= 251 && bottom <= 251,
      `${icon.id} drawing should keep one viewBox unit of padding: ${left},${top}–${right},${bottom}`,
    );
  }
});
