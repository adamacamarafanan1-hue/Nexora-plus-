from pathlib import Path
import json

path = Path('assets/js/nx-v157-primary-school-script.js')
s = path.read_text(encoding='utf-8')

if "École primaire interactive V600" not in s and "École primaire interactive V601" not in s:
    raise SystemExit('Version source inattendue : V600 introuvable')


def once(old, new, label):
    global s
    if old not in s:
        if new in s:
            return
        raise SystemExit(f'Marqueur introuvable: {label}')
    s = s.replace(old, new, 1)

once('École primaire interactive V600', 'École primaire interactive V601', 'entete')
once('Remplacement pédagogique du primaire : 100% exercices corrigés.', 'Pédagogie CP1 : deux explications complémentaires avant les exercices corrigés.', 'sous-entete')
once('if (window.__nxPrimaryExercisesV600) return;\n  window.__nxPrimaryExercisesV600 = true;',
     'if (window.__nxPrimaryExercisesV601) return;\n  window.__nxPrimaryExercisesV601 = true;', 'garde globale')
once("var VERSION = 'v600';", "var VERSION = 'v601';", 'version')
# On conserve la cle de progression V600 afin de ne pas effacer les scores existants.
once("var state = { level: '', subject: '', list: [], index: 0, good: 0, wrong: [], locked: false };",
     "var state = { level: '', subject: '', lesson: -1, phase: 0, readText: '', list: [], index: 0, good: 0, wrong: [], locked: false };", 'etat')

once("'1': { label: '1ère année', subtitle: 'Je découvre, je compte, je lis', subjects: ['francais','maths','sciences','ecm'] },",
     "'1': { label: '1ère année', subtitle: 'Je comprends deux fois, puis je m’exerce', subjects: ['entretien','francais','maths','sciences','ecm','arts','eps'] },", 'matieres CP1')

