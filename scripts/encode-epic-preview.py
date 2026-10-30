from pathlib import Path
from PIL import Image
import sys
root=Path('artifacts/epic-frames')
for d in root.iterdir():
    if not d.is_dir(): continue
    if len(sys.argv)>1 and d.name not in sys.argv[1:]: continue
    frames=[Image.open(f).convert('RGB') for f in sorted(d.glob('*.png'))]
    frames[0].save(Path('artifacts')/('epic-'+d.name+'.gif'),save_all=True,append_images=frames[1:],duration=33,loop=0,optimize=False)
    selected=[frames[i] for i in [3,7,11,17,23,29]]
    sheet=Image.new('RGB',(1440,3*432),(23,34,48))
    for i,frame in enumerate(selected):sheet.paste(frame,((i%2)*720,(i//2)*432))
    sheet.save(Path('artifacts')/('epic-'+d.name+'-sequence.png'))
    print('Encoded',d.name)
