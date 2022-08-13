import React from "react";
import { App } from "./App";
import {
  CONFIG_FILE_DEFAULT_NAME,
  isConfigFileName,
  parseConfig,
  SnatcitConfig,
} from "./config";
import { Header } from "./Header";
import {
  filterMap,
  getArbitraryDuplicate,
  getGithubUsernameOfHost,
  hasDuplicate,
  isAudioFile,
} from "./misc";
import {
  WrapperState,
  WrapperStateKind,
  PrelaunchState,
  LaunchSucceededState,
  BrowserAudioMimeType,
  FileInfo,
  UnidentifiedFileInfo,
  ValidConfigFileInfo,
  ALL_BROWSER_AUDIO_MIME_TYPES,
} from "./state";

const ARBITRARY_PREFIX_THAT_WILL_DEFINITELY_NOT_BE_CONTAINED_IN_A_PATH =
  "/\\#@:&{}*<>";

export class Wrapper extends React.Component<WrapperProps, WrapperState> {
  constructor(props: WrapperProps) {
    super(props);

    this.state = {
      kind: WrapperStateKind.Prelaunch,
      fileInfo: [],
    };

    this.uploadFilesButtonOnClick = this.uploadFilesButtonOnClick.bind(this);
    this.deleteFileInfo = this.deleteFileInfo.bind(this);
    this.launchButtonOnClick = this.launchButtonOnClick.bind(this);
  }

  override render(): React.ReactElement {
    const legalMimeType: undefined | BrowserAudioMimeType =
      ALL_BROWSER_AUDIO_MIME_TYPES.find((mimeType) =>
        MediaRecorder.isTypeSupported(mimeType)
      );
    if (legalMimeType === undefined) {
      return this.renderUnsupportedBrowserMenu();
    }

    const { state } = this;
    switch (state.kind) {
      case WrapperStateKind.Prelaunch:
        return this.renderPrelaunchMenu(state);
      case WrapperStateKind.LaunchSucceeded:
        return this.renderLaunchSucceededMenu(state, legalMimeType);
    }
  }

  renderUnsupportedBrowserMenu(): React.ReactElement {
    return (
      <div className="Wrapper Wrapper--unsupportedBrowser">
        <p>
          Sorry, this browser is not supported. Please use a newer one, such as
          Google Chrome 103.
        </p>
      </div>
    );
  }

