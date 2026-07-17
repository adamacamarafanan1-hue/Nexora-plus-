
(function(){
  'use strict';
  function root(){return document.querySelector('[data-nx-academy-real]');}
  function show(name){var r=root();if(!r)return;r.querySelectorAll('[data-nx-academy-view]').forEach(function(p){p.hidden=p.getAttribute('data-nx-academy-view')!==name;});try{document.getElementById('screen-academy').scrollTo({top:0,behavior:'auto'});}catch(_e){}window.scrollTo(0,0);}
  document.addEventListener('click',function(e){
    var open=e.target&&e.target.closest?e.target.closest('[data-nx-academy-open]'):null;if(open){e.preventDefault();show(open.getAttribute('data-nx-academy-open'));return;}
    var back=e.target&&e.target.closest?e.target.closest('[data-nx-academy-back]'):null;if(back){e.preventDefault();show('home');return;}
    var academy=e.target&&e.target.closest?e.target.closest('[data-screen="academy"]'):null;if(academy){setTimeout(function(){show('home');},0);}
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){show('home');},{once:true});else show('home');
  window.NexoraAcademyV182={home:function(){show('home')},pre:function(){show('pre')},professional:function(){show('pro')}};
})();
