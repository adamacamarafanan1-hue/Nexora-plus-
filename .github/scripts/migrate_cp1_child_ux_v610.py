from pathlib import Path
import re, json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')

if "var VERSION = 'v610';" in s:
    raise SystemExit('V610 already integrated')
if "var VERSION = 'v609';" not in s:
    raise SystemExit('Expected V609 source')

s = s.replace("/* NEXORA — École primaire interactive V609\n   Pédagogie CP1 adaptative : audio, illustration, explication simple, petit essai, aide ciblée puis exercices corrigés.", "/* NEXORA — École primaire interactive V610\n   Expérience CP1 enfant : audio-first, image-first, grandes zones tactiles, navigation simplifiée et pédagogie adaptative.", 1)
s = s.replace("if (window.__nxPrimaryExercisesV609) return;\n  window.__nxPrimaryExercisesV609 = true;\n\n  var VERSION = 'v609';", "if (window.__nxPrimaryExercisesV610) return;\n  window.__nxPrimaryExercisesV610 = true;\n\n  var VERSION = 'v610';", 1)
s = s.replace("var STORAGE = 'nexora.primary.exercises.v600.progress';", "var STORAGE = 'nexora.primary.exercises.v600.progress';\n  var LAST_CP1 = 'nexora.primary.cp1.last.v610';", 1)
s = s.replace("'1': { label: '1ère année', subtitle: 'Je comprends deux fois, puis je m’exerce', subjects: ['entretien','francais','maths','sciences','ecm','arts','eps'] },", "'1': { label: '1ère année', subtitle: 'J’écoute, je regarde, je réponds', subjects: ['entretien','francais','maths','sciences','ecm','arts','eps'] },", 1)

insert_after = "  function progressWrite(level, subject, good, total) {"
idx = s.index(insert_after)
# place helpers before progressWrite
helpers = '''  function lastCp1Read() {\n    try { var x = JSON.parse(localStorage.getItem(LAST_CP1) || 'null'); return x && typeof x === 'object' ? x : null; }\n    catch (_e) { return null; }\n  }\n  function lastCp1Write(subject, lesson) {\n    try { localStorage.setItem(LAST_CP1, JSON.stringify({ subject: subject, lesson: lesson, updated_at: new Date().toISOString() })); }\n    catch (_e) {}\n  }\n  function cp1NumericChoices(ex) {\n    if (!ex || ex.type !== 'input') return null;\n    var raw = String(ex.a == null ? '' : ex.a).replace(',', '.');\n    var value = Number(raw);\n    if (!isFinite(value) || Math.floor(value) !== value || value < 0 || value > 100) return null;\n    var vals = [value];\n    var candidates = [value - 1, value + 1, value - 2, value + 2, value + 3];\n    for (var i = 0; i < candidates.length && vals.length < 3; i++) {\n      if (candidates[i] >= 0 && vals.indexOf(candidates[i]) < 0) vals.push(candidates[i]);\n    }\n    return shuffle(vals.map(String));\n  }\n  function spokenChoices(ex, choices) {\n    if (!choices || !choices.length) return '';\n    return '. Réponses possibles. ' + choices.join('. ');\n  }\n\n'''
s = s[:idx] + helpers + s[idx:]

