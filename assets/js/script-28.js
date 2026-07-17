
(function(){
  'use strict';

  var SCREEN_BY_GAME={preuniv:'screen-preuniv',maternelle:'',ecole:'',univ:'screen-univ',pro:'screen-pro',sport:'screen-sport',guinee:'screen-guinee',sante:'screen-sante',musique:'screen-musique',art:'screen-art',histoire:'screen-histoire','7e':'','8e':'','9e':'','10e':'','11e':'','12e':'',terminale:''};
  var PREFIX_BY_GAME={preuniv:'pu',maternelle:'',ecole:'',univ:'un',pro:'pr',sport:'sp',guinee:'gn',sante:'sa',musique:'mu',art:'ar',histoire:'hi','7e':'','8e':'','9e':'','10e':'','11e':'','12e':'',terminale:''};
  var STATS_PREFIX='nexora_adams_stats_v3:';
  var RESULT_KEYS_PREFIX='nexora_adams_result_keys_v3:';
  var state={
    mode:'idle',gameKey:'',gameTitle:'',gameInstanceId:'',frame:null,frameReady:false,
    room:null,players:[],identity:null,selectedRoomSize:2,lastEventId:0,pendingEvents:[],
    roomBusy:false,eventBusy:false,channel:null,roomPoll:null,eventPoll:null,
    resultSeen:{},resultCount:0,resultFinalized:false,lastResult:null,statsBusy:false,session:null,startedAt:0,scoreRequestPending:false,liveScore:null,answerPoints:0,answerEventsSeen:0,answerKeys:{},captureResolver:null,captureTimer:null
  };

  function qs(sel,root){return (root||document).querySelector(sel)}
  function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safeText(v){return String(v||'').replace(/[<>]/g,'')}
  function cleanCode(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)}
  function toNumber(v,fallback){var n=Number(v);return isFinite(n)?n:Number(fallback||0)}
  function uuidLike(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))}
  function titleFromKey(key){var t={preuniv:'Jeu Adams Pré-universitaire',maternelle:'Jeu Adams Maternelle',ecole:'Jeu Adams École','7e':'Jeu Adams 7e année','8e':'Jeu Adams 8e année','9e':'Jeu Adams 9e année','10e':'Jeu Adams 10e année','11e':'Jeu Adams 11e année','12e':'Jeu Adams 12e année',terminale:'Jeu Adams Terminale',univ:'Jeu Adams Université',pro:'Jeu Adams Professionnel',sport:'Jeu Adams Sport',guinee:'Jeu Adams Guinée',sante:'Jeu Adams Santé',musique:'Jeu Adams Musique',art:'Jeu Adams Art',histoire:'Jeu Adams Histoire'};return t[key]||'Jeu Adams'}
  function getClient(){try{if(window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function') return window.NexoraApp.getSupabaseClient();}catch(_e){}return null}
  function appDB(){try{return window.NexoraApp&&window.NexoraApp.readDB?window.NexoraApp.readDB():null}catch(_e){return null}}
  function notify(message){
    try{if(typeof window.toast==='function'){window.toast(message);return;}}catch(_e){}
    var old=qs('.nx-adams-sync-toast');if(old)old.remove();
    var el=document.createElement('div');el.className='nx-adams-sync-toast';el.textContent=String(message||'');
    document.body.appendChild(el);setTimeout(function(){if(el&&el.parentNode)el.parentNode.removeChild(el)},2800);
  }
  function unpack(data){
    var value=data;
    if(value&&value.data!==undefined)value=value.data;
    if(Array.isArray(value)&&value.length===1)value=value[0];
    if(typeof value==='string'){try{value=JSON.parse(value)}catch(_e){}}
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

  function getIdentity(requireAuth){
    var db=appDB()||{};
    var activeId=String(db.activeProfileId||db.lastValidProfileId||'');
    var profiles=Array.isArray(db.profiles)?db.profiles:[];
    var profile=profiles.filter(function(p){
      var ids=[p&&p.id,p&&p.user_id,p&&p.auth_user_id,p&&p.profile_id].map(String);
      return activeId&&ids.indexOf(activeId)>-1;
    })[0]||profiles[0]||{};
    var client=getClient();
    var local={
      authId:'',
      profileId:String(profile.id||profile.user_id||activeId||''),
      id:String(profile.id||profile.user_id||activeId||'guest'),
      name:String(profile.name||profile.full_name||profile.display_name||profile.nom||'Joueur Nexora').trim()||'Joueur Nexora',
      profile:profile
    };
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
  }
  function openModal(){
    var modal=ensureModal();modal.classList.add('open');document.body.classList.add('nx-adams-game-locked');return modal;
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
  function writeLocalStats(identity,stats){try{localStorage.setItem(statsKey(identity),JSON.stringify(stats))}catch(_e){}}
  function hasLocalResultKey(identity,key){
    try{var list=JSON.parse(localStorage.getItem(resultKeysKey(identity))||'[]');return Array.isArray(list)&&list.indexOf(String(key))>-1}catch(_e){return false}
  }
  function rememberLocalResultKey(identity,key){
    try{
      var list=JSON.parse(localStorage.getItem(resultKeysKey(identity))||'[]');if(!Array.isArray(list))list=[];
      key=String(key);if(list.indexOf(key)<0)list.unshift(key);list=list.slice(0,120);
      localStorage.setItem(resultKeysKey(identity),JSON.stringify(list));
    }catch(_e){}
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
    return client.rpc('nexora_start_adams_session',{p_game_key:state.gameKey,p_game_title:state.gameTitle,p_play_mode:mode,p_room_id:options.roomId||null,p_computer_level:mode==='computer'?(options.computerLevel||'normal'):null,p_opponent_name:mode==='computer'?'Ordinateur Adams':null,p_seed:toNumber(options.seed,1)}).then(function(res){
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
    if(state.channel&&client&&typeof client.removeChannel==='function'){try{client.removeChannel(state.channel)}catch(_e){}}
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
    setHeader(state.gameTitle,'Créer une partie synchronisée','2 à 4 téléphones',false);
    wrap.innerHTML='<section class="nx-adams-room-setup"><div class="nx-adams-setup-card">'+
      '<span class="nx-adams-lobby-kicker">Partie multijoueur</span><h2>Combien de téléphones ?</h2><p>Chaque joueur ouvre Nexora sur son téléphone et rejoint le même plateau avec le code d’invitation.</p>'+
      '<div class="nx-adams-room-sizes">'+[2,3,4].map(function(n){return '<button type="button" class="nx-adams-room-size '+(n===2?'active':'')+'" data-action="set-adams-room-size" data-size="'+n+'"><b>'+n+'</b><span>téléphones</span></button>'}).join('')+'</div>'+
      '<div class="nx-adams-setup-actions"><button type="button" class="btn btn-primary" data-action="create-adams-room">Créer l’invitation</button><button type="button" class="btn btn-soft" data-action="close-adams-game">Annuler</button></div>'+
      '<p class="nx-adams-room-note">Les joueurs doivent être connectés à leur compte Nexora. Le plateau reste synchronisé tant que la connexion est active.</p>'+
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
    if(!client){notify('Connexion Supabase indisponible.');return}
    showLoading(wrap,'Création de la partie','Génération du code et réservation des places.');
    getIdentity(true).then(function(identity){
      state.identity=identity;
      return client.rpc('nexora_create_adams_room',{p_game_key:state.gameKey,p_game_title:state.gameTitle,p_target_players:state.selectedRoomSize});
    }).then(function(res){
      if(res&&res.error)throw res.error;
      var data=unpack(res),room=data.room||data,players=data.players||[];
      if(!room||!room.id)throw new Error('La salle n’a pas été créée. Exécute le SQL multijoueur Jeu Adams dans Supabase.');
      state.room=room;state.players=players;state.mode='lobby';renderLobby();beginRoomWatch();
    }).catch(function(err){renderRoomSetup(state.gameKey,state.gameTitle);notify((err&&err.message)||'Création impossible. Vérifie les tables Supabase Jeu Adams.')});
  }
  function joinRoom(){
    var input=qs('[data-nx-adams-room-code-input]'),code=cleanCode(input&&input.value);
    if(code.length<4){notify('Entre le code complet de la partie.');return}
    var client=getClient(),modal=ensureModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal);
    if(!client){notify('Connexion Supabase indisponible.');return}
    showLoading(wrap,'Connexion à la partie','Vérification du code et attribution de ta place.');
    getIdentity(true).then(function(identity){
      state.identity=identity;
      return client.rpc('nexora_join_adams_room',{p_code:code});
    }).then(function(res){
      if(res&&res.error)throw res.error;
      var data=unpack(res),room=data.room||data,players=data.players||[];
      if(!room||!room.id)throw new Error('Code introuvable ou partie indisponible.');
      state.room=room;state.players=players;state.gameKey=String(room.game_key||'');state.gameTitle=String(room.game_title||titleFromKey(state.gameKey));state.mode='lobby';renderLobby();beginRoomWatch();
      try{var url=new URL(location.href);url.searchParams.delete('adams_room');history.replaceState({},'',url.toString())}catch(_e){}
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
    }catch(_e){}
    state.roomPoll=setInterval(refreshRoom,1500);
    state.eventPoll=setInterval(function(){if(state.mode==='multi')fetchRoomEvents()},850);
  }
  function startRoom(){
    if(!state.room||!isHost())return;
    var client=getClient();if(!client)return;
    var target=toNumber(state.room.target_players,2);
    if((state.players||[]).length<target){notify('Attends que tous les téléphones soient connectés.');return}
    var modal=ensureModal(),wrap=qs('[data-nx-adams-game-frame-wrap]',modal);
    showLoading(wrap,'Démarrage synchronisé','Préparation du même plateau sur chaque téléphone.');
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
    if(navigator.share){navigator.share({title:'Invitation Jeu Adams',text:text,url:url}).catch(function(){})}
    else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text+' '+url).then(function(){notify('Invitation copiée.')})}
    else notify('Code de la partie : '+state.room.code);
  }

  function resolveGameConfig(key,label){
    key=String(key||'').trim().replace(/[^a-z0-9_-]/gi,'');
    var fallback={ok:true,slug:key,launch_key:key,title:label||titleFromKey(key),launch_mode:'template_id',template_id:'nx-adams-source-'+key};
    var client=getClient();
    if(!client||typeof client.rpc!=='function')return Promise.resolve(fallback);
    return timeoutPromise(client.rpc('nexora_get_game_to_open',{p_slug:key,p_access_code:null}),1500).then(function(res){
      var data=unpack(res);
      if(data&&data.ok){
        return {ok:true,slug:String(data.slug||key),launch_key:String(data.launch_key||data.slug||key),title:String(data.title||label||titleFromKey(key)),launch_mode:String(data.launch_mode||'template_id'),template_id:String(data.template_id||('nx-adams-source-'+(data.launch_key||data.slug||key))),public_url:String(data.public_url||''),storage_path:String(data.storage_path||''),route_path:String(data.route_path||'')};
      }
      return fallback;
    }).catch(function(){return fallback});
  }

  function nxAdamsChildRuntime(){
    var ctx=window.__NEXORA_ADAMS_CONTEXT||{},multi=!!ctx.multiplayer,computerMode=ctx.playMode==='computer'||!!ctx.computerMode,soloMode=ctx.playMode==='solo'&&!multi&&!computerMode,computerName=String(ctx.computerName||'Ordinateur Adams'),replaying=false,resultSent=false,startTries=0,computerBusy=false,soloStarted=false,computerPhase=false,computerPhaseStartedAt=0,answerSequence=0,answerLocked=false,lastQuestionSignature='';
    function parentPost(type,payload){try{window.parent.postMessage(Object.assign({type:type,gameKey:ctx.gameKey||'',gameInstanceId:ctx.gameInstanceId||''},payload||{}),'*')}catch(_e){}}
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
      }catch(_e){}
      setTimeout(function(){replaying=false},0);
    }
    window.addEventListener('message',function(ev){
      var d=ev&&ev.data||{};
      if(d.type==='nx-adams-replay')replay(d.action||{});
      if(d.type==='nx-adams-request-result')emitResult(true);
      if(d.type==='nx-adams-request-capture')captureBoardImage().then(function(dataUrl){parentPost('nx-adams-board-capture',{dataUrl:dataUrl||''})}).catch(function(){parentPost('nx-adams-board-capture',{dataUrl:''})});
    });
    function bestCaptureTarget(){
      var selectors=['.game-screen.active','.game-screen','.g-inner','.board-shell','.inner','#comp-game','[id$="-game"]','.game-container','.board','.plateau'];
      var best=null,bestArea=0;
      for(var i=0;i<selectors.length;i++){
        var nodes=[];try{nodes=Array.prototype.slice.call(document.querySelectorAll(selectors[i]))}catch(_e){}
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
          var xhtml='<div xmlns="http://www.w3.org/1999/xhtml" style="width:'+w+'px;min-height:'+h+'px;background:#08152f;overflow:hidden"><style>'+styles.replace(/<\/style/gi,'<\\/style')+'</style>'+clone.outerHTML+'</div>';
          var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject width="100%" height="100%">'+xhtml+'</foreignObject></svg>';
          var blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),img=new Image();
          img.onload=function(){try{var c=document.createElement('canvas'),scale=Math.min(2,1400/w);c.width=Math.round(w*scale);c.height=Math.round(h*scale);var cx=c.getContext('2d');cx.fillStyle='#08152f';cx.fillRect(0,0,c.width,c.height);cx.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',.9))}catch(_e){URL.revokeObjectURL(url);resolve('')}};
          img.onerror=function(){URL.revokeObjectURL(url);resolve('')};img.src=url;
        }catch(_e){resolve('')}
      });
    }
    function captureBoardImage(){
      var target=bestCaptureTarget();
      if(window.html2canvas){return window.html2canvas(target,{backgroundColor:'#08152f',useCORS:true,allowTaint:false,scale:Math.min(2,window.devicePixelRatio||1.5),logging:false}).then(function(c){return c.toDataURL('image/jpeg',.9)}).catch(function(){return captureWithForeignObject(target)})}
      return new Promise(function(resolve){
        var done=false,s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';s.async=true;
        var timer=setTimeout(function(){if(done)return;done=true;captureWithForeignObject(target).then(resolve)},1800);
        s.onload=function(){if(done)return;done=true;clearTimeout(timer);if(window.html2canvas)window.html2canvas(target,{backgroundColor:'#08152f',useCORS:true,allowTaint:false,scale:Math.min(2,window.devicePixelRatio||1.5),logging:false}).then(function(c){resolve(c.toDataURL('image/jpeg',.9))}).catch(function(){captureWithForeignObject(target).then(resolve)});else captureWithForeignObject(target).then(resolve)};
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
      }catch(_e){}
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
            try{fn(1)}catch(_e){}
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
          try{list=Array.prototype.slice.call(document.querySelectorAll(selectors[i]))}catch(_e){}
          for(var j=0;j<list.length;j++){
            var el=list[j];
            if(el&&typeof el.click==='function'){
              try{el.click()}catch(_e){}
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
      }catch(_e){}
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
        selectors.forEach(function(fn){if(typeof fn==='function'){try{fn(count)}catch(_e){}}});
        if(soloMode)forceSoloConfiguration();
        applyPlayerNames();
      }catch(_e){}
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
      }catch(_e){}
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
      }catch(_e){}
      parentPost('nx-adams-ready',{multiplayer:multi,levelSelection:true,playerCount:count});
    }

    function fitBoard(){try{if(typeof window.__nxAdamsFitBoardV136==='function')window.__nxAdamsFitBoardV136();}catch(_e){}}
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
      }catch(_e){}
      parentPost('nx-adams-ready',{multiplayer:multi});
    }
    function clickVisibleStartControls(){
      var candidates=[];
      try{candidates=Array.prototype.slice.call(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"],[onclick],[data-action]'));}catch(_e){}
      var best=null,bestScore=-1;
      for(var i=0;i<candidates.length;i++){
        var el=candidates[i];if(!el||!visible(el)||el.disabled)continue;
        var txt=clean(el.textContent||el.value||el.getAttribute('aria-label')||'');
        if(!/jouer maintenant|démarrer|demarrer|commencer|jouer|lancer|start|ouvrir|accéder|acceder/i.test(txt))continue;
        if(/multijoueur|inviter|ordinateur|computer|rejoindre/i.test(txt))continue;
        var r=el.getBoundingClientRect(),score=(/jouer maintenant/i.test(txt)?1000:400)+r.width+r.height;
        if(score>bestScore){best=el;bestScore=score;}
      }
      if(best){try{best.click();return true}catch(_e){}}
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
          try{window.launchGame(key)}catch(_launchError){}
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
          }catch(_e){}
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
      }catch(_e){}

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
      }catch(_e){}
      var text='';
      try{
        var nodes=document.querySelectorAll('#turnBox,[id*="turn"],[class*="turn"],.scorecard.active,.sc-card.active,.sc-card.cur,.comp-player.active,.player-card.active,.ap-name,[id$="-ap-name"],[id*="active-player"],[class*="active-player"],#qPlayer,[id$="-q-who"]');
        for(var i=0;i<nodes.length;i++)if(visible(nodes[i]))text+=' '+clean(nodes[i].textContent);
      }catch(_e){}
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
      }catch(_e){}
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
      try{disabledChoices=Array.prototype.slice.call(document.querySelectorAll('.choice,.option,.answer-option,[data-answer],.q-choice')).filter(function(el){return visible(el)&&el.disabled})}catch(_e){}
      if(!disabledChoices.length)return null;
      var all=visibleEnabled('button,[role="button"]');
      for(var j=0;j<all.length;j++)if(/tour suivant|suivant|continuer|prochain|next/i.test(clean(all[j].textContent)))return all[j];
      return null;
    }
    function humanTurnCompleted(){
      if(computerTurnActive())return false;
      try{if(window.questionAnswered===true||window.qAnswered===true)return !!completedTurnButton()}catch(_e){}
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
      }catch(_e){}
    }
    function answerChoiceElements(){
      return visibleEnabled('.choice,.option,.answer-option,[data-answer],.q-choice,.q-option,.answer-btn,.choice-btn');
    }
    function currentQuestionText(){
      var selectors=['#questionText','#qText','#q-text','#question','[id$="-q-text"]','[id$="-question"]','.question-text','.q-text','.question'];
      var text='';
      for(var i=0;i<selectors.length;i++){
        var nodes=[];try{nodes=Array.prototype.slice.call(document.querySelectorAll(selectors[i]))}catch(_e){}
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
      }catch(_e){}
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
      }catch(_e){}
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
        }catch(_e){}
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
      }catch(_e){}
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
      }catch(_e){}
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
      try{nodes=Array.prototype.slice.call(document.querySelectorAll('[id*="win"],[class*="win"],[id*="victory"],[class*="victory"],[id*="winner"],[class*="winner"],[id*="recap"],[class*="recap"],[id*="result"],[class*="result"]'))}catch(_e){}
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
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(directStart,180)});
    else setTimeout(directStart,180);
  }

  function scriptTag(id,code){code=String(code||'').replace(/<\/script/gi,'<\\/script');return '<scr'+'ipt id="'+id+'">'+code+'</scr'+'ipt>'}
  var DIRECT_GAME_CACHE=Object.create(null);
  function decodeEmbeddedGameSource(value){
    try{
      var compact=String(value||'').replace(/\s+/g,'');
      if(!compact)return '';
      var binary=window.atob(compact),bytes=new Uint8Array(binary.length);
      for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      if(typeof TextDecoder!=='undefined')return new TextDecoder('utf-8').decode(bytes);
      var escaped='';
      for(var j=0;j<bytes.length;j++)escaped+='%'+('0'+bytes[j].toString(16)).slice(-2);
      return decodeURIComponent(escaped);
    }catch(_e){return ''}
  }
  function readDirectEmbeddedGame(key){
    key=String(key||'').trim();
    if(Object.prototype.hasOwnProperty.call(DIRECT_GAME_CACHE,key))return DIRECT_GAME_CACHE[key];
    var nodes=document.querySelectorAll('script[data-nx-adams-embedded]'),node=null;
    for(var i=0;i<nodes.length;i++){
      if(String(nodes[i].getAttribute('data-nx-adams-embedded')||'')===key){node=nodes[i];break}
    }
    var html=node?decodeEmbeddedGameSource(node.textContent||''):'';
    if(html&&/<html(?:\s|>)/i.test(html))DIRECT_GAME_CACHE[key]=html;
    else DIRECT_GAME_CACHE[key]='';
    return DIRECT_GAME_CACHE[key];
  }
  function buildDirectGameHtml(rawHtml,key,context){
    /* V134 — adaptateur unique de cadrage. Le plateau original reste intact ;
       seule sa fenêtre d'affichage est ajustée à la largeur réelle du téléphone. */
    var html=String(rawHtml||'');
    if(!html)return html;
    var viewport='<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">';
    if(/<meta[^>]+name=["']viewport["'][^>]*>/i.test(html))html=html.replace(/<meta[^>]+name=["']viewport["'][^>]*>/i,viewport);
    else if(/<head[^>]*>/i.test(html))html=html.replace(/<head([^>]*)>/i,'<head$1>'+viewport);
    var fitCss='<style id="nx-adams-viewport-fit-v133">'+
      'html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;overscroll-behavior-x:none!important}'+
      'body{box-sizing:border-box!important}'+
      '.wrap,.container,.layout,.boardbox,.game-container,.game-screen,.screen,.screen.active{min-width:0!important;max-width:100%!important}'+
      '.boardbox,.game-board-wrap,.plateau-wrap{width:100%!important;overflow:visible!important}'+
      'canvas,svg,img,video{max-width:100%}'+
      '</style>';
    if(html.indexOf('nx-adams-viewport-fit-v133')<0){
      if(/<\/head>/i.test(html))html=html.replace(/<\/head>/i,fitCss+'</head>');
      else html=fitCss+html;
    }
    function nxAdamsViewportFitV134(){
      'use strict';
      var frame=0,resizeObserver=null,observed=null,lastSignature='';
      function isVisible(el){
        if(!el)return false;
        try{var s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>4&&r.height>4}catch(_e){return false}
      }
      function reset(el){
        if(!el)return;
        el.style.transform='none';el.style.transformOrigin='top left';el.style.width='';el.style.maxWidth='none';el.style.marginLeft='';el.style.marginRight='';el.style.marginBottom='';el.removeAttribute('data-nx-fitted-v133');
        var p=el.parentElement;if(p&&p.getAttribute('data-nx-fit-parent-v133')==='1'){p.style.height='';p.style.minHeight='';p.removeAttribute('data-nx-fit-parent-v133')}
      }
      function measure(el){
        var base=el.getBoundingClientRect(),minX=0,maxX=Math.max(el.scrollWidth||0,base.width||0),maxY=Math.max(el.scrollHeight||0,base.height||0);
        var nodes=[];try{nodes=el.querySelectorAll('*')}catch(_e){}
        var limit=Math.min(nodes.length,2200);
        for(var i=0;i<limit;i++){
          var node=nodes[i],style;
          try{style=getComputedStyle(node)}catch(_s){continue}
          if(style.display==='none'||style.visibility==='hidden'||style.position==='fixed')continue;
          var r=node.getBoundingClientRect();if(r.width<1||r.height<1)continue;
          var left=r.left-base.left,right=r.right-base.left,bottom=r.bottom-base.top;
          if(isFinite(left))minX=Math.min(minX,left);
          if(isFinite(right))maxX=Math.max(maxX,right);
          if(isFinite(bottom))maxY=Math.max(maxY,bottom);
        }
        return {left:base.left,minX:minX,width:Math.max(1,maxX-minX),height:Math.max(1,maxY)};
      }
      function findBoard(){
        var selectors=['#cp-board-wrap','.g-inner','.board-shell','.game-board','.board-container','.plateau','.board','[id$="-board"]','[id*="plateau"]','.screen.active .g-inner','.game-screen.active'];
        var best=null,bestScore=0;
        for(var s=0;s<selectors.length;s++){
          var list=[];try{list=document.querySelectorAll(selectors[s])}catch(_e){}
          for(var i=0;i<list.length;i++){
            var el=list[i];if(!isVisible(el))continue;
            reset(el);var m=measure(el),score=m.width*Math.min(m.height,1600);
            if(score>bestScore){best=el;bestScore=score}
          }
        }
        return best;
      }
      function observe(el){
        if(observed===el)return;
        if(resizeObserver)try{resizeObserver.disconnect()}catch(_e){}
        observed=el;
        if(typeof ResizeObserver==='function'&&el){
          resizeObserver=new ResizeObserver(function(){schedule()});
          try{resizeObserver.observe(el)}catch(_e){}
        }
      }
      function fit(){
        frame=0;
        var board=findBoard();if(!board)return;
        observe(board);reset(board);
        var viewportWidth=Math.max(260,(document.documentElement.clientWidth||window.innerWidth||360)),available=Math.max(240,viewportWidth-8);var parent=board.parentElement;if(parent){parent.style.width=available+'px';parent.style.maxWidth=available+'px';parent.style.marginLeft='0';parent.style.marginRight='0';}var first=measure(board);
        if(first.width>available){board.style.width=Math.ceil(first.width)+'px'}
        var m=measure(board),scale=Math.min(1,available/Math.max(1,m.width));
        scale=Math.max(.16,scale);
        var signature=Math.round(m.width)+'|'+Math.round(m.height)+'|'+Math.round(available)+'|'+scale.toFixed(4);
        if(signature===lastSignature&&board.getAttribute('data-nx-fitted-v133')==='1')return;
        lastSignature=signature;
        var visualWidth=m.width*scale,desiredLeft=Math.max(4,(viewportWidth-visualWidth)/2),offset=desiredLeft-m.left-Math.min(0,m.minX)*scale;
        board.style.transformOrigin='top left';
        board.style.transform='scale('+scale+')';
        board.style.marginLeft=offset+'px';
        board.style.marginRight='0';board.style.marginBottom='0';board.setAttribute('data-nx-fitted-v133','1');
        var parent=board.parentElement;
        if(parent){
          parent.setAttribute('data-nx-fit-parent-v133','1');
          parent.style.width=available+'px';parent.style.maxWidth=available+'px';parent.style.overflow='hidden';
          parent.style.height=Math.ceil(m.height*scale+10)+'px';parent.style.minHeight='0';
        }
        document.documentElement.style.overflowX='hidden';document.body.style.overflowX='hidden';
        try{window.scrollTo({left:0,top:window.scrollY||0,behavior:'auto'})}catch(_e){window.scrollTo(0,window.scrollY||0)}
      }
      function schedule(){if(frame)return;frame=requestAnimationFrame(function(){requestAnimationFrame(fit)})}window.__nxAdamsFitBoardV136=schedule;
      window.addEventListener('resize',schedule,{passive:true});
      window.addEventListener('orientationchange',function(){setTimeout(schedule,120)},{passive:true});
      window.addEventListener('load',schedule,{once:true});
      document.addEventListener('click',function(){setTimeout(schedule,40);setTimeout(schedule,260)},{passive:true});
      if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
      setTimeout(schedule,120);setTimeout(schedule,480);setTimeout(schedule,1100);
    }
    context=Object.assign({},context||{},{gameKey:key,screenId:SCREEN_BY_GAME[key]||'',prefix:PREFIX_BY_GAME[key]||''});
    var adapterCode='/* nx-adams-runtime-v136 */('+nxAdamsViewportFitV134.toString()+')();window.__NEXORA_ADAMS_CONTEXT='+JSON.stringify(context).replace(/<\/script/gi,'<\\/script')+';('+nxAdamsChildRuntime.toString()+')();';
    adapterCode=adapterCode.replace(/<\/script/gi,'<\\/script');
    var inlineScript=/<script(?![^>]*\bsrc=)[^>]*>/i.exec(html);
    if(inlineScript){var scriptInsert=inlineScript.index+inlineScript[0].length;html=html.slice(0,scriptInsert)+adapterCode+html.slice(scriptInsert);}
    else{var bodyMatch=/<body[^>]*>/i.exec(html),insertAt=bodyMatch?bodyMatch.index+bodyMatch[0].length:0;html=html.slice(0,insertAt)+scriptTag('nx-adams-runtime-v136',adapterCode)+html.slice(insertAt);}
    var fitScript='';
    return html;
  }
  function mountHtmlGame(wrap,html,label){
    wrap.innerHTML='';
    var frame=document.createElement('iframe');frame.className='nx-adams-game-frame';frame.setAttribute('data-nx-adams-game-frame','');frame.setAttribute('title',safeText(label||'Jeu Adams'));frame.setAttribute('allow','autoplay; fullscreen; clipboard-write');frame.setAttribute('allowfullscreen','');frame.setAttribute('referrerpolicy','no-referrer');
    wrap.appendChild(frame);state.frame=frame;state.frameReady=false;
    try{var doc=frame.contentDocument||frame.contentWindow.document;doc.open();doc.write(html);doc.close()}catch(err){try{frame.srcdoc=html}catch(_e){frame.src='data:text/html;charset=utf-8,'+encodeURIComponent(html)}}
    setTimeout(function(){try{frame.focus()}catch(_e){}},240);return frame;
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
    setHeader(label||titleFromKey(key),choosingLevel?'Choisis le niveau':(context.multiplayer?'Synchronisation du plateau':(context.playMode==='computer'?'Ordinateur Adams joue automatiquement':(context.playMode==='solo'?'Démarrage solo automatique':'Préparation du plateau'))),context.multiplayer&&state.room?('Code '+state.room.code):'',false);
    showLoading(wrap,label||titleFromKey(key),choosingLevel?'Ouverture de l’interface des niveaux.':(context.multiplayer?'Chargement du même plateau sur tous les téléphones.':(context.playMode==='solo'?'Ouverture immédiate avec un seul joueur.':'Préparation du plateau et des questions.')));
    return Promise.all([resolveGameConfig(key,label),delay(choosingLevel?220:60)]).then(function(parts){
      var cfg=parts[0]||{},finalKey=String(cfg.launch_key||cfg.slug||key).trim().replace(/[^a-z0-9_-]/gi,''),finalTitle=cfg.title||label||titleFromKey(finalKey);
      state.gameKey=finalKey;state.gameTitle=finalTitle;context.gameInstanceId=context.gameInstanceId||state.gameInstanceId||randomId();context.seed=toNumber(context.seed,Math.floor(Math.random()*2147483000)+1);
      var finalChoosingLevel=finalKey==='maternelle'||finalKey==='ecole';
      setHeader(finalTitle,finalChoosingLevel?'Choisis le niveau':(context.multiplayer?'Partie synchronisée':(context.playMode==='computer'?'Ordinateur Adams joue automatiquement':'Partie solo')),context.multiplayer&&state.room?('Code '+state.room.code):'',!finalChoosingLevel);
      if(!context.multiplayer&&(cfg.launch_mode==='public_url'||cfg.launch_mode==='route')&&cfg.public_url){mountUrlGame(wrap,cfg.public_url,finalTitle);return}
      var moduleUrl='modules/jeu-adams/'+finalKey+'/index.html';
      if(!window.NexoraSecureContent||typeof window.NexoraSecureContent.text!=='function')return Promise.reject(new Error('Protection Jeu Adams indisponible.'));
      return window.NexoraSecureContent.text(moduleUrl).then(function(rawHtml){
        if(!rawHtml||rawHtml.indexOf('<html')<0)throw new Error('Module vide');
        mountHtmlGame(wrap,buildDirectGameHtml(rawHtml,finalKey,context),finalTitle);
        return true;
      }).catch(function(err){
        wrap.innerHTML='<div class="nx-adams-game-loading"><div><strong>Jeu Adams indisponible</strong><span>Le plateau '+esc(finalTitle)+' n’a pas pu être chargé. Ferme cette fenêtre puis réessaie une seule fois.</span><button type="button" class="nx-adams-game-retry-v127" data-nx-adams-retry>Réessayer</button></div></div>';
        var retry=qs('[data-nx-adams-retry]',wrap);
        if(retry)retry.addEventListener('click',function(){launchGameSource(finalKey,finalTitle,context);},{once:true});
        notify('Impossible d’ouvrir ce Jeu Adams.');
        try{console.error('Chargement Jeu Adams',finalKey,err);}catch(_e){}
        return false;
      });
    });
  }
  function openGame(key,label){
    resetSession(false);state.mode='solo';state.gameKey=String(key||'').trim().replace(/[^a-z0-9_-]/gi,'');state.gameTitle=label||titleFromKey(state.gameKey);state.gameInstanceId=randomId();
    var seed=Math.floor(Math.random()*2147483000)+1;
    getIdentity(false).then(function(identity){state.identity=identity;startTrackedSession('solo',identity,{seed:seed});return launchGameSource(state.gameKey,state.gameTitle,{multiplayer:false,playMode:'solo',strictSolo:true,autoStart:true,playerCount:1,playerNames:[identity.name],ownSlot:1,seed:seed,gameInstanceId:state.gameInstanceId})});
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
    try{state.frame.contentWindow.postMessage({type:'nx-adams-replay',action:action},'*')}catch(_e){}
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
      var resultOnline=(typeof navigator==='undefined'||navigator.onLine!==false);
      var resultKey=state.room?(String(state.room.id)+'|'+String(state.room.round_no||1)+'|'+String(identity.id)):(mode+'|'+String(state.gameInstanceId||'game')+'|'+String(identity.id));
      if(state.resultSeen[resultKey]||hasLocalResultKey(identity,resultKey)){state.resultFinalized=true;return}
      state.resultFinalized=true;state.resultSeen[resultKey]=true;rememberLocalResultKey(identity,resultKey);state.resultCount++;
      var stats=readLocalStats(identity);
      stats.total_points+=score;stats.games_played+=1;if(won)stats.wins+=1;stats.best_score=Math.max(stats.best_score,score);stats.last_score=score;if(mode==='solo')stats.solo_games+=1;else if(mode==='computer'){stats.computer_games+=1;if(won)stats.computer_wins+=1}else{stats.multiplayer_games+=1;if(won)stats.multiplayer_wins+=1}
      writeLocalStats(identity,stats);renderStats(stats);
      var result={score:score,won:won,total_points:stats.total_points,games_played:stats.games_played,best_score:stats.best_score,game_key:state.gameKey,game_title:state.gameTitle,room_id:state.room&&state.room.id||null,result_key:resultKey,play_mode:mode,opponent_score:oppScore,score_source:scoreInfo.source,duration_seconds:duration,kdo_eligible:resultOnline,played_online:resultOnline};
      state.lastResult=result;
      try{window.dispatchEvent(new CustomEvent('nexora:adams-result',{detail:result}));}catch(_studentSyncEventError){}
      try{if(window.NexoraCourseGame&&typeof window.NexoraCourseGame.recordAttempt==='function')window.NexoraCourseGame.recordAttempt(result);}catch(_courseGameError){}
      showResultSheet(result);
      var client=getClient();
      if(resultOnline&&state.room&&client&&identity.authId){
        client.from('adams_game_players').update({score:score,status:'finished',last_seen:new Date().toISOString()}).eq('room_id',state.room.id).eq('user_id',identity.authId).then(function(){});
      }
      if(resultOnline&&client&&identity.authId){
        var finalizePromise=(state.session&&uuidLike(state.session.id))
          ?client.rpc('nexora_finalize_adams_answer_session',{p_session_id:state.session.id,p_won:won,p_result_key:resultKey,p_room_id:state.room&&uuidLike(state.room.id)?state.room.id:null,p_duration_seconds:duration,p_game_title:state.gameTitle,p_metadata:{game_instance_id:state.gameInstanceId,kdo_eligible:true,played_online:true}})
          :client.rpc('nexora_record_adams_result',{p_game_key:state.gameKey,p_score:score,p_won:won,p_room_id:state.room&&uuidLike(state.room.id)?state.room.id:null,p_result_key:resultKey,p_play_mode:mode,p_session_id:null,p_score_source:scoreInfo.source,p_score_verified:true,p_opponent_score:oppScore,p_duration_seconds:duration,p_game_title:state.gameTitle,p_metadata:{game_instance_id:state.gameInstanceId,correct_answers:score,kdo_eligible:true,played_online:true}});
        finalizePromise.then(function(res){
          if(res&&res.error)throw res.error;
          var data=unpack(res),serverScore=Number(data&&data.player_score);
          if(Number.isFinite(serverScore)&&serverScore>=0&&state.lastResult){state.lastResult.score=serverScore;}
          setTimeout(refreshStats,180);
        }).catch(function(){
          client.rpc('nexora_record_adams_result',{p_game_key:state.gameKey,p_score:score,p_won:won,p_room_id:state.room&&uuidLike(state.room.id)?state.room.id:null,p_result_key:resultKey,p_play_mode:mode,p_session_id:state.session&&uuidLike(state.session.id)?state.session.id:null,p_score_source:scoreInfo.source,p_score_verified:true,p_opponent_score:oppScore,p_duration_seconds:duration,p_game_title:state.gameTitle,p_metadata:{game_instance_id:state.gameInstanceId,correct_answers:score,kdo_eligible:true,played_online:true}}).then(function(){setTimeout(refreshStats,180)}).catch(function(){notify('Score conservé sur ce téléphone. La synchronisation sera reprise automatiquement.')});
        });
      }
    });
  }
  function fallbackPlateauImage(result){
    try{
      var c=document.createElement('canvas');c.width=1200;c.height=675;var x=c.getContext('2d');
      var g=x.createLinearGradient(0,0,1200,675);g.addColorStop(0,'#07162f');g.addColorStop(1,'#1d4ed8');x.fillStyle=g;x.fillRect(0,0,1200,675);
      x.fillStyle='rgba(255,255,255,.08)';for(var i=0;i<44;i++){x.beginPath();x.arc(60+(i%11)*108,70+Math.floor(i/11)*145,34,0,Math.PI*2);x.fill()}
      x.fillStyle='#ffffff';x.font='700 38px Arial';x.fillText('JEU ADAMS',72,92);x.font='700 56px Arial';x.fillText(String(result&&result.game_title||state.gameTitle||'Plateau Jeu Adams').slice(0,34),72,190);
      x.fillStyle='#bfdbfe';x.font='500 30px Arial';x.fillText(playModeLabel(result&&result.play_mode||currentPlayMode()),72,242);
      x.fillStyle='#ffffff';x.font='800 116px Arial';x.fillText(String(toNumber(result&&result.score))+' points',72,410);
      x.fillStyle='#dbeafe';x.font='500 27px Arial';x.fillText('Résultat enregistré dans Jeu Adams',72,480);
      x.fillStyle='#ffffff';x.font='700 28px Arial';x.fillText('NEXORA · ÉDUCATION · JEU ADAMS',72,603);
      return c.toDataURL('image/jpeg',.92);
    }catch(_e){return ''}
  }
  function capturePlateauImage(result){
    if(result&&result.plateau_image)return Promise.resolve(result.plateau_image);
    if(!state.frame||!state.frame.contentWindow)return Promise.resolve(fallbackPlateauImage(result));
    if(state.captureResolver)return new Promise(function(resolve){var old=state.captureResolver;state.captureResolver=function(data){try{old(data)}catch(_e){}resolve(data)}});
    return new Promise(function(resolve){
      state.captureResolver=function(data){state.captureResolver=null;if(state.captureTimer){clearTimeout(state.captureTimer);state.captureTimer=null}var finalData=data||fallbackPlateauImage(result);if(result)result.plateau_image=finalData;resolve(finalData)};
      state.captureTimer=setTimeout(function(){if(state.captureResolver){var fn=state.captureResolver;state.captureResolver=null;state.captureTimer=null;fn(fallbackPlateauImage(result))}},2600);
      try{state.frame.contentWindow.postMessage({type:'nx-adams-request-capture'},'*')}catch(_e){var fn=state.captureResolver;state.captureResolver=null;clearTimeout(state.captureTimer);state.captureTimer=null;fn(fallbackPlateauImage(result))}
    });
  }
  function dataUrlToFile(dataUrl,name){
    try{var parts=String(dataUrl||'').split(','),mime=(parts[0].match(/data:([^;]+)/)||[])[1]||'image/jpeg',bin=atob(parts[1]||''),arr=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new File([arr],name||'plateau-jeu-adams.jpg',{type:mime,lastModified:Date.now()})}catch(_e){return null}
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
    sheet.innerHTML='<div class="nx-adams-result-card"><span class="nx-adams-player-kicker" style="color:#1D4ED8;border-color:#DBEAFE;background:#EFF6FF">'+esc(result.won?'Victoire enregistrée':'Partie enregistrée')+'</span>'+
      '<h2>'+esc(result.score)+' point'+(Number(result.score)>1?'s':'')+' ajouté'+(Number(result.score)>1?'s':'')+'</h2><p>Le score exact est enregistré dans ton compteur Jeu Adams.</p><span class="nx-adams-result-mode">'+esc(playModeLabel(result.play_mode))+'</span>'+
      '<div class="nx-adams-result-score"><span><b data-nx-result-total>'+esc(result.total_points)+'</b><small>points cumulés</small></span><span><b data-nx-result-games>'+esc(result.games_played)+'</b><small>parties jouées</small></span></div>'+
      '<div class="nx-adams-result-actions"><button type="button" class="btn btn-primary" data-action="dismiss-adams-result">Continuer</button><button type="button" class="btn btn-soft" data-action="close-adams-game">Fermer le jeu</button></div></div>';
    wrap.appendChild(sheet);
  }
  function showScoreUnavailable(){
    state.scoreRequestPending=false;var wrap=qs('[data-nx-adams-game-frame-wrap]',ensureModal());if(!wrap)return;
    var old=qs('.nx-adams-result-sheet',wrap);if(old)old.remove();
    var sheet=document.createElement('div');sheet.className='nx-adams-result-sheet';
    sheet.innerHTML='<div class="nx-adams-result-card"><span class="nx-adams-player-kicker" style="color:#B45309;border-color:#FDE68A;background:#FFFBEB">Score non confirmé</span><h2>Aucun point ne sera inventé</h2><p>Le compteur attend une réponse réellement vérifiée. Réponds aux questions, puis appuie de nouveau sur Fin de partie.</p><div class="nx-adams-score-warning">Aucun point automatique n’est utilisé. Réponds à au moins une question : chaque bonne réponse réellement vérifiée vaut exactement 1 point.</div><div class="nx-adams-result-actions" style="margin-top:14px"><button type="button" class="btn btn-primary" data-action="dismiss-adams-result">Retour au plateau</button><button type="button" class="btn btn-soft" data-action="close-adams-game">Fermer</button></div></div>';
    wrap.appendChild(sheet);
  }
  function requestFinish(){
    var before=state.resultCount;state.scoreRequestPending=true;
    if(state.frame&&state.frame.contentWindow){try{state.frame.contentWindow.postMessage({type:'nx-adams-request-result'},'*')}catch(_e){}}
    setTimeout(function(){if(state.resultCount===before&&state.scoreRequestPending)showScoreUnavailable()},900);
  }
  function dismissResult(){var sheet=qs('.nx-adams-result-sheet');if(sheet)sheet.remove()}
  function publishResult(){toast('La publication des résultats est désactivée dans cette version de Nexora.');}

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
    }).then(function(res){if(res&&res.error)throw res.error;}).catch(function(){});
  }

  function closeGame(){
    var modal=qs('[data-nx-adams-game-modal]');if(!modal)return;
    clearRoomWatch();
    var wrap=qs('[data-nx-adams-game-frame-wrap]',modal);if(wrap)wrap.innerHTML='';
    modal.classList.remove('open');document.body.classList.remove('nx-adams-game-locked');
    state.frame=null;state.frameReady=false;state.mode='idle';state.room=null;state.players=[];state.pendingEvents=[];state.lastEventId=0;state.resultFinalized=false;state.session=null;state.startedAt=0;state.scoreRequestPending=false;state.liveScore=null;state.answerPoints=0;state.answerEventsSeen=0;state.answerKeys={};if(state.captureTimer){clearTimeout(state.captureTimer);state.captureTimer=null}state.captureResolver=null;
  }

  window.addEventListener('message',function(ev){
    var data=ev&&ev.data||{};
    if(!data||String(data.type||'').indexOf('nx-adams-')!==0)return;
    if(state.frame&&ev.source!==state.frame.contentWindow)return;
    if(data.type==='nx-adams-ready'){
      state.frameReady=true;flushPendingEvents();if(state.mode==='multi')fetchRoomEvents();
      var own=ownPlayer(),status=own?('Joueur '+own.slot+' · '+String(state.room&&state.room.code||'')):(state.room?('Code '+state.room.code):'');
      if(data.levelSelection===true){
        setHeader(state.gameTitle,'Choisis le niveau',status,false);
      }else{
        setHeader(state.gameTitle,state.mode==='multi'?'Plateau synchronisé':'Partie en cours',status,true);
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
    'open-adams-game':1,'open-adams-solo':1,'open-adams-computer':1,'open-adams-multiplayer':1,'join-adams-room':1,'close-adams-game':1,'set-adams-room-size':1,'create-adams-room':1,
    'submit-join-adams-room':1,'copy-adams-room-code':1,'share-adams-room':1,'start-adams-room':1,'finish-adams-game':1,
    'dismiss-adams-result':1
  };
  document.addEventListener('click',function(ev){
    var target=ev.target&&ev.target.closest?ev.target.closest('[data-action]'):null;if(!target)return;
    var action=target.getAttribute('data-action');if(!handledActions[action])return;
    ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
    function requireGameAccess(gameKey,callback){gameKey=String(gameKey||'').toLowerCase();if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('adams',callback);return false;}
    var requestedGame=target.getAttribute('data-adams-game')||'';
    if(action==='open-adams-game'||action==='open-adams-solo')requireGameAccess(requestedGame,function(){openGame(requestedGame,target.getAttribute('data-adams-game-label'));});
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
  document.addEventListener('keydown',function(ev){
    if(ev.key==='Escape'){if(qs('[data-nx-adams-game-modal].open'))closeGame();return}
    if(ev.key==='Enter'&&ev.target&&ev.target.matches&&ev.target.matches('[data-nx-adams-room-code-input]')){ev.preventDefault();joinRoom();return}
    if((ev.key==='Enter'||ev.key===' ')&&ev.target&&ev.target.matches&&ev.target.matches('.nx-adams-game-card[data-action="open-adams-game"]')){ev.preventDefault();ev.target.click()}
  });

  function openRoomFromUrl(){
    try{var url=new URL(location.href),code=cleanCode(url.searchParams.get('adams_room')||'');if(code)setTimeout(function(){openJoinRoom(code);},850)}catch(_e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){refreshStats();openRoomFromUrl()});
  else{refreshStats();openRoomFromUrl()}
  setInterval(function(){if(qs('[data-adams-center]'))refreshStats()},12000);

  function openWithPolicy(k,callback){k=String(k||'').toLowerCase();if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('adams',callback);return false;}
  window.NexoraAdamsGames={open:function(k,l){return openWithPolicy(k,function(){openGame(k,l);});},openSolo:function(k,l){return openWithPolicy(k,function(){openGame(k,l);});},openComputer:function(k,l){return openWithPolicy(k,function(){openComputerGame(k,l);});},openMultiplayer:function(k,l){return openWithPolicy(k,function(){openMultiplayerSetup(k,l);});},join:function(c){return openWithPolicy('join',function(){openJoinRoom(c||'');});},close:closeGame,finish:requestFinish,refreshStats:refreshStats};
})();

