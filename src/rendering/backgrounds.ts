import { Skia, PaintStyle, SkCanvas, SkPath } from "@shopify/react-native-skia";
import { battleTheme } from "./themes";

const paint = Skia.Paint();
paint.setAntiAlias(true);
function ink(color: string) {
  paint.setShader(null);
  paint.setColor(Skia.Color(color));
  paint.setStyle(PaintStyle.Fill);
  return paint;
}
function gradient(y: number, height: number, colors: string[]) {
  ink("#ffffff");
  paint.setShader(
    Skia.Shader.MakeLinearGradient(
      Skia.Point(0, y),
      Skia.Point(800, y + height),
      colors.map((color) => Skia.Color(color)),
      null,
      0,
    ),
  );
  return paint;
}
function stroke(c: SkCanvas, path: SkPath, color: string, width: number) {
  ink(color);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(1);
  paint.setStrokeJoin(1);
  c.drawPath(path, paint);
}
function line(
  c: SkCanvas,
  x: number,
  y: number,
  xx: number,
  yy: number,
  color: string,
  width: number,
) {
  const path = Skia.Path.Make();
  path.moveTo(x, y);
  path.lineTo(xx, yy);
  stroke(c, path, color, width);
}

// Crisp mountain facets and flowing sand/lava share unsnapped, anti-aliased paths.
function terrainPath(points: number[][], close = true, smooth = false) {
  const path = Skia.Path.Make();
  path.moveTo(points[0][0], points[0][1]);
  if (smooth) {
    const point = (i: number) =>
      close
        ? points[(i + points.length) % points.length]
        : points[Math.max(0, Math.min(points.length - 1, i))];
    const segments = close ? points.length : points.length - 1;
    for (let i = 0; i < segments; i++) {
      const a = point(i - 1),
        b = point(i),
        c = point(i + 1),
        d = point(i + 2);
      path.cubicTo(
        b[0] + (c[0] - a[0]) / 6,
        b[1] + (c[1] - a[1]) / 6,
        c[0] - (d[0] - b[0]) / 6,
        c[1] - (d[1] - b[1]) / 6,
        c[0],
        c[1],
      );
    }
  } else {
    for (const [x, y] of points.slice(1)) path.lineTo(x, y);
  }
  if (close) path.close();
  return path;
}
function mountainRange(
  c: SkCanvas,
  top: number,
  height: number,
  bottom: boolean,
) {
  const p = (points: number[][]) =>
    points.map(([x, y]) => [(bottom ? 1 - x : x) * 1000, top + y * height]);
  const shape = (points: number[][], color: string) =>
    c.drawPath(terrainPath(p(points)), ink(color));
  // Continuous rock faces fill the field: two broad peaks, no scattered mountain icons.
  shape(
    [
      [-0.1, 0.5],
      [0.2, 0.04],
      [0.46, 0.43],
      [0.71, 0.1],
      [1.1, 0.54],
      [1.1, 1.1],
      [-0.1, 1.1],
    ],
    "#77848e",
  );
  shape(
    [
      [-0.1, 0.5],
      [0.2, 0.04],
      [0.16, 0.42],
      [0.3, 0.78],
      [0.12, 1.1],
      [-0.1, 1.1],
    ],
    "#95a2ab",
  );
  shape(
    [
      [0.2, 0.04],
      [0.46, 0.43],
      [0.62, 0.83],
      [0.3, 0.78],
      [0.16, 0.42],
    ],
    "#65747f",
  );
  shape(
    [
      [0.46, 0.43],
      [0.71, 0.1],
      [0.63, 0.47],
      [0.78, 0.85],
      [0.51, 1.1],
      [0.29, 1.1],
    ],
    "#8998a1",
  );
  shape(
    [
      [0.71, 0.1],
      [1.1, 0.54],
      [1.1, 1.1],
      [0.78, 0.85],
      [0.63, 0.47],
    ],
    "#596b78",
  );
  shape(
    [
      [0.08, 0.22],
      [0.2, 0.04],
      [0.34, 0.25],
      [0.27, 0.21],
      [0.25, 0.31],
      [0.18, 0.23],
      [0.12, 0.3],
      [0.13, 0.2],
    ],
    "#eff3f1",
  );
  shape(
    [
      [0.2, 0.04],
      [0.34, 0.25],
      [0.27, 0.21],
      [0.25, 0.31],
      [0.18, 0.23],
    ],
    "#c8d8df",
  );
  shape(
    [
      [0.56, 0.3],
      [0.71, 0.1],
      [0.87, 0.28],
      [0.79, 0.27],
      [0.76, 0.36],
      [0.69, 0.28],
      [0.63, 0.35],
      [0.64, 0.25],
    ],
    "#eaf0ef",
  );
  shape(
    [
      [0.71, 0.1],
      [0.87, 0.28],
      [0.79, 0.27],
      [0.76, 0.36],
      [0.69, 0.28],
    ],
    "#c1d2da",
  );
  // One broad foothill layer ties the mountain faces into the terrain.
  shape(
    [
      [-0.1, 0.85],
      [0.14, 0.71],
      [0.4, 0.89],
      [0.66, 0.76],
      [1.1, 0.91],
      [1.1, 1.1],
      [-0.1, 1.1],
    ],
    "#73828c",
  );
}
function dunes(c: SkCanvas, top: number, height: number, bottom: boolean) {
  for (let i = 0; i < 3; i++) {
    const crest: number[][] = [];
    const phase = i * 1.8 + (bottom ? 1.1 : 0);
    for (let x = -20; x <= 1020; x += 10) {
      const y =
        top +
        height *
          (0.12 +
            i * 0.32 +
            0.15 * Math.sin((x / 1000) * Math.PI * 1.35 + phase));
      crest.push([x, y]);
    }
    const dune = terrainPath([
      ...crest,
      [1020, top + height + 30],
      [-20, top + height + 30],
    ]);
    c.drawPath(
      dune,
      gradient(top + height * (i * 0.32), height * 0.52, [
        "#ebc88a",
        "#d4a562",
        "#c39759",
      ]),
    );
    const lip = terrainPath(crest, false);
    stroke(c, lip, i === 1 ? "#f1d49c" : "#e8c386", 5);
  }
}
function lava(c: SkCanvas, top: number, height: number, bottom: boolean) {
  // A few huge basalt regions, rather than a grid of individual rocks.
  const regions = [
    [
      [-0.1, -0.1],
      [0.6, -0.1],
      [0.47, 0.32],
      [0.1, 0.61],
      [-0.1, 0.45],
    ],
    [
      [0.66, -0.1],
      [1.1, -0.1],
      [1.1, 0.75],
      [0.7, 0.61],
      [0.58, 0.3],
    ],
    [
      [-0.1, 0.76],
      [0.38, 0.58],
      [0.66, 0.89],
      [0.5, 1.1],
      [-0.1, 1.1],
    ],
  ];
  const p = ([x, y]: number[]) => [
    (bottom ? 1 - x : x) * 1000,
    top + y * height,
  ];
  regions.forEach((region, i) =>
    c.drawPath(
      terrainPath(region.map(p)),
      gradient(
        top,
        height,
        i % 2 ? ["#3b3d41", "#292b30"] : ["#36383d", "#222429"],
      ),
    ),
  );
  // All three cuts meet at shared vertices, forming one recessed fissure network.
  const courses = [
    [
      [-0.1, 0.12],
      [0.22, 0.26],
      [0.45, 0.22],
      [0.65, 0.48],
      [1.1, 0.6],
    ],
    [
      [0.7, -0.1],
      [0.62, 0.18],
      [0.65, 0.48],
      [0.4, 0.74],
      [0.34, 1.1],
    ],
    [
      [-0.1, 0.88],
      [0.18, 0.81],
      [0.4, 0.74],
      [0.68, 0.86],
      [1.1, 0.77],
    ],
  ];
  const cuts = courses.map((course) => {
    const points = course.map(p);
    return (width: number, depth = 0) => {
      const left: number[][] = [],
        right: number[][] = [];
      points.forEach(([x, y], i) => {
        const previous = points[Math.max(0, i - 1)],
          next = points[Math.min(points.length - 1, i + 1)];
        const dx = next[0] - previous[0],
          dy = next[1] - previous[1];
        const length = Math.hypot(dx, dy) || 1;
        const half = width * (i % 2 ? 0.92 : 1.06);
        left.push([x - (dy / length) * half, y + (dx / length) * half + depth]);
        right.push([
          x + (dy / length) * half,
          y - (dx / length) * half + depth,
        ]);
      });
      return terrainPath([...left, ...right.reverse()]);
    };
  });
  // Render every cut at each depth before proceeding, so junctions stay connected.
  for (const cut of cuts) c.drawPath(cut(34), ink("#45464a"));
  for (const cut of cuts) c.drawPath(cut(30), ink("#141619"));
  for (const cut of cuts) {
    const floor = cut(19, 8);
    c.drawPath(floor, gradient(top, height, ["#cf571e", "#ef8730", "#c54c19"]));
    c.save();
    c.clipPath(floor, 1, true);
    // Broad, low-contrast molten facets share one texture throughout the network.
    for (let i = 0; i < 4; i++) {
      const x = (i * 317 + 100) % 1000,
        y = top + height * (0.12 + i * 0.23);
      const facet = terrainPath([
        [x - 160, y],
        [x + 110, y - 44],
        [x + 190, y + 65],
        [x - 80, y + 110],
      ]);
      c.drawPath(facet, ink(i % 2 ? "#e27629" : "#eb8230"));
    }
    c.restore();
  }
}
function jungle(c: SkCanvas, top: number, height: number, bottom: boolean) {
  // Broad foliage and winding vines fill the terrain like the dune/mountain layers.
  c.save();
  c.translate(bottom ? 1000 : 0, top);
  c.scale(bottom ? -1 : 1, height / 900);
  const patches = [
    {
      color: "#205039",
      points: [
        [-100, -100],
        [1100, -100],
        [1040, 230],
        [700, 170],
        [410, 310],
        [-100, 200],
      ],
    },
    {
      color: "#24563c",
      points: [
        [-100, 440],
        [170, 320],
        [520, 450],
        [850, 330],
        [1100, 450],
        [1100, 1000],
        [-100, 1000],
      ],
    },
    {
      color: "#215039",
      points: [
        [-100, 770],
        [240, 610],
        [590, 780],
        [870, 630],
        [1100, 720],
        [1100, 1000],
        [-100, 1000],
      ],
    },
  ];
  for (const { color, points } of patches) {
    c.drawPath(terrainPath(points, true, true), ink(color));
  }

  // Long trunks weave through the foliage, with shaded bark, roots and moss.
  for (const [index, x] of [135, 560, 970].entries()) {
    const offset = index * 85;
    const trunk = terrainPath(
      [
        [x - 28, -100],
        [x + 31, -100],
        [x + 5, 240 + offset],
        [x + 55, 520],
        [x + 22, 780],
        [x + 68, 1000],
        [x - 35, 1000],
        [x - 23, 780],
        [x + 9, 520],
        [x - 35, 250 + offset],
      ],
      true,
      true,
    );
    c.drawPath(trunk, ink("#314b38"));
    const bark = terrainPath(
      [
        [x + 2, -50],
        [x - 12, 280 + offset],
        [x + 31, 520],
        [x - 1, 780],
        [x + 17, 950],
      ],
      false,
      true,
    );
    stroke(c, bark, "#3c5940", 11);
    const branch = terrainPath(
      [
        [x + 19, 520],
        [x - 62, 437],
        [x - 118, 320],
      ],
      false,
      true,
    );
    stroke(c, branch, "#314b38", 24);
    for (let k = 0; k < 6; k++) {
      const y = 40 + k * 155 + index * 22;
      const mossX = x + (k % 2 ? 12 : -18);
      c.drawPath(
        terrainPath(
          [
            [mossX - 14, y],
            [mossX + 9, y - 10],
            [mossX + 20, y + 9],
            [mossX + 10, y + 29],
            [mossX + 4, y + 55],
            [mossX - 6, y + 33],
            [mossX - 18, y + 18],
          ],
          true,
          true,
        ),
        ink(k % 2 ? "#416944" : "#3a623f"),
      );
      line(c, x - 11, y + 64, x - 6, y + 104, "#263f31", 3);
    }
  }

  // Long continuous vines join the smaller leaf clusters.
  for (const [i, x] of [-60, 370, 860].entries()) {
    const vine = Skia.Path.Make();
    vine.moveTo(x, -100);
    vine.cubicTo(x + 320, 120, x - 230, 340, x + 30, 490);
    vine.cubicTo(x + 290, 650, x + 110, 800, x + 220, 1020);
    stroke(c, vine, i === 1 ? "#306244" : "#2c5d40", 13);
  }

  const leaf = (
    x: number,
    y: number,
    angle: number,
    length: number,
    color: string,
  ) => {
    c.save();
    c.translate(x, y);
    c.rotate(angle, 0, 0);
    const shape = Skia.Path.Make();
    shape.moveTo(0, 0);
    shape.cubicTo(
      length * 0.1,
      -length * 0.35,
      length * 0.65,
      -length * 0.36,
      length,
      0,
    );
    shape.cubicTo(
      length * 0.65,
      length * 0.22,
      length * 0.12,
      length * 0.28,
      0,
      0,
    );
    c.drawPath(shape, ink(color));
    const half = Skia.Path.Make();
    half.moveTo(0, 0);
    half.cubicTo(
      length * 0.12,
      length * 0.28,
      length * 0.65,
      length * 0.22,
      length,
      0,
    );
    half.cubicTo(
      length * 0.66,
      -length * 0.025,
      length * 0.28,
      length * 0.015,
      0,
      0,
    );
    c.drawPath(half, ink("#2b5e40"));
    const vein = Skia.Path.Make();
    vein.moveTo(0, 0);
    vein.cubicTo(
      length * 0.28,
      length * 0.015,
      length * 0.66,
      -length * 0.025,
      length * 0.94,
      0,
    );
    stroke(c, vein, "#376848", 3);
    c.restore();
  };
  leaf(40, -80, 62, 350, "#306344");
  leaf(680, -110, 112, 330, "#2d6041");
  leaf(1110, 330, 157, 370, "#326647");
  leaf(-110, 630, -33, 390, "#2e6243");
  leaf(530, 1040, -95, 350, "#306344");
  leaf(1090, 960, -145, 370, "#2b5e40");

  // Staggered leaf pairs follow winding stems instead of standalone tree icons.
  for (const [index, baseX] of [45, 330, 700, 1040].entries()) {
    const points: number[][] = [];
    for (let y = -80; y <= 1000; y += 40) {
      points.push([baseX + Math.sin(y / 180 + index * 1.8) * 70, y]);
    }
    stroke(c, terrainPath(points, false, true), "#3a6846", 5);
    for (let k = 0; k < 10; k++) {
      const y = k * 103 + (index % 2) * 45;
      const x = baseX + Math.sin(y / 180 + index * 1.8) * 70;
      const length = 68 + ((k * 17 + index * 13) % 46);
      leaf(x, y, k % 2 ? -151 : -28, length, k % 3 ? "#376b46" : "#40764c");
      if (k % 3 === 0)
        leaf(x, y + 18, k % 2 ? -32 : -145, length * 0.7, "#326343");
    }
  }
  // Low fern fans and soft moss islands add a finer forest-floor pattern.
  for (const [index, [x, y]] of [
    [240, 200],
    [780, 360],
    [360, 590],
    [850, 810],
    [90, 910],
  ].entries()) {
    c.drawPath(
      terrainPath(
        [
          [x - 62, y + 8],
          [x - 34, y - 10],
          [x + 10, y - 5],
          [x + 62, y + 12],
          [x + 29, y + 30],
          [x - 37, y + 26],
        ],
        true,
        true,
      ),
      ink("#2b593c"),
    );
    for (let k = 0; k < 5; k++) {
      leaf(
        x,
        y + 10,
        -163 + k * 34,
        62 + ((index + k) % 3) * 15,
        k % 2 ? "#3b7048" : "#336442",
      );
    }
  }
  c.restore();
}

