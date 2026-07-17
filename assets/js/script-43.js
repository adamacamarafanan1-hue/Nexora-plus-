(function(){
  'use strict';
  var viewer=document.getElementById('nxLetterGameViewerV185');
  var frame=document.getElementById('nxLetterGameFrameV185');
  if(!viewer||!frame)return;
  var objectUrl='',isOpen=false,previousOverflow='';
  function notify(message){try{if(typeof window.toast==='function')window.toast(message);}catch(_e){}}
  async function buildGameUrl(){if(!window.NexoraSecureContent)throw new Error('Protection du jeu indisponible.');var html=await window.NexoraSecureContent.text('modules/recherche-lettres/index.html');return URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));}
  async function openGranted(){if(isOpen)return;isOpen=true;previousOverflow=document.body.style.overflow||'';if(viewer.parentElement!==document.body)document.body.appendChild(viewer);document.documentElement.classList.add('nx-letter-game-open-v186');document.body.classList.add('nx-letter-game-open-v186');viewer.hidden=false;try{objectUrl=await buildGameUrl();frame.src=objectUrl;}catch(err){hideGame();notify(String(err&&err.message||err));return;}try{history.pushState({nxLetterGameV185:true},'',location.href);}catch(_err){}var closeBtn=viewer.querySelector('[data-nx-close-letter-game-v185]');if(closeBtn)setTimeout(function(){closeBtn.focus();},40);}
  function openGame(){if(typeof window.nxRequireSubscriptionAccess==='function')window.nxRequireSubscriptionAccess('modules',openGranted);else notify('Abonnement Nexora requis.');}
  function hideGame(){if(!isOpen)return;isOpen=false;viewer.hidden=true;frame.src='about:blank';if(objectUrl&&/^blob:/i.test(objectUrl))URL.revokeObjectURL(objectUrl);objectUrl='';document.documentElement.classList.remove('nx-letter-game-open-v186');document.body.classList.remove('nx-letter-game-open-v186');document.body.style.overflow=previousOverflow;}
  function requestClose(){if(history.state&&history.state.nxLetterGameV185){history.back();return;}hideGame();}
  document.addEventListener('click',function(event){var opener=event.target.closest('[data-nx-open-letter-game-v185]');if(opener){event.preventDefault();openGame();return;}if(event.target.closest('[data-nx-close-letter-game-v185]')){event.preventDefault();requestClose();}});
  window.addEventListener('popstate',function(){if(isOpen)hideGame();});
  document.addEventListener('keydown',function(event){if(isOpen&&event.key==='Escape')requestClose();});
  window.addEventListener('nexora:premium-revoked',hideGame);
  window.addEventListener('beforeunload',function(){if(objectUrl&&/^blob:/i.test(objectUrl))URL.revokeObjectURL(objectUrl);});
})();
