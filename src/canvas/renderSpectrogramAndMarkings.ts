import { LabeledFieldValue, SnatcitConfig } from "../config";
import Fft from "fft.js";
import { roundUpToPowerOf2 } from "../misc";

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
  computedValues: readonly LabeledFieldValue[];
  snatcitConfig: SnatcitConfig;
}

export function renderSpectrogramAndMarkings(renderConfig: RenderConfig): void {
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
  const { audioBuffer, snatcitConfig } = renderConfig;
  const windowSizeInFrames = Math.floor(
    snatcitConfig.spectrogram.windowSizeInMs * 1e-3 * audioBuffer.sampleRate
  );

  /** We can't use the window size as-is, because FFT requires a power of 2. */
  const inputLength = roundUpToPowerOf2(windowSizeInFrames);
  const spectrumData = getSpectrumData(renderConfig, inputLength);
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

export interface SpectrumData {
  readonly fftInputLength: number;
  readonly fftBinsPerSpectrumBin: number;
  readonly spectrumBins: number;
}

export function getSpectrumData(
  {
    audioBuffer,
    snatcitConfig,
  }: {
    readonly audioBuffer: AudioBuffer;
    readonly snatcitConfig: SnatcitConfig;
  },
  fftInputLength: number
): SpectrumData {
  const hzPerFftBin = audioBuffer.sampleRate / fftInputLength;
  const fftBinsPerSpectrumBin = Math.floor(
    snatcitConfig.spectrogram.idealBinSizeInHz / hzPerFftBin
  );
  const maxFrequencyInHz = Math.min(
    audioBuffer.sampleRate,
    snatcitConfig.spectrogram.idealMaxFrequencyInHz
  );
  const maxFftBins = Math.min(
    fftInputLength,
    Math.floor(maxFrequencyInHz / hzPerFftBin)
  );
  const spectrumBins = Math.floor(maxFftBins / fftBinsPerSpectrumBin);
  return { fftInputLength, fftBinsPerSpectrumBin, spectrumBins };
}

interface LazyAudioBufferSlice {
  readonly buffer: AudioBuffer;
  readonly startInFrames: number;
  readonly exclEndInFrames: number;
}

function lazySliceAudioBuffer(
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

function copyChannelAverageInto(
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

function rgbTupleToCssFillStyle([r, g, b]: readonly [
  number,
  number,
  number
]): string {
  return `rgb(${r}, ${g}, ${b})`;
}

type ColorMap = {
  readonly [u8: number]: readonly [number, number, number];
};

function getColorMap(
  colorScale: SnatcitConfig["spectrogram"]["colorScale"]
): ColorMap {
  const mutMap: { [mutU8: number]: [number, number, number] } = {};
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

function getUniformColorMap(
  color: readonly [number, number, number]
): ColorMap {
  const mutMap: { [mutU8: number]: readonly [number, number, number] } = {};
  for (let i = 0; i < 256; ++i) {
    mutMap[i] = color;
  }
  return mutMap;
}

function clampedLerpRgb({
  start: [r1, g1, b1],
  end: [r2, g2, b2],
  factor: unclampedFactor,
}: {
  start: readonly [number, number, number];
  end: readonly [number, number, number];
  factor: number;
}): [number, number, number] {
  const clampedFactor = Math.max(0, Math.min(unclampedFactor, 1));
  return [
    Math.floor(r1 + (r2 - r1) * clampedFactor),
    Math.floor(g1 + (g2 - g1) * clampedFactor),
    Math.floor(b1 + (b2 - b1) * clampedFactor),
  ];
}

function writeColor({
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
