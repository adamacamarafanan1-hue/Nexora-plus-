from pathlib import Path
import json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')

s = s.replace('École primaire interactive V601', 'École primaire interactive V602', 1)
s = s.replace('Pédagogie CP1 : deux explications complémentaires avant les exercices corrigés.', 'Pédagogie CP1 : audio, illustrations, deux explications simples puis exercices corrigés.', 1)
s = s.replace('window.__nxPrimaryExercisesV601', 'window.__nxPrimaryExercisesV602')
s = s.replace("var VERSION = 'v601';", "var VERSION = 'v602';", 1)

helper_anchor = "  /* CP1 — première tranche curriculaire V601."
helpers = r'''  function cp1Lesson(title, one, two, example, visual, visualLabel, ex) {
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

'''
if helper_anchor not in s:
    raise SystemExit('helper anchor not found')
s = s.replace(helper_anchor, helpers + "  /* CP1 — curriculum V602. Français complet en 45 leçons ; autres matières gardées pour les étapes suivantes.", 1)

start = s.index('    francais: [')
end = s.index('\n\n    maths: [', start)

french = r'''    francais: [
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
    ],'''

s = s[:start] + french + s[end:]

# Make the lesson explanation simpler visually, add illustration and explicit audio, and auto-read after the child opens it.
old = """    main().innerHTML = '<section class=\"nx-px-question\">' +\n      '<div class=\"nx-px-meta\"><span>Étape ' + (first ? '1' : '2') + ' / 3</span><span>Avant les exercices</span></div>' +\n      '<h2 class=\"nx-px-q\">' + esc(title) + '</h2>' +\n      '<h3 style=\"margin:0 0 12px;color:#173a63\">' + esc(lesson.title) + '</h3>' +\n      '<p style=\"font-size:17px;line-height:1.65;margin:0\">' + esc(body) + '</p>' +\n      (extra ? '<div class=\"nx-px-feedback ok\" style=\"margin-top:16px\"><b>💡 Exemple</b><span>' + esc(extra) + '</span></div>' : '') +\n      '<button type=\"button\" class=\"nx-px-next\" ' + (first ? 'data-study-next' : 'data-start-exercises') + '>' +\n      (first ? 'J’ai compris · Deuxième explication' : 'J’ai compris · Passer aux exercices') + '</button></section>';\n  }"""
new = """    main().innerHTML = '<section class=\"nx-px-question\">' +\n      '<div class=\"nx-px-meta\"><span>Étape ' + (first ? '1' : '2') + ' / 3</span><span>Écoute puis regarde</span></div>' +\n      '<div class=\"nx-px-lesson-visual\" role=\"img\" aria-label=\"' + esc(lesson.visualLabel || lesson.title) + '\">' + esc(lesson.visual || '📘') + '</div>' +\n      '<h2 class=\"nx-px-q\">' + esc(title) + '</h2>' +\n      '<h3 style=\"margin:0 0 12px;color:#173a63\">' + esc(lesson.title) + '</h3>' +\n      '<button type=\"button\" class=\"nx-px-listen\" data-speak>🔊 Écouter / Réécouter</button>' +\n      '<p class=\"nx-px-easy-text\">' + esc(body) + '</p>' +\n      (extra ? '<div class=\"nx-px-feedback ok\" style=\"margin-top:16px\"><b>💡 Exemple</b><span>' + esc(extra) + '</span></div>' : '') +\n      '<button type=\"button\" class=\"nx-px-next\" ' + (first ? 'data-study-next' : 'data-start-exercises') + '>' +\n      (first ? 'J’ai compris · Écouter la 2e explication' : 'J’ai compris · Passer aux exercices') + '</button></section>';\n    speak(state.readText);\n  }"""
if old not in s:
    raise SystemExit('explanation renderer anchor not found')
s = s.replace(old, new, 1)

style_anchor = "      '.nx-px-feedback{margin-top:15px;border-radius:13px;padding:14px;font-size:15px;line-height:1.5}.nx-px-feedback.ok{background:#edf7ef;color:#185c2b}.nx-px-feedback.no{background:#fff0f0;color:#8c1d18}.nx-px-feedback b{display:block;margin-bottom:4px}',"
style_extra = style_anchor + "\n      '.nx-px-lesson-visual{display:flex;align-items:center;justify-content:center;min-height:128px;margin:0 0 16px;padding:16px;border-radius:16px;background:#f0f6ff;border:1px solid #d8e6f7;font-size:46px;line-height:1.25;text-align:center;letter-spacing:3px}.nx-px-listen{width:100%;border:0;border-radius:13px;background:#e7f1ff;color:#173a63;padding:13px 14px;font:inherit;font-weight:850;margin:0 0 14px}.nx-px-easy-text{font-size:18px;line-height:1.7;margin:0;color:#22303e}',"
if style_anchor not in s:
    raise SystemExit('style anchor not found')
s = s.replace(style_anchor, style_extra, 1)

# Speak CP1 exercise questions too, after the user has explicitly entered the exercise sequence.
question_anchor = "    var input = main().querySelector('input'); if (input) setTimeout(function () { try { input.focus(); } catch (_e) {} }, 50);\n  }"
question_new = "    var input = main().querySelector('input'); if (input) setTimeout(function () { try { input.focus(); } catch (_e) {} }, 50);\n    if (state.level === '1') speak(ex.q);\n  }"
if question_anchor not in s:
    raise SystemExit('question renderer anchor not found')
s = s.replace(question_anchor, question_new, 1)

# CP1 subject screen now tells the parent/child that the course is lesson-first, not exercise-first.
old_desc = "    var html = '<section class=\"nx-px-hero\"><h2>' + esc(l.label) + '</h2><p>Chaque matière est présentée sous forme d’exercices. Après chaque réponse, la correction et l’explication apparaissent.</p></section><div class=\"nx-px-grid\">';"
new_desc = "    var html = '<section class=\"nx-px-hero\"><h2>' + esc(l.label) + '</h2><p>' + (state.level === '1' ? 'Choisis une matière. Chaque leçon est illustrée et lue à voix haute deux fois avant les exercices corrigés.' : 'Chaque matière est présentée sous forme d’exercices. Après chaque réponse, la correction et l’explication apparaissent.') + '</p></section><div class=\"nx-px-grid\">';"
if old_desc not in s:
    raise SystemExit('subject description anchor not found')
s = s.replace(old_desc, new_desc, 1)

path.write_text(s, encoding='utf-8')

version = Path('version.json')
version.write_text(json.dumps({
    'version': 'V602',
    'message': 'Nexora V602 : Francais 1ere annee complet, 45 lecons avec audio, illustrations, deux explications simples et exercices corriges.',
    'critical': False
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('V602 primary French migration ready')
