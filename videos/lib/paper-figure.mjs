// @ts-check
import { Node, image, rect, text } from 'vizmatic/stage';

/** @param {unknown} value @param {string} name */
function nonempty(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Paper ${name} must be a nonempty string`);
  }
  return value;
}

/** @param {number} value @param {string} name */
function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`Paper ${name} must be positive and finite`);
  }
  return value;
}

/** @param {import('./paper-figure.d.ts').PaperSource} source */
function sourceCredit(source) {
  if (!source || !Array.isArray(source.authors) || !source.authors.length) {
    throw new TypeError('Paper source needs at least one author');
  }
  const authors = source.authors.map((author) => nonempty(author, 'author'));
  if (!Number.isInteger(source.year) || source.year < 1400 || source.year > 9999) {
    throw new TypeError('Paper source year must be a four-digit integer');
  }
  const title = nonempty(source.title, 'title');
  const locator = nonempty(source.locator, 'locator');
  nonempty(source.url, 'URL');
  const version = nonempty(source.version, 'version');
  const author =
    authors.length === 1
      ? authors[0]
      : authors.length === 2
        ? `${authors[0]} & ${authors[1]}`
        : `${authors[0]} et al.`;
  const lines = [`${author} (${source.year}) · ${title}`, `${locator} · ${version}`];
  if (source.license?.id === 'CC-BY-4.0') {
    lines.push('Cropped source · CC BY 4.0');
  } else if (source.license?.id === 'CC-BY-SA-4.0') {
    lines.push('Cropped source · CC BY-SA 4.0');
  }
  return lines.join('\n');
}

/**
 * An actual prepared paper image with separate vector explanation and attribution.
 * Load and verify the image before compiling. This constructor does no I/O.
 *
 * Tight offline crops preserve the source's typography and colors. The white mat
 * stays white in both themes. Highlights use intrinsic crop pixels and begin
 * hidden; the author reveals them on the appropriate narration cue.
 */
export class PaperFigure extends Node {
  /**
   * @param {import('vizmatic/stage').ImageAsset} asset
   * @param {import('./paper-figure.d.ts').PaperFigureOptions} options
   */
  constructor(
    asset,
    { source, caption, width = 1440, height = 880, padding = 24, highlights = [] },
  ) {
    super();
    positive(width, 'width');
    positive(height, 'height');
    positive(padding, 'padding');
    const credit = sourceCredit(source);
    const availableWidth = width - padding * 2;
    if (availableWidth <= 0) throw new RangeError('Paper padding leaves no image width');

    /** @type {import('vizmatic/stage').TextNode | null} */
    this.caption =
      caption === undefined
        ? null
        : text(nonempty(caption, 'caption'), {
            size: 30,
            color: 'ink',
            maxWidth: availableWidth,
            align: 'center',
          });
    this.citation = text(credit, {
      size: 22,
      color: 'dim',
      maxWidth: availableWidth,
      align: 'center',
    });
    this.citation.label = `paper citation: ${source.locator}`;
    if (this.caption) this.caption.label = 'paper explanation';
    const gap = 18;
    const textHeight = this.citation.height + gap + (this.caption ? this.caption.height + gap : 0);
    const availableHeight = height - padding * 2 - textHeight;
    if (
      availableHeight <= 0 ||
      this.citation.width > availableWidth + 0.1 ||
      (this.caption && this.caption.width > availableWidth + 0.1)
    ) {
      throw new RangeError('Paper caption and citation do not fit; use a wider or taller framing');
    }

    this.figure = image(asset, {
      width: availableWidth,
      height: availableHeight,
      fit: 'contain',
    });
    const imageWidth = this.figure.width;
    const imageHeight = this.figure.height;
    const matWidth = imageWidth + padding * 2;
    const matHeight = imageHeight + padding * 2;
    const totalHeight = matHeight + textHeight;
    const imageY = -totalHeight / 2 + matHeight / 2;
    this.figure.moveTo([0, imageY]);
    this.figure.label = `paper image: ${source.locator}`;
    this.paper = rect(matWidth, matHeight, { fill: '#ffffff', stroke: null }).at(0, imageY);
    this.paper.label = 'paper mat';
    this.add(this.paper, this.figure);

    /** @type {Record<string, Node>} */
    const made = Object.create(null);
    for (const highlight of highlights) {
      if (
        typeof highlight.id !== 'string' ||
        !/^[a-z][a-z0-9-]*$/.test(highlight.id) ||
        Object.hasOwn(made, highlight.id)
      ) {
        throw new TypeError('Paper highlight IDs must be unique lowercase slugs');
      }
      const region = highlight.region;
      if (
        !region ||
        ![region.x, region.y, region.width, region.height].every(Number.isFinite) ||
        region.x < 0 ||
        region.y < 0 ||
        region.width <= 0 ||
        region.height <= 0 ||
        region.x + region.width > asset.width ||
        region.y + region.height > asset.height
      ) {
        throw new RangeError(`Paper highlight ${highlight.id} extends beyond the prepared image`);
      }
      const scale = imageWidth / asset.width;
      const box = rect(region.width * scale, region.height * scale, {
        fill: null,
        stroke: highlight.color ?? '#b36a00',
        width: 4,
      })
        .at(
          -imageWidth / 2 + (region.x + region.width / 2) * scale,
          imageY - imageHeight / 2 + (region.y + region.height / 2) * scale,
        )
        .hide();
      box.label = `paper highlight: ${highlight.id}`;
      made[highlight.id] = box;
      this.add(box);
    }
    this.highlights = Object.freeze(made);

    let top = imageY + matHeight / 2 + gap;
    if (this.caption) {
      this.caption.moveTo([0, top + this.caption.height / 2]);
      top += this.caption.height + gap;
      this.add(this.caption);
    }
    this.citation.moveTo([0, top + this.citation.height / 2]);
    this.add(this.citation);
    this.label = `paper figure: ${source.locator}`;
    this.data.paperSource = Object.freeze({
      ...source,
      authors: Object.freeze([...source.authors]),
    });
    this.layout = Object.freeze({
      width: Math.max(matWidth, this.citation.width, this.caption?.width ?? 0),
      height: totalHeight,
      image: Object.freeze({
        x: -imageWidth / 2,
        y: imageY - imageHeight / 2,
        width: imageWidth,
        height: imageHeight,
      }),
    });
  }
}

/**
 * @param {import('vizmatic/stage').ImageAsset} asset
 * @param {import('./paper-figure.d.ts').PaperFigureOptions} options
 */
export function paperFigure(asset, options) {
  return new PaperFigure(asset, options);
}
