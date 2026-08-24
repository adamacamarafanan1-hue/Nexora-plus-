/* NEXORA — École primaire interactive V600
   Remplacement pédagogique du primaire : 100% exercices corrigés.
   Contrat public conservé : window.NexoraPrimarySchoolV157.open(). */
(function () {
  'use strict';
  if (window.__nxPrimaryExercisesV600) return;
  window.__nxPrimaryExercisesV600 = true;

  var VERSION = 'v600';
  var STORAGE = 'nexora.primary.exercises.v600.progress';
  var viewer = null;
  var state = { level: '', subject: '', list: [], index: 0, good: 0, wrong: [], locked: false };

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
    '1': { label: '1ère année', subtitle: 'Je découvre, je compte, je lis', subjects: ['francais','maths','sciences','ecm'] },
    '2': { label: '2ème année', subtitle: 'Je lis mieux et je calcule', subjects: ['francais','maths','sciences','ecm'] },
    '3': { label: '3ème année', subtitle: 'Je comprends et je résous', subjects: ['francais','maths','sciences','histoiregeo','ecm'] },
    '4': { label: '4ème année', subtitle: 'J’explique et j’applique', subjects: ['francais','maths','sciences','histoiregeo','ecm'] },
    '5': { label: '5ème année', subtitle: 'Je raisonne avec méthode', subjects: ['francais','maths','sciences','histoire','geographie','ecm'] },
    '6': { label: '6ème année', subtitle: 'Je me prépare au collège', subjects: ['francais','maths','sciences','histoire','geographie','ecm'] }
  };
  var SUBJECTS = {
    francais: { name: 'Français', icon: '📖' }, maths: { name: 'Mathématiques', icon: '➗' },
    sciences: { name: 'Sciences', icon: '🔬' }, histoiregeo: { name: 'Histoire & Géographie', icon: '🌍' },
    histoire: { name: 'Histoire', icon: '🏺' }, geographie: { name: 'Géographie', icon: '🗺️' },
    ecm: { name: 'Éducation civique', icon: '🤝' }
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
    if (subject === 'maths') return maths(level);
    if (subject === 'francais') return francais(level);
    var bank = STATIC[subject] && STATIC[subject][level];
    if (bank) return bank.slice();
    return [];
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
      var sj = ev.target.closest('[data-subject]'); if (sj) { startSubject(sj.getAttribute('data-subject')); return; }
      var ans = ev.target.closest('[data-answer]'); if (ans) { answer(ans.getAttribute('data-answer'), ans); return; }
      var next = ev.target.closest('[data-next]'); if (next) { nextQuestion(); return; }
      var retry = ev.target.closest('[data-retry-wrong]'); if (retry) { retryWrong(); return; }
      var again = ev.target.closest('[data-again]'); if (again) { startSubject(state.subject); return; }
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
    v.querySelector('[data-speak]').style.visibility = state.list.length && state.index < state.list.length ? 'visible' : 'hidden';
  }
  function main() { return shell().querySelector('[data-main]'); }

  function renderLevels() {
    state.level = ''; state.subject = ''; state.list = []; state.index = 0;
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
    state.list = []; state.index = 0;
    setHeader(l.label, 'Choisis une matière', true);
    var p = progressRead();
    var html = '<section class="nx-px-hero"><h2>' + esc(l.label) + '</h2><p>Chaque matière est présentée sous forme d’exercices. Après chaque réponse, la correction et l’explication apparaissent.</p></section><div class="nx-px-grid">';
    l.subjects.forEach(function (s) {
      var meta = SUBJECTS[s], bank = build(state.level, s), pr = p[state.level + ':' + s];
      html += '<button type="button" class="nx-px-card" data-subject="' + s + '"><em>' + meta.icon + '</em><strong>' + esc(meta.name) + '</strong><small>' + bank.length + ' exercices par série</small>' + (pr ? '<div class="nx-px-progress">Meilleur score : ' + (pr.best || 0) + '%</div>' : '') + '</button>';
    });
    html += '</div>';
    main().innerHTML = html;
  }

  function startSubject(subject) {
    state.subject = subject;
    state.list = shuffle(build(state.level, subject));
    state.index = 0; state.good = 0; state.wrong = []; state.locked = false;
    if (!state.list.length) { renderSubjects(); return; }
    renderQuestion();
  }

  function renderQuestion() {
    if (state.index >= state.list.length) { renderResult(); return; }
    state.locked = false;
    var ex = state.list[state.index], meta = SUBJECTS[state.subject], l = LEVELS[state.level];
    setHeader(meta.name, l.label, true);
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
    speak(ok ? 'Bonne réponse. ' + ex.why : 'La bonne réponse est ' + ex.a + '. ' + ex.why);
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
    if (state.list.length) { state.list = []; state.index = 0; renderSubjects(); return; }
    if (state.level) { renderLevels(); return; }
    closeViewer();
  }
  function speakCurrent() {
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
    state.list = []; state.index = 0; state.level = ''; state.subject = '';
  }

  window.NexoraPrimarySchoolV157 = {
    version: VERSION,
    open: openViewer,
    close: closeViewer,
    getProgress: progressRead
  };
})();
