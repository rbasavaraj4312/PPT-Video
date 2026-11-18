import json
from pathlib import Path
import sys
from datetime import datetime, timezone
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from backend.app.models.presentation import PresentationModel

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[1]
BG = '#08111f'
WHITE = '#f5f8ff'
MUTED = '#a7b9ce'
CYAN = '#53e1ed'
VIOLET = '#bba4ff'

def box(k,x,y,w,h,fill,stroke='transparent',radius=20,z=1,kind='rounded_rectangle'):
    return dict(id=k,morph_id=k,type=kind,x=x,y=y,width=w,height=h,fill=fill,stroke=stroke,stroke_width=1.5,radius=radius,z_index=z)
def txt(k,s,x,y,w,h,size=22,color=WHITE,bold=False,align='left',font='Inter, sans-serif'):
    return dict(id=k,morph_id=k,type='text',content=s,x=x,y=y,width=w,height=h,font_size=size,font_color=color,font_weight='bold' if bold else 'normal',font_family=font,text_align=align,vertical_align='middle',fill='transparent',stroke='transparent',z_index=5)
def circle(k,x,y,d,fill,stroke='transparent'):
    return box(k,x,y,d,d,fill,stroke,kind='ellipse',z=2)
def arrow(k,x,y,w,color=CYAN):
    return txt(k,'→',x,y,w,56,42,color,True,'center')
def base(section,num):
    return [box('topline',0,0,1280,7,CYAN,kind='rectangle'),txt('series','CODE, MADE CLEAR',65,37,450,28,14,CYAN,True),txt('chapter',section,860,37,355,28,14,MUTED,True,'right'),txt('foot','COMPILER  /  INTERPRETER',65,665,700,25,13,'#6f879e',True),txt('page',f'{num:02}',1150,665,65,25,14,'#8095ad',True,'right')]
def codepanel(x,y,w,h):
    return [box('code-window',x,y,w,h,'#111f32','#36526c',16),circle('dot1',x+22,y+20,9,'#fb7185'),circle('dot2',x+39,y+20,9,'#fbbf24'),circle('dot3',x+56,y+20,9,'#34d399'),txt('code-label','hello.py',x+90,y+12,w-110,25,13,'#91a8c2',font='monospace'),txt('code-content','name = "world"\nprint("Hello", name)',x+25,y+60,w-50,h-76,20,'#d8e7f6',font='monospace')]
def pill(k,s,x,y,w,color,background):
    return [box(k,x,y,w,42,background,color,21),txt(k+'-text',s,x,y,w,42,14,color,True,'center')]
def slide(i,title,section,duration,script,els):
    return {'id':f'compiler-reel-{i:02}', 'title':title,'background':BG,'slide_duration':duration,'transition_type':'morph' if i<8 else 'none','transition_duration':0.85,'elements':base(section,i)+els,'narration':{'script':script,'engine':'omnivoice','fit_to_audio':True,'padding_ms':250}}

slides=[]
slides.append(slide(1,'Two paths from code','THE QUESTION',5.8,'How does your code become something a computer can run? Meet the compiler and the interpreter.',[
 txt('hero','Your code has\ntwo paths to run.',65,110,650,160,57,WHITE,True),txt('sub','COMPILER  VS  INTERPRETER',68,296,590,38,19,CYAN,True),
 *codepanel(725,138,475,215),arrow('arrow-one',900,365,120),box('chip',825,447,275,100,'#123c48','#5ce6ed'),txt('chip-label','COMPUTER',825,447,275,100,24,CYAN,True,'center'),
 *pill('hook-pill','A 60-SECOND EXPLAINER',68,433,285,CYAN,'#0b2b3b')]))
slides.append(slide(2,'Why translation matters','THE BRIDGE',6.5,'We write source code in a language people can read. A computer needs instructions it can actually execute.',[
 txt('hero','From human ideas\nto machine instructions.',65,102,1050,140,45,WHITE,True),
 *codepanel(70,315,340,210),arrow('arrow-one',425,385,95),box('bridge',535,340,210,160,'#1a2946','#7c85df'),txt('bridge-label','TRANSLATE\nOR EXECUTE',550,363,180,110,21,'#d8d3ff',True,'center'),arrow('arrow-two',760,385,95),box('chip',870,340,330,160,'#123c48','#5ce6ed'),txt('chip-label','MACHINE\nINSTRUCTIONS',890,360,290,120,25,CYAN,True,'center')]))
slides.append(slide(3,'Compiler: translate first','COMPILER',7.3,'A compiler translates the program ahead of time, often into machine code. The resulting program can then run.',[
 txt('hero','Compiler: translate first.',65,104,1100,82,48,WHITE,True),txt('sub','ONE TRANSLATION  →  A PROGRAM YOU CAN RUN',68,196,1000,30,17,CYAN,True),
 *codepanel(65,320,315,205),arrow('arrow-one',385,387,100),box('bridge',490,334,265,177,'#1a2946','#9c8bef'),txt('bridge-label','COMPILER',505,345,235,145,27,VIOLET,True,'center'),arrow('arrow-two',758,387,100),box('chip',865,334,330,177,'#123c48','#5ce6ed'),txt('chip-label','EXECUTABLE\nPROGRAM',880,347,300,145,26,CYAN,True,'center')]))
slides.append(slide(4,'Interpreter: execute at runtime','INTERPRETER',7.3,'An interpreter processes and executes instructions at runtime, as the program runs, instead of requiring a separate executable first.',[
 txt('hero','Interpreter: run the instructions.',65,104,1110,82,44,WHITE,True),txt('sub','SOURCE CODE  →  INTERPRETER  →  OUTPUT',68,196,1050,30,17,VIOLET,True),
 *codepanel(65,320,315,205),arrow('arrow-one',385,387,100,VIOLET),box('bridge',490,334,265,177,'#2a2045','#bd9cff'),txt('bridge-label','INTERPRETER',500,345,245,145,25,'#e0d0ff',True,'center'),arrow('arrow-two',758,387,100,VIOLET),box('chip',865,334,330,177,'#123c48','#5ce6ed'),txt('chip-label','OUTPUT\nHello world',880,347,300,145,26,CYAN,True,'center')]))
