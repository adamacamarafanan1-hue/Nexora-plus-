from pathlib import Path
import json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')

if "var VERSION = 'v611';" in s:
    raise SystemExit('V611 already integrated')
if "var VERSION = 'v610.2';" not in s:
    raise SystemExit('Expected V610.2 source')

def replace_between(text, start, end, replacement):
    a = text.find(start)
    if a < 0:
        raise SystemExit('Missing start marker: ' + start)
    b = text.find(end, a)
    if b < 0:
        raise SystemExit('Missing end marker: ' + end)
    return text[:a] + replacement.rstrip() + '\n\n' + text[b:]

s = s.replace('/* NEXORA — École primaire interactive V610.2', '/* NEXORA — École primaire interactive V611', 1)
s = s.replace('if (window.__nxPrimaryExercisesV610_2) return;\n  window.__nxPrimaryExercisesV610_2 = true;', "if (window.__nxPrimaryExercisesV611) return;\n  window.__nxPrimaryExercisesV611 = true;", 1)
s = s.replace("var VERSION = 'v610.2';", "var VERSION = 'v611';", 1)
s = s.replace("  var viewer = null;\n", "  var viewer = null;\n  var autoTimer = null;\n", 1)

helpers = r'''  function clearAuto() {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  }
  function scheduleNext(fn, ms) {
    clearAuto();
    autoTimer = setTimeout(function () {
      autoTimer = null;
      if (!viewer || viewer.hidden) return;
      try { fn(); } catch (_e) {}
    }, ms || 1800);
  }
  function cp1SubjectArt(subject) {
    var common = 'viewBox="0 0 240 138" role="img" aria-hidden="true"';
    var svg = '';
    if (subject === 'francais') svg = '<svg '+common+'><defs><linearGradient id="fg" x1="0" x2="1"><stop stop-color="#7b4dff"/><stop offset="1" stop-color="#b56cff"/></linearGradient></defs><rect width="240" height="138" rx="28" fill="url(#fg)"/><circle cx="44" cy="34" r="22" fill="#ffd166"/><text x="44" y="43" text-anchor="middle" font-size="24" font-weight="900" fill="#5b31be">Aa</text><path d="M52 82 Q88 59 120 79 V122 Q88 102 52 116Z" fill="#fff"/><path d="M188 82 Q152 59 120 79 V122 Q152 102 188 116Z" fill="#fff4ff"/><path d="M120 79V122" stroke="#d6b7ff" stroke-width="4"/><text x="120" y="70" text-anchor="middle" font-size="20" font-weight="900" fill="#fff">ABC</text></svg>';
    else if (subject === 'maths') svg = '<svg '+common+'><defs><linearGradient id="mg" x1="0" x2="1"><stop stop-color="#ff9c2b"/><stop offset="1" stop-color="#ffcf43"/></linearGradient></defs><rect width="240" height="138" rx="28" fill="url(#mg)"/><circle cx="55" cy="70" r="31" fill="#fff" opacity=".96"/><circle cx="120" cy="70" r="31" fill="#fff" opacity=".96"/><circle cx="185" cy="70" r="31" fill="#fff" opacity=".96"/><text x="55" y="84" text-anchor="middle" font-size="43" font-weight="1000" fill="#ff5b3d">1</text><text x="120" y="84" text-anchor="middle" font-size="43" font-weight="1000" fill="#188be8">2</text><text x="185" y="84" text-anchor="middle" font-size="43" font-weight="1000" fill="#65b92e">3</text></svg>';
    else if (subject === 'sciences') svg = '<svg '+common+'><defs><linearGradient id="sg" x1="0" x2="1"><stop stop-color="#76d83e"/><stop offset="1" stop-color="#18b77c"/></linearGradient></defs><rect width="240" height="138" rx="28" fill="url(#sg)"/><path d="M72 103 C50 62 79 26 129 30 C126 78 106 104 72 103Z" fill="#d9ff70"/><path d="M75 99 C92 75 108 58 128 37" stroke="#2b984a" stroke-width="5" fill="none"/><circle cx="150" cy="66" r="31" fill="#dff8ff" stroke="#fff" stroke-width="7"/><line x1="171" y1="89" x2="201" y2="119" stroke="#126eaa" stroke-width="13" stroke-linecap="round"/><circle cx="150" cy="66" r="20" fill="#82d8ff" opacity=".6"/><circle cx="71" cy="42" r="9" fill="#ff4747"/><circle cx="68" cy="39" r="2.5" fill="#222"/><circle cx="75" cy="39" r="2.5" fill="#222"/></svg>';
    else if (subject === 'ecm') svg = '<svg '+common+'><rect width="240" height="138" rx="28" fill="#168fe5"/><rect x="82" y="20" width="76" height="48" rx="6" fill="#f6cc27"/><rect x="82" y="20" width="25" height="48" fill="#e6443b"/><rect x="133" y="20" width="25" height="48" fill="#15964c"/><circle cx="75" cy="88" r="31" fill="#8b522f"/><circle cx="165" cy="88" r="31" fill="#9a5c35"/><path d="M51 78q24-35 48 0" fill="#31251f"/><path d="M141 78q24-35 48 0" fill="#2a211c"/><circle cx="65" cy="89" r="3.5" fill="#181818"/><circle cx="84" cy="89" r="3.5" fill="#181818"/><circle cx="155" cy="89" r="3.5" fill="#181818"/><circle cx="174" cy="89" r="3.5" fill="#181818"/><path d="M66 104q9 8 18 0M156 104q9 8 18 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
    else if (subject === 'arts') svg = '<svg '+common+'><defs><linearGradient id="ag" x1="0" x2="1"><stop stop-color="#ff5aa6"/><stop offset="1" stop-color="#ff8057"/></linearGradient></defs><rect width="240" height="138" rx="28" fill="url(#ag)"/><path d="M61 91c0-39 31-67 70-67 37 0 69 23 69 54 0 17-13 27-28 27h-14c-7 0-12 6-10 13 2 8-4 14-12 14-43 0-75-12-75-41Z" fill="#ffd878"/><circle cx="96" cy="54" r="9" fill="#f04444"/><circle cx="129" cy="43" r="9" fill="#3b8cff"/><circle cx="160" cy="57" r="9" fill="#48b957"/><circle cx="91" cy="85" r="9" fill="#8f55d8"/><path d="M169 117 L202 35" stroke="#6b3b22" stroke-width="12" stroke-linecap="round"/><path d="M198 39l10-24 9 27-18 7Z" fill="#31231c"/></svg>';
    else if (subject === 'eps') svg = '<svg '+common+'><defs><linearGradient id="eg" x1="0" x2="1"><stop stop-color="#1da9ff"/><stop offset="1" stop-color="#4b6cff"/></linearGradient></defs><rect width="240" height="138" rx="28" fill="url(#eg)"/><circle cx="181" cy="94" r="29" fill="#fff"/><path d="M181 74l11 8-4 13h-14l-4-13 11-8Zm-19 20-10 8 9 12 13-3m26-17 10 8-9 12-13-3" fill="#1c2938"/><circle cx="85" cy="39" r="17" fill="#8c5638"/><path d="M75 31q11-20 24 0" fill="#25211f"/><path d="M84 57l-19 35 25 12 17-36Z" fill="#ffcf2e"/><path d="M69 76 46 94M103 72l27 10M73 101l-20 27M91 102l24 22" stroke="#8c5638" stroke-width="9" stroke-linecap="round"/></svg>';
    else svg = '<svg '+common+'><defs><linearGradient id="tg" x1="0" x2="1"><stop stop-color="#22c9bf"/><stop offset="1" stop-color="#35a7ff"/></linearGradient></defs><rect width="240" height="138" rx="28" fill="url(#tg)"/><circle cx="70" cy="55" r="30" fill="#ffd64d"/><path d="M70 13v-10M70 107v10M28 55H17M123 55h-11M40 25l-8-8M100 85l8 8M100 25l8-8M40 85l-8 8" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M125 94q22-50 51 0" fill="#fff" opacity=".92"/><circle cx="150" cy="71" r="26" fill="#fff" opacity=".92"/><rect x="132" y="94" width="64" height="23" rx="12" fill="#fff"/><path d="M149 104l8 8 18-22" stroke="#20a865" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<div class="nx-kid-subject-art sub-' + subject + '">' + svg + '</div>';
  }
  function cp1Scene(lesson, subject, compact) {
    var v = lesson && lesson.visual ? lesson.visual : (SUBJECTS[subject] ? SUBJECTS[subject].icon : '⭐');
    return '<div class="nx-kid-scene sub-' + esc(subject || '') + (compact ? ' compact' : '') + '" role="img" aria-label="' + esc((lesson && lesson.visualLabel) || (lesson && lesson.title) || 'Illustration') + '">' +
      '<span class="nx-kid-cloud c1"></span><span class="nx-kid-cloud c2"></span><span class="nx-kid-spark s1">✦</span><span class="nx-kid-spark s2">★</span>' +
      '<div class="nx-kid-scene-visual">' + esc(v) + '</div></div>';
  }
  function cp1Stars(value) {
    var n = value >= 85 ? 3 : value >= 55 ? 2 : value > 0 ? 1 : 0;
    return '<span class="nx-kid-stars">' + [0,1,2].map(function(i){ return '<b class="' + (i < n ? 'on' : '') + '">★</b>'; }).join('') + '</span>';
  }
'''
marker = '  function progressWrite(level, subject, good, total) {'
if marker not in s: raise SystemExit('progress marker missing')
s = s.replace(marker, helpers + '\n' + marker, 1)

