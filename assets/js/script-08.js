
(function(){
  'use strict';
  window.NEXORA_DEPLOYMENT_CLEAN_V7 = true;
  window.NEXORA_STORY_CREATION_TEMPORARILY_DISABLED = true;

  function nxV7Toast(message){
    try{
      var old = document.getElementById('nxCleanV7Toast');
      if(old) old.remove();
      var box = document.createElement('div');
      box.id = 'nxCleanV7Toast';
      box.textContent = message || 'Action momentanément indisponible.';
      box.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483647;max-width:calc(100vw - 28px);background:#0F172A;color:#fff;border-radius:999px;padding:12px 16px;box-shadow:0 16px 44px rgba(15,23,42,.28);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;font-weight:850;text-align:center;line-height:1.35;';
      document.body.appendChild(box);
      setTimeout(function(){ try{ box.remove(); }catch(e){} }, 3800);
    }catch(e){
      try{ alert(message || 'Action momentanément indisponible.'); }catch(_e){}
    }
  }

  function nxV7IsStoryCreationAction(target){
    if(!target || !target.closest) return false;
    var el = target.closest('[data-action]');
    if(!el) return false;
    var action = String(el.getAttribute('data-action') || '').toLowerCase();
    return action === 'create-story' || action === 'publish-story-draft' || action === 'choose-story-audio' || action === 'select-story-music';
  }

  document.addEventListener('click', function(e){
    if(!nxV7IsStoryCreationAction(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    nxV7Toast('Story Nexora est en stabilisation. Les publications, messages, profils et le fil restent disponibles.');
  }, true);

  document.addEventListener('change', function(e){
    var t = e.target;
    if(!t || !t.matches) return;
    if(t.matches('[data-story-media-input], [data-story-audio-input]')){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      try{ t.value = ''; }catch(_e){}
      nxV7Toast('Story Nexora est en stabilisation. Réessaie après la prochaine mise à jour.');
    }
  }, true);

  function nxV7MarkStoryUI(){
    try{
      var btns = document.querySelectorAll('[data-action="create-story"], [data-action="publish-story-draft"], [data-action="choose-story-audio"]');
      btns.forEach(function(btn){
        btn.setAttribute('title','Story Nexora en stabilisation');
        btn.setAttribute('aria-label','Story Nexora en stabilisation');
      });
    }catch(e){}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', nxV7MarkStoryUI);
  else nxV7MarkStoryUI();
  setInterval(nxV7MarkStoryUI, 2500);
})();

  document.addEventListener('loadedmetadata',function(ev){
    var video=ev&&ev.target;
    if(!video||!video.matches||!video.matches('[data-learning-video]')) return;
    var max=Number(video.getAttribute('data-max-duration')||learningVideoMaxSeconds());
    if(video.duration&&max&&video.duration>max){
      video.pause();
      video.removeAttribute('src');
      try{video.load()}catch(_e){}
      var wrap=video.closest('.nx-learning-video');
      if(wrap) wrap.classList.add('nx-video-too-long');
      try{toast('Vidéo non affichée : limite de 15 minutes dépassée.')}catch(_err){}
    }
  },true);

