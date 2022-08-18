# Snatcit User Guide

## Core Concepts

> Note: If you are impatient, you can skip this section and head straight to the [Getting Started section](#getting-started). However, it is highly recommended that you read this section first, so you will understand the terminology used in the Getting Started section.

### Snatcit's Purpose

Sometimes, we have an audio file, and we want to identify which time ranges in that file correspond to certain audio features.

#### Why do we care about audio feature time ranges?

> You can skip this section if you already understand the motivation for
> identifying audio feature time ranges (e.g., you know what UTAU's `oto.ini` is).

There are many possible motivations, but I will provide one example.
Suppose we're building a voicebank for use in a singing voice synthesizer.

> For those that don't know, a voicebank is basically a collection of syllables that can be pitch-corrected and strung together in order to synthesize a song.

Suppose we have a recording of someone saying "law lee lieu lay low".
We may want to take this file and split it into useful features.
For example, the most obvious feature to identify would probably be the syllable (i.e., one for "law", one for "lee", etc.).

Furthermore, we may want to further divide those features (e.g., syllables) into sub-features (e.g., we could split "law" into the consonant "l" and vowel "aw").

> In the English-speaking [UTAU](https://en.wikipedia.org/wiki/Utau) community, this is sometimes called "oto-ing".

Now, you _could_ open your favorite audio editor (e.g., Audacity), select a playback range, play it, adjust the range a little, repeat until you get the correct range, type the time values into a file (e.g., `oto.ini`), and then repeat for each feature.

However, having to manually type the time values into a file becomes extremely tedious if you're working with large datasets.
Furthermore, having to open and close each file might be a pain (depending on what audio editor you're using).

Snatcit aims to solve this. With Snatcit, you just need to upload all the files at the start, and then set the playback ranges. Snatcit will record the data in an output file (which you can download any time you want), so you don't have to worry about that.

### Terminology

- The top-level audio feature is called a _snapau_ (rhymes with "saw cow").
  In the UTAU community, this may be called a "phone". However, Snatcit is designed as a general-purpose feature labeler (although realistically, the primary use will probably be for oto-ing), so we avoid the use of the word "phone", and use the more general "snapau" instead.
  > Optional etymology snippet: "snapau" roughly translates to "sound part" in Lojban.
- The subfeatures are called _segments_. Each snapau is partitioned into one or more segments.
- A _snapau entry_ is a data structure that defines the start and end of each segment in a snapau. Each snapau has at most one snapau entry (if a snapau has no snapau entry, default values are used to compute the segments).
- The segment start and end times are determined by the values of _fields_.
  There are 2 kinds of fields:

  - _Provided fields_ - The user sets the sets these manually.
  - _Derived fields_ - These are automatically computed from other field values. The user cannot set these manually.

- Each field has exactly one _field value_. As previously stated, field values represent the borders of segments. For example, if I had a file that was `2000` milliseconds, and the field values `[500, 800, 1700]`, then the segments would be the intervals `[0, 500)`, `[500, 800)`, `[800, 1700)`, and `[1700, 2000]`.
- A `snatcit.json` file is any JSON file that has a name the starts with `snatcit` and ends with `.json`. To clarify, what we refer to as a "`snatcit.json` file" does **NOT** need to actually be named `snatcit.json`--the name just needs to start with `snatcit` and end with `.json`. These files are config files for Snatcit.

## Getting Started

### Part 1. Configure and launch

1. (Optional but highly recommended) Read the [Core Concepts section](#core-concepts) of this guide. If you skip it, you may not understand all the terminology used below.
2. Download one or more `snatcit.json` files and one or more audio files. A sample of each can be found in [this directory](../samples/).
3. Open [https://kylejlin.github.io/snatcit](https://kylejlin.github.io/snatcit).
4. Click the "Upload Files" button.
5. Select the `snatcit.json` files and the audio files.
6. Click the "Launch" button.

### Part 2. Set fields

1. Click on one of the input boxes under the "Fields" heading.
   1. Type in the desired value for the field. The value is given in milliseconds (from the start of the audio file).
   2. Congratulations! You edited your first field value.
2. Alternatively, you can set field values by clicking on the spectrogram.
   1. Notice that when you clicked on an input box, the surrounding box that contained both the input box and a label turned black. That indicates that you have _selected_ that field.
   2. If you click on the spectrogram while a field is selected, that field
      will be set to the position where you clicked.
3. Play audio:
   1. Make sure no field is selected. If a field is currently selected, you can unselect it by clicking anywhere in the field box except the input box (e.g., the field label).
   2. If you click on the spectrogram while no field is selected, the audio segment that you clicked on will be played. This is how you check your work (i.e., how you verify that you partitioned the audio into the desired segments).
4. Use the "Previous" and "Next" buttons to navigate to the previous/next snapau.
5. When you want to save your progress, you can click the "Download" button. A `snatcit.json` file will be saved.

## Useful Key Commands

- Press `z`: Undo
  - Alternatively, `u` will do the same thing (i.e., undo).
- Press `Shift + Z`: Redo
  - Alternatively, `y` will do the same thing (i.e., redo).
- Press `r`: Reset the field values (of the current snapau) to the defaults.
- Press `c`: Copy the field values of the current snapau to the clipboard.
- Press `v`: Paste the clipboard's values into the current snapau.
- Click on spectrogram while holding down `f`: Force play-on-click. Normally, if you click on the spectrogram while a field is selected, Snatcit will set the selected field's value to the mouse position. However, if `f` is held while you click, then Snatcit will play the audio segment underneath the mouse (just like if there was no field selected).
- Click on spectrogram while holding down `d`: Override distance preservation. This will make Snatcit ignore the `preserve_distance` field of `snatcit.json`, and set the selected field's value as if `preserve_distance` was omitted.

## Customizing `snatcit.json`

Let's look at a sample `snatcit.json` file.

```json
{
  "creation_date": "2022-08-11T22:33:40.282Z",
  "file_to_snapau_map": {
    "new_york_city.wav": ["new", "york", "city"]
  },
  "unrecognized_file_reaction": "map_to_single_snapau_of_same_name",
  "spectrogram": {
    "ideal_bin_size_in_hz": 50,
    "ideal_max_frequency_in_hz": 8000,
    "ideal_window_size_in_ms": 25,
    "ideal_step_size_in_ms": 10,
    "color_scale": [
      [0, [0, 0, 0]],
      [1, [255, 255, 255]]
    ],
    "background_color": [0, 0, 0]
  },
  "provided_field_names": ["offset", "preutterance", "fixed_region", "cutoff"],
  "derived_fields": [
    {
      "name": "overlap",
      "cmamek_src": "($floor (/ (+ offset preutterance) 2))"
    }
  ],
  "default_values": {
    "offset": 0,
    "preutterance": 0,
    "fixed_region": 0,
    "cutoff": 0
  },
  "preserve_distance": {
    "offset": ["preutterance", "fixed_region", "cutoff"],
    "preutterance": ["fixed_region", "cutoff"]
  },
  "field_colors": {
    "offset": [0, 0, 255],
    "overlap": [0, 255, 0],
    "preutterance": [255, 0, 0],
    "fixed_region": [255, 0, 255],
    "cutoff": [0, 0, 255]
  },
  "played_segment_color": [255, 255, 255, 128],
  "entries": []
}
```

We will describe each field below. Observe that all time values are given in
milliseconds relative to the start of the audio file.

| Field                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Examples                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `creation_date`                         | The date the file was created. This is an ISO date string.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `"2022-08-11T22:33:40.282Z"`                                                                                                           |
| `file_to_snapau_map`                    | An object mapping audio files to snapau.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `{ "new_york_city.wav": ["new", "york", "city"] }`                                                                                     |
| `unrecognized_file_reaction`            | A string specifying how to handle files whose names do not appear in the `file_to_selpau_map`. There are 3 options: `"ignore"`, `"error"`, and `"map_to_single_snapau_of_same_name"`. `"ignore"` will ignore the unrecognized files. `"error"` will prevent you from launching until the unrecognized files are deleted. `"map_to_single_snapau_of_same_name"` will create a snapau with the same name as the unrecognized file.                                                                                                                                                                                                                                                                                                                                                           | `"map_to_single_snapau_of_same_name"`                                                                                                  |
| `spectrogram.ideal_bin_size_in_hz`      | The ideal frequency bin size in Hertz.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `50`                                                                                                                                   |
| `spectrogram.ideal_max_frequency_in_hz` | The ideal upper bound of the spectrogram frequency range in Hertz (the lower bound is always zero).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `8000`                                                                                                                                 |
| `spectrogram.ideal_window_size_in_ms`   | The ideal spectrogram time window size in milliseconds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `25`                                                                                                                                   |
| `spectrogram.ideal_step_size_in_ms`     | The ideal spectrogram time step size in milliseconds. It is recommended that this value does not exceed `ideal_window_size_in_ms`, otherwise samples may be skipped.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `10`                                                                                                                                   |
| `spectrogram.color_scale`               | An array of `[amplitude, color]` tuples. `amplitude` must be between `0` and `1` (inclusive). `color` must be an unsigned eight-bit RGB tuple. That is, it must be an array with three elements, where each element is between `0` and `255` (inclusive). The `spectrogram.color_scale` array **MUST** have at least two elements. Colors are interpolated linearly.                                                                                                                                                                                                                                                                                                                                                                                                                       | `[[0.0, [0, 0 ,0]], [1.0, [255, 255, 255]]]`                                                                                           |
| `spectrogram.background_color`          | The spectrogram background color, given as an unsigned eight-bit RGB tuple.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `[0, 0, 0]`                                                                                                                            |
| `provided_field_names`                  | The names of the _provided fields_. Provided fields are fields that the user manually sets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `["offset", "preutterance", "fixed_region", "cutoff"]`                                                                                 |
| `derived_fields`                        | An array of _derived fields_. Derived fields are fields that are automatically computed based on the values of provided fields as well as the values of those derived fields that appear earlier in the `derived_fields` array. Derived fields cannot be directly set by the user. Each element in the array must have the form `{ "name": <NAME>, "cmamek_src" <CMAMEK_SRC> }`, where `<NAME>` is the name of the derived field, and `<CMAMEK_SRC>` is a [Cmamek](../src/lib/cmamek/README.md) expression that will be used to compute the derived field. If you want to learn more about the Cmamek programming language, please read the page linked above. <br> If the Cmamek code evaluates to an error value when used in the web app, the derived field value will be set to `NaN`. | `[{ "name": "overlap", "cmamek_src": "($floor (/ (+ offset preutterance) 2))" }]`                                                      |
| `default_values`                        | The default values for the provided fields. You **MUST** specify a default value for each provided field. Do **NOT** specify default values for derived fields--if you do, those defaults will be ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `{ "offset": 0, "preutterance": 0, "fixed_region": 0, "cutoff": 0 }`                                                                   |
| `preserve_distance`                     | OPTIONAL. Instructs Snatcit to preserve the distance between certain fields when certain fields are edited. The syntax is `{ <PRINCIPAL>: <COLLATERAL> }`, where `<PRINCIPAL>` is the name of the field that gets edited directly by the user, and `<COLLATERAL>` is an array of names of fields that get updated as a result. All field names must be provided field names; derived field names are forbidden. If you want to omit this, just don't include `preserve_distance` at all (i.e., no need to bother including it but setting it to `null`).                                                                                                                                                                                                                                   | `{ "offset": ["preutterance", "fixed_region", "cutoff"], "preutterance": ["fixed_region", "cutoff"] }`                                 |
| `field_colors`                          | The color to render each field marker on the spectrogram. You **MUST** specify a color for **ALL** fields (i.e., both provided and derived fields). Colors are given in unsigned eight-bit RGB tuples.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `{ "offset": [0, 0, 255], "overlap": [0, 255, 0], "preutterance": [255, 0, 0], "fixed_region": [255, 0, 255], "cutoff": [0, 0, 255] }` |
| `played_segment_color`                  | The color of the _played segment overlay_. The played segment overlay is the rectangle that gets rendered over the region of the spectrogram that is getting played. This value is an RGB**A** tuple, meaning it has _four_ (not three!) components. Each components must be between `0` and `255` (inclusive).                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `[255, 255, 255, 128]`                                                                                                                 |
| `entries`                               | An array of _snapau entries_. A snapau entry is a set of provided field values corresponding to a given snapau. There can be at most one snapau entry for each snapau. Generally, you should set this to `[]`, and let the app fill this out for you. <br> For those who want to manually edit this for some reason, please see the [Additional Notes](#additional-notes) below this table.                                                                                                                                                                                                                                                                                                                                                                                                | `[]`                                                                                                                                   |

### Additional Notes

- Every field must have a unique name.
- Each uploaded audio file must have a unique name.
- Each snapau must have a unique name.
- An element of `entries` takes the form `{ "name": <SNAPAU_NAME>, "provided_field_values": <VALUES> }`, where `<SNAPAU_NAME>` is the name of the snapau that the snapau entry is associated with, and `<VALUES>` is a map from provided field names to values (in milliseconds).

  For example (the below values are completely hypothetical):

  ```json
  {
    // ...other fields omitted for brevity
    "entries": [
      {
        "name": "new",
        "provided_field_values": {
          "offset": 700,
          "preutterance": 1000,
          "fixed_region": 1300,
          "cutoff": 2000
        }
      },
      {
        "name": "york",
        "provided_field_values": {
          "offset": 2200,
          "preutterance": 2400,
          "fixed_region": 3000,
          "cutoff": 3200
        }
      },
      {
        "name": "city",
        "provided_field_values": {
          "offset": 3400,
          "preutterance": 3600,
          "fixed_region": 3900,
          "cutoff": 4100
        }
      }
      // ...and so on...
    ]
  }
  ```

  Remember that there can only be at most one snapau entry per snapau.
