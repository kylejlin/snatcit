export function clampedLerp({
  start,
  end,
  factor,
}: {
  start: number;
  end: number;
  factor: number;
}): number {
  const clampedFactor = Math.max(0, Math.min(factor, 1));
  return start + (end - start) * clampedFactor;
}

export function getGithubUsernameOfHost(): undefined | string {
  const m = window.location.host.match(/^([\w-]+)\.github\.io$/);
  if (m === null) {
    return;
  }
  return m[1];
}

export function isAudioFile(file: File): boolean {
  return /\.(?:wav|ogg|mp3|mkv)$/.test(file.name);
}

export function filterMap<T, U>(
  arr: readonly T[],
  f: (x: T) => { keep: false } | { keep: true; value: U }
): U[] {
  const result: U[] = [];
  for (let i = 0; i < arr.length; ++i) {
    const x = arr[i];
    const y = f(x);
    if (y.keep) {
      result.push(y.value);
    }
  }
  return result;
}

export function hasDuplicates<T>(
  arr: readonly T[],
  isEqual: (a: T, b: T) => boolean
): boolean {
  for (let i = 0; i < arr.length; ++i) {
    for (let j = i + 1; j < arr.length; ++j) {
      if (isEqual(arr[i], arr[j])) {
        return true;
      }
    }
  }
  return false;
}
