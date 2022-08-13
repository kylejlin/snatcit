import { LabeledFieldValue, SnatcitConfig } from "../config";
import Fft from "fft.js";
import {
  rgbTupleToCssFillStyle,
  getSpectrumData,
  SpectrumData,
  getColorMap,
  lazySliceAudioBuffer,
  copyChannelAverageInto,
  writeColor,
} from "./calculationUtils";

/**
 * I'm not sure what the maximum magnitude is, since
 * I don't understand FFT.
 * As a arbitrary guess, I'm going to assume the real component
 * is on [-1, 1], and the imaginary component is also on [-1, 1],
 * which would make the maximum magnitude be the square root of 2.
 */
const MAX_MAGNITUDE = Math.SQRT2;

export interface RenderConfig {
  ctx: CanvasRenderingContext2D;
  audioCtx: AudioContext;
  audioBuffer: AudioBuffer;
  snatcitConfig: SnatcitConfig;
}

export function renderSpectrogramAndMarkings(
  renderConfig: RenderConfig,
  computedValues: readonly LabeledFieldValue[]
): void {
  renderSpectrogram(renderConfig);
  renderMarkings(renderConfig, computedValues);
}

export function renderSpectrogram(renderConfig: RenderConfig): void {
  renderBackground(renderConfig);
  renderSpectraIfPossible(renderConfig);
}

function renderBackground(renderConfig: RenderConfig): void {
  const { ctx, snatcitConfig } = renderConfig;
  const { width: canvasWidth, height: canvasHeight } = ctx.canvas;
  ctx.fillStyle = rgbTupleToCssFillStyle(
    snatcitConfig.spectrogram.backgroundColor
  );
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function renderSpectraIfPossible(renderConfig: RenderConfig): void {
  const spectrumData = getSpectrumData(renderConfig);
  if (spectrumData.fftBinsPerSpectrumBin > 0) {
    renderSpectra(renderConfig, spectrumData);
  }
}

function renderSpectra(
  renderConfig: RenderConfig,
  { fftInputLength, fftBinsPerSpectrumBin, spectrumBins }: SpectrumData
): void {
  const { ctx, audioBuffer, snatcitConfig } = renderConfig;
  const { width: canvasWidth } = ctx.canvas;
  const imgDataData = new Uint8ClampedArray(4 * spectrumBins);
  const imgData = new ImageData(imgDataData, 1, spectrumBins);
  const colorMap = getColorMap(snatcitConfig.spectrogram.colorScale);

  const songLengthInMs = (audioBuffer.length / audioBuffer.sampleRate) * 1e3;
  const numberOfFullSpectra =
    1 +
    Math.floor(
      (songLengthInMs - snatcitConfig.spectrogram.windowSizeInMs) /
        snatcitConfig.spectrogram.stepSizeInMs
    );
  const spectrumCanvasWidth = Math.floor(canvasWidth / numberOfFullSpectra);

  const windowSizeInFrames = Math.floor(
    snatcitConfig.spectrogram.windowSizeInMs * 1e-3 * audioBuffer.sampleRate
  );
  const stepSizeInFrames = Math.floor(
    snatcitConfig.spectrogram.stepSizeInMs * 1e-3 * audioBuffer.sampleRate
  );

  for (let i = 0; i < numberOfFullSpectra; ++i) {
    const windowStartInFrames = i * stepSizeInFrames;
    const windowCanvasLeft = i * spectrumCanvasWidth;

    const slice = lazySliceAudioBuffer(
      audioBuffer,
      windowStartInFrames,
      Math.min(windowStartInFrames + windowSizeInFrames, audioBuffer.length)
    );
    const input = new Float32Array(fftInputLength);
    copyChannelAverageInto(slice, input);

    const f = new Fft(fftInputLength);
    const out = f.createComplexArray();
    f.realTransform(out, input);
    f.completeSpectrum(out);

    imgDataData.fill(0);

    for (let i = 0; i < spectrumBins; ++i) {
      const currentFftBinStart = i * 2 * fftBinsPerSpectrumBin;
      let totalMagnitude = 0;
      for (let j = 0; j < 2 * fftBinsPerSpectrumBin; j += 2) {
        const re = out[currentFftBinStart + j];
        const im = out[currentFftBinStart + j + 1];
        totalMagnitude += Math.hypot(re, im);
      }
      const averageMagnitude = totalMagnitude / fftBinsPerSpectrumBin;
      writeColor({
        out: imgDataData,
        unitMagnitude: Math.max(
          0,
          Math.min(averageMagnitude / MAX_MAGNITUDE, 1)
        ),
        index: 4 * (spectrumBins - i - 1),
        colorMap,
      });
    }

    for (let i = 0; i < spectrumCanvasWidth; ++i) {
      ctx.putImageData(imgData, windowCanvasLeft + i, 0);
    }
  }
}

export function renderMarkings(
  renderConfig: RenderConfig,
  computedValues: readonly LabeledFieldValue[]
): void {
  // TODO
}
