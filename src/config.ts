import { RgbaTuple, RgbTuple } from "./canvas/calculationUtils";
import { evalCmamekExpression } from "./lib/cmamek";
import { hasDuplicate } from "./misc";

const SNATCIT_CONFIG_JSON_KEYS = {
  creationDateString: "creation_date",
  fileToSnapauMap: "file_to_snapau_map",
  unrecognizedFileReaction: "unrecognized_file_reaction",
  spectrogram: "spectrogram",
  providedFieldNames: "provided_field_names",
  derivedFields: "derived_fields",
  defaultValues: "default_values",
  fieldColors: "field_colors",
  playedSegmentColor: "played_segment_color",
  entries: "entries",

  spectrogramKeys: {
    idealBinSizeInHz: "ideal_bin_size_in_hz",
    idealMaxFrequencyInHz: "ideal_max_frequency_in_hz",
    idealWindowSizeInMs: "ideal_window_size_in_ms",
    idealStepSizeInMs: "ideal_step_size_in_ms",
    colorScale: "color_scale",
    backgroundColor: "background_color",
  },
  derivedFieldKeys: {
    name: "name",
    cmamekSrc: "cmamek_src",
  },
  entryKeys: {
    name: "name",
    providedFieldValues: "provided_field_values",
  },
} as const;

export const CONFIG_FILE_DEFAULT_NAME = getConfigFileNameFromSuffix(undefined);

export function isConfigFileName(fileName: string): boolean {
  return /^snatcit.*\.json$/i.test(fileName);
}

export function getConfigFileNameFromSuffix(
  suffix: undefined | number
): string {
  if (suffix === undefined) {
    return "snatcit.json";
  }
  return `snatcit_${suffix}.json`;
}

export const ALL_UNRECOGNIZE_FILE_REACTIONS = [
  "ignore",
  "map_to_single_snapau_of_same_name",
  "error",
] as const;
export type UnrecognizedFileReaction =
  typeof ALL_UNRECOGNIZE_FILE_REACTIONS[number];

export interface SnatcitConfig {
  readonly creationDate: Date;
  readonly fileToSnapauMap: {
    readonly [realFileName: string]: undefined | readonly string[];
  };
  readonly unrecognizedFileReaction: UnrecognizedFileReaction;
  readonly spectrogram: {
    readonly idealBinSizeInHz: number;
    readonly idealMaxFrequencyInHz: number;
    readonly idealWindowSizeInMs: number;
    readonly idealStepSizeInMs: number;
    readonly colorScale: readonly (readonly [
      number,
      readonly [number, number, number]
    ])[];
    readonly backgroundColor: readonly [number, number, number];
  };
  readonly providedFieldNames: string[];
  readonly derivedFields: DerivedField[];
  readonly defaultValues: { [fieldName: string]: undefined | number };
  readonly fieldColors: { [fieldName: string]: undefined | RgbTuple };
  readonly playedSegmentColor: RgbaTuple;
  readonly entries: readonly Entry[];
}

export interface DerivedField {
  readonly name: string;
  readonly cmamekSrc: string;
}

export interface Entry {
  readonly name: string;
  readonly providedFieldValues: {
    readonly [fieldName: string]: undefined | number;
  };
}

export interface LabeledFieldValue {
  readonly fieldName: string;
  readonly value: number;
  readonly wasProvided: boolean;
}