# Replace renderCp1Lessons
pattern = re.compile(r"  function renderCp1Lessons\(subject\) \{.*?\n  \}\n\n  function startCp1Lesson", re.S)
replacement = '''  function renderCp1Lessons(subject) {\n    var meta = SUBJECTS[subject], lessons = CP1_LESSONS[subject] || [];\n    state.subject = subject; state.lesson = -1; state.phase = 0;\n    state.list = []; state.index = 0; state.good = 0; state.wrong = [];\n    var last = lastCp1Read();\n    var startIndex = last && last.subject === subject && Number(last.lesson) >= 0 && Number(last.lesson) < lessons.length ? Number(last.lesson) : 0;\n    state.readText = 'Choisis une leçon. Pour aller facilement, touche le grand bouton ' + (startIndex ? 'Continuer' : 'Commencer') + '.';\n    setHeader(meta.name, '1ère année · Écoute et touche', true);\n    var html = '<section class="nx-px-hero nx-px-child-hero"><h2>' + esc(meta.icon + ' ' + meta.name) + '</h2><p>Écoute puis touche une grande carte.</p></section>';\n    if (lessons.length) {\n      html += '<button type="button" class="nx-px-start" data-lesson="' + startIndex + '"><span>▶️</span><b>' + (startIndex ? 'Continuer' : 'Commencer') + '</b><small>Leçon ' + (startIndex + 1) + ' · ' + esc(lessons[startIndex].title) + '</small></button>';\n    }\n    html += '<div class="nx-px-grid nx-px-lesson-grid">';\n    lessons.forEach(function (lesson, i) {\n      html += '<button type="button" class="nx-px-card nx-px-child-card" data-lesson="' + i + '" aria-label="Leçon ' + (i + 1) + '. ' + esc(lesson.title) + '">' +\n        '<span class="nx-px-thumb" aria-hidden="true">' + esc(lesson.visual || meta.icon) + '</span>' +\n        '<strong>Leçon ' + (i + 1) + '</strong><span class="nx-px-lesson-title">' + esc(lesson.title) + '</span>' +\n        '<small>🔊 Écouter et apprendre</small></button>';\n    });\n    html += '</div>';\n    main().innerHTML = html;\n    setTimeout(function () { speak(state.readText); }, 180);\n  }\n\n  function startCp1Lesson'''
s, n = pattern.subn(replacement, s, count=1)
if n != 1: raise SystemExit('renderCp1Lessons replacement failed')

# Save current lesson when opened
s = s.replace("state.lesson = i; state.phase = 1; state.list = []; state.index = 0; state.good = 0; state.wrong = [];\n    state.diagnostic", "state.lesson = i; state.phase = 1; state.list = []; state.index = 0; state.good = 0; state.wrong = [];\n    lastCp1Write(state.subject, i);\n    state.diagnostic", 1)

# Replace renderLevels
pattern = re.compile(r"  function renderLevels\(\) \{.*?\n  \}\n\n  function renderSubjects", re.S)
replacement = '''  function renderLevels() {\n    state.level = ''; state.subject = ''; state.lesson = -1; state.phase = 0; state.list = []; state.index = 0;\n    state.readText = 'Bonjour. Choisis ta classe. Pour la première année, touche le grand numéro 1.';\n    setHeader('École primaire', 'Écoute puis touche ta classe', false);\n    var p = progressRead();\n    var badges = { '1':'1️⃣', '2':'2️⃣', '3':'3️⃣', '4':'4️⃣', '5':'5️⃣', '6':'6️⃣' };\n    var html = '<section class="nx-px-hero nx-px-child-hero"><h2>🎒 Choisis ta classe</h2><p>Écoute. Puis touche le grand numéro de ta classe.</p></section><div class="nx-px-grid">';\n    Object.keys(LEVELS).forEach(function (k) {\n      var l = LEVELS[k], vals = [], total = 0;\n      l.subjects.forEach(function (sub) { var x = p[k + ':' + sub]; if (x && typeof x.best === 'number') { vals.push(x.best); total += x.best; } });\n      var avg = vals.length ? Math.round(total / vals.length) : null;\n      html += '<button type="button" class="nx-px-card nx-px-level-card" data-level="' + k + '"><em>' + badges[k] + '</em><strong>' + esc(l.label) + '</strong><small>' + esc(l.subtitle) + '</small>' + (avg != null ? '<div class="nx-px-progress">Niveau : ' + avg + '%</div>' : '') + '</button>';\n    });\n    html += '</div>';\n    main().innerHTML = html;\n    setTimeout(function () { speak(state.readText); }, 180);\n  }\n\n  function renderSubjects'''
s, n = pattern.subn(replacement, s, count=1)
if n != 1: raise SystemExit('renderLevels replacement failed')

