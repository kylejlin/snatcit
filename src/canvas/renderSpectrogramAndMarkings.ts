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
  fileIndex: number;
  ctx: CanvasRenderingContext2D;
  audioCtx: AudioContext;
  audioBuffer: AudioBuffer;
  snatcitConfig: SnatcitConfig;
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
  const idealNumberOfFractionalSpectra =
    1 +
    (songLengthInMs - snatcitConfig.spectrogram.idealWindowSizeInMs) /
      snatcitConfig.spectrogram.idealStepSizeInMs;
  const numberOfFractionalSpectra = Math.min(
    idealNumberOfFractionalSpectra,
    canvasWidth
  );
  const spectrumCanvasFractionalWidth =
    canvasWidth / Math.ceil(numberOfFractionalSpectra);
  const spectrumCanvasCeiledWidth = Math.ceil(spectrumCanvasFractionalWidth);

  const windowSizeInFractionalFrames =
    snatcitConfig.spectrogram.idealWindowSizeInMs *
    1e-3 *
    audioBuffer.sampleRate;
  const idealStepSizeInFractionalFrames =
    snatcitConfig.spectrogram.idealStepSizeInMs * 1e-3 * audioBuffer.sampleRate;
  const minStepSizeInFractionalFrames =
    (audioBuffer.length - windowSizeInFractionalFrames) /
    (numberOfFractionalSpectra - 1);
  const stepSizeInFractionalFrames = Math.max(
    idealStepSizeInFractionalFrames,
    minStepSizeInFractionalFrames
  );
  const numberOfFullSpectra = Math.floor(numberOfFractionalSpectra);

  for (let i = 0; i < numberOfFullSpectra; ++i) {
    const windowStartInFractionalFrames = i * stepSizeInFractionalFrames;

    const slice = lazySliceAudioBuffer(
      audioBuffer,
      Math.floor(windowStartInFractionalFrames),
      Math.min(
        Math.floor(
          windowStartInFractionalFrames + windowSizeInFractionalFrames
        ),
        audioBuffer.length,
        Math.floor(windowStartInFractionalFrames) + fftInputLength
      )
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

    const windowCanvasLeft = Math.floor(i * spectrumCanvasFractionalWidth);
    for (let i = 0; i < spectrumCanvasCeiledWidth; ++i) {
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
