
(function(){
  'use strict';
  var root=null,timer=null,channel=null,busy=false,lastCampaignId='';
  function online(){return typeof navigator==='undefined'||navigator.onLine!==false}
  function connectionMessage(){return 'KDO nécessite une connexion Internet active. Les parties hors connexion restent disponibles, mais leurs points ne participent pas au classement KDO.'}
  function notify(message){try{if(typeof window.toast==='function'){window.toast(message);return}}catch(_e){}try{console.info('[Nexora KDO]',message)}catch(_e){}}
  function q(sel){return (root||document).querySelector(sel)}
  function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]})}
  function client(){try{return window.NexoraApp&&typeof window.NexoraApp.getSupabaseClient==='function'?window.NexoraApp.getSupabaseClient():null}catch(_e){return null}}
  function unpack(value){if(value&&value.data!==undefined)value=value.data;if(Array.isArray(value)&&value.length===1)value=value[0];if(typeof value==='string'){try{value=JSON.parse(value)}catch(_e){}}return value||{}}
  function fmtDate(v){if(!v)return '—';try{return new Date(v).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}catch(_e){return '—'}}
  function fmtTime(v){try{return new Date(v||Date.now()).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch(_e){return '—'}}
  function initials(name){return String(name||'NX').trim().split(/\s+/).slice(0,2).map(function(x){return x.charAt(0)}).join('').toUpperCase()||'NX'}
  function remaining(end,status){if(status==='completed')return 'Défi terminé';var ms=new Date(end||0).getTime()-Date.now();if(!isFinite(ms)||ms<=0)return 'Période terminée';var days=Math.floor(ms/86400000),hours=Math.floor((ms%86400000)/3600000);if(days>0)return days+' j '+hours+' h restants';var min=Math.max(0,Math.floor((ms%3600000)/60000));return hours+' h '+min+' min restantes'}
  function show(name){['loading','empty','content','error'].forEach(function(k){var el=q('[data-nx-kdo-'+k+']');if(el)el.hidden=k!==name})}
  function setLive(ok,label){var pill=q('[data-nx-kdo-live]'),copy=q('[data-nx-kdo-live-status]');if(pill)pill.classList.toggle('offline',!ok);if(copy)copy.textContent=label||(ok?'Classement en direct':'Reconnexion…')}
  function render(data){
    data=unpack(data);var campaign=data.campaign||null;
    if(!campaign){show('empty');setLive(true,'En attente du prochain KDO');return}
    show('content');lastCampaignId=String(campaign.id||'');
    var image=q('[data-nx-kdo-image]');if(image){var url=String(campaign.image_url||'').trim();image.innerHTML=url?'<img src="'+esc(url)+'" alt="'+esc(campaign.title||'Cadeau Nexora')+'">':'<span>KDO</span>'}
    var set=function(sel,val){var el=q(sel);if(el)el.textContent=val==null?'':String(val)};
    var target=Math.max(1,Number(campaign.target_points||1));
    set('[data-nx-kdo-title]',campaign.title||'Cadeau Nexora');
    set('[data-nx-kdo-description]',campaign.description||'Les points gagnés pendant la campagne sont additionnés automatiquement, partie après partie.');
    set('[data-nx-kdo-type]',campaign.gift_type||'Cadeau Nexora');
    set('[data-nx-kdo-target]',target);
    set('[data-nx-kdo-time]',remaining(campaign.ends_at,campaign.status));
    set('[data-nx-kdo-example-games]',Math.ceil(target/50)+' partie'+(Math.ceil(target/50)>1?'s':''));
    var status=q('[data-nx-kdo-status]');if(status){var completed=campaign.status==='completed'||!!campaign.winner_user_id;status.textContent=completed?'Champion désigné':'Défi actif';status.classList.toggle('completed',completed)}
    var me=data.me||{},mine=Math.max(0,Number(me.points||0)),pct=Math.min(100,Math.round(mine*100/target));
    set('[data-nx-kdo-my-points]',mine);set('[data-nx-kdo-my-target]',target);var bar=q('[data-nx-kdo-my-bar]');if(bar)bar.style.width=pct+'%';
    set('[data-nx-kdo-my-message]',mine>=target?'Objectif atteint. Vérifie le champion affiché.':(mine?'Encore '+Math.max(0,target-mine)+' points. Tes prochaines bonnes réponses s’ajouteront à ce total.':'Commence une partie : chaque bonne réponse ajoutera 1 point.'));
    var champion=data.champion||null,champ=q('[data-nx-kdo-champion]');if(champ){champ.hidden=!champion;if(champion){set('[data-nx-kdo-winner-name]',champion.name||'Champion Nexora');set('[data-nx-kdo-winner-points]',champion.points||campaign.winner_points||target);set('[data-nx-kdo-winner-date]',fmtDate(champion.reached_at||campaign.winner_reached_at))}}
    var list=Array.isArray(data.leaderboard)?data.leaderboard:[],box=q('[data-nx-kdo-leaderboard]');set('[data-nx-kdo-player-count]',list.length+' joueur'+(list.length>1?'s':''));
    if(box){box.innerHTML=list.length?list.map(function(p,i){var photo=String(p.avatar_url||'').trim(),rank=i+1,points=Math.max(0,Number(p.points||0)),games=Math.max(0,Number(p.games_played||0)),last=Math.max(0,Number(p.last_score||0));return '<article class="nx-kdo-player-v174 '+(rank<=3?'top':'')+'"><span class="nx-kdo-rank-v174">'+rank+'</span><span class="nx-kdo-avatar-v174">'+(photo?'<img src="'+esc(photo)+'" alt="">':esc(initials(p.name)))+'</span><div class="nx-kdo-player-copy-v174"><strong>'+esc(p.name||'Joueur Nexora')+(p.is_me?' · Vous':'')+'</strong><small>'+games+' partie'+(games>1?'s':'')+' cumulée'+(games>1?'s':'')+'</small><small class="nx-kdo-player-last-v204">Dernière partie : +'+last+' point'+(last>1?'s':'')+'</small></div><div class="nx-kdo-player-points-v174"><b>'+points+'</b><small>points cumulés</small></div></article>'}).join(''):'<div class="nx-kdo-board-empty-v174">Aucun joueur classé pour le moment. Sois le premier à jouer.</div>'}
    set('[data-nx-kdo-last-update]','Dernière actualisation : '+fmtTime(Date.now()));setLive(true,'Classement en direct');
  }
  async function load(silent){
    if(busy)return;busy=true;root=document.querySelector('[data-nx-kdo-root]');if(!root){busy=false;return}
    if(!online()){show('error');setLive(false,'Connexion obligatoire');var offlineText=q('[data-nx-kdo-error-text]');if(offlineText)offlineText.textContent=connectionMessage();busy=false;return}
    if(!silent)show('loading');
    try{var c=client();if(!c)throw new Error('Connexion Supabase indisponible.');var res=await c.rpc('nexora_kdo_current',{p_limit:5000});if(res.error)throw res.error;render(res.data)}catch(err){console.error('KDO Nexora',err);setLive(false,'Reconnexion…');if(!silent){show('error');var e=q('[data-nx-kdo-error-text]');if(e)e.textContent=String(err&&err.message||err||'SQL KDO indisponible.')}}finally{busy=false}
  }
  function subscribe(){if(!online()){setLive(false,'Connexion obligatoire');return}var c=client();if(!c||typeof c.channel!=='function'){setLive(false,'Temps réel indisponible');return}try{if(channel&&typeof c.removeChannel==='function')c.removeChannel(channel);channel=c.channel('nexora-kdo-v204').on('postgres_changes',{event:'*',schema:'public',table:'nexora_kdo_campaigns'},function(){load(true)}).on('postgres_changes',{event:'*',schema:'public',table:'nexora_kdo_progress'},function(){load(true)}).subscribe(function(status){if(status==='SUBSCRIBED'){setLive(true,'Classement en direct');load(true)}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED')setLive(false,'Reconnexion…')})}catch(_e){setLive(false,'Reconnexion…')}}
  function openGame(){if(!online()){notify(connectionMessage());return}try{if(window.NexoraApp&&typeof window.NexoraApp.go==='function'){window.NexoraApp.go('adams');return}}catch(_e){}var b=document.querySelector('[data-action="go"][data-screen="adams"]');if(b)b.click()}
  document.addEventListener('click',function(e){var t=e.target.closest('[data-nx-kdo-play],[data-nx-kdo-refresh],[data-action="go"][data-screen="access"]');if(!t)return;if(t.hasAttribute('data-nx-kdo-play')){e.preventDefault();openGame();return}if(t.hasAttribute('data-nx-kdo-refresh')){e.preventDefault();load(false);return}if(t.matches('[data-action="go"][data-screen="access"]'))setTimeout(function(){load(false);subscribe()},80)});
  window.addEventListener('nexora:adams-result',function(){if(!online())return;setTimeout(function(){load(true)},700);setTimeout(function(){load(true)},1700)});
  document.addEventListener('visibilitychange',function(){if(!document.hidden){load(true);subscribe()}});
  window.addEventListener('offline',function(){show('error');setLive(false,'Connexion obligatoire');var e=q('[data-nx-kdo-error-text]');if(e)e.textContent=connectionMessage()});
  window.addEventListener('online',function(){load(false);subscribe()});
  window.NexoraKDO={load:load,refresh:function(){return load(false)}};
  function init(){root=document.querySelector('[data-nx-kdo-root]');if(!root)return;timer=setInterval(function(){var panel=document.getElementById('screen-access');if(panel&&panel.classList.contains('active'))load(true)},5000);if(document.getElementById('screen-access')&&document.getElementById('screen-access').classList.contains('active'))load(false);subscribe()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
