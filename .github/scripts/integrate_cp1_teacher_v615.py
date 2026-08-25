from pathlib import Path
import json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')

if "var VERSION = 'v615';" in s:
    raise SystemExit('V615 already integrated')
if "var VERSION = 'v614';" not in s:
    raise SystemExit('Expected V614 source')

s = s.replace('École primaire interactive V614', 'École primaire interactive V615', 1)
s = s.replace('if (window.__nxPrimaryExercisesV614) return;', 'if (window.__nxPrimaryExercisesV615) return;', 1)
s = s.replace('window.__nxPrimaryExercisesV614 = true;', 'window.__nxPrimaryExercisesV615 = true;', 1)
s = s.replace("var VERSION = 'v614';", "var VERSION = 'v615';", 1)

old_helper = '''  function cp1ChallengeText(lesson, ex, index) {
    var question = String((ex && ex.q) || '').trim();
    if (!lesson) return question;
    if (index === 0) {
      var rule = cp1RuleText(lesson, state.subject);
      var cue = rule || firstUsefulSentence(lesson.one);
      if (cue && normalize(question).indexOf(normalize(cue)) < 0) return cue + ' ' + question;
    }
    return question;
  }
'''
new_helper = '''  function cp1TeacherExplanation(lesson) {
    if (!lesson) return '';
    var rule = cp1RuleText(lesson, state.subject);
    if (rule) {
      return String(rule)
        .replace(/^Règle de lecture\s*:\s*/i, 'Pour lire, ')
        .replace(/^Règle de comptage\s*:\s*/i, 'Pour compter, ')
        .trim();
    }
    var simple = {
      francais: 'Écoute bien les sons et regarde les mots. Cherche doucement ce qui correspond à la consigne.',
      maths: 'Regarde bien les nombres ou les objets. Compte, compare ou réfléchis doucement avant de choisir.',
      sciences: 'Observe bien ce que tu vois. Pense à ce que tu connais dans la vie de tous les jours.',
      ecm: 'Pense à ce qui est respectueux, prudent et bon pour vivre avec les autres.',
      arts: 'Observe les formes, les couleurs, les sons ou les gestes avant de choisir.',
      eps: 'Pense au mouvement le plus sûr et à la consigne avant de répondre.',
      entretien: 'Écoute la petite situation et pense à ce que tu fais chaque jour.'
    };
    return simple[state.subject] || 'Regarde bien. Écoute bien. Puis réfléchis avant de choisir.';
  }
  function cp1ChallengeText(lesson, ex) {
    return String((ex && ex.q) || '').trim();
  }
'''
if old_helper not in s:
    raise SystemExit('cp1ChallengeText block not found')
s = s.replace(old_helper, new_helper, 1)

old_render = '''    var challengeText = state.level === '1' ? cp1ChallengeText(currentLesson, ex, state.index) : ex.q;
    state.readText = challengeText + (state.level === '1' ? spokenChoices(ex, questionChoices) : '');
'''
new_render = '''    var teacherText = state.level === '1' ? cp1TeacherExplanation(currentLesson) : '';
    var challengeText = state.level === '1' ? cp1ChallengeText(currentLesson, ex) : ex.q;
    state.readText = state.level === '1'
      ? ((teacherText ? 'Écoute bien. ' + teacherText + ' Maintenant, la question. ' : '') + challengeText + spokenChoices(ex, questionChoices))
      : challengeText;
'''
if old_render not in s:
    raise SystemExit('renderQuestion text block not found')
s = s.replace(old_render, new_render, 1)

old_html = '''<div class="nx-kid-mission">🎯 DÉFI</div>' + cp1VoiceBadge() + '<h2>' + esc(challengeText) + '</h2>'''
new_html = '''<div class="nx-kid-teacher"><b>👩🏾‍🏫 Le maître explique</b><p>' + esc(teacherText) + '</p></div><div class="nx-kid-mission">🎯 QUESTION</div>' + cp1VoiceBadge() + '<h2>' + esc(challengeText) + '</h2>'''
if old_html not in s:
    raise SystemExit('CP1 question HTML marker not found')
s = s.replace(old_html, new_html, 1)

css_marker = '''      .nx-kid-mission{display:inline-block;margin:2px auto 7px;padding:7px 13px;border-radius:999px;background:#ffe45d;color:#704d00;font-size:14px;font-weight:1000;letter-spacing:.5px}.nx-kid-question{background:#fff;border-radius:28px;padding:14px;box-shadow:0 8px 23px rgba(39,65,95,.12)}'''
css_new = '''      .nx-kid-teacher{margin:8px 0 13px;padding:14px 15px;border-radius:22px;background:linear-gradient(135deg,#fff7cb,#fffdf0);border:3px solid #ffd84a;color:#4f3b00;box-shadow:0 5px 14px rgba(130,95,0,.09)}.nx-kid-teacher b{display:block;font-size:17px;margin-bottom:6px;color:#704f00}.nx-kid-teacher p{margin:0;font-size:19px;line-height:1.48;font-weight:800}.nx-kid-mission{display:inline-block;margin:2px auto 7px;padding:7px 13px;border-radius:999px;background:#ffe45d;color:#704d00;font-size:14px;font-weight:1000;letter-spacing:.5px}.nx-kid-question{background:#fff;border-radius:28px;padding:14px;box-shadow:0 8px 23px rgba(39,65,95,.12)}'''
if css_marker not in s:
    raise SystemExit('CP1 CSS marker not found')
s = s.replace(css_marker, css_new, 1)

# Make the CP1 subtitle reflect the teacher-first question flow.
s = s.replace("'1': { label: '1ère année', subtitle: 'J’écoute, je regarde, je réponds'", "'1': { label: '1ère année', subtitle: 'J’écoute, je comprends, je réponds'", 1)

path.write_text(s, encoding='utf-8')
Path('version.json').write_text(json.dumps({
  'version': 'V615',
  'message': 'Nexora V615 : avant chaque question CP1, une explication tres simple de maitre est lue et affichee, puis la question est posee. Le micro attend la fin de la consigne et les reponses tactiles restent toujours disponibles.',
  'critical': False
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('V615 integrated')
