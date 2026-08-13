
/* NEXORA V506.0 — registre + moteur Jeu Adams, chargé uniquement à l'ouverture. Aucun plateau n'est mis en cache. */

(function () {
  'use strict';

  var games = {
    kdo: { key: 'kdo', title: 'Défi Nexora KDO', path: 'modules/jeu-adams/kdo/index.html', individual: true },
    preuniv: { key: 'preuniv', title: 'Jeu Adams Pré-universitaire', path: 'modules/jeu-adams/preuniv/index.html', individual: false },
    maternelle: { key: 'maternelle', title: 'Jeu Adams Maternelle', path: 'modules/jeu-adams/maternelle-v454/index.html', individual: false },
    ecole: { key: 'ecole', title: 'Jeu Adams École', path: 'modules/jeu-adams/ecole/index.html', individual: false },
    guinee: { key: 'guinee', title: 'Jeu Adams Guinée', path: 'modules/jeu-adams/guinee/index.html', individual: true },
    '7e': { key: '7e', title: 'Jeu Adams 7e année', path: 'modules/jeu-adams/7e/index.html', individual: true },
    '8e': { key: '8e', title: 'Jeu Adams 8e année', path: 'modules/jeu-adams/8e/index.html', individual: true },
    '9e': { key: '9e', title: 'Jeu Adams 9e année', path: 'modules/jeu-adams/9e/index.html', individual: true },
    '10e': { key: '10e', title: 'Jeu Adams 10e année', path: 'modules/jeu-adams/10e/index.html', individual: true },
    '11e': { key: '11e', title: 'Jeu Adams 11e année', path: 'modules/jeu-adams/11e/index.html', individual: true },
    '12e': { key: '12e', title: 'Jeu Adams 12e année', path: 'modules/jeu-adams/12e/index.html', individual: true },
    terminale: { key: 'terminale', title: 'Jeu Adams Terminale', path: 'modules/jeu-adams/terminale/index.html', individual: true },
    univ: { key: 'univ', title: 'Jeu Adams Université', path: 'modules/jeu-adams/univ/index.html', individual: true },
    pro: { key: 'pro', title: 'Jeu Adams Professionnel', path: 'modules/jeu-adams/pro/index.html', individual: true },
    sport: { key: 'sport', title: 'Jeu Adams Sport', path: 'modules/jeu-adams/sport/index.html', individual: true },
    sante: { key: 'sante', title: 'Jeu Adams Santé', path: 'modules/jeu-adams/sante/index.html', individual: true },
    musique: { key: 'musique', title: 'Jeu Adams Musique', path: 'modules/jeu-adams/musique/index.html', individual: true },
    art: { key: 'art', title: 'Jeu Adams Art', path: 'modules/jeu-adams/art/index.html', individual: true },
    histoire: { key: 'histoire', title: 'Jeu Adams Histoire', path: 'modules/jeu-adams/histoire/index.html', individual: true }
  };

  var aliases = {
    kdo: 'kdo', jeuadamskdo: 'kdo', cadeau: 'kdo',
    preuniversitaire: 'preuniv', preuniversite: 'preuniv', preuniv: 'preuniv',
    maternelle: 'maternelle', ecole: 'ecole', ecoleprimaire: 'ecole',
    septieme: '7e', septiemeannee: '7e', '7eme': '7e', '7eannee': '7e', jeuadams7e: '7e', jeuadams7eme: '7e',
    huitieme: '8e', huitiemeannee: '8e', '8eme': '8e', '8eannee': '8e', jeuadams8e: '8e', jeuadams8eme: '8e',
    neuvieme: '9e', neuviemeannee: '9e', '9eme': '9e', '9eannee': '9e', jeuadams9e: '9e', jeuadams9eme: '9e',
    dixieme: '10e', dixiemeannee: '10e', '10eme': '10e', '10eannee': '10e', jeuadams10e: '10e', jeuadams10eme: '10e',
    onzieme: '11e', onziemeannee: '11e', '11eme': '11e', '11eannee': '11e', jeuadams11e: '11e', jeuadams11eme: '11e',
    douzieme: '12e', douziemeannee: '12e', '12eme': '12e', '12eannee': '12e', jeuadams12e: '12e', jeuadams12eme: '12e',
    terminale: 'terminale', universite: 'univ', universitaire: 'univ', univ: 'univ',
    professionnel: 'pro', professionnelle: 'pro', pro: 'pro', sport: 'sport', guinee: 'guinee',
    sante: 'sante', musique: 'musique', art: 'art', histoire: 'histoire'
  };

  function normalize(value) {
    var raw = String(value || '').trim().toLowerCase();
    try { raw = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch(_error){window.nxLog&&window.nxLog(_error)}
    return raw;
  }

  function resolve(value) {
    var raw = normalize(value);
    if (games[raw]) return raw;
    var compact = raw.replace(/[^a-z0-9]+/g, '');
    if (aliases[compact]) return aliases[compact];
    var match = compact.match(/^(?:jeuadams)?(7|8|9|10|11|12)(?:e|eme|annee)?$/);
    return match ? match[1] + 'e' : '';
  }

  function get(value) {
    var key = resolve(value);
    return key && games[key] ? games[key] : null;
  }

  function list(options) {
    var individualOnly = options && options.individualOnly === true;
    return Object.keys(games).map(function (key) { return games[key]; }).filter(function (game) {
      return !individualOnly || game.individual === true;
    });
  }

  window.NexoraGameRegistry = Object.freeze({
    resolve: resolve,
    get: get,
    list: list,
    path: function (value) { var game = get(value); return game ? game.path : ''; },
    title: function (value) { var game = get(value); return game ? game.title : 'Jeu Adams'; },
    isIndividual: function (value) { var game = get(value); return !!(game && game.individual); }
  });
})();

//# sourceURL=assets/js/nexora-game-registry.js


(function(){
  'use strict';

  var SCREEN_BY_GAME={kdo:'screen-kdo',preuniv:'screen-preuniv',maternelle:'',ecole:'',univ:'screen-univ',pro:'screen-pro',sport:'screen-sport',guinee:'screen-guinee',sante:'screen-sante',musique:'screen-musique',art:'screen-art',histoire:'screen-histoire','7e':'','8e':'','9e':'','10e':'','11e':'','12e':'',terminale:''};
  var PREFIX_BY_GAME={kdo:'kdo',preuniv:'pu',maternelle:'',ecole:'',univ:'un',pro:'pr',sport:'sp',guinee:'gn',sante:'sa',musique:'mu',art:'ar',histoire:'hi','7e':'','8e':'','9e':'','10e':'','11e':'','12e':'',terminale:''};
  var STATS_PREFIX='nexora_adams_stats_v3:';
  var RESULT_KEYS_PREFIX='nexora_adams_result_keys_v3:';
  var state={
    mode:'idle',gameKey:'',gameTitle:'',gameInstanceId:'',frame:null,frameReady:false,
    room:null,players:[],identity:null,selectedRoomSize:2,lastEventId:0,pendingEvents:[],
    roomBusy:false,eventBusy:false,channel:null,roomPoll:null,eventPoll:null,
    resultSeen:{},resultCount:0,resultFinalized:false,lastResult:null,statsBusy:false,session:null,startedAt:0,scoreRequestPending:false,liveScore:null,answerPoints:0,answerEventsSeen:0,answerKeys:{},captureResolver:null,captureTimer:null,historyEntry:false,frameObjectUrl:null
  };

  function qs(sel,root){return (root||document).querySelector(sel)}
  function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safeText(v){return String(v||'').replace(/[<>]/g,'')}
  function cleanCode(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)}
  function toNumber(v,fallback){var n=Number(v);return isFinite(n)?n:Number(fallback||0)}
  function uuidLike(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))}
  var GAME_REGISTRY=window.NexoraGameRegistry;
  if(!GAME_REGISTRY)throw new Error('Registre officiel des Jeux Adams indisponible.');
  var LOCAL_ADAMS_GAME_KEYS={};
  GAME_REGISTRY.list().forEach(function(game){LOCAL_ADAMS_GAME_KEYS[game.key]=true;});
  function titleFromKey(key){return GAME_REGISTRY.title(key)}
  function canonicalGameKey(value){return GAME_REGISTRY.resolve(value)}
  function getClient(){try{if(window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function') return window.NexoraApp.getSupabaseClient();}catch(_e){window.nxLog&&window.nxLog(_e)}return null}
  function identitySnapshot(){try{return window.NexoraApp&&window.NexoraApp.getIdentitySnapshot?window.NexoraApp.getIdentitySnapshot():null}catch(_e){return null}}
  function notify(message){
    try{if(typeof window.toast==='function'){window.toast(message);return;}}catch(_e){window.nxLog&&window.nxLog(_e)}
    var old=qs('.nx-adams-sync-toast');if(old)old.remove();
    var el=document.createElement('div');el.className='nx-adams-sync-toast';el.textContent=String(message||'');
    document.body.appendChild(el);setTimeout(function(){if(el&&el.parentNode)el.parentNode.removeChild(el)},2800);
  }
  function unpack(data){
    var value=data;
    if(value&&value.data!==undefined)value=value.data;
    if(Array.isArray(value)&&value.length===1)value=value[0];
    if(typeof value==='string'){try{value=JSON.parse(value)}catch(_e){window.nxLog&&window.nxLog(_e)}}
    return value||{};
  }
  function timeoutPromise(promise,ms){
    return new Promise(function(resolve,reject){
      var done=false,t=setTimeout(function(){if(done)return;done=true;resolve(null)},ms||1800);
      Promise.resolve(promise).then(function(v){if(done)return;done=true;clearTimeout(t);resolve(v)}).catch(function(err){if(done)return;done=true;clearTimeout(t);reject(err)});
    });
  }
  function delay(ms){return new Promise(function(resolve){setTimeout(resolve,ms||900)})}
  function randomId(){try{return crypto.randomUUID()}catch(_e){return 'nx-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}}
  function getKdoPlayer(){
    try{
      if(window.NexoraKDO&&typeof window.NexoraKDO.getPlayer==='function')return window.NexoraKDO.getPlayer();
      var raw=localStorage.getItem('nexora.kdo.player.v213');return raw?JSON.parse(raw):null;
    }catch(_e){return null}
  }
  function updateKdoGameBadge(gamePoints){
    var modal=ensureModal(),box=qs('[data-nx-adams-kdo-live]',modal);if(!box)return;
    var playContext=window.__NEXORA_ADAMS_PLAY_CONTEXT_V246;if(!playContext||playContext.type!=='kdo'||playContext.official!==true){box.hidden=true;return}
    var player=getKdoPlayer();if(!player||!player.display_name){box.hidden=true;return}
    var name=qs('[data-nx-adams-kdo-name]',box),points=qs('[data-nx-adams-kdo-points]',box),total=Number(gamePoints);
    if(!Number.isFinite(total)){try{total=window.NexoraKDO&&typeof window.NexoraKDO.getDisplayedPoints==='function'?Number(window.NexoraKDO.getDisplayedPoints()):0}catch(_e){total=0}}
    if(name)name.textContent=player.display_name;if(points)points.textContent=String(Math.max(0,Math.round(total||0)));box.hidden=false;
  }

  function getIdentity(requireAuth){
    var profile=identitySnapshot()||{};
    var activeId=String(profile.profileId||profile.id||'');
    var client=getClient();
    var local={
      authId:'',
      profileId:String(profile.profileId||profile.id||activeId||''),
      id:String(profile.id||activeId||'guest'),
      name:String(profile.name||'Joueur Nexora').trim()||'Joueur Nexora'
    };
    var kdoPlayer=getKdoPlayer();if(kdoPlayer&&kdoPlayer.display_name)local.name=String(kdoPlayer.display_name).trim()||local.name;
    if(!client||!client.auth||typeof client.auth.getSession!=='function'){
      if(requireAuth)return Promise.reject(new Error('Connecte-toi à Nexora pour créer ou rejoindre une partie sur plusieurs téléphones.'));
      return Promise.resolve(local);
    }
    return client.auth.getSession().then(function(res){
      var session=res&&res.data&&res.data.session;
      var user=session&&session.user;
      if(user&&user.id){
        local.authId=String(user.id);
        local.id=String(user.id);
        if(!local.name||local.name==='Joueur Nexora'){
          local.name=String((user.user_metadata&&(user.user_metadata.full_name||user.user_metadata.name))||'Joueur Nexora');
        }
      }
      if(requireAuth&&!local.authId)throw new Error('Connecte-toi à Nexora pour utiliser le mode multijoueur.');
      return local;
    });
  }

  function ensureModal(){
    var modal=qs('[data-nx-adams-game-modal]');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.className='nx-adams-game-modal';
    modal.setAttribute('data-nx-adams-game-modal','');
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML='<div class="nx-adams-game-modal-head">'+
      '<div class="nx-adams-game-modal-title"><strong data-nx-adams-game-title>Jeu Adams</strong><span data-nx-adams-game-subtitle>Préparation du plateau</span></div>'+
      '<div class="nx-adams-kdo-live-v213" data-nx-adams-kdo-live hidden><strong data-nx-adams-kdo-name>Joueur KDO</strong><span><b data-nx-adams-kdo-points>0</b> points KDO en direct</span></div>'+
      '<div class="nx-adams-game-modal-head-actions"><span class="nx-adams-room-status" data-nx-adams-room-status hidden></span><button type="button" class="nx-adams-game-head-btn" data-action="finish-adams-game" hidden>Fin de partie</button><button type="button" class="nx-adams-game-close" data-action="close-adams-game" aria-label="Fermer le jeu">×</button></div>'+
      '</div><div class="nx-adams-game-stage-v203"><div class="nx-adams-game-frame-wrap" data-nx-adams-game-frame-wrap></div><aside class="nx-adams-rules-v203" aria-label="Règles du Jeu Adams"><details open><summary><span>Règles du jeu</span><small>À lire avant de jouer</small></summary><div class="nx-adams-rules-body-v203"><div class="nx-adams-rule-v203"><b>1</b><p><strong>Choisis le mode.</strong> Solo affiche 1 pion, Ordinateur 2 pions et Multijoueur le nombre de joueurs sélectionné.</p></div><div class="nx-adams-rule-v203"><b>2</b><p><strong>Réponds à la question</strong> proposée sur la case ou dans la matière choisie.</p></div><div class="nx-adams-rule-v203"><b>3</b><p><strong>Une bonne réponse = 1 point.</strong> Aucun bonus automatique ou point fictif n’est ajouté.</p></div><div class="nx-adams-rule-v203"><b>4</b><p><strong>Une mauvaise réponse = 0 point.</strong> Le jeu continue selon le mode sélectionné.</p></div><div class="nx-adams-rule-v203"><b>5</b><p><strong>Le gagnant</strong> est déterminé par la règle affichée sur le plateau.</p></div><div class="nx-adams-rule-note-v203">Le compteur Nexora enregistre uniquement les réponses réellement vérifiées.</div></div></details></aside></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',function(ev){if(ev.target===modal)closeGame()});
    return modal;
  }
  function setHeader(title,subtitle,roomText,gameActive){
    var modal=ensureModal();
    var t=qs('[data-nx-adams-game-title]',modal),s=qs('[data-nx-adams-game-subtitle]',modal),r=qs('[data-nx-adams-room-status]',modal),f=qs('[data-action="finish-adams-game"]',modal);
    if(t)t.textContent=safeText(title||'Jeu Adams');
    if(s)s.textContent=safeText(subtitle||'Préparation du plateau');
    if(r){r.hidden=!roomText;r.textContent=safeText(roomText||'')}
    if(f)f.hidden=!gameActive;
    updateKdoGameBadge();
  }
  function openModal(){
    var modal=ensureModal(),wasOpen=modal.classList.contains('open');
    modal.classList.add('open');document.body.classList.add('nx-adams-game-locked');
    if(!wasOpen&&!state.historyEntry){
      try{history.pushState({nxAdamsGame:true},'',location.href);state.historyEntry=true}catch(_historyError){window.nxLog&&window.nxLog(_historyError)}
    }
    return modal;
  }
  function showLoading(wrap,label,detail){
    if(!wrap)return;
    wrap.innerHTML='<div class="nx-adams-game-loading"><div><strong>'+esc(label||'Préparation du jeu')+'</strong><span>'+esc(detail||'Préparation du plateau et vérification de la connexion.')+'</span><small>Ouverture en cours</small></div></div>';
  }

  function statsKey(identity){return STATS_PREFIX+String(identity&&identity.id||'guest')}
  function resultKeysKey(identity){return RESULT_KEYS_PREFIX+String(identity&&identity.id||'guest')}
  function readLocalStats(identity){
    var blank={total_points:0,games_played:0,wins:0,best_score:0,solo_games:0,computer_games:0,multiplayer_games:0,computer_wins:0,multiplayer_wins:0,last_score:0};
    try{
      var raw=localStorage.getItem(statsKey(identity));if(!raw)return blank;
      var s=JSON.parse(raw)||{};
      return {total_points:toNumber(s.total_points),games_played:toNumber(s.games_played),wins:toNumber(s.wins),best_score:toNumber(s.best_score),solo_games:toNumber(s.solo_games),computer_games:toNumber(s.computer_games),multiplayer_games:toNumber(s.multiplayer_games),computer_wins:toNumber(s.computer_wins),multiplayer_wins:toNumber(s.multiplayer_wins),last_score:toNumber(s.last_score)};
    }catch(_e){return blank}
  }
  function writeLocalStats(identity,stats){try{localStorage.setItem(statsKey(identity),JSON.stringify(stats))}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function hasLocalResultKey(identity,key){
    try{var list=JSON.parse(localStorage.getItem(resultKeysKey(identity))||'[]');return Array.isArray(list)&&list.indexOf(String(key))>-1}catch(_e){return false}
  }
  function rememberLocalResultKey(identity,key){
    try{
      var list=JSON.parse(localStorage.getItem(resultKeysKey(identity))||'[]');if(!Array.isArray(list))list=[];
      key=String(key);if(list.indexOf(key)<0)list.unshift(key);list=list.slice(0,120);
      localStorage.setItem(resultKeysKey(identity),JSON.stringify(list));
    }catch(_e){window.nxLog&&window.nxLog(_e)}
  }
  function renderStats(stats){
    stats=stats||{};
    qsa('[data-nx-adams-total-points]').forEach(function(el){el.textContent=String(toNumber(stats.total_points))});
    qsa('[data-nx-adams-games-played]').forEach(function(el){el.textContent=String(toNumber(stats.games_played))});
    qsa('[data-nx-adams-wins]').forEach(function(el){el.textContent=String(toNumber(stats.wins))});
    qsa('[data-nx-adams-best-score]').forEach(function(el){el.textContent=String(toNumber(stats.best_score))});
    qsa('[data-nx-adams-solo-games]').forEach(function(el){el.textContent=String(toNumber(stats.solo_games))});
    qsa('[data-nx-adams-computer-games]').forEach(function(el){el.textContent=String(toNumber(stats.computer_games))});
    qsa('[data-nx-adams-multiplayer-games]').forEach(function(el){el.textContent=String(toNumber(stats.multiplayer_games))});
  }
  function playModeLabel(mode){return mode==='computer'?'Contre l’ordinateur':(mode==='multiplayer'?'Multijoueur':'Solo')}
  function currentPlayMode(){return state.mode==='multi'?'multiplayer':(state.mode==='computer'?'computer':'solo')}
  function startTrackedSession(mode,identity,options){
    state.startedAt=Date.now();state.session=null;options=options||{};
    var client=getClient();if(!client||!identity||!identity.authId)return Promise.resolve(null);
    var playContext=window.__NEXORA_ADAMS_PLAY_CONTEXT||null;
    var trackedGameKey=(playContext&&String(playContext.type||'')==='individual_challenge'&&playContext.backend_game_key)?String(playContext.backend_game_key):state.gameKey;
    var trackedGameTitle=(playContext&&playContext.backend_game_name)?String(playContext.backend_game_name):state.gameTitle;
    return client.rpc('nexora_start_adams_session',{p_game_key:trackedGameKey,p_game_title:trackedGameTitle,p_play_mode:mode,p_room_id:options.roomId||null,p_computer_level:mode==='computer'?(options.computerLevel||'normal'):null,p_opponent_name:mode==='computer'?'Ordinateur Adams':null,p_seed:toNumber(options.seed,1)}).then(function(res){
      if(res&&res.error)throw res.error;var data=unpack(res);state.session=data.session||data;return state.session;
    }).catch(function(){state.session=null;return null});
  }
  function exactStatsFromResults(rows){
    var stats={total_points:0,games_played:0,wins:0,best_score:0,solo_games:0,computer_games:0,multiplayer_games:0,computer_wins:0,multiplayer_wins:0,last_score:0};
    var seen={},latestAt=-1;
    (Array.isArray(rows)?rows:[]).forEach(function(row){
      row=row||{};
      var source=String(row.score_source||'').toLowerCase();
      if(row.score_verified!==true&&['game_state','scoreboard','result_screen'].indexOf(source)<0)return;
      var score=Number(row.score);if(!isFinite(score)||score<0)return;score=Math.round(score);
      var meta=row.metadata&&typeof row.metadata==='object'?row.metadata:{};
      var instance=String(meta.game_instance_id||'').trim();
      var dedupeKey=row.session_id?('session:'+String(row.session_id)):(instance?('instance:'+instance):('result:'+String(row.result_key||row.id||'')));
      if(!dedupeKey||seen[dedupeKey])return;seen[dedupeKey]=true;
      var mode=String(row.play_mode||'solo').toLowerCase();
      stats.total_points+=score;stats.games_played+=1;if(row.won===true)stats.wins+=1;stats.best_score=Math.max(stats.best_score,score);
      if(mode==='computer'){stats.computer_games+=1;if(row.won===true)stats.computer_wins+=1}
      else if(mode==='multiplayer'){stats.multiplayer_games+=1;if(row.won===true)stats.multiplayer_wins+=1}
      else stats.solo_games+=1;
      var at=new Date(row.created_at||0).getTime();if(isFinite(at)&&at>=latestAt){latestAt=at;stats.last_score=score}
    });
    return stats;
  }
  function refreshStats(){
    if(state.statsBusy)return;
    state.statsBusy=true;
    getIdentity(false).then(function(identity){
      state.identity=identity;
      var local=readLocalStats(identity);
      if(identity.authId)renderStats({});else renderStats(local);
      var client=getClient();
      if(!client||!identity.authId)return null;

      // V67 : Supabase devient la source officielle du compteur de tous les plateaux.
      return timeoutPromise(client.rpc('nexora_get_adams_points'),2400).then(function(res){
        if(res&&res.error)throw res.error;
        var data=unpack(res),exact=data&&data.stats;
        if(!exact||typeof exact!=='object')throw new Error('Compteur V67 indisponible');
        writeLocalStats(identity,exact);renderStats(exact);
        if(state.lastResult){
          state.lastResult.total_points=toNumber(exact.total_points);
          state.lastResult.games_played=toNumber(exact.games_played);
          state.lastResult.best_score=toNumber(exact.best_score);
          updateVisibleResultTotals(exact);
        }
        return data;
      }).catch(function(){
        // Compatibilité temporaire si le SQL V67 n'est pas encore exécuté.
        return timeoutPromise(client.from('adams_game_results').select('id,result_key,session_id,score,won,play_mode,score_source,score_verified,metadata,created_at').eq('user_id',identity.authId).order('created_at',{ascending:false}).limit(1000),2200).then(function(res){
          if(res&&res.error)throw res.error;
          var exact=exactStatsFromResults(res&&res.data||[]);
          writeLocalStats(identity,exact);renderStats(exact);
          if(state.lastResult){state.lastResult.total_points=exact.total_points;state.lastResult.games_played=exact.games_played;state.lastResult.best_score=exact.best_score;updateVisibleResultTotals(exact)}
          return exact;
        }).catch(function(){return null});
      });
    }).catch(function(){renderStats({})}).finally(function(){state.statsBusy=false});
  }

  function clearRoomWatch(){
    var client=getClient();
    if(state.roomPoll){clearInterval(state.roomPoll);state.roomPoll=null}
    if(state.eventPoll){clearInterval(state.eventPoll);state.eventPoll=null}
    if(state.channel&&client&&typeof client.removeChannel==='function'){try{client.removeChannel(state.channel)}catch(_e){window.nxLog&&window.nxLog(_e)}}
    state.channel=null;state.roomBusy=false;state.eventBusy=false;
  }
  function resetSession(keepIdentity){
    clearRoomWatch();
    var identity=keepIdentity?state.identity:null;
    state.mode='idle';state.gameKey='';state.gameTitle='';state.gameInstanceId='';state.frame=null;state.frameReady=false;
    state.room=null;state.players=[];state.identity=identity;state.lastEventId=0;state.pendingEvents=[];state.resultSeen={};state.resultFinalized=false;state.lastResult=null;state.session=null;state.startedAt=0;state.scoreRequestPending=false;state.liveScore=null;state.answerPoints=0;state.answerEventsSeen=0;state.answerKeys={};
  }

  function renderRoomSetup(key,label){
    state.mode='setup';state.gameKey=key;state.gameTitle=label||titleFromKey(key);state.selectedRoomSize=2;state.gameInstanceId=randomId();
    var modal=openModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal);
    setHeader(state.gameTitle,'Créer une partie en ligne','2 à 4 téléphones',false);
    wrap.innerHTML='<section class="nx-adams-room-setup"><div class="nx-adams-setup-card">'+
      '<span class="nx-adams-lobby-kicker">Partie multijoueur</span><h2>Combien de téléphones ?</h2><p>Chaque joueur ouvre Nexora sur son téléphone et rejoint le même plateau avec le code d’invitation.</p>'+
      '<div class="nx-adams-room-sizes">'+[2,3,4].map(function(n){return '<button type="button" class="nx-adams-room-size '+(n===2?'active':'')+'" data-action="set-adams-room-size" data-size="'+n+'"><b>'+n+'</b><span>téléphones</span></button>'}).join('')+'</div>'+
      '<div class="nx-adams-setup-actions"><button type="button" class="btn btn-primary" data-action="create-adams-room">Créer l’invitation</button><button type="button" class="btn btn-soft" data-action="close-adams-game">Annuler</button></div>'+
      '<p class="nx-adams-room-note">Les joueurs doivent être connectés à leur compte Nexora. Tous voient la même partie tant que la connexion reste active.</p>'+
      '</div></section>';
  }
  function openMultiplayerSetup(key,label){
    resetSession(false);
    key=String(key||'').trim().replace(/[^a-z0-9_-]/gi,'');
    renderRoomSetup(key,label||titleFromKey(key));
  }
  function openJoinRoom(prefill){
    resetSession(false);state.mode='join';state.gameInstanceId=randomId();
    var modal=openModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal);
    setHeader('Rejoindre une partie','Entre le code reçu','Invitation Jeu Adams',false);
    wrap.innerHTML='<section class="nx-adams-join-panel"><div class="nx-adams-join-card">'+
      '<span class="nx-adams-lobby-kicker">Invitation</span><h2>Rejoindre le plateau</h2><p>Entre le code affiché sur le téléphone de la personne qui a créé la partie.</p>'+
      '<input class="nx-adams-room-input" data-nx-adams-room-code-input inputmode="text" maxlength="8" autocomplete="one-time-code" value="'+esc(cleanCode(prefill||''))+'" placeholder="ABC123" aria-label="Code de la partie">'+
      '<div class="nx-adams-join-actions"><button type="button" class="btn btn-primary" data-action="submit-join-adams-room">Rejoindre</button><button type="button" class="btn btn-soft" data-action="close-adams-game">Annuler</button></div>'+
      '</div></section>';
    setTimeout(function(){var input=qs('[data-nx-adams-room-code-input]',wrap);if(input)input.focus()},80);
  }
  function createRoom(){
    var modal=ensureModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal),client=getClient();
    if(!client){notify('Connexion à Nexora indisponible.');return}
    showLoading(wrap,'Création de la partie','Génération du code et réservation des places.');
    getIdentity(true).then(function(identity){
      state.identity=identity;
      return client.rpc('nexora_create_adams_room',{p_game_key:state.gameKey,p_game_title:state.gameTitle,p_target_players:state.selectedRoomSize});
    }).then(function(res){
      if(res&&res.error)throw res.error;
      var data=unpack(res),room=data.room||data,players=data.players||[];
      if(!room||!room.id)throw new Error('La partie n’a pas pu être créée. Réessaie dans quelques instants.');
      state.room=room;state.players=players;state.mode='lobby';renderLobby();beginRoomWatch();
    }).catch(function(err){renderRoomSetup(state.gameKey,state.gameTitle);notify((err&&err.message)||'Création impossible pour le moment. Réessaie dans quelques instants.')});
  }
  function joinRoom(){
    var input=qs('[data-nx-adams-room-code-input]'),code=cleanCode(input&&input.value);
    if(code.length<4){notify('Entre le code complet de la partie.');return}
    var client=getClient(),modal=ensureModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal);
    if(!client){notify('Connexion à Nexora indisponible.');return}
    showLoading(wrap,'Connexion à la partie','Vérification du code et attribution de ta place.');
    getIdentity(true).then(function(identity){
      state.identity=identity;
      return client.rpc('nexora_join_adams_room',{p_code:code});
    }).then(function(res){
      if(res&&res.error)throw res.error;
      var data=unpack(res),room=data.room||data,players=data.players||[];
      if(!room||!room.id)throw new Error('Code introuvable ou partie indisponible.');
      state.room=room;state.players=players;state.gameKey=String(room.game_key||'');state.gameTitle=String(room.game_title||titleFromKey(state.gameKey));state.mode='lobby';renderLobby();beginRoomWatch();
      try{var url=new URL(location.href);url.searchParams.delete('adams_room');history.replaceState({},'',url.toString())}catch(_e){window.nxLog&&window.nxLog(_e)}
    }).catch(function(err){openJoinRoom(code);notify((err&&err.message)||'Impossible de rejoindre cette partie.')});
  }
  function playerBySlot(slot){return (state.players||[]).filter(function(p){return toNumber(p.slot)===toNumber(slot)})[0]||null}
  function isHost(){return !!(state.room&&state.identity&&String(state.room.host_id||'')===String(state.identity.authId||''))}
  function ownPlayer(){
    if(!state.identity)return null;
    return (state.players||[]).filter(function(p){return String(p.user_id||'')===String(state.identity.authId||state.identity.id||'')})[0]||null;
  }
  function renderLobby(){
    if(!state.room)return;
    var modal=openModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal);
    var target=Math.max(2,Math.min(4,toNumber(state.room.target_players,2)));
    var count=(state.players||[]).length,host=isHost(),canStart=host&&count>=target;
    setHeader(state.gameTitle||titleFromKey(state.room.game_key),'Salle d’attente','Code '+String(state.room.code||''),false);
    var rows=[];
    for(var i=1;i<=target;i++){
      var p=playerBySlot(i);
      rows.push('<div class="nx-adams-room-player"><i>'+i+'</i><span><b>'+esc(p?(p.display_name||p.name||('Joueur '+i)):'Place disponible')+'</b><small>'+esc(p?(i===1?'Créateur de la partie':'Téléphone connecté'):'En attente d’un joueur')+'</small></span>'+(p?'<em>Connecté</em>':'')+'</div>');
    }
    wrap.innerHTML='<section class="nx-adams-lobby"><div class="nx-adams-lobby-card">'+
      '<span class="nx-adams-lobby-kicker">'+esc(state.gameTitle)+'</span><h2>'+esc(host?'Invite les autres joueurs':'Tu as rejoint la partie')+'</h2><p>'+esc(host?'Partage le code. La partie démarre lorsque tous les téléphones prévus sont connectés.':'Garde cet écran ouvert. Le créateur démarrera le plateau.')+'</p>'+
      '<div class="nx-adams-room-code"><small>Code de la partie</small><strong>'+esc(state.room.code||'------')+'</strong></div>'+
      '<div class="nx-adams-room-share"><button type="button" class="btn btn-soft" data-action="copy-adams-room-code">Copier le code</button><button type="button" class="btn btn-soft" data-action="share-adams-room">Partager l’invitation</button></div>'+
      '<div class="nx-adams-player-list">'+rows.join('')+'</div>'+
      '<div class="nx-adams-lobby-actions">'+(host?'<button type="button" class="btn btn-primary" data-action="start-adams-room" '+(canStart?'':'disabled')+'>Démarrer '+count+'/'+target+'</button>':'<button type="button" class="btn btn-primary" disabled>En attente du démarrage</button>')+'<button type="button" class="btn btn-soft" data-action="close-adams-game">Fermer</button></div>'+
      '<p class="nx-adams-room-note">Tous les joueurs verront le même plateau. Les actions effectuées sur un téléphone seront reproduites sur les autres.</p>'+
      '</div></section>';
  }
  function refreshRoom(){
    if(state.roomBusy||!state.room||!state.room.id)return;
    var client=getClient();if(!client)return;
    state.roomBusy=true;
    Promise.all([
      client.from('adams_game_rooms').select('*').eq('id',state.room.id).maybeSingle(),
      client.from('adams_game_players').select('*').eq('room_id',state.room.id).order('slot',{ascending:true})
    ]).then(function(results){
      var roomRes=results[0],playersRes=results[1];
      if(roomRes&&roomRes.data)state.room=roomRes.data;
      if(playersRes&&Array.isArray(playersRes.data))state.players=playersRes.data;
      var status=String(state.room&&state.room.status||'waiting');
      if(status==='playing'){
        if(state.mode!=='multi')launchMultiplayerGame();
      }else if(status==='waiting'&&state.mode==='lobby'){
        renderLobby();
      }else if(status==='cancelled'||status==='finished'){
        notify('Cette partie est terminée.');closeGame();
      }
    }).catch(function(){return null}).finally(function(){state.roomBusy=false});
  }
  function beginRoomWatch(){
    clearRoomWatch();
    var client=getClient();if(!client||!state.room||!state.room.id)return;
    try{
      state.channel=client.channel('nx-adams-room-'+state.room.id+'-'+Math.random().toString(36).slice(2,7))
        .on('postgres_changes',{event:'*',schema:'public',table:'adams_game_rooms',filter:'id=eq.'+state.room.id},function(){refreshRoom()})
        .on('postgres_changes',{event:'*',schema:'public',table:'adams_game_players',filter:'room_id=eq.'+state.room.id},function(){refreshRoom()})
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'adams_game_events',filter:'room_id=eq.'+state.room.id},function(){fetchRoomEvents()})
        .subscribe();
    }catch(_e){window.nxLog&&window.nxLog(_e)}
    state.roomPoll=setInterval(refreshRoom,1500);
    state.eventPoll=setInterval(function(){if(state.mode==='multi')fetchRoomEvents()},850);
  }
  function startRoom(){
    if(!state.room||!isHost())return;
    var client=getClient();if(!client)return;
    var target=toNumber(state.room.target_players,2);
    if((state.players||[]).length<target){notify('Attends que tous les téléphones soient connectés.');return}
    var modal=ensureModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal);
    showLoading(wrap,'Démarrage de la partie','Préparation du même plateau sur chaque téléphone.');
    client.rpc('nexora_start_adams_room',{p_room_id:state.room.id}).then(function(res){
      if(res&&res.error)throw res.error;
      var data=unpack(res);if(data.room)state.room=data.room;else if(data.id)state.room=data;
      refreshRoom();
    }).catch(function(err){renderLobby();notify((err&&err.message)||'Démarrage impossible.')});
  }
  function copyRoomCode(){
    var code=String(state.room&&state.room.code||'');if(!code)return;
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code).then(function(){notify('Code copié : '+code)}).catch(function(){notify('Code : '+code)})}
    else notify('Code : '+code);
  }
  function roomShareUrl(){
    try{var url=new URL(location.href);url.searchParams.set('adams_room',String(state.room&&state.room.code||''));url.hash='jeu-adams';return url.toString()}catch(_e){return location.href}
  }
  function shareRoom(){
    if(!state.room)return;
    var text='Rejoins ma partie '+(state.gameTitle||'Jeu Adams')+' sur Nexora. Code : '+state.room.code;
    var url=roomShareUrl();
    if(navigator.share){navigator.share({title:'Invitation Jeu Adams',text:text,url:url}).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')})}
    else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text+' '+url).then(function(){notify('Invitation copiée.')})}
    else notify('Code de la partie : '+state.room.code);
  }

  function resolveGameConfig(key,label){
    key=canonicalGameKey(key);
    var fallback={ok:true,slug:key,launch_key:key,title:label||titleFromKey(key),launch_mode:'template_id',template_id:'nx-adams-source-'+key};
    var client=getClient();
    if(!client||typeof client.rpc!=='function')return Promise.resolve(fallback);
    return timeoutPromise(client.rpc('nexora_get_game_to_open',{p_slug:key,p_access_code:null}),1800).then(function(res){
      var data=unpack(res);
      if(data&&data.ok){
        var remoteMode=String(data.launch_mode||'template_id');
        var remoteKey=canonicalGameKey(data.launch_key||data.slug||key);
        var chosenKey=(remoteMode==='public_url'||remoteMode==='route')?(remoteKey||key):(LOCAL_ADAMS_GAME_KEYS[key]?key:(remoteKey||key));
        return {ok:true,slug:key,launch_key:chosenKey,title:String(data.title||label||titleFromKey(key)),launch_mode:remoteMode,template_id:String(data.template_id||('nx-adams-source-'+chosenKey)),public_url:String(data.public_url||''),storage_path:String(data.storage_path||''),route_path:String(data.route_path||'')};
      }
      return fallback;
    }).catch(function(){return fallback});
  }

  function nxAdamsChildRuntime(){
    var ctx=window.__NEXORA_ADAMS_CONTEXT||{},multi=!!ctx.multiplayer,computerMode=ctx.playMode==='computer'||!!ctx.computerMode,soloMode=ctx.playMode==='solo'&&!multi&&!computerMode,computerName=String(ctx.computerName||'Ordinateur Adams'),replaying=false,resultSent=false,startTries=0,computerBusy=false,soloStarted=false,computerPhase=false,computerPhaseStartedAt=0,answerSequence=0,answerLocked=false,lastQuestionSignature='',startAuthorized=ctx.deferStart!==true,officialStartTriggered=false,frameReadySent=false;

    /* V432 — plateau complet et stable pendant l’affichage des questions.
       Le plateau est copié dans une zone dédiée et ajusté simultanément
       à la largeur et à la hauteur disponibles, sans découpage. */
    var nxBoardSourceV432=null,nxBoardSnapshotV432=null,nxBoardShellV432=null,nxBoardSyncTimerV432=0;
    function nxBoardCandidateV432(){
      var selectors=['#cp-board-wrap','.g-inner','.board-shell','.game-board','.board-container','.plateau','.board','[id$="-board"]','[id*="plateau"]','.game-screen.active','.screen.active [id$="-game"]'];
      var best=null,area=0;
      for(var i=0;i<selectors.length;i++){
        var nodes=[];try{nodes=Array.prototype.slice.call(document.querySelectorAll(selectors[i]))}catch(_e){window.nxLog&&window.nxLog(_e)}
        for(var j=0;j<nodes.length;j++){
          var el=nodes[j];if(!el||el.closest('[data-nx-board-preview-v432]'))continue;
          try{var st=getComputedStyle(el),r=el.getBoundingClientRect(),w=Math.max(el.scrollWidth||0,r.width||0),h=Math.max(el.scrollHeight||0,r.height||0),a=w*h;if(st.display!=='none'&&st.visibility!=='hidden'&&w>120&&h>100&&a>area){best=el;area=a}}catch(_e){window.nxLog&&window.nxLog(_e)}
        }
      }
      return best;
    }
    function nxQuestionVisibleV432(){
      var selectors=['.question-modal','.question-box','.question-card','.quiz-modal','.q-modal','[id*="question"]','.question-text','.q-text','.choice','.option','.answer-option','[data-answer]'];
      for(var i=0;i<selectors.length;i++){
        var nodes=[];try{nodes=document.querySelectorAll(selectors[i])}catch(_e){window.nxLog&&window.nxLog(_e)}
        for(var j=0;j<nodes.length;j++){try{var st=getComputedStyle(nodes[j]),r=nodes[j].getBoundingClientRect();if(st.display!=='none'&&st.visibility!=='hidden'&&Number(st.opacity||1)>0&&r.width>40&&r.height>20)return true}catch(_e){window.nxLog&&window.nxLog(_e)}}
      }
      return false;
    }
    function nxStripCloneIdsV432(root){
      if(!root)return;try{root.removeAttribute('id');root.querySelectorAll('[id]').forEach(function(el){el.removeAttribute('id')});root.querySelectorAll('script,iframe,audio,video').forEach(function(el){el.remove()})}catch(_e){window.nxLog&&window.nxLog(_e)}
    }
    function nxCaptureBoardV432(board){
      if(!board)return;
      try{var clone=board.cloneNode(true);nxStripCloneIdsV432(clone);clone.classList.add('nx-board-preview-content-v432');nxBoardSourceV432=board;nxBoardSnapshotV432=clone}catch(_e){window.nxLog&&window.nxLog(_e)}
    }
    function nxEnsureShellV432(){
      if(nxBoardShellV432&&nxBoardShellV432.isConnected)return nxBoardShellV432;
      var shell=document.createElement('section');shell.className='nx-board-preview-v432';shell.setAttribute('data-nx-board-preview-v432','');shell.innerHTML='<div class="nx-board-preview-head-v432"><strong>Plateau de votre partie</strong><small>Vue complète pendant la question</small></div><div class="nx-board-preview-stage-v432"><div class="nx-board-preview-holder-v432"></div></div>';document.body.appendChild(shell);nxBoardShellV432=shell;return shell;
    }
    function nxShowBoardPreviewV432(){
      if(!nxBoardSnapshotV432&&nxBoardSourceV432)nxCaptureBoardV432(nxBoardSourceV432);
      if(!nxBoardSnapshotV432)return;
      var shell=nxEnsureShellV432(),stage=shell.querySelector('.nx-board-preview-stage-v432'),holder=shell.querySelector('.nx-board-preview-holder-v432');
      holder.innerHTML='';var clone=nxBoardSnapshotV432.cloneNode(true);holder.appendChild(clone);shell.classList.add('active');document.documentElement.classList.add('nx-board-preview-active-v432');
      requestAnimationFrame(function(){try{
        clone.style.removeProperty('transform');clone.style.removeProperty('width');clone.style.removeProperty('height');
        var r=clone.getBoundingClientRect(),w=Math.max(clone.scrollWidth||0,r.width||0,320),h=Math.max(clone.scrollHeight||0,r.height||0,220);
        var availableW=Math.max(220,stage.clientWidth-16),availableH=Math.max(150,stage.clientHeight-16);
        var scale=Math.min(1,availableW/w,availableH/h);scale=Math.max(.22,scale);
        clone.style.setProperty('width',w+'px','important');clone.style.setProperty('height',h+'px','important');clone.style.setProperty('transform','scale('+scale+')','important');
        holder.style.width=Math.ceil(w*scale)+'px';holder.style.height=Math.ceil(h*scale)+'px';
      }catch(_e){window.nxLog&&window.nxLog(_e)}});
    }
    function nxHideBoardPreviewV432(){var shell=nxEnsureShellV432();shell.classList.remove('active');document.documentElement.classList.remove('nx-board-preview-active-v432')}
    function nxSyncBoardPreviewV432(){
      var asking=nxQuestionVisibleV432();
      if(!asking){var board=nxBoardCandidateV432();if(board)nxCaptureBoardV432(board);nxHideBoardPreviewV432()}else nxShowBoardPreviewV432();
    }
    function nxScheduleBoardPreviewV432(){if(nxBoardSyncTimerV432)return;nxBoardSyncTimerV432=setTimeout(function(){nxBoardSyncTimerV432=0;nxSyncBoardPreviewV432()},60)}
    document.addEventListener('pointerdown',function(ev){var target=ev.target&&ev.target.closest?ev.target.closest('.disc-card,.bonus-cell,.cell,[data-question],.dice,[class*="dice"],.subject-card,.category-card,.plateau,.board'):null;if(target){var board=nxBoardCandidateV432();if(board)nxCaptureBoardV432(board);setTimeout(nxScheduleBoardPreviewV432,20)}},true);
    if(typeof MutationObserver==='function'){new MutationObserver(nxScheduleBoardPreviewV432).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']})}
    setInterval(function(){if(document.visibilityState!=='hidden')nxScheduleBoardPreviewV432()},900);

    /* V395 — journal local des actions du joueur pour reprendre une partie commencée. */
    function emitProgressActionV395(kind,el,extra){
      if(!ctx.individualChallenge||replaying||!startAuthorized||!el||el===document.body||el===document.documentElement)return;
      var selector=selectorFor(el);if(!selector)return;
      parentPost('nx-adams-progress-action',{action:Object.assign({kind:kind,selector:selector,value:el.value,checked:!!el.checked,at:Date.now()},extra||{})});
    }
    document.addEventListener('click',function(ev){if(!ctx.individualChallenge)return;var el=clickableTarget(ev.target);setTimeout(function(){emitProgressActionV395('click',el,{})},0)},false);
    document.addEventListener('change',function(ev){if(!ctx.individualChallenge)return;var el=ev.target;setTimeout(function(){emitProgressActionV395('change',el,{})},0)},false);
    document.addEventListener('keydown',function(ev){if(!ctx.individualChallenge||ev.key!=='Enter')return;var el=ev.target;if(el&&/input|textarea/i.test(el.tagName||''))setTimeout(function(){emitProgressActionV395('enter',el,{key:'Enter'})},0)},false);
    function parentPost(type,payload){try{window.parent.postMessage(Object.assign({type:type,gameKey:ctx.gameKey||'',gameInstanceId:ctx.gameInstanceId||''},payload||{}),window.location.protocol==='file:'?'*':window.location.origin)}catch(_e){window.nxLog&&window.nxLog(_e)}}
    function visible(el){if(!el)return false;try{var s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>0&&r.height>0}catch(_e){return false}}
    function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
    function cssId(v){return String(v||'').replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|/@])/g,'\\$1')}
    function selectorFor(el){
      if(!el||el.nodeType!==1)return '';
      if(el.id)return '#'+cssId(el.id);
      var parts=[],node=el,depth=0;
      while(node&&node.nodeType===1&&node!==document.documentElement&&depth<7){
        var tag=(node.tagName||'div').toLowerCase(),part=tag;
        var parent=node.parentElement;
        if(parent){
          var same=Array.prototype.filter.call(parent.children,function(x){return x.tagName===node.tagName});
          if(same.length>1)part+=':nth-of-type('+(same.indexOf(node)+1)+')';
        }
        parts.unshift(part);
        if(parent&&parent.id){parts.unshift('#'+cssId(parent.id));break}
        node=parent;depth++;
      }
      return parts.join('>');
    }
    function clickableTarget(target){
      if(!target||!target.closest)return target;
      return target.closest('button,a,input,select,textarea,[onclick],[role="button"],.cell,.disc-card,.bonus-cell,.answer,.option,.choice,.dice,.pion,.token,.card')||target;
    }
    function emitAction(kind,el,extra,ev){
      if(!multi||replaying||!el||el===document.body||el===document.documentElement)return;
      var selector=selectorFor(el);if(!selector)return;
      if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation()}
      parentPost('nx-adams-action',{action:Object.assign({kind:kind,selector:selector,value:el.value,checked:!!el.checked},extra||{})});
    }
    document.addEventListener('click',function(ev){if(!multi)return;emitAction('click',clickableTarget(ev.target),{},ev)},true);
    document.addEventListener('change',function(ev){if(!multi)return;emitAction('change',ev.target,{},ev)},true);
    document.addEventListener('keydown',function(ev){if(!multi||ev.key!=='Enter')return;var el=ev.target;if(el&&/input|textarea/i.test(el.tagName||''))emitAction('enter',el,{key:'Enter'},ev)},true);
    function replay(action){
      if(!action||!action.selector)return;
      var el;try{el=document.querySelector(action.selector)}catch(_e){el=null}
      if(!el)return;
      replaying=true;
      try{
        if(action.value!==undefined&&'value' in el)el.value=action.value;
        if(action.checked!==undefined&&'checked' in el)el.checked=!!action.checked;
        if(action.kind==='change'){
          el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
        }else if(action.kind==='enter'){
          el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));
        }else if(typeof el.click==='function')el.click();
        else el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      setTimeout(function(){replaying=false},0);
    }
    window.addEventListener('message',function(ev){
      if(ev.origin!==window.location.origin)return;
      if(ev.source!==window.parent)return;
      var d=ev&&ev.data||{};
      if(d.type==='nx-adams-replay')replay(d.action||{});
      if(d.type==='nx-adams-confirm-start'&&(!ctx.individualAttemptId||String(d.attemptId||'')===String(ctx.individualAttemptId||''))){
        startAuthorized=true;
        if(!officialStartTriggered){officialStartTriggered=true;setTimeout(directStart,0)}
      }
      if(d.type==='nx-adams-request-result')emitResult(true);
      if(d.type==='nx-adams-request-capture')captureBoardImage().then(function(dataUrl){parentPost('nx-adams-board-capture',{dataUrl:dataUrl||''})}).catch(function(){parentPost('nx-adams-board-capture',{dataUrl:''})});
    });
    function bestCaptureTarget(){
      var selectors=['.game-screen.active','.game-screen','.g-inner','.board-shell','.inner','#comp-game','[id$="-game"]','.game-container','.board','.plateau'];
      var best=null,bestArea=0;
      for(var i=0;i<selectors.length;i++){
        var nodes=[];try{nodes=Array.prototype.slice.call(document.querySelectorAll(selectors[i]))}catch(_e){window.nxLog&&window.nxLog(_e)}
        for(var j=0;j<nodes.length;j++){
          if(!visible(nodes[j]))continue;
          var r=nodes[j].getBoundingClientRect(),area=Math.max(0,r.width)*Math.max(0,r.height);
          if(area>bestArea){best=nodes[j];bestArea=area;}
        }
      }
      return best||document.body;
    }
    function captureWithForeignObject(target){
      return new Promise(function(resolve){
        try{
          var rect=target.getBoundingClientRect(),w=Math.max(320,Math.min(1400,Math.ceil(Math.max(rect.width,target.scrollWidth||0)))),h=Math.max(320,Math.min(1400,Math.ceil(Math.max(rect.height,target.scrollHeight||0))));
          var styles=Array.prototype.slice.call(document.querySelectorAll('style')).map(function(st){return st.textContent||''}).join('\n');
          var clone=target.cloneNode(true);Array.prototype.slice.call(clone.querySelectorAll('script')).forEach(function(x){x.remove()});
          var xhtml='<div xmlns="http://www.w3.org/1999/xhtml" style="width:'+w+'px;min-height:'+h+'px;background:#1E2420;overflow:hidden"><style>'+styles.replace(/<\/style/gi,'<\\/style')+'</style>'+clone.outerHTML+'</div>';
          var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject width="100%" height="100%">'+xhtml+'</foreignObject></svg>';
          var blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),img=new Image();
          img.onload=function(){try{var c=document.createElement('canvas'),scale=Math.min(2,1400/w);c.width=Math.round(w*scale);c.height=Math.round(h*scale);var cx=c.getContext('2d');cx.fillStyle='#1E2420';cx.fillRect(0,0,c.width,c.height);cx.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',.9))}catch(_e){URL.revokeObjectURL(url);resolve('')}};
          img.onerror=function(){URL.revokeObjectURL(url);resolve('')};img.src=url;
        }catch(_e){resolve('')}
      });
    }
    function captureBoardImage(){
      var target=bestCaptureTarget();
      if(window.html2canvas){return window.html2canvas(target,{backgroundColor:'#1E2420',useCORS:true,allowTaint:false,scale:Math.min(2,window.devicePixelRatio||1.5),logging:false}).then(function(c){return c.toDataURL('image/jpeg',.9)}).catch(function(){return captureWithForeignObject(target)})}
      return new Promise(function(resolve){
        var done=false,s=document.createElement('script');s.src='./assets/vendor/html2canvas-1.4.1.min.js';s.async=true;
        var timer=setTimeout(function(){if(done)return;done=true;captureWithForeignObject(target).then(resolve)},1800);
        s.onload=function(){if(done)return;done=true;clearTimeout(timer);if(window.html2canvas)window.html2canvas(target,{backgroundColor:'#1E2420',useCORS:true,allowTaint:false,scale:Math.min(2,window.devicePixelRatio||1.5),logging:false}).then(function(c){resolve(c.toDataURL('image/jpeg',.9))}).catch(function(){captureWithForeignObject(target).then(resolve)});else captureWithForeignObject(target).then(resolve)};
        s.onerror=function(){if(done)return;done=true;clearTimeout(timer);captureWithForeignObject(target).then(resolve)};document.head.appendChild(s);
      });
    }
    function applyPlayerNames(){
      var names=Array.isArray(ctx.playerNames)?ctx.playerNames:[];
      if(!names.length)return;
      try{
        var inputs=Array.prototype.slice.call(document.querySelectorAll('input[type="text"]')).filter(function(input){
          var hint=clean((input.id||'')+' '+(input.name||'')+' '+(input.placeholder||'')).toLowerCase();
          return /joueur|player|nom|équipe|equipe/.test(hint);
        });
        inputs.slice(0,names.length).forEach(function(input,i){input.value=names[i];input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))});
      }catch(_e){window.nxLog&&window.nxLog(_e)}
    }
    function forceSoloConfiguration(){
      if(!soloMode)return;
      try{
        // Verrouille toutes les variantes connues sur un seul joueur.
        window.N=1;
        window.playerCount=1;
        window.playersCount=1;
        window.nbPlayers=1;
        window.nombreJoueurs=1;

        var pfx=String(ctx.prefix||'');
        var selectFunctions=[
          window.selectCount,
          window.lectSelectCount,
          window.calcSelectCount,
          window.sciSelectCount,
          window.ecmSelectCount,
          window.ce1SelectCount,
          window.ce2SelectCount,
          window.cm1SelectCount,
          window.cm2SelectCount,
          window[pfx+'SelectCount']
        ];
        selectFunctions.forEach(function(fn){
          if(typeof fn==='function'){
            try{fn(1)}catch(_e){window.nxLog&&window.nxLog(_e)}
          }
        });

        // Certains plateaux utilisent uniquement des boutons de sélection.
        var selectors=[
          '#'+pfx+'-cb1',
          '#pu-cb1','#un-cb1','#pr-cb1','#sp-cb1','#gn-cb1',
          '#sa-cb1','#mu-cb1','#ar-cb1','#hi-cb1',
          '.solo-btn',
          '[data-count="1"]','[data-players="1"]','[data-player-count="1"]',
          'button[value="1"][name*="player"]',
          'input[value="1"][name*="player"]'
        ];
        for(var i=0;i<selectors.length;i++){
          var list=[];
          try{list=Array.prototype.slice.call(document.querySelectorAll(selectors[i]))}catch(_e){window.nxLog&&window.nxLog(_e)}
          for(var j=0;j<list.length;j++){
            var el=list[j];
            if(el&&typeof el.click==='function'){
              try{el.click()}catch(_e){window.nxLog&&window.nxLog(_e)}
            }
          }
        }

        // Les listes déroulantes éventuelles sont également fixées à 1.
        Array.prototype.slice.call(document.querySelectorAll('select')).forEach(function(sel){
          var hint=clean((sel.id||'')+' '+(sel.name||'')+' '+(sel.getAttribute('aria-label')||'')).toLowerCase();
          if(/joueur|player|participant|équipe|equipe/.test(hint)){
            var hasOne=Array.prototype.some.call(sel.options||[],function(o){return String(o.value)==='1'});
            if(hasOne){sel.value='1';sel.dispatchEvent(new Event('change',{bubbles:true}))}
          }
        });

        // Un seul nom est conservé. Les champs supplémentaires sont vidés.
        var names=Array.isArray(ctx.playerNames)?ctx.playerNames:[];
        var inputs=Array.prototype.slice.call(document.querySelectorAll('input[type="text"]')).filter(function(input){
          var hint=clean((input.id||'')+' '+(input.name||'')+' '+(input.placeholder||'')).toLowerCase();
          return /joueur|player|nom|équipe|equipe/.test(hint);
        });
        inputs.forEach(function(input,index){
          input.value=index===0?String(names[0]||'Joueur Nexora'):'';
          input.dispatchEvent(new Event('input',{bubbles:true}));
          input.dispatchEvent(new Event('change',{bubbles:true}));
        });
      }catch(_e){window.nxLog&&window.nxLog(_e)}
    }

    function configuredPlayerCount(){
      if(soloMode)return 1;
      if(computerMode)return 2;
      return Math.max(2,Math.min(4,Number(ctx.playerCount||2)));
    }
    function applyConfiguredPlayers(){
      var count=configuredPlayerCount();
      try{
        var selectors=[window.selectCount,window.lectSelectCount,window.calcSelectCount,window.sciSelectCount,window.ecmSelectCount,window.ce1SelectCount,window.ce2SelectCount,window.cm1SelectCount,window.cm2SelectCount,window[String(ctx.prefix||'')+'SelectCount']];
        selectors.forEach(function(fn){if(typeof fn==='function'){try{fn(count)}catch(_e){window.nxLog&&window.nxLog(_e)}}});
        if(soloMode)forceSoloConfiguration();
        applyPlayerNames();
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      return count;
    }
    function prepareMaternelleLevelSelection(){
      var count=configuredPlayerCount();
      try{
        if(!window.__nxMaternelleLevelSelectionPrepared){
          window.__nxMaternelleLevelSelectionPrepared=true;

          var originalOpenSetup=window.openSetup;
          if(typeof originalOpenSetup==='function'){
            window.openSetup=function(){
              var result=originalOpenSetup.apply(this,arguments);
              setTimeout(function(){applyConfiguredPlayers()},0);
              return result;
            };
          }

          var originalStartGame=window.startGame;
          if(typeof originalStartGame==='function'){
            window.startGame=function(){
              applyConfiguredPlayers();
              var result=originalStartGame.apply(this,arguments);
              soloStarted=true;
              setTimeout(function(){finishStart()},0);
              return result;
            };
          }
        }

        if(typeof window.showScreen==='function')window.showScreen('menu');
        else{
          var screens=document.querySelectorAll('.screen');
          for(var i=0;i<screens.length;i++)screens[i].classList.remove('active');
          var menu=document.getElementById('screen-menu');
          if(menu)menu.classList.add('active');
        }
        window.scrollTo(0,0);
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      parentPost('nx-adams-ready',{multiplayer:multi,levelSelection:true,playerCount:count});
    }

    function prepareEcoleLevelSelection(){
      var count=configuredPlayerCount();
      try{
        if(!window.__nxEcoleLevelSelectionPrepared){
          window.__nxEcoleLevelSelectionPrepared=true;

          // Après le choix d'une matière, le mode sélectionné dans Nexora
          // (solo, ordinateur ou multijoueur) reste appliqué dans le jeu École.
          var setupFunctions=['goSetup','goSetupCalc','goSetupSci','goSetupEcm','goSetupCE1','goSetupCE2','goSetupCM1','goSetupCM2'];
          setupFunctions.forEach(function(name){
            var original=window[name];
            if(typeof original!=='function')return;
            window[name]=function(){
              var result=original.apply(this,arguments);
              setTimeout(function(){applyConfiguredPlayers()},0);
              return result;
            };
          });

          // Informe Nexora dès qu'un plateau scolaire est effectivement lancé.
          var startFunctions=['lectStartGame','calcStartGame','sciStartGame','ecmStartGame','ce1StartGame','ce2StartGame','cm1StartGame','cm2StartGame'];
          startFunctions.forEach(function(name){
            var original=window[name];
            if(typeof original!=='function')return;
            window[name]=function(){
              applyConfiguredPlayers();
              var result=original.apply(this,arguments);
              soloStarted=true;
              setTimeout(function(){
                parentPost('nx-adams-ready',{multiplayer:multi,levelSelection:false,playerCount:count});
              },0);
              return result;
            };
          });
        }

        if(typeof window.showScreen==='function')window.showScreen('menu');
        else{
          var screens=document.querySelectorAll('.screen');
          for(var i=0;i<screens.length;i++)screens[i].classList.remove('active');
          var menu=document.getElementById('screen-menu');
          if(menu)menu.classList.add('active');
        }

        // L'écran d'entrée affiche directement les classes disponibles.
        if(typeof window.showSubMenu==='function')window.showSubMenu('ce1');
        else{
          var submenus=document.querySelectorAll('[id^="submenu-"]');
          for(var j=0;j<submenus.length;j++)submenus[j].style.display='none';
          var levels=document.getElementById('submenu-ce1');
          if(levels)levels.style.display='block';
        }
        var prompt=document.querySelector('.menu-sub-lbl');
        if(prompt)prompt.textContent='Choisissez le niveau qui vous intéresse';
        window.scrollTo(0,0);
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      parentPost('nx-adams-ready',{multiplayer:multi,levelSelection:true,playerCount:count});
    }

    function fitBoard(){try{if(typeof window.__nxAdamsFitBoardV136==='function')window.__nxAdamsFitBoardV136();}catch(_e){window.nxLog&&window.nxLog(_e)}}
    window.addEventListener('resize',function(){setTimeout(fitBoard,80)});
    function finishStart(){
      try{
        var screenId=ctx.screenId||'',pfx=ctx.prefix||'';
        var menu=document.getElementById('menu');if(menu){menu.classList.remove('active');menu.style.display='none'}
        if(screenId){
          var nodes=document.querySelectorAll('.screen');for(var i=0;i<nodes.length;i++){if(nodes[i].id!==screenId){nodes[i].classList.remove('active');nodes[i].style.display='none'}}
          var screen=document.getElementById(screenId);if(screen){screen.classList.add('active');screen.style.display='block'}
        }
        var setup=document.getElementById(pfx+'-setup'),board=document.getElementById(pfx+'-game');if(setup)setup.style.display='none';if(board)board.style.display='block';
        window.scrollTo(0,0);setTimeout(fitBoard,80);setTimeout(fitBoard,360);setTimeout(fitBoard,900);setTimeout(fitBoard,1800);setTimeout(fitBoard,3000);
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      parentPost('nx-adams-ready',{multiplayer:multi});
    }
    function clickVisibleStartControls(){
      var candidates=[];
      try{candidates=Array.prototype.slice.call(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"],[onclick],[data-action]'));}catch(_e){window.nxLog&&window.nxLog(_e)}
      var best=null,bestScore=-1;
      for(var i=0;i<candidates.length;i++){
        var el=candidates[i];if(!el||!visible(el)||el.disabled)continue;
        var txt=clean(el.textContent||el.value||el.getAttribute('aria-label')||'');
        if(!/jouer maintenant|démarrer|demarrer|commencer|jouer|lancer|start|ouvrir|accéder|acceder/i.test(txt))continue;
        if(/multijoueur|inviter|ordinateur|computer|rejoindre/i.test(txt))continue;
        var r=el.getBoundingClientRect(),score=(/jouer maintenant/i.test(txt)?1000:400)+r.width+r.height;
        if(score>bestScore){best=el;bestScore=score;}
      }
      if(best){try{best.click();return true}catch(_e){window.nxLog&&window.nxLog(_e)}}
      return false;
    }

    function directStart(){
      startTries++;
      var key=ctx.gameKey||'',screenId=ctx.screenId||'',pfx=ctx.prefix||'',minPlayers=computerMode?2:1,count=soloMode?1:Math.max(minPlayers,Math.min(4,Number(ctx.playerCount||minPlayers)));
      try{
        if(soloMode)forceSoloConfiguration();
        applyPlayerNames();

        if(key==='maternelle'){
          prepareMaternelleLevelSelection();
          return;
        }

        if(key==='ecole'){
          prepareEcoleLevelSelection();
          return;
        }

        if(typeof window.launchGame==='function'&&/^(preuniv|univ|pro|sport|guinee|sante|musique|art|histoire)$/.test(key)){
          try{window.launchGame(key)}catch(_launchError){window.nxLog&&window.nxLog(_launchError)}
        }else if(screenId&&typeof window.showScreen==='function')window.showScreen(screenId);

        var selectFn=window[pfx+'SelectCount'],startFn=window[pfx+'StartGame'],gameObj=window[pfx+'Game'];
        if(typeof selectFn==='function')selectFn(count);
        else if(gameObj&&typeof gameObj.selectCount==='function')gameObj.selectCount(count);

        if(soloMode)forceSoloConfiguration();
        applyPlayerNames();

        if(typeof startFn==='function'){
          startFn();soloStarted=true;setTimeout(clickVisibleStartControls,60);setTimeout(clickVisibleStartControls,220);finishStart();return;
        }
        if(gameObj&&typeof gameObj.startGame==='function'){
          gameObj.startGame();soloStarted=true;setTimeout(clickVisibleStartControls,60);setTimeout(clickVisibleStartControls,220);finishStart();return;
        }

        var genericStart=window.startGame;
        if(typeof genericStart==='function'){
          try{
            var pc=document.getElementById('playerCount');
            if(pc){
              if(count===1&&!Array.prototype.some.call(pc.options||[],function(o){return String(o.value)==='1'})){
                var one=document.createElement('option');one.value='1';one.textContent='1 joueur';pc.insertBefore(one,pc.firstChild||null);
              }
              pc.value=String(count);
              if(!pc.value&&pc.options&&pc.options.length)pc.selectedIndex=0;
              pc.dispatchEvent(new Event('change',{bubbles:true}));
            }
            var ts=document.getElementById('targetScore');if(ts&&!ts.value)ts.value='20';
            if(soloMode)forceSoloConfiguration();
            applyPlayerNames();
          }catch(_e){window.nxLog&&window.nxLog(_e)}
          genericStart();soloStarted=true;setTimeout(clickVisibleStartControls,60);setTimeout(clickVisibleStartControls,220);finishStart();return;
        }

        // Dernier recours : cliquer automatiquement sur un contrôle visible de démarrage.
        if(soloMode||computerMode){
          if(soloMode)forceSoloConfiguration();
          if(clickVisibleStartControls()){
            soloStarted=true;
            
            setTimeout(function(){finishStart()},120);
            return;
          }
        }

        var setup=document.getElementById(pfx+'-setup'),board=document.getElementById(pfx+'-game');
        if(setup&&board){
          setup.style.display='none';board.style.display='block';
          setTimeout(clickVisibleStartControls,60);
          
          soloStarted=true;finishStart();return;
        }
      }catch(_e){window.nxLog&&window.nxLog(_e)}

      if(startTries<80)setTimeout(directStart,120);
      else parentPost('nx-adams-ready',{multiplayer:multi,partial:true,solo:soloMode,playerCount:count});
    }
    function normalizedPlayerName(v){
      return clean(v).toLowerCase().normalize?clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim():clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    }
    function computerTurnActive(){
      if(!computerMode)return false;
      var expected=normalizedPlayerName(computerName||'Ordinateur Adams');
      try{
        var arrays=[window.compPlayers,window.players,window[(ctx.prefix||'')+'Players'],window[(ctx.prefix||'')+'players']];
        var indices=[window.currentPlayer,window.cur,window.playerIndex,window.turnIndex,window.activePlayerIndex];
        for(var a=0;a<arrays.length;a++){
          var list=arrays[a];if(!Array.isArray(list)||!list.length)continue;
          for(var x=0;x<indices.length;x++){
            var idx=Number(indices[x]),computerIndex=Math.max(0,Number(ctx.computerSlot||2)-1);
            if(Number.isInteger(idx)&&idx>=0&&idx<list.length){
              var nm=normalizedPlayerName(list[idx]&&(list[idx].name||list[idx].nom||list[idx].display_name||list[idx].label));
              if(idx===computerIndex)return true;
              if(nm&&(nm.indexOf(expected)>-1||nm.indexOf('ordinateur')>-1||nm.indexOf('computer')>-1||nm==='ia'))return true;
            }
          }
        }
        var game=window[(ctx.prefix||'')+'Game'];
        if(game&&typeof game.getState==='function'){
          var gs=game.getState()||{},gp=gs.players||[],gi=Number(gs.currentPlayer!=null?gs.currentPlayer:gs.cur);
          if(gp[gi]){var gn=normalizedPlayerName(gp[gi].name||gp[gi].display_name);if(gn.indexOf('ordinateur')>-1||gn.indexOf('computer')>-1)return true;}
        }
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      var text='';
      try{
        var nodes=document.querySelectorAll('#turnBox,[id*="turn"],[class*="turn"],.scorecard.active,.sc-card.active,.sc-card.cur,.comp-player.active,.player-card.active,.ap-name,[id$="-ap-name"],[id*="active-player"],[class*="active-player"],#qPlayer,[id$="-q-who"]');
        for(var i=0;i<nodes.length;i++)if(visible(nodes[i]))text+=' '+clean(nodes[i].textContent);
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      text=normalizedPlayerName(text);
      var computerSlot=Math.max(1,Number(ctx.computerSlot||2));
      return text.indexOf(expected)>-1||text.indexOf('ordinateur adams')>-1||text.indexOf('ordinateur')>-1||text.indexOf('computer')>-1||new RegExp('(?:joueur|player|equipe|équipe)\\s*'+computerSlot+'(?:\\b|$)','i').test(text);
    }
    function visibleEnabled(selector){
      try{return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function(el){return visible(el)&&!el.disabled&&!el.classList.contains('disabled')&&getComputedStyle(el).pointerEvents!=='none'})}catch(_e){return []}
    }
    function safeClick(el){
      if(!el)return false;
      try{if(typeof el.click==='function')el.click();else el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return true}catch(_e){return false}
    }
    function computerCorrectIndex(){
      try{
        if(window.compCurQ&&window.compCurQ.data&&Number.isInteger(Number(window.compCurQ.data.answer)))return Number(window.compCurQ.data.answer);
        if(window.compCurQ&&Number.isInteger(Number(window.compCurQ.ans)))return Number(window.compCurQ.ans);
        if(window.currentQuestion&&Number.isInteger(Number(window.currentQuestion.answer)))return Number(window.currentQuestion.answer);
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      var choices=visibleEnabled('.choice,.option,.answer-option,[data-answer],.q-choice');
      for(var i=0;i<choices.length;i++)if(String(choices[i].dataset&&choices[i].dataset.correct||'')==='1'||choices[i].classList.contains('correct-answer'))return i;
      return -1;
    }
    function completedTurnButton(){
      var exact=visibleEnabled('[id$="-q-next"],#q-next,#nextBtn,.q-next,.next-turn,.comp-next-btn.show');
      for(var i=0;i<exact.length;i++){
        var t=clean(exact[i].textContent);
        if(/tour suivant|suivant|continuer|prochain|valider|terminer|next/i.test(t))return exact[i];
      }
      var disabledChoices=[];
      try{disabledChoices=Array.prototype.slice.call(document.querySelectorAll('.choice,.option,.answer-option,[data-answer],.q-choice')).filter(function(el){return visible(el)&&el.disabled})}catch(_e){window.nxLog&&window.nxLog(_e)}
      if(!disabledChoices.length)return null;
      var all=visibleEnabled('button,[role="button"]');
      for(var j=0;j<all.length;j++)if(/tour suivant|suivant|continuer|prochain|next/i.test(clean(all[j].textContent)))return all[j];
      return null;
    }
    function humanTurnCompleted(){
      if(computerTurnActive())return false;
      try{if(window.questionAnswered===true||window.qAnswered===true)return !!completedTurnButton()}catch(_e){window.nxLog&&window.nxLog(_e)}
      return !!completedTurnButton();
    }
    function selectComputerParticipant(){
      try{
        var fallbackIndex=Math.max(0,Number(ctx.computerSlot||2)-1),idx=fallbackIndex;
        if(Array.isArray(window.compPlayers)&&window.compPlayers.length){
          var named=window.compPlayers.findIndex(function(p){return /ordinateur|computer|\bia\b/i.test(String(p&&(p.name||p.nom)||''))});
          if(named>=0)idx=named;
          if(typeof window.compSelectWho==='function')window.compSelectWho(idx);
          var b=document.getElementById('comp-who-'+idx);if(b)safeClick(b);
        }
        var selectors=['[data-player-index="'+idx+'"]','[data-player="'+(idx+1)+'"]','#player-'+idx,'#joueur-'+(idx+1)];
        for(var i=0;i<selectors.length;i++){
          var el=document.querySelector(selectors[i]);if(visible(el)){safeClick(el);break;}
        }
      }catch(_e){window.nxLog&&window.nxLog(_e)}
    }
    function answerChoiceElements(){
      return visibleEnabled('.choice,.option,.answer-option,[data-answer],.q-choice,.q-option,.answer-btn,.choice-btn');
    }
    function currentQuestionText(){
      var selectors=['#questionText','#qText','#q-text','#question','[id$="-q-text"]','[id$="-question"]','.question-text','.q-text','.question'];
      var text='';
      for(var i=0;i<selectors.length;i++){
        var nodes=[];try{nodes=Array.prototype.slice.call(document.querySelectorAll(selectors[i]))}catch(_e){window.nxLog&&window.nxLog(_e)}
        for(var j=0;j<nodes.length;j++)if(visible(nodes[j])){var t=clean(nodes[j].textContent);if(t.length>text.length)text=t;}
      }
      return text.slice(0,500);
    }
    function hashText(value){
      var h=2166136261,s=String(value||'');
      for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
      return (h>>>0).toString(36);
    }
    function expandedCorrectIndex(choices){
      var candidates=[];
      try{
        var pfx=String(ctx.prefix||'');
        candidates=[window.compCurQ,window.currentQuestion,window.currentQ,window.curQ,window.question,window.lectCurQ,window.calcCurQ,window.qCurrent,window[pfx+'CurQ'],window[pfx+'CurrentQuestion']];
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      for(var i=0;i<candidates.length;i++){
        var q=candidates[i];if(!q||typeof q!=='object')continue;
        var values=[q.answer,q.ans,q.correct,q.correctIndex,q.correct_answer,q.data&&q.data.answer,q.data&&q.data.ans];
        for(var j=0;j<values.length;j++){
          var n=Number(values[j]);if(Number.isInteger(n)&&n>=0&&n<(choices||[]).length)return n;
        }
      }
      return computerCorrectIndex();
    }
    function clickedAnswerWasCorrect(choice,index,correctIndex){
      if(Number.isInteger(correctIndex)&&correctIndex>=0)return index===correctIndex;
      var cls=String(choice&&choice.className||'').toLowerCase();
      if(/correct|bonne|right|success|vrai/.test(cls))return true;
      if(/wrong|incorrect|mauvaise|error|faux/.test(cls))return false;
      var result='';
      try{
        var nodes=document.querySelectorAll('[id*="result"],[class*="result"],[id*="feedback"],[class*="feedback"],.q-result');
        for(var i=0;i<nodes.length;i++)if(visible(nodes[i]))result+=' '+clean(nodes[i].textContent);
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      if(/bonne réponse|bonne reponse|correct|bravo|félicitations|felicitations/i.test(result))return true;
      if(/mauvaise réponse|mauvaise reponse|incorrect|pas tout à fait|faux/i.test(result))return false;
      return false;
    }
    function emitAnswerEvent(choice,choices,index,correctIndex,actor){
      var question=currentQuestionText(),sequence=++answerSequence;
      setTimeout(function(){
        var correct=clickedAnswerWasCorrect(choice,index,correctIndex);
        var questionKey=String(ctx.gameInstanceId||'game')+'|q'+sequence+'|'+hashText(question||('question-'+sequence));
        parentPost('nx-adams-answer-event',{
          questionInstanceId:questionKey,
          questionText:question,
          actorType:actor,
          correct:!!correct,
          answerIndex:index,
          correctIndex:Number.isInteger(correctIndex)?correctIndex:null,
          pointsAwarded:correct?1:0
        });
      },90);
    }
    document.addEventListener('click',function(ev){
      if(replaying||answerLocked)return;
      var choice=ev.target&&ev.target.closest?ev.target.closest('.choice,.option,.answer-option,[data-answer],.q-choice,.q-option,.answer-btn,.choice-btn'):null;
      if(!choice||!visible(choice))return;
      var choices=answerChoiceElements(),index=choices.indexOf(choice);if(index<0)return;
      answerLocked=true;
      var actor=(computerMode&&(computerPhase||computerTurnActive()))?'computer':'player';
      emitAnswerEvent(choice,choices,index,expandedCorrectIndex(choices),actor);
    },false);
    setInterval(function(){
      var choices=answerChoiceElements(),signature=currentQuestionText();
      if(choices.length&&signature&&signature!==lastQuestionSignature){lastQuestionSignature=signature;answerLocked=false;}
      if(!choices.length&&completedTurnButton()==null&&answerLocked)setTimeout(function(){answerLocked=false},180);
    },260);

    function computerStep(){
      if(!computerMode||computerBusy||resultSent)return;
      var actualComputer=computerTurnActive();
      if(actualComputer&&!computerPhase){computerPhase=true;computerPhaseStartedAt=Date.now();}
      var humanNext=!computerPhase&&humanTurnCompleted()?completedTurnButton():null;
      if(!computerPhase&&!humanNext)return;
      computerBusy=true;
      setTimeout(function(){
        try{
          if(humanNext){
            computerPhase=true;computerPhaseStartedAt=Date.now();answerLocked=false;lastQuestionSignature='';
            safeClick(humanNext);return;
          }
          selectComputerParticipant();
          var next=completedTurnButton();
          if(next){
            safeClick(next);
            computerPhase=false;computerPhaseStartedAt=0;answerLocked=false;lastQuestionSignature='';
            return;
          }
          var choices=answerChoiceElements();
          if(choices.length){
            var correct=expandedCorrectIndex(choices),level=String(ctx.computerLevel||'normal'),chance=level==='expert'?0.92:(level==='facile'?0.52:0.74),idx=(correct>=0&&correct<choices.length&&Math.random()<chance)?correct:Math.floor(Math.random()*choices.length);
            safeClick(choices[idx]);return;
          }
          var reveal=visibleEnabled('#comp-reveal-btn,.comp-reveal-btn.show,[data-action="reveal-answer"]').filter(function(el){return /réponse|reponse|voir|afficher/i.test(clean(el.textContent))});
          if(reveal.length){safeClick(reveal[0]);return;}
          var verdict=visibleEnabled('.comp-verdict-btn,[data-correct],button').filter(function(el){return /correct|bonne réponse|bonne reponse|oui|faux|incorrect|non/i.test(clean(el.textContent))});
          if(verdict.length){
            var level2=String(ctx.computerLevel||'normal'),ok=Math.random()<(level2==='expert'?0.92:(level2==='facile'?0.52:0.74));
            var wanted=verdict.filter(function(el){var t=clean(el.textContent);return ok?/correct|bonne|oui/i.test(t):/faux|incorrect|non/i.test(t)});
            safeClick((wanted[0]||verdict[0]));return;
          }
          var confirm=visibleEnabled('#comp-confirm-btn.comp-confirm-btn.show,.comp-confirm-btn.show,[data-action="confirm-points"]');
          if(confirm.length){safeClick(confirm[0]);return;}
          var board=visibleEnabled('.disc-card,.bonus-cell,.cell[onclick],button[data-disc],button[data-question],.dice,[class*="dice"],.subject-card,.category-card');
          board=board.filter(function(el){return !/(retour|quitter|reset|recommencer|fermer|close|menu|tour suivant)/i.test(clean(el.textContent))});
          if(board.length){safeClick(board[Math.floor(Math.random()*board.length)]);return;}
          if(computerPhase&&computerPhaseStartedAt&&Date.now()-computerPhaseStartedAt>12000&&!computerTurnActive()){
            computerPhase=false;computerPhaseStartedAt=0;answerLocked=false;lastQuestionSignature='';
          }
        }catch(_e){window.nxLog&&window.nxLog(_e)}
        finally{setTimeout(function(){computerBusy=false},560)}
      },420+Math.floor(Math.random()*480));
    }
    setInterval(computerStep,500);
    function collectScores(){
      var out=[],seen={};
      function addObjectPlayer(p,index){
        if(!p||typeof p!=='object')return;
        var name=p.name||p.nom||p.display_name||p.label||('Joueur '+(index+1));
        var raw=p.score;if(raw===undefined)raw=p.points;if(raw===undefined)raw=p.total_points;if(raw===undefined)raw=p.total;
        if(raw!==undefined)add(name,raw);
      }
      function addArray(arr){if(!Array.isArray(arr))return;arr.forEach(addObjectPlayer)}
      try{
        addArray(window.compPlayers);addArray(window.players);
        var pref=String(ctx.prefix||'');
        addArray(window[pref+'Players']);addArray(window[pref+'players']);
        var obj=window[pref+'Game'];if(obj){addArray(obj.players);addArray(obj.state&&obj.state.players)}
        if(window.game){addArray(window.game.players);addArray(window.game.state&&window.game.state.players)}
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      function add(name,score){
        score=Number(score);name=clean(name).replace(/(?:score|points?|pts?|case|position)\b.*$/i,'').replace(/[🏆🥇🥈🥉]/g,'').trim();
        if(!isFinite(score)||score<0)return;
        if(!name)name='Joueur '+(out.length+1);
        var k=name.toLowerCase()+'|'+score;if(seen[k])return;seen[k]=true;out.push({name:name.slice(0,80),score:Math.round(score)});
      }
      var selectors='.sc-card,.comp-player,.player-card,.score-card,.score-row,.scoreboard>*,[class*="player-score"],[class*="score-player"],[id*="scoreboard"]>*';
      try{
        Array.prototype.slice.call(document.querySelectorAll(selectors)).forEach(function(el){
          var t=clean(el.textContent);if(!t||t.length>260)return;
          var m=t.match(/(-?\d+)\s*(?:pts?|points?)/i)||t.match(/(?:score|total)\s*[:\-]?\s*(-?\d+)/i);
          if(m)add(t.slice(0,m.index),m[1]);
        });
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      return out.slice(0,4);
    }
    var lastLiveScoreSignature='';
    function emitLiveScore(){
      if(resultSent)return;
      var scores=collectScores();if(!scores.length)return;
      var sig=scores.map(function(x){return x.name+':'+x.score}).join('|');if(sig===lastLiveScoreSignature)return;lastLiveScoreSignature=sig;
      parentPost('nx-adams-live-score',{scores:scores,playMode:ctx.playMode||'solo'});
    }
    setInterval(emitLiveScore,650);
    function resultCandidate(){
      var nodes=[];
      try{nodes=Array.prototype.slice.call(document.querySelectorAll('[id*="win"],[class*="win"],[id*="victory"],[class*="victory"],[id*="winner"],[class*="winner"],[id*="recap"],[class*="recap"],[id*="result"],[class*="result"]'))}catch(_e){window.nxLog&&window.nxLog(_e)}
      for(var i=0;i<nodes.length;i++){
        var text=clean(nodes[i].textContent);
        if(visible(nodes[i])&&text.length>5&&/(score final|partie termin|victoire|gagnant|gagné|bravo|félicitations|champion)/i.test(text))return text.slice(0,1500);
      }
      return '';
    }
    function emitResult(manual){
      if(resultSent)return;
      var text=resultCandidate(),scores=collectScores(),score=0,detected=false,source='';
      if(!manual&&!text)return;
      var m=(text||'').match(/(?:score(?:\s+final)?|total)\s*[:\-]?\s*(\d+)/i)||(text||'').match(/(\d+)\s*(?:points?|pts?)/i);
      if(m){score=Number(m[1]);detected=isFinite(score);source='result_screen'}
      if(scores.length){detected=true;source=source||'game_state'}
      if(!detected){parentPost('nx-adams-score-unavailable',{manual:!!manual,text:text});return}
      score=Math.max(0,Math.round(Number(score)||0));resultSent=true;
      parentPost('nx-adams-game-result',{manual:!!manual,text:text,score:score,scoreDetected:!!m,scoreSource:source,playMode:ctx.playMode||'solo',scores:scores,resultKey:String(ctx.gameInstanceId||'game')});
    }
    setInterval(function(){if(!resultSent)emitResult(false)},700);
    function announceFrameReady(){
      if(frameReadySent)return;frameReadySent=true;
      parentPost('nx-adams-frame-ready',{deferred:ctx.deferStart===true});
      if(startAuthorized&&!officialStartTriggered){officialStartTriggered=true;setTimeout(directStart,180)}
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',announceFrameReady,{once:true});
    else setTimeout(announceFrameReady,0);
  }

  function scriptTag(id,code){code=String(code||'').replace(/<\/script/gi,'<\\/script');return '<scr'+'ipt id="'+id+'">'+code+'</scr'+'ipt>'}
  var DIRECT_GAME_CACHE=Object.create(null);
  
  
  function buildDirectGameHtml(rawHtml,key,context){
    /* V414 — cadrage plein écran sans réduction miniature du plateau. */
    var html=String(rawHtml||'');
    if(!html)return html;
    var viewport='<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">';
    if(/<meta[^>]+name=["']viewport["'][^>]*>/i.test(html))html=html.replace(/<meta[^>]+name=["']viewport["'][^>]*>/i,viewport);
    else if(/<head[^>]*>/i.test(html))html=html.replace(/<head([^>]*)>/i,'<head$1>'+viewport);
    var fitCss='<style id="nx-adams-viewport-fit-v133">'+
      'html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;overscroll-behavior-x:none!important}'+
      'body{box-sizing:border-box!important}'+
      '.wrap,.container,.layout,.boardbox,.game-container,.game-screen,.screen,.screen.active{min-width:0!important;max-width:100%!important}'+
      '.boardbox,.game-board-wrap,.plateau-wrap{width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:auto!important;overflow-y:visible!important;-webkit-overflow-scrolling:touch}'+
      'canvas,svg,img,video{max-width:100%}'+
      '</style>';
    if(html.indexOf('nx-adams-viewport-fit-v133')<0){
      if(/<\/head>/i.test(html))html=html.replace(/<\/head>/i,fitCss+'</head>');
      else html=fitCss+html;
    }
    function nxAdamsViewportFitV134(){
      'use strict';
      /* V414 — aucun scale() automatique. Les plateaux conservent une taille
         lisible et se réorganisent dans la largeur réelle du téléphone. */
      var frame=0,resizeObserver=null,observed=null;
      function isVisible(el){
        if(!el)return false;
        try{var s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>4&&r.height>4}catch(_e){return false}
      }
      function clearLegacyFit(el){
        if(!el)return;
        el.style.removeProperty('transform');
        el.style.removeProperty('transform-origin');
        el.style.removeProperty('margin-left');
        el.style.removeProperty('margin-right');
        el.style.removeProperty('margin-bottom');
        el.style.width='100%';
        el.style.maxWidth='100%';
        el.style.minWidth='0';
        el.removeAttribute('data-nx-fitted-v133');
        var p=el.parentElement;
        if(p){
          p.style.removeProperty('height');
          p.style.removeProperty('min-height');
          p.style.width='100%';
          p.style.maxWidth='100%';
          p.style.minWidth='0';
          p.style.overflowX='auto';
          p.removeAttribute('data-nx-fit-parent-v133');
        }
      }
      function findBoard(){
        var selectors=['#cp-board-wrap','.g-inner','.board-shell','.game-board','.board-container','.plateau','.board','[id$="-board"]','[id*="plateau"]','.screen.active .g-inner','.game-screen.active'];
        for(var s=0;s<selectors.length;s++){
          var list=[];try{list=document.querySelectorAll(selectors[s])}catch(_e){window.nxLog&&window.nxLog(_e)}
          for(var i=0;i<list.length;i++)if(isVisible(list[i]))return list[i];
        }
        return null;
      }
      function observe(el){
        if(observed===el)return;
        if(resizeObserver)try{resizeObserver.disconnect()}catch(_e){window.nxLog&&window.nxLog(_e)}
        observed=el;
        if(typeof ResizeObserver==='function'&&el){
          resizeObserver=new ResizeObserver(function(){schedule()});
          try{resizeObserver.observe(el)}catch(_e){window.nxLog&&window.nxLog(_e)}
        }
      }
      function fit(){
        frame=0;
        var board=findBoard();if(!board)return;
        observe(board);clearLegacyFit(board);
        document.documentElement.style.width='100%';
        document.documentElement.style.maxWidth='100%';
        document.documentElement.style.overflowX='hidden';
        document.body.style.width='100%';
        document.body.style.maxWidth='100%';
        document.body.style.overflowX='hidden';
        try{window.scrollTo({left:0,top:window.scrollY||0,behavior:'auto'})}catch(_e){window.scrollTo(0,window.scrollY||0)}
      }
      function schedule(){if(frame)return;frame=requestAnimationFrame(function(){requestAnimationFrame(fit)})}
      window.__nxAdamsFitBoardV136=schedule;
      window.__nxAdamsFitBoardV414=schedule;
      window.addEventListener('resize',schedule,{passive:true});
      window.addEventListener('orientationchange',function(){setTimeout(schedule,120)},{passive:true});
      window.addEventListener('load',schedule,{once:true});
      document.addEventListener('click',function(){setTimeout(schedule,40);setTimeout(schedule,260)},{passive:true});
      if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
      setTimeout(schedule,120);setTimeout(schedule,480);setTimeout(schedule,1100);
    }
    context=Object.assign({},context||{},{gameKey:key,screenId:SCREEN_BY_GAME[key]||'',prefix:PREFIX_BY_GAME[key]||''});
    var adapterCode='/* nx-adams-runtime-v414 */('+nxAdamsViewportFitV134.toString()+')();window.__NEXORA_ADAMS_CONTEXT='+JSON.stringify(context).replace(/<\/script/gi,'<\\/script')+';('+nxAdamsChildRuntime.toString()+')();';
    adapterCode=adapterCode.replace(/<\/script/gi,'<\\/script');
    var inlineScript=/<script(?![^>]*\bsrc=)[^>]*>/i.exec(html);
    if(inlineScript){var scriptInsert=inlineScript.index+inlineScript[0].length;html=html.slice(0,scriptInsert)+adapterCode+html.slice(scriptInsert);}
    else{var bodyMatch=/<body[^>]*>/i.exec(html),insertAt=bodyMatch?bodyMatch.index+bodyMatch[0].length:0;html=html.slice(0,insertAt)+scriptTag('nx-adams-runtime-v136',adapterCode)+html.slice(insertAt);}
    var fitScript='';
    return html;
  }
  window.NexoraBuildAdamsGameHtmlV221=buildDirectGameHtml;
  function validAdamsModuleHtml(html){
    html=String(html||'');
    if(!/<html(?:\s|>)/i.test(html))return false;
    if(/<title>\s*Nexora hors connexion\s*<\/title>/i.test(html))return false;
    return true;
  }
  function gameModulePath(key){
    var game=GAME_REGISTRY.get(key);
    if(!game)throw new Error('Jeu Adams non reconnu.');
    return game.path;
  }
  function embeddedAdamsModuleHtml(key){
    var store=window.NexoraEmbeddedAdamsGames||{};
    var encoded=store[canonicalGameKey(key)]||'';
    if(!encoded)return '';
    try{
      var binary=atob(encoded),bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      var html=typeof TextDecoder==='function'?new TextDecoder('utf-8').decode(bytes):decodeURIComponent(escape(binary));
      return validAdamsModuleHtml(html)?html:'';
    }catch(_embeddedError){return ''}
  }
  function shouldPreferEmbeddedGame(){
    var protocol=String(location&&location.protocol||'').toLowerCase();
    return protocol==='file:'||protocol==='content:'||protocol==='data:'||protocol==='blob:';
  }
  function fetchAdamsModule(path){
    var controller=typeof AbortController==='function'?new AbortController():null;
    var timer=controller?setTimeout(function(){controller.abort()},12000):null;
    var url=new URL(path,document.baseURI).href;
    return fetch(url,{cache:'no-store',credentials:'same-origin',signal:controller?controller.signal:undefined}).then(function(response){
      if(!response||!response.ok)throw new Error('Plateau indisponible ('+(response&&response.status||0)+').');
      return response.text();
    }).then(function(html){
      if(!validAdamsModuleHtml(html))throw new Error('Le fichier reçu ne contient pas le plateau demandé.');
      return html;
    }).finally(function(){if(timer)clearTimeout(timer)});
  }
  /* ---- V470 : les 9 plateaux de theme partagent un seul moteur ----
     art, guinee, histoire, musique, preuniv, pro, sante, sport et univ etaient
     neuf copies du meme fichier de 515 Ko, differentes par le titre, l'emoji et
     le sous-titre. Chaque plateau est maintenant une fiche de quelques centaines
     d'octets ; le moteur est telecharge une seule fois puis garde en memoire. */
  var NX_MOTEUR_V470='modules/jeu-adams/_moteur/plateau.html';
  var nxMoteurEnCoursV470=null;
  function nxFicheThemeV470(html){
    var m=/<script[^>]+id="nx-adams-theme-v470"[^>]*>([\s\S]*?)<\/script>/i.exec(String(html||''));
    if(!m)return null;
    try{
      var fiche=JSON.parse(m[1]);
      return (fiche&&fiche.cle)?fiche:null;
    }catch(_ficheError){return null}
  }
  function nxMoteurV470(chemin){
    if(nxMoteurEnCoursV470)return nxMoteurEnCoursV470;
    var lecture=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.text==='function')
      ?Promise.resolve(window.NexoraSecureContent.text(chemin)).then(function(html){
          if(!validAdamsModuleHtml(html))throw new Error('Moteur securise vide.');
          return html;
        })
      :Promise.reject(new Error('Lecture securisee indisponible.'));
    nxMoteurEnCoursV470=lecture.catch(function(){return fetchAdamsModule(chemin)})
      .catch(function(erreur){nxMoteurEnCoursV470=null;throw erreur});
    return nxMoteurEnCoursV470;
  }
  function nxTexteSurV470(valeur){
    return String(valeur==null?'':valeur).replace(/[&<>"]/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];
    });
  }
  function nxComposePlateauV470(html){
    var fiche=nxFicheThemeV470(html);
    if(!fiche)return Promise.resolve(html);
    return nxMoteurV470(fiche.moteur||NX_MOTEUR_V470).then(function(moteur){
      var cle=String(fiche.cle||'').replace(/[^a-z0-9_-]/gi,'');
      return String(moteur)
        .split('%%NX_NOM%%').join(nxTexteSurV470(fiche.nom))
        .split('%%NX_EMOJI%%').join(nxTexteSurV470(fiche.emoji))
        .split('%%NX_SOUS_TITRE%%').join(nxTexteSurV470(fiche.sousTitre))
        .split('%%NX_CLE%%').join(cle);
    });
  }
  function loadAdamsModuleHtml(primaryKey){
    var key=canonicalGameKey(primaryKey),path=gameModulePath(key),embedded=embeddedAdamsModuleHtml(key);
    if(shouldPreferEmbeddedGame()&&embedded)return nxComposePlateauV470(embedded).then(function(html){return {html:html,key:key,source:'embedded'}});
    var secure=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.text==='function')
      ?Promise.resolve(window.NexoraSecureContent.text(path)).then(function(html){if(!validAdamsModuleHtml(html))throw new Error('Contenu sécurisé vide.');return html})
      :Promise.reject(new Error('Lecture sécurisée indisponible.'));
    return secure
      .catch(function(error){if(key==='guinee'||key==='kdo')return fetchAdamsModule(path);throw error})
      .catch(function(error){if(embedded)return embedded;throw error})
      .then(nxComposePlateauV470)
      .then(function(html){return {html:html,key:key,source:embedded&&html===embedded?'embedded':'network'}});
  }
  function releaseFrameObjectUrl(){
    if(!state.frameObjectUrl)return;
    try{URL.revokeObjectURL(state.frameObjectUrl)}catch(_revokeError){window.nxLog&&window.nxLog(_revokeError)}
    state.frameObjectUrl=null;
  }
  function mountHtmlGame(wrap,html,label){
    wrap.innerHTML='';releaseFrameObjectUrl();
    var frame=document.createElement('iframe');frame.className='nx-adams-game-frame';frame.setAttribute('data-nx-adams-game-frame','');frame.setAttribute('title',safeText(label||'Jeu Adams'));frame.setAttribute('allow','autoplay; fullscreen; clipboard-write');frame.setAttribute('allowfullscreen','');frame.setAttribute('referrerpolicy','no-referrer');
    wrap.appendChild(frame);state.frame=frame;state.frameReady=false;
    try{
      var blob=new Blob([html],{type:'text/html;charset=utf-8'});
      state.frameObjectUrl=URL.createObjectURL(blob);
      frame.src=state.frameObjectUrl;
    }catch(err){
      try{frame.srcdoc=html}catch(_srcdocError){frame.src='data:text/html;charset=utf-8,'+encodeURIComponent(html)}
    }
    setTimeout(function(){try{frame.focus()}catch(_e){window.nxLog&&window.nxLog(_e)}},240);return frame;
  }
  function mountUrlGame(wrap,url,label){
    wrap.innerHTML='';
    var frame=document.createElement('iframe');frame.className='nx-adams-game-frame';frame.setAttribute('data-nx-adams-game-frame','');frame.setAttribute('title',safeText(label||'Jeu Adams'));frame.setAttribute('allow','autoplay; fullscreen; clipboard-write');frame.setAttribute('allowfullscreen','');frame.setAttribute('referrerpolicy','no-referrer');frame.src=url;
    wrap.appendChild(frame);state.frame=frame;state.frameReady=true;return frame;
  }
  function launchGameSource(key,label,context){
    context=context||{};key=String(key||'').trim().replace(/[^a-z0-9_-]/gi,'');
    var modal=openModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal);
    var choosingLevel=key==='maternelle'||key==='ecole';
    setHeader(label||titleFromKey(key),choosingLevel?'Choisis le niveau':(context.multiplayer?'Mise à jour du plateau':(context.playMode==='computer'?'Ordinateur Adams joue automatiquement':(context.playMode==='solo'?'Démarrage solo automatique':'Préparation du plateau'))),context.multiplayer&&state.room?('Code '+state.room.code):'',false);
    showLoading(wrap,label||titleFromKey(key),choosingLevel?'Ouverture de l’interface des niveaux.':(context.multiplayer?'Chargement du même plateau sur tous les téléphones.':(context.playMode==='solo'?'Ouverture immédiate avec un seul joueur.':'Préparation du plateau et des questions.')));
    return Promise.all([resolveGameConfig(key,label),delay(choosingLevel?220:60)]).then(function(parts){
      var cfg=parts[0]||{},requestedKey=canonicalGameKey(key),configuredKey=canonicalGameKey(cfg.launch_key||cfg.slug||requestedKey),finalKey=LOCAL_ADAMS_GAME_KEYS[requestedKey]?requestedKey:configuredKey,finalTitle=cfg.title||label||titleFromKey(finalKey);
      state.gameKey=finalKey;state.gameTitle=finalTitle;context.gameInstanceId=context.gameInstanceId||state.gameInstanceId||randomId();context.seed=toNumber(context.seed,Math.floor(Math.random()*2147483000)+1);
      var finalChoosingLevel=finalKey==='maternelle'||finalKey==='ecole';
      setHeader(finalTitle,finalChoosingLevel?'Choisis le niveau':(context.multiplayer?'Partie en ligne':(context.playMode==='computer'?'Ordinateur Adams joue automatiquement':'Partie solo')),context.multiplayer&&state.room?('Code '+state.room.code):'',!finalChoosingLevel);
      var isIndividualChallenge=!!context.individualChallenge;
      if(!isIndividualChallenge&&!context.multiplayer&&(cfg.launch_mode==='public_url'||cfg.launch_mode==='route')&&cfg.public_url){mountUrlGame(wrap,cfg.public_url,finalTitle);return true}
      return loadAdamsModuleHtml(finalKey,configuredKey).then(function(module){
        finalKey=module.key||finalKey;
        state.gameKey=finalKey;
        mountHtmlGame(wrap,buildDirectGameHtml(module.html,finalKey,context),finalTitle);
        return true;
      }).catch(function(err){
        wrap.innerHTML='<div class="nx-adams-game-loading"><div><strong>Jeu Adams indisponible</strong><span>Le plateau '+esc(finalTitle)+' n’a pas pu être chargé. Ferme cette fenêtre puis réessaie une seule fois.</span><button type="button" class="nx-adams-game-retry-v127" data-nx-adams-retry>Réessayer</button></div></div>';
        var retry=qs('[data-nx-adams-retry]',wrap);
        if(retry)retry.addEventListener('click',function(){launchGameSource(finalKey,finalTitle,context);},{once:true});
        notify('Impossible d’ouvrir ce Jeu Adams.');
        try{window.dispatchEvent(new CustomEvent('nexora:adams-load-failed',{detail:{game_key:finalKey,message:String(err&&err.message||err||'Plateau indisponible.')}}))}catch(_dispatchError){window.nxLog&&window.nxLog(_dispatchError)}
        try{console.error('Chargement Jeu Adams',finalKey,err);}catch(_e){window.nxLog&&window.nxLog(_e)}
        return false;
      });
    });
  }
  function openGame(key,label){
    resetSession(false);state.mode='solo';state.gameKey=canonicalGameKey(key);state.gameTitle=label||titleFromKey(state.gameKey);state.gameInstanceId=randomId();
    var seed=Math.floor(Math.random()*2147483000)+1;
    var activePlayContext=window.__NEXORA_ADAMS_PLAY_CONTEXT||null;
    var individualChallenge=!!(activePlayContext&&String(activePlayContext.type||'')==='individual_challenge');
    return getIdentity(false).then(function(identity){
      state.identity=identity;
      return startTrackedSession('solo',identity,{seed:seed}).then(function(session){
        if(individualChallenge&&!session)throw new Error('La session sécurisée du Défi individuel n’a pas pu être créée. Réessaie avec une connexion stable.');
        return launchGameSource(state.gameKey,state.gameTitle,{multiplayer:false,playMode:'solo',strictSolo:true,autoStart:true,individualChallenge:individualChallenge,deferStart:individualChallenge,individualAttemptId:activePlayContext&&activePlayContext.attempt_id||'',playerCount:1,playerNames:[identity.name],ownSlot:1,seed:seed,gameInstanceId:state.gameInstanceId});
      });
    }).catch(function(err){
      var modal=openModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal);
      setHeader(state.gameTitle,'Partie solo','',false);
      if(wrap)wrap.innerHTML='<div class="nx-adams-game-loading"><div><strong>Ouverture sécurisée impossible</strong><span>'+esc(String(err&&err.message||err||'Connexion indisponible.'))+'</span><button type="button" class="nx-adams-game-retry-v127" data-nx-adams-retry>Réessayer</button></div></div>';
      var retry=wrap&&qs('[data-nx-adams-retry]',wrap);if(retry)retry.addEventListener('click',function(){openGame(state.gameKey,state.gameTitle)},{once:true});
    });
  }
  function openComputerGame(key,label){
    resetSession(false);state.mode='computer';state.gameKey=String(key||'').trim().replace(/[^a-z0-9_-]/gi,'');state.gameTitle=label||titleFromKey(state.gameKey);state.gameInstanceId=randomId();
    var seed=Math.floor(Math.random()*2147483000)+1;
    getIdentity(false).then(function(identity){state.identity=identity;startTrackedSession('computer',identity,{seed:seed,computerLevel:'normal'});return launchGameSource(state.gameKey,state.gameTitle,{multiplayer:false,computerMode:true,computerLevel:'normal',computerName:'Ordinateur Adams',playMode:'computer',playerCount:2,playerNames:[identity.name,'Ordinateur Adams'],ownSlot:1,computerSlot:2,seed:seed,gameInstanceId:state.gameInstanceId})});
  }
  function launchMultiplayerGame(){
    if(!state.room)return;
    state.mode='multi';state.lastEventId=0;state.pendingEvents=[];state.frameReady=false;state.gameInstanceId=String(state.room.id)+'-round-'+String(state.room.round_no||1);
    var players=(state.players||[]).slice().sort(function(a,b){return toNumber(a.slot)-toNumber(b.slot)});
    var own=ownPlayer(),context={multiplayer:true,playMode:'multiplayer',roomId:state.room.id,roomCode:state.room.code,roundNo:state.room.round_no||1,playerCount:toNumber(state.room.target_players,players.length||2),playerNames:players.map(function(p){return p.display_name||p.name||('Joueur '+p.slot)}),ownSlot:own?toNumber(own.slot):0,seed:toNumber(state.room.seed,1),gameInstanceId:state.gameInstanceId};
    startTrackedSession('multiplayer',state.identity,{roomId:state.room.id,seed:toNumber(state.room.seed,1)});launchGameSource(state.room.game_key,state.room.game_title||titleFromKey(state.room.game_key),context).then(function(){fetchRoomEvents()});
  }

  function sendAction(action){
    if(state.mode!=='multi'||!state.room||!state.identity||!action)return;
    var client=getClient();if(!client)return;
    var row={room_id:state.room.id,actor_id:state.identity.authId,event_type:'action',payload:action};
    client.from('adams_game_events').insert(row).then(function(res){
      if(res&&res.error)throw res.error;
      fetchRoomEvents();
    }).catch(function(){notify('Connexion instable : action appliquée seulement sur ce téléphone.');sendToFrame(action)});
  }
  function sendToFrame(action){
    if(!state.frame||!state.frame.contentWindow)return;
    try{state.frame.contentWindow.postMessage({type:'nx-adams-replay',action:action},window.location.protocol==='file:'?'*':window.location.origin)}catch(_e){window.nxLog&&window.nxLog(_e)}
  }
  function processEvent(row){
    if(!row)return;
    var id=toNumber(row.id);if(id&&id<=state.lastEventId)return;
    var payload=row.payload;if(typeof payload==='string'){try{payload=JSON.parse(payload)}catch(_e){payload={}}}
    if(id)state.lastEventId=id;
    if(row.event_type==='action'||!row.event_type){
      if(state.frameReady)sendToFrame(payload||{});
      else state.pendingEvents.push(payload||{});
    }
  }
  function flushPendingEvents(){
    if(!state.frameReady)return;
    var list=state.pendingEvents.splice(0);list.forEach(sendToFrame);
  }
  function fetchRoomEvents(){
    if(state.eventBusy||state.mode!=='multi'||!state.room||!state.room.id)return;
    var client=getClient();if(!client)return;
    state.eventBusy=true;
    client.from('adams_game_events').select('id,event_type,payload,actor_id,created_at').eq('room_id',state.room.id).gt('id',state.lastEventId||0).order('id',{ascending:true}).limit(200).then(function(res){
      if(res&&res.error)throw res.error;
      (res&&res.data||[]).forEach(processEvent);flushPendingEvents();
    }).catch(function(){return null}).finally(function(){state.eventBusy=false});
  }

  function normalizedName(v){return String(v||'').toLowerCase().normalize?String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim():String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  function chooseOwnScore(payload){
    if(state.answerEventsSeen>0){
      return {score:Math.max(0,Math.round(Number(state.answerPoints)||0)),detected:true,source:'answer_events'};
    }
    return {score:0,detected:false,source:''};
  }
  function opponentScore(payload){
    if(state.mode!=='computer')return null;var scores=Array.isArray(payload&&payload.scores)?payload.scores:[];
    for(var i=0;i<scores.length;i++)if(/ordinateur|computer|ia\b/i.test(String(scores[i]&&scores[i].name||'')))return Math.max(0,Math.round(toNumber(scores[i].score)));
    return null;
  }
  function didWin(payload,score){
    var scores=Array.isArray(payload&&payload.scores)?payload.scores:[],identity=state.identity||{},text=normalizedName(payload&&payload.text),name=normalizedName(identity.name);
    if(name&&text.indexOf(name)>-1&&/(victoire|gagnant|gagne|champion)/.test(text))return true;
    if(scores.length){var max=Math.max.apply(null,scores.map(function(x){return toNumber(x.score)}));return score>=max}
    return /(victoire|gagnant|gagne|champion)/.test(text);
  }
  function recordGameResult(payload){
    payload=payload||{};state.scoreRequestPending=false;
    if(state.resultFinalized)return;
    getIdentity(false).then(function(identity){
      if(state.resultFinalized)return;
      state.identity=identity;
      var scoreInfo=chooseOwnScore(payload);if(!scoreInfo.detected){showScoreUnavailable();return}
      var score=scoreInfo.score,won=didWin(payload,score),mode=currentPlayMode(),oppScore=opponentScore(payload),duration=Math.max(0,Math.round((Date.now()-(state.startedAt||Date.now()))/1000));
      var kdoPlayer=getKdoPlayer();
      var resultOnline=(typeof navigator==='undefined'||navigator.onLine!==false);
      var resultKey=state.room?(String(state.room.id)+'|'+String(state.room.round_no||1)+'|'+String(identity.id)):(mode+'|'+String(state.gameInstanceId||'game')+'|'+String(identity.id));
      if(state.resultSeen[resultKey]||hasLocalResultKey(identity,resultKey)){state.resultFinalized=true;return}
      state.resultFinalized=true;state.resultSeen[resultKey]=true;rememberLocalResultKey(identity,resultKey);state.resultCount++;
      var stats=readLocalStats(identity);
      stats.total_points+=score;stats.games_played+=1;if(won)stats.wins+=1;stats.best_score=Math.max(stats.best_score,score);stats.last_score=score;if(mode==='solo')stats.solo_games+=1;else if(mode==='computer'){stats.computer_games+=1;if(won)stats.computer_wins+=1}else{stats.multiplayer_games+=1;if(won)stats.multiplayer_wins+=1}
      writeLocalStats(identity,stats);renderStats(stats);
      var playContext=window.__NEXORA_ADAMS_PLAY_CONTEXT||null,individualPlay=!!(playContext&&/^individual_/.test(String(playContext.type||''))),kdoEligible=resultOnline&&!individualPlay;
      var result={score:score,won:won,total_points:stats.total_points,games_played:stats.games_played,best_score:stats.best_score,game_key:state.gameKey,game_title:state.gameTitle,room_id:state.room&&state.room.id||null,result_key:resultKey,play_mode:mode,opponent_score:oppScore,score_source:scoreInfo.source,duration_seconds:duration,kdo_eligible:kdoEligible,played_online:resultOnline,kdo_player:kdoPlayer||null,play_context:playContext};
      state.lastResult=result;
      try{window.dispatchEvent(new CustomEvent('nexora:adams-result',{detail:result}));}catch(_studentSyncEventError){window.nxLog&&window.nxLog(_studentSyncEventError)}
      try{if(window.NexoraCourseGame&&typeof window.NexoraCourseGame.recordAttempt==='function')window.NexoraCourseGame.recordAttempt(result);}catch(_courseGameError){window.nxLog&&window.nxLog(_courseGameError)}
      showResultSheet(result);
      var client=getClient();
      if(resultOnline&&state.room&&client&&identity.authId){
        client.from('adams_game_players').update({score:score,status:'finished',last_seen:new Date().toISOString()}).eq('room_id',state.room.id).eq('user_id',identity.authId).then(function(){});
      }
      if(resultOnline&&client&&identity.authId){
        var serverMeta={game_instance_id:state.gameInstanceId,kdo_eligible:kdoEligible,played_online:true,kdo_player:kdoPlayer||null};
        if(individualPlay&&playContext){serverMeta.individual_play_type=String(playContext.type||'');serverMeta.individual_attempt_id=String(playContext.attempt_id||'');serverMeta.individual_challenge_id=String(playContext.challenge_id||'');}
        var hasVerifiedSession=!!(state.session&&uuidLike(state.session.id));
        var finalizePromise=hasVerifiedSession
          ?client.rpc('nexora_finalize_adams_answer_session',{p_session_id:state.session.id,p_won:won,p_result_key:resultKey,p_room_id:state.room&&uuidLike(state.room.id)?state.room.id:null,p_duration_seconds:duration,p_game_title:state.gameTitle,p_metadata:serverMeta})
          :(individualPlay?Promise.reject(new Error('Session sécurisée du Défi individuel indisponible.')):client.rpc('nexora_record_adams_result',{p_game_key:state.gameKey,p_score:score,p_won:won,p_room_id:state.room&&uuidLike(state.room.id)?state.room.id:null,p_result_key:resultKey,p_play_mode:mode,p_session_id:null,p_score_source:scoreInfo.source,p_score_verified:true,p_opponent_score:oppScore,p_duration_seconds:duration,p_game_title:state.gameTitle,p_metadata:Object.assign({correct_answers:score},serverMeta)}));
        finalizePromise.then(function(res){
          if(res&&res.error)throw res.error;
          var data=unpack(res),serverScore=Number(data&&data.player_score);
          if(!Number.isFinite(serverScore)||serverScore<0)serverScore=score;
          if(state.lastResult){state.lastResult.score=serverScore;}
          if(individualPlay){
            try{window.dispatchEvent(new CustomEvent('nexora:individual-result-verified',{detail:{result_key:resultKey,game_key:state.gameKey,score:serverScore,duration_seconds:duration,session_id:state.session&&state.session.id||null,verified:true,play_context:playContext}}));}catch(_individualVerifiedEventError){window.nxLog&&window.nxLog(_individualVerifiedEventError)}
          }else{
            try{window.dispatchEvent(new CustomEvent('nexora:kdo-result-saved',{detail:{result_key:resultKey,game_key:state.gameKey,score:serverScore}}));}catch(_kdoSavedEventError){window.nxLog&&window.nxLog(_kdoSavedEventError)}
          }
          setTimeout(refreshStats,180);
        }).catch(function(err){
          if(individualPlay){
            try{window.dispatchEvent(new CustomEvent('nexora:individual-result-rejected',{detail:{result_key:resultKey,game_key:state.gameKey,score:score,message:'Le score du Défi individuel n’a pas été confirmé par le serveur.'}}));}catch(_individualRejectedEventError){window.nxLog&&window.nxLog(_individualRejectedEventError)}
            notify('Le score du Défi individuel n’a pas été validé. Contactez Nexora pour une vérification technique.');
            return;
          }
          client.rpc('nexora_record_adams_result',{p_game_key:state.gameKey,p_score:score,p_won:won,p_room_id:state.room&&uuidLike(state.room.id)?state.room.id:null,p_result_key:resultKey,p_play_mode:mode,p_session_id:state.session&&uuidLike(state.session.id)?state.session.id:null,p_score_source:scoreInfo.source,p_score_verified:true,p_opponent_score:oppScore,p_duration_seconds:duration,p_game_title:state.gameTitle,p_metadata:Object.assign({correct_answers:score},serverMeta)}).then(function(res){if(res&&res.error)throw res.error;try{window.dispatchEvent(new CustomEvent('nexora:kdo-result-saved',{detail:{result_key:resultKey,game_key:state.gameKey,score:score}}));}catch(_kdoFallbackSavedEventError){window.nxLog&&window.nxLog(_kdoFallbackSavedEventError)}setTimeout(refreshStats,180)}).catch(function(){try{window.dispatchEvent(new CustomEvent('nexora:kdo-result-rejected',{detail:{result_key:resultKey,game_key:state.gameKey,score:score,message:'Connexion interrompue : ce score n’a pas été ajouté au KDO.'}}));}catch(_kdoRejectedEventError){window.nxLog&&window.nxLog(_kdoRejectedEventError)}notify('Le score reste dans Jeu Adams, mais il n’a pas été ajouté au KDO. Rejoue avec une connexion stable.');});
        });
      }
    });
  }
  
  
  
  function updateVisibleResultTotals(stats){
    var card=qs('.nx-adams-result-card');if(!card)return;
    var total=qs('[data-nx-result-total]',card),games=qs('[data-nx-result-games]',card);
    if(total)total.textContent=String(toNumber(stats.total_points));
    if(games)games.textContent=String(toNumber(stats.games_played));
  }
  function showResultSheet(result){
    var wrap=qs('[data-nx-adams-game-frame-wrap]',ensureModal());if(!wrap)return;
    var old=qs('.nx-adams-result-sheet',wrap);if(old)old.remove();
    var sheet=document.createElement('div');sheet.className='nx-adams-result-sheet';
    sheet.innerHTML='<div class="nx-adams-result-card"><span class="nx-adams-player-kicker" style="color:#7E5313;border-color:#F8E7CD;background:#FCF5EA">'+esc(result.won?'Victoire enregistrée':'Partie enregistrée')+'</span>'+
      '<h2>'+esc(result.score)+' point'+(Number(result.score)>1?'s':'')+' ajouté'+(Number(result.score)>1?'s':'')+'</h2><p>Le score exact est enregistré dans ton compteur Jeu Adams.</p><span class="nx-adams-result-mode">'+esc(playModeLabel(result.play_mode))+'</span>'+
      '<div class="nx-adams-result-score"><span><b data-nx-result-total>'+esc(result.total_points)+'</b><small>points cumulés</small></span><span><b data-nx-result-games>'+esc(result.games_played)+'</b><small>parties jouées</small></span></div>'+
      '<div class="nx-adams-result-actions"><button type="button" class="btn btn-primary" data-action="dismiss-adams-result">Continuer</button><button type="button" class="btn btn-soft" data-action="close-adams-game">Fermer le jeu</button></div></div>';
    wrap.appendChild(sheet);
  }
  function showScoreUnavailable(){
    state.scoreRequestPending=false;var wrap=qs('[data-nx-adams-game-frame-wrap]',ensureModal());if(!wrap)return;
    var old=qs('.nx-adams-result-sheet',wrap);if(old)old.remove();
    var sheet=document.createElement('div');sheet.className='nx-adams-result-sheet';
    sheet.innerHTML='<div class="nx-adams-result-card"><span class="nx-adams-player-kicker" style="color:#B45309;border-color:#FDE68A;background:#FFFBEB">Partie encore en cours</span><h2>Terminez la question actuelle</h2><p>Votre score final sera affiché dès que la partie sera complètement terminée.</p><div class="nx-adams-score-warning">Continuez à répondre, puis appuyez de nouveau sur « Fin de partie ».</div><div class="nx-adams-result-actions" style="margin-top:14px"><button type="button" class="btn btn-primary" data-action="dismiss-adams-result">Continuer la partie</button><button type="button" class="btn btn-soft" data-action="close-adams-game">Fermer</button></div></div>';
    wrap.appendChild(sheet);
  }
  function requestFinish(){
    var before=state.resultCount;state.scoreRequestPending=true;
    if(state.frame&&state.frame.contentWindow){try{state.frame.contentWindow.postMessage({type:'nx-adams-request-result'},window.location.protocol==='file:'?'*':window.location.origin)}catch(_e){window.nxLog&&window.nxLog(_e)}}
    setTimeout(function(){if(state.resultCount===before&&state.scoreRequestPending)showScoreUnavailable()},900);
  }
  function dismissResult(){var sheet=qs('.nx-adams-result-sheet');if(sheet)sheet.remove()}
  

  function recordAnswerEvent(payload){
    payload=payload||{};
    var questionKey=String(payload.questionInstanceId||'').trim();
    if(!questionKey)return;
    var actor=payload.actorType==='computer'?'computer':'player';
    if(actor==='player'&&!state.answerKeys[questionKey]){
      state.answerKeys[questionKey]=true;
      state.answerEventsSeen+=1;
      if(payload.correct===true)state.answerPoints+=1;
      state.liveScore=state.answerPoints;
      try{window.dispatchEvent(new CustomEvent('nexora:kdo-live-score',{detail:{game_points:state.answerPoints,correct:payload.correct===true,question_key:questionKey,game_key:state.gameKey}}));}catch(_kdoLiveError){window.nxLog&&window.nxLog(_kdoLiveError)}
      updateKdoGameBadge();
      var scoreLabel='Score réel : '+state.answerPoints+' point'+(state.answerPoints>1?'s':'');
      setHeader(state.gameTitle,state.mode==='computer'?'Ordinateur Adams joue automatiquement':'Partie en cours',scoreLabel,true);
    }
    var client=getClient(),identity=state.identity||{};
    if(!client||!identity.authId||!state.session||!uuidLike(state.session.id))return;
    client.rpc('nexora_record_adams_answer',{
      p_session_id:state.session.id,
      p_question_instance_key:questionKey,
      p_actor_type:actor,
      p_is_correct:payload.correct===true,
      p_answer_index:Number.isFinite(Number(payload.answerIndex))?Number(payload.answerIndex):null,
      p_correct_index:Number.isFinite(Number(payload.correctIndex))?Number(payload.correctIndex):null,
      p_metadata:{question_text:String(payload.questionText||'').slice(0,500),game_instance_id:state.gameInstanceId,points_awarded:payload.correct===true?1:0}
    }).then(function(res){if(res&&res.error)throw res.error;}).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')});
  }

  function closeGame(fromHistory){
    var modal=qs('[data-nx-adams-game-modal]');if(!modal)return;
    var officialContext=window.__NEXORA_ADAMS_PLAY_CONTEXT||null;
    var officialRunning=!!(officialContext&&officialContext.type==='individual_challenge'&&officialContext.phase==='started');
    if(officialRunning&&window.__NEXORA_FORCE_GAME_CLOSE!==true){
      notify('La partie officielle est en cours. Terminez le jeu avant de fermer le plateau.');
      if(fromHistory){try{history.pushState({nxAdamsGame:true},'',location.href)}catch(_historyRestoreError){window.nxLog&&window.nxLog(_historyRestoreError)}}
      return false;
    }
    var shouldUnwindHistory=!fromHistory&&state.historyEntry&&history.state&&history.state.nxAdamsGame===true;
    state.historyEntry=false;
    try{window.dispatchEvent(new CustomEvent('nexora:adams-closed',{detail:{game_key:state.gameKey,play_context:window.__NEXORA_ADAMS_PLAY_CONTEXT||null}}));}catch(_nxCloseContextError){window.nxLog&&window.nxLog(_nxCloseContextError)}
    clearRoomWatch();
    var wrap=qs('[data-nx-adams-game-frame-wrap]',modal);if(wrap)wrap.innerHTML='';releaseFrameObjectUrl();
    modal.classList.remove('open');document.body.classList.remove('nx-adams-game-locked');
    state.frame=null;state.frameReady=false;state.mode='idle';state.room=null;state.players=[];state.pendingEvents=[];state.lastEventId=0;state.resultFinalized=false;state.session=null;state.startedAt=0;state.scoreRequestPending=false;state.liveScore=null;state.answerPoints=0;state.answerEventsSeen=0;state.answerKeys={};if(state.captureTimer){clearTimeout(state.captureTimer);state.captureTimer=null}state.captureResolver=null;
    if(shouldUnwindHistory){try{setTimeout(function(){history.back()},0)}catch(_historyBackError){window.nxLog&&window.nxLog(_historyBackError)}}
  }

  window.addEventListener('message',function(ev){
    if(ev.origin!==window.location.origin)return;
    if(!state.frame||ev.source!==state.frame.contentWindow)return;
    var data=ev&&ev.data||{};
    if(!data||String(data.type||'').indexOf('nx-adams-')!==0)return;
    if(data.type==='nx-adams-frame-ready'){
      state.frameReady=true;
      try{window.dispatchEvent(new CustomEvent('nexora:adams-frame-ready',{detail:{game_key:state.gameKey,game_instance_id:state.gameInstanceId,session_id:state.session&&state.session.id||null}}))}catch(_frameReadyDispatchError){window.nxLog&&window.nxLog(_frameReadyDispatchError)}
    }else if(data.type==='nx-adams-ready'){
      state.frameReady=true;flushPendingEvents();if(state.mode==='multi')fetchRoomEvents();
      var own=ownPlayer(),status=own?('Joueur '+own.slot+' · '+String(state.room&&state.room.code||'')):(state.room?('Code '+state.room.code):'');
      if(data.levelSelection===true){
        setHeader(state.gameTitle,'Choisis le niveau',status,false);
      }else{
        setHeader(state.gameTitle,state.mode==='multi'?'Plateau partagé':'Partie en cours',status,true);
      }
    }else if(data.type==='nx-adams-action'){
      if(state.mode==='multi')sendAction(data.action||{});
    }else if(data.type==='nx-adams-live-score'){
      if(state.answerEventsSeen>0){var real=state.answerPoints;var roomText=state.mode==='multi'&&state.room?('Code '+state.room.code+' · '+real+' point'+(real>1?'s':'')):('Score réel : '+real+' point'+(real>1?'s':''));setHeader(state.gameTitle,state.mode==='computer'?'Ordinateur Adams joue automatiquement':'Partie en cours',roomText,true)}
    }else if(data.type==='nx-adams-answer-event'){
      recordAnswerEvent(data);
    }else if(data.type==='nx-adams-board-capture'){
      if(state.captureResolver){var resolver=state.captureResolver;state.captureResolver=null;if(state.captureTimer){clearTimeout(state.captureTimer);state.captureTimer=null}resolver(String(data.dataUrl||''))}
    }else if(data.type==='nx-adams-game-result'){
      state.scoreRequestPending=false;recordGameResult(data);
    }else if(data.type==='nx-adams-score-unavailable'){
      if(state.scoreRequestPending)showScoreUnavailable();
    }
  });

  var handledActions={
    'open-adams-game':1,'open-adams-subscription':1,'open-adams-solo':1,'open-adams-computer':1,'open-adams-multiplayer':1,'join-adams-room':1,'close-adams-game':1,'set-adams-room-size':1,'create-adams-room':1,
    'submit-join-adams-room':1,'copy-adams-room-code':1,'share-adams-room':1,'start-adams-room':1,'finish-adams-game':1,
    'dismiss-adams-result':1
  };
  document.addEventListener('click',function(ev){
    var target=ev.target&&ev.target.closest?ev.target.closest('[data-action]'):null;if(!target)return;
    var action=target.getAttribute('data-action');if(!handledActions[action])return;
    ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
    function requireGameAccess(gameKey,callback){gameKey=String(gameKey||'').toLowerCase();if(gameKey==='guinee'){if(typeof callback==='function')callback();return true;}if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('adams',callback);return false;}
    function requireSubscription(callback){if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('adams',callback);return false;}
    var requestedGame=target.getAttribute('data-adams-game')||'',requestedLabel=target.getAttribute('data-adams-game-label')||'Jeu Adams';
    if(action==='open-adams-subscription'){window.__NEXORA_ADAMS_PLAY_CONTEXT_V246={type:'subscription',game_key:requestedGame,official:false};requireSubscription(function(){openGame(requestedGame,requestedLabel);});}
    else if(action==='open-adams-game'||action==='open-adams-solo')requireGameAccess(requestedGame,function(){openGame(requestedGame,requestedLabel);});
    else if(action==='open-adams-computer')requireGameAccess(requestedGame,function(){openComputerGame(requestedGame,target.getAttribute('data-adams-game-label'));});
    else if(action==='open-adams-multiplayer')requireGameAccess(requestedGame,function(){openMultiplayerSetup(requestedGame,target.getAttribute('data-adams-game-label'));});
    else if(action==='join-adams-room')openJoinRoom('');
    else if(action==='close-adams-game')closeGame();
    else if(action==='set-adams-room-size'){
      state.selectedRoomSize=Math.max(2,Math.min(4,toNumber(target.getAttribute('data-size'),2)));
      qsa('.nx-adams-room-size').forEach(function(btn){btn.classList.toggle('active',toNumber(btn.getAttribute('data-size'))===state.selectedRoomSize)});
    }else if(action==='create-adams-room')createRoom();
    else if(action==='submit-join-adams-room')joinRoom();
    else if(action==='copy-adams-room-code')copyRoomCode();
    else if(action==='share-adams-room')shareRoom();
    else if(action==='start-adams-room')startRoom();
    else if(action==='finish-adams-game')requestFinish();
    else if(action==='dismiss-adams-result')dismissResult();
  },true);
  window.addEventListener('popstate',function(){
    var modal=qs('[data-nx-adams-game-modal]');
    if(modal&&modal.classList.contains('open'))closeGame(true);
  });

  document.addEventListener('keydown',function(ev){
    if(ev.key==='Escape'){if(qs('[data-nx-adams-game-modal].open'))closeGame();return}
    if(ev.key==='Enter'&&ev.target&&ev.target.matches&&ev.target.matches('[data-nx-adams-room-code-input]')){ev.preventDefault();joinRoom();return}
    if((ev.key==='Enter'||ev.key===' ')&&ev.target&&ev.target.matches&&ev.target.matches('.nx-adams-game-card[data-action="open-adams-game"],.nx-adams-game-card[data-action="open-adams-subscription"]')){ev.preventDefault();ev.target.click()}
  });

  function openRoomFromUrl(){
    try{var url=new URL(location.href),code=cleanCode(url.searchParams.get('adams_room')||'');if(code)setTimeout(function(){openJoinRoom(code);},850)}catch(_e){window.nxLog&&window.nxLog(_e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){refreshStats();openRoomFromUrl()});
  else{refreshStats();openRoomFromUrl()}
  setInterval(function(){if(document.visibilityState!=='hidden'&&qs('[data-adams-center]'))refreshStats()},12000);

  function openWithPolicy(k,callback){k=String(k||'').toLowerCase();try{var kdo=window.NexoraKDO,access=kdo&&typeof kdo.getAccess==='function'?kdo.getAccess():null,official=kdo&&typeof kdo.getOfficialGame==='function'?kdo.getOfficialGame():null;if(access&&access.can_play&&official&&String(official.key||'').toLowerCase()===k){if(typeof callback==='function')callback();return true}}catch(_kdoAccessError){window.nxLog&&window.nxLog(_kdoAccessError)}if(k==='guinee'){if(typeof callback==='function')callback();return true;}if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('adams',callback);return false;}
  window.NexoraAdamsGames={open:function(k,l){return openWithPolicy(k,function(){return openGame(k,l);});},openSolo:function(k,l){return openWithPolicy(k,function(){return openGame(k,l);});},openCompetition:function(k,l){return openGame(k,l);},openTraining:function(k,l){return openGame(k,l);},openChallenge:function(k,l){return openGame(k,l);},confirmChallengeStart:function(attemptId){if(!state.frame||!state.frame.contentWindow)return false;state.startedAt=Date.now();state.frame.contentWindow.postMessage({type:'nx-adams-confirm-start',attemptId:String(attemptId||'')},window.location.protocol==='file:'?'*':window.location.origin);return true;},replayActions:function(actions){actions=Array.isArray(actions)?actions:[];return new Promise(function(resolve){var i=0;function next(){if(i>=actions.length)return resolve(true);sendToFrame(actions[i++]);setTimeout(next,90)}setTimeout(next,350)});},openComputer:function(k,l){return openWithPolicy(k,function(){return openComputerGame(k,l);});},openMultiplayer:function(k,l){return openWithPolicy(k,function(){return openMultiplayerSetup(k,l);});},join:function(c){openJoinRoom(c||'');return true;},isFreeGameOpen:function(){var modal=qs('[data-nx-adams-game-modal]');return state.gameKey==='guinee'&&!!(modal&&modal.classList.contains('open'));},currentGame:function(){return state.gameKey||'';},close:closeGame,finish:requestFinish,refreshStats:refreshStats};
})();

//# sourceURL=assets/js/nexora-adams-games.js

