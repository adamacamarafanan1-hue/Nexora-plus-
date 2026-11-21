/* V746 — Assistant Nexora : réponses préparées (sans API), bouton flottant + discussion.
   Il répond à partir d'une base de connaissances écrite à la main et du catalogue réel
   (formations, livres, tarifs). Ce qu'il ne sait pas : il le dit, propose WhatsApp et
   note la question pour que la base s'enrichisse. */
(function () {
  'use strict';
  if (window.__nxAssistantV746) return;
  window.__nxAssistantV746 = true;

  var WA = '224620417383';
  var PHOTO = '/assets/img/adams-assistant.jpg';

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function fmt(n) { return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function client() {
    try {
      if (window.NexoraApp && typeof window.NexoraApp.ensureSupabaseClientReady === 'function') return window.NexoraApp.ensureSupabaseClientReady();
      return Promise.resolve(window.NexoraApp && window.NexoraApp.getSupabaseClient ? window.NexoraApp.getSupabaseClient() : null);
    } catch (_e) { return Promise.resolve(null); }
  }
  function rpc(n, a) {
    return client().then(function (sb) {
      if (!sb) throw new Error('CLIENT_ABSENT');
      return sb.rpc(n, a || {}).then(function (r) { if (r.error) throw r.error; return r.data; });
    });
  }

  /* ---------- Base de connaissances ---------- */
  var KB = [
    { id: 'salut', kw: ['bonjour', 'bonsoir', 'salut', 'coucou', 'hello', 'merci', 'qui es tu', 'tu es qui', 'ton nom', 'comment ca va'],
      a: 'Bonjour ! Je suis l’assistant virtuel de Nexora, créé par Adams. Je réponds aux questions sur les cours, les modules, les prix, l’abonnement, le défi KDO et Jeu Adams. Je ne suis pas une personne : mes réponses sont préparées à l’avance.',
      next: ['quoi', 'prix', 'kdo'] },
    { id: 'quoi', kw: ['c est quoi nexora', 'nexora c est quoi', 'qu est ce que nexora', 'presentation', 'presenter nexora', 'a quoi sert', 'que propose nexora', 'nexora'],
      a: 'Nexora est une plateforme éducative guinéenne, créée par Adama Camara (Adams), fondateur du CAFI à Lambanyi, Conakry. Elle regroupe : l’<b>Espace élèves</b> (maternelle, primaire, collège, lycée, sujets du BAC et du Brevet, romans), l’<b>Espace professionnel</b> (22 modules de formation), le défi <b>KDO</b> avec des cadeaux chaque semaine, et <b>Jeu Adams</b>, les jeux de plateau éducatifs.',
      next: ['espaces', 'prix', 'kdo'] },
    { id: 'espaces', kw: ['espace eleve', 'espace professionnel', 'deux espaces', 'espaces', 'espace pro', 'eleve ou pro', 'difference eleve pro'],
      a: 'Nexora a deux espaces :<br>• <b>Espace élèves</b> : tous les cours de l’école (maternelle, primaire, collège, lycée), les sujets du BAC et du Brevet, les romans.<br>• <b>Espace professionnel</b> : 22 modules de formation pour les adultes (emploi, entreprise, numérique, santé, etc.).<br>Tu choisis la porte qui te concerne sur l’écran d’accueil.',
      next: ['formations', 'primaire', 'prix'] },
    { id: 'maternelle', kw: ['maternelle', 'petite section', 'moyenne section', 'grande section', 'atelier creatif', 'tout petit'],
      a: 'La <b>maternelle</b> (petite, moyenne et grande section) se trouve dans l’Espace élèves. Elle contient un atelier créatif avec 7 activités classées en 3 familles : la main (dessin libre, dessin guidé, montage), la voix (chant, lecture) et les signes (écriture, découverte), avec l’âge conseillé pour chacune.',
      next: ['primaire', 'espaces'] },
    { id: 'primaire', kw: ['primaire', 'cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'ecole primaire', '1ere annee', '2eme annee', '3eme annee', '4eme annee', '5eme annee', '6eme annee'],
      a: 'Le <b>primaire</b> couvre 6 classes : CP1, CP2, CE1, CE2, CM1 et CM2. Les matières sont regroupées en 4 domaines : lire, dire et écrire ; compter et raisonner ; découvrir le monde ; vivre ensemble et s’exprimer. Chaque leçon est faite pour l’élève et le parent : une consigne claire (« Ce qu’il faut faire »), des étapes, un exemple, un exercice et une correction, avec des définitions des mots importants.',
      next: ['college', 'maternelle', 'prix'] },
    { id: 'college', kw: ['college', '7eme', '8eme', '9eme', '10eme', 'septieme', 'huitieme', 'neuvieme', 'dixieme', 'brevet'],
      a: 'Le <b>collège</b> couvre la 7ème, la 8ème, la 9ème et la 10ème année (qui prépare le Brevet), selon le programme guinéen. Tu les trouves dans l’Espace élèves. Les leçons ont une structure claire : objectif, cours, exemple, méthode, exercice et correction.',
      next: ['sujets', 'lycee', 'prix'] },
    { id: 'lycee', kw: ['lycee', '11eme', '12eme', 'terminale', 'onzieme', 'douzieme', 'sciences sociales', 'sciences mathematiques', 'sciences experimentales', 'philosophie'],
      a: 'Le <b>lycée</b> couvre la 11ème, la 12ème et la Terminale, avec les trois options (sciences sociales, sciences mathématiques, sciences expérimentales). Chaque leçon suit une même structure : objectif, cours, notions essentielles, exemple, méthode, exercice, correction guidée et « à retenir ».',
      next: ['sujets', 'college', 'prix'] },
    { id: 'sujets', kw: ['sujet', 'sujets', 'bac', 'baccalaureat', 'examen', 'annales', 'sujet du bac', 'sujet du brevet'],
      a: 'La rubrique <b>Sujets BAC et Brevet</b> propose, pour le BAC (français et philosophie) et le Brevet (français), 30 sujets par catégorie. Tu peux chercher un sujet, filtrer ceux à traiter ou déjà traités, suivre ton avancement et lire la méthode en 4 étapes avant de commencer.',
      next: ['lycee', 'college', 'prix'] },
    { id: 'romans', kw: ['roman', 'romans', 'lecture', 'livre scolaire', 'oeuvre', 'resume du roman'],
      a: 'La rubrique <b>Romans</b> de l’Espace élèves présente des œuvres avec leur fiche et leur résumé, que tu peux ouvrir ou masquer, et des commentaires. Pour les livres sur l’intelligence artificielle, c’est la bibliothèque <b>Livria</b>.',
      next: ['livres', 'sujets'] },
    { id: 'ia', kw: ['intelligence artificielle', 'themes ia', 'theme ia', 'cours ia', 'formation ia', 'apprendre l ia', 'claude', 'chatgpt', 'prompt', 'prompts'],
      a: 'Pour l’<b>intelligence artificielle</b>, Nexora a : le module <b>« Intelligence artificielle (thèmes IA) »</b> dans l’Espace professionnel, et une bibliothèque de livres IA (<b>Livria</b>) : Initiation à l’IA, Maîtriser Claude, Créer ses agents IA, L’IA pour les entrepreneurs, L’IA au service de l’éducation, Réussir ses études avec l’IA, Trouver un emploi avec l’IA, et d’autres. Adams, le créateur de Nexora, est formateur en IA.',
      next: ['formations', 'livres'] },
    { id: 'formations', kw: ['formation', 'formations', 'module', 'modules', 'espace professionnel', 'professionnel', '22 modules', 'liste des modules', 'cours pro'],
      a: function (cat) {
        var f = (cat || []).filter(function (c) { return c.type === 'formation'; }).map(function (c) { return c.titre; });
        if (!f.length) f = ['Citoyenneté', 'Communication', 'Création d’entreprise', 'Culture générale', 'Développement personnel', 'Éducation financière', 'Employabilité', 'Entrepreneuriat', 'Gestion de projet', 'Hygiène', 'Innovation', 'Intelligence artificielle (thèmes IA)', 'Leadership', 'Marketing digital', 'Orientation et éthique', 'Premiers secours', 'Préparation à l’emploi', 'Prise de parole', 'Rédaction professionnelle', 'Santé', 'Sécurité au travail', 'Sécurité numérique'];
        return 'L’<b>Espace professionnel</b> contient ' + f.length + ' modules, chacun avec 10 thèmes :<br>' + f.map(function (t) { return '• ' + esc(t); }).join('<br>') + '<br><br>Écris le nom d’un module pour en savoir plus.';
      }, next: ['prix', 'ia', 'kdo'] },
    { id: 'livres', kw: ['livre', 'livres', 'livria', 'bibliotheque', 'ebook', 'lire un livre'],
      a: function (cat) {
        var l = (cat || []).filter(function (c) { return c.type === 'livre'; }).map(function (c) { return c.titre; });
        if (!l.length) return '<b>Livria</b> est la bibliothèque numérique de livres sur l’IA de Nexora. Demande-moi un titre pour avoir sa description.';
        return '<b>Livria</b>, la bibliothèque numérique de livres sur l’IA, propose ' + l.length + ' livres :<br>' + l.map(function (t) { return '• ' + esc(t); }).join('<br>') + '<br><br>Écris le titre d’un livre pour voir sa description.';
      }, next: ['kdo', 'ia'] },
    { id: 'prix', kw: ['prix', 'tarif', 'tarifs', 'combien', 'cout', 'coute', 'abonnement prix', 'formule', 'formules', 'mensuel', 'par mois', 'cher', 'gratuit', 'payant'],
      a: function () {
        return rpc('nexora_subscription_catalog', {}).then(function (d) {
          var p = (d && d.plans) || [];
          var el = p.filter(function (x) { return x.product_code === 'eleves'; });
          if (!el.length) throw new Error('vide');
          var lignes = el.map(function (x) { return '• ' + esc(x.label) + ' : <b>' + fmt(x.total_gnf) + ' GNF</b>' + (x.badge ? ' (' + esc(x.badge) + ')' : ''); }).join('<br>');
          return 'Les formules d’abonnement Nexora :<br>' + lignes + '<br>Les tarifs sont les mêmes pour l’Espace élèves et l’Espace professionnel. Le paiement se fait par Orange Money.<br>Le défi KDO est <b>gratuit</b>. Jeu Adams : 90 000 GNF par mois pour les 18 jeux, le Jeu Guinée est gratuit.';
        }).catch(function () {
          return 'Abonnement Nexora : <b>1 mois 60 000 GNF</b>, <b>3 mois 150 000 GNF</b>, <b>année scolaire (9 mois) 360 000 GNF</b>. Paiement par Orange Money. Le défi KDO est gratuit. Jeu Adams : 90 000 GNF par mois pour les 18 jeux, le Jeu Guinée est gratuit.';
        });
      }, next: ['paiement', 'kdo', 'jeuadams'] },
    { id: 'paiement', kw: ['comment payer', 'comment je paye', 'je veux payer', 'payer', 'paye', 'paiement', 'orange money', 'abonner', 'abonnement', 's abonner', 'souscrire', 'activer mon compte', 'numero pour payer'],
      a: 'Pour t’abonner :<br>1. Choisis ta formule dans l’écran d’abonnement.<br>2. Envoie le montant par <b>Orange Money</b> au numéro <b>620 41 73 83</b> (affiché dans l’application).<br>3. Entre le numéro Orange Money <b>qui a payé</b>, puis appuie sur « J’ai payé ».<br>4. Ton paiement est vérifié, et ton accès s’ouvre dès la confirmation, en général en quelques minutes.<br>Ne paie jamais à un autre numéro que celui affiché dans l’application.',
      next: ['pasacces', 'prix', 'securite'] },
    { id: 'pasacces', kw: ['j ai paye', 'deja paye', 'pas d acces', 'acces bloque', 'toujours bloque', 'pas valide', 'paiement non valide', 'cours ne s ouvrent pas', 'ne s ouvre pas', 'ne marche pas', 'bloque', 'abonnement actif', 'redemande l abonnement', 'impossible d ouvrir'],
      a: 'Si tu as payé et que tu n’as pas encore accès :<br>• Attends quelques minutes : le paiement est vérifié avant d’ouvrir l’accès.<br>• Ferme complètement Nexora, rouvre-le avec une bonne connexion, puis reconnecte-toi avec <b>le même numéro</b> que celui du compte abonné.<br>• Si les cours ne s’ouvrent toujours pas, ou si tu as payé depuis plus d’une heure, écris-nous sur WhatsApp avec le numéro qui a payé et l’heure du paiement.',
      whatsapp: true, next: ['paiement', 'contact'] },
    { id: 'compte', kw: ['creer un compte', 'creer mon compte', 'inscription', 'inscrire', 's inscrire', 'nouveau compte', 'ouvrir un compte', 'me connecter', 'connexion', 'se connecter'],
      a: 'Pour créer ton compte : entre ton <b>prénom et nom</b>, ton <b>numéro de téléphone</b> et choisis un <b>code secret à 6 chiffres</b>, puis retape-le. Pour te reconnecter, utilise le même numéro et le même code. Les anciens comptes gardent leur code à 4 chiffres. À l’inscription, un <b>code de récupération</b> t’est donné : note-le ou prends-le en capture, il te servira si tu oublies ton code.',
      next: ['codeoublie', 'securite'] },
    { id: 'codeoublie', kw: ['code oublie', 'oublie mon code', 'mot de passe oublie', 'oublie mon mot de passe', 'retrouver mon compte', 'code de recuperation', 'recuperer mon compte', 'perdu mon code', 'code secret'],
      a: 'Si tu as oublié ton code secret : sur l’écran de connexion, touche <b>« Retrouver mon compte »</b>, entre ton numéro, ton <b>code de récupération</b> (reçu à l’inscription) et choisis un nouveau code à 6 chiffres. Après 5 essais incorrects, il faut attendre 1 heure. Si tu n’as plus ton code de récupération, écris-nous sur WhatsApp.',
      whatsapp: true, next: ['changercode', 'securite'] },
    { id: 'changercode', kw: ['changer mon code', 'changer le code', 'modifier mon code', 'nouveau code'],
      a: 'Ton compte est le même pour Nexora et pour Jeu Adams. Pour changer ton code secret : ouvre <b>Jeu Adams</b>, connecte-toi et touche le bouton <b>🔑 Code</b> en haut. Choisis un nouveau code à 6 chiffres. Utilise-le ensuite pour te connecter à Nexora aussi.',
      next: ['codeoublie', 'securite'] },
    { id: 'kdo', kw: ['kdo', 'defi', 'defi kdo', 'concours', 'quiz', 'jouer au kdo', 'participer'],
      a: 'Le <b>défi KDO</b> est un quiz <b>gratuit</b> : 50 questions dans la matière de ton choix (maths, français, histoire, géographie, physique, chimie, SVT, anglais, culture générale). Les réponses sont corrigées par le serveur. Tu ne peux participer qu’une seule fois par défi : pour rejouer, il faut attendre le défi suivant. Chaque semaine, les meilleurs scores gagnent des cadeaux.',
      next: ['cadeaux', 'prix'] },
    { id: 'cadeaux', kw: ['cadeau', 'cadeaux', 'gagner', 'gagnant', 'classement', 'recompense', 'prix a gagner', 'livre gratuit', 'formation gratuite'],
      a: 'Chaque semaine, <b>deux cadeaux</b> sont à gagner avec le défi KDO : le <b>1er</b> du classement gagne <b>un livre IA</b> (au choix dans Livria) et le <b>2e</b> gagne <b>une formation</b> de l’Espace professionnel. Le classement va du lundi au dimanche, et à score égal, le plus rapide gagne. Le gagnant est contacté, puis le cadeau lui est remis.',
      next: ['kdo', 'livres', 'formations'] },
    { id: 'jeuadams', kw: ['jeu adams', 'jeux adams', 'jeu de plateau', 'plateau', 'jeu guinee', 'jeux educatifs', 'adams app', 'jeux'],
      a: function () {
        return rpc('jeuadams_infos_paiement', {}).then(function (d) {
          var m = d && d.amount_gnf ? fmt(d.amount_gnf) + ' GNF' : '90 000 GNF';
          return 'Jeu Adams est une collection de <b>18 jeux de plateau éducatifs</b>. Le <b>Jeu Guinée est gratuit</b> et illimité. Les 17 autres jeux sont débloqués avec un abonnement de <b>' + m + ' par mois</b>, payé par Orange Money. Tu peux y jouer sur <b>jeu-adams.vercel.app</b>, avec le même compte que Nexora.';
        }).catch(function () {
          return 'Jeu Adams est une collection de <b>18 jeux de plateau éducatifs</b>. Le <b>Jeu Guinée est gratuit</b>. Les 17 autres jeux sont débloqués avec un abonnement de <b>90 000 GNF par mois</b> (Orange Money). Adresse : jeu-adams.vercel.app, avec le même compte que Nexora.';
        });
      }, next: ['paiement', 'compte'] },
    { id: 'installer', kw: ['installer', 'installation', 'telecharger', 'application', 'ecran d accueil', 'play store', 'ajouter a l ecran', 'telephone'],
      a: 'Pour installer Nexora sur ton téléphone : ouvre le site <b>nexora-plus-beta.vercel.app</b> dans Chrome, puis le menu (⋮) et <b>« Installer l’application »</b> ou <b>« Ajouter à l’écran d’accueil »</b>. Sur iPhone, utilise Safari, le bouton Partager, puis « Sur l’écran d’accueil ».',
      next: ['pasacces', 'compte'] },
    { id: 'securite', kw: ['securite', 'arnaque', 'pirate', 'piratage', 'faux', 'fraude', 'protege', 'confidentialite', 'donnees', 'vol de compte'],
      a: 'Quelques règles simples : <b>ne donne jamais ton code secret</b> à personne, même à quelqu’un qui dit travailler pour Nexora ; paie uniquement au numéro affiché dans l’application ; garde ton code de récupération en lieu sûr ; méfie-toi des messages qui te demandent de payer en urgence. Si tu penses que ton compte est piraté, écris-nous sur WhatsApp.',
      whatsapp: true, next: ['codeoublie', 'paiement'] },
    { id: 'apporteur', kw: ['apporteur', 'apporteur d affaires', 'commission', 'gagner de l argent', 'devenir partenaire', 'parrainage', 'parrain', 'amener des clients', 'revendeur'],
      a: 'Tu peux devenir <b>apporteur d’affaires</b> de Nexora : tu amènes des clients avec ton lien personnel, et tu reçois <b>25 %</b> du premier paiement de chaque client, versé une seule fois. Pour en devenir un, écris-nous sur WhatsApp.',
      whatsapp: true, next: ['contact'] },
    { id: 'ecole', kw: ['etablissement', 'licence', 'directeur d ecole', 'pour mon ecole', 'pour mon entreprise', 'pour ma famille', 'groupe', 'ong', 'plusieurs personnes', 'offre pour ecole'],
      a: 'Pour une <b>école, une famille, une ONG ou une entreprise</b>, avec plusieurs personnes à inscrire, il n’y a pas de code d’école : chacun crée son compte et s’abonne. Pour une offre pour un groupe, écris-nous sur WhatsApp et Adams te répondra.',
      whatsapp: true, next: ['prix', 'contact'] },
    { id: 'legal', kw: ['conditions', 'cgu', 'conditions d utilisation', 'politique de confidentialite', 'mentions legales', 'vie privee'],
      a: 'Les <b>conditions d’utilisation</b> et la <b>politique de confidentialité</b> de Nexora sont dans la rubrique légale de l’application. Tu les acceptes aussi en créant ton compte.',
      next: ['securite'] },
    { id: 'contact', kw: ['contact', 'contacter', 'whatsapp', 'telephone', 'numero', 'joindre', 'aide', 'assistance', 'support', 'parler a quelqu un', 'adams', 'cafi'],
      a: 'Tu peux joindre l’équipe Nexora sur <b>WhatsApp au +224 620 41 73 83</b>. Nexora est créé par Adama Camara (Adams), fondateur du CAFI (Centre Africain de Formation et d’Innovation) à Lambanyi, Conakry.',
      whatsapp: true, next: ['pasacces', 'prix'] }
  ];
  var STOP = { de: 1, la: 1, le: 1, l: 1, les: 1, des: 1, d: 1, et: 1, son: 1, ses: 1, avec: 1, au: 1, aux: 1, du: 1, un: 1, une: 1, a: 1, pour: 1, en: 1, sur: 1 };
  var LABELS = { quoi: 'C’est quoi Nexora ?', espaces: 'Les deux espaces', prix: 'Les prix', kdo: 'Le défi KDO', paiement: 'Comment payer ?', pasacces: 'J’ai payé, pas d’accès', formations: 'Les 22 modules', livres: 'Les livres IA', jeuadams: 'Jeu Adams', primaire: 'Le primaire', college: 'Le collège', lycee: 'Le lycée', sujets: 'Sujets BAC et Brevet', cadeaux: 'Les cadeaux', compte: 'Créer un compte', codeoublie: 'Code oublié', securite: 'Sécurité', contact: 'Contacter l’équipe', ia: 'L’IA', maternelle: 'Maternelle', changercode: 'Changer mon code' };

  /* ---------- Recherche ---------- */
  function tokens(s) { return norm(s).split(' ').filter(Boolean); }
  function qMatch(qt, phrase) {
    var pt = tokens(phrase);
    if (!pt.length) return 0;
    for (var i = 0; i < pt.length; i++) {
      var p = pt[i], ok = false;
      for (var j = 0; j < qt.length; j++) {
        var t = qt[j];
        if (t === p || (p.length >= 5 && t.indexOf(p) === 0) || (t.length >= 5 && p.indexOf(t) === 0 && p.length - t.length <= 2)) { ok = true; break; }
      }
      if (!ok) return 0;
    }
    return 1 + pt.length;
  }
  function chercher(question, cat) {
    var qt = tokens(question), meilleur = null, sc = 0;
    if (!qt.length) return null;
    KB.forEach(function (e) {
      var s = 0;
      e.kw.forEach(function (k) { s += qMatch(qt, k); });
      if (s > sc) { sc = s; meilleur = { type: 'kb', e: e }; }
    });
    (cat || []).forEach(function (c) {
      var tt = tokens(c.titre).filter(function (w) { return !STOP[w]; });
      if (!tt.length) return;
      if (tt.length === 1 && tt[0].length < 5) return;
      var all = tt.every(function (w) { return qMatch(qt, w) > 0; });
      if (!all) return;
      var s = 4 + tt.length * 2;
      if (s > sc) { sc = s; meilleur = { type: 'cat', c: c }; }
    });
    return sc >= 2 ? meilleur : null;
  }
  function reponseCat(c) {
    if (c.type === 'formation') {
      return '<b>' + esc(c.titre) + '</b> est un module de l’<b>Espace professionnel</b> de Nexora. Il contient 10 thèmes, et chaque thème a ses objectifs, un développement, les erreurs à éviter et une question. Pour l’ouvrir : Espace professionnel, puis ce module. Il faut un abonnement actif.';
    }
    return '<b>' + esc(c.titre) + '</b><br>' + esc(c.description) + (/…|\.\.\.$/.test(c.description) ? '…' : '') + '<br><br>Ce livre fait partie de <b>Livria</b>, la bibliothèque de livres IA de Nexora. Le 1er du classement KDO de la semaine peut en choisir un comme cadeau. Pour les conditions d’accès à ce livre, écris-nous sur WhatsApp.';
  }

  /* ---------- Interface ---------- */
  var cat = null, catPris = false, ouvert = false, zone, bouton, panneau, saisie, puces, deja = false;

  function chargerCat() {
    if (catPris) return; catPris = true;
    rpc('nx_cadeaux_catalogue_public', {}).then(function (d) { cat = d || []; }).catch(function () { cat = []; catPris = false; });
  }
  function styles() {
    if (document.getElementById('nxaStyle')) return;
    var s = document.createElement('style'); s.id = 'nxaStyle';
    s.textContent =
      '.nxa-btn{position:fixed;right:14px;bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:9000;display:flex;align-items:center;gap:8px;padding:5px 14px 5px 5px;border:0;border-radius:999px;background:#16324F;color:#fff;font:800 14px/1 system-ui,sans-serif;box-shadow:0 6px 20px rgba(10,20,35,.35);cursor:pointer}' +
      '.nxa-btn,.nxa-btn[hidden]{display:none!important}' +
      '@media(min-width:900px){.nxa-btn{bottom:24px;right:24px}}' +
      '.nxa-av{width:40px;height:40px;border-radius:50%;background:#C9862F;color:#fff;display:flex;align-items:center;justify-content:center;font:800 18px/1 system-ui,sans-serif;overflow:hidden;flex:0 0 auto;object-fit:cover}' +
      '.nxa-p{position:fixed;inset:0;z-index:2147481100;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,20,35,.55)}' +
      '.nxa-p[hidden]{display:none}' +
      '.nxa-box{width:100%;max-width:520px;height:min(86vh,680px);display:flex;flex-direction:column;background:#EDEFF2;border-radius:18px 18px 0 0;overflow:hidden;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#21252B}' +
      '@media(min-width:640px){.nxa-p{align-items:center}.nxa-box{border-radius:18px}}' +
      '.nxa-h{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#16324F;color:#fff}' +
      '.nxa-h .nxa-av{width:46px;height:46px;font-size:20px}' +
      '.nxa-h>div:not(.nxa-av){min-width:0;flex:1}.nxa-h b{display:block;font-size:16px}.nxa-h small{display:block;font-size:12px;opacity:.85;line-height:1.3}' +
      '.nxa-x{width:40px;height:40px;border:0;border-radius:8px;background:rgba(255,255,255,.16);color:#fff;font-size:18px;cursor:pointer}' +
      '.nxa-m{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px}' +
      '.nxa-b{max-width:88%;padding:10px 13px;border-radius:14px;font-size:14.5px;line-height:1.55;word-wrap:break-word}' +
      '.nxa-b.bot{align-self:flex-start;background:#fff;border:1px solid #D5D9DF;border-bottom-left-radius:4px}' +
      '.nxa-b.moi{align-self:flex-end;background:#1E5FA9;color:#fff;border-bottom-right-radius:4px}' +
      '.nxa-pu{display:flex;flex-wrap:nowrap;gap:7px;padding:2px 12px 8px;overflow-x:auto;-webkit-overflow-scrolling:touch}.nxa-pu:empty{display:none}.nxa-pu button{flex:0 0 auto;white-space:nowrap}' +
      '.nxa-pu button,.nxa-wa{border:1px solid #1E5FA9;background:#fff;color:#1E5FA9;border-radius:999px;padding:8px 12px;font:700 13px/1.2 inherit;font-family:inherit;cursor:pointer;text-decoration:none;display:inline-block}' +
      '.nxa-wa{background:#2F6B4A;border-color:#2F6B4A;color:#fff;margin-top:8px}' +
      '.nxa-f{display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #D5D9DF}' +
      '.nxa-f input{flex:1;min-width:0;padding:12px;border:1.5px solid #C6CBD2;border-radius:12px;font-size:16px;font-family:inherit}' +
      '.nxa-f button{border:0;border-radius:12px;background:#1E5FA9;color:#fff;padding:0 16px;font:800 15px/1 inherit;font-family:inherit;cursor:pointer}' +
      '.nxa-n{padding:0 14px 6px;font-size:11.5px;color:#5F656C;text-align:center}';
    document.head.appendChild(s);
  }
  function avatar(grand) {
    var d = document.createElement('div'); d.className = 'nxa-av';
    var img = document.createElement('img'); img.alt = ''; img.src = PHOTO; img.style.cssText = 'width:100%;height:100%;object-fit:cover';
    img.onerror = function () { d.textContent = 'A'; };
    d.appendChild(img); return d;
  }
  function bulle(html, qui) {
    var b = document.createElement('div'); b.className = 'nxa-b ' + qui;
    if (qui === 'moi') b.textContent = html; else b.innerHTML = html;
    zone.appendChild(b); zone.scrollTop = zone.scrollHeight; return b;
  }
  function pucesDe(ids) {
    puces.innerHTML = '';
    (ids || []).forEach(function (id) {
      if (!LABELS[id]) return;
      var b = document.createElement('button'); b.type = 'button'; b.textContent = LABELS[id];
      b.onclick = function () { poser(LABELS[id], id); };
      puces.appendChild(b);
    });
    setTimeout(function () { zone.scrollTop = zone.scrollHeight; }, 30);
  }
  function noter(q, trouve) { try { rpc('nx_assistant_noter', { p_question: q, p_trouve: !!trouve }).catch(function () {}); } catch (_e) {} }
  function wa(texte) { return '<br><a class="nxa-wa" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(texte || 'Bonjour, j’ai une question sur Nexora.') + '">Écrire sur WhatsApp</a>'; }

  function repondre(e, question) {
    var a = e.a, p = typeof a === 'function' ? a(cat) : a;
    return Promise.resolve(p).then(function (html) {
      bulle(html + (e.whatsapp ? wa('Bonjour, ma question : ' + question) : ''), 'bot');
      pucesDe(e.next);
    });
  }
  function poser(question, forceId) {
    question = String(question || '').trim().slice(0, 300);
    if (!question) return;
    bulle(question, 'moi');
    puces.innerHTML = '';
    var t = bulle('…', 'bot');
    var trouve = null;
    if (forceId) { for (var i = 0; i < KB.length; i++) if (KB[i].id === forceId) trouve = { type: 'kb', e: KB[i] }; }
    else trouve = chercher(question, cat);
    t.remove();
    if (!trouve) {
      bulle('Je n’ai pas la réponse à cette question dans ce que je sais. Tu peux la reformuler avec d’autres mots, choisir un sujet ci-dessous, ou écrire à l’équipe sur WhatsApp.' + wa('Bonjour, ma question : ' + question), 'bot');
      pucesDe(['quoi', 'prix', 'paiement', 'kdo', 'formations', 'jeuadams']);
      if (!forceId) noter(question, false);
      return;
    }
    if (!forceId) noter(question, true);
    if (trouve.type === 'cat') {
      bulle(reponseCat(trouve.c), 'bot');
      pucesDe(trouve.c.type === 'formation' ? ['prix', 'formations', 'kdo'] : ['livres', 'cadeaux', 'prix']);
    } else repondre(trouve.e, question);
  }
  function monter() {
    if (deja) return; deja = true;
    styles(); chargerCat();
    bouton = document.createElement('button'); bouton.type = 'button'; bouton.className = 'nxa-btn'; bouton.setAttribute('aria-label', 'Ouvrir l’assistant Nexora');
    bouton.appendChild(avatar()); var tx = document.createElement('span'); tx.textContent = 'Assistant'; bouton.appendChild(tx);
    panneau = document.createElement('div'); panneau.className = 'nxa-p'; panneau.hidden = true; panneau.setAttribute('role', 'dialog'); panneau.setAttribute('aria-label', 'Assistant Nexora');
    var box = document.createElement('div'); box.className = 'nxa-box';
    var h = document.createElement('div'); h.className = 'nxa-h'; h.appendChild(avatar());
    var ti = document.createElement('div'); ti.innerHTML = '<b>Assistant Nexora</b><small>Créé par Adams · réponses préparées à l’avance</small>'; h.appendChild(ti);
    var x = document.createElement('button'); x.type = 'button'; x.className = 'nxa-x'; x.textContent = '✕'; x.setAttribute('aria-label', 'Fermer'); h.appendChild(x);
    zone = document.createElement('div'); zone.className = 'nxa-m';
    puces = document.createElement('div'); puces.className = 'nxa-pu';
    var note = document.createElement('div'); note.className = 'nxa-n'; note.textContent = 'Je ne suis pas une personne : vérifie les informations importantes.';
    var f = document.createElement('form'); f.className = 'nxa-f';
    saisie = document.createElement('input'); saisie.type = 'text'; saisie.maxLength = 300; saisie.placeholder = 'Pose ta question…'; saisie.setAttribute('autocomplete', 'off'); saisie.enterKeyHint = 'send';
    var env = document.createElement('button'); env.type = 'submit'; env.textContent = 'Envoyer';
    f.appendChild(saisie); f.appendChild(env);
    box.appendChild(h); box.appendChild(zone); box.appendChild(puces); box.appendChild(note); box.appendChild(f);
    panneau.appendChild(box);
    document.body.appendChild(bouton); document.body.appendChild(panneau);
    function ouvrir() {
      panneau.hidden = false; ouvert = true; chargerCat();
      if (!zone.children.length) {
        bulle('Bonjour ! Je suis l’assistant virtuel de Nexora. Pose-moi une question sur les cours, les modules, les prix, l’abonnement, le défi KDO ou Jeu Adams.', 'bot');
        pucesDe(['quoi', 'prix', 'paiement', 'kdo', 'formations', 'jeuadams']);
      }
      setTimeout(function () { try { saisie.focus(); } catch (_e) {} }, 150);
    }
    function fermer() { panneau.hidden = true; ouvert = false; }
    bouton.onclick = ouvrir; x.onclick = fermer;
    panneau.addEventListener('click', function (ev) { if (ev.target === panneau) fermer(); });
    f.addEventListener('submit', function (ev) { ev.preventDefault(); var v = saisie.value; saisie.value = ''; poser(v); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && ouvert) fermer(); });
    /* le bouton se cache tant que l'écran d'entrée ou une fenêtre de compte est visible */
    setInterval(function () {
      var gate = document.getElementById('welcomeGate'), modal = document.getElementById('accountModal');
      var vu = function (el) { return !!(el && el.offsetParent !== null && !el.hidden && getComputedStyle(el).visibility !== 'hidden'); };
      bouton.hidden = ouvert ? true : (vu(gate) || vu(modal));
    }, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter); else monter();

  /* exposé pour les tests */
  window.__nxAssistantTest = { chercher: chercher, norm: norm, KB: KB };
})();
