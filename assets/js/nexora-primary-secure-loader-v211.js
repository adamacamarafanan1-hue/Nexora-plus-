(function(){
  'use strict';
  var loadPromise=null;
  function notify(message){try{if(typeof window.toast==='function')window.toast(message);else console.info(message);}catch(_e){}}
  function ensureLoaded(){if(window.NexoraPrimarySchoolV157)return Promise.resolve(true);if(loadPromise)return loadPromise;if(!window.NexoraSecureContent)return Promise.reject(new Error('Protection des cours indisponible.'));loadPromise=window.NexoraSecureContent.execute('assets/js/nx-v157-primary-school-script.js').then(function(){if(!window.NexoraPrimarySchoolV157)throw new Error('École primaire non initialisée.');return true;}).catch(function(err){loadPromise=null;throw err;});return loadPromise;}
  function openGranted(){ensureLoaded().then(function(){window.NexoraPrimarySchoolV157.open();}).catch(function(err){notify(String(err&&err.message||err));});}
  document.addEventListener('click',function(event){var button=event.target&&event.target.closest?event.target.closest('[data-nx-open-primary-v145]'):null;if(!button)return;event.preventDefault();event.stopImmediatePropagation();if(typeof window.nxRequireSubscriptionAccess==='function')window.nxRequireSubscriptionAccess('modules',openGranted);else notify('Abonnement Nexora requis.');},true);
  window.NexoraPrimarySecureLoaderV211={open:function(){if(typeof window.nxRequireSubscriptionAccess==='function')return window.nxRequireSubscriptionAccess('modules',openGranted);return false;},load:ensureLoaded};
})();
