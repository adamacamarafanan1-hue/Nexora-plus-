
/* NEXORA V506.0 — fil étudiant chargé après authentification / à la demande */
/* ===== nexora-reliable-publication-v373 ===== */
(function(){
'use strict';
if(window.NexoraReliablePublicationV373)return;
function message(err){
  if(!err)return '';
  var parts=[err.message,err.details,err.hint,err.code,typeof err==='string'?err:''];
  return parts.filter(Boolean).join(' · ');
}
function isNetworkError(err){
  var m=message(err).toLowerCase();
  return m.indexOf('failed to fetch')>-1||m.indexOf('networkerror')>-1||m.indexOf('network request failed')>-1||m.indexOf('load failed')>-1||m.indexOf('fetch failed')>-1||m.indexOf('connection aborted')>-1||m.indexOf('connection reset')>-1||m.indexOf('timeout')>-1;
}
function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
async function retry(task,tries){
  tries=Math.max(1,Number(tries||3));
  var last=null;
  for(var i=0;i<tries;i++){
    try{return await task(i);}catch(err){
      last=err;
      if(!isNetworkError(err)||i===tries-1)throw err;
      await wait(650*(i+1));
    }
  }
  throw last||new Error('Connexion indisponible.');
}
async function sessionUser(client){
  if(!client||!client.auth)return null;
  var sessionResult=null;
  try{sessionResult=await client.auth.getSession();}catch(err){if(!isNetworkError(err))throw err;}
  var session=sessionResult&&sessionResult.data&&sessionResult.data.session;
  if(session&&session.user)return session.user;
  if(typeof client.auth.getUser==='function'){
    var userResult=await retry(function(){return client.auth.getUser();},2);
    if(userResult&&userResult.error)throw userResult.error;
    return userResult&&userResult.data&&userResult.data.user||null;
  }
  return null;
}
function loadImage(file){
  return new Promise(function(resolve,reject){
    var url='';
    try{
      url=URL.createObjectURL(file);
      var img=new Image();
      img.onload=function(){try{URL.revokeObjectURL(url);}catch(_e){window.nxLog&&window.nxLog(_e)}resolve(img);};
      img.onerror=function(){try{URL.revokeObjectURL(url);}catch(_e){window.nxLog&&window.nxLog(_e)}reject(new Error('Impossible de préparer cette photo.'));};
      img.src=url;
    }catch(err){if(url)try{URL.revokeObjectURL(url);}catch(_e){window.nxLog&&window.nxLog(_e)}reject(err);}
  });
}
function canvasBlob(canvas,type,quality){
  return new Promise(function(resolve,reject){
    try{canvas.toBlob(function(blob){blob?resolve(blob):reject(new Error('Compression de la photo impossible.'));},type,quality);}catch(err){reject(err);}
  });
}
async function prepareImage(file){
  if(!file)return null;
  var allowed=['image/jpeg','image/png','image/webp'];
  if(allowed.indexOf(String(file.type||'').toLowerCase())<0)throw new Error('Choisis une photo JPG, PNG ou WEBP.');
  if(Number(file.size||0)>12*1024*1024)throw new Error('La photo dépasse 12 Mo. Choisis une image plus légère.');
  try{
    var img=await loadImage(file),w=Number(img.naturalWidth||img.width||0),h=Number(img.naturalHeight||img.height||0);
    if(!w||!h)return {blob:file,mime:file.type||'image/jpeg',extension:String(file.type||'').toLowerCase()==='image/png'?'png':String(file.type||'').toLowerCase()==='image/webp'?'webp':'jpg'};
    var maxSide=1600,scale=Math.min(1,maxSide/Math.max(w,h)),tw=Math.max(1,Math.round(w*scale)),th=Math.max(1,Math.round(h*scale));
    var canvas=document.createElement('canvas');canvas.width=tw;canvas.height=th;
    var ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Préparation de la photo indisponible.');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,tw,th);ctx.drawImage(img,0,0,tw,th);
    var blob=await canvasBlob(canvas,'image/jpeg',.82);
    if(blob.size>2500000){blob=await canvasBlob(canvas,'image/jpeg',.67);}
    if(blob.size>2900000){
      var scale2=Math.min(1,1200/Math.max(w,h)),w2=Math.max(1,Math.round(w*scale2)),h2=Math.max(1,Math.round(h*scale2));
      canvas.width=w2;canvas.height=h2;ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w2,h2);ctx.drawImage(img,0,0,w2,h2);blob=await canvasBlob(canvas,'image/jpeg',.7);
    }
    if(blob.size>3000000)throw new Error('La photo reste trop lourde après optimisation. Choisis une autre image.');
    return {blob:blob,mime:'image/jpeg',extension:'jpg'};
  }catch(err){
    if(Number(file.size||0)<=2900000)return {blob:file,mime:file.type||'image/jpeg',extension:String(file.type||'').toLowerCase()==='image/png'?'png':String(file.type||'').toLowerCase()==='image/webp'?'webp':'jpg'};
    throw err;
  }
}
function friendly(err){
  var m=message(err),l=m.toLowerCase();
  if(isNetworkError(err))return 'Connexion à Supabase interrompue. Ton texte et ta photo sont conservés. Vérifie que le projet Supabase est actif, puis appuie de nouveau sur Publier.';
  if(l.indexOf('pgrst205')>-1||l.indexOf('42p01')>-1||l.indexOf('schema cache')>-1||l.indexOf('does not exist')>-1)return 'La table de publication n’est pas encore reconnue. Exécute le SQL V371 puis actualise l’application.';
  if(l.indexOf('jwt')>-1||l.indexOf('401')>-1||l.indexOf('not authenticated')>-1||l.indexOf('invalid claim')>-1)return 'Ta session a expiré. Déconnecte-toi, reconnecte-toi, puis publie de nouveau.';
  if(l.indexOf('row-level security')>-1||l.indexOf('42501')>-1||l.indexOf('403')>-1)return 'Supabase refuse cette publication. Exécute le SQL de réparation V373 puis reconnecte-toi.';
  if(l.indexOf('bucket')>-1||l.indexOf('storage')>-1||l.indexOf('object')>-1)return 'Le stockage de la photo n’est pas correctement activé. Exécute le SQL de réparation V373.';
  if(l.indexOf('duplicate')>-1||l.indexOf('23505')>-1)return 'Ce traitement existe déjà. Actualise la page puis utilise « Mettre à jour ».';
  return m||'Publication impossible pour le moment. Réessaie dans quelques instants.';
}
window.NexoraReliablePublicationV373={message:message,isNetworkError:isNetworkError,retry:retry,sessionUser:sessionUser,prepareImage:prepareImage,friendly:friendly,version:'V373'};
})();

