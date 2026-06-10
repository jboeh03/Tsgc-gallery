"""
Weber Sprint — "Ken Burns" dynamic reel. Punchier than the static crossfade:
each photo gets a slow zoom/pan, with a fixed brand bar + sprint pill on top and
quick crossfades. Vertical 1080x1920, piped to ffmpeg. No AI (no warping risk).

Run: python3 marketing/weber_kenburns.py
"""
import math, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
WD = ROOT / "marketing/campaign-assets/weber"
FONT = str(ROOT / "marketing/fonts/Oswald.ttf")
NAVY=(26,48,85); BURG=(139,31,47); BONE=(245,242,235); AMBER=(252,211,77); RED=(200,16,46); WHITE=(255,255,255)
RW, RH = 1080, 1920

PHOTOS = [("weber-after-1-upright.jpg","Weber Genesis · 4-burner"),
          ("weber-after-2-upright.jpg","Weber Genesis · 3-burner"),
          ("weber-after-3-upright.jpg","Weber Genesis · 4-burner"),
          ("weber-after-4-upright.jpg","Weber · 6-burner"),
          ("weber-after-5-upright.jpg","Weber · grates detail")]

def font(s): return ImageFont.truetype(FONT, s)
def cover(img,w,h):
    iw,ih=img.size; s=max(w/iw,h/ih); img=img.resize((round(iw*s),round(ih*s)),Image.LANCZOS)
    iw,ih=img.size; return img.crop(((iw-w)//2,(ih-h)//2,(iw-w)//2+w,(ih-h)//2+h))
def centered(d,cx,y,t,f,fill):
    d.text((cx-d.textlength(t,font=f)/2,y),t,font=f,fill=fill)
def stars(d,x,y,s,color,n=5,gap=9):
    r,ir=s/2,s/2*0.42
    for i in range(n):
        cx,cy=x+r+i*(s+gap),y+r; pts=[]
        for k in range(10):
            a=-math.pi/2+k*math.pi/5; rad=r if k%2==0 else ir
            pts.append((cx+rad*math.cos(a),cy+rad*math.sin(a)))
        d.polygon(pts,fill=color)

def brand_bar(img):
    d=ImageDraw.Draw(img)
    d.rectangle([0,RH-230,RW,RH],fill=NAVY)
    d.text((44,RH-196),"TRI-STATE GRILL CLEANING",font=font(46),fill=WHITE)
    stars(d,44,RH-138,30,AMBER)
    d.text((250,RH-140),"tristategrillcleaning.com/weber",font=font(30),fill=BONE)
    d.rounded_rectangle([40,60,40+d.textlength("WEBER SPRINT",font=font(38))+48,124],32,fill=RED)
    d.text((64,73),"WEBER SPRINT",font=font(38),fill=WHITE)
    return img

def card(lines, sub=None, accent=AMBER):
    img=Image.new("RGB",(RW,RH),NAVY); d=ImageDraw.Draw(img)
    y=RH//2-70*len(lines)
    for t,s in lines:
        f=font(s); centered(d,RW/2,y,t,f,accent if s>=140 else WHITE); y+=f.size+12
    if sub: centered(d,RW/2,y+20,sub,font(40),BONE)
    centered(d,RW/2,RH-150,"TRISTATEGRILLCLEANING.COM/WEBER",font(36),AMBER)
    return np.asarray(img)

# Ken Burns: oversample each photo, per-frame crop a shrinking window (zoom in),
# alternate slight pan direction; brand bar composited static on top each frame.
def photo_frames(name, model, n, zoom=0.10, pan=0.04, dir=1):
    base=ImageOps.exif_transpose(Image.open(WD/name).convert("RGB"))
    big=cover(base,int(RW*(1+zoom+0.02)),int(RH*(1+zoom+0.02)))
    BW,BH=big.size
    frames=[]
    for i in range(n):
        t=i/(n-1) if n>1 else 0
        z=1+zoom*(1-t)            # start zoomed-in, ease out (or vice versa)
        cw,ch=int(RW*z),int(RH*z)
        px=int((BW-cw)/2 + dir*pan*RW*(t-0.5))
        py=int((BH-ch)/2)
        px=max(0,min(BW-cw,px)); py=max(0,min(BH-ch,py))
        fr=big.crop((px,py,px+cw,py+ch)).resize((RW,RH),Image.LANCZOS)
        frames.append(np.asarray(brand_bar(fr)))
    return frames

def build(out, fps=30, hold=46, xf=10):
    segs=[]
    segs.append([card([("WEBER SPRINT",150),("12 OF 30",150)],"Real Webers. Cleaned this week. 🔥")]*int(fps*1.4))
    for i,(nm,md) in enumerate(PHOTOS):
        segs.append(photo_frames(nm,md,hold,dir=1 if i%2==0 else -1))
    segs.append([card([("BOOK YOUR",90),("WEBER",200)],"15% off · 30% with a neighbor · ends June 17",accent=RED)]*int(fps*2.0))
    cmd=["ffmpeg","-y","-f","rawvideo","-pixel_format","rgb24","-video_size",f"{RW}x{RH}",
         "-framerate",str(fps),"-i","-","-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart",str(out)]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    for s_i,seg in enumerate(segs):
        for fr in seg: p.stdin.write(fr.tobytes())
        if s_i<len(segs)-1:
            a=segs[s_i][-1].astype(np.float32); b=segs[s_i+1][0].astype(np.float32)
            for k in range(1,xf+1):
                t=k/(xf+1); p.stdin.write(((a*(1-t)+b*t).astype(np.uint8)).tobytes())
    p.stdin.close(); p.wait()

out=WD/"weber-sprint-reel-kenburns.mp4"
build(out)
print("KENBURNS:", out.name, out.stat().st_size//1024, "KB")
