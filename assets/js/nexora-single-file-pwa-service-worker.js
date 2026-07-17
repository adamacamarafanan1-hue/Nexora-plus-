
(function(){
  'use strict';
  try{
    if(!('serviceWorker' in navigator))return;
    if(location.protocol!=='https:'&&location.hostname!=='localhost'&&location.hostname!=='127.0.0.1')return;
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('service-worker.js',{scope:'./'}).catch(function(err){
        console.warn('Mode hors connexion Nexora non activé.',err);
      });
    },{once:true});
  }catch(err){console.warn('Initialisation PWA non bloquante.',err);}
})();

