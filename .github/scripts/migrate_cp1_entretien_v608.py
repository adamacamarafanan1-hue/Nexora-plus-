from pathlib import Path
import json
p=Path('assets/js/nx-v157-primary-school-script.js')
s=p.read_text(encoding='utf-8')
s=s.replace('École primaire interactive V607','École primaire interactive V608',1)
s=s.replace("var VERSION = 'v607';","var VERSION = 'v608';",1)
s=s.replace('window.__nxPrimaryExercisesV607','window.__nxPrimaryExercisesV608')
start=s.index('    entretien: [')
end=s.index('\n\n    francais: [',start)
entretien=r'''    entretien: [
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
    ],'''
s=s[:start]+entretien+s[end:]
p.write_text(s,encoding='utf-8')
Path('version.json').write_text(json.dumps({'version':'V608','message':'Nexora V608 : 1ere annee CP1 complete en 162 lecons, avec audio, illustrations, deux explications simples et exercices corriges dans toutes les matieres.','critical':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('V608 entretien and CP1 completion ready')
