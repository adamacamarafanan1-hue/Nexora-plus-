
/* NEXORA V506.0 — Académie / Sujets / Romans chargés uniquement à l’ouverture */
/* ===== inline-18 ===== */
(function(){
  'use strict';
  var MODULE_URL='modules/orientation/index.html?v=272';
  var lastFocus=null;
  var pendingLevel='';
  function el(id){return document.getElementById(id);}
  function normalizeLevel(level){return level==='apres_bac'?'apres_bac':level==='apres_brevet'?'apres_brevet':'';}
  function setLoader(visible,message){
    var loader=el('nxOrientationLoaderV108');if(!loader)return;
    loader.hidden=!visible;
    var label=loader.querySelector('b');if(label&&message)label.textContent=message;
  }
  function applyLevelPreset(level){
    level=normalizeLevel(level);if(!level)return;
    var frame=el('nxOrientationFrameV108');if(!frame||!frame.contentWindow)return;
    try{
      var doc=frame.contentDocument;
      var select=doc&&doc.getElementById('level');
      if(select){
        select.value=level;
        if(typeof frame.contentWindow.toggleBacOptionField==='function')frame.contentWindow.toggleBacOptionField();
        try{select.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));}catch(_e){window.nxLog&&window.nxLog(_e)}
        var first=doc.getElementById('firstName');if(first&&typeof first.focus==='function')setTimeout(function(){try{first.focus();}catch(_e){window.nxLog&&window.nxLog(_e)}},60);
        return;
      }
      frame.contentWindow.postMessage({type:'nexora-orientation-level',level:level},window.location.protocol==='file:'?'*':window.location.origin);
    }catch(_e){window.nxLog&&window.nxLog(_e)}
  }
  function assignModule(frame,path){
    var resolver=window.NexoraAcademyContentV271;
    if(!resolver||typeof resolver.mountFrame!=='function')return Promise.reject(new Error('Chargeur officiel de l’Académie indisponible.'));
    return resolver.mountFrame(frame,path);
  }
  function ensureFrame(force,level){
    var frame=el('nxOrientationFrameV108');if(!frame)return;
    pendingLevel=normalizeLevel(level)||pendingLevel;
    if(!force&&frame.dataset.loaded==='1'){setLoader(false);setTimeout(function(){applyLevelPreset(pendingLevel);},30);return;}
    setLoader(true,'Ouverture d’Adams Orientation');
    frame.onload=function(){frame.dataset.loaded='1';setLoader(false);setTimeout(function(){applyLevelPreset(pendingLevel);},40);};
    frame.onerror=function(){frame.dataset.loaded='';setLoader(true,'Impossible d’ouvrir Adams Orientation. Réessaie.');};
    assignModule(frame,MODULE_URL,force).catch(function(error){frame.dataset.loaded='';console.error('[Nexora Académie]',error);setLoader(true,'Le contenu n’a pas pu être chargé. Ferme cette rubrique puis réessaie.');});
  }
  function openOrientationGranted(level){
    var viewer=el('nxOrientationViewerV108');if(!viewer)return;
    pendingLevel=normalizeLevel(level);
    lastFocus=document.activeElement;viewer.hidden=false;document.body.classList.add('nx-orientation-open-v108');ensureFrame(false,pendingLevel);
    var close=el('nxOrientationCloseV108');if(close)setTimeout(function(){try{close.focus();}catch(_e){window.nxLog&&window.nxLog(_e)}},30);
  }
  function openOrientation(level){
    level=normalizeLevel(level);
    if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('orientation',function(){openOrientationGranted(level);});
    return openOrientationGranted(level);
  }
  function closeOrientation(){
    var viewer=el('nxOrientationViewerV108');if(!viewer)return;
    viewer.hidden=true;document.body.classList.remove('nx-orientation-open-v108');
    if(lastFocus&&typeof lastFocus.focus==='function'){try{lastFocus.focus();}catch(_e){window.nxLog&&window.nxLog(_e)}}
  }
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#nxOrientationCloseV108')){e.preventDefault();closeOrientation();return;}
    if(e.target&&e.target.closest&&e.target.closest('#nxOrientationReloadV108')){e.preventDefault();ensureFrame(true,pendingLevel);return;}
  });
  document.addEventListener('keydown',function(e){var viewer=el('nxOrientationViewerV108');if(e.key==='Escape'&&viewer&&!viewer.hidden){e.preventDefault();closeOrientation();}});
  window.NexoraOrientation={open:openOrientation,openGranted:openOrientationGranted,close:closeOrientation,reload:function(){ensureFrame(true,pendingLevel);}};
})();

/* ===== inline-19 ===== */
(function(){
  'use strict';
  var loadPromise=null;
  function notify(message){try{if(typeof window.toast==='function')window.toast(message);else console.info(message);}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function loadPublicPrimary(){var resolver=window.NexoraAcademyContentV271;if(resolver&&typeof resolver.execute==='function')return resolver.execute('assets/js/nx-v157-primary-school-script.js');return Promise.reject(new Error('Fichier École primaire indisponible.'));}
  function ensureLoaded(){if(window.NexoraPrimarySchoolV157)return Promise.resolve(true);if(loadPromise)return loadPromise;var secureLoad=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.execute==='function')?window.NexoraSecureContent.execute('assets/js/nx-v157-primary-school-script.js'):Promise.reject(new Error('Protection des cours indisponible.'));loadPromise=secureLoad.catch(function(){return loadPublicPrimary();}).then(function(){if(!window.NexoraPrimarySchoolV157)throw new Error('École primaire non initialisée.');return true;}).catch(function(err){loadPromise=null;throw err;});return loadPromise;}
  function openGranted(){ensureLoaded().then(function(){window.NexoraPrimarySchoolV157.open();}).catch(function(err){notify(String(err&&err.message||err));});}
  window.NexoraPrimarySecureLoaderV211={
    open:function(){if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('academy',openGranted);return openGranted();},
    openGranted:openGranted,
    load:ensureLoaded
  };
})();

/* ===== inline-20 ===== */
(function(){
  'use strict';
  var VERSION='v160';
  var BUCKET='nexora-devoirs';
  var FUNCTION_NAME='nexora-devoirs-analyse';
  var HISTORY_KEY='nexora_homework_history_v160';
  var state={file:null,blob:null,dataUrl:'',analysis:null,mode:'',previousOverflow:''};
  function q(sel,root){return (root||document).querySelector(sel)}
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function viewer(){return document.getElementById('nxHomeworkViewerV162')}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function client(){try{return window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function'?window.NexoraApp.getSupabaseClient():null}catch(_e){return null}}
  function status(text,type){var el=q('[data-nx-homework-status]',viewer());if(!el)return;el.textContent=text||'';el.className='nx-homework-status-v160'+(text?' show '+(type||'info'):'')}
  function notify(text){try{if(window.NexoraApp&&typeof window.NexoraApp.notify==='function')return window.NexoraApp.notify(text)}catch(_e){window.nxLog&&window.nxLog(_e)}try{window.dispatchEvent(new CustomEvent('nexora-toast',{detail:{message:text}}))}catch(_e2){window.nxLog&&window.nxLog(_e2)} }
  function readLocalHistory(){try{var x=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_e){return []}}
  function writeLocalHistory(items){try{localStorage.setItem(HISTORY_KEY,JSON.stringify((items||[]).slice(0,20)))}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function addLocalHistory(item){var items=readLocalHistory();items.unshift(item);writeLocalHistory(items);renderHistory(items)}
  function dateLabel(value){try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))}catch(_e){return String(value||'')}}
  function renderHistory(items){var box=q('[data-nx-homework-history]',viewer());if(!box)return;items=Array.isArray(items)?items:readLocalHistory();if(!items.length){box.innerHTML='<div class="nx-homework-empty-history-v160">Aucun devoir analysé pour le moment.</div>';return}box.innerHTML=items.slice(0,20).map(function(item){return '<article class="nx-homework-history-item-v160"><div><b>'+esc(item.title||'Devoir expliqué')+'</b><span>'+esc((item.class_level||'')+' · '+(item.subject||''))+'</span><span>'+esc(dateLabel(item.created_at))+'</span></div><small>'+esc(item.mode==='server'?'Analyse IA':'Mode aperçu')+'</small></article>'}).join('')}
  async function loadRemoteHistory(){var c=client();if(!c){renderHistory();return}try{var session=await c.auth.getSession();if(!session||!session.data||!session.data.session){renderHistory();return}var res=await c.from('nexora_homework_analyses').select('id,class_level,subject,title,created_at').order('created_at',{ascending:false}).limit(20);if(res&&res.error)throw res.error;var remote=(res&&res.data||[]).map(function(x){return {title:x.title||'Devoir expliqué',class_level:x.class_level,subject:x.subject,created_at:x.created_at,mode:'server'}});if(remote.length){writeLocalHistory(remote);renderHistory(remote)}else renderHistory()}catch(_e){renderHistory()}}
  function open(){var v=viewer();if(!v)return;state.previousOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';v.hidden=false;reset(false);loadRemoteHistory();var cls=q('[data-nx-homework-class]',v);if(cls)cls.focus()}
  function close(){var v=viewer();if(!v)return;try{window.speechSynthesis&&window.speechSynthesis.cancel()}catch(_e){window.nxLog&&window.nxLog(_e)}v.hidden=true;document.body.style.overflow=state.previousOverflow;status('')}
  function reset(clearMeta){state.file=null;state.blob=null;state.dataUrl='';state.analysis=null;state.mode='';var v=viewer();if(!v)return;var empty=q('[data-nx-homework-photo-empty]',v),preview=q('[data-nx-homework-preview]',v),img=q('[data-nx-homework-preview-image]',v),result=q('[data-nx-homework-result]',v),placeholder=q('[data-nx-homework-placeholder]',v),hint2=q('[data-nx-homework-hint2-box]',v),camera=q('[data-nx-homework-camera]',v),gallery=q('[data-nx-homework-gallery]',v);if(empty)empty.hidden=false;if(preview)preview.hidden=true;if(img)img.removeAttribute('src');if(result)result.hidden=true;if(placeholder)placeholder.hidden=false;if(hint2)hint2.hidden=true;if(camera)camera.value='';if(gallery)gallery.value='';if(clearMeta){var note=q('[data-nx-homework-note]',v),consent=q('[data-nx-homework-consent]',v);if(note)note.value='';if(consent)consent.checked=false}status('')}
  function loadImage(dataUrl){return new Promise(function(resolve,reject){var img=new Image();img.onload=function(){resolve(img)};img.onerror=function(){reject(new Error('Image illisible. Reprends la photo.'))};img.src=dataUrl})}
  function fileToDataUrl(file){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(String(r.result||''))};r.onerror=function(){reject(new Error('Impossible de lire la photo.'))};r.readAsDataURL(file)})}
  async function prepareImage(file){if(!file)throw new Error('Aucune photo sélectionnée.');if(!/^image\/(jpeg|png|webp)$/i.test(file.type||''))throw new Error('Format non accepté. Utilise JPG, PNG ou WEBP.');if(file.size>12*1024*1024)throw new Error('Photo trop lourde. La taille maximale est de 12 Mo.');var raw=await fileToDataUrl(file),img=await loadImage(raw),max=1600,scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height)),w=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)),h=Math.max(1,Math.round((img.naturalHeight||img.height)*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;var ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);var quality='Photo nette';try{var sample=ctx.getImageData(0,0,Math.min(w,180),Math.min(h,180)).data,sum=0,count=0;for(var i=0;i<sample.length;i+=16){sum+=(sample[i]+sample[i+1]+sample[i+2])/3;count++}var avg=count?sum/count:128;if(avg<55)quality='Photo sombre — ajoute de la lumière';else if(w<700||h<500)quality='Photo petite — rapproche le téléphone'}catch(_e){window.nxLog&&window.nxLog(_e)}var blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/jpeg',.84)});if(!blob)throw new Error('Impossible de préparer la photo.');return {blob:blob,dataUrl:canvas.toDataURL('image/jpeg',.84),quality:quality,width:w,height:h}}
  async function onFile(file){status('Préparation de la photo…','loading');try{var ready=await prepareImage(file);state.file=file;state.blob=ready.blob;state.dataUrl=ready.dataUrl;var v=viewer(),empty=q('[data-nx-homework-photo-empty]',v),preview=q('[data-nx-homework-preview]',v),img=q('[data-nx-homework-preview-image]',v),quality=q('[data-nx-homework-quality]',v);if(empty)empty.hidden=true;if(preview)preview.hidden=false;if(img)img.src=ready.dataUrl;if(quality)quality.textContent=ready.quality;status(ready.quality,ready.quality.indexOf('nette')>=0?'info':'info')}catch(err){reset(false);status(err.message||'Photo invalide.','error')}}
  function analysisFallback(cls,subject,note){return {title:'Connexion pédagogique à finaliser',subject:subject,level:cls,detected_instruction:'La photo est prête, mais l’analyse Nexora Devoirs n’est pas encore disponible.',skill:'Interface de photographie et parcours guidé opérationnels',what_to_understand:'L’analyse automatique du contenu de la feuille sera disponible prochainement.',first_hint:note||'Demande à l’enfant de lire la consigne à voix haute et de dire ce qu’il pense devoir faire.',second_hint:'Repère les nombres, les verbes de consigne, les mots importants ou la figure concernée.',error_detected:'Aucune réponse n’a été inventée : l’analyse de la photo n’est pas encore disponible.',explanation_steps:[{title:'Observer',explanation:'Vérifier que toute la consigne est visible et que la photo est nette.'},{title:'Comprendre',explanation:'Identifier la matière, la notion et l’action demandée.'},{title:'Essayer',explanation:'Laisser l’enfant proposer une première démarche avant toute correction.'}],similar_exercise:'Dès que l’analyse sera disponible, Nexora proposera ici un exercice semblable adapté au niveau.',encouragement:'La photo est prête. L’analyse automatique sera bientôt disponible.',confidence:0,image_quality:'aperçu'} }
  function normalizeAnalysis(raw,cls,subject){raw=raw&&raw.analysis?raw.analysis:raw||{};return {title:String(raw.title||'Explication du devoir'),subject:String(raw.subject||subject||'Matière'),level:String(raw.level||cls||''),detected_instruction:String(raw.detected_instruction||'Consigne non précisée.'),skill:String(raw.skill||''),what_to_understand:String(raw.what_to_understand||''),first_hint:String(raw.first_hint||''),second_hint:String(raw.second_hint||''),error_detected:String(raw.error_detected||'Aucune erreur précise n’a encore été identifiée.'),explanation_steps:Array.isArray(raw.explanation_steps)?raw.explanation_steps:[],similar_exercise:String(raw.similar_exercise||''),encouragement:String(raw.encouragement||'Continue, tu peux y arriver.'),confidence:Number(raw.confidence||0),image_quality:String(raw.image_quality||'non précisée')}}
  function showAnalysis(analysis,mode){state.analysis=analysis;state.mode=mode;var v=viewer(),result=q('[data-nx-homework-result]',v),placeholder=q('[data-nx-homework-placeholder]',v);if(placeholder)placeholder.hidden=true;if(result)result.hidden=false;var set=function(sel,val){var el=q(sel,v);if(el)el.textContent=val||''};set('[data-nx-homework-result-subject]',analysis.subject+' · '+analysis.level);set('[data-nx-homework-result-title]',analysis.title);set('[data-nx-homework-result-skill]',analysis.skill);set('[data-nx-homework-result-instruction]',analysis.detected_instruction);set('[data-nx-homework-result-understand]',analysis.what_to_understand);set('[data-nx-homework-result-hint1]',analysis.first_hint);set('[data-nx-homework-result-hint2]',analysis.second_hint);set('[data-nx-homework-result-error]',analysis.error_detected);set('[data-nx-homework-result-practice]',analysis.similar_exercise);set('[data-nx-homework-result-encouragement]',analysis.encouragement);set('[data-nx-homework-result-mode]',mode==='server'?'Analyse IA sécurisée · photo supprimée après traitement':'Mode aperçu · analyse bientôt disponible');var steps=q('[data-nx-homework-result-steps]',v);if(steps)steps.innerHTML=(analysis.explanation_steps||[]).map(function(step,i){return '<div class="nx-homework-step-v160"><span>'+(i+1)+'</span><div><b>'+esc(step.title||('Étape '+(i+1)))+'</b><p>'+esc(step.explanation||'')+'</p></div></div>'}).join('')||'<p>Aucune étape disponible.</p>';var errorBox=q('[data-nx-homework-error-box]',v);if(errorBox)errorBox.hidden=!analysis.error_detected;var body=q('.nx-homework-body-v160',v);if(body)body.scrollTo({top:Math.max(0,result.offsetTop-120),behavior:'smooth'})}
  async function uploadAndAnalyze(cls,subject,note){var c=client();if(!c)throw new Error('L’analyse Nexora Devoirs n’est pas disponible dans cette version.');var sess=await c.auth.getSession(),session=sess&&sess.data&&sess.data.session;if(!session||!session.user)throw new Error('Connecte-toi à Nexora avant d’analyser un devoir.');var id=(window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)),path=session.user.id+'/'+new Date().toISOString().slice(0,10)+'/'+id+'.jpg';var upload=await c.storage.from(BUCKET).upload(path,state.blob,{contentType:'image/jpeg',upsert:false,cacheControl:'300'});if(upload&&upload.error)throw new Error('Stockage sécurisé indisponible : '+(upload.error.message||'espace d’enregistrement indisponible'));var invoked=await c.functions.invoke(FUNCTION_NAME,{body:{storage_path:path,class_level:cls,subject:subject,child_message:note||'',keep_image:false}});if(invoked&&invoked.error){try{await c.storage.from(BUCKET).remove([path])}catch(_e){window.nxLog&&window.nxLog(_e)}throw new Error(invoked.error.message||'Fonction d’analyse indisponible.')}if(!invoked||!invoked.data||invoked.data.error)throw new Error((invoked&&invoked.data&&invoked.data.error)||'Réponse d’analyse invalide.');return normalizeAnalysis(invoked.data,cls,subject)}
  async function submit(event){event.preventDefault();var v=viewer(),cls=q('[data-nx-homework-class]',v).value,subject=q('[data-nx-homework-subject]',v).value,note=q('[data-nx-homework-note]',v).value.trim(),consent=q('[data-nx-homework-consent]',v).checked,btn=q('[data-nx-homework-submit]',v);if(!cls||!subject){status('Choisis la classe et la matière.','error');return}if(!state.blob){status('Photographie ou sélectionne le devoir.','error');return}if(!consent){status('Confirme l’autorisation parentale et l’absence d’informations privées.','error');return}btn.disabled=true;btn.textContent='Analyse du devoir en cours…';status('La photo est envoyée au service sécurisé. Nexora lit la consigne et prépare une explication adaptée.','loading');try{var a=await uploadAndAnalyze(cls,subject,note);showAnalysis(a,'server');addLocalHistory({title:a.title,class_level:cls,subject:subject,created_at:new Date().toISOString(),mode:'server'});status('Analyse terminée. Commence par le premier indice avant de lire toutes les étapes.','info')}catch(err){var fallback=analysisFallback(cls,subject,note);showAnalysis(fallback,'preview');addLocalHistory({title:'Photo préparée — analyse bientôt disponible',class_level:cls,subject:subject,created_at:new Date().toISOString(),mode:'preview'});status((err.message||'Analyse distante indisponible.')+' Le mode aperçu explique comment finaliser l’activation.','error')}finally{btn.disabled=false;btn.textContent='Analyser et expliquer le devoir'}}
  function speak(){var a=state.analysis;if(!a)return;try{window.speechSynthesis.cancel();var text=[a.title,a.detected_instruction,'Ce qu’il faut comprendre : '+a.what_to_understand,'Premier indice : '+a.first_hint].concat((a.explanation_steps||[]).map(function(s){return s.title+'. '+s.explanation})).concat(['Exercice semblable : '+a.similar_exercise,a.encouragement]).join('. '),u=new SpeechSynthesisUtterance(text);u.lang='fr-FR';u.rate=.88;u.pitch=1.02;u.volume=1;var voices=window.speechSynthesis.getVoices?window.speechSynthesis.getVoices():[],fr=voices.find(function(x){return /^fr/i.test(x.lang||'')});if(fr)u.voice=fr;window.speechSynthesis.speak(u)}catch(_e){status('La lecture vocale n’est pas disponible sur cet appareil.','error')}}
  document.addEventListener('click',function(event){var target=event.target,btn=target&&target.closest?target.closest('[data-nx-homework-action]'):null;if(!btn)return;var action=btn.getAttribute('data-nx-homework-action');if(action==='close'){close();return}if(action==='camera'){var input=q('[data-nx-homework-camera]',viewer());if(input)input.click();return}if(action==='gallery'){var input2=q('[data-nx-homework-gallery]',viewer());if(input2)input2.click();return}if(action==='reset'){reset(true);return}if(action==='speak'){speak();return}if(action==='hint2'){var box=q('[data-nx-homework-hint2-box]',viewer());if(box){box.hidden=false;box.scrollIntoView({behavior:'smooth',block:'center'})}return}if(action==='refresh-history'){loadRemoteHistory();return}},true);
  document.addEventListener('change',function(event){var input=event.target;if(input&&input.matches&&input.matches('[data-nx-homework-camera],[data-nx-homework-gallery]'))onFile(input.files&&input.files[0])},true);
  document.addEventListener('submit',function(event){if(event.target&&event.target.matches&&event.target.matches('[data-nx-homework-form]'))submit(event)},true);
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&viewer()&&!viewer().hidden)close()});
  window.NexoraHomeworkV162={open:open,close:close,reset:function(){reset(true)},version:VERSION};
})();

/* Le moteur primaire est chargé une seule fois depuis le contenu protégé. */


