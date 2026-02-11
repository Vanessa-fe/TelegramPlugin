export type TextElementStyle = "TEXT" | "H1" | "H2" | "H3";
export type TextElementAlign = "left" | "center";

export interface TextElementSettings {
  style?: TextElementStyle;
  align?: TextElementAlign;
  width?: number;
  marginTop?: number;
  marginBottom?: number;
}

const DEFAULT_SETTINGS: Required<TextElementSettings> = {
  style: "TEXT",
  align: "center",
  width: 100,
  marginTop: 0,
  marginBottom: 0,
};

const STYLE_VALUES: TextElementStyle[] = ["TEXT", "H1", "H2", "H3"];

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function normalizeTextSettings(
  settings: Record<string, unknown> | null | undefined
): Required<TextElementSettings> {
  if (!settings) return { ...DEFAULT_SETTINGS };

  const style = STYLE_VALUES.includes(settings.style as TextElementStyle)
    ? (settings.style as TextElementStyle)
    : DEFAULT_SETTINGS.style;
  const align =
    settings.align === "left" || settings.align === "center"
      ? (settings.align as TextElementAlign)
      : DEFAULT_SETTINGS.align;

  return {
    style,
    align,
    width: clampNumber(settings.width, 40, 100, DEFAULT_SETTINGS.width),
    marginTop: clampNumber(settings.marginTop, 0, 48, DEFAULT_SETTINGS.marginTop),
    marginBottom: clampNumber(
      settings.marginBottom,
      0,
      48,
      DEFAULT_SETTINGS.marginBottom
    ),
  };
}
