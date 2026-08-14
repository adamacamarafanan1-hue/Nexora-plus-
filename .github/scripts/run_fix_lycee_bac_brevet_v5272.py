from pathlib import Path
import runpy

path = Path('assets/js/nexora-secure-v525.js')
text = path.read_text(encoding='utf-8')

single = "    var response=await nxSecureFetchV506('/api/secure-content',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({content_version:VERSION,path:path})});"
multiline = """    var response=await nxSecureFetchV506('/api/secure-content',{
      method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({content_version:VERSION,path:path})
    });"""

if single in text:
    text = text.replace(single, multiline, 1)
    path.write_text(text, encoding='utf-8')
elif multiline not in text and 'response&&response.status===401' not in text:
    raise SystemExit('Bloc /api/secure-content réel introuvable')

runpy.run_path('.github/scripts/fix_lycee_bac_brevet_v5272.py', run_name='__main__')
