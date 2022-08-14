import Fft from "fft.js";
import {
  rgbTupleToCssFillStyle,
  getSpectrumFftData,
  SpectrumFftData,
  getColorMap,
  lazySliceAudioBuffer,
  copyChannelAverageInto,
  writeColor,
  getSpectrogramRenderData,
  RenderConfig,
} from "./calculationUtils";

/**
 * I'm not sure what the maximum magnitude is, since
 * I don't understand FFT.
 * As a arbitrary guess, I'm going to assume the real component
 * is on [-1, 1], and the imaginary component is also on [-1, 1],
 * which would make the maximum magnitude be the square root of 2.
 */
const MAX_MAGNITUDE = Math.SQRT2;

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
  const spectrumData = getSpectrumFftData({
    canvasWidth: renderConfig.ctx.canvas.width,
    audioBuffer: renderConfig.audioBuffer,
    snatcitConfig: renderConfig.snatcitConfig,
  });
  if (spectrumData.fractionalFftBinsPerSpectrumBin > 0) {
    renderSpectra(renderConfig, spectrumData);
  }
}

function renderSpectra(
  renderConfig: RenderConfig,
  {
    fftInputLength,
    fractionalFftBinsPerSpectrumBin,
    spectrumBins,
  }: SpectrumFftData
): void {
  const { ctx, audioBuffer, snatcitConfig } = renderConfig;
  const imgDataData = new Uint8ClampedArray(4 * spectrumBins);
  const imgData = new ImageData(imgDataData, 1, spectrumBins);
  const colorMap = getColorMap(snatcitConfig.spectrogram.colorScale);

  const {
    numberOfFullSpectra,
    stepSizeInFractionalFrames,
    windowSizeInFractionalFrames,
    spectrumCanvasFractionalWidth,
    spectrumCanvasCeiledWidth,
  } = getSpectrogramRenderData({
    canvasWidth: ctx.canvas.width,
    audioBuffer,
    snatcitConfig,
  });

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
      const binStart = 2 * Math.floor(i * fractionalFftBinsPerSpectrumBin);
      const exclBinEnd = Math.min(
        2 * Math.ceil((i + 1) * fractionalFftBinsPerSpectrumBin),
        out.length
      );
      const fftBinsInSpectrumBin = (exclBinEnd - binStart) / 2 + 1;
      let totalMagnitude = 0;
      for (let reIndex = binStart; reIndex < exclBinEnd; reIndex += 2) {
        const re = out[reIndex];
        const im = out[reIndex + 1];
        totalMagnitude += Math.hypot(re, im);
      }
      const averageMagnitude = totalMagnitude / fftBinsInSpectrumBin;
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
