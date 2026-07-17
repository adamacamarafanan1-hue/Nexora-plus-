
(function(){
  'use strict';
  var MODULE_URL='modules/bac/index.html';
  var lastFocus=null;
  function el(id){return document.getElementById(id);}
  function setLoader(visible,message){
    var loader=el('nxBacLoader');
    if(!loader)return;
    loader.hidden=!visible;
    var label=loader.querySelector('b');
    if(label&&message)label.textContent=message;
  }
  function assignModule(frame,path,force,onReady){
    if(!window.NexoraSecureContent||typeof window.NexoraSecureContent.text!=='function')return Promise.reject(new Error('Protection des contenus indisponible.'));
    return window.NexoraSecureContent.text(path).then(function(source){
      frame.removeAttribute('src');
      frame.srcdoc=source;
      return true;
    });
  }
  function ensureFrame(force){
    var frame=el('nxBacAcademyFrame');
    if(!frame)return;
    if(!force&&frame.dataset.loaded==='1'){setLoader(false);return;}
    setLoader(true,'Ouverture des matières BAC…');
    frame.onload=function(){frame.dataset.loaded='1';setLoader(false);};
    frame.onerror=function(){frame.dataset.loaded='';setLoader(true,'Impossible d’ouvrir le programme BAC. Réessaie.');};
    assignModule(frame,MODULE_URL,force).catch(function(){frame.dataset.loaded='';setLoader(true,'Contenu protégé indisponible. Vérifie l’abonnement puis réessaie.');});
  }
  function openBac(){
    var viewer=el('nxBacAcademyViewer');if(!viewer)return;
    lastFocus=document.activeElement;viewer.hidden=false;document.body.classList.add('nx-bac-open-v90');ensureFrame(false);
    var close=el('nxBacCloseButton');if(close)setTimeout(function(){try{close.focus();}catch(_e){}},30);
  }
  function closeBac(){
    var viewer=el('nxBacAcademyViewer');if(!viewer)return;
    try{var frame=el('nxBacAcademyFrame');if(frame&&frame.contentWindow&&typeof frame.contentWindow.stopSpeech==='function')frame.contentWindow.stopSpeech();}catch(_e){}
    viewer.hidden=true;document.body.classList.remove('nx-bac-open-v90');
    if(lastFocus&&typeof lastFocus.focus==='function'){try{lastFocus.focus();}catch(_e){}}
  }
  document.addEventListener('click',function(e){
    var open=e.target&&e.target.closest?e.target.closest('[data-nx-open-bac]'):null;
    if(open){e.preventDefault();if(typeof window.nxRequireSubscriptionAccess==='function')window.nxRequireSubscriptionAccess('modules',openBac);else openBac();return;}
    if(e.target&&e.target.closest&&e.target.closest('#nxBacCloseButton')){e.preventDefault();closeBac();return;}
    if(e.target&&e.target.closest&&e.target.closest('#nxBacReloadButton')){e.preventDefault();ensureFrame(true);}
  });
  document.addEventListener('keydown',function(e){var viewer=el('nxBacAcademyViewer');if(e.key==='Escape'&&viewer&&!viewer.hidden){e.preventDefault();closeBac();}});
  function refreshAcademy(){try{if(typeof window.renderLearnCenter==='function'&&typeof window.readDB==='function')window.renderLearnCenter(window.readDB());}catch(_e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshAcademy,{once:true});else setTimeout(refreshAcademy,0);
  window.NexoraBac={open:openBac,close:closeBac,reload:function(){ensureFrame(true);}};
})();

