/**
 * There's a weird bug in Chrome that causes the canvas to be cleared
 * if you call `fillRect` after calling `putImageData` using image data
 * from another canvas.
 * I would file a bug report, except I don't have the time to find a minimum
 * working example.
 * The bug seems really mysterious, which makes me think it will not be
 * easy to find the exact circumstances in which it occurs.
 * The bug does not occur when we use fresh image data, but it does occur
 * when we used cached image data.
 * At first, I thought it was a bug in our code, not Chrome.
 * However, I tested it with Safari, and it worked fine (without calling
 * this hack function), so it's clearly a problem with Chrome.
 *
 * Anyhow, I'm putting this in here for now, since I don't have time to
 * find a better solution.
 * If Chrome fixes this in a future version, we can remove it.
 */
export function hackToCircumventWeirdChromeBug__clearCanvasOfMysteriousCurse(
  ctx: CanvasRenderingContext2D
): void {
  const { width: canvasWidth, height: canvasHeight } = ctx.canvas;
  ctx.putImageData(ctx.getImageData(0, 0, canvasWidth, canvasHeight), 0, 0);
}
