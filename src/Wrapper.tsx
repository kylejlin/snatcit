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
  SnapauFileInfo,
} from "./state";

const ARBITRARY_PREFIX_THAT_WILL_DEFINITELY_NOT_BE_CONTAINED_IN_A_FILE_NAME =
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

  override componentDidMount(): void {
    // Just for debug purposes.
    (window as any).appWrapper = this;
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

    const launchStatus = getConfigAndAudioFileFromFileInfoArray(state.fileInfo);

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
                    ARBITRARY_PREFIX_THAT_WILL_DEFINITELY_NOT_BE_CONTAINED_IN_A_FILE_NAME +
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

        {launchStatus.error === undefined ? (
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

              {launchStatus.error === "duplicate_snapau_names" && (
                <li>
                  Duplicate snapau{" "}
                  <span className="FileName">
                    {launchStatus.arbitraryDuplicateSnapauName}
                  </span>
                  .
                </li>
              )}

              {launchStatus.error === "unrecognized_file_names" && (
                <li>
                  Unrecognized file names:
                  <ol>
                    {launchStatus.fileNames.map((fileName, i) => (
                      <li
                        key={`${i}${ARBITRARY_PREFIX_THAT_WILL_DEFINITELY_NOT_BE_CONTAINED_IN_A_FILE_NAME}${fileName}`}
                      >
                        <span className="FileName">{fileName}</span>
                      </li>
                    ))}
                  </ol>
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
          disabled={launchStatus.error !== undefined}
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

    if (launchResources.error !== undefined) {
      throw new Error("Launch button was clicked when app was unlaunchable.");
    }

    const [config, snapauFileInfo, snatcitConfigFileNames] =
      launchResources.value;

    this.setState({
      kind: WrapperStateKind.LaunchSucceeded,
      appProps: {
        initialConfig: config,
        snapauFileInfo,
        snatcitConfigFileNames,
      },
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

function getConfigAndAudioFileFromFileInfoArray(
  allFileInfo: readonly FileInfo[]
):
  | { error: "no_valid_config" }
  | { error: "no_audio_files" }
  | { error: "duplicate_file_names"; arbitraryDuplicateFileName: string }
  | { error: "unrecognized_file_names"; fileNames: string[] }
  | { error: "duplicate_snapau_names"; arbitraryDuplicateSnapauName: string }
  | { error: undefined; value: [SnatcitConfig, SnapauFileInfo[], string[]] } {
  const validConfigFileInfo: ValidConfigFileInfo[] = allFileInfo.filter(
    (info): info is ValidConfigFileInfo =>
      info.kind === "config" && info.isValid
  );

  if (validConfigFileInfo.length === 0) {
    return { error: "no_valid_config" };
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

  if (audioFiles.length === 0) {
    return { error: "no_audio_files" };
  }

  const fileNameDuplicateStatus = getArbitraryDuplicate<File>(
    audioFiles,
    (a, b) => a.name === b.name
  );
  if (fileNameDuplicateStatus.hasDuplicate) {
    return {
      error: "duplicate_file_names",
      arbitraryDuplicateFileName: fileNameDuplicateStatus.duplicate.name,
    };
  }

  const snapauFileInfoFromRecognizedFiles: SnapauFileInfo[] = filterMap<
    File,
    SnapauFileInfo[]
  >(audioFiles, (file) => {
    const snapauNames = newestConfig.fileToSnapauMap[file.name];
    if (snapauNames === undefined) {
      return { keep: false };
    }
    return {
      keep: true,
      value: snapauNames.map((snapauName) => ({
        kind: "snapau",
        file,
        snapauName,
      })),
    };
  }).flat();

  const unrecognizedFiles = audioFiles.filter(
    (file) => newestConfig.fileToSnapauMap[file.name] === undefined
  );

  if (
    newestConfig.unrecognizedFileReaction === "error" &&
    unrecognizedFiles.length > 0
  ) {
    return {
      error: "unrecognized_file_names",
      fileNames: unrecognizedFiles.map((file) => file.name),
    };
  }

  const snapauFileInfoFromUnrecognizedFiles: SnapauFileInfo[] =
    newestConfig.unrecognizedFileReaction === "ignore"
      ? []
      : unrecognizedFiles.map((file) => ({
          kind: "snapau",
          file,
          snapauName: file.name,
        }));
  const snapauFileInfo = snapauFileInfoFromRecognizedFiles
    .concat(snapauFileInfoFromUnrecognizedFiles)
    .sort((a, b) => a.snapauName.localeCompare(b.snapauName));

  const snapauNameDuplicateStatus = getArbitraryDuplicate<SnapauFileInfo>(
    snapauFileInfo,
    (a, b) => a.snapauName === b.snapauName
  );
  if (snapauNameDuplicateStatus.hasDuplicate) {
    return {
      error: "duplicate_snapau_names",
      arbitraryDuplicateSnapauName:
        snapauNameDuplicateStatus.duplicate.snapauName,
    };
  }

  return {
    error: undefined,
    value: [
      newestConfig,
      snapauFileInfo,
      validConfigFileInfo.map((info) => info.file.name),
    ],
  };
}
