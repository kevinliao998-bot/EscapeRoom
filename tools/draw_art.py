"""原創索引色像素繪製器。所有座標為整數，圖層命令可匯出再編輯；未讀取參考截圖。"""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'Game/public/art';OUT.mkdir(exist_ok=True,parents=True)
PALETTE=['#14191F','#202B32','#2B3640','#45545F','#5C6C7A','#8C9BA3','#263F3E','#3F5B57','#6E8F86','#9BB6AA','#756C52','#A8996F','#D8C9A0','#E4E1D6','#F4F1E7','#9C6425','#F2A33A','#FFD18A']
SOURCES={}
class Pixel:
 def __init__(self,w,h):self.im=Image.new('RGBA',(w,h));self.d=ImageDraw.Draw(self.im);self.ops=[]
 def rect(self,box,c):self.d.rectangle(box,fill=PALETTE[c]);self.ops.append(['rect',list(box),c])
 def line(self,xy,c,w=1):self.d.line(xy,fill=PALETTE[c],width=w);self.ops.append(['line',list(xy),c,w])
 def poly(self,xy,c):self.d.polygon(xy,fill=PALETTE[c]);self.ops.append(['poly',xy,c])
 def save(self,name):self.im.save(OUT/(name+'.png'));SOURCES[name]={'size':self.im.size,'operations':self.ops}
def box(p,x,y,w,h):
 p.rect((x+2,y+3,x+w+2,y+h+3),0);p.rect((x,y,x+w,y+h),1);p.rect((x+1,y+1,x+w-1,y+h-1),3);p.line((x+2,y+1,x+w-2,y+1),5)
