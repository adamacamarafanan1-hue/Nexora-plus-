
(function(){
  'use strict';
  var allowedProtocols = {'http:':true,'https:':true,'mailto:':true,'tel:':true};
  function safeToast(msg){
    try{ if(typeof toast==='function') toast(msg); }
    catch(e){}
  }
  document.addEventListener('click', function(ev){
    try{
      var target = ev.target;
      var a = target && target.closest ? target.closest('a[href]') : null;
      if(!a) return;
      var raw = a.getAttribute('href') || '';
      if(!raw || raw.charAt(0)==='#') return;
      var u = new URL(raw, window.location.href);
      if(!allowedProtocols[u.protocol]){
        ev.preventDefault();
        ev.stopPropagation();
        safeToast('Lien bloqué pour sécurité.');
        return false;
      }
      if(a.target === '_blank') a.rel = 'noopener noreferrer';
    }catch(e){}
  }, true);

  function tuneMedia(root){
    try{
      var scope = root && root.querySelectorAll ? root : document;
      scope.querySelectorAll('img').forEach(function(img){
        if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
        if(!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
        if(!img.hasAttribute('referrerpolicy')) img.setAttribute('referrerpolicy','no-referrer');
      });
      scope.querySelectorAll('video').forEach(function(video){
        if(!video.hasAttribute('preload')) video.setAttribute('preload','metadata');
        video.setAttribute('playsinline','');
        video.setAttribute('webkit-playsinline','');
      });
    }catch(e){}
  }
  var pending = false;
  function scheduleTune(root){
    if(pending) return;
    pending = true;
    var run = function(){ pending = false; tuneMedia(root || document); };
    if('requestIdleCallback' in window) window.requestIdleCallback(run,{timeout:1200});
    else setTimeout(run,250);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ scheduleTune(document); });
  else scheduleTune(document);
  window.NexoraMediaSecurity={tune:tuneMedia};
  document.addEventListener('nexora:rendered',function(){scheduleTune(document);});
})();

