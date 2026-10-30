import { Skia, PaintStyle, SkCanvas } from "@shopify/react-native-skia";
import { World, Unit } from "../game/types";
import { BATTLE_UNIT_SCALE } from "../game/geometry";
import {
  BATTLE,
  BOSS,
  CANNON,
  PYRAMID,
  TIGER,
  TOMMY,
  RAPPER,
  MARINE,
  MIG,
  MAGE,
  RACCOON,
  raccoonHover,
  isBossKind,
  isEnemyKind,
} from "../game/config";
import { drawBackground } from "./backgrounds";
import { armElbow, meleeWeaponPose, Point, swingPoint } from "./meleePose";
import { attackMotion } from "./attackMotion";
import { raccoonRiflePose } from "./raccoonPose";
import {
  attackCameraOffset,
  drawAttackBacklight,
  drawAttackAura,
  drawAttackImpacts,
  drawProjectileTrail,
} from "./attackEffects";

function drawSwingArm(
  c: SkCanvas,
  shoulder: Point,
  hand: Point,
  upperLength: number,
  lowerLength: number,
  edge: string,
  color: string,
  width: number,
  bendDirection: 1 | -1 = 1,
) {
  const elbow = armElbow(
    shoulder,
    hand,
    upperLength,
    lowerLength,
    bendDirection,
  );
  line(c, ...shoulder, ...elbow, edge, width);
  line(c, ...elbow, ...hand, edge, width);
  circle(c, ...elbow, width / 2, edge);
  line(c, ...shoulder, ...elbow, color, width - 4);
  line(c, ...elbow, ...hand, color, width - 4);
  circle(c, ...elbow, (width - 4) / 2, color);
}
const paint = Skia.Paint();
paint.setAntiAlias(true);
function ink(color: string) {
  paint.setColor(Skia.Color(color));
  paint.setStyle(PaintStyle.Fill);
  return paint;
}
function circle(c: SkCanvas, x: number, y: number, r: number, color: string) {
  c.drawCircle(x, y, r, ink(color));
}
function rect(
  c: SkCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  c.drawRect(Skia.XYWHRect(x, y, w, h), ink(color));
}
function line(
  c: SkCanvas,
  x: number,
  y: number,
  xx: number,
  yy: number,
  color: string,
  width = 4,
) {
  ink(color);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(1);
  c.drawLine(x, y, xx, yy, paint);
}
function polygon(c: SkCanvas, points: number[][], color: string) {
  const path = Skia.Path.Make();
  path.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach((p) => path.lineTo(p[0], p[1]));
  path.close();
  c.drawPath(path, ink(color));
}
const OUTLINE = "#344638";
function oval(
  c: SkCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  c.drawOval(Skia.XYWHRect(x, y, w, h), ink(color));
}
function outlinedOval(
  c: SkCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  oval(c, x - 2, y - 2, w + 4, h + 4, OUTLINE);
  oval(c, x, y, w, h, color);
}
// Three flat faces give the simple bunker an inward-facing angle.
function base(c: SkCanvas, x: number, y: number, enemy: boolean) {
  c.save();
  c.translate(x, y);
  c.scale(enemy ? -2 : 2, 2);
  const outline = "#29343b";
  const accent = enemy ? "#ed8269" : "#53baa4";

  polygon(
    c,
    [
      [-60, -77],
      [-26, -98],
      [60, -98],
      [60, -12],
      [26, 9],
      [-60, 9],
    ],
    outline,
  );
  // Broad front, lighter roof and darker side: no small panel details.
  rect(c, -56, -74, 80, 79, "#747d84");
  polygon(
    c,
    [
      [-52, -78],
      [-25, -94],
      [51, -94],
      [23, -78],
    ],
    "#929ba1",
  );
  polygon(
    c,
    [
      [28, -74],
      [56, -91],
      [56, -15],
      [28, 3],
    ],
    "#59646d",
  );

  rect(c, -40, -51, 50, 11, outline);
  rect(c, -8, -66, 20, 4, accent);
  // One plain doorway follows the side wall's perspective.
  polygon(
    c,
    [
      [34, -54],
      [50, -64],
      [50, -15],
      [34, -5],
    ],
    outline,
  );
  c.restore();
}
const CHARACTER_INK = "#171b19";

// The entire unequipped model: one oval body, one round head, one eye.
// Keep equipment out of this function so every age shares this exact base.
export function drawCharacterBase(c: SkCanvas, skin: string, body: string) {
  oval(c, -19, -41, 38, 44, CHARACTER_INK);
  oval(c, -16, -38, 32, 38, body);
  circle(c, 0, -45, 18, CHARACTER_INK);
  circle(c, 0, -45, 15, skin);
  line(c, 7, -49, 7, -42, CHARACTER_INK, 4);
}

function drawAxe(c: SkCanvas) {
  line(c, -8, -5, 20, -44, CHARACTER_INK, 8);
  line(c, -8, -5, 20, -44, "#b98b59", 4);
  polygon(
    c,
    [
      [12, -46],
      [30, -49],
      [39, -31],
      [24, -28],
      [18, -38],
    ],
    CHARACTER_INK,
  );
  polygon(
    c,
    [
      [19, -43],
      [28, -45],
      [34, -34],
      [25, -32],
    ],
    "#c9d6dc",
  );
  line(c, 29, -43, 34, -34, "#f4f6ed", 2);
}

// Each unit shares the same simple body; its weapon carries the identity.
function drawStoneEquipment(c: SkCanvas, kind: Unit["kind"], swing: number) {
  c.save();
  if (kind === "clubman") {
    c.rotate(-24 + swing * 55, 0, -20);
    oval(c, -19, -28, 51, 17, CHARACTER_INK);
    oval(c, -16, -25, 45, 11, "#bd9160");
  } else if (kind === "spearman") {
    c.translate(swing * 10, 0);
    line(c, -21, -5, 36, -40, CHARACTER_INK, 7);
    line(c, -21, -5, 36, -40, "#b98b59", 3);
    polygon(
      c,
      [
        [31, -44],
        [51, -51],
        [40, -33],
      ],
      CHARACTER_INK,
    );
    polygon(
      c,
      [
        [35, -42],
        [45, -46],
        [40, -37],
      ],
      "#e0e7e2",
    );
  } else if (kind === "rock") {
    const x = 12 + swing * 7,
      y = -27 - swing * 17;
    oval(c, x - 3, y - 3, 20, 18, CHARACTER_INK);
    oval(c, x, y, 14, 12, "#d0d8d5");
  }
  c.restore();
}

// Shaded roof and recessed side keep the armor readable at a three-quarter angle.
function mechArmor(
  c: SkCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  front: string,
  roof: string,
  side: string,
  depth = 7,
  rise = 5,
) {
  polygon(
    c,
    [
      [x - depth, y - rise],
      [x + w - depth, y - rise],
      [x + w + 2, y - 2],
      [x + w + 2, y + h + 2],
      [x - 2, y + h + 2],
      [x - depth - 2, y + h - rise + 2],
      [x - depth - 2, y - rise + 2],
    ],
    CHARACTER_INK,
  );
  polygon(
    c,
    [
      [x - depth + 1, y - rise + 2],
      [x + w - depth - 1, y - rise + 2],
      [x + w, y],
      [x, y],
    ],
    roof,
  );
  polygon(
    c,
    [
      [x - depth, y - rise + 3],
      [x - 1, y + 2],
      [x - 1, y + h],
      [x - depth, y + h - rise],
    ],
    side,
  );
  rect(c, x, y + 1, w, h - 1, front);
}

const MECH_ART_SCALE = 1.05;
const MECH_PODS = [
  { x: -28, y: -65 },
  { x: 17, y: -69 },
];

function drawMech(c: SkCanvas, unit: Unit, time: number) {
  const flash = unit.hit > 0;
  const armor = flash ? "#fff5d6" : "#829294";
  const roof = flash ? "#fff5d6" : "#b9c9c9";
  const shade = flash ? "#fff5d6" : "#485e63";
  const accent = flash
    ? "#fff5d6"
    : unit.side === "player"
      ? "#53c4b1"
      : "#f48672";
  const stride =
    unit.attack > 0 || unit.cooldown > 0 ? 0 : Math.sin(time * 6 + unit.id) * 3;
  c.save();
  c.scale(MECH_ART_SCALE, MECH_ART_SCALE);

  // Heavy bent legs, exposed round joints and broad forward-pointing feet.
  for (const [x, motion, depth] of [
    [12, -stride, -4],
    [-10, stride, 0],
  ]) {
    line(c, x, -33 + depth, x - 7 + motion, -20 + depth, CHARACTER_INK, 17);
    line(c, x, -33 + depth, x - 7 + motion, -20 + depth, shade, 11);
    circle(c, x - 7 + motion, -20 + depth, 8, CHARACTER_INK);
    circle(c, x - 8 + motion, -21 + depth, 5, armor);
    polygon(
      c,
      [
        [x - 12 + motion, -18 + depth],
        [x + motion, -20 + depth],
        [x + 8 + motion, -5 + depth],
        [x - 5 + motion, -1 + depth],
      ],
      CHARACTER_INK,
    );
    polygon(
      c,
      [
        [x - 8 + motion, -16 + depth],
        [x - 1 + motion, -17 + depth],
        [x + 4 + motion, -6 + depth],
        [x - 3 + motion, -4 + depth],
      ],
      armor,
    );
    mechArmor(c, x - 4 + motion, -3 + depth, 22, 7, armor, roof, shade, 8, 4);
    line(c, x + 5 + motion, 0 + depth, x + 5 + motion, 3 + depth, shade, 2);
    line(c, x + 12 + motion, 0 + depth, x + 12 + motion, 3 + depth, shade, 2);
  }

  const pod = ({ x, y }: { x: number; y: number }) => {
    mechArmor(c, x, y, 17, 27, armor, roof, shade, 8, 4);
    rect(c, x + 1, y + 2, 15, 23, CHARACTER_INK);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        circle(c, x + 3.5 + col * 5, y + 5.5 + row * 5.5, 1.7, shade);
        circle(c, x + 4 + col * 5, y + 6 + row * 5.5, 1, accent);
      }
    }
  };

  pod(MECH_PODS[1]);
  // Square cabin with an upright windshield, framed by the shoulder racks.
  mechArmor(c, 0, -56, 25, 26, armor, roof, shade, 14, 5);
  rect(c, 4, -51, 17, 11, CHARACTER_INK);
  rect(c, 6, -49, 13, 7, accent);
  polygon(
    c,
    [
      [-11, -53],
      [-3, -50],
      [-3, -42],
      [-11, -45],
    ],
    CHARACTER_INK,
  );
  polygon(
    c,
    [
      [-9, -50],
      [-5, -49],
      [-5, -46],
      [-9, -47],
    ],
    accent,
  );
  rect(c, 5, -35, 15, 2, shade);
  pod(MECH_PODS[0]);
  c.restore();
}