for room in ['corridor','office','platform']:
 p=Pixel(480,256);p.rect((0,0,479,255),0)
 # 地面磚與清晰的橫向透視接縫。
 p.rect((48,66,463,239),2)
 for y in range(72,240,16):
  for x in range(48,464,16):
   p.rect((x+1,y+1,x+15,y+15),3 if (x//16+y//16)%7==0 else 2)
   p.line((x+1,y+15,x+15,y+15),1)
   if (x*3+y)%80==0:p.rect((x+3,y+3,x+4,y+3),4)
 # 上牆：切開的厚牆、面磚、壁腳與柱身。
 p.rect((48,16,463,77),6);p.rect((48,17,463,22),8)
 for x in range(48,464,16):p.line((x,25,x,72),7)
 for y in [39,55]:p.line((49,y,462,y),7)
 p.rect((48,71,463,79),1);p.line((48,71,463,71),8)
 p.rect((48,80,59,239),1);p.line((59,80,59,239),4)
 p.rect((453,80,463,239),1);p.line((453,80,453,239),4)
 # 前景 cutaway 牆頂，不遮擋可行走區。
 p.rect((48,232,463,247),0);p.rect((48,232,463,235),4);p.line((48,232,463,232),8)
 for x in [72,192,312,432]:
  p.rect((x,8,x+32,15),1);p.rect((x+2,9,x+30,11),13);p.rect((x+5,12,x+27,12),9)
  p.rect((x+3,16,x+29,17),7)
 # 地面導引，使用褪色米黃而非供電琥珀。
 p.line((66,180,440,180),10,3);p.line((66,179,440,179),12)
 for x in range(80,440,48):p.line((x,184,x+18,184),10)
 if room=='corridor':
  for x in [76,184,292,400]:
   p.rect((x,22,x+24,63),1);p.rect((x+2,24,x+22,61),2);p.line((x+4,27,x+20,27),4)
  # 端門嵌入右牆，不借鑑參考圖布局。
  p.rect((418,89,451,153),0);p.rect((421,92,448,150),4);p.rect((424,96,446,147),2);p.line((436,98,436,146),5)
  # 椅排與候車區。
  for x in [212,244,276]:
   box(p,x,204,24,13);p.rect((x+2,205,x+22,209),7);p.rect((x+2,211,x+22,215),8);p.rect((x+4,218,x+6,222),1);p.rect((x+20,218,x+22,222),1)
 elif room=='office':
  p.rect((184,27,292,61),1);p.rect((187,30,289,58),2)
  for x in range(191,287,8):p.line((x,34,x,54),6)
  for x in [80,400]:
   p.rect((x,31,x+29,67),1);p.rect((x+2,33,x+27,65),4);p.line((x+15,34,x+15,65),1)
  box(p,184,195,142,20);p.rect((188,196,322,201),5);p.rect((193,217,198,226),1);p.rect((313,217,318,226),1)
  p.rect((211,190,229,195),12);p.line((215,192,225,192),10)
 else:
  p.rect((60,19,451,80),0)
  for y in [30,61]:p.rect((61,y,451,y+3),4);p.line((61,y+1,451,y+1),5)
  for x in range(64,452,16):p.rect((x,35,x+4,59),2)
  p.rect((60,81,451,84),11);p.line((61,81,451,81),12)
  for x in range(64,451,8):p.rect((x,88,x+2,90),10)
  p.rect((413,93,450,147),0);p.rect((416,96,447,144),6);p.rect((419,99,444,140),2);p.line((432,101,432,137),8)
  for x in [96,208,336]:
   p.rect((x,14,x+7,68),1);p.line((x,15,x,65),4)
 p.save(room+'-ground')
# 可依腳底 y 排序的物件。
p=Pixel(32,48);box(p,5,4,20,36);p.rect((8,7,22,20),9);p.rect((10,9,20,18),7);p.rect((8,23,22,36),13);p.rect((12,24,18,28),2);p.rect((10,31,20,32),4);p.rect((7,41,10,43),0);p.rect((21,41,24,43),0);p.save('dispenser')
p=Pixel(32,32);box(p,4,9,24,15);p.rect((6,5,24,10),5);p.rect((9,6,21,7),13);p.line((27,9,27,2,21,2),8,2);p.rect((5,26,9,28),0);p.rect((22,26,26,28),0);p.save('cart')
p=Pixel(32,32);box(p,3,2,26,27);p.rect((6,5,26,25),4);p.line((8,10,24,10),1);p.line((8,15,24,15),1);p.rect((20,20,23,21),9);p.save('panel')
p=Pixel(48,48);box(p,1,3,44,38);p.rect((4,5,42,25),0);p.rect((7,8,39,22),6);p.line((9,16,15,16,15,12,23,12,23,19,30,19,30,16,37,16),9);p.rect((5,28,41,35),4)
for x in range(8,39,5):p.rect((x,29,x+2,30),9)
p.rect((5,42,9,46),1);p.rect((37,42,41,46),1);p.save('console')
p=Pixel(32,48);box(p,2,0,27,44)
for y in [4,16,28]:p.rect((5,y,26,y+10),2);p.line((7,y+2,24,y+2),4);p.rect((13,y+6,18,y+7),9)
p.save('cabinet')
p=Pixel(48,48);box(p,1,1,44,36);p.rect((4,4,42,33),12);p.line((7,28,16,17,24,17,32,10,39,10),7,2)
for x,y in [(7,28),(16,17),(24,17),(32,10),(39,10)]:p.rect((x-1,y-1,x+1,y+1),6)
p.rect((7,39,10,46),1);p.rect((36,39,39,46),1);p.save('map')
p=Pixel(32,48);box(p,2,2,27,35)
for y in [8,16,24]:p.rect((7,y,23,y+3),7);p.rect((9,y+1,20,y+2),9)
p.rect((6,39,10,46),1);p.rect((21,39,25,46),1);p.save('lightbox')
# 四件圖示皆為本程式新繪，無外部素材。
for i,name in enumerate(['card','pry','film','battery']):
 p=Pixel(16,16)
 if i==0:p.rect((2,4,13,12),9);p.rect((3,5,12,6),6);p.rect((4,8,6,10),12);p.line((8,9,11,9),7)
 if i==1:p.poly([(3,12),(11,3),(14,3),(14,5),(5,14)],5);p.line((4,11,11,4),13)
 if i==2:p.rect((2,2,13,13),9);p.rect((3,3,12,12),2);p.line((4,10,7,7,10,7,11,5),13)
 if i==3:p.rect((3,4,12,12),6);p.rect((6,2,9,3),5);p.rect((4,5,6,11),9);p.line((8,7,10,7),13)
 p.save(name)
# 16 幀角色：每方向重心保持一致，步伐僅改腿及手。
p=Pixel(64,96)
for direction in range(4):
 for frame in range(4):
  x=frame*16;y=direction*24;stride=[0,-1,0,1][frame]
  p.rect((x+4,y+22,x+12,y+23),1)
  p.rect((x+5,y+3,x+11,y+9),10);p.rect((x+4,y+2,x+11,y+5),1);p.rect((x+5,y+2,x+10,y+2),3)
  p.rect((x+4,y+10,x+12,y+17),1);p.rect((x+5,y+10,x+11,y+16),4);p.line((x+5,y+11,x+10,y+11),5)
  if direction==1:p.rect((x+5,y+5,x+11,y+8),1)
  else:
   ex=x+(6 if direction==2 else 10 if direction==3 else 7);p.rect((ex,y+6,ex,y+6),0)
  p.rect((x+5,y+18,x+7,y+21+stride),7);p.rect((x+10,y+18,x+12,y+21-stride),7)
  p.rect((x+4,y+22+stride,x+7,y+22+stride),0);p.rect((x+10,y+22-stride,x+13,y+22-stride),0)
  p.rect((x+3,y+11+stride,x+3,y+15+stride),8);p.rect((x+13,y+11-stride,x+13,y+15-stride),8);p.rect((x+11,y+15,x+13,y+17),10)
p.save('lin-cheng')
(ROOT/'tools/art-source.json').write_text(json.dumps({'author':'專案團隊／Codex 輔助繪製','license':'CC0-1.0（本次原創圖像）','palette':PALETTE,'layers':SOURCES},ensure_ascii=False,indent=2)+'\n')
(OUT/'palette.json').write_text(json.dumps(PALETTE,indent=2)+'\n')
print('原創貼圖',len(SOURCES),'；色板',len(PALETTE))
