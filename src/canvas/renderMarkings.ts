import { LabeledFieldValue } from "../config";
import { RenderConfig, rgbTupleToCssFillStyle } from "./calculationUtils";
import { hackToCircumventWeirdChromeBug__clearCanvasOfMysteriousCurse } from "./utilsWithSideEffects";

export function renderMarkings(
  renderConfig: RenderConfig,
  computedValues: readonly LabeledFieldValue[]
): void {
  const { ctx, audioBuffer, snatcitConfig } = renderConfig;
  const { width: canvasWidth, height: canvasHeight } = ctx.canvas;
  const audioBufferDurationInMs = audioBuffer.duration * 1e3;
  for (let i = 0; i < computedValues.length; ++i) {
    const { fieldName, value } = computedValues[i];
    const unclamped = value / audioBufferDurationInMs;
    const clamped = Math.max(0, Math.min(unclamped, 1));
    const x = Math.min(canvasWidth, clamped * canvasWidth);
    const fieldColor = snatcitConfig.fieldColors[fieldName];
    if (fieldColor === undefined) {
      throw new Error("Cannot find color for field " + fieldName);
    }

    hackToCircumventWeirdChromeBug__clearCanvasOfMysteriousCurse(ctx);

    ctx.fillStyle = rgbTupleToCssFillStyle(fieldColor);
    ctx.fillRect(x, 0, 1, canvasHeight);
  }
}