function drawSlime(c: SkCanvas, unit: Unit, time: number, swing: number) {
  const lobber = unit.kind === "slimeThrower";
  const armored = unit.enemyTrait === "armored";
  const frail = unit.enemyTrait === "frail";
  const dark = "#19143f";
  const flash = unit.hit > 0;
  const green = flash
    ? "#fff5d6"
    : armored
      ? "#7e939f"
      : frail
        ? "#f58c42"
        : "#35c84a";
  const rim = flash
    ? "#fff5d6"
    : armored
      ? "#c6d4da"
      : frail
        ? "#ffd578"
        : "#8bea63";
  const shade = flash
    ? "#fff5d6"
    : armored
      ? "#526976"
      : frail
        ? "#c85d32"
        : "#249438";
  const squish = Math.sin(time * 7 + unit.id) * 0.035;
  c.save();
  c.scale(1 + squish, 1 - squish);

  // One smooth jelly silhouette, with a swept tip like the reference.
  // Equipment is separate, so neither slime needs arms, teeth or extra lobes.
  if (!lobber) {
    c.save();
    c.rotate(-18 + swing * 82, 18, -23);
    polygon(
      c,
      [
        [14, -29],
        [21, -54],
        [38, -78],
        [41, -58],
        [27, -27],
      ],
      dark,
    );
    polygon(
      c,
      [
        [19, -32],
        [25, -53],
        [35, -68],
        [36, -58],
        [25, -32],
      ],
      "#a4e5f5",
    );
    polygon(
      c,
      [
        [25, -52],
        [35, -68],
        [36, -58],
        [30, -47],
      ],
      "#f0faf1",
    );
    line(c, 11, -32, 32, -24, dark, 9);
    line(c, 12, -32, 31, -25, "#aaa7d8", 4);
    line(c, 21, -25, 17, -13, dark, 10);
    line(c, 21, -25, 17, -13, "#ad6b57", 5);
    c.restore();
  }

  const body = Skia.Path.Make();
  body.moveTo(-20, -51);
  body.cubicTo(-1, -56, 23, -43, 29, -25);
  body.cubicTo(42, 4, 16, 9, -5, 8);
  body.cubicTo(-33, 8, -39, -5, -31, -24);
  body.cubicTo(-27, -34, -18, -42, -20, -51);
  body.close();
  c.drawPath(body, ink(dark));
  c.save();
  c.scale(0.86, 0.86);
  c.translate(0, -3);
  c.drawPath(body, ink(rim));
  c.restore();
  c.save();
  c.scale(0.74, 0.74);
  c.translate(2, -5);
  c.drawPath(body, ink(green));
  c.restore();
  // Flat low shading and two gloss spots keep the blob readable when tiny.
  const bottom = Skia.Path.Make();
  bottom.moveTo(-25, -8);
  bottom.cubicTo(-9, -14, 10, -12, 25, -2);
  bottom.cubicTo(14, 6, -16, 5, -25, -3);
  bottom.close();
  c.drawPath(bottom, ink(shade));
  oval(c, -20, -16, 10, 11, rim);
  oval(c, 8, -42, 10, 6, armored ? "#eff8fc" : frail ? "#fff0ae" : "#b8ffad");
  if (armored) {
    // Metal cap and a broad shield identify the ranged-resistant frontline.
    polygon(
      c,
      [
        [-24, -37],
        [-18, -51],
        [0, -54],
        [20, -41],
        [17, -35],
      ],
      dark,
    );
    polygon(
      c,
      [
        [-20, -39],
        [-15, -48],
        [0, -50],
        [15, -41],
        [13, -38],
      ],
      "#b9c9d3",
    );
    line(c, -9, -47, 5, -41, "#f2f8fa", 2);
    polygon(
      c,
      [
        [1, -18],
        [15, -24],
        [29, -17],
        [27, 1],
        [15, 9],
        [3, 1],
      ],
      dark,
    );
    polygon(
      c,
      [
        [5, -16],
        [15, -20],
        [25, -15],
        [23, -1],
        [15, 5],
        [7, -1],
      ],
      "#edbd52",
    );
    polygon(
      c,
      [
        [9, -13],
        [15, -16],
        [21, -12],
        [19, -3],
        [15, 1],
        [11, -3],
      ],
      "#526d88",
    );
    line(c, 15, -16, 15, 1, "#b2d2e3", 2);
  } else if (frail) {
    // Cracked amber jelly and a charged orange pellet signal a glass cannon.
    line(c, -19, -25, -13, -18, "#873e31", 2);
    line(c, -13, -18, -17, -12, "#873e31", 2);
    line(c, -17, -12, -10, -5, "#873e31", 2);
    line(c, -13, -18, -7, -20, "#fff0ae", 1.5);
  }

  const eye = (x: number, y: number, forward: boolean) => {
    const p = Skia.Path.Make();
    p.moveTo(x, y);
    p.lineTo(x + 9, y + (forward ? -4 : 3));
    p.cubicTo(x + 12, y + 15, x - 3, y + 15, x, y);
    p.close();
    c.drawPath(p, ink(dark));
  };
  eye(-7, -29, false);
  eye(14, -27, true);

  if (lobber) {
    // A large Y-shaped slingshot distinguishes ranged support at battle scale.
    // Its pouch pulls back, then releases the existing green slime projectile.
    c.save();
    c.translate(29, -16);
    c.rotate(-8 - swing * 12, 0, -6);
    line(c, 0, 4, 0, -20, dark, 11);
    line(c, 0, -20, -12, -38, dark, 10);
    line(c, 0, -20, 12, -38, dark, 10);
    line(c, 0, 4, 0, -20, "#bf854c", 6);
    line(c, 0, -20, -12, -38, "#e4b671", 5);
    line(c, 0, -20, 12, -38, "#e4b671", 5);
    const pull = -10 - swing * 13;
    line(c, -12, -36, pull, -27, dark, 4);
    line(c, 12, -36, pull, -27, dark, 4);
    line(c, -12, -36, pull, -27, "#f9e3a1", 2);
    line(c, 12, -36, pull, -27, "#f9e3a1", 2);
    circle(c, pull, -27, 7, dark);
    circle(c, pull, -27, 4.5, frail ? "#ff7548" : "#91e65d");
    circle(c, pull - 1, -29, 1.5, frail ? "#fff0ae" : "#e0ffb9");
    c.restore();
  }
  c.restore();
}
function drawDinosaur(c: SkCanvas, unit: Unit, time: number, swing: number) {
  const outline = CHARACTER_INK;
  const hide = unit.hit > 0 ? "#4b806d" : "#294b43";
  const roof = unit.hit > 0 ? "#659785" : "#3c6554";
  const shade = unit.hit > 0 ? "#375e53" : "#1d3733";
  const spine = "#78cdd0";
  const stride = unit.attack > 0 ? 0 : Math.sin(time * 5 + unit.id) * 1.1;
  const shape = (path: ReturnType<typeof Skia.Path.Make>, color: string) => {
    c.drawPath(path, ink(color));
    ink(outline);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(2.5);
    c.drawPath(path, paint);
  };
  c.save();
  c.rotate(swing * 4, 0, 0);
  // Far limbs sit higher and darker, matching the mech's three-quarter depth.
  const farLeg = Skia.Path.Make();
  farLeg.moveTo(4, -17);
  farLeg.cubicTo(16, -20, 19, -8, 14, -3);
  farLeg.lineTo(21 - stride, 0);
  farLeg.lineTo(21 - stride, 5);
  farLeg.lineTo(8 - stride, 5);
  farLeg.lineTo(2, -7);
  farLeg.close();
  shape(farLeg, shade);
  polygon(
    c,
    [
      [9 - stride, 0],
      [18 - stride, -1],
      [21 - stride, 1],
      [11 - stride, 3],
    ],
    hide,
  );
  line(c, 13, -32, 24, -27, outline, 7);
  line(c, 13, -32, 24, -27, shade, 3);

  // Swept tail, broad haunch, rising neck and head share one clean outer contour.
  const body = Skia.Path.Make();
  body.moveTo(-46, -39);
  body.cubicTo(-50, -21, -37, -7, -18, -21);
  body.cubicTo(-15, -30, -7, -33, -4, -42);
  body.lineTo(-3, -54);
  body.cubicTo(-3, -58, 3, -61, 12, -60);
  body.lineTo(26, -57);
  body.lineTo(35, -51);
  body.lineTo(36, -44);
  body.cubicTo(32, -39, 23, -38, 14, -40);
  body.lineTo(12, -29);
  body.cubicTo(25, -17, 19, 1, 1, 1);
  body.cubicTo(-9, 2, -16, -4, -17, -10);
  body.cubicTo(-40, 12, -62, -11, -46, -39);
  body.close();
  shape(body, hide);
  // A narrow, contour-following side shadow gives volume without a belly stripe.
  const side = Skia.Path.Make();
  side.moveTo(-15, -19);
  side.cubicTo(-18, -5, -5, 2, 6, -4);
  side.cubicTo(1, 5, -14, -1, -17, -10);
  side.cubicTo(-18, -11, -18, -15, -15, -19);
  side.close();
  c.drawPath(side, ink(shade));

  // A restrained row of blue-green plates gives the dark kaiju its identity.
  for (const [x, y, height] of [
    [-17, -24, 10],
    [-10, -35, 12],
    [-4, -45, 10],
  ]) {
    polygon(
      c,
      [
        [x - 4, y + 7],
        [x - height, y - height],
        [x + 3, y + 2],
      ],
      outline,
    );
    polygon(
      c,
      [
        [x - 3, y + 3],
        [x - height + 3, y - height + 5],
        [x, y + 1],
      ],
      spine,
    );
  }

  // Top and snout planes make the head face inward at the same angle as the mech.
  const headTop = Skia.Path.Make();
  headTop.moveTo(-1, -53);
  headTop.cubicTo(-2, -57, 4, -60, 12, -58);
  headTop.lineTo(25, -55);
  headTop.lineTo(32, -51);
  headTop.lineTo(22, -49);
  headTop.lineTo(9, -53);
  headTop.close();
  c.drawPath(headTop, ink(roof));
  polygon(
    c,
    [
      [26, -49],
      [34, -51],
      [34, -45],
      [27, -42],
    ],
    shade,
  );
  line(c, 17, -44, 26, -44, outline, 2);
  line(c, 26, -44, 34, -46, outline, 2);
  polygon(
    c,
    [
      [9, -53],
      [18, -50],
      [11, -48],
    ],
    spine,
  );
  line(c, 8, -54, 19, -51, outline, 2.5);
  circle(c, 30, -49, 0.9, outline);
  polygon(
    c,
    [
      [23, -43],
      [25, -43],
      [24, -40],
    ],
    "#b8cbbd",
  );

  // One smooth foreground leg; broad feet have a subtle top plane, no round joints.
  const nearLeg = Skia.Path.Make();
  nearLeg.moveTo(-9, -17);
  nearLeg.cubicTo(8, -21, 12, -9, 2, -2);
  nearLeg.lineTo(-1 + stride, 3);
  nearLeg.lineTo(8 + stride, 6);
  nearLeg.lineTo(8 + stride, 11);
  nearLeg.lineTo(-9 + stride, 11);
  nearLeg.cubicTo(-15, 5, -14, -6, -9, -17);
  nearLeg.close();
  shape(nearLeg, hide);
  polygon(
    c,
    [
      [-8 + stride, 6],
      [0 + stride, 4],
      [7 + stride, 7],
      [-2 + stride, 8],
    ],
    roof,
  );
  line(c, 2 + stride, 8, 2 + stride, 10, shade, 1.5);
  line(c, 17 - stride, 2, 17 - stride, 4, outline, 1.2);

  // geometry.ts tracks the lower-body front at 28 and rotated hand edge at 34.
  const handX = 17 + swing * 12;
  const handY = -16 - swing * 10;
  const arm = Skia.Path.Make();
  arm.moveTo(4, -29);
  arm.cubicTo(9, -31, 11, -24, 14, -23);
  arm.lineTo(handX, handY);
  arm.lineTo(handX + 2, handY + 5);
  arm.lineTo(12, -18);
  arm.cubicTo(7, -19, 3, -24, 4, -29);
  arm.close();
  shape(arm, hide);
  line(c, 7, -27, 12, -23, roof, 2);
  c.restore();
}
function drawGorilla(c: SkCanvas, unit: Unit, time: number, swing: number) {
  const outline = CHARACTER_INK;
  const fur = unit.hit > 0 ? "#79716a" : "#403d3b";
  const roof = unit.hit > 0 ? "#9b8c7c" : "#645a50";
  const shade = unit.hit > 0 ? "#514d49" : "#292a2b";
  const skin = unit.hit > 0 ? "#b4a28b" : "#827364";
  const stride = unit.attack > 0 ? 0 : Math.sin(time * 5 + unit.id) * 1.2;
  const shape = (path: ReturnType<typeof Skia.Path.Make>, color: string) => {
    c.drawPath(path, ink(color));
    ink(outline);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(2.5);
    c.drawPath(path, paint);
  };
  c.save();
  c.rotate(-swing * 4, 0, 0);
  // Far leg and long far arm establish the same depth as the mech and kaiju.
  const farLeg = Skia.Path.Make();
  farLeg.moveTo(4, -17);
  farLeg.cubicTo(19, -18, 17, -5, 13, -2);
  farLeg.lineTo(24 - stride, 1);
  farLeg.lineTo(23 - stride, 6);
  farLeg.lineTo(6 - stride, 6);
  farLeg.lineTo(0, -6);
  farLeg.close();
  shape(farLeg, shade);
  const farArm = Skia.Path.Make();
  farArm.moveTo(10, -41);
  farArm.cubicTo(24, -43, 25, -25, 23, -17);
  farArm.lineTo(31, -6);
  farArm.lineTo(28, 0);
  farArm.lineTo(18, -2);
  farArm.lineTo(13, -18);
  farArm.close();
  shape(farArm, shade);
  // One broad, hunch-backed torso with a shallow shoulder plane, no belly stripe.
  const torso = Skia.Path.Make();
  torso.moveTo(-24, -32);
  torso.cubicTo(-26, -48, -12, -54, 3, -49);
  torso.cubicTo(18, -48, 23, -34, 18, -21);
  torso.cubicTo(15, -7, 8, -3, -7, -5);
  torso.cubicTo(-22, -7, -24, -19, -24, -32);
  torso.close();
  shape(torso, fur);
  const shoulders = Skia.Path.Make();
  shoulders.moveTo(-22, -36);
  shoulders.cubicTo(-22, -48, -10, -51, 1, -47);
  shoulders.lineTo(12, -42);
  shoulders.lineTo(7, -37);
  shoulders.cubicTo(-3, -42, -14, -42, -22, -36);
  shoulders.close();
  c.drawPath(shoulders, ink(roof));
  // Thick short legs and broad feet beneath the much larger shoulder mass.
  const leg = Skia.Path.Make();
  leg.moveTo(-11, -18);
  leg.cubicTo(2, -21, 9, -9, 0, -1);
  leg.lineTo(1 + stride, 3);
  leg.lineTo(12 + stride, 6);
  leg.lineTo(11 + stride, 11);
  leg.lineTo(-7 + stride, 11);
  leg.cubicTo(-16, 6, -16, -6, -11, -18);
  leg.close();
  shape(leg, fur);
  polygon(
    c,
    [
      [-6 + stride, 6],
      [1 + stride, 4],
      [10 + stride, 7],
      [-1 + stride, 8],
    ],
    roof,
  );
  // A compact gorilla head with a brow ridge and a projecting muzzle.
  const head = Skia.Path.Make();
  head.moveTo(-4, -52);
  head.cubicTo(-6, -62, 0, -67, 9, -65);
  head.lineTo(20, -61);
  head.cubicTo(25, -57, 24, -45, 17, -42);
  head.lineTo(3, -43);
  head.close();
  shape(head, fur);
  polygon(
    c,
    [
      [-2, -55],
      [0, -61],
      [8, -63],
      [19, -59],
      [14, -56],
      [5, -58],
    ],
    roof,
  );
  circle(c, -3, -53, 4, outline);
  circle(c, -3, -53, 2, shade);
  const face = Skia.Path.Make();
  face.moveTo(5, -56);
  face.lineTo(19, -55);
  face.lineTo(23, -49);
  face.lineTo(21, -43);
  face.lineTo(9, -42);
  face.lineTo(3, -48);
  face.close();
  c.drawPath(face, ink(skin));
  const muzzle = Skia.Path.Make();
  muzzle.moveTo(7, -50);
  muzzle.cubicTo(15, -53, 25, -51, 26, -47);
  muzzle.cubicTo(27, -43, 16, -42, 10, -44);
  muzzle.close();
  c.drawPath(muzzle, ink(shade));
  line(c, 9, -54, 17, -53, outline, 3);
  line(c, 12, -53, 12, -51, "#e6c16f", 2);
  circle(c, 23, -48, 1, outline);
  line(c, 12, -44, 23, -44, outline, 2);
  // Massive foreground forearm swings forward into a crushing knuckle punch.
  const fistX = 17 + swing * 15;
  const fistY = 1 - swing * 24;
  const arm = Skia.Path.Make();
  arm.moveTo(-15, -39);
  arm.cubicTo(-8, -45, 1, -41, 2, -32);
  arm.lineTo(5, -19);
  arm.lineTo(fistX - 6, fistY - 9);
  arm.cubicTo(
    fistX + 1,
    fistY - 12,
    fistX + 7,
    fistY - 8,
    fistX + 7,
    fistY - 3,
  );
  arm.cubicTo(fistX + 8, fistY + 3, fistX + 1, fistY + 5, fistX - 8, fistY + 2);
  arm.lineTo(-9, -15);
  arm.cubicTo(-20, -20, -22, -32, -15, -39);
  arm.close();
  shape(arm, fur);
  const armTop = Skia.Path.Make();
  armTop.moveTo(-16, -33);
  armTop.cubicTo(-15, -41, -5, -41, -2, -33);
  armTop.lineTo(0, -24);
  armTop.lineTo(-5, -26);
  armTop.close();
  c.drawPath(armTop, ink(roof));
  polygon(
    c,
    [
      [fistX - 9, fistY - 4],
      [fistX + 4, fistY - 6],
      [fistX + 5, fistY],
      [fistX - 7, fistY + 1],
    ],
    shade,
  );
  for (let finger = 0; finger < 3; finger++)
    line(
      c,
      fistX - 4 + finger * 3,
      fistY - 2,
      fistX - 4 + finger * 3,
      fistY + 1,
      outline,
      1,
    );
  c.restore();
}

function drawRobotBoss(c: SkCanvas, unit: Unit, time: number, swing: number) {
  const outline = CHARACTER_INK;
  const armor = unit.hit > 0 ? "#b8bdc9" : "#777e8b";
  const roof = unit.hit > 0 ? "#dae0e7" : "#a3adba";
  const shade = unit.hit > 0 ? "#7d8295" : "#454b60";
  const frame = "#403149";
  const glow = "#98e8db";
  const stride = unit.attack > 0 ? 0 : Math.sin(time * 5 + unit.id) * 1.2;
  const plate = (x: number, y: number, w: number, h: number, far = false) =>
    mechArmor(
      c,
      x,
      y,
      w,
      h,
      far ? shade : armor,
      far ? armor : roof,
      frame,
      4,
      3,
    );
  c.save();
  c.rotate(-swing * 3, 0, -10);
  // The far leg and arm are inset and darker to match the existing mech angle.
  plate(9, -27, 10, 15, true);
  circle(c, 15, -11, 5, outline);
  circle(c, 15, -11, 2.5, frame);
  plate(10 - stride, -10, 10, 14, true);
  plate(10 - stride, 2, 17, 6, true);
  line(c, 21, -43, 25, -29, outline, 10);
  line(c, 21, -43, 25, -29, frame, 6);
  plate(21, -31, 10, 17, true);
  plate(21, -15, 10, 8, true);
  // A compact pelvis, ribbed waist and broad chest carry the humanoid silhouette.
  plate(-7, -30, 23, 11);
  plate(-7, -37, 21, 9, true);
  line(c, -5, -34, 12, -34, outline, 1.5);
  line(c, -5, -31, 12, -31, outline, 1.5);
  plate(-12, -53, 31, 22);
  polygon(
    c,
    [
      [-8, -48],
      [13, -48],
      [15, -44],
      [-6, -44],
    ],
    shade,
  );
  rect(c, 0, -47, 9, 2, glow);
  // Broad round shoulder caps keep the armor simple and echo the reference.
  const shoulder = (x: number, y: number, far: boolean) => {
    const p = Skia.Path.Make();
    p.moveTo(x - 10, y + 3);
    p.cubicTo(x - 10, y - 8, x + 6, y - 12, x + 11, y - 1);
    p.lineTo(x + 9, y + 8);
    p.lineTo(x - 7, y + 9);
    p.close();
    c.drawPath(p, ink(outline));
    c.save();
    c.translate(x, y);
    c.scale(0.78, 0.78);
    c.translate(-x, -y);
    c.drawPath(p, ink(far ? shade : armor));
    c.restore();
    line(c, x - 5, y - 2, x + 2, y - 5, far ? armor : roof, 3);
  };
  shoulder(22, -48, true);
  // Short helmet with a single mint visor and recessed purple side panel.
  plate(0, -67, 19, 14);
  polygon(
    c,
    [
      [2, -62],
      [20, -61],
      [19, -55],
      [7, -54],
    ],
    outline,
  );
  polygon(
    c,
    [
      [5, -60],
      [18, -59],
      [17, -56],
      [8, -56],
    ],
    glow,
  );
  polygon(
    c,
    [
      [-5, -65],
      [-1, -62],
      [-1, -55],
      [-5, -58],
    ],
    frame,
  );
  circle(c, -3, -60, 3, outline);
  circle(c, -3, -60, 1.5, shade);
  // Near leg: exposed knee between two large plates and a broad planted foot.
  plate(-11, -24, 13, 14);
  circle(c, -4, -9, 5, outline);
  circle(c, -4, -9, 2.5, frame);
  plate(-10 + stride, -7, 13, 14);
  plate(-10 + stride, 6, 21, 6);
  line(c, 3 + stride, 9, 3 + stride, 11, shade, 1.5);
  // Shoulder, upper arm and oversized fist form a readable piston-driven punch.
  shoulder(-17, -47, false);
  const fistX = -9 + swing * 40;
  const fistY = -3 - swing * 22;
  line(c, -17, -38, -17 + swing * 12, -25 - swing * 3, outline, 10);
  line(c, -17, -38, -17 + swing * 12, -25 - swing * 3, frame, 6);
  circle(c, -17 + swing * 12, -25 - swing * 3, 5, outline);
  circle(c, -17 + swing * 12, -25 - swing * 3, 2.5, shade);
  c.save();
  const elbowX = -17 + swing * 12;
  const elbowY = -25 - swing * 3;
  c.translate(elbowX, elbowY);
  c.rotate(
    (Math.atan2(fistY - elbowY, fistX - elbowX) * 180) / Math.PI - 90,
    0,
    0,
  );
  plate(-5, 0, 12, Math.hypot(fistX - elbowX, fistY - elbowY) - 4);
  c.restore();
  plate(fistX - 8, fistY - 6, 16, 10);
  for (let finger = 0; finger < 3; finger++)
    line(
      c,
      fistX - 4 + finger * 4,
      fistY - 2,
      fistX - 4 + finger * 4,
      fistY + 2,
      shade,
      1.2,
    );
  c.restore();
}

