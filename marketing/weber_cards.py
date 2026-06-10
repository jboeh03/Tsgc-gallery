"""
Two text-precise Weber cards built with PIL (exact numbers/copy, no AI garble):
  - weber-tally-12.png   : 12 of 30 progress gauge
  - weber-tip-ignite.png : "Weber won't light?" 3-step tip card
Run: python3 marketing/weber_cards.py
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = str(ROOT / "marketing/fonts/Oswald.ttf")
OUT = ROOT / "marketing/campaign-assets"
NAVY=(26,48,85); NAVY2=(34,60,104); BONE=(245,242,235); AMBER=(252,211,77); RED=(200,16,46); WHITE=(255,255,255); MUTE=(150,165,190)
W,H = 1080,1350

def font(s): return ImageFont.truetype(FONT, s)
def centered(d,cx,y,t,f,fill): d.text((cx-d.textlength(t,font=f)/2,y),t,font=f,fill=fill)
def stars(d,x,y,s,color,n=5,gap=9):
    r,ir=s/2,s/2*0.42
    for i in range(n):
        cx,cy=x+r+i*(s+gap),y+r; pts=[]
        for k in range(10):
            a=-math.pi/2+k*math.pi/5; rad=r if k%2==0 else ir
            pts.append((cx+rad*math.cos(a),cy+rad*math.sin(a)))
        d.polygon(pts,fill=color)
def wrap(d,text,f,maxw):
    words=text.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if d.textlength(t,font=f)<=maxw: cur=t
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    return lines

def header(d):
    centered(d,W/2,54,"TRI-STATE GRILL CLEANING",font(54),WHITE)
    centered(d,W/2,120,"VETERAN-FOUNDED · CINCINNATI · NKY · DAYTON",font(26),AMBER)

# ---------- tally 12 of 30 ----------
def tally():
    img=Image.new("RGB",(W,H),NAVY); d=ImageDraw.Draw(img)
    header(d)
    centered(d,W/2,250,"WEBER SPRINT",font(120),AMBER)
    centered(d,W/2,400,"WEBERS CLEANED",font(40),BONE)
    # big count
    cf=font(300); ssf=font(90)
    txt="16"; tw=d.textlength(txt,font=cf); sw=d.textlength(" / 30",font=ssf)
    x0=(W-(tw+sw))/2
    d.text((x0,470),txt,font=cf,fill=WHITE)
    d.text((x0+tw,470+150),"/ 30",font=ssf,fill=MUTE)
    # progress bar
    bx,by,bw,bh=90,860,900,70
    d.rounded_rectangle([bx,by,bx+bw,by+bh],35,fill=NAVY2)
    fillw=int(bw*16/30)
    d.rounded_rectangle([bx,by,bx+fillw,by+bh],35,fill=RED)
    d.text((bx,by-46),"START",font=font(28),fill=MUTE)
    d.text((bx+bw-d.textlength("GOAL: 30",font=font(28)),by-46),"GOAL: 30",font=font(28),fill=AMBER)
    # tease
    for i,ln in enumerate(wrap(d,"Hit 30 and one customer gets their cleaning refunded at random.",font(40),900)):
        centered(d,W/2,1000+i*52,ln,font(40),BONE)
    centered(d,W/2,1180,"ENDS JUNE 17",font(48),AMBER)
    centered(d,W/2,1255,"TRISTATEGRILLCLEANING.COM/WEBER",font(34),WHITE)
    p=OUT/"weber-tally-16.png"; img.save(p); return p.name

# ---------- "won't light?" tip card ----------
def tip():
    TH=1500
    img=Image.new("RGB",(W,TH),NAVY); d=ImageDraw.Draw(img)
    header(d)
    centered(d,W/2,230,"WEBER WON'T LIGHT?",font(86),WHITE)
    centered(d,W/2,330,"3 things to check before you panic",font(36),AMBER)
    tips=[("1","CHECK THE IGNITER BATTERY","That AA in the button dies far more often than the igniter itself."),
          ("2","CLEAR THE BURNER TUBES","Spiders love to nest inside them — a clogged tube won't carry flame across."),
          ("3","RESET THE REGULATOR","Weak flame after hooking up propane? Turn it all off, disconnect, wait 30 sec, reconnect slowly.")]
    y=440
    for num,title,body in tips:
        d.rounded_rectangle([60,y,W-60,y+250],24,fill=NAVY2)
        d.ellipse([95,y+45,95+86,y+45+86],fill=RED)
        centered(d,95+43,y+58,num,font(64),WHITE)
        d.text((215,y+44),title,font=font(46),fill=AMBER)
        for i,ln in enumerate(wrap(d,body,font(34),W-300)):
            d.text((215,y+108+i*44),ln,font=font(34),fill=BONE)
        y+=290
    centered(d,W/2,y+6,"Still stuck? We'll diagnose & fix it on-site.",font(38),WHITE)
    centered(d,W/2,y+58,"TRISTATEGRILLCLEANING.COM/WEBER",font(34),AMBER)
    p=OUT/"weber-tip-ignite.png"; img.save(p); return p.name

print("CARDS:", tally(), "+", tip())
