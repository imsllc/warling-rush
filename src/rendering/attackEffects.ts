import { Skia, PaintStyle, type SkCanvas } from "@shopify/react-native-skia";
import type { Unit, World, Effect } from "../game/types";
import {
  COMBAT_UNITS,
  isEnemyKind,
  MAGE,
  TIGER,
  GUNNER,
  TOMMY,
  MARINE,
} from "../game/config";
import { meleeWeaponPose } from "./meleePose";
import { BATTLE_UNIT_SCALE } from "../game/geometry";
const paint = Skia.Paint();
paint.setAntiAlias(true);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
function ink(color: string, alpha = 1) {
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(clamp(alpha));
  paint.setStyle(PaintStyle.Fill);
  return paint;
}
function dot(
  c: SkCanvas,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1,
) {
  if (r > 0 && alpha > 0.005) c.drawCircle(x, y, r, ink(color, alpha));
}
function line(
  c: SkCanvas,
  x: number,
  y: number,
  xx: number,
  yy: number,
  color: string,
  width = 2,
  alpha = 1,
) {
  if (alpha <= 0.005) return;
  ink(color, alpha);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(1);
  c.drawLine(x, y, xx, yy, paint);
}
function shape(
  c: SkCanvas,
  points: readonly (readonly number[])[],
  color: string,
  alpha = 1,
) {
  const p = Skia.Path.Make();
  p.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) p.lineTo(points[i][0], points[i][1]);
  p.close();
  c.drawPath(p, ink(color, alpha));
}
function ring(
  c: SkCanvas,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  alpha = 1,
  width = 3,
) {
  if (alpha <= 0.005) return;
  ink(color, alpha);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  c.drawOval(Skia.XYWHRect(x - rx, y - ry, rx * 2, ry * 2), paint);
}
function glow(
  c: SkCanvas,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1,
) {
  for (let i = 4; i > 0; i--)
    dot(c, x, y, (r * i) / 4, color, alpha * (5 - i) * 0.045);
}
function sparks(
  c: SkCanvas,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
  seed: number,
  count = 12,
  width = 3,
) {
  for (let i = 0; i < count; i++) {
    const a = (i * Math.PI * 2) / count + seed,
      rr = r * (0.72 + 0.28 * Math.sin(i * 3.17 + seed) ** 2);
    line(
      c,
      x + Math.cos(a) * rr * 0.55,
      y + Math.sin(a) * rr * 0.55,
      x + Math.cos(a) * rr,
      y + Math.sin(a) * rr,
      color,
      width,
      alpha,
    );
  }
}
function lightning(
  c: SkCanvas,
  x: number,
  y: number,
  xx: number,
  yy: number,
  seed: number,
  alpha = 1,
  width = 4,
) {
  const points: number[][] = [],
    dx = xx - x,
    dy = yy - y,
    len = Math.max(1, Math.hypot(dx, dy));
  for (let i = 0; i <= 9; i++) {
    const t = i / 9,
      j =
        i === 0 || i === 9
          ? 0
          : Math.sin(i * 7.9 + seed) * Math.min(19, len * 0.1);
    points.push([x + dx * t - (dy / len) * j, y + dy * t + (dx / len) * j]);
  }
  for (let i = 1; i < points.length; i++) {
    const [a, b] = points[i - 1],
      [d, e] = points[i];
    line(c, a, b, d, e, "#3c9dff", width * 4, alpha * 0.13);
    line(c, a, b, d, e, "#5addff", width * 1.8, alpha * 0.8);
    line(c, a, b, d, e, "#f4ffff", width * 0.65, alpha);
  }
}
function crescent(
  c: SkCanvas,
  x: number,
  y: number,
  r: number,
  start: number,
  end: number,
  color: string,
  alpha: number,
  width = 16,
) {
  const points: number[][] = [],
    steps = 20;
  for (let i = 0; i <= steps; i++) {
    const a = start + ((end - start) * i) / steps;
    points.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps,
      a = start + (end - start) * t,
      inner = r - width * Math.sin(Math.PI * t) ** 0.6;
    points.push([x + Math.cos(a) * inner, y + Math.sin(a) * inner]);
  }
  shape(c, points, color, alpha);
  for (let i = 1; i <= steps; i++) {
    const a = start + ((end - start) * (i - 1)) / steps,
      b = start + ((end - start) * i) / steps;
    line(
      c,
      x + Math.cos(a) * r,
      y + Math.sin(a) * r,
      x + Math.cos(b) * r,
      y + Math.sin(b) * r,
      "#f2ffff",
      2,
      alpha * 0.95,
    );
  }
}
function star(
  c: SkCanvas,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1,
) {
  const pts: number[][] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8,
      rr = i % 2 ? r * 0.22 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  shape(c, pts, color, alpha);
}
export function attackVisualAge(u: Unit) {
  const rapid = ["mafia", "machineGunner", "spaceMarine", "raccoon"].includes(
    u.kind,
  );
  if (u.attack > 0) return Math.max(0, (rapid ? 0.12 : 0.25) - u.attack);
  if (rapid || u.cooldown <= 0.15) return Infinity;
  return COMBAT_UNITS[u.kind].cooldown - u.cooldown;
}
// Backlights and afterimages sit behind the actual model to preserve its silhouette.
export function drawAttackBacklight(c: SkCanvas, u: Unit, time: number) {
  if (u.hp <= 0 || isEnemyKind(u.kind)) return;
  const age = attackVisualAge(u);
  if (age < 0 || age > 0.55) return;
  const fade = clamp(1 - age / 0.55);
  if (u.kind === "stormblade") {
    glow(c, 10, -50, 84, "#44bcff", fade * 0.9);
    for (let i = 0; i < 3; i++)
      lightning(
        c,
        -25 - i * 9,
        -12,
        -15 + i * 22,
        -116 - i * 6,
        time * 35 + i,
        fade * 0.6,
        2,
      );
    ring(c, 0, 3, 39 + age * 50, 10, "#71eaff", fade * 0.6, 3);
  } else if (u.kind === "gundam") {
    for (let i = 3; i > 0; i--) {
      const x = -i * (12 + age * 30);
      line(c, x, -76, x, -30, "#4fbfff", 20, fade * 0.1);
      line(c, x - 11, -55, x + 13, -55, "#9cefff", 12, fade * 0.12);
      line(c, x, -28, x - 8, -3, "#67dfff", 10, fade * 0.1);
    }
    shape(
      c,
      [
        [-23, -66],
        [-80 - age * 65, -53],
        [-30, -43],
      ],
      "#40cfff",
      fade * 0.7,
    );
    shape(
      c,
      [
        [-23, -61],
        [-61 - age * 45, -53],
        [-28, -48],
      ],
      "#eeffff",
      fade,
    );
    for (let i = 0; i < 5; i++)
      line(
        c,
        -100 - i * 7,
        -15 - i * 17,
        -30,
        -15 - i * 17,
        "#90eaff",
        3,
        fade * 0.6,
      );
  } else if (u.kind === "darkMage") {
    ring(c, 0, 0, 45 + age * 18, 12 + age * 4, "#ffba42", fade * 0.8, 4);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + time,
        x = Math.cos(a) * 43,
        y = Math.sin(a) * 12;
      line(
        c,
        x,
        y,
        x + Math.cos(a) * 7,
        y + Math.sin(a) * 5,
        "#fff1ac",
        3,
        fade,
      );
    }
    glow(c, MAGE.staffX, MAGE.staffY, 50, "#ff941f", fade);
  } else if (u.kind === "skeletonKing") {
    glow(c, 0, -47, 70, "#64ff68", fade * 0.8);
    for (let i = 0; i < 3; i++) {
      const x = -24 - i * 12,
        y = -30 - age * 45 - i * 14;
      dot(c, x, y, 9, "#8effb3", fade * 0.3);
      dot(c, x - 3, y - 1, 2, "#163c35", fade);
      dot(c, x + 3, y - 1, 2, "#163c35", fade);
    }
  }
}
export function drawAttackAura(c: SkCanvas, u: Unit, time: number) {
  if (u.hp <= 0 || isEnemyKind(u.kind)) return;
  const age = attackVisualAge(u);
  if (age < 0 || age > 0.6) return;
  const t = clamp(age / 0.6),
    fade = clamp(1 - t),
    burst = clamp(1 - age / 0.3);
  if (["stormblade", "gundam", "skeletonKing"].includes(u.kind)) {
    const kind = u.kind as "stormblade" | "gundam" | "skeletonKing",
      p = meleeWeaponPose(kind, u.attack),
      color = kind === "skeletonKing" ? "#71ff83" : "#50d9ff";
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle, 0, 0);
    const length = kind === "stormblade" ? 78 : 54;
    glow(c, length * 0.6, 0, 36, color, burst);
    line(c, 14, 0, length, 0, color, 22, burst * 0.3);
    if (kind === "stormblade") {
      lightning(c, 10, -9, length, 0, time * 65, burst, 4);
      lightning(c, 22, 9, length - 5, 0, time * 65 + 2, burst * 0.8, 2);
    }
    c.restore();
    if (age > 0.035) {
      const slash = clamp((age - 0.035) / 0.1);
      crescent(
        c,
        14,
        -43,
        90 + slash * 12,
        -1.45 + slash * 0.25,
        0.8 + slash * 0.45,
        color,
        fade * 0.8,
        29,
      );
      crescent(
        c,
        14,
        -43,
        81 + slash * 12,
        -1.25 + slash * 0.25,
        0.6 + slash * 0.45,
        "#e7ffff",
        fade * 0.55,
        9,
      );
    }
  } else if (u.kind === "darkMage") {
    const x = MAGE.staffX,
      y = MAGE.staffY;
    ring(c, x, y, 24 + t * 32, 24 + t * 32, "#ffa53e", fade, 4);
    ring(c, x, y, 18 + t * 25, 18 + t * 25, "#fff2ac", fade * 0.9, 2);
    for (let i = 0; i < 6; i++) {
      const a = time * 5 + (i * Math.PI) / 3;
      star(
        c,
        x + Math.cos(a) * (27 + t * 17),
        y + Math.sin(a) * (27 + t * 17),
        5,
        "#ffd66a",
        fade,
      );
    }
    sparks(c, x, y, 28 + t * 50, "#ffb348", fade, u.id, 10, 3);
  } else if (u.kind === "barbarian") {
    if (age > 0.05) {
      crescent(c, 0, -27, 83, -1.65, 0.65, "#ffc46e", fade * 0.8, 22);
      line(c, 35, -70, 68, -10, "#fff4c2", 8, burst);
    }
  } else if (["machineGunner", "mafia", "spaceMarine"].includes(u.kind)) {
    const x =
        u.kind === "spaceMarine"
          ? MARINE.muzzleOffsetX
          : u.kind === "mafia"
            ? TOMMY.muzzleOffsetX
            : GUNNER.muzzleOffsetX,
      y =
        u.kind === "spaceMarine"
          ? MARINE.muzzleY
          : u.kind === "mafia"
            ? TOMMY.muzzleY
            : -26,
      shot = clamp(1 - age / 0.12);
    shape(
      c,
      [
        [x - 2, y - 7],
        [x + 15, y - 14],
        [x + 10, y - 5],
        [x + 36 * shot + 8, y],
        [x + 12, y + 5],
        [x + 17, y + 13],
        [x - 2, y + 6],
      ],
      "#ff922f",
      shot,
    );
    shape(
      c,
      [
        [x, y - 4],
        [x + 25 * shot, y],
        [x, y + 4],
      ],
      "#fffad5",
      shot,
    );
    glow(c, x + 6, y, 28, "#ffb636", shot * 0.7);
    for (let i = 0; i < 2; i++) {
      const q = clamp(age / 0.12 + i * 0.15);
      c.save();
      c.translate(x - 34 - q * 22, y - 18 * Math.sin(q * Math.PI) - i * 5);
      c.rotate(q * 270, 0, 0);
      line(c, -3, 0, 3, 0, "#ffd779", 4, 1 - q);
      c.restore();
    }
  } else if (u.kind === "rapper") {
    for (let i = 0; i < 3; i++)
      ring(
        c,
        35 + t * 50 + i * 11,
        -44,
        9 + t * 15 + i * 4,
        20 + t * 25 + i * 7,
        ["#f38aff", "#72eeff", "#ffe886"][i],
        fade * 0.85,
        4,
      );
    for (let i = 0; i < 4; i++)
      star(c, 18 + i * 12, -67 - Math.sin(i + t * 4) * 13, 5, "#f8b4ff", fade);
  } else if (u.kind === "tiger") {
    for (const eye of TIGER.eyes) {
      glow(c, eye.x, eye.y, 23, "#ff293f", burst);
      star(c, eye.x, eye.y, 14, "#ffe3dd", burst);
    }
  } else if (u.kind === "cyborgWalrus") {
    for (let i = 0; i < 3; i++) {
      dot(
        c,
        -22 - t * 22 - i * 7,
        -37 - t * 30 - i * 5,
        5 + t * 9,
        "#d5f5ff",
        fade * 0.45,
      );
      lightning(c, 39, -39 + i * 9, 60, -24 + i * 8, time * 45 + i, burst, 2);
    }
    crescent(c, 21, -25, 43, -1.3, 0.75, "#b7f3ff", fade * 0.6, 12);
  } else if (u.kind === "shark") {
    crescent(c, 6, -7, 43, -0.9, 1.6, "#a5efff", fade * 0.8, 14);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 8;
      dot(
        c,
        15 + Math.cos(a) * t * 55,
        -5 - Math.sin(a) * t * 45 + t * t * 30,
        3,
        "#c9faff",
        fade,
      );
    }
  } else if (u.kind === "duck") {
    star(c, 61, -22, 17, "#fff2a2", burst);
    for (let i = 0; i < 3; i++) {
      c.save();
      c.translate(-11 - i * 9 - t * 20, -22 - t * 27 + i * 7);
      c.rotate(t * 150 + i * 40, 0, 0);
      ring(c, 0, 0, 8, 2.5, "#fff1c9", fade, 3);
      c.restore();
    }
  } else if (["cannon", "mech", "mig17"].includes(u.kind)) {
    const cannon = u.kind === "cannon",
      jet = u.kind === "mig17",
      x = cannon ? 43 : jet ? -61 : 20,
      y = cannon ? -35 : jet ? -91 : -53;
    for (let i = 0; i < 6; i++)
      dot(
        c,
        x + t * 30 + i * 6,
        y - t * 24 - i * 4,
        5 + i * 2 + t * 12,
        "#cdd5d9",
        fade * 0.28,
      );
    if (cannon) {
      shape(
        c,
        [
          [x, -45],
          [x + 25, -54],
          [x + 18, -43],
          [x + 60 * burst, -35],
          [x + 18, -28],
          [x + 28, -18],
          [x, -26],
        ],
        "#ffac3b",
        burst,
      );
      star(c, x + 10, y, 23, "#fff3b7", burst);
      ring(
        c,
        x + 15 + t * 45,
        y,
        8 + t * 15,
        16 + t * 20,
        "#f5d7a0",
        fade * 0.65,
        3,
      );
    }
  } else if (u.kind === "clubman" || u.kind === "spearman") {
    const spear = u.kind === "spearman";
    crescent(
      c,
      0,
      -20,
      spear ? 56 : 36,
      spear ? -1.1 : -1.7,
      0.3,
      "#fff0b7",
      burst * 0.85,
      spear ? 8 : 13,
    );
    if (spear)
      for (let i = 0; i < 3; i++)
        line(c, 15 - i * 5, -33 - i * 6, 54, -44 - i * 4, "#fff3cb", 3, burst);
  } else if (u.kind === "rock")
    crescent(c, 5, -29, 28, -2.2, -0.1, "#ece0c7", burst * 0.6, 9);
  else if (u.kind === "basketballPlayer") {
    for (let i = 0; i < 3; i++)
      line(
        c,
        -14 + i * 15,
        -5,
        -14 + i * 15,
        16 + t * 9,
        "#ffe8ab",
        2,
        fade * 0.8,
      );
    ring(c, 0, 2, 20 + t * 20, 4 + t * 4, "#e7c999", fade * 0.7, 3);
  }
}
type Burst = {
  id: number;
  kind: NonNullable<Effect["visual"]>["kind"];
  x: number;
  lane: number;
  born: number;
  life: number;
};
type VisualState = { time: number; seen: Set<number>; bursts: Burst[] };
const states = new WeakMap<World, VisualState>();
function prepare(world: World) {
  let state = states.get(world);
  if (!state || world.time < state.time) {
    state = { time: world.time, seen: new Set(), bursts: [] };
    states.set(world, state);
  }
  for (const e of world.effects) {
    if (!e.visual || state.seen.has(e.id)) continue;
    const kind = e.visual.kind;
    state.bursts.push({
      id: e.id,
      kind,
      x: e.visual.x,
      lane: e.lane,
      born: world.time - e.age,
      life:
        kind === "raccoon"
          ? 0.32
          : kind === "bullet"
            ? 0.24
            : kind === "stormblade"
              ? 0.8
              : 1.0,
    });
  }
  state.seen = new Set(world.effects.map((e) => e.id));
  state.bursts = state.bursts
    .filter((e) => world.time - e.born < e.life)
    .slice(-40);
  state.time = world.time;
  return state;
}
export function attackCameraOffset(world: World) {
  const { bursts } = prepare(world);
  let power = 0;
  for (const b of bursts) {
    const age = world.time - b.born;
    if (
      ["stormblade", "barbarian", "fireball", "cannonball", "missile"].includes(
        b.kind,
      )
    )
      power = Math.max(power, 4 * clamp(1 - age / 0.2));
  }
  return {
    x: Math.sin(world.time * 113) * power,
    y: Math.sin(world.time * 157) * power * 0.55,
  };
}
function explosion(c: SkCanvas, b: Burst, age: number, y: number) {
  const t = age / b.life,
    fade = clamp((1 - t) * 1.5),
    size = b.kind === "cannonball" ? 1.85 : b.kind === "fireball" ? 1.65 : 1.5,
    r = (18 + 84 * (1 - Math.exp(-age * 14))) * size;
  glow(c, b.x, y, r * 1.6, "#ff8d26", fade * 0.7);
  if (age < 0.5) {
    const fire = clamp(1 - age / 0.55);
    dot(c, b.x, y - age * 12, r * 0.57, "#ea4d23", fade * 0.95);
    dot(c, b.x - 3, y - age * 18, r * 0.45, "#ff922b", fade);
    dot(c, b.x - 7, y - age * 23, r * 0.29 * fire, "#ffe08b", fade);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + b.id,
      rr = r * (0.45 + 0.15 * Math.sin(i * 2)),
      x = b.x + Math.cos(a) * rr,
      yy = y + Math.sin(a) * rr * 0.8 - age * 28;
    dot(
      c,
      x,
      yy,
      14 + age * 20,
      "#555369",
      clamp((age - 0.15) * 3) * fade * 0.65,
    );
    if (age < 0.5) {
      const fr = (25 + Math.sin(i * 9 + age * 8) * 5) * (1 - age / 0.6) * size;
      dot(c, x, yy, fr + 7, "#e95527", fade * 0.85);
      dot(c, x - 2, yy - 3, fr, "#ff9e30", fade);
      dot(c, x - 4, yy - 5, fr * 0.56, "#ffe8a1", fade);
    }
    const dx = Math.cos(a) * (26 + age * 105),
      dy = Math.sin(a) * (20 + age * 80) + age * age * 70;
    shape(
      c,
      [
        [b.x + dx, y + dy],
        [b.x + dx + 7, y + dy - 3],
        [b.x + dx + 4, y + dy + 6],
      ],
      "#784f40",
      fade * 0.9,
    );
  }
  if (age < 0.23) {
    dot(
      c,
      b.x,
      y,
      38 * (1 - age / 0.23) * size,
      "#fff4be",
      clamp(1 - age / 0.26),
    );
    star(
      c,
      b.x,
      y,
      80 * clamp(1 - age / 0.26) * size,
      "#fffbdc",
      clamp(1 - age / 0.23),
    );
  }
  ring(
    c,
    b.x,
    y,
    10 + age * 180 * size,
    8 + age * 140 * size,
    "#ffd77b",
    clamp(1 - age / 0.42),
    5,
  );
  ring(
    c,
    b.x,
    y + 27,
    15 + age * 180 * size,
    4 + age * 37,
    "#f2ca93",
    clamp(1 - age / 0.65) * 0.7,
    4,
  );
  sparks(
    c,
    b.x,
    y,
    20 + age * 190,
    "#ffda7e",
    clamp(1 - age / 0.6),
    b.id,
    14,
    4,
  );
}
export function drawAttackImpacts(c: SkCanvas, world: World, ground: number) {
  const state = prepare(world);
  for (const b of state.bursts) {
    const age = Math.max(0, world.time - b.born),
      t = age / b.life,
      fade = clamp(1 - t),
      y = ground - 28 * BATTLE_UNIT_SCALE + b.lane * 15;
    if (b.kind === "raccoon") {
      // Tiny explosive bullet impact, intentionally much smaller than artillery.
      const r = 5 + 15 * Math.sin(Math.PI * t);
      dot(c, b.x, y, r, "#f07831", fade);
      dot(c, b.x - 2, y - 2, r * 0.65, "#ffd05c", fade);
      dot(c, b.x, y - 3, r * 0.3, "#fff2c2", fade);
      ring(c, b.x, y, 7 + t * 20, 7 + t * 18, "#ffce69", fade * 0.7, 2);
      sparks(c, b.x, y, 7 + t * 23, "#ffc76a", fade, b.id, 5, 2);
      continue;
    }
    if (["fireball", "missile", "cannonball"].includes(b.kind)) {
      explosion(c, b, age, y);
      continue;
    }
    if (b.kind === "stormblade") {
      glow(c, b.x, y, 95, "#45b9ff", fade * 0.9);
      if (age < 0.32) {
        lightning(
          c,
          b.x - 30,
          y - 210,
          b.x,
          y,
          Math.floor(age * 24) + b.id,
          clamp(1 - age / 0.36),
          6,
        );
        lightning(
          c,
          b.x + 47,
          y - 150,
          b.x,
          y,
          Math.floor(age * 24) + b.id + 3,
          clamp(1 - age / 0.3),
          3,
        );
        lightning(
          c,
          b.x,
          y - 25,
          b.x - 48,
          y + 10,
          world.time * 45,
          0.8 * fade,
          3,
        );
      }
      crescent(
        c,
        b.x - 70,
        y - 12,
        89 + age * 35,
        -1.3,
        1.1,
        "#50dbff",
        clamp(1 - age / 0.45),
        24,
      );
      ring(
        c,
        b.x,
        y,
        12 + age * 150,
        12 + age * 125,
        "#8aefff",
        clamp(1 - age / 0.45),
        5,
      );
      ring(
        c,
        b.x,
        ground + b.lane * 15,
        18 + age * 130,
        5 + age * 27,
        "#8cddff",
        fade * 0.65,
        3,
      );
      star(c, b.x, y, 55 * clamp(1 - age / 0.2), "#f1ffff", fade);
      sparks(
        c,
        b.x,
        y,
        20 + age * 170,
        "#b4f8ff",
        clamp(1 - age / 0.5),
        b.id,
        12,
        4,
      );
    } else if (b.kind === "gundam") {
      crescent(
        c,
        b.x - 65,
        y,
        88 + age * 50,
        -1.5,
        1.3,
        "#48cbff",
        clamp(1 - age / 0.5),
        30,
      );
      line(
        c,
        b.x - 32,
        y + 52,
        b.x + 35,
        y - 65,
        "#a2efff",
        13,
        clamp(1 - age / 0.25),
      );
      line(
        c,
        b.x - 32,
        y + 52,
        b.x + 35,
        y - 65,
        "#f1ffff",
        4,
        clamp(1 - age / 0.3),
      );
      sparks(
        c,
        b.x,
        y,
        22 + age * 145,
        "#86e9ff",
        clamp(1 - age / 0.55),
        b.id,
        12,
        4,
      );
    } else if (b.kind === "skeletonKing") {
      crescent(
        c,
        b.x - 57,
        y,
        84 + age * 45,
        -1.5,
        1.1,
        "#5aff7e",
        clamp(1 - age / 0.5),
        25,
      );
      for (let i = 0; i < 3; i++) {
        const x = b.x + (i - 1) * (19 + age * 32),
          yy = y - age * 65 - Math.sin(i) * 17;
        glow(c, x, yy, 27, "#53ff84", fade * 0.5);
        dot(c, x, yy, 13, "#a6ffc0", fade * 0.8);
        shape(
          c,
          [
            [x - 7, yy + 5],
            [x + 7, yy + 5],
            [x + 5, yy + 16],
            [x - 5, yy + 16],
          ],
          "#a6ffc0",
          fade * 0.8,
        );
        dot(c, x - 4, yy - 1, 3, "#174c3d", fade);
        dot(c, x + 4, yy - 1, 3, "#174c3d", fade);
        line(c, x, yy + 7, x, yy + 12, "#225c43", 2, fade);
      }
    } else if (b.kind === "barbarian") {
      star(c, b.x, y, 55 * clamp(1 - age / 0.25), "#fff0b0", fade);
      const gy = ground + b.lane * 15;
      for (let i = 0; i < 7; i++) {
        const x = b.x + (i - 3) * (12 + age * 36),
          yy = gy - 28 * Math.sin(age * 3 + i * 0.1);
        dot(c, x, yy, 9 + age * 10, "#cfaa7b", fade * 0.5);
        shape(
          c,
          [
            [x - 5, yy - 4],
            [x + 4, yy - 7],
            [x + 7, yy + 2],
            [x - 3, yy + 5],
          ],
          "#7b5943",
          fade,
        );
      }
      for (let i = 0; i < 3; i++) {
        const dx = (i - 1) * 30;
        line(c, b.x, gy, b.x + dx, gy + 19, "#634a38", 4, fade);
        line(c, b.x + dx, gy + 19, b.x + dx * 1.5, gy + 26, "#634a38", 2, fade);
      }
      ring(
        c,
        b.x,
        gy,
        12 + age * 175,
        3 + age * 38,
        "#ffe2a6",
        clamp(1 - age / 0.65),
        5,
      );
    } else if (b.kind === "note") {
      for (let i = 0; i < 3; i++)
        ring(
          c,
          b.x,
          y,
          13 + age * 100 + i * 12,
          18 + age * 110 + i * 12,
          ["#f17cff", "#71edff", "#ffe67b"][i],
          clamp(1 - age / 0.6),
          4,
        );
      sparks(c, b.x, y, 18 + age * 110, "#e9acff", fade, b.id, 8, 4);
    } else if (b.kind === "laser") {
      star(c, b.x, y, 35 * clamp(1 - age / 0.3), "#ffb5aa", fade);
      sparks(
        c,
        b.x,
        y,
        14 + age * 100,
        "#ff554e",
        clamp(1 - age / 0.4),
        b.id,
        7,
        3,
      );
    } else if (b.kind === "basketball") {
      ring(
        c,
        b.x,
        y,
        10 + age * 90,
        10 + age * 90,
        "#ffb74f",
        clamp(1 - age / 0.5),
        5,
      );
      star(c, b.x, y, 38 * clamp(1 - age / 0.25), "#ffe3a0", fade);
      sparks(
        c,
        b.x,
        y,
        20 + age * 100,
        "#ffbd58",
        clamp(1 - age / 0.5),
        b.id,
        8,
        4,
      );
    } else {
      const tiny = b.kind === "bullet";
      star(
        c,
        b.x,
        y,
        (tiny ? 17 : 30) * clamp(1 - age / 0.25),
        "#fff4c5",
        fade,
      );
      sparks(
        c,
        b.x,
        y,
        (tiny ? 8 : 17) + age * (tiny ? 55 : 105),
        b.kind === "cyborgWalrus"
          ? "#85e8ff"
          : b.kind === "shark"
            ? "#b6f4ff"
            : "#ffdc96",
        clamp(1 - age / (tiny ? 0.24 : 0.5)),
        b.id,
        tiny ? 5 : 9,
        tiny ? 2 : 3,
      );
    }
  }
}
// Broad tapered ribbons remain visible after scaling the battlefield to a phone.
export function drawProjectileTrail(
  c: SkCanvas,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  size = 4,
) {
  const length = Math.hypot(dx, dy),
    nx = length ? dy / length : 0,
    ny = length ? -dx / length : 1;
  shape(
    c,
    [
      [x + nx * size, y + ny * size],
      [x - dx * 9, y - dy * 9],
      [x - nx * size, y - ny * size],
    ],
    color,
    0.45,
  );
  for (let i = 1; i <= 7; i++)
    dot(
      c,
      x - dx * i,
      y - dy * i,
      size * (1 - i / 9),
      color,
      (1 - i / 8) * 0.65,
    );
}