export function parseConfig(
  src: string
):
  | { error: "invalid_json_syntax" }
  | { error: "invalid_json_shape" }
  | { error: undefined; config: SnatcitConfig } {
  let json: Record<string, any>;
  try {
    json = JSON.parse(src);
  } catch {
    return { error: "invalid_json_syntax" };
  }

  try {
    const creationDate = new Date(
      json[SNATCIT_CONFIG_JSON_KEYS.creationDateString]
    );
    const fileToSnapauMap = json[SNATCIT_CONFIG_JSON_KEYS.fileToSnapauMap];
    const unrecognizedFileReaction =
      json[SNATCIT_CONFIG_JSON_KEYS.unrecognizedFileReaction];
    const spectrogram = {
      idealBinSizeInHz:
        json[SNATCIT_CONFIG_JSON_KEYS.spectrogram][
          SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealBinSizeInHz
        ],
      idealMaxFrequencyInHz:
        json[SNATCIT_CONFIG_JSON_KEYS.spectrogram][
          SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealMaxFrequencyInHz
        ],
      idealWindowSizeInMs:
        json[SNATCIT_CONFIG_JSON_KEYS.spectrogram][
          SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealWindowSizeInMs
        ],
      idealStepSizeInMs:
        json[SNATCIT_CONFIG_JSON_KEYS.spectrogram][
          SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealStepSizeInMs
        ],
      colorScale:
        json[SNATCIT_CONFIG_JSON_KEYS.spectrogram][
          SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.colorScale
        ],
      backgroundColor:
        json[SNATCIT_CONFIG_JSON_KEYS.spectrogram][
          SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.backgroundColor
        ],
    };
    const providedFieldNames =
      json[SNATCIT_CONFIG_JSON_KEYS.providedFieldNames];
    const derivedFields = json[SNATCIT_CONFIG_JSON_KEYS.derivedFields].map(
      (rawDerivedField: any) => ({
        name: rawDerivedField[SNATCIT_CONFIG_JSON_KEYS.derivedFieldKeys.name],
        cmamekSrc:
          rawDerivedField[SNATCIT_CONFIG_JSON_KEYS.derivedFieldKeys.cmamekSrc],
      })
    );
    const defaultValues = json[SNATCIT_CONFIG_JSON_KEYS.defaultValues];
    const fieldColors = json[SNATCIT_CONFIG_JSON_KEYS.fieldColors];
    const playedSegmentColor =
      json[SNATCIT_CONFIG_JSON_KEYS.playedSegmentColor];
    const entries = json[SNATCIT_CONFIG_JSON_KEYS.entries].map(
      (rawEntry: any) => ({
        name: rawEntry[SNATCIT_CONFIG_JSON_KEYS.entryKeys.name],
        providedFieldValues:
          rawEntry[SNATCIT_CONFIG_JSON_KEYS.entryKeys.providedFieldValues],
      })
    );

    const allFieldNames = providedFieldNames.concat(
      derivedFields.map((f: { name: string }) => f.name)
    );

    if (
      !Number.isNaN(creationDate.getTime()) &&
      typeof fileToSnapauMap === "object" &&
      fileToSnapauMap !== null &&
      !Array.isArray(fileToSnapauMap) &&
      Object.values(fileToSnapauMap).every(
        (virtualFileNamesArr: any) =>
          virtualFileNamesArr.every(
            (virtualFileName: unknown) => typeof virtualFileName === "string"
          ) as boolean
      ) &&
      !hasDuplicate<string>(
        Object.values<string>(fileToSnapauMap).flat(),
        (a, b) => a === b
      ) &&
      ALL_UNRECOGNIZE_FILE_REACTIONS.includes(unrecognizedFileReaction) &&
      typeof spectrogram.idealBinSizeInHz === "number" &&
      typeof spectrogram.idealMaxFrequencyInHz === "number" &&
      typeof spectrogram.idealWindowSizeInMs === "number" &&
      typeof spectrogram.idealStepSizeInMs === "number" &&
      (spectrogram.colorScale.every(
        (colorScalePoint: any) =>
          Array.isArray(colorScalePoint) &&
          colorScalePoint.length === 2 &&
          typeof colorScalePoint[0] === "number" &&
          isValidRgbTuple(colorScalePoint[1])
      ) as boolean) &&
      isValidRgbTuple(spectrogram.backgroundColor) &&
      Array.isArray(providedFieldNames) &&
      providedFieldNames.every((fieldName) => typeof fieldName === "string") &&
      (derivedFields.every(
        (derivedField: any) =>
          typeof derivedField.name === "string" &&
          typeof derivedField.cmamekSrc === "string"
      ) as boolean) &&
      !hasDuplicate<string>(allFieldNames, (a, b) => a === b) &&
      providedFieldNames.every(
        (fieldName) => typeof defaultValues[fieldName] === "number"
      ) &&
      (allFieldNames.every((fieldName: string) =>
        isValidRgbTuple(fieldColors[fieldName])
      ) as boolean) &&
      isValidRgbaTuple(playedSegmentColor) &&
      (entries.every(
        (entry: any) =>
          typeof entry.name === "string" &&
          typeof entry.providedFieldValues === "object" &&
          entry.providedFieldValues !== null
      ) as boolean) &&
      !hasDuplicate<{ name: string }>(entries, (a, b) => a.name === b.name)
    ) {
      return {
        error: undefined,
        config: {
          creationDate,
          fileToSnapauMap,
          unrecognizedFileReaction,
          spectrogram,
          providedFieldNames,
          derivedFields,
          defaultValues,
          fieldColors,
          playedSegmentColor,
          entries,
        },
      };
    }
    return { error: "invalid_json_shape" };
  } catch {
    return { error: "invalid_json_shape" };
  }
}

function isValidRgbTuple(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length === 3 &&
    v.every(
      (colorComponent) =>
        typeof colorComponent === "number" &&
        Number.isInteger(colorComponent) &&
        0 <= colorComponent &&
        colorComponent <= 255
    )
  );
}

function isValidRgbaTuple(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length === 4 &&
    v.every(
      (colorComponent) =>
        typeof colorComponent === "number" &&
        Number.isInteger(colorComponent) &&
        0 <= colorComponent &&
        colorComponent <= 255
    )
  );
}

