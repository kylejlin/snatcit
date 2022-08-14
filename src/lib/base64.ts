// Based on https://stackoverflow.com/a/30106551/7215455

/** Encoding UTF8 -> base64 */
export function base64FromUnicode(str: string) {
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/** Decoding base64 -> UTF8 */
export function unicodeFromBase64(str: string) {
  return decodeURIComponent(
    Array.prototype.map
      .call(
        window.atob(str),
        (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      )
      .join("")
  );
}
