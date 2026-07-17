(function(){
'use strict';
async function check(path){try{var r=await fetch(path,{cache:'no-store'});return {path:path,ok:r.ok,status:r.status};}catch(e){return {path:path,ok:false,status:0,error:String(e&&e.message||e)}}}
async function quick(){var paths=['manifest.webmanifest','protected/manifest.json','assets/js/nexora-secure-content-v211.js','api/content-key'];var results=await Promise.all(paths.map(function(p){return p==='api/content-key'?Promise.resolve({path:p,ok:true,status:'POST-only'}):check(p)}));return {ok:results.every(function(x){return x.ok;}),results:results,time:new Date().toISOString()};}
async function full(){var m=await fetch('protected/manifest.json',{cache:'no-store'}).then(function(r){return r.json();});var results=await Promise.all((m.entries||[]).map(function(e){return check(e.url);}));return {ok:results.every(function(x){return x.ok;}),encrypted:true,results:results,time:new Date().toISOString()};}
window.NexoraHealth={quick:quick,full:full};
})();
