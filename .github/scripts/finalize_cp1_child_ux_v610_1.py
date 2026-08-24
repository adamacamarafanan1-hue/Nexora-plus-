from pathlib import Path
import json

p = Path('assets/js/nx-v157-primary-school-script.js')
s = p.read_text(encoding='utf-8')

if "var VERSION = 'v610.1';" in s:
    raise SystemExit('V610.1 already integrated')
if "var VERSION = 'v610';" not in s:
    raise SystemExit('Expected V610 source')

s = s.replace("/* NEXORA — École primaire interactive V610\n   Expérience CP1 enfant : audio-first, image-first, grandes zones tactiles, navigation simplifiée et pédagogie adaptative.", "/* NEXORA — École primaire interactive V610.1\n   Expérience CP1 enfant : audio-first, image-first, grandes zones tactiles, navigation simplifiée et pédagogie adaptative.", 1)
s = s.replace("if (window.__nxPrimaryExercisesV610) return;\n  window.__nxPrimaryExercisesV610 = true;\n\n  var VERSION = 'v610';", "if (window.__nxPrimaryExercisesV610_1) return;\n  window.__nxPrimaryExercisesV610_1 = true;\n\n  var VERSION = 'v610.1';", 1)
s = s.replace("'1': { label: '1ère année', subtitle: 'J’écoute, je regarde, je réponds', subjects: ['entretien','francais','maths','sciences','ecm','arts','eps'] },", "'1': { label: '1ère année', subtitle: 'J’écoute, je regarde, je réponds', subjects: ['francais','maths','sciences','ecm','arts','eps','entretien'] },", 1)

old = "var last = lastCp1Read();\n    var startIndex = last && last.subject === subject && Number(last.lesson) >= 0 && Number(last.lesson) < lessons.length ? Number(last.lesson) : 0;\n    state.readText = 'Choisis une leçon. Pour aller facilement, touche le grand bouton ' + (startIndex ? 'Continuer' : 'Commencer') + '.';"
new = "var last = lastCp1Read();\n    var hasLast = !!(last && last.subject === subject && Number(last.lesson) >= 0 && Number(last.lesson) < lessons.length);\n    var startIndex = hasLast ? Number(last.lesson) : 0;\n    state.readText = 'Choisis une leçon. Pour aller facilement, touche le grand bouton ' + (hasLast ? 'Continuer' : 'Commencer') + '.';"
if old not in s: raise SystemExit('last lesson block not found')
s = s.replace(old, new, 1)
s = s.replace("'<span>▶️</span><b>' + (startIndex ? 'Continuer' : 'Commencer') + '</b><small>", "'<span>▶️</span><b>' + (hasLast ? 'Continuer' : 'Commencer') + '</b><small>", 1)

if "if (state.level === '1') speak(ex.q);" not in s:
    raise SystemExit('question speech anchor not found')
s = s.replace("if (state.level === '1') speak(ex.q);", "if (state.level === '1') speak(state.readText);", 1)

anchor = "state.readText = msg + ' Tu as ' + state.good + ' bonnes réponses sur ' + state.list.length + '.';\n    setHeader"
insert = "state.readText = msg + ' Tu as ' + state.good + ' bonnes réponses sur ' + state.list.length + '.';\n    if (state.level === '1' && state.lesson >= 0) {\n      var cp1Lessons = CP1_LESSONS[state.subject] || [];\n      var nextLesson = score >= 60 ? Math.min(state.lesson + 1, Math.max(0, cp1Lessons.length - 1)) : state.lesson;\n      lastCp1Write(state.subject, nextLesson);\n      state.readText += score >= 60 && nextLesson !== state.lesson ? ' Bravo. La prochaine fois, tu pourras continuer avec la leçon suivante.' : ' Tu peux reprendre cette leçon pour progresser.';\n    }\n    setHeader"
if anchor not in s: raise SystemExit('result progress anchor not found')
s = s.replace(anchor, insert, 1)

p.write_text(s, encoding='utf-8')

vpath = Path('version.json')
v = json.loads(vpath.read_text(encoding='utf-8'))
v['version'] = 'V610.1'
v['message'] = "Nexora V610.1 : UX CP1 finalisee, menus audio, grandes zones tactiles, choix de reponse lus a voix haute, maths sans clavier et reprise automatique de la prochaine lecon."
v['critical'] = False
vpath.write_text(json.dumps(v, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Finalized V610.1')
