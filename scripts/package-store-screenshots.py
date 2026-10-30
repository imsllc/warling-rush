from pathlib import Path
from PIL import Image
from zipfile import ZipFile, ZIP_DEFLATED
root=Path('artifacts/store-screenshots')
names=['01-desert.png','02-space.png','03-lava.png']
previews=[]
for name in names:
    p=root/name
    im=Image.open(p).convert('RGB')
    assert im.size==(1080,1920),(name,im.size)
    im.save(p,format='PNG',optimize=True)
    assert Image.open(p).mode=='RGB'
    previews.append(im.resize((360,640),Image.Resampling.LANCZOS))
    print(name,im.size,'RGB PNG',p.stat().st_size,'bytes')
contact=Image.new('RGB',(1080,640))
for i,im in enumerate(previews):contact.paste(im,(i*360,0))
contact.save(root/'preview.png',optimize=True)
with ZipFile(root/'warling-rush-store-screenshots.zip','w',ZIP_DEFLATED) as z:
    for name in names:z.write(root/name,name)
with ZipFile(root/'warling-rush-store-screenshots.zip') as z:assert z.namelist()==names
print('Three-image ZIP verified')