old_subjects = """  var SUBJECTS = {
    francais: { name: 'Français', icon: '📖' }, maths: { name: 'Mathématiques', icon: '➗' },
    sciences: { name: 'Sciences', icon: '🔬' }, histoiregeo: { name: 'Histoire & Géographie', icon: '🌍' },
    histoire: { name: 'Histoire', icon: '🏺' }, geographie: { name: 'Géographie', icon: '🗺️' },
    ecm: { name: 'Éducation civique', icon: '🤝' }
  };
"""
new_subjects = """  var SUBJECTS = {
    entretien: { name: 'Entretien du matin', icon: '🌤️' },
    francais: { name: 'Français', icon: '📖' }, maths: { name: 'Mathématiques', icon: '➗' },
    sciences: { name: 'Sciences d’observation', icon: '🔬' }, histoiregeo: { name: 'Histoire & Géographie', icon: '🌍' },
    histoire: { name: 'Histoire', icon: '🏺' }, geographie: { name: 'Géographie', icon: '🗺️' },
    ecm: { name: 'Éducation civique et morale', icon: '🤝' },
    arts: { name: 'Arts & culture', icon: '🎨' }, eps: { name: 'Éducation physique', icon: '🏃' }
  };

  /* CP1 — première tranche curriculaire V601.
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
      {
        title: "Saluer, se présenter et présenter quelqu’un",
        one: "En français, nous utilisons des phrases simples pour entrer en relation avec les autres. Je peux dire « Bonjour », « Je m’appelle Mariama », « Voici mon ami Ibrahima ». Pour poser une question, je peux demander « Comment tu t’appelles ? ».",
        two: "Une phrase sert à transmettre une idée précise. « Je m’appelle Fanta » donne une information sur moi. « Comment tu t’appelles ? » demande une information à l’autre. L’enfant intelligent ne répète pas seulement une formule : il choisit la phrase qui correspond à son intention.",
        example: "Exemple : A : « Bonjour, je m’appelle Alpha. Comment tu t’appelles ? » B : « Bonjour, je m’appelle Aminata. »",
        ex: [
          q("Pour dire ton nom, tu choisis :", ["Je m’appelle Sory", "Où est le marché ?", "Il pleut"], "Je m’appelle Sory", "Cette structure sert à se présenter."),
          q("Pour demander le nom de quelqu’un :", ["Comment tu t’appelles ?", "J’ai deux cahiers.", "Ferme la porte."], "Comment tu t’appelles ?", "C’est une phrase interrogative qui demande le nom."),
          q("Tu veux présenter ta sœur Awa. Quelle phrase convient ?", ["Voici ma sœur Awa.", "Je suis un cahier.", "Awa est lundi."], "Voici ma sœur Awa.", "« Voici » permet de présenter une personne ou une chose."),
          q("Quelle phrase est une question ?", ["Où est ton cahier ?", "Mon cahier est ici.", "Voici mon cahier."], "Où est ton cahier ?", "Le sens demande une information et la phrase se termine par un point d’interrogation.")
        ]
      },
      {
        title: "Entendre et reconnaître les sons a et i",
        one: "Avant de bien lire, l’oreille apprend à reconnaître les sons. Dans « papa » et « mangue », on entend le son [a]. Dans « riz » et « lit », on entend le son [i]. Ensuite, l’œil associe ces sons aux lettres a et i.",
        two: "Pour reconnaître un son, prononce lentement le mot et écoute. Ne choisis pas parce que le mot est joli ou connu. Cherche l’indice sonore. Dans « papa », ta bouche produit deux fois [a]. Dans « riz », tu entends [i]. Tu utilises donc ton oreille comme un outil d’analyse.",
        example: "Exemple : dis lentement « ma-ri ». Tu entends [a] dans « ma » et [i] dans « ri ».",
        ex: [
          q("Dans quel mot entends-tu [a] ?", ["papa", "lit", "riz"], "papa", "En prononçant « papa », on entend clairement le son [a]."),
          q("Dans quel mot entends-tu [i] ?", ["riz", "maman", "moto"], "riz", "Le son [i] est entendu dans « riz »."),
          q("Quelle lettre correspond au son [a] étudié ?", ["a", "i", "m"], "a", "La lettre a représente ici le son [a]."),
          q("Tu entends [i] à la fin du mot « mari ». Quelle lettre cherches-tu ?", ["i", "a", "o"], "i", "On relie le son entendu à la lettre correspondante.")
        ]
      },
      {
        title: "Les sons m et l, puis les syllabes",
        one: "Les lettres m et l sont des consonnes. Quand on ajoute une voyelle, elles forment des syllabes faciles à lire : m + a = ma, m + i = mi, l + a = la, l + i = li.",
        two: "Lire une syllabe, c’est fusionner deux sons sans les séparer trop longtemps. Au lieu de dire « m… a », rapproche les sons jusqu’à entendre « ma ». Ensuite tu peux assembler des syllabes pour lire des mots simples. C’est comme joindre deux petites pièces pour construire une unité plus grande.",
        example: "Exemple : ma + ma donne « mama ». li + li donne « lili ». L’objectif est de comprendre comment les sons s’assemblent.",
        ex: [
          q("m + a se lit :", ["ma", "am", "mi"], "ma", "La consonne m suivie de la voyelle a forme « ma »."),
          q("l + i se lit :", ["li", "il", "la"], "li", "La consonne l suivie de i forme « li »."),
          q("Quel mot commence par le son [m] ?", ["maman", "riz", "lune"], "maman", "Le premier son de « maman » est [m]."),
          q("Si tu lis ma puis li, quelle suite obtiens-tu ?", ["mali", "lima", "mama"], "mali", "On conserve l’ordre des syllabes : ma + li = mali.")
        ]
      },
      {
        title: "Tracer et écrire avec attention",
        one: "Écrire demande de contrôler sa main. Le trait vertical descend droit ; le trait horizontal va de gauche à droite ; le rond tourne et revient près de son point de départ. Ces gestes servent ensuite à former les lettres.",
        two: "Un bon tracé n’est pas une course. L’œil guide la main : je regarde le point de départ, la direction et l’endroit où je dois m’arrêter. Si le trait part de travers, je cherche pourquoi et je recommence plus lentement. Cette méthode développe précision et autocorrection.",
        example: "Exemple : pour écrire i, je trace d’abord un petit trait vertical puis je place un point au-dessus, sans le coller au trait.",
        ex: [
          q("Quel trait est vertical ?", ["|", "—", "○"], "|", "Un trait vertical va du haut vers le bas."),
          q("Pour tracer un rond, la main doit surtout :", ["faire un tour", "faire seulement un trait droit", "rester immobile"], "faire un tour", "Le rond est une ligne courbe fermée."),
          q("Quelle lettre étudiée porte un point au-dessus ?", ["i", "m", "l"], "i", "La lettre i minuscule comporte un point."),
          q("Ton trait dépasse beaucoup la ligne. Que fais-tu ?", ["Je regarde mon erreur et je recommence plus lentement", "Je cache la page", "Je continue sans regarder"], "Je regarde mon erreur et je recommence plus lentement", "L’autocorrection aide à améliorer progressivement le geste d’écriture.")
        ]
      }
    ],

    maths: [
      {
        title: "Beaucoup, peu, rien, plus, moins et autant",
        one: "Avant les nombres, nous comparons des quantités. Un panier peut contenir beaucoup de mangues, peu de mangues ou rien. Entre deux groupes, celui qui contient davantage d’objets en a plus ; celui qui en contient moins en a moins. Deux groupes ont autant d’objets quand leurs quantités sont égales.",
        two: "Pour comparer sans te tromper, tu peux mettre les objets en correspondance un à un. Une mangue du premier panier avec une mangue du second. Si un panier a encore des mangues quand l’autre n’en a plus, il en contient davantage. Cette méthode transforme une impression en raisonnement.",
        example: "Exemple : 🥭🥭🥭 et 🥭🥭. On forme deux paires ; il reste une mangue dans le premier groupe. Le premier groupe en a donc plus.",
        ex: [
          q("Quel groupe contient le plus de ronds ?", ["●●●●", "●●", "●"], "●●●●", "Quatre ronds sont plus nombreux que deux ou un."),
          q("Quel groupe ne contient rien ?", ["(vide)", "●", "●●"], "(vide)", "Un groupe vide contient zéro objet."),
          q("●●● et ■■■ ont-ils autant d’objets ?", ["Oui", "Non"], "Oui", "Il y a trois ronds et trois carrés : les quantités sont égales."),
          q("Awa a 4 billes et Sékou en a 2. Qui en a moins ?", ["Sékou", "Awa", "Ils en ont autant"], "Sékou", "Deux est une quantité plus petite que quatre.")
        ]
      },
      {
        title: "Se repérer dans l’espace",
        one: "Pour dire où se trouve un objet, nous utilisons des mots précis : devant, derrière, à l’intérieur, à l’extérieur, en haut, en bas, sur, sous, près et loin. Ces mots permettent de décrire une position sans montrer du doigt.",
        two: "La position dépend souvent d’un point de référence. Un ballon peut être devant la maison mais derrière un enfant. Avant de répondre, demande-toi : « par rapport à quoi ? ». Cette question développe le raisonnement spatial.",
        example: "Exemple : si le livre est posé sur la table, la table est sous le livre. Une même situation peut donc être décrite de deux points de vue.",
        ex: [
          q("Le cahier est posé sur la table. Où est le cahier ?", ["sur la table", "sous la table", "loin de la table"], "sur la table", "Le cahier repose au-dessus de la surface de la table."),
          q("Le ballon est dans la boîte. Il est :", ["à l’intérieur", "à l’extérieur", "au-dessus du ciel"], "à l’intérieur", "Être dans la boîte signifie être à l’intérieur."),
          q("L’école est juste à côté de la maison. Elle est plutôt :", ["près", "loin", "sous"], "près", "« À côté » indique une petite distance."),
          q("Le chat est derrière la porte. La porte est alors ___ du chat.", ["devant", "derrière", "dans"], "devant", "Si le chat est derrière la porte, la porte se trouve devant le chat : on change de point de vue.")
        ]
      },
      {
        title: "Les nombres de 0 à 5",
        one: "Un nombre indique une quantité. 0 signifie qu’il n’y a aucun objet. 1 correspond à un objet, 2 à deux objets, jusqu’à 5. Pour compter correctement, je touche ou je regarde chaque objet une seule fois et je dis les nombres dans l’ordre.",
        two: "Le dernier nombre prononcé donne la quantité totale. Si tu comptes 🥭🥭🥭 en disant 1, 2, 3, le nombre 3 représente tout le groupe, pas seulement la dernière mangue. Tu peux aussi décomposer : 5, c’est 4 et encore 1, ou 3 et encore 2.",
        example: "Exemple : ●●●●● = 5. Si j’en cache deux, il reste ●●● = 3.",
        ex: [
          q("Combien de poissons ? 🐟🐟🐟", ["2", "3", "4"], "3", "On compte chaque poisson une fois : 1, 2, 3."),
          q("Le panier est vide. Quel nombre écrit-on ?", ["0", "1", "5"], "0", "Zéro représente l’absence d’objet."),
          q("Quel groupe représente 5 ?", ["●●●●●", "●●●", "●●"], "●●●●●", "Le groupe contient cinq objets."),
          q("5 peut être formé par :", ["3 et 2", "1 et 1", "2 et 1"], "3 et 2", "Trois objets plus deux objets donnent cinq objets.")
        ]
      },
      {
        title: "Additionner sans dépasser 9",
        one: "Additionner, c’est réunir des quantités. Si j’ai 2 mangues et qu’on m’en donne 3 autres, je réunis les deux groupes et je compte tout : 1, 2, 3, 4, 5. Donc 2 + 3 = 5.",
        two: "On peut aussi partir du plus grand nombre pour compter plus vite. Pour 5 + 2, je garde 5 dans ma tête puis j’avance de deux pas : 6, 7. Cette stratégie évite de recompter tout depuis 1 et développe le calcul mental.",
        example: "Exemple : 4 + 3. Je pars de 4 et j’avance : 5, 6, 7. Le résultat est 7.",
        ex: [
          n("2 + 3 = ?", 5, "On réunit 2 et 3 : cela donne 5.", "●● + ●●●"),
          n("4 + 1 = ?", 5, "Ajouter 1 donne le nombre suivant : après 4 vient 5."),
          n("5 + 2 = ?", 7, "On part de 5 puis on compte deux pas : 6, 7."),
          q("Aminata a 3 crayons et reçoit 2 crayons. Quelle opération représente la situation ?", ["3 + 2", "3 − 2", "2 − 3"], "3 + 2", "Elle reçoit des crayons : la quantité augmente, donc on additionne.")
        ]
      }
    ],

    sciences: [
      {
        title: "Découvrir le milieu proche",
        one: "Le milieu proche est l’espace dans lequel l’enfant vit et se déplace souvent : la maison, l’école, la rue, le marché, la boutique, le centre de santé, l’atelier, les plantes et les animaux que l’on rencontre autour de soi.",
        two: "Observer son milieu, c’est identifier un lieu puis se demander à quoi il sert. L’école sert à apprendre ; le centre de santé sert à recevoir des soins ; le marché permet des échanges. Un même lieu peut contenir plusieurs personnes, objets et activités. Chercher la fonction d’un lieu développe la compréhension du monde réel.",
        example: "Exemple : au marché, on observe des vendeurs, des acheteurs, des produits et des échanges. Ces indices permettent de reconnaître la fonction du lieu.",
        ex: [
          q("Où va-t-on principalement pour apprendre avec un enseignant ?", ["à l’école", "au champ", "dans une rivière"], "à l’école", "L’école est un lieu organisé pour l’apprentissage."),
          q("Quel lieu est lié aux soins ?", ["le centre de santé", "le terrain de football", "la boutique de vêtements"], "le centre de santé", "On y trouve des professionnels et des services de santé."),
          q("Tu vois des étals, des vendeurs et des clients. Quel lieu reconnais-tu ?", ["un marché", "une chambre", "une classe vide"], "un marché", "On reconnaît un lieu grâce aux éléments et activités observés."),
          q("Pourquoi observe-t-on ce qu’on trouve dans un lieu ?", ["Pour comprendre sa fonction", "Pour répondre au hasard", "Pour changer son nom"], "Pour comprendre sa fonction", "Les indices du milieu permettent de raisonner sur l’usage d’un lieu.")
        ]
      },
      {
        title: "Vivant ou non vivant ?",
        one: "Une plante et un animal sont des êtres vivants. Ils naissent ou commencent leur vie, grandissent, ont besoin de ressources et finissent par mourir. Une pierre, une chaise ou une cuillère ne sont pas des êtres vivants.",
        two: "Il ne faut pas décider seulement parce qu’une chose bouge. Une voiture bouge mais elle ne grandit pas et ne se nourrit pas comme un être vivant. Une plante ne marche pas mais elle grandit. Pour classer, on utilise donc plusieurs indices et non une seule apparence.",
        example: "Exemple : la chèvre mange et grandit : elle est vivante. La pierre peut rouler si on la pousse, mais elle ne grandit pas : elle n’est pas vivante.",
        ex: [
          q("Lequel est vivant ?", ["la chèvre", "la pierre", "la chaise"], "la chèvre", "La chèvre est un animal : elle se nourrit, grandit et respire."),
          q("Lequel est une plante ?", ["le manguier", "la voiture", "la cuillère"], "le manguier", "Le manguier est un végétal vivant."),
          q("Une voiture bouge. Est-elle vivante ?", ["Non", "Oui, parce qu’elle bouge"], "Non", "Le mouvement seul ne suffit pas pour définir le vivant."),
          q("Quel indice aide le mieux à reconnaître un être vivant ?", ["Il grandit et a des besoins vitaux", "Il est toujours rouge", "Il est fabriqué en métal"], "Il grandit et a des besoins vitaux", "On utilise plusieurs caractéristiques du vivant.")
        ]
      },
      {
        title: "Le corps, les sens et l’hygiène",
        one: "Nos yeux servent à voir, nos oreilles à entendre, notre nez à sentir, notre langue à goûter et notre peau participe au toucher. Le corps doit aussi être protégé par des habitudes d’hygiène : se laver les mains, se brosser les dents et consommer une eau propre.",
        two: "Les sens nous donnent des informations. Si tu entends un klaxon sans voir la voiture, l’ouïe t’alerte. Si un aliment sent mauvais, l’odorat peut t’inciter à être prudent. Mais nos sens ne remplacent pas toujours l’aide d’un adulte ou d’un professionnel. L’intelligence consiste à utiliser l’information puis à prendre une décision sûre.",
        example: "Exemple : avant de manger une mangue, je la lave avec une eau propre. J’utilise mes yeux pour voir la saleté, puis j’agis pour réduire le risque.",
        ex: [
          q("Avec quoi entends-tu ?", ["les oreilles", "les pieds", "les cheveux"], "les oreilles", "Les oreilles sont les organes de l’audition."),
          q("Avant de manger, quelle habitude est utile ?", ["se laver les mains", "salir les mains", "toucher le sol puis manger"], "se laver les mains", "Le lavage des mains aide à réduire les microbes."),
          q("Une eau est visiblement sale. Que fais-tu ?", ["Je ne la bois pas et j’en parle à un adulte", "Je la bois vite", "Je la mélange au sable"], "Je ne la bois pas et j’en parle à un adulte", "Reconnaître un risque doit conduire à une décision prudente."),
          q("Tu sens une forte odeur de fumée sans voir le feu. Quel sens t’a donné l’alerte ?", ["l’odorat", "le goût", "la vue"], "l’odorat", "Le nez détecte des odeurs et peut fournir une information utile.")
        ]
      }
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
"""
once(old_subjects, new_subjects, 'bloc matieres')

