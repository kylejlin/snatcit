export interface RenderConfig {
  ctx: CanvasRenderingContext2D;
  audioCtx: AudioContext;
  frequencyArray: Uint8Array;
  bokumoConfig: /* TODO BokumoConfig */ any;
  currentTimeInMs: number;
  playbackStartTimeInMs: number;
  previousRenderTimeInMs: number;
}
