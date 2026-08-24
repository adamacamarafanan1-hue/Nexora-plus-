from pathlib import Path
import re, json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')
if "var VERSION = 'v613.1';" in s:
    raise SystemExit('V613.1 already integrated')
if "var VERSION = 'v613';" not in s:
    raise SystemExit('Expected V613 source')

s = s.replace('École primaire interactive V613', 'École primaire interactive V613.1', 1)
s = s.replace('if (window.__nxPrimaryExercisesV613) return;', 'if (window.__nxPrimaryExercisesV613_1) return;', 1)
s = s.replace('window.__nxPrimaryExercisesV613 = true;', 'window.__nxPrimaryExercisesV613_1 = true;', 1)
s = s.replace("var VERSION = 'v613';", "var VERSION = 'v613.1';", 1)

# Remove old explanation + diagnostic functions entirely: CP1 is now question-first only.
pat = r"\n  function renderCp1Explanation\(\) \{.*?(?=\n  function startCp1Exercises\(\) \{)"
m = re.search(pat, s, flags=re.S)
if not m:
    raise SystemExit('Old explanation/diagnostic block not found')
s = s[:m.start()] + '\n' + s[m.end():]

# Subject copy now reflects the game model.
s = s.replace("'<p>' + lessons.length + ' leçons · audio · images · exercices</p>'",
              "'<p>' + lessons.length + ' défis · images · questions · jeu</p>'", 1)
s = s.replace("'Leçon ' + (startIndex + 1) + ' · ' + esc(lessons[startIndex].title)",
              "'Défi ' + (startIndex + 1) + ' · ' + esc(lessons[startIndex].title)", 1)
s = s.replace("aria-label=\"Leçon ' + (i+1) + '. '", "aria-label=\"Défi ' + (i+1) + '. '", 1)

# Don't speak visual-only choices (emoji/symbol collections). They are meant to be seen, not verbalized repeatedly.
old_choices = "choices.forEach(function(c){ var k = normalize(c); if (!seen[k]) { seen[k] = true; unique.push(String(c)); } });"
new_choices = "choices.forEach(function(c){ var raw = String(c); if (!/[A-Za-zÀ-ÿ0-9]/.test(raw)) return; var k = normalize(raw); if (!seen[k]) { seen[k] = true; unique.push(raw); } });"
if old_choices not in s:
    raise SystemExit('spokenChoices body missing')
s = s.replace(old_choices, new_choices, 1)

# CP1 question screen: challenge text is displayed, not the raw question; simplify progression to game-only.
s = s.replace("setHeader(meta.name, state.level === '1' && state.lesson >= 0 ? ('Exercice ' + (state.index+1) + ' sur ' + state.list.length) : l.label, true);",
              "setHeader(meta.name, state.level === '1' && state.lesson >= 0 ? ('Défi ' + (state.index+1) + ' sur ' + state.list.length) : l.label, true);", 1)
old_html = "var html = '<div class=\"nx-kid-flow\"><span class=\"on\">✓</span><i class=\"on\"></i><span class=\"on\">✓</span><i class=\"on\"></i><span class=\"on\">' + (state.index+1) + '</span><i></i><span>★</span></div><section class=\"nx-kid-question\">' + (currentLesson ? cp1Scene(currentLesson,state.subject,false) : '') + '<div style=\"height:8px;background:#e5edf4;border-radius:10px;overflow:hidden;margin:2px 3px 12px\"><div style=\"height:100%;width:' + pct + '%;background:linear-gradient(90deg,#53ca36,#ffd234);border-radius:10px\"></div></div><h2>' + esc(ex.q) + '</h2>';"
new_html = "var html = '<div class=\"nx-kid-flow\"><span class=\"on\">🎯</span><i class=\"on\"></i><span class=\"on\">' + (state.index+1) + '</span><i></i><span>★</span></div><section class=\"nx-kid-question\">' + (currentLesson ? cp1Scene(currentLesson,state.subject,false) : '') + '<div style=\"height:8px;background:#e5edf4;border-radius:10px;overflow:hidden;margin:2px 3px 12px\"><div style=\"height:100%;width:' + pct + '%;background:linear-gradient(90deg,#53ca36,#ffd234);border-radius:10px\"></div></div><div class=\"nx-kid-mission\">🎯 DÉFI</div><h2>' + esc(challengeText) + '</h2>';"
if old_html not in s:
    raise SystemExit('CP1 question HTML block missing')
s = s.replace(old_html, new_html, 1)

path.write_text(s, encoding='utf-8')
Path('version.json').write_text(json.dumps({
  'version':'V613.1',
  'message':'Nexora V613.1 : CP1 100% pratique par defis. Anciennes explications retirees du moteur actif, questions contextualisees, audio anti-repetition et progression de jeu simplifiee.',
  'critical':False
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('V613.1 cleaned')