export function drawBackground(
  c: SkCanvas,
  battleNumber: number,
  h: number,
  ground: number,
) {
  const theme = battleTheme(battleNumber);
  const colors = {
    grasslands: ["#11b96c", "#11b96c"],
    mountains: ["#a9b5bd", "#88969f"],
    desert: ["#e5c68d", "#d5ae70"],
    lava: ["#44464b", "#2c2e32", "#191b20"],
    space: ["#080b13", "#080b13"],
    jungle: ["#163e31", "#21593c", "#194833"],
  };
  c.drawRect(Skia.XYWHRect(0, 0, 1000, h), gradient(0, h, colors[theme]));
  if (
    theme === "mountains" ||
    theme === "desert" ||
    theme === "lava" ||
    theme === "jungle"
  ) {
    // Meet beneath the opaque road instead of leaving a blank strip around it.
    // The bunker and road are drawn afterward, naturally covering the pattern.
    const zones = [
      [0, Math.max(1, ground)],
      [ground, Math.max(1, h - ground)],
    ];
    zones.forEach(([top, height], index) => {
      c.save();
      c.clipRect(Skia.XYWHRect(0, top, 1000, height), 1, true);
      if (theme === "mountains") {
        mountainRange(c, top, height, index === 1);
      } else if (theme === "desert") dunes(c, top, height, index === 1);
      else if (theme === "lava") lava(c, top, height, index === 1);
      else jungle(c, top, height, index === 1);
      c.restore();
    });
    return;
  }
  const rows = Math.max(2, Math.ceil(h / 180));
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < 5; col++) {
      const i = row * 5 + col;
      const x = 55 + col * 195 + ((i * 37) % 95);
      const y = ((row + 0.45 + ((i * 13) % 20) / 100) / rows) * h;
      if (theme === "grasslands") {
        c.drawOval(Skia.XYWHRect(x - 30, y - 7, 66, 18), ink("#16b169"));
        line(c, x - 10, y - 9, x - 4, y + 2, "#32a966", 2.5);
        line(c, x - 4, y + 2, x - 1, y - 15, "#32a966", 2.5);
        line(c, x - 4, y + 2, x + 6, y - 7, "#32a966", 2.5);
        line(c, x + 17, y + 5, x + 21, y - 5, "#4bb976", 2);
      } else {
        c.drawCircle(x, y, 1.5, ink("#697387"));
        c.drawCircle(x - 32, y + 42, 1, ink("#3e485f"));
        c.drawCircle(x + 48, y - 38, 0.9, ink("#4e5970"));
        if (i % 4 === 0) {
          line(c, x, y - 4, x, y + 4, "#8b94a6", 1);
          line(c, x - 4, y, x + 4, y, "#8b94a6", 1);
        }
      }
    }
  }
}
