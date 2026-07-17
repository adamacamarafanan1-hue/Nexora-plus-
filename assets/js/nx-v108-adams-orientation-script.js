
(function(){
  'use strict';
  var MODULE_URL='modules/orientation/index.html';
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
        try{select.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));}catch(_e){}
        var first=doc.getElementById('firstName');if(first&&typeof first.focus==='function')setTimeout(function(){try{first.focus();}catch(_e){}},60);
        return;
      }
      frame.contentWindow.postMessage({type:'nexora-orientation-level',level:level},'*');
    }catch(_e){}
  }
  function assignModule(frame,path,force,onReady){
    if(!window.NexoraSecureContent||typeof window.NexoraSecureContent.text!=='function')return Promise.reject(new Error('Protection des contenus indisponible.'));
    return window.NexoraSecureContent.text(path).then(function(source){
      frame.removeAttribute('src');
      frame.srcdoc=source;
      return true;
    });
  }
  function ensureFrame(force,level){
    var frame=el('nxOrientationFrameV108');if(!frame)return;
    pendingLevel=normalizeLevel(level)||pendingLevel;
    if(!force&&frame.dataset.loaded==='1'){setLoader(false);setTimeout(function(){applyLevelPreset(pendingLevel);},30);return;}
    setLoader(true,'Ouverture d’Adams Orientation');
    frame.onload=function(){frame.dataset.loaded='1';setLoader(false);setTimeout(function(){applyLevelPreset(pendingLevel);},40);};
    frame.onerror=function(){frame.dataset.loaded='';setLoader(true,'Impossible d’ouvrir Adams Orientation. Réessaie.');};
    assignModule(frame,MODULE_URL,force).catch(function(){frame.dataset.loaded='';setLoader(true,'Contenu protégé indisponible. Vérifie l’abonnement puis réessaie.');});
  }
  function openOrientationGranted(level){
    var viewer=el('nxOrientationViewerV108');if(!viewer)return;
    pendingLevel=normalizeLevel(level);
    lastFocus=document.activeElement;viewer.hidden=false;document.body.classList.add('nx-orientation-open-v108');ensureFrame(false,pendingLevel);
    var close=el('nxOrientationCloseV108');if(close)setTimeout(function(){try{close.focus();}catch(_e){}},30);
  }
  function openOrientation(level){
    level=normalizeLevel(level);
    if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('orientation',function(){openOrientationGranted(level);});
    return openOrientationGranted(level);
  }
  function closeOrientation(){
    var viewer=el('nxOrientationViewerV108');if(!viewer)return;
    viewer.hidden=true;document.body.classList.remove('nx-orientation-open-v108');
    if(lastFocus&&typeof lastFocus.focus==='function'){try{lastFocus.focus();}catch(_e){}}
  }
  document.addEventListener('click',function(e){
    var open=e.target&&e.target.closest?e.target.closest('[data-nx-open-orientation-v108]'):null;
    if(open){e.preventDefault();openOrientation(open.getAttribute('data-orientation-level')||'');return;}
    if(e.target&&e.target.closest&&e.target.closest('#nxOrientationCloseV108')){e.preventDefault();closeOrientation();return;}
    if(e.target&&e.target.closest&&e.target.closest('#nxOrientationReloadV108')){e.preventDefault();ensureFrame(true,pendingLevel);return;}
  });
  document.addEventListener('keydown',function(e){var viewer=el('nxOrientationViewerV108');if(e.key==='Escape'&&viewer&&!viewer.hidden){e.preventDefault();closeOrientation();}});
  window.NexoraOrientation={open:openOrientation,close:closeOrientation,reload:function(){ensureFrame(true,pendingLevel);}};
})();