old_build = """  function build(level, subject) {
    if (subject === 'maths') return maths(level);
    if (subject === 'francais') return francais(level);
    var bank = STATIC[subject] && STATIC[subject][level];
    if (bank) return bank.slice();
    return [];
  }
"""
new_build = """  function build(level, subject) {
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
    var html = '<section class=\"nx-px-hero\"><h2>' + esc(meta.name) + '</h2><p>Choisis une leçon. Nexora te l’explique de deux façons différentes avant de te proposer les exercices.</p></section><div class=\"nx-px-grid\">';
    lessons.forEach(function (lesson, i) {
      html += '<button type=\"button\" class=\"nx-px-card\" data-lesson=\"' + i + '\"><em>🧠</em><strong>' + esc(lesson.title) + '</strong><small>2 explications · ' + (lesson.ex || []).length + ' exercices corrigés</small></button>';
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
    main().innerHTML = '<section class=\"nx-px-question\">' +
      '<div class=\"nx-px-meta\"><span>Étape ' + (first ? '1' : '2') + ' / 3</span><span>Avant les exercices</span></div>' +
      '<h2 class=\"nx-px-q\">' + esc(title) + '</h2>' +
      '<h3 style=\"margin:0 0 12px;color:#173a63\">' + esc(lesson.title) + '</h3>' +
      '<p style=\"font-size:17px;line-height:1.65;margin:0\">' + esc(body) + '</p>' +
      (extra ? '<div class=\"nx-px-feedback ok\" style=\"margin-top:16px\"><b>💡 Exemple</b><span>' + esc(extra) + '</span></div>' : '') +
      '<button type=\"button\" class=\"nx-px-next\" ' + (first ? 'data-study-next' : 'data-start-exercises') + '>' +
      (first ? 'J’ai compris · Deuxième explication' : 'J’ai compris · Passer aux exercices') + '</button></section>';
  }

  function startCp1Exercises() {
    var lessons = CP1_LESSONS[state.subject] || [], lesson = lessons[state.lesson];
    if (!lesson) { renderCp1Lessons(state.subject); return; }
    state.phase = 3; state.readText = '';
    state.list = shuffle(lesson.ex || []); state.index = 0; state.good = 0; state.wrong = []; state.locked = false;
    if (!state.list.length) { renderCp1Lessons(state.subject); return; }
    renderQuestion();
  }
"""
once(old_build, new_build, 'moteur CP1')