function drawScientist(c: SkCanvas, unit: Unit, time: number, swing: number) {
  const outline = CHARACTER_INK;
  const white = unit.hit > 0 ? "#ffffff" : "#e8edeb";
  const shadow = unit.hit > 0 ? "#dae2e5" : "#aabac3";
  const skin = unit.hit > 0 ? "#ffeac4" : "#dfb48b";
  const stride = unit.attack > 0 ? 0 : Math.sin(time * 5 + unit.id) * 1.2;
  const shape = (path: ReturnType<typeof Skia.Path.Make>, color: string) => {
    c.drawPath(path, ink(color));
    ink(outline);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(2.5);
    c.drawPath(path, paint);
  };
  c.save();
  c.rotate(-swing * 4, 0, 0);
  // Dark trouser legs and broad shoes sit beneath a flared white lab coat.
  line(c, 9, -11, 12 - stride, 4, outline, 9);
  outlinedOval(c, 7 - stride, 2, 19, 7, "#494343");
  line(c, -7, -11, -5 + stride, 6, outline, 10);
  outlinedOval(c, -10 + stride, 5, 21, 7, "#62534a");
  const coat = Skia.Path.Make();
  coat.moveTo(-19, -38);
  coat.cubicTo(-14, -44, 4, -43, 13, -36);
  coat.lineTo(13, -20);
  coat.lineTo(20, -3);
  coat.lineTo(4, 0);
  coat.lineTo(-1, -7);
  coat.lineTo(-5, 1);
  coat.lineTo(-20, -2);
  coat.lineTo(-15, -21);
  coat.close();
  shape(coat, white);
  polygon(
    c,
    [
      [-17, -34],
      [-11, -38],
      [-8, -24],
      [-14, -3],
      [-19, -4],
      [-13, -21],
    ],
    shadow,
  );
  polygon(
    c,
    [
      [0, -38],
      [8, -36],
      [5, -18],
      [-1, -18],
    ],
    "#51445b",
  );
  polygon(
    c,
    [
      [-7, -40],
      [0, -37],
      [0, -25],
      [-9, -32],
      [-5, -34],
    ],
    "#ffffff",
  );
  polygon(
    c,
    [
      [7, -39],
      [12, -35],
      [7, -29],
      [2, -25],
      [4, -37],
    ],
    shadow,
  );
  line(c, 0, -18, 1, -8, shadow, 1.2);
  circle(c, 3, -21, 1, outline);
  rect(c, -12, -20, 7, 1.5, shadow);
  line(c, -9, -22, -9, -18, "#628cb0", 1);
  // Wild white hair extends out to both sides of a mostly bald forehead.
  polygon(
    c,
    [
      [-8, -45],
      [-20, -47],
      [-15, -52],
      [-26, -55],
      [-18, -58],
      [-23, -63],
      [-12, -61],
      [-9, -68],
      [-2, -63],
      [7, -66],
      [15, -61],
      [24, -65],
      [22, -58],
      [31, -59],
      [26, -53],
      [31, -50],
      [20, -47],
      [15, -42],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-8, -48],
      [-16, -49],
      [-11, -53],
      [-20, -55],
      [-14, -57],
      [-17, -60],
      [-10, -58],
      [-8, -63],
      [-2, -59],
      [7, -62],
      [16, -58],
      [21, -61],
      [19, -55],
      [26, -56],
      [22, -52],
      [25, -50],
      [17, -47],
      [13, -45],
    ],
    white,
  );
  const head = Skia.Path.Make();
  head.moveTo(-4, -54);
  head.cubicTo(-4, -63, 8, -64, 16, -59);
  head.lineTo(21, -51);
  head.lineTo(29, -47);
  head.lineTo(21, -44);
  head.lineTo(18, -37);
  head.lineTo(3, -39);
  head.lineTo(-5, -46);
  head.close();
  shape(head, skin);
  circle(c, -3, -47, 4, outline);
  circle(c, -3, -47, 2.5, skin);
  // A single round lens, heavy white eyebrow and swept moustache.
  line(c, -2, -51, 12, -50, outline, 1.5);
  circle(c, 14, -49, 5, outline);
  circle(c, 14, -49, 3.4, "#c8e7dc");
  circle(c, 15, -49, 1.5, outline);
  line(c, 7, -55, 18, -53, white, 3);
  polygon(
    c,
    [
      [12, -43],
      [18, -45],
      [25, -41],
      [18, -42],
      [13, -40],
      [9, -42],
    ],
    white,
  );
  line(c, 12, -39, 18, -39, outline, 1.3);
  // A white sleeve tips the bubbling beaker forward during the ranged attack.
  const bx = 25 + swing * 7;
  const by = -29 - swing * 9;
  line(c, -8, -31, 5, -24, outline, 11);
  line(c, -8, -31, 5, -24, white, 7);
  line(c, 5, -24, bx - 4, by + 4, outline, 10);
  line(c, 5, -24, bx - 4, by + 4, white, 6);
  circle(c, bx - 3, by + 3, 4, outline);
  circle(c, bx - 3, by + 3, 2.8, skin);
  c.save();
  c.translate(bx, by);
  c.rotate(swing * 18, 0, 0);
  polygon(
    c,
    [
      [-3, -18],
      [15, -18],
      [12, -14],
      [12, 7],
      [-3, 7],
    ],
    outline,
  );
  polygon(
    c,
    [
      [0, -15],
      [10, -15],
      [9, -13],
      [9, 4],
      [0, 4],
    ],
    "#c8e4de",
  );
  polygon(
    c,
    [
      [1, -5],
      [4, -7],
      [8, -5],
      [8, 3],
      [1, 3],
    ],
    "#80dc27",
  );
  line(c, 1, -13, 1, -8, "#ffffff", 1.2);
  line(c, 6, -2, 8, -2, "#ddffb0", 1);
  line(c, 6, 1, 8, 1, "#ddffb0", 1);
  for (let bubble = 0; bubble < 3; bubble++) {
    const rise = (time * 10 + bubble * 4) % 13;
    circle(
      c,
      3 + Math.sin(time * 3 + bubble) * 3,
      -8 - rise,
      1.5 + bubble * 0.25,
      "#9aec49",
    );
  }
  c.restore();
  c.restore();
}

function drawPyramid(c: SkCanvas, unit: Unit, time: number) {
  const outline = "#302921";
  const gold = unit.hit > 0 ? "#ffe8a1" : "#dfb14c";
  const light = unit.hit > 0 ? "#fff2bc" : "#f5d477";
  const shade = unit.hit > 0 ? "#c49e57" : "#a77936";
  // A detached ground shadow and floating fragments make the levitation clear.
  oval(c, -27, 3, 58, 5, "#25372c55");
  const float = Math.sin(time * 2 + unit.id) * 1.3;
  polygon(
    c,
    [
      [-20, -5 + float],
      [-14, -3 + float],
      [-18, 1 + float],
    ],
    shade,
  );
  polygon(
    c,
    [
      [15, -4 - float],
      [20, -7 - float],
      [23, -2 - float],
    ],
    gold,
  );
  polygon(
    c,
    [
      [-2, -69],
      [39, -23],
      [23, -9],
      [-35, -12],
    ],
    outline,
  );
  // Broad front and darker right face follow the mech's three-quarter projection.
  polygon(
    c,
    [
      [-2, -64],
      [20, -13],
      [-30, -15],
    ],
    gold,
  );
  polygon(
    c,
    [
      [1, -62],
      [34, -23],
      [23, -14],
    ],
    shade,
  );
  polygon(
    c,
    [
      [-2, -64],
      [0, -58],
      [-26, -17],
      [-30, -15],
    ],
    light,
  );
  line(c, -18, -31, 12, -31, "#c19740", 1);
  line(c, -24, -21, 16, -21, "#c19740", 1);
  line(c, -10, -45, 6, -45, "#c19740", 1);
  line(c, 26, -27, 31, -26, "#805c2e", 1);
  // A single large almond-shaped eye is the only focal detail on the front face.
  const eye = Skia.Path.Make();
  eye.moveTo(-21, -36);
  eye.cubicTo(-10, -49, 0, -49, 11, -36);
  eye.cubicTo(0, -23, -10, -23, -21, -36);
  eye.close();
  c.drawPath(eye, ink(outline));
  const white = Skia.Path.Make();
  white.moveTo(-17, -36);
  white.cubicTo(-8, -45, -2, -45, 7, -36);
  white.cubicTo(-2, -27, -8, -27, -17, -36);
  white.close();
  c.drawPath(white, ink("#fff8dc"));
  circle(c, PYRAMID.eyeX, PYRAMID.eyeY, 6.5, "#68bba7");
  circle(c, PYRAMID.eyeX, PYRAMID.eyeY, 3, outline);
  circle(c, PYRAMID.eyeX - 1, PYRAMID.eyeY - 2, 1.3, "#ffffff");
}

function drawMachineGunner(
  c: SkCanvas,
  unit: Unit,
  skin: string,
  time: number,
) {
  const outline = CHARACTER_INK;
  const uniform = unit.hit > 0 ? "#e2ecc4" : "#6a7b48";
  const helmet = unit.hit > 0 ? "#b1ca86" : "#617c42";
  const firing = unit.attack > 0;
  const recoil = firing ? Math.sin((unit.attack / 0.12) * Math.PI) * 2 : 0;
  drawCharacterBase(c, skin, uniform);
  // Olive fatigues, a plain webbing strap and the iconic broad steel helmet.
  line(c, -8, -35, 2, -11, "#b9a974", 4);
  rect(c, -14, -10, 28, 5, "#4d4933");
  rect(c, -2, -10, 6, 5, "#baa66c");
  const cap = Skia.Path.Make();
  cap.moveTo(-22, -49);
  cap.cubicTo(-23, -70, 19, -72, 22, -50);
  cap.lineTo(25, -47);
  cap.lineTo(-24, -47);
  cap.close();
  c.drawPath(cap, ink(outline));
  const green = Skia.Path.Make();
  green.moveTo(-18, -51);
  green.cubicTo(-17, -67, 15, -67, 18, -51);
  green.close();
  c.drawPath(green, ink(helmet));
  line(c, -13, -58, -5, -62, "#8fa66a", 3);
  line(c, -21, -49, 22, -49, "#455a35", 2);
  // The oversized belt-fed weapon stays separate from the simple player model.
  c.save();
  c.translate(-recoil, 0);
  polygon(
    c,
    [
      [-26, -28],
      [-7, -27],
      [-5, -19],
      [-24, -14],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-22, -25],
      [-9, -24],
      [-8, -21],
      [-22, -18],
    ],
    "#966b47",
  );
  line(c, 23, -26, 44, -26, outline, 9);
  line(c, 23, -26, 43, -26, "#77817c", 5);
  for (let vent = 0; vent < 3; vent++)
    rect(c, 28 + vent * 5, -28, 2, 4, outline);
  rect(c, 41, -31, 6, 10, outline);
  polygon(
    c,
    [
      [-8, -32],
      [24, -32],
      [28, -28],
      [25, -18],
      [-8, -18],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-5, -29],
      [22, -29],
      [24, -26],
      [22, -21],
      [-5, -21],
    ],
    "#535d59",
  );
  line(c, -3, -30, 19, -30, "#98a49b", 1.5);
  rect(c, 6, -28, 8, 3, outline);
  line(c, 1, -19, 0, -12, outline, 6);
  // Brass rounds hang in a curved linked belt and bounce while firing.
  const flap = firing ? Math.sin(time * 35) * 1.5 : 0;
  line(c, 16, -24, 17 + flap, -14, outline, 7);
  line(c, 17 + flap, -14, 12 + flap, -2, outline, 7);
  for (let round = 0; round < 6; round++) {
    const x = 16 + Math.sin(round * 0.65) * 3 + flap;
    const y = -24 + round * 4;
    rect(c, x - 3, y, 6, 3, "#d7b35c");
    rect(c, x + 2, y, 2, 3, "#f3dc8a");
  }
  outlinedOval(c, -4, -20, 12, 9, skin);
  outlinedOval(c, 24, -23, 10, 8, skin);
  if (unit.attack > 0.06) {
    polygon(
      c,
      [
        [47, -29],
        [55, -33],
        [53, -27],
        [59, -24],
        [52, -23],
        [54, -18],
        [47, -23],
      ],
      "#f2a340",
    );
    polygon(
      c,
      [
        [47, -27],
        [53, -29],
        [51, -25],
        [55, -24],
        [47, -24],
      ],
      "#fff3a2",
    );
    rect(c, -8 - recoil * 3, -35 + recoil, 4, 2, "#e5bd62");
  }
  c.restore();
}

function drawBasketball(
  c: SkCanvas,
  x: number,
  y: number,
  radius: number,
  rotation = 0,
) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation, 0, 0);
  circle(c, 0, 0, radius + 1.5, CHARACTER_INK);
  circle(c, 0, 0, radius, "#e58a36");
  const seam = "#553a29";
  line(c, -radius + 1, 0, radius - 1, 0, seam, 1.2);
  line(c, 0, -radius + 1, 0, radius - 1, seam, 1.2);
  for (const dir of [-1, 1]) {
    const curve = Skia.Path.Make();
    curve.moveTo(dir * radius * 0.65, -radius * 0.72);
    curve.cubicTo(
      dir * radius * 0.1,
      -radius * 0.25,
      dir * radius * 0.1,
      radius * 0.25,
      dir * radius * 0.65,
      radius * 0.72,
    );
    ink(seam);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(1.2);
    c.drawPath(curve, paint);
  }
  c.restore();
}

function drawBasketballPlayer(c: SkCanvas, unit: Unit, skin: string) {
  const outline = CHARACTER_INK;
  const purple = unit.hit > 0 ? "#d3bee9" : "#7751a2";
  const trim = "#efcc66";
  drawCharacterBase(c, skin, purple);
  line(c, -9, -31, 0, -25, trim, 2.5);
  line(c, 0, -25, 8, -31, trim, 2.5);
  line(c, -14, -29, -15, -17, trim, 2);
  line(c, 14, -28, 15, -18, trim, 2);
  line(c, -13, -7, 13, -7, trim, 2);
  line(c, -5, -21, 4, -21, "#fff6df", 2.3);
  line(c, 4, -21, -2, -12, "#fff6df", 2.3);
  outlinedOval(c, -16, 0, 14, 6, "#e7eee9");
  outlinedOval(c, 3, 0, 15, 6, "#e7eee9");
  const hair = Skia.Path.Make();
  hair.moveTo(-15, -53);
  hair.cubicTo(-14, -64, 7, -65, 14, -56);
  hair.lineTo(6, -57);
  hair.lineTo(-2, -59);
  hair.close();
  c.drawPath(hair, ink(outline));
  line(c, -14, -55, 13, -55, purple, 3);
  const lift =
    unit.attack > 0
      ? 0.65 + Math.sin((unit.attack / 0.25) * Math.PI) * 0.35
      : 0;
  const bx = 24 - lift * 4;
  const by = -22 - lift * 27;
  line(c, -10, -28, 5, -20 - lift * 13, outline, 8);
  line(c, -10, -28, 5, -20 - lift * 13, skin, 5);
  line(c, 5, -20 - lift * 13, bx - 6, by + 5, outline, 8);
  line(c, 5, -20 - lift * 13, bx - 6, by + 5, skin, 5);
  line(c, 11, -30, 19, -21 - lift * 15, outline, 8);
  line(c, 11, -30, 19, -21 - lift * 15, skin, 5);
  line(c, 19, -21 - lift * 15, bx + 5, by + 6, outline, 8);
  line(c, 19, -21 - lift * 15, bx + 5, by + 6, skin, 5);
  circle(c, bx - 6, by + 5, 3.5, skin);
  circle(c, bx + 5, by + 6, 3.5, skin);
  if (unit.attack <= 0.04) drawBasketball(c, bx, by, 10, -12);
}

function drawDuck(c: SkCanvas, unit: Unit, time: number, peck: number) {
  const outline = CHARACTER_INK;
  const green = unit.hit > 0 ? "#fff5d6" : "#238c55";
  const orange = "#f3922d";
  const waddle = unit.attack > 0 ? 0 : Math.sin(time * 10 + unit.id) * 3;
  // Two orange webbed feet alternate under a low, rounded mallard body.
  for (const [x, step] of [
    [-9, waddle],
    [11, -waddle],
  ]) {
    line(c, x, -9, x + step, -1, outline, 6);
    line(c, x, -9, x + step, -1, orange, 3);
    polygon(
      c,
      [
        [x + step - 4, -3],
        [x + step + 3, -3],
        [x + step + 12, 1],
        [x + step + 6, 5],
        [x + step + 1, 3],
        [x + step - 5, 4],
      ],
      outline,
    );
    polygon(
      c,
      [
        [x + step - 2, -1],
        [x + step + 2, -1],
        [x + step + 8, 1],
        [x + step + 5, 2],
        [x + step + 1, 1],
        [x + step - 2, 2],
      ],
      orange,
    );
  }
  polygon(
    c,
    [
      [-18, -30],
      [-35, -31],
      [-29, -20],
      [-17, -13],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-20, -27],
      [-30, -28],
      [-26, -22],
      [-19, -17],
    ],
    "#b6b9b0",
  );
  oval(c, -28, -37, 59, 34, outline);
  oval(c, -25, -34, 53, 28, "#b2b5aa");
  oval(c, 6, -35, 23, 27, "#85533d");
  oval(c, -24, -31, 39, 23, outline);
  oval(c, -21, -28, 33, 17, "#8e968d");
  // Mallard wing patch: dark blue feathers between two pale bars.
  line(c, -15, -18, 4, -18, "#f0f0db", 8);
  line(c, -15, -18, 4, -18, "#354b99", 4);
  line(c, -15, -25, -3, -23, "#b8c0b4", 2);
  line(c, 14, -25, 18 + peck * 10, -39 + peck * 3, outline, 17);
  line(c, 14, -25, 18 + peck * 10, -39 + peck * 3, green, 11);
  line(c, 11, -28, 21, -27, "#eeeeda", 5);
  c.save();
  c.translate(peck * 10, peck * 3);
  c.rotate(peck * 8, 18, -40);
  oval(c, 4, -58, 33, 31, outline);
  oval(c, 7, -55, 27, 25, green);
  oval(c, 10, -53, 13, 9, "#42b274");
  circle(c, 27, -46, 4, outline);
  circle(c, 28, -47, 1.3, "#fff9db");
  // The broad orange bill lunges forward and snaps during each melee peck.
  polygon(
    c,
    [
      [31, -44],
      [49, -44],
      [55, -40],
      [51, -35],
      [31, -35],
    ],
    outline,
  );
  polygon(
    c,
    [
      [33, -41],
      [48, -41],
      [51, -39],
      [48, -38],
      [33, -38],
    ],
    orange,
  );
  polygon(
    c,
    [
      [32, -35],
      [51, -35],
      [48, -31 + peck * 2],
      [33, -31 + peck * 2],
    ],
    outline,
  );
  line(c, 35, -33 + peck * 2, 46, -33 + peck * 2, "#dd7724", 2);
  circle(c, 39, -40, 1, "#945422");
  c.restore();
}

