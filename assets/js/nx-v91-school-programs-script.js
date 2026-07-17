
(function(){
  'use strict';
  var MODULE_URL='modules/dixieme/index.html';
  var lastFocus=null;
  var pendingTarget='subjects';
  function el(id){return document.getElementById(id);}
  function setLoader(visible,message){
    var loader=el('nx10Loader');if(!loader)return;
    loader.hidden=!visible;
    var label=loader.querySelector('b');if(label&&message)label.textContent=message;
  }
  window.nxBacAcademyEntry=function(){
    return '<section class="nx-school-programs-v91" aria-label="Rubriques scolaires de l’Académie">'+
      '<div class="nx-school-head-v91"><div><span>Rubriques scolaires</span><h2>BAC, Brevet et Orientation</h2><p>Choisis la rubrique qui correspond à ton objectif. Chaque carte explique clairement ce que tu vas trouver à l’intérieur.</p></div>'+
      '<div class="nx-school-path-v91" aria-label="Utilisation simple"><span><b>1</b>Choisir</span><span><b>2</b>Étudier</span><span><b>3</b>Progresser</span></div></div>'+
      '<div class="nx-school-grid-v91">'+
        '<article class="nx-school-card-v91 bac" data-audience="Niveau lycée"><div class="nx-school-card-top-v91"><div class="nx-school-mark-v91" aria-hidden="true">BAC</div><div class="nx-school-copy-v91"><small>Préparer le baccalauréat</small><h3>Rubrique BAC</h3><p>Pour les élèves du lycée qui veulent réviser les matières du BAC, suivre les thèmes et s’entraîner avant l’examen.</p></div></div><div class="nx-school-tags-v91"><span>Matières du BAC</span><span>Thèmes à réviser</span><span>Exercices et sujets</span></div><div class="nx-school-actions-v91"><button type="button" class="nx-school-primary-v91" data-nx-open-bac>Ouvrir la rubrique BAC</button></div></article>'+
        '<article class="nx-school-card-v91 ten" data-audience="10ème année et BEPC"><div class="nx-school-card-top-v91"><div class="nx-school-mark-v91" aria-hidden="true">10e</div><div class="nx-school-copy-v91"><small>Étudier et préparer le BEPC</small><h3>Rubrique Brevet</h3><p>Pour les élèves de 10ème année : cours par matière, thèmes à apprendre et sujets du BEPC pour s’entraîner sérieusement.</p></div></div><div class="nx-school-tags-v91"><span>Cours de 10ème</span><span>Sujets BEPC</span><span>Préparation examen</span></div><div class="nx-school-actions-v91 double"><button type="button" class="nx-school-primary-v91" data-nx-open-10eme data-target="subjects">Voir les cours</button><button type="button" class="nx-school-secondary-v91" data-nx-open-10eme data-target="brevet">Voir les sujets</button></div></article>'+
        '<article class="nx-school-card-v91 orientation" data-audience="Après le brevet ou le BAC"><div class="nx-school-card-top-v91"><div class="nx-school-mark-v91" aria-hidden="true">AO</div><div class="nx-school-copy-v91"><small>Choisir sa série ou sa filière</small><h3>Rubrique Orientation</h3><p>Cette rubrique aide l’élève à faire un choix plus clair après le brevet ou le BAC selon ses préférences et ses résultats scolaires.</p></div></div><div class="nx-school-tags-v91"><span>Questions sur les choix</span><span>Questions sur les notes</span><span>Résultat immédiat</span></div><div class="nx-school-actions-v91 double"><button type="button" class="nx-school-primary-v91" data-nx-open-orientation-v108 data-orientation-level="apres_brevet">Après le brevet</button><button type="button" class="nx-school-secondary-v91" data-nx-open-orientation-v108 data-orientation-level="apres_bac">Après le BAC</button></div></article>'+
      '</div></section>';
  };
  function navigateFrame(target){
    var frame=el('nx10AcademyFrame');if(!frame||!frame.contentWindow)return;
    target=target==='brevet'?'brevet':'subjects';
    try{if(typeof frame.contentWindow.show==='function')frame.contentWindow.show(target);else frame.contentWindow.postMessage({type:'nexora-open-10eme',target:target},'*');}catch(_e){}
  }
  function assignModule(frame,path,force,onReady){
    if(!window.NexoraSecureContent||typeof window.NexoraSecureContent.text!=='function')return Promise.reject(new Error('Protection des contenus indisponible.'));
    return window.NexoraSecureContent.text(path).then(function(source){
      frame.removeAttribute('src');
      frame.srcdoc=source;
      return true;
    });
  }
  function ensureFrame(force,target){
    var frame=el('nx10AcademyFrame');if(!frame)return;
    pendingTarget=target==='brevet'?'brevet':'subjects';
    if(!force&&frame.dataset.loaded==='1'){setLoader(false);navigateFrame(pendingTarget);return;}
    setLoader(true,'Ouverture du programme de 10ème année…');
    frame.onload=function(){frame.dataset.loaded='1';setLoader(false);setTimeout(function(){navigateFrame(pendingTarget);},40);};
    frame.onerror=function(){frame.dataset.loaded='';setLoader(true,'Impossible d’ouvrir le programme. Réessaie.');};
    assignModule(frame,MODULE_URL,force).catch(function(){frame.dataset.loaded='';setLoader(true,'Contenu protégé indisponible. Vérifie l’abonnement puis réessaie.');});
  }
  function open10(target){
    var viewer=el('nx10AcademyViewer');if(!viewer)return;
    lastFocus=document.activeElement;viewer.hidden=false;document.body.classList.add('nx10-open-v91');ensureFrame(false,target);
    var close=el('nx10CloseButton');if(close)setTimeout(function(){try{close.focus();}catch(_e){}},30);
  }
  function close10(){
    var viewer=el('nx10AcademyViewer');if(!viewer)return;
    try{var frame=el('nx10AcademyFrame');if(frame&&frame.contentWindow&&typeof frame.contentWindow.stopSpeech==='function')frame.contentWindow.stopSpeech();}catch(_e){}
    viewer.hidden=true;document.body.classList.remove('nx10-open-v91');
    if(lastFocus&&typeof lastFocus.focus==='function'){try{lastFocus.focus();}catch(_e){}}
  }
  document.addEventListener('click',function(e){
    var open=e.target&&e.target.closest?e.target.closest('[data-nx-open-10eme]'):null;
    if(open){e.preventDefault();var target=open.getAttribute('data-target')||'subjects';if(typeof window.nxRequireSubscriptionAccess==='function')window.nxRequireSubscriptionAccess('modules',function(){open10(target);});else open10(target);return;}
    if(e.target&&e.target.closest&&e.target.closest('#nx10CloseButton')){e.preventDefault();close10();return;}
    if(e.target&&e.target.closest&&e.target.closest('#nx10ReloadButton')){e.preventDefault();ensureFrame(true,pendingTarget);}
  });
  document.addEventListener('keydown',function(e){var viewer=el('nx10AcademyViewer');if(e.key==='Escape'&&viewer&&!viewer.hidden){e.preventDefault();close10();}});
  function refreshAcademy(){try{if(typeof window.renderLearnCenter==='function'&&typeof window.readDB==='function')window.renderLearnCenter(window.readDB());}catch(_e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshAcademy,{once:true});else setTimeout(refreshAcademy,0);
  window.NexoraDixieme={open:open10,close:close10,reload:function(){ensureFrame(true,pendingTarget);}};
})();