old_event = """      var sj = ev.target.closest('[data-subject]'); if (sj) { startSubject(sj.getAttribute('data-subject')); return; }
      var ans = ev.target.closest('[data-answer]'); if (ans) { answer(ans.getAttribute('data-answer'), ans); return; }
"""
new_event = """      var lesson = ev.target.closest('[data-lesson]'); if (lesson) { startCp1Lesson(lesson.getAttribute('data-lesson')); return; }
      var studyNext = ev.target.closest('[data-study-next]'); if (studyNext) { state.phase = 2; renderCp1Explanation(); return; }
      var startEx = ev.target.closest('[data-start-exercises]'); if (startEx) { startCp1Exercises(); return; }
      var sj = ev.target.closest('[data-subject]'); if (sj) { startSubject(sj.getAttribute('data-subject')); return; }
      var ans = ev.target.closest('[data-answer]'); if (ans) { answer(ans.getAttribute('data-answer'), ans); return; }
"""
once(old_event, new_event, 'clics CP1')

once("var again = ev.target.closest('[data-again]'); if (again) { startSubject(state.subject); return; }",
     "var again = ev.target.closest('[data-again]'); if (again) { if (state.level === '1' && state.lesson >= 0) startCp1Exercises(); else startSubject(state.subject); return; }", 'refaire serie')

