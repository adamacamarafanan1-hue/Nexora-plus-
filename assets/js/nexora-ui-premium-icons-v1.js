
(function(){
  'use strict';
  var ICONS={
    home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    message:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    user:'<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    radio:'<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.48"/><path d="M7.76 16.24a6 6 0 0 1 0-8.48"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/>',
    help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.8 1c-.8 1.3-2.4 1.6-2.4 3"/><path d="M12 17h.01"/>',
    mic:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
    play:'<path d="m8 5 11 7-11 7Z"/>',
    camera:'<path d="M14.5 4 13 2h-2L9.5 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"/><circle cx="12" cy="12" r="4"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 16-5-5L5 21"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    megaphone:'<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    alert:'<path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    sparkles:'<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>',
    building:'<path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 8h1"/><path d="M14 8h1"/><path d="M9 12h1"/><path d="M14 12h1"/><path d="M9 16h1"/><path d="M14 16h1"/>',
    lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    trophy:'<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M5 5H3a3 3 0 0 0 3 3h1"/><path d="M19 5h2a3 3 0 0 1-3 3h-1"/>',
    globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 0 20"/><path d="M12 2a15.3 15.3 0 0 0 0 20"/>',
    rocket:'<path d="M4.5 16.5c-1 1-1.5 2.5-1.5 4.5 2 0 3.5-.5 4.5-1.5"/><path d="M9 15 4 10l5-1 6-6c3 0 6 3 6 6l-6 6-1 5z"/><path d="M15 9h.01"/>',
    briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 12h20"/>',
    graduation:'<path d="m22 10-10-5-10 5 10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
    lightbulb:'<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c.7.6 1 1.3 1 2h6c0-.7.3-1.4 1-2A7 7 0 0 0 12 2z"/>',
    landmark:'<path d="M3 21h18"/><path d="M5 10h14"/><path d="M6 10v8"/><path d="M10 10v8"/><path d="M14 10v8"/><path d="M18 10v8"/><path d="M12 3 4 8h16z"/>',
    heartpulse:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/><path d="M3 12h4l2-3 3 6 2-3h7"/>',
    leaf:'<path d="M11 20A7 7 0 0 1 4 13c0-6 8-9 16-9 0 8-3 16-9 16z"/><path d="M4 20c4-8 10-10 16-16"/>',
    palette:'<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2a10 10 0 0 0 0 20h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h3a7 7 0 0 0 0-14z"/>',
    send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    settings:'<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V22a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 6.1 3.1l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 9.8 2V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    refresh:'<path d="M21 12a9 9 0 0 1-15.5 6.4L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.5 5.6L21 8"/><path d="M21 3v5h-5"/>',
    phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9z"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.2-1.2"/>',
    pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    trash:'<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    flag:'<path d="M4 22V4"/><path d="M4 4h12l-1 4 1 4H4"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    chart:'<path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-3"/>',
    eye:'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    volumex:'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m23 9-6 6"/><path d="m17 9 6 6"/>',
    volume:'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    sliders:'<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M2 14h4"/><path d="M10 8h4"/><path d="M18 16h4"/>',
    video:'<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
    music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21 7 14.2 2 9.3l6.9-1z"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    frown:'<circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    thumbs:'<path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/><path d="M7 22V10l5-8 1 1a4 4 0 0 1 1 3l-.7 4H19a3 3 0 0 1 3 3l-2 7a3 3 0 0 1-3 2z"/>',
    clap:'<path d="M8 11V5a2 2 0 1 1 4 0v5"/><path d="M12 10V4a2 2 0 1 1 4 0v8"/><path d="M16 12V7a2 2 0 1 1 4 0v7a8 8 0 0 1-16 0v-3a2 2 0 1 1 4 0"/>',
    tag:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
    arrowup:'<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    reply:'<path d="m9 17-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
    circle:'<circle cx="12" cy="12" r="9"/>',
    menu:'<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  };
  var EMOJI={
    '🏠':'home','🤝':'users','💬':'message','✍️':'edit','✍':'edit','🔔':'bell','👤':'user','🔎':'search','🔴':'radio','●':'radio','⚖️':'landmark','⚖':'landmark','🆘':'help','🎤':'mic','▶':'play','📷':'camera','🖼️':'image','🖼':'image','🌄':'image','📧':'mail','✉️':'mail','✉':'mail','📣':'megaphone','⚠️':'alert','⚠':'alert','✨':'sparkles','🏢':'building','🔒':'lock','🔐':'lock','🏆':'trophy','🌍':'globe','🌐':'globe','🚀':'rocket','💼':'briefcase','🎓':'graduation','📘':'book','📚':'book','💡':'lightbulb','🏛️':'landmark','🏛':'landmark','🩺':'heartpulse','🌾':'leaf','🎭':'palette','⚽':'circle','🌱':'leaf','🔄':'refresh','⏳':'refresh','📱':'user','👏':'clap','👍':'thumbs','❤️':'heart','❤':'heart','😥':'frown','⭐':'star','★':'star','☆':'star','🔗':'link','🏷️':'tag','🏷':'tag','📞':'phone','📌':'pin','📍':'pin','📅':'calendar','🧹':'trash','✅':'check','✓':'check','🟢':'check','🟡':'refresh','⚪':'circle','🔊':'volume','🔇':'volumex','🎛️':'sliders','🎛':'sliders','🎥':'video','🎙️':'mic','🎙':'mic','🎵':'music','👁️':'eye','👁':'eye','🚫':'x','📜':'file','📄':'file','🧾':'database','🛡️':'shield','🛡':'shield','🎨':'palette','📊':'chart','✏️':'edit','✏':'edit','🗑️':'trash','🗑':'trash','🚩':'flag','↗':'arrowup','↩️':'reply','↩':'reply','☰':'menu','➤':'send','🙏':'users'
  };
  var SKIP='script,style,noscript,textarea,input,select,option,[contenteditable="true"],.post-body,.comment-text,.message-text,.story-caption,.story-text,.user-content,[data-preserve-emoji]';
  var ICON_HOLDERS='.nav-icon,.btn-icon,.media-btn-icon,.post-action-icon,.notif-icon,.empty-icon,.network-search-icon,.global-search-icon,.message-alert-toast-icon,.share-option-icon,.sync-advisory-icon,.account-hero-icon,.action-dialog-icon,.nx-notify-hero-icon,.page-logo-empty-icon,.composer-media-icon,.direct-preview-icon,.feed-empty-icon-pro,.onboarding-step-icon,.message-top-alert-icon,.profile-tab-icon,.sponsor-contact-number,.sponsor-strip-title';
  function svg(name){name=String(name||'circle').toLowerCase(); var d=ICONS[name]||ICONS.circle; return '<svg class="nx-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+d+'</svg>';}
  function setIcon(el,name){if(!el||!name) return; var current=el.getAttribute('data-nx-rendered-icon'); if(current===name) return; el.setAttribute('data-nx-icon',name); el.setAttribute('data-nx-rendered-icon',name); el.innerHTML=svg(name);}
  function iconFromText(text){text=String(text||'').trim(); return EMOJI[text]||'';}
  function decorateIconHolders(root){
    if(!root||!root.querySelectorAll) return;
    root.querySelectorAll('[data-nx-icon]').forEach(function(el){setIcon(el,el.getAttribute('data-nx-icon'));});
    root.querySelectorAll(ICON_HOLDERS).forEach(function(el){
      if(el.closest(SKIP)) return;
      var name=el.getAttribute('data-nx-icon')||iconFromText(el.textContent);
      if(name) setIcon(el,name);
    });
    root.querySelectorAll('.message-send-btn').forEach(function(btn){
      if(btn.getAttribute('data-iconified')==='true') return;
      btn.setAttribute('data-iconified','true');
      btn.innerHTML='<span data-nx-icon="send" aria-hidden="true"></span><span class="nx-send-label">Envoyer</span>';
      var icon=btn.querySelector('[data-nx-icon]'); if(icon) setIcon(icon,'send');
    });
  }
  function hasEmojiText(text){
    if(!text) return false;
    for(var k in EMOJI){ if(text.indexOf(k)>-1) return true; }
    return false;
  }
  var keys=Object.keys(EMOJI).sort(function(a,b){return b.length-a.length});
  function replaceTextNode(node){
    var parent=node&&node.parentElement; if(!parent||parent.closest(SKIP)) return;
    var text=node.nodeValue||''; if(!hasEmojiText(text)) return;
    var frag=document.createDocumentFragment(); var i=0; var changed=false;
    while(i<text.length){
      var hit='';
      for(var j=0;j<keys.length;j++){var k=keys[j]; if(text.slice(i,i+k.length)===k){hit=k; break;}}
      if(hit){
        var span=document.createElement('span'); span.className='nx-emoji-icon'; span.setAttribute('aria-hidden','true'); span.setAttribute('data-nx-icon',EMOJI[hit]); span.innerHTML=svg(EMOJI[hit]); frag.appendChild(span); i+=hit.length; changed=true;
      }else{
        var ch=Array.from(text.slice(i))[0]; frag.appendChild(document.createTextNode(ch)); i+=ch.length;
      }
    }
    if(changed) parent.replaceChild(frag,node);
  }
  function replaceEmojiText(root){
    if(!root) return;
    if(root.nodeType===3){replaceTextNode(root); return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11) return;
    if(root.matches&&root.matches(SKIP)) return;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      var p=node.parentElement; if(!p||p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
      return hasEmojiText(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;
    }});
    var nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceTextNode);
  }
  function apply(root){try{root=root||document.body; decorateIconHolders(root); replaceEmojiText(root); decorateIconHolders(root);}catch(e){}}
  window.NexoraIcons={svg:svg,apply:apply,setIcon:setIcon,emojiMap:EMOJI};
  function boot(){
    apply(document.body);
    try{if(window.NexoraMediaSecurity)window.NexoraMediaSecurity.tune(document);}catch(_e){}
    try{if(window.NexoraVisibleCleanup)window.NexoraVisibleCleanup.apply(document);}catch(_e){}
    var queued=false;
    var obs=new MutationObserver(function(muts){
      if(queued) return; queued=true;
      requestAnimationFrame(function(){queued=false; muts.forEach(function(m){
        if(m.type==='characterData') apply(m.target.parentElement||document.body);
        else if(m.addedNodes&&m.addedNodes.length){m.addedNodes.forEach(function(n){
          apply(n);
          try{if(window.NexoraMediaSecurity)window.NexoraMediaSecurity.tune(n);}catch(_e){}
          try{if(window.NexoraVisibleCleanup)window.NexoraVisibleCleanup.apply(n);}catch(_e){}
        });}
      });});
    });
    obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();

