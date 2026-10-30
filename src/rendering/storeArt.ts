import { Skia, PaintStyle, type SkCanvas } from "@shopify/react-native-skia";

export function drawCoinBundle(c: SkCanvas, tier: number) {
  const ink = "#19212b";
  function shape(path: string, color: string, width = 2.5) {
    const p = Skia.Path.MakeFromSVGString(path)!;
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setColor(Skia.Color(color));
    c.drawPath(p, paint);
    paint.setColor(Skia.Color(ink));
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(width);
    c.drawPath(p, paint);
  }
  function oval(x: number, y: number, w: number, h: number, color: string) {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    c.drawOval(Skia.XYWHRect(x, y, w, h), p);
  }
  function coin(x: number, y: number, r = 11) {
    oval(x - r, y - r, r * 2, r * 2, ink);
    oval(x - r + 2, y - r + 2, r * 2 - 4, r * 2 - 4, "#ffcb48");
    shape(
      "M" + x + " " + (y - r + 5) + " L" + x + " " + (y + r - 5),
      "#ffcb48",
      2,
    );
  }
  function stack(x: number, bottom: number, count: number, w = 22) {
    for (let row = 0; row < count; row++) {
      const y = bottom - row * 5;
      shape(
        "M" +
          (x - w / 2) +
          " " +
          y +
          " L" +
          (x - w / 2) +
          " " +
          (y - 5) +
          " Q" +
          x +
          " " +
          (y - 10) +
          " " +
          (x + w / 2) +
          " " +
          (y - 5) +
          " L" +
          (x + w / 2) +
          " " +
          y +
          " Q" +
          x +
          " " +
          (y + 5) +
          " " +
          (x - w / 2) +
          " " +
          y +
          " Z",
        "#eab331",
        1.5,
      );
      oval(x - w / 2 + 1, y - 8, w - 2, 6, "#ffdc6b");
    }
  }
  if (tier === 0) {
    shape(
      "M48 35 L42 22 Q63 28 82 22 L76 35 C86 49 94 64 91 79 Q88 92 63 92 Q38 92 35 79 C31 64 39 48 48 35 Z",
      "#b88751",
    );
    shape("M47 34 L77 34 L77 40 L47 40 Z", "#775039", 2);
    coin(76, 89, 15);
  } else if (tier === 1) {
    shape(
      "M43 31 L36 14 Q63 21 91 14 L84 32 C96 49 105 69 101 84 Q97 99 64 99 Q31 99 27 84 C23 67 33 47 43 31 Z",
      "#a77a48",
    );
    shape("M42 31 L85 31 L85 38 L42 38 Z", "#725039", 2);
    coin(42, 94, 12);
    coin(81, 92, 14);
    coin(63, 100, 12);
  } else if (tier === 2) {
    shape("M20 44 L105 44 L105 89 L20 89 Z", "#9f693e");
    shape("M20 44 Q20 21 40 21 L85 21 Q105 21 105 44 Z", "#bf8952");
    shape("M20 43 L105 43 L105 50 L20 50 Z", "#d9ad52", 2);
    shape(
      "M33 24 L40 22 L40 89 L33 89 Z M85 22 L92 24 L92 89 L85 89 Z",
      "#d9ad52",
      2,
    );
    shape("M57 45 L68 45 L68 59 L57 59 Z", "#ffda70", 2);
    stack(32, 99, 3);
    stack(59, 101, 5);
    stack(87, 99, 3);
    coin(104, 99, 9);
  } else {
    // The open door swings right, exposing rows of gold inside the safe.
    shape("M13 13 L91 13 L91 99 L13 99 Z", "#8a9ba9");
    shape("M21 23 L83 23 L83 90 L21 90 Z", "#283646", 2);
    stack(35, 53, 4, 19);
    stack(60, 53, 5, 19);
    shape("M23 56 L82 56 L82 60 L23 60 Z", "#8a9ba9", 1.5);
    stack(36, 86, 4, 20);
    stack(63, 86, 5, 20);
    shape("M91 22 L119 35 L119 99 L91 88 Z", "#9fadb9");
    shape("M97 34 L113 41 L113 86 L97 80 Z", "#64788c", 2);
    oval(100, 54, 9, 15, ink);
    oval(102, 56, 5, 11, "#c5d2dc");
    stack(28, 103, 2, 21);
    stack(57, 105, 3, 21);
  }
}