premium_styles = r'''  function cp1PremiumStyles() {
    if (document.getElementById('nxCp1PremiumV611')) return;
    var st = document.createElement('style');
    st.id = 'nxCp1PremiumV611';
    st.textContent = `
      .nx-px-v600.nx-cp1-mode{background:linear-gradient(180deg,#dff5ff 0,#fff9df 42%,#eefbe9 100%);background-attachment:fixed}
      .nx-cp1-mode .nx-px-top{background:linear-gradient(135deg,#078df0,#4f53e9);padding:11px 12px;border-bottom-left-radius:22px;border-bottom-right-radius:22px;box-shadow:0 7px 24px rgba(39,94,190,.24)}
      .nx-cp1-mode .nx-px-top b{font-size:20px;letter-spacing:.2px}.nx-cp1-mode .nx-px-top span{font-size:13px;opacity:.95}
      .nx-cp1-mode .nx-px-top button{min-width:52px;height:52px;border-radius:18px;background:#fff;color:#1760bc;box-shadow:0 3px 9px rgba(0,0,0,.14);font-size:21px}
      .nx-cp1-mode .nx-px-back{min-width:92px!important;color:#1760bc!important}.nx-cp1-mode .nx-px-main{width:min(720px,100%);padding:14px 12px 110px}
      .nx-kid-welcome{position:relative;overflow:hidden;background:linear-gradient(145deg,#0fa9ff,#2d7bec);color:#fff;border-radius:28px;padding:22px 18px 20px;box-shadow:0 10px 26px rgba(28,119,211,.22);margin-bottom:14px}
      .nx-kid-welcome:before{content:'';position:absolute;width:190px;height:190px;border-radius:50%;background:rgba(255,255,255,.13);right:-50px;top:-70px}.nx-kid-welcome h2{position:relative;margin:0 0 5px;font-size:31px;line-height:1.05}.nx-kid-welcome .grade{display:inline-block;background:#ffd83e;color:#1353a2;border-radius:999px;padding:7px 13px;font-weight:950;margin-bottom:12px;box-shadow:inset 0 -3px rgba(0,0,0,.08)}
      .nx-kid-voice{position:relative;display:flex;align-items:center;gap:12px;background:#fff;color:#193652;border-radius:22px;padding:12px 14px;margin-top:10px;box-shadow:0 5px 14px rgba(0,0,0,.12)}.nx-kid-voice .spk{display:grid;place-items:center;flex:0 0 58px;height:58px;border-radius:18px;background:#e8f3ff;font-size:30px}.nx-kid-voice b{font-size:18px}.nx-kid-voice small{display:block;font-size:13px;color:#657386;margin-top:2px}
      .nx-kid-mascot{position:absolute;right:12px;top:13px;font-size:54px;filter:drop-shadow(0 4px 5px rgba(0,0,0,.15))}.nx-kid-subject-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .nx-kid-subject{position:relative;border:0;border-radius:25px;padding:0;overflow:hidden;background:#fff;min-height:190px;text-align:left;box-shadow:0 7px 20px rgba(40,67,99,.14);touch-action:manipulation;transition:transform .12s ease}.nx-kid-subject:active{transform:scale(.975)}
      .nx-kid-subject-art{width:100%;height:116px;overflow:hidden}.nx-kid-subject-art svg{display:block;width:100%;height:100%}.nx-kid-subject-info{padding:10px 12px 14px;text-align:center}.nx-kid-subject-info strong{display:block;font-size:18px;color:#24364b;line-height:1.15}.nx-kid-subject-info small{display:block;color:#708091;font-size:12px;margin-top:4px}.nx-kid-subject .nx-px-progress{margin-top:5px}
      .nx-kid-progress-card{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border:2px solid #ffe39a;border-radius:24px;padding:13px 15px;margin:14px 0;box-shadow:0 5px 14px rgba(132,106,30,.08)}.nx-kid-progress-card b{font-size:16px;color:#4b3a17}.nx-kid-stars{white-space:nowrap}.nx-kid-stars b{font-size:29px;color:#d7d8dc;text-shadow:0 2px 0 #fff}.nx-kid-stars b.on{color:#ffc928;text-shadow:0 2px 0 #e49d00}
      .nx-kid-resume,.nx-kid-main-action{width:100%;border:0;border-radius:22px;min-height:74px;padding:14px 18px;font:inherit;font-weight:950;font-size:20px;color:#fff;background:linear-gradient(180deg,#1597ff,#096bd9);box-shadow:0 7px 0 #0757b4,0 10px 20px rgba(11,98,202,.22);touch-action:manipulation}.nx-kid-resume:active,.nx-kid-main-action:active{transform:translateY(3px);box-shadow:0 4px 0 #0757b4}.nx-kid-resume small{display:block;font-size:12px;font-weight:750;opacity:.9;margin-top:3px}
      .nx-kid-subject-hero{display:grid;grid-template-columns:160px 1fr;gap:12px;align-items:center;background:#fff;border-radius:28px;padding:12px;margin-bottom:13px;box-shadow:0 7px 20px rgba(42,68,96,.11)}.nx-kid-subject-hero .nx-kid-subject-art{height:100px;border-radius:19px}.nx-kid-subject-hero h2{margin:0 0 4px;font-size:23px;color:#24364b}.nx-kid-subject-hero p{margin:0;color:#718092;font-size:13px}
      .nx-kid-lesson-grid{display:grid;grid-template-columns:1fr;gap:11px}.nx-kid-lesson{display:grid;grid-template-columns:118px 1fr;gap:13px;align-items:center;border:0;background:#fff;border-radius:23px;padding:10px;min-height:126px;text-align:left;box-shadow:0 5px 16px rgba(42,68,96,.1);touch-action:manipulation}.nx-kid-lesson:active{transform:scale(.986)}.nx-kid-lesson .nx-kid-scene{height:103px;margin:0}.nx-kid-lesson strong{display:block;color:#26384c;font-size:17px}.nx-kid-lesson small{display:block;margin-top:6px;color:#1480e6;font-weight:850}.nx-kid-lesson .num{display:inline-grid;place-items:center;width:29px;height:29px;border-radius:50%;background:#ffd844;color:#704f00;margin-right:5px}
      .nx-kid-flow{display:flex;align-items:center;justify-content:center;gap:5px;margin:3px 0 12px}.nx-kid-flow span{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#fff;border:3px solid #d9dfea;color:#8a96a5;font-weight:900}.nx-kid-flow span.on{background:#ffd43a;border-color:#fff3a1;color:#764e00;box-shadow:0 3px 8px rgba(171,126,0,.18)}.nx-kid-flow i{width:26px;height:5px;background:#d9dfea;border-radius:9px}.nx-kid-flow i.on{background:#64c93c}
      .nx-kid-scene{position:relative;overflow:hidden;height:235px;border-radius:30px;margin:0 0 14px;background:linear-gradient(180deg,#5fc8ff 0 50%,#89db59 51% 100%);box-shadow:inset 0 -18px 30px rgba(20,95,35,.12),0 9px 24px rgba(36,89,122,.16)}.nx-kid-scene.compact{height:120px;border-radius:20px}.nx-kid-scene:after{content:'';position:absolute;left:-12%;right:-12%;bottom:-32px;height:90px;background:#67bd42;border-radius:50%}.nx-kid-scene-visual{position:absolute;z-index:3;inset:18px 14px 20px;display:flex;align-items:center;justify-content:center;text-align:center;white-space:pre-line;font-size:56px;line-height:1.22;letter-spacing:4px;filter:drop-shadow(0 7px 4px rgba(0,0,0,.12))}.nx-kid-scene.compact .nx-kid-scene-visual{font-size:34px;inset:10px}.nx-kid-cloud{position:absolute;z-index:1;width:70px;height:25px;background:rgba(255,255,255,.88);border-radius:30px}.nx-kid-cloud:before,.nx-kid-cloud:after{content:'';position:absolute;background:inherit;border-radius:50%}.nx-kid-cloud:before{width:28px;height:28px;left:12px;top:-12px}.nx-kid-cloud:after{width:36px;height:36px;right:9px;top:-18px}.nx-kid-cloud.c1{left:20px;top:31px}.nx-kid-cloud.c2{right:16px;top:52px;transform:scale(.65)}.nx-kid-spark{position:absolute;z-index:2;color:#fff;font-size:25px}.nx-kid-spark.s1{right:24px;top:16px}.nx-kid-spark.s2{left:22px;bottom:18px;color:#ffe65b}
      .nx-kid-card{background:#fff;border-radius:27px;padding:16px;box-shadow:0 8px 23px rgba(39,65,95,.12)}.nx-kid-step{display:flex;align-items:center;gap:11px;border-radius:21px;padding:13px 14px;margin:10px 0}.nx-kid-step.listen{background:#fff3c9}.nx-kid-step.look{background:#e7f8d9}.nx-kid-step.try{background:#e2f3ff}.nx-kid-step .ico{font-size:33px}.nx-kid-step b{font-size:17px;color:#26384c}.nx-kid-easy{font-size:19px;line-height:1.65;color:#26384c;margin:13px 3px}.nx-kid-example{background:#f2f8ff;border-radius:18px;padding:12px 13px;color:#28506f;font-size:15px;line-height:1.5}.nx-kid-listen{width:100%;min-height:72px;border:0;border-radius:22px;background:linear-gradient(180deg,#179dff,#0970dc);color:#fff;font:inherit;font-size:21px;font-weight:950;box-shadow:0 6px 0 #075cae;margin:6px 0 11px}.nx-kid-listen:active{transform:translateY(3px);box-shadow:0 3px 0 #075cae}
      .nx-kid-action-wrap{position:sticky;bottom:10px;z-index:5;padding:10px 0 2px;background:linear-gradient(180deg,transparent,rgba(245,251,255,.95) 28%)}.nx-kid-action-wrap .nx-kid-main-action{background:linear-gradient(180deg,#24c85d,#13a545);box-shadow:0 7px 0 #0b7d33,0 10px 20px rgba(16,153,64,.22)}
      .nx-kid-question{background:#fff;border-radius:28px;padding:14px;box-shadow:0 8px 23px rgba(39,65,95,.12)}.nx-kid-question h2{font-size:24px;line-height:1.25;text-align:center;color:#1f3a2b;margin:10px 5px 14px}.nx-kid-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.nx-kid-choice-grid.long{grid-template-columns:1fr}.nx-kid-answer{min-height:88px;border:4px solid #fff;border-radius:24px;font:inherit;font-weight:1000;font-size:25px;color:#fff;box-shadow:0 6px 0 rgba(0,0,0,.16),0 8px 17px rgba(0,0,0,.11);touch-action:manipulation;text-align:center;padding:12px}.nx-kid-answer:nth-child(4n+1){background:linear-gradient(180deg,#a65bf4,#7740dc)}.nx-kid-answer:nth-child(4n+2){background:linear-gradient(180deg,#ff9c2d,#f06d18)}.nx-kid-answer:nth-child(4n+3){background:linear-gradient(180deg,#68d731,#39a90e)}.nx-kid-answer:nth-child(4n){background:linear-gradient(180deg,#35a7ff,#1475dc)}.nx-kid-answer.good{background:linear-gradient(180deg,#50d94b,#22a933)!important;outline:5px solid #d4ffb9}.nx-kid-answer.bad{background:linear-gradient(180deg,#ff6c6c,#d93c3c)!important;opacity:.82}.nx-kid-answer:disabled{color:#fff}
      .nx-kid-feedback{margin-top:14px;border-radius:24px;padding:16px;text-align:center}.nx-kid-feedback.ok{background:#efffe4;color:#196b2d}.nx-kid-feedback.no{background:#fff0e5;color:#8d4219}.nx-kid-feedback .face{font-size:48px;display:block}.nx-kid-feedback b{display:block;font-size:22px;margin:4px}.nx-kid-feedback span{font-size:15px;line-height:1.45}.nx-kid-auto{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;color:#557181;font-weight:850;font-size:13px}.nx-kid-auto:before{content:'🚀';font-size:22px}.nx-kid-pulse{animation:nxKidPulse 1.15s ease-in-out infinite}@keyframes nxKidPulse{50%{transform:scale(1.025);filter:brightness(1.06)}}
      .nx-kid-result{text-align:center;background:linear-gradient(180deg,#fff,#f6fff0);border-radius:30px;padding:22px 16px;box-shadow:0 9px 25px rgba(42,87,57,.14)}.nx-kid-result .trophy{font-size:68px}.nx-kid-result h2{font-size:27px;color:#20743b;margin:4px}.nx-kid-result .score{font-size:56px;font-weight:1000;color:#206ec6}.nx-kid-result p{color:#627484}.nx-kid-result .nx-px-actions{margin-top:15px}
      @media(max-width:520px){.nx-kid-welcome h2{font-size:27px}.nx-kid-subject{min-height:176px}.nx-kid-subject-art{height:105px}.nx-kid-subject-info strong{font-size:17px}.nx-kid-subject-hero{grid-template-columns:112px 1fr}.nx-kid-subject-hero .nx-kid-subject-art{height:88px}.nx-kid-scene{height:205px}.nx-kid-scene-visual{font-size:48px}.nx-kid-choice-grid{gap:10px}.nx-kid-answer{min-height:84px;font-size:23px}.nx-kid-voice{padding-right:10px}.nx-kid-mascot{font-size:47px}}
      @media(max-width:370px){.nx-kid-subject-grid{grid-template-columns:1fr}.nx-kid-subject{display:grid;grid-template-columns:140px 1fr;min-height:128px}.nx-kid-subject-art{height:100%;min-height:128px}.nx-kid-subject-info{display:flex;flex-direction:column;justify-content:center}.nx-kid-mascot{display:none}}
    `;
    document.head.appendChild(st);
  }
'''
marker2 = '  function shell() {'
if marker2 not in s: raise SystemExit('shell marker missing')
s = s.replace(marker2, premium_styles + '\n' + marker2, 1)
s = s.replace('    styles();\n    if (viewer) return viewer;', '    styles(); cp1PremiumStyles();\n    if (viewer) return viewer;', 1)

