import type { SKRSContext2D } from '@napi-rs/canvas';
import type { FilmOptions, Stage } from 'vizmatic/stage';

export interface VisualCue {
  readonly id: string;
  readonly phrase: string;
  readonly targets: readonly string[];
  readonly color?: string;
  readonly linger?: number;
}

export interface NarrationBeat {
  readonly say: string;
  readonly hold?: number;
  readonly hold_sound?: string;
  readonly visual_cues?: readonly VisualCue[];
}

export interface NarrationScene {
  readonly id: string;
  readonly title: string;
  readonly visual: string;
  readonly beats: readonly NarrationBeat[];
}

export interface LessonNarration {
  readonly id: string;
  readonly title: string;
  readonly scenes: readonly NarrationScene[];
}

export interface SampledCue extends VisualCue {
  readonly phase: 'before' | 'during' | 'after';
  readonly progress: number;
  readonly active?: boolean;
  readonly strength?: number;
}

export interface CueState {
  readonly cues?: Readonly<Record<string, SampledCue>>;
}

export interface FrameState extends CueState {
  readonly t: number;
  readonly duration: number;
  readonly beat: number;
  readonly beatP: number;
  /** Seconds since speech ended in the current beat. Negative during narration. */
  readonly holdTime?: number;
  readonly opacity?: number;
  readonly p?: number;
  readonly sceneIndex?: number;
  readonly sceneCount?: number;
  readonly width?: number;
  readonly height?: number;
  readonly cueTiming?: string;
}

export type LessonPainterApi = ReturnType<typeof import('./scene.mjs').createLessonPainter>['api'];

export type CanvasDraw = (
  ctx: SKRSContext2D,
  scene: NarrationScene,
  state: FrameState,
  api: LessonPainterApi,
) => unknown;

export interface CanvasSceneDefinition {
  readonly id: string;
  /** Optional explicit references checked against the scene's narration. */
  readonly cues?: readonly string[];
  readonly draw: CanvasDraw;
}

export interface CanvasLessonOptions {
  readonly id: string;
  readonly scenes: readonly CanvasSceneDefinition[];
  readonly validateModel?: () => unknown;
}

export interface CanvasLessonDefinition extends CanvasLessonOptions {
  readonly kind: 'leetllm.canvas-lesson';
  readonly draw: CanvasDraw;
  validate(narration: LessonNarration): void;
}

export interface BeatClock {
  readonly start: number;
  readonly end: number;
  readonly until: number;
  readonly duration: number;
}

export interface TimedCue extends VisualCue {
  readonly start: number;
  readonly end: number;
  readonly span: number;
}

/** Structural type of the existing stage-lesson.mjs SceneClock. */
export interface SceneClock {
  readonly stage: Stage;
  readonly id: string;
  readonly start: number;
  readonly end: number;
  readonly duration: number;
  readonly beats: readonly BeatClock[];
  beat(index: number): BeatClock;
  cue(id: string): TimedCue;
  span(id: string): number;
  on(id: string, build: () => void, offset?: number): this;
  after(id: string, build: () => void, offset?: number): this;
  onBeat(index: number, build: () => void, offset?: number): this;
  at(seconds: number, build: () => void): this;
}

export interface StageSceneDefinition {
  readonly id: string;
  readonly cues?: readonly string[];
  build(stage: Stage, clock: SceneClock, scene: NarrationScene): void | Promise<void>;
}

export interface StageLessonOptions {
  readonly id: string;
  readonly scenes: readonly StageSceneDefinition[];
  readonly options?: FilmOptions;
}

export interface NarrationClock {
  readonly lesson: LessonNarration;
  scene(id: string): SceneClock;
}

export interface StageLessonDefinition extends StageLessonOptions {
  readonly kind: 'leetllm.stage-lesson';
  readonly options: FilmOptions;
  build(stage: Stage, narration: NarrationClock): Promise<void>;
  validate(narration: LessonNarration): void;
}

export function defineCanvasLesson(options: CanvasLessonOptions): CanvasLessonDefinition;
export function defineStageLesson(options: StageLessonOptions): StageLessonDefinition;
export function operationProgress(state: CueState, cueId: string): number;
export function resultAfter(state: CueState, cueId: string): boolean;