slides.append(slide(5,'Compare the two','SIDE BY SIDE',7.5,'Think of the difference in timing: compilation happens before execution; interpretation happens while the program is running.',[
 txt('hero','The key difference is timing.',65,102,1110,80,45,WHITE,True),
 box('left-panel',65,253,548,275,'#14233a','#4a708c'),txt('left-title','COMPILER',95,278,475,38,22,CYAN,True),txt('left-copy','Translate first.\nThen run.',95,333,470,105,36,WHITE,True),*pill('left-tag','BEFORE EXECUTION',95,461,220,CYAN,'#0e3440'),
 box('right-panel',667,253,548,275,'#241e3b','#806ca9'),txt('right-title','INTERPRETER',697,278,475,38,22,VIOLET,True),txt('right-copy','Execute code\nat runtime.',697,333,470,105,36,WHITE,True),*pill('right-tag','DURING EXECUTION',697,461,220,VIOLET,'#352b50'),txt('vs','VS',610,354,60,65,16,'#c5d2e3',True,'center')]))
slides.append(slide(6,'Examples and the real world','REAL-WORLD LANGUAGES',7.5,'C, C plus plus and Rust are commonly compiled. Python and JavaScript are often run by language runtimes. Many modern implementations combine approaches.',[
 txt('hero','The real world mixes both.',65,102,1100,80,46,WHITE,True),txt('sub','A language can have different implementations.',68,192,1030,34,19,MUTED),
 box('left-panel',65,260,548,247,'#14233a','#4a708c'),txt('left-title','COMMONLY COMPILED',95,280,475,38,17,CYAN,True),txt('left-copy','C  ·  C++  ·  Rust',95,338,470,78,34,WHITE,True),
 box('right-panel',667,260,548,247,'#241e3b','#806ca9'),txt('right-title','OFTEN RUN BY A RUNTIME',697,280,475,38,17,VIOLET,True),txt('right-copy','Python  ·  JavaScript',697,338,470,78,32,WHITE,True),
 *pill('hybrid','MODERN RUNTIMES CAN COMBINE BOTH',340,551,600,'#c9baff','#2d2447')]))
slides.append(slide(7,'The practical takeaway','WHAT TO REMEMBER',6.9,'Compiled code can offer strong performance. Interpreters and runtimes can make experimentation convenient. The right choice depends on the implementation and your needs.',[
 txt('hero','What should you remember?',65,102,1100,80,46,WHITE,True),
 box('take-one',65,260,355,260,'#132c3e','#39738a'),txt('take-num1','01',92,282,90,38,17,CYAN,True),txt('take-title1','Performance',92,329,300,43,27,WHITE,True),txt('take-copy1','Compiled code can\nrun very efficiently.',92,390,300,80,20,MUTED),
 box('take-two',463,260,355,260,'#25213e','#7664a0'),txt('take-num2','02',490,282,90,38,17,VIOLET,True),txt('take-title2','Experimentation',490,329,300,43,25,WHITE,True),txt('take-copy2','Runtimes can make\niteration convenient.',490,390,300,80,20,MUTED),
 box('take-three',861,260,354,260,'#183333','#428079'),txt('take-num3','03',888,282,90,38,17,'#7ce6cf',True),txt('take-title3','Context matters',888,329,300,43,25,WHITE,True),txt('take-copy3','Choose for the task\nand implementation.',888,390,300,80,20,MUTED)]))
slides.append(slide(8,'Recap','THE RECAP',6.5,'Compiler: translate before running. Interpreter: execute at runtime. And modern systems can use both.',[
 txt('hero','Two paths. One goal.',65,101,1100,85,53,WHITE,True),txt('sub','TURN IDEAS INTO ACTION',68,200,900,35,17,CYAN,True),
 box('left-panel',65,285,548,220,'#142b3d','#4a93a5'),txt('left-title','COMPILER',95,315,475,35,18,CYAN,True),txt('left-copy','Translate → Run',95,365,475,65,34,WHITE,True),
 box('right-panel',667,285,548,220,'#29213e','#a386c3'),txt('right-title','INTERPRETER',697,315,475,35,18,VIOLET,True),txt('right-copy','Execute at runtime',697,365,475,65,31,WHITE,True),
 *pill('hybrid','MODERN SYSTEMS CAN USE BOTH',365,550,550,'#c9baff','#2d2447')]))
now=datetime.now(timezone.utc).isoformat()
deck=PresentationModel.model_validate({'id':'pres-compiler-interpreter-explainer','title':'Compiler vs Interpreter — Animated Explainer','aspect_ratio':'16:9','folder_id':'folder-reels','created_at':now,'updated_at':now,'slides':slides}).model_dump(mode='json')
path=ROOT/'backend/storage/data'/f"{deck['id']}.json"
if path.exists(): raise SystemExit('Presentation already exists; refusing to overwrite.')
path.write_text(json.dumps(deck,indent=2,ensure_ascii=False))
(OUT/'presentation.json').write_text(json.dumps(deck,indent=2,ensure_ascii=False))
(OUT/'render.json').write_text(json.dumps({'presentation':deck,'assetBase':'','output':str(OUT/'compiler-vs-interpreter-silent-preview.mp4')}))
print(path)
print('slides:',len(slides),'seconds:',sum(s['slide_duration'] for s in slides))