function drawSpaceMarine(c: SkCanvas, unit: Unit, time: number) {
  const outline = CHARACTER_INK;
  const blue = unit.hit > 0 ? "#fff5d6" : "#286fbd";
  const light = unit.hit > 0 ? "#fff5d6" : "#69afe4";
  const steel = "#596b7b";
  const stride = unit.attack > 0 ? 0 : Math.sin(time * 6 + unit.id) * 2.5;
  // A tall power pack and thick jointed legs support the oversized metal suit.
  rect(c, -32, -67, 18, 39, outline);
  rect(c, -29, -63, 12, 31, steel);
  rect(c, -29, -59, 5, 21, blue);
  for (const [x, step] of [
    [-15, -stride],
    [13, stride],
  ]) {
    line(c, x, -24, x + step, -8, outline, 20);
    line(c, x, -24, x + step, -8, steel, 14);
    polygon(
      c,
      [
        [x - 10, -23],
        [x + 9, -25],
        [x + 13, -14],
        [x + 6, -8],
        [x - 10, -11],
      ],
      outline,
    );
    polygon(
      c,
      [
        [x - 7, -20],
        [x + 7, -22],
        [x + 9, -15],
        [x + 4, -11],
        [x - 7, -13],
      ],
      blue,
    );
    rect(c, x - 5, -19, 9, 3, light);
    polygon(
      c,
      [
        [x + step - 12, -11],
        [x + step + 8, -10],
        [x + step + 17, -3],
        [x + step + 17, 4],
        [x + step - 13, 4],
      ],
      outline,
    );
    polygon(
      c,
      [
        [x + step - 9, -8],
        [x + step + 6, -7],
        [x + step + 12, -2],
        [x + step - 10, -2],
      ],
      blue,
    );
    line(c, x + step - 10, 1, x + step + 13, 1, "#a4b0b5", 3);
  }
  polygon(
    c,
    [
      [-23, -59],
      [18, -59],
      [26, -42],
      [20, -20],
      [-20, -20],
      [-27, -39],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-20, -55],
      [15, -55],
      [22, -41],
      [17, -24],
      [-17, -24],
      [-23, -39],
    ],
    blue,
  );
  polygon(
    c,
    [
      [-17, -53],
      [12, -53],
      [17, -46],
      [-17, -44],
    ],
    light,
  );
  rect(c, -13, -44, 23, 15, steel);
  for (const x of [-9, -3, 3]) line(c, x, -41, x, -33, outline, 3);
  rect(c, -20, -24, 39, 7, outline);
  rect(c, -4, -24, 10, 7, "#a3adb4");
  // A sealed helmet and orange visor sit between enormous blue shoulder plates.
  oval(c, -18, -82, 39, 35, outline);
  oval(c, -15, -79, 33, 29, blue);
  polygon(
    c,
    [
      [-2, -76],
      [15, -73],
      [17, -65],
      [-1, -62],
      [-9, -65],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-1, -73],
      [12, -71],
      [13, -67],
      [0, -65],
      [-5, -67],
    ],
    "#e75332",
  );
  line(c, 0, -71, 8, -70, "#ffbf5d", 2);
  polygon(
    c,
    [
      [-6, -61],
      [17, -63],
      [17, -54],
      [6, -49],
      [-7, -53],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-3, -58],
      [13, -60],
      [13, -56],
      [6, -53],
      [-3, -55],
    ],
    steel,
  );
  line(c, 2, -58, 2, -54, outline, 2);
  line(c, 7, -59, 7, -54, outline, 2);
  for (const x of [-25, 21]) {
    polygon(
      c,
      [
        [x - 15, -62],
        [x - 10, -72],
        [x + 10, -70],
        [x + 17, -61],
        [x + 13, -47],
        [x - 11, -47],
      ],
      outline,
    );
    polygon(
      c,
      [
        [x - 11, -61],
        [x - 7, -68],
        [x + 8, -66],
        [x + 13, -60],
        [x + 10, -51],
        [x - 8, -51],
      ],
      blue,
    );
    line(c, x - 6, -65, x + 7, -63, light, 3);
    circle(c, x - 7, -54, 1.5, "#b8c3c9");
    circle(c, x + 8, -54, 1.5, "#b8c3c9");
  }
  line(c, 16, -59, 22, -55, "#e8eee9", 3);
  line(c, 22, -55, 29, -59, "#e8eee9", 3);
  // A chunky two-handed rifle fires from its heavy rectangular muzzle.
  const recoil =
    unit.attack > 0 ? Math.sin((unit.attack / 0.12) * Math.PI) * 3 : 0;
  c.save();
  c.translate(-recoil, 0);
  rect(c, -13, -46, 53, 16, outline);
  rect(c, -9, -43, 45, 10, "#75838e");
  rect(c, -4, -41, 21, 5, "#aab5ba");
  line(
    c,
    35,
    MARINE.muzzleY,
    MARINE.muzzleOffsetX,
    MARINE.muzzleY,
    outline,
    13,
  );
  rect(c, 38, -42, 15, 8, steel);
  rect(c, 51, -46, 9, 17, outline);
  rect(c, 54, -43, 4, 11, "#98a4aa");
  rect(c, 55, -40, 4, 6, "#141c23");
  rect(c, 10, -31, 13, 17, outline);
  rect(c, 13, -29, 7, 12, steel);
  line(c, 25, -31, 27, -24, outline, 7);
  line(c, -20, -44, -5, -31, outline, 15);
  line(c, -20, -44, -5, -31, blue, 9);
  oval(c, -11, -37, 16, 12, outline);
  oval(c, -8, -35, 10, 8, blue);
  oval(c, 26, -34, 17, 13, outline);
  oval(c, 29, -32, 11, 9, blue);
  if (unit.attack > 0.06) {
    polygon(
      c,
      [
        [60, -42],
        [70, -49],
        [67, -41],
        [78, -38],
        [67, -34],
        [70, -27],
        [60, -33],
      ],
      "#f4aa3e",
    );
    polygon(
      c,
      [
        [60, -40],
        [71, -38],
        [61, -35],
      ],
      "#fff0ac",
    );
  }
  c.restore();
}

function drawBarbarian(c: SkCanvas, unit: Unit, skin: string, time: number) {
  const outline = CHARACTER_INK;
  const flesh = unit.hit > 0 ? "#fff5d6" : "#dfae78";
  const hair = "#51331e";
  const stride = unit.attack > 0 ? 0 : Math.sin(time * 8 + unit.id) * 3;
  // Broad bare shoulders, muscular arms and planted hide-wrapped boots.
  line(c, -11, -14, -14 - stride, -2, outline, 13);
  line(c, 9, -14, 14 + stride, -2, outline, 13);
  line(c, -11, -14, -14 - stride, -2, flesh, 8);
  line(c, 9, -14, 14 + stride, -2, flesh, 8);
  oval(c, -23 - stride, -6, 20, 10, outline);
  oval(c, 5 + stride, -6, 22, 10, outline);
  rect(c, -19 - stride, -5, 13, 7, "#69503a");
  rect(c, 9 + stride, -5, 13, 7, "#69503a");
  polygon(
    c,
    [
      [-23, -49],
      [-11, -54],
      [13, -51],
      [24, -42],
      [16, -16],
      [-16, -16],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-19, -46],
      [-9, -50],
      [11, -47],
      [19, -40],
      [13, -19],
      [-13, -19],
    ],
    flesh,
  );
  line(c, 0, -44, 0, -26, "#b77f51", 2);
  line(c, -12, -39, -3, -37, "#b77f51", 2);
  line(c, 4, -37, 12, -39, "#b77f51", 2);
  line(c, -4, -29, 6, -29, "#b77f51", 2);
  // Ragged leather loincloth with a broad belt and metal buckle.
  polygon(
    c,
    [
      [-17, -23],
      [18, -23],
      [18, -8],
      [10, -11],
      [4, -3],
      [-3, -9],
      [-13, -5],
      [-19, -11],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-14, -20],
      [14, -20],
      [14, -12],
      [9, -15],
      [4, -8],
      [-2, -13],
      [-11, -10],
      [-15, -13],
    ],
    "#94603a",
  );
  rect(c, -18, -25, 36, 7, outline);
  rect(c, -16, -23, 32, 3, "#6b442a");
  rect(c, -3, -25, 9, 8, "#a6aaa2");
  rect(c, -1, -23, 5, 4, outline);
  // The reference's long haft and opposing crescent blades form one huge axe.
  const pose = meleeWeaponPose("barbarian", unit.attack);
  drawSwingArm(
    c,
    [-16, -40],
    swingPoint(pose, [-1, 0]),
    17,
    17,
    outline,
    flesh,
    11,
  );
  drawSwingArm(
    c,
    [16, -40],
    swingPoint(pose, [24, -2]),
    17,
    19,
    outline,
    flesh,
    11,
  );
  c.save();
  c.translate(pose.x, pose.y);
  c.rotate(pose.angle, 0, 0);
  c.translate(0, 25);
  line(c, -13, -22, 53, -28, outline, 9);
  line(c, -12, -22, 53, -28, "#986b3d", 5);
  line(c, -6, -23, 25, -26, "#c49860", 1.5);
  for (const flip of [-1, 1]) {
    const blade = [
      [42, 2],
      [34, 17],
      [43, 29],
      [56, 32],
      [67, 24],
      [70, 13],
      [56, 17],
      [51, 6],
    ];
    polygon(
      c,
      blade.map(([x, y]) => [x, -28 + y * flip]),
      outline,
    );
    polygon(
      c,
      [
        [44, 5],
        [39, 17],
        [46, 25],
        [55, 28],
        [63, 22],
        [65, 18],
        [55, 21],
        [48, 9],
      ].map(([x, y]) => [x, -28 + y * flip]),
      "#737f86",
    );
    line(c, 44, -28 + 25 * flip, 55, -28 + 29 * flip, "#d6dedc", 3);
    line(c, 55, -28 + 29 * flip, 65, -28 + 23 * flip, "#d6dedc", 3);
  }
  rect(c, 45, -34, 10, 12, outline);
  rect(c, 48, -32, 4, 8, "#a9b5b8");
  // Both hands stay on the moving haft; shoulders remain planted on the torso.
  line(c, -5, -29, -2, -20, "#563e2c", 6);
  line(c, 21, -31, 24, -23, "#563e2c", 6);
  circle(c, -1, -25, 5, flesh);
  circle(c, 24, -27, 5, flesh);
  c.restore();
  // The head occludes the far-side weapon and arms, keeping the face clear.
  // Long, uneven brown hair frames a stern, scarred face like the reference.
  polygon(
    c,
    [
      [-20, -43],
      [-23, -59],
      [-17, -76],
      [-7, -80],
      [5, -77],
      [17, -72],
      [21, -51],
      [16, -43],
      [9, -50],
      [-8, -46],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-17, -47],
      [-19, -58],
      [-14, -73],
      [-5, -76],
      [5, -73],
      [14, -69],
      [17, -51],
      [13, -48],
      [6, -53],
      [-8, -50],
    ],
    hair,
  );
  oval(c, -13, -73, 29, 29, outline);
  oval(c, -10, -70, 23, 23, flesh);
  polygon(
    c,
    [
      [-14, -62],
      [-13, -73],
      [-4, -77],
      [8, -73],
      [14, -65],
      [4, -69],
      [-2, -63],
      [-7, -67],
    ],
    hair,
  );
  line(c, 3, -62, 11, -60, outline, 3);
  line(c, 8, -59, 8, -55, outline, 3);
  line(c, 1, -58, -2, -50, "#b1694a", 1.5);
  line(c, 3, -49, 10, -49, outline, 2);
}

function drawMusicNote(c: SkCanvas, x: number, y: number, size = 1) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  // A connected pair of eighth notes stays readable even at battle scale.
  line(c, -4, 7, -4, -13, CHARACTER_INK, 8);
  line(c, 11, 3, 11, -17, CHARACTER_INK, 8);
  line(c, -4, -13, 11, -17, CHARACTER_INK, 9);
  oval(c, -16, 3, 16, 12, CHARACTER_INK);
  oval(c, -1, -1, 16, 12, CHARACTER_INK);
  line(c, -4, 7, -4, -13, "#e879ff", 4);
  line(c, 11, 3, 11, -17, "#e879ff", 4);
  line(c, -4, -13, 11, -17, "#e879ff", 5);
  oval(c, -13, 6, 10, 6, "#f6a4ff");
  oval(c, 2, 2, 10, 6, "#f6a4ff");
  line(c, -2, -12, 8, -15, "#ffe7ff", 1.5);
  c.restore();
}

function drawRapper(c: SkCanvas, unit: Unit, skin: string, swing: number) {
  const outline = CHARACTER_INK;
  const jacket = unit.hit > 0 ? "#fff5d6" : "#7849ac";
  drawCharacterBase(c, skin, jacket);
  // Oversized purple jacket, dark trousers and bright sneakers.
  polygon(
    c,
    [
      [-17, -30],
      [-22, -7],
      [-17, 0],
      [-4, 0],
      [-2, -14],
    ],
    outline,
  );
  polygon(
    c,
    [
      [5, -15],
      [3, 0],
      [18, 0],
      [21, -8],
      [16, -28],
    ],
    outline,
  );
  line(c, -16, -20, -16, -8, "#a578d0", 3);
  line(c, 14, -21, 15, -10, "#a578d0", 3);
  oval(c, -19, -5, 18, 9, outline);
  oval(c, 2, -5, 20, 9, outline);
  line(c, -16, 0, -5, 0, "#f2e9d5", 3);
  line(c, 6, 0, 18, 0, "#f2e9d5", 3);
  // Angular oversized sunglasses with gold rims and decorated temples.
  line(c, -18, -50, 19, -50, "#d7ab44", 5);
  polygon(
    c,
    [
      [-18, -53],
      [-2, -53],
      [-3, -41],
      [-14, -41],
    ],
    "#e2b94f",
  );
  polygon(
    c,
    [
      [1, -53],
      [18, -52],
      [14, -40],
      [3, -41],
    ],
    "#e2b94f",
  );
  polygon(
    c,
    [
      [-15, -50],
      [-5, -50],
      [-6, -44],
      [-12, -44],
    ],
    "#171c2a",
  );
  polygon(
    c,
    [
      [4, -50],
      [14, -49],
      [12, -43],
      [5, -44],
    ],
    "#171c2a",
  );
  line(c, -13, -49, -9, -47, "#7d9daf", 1.5);
  line(c, 7, -49, 11, -47, "#7d9daf", 1.5);
  circle(c, -17, -49, 1.4, "#fff2b4");
  // A thick gold chain leads to a large, explicitly dollar-sign medallion.
  for (const [x, y, xx, yy] of [
    [-13, -34, -10, -25],
    [-10, -25, 0, -20],
    [0, -20, 11, -25],
    [11, -25, 14, -34],
  ]) {
    line(c, x, y, xx, yy, outline, 7);
    line(c, x, y, xx, yy, "#e7b73c", 4);
  }
  for (const [x, y] of [
    [-11, -30],
    [-7, -23],
    [7, -23],
    [13, -30],
  ])
    circle(c, x, y, 1.5, "#fff0a2");
  circle(c, 0, -13, 11, outline);
  circle(c, 0, -13, 8.5, "#d59c28");
  circle(c, -1, -14, 6.5, "#f5cb59");
  line(c, 3, -18, -3, -18, "#775019", 2);
  line(c, -3, -18, -4, -14, "#775019", 2);
  line(c, -4, -14, 3, -12, "#775019", 2);
  line(c, 3, -12, 3, -8, "#775019", 2);
  line(c, 3, -8, -4, -8, "#775019", 2);
  line(c, 0, -21, 0, -5, "#775019", 1.5);
  // Raised microphone, silver grille and an open mouth on each vocal attack.
  line(c, 13, -29, 22, -23, outline, 9);
  line(c, 22, -23, 27, -32, outline, 9);
  line(c, 13, -29, 22, -23, jacket, 5);
  line(c, 22, -23, 27, -32, skin, 5);
  line(c, 26, -29, RAPPER.micX, RAPPER.micY, outline, 7);
  line(c, 27, -30, RAPPER.micX, RAPPER.micY, "#717d88", 3);
  circle(c, RAPPER.micX, RAPPER.micY, 8, outline);
  circle(c, RAPPER.micX, RAPPER.micY, 5.5, "#b7c4ce");
  for (const y of [-47, -44, -41]) line(c, 28, y, 36, y, "#627383", 1);
  line(c, 31, -49, 31, -39, "#627383", 1);
  line(c, 34, -49, 34, -39, "#627383", 1);
  circle(c, 26, -31, 4, skin);
  if (unit.attack > 0) {
    oval(c, 10, -38, 8, 4 + swing * 3, outline);
    line(c, 42, -49, 46, -51, "#e879ff", 2);
    line(c, 43, -43, 48, -43, "#e879ff", 2);
    line(c, 41, -37, 46, -35, "#e879ff", 2);
  }
}

function drawMafia(c: SkCanvas, unit: Unit, skin: string) {
  const outline = CHARACTER_INK;
  const suit = unit.hit > 0 ? "#fff5d6" : "#333946";
  drawCharacterBase(c, skin, suit);
  // Fine pale stripes run through the dark suit and trousers.
  for (const x of [-11, -5, 1, 7, 13]) line(c, x, -32, x, -4, "#8f98a6", 1);
  line(c, 0, -12, 0, 1, outline, 3);
  oval(c, -16, -4, 15, 7, outline);
  oval(c, 2, -4, 17, 7, outline);
  polygon(
    c,
    [
      [-8, -38],
      [10, -38],
      [1, -15],
    ],
    "#f6f0df",
  );
  polygon(
    c,
    [
      [-1, -36],
      [4, -36],
      [5, -31],
      [2, -21],
      [-1, -31],
    ],
    "#a63242",
  );
  polygon(
    c,
    [
      [-11, -38],
      [-3, -36],
      [-8, -30],
      [-3, -25],
      [-12, -18],
    ],
    "#555e6c",
  );
  polygon(
    c,
    [
      [11, -38],
      [4, -36],
      [9, -30],
      [5, -25],
      [14, -18],
    ],
    "#555e6c",
  );
  // Broad brim, pinched crown and contrasting ribbon make a clear fedora.
  polygon(
    c,
    [
      [-21, -55],
      [-17, -75],
      [-5, -73],
      [3, -77],
      [18, -73],
      [21, -55],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-17, -57],
      [-14, -71],
      [-5, -69],
      [4, -73],
      [15, -70],
      [17, -57],
    ],
    "#454b57",
  );
  line(c, -13, -68, 4, -66, "#687181", 2);
  polygon(
    c,
    [
      [-18, -63],
      [18, -63],
      [20, -56],
      [-20, -56],
    ],
    "#a3a9ae",
  );
  oval(c, -28, -59, 56, 10, outline);
  oval(c, -25, -57, 50, 5, "#4d5562");
  const recoil =
    unit.attack > 0 ? Math.sin((unit.attack / 0.12) * Math.PI) * 2 : 0;
  c.save();
  c.translate(-recoil, 0);
  // Wood stock and foregrip, a finned barrel and large round drum magazine.
  polygon(
    c,
    [
      [-27, -29],
      [-5, -28],
      [-3, -20],
      [-24, -13],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-23, -26],
      [-8, -25],
      [-7, -22],
      [-21, -18],
    ],
    "#98613c",
  );
  line(c, 26, TOMMY.muzzleY, TOMMY.muzzleOffsetX, TOMMY.muzzleY, outline, 8);
  line(c, 27, -27, 48, -27, "#7c8790", 4);
  for (const x of [33, 37, 41]) line(c, x, -30, x, -24, outline, 1.5);
  rect(c, 47, -32, 5, 9, outline);
  rect(c, 47, -35, 3, 4, outline);
  rect(c, -5, -33, 34, 12, outline);
  rect(c, -2, -30, 28, 6, "#66717d");
  line(c, 0, -32, 22, -32, "#aab4bd", 1.5);
  line(c, 0, -22, -3, -12, outline, 6);
  line(c, 1, -22, -1, -15, "#98613c", 3);
  line(c, 33, -24, 32, -14, outline, 7);
  line(c, 33, -23, 32, -16, "#98613c", 4);
  circle(c, 16, -15, 10, outline);
  circle(c, 16, -15, 7, "#535e6a");
  circle(c, 16, -15, 3.5, "#87919b");
  circle(c, 16, -15, 1.5, outline);
  outlinedOval(c, -8, -21, 12, 9, skin);
  outlinedOval(c, 28, -20, 10, 8, skin);
  if (unit.attack > 0.06) {
    polygon(
      c,
      [
        [52, -30],
        [60, -36],
        [58, -29],
        [66, -27],
        [58, -24],
        [60, -18],
        [52, -24],
      ],
      "#f3aa3f",
    );
    polygon(
      c,
      [
        [52, -28],
        [61, -27],
        [53, -24],
      ],
      "#fff3b7",
    );
    rect(c, 4 - recoil * 2, -38, 4, 2, "#e8c46c");
  }
  c.restore();
}

