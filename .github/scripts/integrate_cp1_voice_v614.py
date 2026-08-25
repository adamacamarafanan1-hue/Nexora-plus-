from pathlib import Path
import re, json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')

if "var VERSION = 'v614';" in s:
    raise SystemExit('V614 already integrated')
if "var VERSION = 'v613.2';" not in s:
    raise SystemExit('Expected V613.2 source')

s = s.replace('École primaire interactive V613.2', 'École primaire interactive V614', 1)
s = s.replace('if (window.__nxPrimaryExercisesV613_2) return;', 'if (window.__nxPrimaryExercisesV614) return;', 1)
s = s.replace('window.__nxPrimaryExercisesV613_2 = true;', 'window.__nxPrimaryExercisesV614 = true;', 1)
s = s.replace("var VERSION = 'v613.2';", "var VERSION = 'v614';", 1)
s = s.replace("  var lastSpeechAt = 0;\n", "  var lastSpeechAt = 0;\n  var recognition = null;\n  var voiceMode = false;\n  var voiceListening = false;\n  var voiceAwaitingAnswer = false;\n  var voiceRestartTimer = null;\n", 1)

marker = "  function clearAuto() {"
if marker not in s:
    raise SystemExit('clearAuto marker missing')
voice_helpers = r'''  function voiceCanonical(value) {
    var n = normalize(value);
    var nums = {
      'zero':'0','un':'1','une':'1','deux':'2','trois':'3','quatre':'4','cinq':'5','six':'6','sept':'7','huit':'8','neuf':'9','dix':'10',
      'onze':'11','douze':'12','treize':'13','quatorze':'14','quinze':'15','seize':'16','dix sept':'17','dix-huit':'18','dix huit':'18',
      'dix neuf':'19','dix-neuf':'19','vingt':'20'
    };
    return nums[n] || n;
  }
  function voiceSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  function cp1VoiceControl() {
    var supported = voiceSupported();
    var label = voiceMode ? '🎤 Mode vocal activé' : '🎤 Activer le mode vocal';
    var sub = voiceMode ? 'Nexora écoutera après chaque question. Le clic reste disponible.' : (supported ? 'Le parent active une seule fois pour toute la séance.' : 'Mode vocal non disponible sur ce navigateur. Le clic reste disponible.');
    return '<button type="button" class="nx-kid-voice-toggle ' + (voiceMode ? 'on' : '') + '" data-voice-toggle ' + (supported ? '' : 'disabled') + '><b>' + label + '</b><small>' + sub + '</small></button>';
  }
  function cp1VoiceBadge() {
    if (!voiceMode) return '';
    return '<div class="nx-kid-voice-live" data-voice-status>🎤 ' + (voiceListening ? 'Je t’écoute…' : 'Mode vocal prêt') + '</div>';
  }
  function updateVoiceUI() {
    if (!viewer) return;
    var headerBtn = viewer.querySelector('[data-voice-header]');
    if (headerBtn) {
      headerBtn.style.visibility = state.level === '1' ? 'visible' : 'hidden';
      headerBtn.textContent = voiceMode ? '🎤✓' : '🎤';
      headerBtn.setAttribute('aria-label', voiceMode ? 'Désactiver le mode vocal' : 'Activer le mode vocal');
      headerBtn.classList.toggle('on', voiceMode);
    }
    var controls = viewer.querySelectorAll('.nx-kid-voice-toggle[data-voice-toggle]');
    Array.prototype.forEach.call(controls, function(btn){
      btn.classList.toggle('on', voiceMode);
      var b = btn.querySelector('b'), sm = btn.querySelector('small');
      if (b) b.textContent = voiceMode ? '🎤 Mode vocal activé' : '🎤 Activer le mode vocal';
      if (sm) sm.textContent = voiceMode ? 'Nexora écoutera après chaque question. Le clic reste disponible.' : 'Le parent active une seule fois pour toute la séance.';
    });
    var status = viewer.querySelector('[data-voice-status]');
    if (status) status.textContent = voiceListening ? '🎤 Je t’écoute…' : '🎤 Mode vocal prêt';
  }
  function stopVoiceListening() {
    if (voiceRestartTimer) { clearTimeout(voiceRestartTimer); voiceRestartTimer = null; }
    if (recognition && voiceListening) {
      try { recognition.stop(); } catch (_e) {}
    }
    voiceListening = false;
    updateVoiceUI();
  }
  function scheduleVoiceListen(ms) {
    if (!voiceMode || !voiceAwaitingAnswer || state.level !== '1') return;
    if (voiceRestartTimer) clearTimeout(voiceRestartTimer);
    voiceRestartTimer = setTimeout(function(){ voiceRestartTimer = null; startVoiceListening(); }, ms || 350);
  }
  function ensureRecognition() {
    if (recognition) return recognition;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    recognition = new SR();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onstart = function(){ voiceListening = true; updateVoiceUI(); };
    recognition.onend = function(){
      voiceListening = false; updateVoiceUI();
      if (voiceMode && voiceAwaitingAnswer && viewer && !viewer.hidden) scheduleVoiceListen(420);
    };
    recognition.onerror = function(ev){
      voiceListening = false; updateVoiceUI();
      if (ev && (ev.error === 'not-allowed' || ev.error === 'service-not-allowed')) {
        voiceMode = false; voiceAwaitingAnswer = false; updateVoiceUI();
      }
    };
    recognition.onresult = function(ev){
      if (!voiceMode || !voiceAwaitingAnswer || state.level !== '1' || state.locked) return;
      var candidates = [];
      try {
        var result = ev.results[ev.resultIndex || 0];
        for (var i = 0; result && i < result.length; i++) candidates.push(result[i].transcript || '');
      } catch (_e) {}
      handleVoiceAnswer(candidates);
    };
    return recognition;
  }
  function startVoiceListening() {
    if (!voiceMode || !voiceAwaitingAnswer || state.level !== '1' || state.locked || !viewer || viewer.hidden) return;
    if (window.speechSynthesis && speechSynthesis.speaking) { scheduleVoiceListen(450); return; }
    var r = ensureRecognition();
    if (!r || voiceListening) return;
    try { r.start(); } catch (_e) { scheduleVoiceListen(650); }
  }
  function handleVoiceAnswer(candidates) {
    if (!state.list.length || state.index >= state.list.length || state.locked) return;
    var ex = state.list[state.index];
    var choices = ex.type === 'choice' ? (ex.choices || []) : (cp1ClickChoices(ex) || []);
    var selected = null;
    for (var ci = 0; ci < candidates.length && selected == null; ci++) {
      var heard = voiceCanonical(candidates[ci]);
      if (!heard) continue;
      if (heard === 'repete' || heard === 'repeter' || heard === 'encore') { speakCurrent(); return; }
      for (var i = 0; i < choices.length; i++) {
        if (voiceCanonical(choices[i]) === heard) { selected = String(choices[i]); break; }
      }
      if (selected == null && voiceCanonical(ex.a) === heard) selected = String(ex.a);
    }
    if (selected != null) {
      voiceAwaitingAnswer = false; stopVoiceListening(); answer(selected, null); return;
    }
    voiceAwaitingAnswer = false; stopVoiceListening();
    speak('Je n’ai pas compris. Réponds encore, ou touche une réponse.');
  }
  function enableVoiceMode() {
    if (!voiceSupported()) { voiceMode = false; updateVoiceUI(); return; }
    var activate = function(){
      voiceMode = true; updateVoiceUI();
      if (state.level === '1' && state.list.length && state.index < state.list.length && !state.locked) {
        voiceAwaitingAnswer = true;
        speak('Mode vocal activé. Je vais écouter ta réponse après la question.');
      } else {
        speak('Mode vocal activé. Tu peux répondre à voix haute ou toucher une réponse.');
      }
    };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
        try { stream.getTracks().forEach(function(t){ t.stop(); }); } catch (_e) {}
        activate();
      }).catch(function(){ voiceMode = false; updateVoiceUI(); speak('Le microphone n’est pas autorisé. Tu peux toujours répondre en touchant les boutons.'); });
    } else activate();
  }
  function toggleVoiceMode() {
    if (voiceMode) {
      voiceMode = false; voiceAwaitingAnswer = false; stopVoiceListening(); updateVoiceUI();
      speak('Mode vocal désactivé. Tu peux continuer avec les boutons.');
    } else enableVoiceMode();
  }

'''
s = s.replace(marker, voice_helpers + marker, 1)

