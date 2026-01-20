interface AlfredItem {
  title: string;
  subtitle: string;
  arg: string;
  icon: { path: string };
}

interface AlfredResult {
  items: AlfredItem[];
}

interface ColorVariation {
  name: string;
  hex: string;
}

function run(argv: string[]): string {
  let query = argv[0].replace("#", "").trim();

  if (!/^([0-9A-F]{3}){1,2}$/i.test(query)) {
    return JSON.stringify({ items: [{ title: "Invalid Hex Code" }] });
  }
  if (query.length === 3)
    query = query
      .split("")
      .map((c) => c + c)
      .join("");

  // --- Helpers ---
  const hexToRgb = (hex: string): [number, number, number] =>
    [0, 2, 4].map((p) => parseInt(hex.substring(p, p + 2), 16)) as [number, number, number];

  const rgbToHex = (r: number, g: number, b: number): string =>
    "#" +
    [r, g, b]
      .map((x) =>
        Math.max(0, Math.min(255, Math.round(x)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase();

  // HSL is better for shifting Hues (Analogous/Triadic)
  function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else if (max === b) h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToHex(h: number, s: number, l: number): string {
    h = (h + 1) % 1;
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return rgbToHex(
      hue2rgb(p, q, h + 1 / 3) * 255,
      hue2rgb(p, q, h) * 255,
      hue2rgb(p, q, h - 1 / 3) * 255,
    );
  }

  const [r, g, b] = hexToRgb(query);
  const [h, s, l] = rgbToHsl(r, g, b);

  // --- The 9 Grid Slots ---
  // Position 5 (index 4) is the Original
  const variations: ColorVariation[] = [
    { name: "Lighter Tint", hex: hslToHex(h, s, l + 0.2) }, // 1
    { name: "Analogous Left", hex: hslToHex(h - 0.08, s, l) }, // 2
    { name: "Darker Shade", hex: hslToHex(h, s, l - 0.2) }, // 3
    { name: "Muted/Desaturated", hex: hslToHex(h, s * 0.5, l) }, // 4
    { name: "ORIGINAL", hex: "#" + query.toUpperCase() }, // 5 (Center)
    { name: "Vibrant/Saturated", hex: hslToHex(h, Math.min(1, s + 0.3), l) }, // 6
    { name: "Triadic Shift", hex: hslToHex(h + 0.33, s, l) }, // 7
    { name: "Analogous Right", hex: hslToHex(h + 0.08, s, l) }, // 8
    { name: "Complement", hex: hslToHex(h + 0.5, s, l) }, // 9
  ];

  const app = Application.currentApplication();
  app.includeStandardAdditions = true;
  const tmpDir = "/tmp/alfred_colors/";
  app.doShellScript(`mkdir -p "${tmpDir}"`);

  // Path to your magick binary - update if necessary
  const magickPath = "magick";

  const items: AlfredItem[] = variations.map((v) => {
    const rawHex = v.hex.replace("#", "");
    const iconPath = `${tmpDir}${rawHex}.png`;

    try {
      // Check if file exists to keep it fast
      app.doShellScript(
        `if [ ! -f "${iconPath}" ]; then ${magickPath} -size 128x128 xc:"${v.hex}" "${iconPath}"; fi`,
      );
    } catch (e) {}

    return {
      title: v.hex,
      subtitle: v.name,
      arg: v.hex,
      icon: { path: iconPath },
    };
  });

  return JSON.stringify({ items });
}