function drawCyborgWalrus(
  c: SkCanvas,
  unit: Unit,
  time: number,
  thrust: number,
) {
  const outline = CHARACTER_INK;
  const hide = unit.hit > 0 ? "#fff5d6" : "#9a6b52";
  const metal = unit.hit > 0 ? "#fff5d6" : "#91a4b3";
  const paddle = Math.sin(time * 7 + unit.id) * 3;
  // Heavy rounded body and broad flippers stay low during the tusk lunge.
  polygon(
    c,
    [
      [-21, -13],
      [-39, -7 + paddle],
      [-33, 1],
      [-15, -3],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-22, -10],
      [-34, -6 + paddle],
      [-31, -2],
      [-18, -5],
    ],
    hide,
  );
  oval(c, -32, -46, 65, 47, outline);
  oval(c, -29, -43, 59, 41, hide);
  oval(c, -20, -30, 40, 26, "#b58367");
  oval(c, -23, -21, 24, 22, outline);
  oval(c, -20, -19, 18, 17, hide);
  line(c, -15, -9, -13, -3, "#654733", 2);
  line(c, -10, -10, -8, -4, "#654733", 2);
  c.save();
  c.translate(thrust * 9, -thrust * 2);
  c.rotate(-thrust * 18, 10, -42);
  oval(c, -10, -73, 55, 48, outline);
  oval(c, -7, -70, 49, 42, hide);
  // A straight central seam divides the organic and plated halves of the head.
  polygon(
    c,
    [
      [19, -70],
      [30, -69],
      [39, -62],
      [42, -51],
      [39, -36],
      [29, -29],
      [19, -28],
    ],
    metal,
  );
  polygon(
    c,
    [
      [30, -65],
      [37, -60],
      [39, -49],
      [35, -39],
      [28, -34],
      [28, -47],
    ],
    "#607481",
  );
  line(c, 19, -69, 19, -32, outline, 3);
  line(c, 24, -65, 31, -63, "#d5e5eb", 3);
  for (const [x, y] of [
    [23, -66],
    [37, -49],
    [25, -34],
  ]) {
    circle(c, x, y, 2.4, outline);
    circle(c, x - 0.4, y - 0.4, 1, "#d5e5eb");
  }
  // One natural eye and exactly one glowing red cybernetic eye.
  oval(c, 3, -60, 8, 9, outline);
  circle(c, 7, -57, 1.4, "#ffffff");
  circle(c, 31, -57, 8, outline);
  circle(c, 31, -57, 5.5, "#b51c35");
  circle(c, 31, -57, 3.5, "#ff3645");
  circle(c, 32, -58, 1.5, "#ffd6ce");
  // Both long ivory tusks swing forward together; no ranged weapon.
  for (const x of [9, 30]) {
    polygon(
      c,
      [
        [x, -38],
        [x + 10, -38],
        [x + 9, -17],
        [x + 5, -5],
        [x + 1, -1],
        [x + 2, -20],
      ],
      outline,
    );
    polygon(
      c,
      [
        [x + 3, -36],
        [x + 7, -36],
        [x + 6, -18],
        [x + 3, -8],
        [x + 4, -23],
      ],
      "#fff0c7",
    );
    line(c, x + 4, -34, x + 4, -21, "#fffceb", 2);
  }
  oval(c, -1, -47, 25, 16, outline);
  oval(c, 2, -45, 19, 12, "#d4ad8a");
  oval(c, 18, -46, 25, 16, outline);
  oval(c, 21, -44, 19, 12, "#d4ad8a");
  oval(c, 13, -49, 15, 9, outline);
  for (const [x, y, endX, endY] of [
    [7, -40, -5, -42],
    [8, -36, -5, -34],
    [34, -39, 46, -40],
    [33, -35, 45, -32],
  ])
    line(c, x, y, endX, endY, "#f1d1ac", 1.5);
  c.restore();
}

function drawTiger(c: SkCanvas, unit: Unit, time: number) {
  const outline = CHARACTER_INK;
  const orange = unit.hit > 0 ? "#fff5d6" : "#e79335";
  const cream = "#fff0cb";
  const stride = unit.attack > 0 ? 0 : Math.sin(time * 8 + unit.id) * 4;
  const tail = Math.sin(time * 5 + unit.id) * 4;
  // Upright curled tail, four padded paws and black stripes identify the tiger.
  line(c, -24, -26, -39, -36, outline, 10);
  line(c, -39, -36, -43 + tail, -51, outline, 10);
  line(c, -24, -26, -39, -36, orange, 6);
  line(c, -39, -36, -43 + tail, -51, orange, 6);
  line(c, -40, -41, -42 + tail, -48, outline, 6);
  for (const [x, swing] of [
    [-17, -stride],
    [16, stride],
  ]) {
    line(c, x, -21, x + swing, -5, outline, 12);
    line(c, x, -21, x + swing, -5, "#ad6528", 8);
    oval(c, x + swing - 4, -7, 12, 7, outline);
  }
  oval(c, -30, -38, 59, 29, outline);
  oval(c, -27, -35, 53, 23, orange);
  oval(c, -20, -21, 44, 9, cream);
  for (const x of [-19, -7, 6])
    polygon(
      c,
      [
        [x - 3, -35],
        [x + 4, -35],
        [x + 2, -20],
        [x - 1, -26],
      ],
      outline,
    );
  for (const [x, swing] of [
    [-23, stride],
    [12, -stride],
  ]) {
    line(c, x, -20, x + swing, -5, outline, 12);
    line(c, x, -20, x + swing, -5, orange, 8);
    line(c, x - 3, -13, x + 3, -12, outline, 3);
    oval(c, x + swing - 5, -7, 15, 8, outline);
    oval(c, x + swing - 3, -5, 11, 4, cream);
  }
  circle(c, 18, -51, 8, outline);
  circle(c, 18, -51, 5, orange);
  circle(c, 37, -50, 7, outline);
  circle(c, 37, -50, 4, orange);
  oval(c, 10, -53, 36, 32, outline);
  oval(c, 13, -50, 30, 26, orange);
  polygon(
    c,
    [
      [24, -50],
      [30, -50],
      [28, -43],
    ],
    outline,
  );
  polygon(
    c,
    [
      [14, -41],
      [22, -38],
      [14, -35],
    ],
    outline,
  );
  polygon(
    c,
    [
      [14, -31],
      [23, -32],
      [17, -26],
    ],
    outline,
  );
  oval(c, 27, -33, 20, 13, outline);
  oval(c, 28, -32, 17, 10, cream);
  polygon(
    c,
    [
      [37, -33],
      [44, -32],
      [40, -28],
    ],
    outline,
  );
  line(c, 40, -28, 39, -25, outline, 1.5);
  line(c, 27, -28, 21, -29, outline, 1);
  line(c, 28, -25, 22, -23, outline, 1);
  for (const eye of TIGER.eyes) {
    oval(c, eye.x - 4, eye.y - 3, 8, 6, outline);
    circle(c, eye.x, eye.y, unit.attack > 0 ? 3.3 : 2, "#ff303d");
    circle(c, eye.x + 0.5, eye.y - 0.5, unit.attack > 0 ? 1.6 : 0.8, "#ffe5d9");
  }
}

function drawShark(c: SkCanvas, unit: Unit, time: number, bite: number) {
  const outline = CHARACTER_INK;
  const blue = unit.hit > 0 ? "#fff5d6" : "#729caf";
  const belly = "#e2ece7";
  const tail = Math.sin(time * 8 + unit.id) * 5;
  c.save();
  c.translate(bite * 5, 0);
  // A broad forked tail, dorsal fin and pale belly keep the silhouette aquatic.
  polygon(
    c,
    [
      [-24, -29],
      [-44, -47 + tail],
      [-40, -27],
      [-46, -8 + tail],
      [-24, -20],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-26, -28],
      [-40, -40 + tail],
      [-36, -26],
      [-40, -15 + tail],
      [-26, -22],
    ],
    blue,
  );
  polygon(
    c,
    [
      [-14, -38],
      [-10, -64],
      [9, -36],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-9, -39],
      [-8, -56],
      [4, -38],
    ],
    blue,
  );
  oval(c, -30, -45, 67, 39, outline);
  oval(c, -27, -42, 61, 33, blue);
  oval(c, -19, -27, 50, 15, belly);
  polygon(
    c,
    [
      [-7, -22],
      [7, -8],
      [16, -26],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-2, -22],
      [7, -13],
      [11, -24],
    ],
    "#557b90",
  );
  // The upper snout stays fixed while the lower jaw opens and snaps shut.
  const gape = 3 + bite * 12;
  polygon(
    c,
    [
      [12, -30],
      [38, -32],
      [32, -24 + gape],
      [11, -23],
    ],
    outline,
  );
  polygon(
    c,
    [
      [16, -29],
      [34, -30],
      [29, -25 + gape],
      [14, -24],
    ],
    "#773c49",
  );
  for (let tooth = 0; tooth < 3; tooth++) {
    const x = 17 + tooth * 6;
    polygon(
      c,
      [
        [x, -30],
        [x + 5, -30],
        [x + 2, -24],
      ],
      "#fff9e7",
    );
    if (bite > 0.2)
      polygon(
        c,
        [
          [x, -23 + gape],
          [x + 5, -24 + gape],
          [x + 2, -29 + gape],
        ],
        "#fff9e7",
      );
  }
  line(c, 12, -20 + gape, 31, -21 + gape, outline, 4);
  circle(c, 20, -37, 5, outline);
  circle(c, 21, -38, 1.4, "#ffffff");
  line(c, 14, -43, 24, -41, outline, 2.5);
  for (let gill = 0; gill < 3; gill++)
    line(c, 1 - gill * 5, -35, -1 - gill * 5, -28, "#35576b", 2);
  line(c, -19, -35, -12, -37, "#a9c4cd", 2);
  c.restore();
}

function drawCannon(c: SkCanvas, unit: Unit) {
  const outline = CHARACTER_INK;
  const metal = unit.hit > 0 ? "#fff5d6" : "#596b73";
  const trim = unit.side === "player" ? "#53c4b1" : "#f48672";
  const recoil = (unit.attack / 0.25) * 8;
  // The far wheel and long wooden trail sit behind the barrel and near wheel.
  circle(c, 14, -12, 13, outline);
  circle(c, 14, -12, 10, "#785335");
  polygon(
    c,
    [
      [-39, -5],
      [-34, -13],
      [12, -26],
      [23, -16],
      [-29, -2],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-34, -6],
      [-31, -10],
      [11, -22],
      [17, -17],
    ],
    "#b4854e",
  );
  line(c, -9, -16, 7, -35, outline, 12);
  line(c, -9, -16, 7, -35, "#b4854e", 7);
  c.save();
  c.translate(-recoil, 0);
  polygon(
    c,
    [
      [-22, -42],
      [39, -46],
      [43, -26],
      [-21, -23],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-19, -39],
      [37, -42],
      [39, -29],
      [-18, -27],
    ],
    metal,
  );
  line(c, -13, -37, 32, -40, "#94a6ac", 3);
  line(c, -10, -40, -9, -26, outline, 4);
  line(c, 28, -43, 30, -28, outline, 4);
  oval(c, 36, -46, 10, 21, outline);
  oval(c, 39, -42, 5, 13, "#080e13");
  rect(c, -3, -33, 14, 4, trim);
  circle(c, -21, -33, 5, outline);
  if (unit.attack > 0.18) {
    polygon(
      c,
      [
        [46, -36],
        [55, -44],
        [54, -38],
        [66, -35],
        [54, -31],
        [55, -26],
      ],
      "#ffbb48",
    );
    polygon(
      c,
      [
        [46, -36],
        [57, -36],
        [50, -31],
      ],
      "#fff4b3",
    );
    circle(c, 59, -45, 5, "#c7c9bb");
    circle(c, 68, -48, 3, "#e2e1cf");
  }
  c.restore();
  circle(c, -4, -13, 16, outline);
  circle(c, -4, -13, 13, "#a97743");
  circle(c, -4, -13, 10, "#67452e");
  c.save();
  c.translate(-4, -13);
  // Rotation follows distance traveled, so wheels stop while firing.
  c.rotate((unit.x / 13) * (180 / Math.PI), 0, 0);
  for (let spoke = 0; spoke < 6; spoke++) {
    c.rotate(60, 0, 0);
    line(c, 0, 0, 0, -10, "#c3975b", 3);
  }
  c.restore();
  circle(c, -4, -13, 5, outline);
  circle(c, -4, -13, 2.5, "#b5c2c5");
}

function drawFireball(c: SkCanvas, time: number, scale = 1) {
  c.save();
  c.scale(scale, scale);
  const flicker = Math.sin(time * 27) * 2;
  polygon(
    c,
    [
      [-7, -7],
      [-28 - flicker, -11],
      [-20, -2],
      [-34, 3],
      [-9, 9],
      [5, 5],
      [10, 0],
      [5, -6],
    ],
    "#783329",
  );
  polygon(
    c,
    [
      [-5, -5],
      [-24 - flicker, -8],
      [-15, -1],
      [-27, 3],
      [-7, 7],
      [5, 4],
      [8, 0],
      [4, -4],
    ],
    "#ed6030",
  );
  circle(c, 0, 0, 8, "#ff9a32");
  circle(c, 1, -1, 5, "#ffe165");
  circle(c, 3, -2, 2.5, "#fff9ca");
  circle(c, -19, 8, 2, "#ffb13e");
  circle(c, -27, -6, 1.5, "#ffd873");
  c.restore();
}

function drawDarkMage(c: SkCanvas, unit: Unit, time: number, swing: number) {
  c.save();
  c.scale(1, MAGE.heightScale);
  const orbY = MAGE.staffY / MAGE.heightScale;
  const edge = "#202d3b";
  const blue = unit.hit > 0 ? "#fff5d6" : "#2475ad";
  const sway = Math.sin(time * 6 + unit.id) * 2;
  // Short blue-robed mage with a single pointed straw cone and one brim.
  oval(c, -21, -4, 40, 8, edge);
  polygon(
    c,
    [
      [-14, -65],
      [14, -66],
      [21, -45],
      [20, -20],
      [27, 3],
      [-29, 3],
      [-22, -16],
      [-22, -46],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-11, -62],
      [11, -63],
      [17, -44],
      [15, -20],
      [21, -1],
      [-23, -1],
      [-17, -17],
      [-18, -45],
    ],
    blue,
  );
  polygon(
    c,
    [
      [-10, -59],
      [-4, -55],
      [-8, -28],
      [-12, -5],
      [-22, -1],
      [-16, -19],
      [-17, -43],
    ],
    "#36b7e7",
  );
  polygon(
    c,
    [
      [8, -57],
      [15, -44],
      [11, -20],
      [17, -2],
      [3, -2],
      [5, -33],
    ],
    "#155184",
  );
  polygon(
    c,
    [
      [-18, -7],
      [-7, -4],
      [8, -5],
      [18, -7],
      [21, -1],
      [-23, -1],
    ],
    "#61cae7",
  );
  line(c, -8, -47, -8 + sway, -22, "#4599c3", 2);
  polygon(
    c,
    [
      [-19, -82],
      [12, -85],
      [24, -72],
      [20, -57],
      [-17, -55],
      [-25, -66],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-15, -79],
      [11, -81],
      [19, -72],
      [16, -60],
      [-15, -59],
      [-20, -67],
    ],
    "#0b1823",
  );
  oval(c, -7, -73, 5, 10, "#ffd44d");
  oval(c, 9, -74, 5, 10, "#ffd44d");
  polygon(
    c,
    [
      [-27, -148],
      [-3, -129],
      [5, -108],
      [27, -84],
      [-29, -84],
      [-17, -112],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-23, -141],
      [-6, -126],
      [1, -106],
      [21, -87],
      [-24, -87],
      [-13, -112],
    ],
    "#d5a43b",
  );
  polygon(
    c,
    [
      [-23, -141],
      [-11, -122],
      [-7, -108],
      [8, -88],
      [-23, -88],
      [-13, -112],
    ],
    "#f4d477",
  );
  // Fine straw seams follow the cone; no horizontal shelf above the band.
  line(c, -13, -119, -18, -91, "#c09232", 1);
  line(c, -8, -116, -3, -91, "#c09232", 1);
  line(c, -2, -107, 10, -91, "#b9862b", 1);
  polygon(
    c,
    [
      [-25, -91],
      [20, -91],
      [26, -84],
      [-28, -84],
    ],
    "#76561d",
  );
  // One broad straw brim sits directly beneath the band and buckle.
  polygon(
    c,
    [
      [-28, -85],
      [25, -85],
      [33, -79],
      [29, -75],
      [-29, -75],
      [-34, -79],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-27, -82],
      [24, -82],
      [29, -79],
      [26, -78],
      [-27, -78],
      [-30, -79],
    ],
    "#e4b84e",
  );
  rect(c, 1, -90, 7, 7, "#f8d659");
  rect(c, 3, -88, 3, 3, "#3bc6df");
  // A sleeve and gloved hand grasp the gnarled staff and its fire orb.
  polygon(
    c,
    [
      [12, -59],
      [24, -54],
      [31, -40],
      [25, -32],
      [12, -39],
      [8, -49],
    ],
    edge,
  );
  polygon(
    c,
    [
      [14, -55],
      [21, -51],
      [26, -41],
      [23, -37],
      [15, -42],
      [12, -49],
    ],
    "#319cd0",
  );
  line(c, 29, -2, 32, -41, edge, 8);
  line(c, 32, -41, MAGE.staffX, -77, edge, 8);
  line(c, 29, -3, 32, -41, "#9c713c", 4);
  line(c, 32, -41, MAGE.staffX, -77, "#b88c48", 4);
  line(c, 32, -40, 34, -50, "#e1bc6b", 2);
  line(c, 36, -76, 29, -87, edge, 7);
  line(c, 29, -87, 34, -95, edge, 6);
  line(c, 43, -76, 49, -88, edge, 7);
  line(c, 49, -88, 44, -95, edge, 6);
  line(c, 36, -76, 30, -87, "#b88c48", 3);
  line(c, 43, -76, 48, -88, "#b88c48", 3);
  circle(c, MAGE.staffX, orbY, 9, edge);
  circle(c, MAGE.staffX, orbY, 6, "#f1a834");
  circle(c, MAGE.staffX + 1, orbY - 2, 3, "#fff1a7");
  oval(c, 25, -43, 10, 10, edge);
  oval(c, 27, -41, 6, 6, "#e7bc68");
  if (unit.attack > 0) {
    c.save();
    c.translate(MAGE.staffX + 3, orbY);
    drawFireball(c, time, 0.85 + swing * 0.3);
    c.restore();
    line(c, 48, -95, 52, -101, "#ffdc72", 2);
    line(c, 50, -78, 57, -75, "#ffb941", 2);
  } else circle(c, 38, -94 + Math.sin(time * 4), 1.5, "#ffd768");
  c.restore();
}