  renderPrelaunchMenu(state: PrelaunchState): React.ReactElement {
    const githubUsername = getGithubUsernameOfHost();
    const helpHref: undefined | string =
      githubUsername === undefined
        ? undefined
        : `https://github.com/${githubUsername}/snatcit/tree/main/docs/user_guide.md`;

    const validConfigFileInfo = state.fileInfo.filter(
      (info) => info.kind === "config" && info.isValid
    );
    const audioFiles = filterMap<FileInfo, File>(state.fileInfo, (info) =>
      info.kind === "audio" ? { keep: true, value: info.file } : { keep: false }
    );
    const audioFileDuplicateStatus = getArbitraryDuplicate<File>(
      audioFiles,
      (a, b) => a.name === b.name
    );

    return (
      <div className="Wrapper Wrapper--prelaunch">
        <Header />

        <p>Welcome to Snatcit!</p>

        {helpHref !== undefined && (
          <p>
            If you are a new user, click <a href={helpHref}>here</a> for help.
          </p>
        )}

        <p>
          Please upload files. You can only launch the app after you upload one
          or more <span className="FileName">{CONFIG_FILE_DEFAULT_NAME}</span>{" "}
          files and one or more audio files.
        </p>

        {state.fileInfo.length > 0 && (
          <div className="StatusSection">
            <p>Files:</p>
            <ol>
              {state.fileInfo.map((info, i) => (
                <li
                  key={
                    i +
                    ARBITRARY_PREFIX_THAT_WILL_DEFINITELY_NOT_BE_CONTAINED_IN_A_PATH +
                    info.file.name
                  }
                >
                  <span className="FileName">
                    {info.file.name}
                    {info.kind === "config" && !info.isValid
                      ? " (invalid)"
                      : ""}
                  </span>{" "}
                  <button
                    className="DeleteButton"
                    onClick={() => this.deleteFileInfo(info)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        {canLaunch(state.fileInfo) ? (
          <div className="StatusSection">
            <p className="ReadyToLaunchNotification">
              Ready to launch. Please click the "Launch" button to continue.
            </p>
          </div>
        ) : (
          <div className="StatusSection">
            <p>Issues preventing launch:</p>
            <ol>
              {validConfigFileInfo.length === 0 && (
                <li>
                  Missing{" "}
                  <span className="FileName">{CONFIG_FILE_DEFAULT_NAME}</span>{" "}
                  file.
                </li>
              )}

              {audioFiles.length === 0 && <li>Missing audio file.</li>}

              {audioFileDuplicateStatus.hasDuplicate && (
                <li>
                  More than one file is name{" "}
                  <span className="FileName">
                    {audioFileDuplicateStatus.duplicate.name}
                  </span>
                  . You can only have at most one.
                </li>
              )}
            </ol>
          </div>
        )}

        <button
          className="Wrapper--prelaunch__Button--uploadFiles Button--secondary"
          onClick={this.uploadFilesButtonOnClick}
        >
          Upload Files
        </button>
        <button
          className="Wrapper--prelaunch__Button--launch Button--primary"
          disabled={!canLaunch(state.fileInfo)}
          onClick={this.launchButtonOnClick}
        >
          Launch
        </button>
      </div>
    );
  }

  renderLaunchSucceededMenu(
    state: LaunchSucceededState,
    mimeType: BrowserAudioMimeType
  ): React.ReactElement {
    return (
      <div className="Wrapper Wrapper--launchSucceeded">
        <App {...{ ...state.appProps, mimeType }} />
      </div>
    );
  }

  uploadFilesButtonOnClick(): void {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.addEventListener("change", () => {
      const { files: fileList } = fileInput;
      if (fileList === null) {
        return;
      }
      const files = Array.from(fileList);

      if (files.length === 0) {
        return;
      }

      this.handleMultiFileUpload(files);
    });

    fileInput.click();
  }

  handleMultiFileUpload(files: readonly File[]): void {
    const newPartialInfoProm: Promise<(undefined | UnidentifiedFileInfo)[]> =
      Promise.all(
        files.map((file): Promise<undefined | UnidentifiedFileInfo> => {
          if (isConfigFileName(file.name)) {
            return new Promise((resolve) => {
              const fr = new FileReader();
              fr.addEventListener("load", () => {
                const parseResult = parseConfig(fr.result as string);
                if (parseResult.error !== undefined) {
                  resolve({ kind: "config", file, isValid: false });
                } else {
                  resolve({
                    kind: "config",
                    file,
                    isValid: true,
                    config: parseResult.config,
                  });
                }
              });
              fr.readAsText(file);
            });
          } else if (isAudioFile(file)) {
            return Promise.resolve({ kind: "audio", file });
          } else {
            return Promise.resolve(undefined);
          }
        })
      );

    newPartialInfoProm.then((newPartialInfoOrUndefined) => {
      const newPartialInfo = newPartialInfoOrUndefined.filter(
        (x) => x !== undefined
      ) as UnidentifiedFileInfo[];
      this.setState((prevState) => {
        if (prevState.kind !== WrapperStateKind.Prelaunch) {
          return prevState;
        }

        const idGreaterThanAllExistingIds =
          Math.max(1, ...prevState.fileInfo.map((info) => info.id)) + 1;

        const newFileInfo = newPartialInfo.map((partial, i) => {
          return {
            ...partial,
            id: idGreaterThanAllExistingIds + i,
          };
        });

        return {
          ...prevState,
          fileInfo: prevState.fileInfo.concat(newFileInfo).sort((a, b) => {
            if (a.kind === "config") {
              if (a.isValid) {
                if (b.kind === "config" && b.isValid) {
                  return (
                    a.config.creationDate.getTime() -
                    b.config.creationDate.getTime()
                  );
                } else {
                  return -1;
                }
              } else {
                if (b.kind === "config") {
                  if (b.isValid) {
                    return 1;
                  } else {
                    return 0;
                  }
                } else {
                  return -1;
                }
              }
            } else {
              if (b.kind === "config") {
                return 1;
              } else {
                return a.file.name.localeCompare(b.file.name);
              }
            }
          }),
        };
      });
    });
  }

  launchButtonOnClick(): void {
    const { state } = this;
    if (state.kind !== WrapperStateKind.Prelaunch) {
      throw new Error(
        "Launch button was clicked when prelaunch menu was not open."
      );
    }

    const launchResources = getConfigAndAudioFileFromFileInfoArray(
      state.fileInfo
    );

    if (launchResources === undefined) {
      throw new Error("Launch button was clicked when app was unlaunchable.");
    }

    const [config, audioFiles] = launchResources;

    this.setState({
      kind: WrapperStateKind.LaunchSucceeded,
      appProps: { initialConfig: config, audioFiles },
    });
  }

  deleteFileInfo(infoToDelete: FileInfo): void {
    this.setState((prevState) => {
      if (prevState.kind !== WrapperStateKind.Prelaunch) {
        return prevState;
      }

      return {
        ...prevState,
        fileInfo: prevState.fileInfo.filter((i) => i.id !== infoToDelete.id),
      };
    });
  }
}

type WrapperProps = Record<string, unknown>;

function canLaunch(fileInfo: readonly FileInfo[]): boolean {
  return getConfigAndAudioFileFromFileInfoArray(fileInfo) !== undefined;
}

function getConfigAndAudioFileFromFileInfoArray(
  allFileInfo: readonly FileInfo[]
): undefined | [SnatcitConfig, File[]] {
  const validConfigFileInfo: ValidConfigFileInfo[] = allFileInfo.filter(
    (info): info is ValidConfigFileInfo =>
      info.kind === "config" && info.isValid
  );

  if (validConfigFileInfo.length === 0) {
    return;
  }

  let newestConfigFileInfo = validConfigFileInfo[0];
  for (let i = 1; i < validConfigFileInfo.length; ++i) {
    const configFileInfo = validConfigFileInfo[i];
    if (
      configFileInfo.config.creationDate >
      newestConfigFileInfo.config.creationDate
    ) {
      newestConfigFileInfo = configFileInfo;
    }
  }
  const newestConfig = newestConfigFileInfo.config;

  const audioFiles: File[] = filterMap<FileInfo, File>(allFileInfo, (info) =>
    info.kind === "audio" ? { keep: true, value: info.file } : { keep: false }
  );

  if (hasDuplicate<File>(audioFiles, (a, b) => a.name === b.name)) {
    return;
  }

  return [newestConfig, audioFiles];
}