old_start = """  function startSubject(subject) {
    state.subject = subject;
    state.list = shuffle(build(state.level, subject));
    state.index = 0; state.good = 0; state.wrong = []; state.locked = false;
    if (!state.list.length) { renderSubjects(); return; }
    renderQuestion();
  }
"""
new_start = """  function startSubject(subject) {
    if (state.level === '1' && CP1_LESSONS[subject]) { renderCp1Lessons(subject); return; }
    state.subject = subject; state.lesson = -1; state.phase = 3; state.readText = '';
    state.list = shuffle(build(state.level, subject));
    state.index = 0; state.good = 0; state.wrong = []; state.locked = false;
    if (!state.list.length) { renderSubjects(); return; }
    renderQuestion();
  }
"""
once(old_start, new_start, 'demarrage matiere')

once("v.querySelector('[data-speak]').style.visibility = state.list.length && state.index < state.list.length ? 'visible' : 'hidden';",
     "v.querySelector('[data-speak]').style.visibility = (state.readText || (state.list.length && state.index < state.list.length)) ? 'visible' : 'hidden';", 'bouton lecture')

once("state.level = ''; state.subject = ''; state.list = []; state.index = 0;",
     "state.level = ''; state.subject = ''; state.lesson = -1; state.phase = 0; state.readText = ''; state.list = []; state.index = 0;", 'reset niveaux')