export function stringifyConfig(config: SnatcitConfig): string {
  return JSON.stringify(
    {
      [SNATCIT_CONFIG_JSON_KEYS.creationDateString]:
        config.creationDate.toISOString(),
      [SNATCIT_CONFIG_JSON_KEYS.fileToSnapauMap]: config.fileToSnapauMap,
      [SNATCIT_CONFIG_JSON_KEYS.unrecognizedFileReaction]:
        config.unrecognizedFileReaction,
      [SNATCIT_CONFIG_JSON_KEYS.spectrogram]: {
        [SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealBinSizeInHz]:
          config.spectrogram.idealBinSizeInHz,
        [SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealMaxFrequencyInHz]:
          config.spectrogram.idealMaxFrequencyInHz,
        [SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealWindowSizeInMs]:
          config.spectrogram.idealWindowSizeInMs,
        [SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealStepSizeInMs]:
          config.spectrogram.idealStepSizeInMs,
        [SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.colorScale]:
          config.spectrogram.colorScale,
        [SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.backgroundColor]:
          config.spectrogram.backgroundColor,
      },
      [SNATCIT_CONFIG_JSON_KEYS.providedFieldNames]: config.providedFieldNames,
      [SNATCIT_CONFIG_JSON_KEYS.derivedFields]: config.derivedFields.map(
        (derivedField) => ({
          [SNATCIT_CONFIG_JSON_KEYS.derivedFieldKeys.name]: derivedField.name,
          [SNATCIT_CONFIG_JSON_KEYS.derivedFieldKeys.cmamekSrc]:
            derivedField.cmamekSrc,
        })
      ),
      [SNATCIT_CONFIG_JSON_KEYS.defaultValues]: config.defaultValues,
      [SNATCIT_CONFIG_JSON_KEYS.fieldColors]: config.fieldColors,
      [SNATCIT_CONFIG_JSON_KEYS.playedSegmentColor]: config.playedSegmentColor,
      [SNATCIT_CONFIG_JSON_KEYS.entries]: config.entries.map((entry) => ({
        [SNATCIT_CONFIG_JSON_KEYS.entryKeys.name]: entry.name,
        [SNATCIT_CONFIG_JSON_KEYS.entryKeys.providedFieldValues]:
          entry.providedFieldValues,
      })),
    },
    null,
    4
  );
}

export function getAllFieldValuesForEntry(
  config: SnatcitConfig,
  snapauName: string
): {
  computedValues: LabeledFieldValue[];
  namesOfDerivedFieldsThatCouldNotBeComputed: string[];
} {
  const providedFieldValues: { [fieldName: string]: undefined | number } =
    config.entries.find((entry) => entry.name === snapauName)
      ?.providedFieldValues ?? {};
  const computedValues: LabeledFieldValue[] = [];
  const namesOfDerivedFieldsThatCouldNotBeComputed: string[] = [];

  for (let i = 0; i < config.providedFieldNames.length; ++i) {
    const fieldName = config.providedFieldNames[i];
    const value =
      providedFieldValues[fieldName] ?? config.defaultValues[fieldName];
    if (value === undefined) {
      throw new Error(
        "Bad config file: No default given for field " + fieldName
      );
    }

    computedValues.push({ fieldName, value, wasProvided: true });
  }

  for (let i = 0; i < config.derivedFields.length; ++i) {
    const { name, cmamekSrc } = config.derivedFields[i];
    const context = Object.fromEntries(
      computedValues
        .map((v) => [v.fieldName, v.value])
        .concat(
          namesOfDerivedFieldsThatCouldNotBeComputed.map((name) => [name, NaN])
        )
    );
    const evalRes = evalCmamekExpression(cmamekSrc, context);

    if (evalRes.succeeded && Number.isFinite(evalRes.value)) {
      computedValues.push({
        fieldName: name,
        value: evalRes.value,
        wasProvided: false,
      });
    } else {
      namesOfDerivedFieldsThatCouldNotBeComputed.push(name);
    }
  }

  return { computedValues, namesOfDerivedFieldsThatCouldNotBeComputed };
}

export function updateConfig(
  config: SnatcitConfig,
  snapauName: string,
  providedFieldName: string,
  value: number
): SnatcitConfig {
  const existingEntry = config.entries.find(
    (entry) => entry.name === snapauName
  );
  const previousEffectiveEntry: Entry = existingEntry ?? {
    name: snapauName,
    providedFieldValues: Object.fromEntries(
      getAllFieldValuesForEntry(config, snapauName)
        .computedValues.filter((fieldEntry) => fieldEntry.wasProvided)
        .map((fieldEntry) => [fieldEntry.fieldName, fieldEntry.value])
    ),
  };
  const updatedEntry: Entry = {
    ...previousEffectiveEntry,
    providedFieldValues: {
      ...previousEffectiveEntry.providedFieldValues,
      [providedFieldName]: value,
    },
  };
  return {
    ...config,
    entries:
      existingEntry === undefined
        ? config.entries.concat([updatedEntry])
        : config.entries.map((entry) =>
            entry.name === snapauName ? updatedEntry : entry
          ),
  };
}
