(function(){
  'use strict';
  var attempts=0;
  function hasContent(selector){var el=document.querySelector(selector);return !!(el&&el.children&&el.children.length);}
  function repair(){
    attempts++;
    var learnReady=hasContent('[data-learn-center]');
    var gamesReady=hasContent('[data-adams-center]');
    if((!learnReady||!gamesReady)&&window.NexoraApp&&typeof window.NexoraApp.render==='function'){
      try{window.NexoraApp.render();}catch(error){try{console.warn('Relance du rendu Nexora',error);}catch(_e){}}
    }
    learnReady=hasContent('[data-learn-center]');
    gamesReady=hasContent('[data-adams-center]');
    if((!learnReady||!gamesReady)&&attempts<5)setTimeout(repair,attempts*450);
    else if(!learnReady||!gamesReady){
      try{console.error('Nexora V212 : ressources publiques incomplètes. Déployer ou ouvrir le dossier complet, jamais index.html seul.');}catch(_e2){}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(repair,120);},{once:true});
  else setTimeout(repair,120);
  window.addEventListener('load',function(){setTimeout(repair,120);},{once:true});
})();