resume_anchor = "      var lesson = ev.target.closest('[data-lesson]'); if (lesson) { startCp1Lesson(lesson.getAttribute('data-lesson')); return; }"
if resume_anchor not in s: raise SystemExit('resume listener anchor missing')
resume_code = "      var resume = ev.target.closest('[data-resume]'); if (resume) { state.subject = resume.getAttribute('data-resume-subject'); startCp1Lesson(resume.getAttribute('data-resume-lesson')); return; }\n" + resume_anchor
s = s.replace(resume_anchor, resume_code, 1)

render_subjects = r'''  function renderSubjects() {
    var l = LEVELS[state.level]; if (!l) { renderLevels(); return; }
    clearAuto();
    state.subject = ''; state.lesson = -1; state.phase = 0; state.list = []; state.index = 0;
    shell().classList.toggle('nx-cp1-mode', state.level === '1');
    var p = progressRead();
    if (state.level === '1') {
      state.readText = 'Bienvenue en première année. Choisis ta matière. Touche une grande image. Je suis là pour t’aider.';
      setHeader('Nexora · 1ère année', 'Écoute puis touche une matière', true);
      var total = 0, count = 0;
      l.subjects.forEach(function(sub){ var pr = p['1:' + sub]; if (pr && typeof pr.best === 'number') { total += pr.best; count++; } });
      var avg = count ? Math.round(total / count) : 0;
      var last = lastCp1Read();
      var validLast = !!(last && CP1_LESSONS[last.subject] && Number(last.lesson) >= 0 && Number(last.lesson) < CP1_LESSONS[last.subject].length);
      var html = '<section class="nx-kid-welcome"><span class="grade">1ère année</span><span class="nx-kid-mascot" aria-hidden="true">🦜</span><h2>Bienvenue !</h2>' +
        '<div class="nx-kid-voice"><span class="spk">🔊</span><div><b>Choisis ta matière</b><small>Je suis là pour t’aider.</small></div></div></section>';
      if (validLast) {
        var lm = SUBJECTS[last.subject]; var ll = CP1_LESSONS[last.subject][Number(last.lesson)];
        html += '<button type="button" class="nx-kid-resume nx-kid-pulse" data-resume data-resume-subject="' + esc(last.subject) + '" data-resume-lesson="' + Number(last.lesson) + '">▶ Continuer ma leçon<small>' + esc(lm.name + ' · ' + ll.title) + '</small></button>';
      }
      html += '<div class="nx-kid-progress-card"><div><b>⭐ Ma progression</b><div style="font-size:12px;color:#74808d;margin-top:3px">Continue pour gagner tes étoiles</div></div>' + cp1Stars(avg) + '</div>';
      html += '<div class="nx-kid-subject-grid">';
      l.subjects.forEach(function(sub){
        var meta = SUBJECTS[sub], pr = p['1:' + sub];
        html += '<button type="button" class="nx-kid-subject" data-subject="' + sub + '" aria-label="' + esc(meta.name) + '">' + cp1SubjectArt(sub) +
          '<div class="nx-kid-subject-info"><strong>' + esc(meta.name.replace('Éducation civique et morale','ECM').replace('Éducation physique','EPS').replace('Sciences d’observation','Sciences')) + '</strong><small>🔊 Touche pour ouvrir</small>' +
          (pr ? '<div class="nx-px-progress">' + (pr.best || 0) + '% · ' + cp1Stars(pr.best || 0) + '</div>' : '') + '</div></button>';
      });
      html += '</div>';
      main().innerHTML = html;
      setTimeout(function(){ speak(state.readText); }, 220);
      return;
    }
    state.readText = '';
    setHeader(l.label, 'Choisis une matière', true);
    var old = '<section class="nx-px-hero"><h2>' + esc(l.label) + '</h2><p>Choisis une matière pour commencer les exercices.</p></section><div class="nx-px-grid">';
    l.subjects.forEach(function (sub) {
      var meta = SUBJECTS[sub], bank = build(state.level, sub), pr = p[state.level + ':' + sub];
      old += '<button type="button" class="nx-px-card" data-subject="' + sub + '"><em>' + meta.icon + '</em><strong>' + esc(meta.name) + '</strong><small>' + bank.length + ' exercices par série</small>' + (pr ? '<div class="nx-px-progress">Meilleur score : ' + (pr.best || 0) + '%</div>' : '') + '</button>';
    });
    old += '</div>'; main().innerHTML = old;
  }
'''
s = replace_between(s, '  function renderSubjects() {', '  function startSubject(subject) {', render_subjects)