# Make TTS and recognition take turns so Nexora does not hear its own voice.
speak_pat = r"  function speak\(s\) \{.*?\n  \}\n\n  var LEVELS"
m = re.search(speak_pat, s, flags=re.S)
if not m:
    raise SystemExit('speak block missing')
old = m.group(0)
new = r'''  function speak(s) {
    try {
      if (!window.speechSynthesis) return;
      var text = cleanSpeechText(s);
      if (!text) return;
      var now = Date.now();
      if (text === lastSpeechText && (now - lastSpeechAt) < 1400) return;
      lastSpeechText = text; lastSpeechAt = now;
      stopVoiceListening();
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR'; u.rate = .72; u.pitch = .96; u.volume = 1;
      u.onend = function(){ if (voiceMode && voiceAwaitingAnswer) scheduleVoiceListen(380); };
      u.onerror = function(){ if (voiceMode && voiceAwaitingAnswer) scheduleVoiceListen(520); };
      setTimeout(function(){ try { speechSynthesis.speak(u); } catch (_e) { if (voiceMode && voiceAwaitingAnswer) scheduleVoiceListen(520); } }, 60);
    } catch (_e) {}
  }

  var LEVELS'''
s = s[:m.start()] + new + s[m.end():]

# Add parent voice control at the top of CP1 home.
needle = "      if (validLast) {"
if needle not in s:
    raise SystemExit('validLast marker missing')