once("state.list = []; state.index = 0;\n    setHeader(l.label, 'Choisis une matière', true);",
     "state.subject = ''; state.lesson = -1; state.phase = 0; state.readText = ''; state.list = []; state.index = 0;\n    setHeader(l.label, 'Choisis une matière', true);", 'reset matieres')

once("var ex = state.list[state.index], meta = SUBJECTS[state.subject], l = LEVELS[state.level];\n    setHeader(meta.name, l.label, true);",
     "var ex = state.list[state.index], meta = SUBJECTS[state.subject], l = LEVELS[state.level];\n    state.readText = ex.q;\n    setHeader(meta.name, state.level === '1' && state.lesson >= 0 ? (CP1_LESSONS[state.subject][state.lesson].title) : l.label, true);", 'lecture question')

old_back = """  function goBack() {
    if (state.list.length) { state.list = []; state.index = 0; renderSubjects(); return; }
    if (state.level) { renderLevels(); return; }
    closeViewer();
  }
  function speakCurrent() {
    if (state.list.length && state.index < state.list.length) speak(state.list[state.index].q);
  }
"""
new_back = """  function goBack() {
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
"""
once(old_back, new_back, 'retour et lecture')

once("state.list = []; state.index = 0; state.level = ''; state.subject = '';",
     "state.list = []; state.index = 0; state.level = ''; state.subject = ''; state.lesson = -1; state.phase = 0; state.readText = '';", 'fermeture')

