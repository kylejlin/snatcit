import React from "react";
import { AppProps, AppState } from "./state";
import { Header } from "./Header";
import {
  getAllFieldValuesForEntry,
  getConfigFileNameFromSuffix,
  LabeledFieldValue,
  SnatcitConfig,
  stringifyConfig,
  updateConfig,
} from "./config";
import {
  RenderConfig,
  renderMarkings,
  renderSpectrogram,
} from "./canvas/renderSpectrogramAndMarkings";
import { getSpectrumFftData, SpectrumFftData } from "./canvas/calculationUtils";
import { base64FromUnicode } from "./lib/base64";

export class App extends React.Component<AppProps, AppState> {
  private spectrogramRef: React.RefObject<HTMLCanvasElement>;

  private internalCanvasCtx: CanvasRenderingContext2D;
  private audioCtx: AudioContext;
  private audioDataCache: { [index: number]: undefined | AudioData };
  private spectrogramImageDataCache: { [index: number]: undefined | ImageData };

  private renderPromise: undefined | Promise<void>;

  constructor(props: AppProps) {
    super(props);

    this.previousFileButtonOnClick = this.previousFileButtonOnClick.bind(this);
    this.nextFileButtonOnClick = this.nextFileButtonOnClick.bind(this);
    this.downloadButtonOnClick = this.downloadButtonOnClick.bind(this);
    this.volumeSliderOnChange = this.volumeSliderOnChange.bind(this);
    this.fieldValueInputOnFocus = this.fieldValueInputOnFocus.bind(this);
    this.fieldValueInputOnBlur = this.fieldValueInputOnBlur.bind(this);
    this.fieldValueInputOnChange = this.fieldValueInputOnChange.bind(this);
    this.windowOnResize = this.windowOnResize.bind(this);
    this.requestCanvasUpdate = this.requestCanvasUpdate.bind(this);
    this.updateCanvas = this.updateCanvas.bind(this);
    this.renderSpectrogramUsingCache =
      this.renderSpectrogramUsingCache.bind(this);

    this.state = {
      volume: 1,
      isPlaying: false,
      selectedEntryIndex: 0,
      config: this.props.initialConfig,
      selectedProvidedFieldName: undefined,
      isFieldInputFocused: false,
      tentativeFieldValue: "",
    };

    this.spectrogramRef = React.createRef();

    const internalCanvasCtx = document.createElement("canvas").getContext("2d");
    if (internalCanvasCtx === null) {
      throw new Error("Could not create internal canvas context.");
    }
    this.internalCanvasCtx = internalCanvasCtx;

    this.audioCtx = new AudioContext();
    this.audioDataCache = {};
    this.spectrogramImageDataCache = {};
  }

  override componentDidMount(): void {
    this.requestCanvasUpdate();
    window.addEventListener("resize", this.windowOnResize);
  }

  override componentDidUpdate(): void {
    this.requestCanvasUpdate();
  }

  override componentWillUnmount(): void {
    window.removeEventListener("resize", this.windowOnResize);
  }

