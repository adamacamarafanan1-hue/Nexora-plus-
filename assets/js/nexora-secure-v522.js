
/* NEXORA V506.0 — abonnement et contenu sécurisé, sans cache de cours/jeux */
/* ===== inline-7 ===== */
(function(){
  'use strict';
  /* ==================================================================
     V518 — LA BOITE A OUTILS RETROUVEE
     Ces 24 fonctions et 5 declarations vivaient dans l'index.html
     monolithique et n'ont pas suivi au decoupage V506. Le module les
     appelait sans les avoir : il levait une ReferenceError des son
     demarrage, donc ni abonnement, ni verification d'acces, ni
     dechiffrement des contenus payants.
     Recopiees a l'identique depuis NEXORA_AUTONOME_V504_1.html.
     ================================================================== */

  /* --- V518 : declarations retrouvees dans le monolithe V504.1 --- */
  var CACHE_KEY='nexora_subscription_snapshot_v7';
  var LEGACY_CACHE_KEYS=['nexora_subscription_snapshot_v5','nexora_subscription_snapshot_v4','nexora_subscription_snapshot_v3'];
  var CLOCK_ROLLBACK_TOLERANCE_MS=5*60*1000;
  var NOTICE_STORAGE_PREFIX='nexora_subscription_notice_v250_';
  var PENDING_ACCESS=null;
  var CATALOG=null;
  var CATALOG_PROMISE=null;
  var CURRENT_REQUEST=null;
  var EXPIRY_TIMER=null;
  var LAST_SERVER_CHECK=0;
  var PAYMENT_UI_ERROR='';
  var PAYMENT_UI_PHASE='';
  var PENDING_CONTEXT='all';
  var PLANS={};
  var REALTIME_CHANNEL=null;
  var SELECTED_PLAN=null;
  var SERVER_CACHE_MS=15000;
  var STATUS_PROMISE=null;

  function esc(value){
      return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
    }

  function formatGNF(value){
      try{return Number(value||0).toLocaleString('fr-FR').replace(/\u202f/g,' ')+' GNF';}
      catch(_e){return String(value||0)+' GNF';}
    }

  function formatPhone(value){
      var digits=String(value||'').replace(/\D/g,'');
      if(digits.length===9)return digits.slice(0,3)+' '+digits.slice(3,5)+' '+digits.slice(5,7)+' '+digits.slice(7,9);
      if(digits.length===12&&digits.slice(0,3)==='224')return '+224 '+digits.slice(3,6)+' '+digits.slice(6,8)+' '+digits.slice(8,10)+' '+digits.slice(10,12);
      return digits||'—';
    }

  function formatDate(value){
      if(!value)return '';
      try{return new Date(value).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});}catch(_e){return String(value);}
    }

  function parseTime(value){
      var ms=value instanceof Date?value.getTime():new Date(value||0).getTime();
      return isFinite(ms)&&ms>0?ms:0;
    }

  function parseData(value){
      if(typeof value==='string'){
        try{return JSON.parse(value);}catch(_e){return {};}
      }
      return value||{};
    }

  function isOnline(){
      return typeof navigator==='undefined'||navigator.onLine!==false;
    }

  function isNetworkError(err){
      var msg=String(err&&err.message||err||'').toLowerCase();
      return !isOnline()||msg.indexOf('failed to fetch')>-1||msg.indexOf('network')>-1||msg.indexOf('connexion')>-1||msg.indexOf('délai')>-1||msg.indexOf('timeout')>-1;
    }

  function isMissingRpc(err){
      var code=String(err&&err.code||'');
      var msg=String(err&&err.message||err||'').toLowerCase();
      return code==='42883'||msg.indexOf('does not exist')>-1||msg.indexOf('could not find the function')>-1;
    }

  function friendlyError(err){
      var code=String(err&&err.code||'');
      var msg=String(err&&err.message||err||'Action impossible.');
      var detail=String(err&&err.details||'');
      var hint=String(err&&err.hint||'');
      var low=msg.toLowerCase();
      if(code==='42501'||low.indexOf('session')>-1||low.indexOf('connecte-toi')>-1)return 'Connecte-toi à ton compte Nexora avant de continuer.';
      if(low.indexOf('failed to fetch')>-1||low.indexOf('network')>-1)return 'Connexion Internet momentanément indisponible.';
      if(isMissingRpc(err))return 'Le paiement ne peut pas être enregistré pour le moment. Réessaie dans quelques instants.';
      if(/supabase|postgrest|storage|bucket|policy|policies|rls|sql|cdn|sdk|jwt|schema|trigger|rpc|server|serveur/i.test(msg+' '+detail+' '+hint))return 'Le service Nexora est momentanément indisponible. Réessaie dans quelques instants.';
      return msg+(detail?' — '+detail:'')+(hint?' — '+hint:'');
    }

  function withTimeout(promise,ms,message){
      return Promise.race([
        promise,
        new Promise(function(_resolve,reject){setTimeout(function(){reject(new Error(message||'Délai dépassé.'));},ms||12000);})
      ]);
    }

  function getClient(){
      try{return window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function'?window.NexoraApp.getSupabaseClient():null;}catch(_e){return null;}
    }

  async function waitClient(){
      for(var i=0;i<60;i++){
        var c=getClient();
        if(c&&c.auth&&typeof c.rpc==='function')return c;
        await new Promise(function(resolve){setTimeout(resolve,120);});
      }
      throw new Error('Connexion à Nexora indisponible. Vérifie Internet puis réessaie.');
    }

  async function currentUser(client){
      var session=await client.auth.getSession();
      var user=session&&session.data&&session.data.session&&session.data.session.user;
      if(user)return user;
      try{
        var refreshed=await client.auth.refreshSession();
        user=refreshed&&refreshed.data&&refreshed.data.session&&refreshed.data.session.user;
        if(user)return user;
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      return null;
    }

  function readSnapshot(){
      var data={authenticated:false,active:false,status:'inactive',ends_at:null,offline_eligible:false};
      try{
        var raw=localStorage.getItem(CACHE_KEY);
        if(!raw){for(var i=0;i<LEGACY_CACHE_KEYS.length&&!raw;i++)raw=localStorage.getItem(LEGACY_CACHE_KEYS[i]);}
        if(raw)data=Object.assign(data,JSON.parse(raw)||{});
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      var clock=subscriptionClock(data,true);
      if(clock.rollback&&!isOnline()&&data.active===true){
        data.active=false;
        data.status='verification_required';
        data.offline_eligible=false;
        return data;
      }
      if(data.ends_at&&parseTime(data.ends_at)<=clock.now){
        data=markExpired(data,'expired');
      }
      try{
        localStorage.setItem(CACHE_KEY,JSON.stringify(data));
        LEGACY_CACHE_KEYS.forEach(function(key){localStorage.setItem(key,JSON.stringify(data));});
      }catch(_persistError){window.nxLog&&window.nxLog(_persistError)}
      return data;
    }

  function subscriptionClock(snapshot,update){
      snapshot=snapshot&&typeof snapshot==='object'?snapshot:{};
      var deviceNow=Date.now();
      var verifiedDevice=Number(snapshot.trusted_device_ms||snapshot.server_verified_at||0);
      var trustedServer=Number(snapshot.trusted_server_ms||0)||parseTime(snapshot.server_now);
      var lastDevice=Number(snapshot.last_device_seen_ms||verifiedDevice||0);
      var lastTrusted=Number(snapshot.last_trusted_now_ms||trustedServer||0);
      var rollback=!!(lastDevice&&deviceNow+CLOCK_ROLLBACK_TOLERANCE_MS<lastDevice);
      var estimated=deviceNow;
      if(trustedServer&&verifiedDevice){
        var elapsed=deviceNow-verifiedDevice;
        if(elapsed<0)elapsed=0;
        estimated=trustedServer+elapsed;
      }
      var now=Math.max(estimated,lastTrusted||0);
      if(update!==false){
        snapshot.last_device_seen_ms=Math.max(deviceNow,lastDevice||0);
        snapshot.last_trusted_now_ms=Math.max(now,lastTrusted||0);
      }
      return {now:now,rollback:rollback,device_now:deviceNow};
    }

  function remainingDays(snapshot){
      var end=parseTime(snapshot&&snapshot.ends_at);
      if(!end)return null;
      var now=subscriptionClock(snapshot||{},false).now;
      return Math.max(0,Math.ceil((end-now)/86400000));
    }

  function renewalNoticeKey(snapshot){
      return NOTICE_STORAGE_PREFIX+String(parseTime(snapshot&&snapshot.ends_at)||'unknown');
    }

  function renewalNoticeMessage(snapshot){
      var days=remainingDays(snapshot);
      if(days===null||days<1||days>RENEWAL_NOTICE_DAYS)return '';
      return 'Votre abonnement Nexora prend fin le '+formatDate(snapshot.ends_at)+'. Il vous reste '+days+' jour'+(days>1?'s':'')+'. Renouvelez votre abonnement pour éviter l’interruption de votre accès.';
    }

  function deliverRenewalNotice(snapshot){
      var message=String(snapshot&&snapshot.notice_message||renewalNoticeMessage(snapshot)||'');
      var days=remainingDays(snapshot);
      if(!message||days===null||days<1||days>RENEWAL_NOTICE_DAYS)return false;
      var key=renewalNoticeKey(snapshot);
      var already=false;
      try{already=localStorage.getItem(key)==='delivered';}catch(_e){window.nxLog&&window.nxLog(_e)}
      if(already)return false;
      try{localStorage.setItem(key,'delivered');}catch(_e){window.nxLog&&window.nxLog(_e)}
      try{if(typeof window.toast==='function')window.toast(message);}catch(_toastError){window.nxLog&&window.nxLog(_toastError)}
      try{
        if('Notification' in window&&window.Notification.permission==='granted'){
          new window.Notification('Abonnement Nexora bientôt expiré',{body:message,tag:key,renotify:false});
        }
      }catch(_notificationError){window.nxLog&&window.nxLog(_notificationError)}
      return true;
    }

  function cachedAccessStatus(){
      var snapshot=readSnapshot();
      return {
        allowed:snapshot.active===true&&snapshot.status==='active'&&snapshot.offline_eligible!==false,
        snapshot:snapshot,
        reason:snapshot.status||'inactive'
      };
    }

  function markExpired(snapshot,status){
      snapshot=Object.assign({},snapshot||{});
      snapshot.active=false;
      snapshot.offline_eligible=false;
      snapshot.notice_due=false;
      snapshot.status=status||'expired';
      return snapshot;
    }

  function enforceExpiredAccess(snapshot,announce){
      snapshot=markExpired(snapshot||readSnapshot(),'expired');
      writeSnapshot(snapshot);
      revokeSecureEntitlement('expired');
      closePremiumViews();
      if(announce){
        try{if(typeof window.toast==='function')window.toast('Votre abonnement Nexora est arrivé à expiration. L’accès aux contenus payants est maintenant bloqué. Renouvelez votre abonnement pour continuer.');}catch(_e){window.nxLog&&window.nxLog(_e)}
      }
      return snapshot;
    }

  function grantPendingAccess(message){
      var run=PENDING_ACCESS;PENDING_ACCESS=null;
      if(typeof run==='function')run();
      if(message){try{if(typeof window.toast==='function')window.toast(message);}catch(_e){window.nxLog&&window.nxLog(_e)}}
      return true;
    }

  function revokeSecureEntitlement(reason){
      try{
        if(window.NexoraSecureContent&&typeof window.NexoraSecureContent.revoke==='function'){
          Promise.resolve(window.NexoraSecureContent.revoke(reason||'expired')).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')});
        }
      }catch(_e){window.nxLog&&window.nxLog(_e)}
    }

  /* ============ fin de la boite a outils retrouvee ============ */

  var VERSION='v523-20260813-1';
  var DB_NAME='nexora-secure-content-v211';
  var DB_VERSION=1;
  var ENTITLEMENT_ID='current';
  var DEVICE_ID='rsa-device';
  var MANIFEST_URL='/protected/manifest.json';
  var ROLLBACK_TOLERANCE=5*60*1000;
  var memoryRecord=null;
  var manifestPromise=null;
  var activationPromise=null;
  var authObserverReady=false;
  var enc=new TextEncoder();
  var dec=new TextDecoder('utf-8');

  /* V506 : constantes explicites. Elles manquaient dans V505.1 et pouvaient interrompre le heartbeat d'abonnement. */
  var RENEWAL_NOTICE_DAYS=7;
  var STRICT_STATUS_INTERVAL_MS=5*60*1000;
  var STRICT_HEARTBEAT_TIMER=null;
  var STRICT_CHECK_PROMISE=null;
  var POLL_TIMER=null;
  var NX_SECURE_FETCH_TIMEOUT_MS=15000;
  function nxSecureFetchV506(url,options){
    options=options||{};
    var controller=typeof AbortController!=='undefined'?new AbortController():null;
    var timer=controller?setTimeout(function(){try{controller.abort();}catch(_e){}},NX_SECURE_FETCH_TIMEOUT_MS):null;
    if(controller)options.signal=controller.signal;
    return fetch(url,options).finally(function(){if(timer)clearTimeout(timer);});
  }

  function online(){return typeof navigator==='undefined'||navigator.onLine!==false;}

  async function clearLegacyContentCaches(){
    if(typeof caches==='undefined'||!caches.keys)return;
    try{var keys=await caches.keys();await Promise.all(keys.filter(function(k){return /^nexora-premium-encrypted-/i.test(k);}).map(function(k){return caches.delete(k);}));}catch(_e){window.nxLog&&window.nxLog(_e)}
  }
  function normalizePath(path){return String(path||'').replace(/^https?:\/\/[^/]+\//i,'').replace(/^\.\//,'').replace(/^\//,'');}
  function notify(message){try{if(typeof window.toast==='function'){window.toast(message);return;}}catch(_e){window.nxLog&&window.nxLog(_e)}try{console.info('[Nexora sécurisé]',message);}catch(_e2){window.nxLog&&window.nxLog(_e2)}}
  function b64ToBytes(value){var s=String(value||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var bin=atob(s),out=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
  function errorMessage(code){var e=new Error(code);e.code=code;return e;}
  function openDb(){return new Promise(function(resolve,reject){var req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains('entitlements'))db.createObjectStore('entitlements',{keyPath:'id'});if(!db.objectStoreNames.contains('device'))db.createObjectStore('device',{keyPath:'id'});};req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error||new Error('IndexedDB indisponible.'));};});}
  async function dbGet(store,id){var db=await openDb();return new Promise(function(resolve,reject){var tx=db.transaction(store,'readonly'),req=tx.objectStore(store).get(id);req.onsuccess=function(){resolve(req.result||null);};req.onerror=function(){reject(req.error);};tx.oncomplete=function(){db.close();};});}
  async function dbPut(store,value){var db=await openDb();return new Promise(function(resolve,reject){var tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=function(){db.close();resolve(value);};tx.onerror=function(){db.close();reject(tx.error);};});}
  async function dbDelete(store,id){var db=await openDb();return new Promise(function(resolve,reject){var tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(id);tx.oncomplete=function(){db.close();resolve();};tx.onerror=function(){db.close();reject(tx.error);};});}

  async function getSession(){try{var c=window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function'?window.NexoraApp.getSupabaseClient():null;if(!c||!c.auth)return null;var r=await c.auth.getSession();return r&&r.data&&r.data.session||null;}catch(_e){return null;}}
  async function setupAuthObserver(){if(authObserverReady)return;var c=null;for(var i=0;i<50&&!c;i++){try{c=window.NexoraApp&&window.NexoraApp.getSupabaseClient&&window.NexoraApp.getSupabaseClient();}catch(_e){window.nxLog&&window.nxLog(_e)}if(!c)await new Promise(function(r){setTimeout(r,150);});}if(!c||!c.auth||typeof c.auth.onAuthStateChange!=='function')return;authObserverReady=true;c.auth.onAuthStateChange(function(event){if(event==='SIGNED_OUT'||event==='USER_DELETED')revoke('logout');});}

  function trustedClock(record,update){var deviceNow=Date.now(),verified=Number(record.verified_device_ms||0),server=Number(record.server_now_ms||0),lastDevice=Number(record.last_device_seen_ms||verified||0),lastTrusted=Number(record.last_trusted_now_ms||server||0);var rollback=!!(lastDevice&&deviceNow+ROLLBACK_TOLERANCE<lastDevice),estimated=deviceNow;if(server&&verified){var elapsed=deviceNow-verified;if(elapsed<0)elapsed=0;estimated=server+elapsed;}var now=Math.max(estimated,lastTrusted||0);if(update){record.last_device_seen_ms=Math.max(deviceNow,lastDevice||0);record.last_trusted_now_ms=Math.max(now,lastTrusted||0);}return {now:now,rollback:rollback};}
  async function loadRecord(){if(memoryRecord)return memoryRecord;memoryRecord=await dbGet('entitlements',ENTITLEMENT_ID);return memoryRecord;}
  async function validateRecord(record,checkUser){if(!record||record.version!==VERSION||!record.content_key||!record.ends_at_ms)return false;var clock=trustedClock(record,true);if(clock.rollback)return false;if(clock.now>=Number(record.ends_at_ms||0)){await revoke('expired');return false;}if(checkUser!==false){var session=await getSession();if(session&&session.user&&record.user_id&&String(session.user.id)!==String(record.user_id)){await revoke('account_changed');return false;}}memoryRecord=record;try{await dbPut('entitlements',record);}catch(_storeError){window.nxLog&&window.nxLog(_storeError);}return true;}

  var memoryDeviceKeys=null;async function deviceKeys(){if(memoryDeviceKeys&&memoryDeviceKeys.private_key&&memoryDeviceKeys.public_jwk)return memoryDeviceKeys;var saved=null;try{saved=await dbGet('device',DEVICE_ID);}catch(_readError){window.nxLog&&window.nxLog(_readError);}if(saved&&saved.private_key&&saved.public_jwk)return saved;var pair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['wrapKey','unwrapKey']);var publicJwk=await crypto.subtle.exportKey('jwk',pair.publicKey);var privatePkcs8=await crypto.subtle.exportKey('pkcs8',pair.privateKey);var privateKey=await crypto.subtle.importKey('pkcs8',privatePkcs8,{name:'RSA-OAEP',hash:'SHA-256'},false,['unwrapKey']);saved={id:DEVICE_ID,private_key:privateKey,public_jwk:publicJwk,created_at:new Date().toISOString()};/* V533 : Safari refuse parfois d'enregistrer un CryptoKey dans IndexedDB. Le refus ne doit pas fermer l'acces aux cours. */memoryDeviceKeys=saved;try{await dbPut('device',saved);}catch(_storeError){window.nxLog&&window.nxLog(_storeError);}return saved;}

  async function loadManifest(){if(manifestPromise)return manifestPromise;manifestPromise=nxSecureFetchV506(MANIFEST_URL,{cache:'no-store',credentials:'same-origin'}).then(function(r){if(!r.ok)throw new Error('Manifest sécurisé indisponible.');return r.json();}).then(function(m){if(!m||m.version!==VERSION||!Array.isArray(m.entries))throw new Error('Manifest sécurisé invalide.');m.byPath={};m.entries.forEach(function(e){m.byPath[normalizePath(e.path)]=e;});return m;}).catch(function(err){manifestPromise=null;throw err;});return manifestPromise;}

  async function issueKey(snapshot){var session=await getSession();if(!session||!session.access_token||!session.user)throw errorMessage('Connexion Nexora obligatoire pour activer les contenus.');var keys=await deviceKeys();var response=await nxSecureFetchV506('/api/content-key',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({public_key_jwk:keys.public_jwk,content_version:VERSION,product_code:String(snapshot&&snapshot.product_code||snapshot&&snapshot.plan_code||'').toLowerCase(),device_id:(crypto.randomUUID?crypto.randomUUID():String(Date.now()))})});var data={};try{data=await response.json();}catch(_e){window.nxLog&&window.nxLog(_e)}if(!response.ok||data.success!==true)throw errorMessage(data.message||'Abonnement non autorisé pour les contenus protégés.');var wrapped=b64ToBytes(data.wrapped_key);var contentKey=await crypto.subtle.unwrapKey('raw',wrapped,keys.private_key,{name:'RSA-OAEP'},{name:'AES-GCM'},false,['decrypt']);var serverNow=Date.parse(data.server_now||'')||Date.now(),ends=Date.parse(data.ends_at||'')||0;if(!ends||ends<=serverNow)throw errorMessage('La date d’expiration de l’abonnement est invalide.');var record={id:ENTITLEMENT_ID,version:VERSION,user_id:String(data.user_id||session.user.id),content_key:contentKey,starts_at:data.starts_at||null,ends_at:data.ends_at,ends_at_ms:ends,server_now_ms:serverNow,verified_device_ms:Date.now(),last_device_seen_ms:Date.now(),last_trusted_now_ms:serverNow,issued_at:new Date().toISOString()};memoryRecord=record;try{await dbPut('entitlements',record);}catch(_storeError){window.nxLog&&window.nxLog(_storeError);}window.dispatchEvent(new CustomEvent('nexora:premium-ready',{detail:{ends_at:record.ends_at}}));return record;}

  async function activate(snapshot){if(activationPromise)return activationPromise;activationPromise=(async function(){var existing=await loadRecord();if(existing&&await validateRecord(existing,true)){var incomingEnd=Date.parse(snapshot&&snapshot.ends_at||'')||0;if(!incomingEnd||incomingEnd<=Number(existing.ends_at_ms||0))return existing;}if(!online())throw errorMessage('Connexion Internet nécessaire pour activer ce téléphone.');return issueKey(snapshot||{});})();try{return await activationPromise;}finally{activationPromise=null;}}

  async function entitlement(){var record=await loadRecord();if(record&&await validateRecord(record,true))return record;if(online())return activate({});throw errorMessage('Connexion Internet nécessaire pour ouvrir ce contenu premium.');}
  async function hasValidEntitlement(){try{await entitlement();return true;}catch(_e){return false;}}

  /* V535 : les fichiers de cours pesent de 1,2 a 2,7 Mo. Sur une 4G instable, une seule
   coupure suffisait a afficher « Lecons indisponibles ». On retente donc trois fois,
   avec une pause qui s'allonge, avant d'abandonner. Le message d'echec distingue
   desormais une coupure reseau d'un vrai refus du serveur. */
/* V536 : les fichiers de cours pesent de 1,2 a 2,7 Mo et etaient retelecharges a
   CHAQUE ouverture. On les garde desormais sur l'appareil, **toujours chiffres** :
   le fichier au repos reste exactement celui du serveur, et la cle continue d'exiger
   un abonnement valide a chaque session. Rien n'est affaibli, mais la deuxieme
   ouverture est immediate et ne coute plus de donnees. Le cache est nomme d'apres
   la version de contenu : une mise a jour des lecons le remplace toute seule. */
var CACHE_CONTENU_V536 = 'nexora-contenu-' + VERSION;

async function ouvrirCacheContenu(){
  try{
    if(!window.caches || typeof window.caches.open !== 'function') return null;
    return await window.caches.open(CACHE_CONTENU_V536);
  }catch(_e){ window.nxLog && window.nxLog(_e); return null; }
}

async function purgerAnciensContenus(){
  try{
    if(!window.caches || typeof window.caches.keys !== 'function') return;
    var noms = await window.caches.keys();
    for(var i=0;i<noms.length;i++){
      if(noms[i].indexOf('nexora-contenu-')===0 && noms[i]!==CACHE_CONTENU_V536){
        try{ await window.caches.delete(noms[i]); }catch(_e2){ window.nxLog && window.nxLog(_e2); }
      }
    }
  }catch(_e3){ window.nxLog && window.nxLog(_e3); }
}
purgerAnciensContenus();

async function encryptedBytes(entry){
  var target=/^https?:/i.test(String(entry.url||''))?entry.url:'/'+normalizePath(entry.url);
  var cache=await ouvrirCacheContenu();

  if(cache){
    try{
      var garde=await cache.match(target);
      if(garde && garde.ok){
        var octets=new Uint8Array(await garde.arrayBuffer());
        if(octets.length>32) return octets;
      }
    }catch(_eLecture){ window.nxLog && window.nxLog(_eLecture); }
  }

  if(!online())throw errorMessage('Connexion Internet nécessaire pour ouvrir ce cours ou ce jeu.');
  var essais=0,derniere=null;
  while(essais<3){
    essais++;
    try{
      /* V537 : les fichiers de cours sont immuables (leur nom est une empreinte) et
   desormais mis en cache par Vercel. On laisse donc le navigateur utiliser son
   propre cache au lieu de le contourner : la 2e ouverture passe de ~3,8 s a ~30 ms. */
      var request=new Request(target,{credentials:'omit'});
      var response=await nxSecureFetchV506(request,{credentials:'same-origin'});
      if(response&&response.ok){
        if(cache){ try{ await cache.put(target, response.clone()); }catch(_eEcriture){ window.nxLog && window.nxLog(_eEcriture); } }
        return new Uint8Array(await response.arrayBuffer());
      }
      derniere=errorMessage('Chargement sécurisé impossible ('+(response&&response.status||0)+').');
      if(response&&response.status&&response.status<500&&response.status!==408&&response.status!==429)throw derniere;
    }catch(erreurReseau){
      derniere=erreurReseau;
      window.nxLog&&window.nxLog(erreurReseau);
    }
    if(essais<3)await new Promise(function(r){setTimeout(r,essais*1200);});
  }
  throw derniere||errorMessage('Le cours n’a pas pu être téléchargé. Vérifie ta connexion, puis réessaie.');
}
async function decrypt(path){path=normalizePath(path);var record=await entitlement(),manifest=await loadManifest(),entry=manifest.byPath[path];if(!entry)throw errorMessage('Contenu sécurisé inconnu : '+path);var packed=await encryptedBytes(entry);if(packed.length<33||String.fromCharCode.apply(null,packed.slice(0,4))!=='NXE1')throw errorMessage('Paquet sécurisé invalide.');var iv=packed.slice(4,16),cipher=packed.slice(16),plain;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:iv,additionalData:enc.encode(path)},record.content_key,cipher);}finally{try{packed.fill(0);cipher.fill(0);}catch(_wipeError){}}return new Uint8Array(plain);}
  async function text(path){return dec.decode(await decrypt(path));}
  async function json(path){return JSON.parse(await text(path));}
  async function execute(path){path=normalizePath(path);var marker='data-nexora-secure-script';var old=Array.prototype.slice.call(document.scripts||[]).some(function(x){return x.getAttribute&&x.getAttribute(marker)===path;});if(old)return true;var code=await text(path);return new Promise(function(resolve,reject){var blob=new Blob([code+'\n//# sourceURL='+path],{type:'text/javascript'}),url=URL.createObjectURL(blob),s=document.createElement('script');s.setAttribute(marker,path);s.src=url;s.onload=function(){URL.revokeObjectURL(url);resolve(true);};s.onerror=function(){URL.revokeObjectURL(url);s.remove();reject(new Error('Exécution sécurisée impossible.'));};document.head.appendChild(s);});}

  async function preloadAll(){return {disabled:true,downloaded:0,total:0,pending:0};}

  async function revoke(reason){
    memoryRecord=null;
    try{await dbDelete('entitlements',ENTITLEMENT_ID);}catch(_deleteError){window.nxLog&&window.nxLog(_deleteError,'secure-revoke');}
    try{window.dispatchEvent(new CustomEvent('nexora:premium-revoked',{detail:{reason:String(reason||'revoked')}}));}catch(_eventError){window.nxLog&&window.nxLog(_eventError)}
    return true;
  }

  function syncSnapshot(snapshot){
    snapshot=snapshot&&typeof snapshot==='object'?snapshot:{};
    if(snapshot.active===true&&snapshot.status==='active')return true;
    var reason=String(snapshot.status||'inactive');
    revoke(reason).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'secure-sync');});
    return false;
  }

  window.NexoraSecureContent={
    version:VERSION,
    activate:activate,
    entitlement:entitlement,
    hasValidEntitlement:hasValidEntitlement,
    decrypt:decrypt,
    text:text,
    json:json,
    execute:execute,
    preloadAll:preloadAll,
    revoke:revoke,
    syncSnapshot:syncSnapshot
  };
  setupAuthObserver().catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'secure-auth-observer');});
  clearLegacyContentCaches().catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'secure-cache-cleanup');});

  function closePremiumViews(){
    try{
      var closers=['nxBacCloseButton','nx10CloseButton','nxOrientationCloseV108'];
      closers.forEach(function(id){var el=document.getElementById(id);if(el&&el.offsetParent!==null)el.click();});
      if(window.NexoraPrimarySchoolV157&&typeof window.NexoraPrimarySchoolV157.close==='function')window.NexoraPrimarySchoolV157.close();
      var academyClose=document.querySelector('#nxAcademyViewer [data-nx-academy-action="close"]');
      if(academyClose)academyClose.click();
      else{var academyViewer=document.getElementById('nxAcademyViewer');if(academyViewer&&!academyViewer.hidden)academyViewer.hidden=true;}
      var gameModal=document.querySelector('[data-nx-adams-game-modal].open');
      var gameFrame=gameModal&&gameModal.querySelector('[data-nx-adams-game-frame]');
      var gameSrc=String(gameFrame&&gameFrame.getAttribute('src')||'').toLowerCase();
      if(gameModal&&gameSrc.indexOf('/guinee/')===-1&&window.NexoraAdamsGames&&typeof window.NexoraAdamsGames.close==='function')window.NexoraAdamsGames.close();
      document.querySelectorAll('iframe[data-nx-protected-frame],#nxAcademyViewer iframe,#nxBacViewer iframe,#nxOrientationViewer iframe').forEach(function(frame){
        var src=String(frame.getAttribute('src')||'').toLowerCase();
        if(src.indexOf('/guinee/')===-1){try{frame.src='about:blank';}catch(_frameError){window.nxLog&&window.nxLog(_frameError)}}
      });
      var lockedScreen=document.querySelector('#screen-subjects.active,#screen-novels.active,#screen-access.active');
      if(lockedScreen&&window.NexoraApp&&typeof window.NexoraApp.go==='function')window.NexoraApp.go('student-work-feed');
    }catch(_e){window.nxLog&&window.nxLog(_e)}
  }

  function scheduleExpiry(snapshot){
    if(EXPIRY_TIMER){clearTimeout(EXPIRY_TIMER);EXPIRY_TIMER=null;}
    if(!snapshot||snapshot.status!=='active'||!snapshot.ends_at)return;
    var delay=parseTime(snapshot.ends_at)-subscriptionClock(snapshot,false).now;
    if(!isFinite(delay)||delay<=0){
      enforceExpiredAccess(snapshot,true);refreshSubscriptionUI();return;
    }
    EXPIRY_TIMER=setTimeout(function(){
      var current=readSnapshot();
      if(current.ends_at&&parseTime(current.ends_at)<=subscriptionClock(current,false).now){
        enforceExpiredAccess(current,true);refreshSubscriptionUI();
      }else{
        scheduleExpiry(current);
        if(isOnline())fetchStatus(true).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')});
      }
    },Math.min(delay+250,2140000000));
  }

  function writeSnapshot(snapshot){
    snapshot=Object.assign({authenticated:false,active:false,status:'inactive',offline_eligible:false},snapshot||{});
    var deviceNow=Date.now();
    if(snapshot.active===true&&snapshot.status==='active'){
      snapshot.offline_eligible=true;
      snapshot.trusted_server_ms=Number(snapshot.trusted_server_ms||0)||parseTime(snapshot.server_now)||deviceNow;
      snapshot.trusted_device_ms=deviceNow;
      snapshot.last_device_seen_ms=deviceNow;
      snapshot.last_trusted_now_ms=Math.max(Number(snapshot.last_trusted_now_ms||0),snapshot.trusted_server_ms);
      snapshot.offline_granted_at=snapshot.offline_granted_at||new Date(deviceNow).toISOString();
      snapshot.days_remaining=remainingDays(snapshot);
      snapshot.notice_due=snapshot.days_remaining!==null&&snapshot.days_remaining>=1&&snapshot.days_remaining<=RENEWAL_NOTICE_DAYS;
      if(snapshot.notice_due&&!snapshot.notice_message)snapshot.notice_message=renewalNoticeMessage(snapshot);
    }else if(snapshot.status==='expired'||snapshot.status==='revoked'||snapshot.status==='not_connected'||snapshot.status==='inactive'){
      snapshot.offline_eligible=false;
    }
    try{
      localStorage.setItem(CACHE_KEY,JSON.stringify(snapshot));
      LEGACY_CACHE_KEYS.forEach(function(key){localStorage.setItem(key,JSON.stringify(snapshot));});
    }catch(_e){window.nxLog&&window.nxLog(_e)}
    try{if(window.NexoraSecureContent&&typeof window.NexoraSecureContent.syncSnapshot==='function')window.NexoraSecureContent.syncSnapshot(snapshot);}catch(_secureError){window.nxLog&&window.nxLog(_secureError)}
    if(snapshot.active===true&&snapshot.status==='active')deliverRenewalNotice(snapshot);
    if(snapshot.status==='expired'||snapshot.status==='revoked'){
      revokeSecureEntitlement(snapshot.status);
      closePremiumViews();
    }
    scheduleExpiry(snapshot);
    return snapshot;
  }

  function normalizeStatus(data){
    data=parseData(data);
    var deviceNow=Date.now();
    var serverNow=parseTime(data.server_now)||deviceNow;
    var end=parseTime(data.ends_at);
    var requestedStatus=String(data.status||'inactive');
    var active=data.active===true&&requestedStatus==='active'&&(!end||end>serverNow);
    var normalizedStatus=active?'active':((requestedStatus==='active'&&end&&end<=serverNow)?'expired':requestedStatus);
    var snapshot={
      authenticated:data.authenticated!==false,
      active:active,
      status:normalizedStatus,
      authoritative:data.authoritative===true||data.version==='v250',
      source:data.source||'',
      product_code:data.product_code||data.plan_code||'all',
      plan_code:data.plan_code||data.product_code||'',
      duration_months:Number(data.duration_months||0)||null,
      price_gnf:Number(data.price_gnf||data.amount_gnf||0)||null,
      starts_at:data.starts_at||null,
      ends_at:data.ends_at||null,
      server_now:data.server_now||new Date(serverNow).toISOString(),
      server_verified_at:deviceNow,
      trusted_server_ms:serverNow,
      trusted_device_ms:deviceNow,
      last_device_seen_ms:deviceNow,
      last_trusted_now_ms:serverNow,
      offline_eligible:active,
      days_remaining:data.days_remaining==null?null:Number(data.days_remaining),
      notice_due:data.notice_due===true,
      notice_message:data.notice_message||''
    };
    if(active&&snapshot.days_remaining==null)snapshot.days_remaining=remainingDays(snapshot);
    if(active&&snapshot.days_remaining!==null&&snapshot.days_remaining>=1&&snapshot.days_remaining<=RENEWAL_NOTICE_DAYS){
      snapshot.notice_due=true;
      if(!snapshot.notice_message)snapshot.notice_message=renewalNoticeMessage(snapshot);
    }
    return snapshot;
  }

  async function callStatus(client){
    var canonical=await withTimeout(client.rpc('nexora_my_subscription_status_v264',{p_product_code:'all'}),10000,'La vérification officielle de l’abonnement prend trop de temps.');
    if(canonical&&canonical.error)throw canonical.error;
    var raw=parseData(canonical&&canonical.data);
    raw.authoritative=true;raw.version='v264';
    return normalizeStatus(raw);
  }

  async function fetchStatus(force){
    if(!isOnline())return readSnapshot();
    if(!force&&Date.now()-LAST_SERVER_CHECK<SERVER_CACHE_MS)return readSnapshot();
    if(STATUS_PROMISE)return STATUS_PROMISE;
    STATUS_PROMISE=(async function(){
      try{
        var client=await waitClient();
        var user=await currentUser(client);
        if(!user){
          LAST_SERVER_CHECK=Date.now();
          return writeSnapshot({authenticated:false,active:false,status:'not_connected',ends_at:null,server_verified_at:Date.now()});
        }
        var status=await callStatus(client);
        LAST_SERVER_CHECK=Date.now();
        return writeSnapshot(status);
      }catch(err){
        var cached=cachedAccessStatus();
        if(isNetworkError(err)&&cached.allowed)return cached.snapshot;
        throw err;
      }
    })();
    try{return await STATUS_PROMISE;}finally{STATUS_PROMISE=null;}
  }

  function statusData(){
    var data=readSnapshot();
    if(data.active&&data.status==='active'){
      var label='Actif';
      var days=remainingDays(data);
      if(data.ends_at)label='Actif jusqu’au '+formatDate(data.ends_at);
      if(days!==null&&days>=1&&days<=RENEWAL_NOTICE_DAYS)label=days+' jour'+(days>1?'s':'')+' restant'+(days>1?'s':'');
      return {className:days!==null&&days<=RENEWAL_NOTICE_DAYS?'warning':'active',label:label,days:days,snapshot:data};
    }
    if(data.status==='expired'||data.status==='revoked')return {className:'expired',label:data.status==='revoked'?'Révoqué':'Expiré',days:0,snapshot:data};
    return {className:'',label:'Non activé',days:null,snapshot:data};
  }

  function renewalWarningMarkup(){
    var st=statusData();
    if(st.snapshot&&st.snapshot.active&&st.days!==null&&st.days>=1&&st.days<=RENEWAL_NOTICE_DAYS){
      return '<div class="nx-sub-renewal-warning-v250" role="status"><strong>Abonnement bientôt expiré</strong><span>'+esc(renewalNoticeMessage(st.snapshot))+'</span><button type="button" data-nx-subscribe>Renouveler maintenant</button></div>';
    }
    if(st.snapshot&&(st.snapshot.status==='expired'||st.snapshot.status==='revoked')){
      return '<div class="nx-sub-expired-warning-v250" role="alert"><strong>Accès bloqué</strong><span>Votre abonnement est terminé. Les contenus payants restent fermés jusqu’au renouvellement.</span><button type="button" data-nx-subscribe>Renouveler</button></div>';
    }
    return '';
  }

  function autonomousCatalogFallback(){
    var durations=[3,6,9,12],monthly=60000,plans=[];
    ['eleves','pro'].forEach(function(space){
      durations.forEach(function(months){
        plans.push({
          id:null,
          plan_code:'NX-'+(space==='pro'?'PRO':'ELEVE')+'-'+months+'M-AUTO',
          product_code:space,
          duration_months:months,
          label:months+' mois',
          total_gnf:monthly*months,
          monthly_gnf:monthly,
          badge:'',
          is_featured:months===6,
          is_best_value:false,
          demo_only:true
        });
      });
    });
    return {success:true,plans:plans,merchant_phone:'',autonomous_fallback:true};
  }

  function isAutonomousBuild(){
    /* V519.2 : le secours local n'est autorisé que pour un fichier réellement
       ouvert en file://. Une copie hébergée ne doit jamais inventer des plans. */
    try{return location.protocol==='file:';}
    catch(_e){return false;}
  }

  function normalizePlanSpace(plan){
    var raw=String((plan&& (plan.product_code||plan.space||plan.audience||plan.category))||'').toLowerCase();
    try{raw=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(_e){}
    raw=raw.replace(/[^a-z0-9]+/g,'-');
    if(raw==='pro'||raw==='professional'||raw==='professionnel'||raw==='professionnels'||raw==='module'||raw==='modules'||raw.indexOf('profession')>-1||raw.indexOf('module')>-1||raw.indexOf('renforcement')>-1)return 'pro';
    if(raw==='eleve'||raw==='eleves'||raw==='student'||raw==='students'||raw==='academy'||raw==='academie'||raw==='school'||raw==='scolaire'||raw.indexOf('eleve')>-1||raw.indexOf('student')>-1||raw.indexOf('academ')>-1||raw.indexOf('scolair')>-1)return 'eleves';
    return 'eleves';
  }

  function installCatalogData(data){
    PLANS={};
    data=data&&typeof data==='object'?data:{};
    var sourcePlans=Array.isArray(data.plans)?data.plans.slice():[];
    var autonomous=isAutonomousBuild();

    /* V518.4 autonome — Supabase peut nommer l'espace pro "modules",
       "professional" ou "professionnel". On normalise ces valeurs vers
       "pro". Si une grille manque ou revient sans montant, on complète
       uniquement cette grille avec le tarif local de démonstration. */
    if(autonomous){
      var available={eleves:false,pro:false};
      sourcePlans.forEach(function(plan){
        var months=Number(plan&&plan.duration_months||0);
        var total=Number(plan&&plan.total_gnf||0);
        var monthly=Number(plan&&plan.monthly_gnf||0)||(months&&total?Math.round(total/months):0);
        if(months>0&&(total>0||monthly>0))available[normalizePlanSpace(plan)]=true;
      });
      var localPlans=autonomousCatalogFallback().plans;
      ['eleves','pro'].forEach(function(space){
        if(!available[space]){
          sourcePlans=sourcePlans.concat(localPlans.filter(function(plan){return normalizePlanSpace(plan)===space;}));
        }
      });
    }

    sourcePlans.forEach(function(plan){
      var months=Number(plan&&plan.duration_months||0);
      var code=String(plan&&plan.plan_code||('NX-'+months+'M'));
      if(!(months>0)||!code)return;
      var total=Number(plan&&plan.total_gnf||0);
      var monthly=Number(plan&&plan.monthly_gnf||0)||(months&&total?Math.round(total/months):0);
      if(autonomous&&!(total>0||monthly>0))return;
      var space=normalizePlanSpace(plan);
      PLANS[code]={
        id:plan.id||null,
        plan_code:code,
        space:space,
        months:months,
        label:String(plan.label||(months+' mois')),
        total:total,
        monthly:monthly,
        badge:plan.badge?String(plan.badge):'',
        featured:plan.is_featured===true,
        best:plan.is_best_value===true,
        demo_only:plan.demo_only===true||!plan.id
      };
    });
    if(!Object.keys(PLANS).length)throw new Error('Aucun tarif n’est disponible pour le moment. Réessaie dans quelques instants.');
    CATALOG=Object.assign({},data,{plans:sortedPlans(true)});
    renderCatalogUI();
    return CATALOG;
  }

  async function loadCatalog(force){
    if(CATALOG&&!force)return CATALOG;
    if(CATALOG_PROMISE)return CATALOG_PROMISE;
    CATALOG_PROMISE=(async function(){
      try{
        var client=await waitClient();
        var result=await withTimeout(client.rpc('nexora_subscription_catalog'),10000,'Le chargement des tarifs prend trop de temps.');
        if(result&&result.error)throw result.error;
        var data=parseData(result&&result.data);
        if(!data||data.success!==true||!Array.isArray(data.plans)||!data.plans.length)throw new Error('Aucun tarif n’est disponible pour le moment. Réessaie dans quelques instants.');
        /* Le serveur reste toujours prioritaire. Le fichier autonome n'utilise
           sa grille locale que si Supabase n'est pas joignable depuis file://. */
        return installCatalogData(data);
      }catch(err){
        if(isAutonomousBuild()){
          try{if(window.nxLog)window.nxLog(err,'catalogue-autonome');}catch(_logError){}
          return installCatalogData(autonomousCatalogFallback());
        }
        throw err;
      }
    })();
    try{return await CATALOG_PROMISE;}finally{CATALOG_PROMISE=null;}
  }


  /* V517 — l'espace courant. Il n'est jamais demande a l'utilisateur quand
     le contexte le donne : un mur dans l'espace des eleves ouvre la grille
     eleves, un mur dans l'espace professionnel ouvre la grille pro. */
  var ESPACE_COURANT='eleves';
  function espaceCourant(){return ESPACE_COURANT==='pro'?'pro':'eleves';}
  function poserEspace(espace){
    var neuf=String(espace||'')==='pro'?'pro':'eleves';
    if(neuf===ESPACE_COURANT)return;
    ESPACE_COURANT=neuf;
    SELECTED_PLAN=null;
    try{renderCatalogUI();}catch(_e){window.nxLog&&window.nxLog(_e)}
  }
  function espaceDeviné(){
    try{
      var vue=document.querySelector('#screen-academy [data-nx-academy-view="pro"]');
      if(vue&&!vue.hidden)return 'pro';
      var actif=document.querySelector('[data-nx-nav-espace-v509].active');
      if(actif)return actif.getAttribute('data-nx-nav-espace-v509')==='pro'?'pro':'eleves';
    }catch(_e){window.nxLog&&window.nxLog(_e)}
    return 'eleves';
  }
  function espacePourContexte(context){
    var value=String(context||'').toLowerCase();
    if(value==='modules'||value==='pro'||value==='professional')return 'pro';
    if(value==='academy'||value==='orientation'||value==='subjects'||value==='novels'||value==='eleves'||value==='student')return 'eleves';
    return espaceDeviné();
  }
  function offreDeLaDemande(demande){
    if(!demande)return null;
    var codes=Object.keys(PLANS);
    var i;
    for(i=0;i<codes.length;i++){
      if(demande.plan_id&&PLANS[codes[i]].id===demande.plan_id)return PLANS[codes[i]];
    }
    for(i=0;i<codes.length;i++){
      if(PLANS[codes[i]].space===espaceCourant()
         &&Number(PLANS[codes[i]].months)===Number(demande.duration_months))return PLANS[codes[i]];
    }
    return null;
  }

  function sortedPlans(tous){
    return Object.keys(PLANS).map(function(key){return PLANS[key];}).filter(function(p){return tous===true||p.space===espaceCourant();}).sort(function(a,b){return a.space===b.space?a.months-b.months:(a.space<b.space?-1:1);});
  }

  function planButtonMarkup(plan,modal){
    var locked=CURRENT_REQUEST&&['payment_declared','under_review'].indexOf(String(CURRENT_REQUEST.status))>-1&&Number(CURRENT_REQUEST.duration_months)!==plan.months;
    var selected=SELECTED_PLAN&&SELECTED_PLAN.plan_code===plan.plan_code;
    var cls='nx-pay-plan'+(selected?' selected':'')+(plan.featured?' featured':'')+(plan.best?' best':'');
    var badge='';
    return '<button type="button" class="'+cls+'" data-nx-payment-plan="'+esc(plan.plan_code)+'" aria-label="Activer mon compte avec '+esc(plan.label)+' à '+formatGNF(plan.total)+' — '+(plan.space==="pro"?"espace professionnel":"espace des élèves")+'" aria-pressed="'+(selected?'true':'false')+'"'+(locked?' disabled':'')+'>'+ (badge?'<mark>'+esc(badge)+'</mark>':'') +'<small>'+esc(plan.label)+'</small><b>'+formatGNF(plan.total)+'</b><strong>'+formatGNF(plan.monthly)+' / mois</strong><span>'+(plan.space==="pro"?"Espace professionnel":"Espace des élèves")+'</span><i>'+(selected?'Durée sélectionnée':'Activer mon compte')+'</i></button>';
  }

  function plansMarkup(modal){
    var list=sortedPlans();
    if(!list.length)return '<div class="nx-pay-catalog-loading">Chargement des tarifs Nexora…</div>';
    return list.map(function(plan){return planButtonMarkup(plan,modal);}).join('');
  }

  function merchantPhone(){return CATALOG&&CATALOG.merchant_phone?String(CATALOG.merchant_phone):'';}

  function requestState(){
    if(PAYMENT_UI_PHASE==='submitting')return 'processing';
    if(PAYMENT_UI_PHASE==='error')return 'error';
    var status=String(CURRENT_REQUEST&&CURRENT_REQUEST.status||'');
    if(status==='approved'||status==='activated')return 'approved';
    if(status==='rejected')return 'rejected';
    if(status==='payment_declared'||status==='under_review'||PAYMENT_UI_PHASE==='pending')return 'pending';
    return '';
  }

  function paymentMessage(){
    var state=requestState();
    if(state==='processing')return 'Validation en cours…';
    if(state==='error')return PAYMENT_UI_ERROR||'Impossible de valider. Réessayez.';
    if(state==='pending')return 'Paiement envoyé. Vérification en cours.';
    if(state==='approved')return 'Accès activé'+(CURRENT_REQUEST.subscription_ends_at?' jusqu’au '+formatDate(CURRENT_REQUEST.subscription_ends_at):'')+'.';
    if(state==='rejected')return 'Paiement non validé. Vérifiez le numéro et réessayez.';
    if(SELECTED_PLAN)return 'Payez '+formatGNF(SELECTED_PLAN.total)+', entrez le numéro utilisé, puis validez.';
    return 'Choisissez une durée.';
  }

  function updateMainPaymentCard(root){
    root=root||document;
    var summary=root.querySelector('[data-nx-selected-plan-summary]');
    var phoneInput=root.querySelector('[data-nx-payer-phone]');
    var validationBanner=root.querySelector('[data-nx-validation-banner]');
    var action=root.querySelector('[data-nx-declare-payment]');
    var feedback=root.querySelector('[data-nx-payment-feedback]');
    var state=requestState();

    if(summary){
      if(SELECTED_PLAN){
        summary.classList.add('ready');
        summary.innerHTML='<span>Durée sélectionnée · '+(SELECTED_PLAN.space==='pro'?'espace professionnel':'espace des élèves')+'</span><strong>'+esc(SELECTED_PLAN.label)+' · '+formatGNF(SELECTED_PLAN.total)+'</strong>';
      }else{
        summary.classList.remove('ready');
        summary.innerHTML='<span>Aucune formule sélectionnée</span><strong>Choisissez d’abord le nombre de mois.</strong>';
      }
    }

    if(phoneInput){
      phoneInput.disabled=!SELECTED_PLAN||state==='pending'||state==='approved';
      if(CURRENT_REQUEST&&CURRENT_REQUEST.payer_phone)phoneInput.value=CURRENT_REQUEST.payer_phone;
    }


    if(validationBanner){
      validationBanner.hidden=!state;
      validationBanner.className='nx-pay-validation-banner-v170'+(state?' '+(state==='error'?'rejected':state):'');
      if(state==='processing')validationBanner.innerHTML='<b>Validation en cours…</b>';
      else if(state==='pending')validationBanner.innerHTML='<b>Paiement envoyé</b><span>Vérification en cours.</span>';
      else if(state==='approved')validationBanner.innerHTML='<b>Accès activé</b>';
      else if(state==='rejected')validationBanner.innerHTML='<b>Paiement non validé</b><span>Vérifiez le numéro utilisé.</span>';
      else if(state==='error')validationBanner.innerHTML='<b>Impossible de valider</b><span>'+esc(PAYMENT_UI_ERROR||'Réessayez.')+'</span>';
      else validationBanner.innerHTML='';
    }

    if(action){
      if(!SELECTED_PLAN){action.disabled=true;action.textContent='Choisir une durée';}
      else if(state==='processing'){action.disabled=true;action.textContent='Validation…';}
      else if(state==='pending'){action.disabled=true;action.textContent='Paiement envoyé';}
      else if(state==='approved'){action.disabled=true;action.textContent='Accès activé';}
      else{action.disabled=false;action.textContent='Valider mon paiement';}
    }

    if(feedback){
      feedback.className='nx-pay-status-v168'+(state?' '+(state==='error'?'rejected':state):'');
      feedback.textContent=paymentMessage();
    }

  }

  function renderCatalogUI(){
    var plans=sortedPlans();
    document.querySelectorAll('[data-nx-payment-plan-grid]').forEach(function(grid){grid.innerHTML=plansMarkup(false);});
    document.querySelectorAll('[data-nx-merchant-phone]').forEach(function(el){el.textContent=formatPhone(merchantPhone());});
    document.querySelectorAll('[data-nx-payment-instructions]').forEach(function(el){el.textContent='Payez, puis entrez le numéro utilisé.';});
    document.querySelectorAll('[data-nx-copy-merchant]').forEach(function(btn){btn.disabled=!merchantPhone();});
    document.querySelectorAll('[data-nx-catalog-count]').forEach(function(el){el.textContent=String(plans.length||'—');});
    var lowest=plans.reduce(function(min,p){return !min||p.monthly<min?p.monthly:min;},0);
    var highest=plans.reduce(function(max,p){return p.monthly>max?p.monthly:max;},0);
    document.querySelectorAll('[data-nx-catalog-lowest]').forEach(function(el){el.textContent=lowest?formatGNF(lowest):'—';});
    document.querySelectorAll('[data-nx-catalog-range]').forEach(function(el){el.textContent=lowest&&highest?(lowest===highest?formatGNF(lowest)+' / mois':'De '+formatGNF(highest)+' à '+formatGNF(lowest)+' / mois'):'Tarifs Nexora';});
    updateMainPaymentCard(document);
  }

  function renderCatalogError(message){
    document.querySelectorAll('[data-nx-payment-plan-grid]').forEach(function(grid){grid.innerHTML='<div class="nx-pay-catalog-loading">'+esc(message)+'</div>';});
    document.querySelectorAll('[data-nx-payment-feedback]').forEach(function(el){el.className='nx-pay-status-v168 rejected';el.textContent=message;});
  }

  async function loadMyPaymentStatus(force){
    var client=await waitClient();
    var user=await currentUser(client);
    if(!user){CURRENT_REQUEST=null;PAYMENT_UI_PHASE='';updateMainPaymentCard(document);return {authenticated:false,status:'not_connected'};}
    var result=null;
    var lastError=null;
    var paymentStatusRpcs=['nexora_my_payment_request_status_v264','nexora_my_payment_request_status_v2','nexora_my_payment_request_status'];
    for(var i=0;i<paymentStatusRpcs.length;i++){
      var rpcName=paymentStatusRpcs[i];
      try{
        result=await withTimeout(client.rpc(rpcName),10000,'La vérification du paiement prend trop de temps.');
        if(result&&result.error){lastError=result.error;result=null;continue;}
        break;
      }catch(err){lastError=err;result=null;}
    }
    if(!result){if(lastError)throw lastError;throw new Error('Statut de paiement indisponible.');}
    var data=parseData(result&&result.data);
    if(data&&data.found){
      CURRENT_REQUEST=data;
      var st=String(data.status||'');
      PAYMENT_UI_PHASE=(st==='payment_declared'||st==='under_review')?'pending':'';
      PAYMENT_UI_ERROR='';
    }else if(!(CURRENT_REQUEST&&['payment_declared','under_review'].indexOf(String(CURRENT_REQUEST.status))>-1)){
      CURRENT_REQUEST=null;
      PAYMENT_UI_PHASE='';
    }
    if(CURRENT_REQUEST)SELECTED_PLAN=offreDeLaDemande(CURRENT_REQUEST)||SELECTED_PLAN;
    renderCatalogUI();
    if(CURRENT_REQUEST&&requestState()==='approved'){
      await fetchStatus(true).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')});
      refreshSubscriptionUI();
      if(PENDING_ACCESS){var run=PENDING_ACCESS;PENDING_ACCESS=null;setTimeout(function(){closeModal();run();},500);}
    }
    managePendingPolling();
    return data;
  }

  async function fetchLatestOpenPayment(client,userId){
    var query=client.from('nexora_payment_requests')
      .select('id,user_id,plan_id,duration_months,amount_gnf,payment_method,payer_phone,payment_reference,activation_code,code_status,status,declared_at,reviewed_at,admin_note,subscription_starts_at,subscription_ends_at,created_at,updated_at')
      .eq('user_id',userId)
      .in('status',['payment_declared','under_review'])
      .order('created_at',{ascending:false})
      .limit(1);
    var result=await withTimeout(query,12000,'La lecture de la demande prend trop de temps.');
    if(result&&result.error)throw result.error;
    var row=result&&Array.isArray(result.data)&&result.data.length?result.data[0]:null;
    if(!row)return null;
    return Object.assign({success:true,existing:true,found:true,validation_pending:true,message:'Veuillez patienter — vérification en cours.'},row);
  }

  async function resolveRealSelectedPlan(client){
    if(SELECTED_PLAN&&SELECTED_PLAN.id&&!SELECTED_PLAN.demo_only)return SELECTED_PLAN;
    if(!SELECTED_PLAN)throw new Error('Choisis d’abord le nombre de mois.');

    var wantedSpace=SELECTED_PLAN.space||espaceCourant();
    var wantedMonths=Number(SELECTED_PLAN.months||0);
    var result=await withTimeout(
      client.rpc('nexora_subscription_catalog'),
      10000,
      'La vérification de la formule prend trop de temps.'
    );
    if(result&&result.error)throw result.error;
    var data=parseData(result&&result.data);
    var rows=data&&Array.isArray(data.plans)?data.plans:[];
    var serverPlan=null;
    for(var i=0;i<rows.length;i++){
      var row=rows[i];
      if(!row||!row.id)continue;
      if(Number(row.duration_months||0)!==wantedMonths)continue;
      if(normalizePlanSpace(row)!==wantedSpace)continue;
      serverPlan=row;break;
    }
    if(!serverPlan){
      throw new Error('La formule '+wantedMonths+' mois — '+(wantedSpace==='pro'?'Professionnel':'Élèves')+' n’est pas encore activée dans Supabase. Aucun paiement n’a été envoyé.');
    }

    var code=String(serverPlan.plan_code||('NX-'+wantedMonths+'M'));
    var total=Number(serverPlan.total_gnf||0);
    var monthly=Number(serverPlan.monthly_gnf||0)||(wantedMonths&&total?Math.round(total/wantedMonths):0);
    SELECTED_PLAN={
      id:serverPlan.id, plan_code:code, space:wantedSpace, months:wantedMonths,
      label:String(serverPlan.label||(wantedMonths+' mois')), total:total, monthly:monthly,
      badge:serverPlan.badge?String(serverPlan.badge):'', featured:serverPlan.is_featured===true,
      best:serverPlan.is_best_value===true, demo_only:false
    };
    PLANS[code]=SELECTED_PLAN;
    return SELECTED_PLAN;
  }

  async function createPaymentRequestOnServer(client,user,phone){
    await resolveRealSelectedPlan(client);
    var rpcErrors=[];
    var rpcNames=['nexora_create_payment_request_v7','nexora_create_payment_request_v6','nexora_create_payment_request'];
    for(var i=0;i<rpcNames.length;i++){
      var rpcName=rpcNames[i];
      try{
        var rpcResult=await withTimeout(
          client.rpc(rpcName,rpcName==='nexora_create_payment_request_v7'
            ?{p_plan_id:SELECTED_PLAN.id,p_payer_phone:phone}
            :{p_duration_months:SELECTED_PLAN.months,p_payer_phone:phone}),
          15000,
          'La déclaration du paiement prend trop de temps.'
        );
        if(rpcResult&&!rpcResult.error){
          var rpcData=parseData(rpcResult.data);
          if(rpcData&&rpcData.success===true)return rpcData;
          if(rpcData&&rpcData.message)throw new Error(rpcData.message);
        }
        if(rpcResult&&rpcResult.error){
          rpcErrors.push(rpcName+' : '+String(rpcResult.error.message||rpcResult.error));
          if(!isMissingRpc(rpcResult.error))throw rpcResult.error;
        }
      }catch(rpcErr){
        rpcErrors.push(rpcName+' : '+String(rpcErr&&rpcErr.message||rpcErr));
        if(!isMissingRpc(rpcErr))throw rpcErr;
      }
    }

    // Secours robuste : insertion directe protégée par RLS et préparée par
    // le trigger Supabase V6. Le navigateur ne fixe ni le montant, ni le
    // code, ni le statut : ces valeurs sont imposées par Supabase.
    var insertPayload={
      user_id:user.id,
      plan_id:SELECTED_PLAN.id,
      duration_months:SELECTED_PLAN.months,
      payer_phone:phone,
      payment_reference:phone
    };
    var inserted=await withTimeout(
      client.from('nexora_payment_requests')
        .insert(insertPayload)
        .select('id,user_id,plan_id,duration_months,amount_gnf,payment_method,payer_phone,payment_reference,activation_code,code_status,status,declared_at,reviewed_at,admin_note,subscription_starts_at,subscription_ends_at,created_at,updated_at')
        .single(),
      15000,
      'L’enregistrement direct du paiement prend trop de temps.'
    );
    if(inserted&&inserted.error){
      var code=String(inserted.error.code||'');
      if(code==='23505'){
        var existing=await fetchLatestOpenPayment(client,user.id);
        if(existing)return existing;
      }
      var full=new Error(String(inserted.error.message||'Déclaration non enregistrée.')+(rpcErrors.length?' | '+rpcErrors.join(' | '):''));
      full.code=inserted.error.code;
      full.details=inserted.error.details;
      full.hint=inserted.error.hint;
      throw full;
    }
    var row=inserted&&inserted.data;
    if(!row)throw new Error('Le paiement n’a pas pu être enregistré. Réessaie dans quelques instants.');
    return Object.assign({success:true,existing:false,found:true,validation_pending:true,message:'Veuillez patienter — vérification en cours.'},row);
  }

  async function declarePayment(scope){
    scope=scope||document;
    if(!SELECTED_PLAN)throw new Error('Choisis d’abord le nombre de mois.');
    var input=scope.querySelector('[data-nx-payer-phone]')||document.querySelector('#screen-access [data-nx-payer-phone]');
    var phone=String(input&&input.value||'').replace(/\D/g,'');
    if(phone.length<9||phone.length>15)throw new Error('Entre le numéro Orange Money ayant effectué le paiement.');

    PAYMENT_UI_PHASE='submitting';
    PAYMENT_UI_ERROR='';
    updateMainPaymentCard(scope);
    setTimeout(function(){
      var banner=scope.querySelector&&scope.querySelector('[data-nx-validation-banner]');
      if(banner&&!banner.hidden)try{banner.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(_e){window.nxLog&&window.nxLog(_e)}
    },30);

    try{
      var client=await waitClient();
      var user=await currentUser(client);
      if(!user)throw new Error('Connecte-toi à ton compte Nexora avant de déclarer le paiement.');
      var data=await createPaymentRequestOnServer(client,user,phone);
      if(!data||data.success!==true)throw new Error(data&&data.message?data.message:'Le paiement n’a pas pu être confirmé. Réessaie dans quelques instants.');

      CURRENT_REQUEST=Object.assign({status:'payment_declared',code_status:'pending',payer_phone:phone},data,{found:true});
      PAYMENT_UI_PHASE='pending';
      PAYMENT_UI_ERROR='';
      renderCatalogUI();
      renderModalPaymentIfOpen();

      // La confirmation visuelle reste affichée même si la relecture du statut tarde.
      loadMyPaymentStatus(true).then(function(){renderModalPaymentIfOpen();}).catch(function(){
        PAYMENT_UI_PHASE='pending';
        renderCatalogUI();
        renderModalPaymentIfOpen();
      });
      setupRealtime();
      managePendingPolling();
      setTimeout(function(){
        var banner=document.querySelector('#nxSubscriptionModal [data-nx-validation-banner]');
        if(banner&&!banner.hidden)try{banner.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(_e){window.nxLog&&window.nxLog(_e)}
      },80);
      try{if(typeof window.toast==='function')window.toast('Paiement envoyé. Vérification en cours.');}catch(_e){window.nxLog&&window.nxLog(_e)}
      return data;
    }catch(err){
      PAYMENT_UI_PHASE='error';
      PAYMENT_UI_ERROR=friendlyError(err);
      updateMainPaymentCard(scope);
      throw err;
    }
  }

  function ensureModal(){
    var modal=document.getElementById('nxSubscriptionModal');
    if(modal)return modal;
    modal=document.createElement('section');
    modal.id='nxSubscriptionModal';
    modal.className='nx-subscription-modal-v93';
    modal.hidden=true;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','nxSubscriptionModalTitle');
    modal.innerHTML='<div class="nx-subscription-dialog-v93 nx-subscription-dialog-v161"><div class="nx-subscription-dialog-head-v93"><div><span>Paiement Nexora</span><h3 id="nxSubscriptionModalTitle">Choisir une formule</h3></div><button type="button" class="nx-subscription-close-v93" data-nx-sub-close aria-label="Fermer">×</button></div><div data-nx-sub-modal-content></div></div>';
    document.body.appendChild(modal);
    return modal;
  }

  function physicalCardMarkup(){
    return '<section class="nx-card-access-v465" aria-label="Activation carte Nexora 6 mois"><header><span aria-hidden="true">🎫</span><div><h4>Activer ma carte d’accès Nexora</h4><p>Votre carte physique donne 6 mois d’accès complet. Saisissez simplement le code imprimé pour prolonger ou activer votre accès.</p></div></header><div class="nx-card-price-v465"><b>180 000 GNF</b><span>Accès complet · 6 mois · une seule activation</span></div><div class="nx-card-code-row-v465"><input data-nx-access-code-v208 type="text" inputmode="text" autocomplete="one-time-code" maxlength="40" placeholder="NX-CARTE6-XXXXX-XXXXX" aria-label="Code de la carte Nexora"><button type="button" data-nx-activate-code-v208 data-nx-card-months="6">Activer la carte</button></div><div class="nx-card-feedback-v465" data-nx-code-feedback-v208 aria-live="polite"></div></section>';
  }

  function modalCardMarkup(){
    return '<div class="nx-card-intro-v467"><b>Carte d’accès Nexora</b><span>Une carte physique, un code, 6 mois d’accès complet. Aucun abonnement mensuel n’est demandé ici.</span></div>'+physicalCardMarkup();
  }

  function modalPlansMarkup(){
    var pro=espaceCourant()==='pro';
    return '<div class="nx-all-access-mini-v217"><b>'+(pro?'Accès professionnel Nexora':'Accès élève Nexora')+'</b><span>'+(pro?'22 modules de renforcement de capacités et contenus professionnels.':'Cours scolaires, Brevet, BAC, Orientation et contenus pédagogiques pour les élèves.')+'</span></div>'+(CATALOG&&CATALOG.autonomous_fallback?'<div class="nx-pay-status-v168">Mode autonome : tarifs affichés localement. Supabase reste prioritaire sur la version déployée.</div>':'')+'<div class="nx-pay-step-intro-v169"><div class="nx-pay-step-kicker-v169"><span>1</span> Étape 1 sur 2</div><h4>Choisissez votre durée</h4><p>'+(pro?'Les 22 modules de renforcement de capacités.':'Tous les cours de l’école, de la maternelle à la Terminale.')+' Choisissez la durée qui vous convient.</p></div><div class="nx-pay-modal-grid" data-nx-payment-plan-grid>'+plansMarkup(true)+'</div><div class="nx-modal-card-option-v520"><span>Vous avez déjà une carte Nexora ?</span><button type="button" data-nx-open-card-code>Activer mon code</button></div>';
  }

  function modalPaymentMarkup(){
    var plan=SELECTED_PLAN;
    if(!plan)return modalPlansMarkup();
    return '<div class="nx-pay-step-intro-v169"><div class="nx-pay-step-kicker-v169"><span>2</span> Étape finale</div><h4>Activer mon accès</h4><p>Payez, entrez le numéro utilisé, puis validez.</p></div>'+ 
      '<div class="nx-pay-simple-flow-v220" aria-label="Trois étapes simples"><span><b>1</b>Payer</span><span><b>2</b>Entrer le numéro</span><span><b>3</b>Valider</span></div>'+ 
      '<div class="nx-pay-validation-banner-v170" data-nx-validation-banner hidden></div>'+ 
      '<div class="nx-pay-modal-selected"><div><small>Durée choisie · '+(plan.space==='pro'?'espace professionnel':'espace des élèves')+'</small><strong>'+esc(plan.label)+'</strong></div><b>'+formatGNF(plan.total)+'</b></div>'+
      (plan.demo_only?'<div class="nx-pay-status-v168"><b>Tarif de prévisualisation.</b> Au moment de valider, Nexora vérifie obligatoirement la formule réelle dans Supabase. Aucun paiement ne sera enregistré sans plan_id serveur.</div>':'')+ 
      (merchantPhone()?'<div class="nx-orange-money-box-v168"><span class="nx-om-mark-v169" aria-hidden="true">OM</span><div><small>Payez sur ce numéro</small><strong data-nx-merchant-phone>'+esc(formatPhone(merchantPhone()))+'</strong></div><button type="button" class="nx-pay-copy-btn" data-nx-copy-merchant>Copier</button></div>':'<div class="nx-pay-status-v168">Le montant est visible. Le numéro Orange Money officiel et la validation du paiement sont chargés par Supabase dans la version connectée.</div>')+ 
      '<div class="nx-pay-fields"><div class="nx-pay-field"><label>Numéro utilisé pour le paiement</label><input data-nx-payer-phone type="tel" inputmode="numeric" autocomplete="tel" maxlength="15" placeholder="Exemple : 620 00 00 00"></div></div>'+ 
      '<div class="nx-pay-action-row"><button type="button" class="nx-pay-primary" data-nx-declare-payment>Valider mon paiement</button><div class="nx-pay-secondary-row-v169 single"><button type="button" class="nx-pay-secondary" data-nx-back-plans>Changer la durée</button></div></div>'+ 
      '<div class="nx-pay-status-v168" data-nx-payment-feedback aria-live="polite"></div>';
  }

  function openModal(mode){
    var modal=ensureModal();
    var title=modal.querySelector('#nxSubscriptionModalTitle');
    var content=modal.querySelector('[data-nx-sub-modal-content]');
    if(mode==='card'){title.textContent='Carte d’accès';content.innerHTML=modalCardMarkup();}
    else if(mode==='payment'&&SELECTED_PLAN){title.textContent='Activer mon accès';content.innerHTML=modalPaymentMarkup();updateMainPaymentCard(modal);}
    else{title.textContent='Choisir une formule';content.innerHTML=modalPlansMarkup();}
    modal.hidden=false;
    document.body.style.overflow='hidden';
    setTimeout(function(){var focus=modal.querySelector('button:not([disabled]),input:not([disabled])');if(focus)try{focus.focus();}catch(_e){window.nxLog&&window.nxLog(_e)}},30);
  }

  function renderModalPaymentIfOpen(){
    var modal=document.getElementById('nxSubscriptionModal');
    if(!modal||modal.hidden||!SELECTED_PLAN)return;
    var title=modal.querySelector('#nxSubscriptionModalTitle');
    var content=modal.querySelector('[data-nx-sub-modal-content]');
    title.textContent='Activer mon accès';
    content.innerHTML=modalPaymentMarkup();
    updateMainPaymentCard(modal);
  }

  function closeModal(){
    var modal=document.getElementById('nxSubscriptionModal');
    if(modal)modal.hidden=true;
    document.body.style.overflow='';
  }

  function selectPlan(code,fromModal){
    var plan=PLANS[String(code)];
    if(!plan)return;
    ESPACE_COURANT=plan.space||ESPACE_COURANT;
    var previousState=requestState();
    if(CURRENT_REQUEST&&['approved','activated','rejected'].indexOf(previousState)>=0){
      CURRENT_REQUEST=null;
    }
    SELECTED_PLAN=plan;
    if(requestState()!=='pending'&&requestState()!=='processing'){PAYMENT_UI_PHASE='';PAYMENT_UI_ERROR='';}
    document.querySelectorAll('[data-nx-payment-plan]').forEach(function(btn){
      var on=String(btn.getAttribute('data-nx-payment-plan'))===plan.plan_code;
      btn.classList.toggle('selected',on);
      btn.setAttribute('aria-pressed',on?'true':'false');
      var i=btn.querySelector('i');if(i)i.textContent=on?'Durée sélectionnée':'Activer mon compte';
    });
    updateMainPaymentCard(document);
    if(fromModal)openModal('payment');
    else{
      try{var card=document.querySelector('#screen-access .nx-payment-card-v168');if(card)card.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){window.nxLog&&window.nxLog(_e)}
    }
  }

  function copyMerchant(){
    var phone=merchantPhone();
    if(!phone)return;
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(phone);if(typeof window.toast==='function')window.toast('Numéro Orange Money copié.');return;}
    }catch(_e){window.nxLog&&window.nxLog(_e)}
    try{if(typeof window.toast==='function')window.toast('Numéro : '+formatPhone(phone));}catch(_e2){window.nxLog&&window.nxLog(_e2)}
  }

  function copyPaymentCode(){
    var code=CURRENT_REQUEST&&CURRENT_REQUEST.activation_code?String(CURRENT_REQUEST.activation_code):'';
    if(!code)return;
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code);if(typeof window.toast==='function')window.toast('Code complet copié.');return;}
    }catch(_e){window.nxLog&&window.nxLog(_e)}
    try{if(typeof window.toast==='function')window.toast('Code : '+code);}catch(_e2){window.nxLog&&window.nxLog(_e2)}
  }

  function refreshSubscriptionUI(){
    var st=statusData();
    document.querySelectorAll('.nx-subscription-status-v93').forEach(function(el){el.classList.remove('active','expired');if(st.className)el.classList.add(st.className);el.textContent=st.label;});
    try{if(window.NexoraApp&&typeof window.NexoraApp.render==='function')window.NexoraApp.render();}catch(_e){window.nxLog&&window.nxLog(_e)}
  }

  function teardownPaymentRealtime(){
    if(!REALTIME_CHANNEL)return;
    try{
      var client=window.NexoraApp&&window.NexoraApp.getSupabaseClient?window.NexoraApp.getSupabaseClient():null;
      if(client&&typeof client.removeChannel==='function')client.removeChannel(REALTIME_CHANNEL);
      else if(typeof REALTIME_CHANNEL.unsubscribe==='function')REALTIME_CHANNEL.unsubscribe();
    }catch(_e){window.nxLog&&window.nxLog(_e)}
    REALTIME_CHANNEL=null;
  }

  function setupRealtime(){
    if(requestState()!=='pending'||document.visibilityState==='hidden'){teardownPaymentRealtime();return;}
    (async function(){
      try{
        var client=await waitClient();
        var user=await currentUser(client);
        if(!user||!client.channel||REALTIME_CHANNEL||requestState()!=='pending')return;
        REALTIME_CHANNEL=client.channel('nexora-payment-user-'+user.id)
          .on('postgres_changes',{event:'*',schema:'public',table:'nexora_payment_requests',filter:'user_id=eq.'+user.id},function(){loadMyPaymentStatus(true).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')});})
          .subscribe();
      }catch(_e){window.nxLog&&window.nxLog(_e)}
    })();
  }

  function managePendingPolling(){
    if(POLL_TIMER){clearTimeout(POLL_TIMER);POLL_TIMER=null;}
    if(requestState()==='pending'&&document.visibilityState!=='hidden'){
      setupRealtime();
      POLL_TIMER=setTimeout(function(){loadMyPaymentStatus(true).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')});},30000);
    }else{
      teardownPaymentRealtime();
    }
  }

  window.nxSubscriptionEntry=function(context){
    poserEspace(espacePourContexte(context));
    var st=statusData();
    var area=String(context||'all').toLowerCase();
    var pro=espaceCourant()==='pro';
    var title=pro?'Accès professionnel Nexora':'Accès élève Nexora';
    var detail=pro?'Cet abonnement ouvre les 22 modules et les contenus de renforcement de capacités pendant toute la durée choisie.':'Cet abonnement ouvre les cours scolaires, le Brevet, le BAC, l’Orientation et les contenus pédagogiques destinés aux élèves pendant toute la durée choisie.';
    var lowest=sortedPlans().reduce(function(min,p){return !min||p.monthly<min?p.monthly:min;},0);
    return '<section class="nx-subscription-v93 nx-subscription-v161" aria-label="'+esc(title)+'"><div class="nx-subscription-main-v93"><div class="nx-subscription-icon-v93" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M8 3v4M16 3v4M3 10h18"></path><path d="M8 15h8"></path></svg></div><div class="nx-subscription-copy-v93"><div class="nx-subscription-title-row-v93"><h3>'+esc(title)+'</h3><span class="nx-subscription-status-v93 '+st.className+'">'+esc(st.label)+'</span></div><div class="nx-subscription-price-v93"><b>'+(lowest?formatGNF(lowest)+' / mois':'Tarifs Nexora')+'</b><span>tarif fixe sans remise</span></div><div class="nx-subscription-periods-v93">'+(pro?'<span>22 modules</span><span>Renforcement de capacités</span><span>Parcours professionnel</span>':'<span>Cours scolaires</span><span>Brevet et BAC</span><span>Orientation</span>')+'</div><p>'+esc(detail)+' Choisis seulement la durée qui te convient, puis indique le numéro Orange Money ayant payé.</p></div></div><div class="nx-subscription-actions-v93"><button type="button" class="btn btn-primary" data-nx-subscribe>Choisir ma durée</button><button type="button" class="btn btn-soft" data-nx-open-access-screen>Voir tous les tarifs</button></div>'+renewalWarningMarkup()+'</section>';
  };

  window.nxSubscriptionMainMenu=function(){
    poserEspace(espaceDeviné());
    var st=statusData();
    var pro=espaceCourant()==='pro';
    var lowest=sortedPlans().reduce(function(min,p){return !min||p.monthly<min?p.monthly:min;},0);
    return '<section class="nx-main-access-v163" aria-label="Abonnements Nexora"><div class="nx-main-access-head-v163"><span class="nx-main-access-icon-v163" aria-hidden="true">OM</span><div class="nx-main-access-copy-v163"><small>'+(pro?'Espace professionnel':'Espace des élèves')+' · abonnement séparé</small><div class="nx-main-access-title-v163"><h3>'+(pro?'Accès aux 22 modules professionnels':'Accès aux contenus scolaires Nexora')+'</h3><span class="nx-subscription-status-v93 '+st.className+'">'+esc(st.label)+'</span></div><p>Choisissez la durée disponible pour cet espace, payez par Orange Money puis validez le numéro utilisé.</p></div><button type="button" class="nx-main-access-code-v163" data-nx-open-access-screen>Voir les tarifs</button></div><div class="nx-main-access-flow-v163"><span><i>1</i>Choisir la durée</span><span><i>2</i>Payer Orange Money</span><span><i>3</i>Entrer le numéro</span><span><i>4</i>Valider</span></div><div class="nx-pay-status-v168">'+(lowest?'Tarif : '+formatGNF(lowest)+' par mois.':'Chargement des tarifs Nexora…')+'</div>'+renewalWarningMarkup()+'</section>';
  };

  window.nxRefreshSubscriptionStatus=function(force){
    return Promise.all([fetchStatus(force!==false),loadMyPaymentStatus(force!==false).catch(function(){return null;})]).then(function(results){refreshSubscriptionUI();return results[0];});
  };

  window.nxSetSubscriptionSnapshot=function(snapshot){writeSnapshot(snapshot||{});refreshSubscriptionUI();};

  function secureProductCode(context){
    var value=String(context||'all').toLowerCase();
    return ['adams','modules','orientation','academy'].indexOf(value)>-1?value:'all';
  }

  async function fetchSecureProductStatus(client,context){
    var product=secureProductCode(context);
    var result=await withTimeout(client.rpc('nexora_my_subscription_status_v264',{p_product_code:product}),10000,'La vérification officielle de l’accès prend trop de temps.');
    if(result&&result.error)throw result.error;
    var raw=parseData(result&&result.data);raw.authoritative=true;raw.version='v264';
    return normalizeStatus(raw);
  }

  window.nxActivateSubscriptionCode=async function(code,months,context){
    var client=await waitClient();
    var user=await currentUser(client);
    if(!user)throw new Error('Connexion Nexora obligatoire.');
    var normalized=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(normalized.length<8)throw new Error('Entre le code complet reçu de Nexora.');
    var result=await withTimeout(client.rpc('nexora_redeem_access_code_v4',{p_code:normalized,p_product_code:secureProductCode(context),p_duration_months:Number(months||0)}),12000,'La validation du code prend trop de temps.');
    if(result&&result.error)throw result.error;
    var data=parseData(result&&result.data);
    if(!data||data.success!==true)throw new Error((data&&data.message)||'Code non validé.');
    var verified=await fetchSecureProductStatus(client,context);writeSnapshot(verified);refreshSubscriptionUI();return data;
  };

  window.nxRequireSubscriptionAccess=async function(context,onGranted){
    PENDING_CONTEXT=String(context||'all');
    poserEspace(espacePourContexte(PENDING_CONTEXT));
    PENDING_ACCESS=typeof onGranted==='function'?onGranted:null;
    var cached=cachedAccessStatus();
    async function secureReady(snapshot){
      if(window.NexoraSecureContent&&typeof window.NexoraSecureContent.hasValidEntitlement==='function'){
        var ok=false;
        try{ok=await window.NexoraSecureContent.hasValidEntitlement();}catch(_entitlementCheckError){ok=false;}
        if(!ok&&isOnline()&&typeof window.NexoraSecureContent.activate==='function'){
          try{await window.NexoraSecureContent.activate(snapshot||{});ok=await window.NexoraSecureContent.hasValidEntitlement();}catch(_secureActivationError){ok=false;}
        }
        /* L’autorisation chiffrée protège l’accès. Les cours et jeux restent strictement
           en consultation à la demande et ne sont jamais conservés hors ligne. */
        if(!ok)throw new Error('L’autorisation sécurisée de ce téléphone est absente ou expirée.');
      }
      return true;
    }
    if(!isOnline()){
      if(cached.allowed){PENDING_ACCESS=null;try{if(typeof window.toast==='function')window.toast('Connexion Internet nécessaire pour ouvrir les cours et les jeux.');}catch(_e){window.nxLog&&window.nxLog(_e)}return false;}
      PENDING_ACCESS=null;
      var offlineMessage=cached.reason==='expired'?'Votre abonnement est expiré. Connectez-vous à Internet pour le renouveler.':cached.reason==='verification_required'?'La date du téléphone doit être vérifiée en ligne avant de continuer.':'Une connexion Internet est nécessaire pour activer ou renouveler l’abonnement.';
      try{if(typeof window.toast==='function')window.toast(offlineMessage);}catch(_e){window.nxLog&&window.nxLog(_e)}
      return false;
    }
    try{
      var client=await waitClient();
      var status=null;
      try{status=await fetchSecureProductStatus(client,PENDING_CONTEXT);}catch(secureErr){throw secureErr;}
      if(status&&status.active===true&&status.status==='active'){
        writeSnapshot(status);
        await secureReady(status);
        return grantPendingAccess('');
      }
      if(status&&(status.status==='expired'||status.status==='revoked'))enforceExpiredAccess(status,true);
      await loadCatalog(false);
      await loadMyPaymentStatus(true).catch(function(){return null;});
      openModal(CURRENT_REQUEST&&requestState()==='pending'?'payment':'plans');
      return false;
    }catch(err){
      cached=cachedAccessStatus();
      if(isNetworkError(err)&&cached.allowed){try{await secureReady(cached.snapshot);return grantPendingAccess('Connexion rétablie nécessaire pour ouvrir ce contenu premium.');}catch(_secureFallback){window.nxLog&&window.nxLog(_secureFallback)}}
      PENDING_ACCESS=null;
      renderCatalogError(friendlyError(err));
      openModal('plans');
      return false;
    }
  };

  window.nxOfflineSubscriptionStatus=function(){
    var cached=cachedAccessStatus();
    return {allowed:cached.allowed,status:cached.snapshot.status,ends_at:cached.snapshot.ends_at,online:isOnline()};
  };

  document.addEventListener('click',function(event){
    var target=event.target&&event.target.closest?event.target.closest('[data-nx-payment-plan],[data-nx-declare-payment],[data-nx-copy-merchant],[data-nx-refresh-payment],[data-nx-subscribe-space],[data-nx-subscribe],[data-nx-open-access-screen],[data-nx-sub-close],[data-nx-back-plans],[data-nx-copy-payment-code],[data-nx-activate-code-v208],[data-nx-open-card-code]'):null;
    if(!target)return;

    if(target.hasAttribute('data-nx-payment-plan')){
      event.preventDefault();
      selectPlan(target.getAttribute('data-nx-payment-plan'),!!target.closest('#nxSubscriptionModal'));
      return;
    }

    if(target.hasAttribute('data-nx-copy-merchant')){
      event.preventDefault();copyMerchant();return;
    }

    if(target.hasAttribute('data-nx-copy-payment-code')){
      event.preventDefault();copyPaymentCode();return;
    }

    if(target.hasAttribute('data-nx-activate-code-v208')){
      event.preventDefault();
      var scope=target.closest('#nxSubscriptionModal')||document;
      var input=scope.querySelector('[data-nx-access-code-v208]');
      var feedback=scope.querySelector('[data-nx-code-feedback-v208]');
      target.disabled=true;var oldLabel=target.textContent;target.textContent='Validation…';
      window.nxActivateSubscriptionCode(input&&input.value,Number(target.getAttribute('data-nx-card-months')||0)||(SELECTED_PLAN&&SELECTED_PLAN.months),PENDING_CONTEXT).then(function(data){
        if(feedback){feedback.className='success';feedback.textContent=(data&&data.message)||'Code validé. Votre accès est actif.';}
        var run=PENDING_ACCESS;PENDING_ACCESS=null;if(typeof run==='function')run();
        setTimeout(closeModal,450);
      }).catch(function(err){if(feedback){feedback.className='error';feedback.textContent=friendlyError(err);}}).finally(function(){target.disabled=false;target.textContent=oldLabel;});
      return;
    }

    if(target.hasAttribute('data-nx-declare-payment')){
      event.preventDefault();
      var scope=target.closest('#nxSubscriptionModal')||target.closest('#screen-access')||document;
      target.disabled=true;
      var original=target.textContent;
      target.textContent='Validation…';
      declarePayment(scope).catch(function(err){
        var message=friendlyError(err);
        PAYMENT_UI_PHASE='error';
        PAYMENT_UI_ERROR=message;
        updateMainPaymentCard(scope);
        try{if(typeof window.toast==='function')window.toast(message);}catch(_e){window.nxLog&&window.nxLog(_e)}
      }).finally(function(){updateMainPaymentCard(scope);if(!target.disabled)target.textContent=original;});
      return;
    }

    if(target.hasAttribute('data-nx-refresh-payment')){
      event.preventDefault();
      target.disabled=true;
      target.textContent='Actualisation…';
      Promise.all([loadMyPaymentStatus(true),fetchStatus(true)]).then(function(){refreshSubscriptionUI();renderModalPaymentIfOpen();}).catch(function(err){try{if(typeof window.toast==='function')window.toast(friendlyError(err));}catch(_e){window.nxLog&&window.nxLog(_e)}}).finally(function(){target.disabled=false;target.textContent='Actualiser le statut';});
      return;
    }

    if(target.hasAttribute('data-nx-open-card-code')){
      event.preventDefault();
      loadCatalog(false).catch(function(){return null;}).then(function(){openModal('card');setTimeout(function(){var input=document.querySelector('#nxSubscriptionModal [data-nx-access-code-v208]');if(input)try{input.focus();}catch(_e){window.nxLog&&window.nxLog(_e)}},80);});
      return;
    }

    if(target.hasAttribute('data-nx-subscribe-space')){
      event.preventDefault();
      var requestedSpace=target.getAttribute('data-nx-subscribe-space')==='pro'?'pro':'eleves';
      PENDING_CONTEXT=requestedSpace==='pro'?'modules':'academy';
      poserEspace(requestedSpace);
      loadCatalog(false).then(function(){return loadMyPaymentStatus(true).catch(function(){return null;});}).then(function(){openModal(CURRENT_REQUEST&&requestState()==='pending'?'payment':'plans');}).catch(function(err){renderCatalogError(friendlyError(err));openModal('plans');});
      return;
    }

    if(target.hasAttribute('data-nx-subscribe')){
      event.preventDefault();
      poserEspace(espacePourContexte(PENDING_CONTEXT));
      loadCatalog(false).then(function(){return loadMyPaymentStatus(true).catch(function(){return null;});}).then(function(){openModal(CURRENT_REQUEST&&requestState()==='pending'?'payment':'plans');}).catch(function(err){renderCatalogError(friendlyError(err));openModal('plans');});
      return;
    }

    if(target.hasAttribute('data-nx-open-access-screen')){
      event.preventDefault();
      poserEspace(espacePourContexte(PENDING_CONTEXT));
      closeModal();
      try{
        if(window.NexoraApp&&typeof window.NexoraApp.go==='function')window.NexoraApp.go('access');
        else{var nav=document.querySelector('[data-action="go"][data-screen="access"]');if(nav)nav.click();}
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      return;
    }

    if(target.hasAttribute('data-nx-back-plans')){event.preventDefault();openModal('plans');return;}
    if(target.hasAttribute('data-nx-sub-close')){event.preventDefault();PENDING_ACCESS=null;closeModal();}
  });

  document.addEventListener('click',function(event){
    var spaceButton=event.target&&event.target.closest?event.target.closest('[data-nx-nav-espace-v509],[data-nx-porte-v510],[data-nx-space-entry-v507]'):null;
    if(!spaceButton)return;
    var value=spaceButton.getAttribute('data-nx-nav-espace-v509')||spaceButton.getAttribute('data-nx-porte-v510')||spaceButton.getAttribute('data-nx-space-entry-v507')||'';
    var space=(value==='pro'||value==='professional')?'pro':'eleves';
    PENDING_CONTEXT=space==='pro'?'modules':'academy';
    poserEspace(space);
  });

  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'){
      var modal=document.getElementById('nxSubscriptionModal');
      if(modal&&!modal.hidden){PENDING_ACCESS=null;closeModal();}
    }
  });

  async function strictStatusCheck(announceExpiry){
    if(STRICT_CHECK_PROMISE)return STRICT_CHECK_PROMISE;
    STRICT_CHECK_PROMISE=(async function(){
      var local=readSnapshot();
      if(local.ends_at&&parseTime(local.ends_at)<=subscriptionClock(local,false).now){
        enforceExpiredAccess(local,announceExpiry===true);
      }else if(!local.active){
        closePremiumViews();
      }
      refreshSubscriptionUI();
      if(isOnline()){
        try{
          var status=await fetchStatus(true);
          if(!status.active){
            if(status.status==='expired'||status.status==='revoked')enforceExpiredAccess(status,announceExpiry===true);
            else closePremiumViews();
          }
          refreshSubscriptionUI();
          return status;
        }catch(_e){return readSnapshot();}
      }
      return readSnapshot();
    })();
    try{return await STRICT_CHECK_PROMISE;}finally{STRICT_CHECK_PROMISE=null;}
  }

  function startStrictHeartbeat(){
    if(STRICT_HEARTBEAT_TIMER)clearInterval(STRICT_HEARTBEAT_TIMER);
    STRICT_HEARTBEAT_TIMER=setInterval(function(){if(document.visibilityState!=='hidden'&&isOnline())strictStatusCheck(true);},STRICT_STATUS_INTERVAL_MS);
  }

  async function boot(){
    var cached=readSnapshot();
    scheduleExpiry(cached);
    if(cached.status==='expired'||cached.status==='revoked')enforceExpiredAccess(cached,false);
    refreshSubscriptionUI();
    if(isOnline()){
      try{
        await loadCatalog(false);
        await Promise.all([strictStatusCheck(false),loadMyPaymentStatus(true).catch(function(){return null;})]);
        refreshSubscriptionUI();
        setupRealtime();
      }catch(err){renderCatalogError(friendlyError(err));}
    }
    startStrictHeartbeat();
  }

  window.addEventListener('online',function(){
    strictStatusCheck(true);
    loadMyPaymentStatus(true).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')});
    setupRealtime();
  });
  window.addEventListener('offline',function(){
    teardownPaymentRealtime();
    var local=readSnapshot();
    if(!local.active)closePremiumViews();
    refreshSubscriptionUI();
  });
  window.addEventListener('focus',function(){strictStatusCheck(true);});
  window.addEventListener('pageshow',function(){strictStatusCheck(true);});
  document.addEventListener('visibilitychange',function(){if(!document.hidden){strictStatusCheck(true);managePendingPolling();}else{if(POLL_TIMER){clearTimeout(POLL_TIMER);POLL_TIMER=null;}teardownPaymentRealtime();}});

  window.NexoraSubscriptionV250={
    check:function(){return strictStatusCheck(true);},
    status:function(){return readSnapshot();},
    interval_ms:STRICT_STATUS_INTERVAL_MS,
    reminder_days:RENEWAL_NOTICE_DAYS
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else setTimeout(boot,0);
})();

/* ===== inline-17 ===== */
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
  function notify(message){try{if(typeof window.toast==='function'){window.toast(message);return;}}catch(_e){window.nxLog&&window.nxLog(_e)}try{console.info('[Nexora cours-jeu]',message);}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function saveContext(ctx){try{localStorage.setItem(CONTEXT_KEY,JSON.stringify(ctx||{}));}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function readContext(){try{var x=JSON.parse(localStorage.getItem(CONTEXT_KEY)||'{}')||{};if(!x.started_at||Date.now()-Number(x.started_at)>CONTEXT_MAX_AGE)return null;return x;}catch(_e){return null;}}
  function clearContext(){try{localStorage.removeItem(CONTEXT_KEY);}catch(_e){window.nxLog&&window.nxLog(_e)}}
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
    }catch(_e){window.nxLog&&window.nxLog(_e)}
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
    var c=getClient();if(!c||typeof c.rpc!=='function'){notify('Résultat conservé sur ce téléphone. La mise à jour reprendra automatiquement.');return false;}
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
      if(r&&r.error)throw r.error;var d=r&&r.data;if(typeof d==='string'){try{d=JSON.parse(d);}catch(_e){window.nxLog&&window.nxLog(_e)}}
      if(d&&d.success){notify(d.mastered?'Cours renforcé : objectif atteint dans Jeu Adams.':'Score lié au cours. Continue pour atteindre l’objectif.');clearContext();try{document.dispatchEvent(new CustomEvent('nx-course-game-progress',{detail:d}));}catch(_e){window.nxLog&&window.nxLog(_e)}return true;}
    }catch(err){notify('Le score du jeu est enregistré, mais le lien avec le cours doit être resynchronisé.');}
    return false;
  }
  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest?e.target.closest('[data-action="open-course-adams-challenge"]'):null;if(!btn)return;
    e.preventDefault();openChallenge(btn.getAttribute('data-course-key')||'',btn.getAttribute('data-course-title')||'',btn.getAttribute('data-course-type')||'module');
  });
  window.NexoraCourseGame={open:openChallenge,recordAttempt:recordAttempt,readContext:readContext,clearContext:clearContext};
})();

