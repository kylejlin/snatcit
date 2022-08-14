import { SnatcitConfig } from "./config";

/**
 * This isn't meant to be an exhaustive list of all audio MIME types.
 * It is intended to be broad enough so that if a given browser supports
 * audio at all, it will support at least one of these MIME types.
 */
export const ALL_BROWSER_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-matroska",
  "audio/wav",
  "audio/x-wav",
] as const;
export type BrowserAudioMimeType = typeof ALL_BROWSER_AUDIO_MIME_TYPES[number];

export type WrapperState = PrelaunchState | LaunchSucceededState;

export enum WrapperStateKind {
  Prelaunch,
  LaunchSucceeded,
}
export interface PrelaunchState {
  readonly kind: WrapperStateKind.Prelaunch;
  readonly fileInfo: readonly FileInfo[];
}

export type FileInfo =
  | AudioFileInfo
  | ValidConfigFileInfo
  | InvalidConfigFileInfo;

export type UnidentifiedFileInfo =
  | Omit<AudioFileInfo, "id">
  | Omit<ValidConfigFileInfo, "id">
  | Omit<InvalidConfigFileInfo, "id">;

export interface AudioFileInfo {
  readonly kind: "audio";
  readonly id: number;
  readonly file: File;
}

export interface ValidConfigFileInfo {
  readonly kind: "config";
  readonly id: number;
  readonly file: File;
  readonly isValid: true;
  readonly config: SnatcitConfig;
}

export interface InvalidConfigFileInfo {
  readonly kind: "config";
  readonly id: number;
  readonly file: File;
  readonly isValid: false;
}

export interface LaunchSucceededState {
  readonly kind: WrapperStateKind.LaunchSucceeded;
  readonly appProps: Omit<AppProps, "mimeType">;
}

export interface AppProps {
  mimeType: BrowserAudioMimeType;
  snatcitConfigFileNames: readonly string[];
  audioFiles: readonly File[];
  initialConfig: SnatcitConfig;
}

export interface AppState {
  /**
   * Between zero and one, inclusive.
   *
   * We shouldn't theoretically need to store this in React state,
   * since we could just update the audio element's volume
   * directly.
   *
   * However, if we did that, then the volume input's value would
   * have to be computed using the audio element's volume
   * (rather than from React state), which could potentially lead to
   * React bugs.
   * */
  readonly volume: number;
  readonly isPlaying: boolean;
  readonly selectedEntryIndex: number;
  readonly selectedProvidedFieldName: undefined | string;
  readonly isFieldInputFocused: boolean;
  readonly tentativeFieldValue: string;
  readonly config: SnatcitConfig;
}
