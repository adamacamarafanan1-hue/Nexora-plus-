
(function(){
  'use strict';

  var CACHE_KEY='nexora_subscription_snapshot_v6';
  var LEGACY_CACHE_KEYS=['nexora_subscription_snapshot_v5','nexora_subscription_snapshot_v4','nexora_subscription_snapshot_v3'];
  var CLOCK_ROLLBACK_TOLERANCE_MS=5*60*1000;
  var CATALOG=null;
  var PLANS={};
  var SELECTED_PLAN=null;
  var CURRENT_REQUEST=null;
  var PAYMENT_UI_PHASE='';
  var PAYMENT_UI_ERROR='';
  var STATUS_PROMISE=null;
  var CATALOG_PROMISE=null;
  var LAST_SERVER_CHECK=0;
  var SERVER_CACHE_MS=45000;
  var EXPIRY_TIMER=null;
  var REALTIME_CHANNEL=null;
  var POLL_TIMER=null;
  var PENDING_ACCESS=null;
  var PENDING_CONTEXT='all';

  function parseData(value){
    if(typeof value==='string'){
      try{return JSON.parse(value);}catch(_e){return {};}
    }
    return value||{};
  }

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

  function getClient(){
    try{
      if(window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function')return window.NexoraApp.getSupabaseClient();
    }catch(_e){}
    return null;
  }

  async function waitClient(){
    for(var i=0;i<60;i++){
      var c=getClient();
      if(c&&c.auth&&typeof c.rpc==='function')return c;
      await new Promise(function(resolve){setTimeout(resolve,120);});
    }
    throw new Error('Connexion Supabase indisponible. Recharge Nexora et vérifie Internet.');
  }

  function withTimeout(promise,ms,message){
    return Promise.race([
      promise,
      new Promise(function(_resolve,reject){setTimeout(function(){reject(new Error(message||'Délai dépassé.'));},ms||12000);})
    ]);
  }

  async function currentUser(client){
    var session=await client.auth.getSession();
    var user=session&&session.data&&session.data.session&&session.data.session.user;
    if(user)return user;
    try{
      var refreshed=await client.auth.refreshSession();
      user=refreshed&&refreshed.data&&refreshed.data.session&&refreshed.data.session.user;
      if(user)return user;
    }catch(_e){}
    return null;
  }

  function isMissingRpc(err){
    var code=String(err&&err.code||'');
    var msg=String(err&&err.message||err||'').toLowerCase();
    return code==='42883'||msg.indexOf('does not exist')>-1||msg.indexOf('could not find the function')>-1;
  }

  function isOnline(){
    return typeof navigator==='undefined'||navigator.onLine!==false;
  }

  function isNetworkError(err){
    var msg=String(err&&err.message||err||'').toLowerCase();
    return !isOnline()||msg.indexOf('failed to fetch')>-1||msg.indexOf('network')>-1||msg.indexOf('connexion')>-1||msg.indexOf('délai')>-1||msg.indexOf('timeout')>-1;
  }

  function parseTime(value){
    var ms=value instanceof Date?value.getTime():new Date(value||0).getTime();
    return isFinite(ms)&&ms>0?ms:0;
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

  function markExpired(snapshot,status){
    snapshot=Object.assign({},snapshot||{});
    snapshot.active=false;
    snapshot.offline_eligible=false;
    snapshot.status=status||'expired';
    return snapshot;
  }

  function cachedAccessStatus(){
    var snapshot=readSnapshot();
    return {
      allowed:snapshot.active===true&&snapshot.status==='active'&&snapshot.offline_eligible!==false,
      snapshot:snapshot,
      reason:snapshot.status||'inactive'
    };
  }

  function grantPendingAccess(message){
    var run=PENDING_ACCESS;PENDING_ACCESS=null;
    if(typeof run==='function')run();
    if(message){try{if(typeof window.toast==='function')window.toast(message);}catch(_e){}}
    return true;
  }

  function friendlyError(err){
    var code=String(err&&err.code||'');
    var msg=String(err&&err.message||err||'Action impossible.');
    var detail=String(err&&err.details||'');
    var hint=String(err&&err.hint||'');
    var low=msg.toLowerCase();
    if(code==='42501'||low.indexOf('session')>-1||low.indexOf('connecte-toi')>-1)return 'Connecte-toi à ton compte Nexora avant de continuer.';
    if(low.indexOf('failed to fetch')>-1||low.indexOf('network')>-1)return 'Connexion Internet ou Supabase indisponible.';
    if(isMissingRpc(err))return 'La fonction de déclaration n’est pas visible dans ce projet Supabase. Nexora va essayer l’enregistrement direct sécurisé. Détail : '+msg;
    return msg+(detail?' — '+detail:'')+(hint?' — '+hint:'');
  }

  function readSnapshot(){
    var data={authenticated:false,active:false,status:'inactive',ends_at:null,offline_eligible:false};
    try{
      var raw=localStorage.getItem(CACHE_KEY);
      if(!raw){for(var i=0;i<LEGACY_CACHE_KEYS.length&&!raw;i++)raw=localStorage.getItem(LEGACY_CACHE_KEYS[i]);}
      if(raw)data=Object.assign(data,JSON.parse(raw)||{});
    }catch(_e){}
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
    }catch(_persistError){}
    return data;
  }

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
    }catch(_e){}
  }

  function scheduleExpiry(snapshot){
    if(EXPIRY_TIMER){clearTimeout(EXPIRY_TIMER);EXPIRY_TIMER=null;}
    if(!snapshot||snapshot.status!=='active'||!snapshot.ends_at)return;
    var delay=parseTime(snapshot.ends_at)-subscriptionClock(snapshot,false).now;
    if(!isFinite(delay)||delay<=0){
      writeSnapshot(markExpired(snapshot,'expired'));closePremiumViews();refreshSubscriptionUI();return;
    }
    EXPIRY_TIMER=setTimeout(function(){
      var current=readSnapshot();
      if(current.ends_at&&parseTime(current.ends_at)<=subscriptionClock(current,false).now){
        writeSnapshot(markExpired(current,'expired'));closePremiumViews();refreshSubscriptionUI();
      }else{
        scheduleExpiry(current);
        if(isOnline())fetchStatus(true).catch(function(){});
      }
    },Math.min(delay+500,2140000000));
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
    }else if(snapshot.status==='expired'||snapshot.status==='revoked'||snapshot.status==='not_connected'){
      snapshot.offline_eligible=false;
    }
    try{
      localStorage.setItem(CACHE_KEY,JSON.stringify(snapshot));
      LEGACY_CACHE_KEYS.forEach(function(key){localStorage.setItem(key,JSON.stringify(snapshot));});
    }catch(_e){}
    try{if(window.NexoraSecureContent&&typeof window.NexoraSecureContent.syncSnapshot==='function')window.NexoraSecureContent.syncSnapshot(snapshot);}catch(_secureError){}
    scheduleExpiry(snapshot);
    return snapshot;
  }

  function normalizeStatus(data){
    data=parseData(data);
    var active=data.active===true&&String(data.status||'active')==='active'&&(!data.ends_at||new Date(data.ends_at).getTime()>Date.now());
    return {
      authenticated:data.authenticated!==false,
      active:active,
      status:active?'active':String(data.status||'inactive'),
      plan_code:data.plan_code||'',
      duration_months:Number(data.duration_months||0)||null,
      price_gnf:Number(data.price_gnf||0)||null,
      starts_at:data.starts_at||null,
      ends_at:data.ends_at||null,
      server_now:data.server_now||new Date().toISOString(),
      server_verified_at:Date.now(),
      trusted_server_ms:parseTime(data.server_now)||Date.now(),
      trusted_device_ms:Date.now(),
      last_device_seen_ms:Date.now(),
      last_trusted_now_ms:parseTime(data.server_now)||Date.now(),
      offline_eligible:active
    };
  }

  async function callStatus(client){
    var secure=await withTimeout(client.rpc('nexora_my_subscription_status_v4',{p_product_code:'all'}),10000,'La vérification de l’abonnement prend trop de temps.');
    if(secure&&secure.error&&!isMissingRpc(secure.error))throw secure.error;
    var secureData=secure&&!secure.error?normalizeStatus(secure.data):null;
    if(secureData&&secureData.active)return secureData;

    var payment=await withTimeout(client.rpc('nexora_my_subscription_status_v3'),10000,'La vérification de l’abonnement prend trop de temps.');
    if(payment&&payment.error&&!isMissingRpc(payment.error))throw payment.error;
    var paymentData=payment&&!payment.error?normalizeStatus(payment.data):null;
    if(paymentData&&paymentData.active)return paymentData;

    var legacy=await withTimeout(client.rpc('nexora_my_subscription_status_v2'),10000,'La vérification de l’abonnement prend trop de temps.');
    if(legacy&&legacy.error){
      if(isMissingRpc(legacy.error)){
        var old=await withTimeout(client.rpc('nexora_my_subscription_status'),10000,'La vérification de l’abonnement prend trop de temps.');
        if(old&&old.error){
          if(paymentData)return paymentData;
          if(secureData)return secureData;
          throw old.error;
        }
        var oldData=normalizeStatus(old&&old.data);
        return oldData.active?oldData:(paymentData||secureData||oldData);
      }
      if(paymentData)return paymentData;
      if(secureData)return secureData;
      throw legacy.error;
    }
    var legacyData=normalizeStatus(legacy&&legacy.data);
    return legacyData.active?legacyData:(paymentData||secureData||legacyData);
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
      if(data.ends_at)label='Actif jusqu’au '+formatDate(data.ends_at);
      return {className:'active',label:label};
    }
    if(data.status==='expired'||data.status==='revoked')return {className:'expired',label:data.status==='revoked'?'Révoqué':'Expiré'};
    return {className:'',label:'Non activé'};
  }

  async function loadCatalog(force){
    if(CATALOG&&!force)return CATALOG;
    if(CATALOG_PROMISE)return CATALOG_PROMISE;
    CATALOG_PROMISE=(async function(){
      var client=await waitClient();
      var result=await withTimeout(client.rpc('nexora_subscription_catalog'),10000,'Le chargement des tarifs prend trop de temps.');
      if(result&&result.error)throw result.error;
      var data=parseData(result&&result.data);
      if(!data||data.success!==true||!Array.isArray(data.plans)||!data.plans.length)throw new Error('Aucune formule active n’est disponible dans Supabase.');
      CATALOG=data;
      PLANS={};
      data.plans.forEach(function(plan){
        var months=Number(plan.duration_months||0);
        if(months>0)PLANS[months]={
          id:plan.id,
          plan_code:plan.plan_code||'',
          months:months,
          label:plan.label||(months+' mois'),
          total:Number(plan.total_gnf||0),
          monthly:Number(plan.monthly_gnf||0),
          badge:plan.badge||'',
          featured:plan.is_featured===true,
          best:plan.is_best_value===true
        };
      });
      renderCatalogUI();
      return data;
    })();
    try{return await CATALOG_PROMISE;}finally{CATALOG_PROMISE=null;}
  }

  function sortedPlans(){
    return Object.keys(PLANS).map(function(key){return PLANS[key];}).sort(function(a,b){return a.months-b.months;});
  }

  function planButtonMarkup(plan,modal){
    var locked=CURRENT_REQUEST&&['payment_declared','under_review'].indexOf(String(CURRENT_REQUEST.status))>-1&&Number(CURRENT_REQUEST.duration_months)!==plan.months;
    var selected=SELECTED_PLAN&&SELECTED_PLAN.months===plan.months;
    var cls='nx-pay-plan'+(selected?' selected':'')+(plan.featured?' featured':'')+(plan.best?' best':'');
    var badge=plan.featured?'Populaire':plan.best?'Meilleur prix':'';
    return '<button type="button" class="'+cls+'" data-nx-payment-plan="'+plan.months+'" aria-label="Choisir '+esc(plan.label)+' à '+formatGNF(plan.total)+'" aria-pressed="'+(selected?'true':'false')+'"'+(locked?' disabled':'')+'>'+ (badge?'<mark>'+esc(badge)+'</mark>':'') +'<small>'+esc(plan.label)+'</small><b>'+formatGNF(plan.total)+'</b><strong>'+formatGNF(plan.monthly)+' / mois</strong><span>'+esc(plan.badge||'Accès complet Nexora')+'</span><i>'+(selected?'Sélectionné':'Choisir cette formule')+'</i></button>';
  }

  function plansMarkup(modal){
    var list=sortedPlans();
    if(!list.length)return '<div class="nx-pay-catalog-loading">Chargement des formules depuis Supabase…</div>';
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
    if(state==='processing')return 'Veuillez patienter. Votre déclaration est en cours d’enregistrement sécurisé dans Supabase.';
    if(state==='error')return PAYMENT_UI_ERROR||'La déclaration n’a pas été enregistrée. Vérifiez la connexion puis réessayez.';
    if(state==='pending')return 'Veuillez patienter — vérification en cours. Votre paiement a bien été déclaré avec le numéro '+formatPhone(CURRENT_REQUEST&&CURRENT_REQUEST.payer_phone)+'. L’administration doit maintenant le vérifier avant d’activer votre accès.';
    if(state==='approved')return 'Paiement validé. Votre accès est actif'+(CURRENT_REQUEST.subscription_ends_at?' jusqu’au '+formatDate(CURRENT_REQUEST.subscription_ends_at):'')+'.';
    if(state==='rejected')return 'Paiement refusé.'+(CURRENT_REQUEST.admin_note?' Motif : '+CURRENT_REQUEST.admin_note:' Vérifiez le numéro utilisé puis créez une nouvelle demande.');
    if(SELECTED_PLAN)return 'Effectuez le paiement exact de '+formatGNF(SELECTED_PLAN.total)+' puis indiquez le numéro Orange Money ayant payé.';
    return 'Choisissez une formule pour commencer.';
  }

  function updateMainPaymentCard(root){
    root=root||document;
    var summary=root.querySelector('[data-nx-selected-plan-summary]');
    var phoneInput=root.querySelector('[data-nx-payer-phone]');
    var codeInput=root.querySelector('[data-nx-payment-code]');
    var validationBanner=root.querySelector('[data-nx-validation-banner]');
    var action=root.querySelector('[data-nx-declare-payment]');
    var feedback=root.querySelector('[data-nx-payment-feedback]');
    var stateBox=root.querySelector('[data-nx-code-state]');
    var codePanel=root.querySelector('[data-nx-code-panel]');
    var state=requestState();

    if(summary){
      if(SELECTED_PLAN){
        summary.classList.add('ready');
        summary.innerHTML='<span>Formule sélectionnée</span><strong>'+esc(SELECTED_PLAN.label)+' · '+formatGNF(SELECTED_PLAN.total)+' · '+formatGNF(SELECTED_PLAN.monthly)+' / mois</strong>';
      }else{
        summary.classList.remove('ready');
        summary.innerHTML='<span>Aucune formule sélectionnée</span><strong>Choisissez d’abord le nombre de mois.</strong>';
      }
    }

    if(phoneInput){
      phoneInput.disabled=!SELECTED_PLAN||state==='pending'||state==='approved';
      if(CURRENT_REQUEST&&CURRENT_REQUEST.payer_phone)phoneInput.value=CURRENT_REQUEST.payer_phone;
    }

    if(codeInput){
      var fullCode=CURRENT_REQUEST&&CURRENT_REQUEST.activation_code?String(CURRENT_REQUEST.activation_code):'Code en préparation';
      if('value' in codeInput)codeInput.value=fullCode;
      else codeInput.textContent=fullCode;
      codeInput.setAttribute('title',fullCode);
    }
    if(codePanel)codePanel.hidden=!(CURRENT_REQUEST&&CURRENT_REQUEST.activation_code);

    if(validationBanner){
      validationBanner.hidden=!state;
      validationBanner.className='nx-pay-validation-banner-v170'+(state?' '+(state==='error'?'rejected':state):'');
      if(state==='processing')validationBanner.innerHTML='<b>Veuillez patienter</b><span>Enregistrement sécurisé du paiement dans Supabase. Ne fermez pas cette fenêtre.</span>';
      else if(state==='pending')validationBanner.innerHTML='<b>Vérification en cours</b><span>Votre déclaration est enregistrée. Ne refaites pas le paiement : l’administration vérifie maintenant le numéro indiqué.</span>';
      else if(state==='approved')validationBanner.innerHTML='<b>Paiement validé</b><span>Votre abonnement Nexora est maintenant actif.</span>';
      else if(state==='rejected')validationBanner.innerHTML='<b>Paiement refusé</b><span>Consultez le motif ci-dessous avant de créer une nouvelle demande.</span>';
      else if(state==='error')validationBanner.innerHTML='<b>Déclaration non enregistrée</b><span>'+esc(PAYMENT_UI_ERROR||'Vérifiez votre connexion puis réessayez.')+'</span>';
      else validationBanner.innerHTML='';
    }

    if(action){
      if(!SELECTED_PLAN){action.disabled=true;action.textContent='Choisir une durée';}
      else if(state==='processing'){action.disabled=true;action.textContent='Veuillez patienter…';}
      else if(state==='pending'){action.disabled=true;action.textContent='Vérification en cours';}
      else if(state==='approved'){action.disabled=true;action.textContent='Accès activé';}
      else{action.disabled=false;action.textContent='J’ai payé — envoyer à la validation';}
    }

    if(feedback){
      feedback.className='nx-pay-status-v168'+(state?' '+(state==='error'?'rejected':state):'');
      feedback.textContent=paymentMessage();
    }

    if(stateBox){
      if(!CURRENT_REQUEST||!CURRENT_REQUEST.activation_code)stateBox.innerHTML='';
      else{
        var label=state==='approved'?'Code validé':state==='rejected'?'Code refusé':'Code en attente';
        stateBox.innerHTML='<span class="'+state+'">'+esc(label)+'</span>'+(state==='pending'?'<span class="nx-pay-pulse-dot" aria-hidden="true"></span>':'');
      }
    }
  }

  function renderCatalogUI(){
    var plans=sortedPlans();
    document.querySelectorAll('[data-nx-payment-plan-grid]').forEach(function(grid){grid.innerHTML=plansMarkup(false);});
    document.querySelectorAll('[data-nx-merchant-phone]').forEach(function(el){el.textContent=formatPhone(merchantPhone());});
    document.querySelectorAll('[data-nx-payment-instructions]').forEach(function(el){el.textContent=(CATALOG&&CATALOG.instructions)||'Effectuez le paiement puis indiquez le numéro ayant payé.';});
    document.querySelectorAll('[data-nx-copy-merchant]').forEach(function(btn){btn.disabled=!merchantPhone();});
    document.querySelectorAll('[data-nx-catalog-count]').forEach(function(el){el.textContent=String(plans.length||'—');});
    var lowest=plans.reduce(function(min,p){return !min||p.monthly<min?p.monthly:min;},0);
    var highest=plans.reduce(function(max,p){return p.monthly>max?p.monthly:max;},0);
    document.querySelectorAll('[data-nx-catalog-lowest]').forEach(function(el){el.textContent=lowest?formatGNF(lowest):'—';});
    document.querySelectorAll('[data-nx-catalog-range]').forEach(function(el){el.textContent=lowest&&highest?'De '+formatGNF(highest)+' à '+formatGNF(lowest)+' / mois':'Tarifs Supabase';});
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
    for(var i=0;i<2;i++){
      var rpcName=i===0?'nexora_my_payment_request_status_v2':'nexora_my_payment_request_status';
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
    if(CURRENT_REQUEST&&PLANS[Number(CURRENT_REQUEST.duration_months)])SELECTED_PLAN=PLANS[Number(CURRENT_REQUEST.duration_months)];
    renderCatalogUI();
    if(CURRENT_REQUEST&&requestState()==='approved'){
      await fetchStatus(true).catch(function(){});
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

  async function createPaymentRequestOnServer(client,user,phone){
    var rpcErrors=[];
    var rpcNames=['nexora_create_payment_request_v6','nexora_create_payment_request'];
    for(var i=0;i<rpcNames.length;i++){
      var rpcName=rpcNames[i];
      try{
        var rpcResult=await withTimeout(
          client.rpc(rpcName,{p_duration_months:SELECTED_PLAN.months,p_payer_phone:phone}),
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
    if(!row)throw new Error('Supabase n’a retourné aucune demande après l’enregistrement.');
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
      if(banner&&!banner.hidden)try{banner.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(_e){}
    },30);

    try{
      var client=await waitClient();
      var user=await currentUser(client);
      if(!user)throw new Error('Connecte-toi à ton compte Nexora avant de déclarer le paiement.');
      var data=await createPaymentRequestOnServer(client,user,phone);
      if(!data||data.success!==true)throw new Error(data&&data.message?data.message:'Supabase n’a pas confirmé la demande.');

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
        if(banner&&!banner.hidden)try{banner.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(_e){}
      },80);
      try{if(typeof window.toast==='function')window.toast('Veuillez patienter : vérification du paiement en cours.');}catch(_e){}
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

  function modalPlansMarkup(){
    return '<div class="nx-pay-step-intro-v169"><div class="nx-pay-step-kicker-v169"><span>1</span> Étape 1 sur 2</div><h4>Choisissez la durée de votre accès</h4><p>Touchez une formule pour continuer. Les tarifs sont chargés directement depuis Supabase.</p></div><div class="nx-pay-modal-grid" data-nx-payment-plan-grid>'+plansMarkup(true)+'</div>';
  }

  function modalPaymentMarkup(){
    var plan=SELECTED_PLAN;
    if(!plan)return modalPlansMarkup();
    return '<div class="nx-pay-step-intro-v169"><div class="nx-pay-step-kicker-v169"><span>2</span> Étape 2 sur 2</div><h4>Effectuez puis déclarez le paiement</h4><p>Payez le montant exact, puis indiquez seulement le numéro Orange Money utilisé.</p></div>'+ 
      '<div class="nx-pay-validation-banner-v170" data-nx-validation-banner hidden></div>'+
      '<section class="nx-access-code-direct-v208"><div><small>Vous avez déjà un code ?</small><strong>Activez-le après avoir choisi la durée</strong></div><div class="nx-access-code-direct-row-v208"><input data-nx-access-code-v208 autocomplete="one-time-code" inputmode="text" maxlength="32" placeholder="Votre code d’activation"><button type="button" data-nx-activate-code-v208>Activer le code</button></div><p data-nx-code-feedback-v208 aria-live="polite"></p></section>'+
      '<div class="nx-pay-modal-selected"><div><small>Formule sélectionnée</small><strong>'+esc(plan.label)+'</strong></div><b>'+formatGNF(plan.total)+'</b></div>'+ 
      '<div class="nx-orange-money-box-v168"><span class="nx-om-mark-v169" aria-hidden="true">OM</span><div><small>Numéro Orange Money Nexora</small><strong data-nx-merchant-phone>'+esc(formatPhone(merchantPhone()))+'</strong><span data-nx-payment-instructions>'+esc((CATALOG&&CATALOG.instructions)||'Effectuez le paiement puis indiquez le numéro ayant payé.')+'</span></div><button type="button" class="nx-pay-copy-btn" data-nx-copy-merchant>Copier le numéro</button></div>'+ 
      '<ol class="nx-pay-checklist-v169"><li>Envoyez exactement <b>'+formatGNF(plan.total)+'</b> au numéro affiché.</li><li>Saisissez le numéro Orange Money qui a effectué le paiement.</li><li>Cliquez sur <b>J’ai payé — envoyer à la validation</b>.</li></ol>'+ 
      '<div class="nx-pay-fields"><div class="nx-pay-field"><label>Numéro Orange Money ayant payé <small>Référence unique</small></label><input data-nx-payer-phone type="tel" inputmode="numeric" autocomplete="tel" maxlength="15" placeholder="Exemple : 620 00 00 00"></div><div class="nx-pay-code-panel-v170" data-nx-code-panel hidden><div class="nx-pay-code-label-v170">Code Supabase réservé</div><div class="nx-pay-code-row-v170"><code data-nx-payment-code aria-live="polite">Code en préparation</code><button type="button" class="nx-pay-code-copy-v170" data-nx-copy-payment-code>Copier</button></div><div class="nx-pay-code-state" data-nx-code-state></div></div></div>'+ 
      '<div class="nx-pay-action-row"><button type="button" class="nx-pay-primary" data-nx-declare-payment>J’ai payé — envoyer à la validation</button><div class="nx-pay-secondary-row-v169"><button type="button" class="nx-pay-secondary" data-nx-back-plans>Changer la durée</button><button type="button" class="nx-pay-secondary" data-nx-refresh-payment>Actualiser le statut</button></div></div>'+ 
      '<div class="nx-pay-status-v168" data-nx-payment-feedback aria-live="polite"></div>';
  }

  function openModal(mode){
    var modal=ensureModal();
    var title=modal.querySelector('#nxSubscriptionModalTitle');
    var content=modal.querySelector('[data-nx-sub-modal-content]');
    if(mode==='payment'&&SELECTED_PLAN){title.textContent='Déclarer le paiement';content.innerHTML=modalPaymentMarkup();updateMainPaymentCard(modal);}
    else{title.textContent='Choisir une formule';content.innerHTML=modalPlansMarkup();}
    modal.hidden=false;
    document.body.style.overflow='hidden';
    setTimeout(function(){var focus=modal.querySelector('button:not([disabled]),input:not([disabled])');if(focus)try{focus.focus();}catch(_e){}},30);
  }

  function renderModalPaymentIfOpen(){
    var modal=document.getElementById('nxSubscriptionModal');
    if(!modal||modal.hidden||!SELECTED_PLAN)return;
    var title=modal.querySelector('#nxSubscriptionModalTitle');
    var content=modal.querySelector('[data-nx-sub-modal-content]');
    title.textContent='Déclarer le paiement';
    content.innerHTML=modalPaymentMarkup();
    updateMainPaymentCard(modal);
  }

  function closeModal(){
    var modal=document.getElementById('nxSubscriptionModal');
    if(modal)modal.hidden=true;
    document.body.style.overflow='';
  }

  function selectPlan(months,fromModal){
    var plan=PLANS[Number(months)];
    if(!plan)return;
    var previousState=requestState();
    if(CURRENT_REQUEST&&['approved','activated','rejected'].indexOf(previousState)>=0){
      CURRENT_REQUEST=null;
    }
    SELECTED_PLAN=plan;
    if(requestState()!=='pending'&&requestState()!=='processing'){PAYMENT_UI_PHASE='';PAYMENT_UI_ERROR='';}
    document.querySelectorAll('[data-nx-payment-plan]').forEach(function(btn){
      var on=Number(btn.getAttribute('data-nx-payment-plan'))===plan.months;
      btn.classList.toggle('selected',on);
      btn.setAttribute('aria-pressed',on?'true':'false');
      var i=btn.querySelector('i');if(i)i.textContent=on?'Sélectionné':'Choisir';
    });
    updateMainPaymentCard(document);
    if(fromModal)openModal('payment');
    else{
      try{var card=document.querySelector('#screen-access .nx-payment-card-v168');if(card)card.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){}
    }
  }

  function copyMerchant(){
    var phone=merchantPhone();
    if(!phone)return;
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(phone);if(typeof window.toast==='function')window.toast('Numéro Orange Money copié.');return;}
    }catch(_e){}
    try{if(typeof window.toast==='function')window.toast('Numéro : '+formatPhone(phone));}catch(_e2){}
  }

  function copyPaymentCode(){
    var code=CURRENT_REQUEST&&CURRENT_REQUEST.activation_code?String(CURRENT_REQUEST.activation_code):'';
    if(!code)return;
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code);if(typeof window.toast==='function')window.toast('Code complet copié.');return;}
    }catch(_e){}
    try{if(typeof window.toast==='function')window.toast('Code : '+code);}catch(_e2){}
  }

  function refreshSubscriptionUI(){
    var st=statusData();
    document.querySelectorAll('.nx-subscription-status-v93').forEach(function(el){el.classList.remove('active','expired');if(st.className)el.classList.add(st.className);el.textContent=st.label;});
    try{if(window.NexoraApp&&typeof window.NexoraApp.render==='function')window.NexoraApp.render();}catch(_e){}
  }

  function setupRealtime(){
    (async function(){
      try{
        var client=await waitClient();
        var user=await currentUser(client);
        if(!user||!client.channel||REALTIME_CHANNEL)return;
        REALTIME_CHANNEL=client.channel('nexora-payment-user-'+user.id)
          .on('postgres_changes',{event:'*',schema:'public',table:'nexora_payment_requests',filter:'user_id=eq.'+user.id},function(){loadMyPaymentStatus(true).catch(function(){});})
          .subscribe();
      }catch(_e){}
    })();
  }

  function managePendingPolling(){
    if(POLL_TIMER){clearInterval(POLL_TIMER);POLL_TIMER=null;}
    if(requestState()==='pending'){
      POLL_TIMER=setInterval(function(){loadMyPaymentStatus(true).catch(function(){});},15000);
    }
  }

  window.nxSubscriptionEntry=function(context){
    var st=statusData();
    var area=String(context||'all').toLowerCase();
    var title=area==='adams'?'Débloquer le Jeu Adams':area==='orientation'?'Débloquer Adams Orientation':area==='modules'?'Débloquer les formations':'Accès éducatif Nexora';
    var detail=area==='adams'?'Un seul abonnement ouvre les jeux éducatifs et leurs différents modes.':area==='orientation'?'Un abonnement actif ouvre Adams Orientation sans limite.':area==='modules'?'Le même abonnement ouvre les formations, les cours scolaires, le BAC, le BEPC et la 10ème année.':'Formations, cours, Jeu Adams et orientation avec un seul accès.';
    var lowest=sortedPlans().reduce(function(min,p){return !min||p.monthly<min?p.monthly:min;},0);
    return '<section class="nx-subscription-v93 nx-subscription-v161" aria-label="'+esc(title)+'"><div class="nx-subscription-main-v93"><div class="nx-subscription-icon-v93" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M8 3v4M16 3v4M3 10h18"></path><path d="M8 15h8"></path></svg></div><div class="nx-subscription-copy-v93"><div class="nx-subscription-title-row-v93"><h3>'+esc(title)+'</h3><span class="nx-subscription-status-v93 '+st.className+'">'+esc(st.label)+'</span></div><div class="nx-subscription-price-v93"><b>'+(lowest?'À partir de '+formatGNF(lowest):'Tarifs Supabase')+'</b><span>paiement Orange Money</span></div><div class="nx-subscription-periods-v93"><span>1 à 12 mois</span><span>Validation admin</span><span>Expiration automatique</span></div><p>'+esc(detail)+' Choisis la durée, paie et indique uniquement le numéro Orange Money ayant payé.</p></div></div><div class="nx-subscription-actions-v93"><button type="button" class="btn btn-primary" data-nx-subscribe>Choisir et payer</button><button type="button" class="btn btn-soft" data-nx-open-access-screen>Voir les tarifs</button></div></section>';
  };

  window.nxSubscriptionMainMenu=function(){
    var st=statusData();
    var lowest=sortedPlans().reduce(function(min,p){return !min||p.monthly<min?p.monthly:min;},0);
    return '<section class="nx-main-access-v163" aria-label="Paiement et abonnement Nexora"><div class="nx-main-access-head-v163"><span class="nx-main-access-icon-v163" aria-hidden="true">OM</span><div class="nx-main-access-copy-v163"><small>Paiement Orange Money avec validation Supabase</small><div class="nx-main-access-title-v163"><h3>Choisir la durée et payer</h3><span class="nx-subscription-status-v93 '+st.className+'">'+esc(st.label)+'</span></div><p>Le numéro payeur sert d’unique référence. L’administration valide ensuite le code réservé et l’accès.</p></div><button type="button" class="nx-main-access-code-v163" data-nx-open-access-screen>Ouvrir le paiement</button></div><div class="nx-main-access-flow-v163"><span><i>1</i>Choisir les mois</span><span><i>2</i>Payer Orange Money</span><span><i>3</i>Déclarer le numéro</span><span><i>4</i>Validation admin</span></div><div class="nx-pay-status-v168">'+(lowest?'Formules Supabase à partir de '+formatGNF(lowest)+' par mois.':'Chargement des tarifs depuis Supabase…')+'</div></section>';
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
    var result=await withTimeout(client.rpc('nexora_my_subscription_status_v4',{p_product_code:product}),10000,'La vérification de l’accès prend trop de temps.');
    if(result&&result.error)throw result.error;
    return normalizeStatus(result&&result.data);
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
    PENDING_ACCESS=typeof onGranted==='function'?onGranted:null;
    var cached=cachedAccessStatus();
    async function secureReady(snapshot){
      if(window.NexoraSecureContent&&typeof window.NexoraSecureContent.hasValidEntitlement==='function'){
        var ok=await window.NexoraSecureContent.hasValidEntitlement();
        if(!ok&&isOnline()&&typeof window.NexoraSecureContent.activate==='function'){await window.NexoraSecureContent.activate(snapshot||{});ok=await window.NexoraSecureContent.hasValidEntitlement();}
        if(!ok)throw new Error('L’autorisation sécurisée de ce téléphone est absente ou expirée.');
      }
      return true;
    }
    if(!isOnline()){
      if(cached.allowed){
        try{await secureReady(cached.snapshot);return grantPendingAccess('Mode hors connexion : abonnement valide jusqu’au '+formatDate(cached.snapshot.ends_at)+'.');}
        catch(_offlineSecure){PENDING_ACCESS=null;try{if(typeof window.toast==='function')window.toast('Ce téléphone doit être activé une première fois avec Internet.');}catch(_e){}return false;}
      }
      PENDING_ACCESS=null;
      var offlineMessage=cached.reason==='expired'?'Votre abonnement est expiré. Connectez-vous à Internet pour le renouveler.':cached.reason==='verification_required'?'La date du téléphone doit être vérifiée en ligne avant de continuer.':'Une connexion Internet est nécessaire pour activer ou renouveler l’abonnement.';
      try{if(typeof window.toast==='function')window.toast(offlineMessage);}catch(_e){}
      return false;
    }
    try{
      var client=await waitClient();
      var status=null;
      try{status=await fetchSecureProductStatus(client,PENDING_CONTEXT);}catch(secureErr){if(!isMissingRpc(secureErr))throw secureErr;}
      if(!status||status.active!==true)status=await fetchStatus(true);
      if(status&&status.active===true&&status.status==='active'){
        writeSnapshot(status);
        await secureReady(status);
        return grantPendingAccess('');
      }
      await loadCatalog(false);
      await loadMyPaymentStatus(true).catch(function(){return null;});
      openModal(CURRENT_REQUEST&&requestState()==='pending'?'payment':'plans');
      return false;
    }catch(err){
      cached=cachedAccessStatus();
      if(isNetworkError(err)&&cached.allowed){try{await secureReady(cached.snapshot);return grantPendingAccess('Connexion instable : accès hors ligne autorisé jusqu’au '+formatDate(cached.snapshot.ends_at)+'.');}catch(_secureFallback){}}
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
    var target=event.target&&event.target.closest?event.target.closest('[data-nx-payment-plan],[data-nx-declare-payment],[data-nx-copy-merchant],[data-nx-refresh-payment],[data-nx-subscribe],[data-nx-open-access-screen],[data-nx-sub-close],[data-nx-back-plans],[data-nx-copy-payment-code],[data-nx-activate-code-v208]'):null;
    if(!target)return;

    if(target.hasAttribute('data-nx-payment-plan')){
      event.preventDefault();
      selectPlan(Number(target.getAttribute('data-nx-payment-plan')),!!target.closest('#nxSubscriptionModal'));
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
      window.nxActivateSubscriptionCode(input&&input.value,SELECTED_PLAN&&SELECTED_PLAN.months,PENDING_CONTEXT).then(function(data){
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
      target.textContent='Enregistrement Supabase…';
      declarePayment(scope).catch(function(err){
        var message=friendlyError(err);
        PAYMENT_UI_PHASE='error';
        PAYMENT_UI_ERROR=message;
        updateMainPaymentCard(scope);
        try{if(typeof window.toast==='function')window.toast(message);}catch(_e){}
      }).finally(function(){updateMainPaymentCard(scope);if(!target.disabled)target.textContent=original;});
      return;
    }

    if(target.hasAttribute('data-nx-refresh-payment')){
      event.preventDefault();
      target.disabled=true;
      target.textContent='Actualisation…';
      Promise.all([loadMyPaymentStatus(true),fetchStatus(true)]).then(function(){refreshSubscriptionUI();renderModalPaymentIfOpen();}).catch(function(err){try{if(typeof window.toast==='function')window.toast(friendlyError(err));}catch(_e){}}).finally(function(){target.disabled=false;target.textContent='Actualiser le statut';});
      return;
    }

    if(target.hasAttribute('data-nx-subscribe')){
      event.preventDefault();
      loadCatalog(false).then(function(){return loadMyPaymentStatus(true).catch(function(){return null;});}).then(function(){openModal(CURRENT_REQUEST&&requestState()==='pending'?'payment':'plans');}).catch(function(err){renderCatalogError(friendlyError(err));openModal('plans');});
      return;
    }

    if(target.hasAttribute('data-nx-open-access-screen')){
      event.preventDefault();
      closeModal();
      try{
        if(window.NexoraApp&&typeof window.NexoraApp.go==='function')window.NexoraApp.go('access');
        else{var nav=document.querySelector('[data-action="go"][data-screen="access"]');if(nav)nav.click();}
      }catch(_e){}
      return;
    }

    if(target.hasAttribute('data-nx-back-plans')){event.preventDefault();openModal('plans');return;}
    if(target.hasAttribute('data-nx-sub-close')){event.preventDefault();PENDING_ACCESS=null;closeModal();}
  });

  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'){
      var modal=document.getElementById('nxSubscriptionModal');
      if(modal&&!modal.hidden){PENDING_ACCESS=null;closeModal();}
    }
  });

  async function boot(){
    var cached=readSnapshot();
    scheduleExpiry(cached);
    refreshSubscriptionUI();
    if(isOnline()){
      try{
        await loadCatalog(false);
        await Promise.all([fetchStatus(true).catch(function(){return null;}),loadMyPaymentStatus(true).catch(function(){return null;})]);
        refreshSubscriptionUI();
        setupRealtime();
      }catch(err){renderCatalogError(friendlyError(err));}
    }
    setInterval(function(){
      var local=readSnapshot();
      if(!local.active)closePremiumViews();
      refreshSubscriptionUI();
      if(isOnline())fetchStatus(true).then(function(status){if(!status.active)closePremiumViews();refreshSubscriptionUI();}).catch(function(){});
    },300000);
  }

  window.addEventListener('online',function(){
    fetchStatus(true).then(function(status){if(!status.active)closePremiumViews();refreshSubscriptionUI();}).catch(function(){});
    loadMyPaymentStatus(true).catch(function(){});
    setupRealtime();
  });
  window.addEventListener('offline',function(){
    var local=readSnapshot();if(!local.active)closePremiumViews();refreshSubscriptionUI();
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else setTimeout(boot,0);
})();
