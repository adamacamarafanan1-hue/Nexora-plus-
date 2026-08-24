/* NEXORA — École primaire interactive V611
   Expérience CP1 enfant : audio-first, image-first, grandes zones tactiles, navigation simplifiée et pédagogie adaptative.
   Contrat public conservé : window.NexoraPrimarySchoolV157.open(). */
(function () {
  'use strict';
  if (window.__nxPrimaryExercisesV611) return;
  window.__nxPrimaryExercisesV611 = true;

  var VERSION = 'v611';
  var STORAGE = 'nexora.primary.exercises.v600.progress';
  var LAST_CP1 = 'nexora.primary.cp1.last.v610';
  var viewer = null;
  var autoTimer = null;
  var state = { level: '', subject: '', lesson: -1, phase: 0, readText: '', list: [], index: 0, good: 0, wrong: [], locked: false, diagnostic: null, diagnosticAttempt: 0, diagnosticLocked: false, diagnosticPassed: false };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shuffle(a) {
    a = (a || []).slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function q(question, choices, answer, explanation) {
    return { type: 'choice', q: question, choices: choices, a: String(answer), why: explanation || '' };
  }
  function n(question, answer, explanation, visual) {
    return { type: 'input', q: question, a: String(answer), why: explanation || '', visual: visual || '' };
  }
  function text(question, answer, explanation) {
    return { type: 'text', q: question, a: String(answer), why: explanation || '' };
  }
  function normalize(v) {
    return String(v == null ? '' : v).trim().toLocaleLowerCase('fr-FR')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, "'").replace(/\s+/g, ' ');
  }
  function progressRead() {
    try { var x = JSON.parse(localStorage.getItem(STORAGE) || '{}'); return x && typeof x === 'object' ? x : {}; }
    catch (_e) { return {}; }
  }
  function lastCp1Read() {
    try { var x = JSON.parse(localStorage.getItem(LAST_CP1) || 'null'); return x && typeof x === 'object' ? x : null; }
    catch (_e) { return null; }
  }
  function lastCp1Write(subject, lesson) {
    try { localStorage.setItem(LAST_CP1, JSON.stringify({ subject: subject, lesson: lesson, updated_at: new Date().toISOString() })); }
    catch (_e) {}
  }
  function cp1NumericChoices(ex) {
    if (!ex || ex.type !== 'input') return null;
    var raw = String(ex.a == null ? '' : ex.a).replace(',', '.');
    var value = Number(raw);
    if (!isFinite(value) || Math.floor(value) !== value || value < 0 || value > 100) return null;
    var vals = [value];
    var candidates = [value - 1, value + 1, value - 2, value + 2, value + 3];
    for (var i = 0; i < candidates.length && vals.length < 3; i++) {
      if (candidates[i] >= 0 && vals.indexOf(candidates[i]) < 0) vals.push(candidates[i]);
    }
    return shuffle(vals.map(String));
  }
  function spokenChoices(ex, choices) {
    if (!choices || !choices.length) return '';
    return '. Réponses possibles. ' + choices.join('. ');
  }

  function clearAuto() {
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

  function progressWrite(level, subject, good, total) {
    try {
      var x = progressRead();
      var key = level + ':' + subject;
      var prev = x[key] || { best: 0, attempts: 0 };
      var score = total ? Math.round(good * 100 / total) : 0;
      prev.best = Math.max(prev.best || 0, score);
      prev.last = score;
      prev.attempts = (prev.attempts || 0) + 1;
      prev.updated_at = new Date().toISOString();
      x[key] = prev;
      localStorage.setItem(STORAGE, JSON.stringify(x));
    } catch (_e) {}
  }
  function speak(s) {
    try {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(s || ''));
      u.lang = 'fr-FR'; u.rate = .88; speechSynthesis.speak(u);
    } catch (_e) {}
  }

  var LEVELS = {
    '1': { label: '1ère année', subtitle: 'J’écoute, je regarde, je réponds', subjects: ['francais','maths','sciences','ecm','arts','eps','entretien'] },
    '2': { label: '2ème année', subtitle: 'Je lis mieux et je calcule', subjects: ['francais','maths','sciences','ecm'] },
    '3': { label: '3ème année', subtitle: 'Je comprends et je résous', subjects: ['francais','maths','sciences','histoiregeo','ecm'] },
    '4': { label: '4ème année', subtitle: 'J’explique et j’applique', subjects: ['francais','maths','sciences','histoiregeo','ecm'] },
    '5': { label: '5ème année', subtitle: 'Je raisonne avec méthode', subjects: ['francais','maths','sciences','histoire','geographie','ecm'] },
    '6': { label: '6ème année', subtitle: 'Je me prépare au collège', subjects: ['francais','maths','sciences','histoire','geographie','ecm'] }
  };
  var SUBJECTS = {
    entretien: { name: 'Entretien du matin', icon: '🌤️' },
    francais: { name: 'Français', icon: '📖' }, maths: { name: 'Mathématiques', icon: '➗' },
    sciences: { name: 'Sciences d’observation', icon: '🔬' }, histoiregeo: { name: 'Histoire & Géographie', icon: '🌍' },
    histoire: { name: 'Histoire', icon: '🏺' }, geographie: { name: 'Géographie', icon: '🗺️' },
    ecm: { name: 'Éducation civique et morale', icon: '🤝' },
    arts: { name: 'Arts & culture', icon: '🎨' }, eps: { name: 'Éducation physique', icon: '🏃' }
  };

  function cp1Lesson(title, one, two, example, visual, visualLabel, ex) {
    return { title: title, one: one, two: two, example: example || '', visual: visual || '📘', visualLabel: visualLabel || title, ex: ex || [] };
  }

  function cp1Sound(letter, sound, word1, word2, wrong, visual) {
    return cp1Lesson(
      'Le son ' + sound + ' et ' + letter,
      'Écoute : « ' + word1 + ' ». Tu entends ' + sound + '. Regarde maintenant « ' + letter + ' ». C’est le signe que nous apprenons aujourd’hui. Écoute encore et répète doucement.',
      'Pour trouver ' + sound + ', dis le mot lentement. Écoute le début, le milieu et la fin. Dans « ' + word2 + ' », tu entends aussi ' + sound + '. Tu ne choisis pas au hasard : tu écoutes le son.',
      'Exemple : écoute « ' + word1 + ' », puis « ' + word2 + ' ». Les deux mots contiennent ' + sound + '.',
      visual,
      'Illustration du son ' + sound,
      [
        q('Dans quel mot entends-tu ' + sound + ' ?', [word1, wrong, 'riz'], word1, 'Prononce le mot lentement et écoute le son demandé.'),
        q('Touche le signe que nous apprenons.', [letter, 'x', 'z'], letter, 'Le signe étudié est « ' + letter + ' ».'),
        q('Quel mot contient aussi ' + sound + ' ?', [word2, wrong, 'sac'], word2, 'On entend ' + sound + ' dans « ' + word2 + ' ».'),
        q('Pour reconnaître un son, que faut-il faire d’abord ?', ['Écouter le mot', 'Choisir au hasard', 'Fermer les oreilles'], 'Écouter le mot', 'L’oreille aide à repérer le son avant de choisir la lettre.')
      ]
    );
  }

  function cp1NumberLesson(num, word, visual, decompA, decompB) {
    return cp1Lesson(
      'Le nombre ' + num,
      'Regarde la collection. Compte chaque objet une seule fois. Le dernier nombre dit donne la quantité. Aujourd’hui, nous apprenons ' + num + ' : « ' + word + ' ».',
      'Un nombre peut être construit avec de plus petites quantités. ' + num + ' peut par exemple se décomposer en ' + decompA + ' ou en ' + decompB + '. Comprendre ces morceaux aide à calculer plus tard.',
      'Exemple : compte lentement les objets, puis montre le chiffre ' + num + '.',
      visual,
      'Collection représentant le nombre ' + num,
      [
        q('Quel nombre est représenté ?', [String(num), String(Math.max(0,num-1)), String(num+1)], String(num), 'On compte chaque objet une fois.'),
        q('Quel chiffre correspond à « ' + word + ' » ?', [String(num), String(num+1), String(Math.max(0,num-2))], String(num), 'Le mot « ' + word + ' » correspond au chiffre ' + num + '.'),
        q('Quelle décomposition peut donner ' + num + ' ?', [decompA, String(num)+' + 2', '0 + 0'], decompA, 'On vérifie en réunissant les deux petites quantités.'),
        q('Pour compter sans se tromper, que faut-il faire ?', ['Compter chaque objet une fois', 'Compter le même objet plusieurs fois', 'Répondre au hasard'], 'Compter chaque objet une fois', 'Une correspondance entre un objet et un nombre évite les doubles comptages.')
      ]
    );
  }

  function cp1Syllables(title, syllables, visual) {
    var s1 = syllables[0], s2 = syllables[1], s3 = syllables[2], s4 = syllables[3];
    return cp1Lesson(
      title,
      'Une syllabe est un petit morceau que l’on prononce d’un seul élan. Regarde : ' + s1 + ', ' + s2 + ', ' + s3 + ', ' + s4 + '. Écoute chaque syllabe puis répète.',
      'Pour lire une syllabe, rapproche les sons. Ne les garde pas séparés trop longtemps. Tu regardes les lettres, tu dis les sons, puis tu les réunis. C’est ainsi que les petites syllabes deviennent des mots.',
      'Exemple : lis lentement « ' + s1 + ' », puis « ' + s2 + ' ». Recommence un peu plus vite.',
      visual,
      'Illustration de syllabes simples',
      [
        q('Lis : ' + s1, [s1, s2, s3], s1, 'On garde l’ordre des lettres pour lire la syllabe.'),
        q('Lis : ' + s2, [s3, s2, s4], s2, 'La bonne syllabe est celle qui respecte les lettres vues.'),
        q('Quelle syllabe est différente ?', [s3, s3, s4], s4, 'Deux syllabes sont identiques ; la troisième change.'),
        q('Quand deux sons sont rapprochés pour former un petit morceau de mot, on obtient :', ['une syllabe', 'un dessin', 'un nombre'], 'une syllabe', 'Une syllabe est un petit groupe de sons prononcé ensemble.')
      ]
    );
  }

  /* CP1 — curriculum V602. Français complet en 45 leçons ; autres matières gardées pour les étapes suivantes.
     Chaque notion suit le même contrat pédagogique :
     1) explication concrète ; 2) explication par raisonnement ; 3) exercices.
     Les situations utilisent le milieu proche de l'enfant et cherchent à faire
     observer, comparer, expliquer et décider au lieu de seulement mémoriser. */
  var CP1_LESSONS = {
    entretien: [
      cp1Lesson('Saluer et répondre à l’appel',
        'Le matin, tu entres en classe et tu dis « Bonjour ». Quand ton nom est appelé, tu réponds « Présent » ou « Présente ».',
        'Saluer et répondre à l’appel aide la classe à bien commencer. Chacun sait qui est là et chacun se prépare à écouter.',
        'Exemple : « Mariama ? » — « Présente, maîtresse. »',
        '👋🏾  🧒🏾  ✅','Enfant qui salue et répond présent',[
          q('En entrant le matin, tu dis :',['Bonjour','Au revoir','Bonne nuit'],'Bonjour','« Bonjour » sert à saluer.'),
          q('Quand on appelle ton nom, tu réponds :',['Présent','Absent même si tu es là','Rien'],'Présent','Tu signales que tu es là.'),
          q('Pourquoi écouter pendant l’appel ?',['Pour entendre son nom et respecter les autres','Pour crier plus fort','Pour sortir sans prévenir'],'Pour entendre son nom et respecter les autres','L’appel demande attention et ordre.'),
          q('Quel comportement aide la classe à commencer ?',['Saluer et écouter','Courir partout','Cacher les cahiers'],'Saluer et écouter','Les bonnes habitudes facilitent le travail du groupe.')]),
      cp1Lesson('Connaître les jours de la semaine',
        'La semaine a sept jours : lundi, mardi, mercredi, jeudi, vendredi, samedi et dimanche. Les jours se suivent toujours dans cet ordre.',
        'Pour trouver le jour suivant, avance d’une place dans la liste. Pour le jour précédent, recule d’une place.',
        'Exemple : après lundi vient mardi. Avant vendredi vient jeudi.',
        'LUN → MAR → MER → JEU → VEN → SAM → DIM','Suite des jours de la semaine',[
          q('Après lundi vient :',['mardi','vendredi','dimanche'],'mardi','L’ordre de la semaine est fixe.'),
          q('Après jeudi vient :',['vendredi','mardi','dimanche'],'vendredi','Vendredi suit jeudi.'),
          q('Avant mercredi vient :',['mardi','jeudi','samedi'],'mardi','Mardi précède mercredi.'),
          q('Comment trouver le jour suivant ?',['Avancer d’une place dans l’ordre','Choisir au hasard','Changer toute la semaine'],'Avancer d’une place dans l’ordre','La liste ordonnée permet de raisonner.')]),
      cp1Lesson('Aujourd’hui, hier et demain',
        '« Aujourd’hui » est le jour où nous sommes. « Hier » est le jour avant. « Demain » est le jour après.',
        'Si aujourd’hui est mardi, hier était lundi et demain sera mercredi. Tu peux utiliser la suite des jours pour vérifier.',
        'Exemple : lundi → mardi → mercredi : hier → aujourd’hui → demain.',
        '⬅️ HIER   📍 AUJOURD’HUI   ➡️ DEMAIN','Hier, aujourd’hui et demain',[
          q('Le jour où nous sommes s’appelle :',['aujourd’hui','hier','demain'],'aujourd’hui','Aujourd’hui désigne le jour présent.'),
          q('Le jour avant aujourd’hui est :',['hier','demain','toujours dimanche'],'hier','Hier est le jour précédent.'),
          q('Si aujourd’hui est mardi, demain est :',['mercredi','lundi','vendredi'],'mercredi','Mercredi vient après mardi.'),
          q('Si aujourd’hui est jeudi, hier était :',['mercredi','vendredi','samedi'],'mercredi','Mercredi précède jeudi.')]),
      cp1Lesson('Observer le temps qu’il fait',
        'Regarde dehors. Le soleil peut briller, le ciel peut être nuageux ou la pluie peut tomber. Dis seulement ce que tu observes.',
        'Observer, ce n’est pas deviner. Si tu vois de gros nuages mais aucune pluie, tu peux dire « le ciel est nuageux » sans dire qu’il pleut déjà.',
        'Exemple : ☀️ = ensoleillé ; ☁️ = nuageux ; 🌧️ = pluvieux.',
        '☀️  ☁️  🌧️','Soleil, nuages et pluie',[
          q('Le soleil brille. Le temps est :',['ensoleillé','pluvieux','neigeux'],'ensoleillé','On décrit ce que l’on voit.'),
          q('Il pleut. Le temps est :',['pluvieux','sec sans pluie','toujours venteux'],'pluvieux','La pluie est l’indice principal.'),
          q('Il y a des nuages mais pas de pluie. La réponse précise est :',['nuageux','il pleut forcément','la nuit'],'nuageux','On ne doit pas ajouter une information non observée.'),
          q('Pourquoi regarder avant de répondre ?',['Pour utiliser des indices réels','Pour deviner','Pour changer la météo'],'Pour utiliser des indices réels','L’observation rend la réponse plus juste.')]),
      cp1Lesson('Matin, midi, soir et nuit',
        'La journée a différents moments. Le matin vient après le réveil. Midi se situe au milieu de la journée. Le soir arrive vers la fin du jour, puis vient la nuit.',
        'Certains gestes sont liés à ces moments : se lever le matin, manger à des heures prévues, se préparer au repos le soir.',
        'Exemple : 🌅 matin ; ☀️ midi ; 🌇 soir ; 🌙 nuit.',
        '🌅  ☀️  🌇  🌙','Quatre moments de la journée',[
          q('Quel moment vient après la nuit et le réveil ?',['le matin','le soir','midi'],'le matin','Le matin commence la nouvelle journée.'),
          q('Quel symbole représente la nuit ?',['🌙','☀️','🌅'],'🌙','La lune représente ici la nuit.'),
          q('Le soir vient généralement :',['avant la nuit','avant le matin de la même journée','au milieu de la nuit'],'avant la nuit','Le soir précède la nuit.'),
          q('Pourquoi connaître les moments de la journée ?',['Pour mieux situer les activités dans le temps','Pour changer les jours','Pour compter les couleurs'],'Pour mieux situer les activités dans le temps','Le temps aide à organiser les actions.')]),
      cp1Lesson('Préparer son matériel',
        'Avant le travail, regarde ce dont tu as besoin : cahier, crayon, ardoise, livre ou règle. Prépare seulement le matériel utile.',
        'Préparer à l’avance évite de chercher pendant l’exercice. Demande-toi : « Quelle activité vais-je faire ? Quel objet m’aide ? »',
        'Exemple : pour écrire, je prépare mon cahier et mon crayon.',
        '🎒  📒  ✏️  📏','Cartable et matériel scolaire',[
          q('Pour écrire, tu prépares :',['cahier et crayon','ballon et assiette','chaussure et cuillère'],'cahier et crayon','Ces objets correspondent à l’activité d’écriture.'),
          q('Pour tracer une ligne droite, quel outil peut aider ?',['une règle','une mangue','un savon'],'une règle','La règle fournit un bord droit.'),
          q('Pourquoi préparer avant ?',['Pour gagner du temps et être prêt','Pour perdre le matériel','Pour empêcher le cours'],'Pour gagner du temps et être prêt','Anticiper développe l’autonomie.'),
          q('Quelle question aide à choisir le matériel ?',['Qu’est-ce que je vais faire ?','Quelle est ma couleur préférée ?','Quel est le nom du voisin ?'],'Qu’est-ce que je vais faire ?','La tâche détermine l’outil utile.')]),
      cp1Lesson('Dire ce dont j’ai besoin',
        'Tu peux dire clairement un besoin : « J’ai soif », « Je ne me sens pas bien », « Je n’ai pas compris », « Puis-je aller aux toilettes ? ».',
        'Une phrase claire aide l’adulte à comprendre et à répondre. Ne cache pas une douleur ou un problème important.',
        'Exemple : « Maîtresse, je n’ai pas compris la consigne. Pouvez-vous répéter ? »',
        '🙋🏾  💬  🧑🏾‍🏫','Enfant qui demande de l’aide',[
          q('Tu ne comprends pas. Tu dis :',['Pouvez-vous répéter ?','Je réponds au hasard','Je déchire mon cahier'],'Pouvez-vous répéter ?','Demander une explication est une bonne stratégie.'),
          q('Tu te sens malade. Tu :',['préviens l’adulte','le caches toujours','cours davantage'],'préviens l’adulte','Un adulte peut t’aider.'),
          q('Pourquoi parler clairement ?',['Pour que le besoin soit compris','Pour faire plus de bruit','Pour cacher le problème'],'Pour que le besoin soit compris','Une phrase précise facilite l’aide.'),
          q('Une douleur forte doit être :',['signalée','toujours cachée','ignorée'],'signalée','La santé et la sécurité sont prioritaires.')]),
      cp1Lesson('Dire comment je me sens',
        'Tu peux être content, triste, inquiet, fâché, fatigué ou calme. Donner un nom à ce que tu ressens aide à mieux l’expliquer.',
        'Une émotion n’est pas une permission de faire du mal. Si tu es fâché, tu peux parler, respirer calmement et demander de l’aide.',
        'Exemple : « Je suis inquiet parce que je ne trouve pas mon cahier. »',
        '😀  😢  😟  😠  😌','Visages exprimant des émotions',[
          q('Tu souris parce que tu es heureux. Tu peux dire :',['Je suis content','Je suis une table','Je suis lundi'],'Je suis content','Le mot décrit une émotion.'),
          q('Tu es fâché. As-tu le droit de frapper ?',['Non','Oui'],'Non','Une émotion doit être gérée sans violence.'),
          q('Que peux-tu faire si tu es inquiet ?',['expliquer à un adulte de confiance','cacher toujours','faire mal à quelqu’un'],'expliquer à un adulte de confiance','Mettre des mots sur le problème aide à chercher une solution.'),
          q('Pourquoi nommer une émotion ?',['Pour mieux l’exprimer et la comprendre','Pour la rendre plus forte obligatoirement','Pour changer le jour'],'Pour mieux l’exprimer et la comprendre','Le vocabulaire émotionnel aide à communiquer.')]),
      cp1Lesson('Vérifier sa propreté avant le travail',
        'Avant de commencer, assure-toi que tes mains sont propres et que ton espace de travail est rangé. Un cahier propre et un crayon prêt facilitent le travail.',
        'Une petite vérification évite plusieurs problèmes. Regarde tes mains, ton bureau et ton matériel avant de commencer.',
        'Exemple : mains propres → cahier posé → crayon prêt.',
        '🧼  👐🏾  📒  ✏️','Mains propres et matériel prêt',[
          q('Avant de travailler, les mains doivent être :',['propres','couvertes de boue','pleines de déchets'],'propres','La propreté protège le matériel et l’hygiène.'),
          q('Un espace rangé aide :',['à mieux trouver le matériel','à perdre les objets','à salir le cahier'],'à mieux trouver le matériel','L’ordre réduit les distractions et pertes.'),
          q('Quelle petite vérification est utile ?',['mains, bureau, matériel','seulement le ciel','seulement les chaussures du voisin'],'mains, bureau, matériel','On vérifie ce qui est lié au travail.'),
          q('Pourquoi préparer un crayon avant ?',['Pour être prêt à écrire','Pour le cacher','Pour éviter tout travail'],'Pour être prêt à écrire','Le matériel prêt facilite le démarrage.')]),
      cp1Lesson('Écouter et redire une consigne',
        'Écoute toute la consigne. Ensuite, essaie de la redire avec tes mots avant d’agir.',
        'Redire permet de vérifier si tu as compris. Si ta phrase n’est pas claire, écoute encore ou demande de répéter.',
        'Exemple : « Ouvre ton cahier et écris ton prénom. » Tu redis : « Je dois ouvrir mon cahier puis écrire mon prénom. »',
        '👂🏾  💬  📒  ✍🏾','Écouter puis reformuler une consigne',[
          q('Après avoir écouté, tu peux :',['redire la consigne','agir au hasard','l’oublier volontairement'],'redire la consigne','Reformuler vérifie la compréhension.'),
          q('Consigne : « Prends le crayon puis ouvre le cahier. » Que fais-tu d’abord ?',['prendre le crayon','fermer le cahier','sortir de la classe'],'prendre le crayon','Le mot « puis » indique l’ordre.'),
          q('Tu ne peux pas redire la consigne. Tu :',['écoutes encore ou demandes','inventes','copies le voisin sans comprendre'],'écoutes encore ou demandes','Il vaut mieux clarifier avant d’agir.'),
          q('Pourquoi reformuler ?',['Pour vérifier ce qu’on a compris','Pour changer la consigne','Pour parler plus fort'],'Pour vérifier ce qu’on a compris','La reformulation est une stratégie d’apprentissage.')]),
      cp1Lesson('Raconter un petit fait',
        'Tu peux raconter une chose simple qui s’est passée : qui était là ? où ? qu’est-ce qui s’est passé ? Utilise des phrases courtes.',
        'Un bon petit récit suit un ordre. Commence par le début, puis dis ce qui s’est passé ensuite. Évite d’ajouter des choses que tu n’as pas vues si tu racontes un fait réel.',
        'Exemple : « Hier, j’ai vu une chèvre près de la maison. Elle mangeait de l’herbe. »',
        '🏠  🐐  🌿  💬','Enfant racontant un fait observé',[
          q('Pour raconter clairement, tu peux répondre à :',['qui, où, quoi','seulement quelle couleur','seulement combien'],'qui, où, quoi','Ces questions donnent les informations principales.'),
          q('Un récit doit suivre :',['un ordre','le hasard','aucune suite'],'un ordre','L’ordre aide l’auditeur à comprendre.'),
          q('Tu racontes un fait réel. Dois-tu inventer une chose que tu n’as pas vue ?',['Non','Oui toujours'],'Non','Il faut distinguer observation et invention.'),
          q('Quelle phrase est claire ?',['Hier, j’ai vu une chèvre près de la maison.','Chèvre hier peut-être partout chose.','Rien rien.'],'Hier, j’ai vu une chèvre près de la maison.','La phrase donne le moment, l’action et le lieu.')]),
      cp1Lesson('Préparer la journée et se rappeler ce qu’on a appris',
        'Au début, nous pouvons dire ce que nous allons faire. À la fin, nous pouvons dire une chose apprise ou une difficulté rencontrée.',
        'Se rappeler aide la mémoire. Demande-toi : « Qu’ai-je compris ? Qu’est-ce qui reste difficile ? Que vais-je essayer demain ? »',
        'Exemple : « Aujourd’hui, j’ai appris le nombre 8. Demain, je veux encore m’entraîner à l’écrire. »',
        '📅  📘  🧠  ✅','Planning simple et rappel des apprentissages',[
          q('À la fin de la journée, tu peux dire :',['ce que tu as appris','seulement ton prénom toujours','rien par obligation'],'ce que tu as appris','Rappeler l’apprentissage renforce la mémoire.'),
          q('Une notion reste difficile. Tu :',['la signales et prévois de t’entraîner','la caches toujours','dis qu’elle n’existe pas'],'la signales et prévois de t’entraîner','Identifier une difficulté aide à progresser.'),
          q('Quelle question développe l’autocorrection ?',['Qu’est-ce que je dois encore améliorer ?','Quelle réponse puis-je copier ?','Comment éviter tout effort ?'],'Qu’est-ce que je dois encore améliorer ?','Réfléchir sur son travail aide à devenir autonome.'),
          q('Pourquoi préparer la journée ?',['Pour savoir ce qu’on va faire','Pour supprimer les leçons','Pour changer la semaine'],'Pour savoir ce qu’on va faire','Un objectif simple donne une direction au travail.')])
    ],

    francais: [
      cp1Lesson(
        'Saluer et se présenter',
        'Quand tu rencontres une personne, tu peux dire « Bonjour ». Pour dire ton nom, tu dis : « Je m’appelle Awa ». Tu parles doucement et clairement.',
        'Choisis la phrase selon ce que tu veux faire. Pour saluer : « Bonjour ». Pour donner ton nom : « Je m’appelle… ». Pour demander le nom : « Comment tu t’appelles ? ».',
        'Exemple : « Bonjour. Je m’appelle Sory. Comment tu t’appelles ? »',
        '👋🏾  🧒🏾  👧🏾',
        'Deux enfants se saluent',
        [
          q('Le matin, tu rencontres ton maître. Tu dis :', ['Bonjour', 'Au revoir', 'Bonne nuit'], 'Bonjour', '« Bonjour » sert à saluer dans la journée.'),
          q('Pour dire ton nom, tu choisis :', ['Je m’appelle Fanta.', 'Il pleut.', 'Ferme la porte.'], 'Je m’appelle Fanta.', 'Cette phrase sert à se présenter.'),
          q('Pour demander le nom de ton camarade :', ['Comment tu t’appelles ?', 'Combien coûte le riz ?', 'Où est la route ?'], 'Comment tu t’appelles ?', 'Cette question demande le nom.'),
          q('Quelle réponse montre que tu as compris la question « Comment tu t’appelles ? » ?', ['Je m’appelle Alpha.', 'J’ai deux crayons.', 'Il fait chaud.'], 'Je m’appelle Alpha.', 'La réponse doit donner le nom demandé.')
        ]
      ),
      cp1Lesson(
        'Les objets de la classe',
        'Dans la classe, tu vois un cahier, un livre, un crayon, une règle, une ardoise et un cartable. Chaque objet a un nom. Écoute le nom et regarde l’objet.',
        'Pour reconnaître un objet, regarde à quoi il sert. Le crayon sert à écrire. Le cahier reçoit ton travail. Le cartable sert à transporter tes affaires.',
        'Exemple : si tu dois tracer une ligne droite, la règle peut t’aider.',
        '✏️  📘  📒  📏  🎒',
        'Crayon, livre, cahier, règle et cartable',
        [
          q('Avec quoi écris-tu le plus souvent ?', ['un crayon', 'une assiette', 'une chaussure'], 'un crayon', 'Le crayon sert à écrire ou dessiner.'),
          q('Où ranges-tu souvent tes livres pour aller à l’école ?', ['dans le cartable', 'dans une casserole', 'dans une chaussure'], 'dans le cartable', 'Le cartable sert à transporter le matériel scolaire.'),
          q('Quel objet aide à tracer une ligne droite ?', ['la règle', 'la mangue', 'le ballon'], 'la règle', 'La règle donne un bord droit.'),
          q('Tu dois écrire une leçon. Quel duo est le plus utile ?', ['cahier et crayon', 'ballon et sandale', 'assiette et cuillère'], 'cahier et crayon', 'On choisit les objets selon la tâche à faire.')
        ]
      ),
      cp1Lesson(
        'Comprendre une consigne simple',
        'Une consigne dit ce que tu dois faire. « Écoute », « regarde », « entoure », « montre », « lève-toi » sont des consignes. Écoute toute la phrase avant d’agir.',
        'Une bonne méthode est : j’écoute, je comprends, puis j’agis. Si tu n’as pas compris, tu peux demander : « Pouvez-vous répéter, s’il vous plaît ? ».',
        'Exemple : si le maître dit « Entoure le rond », tu cherches d’abord le rond, puis tu l’entoures.',
        '👂🏾  👀  ✏️  ✅',
        'Écouter, regarder puis agir',
        [
          q('Le maître dit « Levez-vous ». Que fais-tu ?', ['Je me lève', 'Je m’assieds', 'Je ferme mon cahier seulement'], 'Je me lève', 'La consigne demande de se mettre debout.'),
          q('La consigne dit « Montre le livre ». Tu dois :', ['montrer le livre', 'cacher le livre', 'montrer ton pied'], 'montrer le livre', 'Il faut agir sur l’objet demandé.'),
          q('Tu n’as pas compris. Que fais-tu ?', ['Je demande de répéter', 'Je réponds au hasard', 'Je crie'], 'Je demande de répéter', 'Demander une explication aide à apprendre correctement.'),
          q('Quel ordre est le meilleur ?', ['J’écoute, je comprends, j’agis', 'J’agis, puis j’écoute', 'Je choisis au hasard'], 'J’écoute, je comprends, j’agis', 'Comprendre la consigne avant d’agir évite beaucoup d’erreurs.')
        ]
      ),
      cp1Sound('a', '[a]', 'papa', 'maman', 'lit', '👨🏾  👩🏾  🔤 a'),
      cp1Sound('i', '[i]', 'riz', 'lit', 'maman', '🍚  🛏️  🔤 i'),
      cp1Sound('o', '[o]', 'moto', 'vélo', 'riz', '🏍️  🚲  🔤 o'),
      cp1Sound('u', '[u]', 'lune', 'jupe', 'papa', '🌙  👗  🔤 u'),
      cp1Sound('é', '[é]', 'école', 'bébé', 'moto', '🏫  👶🏾  🔤 é'),
      cp1Sound('m', '[m]', 'maman', 'moto', 'riz', '👩🏾  🏍️  🔤 m'),
      cp1Sound('l', '[l]', 'lune', 'lit', 'papa', '🌙  🛏️  🔤 l'),
      cp1Sound('p', '[p]', 'papa', 'poule', 'riz', '👨🏾  🐔  🔤 p'),
      cp1Sound('t', '[t]', 'table', 'tapis', 'moto', '🪑  🧶  🔤 t'),
      cp1Sound('n', '[n]', 'nez', 'natte', 'papa', '👃🏾  🧺  🔤 n'),
      cp1Sound('r', '[r]', 'riz', 'route', 'maman', '🍚  🛣️  🔤 r'),
      cp1Sound('s', '[s]', 'sac', 'savon', 'moto', '🎒  🧼  🔤 s'),
      cp1Sound('f', '[f]', 'fleur', 'fille', 'moto', '🌼  👧🏾  🔤 f'),
      cp1Sound('v', '[v]', 'vélo', 'vache', 'riz', '🚲  🐄  🔤 v'),
      cp1Sound('b', '[b]', 'banane', 'ballon', 'riz', '🍌  ⚽  🔤 b'),
      cp1Sound('d', '[d]', 'dos', 'dame', 'riz', '🧍🏾  👩🏾  🔤 d'),
      cp1Sound('j', '[j]', 'jeu', 'jus', 'moto', '🎲  🧃  🔤 j'),
      cp1Sound('ch', '[ch]', 'chat', 'chemin', 'moto', '🐈  🛤️  🔤 ch'),
      cp1Sound('ou', '[ou]', 'poule', 'route', 'lit', '🐔  🛣️  🔤 ou'),
      cp1Sound('on', '[on]', 'ballon', 'mouton', 'riz', '⚽  🐑  🔤 on'),
      cp1Sound('an', '[an]', 'mangue', 'maman', 'riz', '🥭  👩🏾  🔤 an'),
      cp1Sound('in', '[in]', 'matin', 'lapin', 'moto', '🌅  🐇  🔤 in'),
      cp1Syllables('Lire ma, mi, la, li', ['ma','mi','la','li'], '👄  ma  mi  la  li'),
      cp1Syllables('Lire pa, pi, ta, ti', ['pa','pi','ta','ti'], '👄  pa  pi  ta  ti'),
      cp1Syllables('Lire na, ni, ra, ri', ['na','ni','ra','ri'], '👄  na  ni  ra  ri'),
      cp1Syllables('Lire sa, si, fa, fi', ['sa','si','fa','fi'], '👄  sa  si  fa  fi'),
      cp1Syllables('Lire va, vi, ba, bi', ['va','vi','ba','bi'], '👄  va  vi  ba  bi'),
      cp1Lesson(
        'Lire des mots de deux syllabes',
        'Un mot peut être coupé en petits morceaux. « moto » se lit mo-to. « bébé » se lit bé-bé. Lis d’abord chaque syllabe, puis réunis-les.',
        'Quand un mot semble difficile, ne le devine pas avec l’image seulement. Regarde les lettres. Coupe le mot en syllabes, lis chaque partie, puis rassemble le mot.',
        'Exemple : mo + to = moto. vé + lo = vélo.',
        '🏍️  mo-to   🚲  vé-lo',
        'Moto et vélo avec leurs syllabes',
        [
          q('mo + to donne :', ['moto', 'tomo', 'momo'], 'moto', 'On garde l’ordre des deux syllabes : mo puis to.'),
          q('bé + bé donne :', ['bébé', 'béba', 'bibi'], 'bébé', 'Les deux syllabes sont identiques.'),
          q('Quel mot a deux syllabes ?', ['vé-lo', 'a', 'i'], 'vé-lo', '« vélo » peut être lu en deux syllabes : vé-lo.'),
          q('Un mot est difficile. Quelle stratégie aide ?', ['Le couper en syllabes', 'Le choisir au hasard', 'Ne pas regarder les lettres'], 'Le couper en syllabes', 'Découper le mot réduit la difficulté et aide à lire avec méthode.')
        ]
      ),
      cp1Lesson(
        'Lire des mots de trois syllabes',
        'Certains mots ont trois syllabes. « banane » peut se lire ba-na-ne. « tomate » peut se lire to-ma-te. Avance morceau par morceau.',
        'Pour ne pas perdre l’ordre, pointe chaque syllabe avec le doigt pendant que tu lis. Après la troisième, redis le mot entier normalement.',
        'Exemple : ba + na + ne = banane.',
        '🍌  ba-na-ne   🍅  to-ma-te',
        'Banane et tomate avec trois syllabes',
        [
          q('ba + na + ne donne :', ['banane', 'nabane', 'banana'], 'banane', 'On lit les syllabes dans l’ordre.'),
          q('to + ma + te donne :', ['tomate', 'matote', 'totoma'], 'tomate', 'Les trois syllabes forment le mot « tomate ».'),
          q('Pourquoi pointer chaque syllabe ?', ['Pour garder l’ordre', 'Pour changer le mot', 'Pour oublier les lettres'], 'Pour garder l’ordre', 'Le doigt aide l’œil à suivre la lecture sans sauter de partie.'),
          q('Quel mot a trois syllabes ?', ['ba-na-ne', 'vé-lo', 'riz'], 'ba-na-ne', 'On entend trois groupes : ba, na, ne.')
        ]
      ),
      cp1Lesson(
        'Reconnaître et lire un prénom',
        'Un prénom commence par une majuscule. Awa, Fanta, Sory, Mariama sont des prénoms. Regarde la première lettre puis lis le reste du mot.',
        'Deux prénoms peuvent commencer par la même lettre. Il faut donc regarder tout le mot. « Fanta » et « Fatou » commencent par F, mais ils ne sont pas identiques.',
        'Exemple : Awa commence par A. Sory commence par S.',
        '👧🏾 Awa   🧒🏾 Sory   👧🏾 Fanta',
        'Enfants avec leurs prénoms',
        [
          q('Quel mot est un prénom ?', ['Awa', 'table', 'mangue'], 'Awa', 'Awa est le nom d’une personne.'),
          q('Par quelle lettre commence Sory ?', ['S', 'A', 'M'], 'S', 'La première lettre de Sory est S.'),
          q('Fanta et Fatou commencent toutes les deux par :', ['F', 'T', 'A'], 'F', 'Il faut regarder le début des deux mots.'),
          q('Deux prénoms commencent par F. Comment savoir lequel est « Fanta » ?', ['Je regarde tout le mot', 'Je regarde seulement F', 'Je choisis au hasard'], 'Je regarde tout le mot', 'La première lettre donne un indice, mais le reste du mot permet de distinguer les prénoms.')
        ]
      ),
      cp1Lesson(
        'Un, une, le et la',
        'Devant un nom, on trouve souvent un petit mot. On dit « un cahier », « une table », « le livre », « la porte ». Ces petits mots accompagnent le nom.',
        'Le petit mot doit aller avec le nom. On apprend les groupes entiers : « une mangue », « un crayon », « la classe », « le sac ». Écoute les groupes et répète.',
        'Exemple : un livre ; une règle ; le cahier ; la porte.',
        '📘 un livre   📏 une règle',
        'Livre et règle avec leurs articles',
        [
          q('Complète : ___ livre.', ['un', 'une', 'la'], 'un', 'On dit « un livre ».'),
          q('Complète : ___ règle.', ['une', 'un', 'le'], 'une', 'On dit « une règle ».'),
          q('Quel groupe est correct ?', ['la porte', 'le porte', 'un porte'], 'la porte', 'On apprend le nom avec le petit mot qui l’accompagne.'),
          q('Pourquoi apprend-on « un cahier » plutôt que seulement « cahier » ?', ['Pour connaître aussi le petit mot qui accompagne le nom', 'Pour rendre le mot plus long sans raison', 'Pour oublier le nom'], 'Pour connaître aussi le petit mot qui accompagne le nom', 'Apprendre le groupe aide à parler et écrire plus correctement.')
        ]
      ),
      cp1Lesson(
        'Un seul ou plusieurs',
        'Quand il y a un seul objet, on parle au singulier : « un livre ». Quand il y en a plusieurs, on parle au pluriel : « des livres ». Souvent, le nom prend un s à l’écrit.',
        'Regarde d’abord la quantité. Un objet : singulier. Deux ou plusieurs : pluriel. Le sens vient avant la règle d’écriture.',
        'Exemple : 📘 = un livre. 📘📘📘 = des livres.',
        '📘   📘📘📘',
        'Un livre puis plusieurs livres',
        [
          q('Tu vois un seul cahier. Tu dis :', ['un cahier', 'des cahiers', 'les cahier'], 'un cahier', 'Un seul objet correspond au singulier.'),
          q('Tu vois trois mangues. Tu dis :', ['des mangues', 'une mangue', 'un mangue'], 'des mangues', 'Plusieurs objets correspondent au pluriel.'),
          q('Quel groupe montre le pluriel ?', ['des livres', 'un livre', 'une règle'], 'des livres', '« des » indique ici plusieurs livres.'),
          q('Avant de choisir singulier ou pluriel, que faut-il observer ?', ['La quantité', 'La couleur seulement', 'Le jour de la semaine'], 'La quantité', 'Le nombre d’objets permet de savoir si on parle d’un seul ou de plusieurs.')
        ]
      ),
      cp1Lesson(
        'Masculin et féminin : premiers repères',
        'Certains noms vont souvent avec « un » ou « le » : un garçon, le cahier. D’autres vont avec « une » ou « la » : une fille, la table. Nous apprenons ces groupes simplement.',
        'Ne devine pas le genre avec la forme de l’objet. Une table n’est pas une personne, mais on dit « une table ». Il faut écouter et mémoriser le groupe correct.',
        'Exemple : un garçon ; une fille ; un livre ; une porte.',
        '🧒🏾 un garçon   👧🏾 une fille',
        'Garçon et fille avec articles',
        [
          q('Quel groupe est correct ?', ['un garçon', 'une garçon', 'la garçon'], 'un garçon', 'On dit « un garçon ».'),
          q('Quel groupe est correct ?', ['une fille', 'un fille', 'le fille'], 'une fille', 'On dit « une fille ».'),
          q('On dit :', ['une table', 'un table', 'le table'], 'une table', 'Le nom « table » s’emploie ici avec « une ».'),
          q('Peut-on toujours deviner masculin ou féminin en regardant l’objet ?', ['Non', 'Oui, toujours'], 'Non', 'Le genre grammatical s’apprend avec le mot et son article.')
        ]
      ),
      cp1Lesson(
        'Mettre les mots dans le bon ordre',
        'Une phrase doit avoir des mots dans un ordre qui donne du sens. « Awa lit. » est clair. « Lit Awa. » n’est pas la forme simple que nous apprenons ici.',
        'Pour construire une petite phrase, demande : qui fait l’action ? puis quelle action ? Exemple : « Moussa court. » Moussa est celui qui agit. Court dit ce qu’il fait.',
        'Exemple : Fanta chante. Sory joue.',
        '👧🏾 ➜ 📖   Awa lit.',
        'Awa lit un livre',
        [
          q('Quelle phrase est dans le bon ordre ?', ['Awa lit.', 'Lit Awa.', 'Awa. lit'], 'Awa lit.', 'On place d’abord qui agit, puis l’action.'),
          q('Mets l’idée dans le bon ordre : « court / Moussa ».', ['Moussa court.', 'Court Moussa.', 'Moussa. court'], 'Moussa court.', 'Moussa est celui qui fait l’action de courir.'),
          q('Dans « Fanta chante. », qui fait l’action ?', ['Fanta', 'chante', 'personne'], 'Fanta', 'Fanta est la personne qui chante.'),
          q('Pour construire une phrase simple, quelle question aide ?', ['Qui fait quoi ?', 'Quelle couleur a lundi ?', 'Combien pèse un mot ?'], 'Qui fait quoi ?', 'Chercher la personne ou chose puis l’action aide à organiser la phrase.')
        ]
      ),
      cp1Lesson(
        'La majuscule et le point',
        'Une phrase écrite commence par une majuscule. Elle se termine souvent par un point. Exemple : « Awa lit. » Le A est grand au début et le point ferme la phrase.',
        'La majuscule montre où la phrase commence. Le point montre où elle finit. Ces signes aident le lecteur à comprendre le texte.',
        'Exemple : « Moussa joue. »',
        '🔠 Awa lit. 🔵',
        'Phrase avec majuscule et point',
        [
          q('Quelle phrase commence correctement ?', ['Awa lit.', 'awa lit.', 'awa Lit.'], 'Awa lit.', 'La phrase commence par une majuscule.'),
          q('Quel signe termine la phrase « Sory joue » ?', ['.', '?', ','], '.', 'Une phrase déclarative simple se termine par un point.'),
          q('À quoi sert la majuscule au début ?', ['À montrer le début de la phrase', 'À compter les mots', 'À remplacer tous les sons'], 'À montrer le début de la phrase', 'Elle aide à repérer le commencement.'),
          q('Quelle phrase est bien écrite ?', ['Fanta chante.', 'fanta chante', 'Fanta chante'], 'Fanta chante.', 'Il faut une majuscule au début et un point à la fin.')
        ]
      ),
      cp1Lesson(
        'Poser une question simple',
        'Une question sert à demander une information. Elle peut commencer par « Où », « Qui », « Quoi », « Comment » ou « Combien ». À l’écrit, elle se termine par un point d’interrogation.',
        'Avant de poser une question, demande-toi ce que tu veux savoir. Si tu veux connaître un lieu, tu peux utiliser « Où ». Si tu veux connaître une personne, tu peux utiliser « Qui ».',
        'Exemple : « Où est mon cahier ? »',
        '❓  Où est mon cahier ?',
        'Enfant qui pose une question',
        [
          q('Quel signe termine une question ?', ['?', '.', '!'], '?', 'Le point d’interrogation marque une question.'),
          q('Tu veux connaître un lieu. Quel mot peut commencer ta question ?', ['Où', 'Merci', 'Rouge'], 'Où', '« Où » sert à demander un lieu.'),
          q('Quelle phrase est une question ?', ['Qui est là ?', 'Awa est là.', 'Voici Awa.'], 'Qui est là ?', 'Elle demande une information et se termine par ?.'),
          q('Tu veux connaître le nombre de mangues. Tu demandes :', ['Combien de mangues ?', 'Où est la mangue ?', 'Bonjour mangue.'], 'Combien de mangues ?', '« Combien » sert à demander une quantité.')
        ]
      ),
      cp1Lesson(
        'Les mots de la famille',
        'La famille peut comprendre la mère, le père, les frères, les sœurs et d’autres proches. Nous apprenons les mots pour parler des personnes qui nous entourent.',
        'Pour comprendre une phrase sur la famille, cherche qui est la personne. « Awa est la sœur de Sory » donne une relation entre deux personnes.',
        'Exemple : « Voici ma mère. Voici mon frère. »',
        '👨🏾  👩🏾  👧🏾  🧒🏾',
        'Une famille',
        [
          q('Quel mot désigne une personne de la famille ?', ['mère', 'table', 'route'], 'mère', 'La mère est un membre de la famille.'),
          q('Le frère de Fanta est un :', ['garçon de sa famille', 'objet de classe', 'lieu'], 'garçon de sa famille', 'Le mot « frère » indique une relation familiale.'),
          q('Dans « Awa est la sœur de Sory », qui est la sœur ?', ['Awa', 'Sory', 'personne'], 'Awa', 'La phrase dit directement qu’Awa est la sœur.'),
          q('Pourquoi apprend-on ces mots ?', ['Pour parler clairement de sa famille', 'Pour compter les routes', 'Pour changer les prénoms'], 'Pour parler clairement de sa famille', 'Le vocabulaire donne des mots précis pour exprimer une idée.')
        ]
      ),
      cp1Lesson(
        'Les mots de la maison',
        'Dans une maison, on peut trouver une porte, une fenêtre, une chambre, une cour, une table et d’autres objets. Chaque mot aide à décrire le lieu où l’on vit.',
        'Pour décrire, relie l’objet à sa fonction. La porte permet d’entrer ou sortir. La fenêtre laisse passer la lumière et l’air quand elle est ouverte.',
        'Exemple : « La porte est ouverte. La fenêtre est fermée. »',
        '🏠  🚪  🪟',
        'Maison avec porte et fenêtre',
        [
          q('Par où entre-t-on souvent dans une maison ?', ['la porte', 'le toit', 'le cahier'], 'la porte', 'La porte sert notamment à entrer et sortir.'),
          q('Quel mot appartient au vocabulaire de la maison ?', ['fenêtre', 'addition', 'syllabe'], 'fenêtre', 'Une fenêtre est une partie de la maison.'),
          q('La fenêtre est ouverte. Qu’est-ce qui peut mieux passer ?', ['l’air', 'un cahier fermé', 'un nombre'], 'l’air', 'Une fenêtre ouverte permet notamment la circulation de l’air.'),
          q('Pour bien décrire une maison, que faut-il faire ?', ['Nommer les éléments et dire où ils sont', 'Choisir des mots au hasard', 'Parler seulement des nombres'], 'Nommer les éléments et dire où ils sont', 'Une description claire donne des informations précises.')
        ]
      ),
      cp1Lesson(
        'Les mots de l’école',
        'À l’école, il y a des élèves, des enseignants, une classe, une cour et du matériel. Ces mots permettent de raconter ce qui se passe pendant la journée scolaire.',
        'Un mot peut désigner une personne, un lieu ou un objet. « Élève » est une personne. « Classe » est un lieu. « Cahier » est un objet.',
        'Exemple : « L’élève entre dans la classe avec son cahier. »',
        '🏫  👩🏾‍🏫  🧒🏾  📒',
        'École, enseignante, élève et cahier',
        [
          q('Qui apprend dans la classe ?', ['l’élève', 'la table', 'la porte'], 'l’élève', 'L’élève est une personne qui apprend.'),
          q('Quel mot désigne un lieu ?', ['classe', 'crayon', 'élève'], 'classe', 'La classe est un espace de travail scolaire.'),
          q('Quel mot désigne un objet ?', ['cahier', 'maître', 'cour'], 'cahier', 'Le cahier est un objet utilisé pour travailler.'),
          q('Pourquoi classer les mots en personne, lieu ou objet ?', ['Pour mieux comprendre leur sens', 'Pour les rendre plus lourds', 'Pour changer l’école'], 'Pour mieux comprendre leur sens', 'Classer aide à organiser les informations et le vocabulaire.')
        ]
      ),
      cp1Lesson(
        'Les mots du marché et du quartier',
        'Au marché, on voit des vendeurs, des clients, des fruits, du riz et d’autres produits. Dans le quartier, on trouve des maisons, des rues, des boutiques et parfois une école ou un centre de santé.',
        'Pour comprendre un lieu, regarde les personnes et les actions. Au marché, quelqu’un peut vendre et quelqu’un peut acheter. Dans la rue, les personnes se déplacent. Les mots sont liés aux situations réelles.',
        'Exemple : « La vendeuse vend des mangues. Le client achète deux mangues. »',
        '🛍️  🥭  🏘️  🛣️',
        'Marché avec mangues et quartier',
        [
          q('Qui vend les produits au marché ?', ['le vendeur ou la vendeuse', 'le cahier', 'la fenêtre'], 'le vendeur ou la vendeuse', 'Le vendeur propose des produits aux clients.'),
          q('Quel mot appartient au quartier ?', ['rue', 'syllabe', 'addition'], 'rue', 'Une rue est une voie dans un quartier ou une ville.'),
          q('La vendeuse donne une mangue au client contre de l’argent. Que fait le client ?', ['Il achète', 'Il dort', 'Il écrit'], 'Il achète', 'Acheter signifie obtenir un produit en échange d’un paiement.'),
          q('Comment reconnaître un marché ?', ['En observant les vendeurs, clients et produits', 'En regardant seulement le ciel', 'En choisissant au hasard'], 'En observant les vendeurs, clients et produits', 'Les indices du lieu permettent de comprendre sa fonction.')
        ]
      ),
      cp1Lesson(
        'Comprendre un petit texte',
        'Écoute ou lis ce petit texte : « Awa va à l’école. Elle porte un cartable bleu. Dans son cartable, il y a un cahier et un crayon. » Écoute une première fois sans répondre.',
        'À la deuxième écoute, cherche les informations importantes : qui ? où ? quoi ? La réponse doit venir du texte. Tu n’inventes pas ce qui n’est pas dit.',
        'Texte : « Awa va à l’école. Elle porte un cartable bleu. Dans son cartable, il y a un cahier et un crayon. »',
        '👧🏾  🎒🔵  🏫  📒✏️',
        'Awa avec un cartable bleu allant à l’école',
        [
          q('Où va Awa ?', ['à l’école', 'au marché', 'à la rivière'], 'à l’école', 'Le texte dit : « Awa va à l’école. »'),
          q('De quelle couleur est son cartable ?', ['bleu', 'rouge', 'vert'], 'bleu', 'Le texte précise que le cartable est bleu.'),
          q('Qu’y a-t-il dans le cartable ?', ['un cahier et un crayon', 'une marmite et une assiette', 'un ballon seulement'], 'un cahier et un crayon', 'Cette information est donnée dans la dernière phrase.'),
          q('Le texte dit-il qu’Awa a un livre ?', ['Non', 'Oui'], 'Non', 'Le texte parle d’un cahier et d’un crayon, mais pas d’un livre. Il faut répondre avec les informations réellement données.')
        ]
      ),
      cp1Lesson(
        'Écrire une phrase simple',
        'Pour écrire une petite phrase, pense d’abord à une idée simple. Exemple : « Awa lit. » Commence par une majuscule, laisse un espace entre les mots et termine par un point.',
        'Relis ta phrase après l’avoir écrite. Pose trois questions : ai-je commencé par une majuscule ? Les mots sont-ils dans le bon ordre ? Ai-je mis le point ? Cette vérification te permet de corriger toi-même une partie de ton travail.',
        'Exemple : « Sory joue. »',
        '✍🏾  Awa lit.  ✅',
        'Enfant écrivant une phrase simple',
        [
          q('Quelle phrase peux-tu copier correctement ?', ['Awa lit.', 'awa lit', 'Lit. Awa'], 'Awa lit.', 'La phrase a une majuscule, un ordre simple et un point.'),
          q('Après avoir écrit, que dois-tu faire ?', ['Relire', 'Fermer les yeux et rendre tout de suite', 'Effacer toute la page'], 'Relire', 'Relire aide à repérer et corriger certaines erreurs.'),
          q('Quel ordre est correct ?', ['Sory joue.', 'Joue Sory.', 'sory joue'], 'Sory joue.', 'Le nom vient avant l’action dans cette phrase simple.'),
          q('Quels trois éléments dois-tu vérifier ?', ['Majuscule, ordre des mots, point', 'Couleur du ciel, prix du riz, taille de la table', 'Seulement le nombre de lettres'], 'Majuscule, ordre des mots, point', 'Cette petite méthode développe l’autocorrection.'),
          text('Écris exactement : Awa lit.', 'Awa lit.', 'Très bien. La phrase commence par une majuscule et se termine par un point.')
        ]
      )
    ],

    maths: [
      cp1Lesson('Beaucoup, peu et rien',
        'Regarde deux paniers. Un panier peut contenir beaucoup d’objets, peu d’objets ou rien. « Rien » veut dire qu’il n’y a aucun objet.',
        'Ne regarde pas seulement la taille du panier. Regarde ce qu’il contient. Un grand panier peut avoir peu de mangues et un petit panier peut en avoir beaucoup.',
        'Exemple : 🥭🥭🥭🥭🥭 = beaucoup ; 🥭 = peu ; panier vide = rien.',
        '🥭🥭🥭🥭🥭   🥭   🧺', 'Trois collections : beaucoup, peu et rien',[
          q('Où y a-t-il beaucoup de mangues ?',['🥭🥭🥭🥭🥭','🥭','(rien)'],'🥭🥭🥭🥭🥭','La première collection contient le plus d’objets.'),
          q('Où y a-t-il peu de mangues ?',['🥭','🥭🥭🥭🥭','(rien)'],'🥭','Une seule mangue est une petite quantité.'),
          q('Quel panier contient rien ?',['(vide)','🥭','🥭🥭'],'(vide)','Un panier vide ne contient aucun objet.'),
          q('Un grand panier est vide. Peut-on dire qu’il contient beaucoup ?',['Non','Oui'],'Non','On juge la quantité par les objets présents, pas par la taille du panier.')]),
      cp1Lesson('Plus, moins et autant',
        'Pour comparer deux groupes, nous utilisons « plus », « moins » et « autant ». « Autant » veut dire la même quantité.',
        'Mets les objets en paires : un objet du premier groupe avec un objet du second. S’il reste des objets dans un groupe, ce groupe en a plus.',
        'Exemple : ●●● et ■■. Deux paires sont faites ; il reste un rond. Les ronds sont plus nombreux.',
        '●●●   ■■', 'Deux collections à comparer',[
          q('Quel groupe a plus ?',['●●●●','■■','●'],'●●●●','Quatre est plus que deux ou un.'),
          q('Quel groupe a moins ?',['●','■■■','●●●●'],'●','Un est la plus petite quantité.'),
          q('●●● et ■■■ : y en a-t-il autant ?',['Oui','Non'],'Oui','Les deux groupes ont trois objets.'),
          q('Pourquoi faire des paires pour comparer ?',['Pour voir s’il reste des objets','Pour changer leur couleur','Pour les cacher'],'Pour voir s’il reste des objets','La correspondance un à un montre clairement quel groupe est plus grand.')]),
      cp1Lesson('Trier et classer',
        'Trier, c’est mettre ensemble les objets qui ont une propriété commune : même forme, même couleur, même taille ou même nature.',
        'Avant de trier, choisis une règle. Si la règle est la couleur, regarde la couleur. Si la règle est la forme, ne te laisse pas tromper par la taille.',
        'Exemple : 🔴🔴 vont ensemble par couleur ; 🔺🔺 vont ensemble par forme.',
        '🔴 🔵 🔴   🔺 🟦 🔺', 'Objets de couleurs et formes différentes',[
          q('On trie par couleur. Quel objet va avec 🔴 ?',['🔴','🔵','🟦'],'🔴','La règle choisie est la couleur.'),
          q('On trie par forme. Quel objet va avec 🔺 ?',['🔺','🟦','🔴'],'🔺','La règle choisie est la forme.'),
          q('Quel critère change entre un petit cercle rouge et un grand cercle rouge ?',['la taille','la forme','la couleur'],'la taille','La forme et la couleur restent identiques.'),
          q('Avant de classer, que faut-il savoir ?',['La règle de tri','Le prénom du voisin','Le jour seulement'],'La règle de tri','Une règle claire permet de décider où placer chaque objet.')]),
      cp1Lesson('Sur, sous, en haut et en bas',
        'Ces mots servent à dire où se trouve un objet. Un livre peut être sur la table. Un sac peut être sous la table. Un objet peut être en haut ou en bas.',
        'La position dépend d’un repère. Si le livre est sur la table, la table est sous le livre. Regarde toujours « par rapport à quoi ».',
        'Exemple : 📘 sur 🪑 ; 🎒 sous 🪑.',
        '📘\n🪑\n🎒', 'Livre sur une table et sac dessous',[
          q('Le livre est posé sur la table. Il est :',['sur la table','sous la table','dans la table'],'sur la table','Le livre repose au-dessus de la table.'),
          q('Le sac est sous la chaise. La chaise est :',['au-dessus du sac','sous le sac','dans le sac'],'au-dessus du sac','On change de point de vue.'),
          q('Quel mot indique une position élevée ?',['en haut','en bas','rien'],'en haut','« En haut » indique une position supérieure.'),
          q('Pourquoi faut-il connaître le repère ?',['Parce que la position est décrite par rapport à quelque chose','Pour compter les couleurs','Pour changer les objets'],'Parce que la position est décrite par rapport à quelque chose','Le même objet peut être devant une chose et derrière une autre.')]),
      cp1Lesson('Devant, derrière, entre, à côté, dedans et dehors',
        'Nous utilisons des mots précis pour situer : devant, derrière, entre, à côté, à l’intérieur et à l’extérieur.',
        'Imagine trois enfants alignés. Celui du milieu est entre les deux autres. Un ballon dans une boîte est à l’intérieur ; quand on le sort, il est à l’extérieur.',
        'Exemple : 🧒🏾 ⚽ 🧒🏾 : le ballon est entre les deux enfants.',
        '🧒🏾  ⚽  🧒🏾   📦', 'Repérage dans l’espace',[
          q('Le ballon est dans la boîte. Il est :',['à l’intérieur','à l’extérieur','derrière le ciel'],'à l’intérieur','Il se trouve dans la boîte.'),
          q('Awa est juste près de Fanta. Elle est :',['à côté','très loin','dessous'],'à côté','« À côté » signifie près, sur le côté.'),
          q('Le ballon est placé entre deux chaises. Où est-il ?',['entre les chaises','derrière les deux forcément','dans une chaise'],'entre les chaises','Il occupe la position centrale entre les deux repères.'),
          q('Tu changes de place. Les mots devant et derrière peuvent-ils changer ?',['Oui','Non, jamais'],'Oui','Ces positions dépendent du repère choisi.')]),
      cp1NumberLesson(1,'un','●','1 + 0','0 + 1'),
      cp1NumberLesson(2,'deux','●●','1 + 1','2 + 0'),
      cp1NumberLesson(3,'trois','●●●','2 + 1','1 + 2'),
      cp1NumberLesson(4,'quatre','●●●●','3 + 1','2 + 2'),
      cp1NumberLesson(5,'cinq','●●●●●','4 + 1','3 + 2'),
      cp1Lesson('Le nombre 0',
        'Zéro s’écrit 0. Il représente une quantité vide : aucun objet. Si tu enlèves le dernier objet d’un panier, il reste 0 objet.',
        'Zéro est un vrai nombre. Il sert à dire qu’une collection est vide et il tient une place importante dans les nombres comme 10 et 20.',
        'Exemple : 🧺 vide = 0 mangue.',
        '🧺  0', 'Panier vide et chiffre zéro',[
          q('Le panier est vide. Combien de mangues ?',['0','1','2'],'0','Aucun objet correspond à zéro.'),
          q('Quel chiffre signifie « rien dans la collection » ?',['0','5','9'],'0','0 représente une quantité nulle.'),
          q('Tu as 1 ballon et tu donnes ce ballon. Il reste :',['0','1','2'],'0','Après avoir retiré le seul ballon, la collection est vide.'),
          q('Zéro est-il un nombre ?',['Oui','Non'],'Oui','Il représente une quantité et sert dans notre système de numération.')]),
      cp1Lesson('Additionner jusqu’à 5',
        'Additionner, c’est réunir. Si tu as 2 mangues et que tu reçois 2 mangues, tu réunis tout : 2 + 2 = 4.',
        'Tu peux garder le premier nombre dans ta tête et avancer. Pour 3 + 2, pars de 3 : 4, 5. Le résultat est 5.',
        'Exemple : ●●● + ●● = ●●●●●.',
        '●●●  +  ●●  =  ●●●●●', 'Deux petites collections réunies',[
          n('2 + 2 = ?',4,'Deux objets et encore deux donnent quatre.','●● + ●●'),
          n('3 + 2 = ?',5,'Pars de 3 et avance de deux : 4, 5.','●●● + ●●'),
          n('1 + 3 = ?',4,'Un plus trois donne quatre.','● + ●●●'),
          q('Awa a 2 crayons et reçoit 1 crayon. Quelle opération ?',['2 + 1','2 − 1','1 − 2'],'2 + 1','La quantité augmente : on additionne.')]),
      cp1NumberLesson(6,'six','●●●●●●','5 + 1','3 + 3'),
      cp1NumberLesson(7,'sept','●●●●●●●','6 + 1','5 + 2'),
      cp1NumberLesson(8,'huit','●●●●●●●●','7 + 1','4 + 4'),
      cp1NumberLesson(9,'neuf','●●●●●●●●●','8 + 1','5 + 4'),
      cp1Lesson('Comparer et ranger les nombres de 0 à 9',
        'Comparer, c’est chercher quel nombre est plus grand, plus petit ou égal. Ranger, c’est mettre les nombres dans un ordre.',
        'Sur une bande numérique, les nombres avancent de 0 vers 9. Plus on va vers la droite, plus le nombre augmente.',
        'Exemple : 2 < 5 et 5 > 2. 4 = 4.',
        '0 1 2 3 4 5 6 7 8 9', 'Bande numérique de zéro à neuf',[
          q('Quel nombre est le plus grand ?',['8','3','5'],'8','8 vient après 3 et 5.'),
          q('Quel ordre va du plus petit au plus grand ?',['2, 4, 7','7, 4, 2','4, 2, 7'],'2, 4, 7','La suite augmente à chaque étape.'),
          q('Complète : 3 ___ 6',['<','>','='],'<','3 est plus petit que 6.'),
          q('Pourquoi la bande numérique aide-t-elle ?',['Elle montre l’ordre des nombres','Elle change leur valeur','Elle remplace le comptage toujours'],'Elle montre l’ordre des nombres','La position aide à voir quel nombre vient avant ou après.')]),
      cp1Lesson('Long, court et comparaison des longueurs',
        'La longueur dit si un objet est plus long ou plus court qu’un autre. Place les objets au même point de départ pour bien comparer.',
        'Si deux crayons ne commencent pas au même endroit, l’œil peut se tromper. Aligne une extrémité puis regarde lequel va le plus loin.',
        'Exemple : ━━━━━ est plus long que ━━.',
        '━━━━━━    ━━━', 'Deux traits de longueurs différentes',[
          q('Quel trait est le plus long ?',['━━━━━━','━━','━'],'━━━━━━','Il s’étend le plus loin.'),
          q('Pour comparer deux crayons, que fais-tu d’abord ?',['J’aligne une extrémité','Je les cache','Je regarde seulement la couleur'],'J’aligne une extrémité','Un même point de départ rend la comparaison juste.'),
          q('Un ruban A dépasse le ruban B après les avoir alignés. A est :',['plus long','plus court','égal forcément'],'plus long','Celui qui va plus loin est plus long.'),
          q('La couleur change-t-elle la longueur ?',['Non','Oui, toujours'],'Non','La longueur est une grandeur indépendante de la couleur.')]),
      cp1Lesson('Lourd et léger',
        'La masse nous aide à dire qu’un objet est plus lourd ou plus léger. Une pierre peut être plus lourde qu’une feuille.',
        'La taille ne suffit pas. Un grand ballon vide peut être plus léger qu’une petite pierre. Il faut comparer la masse, pas seulement regarder.',
        'Exemple : 🪨 est souvent plus lourd qu’une 🍃.',
        '🪨   🍃', 'Pierre et feuille à comparer',[
          q('Quel objet est généralement le plus lourd ?',['une pierre','une feuille','une plume'],'une pierre','La pierre a généralement une masse plus grande.'),
          q('Un gros ballon vide peut-il être plus léger qu’une petite pierre ?',['Oui','Non, jamais'],'Oui','La taille visible et la masse ne sont pas la même chose.'),
          q('Quel mot est le contraire de lourd ?',['léger','long','haut'],'léger','Lourd et léger servent à comparer des masses.'),
          q('Pour comparer correctement, faut-il regarder seulement la taille ?',['Non','Oui'],'Non','Il faut s’intéresser à la masse de l’objet.')]),
      cp1Lesson('Beaucoup ou peu de liquide : la capacité',
        'Un récipient peut contenir plus ou moins de liquide. Une grande bouteille peut avoir une grande capacité, mais il faut aussi regarder sa forme.',
        'Pour comparer deux récipients, on peut utiliser le même petit gobelet comme unité et compter combien de gobelets remplissent chacun.',
        'Exemple : si A reçoit 5 gobelets et B seulement 3, A contient davantage.',
        '🧴  🥤🥤🥤🥤🥤', 'Récipient et petits gobelets',[
          q('Un récipient rempli avec 5 gobelets contient plus que celui rempli avec :',['3 gobelets','6 gobelets','5 gobelets'],'3 gobelets','Cinq est plus que trois.'),
          q('Pourquoi utiliser le même gobelet pour comparer ?',['Pour avoir la même référence','Pour changer le goût','Pour décorer'],'Pour avoir la même référence','Une même unité rend la comparaison cohérente.'),
          q('Deux bouteilles ont la même hauteur mais des formes différentes. Ont-elles forcément la même capacité ?',['Non','Oui, toujours'],'Non','La forme complète du récipient compte.'),
          q('La capacité indique surtout :',['ce qu’un récipient peut contenir','sa couleur','son nom'],'ce qu’un récipient peut contenir','La capacité concerne la quantité qu’un contenant peut recevoir.')]),
      cp1Lesson('Le nombre 10 et la dizaine',
        'Dix unités forment une dizaine. Compte 10 bâtonnets puis attache-les ensemble : ce paquet représente 1 dizaine.',
        'Le nombre 10 s’écrit avec 1 puis 0. Le 1 représente une dizaine et le 0 indique qu’il n’y a pas d’unité seule à côté.',
        'Exemple : |||||||||| = 10 unités = 1 dizaine.',
        '🔟  ||||||||||', 'Dix unités regroupées',[
          q('Combien d’unités font une dizaine ?',['10','5','20'],'10','Une dizaine contient dix unités.'),
          q('Comment écrit-on dix ?',['10','01','100'],'10','Le nombre dix s’écrit 10.'),
          q('Si tu regroupes 10 bâtonnets, tu obtiens :',['1 dizaine','2 dizaines','0 dizaine'],'1 dizaine','Le groupement par dix crée une dizaine.'),
          q('Pourquoi regrouper par 10 ?',['Pour compter plus facilement de grandes collections','Pour perdre des objets','Pour changer leur taille'],'Pour compter plus facilement de grandes collections','Le groupement organise la numération.')]),
      cp1Lesson('Les nombres 11 et 12',
        '11, c’est une dizaine et une unité. 12, c’est une dizaine et deux unités.',
        'Construis le nombre avec un paquet de 10 puis ajoute les unités seules. Cette méthode montre ce que les chiffres veulent dire.',
        'Exemple : 10 + 2 = 12.',
        '🔟 + ●● = 12', 'Une dizaine et deux unités',[
          q('10 + 1 = ?',['11','12','10'],'11','Une dizaine et une unité donnent onze.'),
          q('10 + 2 = ?',['12','11','20'],'12','Une dizaine et deux unités donnent douze.'),
          q('Dans 12, combien y a-t-il d’unités seules après la dizaine ?',['2','1','12'],'2','12 se décompose en 10 + 2.'),
          q('Quel nombre est plus grand ?',['12','11','10'],'12','12 vient après 11 sur la bande numérique.')]),
      cp1Lesson('Les nombres de 13 à 15',
        '13 = 10 + 3, 14 = 10 + 4 et 15 = 10 + 5. Nous gardons une dizaine et nous ajoutons des unités.',
        'Pour lire ces nombres, regarde d’abord le paquet de dix puis les unités. Tu peux les construire avec des objets avant de les écrire.',
        'Exemple : 🔟 + ●●●● = 14.',
        '13  14  15', 'Nombres treize, quatorze et quinze',[
          q('10 + 3 = ?',['13','14','15'],'13','Une dizaine et trois unités donnent treize.'),
          q('10 + 5 = ?',['15','14','13'],'15','Une dizaine et cinq unités donnent quinze.'),
          q('Quel nombre est entre 13 et 15 ?',['14','12','16'],'14','L’ordre est 13, 14, 15.'),
          q('Dans 14, quelle décomposition est correcte ?',['10 + 4','10 + 5','4 + 4'],'10 + 4','Une dizaine et quatre unités donnent 14.')]),
      cp1Lesson('Le nombre 16',
        '16 se lit « seize ». Il est formé d’une dizaine et de six unités : 10 + 6.',
        'Tu peux vérifier en comptant : après 15 vient 16. Tu peux aussi construire 16 avec un paquet de dix et six objets seuls.',
        'Exemple : 🔟 + ●●●●●● = 16.',
        '🔟 + ●●●●●●', 'Une dizaine et six unités',[
          q('10 + 6 = ?',['16','15','17'],'16','Une dizaine et six unités font seize.'),
          q('Quel nombre vient après 15 ?',['16','14','20'],'16','La suite naturelle avance d’une unité.'),
          q('16 contient :',['1 dizaine et 6 unités','6 dizaines','16 dizaines'],'1 dizaine et 6 unités','La décomposition de 16 est 10 + 6.'),
          q('Quel nombre est plus petit que 16 ?',['15','17','20'],'15','15 vient avant 16.')]),
      cp1Lesson('Construire des additions jusqu’à 20',
        'Une addition réunit deux quantités. Avec les nombres jusqu’à 20, utilise les objets, la bande numérique ou la décomposition.',
        'Cherche une stratégie courte. Pour 8 + 5, tu peux faire 8 + 2 = 10 puis ajouter encore 3 : 13.',
        'Exemple : 9 + 4 = 9 + 1 + 3 = 13.',
        '8 + 5 → 10 + 3 → 13', 'Chemin de calcul vers la dizaine',[
          n('7 + 3 = ?',10,'Sept et trois complètent une dizaine.'),
          n('8 + 5 = ?',13,'8 + 2 = 10, puis +3 = 13.'),
          n('10 + 6 = ?',16,'Une dizaine plus six unités donne 16.'),
          q('Pour calculer 9 + 4, quelle stratégie aide ?',['Faire 9 + 1 puis +3','Ajouter 9 quatre fois','Répondre au hasard'],'Faire 9 + 1 puis +3','Compléter d’abord 10 facilite le calcul mental.')]),
      cp1Lesson('Comprendre la soustraction',
        'Soustraire, c’est souvent enlever ou chercher ce qui reste. Si tu as 5 mangues et que tu en donnes 2, il reste 3 : 5 − 2 = 3.',
        'La soustraction peut aussi répondre à « combien manque-t-il ? ». Si tu as 7 et tu veux arriver à 10, il manque 3.',
        'Exemple : ●●●●● − ●● = ●●●.',
        '●●●●● − ●● = ●●●', 'Collection dont on retire deux objets',[
          n('5 − 2 = ?',3,'On enlève deux objets à cinq ; il en reste trois.'),
          n('9 − 4 = ?',5,'En retirant quatre de neuf, il reste cinq.'),
          n('10 − 3 = ?',7,'Dix moins trois donne sept.'),
          q('Awa a 6 bonbons et en donne 2. Quelle opération ?',['6 − 2','6 + 2','2 + 6'],'6 − 2','La quantité diminue : on soustrait.')]),
      cp1Lesson('Avancer ou reculer de 2 et de 3',
        'Ajouter 2, c’est avancer de deux nombres. Retirer 2, c’est reculer de deux. Même idée pour 3.',
        'Utilise une bande numérique : pose ton doigt sur le nombre de départ et fais exactement le nombre de pas demandé.',
        'Exemple : 5 + 2 : 6, 7. Donc 5 + 2 = 7.',
        '0 1 2 3 4 5 6 7 8 9', 'Bande numérique pour faire des pas',[
          n('5 + 2 = ?',7,'À partir de 5, deux pas : 6 puis 7.'),
          n('8 − 2 = ?',6,'À partir de 8, deux pas en arrière : 7 puis 6.'),
          n('6 + 3 = ?',9,'Trois pas en avant donnent 7, 8, 9.'),
          q('Pour faire −3 sur la bande, tu vas :',['vers les nombres plus petits','vers les nombres plus grands','nulle part'],'vers les nombres plus petits','Soustraire fait reculer sur la bande numérique.')]),
      cp1Lesson('Les nombres de 17 à 19',
        '17 = 10 + 7, 18 = 10 + 8 et 19 = 10 + 9. Ce sont une dizaine et des unités.',
        'Regarde les unités pour comparer : 19 a neuf unités après la dizaine, donc il est plus grand que 17 et 18.',
        'Exemple : 🔟 + ●●●●●●●● = 18.',
        '17  18  19', 'Nombres dix-sept, dix-huit et dix-neuf',[
          q('10 + 7 = ?',['17','18','19'],'17','Une dizaine et sept unités font 17.'),
          q('Quel nombre vient après 18 ?',['19','17','20'],'19','La suite est 17, 18, 19.'),
          q('Quel est le plus grand ?',['19','17','18'],'19','Ils ont tous une dizaine ; 9 unités est la plus grande partie restante.'),
          q('18 se décompose en :',['10 + 8','10 + 7','8 + 8'],'10 + 8','18 contient une dizaine et huit unités.')]),
      cp1Lesson('Le nombre 20 : deux dizaines',
        '20 se lit « vingt ». Vingt unités peuvent être regroupées en deux paquets de dix : 2 dizaines.',
        'Quand tu as deux dizaines complètes, il ne reste aucune unité seule. C’est pourquoi 20 s’écrit 2 puis 0.',
        'Exemple : 🔟 + 🔟 = 20.',
        '🔟 + 🔟 = 20', 'Deux dizaines',[
          q('Deux dizaines font :',['20','10','12'],'20','Chaque dizaine vaut 10 ; 10 + 10 = 20.'),
          q('Comment écrit-on vingt ?',['20','02','200'],'20','Le chiffre 2 indique deux dizaines.'),
          q('20 contient combien d’unités ?',['20','2','0'],'20','Deux groupes de dix contiennent vingt unités.'),
          q('Quel nombre vient juste avant 20 ?',['19','18','21'],'19','La suite naturelle se termine ici par 19, 20.')]),
      cp1Lesson('Partager une petite collection',
        'Partager équitablement, c’est donner la même quantité à chacun. Avec 6 mangues pour 2 enfants, on distribue une à une jusqu’à finir : chacun reçoit 3.',
        'Pour vérifier un partage, compare les parts. Si une part a plus que l’autre, le partage n’est pas égal.',
        'Exemple : 🥭🥭🥭 | 🥭🥭🥭.',
        '👧🏾 🥭🥭🥭   🧒🏾 🥭🥭🥭', 'Deux enfants avec parts égales',[
          q('6 objets partagés également entre 2 enfants donnent :',['3 chacun','2 chacun','6 chacun'],'3 chacun','Deux groupes de trois utilisent les six objets.'),
          q('4 mangues pour 2 enfants :',['2 chacun','4 chacun','1 chacun'],'2 chacun','Deux parts de deux font quatre.'),
          q('Un enfant a 3 et l’autre 2. Le partage est-il égal ?',['Non','Oui'],'Non','Les quantités sont différentes.'),
          q('Quelle méthode aide ?',['Distribuer une à une à chaque personne','Tout donner au premier','Deviner'],'Distribuer une à une à chaque personne','La distribution alternée aide à construire des parts égales.')]),
      cp1Lesson('Le double',
        'Le double, c’est deux fois la même quantité. Le double de 3, c’est 3 + 3 = 6.',
        'Construis deux groupes identiques puis réunis-les. Cela permet de voir le double au lieu de seulement le mémoriser.',
        'Exemple : ●●● + ●●● = 6.',
        '●●● + ●●● = 6', 'Deux groupes identiques',[
          n('Double de 2 = ?',4,'2 + 2 = 4.'),
          n('Double de 4 = ?',8,'4 + 4 = 8.'),
          n('Double de 5 = ?',10,'5 + 5 = 10.'),
          q('Pour trouver un double, tu fais :',['deux groupes identiques','un seul groupe plus petit','une soustraction au hasard'],'deux groupes identiques','Le double correspond à deux fois la même quantité.')]),
      cp1Lesson('La moitié',
        'La moitié partage une quantité en deux parts égales. La moitié de 8 est 4, car 4 + 4 = 8.',
        'Pour vérifier une moitié, double la réponse. Si le double redonne la quantité de départ, la moitié est correcte.',
        'Exemple : 10 partagé en deux parts égales donne 5 et 5.',
        '●●●● | ●●●●', 'Huit objets partagés en deux moitiés',[
          n('Moitié de 4 = ?',2,'Deux et deux font quatre.'),
          n('Moitié de 8 = ?',4,'Quatre et quatre font huit.'),
          n('Moitié de 10 = ?',5,'Cinq et cinq font dix.'),
          q('Comment vérifier que 5 est la moitié de 10 ?',['Calculer 5 + 5','Faire 10 + 10','Regarder la couleur'],'Calculer 5 + 5','Le double de la moitié doit redonner la quantité de départ.')]),
      cp1Lesson('Les nombres ordinaux : premier, deuxième…',
        'Les nombres ordinaux indiquent une place dans un ordre : premier, deuxième, troisième… Ils ne disent pas combien d’objets il y a, mais la position.',
        'Dans une course de 5 enfants, l’enfant arrivé troisième n’est pas un groupe de trois : « troisième » indique sa place.',
        'Exemple : 🥇 premier, 🥈 deuxième, 🥉 troisième.',
        '🥇  🥈  🥉', 'Podium des trois premières places',[
          q('Après premier vient :',['deuxième','quatrième','zéro'],'deuxième','C’est l’ordre des positions.'),
          q('Le mot « troisième » indique :',['une position','une couleur','une masse'],'une position','Un ordinal indique un rang.'),
          q('Awa est devant Fanta qui est devant Sory. Fanta est :',['deuxième','première','troisième'],'deuxième','Awa est première, Fanta deuxième, Sory troisième.'),
          q('Quelle différence entre « trois » et « troisième » ?',['Trois est une quantité ; troisième est une position','Aucune','Troisième est une couleur'],'Trois est une quantité ; troisième est une position','Cardinal et ordinal ne répondent pas à la même question.')]),
      cp1Lesson('Se repérer dans le temps',
        'Nous utilisons avant, maintenant et après. Nous parlons aussi du passé, du présent et du futur. Une journée comprend le jour et la nuit.',
        'Pour mettre des événements dans l’ordre, cherche ce qui s’est passé d’abord, ensuite et enfin. Les jours de la semaine suivent aussi un ordre.',
        'Exemple : hier = passé ; aujourd’hui = présent ; demain = futur.',
        '🌅  ☀️  🌙   hier → aujourd’hui → demain', 'Suite du temps',[
          q('Ce qui s’est déjà passé appartient surtout :',['au passé','au futur','à demain seulement'],'au passé','Le passé concerne ce qui est arrivé avant maintenant.'),
          q('Après lundi vient :',['mardi','dimanche','samedi'],'mardi','Les jours suivent un ordre régulier.'),
          q('Le soleil se lève, puis la journée avance, puis vient la nuit. Quel mot aide à ordonner ?',['puis','plus lourd','à côté'],'puis','« Puis » indique qu’un événement vient après un autre.'),
          q('Demain appartient :',['au futur','au passé','à hier'],'au futur','Demain n’est pas encore arrivé.')]),
      cp1Lesson('Gauche, droite, quadrillage et tableau',
        'Ta main gauche et ta main droite t’aident à te repérer. Un quadrillage est formé de cases. On peut indiquer une case ou suivre un petit chemin de case en case.',
        'La gauche dépend de l’orientation de la personne. Pour un quadrillage, suis une consigne étape par étape : une case à droite, puis une case en haut.',
        'Exemple : départ □ → une case à droite → arrivée.',
        '⬜➡️⬜\n⬜⬜⬜', 'Petit quadrillage avec déplacement',[
          q('Si la consigne dit « une case à droite », tu vas :',['vers la droite','vers la gauche','en dehors sans regarder'],'vers la droite','Il faut suivre la direction donnée.'),
          q('Un quadrillage est formé de :',['cases','sons','goûts'],'cases','Les lignes forment des cases.'),
          q('Pourquoi suivre les consignes une par une ?',['Pour ne pas perdre le chemin','Pour aller au hasard','Pour changer le quadrillage'],'Pour ne pas perdre le chemin','Chaque déplacement dépend du précédent.'),
          q('Ta gauche et celle d’une personne en face de toi sont-elles visuellement du même côté ?',['Non, il faut tenir compte de l’orientation','Oui toujours'],'Non, il faut tenir compte de l’orientation','La direction gauche/droite est liée au point de vue.')]),
      cp1Lesson('Lignes, carré, rectangle et symétrie',
        'Une ligne peut être droite, courbe, ouverte ou fermée. Le carré et le rectangle sont des figures fermées avec quatre côtés. Une figure peut avoir un axe de symétrie.',
        'Pour reconnaître une figure, regarde ses propriétés. Un carré a quatre côtés de même longueur. Un rectangle a quatre côtés et ses côtés opposés ont la même longueur.',
        'Exemple : □ est un carré ; ▭ est un rectangle.',
        '━  ∿  □  ▭  ↔️', 'Lignes et figures géométriques',[
          q('Quel dessin est un carré ?',['□','○','△'],'□','Le carré a quatre côtés égaux.'),
          q('Quel dessin est un rectangle ?',['▭','○','◇'],'▭','Le rectangle possède quatre côtés avec côtés opposés égaux.'),
          q('Quelle ligne est courbe ?',['∿','━','|'],'∿','Elle change continuellement de direction.'),
          q('Un axe de symétrie sert à :',['partager une figure en deux parties qui se correspondent','compter les mangues','mesurer une masse'],'partager une figure en deux parties qui se correspondent','Les deux côtés de la figure se répondent comme dans un miroir.')]),
      cp1Lesson('Résoudre un petit problème',
        'Un problème raconte une situation et pose une question. Lis ou écoute d’abord. Cherche ce que tu connais, puis ce qu’on demande.',
        'Ne choisis pas une opération juste parce que tu vois des nombres. Demande-toi : la quantité augmente, diminue, se compare ou se partage ? Ensuite seulement choisis la démarche.',
        'Exemple : « Awa a 5 mangues. Elle reçoit 3 mangues. Combien en a-t-elle ? » La quantité augmente : 5 + 3 = 8.',
        '👧🏾 🥭🥭🥭🥭🥭  +  🥭🥭🥭', 'Situation-problème avec des mangues',[
          n('Sory a 6 billes et reçoit 2 billes. Combien maintenant ?',8,'La quantité augmente : 6 + 2 = 8.'),
          n('Fanta a 9 crayons et en donne 3. Combien restent ?',6,'La quantité diminue : 9 − 3 = 6.'),
          q('4 mangues sont partagées également entre 2 enfants. Chacun reçoit :',['2','4','1'],'2','Deux parts égales de deux utilisent les quatre mangues.'),
          q('Quelle est la première bonne question à se poser ?',['Qu’est-ce que je connais et qu’est-ce qu’on demande ?','Quelle réponse me plaît ?','Quelle couleur choisir ?'],'Qu’est-ce que je connais et qu’est-ce qu’on demande ?','Identifier les données et la question est le début d’une démarche de résolution.')])
    ],

    sciences: [
      cp1Lesson('Vivant ou non vivant ?',
        'Un animal et une plante sont vivants. Ils ont des besoins et ils changent en grandissant. Une pierre, une chaise ou une cuillère ne sont pas vivantes.',
        'Ne décide pas seulement parce qu’une chose bouge. Une voiture peut bouger, mais elle ne grandit pas comme un animal ou une plante. Il faut regarder plusieurs indices.',
        'Exemple : la chèvre mange et grandit. La pierre ne mange pas et ne grandit pas.',
        '🐐  🌱  🪨  🪑','Chèvre, plante, pierre et chaise',[
          q('Lequel est vivant ?',['la chèvre','la pierre','la chaise'],'la chèvre','La chèvre est un animal vivant.'),
          q('Lequel est une plante vivante ?',['le manguier','la table','la bouteille'],'le manguier','Le manguier pousse et se développe.'),
          q('Une voiture bouge. Est-elle vivante ?',['Non','Oui, parce qu’elle bouge'],'Non','Bouger ne suffit pas pour être vivant.'),
          q('Quel indice aide le mieux ?',['Grandir et avoir des besoins','Être rouge','Être en métal'],'Grandir et avoir des besoins','On utilise plusieurs signes du vivant.')]),
      cp1Lesson('La diversité autour de nous',
        'Autour de nous, il y a des personnes, des animaux et des plantes. Dans une cour, un village ou un quartier, nous pouvons observer plusieurs formes de vie.',
        'Observer la diversité, c’est regarder les différences : un manguier n’est pas une herbe, une poule n’est pas une chèvre. Pourtant, tous peuvent être vivants.',
        'Exemple : 👧🏾, 🐔 et 🌳 sont trois êtres vivants différents.',
        '👧🏾  🐔  🐐  🌳  🌿','Personne, animaux et plantes',[
          q('Quel groupe contient seulement des êtres vivants ?',['enfant, poule, manguier','pierre, table, bouteille','chaise, sac, route'],'enfant, poule, manguier','Les trois éléments sont vivants.'),
          q('Une poule et une chèvre sont :',['deux animaux différents','deux plantes','deux pierres'],'deux animaux différents','Elles appartiennent toutes les deux au monde animal.'),
          q('Un manguier et une herbe sont :',['deux plantes différentes','deux animaux','deux objets techniques'],'deux plantes différentes','Les plantes peuvent avoir des formes différentes.'),
          q('Pourquoi observer plusieurs êtres vivants ?',['Pour voir leur diversité','Pour dire qu’ils sont tous identiques','Pour répondre au hasard'],'Pour voir leur diversité','Comparer aide à reconnaître ressemblances et différences.')]),
      cp1Lesson('Les grandes parties du corps',
        'Ton corps comprend la tête, le tronc et les membres. Les bras et les jambes sont des membres. Sur la tête, tu trouves les yeux, les oreilles, le nez et la bouche.',
        'Pour nommer une partie du corps, regarde sa place. La main est au bout du bras. Le pied est au bout de la jambe. La position aide à reconnaître.',
        'Exemple : tête → tronc → jambes.',
        '🧒🏾  👁️  👂🏾  👃🏾  ✋🏾  🦶🏾','Corps et principales parties',[
          q('Quelle partie est sur la tête ?',['les yeux','les pieds','les genoux'],'les yeux','Les yeux sont situés sur le visage.'),
          q('La main est au bout :',['du bras','de la tête','du nez'],'du bras','La main prolonge le membre supérieur.'),
          q('Le pied est au bout :',['de la jambe','du bras','de l’oreille'],'de la jambe','Le pied se trouve à l’extrémité de la jambe.'),
          q('Pourquoi regarder la place d’une partie ?',['Pour mieux l’identifier','Pour changer son nom','Pour compter les jours'],'Pour mieux l’identifier','La position donne un indice utile.')]),
      cp1Lesson('Les yeux et la vue',
        'Les yeux permettent de voir la lumière, les couleurs, les formes et les objets. Nous utilisons la vue pour observer ce qui est devant nous.',
        'Voir ne veut pas dire tout savoir. Si un objet est loin ou caché, l’œil peut manquer une information. Il faut parfois se rapprocher sans danger ou demander une aide.',
        'Exemple : tu vois un feu rouge et tu t’arrêtes avec l’adulte qui t’accompagne.',
        '👀  🔴  🔵  🟩','Yeux et couleurs',[
          q('Avec quoi vois-tu ?',['les yeux','les oreilles','la langue'],'les yeux','Les yeux sont les organes de la vue.'),
          q('La vue aide à reconnaître :',['les couleurs','le goût seul','un son sans regarder'],'les couleurs','Les couleurs sont perçues par les yeux.'),
          q('Un objet est caché derrière un mur. Peux-tu toujours le voir ?',['Non','Oui, toujours'],'Non','Un obstacle peut empêcher la vue.'),
          q('Que fais-tu si tu ne vois pas bien une consigne au tableau ?',['Je le dis au maître','Je devine toujours','Je ferme les yeux'],'Je le dis au maître','Demander de l’aide est une bonne décision.')]),
      cp1Lesson('Les oreilles et les sons',
        'Les oreilles permettent d’entendre. Tu peux entendre une voix, un tambour, un klaxon ou un oiseau.',
        'Un son peut donner une information même si tu ne vois pas sa source. Un klaxon peut t’alerter. Il faut écouter et réfléchir avant d’agir.',
        'Exemple : tu entends une voiture arriver avant de la voir.',
        '👂🏾  🥁  🚗  🐦','Oreille et sources sonores',[
          q('Avec quoi entends-tu ?',['les oreilles','les yeux','les pieds'],'les oreilles','Les oreilles servent à l’audition.'),
          q('Lequel produit un son ?',['un tambour frappé','une pierre immobile sans choc','une couleur'],'un tambour frappé','Le tambour produit un son quand il est frappé.'),
          q('Tu entends un klaxon. Que peut-il t’indiquer ?',['Un véhicule est peut-être proche','Le riz est sucré','La nuit est verte'],'Un véhicule est peut-être proche','Le son peut signaler une présence ou un danger.'),
          q('Pourquoi écouter autour de soi ?',['Pour recevoir des informations','Pour fermer les yeux toujours','Pour changer les sons'],'Pour recevoir des informations','L’ouïe aide à comprendre l’environnement.')]),
      cp1Lesson('Le nez et les odeurs',
        'Le nez permet de sentir les odeurs. Une fleur, un savon, un aliment ou de la fumée peuvent avoir une odeur.',
        'Une odeur peut être agréable ou désagréable. Elle peut aussi avertir. Si tu sens une forte odeur de fumée, préviens un adulte et éloigne-toi du danger.',
        'Exemple : 🌼 peut sentir bon ; de la fumée peut signaler un risque.',
        '👃🏾  🌼  🧼  💨','Nez, fleur, savon et fumée',[
          q('Avec quoi sens-tu une odeur ?',['le nez','les yeux','les pieds'],'le nez','Le nez est l’organe de l’odorat.'),
          q('Quel objet peut avoir une odeur parfumée ?',['une fleur','un nombre','une ligne'],'une fleur','Beaucoup de fleurs émettent des odeurs.'),
          q('Tu sens beaucoup de fumée. Que fais-tu ?',['Je préviens un adulte et je m’éloigne','Je cherche à respirer plus de fumée','Je me cache dans la fumée'],'Je préviens un adulte et je m’éloigne','Une odeur peut signaler un danger.'),
          q('Une odeur donne-t-elle une information ?',['Oui','Non, jamais'],'Oui','L’odorat nous informe sur ce qui nous entoure.')]),
      cp1Lesson('La langue et les goûts',
        'La langue participe au goût. Nous pouvons reconnaître des goûts comme sucré, salé, amer ou acide.',
        'Il ne faut pas goûter un produit inconnu pour savoir ce qu’il est. Certaines substances peuvent être dangereuses. On goûte seulement les aliments autorisés par un adulte responsable.',
        'Exemple : le sucre est sucré ; le sel est salé.',
        '👅  🍬  🧂  🍋','Langue et aliments de goûts différents',[
          q('Quel organe participe au goût ?',['la langue','l’oreille','le coude'],'la langue','La langue contient des récepteurs du goût.'),
          q('Le sucre est surtout :',['sucré','salé','amer'],'sucré','Le sucre donne une sensation sucrée.'),
          q('Le sel est surtout :',['salé','sucré','sans aucun goût'],'salé','Le sel donne une sensation salée.'),
          q('Peux-tu goûter un produit inconnu trouvé par terre ?',['Non','Oui toujours'],'Non','On ne goûte pas une substance inconnue : elle peut être dangereuse.')]),
      cp1Lesson('La peau et le toucher',
        'La peau nous aide à sentir le contact, la texture et certaines températures. Avec la main, tu peux reconnaître quelque chose de doux ou rugueux.',
        'Le toucher donne des informations, mais il faut respecter la sécurité. Ne touche jamais une flamme, un fil électrique abîmé ou un objet très chaud.',
        'Exemple : un tissu peut être doux ; une pierre peut être rugueuse.',
        '✋🏾  🧸  🪨  🔥','Main, objet doux, pierre et feu',[
          q('Quel organe couvre ton corps et participe au toucher ?',['la peau','les cheveux seulement','les dents'],'la peau','La peau contient des récepteurs sensibles au contact.'),
          q('Lequel peut être rugueux ?',['une pierre','un coussin doux','de l’air'],'une pierre','Beaucoup de pierres ont une surface irrégulière.'),
          q('Faut-il toucher une casserole très chaude ?',['Non','Oui'],'Non','La chaleur peut brûler la peau.'),
          q('Pourquoi le toucher doit-il rester prudent ?',['Certains objets peuvent blesser','Tout objet est sans danger','Pour ne jamais utiliser les mains'],'Certains objets peuvent blesser','On utilise le sens du toucher avec des règles de sécurité.')]),
      cp1Lesson('Les animaux de notre milieu',
        'Dans notre milieu, on peut rencontrer la chèvre, la vache, le chien, le chat, la poule et d’autres animaux. Ils n’ont pas tous la même taille ni le même mode de vie.',
        'Pour reconnaître un animal, observe sa forme, ses pattes, son pelage ou ses plumes, son alimentation et l’endroit où il vit.',
        'Exemple : la poule a des plumes ; la chèvre a des poils.',
        '🐐  🐄  🐕  🐈  🐔','Animaux domestiques courants',[
          q('Lequel est un animal ?',['la chèvre','le manguier','la chaise'],'la chèvre','La chèvre appartient au monde animal.'),
          q('Quel animal a des plumes ?',['la poule','la chèvre','le chat'],'la poule','Les oiseaux comme la poule portent des plumes.'),
          q('Quel indice aide à reconnaître un animal ?',['Son corps et son mode de vie','La couleur du cahier','Le jour de la semaine'],'Son corps et son mode de vie','Plusieurs caractéristiques permettent l’identification.'),
          q('Tous les animaux sont-ils identiques ?',['Non','Oui'],'Non','Ils présentent une grande diversité.')]),
      cp1Lesson('Prendre soin d’un animal',
        'Un animal domestique a besoin d’eau, de nourriture, d’un lieu adapté et de soins. Il ne faut pas le frapper ni le faire souffrir.',
        'Prendre soin, c’est observer ses besoins. Un animal qui n’a pas d’eau ou qui semble malade doit être signalé à un adulte responsable.',
        'Exemple : donner de l’eau propre à une chèvre et garder son espace propre.',
        '🐐  💧  🌾  🏡','Animal avec eau, nourriture et abri',[
          q('Un animal domestique a besoin :',['d’eau et de nourriture','de plastique à manger','de fumée'],'d’eau et de nourriture','L’eau et la nourriture font partie de ses besoins.'),
          q('Que fais-tu si l’animal semble malade ?',['Je préviens un adulte','Je le frappe','Je l’ignore toujours'],'Je préviens un adulte','Un adulte peut chercher les soins adaptés.'),
          q('Faut-il faire souffrir un animal ?',['Non','Oui'],'Non','Le respect du vivant inclut le bien-être animal.'),
          q('Pourquoi garder son espace propre ?',['Pour l’hygiène et la santé','Pour salir l’eau','Pour cacher l’animal'],'Pour l’hygiène et la santé','Un milieu propre réduit certains risques sanitaires.')]),
      cp1Lesson('Les parties d’une plante',
        'Une plante peut avoir des racines, une tige, des feuilles, des fleurs et des fruits. Les racines sont généralement dans le sol.',
        'Chaque partie a une place et un rôle. Les racines fixent la plante et prennent de l’eau dans le sol. Les feuilles reçoivent la lumière.',
        'Exemple : 🌱 racines en bas, tige au milieu, feuilles autour.',
        '🌱  🌿  🌼  🥭','Plante, feuilles, fleur et fruit',[
          q('Quelle partie est généralement dans le sol ?',['les racines','les feuilles','les fleurs'],'les racines','Les racines se développent généralement dans le sol.'),
          q('Quelle partie porte souvent les feuilles ?',['la tige','la pierre','la route'],'la tige','La tige soutient les parties aériennes.'),
          q('Un fruit peut venir :',['d’une plante','d’une chaise','d’un caillou'],'d’une plante','Les fruits sont produits par certaines plantes.'),
          q('Pourquoi observer chaque partie ?',['Pour comprendre l’organisation de la plante','Pour dire qu’elles sont toutes pareilles','Pour changer sa couleur'],'Pour comprendre l’organisation de la plante','Décomposer permet de mieux comprendre un être vivant.')]),
      cp1Lesson('Les plantes fruitières de chez nous',
        'Dans notre milieu, nous pouvons voir le manguier, l’oranger, le bananier, le goyavier, le palmier et d’autres plantes utiles.',
        'Relie le fruit à la plante qui le produit. Une mangue vient du manguier. Une orange vient de l’oranger. Ne mélange pas le nom du fruit et celui de la plante.',
        'Exemple : manguier → mangue ; oranger → orange.',
        '🌳🥭  🌳🍊  🌴  🍌','Arbres et fruits',[
          q('La mangue vient :',['du manguier','de la pierre','du savon'],'du manguier','Le manguier produit des mangues.'),
          q('L’orange vient :',['de l’oranger','du riz','de la table'],'de l’oranger','L’oranger produit des oranges.'),
          q('Le bananier produit :',['des bananes','des cahiers','des poissons'],'des bananes','La banane est le fruit du bananier.'),
          q('Pourquoi relier fruit et plante ?',['Pour comprendre leur origine','Pour changer le goût','Pour compter les routes'],'Pour comprendre leur origine','Cette relation aide à comprendre le milieu vivant.')]),
      cp1Lesson('Les aliments et leur origine',
        'Nous mangeons des aliments d’origine végétale et animale. Le riz et la mangue viennent des plantes. Le lait et les œufs viennent d’animaux.',
        'Pour classer un aliment, demande-toi d’où il vient avant d’arriver dans l’assiette. Cette question aide à comprendre la production de nos aliments.',
        'Exemple : 🌾 → riz ; 🐔 → œuf.',
        '🍚  🥭  🥚  🥛','Riz, mangue, œuf et lait',[
          q('Le riz est surtout d’origine :',['végétale','minérale','plastique'],'végétale','Le riz est une graine produite par une plante.'),
          q('L’œuf vient :',['d’un animal','d’une pierre','d’un cahier'],'d’un animal','Des animaux comme la poule pondent des œufs.'),
          q('La mangue est d’origine :',['végétale','métallique','animale'],'végétale','Elle pousse sur le manguier.'),
          q('Quelle question aide à classer un aliment ?',['D’où vient-il ?','Quelle est ma couleur préférée ?','Quel jour sommes-nous ?'],'D’où vient-il ?','Chercher l’origine permet un classement raisonné.')]),
      cp1Lesson('Propreté du corps et des vêtements',
        'Pour rester propre, nous lavons le corps, les mains et les vêtements. Des ongles propres et des habits propres participent à une bonne hygiène.',
        'L’hygiène est une habitude régulière. Attendre d’être très sale n’est pas une bonne méthode. On se lave après certaines activités et avant de manger.',
        'Exemple : se laver les mains avec de l’eau propre et du savon avant le repas.',
        '🧼  👐🏾  👕  🚿','Savon, mains, vêtement et douche',[
          q('Avant de manger, il est utile de :',['se laver les mains','salir les mains','toucher les déchets'],'se laver les mains','Le lavage des mains aide à réduire les microbes.'),
          q('Des vêtements propres participent :',['à l’hygiène','à salir le corps','à rendre l’eau dangereuse'],'à l’hygiène','La propreté des vêtements fait partie des soins du corps.'),
          q('Quand faut-il se laver ?',['régulièrement et après certaines activités','jamais','seulement une fois dans l’année'],'régulièrement et après certaines activités','L’hygiène repose sur des habitudes répétées.'),
          q('Pourquoi utiliser du savon quand c’est possible ?',['Il aide à enlever saletés et microbes','Il remplace l’eau à boire','Il sert à écrire'],'Il aide à enlever saletés et microbes','Le savon améliore le nettoyage des mains et du corps.')]),
      cp1Lesson('Prendre soin de ses dents',
        'Les dents servent notamment à couper et mâcher les aliments. Elles doivent être brossées régulièrement avec une brosse adaptée et du dentifrice si disponible.',
        'Après avoir mangé, des restes peuvent rester sur les dents. Le brossage aide à les enlever. Trop de produits très sucrés peut favoriser les problèmes dentaires.',
        'Exemple : brosser doucement toutes les faces des dents.',
        '🦷  🪥  😁','Dent et brosse à dents',[
          q('Quel objet sert à brosser les dents ?',['une brosse à dents','un balai','une règle'],'une brosse à dents','Elle est conçue pour nettoyer les dents.'),
          q('Pourquoi se brosser les dents ?',['Pour enlever des restes et protéger les dents','Pour les salir','Pour les rendre invisibles'],'Pour enlever des restes et protéger les dents','Le brossage participe à la santé bucco-dentaire.'),
          q('Faut-il brosser seulement une petite partie des dents ?',['Non','Oui'],'Non','Il faut nettoyer les différentes faces accessibles.'),
          q('Que peut faire un excès fréquent de produits très sucrés ?',['Favoriser des problèmes dentaires','Renforcer toujours toutes les dents','Remplacer le brossage'],'Favoriser des problèmes dentaires','Le sucre fréquent favorise le risque de caries.')]),
      cp1Lesson('Hygiène des aliments et de l’eau',
        'Avant de manger un fruit, il faut le laver avec une eau propre. Les aliments doivent être protégés de la saleté. L’eau à boire doit être sûre.',
        'Regarde les signes de risque : eau visiblement sale, aliment tombé dans un endroit sale, nourriture mal protégée. En cas de doute, demande à un adulte.',
        'Exemple : laver une mangue avant de la manger.',
        '💧  🥭  🧼  ✅','Eau propre et fruit lavé',[
          q('Avant de manger une mangue, tu dois :',['la laver','la rouler dans la poussière','la poser dans les déchets'],'la laver','Le lavage aide à enlever des saletés.'),
          q('Une eau est visiblement sale. Tu :',['ne la bois pas et tu préviens un adulte','la bois vite','ajoutes du sable'],'ne la bois pas et tu préviens un adulte','Une eau sale peut présenter un risque sanitaire.'),
          q('Pourquoi couvrir certains aliments ?',['Pour les protéger des saletés et insectes','Pour les rendre plus lourds','Pour les transformer en pierre'],'Pour les protéger des saletés et insectes','La protection réduit certaines contaminations.'),
          q('Tu as un doute sur un aliment. Que fais-tu ?',['Je demande à un adulte responsable','Je le mange toujours','Je le donne à un petit enfant'],'Je demande à un adulte responsable','En cas de doute sanitaire, l’aide d’un adulte est la bonne décision.')]),
      cp1Lesson('Garder la maison et l’école propres',
        'Nous gardons la cour, la classe et la maison propres. Les déchets vont dans un endroit prévu. Nous évitons l’eau stagnante et les saletés autour des lieux de vie.',
        'Un petit geste répété par tout le monde devient important. Si chacun jette un papier au sol, la cour devient sale. Si chacun range et jette correctement, le lieu reste plus propre.',
        'Exemple : ramasser un papier et le mettre dans la poubelle ou le dispositif prévu.',
        '🏫  🏠  🗑️  🧹','École, maison, poubelle et balai',[
          q('Un papier est au sol. Que fais-tu si un endroit pour les déchets est disponible ?',['Je le mets au bon endroit','Je le disperse','Je le cache sous une table'],'Je le mets au bon endroit','Le déchet doit être géré proprement.'),
          q('Pourquoi éviter l’eau stagnante autour de la maison ?',['Elle peut favoriser certains risques sanitaires','Elle rend toujours la maison plus belle','Elle remplace l’eau potable'],'Elle peut favoriser certains risques sanitaires','Un environnement bien entretenu participe à la santé.'),
          q('Si tous les élèves jettent au sol, la cour devient :',['plus sale','automatiquement propre','plus petite'],'plus sale','Les actions individuelles s’additionnent.'),
          q('Quel comportement protège le lieu commun ?',['Ranger et nettoyer','Casser les poubelles','Jeter partout'],'Ranger et nettoyer','Prendre soin du milieu est une responsabilité partagée.')]),
      cp1Lesson('Sécurité à la maison et sur la route',
        'À la maison, certains objets sont dangereux : feu, médicaments, produits inconnus, prises électriques. Sur la route, un enfant s’arrête, observe et suit les consignes de l’adulte qui l’accompagne.',
        'Avant d’agir, cherche le danger. Un objet peut sembler intéressant mais être brûlant ou toxique. Une route peut sembler vide mais un véhicule peut arriver vite.',
        'Exemple : ne jamais jouer avec une prise électrique ou une flamme.',
        '🔥  🔌  🚗  🚸','Feu, prise et traversée de route',[
          q('Peux-tu jouer avec une prise électrique ?',['Non','Oui'],'Non','L’électricité peut provoquer des blessures graves.'),
          q('Un médicament inconnu est posé sur une table. Tu :',['n’y touches pas et préviens un adulte','le goûtes','le donnes à un camarade'],'n’y touches pas et préviens un adulte','Les médicaments ne sont pas des jouets.'),
          q('Avant de traverser une route, tu dois :',['t’arrêter et observer avec l’adulte','courir sans regarder','fermer les yeux'],'t’arrêter et observer avec l’adulte','La prudence permet de repérer les véhicules.'),
          q('Pourquoi une route apparemment vide peut-elle rester dangereuse ?',['Un véhicule peut arriver rapidement','Les routes dorment','Parce que les nombres changent'],'Un véhicule peut arriver rapidement','Il faut anticiper un danger possible.')]),
      cp1Lesson('Objets naturels et objets fabriqués',
        'Une pierre et une branche existent dans la nature. Une chaise, une cuillère et un vélo sont fabriqués ou transformés par l’être humain. Chaque objet peut avoir une fonction.',
        'Pour classer, demande : vient-il directement de la nature ou a-t-il été fabriqué ? Puis demande : à quoi sert-il ? Un outil est choisi selon le travail.',
        'Exemple : marteau → frapper un clou ; cuillère → prendre certains aliments.',
        '🪨  🌿  🔨  🥄  🚲','Objets naturels et techniques',[
          q('Lequel est naturel ?',['une pierre','une chaise','un vélo'],'une pierre','La pierre existe dans la nature.'),
          q('Lequel est fabriqué par l’être humain ?',['une chaise','une feuille d’arbre','un caillou'],'une chaise','La chaise est un objet technique fabriqué.'),
          q('Quel outil peut servir à enfoncer un clou ?',['un marteau','une assiette','une fleur'],'un marteau','Le marteau est adapté à cette tâche.'),
          q('Une casserole très chaude doit être touchée à main nue ?',['Non','Oui'],'Non','Un objet chaud peut provoquer une brûlure.')]),
      cp1Lesson('L’eau et le bois : ressources utiles',
        'L’eau sert à boire quand elle est sûre, à laver et à d’autres usages. Le bois peut servir à fabriquer certains objets ou comme matériau. Ces ressources doivent être utilisées avec soin.',
        'Une ressource n’est pas illimitée. Fermer un robinet ou éviter de gaspiller l’eau est un bon geste. Pour le bois, protéger les arbres et éviter le gaspillage aide le milieu.',
        'Exemple : utiliser seulement l’eau nécessaire pour se laver les mains.',
        '💧  🌳  🪵  🪑','Eau, arbre, bois et objet en bois',[
          q('Quelle ressource sert à boire quand elle est potable ?',['l’eau','le sable','la fumée'],'l’eau','L’eau sûre est indispensable à la vie.'),
          q('Le bois vient principalement :',['des arbres','des poissons','des nuages'],'des arbres','Le bois est une matière d’origine végétale.'),
          q('Pourquoi éviter de gaspiller l’eau ?',['C’est une ressource utile','Pour la rendre sale','Parce qu’elle ne sert à rien'],'C’est une ressource utile','Une utilisation responsable protège les ressources.'),
          q('Quel objet peut être fabriqué en bois ?',['une chaise','une goutte de pluie','une flamme'],'une chaise','Le bois peut servir de matériau de fabrication.')]),
      cp1Lesson('Petit projet : observer, préparer, réaliser',
        'Un petit projet suit des étapes simples. Par exemple, pour planter une graine avec l’adulte : choisir l’endroit, préparer le matériel, mettre la graine, arroser sans excès et observer.',
        'Avant de commencer, demande : quel est mon objectif ? de quoi ai-je besoin ? quelles étapes dois-je suivre ? Après, regarde le résultat et explique ce qui a changé.',
        'Exemple : planter un haricot dans un récipient adapté et observer sa croissance avec l’enseignant.',
        '🌱  🪴  💧  👀','Petit projet de plantation',[
          q('Avant un projet, il faut d’abord :',['savoir ce qu’on veut faire','agir au hasard','cacher le matériel'],'savoir ce qu’on veut faire','Un objectif clair guide les étapes.'),
          q('Pour planter une graine, quel élément est utile ?',['un peu d’eau','du plastique à manger','de la fumée'],'un peu d’eau','L’eau fait partie des besoins de la plante.'),
          q('Après avoir planté, que peux-tu faire ?',['Observer les changements','Oublier toujours le projet','Arracher chaque jour la graine'],'Observer les changements','L’observation permet de suivre l’évolution.'),
          q('Pourquoi travailler par étapes ?',['Pour mieux organiser et vérifier le travail','Pour rendre la tâche confuse','Pour ne rien comprendre'],'Pour mieux organiser et vérifier le travail','Une démarche ordonnée développe l’autonomie et le raisonnement.')])
    ],

    ecm: [
      cp1Lesson('Dire bonjour et parler poliment',
        'La politesse commence par des mots simples : bonjour, s’il vous plaît, merci et au revoir. Nous les utilisons au bon moment.',
        'Être poli, ce n’est pas réciter des mots. C’est aussi parler sans insulter, écouter la réponse et respecter la personne en face.',
        'Exemple : « Bonjour maîtresse. Puis-je avoir mon cahier, s’il vous plaît ? »',
        '👋🏾  🙂  💬','Enfant qui salue poliment',[
          q('Le matin, tu dis :',['Bonjour','Bonne nuit','Rien'],'Bonjour','« Bonjour » sert à saluer.'),
          q('Pour demander gentiment, tu peux dire :',['S’il vous plaît','Donne !','Va-t’en'],'S’il vous plaît','Cette formule rend la demande polie.'),
          q('La politesse concerne aussi :',['la façon de parler','seulement les vêtements','seulement les nombres'],'la façon de parler','Le ton et le respect comptent autant que les mots.'),
          q('Quel comportement est respectueux ?',['Saluer et écouter la réponse','Insulter','Crier pour passer devant'],'Saluer et écouter la réponse','La politesse facilite la vie avec les autres.')]),
      cp1Lesson('Dire merci et demander pardon',
        'Quand quelqu’un t’aide ou te donne quelque chose, tu peux dire « merci ». Si tu fais du tort à quelqu’un, même sans le vouloir, tu peux dire « pardon » et réparer si possible.',
        'Les mots doivent être suivis d’un comportement. Dire pardon puis recommencer exprès la même mauvaise action ne suffit pas.',
        'Exemple : tu renverses le cahier d’un camarade : « Pardon », puis tu l’aides à le ramasser.',
        '🙏🏾  🤝🏾  📒','Merci, pardon et réparation',[
          q('Quelqu’un t’aide. Tu dis :',['Merci','Tant pis','Pars'],'Merci','Remercier reconnaît l’aide reçue.'),
          q('Tu bouscules un camarade. Tu :',['dis pardon et vérifies s’il va bien','ris de lui','pars sans regarder'],'dis pardon et vérifies s’il va bien','S’excuser s’accompagne d’attention.'),
          q('Après avoir cassé quelque chose par erreur, que peux-tu faire ?',['Dire la vérité et chercher à réparer','Cacher toujours','Accuser quelqu’un au hasard'],'Dire la vérité et chercher à réparer','Reconnaître et réparer est responsable.'),
          q('Pardon suffit-il si tu recommences volontairement ?',['Non','Oui toujours'],'Non','Le comportement doit aussi changer.')]),
      cp1Lesson('Écouter et attendre son tour',
        'Quand une personne parle, nous l’écoutons. En classe, nous pouvons lever la main et attendre notre tour pour parler.',
        'Si tout le monde parle en même temps, on comprend moins bien. Attendre son tour permet à chacun d’être entendu.',
        'Exemple : Fanta parle ; Sory écoute ; ensuite Sory prend la parole.',
        '👧🏾💬  👂🏾🧒🏾  ✋🏾','Un enfant parle, un autre écoute',[
          q('Quand un camarade répond, tu :',['écoutes','cries plus fort','le pousses'],'écoutes','L’écoute respecte sa parole.'),
          q('Pour demander la parole en classe, tu peux :',['lever la main','jeter un cahier','crier'],'lever la main','C’est une règle simple d’organisation.'),
          q('Pourquoi attendre son tour ?',['Pour que chacun puisse parler','Pour empêcher tout le monde de parler','Pour perdre du temps'],'Pour que chacun puisse parler','Un ordre commun rend l’échange plus clair.'),
          q('Si tous parlent ensemble, on comprend :',['moins bien','toujours mieux','tout sans écouter'],'moins bien','Les voix se mélangent.')]),
      cp1Lesson('Partager et aider',
        'Partager, c’est mettre une chose à disposition quand c’est possible. Aider, c’est faire quelque chose d’utile pour une autre personne sans lui faire du mal.',
        'Aider ne veut pas dire faire tout le travail de l’autre. Tu peux expliquer, prêter un crayon ou accompagner, tout en laissant l’autre apprendre à agir.',
        'Exemple : ton camarade n’a pas de crayon et tu en as deux : tu peux lui en prêter un.',
        '✏️🤝🏾✏️','Deux enfants qui partagent un crayon',[
          q('Tu as deux crayons et ton camarade n’en a pas. Tu peux :',['lui en prêter un','casser les deux','te moquer'],'lui en prêter un','Le partage aide le groupe.'),
          q('Aider un camarade à apprendre, c’est :',['lui expliquer sans faire tout à sa place','faire tous ses exercices à sa place','l’empêcher d’essayer'],'lui expliquer sans faire tout à sa place','L’aide doit aussi développer son autonomie.'),
          q('Après avoir emprunté une règle, tu dois :',['la rendre','la garder toujours','la casser'],'la rendre','Un prêt implique de restituer l’objet.'),
          q('Pourquoi partager quand c’est possible ?',['Pour favoriser l’entraide','Pour perdre tous ses objets','Pour empêcher les autres de travailler'],'Pour favoriser l’entraide','L’entraide améliore la vie du groupe.')]),
      cp1Lesson('Respecter les différences',
        'Les enfants peuvent être différents par leur taille, leur langue familiale, leurs habitudes, leurs capacités ou leurs goûts. Tous doivent être traités avec respect.',
        'Une différence n’est pas une raison pour se moquer. Avant de juger, demande-toi comment tu aimerais être traité si tu étais à la place de l’autre.',
        'Exemple : un camarade apprend plus lentement ; on l’encourage au lieu de rire.',
        '🧒🏾  👧🏿  🧒🏻  🤝🏾','Enfants différents ensemble',[
          q('Un camarade parle différemment. Tu :',['le respectes','te moques','l’exclus'],'le respectes','La différence ne retire pas le droit au respect.'),
          q('Un enfant apprend plus lentement. Tu peux :',['l’encourager','l’insulter','cacher son cahier'],'l’encourager','L’encouragement aide davantage que la moquerie.'),
          q('Quelle question aide à réfléchir ?',['Comment aimerais-je être traité ?','Comment puis-je le faire pleurer ?','Comment cacher sa place ?'],'Comment aimerais-je être traité ?','Se mettre à la place de l’autre développe l’empathie.'),
          q('Être différent veut dire être moins important ?',['Non','Oui'],'Non','Chaque enfant mérite le respect.')]),
      cp1Lesson('Respecter sa famille',
        'Dans la famille, nous parlons avec respect, nous aidons selon notre âge et nous prenons soin des personnes et des biens.',
        'Respecter ne veut pas dire rester silencieux quand on a un problème. Un enfant peut parler à un adulte de confiance s’il a peur, s’il est blessé ou s’il a besoin d’aide.',
        'Exemple : ranger son petit espace et parler poliment aux adultes et aux autres enfants.',
        '👨🏾‍👩🏾‍👧🏾‍👦🏾  🏠  🤝🏾','Famille dans une maison',[
          q('Quel comportement aide la famille ?',['Ranger ce que tu peux','Casser exprès','Insulter'],'Ranger ce que tu peux','Chacun peut contribuer selon son âge.'),
          q('Tu as un problème qui te fait peur. Tu peux :',['parler à un adulte de confiance','toujours le cacher','fuir seul très loin'],'parler à un adulte de confiance','Chercher une aide sûre est important.'),
          q('Respecter sa famille signifie aussi :',['parler correctement','prendre sans demander toujours','faire mal aux autres'],'parler correctement','Le respect se montre dans les paroles et les actes.'),
          q('Un enfant doit-il tout résoudre seul ?',['Non','Oui toujours'],'Non','Il peut et doit chercher l’aide d’adultes responsables quand nécessaire.')]),
      cp1Lesson('Les règles de la classe',
        'Une règle aide la classe à fonctionner : arriver prêt, écouter, lever la main, respecter le matériel et les personnes.',
        'Une bonne règle protège l’apprentissage ou la sécurité. Demande-toi : « Que se passerait-il si personne ne respectait cette règle ? »',
        'Exemple : si personne ne range les livres, ils se perdent ou s’abîment.',
        '🏫  📚  ✋🏾  ✅','Classe avec règles simples',[
          q('Pourquoi lever la main ?',['Pour organiser la parole','Pour faire peur','Pour casser la règle'],'Pour organiser la parole','Cela aide chacun à être entendu.'),
          q('Le matériel de classe doit être :',['protégé','détruit','jeté'],'protégé','Il sert à plusieurs élèves.'),
          q('Une règle utile sert souvent :',['à organiser ou protéger','à humilier','à favoriser seulement un élève'],'à organiser ou protéger','Les règles doivent avoir une fonction compréhensible.'),
          q('Si personne ne range les livres, que peut-il arriver ?',['Ils peuvent se perdre ou s’abîmer','Ils deviennent neufs','Ils se rangent seuls'],'Ils peuvent se perdre ou s’abîmer','Réfléchir aux conséquences aide à comprendre la règle.')]),
      cp1Lesson('Être honnête',
        'Être honnête, c’est dire la vérité et ne pas prendre ce qui ne nous appartient pas. Si tu trouves un objet, cherche son propriétaire ou donne-le à un adulte responsable.',
        'Dire la vérité peut parfois être difficile. Mais cacher une erreur peut créer un deuxième problème. Reconnaître ce qui s’est passé aide à chercher une solution.',
        'Exemple : tu trouves un crayon dans la cour : tu demandes à qui il appartient.',
        '✏️  ❓  🙋🏾','Objet trouvé et recherche du propriétaire',[
          q('Tu trouves un cahier qui ne t’appartient pas. Tu :',['cherches le propriétaire ou un adulte','le caches','déchires son nom'],'cherches le propriétaire ou un adulte','Un objet trouvé doit être rendu.'),
          q('Tu as fait une erreur. Quelle attitude est honnête ?',['Dire ce qui s’est passé','accuser au hasard','inventer toujours une histoire'],'Dire ce qui s’est passé','La vérité permet de résoudre le problème.'),
          q('Prendre un objet sans permission est :',['incorrect','toujours permis','une forme de partage'],'incorrect','Il faut respecter le bien d’autrui.'),
          q('Pourquoi l’honnêteté aide-t-elle la confiance ?',['Parce qu’on peut mieux croire la parole donnée','Parce qu’elle cache tout','Parce qu’elle évite toute discussion'],'Parce qu’on peut mieux croire la parole donnée','La confiance se construit par des actes cohérents.')]),
      cp1Lesson('Tenir une petite promesse',
        'Une promesse est un engagement. Si tu dis que tu vas rendre un livre demain, tu dois essayer de le faire.',
        'Avant de promettre, demande-toi si tu peux réellement faire ce que tu annonces. Il vaut mieux dire la vérité que promettre quelque chose d’impossible.',
        'Exemple : « Je te rends ta règle après l’exercice. » Puis tu la rends.',
        '🤝🏾  📏  ✅','Engagement tenu',[
          q('Tu promets de rendre une règle. Que fais-tu après ?',['Tu la rends','Tu la caches','Tu la casses'],'Tu la rends','Tenir un engagement construit la confiance.'),
          q('Avant de promettre, tu dois :',['réfléchir si tu peux le faire','dire oui à tout','ne jamais écouter'],'réfléchir si tu peux le faire','Une promesse doit être réaliste.'),
          q('Tu ne peux pas faire ce que tu avais annoncé. Tu :',['expliques honnêtement','inventes toujours une excuse','disparais'],'expliques honnêtement','La communication honnête est préférable au mensonge.'),
          q('Tenir sa parole aide :',['la confiance','la confusion','la casse du matériel'],'la confiance','Les autres savent qu’ils peuvent compter sur toi.')]),
      cp1Lesson('Régler un désaccord sans violence',
        'Deux personnes peuvent ne pas être d’accord. On peut parler, écouter l’autre et chercher une solution sans frapper ni insulter.',
        'Avant de répondre avec colère, arrête-toi et explique le problème avec des mots simples. Si le désaccord devient difficile, demande l’aide d’un adulte.',
        'Exemple : deux enfants veulent le même ballon : ils peuvent décider de jouer à tour de rôle.',
        '⚽  🧒🏾💬👧🏾  🤝🏾','Deux enfants discutent autour d’un ballon',[
          q('Deux camarades veulent le même objet. Bonne solution :',['parler et chercher un tour de rôle','se battre','casser l’objet'],'parler et chercher un tour de rôle','Le dialogue peut produire une solution juste.'),
          q('Tu es très en colère. Que peux-tu faire d’abord ?',['t’arrêter et parler calmement','frapper','jeter les affaires'],'t’arrêter et parler calmement','Prendre un moment aide à contrôler sa réaction.'),
          q('Le problème devient dangereux. Tu :',['appelles un adulte','continues la bagarre','caches le problème'],'appelles un adulte','Un adulte peut sécuriser la situation.'),
          q('Être en désaccord oblige-t-il à être violent ?',['Non','Oui'],'Non','On peut défendre son point de vue avec des mots.')]),
      cp1Lesson('Protéger les biens communs',
        'Une table d’école, un livre de classe, une fontaine ou une cour peuvent servir à plusieurs personnes. Ce sont des biens ou espaces communs qu’il faut protéger.',
        'Si une personne abîme volontairement un bien commun, plusieurs personnes peuvent perdre son usage. Penser au bien commun, c’est penser aux autres aussi.',
        'Exemple : utiliser un livre de classe proprement puis le ranger.',
        '📚  🪑  🚰  🏫','Biens utilisés par plusieurs personnes',[
          q('Après avoir utilisé un livre de classe, tu :',['le ranges','le déchires','le jettes'],'le ranges','Le rangement protège le livre.'),
          q('Pourquoi ne pas casser une table d’école ?',['Elle sert à plusieurs élèves','Elle ne sert à personne','Pour la cacher'],'Elle sert à plusieurs élèves','Un bien commun est utile au groupe.'),
          q('Qui doit protéger les biens communs ?',['Tout le monde selon sa responsabilité','personne','seulement un enfant'],'Tout le monde selon sa responsabilité','La protection est une responsabilité partagée.'),
          q('Penser au bien commun, c’est penser :',['aux besoins du groupe aussi','seulement à soi','à détruire'],'aux besoins du groupe aussi','La vie collective demande de considérer les autres.')]),
      cp1Lesson('Propreté et environnement',
        'Garder la classe, la cour et le quartier propres est un geste citoyen. Les déchets vont dans les endroits prévus et nous évitons de salir volontairement.',
        'Un seul papier semble petit, mais cent papiers font beaucoup de déchets. Chaque geste individuel peut avoir un effet collectif.',
        'Exemple : mettre son emballage dans la poubelle ou le dispositif prévu.',
        '🌿  🗑️  🧹  🏫','Environnement propre',[
          q('Un papier est au sol. Tu :',['le mets au bon endroit','le disperses','le caches sous une chaise'],'le mets au bon endroit','Un déchet doit être géré proprement.'),
          q('Pourquoi un petit geste compte ?',['Les gestes de chacun s’additionnent','Il ne compte jamais','Il change la météo'],'Les gestes de chacun s’additionnent','L’effet collectif vient de nombreuses actions individuelles.'),
          q('Protéger l’environnement signifie :',['éviter de salir et prendre soin du milieu','casser les arbres','jeter partout'],'éviter de salir et prendre soin du milieu','Le milieu commun doit rester sain et utilisable.'),
          q('La propreté est-elle seulement l’affaire du maître ?',['Non','Oui'],'Non','Chacun participe selon son rôle.')]),
      cp1Lesson('Bien se comporter sur la route',
        'Sur la route, un enfant doit être accompagné selon son âge et la situation. Avant de traverser, il s’arrête, regarde, écoute et suit les consignes de l’adulte.',
        'La sécurité demande d’anticiper. Un véhicule peut arriver vite même quand la route semble calme.',
        'Exemple : s’arrêter au bord, regarder des deux côtés puis traverser seulement quand c’est sûr avec l’adulte.',
        '🚸  👧🏾🤝🏾🧑🏾  🚗','Enfant accompagné près d’une route',[
          q('Avant de traverser, tu :',['t’arrêtes et observes','cours sans regarder','joues au milieu'],'t’arrêtes et observes','Observer aide à repérer les véhicules.'),
          q('Pourquoi regarder des deux côtés ?',['Un danger peut venir de directions différentes','Pour compter les maisons seulement','Pour changer la route'],'Un danger peut venir de directions différentes','Il faut vérifier plusieurs directions.'),
          q('Est-il prudent de jouer sur la chaussée ?',['Non','Oui'],'Non','La chaussée est destinée à la circulation des véhicules.'),
          q('Avec qui un jeune enfant doit-il suivre les règles de traversée ?',['un adulte responsable','personne même si la route est dangereuse','un ballon'],'un adulte responsable','L’accompagnement adapté augmente la sécurité.')]),
      cp1Lesson('Être solidaire',
        'La solidarité, c’est ne pas rester indifférent quand quelqu’un a besoin d’une aide raisonnable. Nous pouvons aider une personne âgée, un camarade blessé ou quelqu’un qui ne comprend pas.',
        'Aider doit rester sûr. Tu n’entreprends pas seul une action dangereuse. Tu peux appeler un adulte ou un service approprié quand la situation dépasse tes capacités.',
        'Exemple : un camarade tombe : tu préviens l’enseignant et tu lui laisses de l’espace.',
        '🤝🏾  ❤️  🧒🏾  👵🏾','Entraide entre personnes',[
          q('Un camarade se blesse. Tu :',['préviens un adulte','ris','le pousses encore'],'préviens un adulte','Chercher une aide adaptée est solidaire et sûr.'),
          q('Solidarité signifie :',['aider de façon utile et respectueuse','ignorer tout le monde','faire tout seul même si c’est dangereux'],'aider de façon utile et respectueuse','L’aide tient compte des besoins et de la sécurité.'),
          q('Une action est dangereuse pour toi. Tu :',['appelles un adulte','te mets en danger','caches le problème'],'appelles un adulte','Aider ne signifie pas se mettre inutilement en danger.'),
          q('Pourquoi soutenir un camarade qui apprend ?',['Pour l’encourager','Pour se moquer','Pour l’empêcher d’essayer'],'Pour l’encourager','L’entraide favorise la progression de chacun.')]),
      cp1Lesson('Les droits de l’enfant',
        'Un enfant a des droits. Il a notamment droit à une identité, à l’éducation, à la protection et aux soins nécessaires.',
        'Un droit protège le développement de l’enfant. Si un enfant est en danger ou privé d’un besoin essentiel, il doit pouvoir demander de l’aide à un adulte ou une institution responsable.',
        'Exemple : aller à l’école est lié au droit à l’éducation.',
        '🧒🏾  🏫  🏥  🛡️','Enfant, école, soins et protection',[
          q('Aller à l’école est lié au droit :',['à l’éducation','à casser','à insulter'],'à l’éducation','L’éducation fait partie des droits de l’enfant.'),
          q('Un enfant doit être protégé contre :',['la violence','l’apprentissage','les soins'],'la violence','La protection de l’enfant est fondamentale.'),
          q('Avoir un nom et une identité est :',['un droit','une punition','un jeu seulement'],'un droit','L’identité permet notamment de reconnaître légalement l’enfant.'),
          q('Un enfant est en danger. Que doit-il pouvoir faire ?',['chercher l’aide d’un adulte ou service responsable','rester seul toujours','cacher toute situation'],'chercher l’aide d’un adulte ou service responsable','Un droit à la protection implique l’accès à une aide.')]),
      cp1Lesson('Mes responsabilités d’élève',
        'À l’école, l’élève a aussi des responsabilités : essayer de travailler, respecter les autres, prendre soin du matériel et suivre les règles de sécurité.',
        'Avoir des responsabilités ne signifie pas être parfait. Quand tu fais une erreur, tu peux la reconnaître, apprendre et recommencer mieux.',
        'Exemple : préparer son cahier et essayer l’exercice avant de demander la réponse.',
        '🎒  📒  ✏️  ✅','Élève prêt à travailler',[
          q('Une responsabilité d’élève est :',['respecter le matériel','le détruire','empêcher les autres d’apprendre'],'respecter le matériel','Le matériel sert à l’apprentissage.'),
          q('Face à un exercice difficile, tu peux :',['essayer puis demander de l’aide','abandonner sans lire','copier toujours'],'essayer puis demander de l’aide','L’effort et la demande d’aide développent l’autonomie.'),
          q('Tu fais une erreur. Tu :',['cherches à comprendre et corriger','caches toujours','accuses quelqu’un'],'cherches à comprendre et corriger','L’erreur peut servir à apprendre.'),
          q('Droits et responsabilités peuvent-ils aller ensemble ?',['Oui','Non jamais'],'Oui','La vie en groupe associe protections et devoirs adaptés.')]),
      cp1Lesson('Bien vivre dans le quartier',
        'Dans le quartier, nous saluons, respectons le voisinage, évitons les violences et prenons soin des lieux communs.',
        'Vivre ensemble demande de penser aux conséquences. Faire beaucoup de bruit près d’une personne malade ou jeter des déchets devant une porte peut gêner les autres.',
        'Exemple : saluer un voisin et garder le passage propre.',
        '🏘️  👋🏾  🧹  🤝🏾','Quartier et voisins',[
          q('Quel comportement aide le voisinage ?',['saluer et respecter','insulter','jeter des déchets devant les portes'],'saluer et respecter','Le respect facilite les relations.'),
          q('Pourquoi éviter de gêner volontairement les autres ?',['Ils ont aussi des besoins et des droits','Parce qu’ils ne comptent pas','Pour faire plus de bruit'],'Ils ont aussi des besoins et des droits','La vie commune demande de considérer autrui.'),
          q('Un passage commun doit rester :',['accessible et propre','bloqué volontairement','plein de déchets'],'accessible et propre','Le lieu sert à plusieurs personnes.'),
          q('Avant une action dans un lieu commun, tu peux te demander :',['Quel effet cela aura sur les autres ?','Comment cacher mon geste ?','Comment salir plus ?'],'Quel effet cela aura sur les autres ?','Penser aux conséquences développe le sens civique.')]),
      cp1Lesson('Le drapeau et les symboles de la Guinée',
        'Le drapeau de la République de Guinée porte trois bandes verticales : rouge, jaune et vert. Le drapeau est un symbole du pays.',
        'Un symbole national représente une communauté politique entière. On le respecte sans l’utiliser pour se moquer ou abîmer volontairement ce qu’il représente.',
        'Exemple : 🇬🇳 rouge, jaune, vert.',
        '🇬🇳  ROUGE  JAUNE  VERT','Drapeau de la République de Guinée',[
          q('Quelles sont les couleurs du drapeau guinéen ?',['rouge, jaune, vert','bleu, blanc, rouge','vert, blanc, orange'],'rouge, jaune, vert','Le drapeau guinéen porte ces trois couleurs.'),
          q('Le drapeau est :',['un symbole national','un jouet à déchirer','un aliment'],'un symbole national','Il représente le pays.'),
          q('Les bandes du drapeau guinéen sont :',['verticales','en cercle','sans ordre'],'verticales','Les trois bandes sont disposées verticalement.'),
          q('Pourquoi respecter un symbole national ?',['Parce qu’il représente la communauté nationale','Parce qu’il appartient à un seul enfant','Pour empêcher les autres de le voir'],'Parce qu’il représente la communauté nationale','Le symbole dépasse les personnes individuelles.')])
    ],

    arts: [
      cp1Lesson('Reconnaître les couleurs',
        'Nous apprenons des couleurs courantes : rouge, jaune, vert, bleu, noir et blanc. Regarde la couleur puis dis son nom.',
        'Deux objets peuvent avoir la même forme mais des couleurs différentes. Pour répondre, regarde seulement le critère demandé : ici, la couleur.',
        'Exemple : 🔴 est rouge ; 🔵 est bleu ; 🟢 est vert.',
        '🔴  🟡  🟢  🔵  ⚫  ⚪','Couleurs courantes',[
          q('Quelle pastille est rouge ?',['🔴','🔵','🟢'],'🔴','La pastille rouge correspond à la couleur demandée.'),
          q('Quelle pastille est verte ?',['🟢','🟡','⚫'],'🟢','Le vert est représenté par la pastille verte.'),
          q('Deux ronds ont la même forme mais l’un est rouge et l’autre bleu. Qu’est-ce qui change ?',['la couleur','la forme','le nombre'],'la couleur','La forme reste ronde ; seule la couleur change.'),
          q('Pour classer par couleur, tu regardes :',['la couleur','le bruit','le poids seulement'],'la couleur','Il faut suivre le critère choisi.')]),
      cp1Lesson('Clair, foncé et choix de couleur',
        'Une même famille de couleur peut paraître plus claire ou plus foncée. Nous pouvons aussi choisir une couleur pour mieux faire ressortir une forme.',
        'En dessin, le choix de couleur peut aider à distinguer les éléments. Si tout a exactement la même couleur, certains détails sont plus difficiles à voir.',
        'Exemple : un soleil jaune sur un ciel bleu se distingue facilement.',
        '☀️  🟦  🌳  🟩','Soleil, ciel et arbre colorés',[
          q('Pour faire ressortir un soleil jaune, quel fond peut bien le distinguer ?',['bleu','exactement le même jaune partout','aucun dessin'],'bleu','Deux couleurs différentes peuvent rendre les éléments plus lisibles.'),
          q('Clair et foncé décrivent :',['une nuance de couleur','un nombre','un son seulement'],'une nuance de couleur','Une couleur peut être plus claire ou plus foncée.'),
          q('Pourquoi varier certaines couleurs ?',['Pour mieux distinguer les éléments','Pour empêcher de voir le dessin','Pour supprimer les formes'],'Pour mieux distinguer les éléments','Le contraste peut améliorer la lecture visuelle.'),
          q('Faut-il toujours copier exactement la couleur réelle pour créer ?',['Non','Oui toujours'],'Non','L’art permet aussi des choix imaginatifs, tant que l’objectif est compris.')]),
      cp1Lesson('Tracer des lignes',
        'Une ligne peut être droite, courbe, verticale, horizontale ou inclinée. Le geste part d’un point et suit une direction.',
        'Avant de tracer, regarde où tu veux commencer et où tu veux finir. Aller plus lentement aide souvent à mieux contrôler la main.',
        'Exemple : | verticale ; — horizontale ; ∿ courbe.',
        '|   —   /   ∿','Différents types de lignes',[
          q('Quelle ligne est verticale ?',['|','—','∿'],'|','Elle va du haut vers le bas.'),
          q('Quelle ligne est courbe ?',['∿','|','—'],'∿','Elle change progressivement de direction.'),
          q('Avant de tracer, il est utile de :',['regarder le départ et l’arrivée','fermer les yeux','bouger la feuille au hasard'],'regarder le départ et l’arrivée','Prévoir le trajet améliore le contrôle.'),
          q('Ton trait dépasse beaucoup. Que peux-tu faire ?',['recommencer plus lentement','déchirer la feuille','continuer sans regarder'],'recommencer plus lentement','Observer son erreur permet de s’améliorer.')]),
      cp1Lesson('Reconnaître les formes',
        'Nous observons le rond, le triangle, le carré et le rectangle. Chaque forme a des caractéristiques visibles.',
        'Pour reconnaître une forme, ne regarde pas sa couleur. Compte ou observe ses côtés et sa forme générale.',
        'Exemple : ○ rond ; △ triangle ; □ carré ; ▭ rectangle.',
        '○  △  □  ▭','Quatre formes de base',[
          q('Quel dessin est un triangle ?',['△','○','□'],'△','Le triangle a trois côtés.'),
          q('Quel dessin est un carré ?',['□','○','△'],'□','Le carré a quatre côtés de même longueur.'),
          q('Un carré rouge et un carré bleu ont-ils la même forme ?',['Oui','Non'],'Oui','La couleur change mais la forme reste carrée.'),
          q('Quel critère aide à reconnaître une forme ?',['ses côtés et son contour','son goût','son bruit'],'ses côtés et son contour','La géométrie visuelle repose sur le contour.')]),
      cp1Lesson('Observer avant de dessiner',
        'Avant de dessiner, regarde bien l’objet. Observe sa forme générale, ses grandes parties, leur position et leur taille.',
        'Ne commence pas par un petit détail. Commence par la grande forme, puis ajoute les parties importantes et enfin quelques détails.',
        'Exemple : pour une tasse, dessine d’abord le corps puis l’anse.',
        '👀  ☕  ✏️','Observer une tasse avant de la dessiner',[
          q('Avant de dessiner un objet, tu dois :',['l’observer','le cacher','fermer les yeux'],'l’observer','L’observation donne les informations utiles.'),
          q('Que dessiner d’abord ?',['la forme générale','le plus petit détail invisible','le nom seulement'],'la forme générale','La grande structure sert de base.'),
          q('Tu oublies un détail important. Tu peux :',['regarder encore le modèle','inventer au hasard puis effacer tout','abandonner'],'regarder encore le modèle','Revenir au modèle est une stratégie d’autocorrection.'),
          q('Pourquoi regarder les proportions ?',['Pour placer les parties de façon cohérente','Pour changer les couleurs seulement','Pour compter les syllabes'],'Pour placer les parties de façon cohérente','La taille relative des parties aide à reconnaître l’objet.')]),
      cp1Lesson('Dessiner un objet familier',
        'Choisis un objet simple : un cahier, une tasse ou un ballon. Décompose-le en formes faciles puis ajoute les détails.',
        'Un objet complexe devient plus facile quand on le coupe mentalement en petites formes. Cette méthode sert aussi à résoudre d’autres problèmes.',
        'Exemple : ballon = grand rond + petits motifs.',
        '📒  ☕  ⚽  ✏️','Objets familiers à dessiner',[
          q('Pour dessiner un ballon, tu peux commencer par :',['un rond','un long texte','une addition'],'un rond','La forme générale du ballon est ronde.'),
          q('Décomposer un objet sert à :',['le rendre plus facile à dessiner','le faire disparaître','changer son nom'],'le rendre plus facile à dessiner','On transforme une tâche complexe en étapes simples.'),
          q('Après la grande forme, tu peux ajouter :',['les détails utiles','un objet sans rapport','rien toujours'],'les détails utiles','Les détails complètent la représentation.'),
          q('Ton dessin ne ressemble pas au modèle. Tu :',['compares et ajustes','accuses le crayon','arrêtes de regarder'],'compares et ajustes','Comparer le résultat au modèle développe l’autocorrection.')]),
      cp1Lesson('Dessiner une personne',
        'Pour dessiner une personne simplement, commence par la tête, le tronc, les bras et les jambes. Ajoute ensuite le visage et les vêtements.',
        'Observe la position : les bras sont reliés au haut du tronc, les jambes au bas. L’objectif n’est pas la perfection mais une représentation compréhensible.',
        'Exemple : ○ pour la tête, puis des formes simples pour le corps.',
        '🧒🏾  ○  │  /\\','Personne et construction simple',[
          q('Quelle partie peux-tu placer en haut ?',['la tête','les pieds','les genoux'],'la tête','La tête se situe au-dessus du tronc.'),
          q('Les jambes sont reliées surtout :',['au bas du tronc','aux oreilles','au nez'],'au bas du tronc','La position des parties aide à construire le corps.'),
          q('Un dessin CP1 doit-il être parfait comme une photo ?',['Non','Oui'],'Non','L’objectif est d’observer et représenter clairement.'),
          q('Pourquoi commencer par les grandes parties ?',['Pour organiser le dessin','Pour cacher le corps','Pour éviter toute observation'],'Pour organiser le dessin','Les grandes formes donnent la structure.')]),
      cp1Lesson('Dessiner une plante ou un animal',
        'Une plante peut être dessinée avec tige, feuilles et racines visibles si on veut expliquer sa structure. Un animal peut être construit avec de grandes formes puis ses pattes, sa tête et sa queue.',
        'Le dessin peut montrer ce que tu as compris en sciences. Si tu dessines une poule avec quatre pattes, compare avec l’animal réel et corrige.',
        'Exemple : 🌱 tige + feuilles ; 🐔 corps + tête + deux pattes.',
        '🌱  🌿  🐔  ✏️','Plante et poule',[
          q('Une plante possède souvent :',['une tige et des feuilles','des roues','des chaussures'],'une tige et des feuilles','Ces parties appartiennent à de nombreuses plantes.'),
          q('Une poule a normalement :',['deux pattes','quatre pattes','six pattes'],'deux pattes','La poule est un oiseau bipède.'),
          q('Ton dessin montre un détail faux. Que fais-tu ?',['Tu compares et corriges','Tu refuses de regarder','Tu dis que le modèle est faux sans vérifier'],'Tu compares et corriges','Le dessin peut servir à vérifier une observation.'),
          q('Le dessin peut-il aider à apprendre les sciences ?',['Oui','Non jamais'],'Oui','Représenter oblige à observer et organiser les informations.')]),
      cp1Lesson('Créer un motif qui se répète',
        'Un motif est une petite suite qui se répète. Exemple : rond, carré, rond, carré. Tu peux créer des motifs avec formes ou couleurs.',
        'Pour trouver la suite, cherche la plus petite partie qui revient. Puis continue sans casser la règle.',
        'Exemple : 🔴🟦 🔴🟦 🔴🟦.',
        '🔴🟦  🔴🟦  🔴🟦','Motif rouge-bleu répété',[
          q('Complète : 🔴🟦 🔴🟦 🔴 ___',['🟦','🔴','△'],'🟦','Le motif alterne rouge puis bleu.'),
          q('Quel petit groupe se répète ?',['🔴🟦','🔴🔴🔴','🟦🟦'],'🔴🟦','C’est la plus petite unité répétée.'),
          q('Pourquoi chercher la règle ?',['Pour continuer correctement le motif','Pour choisir au hasard','Pour supprimer les couleurs'],'Pour continuer correctement le motif','La régularité permet de prévoir la suite.'),
          q('Peux-tu créer ton propre motif avec deux formes ?',['Oui','Non'],'Oui','La création suit une règle choisie par l’enfant.')]),
      cp1Lesson('Découvrir la symétrie',
        'Une image est symétrique quand deux parties se correspondent comme dans un miroir autour d’une ligne.',
        'Pour vérifier, imagine que tu plies la figure sur la ligne. Les parties doivent se superposer ou se correspondre.',
        'Exemple : 🦋 montre souvent une symétrie entre ses deux ailes.',
        '🦋  ↔️  🪞','Papillon et idée de miroir',[
          q('Quel animal montre facilement deux côtés symétriques ?',['un papillon vu de face','une pierre irrégulière','un trait au hasard'],'un papillon vu de face','Ses deux ailes se correspondent largement.'),
          q('La symétrie ressemble à :',['un effet miroir','un bruit fort','une addition'],'un effet miroir','Les deux côtés se répondent.'),
          q('Quelle action peut aider à vérifier une figure sur papier ?',['imaginer ou faire un pli sur l’axe','la goûter','la cacher'],'imaginer ou faire un pli sur l’axe','Le pli permet de comparer les deux côtés.'),
          q('Deux côtés complètement différents sont-ils parfaitement symétriques ?',['Non','Oui toujours'],'Non','La symétrie exige une correspondance.')]),
      cp1Lesson('Décorer avec ordre',
        'Décorer, c’est ajouter des formes, couleurs ou motifs pour rendre une production agréable et organisée.',
        'Une belle décoration n’a pas besoin d’être très chargée. Répéter quelques formes avec un ordre clair peut être plus lisible que tout mélanger.',
        'Exemple : bordure △○△○△○.',
        '△○△○△○','Petite bordure décorative',[
          q('Une décoration organisée peut utiliser :',['un motif régulier','tout au hasard forcément','aucune forme'],'un motif régulier','La répétition crée une organisation visuelle.'),
          q('Faut-il remplir tout l’espace sans réfléchir ?',['Non','Oui toujours'],'Non','Laisser de l’espace peut rendre le dessin plus clair.'),
          q('Complète : △○△○ ___',['△','○○','□'],'△','Le motif alterne triangle et rond.'),
          q('Pourquoi regarder l’ensemble avant de finir ?',['Pour vérifier l’équilibre de la décoration','Pour oublier le motif','Pour supprimer toutes les couleurs'],'Pour vérifier l’équilibre de la décoration','Une vue globale aide à ajuster la composition.')]),
      cp1Lesson('Écouter et reproduire un rythme',
        'Un rythme est une organisation de sons dans le temps. Écoute une petite suite de frappes puis essaie de la reproduire.',
        'Pour réussir, cherche le motif. « clap-clap, pause, clap » est différent de « clap, clap, clap ».',
        'Exemple : 👏🏾👏🏾 — pause — 👏🏾.',
        '👏🏾👏🏾  ⏸️  👏🏾','Suite rythmique simple',[
          q('Quel motif correspond à deux frappes puis une pause ?',['👏🏾👏🏾 ⏸️','👏🏾 ⏸️ 👏🏾','⏸️ seulement'],'👏🏾👏🏾 ⏸️','Il y a bien deux frappes avant la pause.'),
          q('Pour reproduire un rythme, tu utilises surtout :',['l’écoute et la mémoire','le goût','la lecture d’un nombre seulement'],'l’écoute et la mémoire','Il faut entendre puis retenir la suite.'),
          q('Deux rythmes ont-ils la même règle s’ils n’ont pas les mêmes pauses ?',['Pas forcément','Oui toujours'],'Pas forcément','La place des pauses fait partie du rythme.'),
          q('Pourquoi chercher ce qui se répète ?',['Pour prévoir et reproduire le rythme','Pour le rendre silencieux','Pour changer le nombre de doigts'],'Pour prévoir et reproduire le rythme','Un motif répétitif facilite la mémorisation.')]),
      cp1Lesson('Fort, doux, rapide et lent',
        'Un son peut être plus fort ou plus doux. Un rythme peut être plus rapide ou plus lent. Nous apprenons à écouter ces différences.',
        'Fort ne veut pas dire meilleur. Pour chanter ou réciter ensemble, il faut adapter sa voix et écouter les autres.',
        'Exemple : parler doucement dans une activité calme ; parler assez fort pour être entendu devant la classe.',
        '🔊  🔉  🐇  🐢','Fort, doux, rapide et lent',[
          q('Le contraire de rapide est :',['lent','fort','rouge'],'lent','Rapide et lent décrivent la vitesse.'),
          q('Le contraire de fort pour un son est :',['doux','long','carré'],'doux','Fort et doux décrivent l’intensité.'),
          q('Faut-il toujours crier pour bien chanter ?',['Non','Oui'],'Non','Il faut contrôler la voix et écouter le groupe.'),
          q('Pourquoi adapter sa voix ?',['Pour être entendu sans gêner','Pour casser le rythme','Pour empêcher les autres de chanter'],'Pour être entendu sans gêner','Le contrôle vocal améliore l’expression collective.')]),
      cp1Lesson('Chanter en écoutant le groupe',
        'Dans un chant de classe, tu écoutes le départ, tu respires et tu suis le rythme. Tu essaies de rester avec le groupe.',
        'Écouter les autres t’aide à ajuster ta voix. Si tu pars trop tôt ou trop vite, tu peux t’arrêter, écouter et reprendre avec le groupe.',
        'Exemple original de rythme vocal : « La-la / pause / la-la ».',
        '🎵  👧🏾🧒🏾👦🏾  👂🏾','Enfants chantant ensemble',[
          q('Avant de commencer avec le groupe, tu :',['écoutes le signal de départ','pars quand tu veux','cries seul'],'écoutes le signal de départ','Un départ commun aide le groupe.'),
          q('Tu vas trop vite. Tu peux :',['écouter et te recaler','accélérer encore','arrêter tout le monde'],'écouter et te recaler','L’écoute permet d’ajuster sa participation.'),
          q('Dans un chant collectif, il faut aussi :',['écouter les autres','se boucher les oreilles','changer le rythme seul'],'écouter les autres','La coordination dépend de l’écoute mutuelle.'),
          q('Quel motif vocal est proposé ?',['la-la / pause / la-la','la-la-la sans pause obligatoire','silence tout le temps'],'la-la / pause / la-la','Il respecte la petite structure annoncée.')]),
      cp1Lesson('Réciter clairement et mémoriser',
        'Réciter, c’est dire un petit texte de mémoire avec une voix claire. Commence par écouter, puis répète une petite partie à la fois.',
        'Pour mémoriser, coupe le texte en morceaux, répète chaque morceau puis relie-les. Fais des pauses aux points pour rendre le sens plus clair.',
        'Petite récitation originale : « Le matin se lève. / Je regarde le ciel. / J’apprends avec courage. »',
        '🌅  👀  📘  🗣️','Enfant récitant un petit texte',[
          q('Pour mémoriser un texte, tu peux :',['le couper en petites parties','tout mélanger','ne jamais l’écouter'],'le couper en petites parties','Les petites unités sont plus faciles à retenir.'),
          q('À la fin d’une phrase, une petite pause aide :',['à comprendre le sens','à oublier tous les mots','à parler plus vite sans respirer'],'à comprendre le sens','La ponctuation organise l’oral.'),
          q('Une récitation doit être :',['assez claire pour être comprise','toujours criée','murmurée sans articuler'],'assez claire pour être comprise','L’articulation rend les mots compréhensibles.'),
          q('Quelle stratégie aide après avoir appris deux petites parties ?',['Les relier et les réciter ensemble','en supprimer une au hasard','changer tous les mots'],'Les relier et les réciter ensemble','On construit progressivement le texte complet.')]),
      cp1Lesson('Créer une petite œuvre personnelle',
        'Tu peux créer un dessin libre à partir d’une idée : ma maison, mon école, un arbre, un animal ou une scène inventée. Choisis d’abord ce que tu veux montrer.',
        'Une création suit aussi une démarche : idée, grandes formes, détails, couleurs, puis vérification. Tu peux expliquer ce que tu as voulu représenter.',
        'Exemple : « Je dessine un manguier près de ma maison parce que je veux montrer mon quartier. »',
        '🏠  🌳  ☀️  ✏️  🎨','Petite scène créée par un enfant',[
          q('Avant de créer, il est utile de :',['choisir une idée','faire tout au hasard','cacher la feuille'],'choisir une idée','Une intention donne une direction au travail.'),
          q('Après les grandes formes, tu peux ajouter :',['des détails et couleurs','une réponse sans rapport','rien par obligation'],'des détails et couleurs','Le dessin se construit par étapes.'),
          q('Pourquoi expliquer ton dessin ?',['Pour mettre des mots sur ton idée','Pour changer sa taille','Pour compter uniquement les couleurs'],'Pour mettre des mots sur ton idée','Parler de sa création développe l’expression.'),
          q('Peux-tu corriger ou améliorer une création ?',['Oui','Non jamais'],'Oui','Créer inclut l’observation, le choix et l’amélioration.')])
    ],

    eps: [
      cp1Lesson('Écouter un signal et s’arrêter',
        'En sport, un signal peut dire « commence » ou « stop ». Quand tu entends « stop », tu t’arrêtes et tu regardes l’enseignant.',
        'Écouter avant de bouger évite les collisions. Si tu n’as pas compris le signal, reste calme et demande la consigne.',
        'Exemple : coup de sifflet → je m’arrête → j’écoute.',
        '👂🏾  📣  ✋🏾  🧒🏾','Enfant qui écoute un signal',[
          q('Au signal « stop », tu :',['t’arrêtes','accélères','fermes les yeux'],'t’arrêtes','Le signal demande l’arrêt.'),
          q('Tu n’as pas compris le signal. Tu :',['t’arrêtes et demandes','cours au hasard','pousses les autres'],'t’arrêtes et demandes','En cas de doute, on choisit l’action la plus sûre.'),
          q('Pourquoi écouter le signal ?',['Pour agir ensemble et en sécurité','Pour faire plus de bruit','Pour oublier la règle'],'Pour agir ensemble et en sécurité','Le groupe a besoin d’une consigne commune.'),
          q('Après l’arrêt, tu regardes surtout :',['l’enseignant','le sol seulement','derrière toi sans raison'],'l’enseignant','Tu attends la prochaine consigne.')]),
      cp1Lesson('Marcher avec contrôle',
        'Marcher, c’est avancer sans courir. Regarde devant toi, garde un peu d’espace avec les autres et suis le chemin donné.',
        'Tu peux changer de vitesse ou de direction seulement quand la consigne le demande. Contrôler son corps est plus important que d’aller vite.',
        'Exemple : marcher jusqu’au cône puis s’arrêter.',
        '🚶🏾  ➡️  🔺  ✋🏾','Enfant marchant vers un repère',[
          q('Quand tu marches dans un exercice, tu regardes :',['devant toi','les yeux fermés','seulement tes chaussures'],'devant toi','Regarder devant aide à voir les obstacles.'),
          q('Pourquoi garder de l’espace ?',['Pour éviter les collisions','Pour pousser plus facilement','Pour perdre le groupe'],'Pour éviter les collisions','L’espace rend le déplacement plus sûr.'),
          q('La consigne dit marcher. Tu dois :',['marcher','courir très vite','sauter sur les autres'],'marcher','Il faut respecter le mouvement demandé.'),
          q('Le contrôle du corps signifie :',['adapter son mouvement à la consigne','bouger au hasard','aller toujours le plus vite'],'adapter son mouvement à la consigne','Le mouvement devient volontaire et organisé.')]),
      cp1Lesson('Courir en sécurité',
        'Courir est plus rapide que marcher. Tu regardes devant, tu évites de pousser et tu gardes une distance avec les autres.',
        'La vitesse doit rester adaptée à l’espace. Une petite zone encombrée demande plus de contrôle qu’un espace dégagé.',
        'Exemple : courir jusqu’au repère puis ralentir avant de s’arrêter.',
        '🏃🏾  ➡️  🔺','Enfant courant vers un repère',[
          q('Quand tu cours, tu dois surtout :',['regarder devant','fermer les yeux','pousser'],'regarder devant','Tu dois voir l’espace où tu vas.'),
          q('Pourquoi ne pas pousser ?',['Pour protéger les autres','Pour perdre la course','Pour aller moins loin'],'Pour protéger les autres','Une poussée peut faire tomber quelqu’un.'),
          q('Dans un petit espace, la bonne décision est :',['mieux contrôler sa vitesse','courir sans regarder','accélérer toujours'],'mieux contrôler sa vitesse','La vitesse doit s’adapter au lieu.'),
          q('Avant l’arrêt, tu peux :',['ralentir','sauter sur un camarade','tourner les yeux'],'ralentir','Ralentir aide à s’arrêter avec contrôle.')]),
      cp1Lesson('Changer de direction',
        'Tu peux aller devant, derrière, à gauche ou à droite selon la consigne. Regarde le repère avant de changer de direction.',
        'Un changement brusque sans regarder peut provoquer un choc. Pense : je regarde, je choisis le côté, puis je tourne.',
        'Exemple : marche devant → tourne à droite au cône.',
        '⬆️  ⬅️  ➡️  ⬇️','Flèches de directions',[
          q('La flèche ➡️ indique :',['à droite','à gauche','en bas'],'à droite','La flèche pointe vers la droite.'),
          q('Avant de tourner, tu :',['regardes l’espace','fermes les yeux','pousses celui qui est à côté'],'regardes l’espace','Vérifier le passage réduit le risque de collision.'),
          q('La consigne dit « à gauche ». Tu :',['suis la direction donnée','choisis toujours droite','t’arrêtes pour toujours'],'suis la direction donnée','Il faut comprendre et appliquer la consigne.'),
          q('Quel ordre est prudent ?',['regarder, choisir, tourner','tourner, fermer les yeux, courir','pousser, tourner, crier'],'regarder, choisir, tourner','La préparation précède le mouvement.')]),
      cp1Lesson('Garder son équilibre',
        'L’équilibre permet de rester stable. Écarter un peu les bras et regarder un point devant soi peut aider.',
        'Si tu vacilles, ralentis et retrouve une position stable. L’objectif n’est pas de tenir longtemps à tout prix mais de contrôler ton corps.',
        'Exemple : tenir quelques secondes sur une ligne sous la conduite de l’enseignant.',
        '🧒🏾  ━━━━━  ↔️','Enfant en équilibre sur une ligne',[
          q('Pour aider l’équilibre, tu peux :',['écarter les bras','fermer les yeux obligatoirement','sauter sur quelqu’un'],'écarter les bras','Les bras peuvent contribuer à la stabilité.'),
          q('Tu perds l’équilibre. Tu :',['ralentis et te stabilises','accélères sans regarder','pousses un camarade'],'ralentis et te stabilises','La sécurité passe avant la performance.'),
          q('Où peux-tu regarder ?',['un point devant toi','toujours derrière','les yeux fermés'],'un point devant toi','Un repère visuel aide à contrôler la posture.'),
          q('L’objectif principal est :',['contrôler son corps','tenir le plus longtemps même en danger','faire tomber les autres'],'contrôler son corps','La maîtrise du mouvement est la compétence recherchée.')]),
      cp1Lesson('Sauter à pieds joints',
        'Pour un petit saut à pieds joints, les deux pieds poussent ensemble puis reviennent au sol de façon stable. L’exercice se fait dans une zone sûre avec l’enseignant.',
        'Regarde la zone d’arrivée avant de sauter. Plie légèrement les jambes à la réception pour mieux contrôler le corps.',
        'Exemple : sauter une petite ligne au sol, sans obstacle dangereux.',
        '🦶🏾🦶🏾  ➡️  ┃','Pieds joints devant une ligne',[
          q('À pieds joints signifie :',['les deux pieds ensemble','une main seulement','un pied dans la main'],'les deux pieds ensemble','Les deux pieds participent au mouvement.'),
          q('Avant de sauter, tu regardes :',['la zone d’arrivée','derrière seulement','les yeux fermés'],'la zone d’arrivée','Il faut vérifier où l’on va retomber.'),
          q('À la réception, il est utile de :',['rester stable','tomber sur quelqu’un','continuer sans contrôle'],'rester stable','La réception fait partie du saut.'),
          q('Quel obstacle convient au CP1 ?',['une petite ligne au sol sous supervision','un mur élevé','une route avec voitures'],'une petite ligne au sol sous supervision','L’activité doit rester adaptée et sûre.')]),
      cp1Lesson('Lancer vers une cible',
        'Pour lancer un objet léger adapté, regarde la cible, oriente ton corps et lance seulement quand la zone est libre.',
        'La précision ne vient pas seulement de la force. Si l’objet part trop à gauche, observe ton bras et ton regard puis ajuste.',
        'Exemple : lancer une petite balle souple vers un panier avec l’enseignant.',
        '🥎  ➡️  🧺','Balle lancée vers un panier',[
          q('Avant de lancer, tu regardes :',['la cible','tes yeux fermés','seulement le sol'],'la cible','Le regard aide à orienter le geste.'),
          q('Quand peux-tu lancer ?',['quand la zone est libre','quand quelqu’un passe devant','sans consigne'],'quand la zone est libre','Il faut protéger les personnes dans la trajectoire.'),
          q('Ton lancer part à gauche. Tu peux :',['observer et ajuster','lancer plus fort sans regarder','abandonner immédiatement'],'observer et ajuster','L’autocorrection améliore la précision.'),
          q('La précision dépend seulement de la force ?',['Non','Oui'],'Non','Orientation, coordination et contrôle sont aussi importants.')]),
      cp1Lesson('Attraper une balle souple',
        'Pour attraper une balle souple, regarde la balle, prépare les mains et reste attentif à sa direction.',
        'Si la balle arrive doucement, accompagne son mouvement au lieu de raidir tout le corps. L’exercice doit rester adapté au niveau de l’enfant.',
        'Exemple : réception d’une balle souple lancée doucement par l’enseignant.',
        '👀  👐🏾  🥎','Mains prêtes à recevoir une balle',[
          q('Pour attraper, tu regardes :',['la balle','le plafond seulement','tes yeux fermés'],'la balle','Suivre la trajectoire aide à préparer les mains.'),
          q('Tes mains doivent être :',['prêtes devant toi selon la consigne','derrière le dos toujours','fermées sans regarder'],'prêtes devant toi selon la consigne','Une bonne préparation facilite la réception.'),
          q('La balle doit être :',['adaptée et souple','très lourde','dangereuse'],'adaptée et souple','Le matériel doit correspondre à l’âge et à l’activité.'),
          q('Pourquoi suivre la trajectoire ?',['Pour prévoir où la balle arrive','Pour changer sa couleur','Pour courir ailleurs'],'Pour prévoir où la balle arrive','Anticiper aide à coordonner le geste.')]),
      cp1Lesson('Faire rouler une balle',
        'Faire rouler une balle, c’est la pousser au sol vers une direction. Regarde le chemin et dose la force.',
        'Trop de force peut envoyer la balle loin de la cible. Pas assez de force peut l’arrêter avant. Tu observes le résultat et ajustes.',
        'Exemple : faire rouler la balle entre deux petits repères.',
        '🥎  ➡️  🔺   🔺','Balle roulant entre deux repères',[
          q('La balle doit rester surtout :',['au sol','dans le ciel','sur la tête'],'au sol','Rouler signifie se déplacer en contact avec le sol.'),
          q('Elle va trop loin. À l’essai suivant, tu peux :',['mettre moins de force','mettre toujours plus de force','fermer les yeux'],'mettre moins de force','Tu ajustes selon le résultat observé.'),
          q('Pourquoi regarder le chemin ?',['Pour viser et éviter un obstacle','Pour changer le ballon','Pour oublier la cible'],'Pour viser et éviter un obstacle','L’observation guide le mouvement.'),
          q('Quel geste développe-t-on ?',['le dosage de la force','le chant seulement','la lecture seule'],'le dosage de la force','L’enfant apprend à adapter l’énergie au but.')]),
      cp1Lesson('Coordonner les mains et les pieds',
        'La coordination permet à plusieurs parties du corps de travailler ensemble. Tu peux marcher en frappant doucement dans les mains au signal.',
        'Commence lentement. Quand le mouvement devient facile, tu peux suivre un rythme simple donné par l’enseignant.',
        'Exemple : un pas → un clap → un pas → un clap.',
        '👣  👏🏾  👣  👏🏾','Pas et frappes de mains alternés',[
          q('Coordonner signifie :',['faire travailler plusieurs mouvements ensemble','rester immobile toujours','crier'],'faire travailler plusieurs mouvements ensemble','La coordination relie plusieurs actions.'),
          q('Pour apprendre un mouvement difficile, commence :',['lentement','le plus vite possible','sans écouter'],'lentement','La lenteur aide à comprendre la séquence.'),
          q('Dans « pas-clap-pas-clap », qu’est-ce qui se répète ?',['pas-clap','deux cris','aucun motif'],'pas-clap','La coordination suit une petite régularité.'),
          q('Tu perds le rythme. Tu :',['ralentis et reprends','pousses les autres','continues au hasard'],'ralentis et reprends','Revenir à une vitesse contrôlée aide à réussir.')]),
      cp1Lesson('Suivre un petit parcours',
        'Un parcours peut demander de marcher jusqu’à un repère, contourner un cône puis revenir. Écoute toutes les étapes avant de commencer.',
        'Pour réussir, mémorise l’ordre : d’abord, ensuite, enfin. Ne saute pas une étape et ne coupe pas dans la zone des autres.',
        'Exemple : départ → cône rouge → cône bleu → arrivée.',
        '🚩  ➡️  🔴  ➡️  🔵  ➡️  🏁','Petit parcours avec deux repères',[
          q('Quelle est la première chose à faire ?',['écouter le parcours','courir tout de suite','déplacer les cônes'],'écouter le parcours','Il faut connaître l’ordre des étapes.'),
          q('Pourquoi retenir « d’abord, ensuite, enfin » ?',['Pour garder l’ordre','Pour aller au hasard','Pour oublier le départ'],'Pour garder l’ordre','La séquence organise l’action.'),
          q('Peut-on couper dans la zone d’un camarade ?',['Non','Oui toujours'],'Non','Il faut respecter l’espace des autres.'),
          q('Tu oublies l’étape suivante. Tu :',['t’arrêtes et demandes','inventes une route dangereuse','pousses un cône sur quelqu’un'],'t’arrêtes et demandes','Clarifier la consigne évite une erreur risquée.')]),
      cp1Lesson('Bouger sur un rythme',
        'Le corps peut suivre un rythme : marche, marche, pause ; marche, marche, pause. Écoute d’abord puis bouge.',
        'Le rythme aide à coordonner le temps du mouvement. Si tu vas trop vite, écoute de nouveau le motif et ralentis.',
        'Exemple : 👣👣 — pause — 👣👣.',
        '👣👣  ⏸️  👣👣','Pas organisés par un rythme',[
          q('Quel motif est montré ?',['deux pas puis pause','un pas sans fin','trois sauts obligatoires'],'deux pas puis pause','Le groupe de deux pas est suivi d’une pause.'),
          q('Tu vas trop vite. Tu :',['ralentis et écoutes','accélères toujours','arrêtes d’écouter'],'ralentis et écoutes','Le rythme se corrige par l’écoute.'),
          q('Le rythme organise :',['le temps du mouvement','la couleur des chaussures','le poids du ballon'],'le temps du mouvement','Il indique quand agir et quand faire une pause.'),
          q('Avant de bouger, il est utile :',['d’écouter le motif','de fermer les oreilles','de partir au hasard'],'d’écouter le motif','L’écoute prépare l’action.')]),
      cp1Lesson('Faire un relais simple',
        'Dans un relais, chaque enfant fait une partie de l’activité puis passe le tour au suivant. Le groupe réussit quand chacun respecte l’ordre.',
        'Le plus rapide ne peut pas gagner seul si le groupe oublie les règles. Coopérer, c’est faire correctement sa part et faciliter celle du camarade.',
        'Exemple : courir jusqu’au repère, revenir, toucher la main du suivant.',
        '🏃🏾🤝🏾🏃🏿  🔺','Petit relais en équipe',[
          q('Dans un relais, tu dois :',['attendre ton tour','partir tous en même temps sans règle','bloquer le suivant'],'attendre ton tour','Le relais suit un ordre.'),
          q('Après ta partie, tu :',['passes le relais selon la consigne','gardes tout pour toi','quittes la zone au hasard'],'passes le relais selon la consigne','La transition permet au groupe de continuer.'),
          q('La réussite dépend :',['de chaque membre du groupe','seulement du premier','de personne'],'de chaque membre du groupe','Chaque action contribue au résultat collectif.'),
          q('Pourquoi coopérer ?',['Pour coordonner les efforts','Pour empêcher les autres de jouer','Pour supprimer les règles'],'Pour coordonner les efforts','Un relais est une activité collective.')]),
      cp1Lesson('Jouer avec fair-play',
        'Dans un jeu, nous respectons les règles, l’adversaire et l’enseignant. Gagner est agréable, mais perdre ne donne pas le droit d’insulter ou de frapper.',
        'Le fair-play consiste à jouer honnêtement et accepter le résultat. Si une règle n’est pas claire, on demande avant de se disputer.',
        'Exemple : dire « bien joué » après une partie.',
        '🤝🏾  ⚽  🙂','Deux enfants après un jeu',[
          q('Tu perds une partie. Tu :',['acceptes sans violence','frappes le gagnant','casses le matériel'],'acceptes sans violence','Le résultat ne justifie pas la violence.'),
          q('Une règle n’est pas claire. Tu :',['demandes à l’enseignant','inventes ta règle seul','te bats'],'demandes à l’enseignant','Clarifier évite les disputes.'),
          q('Fair-play signifie :',['jouer honnêtement et respecter','tricher pour gagner','humilier les autres'],'jouer honnêtement et respecter','Le comportement compte autant que le résultat.'),
          q('Après un jeu, tu peux dire :',['Bien joué','Je vais te frapper','Tu ne comptes pas'],'Bien joué','Une parole respectueuse aide à terminer l’activité correctement.')]),
      cp1Lesson('Préparer son corps et rester en sécurité',
        'Avant une activité, l’enseignant peut faire un petit échauffement adapté. Pendant l’effort, tu écoutes ton corps, tu bois de l’eau quand c’est prévu et tu te reposes selon la consigne.',
        'Si tu as une douleur forte, un malaise ou une difficulté, arrête l’activité et préviens l’adulte. Le courage ne consiste pas à cacher un problème physique.',
        'Exemple : marcher doucement avant de courir puis boire de l’eau à la pause prévue.',
        '🚶🏾  💧  🧑🏾‍🏫  🛑','Échauffement, eau et enseignant',[
          q('Avant de courir, l’enseignant peut proposer :',['un échauffement adapté','un danger','aucune consigne toujours'],'un échauffement adapté','L’échauffement prépare progressivement le corps.'),
          q('Tu ressens une forte douleur. Tu :',['arrêtes et préviens l’adulte','la caches et continues','pousses les autres'],'arrêtes et préviens l’adulte','Un symptôme important doit être signalé.'),
          q('Quand boire ?',['selon les pauses et consignes prévues','jamais','seulement après plusieurs jours'],'selon les pauses et consignes prévues','L’hydratation fait partie de la pratique sûre.'),
          q('Le courage en sport signifie-t-il ignorer une blessure ?',['Non','Oui'],'Non','La sécurité et la santé passent avant la performance.')])
    ]
  };

  function maths(level) {
    var e = [];
    if (level === '1') {
      e.push(q('Combien vois-tu de mangues ? 🥭🥭🥭', ['2','3','4'], '3', 'On compte une mangue, deux mangues, trois mangues.'));
      e.push(q('Quel nombre vient après 6 ?', ['5','7','8'], '7', 'En comptant : 5, 6, 7.'));
      e.push(q('Quel nombre est le plus grand ?', ['4','9','2'], '9', '9 représente plus d’unités que 4 et 2.'));
      e.push(n('2 + 3 = ?', 5, 'On part de 2 et on ajoute 3 : 3, 4, 5.', '●● + ●●●'));
      e.push(n('5 − 2 = ?', 3, 'Si on enlève 2 objets à 5, il en reste 3.', '●●●●● − ●●'));
      e.push(q('Quel dessin représente un carré ?', ['□','○','△'], '□', 'Le carré a 4 côtés de même longueur.'));
      e.push(q('Il n’y a aucun objet dans le panier. Quel nombre écrit-on ?', ['0','1','10'], '0', 'Zéro signifie qu’il n’y a aucun objet.'));
      e.push(n('4 + 1 = ?', 5, 'Ajouter 1 à 4 donne le nombre suivant : 5.'));
      e.push(n('3 − 1 = ?', 2, 'En retirant une unité à 3, il reste 2.'));
      e.push(q('Quel trait est le plus long ?', ['━━━━━━','━━'], '━━━━━━', 'Le premier trait occupe une plus grande longueur.'));
    } else if (level === '2') {
      e.push(n('23 + 15 = ?', 38, '23 + 10 = 33, puis 33 + 5 = 38.'));
      e.push(n('47 − 12 = ?', 35, '47 − 10 = 37, puis 37 − 2 = 35.'));
      e.push(q('Quel nombre contient 6 dizaines et 4 unités ?', ['46','64','604'], '64', '6 dizaines valent 60 et 4 unités donnent 64.'));
      e.push(n('2 × 5 = ?', 10, 'Deux groupes de cinq font dix.'));
      e.push(n('5 × 3 = ?', 15, '5 + 5 + 5 = 15.'));
      e.push(q('Quelle heure est une heure après 8 h ?', ['7 h','9 h','10 h'], '9 h', 'Après 8 h vient 9 h.'));
      e.push(n('Awa a 20 GNF et reçoit encore 10 GNF. Combien a-t-elle ?', 30, '20 + 10 = 30.'));
      e.push(q('Lequel est un rectangle ?', ['▭','○','△'], '▭', 'Le rectangle a quatre côtés et ses côtés opposés sont égaux.'));
      e.push(n('60 − 20 = ?', 40, 'Six dizaines moins deux dizaines donnent quatre dizaines.'));
      e.push(q('Quel nombre est compris entre 39 et 41 ?', ['38','40','42'], '40', '39, 40, 41 se suivent.'));
    } else if (level === '3') {
      e.push(n('245 + 132 = ?', 377, '245 + 100 = 345, +30 = 375, +2 = 377.'));
      e.push(n('500 − 176 = ?', 324, '500 − 100 = 400, −70 = 330, −6 = 324.'));
      e.push(n('7 × 6 = ?', 42, '7 groupes de 6 donnent 42.'));
      e.push(n('48 ÷ 6 = ?', 8, '48 partagé en 6 groupes égaux donne 8 par groupe.'));
      e.push(q('La moitié de 10 est :', ['2','5','20'], '5', 'La moitié partage 10 en deux parts égales : 5 et 5.'));
      e.push(q('Un mètre contient combien de centimètres ?', ['10','100','1000'], '100', '1 mètre = 100 centimètres.'));
      e.push(n('Un cahier coûte 2 000 GNF. Deux cahiers coûtent combien ?', 4000, '2 000 × 2 = 4 000 GNF.'));
      e.push(n('Le périmètre d’un carré de côté 4 cm vaut combien de cm ?', 16, 'Un carré a 4 côtés : 4 + 4 + 4 + 4 = 16.'));
      e.push(q('Quel nombre est pair ?', ['37','42','55'], '42', '42 se termine par 2, donc il est divisible par 2.'));
      e.push(n('900 + 90 + 9 = ?', 999, '9 centaines + 9 dizaines + 9 unités = 999.'));
    } else if (level === '4') {
      e.push(n('1 245 + 378 = ?', 1623, 'On additionne unités, dizaines, centaines puis milliers.'));
      e.push(n('2 000 − 865 = ?', 1135, '2 000 − 800 = 1 200 ; −60 = 1 140 ; −5 = 1 135.'));
      e.push(n('24 × 6 = ?', 144, '20 × 6 = 120 et 4 × 6 = 24 ; total 144.'));
      e.push(n('144 ÷ 12 = ?', 12, '12 × 12 = 144.'));
      e.push(q('Quelle fraction représente une moitié ?', ['1/2','1/3','2/3'], '1/2', 'Une moitié est une part sur deux parts égales.'));
      e.push(n('Un rectangle mesure 8 cm sur 3 cm. Son périmètre vaut combien de cm ?', 22, 'P = 2 × (8 + 3) = 22 cm.'));
      e.push(n('3 heures correspondent à combien de minutes ?', 180, '1 heure = 60 minutes ; 3 × 60 = 180.'));
      e.push(q('0,5 correspond à :', ['une moitié','deux','cinq'], 'une moitié', '0,5 = 5/10 = 1/2.'));
      e.push(n('Une classe a 28 élèves. 4 groupes égaux contiennent combien d’élèves chacun ?', 7, '28 ÷ 4 = 7.'));
      e.push(n('250 × 4 = ?', 1000, '25 × 4 = 100, puis on garde le zéro : 1 000.'));
    } else if (level === '5') {
      e.push(n('12 450 + 7 875 = ?', 20325, 'On aligne les chiffres par rang puis on additionne.'));
      e.push(n('9 000 − 3 468 = ?', 5532, 'La soustraction posée donne 5 532.'));
      e.push(n('125 × 24 = ?', 3000, '125 × 20 = 2 500 et 125 × 4 = 500 ; total 3 000.'));
      e.push(n('2 400 ÷ 8 = ?', 300, '24 ÷ 8 = 3 puis on conserve les deux zéros.'));
      e.push(q('La fraction équivalente à 1/2 est :', ['2/4','2/3','3/4'], '2/4', 'Multiplier numérateur et dénominateur de 1/2 par 2 donne 2/4.'));
      e.push(n('2,5 + 1,75 = ?', '4,25', 'On aligne les virgules : 2,50 + 1,75 = 4,25.'));
      e.push(n('L’aire d’un rectangle de 9 cm sur 4 cm vaut combien de cm² ?', 36, 'Aire = longueur × largeur = 9 × 4 = 36 cm².'));
      e.push(q('25 % de 100 vaut :', ['10','25','50'], '25', '25 % signifie 25 sur 100.'));
      e.push(n('3 kg correspondent à combien de grammes ?', 3000, '1 kg = 1 000 g ; donc 3 kg = 3 000 g.'));
      e.push(n('Un commerçant partage 1 500 GNF entre 5 enfants. Chacun reçoit combien ?', 300, '1 500 ÷ 5 = 300 GNF.'));
    } else {
      e.push(n('35 780 + 16 945 = ?', 52725, 'L’addition posée donne 52 725.'));
      e.push(n('50 000 − 27 856 = ?', 22144, 'La soustraction posée donne 22 144.'));
      e.push(n('348 × 25 = ?', 8700, '348 × 100 ÷ 4 = 34 800 ÷ 4 = 8 700.'));
      e.push(n('4 536 ÷ 12 = ?', 378, '12 × 378 = 4 536.'));
      e.push(q('3/4 écrit en nombre décimal vaut :', ['0,75','0,34','1,25'], '0,75', '3 ÷ 4 = 0,75.'));
      e.push(n('15 % de 200 vaut combien ?', 30, '10 % de 200 = 20 et 5 % = 10 ; total 30.'));
      e.push(n('L’aire d’un carré de côté 12 cm vaut combien de cm² ?', 144, 'Aire du carré = côté × côté = 12 × 12.'));
      e.push(n('Un trajet de 2,5 km correspond à combien de mètres ?', 2500, '1 km = 1 000 m ; 2,5 km = 2 500 m.'));
      e.push(q('Le nombre premier parmi ces nombres est :', ['21','23','27'], '23', '23 n’a que deux diviseurs : 1 et 23.'));
      e.push(n('Une caisse contient 24 bouteilles. 15 caisses contiennent combien de bouteilles ?', 360, '24 × 15 = 24 × 10 + 24 × 5 = 240 + 120 = 360.'));
    }
    return e;
  }

  function francais(level) {
    var e = [];
    if (level === '1') {
      e.push(q('Touche la lettre A.', ['A','M','I'], 'A', 'A est la lettre demandée.'));
      e.push(q('Dans quel mot entends-tu le son [a] ?', ['maman','lit','riz'], 'maman', 'Dans « maman », on entend le son [a].'));
      e.push(q('m + a se lit :', ['ma','am','mi'], 'ma', 'La consonne m suivie de a forme la syllabe « ma ».'));
      e.push(q('Quel mot commence par M ?', ['mangue','riz','lune'], 'mangue', '« Mangue » commence par la lettre m.'));
      e.push(q('Pour saluer le matin, on dit :', ['Bonjour','Bonsoir','Merci'], 'Bonjour', 'Le matin, on dit « Bonjour ».'));
      e.push(q('Quelle phrase est correcte ?', ['Je suis Awa.','Awa suis je.'], 'Je suis Awa.', 'Une phrase commence par une majuscule et suit un ordre compréhensible.'));
      e.push(q('Quel mot désigne un objet de classe ?', ['cahier','chèvre','mangue'], 'cahier', 'Le cahier est utilisé en classe.'));
      e.push(q('Quel mot contient la syllabe « la » ?', ['lame','moto','riz'], 'lame', 'Le mot « lame » commence par la syllabe « la ».'));
      e.push(q('Quel signe termine une phrase qui pose une question ?', ['?','.','!'], '?', 'Le point d’interrogation termine une question.'));
      e.push(q('Quel mot est écrit correctement ?', ['école','écol','ecolle'], 'école', 'Le mot s’écrit « école ».'));
    } else if (level === '2') {
      e.push(q('Dans « Le garçon joue », quel est le verbe ?', ['garçon','joue','le'], 'joue', 'Le verbe indique l’action : jouer.'));
      e.push(q('Quel est le pluriel de « un livre » ?', ['des livres','des livre','un livres'], 'des livres', 'Au pluriel, on écrit « des livres ».'));
      e.push(q('Complète : Je ___ à l’école.', ['vais','va','vont'], 'vais', 'Avec « je », on dit « je vais ».'));
      e.push(q('Quel mot est féminin ?', ['une maison','un cahier','un garçon'], 'une maison', 'L’article « une » indique ici le féminin.'));
      e.push(q('Quel mot est le contraire de « grand » ?', ['petit','haut','large'], 'petit', '« Petit » est l’antonyme de « grand ».'));
      e.push(q('Quelle phrase commence correctement ?', ['Mamadou lit.','mamadou lit.'], 'Mamadou lit.', 'Une phrase et un nom propre commencent par une majuscule.'));
      e.push(q('Dans « la jolie fleur », quel mot décrit la fleur ?', ['jolie','fleur','la'], 'jolie', '« Jolie » donne une information sur le nom « fleur ».'));
      e.push(q('Choisis le bon article : ___ école.', ['une','un','des'], 'une', 'On dit « une école ».'));
      e.push(q('Quel mot contient le son [ou] ?', ['poule','papa','riz'], 'poule', 'Dans « poule », les lettres ou donnent le son [ou].'));
      e.push(q('Quel signe termine une phrase déclarative ?', ['.','?'], '.', 'Une phrase déclarative se termine généralement par un point.'));
    } else if (level === '3') {
      e.push(q('Dans « Les enfants jouent », quel est le sujet ?', ['Les enfants','jouent','enfants jouent'], 'Les enfants', 'Le sujet indique qui fait l’action.'));
      e.push(q('Complète : Nous ___ notre leçon.', ['apprenons','apprend','apprenez'], 'apprenons', 'Avec « nous », apprendre donne « nous apprenons ».'));
      e.push(q('Quel est le féminin de « petit » ?', ['petite','petites','petit'], 'petite', 'On ajoute généralement e : petit → petite.'));
      e.push(q('Quel est le pluriel de « cheval » ?', ['chevaux','chevals','chevalx'], 'chevaux', 'Le pluriel de cheval est chevaux.'));
      e.push(q('Quel mot est un nom ?', ['école','courir','rapidement'], 'école', '« École » désigne un lieu : c’est un nom.'));
      e.push(q('Quel mot est un verbe ?', ['manger','table','rouge'], 'manger', '« Manger » exprime une action.'));
      e.push(q('Choisis la phrase au futur :', ['Demain, je partirai.','Hier, je suis parti.','Je pars maintenant.'], 'Demain, je partirai.', '« Partirai » indique une action future.'));
      e.push(q('Le contraire de « commencer » est :', ['finir','ouvrir','avancer'], 'finir', 'Commencer et finir sont des contraires.'));
      e.push(q('Dans « Fatou porte une robe rouge », quel est l’adjectif ?', ['rouge','robe','porte'], 'rouge', '« Rouge » précise la couleur de la robe.'));
      e.push(q('Quel mot est correctement orthographié ?', ['beaucoup','bocou','beaucou'], 'beaucoup', 'Le mot s’écrit « beaucoup ».'));
    } else if (level === '4') {
      e.push(q('Dans « Le cultivateur travaille au champ », quel est le verbe ?', ['travaille','cultivateur','champ'], 'travaille', 'Le verbe exprime l’action effectuée par le cultivateur.'));
      e.push(q('Complète : Vous ___ vos cahiers.', ['ouvrez','ouvrons','ouvre'], 'ouvrez', 'Avec « vous », ouvrir donne « vous ouvrez ».'));
      e.push(q('Choisis la phrase à l’imparfait :', ['Il marchait lentement.','Il marche lentement.','Il marchera lentement.'], 'Il marchait lentement.', 'La terminaison -ait indique ici l’imparfait.'));
      e.push(q('Quel groupe est un groupe nominal ?', ['la grande maison','court vite','très rapidement'], 'la grande maison', 'Il est construit autour du nom « maison ».'));
      e.push(q('Complète : Les filles sont ___.', ['contentes','contents','contente'], 'contentes', 'L’adjectif s’accorde avec le féminin pluriel « filles ».'));
      e.push(q('Quel homophone convient : Il ___ un vélo.', ['a','à'], 'a', '« a » est le verbe avoir ; on peut remplacer par « avait ».'));
      e.push(q('Quel homophone convient : Je vais ___ Kindia.', ['à','a'], 'à', '« à » est une préposition indiquant ici la destination.'));
      e.push(q('Quel est le synonyme de « heureux » ?', ['content','triste','fâché'], 'content', '« Content » a un sens proche de « heureux ».'));
      e.push(q('Quelle phrase est correctement ponctuée ?', ['Où vas-tu ?','Où vas-tu.'], 'Où vas-tu ?', 'Une question se termine par un point d’interrogation.'));
      e.push(q('Le préfixe dans « impossible » est :', ['im-','possible','-ble'], 'im-', 'Le préfixe im- est placé avant le radical « possible ».'));
    } else if (level === '5') {
      e.push(q('Dans « Les élèves attentifs écoutent », quel est le sujet ?', ['Les élèves attentifs','écoutent','attentifs'], 'Les élèves attentifs', 'Tout le groupe « Les élèves attentifs » commande le verbe.'));
      e.push(q('Choisis le passé composé :', ['Nous avons terminé.','Nous terminions.','Nous terminerons.'], 'Nous avons terminé.', 'Le passé composé est formé ici de « avons » + participe passé « terminé ».'));
      e.push(q('Complète : Elles sont ___ tôt.', ['arrivées','arrivé','arrivés'], 'arrivées', 'Avec être, le participe passé s’accorde avec « elles ».'));
      e.push(q('Quel mot est un adverbe ?', ['rapidement','rapide','rapidité'], 'rapidement', '« Rapidement » précise la manière de l’action.'));
      e.push(q('Quel est le complément d’objet dans « Mariama lit un roman » ?', ['un roman','Mariama','lit'], 'un roman', 'On demande « Mariama lit quoi ? » → un roman.'));
      e.push(q('Choisis la bonne forme : Il faut que tu ___.', ['viennes','viens','viendra'], 'viennes', 'Après « il faut que », on emploie ici le subjonctif : « tu viennes ».'));
      e.push(q('Quel mot est correctement écrit ?', ['nécessaire','nécéssaire','nécesaire'], 'nécessaire', 'L’orthographe correcte est « nécessaire ».'));
      e.push(q('Le contraire de « généreux » est :', ['égoïste','aimable','courageux'], 'égoïste', 'Une personne égoïste partage peu, contrairement à une personne généreuse.'));
      e.push(q('Dans « Lorsque la pluie tombe, la route devient glissante », la proposition introduite par « lorsque » indique :', ['le temps','le lieu','la cause'], 'le temps', '« Lorsque » situe l’action dans le temps.'));
      e.push(q('Quel connecteur exprime une conséquence ?', ['donc','mais','ou'], 'donc', '« Donc » introduit une conséquence.'));
    } else {
      e.push(q('Dans « Les résultats que nous attendions sont arrivés », quel mot reprend « résultats » ?', ['que','nous','sont'], 'que', 'Le pronom relatif « que » reprend l’antécédent « résultats ».'));
      e.push(q('Choisis le plus-que-parfait :', ['Il avait fini.','Il a fini.','Il finira.'], 'Il avait fini.', 'Le plus-que-parfait se forme avec l’imparfait de l’auxiliaire + participe passé.'));
      e.push(q('Complète : Bien qu’il ___ fatigué, il continue.', ['soit','est','sera'], 'soit', '« Bien que » appelle ici le subjonctif : « soit ».'));
      e.push(q('Quel est le COD dans « Le professeur explique la leçon aux élèves » ?', ['la leçon','aux élèves','Le professeur'], 'la leçon', 'Il explique quoi ? → la leçon.'));
      e.push(q('Quel est le COI dans la même phrase ?', ['aux élèves','la leçon','explique'], 'aux élèves', 'Il explique la leçon à qui ? → aux élèves.'));
      e.push(q('Choisis l’accord correct : Les lettres que j’ai ___.', ['écrites','écrit','écrits'], 'écrites', 'Avec avoir, le participe passé s’accorde ici avec le COD « lettres » placé avant.'));
      e.push(q('Quel connecteur exprime une opposition ?', ['cependant','donc','puisque'], 'cependant', '« Cependant » marque une opposition ou une nuance.'));
      e.push(q('Quel mot est formé avec un suffixe ?', ['heureusement','défaire','revenir'], 'heureusement', 'Le suffixe -ment est ajouté à « heureuse ».'));
      e.push(q('Quelle phrase est à la voix passive ?', ['Le match est gagné par notre équipe.','Notre équipe gagne le match.'], 'Le match est gagné par notre équipe.', 'Le sujet « le match » subit l’action : c’est la voix passive.'));
      e.push(q('Le mot « persévérance » signifie surtout :', ['continuer malgré les difficultés','abandonner vite','éviter tout effort'], 'continuer malgré les difficultés', 'La persévérance consiste à poursuivre un effort malgré les obstacles.'));
    }
    return e;
  }

  var STATIC = {
    sciences: {
      '1': [
        q('Avec quoi vois-tu ?', ['les yeux','les oreilles','les pieds'], 'les yeux', 'Les yeux permettent de voir.'),
        q('Lequel est vivant ?', ['la chèvre','la pierre','la chaise'], 'la chèvre', 'La chèvre naît, grandit, se nourrit et respire.'),
        q('Avant de manger, il faut :', ['se laver les mains','salir les mains','courir'], 'se laver les mains', 'Le lavage des mains réduit les microbes.'),
        q('Quelle partie du corps permet d’entendre ?', ['les oreilles','le nez','la main'], 'les oreilles', 'Les oreilles sont les organes de l’audition.'),
        q('Une plante a besoin notamment :', ['d’eau','de plastique','de métal'], 'd’eau', 'L’eau est nécessaire à la vie de la plante.'),
        q('Peut-on boire une eau visiblement sale ?', ['Non','Oui'], 'Non', 'Une eau sale peut transmettre des maladies.'),
        q('La mangue vient principalement :', ['d’un arbre','d’une pierre','d’une chaise'], 'd’un arbre', 'La mangue est le fruit du manguier.'),
        q('Le soleil éclaire surtout pendant :', ['le jour','la nuit'], 'le jour', 'Le jour correspond à la période où notre région reçoit la lumière du Soleil.')
      ],
      '2': [
        q('Quel organe sert à respirer ?', ['les poumons','les dents','les ongles'], 'les poumons', 'Les poumons participent à la respiration.'),
        q('Lequel est un aliment énergétique ?', ['le riz','la pierre','le savon'], 'le riz', 'Le riz apporte notamment des glucides qui fournissent de l’énergie.'),
        q('Une graine peut donner :', ['une nouvelle plante','une pierre','du métal'], 'une nouvelle plante', 'Après germination, une graine peut devenir une plante.'),
        q('Pour garder les dents propres, on utilise :', ['une brosse à dents','un balai','une règle'], 'une brosse à dents', 'Le brossage élimine une partie de la plaque dentaire.'),
        q('Quel animal pond des œufs ?', ['la poule','la chèvre','la vache'], 'la poule', 'La poule se reproduit en pondant des œufs.'),
        q('L’eau peut devenir glace quand elle :', ['gèle','chauffe beaucoup','se mélange au sable'], 'gèle', 'Sous l’effet du froid, l’eau liquide peut devenir solide.'),
        q('Le cœur sert principalement à :', ['faire circuler le sang','mâcher','voir'], 'faire circuler le sang', 'Le cœur pompe le sang dans l’organisme.'),
        q('Un objet en bois vient à l’origine :', ['d’un arbre','du sable','de l’eau'], 'd’un arbre', 'Le bois est une matière végétale provenant des arbres.')
      ],
      '3': [
        q('Les racines d’une plante servent notamment à :', ['absorber l’eau du sol','voir la lumière','produire du bruit'], 'absorber l’eau du sol', 'Les racines prélèvent l’eau et les sels minéraux.'),
        q('Le sang circule grâce notamment :', ['au cœur','aux cheveux','aux ongles'], 'au cœur', 'Le cœur propulse le sang dans les vaisseaux.'),
        q('Quel changement est réversible ?', ['glace qui fond','papier brûlé','œuf cuit'], 'glace qui fond', 'L’eau liquide peut à nouveau geler.'),
        q('Pour éviter certaines maladies, une bonne habitude est :', ['se laver régulièrement les mains','boire de l’eau sale','laisser les aliments découverts'], 'se laver régulièrement les mains', 'L’hygiène réduit la transmission de nombreux microbes.'),
        q('La vapeur d’eau est l’état :', ['gazeux','solide','métallique'], 'gazeux', 'La vapeur correspond à l’état gazeux de l’eau.'),
        q('Quel animal est herbivore ?', ['la chèvre','le lion','le chat'], 'la chèvre', 'La chèvre se nourrit principalement de végétaux.'),
        q('L’ombre apparaît quand un objet :', ['bloque la lumière','produit de l’eau','fait du bruit'], 'bloque la lumière', 'Un objet opaque empêche une partie de la lumière de passer.'),
        q('Les poumons appartiennent à l’appareil :', ['respiratoire','digestif','locomoteur'], 'respiratoire', 'Ils assurent les échanges gazeux de la respiration.')
      ],
      '4': [
        q('La digestion commence principalement dans :', ['la bouche','les pieds','les poumons'], 'la bouche', 'Les aliments y sont mastiqués et mélangés à la salive.'),
        q('Un circuit électrique simple a besoin notamment :', ['d’une source d’énergie','de sable','d’un aliment'], 'd’une source d’énergie', 'Une pile peut fournir l’énergie électrique au circuit.'),
        q('Quel matériau conduit généralement bien l’électricité ?', ['le métal','le plastique sec','le bois sec'], 'le métal', 'Les métaux sont généralement de bons conducteurs.'),
        q('La photosynthèse se réalise surtout dans :', ['les feuilles vertes','les racines seules','les fleurs coupées'], 'les feuilles vertes', 'Les feuilles chlorophylliennes captent l’énergie lumineuse.'),
        q('L’évaporation transforme l’eau liquide en :', ['vapeur','glace','terre'], 'vapeur', 'L’eau passe de l’état liquide à l’état gazeux.'),
        q('Une alimentation équilibrée doit être :', ['variée','uniquement sucrée','sans eau'], 'variée', 'La variété aide à couvrir différents besoins nutritionnels.'),
        q('Quel organe filtre le sang et produit l’urine ?', ['le rein','le poumon','l’œil'], 'le rein', 'Les reins filtrent le sang et participent à la formation de l’urine.'),
        q('Le levier est :', ['une machine simple','un aliment','un animal'], 'une machine simple', 'Un levier aide à déplacer ou soulever une charge avec un point d’appui.')
      ],
      '5': [
        q('Les globules rouges transportent principalement :', ['l’oxygène','les os','les aliments entiers'], 'l’oxygène', 'L’hémoglobine des globules rouges transporte l’oxygène.'),
        q('Dans une chaîne alimentaire, les plantes vertes sont souvent :', ['producteurs','prédateurs supérieurs','décomposeurs uniquement'], 'producteurs', 'Elles produisent leur matière organique grâce à la photosynthèse.'),
        q('La rotation de la Terre sur elle-même explique :', ['l’alternance jour-nuit','les saisons seules','les marées uniquement'], 'l’alternance jour-nuit', 'La Terre tourne sur elle-même en environ 24 heures.'),
        q('L’eau bout à environ quelle température au niveau de la mer ?', ['100 °C','0 °C','10 °C'], '100 °C', 'À pression atmosphérique normale, l’eau bout près de 100 °C.'),
        q('La force qui attire les objets vers le sol est :', ['la gravité','la lumière','la chaleur'], 'la gravité', 'La gravité attire les masses les unes vers les autres.'),
        q('Un vaccin sert principalement à :', ['préparer le système immunitaire','remplacer l’eau','augmenter la taille'], 'préparer le système immunitaire', 'Il entraîne l’organisme à reconnaître un agent infectieux ou une partie de celui-ci.'),
        q('Le squelette sert notamment à :', ['soutenir le corps','digérer les aliments','produire la lumière'], 'soutenir le corps', 'Les os donnent une charpente au corps et protègent certains organes.'),
        q('Une énergie renouvelable est :', ['l’énergie solaire','le charbon','le pétrole'], 'l’énergie solaire', 'Le rayonnement solaire se renouvelle naturellement à l’échelle humaine.')
      ],
      '6': [
        q('Quel organe commande une grande partie du système nerveux ?', ['le cerveau','l’estomac','le rein'], 'le cerveau', 'Le cerveau traite de nombreuses informations et commande de nombreuses fonctions.'),
        q('Le dioxyde de carbone est utilisé par les plantes pendant :', ['la photosynthèse','la mastication','la locomotion'], 'la photosynthèse', 'Les plantes utilisent le CO₂ pour fabriquer de la matière organique avec l’énergie lumineuse.'),
        q('Une solution acide a généralement un pH :', ['inférieur à 7','égal à 7','supérieur à 7'], 'inférieur à 7', 'Sur l’échelle usuelle, un pH inférieur à 7 caractérise une solution acide.'),
        q('La révolution de la Terre autour du Soleil dure environ :', ['365 jours','24 heures','30 jours'], '365 jours', 'Une révolution terrestre correspond à environ une année.'),
        q('Quel gaz est indispensable à notre respiration ?', ['l’oxygène','l’hydrogène seul','le dioxyde de carbone seul'], 'l’oxygène', 'Nos cellules utilisent l’oxygène pour la respiration cellulaire.'),
        q('Un écosystème comprend :', ['des êtres vivants et leur milieu','seulement les animaux','seulement le sol'], 'des êtres vivants et leur milieu', 'Un écosystème réunit une communauté d’êtres vivants et les éléments de son environnement.'),
        q('Le courant électrique circule dans un circuit quand celui-ci est :', ['fermé','ouvert','cassé'], 'fermé', 'Un circuit fermé offre un trajet continu au courant.'),
        q('Le paludisme est transmis principalement par :', ['certains moustiques Anopheles femelles','les mouches domestiques','l’eau salée'], 'certains moustiques Anopheles femelles', 'Le parasite du paludisme est transmis à l’humain par la piqûre de moustiques Anopheles femelles infectés.')
      ]
    },
    ecm: {
      '1': [
        q('Pour parler en classe, je :', ['lève le doigt','crie','frappe la table'], 'lève le doigt', 'Lever le doigt permet de respecter la parole des autres.'),
        q('Si je bouscule quelqu’un, je dis :', ['Pardon','Tant pis','Rien'], 'Pardon', 'S’excuser montre du respect.'),
        q('Un papier est par terre. Je :', ['le mets à la poubelle','le laisse','le cache'], 'le mets à la poubelle', 'Garder l’environnement propre est une responsabilité de chacun.'),
        q('Avant de traverser une route, je :', ['regarde des deux côtés','cours sans regarder'], 'regarde des deux côtés', 'Il faut vérifier que la voie est sûre avant de traverser.'),
        q('Mon camarade n’a pas de crayon. Je peux :', ['partager','me moquer','le cacher'], 'partager', 'Le partage favorise l’entraide.')
      ],
      '2': [
        q('Respecter une règle, c’est :', ['la suivre','la casser exprès','l’ignorer toujours'], 'la suivre', 'Une règle organise la vie commune.'),
        q('Dans une file d’attente, je :', ['attends mon tour','pousse les autres','passe devant'], 'attends mon tour', 'Attendre son tour respecte les autres.'),
        q('Si je trouve un objet qui ne m’appartient pas, je :', ['cherche son propriétaire','le garde en secret'], 'cherche son propriétaire', 'Rendre le bien d’autrui est une conduite honnête.'),
        q('Pour protéger l’école, je :', ['prends soin du matériel','casse les tables'], 'prends soin du matériel', 'Le matériel commun appartient à tous les élèves.'),
        q('Quand quelqu’un parle, je :', ['écoute','l’interromps toujours'], 'écoute', 'L’écoute est une marque de respect.')
      ],
      '3': [
        q('Un droit de l’enfant est notamment :', ['aller à l’école','être maltraité','être privé de soins'], 'aller à l’école', 'L’éducation fait partie des droits fondamentaux de l’enfant.'),
        q('Une responsabilité de l’élève est :', ['respecter le règlement','détruire le matériel'], 'respecter le règlement', 'La vie scolaire exige des droits mais aussi des devoirs.'),
        q('Pour résoudre un désaccord, il vaut mieux :', ['dialoguer','se battre'], 'dialoguer', 'Le dialogue aide à chercher une solution sans violence.'),
        q('Un bien public doit être :', ['protégé','abîmé','réservé à une seule personne'], 'protégé', 'Un bien public sert à la collectivité.'),
        q('Jeter les déchets dans un lieu prévu aide à :', ['protéger l’environnement','polluer davantage'], 'protéger l’environnement', 'Une bonne gestion des déchets réduit l’insalubrité.')
      ],
      '4': [
        q('La tolérance consiste à :', ['respecter les différences','rejeter toute différence'], 'respecter les différences', 'La tolérance permet de vivre avec des personnes différentes de soi.'),
        q('Une décision collective doit idéalement :', ['écouter plusieurs avis','interdire toute discussion'], 'écouter plusieurs avis', 'La participation améliore la qualité et l’acceptation des décisions.'),
        q('Une règle juste doit :', ['s’appliquer de manière équitable','favoriser toujours le plus fort'], 's’appliquer de manière équitable', 'L’équité évite les privilèges arbitraires.'),
        q('Protéger un arbre de l’école est :', ['un geste citoyen','une perte de temps'], 'un geste citoyen', 'Préserver les biens et l’environnement commun relève de la citoyenneté.'),
        q('Face à une rumeur non vérifiée, je dois :', ['vérifier avant de partager','la diffuser immédiatement'], 'vérifier avant de partager', 'Vérifier l’information évite de propager des erreurs ou de nuire à autrui.')
      ],
      '5': [
        q('La citoyenneté implique :', ['des droits et des devoirs','seulement des droits','seulement des sanctions'], 'des droits et des devoirs', 'Le citoyen bénéficie de droits et assume aussi des responsabilités.'),
        q('La corruption nuit surtout :', ['à la confiance et à l’équité','à la pluie','aux mathématiques'], 'à la confiance et à l’équité', 'Elle détourne les règles au profit d’intérêts particuliers.'),
        q('Un débat respectueux consiste à :', ['critiquer les idées sans insulter les personnes','insulter celui qui n’est pas d’accord'], 'critiquer les idées sans insulter les personnes', 'On peut contester une opinion tout en respectant la personne.')
      ],
      '6': [
        q('L’État de droit signifie notamment que :', ['les règles s’appliquent aux gouvernés et aux gouvernants','les dirigeants sont au-dessus de toute règle'], 'les règles s’appliquent aux gouvernés et aux gouvernants', 'Dans un État de droit, l’exercice du pouvoir est encadré par le droit.'),
        q('La liberté d’expression ne donne pas le droit de :', ['nuire illégalement à autrui','exprimer une opinion respectueuse'], 'nuire illégalement à autrui', 'Les libertés s’exercent dans le respect des droits d’autrui et des lois applicables.'),
        q('Participer à la vie de son quartier peut consister à :', ['contribuer à une action collective utile','détruire un bien commun'], 'contribuer à une action collective utile', 'La participation citoyenne peut améliorer la vie collective.')
      ]
    },
    histoiregeo: {
      '3': [
        q('Une carte sert principalement à :', ['représenter un espace','cuire les aliments','mesurer le temps'], 'représenter un espace', 'Une carte représente un territoire à une certaine échelle.'),
        q('Le nord est généralement placé :', ['en haut d’une carte','toujours à gauche','toujours en bas'], 'en haut d’une carte', 'Par convention, de nombreuses cartes orientent le nord vers le haut.'),
        q('La Guinée se trouve en :', ['Afrique de l’Ouest','Asie de l’Est','Amérique du Sud'], 'Afrique de l’Ouest', 'La République de Guinée est un pays d’Afrique de l’Ouest.'),
        q('Une personne qui cultive la terre est :', ['un agriculteur','un pilote','un marin'], 'un agriculteur', 'L’agriculture consiste à produire des végétaux et, selon les cas, à élever des animaux.'),
        q('Une source historique peut être :', ['un témoignage','un rêve inventé sans trace','une réponse choisie au hasard'], 'un témoignage', 'Les historiens utilisent des traces, documents, objets et témoignages qu’ils analysent de façon critique.')
      ],
      '4': [
        q('Conakry est :', ['la capitale de la Guinée','un pays voisin','un océan'], 'la capitale de la Guinée', 'Conakry est la capitale de la République de Guinée.'),
        q('Le Niger est notamment :', ['un grand fleuve d’Afrique de l’Ouest','une montagne européenne','un océan'], 'un grand fleuve d’Afrique de l’Ouest', 'Le fleuve Niger prend sa source en Guinée et traverse plusieurs pays ouest-africains.'),
        q('Un siècle compte :', ['100 ans','10 ans','1 000 ans'], '100 ans', 'Un siècle est une période de cent années.'),
        q('Pour situer un événement dans le temps, on utilise notamment :', ['une date','une couleur seulement','un poids'], 'une date', 'La date permet de repérer un événement dans la chronologie.'),
        q('Une frontière sépare généralement :', ['deux territoires politiques','deux jours de la semaine','deux nombres'], 'deux territoires politiques', 'Une frontière délimite des territoires, notamment ceux des États.')
      ]
    },
    histoire: {
      '5': [
        q('Une source écrite en histoire peut être :', ['une lettre ancienne','une pierre sans contexte','un calcul'], 'une lettre ancienne', 'Un document écrit peut fournir des informations sur le passé, à condition d’être analysé de façon critique.'),
        q('Classer des événements du plus ancien au plus récent s’appelle :', ['établir une chronologie','faire une division','dessiner une carte'], 'établir une chronologie', 'La chronologie organise les faits dans le temps.'),
        q('Samory Touré est associé à l’histoire :', ['de l’Afrique de l’Ouest','de l’Australie antique','du Japon médiéval'], 'de l’Afrique de l’Ouest', 'Samory Touré a dirigé l’empire Wassoulou en Afrique de l’Ouest au XIXe siècle.'),
        q('La colonisation européenne de l’Afrique s’est fortement accélérée au :', ['XIXe siècle','Ve siècle','XXIIe siècle'], 'XIXe siècle', 'La conquête coloniale européenne de l’Afrique s’est intensifiée surtout à la fin du XIXe siècle.'),
        q('L’indépendance de la Guinée a été proclamée en :', ['1958','1968','1945'], '1958', 'La République de Guinée est devenue indépendante le 2 octobre 1958.')
      ],
      '6': [
        q('Le vote guinéen du 28 septembre 1958 a conduit à :', ['l’indépendance','la création de l’Union européenne','la disparition de Conakry'], 'l’indépendance', 'La majorité a voté « non » au projet constitutionnel français, ouvrant la voie à l’indépendance proclamée le 2 octobre 1958.'),
        q('Le premier président de la République de Guinée était :', ['Ahmed Sékou Touré','Samory Touré','Alpha Yaya Diallo'], 'Ahmed Sékou Touré', 'Ahmed Sékou Touré est devenu le premier président de la Guinée indépendante.'),
        q('Une constitution sert principalement à :', ['organiser les institutions et fixer des règles fondamentales','remplacer tous les manuels scolaires','mesurer les distances'], 'organiser les institutions et fixer des règles fondamentales', 'La constitution définit les principes fondamentaux de l’État et l’organisation des pouvoirs.'),
        q('Pour vérifier un fait historique, il faut idéalement :', ['croiser plusieurs sources','se fier à une seule rumeur','inventer une date'], 'croiser plusieurs sources', 'Comparer plusieurs sources aide à repérer les erreurs, biais ou contradictions.'),
        q('Le panafricanisme défend notamment :', ['la solidarité et la coopération entre peuples africains','l’isolement de tous les pays africains','la suppression de toute culture locale'], 'la solidarité et la coopération entre peuples africains', 'Le panafricanisme est un ensemble d’idées et de mouvements favorisant l’unité ou la solidarité des peuples africains et de la diaspora.')
      ]
    },
    geographie: {
      '5': [
        q('La Guinée possède une façade sur :', ['l’océan Atlantique','l’océan Pacifique','la mer Rouge'], 'l’océan Atlantique', 'La Guinée est ouverte sur l’océan Atlantique à l’ouest.'),
        q('Le Fouta-Djalon est notamment connu comme :', ['un massif montagneux et château d’eau régional','un désert côtier','une île'], 'un massif montagneux et château d’eau régional', 'De nombreux cours d’eau ouest-africains prennent leur source dans le Fouta-Djalon.'),
        q('La région la plus côtière de Guinée est traditionnellement appelée :', ['Basse Guinée','Haute Guinée','Guinée Forestière'], 'Basse Guinée', 'La Basse Guinée correspond largement à la zone littorale et aux plaines côtières.'),
        q('Une forte densité de population signifie :', ['beaucoup d’habitants sur une petite surface','aucun habitant','une grande pluie'], 'beaucoup d’habitants sur une petite surface', 'La densité rapporte le nombre d’habitants à une unité de surface.'),
        q('Une activité du secteur primaire est :', ['l’agriculture','la programmation informatique','la banque'], 'l’agriculture', 'Le secteur primaire exploite directement des ressources naturelles.')
      ],
      '6': [
        q('La latitude mesure une position :', ['au nord ou au sud de l’équateur','à l’est ou à l’ouest de Greenwich seulement','en altitude uniquement'], 'au nord ou au sud de l’équateur', 'La latitude est une distance angulaire par rapport à l’équateur.'),
        q('La longitude mesure une position :', ['à l’est ou à l’ouest du méridien de référence','au nord ou au sud de l’équateur uniquement','en profondeur'], 'à l’est ou à l’ouest du méridien de référence', 'La longitude repère une position par rapport au méridien de Greenwich ou au méridien de référence choisi.'),
        q('Le climat correspond surtout :', ['aux conditions atmosphériques moyennes sur une longue période','au temps d’une seule heure','à la couleur du sol'], 'aux conditions atmosphériques moyennes sur une longue période', 'Le climat se décrit à partir de statistiques météorologiques sur de longues périodes.'),
        q('L’urbanisation désigne :', ['l’augmentation de la population vivant en ville et l’extension des espaces urbains','la disparition de toutes les routes','la baisse automatique des naissances'], 'l’augmentation de la population vivant en ville et l’extension des espaces urbains', 'L’urbanisation transforme la répartition de la population et l’occupation de l’espace.'),
        q('Une ressource renouvelable est :', ['l’énergie solaire','le pétrole','le charbon'], 'l’énergie solaire', 'Le rayonnement solaire se renouvelle continuellement à l’échelle humaine.')
      ]
    }
  };

  function build(level, subject) {
    if (level === '1' && CP1_LESSONS[subject]) {
      var out = [];
      CP1_LESSONS[subject].forEach(function (lesson) { out = out.concat(lesson.ex || []); });
      return out;
    }
    if (subject === 'maths') return maths(level);
    if (subject === 'francais') return francais(level);
    var bank = STATIC[subject] && STATIC[subject][level];
    if (bank) return bank.slice();
    return [];
  }

  function renderCp1Lessons(subject) {
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

  function startCp1Lesson(index) {
    var lessons = CP1_LESSONS[state.subject] || [];
    var i = Number(index);
    if (!isFinite(i) || i < 0 || i >= lessons.length) { renderCp1Lessons(state.subject); return; }
    state.lesson = i; state.phase = 1; state.list = []; state.index = 0; state.good = 0; state.wrong = [];
    lastCp1Write(state.subject, i);
    state.diagnostic = (lessons[i].ex || [])[0] || null; state.diagnosticAttempt = 0; state.diagnosticLocked = false; state.diagnosticPassed = false;
    renderCp1Explanation();
  }

  function renderCp1Explanation() {
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

  function renderCp1Diagnostic() {
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

  function answerCp1Diagnostic(value, control) {
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

  function startCp1Exercises() {
    clearAuto();
    var lessons = CP1_LESSONS[state.subject] || [], lesson = lessons[state.lesson];
    if (!lesson) { renderCp1Lessons(state.subject); return; }
    state.phase = 3; state.readText = '';
    var practice = (lesson.ex || []).length > 1 ? (lesson.ex || []).slice(1) : (lesson.ex || []).slice();
    state.list = shuffle(practice); state.index = 0; state.good = 0; state.wrong = []; state.locked = false;
    if (!state.list.length) { renderCp1Lessons(state.subject); return; }
    renderQuestion();
  }

  function styles() {
    if (document.getElementById('nxPrimaryExStyleV600')) return;
    var s = document.createElement('style');
    s.id = 'nxPrimaryExStyleV600';
    s.textContent = [
      '.nx-px-v600{position:fixed;inset:0;z-index:2147482200;background:#f5f7fb;color:#17212b;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:auto}',
      '.nx-px-v600[hidden]{display:none}.nx-px-top{position:sticky;top:0;z-index:4;display:flex;align-items:center;gap:10px;padding:12px 14px;background:#173a63;color:white;box-shadow:0 2px 12px rgba(0,0,0,.12)}',
      '.nx-px-top button{border:0;background:rgba(255,255,255,.14);color:white;border-radius:10px;min-width:42px;height:42px;font-size:18px}.nx-px-top b{font-size:17px}.nx-px-top span{font-size:12px;opacity:.85;display:block}',
      '.nx-px-main{width:min(760px,100%);margin:0 auto;padding:20px 14px 40px}.nx-px-hero{background:white;border:1px solid #d9e0e8;border-radius:18px;padding:18px;margin-bottom:15px}',
      '.nx-px-hero h2{margin:0 0 6px;font-size:24px}.nx-px-hero p{margin:0;color:#667281;line-height:1.5}',
      '.nx-px-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.nx-px-card{border:1px solid #d9e0e8;background:white;border-radius:16px;padding:16px;text-align:left;min-height:108px;box-shadow:0 3px 12px rgba(23,58,99,.05)}',
      '.nx-px-card strong{display:block;color:#173a63;font-size:17px;margin:7px 0 4px}.nx-px-card small{display:block;color:#65717f;line-height:1.35}.nx-px-card em{font-style:normal;font-size:27px}',
      '.nx-px-progress{margin-top:8px;font-size:12px;font-weight:800;color:#2c6b3f}.nx-px-question{background:white;border:1px solid #d9e0e8;border-radius:18px;padding:18px;box-shadow:0 4px 16px rgba(23,58,99,.06)}',
      '.nx-px-meta{display:flex;justify-content:space-between;gap:8px;color:#65717f;font-size:13px;font-weight:700;margin-bottom:14px}.nx-px-q{font-size:22px;line-height:1.35;font-weight:850;margin:0 0 14px}.nx-px-visual{font-size:27px;letter-spacing:4px;margin:4px 0 16px}',
      '.nx-px-choices{display:grid;gap:10px}.nx-px-answer{width:100%;border:2px solid #ccd5df;background:#fff;border-radius:13px;padding:14px 13px;font:inherit;font-size:17px;font-weight:750;text-align:left;color:#17212b}.nx-px-answer.good{border-color:#2e7d32;background:#edf7ef}.nx-px-answer.bad{border-color:#c62828;background:#fff0f0}',
      '.nx-px-input{display:flex;gap:9px}.nx-px-input input{flex:1;min-width:0;border:2px solid #cbd4df;border-radius:13px;padding:14px;font:inherit;font-size:20px}.nx-px-input button,.nx-px-next,.nx-px-primary{border:0;border-radius:13px;background:#173a63;color:white;padding:13px 16px;font:inherit;font-weight:850}',
      '.nx-px-feedback{margin-top:15px;border-radius:13px;padding:14px;font-size:15px;line-height:1.5}.nx-px-feedback.ok{background:#edf7ef;color:#185c2b}.nx-px-feedback.no{background:#fff0f0;color:#8c1d18}.nx-px-feedback b{display:block;margin-bottom:4px}',
      '.nx-px-lesson-visual{display:flex;align-items:center;justify-content:center;min-height:128px;margin:0 0 16px;padding:16px;border-radius:16px;background:#f0f6ff;border:1px solid #d8e6f7;font-size:46px;line-height:1.25;text-align:center;letter-spacing:3px}.nx-px-listen{width:100%;border:0;border-radius:13px;background:#e7f1ff;color:#173a63;padding:13px 14px;font:inherit;font-weight:850;margin:0 0 14px}.nx-px-easy-text{font-size:18px;line-height:1.7;margin:0;color:#22303e}',
      '.nx-px-next{display:block;width:100%;margin-top:12px;min-height:50px}.nx-px-speak{margin-left:auto!important}.nx-px-result{text-align:center;background:white;border:1px solid #d9e0e8;border-radius:18px;padding:28px 18px}.nx-px-score{font-size:52px;font-weight:900;color:#173a63;margin:10px 0}.nx-px-actions{display:grid;gap:10px;margin-top:18px}.nx-px-actions button{min-height:50px;border-radius:13px;font:inherit;font-weight:850;border:1px solid #cbd4df;background:white}.nx-px-actions .primary{background:#173a63;color:white;border-color:#173a63}',
      '.nx-px-back{min-width:92px!important;padding:0 11px!important;font-size:14px!important;font-weight:850}.nx-px-child-hero{text-align:center}.nx-px-level-card,.nx-px-subject-card,.nx-px-child-card{touch-action:manipulation;cursor:pointer}.nx-px-level-card em,.nx-px-subject-card em{font-size:44px}.nx-px-subject-card{min-height:145px;text-align:center}.nx-px-subject-card strong{font-size:19px}.nx-px-thumb{display:flex;align-items:center;justify-content:center;min-height:64px;max-height:76px;overflow:hidden;margin:-2px 0 8px;padding:8px;border-radius:12px;background:#f0f6ff;font-size:30px;line-height:1.3;white-space:pre-line}.nx-px-lesson-title{display:block;font-size:16px;line-height:1.35;color:#233447;margin:4px 0 8px}.nx-px-start{width:100%;min-height:86px;border:0;border-radius:18px;background:#173a63;color:#fff;padding:14px 16px;margin:0 0 14px;text-align:left;font:inherit;box-shadow:0 5px 16px rgba(23,58,99,.16);touch-action:manipulation}.nx-px-start>span{font-size:28px;float:left;margin-right:12px}.nx-px-start b{display:block;font-size:20px}.nx-px-start small{display:block;margin-top:4px;font-size:13px;opacity:.9}.nx-px-big-answer{min-height:64px!important;font-size:19px!important;text-align:center!important}.nx-px-next,.nx-px-listen{min-height:58px;touch-action:manipulation}.nx-px-card:active,.nx-px-answer:active,.nx-px-next:active,.nx-px-start:active{transform:scale(.985)}',
      '@media(max-width:520px){.nx-px-grid{grid-template-columns:1fr}.nx-px-main{padding:14px 11px 32px}.nx-px-q{font-size:20px}.nx-px-card{min-height:110px}.nx-px-subject-card{min-height:128px}.nx-px-child-card{min-height:138px}.nx-px-top{gap:6px}.nx-px-back{min-width:84px!important;font-size:13px!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function cp1PremiumStyles() {
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

  function shell() {
    styles(); cp1PremiumStyles();
    if (viewer) return viewer;
    viewer = document.createElement('section');
    viewer.id = 'nxPrimaryExercisesV600';
    viewer.className = 'nx-px-v600';
    viewer.hidden = true;
    viewer.innerHTML = '<header class="nx-px-top"><button type="button" class="nx-px-back" data-back aria-label="Retour">← Retour</button><div><b data-title>École primaire</b><span data-subtitle>Exercices corrigés</span></div><button type="button" class="nx-px-speak" data-speak aria-label="Lire">🔊</button><button type="button" data-close aria-label="Fermer">✕</button></header><main class="nx-px-main" data-main></main>';
    document.body.appendChild(viewer);
    viewer.addEventListener('click', function (ev) {
      var close = ev.target.closest('[data-close]'); if (close) { closeViewer(); return; }
      var back = ev.target.closest('[data-back]'); if (back) { goBack(); return; }
      var sp = ev.target.closest('[data-speak]'); if (sp) { speakCurrent(); return; }
      var lv = ev.target.closest('[data-level]'); if (lv) { state.level = lv.getAttribute('data-level'); state.subject = ''; renderSubjects(); return; }
      var resume = ev.target.closest('[data-resume]'); if (resume) { state.subject = resume.getAttribute('data-resume-subject'); startCp1Lesson(resume.getAttribute('data-resume-lesson')); return; }
      var lesson = ev.target.closest('[data-lesson]'); if (lesson) { startCp1Lesson(lesson.getAttribute('data-lesson')); return; }
      var startDiag = ev.target.closest('[data-start-diagnostic]'); if (startDiag) { renderCp1Diagnostic(); return; }
      var diagAns = ev.target.closest('[data-diagnostic-answer]'); if (diagAns) { answerCp1Diagnostic(diagAns.getAttribute('data-diagnostic-answer'), diagAns); return; }
      var showSecond = ev.target.closest('[data-show-second]'); if (showSecond) { state.phase = 2; renderCp1Explanation(); return; }
      var retryDiag = ev.target.closest('[data-retry-diagnostic]'); if (retryDiag) { renderCp1Diagnostic(); return; }
      var startEx = ev.target.closest('[data-start-exercises]'); if (startEx) { startCp1Exercises(); return; }
      var sj = ev.target.closest('[data-subject]'); if (sj) { startSubject(sj.getAttribute('data-subject')); return; }
      var ans = ev.target.closest('[data-answer]'); if (ans) { answer(ans.getAttribute('data-answer'), ans); return; }
      var next = ev.target.closest('[data-next]'); if (next) { nextQuestion(); return; }
      var retry = ev.target.closest('[data-retry-wrong]'); if (retry) { retryWrong(); return; }
      var again = ev.target.closest('[data-again]'); if (again) { if (state.level === '1' && state.lesson >= 0) startCp1Exercises(); else startSubject(state.subject); return; }
      var home = ev.target.closest('[data-subjects]'); if (home) { renderSubjects(); return; }
    });
    viewer.addEventListener('submit', function (ev) {
      if (ev.target.matches('[data-diagnostic-form]')) {
        ev.preventDefault();
        var dinput = ev.target.querySelector('input');
        answerCp1Diagnostic(dinput ? dinput.value : '', dinput);
        return;
      }
      if (!ev.target.matches('[data-answer-form]')) return;
      ev.preventDefault();
      var input = ev.target.querySelector('input');
      answer(input ? input.value : '', input);
    });
    return viewer;
  }

  function setHeader(title, subtitle, backVisible) {
    var v = shell();
    v.querySelector('[data-title]').textContent = title || 'École primaire';
    v.querySelector('[data-subtitle]').textContent = subtitle || 'Exercices corrigés';
    v.querySelector('[data-back]').style.visibility = backVisible ? 'visible' : 'hidden';
    v.querySelector('[data-speak]').style.visibility = (state.readText || (state.list.length && state.index < state.list.length)) ? 'visible' : 'hidden';
  }
  function main() { return shell().querySelector('[data-main]'); }

  function renderLevels() {
    clearAuto(); shell().classList.remove('nx-cp1-mode');
    state.level = ''; state.subject = ''; state.lesson = -1; state.phase = 0; state.list = []; state.index = 0;
    state.readText = 'Bonjour. Choisis ta classe. Pour la première année, touche le grand numéro 1.';
    setHeader('École primaire', 'Écoute puis touche ta classe', false);
    var p = progressRead();
    var badges = { '1':'1️⃣', '2':'2️⃣', '3':'3️⃣', '4':'4️⃣', '5':'5️⃣', '6':'6️⃣' };
    var html = '<section class="nx-px-hero nx-px-child-hero"><h2>🎒 Choisis ta classe</h2><p>Écoute. Puis touche le grand numéro de ta classe.</p></section><div class="nx-px-grid">';
    Object.keys(LEVELS).forEach(function (k) {
      var l = LEVELS[k], vals = [], total = 0;
      l.subjects.forEach(function (sub) { var x = p[k + ':' + sub]; if (x && typeof x.best === 'number') { vals.push(x.best); total += x.best; } });
      var avg = vals.length ? Math.round(total / vals.length) : null;
      html += '<button type="button" class="nx-px-card nx-px-level-card" data-level="' + k + '"><em>' + badges[k] + '</em><strong>' + esc(l.label) + '</strong><small>' + esc(l.subtitle) + '</small>' + (avg != null ? '<div class="nx-px-progress">Niveau : ' + avg + '%</div>' : '') + '</button>';
    });
    html += '</div>';
    main().innerHTML = html;
    setTimeout(function () { speak(state.readText); }, 180);
  }

  function renderSubjects() {
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

  function startSubject(subject) {
    if (state.level === '1' && CP1_LESSONS[subject]) { renderCp1Lessons(subject); return; }
    state.subject = subject; state.lesson = -1; state.phase = 3; state.readText = '';
    state.list = shuffle(build(state.level, subject));
    state.index = 0; state.good = 0; state.wrong = []; state.locked = false;
    if (!state.list.length) { renderSubjects(); return; }
    renderQuestion();
  }

  function renderQuestion() {
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

  function answer(value, control) {
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

  function nextQuestion() { clearAuto(); state.index++; renderQuestion(); }

  function renderResult() {
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

  function retryWrong() {
    if (!state.wrong.length) { startSubject(state.subject); return; }
    state.list = shuffle(state.wrong); state.index = 0; state.good = 0; state.wrong = []; state.locked = false; renderQuestion();
  }
  function goBack() {
    clearAuto();
    if (state.list.length) {
      state.list = []; state.index = 0; state.readText = '';
      if (state.level === '1' && state.subject && CP1_LESSONS[state.subject]) { renderCp1Lessons(state.subject); return; }
      renderSubjects(); return;
    }
    if (state.level === '1' && state.lesson >= 0 && state.subject) { renderCp1Lessons(state.subject); return; }
    if (state.subject) { state.subject = ''; state.lesson = -1; state.readText = ''; renderSubjects(); return; }
    if (state.level) { renderLevels(); return; }
    closeViewer();
  }
  function speakCurrent() {
    if (state.readText) { speak(state.readText); return; }
    if (state.list.length && state.index < state.list.length) speak(state.list[state.index].q);
  }
  function openViewer() {
    var v = shell();
    v.hidden = false; document.body.style.overflow = 'hidden';
    renderLevels(); v.scrollTop = 0;
  }
  function closeViewer() {
    clearAuto();
    if (!viewer) return;
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (_e) {}
    viewer.hidden = true; document.body.style.overflow = '';
    state.list = []; state.index = 0; state.level = ''; state.subject = ''; state.lesson = -1; state.phase = 0; state.readText = ''; state.diagnostic = null; state.diagnosticAttempt = 0; state.diagnosticLocked = false; state.diagnosticPassed = false;
  }

  window.NexoraPrimarySchoolV157 = {
    version: VERSION,
    open: openViewer,
    close: closeViewer,
    getProgress: progressRead
  };
})();
