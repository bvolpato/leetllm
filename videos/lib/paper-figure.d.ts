import type { ColorInput, ImageAsset, ImageCrop, Node, TextNode } from 'vizmatic/stage';

export interface PaperSource {
  readonly title: string;
  readonly authors: readonly string[];
  readonly year: number;
  readonly url: string;
  readonly version: string;
  readonly locator: string;
  readonly page?: number;
  readonly sha256?: string;
  readonly license?: Readonly<Record<string, unknown>>;
}

export interface PaperHighlight {
  readonly id: string;
  /** Intrinsic pixels in the prepared derivative, not points in the source PDF. */
  readonly region: ImageCrop;
  readonly color?: ColorInput;
}

export interface PaperFigureOptions {
  readonly source: PaperSource;
  readonly caption?: string;
  /** Maximum component width and height in Stage pixels. */
  readonly width?: number;
  readonly height?: number;
  readonly padding?: number;
  /** Highlights begin hidden so the scene can reveal them on a cue with fadeIn. */
  readonly highlights?: readonly PaperHighlight[];
}

export interface PaperFigureLayout {
  readonly width: number;
  readonly height: number;
  readonly image: Readonly<{ x: number; y: number; width: number; height: number }>;
}

export class PaperFigure extends Node {
  constructor(asset: ImageAsset, options: PaperFigureOptions);
  readonly paper: Node;
  readonly figure: Node;
  readonly caption: TextNode | null;
  readonly citation: TextNode;
  readonly highlights: Readonly<Record<string, Node>>;
  readonly layout: PaperFigureLayout;
}

export function paperFigure(asset: ImageAsset, options: PaperFigureOptions): PaperFigure;
