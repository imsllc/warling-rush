"""Assemble the generated four-pose sheet into a timed animation preview."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
sheet = Image.open(ROOT / 'caveman-attack-sheet.png').convert('RGBA')
width, height = sheet.size
cw, ch = width // 2, height // 2
# Align the character's stance across the generated cells.
offsets = [(-10, -12), (45, -12), (-65, 12), (30, 0)]
poses = []
for index, (dx, dy) in enumerate(offsets):
    x, y = index % 2 * cw, index // 2 * ch
    pose = sheet.crop((x, y, x + cw, y + ch))
    canvas = Image.new('RGBA', (cw, ch), '#202b29')
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((205, 452, 650, 491), fill='#15201e')
    canvas.alpha_composite(pose, (dx, dy))
    canvas = canvas.convert('RGB').resize((600, 400), Image.Resampling.LANCZOS)
    poses.append(canvas)

# A readable windup, fast strike, brief impact hold, then recovery.
frames = [poses[i] for i in [0, 1, 2, 3, 0]]
durations = [650, 350, 180, 220, 350]
frames[0].save(ROOT / 'caveman-attack-preview.gif', save_all=True,
               append_images=frames[1:], duration=durations, loop=0, disposal=2)
poses[2].save(ROOT / 'caveman-impact-preview.png')
print(ROOT / 'caveman-attack-preview.gif')
