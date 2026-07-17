
(function(){
  'use strict';
  function closeLearningViewers(){
    try{if(window.NexoraBac&&typeof window.NexoraBac.close==='function')window.NexoraBac.close();}catch(_e){}
    try{if(window.NexoraDixieme&&typeof window.NexoraDixieme.close==='function')window.NexoraDixieme.close();}catch(_e){}
    try{if(window.NexoraOrientation&&typeof window.NexoraOrientation.close==='function')window.NexoraOrientation.close();}catch(_e){}
  }
  function openTrainers(context){
    closeLearningViewers();
    if(window.NexoraTrainerCourseLinkV142&&typeof window.NexoraTrainerCourseLinkV142.open==='function'){
      window.NexoraTrainerCourseLinkV142.open(context||'Cours de l’Académie Nexora');
      return;
    }
    var nav=document.querySelector('[data-action="go"][data-screen="trainer"]');
    if(nav)nav.click();
  }
  document.addEventListener('click',function(event){
    var target=event&&event.target;var button=target&&target.closest?target.closest('[data-nx-find-trainer-v142]'):null;
    if(!button)return;
    event.preventDefault();event.stopPropagation();openTrainers(button.getAttribute('data-course-context')||'Cours de l’Académie Nexora');
  },true);
})();