s = s.replace(needle, "      html += cp1VoiceControl();\n" + needle, 1)

# Add a microphone button to the sticky header and keep it available only in CP1.
old_header = "<button type=\"button\" class=\"nx-px-speak\" data-speak aria-label=\"Lire\">🔊</button><button type=\"button\" data-close aria-label=\"Fermer\">✕</button>"
new_header = "<button type=\"button\" class=\"nx-px-speak\" data-speak aria-label=\"Lire\">🔊</button><button type=\"button\" class=\"nx-px-voice-header\" data-voice-toggle data-voice-header aria-label=\"Activer le mode vocal\">🎤</button><button type=\"button\" data-close aria-label=\"Fermer\">✕</button>"
if old_header not in s:
    raise SystemExit('header buttons missing')
s = s.replace(old_header, new_header, 1)

set_header_line = "    v.querySelector('[data-speak]').style.visibility = (state.readText || (state.list.length && state.index < state.list.length)) ? 'visible' : 'hidden';"
if set_header_line not in s:
    raise SystemExit('setHeader speech line missing')
s = s.replace(set_header_line, set_header_line + "\n    var vh = v.querySelector('[data-voice-header]'); if (vh) vh.style.visibility = state.level === '1' ? 'visible' : 'hidden';\n    updateVoiceUI();", 1)

# Voice-toggle click works both on large parent control and the header mic.
click_marker = "      var sp = ev.target.closest('[data-speak]'); if (sp) { speakCurrent(); return; }"
if click_marker not in s:
    raise SystemExit('click speech marker missing')
s = s.replace(click_marker, click_marker + "\n      var voiceToggle = ev.target.closest('[data-voice-toggle]'); if (voiceToggle) { toggleVoiceMode(); return; }", 1)

