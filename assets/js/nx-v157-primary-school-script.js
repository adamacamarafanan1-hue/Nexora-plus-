/* NEXORA — École primaire interactive V604
   Pédagogie CP1 : audio, illustrations, deux explications simples puis exercices corrigés.
   Contrat public conservé : window.NexoraPrimarySchoolV157.open(). */
(function () {
  'use strict';
  if (window.__nxPrimaryExercisesV604) return;
  window.__nxPrimaryExercisesV604 = true;

  var VERSION = 'v604';
  var STORAGE = 'nexora.primary.exercises.v600.progress';
  var viewer = null;
  var state = { level: '', subject: '', lesson: -1, phase: 0, readText: '', list: [], index: 0, good: 0, wrong: [], locked: false };

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
    '1': { label: '1ère année', subtitle: 'Je comprends deux fois, puis je m’exerce', subjects: ['entretien','francais','maths','sciences','ecm','arts','eps'] },
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
      {
        title: "Saluer et répondre à l’appel",
        one: "Le matin, la classe commence par des gestes simples qui montrent que chacun est prêt à apprendre. En entrant, je salue. Quand mon nom est appelé, je réponds clairement « Présent ». Je regarde la personne qui me parle et j’écoute jusqu’au bout.",
        two: "Imagine deux classes. Dans la première, les enfants entrent sans saluer et parlent tous en même temps. Dans la seconde, chacun salue, écoute son nom et répond à son tour. Dans quelle classe peut-on commencer plus vite ? Les bonnes habitudes ne sont pas seulement des mots : elles organisent le travail du groupe.",
        example: "Exemple : la maîtresse dit « Aïssatou ? ». Aïssatou répond « Présente, maîtresse ». Puis elle écoute le nom suivant.",
        ex: [
          q("En entrant en classe le matin, que dis-tu ?", ["Bonjour", "Au revoir", "Rien"], "Bonjour", "Saluer montre le respect et annonce que tu entres dans le groupe."),
          q("Quand on appelle ton nom, tu réponds :", ["Présent", "Absent", "Je ne sais pas"], "Présent", "Tu réponds « Présent » pour signaler que tu es là."),
          q("Deux camarades parlent pendant l’appel. Quelle décision aide le plus la classe ?", ["Écouter puis parler à son tour", "Parler encore plus fort", "Sortir sans prévenir"], "Écouter puis parler à son tour", "Écouter permet à chacun d’entendre son nom et fait gagner du temps à toute la classe."),
          q("Quel comportement montre que tu écoutes ?", ["Je regarde et je reste attentif", "Je tourne le dos et je crie", "Je joue avec mon sac"], "Je regarde et je reste attentif", "L’attention se voit aussi dans la posture et le silence au bon moment.")
        ]
      },
      {
        title: "Observer le jour et le temps",
        one: "Chaque matin, nous pouvons observer trois choses : le jour, le moment de la journée et le temps qu’il fait. Le soleil visible peut indiquer un temps ensoleillé ; la pluie, un temps pluvieux ; beaucoup de nuages, un temps nuageux. Les jours se suivent dans un ordre régulier.",
        two: "Observer, ce n’est pas deviner. Si quelqu’un dit qu’il pleut mais que tu vois un ciel clair et un sol sec, tu dois vérifier les indices. Un bon élève apprend à regarder les faits avant de répondre. Pour les jours aussi, on raisonne avec l’ordre : lundi est suivi de mardi, puis mercredi.",
        example: "Exemple : aujourd’hui nous sommes lundi et il pleut. Demain sera mardi, mais nous ne pouvons pas affirmer dès maintenant qu’il pleuvra : le jour suit un ordre, la météo peut changer.",
        ex: [
          q("Le soleil brille et il ne pleut pas. Le temps est surtout :", ["ensoleillé", "pluvieux", "neigeux"], "ensoleillé", "On utilise ce que l’on observe : le soleil brille et aucune pluie n’est signalée."),
          q("Après lundi vient :", ["mardi", "dimanche", "vendredi"], "mardi", "Les jours de la semaine suivent un ordre."),
          q("Il y a de gros nuages mais pas encore de pluie. Quelle réponse est la plus précise ?", ["Le ciel est nuageux", "Il pleut forcément", "C’est la nuit"], "Le ciel est nuageux", "On décrit d’abord ce qui est réellement observé."),
          q("Pourquoi regarde-t-on le ciel avant de dire le temps qu’il fait ?", ["Pour utiliser des indices", "Pour répondre au hasard", "Pour changer le jour"], "Pour utiliser des indices", "Observer des indices développe un raisonnement fondé sur les faits.")
        ]
      },
      {
        title: "Préparer son matériel et exprimer un besoin",
        one: "Avant de travailler, je prépare ce qui est utile : cahier, crayon, ardoise ou livre selon l’activité. Si j’ai soif, si je suis malade ou si je ne comprends pas, je le dis avec une phrase claire et polie.",
        two: "Préparer son matériel, c’est anticiper. Si tu attends que l’exercice commence pour chercher ton crayon, tu perds du temps. Exprimer un besoin, c’est aussi résoudre un problème : je reconnais ce qui ne va pas, je l’explique et je demande une aide adaptée.",
        example: "Exemple : « Maître, je n’ai pas compris la consigne. Pouvez-vous répéter, s’il vous plaît ? » Cette phrase indique le problème et demande une solution.",
        ex: [
          q("Avant un exercice d’écriture, quel objet est le plus utile ?", ["un crayon", "une assiette", "un ballon"], "un crayon", "On choisit le matériel en fonction de la tâche."),
          q("Tu ne comprends pas la consigne. Que fais-tu ?", ["Je demande calmement une explication", "Je copie au hasard", "Je déchire le cahier"], "Je demande calmement une explication", "Demander une précision est une bonne stratégie d’apprentissage."),
          q("Ton cahier est au fond du sac et le cours commence. Quelle habitude évite ce problème ?", ["Préparer le matériel avant", "Attendre la fin", "Prendre le cahier du voisin sans demander"], "Préparer le matériel avant", "Anticiper évite une perte de temps et développe l’autonomie."),
          q("Tu te sens malade. Quelle décision est la plus sûre ?", ["Le dire à l’adulte responsable", "Le cacher toujours", "Courir davantage"], "Le dire à l’adulte responsable", "Un adulte responsable peut t’aider et décider de la conduite adaptée.")
        ]
      }
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
      {
        title: "Politesse, respect et écoute",
        one: "Vivre ensemble demande des mots et des comportements respectueux : dire bonjour, merci, pardon, écouter quand l’autre parle et demander la parole au lieu de crier.",
        two: "Le respect n’est pas seulement obéir. C’est comprendre que les autres ont eux aussi besoin de parler, d’apprendre et d’être traités correctement. Avant d’agir, demande-toi : « Si tout le monde faisait comme moi, la classe fonctionnerait-elle bien ? » Cette question aide à juger un comportement.",
        example: "Exemple : je bouscule quelqu’un sans le vouloir. Je m’arrête, je dis pardon et je vérifie qu’il va bien.",
        ex: [
          q("On te donne un livre. Tu dis :", ["Merci", "Tant pis", "Rien"], "Merci", "Remercier reconnaît le geste de l’autre."),
          q("Tu bouscules un camarade. Tu dis :", ["Pardon", "C’est ton problème", "Rien"], "Pardon", "S’excuser est un comportement respectueux."),
          q("Pendant qu’un camarade répond, tu dois surtout :", ["écouter", "crier plus fort", "le pousser"], "écouter", "L’écoute respecte sa parole et permet aussi d’apprendre de sa réponse."),
          q("Si tout le monde crie en même temps, que se passe-t-il ?", ["On se comprend moins bien", "La leçon devient toujours plus facile", "Tout le monde entend mieux"], "On se comprend moins bien", "Cette question fait réfléchir à la conséquence collective d’un comportement.")
        ]
      },
      {
        title: "Partager et protéger les biens communs",
        one: "Un livre de classe, une table ou la cour de l’école servent à plusieurs personnes. On en prend soin. Quand un camarade a besoin d’un petit matériel et que je peux l’aider sans me mettre en difficulté, je peux partager.",
        two: "Un bien commun appartient à l’usage de tous. Si une seule personne le détruit, plusieurs personnes perdent son utilité. Protéger un bien commun demande donc de penser au-delà de soi. Le partage aussi doit être responsable : je demande, j’utilise avec soin et je rends.",
        example: "Exemple : j’emprunte une règle, je l’utilise sans la casser puis je la rends à son propriétaire.",
        ex: [
          q("Après avoir utilisé un livre de classe, tu :", ["le ranges", "le déchires", "le jettes dehors"], "le ranges", "Ranger protège le matériel commun."),
          q("Ton camarade n’a pas de crayon et tu en as deux. Une bonne action est :", ["lui en prêter un", "cacher les deux", "casser le sien"], "lui en prêter un", "Partager quand c’est possible développe l’entraide."),
          q("Pourquoi éviter d’écrire sur une table de classe ?", ["Parce qu’elle sert à plusieurs élèves", "Parce que la table dort", "Parce qu’un cahier est plus lourd"], "Parce qu’elle sert à plusieurs élèves", "Un bien commun doit rester utilisable pour tous."),
          q("Tu empruntes une règle. Quelle suite est la plus responsable ?", ["Demander, utiliser avec soin, rendre", "Prendre sans demander, casser, cacher", "Garder toujours"], "Demander, utiliser avec soin, rendre", "La responsabilité suit plusieurs étapes cohérentes.")
        ]
      },
      {
        title: "Propreté et sécurité sur la route",
        one: "Les déchets doivent être placés dans un endroit prévu pour eux afin de garder l’école et le quartier propres. Sur la route, un enfant doit être prudent : s’arrêter, regarder des deux côtés et traverser à un endroit sûr avec l’accompagnement adapté à son âge.",
        two: "La sécurité consiste à repérer un danger avant d’agir. Une route paraît vide, mais un véhicule peut arriver rapidement. Regarder une seule fois ne suffit pas toujours. De même, jeter un déchet au sol semble être un petit geste, mais si tout le monde le fait, l’environnement devient sale. On réfléchit donc aux conséquences.",
        example: "Exemple : avant de traverser, je m’arrête au bord, je regarde à gauche et à droite, j’écoute et je suis les consignes de l’adulte qui m’accompagne.",
        ex: [
          q("Un papier est par terre. Que fais-tu si une poubelle est disponible ?", ["Je le mets à la poubelle", "Je l’éparpille", "Je le jette dans la rue"], "Je le mets à la poubelle", "Le bon endroit pour le déchet aide à garder le milieu propre."),
          q("Avant de traverser une route, il faut d’abord :", ["s’arrêter et observer", "courir sans regarder", "fermer les yeux"], "s’arrêter et observer", "L’observation permet de détecter les véhicules et autres dangers."),
          q("Pourquoi regarder des deux côtés ?", ["Parce qu’un danger peut venir de directions différentes", "Pour compter les maisons", "Pour changer la route"], "Parce qu’un danger peut venir de directions différentes", "On cherche plusieurs sources possibles de danger."),
          q("Si chaque élève jette un papier dans la cour, quelle conséquence est probable ?", ["La cour devient sale", "La cour se nettoie seule", "Les papiers disparaissent toujours"], "La cour devient sale", "Réfléchir à l’effet collectif aide à comprendre la responsabilité individuelle.")
        ]
      }
    ],

    arts: [
      {
        title: "Reconnaître et utiliser les couleurs",
        one: "En première année, l’enfant apprend à reconnaître et utiliser des couleurs courantes : noir, blanc, bleu, jaune, rouge et vert. Une couleur peut aider à décrire un objet ou à organiser un dessin.",
        two: "Observer une couleur demande de comparer. Si deux formes ont la même forme mais des couleurs différentes, c’est la couleur qui permet de les distinguer. L’enfant apprend ainsi à isoler un critère : forme, couleur, taille ou position.",
        example: "Exemple : 🔴 et 🔵 ont la même forme ronde, mais leur couleur est différente.",
        ex: [
          q("Touche la couleur rouge.", ["🔴", "🔵", "🟢"], "🔴", "Le disque rouge correspond à la couleur demandée."),
          q("Quelle couleur est différente ?", ["🔵", "🔵", "🟡"], "🟡", "Deux éléments sont bleus ; le jaune est différent."),
          q("Deux formes ont la même couleur mais des formes différentes. Quel critère change ?", ["la forme", "la couleur", "le jour"], "la forme", "La couleur reste identique ; c’est donc la forme qui varie."),
          q("Quelle couleur est souvent utilisée pour représenter une feuille saine ?", ["vert", "violet obligatoire", "aucune couleur n’existe"], "vert", "Beaucoup de feuilles contiennent de la chlorophylle et apparaissent vertes, même si la nature offre des variations.")
        ]
      },
      {
        title: "Dessiner des objets et êtres familiers",
        one: "Pour dessiner un objet familier, je commence par l’observer : sa forme générale, ses parties, leur position et leur taille. Je peux ensuite utiliser des formes simples avant d’ajouter les détails et les couleurs.",
        two: "Dessiner développe l’analyse visuelle. Au lieu de dire « je ne sais pas dessiner une maison », je la décompose : un grand rectangle pour le mur, une forme pour le toit, de petits rectangles pour la porte et les fenêtres. Décomposer un problème complexe en petites parties est une stratégie d’intelligence utile partout.",
        example: "Exemple : pour dessiner un poisson, je peux commencer par une forme ovale, ajouter une queue, un œil puis les nageoires.",
        ex: [
          q("Avant de dessiner un objet, il est utile de :", ["bien l’observer", "fermer les yeux tout le temps", "le cacher"], "bien l’observer", "L’observation fournit les informations nécessaires au dessin."),
          q("Pour dessiner une maison simplement, quelle stratégie aide ?", ["La décomposer en formes simples", "Commencer par les détails invisibles", "Ne rien regarder"], "La décomposer en formes simples", "Décomposer facilite la représentation d’un objet complexe."),
          q("Tu as oublié la position de la porte sur le modèle. Que fais-tu ?", ["Je regarde à nouveau le modèle", "Je déchire la feuille", "Je réponds au hasard"], "Je regarde à nouveau le modèle", "Revenir à l’observation est une forme d’autocorrection."),
          q("Quel élément peut être ajouté après la forme générale d’un poisson ?", ["la queue", "une route obligatoire", "un cahier"], "la queue", "On construit progressivement le dessin en ajoutant des parties pertinentes.")
        ]
      },
      {
        title: "Rythme, chant et récitation",
        one: "Le rythme est une organisation de sons dans le temps. Dans un chant ou une récitation, l’enfant apprend à écouter, répéter, articuler clairement et respecter une pulsation ou une suite.",
        two: "Pour reproduire un rythme, tu dois d’abord repérer ce qui se répète. Si tu entends « ta-ta / pause / ta-ta », tu cherches le motif. Cette capacité à détecter une régularité aide aussi en lecture et en mathématiques.",
        example: "Exemple : clap-clap, pause, clap-clap. Le groupe de deux frappes se répète.",
        ex: [
          q("Pour bien réciter devant la classe, il faut surtout :", ["parler clairement", "murmurer sans articuler", "tourner le dos et crier"], "parler clairement", "Une récitation compréhensible demande une articulation claire."),
          q("Quel motif se répète dans « ta-ta / ta-ta / ta-ta » ?", ["ta-ta", "ta-ta-ta-ta", "silence seulement"], "ta-ta", "Le même groupe de deux sons revient plusieurs fois."),
          q("Si le maître frappe clap-clap puis tu reproduis clap-clap, tu utilises surtout :", ["l’écoute et la mémoire", "le hasard", "la course"], "l’écoute et la mémoire", "Il faut percevoir le motif puis le conserver brièvement pour le reproduire."),
          q("Pourquoi marquer une petite pause à la ponctuation d’une récitation ?", ["Pour rendre le sens plus clair", "Pour oublier le texte", "Pour parler sans respirer"], "Pour rendre le sens plus clair", "La pause aide l’auditeur à comprendre les groupes de sens.")
        ]
      }
    ],

    eps: [
      {
        title: "Écouter un signal, marcher et courir",
        one: "En éducation physique, l’enfant apprend d’abord à réagir à une consigne. Au signal « stop », il s’arrête. Marcher consiste à avancer de façon contrôlée ; courir demande davantage de vitesse tout en regardant l’espace devant soi.",
        two: "Bouger intelligemment, c’est adapter son action au signal et à l’espace. Courir vite sans regarder peut être dangereux. L’enfant doit donc combiner écoute, décision et contrôle du corps : j’entends, je comprends, puis j’agis.",
        example: "Exemple : au coup de sifflet, je m’arrête, je regarde l’enseignant et j’attends la nouvelle consigne.",
        ex: [
          q("Au signal « stop », tu :", ["t’arrêtes", "accélères toujours", "fermes les yeux"], "t’arrêtes", "Le signal indique clairement l’arrêt."),
          q("Quand tu cours, où dois-tu regarder principalement ?", ["devant toi", "seulement derrière", "les yeux fermés"], "devant toi", "Regarder l’espace devant aide à anticiper les obstacles."),
          q("Tu n’as pas entendu la consigne. Quelle décision est la plus sûre ?", ["T’arrêter et demander de répéter", "Courir au hasard", "Pousser les autres"], "T’arrêter et demander de répéter", "En cas d’incertitude, on évite une action risquée et on cherche l’information."),
          q("Pourquoi faut-il laisser un peu d’espace entre les coureurs ?", ["Pour réduire les collisions", "Pour courir les yeux fermés", "Pour perdre la consigne"], "Pour réduire les collisions", "L’organisation de l’espace améliore la sécurité de tous.")
        ]
      },
      {
        title: "Sauter et lancer avec contrôle",
        one: "Sauter à pieds joints signifie pousser avec les deux pieds et retrouver un appui stable. Pour lancer un objet adapté à l’exercice, on utilise le bras en visant une direction donnée et en respectant la zone de sécurité.",
        two: "La réussite ne dépend pas seulement de la force. Pour sauter ou lancer, il faut coordonner plusieurs éléments : position du corps, direction, équilibre et moment du geste. Chercher ce qui améliore le mouvement développe l’observation de soi.",
        example: "Exemple : si mon lancer part toujours à gauche, je peux vérifier où mon bras et mon regard sont orientés avant de recommencer.",
        ex: [
          q("Sauter à pieds joints signifie :", ["utiliser les deux pieds ensemble", "utiliser seulement une main", "rester assis"], "utiliser les deux pieds ensemble", "Les deux pieds participent ensemble à l’impulsion."),
          q("Pour lancer dans une direction, il est utile de :", ["regarder la cible", "tourner complètement le dos", "fermer les yeux"], "regarder la cible", "Le regard aide à orienter l’action."),
          q("Ton lancer part trop à gauche. Quelle démarche est intelligente ?", ["Observer ton geste et ajuster", "Lancer plus fort sans regarder", "Abandonner immédiatement"], "Observer ton geste et ajuster", "Analyser puis modifier le geste développe l’autocorrection."),
          q("Pourquoi attendre que la zone soit libre avant de lancer ?", ["Pour la sécurité", "Pour perdre le ballon", "Pour changer la météo"], "Pour la sécurité", "Un objet lancé peut blesser une personne placée dans la trajectoire.")
        ]
      },
      {
        title: "Équilibre, coopération et règles du jeu",
        one: "Garder l’équilibre demande de contrôler la position du corps. Écarter les bras peut aider. Dans un jeu collectif, les règles permettent à plusieurs enfants de jouer ensemble de manière compréhensible et plus sûre.",
        two: "Une règle n’est pas seulement une interdiction : elle crée un cadre commun. Si chacun invente sa propre règle pendant le jeu, il devient impossible de savoir ce qui est juste. Coopérer signifie aussi aider un camarade, attendre son tour et accepter le résultat sans violence.",
        example: "Exemple : dans une course en relais, chaque enfant respecte son tour. La réussite dépend du groupe, pas seulement du plus rapide.",
        ex: [
          q("Pour garder l’équilibre, il peut être utile d’écarter :", ["les bras", "les oreilles", "les cheveux"], "les bras", "Les bras peuvent aider à stabiliser le corps."),
          q("À quoi sert une règle de jeu ?", ["À permettre à tous de jouer dans le même cadre", "À favoriser toujours un seul enfant", "À supprimer toute sécurité"], "À permettre à tous de jouer dans le même cadre", "Une règle commune rend le jeu compréhensible et équitable."),
          q("Ton camarade tombe pendant un jeu. Que fais-tu ?", ["Je vérifie s’il va bien et j’aide selon la consigne", "Je ris et je pousse", "Je continue sur lui"], "Je vérifie s’il va bien et j’aide selon la consigne", "La coopération inclut l’attention à la sécurité des autres."),
          q("Dans un relais, pourquoi attendre son tour ?", ["Parce que la réussite dépend d’un ordre commun", "Parce que personne ne doit courir", "Pour changer la règle seul"], "Parce que la réussite dépend d’un ordre commun", "Le respect d’une organisation commune permet au groupe de fonctionner.")
        ]
      }
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
    var meta = SUBJECTS[subject], lessons = CP1_LESSONS[subject] || [];
    state.subject = subject; state.lesson = -1; state.phase = 0; state.readText = '';
    state.list = []; state.index = 0; state.good = 0; state.wrong = [];
    setHeader(meta.name, '1ère année · Comprendre puis pratiquer', true);
    var html = '<section class="nx-px-hero"><h2>' + esc(meta.name) + '</h2><p>Choisis une leçon. Nexora te l’explique de deux façons différentes avant de te proposer les exercices.</p></section><div class="nx-px-grid">';
    lessons.forEach(function (lesson, i) {
      html += '<button type="button" class="nx-px-card" data-lesson="' + i + '"><em>🧠</em><strong>' + esc(lesson.title) + '</strong><small>2 explications · ' + (lesson.ex || []).length + ' exercices corrigés</small></button>';
    });
    html += '</div>';
    main().innerHTML = html;
  }

  function startCp1Lesson(index) {
    var lessons = CP1_LESSONS[state.subject] || [];
    var i = Number(index);
    if (!isFinite(i) || i < 0 || i >= lessons.length) { renderCp1Lessons(state.subject); return; }
    state.lesson = i; state.phase = 1; state.list = []; state.index = 0; state.good = 0; state.wrong = [];
    renderCp1Explanation();
  }

  function renderCp1Explanation() {
    var lessons = CP1_LESSONS[state.subject] || [], lesson = lessons[state.lesson];
    if (!lesson) { renderCp1Lessons(state.subject); return; }
    var first = state.phase !== 2;
    var title = first ? '1. Je découvre' : '2. Je comprends autrement';
    var body = first ? lesson.one : lesson.two;
    var extra = lesson.example || '';
    state.readText = title + '. ' + lesson.title + '. ' + body + (extra ? ' ' + extra : '');
    setHeader(SUBJECTS[state.subject].name, lesson.title, true);
    main().innerHTML = '<section class="nx-px-question">' +
      '<div class="nx-px-meta"><span>Étape ' + (first ? '1' : '2') + ' / 3</span><span>Écoute puis regarde</span></div>' +
      '<div class="nx-px-lesson-visual" role="img" aria-label="' + esc(lesson.visualLabel || lesson.title) + '">' + esc(lesson.visual || '📘') + '</div>' +
      '<h2 class="nx-px-q">' + esc(title) + '</h2>' +
      '<h3 style="margin:0 0 12px;color:#173a63">' + esc(lesson.title) + '</h3>' +
      '<button type="button" class="nx-px-listen" data-speak>🔊 Écouter / Réécouter</button>' +
      '<p class="nx-px-easy-text">' + esc(body) + '</p>' +
      (extra ? '<div class="nx-px-feedback ok" style="margin-top:16px"><b>💡 Exemple</b><span>' + esc(extra) + '</span></div>' : '') +
      '<button type="button" class="nx-px-next" ' + (first ? 'data-study-next' : 'data-start-exercises') + '>' +
      (first ? 'J’ai compris · Écouter la 2e explication' : 'J’ai compris · Passer aux exercices') + '</button></section>';
    speak(state.readText);
  }

  function startCp1Exercises() {
    var lessons = CP1_LESSONS[state.subject] || [], lesson = lessons[state.lesson];
    if (!lesson) { renderCp1Lessons(state.subject); return; }
    state.phase = 3; state.readText = '';
    state.list = shuffle(lesson.ex || []); state.index = 0; state.good = 0; state.wrong = []; state.locked = false;
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
      '@media(max-width:520px){.nx-px-grid{grid-template-columns:1fr}.nx-px-main{padding:14px 11px 32px}.nx-px-q{font-size:20px}.nx-px-card{min-height:92px}}'
    ].join('');
    document.head.appendChild(s);
  }

  function shell() {
    styles();
    if (viewer) return viewer;
    viewer = document.createElement('section');
    viewer.id = 'nxPrimaryExercisesV600';
    viewer.className = 'nx-px-v600';
    viewer.hidden = true;
    viewer.innerHTML = '<header class="nx-px-top"><button type="button" data-back aria-label="Retour">‹</button><div><b data-title>École primaire</b><span data-subtitle>Exercices corrigés</span></div><button type="button" class="nx-px-speak" data-speak aria-label="Lire">🔊</button><button type="button" data-close aria-label="Fermer">✕</button></header><main class="nx-px-main" data-main></main>';
    document.body.appendChild(viewer);
    viewer.addEventListener('click', function (ev) {
      var close = ev.target.closest('[data-close]'); if (close) { closeViewer(); return; }
      var back = ev.target.closest('[data-back]'); if (back) { goBack(); return; }
      var sp = ev.target.closest('[data-speak]'); if (sp) { speakCurrent(); return; }
      var lv = ev.target.closest('[data-level]'); if (lv) { state.level = lv.getAttribute('data-level'); state.subject = ''; renderSubjects(); return; }
      var lesson = ev.target.closest('[data-lesson]'); if (lesson) { startCp1Lesson(lesson.getAttribute('data-lesson')); return; }
      var studyNext = ev.target.closest('[data-study-next]'); if (studyNext) { state.phase = 2; renderCp1Explanation(); return; }
      var startEx = ev.target.closest('[data-start-exercises]'); if (startEx) { startCp1Exercises(); return; }
      var sj = ev.target.closest('[data-subject]'); if (sj) { startSubject(sj.getAttribute('data-subject')); return; }
      var ans = ev.target.closest('[data-answer]'); if (ans) { answer(ans.getAttribute('data-answer'), ans); return; }
      var next = ev.target.closest('[data-next]'); if (next) { nextQuestion(); return; }
      var retry = ev.target.closest('[data-retry-wrong]'); if (retry) { retryWrong(); return; }
      var again = ev.target.closest('[data-again]'); if (again) { if (state.level === '1' && state.lesson >= 0) startCp1Exercises(); else startSubject(state.subject); return; }
      var home = ev.target.closest('[data-subjects]'); if (home) { renderSubjects(); return; }
    });
    viewer.addEventListener('submit', function (ev) {
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
    state.level = ''; state.subject = ''; state.lesson = -1; state.phase = 0; state.readText = ''; state.list = []; state.index = 0;
    setHeader('École primaire', '100% exercices corrigés', false);
    var p = progressRead();
    var html = '<section class="nx-px-hero"><h2>Choisis ta classe</h2><p>Tu réponds à chaque exercice. Nexora te dit immédiatement si ta réponse est correcte, te donne la bonne réponse et t’explique pourquoi.</p></section><div class="nx-px-grid">';
    Object.keys(LEVELS).forEach(function (k) {
      var l = LEVELS[k], vals = [], total = 0;
      l.subjects.forEach(function (s) { var x = p[k + ':' + s]; if (x && typeof x.best === 'number') { vals.push(x.best); total += x.best; } });
      var avg = vals.length ? Math.round(total / vals.length) : null;
      html += '<button type="button" class="nx-px-card" data-level="' + k + '"><em>🎒</em><strong>' + esc(l.label) + '</strong><small>' + esc(l.subtitle) + '</small>' + (avg != null ? '<div class="nx-px-progress">Meilleur niveau moyen : ' + avg + '%</div>' : '') + '</button>';
    });
    html += '</div>';
    main().innerHTML = html;
  }

  function renderSubjects() {
    var l = LEVELS[state.level]; if (!l) { renderLevels(); return; }
    state.subject = ''; state.lesson = -1; state.phase = 0; state.readText = ''; state.list = []; state.index = 0;
    setHeader(l.label, 'Choisis une matière', true);
    var p = progressRead();
    var html = '<section class="nx-px-hero"><h2>' + esc(l.label) + '</h2><p>' + (state.level === '1' ? 'Choisis une matière. Chaque leçon est illustrée et lue à voix haute deux fois avant les exercices corrigés.' : 'Chaque matière est présentée sous forme d’exercices. Après chaque réponse, la correction et l’explication apparaissent.') + '</p></section><div class="nx-px-grid">';
    l.subjects.forEach(function (s) {
      var meta = SUBJECTS[s], bank = build(state.level, s), pr = p[state.level + ':' + s];
      html += '<button type="button" class="nx-px-card" data-subject="' + s + '"><em>' + meta.icon + '</em><strong>' + esc(meta.name) + '</strong><small>' + bank.length + ' exercices par série</small>' + (pr ? '<div class="nx-px-progress">Meilleur score : ' + (pr.best || 0) + '%</div>' : '') + '</button>';
    });
    html += '</div>';
    main().innerHTML = html;
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
    if (state.index >= state.list.length) { renderResult(); return; }
    state.locked = false;
    var ex = state.list[state.index], meta = SUBJECTS[state.subject], l = LEVELS[state.level];
    state.readText = ex.q;
    setHeader(meta.name, state.level === '1' && state.lesson >= 0 ? (CP1_LESSONS[state.subject][state.lesson].title) : l.label, true);
    var html = '<section class="nx-px-question"><div class="nx-px-meta"><span>Exercice ' + (state.index + 1) + ' / ' + state.list.length + '</span><span>' + esc(meta.name) + '</span></div><h2 class="nx-px-q">' + esc(ex.q) + '</h2>';
    if (ex.visual) html += '<div class="nx-px-visual">' + esc(ex.visual) + '</div>';
    if (ex.type === 'choice') {
      html += '<div class="nx-px-choices">' + ex.choices.map(function (c) { return '<button type="button" class="nx-px-answer" data-answer="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    } else {
      var mode = ex.type === 'input' ? 'inputmode="decimal"' : '';
      html += '<form class="nx-px-input" data-answer-form><input ' + mode + ' autocomplete="off" aria-label="Ta réponse" placeholder="Écris ta réponse"><button type="submit">Corriger</button></form>';
    }
    html += '<div data-feedback></div></section>';
    main().innerHTML = html;
    var input = main().querySelector('input'); if (input) setTimeout(function () { try { input.focus(); } catch (_e) {} }, 50);
    if (state.level === '1') speak(ex.q);
  }

  function answer(value, control) {
    if (state.locked || state.index >= state.list.length) return;
    var ex = state.list[state.index], ok = normalize(value) === normalize(ex.a);
    if (!String(value || '').trim()) return;
    state.locked = true;
    if (ok) state.good++; else state.wrong.push(ex);
    var all = main().querySelectorAll('[data-answer]');
    Array.prototype.forEach.call(all, function (b) {
      b.disabled = true;
      if (normalize(b.getAttribute('data-answer')) === normalize(ex.a)) b.classList.add('good');
    });
    if (!ok && control && control.classList) control.classList.add('bad');
    var box = main().querySelector('[data-feedback]');
    box.className = 'nx-px-feedback ' + (ok ? 'ok' : 'no');
    box.innerHTML = '<b>' + (ok ? '✅ Bonne réponse !' : '❌ Ce n’est pas la bonne réponse.') + '</b>' + (ok ? '' : 'Bonne réponse : <strong>' + esc(ex.a) + '</strong><br>') + (ex.why ? '<span>' + esc(ex.why) + '</span>' : '') + '<button type="button" class="nx-px-next" data-next>' + (state.index + 1 >= state.list.length ? 'Voir mon résultat' : 'Exercice suivant') + '</button>';
    state.readText = ok ? ('Bonne réponse. ' + ex.why) : ('La bonne réponse est ' + ex.a + '. ' + ex.why);
    speak(state.readText);
  }

  function nextQuestion() { state.index++; renderQuestion(); }

  function renderResult() {
    progressWrite(state.level, state.subject, state.good, state.list.length);
    var score = state.list.length ? Math.round(state.good * 100 / state.list.length) : 0;
    var msg = score >= 80 ? 'Très bien !' : score >= 60 ? 'Bon travail. Continue.' : 'Tu progresses. Reprends les erreurs.';
    setHeader(SUBJECTS[state.subject].name, LEVELS[state.level].label, true);
    main().innerHTML = '<section class="nx-px-result"><div style="font-size:40px">🏆</div><h2>' + esc(msg) + '</h2><div class="nx-px-score">' + score + '%</div><p>' + state.good + ' bonnes réponses sur ' + state.list.length + '.</p><div class="nx-px-actions">' + (state.wrong.length ? '<button type="button" class="primary" data-retry-wrong>Reprendre mes ' + state.wrong.length + ' erreur(s)</button>' : '') + '<button type="button" data-again>Refaire une nouvelle série</button><button type="button" data-subjects>Choisir une autre matière</button></div></section>';
  }

  function retryWrong() {
    if (!state.wrong.length) { startSubject(state.subject); return; }
    state.list = shuffle(state.wrong); state.index = 0; state.good = 0; state.wrong = []; state.locked = false; renderQuestion();
  }
  function goBack() {
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
    if (!viewer) return;
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (_e) {}
    viewer.hidden = true; document.body.style.overflow = '';
    state.list = []; state.index = 0; state.level = ''; state.subject = ''; state.lesson = -1; state.phase = 0; state.readText = '';
  }

  window.NexoraPrimarySchoolV157 = {
    version: VERSION,
    open: openViewer,
    close: closeViewer,
    getProgress: progressRead
  };
})();
