from pathlib import Path
import re, json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')

if "var VERSION = 'v613';" in s:
    raise SystemExit('V613 already integrated')
if "var VERSION = 'v612';" not in s:
    raise SystemExit('Expected V612 source')

# Version / guard
s = s.replace('École primaire interactive V612', 'École primaire interactive V613', 1)
s = s.replace('if (window.__nxPrimaryExercisesV612) return;', 'if (window.__nxPrimaryExercisesV613) return;', 1)
s = s.replace('window.__nxPrimaryExercisesV612 = true;', 'window.__nxPrimaryExercisesV613 = true;', 1)
s = s.replace("var VERSION = 'v612';", "var VERSION = 'v613';", 1)
s = s.replace('var autoTimer = null;', "var autoTimer = null;\n  var lastSpeechText = '';\n  var lastSpeechAt = 0;", 1)

# Cleaner, unique spoken choices.
s = re.sub(
    r"  function spokenChoices\(ex, choices\) \{.*?\n  \}\n",
    """  function spokenChoices(ex, choices) {
    if (!choices || !choices.length) return '';
    var seen = {}, unique = [];
    choices.forEach(function(c){ var k = normalize(c); if (!seen[k]) { seen[k] = true; unique.push(String(c)); } });
    return unique.length ? '. Choisis parmi. ' + unique.join('. ') : '';
  }
""",
    s, count=1, flags=re.S
)

# Question-first helper: the teaching cue is embedded in the first challenge, never on a separate explanation screen.
marker = '  function progressWrite(level, subject, good, total) {'
if marker not in s:
    raise SystemExit('progressWrite marker missing')
