from pathlib import Path
import json

p = Path('assets/js/nx-v157-primary-school-script.js')
s = p.read_text(encoding='utf-8')

if "var VERSION = 'v610.2';" in s:
    raise SystemExit('V610.2 already integrated')
if "var VERSION = 'v610.1';" not in s:
    raise SystemExit('Expected V610.1 source')

old = "html += '<button type=\"button\" class=\"nx-px-start\" data-lesson=\"' + startIndex + '\"><span>▶️</span><b>' + (startIndex ? 'Continuer' : 'Commencer') + '</b><small>Leçon ' + (startIndex + 1) + ' · ' + esc(lessons[startIndex].title) + '</small></button>';"
new = "html += '<button type=\"button\" class=\"nx-px-start\" data-lesson=\"' + startIndex + '\"><span>▶️</span><b>' + (hasLast ? 'Continuer' : 'Commencer') + '</b><small>Leçon ' + (startIndex + 1) + ' · ' + esc(lessons[startIndex].title) + '</small></button>';"
if old not in s:
    raise SystemExit('Resume label anchor not found')
s = s.replace(old, new, 1)
s = s.replace("/* NEXORA — École primaire interactive V610.1", "/* NEXORA — École primaire interactive V610.2", 1)
s = s.replace("if (window.__nxPrimaryExercisesV610_1) return;\n  window.__nxPrimaryExercisesV610_1 = true;\n\n  var VERSION = 'v610.1';", "if (window.__nxPrimaryExercisesV610_2) return;\n  window.__nxPrimaryExercisesV610_2 = true;\n\n  var VERSION = 'v610.2';", 1)
p.write_text(s, encoding='utf-8')

vpath = Path('version.json')
v = json.loads(vpath.read_text(encoding='utf-8'))
v['version'] = 'V610.2'
v['message'] = "Nexora V610.2 : UX CP1 enfant finalisee, audio des menus et choix, grandes zones tactiles, maths sans clavier, reprise fiable et progression automatique des lecons."
v['critical'] = False
vpath.write_text(json.dumps(v, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Finalized V610.2')
