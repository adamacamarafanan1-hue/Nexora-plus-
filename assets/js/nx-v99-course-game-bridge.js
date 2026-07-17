
(function(){
  'use strict';
  var CONTEXT_KEY='nexora_course_game_context_v1';
  var CONTEXT_MAX_AGE=6*60*60*1000;
  var ALLOWED_GAMES=['preuniv','maternelle','ecole','7e','8e','9e','10e','11e','12e','terminale','univ','pro','sport','guinee','sante','musique','art','histoire'];
  var FALLBACK={
    'leadership':'pro','entrepreneuriat':'pro','ia':'univ','communication':'pro','gestion-projet':'pro','marketing-digital':'pro','developpement-personnel':'pro','education-financiere':'pro','employabilite':'pro','redaction-pro':'pro','prise-parole':'pro','innovation':'univ','citoyennete':'guinee','culture-generale':'guinee','securite-numerique':'univ','sante':'sante','hygiene':'sante','securite-travail':'sante','premiers-secours':'sante','creation-entreprise':'pro','orientation-ethique':'pro','preparation-emploi':'pro',
    'mathématiques':'10e','mathematiques':'10e','français':'10e','francais':'10e','physique':'10e','chimie':'10e','biologie':'10e','svt':'10e','histoire':'histoire','géographie':'guinee','geographie':'guinee','ecm':'guinee','anglais':'10e','informatique':'univ'
  };
  var GAME_TITLES={preuniv:'Jeu Adams Préuniversitaire',maternelle:'Jeu Adams Maternelle',ecole:'Jeu Adams École','7e':'Jeu Adams 7ème','8e':'Jeu Adams 8ème','9e':'Jeu Adams 9ème','10e':'Jeu Adams 10ème','11e':'Jeu Adams 11ème','12e':'Jeu Adams 12ème',terminale:'Jeu Adams Terminale',univ:'Jeu Adams Université',pro:'Jeu Adams Professionnel',sport:'Jeu Adams Sport',guinee:'Jeu Adams Guinée',sante:'Jeu Adams Santé',musique:'Jeu Adams Musique',art:'Jeu Adams Art',histoire:'Jeu Adams Histoire'};
  function normalize(v){return String(v||'').trim().toLowerCase();}
  function getClient(){try{return window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function'?window.NexoraApp.getSupabaseClient():null;}catch(_e){return null;}}
  function notify(message){try{if(typeof window.toast==='function'){window.toast(message);return;}}catch(_e){}try{console.info('[Nexora cours-jeu]',message);}catch(_e){}}
  function saveContext(ctx){try{localStorage.setItem(CONTEXT_KEY,JSON.stringify(ctx||{}));}catch(_e){}}
  function readContext(){try{var x=JSON.parse(localStorage.getItem(CONTEXT_KEY)||'{}')||{};if(!x.started_at||Date.now()-Number(x.started_at)>CONTEXT_MAX_AGE)return null;return x;}catch(_e){return null;}}
  function clearContext(){try{localStorage.removeItem(CONTEXT_KEY);}catch(_e){}}
  function inferGame(courseKey,courseTitle){
    var key=normalize(courseKey),title=normalize(courseTitle),all=key+' '+title;
    if(FALLBACK[key])return FALLBACK[key];
    var direct=Object.keys(FALLBACK).find(function(k){return all.indexOf(k)>-1;});if(direct)return FALLBACK[direct];
    if(/sant|hygi|secour|hse|sécurité au travail/.test(all))return 'sante';
    if(/histoire|mémoire|decolon|décolon/.test(all))return 'histoire';
    if(/guinée|guinee|citoy|droit|géograph|ecm/.test(all))return 'guinee';
    if(/informat|numéri|numeri|intelligence artificielle|\bia\b|univers/.test(all))return 'univ';
    if(/sport|football|athl/.test(all))return 'sport';
    if(/musique|chant|instrument/.test(all))return 'musique';
    if(/art|dessin|peinture|création visuelle/.test(all))return 'art';
    return 'pro';
  }
  async function serverLink(courseKey,courseTitle,courseType){
    var c=getClient();if(!c||typeof c.rpc!=='function')return null;
    try{
      var r=await c.rpc('nexora_course_game_link_for_course',{p_course_key:String(courseKey||'')});
      if(r&&r.error)throw r.error;var d=r&&r.data;if(typeof d==='string'){try{d=JSON.parse(d);}catch(_e){d=null;}}
      if(d&&d.found&&ALLOWED_GAMES.indexOf(String(d.game_key))>-1)return d;
    }catch(_e){}
    return null;
  }
  async function openChallenge(courseKey,courseTitle,courseType){
    var run=async function(){
      var link=await serverLink(courseKey,courseTitle,courseType);
      var gameKey=link&&link.game_key?String(link.game_key):inferGame(courseKey,courseTitle);
      if(ALLOWED_GAMES.indexOf(gameKey)<0)gameKey='pro';
      var gameTitle=(link&&link.game_title)||GAME_TITLES[gameKey]||'Jeu Adams';
      saveContext({course_key:String(courseKey||''),course_title:String(courseTitle||'Cours Nexora'),course_type:String(courseType||'module'),game_key:gameKey,game_title:gameTitle,minimum_score:Number(link&&link.minimum_score||5),started_at:Date.now()});
      if(window.NexoraAdamsGames&&typeof window.NexoraAdamsGames.openSolo==='function'){window.NexoraAdamsGames.openSolo(gameKey,gameTitle);notify('Défi Jeu Adams lié au cours.');}
      else notify('Jeu Adams indisponible pour le moment.');
    };
    /* Le gestionnaire Jeu Adams applique lui-même l’essai ou l’abonnement.
       Ne pas ajouter un second contrôle ici : une ouverture doit consommer un seul essai. */
    return run();
  }
  async function recordAttempt(result){
    var ctx=readContext();if(!ctx||!result)return false;
    if(typeof navigator!=='undefined'&&navigator.onLine===false){notify('Résultat conservé uniquement sur ce téléphone. Il ne comptera pas pour KDO.');return false;}
    if(String(result.game_key||'')!==String(ctx.game_key||''))return false;
    var c=getClient();if(!c||typeof c.rpc!=='function'){notify('Résultat conservé localement. Synchronisation Supabase à reprendre.');return false;}
    try{
      var r=await c.rpc('nexora_record_course_game_attempt',{
        p_course_key:ctx.course_key,
        p_course_type:ctx.course_type,
        p_course_title:ctx.course_title,
        p_game_key:ctx.game_key,
        p_game_title:ctx.game_title,
        p_score:Number(result.score||0),
        p_won:!!result.won,
        p_play_mode:String(result.play_mode||'solo'),
        p_result_key:String(result.result_key||''),
        p_duration_seconds:Number(result.duration_seconds||0),
        p_metadata:{source:'nexora_v99',adams_result:result}
      });
      if(r&&r.error)throw r.error;var d=r&&r.data;if(typeof d==='string'){try{d=JSON.parse(d);}catch(_e){}}
      if(d&&d.success){notify(d.mastered?'Cours renforcé : objectif atteint dans Jeu Adams.':'Score lié au cours. Continue pour atteindre l’objectif.');clearContext();try{document.dispatchEvent(new CustomEvent('nx-course-game-progress',{detail:d}));}catch(_e){}return true;}
    }catch(err){notify('Le score du jeu est enregistré, mais le lien avec le cours doit être resynchronisé.');}
    return false;
  }
  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest?e.target.closest('[data-action="open-course-adams-challenge"]'):null;if(!btn)return;
    e.preventDefault();openChallenge(btn.getAttribute('data-course-key')||'',btn.getAttribute('data-course-title')||'',btn.getAttribute('data-course-type')||'module');
  });
  window.NexoraCourseGame={open:openChallenge,recordAttempt:recordAttempt,readContext:readContext,clearContext:clearContext};
})();

