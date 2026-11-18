import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from backend.app.models.presentation import PresentationModel
source = (ROOT / 'output/compiler-interpreter/create.py').read_text()
namespace = {'__file__': str(ROOT / 'output/compiler-interpreter/create.py')}
exec(source.split('\nslides=[]')[0], namespace)
box, txt, arrow, codepanel, pill, slide = (namespace[x] for x in ('box','txt','arrow','codepanel','pill','slide'))
CYAN, VIOLET, WHITE, MUTED = (namespace[x] for x in ('CYAN','VIOLET','WHITE','MUTED'))
extra = []
extra.append(slide(9,'Two ways to run code','A CLOSER LOOK',5.5,'Let us look more closely at the key difference: a compiler translates the program first, while an interpreter executes instructions as the program runs.',[
 txt('hero','Two ways to run code.',65,110,1100,85,52,WHITE,True),txt('sub','THE KEY DIFFERENCE IS WHEN EXECUTION HAPPENS',68,209,1050,38,17,CYAN,True),
 box('left-panel',65,295,548,215,'#142b3d','#4a93a5'),txt('left-title','COMPILER',95,320,475,35,18,CYAN,True),txt('left-copy','Translate first',95,370,475,65,36,WHITE,True),
 box('right-panel',667,295,548,215,'#29213e','#a386c3'),txt('right-title','INTERPRETER',697,320,475,35,18,VIOLET,True),txt('right-copy','Execute as it runs',697,370,475,65,33,WHITE,True)]))
extra.append(slide(10,'Compiler: whole program first','COMPILER',7.5,'A compiler generally translates the whole source program before it runs, often producing an executable. It is like translating an entire book before someone reads the translation.',[
 txt('hero','Compiler: the whole program first.',65,102,1120,85,44,WHITE,True),txt('sub','COMPLETE SOURCE CODE  →  TRANSLATE  →  RUN',68,198,1050,35,17,CYAN,True),
 *codepanel(65,320,315,205),arrow('arrow-one',385,387,100),box('bridge',490,334,265,177,'#1a2946','#9c8bef'),txt('bridge-label','COMPILER',505,345,235,145,27,VIOLET,True,'center'),arrow('arrow-two',758,387,100),box('chip',865,334,330,177,'#123c48','#5ce6ed'),txt('chip-label','EXECUTABLE\nTHEN RUN',880,347,300,145,26,CYAN,True,'center'),
 txt('analogy','LIKE TRANSLATING THE WHOLE BOOK FIRST',70,570,1050,38,16,MUTED,True)]))
extra.append(slide(11,'Interpreter: instruction by instruction','INTERPRETER',7.5,'An interpreter processes and executes instructions at runtime, often explained as line by line. Think of translating each sentence as someone reads it aloud.',[
 txt('hero','Interpreter: one instruction at a time.',65,102,1135,85,42,WHITE,True),txt('sub','READ AN INSTRUCTION  →  EXECUTE  →  CONTINUE',68,198,1050,35,17,VIOLET,True),
 *codepanel(65,320,315,205),arrow('arrow-one',385,387,100,VIOLET),box('bridge',490,334,265,177,'#2a2045','#bd9cff'),txt('bridge-label','INTERPRETER',500,345,245,145,25,'#e0d0ff',True,'center'),arrow('arrow-two',758,387,100,VIOLET),box('chip',865,334,330,177,'#123c48','#5ce6ed'),txt('chip-label','EXECUTE\nAS IT RUNS',880,347,300,145,26,CYAN,True,'center'),
 txt('analogy','LIKE TRANSLATING EACH SENTENCE AS IT IS READ',70,570,1050,38,16,MUTED,True)]))
extra.append(slide(12,'Side-by-side comparison','THE DIFFERENCE',8.0,'The compiler translates before execution, and often creates a separate executable. The interpreter processes instructions at runtime. Some errors appear only when the affected instruction is reached.',[
 txt('hero','Compare the two approaches.',65,100,1110,80,45,WHITE,True),
 box('left-panel',65,236,548,340,'#14233a','#4a708c'),txt('left-title','COMPILER',95,257,475,38,21,CYAN,True),txt('left-copy','Whole program\ntranslated first',95,310,470,90,30,WHITE,True),txt('left-detail','Often creates an executable.\nMany errors appear at compile time.',95,427,470,90,19,MUTED),
 box('right-panel',667,236,548,340,'#241e3b','#806ca9'),txt('right-title','INTERPRETER',697,257,475,38,21,VIOLET,True),txt('right-copy','Instructions executed\nat runtime',697,310,470,90,29,WHITE,True),txt('right-detail','Runs through an interpreter.\nSome errors appear when reached.',697,427,470,90,19,MUTED),txt('vs','VS',610,350,60,65,16,'#c5d2e3',True,'center')]))
extra.append(slide(13,'Examples and an important nuance','EXAMPLES & RECAP',8.5,'C, C plus plus and Rust are commonly compiled. Python and JavaScript are often run by language runtimes. Modern implementations can combine both approaches, and line by line is a simplification.',[
 txt('hero','Examples — and the nuance.',65,102,1100,80,46,WHITE,True),txt('sub','A LANGUAGE CAN HAVE DIFFERENT IMPLEMENTATIONS',68,192,1030,34,17,MUTED,True),
 box('left-panel',65,260,548,215,'#14233a','#4a708c'),txt('left-title','COMMONLY COMPILED',95,280,475,38,17,CYAN,True),txt('left-copy','C  ·  C++  ·  Rust',95,338,470,78,34,WHITE,True),
 box('right-panel',667,260,548,215,'#241e3b','#806ca9'),txt('right-title','OFTEN RUN BY A RUNTIME',697,280,475,38,17,VIOLET,True),txt('right-copy','Python  ·  JavaScript',697,338,470,78,32,WHITE,True),
 *pill('hybrid','MODERN IMPLEMENTATIONS CAN COMBINE BOTH',270,520,740,'#c9baff','#2d2447'),txt('nuance','“Line by line” is a beginner-friendly simplification.',65,580,1150,40,18,MUTED,False,'center')]))
for idx, s in enumerate(extra): s['transition_type']='morph' if idx < len(extra)-1 else 'none'
path=ROOT/'backend/storage/data/pres-compiler-interpreter-explainer.json'
data=json.loads(path.read_text())
assert len(data['slides']) == 8, 'Expected the original eight slides; no changes made.'
old=data['slides'][:]
data['slides'].extend(extra)
PresentationModel.model_validate(data)
assert data['slides'][:8] == old
path.write_text(json.dumps(data,indent=2,ensure_ascii=False))
print('Saved slides 9–13; original slides unchanged.')