/* ===== assets/js/nexora-academy-v271.js ===== */
(function(){
  'use strict';

  var VERSION='V271';
  var ROOT_SELECTOR='[data-nx-academy-real]';
  var rootElement=null;
  var currentAction=null;
  var primaryLoadPromise=null;

  function root(){
    if(rootElement&&document.documentElement.contains(rootElement))return rootElement;
    rootElement=document.querySelector(ROOT_SELECTOR);
    return rootElement;
  }

  function statusElement(){
    var r=root();
    return r?r.querySelector('[data-nx-academy-status]'):null;
  }

  function messageOf(error){
    return String(error&&error.message||error||'Cette rubrique est momentanément indisponible.');
  }

  function notify(message){
    try{
      if(window.NexoraApp&&typeof window.NexoraApp.notify==='function'){
        window.NexoraApp.notify(message);
        return;
      }
    }catch(_e){window.nxLog&&window.nxLog(_e)}
    try{
      if(typeof window.toast==='function'){
        window.toast(message);
        return;
      }
    }catch(_e2){window.nxLog&&window.nxLog(_e2)}
    try{window.dispatchEvent(new CustomEvent('nexora-toast',{detail:{message:message}}));}catch(_e3){window.nxLog&&window.nxLog(_e3)}
  }

  function setStatus(message,type){
    var el=statusElement();
    if(!el)return;
    var text=String(message||'').trim();
    el.hidden=!text;
    el.textContent=text;
    el.setAttribute('data-state',type||'info');
  }

  function setBusy(target,busy,label){
    var card=target&&target.closest?target.closest('[data-nx-academy-feature]'):null;
    if(!card&&target&&target.matches&&target.matches('[data-nx-academy-feature]'))card=target;
    if(!card)return;
    card.classList.toggle('is-opening',!!busy);
    card.setAttribute('aria-busy',busy?'true':'false');
    var button=card.querySelector('button');
    if(!button)return;
    if(busy){
      if(!button.dataset.nxOriginalLabel)button.dataset.nxOriginalLabel=button.textContent||'';
      button.disabled=true;
      button.textContent=label||'Ouverture…';
    }else{
      button.disabled=false;
      if(button.dataset.nxOriginalLabel){
        button.textContent=button.dataset.nxOriginalLabel;
        delete button.dataset.nxOriginalLabel;
      }
    }
  }

  function show(view){
    var r=root();
    if(!r)return false;
    var found=false;
    r.querySelectorAll('[data-nx-academy-view]').forEach(function(panel){
      var active=panel.getAttribute('data-nx-academy-view')===view;
      panel.hidden=!active;
      panel.setAttribute('aria-hidden',active?'false':'true');
      if(active)found=true;
    });
    if(found){
      setStatus('','info');
      try{
        var screen=document.getElementById('screen-academy');
        if(screen&&typeof screen.scrollTo==='function')screen.scrollTo({top:0,left:0,behavior:'auto'});
      }catch(_e){window.nxLog&&window.nxLog(_e)}
      try{window.scrollTo({top:0,left:0,behavior:'auto'});}catch(_e2){try{window.scrollTo(0,0);}catch(_e3){window.nxLog&&window.nxLog(_e3)}}
    }
    return found;
  }

  function go(screen){
    try{
      if(window.NexoraApp&&typeof window.NexoraApp.go==='function'){
        window.NexoraApp.go(screen);
        return true;
      }
    }catch(error){notify(messageOf(error));return false;}
    var button=document.querySelector('[data-action="go"][data-screen="'+screen+'"]');
    if(button){button.click();return true;}
    notify('Cette rubrique ne peut pas être ouverte.');
    return false;
  }

  function loadScriptOnce(id,path){
    return new Promise(function(resolve,reject){
      var existing=document.getElementById(id);
      if(existing){
        if(existing.dataset.loaded==='1'||window.NexoraPrimarySchoolV157)return resolve(true);
        existing.addEventListener('load',function(){resolve(true);},{once:true});
        existing.addEventListener('error',function(){reject(new Error('Fichier requis indisponible.'));},{once:true});
        return;
      }
      var script=document.createElement('script');
      script.id=id;
      script.src=path;
      script.async=true;
      script.onload=function(){script.dataset.loaded='1';resolve(true);};
      script.onerror=function(){reject(new Error('Fichier requis indisponible.'));};
      document.head.appendChild(script);
    });
  }

  function ensurePrimary(){
    if(window.NexoraPrimarySchoolV157&&typeof window.NexoraPrimarySchoolV157.open==='function')return Promise.resolve(true);
    if(primaryLoadPromise)return primaryLoadPromise;
    var loader=window.NexoraPrimarySecureLoaderV211;
    var preferred=(loader&&typeof loader.load==='function')
      ? Promise.resolve().then(function(){return loader.load();})
      : Promise.reject(new Error('Chargeur primaire indisponible.'));
    primaryLoadPromise=preferred.catch(function(){
      return loadScriptOnce('nxPrimarySchoolScriptV269','assets/js/nx-v157-primary-school-script.js');
    }).then(function(){
      if(!window.NexoraPrimarySchoolV157||typeof window.NexoraPrimarySchoolV157.open!=='function'){
        throw new Error('École primaire non initialisée.');
      }
      return true;
    }).catch(function(error){
      primaryLoadPromise=null;
      throw error;
    });
    return primaryLoadPromise;
  }

  function withAccess(context,target,label,action){
    if(currentAction)return currentAction;
    setBusy(target,true,label||'Vérification…');
    setStatus('Vérification de votre accès Nexora…','loading');
    var actionPromise=null;
    function granted(){
      if(actionPromise)return actionPromise;
      actionPromise=Promise.resolve().then(action).then(function(result){
        setStatus('Rubrique ouverte.','success');
        window.setTimeout(function(){setStatus('','info');},900);
        return result===undefined?true:result;
      }).catch(function(error){
        var message=messageOf(error);
        setStatus(message,'error');
        notify(message);
        return false;
      });
      return actionPromise;
    }

    currentAction=Promise.resolve().then(async function(){
      if(typeof window.nxRequireSubscriptionAccess!=='function')return granted();
      var decision=await window.nxRequireSubscriptionAccess(context,granted);
      if(actionPromise)return actionPromise;
      if(decision===true)return granted();
      if(decision===false){
        setStatus('Choisissez ou renouvelez votre abonnement pour ouvrir cette rubrique.','info');
        return false;
      }
      return decision;
    }).catch(function(error){
      var message=messageOf(error);
      setStatus(message,'error');
      notify(message);
      return false;
    }).finally(function(){
      setBusy(target,false,'');
      currentAction=null;
    });
    return currentAction;
  }

  function openPrimary(target){
    return withAccess('academy',target,'Ouverture du primaire…',function(){
      return ensurePrimary().then(function(){return window.NexoraPrimarySchoolV157.open();});
    });
  }


/* ===== V527.2 · contrôleurs BAC et Brevet restaurés dans le bundle Académie ===== */
(function(){
  'use strict';
  if(window.NexoraBac&&window.NexoraDixieme)return;
  function el(id){return document.getElementById(id)}
  function notify(message){try{if(window.NexoraApp&&typeof window.NexoraApp.notify==='function')return window.NexoraApp.notify(message);if(typeof window.toast==='function')window.toast(message)}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function resolver(){var r=window.NexoraAcademyContentV271;if(!r||typeof r.mountFrame!=='function')throw new Error('Chargeur officiel de l’Académie indisponible.');return r}

  function ensureBacShell(){
    var viewer=el('nxBacAcademyViewer');if(viewer)return viewer;
    viewer=document.createElement('section');viewer.id='nxBacAcademyViewer';viewer.className='nx-bac-viewer-v90';viewer.hidden=true;viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Matières BAC');
    viewer.innerHTML='<header class="nx-bac-head-v90"><button type="button" class="nx-bac-close-v90" id="nxBacCloseButton" aria-label="Retour à l’Académie Nexora">←</button><div class="nx-bac-head-copy-v90"><span>Académie Nexora</span><h2>Matières BAC — Adams BAC Guinée</h2></div><button type="button" class="nx-bac-reload-v90" id="nxBacReloadButton">Actualiser</button></header><div class="nx-bac-frame-wrap-v90"><div class="nx-bac-loader-v90" id="nxBacLoader"><div class="nx-bac-loader-inner-v90"><span class="nx-bac-spinner-v90" aria-hidden="true"></span><b>Ouverture des matières BAC…</b></div></div><iframe id="nxBacAcademyFrame" loading="eager" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads" allow="microphone; fullscreen" title="Matières BAC — Adams BAC Guinée"></iframe></div>';
    document.body.appendChild(viewer);return viewer;
  }
  var bacLastFocus=null;
  function bacLoader(visible,message){var loader=el('nxBacLoader');if(!loader)return;loader.hidden=!visible;var label=loader.querySelector('b');if(label&&message)label.textContent=message}
  function bacFrame(force){
    ensureBacShell();var frame=el('nxBacAcademyFrame');if(!frame)return Promise.reject(new Error('Cadre BAC introuvable.'));
    if(!force&&frame.dataset.loaded==='1'){bacLoader(false);return Promise.resolve(true)}
    bacLoader(true,'Ouverture des matières BAC…');
    frame.onload=function(){frame.dataset.loaded='1';bacLoader(false)};
    frame.onerror=function(){frame.dataset.loaded='';bacLoader(true,'Impossible d’ouvrir le programme BAC. Réessaie.')};
    return resolver().mountFrame(frame,'modules/bac/index.html').catch(function(error){frame.dataset.loaded='';bacLoader(true,'Le contenu BAC n’a pas pu être chargé. Ferme cette rubrique puis réessaie.');throw error});
  }
  function openBacRestored(){var viewer=ensureBacShell();bacLastFocus=document.activeElement;viewer.hidden=false;document.body.classList.add('nx-bac-open-v90');var p=bacFrame(false);var close=el('nxBacCloseButton');if(close)setTimeout(function(){try{close.focus()}catch(_e){}},30);return p}
  function closeBacRestored(){var viewer=el('nxBacAcademyViewer');if(!viewer)return;viewer.hidden=true;document.body.classList.remove('nx-bac-open-v90');if(bacLastFocus&&bacLastFocus.focus)try{bacLastFocus.focus()}catch(_e){}}

  function ensureDixiemeShell(){
    var viewer=el('nx10AcademyViewer');if(viewer)return viewer;
    viewer=document.createElement('section');viewer.id='nx10AcademyViewer';viewer.className='nx10-viewer-v91';viewer.hidden=true;viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Programme de 10ème année');
    viewer.innerHTML='<header class="nx10-head-v91"><button type="button" class="nx10-close-v91" id="nx10CloseButton" aria-label="Retour à l’Académie Nexora">←</button><div class="nx10-head-copy-v91"><span>Académie Nexora</span><h2>Brevet — cours de 10ème année et sujets BEPC</h2></div><button type="button" class="nx10-reload-v91" id="nx10ReloadButton">Actualiser</button></header><div class="nx10-frame-wrap-v91"><div class="nx10-loader-v91" id="nx10Loader"><div class="nx10-loader-inner-v91"><span class="nx10-spinner-v91" aria-hidden="true"></span><b>Ouverture des cours du Brevet…</b></div></div><iframe id="nx10AcademyFrame" loading="eager" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads" allow="microphone; fullscreen" title="Brevet — cours de 10ème année et sujets BEPC"></iframe></div>';
    document.body.appendChild(viewer);return viewer;
  }
  var tenLastFocus=null,tenPendingTarget='subjects';
  function tenLoader(visible,message){var loader=el('nx10Loader');if(!loader)return;loader.hidden=!visible;var label=loader.querySelector('b');if(label&&message)label.textContent=message}
  function navigateTen(target){var frame=el('nx10AcademyFrame');if(!frame||!frame.contentWindow)return;target=target==='brevet'?'brevet':'subjects';try{if(typeof frame.contentWindow.show==='function')frame.contentWindow.show(target);else frame.contentWindow.postMessage({type:'nexora-open-10eme',target:target},window.location.protocol==='file:'?'*':window.location.origin)}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function tenFrame(force,target){
    ensureDixiemeShell();var frame=el('nx10AcademyFrame');if(!frame)return Promise.reject(new Error('Cadre Brevet introuvable.'));
    tenPendingTarget=target==='brevet'?'brevet':'subjects';
    if(!force&&frame.dataset.loaded==='1'){tenLoader(false);navigateTen(tenPendingTarget);return Promise.resolve(true)}
    tenLoader(true,'Ouverture du programme de 10ème année…');
    frame.onload=function(){frame.dataset.loaded='1';tenLoader(false);setTimeout(function(){navigateTen(tenPendingTarget)},40)};
    frame.onerror=function(){frame.dataset.loaded='';tenLoader(true,'Impossible d’ouvrir le programme. Réessaie.')};
    return resolver().mountFrame(frame,'modules/dixieme/index.html').catch(function(error){frame.dataset.loaded='';tenLoader(true,'Le contenu Brevet n’a pas pu être chargé. Ferme cette rubrique puis réessaie.');throw error});
  }
  function openTenRestored(target){var viewer=ensureDixiemeShell();tenLastFocus=document.activeElement;viewer.hidden=false;document.body.classList.add('nx10-open-v91');var p=tenFrame(false,target);var close=el('nx10CloseButton');if(close)setTimeout(function(){try{close.focus()}catch(_e){}},30);return p}
  function closeTenRestored(){var viewer=el('nx10AcademyViewer');if(!viewer)return;viewer.hidden=true;document.body.classList.remove('nx10-open-v91');if(tenLastFocus&&tenLastFocus.focus)try{tenLastFocus.focus()}catch(_e){}}

  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target:null;if(!t)return;
    if(t.closest('#nxBacCloseButton')){e.preventDefault();closeBacRestored();return}
    if(t.closest('#nxBacReloadButton')){e.preventDefault();bacFrame(true).catch(function(err){notify(String(err&&err.message||err))});return}
    if(t.closest('#nx10CloseButton')){e.preventDefault();closeTenRestored();return}
    if(t.closest('#nx10ReloadButton')){e.preventDefault();tenFrame(true,tenPendingTarget).catch(function(err){notify(String(err&&err.message||err))});return}
  },true);
  document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;var bac=el('nxBacAcademyViewer'),ten=el('nx10AcademyViewer');if(bac&&!bac.hidden){e.preventDefault();closeBacRestored()}else if(ten&&!ten.hidden){e.preventDefault();closeTenRestored()}},true);

  window.NexoraBac={open:openBacRestored,close:closeBacRestored,reload:function(){return bacFrame(true)}};
  window.NexoraDixieme={open:openTenRestored,close:closeTenRestored,reload:function(){return tenFrame(true,tenPendingTarget)}};
})();

  function openBac(target){
    return withAccess('academy',target,'Ouverture du BAC…',function(){
      if(!window.NexoraBac||typeof window.NexoraBac.open!=='function')throw new Error('Rubrique BAC non initialisée.');
      return window.NexoraBac.open();
    });
  }

  function openBrevet(target,section){
    return withAccess('academy',target,'Ouverture du Brevet…',function(){
      if(!window.NexoraDixieme||typeof window.NexoraDixieme.open!=='function')throw new Error('Rubrique Brevet non initialisée.');
      return window.NexoraDixieme.open(section==='brevet'?'brevet':'subjects');
    });
  }

  function openOrientation(target,level){
    return withAccess('orientation',target,'Ouverture de l’Orientation…',function(){
      if(!window.NexoraOrientation)throw new Error('Orientation non initialisée.');
      if(typeof window.NexoraOrientation.openGranted==='function')return window.NexoraOrientation.openGranted(level||'apres_brevet');
      if(typeof window.NexoraOrientation.open==='function')return window.NexoraOrientation.open(level||'apres_brevet');
      throw new Error('Orientation indisponible.');
    });
  }

  function openHomework(target){
    return withAccess('academy',target,'Ouverture de Devoir…',function(){
      if(!window.NexoraHomeworkV162||typeof window.NexoraHomeworkV162.open!=='function')throw new Error('Nexora Devoirs non initialisé.');
      return window.NexoraHomeworkV162.open();
    });
  }

  function route(name,target){
    name=String(name||'');
    if(name==='pre'){
      var result=show('pre');
      window.setTimeout(function(){ensurePrimary().catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')});},80);
      return result;
    }
    if(name==='learn')return go('learn');
    if(name==='letters'){if(window.NexoraLetterGameV185&&typeof window.NexoraLetterGameV185.open==='function')return window.NexoraLetterGameV185.open();notify('La Recherche des Lettres n’est pas initialisée.');return false;}
    notify('Cette rubrique est momentanément indisponible.');
    return false;
  }

  function feature(card,origin){
    var name=String(card&&card.getAttribute('data-nx-academy-feature')||'');
    if(name==='primary')return openPrimary(origin||card);
    if(name==='bac')return openBac(origin||card);
    if(name==='brevet'){
      var button=(origin&&origin.closest&&origin.closest('[data-nx-open-10eme]'))||card.querySelector('[data-nx-open-10eme]');
      return openBrevet(origin||card,button&&button.getAttribute('data-target')||'subjects');
    }
    if(name==='orientation'){
      var orientationButton=(origin&&origin.closest&&origin.closest('[data-nx-open-orientation-v108]'))||card.querySelector('[data-nx-open-orientation-v108]');
      return openOrientation(origin||card,orientationButton&&orientationButton.getAttribute('data-orientation-level')||'apres_brevet');
    }
    if(name==='devoir')return openHomework(origin||card);
    notify('Cette rubrique ne peut pas être ouverte.');
    return false;
  }

  function bindOnce(element,key,eventName,handler){
    if(!element)return;
    var marker='nxBoundAcademy'+key;
    if(element.dataset[marker]===VERSION)return;
    element.dataset[marker]=VERSION;
    element.addEventListener(eventName,handler);
  }

  function init(){
    var r=root();
    if(!r)return false;
    r.setAttribute('data-nx-academy-controller',VERSION);

    r.querySelectorAll('[data-nx-academy-route]').forEach(function(button){
      bindOnce(button,'Route','click',function(event){
        event.preventDefault();
        route(button.getAttribute('data-nx-academy-route'),button);
      });
    });

    r.querySelectorAll('[data-nx-academy-back]').forEach(function(button){
      bindOnce(button,'Back','click',function(event){
        event.preventDefault();
        show('home');
      });
    });

    r.querySelectorAll('[data-nx-academy-feature]').forEach(function(card){
      bindOnce(card,'Feature','click',function(event){
        event.preventDefault();
        feature(card,event.target);
      });
      bindOnce(card,'FeatureKeyboard','keydown',function(event){
        if(event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();
        feature(card,event.target);
      });
    });
    return true;
  }

  function onScreenChange(event){
    var screen=event&&event.detail&&event.detail.screen;
    if(screen!=='academy')return;
    init();
    show('home');
  }

  init();
  document.addEventListener('DOMContentLoaded',init,{once:true});
  document.addEventListener('nx-screen-change',onScreenChange);

  window.NexoraAcademy={
    version:VERSION,
    init:init,
    home:function(){init();return show('home');},
    pre:function(){init();return route('pre');},
    pro:function(){init();return show('pro');},
    route:route,
    openPrimary:function(){init();return openPrimary(root());},
    openBac:function(){init();return openBac(root());},
    openBrevet:function(section){init();return openBrevet(root(),section);},
    openOrientation:function(level){init();return openOrientation(root(),level);},
    openHomework:function(){init();return openHomework(root());},
    feature:feature
  };
})();

//# sourceURL=assets/js/nexora-academy-v271.js

/* ===== inline-23 ===== */
(function(){
  'use strict';
  var viewer=document.getElementById('nxLetterGameViewerV185');
  var frame=document.getElementById('nxLetterGameFrameV185');
  if(!viewer||!frame)return;
  var isOpen=false,previousOverflow='',loading=null;
  function notify(message){
    try{if(window.NexoraApp&&typeof window.NexoraApp.notify==='function'){window.NexoraApp.notify(message);return;}}catch(_e){window.nxLog&&window.nxLog(_e)}
    try{if(typeof window.toast==='function'){window.toast(message);return;}}catch(_e2){window.nxLog&&window.nxLog(_e2)}
    var status=document.querySelector('[data-nx-academy-status]');if(status){status.hidden=false;status.textContent=message;status.setAttribute('data-state','error');}
  }
  async function openGranted(){
    if(isOpen&&frame.dataset.loaded==='1')return true;
    if(loading)return loading;
    isOpen=true;previousOverflow=document.body.style.overflow||'';
    if(viewer.parentElement!==document.body)document.body.appendChild(viewer);
    document.documentElement.classList.add('nx-letter-game-open-v186');document.body.classList.add('nx-letter-game-open-v186');viewer.hidden=false;
    var resolver=window.NexoraAcademyContentV271;
    if(!resolver||typeof resolver.mountFrame!=='function'){hideGame();notify('Chargeur officiel de l’Académie indisponible.');return false;}
    frame.onload=function(){frame.dataset.loaded='1';};
    loading=resolver.mountFrame(frame,'modules/recherche-lettres/index.html').then(function(){
      try{history.pushState({nxLetterGameV185:true},'',location.href);}catch(_err){window.nxLog&&window.nxLog(_err)}
      var closeBtn=viewer.querySelector('[data-nx-close-letter-game-v185]');if(closeBtn)setTimeout(function(){try{closeBtn.focus();}catch(_e){window.nxLog&&window.nxLog(_e)}},40);
      return true;
    }).catch(function(err){hideGame();notify(String(err&&err.message||err));return false;}).finally(function(){loading=null;});
    return loading;
  }
  function openGame(){
    if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('academy',openGranted);
    notify('Abonnement Nexora requis.');return false;
  }
  function hideGame(){
    isOpen=false;viewer.hidden=true;try{if(window.NexoraAcademyContentV271&&window.NexoraAcademyContentV271.releaseFrame)window.NexoraAcademyContentV271.releaseFrame(frame);}catch(_releaseError){window.nxLog&&window.nxLog(_releaseError)}frame.src='about:blank';frame.removeAttribute('srcdoc');frame.dataset.loaded='';
    document.documentElement.classList.remove('nx-letter-game-open-v186');document.body.classList.remove('nx-letter-game-open-v186');document.body.style.overflow=previousOverflow;
  }
  function requestClose(){if(history.state&&history.state.nxLetterGameV185){history.back();return;}hideGame();}
  document.addEventListener('click',function(event){var target=event.target&&event.target.closest?event.target:null;if(!target)return;var opener=target.closest('[data-nx-open-letter-game-v185]');if(opener){event.preventDefault();openGame();return;}if(target.closest('[data-nx-close-letter-game-v185]')){event.preventDefault();requestClose();}});
  window.addEventListener('popstate',function(){if(isOpen)hideGame();});
  document.addEventListener('keydown',function(event){if(isOpen&&event.key==='Escape')requestClose();});
  window.addEventListener('nexora:premium-revoked',hideGame);
  window.NexoraLetterGameV185={open:openGame,openGranted:openGranted,close:requestClose,isOpen:function(){return isOpen===true;}};
})();

/* ===== inline-29 ===== */
(function(){
  'use strict';
  var VERSION='V342';

  function root(){return document.querySelector('[data-nx-academy-real]');}

  function showView(name){
    var r=root();if(!r)return false;var found=false;
    r.querySelectorAll('[data-nx-academy-view]').forEach(function(panel){
      var active=panel.getAttribute('data-nx-academy-view')===name;
      panel.hidden=!active;panel.setAttribute('aria-hidden',active?'false':'true');
      if(active)found=true;
    });
    if(found){try{var s=document.getElementById('screen-academy');if(s&&s.scrollTo)s.scrollTo({top:0,left:0,behavior:'auto'});}catch(_e){window.nxLog&&window.nxLog(_e)}
      try{window.scrollTo({top:0,left:0,behavior:'auto'});}catch(_e2){window.nxLog&&window.nxLog(_e2)}}
    return found;
  }

  function notify(message){
    try{if(window.NexoraApp&&typeof window.NexoraApp.notify==='function'){window.NexoraApp.notify(message);return;}}catch(_e){window.nxLog&&window.nxLog(_e)}
    try{if(typeof window.toast==='function'){window.toast(message);return;}}catch(_e2){window.nxLog&&window.nxLog(_e2)}
    try{window.dispatchEvent(new CustomEvent('nexora-toast',{detail:{message:message}}));}catch(_e3){window.nxLog&&window.nxLog(_e3)}
  }

  /* ouvre l'ecole primaire puis selectionne directement la classe demandee */
  function openPrimaryClass(classId){
    if(!window.NexoraAcademy||typeof window.NexoraAcademy.openPrimary!=='function'){
      notify('École primaire non initialisée.');return;
    }
    Promise.resolve(window.NexoraAcademy.openPrimary()).then(function(){
      var tries=0;
      (function pick(){
        tries++;
        var target=document.querySelector('[data-nx-primary-action="class"][data-class-id="'+classId+'"]');
        if(target){try{target.click();}catch(_e){window.nxLog&&window.nxLog(_e)}return;}
        if(tries<40)window.setTimeout(pick,120);
      })();
    });
  }

  function openAdams(key,title){
    if(window.NexoraAdamsGames&&typeof window.NexoraAdamsGames.openSolo==='function'){
      window.NexoraAdamsGames.openSolo(key,title||'');return;
    }
    if(typeof window.NexoraLoadFeatureGroupV506==='function'){
      window.NexoraLoadFeatureGroupV506('adams').then(function(){
        if(window.NexoraAdamsGames&&typeof window.NexoraAdamsGames.openSolo==='function')window.NexoraAdamsGames.openSolo(key,title||'');
        else notify('Ce plateau n’est pas disponible pour le moment.');
      }).catch(function(){notify('Ce plateau n’est pas disponible pour le moment.');});
      return;
    }
    notify('Ce plateau n’est pas disponible pour le moment.');
  }

  /* la section choisie est memorisee puis transmise au module Maternelle */
  function openMaternelle(section){
    var labels={petite:'Petite section',moyenne:'Moyenne section',grande:'Grande section'};
    var label=labels[section]||'';
    window.__nxMaternelleSectionV342=section||'';
    try{if(label)localStorage.setItem('nexora-maternelle-section-v342',section);}catch(_e){window.nxLog&&window.nxLog(_e)}
    openAdams('maternelle','Jeu Adams Maternelle'+(label?' — '+label:''));
  }

  document.addEventListener('click',function(event){
    var btn=event.target&&event.target.closest?event.target.closest('[data-nx-open-v342]'):null;
    if(!btn)return;
    var action=btn.getAttribute('data-nx-open-v342')||'';
    event.preventDefault();
    event.stopPropagation();
    if(action==='view'){showView(btn.getAttribute('data-view')||'home');return;}
    if(action==='primary-class'){openPrimaryClass(btn.getAttribute('data-class-id')||'');return;}
    if(action==='seventh'){if(window.NexoraSeventhAcademyV349&&typeof window.NexoraSeventhAcademyV349.open==='function'){window.NexoraSeventhAcademyV349.open();}else notify('Cours de 7ème année non initialisés.');return;}if(action==='eighth'){if(window.NexoraEighthAcademyV351&&typeof window.NexoraEighthAcademyV351.open==='function'){window.NexoraEighthAcademyV351.open();}else notify('Cours de 8ème année non initialisés.');return;}
    if(action==='ninth'){if(window.NexoraNinthAcademyV352&&typeof window.NexoraNinthAcademyV352.open==='function'){window.NexoraNinthAcademyV352.open();}else notify('Cours de 9ème année non initialisés.');return;} if(action==='college-pending'){notify((btn.getAttribute('data-level')||'Cette classe')+' sera développée comme un véritable espace de cours après la 7ème année.');return;}
    if(action==='game'){openAdams(btn.getAttribute('data-game-key')||'',btn.getAttribute('data-game-title')||'');return;}
    if(action==='maternelle'){openMaternelle(btn.getAttribute('data-section')||'');return;}
  },true);

  document.addEventListener('keydown',function(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    var btn=event.target&&event.target.closest?event.target.closest('[data-nx-open-v342]'):null;
    if(!btn||btn.tagName==='BUTTON')return;
    event.preventDefault();
    btn.click();
  },true);
})();

/* ===== nexora-pro-open-fix-v343 ===== */
/* NEXORA V343 — les 22 modules professionnels s'ouvrent depuis l'Académie.
   Le gestionnaire officiel « open-official-course » ne réagit qu'aux boutons
   placés dans [data-learn-center] ou [data-trainer-center]. Les boutons de
   l'écran Académie sont ailleurs dans le DOM : leur clic était ignoré.
   On relaie le clic vers un bouton temporaire placé dans le bon conteneur.
   Aucune logique d'ouverture, de contenu ou d'abonnement n'est modifiée :
   c'est bien nxAcademyOpenCourse d'origine qui s'exécute, contrôle
   d'abonnement compris. */
(function(){
  'use strict';
  document.addEventListener('click',function(event){
    var target=event&&event.target;
    var btn=target&&target.closest?target.closest('.nx-pro-module-v342[data-module-id]'):null;
    if(!btn)return;
    if(btn.closest('[data-learn-center],[data-trainer-center]'))return;
    var host=document.querySelector('[data-learn-center]')||document.querySelector('[data-trainer-center]');
    if(!host)return;
    var moduleId=btn.getAttribute('data-module-id')||'';
    if(!moduleId)return;
    event.preventDefault();
    var proxy=document.createElement('button');
    proxy.type='button';
    proxy.setAttribute('data-action','open-official-course');
    proxy.setAttribute('data-module-id',moduleId);
    proxy.setAttribute('aria-hidden','true');
    proxy.tabIndex=-1;
    proxy.style.cssText='position:absolute;width:1px;height:1px;padding:0;margin:-1px;border:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
    host.appendChild(proxy);
    try{proxy.click();}
    catch(_e){window.nxLog&&window.nxLog(_e)}
    finally{if(proxy.parentNode)proxy.parentNode.removeChild(proxy);}
  },false);
})();

/* Moteur pédagogique unique : ordre des rubriques et découpage des séquences. */
(function(){
  'use strict';
  if(window.NexoraCourseLayout)return;
  function text(value){return String(value==null?'':value).trim()}
  function values(value){
    if(Array.isArray(value))return value.map(text).filter(Boolean);
    var one=text(value);return one?[one]:[];
  }
  function college(lesson,esc,actionPrefix){
    var z=lesson.sections||{},number=0,html='';
    function block(title,value,kind,cls){
      var rows=values(value);if(!rows.length)return;
      number++;
      html+='<h3><span class="nx7-section-num-v485">'+number+'</span>'+title+'</h3>';
      if(kind==='list')html+='<ul'+(cls?' class="'+cls+'"':'')+'>'+rows.map(function(row){return '<li>'+esc(row)+'</li>'}).join('')+'</ul>';
      else if(kind==='ordered')html+='<ol'+(cls?' class="'+cls+'"':'')+'>'+rows.map(function(row){return '<li>'+esc(row)+'</li>'}).join('')+'</ol>';
      else html+=rows.map(function(row){return '<p>'+esc(row)+'</p>'}).join('');
    }
    block('Objectif de la leçon',lesson.objective);
    block('Prérequis',lesson.prereq);
    block('Introduction',z.introduction);
    block('Origine ou historique',z.historique);
    block('Définition',z.definition);
    block('Cours expliqué',z.developpement);
    block('Fonctionnement',z.fonctionnement);
    block('Importance et applications',z.importance);
    block('Exemples concrets',z.exemples,'ordered');
    block('À retenir',z.retenir,'list','nx7-retain-v485');
    block("Exercices d'application",z.exercices,'ordered','nx7-exercises-v485');
    var correction=text(lesson.correction);
    if(correction){
      html+='<button type="button" class="nx-course-correction-toggle" data-'+actionPrefix+'-action="correction">Afficher la correction</button>'+
        '<div class="nx-course-correction" data-'+actionPrefix+'-correction hidden><b>Correction guidée</b><p>'+esc(correction)+'</p></div>';
    }
    if(!html){
      var fallback=text(lesson.lesson_text||lesson.course);
      html=fallback.split(/\n\s*\n/).filter(Boolean).map(function(row){return '<p>'+esc(row)+'</p>'}).join('');
    }
    return html;
  }
  function lycee(lesson,esc){
    var P='nx-lecon-v524';
    function box(title,value,cls){
      var rows=values(value);if(!rows.length)return '';
      return '<div class="'+P+'-box'+(cls?' '+P+'-'+cls:'')+'"><b>'+title+'</b><span>'+rows.map(esc).join('<br>')+'</span></div>';
    }
    var out='';
    out+=box('Objectif de la leçon',lesson.objective,'objectif');
    out+=box('Définition et repères',lesson.definition,'def');
    var plan=Array.isArray(lesson.plan)?lesson.plan.filter(function(row){return row&&text(row[0])&&text(row[1])}):[];
    if(plan.length){
      out+='<div class="'+P+'-plan"><b class="'+P+'-plan-title">Cours expliqué, point par point</b>'+plan.map(function(row,index){return '<section class="'+P+'-sec"><h5><u>'+(index+1)+'</u>'+esc(row[0])+'</h5><p>'+esc(row[1])+'</p></section>'}).join('')+'</div>';
    }else{
      out+=[lesson.p1,lesson.p2,lesson.p3].map(text).filter(Boolean).map(function(row){return '<p>'+esc(row)+'</p>'}).join('');
    }
    out+=box('Formules et outils à connaître',lesson.formules,'formul');
    out+=box('Exemple expliqué',lesson.example,'exemple');
    out+=box('Méthode de travail',lesson.method,'methode');
    out+=box('Erreurs fréquentes à éviter',lesson.pieges,'piege');
    var exercises=Array.isArray(lesson.exercices)?lesson.exercices.filter(function(item){return item&&text(item.enonce)}):[];
    if(exercises.length){
      out+='<div class="'+P+'-exos"><b class="'+P+'-plan-title">Exercices d’application ('+exercises.length+')</b>'+exercises.map(function(item,index){var correction=text(item.correction);return '<section class="'+P+'-exo"><h5><u>'+(index+1)+'</u>Énoncé</h5><p>'+esc(item.enonce)+'</p>'+(correction?'<details class="'+P+'-corr"><summary>Voir la correction détaillée</summary><p>'+esc(correction)+'</p></details>':'')+'</section>'}).join('')+'</div>';
    }else if(text(lesson.exercise)){
      out+=box("Exercice d’application",lesson.exercise,'exercice');
      out+=box('Correction guidée',lesson.correction,'correction');
    }
    out+=box('Notions essentielles',lesson.key_points,'notions');
    out+=box('Synthèse : à retenir',lesson.recap,'retenir');
    return '<div class="'+P+'">'+out+'</div>';
  }
  function sequenceHeader(index,total){
    if(index%5!==0)return '';
    var labels=['Fondations','Comprendre','Appliquer','Approfondir','Synthèse et révision'];
    var sequence=Math.floor(index/5),end=Math.min(index+5,total);
    return '<div class="nx-course-sequence"><b>Séquence '+(sequence+1)+' · '+(labels[sequence]||'Progression')+'</b><span>Leçons '+(index+1)+' à '+end+'</span></div>';
  }
  function toggleExclusive(button,article){
    var list=article&&article.parentNode,wasOpen=article&&article.classList.contains('open');
    if(!list)return;
    Array.prototype.forEach.call(list.querySelectorAll('.open'),function(openArticle){
      openArticle.classList.remove('open');
      var openButton=openArticle.querySelector('[aria-expanded]');if(openButton)openButton.setAttribute('aria-expanded','false');
    });
    if(!wasOpen){article.classList.add('open');button.setAttribute('aria-expanded','true')}
  }
  window.NexoraCourseLayout={college:college,lycee:lycee,sequenceHeader:sequenceHeader,toggleExclusive:toggleExclusive};
})();

/* ===== nexora-seventh-script-v349 ===== */
(function(){
'use strict';
var DATA=[];
/* V410 : les leçons vivent dans un fichier, téléchargé à la première ouverture. */
var NX_URL="modules/classes/7eme.json", NX_READY=false, NX_PENDING=null;
function NX_APPLY(payload){DATA.length=0;Array.prototype.push.apply(DATA,payload||[]);}
function NX_LOAD(){
  if(NX_READY) return Promise.resolve();
  if(!NX_PENDING){
    NX_PENDING=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.json==='function'?window.NexoraSecureContent.json(NX_URL):Promise.reject(new Error('Accès sécurisé aux cours indisponible.'))).then(function(payload){ NX_APPLY(payload); NX_READY=true; }).catch(function(error){
      NX_PENDING=null; throw error;
    });
  }
  return NX_PENDING;
}
function NX_FAIL(){
  try{ if(typeof window.toast==='function') window.toast('Leçons indisponibles pour le moment. Vérifiez votre connexion, puis réessayez.'); }catch(_e){window.nxLog&&window.nxLog(_e)}
}

var state={subject:null,lesson:-1,query:'',lastFocus:null};
var STORE='nexora.seventh.progress.v349';
function q(s,r){return (r||document).querySelector(s)}
function viewer(){return document.getElementById('nxSeventhViewerV349')}
function main(){return q('[data-nx7-main]',viewer())}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
function subject(id){return DATA.find(function(x){return x.id===id})||null}
function readProgress(){try{var v=JSON.parse(localStorage.getItem(STORE)||'{}');return v&&typeof v==='object'?v:{}}catch(_e){return {}}}
function writeProgress(v){try{localStorage.setItem(STORE,JSON.stringify(v))}catch(_e){window.nxLog&&window.nxLog(_e)}}
function key(s,i){return s.id+':'+i}
function isDone(s,i){return !!readProgress()[key(s,i)]}
function countDone(s){var p=readProgress(),n=0;s.lessons.forEach(function(_,i){if(p[key(s,i)])n++});return n}
function themeCount(s){var seen={},n=0;s.lessons.forEach(function(l){if(!seen[l.chapter]){seen[l.chapter]=1;n++}});return n}
function totalLessons(){return DATA.reduce(function(a,s){return a+s.lessons.length},0)}
function totalDone(){return DATA.reduce(function(a,s){return a+countDone(s)},0)}
function setHeader(text){var h=q('[data-nx7-header]',viewer());if(h)h.textContent=text||'7ème année'}
function setBack(show){var b=q('[data-nx7-action="back"]',viewer());if(b)b.hidden=!show}
function syncTheme(){var v=viewer();if(!v)return;var t=document.documentElement.getAttribute('data-theme')||document.body.getAttribute('data-theme')||'';if(t)v.setAttribute('data-theme',t);else v.removeAttribute('data-theme')}
function renderHome(){state.subject=null;state.lesson=-1;state.query='';setHeader('7ème année · Cours');setBack(false);var done=totalDone(),total=totalLessons();main().innerHTML='<section class="nx7-hero-v349"><span class="nx7-kicker-v349">Programme du collège guinéen</span><h2>7ème année — cours complets</h2><p>Chaque leçon suit la structure officielle de Nexora Académie : introduction, origine lorsque cela est pertinent, définition, développement approfondi, fonctionnement, importance, exemples concrets, points à retenir et exercices d’application.</p><div class="nx7-stats-v349"><div class="nx7-stat-v349"><b>'+DATA.length+'</b><span>matières du programme</span></div><div class="nx7-stat-v349"><b>'+total+'</b><span>leçons structurées</span></div><div class="nx7-stat-v349"><b>'+done+'</b><span>leçons terminées</span></div></div></section><div class="nx7-note-v349"><b>Lecture autonome :</b> ouvre une matière, lis chaque leçon lentement et dans l’ordre, puis marque-la comme lue avant de continuer.</div><section class="nx7-subject-grid-v349">'+DATA.map(function(s){var d=countDone(s),pct=Math.round(d*100/s.lessons.length);return '<button type="button" class="nx7-subject-v349" style="--s:'+esc(s.accent)+'" data-nx7-subject="'+esc(s.id)+'"><span class="nx7-subject-head-v349"><span class="nx7-subject-icon-v349">'+esc(s.icon)+'</span><span class="nx7-count-v349">'+s.lessons.length+' leçons · '+themeCount(s)+' thèmes</span></span><h3>'+esc(s.name)+'</h3><p>'+esc(s.intro)+'</p><span class="nx7-subject-foot-v349"><span>'+d+'/'+s.lessons.length+' terminées · '+pct+' %</span><b>Ouvrir →</b></span></button>'}).join('')+'</section>'}
function renderLessons(id){var s=subject(id);if(!s)return renderHome();state.subject=id;state.lesson=-1;setHeader('7ème année · '+s.name);setBack(true);var d=countDone(s);main().innerHTML='<section class="nx7-page-head-v349"><div><small>7ème année · '+esc(s.name)+'</small><h2>'+esc(s.name)+'</h2><p>'+esc(s.intro)+'</p></div><span class="nx7-progress-chip-v349">'+d+' / '+s.lessons.length+' terminées</span></section><label class="nx7-search-v349"><input type="search" data-nx7-search placeholder="Rechercher une leçon ou un chapitre" value="'+esc(state.query)+'" aria-label="Rechercher une leçon"></label><section class="nx7-lesson-list-v349" data-nx7-list></section>';renderLessonList(s)}
function renderLessonList(s){var list=q('[data-nx7-list]',viewer());if(!list)return;var term=String(state.query||'').trim().toLowerCase();var found=[];s.lessons.forEach(function(l,i){var hay=(l.title+' '+l.chapter+' '+(l.lesson_text||'')).toLowerCase();if(!term||hay.indexOf(term)>-1)found.push({l:l,i:i})});if(!found.length){list.innerHTML='<div class="nx7-empty-v349">Aucune leçon ne correspond à cette recherche.</div>';return}var html='',current='';found.forEach(function(x){if(x.l.chapter!==current){current=x.l.chapter;var tot=0,dn=0;s.lessons.forEach(function(z,zi){if(z.chapter===current){tot++;if(isDone(s,zi))dn++}});html+='<div class="nx7-theme-head-v349" style="--s:'+esc(s.accent)+'"><b>'+esc(current)+'</b><span>'+dn+' / '+tot+'</span></div>'}var done=isDone(s,x.i);html+='<button type="button" class="nx7-lesson-card-v349" style="--s:'+esc(s.accent)+'" data-nx7-lesson="'+x.i+'">'+'<span class="nx7-lesson-num-v349">'+(x.i+1)+'</span>'+'<span class="nx7-lesson-copy-v349"><small>'+esc(x.l.chapter)+'</small><b>'+esc(x.l.title)+'</b><span>'+esc(x.l.summary||x.l.objective||'Leçon approfondie')+'</span></span>'+'<span class="nx7-lesson-state-v349"><span>'+esc(x.l.duration)+'</span><i>'+(done?'✓':'→')+'</i></span></button>'});list.innerHTML=html}
function renderCourse(id,index){var s=subject(id),l=s&&s.lessons[index];if(!l)return renderLessons(id);state.subject=id;state.lesson=index;setHeader(s.name+' · Leçon '+(index+1));setBack(true);var done=isDone(s,index),body=window.NexoraCourseLayout.college(l,esc,'nx7');main().innerHTML='<article class="nx7-course-v349" style="--s:'+esc(s.accent)+'"><header class="nx7-course-hero-v349"><small>7ème année · '+esc(s.name)+' · Leçon '+(index+1)+'/'+s.lessons.length+'</small><span class="nx7-kicker-v349">Thème</span><h2>'+esc(l.title)+'</h2><p>'+esc(l.chapter)+'</p><div class="nx7-course-tools-v349"><span>Leçon complète · 45 à 60 min</span><button type="button" data-nx7-action="speak">🔊 Écouter la leçon</button></div></header><section class="nx7-course-text-v349">'+body+'</section><nav class="nx7-nav-v349"><button type="button" data-nx7-action="lessons">← Toutes les leçons</button>'+(index>0?'<button type="button" data-nx7-action="previous">Précédente</button>':'')+'<button type="button" data-nx7-action="complete">'+(done?'✓ Leçon lue':'Marquer comme lue')+'</button>'+(index<s.lessons.length-1?'<button type="button" class="primary" data-nx7-action="next">Suivante →</button>':'<button type="button" class="primary" data-nx7-action="subjects">Choisir une matière</button>')+'</nav></article>';try{main().scrollIntoView({block:'start'})}catch(_e){window.nxLog&&window.nxLog(_e)}}
function openGranted(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){openGranted.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var v=viewer();if(!v)return false;state.lastFocus=document.activeElement;syncTheme();v.hidden=false;document.body.classList.add('nx7-open-v349');renderHome();setTimeout(function(){var c=q('[data-nx7-action="close"]',v);if(c)c.focus()},30);return true}
function open(){var __nxArgs=arguments,__nxThis=this;function granted(){if(!NX_READY){NX_LOAD().then(function(){openGranted.apply(__nxThis,__nxArgs)},NX_FAIL);return;}return openGranted.apply(__nxThis,__nxArgs)}if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('academy',granted);return granted()}
function close(){var v=viewer();if(!v)return;try{speechSynthesis.cancel()}catch(_e){window.nxLog&&window.nxLog(_e)}v.hidden=true;document.body.classList.remove('nx7-open-v349');if(state.lastFocus&&state.lastFocus.focus)try{state.lastFocus.focus()}catch(_e2){window.nxLog&&window.nxLog(_e2)}}
function back(){if(state.lesson>=0){renderLessons(state.subject);return}if(state.subject){renderHome();return}close()}
function speak(){var s=subject(state.subject),l=s&&s.lessons[state.lesson];if(!l||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(l.lesson_text||l.course||l.title);u.lang='fr-FR';u.rate=.9;speechSynthesis.speak(u)}catch(_e){window.nxLog&&window.nxLog(_e)}}
document.addEventListener('click',function(e){var v=viewer();if(!v||v.hidden)return;var sb=e.target.closest&&e.target.closest('[data-nx7-subject]');if(sb){renderLessons(sb.getAttribute('data-nx7-subject'));return}var lb=e.target.closest&&e.target.closest('[data-nx7-lesson]');if(lb){renderCourse(state.subject,Number(lb.getAttribute('data-nx7-lesson')));return}var b=e.target.closest&&e.target.closest('[data-nx7-action]');if(!b)return;var a=b.getAttribute('data-nx7-action');if(a==='close')close();else if(a==='back')back();else if(a==='lessons')renderLessons(state.subject);else if(a==='subjects')renderHome();else if(a==='previous')renderCourse(state.subject,state.lesson-1);else if(a==='next')renderCourse(state.subject,state.lesson+1);else if(a==='speak')speak();else if(a==='correction'){var c=q('[data-nx7-correction]',v);if(c){c.hidden=!c.hidden;b.textContent=c.hidden?'Afficher le corrigé':'Masquer le corrigé'}}else if(a==='complete'){var s=subject(state.subject),p=readProgress(),k=key(s,state.lesson);p[k]=!p[k];writeProgress(p);renderCourse(state.subject,state.lesson)}},true);
document.addEventListener('input',function(e){if(e.target&&e.target.matches('[data-nx7-search]')){state.query=e.target.value||'';var s=subject(state.subject);if(s)renderLessonList(s)}},true);
document.addEventListener('keydown',function(e){var v=viewer();if(e.key==='Escape'&&v&&!v.hidden){e.preventDefault();back()}},true);
window.NexoraSeventhAcademyV349={open:open,openGranted:openGranted,close:close,version:'V486',get subjects(){return DATA.length},get lessons(){return totalLessons()}};
})();

