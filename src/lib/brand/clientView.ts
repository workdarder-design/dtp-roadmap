/** Dubai Culture logo palette — used for client hero gradient and accents. */
export const CLIENT_LOGO_COLORS = {
  highlight: "#9A50A5",
  main: "#763291",
  deep: "#652D86",
  shadow: "#4A205A",
} as const;

/** Served from `public/dcaa-logo.svg` (official Dubai Culture artwork). */
export const CLIENT_LOGO_PATH = "/dcaa-logo.svg";

export function clientHeroGradient(): string {
  const { highlight, main, shadow } = CLIENT_LOGO_COLORS;
  return `linear-gradient(120deg, ${highlight} 0%, ${main} 45%, ${CLIENT_LOGO_COLORS.deep} 70%, ${shadow} 100%)`;
}

/** Text on purple hero — high contrast on logo tones. */
export const clientHeroTextClass = "text-white";