# Display listening status and arm recognition after question TTS ends.
q_html_old = "<div class=\"nx-kid-mission\">🎯 DÉFI</div><h2>' + esc(challengeText) + '</h2>"
q_html_new = "<div class=\"nx-kid-mission\">🎯 DÉFI</div>' + cp1VoiceBadge() + '<h2>' + esc(challengeText) + '</h2>"
if q_html_old not in s:
    raise SystemExit('question mission marker missing')
s = s.replace(q_html_old, q_html_new, 1)

render_end = "      html += '<div data-feedback></div></section>'; main().innerHTML = html; speak(state.readText); return;"
if render_end not in s:
    raise SystemExit('CP1 render end missing')
s = s.replace(render_end, "      html += '<div data-feedback></div></section>'; main().innerHTML = html; voiceAwaitingAnswer = !!voiceMode; updateVoiceUI(); speak(state.readText); return;", 1)

# Stop listening immediately when either voice or touch submits an answer.
answer_start = "    state.locked = true; if (ok) state.good++; else state.wrong.push(ex);"
if answer_start not in s:
    raise SystemExit('answer lock line missing')
s = s.replace(answer_start, "    state.locked = true; voiceAwaitingAnswer = false; stopVoiceListening(); if (ok) state.good++; else state.wrong.push(ex);", 1)

# Result/back/close must not leave microphone running.
s = s.replace("  function renderResult() {\n    clearAuto();", "  function renderResult() {\n    clearAuto(); voiceAwaitingAnswer = false; stopVoiceListening();", 1)
s = s.replace("  function goBack() {\n    clearAuto();", "  function goBack() {\n    clearAuto(); voiceAwaitingAnswer = false; stopVoiceListening();", 1)
s = s.replace("  function closeViewer() {\n    clearAuto();", "  function closeViewer() {\n    clearAuto(); voiceMode = false; voiceAwaitingAnswer = false; stopVoiceListening();", 1)

# Integrated visual states for parent activation and child listening.
css_marker = "      .nx-kid-mission{display:inline-block;margin:2px auto 7px;padding:7px 13px;border-radius:999px;background:#ffe45d;color:#704d00;font-size:14px;font-weight:1000;letter-spacing:.5px}.nx-kid-question{background:#fff;border-radius:28px;padding:14px;box-shadow:0 8px 23px rgba(39,65,95,.12)}"
if css_marker not in s:
    raise SystemExit('voice CSS insertion marker missing')
css_new = "      .nx-kid-voice-toggle{width:100%;border:3px solid #cfe7ff;border-radius:24px;background:#fff;color:#174f83;padding:15px 16px;margin:0 0 14px;text-align:left;box-shadow:0 6px 18px rgba(40,90,140,.12);touch-action:manipulation}.nx-kid-voice-toggle b{display:block;font-size:19px}.nx-kid-voice-toggle small{display:block;margin-top:4px;color:#63788c;font-size:13px;line-height:1.35}.nx-kid-voice-toggle.on{background:linear-gradient(135deg,#e9fff0,#d9f6ff);border-color:#4fc76b;color:#176c35}.nx-px-voice-header.on{background:#dfffe7!important;color:#137036!important}.nx-kid-voice-live{display:inline-flex;align-items:center;justify-content:center;margin:2px auto 8px;padding:8px 13px;border-radius:999px;background:#e5fff0;color:#15713b;font-size:14px;font-weight:950;box-shadow:0 3px 9px rgba(27,134,67,.12)}\n" + css_marker
s = s.replace(css_marker, css_new, 1)

path.write_text(s, encoding='utf-8')
Path('version.json').write_text(json.dumps({
  'version':'V614',
  'message':'Nexora V614 : CP1 avec mode vocal de seance. Le parent active le micro une seule fois ; Nexora ecoute automatiquement apres chaque question, tandis que toutes les reponses tactiles restent disponibles.',
  'critical':False
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('V614 integrated')