render_lessons = r'''  function renderCp1Lessons(subject) {
    clearAuto();
    shell().classList.add('nx-cp1-mode');
    var meta = SUBJECTS[subject], lessons = CP1_LESSONS[subject] || [];
    state.subject = subject; state.lesson = -1; state.phase = 0;
    state.list = []; state.index = 0; state.good = 0; state.wrong = [];
    var last = lastCp1Read();
    var hasLast = !!(last && last.subject === subject && Number(last.lesson) >= 0 && Number(last.lesson) < lessons.length);
    var startIndex = hasLast ? Number(last.lesson) : 0;
    state.readText = 'Tu es en ' + meta.name + '. Touche Continuer pour reprendre ta leçon, ou choisis une grande carte.';
    setHeader(meta.name, '1ère année · Écoute et avance', true);
    var html = '<section class="nx-kid-subject-hero">' + cp1SubjectArt(subject) + '<div><h2>' + esc(meta.name) + '</h2><p>' + lessons.length + ' leçons · audio · images · exercices</p></div></section>';
    if (lessons.length) html += '<button type="button" class="nx-kid-resume nx-kid-pulse" data-lesson="' + startIndex + '">▶ ' + (hasLast ? 'Continuer' : 'Commencer') + '<small>Leçon ' + (startIndex + 1) + ' · ' + esc(lessons[startIndex].title) + '</small></button>';
    html += '<div class="nx-kid-progress-card"><b>🌟 Mon parcours</b><span style="font-size:13px;color:#68798c">Touche une grande leçon</span></div><div class="nx-kid-lesson-grid">';
    lessons.forEach(function(lesson,i){ html += '<button type="button" class="nx-kid-lesson" data-lesson="' + i + '" aria-label="Leçon ' + (i+1) + '. ' + esc(lesson.title) + '">' + cp1Scene(lesson,subject,true) + '<div><strong><span class="num">' + (i+1) + '</span>' + esc(lesson.title) + '</strong><small>🔊 Écouter et apprendre</small></div></button>'; });
    html += '</div>'; main().innerHTML = html; setTimeout(function(){ speak(state.readText); },220);
  }
'''
s = replace_between(s, '  function renderCp1Lessons(subject) {', '  function startCp1Lesson(index) {', render_lessons)

