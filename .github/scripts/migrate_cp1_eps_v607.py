from pathlib import Path
import json
p=Path('assets/js/nx-v157-primary-school-script.js')
s=p.read_text(encoding='utf-8')
s=s.replace('École primaire interactive V606','École primaire interactive V607',1)
s=s.replace("var VERSION = 'v606';","var VERSION = 'v607';",1)
s=s.replace('window.__nxPrimaryExercisesV606','window.__nxPrimaryExercisesV607')
start=s.index('    eps: [')
end=s.index('\n    ]\n  };',start)+6
eps=r'''    eps: [
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
    ]'''
s=s[:start]+eps+s[end:]
p.write_text(s,encoding='utf-8')
Path('version.json').write_text(json.dumps({'version':'V607','message':'Nexora V607 : Education physique CP1 complete en 15 lecons avec audio, illustrations, coordination, cooperation et securite.','critical':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('V607 EPS migration ready')
