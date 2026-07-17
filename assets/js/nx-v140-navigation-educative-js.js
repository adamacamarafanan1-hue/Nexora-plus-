
(function(){
  'use strict';
  function apply(){
    document.querySelectorAll('[data-screen="adams"]').forEach(function(el){el.setAttribute('aria-label','Ouvrir Jeu Adams');});
    document.querySelectorAll('[data-screen="academy"]').forEach(function(el){el.setAttribute('aria-label','Ouvrir Académie');});
    document.querySelectorAll('[data-screen="trainer"][data-nx-community-main]').forEach(function(el){el.setAttribute('aria-label','Ouvrir la Communauté');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
