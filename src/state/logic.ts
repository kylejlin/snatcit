import { CONFIG_FILE_NAME, FileInfo } from ".";

export function getFileNameFromFileInfo(info: FileInfo): string {
  switch (info.kind) {
    case "audio":
      return info.file.name;
    case "config":
      return CONFIG_FILE_NAME;
    default:
      const unreachable: never = info;
      return unreachable;
  }
}
