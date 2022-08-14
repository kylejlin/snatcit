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

export function hasDuplicate<T>(
  arr: readonly T[],
  isEqual: (a: T, b: T) => boolean
): boolean {
  return getArbitraryDuplicate(arr, isEqual).hasDuplicate;
}

export function getArbitraryDuplicate<T>(
  arr: readonly T[],
  isEqual: (a: T, b: T) => boolean
): { hasDuplicate: true; duplicate: T } | { hasDuplicate: false } {
  for (let i = 0; i < arr.length; ++i) {
    for (let j = i + 1; j < arr.length; ++j) {
      if (isEqual(arr[i], arr[j])) {
        return { hasDuplicate: true, duplicate: arr[i] };
      }
    }
  }
  return { hasDuplicate: false };
}

export function roundUpToPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export function getAttributeFromNearestAncestor(
  element: unknown,
  name: string
): string | undefined {
  if (!(element instanceof HTMLElement)) {
    return;
  }
  let e: HTMLElement = element;
  while (e !== null) {
    const value = e.getAttribute(name);
    if (value !== null) {
      return value;
    }
    if (e.parentElement === null) {
      return;
    }
    e = e.parentElement;
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noOp(): void {}

export function toLowerCaseIfString<T = unknown>(x: T): T {
  if (typeof x === "string") {
    return x.toLowerCase() as unknown as T;
  } else {
    return x;
  }
}