helper = r'''  function firstUsefulSentence(text) {
    var value = String(text || '').replace(/\s+/g,' ').trim();
    if (!value) return '';
    var m = value.match(/^(.{1,150}?[.!?])(?:\s|$)/);
    return (m ? m[1] : value.slice(0,150)).trim();
  }
  function cp1ChallengeText(lesson, ex, index) {
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
s = s.replace(marker, helper + marker, 1)

# Slow, clean, debounced speech. Emoji are visual and must not be read as repeated words.
old_speak = re.search(r"  function speak\(s\) \{.*?\n  \}\n", s, flags=re.S)
if not old_speak:
    raise SystemExit('speak function missing')
new_speak = r'''  function cleanSpeechText(value) {
    var text = String(value || '');
    try { text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' '); } catch (_e) {}
    text = text.replace(/[\uFE0E\uFE0F]/g,' ').replace(/\s+/g,' ').trim();
    text = text.replace(/\b([A-Za-zÀ-ÿ0-9'’_-]{2,})\b(?:[\s,;:.!\-]+\1\b){2,}/gi, '$1');
    return text;
  }
  function speak(s) {
    try {
      if (!window.speechSynthesis) return;
      var text = cleanSpeechText(s);
      if (!text) return;
      var now = Date.now();
      if (text === lastSpeechText && (now - lastSpeechAt) < 1400) return;
      lastSpeechText = text; lastSpeechAt = now;
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR'; u.rate = .72; u.pitch = .96; u.volume = 1;
      setTimeout(function(){ try { speechSynthesis.speak(u); } catch (_e) {} }, 60);
    } catch (_e) {}
  }
'''
s = s[:old_speak.start()] + new_speak + s[old_speak.end():]

# Subject and lesson labels: game/practice language, no explanation promise.
s = s.replace("state.readText = 'Tu es en ' + meta.name + '. Touche Continuer pour reprendre ta leçon, ou choisis une grande carte.';",
              "state.readText = 'Tu es en ' + meta.name + '. Choisis un défi et joue.';", 1)
s = s.replace("setHeader(meta.name, '1ère année · Écoute et avance', true);",
              "setHeader(meta.name, '1ère année · Observe, réfléchis, clique', true);", 1)
s = s.replace("lessons.length + ' leçons · audio · images · exercices'",
              "lessons.length + ' défis · images · questions · jeu'", 1)
s = s.replace("<span style=\"font-size:13px;color:#68798c\">Touche une grande leçon</span>",
              "<span style=\"font-size:13px;color:#68798c\">Choisis un défi</span>", 1)
s = s.replace("<small>🔊 Écouter et apprendre</small>", "<small>🎮 Jouer et trouver</small>")

# Clicking a CP1 lesson now opens the game immediately. No explanation/diagnostic screen.
pattern = r"  function startCp1Lesson\(index\) \{.*?\n  \}\n\n  function renderCp1Explanation\(\) \{"
match = re.search(pattern, s, flags=re.S)
if not match:
    raise SystemExit('startCp1Lesson block missing')
replacement = r'''  function startCp1Lesson(index) {
    var lessons = CP1_LESSONS[state.subject] || [];
    var i = Number(index);
    if (!isFinite(i) || i < 0 || i >= lessons.length) { renderCp1Lessons(state.subject); return; }
    state.lesson = i; state.phase = 3; state.list = []; state.index = 0; state.good = 0; state.wrong = [];
    state.diagnostic = null; state.diagnosticAttempt = 0; state.diagnosticLocked = false; state.diagnosticPassed = false;
    lastCp1Write(state.subject, i);
    startCp1Exercises();
  }

  function renderCp1Explanation() {'''
s = s[:match.start()] + replacement + s[match.end():]

# Use every lesson question, in pedagogical order; the first question is no longer consumed as a diagnostic.
s = s.replace("var practice = (lesson.ex || []).length > 1 ? (lesson.ex || []).slice(1) : (lesson.ex || []).slice();\n    state.list = shuffle(practice);",
              "var practice = (lesson.ex || []).slice();\n    state.list = practice;", 1)

# Question itself contains the learning cue.
old = """    var ex = state.list[state.index], meta = SUBJECTS[state.subject], l = LEVELS[state.level];
    var autoChoices = state.level === '1' && ex.type !== 'choice' ? cp1NumericChoices(ex) : null;
    var questionChoices = ex.type === 'choice' ? ex.choices : autoChoices;
    state.readText = ex.q + (state.level === '1' ? spokenChoices(ex, questionChoices) : '');
"""
new = """    var ex = state.list[state.index], meta = SUBJECTS[state.subject], l = LEVELS[state.level];
    var currentLesson = state.level === '1' && state.lesson >= 0 && CP1_LESSONS[state.subject] ? CP1_LESSONS[state.subject][state.lesson] : null;
    var autoChoices = state.level === '1' && ex.type !== 'choice' ? cp1NumericChoices(ex) : null;
    var questionChoices = ex.type === 'choice' ? ex.choices : autoChoices;
    var challengeText = state.level === '1' ? cp1ChallengeText(currentLesson, ex, state.index) : ex.q;
    state.readText = challengeText + (state.level === '1' ? spokenChoices(ex, questionChoices) : '');
"""
if old not in s:
    raise SystemExit('renderQuestion header block missing')
s = s.replace(old, new, 1)
s = s.replace("      var currentLesson = state.lesson >= 0 && CP1_LESSONS[state.subject] ? CP1_LESSONS[state.subject][state.lesson] : null;\n", "", 1)
s = s.replace("<h2>' + esc(ex.q) + '</h2>", "<div class=\"nx-kid-mission\">🎯 DÉFI</div><h2>' + esc(challengeText) + '</h2>", 1)

# Oral correction is intentionally short; detailed why remains visual for the parent/teacher and child who can read it.
old_feedback_voice = "state.readText = ok ? ('Bravo. Bonne réponse. ' + ex.why) : ('La bonne réponse est ' + ex.a + '. ' + ex.why); speak(state.readText); scheduleNext(nextQuestion, ok?1700:2800); return;"
new_feedback_voice = "state.readText = ok ? 'Bravo !' : ('La bonne réponse est ' + ex.a + '.'); speak(state.readText); scheduleNext(nextQuestion, ok?1400:2300); return;"
if old_feedback_voice not in s:
    raise SystemExit('CP1 feedback voice block missing')
s = s.replace(old_feedback_voice, new_feedback_voice, 1)

# Game-first styling.
css_marker = "      .nx-kid-question{background:#fff;border-radius:28px;padding:14px;box-shadow:0 8px 23px rgba(39,65,95,.12)}"
if css_marker not in s:
    raise SystemExit('CP1 CSS marker missing')
s = s.replace(css_marker,
              "      .nx-kid-mission{display:inline-block;margin:2px auto 7px;padding:7px 13px;border-radius:999px;background:#ffe45d;color:#704d00;font-size:14px;font-weight:1000;letter-spacing:.5px}.nx-kid-question{background:#fff;border-radius:28px;padding:14px;box-shadow:0 8px 23px rgba(39,65,95,.12)}",
              1)

path.write_text(s, encoding='utf-8')
Path('version.json').write_text(json.dumps({
  'version':'V613',
  'message':'Nexora V613 : CP1 transforme en jeu de pratique. Plus d ecran d explication avant les questions ; chaque defi enseigne par la question, audio nettoye et sans repetitions d emoji.',
  'critical':False
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('V613 integrated')
