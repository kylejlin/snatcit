import { RenderConfig, rgbaTupleToCssFillStyle } from "./calculationUtils";
import { hackToCircumventWeirdChromeBug__clearCanvasOfMysteriousCurse } from "./utilsWithSideEffects";

export function renderPlayedSegmentOverlayIfPossible(
  renderConfig: RenderConfig
): void {
  const {
    ctx,
    audioBuffer,
    snatcitConfig,
    playedSegmentInMs: playedSegment,
  } = renderConfig;
  if (playedSegment === undefined) {
    return;
  }

  const { width: canvasWidth, height: canvasHeight } = ctx.canvas;
  const audioBufferDurationInMs = audioBuffer.duration * 1e3;
  const unclampedStartFactor = playedSegment[0] / audioBufferDurationInMs;
  const clampedStartFactor = Math.max(0, Math.min(unclampedStartFactor, 1));
  const startX = Math.min(canvasWidth, clampedStartFactor * canvasWidth);

  const unclampedWidthFactor =
    (playedSegment[1] - playedSegment[0]) / audioBufferDurationInMs;
  const clampedWidthFactor = Math.max(0, Math.min(unclampedWidthFactor, 1));
  const width = Math.floor(clampedWidthFactor * canvasWidth);

  const { playedSegmentColor } = snatcitConfig;

  hackToCircumventWeirdChromeBug__clearCanvasOfMysteriousCurse(ctx);

  ctx.fillStyle = rgbaTupleToCssFillStyle(playedSegmentColor);
  ctx.fillRect(startX, 0, width, canvasHeight);
}
