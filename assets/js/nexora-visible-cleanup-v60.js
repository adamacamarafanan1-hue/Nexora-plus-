
(function(){
  'use strict';
  function qsa(sel,root){try{return Array.prototype.slice.call((root||document).querySelectorAll(sel));}catch(e){return [];}}
  function keyFor(btn){return (btn.getAttribute('data-action')||'')+'|'+(btn.getAttribute('data-screen')||'')+'|'+(btn.getAttribute('data-theme')||'');}
  function cleanNav(root){
    qsa('.nav-list-primary,.mobile-nav-inner',root).forEach(function(nav){
      var seen={};
      qsa(':scope > .nav-btn',nav).forEach(function(btn){
        var k=keyFor(btn);
        if(!k||k==='||') return;
        if(seen[k]){btn.remove();return;}
        seen[k]=true;
      });
    });
  }
  function cleanText(root){
    qsa('p,small,span,div,h2,h3',root).forEach(function(el){
      if(el.children.length>0) return;
      var t=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(!t) return;
      if(/Synchronisation Supabase|Table introuvable|Erreur SQL|debug|stack trace/i.test(t)) el.hidden=true;
      if(t.length>240 && !el.closest('.post,.message-bubble,.nx-learn-detail,.nx-module-program-step,.nx-trainer-field')) el.textContent=t.slice(0,190)+'…';
    });
  }
  function fixAdamsIcons(root){
    qsa('.nx-adams-game-card',root).forEach(function(card){
      var icon=card.querySelector('.nx-adams-game-icon');
      if(!icon) return;
      var txt=(icon.textContent||'JA').trim();
      icon.setAttribute('data-nx-icon-text',txt||'JA');
      if(txt.length>4) icon.setAttribute('data-nx-icon-text','JA');
    });
  }
  function markExternalLinks(root){
    qsa('a[target="_blank"]',root).forEach(function(a){a.rel='noopener noreferrer';});
  }
  function apply(root){root=root||document; cleanNav(root); cleanText(root); fixAdamsIcons(root); markExternalLinks(root);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){apply(document);},{once:true}); else apply(document);
  window.NexoraVisibleCleanup={apply:apply};
  document.addEventListener('nexora:rendered',function(){apply(document);});
})();

