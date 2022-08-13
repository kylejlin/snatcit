import React from "react";
import { AppProps, AppState } from "./state";
import { Header } from "./Header";
import { getAllFieldValuesForEntry } from "./config";
import {
  renderSpectrogram,
  renderSpectrogramAndMarkings,
} from "./canvas/renderSpectrogramAndMarkings";
import { getSpectrumData, SpectrumData } from "./canvas/calculationUtils";

export class App extends React.Component<AppProps, AppState> {
  private spectrogramRef: React.RefObject<HTMLCanvasElement>;

  private internalCanvasCtx: CanvasRenderingContext2D;
  private audioCtx: AudioContext;
  private fileDataCache: { [index: number]: undefined | AudioFileData };

  constructor(props: AppProps) {
    super(props);

    this.previousFileButtonOnClick = this.previousFileButtonOnClick.bind(this);
    this.nextFileButtonOnClick = this.nextFileButtonOnClick.bind(this);
    this.downloadButtonOnClick = this.downloadButtonOnClick.bind(this);
    this.volumeSliderOnChange = this.volumeSliderOnChange.bind(this);
    this.renderSpectrogramAndMarkingsUsingSelectedAudioFile =
      this.renderSpectrogramAndMarkingsUsingSelectedAudioFile.bind(this);
    this.windowOnResize = this.windowOnResize.bind(this);

    this.state = {
      volume: 1,
      isPlaying: false,
      selectedIndex: 0,
      config: this.props.initialConfig,
    };

    this.spectrogramRef = React.createRef();

    const internalCanvasCtx = document.createElement("canvas").getContext("2d");
    if (internalCanvasCtx === null) {
      throw new Error("Could not create internal canvas context.");
    }
    this.internalCanvasCtx = internalCanvasCtx;

    this.audioCtx = new AudioContext();
    this.fileDataCache = {};
  }

  componentDidMount(): void {
    this.resizeCanvas();
    this.renderSpectrogramAndMarkingsUsingSelectedAudioFile();
    window.addEventListener("resize", this.windowOnResize);
  }

  componentDidUpdate(): void {
    this.resizeCanvas();
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.windowOnResize);
  }

  render(): React.ReactElement {
    const fileNames = this.props.audioFiles.map((f) => f.name);
    const { selectedIndex, isPlaying } = this.state;
    const { namesOfDerivedFieldsThatCouldNotBeComputed } =
      getAllFieldValuesForEntry(
        this.state.config,
        this.props.audioFiles[this.state.selectedIndex].name
      );
    return (
      <div className="App">
        <Header />

        <p>
          Current file:{" "}
          <span className="FileName">{fileNames[selectedIndex]}</span> (
          {selectedIndex + 1}/{fileNames.length})
        </p>

        <div className="BgmVolumeInputContainer">
          <label>Volume: </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={this.state.volume}
            onChange={this.volumeSliderOnChange}
          />
        </div>

        <button
          className="App__Button--previous Button--secondary"
          disabled={!(0 < selectedIndex && !isPlaying)}
          onClick={this.previousFileButtonOnClick}
        >
          Previous
        </button>
        <button
          className="App__Button--record Button--primary"
          disabled={isPlaying}
          onClick={this.downloadButtonOnClick}
        >
          Download
        </button>
        <button
          className="App__Button--next Button--secondary"
          disabled={!(selectedIndex < fileNames.length - 1 && !isPlaying)}
          onClick={this.nextFileButtonOnClick}
        >
          Next
        </button>

        {namesOfDerivedFieldsThatCouldNotBeComputed.length > 0 && (
          <>
            <p>Fields that could not be computed:</p>
            <ol>
              {namesOfDerivedFieldsThatCouldNotBeComputed.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ol>
          </>
        )}

        <p className="SpectrogramLabel">Spectrogram</p>
        <canvas
          className="Spectrogram"
          ref={this.spectrogramRef}
          width={window.innerWidth}
          height={/* TODO */ 100}
        />
      </div>
    );
  }

  previousFileButtonOnClick(): void {
    const previousIndex = Math.max(0, this.state.selectedIndex - 1);
    this.setState(
      {
        selectedIndex: previousIndex,
      },
      this.renderSpectrogramAndMarkingsUsingSelectedAudioFile
    );
  }

  nextFileButtonOnClick(): void {
    const nextIndex = Math.min(
      this.props.audioFiles.length - 1,
      this.state.selectedIndex + 1
    );
    this.setState(
      {
        selectedIndex: nextIndex,
      },
      this.renderSpectrogramAndMarkingsUsingSelectedAudioFile
    );
  }

  downloadButtonOnClick(): void {
    // TODO
  }

  volumeSliderOnChange(change: React.ChangeEvent<HTMLInputElement>): void {
    const unclamped = Number(change.target.value);
    if (!Number.isFinite(unclamped)) {
      return;
    }

    const clampedVolume = Math.max(0, Math.min(unclamped, 1));
    // TODO
    // audioElement.volume = clampedVolume;
    this.setState({ volume: clampedVolume });
  }

  windowOnResize(): void {
    this.fileDataCache = {};
  }

  getFileData(index: number): Promise<AudioFileData> {
    const fileData = this.fileDataCache[index];
    if (fileData !== undefined) {
      return Promise.resolve(fileData);
    }
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.addEventListener("load", () => {
        const audioData = fr.result as ArrayBuffer;
        this.audioCtx.decodeAudioData(audioData, (audioBuffer) => {
          const spectrumData = getSpectrumData({
            audioBuffer,
            snatcitConfig: this.state.config,
          });

          const { internalCanvasCtx } = this;
          const canvasWidth = window.innerWidth;
          const canvasHeight = spectrumData.spectrumBins;
          internalCanvasCtx.canvas.width = canvasWidth;
          internalCanvasCtx.canvas.height = canvasHeight;
          renderSpectrogram({
            ctx: internalCanvasCtx,
            audioCtx: this.audioCtx,
            audioBuffer,
            snatcitConfig: this.state.config,
          });

          const data: AudioFileData = {
            audioBuffer,
            spectrumData,
            spectrumImageData: internalCanvasCtx.getImageData(
              0,
              0,
              canvasWidth,
              canvasHeight
            ),
          };

          this.fileDataCache[index] = data;
          resolve(data);
        });
      });
      fr.readAsArrayBuffer(this.props.audioFiles[index]);
    });
  }

  resizeCanvas(): void {
    const canvas = this.spectrogramRef.current;
    if (canvas === null) {
      return;
    }

    canvas.style.position = "static";

    const rect = canvas.getBoundingClientRect();
    const availableHeight = window.innerHeight - rect.top;
    canvas.style.height = availableHeight + "px";

    canvas.style.position = "absolute";
  }

  renderSpectrogramAndMarkingsUsingSelectedAudioFile(): void {
    const canvas = this.spectrogramRef.current;
    if (canvas === null) {
      return;
    }
    const ctx = canvas.getContext("2d")!;

    const { computedValues } = getAllFieldValuesForEntry(
      this.state.config,
      this.props.audioFiles[this.state.selectedIndex].name
    );
    this.getFileData(this.state.selectedIndex).then((fileData) => {
      renderSpectrogramAndMarkings(
        {
          ctx,
          audioCtx: this.audioCtx,
          audioBuffer: fileData.audioBuffer,
          snatcitConfig: this.state.config,
        },
        computedValues
      );
    });
  }
}

export interface AudioFileData {
  readonly audioBuffer: AudioBuffer;
  readonly spectrumData: SpectrumData;
  readonly spectrumImageData: ImageData;
}