function drawSkeletonKing(c: SkCanvas, unit: Unit, time: number) {
  const edge = "#252d32";
  const bone = unit.hit > 0 ? "#ffffff" : "#e9e2c9";
  const shade = "#aaa58f";
  const flutter = Math.sin(time * 5 + unit.id) * 3;
  const stride = unit.attack > 0 ? 0 : Math.sin(time * 8 + unit.id) * 3;
  // Royal cloak stays behind the exposed ribs and skeletal limbs.
  polygon(
    c,
    [
      [-19, -75],
      [13, -74],
      [21, -54],
      [27, -5],
      [15, -10],
      [8, -3],
      [-1, -11],
      [-13, -3],
      [-22, -10],
      [-34 + flutter, -3],
      [-29, -43],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-17, -72],
      [10, -71],
      [17, -51],
      [22, -12],
      [13, -16],
      [7, -10],
      [-2, -17],
      [-12, -10],
      [-20, -16],
      [-28 + flutter, -10],
      [-24, -42],
    ],
    "#543c73",
  );
  polygon(
    c,
    [
      [-17, -69],
      [-9, -68],
      [-9, -18],
      [-20, -11],
      [-22, -40],
    ],
    "#82609c",
  );
  polygon(
    c,
    [
      [8, -69],
      [15, -53],
      [19, -17],
      [9, -21],
    ],
    "#332a52",
  );
  // Bare leg bones and broad, individually marked bony feet.
  for (const [x, step] of [
    [-11, stride],
    [10, -stride],
  ]) {
    c.save();
    c.translate(x, step);
    line(c, 0, -32, 2, -18, edge, 9);
    line(c, 0, -32, 2, -18, bone, 5);
    circle(c, 2, -17, 5, edge);
    circle(c, 2, -17, 3, bone);
    line(c, 1, -12, -1, -1, edge, 8);
    line(c, 1, -12, -1, -1, bone, 4);
    oval(c, -6, -3, 20, 8, edge);
    oval(c, -3, -1, 15, 4, bone);
    for (let toe = 3; toe <= 9; toe += 3) line(c, toe, 0, toe, 2, shade, 1);
    c.restore();
  }
  // Pelvis, spine and a visibly open rib cage.
  polygon(
    c,
    [
      [-14, -40],
      [13, -40],
      [14, -30],
      [7, -25],
      [0, -31],
      [-8, -25],
      [-15, -32],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-11, -37],
      [10, -37],
      [10, -32],
      [6, -30],
      [0, -35],
      [-7, -30],
      [-11, -33],
    ],
    bone,
  );
  line(c, 0, -69, 0, -36, edge, 7);
  line(c, 0, -68, 0, -37, bone, 3);
  for (let rib = 0; rib < 4; rib++) {
    const y = -65 + rib * 7;
    line(c, -15 + rib, y, 0, y + 5, edge, 7);
    line(c, 0, y + 5, 14 - rib, y, edge, 7);
    line(c, -14 + rib, y, 0, y + 4, bone, 3);
    line(c, 0, y + 4, 13 - rib, y, bone, 3);
  }
  line(c, -15, -71, 0, -68, bone, 5);
  line(c, 0, -68, 15, -71, bone, 5);
  // Left arm and a gold cloak clasp at the collar.
  line(c, -17, -68, -22, -49, edge, 10);
  line(c, -17, -68, -22, -49, bone, 5);
  circle(c, -22, -48, 4, bone);
  line(c, -22, -45, -20, -32, edge, 9);
  line(c, -22, -45, -20, -32, bone, 4);
  oval(c, -26, -33, 13, 10, edge);
  oval(c, -23, -31, 8, 6, bone);
  for (let finger = 0; finger < 3; finger++)
    line(c, -23 + finger * 3, -29, -23 + finger * 3, -26, shade, 1);
  circle(c, -16, -70, 6, edge);
  circle(c, -16, -70, 4, "#eab842");
  circle(c, -16, -70, 2, "#7cf27a");
  // Skull: deep eye sockets, nasal cavity, cheek bones and a toothed jaw.
  line(c, 0, -72, 0, -79, bone, 7);
  outlinedOval(c, -17, -98, 36, 29, bone);
  polygon(
    c,
    [
      [-15, -81],
      [16, -82],
      [13, -68],
      [-10, -68],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-11, -80],
      [12, -80],
      [10, -71],
      [-8, -71],
    ],
    bone,
  );
  oval(c, -13, -88, 13, 10, edge);
  oval(c, 5, -89, 12, 10, edge);
  circle(c, -6, -84, 2, "#76ff80");
  circle(c, 11, -85, 2, "#76ff80");
  polygon(
    c,
    [
      [1, -83],
      [-3, -77],
      [5, -77],
    ],
    edge,
  );
  line(c, -9, -74, 11, -74, edge, 2);
  for (let tooth = -5; tooth <= 8; tooth += 4)
    line(c, tooth, -77, tooth, -70, edge, 1.3);
  // Three-point gold crown with emerald stones and a dark inset band.
  polygon(
    c,
    [
      [-20, -96],
      [-23, -111],
      [-12, -104],
      [-4, -114],
      [4, -104],
      [16, -113],
      [20, -96],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-17, -98],
      [-19, -106],
      [-11, -100],
      [-4, -109],
      [4, -100],
      [14, -108],
      [16, -98],
    ],
    "#ffd458",
  );
  rect(c, -18, -100, 36, 7, "#c88b26");
  line(c, -17, -95, 17, -95, "#ffe58c", 2);
  polygon(
    c,
    [
      [-4, -102],
      [0, -106],
      [4, -102],
      [0, -98],
    ],
    "#55ef78",
  );
  circle(c, -12, -97, 1.5, "#9fff92");
  circle(c, 11, -97, 1.5, "#9fff92");
  // The whole sword arm follows its grip; the contact blade edge is 84.
  const pose = meleeWeaponPose("skeletonKing", unit.attack);
  drawSwingArm(c, [16, -67], [pose.x, pose.y], 16, 20, edge, bone, 9, -1);
  c.save();
  c.translate(pose.x, pose.y);
  c.rotate(pose.angle, 0, 0);
  const handX = 0,
    handY = 0,
    tipX = 52,
    tipY = 4;
  if (unit.attack > 0) {
    line(c, 20, -31, 47, -10, "#257c4c", 4);
    line(c, 28, -24, 50, -4, "#58d96b", 2);
  }
  line(c, handX, handY, tipX, tipY, "#215f3f", 12);
  line(c, handX, handY, tipX, tipY, "#36cf63", 8);
  line(c, handX, handY, tipX, tipY, "#a4ff72", 5);
  line(c, handX, handY, tipX, tipY, "#ecffc9", 2);
  line(c, handX - 5, handY + 11, handX, handY, edge, 8);
  line(c, handX - 5, handY + 11, handX, handY, "#a97c35", 4);
  line(c, handX - 9, handY - 1, handX + 8, handY + 3, edge, 7);
  line(c, handX - 9, handY - 1, handX + 8, handY + 3, "#f5c85b", 3);
  oval(c, handX - 6, handY + 1, 12, 10, edge);
  oval(c, handX - 3, handY + 3, 7, 6, bone);
  c.restore();
}

function drawGundam(c: SkCanvas, unit: Unit, time: number) {
  const edge = "#1e2b40";
  const white = unit.hit > 0 ? "#fff6d7" : "#e9eef1";
  const blue = unit.hit > 0 ? "#fff6d7" : "#2456ce";
  const walk = unit.attack > 0 ? 0 : Math.sin(time * 8 + unit.id) * 3;
  // Backpack and tall antennae echo the reference's armored silhouette.
  rect(c, -29, -91, 19, 44, edge);
  rect(c, -26, -87, 10, 32, "#596b86");
  line(c, -22, -87, -27, -116, edge, 6);
  line(c, -27, -116, -27, -122, "#9faeb9", 3);
  // Articulated thighs, armored shins and broad blue boots.
  for (const [x, stride] of [
    [-19, walk],
    [13, -walk],
  ]) {
    c.save();
    c.translate(x, stride);
    rect(c, -9, -49, 18, 21, edge);
    polygon(
      c,
      [
        [-7, -47],
        [7, -47],
        [9, -30],
        [-7, -28],
      ],
      white,
    );
    circle(c, 1, -27, 8, edge);
    circle(c, 1, -27, 4, "#8a9bae");
    polygon(
      c,
      [
        [-9, -25],
        [11, -25],
        [14, -7],
        [-13, -7],
      ],
      edge,
    );
    polygon(
      c,
      [
        [-6, -24],
        [8, -24],
        [10, -9],
        [-10, -9],
      ],
      white,
    );
    polygon(
      c,
      [
        [-6, -24],
        [8, -24],
        [7, -16],
        [-5, -15],
      ],
      blue,
    );
    polygon(
      c,
      [
        [-14, -11],
        [11, -12],
        [18, -3],
        [18, 3],
        [-17, 3],
      ],
      edge,
    );
    polygon(
      c,
      [
        [-11, -9],
        [9, -9],
        [14, -3],
        [-14, -3],
      ],
      blue,
    );
    line(c, -12, 0, 14, 0, "#9faeb9", 2);
    c.restore();
  }
  // Angular blue torso, gold vents and white hip skirts.
  polygon(
    c,
    [
      [-23, -86],
      [19, -88],
      [27, -62],
      [17, -46],
      [-18, -46],
      [-29, -62],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-19, -83],
      [16, -84],
      [21, -63],
      [13, -52],
      [-15, -52],
      [-24, -64],
    ],
    blue,
  );
  polygon(
    c,
    [
      [-17, -81],
      [-3, -77],
      [-5, -69],
      [-20, -74],
    ],
    "#f4b334",
  );
  polygon(
    c,
    [
      [5, -77],
      [17, -81],
      [20, -74],
      [7, -69],
    ],
    "#f4b334",
  );
  rect(c, -8, -67, 15, 13, "#133579");
  rect(c, -5, -64, 9, 7, "#8acbff");
  rect(c, -19, -51, 37, 9, edge);
  rect(c, -5, -49, 12, 7, "#e8a52e");
  polygon(
    c,
    [
      [-20, -48],
      [-6, -46],
      [-8, -31],
      [-26, -36],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-18, -45],
      [-9, -44],
      [-11, -35],
      [-22, -38],
    ],
    white,
  );
  polygon(
    c,
    [
      [9, -46],
      [22, -48],
      [28, -35],
      [10, -31],
    ],
    edge,
  );
  polygon(
    c,
    [
      [12, -44],
      [20, -45],
      [24, -37],
      [13, -35],
    ],
    white,
  );
  // Raised shoulder pauldrons with blue caps, and heavy gauntlets.
  polygon(
    c,
    [
      [-32, -96],
      [-13, -90],
      [-17, -74],
      [-36, -78],
      [-40, -89],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-31, -92],
      [-17, -87],
      [-20, -78],
      [-33, -81],
      [-36, -88],
    ],
    blue,
  );
  line(c, -32, -88, -22, -85, "#89a7ff", 3);
  line(c, -28, -77, -29, -58, edge, 15);
  line(c, -28, -75, -29, -59, white, 10);
  rect(c, -37, -61, 20, 18, edge);
  rect(c, -34, -58, 14, 10, blue);
  rect(c, -33, -47, 12, 8, "#697b91");
  polygon(
    c,
    [
      [12, -91],
      [32, -97],
      [36, -81],
      [20, -73],
      [10, -79],
    ],
    edge,
  );
  polygon(
    c,
    [
      [16, -88],
      [29, -92],
      [32, -83],
      [21, -77],
      [14, -80],
    ],
    blue,
  );
  line(c, 19, -84, 29, -87, "#89a7ff", 3);
  // The elbow bends while the gauntlet and blade travel as one connected grip.
  const pose = meleeWeaponPose("gundam", unit.attack);
  drawSwingArm(c, [26, -77], [pose.x, pose.y], 17, 18, edge, white, 16, -1);
  c.save();
  c.translate(pose.x, pose.y);
  c.rotate(pose.angle, 0, 0);
  const handX = 0;
  const handY = 0;
  const tipX = 54;
  const tipY = 2;
  if (unit.attack > 0) {
    line(c, 17, -38, 45, -12, "#2580e7", 3);
    line(c, 25, -30, 51, -6, "#36adfa", 2);
  }
  line(c, handX, handY, tipX, tipY, "#214c8e", 12);
  line(c, handX, handY, tipX, tipY, "#278cff", 8);
  line(c, handX, handY, tipX, tipY, "#68ddff", 5);
  line(c, handX, handY, tipX, tipY, "#e1fcff", 2);
  line(c, handX - 5, handY + 10, handX, handY, edge, 8);
  line(c, handX - 5, handY + 10, handX, handY, "#a5b9c8", 4);
  line(c, handX - 7, handY - 1, handX + 7, handY + 2, "#e5ab30", 4);
  rect(c, -8, -4, 15, 13, edge);
  rect(c, -5, -2, 9, 8, blue);
  c.restore();
  // White faceplate, cyan visor and gold V-fin crest.
  polygon(
    c,
    [
      [-14, -112],
      [-7, -121],
      [11, -121],
      [22, -111],
      [18, -91],
      [-9, -90],
      [-17, -102],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-10, -110],
      [-5, -117],
      [9, -117],
      [17, -109],
      [14, -96],
      [-6, -95],
      [-12, -103],
    ],
    white,
  );
  polygon(
    c,
    [
      [-11, -110],
      [16, -111],
      [14, -103],
      [-9, -102],
    ],
    "#122e52",
  );
  polygon(
    c,
    [
      [-8, -108],
      [13, -108],
      [11, -104],
      [-7, -104],
    ],
    "#63efff",
  );
  polygon(
    c,
    [
      [-1, -102],
      [6, -102],
      [9, -94],
      [1, -92],
      [-3, -96],
    ],
    "#a2afba",
  );
  line(c, 2, -99, 4, -95, edge, 1.5);
  polygon(
    c,
    [
      [-2, -115],
      [-24, -126],
      [-12, -109],
      [2, -110],
      [20, -123],
      [10, -108],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-1, -113],
      [-19, -122],
      [-10, -112],
      [2, -112],
      [15, -120],
      [8, -110],
    ],
    "#ffc34a",
  );
  rect(c, -2, -121, 9, 10, "#d99322");
}

function drawMig17(c: SkCanvas, unit: Unit, time: number) {
  const edge = "#253440";
  const metal = unit.hit > 0 ? "#fff5d6" : "#bacbd1";
  // Low flight keeps the jet visible alongside the ground army.
  c.save();
  c.translate(0, Math.sin(time * 3 + unit.id) * 1.5);
  oval(c, -40, -3, 85, 7, "#526347");
  // Tall swept tail and far wing sit behind the silver fuselage.
  polygon(
    c,
    [
      [-48, -106],
      [-55, -140],
      [-43, -141],
      [-17, -104],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-45, -108],
      [-50, -136],
      [-44, -136],
      [-23, -108],
    ],
    "#9badb8",
  );
  polygon(
    c,
    [
      [-6, -105],
      [-32, -133],
      [-19, -134],
      [24, -105],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-3, -105],
      [-25, -129],
      [-19, -130],
      [18, -105],
    ],
    "#d5e0e3",
  );
  // Orange exhaust flickers behind the jet engine.
  polygon(
    c,
    [
      [-46, -109],
      [-68 - Math.sin(time * 25) * 4, -101],
      [-46, -95],
    ],
    "#f89235",
  );
  polygon(
    c,
    [
      [-48, -105],
      [-61, -101],
      [-48, -98],
    ],
    "#fff0a1",
  );
  polygon(
    c,
    [
      [-52, -111],
      [-21, -118],
      [19, -117],
      [53, -111],
      [58, -106],
      [58, -94],
      [22, -88],
      [-26, -89],
      [-52, -94],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-48, -108],
      [-19, -114],
      [18, -113],
      [53, -108],
      [54, -97],
      [21, -92],
      [-24, -93],
      [-48, -97],
    ],
    metal,
  );
  polygon(
    c,
    [
      [-40, -106],
      [17, -110],
      [50, -106],
      [50, -102],
      [-40, -101],
    ],
    "#e4edf0",
  );
  line(c, -31, -94, 36, -96, "#7e929f", 2);
  // Rounded cockpit above the blunt circular intake, no pointed nose cone.
  polygon(
    c,
    [
      [-2, -115],
      [4, -127],
      [17, -129],
      [30, -123],
      [36, -113],
    ],
    edge,
  );
  polygon(
    c,
    [
      [2, -116],
      [7, -123],
      [17, -125],
      [27, -121],
      [30, -115],
    ],
    "#69c6dd",
  );
  line(c, 16, -124, 19, -115, "#d6f3f5", 2);
  oval(c, 47, -112, 14, 24, edge);
  oval(c, 50, -109, 8, 18, "#637985");
  oval(c, 52, -106, 5, 12, "#172a35");
  line(c, 55, -107, 55, -95, "#c9d8dd", 1.5);
  // Near swept wing has a broad leading edge and red identification stripe.
  polygon(
    c,
    [
      [14, -105],
      [-17, -73],
      [-38, -71],
      [-16, -107],
    ],
    edge,
  );
  polygon(
    c,
    [
      [7, -102],
      [-20, -77],
      [-31, -76],
      [-13, -103],
    ],
    "#8fa7b4",
  );
  polygon(
    c,
    [
      [-9, -89],
      [-14, -83],
      [-29, -81],
      [-25, -87],
    ],
    "#c54443",
  );
  polygon(
    c,
    [
      [-39, -100],
      [-57, -84],
      [-43, -84],
      [-23, -98],
    ],
    edge,
  );
  polygon(
    c,
    [
      [-39, -97],
      [-49, -88],
      [-43, -88],
      [-29, -97],
    ],
    "#a2b6c1",
  );
  line(c, -25, -109, -10, -109, "#d74d45", 3);
  // Missile pylon and a white underwing missile; ignition follows the attack.
  line(c, 8, -96, 8, MIG.missileY, edge, 4);
  if (unit.attack <= 0) {
    polygon(
      c,
      [
        [-9, -91],
        [16, -91],
        [MIG.missileX, -87],
        [16, -83],
        [-9, -83],
      ],
      edge,
    );
    polygon(
      c,
      [
        [-7, -89],
        [15, -89],
        [20, -87],
        [15, -85],
        [-7, -85],
      ],
      "#eef0df",
    );
    polygon(
      c,
      [
        [-6, -87],
        [-13, -94],
        [-14, -86],
        [-13, -80],
      ],
      "#d55245",
    );
  } else {
    polygon(
      c,
      [
        [4, -91],
        [-12, -87],
        [4, -83],
      ],
      "#ff9a3b",
    );
    circle(c, 3, -87, 3, "#fff2a6");
  }
  c.restore();
}