/* ===== nexora-student-work-feed-v378-script ===== */
(function(){
'use strict';
var VERSION='V378';
var ROMAN_TABLE='roman_subject_responses';
var EXAM_TABLE='exam_subject_responses';
var COMMENTS_TABLE='student_work_comments';
var POSTS_TABLE='posts';
var TEACHER_TABLE='teacher_requests';
var state={rows:[],comments:[],filter:'all',limit:30,loading:false,loaded:false,commentsLoaded:false,commentsAvailable:true,status:'',statusKind:'',realtime:null,reloadTimer:null,refreshTimer:null,user:null,openComments:{},drafts:{},commentStatus:{},publishing:{}};

function root(){return document.querySelector('[data-nx-student-feed-v371]');}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function ensureClient(){try{return window.NexoraApp&&typeof window.NexoraApp.ensureSupabaseClientReady==='function'?window.NexoraApp.ensureSupabaseClientReady():Promise.resolve(window.NexoraApp&&window.NexoraApp.getSupabaseClient?window.NexoraApp.getSupabaseClient():null);}catch(_e){return Promise.resolve(null);}}
function initials(name){var p=String(name||'Élève Nexora').trim().split(/\s+/).filter(Boolean);return ((p[0]||'E').charAt(0)+(p.length>1?p[p.length-1].charAt(0):'')).toUpperCase();}
function dateText(v){try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}catch(_e){return String(v||'');}}
function novelTitle(id){try{var api=window.NexoraRomansV353;var title=api&&typeof api.titleForId==='function'?api.titleForId(id):'';return title||'Œuvre littéraire';}catch(_e){return 'Œuvre littéraire';}}
function examLabel(id,level,area){var map={'bac-francais':'BAC · Français','bac-philosophie':'BAC · Philosophie','brevet-francais':'Brevet · Français'};return map[String(id||'')]||((String(level||'').toLowerCase()==='brevet'?'Brevet':'BAC')+' · '+String(area||'Sujet'));}
function postText(row){return String((row&&row.text)||(row&&row.content)||(row&&row.body)||'');}
function capture(text,label){var safe=String(label||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');var m=String(text||'').match(new RegExp('(?:^|\\n)\\s*'+safe+'\\s*:\\s*([^\\n]+)','i'));return m?String(m[1]||'').trim():'';}
function digits(v){return String(v||'').replace(/[^\d+]/g,'');}
function formatBudget(v){var n=Number(String(v==null?'':v).replace(/[^\d]/g,''));if(!isFinite(n)||n<=0)return 'Budget à discuter';try{return new Intl.NumberFormat('fr-FR').format(n)+' GNF';}catch(_e){return String(n)+' GNF';}}
function isTeacherRequest(row){if(!row)return false;if(row.teacherRequest===true||row.teacher_request===true)return true;var text=postText(row);return /RECHERCHE\s+DE\s+PROFESSEUR|Mati[eè]re\s+recherch[eé]e\s*:|PROFESSEUR\s*\/\s*R[ÉE]P[ÉE]TITEUR/i.test(text);}
function isVisiblePost(row){var status=String(row&&row.status||'active').toLowerCase(),visibility=String(row&&row.visibility||'public').toLowerCase();return !(row&&row.is_deleted===true)&&['deleted','removed','inactive','archived'].indexOf(status)<0&&['private','hidden'].indexOf(visibility)<0;}
function teacherDetails(row){var text=postText(row);var name=String(row&&row.full_name||row&&row.teacher_request_name||capture(text,'Nom et prénom')||row&&row.author_name||row&&row.profile_name||'Élève Nexora').trim();var contact=String(row&&row.contact||row&&row.teacher_request_contact||capture(text,'Contact')||'').trim();var subject=String(row&&row.subject||row&&row.teacher_request_subject||capture(text,'Matière recherchée')||'Professeur ou répétiteur').trim();var budgetRaw=row&&row.budget_gnf!=null?row.budget_gnf:(row&&row.teacher_request_budget!=null?row.teacher_request_budget:capture(text,'Budget proposé'));return {name:name||'Élève Nexora',contact:contact,subject:subject||'Professeur ou répétiteur',budget:formatBudget(budgetRaw)};}
function normalizeRoman(row){return {id:'roman:'+String(row.id||''),rawId:String(row.id||''),publicationType:'roman',kind:'roman',source:'Romans · '+novelTitle(row.novel_id),route:'novels',subjectIndex:Number(row.subject_index||0),subjectText:String(row.subject_text||'Sujet traité sur une œuvre'),author:String(row.author_name||'Élève Nexora'),content:String(row.content||''),photo:String(row.photo_url||''),created:String(row.updated_at||row.created_at||''),sortAt:new Date(row.updated_at||row.created_at||0).getTime()||0};}
function normalizeExam(row){return {id:'exam:'+String(row.id||''),rawId:String(row.id||''),publicationType:'exam',kind:'exam',source:examLabel(row.category_id,row.exam_level,row.subject_area),route:'subjects',subjectIndex:Number(row.subject_index||0),subjectText:String(row.subject_text||'Sujet traité'),author:String(row.author_name||'Élève Nexora'),content:String(row.content||''),photo:String(row.photo_url||''),created:String(row.updated_at||row.created_at||''),sortAt:new Date(row.updated_at||row.created_at||0).getTime()||0};}
function normalizeTeacher(row){var d=teacherDetails(row),created=String(row.updated_at||row.updatedAt||row.created_at||row.createdAt||'');return {id:'teacher:'+String(row.id||''),rawId:String(row.id||''),publicationType:'teacher',kind:'teacher',source:'Recherche de professeur',route:'teacher-request',subjectIndex:0,subjectText:d.subject,author:d.name,content:'',photo:'',contact:d.contact,budget:d.budget,created:created,sortAt:new Date(created||0).getTime()||0,syncStatus:String(row.teacher_request_sync_status||row.sync_status||'synced')};}
function normalizeComment(row){return {id:String(row.id||''),publicationType:String(row.publication_type||''),publicationId:String(row.publication_id||''),userId:String(row.user_id||''),author:String(row.author_name||'Élève Nexora'),content:String(row.content||''),created:String(row.created_at||row.updated_at||'')};}
function commentKey(type,id){return String(type||'')+':'+String(id||'');}
function commentsFor(row){if(row.kind==='teacher')return [];var key=commentKey(row.publicationType,row.rawId);return state.comments.filter(function(c){return commentKey(c.publicationType,c.publicationId)===key;});}
function currentRows(){var rows=state.rows.filter(function(r){return state.filter==='all'||r.kind===state.filter;});return rows.slice(0,state.limit);}
function setStatus(text,kind){state.status=String(text||'');state.statusKind=String(kind||'');var el=root()&&root().querySelector('[data-nx-student-feed-status-v371]');if(el){el.textContent=state.status;el.className='nx-student-feed-status-v371 '+state.statusKind;}}
function localTeacherRows(){try{var posts=window.NexoraApp&&typeof window.NexoraApp.getPublicPostsSnapshot==='function'?window.NexoraApp.getPublicPostsSnapshot():[];return posts.filter(function(p){return isVisiblePost(p)&&isTeacherRequest(p);}).map(normalizeTeacher);}catch(_e){return [];}}
function mergeTeacherRows(remoteRows){var map={};(remoteRows||[]).forEach(function(r){if(r&&r.rawId)map[r.rawId]=r;});localTeacherRows().forEach(function(r){if(r&&r.rawId)map[r.rawId]=r;});return Object.keys(map).map(function(k){return map[k];});}

async function identity(c){
  if(state.user)return state.user;
  if(!c||!c.auth)return null;
  try{
    var res=typeof c.auth.getSession==='function'?await c.auth.getSession():null;
    var u=res&&res.data&&res.data.session&&res.data.session.user;
    if(!u&&typeof c.auth.getUser==='function'){var r=await c.auth.getUser();u=r&&r.data&&r.data.user;}
    if(!u)return null;
    var m=u.user_metadata||{},mail=String(u.email||''),name=String(m.full_name||m.name||m.display_name||mail.split('@')[0]||'Élève Nexora').replace(/[._-]+/g,' ').trim();
    state.user={id:String(u.id),name:name||'Élève Nexora'};
    return state.user;
  }catch(_e){return null;}
}

function commentList(row){
  var rows=commentsFor(row);
  if(!state.commentsAvailable)return '<div class="nx-feed-comments-empty-v374 nx-feed-comments-error-v374">Exécute le SQL V374 pour activer les commentaires synchronisés.</div>';
  if(!rows.length)return '<div class="nx-feed-comments-empty-v374">Aucun commentaire. Sois le premier à réagir à ce travail.</div>';
  return rows.map(function(c){
    var mine=state.user&&String(state.user.id)===String(c.userId);
    return '<article class="nx-feed-comment-v374"><span class="nx-feed-comment-avatar-v374" aria-hidden="true">'+esc(initials(c.author))+'</span><div class="nx-feed-comment-main-v374"><div class="nx-feed-comment-meta-v374"><strong>'+esc(c.author)+'</strong><time datetime="'+esc(c.created)+'">'+esc(dateText(c.created))+'</time></div><p>'+esc(c.content)+'</p>'+(mine?'<button type="button" class="nx-feed-comment-delete-v374" data-nx-feed-comment-delete-v374="'+esc(c.id)+'" data-publication-key="'+esc(commentKey(row.publicationType,row.rawId))+'">Supprimer</button>':'')+'</div></article>';
  }).join('');
}

function commentsPanel(row){
  var key=commentKey(row.publicationType,row.rawId),open=!!state.openComments[key],draft=state.drafts[key]||'',status=state.commentStatus[key]||{},busy=!!state.publishing[key];
  if(!open)return '';
  return '<section class="nx-feed-comments-panel-v374" data-nx-feed-comments-panel-v374="'+esc(key)+'"><div class="nx-feed-comments-title-v374"><div><strong>Commentaires des élèves</strong><span>'+commentsFor(row).length+' commentaire'+(commentsFor(row).length>1?'s':'')+'</span></div></div><div class="nx-feed-comments-list-v374">'+commentList(row)+'</div><form class="nx-feed-comment-form-v374" data-nx-feed-comment-form-v374="'+esc(key)+'"><label for="nxFeedComment'+esc(row.rawId)+'">Commenter ce sujet traité</label><textarea id="nxFeedComment'+esc(row.rawId)+'" maxlength="1000" rows="3" data-nx-feed-comment-input-v374="'+esc(key)+'" placeholder="Écris une remarque constructive, une question ou un encouragement…">'+esc(draft)+'</textarea><div class="nx-feed-comment-form-foot-v374"><small>Les commentaires sont visibles par les autres comptes.</small><button type="submit" '+(busy?'disabled':'')+'>'+(busy?'Publication…':'Publier le commentaire')+'</button></div>'+(status.text?'<div class="nx-feed-comment-status-v374 '+esc(status.kind||'')+'">'+esc(status.text)+'</div>':'')+'</form></section>';
}

function teacherCard(row){
  var phone=digits(row.contact),contact=row.contact||'Contact non précisé';
  var contactAction=phone?'<a class="nx-teacher-request-contact-v377" href="tel:'+esc(phone)+'"><span aria-hidden="true">☎</span> Contacter l’élève</a>':'<button type="button" class="nx-teacher-request-contact-v377" data-nx-counter-find-professor-v336 data-course-context="Répondre à une annonce de recherche de professeur">Voir le service professeur</button>';
  return '<article class="nx-student-work-card-v371 nx-teacher-request-post-v377" data-teacher-request-id="'+esc(row.rawId)+'"><header class="nx-student-work-head-v371"><span class="nx-student-work-avatar-v371" aria-hidden="true">'+esc(initials(row.author))+'</span><div class="nx-student-work-meta-v371"><strong>'+esc(row.author)+'</strong><time datetime="'+esc(row.created)+'">'+esc(dateText(row.created))+'</time></div><span class="nx-student-work-source-v371">Annonce professeur</span></header><div class="nx-student-work-subject-v371 nx-teacher-request-subject-v377"><small>Professeur ou répétiteur recherché</small><strong>'+esc(row.subjectText)+'</strong></div><div class="nx-teacher-request-details-v377"><div class="nx-teacher-request-detail-v377"><span>Contact de l’élève</span><strong>'+esc(contact)+'</strong></div><div class="nx-teacher-request-detail-v377"><span>Budget proposé</span><strong>'+esc(row.budget||'Budget à discuter')+'</strong></div></div><p class="nx-teacher-request-message-v377">Un élève a publié cette demande dans Nexora. Un professeur ou répétiteur disponible peut le contacter directement.</p><footer class="nx-student-work-foot-v371 nx-teacher-request-foot-v377"><span>'+(row.syncStatus==='failed'?'Visible sur cet appareil · synchronisation à réparer':(row.syncStatus==='pending'?'Synchronisation en cours…':'Visible dans l’Accueil de tous les comptes'))+'</span>'+contactAction+'</footer></article>';
}

function workCard(row){
  var body=row.content?'<div class="nx-student-work-body-v371"><p>'+esc(row.content)+'</p></div>':'';
  var media=row.photo?'<div class="nx-student-work-media-v371"><img loading="lazy" src="'+esc(row.photo)+'" alt="Photo du devoir publié par '+esc(row.author)+'"></div>':'';
  var key=commentKey(row.publicationType,row.rawId),count=commentsFor(row).length,open=!!state.openComments[key];
  return '<article class="nx-student-work-card-v371" data-publication-key="'+esc(key)+'"><header class="nx-student-work-head-v371"><span class="nx-student-work-avatar-v371" aria-hidden="true">'+esc(initials(row.author))+'</span><div class="nx-student-work-meta-v371"><strong>'+esc(row.author)+'</strong><time datetime="'+esc(row.created)+'">'+esc(dateText(row.created))+'</time></div><span class="nx-student-work-source-v371" title="'+esc(row.source)+'">'+esc(row.source)+'</span></header><div class="nx-student-work-subject-v371"><small>Sujet '+esc(row.subjectIndex||'')+' traité</small><strong>'+esc(row.subjectText)+'</strong></div>'+body+media+'<footer class="nx-student-work-foot-v371 nx-student-work-foot-comments-v374"><button type="button" class="nx-feed-comment-toggle-v374 '+(open?'active':'')+'" data-nx-feed-comment-toggle-v374="'+esc(key)+'" aria-expanded="'+(open?'true':'false')+'"><span aria-hidden="true">💬</span> Commenter <b>'+count+'</b></button><button type="button" class="nx-student-work-open-v371" data-action="go" data-screen="'+esc(row.route)+'">Ouvrir le sujet</button></footer>'+commentsPanel(row)+'</article>';
}
function card(row){return row.kind==='teacher'?teacherCard(row):workCard(row);}

function render(){
  var r=root();
  if(!r)return;
  var list=r.querySelector('[data-nx-student-feed-list-v371]'),rows=currentRows(),filtered=state.rows.filter(function(x){return state.filter==='all'||x.kind===state.filter;});
  r.querySelectorAll('[data-nx-student-feed-filter-v371]').forEach(function(b){var active=b.getAttribute('data-nx-student-feed-filter-v371')===state.filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active?'true':'false');});
  var count=r.querySelector('[data-nx-student-feed-count-v371]');
  if(count)count.textContent=String(filtered.length);
  document.querySelectorAll('[data-nx-student-feed-top-count-v371]').forEach(function(el){el.textContent=state.rows.length?state.rows.length+' publications récentes':'Publications récentes';});
  if(list){
    if(state.loading&&!state.loaded)list.innerHTML='<div class="nx-student-feed-loading-v371">Synchronisation des publications de l’Accueil…</div>';
    else if(rows.length)list.innerHTML=rows.map(card).join('');
    else list.innerHTML='<div class="nx-student-feed-empty-v371"><strong>Aucune publication dans l’Accueil</strong>Les sujets traités et les annonces de recherche de professeur apparaîtront ici après publication.</div>';
  }
  var more=r.querySelector('[data-nx-student-feed-more-v371]');
  if(more)more.hidden=filtered.length<=state.limit;
  setStatus(state.status,state.statusKind);
}

async function queryTable(c,table,fields,normalizer){
  try{
    var q=await c.from(table).select(fields).order('updated_at',{ascending:false}).limit(80);
    if(q.error)throw q.error;
    return {rows:(q.data||[]).map(normalizer),error:null};
  }catch(error){return {rows:[],error:error};}
}

async function queryTeacherPosts(c){
  var local=localTeacherRows();
  var dedicatedError=null;
  try{
    var q=await c.from(TEACHER_TABLE).select('id,user_id,full_name,contact,subject,budget_gnf,status,created_at,updated_at').eq('status','active').order('updated_at',{ascending:false}).limit(120);
    if(q.error)throw q.error;
    return {rows:mergeTeacherRows((q.data||[]).map(normalizeTeacher)),error:null,source:'teacher_requests'};
  }catch(error){
    dedicatedError=error;
  }
  try{
    var variants=[
      'id,user_id,text,status,visibility,created_at,updated_at',
      'id,user_id,content,status,visibility,created_at,updated_at',
      'id,user_id,body,status,visibility,created_at,updated_at',
      'id,user_id,text,created_at,updated_at',
      'id,user_id,content,created_at,updated_at'
    ];
    var data=null,lastError=null;
    for(var i=0;i<variants.length;i++){
      var q2=await c.from(POSTS_TABLE).select(variants[i]).order('updated_at',{ascending:false}).limit(120);
      if(!q2.error){data=q2.data||[];lastError=null;break;}
      lastError=q2.error;
    }
    if(lastError)throw lastError;
    var remote=(data||[]).filter(function(row){return isVisiblePost(row)&&isTeacherRequest(row);}).map(normalizeTeacher);
    return {rows:mergeTeacherRows(remote),error:dedicatedError,source:'posts-fallback'};
  }catch(error2){
    return {rows:local,error:dedicatedError||error2,source:'local'};
  }
}

async function queryComments(c,publicationIds){
  publicationIds=Array.from(new Set((publicationIds||[]).map(function(id){return String(id||'');}).filter(Boolean))).slice(0,120);
  if(!publicationIds.length)return {rows:[],error:null};
  try{
    var q=await c.from(COMMENTS_TABLE).select('id,publication_type,publication_id,user_id,author_name,content,created_at,updated_at').in('publication_id',publicationIds).order('created_at',{ascending:false}).limit(300);
    if(q.error)throw q.error;
    state.commentsAvailable=true;
    return {rows:(q.data||[]).slice().reverse().map(normalizeComment),error:null};
  }catch(error){
    state.commentsAvailable=false;
    return {rows:[],error:error};
  }
}

async function load(force){
  if(!feedScreenActive()){state.loaded=false;return;}
  if(state.loading)return;
  if(state.loaded&&!force){render();return;}
  state.loading=true;state.status='';state.statusKind='';render();
  var localTeachers=localTeacherRows();
  try{
    var c=await ensureClient();
    if(!c)throw new Error('Connexion Supabase indisponible');
    await identity(c);
    var primaryResults=await Promise.all([
      queryTable(c,ROMAN_TABLE,'id,novel_id,subject_index,subject_text,user_id,author_name,content,photo_url,created_at,updated_at',normalizeRoman),
      queryTable(c,EXAM_TABLE,'id,category_id,exam_level,subject_area,subject_index,subject_text,user_id,author_name,content,photo_url,created_at,updated_at',normalizeExam),
      queryTeacherPosts(c)
    ]);
    state.rows=primaryResults[0].rows.concat(primaryResults[1].rows,primaryResults[2].rows).sort(function(a,b){return b.sortAt-a.sortAt;});
    var publicationIds=state.rows.filter(function(row){return row.kind!=='teacher';}).map(function(row){return row.rawId;});
    var commentsResult=await queryComments(c,publicationIds);
    var results=[primaryResults[0],primaryResults[1],primaryResults[2],commentsResult];
    state.comments=commentsResult.rows;
    state.loaded=true;state.commentsLoaded=true;
    var workErrors=[results[0],results[1]].filter(function(x){return !!x.error;});
    if(workErrors.length===2&&results[2].error){
      state.status='Les publications locales sont visibles, mais la synchronisation Supabase est indisponible.';
      state.statusKind='error';
    }else if(workErrors.length){
      state.status='Une partie des publications est disponible.';
      state.statusKind='error';
    }else if(results[2].error){
      state.status='Les travaux sont synchronisés. Exécutez le SQL V378 pour partager les annonces de professeur entre tous les comptes.';
      state.statusKind='error';
    }else if(results[3].error){
      state.status='Publications synchronisées. Exécute le SQL V374 pour activer les commentaires des travaux.';
      state.statusKind='error';
    }else{
      state.status='Travaux, annonces de professeur et commentaires synchronisés entre les comptes.';
      state.statusKind='ok';
    }
  }catch(error){
    state.rows=localTeachers.sort(function(a,b){return b.sortAt-a.sortAt;});
    state.comments=[];state.loaded=true;
    state.status=localTeachers.length?'Annonce enregistrée sur cet appareil. La synchronisation reprendra avec Internet.':'Connexion impossible. Vérifie Internet et la configuration Supabase.';
    state.statusKind='error';
  }finally{
    state.loading=false;render();setupRealtime();
  }
}

function rowByKey(key){return state.rows.filter(function(r){return commentKey(r.publicationType,r.rawId)===key;})[0]||null;}
async function publishComment(key,button){
  var row=rowByKey(key),content=String(state.drafts[key]||'').trim(),tools=window.NexoraReliablePublicationV373;
  if(!row||row.kind==='teacher')return;
  if(content.length<3){state.commentStatus[key]={text:'Écris au moins 3 caractères avant de publier.',kind:'error'};render();return;}
  state.publishing[key]=true;state.commentStatus[key]={text:'',kind:''};render();
  try{
    var c=await ensureClient(),u=await identity(c);
    if(!c||!u)throw new Error('Connecte-toi à ton compte Nexora pour commenter.');
    var payload={publication_type:row.publicationType,publication_id:row.rawId,user_id:u.id,author_name:u.name,content:content,updated_at:new Date().toISOString()};
    var action=async function(){var q=await c.from(COMMENTS_TABLE).insert(payload).select('id,publication_type,publication_id,user_id,author_name,content,created_at,updated_at').single();if(q.error)throw q.error;return q;};
    var res=tools&&typeof tools.retry==='function'?await tools.retry(action,3):await action();
    state.comments.push(normalizeComment(res.data));state.drafts[key]='';state.commentStatus[key]={text:'Commentaire publié et synchronisé.',kind:'ok'};state.commentsAvailable=true;
  }catch(error){
    state.commentStatus[key]={text:tools&&typeof tools.friendly==='function'?tools.friendly(error):'Publication du commentaire impossible.',kind:'error'};
  }finally{state.publishing[key]=false;render();}
}

async function deleteComment(id,key){
  var tools=window.NexoraReliablePublicationV373;
  try{
    var c=await ensureClient(),u=await identity(c);
    if(!c||!u)throw new Error('Reconnecte-toi pour supprimer ce commentaire.');
    var action=async function(){var q=await c.from(COMMENTS_TABLE).delete().eq('id',id).eq('user_id',u.id);if(q.error)throw q.error;return q;};
    if(tools&&typeof tools.retry==='function')await tools.retry(action,3);else await action();
    state.comments=state.comments.filter(function(c){return c.id!==String(id);});state.commentStatus[key]={text:'Commentaire supprimé.',kind:'ok'};render();
  }catch(error){
    state.commentStatus[key]={text:tools&&typeof tools.friendly==='function'?tools.friendly(error):'Suppression impossible.',kind:'error'};render();
  }
}

function scheduleReload(){clearTimeout(state.reloadTimer);state.reloadTimer=setTimeout(function(){state.loaded=false;if(feedScreenActive())load(true);},650);}
function feedScreenActive(){var r=root();var panneau=r&&r.closest?r.closest('.screen'):null;return !!(panneau&&panneau.classList.contains('active')&&document.visibilityState!=='hidden');}
function stopFeedRefresh(){clearTimeout(state.refreshTimer);state.refreshTimer=null;}
function setupRealtime(){
  stopFeedRefresh();
  if(!feedScreenActive())return;
  state.refreshTimer=setTimeout(function(){if(feedScreenActive()){state.loaded=false;load(true);}},90000);
}

function bind(){
  var r=root();
  if(!r||r.dataset.boundV378==='1')return;
  r.dataset.boundV378='1';
  r.addEventListener('input',function(e){var input=e.target.closest('[data-nx-feed-comment-input-v374]');if(input){state.drafts[input.getAttribute('data-nx-feed-comment-input-v374')]=input.value;}});
  r.addEventListener('submit',function(e){var form=e.target.closest('[data-nx-feed-comment-form-v374]');if(form){e.preventDefault();publishComment(form.getAttribute('data-nx-feed-comment-form-v374'),form.querySelector('button[type="submit"]'));}});
  r.addEventListener('click',function(e){
    var filter=e.target.closest('[data-nx-student-feed-filter-v371]');
    if(filter){state.filter=filter.getAttribute('data-nx-student-feed-filter-v371')||'all';state.limit=30;render();return;}
    if(e.target.closest('[data-nx-student-feed-refresh-v371]')){state.loaded=false;load(true);return;}
    if(e.target.closest('[data-nx-student-feed-more-v371]')){state.limit+=30;render();return;}
    var toggle=e.target.closest('[data-nx-feed-comment-toggle-v374]');
    if(toggle){var key=toggle.getAttribute('data-nx-feed-comment-toggle-v374');state.openComments[key]=!state.openComments[key];render();return;}
    var del=e.target.closest('[data-nx-feed-comment-delete-v374]');
    if(del){if(window.confirm&&!window.confirm('Supprimer ce commentaire ?'))return;deleteComment(del.getAttribute('data-nx-feed-comment-delete-v374'),del.getAttribute('data-publication-key'));}
  });
}

function mount(){bind();render();if(feedScreenActive())load(false);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
document.addEventListener('nx-screen-change',function(e){if(e&&e.detail&&e.detail.screen==='network'){state.loaded=false;setTimeout(function(){load(true);},40);}else stopFeedRefresh();});
document.addEventListener('nx-teacher-request-published-v378',function(e){state.filter='all';state.loaded=false;var row=e&&e.detail&&e.detail.row;if(row){try{var normalized=normalizeTeacher(row);state.rows=[normalized].concat(state.rows.filter(function(x){return !(x.kind==='teacher'&&String(x.rawId)===String(normalized.rawId));}));state.loaded=true;render();}catch(_e){window.nxLog&&window.nxLog(_e)}}setTimeout(function(){state.loaded=false;if(feedScreenActive())load(true);},120);});
document.addEventListener('nx-teacher-request-published-v377',function(){state.filter='all';state.loaded=false;setTimeout(function(){if(feedScreenActive())load(true);},100);});
window.addEventListener('online',function(){if(feedScreenActive()){state.loaded=false;load(true);}});
document.addEventListener('visibilitychange',function(){if(feedScreenActive()){state.loaded=false;load(true);}else stopFeedRefresh();});
try{ensureClient().then(function(c){if(c&&c.auth&&typeof c.auth.onAuthStateChange==='function')c.auth.onAuthStateChange(function(){state.user=null;state.loaded=false;scheduleReload();});});}catch(_e){window.nxLog&&window.nxLog(_e)}
window.NexoraStudentWorkFeedV378={version:VERSION,refresh:function(){state.loaded=false;return load(true);},addTeacherRequest:function(row){if(!row)return;var normalized=normalizeTeacher(row);state.filter='all';state.rows=[normalized].concat(state.rows.filter(function(x){return !(x.kind==='teacher'&&String(x.rawId)===String(normalized.rawId));}));state.loaded=true;render();}};
})();



/* ═══════════════════════════════════════════════════════════════════════════
   V539 · PRÉSENCE EN DIRECT DANS LA COMMUNAUTÉ

   Chaque application ouverte annonce sa présence sur un canal Supabase partagé
   et reçoit la liste des autres en temps réel. Rien n'est enregistré en base :
   la présence vit le temps de la connexion et disparaît à la fermeture.

   Affichage : prénom et initiale du nom. Assez pour reconnaître un camarade,
   pas assez pour identifier un élève auprès d'un inconnu.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__nxPresenceV539) return;
  window.__nxPresenceV539 = true;

  var CANAL = 'nexora-presence-v539';
  var canal = null;
  var moi = null;

  function racineFil(){ return document.querySelector('[data-nx-student-feed-v371]'); }

  function client(){
    try {
      if (window.NexoraApp && typeof window.NexoraApp.ensureSupabaseClientReady === 'function')
        return window.NexoraApp.ensureSupabaseClientReady();
      return Promise.resolve(window.NexoraApp && window.NexoraApp.getSupabaseClient
        ? window.NexoraApp.getSupabaseClient() : null);
    } catch(_e){ return Promise.resolve(null); }
  }

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* « Mariama Diallo » devient « Mariama D. » */
  function nomCourt(nom){
    var parts = String(nom || 'Élève Nexora').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'Élève Nexora';
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.';
  }

  function initiales(nom){
    var p = String(nom || 'Élève Nexora').trim().split(/\s+/).filter(Boolean);
    return ((p[0] || 'E').charAt(0) + (p.length > 1 ? p[p.length-1].charAt(0) : '')).toUpperCase();
  }

  function styles(){
    if (document.getElementById('nxPresenceStyleV539')) return;
    var s = document.createElement('style');
    s.id = 'nxPresenceStyleV539';
    s.textContent =
      '.nx-presence-v539{margin:0 0 14px;padding:14px 16px;border:1px solid var(--nx-cendre-2,#C6CBD2);' +
      'border-radius:10px;background:#fff}' +
      '.nx-presence-tete-v539{display:flex;align-items:center;gap:9px;margin-bottom:11px}' +
      '.nx-presence-pastille-v539{width:9px;height:9px;border-radius:50%;background:#2F7A4F;flex:0 0 auto;' +
      'box-shadow:0 0 0 3px rgba(47,122,79,.18)}' +
      '.nx-presence-tete-v539 b{color:var(--nx-ardoise,#16324F);font-size:14.5px;font-weight:800}' +
      '.nx-presence-tete-v539 span{margin-left:auto;color:var(--nx-cendre-6,#5F656C);font-size:11px;' +
      'font-weight:800;letter-spacing:.12em;text-transform:uppercase}' +
      '.nx-presence-liste-v539{display:flex;flex-wrap:wrap;gap:8px}' +
      '.nx-presence-personne-v539{display:flex;align-items:center;gap:7px;padding:6px 11px 6px 6px;' +
      'border:1px solid var(--nx-cendre-1,#DBDFE4);border-radius:999px;background:var(--nx-cendre-0,#EDEFF2);' +
      'font-size:13px;font-weight:600;color:#21252B}' +
      '.nx-presence-personne-v539 i{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;' +
      'background:var(--nx-ardoise,#16324F);color:var(--nx-craie,#EEF2F6);font-size:10.5px;font-style:normal;font-weight:800}' +
      '.nx-presence-personne-v539.moi{border-color:var(--nx-ardoise,#16324F)}' +
      '.nx-presence-vide-v539{color:var(--nx-cendre-6,#5F656C);font-size:13.5px}' +
      '[data-theme="dark"] .nx-presence-v539{background:#121914;border-color:#2A2F36}' +
      '[data-theme="dark"] .nx-presence-personne-v539{background:#171A1E;border-color:#2A2F36;color:#CDD1D7}';
    document.head.appendChild(s);
  }

  function cadre(){
    var racine = racineFil();
    if (!racine) return null;
    var c = document.getElementById('nxPresenceV539');
    if (c && c.parentNode === racine) return c;
    styles();
    c = document.createElement('section');
    c.id = 'nxPresenceV539';
    c.className = 'nx-presence-v539';
    c.setAttribute('aria-live', 'polite');
    c.innerHTML =
      '<div class="nx-presence-tete-v539"><i class="nx-presence-pastille-v539"></i>' +
      '<b data-presence-titre>Connexion…</b><span data-presence-compte></span></div>' +
      '<div class="nx-presence-liste-v539" data-presence-liste></div>';
    racine.insertBefore(c, racine.firstChild);
    return c;
  }

  function dessiner(personnes){
    var c = cadre();
    if (!c) return;
    var n = personnes.length;
    c.querySelector('[data-presence-titre]').textContent =
      n <= 1 ? 'Tu es seul en ligne pour le moment' :
      n + ' personnes en ligne';
    c.querySelector('[data-presence-compte]').textContent = n ? 'en direct' : '';
    c.querySelector('[data-presence-liste]').innerHTML = n
      ? personnes.map(function(p){
          return '<span class="nx-presence-personne-v539' + (p.moi ? ' moi' : '') + '">' +
                 '<i>' + esc(initiales(p.nom)) + '</i>' + esc(nomCourt(p.nom)) +
                 (p.moi ? ' (toi)' : '') + '</span>';
        }).join('')
      : '<span class="nx-presence-vide-v539">Personne d’autre n’est connecté en ce moment.</span>';
  }

  function lire(){
    if (!canal || typeof canal.presenceState !== 'function') return [];
    var etat = canal.presenceState() || {};
    var vus = {}, sortie = [];
    Object.keys(etat).forEach(function(cle){
      (etat[cle] || []).forEach(function(entree){
        var id = String(entree && entree.id || cle);
        if (vus[id]) return;
        vus[id] = true;
        sortie.push({ nom: (entree && entree.nom) || 'Élève Nexora', moi: moi && id === moi.id });
      });
    });
    sortie.sort(function(a,b){ return a.moi ? -1 : b.moi ? 1 : String(a.nom).localeCompare(String(b.nom)); });
    return sortie;
  }

  async function demarrer(){
    if (canal) { dessiner(lire()); return; }
    if (!racineFil()) return;

    var c = null;
    try { c = await client(); } catch(_e){}
    if (!c || typeof c.channel !== 'function') return;

    var session = null;
    try { session = (await c.auth.getSession()).data.session; } catch(_e){}
    var u = session && session.user;
    if (!u) return;

    var meta = u.user_metadata || {};
    moi = {
      id: String(u.id),
      nom: meta.full_name || meta.name || meta.prenom || (u.email || '').split('@')[0] || 'Élève Nexora'
    };

    canal = c.channel(CANAL, { config: { presence: { key: moi.id } } });
    canal.on('presence', { event: 'sync' }, function(){ dessiner(lire()); });
    canal.on('presence', { event: 'join' }, function(){ dessiner(lire()); });
    canal.on('presence', { event: 'leave' }, function(){ dessiner(lire()); });
    canal.subscribe(function(statut){
      if (statut !== 'SUBSCRIBED') return;
      try { canal.track({ id: moi.id, nom: moi.nom, depuis: Date.now() }); }
      catch(_e){ window.nxLog && window.nxLog(_e); }
    });
  }

  function arreter(){
    if (!canal) return;
    try { canal.unsubscribe(); } catch(_e){}
    canal = null;
    var c = document.getElementById('nxPresenceV539');
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }

  /* On ne se déclare présent que sur l'écran Communauté, et on se retire dès
     qu'on le quitte ou que l'application passe en arrière-plan. */
  function surEcranCommunaute(){
    return !!document.querySelector('[data-screen-panel="network"].active');
  }

  function ajuster(){
    if (surEcranCommunaute() && document.visibilityState === 'visible') demarrer();
    else arreter();
  }

  document.addEventListener('nx-screen-change', function(){ setTimeout(ajuster, 300); });
  document.addEventListener('visibilitychange', ajuster);
  window.addEventListener('pagehide', arreter);
  window.addEventListener('nexora:remote-ready', function(){ setTimeout(ajuster, 600); });
  setTimeout(ajuster, 1200);
})();