  override render(): React.ReactElement {
    const fileNames = this.props.audioFiles.map((f) => f.name);
    const { selectedEntryIndex: selectedIndex, isPlaying, config } = this.state;
    const { providedFieldNames } = config;
    const allFieldNames = providedFieldNames.concat(
      config.derivedFields.map((f) => f.name)
    );
    const { computedValues } = getAllFieldValuesForEntry(
      this.state.config,
      this.props.audioFiles[this.state.selectedEntryIndex].name
    );
    return (
      <div className="App">
        <Header />

        <p>
          Current file:{" "}
          <span className="FileName">{fileNames[selectedIndex]}</span> (
          {selectedIndex + 1}/{fileNames.length})
        </p>

        <div className="VolumeInputContainer">
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

        <h2 className="FieldsTableLabel">Fields</h2>
        <div className="FieldsTable">
          {allFieldNames.map((fieldName) => {
            const entry = computedValues.find(
              (entry) => entry.fieldName === fieldName
            );
            return (
              <div className="FieldsTable__Entry" key={fieldName}>
                <div className="FieldsTable__Entry__Label">{fieldName}:</div>
                <div className="FieldsTable__Entry__Value">
                  {entry === undefined ? (
                    "Error"
                  ) : providedFieldNames.includes(fieldName) ? (
                    <input
                      data-field-name={fieldName}
                      value={
                        fieldName === this.state.selectedProvidedFieldName &&
                        this.state.isFieldInputFocused
                          ? this.state.tentativeFieldValue
                          : entry.value
                      }
                      onFocus={this.fieldValueInputOnFocus}
                      onBlur={this.fieldValueInputOnBlur}
                      onChange={this.fieldValueInputOnChange}
                    />
                  ) : (
                    entry.value
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="SpectrogramLabel">Spectrogram</p>
        <canvas className="Spectrogram" ref={this.spectrogramRef} />
      </div>
    );
  }

  previousFileButtonOnClick(): void {
    const previousIndex = Math.max(0, this.state.selectedEntryIndex - 1);
    this.setState(
      {
        selectedEntryIndex: previousIndex,
      },
      this.requestCanvasUpdate
    );
  }

  nextFileButtonOnClick(): void {
    const nextIndex = Math.min(
      this.props.audioFiles.length - 1,
      this.state.selectedEntryIndex + 1
    );
    this.setState(
      {
        selectedEntryIndex: nextIndex,
      },
      this.requestCanvasUpdate
    );
  }

  downloadButtonOnClick(): void {
    const downloadedConfig: SnatcitConfig = {
      ...this.state.config,
      creationDate: new Date(),
    };
    const configString = stringifyConfig(downloadedConfig);
    const dataUrl = `data:application/json;base64,${base64FromUnicode(
      configString
    )}`;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = getNextAvailableDownloadFilename(
      this.props.snatcitConfigFileNames
    );
    a.click();
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

  fieldValueInputOnFocus(event: React.FocusEvent<HTMLInputElement>): void {
    const fieldName = event.target.getAttribute("data-field-name");
    if (fieldName === null) {
      throw new Error(
        "fieldValueInputOnFocus was called with an event with an input element without a data-field-name attribute."
      );
    }
    if (!this.state.config.providedFieldNames.includes(fieldName)) {
      throw new Error(
        "The selected field name was not in the provided field names"
      );
    }
    const { computedValues } = getAllFieldValuesForEntry(
      this.state.config,
      this.props.audioFiles[this.state.selectedEntryIndex].name
    );
    const fieldEntry = computedValues.find(
      (entry) => entry.fieldName === fieldName
    );
    if (fieldEntry === undefined) {
      throw new Error("A provided field was uncomputable.");
    }

    this.setState({
      selectedProvidedFieldName: fieldName,
      isFieldInputFocused: true,
      tentativeFieldValue: String(fieldEntry.value),
    });
  }

  fieldValueInputOnBlur(): void {
    this.setState({
      isFieldInputFocused: false,
    });
  }

  fieldValueInputOnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const fieldName = event.target.getAttribute("data-field-name");
    if (fieldName === null) {
      throw new Error(
        "fieldValueInputOnChange was called with an event with an input element without a data-field-name attribute."
      );
    }
    if (!this.state.config.providedFieldNames.includes(fieldName)) {
      throw new Error(
        "The selected field name was not in the provided field names"
      );
    }
    const canvas = this.spectrogramRef.current;
    if (canvas === null) {
      return;
    }

    const newTentativeFieldValue = event.target.value;
    const editedEntryIndex = this.state.selectedEntryIndex;
    this.getAudioData(editedEntryIndex, canvas.width).then((audioData) => {
      const durationInMs = audioData.audioBuffer.duration * 1e3;
      const parsedValue = Number(newTentativeFieldValue);
      const isParsedValueValid =
        Number.isFinite(parsedValue) &&
        0 <= parsedValue &&
        parsedValue <= durationInMs;
      this.setState((prevState) => {
        if (prevState.selectedEntryIndex !== editedEntryIndex) {
          return prevState;
        } else {
          return {
            ...prevState,
            tentativeFieldValue: newTentativeFieldValue,
            config: isParsedValueValid
              ? updateConfig(
                  prevState.config,
                  this.props.audioFiles[editedEntryIndex].name,
                  fieldName,
                  parsedValue
                )
              : prevState.config,
          };
        }
      });
    });
  }

  windowOnResize(): void {
    this.spectrogramImageDataCache = {};
    this.requestCanvasUpdate();
  }

  getAudioData(index: number, canvasWidth: number): Promise<AudioData> {
    const cachedData = this.audioDataCache[index];
    if (cachedData !== undefined) {
      return Promise.resolve(cachedData);
    }
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.addEventListener("load", () => {
        const audioData = fr.result as ArrayBuffer;
        this.audioCtx.decodeAudioData(audioData, (audioBuffer) => {
          const spectrumData = getSpectrumFftData({
            canvasWidth,
            audioBuffer,
            snatcitConfig: this.state.config,
          });

          const data: AudioData = {
            audioBuffer,
            spectrumFftData: spectrumData,
          };
          this.audioDataCache[index] = data;
          resolve(data);
        });
      });
      fr.readAsArrayBuffer(this.props.audioFiles[index]);
    });
  }

  getSpectrogramImageData(
    index: number,
    canvasWidth: number
  ): Promise<ImageData> {
    const cachedData = this.spectrogramImageDataCache[index];
    if (cachedData !== undefined) {
      return Promise.resolve(cachedData);
    }

    return this.getAudioData(index, canvasWidth).then(
      ({ audioBuffer, spectrumFftData: spectrumData }) => {
        const { internalCanvasCtx } = this;
        const canvasWidth = window.innerWidth;
        const canvasHeight = spectrumData.spectrumBins;
        internalCanvasCtx.canvas.width = canvasWidth;
        internalCanvasCtx.canvas.height = canvasHeight;
        renderSpectrogram({
          fileIndex: index,
          ctx: internalCanvasCtx,
          audioCtx: this.audioCtx,
          audioBuffer,
          snatcitConfig: this.state.config,
        });

        const imgData = internalCanvasCtx.getImageData(
          0,
          0,
          canvasWidth,
          canvasHeight
        );
        this.spectrogramImageDataCache[index] = imgData;
        return imgData;
      }
    );
  }

  requestCanvasUpdate(): void {
    if (this.renderPromise === undefined) {
      this.updateCanvas();
    } else {
      this.renderPromise.then(() => {
        this.updateCanvas();
      });
    }
  }

  updateCanvas(): void {
    const canvas = this.spectrogramRef.current;
    if (canvas === null) {
      return;
    }

    this.renderPromise = this.useSelectedAudioFileToRender([
      this.renderSpectrogramUsingCache,
      renderMarkings,
    ]).then(() => {
      canvas.style.position = "static";

      const rect = canvas.getBoundingClientRect();
      const availableHeight = window.innerHeight - rect.top;
      canvas.style.height = availableHeight + "px";

      canvas.style.position = "absolute";

      this.renderPromise = undefined;
    });
  }

  renderSpectrogramUsingCache(renderConfig: RenderConfig): Promise<void> {
    const canvas = this.spectrogramRef.current;
    if (canvas === null) {
      return Promise.resolve();
    }
    const ctx = canvas.getContext("2d")!;
    return this.getSpectrogramImageData(
      renderConfig.fileIndex,
      canvas.width
    ).then((imgData) => {
      canvas.width = imgData.width;
      canvas.height = imgData.height;
      ctx.putImageData(imgData, 0, 0);
    });
  }

  useSelectedAudioFileToRender(
    renderers: readonly ((
      rc: RenderConfig,
      computedValues: readonly LabeledFieldValue[]
    ) => void | Promise<void>)[]
  ): Promise<void> {
    const canvas = this.spectrogramRef.current;
    if (canvas === null) {
      return Promise.resolve(undefined);
    }
    const ctx = canvas.getContext("2d")!;

    const { computedValues } = getAllFieldValuesForEntry(
      this.state.config,
      this.props.audioFiles[this.state.selectedEntryIndex].name
    );
    return this.getAudioData(this.state.selectedEntryIndex, canvas.width).then(
      (audioData) => {
        const renderConfig: RenderConfig = {
          fileIndex: this.state.selectedEntryIndex,
          ctx,
          audioCtx: this.audioCtx,
          audioBuffer: audioData.audioBuffer,
          snatcitConfig: this.state.config,
        };
        function f(i: number): Promise<void> {
          return Promise.resolve(
            renderers[i](renderConfig, computedValues)
          ).then(() => {
            const next = i + 1;
            if (next < renderers.length) {
              return f(next);
            } else {
              return Promise.resolve(undefined);
            }
          });
        }
        return f(0);
      }
    );
  }
}

export interface AudioData {
  readonly audioBuffer: AudioBuffer;
  readonly spectrumFftData: SpectrumFftData;
}

function getNextAvailableDownloadFilename(
  unavailable: readonly string[]
): string {
  for (let i = 1; true; ++i) {
    const proposal = getConfigFileNameFromSuffix(i);
    if (!unavailable.includes(proposal)) {
      return proposal;
    }
  }
}
