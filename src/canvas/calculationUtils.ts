import { SnatcitConfig } from "../config";
import { roundUpToPowerOf2 } from "../misc";

export interface RenderConfig {
  fileIndex: number;
  ctx: CanvasRenderingContext2D;
  audioCtx: AudioContext;
  audioBuffer: AudioBuffer;
  snatcitConfig: SnatcitConfig;
  playedSegmentInMs: undefined | readonly [number, number];
}

export interface SpectrumFftData {
  readonly fftInputLength: number;
  readonly fractionalFftBinsPerSpectrumBin: number;
  readonly spectrumBins: number;
}

export function getSpectrumFftData({
  canvasWidth,
  audioBuffer,
  snatcitConfig,
}: {
  readonly canvasWidth: number;
  readonly audioBuffer: AudioBuffer;
  readonly snatcitConfig: SnatcitConfig;
}): SpectrumFftData {
  const { windowSizeInFractionalFrames } = getSpectrogramRenderData({
    canvasWidth,
    audioBuffer,
    snatcitConfig,
  });
  /** We can't use the window size as-is, because FFT requires a power of 2. */
  const fftInputLength = roundUpToPowerOf2(windowSizeInFractionalFrames);
  const hzPerFftBin = audioBuffer.sampleRate / fftInputLength;
  const fractionalFftBinsPerSpectrumBin =
    snatcitConfig.spectrogram.idealBinSizeInHz / hzPerFftBin;
  const maxFrequencyInHz = Math.min(
    audioBuffer.sampleRate,
    snatcitConfig.spectrogram.idealMaxFrequencyInHz
  );
  const maxFftBins = Math.min(
    fftInputLength,
    Math.floor(maxFrequencyInHz / hzPerFftBin)
  );
  const spectrumBins = Math.floor(maxFftBins / fractionalFftBinsPerSpectrumBin);
  return { fftInputLength, fractionalFftBinsPerSpectrumBin, spectrumBins };
}

export interface SpectrogramRenderData {
  readonly numberOfFullSpectra: number;
  readonly stepSizeInFractionalFrames: number;
  readonly windowSizeInFractionalFrames: number;
  readonly spectrumCanvasFractionalWidth: number;
  readonly spectrumCanvasCeiledWidth: number;
}

export function getSpectrogramRenderData({
  canvasWidth,
  audioBuffer,
  snatcitConfig,
}: {
  readonly canvasWidth: number;
  readonly audioBuffer: AudioBuffer;
  readonly snatcitConfig: SnatcitConfig;
}): SpectrogramRenderData {
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

  return {
    numberOfFullSpectra,
    stepSizeInFractionalFrames,
    windowSizeInFractionalFrames,
    spectrumCanvasFractionalWidth,
    spectrumCanvasCeiledWidth,
  };
}

export interface LazyAudioBufferSlice {
  readonly buffer: AudioBuffer;
  readonly startInFrames: number;
  readonly exclEndInFrames: number;
}

export function lazySliceAudioBuffer(
  audioBuffer: AudioBuffer,
  startInFrames: number,
  exclEndInFrames: number
): LazyAudioBufferSlice {
  if (exclEndInFrames > audioBuffer.length) {
    throw new Error("exclEndInFrames > audioBuffer.length");
  }
  return {
    buffer: audioBuffer,
    startInFrames,
    exclEndInFrames,
  };
}

export function copyChannelAverageInto(
  slice: LazyAudioBufferSlice,
  input: Float32Array
): void {
  const { buffer, startInFrames, exclEndInFrames } = slice;
  for (let frame = startInFrames; frame < exclEndInFrames; ++frame) {
    input[frame - startInFrames] = 0;
  }
  for (
    let channelIndex = 0;
    channelIndex < buffer.numberOfChannels;
    ++channelIndex
  ) {
    const channelData = buffer.getChannelData(channelIndex);
    for (let frame = startInFrames; frame < exclEndInFrames; ++frame) {
      input[frame - startInFrames] += channelData[frame];
    }
  }
  for (let frame = startInFrames; frame < exclEndInFrames; ++frame) {
    input[frame - startInFrames] /= buffer.numberOfChannels;
  }
}

export function rgbTupleToCssFillStyle([r, g, b]: RgbTuple): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgbaTupleToCssFillStyle([r, g, b, a]: RgbaTuple): string {
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

type ColorMap = {
  readonly [u8: number]: RgbTuple;
};

export function getColorMap(
  colorScale: SnatcitConfig["spectrogram"]["colorScale"]
): ColorMap {
  const mutMap: { [mutU8: number]: RgbTuple } = {};
  const colorPointStack = colorScale.slice().reverse();

  let top = colorPointStack.pop();
  if (top === undefined) {
    return getUniformColorMap([255, 0, 0]);
  }
  let beneathTop = colorPointStack.pop();
  if (beneathTop === undefined) {
    return getUniformColorMap(top[1]);
  }

  for (let i = 0; i < 256; ++i) {
    while (i > beneathTop[0] && colorPointStack.length > 0) {
      top = beneathTop;
      beneathTop = colorPointStack.pop()!;
    }

    mutMap[i] = clampedLerpRgb({
      start: top[1],
      end: beneathTop[1],
      factor: (i / 255 - top[0]) / (beneathTop[0] - top[0]),
    });
  }

  return mutMap;
}

export type RgbTuple = readonly [number, number, number];
export type RgbaTuple = readonly [number, number, number, number];

export function getUniformColorMap(color: RgbTuple): ColorMap {
  const mutMap: { [mutU8: number]: RgbTuple } = {};
  for (let i = 0; i < 256; ++i) {
    mutMap[i] = color;
  }
  return mutMap;
}

export function clampedLerpRgb({
  start: [r1, g1, b1],
  end: [r2, g2, b2],
  factor: unclampedFactor,
}: {
  start: RgbTuple;
  end: RgbTuple;
  factor: number;
}): RgbTuple {
  const clampedFactor = Math.max(0, Math.min(unclampedFactor, 1));
  return [
    Math.floor(r1 + (r2 - r1) * clampedFactor),
    Math.floor(g1 + (g2 - g1) * clampedFactor),
    Math.floor(b1 + (b2 - b1) * clampedFactor),
  ];
}

export function writeColor({
  out,
  unitMagnitude,
  index,
  colorMap,
}: {
  out: Uint8ClampedArray;
  /** Must be between zero and one, inclusive. */
  unitMagnitude: number;
  index: number;
  colorMap: ColorMap;
}): void {
  const color = colorMap[Math.floor(unitMagnitude * 255.999_999_999_999)];
  out[index] = color[0];
  out[index + 1] = color[1];
  out[index + 2] = color[2];
  out[index + 3] = 255;
}
