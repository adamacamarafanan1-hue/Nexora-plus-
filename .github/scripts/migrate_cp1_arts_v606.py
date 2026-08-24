from pathlib import Path
import json
p=Path('assets/js/nx-v157-primary-school-script.js')
s=p.read_text(encoding='utf-8')
s=s.replace('École primaire interactive V605','École primaire interactive V606',1)
s=s.replace("var VERSION = 'v605';","var VERSION = 'v606';",1)
s=s.replace('window.__nxPrimaryExercisesV605','window.__nxPrimaryExercisesV606')
start=s.index('    arts: [')
end=s.index('\n\n    eps: [',start)
arts=r'''    arts: [
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
    ],'''
s=s[:start]+arts+s[end:]
p.write_text(s,encoding='utf-8')
Path('version.json').write_text(json.dumps({'version':'V606','message':'Nexora V606 : Arts et culture CP1 complets en 15 lecons avec audio, illustrations, dessin, rythme, chant, recitation et creation.','critical':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('V606 arts migration ready')