/* ===== nexora-eighth-script-v351 ===== */
(function(){
'use strict';
var DATA=[];
/* V410 : les leçons vivent dans un fichier, téléchargé à la première ouverture. */
var NX_URL="modules/classes/8eme.json", NX_READY=false, NX_PENDING=null;
function NX_APPLY(payload){DATA.length=0;Array.prototype.push.apply(DATA,payload||[]);}
function NX_LOAD(){
  if(NX_READY) return Promise.resolve();
  if(!NX_PENDING){
    NX_PENDING=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.json==='function'?window.NexoraSecureContent.json(NX_URL):Promise.reject(new Error('Accès sécurisé aux cours indisponible.'))).then(function(payload){ NX_APPLY(payload); NX_READY=true; }).catch(function(error){
      NX_PENDING=null; throw error;
    });
  }
  return NX_PENDING;
}
function NX_FAIL(){
  try{ if(typeof window.toast==='function') window.toast('Leçons indisponibles pour le moment. Vérifiez votre connexion, puis réessayez.'); }catch(_e){window.nxLog&&window.nxLog(_e)}
}

var state={subject:null,lesson:-1,query:'',lastFocus:null};
var STORE='nexora.eighth.progress.v351';
function q(s,r){return (r||document).querySelector(s)}
function viewer(){return document.getElementById('nxEighthViewerV351')}
function main(){return q('[data-nx8-main]',viewer())}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
function subject(id){return DATA.find(function(x){return x.id===id})||null}
function readProgress(){try{var v=JSON.parse(localStorage.getItem(STORE)||'{}');return v&&typeof v==='object'?v:{}}catch(_e){return {}}}
function writeProgress(v){try{localStorage.setItem(STORE,JSON.stringify(v))}catch(_e){window.nxLog&&window.nxLog(_e)}}
function key(s,i){return s.id+':'+i}
function isDone(s,i){return !!readProgress()[key(s,i)]}
function countDone(s){var p=readProgress(),n=0;s.lessons.forEach(function(_,i){if(p[key(s,i)])n++});return n}
function themeCount(s){var seen={},n=0;s.lessons.forEach(function(l){if(!seen[l.chapter]){seen[l.chapter]=1;n++}});return n}
function totalLessons(){return DATA.reduce(function(a,s){return a+s.lessons.length},0)}
function totalDone(){return DATA.reduce(function(a,s){return a+countDone(s)},0)}
function setHeader(text){var h=q('[data-nx8-header]',viewer());if(h)h.textContent=text||'8ème année'}
function setBack(show){var b=q('[data-nx8-action="back"]',viewer());if(b)b.hidden=!show}
function syncTheme(){var v=viewer();if(!v)return;var t=document.documentElement.getAttribute('data-theme')||document.body.getAttribute('data-theme')||'';if(t)v.setAttribute('data-theme',t);else v.removeAttribute('data-theme')}
function renderHome(){state.subject=null;state.lesson=-1;state.query='';setHeader('8ème année · Cours');setBack(false);var done=totalDone(),total=totalLessons();main().innerHTML='<section class="nx7-hero-v349"><span class="nx7-kicker-v349">Programme du collège guinéen</span><h2>8ème année — véritables leçons</h2><p>Chaque thème est présenté par une introduction propre au sujet, une définition précise, un développement approfondi, le fonctionnement de la notion, son importance, des exemples concrets, les idées essentielles et des exercices d’application.</p><div class="nx7-stats-v349"><div class="nx7-stat-v349"><b>'+DATA.length+'</b><span>matières du programme</span></div><div class="nx7-stat-v349"><b>'+total+'</b><span>leçons complètes</span></div><div class="nx7-stat-v349"><b>'+done+'</b><span>leçons terminées</span></div></div></section><div class="nx7-note-v349"><b>Lecture progressive :</b> choisis une matière, ouvre une leçon, lis chaque partie dans l’ordre puis réponds aux questions d’application.</div><section class="nx7-subject-grid-v349">'+DATA.map(function(s){var d=countDone(s),pct=Math.round(d*100/s.lessons.length);return '<button type="button" class="nx7-subject-v349" style="--s:'+esc(s.accent)+'" data-nx8-subject="'+esc(s.id)+'"><span class="nx7-subject-head-v349"><span class="nx7-subject-icon-v349">'+esc(s.icon)+'</span><span class="nx7-count-v349">'+s.lessons.length+' leçons · '+themeCount(s)+' thèmes</span></span><h3>'+esc(s.name)+'</h3><p>'+esc(s.intro)+'</p><span class="nx7-subject-foot-v349"><span>'+d+'/'+s.lessons.length+' terminées · '+pct+' %</span><b>Ouvrir →</b></span></button>'}).join('')+'</section>'}
function renderLessons(id){var s=subject(id);if(!s)return renderHome();state.subject=id;state.lesson=-1;setHeader('8ème année · '+s.name);setBack(true);var d=countDone(s);main().innerHTML='<section class="nx7-page-head-v349"><div><small>8ème année · '+esc(s.name)+'</small><h2>'+esc(s.name)+'</h2><p>'+esc(s.intro)+'</p></div><span class="nx7-progress-chip-v349">'+d+' / '+s.lessons.length+' terminées</span></section><label class="nx7-search-v349"><input type="search" data-nx8-search placeholder="Rechercher une leçon ou un chapitre" value="'+esc(state.query)+'" aria-label="Rechercher une leçon"></label><section class="nx7-lesson-list-v349" data-nx8-list></section>';renderLessonList(s)}
function renderLessonList(s){var list=q('[data-nx8-list]',viewer());if(!list)return;var term=String(state.query||'').trim().toLowerCase();var found=[];s.lessons.forEach(function(l,i){var hay=(l.title+' '+l.chapter+' '+l.objective).toLowerCase();if(!term||hay.indexOf(term)>-1)found.push({l:l,i:i})});if(!found.length){list.innerHTML='<div class="nx7-empty-v349">Aucune leçon ne correspond à cette recherche.</div>';return}var html='',current='';found.forEach(function(x){if(x.l.chapter!==current){current=x.l.chapter;var tot=0,dn=0;s.lessons.forEach(function(z,zi){if(z.chapter===current){tot++;if(isDone(s,zi))dn++}});html+='<div class="nx7-theme-head-v349" style="--s:'+esc(s.accent)+'"><b>'+esc(current)+'</b><span>'+dn+' / '+tot+'</span></div>'}var done=isDone(s,x.i);html+='<button type="button" class="nx7-lesson-card-v349" style="--s:'+esc(s.accent)+'" data-nx8-lesson="'+x.i+'">'+'<span class="nx7-lesson-num-v349">'+(x.i+1)+'</span>'+'<span class="nx7-lesson-copy-v349"><small>'+esc(x.l.chapter)+'</small><b>'+esc(x.l.title)+'</b><span>'+esc(x.l.objective)+'</span></span>'+'<span class="nx7-lesson-state-v349"><span>'+esc(x.l.duration)+'</span><i>'+(done?'✓':'→')+'</i></span></button>'});list.innerHTML=html}
function renderCourse(id,index){var s=subject(id),l=s&&s.lessons[index];if(!l)return renderLessons(id);state.subject=id;state.lesson=index;setHeader(s.name+' · Leçon '+(index+1));setBack(true);var done=isDone(s,index),body=window.NexoraCourseLayout.college(l,esc,'nx8');main().innerHTML='<article class="nx7-course-v349" style="--s:'+esc(s.accent)+'"><header class="nx7-course-hero-v349"><small>8ème année · '+esc(s.name)+' · Leçon '+(index+1)+'/'+s.lessons.length+'</small><span class="nx7-kicker-v349">Thème</span><h2>'+esc(l.title)+'</h2><p>'+esc(l.chapter)+'</p><div class="nx7-course-tools-v349"><span>Leçon complète · 55 à 70 min</span><button type="button" data-nx8-action="speak">🔊 Écouter la leçon</button></div></header><section class="nx7-course-text-v349">'+body+'</section><nav class="nx7-nav-v349"><button type="button" data-nx8-action="lessons">← Toutes les leçons</button>'+(index>0?'<button type="button" data-nx8-action="previous">Précédente</button>':'')+'<button type="button" data-nx8-action="complete">'+(done?'✓ Leçon lue':'Marquer comme lue')+'</button>'+(index<s.lessons.length-1?'<button type="button" class="primary" data-nx8-action="next">Suivante →</button>':'<button type="button" class="primary" data-nx8-action="subjects">Choisir une matière</button>')+'</nav></article>';try{main().scrollIntoView({block:'start'})}catch(_e){window.nxLog&&window.nxLog(_e)}}
function openGranted(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){openGranted.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var v=viewer();if(!v)return false;state.lastFocus=document.activeElement;syncTheme();v.hidden=false;document.body.classList.add('nx7-open-v349');renderHome();setTimeout(function(){var c=q('[data-nx8-action="close"]',v);if(c)c.focus()},30);return true}
function open(){var __nxArgs=arguments,__nxThis=this;function granted(){if(!NX_READY){NX_LOAD().then(function(){openGranted.apply(__nxThis,__nxArgs)},NX_FAIL);return;}return openGranted.apply(__nxThis,__nxArgs)}if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('academy',granted);return granted()}
function close(){var v=viewer();if(!v)return;try{speechSynthesis.cancel()}catch(_e){window.nxLog&&window.nxLog(_e)}v.hidden=true;document.body.classList.remove('nx7-open-v349');if(state.lastFocus&&state.lastFocus.focus)try{state.lastFocus.focus()}catch(_e2){window.nxLog&&window.nxLog(_e2)}}
function back(){if(state.lesson>=0){renderLessons(state.subject);return}if(state.subject){renderHome();return}close()}
function speak(){var s=subject(state.subject),l=s&&s.lessons[state.lesson];if(!l||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(l.lesson_text||l.course||l.title);u.lang='fr-FR';u.rate=.9;speechSynthesis.speak(u)}catch(_e){window.nxLog&&window.nxLog(_e)}}
document.addEventListener('click',function(e){var v=viewer();if(!v||v.hidden)return;var sb=e.target.closest&&e.target.closest('[data-nx8-subject]');if(sb){renderLessons(sb.getAttribute('data-nx8-subject'));return}var lb=e.target.closest&&e.target.closest('[data-nx8-lesson]');if(lb){renderCourse(state.subject,Number(lb.getAttribute('data-nx8-lesson')));return}var b=e.target.closest&&e.target.closest('[data-nx8-action]');if(!b)return;var a=b.getAttribute('data-nx8-action');if(a==='close')close();else if(a==='back')back();else if(a==='lessons')renderLessons(state.subject);else if(a==='subjects')renderHome();else if(a==='previous')renderCourse(state.subject,state.lesson-1);else if(a==='next')renderCourse(state.subject,state.lesson+1);else if(a==='speak')speak();else if(a==='correction'){var c=q('[data-nx8-correction]',v);if(c){c.hidden=!c.hidden;b.textContent=c.hidden?'Afficher le corrigé':'Masquer le corrigé'}}else if(a==='complete'){var s=subject(state.subject),p=readProgress(),k=key(s,state.lesson);p[k]=!p[k];writeProgress(p);renderCourse(state.subject,state.lesson)}},true);
document.addEventListener('input',function(e){if(e.target&&e.target.matches('[data-nx8-search]')){state.query=e.target.value||'';var s=subject(state.subject);if(s)renderLessonList(s)}},true);
document.addEventListener('keydown',function(e){var v=viewer();if(e.key==='Escape'&&v&&!v.hidden){e.preventDefault();back()}},true);
window.NexoraEighthAcademyV351={open:open,openGranted:openGranted,close:close,version:'V488',get subjects(){return DATA.length},get lessons(){return totalLessons()}};
})();

