"""
Weber Sprint — "best of" combo reel:
  intro card -> cinematic clip 1 -> Ken Burns of the other 3 grills -> cinematic
  clip 2 -> outro card, stitched with crossfades. Vertical 1080x1920.
Run: python3 marketing/weber_bestof.py
"""
import math, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
WD = ROOT / "marketing/campaign-assets/weber"
FONT = str(ROOT / "marketing/fonts/Oswald.ttf")
NAVY=(26,48,85); BONE=(245,242,235); AMBER=(252,211,77); RED=(200,16,46); WHITE=(255,255,255)
RW, RH = 1080, 1920
DN = subprocess.DEVNULL

def font(s): return ImageFont.truetype(FONT, s)
def cover(img,w,h):
    iw,ih=img.size; s=max(w/iw,h/ih); img=img.resize((round(iw*s),round(ih*s)),Image.LANCZOS)
    iw,ih=img.size; return img.crop(((iw-w)//2,(ih-h)//2,(iw-w)//2+w,(ih-h)//2+h))
def centered(d,cx,y,t,f,fill): d.text((cx-d.textlength(t,font=f)/2,y),t,font=f,fill=fill)
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
    stars(d,44,RH-138,30,AMBER); d.text((250,RH-140),"tristategrillcleaning.com/weber",font=font(30),fill=BONE)
    d.rounded_rectangle([40,60,40+d.textlength("WEBER SPRINT",font=font(38))+48,124],32,fill=RED)
    d.text((64,73),"WEBER SPRINT",font=font(38),fill=WHITE)
    return img
def card(lines, sub=None, accent=AMBER):
    img=Image.new("RGB",(RW,RH),NAVY); d=ImageDraw.Draw(img); y=RH//2-70*len(lines)
    for t,s in lines:
        f=font(s); centered(d,RW/2,y,t,accent if s>=140 else WHITE,) if False else centered(d,RW/2,y,t,f,accent if s>=140 else WHITE); y+=f.size+12
    if sub: centered(d,RW/2,y+20,sub,font(40),BONE)
    centered(d,RW/2,RH-150,"TRISTATEGRILLCLEANING.COM/WEBER",font(36),AMBER)
    return np.asarray(img)
def photo_frames(name, model, n, zoom=0.10, pan=0.04, d=1):
    base=ImageOps.exif_transpose(Image.open(WD/name).convert("RGB"))
    big=cover(base,int(RW*(1+zoom+0.02)),int(RH*(1+zoom+0.02))); BW,BH=big.size; out=[]
    for i in range(n):
        t=i/(n-1) if n>1 else 0; z=1+zoom*(1-t); cw,ch=int(RW*z),int(RH*z)
        px=int((BW-cw)/2+d*pan*RW*(t-0.5)); py=int((BH-ch)/2)
        px=max(0,min(BW-cw,px)); py=max(0,min(BH-ch,py))
        out.append(np.asarray(brand_bar(big.crop((px,py,px+cw,py+ch)).resize((RW,RH),Image.LANCZOS))))
    return out
def encode(frames, out, fps=30):
    p=subprocess.Popen(["ffmpeg","-y","-f","rawvideo","-pixel_format","rgb24","-video_size",f"{RW}x{RH}",
        "-framerate",str(fps),"-i","-","-c:v","libx264","-pix_fmt","yuv420p","-r",str(fps),str(out)],
        stdin=subprocess.PIPE,stdout=DN,stderr=DN)
    for f in frames: p.stdin.write(np.ascontiguousarray(f).tobytes())
    p.stdin.close(); p.wait()

# intro / mid / outro segments
encode([card([("WEBER SPRINT",150),("12 OF 30",150)],"Real Webers. Cleaned this week.")]*45, WD/"_intro.mp4")
mid=[]
for i,(nm,md) in enumerate([("weber-after-1-upright.jpg","Weber Genesis · 4-burner"),
                            ("weber-after-4-upright.jpg","Weber · 6-burner"),
                            ("weber-after-5-upright.jpg","Weber · grates detail")]):
    seg=photo_frames(nm,md,52,d=1 if i%2==0 else -1)
    if mid:
        a=mid[-1].astype(np.float32); b=seg[0].astype(np.float32)
        for k in range(1,9): t=k/9; mid.append((a*(1-t)+b*t).astype(np.uint8))
    mid+=seg
encode(mid, WD/"_mid.mp4")
encode([card([("BOOK YOUR",90),("WEBER",200)],"15% off · 30% with a neighbor · ends June 17",RED)]*60, WD/"_outro.mp4")

def dur(p): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nk=1:nw=1",str(p)]).strip())
segs=[WD/"_intro.mp4", WD/"weber-clip-1-branded.mp4", WD/"_mid.mp4", WD/"weber-clip-2-branded.mp4", WD/"_outro.mp4"]
ds=[dur(s) for s in segs]; XF=0.4
inp=[]; [inp.extend(["-i",str(s)]) for s in segs]
filt="".join(f"[{i}:v]scale=1080:1920,fps=30,setsar=1,format=yuv420p[v{i}];" for i in range(len(segs)))
prev="v0"; off=ds[0]-XF
for i in range(1,len(segs)):
    filt+=f"[{prev}][v{i}]xfade=transition=fade:duration={XF}:offset={off:.3f}[x{i}];"; prev=f"x{i}"; off+=ds[i]-XF
filt=filt.rstrip(";")
out=WD/"weber-sprint-reel-bestof.mp4"
rc=subprocess.run(["ffmpeg","-y",*inp,"-filter_complex",filt,"-map",f"[{prev}]","-c:v","libx264",
    "-pix_fmt","yuv420p","-movflags","+faststart",str(out)],stdout=DN,stderr=open(WD/"_bestof_err.txt","w")).returncode
for f in ["_intro.mp4","_mid.mp4","_outro.mp4"]: (WD/f).unlink(missing_ok=True)
print("BESTOF rc", rc, "->", out.name, (out.stat().st_size//1024 if out.exists() else 0), "KB, total", round(sum(ds)-XF*4,1),"s")