render_explanation = r'''  function renderCp1Explanation() {
    clearAuto(); shell().classList.add('nx-cp1-mode');
    var lessons = CP1_LESSONS[state.subject] || [], lesson = lessons[state.lesson];
    if (!lesson) { renderCp1Lessons(state.subject); return; }
    var second = state.phase === 2;
    var title = second ? 'Je comprends autrement' : 'Je découvre';
    var body = second ? lesson.two : lesson.one; var extra = lesson.example || '';
    state.readText = title + '. ' + lesson.title + '. ' + body + (extra ? ' ' + extra : '');
    setHeader(SUBJECTS[state.subject].name, 'Leçon ' + (state.lesson + 1), true);
    var action = second ? (state.diagnosticPassed ? 'data-start-exercises' : 'data-retry-diagnostic') : 'data-start-diagnostic';
    var label = second ? (state.diagnosticPassed ? 'Continuer les exercices' : 'Réessayer') : 'J’essaie maintenant';
    main().innerHTML = '<div class="nx-kid-flow"><span class="on">1</span><i class="' + (second?'on':'') + '"></i><span class="' + (second?'on':'') + '">2</span><i></i><span>3</span><i></i><span>★</span></div>' +
      cp1Scene(lesson,state.subject,false) + '<section class="nx-kid-card"><div class="nx-kid-step listen"><span class="ico">👂🏾</span><div><b>1. J’écoute</b><small style="display:block;color:#6b7380">La leçon est lue à voix haute.</small></div></div>' +
      '<h2 style="margin:9px 2px 4px;color:#5338a5;font-size:25px">' + esc(lesson.title) + '</h2><button type="button" class="nx-kid-listen" data-speak>🔊 Écouter / Réécouter</button>' +
      '<div class="nx-kid-step look"><span class="ico">👀</span><div><b>2. Je regarde</b><small style="display:block;color:#6b7380">Regarde la grande image.</small></div></div><p class="nx-kid-easy">' + esc(body) + '</p>' +
      (extra ? '<div class="nx-kid-example"><b>💡 Exemple</b><br>' + esc(extra) + '</div>' : '') + '<div class="nx-kid-step try"><span class="ico">☝🏾</span><div><b>3. J’essaie</b><small style="display:block;color:#6b7380">Une grande réponse suffit.</small></div></div></section>' +
      '<div class="nx-kid-action-wrap"><button type="button" class="nx-kid-main-action nx-kid-pulse" ' + action + '>▶ ' + label + '</button></div>';
    speak(state.readText);
  }
'''
s = replace_between(s, '  function renderCp1Explanation() {', '  function renderCp1Diagnostic() {', render_explanation)