# Replace renderSubjects
pattern = re.compile(r"  function renderSubjects\(\) \{.*?\n  \}\n\n  function startSubject", re.S)
replacement = '''  function renderSubjects() {\n    var l = LEVELS[state.level]; if (!l) { renderLevels(); return; }\n    state.subject = ''; state.lesson = -1; state.phase = 0; state.list = []; state.index = 0;\n    state.readText = state.level === '1' ? 'Choisis ta matière. Touche une grande image. Français. Mathématiques. Sciences. Éducation civique. Arts. Sport. Entretien du matin.' : '';\n    setHeader(l.label, state.level === '1' ? 'Écoute puis touche une matière' : 'Choisis une matière', true);\n    var p = progressRead();\n    var html = '<section class="nx-px-hero' + (state.level === '1' ? ' nx-px-child-hero' : '') + '"><h2>' + esc(l.label) + '</h2><p>' + (state.level === '1' ? 'Écoute. Puis touche une grande image.' : 'Choisis une matière pour commencer les exercices.') + '</p></section><div class="nx-px-grid">';\n    l.subjects.forEach(function (sub) {\n      var meta = SUBJECTS[sub], bank = build(state.level, sub), pr = p[state.level + ':' + sub];\n      html += '<button type="button" class="nx-px-card' + (state.level === '1' ? ' nx-px-subject-card' : '') + '" data-subject="' + sub + '"><em>' + meta.icon + '</em><strong>' + esc(meta.name) + '</strong><small>' + (state.level === '1' ? 'Touche pour ouvrir' : bank.length + ' exercices par série') + '</small>' + (pr ? '<div class="nx-px-progress">Meilleur score : ' + (pr.best || 0) + '%</div>' : '') + '</button>';\n    });\n    html += '</div>';\n    main().innerHTML = html;\n    if (state.level === '1') setTimeout(function () { speak(state.readText); }, 180);\n  }\n\n  function startSubject'''
s, n = pattern.subn(replacement, s, count=1)
if n != 1: raise SystemExit('renderSubjects replacement failed')

# Diagnostic: spoken choices + numeric buttons
s = s.replace("state.phase = 10; state.diagnosticLocked = false; state.readText = 'Petit essai. ' + ex.q;", "state.phase = 10; state.diagnosticLocked = false;\n    var diagChoices = ex.type === 'choice' ? ex.choices : cp1NumericChoices(ex);\n    state.readText = 'Petit essai. ' + ex.q + spokenChoices(ex, diagChoices);", 1)
s = s.replace("if (ex.type === 'choice') {\n      html += '<div class=\"nx-px-choices\">' + ex.choices.map(function (c) { return '<button type=\"button\" class=\"nx-px-answer\" data-diagnostic-answer=\"' + esc(c) + '\">' + esc(c) + '</button>'; }).join('') + '</div>';\n    } else {", "if (diagChoices && diagChoices.length) {\n      html += '<div class=\"nx-px-choices\">' + diagChoices.map(function (c) { return '<button type=\"button\" class=\"nx-px-answer nx-px-big-answer\" data-diagnostic-answer=\"' + esc(c) + '\">' + esc(c) + '</button>'; }).join('') + '</div>';\n    } else {", 1)

# Standard question: spoken choices + numeric buttons
s = s.replace("state.readText = ex.q;\n    setHeader(meta.name", "var autoChoices = state.level === '1' && ex.type !== 'choice' ? cp1NumericChoices(ex) : null;\n    var questionChoices = ex.type === 'choice' ? ex.choices : autoChoices;\n    state.readText = ex.q + (state.level === '1' ? spokenChoices(ex, questionChoices) : '');\n    setHeader(meta.name", 1)
s = s.replace("if (ex.type === 'choice') {\n      html += '<div class=\"nx-px-choices\">' + ex.choices.map(function (c) { return '<button type=\"button\" class=\"nx-px-answer\" data-answer=\"' + esc(c) + '\">' + esc(c) + '</button>'; }).join('') + '</div>';\n    } else {", "if (questionChoices && questionChoices.length) {\n      html += '<div class=\"nx-px-choices\">' + questionChoices.map(function (c) { return '<button type=\"button\" class=\"nx-px-answer' + (state.level === '1' ? ' nx-px-big-answer' : '') + '\" data-answer=\"' + esc(c) + '\">' + esc(c) + '</button>'; }).join('') + '</div>';\n    } else {", 1)

