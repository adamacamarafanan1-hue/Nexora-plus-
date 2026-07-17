
(function(){
  'use strict';
  var disabledScreens = {'nexora-access':true,'formation':true,'rubriques':true};
  function removeLegacyFormationOpportunityUI(){
    try{
      document.querySelectorAll('[data-screen="nexora-access"],[data-screen="formation"],[data-screen="rubriques"],[data-formation-highlight],[data-rubrique-highlight],[data-screen-panel="nexora-access"],[data-screen-panel="formation"],[data-screen-panel="rubriques"],.search-tab[data-search-type="opportunities"]').forEach(function(el){
        if(el && el.parentNode) el.parentNode.removeChild(el);
      });
    }catch(e){}
  }
  document.addEventListener('click',function(e){
    var target=e.target&&e.target.closest?e.target.closest('[data-screen]'):null;
    if(target&&disabledScreens[target.getAttribute('data-screen')]){
      e.preventDefault();
      e.stopPropagation();
      if(typeof go==='function') go('home');
      return false;
    }
  },true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',removeLegacyFormationOpportunityUI);
  else removeLegacyFormationOpportunityUI();
  window.addEventListener('load',removeLegacyFormationOpportunityUI);
})();