render_diagnostic = r'''  function renderCp1Diagnostic() {
    clearAuto(); shell().classList.add('nx-cp1-mode');
    var lessons = CP1_LESSONS[state.subject] || [], lesson = lessons[state.lesson], ex = state.diagnostic || ((lesson && lesson.ex) ? lesson.ex[0] : null);
    if (!lesson || !ex) { startCp1Exercises(); return; }
    state.phase = 10; state.diagnosticLocked = false;
    var diagChoices = ex.type === 'choice' ? ex.choices : cp1NumericChoices(ex);
    state.readText = 'Petit essai. ' + ex.q + spokenChoices(ex, diagChoices);
    setHeader(SUBJECTS[state.subject].name, 'À toi de jouer', true);
    var longChoices = !!(diagChoices && diagChoices.some(function(c){ return String(c).length > 18; }));
    var html = '<div class="nx-kid-flow"><span class="on">✓</span><i class="on"></i><span class="on">2</span><i></i><span class="on">3</span><i></i><span>★</span></div><section class="nx-kid-question">' + cp1Scene(lesson,state.subject,false) + '<h2>' + esc(ex.q) + '</h2>';
    if (ex.visual) html += '<div class="nx-px-visual" style="text-align:center;font-size:38px">' + esc(ex.visual) + '</div>';
    if (diagChoices && diagChoices.length) html += '<div class="nx-kid-choice-grid' + (longChoices?' long':'') + '">' + diagChoices.map(function(c){ return '<button type="button" class="nx-kid-answer" data-diagnostic-answer="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    else html += '<form class="nx-px-input" data-diagnostic-form style="margin-top:12px"><input autocomplete="off" aria-label="Ta réponse" placeholder="Écris ici"><button type="submit">Vérifier</button></form>';
    html += '<div data-feedback></div></section>'; main().innerHTML = html; speak(state.readText);
  }
'''
s = replace_between(s, '  function renderCp1Diagnostic() {', '  function answerCp1Diagnostic(value, control) {', render_diagnostic)

