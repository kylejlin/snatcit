import { LabeledFieldValue, SnatcitConfig } from "../config";
import Fft from "fft.js";

export function renderSpectrogramAndMarkings(
  ctx: CanvasRenderingContext2D,
  audioBuffer: AudioBuffer,
  computedValues: readonly LabeledFieldValue[],
  snatcitConfig: SnatcitConfig
): void {
  const { width: canvasWidth, height: canvasHeight } = ctx.canvas;
  ctx.fillStyle = rgbTupleToCssFillStyle(
    snatcitConfig.spectrogram.backgroundColor
  );
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function rgbTupleToCssFillStyle([r, g, b]: readonly [
  number,
  number,
  number
]): string {
  return `rgb(${r}, ${g}, ${b})`;
}
