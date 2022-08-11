const SNAFED_CONFIG_JSON_KEYS = {
  creationDateString: "creation_date",
  divisionSets: "division_sets",
  divisionSetKeys: {
    name: "name",
    divisions: "divisions",
  },
} as const;

export interface SnafedConfig {
  readonly creationDate: Date;
  readonly providedFields: string[];
  readonly derivedFields: CmamekSrc[];
  readonly entries: readonly Entry[];
}

export interface CmamekSrc {
  readonly cmamekSrc: string;
}

export interface Entry {
  readonly name: string;
  readonly providedFieldValues: readonly number[];
}

// export function parseConfig(
//   src: string
// ):
//   | { error: "invalid_json_syntax" }
//   | { error: "invalid_json_shape" }
//   | { error: undefined; config: SnafedConfig } {
//   let json: Record<string, any>;
//   try {
//     json = JSON.parse(src);
//   } catch {
//     return { error: "invalid_json_syntax" };
//   }

//   try {
//     const divisionSets = json[SNAFED_CONFIG_JSON_KEYS.divisionSets];
//     const creationDateString = json[SNAFED_CONFIG_JSON_KEYS.creationDateString];
//     const creationDate = new Date(creationDateString);
//     if (
//       Array.isArray(divisionSets) &&
//       divisionSets.every(isDivisionSet) &&
//       !isNaN(creationDate.getTime())
//     ) {
//       return { error: undefined, config: { divisionSets, creationDate } };
//     }
//     return { error: "invalid_json_shape" };
//   } catch {
//     return { error: "invalid_json_shape" };
//   }
// }

// function isDivisionSet(x: unknown): x is DivisionSet {
//   try {
//     const unsafeX = x as any;
//     const name = unsafeX[SNAFED_CONFIG_JSON_KEYS.divisionSetKeys.name];
//     const divisions =
//       unsafeX[SNAFED_CONFIG_JSON_KEYS.divisionSetKeys.divisions];
//     return (
//       typeof name === "string" &&
//       typeof divisions === "object" &&
//       divisions !== null &&
//       Object.values(divisions).every((n) => Number.isFinite(n))
//     );
//   } catch {
//     return false;
//   }
// }

// export function stringifyConfig(config: SnafedConfig): string {
//   return JSON.stringify(
//     {
//       [SNAFED_CONFIG_JSON_KEYS.creationDateString]:
//         config.creationDate.toISOString(),
//       [SNAFED_CONFIG_JSON_KEYS.divisionSets]: config.divisionSets.map(
//         (divisionSet) => ({
//           [SNAFED_CONFIG_JSON_KEYS.divisionSetKeys.name]: divisionSet.name,
//           [SNAFED_CONFIG_JSON_KEYS.divisionSetKeys.divisions]:
//             divisionSet.divisions,
//         })
//       ),
//     },
//     null,
//     4
//   );
// }