answer_diag = r'''  function answerCp1Diagnostic(value, control) {
    clearAuto();
    var ex = state.diagnostic;
    if (!ex || state.diagnosticLocked || !String(value || '').trim()) return;
    var ok = normalize(value) === normalize(ex.a); state.diagnosticLocked = true;
    var box = main().querySelector('[data-feedback]'); var all = main().querySelectorAll('[data-diagnostic-answer]');
    Array.prototype.forEach.call(all,function(b){ b.disabled = true; });
    if (ok) {
      state.diagnosticPassed = true; if (control && control.classList) control.classList.add('good');
      box.className = 'nx-kid-feedback ok'; box.innerHTML = '<span class="face">⭐</span><b>Bravo !</b><span>' + esc(ex.why || 'Tu as bien compris.') + '</span><div class="nx-kid-auto">On continue tout seul</div><button type="button" class="nx-kid-main-action" data-start-exercises style="margin-top:11px">Continuer maintenant</button>';
      state.readText = 'Bravo. Bonne réponse. ' + (ex.why || '') + ' On continue.'; speak(state.readText); scheduleNext(startCp1Exercises,2200); return;
    }
    if (control && control.classList) control.classList.add('bad');
    if (state.diagnosticAttempt === 0) {
      state.diagnosticAttempt = 1; box.className = 'nx-kid-feedback no'; box.innerHTML = '<span class="face">🙂</span><b>On essaie autrement</b><span>Je vais t’expliquer encore une fois, autrement.</span><div class="nx-kid-auto">La deuxième explication arrive</div><button type="button" class="nx-kid-main-action" data-show-second style="margin-top:11px">Écouter maintenant</button>';
      state.readText = 'Ce n’est pas grave. On essaie autrement. Écoute une deuxième explication.'; speak(state.readText); scheduleNext(function(){ state.phase = 2; renderCp1Explanation(); },2500); return;
    }
    Array.prototype.forEach.call(all,function(b){ if(normalize(b.getAttribute('data-diagnostic-answer'))===normalize(ex.a)) b.classList.add('good'); });
    box.className='nx-kid-feedback no'; box.innerHTML='<span class="face">💡</span><b>Regarde la bonne réponse : ' + esc(ex.a) + '</b><span>' + esc(ex.why || 'Regarde bien puis continue.') + '</span><div class="nx-kid-auto">On continue après la correction</div><button type="button" class="nx-kid-main-action" data-start-exercises style="margin-top:11px">Continuer maintenant</button>';
    state.readText='La bonne réponse est ' + ex.a + '. ' + (ex.why || '') + ' On continue.'; speak(state.readText); scheduleNext(startCp1Exercises,3000);
  }
'''
s = replace_between(s, '  function answerCp1Diagnostic(value, control) {', '  function startCp1Exercises() {', answer_diag)
s = s.replace('  function startCp1Exercises() {\n', '  function startCp1Exercises() {\n    clearAuto();\n', 1)

render_question = r'''  function renderQuestion() {
    clearAuto();
    if (state.index >= state.list.length) { renderResult(); return; }
    state.locked = false;
    var ex = state.list[state.index], meta = SUBJECTS[state.subject], l = LEVELS[state.level];
    var autoChoices = state.level === '1' && ex.type !== 'choice' ? cp1NumericChoices(ex) : null;
    var questionChoices = ex.type === 'choice' ? ex.choices : autoChoices;
    state.readText = ex.q + (state.level === '1' ? spokenChoices(ex, questionChoices) : '');
    setHeader(meta.name, state.level === '1' && state.lesson >= 0 ? ('Exercice ' + (state.index+1) + ' sur ' + state.list.length) : l.label, true);
    if (state.level === '1') {
      shell().classList.add('nx-cp1-mode');
      var currentLesson = state.lesson >= 0 && CP1_LESSONS[state.subject] ? CP1_LESSONS[state.subject][state.lesson] : null;
      var longChoices = !!(questionChoices && questionChoices.some(function(c){ return String(c).length > 18; }));
      var pct = Math.round((state.index / Math.max(1,state.list.length))*100);
      var html = '<div class="nx-kid-flow"><span class="on">✓</span><i class="on"></i><span class="on">✓</span><i class="on"></i><span class="on">' + (state.index+1) + '</span><i></i><span>★</span></div><section class="nx-kid-question">' + (currentLesson ? cp1Scene(currentLesson,state.subject,false) : '') + '<div style="height:8px;background:#e5edf4;border-radius:10px;overflow:hidden;margin:2px 3px 12px"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#53ca36,#ffd234);border-radius:10px"></div></div><h2>' + esc(ex.q) + '</h2>';
      if (ex.visual) html += '<div class="nx-px-visual" style="text-align:center;font-size:40px">' + esc(ex.visual) + '</div>';
      if (questionChoices && questionChoices.length) html += '<div class="nx-kid-choice-grid' + (longChoices?' long':'') + '">' + questionChoices.map(function(c){ return '<button type="button" class="nx-kid-answer" data-answer="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
      else { var mode = ex.type === 'input' ? 'inputmode="decimal"' : ''; html += '<form class="nx-px-input" data-answer-form style="margin-top:12px"><input ' + mode + ' autocomplete="off" aria-label="Ta réponse" placeholder="Écris ta réponse"><button type="submit">Corriger</button></form>'; }
      html += '<div data-feedback></div></section>'; main().innerHTML = html; speak(state.readText); return;
    }
    var old = '<section class="nx-px-question"><div class="nx-px-meta"><span>Exercice ' + (state.index + 1) + ' / ' + state.list.length + '</span><span>' + esc(meta.name) + '</span></div><h2 class="nx-px-q">' + esc(ex.q) + '</h2>';
    if (ex.visual) old += '<div class="nx-px-visual">' + esc(ex.visual) + '</div>';
    if (questionChoices && questionChoices.length) old += '<div class="nx-px-choices">' + questionChoices.map(function(c){ return '<button type="button" class="nx-px-answer" data-answer="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    else { var m = ex.type === 'input' ? 'inputmode="decimal"' : ''; old += '<form class="nx-px-input" data-answer-form><input ' + m + ' autocomplete="off" aria-label="Ta réponse" placeholder="Écris ta réponse"><button type="submit">Corriger</button></form>'; }
    old += '<div data-feedback></div></section>'; main().innerHTML = old;
  }
'''
s = replace_between(s, '  function renderQuestion() {', '  function answer(value, control) {', render_question)