# Mettre le texte lu sur la correction après la réponse, sans dévoiler la réponse avant le choix.
needle = """    box.innerHTML = '<b>' + (ok ? '✅ Bonne réponse !' : '❌ Ce n’est pas la bonne réponse.') + '</b>' + (ok ? '' : 'Bonne réponse : <strong>' + esc(ex.a) + '</strong><br>') + (ex.why ? '<span>' + esc(ex.why) + '</span>' : '') + '<button type=\"button\" class=\"nx-px-next\" data-next>' + (state.index + 1 >= state.list.length ? 'Voir mon résultat' : 'Exercice suivant') + '</button>';
    speak(ok ? 'Bonne réponse. ' + ex.why : 'La bonne réponse est ' + ex.a + '. ' + ex.why);
"""
replacement = """    box.innerHTML = '<b>' + (ok ? '✅ Bonne réponse !' : '❌ Ce n’est pas la bonne réponse.') + '</b>' + (ok ? '' : 'Bonne réponse : <strong>' + esc(ex.a) + '</strong><br>') + (ex.why ? '<span>' + esc(ex.why) + '</span>' : '') + '<button type=\"button\" class=\"nx-px-next\" data-next>' + (state.index + 1 >= state.list.length ? 'Voir mon résultat' : 'Exercice suivant') + '</button>';
    state.readText = ok ? ('Bonne réponse. ' + ex.why) : ('La bonne réponse est ' + ex.a + '. ' + ex.why);
    speak(state.readText);
"""
once(needle, replacement, 'lecture correction')

path.write_text(s, encoding='utf-8')

version = Path('version.json')
version.write_text(json.dumps({
    'version': 'V601',
    'message': 'Nexora V601 : CP1, deux explications complementaires avant les exercices corriges, toutes les matieres fondamentales.',
    'critical': False
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('Migration CP1 V601 integree avec succes.')
