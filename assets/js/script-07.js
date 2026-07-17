
(function(){
  'use strict';

  var NEXORA_RESET_SUPABASE_URL = 'https://lzypxingcykvgxdifccq.supabase.co';
  var NEXORA_RESET_SUPABASE_ANON_KEY = 'sb_publishable_BOYKDhcighKMhX4k3I6RBw_F-B2jaPY';
  var resetBoxVisible = false;
  var resetClient = null;
  var listenerInstalled = false;
  var sdkLoadPromise = null;
  var recoveryExchangePromise = null;

  function nxResetText(v){ return String(v == null ? '' : v); }

  function nxResetParams(){
    var out = new URLSearchParams();
    try{
      var search = new URLSearchParams(window.location.search || '');
      search.forEach(function(v,k){ out.set(k,v); });
    }catch(e){}
    try{
      var hash = nxResetText(window.location.hash).replace(/^#/, '');
      if (hash) {
        var hashParams = new URLSearchParams(hash);
        hashParams.forEach(function(v,k){ out.set(k,v); });
      }
    }catch(e){}
    return out;
  }

  function nxResetHasRecoverySignal(){
    var params = nxResetParams();
    var p = nxResetText(window.location.pathname).toLowerCase();
    var type = nxResetText(params.get('type')).toLowerCase();
    var hasToken = !!(params.get('access_token') || params.get('refresh_token'));
    var hasCode = !!params.get('code');
    var resetPath = p.indexOf('reset-password') !== -1 || p.indexOf('update-password') !== -1 || p.indexOf('mot-de-passe') !== -1;
    return type === 'recovery' || hasToken || resetPath || hasCode;
  }

  function nxResetLoadScript(url){
    return new Promise(function(resolve,reject){
      try{
        if (window.supabase && typeof window.supabase.createClient === 'function') return resolve(true);
        var existing = document.querySelector('script[data-nx-reset-sdk="'+url+'"]');
        if (existing) {
          existing.addEventListener('load', function(){ resolve(true); }, {once:true});
          existing.addEventListener('error', function(){ reject(new Error('SDK Supabase indisponible.')); }, {once:true});
          return;
        }
        var s = document.createElement('script');
        var done = false;
        var timer = setTimeout(function(){
          if (done) return;
          done = true;
          try{s.remove();}catch(e){}
          reject(new Error('Chargement Supabase trop lent.'));
        }, 9000);
        s.src = url;
        s.async = true;
        s.defer = true;
        s.crossOrigin = 'anonymous';
        s.referrerPolicy = 'no-referrer';
        s.setAttribute('data-nx-reset-sdk', url);
        s.onload = function(){ if(done) return; done = true; clearTimeout(timer); resolve(true); };
        s.onerror = function(){ if(done) return; done = true; clearTimeout(timer); reject(new Error('SDK Supabase indisponible.')); };
        document.head.appendChild(s);
      }catch(err){ reject(err); }
    });
  }

  function nxResetEnsureSupabase(){
    if (window.supabase && typeof window.supabase.createClient === 'function') return Promise.resolve(true);
    if (sdkLoadPromise) return sdkLoadPromise;
    sdkLoadPromise = nxResetLoadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')
      .catch(function(){ return nxResetLoadScript('https://unpkg.com/@supabase/supabase-js@2'); });
    return sdkLoadPromise;
  }

  async function nxResetGetClientAsync(){
    await nxResetEnsureSupabase();
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    if (!resetClient) {
      resetClient = window.supabase.createClient(
        NEXORA_RESET_SUPABASE_URL,
        NEXORA_RESET_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
          }
        }
      );
    }
    return resetClient;
  }

  function nxResetCleanUrl(){
    try{
      var clean = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, clean);
    }catch(e){}
  }

  function nxResetShowMessage(text, danger){
    var msg = document.getElementById('nxResetPasswordMsg');
    if (!msg) return;
    msg.textContent = text || '';
    msg.style.color = danger ? '#B91C1C' : '#166534';
  }

  function nxResetClose(){
    var overlay = document.getElementById('nxResetPasswordOverlay');
    if (overlay) overlay.remove();
    resetBoxVisible = false;
  }

  function nxResetGoToLogin(){
    try{ if (typeof setAuthMode === 'function') setAuthMode('login'); }catch(e){}
    try{ if (typeof showScreen === 'function') showScreen('auth'); }catch(e){}
    try{
      var authCard = document.querySelector('[data-auth-card], .auth-card, #authScreen, #loginScreen');
      if (authCard && authCard.scrollIntoView) authCard.scrollIntoView({behavior:'smooth', block:'center'});
    }catch(e){}
  }

  async function nxResetPrepareRecoverySession(){
    if (recoveryExchangePromise) return recoveryExchangePromise;
    recoveryExchangePromise = (async function(){
      var client = await nxResetGetClientAsync();
      if (!client || !client.auth) throw new Error('Connexion Supabase indisponible.');

      try{
        if (client.auth.getSession) {
          var current = await client.auth.getSession();
          if (current && current.data && current.data.session && current.data.session.access_token) return true;
        }
      }catch(e){}

      var params = nxResetParams();
      var code = params.get('code');
      if (code && client.auth.exchangeCodeForSession) {
        var exchanged = await client.auth.exchangeCodeForSession(code);
        if (exchanged && exchanged.error) throw exchanged.error;
        return true;
      }
      return true;
    })();
    return recoveryExchangePromise;
  }

  function nxResetPasswordLooksStrong(p){
    if (!p || p.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (/\s/.test(p)) return 'Évite les espaces dans le mot de passe.';
    if (!/[A-Za-zÀ-ÿ]/.test(p) || !/[0-9]/.test(p)) return 'Utilise au moins une lettre et un chiffre.';
    return '';
  }

  function nxResetFriendlyError(err){
    var msg = nxResetText(err && err.message ? err.message : err).replace(/\s+/g,' ').trim();
    var low = msg.toLowerCase();
    if (!msg) return 'Erreur inconnue.';
    if (low.indexOf('expired') !== -1 || low.indexOf('invalid') !== -1 || low.indexOf('otp') !== -1 || low.indexOf('token') !== -1 || low.indexOf('code') !== -1) {
      return 'Le lien de réinitialisation est expiré ou déjà utilisé. Renvoie un nouveau lien depuis Supabase.';
    }
    if (low.indexOf('session') !== -1) return 'Session de récupération introuvable. Recharge Nexora depuis le lien reçu par email.';
    if (low.indexOf('network') !== -1 || low.indexOf('fetch') !== -1) return 'Connexion réseau instable. Réessaie dans quelques secondes.';
    return msg.slice(0,180);
  }

  function nxResetShowScreen(){
    if (resetBoxVisible) return;
    resetBoxVisible = true;

    if (!document.getElementById('nxResetPasswordStyle')) {
      var style = document.createElement('style');
      style.id = 'nxResetPasswordStyle';
      style.textContent =
        '.nx-reset-overlay{position:fixed;inset:0;z-index:999999;background:linear-gradient(135deg,rgba(7,21,47,.97),rgba(29,78,216,.95));display:grid;place-items:center;padding:18px;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
        '.nx-reset-card{width:min(100%,430px);background:#fff;border-radius:28px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.7)}' +
        '.nx-reset-logo{width:62px;height:62px;border-radius:20px;background:linear-gradient(135deg,#2563EB,#1D4ED8,#D97706);display:grid;place-items:center;color:#fff;font-weight:950;font-size:24px;margin:0 auto 14px}' +
        '.nx-reset-title{text-align:center;margin:0;color:#0F172A;font-size:23px;font-weight:950;letter-spacing:-.03em}' +
        '.nx-reset-sub{text-align:center;margin:8px 0 18px;color:#64748B;font-weight:700;line-height:1.45}' +
        '.nx-reset-field{display:grid;gap:7px;margin:12px 0}' +
        '.nx-reset-label{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#64748B;font-weight:900}' +
        '.nx-reset-input{width:100%;min-height:48px;border:1.5px solid #CBD5E1;border-radius:16px;padding:12px 13px;font:inherit;font-weight:800;outline:none;color:#0F172A;background:#fff}' +
        '.nx-reset-input:focus{border-color:#2563EB;box-shadow:0 0 0 4px rgba(37,99,235,.12)}' +
        '.nx-reset-btn{width:100%;min-height:50px;border:0;border-radius:16px;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;font-weight:950;font-size:15px;margin-top:10px;cursor:pointer}' +
        '.nx-reset-btn:disabled{opacity:.7;cursor:not-allowed}' +
        '.nx-reset-secondary{width:100%;min-height:42px;border:1px solid #CBD5E1;border-radius:14px;background:#F8FAFC;color:#334155;font-weight:900;margin-top:9px;cursor:pointer}' +
        '.nx-reset-msg{min-height:20px;text-align:center;margin-top:12px;font-size:13px;font-weight:850;line-height:1.45}' +
        '.nx-reset-note{margin-top:12px;background:#EFF6FF;border:1px solid #BFDBFE;color:#1E3A8A;border-radius:16px;padding:11px;font-size:12.5px;font-weight:750;line-height:1.45}';
      document.head.appendChild(style);
    }

    var overlay = document.createElement('div');
    overlay.id = 'nxResetPasswordOverlay';
    overlay.className = 'nx-reset-overlay';
    overlay.innerHTML =
      '<div class="nx-reset-card" role="dialog" aria-modal="true" aria-label="Réinitialisation du mot de passe Nexora">' +
        '<div class="nx-reset-logo">N</div>' +
        '<h1 class="nx-reset-title">Créer un nouveau mot de passe</h1>' +
        '<p class="nx-reset-sub">Entre un nouveau mot de passe pour sécuriser ton compte Nexora.</p>' +
        '<div class="nx-reset-field">' +
          '<label class="nx-reset-label" for="nxResetPassword1">Nouveau mot de passe</label>' +
          '<input id="nxResetPassword1" class="nx-reset-input" type="password" autocomplete="new-password" placeholder="Minimum 8 caractères, lettres et chiffres">' +
        '</div>' +
        '<div class="nx-reset-field">' +
          '<label class="nx-reset-label" for="nxResetPassword2">Confirmer le mot de passe</label>' +
          '<input id="nxResetPassword2" class="nx-reset-input" type="password" autocomplete="new-password" placeholder="Répète le mot de passe">' +
        '</div>' +
        '<button id="nxResetPasswordBtn" class="nx-reset-btn" type="button">Enregistrer le nouveau mot de passe</button>' +
        '<button id="nxResetPasswordCancel" class="nx-reset-secondary" type="button">Annuler</button>' +
        '<div id="nxResetPasswordMsg" class="nx-reset-msg" aria-live="polite"></div>' +
        '<div class="nx-reset-note">Après validation, reconnecte-toi avec ton email et ton nouveau mot de passe.</div>' +
      '</div>';

    document.body.appendChild(overlay);
    nxResetShowMessage('Préparation sécurisée du lien…', false);
    nxResetPrepareRecoverySession().then(function(){
      nxResetShowMessage('Lien prêt. Choisis ton nouveau mot de passe.', false);
    }).catch(function(err){
      nxResetShowMessage(nxResetFriendlyError(err), true);
    });

    setTimeout(function(){
      var first = document.getElementById('nxResetPassword1');
      if (first) first.focus();
    }, 200);

    var cancel = document.getElementById('nxResetPasswordCancel');
    if (cancel) {
      cancel.onclick = function(){
        nxResetCleanUrl();
        nxResetClose();
        nxResetGoToLogin();
      };
    }

    var submit = async function(){
      var btn = document.getElementById('nxResetPasswordBtn');
      var p1El = document.getElementById('nxResetPassword1');
      var p2El = document.getElementById('nxResetPassword2');
      var p1 = p1El && p1El.value ? p1El.value : '';
      var p2 = p2El && p2El.value ? p2El.value : '';
      var weak = nxResetPasswordLooksStrong(p1);

      if (!p1 || !p2) { nxResetShowMessage('Entre et confirme le nouveau mot de passe.', true); return; }
      if (weak) { nxResetShowMessage(weak, true); return; }
      if (p1 !== p2) { nxResetShowMessage('Les deux mots de passe ne sont pas identiques.', true); return; }

      try{
        if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement en cours…'; }
        nxResetShowMessage('Validation sécurisée en cours…', false);

        var client = await nxResetGetClientAsync();
        await nxResetPrepareRecoverySession();
        if (!client || !client.auth || typeof client.auth.updateUser !== 'function') throw new Error('Supabase Auth est indisponible.');

        var res = await client.auth.updateUser({ password: p1 });
        if (res && res.error) throw res.error;

        nxResetShowMessage('Mot de passe modifié avec succès. Tu peux maintenant te reconnecter.', false);
        try{ if (client.auth && typeof client.auth.signOut === 'function') await client.auth.signOut(); }catch(e){}
        nxResetCleanUrl();
        setTimeout(function(){ nxResetClose(); nxResetGoToLogin(); }, 1600);
      }catch(err){
        nxResetShowMessage(nxResetFriendlyError(err), true);
      }finally{
        if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer le nouveau mot de passe'; }
      }
    };

    var btn = document.getElementById('nxResetPasswordBtn');
    if (btn) btn.onclick = submit;
    overlay.addEventListener('keydown', function(e){
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') { nxResetCleanUrl(); nxResetClose(); nxResetGoToLogin(); }
    });
  }

  async function nxResetInstallListener(){
    if (listenerInstalled) return;
    try{
      var client = await nxResetGetClientAsync();
      if (!client || !client.auth || typeof client.auth.onAuthStateChange !== 'function') return;
      listenerInstalled = true;
      client.auth.onAuthStateChange(function(event){
        if (event === 'PASSWORD_RECOVERY') nxResetShowScreen();
      });
    }catch(e){}
  }

  function nxResetBoot(){
    nxResetInstallListener();
    if (nxResetHasRecoverySignal()) nxResetShowScreen();
    setTimeout(function(){ nxResetInstallListener(); if (nxResetHasRecoverySignal()) nxResetShowScreen(); }, 900);
    setTimeout(function(){ nxResetInstallListener(); }, 2200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', nxResetBoot);
  else nxResetBoot();
})();