/* ===== nexora-ninth-script-v352 ===== */
(function(){
'use strict';
var DATA=[];
/* V410 : les leçons vivent dans un fichier, téléchargé à la première ouverture. */
var NX_URL="modules/classes/9eme.json", NX_READY=false, NX_PENDING=null;
function NX_APPLY(payload){DATA.length=0;Array.prototype.push.apply(DATA,payload||[]);}
function NX_LOAD(){
  if(NX_READY) return Promise.resolve();
  if(!NX_PENDING){
    NX_PENDING=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.json==='function'?window.NexoraSecureContent.json(NX_URL):Promise.reject(new Error('Accès sécurisé aux cours indisponible.'))).then(function(payload){ NX_APPLY(payload); NX_READY=true; }).catch(function(error){
      NX_PENDING=null; throw error;
    });
  }
  return NX_PENDING;
}
function NX_FAIL(){
  try{ if(typeof window.toast==='function') window.toast('Leçons indisponibles pour le moment. Vérifiez votre connexion, puis réessayez.'); }catch(_e){window.nxLog&&window.nxLog(_e)}
}

var state={subject:null,lesson:-1,query:'',lastFocus:null};
var STORE='nexora.ninth.progress.v352';
function q(s,r){return (r||document).querySelector(s)}
function viewer(){return document.getElementById('nxNinthViewerV352')}
function main(){return q('[data-nx9-main]',viewer())}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
function subject(id){return DATA.find(function(x){return x.id===id})||null}
function readProgress(){try{var v=JSON.parse(localStorage.getItem(STORE)||'{}');return v&&typeof v==='object'?v:{}}catch(_e){return {}}}
function writeProgress(v){try{localStorage.setItem(STORE,JSON.stringify(v))}catch(_e){window.nxLog&&window.nxLog(_e)}}
function key(s,i){return s.id+':'+i}
function isDone(s,i){return !!readProgress()[key(s,i)]}
function countDone(s){var p=readProgress(),n=0;s.lessons.forEach(function(_,i){if(p[key(s,i)])n++});return n}
function themeCount(s){var seen={},n=0;s.lessons.forEach(function(l){if(!seen[l.chapter]){seen[l.chapter]=1;n++}});return n}
function totalLessons(){return DATA.reduce(function(a,s){return a+s.lessons.length},0)}
function totalDone(){return DATA.reduce(function(a,s){return a+countDone(s)},0)}
function setHeader(text){var h=q('[data-nx9-header]',viewer());if(h)h.textContent=text||'9ème année'}
function setBack(show){var b=q('[data-nx9-action="back"]',viewer());if(b)b.hidden=!show}
function syncTheme(){var v=viewer();if(!v)return;var t=document.documentElement.getAttribute('data-theme')||document.body.getAttribute('data-theme')||'';if(t)v.setAttribute('data-theme',t);else v.removeAttribute('data-theme')}
function renderHome(){state.subject=null;state.lesson=-1;state.query='';setHeader('9ème année · Cours');setBack(false);var done=totalDone(),total=totalLessons();main().innerHTML='<section class="nx7-hero-v349"><span class="nx7-kicker-v349">Programme du collège guinéen</span><h2>9ème année — véritables leçons</h2><p>Chaque thème est présenté comme un cours complet : introduction spécifique, définition, développement, fonctionnement, importance, exemples concrets, points à retenir et exercices d’application.</p><div class="nx7-stats-v349"><div class="nx7-stat-v349"><b>'+DATA.length+'</b><span>matières du programme</span></div><div class="nx7-stat-v349"><b>'+total+'</b><span>leçons complètes</span></div><div class="nx7-stat-v349"><b>'+done+'</b><span>leçons terminées</span></div></div></section><div class="nx7-note-v349"><b>Lecture autonome :</b> avance dans l’ordre des leçons, lis chaque partie attentivement, observe les exemples puis réponds aux exercices avant de poursuivre.</div><section class="nx7-subject-grid-v349">'+DATA.map(function(s){var d=countDone(s),pct=Math.round(d*100/s.lessons.length);return '<button type="button" class="nx7-subject-v349" style="--s:'+esc(s.accent)+'" data-nx9-subject="'+esc(s.id)+'"><span class="nx7-subject-head-v349"><span class="nx7-subject-icon-v349">'+esc(s.icon)+'</span><span class="nx7-count-v349">'+s.lessons.length+' leçons · '+themeCount(s)+' thèmes</span></span><h3>'+esc(s.name)+'</h3><p>'+esc(s.intro)+'</p><span class="nx7-subject-foot-v349"><span>'+d+'/'+s.lessons.length+' terminées · '+pct+' %</span><b>Ouvrir →</b></span></button>'}).join('')+'</section>'}
function renderLessons(id){var s=subject(id);if(!s)return renderHome();state.subject=id;state.lesson=-1;setHeader('9ème année · '+s.name);setBack(true);var d=countDone(s);main().innerHTML='<section class="nx7-page-head-v349"><div><small>9ème année · '+esc(s.name)+'</small><h2>'+esc(s.name)+'</h2><p>'+esc(s.intro)+'</p></div><span class="nx7-progress-chip-v349">'+d+' / '+s.lessons.length+' terminées</span></section><label class="nx7-search-v349"><input type="search" data-nx9-search placeholder="Rechercher une leçon ou un chapitre" value="'+esc(state.query)+'" aria-label="Rechercher une leçon"></label><section class="nx7-lesson-list-v349" data-nx9-list></section>';renderLessonList(s)}
function renderLessonList(s){var list=q('[data-nx9-list]',viewer());if(!list)return;var term=String(state.query||'').trim().toLowerCase();var found=[];s.lessons.forEach(function(l,i){var hay=(l.title+' '+l.chapter+' '+l.objective).toLowerCase();if(!term||hay.indexOf(term)>-1)found.push({l:l,i:i})});if(!found.length){list.innerHTML='<div class="nx7-empty-v349">Aucune leçon ne correspond à cette recherche.</div>';return}var html='',current='';found.forEach(function(x){if(x.l.chapter!==current){current=x.l.chapter;var tot=0,dn=0;s.lessons.forEach(function(z,zi){if(z.chapter===current){tot++;if(isDone(s,zi))dn++}});html+='<div class="nx7-theme-head-v349" style="--s:'+esc(s.accent)+'"><b>'+esc(current)+'</b><span>'+dn+' / '+tot+'</span></div>'}var done=isDone(s,x.i);html+='<button type="button" class="nx7-lesson-card-v349" style="--s:'+esc(s.accent)+'" data-nx9-lesson="'+x.i+'">'+'<span class="nx7-lesson-num-v349">'+(x.i+1)+'</span>'+'<span class="nx7-lesson-copy-v349"><small>'+esc(x.l.chapter)+'</small><b>'+esc(x.l.title)+'</b><span>'+esc(x.l.objective)+'</span></span>'+'<span class="nx7-lesson-state-v349"><span>'+esc(x.l.duration)+'</span><i>'+(done?'✓':'→')+'</i></span></button>'});list.innerHTML=html}
function renderCourse(id,index){var s=subject(id),l=s&&s.lessons[index];if(!l)return renderLessons(id);state.subject=id;state.lesson=index;setHeader(s.name+' · Leçon '+(index+1));setBack(true);var done=isDone(s,index),body=window.NexoraCourseLayout.college(l,esc,'nx9');main().innerHTML='<article class="nx7-course-v349" style="--s:'+esc(s.accent)+'"><header class="nx7-course-hero-v349"><small>9ème année · '+esc(s.name)+' · Leçon '+(index+1)+'/'+s.lessons.length+'</small><span class="nx7-kicker-v349">Thème</span><h2>'+esc(l.title)+'</h2><p>'+esc(l.chapter)+'</p><div class="nx7-course-tools-v349"><span>Leçon complète · 55 à 75 min</span><button type="button" data-nx9-action="speak">🔊 Écouter la leçon</button></div></header><section class="nx7-course-text-v349">'+body+'</section><nav class="nx7-nav-v349"><button type="button" data-nx9-action="lessons">← Toutes les leçons</button>'+(index>0?'<button type="button" data-nx9-action="previous">Précédente</button>':'')+'<button type="button" data-nx9-action="complete">'+(done?'✓ Leçon lue':'Marquer comme lue')+'</button>'+(index<s.lessons.length-1?'<button type="button" class="primary" data-nx9-action="next">Suivante →</button>':'<button type="button" class="primary" data-nx9-action="subjects">Choisir une matière</button>')+'</nav></article>';try{main().scrollIntoView({block:'start'})}catch(_e){window.nxLog&&window.nxLog(_e)}}
function openGranted(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){openGranted.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var v=viewer();if(!v)return false;state.lastFocus=document.activeElement;syncTheme();v.hidden=false;document.body.classList.add('nx7-open-v349');renderHome();setTimeout(function(){var c=q('[data-nx9-action="close"]',v);if(c)c.focus()},30);return true}
function open(){var __nxArgs=arguments,__nxThis=this;function granted(){if(!NX_READY){NX_LOAD().then(function(){openGranted.apply(__nxThis,__nxArgs)},NX_FAIL);return;}return openGranted.apply(__nxThis,__nxArgs)}if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('academy',granted);return granted()}
function close(){var v=viewer();if(!v)return;try{speechSynthesis.cancel()}catch(_e){window.nxLog&&window.nxLog(_e)}v.hidden=true;document.body.classList.remove('nx7-open-v349');if(state.lastFocus&&state.lastFocus.focus)try{state.lastFocus.focus()}catch(_e2){window.nxLog&&window.nxLog(_e2)}}
function back(){if(state.lesson>=0){renderLessons(state.subject);return}if(state.subject){renderHome();return}close()}
function speak(){var s=subject(state.subject),l=s&&s.lessons[state.lesson];if(!l||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(l.lesson_text||l.course||l.title);u.lang='fr-FR';u.rate=.9;speechSynthesis.speak(u)}catch(_e){window.nxLog&&window.nxLog(_e)}}
document.addEventListener('click',function(e){var v=viewer();if(!v||v.hidden)return;var sb=e.target.closest&&e.target.closest('[data-nx9-subject]');if(sb){renderLessons(sb.getAttribute('data-nx9-subject'));return}var lb=e.target.closest&&e.target.closest('[data-nx9-lesson]');if(lb){renderCourse(state.subject,Number(lb.getAttribute('data-nx9-lesson')));return}var b=e.target.closest&&e.target.closest('[data-nx9-action]');if(!b)return;var a=b.getAttribute('data-nx9-action');if(a==='close')close();else if(a==='back')back();else if(a==='lessons')renderLessons(state.subject);else if(a==='subjects')renderHome();else if(a==='previous')renderCourse(state.subject,state.lesson-1);else if(a==='next')renderCourse(state.subject,state.lesson+1);else if(a==='speak')speak();else if(a==='correction'){var c=q('[data-nx9-correction]',v);if(c){c.hidden=!c.hidden;b.textContent=c.hidden?'Afficher le corrigé':'Masquer le corrigé'}}else if(a==='complete'){var s=subject(state.subject),p=readProgress(),k=key(s,state.lesson);p[k]=!p[k];writeProgress(p);renderCourse(state.subject,state.lesson)}},true);
document.addEventListener('input',function(e){if(e.target&&e.target.matches('[data-nx9-search]')){state.query=e.target.value||'';var s=subject(state.subject);if(s)renderLessonList(s)}},true);
document.addEventListener('keydown',function(e){var v=viewer();if(e.key==='Escape'&&v&&!v.hidden){e.preventDefault();back()}},true);
window.NexoraNinthAcademyV352={open:open,openGranted:openGranted,close:close,version:'V352',get subjects(){return DATA.length},get lessons(){return totalLessons()}};
})();