# Header explicit back label
s = s.replace("<button type=\"button\" data-back aria-label=\"Retour\">‹</button>", "<button type=\"button\" class=\"nx-px-back\" data-back aria-label=\"Retour\">← Retour</button>", 1)

# Result speaks itself
s = s.replace("var msg = score >= 80 ? 'Très bien !' : score >= 60 ? 'Bon travail. Continue.' : 'Tu progresses. Reprends les erreurs.';\n    setHeader", "var msg = score >= 80 ? 'Très bien !' : score >= 60 ? 'Bon travail. Continue.' : 'Tu progresses. Reprends les erreurs.';\n    state.readText = msg + ' Tu as ' + state.good + ' bonnes réponses sur ' + state.list.length + '.';\n    setHeader", 1)
s = s.replace("main().innerHTML = '<section class=\"nx-px-result\">", "main().innerHTML = '<section class=\"nx-px-result\">", 1)
# add speak after renderResult innerHTML using unique following marker
s = s.replace("</div></section>';\n  }\n\n  function retryWrong()", "</div></section>';\n    if (state.level === '1') speak(state.readText);\n  }\n\n  function retryWrong()", 1)

# Add child UX CSS before media rule
css_anchor = "      '@media(max-width:520px){.nx-px-grid{grid-template-columns:1fr}.nx-px-main{padding:14px 11px 32px}.nx-px-q{font-size:20px}.nx-px-card{min-height:92px}}'"
css_repl = "      '.nx-px-back{min-width:92px!important;padding:0 11px!important;font-size:14px!important;font-weight:850}.nx-px-child-hero{text-align:center}.nx-px-level-card,.nx-px-subject-card,.nx-px-child-card{touch-action:manipulation;cursor:pointer}.nx-px-level-card em,.nx-px-subject-card em{font-size:44px}.nx-px-subject-card{min-height:145px;text-align:center}.nx-px-subject-card strong{font-size:19px}.nx-px-thumb{display:flex;align-items:center;justify-content:center;min-height:64px;max-height:76px;overflow:hidden;margin:-2px 0 8px;padding:8px;border-radius:12px;background:#f0f6ff;font-size:30px;line-height:1.3;white-space:pre-line}.nx-px-lesson-title{display:block;font-size:16px;line-height:1.35;color:#233447;margin:4px 0 8px}.nx-px-start{width:100%;min-height:86px;border:0;border-radius:18px;background:#173a63;color:#fff;padding:14px 16px;margin:0 0 14px;text-align:left;font:inherit;box-shadow:0 5px 16px rgba(23,58,99,.16);touch-action:manipulation}.nx-px-start>span{font-size:28px;float:left;margin-right:12px}.nx-px-start b{display:block;font-size:20px}.nx-px-start small{display:block;margin-top:4px;font-size:13px;opacity:.9}.nx-px-big-answer{min-height:64px!important;font-size:19px!important;text-align:center!important}.nx-px-next,.nx-px-listen{min-height:58px;touch-action:manipulation}.nx-px-card:active,.nx-px-answer:active,.nx-px-next:active,.nx-px-start:active{transform:scale(.985)}',\n      '@media(max-width:520px){.nx-px-grid{grid-template-columns:1fr}.nx-px-main{padding:14px 11px 32px}.nx-px-q{font-size:20px}.nx-px-card{min-height:110px}.nx-px-subject-card{min-height:128px}.nx-px-child-card{min-height:138px}.nx-px-top{gap:6px}.nx-px-back{min-width:84px!important;font-size:13px!important}}'"
if css_anchor not in s: raise SystemExit('CSS anchor missing')
s = s.replace(css_anchor, css_repl, 1)

# Update version.json
vpath = Path('version.json')
v = json.loads(vpath.read_text(encoding='utf-8'))
v['version'] = 'V610'
v['message'] = "Nexora V610 : CP1 UX enfant audio-first et image-first, navigation par grandes cartes, choix lus a voix haute, reponses numeriques sans clavier et reprise rapide de la lecon."
v['critical'] = False
vpath.write_text(json.dumps(v, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

path.write_text(s, encoding='utf-8')
print('Integrated V610 child-first CP1 UX')
