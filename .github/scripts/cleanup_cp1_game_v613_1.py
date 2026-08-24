from pathlib import Path
import json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')

if "var VERSION = 'v613.2';" in s:
    raise SystemExit('V613.2 already integrated')
if "var VERSION = 'v613.1';" not in s:
    raise SystemExit('Expected V613.1 source')

s = s.replace('École primaire interactive V613.1', 'École primaire interactive V613.2', 1)
s = s.replace('if (window.__nxPrimaryExercisesV613_1) return;', 'if (window.__nxPrimaryExercisesV613_2) return;', 1)
s = s.replace('window.__nxPrimaryExercisesV613_1 = true;', 'window.__nxPrimaryExercisesV613_2 = true;', 1)
s = s.replace("var VERSION = 'v613.1';", "var VERSION = 'v613.2';", 1)

# Remove diagnostic-only state left from the former explanation flow.
s = s.replace(
"var state = { level: '', subject: '', lesson: -1, phase: 0, readText: '', list: [], index: 0, good: 0, wrong: [], locked: false, diagnostic: null, diagnosticAttempt: 0, diagnosticLocked: false, diagnosticPassed: false };",
"var state = { level: '', subject: '', lesson: -1, phase: 0, readText: '', list: [], index: 0, good: 0, wrong: [], locked: false };",
1)

# Give non-numeric CP1 input exercises large clickable options instead of a keyboard.
marker = "  function spokenChoices(ex, choices) {"
helper = r'''  function cp1ClickChoices(ex) {
    var numeric = cp1NumericChoices(ex);
    if (numeric && numeric.length) return numeric;
    if (!ex || (ex.type !== 'input' && ex.type !== 'text')) return null;
    var answer = String(ex.a == null ? '' : ex.a).trim();
    if (!answer) return null;
    var vals = [answer];
    function add(v) { v = String(v || '').trim(); if (v && vals.indexOf(v) < 0) vals.push(v); }
    add(answer.replace(/[.!?]+$/,''));
    if (answer.length) add(answer.charAt(0).toLocaleLowerCase('fr-FR') + answer.slice(1));
    var words = answer.split(/\s+/);
    if (words.length > 1) add(words.slice().reverse().join(' '));
    if (vals.length < 3 && answer.length > 2) add(answer.slice(0,-1));
    if (vals.length < 3) add('Je ne sais pas encore');
    return shuffle(vals).slice(0,3);
  }

'''
if marker not in s:
    raise SystemExit('spokenChoices marker missing')
s = s.replace(marker, helper + marker, 1)

# Remove stale event branches that called deleted explanation/diagnostic functions.
for old in [
"      var startDiag = ev.target.closest('[data-start-diagnostic]'); if (startDiag) { renderCp1Diagnostic(); return; }\n",
"      var diagAns = ev.target.closest('[data-diagnostic-answer]'); if (diagAns) { answerCp1Diagnostic(diagAns.getAttribute('data-diagnostic-answer'), diagAns); return; }\n",
"      var showSecond = ev.target.closest('[data-show-second]'); if (showSecond) { state.phase = 2; renderCp1Explanation(); return; }\n",
"      var retryDiag = ev.target.closest('[data-retry-diagnostic]'); if (retryDiag) { renderCp1Diagnostic(); return; }\n",
"      var startEx = ev.target.closest('[data-start-exercises]'); if (startEx) { startCp1Exercises(); return; }\n",
]:
    s = s.replace(old, '', 1)

old_submit = """      if (ev.target.matches('[data-diagnostic-form]')) {
        ev.preventDefault();
        var dinput = ev.target.querySelector('input');
        answerCp1Diagnostic(dinput ? dinput.value : '', dinput);
        return;
      }
"""
s = s.replace(old_submit, '', 1)

# Clean start/close state references to the removed diagnostic flow.
s = s.replace("    state.diagnostic = null; state.diagnosticAttempt = 0; state.diagnosticLocked = false; state.diagnosticPassed = false;\n", '', 1)
s = s.replace("; state.diagnostic = null; state.diagnosticAttempt = 0; state.diagnosticLocked = false; state.diagnosticPassed = false;", ';', 1)

# All CP1 non-choice questions should prefer large click choices.
s = s.replace(
"var autoChoices = state.level === '1' && ex.type !== 'choice' ? cp1NumericChoices(ex) : null;",
"var autoChoices = state.level === '1' && ex.type !== 'choice' ? cp1ClickChoices(ex) : null;",
1)

# Game language everywhere in CP1.
s = s.replace("lessons.length + ' leçons · audio · images · exercices'", "lessons.length + ' défis · images · questions · jeu'", 1)
s = s.replace("'<small>Leçon ' + (startIndex + 1) + ' · '", "'<small>Défi ' + (startIndex + 1) + ' · '", 1)
s = s.replace("▶ Continuer ma leçon", "▶ Continuer mon défi", 1)
s = s.replace("La leçon suivante va commencer.", "Le défi suivant va commencer.")
s = s.replace("La prochaine leçon commence automatiquement", "Le prochain défi commence automatiquement")
s = s.replace("Refaire la leçon", "Refaire le défi")

# Header fallback is game language for CP1, while older levels keep their existing wording through explicit headers.
s = s.replace("v.querySelector('[data-subtitle]').textContent = subtitle || 'Exercices corrigés';",
              "v.querySelector('[data-subtitle]').textContent = subtitle || (state.level === '1' ? 'Défis pratiques' : 'Exercices corrigés');", 1)

path.write_text(s, encoding='utf-8')
Path('version.json').write_text(json.dumps({
  'version':'V613.2',
  'message':'Nexora V613.2 : CP1 en jeu pratique pur. Questions contextualisees, reponses tactiles y compris les anciennes saisies, ancien flux d explication retire et audio anti-repetition.',
  'critical':False
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('V613.2 finalized')