/* ===== nexora-premium-library-v505.1 ===== */
(function(){
  'use strict';
  if(window.NexoraPremiumLibraryV506)return;
  var memory=Object.create(null),pending=Object.create(null),memoryUser='',authBound=false;var NX_PREMIUM_TIMEOUT_MS=12000;
  function fail(message){var e=new Error(message);e.code='NEXORA_PREMIUM_LIBRARY';return e;}
  function clear(){
    memory=Object.create(null);pending=Object.create(null);memoryUser='';
    try{window.dispatchEvent(new CustomEvent('nexora:premium-library-cleared'));}catch(_e){}
    try{var locked=document.querySelector('#screen-subjects.active,#screen-novels.active');if(locked&&window.NexoraApp&&typeof window.NexoraApp.go==='function')window.NexoraApp.go('student-work-feed');}catch(_e2){}
  }
  function bindAuth(client){
    if(authBound||!client||!client.auth||typeof client.auth.onAuthStateChange!=='function')return;
    authBound=true;
    client.auth.onAuthStateChange(function(event,nextSession){
      var nextId=nextSession&&nextSession.user&&String(nextSession.user.id||'');
      if(event==='SIGNED_OUT'||event==='USER_DELETED'||(memoryUser&&nextId&&nextId!==memoryUser))clear();
    });
  }
  async function session(){
    var app=window.NexoraApp||{};
    var client=null;
    if(typeof app.ensureSupabaseClientReady==='function')client=await app.ensureSupabaseClientReady();
    else if(typeof app.getSupabaseClient==='function')client=app.getSupabaseClient();
    if(!client||!client.auth)throw fail('Connexion Nexora obligatoire.');
    bindAuth(client);
    var result=await client.auth.getSession();
    var current=result&&result.data&&result.data.session;
    if(!current||!current.access_token||!current.user){clear();throw fail('Session Nexora expirée. Reconnecte-toi.');}
    var uid=String(current.user.id||'');
    if(memoryUser&&uid!==memoryUser)clear();
    memoryUser=uid;
    return current;
  }
  async function load(kind){
    kind=String(kind||'');
    if(kind!=='novels'&&kind!=='subjects')throw fail('Rubrique premium inconnue.');
    if(typeof navigator!=='undefined'&&navigator.onLine===false)throw fail('Connexion Internet nécessaire pour ouvrir cette rubrique.');
    var current=await session();
    if(memory[kind])return memory[kind];
    if(pending[kind])return pending[kind];
    pending[kind]=(async function(){
      var controller=typeof AbortController!=='undefined'?new AbortController():null;var timer=controller?setTimeout(function(){try{controller.abort();}catch(_e){}},NX_PREMIUM_TIMEOUT_MS):null;var response;try{response=await fetch('/api/premium-library',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Authorization':'Bearer '+current.access_token},body:JSON.stringify({kind:kind}),signal:controller?controller.signal:undefined});}finally{if(timer)clearTimeout(timer);}
      var data={};try{data=await response.json();}catch(_e){}
      if(!response.ok||data.success!==true||!Array.isArray(data.items))throw fail(data.message||'Accès premium refusé.');
      memory[kind]=data.items;return memory[kind];
    })();
    try{return await pending[kind];}finally{delete pending[kind];}
  }
  window.addEventListener('offline',function(){/* aucune copie persistante : la mémoire vive reste seulement jusqu'au rechargement */});
  window.addEventListener('nexora:premium-revoked',clear);
  try{document.addEventListener('nexora:auth-signed-out',clear);}catch(_e){}
  window.NexoraPremiumLibraryV506={load:load,clear:clear,has:function(kind){return !!memory[String(kind||'')];}};window.NexoraPremiumLibraryV5051=window.NexoraPremiumLibraryV506;
})();

/* ===== nexora-romans-v353-script ===== */
(function(){
  'use strict';
  var VERSION='V364';
  var STORAGE_KEY='nexora.romans.comments.v353';
  var TABLE='roman_comments';
  var PHOTO_BUCKET='roman-comment-photos';
  var MAX_PHOTO_BYTES=3*1024*1024;
  var novels=[];
  var NX_ROMANS_DATA_READY=false;
  var NX_ROMANS_DATA_PROMISE=null;
  async function ensureRomansData(){
    if(NX_ROMANS_DATA_READY&&novels.length)return novels;
    if(NX_ROMANS_DATA_PROMISE)return NX_ROMANS_DATA_PROMISE;
    NX_ROMANS_DATA_PROMISE=(async function(){
      if(!window.NexoraPremiumLibraryV506||typeof window.NexoraPremiumLibraryV506.load!=='function')throw new Error('Service sécurisé des romans indisponible.');
      var payload=await window.NexoraPremiumLibraryV506.load('novels');
      if(!Array.isArray(payload)||!payload.length)throw new Error('Romans premium indisponibles.');
      novels=payload;NX_ROMANS_DATA_READY=true;return novels;
    })();
    try{return await NX_ROMANS_DATA_PROMISE;}finally{NX_ROMANS_DATA_PROMISE=null;}
  }
  window.addEventListener('nexora:premium-library-cleared',function(){novels=[];NX_ROMANS_DATA_READY=false;NX_ROMANS_DATA_PROMISE=null;});

  var state={level:'11e',category:'all',query:'',open:{},composeOpen:{},drafts:{},saveTimers:{},shared:{},loading:{},errors:{},statusTimers:{},replyTargets:{},replyDrafts:{},commentPhotos:{},replyPhotos:{},user:null,channel:null,totalShared:0,cardWatcher:null};
  var levels=[{id:'11e',label:'11ème année',short:'11e',count:6},{id:'12e',label:'12ème année',short:'12e',count:6},{id:'terminale',label:'Terminale',short:'Tle',count:6}];
  var categories=[{id:'all',label:'Tous les romans'},{id:'africaine',label:'Littérature africaine'},{id:'francaise',label:'Littérature française'}];
  function root(){return document.querySelector('[data-nx-romans-app-v353]');}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
  function readDrafts(){try{var raw=localStorage.getItem(STORAGE_KEY);var data=raw?JSON.parse(raw):{};return data&&typeof data==='object'?data:{};}catch(_e){return {};}}
  function writeDrafts(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.drafts));return true;}catch(_e){return false;}}
  function initials(name){var p=String(name||'Élève Nexora').trim().split(/\s+/).filter(Boolean);return ((p[0]||'E').charAt(0)+(p.length>1?p[p.length-1].charAt(0):'')).toUpperCase();}
  function formatDate(value){try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch(_e){return String(value||'');}}
  function client(){try{if(window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function')return window.NexoraApp.getSupabaseClient();}catch(_e){window.nxLog&&window.nxLog(_e)}return null;}
  function ensureClient(){try{if(window.NexoraApp&&typeof window.NexoraApp.ensureSupabaseClientReady==='function')return window.NexoraApp.ensureSupabaseClientReady();}catch(_e){window.nxLog&&window.nxLog(_e)}return Promise.resolve(client());}
  async function identity(c){if(state.user)return state.user;if(!c||!c.auth)return null;try{var tools=window.NexoraReliablePublicationV373;var u=tools?await tools.sessionUser(c):null;if(!u)return null;var m=u.user_metadata||{};var mail=String(u.email||'');var name=String(m.full_name||m.name||m.display_name||mail.split('@')[0]||'Élève Nexora').replace(/[._-]+/g,' ').trim();state.user={id:String(u.id),name:name||'Élève Nexora'};return state.user;}catch(err){if(window.NexoraReliablePublicationV373&&window.NexoraReliablePublicationV373.isNetworkError(err))throw err;return null;}}
  function photoRecord(map,key){return map&&map[key]||null;}
  function clearPhotoRecord(map,key){var rec=map&&map[key];if(rec&&rec.preview&&String(rec.preview).indexOf('blob:')===0){try{URL.revokeObjectURL(rec.preview);}catch(_e){window.nxLog&&window.nxLog(_e)}}if(map)delete map[key];}
  function validatePhoto(file){if(!file)return '';var type=String(file.type||'').toLowerCase();if(['image/jpeg','image/png','image/webp'].indexOf(type)<0)return 'Choisis une image JPG, PNG ou WEBP.';if(Number(file.size||0)>MAX_PHOTO_BYTES)return 'La photo ne doit pas dépasser 3 Mo.';return '';}
  function readPhotoHeader(file){var part=file&&file.slice?file.slice(0,12):file;if(part&&typeof part.arrayBuffer==='function')return part.arrayBuffer().then(function(buffer){return new Uint8Array(buffer)});return new Promise(function(resolve,reject){try{var reader=new FileReader();reader.onload=function(){resolve(new Uint8Array(reader.result||new ArrayBuffer(0)))};reader.onerror=function(){reject(new Error('Lecture de sécurité de la photo impossible.'))};reader.readAsArrayBuffer(part)}catch(err){reject(err)}})}
  function photoAscii(bytes,start,text){if(!bytes||bytes.length<start+text.length)return false;for(var i=0;i<text.length;i++)if(bytes[start+i]!==text.charCodeAt(i))return false;return true;}
  async function validatePhotoContent(file){var bytes=await readPhotoHeader(file),type=String(file&&file.type||'').toLowerCase(),valid=type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/png'?bytes[0]===137&&photoAscii(bytes,1,'PNG')&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10:type==='image/webp'?photoAscii(bytes,0,'RIFF')&&photoAscii(bytes,8,'WEBP'):false;if(!valid)throw new Error('Le contenu réel de la photo ne correspond pas au format annoncé.');return true;}
  function setPhotoRecord(map,key,file){var error=validatePhoto(file);if(error)return {ok:false,error:error};clearPhotoRecord(map,key);var preview='';try{preview=URL.createObjectURL(file);}catch(_e){window.nxLog&&window.nxLog(_e)}map[key]={file:file,preview:preview,name:String(file.name||'photo')};return {ok:true};}
  function avatarMarkup(row,label){row=row||{};var name=String(row.author_name||label||'Élève Nexora');return '<span class="nx-comment-avatar-v356" aria-label="Profil de '+esc(name)+'">'+esc(initials(name))+'</span>';}
  function publicationPhotoMarkup(row,name){row=row||{};var url=String(row.photo_url||'').trim();if(!url)return '';return '<figure class="nx-comment-media-v359"><img src="'+esc(url)+'" alt="Photo publiée par '+esc(name||row.author_name||'un élève')+'" loading="lazy" referrerpolicy="no-referrer"><figcaption>Photo jointe à ce commentaire</figcaption></figure>';}
  function selectedPhotoMarkup(rec,label,kind,key,novelId){if(!rec||!rec.preview)return '';return '<div class="nx-comment-photo-preview-v358"><div class="nx-comment-photo-preview-head-v359"><b>'+esc(label||'Photo sélectionnée')+' · aperçu de la publication</b><button type="button" class="nx-comment-photo-remove-v358" data-nx-photo-remove-v358="'+esc(kind)+'" data-nx-photo-key-v358="'+esc(key)+'" data-nx-comment-novel-v358="'+esc(novelId||'')+'" aria-label="Retirer la photo">×</button></div><div class="nx-comment-photo-preview-media-v359"><img src="'+esc(rec.preview)+'" alt="Aperçu de la photo en grand"></div></div>';}
  function setComposeToggle(button,open){if(!button)return;button.setAttribute('aria-expanded',open?'true':'false');var label=button.querySelector('[data-nx-toggle-label-v360]');var hint=button.querySelector('[data-nx-toggle-hint-v360]');if(label)label.textContent=open?'Fermer l’espace de commentaire':'Publier un commentaire sur ce livre';if(hint)hint.textContent=open?'La zone de commentaire est ouverte juste en dessous.':'Écris ton avis et ajoute une photo si tu le souhaites.';}
  function photoExtension(file){var type=String(file&&file.type||'').toLowerCase();if(type==='image/png')return 'png';if(type==='image/webp')return 'webp';return 'jpg';}
  function safePathPart(value){return String(value||'photo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'photo';}
  async function uploadCommentPhoto(c,user,file,novelId,parentId){if(!file)return {url:'',path:''};var error=validatePhoto(file);if(error)throw new Error(error);await validatePhotoContent(file);if(!c.storage||typeof c.storage.from!=='function')throw new Error('Le stockage des photos est indisponible.');var path=String(user.id)+'/'+safePathPart(novelId)+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,10)+(parentId?'-reply':'')+'.'+photoExtension(file);var upload=await c.storage.from(PHOTO_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(upload.error)throw upload.error;var publicData=c.storage.from(PHOTO_BUCKET).getPublicUrl(path);var url=publicData&&publicData.data&&publicData.data.publicUrl||'';if(!url)throw new Error('Impossible de récupérer l’adresse publique de la photo.');return {url:url,path:path};}
  async function removeUploadedPhoto(c,path){if(!path||!c||!c.storage)return;try{await c.storage.from(PHOTO_BUCKET).remove([path]);}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function isTableMissing(err){var code=String(err&&err.code||'');var msg=String(err&&err.message||err||'').toLowerCase();return code==='42P01'||code==='42703'||code==='PGRST205'||msg.indexOf('roman_comments')>-1&&msg.indexOf('not')>-1||msg.indexOf('photo_url')>-1;}
  function filtered(){var q=state.query.trim().toLowerCase();return novels.filter(function(n){if(n.level!==state.level)return false;if(state.category!=='all'&&n.category!==state.category)return false;if(!q)return true;return [n.title,n.author,n.country,n.year,n.summary,n.subject,n.themes.join(' ')].join(' ').toLowerCase().indexOf(q)>-1;});}
  function chips(items){return '<div class="nx-roman-chips-v353">'+items.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>';}
  function summaryParagraphs(text,ideas){var parts=String(text||'').split(/\n\s*\n/).filter(Boolean);ideas=Array.isArray(ideas)?ideas:[];return parts.map(function(p,i){var idea=ideas[i]||'';return '<div class="nx-summary-paragraph-v355"><span class="nx-summary-number-v355" aria-hidden="true">'+(i+1)+'</span><p>'+esc(p)+(idea?'<span class="nx-summary-idea-v356"><b>Idée générale :</b> '+esc(idea)+'</span>':'')+'</p></div>';}).join('');}
  function commentListMarkup(id){
    if(state.loading[id])return '<div class="nx-comments-loading-v356"><i></i><i></i></div>';
    if(state.errors[id]==='not_ready')return '<div class="nx-comments-empty-v356">Les commentaires restent visibles, mais le SQL V358 doit être exécuté pour activer les photos et les réponses.</div>';
    if(state.errors[id])return '<div class="nx-comments-empty-v356">Impossible de charger les commentaires pour le moment. Utilise le bouton « Actualiser ».</div>';
    var rows=state.shared[id]||[];
    if(!rows.length)return '<div class="nx-comments-empty-v356"><strong>Aucun commentaire pour le moment.</strong><br>Appuie sur « Publier un commentaire sur ce livre » pour partager ton avis et, si tu le souhaites, ajouter une photo.</div>';
    var roots=rows.filter(function(row){return !row.parent_id;});var replies={};
    rows.forEach(function(row){if(row.parent_id){var key=String(row.parent_id);(replies[key]||(replies[key]=[])).push(row);}});
    roots.sort(function(a,b){return new Date(b.created_at||b.updated_at)-new Date(a.created_at||a.updated_at);});
    Object.keys(replies).forEach(function(key){replies[key].sort(function(a,b){return new Date(a.created_at||a.updated_at)-new Date(b.created_at||b.updated_at);});});
    function replyCard(row,parentName){var mine=state.user&&String(row.user_id||'')===String(state.user.id);var name=String(row.author_name||'Élève Nexora');return '<article class="nx-comment-reply-card-v358'+(mine?' mine':'')+'"><header class="nx-comment-reply-head-v359">'+avatarMarkup(row,'Élève Nexora')+'<div class="nx-comment-meta-v356"><strong>'+esc(name)+'</strong>'+(mine?'<span class="nx-comment-mine-v356">Ma réponse</span>':'')+'<time>'+esc(formatDate(row.updated_at||row.created_at))+'</time></div></header><div class="nx-comment-reply-body-v359"><span class="nx-comment-reply-label-v358">↳ Réponse à '+esc(parentName||'un commentaire')+'</span><p class="nx-comment-text-v356">'+esc(row.content||'')+'</p>'+publicationPhotoMarkup(row,name)+'</div></article>'; }
    return roots.map(function(row){var mine=state.user&&String(row.user_id||'')===String(state.user.id);var children=replies[String(row.id)]||[];var replyOpen=String(state.replyTargets[id]||'')===String(row.id);var draft=String(state.replyDrafts[row.id]||'');var photo=photoRecord(state.replyPhotos,row.id);var replyComposer=replyOpen?'<div class="nx-reply-compose-v358"><div class="nx-reply-compose-head-v358"><span>Répondre à <strong>'+esc(row.author_name||'Élève Nexora')+'</strong></span><span>'+draft.length+' / 800</span></div><textarea maxlength="800" data-nx-reply-text-v358="'+esc(row.id)+'" data-nx-comment-novel-v358="'+esc(id)+'" placeholder="Écris ta réponse…">'+esc(draft)+'</textarea><div class="nx-comment-photo-tools-v358 nx-reply-photo-tools-v358"><label class="nx-comment-photo-picker-v358">📷 Ajouter ma photo<input type="file" accept="image/jpeg,image/png,image/webp" data-nx-reply-photo-v358="'+esc(row.id)+'" data-nx-comment-novel-v358="'+esc(id)+'"></label>'+selectedPhotoMarkup(photo,'Photo pour la réponse','reply',row.id,id)+'<span class="nx-comment-photo-note-v358">Facultatif · JPG, PNG ou WEBP · 3 Mo maximum</span></div><div class="nx-reply-actions-v358"><button type="button" class="nx-reply-cancel-v358" data-nx-reply-cancel-v358="'+esc(row.id)+'" data-nx-comment-novel-v358="'+esc(id)+'">Annuler</button><button type="button" class="nx-reply-publish-v358" data-nx-reply-publish-v358="'+esc(row.id)+'" data-nx-comment-novel-v358="'+esc(id)+'">Publier la réponse</button></div></div>':'';var name=String(row.author_name||'Élève Nexora');return '<article class="nx-comment-card-v356'+(mine?' mine':'')+'"><header class="nx-comment-post-head-v359">'+avatarMarkup(row,'Élève Nexora')+'<div class="nx-comment-meta-v356"><strong>'+esc(name)+'</strong>'+(mine?'<span class="nx-comment-mine-v356">Mon commentaire</span>':'')+'<time>'+esc(formatDate(row.updated_at||row.created_at))+'</time></div></header><div class="nx-comment-post-body-v359"><p class="nx-comment-text-v356">'+esc(row.content||'')+'</p>'+publicationPhotoMarkup(row,name)+'<div class="nx-comment-actions-v358"><button type="button" class="nx-comment-reply-btn-v358" data-nx-comment-reply-v358="'+esc(row.id)+'" data-nx-comment-novel-v358="'+esc(id)+'">↩ Répondre</button>'+(children.length?'<span class="nx-comment-reply-label-v358">'+children.length+' réponse'+(children.length>1?'s':'')+'</span>':'')+'</div>'+(children.length?'<div class="nx-comment-replies-v358">'+children.map(function(child){return replyCard(child,row.author_name);}).join('')+'</div>':'')+replyComposer+'</div></article>';}).join('');
  }
  function commentsSection(n){
    var draft=String(state.drafts[n.id]||'');
    var rows=state.shared[n.id]||[];
    var avatar=state.user?initials(state.user.name):'EN';
    var photo=photoRecord(state.commentPhotos,n.id);
    var open=state.composeOpen[n.id]===true;
    var composeId='nxRomanComposerV360-'+n.id;
    var textId='nxRomanCommentTextV360-'+n.id;
    return '<section class="nx-roman-comments-v356 nx-book-comments-v361">'
      +'<header class="nx-comments-head-v356"><div class="nx-comments-title-v356"><span class="nx-comments-icon-v356" aria-hidden="true">💬</span><div><span>Après la lecture</span><h3>Commentaires sur ce livre</h3><small>Écris ce que tu as compris, donne ton avis et réponds aux autres lecteurs.</small></div></div><div class="nx-comments-tools-v358"><button class="nx-comments-refresh-v356" type="button" data-nx-comments-refresh-v356="'+esc(n.id)+'">↻ Actualiser</button></div></header>'
      +'<div class="nx-book-comment-guide-v361"><span aria-hidden="true">📖</span><div><strong>Tu as terminé la lecture ?</strong><small>Partage maintenant ton avis sur ce livre. Tu peux joindre une photo à ton commentaire.</small></div></div>'
      +'<button class="nx-publication-entry-v360 nx-book-comment-cta-v361" type="button" data-nx-comment-compose-toggle-v358="'+esc(n.id)+'" aria-expanded="'+(open?'true':'false')+'" aria-controls="'+esc(composeId)+'"><span class="nx-publication-entry-avatar-v360" aria-hidden="true">'+esc(avatar)+'</span><span class="nx-publication-entry-copy-v360"><strong data-nx-toggle-label-v360>'+(open?'Fermer l’espace de commentaire':'Publier un commentaire sur ce livre')+'</strong><small data-nx-toggle-hint-v360>'+(open?'La zone de commentaire est ouverte juste en dessous.':'Écris ton avis et ajoute une photo si tu le souhaites.')+'</small></span><span class="nx-publication-entry-arrow-v360" aria-hidden="true">⌄</span></button>'
      +'<div id="'+esc(composeId)+'" class="nx-comment-compose-v356 nx-book-comment-compose-v361" data-nx-comment-compose-v358="'+esc(n.id)+'"'+(open?'':' hidden')+'><div class="nx-comment-compose-main-v356"><div class="nx-compose-heading-v360"><span class="nx-compose-heading-icon-v360" aria-hidden="true">✍️</span><div><strong>Mon commentaire sur ce livre</strong><small>Ton commentaire et ta photo seront visibles par les autres lecteurs.</small></div></div><label class="nx-compose-label-v360" for="'+esc(textId)+'">Écris ton commentaire</label><textarea id="'+esc(textId)+'" maxlength="1200" data-nx-novel-comment-v353="'+esc(n.id)+'" placeholder="Exemple : Après cette lecture, j’ai compris que… Mon avis sur ce livre est…">'+esc(draft)+'</textarea><div class="nx-publication-actions-hint-v360"><span>✍️ Commentaire obligatoire</span><span>📷 Photo facultative</span><span>💬 Les autres peuvent répondre</span></div><div class="nx-comment-photo-tools-v358"><label class="nx-comment-photo-picker-v358">📷 Ajouter une photo au commentaire<input type="file" accept="image/jpeg,image/png,image/webp" data-nx-comment-photo-v358="'+esc(n.id)+'"></label><span class="nx-comment-photo-note-v358">JPG, PNG ou WEBP · 3 Mo maximum · la photo apparaîtra en grand.</span>'+selectedPhotoMarkup(photo,'Photo du commentaire','comment',n.id,n.id)+'</div><div class="nx-comment-compose-actions-v356"><small><span data-nx-novel-count-v353="'+esc(n.id)+'">'+draft.length+' / 1 200 caractères</span><br>Après publication, le champ sera vidé et refermé automatiquement.</small><button class="nx-comment-publish-v356" type="button" data-nx-novel-save-v353="'+esc(n.id)+'">Publier mon commentaire</button></div></div></div>'
      +'<div class="nx-comments-status-v356 info" data-show="false" data-nx-comments-status-v356="'+esc(n.id)+'"></div><div class="nx-comments-list-wrap-v356"><div class="nx-comments-list-head-v356"><strong>Commentaires déjà publiés</strong><span class="nx-comments-count-badge-v356" data-nx-comments-count-v356="'+esc(n.id)+'">'+rows.length+'</span></div><div class="nx-comments-list-v356" data-nx-comments-list-v356="'+esc(n.id)+'">'+commentListMarkup(n.id)+'</div></div></section>';
  }
  function card(n,index){var open=state.open[n.id]!==false;state.open[n.id]=open;return '<article class="nx-roman-card-v353'+(open?' open':'')+'" data-category="'+esc(n.category)+'" data-level="'+esc(n.level)+'" data-nx-roman-card-v353="'+esc(n.id)+'"><button class="nx-roman-card-head-v353" type="button" data-nx-novel-toggle-v353="'+esc(n.id)+'" aria-expanded="'+(open?'true':'false')+'"><span class="nx-roman-cover-v353"><b>'+esc(n.initials)+'</b><i>'+esc(n.level==='terminale'?'Tle':n.level)+'</i></span><span class="nx-roman-title-v353"><small>'+esc(n.category==='africaine'?'Littérature africaine':'Littérature française')+'</small><strong>'+esc(n.title)+'</strong><span><b>'+esc(n.author)+'</b> · Première publication : '+esc(n.year)+' · '+esc(n.country)+'</span></span><span class="nx-roman-open-cue-v355"><span><b data-closed>Lire le résumé</b><b data-open>Masquer le résumé</b></span><i>⌄</i></span></button><div class="nx-roman-body-v353"><section class="nx-roman-summary-v353 nx-roman-summary-v354" aria-label="Résumé du roman en trois paragraphes"><header class="nx-roman-summary-head-v355"><span class="nx-summary-icon-v355" aria-hidden="true"><i></i><i></i><i></i></span><div><small>Résumé du roman</small><strong>Résumé détaillé en trois paragraphes</strong></div><span class="nx-summary-badge-v355">3 paragraphes</span></header>'+summaryParagraphs(n.summary,n.paragraphIdeas)+'</section><div class="nx-roman-info-v353"><div><b>Thèmes essentiels</b>'+chips(n.themes)+'</div><div><b>Personnages à retenir</b>'+chips(n.characters)+'</div></div><div class="nx-roman-subject-v354"><span>Sujet lié à l’œuvre</span><strong>'+esc(n.subject)+'</strong></div><div class="nx-roman-question-v353"><strong>Question de lecture :</strong> '+esc(n.question)+'</div></div></article>';}
  function renderControls(){var r=root();if(!r)return;var levelBox=r.querySelector('[data-nx-romans-levels-v353]');var catBox=r.querySelector('[data-nx-romans-categories-v353]');if(levelBox)levelBox.innerHTML=levels.map(function(x){var active=state.level===x.id;return '<button type="button" role="tab" class="nx-romans-level-v353" data-nx-romans-level-v353="'+x.id+'" aria-selected="'+(active?'true':'false')+'" aria-controls="nxRomansGridV353"><span class="nx-level-icon-v355" aria-hidden="true">'+x.short+'</span><span class="nx-level-copy-v355"><strong>'+x.label+'</strong><small>'+x.count+' romans à découvrir</small></span><span class="nx-level-cta-v355"><b>'+(active?'Ouvert':'Ouvrir')+'</b><i aria-hidden="true">›</i></span></button>';}).join('');if(catBox)catBox.innerHTML=categories.map(function(x){return '<button type="button" class="nx-romans-category-v353'+(state.category===x.id?' active':'')+'" data-nx-romans-category-v353="'+x.id+'">'+x.label+'</button>';}).join('');var input=r.querySelector('[data-nx-romans-search-v353]');if(input&&input.value!==state.query)input.value=state.query;}
  function observeCards(grid){try{if(!('IntersectionObserver' in window)){return;}if(state.cardWatcher)state.cardWatcher.disconnect();state.cardWatcher=new IntersectionObserver(function(entries,obs){entries.forEach(function(entry){if(!entry.isIntersecting)return;var id=entry.target.getAttribute('data-nx-roman-card-v353');obs.unobserve(entry.target);if(id)loadComments(id,false);});},{rootMargin:'160px'});Array.prototype.forEach.call(grid.querySelectorAll('[data-nx-roman-card-v353]'),function(el){state.cardWatcher.observe(el);});}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function render(){var r=root();if(!r)return;renderControls();var list=filtered();var grid=r.querySelector('[data-nx-romans-grid-v353]');var empty=r.querySelector('[data-nx-romans-empty-v353]');var result=r.querySelector('[data-nx-romans-result-v353]');if(grid){grid.innerHTML=list.map(card).join('');observeCards(grid);}if(empty)empty.hidden=!!list.length;if(result){var lvl=levels.filter(function(x){return x.id===state.level;})[0];result.textContent=list.length+' roman'+(list.length>1?'s':'')+' affiché'+(list.length>1?'s':'')+' · '+(lvl?lvl.label:'');}updateStats();}
  function updateStats(){var r=root();if(!r)return;var count=r.querySelector('[data-nx-romans-count-v353]');var comments=r.querySelector('[data-nx-romans-notes-v353]');if(count)count.textContent=novels.length;if(comments)comments.textContent=state.totalShared||0;}
  function setStatus(id,message,type){var r=root();if(!r)return;var el=r.querySelector('[data-nx-comments-status-v356="'+CSS.escape(id)+'"]');if(!el)return;el.textContent=message||'';el.className='nx-comments-status-v356 '+(type||'info');el.setAttribute('data-show',message?'true':'false');clearTimeout(state.statusTimers[id]);if(message&&type!=='error')state.statusTimers[id]=setTimeout(function(){var x=root();x=x&&x.querySelector('[data-nx-comments-status-v356="'+CSS.escape(id)+'"]');if(x)x.setAttribute('data-show','false');},4200);}
  function renderComments(id){var r=root();if(!r)return;var list=r.querySelector('[data-nx-comments-list-v356="'+CSS.escape(id)+'"]');var badge=r.querySelector('[data-nx-comments-count-v356="'+CSS.escape(id)+'"]');if(list)list.innerHTML=commentListMarkup(id);if(badge)badge.textContent=(state.shared[id]||[]).length;}
  async function loadComments(id,force){if(state.loading[id]||(!force&&Array.isArray(state.shared[id])))return;state.loading[id]=true;state.errors[id]='';renderComments(id);try{var c=await ensureClient();if(!c)throw new Error('Connexion indisponible');state.user=await identity(c);var response=await c.from(TABLE).select('id,novel_id,parent_id,user_id,author_name,content,photo_url,created_at,updated_at').eq('novel_id',id).order('updated_at',{ascending:false}).limit(80);if(response.error&&String(response.error.code||'')==='42703'){response=await c.from(TABLE).select('id,novel_id,user_id,author_name,content,created_at,updated_at').eq('novel_id',id).order('updated_at',{ascending:false}).limit(80);if(!response.error&&Array.isArray(response.data))response.data=response.data.map(function(row){row.parent_id=null;row.photo_url='';return row;});}if(response.error)throw response.error;state.shared[id]=Array.isArray(response.data)?response.data:[];state.errors[id]='';subscribeRealtime(c);}catch(err){state.shared[id]=state.shared[id]||[];state.errors[id]=isTableMissing(err)?'not_ready':'load';}finally{state.loading[id]=false;renderComments(id);updateStats();}}
  async function loadTotalCount(){try{var c=await ensureClient();if(!c)return;state.user=await identity(c);var response=await c.from(TABLE).select('id',{count:'exact',head:true});if(response.error)throw response.error;state.totalShared=Number(response.count||0);updateStats();subscribeRealtime(c);}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function subscribeRealtime(){return null;}
  async function publish(id){var r=root();if(!r)return;var area=r.querySelector('[data-nx-novel-comment-v353="'+CSS.escape(id)+'"]');var button=r.querySelector('[data-nx-novel-save-v353="'+CSS.escape(id)+'"]');var content=String(area&&area.value||'').trim();var photo=photoRecord(state.commentPhotos,id);state.drafts[id]=String(area&&area.value||'');writeDrafts();if(content.length<3){setStatus(id,'Écris au moins une phrase avant de publier ton commentaire.','error');return;}if(button){button.disabled=true;button.textContent=photo&&photo.file?'Envoi de la photo…':'Publication…';}var uploaded={url:'',path:''};var c=null;try{c=await ensureClient();if(!c)throw new Error('Connexion indisponible');var user=await identity(c);if(!user){setStatus(id,'Connecte-toi à ton compte Nexora pour rendre ce commentaire visible aux autres élèves.','error');try{if(window.NexoraApp&&typeof window.NexoraApp.openAccountModal==='function')window.NexoraApp.openAccountModal();}catch(_e){window.nxLog&&window.nxLog(_e)}return;}if(photo&&photo.file)uploaded=await uploadCommentPhoto(c,user,photo.file,id,null);if(button)button.textContent='Publication…';var payload={novel_id:id,parent_id:null,user_id:user.id,author_name:user.name,content:content,photo_url:uploaded.url||null,updated_at:new Date().toISOString()};var response=await c.from(TABLE).insert(payload).select('id,novel_id,parent_id,user_id,author_name,content,photo_url,created_at,updated_at');if(response.error)throw response.error;state.drafts[id]='';writeDrafts();var hadPhoto=!!(photo&&photo.file);clearPhotoRecord(state.commentPhotos,id);state.composeOpen[id]=false;if(area)area.value='';render();var toggle=r.querySelector('[data-nx-comment-compose-toggle-v358="'+CSS.escape(id)+'"]');setComposeToggle(toggle,false);setStatus(id,hadPhoto?'Ton commentaire et sa photo sont visibles par les autres lecteurs.':'Ton commentaire est maintenant visible par les autres lecteurs.','ok');await loadComments(id,true);await loadTotalCount();}catch(err){if(uploaded.path)await removeUploadedPhoto(c,uploaded.path);var msg=String(err&&err.message||err||'').toLowerCase();if(isTableMissing(err))setStatus(id,'Exécute le SQL V358 pour activer les commentaires, les réponses et les photos.','error');else if(msg.indexOf('photo')>-1||msg.indexOf('storage')>-1||msg.indexOf('bucket')>-1)setStatus(id,'La photo n’a pas pu être envoyée. Vérifie le SQL Storage V358 puis réessaie.','error');else setStatus(id,'Publication impossible pour le moment. Vérifie la connexion puis réessaie.','error');}finally{if(button){button.disabled=false;button.textContent='Publier mon commentaire';}}}
  async function publishReply(id,parentId){var r=root();if(!r)return;var area=r.querySelector('[data-nx-reply-text-v358="'+CSS.escape(parentId)+'"]');var button=r.querySelector('[data-nx-reply-publish-v358="'+CSS.escape(parentId)+'"]');var content=String(area&&area.value||'').trim();var photo=photoRecord(state.replyPhotos,parentId);if(content.length<3){setStatus(id,'Écris au moins une phrase avant de publier la réponse.','error');return;}if(button){button.disabled=true;button.textContent=photo&&photo.file?'Envoi de la photo…':'Publication…';}var uploaded={url:'',path:''};var c=null;try{c=await ensureClient();if(!c)throw new Error('Connexion indisponible');var user=await identity(c);if(!user){setStatus(id,'Connecte-toi à ton compte Nexora pour répondre à ce commentaire.','error');try{if(window.NexoraApp&&typeof window.NexoraApp.openAccountModal==='function')window.NexoraApp.openAccountModal();}catch(_e){window.nxLog&&window.nxLog(_e)}return;}if(photo&&photo.file)uploaded=await uploadCommentPhoto(c,user,photo.file,id,parentId);if(button)button.textContent='Publication…';var payload={novel_id:id,parent_id:parentId,user_id:user.id,author_name:user.name,content:content,photo_url:uploaded.url||null,updated_at:new Date().toISOString()};var response=await c.from(TABLE).insert(payload).select('id,novel_id,parent_id,user_id,author_name,content,photo_url,created_at,updated_at');if(response.error)throw response.error;state.replyDrafts[parentId]='';var hadPhoto=!!(photo&&photo.file);clearPhotoRecord(state.replyPhotos,parentId);delete state.replyTargets[id];renderComments(id);setStatus(id,hadPhoto?'Ta réponse est publiée avec sa photo en grand.':'Ta réponse est publiée sous le commentaire.','ok');await loadComments(id,true);await loadTotalCount();}catch(err){if(uploaded.path)await removeUploadedPhoto(c,uploaded.path);var msg=String(err&&err.message||err||'').toLowerCase();if(isTableMissing(err))setStatus(id,'Exécute le SQL V358 pour activer les réponses et les photos.','error');else if(msg.indexOf('photo')>-1||msg.indexOf('storage')>-1||msg.indexOf('bucket')>-1)setStatus(id,'La photo de la réponse n’a pas pu être envoyée. Vérifie le SQL V358.','error');else setStatus(id,'Réponse impossible pour le moment. Vérifie la connexion puis réessaie.','error');}finally{if(button){button.disabled=false;button.textContent='Publier la réponse';}}}
  function bind(){var r=root();if(!r||r.dataset.bound==='1')return;r.dataset.bound='1';r.addEventListener('click',function(e){var t=e.target.closest('[data-nx-romans-level-v353],[data-nx-romans-category-v353],[data-nx-novel-toggle-v353],[data-nx-novel-save-v353],[data-nx-comments-refresh-v356],[data-nx-comment-compose-toggle-v358],[data-nx-comment-reply-v358],[data-nx-reply-cancel-v358],[data-nx-reply-publish-v358],[data-nx-photo-remove-v358]');if(!t)return;if(t.hasAttribute('data-nx-romans-level-v353')){state.level=t.getAttribute('data-nx-romans-level-v353');state.category='all';state.query='';state.open={};render();return;}if(t.hasAttribute('data-nx-romans-category-v353')){state.category=t.getAttribute('data-nx-romans-category-v353');render();return;}if(t.hasAttribute('data-nx-novel-toggle-v353')){var novelId=t.getAttribute('data-nx-novel-toggle-v353');state.open[novelId]=!state.open[novelId];var cardEl=t.closest('.nx-roman-card-v353');if(cardEl)cardEl.classList.toggle('open',state.open[novelId]);t.setAttribute('aria-expanded',state.open[novelId]?'true':'false');if(state.open[novelId])loadComments(novelId,false);return;}if(t.hasAttribute('data-nx-comments-refresh-v356')){loadComments(t.getAttribute('data-nx-comments-refresh-v356'),true);return;}if(t.hasAttribute('data-nx-comment-compose-toggle-v358')){var composeId=t.getAttribute('data-nx-comment-compose-toggle-v358');var compose=r.querySelector('[data-nx-comment-compose-v358="'+CSS.escape(composeId)+'"]');if(!compose)return;var willOpen=compose.hidden;compose.hidden=!willOpen;state.composeOpen[composeId]=willOpen;setComposeToggle(t,willOpen);if(willOpen){var area=compose.querySelector('textarea');if(area){area.focus();try{area.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){window.nxLog&&window.nxLog(_e)}}}return;}if(t.hasAttribute('data-nx-comment-reply-v358')){var id=t.getAttribute('data-nx-comment-novel-v358');var parentId=t.getAttribute('data-nx-comment-reply-v358');state.replyTargets[id]=parentId;renderComments(id);setTimeout(function(){var area=r.querySelector('[data-nx-reply-text-v358="'+CSS.escape(parentId)+'"]');if(area){area.focus();area.scrollIntoView({behavior:'smooth',block:'nearest'});}},0);return;}if(t.hasAttribute('data-nx-reply-cancel-v358')){var cancelId=t.getAttribute('data-nx-comment-novel-v358');var cancelParent=t.getAttribute('data-nx-reply-cancel-v358');clearPhotoRecord(state.replyPhotos,cancelParent);delete state.replyTargets[cancelId];renderComments(cancelId);return;}if(t.hasAttribute('data-nx-reply-publish-v358')){publishReply(t.getAttribute('data-nx-comment-novel-v358'),t.getAttribute('data-nx-reply-publish-v358'));return;}if(t.hasAttribute('data-nx-photo-remove-v358')){var kind=t.getAttribute('data-nx-photo-remove-v358');var key=t.getAttribute('data-nx-photo-key-v358');var photoNovel=t.getAttribute('data-nx-comment-novel-v358');if(kind==='reply')clearPhotoRecord(state.replyPhotos,key);else clearPhotoRecord(state.commentPhotos,key);if(kind==='reply')renderComments(photoNovel);else render();return;}if(t.hasAttribute('data-nx-novel-save-v353'))publish(t.getAttribute('data-nx-novel-save-v353'));});r.addEventListener('input',function(e){var t=e.target;if(t.matches('[data-nx-romans-search-v353]')){state.query=t.value||'';render();var next=r.querySelector('[data-nx-romans-search-v353]');if(next){next.focus();try{next.setSelectionRange(next.value.length,next.value.length);}catch(_e){window.nxLog&&window.nxLog(_e)}}return;}if(t.matches('[data-nx-novel-comment-v353]')){var id=t.getAttribute('data-nx-novel-comment-v353');state.drafts[id]=t.value||'';var counter=r.querySelector('[data-nx-novel-count-v353="'+CSS.escape(id)+'"]');if(counter)counter.textContent=t.value.length+' / 1 200 caractères';clearTimeout(state.saveTimers[id]);state.saveTimers[id]=setTimeout(writeDrafts,450);return;}if(t.matches('[data-nx-reply-text-v358]')){var parent=t.getAttribute('data-nx-reply-text-v358');state.replyDrafts[parent]=t.value||'';var head=t.closest('.nx-reply-compose-v358');var count=head&&head.querySelector('.nx-reply-compose-head-v358 span:last-child');if(count)count.textContent=t.value.length+' / 800';}});r.addEventListener('change',function(e){var t=e.target;var file=t&&t.files&&t.files[0];if(t.matches('[data-nx-comment-photo-v358]')){var id=t.getAttribute('data-nx-comment-photo-v358');var result=setPhotoRecord(state.commentPhotos,id,file);if(!result.ok){setStatus(id,result.error,'error');t.value='';return;}render();return;}if(t.matches('[data-nx-reply-photo-v358]')){var parent=t.getAttribute('data-nx-reply-photo-v358');var novel=t.getAttribute('data-nx-comment-novel-v358');var result2=setPhotoRecord(state.replyPhotos,parent,file);if(!result2.ok){setStatus(novel,result2.error,'error');t.value='';return;}renderComments(novel);}});}
  function prepare(){state.drafts=readDrafts();bind();}
  function loadingState(message){var r=root();if(!r)return;var grid=r.querySelector('#nxRomansGridV353,[data-nx-romans-grid-v353]');if(grid)grid.innerHTML='<div class="nx-empty-state-v353">'+esc(message||'Chargement sécurisé des romans…')+'</div>';}
  async function activateRomans(){
    prepare();loadingState('Chargement sécurisé des romans…');
    try{await ensureRomansData();render();}
    catch(err){loadingState((err&&err.message)||'Romans indisponibles. Vérifie ta connexion et ton abonnement.');}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare);else prepare();
  document.addEventListener('nx-screen-change',function(e){if(e&&e.detail&&e.detail.screen==='novels')activateRomans();});
  window.NexoraRomansV353={version:'V505.1',open:function(){if(window.NexoraApp&&typeof window.NexoraApp.go==='function')window.NexoraApp.go('novels');},render:render,titleForId:function(id){var n=novels.filter(function(x){return String(x.id)===String(id);})[0];return n&&n.title?String(n.title):'';},refreshComments:function(id){return loadComments(id,true);}};
})();

/* ===== nexora-roman-subjects-v362-script ===== */
(function(){
'use strict';
var VERSION='V373';
var TABLE='roman_subject_responses';
var BUCKET='roman-comment-photos';
var MAX_PHOTO=12*1024*1024;
var DRAFT_KEY='nexora.roman.subject.drafts.v362';
var state={open:{},drafts:{},photos:{},removeExisting:{},own:{},attempts:{},loading:{},progressLoaded:{},status:{},user:null,observer:null,renderLock:false,realtime:null,realtimeStatus:'',authBound:false,authSubscription:null,ownLoaded:false};
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function css(v){try{return CSS.escape(String(v));}catch(_e){return String(v).replace(/[^a-zA-Z0-9_-]/g,'\\$&');}}
function safe(v){return String(v||'sujet').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'sujet';}
var NX_ROMAN_SUBJECT_NOVELS=[];
var NX_ROMAN_SUBJECT_PROMISE=null;
async function ensureRomanSubjectNovels(){
 if(NX_ROMAN_SUBJECT_NOVELS.length)return NX_ROMAN_SUBJECT_NOVELS;
 if(NX_ROMAN_SUBJECT_PROMISE)return NX_ROMAN_SUBJECT_PROMISE;
 NX_ROMAN_SUBJECT_PROMISE=(async function(){
   if(!window.NexoraPremiumLibraryV506||typeof window.NexoraPremiumLibraryV506.load!=='function')throw new Error('Service sécurisé des romans indisponible.');
   var items=await window.NexoraPremiumLibraryV506.load('novels');
   if(!Array.isArray(items)||!items.length)throw new Error('Romans premium indisponibles.');
   NX_ROMAN_SUBJECT_NOVELS=items;
   return NX_ROMAN_SUBJECT_NOVELS;
 })();
 try{return await NX_ROMAN_SUBJECT_PROMISE;}finally{NX_ROMAN_SUBJECT_PROMISE=null;}
}
function novels(){return NX_ROMAN_SUBJECT_NOVELS;}
function novelById(id){return novels().filter(function(n){return String(n.id)===String(id);})[0]||null;}
window.addEventListener('nexora:premium-library-cleared',function(){NX_ROMAN_SUBJECT_NOVELS=[];NX_ROMAN_SUBJECT_PROMISE=null;});
function root(){return document.getElementById('screen-novels');}
function ensureClient(){try{return window.NexoraApp&&typeof window.NexoraApp.ensureSupabaseClientReady==='function'?window.NexoraApp.ensureSupabaseClientReady():Promise.resolve(window.NexoraApp&&window.NexoraApp.getSupabaseClient?window.NexoraApp.getSupabaseClient():null);}catch(_e){return Promise.resolve(null);}}
async function identity(c){if(!c||!c.auth)return null;try{var tools=window.NexoraReliablePublicationV373;var u=tools?await tools.sessionUser(c):null;if(!u){state.user=null;return null;}var m=u.user_metadata||{};var mail=String(u.email||'');var name=String(m.full_name||m.name||m.display_name||mail.split('@')[0]||'Élève Nexora').replace(/[._-]+/g,' ').trim();var fresh={id:String(u.id),name:name||'Élève Nexora'};if(!state.user||state.user.id!==fresh.id||state.user.name!==fresh.name)state.user=fresh;return state.user;}catch(err){state.user=null;if(window.NexoraReliablePublicationV373&&window.NexoraReliablePublicationV373.isNetworkError(err))throw err;return null;}}
function initials(name){var p=String(name||'Élève Nexora').trim().split(/\s+/).filter(Boolean);return ((p[0]||'E').charAt(0)+(p.length>1?p[p.length-1].charAt(0):'')).toUpperCase();}
function date(v){try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}catch(_e){return String(v||'');}}
function ext(file){var t=String(file&&file.type||'').toLowerCase();return t==='image/png'?'png':t==='image/webp'?'webp':'jpg';}
function validatePhoto(file){if(!file)return '';if(['image/jpeg','image/png','image/webp'].indexOf(String(file.type||'').toLowerCase())<0)return 'Choisis une image JPG, PNG ou WEBP.';if(Number(file.size||0)>MAX_PHOTO)return 'La photo ne doit pas dépasser 3 Mo.';return '';}
function key(novelId,index){return String(novelId)+'::'+String(index);}
function readDrafts(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch(_e){return {};}}
function writeDrafts(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(state.drafts));}catch(_e){window.nxLog&&window.nxLog(_e)}}
function cleanSubject(s){return String(s||'').replace(/^Sujet[^:]*:\s*/i,'').trim();}
function theme(n,i){return String((n.themes&&n.themes[i%n.themes.length])||'le thème principal');}
function character(n,i){return String((n.characters&&n.characters[i%n.characters.length])||'le personnage principal');}
function makeSubjects(n){
 var c1=character(n,0),c2=character(n,1),c3=character(n,2),c4=character(n,3),t1=theme(n,0),t2=theme(n,1),t3=theme(n,2),t4=theme(n,3);
 return [
 {type:'Compréhension',title:'Résumé personnel',prompt:'Résumez '+n.title+' en présentant la situation initiale, les événements essentiels et le dénouement.'},
 {type:'Compréhension',title:'Étapes du récit',prompt:'Distinguez la situation initiale, l’élément perturbateur, les principales péripéties et la situation finale de l’œuvre.'},
 {type:'Compréhension',title:'Sens du titre',prompt:'Expliquez le titre « '+n.title+' » et montrez son lien avec le contenu du roman.'},
 {type:'Compréhension',title:'Portrait du personnage principal',prompt:'Présentez '+c1+' : son caractère, ses objectifs, ses difficultés et son rôle dans l’histoire.'},
 {type:'Compréhension',title:'Conflit central',prompt:'Quel est le conflit principal de l’œuvre ? Présentez ses causes, son évolution et ses conséquences.'},
 {type:'Analyse',title:'Étude de '+t1,prompt:'Analysez la manière dont '+n.author+' développe le thème « '+t1+' » dans '+n.title+'.'},
 {type:'Analyse',title:'Étude de '+t2,prompt:'Montrez l’importance du thème « '+t2+' » dans le parcours des personnages.'},
 {type:'Analyse',title:'Étude de '+t3,prompt:'À partir d’exemples précis, expliquez comment le thème « '+t3+' » donne du sens à l’œuvre.'},
 {type:'Analyse',title:'Rôle de '+c2,prompt:'Étudiez le rôle de '+c2+' et montrez son influence sur '+c1+' ou sur l’évolution du récit.'},
 {type:'Analyse',title:'Comparer deux personnages',prompt:'Comparez '+c1+' et '+c2+' : valeurs, décisions, ressemblances et oppositions.'},
 {type:'Analyse',title:'Évolution du personnage',prompt:'Montrez comment '+c1+' se transforme entre le début et la fin du roman.'},
 {type:'Analyse',title:'Relations humaines',prompt:'Analysez la relation entre '+c1+' et '+c3+'. Que révèle-t-elle sur les valeurs de l’œuvre ?'},
 {type:'Analyse',title:'Cadre du récit',prompt:'Étudiez le rôle des lieux et du contexte social dans le déroulement de '+n.title+'.'},
 {type:'Analyse',title:'Une scène décisive',prompt:'Choisissez une scène décisive, racontez-la brièvement puis expliquez ses conséquences sur la suite du récit.'},
 {type:'Analyse',title:'Portée du dénouement',prompt:'Analysez la fin du roman : est-elle heureuse, tragique, ouverte ou porteuse d’espoir ? Justifiez votre réponse.'},
 {type:'Réflexion',title:'Question de lecture',prompt:String(n.question||'Quelle leçon principale retenez-vous de cette œuvre ?')+' Développez une réponse organisée.'},
 {type:'Réflexion',title:'Sujet majeur de l’œuvre',prompt:cleanSubject(n.subject)||('Montrez l’intérêt principal de '+n.title+'.')},
 {type:'Réflexion',title:'Victime ou responsable ?',prompt:c1+' est-il surtout victime des circonstances ou responsable de ses choix ? Discutez.'},
 {type:'Réflexion',title:'Individu et société',prompt:'Les choix individuels des personnages sont-ils plus forts que les contraintes de la société ? Appuyez-vous sur le roman.'},
 {type:'Réflexion',title:'Valeurs et changement',prompt:'Dans quelle mesure les valeurs héritées entrent-elles en conflit avec les changements vécus par les personnages ?'},
 {type:'Réflexion',title:'Épreuve et transformation',prompt:'La souffrance et les épreuves rendent-elles les personnages plus forts ou les détruisent-elles ? Discutez.'},
 {type:'Réflexion',title:'Solidarité ou solitude',prompt:'Montrez la place de la solidarité et de la solitude dans '+n.title+'. Laquelle domine réellement ?'},
 {type:'Réflexion',title:'Critique de l’injustice',prompt:'Peut-on lire '+n.title+' comme une dénonciation de l’injustice ? Développez avec des exemples.'},
 {type:'Réflexion',title:'Roman et société',prompt:'Cette œuvre est-elle seulement une histoire individuelle ou aussi un témoignage sur toute une société ?'},
 {type:'Réflexion',title:'Leçon du roman',prompt:'Quelle leçon '+n.author+' semble-t-il transmettre au lecteur à travers « '+t4+' » et le destin de '+c1+' ?'},
 {type:'Production écrite',title:'Lettre d’un personnage',prompt:'Rédigez une lettre de '+c1+' à '+c2+' après un événement important du roman.'},
 {type:'Production écrite',title:'Journal intime',prompt:'Imaginez une page du journal intime de '+c1+' au moment où il ou elle doit prendre une décision décisive.'},
 {type:'Production écrite',title:'Article de presse',prompt:'Rédigez un article de presse relatant l’événement le plus marquant de '+n.title+', en mentionnant '+c4+'.'},
 {type:'Production écrite',title:'Autre fin possible',prompt:'Imaginez un autre dénouement cohérent pour le roman, puis expliquez ce que cette nouvelle fin change au message de l’œuvre.'},
 {type:'Production écrite',title:'Défendre le livre',prompt:'Préparez un texte pour convaincre un camarade de lire '+n.title+' : présentez son intérêt, ses thèmes et ce qu’il peut apprendre.'}
 ];
}
function currentOwn(k){return state.own[k]||null;}
function draftValue(k){return Object.prototype.hasOwnProperty.call(state.drafts,k)?String(state.drafts[k]||''):String((currentOwn(k)&&currentOwn(k).content)||'');}
function clearNewPhoto(k){var p=state.photos[k];if(p&&p.preview&&String(p.preview).indexOf('blob:')===0)try{URL.revokeObjectURL(p.preview);}catch(_e){window.nxLog&&window.nxLog(_e)}delete state.photos[k];}
function setNewPhoto(k,file){var err=validatePhoto(file);if(err)return err;clearNewPhoto(k);var preview='';try{preview=URL.createObjectURL(file);}catch(_e){window.nxLog&&window.nxLog(_e)}state.photos[k]={file:file,preview:preview};state.removeExisting[k]=false;return '';}
function photoPreview(k){var p=state.photos[k],own=currentOwn(k),url=p&&p.preview?p.preview:(!state.removeExisting[k]&&own&&own.photo_url?own.photo_url:'');if(!url)return '';var isNew=!!(p&&p.preview);return '<div class="nx-subject-photo-preview-v362"><span class="nx-subject-photo-label-v362">'+(isNew?'Nouvelle photo':'Photo déjà publiée')+'</span><img src="'+esc(url)+'" alt="Photo du traitement"><button type="button" class="nx-subject-photo-remove-v362" data-nx-subject-photo-remove-v362="'+esc(k)+'">Retirer</button></div>';}
function attemptMarkup(row){var name=String(row.author_name||'Élève Nexora'),text=String(row.content||'').trim(),photo=String(row.photo_url||'').trim();return '<article class="nx-attempt-card-v362"><header class="nx-attempt-head-v362"><span class="nx-attempt-avatar-v362">'+esc(initials(name))+'</span><div class="nx-attempt-meta-v362"><strong>'+esc(name)+'</strong><time>'+esc(date(row.updated_at||row.created_at))+'</time></div></header><div class="nx-attempt-body-v362">'+(text?'<p>'+esc(text)+'</p>':'')+(photo?'<figure class="nx-attempt-media-v362"><img src="'+esc(photo)+'" alt="Photo du traitement publiée par '+esc(name)+'" loading="lazy"></figure>':'')+'</div></article>';}
function attemptsMarkup(k){if(state.loading[k])return '<div class="nx-attempts-v362"><div class="nx-attempts-empty-v362">Chargement des traitements publiés…</div></div>';var rows=state.attempts[k]||[];return '<div class="nx-attempts-v362"><div class="nx-attempts-title-v362"><span>Traitements publiés</span><span>'+rows.length+'</span></div>'+(rows.length?rows.map(attemptMarkup).join(''):'<div class="nx-attempts-empty-v362">Aucun traitement publié pour le moment. Tu peux être le premier.</div>')+'</div>';}
function subjectCard(n,s,i){var num=i+1,k=key(n.id,num),open=state.open[n.id]===num,own=currentOwn(k),done=!!own,status=state.status[k]||{},draft=draftValue(k);return '<article class="nx-subject-card-v362 '+(done?'is-done':'')+'" data-nx-subject-card-v362="'+esc(k)+'"><div class="nx-subject-main-v362"><div class="nx-subject-top-v362"><span class="nx-subject-number-v362">'+num+'</span><span class="nx-subject-type-v362">'+esc(s.type)+'</span>'+(done?'<span class="nx-subject-done-v362">✓ Déjà traité</span>':'')+'</div><strong class="nx-subject-title-v362">'+esc(s.title)+'</strong><p class="nx-subject-prompt-v362">'+esc(s.prompt)+'</p><button type="button" class="nx-treat-btn-v362" data-nx-treat-v362="'+esc(k)+'" data-nx-novel-v362="'+esc(n.id)+'" data-nx-subject-index-v362="'+num+'" aria-expanded="'+(open?'true':'false')+'">'+(open?'Fermer la zone':done?'Voir ou modifier mon traitement':'Traiter le sujet')+'</button></div><div class="nx-subject-compose-v362" data-nx-subject-compose-v362="'+esc(k)+'" '+(open?'':'hidden')+'><label for="nxSubjectText'+safe(k)+'">Rédige ton traitement du sujet</label><textarea id="nxSubjectText'+safe(k)+'" maxlength="5000" data-nx-subject-text-v362="'+esc(k)+'" placeholder="Écris ton introduction, ton développement et ta conclusion…">'+esc(draft)+'</textarea><span class="nx-subject-char-v362" data-nx-subject-char-v362="'+esc(k)+'">'+draft.length+' / 5 000 caractères</span><span class="nx-subject-helper-v362">Tu peux rédiger directement ici ou publier la photo d’un travail écrit dans ton cahier. Un texte développé ou une photo suffit.</span><div class="nx-subject-photo-row-v362"><label class="nx-subject-photo-v362">📷 '+(own&&own.photo_url?'Remplacer la photo':'Ajouter la photo de mon travail')+'<input type="file" accept="image/jpeg,image/png,image/webp" data-nx-subject-photo-v362="'+esc(k)+'"></label><button type="button" class="nx-subject-publish-v362" data-nx-subject-publish-v362="'+esc(k)+'" data-nx-novel-v362="'+esc(n.id)+'" data-nx-subject-index-v362="'+num+'">'+(done?'Mettre à jour mon traitement':'Publier mon traitement')+'</button></div>'+photoPreview(k)+'<div class="nx-subject-status-v362 '+esc(status.kind||'')+'" data-nx-subject-status-v362="'+esc(k)+'">'+esc(status.text||'')+'</div>'+attemptsMarkup(k)+'</div></article>';}
function section(n){var subjects=makeSubjects(n),done=0;for(var i=1;i<=30;i++)if(currentOwn(key(n.id,i)))done++;return '<section class="nx-training-v362" data-nx-training-v362="'+esc(n.id)+'"><header class="nx-training-head-v362"><span class="nx-training-icon-v362" aria-hidden="true">✍️</span><div class="nx-training-copy-v362"><small>Après la lecture</small><strong>30 sujets pour t’entraîner sur ce livre</strong><p>Choisis un sujet, traite-le directement ou publie la photo de ton travail écrit.</p></div><span class="nx-training-count-v362"><b>30</b><span>sujets</span></span></header><div class="nx-training-progress-v362"><div class="nx-training-progress-track-v362"><i style="width:'+Math.round(done/30*100)+'%"></i></div><span>'+done+' / 30 traité'+(done>1?'s':'')+'</span></div><div class="nx-subjects-list-v362">'+subjects.map(function(s,i){return subjectCard(n,s,i);}).join('')+'</div></section>';}
function ensureSections(){if(state.renderLock)return;state.renderLock=true;try{var r=root();if(!r)return;Array.prototype.forEach.call(r.querySelectorAll('[data-nx-roman-card-v353]'),function(card){var id=card.getAttribute('data-nx-roman-card-v353'),n=novelById(id),body=card.querySelector('.nx-roman-body-v353');if(!n||!body)return;if(!body.querySelector('[data-nx-training-v362]'))body.insertAdjacentHTML('beforeend',section(n));});}finally{state.renderLock=false;}}
function rerenderNovel(id){var r=root();if(!r)return;var card=r.querySelector('[data-nx-roman-card-v353="'+css(id)+'"]'),body=card&&card.querySelector('.nx-roman-body-v353'),old=body&&body.querySelector('[data-nx-training-v362]'),n=novelById(id);if(!body||!n)return;var tmp=document.createElement('div');tmp.innerHTML=section(n);var fresh=tmp.firstElementChild;if(old)old.replaceWith(fresh);else body.appendChild(fresh);}
async function loadOwn(novelId){if(state.progressLoaded[novelId])return;state.progressLoaded[novelId]=true;try{var c=await ensureClient(),u=await identity(c);if(!c||!u)return;var q=await c.from(TABLE).select('id,novel_id,subject_index,user_id,author_name,content,photo_url,created_at,updated_at').eq('novel_id',novelId).eq('user_id',u.id);if(q.error)throw q.error;(q.data||[]).forEach(function(row){state.own[key(novelId,Number(row.subject_index))]=row;});rerenderNovel(novelId);}catch(_e){window.nxLog&&window.nxLog(_e)}}
async function loadAttempts(novelId,index,force){var k=key(novelId,index);if(state.loading[k]||(!force&&Object.prototype.hasOwnProperty.call(state.attempts,k)))return;state.loading[k]=true;rerenderNovel(novelId);try{var c=await ensureClient();if(!c)throw new Error('Connexion indisponible');var q=await c.from(TABLE).select('id,novel_id,subject_index,user_id,author_name,content,photo_url,created_at,updated_at').eq('novel_id',novelId).eq('subject_index',index).order('updated_at',{ascending:false}).limit(12);if(q.error)throw q.error;state.attempts[k]=q.data||[];}catch(_e){state.attempts[k]=[];}finally{state.loading[k]=false;rerenderNovel(novelId);}}
async function loadOwnAll(force){if(state.ownLoaded&&!force)return;state.ownLoaded=true;try{var c=await ensureClient(),u=await identity(c);if(!c||!u)return;var q=await c.from(TABLE).select('id,novel_id,subject_index,user_id,author_name,content,photo_url,created_at,updated_at').eq('user_id',u.id).order('updated_at',{ascending:false}).limit(1000);if(q.error)throw q.error;state.own={};(q.data||[]).forEach(function(row){state.own[key(row.novel_id,Number(row.subject_index))]=row;});var r=root();if(r)Array.prototype.forEach.call(r.querySelectorAll('[data-nx-training-v362]'),function(sectionEl){rerenderNovel(sectionEl.getAttribute('data-nx-training-v362'));});}catch(_e){state.ownLoaded=false;window.nxLog&&window.nxLog(_e)}}
function resetRemoteState(){state.user=null;state.own={};state.attempts={};state.loading={};state.progressLoaded={};state.ownLoaded=false;}
function syncVisibleNovel(novelId,index){var k=key(novelId,index);delete state.attempts[k];delete state.progressLoaded[novelId];rerenderNovel(novelId);loadOwn(novelId);if(state.open[novelId]===index)loadAttempts(novelId,index,true);}
function setupRealtime(){return null;}
function setupAuthSync(){if(state.authBound)return;state.authBound=true;ensureClient().then(function(c){if(!c||!c.auth||typeof c.auth.onAuthStateChange!=='function')return;var response=c.auth.onAuthStateChange(function(){resetRemoteState();if(document.querySelector('#screen-novels.active'))setTimeout(function(){ensureSections();loadOwnAll(true);},0);});state.authSubscription=response&&response.data&&response.data.subscription?response.data.subscription:null;}).catch(function(_promiseError){window.nxLog&&window.nxLog(_promiseError,'promesse')});}
function refreshOpenTreatments(){var r=root();if(!r||!r.classList.contains('active'))return;loadOwnAll(true);Array.prototype.forEach.call(r.querySelectorAll('[data-nx-training-v362]'),function(sectionEl){var novelId=sectionEl.getAttribute('data-nx-training-v362');if(!novelId)return;var index=Number(state.open[novelId]||0);if(index)loadAttempts(novelId,index,true);});}
async function upload(c,u,file,novelId,index){if(!file)return {url:'',path:''};var tools=window.NexoraReliablePublicationV373;if(!tools)throw new Error('Module de publication indisponible.');var prepared=await tools.prepareImage(file);var path=String(u.id)+'/subjects/'+safe(novelId)+'/'+String(index)+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,9)+'.'+prepared.extension;await tools.retry(async function(){var up=await c.storage.from(BUCKET).upload(path,prepared.blob,{cacheControl:'3600',upsert:false,contentType:prepared.mime});if(up&&up.error)throw up.error;return up;},3);var pub=c.storage.from(BUCKET).getPublicUrl(path);var url=pub&&pub.data&&pub.data.publicUrl||'';if(!url)throw new Error('Adresse de photo indisponible');return {url:url,path:path};}
async function removeUpload(c,path){if(!path||!c||!c.storage)return;try{await c.storage.from(BUCKET).remove([path]);}catch(_e){window.nxLog&&window.nxLog(_e)}}
function pathFromUrl(url){var marker='/storage/v1/object/public/'+BUCKET+'/';var s=String(url||''),i=s.indexOf(marker);return i<0?'':decodeURIComponent(s.slice(i+marker.length));}
function setStatus(k,text,kind){state.status[k]={text:text,kind:kind||''};rerenderNovel(k.split('::')[0]);}
async function publish(novelId,index,k,button){var content=String(draftValue(k)||'').trim(),photo=state.photos[k],own=currentOwn(k),existingUrl=own&&own.photo_url&&!state.removeExisting[k]?String(own.photo_url):'';if(content.length<20&&!photo&&!existingUrl){setStatus(k,'Développe ton traitement ou ajoute la photo de ton travail.','error');return;}var uploaded={url:'',path:''},c=null,tools=window.NexoraReliablePublicationV373;try{if(button){button.disabled=true;button.textContent=photo?'Préparation et envoi…':'Publication…';}c=await ensureClient();var u=await identity(c);if(!c||!u){setStatus(k,'Connecte-toi à ton compte Nexora pour publier ton traitement.','error');try{if(window.NexoraApp&&typeof window.NexoraApp.openAccountModal==='function')window.NexoraApp.openAccountModal();}catch(_e){window.nxLog&&window.nxLog(_e)}return;}if(photo&&photo.file)uploaded=await upload(c,u,photo.file,novelId,index);var n=novelById(novelId),subjects=makeSubjects(n),finalUrl=uploaded.url||existingUrl||null;var payload={novel_id:novelId,subject_index:index,subject_text:subjects[index-1].prompt,user_id:u.id,author_name:u.name,content:content||null,photo_url:finalUrl,updated_at:new Date().toISOString()};var res=await tools.retry(async function(){var out=await c.from(TABLE).upsert(payload,{onConflict:'novel_id,subject_index,user_id'}).select('id,novel_id,subject_index,user_id,author_name,content,photo_url,created_at,updated_at').single();if(out&&out.error)throw out.error;return out;},3);var oldPath=own&&own.photo_url&&uploaded.url?pathFromUrl(own.photo_url):'';state.own[k]=res.data;delete state.drafts[k];writeDrafts();clearNewPhoto(k);state.removeExisting[k]=false;state.open[novelId]=null;state.status[k]={text:'Ton traitement a été publié et synchronisé entre les comptes.',kind:'ok'};state.attempts[k]=null;rerenderNovel(novelId);if(oldPath)await removeUpload(c,oldPath);await loadAttempts(novelId,index,true);}catch(err){if(uploaded.path)await removeUpload(c,uploaded.path);setStatus(k,tools?tools.friendly(err):'Publication impossible pour le moment.','error');}finally{if(button){button.disabled=false;button.textContent=own?'Mettre à jour mon traitement':'Publier mon traitement';}}}
function bind(){var r=root();if(!r||r.dataset.subjectsBoundV362==='1')return;r.dataset.subjectsBoundV362='1';r.addEventListener('click',function(e){var b=e.target.closest('[data-nx-treat-v362],[data-nx-subject-publish-v362],[data-nx-subject-photo-remove-v362]');if(!b)return;if(b.hasAttribute('data-nx-treat-v362')){var k=b.getAttribute('data-nx-treat-v362'),id=b.getAttribute('data-nx-novel-v362'),index=Number(b.getAttribute('data-nx-subject-index-v362'));state.open[id]=state.open[id]===index?null:index;rerenderNovel(id);if(state.open[id]===index){loadAttempts(id,index,false);setTimeout(function(){var area=r.querySelector('[data-nx-subject-text-v362="'+css(k)+'"]');if(area){area.focus();try{area.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){window.nxLog&&window.nxLog(_e)}}},0);}return;}if(b.hasAttribute('data-nx-subject-publish-v362')){var k2=b.getAttribute('data-nx-subject-publish-v362');publish(b.getAttribute('data-nx-novel-v362'),Number(b.getAttribute('data-nx-subject-index-v362')),k2,b);return;}if(b.hasAttribute('data-nx-subject-photo-remove-v362')){var k3=b.getAttribute('data-nx-subject-photo-remove-v362'),id3=k3.split('::')[0];clearNewPhoto(k3);if(currentOwn(k3)&&currentOwn(k3).photo_url)state.removeExisting[k3]=true;rerenderNovel(id3);return;}});r.addEventListener('input',function(e){var t=e.target;if(!t.matches('[data-nx-subject-text-v362]'))return;var k=t.getAttribute('data-nx-subject-text-v362');state.drafts[k]=t.value||'';writeDrafts();var counter=r.querySelector('[data-nx-subject-char-v362="'+css(k)+'"]');if(counter)counter.textContent=t.value.length+' / 5 000 caractères';});r.addEventListener('change',function(e){var t=e.target;if(!t.matches('[data-nx-subject-photo-v362]'))return;var k=t.getAttribute('data-nx-subject-photo-v362'),file=t.files&&t.files[0],err=setNewPhoto(k,file);if(err){setStatus(k,err,'error');t.value='';return;}rerenderNovel(k.split('::')[0]);});}
function romanSubjectsActive(){var r=root();return !!(r&&r.classList.contains('active')&&document.visibilityState!=='hidden');}
async function mount(){
 state.drafts=readDrafts();bind();if(!romanSubjectsActive())return;
 try{await ensureRomanSubjectNovels();}catch(err){window.nxLog&&window.nxLog(err);return;}
 if(!romanSubjectsActive())return;
 ensureSections();setupAuthSync();loadOwnAll(false);
 var grid=document.querySelector('[data-nx-romans-grid-v353]');
 if(grid&&!state.observer){state.observer=new MutationObserver(function(){if(romanSubjectsActive())setTimeout(function(){ensureSections();loadOwnAll(false);},0);});state.observer.observe(grid,{childList:true,subtree:false});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){state.drafts=readDrafts();bind();},{once:true});else{state.drafts=readDrafts();bind();}
document.addEventListener('nx-screen-change',function(e){if(e&&e.detail&&e.detail.screen==='novels')setTimeout(function(){mount().catch(function(err){window.nxLog&&window.nxLog(err);});},0);});
window.addEventListener('online',function(){if(romanSubjectsActive())refreshOpenTreatments();});document.addEventListener('visibilitychange',function(){if(romanSubjectsActive())refreshOpenTreatments();});
})();

/* ===== nexora-exam-subjects-v365-script ===== */
(function(){
'use strict';
var VERSION='V373';
var TABLE='exam_subject_responses';
var BUCKET='roman-comment-photos';
var MAX_PHOTO=12*1024*1024;
var DRAFT_KEY='nexora.exam.subject.drafts.v365';
var CATEGORIES=[];
var NX_EXAM_DATA_READY=false;
var NX_EXAM_DATA_PROMISE=null;
async function ensureExamData(){
  if(NX_EXAM_DATA_READY&&CATEGORIES.length)return CATEGORIES;
  if(NX_EXAM_DATA_PROMISE)return NX_EXAM_DATA_PROMISE;
  NX_EXAM_DATA_PROMISE=(async function(){
    if(!window.NexoraPremiumLibraryV506||typeof window.NexoraPremiumLibraryV506.load!=='function')throw new Error('Service sécurisé des sujets indisponible.');
    var payload=await window.NexoraPremiumLibraryV506.load('subjects');
    if(!Array.isArray(payload)||!payload.length)throw new Error('Sujets premium indisponibles.');
    CATEGORIES=payload;NX_EXAM_DATA_READY=true;return CATEGORIES;
  })();
  try{return await NX_EXAM_DATA_PROMISE;}finally{NX_EXAM_DATA_PROMISE=null;}
}
window.addEventListener('nexora:premium-library-cleared',function(){CATEGORIES=[];NX_EXAM_DATA_READY=false;NX_EXAM_DATA_PROMISE=null;});

var METHODES={'bac-francais':{titre:'Méthode de la dissertation littéraire',etapes:[['Analyser le sujet','Souligne les mots clés, repère la thèse discutée, puis reformule la question avec tes propres mots.'],['Poser la problématique','Transforme le sujet en une tension : ce que l’on affirme d’un côté, ce que l’on peut objecter de l’autre.'],['Bâtir le plan','Deux ou trois parties, chacune avec une idée directrice et au moins une œuvre à l’appui, africaine ou française.'],['Rédiger','Introduction : accroche, sujet, problématique, annonce. Développement avec transitions. Conclusion qui répond sans répéter.']]},'bac-philosophie':{titre:'Méthode de la dissertation philosophique',etapes:[['Définir les termes','Chaque mot du sujet a un sens précis. Fixe-le avant toute chose, sinon tu répondras à une autre question.'],['Trouver le problème','Montre pourquoi la réponse évidente ne suffit pas. C’est là que naît la dissertation.'],['Construire les moments','Thèse, objection, dépassement : chaque partie répond à la précédente au lieu de s’ajouter à elle.'],['Argumenter','Un exemple ne prouve rien tout seul. Il illustre un raisonnement, jamais l’inverse.']]},'brevet-francais':{titre:'Méthode de la rédaction argumentée',etapes:[['Lire la consigne deux fois','Repère le type de texte demandé et la personne à qui tu écris.'],['Chercher tes idées','Note trois arguments au brouillon, avec un exemple concret pour chacun.'],['Organiser','Un paragraphe par argument, relié au suivant par un connecteur : d’abord, ensuite, enfin.'],['Relire','Accords, ponctuation, temps verbaux. La relecture rapporte plus de points qu’une idée de plus.']]}};
var state={active:'bac-francais',open:{},drafts:{},photos:{},removeExisting:{},rows:{},loaded:{},loading:{},status:{},user:null,channel:null,query:'',filtre:'tous',methode:{}};
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function safe(v){return String(v||'item').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'item';}
function category(id){for(var i=0;i<CATEGORIES.length;i++)if(CATEGORIES[i].id===id)return CATEGORIES[i];return CATEGORIES[0];}
function key(cat,index){return cat+'::'+String(index);}
function initials(name){var a=String(name||'Élève Nexora').trim().split(/\s+/).filter(Boolean);return ((a[0]||'E')[0]+((a[1]||'N')[0]||'')).toUpperCase();}
function dateText(v){try{return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v));}catch(_e){return '';}}
function loadDrafts(){try{state.drafts=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{};}catch(_e){state.drafts={};}}
function saveDrafts(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(state.drafts));}catch(_e){window.nxLog&&window.nxLog(_e)}}
function root(){return document.getElementById('screen-subjects');}
function ensureClient(){try{return window.NexoraApp&&typeof window.NexoraApp.ensureSupabaseClientReady==='function'?window.NexoraApp.ensureSupabaseClientReady():Promise.resolve(window.NexoraApp&&window.NexoraApp.getSupabaseClient?window.NexoraApp.getSupabaseClient():null);}catch(_e){return Promise.resolve(null);}}
async function identity(c){if(state.user)return state.user;if(!c||!c.auth)return null;try{var r=typeof c.auth.getUser==='function'?await c.auth.getUser():await c.auth.getSession();var u=r&&r.data&&(r.data.user||(r.data.session&&r.data.session.user));if(!u)return null;var m=u.user_metadata||{};var mail=String(u.email||'');var name=String(m.full_name||m.name||m.display_name||mail.split('@')[0]||'Élève Nexora').replace(/[._-]+/g,' ').trim();state.user={id:u.id,name:name||'Élève Nexora'};return state.user;}catch(_e){return null;}}
function ext(file){var t=String(file&&file.type||'');if(t==='image/png')return 'png';if(t==='image/webp')return 'webp';return 'jpg';}
function validatePhoto(file){if(!file)return '';if(['image/jpeg','image/png','image/webp'].indexOf(file.type)<0)return 'Choisis une image JPG, PNG ou WEBP.';if(file.size>MAX_PHOTO)return 'La photo dépasse 3 Mo.';return '';}
function ownRow(cat,index){var rows=state.rows[cat]||[],u=state.user;for(var i=0;i<rows.length;i++)if(Number(rows[i].subject_index)===Number(index)&&u&&rows[i].user_id===u.id)return rows[i];return null;}
function subjectRows(cat,index){return (state.rows[cat]||[]).filter(function(r){return Number(r.subject_index)===Number(index);});}
function traitesCount(c){var n=0;for(var i=0;i<c.subjects.length;i++)if(ownRow(c.id,i+1))n++;return n;}
function categoryCards(){return CATEGORIES.map(function(c){var active=state.active===c.id;var faits=traitesCount(c);return '<button type="button" class="nx-exam-category-v365 '+(active?'active':'')+'" data-nx-exam-category-v365="'+esc(c.id)+'" aria-pressed="'+(active?'true':'false')+'" '+(active?'aria-current="true"':'')+'><span class="nx-exam-category-icon-v365">'+esc(c.icon)+'</span><span class="nx-exam-category-copy-v365"><small>'+esc(c.exam)+' · '+esc(c.area)+'</small><strong>'+esc(c.badge)+'</strong><em>'+faits+' sujet'+(faits>1?'s':'')+' traité'+(faits>1?'s':'')+' sur '+c.subjects.length+'</em></span><span class="nx-exam-category-arrow-v365">›</span></button>';}).join('');}
function preview(k){var p=state.photos[k],own=ownRow(k.split('::')[0],Number(k.split('::')[1])),url=p&&p.url?p.url:(!state.removeExisting[k]&&own&&own.photo_url?own.photo_url:'');if(!url)return '';return '<div class="nx-exam-preview-v365"><img src="'+esc(url)+'" alt="Aperçu de la photo du devoir"><button type="button" aria-label="Retirer la photo" data-nx-exam-remove-photo-v365="'+esc(k)+'">×</button></div>';}
function treated(cat,index){var rows=subjectRows(cat,index);return '<div class="nx-exam-treated-v365"><div class="nx-exam-treated-head-v365"><strong>Sujets traités</strong><span>'+rows.length+'</span></div><div class="nx-exam-treated-list-v365">'+(rows.length?rows.map(function(r){return '<article class="nx-exam-attempt-v365"><div class="nx-exam-attempt-head-v365"><span class="nx-exam-avatar-v365">'+esc(initials(r.author_name))+'</span><div><strong>'+esc(r.author_name||'Élève Nexora')+'</strong><small>'+esc(dateText(r.updated_at||r.created_at))+'</small></div></div>'+(r.content?'<p>'+esc(r.content)+'</p>':'')+(r.photo_url?'<img loading="lazy" src="'+esc(r.photo_url)+'" alt="Photo du sujet traité">':'')+'</article>';}).join(''):'<div class="nx-exam-empty-v365">Aucun traitement publié pour le moment. Tu peux être le premier à traiter ce sujet.</div>')+'</div></div>';}
function normalizeWords(text){return String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s'-]/g,' ').split(/\s+/).filter(function(w){return w.length>3&&!/^(dans|avec|pour|plus|moins|cette|comme|tout|tous|toute|vous|votre|leurs|entre|elle|elles|nous|mais|donc|ainsi|peut|doit|sont|sera|etre|avoir|faire|dune|dun|quel|quelle|quels|quelles)$/.test(w);});}
function uniq(a){var o={},r=[];a.forEach(function(x){if(!o[x]){o[x]=1;r.push(x);}});return r;}
function subjectGuide(c,s){var keys=uniq(normalizeWords(s.title+' '+s.prompt)).slice(0,8),area=c.id;
 var guide={keys:keys,criteria:[],plan:[],examples:[],advice:[]};
 if(area==='bac-philosophie'){
  guide.criteria=['Définir précisément la notion « '+s.title.replace(/^La |^Le |^L’|^Les /,'')+' »','Transformer la question en problème philosophique','Présenter une thèse, une objection et un dépassement','Justifier chaque idée par un exemple ou une référence'];
  guide.plan=['I. Montrer pourquoi une première réponse paraît valable','II. En révéler les limites ou les contradictions','III. Formuler une réponse plus nuancée au problème'];
  guide.examples=['Définition des termes du sujet','Distinction conceptuelle pertinente','Exemple concret ou référence philosophique'];
 }else if(area==='bac-francais'){
  guide.criteria=['Analyser tous les termes du sujet','Construire une problématique littéraire précise','Organiser une démonstration en parties équilibrées','Appuyer les arguments sur des œuvres africaines et françaises'];
  guide.plan=['I. Examiner la validité de l’idée proposée','II. Montrer ses limites ou une position opposée','III. Dépasser l’opposition par une synthèse nuancée'];
  guide.examples=['Une œuvre africaine précisément expliquée','Une œuvre française ou francophone','Un procédé littéraire lié au sujet'];
 }else{
  guide.criteria=['Respecter exactement le type de texte demandé','Organiser les idées dans un ordre clair','Employer un vocabulaire précis et des phrases correctes','Développer des détails directement liés à la consigne'];
  if(/lettre/i.test(s.title+' '+s.prompt))guide.plan=['Lieu et date, destinataire et objet','Présentation claire du problème','Demandes, solutions et formule de politesse'];
  else if(/racon|recit|journée|souvenir|aventure/i.test(s.title+' '+s.prompt))guide.plan=['Situation initiale','Événement principal et réactions','Conséquences et situation finale'];
  else if(/dialogue/i.test(s.title+' '+s.prompt))guide.plan=['Présentation des interlocuteurs','Échanges progressifs et crédibles','Conclusion du dialogue'];
  else guide.plan=['Introduction du thème et prise de position','Deux ou trois arguments expliqués','Conclusion avec proposition concrète'];
  guide.examples=['Connecteurs logiques ou chronologiques','Détails précis tirés de la situation','Conclusion cohérente avec le développement'];
 }
 guide.advice=['Reprendre explicitement les mots importants de la consigne : '+keys.slice(0,4).join(', ')+'.','Consacrer un paragraphe distinct à chaque idée principale.','Relire pour supprimer les répétitions et corriger les accords.'];
 return guide;}
function correctionMarkup(k){var f=state.feedback&&state.feedback[k];if(!f)return '';return '<section class="nx-exam-correction-v436" aria-live="polite"><header><div><small>Correction spécifique au sujet</small><strong>'+esc(f.title)+'</strong></div><span>'+f.score+'/20</span></header><p class="nx-exam-appreciation-v436">'+esc(f.appreciation)+'</p><div class="nx-exam-correction-grid-v436"><article><h4>Points réussis</h4><ul>'+f.strengths.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></article><article><h4>À améliorer</h4><ul>'+f.improvements.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></article></div><article class="nx-exam-expectations-v436"><h4>Ce que ce sujet attend précisément</h4><ul>'+f.expectations.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul><h4>Plan conseillé</h4><ol>'+f.plan.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol><h4>Conseils à l’élève</h4><ul>'+f.advice.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></article></section>';}
function correctWork(k){var parts=k.split('::'),catId=parts[0],index=Number(parts[1]),c=category(catId),s=c.subjects[index-1],text=String(state.drafts[k]||(ownRow(catId,index)&&ownRow(catId,index).content)||'').trim();if(text.length<80){state.status[k]={text:'Rédige au moins 80 caractères pour recevoir une correction utile. La correction d’une photo seule n’est pas encore disponible.',kind:'error'};render();return;}var g=subjectGuide(c,s),words=normalizeWords(text),len=words.length,paras=text.split(/\n\s*\n/).filter(Boolean).length,lower=text.toLowerCase(),hits=g.keys.filter(function(x){return lower.indexOf(x)>=0;}).length,connectors=(lower.match(/\b(d'abord|ensuite|cependant|pourtant|donc|ainsi|enfin|par exemple|en revanche|de plus|toutefois|premièrement|deuxièmement)\b/g)||[]).length,hasIntro=/^(dans|depuis|aujourd|la |le |l’|nous|il |elle |ce |cette |on )/i.test(text),hasConclusion=/en conclusion|pour conclure|finalement|ainsi|en définitive/i.test(lower),score=4;score+=Math.min(4,Math.floor(len/55));score+=Math.min(3,hits);score+=Math.min(3,connectors);score+=paras>=3?2:paras>=2?1:0;score+=hasIntro?1:0;score+=hasConclusion?2:0;score=Math.max(5,Math.min(18,score));var strengths=[],improvements=[];if(len>=180)strengths.push('Le développement est suffisamment étendu pour construire une réflexion.');else improvements.push('Développe davantage les arguments : vise au moins 180 mots pour ce sujet.');if(hits>=3)strengths.push('Le devoir reprend plusieurs notions propres au sujet : '+g.keys.filter(function(x){return lower.indexOf(x)>=0;}).slice(0,4).join(', ')+'.');else improvements.push('Relie davantage le devoir aux notions centrales : '+g.keys.slice(0,5).join(', ')+'.');if(connectors>=3)strengths.push('Les idées sont reliées par des connecteurs logiques.');else improvements.push('Ajoute des connecteurs pour rendre la progression visible.');if(paras>=3)strengths.push('Le texte est organisé en plusieurs paragraphes.');else improvements.push('Sépare clairement l’introduction, le développement et la conclusion.');if(hasConclusion)strengths.push('Une conclusion ou une synthèse est identifiable.');else improvements.push('Ajoute une conclusion qui répond directement à la question posée.');if(strengths.length<2)strengths.push('Le travail constitue une première réponse exploitable au sujet.');var appreciation=score>=15?'Très bon traitement : la réponse est structurée et reste liée au sujet. Renforce encore les exemples précis.':score>=12?'Travail satisfaisant : les idées principales sont présentes, mais certaines doivent être davantage expliquées et illustrées.':score>=9?'Travail moyen : la compréhension existe, mais la structure et l’argumentation doivent être renforcées.':'Travail encore insuffisant : reprends la consigne, construis un plan simple et développe chaque idée avec un exemple.';state.feedback=state.feedback||{};state.feedback[k]={title:s.title,score:score,appreciation:appreciation,strengths:strengths.slice(0,4),improvements:improvements.slice(0,5),expectations:g.criteria,plan:g.plan,advice:g.advice};state.status[k]={text:'Correction terminée pour ce sujet précis.',kind:'ok'};render();setTimeout(function(){var el=root()&&root().querySelector('[data-nx-correction-v436="'+k+'"]');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},30);}
function subjectCard(c,s,index){var num=index+1,k=key(c.id,num),open=!!state.open[k],own=ownRow(c.id,num),draft=Object.prototype.hasOwnProperty.call(state.drafts,k)?state.drafts[k]:(own&&own.content||''),status=state.status[k]||{};return '<article class="nx-exam-card-v365"><div class="nx-exam-card-main-v365"><div class="nx-exam-card-top-v365"><span class="nx-exam-number-v365">'+num+'</span><span class="nx-exam-type-v365">'+esc(c.badge)+'</span>'+(own?'<span class="nx-exam-own-v365">✓ Déjà traité</span>':'')+'</div><strong class="nx-exam-title-v365">'+esc(s.title)+'</strong><p class="nx-exam-prompt-v365">'+esc(s.prompt)+'</p><button type="button" class="nx-exam-treat-v365" data-nx-exam-treat-v365="'+esc(k)+'" aria-expanded="'+(open?'true':'false')+'">'+(open?'Fermer la zone':own?'Voir ou modifier mon traitement':'Traiter le sujet')+'</button><div class="nx-exam-compose-v365" '+(open?'':'hidden')+' data-nx-exam-compose-v365="'+esc(k)+'"><label for="nxExamText'+safe(k)+'">Rédige ton traitement</label><textarea id="nxExamText'+safe(k)+'" maxlength="5000" data-nx-exam-text-v365="'+esc(k)+'" placeholder="Organise ton devoir : introduction, développement argumenté et conclusion…">'+esc(draft)+'</textarea><span class="nx-exam-char-v365" data-nx-exam-char-v365="'+esc(k)+'">'+draft.length+' / 5 000 caractères</span><span class="nx-exam-help-v365">Tu peux rédiger directement ici ou publier la photo d’un devoir écrit dans ton cahier. Un texte développé ou une photo suffit.</span><div class="nx-exam-actions-v365"><label class="nx-exam-photo-v365">📷 '+(own&&own.photo_url?'Remplacer la photo':'Ajouter la photo de mon devoir')+'<input type="file" accept="image/jpeg,image/png,image/webp" data-nx-exam-photo-v365="'+esc(k)+'"></label><button type="button" class="nx-exam-correct-v436" data-nx-exam-correct-v436="'+esc(k)+'">Corriger mon travail</button><button type="button" class="nx-exam-publish-v365" data-nx-exam-publish-v365="'+esc(k)+'">'+(own?'Mettre à jour':'Publier mon traitement')+'</button></div>'+preview(k)+'<div class="nx-exam-status-v365 '+esc(status.kind||'')+'">'+esc(status.text||'')+'</div><div data-nx-correction-v436="'+esc(k)+'">'+correctionMarkup(k)+'</div></div></div>'+treated(c.id,num)+'</article>';}
function normalise(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function sujetsFiltres(c){var q=normalise(state.query).trim();var out=[];
  for(var i=0;i<c.subjects.length;i++){var fait=!!ownRow(c.id,i+1);
    if(state.filtre==='atraiter'&&fait)continue;
    if(state.filtre==='faits'&&!fait)continue;
    if(q&&normalise(c.subjects[i].title+' '+c.subjects[i].prompt).indexOf(q)<0)continue;
    out.push({s:c.subjects[i],i:i});}
  return out;}
function methodeBloc(c){var m=METHODES[c.id];if(!m)return '';var ouvert=!!state.methode[c.id];
  return '<section class="nx-exam-methode-v463'+(ouvert?' open':'')+'">'
    +'<button type="button" class="nx-exam-methode-head-v463" data-nx-exam-methode-v463="'+esc(c.id)+'" aria-expanded="'+(ouvert?'true':'false')+'">'
    +'<b>'+esc(m.titre)+'</b><i>'+(ouvert?'Masquer':'Afficher')+'</i></button>'
    +'<ol class="nx-exam-methode-liste-v463"'+(ouvert?'':' hidden')+'>'
    +m.etapes.map(function(e){return '<li><b>'+esc(e[0])+'</b><span>'+esc(e[1])+'</span></li>';}).join('')
    +'</ol></section>';}
function barreOutils(c,liste){var faits=traitesCount(c);var total=c.subjects.length;var pct=Math.round(faits*100/total);
  var chip=function(id,txt,n){return '<button type="button" class="nx-exam-filtre-v463'+(state.filtre===id?' active':'')+'" data-nx-exam-filtre-v463="'+id+'" aria-pressed="'+(state.filtre===id?'true':'false')+'">'+txt+' <b>'+n+'</b></button>';};
  return '<div class="nx-exam-avance-v463"><div class="nx-exam-avance-copy-v463"><b>'+faits+' / '+total+'</b><span>sujets traités</span></div>'
    +'<div class="nx-exam-jauge-v463" role="img" aria-label="'+faits+' sujets traités sur '+total+'"><i style="width:'+pct+'%"></i></div></div>'
    +'<div class="nx-exam-outils-v463"><div class="nx-exam-filtres-v463">'
    +chip('tous','Tous',total)+chip('atraiter','À traiter',total-faits)+chip('faits','Traités',faits)
    +'</div><label class="nx-exam-recherche-v463"><span aria-hidden="true">⌕</span><input type="search" autocomplete="off" placeholder="Chercher un mot du sujet" value="'+esc(state.query)+'" data-nx-exam-recherche-v463></label></div>'
    +'<p class="nx-exam-compte-v463" aria-live="polite">'+liste.length+' sujet'+(liste.length>1?'s':'')+' affiché'+(liste.length>1?'s':'')+'</p>';}
function listeSujets(c){var liste=sujetsFiltres(c);
  if(!liste.length)return '<p class="nx-exam-vide-v463">Aucun sujet ne correspond. Change de filtre ou efface le mot recherché.</p>';
  return liste.map(function(o){return subjectCard(c,o.s,o.i);}).join('');}
function render(){var r=root();if(!r)return;var c=category(state.active),cats=r.querySelector('[data-nx-exam-categories-v365]'),panel=r.querySelector('[data-nx-exam-panel-v365]');
  if(cats)cats.innerHTML=categoryCards();
  if(!panel)return;var liste=sujetsFiltres(c);
  panel.innerHTML='<header class="nx-exam-panel-head-v365"><span>'+esc(c.icon)+'</span><div><small>'+esc(c.exam)+' · '+esc(c.badge)+'</small><h2>'+esc(c.exam)+' — '+esc(c.area)+'</h2><p>'+esc(c.description)+'</p></div>'
    +'<div class="nx-exam-panel-tools-v365"><button type="button" class="nx-exam-refresh-v365" data-nx-exam-refresh-v365>↻ Actualiser</button></div></header>'
    +methodeBloc(c)+barreOutils(c,liste)
    +'<div class="nx-exam-list-v365" data-nx-exam-list-v463>'+listeSujets(c)+'</div>';}
async function loadCategory(cat,force){if(state.loading[cat]||(!force&&state.loaded[cat]))return;state.loading[cat]=true;try{var c=await ensureClient();var u=await identity(c);if(!c)throw new Error('Connexion indisponible');var fields='id,category_id,exam_level,subject_area,subject_index,subject_text,user_id,author_name,content,photo_url,created_at,updated_at';var recentQuery=c.from(TABLE).select(fields).eq('category_id',cat).order('updated_at',{ascending:false}).limit(120);var ownQuery=u?c.from(TABLE).select(fields).eq('category_id',cat).eq('user_id',u.id).order('subject_index',{ascending:true}).limit(90):Promise.resolve({data:[],error:null});var parts=await Promise.all([recentQuery,ownQuery]);if(parts[0].error)throw parts[0].error;if(parts[1].error)throw parts[1].error;var map={};(parts[0].data||[]).concat(parts[1].data||[]).forEach(function(row){if(row&&row.id)map[String(row.id)]=row;});state.rows[cat]=Object.keys(map).map(function(id){return map[id];});state.loaded[cat]=true;}catch(_e){state.rows[cat]=state.rows[cat]||[];}finally{state.loading[cat]=false;render();}}
async function upload(c,u,file,cat,index){var tools=window.NexoraReliablePublicationV373;if(!tools)throw new Error('Module de publication indisponible.');var prepared=await tools.prepareImage(file);var path=String(u.id)+'/exam-subjects/'+safe(cat)+'/'+String(index)+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,9)+'.'+prepared.extension;await tools.retry(async function(){var up=await c.storage.from(BUCKET).upload(path,prepared.blob,{cacheControl:'3600',upsert:false,contentType:prepared.mime});if(up&&up.error)throw up.error;return up;},3);var pub=c.storage.from(BUCKET).getPublicUrl(path),url=pub&&pub.data&&pub.data.publicUrl||'';if(!url)throw new Error('Adresse de la photo indisponible.');return url;}
function pathFromUrl(url){var marker='/storage/v1/object/public/'+BUCKET+'/';var str=String(url||''),i=str.indexOf(marker);return i<0?'':decodeURIComponent(str.slice(i+marker.length));}
async function removePhoto(c,url){var p=pathFromUrl(url);if(!p)return;try{await c.storage.from(BUCKET).remove([p]);}catch(_e){window.nxLog&&window.nxLog(_e)}}
async function publish(k,button){var parts=k.split('::'),catId=parts[0],index=Number(parts[1]),cdef=category(catId),sub=cdef.subjects[index-1],content=String(state.drafts[k]||'').trim(),photo=state.photos[k]&&state.photos[k].file,existing=ownRow(catId,index),tools=window.NexoraReliablePublicationV373;if(!content&&!photo&&!(existing&&existing.photo_url&&!state.removeExisting[k])){state.status[k]={text:'Écris un traitement ou ajoute une photo.',kind:'error'};render();return;}if(content&&content.length<20){state.status[k]={text:'Développe ton texte avec au moins 20 caractères.',kind:'error'};render();return;}if(button){button.disabled=true;button.textContent=photo?'Préparation et envoi…':'Publication…';}var uploaded='';try{var c=await ensureClient(),u=await identity(c);if(!c||!u)throw new Error('Connecte-toi à Nexora pour publier ton traitement.');if(photo)uploaded=await upload(c,u,photo,catId,index);var photoUrl=uploaded||(state.removeExisting[k]?'':(existing&&existing.photo_url||''));var payload={category_id:catId,exam_level:cdef.exam.toLowerCase(),subject_area:cdef.area.toLowerCase(),subject_index:index,subject_text:sub.title+' — '+sub.prompt,user_id:u.id,author_name:u.name,content:content||null,photo_url:photoUrl||null,updated_at:new Date().toISOString()};var q=await tools.retry(async function(){var out=await c.from(TABLE).upsert(payload,{onConflict:'category_id,subject_index,user_id'}).select('id,category_id,exam_level,subject_area,subject_index,subject_text,user_id,author_name,content,photo_url,created_at,updated_at').single();if(out&&out.error)throw out.error;return out;},3);if(existing&&state.removeExisting[k]&&existing.photo_url)await removePhoto(c,existing.photo_url);if(existing&&uploaded&&existing.photo_url)await removePhoto(c,existing.photo_url);delete state.photos[k];delete state.removeExisting[k];delete state.drafts[k];saveDrafts();state.status[k]={text:'Traitement publié et synchronisé entre les comptes.',kind:'ok'};state.open[k]=false;state.loaded[catId]=false;await loadCategory(catId,true);}catch(e){if(uploaded){try{await removePhoto(await ensureClient(),uploaded);}catch(_e){window.nxLog&&window.nxLog(_e)}}state.status[k]={text:tools?tools.friendly(e):'Publication impossible.',kind:'error'};render();}finally{if(button){button.disabled=false;button.textContent=existing?'Mettre à jour':'Publier mon traitement';}}}
function bind(){document.addEventListener('click',function(e){var cat=e.target.closest('[data-nx-exam-category-v365]');if(cat){state.active=cat.getAttribute('data-nx-exam-category-v365');render();loadCategory(state.active);return;}var t=e.target.closest('[data-nx-exam-treat-v365]');if(t){var k=t.getAttribute('data-nx-exam-treat-v365');state.open[k]=!state.open[k];render();if(state.open[k])setTimeout(function(){var el=root()&&root().querySelector('[data-nx-exam-text-v365="'+k+'"]');if(el)el.focus();},30);return;}var rm=e.target.closest('[data-nx-exam-remove-photo-v365]');if(rm){var rk=rm.getAttribute('data-nx-exam-remove-photo-v365');delete state.photos[rk];state.removeExisting[rk]=true;render();return;}var fl=e.target.closest('[data-nx-exam-filtre-v463]');if(fl){state.filtre=fl.getAttribute('data-nx-exam-filtre-v463');render();return;}var me=e.target.closest('[data-nx-exam-methode-v463]');if(me){var mid=me.getAttribute('data-nx-exam-methode-v463');state.methode[mid]=!state.methode[mid];render();return;}var cor=e.target.closest('[data-nx-exam-correct-v436]');if(cor){correctWork(cor.getAttribute('data-nx-exam-correct-v436'));return;}var pub=e.target.closest('[data-nx-exam-publish-v365]');if(pub){publish(pub.getAttribute('data-nx-exam-publish-v365'),pub);return;}if(e.target.closest('[data-nx-exam-refresh-v365]')){state.loaded[state.active]=false;loadCategory(state.active,true);return;}if(e.target.closest('[data-screen="subjects"]')){setTimeout(function(){render();loadCategory(state.active);},60);}});
document.addEventListener('input',function(e){if(e.target&&e.target.hasAttribute&&e.target.hasAttribute('data-nx-exam-recherche-v463')){state.query=e.target.value;var rr=root();if(rr){var box=rr.querySelector('[data-nx-exam-list-v463]');if(box)box.innerHTML=listeSujets(category(state.active));var cnt=rr.querySelector('.nx-exam-compte-v463');if(cnt){var nb=sujetsFiltres(category(state.active)).length;cnt.textContent=nb+' sujet'+(nb>1?'s':'')+' affiché'+(nb>1?'s':'');}}return;}var k=e.target&&e.target.getAttribute&&e.target.getAttribute('data-nx-exam-text-v365');if(!k)return;state.drafts[k]=e.target.value;saveDrafts();var counter=root()&&root().querySelector('[data-nx-exam-char-v365="'+k+'"]');if(counter)counter.textContent=e.target.value.length+' / 5 000 caractères';});
document.addEventListener('change',function(e){var k=e.target&&e.target.getAttribute&&e.target.getAttribute('data-nx-exam-photo-v365');if(!k)return;var file=e.target.files&&e.target.files[0];if(!file)return;var err=validatePhoto(file);if(err){state.status[k]={text:err,kind:'error'};render();return;}var reader=new FileReader();reader.onload=function(){state.photos[k]={file:file,url:String(reader.result||'')};state.removeExisting[k]=false;render();};reader.readAsDataURL(file);});}
async function realtime(){return null;}
function examScreenActive(){var r=root();return !!(r&&r.classList.contains('active')&&document.visibilityState!=='hidden');}
function examLoading(message){var r=root();if(!r)return;var panel=r.querySelector('[data-nx-exam-panel-v365]');if(panel)panel.innerHTML='<div class="nx-exam-empty-v365">'+esc(message||'Chargement sécurisé des sujets…')+'</div>';}
async function activateExam(){
  if(!examScreenActive())return;
  examLoading('Chargement sécurisé des sujets BAC et Brevet…');
  try{await ensureExamData();render();loadCategory(state.active);}
  catch(err){examLoading((err&&err.message)||'Sujets indisponibles. Vérifie ta connexion et ton abonnement.');}
}
function init(){loadDrafts();bind();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('nx-screen-change',function(e){if(e&&e.detail&&e.detail.screen==='subjects')setTimeout(activateExam,30);});
document.addEventListener('visibilitychange',function(){if(examScreenActive()&&NX_EXAM_DATA_READY){state.loaded[state.active]=false;loadCategory(state.active,true);}});
})();

/* ===== nx-eleventh-v368-script ===== */
(function(){
'use strict';
var DATA={};
/* V484 : 25 leçons par matière au lycée et dans les trois classes du collège, chargées depuis les fichiers natifs des classes. */
var NX_URL="modules/classes/11eme.json", NX_READY=false, NX_PENDING=null;
function NX_APPLY(payload){var src=payload||{};Object.keys(src).forEach(function(k){DATA[k]=src[k]});}
function NX_LOAD(){
  if(NX_READY) return Promise.resolve();
  if(!NX_PENDING){
    NX_PENDING=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.json==='function'?window.NexoraSecureContent.json(NX_URL):Promise.reject(new Error('Accès sécurisé aux cours indisponible.'))).then(function(payload){NX_APPLY(payload);NX_READY=true;}).catch(function(error){NX_PENDING=null;throw error;});
  }
  return NX_PENDING;
}
function NX_FAIL(){
  try{if(typeof window.toast==='function')window.toast('Leçons indisponibles pour le moment. Vérifiez votre connexion, puis réessayez.');}catch(_e){window.nxLog&&window.nxLog(_e)}
}
var STREAMS={SM:{name:'Sciences Mathématiques',note:'9 matières'},SE:{name:'Sciences Expérimentales',note:'10 matières'},SS:{name:'Sciences Sociales',note:'9 matières'}};
var state={stream:'SM',subject:'mathematiques'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function panel(){return document.querySelector('[data-nx-eleventh-v368]')}
function available(){return Object.keys(DATA).filter(function(k){return DATA[k].streams.indexOf(state.stream)>=0})}
function renderStreams(){var el=document.querySelector('[data-nx-eleventh-streams-v368]');if(!el)return;el.innerHTML=Object.keys(STREAMS).map(function(k){var x=STREAMS[k];return '<button type="button" class="nx-eleventh-stream-v368 '+(state.stream===k?'active':'')+'" data-stream="'+k+'">'+esc(x.name)+'<small>'+esc(x.note)+' · Ouvrir l’option</small></button>'}).join('')}
function renderSubjects(){var list=available();if(list.indexOf(state.subject)<0)state.subject=list[0];var el=document.querySelector('[data-nx-eleventh-subjects-v368]');if(!el)return;el.innerHTML=list.map(function(k){var x=DATA[k];return '<button type="button" class="nx-eleventh-subject-v368 '+(state.subject===k?'active':'')+'" style="--sc:'+x.color+'" data-subject="'+k+'">'+esc(x.name)+'</button>'}).join('')}

/* V472 : rendu d'un cours developpe. Les lecons reecrites portent
   definition, plan[[titre,texte]], formules[], pieges[] et exercices[].
   Les lecons non encore reecrites gardent p1/p2/p3 : les deux formes
   cohabitent sans rupture. */
function nxLyceeCorps_v472(l){return window.NexoraCourseLayout.lycee(l,esc)}

function renderContent(){var x=DATA[state.subject],el=document.querySelector('[data-nx-eleventh-content-v368]');if(!x||!el)return;el.style.setProperty('--sc',x.color);el.innerHTML='<header class="nx-eleventh-subject-head-v368"><b>'+esc(x.abbr)+'</b><div><h3>'+esc(x.name)+'</h3><p>'+x.lessons.length+' leçons organisées en '+Math.ceil(x.lessons.length/5)+' séquences progressives</p></div></header><div class="nx-eleventh-lessons-v368">'+x.lessons.map(function(l,i){return window.NexoraCourseLayout.sequenceHeader(i,x.lessons.length)+'<article class="nx-eleventh-lesson-v368" style="--sc:'+x.color+'"><button type="button" class="nx-eleventh-lesson-btn-v368" data-lesson-toggle aria-expanded="false"><span class="nx-eleventh-num-v368">'+(i+1)+'</span><strong>'+esc(l.title)+'</strong><i>›</i></button><div class="nx-eleventh-body-v368">'+nxLyceeCorps_v472(l)+'</div></article>'}).join('')+'</div>'}
function render(){renderStreams();renderSubjects();renderContent()}
function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var p=panel();if(!p)return;p.hidden=false;document.body.style.overflow='hidden';render();setTimeout(function(){p.scrollTop=0},0)}
function close(){var p=panel();if(!p)return;p.hidden=true;document.body.style.overflow=''}
document.addEventListener('click',function(e){var o=e.target.closest('[data-nx-open-eleventh-v368]');if(o){e.preventDefault();open();return}var c=e.target.closest('[data-nx-eleventh-close-v368]');if(c){e.preventDefault();close();return}var s=e.target.closest('[data-stream]');if(s&&panel()&&!panel().hidden){state.stream=s.getAttribute('data-stream');state.subject=available()[0];render();return}var b=e.target.closest('[data-subject]');if(b&&panel()&&!panel().hidden){state.subject=b.getAttribute('data-subject');renderSubjects();renderContent();return}var t=e.target.closest('[data-lesson-toggle]');if(t){var a=t.closest('.nx-eleventh-lesson-v368');if(a)window.NexoraCourseLayout.toggleExclusive(t,a)}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel()&&!panel().hidden)close()});
})();

/* ===== nx-twelfth-script-v369 ===== */
(function(){
'use strict';
var DATA={};
/* V410 : les leçons vivent dans un fichier, téléchargé à la première ouverture. */
var NX_URL="modules/classes/12eme.json", NX_READY=false, NX_PENDING=null;
function NX_APPLY(payload){var src=payload||{};Object.keys(src).forEach(function(k){DATA[k]=src[k]});}
function NX_LOAD(){
  if(NX_READY) return Promise.resolve();
  if(!NX_PENDING){
    NX_PENDING=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.json==='function'?window.NexoraSecureContent.json(NX_URL):Promise.reject(new Error('Accès sécurisé aux cours indisponible.'))).then(function(payload){ NX_APPLY(payload); NX_READY=true; }).catch(function(error){
      NX_PENDING=null; throw error;
    });
  }
  return NX_PENDING;
}
function NX_FAIL(){
  try{ if(typeof window.toast==='function') window.toast('Leçons indisponibles pour le moment. Vérifiez votre connexion, puis réessayez.'); }catch(_e){window.nxLog&&window.nxLog(_e)}
}

var STREAMS={"SM":{"name":"Sciences Mathématiques","note":"9 matières"},"SE":{"name":"Sciences Expérimentales","note":"10 matières"},"SS":{"name":"Sciences Sociales","note":"9 matières"}};
var state={stream:'SM',subject:'mathematiques'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function panel(){return document.querySelector('[data-nx-twelfth-v369]')}
function available(){return Object.keys(DATA).filter(function(k){return DATA[k].streams.indexOf(state.stream)>=0})}
function renderStreams(){var el=document.querySelector('[data-nx-twelfth-streams-v369]');if(!el)return;el.innerHTML=Object.keys(STREAMS).map(function(k){var x=STREAMS[k];return '<button type="button" class="nx-twelfth-stream-v369 '+(state.stream===k?'active':'')+'" data-nx-twelfth-stream-v369="'+k+'">'+esc(x.name)+'<small>'+esc(x.note)+' · Appuyer pour ouvrir</small></button>'}).join('')}
function renderSubjects(){var list=available();if(list.indexOf(state.subject)<0)state.subject=list[0];var el=document.querySelector('[data-nx-twelfth-subjects-v369]');if(!el)return;el.innerHTML=list.map(function(k){var x=DATA[k];return '<button type="button" class="nx-twelfth-subject-v369 '+(state.subject===k?'active':'')+'" style="--sc:'+x.color+'" data-nx-twelfth-subject-v369="'+k+'">'+esc(x.name)+'</button>'}).join('')}

/* V472 : rendu d'un cours developpe. Les lecons reecrites portent
   definition, plan[[titre,texte]], formules[], pieges[] et exercices[].
   Les lecons non encore reecrites gardent p1/p2/p3 : les deux formes
   cohabitent sans rupture. */
function nxLyceeCorps_v472(l){return window.NexoraCourseLayout.lycee(l,esc)}

function renderContent(){var x=DATA[state.subject],el=document.querySelector('[data-nx-twelfth-content-v369]');if(!x||!el)return;el.style.setProperty('--sc',x.color);el.innerHTML='<header class="nx-twelfth-subject-head-v369"><b>'+esc(x.abbr)+'</b><div><h3>'+esc(x.name)+'</h3><p>'+x.lessons.length+' leçons organisées en '+Math.ceil(x.lessons.length/5)+' séquences progressives</p></div></header><div class="nx-twelfth-lessons-v369">'+x.lessons.map(function(l,i){return window.NexoraCourseLayout.sequenceHeader(i,x.lessons.length)+'<article class="nx-twelfth-lesson-v369" style="--sc:'+x.color+'"><button type="button" class="nx-twelfth-lesson-btn-v369" data-nx-twelfth-lesson-v369 aria-expanded="false"><span class="nx-twelfth-num-v369">'+(i+1)+'</span><strong>'+esc(l.title)+'</strong><i>›</i></button><div class="nx-twelfth-body-v369">'+nxLyceeCorps_v472(l)+'</div></article>'}).join('')+'</div>'}
function render(){renderStreams();renderSubjects();renderContent()}
function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var p=panel();if(!p)return;p.hidden=false;document.body.style.overflow='hidden';render();setTimeout(function(){p.scrollTop=0},0)}
function close(){var p=panel();if(!p)return;p.hidden=true;document.body.style.overflow=''}
document.addEventListener('click',function(e){var o=e.target.closest('[data-nx-open-twelfth-v369]');if(o){e.preventDefault();open();return}var c=e.target.closest('[data-nx-twelfth-close-v369]');if(c){e.preventDefault();close();return}var s=e.target.closest('[data-nx-twelfth-stream-v369]');if(s&&panel()&&!panel().hidden){state.stream=s.getAttribute('data-nx-twelfth-stream-v369');state.subject=available()[0];render();return}var b=e.target.closest('[data-nx-twelfth-subject-v369]');if(b&&panel()&&!panel().hidden){state.subject=b.getAttribute('data-nx-twelfth-subject-v369');renderSubjects();renderContent();return}var t=e.target.closest('[data-nx-twelfth-lesson-v369]');if(t){var a=t.closest('.nx-twelfth-lesson-v369');if(a)window.NexoraCourseLayout.toggleExclusive(t,a)}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel()&&!panel().hidden)close()});
})();

/* ===== nx-terminal-script-v475 ===== */
(function(){
'use strict';
var DATA={};
/* V410 : les leçons vivent dans un fichier, téléchargé à la première ouverture. */
var NX_URL="modules/classes/terminale.json", NX_READY=false, NX_PENDING=null;
function NX_APPLY(payload){var src=payload||{};Object.keys(src).forEach(function(k){DATA[k]=src[k]});}
function NX_LOAD(){
  if(NX_READY) return Promise.resolve();
  if(!NX_PENDING){
    NX_PENDING=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.json==='function'?window.NexoraSecureContent.json(NX_URL):Promise.reject(new Error('Accès sécurisé aux cours indisponible.'))).then(function(payload){ NX_APPLY(payload); NX_READY=true; }).catch(function(error){
      NX_PENDING=null; throw error;
    });
  }
  return NX_PENDING;
}
function NX_FAIL(){
  try{ if(typeof window.toast==='function') window.toast('Leçons indisponibles pour le moment. Vérifiez votre connexion, puis réessayez.'); }catch(_e){window.nxLog&&window.nxLog(_e)}
}

var STREAMS={"SM":{"name":"Sciences Mathématiques","note":"9 matières"},"SE":{"name":"Sciences Expérimentales","note":"10 matières"},"SS":{"name":"Sciences Sociales","note":"9 matières"}};
var state={stream:'SM',subject:'mathematiques'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function panel(){return document.querySelector('[data-nx-terminal-v475]')}
function available(){return Object.keys(DATA).filter(function(k){return DATA[k].streams.indexOf(state.stream)>=0})}
function renderStreams(){var el=document.querySelector('[data-nx-terminal-streams-v475]');if(!el)return;el.innerHTML=Object.keys(STREAMS).map(function(k){var x=STREAMS[k];return '<button type="button" class="nx-terminal-stream-v475 '+(state.stream===k?'active':'')+'" data-nx-terminal-stream-v475="'+k+'">'+esc(x.name)+'<small>'+esc(x.note)+' · Appuyer pour ouvrir</small></button>'}).join('')}
function renderSubjects(){var list=available();if(list.indexOf(state.subject)<0)state.subject=list[0];var el=document.querySelector('[data-nx-terminal-subjects-v475]');if(!el)return;el.innerHTML=list.map(function(k){var x=DATA[k];return '<button type="button" class="nx-terminal-subject-v475 '+(state.subject===k?'active':'')+'" style="--sc:'+x.color+'" data-nx-terminal-subject-v475="'+k+'">'+esc(x.name)+'</button>'}).join('')}

/* V472 : rendu d'un cours developpe. Les lecons reecrites portent
   definition, plan[[titre,texte]], formules[], pieges[] et exercices[].
   Les lecons non encore reecrites gardent p1/p2/p3 : les deux formes
   cohabitent sans rupture. */
function nxLyceeCorps_v472(l){return window.NexoraCourseLayout.lycee(l,esc)}

function renderContent(){var x=DATA[state.subject],el=document.querySelector('[data-nx-terminal-content-v475]');if(!x||!el)return;el.style.setProperty('--sc',x.color);el.innerHTML='<header class="nx-terminal-subject-head-v475"><b>'+esc(x.abbr)+'</b><div><h3>'+esc(x.name)+'</h3><p>'+x.lessons.length+' leçons organisées en '+Math.ceil(x.lessons.length/5)+' séquences progressives</p></div></header><div class="nx-terminal-lessons-v475">'+x.lessons.map(function(l,i){return window.NexoraCourseLayout.sequenceHeader(i,x.lessons.length)+'<article class="nx-terminal-lesson-v475" style="--sc:'+x.color+'"><button type="button" class="nx-terminal-lesson-btn-v475" data-nx-terminal-lesson-v475 aria-expanded="false"><span class="nx-terminal-num-v475">'+(i+1)+'</span><strong>'+esc(l.title)+'</strong><i>›</i></button><div class="nx-terminal-body-v475">'+nxLyceeCorps_v472(l)+'</div></article>'}).join('')+'</div>'}
function render(){renderStreams();renderSubjects();renderContent()}
function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var p=panel();if(!p)return;p.hidden=false;document.body.style.overflow='hidden';render();setTimeout(function(){p.scrollTop=0},0)}
function close(){var p=panel();if(!p)return;p.hidden=true;document.body.style.overflow=''}
document.addEventListener('click',function(e){var o=e.target.closest('[data-nx-open-terminal-v475]');if(o){e.preventDefault();open();return}var c=e.target.closest('[data-nx-terminal-close-v475]');if(c){e.preventDefault();close();return}var s=e.target.closest('[data-nx-terminal-stream-v475]');if(s&&panel()&&!panel().hidden){state.stream=s.getAttribute('data-nx-terminal-stream-v475');state.subject=available()[0];render();return}var b=e.target.closest('[data-nx-terminal-subject-v475]');if(b&&panel()&&!panel().hidden){state.subject=b.getAttribute('data-nx-terminal-subject-v475');renderSubjects();renderContent();return}var t=e.target.closest('[data-nx-terminal-lesson-v475]');if(t){var a=t.closest('.nx-terminal-lesson-v475');if(a)window.NexoraCourseLayout.toggleExclusive(t,a)}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel()&&!panel().hidden)close()});
})();

/* ===== nx-academy-cycles-v406-script ===== */
(function(){
  'use strict';
  function api(){ return window.NexoraAcademy || null; }
  function notify(message){
    try{ if(window.NexoraApp&&typeof window.NexoraApp.notify==='function'){window.NexoraApp.notify(message);return;} }catch(_e){window.nxLog&&window.nxLog(_e)}
    try{ if(typeof window.toast==='function'){window.toast(message);return;} }catch(_e2){window.nxLog&&window.nxLog(_e2)}
  }
  var ROUTES={
    'primary-all':      function(a){ return a.openPrimary(); },
    'brevet-cours':     function(a){ return a.openBrevet('subjects'); },
    'brevet-sujets':    function(a){ return a.openBrevet('brevet'); },
    'bac':              function(a){ return a.openBac(); },
    'orientation-brevet':function(a){ return a.openOrientation('apres_brevet'); },
    'orientation-bac':  function(a){ return a.openOrientation('apres_bac'); },
    'devoir':           function(a){ return a.openHomework(); }
  };
  var shortcutOpening=false;
  var CYCLE_SHORTCUTS={
    maternelle:{title:'Maternelle',description:'Choisissez la section de l’enfant : petite, moyenne ou grande section.'},
    primaire:{title:'Primaire',description:'Choisissez la classe, du CP1 au CM2, puis la matière et la leçon.'},
    college:{title:'Collège',description:'Choisissez la classe, de la 7ème à la 10ème année.'},
    lycee:{title:'Lycée',description:'Choisissez la 11ème, la 12ème ou la Terminale, puis votre option.'}
  };

  function academyRoot(){return document.querySelector('[data-nx-academy-real]');}
  function setShortcutBusy(button,busy){
    if(!button)return;
    button.setAttribute('aria-busy',busy?'true':'false');
    button.disabled=!!busy;
  }
  function clearCycleFocus(){
    var root=academyRoot();
    if(!root)return;
    root.removeAttribute('data-nx-cycle-focus-v492');
    root.querySelectorAll('[data-nx-cycle-v406]').forEach(function(section){section.hidden=false;section.removeAttribute('aria-hidden');});
    var head=root.querySelector('[data-nx-academy-view="pre"] .nx-academy-pre-title-v184');
    if(!head)return;
    var small=head.querySelector('small'),title=head.querySelector('h2'),description=head.querySelector('p');
    if(small&&small.dataset.nxDefaultV492!==undefined)small.textContent=small.dataset.nxDefaultV492;
    if(title&&title.dataset.nxDefaultV492!==undefined)title.textContent=title.dataset.nxDefaultV492;
    if(description&&description.dataset.nxDefaultV492!==undefined)description.textContent=description.dataset.nxDefaultV492;
  }
  function openExamSubjects(categorie){
    if(window.NexoraApp&&typeof window.NexoraApp.go==='function')window.NexoraApp.go('subjects');
    else{
      var entree=document.querySelector('[data-action="go"][data-screen="subjects"]');
      if(!entree)throw new Error('Écran des sujets indisponible.');
      entree.click();
    }
    /* l'écran se remplit après son premier rendu : on attend l'onglet. */
    var essais=0;
    (function choisir(){
      essais++;
      var onglet=document.querySelector('#screen-subjects [data-nx-exam-category-v365="'+categorie+'"]');
      if(onglet){try{onglet.click();}catch(_e){window.nxLog&&window.nxLog(_e)}return;}
      if(essais<40)window.setTimeout(choisir,120);
    })();
  }
  function goAcademy(){
    if(window.NexoraApp&&typeof window.NexoraApp.go==='function'){window.NexoraApp.go('academy');return true;}
    var entry=document.querySelector('[data-action="go"][data-screen="academy"]');
    if(entry){entry.click();return true;}
    return false;
  }
  function focusCycle(key){
    var root=academyRoot(),copy=CYCLE_SHORTCUTS[key];
    if(!root||!copy)return false;
    root.setAttribute('data-nx-cycle-focus-v492',key);
    var selected=null;
    root.querySelectorAll('[data-nx-cycle-v406]').forEach(function(section){
      var active=section.getAttribute('data-nx-cycle-v406')===key;
      section.hidden=!active;section.setAttribute('aria-hidden',active?'false':'true');
      if(active)selected=section;
    });
    var head=root.querySelector('[data-nx-academy-view="pre"] .nx-academy-pre-title-v184');
    if(head){
      var small=head.querySelector('small'),title=head.querySelector('h2'),description=head.querySelector('p');
      [small,title,description].forEach(function(node){if(node&&node.dataset.nxDefaultV492===undefined)node.dataset.nxDefaultV492=node.textContent||'';});
      if(small)small.textContent='Accès direct · Académie';
      if(title)title.textContent=copy.title;
      if(description)description.textContent=copy.description;
    }
    if(selected){try{selected.scrollIntoView({block:'start',behavior:'auto'});}catch(_e){window.nxLog&&window.nxLog(_e)}}
    return !!selected;
  }
  function openShortcut(key,button){
    var a=api();
    if(!a){notify('L’Académie se prépare. Réessayez dans un instant.');return;}
    setShortcutBusy(button,true);
    shortcutOpening=true;
    try{
      /* V499 : les sujets du BAC et du Brevet ne vivent pas dans l'Académie
         mais dans l'écran « subjects ». On y va directement, puis on ouvre
         la bonne famille de sujets. */
      if(key==='sujets-bac'||key==='sujets-brevet'){
        openExamSubjects(key==='sujets-bac'?'bac-francais':'brevet-francais');
        setShortcutBusy(button,false);shortcutOpening=false;return;
      }
      if(!goAcademy())throw new Error('Écran Académie indisponible.');
      clearCycleFocus();
      if(key==='eleves'){
        if(typeof a.pre!=='function')throw new Error('Espace des élèves indisponible.');
        a.pre();setShortcutBusy(button,false);shortcutOpening=false;return;
      }
      if(CYCLE_SHORTCUTS[key]){
        a.pre();
        if(!focusCycle(key))throw new Error('Rubrique scolaire indisponible.');
        setShortcutBusy(button,false);shortcutOpening=false;return;
      }
      if(key==='professionnels'){
        if(typeof a.pro==='function')a.pro();
        else {
          var pro=document.querySelector('#screen-academy [data-nx-open-v342="view"][data-view="pro"]');
          if(!pro)throw new Error('Espace professionnel indisponible.');
          pro.click();
        }
        setShortcutBusy(button,false);shortcutOpening=false;return;
      }
      var result=key==='bac'?a.openBac():(key==='brevet'?a.openBrevet('brevet'):null);
      if(!result&&key!=='bac'&&key!=='brevet')throw new Error('Raccourci inconnu.');
      shortcutOpening=false;
      if(result&&typeof result.then==='function')result.then(function(){setShortcutBusy(button,false);},function(){setShortcutBusy(button,false);});
      else window.setTimeout(function(){setShortcutBusy(button,false);},500);
    }catch(error){
      shortcutOpening=false;setShortcutBusy(button,false);notify(String(error&&error.message||error||'Ouverture impossible.'));
    }
  }
  document.addEventListener('click',function(event){
    var shortcut=event.target&&event.target.closest?event.target.closest('[data-nx-academy-shortcut-v492]'):null;
    if(!shortcut)return;
    event.preventDefault();
    openShortcut(shortcut.getAttribute('data-nx-academy-shortcut-v492')||'',shortcut);
  },true);
  document.addEventListener('click',function(event){
    var regularPre=event.target&&event.target.closest?event.target.closest('#screen-academy [data-nx-academy-route="pre"]'):null;
    if(regularPre&&!shortcutOpening)clearCycleFocus();
  },true);
  document.addEventListener('nx-screen-change',function(event){
    if(event&&event.detail&&event.detail.screen==='academy'&&!shortcutOpening)clearCycleFocus();
  });
  document.addEventListener('click', function(event){
    var btn=event.target&&event.target.closest?event.target.closest('[data-nx-acad-v406]'):null;
    if(!btn)return;
    event.preventDefault();
    var route=ROUTES[btn.getAttribute('data-nx-acad-v406')||''];
    var a=api();
    if(!route||!a){ notify('Cette rubrique n’est pas encore prête. Réessayez dans un instant.'); return; }
    btn.setAttribute('aria-busy','true');
    function done(){ btn.removeAttribute('aria-busy'); }
    try{
      var r=route(a);
      if(r&&typeof r.then==='function') r.then(done, function(){ done(); });
      else window.setTimeout(done,600);
    }catch(_error){ done(); notify('Ouverture impossible pour le moment.'); }
  }, false);
})();

