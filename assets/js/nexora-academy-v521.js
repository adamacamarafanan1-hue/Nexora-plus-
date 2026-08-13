
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
    open:function(){if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('modules',openGranted);return openGranted();},
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

/* ===== assets/js/nx-v157-primary-school-script.js ===== */
(function(){
  'use strict';
  /* V520.1 — 4ème année renforcée servie uniquement après contrôle serveur. */
  async function NX_FETCH_CE2_V520(){
    var client=window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function'?window.NexoraApp.getSupabaseClient():null;
    if(!client||!client.auth||typeof client.auth.getSession!=='function')throw new Error('Connexion Nexora indisponible pour la 4ème année renforcée.');
    var sessionResult=await client.auth.getSession();
    var session=sessionResult&&sessionResult.data&&sessionResult.data.session;
    if(!session||!session.access_token)throw new Error('Connecte-toi à Nexora pour ouvrir la 4ème année.');
    var response=await fetch('/api/ce2-v520',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json','Authorization':'Bearer '+session.access_token}});
    var data={};try{data=await response.json();}catch(_e){window.nxLog&&window.nxLog(_e)}
    if(!response.ok||data.success!==true||!data.ce2)throw new Error(data&&data.message?data.message:'4ème année renforcée momentanément indisponible.');
    return data.ce2;
  }
  function mergeCe2V520(payload,ce2){
    payload=payload||{};
    if(!ce2||ce2.id!=='ce2')return payload;
    var classes=Array.isArray(payload.classes)?payload.classes.slice():[];
    var found=false;
    for(var i=0;i<classes.length;i++){if(classes[i]&&classes[i].id==='ce2'){classes[i]=ce2;found=true;break;}}
    if(!found)classes.push(ce2);
    payload.classes=classes;
    return payload;
  }
  var DATA=[];
  var state={view:'classes',classId:'',subjectId:'',lessonIndex:0,previousOverflow:'',cp1Timer:null,cp1Token:0,cp1ItemIndex:0,cp1Auto:false,cp1Phase:1,cp1MelodyOn:false,cp1Round:1,cp1TotalRounds:3,challengePassed:false};


  var PRIMARY_GUIDED_VISUALS={};
/* V410 : les leçons vivent dans un fichier, téléchargé à la première ouverture. */
var NX_URL="modules/classes/primaire.json", NX_READY=false, NX_PENDING=null;
function NX_APPLY(payload,ce2){payload=mergeCe2V520(payload,ce2);DATA.length=0;Array.prototype.push.apply(DATA,(payload&&payload.classes)||[]);var v=(payload&&payload.visuels)||{};Object.keys(v).forEach(function(k){PRIMARY_GUIDED_VISUALS[k]=v[k]});}
function NX_LOAD(){
  if(NX_READY) return Promise.resolve();
  if(!NX_PENDING){
    var secure=(window.NexoraSecureContent&&typeof window.NexoraSecureContent.json==='function')?window.NexoraSecureContent.json(NX_URL):Promise.reject(new Error('Accès sécurisé aux cours indisponible.'));
    NX_PENDING=secure.then(async function(payload){
      var ce2=null;
      try{ce2=await NX_FETCH_CE2_V520();}catch(ce2Error){try{if(window.nxLog)window.nxLog(ce2Error,'ce2-v520');}catch(_logError){}}
      NX_APPLY(payload,ce2);
      NX_READY=true;
    }).catch(function(error){NX_PENDING=null;throw error;});
  }
  return NX_PENDING;
}
function NX_FAIL(){
  try{ if(typeof window.toast==='function') window.toast('Leçons indisponibles pour le moment. Vérifiez votre connexion, puis réessayez.'); }catch(_e){window.nxLog&&window.nxLog(_e)}
}

  var SUBJECT_PRESENTATION={
    entretien:{icon:'☀️',eyebrow:'Rituel quotidien',short:'Parler, observer et bien commencer la journée.'},
    francais:{icon:'📚',eyebrow:'Lecture et étude de la langue',short:'Lire, comprendre, étudier la langue, s’exprimer et rédiger avec méthode.'},
    calcul:{icon:'🧮',eyebrow:'Numération et calcul écrit',short:'Comprendre les nombres, calculer, mesurer, raisonner et résoudre des problèmes.'},
    sciences:{icon:'🔬',eyebrow:'Sciences d’observation',short:'Observer le vivant, le corps, la matière, l’eau, l’air et le milieu.'},
    histoire:{icon:'🏺',eyebrow:'Temps et histoire locale',short:'Étudier les générations, les témoignages, la chronologie et le patrimoine.'},
    geographie:{icon:'🗺️',eyebrow:'Espace et milieu',short:'Lire un plan, s’orienter et observer reliefs, eaux, habitats et activités.'},
    ecm:{icon:'🤝',eyebrow:'Droits, devoirs et citoyenneté',short:'Respecter les différences, agir avec responsabilité et protéger le bien commun.'},
    arts:{icon:'🎨',eyebrow:'Créer et s’exprimer',short:'Chanter, dessiner, modeler et reconnaître les couleurs.'},
    eps:{icon:'🏃',eyebrow:'Bouger et grandir',short:'Marcher, courir, sauter et respecter les règles du jeu.'},
    'arts-eps':{icon:'🎨',eyebrow:'Arts, chant et activités physiques',short:'Créer, chanter, coordonner ses gestes, coopérer et pratiquer le fair-play.'}
  };

  function cp1SubjectMeta(id){return SUBJECT_PRESENTATION[id]||{icon:'📘',eyebrow:'Matière',short:'Apprendre avec des images, une voix et une activité simple.'};}
  var PRIMARY_ART_LIB={
    "balance":"<path d=\"M80 22v62\" stroke=\"#8b5e3c\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M30 34h100\" stroke=\"#8b5e3c\" stroke-width=\"6\" stroke-linecap=\"round\"/><circle cx=\"80\" cy=\"22\" r=\"7\" fill=\"#e2574c\"/><path d=\"M30 34l-14 24h28z\" fill=\"#94a3b8\"/><path d=\"M130 34l-14 24h28z\" fill=\"#94a3b8\"/><rect x=\"60\" y=\"84\" width=\"40\" height=\"12\" rx=\"4\" fill=\"#8b5e3c\"/><circle cx=\"30\" cy=\"46\" r=\"6\" fill=\"#2f7fd1\"/><circle cx=\"126\" cy=\"46\" r=\"9\" fill=\"#e2574c\"/>",
    "balance-child":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M30 96h100\" stroke=\"#e2574c\" stroke-width=\"6\" stroke-linecap=\"round\"/><circle cx=\"80\" cy=\"24\" r=\"13\" fill=\"#c98b5e\"/><path d=\"M68 18c6-10 22-10 26 2-8-4-18-4-26-2z\" fill=\"#1f3d5c\"/><path d=\"M73 38h14v30H73z\" fill=\"#2f7fd1\"/><path d=\"M73 44H36M87 44h37\" stroke=\"#c98b5e\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M80 68v28\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M86 70l16-8\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/>",
    "ball-throw":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><circle cx=\"50\" cy=\"30\" r=\"13\" fill=\"#c98b5e\"/><path d=\"M38 24c6-10 22-10 26 2-8-4-18-4-26-2z\" fill=\"#1f3d5c\"/><path d=\"M44 44h14l4 30H42z\" fill=\"#7fb069\"/><path d=\"M46 48l-16 14M60 48l24-16\" stroke=\"#c98b5e\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M48 74l-4 28M58 74l6 28\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/><circle cx=\"122\" cy=\"30\" r=\"18\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M122 12l0 36M104 30h36\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M88 30c10-10 20-14 30-14\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-dasharray=\"6 6\"/>",
    "bird":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><ellipse cx=\"76\" cy=\"62\" rx=\"30\" ry=\"22\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><circle cx=\"108\" cy=\"44\" r=\"14\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M120 44l14 5-14 6z\" fill=\"#f5b93b\"/><circle cx=\"112\" cy=\"41\" r=\"3\" fill=\"#1f3d5c\"/><path d=\"M60 56c14-8 30-4 34 8-14 8-28 6-34-8z\" fill=\"#bfe3f5\"/><path d=\"M46 62L18 46v32z\" fill=\"#e2574c\"/><path d=\"M78 84v20M92 84v20\" stroke=\"#f5b93b\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "book":"<path d=\"M80 30c-16-12-40-12-56-6v66c16-6 40-6 56 6z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M80 30c16-12 40-12 56-6v66c-16-6-40-6-56 6z\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M92 44h34\" stroke=\"#94a3b8\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><path d=\"M92 58h34\" stroke=\"#94a3b8\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><path d=\"M92 72h34\" stroke=\"#94a3b8\" stroke-width=\"3.5\" stroke-linecap=\"round\"/>",
    "cat":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><ellipse cx=\"80\" cy=\"76\" rx=\"30\" ry=\"22\" fill=\"#94a3b8\"/><circle cx=\"80\" cy=\"46\" r=\"22\" fill=\"#94a3b8\"/><path d=\"M62 32l-4-16 16 8zM98 32l4-16-16 8z\" fill=\"#94a3b8\"/><circle cx=\"72\" cy=\"44\" r=\"4\" fill=\"#1f3d5c\"/><circle cx=\"88\" cy=\"44\" r=\"4\" fill=\"#1f3d5c\"/><path d=\"M80 52l-5 5h10z\" fill=\"#e2574c\"/><path d=\"M54 48h-14M54 54h-12M106 48h14M106 54h12\" stroke=\"#fffdf5\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M110 84c16 0 18-18 8-24\" fill=\"none\" stroke=\"#94a3b8\" stroke-width=\"8\" stroke-linecap=\"round\"/>",
    "circle":"<circle cx=\"80\" cy=\"60\" r=\"44\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"5\"/><circle cx=\"80\" cy=\"60\" r=\"4\" fill=\"#8b5e3c\"/><path d=\"M80 60h44\" stroke=\"#8b5e3c\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/>",
    "clock":"<circle cx=\"80\" cy=\"60\" r=\"46\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"6\"/><circle cx=\"80\" cy=\"60\" r=\"4\" fill=\"#1f3d5c\"/><path d=\"M80 60V30\" stroke=\"#1f3d5c\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M80 60l24 14\" stroke=\"#e2574c\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M80 20v6M80 94v6M20 60h6M134 60h6\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "coins":"<ellipse cx=\"54\" cy=\"86\" rx=\"34\" ry=\"12\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><ellipse cx=\"54\" cy=\"74\" rx=\"34\" ry=\"12\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><ellipse cx=\"54\" cy=\"62\" rx=\"34\" ry=\"12\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><rect x=\"94\" y=\"40\" width=\"54\" height=\"34\" rx=\"5\" fill=\"#7fb069\" stroke=\"#3f7d3f\" stroke-width=\"3\"/><circle cx=\"121\" cy=\"57\" r=\"9\" fill=\"#fffdf5\"/><text x=\"99\" y=\"92\" font-size=\"12\" fill=\"#1f3d5c\" font-family=\"sans-serif\">GNF</text>",
    "compare":"<rect x=\"16\" y=\"52\" width=\"44\" height=\"44\" rx=\"8\" fill=\"#2f7fd1\"/><rect x=\"100\" y=\"26\" width=\"44\" height=\"70\" rx=\"8\" fill=\"#e2574c\"/><path d=\"M76 44l14 16-14 16\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text x=\"26\" y=\"114\" font-size=\"13\" fill=\"#1f3d5c\" font-family=\"sans-serif\">petit</text><text x=\"104\" y=\"114\" font-size=\"13\" fill=\"#1f3d5c\" font-family=\"sans-serif\">grand</text>",
    "craft":"<path d=\"M22 96l52-52 12 12-52 52z\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M74 44l16-16 12 12-16 16z\" fill=\"#94a3b8\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M104 22a20 20 0 1 1-2 30l-8-8 8-8 4 4 6-6-4-4z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M108 84h34M118 96h24\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "cube":"<path d=\"M46 46l34-20 34 20v40l-34 20-34-20z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M46 46l34 20 34-20M80 66v40\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"4\"/>",
    "divide-sign":"<circle cx=\"80\" cy=\"60\" r=\"44\" fill=\"#f5b93b\"/><path d=\"M56 60h48\" stroke=\"#fffdf5\" stroke-width=\"11\" stroke-linecap=\"round\"/><circle cx=\"80\" cy=\"42\" r=\"7\" fill=\"#fffdf5\"/><circle cx=\"80\" cy=\"78\" r=\"7\" fill=\"#fffdf5\"/>",
    "drum":"<path d=\"M46 40h68l-10 46H56z\" fill=\"#8b5e3c\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linejoin=\"round\"/><ellipse cx=\"80\" cy=\"40\" rx=\"34\" ry=\"12\" fill=\"#e8d5b5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M54 44l-4 38\" stroke=\"#f5b93b\" stroke-width=\"3\"/><path d=\"M67 44l-4 38\" stroke=\"#f5b93b\" stroke-width=\"3\"/><path d=\"M80 44l-4 38\" stroke=\"#f5b93b\" stroke-width=\"3\"/><path d=\"M93 44l-4 38\" stroke=\"#f5b93b\" stroke-width=\"3\"/><path d=\"M106 44l-4 38\" stroke=\"#f5b93b\" stroke-width=\"3\"/><path d=\"M18 26c8 10 8 22 0 32M142 26c-8 10-8 22 0 32\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M64 94h32\" stroke=\"#1f3d5c\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "ear":"<path d=\"M62 26c26-14 52 2 52 28 0 22-16 26-16 40 0 12-10 20-22 20-10 0-18-6-18-16\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M78 50c8-8 20-2 18 10-2 10-12 10-12 20\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M20 44c8 6 8 26 0 32M34 52c4 3 4 13 0 16\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "eye":"<path d=\"M14 60c22-30 110-30 132 0-22 30-110 30-132 0z\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><circle cx=\"80\" cy=\"60\" r=\"20\" fill=\"#2f7fd1\"/><circle cx=\"80\" cy=\"60\" r=\"9\" fill=\"#1f3d5c\"/><circle cx=\"87\" cy=\"53\" r=\"4\" fill=\"#fffdf5\"/>",
    "field":"<path d=\"M0 76h160v34H0z\" fill=\"#8b5e3c\"/><path d=\"M0 76c30-14 60-14 80 0 20 14 50 14 80 0\" fill=\"none\" stroke=\"#3f7d3f\" stroke-width=\"4\"/><path d=\"M16 76v-26M16 60l-8-8M16 60l8-8\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M40 76v-26M40 60l-8-8M40 60l8-8\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M64 76v-26M64 60l-8-8M64 60l8-8\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M88 76v-26M88 60l-8-8M88 60l8-8\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M112 76v-26M112 60l-8-8M112 60l8-8\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M136 76v-26M136 60l-8-8M136 60l8-8\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"4\" stroke-linecap=\"round\"/><circle cx=\"132\" cy=\"26\" r=\"14\" fill=\"#f5b93b\"/>",
    "fire":"<path d=\"M80 14c14 22 34 28 34 52a34 34 0 0 1-68 0c0-14 8-22 14-30 2 10 8 14 8 14-2-16 4-26 12-36z\" fill=\"#e2574c\"/><path d=\"M80 52c8 12 16 16 16 28a16 16 0 0 1-32 0c0-10 8-16 16-28z\" fill=\"#f5b93b\"/><path d=\"M30 104h100\" stroke=\"#8b5e3c\" stroke-width=\"7\" stroke-linecap=\"round\"/>",
    "fish":"<path d=\"M0 88h160\" stroke=\"#2f7fd1\" stroke-width=\"6\" opacity=\".4\"/><path d=\"M28 60c22-26 66-26 84 0-18 26-62 26-84 0z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M112 60l30-20v40z\" fill=\"#e2574c\"/><circle cx=\"52\" cy=\"54\" r=\"5\" fill=\"#fffdf5\"/><circle cx=\"52\" cy=\"54\" r=\"2.5\" fill=\"#1f3d5c\"/><path d=\"M74 40v-12M74 80v12\" stroke=\"#e2574c\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "flag-guinea":"<path d=\"M34 12v96\" stroke=\"#8b5e3c\" stroke-width=\"7\" stroke-linecap=\"round\"/><rect x=\"38\" y=\"18\" width=\"34\" height=\"56\" fill=\"#e2574c\"/><rect x=\"72\" y=\"18\" width=\"34\" height=\"56\" fill=\"#f5b93b\"/><rect x=\"106\" y=\"18\" width=\"34\" height=\"56\" fill=\"#7fb069\"/><rect x=\"38\" y=\"18\" width=\"102\" height=\"56\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"3\"/>",
    "foot":"<path d=\"M46 34c16-8 40-8 52 4 10 10 8 26 2 40-6 14-8 24-24 24-18 0-28-14-30-30-2-16-4-30 0-38z\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\" stroke-linejoin=\"round\"/><ellipse cx=\"52\" cy=\"30\" rx=\"9\" ry=\"7\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"3\"/><ellipse cx=\"72\" cy=\"24\" rx=\"8\" ry=\"6\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"3\"/><ellipse cx=\"90\" cy=\"26\" rx=\"7\" ry=\"6\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"3\"/><ellipse cx=\"105\" cy=\"32\" rx=\"6\" ry=\"5\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"3\"/><path d=\"M30 100h100\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "fruit-basket":"<path d=\"M28 60h104l-12 46H40z\" fill=\"#8b5e3c\"/><path d=\"M36 74h88M40 88h80\" stroke=\"#f5b93b\" stroke-width=\"4\" opacity=\".6\"/><ellipse cx=\"60\" cy=\"52\" rx=\"18\" ry=\"14\" fill=\"#e2574c\"/><ellipse cx=\"96\" cy=\"50\" rx=\"18\" ry=\"15\" fill=\"#f5b93b\"/><circle cx=\"80\" cy=\"40\" r=\"13\" fill=\"#7fb069\"/><path d=\"M80 28v-6M96 36c4-8 12-8 12-8\" fill=\"none\" stroke=\"#3f7d3f\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "goat":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><ellipse cx=\"74\" cy=\"60\" rx=\"34\" ry=\"22\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M52 80v24M70 82v22M88 82v22M104 80v24\" stroke=\"#1f3d5c\" stroke-width=\"8\" stroke-linecap=\"round\"/><ellipse cx=\"118\" cy=\"46\" rx=\"20\" ry=\"15\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M110 32c-2-14 4-20 10-22-4 8-4 16 0 22M126 32c4-14 12-16 18-14-8 4-12 10-12 18\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linecap=\"round\"/><circle cx=\"124\" cy=\"42\" r=\"3.5\" fill=\"#1f3d5c\"/><path d=\"M134 50c4 2 4 8 0 10\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M118 60c0 10 4 14 8 16\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M40 58c-8-2-12 4-8 10\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "greeting":"<circle cx=\"52\" cy=\"40\" r=\"17\" fill=\"#c98b5e\"/><path d=\"M35 34c4-14 30-14 34 0-10-6-24-6-34 0z\" fill=\"#1f3d5c\"/><path d=\"M28 100c0-20 10-32 24-32s24 12 24 32z\" fill=\"#2f7fd1\"/><circle cx=\"114\" cy=\"42\" r=\"15\" fill=\"#c98b5e\"/><path d=\"M92 100c0-18 10-28 22-28s22 10 22 28z\" fill=\"#e2574c\"/><path d=\"M74 62l18-14\" stroke=\"#c98b5e\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M92 48c-6-6-2-14 6-12\" fill=\"none\" stroke=\"#c98b5e\" stroke-width=\"8\" stroke-linecap=\"round\"/><path d=\"M40 18c4-8 12-8 14-2M124 20c4-8 12-6 12 0\" fill=\"none\" stroke=\"#f5b93b\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "group":"<circle cx=\"44\" cy=\"40\" r=\"15\" fill=\"#c98b5e\"/><path d=\"M20 100c0-18 10-28 24-28s24 10 24 28z\" fill=\"#2f7fd1\"/><circle cx=\"116\" cy=\"40\" r=\"15\" fill=\"#c98b5e\"/><path d=\"M92 100c0-18 10-28 24-28s24 10 24 28z\" fill=\"#e2574c\"/><circle cx=\"80\" cy=\"30\" r=\"17\" fill=\"#c98b5e\"/><path d=\"M52 100c0-20 12-32 28-32s28 12 28 32z\" fill=\"#f5b93b\"/>",
    "hand":"<path d=\"M56 100V56c0-6 10-6 10 0v-8c0-7 10-7 10 0v-6c0-7 10-7 10 0v8c0-6 10-6 10 0v34c0 14-10 24-24 24s-26-8-26-22z\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\" stroke-linejoin=\"round\"/>",
    "handshake":"<path d=\"M14 54l34-14 32 12 32-12 34 14v22l-30 24-36-14-36 14-30-24z\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M48 40v34M112 40v34\" stroke=\"#8a5a34\" stroke-width=\"3\" opacity=\".6\"/><path d=\"M62 62l18 10 18-10\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "handwash":"<path d=\"M60 44v40c0 12 10 20 22 20s22-8 22-20V44\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M60 52c-10-4-10-16 0-18M104 52c10-4 10-16 0-18\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"4\"/><rect x=\"66\" y=\"30\" width=\"32\" height=\"18\" rx=\"8\" fill=\"#bfe3f5\" stroke=\"#2f7fd1\" stroke-width=\"3\"/><circle cx=\"58\" cy=\"20\" r=\"5\" fill=\"#fffdf5\" stroke=\"#2f7fd1\" stroke-width=\"2\"/><circle cx=\"74\" cy=\"30\" r=\"4\" fill=\"#fffdf5\" stroke=\"#2f7fd1\" stroke-width=\"2\"/><circle cx=\"90\" cy=\"20\" r=\"5\" fill=\"#fffdf5\" stroke=\"#2f7fd1\" stroke-width=\"2\"/><circle cx=\"106\" cy=\"30\" r=\"4\" fill=\"#fffdf5\" stroke=\"#2f7fd1\" stroke-width=\"2\"/><circle cx=\"122\" cy=\"20\" r=\"5\" fill=\"#fffdf5\" stroke=\"#2f7fd1\" stroke-width=\"2\"/><path d=\"M28 66c0 12 6 20 12 24M132 66c0 12-6 20-12 24\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "head":"<circle cx=\"80\" cy=\"56\" r=\"36\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M44 48c6-24 66-24 72 0\" fill=\"#1f3d5c\"/><circle cx=\"66\" cy=\"58\" r=\"5\" fill=\"#1f3d5c\"/><circle cx=\"94\" cy=\"58\" r=\"5\" fill=\"#1f3d5c\"/><path d=\"M66 74c8 8 20 8 28 0\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "health":"<path d=\"M80 106c-30-20-46-36-46-56a26 26 0 0 1 46-16 26 26 0 0 1 46 16c0 20-16 36-46 56z\" fill=\"#e2574c\"/><path d=\"M80 40v40M60 60h40\" stroke=\"#fffdf5\" stroke-width=\"11\" stroke-linecap=\"round\"/>",
    "heart-lungs":"<path d=\"M56 30c-16 0-22 16-20 30 2 16 8 34 18 34 8 0 10-10 10-20V34c0-3-3-4-8-4z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M104 30c16 0 22 16 20 30-2 16-8 34-18 34-8 0-10-10-10-20V34c0-3 3-4 8-4z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M80 26v34\" stroke=\"#1f3d5c\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M80 96c-16-12-24-20-24-30 0-8 6-12 12-12 5 0 9 3 12 8 3-5 7-8 12-8 6 0 12 4 12 12 0 10-8 18-24 30z\" fill=\"#e2574c\"/>",
    "hen":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><ellipse cx=\"72\" cy=\"66\" rx=\"36\" ry=\"28\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><ellipse cx=\"58\" cy=\"66\" rx=\"20\" ry=\"15\" fill=\"none\" stroke=\"#94a3b8\" stroke-width=\"3\"/><circle cx=\"110\" cy=\"40\" r=\"17\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M100 24c1-9 9-9 9-1 3-8 11-6 9 2 3-6 10-2 6 5z\" fill=\"#e2574c\"/><path d=\"M125 40l14 5-14 6z\" fill=\"#f5b93b\"/><circle cx=\"115\" cy=\"38\" r=\"3.5\" fill=\"#1f3d5c\"/><path d=\"M106 54c-1 8 3 12 9 12\" fill=\"none\" stroke=\"#e2574c\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M40 58c-10-6-16 2-10 12\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M66 94v10M88 94v10M60 104h14M82 104h14\" stroke=\"#f5b93b\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "house":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\"/><path d=\"M28 100V56h104v44z\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M18 58L80 20l62 38z\" fill=\"#e2574c\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linejoin=\"round\"/><rect x=\"68\" y=\"72\" width=\"24\" height=\"28\" fill=\"#8b5e3c\"/><rect x=\"40\" y=\"68\" width=\"18\" height=\"16\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><rect x=\"102\" y=\"68\" width=\"18\" height=\"16\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"3\"/>",
    "jumping-child":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M110 104V72\" stroke=\"#8b5e3c\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M96 72h28\" stroke=\"#e2574c\" stroke-width=\"7\" stroke-linecap=\"round\"/><circle cx=\"56\" cy=\"24\" r=\"13\" fill=\"#c98b5e\"/><path d=\"M44 18c6-10 22-10 26 2-8-4-18-4-26-2z\" fill=\"#1f3d5c\"/><path d=\"M50 38h14l4 30H48z\" fill=\"#2f7fd1\"/><path d=\"M50 42l-20-8M66 42l22-14\" stroke=\"#c98b5e\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M54 68l-8 26M64 68l20 18\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/>",
    "lamp":"<path d=\"M80 14a30 30 0 0 1 18 54c-3 3-4 6-4 10H66c0-4-1-7-4-10A30 30 0 0 1 80 14z\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><rect x=\"66\" y=\"82\" width=\"28\" height=\"8\" rx=\"3\" fill=\"#94a3b8\"/><rect x=\"70\" y=\"92\" width=\"20\" height=\"8\" rx=\"3\" fill=\"#94a3b8\"/><path d=\"M80 14m0-8v-8\" stroke=\"#f5b93b\" stroke-width=\"5\" stroke-linecap=\"round\" transform=\"rotate(-60 80 44)\"/><path d=\"M80 14m0-8v-8\" stroke=\"#f5b93b\" stroke-width=\"5\" stroke-linecap=\"round\" transform=\"rotate(-30 80 44)\"/><path d=\"M80 14m0-8v-8\" stroke=\"#f5b93b\" stroke-width=\"5\" stroke-linecap=\"round\" transform=\"rotate(0 80 44)\"/><path d=\"M80 14m0-8v-8\" stroke=\"#f5b93b\" stroke-width=\"5\" stroke-linecap=\"round\" transform=\"rotate(30 80 44)\"/><path d=\"M80 14m0-8v-8\" stroke=\"#f5b93b\" stroke-width=\"5\" stroke-linecap=\"round\" transform=\"rotate(60 80 44)\"/>",
    "lion":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><circle cx=\"80\" cy=\"54\" r=\"40\" fill=\"#f5b93b\"/><circle cx=\"80\" cy=\"56\" r=\"27\" fill=\"#c98b5e\"/><circle cx=\"70\" cy=\"52\" r=\"4\" fill=\"#1f3d5c\"/><circle cx=\"90\" cy=\"52\" r=\"4\" fill=\"#1f3d5c\"/><path d=\"M80 62l-7 6h14z\" fill=\"#8a5a34\"/><path d=\"M80 68v6M80 74c-6 6-14 2-14-4M80 74c6 6 14 2 14-4\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"3\"/><path d=\"M52 66h-16M52 72h-14M108 66h16M108 72h14\" stroke=\"#fffdf5\" stroke-width=\"3\" stroke-linecap=\"round\"/>",
    "lizard":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M30 88c18-6 26-18 44-18s26 10 40 4c10-6 8-20-4-20\" fill=\"none\" stroke=\"#3f7d3f\" stroke-width=\"11\" stroke-linecap=\"round\"/><circle cx=\"112\" cy=\"52\" r=\"11\" fill=\"#7fb069\"/><circle cx=\"116\" cy=\"49\" r=\"3\" fill=\"#1f3d5c\"/><path d=\"M60 78l-10 16M84 74l8 18M42 84l-10 12M100 62l12 6\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "map-guinea":"<path d=\"M18 62c6-18 22-26 40-24 14 2 20-8 34-8 16 0 22 10 34 12 12 2 18 10 16 20-2 12-16 14-24 22-10 10-6 18-20 20-16 2-22-8-36-10-16-2-28 0-34-10-4-8-12-12-10-22z\" fill=\"#7fb069\" stroke=\"#3f7d3f\" stroke-width=\"4\" stroke-linejoin=\"round\"/><circle cx=\"46\" cy=\"72\" r=\"6\" fill=\"#e2574c\"/><text x=\"34\" y=\"94\" font-size=\"12\" fill=\"#1f3d5c\" font-family=\"sans-serif\">Conakry</text><path d=\"M126 26v14M120 32h12\" stroke=\"#1f3d5c\" stroke-width=\"3\" stroke-linecap=\"round\"/><text x=\"122\" y=\"24\" font-size=\"11\" fill=\"#1f3d5c\" font-family=\"sans-serif\">N</text>",
    "meal":"<circle cx=\"80\" cy=\"62\" r=\"42\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><circle cx=\"80\" cy=\"62\" r=\"31\" fill=\"#f4ead6\"/><path d=\"M62 46a20 20 0 0 1 36 8c-4 12-32 12-36-8z\" fill=\"#f5b93b\"/><ellipse cx=\"66\" cy=\"76\" rx=\"15\" ry=\"10\" fill=\"#7fb069\"/><ellipse cx=\"96\" cy=\"74\" rx=\"13\" ry=\"9\" fill=\"#e2574c\"/><path d=\"M20 30v34M20 30v20M28 30v20\" stroke=\"#94a3b8\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M140 30v64M140 30c8 6 8 22 0 26\" fill=\"none\" stroke=\"#94a3b8\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "minus-sign":"<circle cx=\"80\" cy=\"60\" r=\"44\" fill=\"#e2574c\"/><path d=\"M54 60h52\" stroke=\"#fffdf5\" stroke-width=\"12\" stroke-linecap=\"round\"/>",
    "mountain":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\"/><path d=\"M6 104l48-70 34 46 18-22 48 46z\" fill=\"#3f7d3f\"/><path d=\"M54 34l16 22H38z\" fill=\"#fffdf5\"/><circle cx=\"132\" cy=\"28\" r=\"13\" fill=\"#f5b93b\"/>",
    "mouth":"<circle cx=\"60\" cy=\"60\" r=\"34\" fill=\"#c98b5e\"/><path d=\"M44 68c10 12 22 12 32 0\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"5\" stroke-linecap=\"round\"/><circle cx=\"50\" cy=\"50\" r=\"4\" fill=\"#1f3d5c\"/><circle cx=\"70\" cy=\"50\" r=\"4\" fill=\"#1f3d5c\"/><path d=\"M102 44c10 6 10 26 0 32M118 34c16 10 16 42 0 52\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "nose":"<circle cx=\"80\" cy=\"60\" r=\"42\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M80 30c-4 20-10 28-16 34 6 6 14 8 16 8s10-2 16-8c-6-6-12-14-16-34z\" fill=\"#8a5a34\" opacity=\".35\"/><path d=\"M80 30v34\" stroke=\"#8a5a34\" stroke-width=\"4\" stroke-linecap=\"round\"/><ellipse cx=\"68\" cy=\"72\" rx=\"6\" ry=\"4\" fill=\"#8a5a34\"/><ellipse cx=\"92\" cy=\"72\" rx=\"6\" ry=\"4\" fill=\"#8a5a34\"/><path d=\"M124 40c8 6 8 20 0 26M138 32c12 10 12 38 0 48\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "notebook":"<rect x=\"30\" y=\"14\" width=\"100\" height=\"92\" rx=\"6\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><rect x=\"30\" y=\"14\" width=\"16\" height=\"92\" fill=\"#e2574c\"/><path d=\"M56 36h58\" stroke=\"#bfe3f5\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M56 52h58\" stroke=\"#bfe3f5\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M56 68h58\" stroke=\"#bfe3f5\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M56 84h58\" stroke=\"#bfe3f5\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M104 84l26-30 10 8-26 30-13 3z\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"3\" stroke-linejoin=\"round\"/>",
    "palette":"<path d=\"M80 16c38 0 62 22 62 46 0 16-16 20-26 20-8 0-14 4-14 12s-8 14-22 14c-34 0-62-24-62-48S42 16 80 16z\" fill=\"#f3e3c8\" stroke=\"#8b5e3c\" stroke-width=\"4\"/><circle cx=\"54\" cy=\"46\" r=\"9\" fill=\"#e2574c\"/><circle cx=\"82\" cy=\"38\" r=\"9\" fill=\"#f5b93b\"/><circle cx=\"110\" cy=\"48\" r=\"9\" fill=\"#2f7fd1\"/><circle cx=\"52\" cy=\"76\" r=\"9\" fill=\"#7fb069\"/><circle cx=\"80\" cy=\"86\" r=\"9\" fill=\"#8b5e3c\"/>",
    "pencil":"<path d=\"M24 96l10-30 74-52 20 28-74 52z\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M108 14l20 28 12-8-20-28z\" fill=\"#e2574c\" stroke=\"#8b5e3c\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M24 96l16-6-6-24z\" fill=\"#1f3d5c\"/>",
    "place-pin":"<path d=\"M80 14c-20 0-34 14-34 32 0 24 34 60 34 60s34-36 34-60c0-18-14-32-34-32z\" fill=\"#e2574c\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><circle cx=\"80\" cy=\"46\" r=\"13\" fill=\"#fffdf5\"/>",
    "plant-growth":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><ellipse cx=\"30\" cy=\"94\" rx=\"10\" ry=\"7\" fill=\"#8b5e3c\"/><path d=\"M30 88v-8\" stroke=\"#3f7d3f\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M80 100V64\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M80 74c-14 0-18-12-18-12s16-2 18 12z\" fill=\"#7fb069\"/><path d=\"M130 100V40\" stroke=\"#3f7d3f\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M130 56c-16 0-22-14-22-14s18-4 22 14zM130 70c16 0 22-14 22-14s-18-4-22 14z\" fill=\"#7fb069\"/><path d=\"M20 34l6 10 6-10\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"3\" stroke-linecap=\"round\"/>",
    "plant-parts":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M80 96V44\" stroke=\"#3f7d3f\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M80 96c-12 4-18 12-22 20M80 96c12 4 18 12 22 20M80 96v22\" fill=\"none\" stroke=\"#8b5e3c\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M80 66c-22 0-30-16-30-16s24-6 30 16zM80 78c22 0 30-16 30-16s-24-6-30 16z\" fill=\"#7fb069\"/><circle cx=\"80\" cy=\"36\" r=\"10\" fill=\"#e2574c\"/><ellipse cx=\"94.0\" cy=\"36.0\" rx=\"7\" ry=\"5\" fill=\"#f5b93b\" transform=\"rotate(0 94.0 36.0)\"/><ellipse cx=\"87.00239504435898\" cy=\"48.12297255802952\" rx=\"7\" ry=\"5\" fill=\"#f5b93b\" transform=\"rotate(60 87.00239504435898 48.12297255802952)\"/><ellipse cx=\"73.00479090818047\" cy=\"48.12712042332083\" rx=\"7\" ry=\"5\" fill=\"#f5b93b\" transform=\"rotate(120 73.00479090818047 48.12712042332083)\"/><ellipse cx=\"66.00000245866786\" cy=\"36.008297149771394\" rx=\"7\" ry=\"5\" fill=\"#f5b93b\" transform=\"rotate(180 66.00000245866786 36.008297149771394)\"/><ellipse cx=\"72.99042146261068\" cy=\"23.88117956531367\" rx=\"7\" ry=\"5\" fill=\"#f5b93b\" transform=\"rotate(240 72.99042146261068 23.88117956531367)\"/><ellipse cx=\"86.98802068229497\" cy=\"23.868735970896616\" rx=\"7\" ry=\"5\" fill=\"#f5b93b\" transform=\"rotate(300 86.98802068229497 23.868735970896616)\"/>",
    "plus-sign":"<circle cx=\"80\" cy=\"60\" r=\"44\" fill=\"#7fb069\"/><path d=\"M80 34v52M54 60h52\" stroke=\"#fffdf5\" stroke-width=\"12\" stroke-linecap=\"round\"/>",
    "rain-cloud":"<path d=\"M46 62a22 22 0 0 1 4-42 28 28 0 0 1 52-4 22 22 0 0 1 6 46z\" fill=\"#94a3b8\"/><path d=\"M50 74l-6 22\" stroke=\"#2f7fd1\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M70 74l-6 22\" stroke=\"#2f7fd1\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M90 74l-6 22\" stroke=\"#2f7fd1\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M110 74l-6 22\" stroke=\"#2f7fd1\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M130 74l-6 22\" stroke=\"#2f7fd1\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "rectangle":"<rect x=\"18\" y=\"34\" width=\"124\" height=\"52\" fill=\"#e2574c\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><path d=\"M18 34h124\" stroke=\"#fffdf5\" stroke-width=\"4\" stroke-dasharray=\"8 6\"/>",
    "right-angle":"<path d=\"M30 96V24M30 96h100\" stroke=\"#1f3d5c\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M30 76h20v20\" fill=\"none\" stroke=\"#e2574c\" stroke-width=\"5\"/>",
    "river":"<path d=\"M0 70h160v40H0z\" fill=\"#2f7fd1\"/><path d=\"M0 70c26-12 52 12 80 0s54-12 80 0\" fill=\"none\" stroke=\"#fffdf5\" stroke-width=\"4\"/><path d=\"M0 90c26-10 52 10 80 0s54-10 80 0\" fill=\"none\" stroke=\"#fffdf5\" stroke-width=\"4\" opacity=\".7\"/><path d=\"M0 70h160\" stroke=\"#3f7d3f\" stroke-width=\"6\"/><path d=\"M20 70V50l14 20zM126 70V46l16 24z\" fill=\"#7fb069\"/>",
    "road-cross":"<path d=\"M0 26h160v68H0z\" fill=\"#94a3b8\"/><rect x=\"16\" y=\"34\" width=\"16\" height=\"52\" fill=\"#fffdf5\"/><rect x=\"42\" y=\"34\" width=\"16\" height=\"52\" fill=\"#fffdf5\"/><rect x=\"68\" y=\"34\" width=\"16\" height=\"52\" fill=\"#fffdf5\"/><rect x=\"94\" y=\"34\" width=\"16\" height=\"52\" fill=\"#fffdf5\"/><rect x=\"120\" y=\"34\" width=\"16\" height=\"52\" fill=\"#fffdf5\"/><circle cx=\"132\" cy=\"20\" r=\"10\" fill=\"#c98b5e\"/><path d=\"M132 30v26M132 38l-12 8M132 38l12 8M132 56l-8 24M132 56l10 24\" stroke=\"#2f7fd1\" stroke-width=\"5\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M0 20h160M0 100h160\" stroke=\"#1f3d5c\" stroke-width=\"5\"/>",
    "ruler":"<rect x=\"10\" y=\"46\" width=\"140\" height=\"30\" rx=\"5\" fill=\"#f5b93b\"/><rect x=\"10\" y=\"46\" width=\"140\" height=\"30\" rx=\"5\" fill=\"none\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M20 46v14\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M33 46v9\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M46 46v14\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M59 46v9\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M72 46v14\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M85 46v9\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M98 46v14\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M111 46v9\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M124 46v14\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M137 46v9\" stroke=\"#8b5e3c\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><text x=\"24\" y=\"70\" font-size=\"11\" fill=\"#8b5e3c\" font-family=\"sans-serif\">0</text><text x=\"128\" y=\"70\" font-size=\"11\" fill=\"#8b5e3c\" font-family=\"sans-serif\">10</text>",
    "rules-board":"<rect x=\"26\" y=\"12\" width=\"108\" height=\"86\" rx=\"8\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><rect x=\"26\" y=\"12\" width=\"108\" height=\"18\" rx=\"8\" fill=\"#2f7fd1\"/><g><circle cx=\"46\" cy=\"48\" r=\"6\" fill=\"#7fb069\"/><path d=\"M43 48l3 3 5-6\" fill=\"none\" stroke=\"#fffdf5\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M60 48h56\" stroke=\"#94a3b8\" stroke-width=\"4\" stroke-linecap=\"round\"/></g><g><circle cx=\"46\" cy=\"66\" r=\"6\" fill=\"#7fb069\"/><path d=\"M43 66l3 3 5-6\" fill=\"none\" stroke=\"#fffdf5\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M60 66h56\" stroke=\"#94a3b8\" stroke-width=\"4\" stroke-linecap=\"round\"/></g><g><circle cx=\"46\" cy=\"84\" r=\"6\" fill=\"#7fb069\"/><path d=\"M43 84l3 3 5-6\" fill=\"none\" stroke=\"#fffdf5\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M60 84h56\" stroke=\"#94a3b8\" stroke-width=\"4\" stroke-linecap=\"round\"/></g><path d=\"M70 98v10h20V98\" fill=\"none\" stroke=\"#8b5e3c\" stroke-width=\"5\"/>",
    "running-child":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><circle cx=\"96\" cy=\"26\" r=\"13\" fill=\"#c98b5e\"/><path d=\"M84 20c6-10 22-10 26 2-8-4-18-4-26-2z\" fill=\"#1f3d5c\"/><path d=\"M92 40l-14 30 16 6 8-24z\" fill=\"#e2574c\"/><path d=\"M94 44l22 8\" stroke=\"#c98b5e\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M88 44l-22-4\" stroke=\"#c98b5e\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M94 74l16 26\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M84 74l-18 12 4 16\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M18 44h26M12 60h30M22 76h22\" stroke=\"#2f7fd1\" stroke-width=\"5\" stroke-linecap=\"round\" opacity=\".75\"/>",
    "school":"<path d=\"M0 100h160\" stroke=\"#3f7d3f\" stroke-width=\"6\"/><path d=\"M22 100V52l58-30 58 30v48z\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M14 54L80 20l66 34\" fill=\"none\" stroke=\"#e2574c\" stroke-width=\"7\" stroke-linejoin=\"round\"/><rect x=\"68\" y=\"70\" width=\"24\" height=\"30\" fill=\"#8b5e3c\"/><rect x=\"36\" y=\"64\" width=\"20\" height=\"18\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><rect x=\"104\" y=\"64\" width=\"20\" height=\"18\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M80 22V8M80 8h16v8H80z\" fill=\"#e2574c\" stroke=\"#e2574c\" stroke-width=\"2\"/>",
    "schoolbag":"<rect x=\"34\" y=\"40\" width=\"92\" height=\"66\" rx=\"14\" fill=\"#e2574c\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M52 40c0-20 56-20 56 0\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"6\"/><rect x=\"52\" y=\"66\" width=\"56\" height=\"30\" rx=\"8\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><rect x=\"72\" y=\"58\" width=\"16\" height=\"14\" rx=\"4\" fill=\"#1f3d5c\"/>",
    "shower":"<path d=\"M80 12v20\" stroke=\"#94a3b8\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M56 32h48l-8 12H64z\" fill=\"#94a3b8\"/><path d=\"M60 50v16\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M70 50v26\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M80 50v16\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M90 50v26\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M100 50v16\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M110 50v26\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M34 100c0-14 20-14 20 0zM66 100c0-16 26-16 26 0zM100 100c0-14 22-14 22 0z\" fill=\"#bfe3f5\"/><path d=\"M20 104h120\" stroke=\"#1f3d5c\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "singing":"<circle cx=\"58\" cy=\"46\" r=\"24\" fill=\"#c98b5e\"/><path d=\"M34 40c6-18 42-18 48 0-12-8-36-8-48 0z\" fill=\"#1f3d5c\"/><ellipse cx=\"58\" cy=\"58\" rx=\"8\" ry=\"11\" fill=\"#8a5a34\"/><circle cx=\"48\" cy=\"42\" r=\"3.5\" fill=\"#1f3d5c\"/><circle cx=\"68\" cy=\"42\" r=\"3.5\" fill=\"#1f3d5c\"/><path d=\"M28 104c0-18 12-28 30-28s30 10 30 28z\" fill=\"#2f7fd1\"/><path d=\"M108 62V26l22-6v36\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><circle cx=\"104\" cy=\"64\" r=\"7\" fill=\"#1f3d5c\"/><circle cx=\"126\" cy=\"58\" r=\"7\" fill=\"#1f3d5c\"/>",
    "slate":"<rect x=\"20\" y=\"14\" width=\"120\" height=\"92\" rx=\"10\" fill=\"#8b5e3c\"/><rect x=\"32\" y=\"26\" width=\"96\" height=\"68\" rx=\"5\" fill=\"#20323d\"/><path d=\"M48 48h60M48 66h40\" stroke=\"#fffdf5\" stroke-width=\"5\" stroke-linecap=\"round\"/><rect x=\"112\" y=\"72\" width=\"22\" height=\"9\" rx=\"4\" fill=\"#fffdf5\" transform=\"rotate(-12 123 76)\"/>",
    "soil":"<path d=\"M0 46h160v64H0z\" fill=\"#8b5e3c\"/><path d=\"M0 46h160\" stroke=\"#3f7d3f\" stroke-width=\"8\"/><circle cx=\"18\" cy=\"68\" r=\"6\" fill=\"#6b4526\"/><circle cx=\"44\" cy=\"82\" r=\"6\" fill=\"#6b4526\"/><circle cx=\"70\" cy=\"96\" r=\"6\" fill=\"#6b4526\"/><circle cx=\"96\" cy=\"68\" r=\"6\" fill=\"#6b4526\"/><circle cx=\"122\" cy=\"82\" r=\"6\" fill=\"#6b4526\"/><circle cx=\"148\" cy=\"96\" r=\"6\" fill=\"#6b4526\"/><path d=\"M52 46v-16M52 34l-8-6M52 34l8-6M108 46V26\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "square":"<rect x=\"42\" y=\"22\" width=\"76\" height=\"76\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"5\"/>",
    "stop-sign":"<path d=\"M56 16h48l40 40v48l-40 40H56L16 104V56z\" fill=\"#e2574c\" stroke=\"#fffdf5\" stroke-width=\"6\"/><path d=\"M46 60h68\" stroke=\"#fffdf5\" stroke-width=\"12\" stroke-linecap=\"round\"/>",
    "sun":"<circle cx=\"80\" cy=\"60\" r=\"30\" fill=\"#f5b93b\"/><path d=\"M80 60m0-46v-10\" stroke=\"#f5b93b\" stroke-width=\"7\" stroke-linecap=\"round\" transform=\"rotate(0 80 60)\"/><path d=\"M80 60m0-46v-10\" stroke=\"#f5b93b\" stroke-width=\"7\" stroke-linecap=\"round\" transform=\"rotate(45 80 60)\"/><path d=\"M80 60m0-46v-10\" stroke=\"#f5b93b\" stroke-width=\"7\" stroke-linecap=\"round\" transform=\"rotate(90 80 60)\"/><path d=\"M80 60m0-46v-10\" stroke=\"#f5b93b\" stroke-width=\"7\" stroke-linecap=\"round\" transform=\"rotate(135 80 60)\"/><path d=\"M80 60m0-46v-10\" stroke=\"#f5b93b\" stroke-width=\"7\" stroke-linecap=\"round\" transform=\"rotate(180 80 60)\"/><path d=\"M80 60m0-46v-10\" stroke=\"#f5b93b\" stroke-width=\"7\" stroke-linecap=\"round\" transform=\"rotate(225 80 60)\"/><path d=\"M80 60m0-46v-10\" stroke=\"#f5b93b\" stroke-width=\"7\" stroke-linecap=\"round\" transform=\"rotate(270 80 60)\"/><path d=\"M80 60m0-46v-10\" stroke=\"#f5b93b\" stroke-width=\"7\" stroke-linecap=\"round\" transform=\"rotate(315 80 60)\"/>",
    "tens-units":"<g transform=\"translate(8 26)\"><path d=\"M0 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M4 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M8 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M12 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M16 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M-3 22h24\" stroke=\"#e2574c\" stroke-width=\"4\"/></g><g transform=\"translate(38 26)\"><path d=\"M0 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M4 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M8 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M12 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M16 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M-3 22h24\" stroke=\"#e2574c\" stroke-width=\"4\"/></g><g transform=\"translate(68 26)\"><path d=\"M0 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M4 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M8 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M12 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M16 0v52\" stroke=\"#8b5e3c\" stroke-width=\"3\"/><path d=\"M-3 22h24\" stroke=\"#e2574c\" stroke-width=\"4\"/></g><text x=\"14\" y=\"98\" font-size=\"14\" fill=\"#1f3d5c\" font-family=\"sans-serif\">3 dizaines</text><circle cx=\"112\" cy=\"40\" r=\"7\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"2\"/><circle cx=\"126\" cy=\"40\" r=\"7\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"2\"/><circle cx=\"140\" cy=\"62\" r=\"7\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"2\"/><circle cx=\"154\" cy=\"62\" r=\"7\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"2\"/><text x=\"108\" y=\"98\" font-size=\"14\" fill=\"#1f3d5c\" font-family=\"sans-serif\">4 unités</text>",
    "times-sign":"<circle cx=\"80\" cy=\"60\" r=\"44\" fill=\"#2f7fd1\"/><path d=\"M62 42l36 36M98 42l-36 36\" stroke=\"#fffdf5\" stroke-width=\"12\" stroke-linecap=\"round\"/>",
    "tongue":"<path d=\"M32 46c0-16 96-16 96 0 0 30-20 50-48 50S32 76 32 46z\" fill=\"#e2574c\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M80 52v40\" stroke=\"#1f3d5c\" stroke-width=\"3\" opacity=\".4\"/><rect x=\"40\" y=\"34\" width=\"80\" height=\"12\" rx=\"6\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"3\"/>",
    "toothbrush":"<path d=\"M24 78l72-24 6 16-72 24z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M100 50v-16\" stroke=\"#fffdf5\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M108 48v-16\" stroke=\"#fffdf5\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M116 46v-16\" stroke=\"#fffdf5\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M124 44v-16\" stroke=\"#fffdf5\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M132 42v-16\" stroke=\"#fffdf5\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M96 54l44-14 6 18-44 14z\" fill=\"#e2574c\" stroke=\"#1f3d5c\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M112 26c8-8 20-4 18 6\" fill=\"none\" stroke=\"#fffdf5\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "tree":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M74 104V62h12v42z\" fill=\"#8b5e3c\"/><circle cx=\"80\" cy=\"46\" r=\"30\" fill=\"#7fb069\"/><circle cx=\"54\" cy=\"56\" r=\"20\" fill=\"#3f7d3f\"/><circle cx=\"106\" cy=\"56\" r=\"20\" fill=\"#3f7d3f\"/><circle cx=\"80\" cy=\"34\" r=\"18\" fill=\"#7fb069\"/>",
    "triangle":"<path d=\"M80 20l58 80H22z\" fill=\"#7fb069\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linejoin=\"round\"/>",
    "vote-box":"<path d=\"M32 46h96v58H32z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M52 46h56v10H52z\" fill=\"#1f3d5c\"/><rect x=\"60\" y=\"12\" width=\"40\" height=\"30\" rx=\"3\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"3\" transform=\"rotate(-10 80 27)\"/><path d=\"M68 26l6 6 12-12\" fill=\"none\" stroke=\"#3f7d3f\" stroke-width=\"4\" stroke-linecap=\"round\" transform=\"rotate(-10 80 27)\"/>",
    "walking-child":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><circle cx=\"80\" cy=\"26\" r=\"13\" fill=\"#c98b5e\"/><path d=\"M68 20c6-10 22-10 26 2-8-4-18-4-26-2z\" fill=\"#1f3d5c\"/><path d=\"M73 40h14v30H73z\" fill=\"#2f7fd1\"/><path d=\"M73 46l-14 18M87 46l14 14\" stroke=\"#c98b5e\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M76 70l-12 30M84 70l14 30\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/>",
    "warmup-child":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\" stroke-linecap=\"round\"/><circle cx=\"80\" cy=\"26\" r=\"13\" fill=\"#c98b5e\"/><path d=\"M68 20c6-10 22-10 26 2-8-4-18-4-26-2z\" fill=\"#1f3d5c\"/><path d=\"M73 40h14v30H73z\" fill=\"#f5b93b\"/><path d=\"M73 46L44 26M87 46l29-20\" stroke=\"#c98b5e\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M75 70l-12 30M85 70l12 30\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M40 40a14 14 0 0 1 0-16M120 40a14 14 0 0 0 0-16\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "waste-bin":"<path d=\"M46 38h68l-8 68H54z\" fill=\"#3f7d3f\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linejoin=\"round\"/><rect x=\"38\" y=\"26\" width=\"84\" height=\"14\" rx=\"6\" fill=\"#7fb069\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><rect x=\"68\" y=\"16\" width=\"24\" height=\"10\" rx=\"4\" fill=\"#7fb069\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M66 54v38M80 54v38M94 54v38\" stroke=\"#fffdf5\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\".8\"/><path d=\"M126 26c8-10 20-6 18 4\" fill=\"none\" stroke=\"#f5b93b\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "water-drop":"<path d=\"M80 12c22 30 34 44 34 60a34 34 0 0 1-68 0c0-16 12-30 34-60z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M64 72c0 12 8 20 18 21\" fill=\"none\" stroke=\"#fffdf5\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "wind":"<path d=\"M14 40h78a16 16 0 1 0-16-18\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M14 66h96a16 16 0 1 1-16 18\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M14 92h56\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"7\" stroke-linecap=\"round\"/>",
    "alive-animal":"<rect x=\"0\" y=\"92\" width=\"160\" height=\"28\" fill=\"#cfe8b4\"/><ellipse cx=\"78\" cy=\"66\" rx=\"34\" ry=\"21\" fill=\"#c8956d\" stroke=\"#5b3a22\" stroke-width=\"3\"/><path d=\"M46 60l-14-6 6 14z\" fill=\"#c8956d\" stroke=\"#5b3a22\" stroke-width=\"3\"/><circle cx=\"40\" cy=\"52\" r=\"15\" fill=\"#d9a77c\" stroke=\"#5b3a22\" stroke-width=\"3\"/><path d=\"M32 40l-4-12 12 6z\" fill=\"#8b5e3c\" stroke=\"#5b3a22\" stroke-width=\"2\"/><circle cx=\"35\" cy=\"50\" r=\"2.6\" fill=\"#2b2118\"/><path d=\"M60 86v14M76 86v14M92 86v14M106 84v16\" stroke=\"#5b3a22\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M112 60c8-6 12-2 10 6\" stroke=\"#5b3a22\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M120 26c6-8 16-4 14 4 8-2 12 8 4 12l-20 2z\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"2\"/><path d=\"M126 46v10M122 52h8\" stroke=\"#8c2f28\" stroke-width=\"3\" stroke-linecap=\"round\"/>",
    "alive-plant":"<rect x=\"0\" y=\"92\" width=\"160\" height=\"28\" fill=\"#c8a271\"/><path d=\"M80 92V44\" stroke=\"#3f7d3f\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M80 64c-16 0-24-8-26-20 14-2 24 6 26 20z\" fill=\"#4f9b46\" stroke=\"#245c22\" stroke-width=\"3\"/><path d=\"M80 56c16 0 24-8 26-20-14-2-24 6-26 20z\" fill=\"#4f9b46\" stroke=\"#245c22\" stroke-width=\"3\"/><circle cx=\"80\" cy=\"34\" r=\"11\" fill=\"#f2b134\" stroke=\"#a9711c\" stroke-width=\"3\"/><path d=\"M80 92c-10 6-14 14-14 22M80 92c10 6 14 14 14 22\" stroke=\"#7a4b23\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M128 78V44M120 54l8-12 8 12\" stroke=\"#2f7fd1\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "stone":"<rect x=\"0\" y=\"94\" width=\"160\" height=\"26\" fill=\"#cfc6b4\"/><path d=\"M40 94l10-32 24-18 34 10 12 40z\" fill=\"#9aa0a6\" stroke=\"#4b5157\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M62 62l16 12-8 20\" stroke=\"#6d747a\" stroke-width=\"3\" fill=\"none\"/><path d=\"M104 56l6 22\" stroke=\"#6d747a\" stroke-width=\"3\" fill=\"none\"/>",
    "natural-object":"<rect x=\"0\" y=\"96\" width=\"160\" height=\"24\" fill=\"#cfe8b4\"/><path d=\"M18 96l8-22 20-12 24 8 8 26z\" fill=\"#9aa0a6\" stroke=\"#4b5157\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M120 96c-22-6-30-24-24-44 22 2 32 20 24 44z\" fill=\"#4f9b46\" stroke=\"#245c22\" stroke-width=\"3\"/><path d=\"M112 92c-4-16-4-26 0-36\" stroke=\"#245c22\" stroke-width=\"2.5\" fill=\"none\"/><circle cx=\"80\" cy=\"30\" r=\"12\" fill=\"#f2b134\" stroke=\"#a9711c\" stroke-width=\"3\"/>",
    "made-object":"<rect x=\"0\" y=\"96\" width=\"160\" height=\"24\" fill=\"#e3dccc\"/><path d=\"M44 44h56l-8 52H52z\" fill=\"#2f7fd1\" stroke=\"#1a4b80\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M40 44h64\" stroke=\"#1a4b80\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M52 44c0-16 40-16 40 0\" stroke=\"#7a4b23\" stroke-width=\"4\" fill=\"none\"/><rect x=\"112\" y=\"58\" width=\"10\" height=\"38\" rx=\"3\" fill=\"#7a4b23\" stroke=\"#4a2c12\" stroke-width=\"3\"/><path d=\"M104 58h26l-4-14h-18z\" fill=\"#9aa0a6\" stroke=\"#4b5157\" stroke-width=\"3\" stroke-linejoin=\"round\"/>",
    "brain":"<circle cx=\"80\" cy=\"60\" r=\"46\" fill=\"#f6e6df\" stroke=\"#8c5b4e\" stroke-width=\"3\"/><path d=\"M52 44c-6-10 6-18 14-12 2-10 18-12 22-2 12-6 22 4 18 14 10 4 8 18-2 20 2 12-12 18-20 10-8 8-22 2-20-10-10-2-14-14-12-20z\" fill=\"#e8a89a\" stroke=\"#8c2f28\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><path d=\"M66 40c4 8-2 12 0 20s-6 10-2 18M92 38c-4 8 2 14 0 20s6 12 2 18M80 34v52\" stroke=\"#8c2f28\" stroke-width=\"2.6\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M74 96c4 8 8 8 12 0\" stroke=\"#8c2f28\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/>",
    "bones":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#eef2f6\"/><circle cx=\"80\" cy=\"26\" r=\"15\" fill=\"#fffdf5\" stroke=\"#5b6673\" stroke-width=\"3\"/><circle cx=\"75\" cy=\"24\" r=\"3\" fill=\"#5b6673\"/><circle cx=\"86\" cy=\"24\" r=\"3\" fill=\"#5b6673\"/><path d=\"M80 41v50\" stroke=\"#5b6673\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M62 52h36M60 62h40M62 72h36\" stroke=\"#fffdf5\" stroke-width=\"8\" stroke-linecap=\"round\"/><path d=\"M62 52h36M60 62h40M62 72h36\" stroke=\"#5b6673\" stroke-width=\"2.5\" fill=\"none\"/><path d=\"M80 91l-16 24M80 91l16 24\" stroke=\"#fffdf5\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M80 91l-16 24M80 91l16 24\" stroke=\"#5b6673\" stroke-width=\"2.5\"/><path d=\"M80 46l-26 18M80 46l26 18\" stroke=\"#fffdf5\" stroke-width=\"8\" stroke-linecap=\"round\"/><path d=\"M80 46l-26 18M80 46l26 18\" stroke=\"#5b6673\" stroke-width=\"2.5\"/>",
    "muscles":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#fdf0ec\"/><path d=\"M54 92V56c0-14 10-24 26-24s26 10 26 24v36z\" fill=\"#e07a63\" stroke=\"#8c2f28\" stroke-width=\"3.5\"/><circle cx=\"80\" cy=\"22\" r=\"13\" fill=\"#f0c3a8\" stroke=\"#8c2f28\" stroke-width=\"3\"/><path d=\"M54 60c-14 4-18 16-14 28l12-4\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"3.5\"/><path d=\"M106 60c18 2 24 14 20 28l-14-4\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"3.5\"/><path d=\"M118 62c8-8 14-4 12 6\" stroke=\"#8c2f28\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M68 60c4 10 4 20 0 30M92 60c-4 10-4 20 0 30\" stroke=\"#8c2f28\" stroke-width=\"2.4\" fill=\"none\"/>",
    "joints":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#eef2f6\"/><path d=\"M46 22l20 34\" stroke=\"#fffdf5\" stroke-width=\"16\" stroke-linecap=\"round\"/><path d=\"M46 22l20 34\" stroke=\"#5b6673\" stroke-width=\"3\" fill=\"none\"/><path d=\"M94 100L74 66\" stroke=\"#fffdf5\" stroke-width=\"16\" stroke-linecap=\"round\"/><path d=\"M94 100L74 66\" stroke=\"#5b6673\" stroke-width=\"3\" fill=\"none\"/><circle cx=\"70\" cy=\"61\" r=\"17\" fill=\"#f2b134\" stroke=\"#a9711c\" stroke-width=\"4\"/><path d=\"M108 46a34 34 0 0 1 6 30\" stroke=\"#2f7fd1\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M114 76l-8-4 10-8z\" fill=\"#2f7fd1\"/>",
    "intestines":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#fdf0ec\"/><path d=\"M52 24h56v18H52z\" fill=\"#f0c3a8\" stroke=\"#8c2f28\" stroke-width=\"3\"/><path d=\"M80 42c-20 0-28 10-28 20s10 16 24 16 24 6 24 14-8 14-24 14\" fill=\"none\" stroke=\"#e07a63\" stroke-width=\"13\" stroke-linecap=\"round\"/><path d=\"M80 42c-20 0-28 10-28 20s10 16 24 16 24 6 24 14-8 14-24 14\" fill=\"none\" stroke=\"#8c2f28\" stroke-width=\"2.6\"/><path d=\"M112 44v52\" stroke=\"#e07a63\" stroke-width=\"11\" stroke-linecap=\"round\"/><path d=\"M112 44v52\" stroke=\"#8c2f28\" stroke-width=\"2.4\"/>",
    "blood-vessels":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#fdf0ec\"/><path d=\"M80 18c-10 0-16 8-16 16 0 12 16 18 16 18s16-6 16-18c0-8-6-16-16-16z\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"3\"/><path d=\"M74 52c-8 14-14 22-30 28M74 52c-4 16-4 28 0 44\" stroke=\"#e2574c\" stroke-width=\"7\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M88 52c8 14 14 22 30 28M88 52c4 16 4 28 0 44\" stroke=\"#2f7fd1\" stroke-width=\"7\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M44 80l-8 6M120 80l8 6\" stroke=\"#8c2f28\" stroke-width=\"3\" stroke-linecap=\"round\"/><text x=\"30\" y=\"30\" font-family=\"sans-serif\" font-size=\"13\" font-weight=\"700\" fill=\"#8c2f28\">rouge</text><text x=\"104\" y=\"30\" font-family=\"sans-serif\" font-size=\"13\" font-weight=\"700\" fill=\"#1a4b80\">bleu</text>",
    "nerves":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#f3f0fb\"/><circle cx=\"52\" cy=\"60\" r=\"18\" fill=\"#c9b6f0\" stroke=\"#5b3f9e\" stroke-width=\"3.5\"/><circle cx=\"52\" cy=\"60\" r=\"6\" fill=\"#5b3f9e\"/><path d=\"M34 48l-14-8M34 72l-14 8M52 42V26M52 78v16\" stroke=\"#5b3f9e\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M70 60h58\" stroke=\"#5b3f9e\" stroke-width=\"8\" stroke-linecap=\"round\"/><path d=\"M128 60l-10-8v16z\" fill=\"#5b3f9e\"/><path d=\"M88 60l6-10M104 60l6-10\" stroke=\"#8a72d0\" stroke-width=\"3.5\" stroke-linecap=\"round\"/>",
    "reflex":"<rect x=\"0\" y=\"94\" width=\"160\" height=\"26\" fill=\"#e3dccc\"/><path d=\"M26 60c8-14 26-14 34 0\" stroke=\"#e2574c\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M30 44c6 4 10 10 12 16M56 44c-6 4-10 10-12 16\" stroke=\"#f2b134\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M78 68c10-6 22-4 30 4l14 14\" fill=\"#f0c3a8\" stroke=\"#8c2f28\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><path d=\"M78 68l-14-8\" stroke=\"#8c2f28\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M96 44a26 26 0 0 1 24 8\" stroke=\"#2f7fd1\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M120 52l-10 2 6-10z\" fill=\"#2f7fd1\"/>",
    "solid-state":"<rect x=\"0\" y=\"90\" width=\"160\" height=\"30\" fill=\"#dfe8f0\"/><path d=\"M44 46l36-20 36 20v34l-36 20-36-20z\" fill=\"#bfe3f5\" stroke=\"#1a4b80\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M44 46l36 20 36-20M80 66v34\" stroke=\"#1a4b80\" stroke-width=\"3\" fill=\"none\"/><circle cx=\"66\" cy=\"58\" r=\"4\" fill=\"#1a4b80\"/><circle cx=\"94\" cy=\"58\" r=\"4\" fill=\"#1a4b80\"/><circle cx=\"80\" cy=\"80\" r=\"4\" fill=\"#1a4b80\"/>",
    "liquid-state":"<rect x=\"0\" y=\"98\" width=\"160\" height=\"22\" fill=\"#e3dccc\"/><path d=\"M52 26h56l-8 72H60z\" fill=\"none\" stroke=\"#5b6673\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M56 56h48l-6 42H62z\" fill=\"#2f7fd1\" opacity=\".75\"/><path d=\"M56 56c6 6 12-6 18 0s12-6 18 0 8-4 12 0\" stroke=\"#1a4b80\" stroke-width=\"3.5\" fill=\"none\" stroke-linecap=\"round\"/><circle cx=\"72\" cy=\"76\" r=\"3.5\" fill=\"#bfe3f5\"/><circle cx=\"90\" cy=\"86\" r=\"3\" fill=\"#bfe3f5\"/>",
    "vapor":"<rect x=\"0\" y=\"98\" width=\"160\" height=\"22\" fill=\"#e3dccc\"/><path d=\"M56 78h48v20H56z\" fill=\"#9aa0a6\" stroke=\"#4b5157\" stroke-width=\"3.5\"/><path d=\"M52 78h56\" stroke=\"#4b5157\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M66 72c-6-8 6-12 0-20s8-14 2-22M84 72c-6-8 6-12 0-20s8-14 2-22M102 72c-6-8 6-12 0-18\" stroke=\"#8fb8d8\" stroke-width=\"4.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M40 96c8 6 16 6 24 0\" stroke=\"#e2574c\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/>",
    "melting":"<rect x=\"0\" y=\"94\" width=\"160\" height=\"26\" fill=\"#e3dccc\"/><path d=\"M50 30h44l-6 34H56z\" fill=\"#bfe3f5\" stroke=\"#1a4b80\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M56 64c-4 14 0 22 16 22s24-8 20-22z\" fill=\"#2f7fd1\" opacity=\".8\" stroke=\"#1a4b80\" stroke-width=\"3\"/><path d=\"M62 68v10M78 70v10\" stroke=\"#1a4b80\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M112 92c-8-10 4-16-2-26 12 4 16 18 8 26z\" fill=\"#f2b134\" stroke=\"#a9711c\" stroke-width=\"3\"/><path d=\"M124 92c-6-8 2-12-2-20 10 4 12 14 6 20z\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"3\"/>",
    "dissolving":"<rect x=\"0\" y=\"98\" width=\"160\" height=\"22\" fill=\"#e3dccc\"/><path d=\"M50 30h60l-8 68H58z\" fill=\"none\" stroke=\"#5b6673\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M53 48h54l-6 50H59z\" fill=\"#2f7fd1\" opacity=\".55\"/><rect x=\"66\" y=\"52\" width=\"14\" height=\"14\" rx=\"3\" fill=\"#fffdf5\" stroke=\"#5b6673\" stroke-width=\"3\"/><rect x=\"86\" y=\"66\" width=\"9\" height=\"9\" rx=\"2\" fill=\"#fffdf5\" stroke=\"#5b6673\" stroke-width=\"2.5\"/><circle cx=\"72\" cy=\"82\" r=\"3\" fill=\"#fffdf5\"/><circle cx=\"88\" cy=\"88\" r=\"2.4\" fill=\"#fffdf5\"/><circle cx=\"80\" cy=\"76\" r=\"2\" fill=\"#fffdf5\"/><path d=\"M120 34v22\" stroke=\"#7a4b23\" stroke-width=\"5\" stroke-linecap=\"round\"/>",
    "mix-homogeneous":"<rect x=\"0\" y=\"98\" width=\"160\" height=\"22\" fill=\"#e3dccc\"/><path d=\"M54 30h52l-6 68H60z\" fill=\"none\" stroke=\"#5b6673\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M56 44h48l-5 54H61z\" fill=\"#c98a3a\"/><text x=\"80\" y=\"112\" text-anchor=\"middle\" font-family=\"sans-serif\" font-size=\"13\" font-weight=\"700\" fill=\"#4b5157\">une seule couleur</text>",
    "mix-heterogeneous":"<rect x=\"0\" y=\"98\" width=\"160\" height=\"22\" fill=\"#e3dccc\"/><path d=\"M54 30h52l-6 68H60z\" fill=\"none\" stroke=\"#5b6673\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M56 44h48l-5 54H61z\" fill=\"#bfe3f5\"/><circle cx=\"70\" cy=\"62\" r=\"6\" fill=\"#c98a3a\" stroke=\"#7a4b23\" stroke-width=\"2\"/><circle cx=\"92\" cy=\"72\" r=\"7\" fill=\"#c98a3a\" stroke=\"#7a4b23\" stroke-width=\"2\"/><circle cx=\"76\" cy=\"86\" r=\"5\" fill=\"#c98a3a\" stroke=\"#7a4b23\" stroke-width=\"2\"/><text x=\"80\" y=\"112\" text-anchor=\"middle\" font-family=\"sans-serif\" font-size=\"13\" font-weight=\"700\" fill=\"#4b5157\">on voit les morceaux</text>",
    "lever":"<rect x=\"0\" y=\"96\" width=\"160\" height=\"24\" fill=\"#e3dccc\"/><path d=\"M20 78h124\" stroke=\"#8b5e3c\" stroke-width=\"9\" stroke-linecap=\"round\" transform=\"rotate(-9 80 78)\"/><path d=\"M96 78l14 18H82z\" fill=\"#5b6673\" stroke=\"#3a4148\" stroke-width=\"3\" stroke-linejoin=\"round\"/><rect x=\"20\" y=\"42\" width=\"34\" height=\"26\" rx=\"4\" fill=\"#9aa0a6\" stroke=\"#4b5157\" stroke-width=\"3\"/><path d=\"M132 44v22\" stroke=\"#e2574c\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M132 68l-7-9h14z\" fill=\"#e2574c\"/>",
    "force":"<rect x=\"0\" y=\"96\" width=\"160\" height=\"24\" fill=\"#e3dccc\"/><rect x=\"76\" y=\"52\" width=\"44\" height=\"44\" rx=\"5\" fill=\"#c98a3a\" stroke=\"#7a4b23\" stroke-width=\"4\"/><path d=\"M22 74h44\" stroke=\"#e2574c\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M74 74l-16-11v22z\" fill=\"#e2574c\"/><path d=\"M120 60l10-10M120 74h16M120 88l10 10\" stroke=\"#9aa0a6\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "movement":"<rect x=\"0\" y=\"96\" width=\"160\" height=\"24\" fill=\"#e3dccc\"/><circle cx=\"106\" cy=\"76\" r=\"18\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"4\"/><path d=\"M100 70l12 12M112 70l-12 12\" stroke=\"#fff\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><path d=\"M28 62h40M20 76h48M28 90h40\" stroke=\"#2f7fd1\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M76 76l-14-9v18z\" fill=\"#2f7fd1\"/>",
    "runoff":"<path d=\"M0 120V60l60-34 100 20v74z\" fill=\"#c8a271\"/><path d=\"M0 60l60-34 100 20\" stroke=\"#7a4b23\" stroke-width=\"4\" fill=\"none\"/><path d=\"M50 40c-4 16-16 22-20 38s-8 24-14 34M76 44c-4 16-16 22-20 38s-6 22-10 32M104 50c-4 16-16 22-20 38s-6 20-10 30\" stroke=\"#2f7fd1\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M0 108h160v12H0z\" fill=\"#2f7fd1\" opacity=\".8\"/>",
    "rainfall":"<path d=\"M0 0h160v120H0z\" fill=\"#dfe8f0\"/><path d=\"M44 44c-14 0-22 8-22 18s10 16 22 16h64c14 0 22-8 22-18s-10-18-24-16c-4-14-20-20-32-12-8-4-22 0-30 12z\" fill=\"#9aa0a6\" stroke=\"#4b5157\" stroke-width=\"3.5\"/><path d=\"M48 86l-6 18M68 86l-6 18M88 86l-6 18M108 86l-6 18\" stroke=\"#2f7fd1\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M0 112h160v8H0z\" fill=\"#3f7d3f\"/>",
    "sandy-soil":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#f2e4c8\"/><rect x=\"0\" y=\"72\" width=\"160\" height=\"48\" fill=\"#e2c98d\" stroke=\"#a9711c\" stroke-width=\"3\"/><circle cx=\"30\" cy=\"86\" r=\"4\" fill=\"#c9a24a\"/><circle cx=\"54\" cy=\"98\" r=\"4.5\" fill=\"#c9a24a\"/><circle cx=\"82\" cy=\"84\" r=\"4\" fill=\"#c9a24a\"/><circle cx=\"108\" cy=\"100\" r=\"5\" fill=\"#c9a24a\"/><circle cx=\"132\" cy=\"86\" r=\"4\" fill=\"#c9a24a\"/><circle cx=\"66\" cy=\"112\" r=\"3.5\" fill=\"#c9a24a\"/><path d=\"M40 32c0 20 8 30 0 40M80 26c0 22 8 34 0 46M120 32c0 20 8 30 0 40\" stroke=\"#2f7fd1\" stroke-width=\"4.5\" fill=\"none\" stroke-linecap=\"round\"/>",
    "clay-soil":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#f3ded6\"/><rect x=\"0\" y=\"72\" width=\"160\" height=\"48\" fill=\"#b5654a\" stroke=\"#6d3524\" stroke-width=\"3\"/><path d=\"M22 84h116M22 100h116\" stroke=\"#8c452f\" stroke-width=\"3\"/><path d=\"M20 60c30 8 60-6 120 4v10H20z\" fill=\"#2f7fd1\" opacity=\".8\"/><path d=\"M50 30c0 14 6 20 0 26M100 30c0 14 6 20 0 26\" stroke=\"#2f7fd1\" stroke-width=\"4.5\" fill=\"none\" stroke-linecap=\"round\"/><text x=\"80\" y=\"114\" text-anchor=\"middle\" font-family=\"sans-serif\" font-size=\"12\" font-weight=\"700\" fill=\"#fff\">l’eau reste dessus</text>",
    "producer":"<rect x=\"0\" y=\"94\" width=\"160\" height=\"26\" fill=\"#c8a271\"/><circle cx=\"128\" cy=\"28\" r=\"15\" fill=\"#f2b134\" stroke=\"#a9711c\" stroke-width=\"3\"/><path d=\"M128 8v-6M148 28h6M142 14l4-4M142 42l4 4\" stroke=\"#f2b134\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M60 94V50\" stroke=\"#3f7d3f\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M60 66c-16 2-24-6-24-18 14-4 24 4 24 18z\" fill=\"#4f9b46\" stroke=\"#245c22\" stroke-width=\"3\"/><path d=\"M60 58c16 2 24-6 24-18-14-4-24 4-24 18z\" fill=\"#4f9b46\" stroke=\"#245c22\" stroke-width=\"3\"/><path d=\"M100 40a24 24 0 0 1-24 22\" stroke=\"#f2b134\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M76 62l10-6-2 12z\" fill=\"#f2b134\"/>",
    "consumer":"<rect x=\"0\" y=\"94\" width=\"160\" height=\"26\" fill=\"#cfe8b4\"/><path d=\"M24 90V54\" stroke=\"#3f7d3f\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M24 66c-12 0-18-6-18-14 10-2 18 4 18 14z\" fill=\"#4f9b46\" stroke=\"#245c22\" stroke-width=\"3\"/><ellipse cx=\"98\" cy=\"64\" rx=\"30\" ry=\"19\" fill=\"#c8956d\" stroke=\"#5b3a22\" stroke-width=\"3\"/><circle cx=\"66\" cy=\"52\" r=\"14\" fill=\"#d9a77c\" stroke=\"#5b3a22\" stroke-width=\"3\"/><circle cx=\"61\" cy=\"50\" r=\"2.5\" fill=\"#2b2118\"/><path d=\"M84 82v10M100 82v10M114 82v10\" stroke=\"#5b3a22\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M52 54H36\" stroke=\"#e2574c\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M36 54l10-7v14z\" fill=\"#e2574c\"/>",
    "predator":"<rect x=\"0\" y=\"94\" width=\"160\" height=\"26\" fill=\"#e2c98d\"/><circle cx=\"56\" cy=\"56\" r=\"26\" fill=\"#e0a340\" stroke=\"#8a5a12\" stroke-width=\"4\"/><path d=\"M30 56c-10 0-16 8-16 18 8 4 16 0 20-8z\" fill=\"#c98a3a\" stroke=\"#8a5a12\" stroke-width=\"3\"/><circle cx=\"48\" cy=\"50\" r=\"3.4\" fill=\"#2b2118\"/><circle cx=\"66\" cy=\"50\" r=\"3.4\" fill=\"#2b2118\"/><path d=\"M50 64h14l-7 8z\" fill=\"#8c2f28\"/><path d=\"M50 72l4 8M64 72l-4 8\" stroke=\"#fff\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M104 84c8-14 26-14 34 0\" stroke=\"#5b3a22\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/><circle cx=\"112\" cy=\"70\" r=\"8\" fill=\"#c8956d\" stroke=\"#5b3a22\" stroke-width=\"3\"/><path d=\"M96 60l-8 8\" stroke=\"#e2574c\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "mosquito":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#e8eef3\"/><ellipse cx=\"86\" cy=\"66\" rx=\"24\" ry=\"10\" fill=\"#5b4b3a\" stroke=\"#2b2118\" stroke-width=\"3\" transform=\"rotate(-14 86 66)\"/><circle cx=\"56\" cy=\"56\" r=\"11\" fill=\"#5b4b3a\" stroke=\"#2b2118\" stroke-width=\"3\"/><path d=\"M46 58L20 68\" stroke=\"#2b2118\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M52 46l-8-14M62 46l6-14\" stroke=\"#2b2118\" stroke-width=\"3\" stroke-linecap=\"round\"/><ellipse cx=\"86\" cy=\"44\" rx=\"26\" ry=\"9\" fill=\"#bfd6e8\" opacity=\".85\" stroke=\"#5b6673\" stroke-width=\"2\" transform=\"rotate(-16 86 44)\"/><ellipse cx=\"96\" cy=\"50\" rx=\"24\" ry=\"8\" fill=\"#bfd6e8\" opacity=\".7\" stroke=\"#5b6673\" stroke-width=\"2\" transform=\"rotate(10 96 50)\"/><path d=\"M76 76l-8 16M90 78l-4 18M102 74l8 18\" stroke=\"#2b2118\" stroke-width=\"3\" stroke-linecap=\"round\"/>",
    "clean-clothes":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#eef6fb\"/><path d=\"M10 34c24-10 40-10 60 0\" stroke=\"#7a4b23\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M56 40l16-8 12 8 12-8 16 8-8 16-8-4v40H72V52l-8 4z\" fill=\"#2f7fd1\" stroke=\"#1a4b80\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M10 34h140\" stroke=\"#7a4b23\" stroke-width=\"4\" stroke-linecap=\"round\"/><circle cx=\"130\" cy=\"28\" r=\"13\" fill=\"#f2b134\" stroke=\"#a9711c\" stroke-width=\"3\"/><path d=\"M28 60l6 6 12-14\" stroke=\"#3f7d3f\" stroke-width=\"6\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "towel":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#eef6fb\"/><path d=\"M14 30h132\" stroke=\"#7a4b23\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M44 30h72v66c-12 8-24 8-36 0-12 8-24 8-36 0z\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M44 52h72M44 66h72\" stroke=\"#fff\" stroke-width=\"5\"/><path d=\"M56 30v66M104 30v66\" stroke=\"#8c2f28\" stroke-width=\"2.5\" opacity=\".6\"/>",
    "clean-yard":"<rect x=\"0\" y=\"86\" width=\"160\" height=\"34\" fill=\"#c8a271\"/><rect x=\"0\" y=\"0\" width=\"160\" height=\"86\" fill=\"#dff0fb\"/><path d=\"M104 86l20-52\" stroke=\"#7a4b23\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M96 92c6-12 22-12 26 0z\" fill=\"#c98a3a\" stroke=\"#7a4b23\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M100 92l-4 12M110 92l-2 12M120 92l2 12\" stroke=\"#7a4b23\" stroke-width=\"3\" stroke-linecap=\"round\"/><circle cx=\"44\" cy=\"42\" r=\"11\" fill=\"#f0c3a8\" stroke=\"#8c2f28\" stroke-width=\"3\"/><path d=\"M44 54v22l-10 20M44 76l10 20M34 60l14 6 22-14\" stroke=\"#2f7fd1\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M18 96c8-6 14-6 20 0\" stroke=\"#3f7d3f\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/>",
    "closed-container":"<rect x=\"0\" y=\"98\" width=\"160\" height=\"22\" fill=\"#e3dccc\"/><path d=\"M52 44h56v54H52z\" fill=\"#bfe3f5\" stroke=\"#1a4b80\" stroke-width=\"4\"/><path d=\"M46 44h68\" stroke=\"#5b6673\" stroke-width=\"8\" stroke-linecap=\"round\"/><rect x=\"70\" y=\"26\" width=\"20\" height=\"12\" rx=\"3\" fill=\"#9aa0a6\" stroke=\"#4b5157\" stroke-width=\"3\"/><path d=\"M58 66h44\" stroke=\"#2f7fd1\" stroke-width=\"6\" opacity=\".7\"/><path d=\"M118 52l6 6 12-14\" stroke=\"#3f7d3f\" stroke-width=\"6\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "varied-meal":"<rect x=\"0\" y=\"94\" width=\"160\" height=\"26\" fill=\"#e3dccc\"/><ellipse cx=\"80\" cy=\"70\" rx=\"54\" ry=\"26\" fill=\"#fffdf5\" stroke=\"#5b6673\" stroke-width=\"4\"/><path d=\"M80 46a24 24 0 0 1 0 48z\" fill=\"#f2b134\" stroke=\"#a9711c\" stroke-width=\"3\"/><path d=\"M80 46a24 24 0 0 0-24 24h24z\" fill=\"#4f9b46\" stroke=\"#245c22\" stroke-width=\"3\"/><path d=\"M56 70a24 24 0 0 0 24 24V70z\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"3\"/><path d=\"M18 50v34M26 50v34\" stroke=\"#5b6673\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M140 50c6 4 6 14 0 18v16\" stroke=\"#5b6673\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/>",
    "rest":"<rect x=\"0\" y=\"0\" width=\"160\" height=\"120\" fill=\"#232a4a\"/><circle cx=\"34\" cy=\"28\" r=\"12\" fill=\"#f2e6b8\"/><circle cx=\"29\" cy=\"24\" r=\"10\" fill=\"#232a4a\"/><circle cx=\"120\" cy=\"22\" r=\"2.5\" fill=\"#fff\"/><circle cx=\"136\" cy=\"40\" r=\"2\" fill=\"#fff\"/><circle cx=\"104\" cy=\"38\" r=\"1.8\" fill=\"#fff\"/><rect x=\"24\" y=\"76\" width=\"112\" height=\"26\" rx=\"6\" fill=\"#8b5e3c\" stroke=\"#4a2c12\" stroke-width=\"3\"/><path d=\"M34 76h92v-12H34z\" fill=\"#e8eef3\" stroke=\"#5b6673\" stroke-width=\"3\"/><circle cx=\"52\" cy=\"58\" r=\"12\" fill=\"#f0c3a8\" stroke=\"#8c2f28\" stroke-width=\"3\"/><path d=\"M64 64h56v12H64z\" fill=\"#2f7fd1\" stroke=\"#1a4b80\" stroke-width=\"3\"/><text x=\"86\" y=\"46\" font-family=\"sans-serif\" font-size=\"18\" font-weight=\"700\" fill=\"#f2e6b8\">z z z</text>",
    "line-short":"<path d=\"M35 62h40\" stroke=\"#2f7fd1\" stroke-width=\"8\" stroke-linecap=\"round\"/><path d=\"M35 48v28M75 48v28\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><text x=\"55\" y=\"102\" text-anchor=\"middle\" font-size=\"16\" font-family=\"sans-serif\" fill=\"#1f3d5c\">court</text>",
    "line-long":"<path d=\"M20 62h120\" stroke=\"#e2574c\" stroke-width=\"8\" stroke-linecap=\"round\"/><path d=\"M20 48v28M140 48v28\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><text x=\"80\" y=\"102\" text-anchor=\"middle\" font-size=\"16\" font-family=\"sans-serif\" fill=\"#1f3d5c\">long</text>",
    "line-compare":"<path d=\"M22 42h45M22 82h116\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M22 42h45\" stroke=\"#2f7fd1\"/><path d=\"M22 82h116\" stroke=\"#e2574c\"/><path d=\"M76 35l12 10-12 10\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"5\"/>",
    "bell":"<path d=\"M48 78h64l-8-12V48a24 24 0 0 0-48 0v18z\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"4\"/><path d=\"M44 80h72\" stroke=\"#8b5e3c\" stroke-width=\"6\" stroke-linecap=\"round\"/><circle cx=\"80\" cy=\"91\" r=\"8\" fill=\"#e2574c\"/><path d=\"M124 42c10 8 10 28 0 36M138 34c15 14 15 38 0 52\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "cow":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\"/><rect x=\"30\" y=\"48\" width=\"78\" height=\"42\" rx=\"18\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M46 86v18M88 86v18\" stroke=\"#1f3d5c\" stroke-width=\"8\"/><ellipse cx=\"122\" cy=\"52\" rx=\"23\" ry=\"18\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M108 38l-12-12M136 38l12-12\" stroke=\"#8b5e3c\" stroke-width=\"5\"/><circle cx=\"128\" cy=\"49\" r=\"3\"/><path d=\"M52 54c12-8 24 2 20 14M84 72c10-8 20 0 14 12\" fill=\"#1f3d5c\"/><path d=\"M58 90v10h20V90\" fill=\"#e8b4b8\" stroke=\"#8c2f28\" stroke-width=\"3\"/>",
    "leg":"<path d=\"M58 18h42l-8 42 18 42H84L70 70l-8 32H38l18-48z\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><circle cx=\"78\" cy=\"61\" r=\"8\" fill=\"#f5b93b\"/>",
    "arm":"<path d=\"M30 70c18-30 36-38 52-22l18 18 18-30c5-8 17-2 13 7l-20 48c-3 8-14 10-20 4L68 72c-7-7-14-2-20 10z\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"5\" stroke-linejoin=\"round\"/><circle cx=\"101\" cy=\"76\" r=\"7\" fill=\"#f5b93b\"/>",
    "plant-root":"<path d=\"M0 64h160v56H0z\" fill=\"#8b5e3c\"/><path d=\"M80 62v38M80 76l-24 24M80 82l22 28M80 90l-8 24\" stroke=\"#f4ead6\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M80 64V30\" stroke=\"#3f7d3f\" stroke-width=\"7\"/>",
    "plant-stem":"<path d=\"M0 100h160\" stroke=\"#8b5e3c\" stroke-width=\"8\"/><path d=\"M80 100V22\" stroke=\"#3f7d3f\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M80 58c-20-18-34-8-36 8 18 4 30 0 36-8zM80 42c20-18 34-8 36 8-18 4-30 0-36-8z\" fill=\"#7fb069\"/>",
    "plant-leaf":"<path d=\"M34 88c2-52 48-72 92-60-4 48-44 76-92 60z\" fill=\"#7fb069\" stroke=\"#3f7d3f\" stroke-width=\"5\"/><path d=\"M38 88c28-22 54-38 84-56M72 64l-8-24M90 52l24 10\" stroke=\"#3f7d3f\" stroke-width=\"4\"/>",
    "plant-flower":"<path d=\"M80 108V62\" stroke=\"#3f7d3f\" stroke-width=\"7\"/><circle cx=\"80\" cy=\"48\" r=\"13\" fill=\"#f5b93b\"/><g fill=\"#e2574c\"><circle cx=\"80\" cy=\"23\" r=\"16\"/><circle cx=\"104\" cy=\"42\" r=\"16\"/><circle cx=\"95\" cy=\"70\" r=\"16\"/><circle cx=\"65\" cy=\"70\" r=\"16\"/><circle cx=\"56\" cy=\"42\" r=\"16\"/></g><circle cx=\"80\" cy=\"48\" r=\"13\" fill=\"#f5b93b\"/>",
    "valley":"<path d=\"M0 98L50 30l30 48 30-48 50 68z\" fill=\"#7fb069\" stroke=\"#3f7d3f\" stroke-width=\"4\"/><path d=\"M80 78v30\" stroke=\"#2f7fd1\" stroke-width=\"8\"/><path d=\"M68 92l12 16 12-16\" fill=\"#bfe3f5\"/>",
    "plain":"<path d=\"M0 72h160v48H0z\" fill=\"#7fb069\"/><path d=\"M0 72h160\" stroke=\"#3f7d3f\" stroke-width=\"5\"/><circle cx=\"126\" cy=\"28\" r=\"16\" fill=\"#f5b93b\"/><path d=\"M30 72V42M20 52h20\" stroke=\"#8b5e3c\" stroke-width=\"6\"/><circle cx=\"30\" cy=\"38\" r=\"14\" fill=\"#3f7d3f\"/>",
    "plateau":"<path d=\"M8 100l36-58h70l38 58z\" fill=\"#8b5e3c\" stroke=\"#5c3a21\" stroke-width=\"4\"/><path d=\"M44 42h70\" stroke=\"#7fb069\" stroke-width=\"12\"/><path d=\"M24 86h112\" stroke=\"#f4ead6\" stroke-width=\"3\" stroke-dasharray=\"8 6\"/>",
    "music-note":"<path d=\"M62 26v58M62 30l56-12v54\" stroke=\"#1f3d5c\" stroke-width=\"8\" stroke-linejoin=\"round\"/><ellipse cx=\"48\" cy=\"88\" rx=\"18\" ry=\"12\" fill=\"#2f7fd1\"/><ellipse cx=\"104\" cy=\"76\" rx=\"18\" ry=\"12\" fill=\"#e2574c\"/>",
    "sound-soft":"<path d=\"M24 68h22l24 20V32L46 52H24z\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M82 50c8 6 8 16 0 22\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"4\"/><text x=\"112\" y=\"72\" text-anchor=\"middle\" font-size=\"18\" font-family=\"sans-serif\" fill=\"#3f7d3f\">doux</text>",
    "sound-loud":"<path d=\"M18 68h22l24 20V32L40 52H18z\" fill=\"#e2574c\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M78 46c12 8 12 22 0 30M92 34c22 14 22 38 0 52M108 24c30 22 30 50 0 72\" fill=\"none\" stroke=\"#e2574c\" stroke-width=\"5\"/>",
    "blood-drop":"<path d=\"M80 14c16 28 32 44 32 62a32 32 0 0 1-64 0c0-18 16-34 32-62z\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"4\"/><circle cx=\"70\" cy=\"66\" r=\"6\" fill=\"#fffdf5\" opacity=\".7\"/>",
    "blood-flow":"<path d=\"M28 60h98\" stroke=\"#e2574c\" stroke-width=\"14\" stroke-linecap=\"round\"/><path d=\"M104 40l28 20-28 20\" fill=\"#e2574c\"/><g fill=\"#fffdf5\"><circle cx=\"50\" cy=\"60\" r=\"5\"/><circle cx=\"72\" cy=\"60\" r=\"5\"/><circle cx=\"94\" cy=\"60\" r=\"5\"/></g>",
    "wheel":"<circle cx=\"80\" cy=\"60\" r=\"44\" fill=\"#94a3b8\" stroke=\"#1f3d5c\" stroke-width=\"7\"/><circle cx=\"80\" cy=\"60\" r=\"12\" fill=\"#f5b93b\" stroke=\"#8b5e3c\" stroke-width=\"4\"/><path d=\"M80 18v30M80 72v30M38 60h30M92 60h30M50 30l21 21M89 69l21 21M110 30L89 51M71 69L50 90\" stroke=\"#1f3d5c\" stroke-width=\"4\"/>",
    "pulley":"<circle cx=\"80\" cy=\"34\" r=\"22\" fill=\"#94a3b8\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><circle cx=\"80\" cy=\"34\" r=\"6\" fill=\"#f5b93b\"/><path d=\"M58 34v54M102 34v72\" stroke=\"#8b5e3c\" stroke-width=\"5\"/><rect x=\"42\" y=\"84\" width=\"32\" height=\"24\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M80 10V2\" stroke=\"#1f3d5c\" stroke-width=\"6\"/>",
    "region-maritime":"<path d=\"M0 72c28-18 52 18 80 0s52 18 80 0v48H0z\" fill=\"#2f7fd1\"/><path d=\"M0 66h80l22 18H0z\" fill=\"#f5d28c\"/><circle cx=\"126\" cy=\"28\" r=\"15\" fill=\"#f5b93b\"/><path d=\"M42 66V32M42 42l-14-12M42 42l14-12\" stroke=\"#3f7d3f\" stroke-width=\"6\"/>",
    "region-moyenne":"<path d=\"M0 104l42-70 30 44 26-58 62 84z\" fill=\"#7fb069\" stroke=\"#3f7d3f\" stroke-width=\"4\"/><path d=\"M68 78c14 8 18 18 28 30\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"8\"/><path d=\"M28 54l14-20 10 14\" fill=\"#f4ead6\"/>",
    "region-haute":"<path d=\"M0 82h160v38H0z\" fill=\"#d89a5b\"/><path d=\"M0 82c32-16 56 8 82-4 28-12 50 10 78-2\" fill=\"none\" stroke=\"#7fb069\" stroke-width=\"12\"/><circle cx=\"122\" cy=\"24\" r=\"17\" fill=\"#f5b93b\"/><path d=\"M40 82V46M28 58h24\" stroke=\"#8b5e3c\" stroke-width=\"6\"/><circle cx=\"40\" cy=\"40\" r=\"15\" fill=\"#3f7d3f\"/>",
    "region-forestiere":"<rect x=\"0\" y=\"82\" width=\"160\" height=\"38\" fill=\"#3f7d3f\"/><g stroke=\"#5c3a21\" stroke-width=\"7\"><path d=\"M30 92V40\"/><path d=\"M76 96V30\"/><path d=\"M126 92V46\"/></g><g fill=\"#2f7d3f\"><circle cx=\"30\" cy=\"34\" r=\"25\"/><circle cx=\"76\" cy=\"24\" r=\"29\"/><circle cx=\"126\" cy=\"40\" r=\"25\"/></g><path d=\"M0 102c38-22 72 18 112-4 20-10 34-6 48 0\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"7\"/>"
    ,"hand-raised":"<circle cx=\"66\" cy=\"34\" r=\"17\" fill=\"#c98b5e\"/><path d=\"M42 108c0-30 10-48 24-48s26 18 26 48z\" fill=\"#2f7fd1\"/><path d=\"M84 68l28-44\" stroke=\"#c98b5e\" stroke-width=\"11\" stroke-linecap=\"round\"/><path d=\"M112 24v-12M106 14l6-8 6 8\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linecap=\"round\"/>",
    "thanks":"<circle cx=\"54\" cy=\"34\" r=\"16\" fill=\"#c98b5e\"/><path d=\"M30 108c0-28 10-46 24-46s24 18 24 46z\" fill=\"#2f7fd1\"/><path d=\"M76 72c14-18 30-18 44 0\" fill=\"none\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M112 34c-9-12-26-3-20 10 5 10 20 18 20 18s15-8 20-18c6-13-11-22-20-10z\" fill=\"#e2574c\"/>",
    "calendar":"<rect x=\"24\" y=\"24\" width=\"112\" height=\"82\" rx=\"10\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><path d=\"M24 48h112\" stroke=\"#2f7fd1\" stroke-width=\"12\"/><path d=\"M48 16v20M112 16v20\" stroke=\"#1f3d5c\" stroke-width=\"6\"/><g fill=\"#f5b93b\"><rect x=\"40\" y=\"62\" width=\"16\" height=\"12\" rx=\"2\"/><rect x=\"72\" y=\"62\" width=\"16\" height=\"12\" rx=\"2\"/><rect x=\"104\" y=\"62\" width=\"16\" height=\"12\" rx=\"2\"/><rect x=\"40\" y=\"84\" width=\"16\" height=\"12\" rx=\"2\"/><rect x=\"72\" y=\"84\" width=\"16\" height=\"12\" rx=\"2\"/></g>",
    "cloud":"<rect x=\"0\" y=\"92\" width=\"160\" height=\"28\" fill=\"#bfe3f5\"/><path d=\"M35 78c-16 0-22-24-7-32 5-19 34-24 46-8 14-21 50-11 50 14 22 4 18 26 2 26z\" fill=\"#e8eef3\" stroke=\"#5b6673\" stroke-width=\"4\"/><path d=\"M16 92h128\" stroke=\"#2f7fd1\" stroke-width=\"4\" opacity=\".45\"/>",
    "happy-child":"<circle cx=\"80\" cy=\"48\" r=\"34\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M47 40c6-24 60-24 66 0\" fill=\"#1f3d5c\"/><circle cx=\"68\" cy=\"50\" r=\"4\"/><circle cx=\"92\" cy=\"50\" r=\"4\"/><path d=\"M62 62c10 16 26 16 36 0\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M46 110c2-20 14-30 34-30s32 10 34 30z\" fill=\"#7fb069\"/>",
    "sad-child":"<circle cx=\"80\" cy=\"48\" r=\"34\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M47 40c6-24 60-24 66 0\" fill=\"#1f3d5c\"/><circle cx=\"68\" cy=\"50\" r=\"4\"/><circle cx=\"92\" cy=\"50\" r=\"4\"/><path d=\"M64 70c8-10 24-10 32 0\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M108 50c10 12 5 21-2 21-7 0-10-8 2-21z\" fill=\"#2f7fd1\"/><path d=\"M46 110c2-20 14-30 34-30s32 10 34 30z\" fill=\"#2f7fd1\"/>",
    "worried-child":"<circle cx=\"80\" cy=\"48\" r=\"34\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M47 39c6-24 60-24 66 0\" fill=\"#1f3d5c\"/><path d=\"M62 48l12 3M98 48l-12 3\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><ellipse cx=\"80\" cy=\"67\" rx=\"9\" ry=\"6\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M46 110c2-20 14-30 34-30s32 10 34 30z\" fill=\"#f5b93b\"/><text x=\"125\" y=\"40\" font-size=\"30\" font-family=\"sans-serif\" fill=\"#e2574c\">?</text>",
    "tired-child":"<circle cx=\"70\" cy=\"50\" r=\"32\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M39 40c6-22 56-22 62 0\" fill=\"#1f3d5c\"/><path d=\"M54 52h10M78 52h10\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M60 68h20\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M40 110c2-18 14-28 30-28s28 10 30 28z\" fill=\"#94a3b8\"/><text x=\"112\" y=\"42\" font-size=\"20\" font-family=\"sans-serif\" fill=\"#2f7fd1\">z z</text>",
    "thirsty-child":"<circle cx=\"54\" cy=\"42\" r=\"20\" fill=\"#c98b5e\"/><path d=\"M30 110c0-30 10-48 24-48s24 18 24 48z\" fill=\"#2f7fd1\"/><path d=\"M82 50h48l-6 48H88z\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M88 70h36\" stroke=\"#2f7fd1\" stroke-width=\"9\"/><path d=\"M70 66l20 8\" stroke=\"#c98b5e\" stroke-width=\"9\"/>",
    "hungry-child":"<circle cx=\"48\" cy=\"38\" r=\"19\" fill=\"#c98b5e\"/><path d=\"M26 110c0-30 8-50 22-50s24 20 24 50z\" fill=\"#e2574c\"/><ellipse cx=\"112\" cy=\"76\" rx=\"35\" ry=\"22\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><ellipse cx=\"112\" cy=\"76\" rx=\"22\" ry=\"12\" fill=\"#f5b93b\"/><path d=\"M68 68l22 6\" stroke=\"#c98b5e\" stroke-width=\"9\"/>",
    "toilet":"<rect x=\"30\" y=\"16\" width=\"100\" height=\"90\" rx=\"10\" fill=\"#e8eef3\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><circle cx=\"80\" cy=\"42\" r=\"11\" fill=\"#2f7fd1\"/><path d=\"M80 54v27M61 64h38M68 104l12-23 12 23\" stroke=\"#2f7fd1\" stroke-width=\"7\" stroke-linecap=\"round\"/><text x=\"80\" y=\"99\" text-anchor=\"middle\" font-size=\"12\" font-family=\"sans-serif\" font-weight=\"700\" fill=\"#1f3d5c\">TOILETTES</text>",
    "goodbye":"<circle cx=\"58\" cy=\"38\" r=\"18\" fill=\"#c98b5e\"/><path d=\"M34 108c0-30 10-48 24-48s24 18 24 48z\" fill=\"#2f7fd1\"/><path d=\"M78 66l30-28\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M108 38l8-14M108 38l16-4M108 38l8 12\" stroke=\"#8a5a34\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M126 60h22M138 50l10 10-10 10\" fill=\"none\" stroke=\"#e2574c\" stroke-width=\"5\"/>",
    "silence":"<circle cx=\"70\" cy=\"56\" r=\"36\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><circle cx=\"58\" cy=\"52\" r=\"4\"/><circle cx=\"82\" cy=\"52\" r=\"4\"/><path d=\"M58 72h24\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M108 24l30 30M138 24l-30 30\" stroke=\"#e2574c\" stroke-width=\"7\"/><text x=\"118\" y=\"90\" font-size=\"22\" font-family=\"sans-serif\" font-weight=\"700\" fill=\"#1f3d5c\">chut</text>",
    "cross":"<path d=\"M42 22l76 76M118 22L42 98\" stroke=\"#e2574c\" stroke-width=\"15\" stroke-linecap=\"round\"/>",
    "line-horizontal":"<path d=\"M22 60h116\" stroke=\"#2f7fd1\" stroke-width=\"9\" stroke-linecap=\"round\"/><circle cx=\"22\" cy=\"60\" r=\"6\" fill=\"#f5b93b\"/><circle cx=\"138\" cy=\"60\" r=\"6\" fill=\"#f5b93b\"/>",
    "line-vertical":"<path d=\"M80 14v92\" stroke=\"#2f7fd1\" stroke-width=\"9\" stroke-linecap=\"round\"/><circle cx=\"80\" cy=\"14\" r=\"6\" fill=\"#f5b93b\"/><circle cx=\"80\" cy=\"106\" r=\"6\" fill=\"#f5b93b\"/>",
    "line-curve":"<path d=\"M18 84c26-74 98-74 124 0\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"9\" stroke-linecap=\"round\"/><circle cx=\"18\" cy=\"84\" r=\"6\" fill=\"#f5b93b\"/><circle cx=\"142\" cy=\"84\" r=\"6\" fill=\"#f5b93b\"/>",
    "airplane":"<path d=\"M18 62l52-10 34-36 12 4-18 36 44 6v10l-44 6 18 28-12 4-34-28-52-10z\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"4\" stroke-linejoin=\"round\"/><circle cx=\"80\" cy=\"66\" r=\"5\" fill=\"#2f7fd1\"/>",
    "island":"<path d=\"M0 84h160v36H0z\" fill=\"#2f7fd1\"/><ellipse cx=\"80\" cy=\"82\" rx=\"48\" ry=\"18\" fill=\"#f5d28c\"/><path d=\"M80 78V38M80 48l-20-16M80 48l20-16\" stroke=\"#8b5e3c\" stroke-width=\"7\"/><path d=\"M58 34c18-15 28-12 34 2-17 4-26 4-34-2zM82 34c18-15 28-12 34 2-17 4-26 4-34-2z\" fill=\"#3f7d3f\"/><circle cx=\"126\" cy=\"22\" r=\"13\" fill=\"#f5b93b\"/>",
    "picture":"<rect x=\"22\" y=\"18\" width=\"116\" height=\"84\" rx=\"7\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><circle cx=\"106\" cy=\"42\" r=\"11\" fill=\"#f5b93b\"/><path d=\"M30 94l30-32 20 18 18-24 32 38z\" fill=\"#7fb069\" stroke=\"#3f7d3f\" stroke-width=\"3\"/><path d=\"M42 110h76\" stroke=\"#8b5e3c\" stroke-width=\"6\"/>",
    "motorcycle":"<circle cx=\"42\" cy=\"86\" r=\"20\" fill=\"#e8eef3\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><circle cx=\"120\" cy=\"86\" r=\"20\" fill=\"#e8eef3\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><path d=\"M42 86l24-38h28l26 38H70l-18-26M94 48l18-14M64 48h24\" fill=\"none\" stroke=\"#e2574c\" stroke-width=\"7\" stroke-linejoin=\"round\"/>",
    "mother":"<circle cx=\"80\" cy=\"38\" r=\"22\" fill=\"#c98b5e\"/><path d=\"M56 34c4-30 44-30 48 0-12-9-36-9-48 0z\" fill=\"#1f3d5c\"/><path d=\"M40 112c0-36 16-54 40-54s40 18 40 54z\" fill=\"#7fb069\"/><path d=\"M68 45c7 7 17 7 24 0\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"3\"/>",
    "moon":"<rect width=\"160\" height=\"120\" fill=\"#232a4a\"/><circle cx=\"82\" cy=\"58\" r=\"38\" fill=\"#f2e6b8\"/><circle cx=\"98\" cy=\"44\" r=\"38\" fill=\"#232a4a\"/><g fill=\"#fff\"><circle cx=\"28\" cy=\"24\" r=\"3\"/><circle cx=\"132\" cy=\"34\" r=\"2\"/><circle cx=\"118\" cy=\"88\" r=\"3\"/></g>",
    "bridge":"<rect x=\"0\" y=\"88\" width=\"160\" height=\"32\" fill=\"#2f7fd1\"/><path d=\"M18 84h124M30 84c10-42 30-42 40 0M90 84c10-42 30-42 40 0\" fill=\"none\" stroke=\"#8b5e3c\" stroke-width=\"9\"/><path d=\"M18 70h124\" stroke=\"#5b6673\" stroke-width=\"7\"/>",
    "circle-red":"<circle cx=\"80\" cy=\"60\" r=\"43\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"5\"/>",
    "circle-blue":"<circle cx=\"80\" cy=\"60\" r=\"43\" fill=\"#2f7fd1\" stroke=\"#1a4b80\" stroke-width=\"5\"/>",
    "square-red":"<rect x=\"37\" y=\"17\" width=\"86\" height=\"86\" rx=\"4\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"5\"/>",
    "square-blue":"<rect x=\"37\" y=\"17\" width=\"86\" height=\"86\" rx=\"4\" fill=\"#2f7fd1\" stroke=\"#1a4b80\" stroke-width=\"5\"/>",
    "position-on":"<rect x=\"45\" y=\"58\" width=\"70\" height=\"42\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><circle cx=\"80\" cy=\"38\" r=\"16\" fill=\"#e2574c\"/><path d=\"M80 54v-8\" stroke=\"#1f3d5c\" stroke-width=\"4\"/>",
    "position-under":"<rect x=\"45\" y=\"20\" width=\"70\" height=\"42\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><circle cx=\"80\" cy=\"88\" r=\"16\" fill=\"#e2574c\"/><path d=\"M80 72v-8\" stroke=\"#1f3d5c\" stroke-width=\"4\"/>",
    "position-front":"<rect x=\"74\" y=\"25\" width=\"60\" height=\"64\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><circle cx=\"58\" cy=\"72\" r=\"22\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"3\"/><path d=\"M36 104h88\" stroke=\"#3f7d3f\" stroke-width=\"5\"/>",
    "position-behind":"<circle cx=\"104\" cy=\"64\" r=\"22\" fill=\"#e2574c\" stroke=\"#8c2f28\" stroke-width=\"3\"/><rect x=\"28\" y=\"25\" width=\"70\" height=\"72\" fill=\"#bfe3f5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M20 104h120\" stroke=\"#3f7d3f\" stroke-width=\"5\"/>",
    "seated-child":"<circle cx=\"66\" cy=\"28\" r=\"15\" fill=\"#c98b5e\"/><path d=\"M58 44h18v35H58z\" fill=\"#2f7fd1\"/><path d=\"M68 78h34v12H68zM96 88v24\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M38 82h70v10H38zM46 92v20M100 92v20\" stroke=\"#8b5e3c\" stroke-width=\"7\"/><path d=\"M62 48L40 68M74 48l20 18\" stroke=\"#c98b5e\" stroke-width=\"8\"/>",
    "apology":"<circle cx=\"66\" cy=\"44\" r=\"18\" fill=\"#c98b5e\"/><path d=\"M42 110c0-30 10-48 24-48s26 18 26 48z\" fill=\"#94a3b8\"/><path d=\"M50 48c10 8 22 8 32 0\" fill=\"none\" stroke=\"#8a5a34\" stroke-width=\"3\"/><path d=\"M102 24h42v36h-24l-10 10v-10h-8z\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><text x=\"123\" y=\"48\" text-anchor=\"middle\" font-size=\"20\" font-family=\"sans-serif\" font-weight=\"700\" fill=\"#e2574c\">P</text>",
    "bookshelf":"<rect x=\"22\" y=\"18\" width=\"116\" height=\"90\" fill=\"#8b5e3c\" stroke=\"#5c3a21\" stroke-width=\"5\"/><path d=\"M22 62h116\" stroke=\"#5c3a21\" stroke-width=\"6\"/><g><rect x=\"32\" y=\"28\" width=\"14\" height=\"30\" fill=\"#2f7fd1\"/><rect x=\"49\" y=\"24\" width=\"16\" height=\"34\" fill=\"#e2574c\"/><rect x=\"69\" y=\"30\" width=\"15\" height=\"28\" fill=\"#f5b93b\"/><rect x=\"34\" y=\"70\" width=\"18\" height=\"32\" fill=\"#7fb069\"/><rect x=\"56\" y=\"66\" width=\"16\" height=\"36\" fill=\"#2f7fd1\"/><rect x=\"76\" y=\"72\" width=\"15\" height=\"30\" fill=\"#e2574c\"/></g>",
    "ball":"<circle cx=\"80\" cy=\"60\" r=\"44\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><path d=\"M80 16v88M36 60h88M49 29l62 62M111 29L49 91\" stroke=\"#2f7fd1\" stroke-width=\"4\"/><circle cx=\"80\" cy=\"60\" r=\"10\" fill=\"#e2574c\"/>",
    "start-line":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\"/><path d=\"M34 18v86\" stroke=\"#1f3d5c\" stroke-width=\"6\"/><path d=\"M40 22h66v38H40z\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M40 22l11 11 11-11 11 11 11-11 11 11 11-11M40 42l11 11 11-11 11 11 11-11 11 11 11-11\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M112 82h30\" stroke=\"#e2574c\" stroke-width=\"8\"/>",
    "finish-line":"<path d=\"M0 104h160\" stroke=\"#3f7d3f\" stroke-width=\"5\"/><path d=\"M124 18v86\" stroke=\"#1f3d5c\" stroke-width=\"6\"/><path d=\"M58 22h60v38H58z\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M58 22l10 10 10-10 10 10 10-10 10 10 10-10M58 42l10 10 10-10 10 10 10-10 10 10 10-10\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"3\"/><path d=\"M18 82h56\" stroke=\"#2f7fd1\" stroke-width=\"8\"/>",
    "feet-together":"<path d=\"M38 30c18-8 30 0 28 22l-5 48H28l4-52zM92 30c18-8 30 0 28 22l5 48H92l-5-48z\" fill=\"#c98b5e\" stroke=\"#8a5a34\" stroke-width=\"4\"/><path d=\"M28 104h44M88 104h44\" stroke=\"#1f3d5c\" stroke-width=\"6\"/>",
    "knees-bent":"<circle cx=\"56\" cy=\"24\" r=\"13\" fill=\"#c98b5e\"/><path d=\"M48 38h16l12 28-18 14z\" fill=\"#2f7fd1\"/><path d=\"M60 78l34 8 18 20M60 78l18 26-18 8\" fill=\"none\" stroke=\"#c98b5e\" stroke-width=\"11\" stroke-linecap=\"round\"/><path d=\"M20 112h124\" stroke=\"#3f7d3f\" stroke-width=\"5\"/>",
    "target":"<circle cx=\"80\" cy=\"60\" r=\"48\" fill=\"#fffdf5\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><circle cx=\"80\" cy=\"60\" r=\"35\" fill=\"#e2574c\"/><circle cx=\"80\" cy=\"60\" r=\"22\" fill=\"#fffdf5\"/><circle cx=\"80\" cy=\"60\" r=\"9\" fill=\"#2f7fd1\"/><path d=\"M18 102l46-34\" stroke=\"#8b5e3c\" stroke-width=\"5\"/><path d=\"M64 68l-14 0 8 10z\" fill=\"#f5b93b\"/>",
    "arms-open":"<circle cx=\"80\" cy=\"24\" r=\"13\" fill=\"#c98b5e\"/><path d=\"M72 38h16v38H72z\" fill=\"#2f7fd1\"/><path d=\"M72 46L22 70M88 46l50 24M76 76l-18 34M84 76l18 34\" stroke=\"#c98b5e\" stroke-width=\"10\" stroke-linecap=\"round\"/>",
    "child":"<circle cx=\"80\" cy=\"34\" r=\"18\" fill=\"#c98b5e\"/><path d=\"M58 28c6-17 38-17 44 0-12-6-32-6-44 0z\" fill=\"#1f3d5c\"/><path d=\"M54 108c0-34 10-54 26-54s26 20 26 54z\" fill=\"#2f7fd1\"/><path d=\"M62 62L36 86M98 62l26 24\" stroke=\"#c98b5e\" stroke-width=\"9\"/><path d=\"M70 108V86M90 108V86\" stroke=\"#c98b5e\" stroke-width=\"10\"/>",
    "kite":"<path d=\"M84 16l38 38-38 38-38-38z\" fill=\"#f5b93b\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M84 16v76M46 54h76\" stroke=\"#e2574c\" stroke-width=\"3\"/><path d=\"M84 92c-18 10 18 16 0 26\" fill=\"none\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><path d=\"M28 36c-12 6-12 18 0 24M18 22c-22 14-22 42 0 56\" fill=\"none\" stroke=\"#2f7fd1\" stroke-width=\"4\"/>",
    "chair":"<path d=\"M46 18v58h68V18\" fill=\"#8b5e3c\" stroke=\"#5c3a21\" stroke-width=\"6\"/><path d=\"M40 76h80M50 78v34M110 78v34\" stroke=\"#5c3a21\" stroke-width=\"8\"/><path d=\"M58 34h44M58 50h44\" stroke=\"#f5b93b\" stroke-width=\"5\"/>",
    "village":"<path d=\"M0 102h160\" stroke=\"#3f7d3f\" stroke-width=\"7\"/><path d=\"M16 66l28-24 28 24v36H16zM90 72l24-20 26 20v30H90z\" fill=\"#f5d28c\" stroke=\"#8b5e3c\" stroke-width=\"4\"/><path d=\"M12 66h64L44 36zM86 72h58l-30-26z\" fill=\"#e2574c\"/><path d=\"M72 102V52M72 62l-13-12M72 62l13-12\" stroke=\"#5c3a21\" stroke-width=\"6\"/><circle cx=\"72\" cy=\"45\" r=\"15\" fill=\"#3f7d3f\"/>",
    "city":"<path d=\"M0 106h160\" stroke=\"#1f3d5c\" stroke-width=\"6\"/><rect x=\"14\" y=\"44\" width=\"38\" height=\"62\" fill=\"#94a3b8\"/><rect x=\"58\" y=\"20\" width=\"44\" height=\"86\" fill=\"#2f7fd1\"/><rect x=\"108\" y=\"54\" width=\"38\" height=\"52\" fill=\"#e2574c\"/><g fill=\"#f5b93b\"><rect x=\"22\" y=\"56\" width=\"8\" height=\"10\"/><rect x=\"36\" y=\"56\" width=\"8\" height=\"10\"/><rect x=\"68\" y=\"34\" width=\"9\" height=\"12\"/><rect x=\"84\" y=\"34\" width=\"9\" height=\"12\"/><rect x=\"118\" y=\"66\" width=\"8\" height=\"10\"/></g>",
    "sea":"<rect x=\"0\" y=\"38\" width=\"160\" height=\"82\" fill=\"#2f7fd1\"/><path d=\"M0 54c20-14 40 14 60 0s40 14 60 0 40 0 40 0M0 82c20-14 40 14 60 0s40 14 60 0 40 0 40 0\" fill=\"none\" stroke=\"#bfe3f5\" stroke-width=\"7\"/><circle cx=\"126\" cy=\"18\" r=\"12\" fill=\"#f5b93b\"/>",
    "train":"<path d=\"M16 100h128\" stroke=\"#5b6673\" stroke-width=\"6\"/><rect x=\"24\" y=\"34\" width=\"102\" height=\"50\" rx=\"10\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"4\"/><rect x=\"40\" y=\"46\" width=\"22\" height=\"18\" fill=\"#bfe3f5\"/><rect x=\"72\" y=\"46\" width=\"22\" height=\"18\" fill=\"#bfe3f5\"/><path d=\"M126 50h16v34h-16z\" fill=\"#e2574c\"/><circle cx=\"48\" cy=\"88\" r=\"11\" fill=\"#1f3d5c\"/><circle cx=\"106\" cy=\"88\" r=\"11\" fill=\"#1f3d5c\"/><path d=\"M20 30c-8-8-4-18 6-18M32 28c-8-10-2-22 10-20\" fill=\"none\" stroke=\"#94a3b8\" stroke-width=\"5\"/>",
    "request-help":"<circle cx=\"64\" cy=\"36\" r=\"17\" fill=\"#c98b5e\"/><path d=\"M40 110c0-32 10-52 24-52s26 20 26 52z\" fill=\"#2f7fd1\"/><path d=\"M84 64l30-40\" stroke=\"#c98b5e\" stroke-width=\"10\"/><text x=\"130\" y=\"72\" font-size=\"38\" font-family=\"sans-serif\" font-weight=\"800\" fill=\"#e2574c\">?</text>",
    "sphere":"<circle cx=\"80\" cy=\"60\" r=\"45\" fill=\"#2f7fd1\" stroke=\"#1f3d5c\" stroke-width=\"5\"/><ellipse cx=\"80\" cy=\"60\" rx=\"22\" ry=\"45\" fill=\"none\" stroke=\"#bfe3f5\" stroke-width=\"4\" opacity=\".8\"/><path d=\"M38 46c24 12 60 12 84 0M38 74c24-12 60-12 84 0\" fill=\"none\" stroke=\"#bfe3f5\" stroke-width=\"4\" opacity=\".8\"/><circle cx=\"62\" cy=\"42\" r=\"9\" fill=\"#fffdf5\" opacity=\".65\"/>"
  };
  var PRIMARY_PRONUNCIATION_GUIDES={
    'bonjour':'bon · jour','present':'pré · sent','merci':'mer · ci','ananas':'a · na · nas','avion':'a · vion',
    'iguane':'i · guane','image':'i · mage','mangue':'mangue','moto':'mo · to','maman':'ma · man','lune':'lune',
    'lion':'li · on','livre':'livre','cahier':'ca · hier','crayon':'cra · yon','ecole':'é · cole','eleve':'é · lève',
    'arbre':'arbre','soleil':'so · leil','nuage':'nu · age','pluie':'pluie','bonjour madame':'bon · jour ma · dame',
    'au revoir':'au re · voir','enchante':'en · chan · té','toilettes':'toi · lettes'
  };
  function primaryNormalizeKey(value){
    return String(value==null?'':value).toLowerCase().replace(/[’']/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  }
  /* V471 : definition reelle de chaque theme du primaire, ecrite lecon par lecon.
     Cle = titre de la lecon normalise (primaryNormalizeKey). 152 themes qui
     retombaient sur la phrase fabriquee « Ce theme apprend a... ». */
  var PRIMARY_THEMES_V471={
    'construire et mesurer des angles':{def:'Un angle est l’ouverture formée par deux demi-droites qui partent du même point, appelé sommet. On le mesure en degrés avec un rapporteur : l’angle droit vaut 90°, l’angle plat 180°.',ex:'Le coin d’une feuille de cahier forme un angle droit de 90° ; deux coins mis bout à bout forment un angle plat de 180°.'},
    'adopter des comportements surs':{def:'Un comportement sûr est une habitude qui réduit le risque d’accident, avant même que le danger apparaisse.',ex:'Ne pas approcher du feu de charbon en courant, ne pas toucher une prise avec les mains mouillées, ne pas se baigner seul dans le fleuve.'},
    'adopter une citoyennete numerique et ecologique responsable':{def:'C’est appliquer en ligne et envers la nature les mêmes règles que dans la vie réelle : ne pas nuire, vérifier avant de partager, et laisser la place propre pour ceux qui viennent après.',ex:'On vérifie une information avant de la faire suivre sur WhatsApp, et on rapporte les piles usagées au lieu de les jeter dans la cour.'},
    'agir avec honnetete et refuser la corruption':{def:'La corruption, c’est donner ou recevoir un avantage pour obtenir ce qu’on n’a pas mérité. Elle prend la place de ceux qui ont travaillé et affaiblit tout le pays.',ex:'Payer pour obtenir une note ou une place, c’est prendre celle d’un élève qui a réussi honnêtement. On refuse et on le signale.'},
    'agir face aux risques climatiques et environnementaux':{def:'Le changement climatique modifie durablement les pluies et les températures. S’y adapter, c’est changer ses pratiques ; l’atténuer, c’est réduire ce qui le provoque.',ex:'Contre l’avancée de la mer sur la côte guinéenne : replanter la mangrove, qui retient le sol et brise la vague.'},
    'agir pour la proprete et la sante collective':{def:'La santé collective, c’est la santé de tout le groupe. Elle dépend des gestes de chacun : un seul foyer d’eau stagnante suffit à faire piquer tout un quartier.',ex:'Vider les récipients qui gardent l’eau après la pluie coupe la reproduction des moustiques et fait baisser le paludisme dans tout le quartier.'},
    'agriculture elevage et peche':{def:'L’agriculture cultive les plantes, l’élevage élève les animaux, la pêche prélève les poissons. Ce sont les trois activités du secteur primaire.',ex:'Riz et fonio en Haute-Guinée, ananas et bananes en Basse-Guinée, bovins en Moyenne-Guinée, pêche artisanale le long de la côte.'},
    'ameliorer une performance en athletisme':{def:'Améliorer une performance, c’est mesurer un résultat de départ, changer un point précis de son geste, puis mesurer de nouveau pour vérifier le progrès.',ex:'Saut en longueur : 1,40 m au premier essai ; après avoir travaillé l’appel du pied, 1,52 m.'},
    'analyser la conquete coloniale en guinee':{def:'La conquête coloniale est la prise militaire et administrative progressive du territoire par la France, entre la fin du XIXe siècle et le début du XXe.',ex:'Après des traités imposés aux chefs côtiers, la Guinée française est créée en 1893 ; la résistance de Samory prend fin en 1898.'},
    'apprendre la devise et l hymne de la guinee':{def:'La devise est la phrase courte qui résume les valeurs d’un pays. L’hymne est son chant officiel. Ce sont deux symboles de la République.',ex:'La devise de la Guinée est « Travail — Justice — Solidarité ». L’hymne national est « Liberté ».'},
    'beaucoup peu et rien':{def:'Ce sont trois mots qui disent la quantité sans compter : beaucoup veut dire un grand nombre, peu un petit nombre, et rien veut dire aucun, zéro.',ex:'Dans le panier il y a beaucoup de mangues, peu de citrons, et rien du tout comme bananes.'},
    'chanter avec justesse et expression':{def:'Chanter juste, c’est produire exactement la hauteur de note attendue. Chanter avec expression, c’est faire entendre le sens du texte par la voix.',ex:'Une berceuse se chante doucement et lentement ; un chant de fête se chante clair et appuyé.'},
    'chanter en respectant rythme et intensite':{def:'L’intensité est la force du son : chanter fort ou doucement. Le rythme est la durée des notes. Respecter les deux, c’est chanter ensemble, sans traîner ni couvrir les autres.',ex:'Le refrain se chante fort, le couplet plus doucement ; tout le groupe change au même moment.'},
    'chanter une courte chanson scolaire':{def:'Chanter, c’est dire un texte sur une mélodie, en respectant la hauteur des notes et le rythme, avec une voix posée et audible.',ex:'On apprend d’abord les paroles en parlant, puis on ajoute la mélodie, puis on chante ensemble sans crier.'},
    'climats saisons et vegetation':{def:'Le climat est le temps qu’il fait habituellement dans une région, année après année. La végétation dépend de lui : plus il pleut, plus la forêt est dense.',ex:'La Guinée connaît une saison des pluies et une saison sèche. Conakry reçoit plus de 3 mètres de pluie par an, la Haute-Guinée beaucoup moins : d’un côté la forêt, de l’autre la savane.'},
    'colorier une scene de guinee':{def:'Colorier une scène, c’est remplir chaque partie d’un dessin avec la couleur qui correspond à la réalité, sans déborder et sans laisser de blanc.',ex:'Une scène de marché : les tissus en couleurs vives, la latérite de la route en rouge-orangé, les manguiers en vert foncé.'},
    'comparer la vie autrefois et aujourd hui':{def:'Comparer deux époques, c’est chercher ce qui a changé et ce qui est resté pareil, sans juger que l’ancien était forcément pire ou meilleur.',ex:'Autrefois on puisait l’eau au puits ; aujourd’hui la borne-fontaine est plus proche. Mais on porte toujours le bidon sur la tête.'},
    'comparer le village et la ville':{def:'Le village compte peu d’habitants, vit surtout de l’agriculture et a peu de services. La ville concentre beaucoup d’habitants, des commerces, des administrations et des emplois variés.',ex:'Un village de Kindia : champs, école, marché hebdomadaire. Conakry : port, ministères, hôpitaux, marchés tous les jours.'},
    'comparer les resistances de samory toure et alpha yaya diallo':{def:'Comparer deux résistances, c’est chercher ce qui les rapproche — le refus de la domination — et ce qui les distingue : la région, les moyens, la durée, l’issue.',ex:'Samory oppose une armée mobile en Haute-Guinée pendant des années ; Alpha Yaya, roi de Labé, résiste surtout par la voie politique avant d’être déporté.'},
    'composer une image avec formes et couleurs':{def:'Composer, c’est organiser les éléments dans l’espace de la feuille : ce qu’on met au centre, ce qu’on met autour, et comment les couleurs s’équilibrent.',ex:'Un grand cercle jaune au centre, des triangles verts dans les coins : l’œil va d’abord au centre.'},
    'comprendre constitution lois et institutions de la republique':{def:'La Constitution est la loi la plus élevée : elle organise l’État et garantit les droits. Les lois viennent après elle et ne peuvent pas la contredire. Les institutions sont les organes qui appliquent tout cela.',ex:'Une loi votée qui supprimerait le droit d’aller à l’école serait contraire à la Constitution : elle ne pourrait pas s’appliquer.'},
    'comprendre l afrique de l ouest et la cooperation regionale':{def:'La coopération régionale est l’entente entre pays voisins pour agir ensemble sur l’économie, la circulation des personnes et la sécurité.',ex:'La CEDEAO regroupe les États d’Afrique de l’Ouest et permet notamment à ses ressortissants de circuler plus librement entre les pays membres.'},
    'comprendre la commune et les services publics':{def:'La commune est la plus petite collectivité qui administre un territoire. Les services publics sont les activités qu’elle organise pour tous : école, santé, eau, ordures, état civil.',ex:'C’est à la commune qu’on retire un acte de naissance, et c’est elle qui organise le ramassage des ordures du quartier.'},
    'comprendre la traite negriere et ses consequences':{def:'La traite négrière est la déportation forcée de millions d’Africains vers les Amériques, du XVIe au XIXe siècle, pour y être réduits en esclavage.',ex:'Elle a vidé des régions entières de leurs jeunes adultes, nourri les guerres de capture à l’intérieur du continent, et durablement freiné son peuplement.'},
    'comprendre les consignes scolaires':{def:'Une consigne est une phrase qui dit exactement ce qu’il faut faire. Elle commence presque toujours par un verbe d’action : c’est ce verbe qui commande le travail.',ex:'« Entoure le rond » demande d’entourer, pas de colorier. « Souligne le mot » demande un trait sous le mot, pas autour.'},
    'comprendre les generations dans une famille':{def:'Une génération est l’ensemble des personnes d’une famille qui occupent le même rang : les grands-parents, puis les parents, puis les enfants. Chaque génération précède la suivante d’environ vingt-cinq à trente ans.',ex:'Grand-mère, puis maman, puis toi : trois générations vivent parfois dans la même concession.'},
    'comprendre les mouvements africains vers l independance':{def:'Après 1945, syndicats, partis et associations d’Afrique réclament l’égalité des droits puis l’autonomie, jusqu’à obtenir l’indépendance.',ex:'En Guinée, l’action syndicale puis le Parti démocratique de Guinée mobilisent villes et villages avant le référendum de 1958.'},
    'comprendre les voies de communication':{def:'Les voies de communication sont les chemins qui permettent de déplacer les personnes, les marchandises et les informations : routes, voie ferrée, port, aéroport, réseau téléphonique.',ex:'La route Conakry–Kankan relie la côte à la Haute-Guinée ; le port de Conakry ouvre le pays sur l’extérieur.'},
    'comprendre mines energie et industrie en guinee':{def:'L’industrie transforme les matières premières en produits finis. Elle exige de l’énergie et des transports ; sans eux, le pays exporte ses minerais bruts au lieu de les valoriser.',ex:'La bauxite exportée telle quelle rapporte bien moins que l’alumine raffinée sur place : c’est l’enjeu des usines de transformation.'},
    'concevoir un projet artistique sur le patrimoine guineen':{def:'Le patrimoine est ce qu’une communauté a reçu du passé et choisit de transmettre : monuments, savoir-faire, musiques, récits. Un projet artistique le fait connaître par une œuvre.',ex:'Une exposition de la classe sur les tissus teints à l’indigo : photos, échantillons, panneau expliquant la technique.'},
    'connaitre les activites economiques locales':{def:'Les activités économiques se classent en trois secteurs : le primaire tire les ressources de la nature, le secondaire les transforme, le tertiaire rend des services.',ex:'Cultiver l’ananas à Kindia : primaire. Le mettre en conserve : secondaire. Le transporter et le vendre : tertiaire.'},
    'connaitre les symboles de la republique de guinee':{def:'Les symboles d’une République sont les signes officiels qui la représentent : son drapeau, son hymne, sa devise, ses armoiries.',ex:'Le drapeau guinéen porte trois bandes verticales — rouge, jaune, verte — et se hisse à l’endroit avec le rouge du côté du mât.'},
    'connaitre ses droits et ses devoirs a l ecole':{def:'Un droit est ce que l’on peut exiger parce que la règle le garantit. Un devoir est ce que l’on doit faire en retour. Les deux vont toujours ensemble.',ex:'Droit : être écouté et protégé. Devoir : écouter les autres, venir à l’heure et ne frapper personne.'},
    'construire les tables de 6 7 8 et 9':{def:'Construire une table, c’est la fabriquer soi-même à partir d’une table déjà connue, au lieu de l’apprendre bêtement.',ex:'7 × 6 = 7 × 5 + 7 = 35 + 7 = 42. On part de la table de 5, qui est facile, et on ajoute une fois le nombre.'},
    'construire un paragraphe coherent':{def:'Un paragraphe est un groupe de phrases qui parlent toutes de la même idée. Il commence par une phrase qui annonce l’idée, puis les autres phrases l’expliquent ou la prouvent.',ex:'Idée : « Le marché de Madina est très animé. » Puis : les vendeurs appellent, les taxis klaxonnent, les allées sont pleines dès le matin.'},
    'construire une frise chronologique simple':{def:'Une frise chronologique est une ligne où le temps avance toujours dans le même sens. On y place les événements dans l’ordre, du plus ancien au plus récent.',ex:'Sur la ligne : ma naissance, mon entrée au CP1, aujourd’hui — dans cet ordre, avec la même distance pour la même durée.'},
    'construire une frise historique':{def:'Une frise historique porte une échelle : une même longueur y représente toujours la même durée. C’est ce qui permet de voir qu’une période fut longue ou brève.',ex:'Sur une frise où 1 cm = 100 ans, l’empire du Mali occupe environ 2 cm et l’époque coloniale en Guinée moins d’un demi-centimètre.'},
    'convertir longueurs masses et capacites':{def:'Convertir, c’est écrire la même mesure avec une autre unité, sans changer la quantité réelle. On multiplie ou on divise par 10, 100 ou 1 000 selon le déplacement dans le tableau des unités.',ex:'3 kg = 3 000 g. 250 cl = 2,5 l. 1,4 km = 1 400 m.'},
    'cooperer dans un jeu collectif':{def:'Coopérer dans un jeu, c’est jouer pour l’équipe : passer le ballon à celui qui est mieux placé plutôt que de tenter seul.',ex:'Au handball scolaire, on compte les passes réussies avant chaque tir : l’équipe qui passe le plus marque le plus.'},
    'cooperer dans un sport collectif':{def:'Dans un sport collectif, chaque joueur tient un poste et le respecte : l’équipe gagne par son organisation, pas par les exploits d’un seul.',ex:'En football, le défenseur reste derrière même quand l’envie d’attaquer est forte : sinon le but reste ouvert.'},
    'courir et s arreter au signal':{def:'C’est maîtriser sa vitesse : lancer sa course, puis freiner et s’immobiliser sans tomber ni bousculer les autres quand le signal retentit.',ex:'On court entre deux lignes ; au sifflet on s’arrête pieds joints, sans dépasser la ligne.'},
    'courir sur une courte distance':{def:'Courir une courte distance, c’est aller le plus vite possible d’un point de départ à une ligne d’arrivée toute proche, sans ralentir avant la ligne.',ex:'Une course de 20 mètres dans la cour : on part au signal et on ne s’arrête qu’après avoir dépassé la ligne.'},
    'court et long':{def:'Court et long comparent la longueur de deux objets. Un objet est long quand il s’étend davantage qu’un autre placé à côté, en partant du même bord.',ex:'Le crayon neuf est long ; le crayon presque fini est court. Pour comparer, on aligne les deux bouts du même côté.'},
    'creer avec des materiaux recuperes':{def:'Récupérer, c’est donner une seconde vie à un objet jeté au lieu d’acheter du neuf. C’est un geste artistique et un geste écologique.',ex:'Des bouchons de bouteilles aplatis et cousus font les sonnailles d’un instrument ; une boîte de conserve devient un pot de fleurs.'},
    'creer un objet artisanal simple':{def:'Créer un objet artisanal, c’est passer d’une idée à un objet réel en suivant des étapes : choisir la matière, tracer, découper, assembler, finir.',ex:'Un porte-crayons en carton recyclé : mesurer, découper, coller le cylindre, décorer au motif de frise.'},
    'creer une frise avec des motifs repetes':{def:'Une frise est une bande décorative où un même motif revient toujours dans le même ordre et au même intervalle. Cette régularité s’appelle un rythme visuel.',ex:'Triangle — rond — triangle — rond, sur toute la longueur d’une bande de papier, comme sur un pagne tissé.'},
    'croiser sources ecrites orales et materielles':{def:'Croiser les sources, c’est comparer ce que disent un texte, un témoignage oral et un objet. Quand les trois concordent, la conclusion est solide ; quand elles divergent, il faut expliquer pourquoi.',ex:'Sur une bataille : le rapport de l’officier, le récit du griot et l’emplacement des fortifications retrouvées ne racontent pas la même chose — l’écart est lui-même une information.'},
    'decouvrir l empire du ghana':{def:'L’empire du Ghana fut un État puissant d’Afrique de l’Ouest, du VIIIe au XIe siècle. Sa force venait du contrôle du commerce de l’or et du sel à travers le Sahara.',ex:'L’or venait du sud, le sel du désert au nord : le Ghana taxait les caravanes qui passaient par son territoire.'},
    'decouvrir l empire du mali':{def:'L’empire du Mali succéda au Ghana à partir du XIIIe siècle. Fondé par Soundiata Keïta, il s’étendait sur une grande partie de l’Afrique de l’Ouest, dont le nord de la Guinée actuelle.',ex:'La charte du Manden, transmise oralement, fixait les règles de vie de l’empire et interdisait notamment la mise en esclavage.'},
    'decouvrir rythmes et instruments guineens':{def:'Un instrument produit un son par percussion, par pincement ou par souffle. Chaque région de Guinée a ses instruments et ses rythmes propres.',ex:'Le djembé se frappe à mains nues, le balafon se frappe avec des baguettes, la kora se pince avec les doigts.'},
    'decouvrir un objet artistique ou artisanal guineen':{def:'Un objet artisanal est fabriqué à la main, avec des matières et des gestes transmis d’une génération à l’autre. Il porte la marque de la région où il est né.',ex:'Le tissu indigo teint à Kindia, la calebasse gravée, le djembé taillé dans un tronc et tendu de peau de chèvre.'},
    'decrire sa maison son ecole et leur environnement':{def:'Décrire un lieu en géographie, c’est dire ce qu’il contient et où il se trouve par rapport à ce qui l’entoure.',ex:'« Notre école est au bord de la route goudronnée, entre le marché et le dispensaire ; derrière, il y a des champs. »'},
    'decrire un lieu avec precision':{def:'Décrire un lieu, c’est le faire voir avec des mots : on dit où sont les choses les unes par rapport aux autres, et on donne des détails que l’œil, l’oreille et le nez remarquent.',ex:'« À l’entrée de la cour, à droite, un manguier donne de l’ombre ; derrière lui, le mur bleu de la classe ; au fond, on entend la route. »'},
    'dessiner sa famille ou sa maison':{def:'C’est représenter par le dessin des personnes ou un lieu que l’on connaît, en respectant le nombre, la place et la taille relative de chacun.',ex:'La maison au centre, le père et la mère plus grands que les enfants, le manguier de la cour à côté.'},
    'dessiner un objet observe':{def:'Dessiner d’après observation, c’est regarder l’objet réel et reproduire sa forme, ses proportions et ses parties, au lieu de dessiner de mémoire.',ex:'On pose une calebasse sur la table, on trace d’abord le grand rond, puis le bord, puis les taches du bois.'},
    'dire la verite et assumer ses actes':{def:'Dire la vérité, c’est raconter ce qui s’est réellement passé. Assumer ses actes, c’est reconnaître ce qu’on a fait et en réparer les conséquences.',ex:'J’ai cassé la règle du voisin : je le dis moi-même, je m’excuse, et je propose de la remplacer.'},
    'distinguer cod et coi':{def:'Le complément d’objet direct (COD) suit le verbe sans préposition et répond à « qui ? » ou « quoi ? ». Le complément d’objet indirect (COI) est relié au verbe par une préposition et répond à « à qui ? » ou « de quoi ? ».',ex:'« Aïssatou lit le journal » : le journal = COD (lit quoi ?). « Aïssatou parle à sa mère » : à sa mère = COI (parle à qui ?).'},
    'distinguer prehistoire et histoire':{def:'La préhistoire est la longue période qui précède l’écriture : on ne la connaît que par les objets. L’histoire commence quand les hommes écrivent et laissent des textes.',ex:'Un galet taillé nous renseigne sans mot : c’est la préhistoire. Une chronique arabe décrivant Tombouctou est un texte : c’est l’histoire.'},
    'distinguer source riviere fleuve et mer':{def:'La source est l’endroit où l’eau sort de terre. La rivière est le cours d’eau qui se jette dans un autre cours d’eau. Le fleuve se jette dans la mer. La mer est la grande étendue d’eau salée.',ex:'Le Niger prend sa source dans le Fouta-Djalon guinéen : c’est un fleuve, car il finit dans l’océan après un très long parcours.'},
    'ecouter et aider les autres':{def:'Écouter, c’est se taire et chercher à comprendre ce que l’autre veut dire. Aider, c’est agir ensuite pour lui rendre la chose plus facile.',ex:'Un camarade n’a pas compris la consigne : je l’écoute expliquer sa difficulté, puis je lui montre où regarder — sans faire l’exercice à sa place.'},
    'ecrire les lettres a i m et l':{def:'Écrire une lettre, c’est tracer sa forme toujours de la même façon : au bon point de départ, dans le bon sens, avec la bonne hauteur.',ex:'Le « l » monte haut et droit sur la grande ligne ; le « i » est court et porte un point ; le « m » fait trois jambes accrochées.'},
    'egalite inclusion et respect de chacun':{def:'L’égalité, c’est avoir les mêmes droits quelle que soit sa condition. L’inclusion, c’est adapter le groupe pour que personne ne reste dehors.',ex:'Une élève en fauteuil ne peut pas monter la marche : la classe demande une rampe. L’égalité seule ne suffisait pas, il fallait l’inclusion.'},
    'employer je tu il et elle':{def:'Je, tu, il et elle sont des pronoms personnels : de petits mots qui remplacent le nom de la personne qui parle, de celle à qui on parle, ou de celle dont on parle.',ex:'« Fatoumata mange » devient « elle mange ». « Sékou et moi partons » devient « nous partons ».'},
    'etudier l administration et l economie coloniales':{def:'L’administration coloniale organisait le territoire pour le gouverner et le faire produire : cercles, chefs de canton, impôt, travail forcé, cultures destinées à l’exportation.',ex:'La banane et le café guinéens partaient vers la métropole ; l’argent de l’impôt servait d’abord aux routes menant aux ports.'},
    'etudier les echanges transsahariens et atlantiques':{def:'Le commerce transsaharien traversait le désert du nord au sud par caravanes. Le commerce atlantique s’est ouvert par la côte à partir du XVe siècle avec l’arrivée des navires européens.',ex:'Le sel, l’or et les tissus passaient par le Sahara ; par l’Atlantique arrivaient armes et alcool, et partaient des hommes déportés.'},
    'etudier les regions administratives et les principales villes de guinee':{def:'Une région administrative est un découpage créé par l’État pour gouverner le territoire. Elle a un chef-lieu où siègent les services publics.',ex:'La Guinée compte sept régions administratives plus la zone spéciale de Conakry ; Kankan, Labé, Nzérékoré et Boké en sont des chefs-lieux.'},
    'etudier transports communications et commerce':{def:'Le commerce est l’échange de biens contre de l’argent. Il est intérieur quand il se fait dans le pays, extérieur quand il franchit les frontières.',ex:'La Guinée exporte surtout de la bauxite et de l’or, et importe du riz, du carburant et des véhicules : c’est sa balance commerciale.'},
    'exercer la citoyennete et participer a une election':{def:'Être citoyen, ce n’est pas seulement avoir des droits : c’est participer à la vie du pays, s’informer, voter, et contrôler ceux à qui on confie une charge.',ex:'Le délégué élu rend compte chaque mois devant la classe ; les élèves peuvent lui demander ce qu’il a fait des décisions votées.'},
    'expliquer le referendum et l independance de la guinee en 1958':{def:'Un référendum est un vote où le peuple répond par oui ou par non à une question. Le 28 septembre 1958, la Guinée répond « non » à la Communauté française ; l’indépendance est proclamée le 2 octobre.',ex:'La France retire alors ses cadres et ses moyens : le pays commence son indépendance dans des conditions matérielles très difficiles.'},
    'exprimer son humeur et son besoin':{def:'Exprimer son humeur, c’est dire avec un mot juste comment on se sent ; exprimer son besoin, c’est dire ce dont on a besoin, calmement, au lieu de se fâcher ou de se taire.',ex:'« Je suis fatigué et j’ai soif : est-ce que je peux boire de l’eau ? » plutôt que de poser la tête sur la table.'},
    'fabriquer une etiquette mot':{def:'Une étiquette-mot est un petit carton où l’on écrit le nom d’un objet et qu’on pose sur cet objet. Elle relie le mot écrit à la chose réelle.',ex:'On écrit « porte » sur un carton et on le colle sur la porte de la classe.'},
    'gerer un budget en francs guineens':{def:'Un budget est la comparaison entre ce qu’on reçoit et ce qu’on dépense sur une période. On l’équilibre quand les dépenses ne dépassent pas les recettes.',ex:'Recettes du mois : 900 000 GNF. Dépenses : loyer 400 000, nourriture 350 000, transport 100 000 = 850 000. Il reste 50 000 GNF d’économie.'},
    'identifier les activites de la communaute':{def:'Une activité économique est le travail par lequel les habitants d’un lieu gagnent leur vie. On les classe en agriculture, artisanat, commerce et services.',ex:'Dans un village de Basse-Guinée : la riziculture, la pêche, la forge, le petit commerce et le transport en taxi-brousse.'},
    'interpreter un chant avec rythme et nuances':{def:'Interpréter, ce n’est pas seulement chanter les bonnes notes : c’est décider où le chant monte, où il retombe, où il se tait un instant.',ex:'Le premier couplet doux, le refrain plein, un silence avant le dernier mot.'},
    'interpreter un chant polyrythmique en groupe':{def:'Une polyrythmie, c’est plusieurs rythmes différents joués en même temps qui s’emboîtent. Chaque groupe doit tenir son rythme sans se laisser entraîner par les autres.',ex:'Un groupe frappe deux temps, l’autre trois, sur le même tempo : ensemble, cela fait le balancement typique du djembé.'},
    'jouer en equipe avec regles et arbitrage':{def:'Un match encadré suppose trois choses : une règle connue de tous, un arbitre qui l’applique, et des joueurs qui acceptent sa décision.',ex:'Deux équipes de cinq, un élève arbitre avec un sifflet, un autre note les points : le rôle tourne à chaque match.'},
    'l empire du ghana et le commerce':{def:'La richesse du Ghana reposait sur le commerce transsaharien : les caravanes échangeaient l’or et les produits du sud contre le sel, les tissus et le cuivre du nord.',ex:'Une caravane de chameaux mettait environ deux mois pour traverser le Sahara ; le sel se troquait parfois à poids égal contre l’or.'},
    'l empire songhai':{def:'L’empire songhaï domina la boucle du Niger du XVe au XVIe siècle, après le Mali. Sonni Ali Ber puis Askia Mohammed en firent une puissance militaire, commerciale et savante.',ex:'Gao était la capitale, Tombouctou et Djenné les grands centres de commerce et d’enseignement ; l’empire s’effondre après la défaite de Tondibi en 1591.'},
    'l independance de la guinee en 1958':{def:'L’indépendance est le moment où un pays reprend la conduite de ses affaires. La Guinée la proclame le 2 octobre 1958, après avoir voté « non » au référendum du 28 septembre.',ex:'Elle fut le seul territoire de l’Afrique occidentale française à refuser la Communauté proposée par la France.'},
    'la colonisation et ses transformations':{def:'La colonisation est la domination d’un territoire par une puissance étrangère qui y impose son administration, ses lois, sa langue et son économie.',ex:'En Guinée française : découpage en cercles, impôt de capitation, travail forcé, cultures d’exportation, et enseignement en français.'},
    'la fonction des objets':{def:'La fonction d’un objet, c’est ce à quoi il sert, le travail qu’il permet de faire. Chaque objet a été fabriqué pour une fonction précise.',ex:'La fonction du balai est de nettoyer le sol ; celle du seau est de transporter l’eau ; celle de la lampe est d’éclairer.'},
    'la proprete de l ecole et de la maison':{def:'La propreté, c’est l’absence de saleté et de déchets dans un lieu. Elle se maintient par des gestes réguliers, pas seulement par un grand nettoyage.',ex:'Balayer la classe chaque matin, ramasser les papiers autour de son banc, vider la poubelle avant qu’elle déborde.'},
    'la vie des premiers humains en afrique':{def:'Les premiers humains vivaient de la chasse, de la pêche et de la cueillette, se déplaçaient selon les saisons et fabriquaient leurs outils dans la pierre.',ex:'L’Afrique de l’Est a livré les plus anciens restes humains connus ; les premiers outils sont des galets taillés sur un seul bord.'},
    'lancer une balle vers une cible':{def:'Lancer avec précision, c’est envoyer un objet vers un point choisi. On vise avec les yeux, on oriente l’épaule, puis on lâche au bon moment.',ex:'Un cercle tracé à la craie sur le mur : on recule d’un pas à chaque réussite.'},
    'le fouta djalon et ses organisations historiques':{def:'Le Fouta-Djalon est le massif montagneux du centre de la Guinée. Au XVIIIe siècle s’y organise un État théocratique dirigé par des almamys, partagé en provinces appelées diwe.',ex:'Timbo en fut la capitale politique et Fougoumba le lieu où l’almamy était investi.'},
    'les anciennes societes de l espace guineen':{def:'Avant les États modernes, l’espace guinéen était organisé en royaumes, chefferies et communautés villageoises, chacun avec ses règles, ses métiers et ses alliances.',ex:'Le Fouta-Djalon, la Basse-Guinée côtière et la Guinée forestière avaient chacun leur organisation propre, sans frontière tracée comme aujourd’hui.'},
    'lire des mots tres simples':{def:'Lire un mot, c’est assembler les sons des lettres dans l’ordre pour entendre le mot entier, puis comprendre ce qu’il veut dire.',ex:'Dans « papa », je lis p + a = « pa », puis p + a = « pa » : j’entends « papa », et je sais que c’est le père.'},
    'lire latitude longitude et fuseaux horaires':{def:'La latitude mesure la distance à l’équateur, du nord au sud ; la longitude mesure la distance au méridien de Greenwich, d’est en ouest. Les fuseaux horaires découpent la Terre en bandes où l’heure est la même.',ex:'Conakry est située à environ 9° de latitude nord et 13° de longitude ouest ; la Guinée vit à l’heure de Greenwich (GMT).'},
    'lire le calendrier de la semaine':{def:'Le calendrier de la semaine range les sept jours dans l’ordre, du lundi au dimanche. Il permet de dire quel jour on est, quel jour était hier et quel jour sera demain.',ex:'Aujourd’hui mercredi : hier c’était mardi, demain ce sera jeudi, et il reste deux jours avant le week-end.'},
    'lire les sons ch ou on et an':{def:'Certains sons s’écrivent avec deux lettres qui se lisent ensemble et ne se séparent jamais. On les appelle des sons complexes.',ex:'Dans « chapeau », c-h se lisent « ch ». Dans « mouton », o-u se lisent « ou » et o-n se lisent « on ».'},
    'lire tableaux et graphiques':{def:'Un tableau range des nombres en lignes et en colonnes ; un graphique les dessine pour qu’on voie tout de suite ce qui est grand, petit, en hausse ou en baisse.',ex:'Sur un diagramme en barres des pluies de Conakry, la barre de juillet dépasse toutes les autres : c’est le mois le plus pluvieux.'},
    'mansa moussa et le rayonnement du mali':{def:'Mansa Moussa fut empereur du Mali au XIVe siècle. Son pèlerinage à La Mecque en 1324 fit connaître la richesse de l’empire jusqu’en Europe, et il fit de Tombouctou un grand centre de savoir.',ex:'Il distribua tant d’or au Caire que le cours du métal y baissa pendant plusieurs années.'},
    'marcher et s arreter au signal':{def:'Un signal est un son ou un geste convenu qui commande une action immédiate. Réagir au signal, c’est arrêter ou repartir dès qu’on l’entend, sans attendre.',ex:'Au coup de sifflet, tout le monde s’immobilise sur place ; au second coup, on repart en marchant.'},
    'memoriser les tables de 2 3 4 et 5':{def:'Une table de multiplication est la liste des résultats obtenus en ajoutant plusieurs fois le même nombre. La retenir par cœur permet de calculer sans recompter.',ex:'4 × 3, c’est 3 + 3 + 3 + 3 = 12. Une fois la table sue, on dit « douze » tout de suite.'},
    'memoriser une courte recitation':{def:'Une récitation est un texte court qu’on apprend par cœur pour le dire à voix haute avec la bonne intonation.',ex:'On apprend deux vers par jour, on les redit sans regarder, puis on ajoute les deux suivants.'},
    'modeler un objet simple':{def:'Modeler, c’est donner une forme à une matière molle avec les doigts : on part d’une boule, puis on allonge, on creuse, on lisse.',ex:'Avec de l’argile mouillée : une boule, un creux au pouce, un bord relevé — on obtient un petit canari.'},
    'nommer les outils de l ecolier':{def:'Les outils de l’écolier sont les objets dont l’élève se sert pour travailler en classe. Chacun porte un nom précis et sert à une seule chose.',ex:'Le crayon sert à écrire, la gomme à effacer, la règle à tracer droit, l’ardoise à s’exercer avant d’écrire sur le cahier.'},
    'observer et decrire la meteo':{def:'La météo, c’est l’état du ciel et de l’air à un moment donné : le soleil, les nuages, la pluie, le vent, la chaleur.',ex:'Ce matin à Kankan : ciel couvert, vent léger, forte chaleur ; la pluie est tombée vers midi.'},
    'observer reliefs et cours d eau de guinee':{def:'Le relief est la forme de la surface du sol ; l’hydrographie est l’ensemble des cours d’eau. En Guinée, les deux sont liés : le relief élevé donne naissance aux fleuves.',ex:'Le Fouta-Djalon est appelé « château d’eau de l’Afrique de l’Ouest » : le Niger, le Sénégal et la Gambie y prennent leur source.'},
    'organiser un sport collectif et appliquer les premiers secours':{def:'Organiser un sport collectif, c’est prévoir les équipes, l’arbitrage et le temps de jeu. Les premiers secours sont les gestes immédiats à faire avant l’arrivée d’un adulte formé.',ex:'En cas d’entorse : arrêter le jeu, ne pas faire marcher le blessé, surélever la jambe, appliquer du froid, prévenir un adulte.'},
    'organiser une election democratique en classe':{def:'Une élection démocratique est un choix fait par un vote libre et secret, où chaque voix compte pour une, et dont le résultat est accepté par tous.',ex:'Élection du délégué : les candidats se présentent, chacun écrit un nom sur un papier plié, on compte devant la classe, le plus grand nombre de voix l’emporte.'},
    'partager et attendre son tour':{def:'Partager, c’est donner une partie de ce qu’on a à quelqu’un d’autre. Attendre son tour, c’est laisser passer les autres avant soi selon l’ordre d’arrivée.',ex:'À la fontaine, chacun remplit son bidon dans l’ordre de la file ; celui qui a fini prête le gobelet au suivant.'},
    'partager et cooperer':{def:'Coopérer, c’est travailler à plusieurs vers un même but, en se répartissant le travail au lieu de chacun faire tout seul de son côté.',ex:'Pour nettoyer la cour : deux élèves balaient, deux ramassent, deux portent la poubelle. Le travail est fini deux fois plus vite.'},
    'partager une quantite en parts egales':{def:'Partager en parts égales, c’est répartir une quantité de façon que chacun reçoive exactement la même chose. C’est le sens même de la division.',ex:'12 oranges partagées entre 4 enfants : chacun en reçoit 3, car 12 ÷ 4 = 3.'},
    'participer a un petit relais':{def:'Un relais est une course d’équipe où chaque coureur part quand le précédent lui a transmis le témoin. Le résultat dépend de l’équipe entière, pas d’un seul.',ex:'Quatre élèves, un bâton : chacun court jusqu’au piquet, revient et passe le bâton dans la main du suivant.'},
    'participer a une decision collective':{def:'Une décision collective est prise par un groupe, après que chacun a pu donner son avis. On la prend souvent par vote, et tous la respectent ensuite, même ceux qui étaient contre.',ex:'La classe choisit le thème de la fête : trois propositions, un vote à main levée, la proposition qui a le plus de voix est retenue.'},
    'plus moins et autant':{def:'Comparer deux quantités, c’est dire laquelle est la plus grande. Plus veut dire une quantité supérieure, moins une quantité inférieure, autant une quantité égale.',ex:'5 cailloux et 3 cailloux : 5 c’est plus que 3, 3 c’est moins que 5. 4 et 4 : il y en a autant.'},
    'population villages et villes':{def:'La population est l’ensemble des habitants d’un territoire. Sa répartition n’est pas égale : elle se concentre là où l’eau, les terres et le travail sont disponibles.',ex:'Conakry rassemble à elle seule une grande part des citadins du pays, tandis que de vastes zones de Haute-Guinée sont peu peuplées.'},
    'prendre soin de son corps':{def:'Prendre soin de son corps, c’est faire chaque jour les gestes qui gardent le corps propre, nourri et reposé, pour éviter les maladies.',ex:'Se laver au savon, se brosser les dents matin et soir, couper ses ongles, manger varié et dormir assez d’heures.'},
    'prendre soin des livres et de la classe':{def:'Prendre soin du matériel, c’est l’utiliser sans l’abîmer, parce qu’il est prêté et qu’il servira encore à d’autres élèves après nous.',ex:'On tourne les pages par le coin, on ne plie pas le cahier, on ne dessine pas sur la table, on range sa chaise en sortant.'},
    'preparer le materiel de la journee':{def:'Préparer son matériel, c’est réunir avant de commencer tout ce dont on aura besoin, pour ne pas s’interrompre pendant le travail.',ex:'Avant la classe : le cahier, le crayon, la gomme et l’ardoise sont sortis et posés sur la table.'},
    'preparer son materiel selon l emploi du temps':{def:'L’emploi du temps indique quelles matières auront lieu et à quel moment. Préparer son matériel selon l’emploi du temps, c’est n’emporter que ce qui servira ce jour-là.',ex:'Mardi : calcul et dessin. On prend le cahier de calcul et les crayons de couleur, on laisse le reste à la maison.'},
    'preparer une activite physique en securite':{def:'Préparer une activité physique, c’est échauffer le corps progressivement, dégager l’espace, vérifier le matériel et prévoir l’eau.',ex:'Cinq minutes de marche puis de course lente, rotations des chevilles et des épaules, terrain débarrassé des cailloux.'},
    'prevenir les conflits et construire la paix':{def:'Prévenir un conflit, c’est agir avant qu’il éclate : écouter, parler, chercher ce que chacun veut vraiment. Construire la paix, c’est réparer ce qui a été cassé entre les personnes.',ex:'Deux groupes se disputent le terrain de football : on établit ensemble un tour de passage écrit, plutôt que d’attendre la bagarre.'},
    'proteger l eau et l environnement':{def:'Protéger l’eau, c’est empêcher qu’elle soit salie ou gaspillée, parce que l’eau propre est rare et qu’une eau sale rend malade.',ex:'Fermer le robinet pendant le savonnage, ne pas laver les motos au bord du marigot, couvrir les récipients d’eau de boisson.'},
    'proteger les milieux et prevenir les risques':{def:'Un risque naturel est un danger qui peut frapper un lieu : inondation, érosion, feu de brousse. Prévenir, c’est agir avant, pour réduire les dégâts.',ex:'Planter des arbres sur une pente freine l’érosion ; curer les caniveaux avant la saison des pluies limite les inondations à Conakry.'},
    'proteger son environnement':{def:'L’environnement est tout ce qui entoure la personne : l’air, l’eau, le sol, les plantes et les animaux. Le protéger, c’est agir pour ne pas l’abîmer.',ex:'Jeter les ordures dans une poubelle et non dans le caniveau, ne pas brûler le plastique, planter un arbre dans la cour.'},
    'raconter un evenement avec des connecteurs chronologiques':{def:'Les connecteurs chronologiques sont les mots qui marquent le temps dans un récit : ils indiquent au lecteur l’ordre exact des moments.',ex:'D’abord, puis, ensuite, alors, plus tard, enfin : « D’abord la pluie est tombée, puis la route s’est remplie d’eau, enfin le taxi n’a pas pu passer. »'},
    'raconter un evenement dans l ordre':{def:'Raconter dans l’ordre, c’est dire ce qui s’est passé en premier, puis ensuite, puis à la fin, sans mélanger les moments.',ex:'D’abord je me suis levé, ensuite j’ai balayé la cour, enfin je suis parti à l’école.'},
    'raconter un evenement de la veille':{def:'Raconter un événement de la veille, c’est dire ce qui s’est passé hier, dans l’ordre, en utilisant les verbes au passé.',ex:'« Hier après l’école, je suis allé au marché avec ma tante, puis nous avons acheté du riz, et nous sommes rentrés avant la nuit. »'},
    'realiser un parcours athletique':{def:'L’athlétisme regroupe la course, le saut et le lancer. Un parcours athlétique enchaîne ces trois familles et se mesure au chronomètre ou à la distance.',ex:'30 m de course, un saut en longueur départ arrêté, un lancer de balle lestée : on note les trois résultats.'},
    'realiser un parcours de course saut et lancer':{def:'Un parcours enchaîne plusieurs actions différentes sans s’arrêter entre elles. La difficulté n’est pas chaque geste, mais le passage de l’un à l’autre.',ex:'Courir 15 m, franchir deux obstacles bas, puis lancer une balle dans un cerceau — le tout d’une seule traite.'},
    'reconnaitre et melanger les couleurs':{def:'Les couleurs primaires — rouge, jaune, bleu — ne se fabriquent pas. En mélangeant deux primaires, on obtient une couleur secondaire.',ex:'Jaune + bleu = vert. Rouge + jaune = orange. Rouge + bleu = violet.'},
    'reconnaitre et utiliser les couleurs':{def:'Une couleur est ce que l’œil perçoit de la lumière renvoyée par un objet. Reconnaître une couleur, c’est la nommer sans se tromper ; l’utiliser, c’est choisir la bonne pour représenter la chose réelle.',ex:'Les feuilles du manguier sont vertes, son tronc est brun, le ciel au-dessus est bleu.'},
    'reconnaitre montagne plateau plaine et vallee':{def:'Ce sont quatre formes du relief. La montagne est haute et pentue ; le plateau est haut mais plat ; la plaine est basse et plate ; la vallée est le creux allongé où coule l’eau.',ex:'Le Fouta-Djalon est un massif de montagnes et de plateaux ; la basse côte près de Conakry est une plaine.'},
    'reconstituer l histoire de son ecole':{def:'Reconstituer une histoire, c’est rassembler des traces — documents, souvenirs, objets — et les mettre dans l’ordre pour raconter ce qui s’est passé.',ex:'Année de construction dans le registre, souvenirs des anciens élèves, photos des directeurs successifs : on obtient la frise de l’école.'},
    'rediger une description precise et vivante':{def:'Une description est précise quand elle donne des détails exacts, et vivante quand elle fait appel aux sens et au mouvement plutôt qu’aux mots vagues.',ex:'Au lieu de « il y avait beaucoup de monde », écrire : « les vendeuses de mangues criaient leurs prix, et la poussière rouge collait aux pieds ».'},
    'refuser discrimination et exclusion':{def:'La discrimination, c’est traiter quelqu’un plus mal à cause de ce qu’il est. L’exclusion, c’est le tenir à l’écart du groupe. Les deux sont interdites et blessent durablement.',ex:'Une élève est écartée des jeux parce qu’elle vient d’un autre village : le groupe l’invite à jouer et le dit clairement à ceux qui l’écartaient.'},
    'relief et hydrographie de la guinee':{def:'La Guinée se partage en quatre régions naturelles, définies par leur relief : la Basse-Guinée côtière, la Moyenne-Guinée montagneuse, la Haute-Guinée de plateaux et de savanes, la Guinée forestière.',ex:'Le mont Nimba, en Guinée forestière, est le point culminant du pays ; le Niger traverse la Haute-Guinée.'},
    'respecter l arbitre et le fair play':{def:'L’arbitre est la personne chargée de faire appliquer la règle pendant le jeu. Le respecter, c’est accepter sa décision même quand on la croit injuste, et la discuter après le match, calmement.',ex:'Le but est refusé : le capitaine demande l’explication à la fin, l’équipe ne conteste pas sur le terrain.'},
    'respecter les differences':{def:'Respecter les différences, c’est traiter avec la même considération quelqu’un qui ne parle pas la même langue, ne prie pas de la même façon, ne vient pas de la même région ou ne marche pas comme nous.',ex:'Un nouvel élève arrive et parle mal le français : on l’écoute jusqu’au bout et on l’aide, au lieu de rire.'},
    'respecter les regles et le fair play':{def:'Le fair-play, c’est jouer honnêtement et accepter le résultat : on ne triche pas pour gagner et on ne se moque pas de celui qui perd.',ex:'L’équipe gagnante va serrer la main de l’équipe perdante à la fin du match.'},
    'respecter une regle dans un jeu collectif':{def:'Une règle de jeu est la même pour tous et se décide avant de commencer. La respecter, c’est ce qui rend le jeu possible : sans règle, il n’y a plus de jeu, seulement une dispute.',ex:'Au jeu de l’épervier, celui qui est touché sort. S’il reste malgré tout, plus personne ne sait qui a gagné.'},
    'ressources minieres et energie':{def:'Une ressource minière est une matière utile extraite du sous-sol. L’énergie est ce qui permet de faire fonctionner machines, lumière et transports.',ex:'La Guinée détient d’immenses réserves de bauxite, minerai dont on tire l’aluminium ; le barrage de Kaléta produit de l’électricité sur le fleuve Konkouré.'},
    'saluer et prendre conge':{def:'Saluer, c’est dire un mot poli en arrivant près de quelqu’un ; prendre congé, c’est dire un mot poli avant de partir. Ces mots changent selon le moment de la journée et selon la personne à qui on parle.',ex:'En arrivant à l’école on dit « Bonjour, maîtresse ». En partant le soir on dit « Au revoir, à demain ».'},
    'samory toure et les resistances':{def:'Samory Touré construisit à la fin du XIXe siècle un vaste État en Haute-Guinée et résista à la conquête française pendant près de dix-sept ans, jusqu’à sa capture en 1898.',ex:'Il fit fabriquer et réparer des armes par ses propres forgerons, et déplaça plusieurs fois son État pour échapper aux colonnes françaises.'},
    'sauter par dessus de petits obstacles':{def:'Sauter un obstacle, c’est prendre appel sur un pied, franchir sans toucher, puis retomber en pliant les genoux pour amortir.',ex:'Un parcours de trois branches posées au sol, écartées d’un grand pas.'},
    'se presenter et demander le nom':{def:'Se présenter, c’est dire son nom à quelqu’un qui ne le connaît pas encore. Demander le nom, c’est poser une question polie pour connaître celui de l’autre.',ex:'« Je m’appelle Mariama. Et toi, comment tu t’appelles ? » — « Moi, je m’appelle Ibrahima. »'},
    'se reperer sur sous devant et derriere':{def:'Ces mots disent la position d’un objet par rapport à un autre. On les appelle des mots de position : sans eux, on ne sait pas où chercher.',ex:'Le cahier est sur la table, le sac est sous le banc, le tableau est devant la classe, la porte est derrière moi.'},
    'securite sante et usage responsable du numerique':{def:'Un usage responsable du numérique, c’est se servir du téléphone et d’internet sans mettre en danger sa santé, sa sécurité ni celle des autres.',ex:'On ne publie pas la photo d’un camarade sans son accord, on ne donne jamais son adresse à un inconnu, et on repose le téléphone avant de dormir.'},
    'situer la guinee en afrique de l ouest':{def:'Situer un pays, c’est indiquer sa position par rapport aux points cardinaux, à ses voisins et à la mer.',ex:'La Guinée a pour voisins la Guinée-Bissau, le Sénégal et le Mali au nord, la Côte d’Ivoire à l’est, le Liberia et la Sierra Leone au sud ; l’Atlantique la borde à l’ouest.'},
    'situer la guinee et reconnaitre ses symboles cartographiques':{def:'Situer un pays, c’est dire où il se trouve et ce qui l’entoure. Sur une carte, des symboles conventionnels remplacent la réalité : un point pour une ville, une ligne bleue pour un fleuve.',ex:'La Guinée est en Afrique de l’Ouest, ouverte sur l’océan Atlantique ; sur la carte, Conakry est un point plus gros que les autres, car c’est la capitale.'},
    'situer les grandes regions et milieux de l afrique':{def:'L’Afrique se divise en grands ensembles régionaux — Nord, Ouest, Centre, Est, Australe — et en grands milieux naturels : désert, savane, forêt dense, zone méditerranéenne.',ex:'Le Sahara occupe tout le nord ; la forêt dense s’étend autour du golfe de Guinée ; entre les deux court la bande de savane du Sahel.'},
    'soustraire sans emprunt':{def:'Soustraire, c’est enlever une quantité d’une autre. Sans emprunt veut dire que dans chaque colonne, le chiffre du haut est assez grand pour qu’on puisse retirer celui du bas.',ex:'48 − 25 : 8 − 5 = 3 pour les unités, 4 − 2 = 2 pour les dizaines. Résultat : 23.'},
    'squelette articulations et muscles':{def:'Le squelette est l’ensemble des os qui tiennent le corps debout et protègent les organes. Les articulations sont les endroits où deux os se rejoignent et permettent le mouvement. Les muscles tirent sur les os pour produire ce mouvement.',ex:'Pour plier le bras, l’articulation du coude s’ouvre et se ferme pendant que le muscle du bras, le biceps, se contracte.'},
    'suivre un rythme simple':{def:'Le rythme est le retour régulier de sons forts et de sons faibles dans le temps. Le suivre, c’est frapper exactement au même moment que le modèle.',ex:'Frapper dans les mains : fort — faible — fort — faible, en marchant sur place au même tempo.'},
    'transports communication et echanges':{def:'Les échanges sont les mouvements de marchandises et de personnes entre les lieux. Ils dépendent directement de la qualité des transports et des communications.',ex:'Le minerai de bauxite de Boké part par voie ferrée jusqu’au port de Kamsar, puis par bateau vers l’étranger.'},
    'traverser la route en securite':{def:'Traverser en sécurité, c’est s’assurer avant de s’engager qu’aucun véhicule ne peut nous atteindre, et rester visible pendant toute la traversée.',ex:'On s’arrête au bord, on regarde à gauche, à droite, encore à gauche ; on traverse en marchant droit, sans courir ni téléphoner.'},
    'utiliser l argent pour un petit achat':{def:'Faire un achat, c’est échanger de l’argent contre une marchandise. Il faut savoir combien coûte l’article, combien on donne, et combien le vendeur doit rendre.',ex:'Un pain coûte 2 000 GNF. Je donne 5 000 GNF. Le vendeur doit me rendre 3 000 GNF.'},
    'utiliser la monnaie avec honnetete':{def:'Être honnête avec l’argent, c’est payer le prix juste, rendre exactement la monnaie due et restituer ce qui ne nous appartient pas.',ex:'La vendeuse rend 5 000 GNF de trop : on le lui signale et on lui rend le billet.'},
    'utiliser le franc guineen dans un achat':{def:'Le franc guinéen (GNF) est la monnaie de la Guinée. Utiliser la monnaie, c’est reconnaître les billets, additionner ce qu’on achète et vérifier ce qu’on rend.',ex:'Deux savons à 6 000 GNF et un cahier à 8 000 GNF font 20 000 GNF. Avec un billet de 20 000, il n’y a rien à rendre.'},
    'utiliser sources et frise chronologique':{def:'Une source est tout document qui renseigne sur le passé : texte, image, objet, récit oral. L’historien croise plusieurs sources, puis place ce qu’il a établi sur une frise.',ex:'Pour dater la fondation d’un village : le récit du chef, un acte administratif colonial et la date gravée sur la mosquée — on compare les trois.'},
    'utiliser une photo ou un objet comme temoignage':{def:'Un témoignage est une trace laissée par le passé qui nous renseigne sur lui. Une photo, un outil, un vêtement racontent une époque même quand personne ne parle.',ex:'Une photo de la classe en 1985 montre les uniformes, les bancs de bois et le nombre d’élèves : trois informations que personne n’avait écrites.'}
  };

  function primaryTheme_v471(titre){
    var k=primaryNormalizeKey(titre);
    return (k&&PRIMARY_THEMES_V471[k])||null;
  }

  /* V471 : quand une couleur est nommee, la couleur elle-meme doit se voir.
     Une pastille de la vraie teinte est posee apres le mot, et un mot de couleur
     recoit une pastille pleine comme illustration au lieu d'une carte-mot. */
  var PRIMARY_COULEURS_V471={
    'rouge':'#D22B2B','bleu':'#1D4ED8','jaune':'#F5C518','vert':'#1B8A3A',
    'noir':'#1B1B1B','blanc':'#FFFFFF','orange':'#E8720C','violet':'#7A3EA1',
    'rose':'#E8709B','marron':'#7B4B2A','brun':'#7B4B2A','gris':'#8C8C8C',
    'beige':'#D9C7A3','indigo':'#31356E','ocre':'#C9862F','or':'#D4A017',
    'argent':'#B8BDC4','turquoise':'#1AA5A0','bordeaux':'#7B1E2B'
  };
  var PRIMARY_COULEUR_MOTS_V471=Object.keys(PRIMARY_COULEURS_V471);
  function primaryCouleurHex_v471(mot){
    var k=primaryNormalizeKey(mot);
    if(PRIMARY_COULEURS_V471[k])return PRIMARY_COULEURS_V471[k];
    k=k.replace(/e$/,'').replace(/s$/,'');
    return PRIMARY_COULEURS_V471[k]||'';
  }
  function primaryPastilleCouleur_v471(nom){
    var hex=primaryCouleurHex_v471(nom);
    if(!hex)return '';
    return '<b class="nx-primary-pastille-v471" style="background:'+hex+'" title="'+esc(nom)+'" aria-hidden="true"></b>';
  }
  /* Le texte est d'abord echappe, puis chaque nom de couleur recoit sa pastille. */
  function primaryTexteCouleur_v471(texte){
    var out=esc(texte);
    PRIMARY_COULEUR_MOTS_V471.forEach(function(nom){
      var hex=PRIMARY_COULEURS_V471[nom];
      var motif=new RegExp('(^|[^a-zA-Zàâäéèêëîïôöùûüç])('+nom+'e?s?)(?![a-zA-Zàâäéèêëîïôöùûüç])','gi');
      out=out.replace(motif,function(_t,avant,mot){
        return avant+mot+'<b class="nx-primary-pastille-v471" style="background:'+hex+'" aria-hidden="true"></b>';
      });
    });
    return out;
  }
  function primaryCouleurSvg_v471(nom){
    var hex=primaryCouleurHex_v471(nom);
    if(!hex)return '';
    var bord=(hex.toUpperCase()==='#FFFFFF')?'#B6B2A7':'rgba(0,0,0,.18)';
    return '<svg viewBox="0 0 64 64" role="img" aria-label="Couleur '+esc(nom)+'">'+
      '<rect x="6" y="6" width="52" height="52" rx="8" fill="'+hex+'" stroke="'+bord+'" stroke-width="2"/></svg>';
  }
  /* Bandeau « Les couleurs de la lecon » : uniquement si la lecon en nomme. */
  function primaryCouleursDeLaLecon_v471(textes){
    var vues={},liste=[];
    (textes||[]).forEach(function(t){
      var mots=primaryNormalizeKey(t).split(' ');
      mots.forEach(function(m){
        var hex=primaryCouleurHex_v471(m);
        if(!hex||vues[hex])return;
        var nom=PRIMARY_COULEUR_MOTS_V471.filter(function(c){return PRIMARY_COULEURS_V471[c]===hex;})[0]||m;
        vues[hex]=true;liste.push(nom);
      });
    });
    if(!liste.length)return '';
    return '<section class="nx-primary-couleurs-v471"><h4>Les couleurs de la leçon</h4>'+
      '<p>Voici la vraie teinte de chaque couleur nommée. Montre-la à l’élève avant de commencer.</p>'+
      '<ul>'+liste.map(function(nom){
        return '<li><span class="nx-primary-couleur-case-v471">'+primaryCouleurSvg_v471(nom)+'</span><b>'+esc(nom)+'</b></li>';
      }).join('')+'</ul></section>';
  }

  function primaryThemeFor(sub,lesson){
    return String(lesson.theme||lesson.title||sub.name||'Notion du jour').trim();
  }
  /* V463 : si la notion du titre figure au lexique, on donne la vraie définition
     plutôt qu'une phrase fabriquée à partir du résumé. */
  function primaryThemeDefinition(lesson){
    var theme=primaryTheme_v471(lesson&&lesson.title);
    if(theme)return theme['def'];
    var entree=primaryLexique_v463(lesson&&lesson.title);
    if(entree)return entree['def'];
    var summary=String(lesson.summary||'').trim().replace(/[.。]+$/,'');
    if(!summary)return 'Ce thème présente la notion du jour, son vocabulaire et son application dans une situation simple.';
    return 'Ce thème apprend à '+summary.charAt(0).toLowerCase()+summary.slice(1)+'.';
  }
  function primaryThemeExemple_v463(lesson){
    var theme=primaryTheme_v471(lesson&&lesson.title);
    if(theme&&theme.ex)return theme.ex;
    var entree=primaryLexique_v463(lesson&&lesson.title);
    if(entree)return entree.ex;
    return '';
  }
  function primaryNotionsFor(lesson){
    var activity=PRIMARY_GUIDED_VISUALS[lesson.title],seen={},out=[];
    ((activity&&activity.items)||[]).forEach(function(item){
      var word=String(item.word||'').trim(),key=primaryNormalizeKey(word);
      if(!word||!key||seen[key]||word.length>48)return;
      seen[key]=true;out.push(word);
    });
    if(!out.length)out.push(String(lesson.title||'Notion principale'));
    return out.slice(0,5);
  }
  var PRIMARY_CARD_KINDS={'word-card':1,'letter-card':1,'digit-card':1};
  var PRIMARY_DIAGRAM_KINDS={'language-diagram':1,'math-diagram':1,'science-diagram':1,'history-diagram':1,'geography-diagram':1,'civic-diagram':1,'art-diagram':1,'action-diagram':1,'daily-diagram':1,'concept-diagram':1};
  function primaryCardVisual(kind,label){
    var text=String(label||'').trim(),safe=esc(text||'notion'),shown=text,size=26,sub='';
    if(kind==='letter-card'){
      var m=text.replace(/[’']/g,' ').trim().split(/\s+/);
      shown=(m[m.length-1]||text).toUpperCase();shown=shown.charAt(0);size=64;sub=shown.toLowerCase();
    }else if(kind==='digit-card'){
      var d=text.match(/\d+/);shown=d?d[0]:text;size=shown.length>2?46:64;
    }else{
      if(shown.length>26)shown=shown.slice(0,25)+'…';
      size=shown.length>18?15:(shown.length>11?19:24);
    }
    return '<span class="nx-primary-art-shell-v340 svg card" role="img" aria-label="'+safe+'">'+
      '<svg viewBox="0 0 160 120" aria-hidden="true">'+
      '<rect x="10" y="14" width="140" height="92" rx="14" fill="#fffdf5" stroke="#1f3d5c" stroke-width="4"/>'+
      '<rect x="10" y="14" width="140" height="14" rx="7" fill="#2f7fd1"/>'+
      '<text x="80" y="'+(sub?66:74)+'" text-anchor="middle" font-size="'+size+'" font-family="sans-serif" font-weight="700" fill="#1f3d5c">'+esc(shown)+'</text>'+
      (sub?'<text x="80" y="96" text-anchor="middle" font-size="30" font-family="sans-serif" fill="#e2574c">'+esc(sub)+'</text>':'')+
      '</svg></span>';
  }
  function primarySvgVisual(kind,label){
    var body=PRIMARY_ART_LIB[kind];
    if(!body)return '';
    return '<span class="nx-primary-art-shell-v340 svg" role="img" aria-label="Illustration de '+esc(label||'la notion')+'">'+
      '<svg viewBox="0 0 160 120" aria-hidden="true">'+body+'</svg></span>';
  }
  function primaryDiagramLines(label){
    var words=String(label||'').trim().split(/\s+/),lines=[],line='';
    words.forEach(function(word){
      if(!line){line=word;return;}
      if((line+' '+word).length<=21){line+=' '+word;return;}
      lines.push(line);line=word;
    });
    if(line)lines.push(line);
    return lines.slice(0,4);
  }
  function primaryDiagramVisual(kind,label){
    var icons={
      'language-diagram':'<path d="M38 16c18-8 32-6 42 2v40c-10-8-24-10-42-2zM122 16c-18-8-32-6-42 2v40c10-8 24-10 42-2z" fill="#fffdf5" stroke="#1f3d5c" stroke-width="4"/><path d="M80 18v40M48 30h22M90 30h22M48 42h18M94 42h18" stroke="#2f7fd1" stroke-width="3"/>',
      'math-diagram':'<rect x="30" y="14" width="100" height="45" rx="8" fill="#fffdf5" stroke="#1f3d5c" stroke-width="4"/><path d="M45 28h70M45 44h70" stroke="#94a3b8" stroke-width="3"/><g fill="#f5b93b"><circle cx="55" cy="28" r="6"/><circle cx="78" cy="28" r="6"/><circle cx="101" cy="28" r="6"/></g><path d="M64 48h32" stroke="#e2574c" stroke-width="5"/>',
      'science-diagram':'<circle cx="62" cy="34" r="18" fill="#bfe3f5" stroke="#1f3d5c" stroke-width="4"/><path d="M75 48l16 16" stroke="#1f3d5c" stroke-width="7"/><path d="M96 48c4-22 24-28 34-20-2 22-16 32-34 20z" fill="#7fb069" stroke="#3f7d3f" stroke-width="3"/><path d="M98 48l24-16" stroke="#3f7d3f" stroke-width="3"/>',
      'history-diagram':'<path d="M25 38h110" stroke="#1f3d5c" stroke-width="5"/><path d="M126 28l12 10-12 10" fill="none" stroke="#1f3d5c" stroke-width="5"/><circle cx="44" cy="38" r="9" fill="#e2574c"/><circle cx="80" cy="38" r="9" fill="#f5b93b"/><circle cx="116" cy="38" r="9" fill="#7fb069"/><path d="M44 20v36M80 20v36M116 20v36" stroke="#94a3b8" stroke-width="2"/>',
      'geography-diagram':'<path d="M22 56l30-38 28 30 22-26 36 34z" fill="#7fb069" stroke="#3f7d3f" stroke-width="3"/><path d="M76 50c12 2 20 10 25 18" fill="none" stroke="#2f7fd1" stroke-width="7"/><circle cx="128" cy="24" r="14" fill="#fffdf5" stroke="#1f3d5c" stroke-width="3"/><path d="M128 13v22M117 24h22" stroke="#e2574c" stroke-width="3"/>',
      'civic-diagram':'<circle cx="54" cy="30" r="12" fill="#c98b5e"/><circle cx="106" cy="30" r="12" fill="#c98b5e"/><path d="M36 60c0-15 7-23 18-23s18 8 18 23M88 60c0-15 7-23 18-23s18 8 18 23" fill="#2f7fd1"/><path d="M80 42c-7-10-20-2-15 8 4 8 15 14 15 14s11-6 15-14c5-10-8-18-15-8z" fill="#e2574c"/>',
      'art-diagram':'<path d="M58 14c-26 0-42 18-42 38 0 18 14 30 30 30h10c8 0 10-8 7-13-4-7 2-11 10-11h13c18 0 30-8 30-22 0-14-22-22-58-22z" fill="#f4ead6" stroke="#1f3d5c" stroke-width="4"/><g><circle cx="38" cy="38" r="7" fill="#e2574c"/><circle cx="58" cy="28" r="7" fill="#f5b93b"/><circle cx="80" cy="28" r="7" fill="#7fb069"/><circle cx="96" cy="42" r="7" fill="#2f7fd1"/></g><path d="M116 18v42M116 22l24-6v36" stroke="#1f3d5c" stroke-width="6"/><circle cx="108" cy="62" r="9" fill="#2f7fd1"/><circle cx="132" cy="54" r="9" fill="#e2574c"/>',
      'action-diagram':'<circle cx="68" cy="18" r="10" fill="#c98b5e"/><path d="M68 30l10 28M74 42l-30 14M76 42l30-16M78 58l-24 34M78 58l32 26" stroke="#c98b5e" stroke-width="8" stroke-linecap="round"/><path d="M112 62h26M130 52l10 10-10 10" fill="none" stroke="#e2574c" stroke-width="5"/>',
      'daily-diagram':'<rect x="28" y="16" width="80" height="48" rx="8" fill="#fffdf5" stroke="#1f3d5c" stroke-width="4"/><path d="M28 32h80" stroke="#2f7fd1" stroke-width="8"/><circle cx="130" cy="28" r="15" fill="#f5b93b"/><path d="M130 6v8M130 42v8M108 28h8M144 28h8" stroke="#f5b93b" stroke-width="4"/>',
      'concept-diagram':'<path d="M80 10a27 27 0 0 0-17 48c7 6 9 11 9 18h16c0-7 2-12 9-18A27 27 0 0 0 80 10z" fill="#f5b93b" stroke="#8b5e3c" stroke-width="4"/><path d="M70 84h20M72 94h16" stroke="#1f3d5c" stroke-width="5"/><path d="M80 20v12M50 30l9 8M110 30l-9 8" stroke="#fffdf5" stroke-width="4"/>'
    };
    var lines=primaryDiagramLines(label),start=lines.length>3?78:84,size=lines.some(function(line){return line.length>18;})?11:12;
    var text=lines.map(function(line,index){return '<text x="80" y="'+(start+index*12)+'" text-anchor="middle" font-size="'+size+'" font-family="sans-serif" font-weight="800" fill="#1f3d5c">'+esc(line)+'</text>';}).join('');
    return '<span class="nx-primary-art-shell-v340 svg diagram" role="img" aria-label="Schéma explicatif : '+esc(label||'la notion')+'"><svg viewBox="0 0 160 132" aria-hidden="true"><rect x="4" y="4" width="152" height="124" rx="16" fill="#fffdf5" stroke="#dbe5f0" stroke-width="3"/>'+(icons[kind]||icons['concept-diagram'])+text+'</svg></span>';
  }
  /* V440 : l'image affichee correspond au mot prononce. Aucun pictogramme choisi au hasard :
     soit une illustration dessinee verifiee, soit une carte portant le mot lui-meme. */
  /* V463 : certains mots de sciences n'avaient aucune image, seulement le mot écrit
     sur une carte. Ce tableau relie le mot au dessin correspondant. */
  var PRIMARY_WORD_ART_V463={
    "vivant": "alive-animal",
    "animal vivant": "alive-animal",
    "vegetal vivant": "alive-plant",
    "non vivant": "stone",
    "pierre": "stone",
    "pierre non vivante": "stone",
    "objet naturel": "natural-object",
    "objet fabrique": "made-object",
    "objet technique": "made-object",
    "cerveau": "brain",
    "os": "bones",
    "muscles": "muscles",
    "articulations": "joints",
    "intestins": "intestines",
    "arteres": "blood-vessels",
    "veines": "blood-vessels",
    "vaisseaux": "blood-vessels",
    "nerfs": "nerves",
    "reflexe": "reflex",
    "stimulus": "reflex",
    "etat solide": "solid-state",
    "etat liquide": "liquid-state",
    "vapeur": "vapor",
    "fusion": "melting",
    "changement d etat": "melting",
    "transformation": "melting",
    "dissolution": "dissolving",
    "melange homogene": "mix-homogeneous",
    "melange heterogene": "mix-heterogeneous",
    "levier": "lever",
    "force": "force",
    "mouvement": "movement",
    "ruissellement": "runoff",
    "precipitations": "rainfall",
    "sol sableux": "sandy-soil",
    "sol argileux": "clay-soil",
    "minera": "stone",
    "mineraux": "stone",
    "producteur": "producer",
    "consommateur": "consumer",
    "predateur": "predator",
    "reseau alimentaire": "consumer",
    "tambour": "drum",
    "moustique": "mosquito",
    "se proteger des moustiques": "mosquito",
    "porter des habits propres": "clean-clothes",
    "porter des vetements propres": "clean-clothes",
    "vetement qui seche": "clean-clothes",
    "serviette": "towel",
    "nettoyer la cour": "clean-yard",
    "recipient ferme": "closed-container",
    "recipient propre": "closed-container",
    "repas varie": "varied-meal",
    "repos": "rest",
    "mammiferes": "goat",
    "oiseaux": "bird",
    "reptiles": "lizard",
    "omnivore": "meal",
    "lavage des mains": "handwash",
    "mains propres": "handwash",
    "nutriments": "meal",
    "cultures": "field",
    "culture adaptee": "field",
    "nager": "fish",
    "voler": "bird",
    "ramper": "lizard",
    "eviter les feux dangereux": "fire",
    "reutiliser et nettoyer": "waste-bin",
    "fil": "lamp",
    "fils": "lamp",
    "dioxyde de carbone": "plant-parts"
  };
  function primaryWordArt_v463(item){
    return PRIMARY_WORD_ART_V463[primaryPhotoKey_v463(item&&item.word)]||'';
  }
  function primaryValidatedArt(item){
    /* V471 : « rouge » ne doit pas s'afficher comme un mot ecrit sur une carte. */
    var couleur=primaryCouleurSvg_v471(item&&item.word);
    if(couleur)return {kind:'',art:'',html:couleur};
    var kind=String(item&&item.kind||'');
    if(kind&&PRIMARY_DIAGRAM_KINDS[kind])return {kind:kind,art:'',diagram:true};
    if(kind&&PRIMARY_ART_LIB[kind])return {kind:kind,art:''};
    var dessine=primaryWordArt_v463(item);
    if(dessine&&PRIMARY_ART_LIB[dessine])return {kind:dessine,art:''};
    if(kind&&PRIMARY_CARD_KINDS[kind])return {kind:kind,art:'',card:true};
    var art=String(item&&item.art||'').trim();
    if(art)return {kind:'',art:art};
    return {kind:'word-card',art:'',card:true};
  }
  /* ================================================================
     V463 · PHOTOGRAPHIES RÉELLES
     En sciences d'observation, un dessin ne suffit pas : l'élève doit
     reconnaître la chose telle qu'il la voit dehors. Chaque mot peut
     donc recevoir une vraie photographie.

     Pour ajouter une photo, une seule ligne suffit ici :
        'chevre': 'https://…/chevre.jpg',
     La clé est le mot en minuscules, sans accent ni article.
     Tant qu'aucune photo n'est fournie, le dessin reste affiché mais
     il est explicitement étiqueté « Schéma » : personne ne prend un
     dessin pour la réalité.
     Hébergez les images dans le compartiment Supabase du projet et
     gardez-les sous 120 Ko : la connexion est souvent lente.
     ================================================================ */
  var PRIMARY_PHOTOS_V463={};
  function primaryPhotoKey_v463(word){
    return String(word||'').toLowerCase()
      .replace(/œ/g,'oe').replace(/æ/g,'ae')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/^(les|une|des|le|la|un|l|d)[’' ]+/,'')
      .replace(/[^a-z0-9]+/g,' ').trim();
  }
  function primaryPhotoFor_v463(item){
    if(item&&item.photo)return String(item.photo);
    var k=primaryPhotoKey_v463(item&&item.word);
    return PRIMARY_PHOTOS_V463[k]||'';
  }
  function primaryPhotoMarkup_v463(src,word){
    return '<span class="nx-primary-art-shell-v340 photo nx-primary-photo-v463">'+
      '<img src="'+esc(src)+'" alt="Photographie : '+esc(word)+'" loading="lazy" decoding="async">'+
      '<u class="nx-primary-art-badge-v463 real">Photo</u></span>';
  }
  function primaryVisualMarkup(item){
    var word=String(item&&item.word||'la notion'),visual=primaryValidatedArt(item);
    var photo=primaryPhotoFor_v463(item);
    if(photo)return primaryPhotoMarkup_v463(photo,word);
    if(visual.html)return '<span class="nx-primary-art-shell-v340 svg" role="img" aria-label="Couleur '+esc(word)+'">'+visual.html+'</span><u class="nx-primary-art-badge-v463">Couleur</u>';
    if(visual.diagram)return primaryDiagramVisual(visual.kind,word)+'<u class="nx-primary-art-badge-v463">Schéma explicatif</u>';
    if(visual.card)return primaryCardVisual(visual.kind,word)+'<u class="nx-primary-art-badge-v463 word">Mot écrit</u>';
    if(visual.kind)return primarySvgVisual(visual.kind,word)+'<u class="nx-primary-art-badge-v463">Schéma</u>';
    return '<span class="nx-primary-art-shell-v340" role="img" aria-label="Illustration de '+esc(word)+'">'+esc(visual.art)+'</span>';
  }
  function primaryPronunciationGuide(item){
    var spoken=String(item&&item.speech||item&&item.word||'').trim(),key=primaryNormalizeKey(spoken);
    return PRIMARY_PRONUNCIATION_GUIDES[key]||spoken;
  }
  function primarySpeechText(value){
    return String(value==null?'':value)
      .replace(/\bGNF\b/g,'francs guinéens')
      .replace(/cm³/g,'centimètres cubes').replace(/m³/g,'mètres cubes').replace(/km²/g,'kilomètres carrés')
      .replace(/(\d)\s*%\b/g,'$1 pour cent')
      .replace(/\s+\+\s+/g,' plus ').replace(/\s+[−–]\s+/g,' moins ').replace(/\s+=\s+/g,' égale ')
      .replace(/\bCP1\b/g,'C P un').replace(/\bCP2\b/g,'C P deux')
      .replace(/\bCE1\b/g,'C E un').replace(/\bCE2\b/g,'C E deux')
      .replace(/\bCM1\b/g,'C M un').replace(/\bCM2\b/g,'C M deux')
      .replace(/\s+/g,' ').trim();
  }
  /* V441 : chaque mot nomme pendant la lecon est aussi defini. */
  /* ================================================================
     V463 · LE LEXIQUE DU MAÎTRE
     La définition automatique (« Ce thème apprend à… ») ne définit rien.
     Ici, chaque notion reçoit la définition qu’un maître écrit au tableau,
     puis un exemple pris dans la vie de l’enfant.
     Pour ajouter une notion : une clé (mot sans article ni accent),
     une définition, un exemple.
     ================================================================ */
  var PRIMARY_LEXIQUE_V463={
    "unite": {
      "def": "Une unité, c’est un seul objet. C’est le rang le plus à droite d’un nombre : il compte les objets tout seuls, un par un.",
      "ex": "Dans 4 séances, il y a 4 unités. Dans 372, le chiffre des unités est 2 : il reste 2 objets seuls."
    },
    "unites": {
      "def": "Les unités sont les objets comptés un par un. Dans un nombre écrit, c’est le chiffre le plus à droite.",
      "ex": "Dans 68 mangues, le chiffre des unités est 8 : après avoir fait 6 paquets de 10, il reste 8 mangues seules."
    },
    "dizaine": {
      "def": "Une dizaine, c’est un paquet de 10 unités. On échange 10 objets seuls contre 1 dizaine.",
      "ex": "10 crayons attachés ensemble font 1 dizaine. Dans 47, il y a 4 dizaines : 4 paquets de 10 crayons, et 7 crayons seuls."
    },
    "dizaines": {
      "def": "Les dizaines comptent les paquets de 10. C’est le deuxième chiffre en partant de la droite.",
      "ex": "Dans 372, le chiffre des dizaines est 7 : 7 paquets de 10, c’est-à-dire 70."
    },
    "centaine": {
      "def": "Une centaine, c’est un paquet de 100 unités, ou 10 dizaines réunies.",
      "ex": "100 francs guinéens en pièces de 10 font 1 centaine. Dans 372, il y a 3 centaines, c’est-à-dire 300."
    },
    "centaines": {
      "def": "Les centaines comptent les paquets de 100. C’est le troisième chiffre en partant de la droite.",
      "ex": "Dans 684, le chiffre des centaines est 6 : 600."
    },
    "millier": {
      "def": "Un millier, c’est un paquet de 1 000 unités, c’est-à-dire 10 centaines réunies. C’est le rang qui vient juste après les centaines.",
      "ex": "Un sac de 1 000 grains de riz, c’est 1 millier de grains. Dans 3 452, le chiffre des milliers est 3 : cela fait 3 000."
    },
    "milliers": {
      "def": "Les milliers comptent les paquets de 1 000. C’est le quatrième chiffre en partant de la droite.",
      "ex": "Dans 7 254, il y a 7 milliers : 7 000. On lit « sept mille deux cent cinquante-quatre »."
    },
    "dizaine de mille": {
      "def": "Une dizaine de mille, c’est 10 milliers réunis, donc 10 000 unités.",
      "ex": "Dans 45 200, le chiffre 4 est au rang des dizaines de mille : il vaut 40 000."
    },
    "dizaines de mille": {
      "def": "Les dizaines de mille comptent les paquets de 10 000. C’est le cinquième chiffre en partant de la droite.",
      "ex": "Dans 62 800, il y a 6 dizaines de mille, soit 60 000."
    },
    "centaine de mille": {
      "def": "Une centaine de mille, c’est 100 milliers, donc 100 000 unités.",
      "ex": "Dans 348 000, le chiffre 3 est au rang des centaines de mille : il vaut 300 000."
    },
    "million": {
      "def": "Un million, c’est 1 000 milliers, donc 1 000 000 d’unités. On l’écrit avec un 1 suivi de six zéros.",
      "ex": "La population de Conakry dépasse 2 millions d’habitants : plus de 2 000 000 de personnes."
    },
    "chiffre 1": {
      "def": "Le chiffre 1 sert à écrire « un ». Un, c’est une seule chose.",
      "ex": "1 cahier, 1 main, 1 soleil."
    },
    "zero": {
      "def": "Zéro, c’est quand il n’y a rien du tout. Le chiffre 0 sert aussi à marquer un rang vide dans un nombre.",
      "ex": "S’il n’y a plus de mangues dans le panier, il y a zéro mangue. Dans 305, le 0 dit qu’il n’y a aucune dizaine."
    },
    "plus grand": {
      "def": "Un nombre est plus grand qu’un autre quand il compte davantage d’objets. On l’écrit avec le signe >.",
      "ex": "48 > 35 : quarante-huit est plus grand que trente-cinq."
    },
    "plus petit": {
      "def": "Un nombre est plus petit qu’un autre quand il compte moins d’objets. On l’écrit avec le signe <.",
      "ex": "35 < 48 : trente-cinq est plus petit que quarante-huit."
    },
    "egal": {
      "def": "Deux nombres sont égaux quand ils comptent exactement la même chose. On écrit le signe =.",
      "ex": "3 + 4 = 7 : trois plus quatre, c’est la même chose que sept."
    },
    "ordre croissant": {
      "def": "Ranger en ordre croissant, c’est écrire les nombres du plus petit au plus grand.",
      "ex": "12, 25, 40, 63 sont rangés en ordre croissant."
    },
    "encadrer": {
      "def": "Encadrer un nombre, c’est trouver un nombre plus petit et un nombre plus grand qui l’entourent.",
      "ex": "On encadre 347 entre les centaines : 300 < 347 < 400."
    },
    "arrondir": {
      "def": "Arrondir, c’est remplacer un nombre par un nombre rond proche, pour calculer plus vite.",
      "ex": "Arrondi à la centaine, 347 devient 300 ; 362 devient 400, car il est plus près de 400."
    },
    "ordre de grandeur": {
      "def": "L’ordre de grandeur, c’est le résultat approché d’un calcul, obtenu avec des nombres ronds. Il sert à vérifier.",
      "ex": "Pour 297 + 412, l’ordre de grandeur est 300 + 400 = 700. Si on trouve 1 200, c’est qu’on s’est trompé."
    },
    "addition": {
      "def": "L’addition, c’est réunir deux quantités pour savoir combien on a en tout. Son signe est +.",
      "ex": "Fatou a 12 mangues, Sékou lui en donne 7 : 12 + 7 = 19 mangues en tout."
    },
    "soustraction": {
      "def": "La soustraction, c’est retirer une quantité d’une autre pour savoir ce qui reste. Son signe est −.",
      "ex": "Il y avait 20 élèves, 6 sont sortis : 20 − 6 = 14 élèves restent en classe."
    },
    "multiplication": {
      "def": "La multiplication, c’est une addition répétée : on ajoute plusieurs fois le même nombre. Son signe est ×.",
      "ex": "4 paquets de 5 crayons : 5 + 5 + 5 + 5 = 20, ce qui s’écrit plus vite 4 × 5 = 20."
    },
    "division": {
      "def": "La division, c’est partager une quantité en parts égales, ou chercher combien de fois un nombre est contenu dans un autre. Son signe est ÷.",
      "ex": "12 mangues partagées entre 3 enfants : 12 ÷ 3 = 4 mangues chacun."
    },
    "retenue": {
      "def": "La retenue, c’est la dizaine nouvelle qui se forme quand une colonne dépasse 9. On la reporte sur la colonne de gauche.",
      "ex": "8 + 5 = 13 : j’écris 3 aux unités et je retiens 1 dizaine."
    },
    "retenues": {
      "def": "Les retenues sont les paquets de 10 formés dans une colonne et reportés sur la colonne suivante.",
      "ex": "Dans 47 + 38 : 7 + 8 = 15, j’écris 5 et je retiens 1. Puis 4 + 3 + 1 = 8. Résultat : 85."
    },
    "emprunter": {
      "def": "Emprunter, c’est prendre une dizaine à la colonne de gauche quand il n’y a pas assez d’unités pour soustraire.",
      "ex": "Dans 52 − 7 : on ne peut pas faire 2 − 7. On emprunte 1 dizaine : 12 − 7 = 5. Il reste 4 dizaines. Résultat : 45."
    },
    "quotient": {
      "def": "Le quotient, c’est le résultat d’une division : le nombre de parts, ou ce que reçoit chaque part.",
      "ex": "Dans 17 ÷ 5, le quotient est 3 : chaque enfant reçoit 3 objets."
    },
    "reste": {
      "def": "Le reste, c’est ce qui ne peut plus être partagé également. Il est toujours plus petit que le diviseur.",
      "ex": "17 ÷ 5 = 3 et il reste 2 : après 3 objets chacun pour 5 enfants, il reste 2 objets."
    },
    "double": {
      "def": "Le double d’un nombre, c’est ce nombre pris deux fois. On multiplie par 2.",
      "ex": "Le double de 18, c’est 18 + 18 = 36."
    },
    "moitie": {
      "def": "La moitié, c’est l’une des deux parts égales d’une quantité. On divise par 2.",
      "ex": "La moitié de 40 francs, c’est 20 francs. La moitié d’une orange, c’est un demi."
    },
    "multiple": {
      "def": "Un multiple d’un nombre, c’est le résultat de ce nombre multiplié par 1, 2, 3, et ainsi de suite.",
      "ex": "Les multiples de 3 sont 3, 6, 9, 12, 15… car 3 × 1 = 3, 3 × 2 = 6, 3 × 3 = 9."
    },
    "calcul mental": {
      "def": "Le calcul mental, c’est calculer dans sa tête, sans poser l’opération ni écrire.",
      "ex": "Pour 25 + 30, on pense : 25 et 30, c’est 55."
    },
    "fraction": {
      "def": "Une fraction, c’est une ou plusieurs parts égales d’un tout. On l’écrit avec deux nombres séparés par un trait.",
      "ex": "Une galette coupée en 4 parts égales : chaque part est 1/4 de la galette."
    },
    "numerateur": {
      "def": "Le numérateur, c’est le nombre écrit au-dessus du trait. Il dit combien de parts on prend.",
      "ex": "Dans 3/4, le numérateur est 3 : on prend 3 parts."
    },
    "denominateur": {
      "def": "Le dénominateur, c’est le nombre écrit sous le trait. Il dit en combien de parts égales le tout a été coupé.",
      "ex": "Dans 3/4, le dénominateur est 4 : le tout a été coupé en 4 parts égales."
    },
    "demi": {
      "def": "Un demi, c’est une part sur deux parts égales. On l’écrit 1/2.",
      "ex": "Une orange coupée en deux : chaque morceau est un demi."
    },
    "tiers": {
      "def": "Un tiers, c’est une part sur trois parts égales. On l’écrit 1/3.",
      "ex": "Un pain partagé entre 3 enfants : chacun reçoit un tiers du pain."
    },
    "quart": {
      "def": "Un quart, c’est une part sur quatre parts égales. On l’écrit 1/4.",
      "ex": "Un terrain divisé en 4 parcelles égales : chaque parcelle est un quart du terrain."
    },
    "trois quarts": {
      "def": "Trois quarts, c’est trois parts sur quatre parts égales. On l’écrit 3/4.",
      "ex": "Si on mange 3 parts d’une galette coupée en 4, on a mangé les trois quarts."
    },
    "virgule": {
      "def": "La virgule sépare la partie entière de la partie décimale d’un nombre. À gauche, les unités entières ; à droite, les parts plus petites que 1.",
      "ex": "Dans 3,25 mètres : 3 mètres entiers, puis 25 centièmes de mètre."
    },
    "partie entiere": {
      "def": "La partie entière, c’est ce qui est écrit à gauche de la virgule : le nombre d’unités complètes.",
      "ex": "Dans 12,7 kg, la partie entière est 12 : il y a 12 kilogrammes entiers."
    },
    "dixieme": {
      "def": "Un dixième, c’est une part sur dix parts égales. On l’écrit 1/10 ou 0,1.",
      "ex": "Un mètre coupé en 10 morceaux égaux : chaque morceau est un dixième de mètre, soit 10 cm."
    },
    "dixiemes": {
      "def": "Les dixièmes sont le premier rang après la virgule.",
      "ex": "Dans 4,6 : le 6 est au rang des dixièmes, il vaut 6/10."
    },
    "centieme": {
      "def": "Un centième, c’est une part sur cent parts égales. On l’écrit 1/100 ou 0,01.",
      "ex": "Un franc partagé en 100 : chaque part est un centième."
    },
    "millieme": {
      "def": "Un millième, c’est une part sur mille parts égales. On l’écrit 1/1000 ou 0,001.",
      "ex": "Dans 2,345 : le 5 est au rang des millièmes."
    },
    "pourcentage": {
      "def": "Un pourcentage, c’est une part pour cent. 25 %, cela veut dire 25 parts sur 100.",
      "ex": "25 % de 200 élèves, c’est 50 élèves, car 25 pour chaque centaine."
    },
    "metre": {
      "def": "Le mètre est l’unité pour mesurer les longueurs. Son symbole est m.",
      "ex": "Une porte mesure environ 2 mètres de haut."
    },
    "centimetre": {
      "def": "Le centimètre est une petite unité de longueur. 1 mètre contient 100 centimètres. Son symbole est cm.",
      "ex": "Une règle d’écolier mesure 30 cm, soit moins d’un tiers de mètre."
    },
    "millimetre": {
      "def": "Le millimètre est une très petite unité de longueur. 1 centimètre contient 10 millimètres. Son symbole est mm.",
      "ex": "L’épaisseur d’une pièce de monnaie est d’environ 2 mm."
    },
    "kilometre": {
      "def": "Le kilomètre sert à mesurer les grandes distances. 1 kilomètre vaut 1 000 mètres. Son symbole est km.",
      "ex": "De Kaloum à Ratoma, il y a une dizaine de kilomètres."
    },
    "gramme": {
      "def": "Le gramme est l’unité pour mesurer les petites masses. Son symbole est g.",
      "ex": "Un biscuit pèse environ 20 g."
    },
    "kilogramme": {
      "def": "Le kilogramme sert à mesurer les masses. 1 kilogramme vaut 1 000 grammes. Son symbole est kg.",
      "ex": "Un sac de riz de 5 kg pèse 5 000 grammes."
    },
    "litre": {
      "def": "Le litre est l’unité pour mesurer les liquides. Son symbole est L.",
      "ex": "Une grande bouteille d’eau contient 1,5 litre."
    },
    "centilitre": {
      "def": "Le centilitre est une petite mesure de liquide. 1 litre contient 100 centilitres. Son symbole est cL.",
      "ex": "Un petit verre contient environ 20 cL."
    },
    "perimetre": {
      "def": "Le périmètre, c’est la longueur du tour d’une figure. On additionne tous les côtés.",
      "ex": "Un terrain rectangulaire de 8 m sur 5 m : périmètre = 8 + 5 + 8 + 5 = 26 mètres de clôture."
    },
    "aire": {
      "def": "L’aire, c’est la surface couverte par une figure, ce qui est à l’intérieur du tour.",
      "ex": "Une natte de 2 m sur 3 m a une aire de 2 × 3 = 6 mètres carrés."
    },
    "volume": {
      "def": "Le volume, c’est la place qu’occupe un solide. Pour un pavé, on multiplie longueur × largeur × hauteur.",
      "ex": "Une caisse de 2 m × 1 m × 1 m a un volume de 2 mètres cubes."
    },
    "duree": {
      "def": "La durée, c’est le temps qui s’écoule entre un début et une fin.",
      "ex": "L’école commence à 8 h et s’arrête à 12 h : la durée est de 4 heures."
    },
    "echelle": {
      "def": "L’échelle d’une carte dit combien de distance réelle représente une longueur mesurée sur le papier.",
      "ex": "À l’échelle 1/100 000, un centimètre sur la carte représente 1 kilomètre sur le terrain."
    },
    "vitesse": {
      "def": "La vitesse, c’est la distance parcourue pendant une durée. On la calcule en divisant la distance par le temps.",
      "ex": "Un taxi qui fait 120 km en 2 heures roule à 60 kilomètres par heure."
    },
    "moyenne": {
      "def": "La moyenne, c’est le résultat obtenu en partageant également un total entre toutes les parts.",
      "ex": "Notes de 12, 14 et 10 : total 36, divisé par 3 notes, la moyenne est 12."
    },
    "proportionnalite": {
      "def": "Il y a proportionnalité quand deux quantités augmentent ensemble, toujours dans le même rapport.",
      "ex": "Si 1 cahier coûte 3 000 GNF, alors 4 cahiers coûtent 12 000 GNF : on multiplie par le même nombre."
    },
    "prix unitaire": {
      "def": "Le prix unitaire, c’est le prix d’un seul objet. On l’obtient en divisant le prix total par le nombre d’objets.",
      "ex": "5 savons pour 10 000 GNF : le prix unitaire est 10 000 ÷ 5 = 2 000 GNF le savon."
    },
    "carre": {
      "def": "Le carré est une figure à 4 côtés de même longueur et 4 angles droits.",
      "ex": "Une fenêtre dont les 4 côtés mesurent 80 cm chacun est un carré."
    },
    "rectangle": {
      "def": "Le rectangle est une figure à 4 angles droits, dont les côtés opposés sont égaux deux à deux.",
      "ex": "Une porte de 2 m de haut et 80 cm de large est un rectangle."
    },
    "triangle": {
      "def": "Le triangle est une figure fermée à 3 côtés et 3 sommets.",
      "ex": "Le toit d’une case vu de face dessine un triangle."
    },
    "cercle": {
      "def": "Le cercle est la ligne fermée dont tous les points sont à la même distance du centre.",
      "ex": "Le bord d’une assiette dessine un cercle."
    },
    "diametre": {
      "def": "Le diamètre est le segment qui traverse le cercle en passant par le centre. Il vaut deux fois le rayon.",
      "ex": "Une assiette de 12 cm de rayon a un diamètre de 24 cm."
    },
    "angle droit": {
      "def": "Un angle droit est l’angle formé par deux lignes perpendiculaires. Il mesure 90 degrés, comme le coin d’une feuille.",
      "ex": "Le coin d’un cahier ou d’une table forme un angle droit."
    },
    "angle aigu": {
      "def": "Un angle aigu est plus petit qu’un angle droit : il mesure moins de 90 degrés.",
      "ex": "La pointe d’un morceau de pastèque forme un angle aigu."
    },
    "angle obtus": {
      "def": "Un angle obtus est plus grand qu’un angle droit : il mesure plus de 90 degrés.",
      "ex": "Un livre à moitié ouvert et bien écarté forme un angle obtus."
    },
    "symetrie": {
      "def": "Il y a symétrie quand une figure se replie exactement sur elle-même de part et d’autre d’une ligne.",
      "ex": "Un papillon est symétrique : ses deux ailes se correspondent."
    },
    "cube": {
      "def": "Le cube est un solide à 6 faces carrées toutes identiques.",
      "ex": "Un dé à jouer est un cube."
    },
    "pave droit": {
      "def": "Le pavé droit est un solide à 6 faces rectangulaires.",
      "ex": "Une boîte d’allumettes ou une brique est un pavé droit."
    },
    "patron": {
      "def": "Le patron d’un solide, c’est le dessin à plat qui, une fois plié, redonne ce solide.",
      "ex": "Le carton déplié d’une boîte est son patron."
    },
    "syllabe": {
      "def": "Une syllabe, c’est un morceau de mot que l’on prononce d’un seul coup de voix.",
      "ex": "Le mot « ba-na-ne » a trois syllabes : on frappe trois fois dans les mains."
    },
    "voyelle": {
      "def": "Les voyelles sont les lettres a, e, i, o, u, y. Elles se prononcent en laissant passer l’air librement.",
      "ex": "Dans « école », les voyelles sont e, o, e."
    },
    "consonne": {
      "def": "Les consonnes sont toutes les autres lettres. Elles ont besoin d’une voyelle pour former une syllabe.",
      "ex": "Dans « papa », p est une consonne, a est une voyelle."
    },
    "singulier": {
      "def": "Le singulier, c’est quand on parle d’un seul.",
      "ex": "« un cahier » est au singulier."
    },
    "pluriel": {
      "def": "Le pluriel, c’est quand on parle de plusieurs. On ajoute souvent un s.",
      "ex": "« des cahiers » est au pluriel."
    },
    "vivant": {
      "def": "Un être vivant naît, se nourrit, grandit, se reproduit et meurt.",
      "ex": "Une chèvre, un manguier et un enfant sont vivants."
    },
    "non vivant": {
      "def": "Un objet non vivant ne naît pas, ne grandit pas et ne se reproduit pas.",
      "ex": "Une pierre, une table et un seau ne sont pas vivants."
    },
    "etat solide": {
      "def": "À l’état solide, la matière garde sa forme toute seule.",
      "ex": "Un glaçon garde sa forme dans la main."
    },
    "etat liquide": {
      "def": "À l’état liquide, la matière coule et prend la forme du récipient.",
      "ex": "L’eau versée dans un verre prend la forme du verre."
    },
    "vapeur": {
      "def": "La vapeur, c’est l’eau à l’état de gaz. On ne la voit pas, mais elle monte dans l’air.",
      "ex": "Au-dessus d’une marmite qui bout, l’eau part en vapeur."
    },
    "fusion": {
      "def": "La fusion, c’est le passage du solide au liquide sous l’effet de la chaleur.",
      "ex": "Un glaçon posé au soleil fond : c’est la fusion."
    },
    "dissolution": {
      "def": "La dissolution, c’est quand une matière disparaît dans un liquide en se mélangeant complètement.",
      "ex": "Le sucre remué dans l’eau ne se voit plus : il s’est dissous."
    },
    "melange homogene": {
      "def": "Un mélange est homogène quand on ne distingue plus les éléments mélangés.",
      "ex": "L’eau sucrée est homogène : on ne voit plus le sucre."
    },
    "melange heterogene": {
      "def": "Un mélange est hétérogène quand on voit encore les différents éléments.",
      "ex": "L’eau et le sable forment un mélange hétérogène : on voit le sable."
    },
    "producteur": {
      "def": "Un producteur est un être vivant qui fabrique sa propre nourriture grâce au soleil : ce sont les plantes.",
      "ex": "Le manguier fabrique sa nourriture avec la lumière : c’est un producteur."
    },
    "consommateur": {
      "def": "Un consommateur est un être vivant qui doit manger d’autres êtres vivants pour se nourrir.",
      "ex": "La chèvre mange l’herbe : c’est un consommateur."
    },
    "predateur": {
      "def": "Un prédateur est un animal qui chasse et mange d’autres animaux.",
      "ex": "Le chat qui attrape la souris est un prédateur."
    },
    "levier": {
      "def": "Un levier est une barre rigide posée sur un point d’appui, qui permet de soulever une lourde charge avec moins de force.",
      "ex": "Avec une barre et une pierre placée dessous, un homme soulève un tronc trop lourd pour ses bras."
    },
    "force": {
      "def": "Une force, c’est une action qui pousse, tire, soulève ou arrête un objet.",
      "ex": "Quand tu pousses une brouette, tu exerces une force sur elle."
    },
    "reflexe": {
      "def": "Un réflexe est une réaction du corps très rapide, faite sans y penser, pour se protéger.",
      "ex": "Quand la main touche une casserole chaude, elle se retire aussitôt : c’est un réflexe."
    },
    "ruissellement": {
      "def": "Le ruissellement, c’est l’eau de pluie qui coule à la surface du sol sans y pénétrer.",
      "ex": "Après une forte pluie à Conakry, l’eau coule dans les rues : c’est le ruissellement."
    },
    "precipitations": {
      "def": "Les précipitations, c’est toute l’eau qui tombe du ciel : pluie, rosée, grêle.",
      "ex": "En saison des pluies, les précipitations sont abondantes en Guinée."
    },
    "majuscule": {
      "def": "La majuscule est la grande lettre que l’on écrit au début d’une phrase et au début d’un nom propre.",
      "ex": "« Mariama habite à Conakry. » : M de Mariama et C de Conakry sont des majuscules."
    },
    "lettre a": {
      "def": "La lettre a est une voyelle. On l’écrit d’un rond et d’un trait debout.",
      "ex": "On l’entend dans « papa », « banane », « natte »."
    },
    "lettre i": {
      "def": "La lettre i est une voyelle. Elle s’écrit d’un trait debout surmonté d’un point.",
      "ex": "On l’entend dans « ami », « riz », « midi »."
    },
    "lettre l": {
      "def": "La lettre l est une consonne. Elle s’écrit d’un seul grand trait debout.",
      "ex": "On l’entend dans « lit », « école », « ballon »."
    },
    "lettre m": {
      "def": "La lettre m est une consonne. Elle s’écrit avec trois jambes.",
      "ex": "On l’entend dans « maman », « mangue », « mardi »."
    },
    "son ou": {
      "def": "Le son [ou] s’écrit avec les deux lettres o et u ensemble.",
      "ex": "On l’entend dans « poule », « cour », « douze »."
    },
    "son an": {
      "def": "Le son [an] s’écrit an ou en.",
      "ex": "On l’entend dans « maman », « enfant », « banc »."
    },
    "son on": {
      "def": "Le son [on] s’écrit on ou om.",
      "ex": "On l’entend dans « pont », « maison », « nombre »."
    },
    "son in": {
      "def": "Le son [in] s’écrit in, ain ou ein.",
      "ex": "On l’entend dans « matin », « pain », « ceinture »."
    },
    "m devant m": {
      "def": "Règle d’orthographe : devant les lettres m, b et p, on écrit m à la place de n.",
      "ex": "On écrit « chambre » et non « chanbre », « tomber » et non « tonber », « emmener » et non « enmener »."
    },
    "m devant b": {
      "def": "Règle d’orthographe : devant les lettres m, b et p, on écrit m à la place de n.",
      "ex": "On écrit « chambre » et non « chanbre », « tomber » et non « tonber », « emmener » et non « enmener »."
    },
    "m devant p": {
      "def": "Règle d’orthographe : devant les lettres m, b et p, on écrit m à la place de n.",
      "ex": "On écrit « chambre » et non « chanbre », « tomber » et non « tonber », « emmener » et non « enmener »."
    },
    "m devant m b p": {
      "def": "Règle d’orthographe : devant les lettres m, b et p, on écrit m à la place de n.",
      "ex": "On écrit « chambre » et non « chanbre », « tomber » et non « tonber », « emmener » et non « enmener »."
    },
    "trait debout": {
      "def": "Le trait debout est un trait vertical, de haut en bas. C’est le premier geste de l’écriture.",
      "ex": "On le trace pour écrire i, l, t."
    },
    "trait couche": {
      "def": "Le trait couché est un trait horizontal, de gauche à droite.",
      "ex": "On le trace pour barrer le t ou pour écrire le signe moins."
    },
    "nom": {
      "def": "Le nom désigne une personne, un animal, une chose, un lieu ou une idée.",
      "ex": "« élève », « chèvre », « cahier », « Kankan » sont des noms."
    },
    "nom commun": {
      "def": "Le nom commun désigne une chose ou un être en général, sans dire lequel. Il s’écrit sans majuscule et il est accompagné d’un déterminant.",
      "ex": "« une ville », « un élève », « la mangue » sont des noms communs."
    },
    "nom propre": {
      "def": "Le nom propre désigne une personne, un lieu ou un pays précis. Il commence toujours par une majuscule.",
      "ex": "« Sékou », « Conakry », « Guinée » sont des noms propres."
    },
    "determinant": {
      "def": "Le déterminant est le petit mot placé devant le nom. Il indique le genre et le nombre du nom.",
      "ex": "Dans « la cour », « des cahiers », « mon livre », les déterminants sont « la », « des », « mon »."
    },
    "pronom": {
      "def": "Le pronom est un mot qui remplace un nom, pour éviter de le répéter.",
      "ex": "« Fatou balaie. Elle chante. » : « elle » remplace « Fatou »."
    },
    "adjectif": {
      "def": "L’adjectif dit comment est la personne ou la chose. Il s’accorde en genre et en nombre avec le nom.",
      "ex": "Dans « une grande cour propre », « grande » et « propre » sont des adjectifs."
    },
    "genre": {
      "def": "Le genre d’un nom est masculin ou féminin. C’est le déterminant qui aide à le reconnaître.",
      "ex": "« un banc » est masculin, « une règle » est féminine."
    },
    "masculin": {
      "def": "Un nom est masculin quand on peut mettre « un » ou « le » devant.",
      "ex": "« un cahier », « le tableau »."
    },
    "feminin": {
      "def": "Un nom est féminin quand on peut mettre « une » ou « la » devant. Souvent, on ajoute un e au masculin.",
      "ex": "« une élève », « la craie ». Un ami devient une amie."
    },
    "nombre": {
      "def": "Le nombre d’un nom est le singulier (un seul) ou le pluriel (plusieurs).",
      "ex": "« un livre » est au singulier, « des livres » est au pluriel."
    },
    "marque s": {
      "def": "La marque du pluriel est le plus souvent un s ajouté à la fin du nom et de l’adjectif.",
      "ex": "« une mangue mûre » devient « des mangues mûres »."
    },
    "accord": {
      "def": "Accorder, c’est écrire un mot en fonction d’un autre : l’adjectif prend le genre et le nombre du nom, le verbe prend la personne du sujet.",
      "ex": "« Les élèves sont attentifs » : élèves est pluriel, donc « sont » et « attentifs » prennent la marque du pluriel."
    },
    "synonyme": {
      "def": "Un synonyme est un mot qui a presque le même sens qu’un autre.",
      "ex": "« content » et « joyeux » sont synonymes."
    },
    "antonyme": {
      "def": "Un antonyme est un mot qui a le sens contraire d’un autre.",
      "ex": "« grand » et « petit », « propre » et « sale » sont des antonymes."
    },
    "famille de mots": {
      "def": "Une famille de mots réunit tous les mots formés à partir d’une même racine.",
      "ex": "terre, terrain, atterrir, souterrain forment une famille de mots."
    },
    "ordre alphabetique": {
      "def": "L’ordre alphabétique, c’est le rangement des mots selon la suite des lettres de a à z.",
      "ex": "arbre, banc, craie, école sont rangés dans l’ordre alphabétique."
    },
    "dictionnaire": {
      "def": "Le dictionnaire est un livre qui range les mots dans l’ordre alphabétique et donne leur sens.",
      "ex": "Pour connaître le sens de « labourer », on cherche à la lettre l."
    },
    "terminaison": {
      "def": "La terminaison est la fin du verbe. Elle change selon la personne et le temps.",
      "ex": "Dans « nous chantons », la terminaison est -ons."
    },
    "phrase": {
      "def": "Une phrase est un groupe de mots qui a un sens complet. Elle commence par une majuscule et se termine par un point.",
      "ex": "« L’élève ouvre son cahier. » est une phrase."
    },
    "point": {
      "def": "Le point marque la fin d’une phrase. Après le point, on écrit une majuscule.",
      "ex": "« Le maître entre. Les élèves se lèvent. »"
    },
    "point d interrogation": {
      "def": "Le point d’interrogation se met à la fin d’une phrase qui pose une question.",
      "ex": "« Comment t’appelles-tu ? »"
    },
    "sujet": {
      "def": "Le sujet, c’est qui fait l’action. On le trouve en demandant « qui est-ce qui ? » devant le verbe.",
      "ex": "« Sékou balaie la cour. » Qui est-ce qui balaie ? Sékou : c’est le sujet."
    },
    "verbe": {
      "def": "Le verbe dit ce que l’on fait ou ce que l’on est. Il change avec le temps et avec le sujet.",
      "ex": "Dans « Fatou mange une mangue », le verbe est « mange »."
    },
    "complement": {
      "def": "Le complément complète le verbe : il apporte un renseignement de plus.",
      "ex": "Dans « Il écrit une lettre à son oncle », « une lettre » et « à son oncle » sont des compléments."
    },
    "complement d objet": {
      "def": "Le complément d’objet dit sur quoi ou sur qui porte l’action du verbe.",
      "ex": "Dans « Le maître corrige les cahiers », le complément d’objet est « les cahiers »."
    },
    "cod": {
      "def": "Le complément d’objet direct suit le verbe sans préposition. On le trouve en demandant « qui ? » ou « quoi ? » après le verbe.",
      "ex": "« Mariama lit un livre. » Elle lit quoi ? un livre : c’est le COD."
    },
    "coi": {
      "def": "Le complément d’objet indirect est relié au verbe par une préposition, le plus souvent à ou de. On le trouve en demandant « à qui ? » ou « de quoi ? ».",
      "ex": "« Il parle à son frère. » Il parle à qui ? à son frère : c’est le COI."
    },
    "complement circonstanciel": {
      "def": "Le complément circonstanciel donne les circonstances : où, quand, comment. On peut le déplacer ou le supprimer.",
      "ex": "« Le matin, les élèves balaient la cour avec soin. » « Le matin » dit quand, « avec soin » dit comment."
    },
    "complement de lieu": {
      "def": "Le complément circonstanciel de lieu dit où se passe l’action.",
      "ex": "« Les enfants jouent dans la cour. » Où ? dans la cour."
    },
    "groupe nominal": {
      "def": "Le groupe nominal est l’ensemble formé par le nom et les mots qui l’accompagnent : déterminant et adjectifs.",
      "ex": "Dans « une belle case ronde », tout le groupe nominal est « une belle case ronde »."
    },
    "groupe verbal": {
      "def": "Le groupe verbal est l’ensemble formé par le verbe et ses compléments.",
      "ex": "Dans « L’élève écrit sa leçon », le groupe verbal est « écrit sa leçon »."
    },
    "proposition": {
      "def": "Une proposition est une partie de phrase qui contient un verbe conjugué.",
      "ex": "« Il pleut et les enfants rentrent. » contient deux propositions."
    },
    "mot de liaison": {
      "def": "Un mot de liaison relie deux idées et montre comment elles s’enchaînent.",
      "ex": "d’abord, ensuite, puis, enfin, mais, car, donc."
    },
    "present": {
      "def": "Le présent est le temps de ce qui se passe maintenant, ou de ce qui se répète chaque jour.",
      "ex": "« Je travaille en ce moment. » « Tous les matins, je balaie la cour. »"
    },
    "futur": {
      "def": "Le futur est le temps de ce qui n’est pas encore arrivé.",
      "ex": "« Demain, je porterai mon nouveau cahier. »"
    },
    "imparfait": {
      "def": "L’imparfait raconte ce qui durait ou se répétait dans le passé.",
      "ex": "« Autrefois, les enfants marchaient une heure pour aller à l’école. »"
    },
    "passe compose": {
      "def": "Le passé composé raconte une action terminée. Il se forme avec l’auxiliaire avoir ou être suivi du participe passé.",
      "ex": "« J’ai fini mon exercice. » « Elle est partie au marché. »"
    },
    "passe simple": {
      "def": "Le passé simple est le temps du récit écrit. Il raconte une action brève et terminée du passé.",
      "ex": "« Le lion bondit et saisit sa proie. »"
    },
    "auxiliaire": {
      "def": "L’auxiliaire est le verbe avoir ou être qui aide à former un temps composé. Il se conjugue, et le verbe principal se met au participe passé.",
      "ex": "Dans « nous avons mangé », l’auxiliaire est « avons »."
    },
    "participe passe": {
      "def": "Le participe passé est la forme du verbe employée avec avoir ou être dans les temps composés.",
      "ex": "chanter donne chanté, finir donne fini, prendre donne pris."
    },
    "premier groupe": {
      "def": "Les verbes du premier groupe se terminent par -er à l’infinitif. C’est le groupe le plus nombreux.",
      "ex": "chanter, balayer, travailler."
    },
    "deuxieme groupe": {
      "def": "Les verbes du deuxième groupe se terminent par -ir et font -issons avec nous.",
      "ex": "finir : nous finissons. grandir : nous grandissons."
    },
    "troisieme groupe": {
      "def": "Le troisième groupe réunit tous les autres verbes, dont être, avoir, aller, faire, prendre.",
      "ex": "aller, venir, prendre, écrire."
    },
    "etre": {
      "def": "Le verbe être sert à dire ce que l’on est ou comment on est. Il sert aussi d’auxiliaire.",
      "ex": "« Je suis élève. » « Elle est partie. »"
    },
    "avoir": {
      "def": "Le verbe avoir sert à dire ce que l’on possède. Il sert aussi d’auxiliaire.",
      "ex": "« J’ai un cahier. » « Nous avons chanté. »"
    },
    "action": {
      "def": "Un verbe d’action dit ce que fait le sujet.",
      "ex": "courir, écrire, balayer, porter."
    },
    "etat": {
      "def": "Un verbe d’état ne dit pas une action : il dit comment est le sujet.",
      "ex": "être, paraître, devenir, rester. « Le ciel est gris. »"
    },
    "a ou a": {
      "def": "On écrit « a » sans accent quand c’est le verbe avoir : on peut le remplacer par « avait ». On écrit « à » avec accent dans les autres cas.",
      "ex": "« Il a faim » (il avait faim) ; « Il va à l’école » (on ne peut pas dire il va avait l’école)."
    },
    "et ou est": {
      "def": "On écrit « et » quand on peut le remplacer par « et puis ». On écrit « est » quand on peut le remplacer par « était ».",
      "ex": "« Le père et la mère » (et puis) ; « Le riz est chaud » (était chaud)."
    },
    "on ou ont": {
      "def": "On écrit « on » quand on peut le remplacer par « il ». On écrit « ont » quand on peut le remplacer par « avaient ».",
      "ex": "« On travaille » (il travaille) ; « Ils ont travaillé » (ils avaient travaillé)."
    },
    "son ou sont": {
      "def": "On écrit « son » quand on peut le remplacer par « mon ». On écrit « sont » quand on peut le remplacer par « étaient ».",
      "ex": "« Son cahier » (mon cahier) ; « Ils sont là » (ils étaient là)."
    },
    "ce ou se": {
      "def": "« Ce » accompagne un nom et se remplace par « ce…-là ». « Se » accompagne un verbe et se remplace par « me » ou « te ».",
      "ex": "« Ce livre » (ce livre-là) ; « Il se lave » (je me lave)."
    },
    "texte": {
      "def": "Un texte est un ensemble de phrases qui se suivent et parlent du même sujet.",
      "ex": "Un article de journal, une lettre, un conte sont des textes."
    },
    "titre": {
      "def": "Le titre est le nom du texte. Il annonce en quelques mots de quoi il parle.",
      "ex": "Le titre « La récolte du riz » annonce un texte sur la récolte."
    },
    "theme": {
      "def": "Le thème, c’est le sujet dont parle le texte : ce dont on parle du début à la fin.",
      "ex": "Un texte sur les moustiques, la moustiquaire et le paludisme a pour thème la protection contre le paludisme."
    },
    "idee principale": {
      "def": "L’idée principale, c’est ce que le texte veut faire comprendre avant tout. Si on ne devait retenir qu’une phrase, ce serait celle-là.",
      "ex": "Dans un texte sur l’eau, l’idée principale peut être : il faut faire bouillir l’eau avant de la boire."
    },
    "idees secondaires": {
      "def": "Les idées secondaires sont les explications et les exemples qui viennent appuyer l’idée principale.",
      "ex": "Dire que l’eau du puits contient des microbes est une idée secondaire qui appuie l’idée principale."
    },
    "resume": {
      "def": "Résumer, c’est redire un texte en beaucoup moins de mots, en gardant seulement l’essentiel.",
      "ex": "Un conte de deux pages peut être résumé en trois phrases."
    },
    "personnage": {
      "def": "Un personnage est celui dont parle le récit : une personne, un animal ou un être imaginaire qui agit dans l’histoire.",
      "ex": "Dans le conte, le lièvre et l’hyène sont les personnages."
    },
    "recit": {
      "def": "Un récit est un texte qui raconte une histoire, avec un début, des événements et une fin.",
      "ex": "Un conte, un fait divers, un souvenir de vacances sont des récits."
    },
    "situation initiale": {
      "def": "La situation initiale, c’est le début du récit : on présente les personnages, le lieu et le moment, avant que tout ne change.",
      "ex": "« Il était une fois, dans un village du Fouta, une jeune fille nommée Kadiatou. »"
    },
    "probleme": {
      "def": "Le problème, c’est l’événement qui vient déranger la situation de départ et lance l’histoire.",
      "ex": "La sécheresse arrive et le puits du village se vide."
    },
    "solution": {
      "def": "La solution, c’est ce que font les personnages pour résoudre le problème.",
      "ex": "Les villageois creusent un nouveau puits plus profond."
    },
    "denouement": {
      "def": "Le dénouement, c’est la fin du récit : on apprend comment tout se termine.",
      "ex": "L’eau revient et le village organise une fête."
    },
    "chronologie": {
      "def": "La chronologie, c’est l’ordre dans lequel les événements se produisent, du premier au dernier.",
      "ex": "d’abord il se lève, ensuite il se lave, puis il part à l’école."
    },
    "indices": {
      "def": "Les indices sont les petits détails du texte qui aident à comprendre ce qui n’est pas écrit clairement.",
      "ex": "« Il ouvrit son parapluie » : l’indice montre qu’il pleut, même si ce n’est pas écrit."
    },
    "inference": {
      "def": "Faire une inférence, c’est deviner une information à partir des indices du texte, sans qu’elle soit écrite.",
      "ex": "« Sékou souffla ses huit bougies. » On en déduit qu’il a huit ans."
    },
    "question de comprehension": {
      "def": "Une question de compréhension demande de retrouver ou de déduire une information du texte.",
      "ex": "« Pourquoi le village manque-t-il d’eau ? »"
    },
    "reponse justifiee": {
      "def": "Une réponse justifiée donne la réponse et dit où on l’a trouvée dans le texte.",
      "ex": "« Le village manque d’eau parce que le puits s’est vidé : c’est écrit à la deuxième ligne. »"
    },
    "plan": {
      "def": "Le plan, c’est l’ordre des idées prévu avant d’écrire. Il évite d’écrire dans le désordre.",
      "ex": "Introduction, ce que j’ai vu, ce que j’ai ressenti, conclusion."
    },
    "introduire": {
      "def": "Introduire, c’est commencer le texte en annonçant de quoi on va parler.",
      "ex": "« Samedi dernier, je suis allé au marché de Madina avec ma mère. »"
    },
    "developper": {
      "def": "Développer, c’est expliquer une idée en donnant des détails et des exemples.",
      "ex": "Après avoir dit que le marché est animé, on décrit les cris, les odeurs et la foule."
    },
    "conclure": {
      "def": "Conclure, c’est terminer le texte en donnant l’essentiel ou son avis.",
      "ex": "« Ce jour-là, j’ai compris pourquoi ma mère part si tôt. »"
    },
    "argument": {
      "def": "Un argument est une raison donnée pour défendre une opinion.",
      "ex": "« Il faut balayer la cour, car les ordures attirent les moustiques. »"
    },
    "opinion": {
      "def": "Une opinion est ce que l’on pense. Elle peut être discutée, contrairement à un fait.",
      "ex": "« Le football est le plus beau des sports » est une opinion."
    },
    "exemple": {
      "def": "Un exemple est un cas précis qui rend une idée plus claire.",
      "ex": "Pour montrer qu’il faut se laver les mains, on cite le repas du soir."
    },
    "hypothese": {
      "def": "Une hypothèse est une supposition que l’on fait avant de vérifier.",
      "ex": "« Je pense que la plante arrosée grandira plus vite. » On vérifiera dans une semaine."
    },
    "prise de notes": {
      "def": "Prendre des notes, c’est écrire seulement les mots importants, sans faire de phrases complètes.",
      "ex": "Au lieu d’écrire toute la phrase, on note : puits vide → sécheresse → nouveau puits."
    },
    "synthese": {
      "def": "Faire une synthèse, c’est rassembler en un seul texte court ce que l’on a retenu de plusieurs sources.",
      "ex": "Après avoir lu deux textes sur le paludisme, on écrit un paragraphe qui reprend l’essentiel des deux."
    },
    "reformuler": {
      "def": "Reformuler, c’est redire la même chose avec ses propres mots.",
      "ex": "« Il fait très chaud » peut se reformuler « la chaleur est forte »."
    },
    "formule d appel": {
      "def": "La formule d’appel est la ligne qui ouvre une lettre et nomme la personne à qui l’on écrit.",
      "ex": "« Monsieur le Directeur, » « Cher oncle, »"
    },
    "signature": {
      "def": "La signature est le nom que l’on écrit à la fin d’une lettre pour dire qui l’envoie.",
      "ex": "« Ton neveu, Mamadou Diallo »"
    },
    "date": {
      "def": "La date indique le jour où la lettre est écrite. On l’écrit en haut à droite.",
      "ex": "« Conakry, le 12 mars 2026 »"
    },
    "demande polie": {
      "def": "Une demande polie utilise des formules de respect au lieu d’ordonner.",
      "ex": "Au lieu de « Donne-moi un cahier », on dit « Pourriez-vous me donner un cahier, s’il vous plaît ? »"
    },
    "politesse": {
      "def": "La politesse, c’est l’ensemble des mots et des gestes qui montrent le respect de l’autre.",
      "ex": "dire bonjour, merci, pardon, s’il vous plaît, laisser passer un aîné."
    },
    "parler clairement": {
      "def": "Parler clairement, c’est articuler chaque mot, assez fort, sans se presser, pour être compris de tous.",
      "ex": "En récitation, on regarde la classe et on prononce la fin des mots."
    },
    "tete": {
      "def": "La tête est la partie haute du corps. Elle contient le cerveau et porte les yeux, le nez, la bouche et les oreilles.",
      "ex": "C’est avec la tête que l’on voit, entend, sent, goûte et réfléchit."
    },
    "bras": {
      "def": "Le bras est le membre supérieur, qui relie l’épaule à la main. Il permet de porter, lancer et tirer.",
      "ex": "On soulève un seau d’eau avec la force des bras."
    },
    "jambe": {
      "def": "La jambe est le membre inférieur, qui relie la hanche au pied. Elle porte le corps et permet de marcher.",
      "ex": "C’est avec les jambes que l’on court, saute et pédale."
    },
    "main": {
      "def": "La main est au bout du bras. Ses cinq doigts permettent de toucher, tenir, écrire et travailler.",
      "ex": "La main tient le crayon et tourne la page du cahier."
    },
    "pied": {
      "def": "Le pied est au bout de la jambe. Il pose le corps sur le sol et donne l’équilibre.",
      "ex": "Sans les pieds bien à plat, on ne peut pas rester debout longtemps."
    },
    "oeil": {
      "def": "L’œil est l’organe de la vue. Il reçoit la lumière et envoie l’image au cerveau.",
      "ex": "On ferme les yeux et l’on ne voit plus rien : c’est l’œil qui voit, pas la tête."
    },
    "oreille": {
      "def": "L’oreille est l’organe de l’ouïe. Elle capte les sons de l’air et les transmet au cerveau.",
      "ex": "On entend la cloche de l’école grâce aux oreilles."
    },
    "nez": {
      "def": "Le nez est l’organe de l’odorat. Il sent les odeurs et laisse entrer l’air dans le corps.",
      "ex": "Le nez reconnaît l’odeur du riz qui cuit."
    },
    "bouche": {
      "def": "La bouche sert à manger, à goûter et à parler. Elle contient la langue et les dents.",
      "ex": "Les dents coupent la mangue, la langue en sent le goût sucré."
    },
    "langue": {
      "def": "La langue est l’organe du goût. Elle sent le sucré, le salé, l’acide et l’amer, et elle aide à parler.",
      "ex": "La langue reconnaît que le citron est acide."
    },
    "vue": {
      "def": "La vue est le sens qui permet de voir les formes, les couleurs et les distances. Son organe est l’œil.",
      "ex": "La vue permet de lire ce qui est écrit au tableau."
    },
    "ouie": {
      "def": "L’ouïe est le sens qui permet d’entendre les sons. Son organe est l’oreille.",
      "ex": "L’ouïe permet d’entendre le maître même quand on ne le regarde pas."
    },
    "odorat": {
      "def": "L’odorat est le sens qui permet de sentir les odeurs. Son organe est le nez.",
      "ex": "L’odorat prévient qu’un aliment est gâté avant même d’y goûter."
    },
    "toucher": {
      "def": "Le toucher est le sens qui permet de sentir si une chose est chaude, froide, dure, douce ou piquante. Son organe est la peau.",
      "ex": "La peau de la main sent tout de suite que la marmite est brûlante."
    },
    "coeur": {
      "def": "Le cœur est un muscle qui bat sans arrêt. Il pousse le sang dans tout le corps.",
      "ex": "Après avoir couru, le cœur bat plus vite pour envoyer plus de sang aux muscles."
    },
    "sang": {
      "def": "Le sang est le liquide rouge qui circule dans le corps. Il transporte l’oxygène et les aliments à tous les organes.",
      "ex": "Quand on se coupe le doigt, on voit le sang qui y circulait."
    },
    "poumons": {
      "def": "Les poumons sont les deux organes de la respiration. Ils prennent l’oxygène de l’air et rejettent le dioxyde de carbone.",
      "ex": "En inspirant fort, on sent la poitrine se gonfler : les poumons se remplissent d’air."
    },
    "inspirer": {
      "def": "Inspirer, c’est faire entrer l’air dans les poumons. La poitrine se gonfle.",
      "ex": "Avant de plonger, on inspire profondément."
    },
    "expirer": {
      "def": "Expirer, c’est faire sortir l’air des poumons. La poitrine se dégonfle.",
      "ex": "On expire sur une bougie pour l’éteindre."
    },
    "estomac": {
      "def": "L’estomac est la poche où arrivent les aliments après avoir été avalés. Il les broie et les mélange.",
      "ex": "Après le repas, l’estomac travaille : c’est pour cela qu’il ne faut pas courir tout de suite."
    },
    "oesophage": {
      "def": "L’œsophage est le tuyau qui conduit les aliments de la bouche à l’estomac.",
      "ex": "Quand on avale une gorgée d’eau, elle descend par l’œsophage."
    },
    "circulation": {
      "def": "La circulation, c’est le trajet du sang dans le corps : il part du cœur, va aux organes, puis revient au cœur.",
      "ex": "On sent la circulation en posant deux doigts sur le poignet : c’est le pouls."
    },
    "croissance": {
      "def": "La croissance, c’est le fait de grandir : le corps augmente de taille et de poids jusqu’à l’âge adulte.",
      "ex": "Un enfant de six ans grandit d’environ six centimètres par an."
    },
    "adulte": {
      "def": "Un adulte est un être vivant qui a fini de grandir et peut se reproduire.",
      "ex": "Le poussin devient poule : la poule est l’adulte."
    },
    "effort": {
      "def": "Un effort, c’est un travail du corps qui demande de la force et fatigue les muscles.",
      "ex": "Porter un seau d’eau plein depuis le puits demande un effort."
    },
    "biodiversite": {
      "def": "La biodiversité, c’est la variété de tous les êtres vivants d’un lieu : plantes, animaux, insectes.",
      "ex": "Dans la forêt de Ziama, il y a des centaines d’espèces différentes : c’est une grande biodiversité."
    },
    "animal domestique": {
      "def": "Un animal domestique vit près des hommes, qui le nourrissent et s’en occupent.",
      "ex": "La chèvre, la poule, le chien et le mouton sont des animaux domestiques."
    },
    "animal sauvage": {
      "def": "Un animal sauvage vit librement dans la nature et cherche sa nourriture tout seul.",
      "ex": "Le lion, le singe et l’antilope sont des animaux sauvages."
    },
    "herbivore": {
      "def": "Un herbivore est un animal qui ne mange que des végétaux.",
      "ex": "La chèvre et la vache broutent l’herbe : ce sont des herbivores."
    },
    "carnivore": {
      "def": "Un carnivore est un animal qui se nourrit de la chair d’autres animaux.",
      "ex": "Le chat et le lion sont des carnivores."
    },
    "omnivore": {
      "def": "Un omnivore mange à la fois des végétaux et de la viande.",
      "ex": "L’homme et la poule sont omnivores : ils mangent du riz et aussi de la viande."
    },
    "mammiferes": {
      "def": "Les mammifères sont les animaux dont la femelle allaite ses petits avec son lait. Ils ont des poils.",
      "ex": "La chèvre, la vache, le chien et l’homme sont des mammifères."
    },
    "oiseaux": {
      "def": "Les oiseaux sont les animaux couverts de plumes, qui ont un bec et deux ailes, et qui pondent des œufs.",
      "ex": "La poule, le pigeon et le calao sont des oiseaux."
    },
    "reptiles": {
      "def": "Les reptiles sont les animaux au corps couvert d’écailles, qui rampent ou marchent sur des pattes courtes.",
      "ex": "Le lézard, le serpent et le crocodile sont des reptiles."
    },
    "poisson": {
      "def": "Le poisson est un animal qui vit dans l’eau, respire par des branchies et nage grâce à ses nageoires.",
      "ex": "Le tilapia et le capitaine sont des poissons."
    },
    "oeuf": {
      "def": "L’œuf est ce que pond la femelle de certains animaux. Le petit s’y forme avant de naître.",
      "ex": "La poule pond un œuf ; au bout de vingt et un jours, le poussin en sort."
    },
    "nager": {
      "def": "Nager, c’est se déplacer dans l’eau en poussant avec le corps et les membres.",
      "ex": "Le poisson nage avec sa queue et ses nageoires."
    },
    "voler": {
      "def": "Voler, c’est se déplacer dans l’air en battant des ailes.",
      "ex": "L’oiseau vole ; la chèvre, elle, ne peut pas."
    },
    "ramper": {
      "def": "Ramper, c’est se déplacer en frottant le ventre sur le sol, sans se dresser.",
      "ex": "Le serpent rampe."
    },
    "racine": {
      "def": "La racine est la partie de la plante enfoncée dans le sol. Elle tient la plante et puise l’eau.",
      "ex": "En arrachant un plant de manioc, on voit ses racines pleines de terre."
    },
    "tige": {
      "def": "La tige est la partie qui monte de la racine et porte les feuilles et les fleurs.",
      "ex": "La tige du maïs est droite et dure."
    },
    "feuille": {
      "def": "La feuille est la partie plate et verte de la plante. C’est là que la plante fabrique sa nourriture avec la lumière.",
      "ex": "Les feuilles du manguier sont longues et vertes."
    },
    "fleur": {
      "def": "La fleur est la partie colorée de la plante. C’est elle qui, après la pollinisation, donne le fruit.",
      "ex": "La fleur du manguier devient une petite mangue."
    },
    "fruit": {
      "def": "Le fruit est ce que donne la fleur après la pollinisation. Il contient les graines.",
      "ex": "La mangue est un fruit : elle contient un noyau qui est sa graine."
    },
    "graine": {
      "def": "La graine contient une jeune plante endormie et sa réserve de nourriture. Semée, elle donne une nouvelle plante.",
      "ex": "Le grain de riz est une graine : semé, il donne un plant de riz."
    },
    "semence": {
      "def": "La semence est la graine que le cultivateur garde pour semer la saison suivante.",
      "ex": "On garde les plus beaux grains de maïs comme semence."
    },
    "germination": {
      "def": "La germination, c’est le moment où la graine s’ouvre et où la jeune plante commence à sortir.",
      "ex": "Un haricot posé sur du coton humide germe en trois jours : la racine sort d’abord."
    },
    "pollinisation": {
      "def": "La pollinisation, c’est le transport du pollen d’une fleur à une autre. Sans elle, il n’y aurait pas de fruits.",
      "ex": "L’abeille se pose sur une fleur, le pollen colle à son corps et part sur la fleur suivante."
    },
    "arrosage": {
      "def": "L’arroser, c’est apporter à la plante l’eau dont elle a besoin quand la pluie ne suffit pas.",
      "ex": "En saison sèche, on arrose le jardin scolaire tous les soirs."
    },
    "foret": {
      "def": "La forêt est un grand espace couvert d’arbres, où vivent de nombreux animaux.",
      "ex": "La forêt de Guinée forestière abrite des singes, des oiseaux et des milliers de plantes."
    },
    "cultures": {
      "def": "Les cultures sont les plantes que l’homme sème et entretient pour se nourrir ou pour vendre.",
      "ex": "Le riz, le fonio, le manioc et l’arachide sont les grandes cultures de Guinée."
    },
    "aliments energetiques": {
      "def": "Les aliments énergétiques donnent de la force pour bouger et travailler. Ce sont surtout les féculents et les matières grasses.",
      "ex": "Le riz, le fonio, l’igname, le manioc et l’huile de palme sont énergétiques."
    },
    "energetiques": {
      "def": "Les aliments énergétiques donnent de la force pour bouger et travailler. Ce sont surtout les féculents et les matières grasses.",
      "ex": "Le riz, le fonio, l’igname, le manioc et l’huile de palme sont énergétiques."
    },
    "aliments constructeurs": {
      "def": "Les aliments constructeurs servent à fabriquer le corps : muscles, os, sang. Ils sont riches en protéines.",
      "ex": "La viande, le poisson, l’œuf, le lait et le haricot sont constructeurs."
    },
    "constructeurs": {
      "def": "Les aliments constructeurs servent à fabriquer le corps : muscles, os, sang. Ils sont riches en protéines.",
      "ex": "La viande, le poisson, l’œuf, le lait et le haricot sont constructeurs."
    },
    "aliments protecteurs": {
      "def": "Les aliments protecteurs défendent le corps contre les maladies. Ce sont les fruits et les légumes, riches en vitamines.",
      "ex": "La mangue, l’orange, la papaye et les feuilles de patate sont protectrices."
    },
    "protecteurs": {
      "def": "Les aliments protecteurs défendent le corps contre les maladies. Ce sont les fruits et les légumes, riches en vitamines.",
      "ex": "La mangue, l’orange, la papaye et les feuilles de patate sont protectrices."
    },
    "aliment energetique": {
      "def": "Les aliments énergétiques donnent de la force pour bouger et travailler. Ce sont surtout les féculents et les matières grasses.",
      "ex": "Le riz, le fonio, l’igname, le manioc et l’huile de palme sont énergétiques."
    },
    "aliment constructeur": {
      "def": "Les aliments constructeurs servent à fabriquer le corps : muscles, os, sang. Ils sont riches en protéines.",
      "ex": "La viande, le poisson, l’œuf, le lait et le haricot sont constructeurs."
    },
    "aliment protecteur": {
      "def": "Les aliments protecteurs défendent le corps contre les maladies. Ce sont les fruits et les légumes, riches en vitamines.",
      "ex": "La mangue, l’orange, la papaye et les feuilles de patate sont protectrices."
    },
    "repas varie": {
      "def": "Un repas varié contient les trois sortes d’aliments : énergétiques, constructeurs et protecteurs.",
      "ex": "Riz, poisson et sauce feuille : voilà un repas complet."
    },
    "nutriments": {
      "def": "Les nutriments sont les éléments utiles tirés des aliments pendant la digestion. Ils passent dans le sang et nourrissent le corps.",
      "ex": "Le riz donne du sucre, le poisson donne des protéines : ce sont des nutriments."
    },
    "alimentation": {
      "def": "L’alimentation, c’est l’ensemble de ce que l’on mange et boit pour vivre et grandir.",
      "ex": "Une bonne alimentation comprend trois repas par jour et de l’eau propre."
    },
    "hygiene": {
      "def": "L’hygiène, c’est l’ensemble des gestes de propreté qui empêchent les microbes d’entrer dans le corps.",
      "ex": "Se laver les mains, couvrir la nourriture et boire de l’eau propre sont des gestes d’hygiène."
    },
    "microbe": {
      "def": "Les microbes sont des êtres vivants trop petits pour être vus. Certains rendent malade quand ils entrent dans le corps.",
      "ex": "Les microbes des mains sales passent dans la nourriture et donnent la diarrhée."
    },
    "lavage des mains": {
      "def": "Se laver les mains, c’est les frotter avec de l’eau et du savon pendant au moins trente secondes, avant de manger et après les toilettes.",
      "ex": "On mouille, on savonne, on frotte entre les doigts et sous les ongles, on rince, on sèche."
    },
    "savon": {
      "def": "Le savon est le produit qui décolle la graisse et les microbes de la peau. Sans lui, l’eau seule ne suffit pas.",
      "ex": "Se laver les mains à l’eau seule laisse la plupart des microbes en place."
    },
    "eau potable": {
      "def": "L’eau potable est une eau que l’on peut boire sans danger, parce qu’elle ne contient pas de microbes.",
      "ex": "L’eau du puits devient potable après avoir été bouillie ou filtrée."
    },
    "filtration": {
      "def": "Filtrer, c’est faire passer l’eau à travers un tissu ou un filtre pour retenir les saletés.",
      "ex": "On filtre l’eau du puits dans un linge propre avant de la faire bouillir."
    },
    "faire bouillir": {
      "def": "Faire bouillir l’eau, c’est la chauffer jusqu’aux grosses bulles et l’y maintenir quelques minutes : la chaleur tue les microbes.",
      "ex": "Après ébullition, on laisse refroidir l’eau dans un récipient fermé et propre."
    },
    "vaccination": {
      "def": "La vaccination, c’est recevoir un vaccin qui apprend au corps à se défendre contre une maladie avant de l’attraper.",
      "ex": "Le vaccin contre la rougeole protège l’enfant avant qu’il ne rencontre la maladie."
    },
    "protection": {
      "def": "Se protéger, c’est prendre à l’avance les précautions qui empêchent le danger ou la maladie d’arriver.",
      "ex": "Dormir sous une moustiquaire protège du paludisme."
    },
    "moustique": {
      "def": "Le moustique est un insecte qui pique pour se nourrir de sang. Le moustique anophèle femelle transmet le paludisme.",
      "ex": "Il pique surtout la nuit : c’est pourquoi on dort sous moustiquaire."
    },
    "compost": {
      "def": "Le compost est un engrais naturel fait de déchets végétaux qui pourrissent ensemble.",
      "ex": "Épluchures et feuilles mortes entassées deviennent du compost en deux mois."
    },
    "decomposeur": {
      "def": "Un décomposeur est un être vivant qui transforme les restes morts en terre riche.",
      "ex": "Vers de terre, champignons et bactéries sont des décomposeurs."
    },
    "evaporation": {
      "def": "L’évaporation, c’est l’eau qui devient vapeur sous l’effet de la chaleur et part dans l’air.",
      "ex": "Le linge étendu au soleil sèche : l’eau s’évapore."
    },
    "condensation": {
      "def": "La condensation, c’est la vapeur d’eau qui redevient liquide en refroidissant.",
      "ex": "Des gouttes se forment à l’extérieur d’une bouteille froide : c’est la condensation."
    },
    "infiltration": {
      "def": "L’infiltration, c’est l’eau de pluie qui pénètre dans le sol au lieu de couler dessus.",
      "ex": "Dans un sol sableux, l’eau s’infiltre vite et le sol sèche vite."
    },
    "humus": {
      "def": "L’humus est la couche noire du dessus du sol, faite de restes de plantes décomposées. C’est la partie la plus fertile.",
      "ex": "Sous les arbres, la terre noire et légère est de l’humus."
    },
    "sol": {
      "def": "Le sol est la couche de terre qui couvre la surface. Il porte les plantes et retient l’eau.",
      "ex": "On y trouve du sable, de l’argile, de l’humus et des cailloux."
    },
    "mineraux": {
      "def": "Les minéraux sont des matières du sol qui ne sont pas vivantes. La plante en puise par ses racines.",
      "ex": "Le sable, l’argile et le sel sont des minéraux."
    },
    "vent": {
      "def": "Le vent, c’est de l’air en mouvement. On ne le voit pas, mais on voit ce qu’il déplace.",
      "ex": "Le vent fait bouger les feuilles et fait monter le cerf-volant."
    },
    "energie solaire": {
      "def": "L’énergie solaire, c’est la chaleur et la lumière que donne le soleil. On peut la transformer en électricité.",
      "ex": "Un panneau solaire sur le toit allume les lampes le soir."
    },
    "chaleur": {
      "def": "La chaleur est une forme d’énergie qui réchauffe. Elle passe du corps chaud vers le corps froid.",
      "ex": "La marmite chauffe l’eau, l’eau chauffe le riz."
    },
    "lumiere": {
      "def": "La lumière est ce qui permet de voir. Elle vient du soleil, du feu ou d’une lampe, et se propage en ligne droite.",
      "ex": "Sans lumière, l’œil ne voit rien : dans le noir complet, on ne distingue plus rien."
    },
    "pile": {
      "def": "La pile est une réserve d’énergie électrique. Elle fait fonctionner un appareil sans fil du secteur.",
      "ex": "Deux piles dans la torche allument l’ampoule."
    },
    "interrupteur": {
      "def": "L’interrupteur est le bouton qui ouvre ou ferme le circuit électrique. Fermé, le courant passe ; ouvert, il ne passe plus.",
      "ex": "On appuie sur l’interrupteur et la lampe s’allume."
    },
    "poulie": {
      "def": "La poulie est une roue à gorge dans laquelle passe une corde. Elle change le sens de l’effort et facilite le levage.",
      "ex": "Au puits, la poulie permet de tirer le seau vers le bas plutôt que de le hisser à bout de bras."
    },
    "roue": {
      "def": "La roue est un disque qui tourne autour d’un axe. Elle permet de déplacer une charge lourde sans la porter.",
      "ex": "La brouette a une roue : elle roule au lieu de traîner."
    },
    "objet technique": {
      "def": "Un objet technique a été fabriqué par l’homme pour rendre un service précis.",
      "ex": "La brouette, la lampe, le seau et la houe sont des objets techniques."
    },
    "objet naturel": {
      "def": "Un objet naturel existe dans la nature sans que l’homme l’ait fabriqué.",
      "ex": "Une pierre, une feuille, l’eau de pluie sont des objets naturels."
    }
  };
  function primaryLexique_v463(mot){
    var k=primaryPhotoKey_v463(mot);
    if(PRIMARY_LEXIQUE_V463[k])return PRIMARY_LEXIQUE_V463[k];
    var sing=k.replace(/s$/,'');
    if(PRIMARY_LEXIQUE_V463[sing])return PRIMARY_LEXIQUE_V463[sing];
    var mots=k.split(' ');
    for(var i=0;i<mots.length;i++){
      var m=mots[i];
      if(m.length>3&&PRIMARY_LEXIQUE_V463[m])return PRIMARY_LEXIQUE_V463[m];
      if(m.length>4&&PRIMARY_LEXIQUE_V463[m.replace(/s$/,'')])return PRIMARY_LEXIQUE_V463[m.replace(/s$/,'')];
    }
    return null;
  }
  /* V471 : distinguer une vraie definition d'une phrase de remplissage.
     Beaucoup d'items du primaire ne sont pas des notions mais des etapes
     (« je choisis une idee », « premiere etape », « trois groupes ») : leur
     donner une fausse definition n'aide personne. */
  function primaryVraieDefinition_v471(item){
    if(primaryLexique_v463(item&&item.word))return true;
    return !!String(item&&item['def']||'').trim();
  }
  function primaryItemDefinition(item){
    var entree=primaryLexique_v463(item&&item.word);
    if(entree)return entree['def'];
    var d=String(item&&item['def']||'').trim();
    return d||'Mot de la leçon : observe l’illustration, écoute la prononciation, puis répète.';
  }
  function primaryItemExemple_v463(item){
    var entree=primaryLexique_v463(item&&item.word);
    return entree?entree.ex:'';
  }
  function primaryGlossaryMarkup(activity){
    var items=(activity&&activity.items)||[];
    if(!items.length)return '';
    var seen={},rows=[];
    items.forEach(function(item){
      var word=String(item.word||'').trim(),key=primaryNormalizeKey(word);
      if(!word||!key||seen[key])return;seen[key]=true;
      if(!primaryVraieDefinition_v471(item))return;
      var ex=primaryItemExemple_v463(item);
      rows.push('<li><b>'+esc(word)+primaryPastilleCouleur_v471(word)+'</b><span>'+primaryTexteCouleur_v471(primaryItemDefinition(item))+'</span>'+(ex?'<i><b>Exemple :</b> '+primaryTexteCouleur_v471(ex)+'</i>':'')+'</li>');
    });
    if(!rows.length)return '';
    return '<section class="nx-primary-glossary-v441"><h4>Les mots de la leçon et leur sens</h4>'+
      '<p>Chaque mot nommé pendant la leçon est expliqué ici. Relis-les après avoir écouté.</p>'+
      '<ul class="nx-primary-glossary-list-v441">'+rows.join('')+'</ul></section>';
  }
  function cp1ActivityFor(lesson){
    var source=PRIMARY_GUIDED_VISUALS[lesson.title]||{instruction:'Observe la représentation, écoute attentivement le mot exact et répète.',repeat:'Écoute attentivement, puis répète avec une voix claire.',tip:'Laisse l’enfant observer avant de donner la réponse.',items:[{art:'👀',word:lesson.title,speech:lesson.title}]};
    return {
      instruction:String(source.instruction||'Observe la représentation, écoute le mot exact et répète.'),
      repeat:String(source.repeat||'Écoute attentivement, puis répète avec une voix claire.'),
      tip:String(source.tip||'Laisse l’enfant observer avant de donner la réponse.'),
      items:(source.items||[]).map(function(item){return {art:String(item.art||''),kind:String(item.kind||''),def:String(item['def']||''),word:String(item.word||''),speech:primarySpeechText(item.speech||item.word||'')};})
    };
  }
  function cp1Context(){
    var cl=classById(state.classId),sub=subjectById(cl,state.subjectId),lesson=sub&&sub.lessons[state.lessonIndex];
    return cl&&sub&&lesson?{cl:cl,sub:sub,lesson:lesson,activity:cp1ActivityFor(lesson)}:null;
  }
  var cp1Melody={ctx:null,timer:null,playing:false,status:'',sequence:[261.63,329.63,392.00,329.63,293.66,349.23,392.00,349.23]};
  function cp1MelodyUi(){return viewer()&&viewer().querySelector('[data-nx-cp1-melody-status]');}
  function cp1MelodyButton(){return viewer()&&viewer().querySelector('[data-nx-primary-action="cp1-melody-toggle"]');}
  function cp1SetMelodyStatus(text){cp1Melody.status=text||'';var el=cp1MelodyUi();if(el)el.textContent=cp1Melody.status;}
  function cp1UpdateMelodyButton(){var btn=cp1MelodyButton();if(btn)btn.textContent=state.cp1MelodyOn?'🎵 Couper la mélodie':'🎵 Relancer la mélodie';}
  function cp1EnsureMelodyContext(){var Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;if(!cp1Melody.ctx)cp1Melody.ctx=new Ctx();if(cp1Melody.ctx.state==='suspended'&&cp1Melody.ctx.resume)cp1Melody.ctx.resume();return cp1Melody.ctx;}
  function cp1ScheduleMelody(){if(!cp1Melody.playing)return;var ctx=cp1EnsureMelodyContext();if(!ctx)return;var start=ctx.currentTime+0.02,step=0.58;cp1Melody.sequence.forEach(function(freq,index){var osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(0.0001,start+index*step);gain.gain.linearRampToValueAtTime(0.014,start+index*step+0.08);gain.gain.linearRampToValueAtTime(0.009,start+index*step+0.28);gain.gain.exponentialRampToValueAtTime(0.0001,start+index*step+0.54);osc.connect(gain);gain.connect(ctx.destination);osc.start(start+index*step);osc.stop(start+index*step+0.56);});cp1Melody.timer=window.setTimeout(cp1ScheduleMelody,cp1Melody.sequence.length*step*1000);}
  function cp1StartMelody(){if(!state.cp1MelodyOn)return;var ctx=cp1EnsureMelodyContext();if(!ctx){cp1SetMelodyStatus('La mélodie douce n’est pas disponible sur cet appareil.');cp1UpdateMelodyButton();return;}if(cp1Melody.playing){cp1SetMelodyStatus('Une mélodie douce accompagne la leçon.');cp1UpdateMelodyButton();return;}cp1Melody.playing=true;cp1SetMelodyStatus('Une mélodie douce accompagne la leçon.');cp1UpdateMelodyButton();cp1ScheduleMelody();}
  function cp1StopMelody(){if(cp1Melody.timer){window.clearTimeout(cp1Melody.timer);cp1Melody.timer=null;}cp1Melody.playing=false;}
  function cp1ToggleMelody(force){if(typeof force==='boolean')state.cp1MelodyOn=force;else state.cp1MelodyOn=!state.cp1MelodyOn;if(state.cp1MelodyOn){cp1StartMelody();}else{cp1StopMelody();cp1SetMelodyStatus('La mélodie est en pause.');cp1UpdateMelodyButton();}}

  function cp1FrenchVoice(){
    var voices=window.speechSynthesis&&window.speechSynthesis.getVoices?window.speechSynthesis.getVoices():[];
    var french=voices.filter(function(v){return /^fr([_-]|$)/i.test(v.lang||'');});
    french.sort(function(a,b){
      function score(v){
        var n=String(v.name||'').toLowerCase(),s=0;
        if(/^fr-fr$/i.test(v.lang||''))s+=8;
        if(v.localService)s+=3;
        if(/google|microsoft|amelie|audrey|thomas|hortense|fran[cç]ais/.test(n))s+=2;
        return s;
      }
      return score(b)-score(a);
    });
    return french[0]||null;
  }
  function cp1Speak(text,onEnd,options){
    text=primarySpeechText(text);
    options=options||{};
    if(!text){if(typeof onEnd==='function')onEnd();return null;}
    var finished=false,fallback=null;
    function done(){if(finished)return;finished=true;if(fallback)window.clearTimeout(fallback);if(typeof onEnd==='function')onEnd();}
    try{
      if(!('speechSynthesis' in window))throw new Error('audio');
      window.speechSynthesis.cancel();
      var utterance=new SpeechSynthesisUtterance(text);
      utterance.lang='fr-FR';
      utterance.rate=Number(options.rate||.74);
      utterance.pitch=Number(options.pitch||1);
      utterance.volume=1;
      var voice=cp1FrenchVoice();if(voice)utterance.voice=voice;
      utterance.onend=done;utterance.onerror=function(){window.setTimeout(done,250);};
      fallback=window.setTimeout(done,Math.max(2500,Math.min(60000,text.length*125)));
      window.speechSynthesis.speak(utterance);return utterance;
    }catch(_e){
      var status=viewer()&&viewer().querySelector('[data-nx-cp1-guide-status]');
      if(status)status.textContent='La voix française n’est pas disponible sur cet appareil. Le mot exact reste affiché pour être lu par un adulte.';
      fallback=window.setTimeout(done,800);return null;
    }
  }
  function cp1SpeakWord(item,onEnd){
    var spoken=primarySpeechText(item&&item.speech||item&&item.word||'');
    if(!spoken){if(typeof onEnd==='function')onEnd();return;}
    cp1Speak('Écoute attentivement. '+spoken,function(){
      cp1Speak(spoken+'. Maintenant, répète clairement : '+spoken,onEnd,{rate:.82,pitch:1});
    },{rate:.60,pitch:1});
  }
  function cp1StopGuide(){
    state.cp1Token+=1;state.cp1Auto=false;
    if(state.cp1Timer){window.clearTimeout(state.cp1Timer);state.cp1Timer=null;}
    try{if(window.speechSynthesis)window.speechSynthesis.cancel();}catch(_e){window.nxLog&&window.nxLog(_e)}
    cp1UpdateAutoButton();
  }
  function cp1UpdateAutoButton(){
    var btn=viewer()&&viewer().querySelector('[data-nx-primary-action="cp1-guide-toggle"]');
    if(btn)btn.textContent=state.cp1Auto?'⏸ Pause':'▶ Continuer';
  }
  function cp1SetPhase(phase){
    state.cp1Phase=phase;
    var v=viewer();if(!v)return;
    v.querySelectorAll('[data-nx-cp1-phase]').forEach(function(el){el.classList.toggle('active',Number(el.getAttribute('data-nx-cp1-phase'))===phase);});
  }
  function cp1SetStatus(text){var el=viewer()&&viewer().querySelector('[data-nx-cp1-guide-status]');if(el)el.textContent=text||'';}
  function cp1RoundLabel(){return 'Passage '+state.cp1Round+'/'+state.cp1TotalRounds+'. ';}
  function primaryUsesFullNarration(cl){return !!(cl&&(cl.id==='ce1'||cl.id==='ce2'));}
  function primaryNarrationSegments(plan){
    var segments=[
      {label:'Introduction',text:plan.introduction},
      {label:'Définition',text:plan.definition},
      {label:'Pourquoi cette leçon est utile',text:plan.importance}
    ];
    (plan.steps||[]).forEach(function(step,i){segments.push({label:'Étape '+(i+1)+' : '+step.t,text:step.p});});
    segments.push({label:'Exemple guidé',text:plan.example});
    segments.push({label:'À retenir',text:plan.trace});
    return segments.filter(function(segment){return String(segment.text||'').trim();});
  }
  function primaryRunNarration(segments,index,token){
    if(token!==state.cp1Token||!state.cp1Auto)return;
    if(index>=segments.length){cp1ShowChallenge(token);return;}
    var segment=segments[index];
    cp1SetPhase(index<3?1:2);
    cp1SetStatus((index+1)+'/'+segments.length+' · '+segment.label+'. Nexora lit puis explique ce passage.');
    cp1Speak(segment.label+'. '+segment.text,function(){
      if(token!==state.cp1Token||!state.cp1Auto)return;
      state.cp1Timer=window.setTimeout(function(){primaryRunNarration(segments,index+1,token);},500);
    },{rate:.76});
  }
  function cp1ShowItem(index,reveal){
    var ctx=cp1Context();if(!ctx)return;
    var items=ctx.activity.items||[];if(!items.length)return;
    index=Math.max(0,Math.min(index,items.length-1));state.cp1ItemIndex=index;
    var item=items[index],v=viewer();if(!v)return;
    var art=v.querySelector('[data-nx-cp1-focus-art]'),word=v.querySelector('[data-nx-cp1-focus-word]'),instruction=v.querySelector('[data-nx-cp1-focus-instruction]'),pronunciation=v.querySelector('[data-nx-cp1-pronunciation]');
    var definition=v.querySelector('[data-nx-cp1-definition]');
    if(definition){
      var vrai=primaryVraieDefinition_v471(item);
      definition.hidden=!vrai;
      definition.innerHTML=vrai?('<b>Ce que cela veut dire :</b> '+primaryTexteCouleur_v471(primaryItemDefinition(item))):'';
    }
    if(art){art.innerHTML=primaryVisualMarkup(item);art.setAttribute('aria-label','Illustration correcte de '+String(item.word||'la notion'));}
    if(word){word.textContent=item.word||'';word.classList.toggle('show',!!reveal);}
    if(pronunciation){pronunciation.innerHTML='<b>Prononciation :</b> '+esc(primaryPronunciationGuide(item));pronunciation.classList.toggle('show',!!reveal);}
    if(instruction)instruction.textContent=reveal?'Répète clairement le mot ou la phrase affichée. Touche l’image pour l’agrandir.':'Observe l’illustration exacte, puis écoute attentivement. Touche l’image pour l’agrandir.';
    var dots=v.querySelector('[data-nx-cp1-guide-progress]');
    if(dots)dots.innerHTML=items.map(function(_x,i){return '<i class="'+(i===index?'active':'')+'"></i>';}).join('');
  }
  function cp1ShowChallenge(token){
    if(token!==state.cp1Token)return;
    state.cp1Auto=false;cp1UpdateAutoButton();cp1SetPhase(3);
    var box=viewer()&&viewer().querySelector('[data-nx-cp1-challenge]');
    if(!box)return;box.hidden=false;
    var target=box.getAttribute('data-target')||'la bonne image',mode=box.getAttribute('data-mode')||'image',prompt=box.getAttribute('data-prompt')||'';
    if(mode==='text'){
      cp1SetStatus('À toi de jouer : lis ou écoute l’explication, puis choisis le mot juste.');
      cp1Speak('Très bien. Écoute l’explication, puis choisis le mot juste. '+prompt);
    }else{
      cp1SetStatus('À toi de jouer : touche la bonne image.');
      cp1Speak('Très bien. Maintenant, touche l’image qui montre '+target+'.');
    }
    window.setTimeout(function(){try{box.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){window.nxLog&&window.nxLog(_e)}},350);
  }
  function cp1RunItem(index,token){
    var ctx=cp1Context();if(!ctx||token!==state.cp1Token||!state.cp1Auto)return;
    var items=ctx.activity.items||[];
    if(index>=items.length){
      if(state.cp1Round<state.cp1TotalRounds){
        state.cp1Round+=1;state.cp1ItemIndex=0;cp1SetPhase(1);cp1ShowItem(0,false);cp1SetStatus(cp1RoundLabel()+'La leçon recommence pour consolider le thème et la prononciation.');
        cp1Speak('Très bien. Nous reprenons le même thème. Passage '+state.cp1Round+' sur '+state.cp1TotalRounds+'.',function(){
          if(token!==state.cp1Token||!state.cp1Auto)return;
          state.cp1Timer=window.setTimeout(function(){cp1RunItem(0,token);},650);
        },{rate:.76});
      }else cp1ShowChallenge(token);
      return;
    }
    state.cp1ItemIndex=index;cp1SetPhase(2);cp1ShowItem(index,false);cp1SetStatus(cp1RoundLabel()+'Observe l’illustration exacte. Écoute attentivement, puis écoute une seconde fois et répète clairement.');
    var item=items[index];
    cp1SpeakWord(item,function(){
      if(token!==state.cp1Token||!state.cp1Auto)return;
      cp1ShowItem(index,true);cp1SetStatus(cp1RoundLabel()+'À toi : répète clairement, puis regarde le mot écrit.');
      state.cp1Timer=window.setTimeout(function(){cp1RunItem(index+1,token);},2600);
    });
  }
  function cp1StartGuide(fromCurrent,skipIntro){
    var ctx=cp1Context();if(!ctx)return;
    cp1StopGuide();state.cp1Auto=true;if(!fromCurrent){state.cp1ItemIndex=0;state.cp1Round=1;}cp1UpdateAutoButton();
    var token=state.cp1Token,plan=lessonPlan(ctx.cl,ctx.sub,ctx.lesson);
    if(primaryUsesFullNarration(ctx.cl)){
      var segments=primaryNarrationSegments(plan);
      cp1SetPhase(1);cp1ShowItem(state.cp1ItemIndex,false);
      cp1SetStatus('Nexora va lire la leçon complète : introduction, définition, développement, exemple et synthèse.');
      primaryRunNarration(segments,0,token);return;
    }
    cp1SetPhase(1);cp1ShowItem(state.cp1ItemIndex,false);cp1SetStatus(cp1RoundLabel()+'Nexora annonce le thème, le définit, puis présente les illustrations et les mots.');
    var intro='Le thème de la leçon est : '+plan.theme+'. '+plan.definition+' '+ctx.activity.instruction;
    if(skipIntro){cp1RunItem(state.cp1ItemIndex,token);return;}
    cp1Speak(intro,function(){
      if(token!==state.cp1Token||!state.cp1Auto)return;
      state.cp1Timer=window.setTimeout(function(){cp1RunItem(0,token);},650);
    },{rate:.72});
  }
  function cp1ManualItem(delta){
    var ctx=cp1Context();if(!ctx)return;
    var items=ctx.activity.items||[];cp1StopGuide();
    state.cp1ItemIndex=Math.max(0,Math.min(state.cp1ItemIndex+delta,items.length-1));cp1SetPhase(2);cp1ShowItem(state.cp1ItemIndex,true);
    var item=items[state.cp1ItemIndex];cp1SetStatus('Observe l’image, écoute attentivement, puis répète clairement.');cp1SpeakWord(item);
  }
  function cp1Challenge(activity){
    var items=(activity.items||[]).slice(0,4);if(items.length<2)return '';
    var correctIndex=Math.abs(Number(state.lessonIndex||0))%items.length,correct=items[correctIndex];
    var isUpper=state.classId==='ce1'||state.classId==='ce2'||state.classId==='cm1'||state.classId==='cm2';
    function visualIdentity(item){
      var photo=primaryPhotoFor_v463(item);if(photo)return 'photo:'+photo;
      var visual=primaryValidatedArt(item);
      if(visual.html)return 'color:'+primaryPhotoKey_v463(item.word);
      if(visual.card)return 'card:'+primaryPhotoKey_v463(item.word);
      if(visual.diagram)return 'diagram:'+visual.kind+':'+primaryPhotoKey_v463(item.word);
      if(visual.kind)return 'kind:'+visual.kind;
      return 'art:'+visual.art;
    }
    var seen={},duplicate=false;
    items.forEach(function(item){var id=visualIdentity(item);if(seen[id])duplicate=true;seen[id]=true;});
    var hasDefinition=primaryVraieDefinition_v471(correct),prompt=hasDefinition?primaryItemDefinition(correct):('Le mot à reconnaître est '+correct.word+'.');
    var options=items.map(function(item,i){
      var body=duplicate?('<b>'+esc(item.word)+'</b>'):primaryVisualMarkup(item);
      return '<button type="button" class="nx-cp1-challenge-option-v150" data-nx-primary-action="cp1-answer" data-correct="'+(i===correctIndex?'1':'0')+'" data-word="'+esc(item.word)+'" aria-label="'+(duplicate?'Réponse ':'Illustration de ')+esc(item.word)+'">'+body+'</button>';
    }).join('');
    return '<section class="nx-cp1-challenge-v150" data-nx-cp1-challenge data-mode="'+(duplicate?'text':'image')+'" data-prompt="'+esc(prompt)+'" data-target="'+esc(correct.word)+'" hidden><h4>'+(duplicate?'Je choisis le mot juste':'Je reconnais la bonne illustration')+'</h4><p>'+(duplicate?('<b>Explication :</b> '+esc(prompt)):(isUpper?'Choisis la représentation exacte qui correspond à : ':'Touche l’image correcte qui représente : ')+'<b>'+esc(correct.word)+'</b>')+'</p><div class="nx-cp1-challenge-options-v150">'+options+'</div><div class="nx-cp1-challenge-feedback-v150" data-nx-cp1-challenge-feedback aria-live="polite"></div></section>';
  }
  function primaryAdultOrganisation(cl){
    if(cl.id==='cp1')return 'Laisser l’enfant observer, écouter et répéter. Utiliser des objets réels et des phrases très courtes, puis valoriser chaque progrès.';
    if(cl.id==='cp2')return 'Faire rappeler l’acquis de la 1ère année, laisser l’enfant manipuler ou lire, puis lui demander d’expliquer sa réponse avec une phrase simple.';
    if(cl.id==='ce1'||cl.id==='ce2')return 'Demander à l’élève de reformuler la consigne, de suivre les étapes dans l’ordre et de justifier au moins une réponse.';
    return 'Demander à l’élève d’expliquer la méthode, de justifier sa réponse, de vérifier son travail et de relier la notion à une situation réelle en Guinée.';
  }
  function expandedPrimaryLessonMarkup(cl,sub,lesson,plan){
    var key=lessonKey(cl.id,sub.id,state.lessonIndex),saved=answerFor(key),mastery=masteryFor(key),done=isDone(cl.id,sub.id,state.lessonIndex);
    var stepHtml=(plan.steps||[]).map(function(step,i){return '<section class="nx-primary-step-v147"><span class="nx-primary-step-number-v147">'+(i+1)+'</span><div class="nx-primary-step-copy-v147"><h4>'+esc(step.t)+'</h4><p>'+primaryTexteCouleur_v471(step.p)+'</p></div></section>';}).join('');
    /* V471 : le bandeau des couleurs n'apparait que si la lecon en nomme vraiment. */
    var couleurs=primaryCouleursDeLaLecon_v471([plan.introduction,plan.definition,plan.importance,plan.objective,plan.discovery,plan.example,plan.exercise,plan.trace]
      .concat((plan.steps||[]).map(function(s){return s.p;})));
    var exempleTheme=primaryThemeExemple_v463(lesson);
    return '<section class="nx-primary-developed-v340">'+
      /* V463 : le theme est nomme et defini avant tout. */
      '<section class="nx-primary-theme-v463">'+
        '<small>Thème de la leçon</small>'+
        '<h4>'+esc(plan.theme)+'</h4>'+
        '<p><b>Définition :</b> '+primaryTexteCouleur_v471(plan.definition)+'</p>'+
        (exempleTheme?'<p class="nx-primary-theme-ex-v463"><b>Exemple :</b> '+primaryTexteCouleur_v471(exempleTheme)+'</p>':'')+
      '</section>'+
      '<section class="nx-primary-warmup-v147"><h4>Introduction</h4><p>'+primaryTexteCouleur_v471(plan.introduction)+'</p></section>'+
      '<section class="nx-primary-objective-v147"><span class="label">Pourquoi cette leçon est utile</span><p>'+primaryTexteCouleur_v471(plan.importance)+'</p></section>'+
      couleurs+
      primaryGlossaryMarkup(PRIMARY_GUIDED_VISUALS[lesson.title])+
      /* V463 : la consigne d'abord — V471 : sans recopier l'exemple guide ni
         l'exercice, qui sont ecrits en toutes lettres aux moments 3 et 5. */
      '<section class="nx-primary-consigne-v463">'+
        '<b>Ce qu’il faut faire</b>'+
        '<ol>'+
          '<li><span>Lire ensemble</span><p>L’adulte lit avec l’élève les cinq moments, dans l’ordre, sans en sauter.</p></li>'+
          '<li><span>Refaire l’exemple</span><p>On refait ensemble l’exemple guidé du moment 3, jusqu’à ce que l’élève le fasse seul.</p></li>'+
          '<li><span>Faire l’exercice seul</span><p>L’élève traite seul l’exercice du moment 5 et écrit sa réponse.</p></li>'+
          '<li><span>Vérifier</span><p>On compare avec la correction, puis l’élève choisit son niveau de compréhension.</p></li>'+
        '</ol>'+
        '<i>Durée conseillée : '+esc(plan.duration)+' · Matériel : '+esc(plan.material)+'</i>'+
      '</section>'+
      /* Tout ce qui s'adresse a l'adulte seul est reuni et replie. */
      '<details class="nx-primary-adult-v463"><summary><b>Avant de commencer — pour le parent ou l’enseignant</b><i>Ouvrir</i></summary>'+
        '<div class="nx-primary-adult-body-v463">'+
          '<section class="nx-primary-objective-v147"><span class="label">Compétence visée · '+esc(plan.level)+'</span><p>'+primaryTexteCouleur_v471(plan.objective)+'</p></section>'+
          '<section class="nx-primary-box-v145"><h4>Ce que l’élève doit déjà savoir</h4><p>'+esc(plan.prerequisite)+'</p></section>'+
          '<section class="nx-primary-adult-tip-v147"><b>Comment accompagner</b><p>'+esc(primaryAdultOrganisation(cl))+' '+esc(plan.adultTip)+'</p></section>'+
        '</div></details>'+
      '<div class="nx-primary-pupil-title-v463"><b>Avec l’élève</b><i>Cinq moments, dans l’ordre</i></div>'+
      '<section class="nx-primary-warmup-v147"><h4><u>1</u> Situation de découverte</h4><p>'+primaryTexteCouleur_v471(plan.discovery)+'</p></section>'+
      '<div class="nx-primary-lesson-section-title-v147"><u>2</u> La leçon expliquée étape par étape</div>'+
      '<div class="nx-primary-steps-v147">'+stepHtml+'</div>'+
      '<section class="nx-primary-example-v147"><h4><u>3</u> Exemple guidé</h4><p>'+primaryTexteCouleur_v471(plan.example)+'</p><p class="nx-primary-example-method-v147"><b>Entraînement avec aide :</b> '+primaryTexteCouleur_v471(plan.guided)+'</p></section>'+
      '<section class="nx-primary-trace-v147"><b><u>4</u> À retenir dans le cahier</b><p>'+primaryTexteCouleur_v471(plan.trace)+'</p></section>'+
      '<section class="nx-primary-exercise-v147"><h4><u>5</u> Exercice autonome</h4><p class="instruction">'+primaryTexteCouleur_v471(plan.exercise)+'</p><textarea class="nx-primary-answer-v147" data-nx-primary-answer="'+esc(key)+'" placeholder="Écris ta réponse ici, ou note ce que l’élève a dit, calculé, dessiné ou réalisé.">'+esc(saved)+'</textarea><div class="nx-primary-exercise-tools-v147"><button type="button" data-nx-primary-action="toggle-hint">Afficher un indice</button><button type="button" data-nx-primary-action="toggle-correction">Voir la correction</button><button type="button" data-nx-primary-action="clear-answer">Effacer la réponse</button></div><div class="nx-primary-reveal-v147 hint" data-nx-primary-hint hidden><b>Indice :</b> '+primaryTexteCouleur_v471(plan.hint)+'</div><div class="nx-primary-reveal-v147 correction" data-nx-primary-correction hidden><b>Correction ou critères de réussite :</b> '+primaryTexteCouleur_v471(plan.correction)+'</div></section>'+
      '<section class="nx-primary-selfcheck-v147"><h4>Je vérifie ma compréhension</h4><p>Après l’exercice, choisis honnêtement le niveau qui correspond à ta compréhension.</p><div class="nx-primary-mastery-v147"><button type="button" data-nx-primary-action="mastery" data-level="review" class="'+(mastery==='review'?'active':'')+'">À revoir</button><button type="button" data-nx-primary-action="mastery" data-level="understood" class="'+(mastery==='understood'?'active':'')+'">J’ai compris</button><button type="button" data-nx-primary-action="mastery" data-level="mastered" class="'+(mastery==='mastered'?'active':'')+'">Je maîtrise</button></div></section>'+
      '<div class="nx-primary-actions-v145"><button type="button" class="primary '+(done?'done':'')+'" data-nx-primary-action="toggle-done">'+(done?'Leçon terminée ✓':'Marquer la leçon comme terminée')+'</button></div>'+
    '</section>';
  }
  function renderCp1VisualLesson(cl,sub,lesson){
    cp1StopGuide();cp1StopMelody();state.cp1Round=1;state.challengePassed=false;state.view='lesson';title(lesson.title);resetPrimaryScroll();
    var next=state.lessonIndex<sub.lessons.length-1,activity=cp1ActivityFor(lesson),plan=lessonPlan(cl,sub,lesson),meta=cp1SubjectMeta(sub.id),s=stage();if(!s)return;
    var first=(activity.items&&activity.items[0])||{art:'👀',word:'Observe',speech:'Observe'};
    var isUpper=cl.id==='ce1'||cl.id==='ce2'||cl.id==='cm1'||cl.id==='cm2';
    var fullNarration=primaryUsesFullNarration(cl);
    var notions=(plan.notions||[]).map(function(n){return '<span>'+esc(n)+'</span>';}).join('');
    s.innerHTML=
      breadcrumb([{label:'École primaire',action:'classes'},{label:cl.title,action:'subjects'},{label:sub.name,action:'lessons'},{label:'Leçon '+(state.lessonIndex+1)}])+
      '<article class="nx-cp1-lesson-v150" data-subject="'+esc(sub.id)+'">'+
        '<header class="nx-cp1-lesson-head-v150"><div class="nx-cp1-lesson-kicker-v150"><span>'+esc(meta.icon+' '+sub.name)+'</span><span>Leçon '+(state.lessonIndex+1)+'/'+sub.lessons.length+'</span></div><h3>'+esc(lesson.title)+'</h3><p>'+esc(lesson.summary)+'</p></header>'+
        '<section class="nx-primary-theme-v340"><small>Thème de la leçon</small><h4>'+esc(plan.theme)+'</h4><p><b>Définition :</b> '+esc(plan.definition)+'</p><div class="nx-primary-notions-v340"><b>Notions abordées</b>'+notions+'</div></section>'+
        '<div class="nx-cp1-learning-path-v150"><span class="active" data-nx-cp1-phase="1"><b>🔊</b>J’écoute</span><span data-nx-cp1-phase="2"><b>👀</b>J’observe</span><span data-nx-cp1-phase="3"><b>☝️</b>Je réponds</span><span data-nx-cp1-phase="4"><b>✓</b>J’ai appris</span></div>'+
        '<section class="nx-cp1-guide-v150"><div class="nx-cp1-teacher-bar-v150"><span class="nx-cp1-teacher-avatar-v150">🔊</span><div class="nx-cp1-teacher-copy-v150"><b>'+(fullNarration?'Nexora lit et explique toute la leçon':'Nexora définit le thème et guide la prononciation')+'</b><span data-nx-cp1-guide-status>'+(fullNarration?'Introduction, définition, développement, exemple et synthèse seront lus dans l’ordre.':'Chaque mot sera représenté exactement, puis prononcé clairement pour être répété.')+'</span></div><button type="button" class="nx-cp1-auto-state-v150" data-nx-primary-action="cp1-guide-toggle">⏸ Pause</button></div>'+
          '<div class="nx-cp1-focus-v150"><div><div class="nx-cp1-focus-art-v150" data-nx-cp1-focus-art data-nx-primary-action="cp1-zoom" role="button" tabindex="0" title="Agrandir l’image">'+primaryVisualMarkup(first)+'</div><div class="nx-cp1-focus-word-v150" data-nx-cp1-focus-word>'+esc(first.word)+primaryPastilleCouleur_v471(first.word)+'</div><div class="nx-cp1-pronunciation-v340" data-nx-cp1-pronunciation><b>Prononciation :</b> '+esc(primaryPronunciationGuide(first))+'</div><div class="nx-cp1-definition-v441" data-nx-cp1-definition'+(primaryVraieDefinition_v471(first)?'':' hidden')+'>'+(primaryVraieDefinition_v471(first)?('<b>Ce que cela veut dire :</b> '+primaryTexteCouleur_v471(primaryItemDefinition(first))):'')+'</div><p class="nx-cp1-focus-instruction-v150" data-nx-cp1-focus-instruction>Observe l’illustration exacte, puis écoute attentivement. Touche l’image pour l’agrandir.</p></div></div>'+
          '<div class="nx-cp1-guide-progress-v150" data-nx-cp1-guide-progress></div><div class="nx-cp1-guide-controls-v150"><button type="button" data-nx-primary-action="cp1-guide-prev">← Avant</button><button type="button" data-nx-primary-action="cp1-guide-replay">🔊 Prononcer encore</button><button type="button" data-nx-primary-action="cp1-guide-next">Après →</button><button type="button" class="primary" data-nx-primary-action="cp1-restart">↻ Recommencer</button></div></section>'+
        '<div class="nx-primary-image-zoom-v490" data-nx-primary-image-zoom hidden role="dialog" aria-modal="true" aria-label="Illustration agrandie"><button type="button" data-nx-primary-action="cp1-zoom-close" aria-label="Fermer l’image agrandie">× Fermer</button><div data-nx-primary-image-zoom-art></div><b data-nx-primary-image-zoom-label></b></div>'+
        primaryGlossaryMarkup(activity)+
        cp1Challenge(activity)+
        '<section class="nx-cp1-success-v150" data-nx-cp1-success hidden><b>Première vérification réussie !</b><p>'+(isUpper?'L’élève a reconnu la notion. Il doit maintenant étudier les cinq moments, faire l’exercice autonome et choisir son niveau de compréhension.':'L’enfant a reconnu la bonne représentation. Il doit maintenant poursuivre la leçon, faire l’exercice et indiquer ce qu’il a compris.')+'</p></section>'+
        expandedPrimaryLessonMarkup(cl,sub,lesson,plan)+
        '<div class="nx-cp1-lesson-actions-v150"><button type="button" data-nx-primary-action="lessons">Retour au parcours</button>'+(next?'<button type="button" class="primary" data-nx-primary-action="next-lesson">Leçon suivante →</button>':'<button type="button" class="primary" data-nx-primary-action="subjects">Choisir une matière</button>')+'</div>'+
      '</article>';
    cp1ShowItem(0,false);cp1StartMelody();cp1UpdateMelodyButton();window.setTimeout(function(){cp1StartGuide(false,false);},420);
  }


  var SUBJECT_META={
    francais:{duration:'25 à 35 min',material:'Cahier, crayon, ardoise ou texte court',method:'oral, lecture, observation et production'},
    maths:{duration:'25 à 35 min',material:'Ardoise, crayon, graines, bâtonnets ou règle',method:'manipulation, représentation, calcul et vérification'},
    calcul:{duration:'30 à 40 min',material:'Ardoise, cahier, graines, bâtonnets ou monnaie factice',method:'situation-problème, opération et contrôle'},
    sciences:{duration:'25 à 40 min',material:'Objets du milieu, dessin, eau, plante ou matériel simple',method:'observation, questionnement, explication et application'},
    histoire:{duration:'30 à 40 min',material:'Frise, images, carte ou récit',method:'repérage dans le temps, faits, causes et conséquences'},
    geographie:{duration:'30 à 40 min',material:'Carte, croquis, cahier et observation du milieu',method:'localisation, description, explication et croquis'},
    ecm:{duration:'20 à 30 min',material:'Situation de la vie courante, dialogue et cahier',method:'situation, valeur, choix responsable et engagement'},
    'arts-eps':{duration:'25 à 40 min',material:'Espace sécurisé et matériel simple disponible',method:'démonstration, pratique, répétition et amélioration'},
    entretien:{duration:'15 min',material:'Calendrier, images ou matériel de classe',method:'rituel, échange oral et mise en situation'},
    arts:{duration:'20 à 35 min',material:'Papier, crayons, objets et matériel artistique simple',method:'observation, démonstration, création et présentation'},
    eps:{duration:'20 à 30 min',material:'Espace sécurisé et repères au sol',method:'démonstration, pratique, répétition et sécurité'}
  };

  var EXAMPLES={
    'Écouter et prendre la parole':'L’adulte dit : « Prends ton cahier et pose-le sur la table. » L’élève écoute jusqu’à la fin, exécute la consigne, puis répond : « J’ai posé mon cahier sur la table. »',
    'Les sons et les lettres':'Dans le mot « maman », on entend le son /m/ au début. La lettre qui représente ce son est m.',
    'Lire des syllabes simples':'On assemble m et a : m + a = ma. Puis l et i : l + i = li.',
    'Écrire son nom et des mots familiers':'On regarde le modèle « Awa », puis on forme chaque lettre lentement : A – w – a.',
    'Les nombres de 0 à 20':'Pose 7 graines. Compte-les une à une : 1, 2, 3, 4, 5, 6, 7. Écris ensuite le chiffre 7.',
    'Comparer des quantités':'Un groupe contient 5 graines et l’autre 8. Le groupe de 8 en contient plus ; le groupe de 5 en contient moins.',
    'Additionner de petites quantités':'3 mangues et 2 mangues donnent 5 mangues : 3 + 2 = 5.',
    'Formes et positions':'Dessine un carré. Place un petit rond dedans : le rond est à l’intérieur du carré.',
    'Lire des phrases courtes':'« Mariama va à l’école. » On lit chaque mot sans se presser, puis on répond : Qui va à l’école ? Mariama.',
    'La majuscule et le point':'La phrase « mon école est grande » devient : « Mon école est grande. »',
    'Nommer les personnes, animaux et choses':'Dans « La chèvre mange l’herbe », chèvre et herbe sont des noms.',
    'Écrire un petit message':'« Bonjour maître. Merci pour la leçon. » Le message commence par une formule de salutation et se termine par un point.',
    'Les nombres jusqu’à 100':'47 contient 4 dizaines et 7 unités : 47 = 40 + 7.',
    'Addition avec retenue simple':'28 + 17 : 8 + 7 = 15. J’écris 5 unités et je retiens 1 dizaine. Puis 2 + 1 + 1 = 4. Résultat : 45.',
    'Soustraction simple':'35 − 12 : on retire 2 unités à 5, puis 1 dizaine à 3. Résultat : 23.',
    'Mesurer une longueur':'Place le zéro de la règle au bord du cahier, garde la règle droite et lis le nombre au second bord.',
    'La phrase et ses éléments':'Les mots « joue / Fatou / dehors » deviennent : « Fatou joue dehors. »',
    'Le nom et le déterminant':'Dans « La fille porte un sac », La accompagne fille et un accompagne sac.',
    'Le présent des verbes usuels':'Aller au présent : je vais, tu vas, il va, nous allons.',
    'Le sujet et le verbe':'Dans « Les élèves lisent », le sujet est « Les élèves » et le verbe est « lisent ».',
    'Présent, futur et passé composé':'Aujourd’hui je travaille. Demain je travaillerai. Hier j’ai travaillé.',
    'Accords dans le groupe nominal':'Un petit cahier ; des petits cahiers. Les mots s’accordent en nombre.',
    'Rédiger un paragraphe':'Idée principale : « La cour de l’école doit rester propre. » Puis deux phrases donnent des raisons et un exemple.',
    'Phrase simple et phrase complexe':'« Fanta lit. » est simple. « Fanta lit pendant que son frère écrit. » contient deux propositions.',
    'Nature et fonction des mots':'Dans « Mamadou porte un sac lourd », Mamadou est un nom propre et sujet du verbe porte.',
    'Temps du récit':'« Il marchait quand la pluie a commencé. » L’imparfait décrit ; le passé composé raconte l’action soudaine.',
    'Lettre et compte rendu':'Une lettre comporte le lieu, la date, la formule d’appel, le message et la signature.',
    'Analyse de la phrase':'Dans « Les élèves attentifs écoutent le maître », le groupe sujet est « Les élèves attentifs » et le groupe verbal est « écoutent le maître ».',
    'Conjugaison des temps usuels':'Finir : je finis, je finissais, je finirai, j’ai fini.',
    'Orthographe grammaticale':'« Ils sont à l’école et ils ont leurs cahiers. » On choisit sont, à, et et ont selon le sens.',
    'Rédaction structurée':'Avant d’écrire, on prépare trois parties : introduction, développement et conclusion.',
    'Les états de l’eau':'La glace est solide, l’eau de la bouteille est liquide et la vapeur est gazeuse.',
    'La respiration':'Quand on inspire, l’air entre dans les poumons ; quand on expire, l’air ressort.',
    'La préhistoire':'La préhistoire est la période avant l’invention de l’écriture.',
    'Les symboles de la République':'Le drapeau guinéen porte trois couleurs : rouge, jaune et vert.',
    'L’échelle du temps historique':'On place les faits du plus ancien au plus récent sur une frise.',
    'S’orienter et utiliser une carte':'Sur une carte, le nord est généralement placé en haut et la légende explique les symboles.',
    'La Terre et ses mouvements':'La rotation de la Terre provoque l’alternance du jour et de la nuit ; la révolution autour du Soleil dure environ une année.',
    'Proportionnalité simple':'3 cahiers coûtent 15 000 GNF. Un cahier coûte 5 000 GNF ; 8 cahiers coûtent 40 000 GNF.',
    'Fractions, pourcentages simples':'25 % signifie 25 sur 100, soit un quart. Un quart de 80 est 20.',
    'Géométrie et mesures':'Un pavé droit de 5 cm × 3 cm × 2 cm a un volume de 30 cm³.'
  };

  var CORRECTIONS={
    'Les nombres de 0 à 20':'Le dessin doit contenir exactement 8 ronds et le nombre écrit est 8.',
    'Comparer des quantités':'Le groupe de 7 graines en a le plus ; le groupe de 5 graines en a le moins.',
    'Additionner de petites quantités':'3 + 2 = 5. Tu as maintenant 5 mangues.',
    'Formes et positions':'Le dessin attendu montre un rond entièrement placé à l’intérieur d’un carré.',
    'La majuscule et le point':'Réponse correcte : « Mon école est grande. »',
    'Les nombres jusqu’à 100':'47 = 4 dizaines et 7 unités, donc 47 = 40 + 7.',
    'Addition avec retenue simple':'28 + 17 = 45.',
    'Soustraction simple':'35 − 12 = 23 cahiers.',
    'La phrase et ses éléments':'Réponse correcte : « Fatou joue dehors. »',
    'Le nom et le déterminant':'Noms : fille, sac. Déterminants : La, un.',
    'Le présent des verbes usuels':'Je vais, tu vas, il/elle va, nous allons.',
    'Calcul sur les nombres entiers et décimaux':'245,6 + 87,45 = 333,05. Puis 36,5 × 4 = 146.',
    'Proportionnalité simple':'Un cahier coûte 5 000 GNF. Huit cahiers coûtent 8 × 5 000 = 40 000 GNF.',
    'Fractions, pourcentages simples':'25 % de 80 = 20.',
    'Géométrie et mesures':'5 × 3 × 2 = 30. Le volume est 30 cm³.',
    'La Terre et ses mouvements':'La rotation est le mouvement de la Terre sur elle-même ; la révolution est son mouvement autour du Soleil.'
  };

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
  function viewer(){return document.getElementById('nxPrimaryViewerV145');}
  function stage(){var v=viewer();return v?v.querySelector('[data-nx-primary-stage]'):null;}
  function resetPrimaryScroll(){var body=viewer()&&viewer().querySelector('.nx-primary-body-v145');if(body)body.scrollTop=0;}
  function title(text){var v=viewer(),el=v&&v.querySelector('[data-nx-primary-title]');if(el)el.textContent=text||'École primaire';}
  function classById(id){return DATA.find(function(x){return x.id===id;})||null;}
  function subjectById(cl,id){return cl&&(cl.subjects||[]).find(function(x){return x.id===id;})||null;}
  function progressKey(){return 'nexora-primary-v145-progress';}
  function answersKey(){return 'nexora-primary-v147-answers';}
  function masteryKey(){return 'nexora-primary-v147-mastery';}
  function readStore(key){try{var raw=localStorage.getItem(key);var val=raw?JSON.parse(raw):{};return val&&typeof val==='object'?val:{};}catch(_e){return {};}}
  function writeStore(key,data){try{localStorage.setItem(key,JSON.stringify(data||{}));}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function readProgress(){return readStore(progressKey());}
  function writeProgress(data){writeStore(progressKey(),data);}
  function lessonKey(classId,subjectId,index){return classId+'|'+subjectId+'|'+index;}
  function isDone(classId,subjectId,index){return !!readProgress()[lessonKey(classId,subjectId,index)];}
  function toggleDone(classId,subjectId,index){var p=readProgress(),key=lessonKey(classId,subjectId,index);if(p[key])delete p[key];else p[key]=true;writeProgress(p);}
  function markDone(classId,subjectId,index){var key=lessonKey(classId,subjectId,index),p=readProgress();p[key]=true;writeProgress(p);try{window.dispatchEvent(new CustomEvent('nexora:lesson-completed',{detail:{source_key:key,class_id:classId,subject_id:subjectId,lesson_index:index}}));}catch(_e){window.nxLog&&window.nxLog(_e)}}
  function answerFor(key){return String(readStore(answersKey())[key]||'');}
  function saveAnswer(key,value){var all=readStore(answersKey());all[key]=String(value||'');writeStore(answersKey(),all);}
  function masteryFor(key){return String(readStore(masteryKey())[key]||'');}
  function saveMastery(key,value){var all=readStore(masteryKey());all[key]=String(value||'');writeStore(masteryKey(),all);}
  function countLessons(cl){return (cl.subjects||[]).reduce(function(n,s){return n+(s.lessons||[]).length;},0);}
  function countDone(cl){var p=readProgress(),n=0;(cl.subjects||[]).forEach(function(s){(s.lessons||[]).forEach(function(_l,i){if(p[lessonKey(cl.id,s.id,i)])n++;});});return n;}
  function overall(){var total=0,done=0;DATA.forEach(function(cl){if(cl.available===false)return;total+=countLessons(cl);done+=countDone(cl);});return {total:total,done:done,pct:total?Math.round(done*100/total):0};}

  function levelLabel(cl){
    if(cl.id==='cp1'||cl.id==='cp2')return 'Initiation';
    if(cl.id==='ce1'||cl.id==='ce2')return 'Approfondissement';
    if(cl.id==='cm1')return 'Consolidation';
    if(cl.id==='cm2')return 'Maîtrise et préparation à la 7ème année';
    return 'Consolidation';
  }
  function objectiveFor(lesson){
    var s=String(lesson.summary||'').trim();
    if(!s)return 'Comprendre et appliquer la notion étudiée.';
    return 'À la fin de la séance, l’élève doit pouvoir '+s.charAt(0).toLowerCase()+s.slice(1);
  }
  function prerequisiteFor(cl,sub){
    if(cl.id==='cp1')return 'Savoir écouter une consigne courte, observer attentivement, nommer ce que l’on voit et répondre oralement.';
    if(cl.id==='cp2')return 'Mobiliser les acquis essentiels de la 1ère année, lire ou écouter une consigne simple et expliquer une première réponse.';
    if(cl.id==='ce1')return 'Mobiliser les acquis de la 2ème année, lire une consigne en plusieurs étapes et donner un exemple simple.';
    if(cl.id==='ce2')return 'Mobiliser les acquis du CE1, reformuler la consigne et justifier une démarche courte.';
    if(cl.id==='cm1')return 'Mobiliser les acquis du CE2, lire une consigne plus longue et être capable de justifier une démarche.';
    if(cl.id==='cm2')return 'Mobiliser les acquis du CM1, analyser une consigne complexe, organiser plusieurs étapes et vérifier une réponse.';
    return 'Réactiver les connaissances antérieures et être capable de justifier une réponse.';
  }
  function discoveryFor(cl,sub,lesson){
    var place=cl.id==='cp1'||cl.id==='cp2'?'la maison, la cour ou la classe':'la classe, le quartier ou une situation de la vie quotidienne en Guinée';
    if(sub.id==='francais')return 'Lis ou écoute le titre « '+lesson.title+' ». Cherche ensuite un mot, une phrase ou une situation de '+place+' qui peut servir d’exemple.';
    if(sub.id==='maths'||sub.id==='calcul')return 'Imagine une petite situation avec des graines, des cahiers, des fruits ou de la monnaie. Demande-toi : quelles informations sont connues et qu’est-ce qu’il faut trouver ?';
    if(sub.id==='sciences')return 'Observe un objet, un être vivant ou un phénomène lié à la leçon. Décris seulement ce que tu vois avant de chercher une explication.';
    if(sub.id==='histoire')return 'Demande-toi : de quelle époque parle-t-on, quels sont les faits importants et dans quel ordre se produisent-ils ?';
    if(sub.id==='geographie')return 'Pars d’un lieu connu : maison, école, quartier, village, ville ou région. Localise-le puis décris ce qui l’entoure.';
    if(sub.id==='ecm')return 'Imagine une scène réelle dans la famille, à l’école ou dans la communauté. Quel comportement est juste, respectueux et utile à tous ?';
    return 'Observe d’abord la démonstration, prépare le matériel et vérifie que l’espace est sûr avant de commencer.';
  }
  function exampleFor(sub,lesson){
    if(EXAMPLES[lesson.title])return EXAMPLES[lesson.title];
    var task=String(lesson.exercise||'').trim();
    if(sub.id==='francais')return 'Exemple travaillé pour « '+lesson.title+' » : l’élève lit ou écoute un court support, repère précisément l’élément demandé, explique la règle avec ses mots, puis produit une réponse complète. Mise en application : '+task;
    if(sub.id==='maths'||sub.id==='calcul')return 'Exemple travaillé pour « '+lesson.title+' » : l’élève relève les données utiles, représente la situation avec un dessin, des graines, un tableau ou une droite graduée, choisit l’opération, calcule et vérifie l’unité. Mise en application : '+task;
    if(sub.id==='sciences')return 'Exemple travaillé pour « '+lesson.title+' » : observer un élément du milieu, relever au moins deux caractéristiques, formuler une question, expliquer le phénomène avec le vocabulaire de la leçon, puis proposer une application utile. Mise en application : '+task;
    if(sub.id==='histoire')return 'Exemple travaillé pour « '+lesson.title+' » : placer le fait sur une frise, identifier les acteurs et les lieux, raconter les événements dans l’ordre, puis expliquer une cause, une conséquence ou son importance. Mise en application : '+task;
    if(sub.id==='geographie')return 'Exemple travaillé pour « '+lesson.title+' » : localiser le lieu, décrire le milieu, utiliser des repères ou une légende, puis relier les caractéristiques observées aux activités humaines. Mise en application : '+task;
    if(sub.id==='ecm')return 'Exemple travaillé pour « '+lesson.title+' » : analyser une situation réelle, identifier la règle ou la valeur concernée, comparer deux comportements et choisir l’action qui protège les personnes et le bien commun. Mise en application : '+task;
    return 'Exemple travaillé pour « '+lesson.title+' » : observer le modèle, préparer le matériel et l’espace, réaliser l’activité étape par étape, contrôler la sécurité, puis recommencer en améliorant un point précis. Mise en application : '+task;
  }
  function guidedPracticeFor(sub,lesson){
    var task=String(lesson.exercise||'').trim();
    if(sub.id==='francais')return 'Avec l’aide d’un adulte ou d’un camarade, traite d’abord une partie de la consigne suivante : '+task+' Explique ce que tu repères, puis relis la réponse pour vérifier le sens, la ponctuation et l’orthographe étudiée.';
    if(sub.id==='maths'||sub.id==='calcul')return 'Commence la consigne avec de petits nombres ou des objets : '+task+' Dis à voix haute les quatre étapes : données, représentation, opération et vérification.';
    if(sub.id==='sciences')return 'Réalise une première observation liée à la consigne : '+task+' Note ce que tu vois réellement, classe les éléments, puis formule une conclusion courte.';
    if(sub.id==='histoire')return 'Prépare une mini-frise avant de répondre à la consigne : '+task+' Place trois repères — avant, pendant et après — puis raconte le fait principal.';
    if(sub.id==='geographie')return 'Dessine un croquis très simple avant de traiter la consigne : '+task+' Ajoute un titre, deux repères et une légende.';
    if(sub.id==='ecm')return 'Joue ou raconte la situation de la consigne : '+task+' Compare deux comportements et justifie celui qui respecte la règle, la sécurité et la dignité de chacun.';
    return 'Réalise une première fois la consigne avec aide : '+task+' Observe le résultat, corrige un geste ou une étape, puis recommence seul.';
  }
  function hintFor(sub,lesson){
    if(sub.id==='francais')return 'Relis la consigne. Cherche d’abord le mot, la règle ou la structure étudiée, puis réponds avec une phrase complète.';
    if(sub.id==='maths'||sub.id==='calcul')return 'Souligne les nombres utiles, représente la situation, choisis l’opération et vérifie si le résultat est raisonnable.';
    if(sub.id==='sciences')return 'Commence par ce que tu observes réellement. Utilise ensuite les mots de la leçon pour expliquer.';
    if(sub.id==='histoire')return 'Cherche les repères de temps, les acteurs, le fait principal et son importance.';
    if(sub.id==='geographie')return 'Pense à la localisation, au relief ou au milieu, puis aux activités des habitants.';
    if(sub.id==='ecm')return 'Demande-toi quel comportement respecte les personnes, les règles, la sécurité et les biens communs.';
    return 'Travaille lentement, respecte la sécurité et compare ton résultat au modèle ou à la consigne.';
  }
  function correctionFor(sub,lesson){
    if(CORRECTIONS[lesson.title])return CORRECTIONS[lesson.title];
    var task=String(lesson.exercise||'').trim();
    var base='La réponse doit traiter exactement la consigne suivante : '+task+' Elle doit montrer que l’élève a compris ceci : '+lesson.summary;
    if(sub.id==='francais')return base+' Vérifie la compréhension, la construction des phrases, la ponctuation, l’orthographe étudiée et la lisibilité.';
    if(sub.id==='maths'||sub.id==='calcul')return base+' Le raisonnement doit présenter les données utiles, la représentation ou l’opération choisie, le calcul, l’unité et une vérification.';
    if(sub.id==='sciences')return base+' La correction doit s’appuyer sur des observations réelles, employer des mots scientifiques simples et se terminer par une conclusion.';
    if(sub.id==='histoire')return base+' Il faut respecter l’ordre chronologique, citer les acteurs ou lieux utiles et expliquer au moins un lien de cause, de conséquence ou d’importance.';
    if(sub.id==='geographie')return base+' Il faut localiser, décrire, utiliser les repères ou la légende nécessaires et expliquer le lien entre le milieu et les activités.';
    if(sub.id==='ecm')return base+' La réponse doit proposer un comportement responsable, pacifique, honnête et respectueux des droits, des devoirs et du bien commun.';
    return base+' Le résultat doit respecter la consigne, les règles de sécurité, les étapes de réalisation et le soin attendu.';
  }
  function stepsFor(cl,sub,lesson){
    var summary=lesson.summary;
    if(sub.id==='francais')return [
      {t:'J’écoute ou je lis',p:'Découvre la notion à partir d’un exemple court. Lis lentement ou écoute jusqu’à la fin sans interrompre.'},
      {t:'Je repère',p:'Cherche dans l’exemple les sons, mots, groupes ou signes utiles à la leçon « '+lesson.title+' ».'},
      {t:'Je comprends la règle',p:summary+' Reformule cette idée avec tes propres mots avant de continuer.'},
      {t:'Je produis',p:'Dis, lis ou écris un nouvel exemple. Relis ensuite pour vérifier le sens, la ponctuation et la présentation.'}
    ];
    if(sub.id==='maths'||sub.id==='calcul')return [
      {t:'Je comprends le problème',p:'Lis la situation. Repère les données connues, la question et l’unité demandée.'},
      {t:'Je représente',p:'Utilise des graines, des bâtonnets, un dessin, un tableau ou une droite graduée pour voir la situation.'},
      {t:'Je calcule',p:summary+' Écris clairement l’opération et effectue-la étape par étape.'},
      {t:'Je vérifie',p:'Relis la question, contrôle le calcul par estimation ou opération inverse, puis rédige une phrase-réponse.'}
    ];
    if(sub.id==='sciences')return [
      {t:'J’observe',p:'Regarde attentivement l’objet, l’être vivant ou le phénomène. Note ses caractéristiques sans inventer.'},
      {t:'Je questionne et je classe',p:'Compare, nomme, regroupe ou mesure les éléments observés. Pose une question simple sur leur fonctionnement.'},
      {t:'J’explique',p:summary+' Relie l’observation à une cause, une fonction ou une conséquence.'},
      {t:'J’applique',p:'Propose un geste utile pour la santé, l’environnement, la sécurité ou la vie quotidienne.'}
    ];
    if(sub.id==='histoire')return [
      {t:'Je situe dans le temps',p:'Place la leçon sur une frise et distingue ce qui se passe avant, pendant et après.'},
      {t:'J’identifie les faits',p:'Repère les lieux, les personnages, les peuples ou les événements importants.'},
      {t:'J’explique',p:summary+' Cherche au moins une cause et une conséquence ou une importance historique.'},
      {t:'Je raconte avec ordre',p:'Présente les faits dans l’ordre chronologique avec des phrases courtes et précises.'}
    ];
    if(sub.id==='geographie')return [
      {t:'Je localise',p:'Repère le lieu sur une carte, un plan ou dans l’espace proche. Utilise les points cardinaux si nécessaire.'},
      {t:'Je décris',p:'Observe relief, eau, végétation, habitat, population ou voies de communication.'},
      {t:'J’explique',p:summary+' Relie les caractéristiques du milieu aux activités des habitants.'},
      {t:'Je représente',p:'Réalise un croquis simple avec un titre, des symboles et une légende.'}
    ];
    if(sub.id==='ecm')return [
      {t:'J’observe une situation',p:'Lis ou joue une scène de la vie à l’école, dans la famille ou dans la communauté.'},
      {t:'J’identifie la valeur ou la règle',p:'Repère ce qui concerne le respect, la responsabilité, la justice, la paix ou la sécurité.'},
      {t:'Je choisis le bon comportement',p:summary+' Explique pourquoi ce choix protège les personnes et l’intérêt commun.'},
      {t:'Je m’engage',p:'Formule une action concrète que tu peux appliquer dès aujourd’hui.'}
    ];
    return [
      {t:'Je me prépare',p:'Prépare le matériel, dégage l’espace et écoute les règles de sécurité.'},
      {t:'J’observe la démonstration',p:'Regarde le geste, le rythme, la forme ou l’organisation avant d’essayer.'},
      {t:'Je pratique',p:summary+' Réalise l’activité lentement puis répète-la.'},
      {t:'Je m’améliore',p:'Compare ton résultat à la consigne, corrige un point précis et recommence.'}
    ];
  }
  function lessonPlan(cl,sub,lesson){
    var meta=SUBJECT_META[sub.id]||SUBJECT_META.francais;
    var custom=lesson.plan||{};
    return {
      theme:custom.theme||primaryThemeFor(sub,lesson),
      introduction:custom.introduction||('Aujourd’hui, nous allons étudier « '+primaryThemeFor(sub,lesson)+' ». '+String(lesson.summary||'')),
      definition:custom.definition||primaryThemeDefinition(lesson),
      importance:custom.importance||('Cette leçon aide l’élève à comprendre et à utiliser « '+primaryThemeFor(sub,lesson)+' » dans une situation concrète.'),
      notions:Array.isArray(custom.notions)&&custom.notions.length?custom.notions:primaryNotionsFor(lesson),
      level:custom.level||levelLabel(cl),
      duration:custom.duration||meta.duration,
      material:custom.material||meta.material,
      method:custom.method||meta.method,
      objective:custom.objective||objectiveFor(lesson),
      prerequisite:custom.prerequisite||prerequisiteFor(cl,sub),
      discovery:custom.discovery||discoveryFor(cl,sub,lesson),
      steps:Array.isArray(custom.steps)&&custom.steps.length?custom.steps:stepsFor(cl,sub,lesson),
      example:custom.example||exampleFor(sub,lesson),
      guided:custom.guided||guidedPracticeFor(sub,lesson),
      exercise:custom.exercise||lesson.exercise,
      hint:custom.hint||hintFor(sub,lesson),
      correction:custom.correction||correctionFor(sub,lesson),
      trace:custom.trace||('Je retiens : '+lesson.summary),
      adultTip:custom.adultTip||'Laisse d’abord l’enfant chercher. Pose des questions courtes et ne montre la correction qu’après un véritable essai.'
    };
  }

  function hero(kicker,heading,copy,progress){progress=progress||overall();return '<section class="nx-primary-hero-v145"><small>'+esc(kicker)+'</small><h3>'+esc(heading)+'</h3><p>'+esc(copy)+'</p><div class="nx-primary-progress-v145"><div class="nx-primary-progress-track-v145"><i style="width:'+progress.pct+'%"></i></div><b>'+progress.done+'/'+progress.total+' terminée(s)</b></div></section>';}
  function breadcrumb(items){return '<nav class="nx-primary-breadcrumb-v145" aria-label="Navigation">'+items.map(function(item,i){var body=item.action?'<button type="button" data-nx-primary-action="'+esc(item.action)+'">'+esc(item.label)+'</button>':esc(item.label);return (i?'<i>›</i>':'')+body;}).join('')+'</nav>';}
  function primaryClassMeta(id){return ({cp1:{icon:'🌱',focus:'Découverte guidée'},cp2:{icon:'📘',focus:'Lecture et calcul'},ce1:{icon:'🧠',focus:'Premiers raisonnements'},ce2:{icon:'📚',focus:'Parcours renforcé'},cm1:{icon:'🚀',focus:'Consolidation'},cm2:{icon:'🎯',focus:'Préparation à la 7ème'}}[id])||{icon:'📘',focus:'Progression'};}

  function renderClasses(){
    cp1StopGuide();cp1StopMelody();
    state.view='classes';state.classId='';state.subjectId='';title('École primaire');resetPrimaryScroll();
    var o=overall();
    var totalClasses=DATA.filter(function(cl){return cl.available!==false;}).length;
    var cards=DATA.map(function(cl){
      var available=cl.available!==false,total=countLessons(cl),done=countDone(cl),pct=total?Math.round(done*100/total):0,meta=primaryClassMeta(cl.id);
      return '<button type="button" class="nx-primary-class-card-v158" data-class="'+esc(cl.id)+'" '+(available?'data-nx-primary-action="class" data-class-id="'+esc(cl.id)+'"':'disabled aria-disabled="true"')+'><span class="nx-primary-class-head-v158"><span class="nx-primary-class-chip-v158"><i>'+esc(meta.icon)+'</i>'+esc(cl.official)+'</span><span class="nx-primary-class-status-v158">'+(available?(pct+' % terminé'):'Bientôt')+'</span></span><h4>'+esc(cl.title)+'</h4><p>'+esc(cl.intro)+'</p><span class="nx-primary-class-meta-v158"><span>Âge : '+esc(cl.age)+'</span><span>'+esc(String(cl.subjects.length))+' matières</span><span>'+esc(meta.focus)+'</span></span><span class="nx-primary-class-progress-v158"><strong><span>'+done+'/'+total+' leçons terminées</span><span>'+pct+'%</span></strong><i style="--pct:'+pct+'%"></i></span><span class="nx-primary-class-cta-v158"><span>'+(available?'Ouvrir la classe et choisir une matière':'Programme en préparation')+'</span><b>'+(available?'Entrer →':'…')+'</b></span></button>';
    }).join('');
    var s=stage();
    if(s)s.innerHTML='<section class="nx-primary-classboard-v158"><section class="nx-primary-class-hero-v158"><span class="nx-primary-class-kicker-v158"><i>🏫</i>Programme primaire guinéen</span><h3>Un programme complet du CP1 au CM2</h3><p>Chaque leçon définit son thème, l’explique en cinq moments, puis propose un exercice et sa correction. La 4ème année bénéficie du parcours renforcé V519.</p><div class="nx-primary-class-stats-v158"><span><b>'+totalClasses+'</b><small>classes disponibles du CP1 au CM2</small></span><span><b>'+o.total+'</b><small>leçons guidées avec images, son et répétition</small></span><span><b>'+o.done+'</b><small>leçons déjà terminées dans la progression actuelle</small></span></div></section><div class="nx-primary-class-grid-v158">'+cards+'</div></section>';
  }
  /* V463 : les 7 matières rangées en 4 domaines, identiques du CP1 au CM2.
     Un parent qui ouvre une classe voit d'abord ce que l'enfant apprend,
     pas une grille de sept vignettes de même poids. */
  var PRIMARY_DOMAINS_V463=[
    {id:'langue', name:'Lire, dire et écrire', why:'La langue française : parler, lire, écrire.', subjects:['entretien','francais']},
    {id:'nombres', name:'Compter et raisonner', why:'Les nombres, les mesures et la résolution de problèmes.', subjects:['calcul']},
    {id:'monde', name:'Découvrir le monde', why:'Observer la nature, situer la Guinée dans le temps et l’espace.', subjects:['sciences','histoire','geographie']},
    {id:'ensemble', name:'Vivre ensemble et s’exprimer', why:'Les règles de la vie commune, le corps, le chant et les arts.', subjects:['ecm','arts','eps','arts-eps']}
  ];
  function primaryDomainsFor_v463(cl){
    var used={};
    var groups=PRIMARY_DOMAINS_V463.map(function(dom){
      var list=(cl.subjects||[]).filter(function(sub){
        if(dom.subjects.indexOf(sub.id)<0)return false;
        used[sub.id]=true;return true;
      });
      return {def:dom,subjects:list};
    }).filter(function(g){return g.subjects.length;});
    var restes=(cl.subjects||[]).filter(function(sub){return !used[sub.id];});
    if(restes.length)groups.push({def:{id:'autres',name:'Autres enseignements',why:''},subjects:restes});
    return groups;
  }
  function renderSubjects(){
    cp1StopGuide();
    var cl=classById(state.classId);if(!cl){renderClasses();return;}
    state.view='subjects';state.subjectId='';title(cl.title+' · '+cl.official);resetPrimaryScroll();
    var total=countLessons(cl),done=countDone(cl),pct=total?Math.round(done*100/total):0;
    if(cl.id==='cp1'||cl.id==='cp2'||cl.id==='ce1'||cl.id==='ce2'||cl.id==='cm1'||cl.id==='cm2'){
      var subjectCard=function(sub){
        var completed=(sub.lessons||[]).filter(function(_l,i){return isDone(cl.id,sub.id,i);}).length,spct=sub.lessons.length?Math.round(completed*100/sub.lessons.length):0,meta=cp1SubjectMeta(sub.id);
        return '<button type="button" class="nx-cp1-subject-card-v150" data-subject="'+esc(sub.id)+'" data-nx-primary-action="subject" data-subject-id="'+esc(sub.id)+'"><span class="nx-cp1-subject-top-v150"><span class="nx-cp1-subject-icon-v150">'+esc(meta.icon)+'</span><span class="nx-cp1-subject-ring-v150" style="--progress:'+spct+'%"><b>'+spct+'%</b></span></span><h4>'+esc(sub.name)+'</h4><p>'+esc(meta.short)+'</p><span class="nx-cp1-subject-foot-v150"><span>'+completed+'/'+sub.lessons.length+' leçons</span><strong>'+(completed?'Continuer →':'Commencer →')+'</strong></span></button>';
      };
      var cards=primaryDomainsFor_v463(cl).map(function(g){
        var lecons=0,faites=0;
        g.subjects.forEach(function(sub){
          lecons+=(sub.lessons||[]).length;
          faites+=(sub.lessons||[]).filter(function(_l,i){return isDone(cl.id,sub.id,i);}).length;
        });
        return '<section class="nx-primary-domain-v463">'
          +'<header><div><b>'+esc(g.def.name)+'</b>'+(g.def.why?'<i>'+esc(g.def.why)+'</i>':'')+'</div>'
          +'<u>'+faites+' / '+lecons+' leçons</u></header>'
          +'<div class="nx-primary-domain-grid-v463">'+g.subjects.map(subjectCard).join('')+'</div>'
          +'</section>';
      }).join('');
      var s=stage();if(s)s.innerHTML=breadcrumb([{label:'École primaire',action:'classes'},{label:cl.title}])+'<div class="nx-cp1-class-intro-v150"><section class="nx-cp1-class-main-v150"><small>Programme '+esc(cl.official)+' · '+esc(cl.age)+'</small><h3>Les matières de la '+esc(cl.title)+'</h3><p>Chaque matière possède son propre parcours. Nexora présente les images, prononce les mots et répète automatiquement chaque leçon trois fois avant le petit exercice final.</p><div class="nx-cp1-class-progress-v150"><i style="--pct:'+pct+'%"></i><b>'+done+'/'+total+' leçons terminées</b></div></section><aside class="nx-cp1-class-method-v150"><h4>Une séance guidée</h4><div class="nx-cp1-method-steps-v150"><span><b>1</b>La voix explique</span><span><b>2</b>L’enfant observe</span><span><b>3</b>La leçon passe 3 fois</span><span><b>4</b>Il touche la réponse</span></div></aside></div><div class="nx-primary-domains-v463">'+cards+'</div>';
      return;
    }
    var cards=(cl.subjects||[]).map(function(sub){var completed=(sub.lessons||[]).filter(function(_l,i){return isDone(cl.id,sub.id,i);}).length;return '<button type="button" class="nx-primary-card-v145" data-nx-primary-action="subject" data-subject-id="'+esc(sub.id)+'"><span class="nx-primary-card-top-v145"><span class="nx-primary-icon-v145">'+esc(sub.icon||'CO')+'</span><span class="nx-primary-status-v145">'+completed+'/'+sub.lessons.length+'</span></span><h4>'+esc(sub.name)+'</h4><p>'+esc(sub.intro||String(sub.lessons.length)+' séances structurées.')+'</p><strong>'+esc(String(sub.lessons.length))+' leçons</strong></button>';}).join('');
    var s=stage();if(s)s.innerHTML=breadcrumb([{label:'École primaire',action:'classes'},{label:cl.title}])+hero(cl.official+' · '+cl.age,cl.title,cl.intro,{total:total,done:done,pct:pct})+'<div class="nx-primary-grid-v145">'+cards+'</div>';
  }
  function renderLessons(){
    cp1StopGuide();cp1StopMelody();
    var cl=classById(state.classId),sub=subjectById(cl,state.subjectId);if(!cl||!sub){renderSubjects();return;}
    state.view='lessons';title(cl.title+' · '+sub.name);resetPrimaryScroll();
    var done=(sub.lessons||[]).filter(function(_l,i){return isDone(cl.id,sub.id,i);}).length,total=sub.lessons.length,pct=total?Math.round(done*100/total):0;
    if(cl.id==='cp1'||cl.id==='cp2'||cl.id==='ce1'||cl.id==='ce2'||cl.id==='cm1'||cl.id==='cm2'){
      var meta=cp1SubjectMeta(sub.id),resume=0;for(var r=0;r<total;r++){if(!isDone(cl.id,sub.id,r)){resume=r;break;}if(r===total-1)resume=0;}
      var phases=[{name:'Je découvre',from:0,to:Math.ceil(total/3)},{name:'Je m’entraîne',from:Math.ceil(total/3),to:Math.ceil(total*2/3)},{name:'Je consolide',from:Math.ceil(total*2/3),to:total}];
      var groups=phases.map(function(phase){var rows=(sub.lessons||[]).slice(phase.from,phase.to).map(function(lesson,offset){var i=phase.from+offset,completed=isDone(cl.id,sub.id,i);return '<button type="button" class="nx-cp1-lesson-row-v150 '+(completed?'done':'')+'" data-subject="'+esc(sub.id)+'" data-nx-primary-action="lesson" data-lesson-index="'+i+'"><span class="nx-cp1-lesson-number-v150">'+(completed?'✓':(i+1))+'</span><span><small>'+esc(lesson.rubric||meta.eyebrow)+'</small><h4>'+esc(lesson.title)+'</h4><em>Thème défini : '+esc(primaryThemeFor(sub,lesson))+'</em></span><strong>›</strong></button>';}).join('');return rows?'<div class="nx-cp1-phase-title-v150">'+esc(phase.name)+'</div><div class="nx-cp1-lesson-list-v150">'+rows+'</div>':'';}).join('');
      var s=stage();if(s)s.innerHTML=breadcrumb([{label:'École primaire',action:'classes'},{label:cl.title,action:'subjects'},{label:sub.name}])+'<section class="nx-cp1-route-hero-v150" data-subject="'+esc(sub.id)+'"><div class="nx-cp1-route-head-v150"><span class="nx-cp1-subject-icon-v150">'+esc(meta.icon)+'</span><div><small>'+esc(meta.eyebrow)+'</small><h3>'+esc(sub.name)+'</h3></div></div><p>'+esc(sub.intro)+' Chaque leçon annonce et définit son thème, montre une représentation exacte et prononce le mot clairement après avoir demandé à l’enfant d’écouter attentivement.</p><div class="nx-cp1-route-actions-v150"><button type="button" data-nx-primary-action="lesson" data-lesson-index="'+resume+'">'+(done?'Continuer le parcours':'Commencer la première leçon')+'</button><span>'+done+'/'+total+' leçons · '+pct+' % terminé</span></div></section>'+groups;
      return;
    }
    var rows=(sub.lessons||[]).map(function(lesson,i){var completed=isDone(cl.id,sub.id,i);return '<button type="button" class="nx-primary-lesson-row-v145 '+(completed?'done':'')+'" data-nx-primary-action="lesson" data-lesson-index="'+i+'"><span class="nx-primary-lesson-number-v145">'+(completed?'✓':(i+1))+'</span><span>'+(lesson.rubric?'<small class="nx-primary-rubric-v148">'+esc(lesson.rubric)+'</small>':'')+'<h4>'+esc(lesson.title)+'</h4><p>'+esc(lesson.summary)+'</p></span><span>›</span></button>';}).join('');
    var s=stage();if(s)s.innerHTML=breadcrumb([{label:'École primaire',action:'classes'},{label:cl.title,action:'subjects'},{label:sub.name}])+hero(cl.title+' · '+cl.official,sub.name,sub.intro,{total:total,done:done,pct:pct})+'<div class="nx-primary-list-v145">'+rows+'</div>';
  }
  function renderLesson(){
    var cl=classById(state.classId),sub=subjectById(cl,state.subjectId),lesson=sub&&sub.lessons[state.lessonIndex];
    if(!cl||!sub||!lesson){renderLessons();return;}
    if(cl.id==='cp1'||cl.id==='cp2'||cl.id==='ce1'||cl.id==='ce2'||cl.id==='cm1'||cl.id==='cm2'){renderCp1VisualLesson(cl,sub,lesson);return;}
    cp1StopGuide();state.view='lesson';title(lesson.title);resetPrimaryScroll();
    var done=isDone(cl.id,sub.id,state.lessonIndex),next=state.lessonIndex<sub.lessons.length-1,key=lessonKey(cl.id,sub.id,state.lessonIndex);
    var plan=lessonPlan(cl,sub,lesson),mastery=masteryFor(key),saved=answerFor(key);
    var stepHtml=plan.steps.map(function(step,i){return '<section class="nx-primary-step-v147"><span class="nx-primary-step-number-v147">'+(i+1)+'</span><div class="nx-primary-step-copy-v147"><h4>'+esc(step.t)+'</h4><p>'+esc(step.p)+'</p></div></section>';}).join('');
    var s=stage();
    if(s)s.innerHTML=
      breadcrumb([{label:'École primaire',action:'classes'},{label:cl.title,action:'subjects'},{label:sub.name,action:'lessons'},{label:'Leçon '+(state.lessonIndex+1)}])+
      '<article class="nx-primary-lesson-v145">'+
        '<div class="nx-primary-lesson-kicker-v145"><span>'+esc(cl.official+' · '+sub.name+(lesson.rubric?' · '+lesson.rubric:''))+'</span><span>Leçon '+(state.lessonIndex+1)+'/'+sub.lessons.length+'</span></div>'+
        '<h3>'+esc(lesson.title)+'</h3>'+
        '<div class="nx-primary-session-meta-v147"><span><small>Niveau</small><b>'+esc(plan.level)+'</b></span><span><small>Durée conseillée</small><b>'+esc(plan.duration)+'</b></span><span><small>Matériel</small><b>'+esc(plan.material)+'</b></span></div>'+
        '<section class="nx-primary-objective-v147"><span class="label">Compétence visée</span><p>'+esc(plan.objective)+'</p></section>'+
        '<section class="nx-primary-box-v145"><h4>Avant de commencer</h4><p>'+esc(plan.prerequisite)+'</p></section>'+
        '<section class="nx-primary-warmup-v147"><h4>Situation de découverte</h4><p>'+esc(plan.discovery)+'</p></section>'+
        '<div class="nx-primary-lesson-section-title-v147">La leçon expliquée étape par étape</div>'+
        '<div class="nx-primary-steps-v147">'+stepHtml+'</div>'+
        '<section class="nx-primary-example-v147"><h4>Exemple guidé</h4><p>'+esc(plan.example)+'</p><p class="nx-primary-example-method-v147"><b>Entraînement avec aide :</b> '+esc(plan.guided)+'</p></section>'+
        '<section class="nx-primary-trace-v147"><b>À retenir dans le cahier</b><p>'+esc(plan.trace)+'</p></section>'+
        '<section class="nx-primary-exercise-v147"><h4>Exercice autonome</h4><p class="instruction">'+esc(plan.exercise)+'</p><textarea class="nx-primary-answer-v147" data-nx-primary-answer="'+esc(key)+'" placeholder="Écris ta réponse ici, ou note ce que l’élève a dit, dessiné ou réalisé.">'+esc(saved)+'</textarea><div class="nx-primary-exercise-tools-v147"><button type="button" data-nx-primary-action="toggle-hint">Afficher un indice</button><button type="button" data-nx-primary-action="toggle-correction">Voir la correction</button><button type="button" data-nx-primary-action="clear-answer">Effacer la réponse</button></div><div class="nx-primary-reveal-v147 hint" data-nx-primary-hint hidden><b>Indice :</b> '+esc(plan.hint)+'</div><div class="nx-primary-reveal-v147 correction" data-nx-primary-correction hidden><b>Correction ou critères de réussite :</b> '+esc(plan.correction)+'</div></section>'+
        '<section class="nx-primary-selfcheck-v147"><h4>Je vérifie ma compréhension</h4><p>Après l’exercice, choisis le niveau qui correspond réellement à ta compréhension.</p><div class="nx-primary-mastery-v147"><button type="button" data-nx-primary-action="mastery" data-level="review" class="'+(mastery==='review'?'active':'')+'">À revoir</button><button type="button" data-nx-primary-action="mastery" data-level="understood" class="'+(mastery==='understood'?'active':'')+'">J’ai compris</button><button type="button" data-nx-primary-action="mastery" data-level="mastered" class="'+(mastery==='mastered'?'active':'')+'">Je maîtrise</button></div></section>'+
        '<div class="nx-primary-actions-v145"><button type="button" data-nx-primary-action="lessons">Retour aux leçons</button><button type="button" class="primary '+(done?'done':'')+'" data-nx-primary-action="toggle-done">'+(done?'Leçon terminée ✓':'Terminer la leçon')+'</button></div>'+
        (next?'<div class="nx-primary-actions-v145"><button type="button" class="primary" data-nx-primary-action="next-lesson">Leçon suivante →</button></div>':'')+
        '<section class="nx-primary-adult-tip-v147"><b>Conseil au parent ou à l’enseignant</b><p>'+esc(plan.adultTip)+'</p></section>'+
      '</article>';
  }
  function render(){if(state.view==='classes')renderClasses();else if(state.view==='subjects')renderSubjects();else if(state.view==='lessons')renderLessons();else renderLesson();var body=viewer()&&viewer().querySelector('.nx-primary-body-v145');if(body)body.scrollTop=0;}
  function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var v=viewer();if(!v)return;state.previousOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';v.hidden=false;state.view='classes';renderClasses();var back=v.querySelector('[data-nx-primary-action="back"]');if(back)back.focus();}
  function close(){var v=viewer();if(!v)return;cp1StopGuide();cp1StopMelody();v.hidden=true;document.body.style.overflow=state.previousOverflow;state.view='classes';state.classId='';state.subjectId='';}
  function back(){if(state.view==='lesson'){state.view='lessons';renderLessons();}else if(state.view==='lessons'){state.view='subjects';renderSubjects();}else if(state.view==='subjects'){renderClasses();}else close();}
  function toggleReveal(selector,button,openText,closeText){var v=viewer(),box=v&&v.querySelector(selector);if(!box)return;box.hidden=!box.hidden;if(button)button.textContent=box.hidden?openText:closeText;}
  function primaryNotice(message){
    cp1SetStatus(message);
    try{if(typeof window.toast==='function')window.toast(message);}catch(_e){window.nxLog&&window.nxLog(_e)}
  }
  function primaryOpenZoom(){
    var v=viewer(),panel=v&&v.querySelector('[data-nx-primary-image-zoom]'),source=v&&v.querySelector('[data-nx-cp1-focus-art]');
    if(!panel||!source)return;
    var art=panel.querySelector('[data-nx-primary-image-zoom-art]'),label=panel.querySelector('[data-nx-primary-image-zoom-label]'),word=v.querySelector('[data-nx-cp1-focus-word]');
    if(art)art.innerHTML=source.innerHTML;
    if(label)label.textContent=word?word.textContent:'';
    panel.hidden=false;
    var closeButton=panel.querySelector('[data-nx-primary-action="cp1-zoom-close"]');if(closeButton)closeButton.focus();
  }
  function primaryCloseZoom(){
    var v=viewer(),panel=v&&v.querySelector('[data-nx-primary-image-zoom]');if(!panel)return;
    panel.hidden=true;
    var source=v.querySelector('[data-nx-cp1-focus-art]');if(source)source.focus();
  }

  document.addEventListener('input',function(event){
    var input=event.target&&event.target.closest?event.target.closest('[data-nx-primary-answer]'):null;
    if(!input)return;
    saveAnswer(input.getAttribute('data-nx-primary-answer')||'',input.value||'');
  },true);

  document.addEventListener('click',function(event){
    var target=event&&event.target;
    var btn=target&&target.closest?target.closest('[data-nx-primary-action]'):null;if(!btn)return;
    var action=btn.getAttribute('data-nx-primary-action');
    if(action==='close'){close();return;}
    if(action==='back'){back();return;}
    if(action==='classes'){renderClasses();return;}
    if(action==='class'){state.classId=btn.getAttribute('data-class-id')||'';renderSubjects();return;}
    if(action==='subjects'){renderSubjects();return;}
    if(action==='subject'){state.subjectId=btn.getAttribute('data-subject-id')||'';renderLessons();return;}
    if(action==='lessons'){renderLessons();return;}
    if(action==='lesson'){state.lessonIndex=Math.max(0,Number(btn.getAttribute('data-lesson-index')||0));renderLesson();return;}
    if(action==='cp1-speak'){cp1Speak(btn.getAttribute('data-speak')||'');return;}
    if(action==='cp1-zoom'){primaryOpenZoom();return;}
    if(action==='cp1-zoom-close'){primaryCloseZoom();return;}
    if(action==='cp1-melody-toggle'){cp1ToggleMelody();return;}
    if(action==='cp1-guide-toggle'){if(state.cp1Auto){cp1StopGuide();cp1SetStatus('La séance est en pause. Appuie sur Continuer quand l’enfant est prêt.');}else cp1StartGuide(true,true);return;}
    if(action==='cp1-guide-replay'){cp1ManualItem(0);return;}
    if(action==='cp1-guide-prev'){cp1ManualItem(-1);return;}
    if(action==='cp1-guide-next'){var ctxNext=cp1Context(),lastNext=ctxNext&&ctxNext.activity&&state.cp1ItemIndex>=ctxNext.activity.items.length-1;if(lastNext){cp1StopGuide();cp1ShowChallenge(state.cp1Token);}else cp1ManualItem(1);return;}
    if(action==='cp1-restart'){state.cp1ItemIndex=0;state.cp1Round=1;state.challengePassed=false;var challengeRestart=viewer()&&viewer().querySelector('[data-nx-cp1-challenge]'),successRestart=viewer()&&viewer().querySelector('[data-nx-cp1-success]');if(challengeRestart)challengeRestart.hidden=true;if(successRestart)successRestart.hidden=true;cp1StartGuide(false,false);return;}
    if(action==='cp1-answer'){
      var challenge=btn.closest('.nx-cp1-challenge-v150'),feedback=challenge&&challenge.querySelector('[data-nx-cp1-challenge-feedback]');
      if(btn.getAttribute('data-correct')==='1'){
        challenge.querySelectorAll('.nx-cp1-challenge-option-v150').forEach(function(x){x.disabled=true;x.classList.remove('wrong');});
        btn.classList.add('correct');
        var challengeMode=challenge.getAttribute('data-mode')||'image';
        if(feedback){feedback.textContent=challengeMode==='text'?'Bravo ! C’est le mot juste.':'Bravo ! C’est la bonne image.';feedback.className='nx-cp1-challenge-feedback-v150 success';}
        state.challengePassed=true;cp1SetPhase(4);cp1SetStatus('Première vérification réussie. Continue avec la leçon complète et l’exercice autonome.');
        var success=viewer()&&viewer().querySelector('[data-nx-cp1-success]');if(success)success.hidden=false;
        cp1Speak('Bravo ! C’est '+(btn.getAttribute('data-word')||'la bonne réponse')+'. Continue maintenant avec la leçon complète et l’exercice autonome.');
      }else{
        btn.classList.remove('wrong');void btn.offsetWidth;btn.classList.add('wrong');
        var textMode=challenge.getAttribute('data-mode')==='text';
        if(feedback){feedback.textContent=textMode?'Essaie encore. Relis ou réécoute l’explication.':'Essaie encore. Regarde bien les images.';feedback.className='nx-cp1-challenge-feedback-v150 error';}
        cp1Speak(textMode?'Essaie encore. Réécoute bien l’explication.':'Essaie encore. Regarde bien.');
      }
      return;
    }
    if(action==='toggle-hint'){toggleReveal('[data-nx-primary-hint]',btn,'Afficher un indice','Masquer l’indice');return;}
    if(action==='toggle-correction'){
      var correctionBox=viewer()&&viewer().querySelector('[data-nx-primary-correction]');
      var correctionArea=viewer()&&viewer().querySelector('[data-nx-primary-answer]');
      if(correctionBox&&correctionBox.hidden&&(!correctionArea||!String(correctionArea.value||'').trim())){primaryNotice('Écris d’abord une réponse ou une démarche avant d’afficher la correction.');if(correctionArea)correctionArea.focus();return;}
      toggleReveal('[data-nx-primary-correction]',btn,'Voir la correction','Masquer la correction');return;
    }
    if(action==='clear-answer'){
      var key=lessonKey(state.classId,state.subjectId,state.lessonIndex),area=viewer()&&viewer().querySelector('[data-nx-primary-answer]');
      saveAnswer(key,'');if(area){area.value='';area.focus();}return;
    }
    if(action==='mastery'){
      var key2=lessonKey(state.classId,state.subjectId,state.lessonIndex),level=btn.getAttribute('data-level')||'';
      saveMastery(key2,level);
      var group=btn.parentElement;if(group)group.querySelectorAll('button').forEach(function(x){x.classList.toggle('active',x===btn);});
      return;
    }
    if(action==='toggle-done'){
      if(isDone(state.classId,state.subjectId,state.lessonIndex)){toggleDone(state.classId,state.subjectId,state.lessonIndex);renderLesson();return;}
      var lessonKeyDone=lessonKey(state.classId,state.subjectId,state.lessonIndex),answerArea=viewer()&&viewer().querySelector('[data-nx-primary-answer]');
      var challengeBoxDone=viewer()&&viewer().querySelector('[data-nx-cp1-challenge]');
      if(challengeBoxDone&&!state.challengePassed){primaryNotice('Réussis d’abord la première vérification de la leçon.');challengeBoxDone.hidden=false;try{challengeBoxDone.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){window.nxLog&&window.nxLog(_e)}return;}
      if(!String(answerArea&&answerArea.value||answerFor(lessonKeyDone)).trim()){primaryNotice('Fais et écris d’abord l’exercice autonome.');if(answerArea)answerArea.focus();return;}
      if(!masteryFor(lessonKeyDone)){primaryNotice('Choisis ensuite ton niveau de compréhension : à revoir, compris ou maîtrisé.');return;}
      markDone(state.classId,state.subjectId,state.lessonIndex);renderLesson();return;
    }
    if(action==='next-lesson'){var cl=classById(state.classId),sub=subjectById(cl,state.subjectId);if(sub&&state.lessonIndex<sub.lessons.length-1){state.lessonIndex++;renderLesson();}return;}
  },true);

  document.addEventListener('keydown',function(event){
    var v=viewer();if(!v||v.hidden)return;
    var zoom=v.querySelector('[data-nx-primary-image-zoom]');
    if(event.key==='Escape'&&zoom&&!zoom.hidden){event.preventDefault();primaryCloseZoom();return;}
    var target=event.target;
    if((event.key==='Enter'||event.key===' ')&&target&&target.matches&&target.matches('[data-nx-cp1-focus-art]')){event.preventDefault();primaryOpenZoom();return;}
    if(event.key==='Escape'){event.preventDefault();back();}
  });
  window.NexoraPrimarySchoolV157={open:open,close:close,back:back};
})();

//# sourceURL=assets/js/nx-v157-primary-school-script.js

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
    return withAccess('modules',target,'Ouverture du primaire…',function(){
      return ensurePrimary().then(function(){return window.NexoraPrimarySchoolV157.open();});
    });
  }

  function openBac(target){
    return withAccess('modules',target,'Ouverture du BAC…',function(){
      if(!window.NexoraBac||typeof window.NexoraBac.open!=='function')throw new Error('Rubrique BAC non initialisée.');
      return window.NexoraBac.open();
    });
  }

  function openBrevet(target,section){
    return withAccess('modules',target,'Ouverture du Brevet…',function(){
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
    return withAccess('modules',target,'Ouverture de Devoir…',function(){
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
    if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('modules',openGranted);
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
function renderCourse(id,index){var s=subject(id),l=s&&s.lessons[index];if(!l)return renderLessons(id);state.subject=id;state.lesson=index;setHeader(s.name+' · Leçon '+(index+1));setBack(true);var done=isDone(s,index),z=l.sections||{},order=[['introduction','2','Introduction','p'],['historique','3','Origine ou historique','p'],['definition','4','Définition','p'],['developpement','5','Développement approfondi','p'],['fonctionnement','6','Fonctionnement','p'],['importance','7','Importance et objectifs','p'],['exemples','8','Exemples concrets','ol'],['retenir','9','À retenir','ul'],['exercices','10','Exercices d’application','ol']],body='';order.forEach(function(sec){var values=Array.isArray(z[sec[0]])?z[sec[0]].filter(Boolean):[];if(!values.length)return;body+='<h3><span class="nx7-section-num-v485">'+sec[1]+'</span>'+sec[2]+'</h3>';if(sec[3]==='p'){body+=values.map(function(v){return '<p>'+esc(v)+'</p>'}).join('')}else{var cls=sec[0]==='retenir'?' class="nx7-retain-v485"':(sec[0]==='exercices'?' class="nx7-exercises-v485"':'');body+='<'+sec[3]+cls+'>'+values.map(function(v){return '<li>'+esc(v)+'</li>'}).join('')+'</'+sec[3]+'>'}});if(!body){var text=String(l.lesson_text||l.course||''),paras=text.split(/\n\s*\n/).filter(Boolean);body=paras.map(function(p){return '<p>'+esc(p)+'</p>'}).join('')}main().innerHTML='<article class="nx7-course-v349" style="--s:'+esc(s.accent)+'"><header class="nx7-course-hero-v349"><small>7ème année · '+esc(s.name)+' · Leçon '+(index+1)+'/'+s.lessons.length+'</small><span class="nx7-kicker-v349">1. Thème</span><h2>'+esc(l.title)+'</h2><p>'+esc(l.chapter)+'</p><div class="nx7-course-tools-v349"><span>Leçon complète · 45 à 60 min</span><button type="button" data-nx7-action="speak">🔊 Écouter la leçon</button></div></header><section class="nx7-course-text-v349">'+body+'</section><nav class="nx7-nav-v349"><button type="button" data-nx7-action="lessons">← Toutes les leçons</button>'+(index>0?'<button type="button" data-nx7-action="previous">Précédente</button>':'')+'<button type="button" data-nx7-action="complete">'+(done?'✓ Leçon lue':'Marquer comme lue')+'</button>'+(index<s.lessons.length-1?'<button type="button" class="primary" data-nx7-action="next">Suivante →</button>':'<button type="button" class="primary" data-nx7-action="subjects">Choisir une matière</button>')+'</nav></article>';try{main().scrollIntoView({block:'start'})}catch(_e){window.nxLog&&window.nxLog(_e)} }
function openGranted(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){openGranted.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var v=viewer();if(!v)return false;state.lastFocus=document.activeElement;syncTheme();v.hidden=false;document.body.classList.add('nx7-open-v349');renderHome();setTimeout(function(){var c=q('[data-nx7-action="close"]',v);if(c)c.focus()},30);return true}
function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('modules',openGranted);return openGranted()}
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
function renderCourse(id,index){var s=subject(id),l=s&&s.lessons[index];if(!l)return renderLessons(id);state.subject=id;state.lesson=index;setHeader(s.name+' · Leçon '+(index+1));setBack(true);var done=isDone(s,index),z=l.sections||{},order=[['introduction','2','Introduction','p'],['historique','3','Origine ou historique','p'],['definition','4','Définition','p'],['developpement','5','Développement approfondi','p'],['fonctionnement','6','Fonctionnement','p'],['importance','7','Importance et objectifs','p'],['exemples','8','Exemples concrets','ol'],['retenir','9','À retenir','ul'],['exercices','10','Exercices d’application','ol']],body='';order.forEach(function(sec){var values=Array.isArray(z[sec[0]])?z[sec[0]].filter(Boolean):[];if(!values.length)return;body+='<h3><span class="nx7-section-num-v485">'+sec[1]+'</span>'+sec[2]+'</h3>';if(sec[3]==='p'){body+=values.map(function(v){return '<p>'+esc(v)+'</p>'}).join('')}else{var cls=sec[0]==='retenir'?' class="nx7-retain-v485"':(sec[0]==='exercices'?' class="nx7-exercises-v485"':'');body+='<'+sec[3]+cls+'>'+values.map(function(v){return '<li>'+esc(v)+'</li>'}).join('')+'</'+sec[3]+'>'}});if(!body){var text=String(l.lesson_text||l.course||''),paras=text.split(/\n\s*\n/).filter(Boolean);body=paras.map(function(p){return '<p>'+esc(p)+'</p>'}).join('')}main().innerHTML='<article class="nx7-course-v349" style="--s:'+esc(s.accent)+'"><header class="nx7-course-hero-v349"><small>8ème année · '+esc(s.name)+' · Leçon '+(index+1)+'/'+s.lessons.length+'</small><span class="nx7-kicker-v349">1. Thème</span><h2>'+esc(l.title)+'</h2><p>'+esc(l.chapter)+'</p><div class="nx7-course-tools-v349"><span>Leçon complète · 55 à 70 min</span><button type="button" data-nx8-action="speak">🔊 Écouter la leçon</button></div></header><section class="nx7-course-text-v349">'+body+'</section><nav class="nx7-nav-v349"><button type="button" data-nx8-action="lessons">← Toutes les leçons</button>'+(index>0?'<button type="button" data-nx8-action="previous">Précédente</button>':'')+'<button type="button" data-nx8-action="complete">'+(done?'✓ Leçon lue':'Marquer comme lue')+'</button>'+(index<s.lessons.length-1?'<button type="button" class="primary" data-nx8-action="next">Suivante →</button>':'<button type="button" class="primary" data-nx8-action="subjects">Choisir une matière</button>')+'</nav></article>';try{main().scrollIntoView({block:'start'})}catch(_e){window.nxLog&&window.nxLog(_e)} }
function openGranted(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){openGranted.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var v=viewer();if(!v)return false;state.lastFocus=document.activeElement;syncTheme();v.hidden=false;document.body.classList.add('nx7-open-v349');renderHome();setTimeout(function(){var c=q('[data-nx8-action="close"]',v);if(c)c.focus()},30);return true}
function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('modules',openGranted);return openGranted()}
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
function renderCourse(id,index){var s=subject(id),l=s&&s.lessons[index];if(!l)return renderLessons(id);state.subject=id;state.lesson=index;setHeader(s.name+' · Leçon '+(index+1));setBack(true);var done=isDone(s,index),z=l.sections||{},order=[['introduction','2','Introduction','p'],['historique','3','Origine ou historique','p'],['definition','4','Définition','p'],['developpement','5','Développement approfondi','p'],['fonctionnement','6','Fonctionnement','p'],['importance','7','Importance et objectifs','p'],['exemples','8','Exemples concrets','ol'],['retenir','9','À retenir','ul'],['exercices','10','Exercices d’application','ol']],body='';order.forEach(function(sec){var values=Array.isArray(z[sec[0]])?z[sec[0]].filter(Boolean):[];if(!values.length)return;body+='<h3><span class="nx7-section-num-v485">'+sec[1]+'</span>'+sec[2]+'</h3>';if(sec[3]==='p'){body+=values.map(function(v){return '<p>'+esc(v)+'</p>'}).join('')}else{var cls=sec[0]==='retenir'?' class="nx7-retain-v485"':(sec[0]==='exercices'?' class="nx7-exercises-v485"':'');body+='<'+sec[3]+cls+'>'+values.map(function(v){return '<li>'+esc(v)+'</li>'}).join('')+'</'+sec[3]+'>'}});if(!body){var text=String(l.lesson_text||l.course||''),paras=text.split(/\n\s*\n/).filter(Boolean);body=paras.map(function(p){return '<p>'+esc(p)+'</p>'}).join('')}main().innerHTML='<article class="nx7-course-v349" style="--s:'+esc(s.accent)+'"><header class="nx7-course-hero-v349"><small>9ème année · '+esc(s.name)+' · Leçon '+(index+1)+'/'+s.lessons.length+'</small><span class="nx7-kicker-v349">1. Thème</span><h2>'+esc(l.title)+'</h2><p>'+esc(l.chapter)+'</p><div class="nx7-course-tools-v349"><span>Leçon complète · 55 à 75 min</span><button type="button" data-nx9-action="speak">🔊 Écouter la leçon</button></div></header><section class="nx7-course-text-v349">'+body+'</section><nav class="nx7-nav-v349"><button type="button" data-nx9-action="lessons">← Toutes les leçons</button>'+(index>0?'<button type="button" data-nx9-action="previous">Précédente</button>':'')+'<button type="button" data-nx9-action="complete">'+(done?'✓ Leçon lue':'Marquer comme lue')+'</button>'+(index<s.lessons.length-1?'<button type="button" class="primary" data-nx9-action="next">Suivante →</button>':'<button type="button" class="primary" data-nx9-action="subjects">Choisir une matière</button>')+'</nav></article>';try{main().scrollIntoView({block:'start'})}catch(_e){window.nxLog&&window.nxLog(_e)} }
function openGranted(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){openGranted.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var v=viewer();if(!v)return false;state.lastFocus=document.activeElement;syncTheme();v.hidden=false;document.body.classList.add('nx7-open-v349');renderHome();setTimeout(function(){var c=q('[data-nx9-action="close"]',v);if(c)c.focus()},30);return true}
function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('modules',openGranted);return openGranted()}
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
function nxLyceeCorps_v472(l, c){
  function bloc(titre, contenu, cls){
    if(!contenu) return '';
    return '<div class="'+c+'-box'+(cls?' '+cls:'')+'"><b>'+esc(titre)+'</b><span>'+contenu+'</span></div>';
  }
  function liste(tab, puce){
    if(!Array.isArray(tab)||!tab.length) return '';
    return tab.map(function(x){return (puce||'')+esc(x)}).join('<br>');
  }
  var out='';

  if(l.definition) out+=bloc('Définition du thème', esc(l.definition), c+'-def');
  out+=bloc('Objectif de la leçon', esc(l.objective||'Comprendre et appliquer les notions essentielles de cette leçon.'));

  if(Array.isArray(l.plan)&&l.plan.length){
    out+='<div class="'+c+'-plan"><b class="'+c+'-plan-title">Le cours, point par point</b>'+
      l.plan.map(function(sec,k){
        return '<section class="'+c+'-sec"><h5><u>'+(k+1)+'</u>'+esc(sec[0])+'</h5><p>'+esc(sec[1])+'</p></section>';
      }).join('')+'</div>';
  } else {
    out+='<p>'+esc(l.p1||'')+'</p><p>'+esc(l.p2||'')+'</p><p>'+esc(l.p3||'')+'</p>';
  }

  out+=bloc('Formulaire à connaître', liste(l.formules,'▸ '), c+'-formul');
  out+=bloc('Notions essentielles', liste(l.key_points,'• '));
  out+=bloc('Erreurs fréquentes à éviter', liste(l.pieges,'✗ '), c+'-piege');
  if(l.example) out+=bloc('Exemple expliqué', esc(l.example));
  out+=bloc('Méthode de travail', esc(l.method||'Identifier les données, choisir la notion adaptée, raisonner par étapes et vérifier la réponse.'));

  if(Array.isArray(l.exercices)&&l.exercices.length){
    out+='<div class="'+c+'-exos"><b class="'+c+'-plan-title">Exercices d’application ('+l.exercices.length+')</b>'+
      l.exercices.map(function(ex,k){
        return '<section class="'+c+'-exo"><h5><u>'+(k+1)+'</u>Énoncé</h5><p>'+esc(ex.enonce)+'</p>'+
          '<details class="'+c+'-corr"><summary>Voir la correction détaillée</summary><p>'+esc(ex.correction)+'</p></details></section>';
      }).join('')+'</div>';
  } else {
    out+=bloc('Exercice d’application', esc(l.exercise||''));
    out+=bloc('Correction guidée', esc(l.correction||'La correction reprend les étapes du raisonnement et justifie clairement la réponse.'));
  }

  out+=bloc('À retenir', esc(l.recap||'Relire les notions essentielles et refaire l’exercice sans consulter la correction.'));
  return out;
}

function renderContent(){var x=DATA[state.subject],el=document.querySelector('[data-nx-eleventh-content-v368]');if(!x||!el)return;el.style.setProperty('--sc',x.color);el.innerHTML='<header class="nx-eleventh-subject-head-v368"><b>'+esc(x.abbr)+'</b><div><h3>'+esc(x.name)+'</h3><p>'+x.lessons.length+' leçons complètes · objectifs, méthodes et corrections guidées</p></div></header><div class="nx-eleventh-lessons-v368">'+x.lessons.map(function(l,i){var points=Array.isArray(l.key_points)?l.key_points.map(function(point){return '• '+esc(point)}).join('<br>'):'';return '<article class="nx-eleventh-lesson-v368" style="--sc:'+x.color+'"><button type="button" class="nx-eleventh-lesson-btn-v368" data-lesson-toggle aria-expanded="false"><span class="nx-eleventh-num-v368">'+(i+1)+'</span><strong>'+esc(l.title)+'</strong><i>›</i></button><div class="nx-eleventh-body-v368">'+nxLyceeCorps_v472(l,'nx-eleventh-v472')+'</div></article>'}).join('')+'</div>'}
function render(){renderStreams();renderSubjects();renderContent()}
function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var p=panel();if(!p)return;p.hidden=false;document.body.style.overflow='hidden';render();setTimeout(function(){p.scrollTop=0},0)}
function close(){var p=panel();if(!p)return;p.hidden=true;document.body.style.overflow=''}
document.addEventListener('click',function(e){var o=e.target.closest('[data-nx-open-eleventh-v368]');if(o){e.preventDefault();open();return}var c=e.target.closest('[data-nx-eleventh-close-v368]');if(c){e.preventDefault();close();return}var s=e.target.closest('[data-stream]');if(s&&panel()&&!panel().hidden){state.stream=s.getAttribute('data-stream');state.subject=available()[0];render();return}var b=e.target.closest('[data-subject]');if(b&&panel()&&!panel().hidden){state.subject=b.getAttribute('data-subject');renderSubjects();renderContent();return}var t=e.target.closest('[data-lesson-toggle]');if(t){var a=t.closest('.nx-eleventh-lesson-v368');if(a){a.classList.toggle('open');t.setAttribute('aria-expanded',a.classList.contains('open')?'true':'false')}}});
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
function nxLyceeCorps_v472(l, c){
  function bloc(titre, contenu, cls){
    if(!contenu) return '';
    return '<div class="'+c+'-box'+(cls?' '+cls:'')+'"><b>'+esc(titre)+'</b><span>'+contenu+'</span></div>';
  }
  function liste(tab, puce){
    if(!Array.isArray(tab)||!tab.length) return '';
    return tab.map(function(x){return (puce||'')+esc(x)}).join('<br>');
  }
  var out='';

  if(l.definition) out+=bloc('Définition du thème', esc(l.definition), c+'-def');
  out+=bloc('Objectif de la leçon', esc(l.objective||'Comprendre et appliquer les notions essentielles de cette leçon.'));

  if(Array.isArray(l.plan)&&l.plan.length){
    out+='<div class="'+c+'-plan"><b class="'+c+'-plan-title">Le cours, point par point</b>'+
      l.plan.map(function(sec,k){
        return '<section class="'+c+'-sec"><h5><u>'+(k+1)+'</u>'+esc(sec[0])+'</h5><p>'+esc(sec[1])+'</p></section>';
      }).join('')+'</div>';
  } else {
    out+='<p>'+esc(l.p1||'')+'</p><p>'+esc(l.p2||'')+'</p><p>'+esc(l.p3||'')+'</p>';
  }

  out+=bloc('Formulaire à connaître', liste(l.formules,'▸ '), c+'-formul');
  out+=bloc('Notions essentielles', liste(l.key_points,'• '));
  out+=bloc('Erreurs fréquentes à éviter', liste(l.pieges,'✗ '), c+'-piege');
  if(l.example) out+=bloc('Exemple expliqué', esc(l.example));
  out+=bloc('Méthode de travail', esc(l.method||'Identifier les données, choisir la notion adaptée, raisonner par étapes et vérifier la réponse.'));

  if(Array.isArray(l.exercices)&&l.exercices.length){
    out+='<div class="'+c+'-exos"><b class="'+c+'-plan-title">Exercices d’application ('+l.exercices.length+')</b>'+
      l.exercices.map(function(ex,k){
        return '<section class="'+c+'-exo"><h5><u>'+(k+1)+'</u>Énoncé</h5><p>'+esc(ex.enonce)+'</p>'+
          '<details class="'+c+'-corr"><summary>Voir la correction détaillée</summary><p>'+esc(ex.correction)+'</p></details></section>';
      }).join('')+'</div>';
  } else {
    out+=bloc('Exercice d’application', esc(l.exercise||''));
    out+=bloc('Correction guidée', esc(l.correction||'La correction reprend les étapes du raisonnement et justifie clairement la réponse.'));
  }

  out+=bloc('À retenir', esc(l.recap||'Relire les notions essentielles et refaire l’exercice sans consulter la correction.'));
  return out;
}

function renderContent(){var x=DATA[state.subject],el=document.querySelector('[data-nx-twelfth-content-v369]');if(!x||!el)return;el.style.setProperty('--sc',x.color);el.innerHTML='<header class="nx-twelfth-subject-head-v369"><b>'+esc(x.abbr)+'</b><div><h3>'+esc(x.name)+'</h3><p>'+x.lessons.length+' leçons complètes · objectifs, méthodes et corrections guidées</p></div></header><div class="nx-twelfth-lessons-v369">'+x.lessons.map(function(l,i){var points=Array.isArray(l.key_points)?l.key_points.map(function(point){return '• '+esc(point)}).join('<br>'):'';return '<article class="nx-twelfth-lesson-v369" style="--sc:'+x.color+'"><button type="button" class="nx-twelfth-lesson-btn-v369" data-nx-twelfth-lesson-v369 aria-expanded="false"><span class="nx-twelfth-num-v369">'+(i+1)+'</span><strong>'+esc(l.title)+'</strong><i>›</i></button><div class="nx-twelfth-body-v369">'+nxLyceeCorps_v472(l,'nx-twelfth-v472')+'</div></article>'}).join('')+'</div>'}
function render(){renderStreams();renderSubjects();renderContent()}
function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var p=panel();if(!p)return;p.hidden=false;document.body.style.overflow='hidden';render();setTimeout(function(){p.scrollTop=0},0)}
function close(){var p=panel();if(!p)return;p.hidden=true;document.body.style.overflow=''}
document.addEventListener('click',function(e){var o=e.target.closest('[data-nx-open-twelfth-v369]');if(o){e.preventDefault();open();return}var c=e.target.closest('[data-nx-twelfth-close-v369]');if(c){e.preventDefault();close();return}var s=e.target.closest('[data-nx-twelfth-stream-v369]');if(s&&panel()&&!panel().hidden){state.stream=s.getAttribute('data-nx-twelfth-stream-v369');state.subject=available()[0];render();return}var b=e.target.closest('[data-nx-twelfth-subject-v369]');if(b&&panel()&&!panel().hidden){state.subject=b.getAttribute('data-nx-twelfth-subject-v369');renderSubjects();renderContent();return}var t=e.target.closest('[data-nx-twelfth-lesson-v369]');if(t){var a=t.closest('.nx-twelfth-lesson-v369');if(a){a.classList.toggle('open');t.setAttribute('aria-expanded',a.classList.contains('open')?'true':'false')}}});
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
function nxLyceeCorps_v472(l, c){
  function bloc(titre, contenu, cls){
    if(!contenu) return '';
    return '<div class="'+c+'-box'+(cls?' '+cls:'')+'"><b>'+esc(titre)+'</b><span>'+contenu+'</span></div>';
  }
  function liste(tab, puce){
    if(!Array.isArray(tab)||!tab.length) return '';
    return tab.map(function(x){return (puce||'')+esc(x)}).join('<br>');
  }
  var out='';

  if(l.definition) out+=bloc('Définition du thème', esc(l.definition), c+'-def');
  out+=bloc('Objectif de la leçon', esc(l.objective||'Comprendre et appliquer les notions essentielles de cette leçon.'));

  if(Array.isArray(l.plan)&&l.plan.length){
    out+='<div class="'+c+'-plan"><b class="'+c+'-plan-title">Le cours, point par point</b>'+
      l.plan.map(function(sec,k){
        return '<section class="'+c+'-sec"><h5><u>'+(k+1)+'</u>'+esc(sec[0])+'</h5><p>'+esc(sec[1])+'</p></section>';
      }).join('')+'</div>';
  } else {
    out+='<p>'+esc(l.p1||'')+'</p><p>'+esc(l.p2||'')+'</p><p>'+esc(l.p3||'')+'</p>';
  }

  out+=bloc('Formulaire à connaître', liste(l.formules,'▸ '), c+'-formul');
  out+=bloc('Notions essentielles', liste(l.key_points,'• '));
  out+=bloc('Erreurs fréquentes à éviter', liste(l.pieges,'✗ '), c+'-piege');
  if(l.example) out+=bloc('Exemple expliqué', esc(l.example));
  out+=bloc('Méthode de travail', esc(l.method||'Identifier les données, choisir la notion adaptée, raisonner par étapes et vérifier la réponse.'));

  if(Array.isArray(l.exercices)&&l.exercices.length){
    out+='<div class="'+c+'-exos"><b class="'+c+'-plan-title">Exercices d’application ('+l.exercices.length+')</b>'+
      l.exercices.map(function(ex,k){
        return '<section class="'+c+'-exo"><h5><u>'+(k+1)+'</u>Énoncé</h5><p>'+esc(ex.enonce)+'</p>'+
          '<details class="'+c+'-corr"><summary>Voir la correction détaillée</summary><p>'+esc(ex.correction)+'</p></details></section>';
      }).join('')+'</div>';
  } else {
    out+=bloc('Exercice d’application', esc(l.exercise||''));
    out+=bloc('Correction guidée', esc(l.correction||'La correction reprend les étapes du raisonnement et justifie clairement la réponse.'));
  }

  out+=bloc('À retenir', esc(l.recap||'Relire les notions essentielles et refaire l’exercice sans consulter la correction.'));
  return out;
}

function renderContent(){var x=DATA[state.subject],el=document.querySelector('[data-nx-terminal-content-v475]');if(!x||!el)return;el.style.setProperty('--sc',x.color);el.innerHTML='<header class="nx-terminal-subject-head-v475"><b>'+esc(x.abbr)+'</b><div><h3>'+esc(x.name)+'</h3><p>'+x.lessons.length+' leçons complètes · objectifs, méthodes et corrections guidées</p></div></header><div class="nx-terminal-lessons-v475">'+x.lessons.map(function(l,i){var points=Array.isArray(l.key_points)?l.key_points.map(function(point){return '• '+esc(point)}).join('<br>'):'';return '<article class="nx-terminal-lesson-v475" style="--sc:'+x.color+'"><button type="button" class="nx-terminal-lesson-btn-v475" data-nx-terminal-lesson-v475 aria-expanded="false"><span class="nx-terminal-num-v475">'+(i+1)+'</span><strong>'+esc(l.title)+'</strong><i>›</i></button><div class="nx-terminal-body-v475">'+nxLyceeCorps_v472(l,'nx-terminal-v472')+'</div></article>'}).join('')+'</div>'}
function render(){renderStreams();renderSubjects();renderContent()}
function open(){var __nxArgs=arguments,__nxThis=this;if(!NX_READY){NX_LOAD().then(function(){open.apply(__nxThis,__nxArgs)},NX_FAIL);return;}var p=panel();if(!p)return;p.hidden=false;document.body.style.overflow='hidden';render();setTimeout(function(){p.scrollTop=0},0)}
function close(){var p=panel();if(!p)return;p.hidden=true;document.body.style.overflow=''}
document.addEventListener('click',function(e){var o=e.target.closest('[data-nx-open-terminal-v475]');if(o){e.preventDefault();open();return}var c=e.target.closest('[data-nx-terminal-close-v475]');if(c){e.preventDefault();close();return}var s=e.target.closest('[data-nx-terminal-stream-v475]');if(s&&panel()&&!panel().hidden){state.stream=s.getAttribute('data-nx-terminal-stream-v475');state.subject=available()[0];render();return}var b=e.target.closest('[data-nx-terminal-subject-v475]');if(b&&panel()&&!panel().hidden){state.subject=b.getAttribute('data-nx-terminal-subject-v475');renderSubjects();renderContent();return}var t=e.target.closest('[data-nx-terminal-lesson-v475]');if(t){var a=t.closest('.nx-terminal-lesson-v475');if(a){a.classList.toggle('open');t.setAttribute('aria-expanded',a.classList.contains('open')?'true':'false')}}});
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


