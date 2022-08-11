const SNATCIT_CONFIG_JSON_KEYS = {
  creationDateString: "creation_date",
  providedFieldNames: "provided_field_names",
  derivedFields: "derived_fields",
  entries: "entries",

  derivedField: {
    name: "name",
    cmamekSrc: "cmamek_src",
  },
  entry: {
    name: "name",
    providedFieldValues: "provided_field_values",
  },
} as const;

export interface SnatcitConfig {
  readonly creationDate: Date;
  readonly providedFieldNames: string[];
  readonly derivedFields: DerivedField[];
  readonly entries: readonly Entry[];
}

export interface DerivedField {
  readonly name: string;
  readonly cmamekSrc: string;
}

export interface Entry {
  readonly name: string;
  readonly providedFieldValues: { readonly [fieldName: string]: number };
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
    const providedFieldNames =
      json[SNATCIT_CONFIG_JSON_KEYS.providedFieldNames];
    const derivedFields = json[SNATCIT_CONFIG_JSON_KEYS.derivedFields].map(
      (rawDerivedField: any) => ({
        name: rawDerivedField[SNATCIT_CONFIG_JSON_KEYS.derivedField.name],
        cmamekSrc:
          rawDerivedField[SNATCIT_CONFIG_JSON_KEYS.derivedField.cmamekSrc],
      })
    );
    const entries = json[SNATCIT_CONFIG_JSON_KEYS.entries].map(
      (rawEntry: any) => ({
        name: rawEntry[SNATCIT_CONFIG_JSON_KEYS.entry.name],
        providedFieldValues:
          rawEntry[SNATCIT_CONFIG_JSON_KEYS.entry.providedFieldValues],
      })
    );

    if (
      !Number.isNaN(creationDate.getTime()) &&
      Array.isArray(providedFieldNames) &&
      providedFieldNames.every((fieldName) => typeof fieldName === "string") &&
      derivedFields.every(
        (derivedField: any) =>
          typeof derivedField.name === "string" &&
          typeof derivedField.cmamekSrc === "string"
      ) &&
      entries.every(
        (entry: any) =>
          typeof entry.name === "string" &&
          typeof entry.providedFieldValues === "object" &&
          entry.providedFieldValues !== null
      )
    ) {
      return {
        error: undefined,
        config: { creationDate, providedFieldNames, derivedFields, entries },
      };
    }
    return { error: "invalid_json_shape" };
  } catch {
    return { error: "invalid_json_shape" };
  }
}

export function stringifyConfig(config: SnatcitConfig): string {
  return JSON.stringify(
    {
      [SNATCIT_CONFIG_JSON_KEYS.creationDateString]:
        config.creationDate.toISOString(),
      [SNATCIT_CONFIG_JSON_KEYS.providedFieldNames]: config.providedFieldNames,
      [SNATCIT_CONFIG_JSON_KEYS.derivedFields]: config.derivedFields.map(
        (derivedField) => ({
          [SNATCIT_CONFIG_JSON_KEYS.derivedField.name]: derivedField.name,
          [SNATCIT_CONFIG_JSON_KEYS.derivedField.cmamekSrc]:
            derivedField.cmamekSrc,
        })
      ),
      [SNATCIT_CONFIG_JSON_KEYS.entries]: config.entries.map((entry) => ({
        [SNATCIT_CONFIG_JSON_KEYS.entry.name]: entry.name,
        [SNATCIT_CONFIG_JSON_KEYS.entry.providedFieldValues]:
          entry.providedFieldValues,
      })),
    },
    null,
    4
  );
}
