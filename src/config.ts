import { evalCmamekExpression } from "./lib/cmamek";
import { hasDuplicates } from "./misc";

const SNATCIT_CONFIG_JSON_KEYS = {
  creationDateString: "creation_date",
  spectrogram: "spectrogram",
  providedFieldNames: "provided_field_names",
  derivedFields: "derived_fields",
  defaultValues: "default_values",
  entries: "entries",

  spectrogramKeys: {
    idealBinSizeInHz: "ideal_bin_size_in_hz",
    idealMaxFrequencyInHz: "ideal_max_frequency_in_hz",
    windowSizeInMs: "window_size_in_ms",
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

export interface SnatcitConfig {
  readonly creationDate: Date;
  readonly spectrogram: {
    readonly idealBinSizeInHz: number;
    readonly idealMaxFrequencyInHz: number;
    readonly windowSizeInMs: number;
    readonly colorScale: readonly (readonly [
      number,
      readonly [number, number, number]
    ])[];
    readonly backgroundColor: readonly [number, number, number];
  };
  readonly providedFieldNames: string[];
  readonly derivedFields: DerivedField[];
  readonly defaultValues: { [fieldName: string]: undefined | number };
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
    const spectrogram = {
      idealBinSizeInHz:
        json[SNATCIT_CONFIG_JSON_KEYS.spectrogram][
          SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealBinSizeInHz
        ],
      idealMaxFrequencyInHz:
        json[SNATCIT_CONFIG_JSON_KEYS.spectrogram][
          SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.idealMaxFrequencyInHz
        ],
      windowSizeInMs:
        json[SNATCIT_CONFIG_JSON_KEYS.spectrogram][
          SNATCIT_CONFIG_JSON_KEYS.spectrogramKeys.windowSizeInMs
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
    const entries = json[SNATCIT_CONFIG_JSON_KEYS.entries].map(
      (rawEntry: any) => ({
        name: rawEntry[SNATCIT_CONFIG_JSON_KEYS.entryKeys.name],
        providedFieldValues:
          rawEntry[SNATCIT_CONFIG_JSON_KEYS.entryKeys.providedFieldValues],
      })
    );

    if (
      !Number.isNaN(creationDate.getTime()) &&
      typeof spectrogram.idealBinSizeInHz === "number" &&
      typeof spectrogram.idealMaxFrequencyInHz === "number" &&
      typeof spectrogram.windowSizeInMs === "number" &&
      spectrogram.colorScale.every(
        (colorScalePoint: any) =>
          Array.isArray(colorScalePoint) &&
          colorScalePoint.length === 2 &&
          typeof colorScalePoint[0] === "number" &&
          isValidRgbTuple(colorScalePoint[1])
      ) &&
      isValidRgbTuple(spectrogram.backgroundColor) &&
      Array.isArray(providedFieldNames) &&
      providedFieldNames.every((fieldName) => typeof fieldName === "string") &&
      derivedFields.every(
        (derivedField: any) =>
          typeof derivedField.name === "string" &&
          typeof derivedField.cmamekSrc === "string"
      ) &&
      !hasDuplicates<string>(
        providedFieldNames.concat(
          derivedFields.map((f: { name: string }) => f.name)
        ),
        (a, b) => a === b
      ) &&
      providedFieldNames.every(
        (fieldName) => typeof defaultValues[fieldName] === "number"
      ) &&
      entries.every(
        (entry: any) =>
          typeof entry.name === "string" &&
          typeof entry.providedFieldValues === "object" &&
          entry.providedFieldValues !== null
      ) &&
      !hasDuplicates<{ name: string }>(entries, (a, b) => a.name === b.name)
    ) {
      return {
        error: undefined,
        config: {
          creationDate,
          spectrogram,
          providedFieldNames,
          derivedFields,
          defaultValues,
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
    v.every((colorComponent) => typeof colorComponent === "number")
  );
}

export function stringifyConfig(config: SnatcitConfig): string {
  return JSON.stringify(
    {
      [SNATCIT_CONFIG_JSON_KEYS.creationDateString]:
        config.creationDate.toISOString(),
      [SNATCIT_CONFIG_JSON_KEYS.providedFieldNames]: config.providedFieldNames,
      [SNATCIT_CONFIG_JSON_KEYS.derivedFields]: config.derivedFields.map(
        (derivedField) => ({
          [SNATCIT_CONFIG_JSON_KEYS.derivedFieldKeys.name]: derivedField.name,
          [SNATCIT_CONFIG_JSON_KEYS.derivedFieldKeys.cmamekSrc]:
            derivedField.cmamekSrc,
        })
      ),
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
  fileName: string
): {
  computedValues: LabeledFieldValue[];
  namesOfDerivedFieldsThatCouldNotBeComputed: string[];
} {
  const providedFieldValues: { [fieldName: string]: undefined | number } =
    config.entries.find((entry) => entry.name === fileName)
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

    computedValues.push({ fieldName, value });
  }

  for (let i = 0; i < config.derivedFields.length; ++i) {
    const { name, cmamekSrc } = config.derivedFields[i];
    const context = Object.fromEntries(
      computedValues.map((v) => [v.fieldName, v.value])
    );
    const evalRes = evalCmamekExpression(cmamekSrc, context);

    if (evalRes.succeeded) {
      computedValues.push({ fieldName: name, value: evalRes.value });
    } else {
      namesOfDerivedFieldsThatCouldNotBeComputed.push(name);
    }
  }

  return { computedValues, namesOfDerivedFieldsThatCouldNotBeComputed };
}