// Original anime swordsman. Body front is 31; the extended blade tip is 104
// model units, shared with geometry.ts before the battlefield scale is applied.
function drawStormblade(c: SkCanvas, unit: Unit, skin: string, time: number) {
  const outline = "#202735";
  const gold = unit.hit > 0 ? "#fff5d6" : "#f8c744";
  const stride = unit.attack > 0 ? 0 : Math.sin(time * 9 + unit.id) * 4;
  const scarf = Math.sin(time * 7 + unit.id) * 4;
  polygon(
    c,
    [
      [-10, -65],
      [-45, -69 + scarf],
      [-32, -58 + scarf],
      [-47, -52 + scarf],
      [-9, -54],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-10, -62],
      [-39, -65 + scarf],
      [-27, -58 + scarf],
      [-38, -55 + scarf],
      [-8, -57],
    ],
    "#ec5260",
  );
  line(c, -9, -29, -15 - stride, -7, outline, 15);
  line(c, 9, -29, 16 + stride, -7, outline, 15);
  line(c, -9, -29, -15 - stride, -9, "#353e59", 10);
  line(c, 9, -29, 16 + stride, -9, "#353e59", 10);
  rect(c, -24 - stride, -9, 19, 9, outline);
  rect(c, 7 + stride, -9, 21, 9, outline);
  rect(c, -22 - stride, -3, 17, 3, "#8796ad");
  rect(c, 9 + stride, -3, 17, 3, "#8796ad");
  polygon(
    c,
    [
      [-17, -64],
      [14, -64],
      [23, -32],
      [-19, -29],
    ],
    outline,
  );
  polygon(
    c,
    [
      [-12, -60],
      [10, -60],
      [17, -35],
      [-14, -34],
    ],
    "#34374f",
  );
  polygon(
    c,
    [
      [-17, -64],
      [-3, -65],
      [-6, -48],
      [-21, -47],
    ],
    "#7889a5",
  );
  line(c, -12, -59, 14, -36, "#a77d48", 5);
  rect(c, -19, -35, 40, 6, "#262c3a");
  rect(c, 0, -35, 8, 6, "#efc55e");
  const pose = meleeWeaponPose("stormblade", unit.attack);
  drawSwingArm(
    c,
    [-12, -51],
    swingPoint(pose, [-11, 0]),
    16,
    18,
    outline,
    skin,
    12,
  );
  drawSwingArm(
    c,
    [13, -55],
    swingPoint(pose, [-4, 0]),
    12,
    14,
    outline,
    skin,
    13,
  );
  c.save();
  c.translate(pose.x, pose.y);
  c.rotate(pose.angle, 0, 0);
  if (unit.attack <= 0.17 && unit.attack >= 0.09) {
    polygon(
      c,
      [
        [3, -55],
        [49, -47],
        [78, -15],
        [78, 5],
        [48, -23],
      ],
      "#bceff3",
    );
    line(c, 31, -36, 69, -10, "#f3ffff", 3);
  }
  line(c, -12, 0, 12, 0, outline, 9);
  line(c, -11, 0, 10, 0, "#8d5360", 5);
  line(c, 9, -15, 9, 15, outline, 7);
  line(c, 9, -13, 9, 13, "#edbd5d", 4);
  polygon(
    c,
    [
      [13, -13],
      [64, -13],
      [78, 0],
      [64, 13],
      [13, 13],
    ],
    outline,
  );
  polygon(
    c,
    [
      [16, -10],
      [63, -10],
      [75, 0],
      [63, 10],
      [16, 10],
    ],
    "#a9bdcf",
  );
  polygon(
    c,
    [
      [16, -10],
      [63, -10],
      [75, 0],
      [19, -2],
    ],
    "#eef9fc",
  );
  polygon(
    c,
    [
      [19, 2],
      [70, 2],
      [62, 8],
      [19, 8],
    ],
    "#6e859f",
  );
  circle(c, 24, 0, 3, "#3b647b");
  circle(c, 37, 0, 3, "#3b647b");
  outlinedOval(c, -9, -5, 10, 10, skin);
  outlinedOval(c, -15, -4, 8, 8, skin);
  c.restore();
  // The head occludes the far-side weapon and arms, keeping the face clear.
  outlinedOval(c, -15, -92, 34, 34, skin);
  // Large, jagged silhouette and warm inner spikes read clearly on a phone.
  const hair = [
    [-23, -74],
    [-38, -87],
    [-26, -89],
    [-43, -103],
    [-22, -100],
    [-29, -119],
    [-10, -108],
    [-3, -125],
    [7, -108],
    [23, -120],
    [20, -102],
    [31, -102],
    [22, -89],
    [26, -82],
    [10, -85],
    [5, -97],
    [-4, -86],
    [-9, -94],
    [-14, -77],
  ];
  polygon(c, hair, outline);
  polygon(
    c,
    [
      [-21, -79],
      [-31, -86],
      [-20, -91],
      [-33, -100],
      [-17, -97],
      [-22, -110],
      [-8, -103],
      [-3, -115],
      [5, -102],
      [18, -112],
      [15, -98],
      [24, -98],
      [17, -89],
      [10, -90],
      [5, -101],
      [-4, -91],
      [-8, -100],
      [-15, -85],
    ],
    gold,
  );
  polygon(
    c,
    [
      [-20, -93],
      [-14, -94],
      [-15, -103],
      [-5, -99],
      [-3, -108],
      [1, -97],
      [-7, -90],
    ],
    "#ffe98c",
  );
  line(c, 3, -80, 13, -82, outline, 2.5);
  line(c, 6, -77, 12, -77, "#fcfcf1", 3);
  circle(c, 11, -77, 1.7, "#248a9b");
  line(c, 12, -68, 17, -69, outline, 1.7);
  line(c, -8, -61, 15, -61, "#ec5260", 7);
}

function drawRaccoon(c: SkCanvas, u: Unit, time: number) {
  const edge = "#241d32",
    fur = u.hit > 0 ? "#fff2d5" : "#9560bf";
  const pale = u.hit > 0 ? "#fff8e9" : "#c9a3e8",
    dark = u.hit > 0 ? "#e6d7c4" : "#50306d";
  const age = Math.max(0, 0.12 - u.attack);
  const riflePose = raccoonRiflePose(u.attack);
  function path(svg: string, color: string, width = 2) {
    const p = Skia.Path.MakeFromSVGString(svg)!;
    c.drawPath(p, ink(color));
    ink(edge);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(width);
    c.drawPath(p, paint);
    return p;
  }
  function outline(p: ReturnType<typeof Skia.Path.Make>, width = 2) {
    ink(edge);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(width);
    c.drawPath(p, paint);
  }
  oval(c, -26, -2, 53, 8, "#241d3244");
  c.save();
  c.translate(0, RACCOON.hoverY + raccoonHover(time, u.id));
  // A broad, curled tail with clearly alternating dark and lavender rings.
  const tail = path(
    "M-11 -28 C-26 -31 -30 -12 -43 -14 C-53 -15 -60 -27 -53 -34 C-47 -40 -43 -30 -37 -29 C-29 -33 -25 -43 -13 -42 Z",
    pale,
    2.5,
  );
  c.save();
  c.clipPath(tail, 1, true);
  polygon(
    c,
    [
      [-59, -40],
      [-49, -40],
      [-43, -12],
      [-51, -9],
    ],
    dark,
  );
  polygon(
    c,
    [
      [-42, -40],
      [-34, -40],
      [-27, -10],
      [-36, -9],
    ],
    dark,
  );
  polygon(
    c,
    [
      [-24, -48],
      [-16, -47],
      [-12, -21],
      [-20, -19],
    ],
    dark,
  );
  c.restore();
  outline(tail, 2.5);
  // Compact twin thrusters sit close to the back rather than dwarfing the body.
  path("M-27 -51 L-16 -54 L-13 -34 L-24 -30 Z", "#687788");
  polygon(
    c,
    [
      [-24, -49],
      [-18, -51],
      [-16, -36],
      [-23, -34],
    ],
    "#a6b6c7",
  );
  rect(c, -26, -42, 8, 3, "#394755");
  rect(c, -25, -37, 8, 2, "#394755");
  path("M-29 -44 L-24 -45 L-22 -30 L-28 -29 Z", "#889bad", 1.5);
  const flame = 8 + (Math.sin(time * 31 + u.id) + 1) * 3;
  polygon(
    c,
    [
      [-27, -30],
      [-21, -31],
      [-23, -27 + flame],
    ],
    "#54bdfa",
  );
  polygon(
    c,
    [
      [-25, -30],
      [-22, -30],
      [-23, -29 + flame * 0.75],
    ],
    "#e5fcff",
  );
  polygon(
    c,
    [
      [-20, -32],
      [-14, -33],
      [-16, -29 + flame],
    ],
    "#54bdfa",
  );
  polygon(
    c,
    [
      [-18, -32],
      [-15, -32],
      [-16, -31 + flame * 0.7],
    ],
    "#e5fcff",
  );
  // Larger striped haunches and belly give the animal a sturdier silhouette.
  line(c, -8, -24, -15, -8, edge, 15);
  line(c, -15, -8, -3, -1, edge, 13);
  line(c, -8, -24, -15, -8, pale, 10);
  line(c, -14, -8, -3, -1, fur, 8);
  line(c, -12, -18, -8, -15, dark, 5);
  line(c, 12, -24, 17, -11, edge, 15);
  line(c, 17, -11, 28, -6, edge, 13);
  line(c, 12, -24, 17, -11, pale, 10);
  line(c, 17, -11, 28, -6, fur, 8);
  line(c, 12, -18, 18, -20, dark, 5);
  // The support arm belongs behind the torso, not over the neck and chest.
  const support = riflePose.support;
  line(c, ...support.shoulder, ...support.elbow, edge, 9);
  line(c, ...support.elbow, ...support.hand, edge, 8);
  line(c, ...support.shoulder, ...support.elbow, dark, 5.5);
  line(c, ...support.elbow, ...support.hand, fur, 5);
  const torso = Skia.Path.Make();
  torso.addOval(Skia.XYWHRect(-22, -58, 49, 48));
  c.drawPath(torso, ink(fur));
  c.save();
  c.clipPath(torso, 1, true);
  oval(c, -10, -51, 33, 39, pale);
  path("M-26 -48 Q1 -38 30 -46 L31 -39 Q1 -31 -27 -40 Z", dark, 0);
  path("M-27 -29 Q0 -22 30 -29 L31 -22 Q0 -14 -27 -22 Z", dark, 0);
  c.restore();
  outline(torso, 2.5);
  line(c, -15, -53, 9, -16, "#474554", 4);
  rect(c, -13, -20, 34, 5, "#393747");
  rect(c, 0, -20, 7, 5, "#b4adc6");
  // Small ears, cheek tufts, pale brows and a dark raccoon mask.
  circle(c, -13, -80, 8, edge);
  circle(c, -13, -80, 5, pale);
  circle(c, 22, -80, 8, edge);
  circle(c, 22, -80, 5, pale);
  path(
    "M-18 -68 Q-20 -81 -7 -83 Q12 -88 26 -77 L30 -64 L35 -57 L27 -55 L29 -49 Q6 -39 -14 -49 L-23 -56 L-17 -58 Z",
    fur,
    2.5,
  );
  path("M-17 -67 Q4 -73 27 -66 L29 -57 Q4 -50 -16 -59 Z", dark, 1.5);
  path("M-15 -73 Q-7 -78 0 -74 L-2 -70 Q-9 -72 -15 -69 Z", pale, 0);
  path("M12 -73 Q21 -75 26 -70 L26 -67 Q20 -70 13 -68 Z", pale, 0);
  path("M-7 -52 Q4 -57 18 -53 L22 -43 Q3 -39 -10 -47 Z", pale, 1.5);
  path("M17 -58 Q29 -60 38 -53 Q41 -46 31 -43 L19 -46 Z", "#ddc0f0", 1.8);
  oval(c, 33, -55, 8, 6, edge);
  oval(c, -1, -66, 7, 8, "#fff9e8");
  oval(c, 19, -65, 6, 7, "#fff9e8");
  circle(c, 4, -62, 2.2, edge);
  circle(c, 23, -61, 2, edge);
  circle(c, 4.5, -63, 0.8, "#ffffff");
  line(c, 25, -45, 33, -47, edge, 1.3);
  c.save();
  c.translate(riflePose.weaponX, riflePose.weaponY);
  // AR-style collapsible stock, buffer tube, upper/lower receiver and pistol grip.
  path("M-9 -47 L3 -47 L10 -44 L10 -37 L-6 -34 L-10 -37 Z", "#404552", 1.8);
  line(c, -8, -46, -8, -35, "#1a2029", 3);
  rect(c, 0, -44, 16, 5, "#9ca6ae");
  path("M12 -47 L34 -47 L40 -43 L39 -34 L13 -34 L10 -38 Z", "#59606b", 1.8);
  rect(c, 14, -45, 21, 3, "#8d96a1");
  rect(c, 24, -41, 10, 3, "#252d37");
  circle(c, 17, -37, 1.2, "#c5ccd1");
  path("M19 -34 L26 -34 L23 -21 L17 -23 Z", "#333b46", 1.5);
  path("M25 -34 L33 -34 L32 -27 Q28 -24 24 -28 Z", "#222a34", 1.5);
  path("M26 -32 L31 -32 L30 -28 L26 -28 Z", pale, 0);
  // Slightly curved box magazine with stamped ribs.
  path("M33 -34 L43 -34 L46 -22 L44 -13 L34 -14 L31 -25 Z", "#4c5663", 1.8);
  line(c, 35, -30, 39, -17, "#8d98a2", 1.3);
  line(c, 39, -30, 42, -18, "#7b8793", 1.3);
  path("M39 -46 L65 -46 L68 -42 L65 -35 L39 -35 Z", "#454e5b", 1.8);
  line(c, 41, -44, 64, -44, "#929da7", 1.2);
  for (const x of [42, 48, 54, 60]) rect(c, x, -41, 3.5, 2.5, "#1e2731");
  rect(c, 13, -49, 52, 2, "#222a35");
  for (const x of [15, 22, 29, 36, 43, 50, 57, 63])
    rect(c, x, -50, 3, 2, "#7d8792");
  // Iron sights, exposed barrel and a slotted flash suppressor finish the profile.
  path("M17 -49 L18 -55 L22 -55 L23 -49 Z", "#303845", 1);
  path("M66 -43 L69 -50 L72 -50 L73 -41 Z", "#303845", 1);
  rect(c, 66, -42, 13, 4, "#222b36");
  rect(c, 78, -44, 5, 8, "#4e5965");
  rect(c, 79, -43, 1, 6, "#151d26");
  rect(c, 82, -43, 1, 6, "#151d26");
  // The supporting paw wraps the underside of the handguard.
  circle(c, 47, -36, 4.5, edge);
  circle(c, 47, -36, 3, pale);
  if (u.attack > 0.065) {
    polygon(
      c,
      [
        [83, -43],
        [94, -47],
        [91, -41],
        [99, -40],
        [91, -37],
        [94, -32],
        [83, -37],
      ],
      "#ffb541",
    );
    polygon(
      c,
      [
        [83, -42],
        [93, -40],
        [83, -38],
      ],
      "#fff6ca",
    );
  }
  if (u.attack > 0.02) {
    const t = age / 0.12;
    rect(c, 24 - t * 10, -49 - Math.sin(t * Math.PI) * 9, 3, 1.7, "#e4bc62");
  }
  c.restore();
  const trigger = riflePose.trigger;
  line(c, ...trigger.shoulder, ...trigger.elbow, edge, 10);
  line(c, ...trigger.elbow, ...trigger.hand, edge, 9);
  circle(c, ...trigger.elbow, 5, edge);
  line(c, ...trigger.shoulder, ...trigger.elbow, fur, 6);
  line(c, ...trigger.elbow, ...trigger.hand, pale, 5);
  circle(c, ...trigger.elbow, 3, fur);
  circle(c, ...trigger.hand, 4, edge);
  circle(c, ...trigger.hand, 2.8, pale);
  c.restore();
}

