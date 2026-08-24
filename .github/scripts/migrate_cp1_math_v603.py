from pathlib import Path
import json

p=Path('assets/js/nx-v157-primary-school-script.js')
s=p.read_text(encoding='utf-8')
s=s.replace('École primaire interactive V602','École primaire interactive V603',1)
s=s.replace("var VERSION = 'v602';","var VERSION = 'v603';",1)
s=s.replace('window.__nxPrimaryExercisesV602','window.__nxPrimaryExercisesV603')

anchor="  function cp1Syllables(title, syllables, visual) {"
pos=s.index(anchor)
# insert math helper before syllable helper only if absent
if 'function cp1NumberLesson(' not in s:
    helper=r'''  function cp1NumberLesson(num, word, visual, decompA, decompB) {
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

'''
    s=s[:pos]+helper+s[pos:]

start=s.index('    maths: [')
end=s.index('\n\n    sciences: [',start)
math=r'''    maths: [
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
    ],'''
s=s[:start]+math+s[end:]
p.write_text(s,encoding='utf-8')
Path('version.json').write_text(json.dumps({'version':'V603','message':'Nexora V603 : Mathematiques CP1 completes en 35 lecons avec audio, illustrations, deux explications simples et exercices de raisonnement.','critical':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('V603 math migration ready')
