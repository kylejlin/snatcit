import React from "react";
import { AppProps, AppState } from "./state";
import { Header } from "./Header";

export class App extends React.Component<AppProps, AppState> {
  private spectrogramRef: React.RefObject<HTMLCanvasElement>;

  private audioCtx: AudioContext;

  constructor(props: AppProps) {
    super(props);

    this.updateSpectrogram = this.updateSpectrogram.bind(this);
    this.previousFileButtonOnClick = this.previousFileButtonOnClick.bind(this);
    this.nextFileButtonOnClick = this.nextFileButtonOnClick.bind(this);
    this.downloadButtonOnClick = this.downloadButtonOnClick.bind(this);
    this.volumeSliderOnChange = this.volumeSliderOnChange.bind(this);

    this.state = {
      volume: 1,
      isPlaying: false,
      selectedIndex: 0,
    };

    this.spectrogramRef = React.createRef();

    const audioCtx = new AudioContext();
    this.audioCtx = audioCtx;
  }

  componentDidMount(): void {
    this.resizeCanvas();
    this.renderSpectrogramBackground();
  }

  componentDidUpdate(): void {
    this.resizeCanvas();
  }

  render(): React.ReactElement {
    const fileNames = this.props.audioFiles.map((f) => f.name);
    const { selectedIndex, isPlaying } = this.state;
    return (
      <div className="App">
        <Header />

        <p>
          Current file:{" "}
          <span className="FileName">{fileNames[selectedIndex]}</span> (
          {selectedIndex + 1}/{fileNames.length})
        </p>

        <div className="BgmVolumeInputContainer">
          <label>Background music volume: </label>
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

  renderSpectrogramBackground(): void {
    const canvas = this.spectrogramRef.current;
    if (canvas === null) {
      return;
    }
    const ctx = canvas.getContext("2d")!;
    const { width: canvasWidth, height: canvasHeight } = ctx.canvas;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  updateSpectrogram(): void {
    // TODO
  }

  previousFileButtonOnClick(): void {
    this.setState({
      selectedIndex: Math.max(0, this.state.selectedIndex - 1),
    });
  }

  nextFileButtonOnClick(): void {
    this.setState({
      selectedIndex: Math.min(
        this.props.audioFiles.length - 1,
        this.state.selectedIndex + 1
      ),
    });
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
    // this.props.config.bgmElement.volume = clampedVolume;
    this.setState({ volume: clampedVolume });
  }
}