export function soldier(
  c: SkCanvas,
  unit: Unit,
  time: number,
  ground: number,
  size = 1,
) {
  const dir = unit.side === "player" ? 1 : -1;
  const boss = isBossKind(unit.kind);
  const modelSize = size * (boss ? BOSS.scale : 1);
  const y = ground + unit.lane * 15;
  const dead = unit.hp <= 0;
  const bob =
    unit.kind === "raccoon"
      ? 0
      : unit.kind === "cannon"
        ? 0
        : unit.kind === "pyramid"
          ? Math.sin(time * 2 + unit.id) * 5
          : unit.attack > 0
            ? 0
            : Math.sin(time * 10 + unit.id) * 1.2;
  const skin = unit.hit > 0 ? "#fff5d6" : "#ffdbad";
  const body =
    unit.hit > 0 ? "#fff5d6" : unit.side === "player" ? "#53c4b1" : "#f48672";
  const swing = unit.attack > 0 ? Math.sin((unit.attack / 0.25) * Math.PI) : 0;
  c.save();
  c.translate(unit.x, y + bob);
  c.scale(dir * modelSize, modelSize);
  if (dead) {
    c.rotate(80 * Math.min(1, unit.dead / 0.3), 0, 0);
    const shrink = Math.max(0, 1 - unit.dead * 0.7);
    c.scale(shrink, shrink);
  }
  const motion = attackMotion(unit);
  c.translate(motion.x, motion.y);
  c.rotate(motion.angle, 0, 0);
  drawAttackBacklight(c, unit, time);
  if (unit.kind === "stormblade") drawStormblade(c, unit, skin, time);
  else if (unit.kind === "raccoon") drawRaccoon(c, unit, time);
  else if (unit.kind === "darkMage") drawDarkMage(c, unit, time, swing);
  else if (unit.kind === "skeletonKing") drawSkeletonKing(c, unit, time);
  else if (unit.kind === "gundam") drawGundam(c, unit, time);
  else if (unit.kind === "mig17") drawMig17(c, unit, time);
  else if (unit.kind === "duck") drawDuck(c, unit, time, swing);
  else if (unit.kind === "spaceMarine") drawSpaceMarine(c, unit, time);
  else if (unit.kind === "barbarian") drawBarbarian(c, unit, skin, time);
  else if (unit.kind === "rapper") drawRapper(c, unit, skin, swing);
  else if (unit.kind === "mafia") drawMafia(c, unit, skin);
  else if (unit.kind === "cyborgWalrus") drawCyborgWalrus(c, unit, time, swing);
  else if (unit.kind === "tiger") drawTiger(c, unit, time);
  else if (unit.kind === "shark") drawShark(c, unit, time, swing);
  else if (unit.kind === "cannon") drawCannon(c, unit);
  else if (unit.kind === "basketballPlayer")
    drawBasketballPlayer(c, unit, skin);
  else if (unit.kind === "machineGunner")
    drawMachineGunner(c, unit, skin, time);
  else if (unit.kind === "pyramid") drawPyramid(c, unit, time);
  else if (unit.kind === "scientist") drawScientist(c, unit, time, swing);
  else if (unit.kind === "titan") drawRobotBoss(c, unit, time, swing);
  else if (unit.kind === "ironback") drawGorilla(c, unit, time, swing);
  else if (boss) drawDinosaur(c, unit, time, swing);
  else if (isEnemyKind(unit.kind)) drawSlime(c, unit, time, swing);
  else if (unit.kind === "mech") drawMech(c, unit, time);
  else {
    drawCharacterBase(c, skin, body);
    drawStoneEquipment(c, unit.kind, swing);
  }
  drawAttackAura(c, unit, time);
  c.restore();
  if (!dead && (boss || unit.hp < unit.maxHp)) {
    const healthY =
      y +
      bob -
      (unit.kind === "stormblade"
        ? 144
        : unit.kind === "raccoon"
          ? 113
          : unit.kind === "darkMage"
            ? 155 * MAGE.heightScale
            : unit.kind === "skeletonKing"
              ? 121
              : unit.kind === "gundam"
                ? 132
                : unit.kind === "mig17"
                  ? 149
                  : unit.kind === "titan" ||
                      unit.kind === "scientist" ||
                      unit.kind === "pyramid"
                    ? 76
                    : boss
                      ? 73
                      : isEnemyKind(unit.kind)
                        ? 92
                        : unit.kind === "cyborgWalrus"
                          ? 84
                          : unit.kind === "spaceMarine"
                            ? 90
                            : unit.kind === "barbarian"
                              ? 122
                              : unit.kind === "mafia"
                                ? 84
                                : unit.kind === "machineGunner"
                                  ? 78
                                  : unit.kind === "mech"
                                    ? 85
                                    : 70) *
        modelSize;
    const barWidth = boss ? 120 : 32;
    rect(c, unit.x - barWidth / 2, healthY, barWidth, boss ? 8 : 5, OUTLINE);
    rect(
      c,
      unit.x - barWidth / 2 + 1,
      healthY + 1,
      ((barWidth - 2) * unit.hp) / unit.maxHp,
      boss ? 6 : 3,
      boss ? "#f28262" : "#ffe38a",
    );
  }
}
export function drawWorld(world: World, width: number, height: number) {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
  // Uniform scaling keeps round heads round in every viewport.
  const scale = Math.max(width, 1) / BATTLE.width;
  const h = Math.max(height, 1) / scale;
  const ground = h * 0.52;
  c.scale(scale, scale);
  drawBackground(c, world.battleNumber, h, ground);
  const shake = attackCameraOffset(world);
  c.translate(shake.x, shake.y);
  const edge = [
    [0, ground - 92],
    [140, ground - 96],
    [310, ground - 88],
    [510, ground - 95],
    [750, ground - 89],
    [1000, ground - 96],
    [1000, ground + 98],
    [780, ground + 93],
    [570, ground + 101],
    [350, ground + 92],
    [150, ground + 97],
    [0, ground + 91],
  ];
  polygon(c, edge, "#3e4631");
  polygon(
    c,
    edge.map(([x, y]) => [x, y + (y < ground ? 4 : -4)]),
    "#b18a59",
  );
  for (let i = 0; i < 16; i++) {
    oval(
      c,
      120 + ((i * 109) % 760),
      ground - 42 + ((i * 23) % 90),
      5,
      3,
      "#a58052",
    );
  }
  base(c, 20, ground - 7, false);
  [...world.units]
    .sort((a, b) => a.lane - b.lane)
    .forEach((u) => soldier(c, u, world.time, ground, BATTLE_UNIT_SCALE));
  for (const p of world.projectiles) {
    const t = p.age / p.duration;
    let y =
      ground -
      28 * BATTLE_UNIT_SCALE +
      p.lane * 15 -
      Math.sin(t * Math.PI) * 62;
    if (p.kind === "fireball") {
      const startX =
        p.startX + (p.launchOffsetX ?? 0) * (BATTLE_UNIT_SCALE - 1);
      const startY =
        ground +
        (p.launchOffsetY ?? MAGE.staffY) * BATTLE_UNIT_SCALE +
        (p.launchLane ?? p.lane) * 15;
      const endY = ground - 28 * BATTLE_UNIT_SCALE + p.lane * 15;
      const fireX = startX + (p.targetX - startX) * t;
      const fireY = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 10;
      drawProjectileTrail(
        c,
        fireX,
        fireY,
        Math.sign(p.targetX - startX) * 7,
        ((endY - startY) / Math.max(1, Math.abs(p.targetX - startX))) * 7,
        "#ff963f",
        18,
      );
      c.save();
      c.translate(fireX, fireY);
      c.rotate(
        (Math.atan2(
          endY - startY - Math.cos(t * Math.PI) * 10 * Math.PI,
          p.targetX - startX,
        ) *
          180) /
          Math.PI,
        0,
        0,
      );
      drawFireball(c, world.time, BATTLE_UNIT_SCALE * 1.7);
      c.restore();
      continue;
    }
    if (p.kind === "note") {
      const startX =
        p.startX + (p.launchOffsetX ?? 0) * (BATTLE_UNIT_SCALE - 1);
      const startY =
        ground +
        RAPPER.micY * BATTLE_UNIT_SCALE +
        (p.launchLane ?? p.lane) * 15;
      const endY = ground - 28 * BATTLE_UNIT_SCALE + p.lane * 15;
      const noteX = startX + (p.targetX - startX) * t;
      const noteY = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 15;
      drawProjectileTrail(
        c,
        noteX,
        noteY,
        Math.sign(p.targetX - startX) * 6,
        0,
        "#e69dff",
        4,
      );
      c.save();
      c.translate(noteX, noteY);
      c.rotate(Math.sin(t * Math.PI * 2) * 12, 0, 0);
      drawMusicNote(c, 0, 0, 0.72 * BATTLE_UNIT_SCALE);
      c.restore();
      continue;
    }
    if (p.kind === "laser") {
      const startY =
        ground +
        (p.launchOffsetY ?? TIGER.eyes[0].y) * BATTLE_UNIT_SCALE +
        (p.launchLane ?? p.lane) * 15;
      const startX =
        p.startX + (p.launchOffsetX ?? 0) * (BATTLE_UNIT_SCALE - 1);
      const endY = ground - 28 * BATTLE_UNIT_SCALE + p.lane * 15;
      const tipX = startX + (p.targetX - startX) * t;
      const tipY = startY + (endY - startY) * t;
      // Two straight red rays grow from the actual eyes to the target.
      line(c, startX, startY, tipX, tipY, "#ff263c44", 18);
      line(c, startX, startY, tipX, tipY, "#86233c", 11);
      line(c, startX, startY, tipX, tipY, "#ff263c", 7);
      line(c, startX, startY, tipX, tipY, "#ffd4ce", 2.5);
      circle(c, tipX, tipY, 3, "#ff5a5f");
      continue;
    }
    if (p.kind === "cannonball") {
      const startY =
        ground +
        CANNON.muzzleY * BATTLE_UNIT_SCALE +
        (p.launchLane ?? p.lane) * 15;
      const endY = ground - 28 * BATTLE_UNIT_SCALE + p.lane * 15;
      const ballY = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 18;
      const ballX =
        p.x + (p.launchOffsetX ?? 0) * (BATTLE_UNIT_SCALE - 1) * (1 - t);
      drawProjectileTrail(
        c,
        ballX,
        ballY,
        Math.sign(p.targetX - p.startX) * 6,
        0,
        "#e7cda0",
        4,
      );
      circle(c, ballX, ballY, 7 * BATTLE_UNIT_SCALE, CHARACTER_INK);
      circle(c, ballX, ballY, 5 * BATTLE_UNIT_SCALE, "#44535d");
      circle(
        c,
        ballX - 2 * BATTLE_UNIT_SCALE,
        ballY - 2 * BATTLE_UNIT_SCALE,
        1.8 * BATTLE_UNIT_SCALE,
        "#9aa9af",
      );
      continue;
    }
    if (p.kind === "basketball") {
      const startY =
        ground - 73 * BATTLE_UNIT_SCALE + (p.launchLane ?? p.lane) * 15;
      const endY = ground - 28 * BATTLE_UNIT_SCALE + p.lane * 15;
      const ballY = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 85;
      const travel = Math.max(1, Math.abs(p.targetX - p.startX));
      drawProjectileTrail(
        c,
        p.x,
        ballY,
        Math.sign(p.targetX - p.startX) * 7,
        ((endY - startY - Math.cos(t * Math.PI) * 85 * Math.PI) / travel) * 7,
        "#ffba58",
        12,
      );
      drawBasketball(
        c,
        p.x,
        ballY,
        8 * BATTLE_UNIT_SCALE,
        p.age * (p.side === "player" ? 360 : -360),
      );
      continue;
    }
    if (p.kind === "bullet") {
      const dir = p.side === "player" ? 1 : -1;
      const startY =
        ground +
        (p.launchOffsetY ?? -26) * BATTLE_UNIT_SCALE +
        (p.launchLane ?? p.lane) * 15;
      const endY = ground - 26 * BATTLE_UNIT_SCALE + p.lane * 15;
      const bulletY = startY + (endY - startY) * t;
      const bulletX =
        p.x +
        (p.launchOffsetY !== undefined
          ? (p.launchOffsetX ?? 0) * (BATTLE_UNIT_SCALE - 1) * (1 - t)
          : 0);
      line(
        c,
        bulletX - dir * 12,
        bulletY,
        bulletX + dir * 3,
        bulletY,
        "#625434",
        4,
      );
      line(
        c,
        bulletX - dir * 11,
        bulletY,
        bulletX + dir * 3,
        bulletY,
        "#f7de83",
        2,
      );
      circle(c, bulletX + dir * 3, bulletY, 1.5, "#fff4ba");
      continue;
    }
    if (p.kind === "potion") {
      const startY =
        ground -
        42 * BOSS.scale * BATTLE_UNIT_SCALE +
        (p.launchLane ?? p.lane) * 15;
      const endY = ground - 28 * BATTLE_UNIT_SCALE + p.lane * 15;
      y = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 62;
    }
    if (p.kind === "slime" || p.kind === "potion") {
      const charged = p.kind === "slime" && p.empowered;
      const glob = charged ? "#ff8c40" : "#92d83a";
      c.save();
      c.translate(p.x, y);
      c.scale(
        BATTLE_UNIT_SCALE * (p.side === "player" ? 1 : -1),
        BATTLE_UNIT_SCALE,
      );
      // A wet, lumpy glob trails droplets behind its direction of travel.
      oval(c, -10, -8, 22, 17, charged ? "#6c3025" : "#18351e");
      oval(c, -8, -6, 18, 13, glob);
      circle(c, 5, 4, 5, glob);
      oval(c, -3, -5, 7, 4, charged ? "#fff0ae" : "#d9ff87");
      circle(c, -17, 1, 3, charged ? "#ed6638" : "#75bb27");
      circle(c, -24, -3, 2, glob);
      if (p.kind === "potion") {
        circle(c, 2, -1, 2, "#dcffab");
        circle(c, -4, 2, 1.4, "#dcffab");
      }
      c.restore();
    } else if (p.kind === "missile") {
      const dir = p.side === "player" ? 1 : -1;
      const pod = MECH_PODS[(p.launchOffsetX ?? 0) * dir < 0 ? 0 : 1];
      const startY =
        ground +
        (p.launchOffsetY ?? (pod.y + 13) * MECH_ART_SCALE) * BATTLE_UNIT_SCALE +
        (p.launchLane ?? p.lane) * 15;
      const endY = ground - 28 * BATTLE_UNIT_SCALE + p.lane * 15;
      const arc = p.launchOffsetY === undefined ? 65 : 12;
      const missileY =
        startY + (endY - startY) * t - Math.sin(t * Math.PI) * arc;
      c.save();
      // Extend the pod offset visually, preserving projectile timing and range.
      c.translate(
        p.x +
          ((p.launchOffsetY === undefined
            ? (pod.x + 8.5) * MECH_ART_SCALE * dir
            : (p.launchOffsetX ?? 0)) *
            BATTLE_UNIT_SCALE -
            (p.launchOffsetX ?? 0)) *
            (1 - t),
        missileY,
      );
      c.rotate(
        (Math.atan2(
          endY - startY - Math.cos(t * Math.PI) * arc * Math.PI,
          p.targetX - p.startX,
        ) *
          180) /
          Math.PI,
        0,
        0,
      );
      c.scale(BATTLE_UNIT_SCALE, BATTLE_UNIT_SCALE);
      drawProjectileTrail(c, -22, 0, 8, 0, "#d9e2e8", 11);
      polygon(
        c,
        [
          [-16, -3],
          [-48 - Math.sin(world.time * 45) * 6, 0],
          [-16, 3],
        ],
        "#f8a13d",
      );
      polygon(
        c,
        [
          [-13, -5],
          [7, -5],
          [15, 0],
          [7, 5],
          [-13, 5],
        ],
        CHARACTER_INK,
      );
      rect(c, -10, -3, 16, 6, "#dce2de");
      polygon(
        c,
        [
          [6, -3],
          [11, 0],
          [6, 3],
        ],
        "#ec8067",
      );
      c.restore();
    } else if (p.kind === "axe") {
      c.save();
      c.translate(p.x, y);
      c.scale(
        (p.side === "player" ? 0.45 : -0.45) * BATTLE_UNIT_SCALE,
        0.45 * BATTLE_UNIT_SCALE,
      );
      c.rotate(p.age * 900, 0, 0);
      c.translate(-10, 25);
      drawAxe(c);
      c.restore();
    } else if (p.kind === "spear") {
      c.save();
      c.translate(p.x, y);
      c.scale(
        (p.side === "player" ? 1 : -1) * BATTLE_UNIT_SCALE,
        BATTLE_UNIT_SCALE,
      );
      const tilt =
        (Math.atan2(
          -Math.cos(t * Math.PI) * 62 * Math.PI,
          Math.max(1, Math.abs(p.targetX - p.startX)),
        ) *
          180) /
        Math.PI;
      c.rotate(tilt, 0, 0);
      line(c, -19, 0, 15, 0, CHARACTER_INK, 4);
      line(c, -19, 0, 15, 0, "#b98b59", 2);
      polygon(
        c,
        [
          [12, -5],
          [25, 0],
          [12, 5],
        ],
        CHARACTER_INK,
      );
      polygon(
        c,
        [
          [15, -2],
          [21, 0],
          [15, 2],
        ],
        "#e0e7e2",
      );
      c.restore();
    } else {
      drawProjectileTrail(
        c,
        p.x,
        y,
        Math.sign(p.targetX - p.startX) * 5,
        -Math.cos(t * Math.PI) * 3,
        "#d2c5a9",
        3,
      );
      outlinedOval(
        c,
        p.x - 5 * BATTLE_UNIT_SCALE,
        y - 5 * BATTLE_UNIT_SCALE,
        10 * BATTLE_UNIT_SCALE,
        10 * BATTLE_UNIT_SCALE,
        "#d0d8d5",
      );
    }
  }
  for (const beam of world.beams) {
    const source = world.units.find((u) => u.id === beam.source && u.hp > 0);
    if (!source) continue;
    const dir = source.side === "enemy" ? -1 : 1;
    const modelScale = BOSS.scale * BATTLE_UNIT_SCALE;
    const startX = source.x + PYRAMID.eyeX * modelScale * dir;
    const startY =
      ground +
      source.lane * 15 +
      Math.sin(world.time * 2 + source.id) * 5 +
      PYRAMID.eyeY * modelScale;
    const endY = ground - 28 * BATTLE_UNIT_SCALE + beam.lane * 15;
    const charge = Math.min(1, beam.age / PYRAMID.chargeTime);
    if (!beam.fired) {
      // A thin aiming ray and a pulsing eye telegraph the coming strike.
      line(c, startX, startY, beam.endX, endY, "#f3d27377", 1.5 + charge);
      circle(c, startX, startY, 12 + charge * 12, "#fff0aa44");
      circle(c, startX, startY, 4 + charge * 5, "#fff7cf");
    } else {
      const pulse = Math.sin(world.time * 75) * 2;
      polygon(
        c,
        [
          [startX, startY - 8],
          [beam.endX, endY - 17],
          [beam.endX, endY + 17],
          [startX, startY + 8],
        ],
        "#ffc74455",
      );
      line(c, startX, startY, beam.endX, endY, "#ffc94f88", 24 + pulse);
      line(c, startX, startY, beam.endX, endY, "#ffe58a", 10 + pulse);
      line(c, startX, startY, beam.endX, endY, "#ffffef", 4);
      circle(c, startX, startY, 14, "#fff7cf");
      circle(c, beam.endX, endY, 14 + pulse, "#fff3a377");
    }
  }
  drawAttackImpacts(c, world, ground);
  for (const e of world.effects) {
    const r = 5 + e.age * 22;
    for (let k = 0; k < 5; k++) {
      const a = k * Math.PI * 0.4;
      circle(
        c,
        e.x + Math.cos(a) * r,
        ground - 25 * BATTLE_UNIT_SCALE + e.lane * 15 + Math.sin(a) * r,
        Math.max(0.2, 3 - e.age * 5),
        e.potion ? "#9aec49" : "#fff3cb",
      );
    }
  }
  return recorder.finishRecordingAsPicture();
}