answer_fn = r'''  function answer(value, control) {
    clearAuto();
    if (state.locked || state.index >= state.list.length) return;
    var ex = state.list[state.index], ok = normalize(value) === normalize(ex.a);
    if (!String(value || '').trim()) return;
    state.locked = true; if (ok) state.good++; else state.wrong.push(ex);
    var all = main().querySelectorAll('[data-answer]');
    Array.prototype.forEach.call(all,function(b){ b.disabled=true; if(normalize(b.getAttribute('data-answer'))===normalize(ex.a)) b.classList.add('good'); });
    if (!ok && control && control.classList) control.classList.add('bad');
    var box = main().querySelector('[data-feedback]');
    if (state.level === '1') {
      box.className = 'nx-kid-feedback ' + (ok?'ok':'no');
      box.innerHTML = '<span class="face">' + (ok?'⭐':'💡') + '</span><b>' + (ok?'Bravo !':'On apprend de l’erreur') + '</b>' + (ok?'':'<span>Bonne réponse : <strong>' + esc(ex.a) + '</strong></span>') + (ex.why?'<span style="display:block;margin-top:5px">'+esc(ex.why)+'</span>':'') + '<div class="nx-kid-auto">' + (state.index+1>=state.list.length?'Ton résultat arrive':'Exercice suivant automatique') + '</div><button type="button" class="nx-kid-main-action" data-next style="margin-top:11px">' + (state.index+1>=state.list.length?'Voir mon résultat':'Continuer maintenant') + '</button>';
      state.readText = ok ? ('Bravo. Bonne réponse. ' + ex.why) : ('La bonne réponse est ' + ex.a + '. ' + ex.why); speak(state.readText); scheduleNext(nextQuestion, ok?1700:2800); return;
    }
    box.className='nx-px-feedback '+(ok?'ok':'no'); box.innerHTML='<b>'+(ok?'✅ Bonne réponse !':'❌ Ce n’est pas la bonne réponse.')+'</b>'+(ok?'':'Bonne réponse : <strong>'+esc(ex.a)+'</strong><br>')+(ex.why?'<span>'+esc(ex.why)+'</span>':'')+'<button type="button" class="nx-px-next" data-next>'+(state.index+1>=state.list.length?'Voir mon résultat':'Exercice suivant')+'</button>'; state.readText=ok?('Bonne réponse. '+ex.why):('La bonne réponse est '+ex.a+'. '+ex.why); speak(state.readText);
  }
'''
s = replace_between(s, '  function answer(value, control) {', '  function nextQuestion() {', answer_fn)
s = s.replace('  function nextQuestion() { state.index++; renderQuestion(); }', '  function nextQuestion() { clearAuto(); state.index++; renderQuestion(); }', 1)

render_result = r'''  function renderResult() {
    clearAuto(); progressWrite(state.level,state.subject,state.good,state.list.length);
    var score = state.list.length ? Math.round(state.good*100/state.list.length) : 0;
    var msg = score >= 80 ? 'Bravo !' : score >= 60 ? 'Très bien, on continue !' : 'Tu progresses !';
    state.readText = msg + ' Tu as ' + state.good + ' bonnes réponses sur ' + state.list.length + '.';
    if (state.level === '1') {
      shell().classList.add('nx-cp1-mode');
      var cp1Lessons = CP1_LESSONS[state.subject] || [], current = state.lesson, nextLesson = score >= 60 ? Math.min(current+1,Math.max(0,cp1Lessons.length-1)) : current;
      lastCp1Write(state.subject,nextLesson);
      var canAdvance = score >= 60 && nextLesson !== current;
      if (canAdvance) state.readText += ' Bravo. La leçon suivante va commencer.'; else state.readText += ' Tu peux reprendre tes erreurs pour progresser.';
      setHeader(SUBJECTS[state.subject].name,'Résultat',true);
      main().innerHTML = '<section class="nx-kid-result"><div class="trophy">' + (score>=80?'🏆':'🌟') + '</div><h2>' + esc(msg) + '</h2><div class="score">' + score + '%</div>' + cp1Stars(score) + '<p>' + state.good + ' bonnes réponses sur ' + state.list.length + '.</p>' + (canAdvance?'<div class="nx-kid-auto">La prochaine leçon commence automatiquement</div>':'') + '<div class="nx-px-actions">' + (state.wrong.length?'<button type="button" class="primary" data-retry-wrong>Reprendre mes erreurs</button>':'') + (canAdvance?'<button type="button" class="primary" data-lesson="' + nextLesson + '">Continuer maintenant</button>':'<button type="button" data-again>Refaire la leçon</button>') + '<button type="button" data-subjects>Choisir une autre matière</button></div></section>';
      speak(state.readText); if (canAdvance) scheduleNext(function(){ startCp1Lesson(nextLesson); },3800); return;
    }
    setHeader(SUBJECTS[state.subject].name,LEVELS[state.level].label,true);
    main().innerHTML='<section class="nx-px-result"><div style="font-size:40px">🏆</div><h2>'+esc(msg)+'</h2><div class="nx-px-score">'+score+'%</div><p>'+state.good+' bonnes réponses sur '+state.list.length+'.</p><div class="nx-px-actions">'+(state.wrong.length?'<button type="button" class="primary" data-retry-wrong>Reprendre mes '+state.wrong.length+' erreur(s)</button>':'')+'<button type="button" data-again>Refaire une nouvelle série</button><button type="button" data-subjects>Choisir une autre matière</button></div></section>';
  }
'''
s = replace_between(s, '  function renderResult() {', '  function retryWrong() {', render_result)

s = s.replace('  function renderLevels() {\n', "  function renderLevels() {\n    clearAuto(); shell().classList.remove('nx-cp1-mode');\n", 1)
s = s.replace('  function goBack() {\n', '  function goBack() {\n    clearAuto();\n', 1)
s = s.replace('  function closeViewer() {\n', '  function closeViewer() {\n    clearAuto();\n', 1)

path.write_text(s,encoding='utf-8')

vpath = Path('version.json')
v = json.loads(vpath.read_text(encoding='utf-8'))
v['version'] = 'V611'
v['message'] = "Nexora V611 : design premium CP1 integre, grandes illustrations colorees, cartes tactiles geantes, audio-first, corrections avec enchainement automatique et progression par etoiles."
v['critical'] = False
vpath.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Integrated V611 premium CP1 design')
