
/* NEXORA V506.0 — KDO chargé uniquement à l’ouverture */
/* ===== assets/js/nexora-individual-challenge.js ===== */
/* NEXORA V457 — inscription KDO gratuite, RPC Supabase stabilisé. */
(function () {
  'use strict';

  var rows = [];
  var selected = null;
  var loading = false;
  var startBusy = false;
  var active = null;
  var channel = null;
  var realtimeTimer = null;
  var approvalPollTimer = null;
  var loadTimer = null;
  var connectionRetryTimer = null;
  var lastRefreshErrorKey = '';
  var lastRefreshErrorAt = 0;
  var verificationTimer = null;
  var verificationPending = false;
  var confirmBusy = false;
  var finishBusy = false;
  var wakeLock = null;
  var PROGRESS_PREFIX_V395 = 'nexora-individual-progress-v395:';
  var resumeReplayBusyV395 = false;

  function officialGameActive() {
    var context = window.__NEXORA_ADAMS_PLAY_CONTEXT;
    return !!(context && context.type === 'individual_challenge' && (context.phase === 'prepared' || context.phase === 'started'));
  }
  async function keepScreenAwake() {
    try {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible' || wakeLock) return;
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', function () { wakeLock = null; }, { once: true });
    } catch (_wakeError) { wakeLock = null; }
  }
  function releaseScreenAwake() {
    try { if (wakeLock) wakeLock.release().catch(function () {}); } catch(_wakeError){window.nxLog&&window.nxLog(_wakeError)}
    wakeLock = null;
  }

  function client() {
    try {
      return window.NexoraApp && typeof window.NexoraApp.getSupabaseClient === 'function'
        ? window.NexoraApp.getSupabaseClient()
        : null;
    } catch (_error) {
      return null;
    }
  }

  function registry() { return window.NexoraGameRegistry || null; }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function money(value) { return Math.max(0, Number(value || 0)).toLocaleString('fr-FR') + ' GNF'; }
  function unpack(value) {
    if (value && value.data !== undefined) value = value.data;
    if (Array.isArray(value) && value.length === 1) value = value[0];
    if (typeof value === 'string') { try { value = JSON.parse(value); } catch(_error){window.nxLog&&window.nxLog(_error)} }
    return value;
  }
  function notify(message) {
    try { if (typeof window.toast === 'function') return window.toast(message); } catch(_error){window.nxLog&&window.nxLog(_error)}
    try { console.info(message); } catch(_consoleError){window.nxLog&&window.nxLog(_consoleError)}
  }
  function canonical(value) {
    var gameRegistry = registry();
    return gameRegistry ? gameRegistry.resolve(value) : String(value || '').toLowerCase();
  }
  function findRow(id) {
    return rows.find(function (row) { return String(row.id) === String(id); }) || null;
  }
  function progressKeyV395(attemptId) { return PROGRESS_PREFIX_V395 + String(attemptId || ''); }
  function readProgressV395(attemptId) {
    if (!attemptId) return { actions: [], saved_at: 0 };
    try { var value = JSON.parse(localStorage.getItem(progressKeyV395(attemptId)) || '{}'); return { actions: Array.isArray(value.actions) ? value.actions : [], saved_at: Number(value.saved_at || 0) }; }
    catch (_error) { return { actions: [], saved_at: 0 }; }
  }
  function saveProgressActionV395(attemptId, action) {
    if (!attemptId || !action || !action.selector) return;
    var state = readProgressV395(attemptId), actions = state.actions;
    actions.push(action); if (actions.length > 600) actions = actions.slice(actions.length - 600);
    try { localStorage.setItem(progressKeyV395(attemptId), JSON.stringify({ actions: actions, saved_at: Date.now() })); } catch(_error){window.nxLog&&window.nxLog(_error)}
  }
  function clearProgressV395(attemptId) { try { if (attemptId) localStorage.removeItem(progressKeyV395(attemptId)); } catch(_error){window.nxLog&&window.nxLog(_error)} }
  function replayProgressV395(attemptId) {
    if (resumeReplayBusyV395 || !attemptId || !window.NexoraAdamsGames || typeof window.NexoraAdamsGames.replayActions !== 'function') return Promise.resolve();
    var state = readProgressV395(attemptId), actions = state.actions;
    if (!actions.length) return Promise.resolve();
    resumeReplayBusyV395 = true;
    notify('Reprise de votre partie… restauration de la progression.');
    return window.NexoraAdamsGames.replayActions(actions).catch(function () {}).finally(function () { resumeReplayBusyV395 = false; });
  }
  async function rpc(name, args) {
    var supabase = client();
    if (!supabase || typeof supabase.rpc !== 'function') throw new Error('Connexion à Nexora indisponible.');
    var response = await supabase.rpc(name, args || {});
    if (response && response.error) throw response.error;
    return unpack(response && response.data);
  }

  function normalizeAttemptStatus(value) {
    var status = String(value || '').toLowerCase();
    if (status === 'payment_rejected') return 'rejected';
    if (status === 'not_paid') return '';
    return status;
  }

  function mergeV273Access(row, access) {
    var merged = Object.assign({}, row || {});
    if (!access || access.success !== true) return merged;
    merged.v273_access = access;
    merged.v273_can_start = access.can_start === true;
    merged.v273_can_resume = access.can_resume === true;
    merged.v273_button_label = String(access.button_label || '');
    merged.v273_message = String(access.message || '');
    merged.my_attempt_status = normalizeAttemptStatus(access.attempt_status);
    if (access.attempt_id) merged.my_attempt_id = access.attempt_id;
    return merged;
  }

  async function enrichRowWithV273(row) {
    try {
      var access = await rpc('nexora_kdo_my_game_access_v273', { p_challenge_id: row.id });
      return mergeV273Access(row, access);
    } catch (_error) {
      return Object.assign({}, row || {});
    }
  }

  function statusText(row) {
    var status = normalizeAttemptStatus(row.my_attempt_status);
    var score = Number(row.my_score || 0);
    var maxScore = Number(row.max_score || 50);
    var target = Number(row.target_points || 45);
    if (row.v273_message && status) return String(row.v273_message);
    if (status === 'payment_pending') return isFree(row) ? 'Inscription enregistrée, en cours de validation par l’administration.' : 'Inscription enregistrée et paiement de ' + feeLabel(row) + ' en cours de validation par l’administration.';
    if (status === 'approved') return isFree(row) ? 'Inscription validée. Vous pouvez maintenant lancer votre partie.' : 'Inscription et paiement validés. Vous pouvez maintenant lancer votre partie.';
    if (status === 'started') return 'Cette tentative est terminée et ne peut pas être reprise. ' + replaySentence(row);
    if (status === 'won') return 'Résultat : ' + score + '/' + maxScore + '. Objectif atteint.';
    if (status === 'lost') return 'Résultat : ' + score + '/' + maxScore + '. Objectif non atteint.';
    if (status === 'rejected') return isFree(row) ? 'Inscription refusée. Vérifiez vos informations puis envoyez une nouvelle demande.' : 'Paiement refusé. Vérifiez vos informations puis envoyez une nouvelle demande.';
    if (status === 'cancelled') return isFree(row) ? 'Participation annulée. Une nouvelle inscription est nécessaire.' : 'Participation annulée. Une nouvelle inscription et un nouveau paiement sont nécessaires.';
    return '';
  }

  /* V455 : KDO officiellement gratuit. L'ancien tarif Supabase ne doit plus réactiver Orange Money côté interface. */
  function feeOf(_row){ return 0; }
  function isFree(_row){ return true; }
  function feeLabel(row){ return isFree(row) ? '' : money(feeOf(row)); }
  function joinLabel(row){ return isFree(row) ? 'S’inscrire et jouer' : 'S’inscrire et payer ' + feeLabel(row); }
  function replayLabel(row){ return isFree(row) ? 'Nouvelle partie' : 'Nouvelle partie — ' + feeLabel(row); }
  function replaySentence(row){ return isFree(row) ? 'Pour rejouer, une nouvelle inscription suffit.' : 'Pour rejouer, effectuez un nouveau paiement de ' + feeLabel(row) + '.'; }
  function rulesLine(row){ return 'Choisissez une matière · ' + Number(row && row.max_score || 50) + ' questions · 15 secondes'; }

  function actionButton(row) {
    var status = normalizeAttemptStatus(row.my_attempt_status);
    var noGift = Number(row.remaining_winners || 0) <= 0 || String(row.status) === 'completed';
    var replay = escapeHtml(replayLabel(row));
    var subReplay = escapeHtml(isFree(row) ? 'Nouvelle inscription' : 'Nouveau paiement et nouvelle validation');
    if (noGift) return '<button type="button" class="btn nx-individual-enter" disabled>Cadeau terminé</button>';
    if (status === 'won') return '<button type="button" class="btn nx-individual-enter" data-nx-individual-pay="' + escapeHtml(row.id) + '"><span>' + replay + '</span><small>' + subReplay + '</small></button>';
    if (status === 'approved' || row.v273_can_start === true) {
      return '<button type="button" class="btn nx-individual-enter nx-individual-start-ready" data-nx-individual-start="' + escapeHtml(row.id) + '"><span>Commencer le défi</span><small>Choisissez 1 matière · ' + escapeHtml(String(Number(row.max_score || 50))) + ' questions</small></button>';
    }
    if (status === 'payment_pending') return '<button type="button" class="btn nx-individual-enter" disabled><span>Demande envoyée</span><small>Validation administrative en cours</small></button>';
    if (status === 'started' || row.v273_can_resume === true) return '<button type="button" class="btn nx-individual-enter" data-nx-individual-pay="' + escapeHtml(row.id) + '"><span>' + replay + '</span><small>' + subReplay + '</small></button>';
    if (status === 'lost' || status === 'rejected' || status === 'cancelled') {
      return '<button type="button" class="btn nx-individual-enter" data-nx-individual-pay="' + escapeHtml(row.id) + '"><span>' + escapeHtml(isFree(row) ? 'Se réinscrire' : 'Se réinscrire — ' + feeLabel(row)) + '</span><small>Nouvelle tentative</small></button>';
    }
    return '<button type="button" class="btn nx-individual-enter" data-nx-individual-pay="' + escapeHtml(row.id) + '"><span>' + escapeHtml(joinLabel(row)) + '</span><small>Validation obligatoire avant de jouer</small></button>';
  }

  function giftAvailability(row) {
    var remaining = Math.max(0, Number(row.remaining_winners || 0));
    var players = Math.max(0, Number(row.unique_players_count || 0));
    var attempts = Math.max(0, Number(row.total_attempts_count || 0));
    var closed = remaining <= 0 || String(row.status || '') === 'completed';
    if (closed) {
      return '<div class="nx-individual-availability won"><b>Terminé</b><span>Participation fermée.</span></div>';
    }
    if (players > 0) {
      var attemptText = attempts > players ? ' · ' + attempts + ' tentatives' : '';
      var winners = Math.max(0, Number(row.winners_count || 0));
      var detail = winners > 0
        ? remaining + ' gain' + (remaining > 1 ? 's' : '') + ' encore disponible' + (remaining > 1 ? 's' : '') + '.'
        : 'Aucun gagnant pour le moment.';
      return '<div class="nx-individual-availability available"><b>Disponible</b><span>' + players + ' joueur' + (players > 1 ? 's' : '') + attemptText + '. ' + detail + '</span></div>';
    }
    return '<div class="nx-individual-availability available"><b>Disponible</b><span>Aucune partie enregistrée.</span></div>';
  }

  function emptySlot(error) {
    var detail = String(error || 'Publication en attente.');
    var heading = detail.indexOf('Connexion à Nexora') === 0 ? 'Connexion en cours' : detail.indexOf('Connexion internet') === 0 ? 'Connexion indisponible' : 'Aucun cadeau disponible';
    return '<div class="nx-adams-individual-gift nx-adams-individual-gift-empty">' +
      '<div class="nx-adams-individual-gift-media" aria-hidden="true">KDO</div>' +
      '<div class="nx-adams-individual-gift-copy"><small>KDO</small>' +
      '<strong>' + escapeHtml(heading) + '</strong>' +
      '<span>' + escapeHtml(detail) + '</span></div></div>' +
      '<div class="nx-individual-target"><b>—</b><span>Objectif</span></div>' +
      '<div class="nx-adams-individual-actions"><button type="button" class="btn nx-individual-enter" disabled><span>Indisponible</span><small>Aucun KDO</small></button></div>';
  }

  function render(data, error) {
    var slots = Array.prototype.slice.call(document.querySelectorAll('[data-nx-individual-game-slot]'));
    if (!slots.length) return;
    rows = Array.isArray(data) ? data : [];
    var ordered = rows.slice().sort(function(a,b){
      var ad = Date.parse(a && (a.created_at || a.starts_at) || '') || 0;
      var bd = Date.parse(b && (b.created_at || b.starts_at) || '') || 0;
      return bd-ad;
    });
    var activeUnified = ordered.filter(function(row){return Number(row.remaining_winners || 0) > 0 && String(row.status || '') !== 'completed';})[0] || ordered[0] || null;
    var byGame = {};
    rows.forEach(function (row) {
      var key = canonical(row.game_key);
      if (key && !byGame[key]) byGame[key] = row;
    });
    if (activeUnified) byGame.kdo = activeUnified;
    slots.forEach(function (slot) {
      var key = canonical(slot.getAttribute('data-nx-individual-game-slot'));
      var sourceRow = byGame[key] || null;
      if (!sourceRow) { slot.innerHTML = emptySlot(error); return; }
      var row = key === 'kdo' ? Object.assign({}, sourceRow, { game_key:'kdo', game_name:'Défi Nexora KDO' }) : sourceRow;
      var title = String(row.title || 'Cadeau Nexora');
      var image = String(row.image_url || '').trim();
      var target = Number(row.target_points || 45);
      var maxScore = Number(row.max_score || 50);
      var remaining = Math.max(0, Number(row.remaining_winners || 0));
      var status = String(row.my_attempt_status || '');
      var message = statusText(row);
      slot.innerHTML = '<div class="nx-adams-individual-gift"><div class="nx-adams-individual-gift-media">' +
        (image ? '<img loading="lazy" decoding="async" src="' + escapeHtml(image) + '" alt="' + escapeHtml(title) + '">' : 'KDO') +
        '</div><div class="nx-adams-individual-gift-copy"><small>KDO</small><strong>' + escapeHtml(title) + '</strong>' +
        '<span>' + escapeHtml(rulesLine(row)) + '</span>' +
        '<div class="nx-adams-individual-gift-meta"><em>' + remaining + ' gain' + (remaining > 1 ? 's' : '') + ' disponible' + (remaining > 1 ? 's' : '') + '</em></div>' +
        '</div></div>' + giftAvailability(row) +
        '<div class="nx-individual-target"><b>' + target + '/' + maxScore + '</b><span>Objectif</span></div>' +
        (message ? '<div class="nx-individual-status ' + escapeHtml(status) + '" role="status">' + escapeHtml(message) + (status === 'payment_pending' ? '' : '') + '</div>' : '') +
        '<div class="nx-adams-individual-actions">' + actionButton(row) + '</div>';
    });
    try { window.dispatchEvent(new CustomEvent('nexora:kdo-cards-updated')); } catch(_eventError){window.nxLog&&window.nxLog(_eventError)}
  }

  function scheduleConnectionRetry(delay) {
    window.clearTimeout(connectionRetryTimer);
    connectionRetryTimer = null;
    if (officialGameActive() || document.visibilityState === 'hidden' || navigator.onLine === false) return;
    connectionRetryTimer = window.setTimeout(refresh, Math.max(3000, Number(delay || 6000)));
  }

  function logRefreshError(error) {
    var key = String(error && error.message || error || 'Erreur inconnue');
    var now = Date.now();
    if (key !== lastRefreshErrorKey || now - lastRefreshErrorAt > 30000) {
      try { console.warn('Défis individuels', error); } catch (_consoleError) {}
      lastRefreshErrorKey = key;
      lastRefreshErrorAt = now;
    }
  }

  async function fetchRows() {
    var baseRows = [];
    try {
      var canonicalData = await rpc('nexora_individual_public_list_v264');
      baseRows = Array.isArray(canonicalData) ? canonicalData : (canonicalData && canonicalData.id ? [canonicalData] : []);
    } catch (_canonicalError) {
      var data = await rpc('nexora_individual_public_list');
      baseRows = Array.isArray(data) ? data : (data && data.id ? [data] : []);
    }
    return Promise.all(baseRows.map(enrichRowWithV273));
  }

  function challengeSurfaceActive() {
    var screen = document.getElementById('screen-access');
    var modal = document.getElementById('nxIndividualModal');
    return officialGameActive() || !!(screen && screen.classList.contains('active')) || !!(modal && !modal.hidden);
  }

  async function refresh(force) {
    if (officialGameActive()) return;
    if (!force && !challengeSurfaceActive()) return;
    if (!document.querySelector('[data-nx-individual-game-slot]') || loading) return;
    var supabase = client();
    if (!supabase || typeof supabase.rpc !== 'function') {
      render([], navigator.onLine === false ? 'Connexion internet indisponible.' : 'Connexion à Nexora en cours…');
      scheduleConnectionRetry();
      return;
    }
    window.clearTimeout(connectionRetryTimer);
    connectionRetryTimer = null;
    loading = true;
    try {
      render(await fetchRows());
      lastRefreshErrorKey = '';
      lastRefreshErrorAt = 0;
      subscribe();
    } catch (error) {
      logRefreshError(error);
      render([], navigator.onLine === false ? 'Connexion internet indisponible.' : 'Aucun cadeau individuel n’est disponible pour le moment.');
      scheduleConnectionRetry(8000);
    } finally {
      loading = false;
      scheduleApprovalPoll();
    }
  }

  function subscribe() {
    if (!challengeSurfaceActive() || document.visibilityState === 'hidden') return;
    if (channel) return;
    var supabase = client();
    if (!supabase || typeof supabase.channel !== 'function') return;
    function schedule() {
      window.clearTimeout(realtimeTimer);
      realtimeTimer = window.setTimeout(refresh, 350);
    }
    try {
      channel = supabase.channel('nexora-individual-challenges-v243')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nexora_individual_challenges' }, schedule)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nexora_individual_attempts' }, schedule)
        .subscribe();
    } catch (_error) { channel = null; }
  }

  function unsubscribe() {
    window.clearTimeout(realtimeTimer);
    if (!channel) return;
    var supabase = client();
    try { if (supabase && typeof supabase.removeChannel === 'function') supabase.removeChannel(channel); } catch(_error){window.nxLog&&window.nxLog(_error)}
    channel = null;
  }

  function scheduleApprovalPoll() {
    window.clearTimeout(approvalPollTimer);
    if (officialGameActive()) return;
    approvalPollTimer = null;
    var waitingForDecision = rows.some(function (row) {
      var status = normalizeAttemptStatus(row.my_attempt_status);
      return status === 'payment_pending' || status === 'approved';
    });
    if (!waitingForDecision || document.visibilityState === 'hidden' || !challengeSurfaceActive()) return;
    approvalPollTimer = window.setTimeout(refresh, 8000);
  }

  function ensureModal() {
    var modal = document.getElementById('nxIndividualModal');
    if (modal) return modal;
    modal = document.createElement('section');
    modal.id = 'nxIndividualModal';
    modal.className = 'nx-individual-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = '<div class="nx-individual-dialog"><div class="nx-individual-dialog-head"><div><small>Défi individuel</small>' +
      '<h3 data-nx-individual-modal-title>Participer</h3></div><button type="button" class="nx-individual-close" data-nx-individual-close aria-label="Fermer">×</button>' +
      '</div><div data-nx-individual-modal-content></div></div>';
    document.body.appendChild(modal);
    return modal;
  }

  function merchantText() {
    var element = document.querySelector('[data-nx-merchant-phone]');
    var text = String(element && element.textContent || '').trim();
    return text && text !== 'Chargement…' ? text : 'le numéro Orange Money affiché dans Paiement Nexora';
  }

  function ensurePaymentPage() {
    var page = document.getElementById('nxIndividualPaymentPage');
    if (page) return page;
    page = document.createElement('section');
    page.id = 'nxIndividualPaymentPage';
    page.className = 'nx-individual-payment-page';
    page.hidden = true;
    page.setAttribute('role', 'dialog');
    page.setAttribute('aria-modal', 'true');
    page.setAttribute('aria-label', 'Inscription et paiement KDO');
    page.innerHTML = '<header class="nx-individual-payment-head"><button type="button" class="nx-individual-payment-back" data-nx-individual-payment-close aria-label="Retour aux jeux">←</button>' +
      '<div class="nx-individual-payment-head-copy"><small>KDO</small><strong data-nx-individual-payment-title>Inscription au défi KDO</strong></div></header>' +
      '<div class="nx-individual-payment-body"><div class="nx-individual-payment-shell" data-nx-individual-payment-content></div></div>';
    document.body.appendChild(page);
    return page;
  }


  function normalizePhoneV375(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 15);
  }

  function fieldValueV375(id) {
    var element = document.getElementById(id);
    return String(element && element.value || '').trim();
  }

  function setRegistrationFieldsV375(data) {
    data = data || {};
    var fields = {
      nxIndividualFirstName: data.first_name || data.firstName || '',
      nxIndividualLastName: data.last_name || data.lastName || '',
      nxIndividualContact: data.contact || data.phone || '',
      nxIndividualPayerPhone: data.payer_phone || data.payerPhone || data.contact || ''
    };
    Object.keys(fields).forEach(function (id) {
      var element = document.getElementById(id);
      if (element && !String(element.value || '').trim()) element.value = String(fields[id] || '');
    });
  }

  async function prefillRegistrationV375(challengeId) {
    try {
      var data = await rpc('nexora_kdo_my_registration_v375', { p_challenge_id: challengeId });
      if (data && data.success !== false) setRegistrationFieldsV375(data.registration || data);
    } catch (_registrationError) {
      try {
        var supabase = client();
        if (!supabase || !supabase.auth || typeof supabase.auth.getSession !== 'function') return;
        var sessionResponse = await supabase.auth.getSession();
        var user = sessionResponse && sessionResponse.data && sessionResponse.data.session && sessionResponse.data.session.user;
        var meta = user && user.user_metadata || {};
        setRegistrationFieldsV375({
          first_name: meta.first_name || meta.prenom || '',
          last_name: meta.last_name || meta.nom || '',
          contact: meta.phone || meta.contact || user && user.phone || ''
        });
      } catch(_profileError){window.nxLog&&window.nxLog(_profileError)}
    }
  }

  function openPayment(row) {
    if (!row) return notify('Ce cadeau individuel n’est pas disponible.');
    selected = row;
    var page = ensurePaymentPage();
    var content = page.querySelector('[data-nx-individual-payment-content]');
    var gift = String(row.title || 'Cadeau Nexora');
    var image = String(row.image_url || '').trim();
    var target = Number(row.target_points || 45);
    var maxScore = Number(row.max_score || 50);
    var fee = feeOf(row);
    var free = isFree(row);
    content.innerHTML = '<div class="nx-individual-payment-progress" aria-label="Étapes pour participer">' +
      '<span class="active"><b>1</b>Inscription</span>' + (free ? '' : '<span><b>2</b>Paiement</span>') + '<span><b>' + (free ? '2' : '3') + '</b>Validation</span></div>' +
      '<section class="nx-individual-payment-gift"><div class="nx-individual-payment-gift-media">' +
      (image ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(gift) + '">' : 'KDO') +
      '</div><div class="nx-individual-payment-gift-copy"><small>KDO</small><strong>' + escapeHtml(gift) + '</strong>' +
      '<span>Objectif : ' + target + '/' + maxScore + '. Une seule partie après validation.</span></div></section>' +
      '<section class="nx-individual-payment-card">' +
      '<div class="nx-kdo-registration-intro-v375"><span>1</span><div><strong>Inscris-toi avant de tenter ta chance</strong><small>' + (free ? 'Le nom, le prénom et le contact permettent à l’administration d’identifier le joueur.' : 'Le nom, le prénom et le contact permettent à l’administration d’identifier le joueur et de valider son paiement.') + '</small></div></div>' +
      '<div class="nx-kdo-registration-grid-v375">' +
      '<div class="nx-individual-field"><label for="nxIndividualFirstName">Prénom du joueur</label><input id="nxIndividualFirstName" autocomplete="given-name" maxlength="50" placeholder="Exemple : Mariama" type="text"><small>Écris le véritable prénom du joueur.</small></div>' +
      '<div class="nx-individual-field"><label for="nxIndividualLastName">Nom du joueur</label><input id="nxIndividualLastName" autocomplete="family-name" maxlength="50" placeholder="Exemple : Camara" type="text"><small>Écris le véritable nom du joueur.</small></div>' +
      '<div class="nx-individual-field wide"><label for="nxIndividualContact">Contact du joueur</label><input id="nxIndividualContact" data-nx-kdo-phone-v375 inputmode="tel" autocomplete="tel" maxlength="18" placeholder="Exemple : 622 00 00 00" type="tel"><small>Ce contact servira pour la confirmation et, en cas de victoire, pour joindre le joueur.</small></div>' +
      '</div>' + (free ? '' : '<div class="nx-kdo-payment-separator-v375"></div>' +
      '<div class="nx-individual-payment-amount"><span>Montant obligatoire à payer</span><strong>' + escapeHtml(money(fee)) + '</strong></div>' +
      '<div class="nx-individual-merchant"><div><small>Numéro Orange Money officiel</small><strong data-nx-individual-merchant-number>' + escapeHtml(merchantText()) + '</strong></div><button type="button" data-nx-individual-copy-merchant>Copier</button></div>' +
      '<div class="nx-individual-field"><label for="nxIndividualPayerPhone">Numéro ayant effectué le paiement</label>' +
      '<input id="nxIndividualPayerPhone" data-nx-kdo-phone-v375 inputmode="tel" autocomplete="tel" maxlength="18" aria-describedby="nxIndividualPhoneHelp" placeholder="Exemple : 622 00 00 00" type="tel"><small id="nxIndividualPhoneHelp">Indique exactement le numéro Orange Money utilisé pour envoyer les ' + escapeHtml(money(fee)) + '.</small></div>') +
      '<div class="nx-kdo-registration-summary-v375"><span><b>1. Inscription</b>Nom, prénom et contact</span>' + (free ? '' : '<span><b>2. Paiement</b>' + escapeHtml(money(fee)) + '</span>') + '<span><b>' + (free ? '2' : '3') + '. Activation</b>' + (free ? 'Accès automatique' : 'Validation par l’administration') + '</span></div>' +
      '<div class="nx-individual-warning">' + (free ? 'La participation est gratuite. Après l’inscription, le défi est activé automatiquement.' : 'Le défi reste bloqué tant que l’administration n’a pas validé le paiement. Après validation, le bouton « Commencer le défi » devient actif.') + '</div>' +
      '<div class="nx-individual-payment-sticky"><button type="button" class="nx-individual-payment-submit" data-nx-individual-submit-payment>S’inscrire gratuitement</button>' +
      '<div class="nx-individual-feedback" data-nx-individual-feedback aria-live="polite"></div></div></section>';
    page.hidden = false;
    document.body.classList.add('nx-individual-payment-open');
    prefillRegistrationV375(row.id);
    window.setTimeout(function () { var input = document.getElementById('nxIndividualFirstName'); if (input) input.focus(); }, 80);
  }

  function closePaymentPage() {
    var page = document.getElementById('nxIndividualPaymentPage');
    if (page) page.hidden = true;
    document.body.classList.remove('nx-individual-payment-open');
    selected = null;
  }
  function closeModal() {
    var modal = document.getElementById('nxIndividualModal');
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';
  }

  async function submitPayment(button) {
    if (!selected || button.disabled) return;
    var firstName = fieldValueV375('nxIndividualFirstName');
    var lastName = fieldValueV375('nxIndividualLastName');
    var contact = normalizePhoneV375(fieldValueV375('nxIndividualContact'));
    var payerPhone = contact; /* V455 : compatibilité avec l'ancien RPC, sans demander Orange Money. */
    var feedback = document.querySelector('[data-nx-individual-feedback]');
    function fail(id, message) {
      var input = document.getElementById(id);
      if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
      if (feedback) feedback.textContent = message;
    }
    ['nxIndividualFirstName','nxIndividualLastName','nxIndividualContact','nxIndividualPayerPhone'].forEach(function(id){var field=document.getElementById(id);if(field)field.removeAttribute('aria-invalid');});
    if (firstName.length < 2) return fail('nxIndividualFirstName', 'Entre un prénom valide contenant au moins 2 caractères.');
    if (lastName.length < 2) return fail('nxIndividualLastName', 'Entre un nom valide contenant au moins 2 caractères.');
    if (contact.length < 8 || contact.length > 15) return fail('nxIndividualContact', 'Vérifie le contact du joueur : il doit contenir entre 8 et 15 chiffres.');
    button.disabled = true;
    button.textContent = 'Inscription gratuite…';
    if (feedback) feedback.textContent = 'Enregistrement du joueur…';
    try {
      var data = await rpc('nexora_individual_register_payment_v390', {
        p_challenge_id: selected.id,
        p_first_name: firstName,
        p_last_name: lastName,
        p_phone: contact,
        p_orange_money: null
      });
      if (!data || data.success !== true) throw new Error(data && data.message || 'L’inscription gratuite n’a pas été enregistrée.');
      var successMessage = data.message || (isFree(selected || {}) ? 'Félicitations ! Votre inscription a bien été envoyée à l’administration Nexora.' : 'Félicitations ! Votre inscription et votre paiement ont bien été envoyés à l’administration Nexora.');
      if (feedback) {
        feedback.textContent = successMessage;
        feedback.style.color = '#166534';
        feedback.style.fontWeight = '900';
        feedback.style.background = '#f0fdf4';
        feedback.style.border = '1px solid #86efac';
        feedback.style.borderRadius = '16px';
        feedback.style.padding = '14px';
      }
      button.textContent = 'Inscription envoyée avec succès';
      notify(successMessage);
      await refresh();
      window.setTimeout(closePaymentPage, 3500);
    } catch (error) {
      if (feedback) feedback.textContent = String(error && error.message || error);
    } finally {
      button.disabled = false;
      button.textContent = 'S’inscrire gratuitement';
    }
  }


  function clearLoadTimer() { window.clearTimeout(loadTimer); loadTimer = null; }
  function clearVerificationTimer() { window.clearTimeout(verificationTimer); verificationTimer = null; }
  function clearContext() {
    clearLoadTimer();
    clearVerificationTimer();
    releaseScreenAwake();
    active = null;
    startBusy = false;
    confirmBusy = false;
    finishBusy = false;
    window.__NEXORA_ADAMS_PLAY_CONTEXT = null;
  }

  function closeGame() {
    window.__NEXORA_FORCE_GAME_CLOSE = true;
    try { if (window.NexoraAdamsGames && typeof window.NexoraAdamsGames.close === 'function') window.NexoraAdamsGames.close(); } catch(_error){window.nxLog&&window.nxLog(_error)}
    finally { window.__NEXORA_FORCE_GAME_CLOSE = false; }
  }

  function openPreparedGame(row, attempt) {
    if (!window.NexoraKdoQuiz || typeof window.NexoraKdoQuiz.startPrepared !== 'function') {
      clearContext();
      return notify('Le Défi Nexora est indisponible. Actualisez l’application.');
    }
    clearContext();
    window.__NEXORA_ADAMS_PLAY_CONTEXT = {
      type:'individual_challenge', phase:'prepared', challenge_id:row.id,
      attempt_id:attempt.attempt_id, title:row.title, target_points:Number(row.target_points || 45), max_score:Number(row.max_score || 50)
    };
    active = { row:row, attempt:attempt, confirmed:false, frameReady:true };
    keepScreenAwake(); window.clearTimeout(approvalPollTimer);
    try {
      window.NexoraKdoQuiz.startPrepared(row, attempt);
      window.setTimeout(function(){
        var quiz=document.querySelector('.nxq397');
        if(!quiz || quiz.hidden){ clearContext(); notify('Le défi ne s’est pas ouvert. Appuyez de nouveau sur Commencer le défi.'); refresh(); }
      },1200);
    } catch(error) {
      clearContext();
      notify('Ouverture impossible : ' + String(error && error.message || error));
      refresh();
    }
  }

  function openResumeGame(row, attemptId) {
    if (!attemptId) return notify('Tentative en cours introuvable. Actualisez Nexora.');
    window.__NEXORA_ADAMS_PLAY_CONTEXT = {
      type:'individual_challenge', phase:'started', resume:true,
      challenge_id:row.id, attempt_id:attemptId, title:row.title,
      target_points:Number(row.target_points || 45), max_score:Number(row.max_score || 50)
    };
    active = { row:row, attempt:{attempt_id:attemptId}, confirmed:true, frameReady:true, resume:true };
    keepScreenAwake(); window.clearTimeout(approvalPollTimer);
    if (window.NexoraKdoQuiz && typeof window.NexoraKdoQuiz.resume === 'function') window.NexoraKdoQuiz.resume(row, attemptId);
    else notify('Le nouveau Défi Nexora doit être mis à jour.');
  }

  async function resume(row, button) {
    if (startBusy) return; startBusy = true;
    if (button) { button.disabled = true; button.textContent = 'Ouverture de la nouvelle inscription…'; }
    try {
      var access = await rpc('nexora_kdo_my_game_access_v273', { p_challenge_id: row.id });
      var status = normalizeAttemptStatus(access && access.attempt_status);
      if (!access || access.success !== true || (status !== 'started' && access.can_resume !== true)) throw new Error(access && access.message || 'Cette partie ne peut pas être reprise.');
      row = mergeV273Access(row, access); openResumeGame(row, access.attempt_id || row.my_attempt_id);
    } catch (error) { notify(String(error && error.message || error)); await refresh(); }
    finally { startBusy = false; if (button && !active) { button.disabled = false; button.textContent = replayLabel((active && active.row) || {}); } }
  }

  async function start(row, button) {
    if (startBusy) return;
    startBusy = true;
    if (button) { button.disabled = true; button.textContent = 'Ouverture du défi…'; }
    try {
      var access = await rpc('nexora_kdo_my_game_access_v273', { p_challenge_id: row.id });
      var accessStatus = normalizeAttemptStatus(access && access.attempt_status);
      if (!access || access.success !== true || access.can_start !== true || accessStatus !== 'approved') {
        throw new Error(access && access.message || 'L’inscription doit être validée avant de commencer le défi.');
      }
      row = mergeV273Access(row, access);
      var attempt = { attempt_id: access.attempt_id || row.my_attempt_id };
      if (!attempt.attempt_id) throw new Error('Tentative validée introuvable. Actualisez Nexora.');
      openPreparedGame(row, attempt);
    } catch (error) {
      notify(String(error && error.message || error));
      await refresh();
    } finally {
      startBusy = false;
      if (button) { window.setTimeout(function(){ var quiz=document.querySelector('.nxq397'); if(!quiz || quiz.hidden){ button.disabled=false; button.textContent='Commencer le défi'; } },1300); }
    }
  }

  async function confirmStart(detail) {
    if (confirmBusy || !active || !detail) return;
    var context = window.__NEXORA_ADAMS_PLAY_CONTEXT;
    if (!context) return;
    if (canonical(detail.game_key) !== canonical(context.game_key)) return;
    if (context.phase === 'started' && context.resume === true) {
      active.frameReady = true;
      if (window.NexoraAdamsGames && typeof window.NexoraAdamsGames.confirmChallengeStart === 'function') window.NexoraAdamsGames.confirmChallengeStart(context.attempt_id);
      window.setTimeout(function () { replayProgressV395(context.attempt_id); }, 700);
      notify('Cette partie ne peut pas être reprise. Lancez une nouvelle inscription.');
      return;
    }
    if (active.confirmed || context.phase !== 'prepared') return;
    active.frameReady = true;
    confirmBusy = true;
    clearLoadTimer();
    try {
      var data = null;
      try {
        data = await rpc('nexora_individual_confirm_start', {
          p_attempt_id: context.attempt_id,
          p_session_id: detail.session_id || null
        });
        if (!data || data.success !== true) throw new Error(data && data.message || 'Confirmation classique indisponible.');
        try { await rpc('nexora_kdo_mark_game_started_v273', { p_attempt_id: context.attempt_id }); } catch(_syncError){window.nxLog&&window.nxLog(_syncError)}
      } catch (_classicError) {
        data = await rpc('nexora_kdo_mark_game_started_v273', { p_attempt_id: context.attempt_id });
        if (!data || data.success !== true || data.open_game !== true) {
          throw new Error(data && data.message || 'La partie n’a pas pu être confirmée.');
        }
      }
      active.confirmed = true;
      context.phase = 'started';
      context.started_at = Date.now();
      if (!window.NexoraAdamsGames || typeof window.NexoraAdamsGames.confirmChallengeStart !== 'function') {
        throw new Error('La commande de démarrage du plateau est indisponible.');
      }
      window.NexoraAdamsGames.confirmChallengeStart(context.attempt_id);
      notify('Plateau chargé : votre partie officielle commence maintenant. Jouez jusqu’à la fin.');
    } catch (error) {
      closeGame();
      clearContext();
      notify('Le jeu n’a pas démarré. Votre autorisation reste disponible. ' + String(error && error.message || error));
      await refresh();
    } finally {
      confirmBusy = false;
    }
  }

  function resultModal(data) {
    var modal = ensureModal();
    var title = modal.querySelector('[data-nx-individual-modal-title]');
    var content = modal.querySelector('[data-nx-individual-modal-content]');
    var won = data && data.won === true;
    var score = Number(data && data.score || 0);
    var maxScore = Number(data && data.max_score || 50);
    var target = Number(data && data.target_points || 45);
    var gift = String(data && data.title || 'le cadeau');
    modal.dataset.challengeId = String(data && data.challenge_id || '');
    modal.dataset.gameKey = String(data && data.game_key || '');
    title.textContent = won ? 'Félicitations, vous avez gagné !' : 'Courage, continuez à progresser !';
    content.innerHTML = '<div class="nx-individual-result-card ' + (won ? 'won' : 'lost') + '">' +
      '<div class="nx-individual-result-icon" aria-hidden="true">' + (won ? '🏆' : '✓') + '</div>' +
      '<strong>' + (won ? 'Bravo ! Vous avez gagné ' + escapeHtml(gift) : 'Vous n’avez pas gagné cette fois, mais votre progression compte') + '</strong>' +
      '<div class="nx-individual-result-score"><b>' + score + '</b><span>sur ' + maxScore + ' points</span></div>' +
      '<p>' + (won
        ? 'Votre victoire est enregistrée et vérifiée par Nexora. L’administration vous contactera pour la remise du cadeau.'
        : 'Vous avez obtenu ' + score + ' point' + (score > 1 ? 's' : '') + '. L’objectif était de ' + target + ' points. Continuez à vous entraîner : chaque nouvelle partie peut vous rapprocher de la victoire. ' + replaySentence(selected || {})) + '</p>' +
      '</div><div class="nx-individual-result-actions-v394">' +
      '<button type="button" class="btn primary" data-nx-individual-result-pay>' + escapeHtml(replayLabel((selected || {}))) + '</button>' +
      (won ? '<button type="button" class="btn nx-individual-secondary" data-nx-individual-view-gift>Voir le cadeau</button>' : '') +
      '<button type="button" class="btn nx-individual-secondary" data-nx-individual-close>Fermer</button></div>';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  async function finish(detail, context) {
    if (finishBusy) return;
    finishBusy = true;
    try {
      if (!detail || detail.verified !== true || !detail.session_id) throw new Error('Le score n’a pas été confirmé par le serveur Nexora.');
      var data = await rpc('nexora_individual_finish_attempt', {
        p_attempt_id: context.attempt_id,
        p_result_key: String(detail.result_key || ''),
        p_session_id: String(detail.session_id || ''),
        p_duration_seconds: Number(detail.duration_seconds || 0)
      });
      if (!data || data.success !== true) throw new Error(data && data.message || 'Résultat non enregistré.');
      verificationPending = false;
      clearVerificationTimer();
      data.challenge_id = data.challenge_id || context.challenge_id;
      data.game_key = data.game_key || context.game_key;
      data.title = data.title || context.title;
      data.target_points = data.target_points || context.target_points;
      data.max_score = data.max_score || context.max_score;
      clearProgressV395(context.attempt_id);
      closeGame();
      clearContext();
      resultModal(data);
      notify(data.message || 'Partie terminée.');
    } catch (error) {
      verificationPending = false;
      clearVerificationTimer();
      closeGame();
      clearContext();
      notify('La partie est fermée, mais le résultat doit être vérifié : ' + String(error && error.message || error));
    } finally {
      finishBusy = false;
      await refresh();
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target : null;
    if (!target) return;
    var copyMerchantButton = target.closest('[data-nx-individual-copy-merchant]');
    if (copyMerchantButton) {
      event.preventDefault();
      var merchantNumber = document.querySelector('[data-nx-individual-merchant-number]');
      var value = String(merchantNumber && merchantNumber.textContent || '').trim();
      if (value && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () {
          copyMerchantButton.textContent = 'Copié';
          window.setTimeout(function () { copyMerchantButton.textContent = 'Copier'; }, 1600);
        }).catch(function () { notify('Impossible de copier automatiquement le numéro.'); });
      }
      return;
    }
    var payButton = target.closest('[data-nx-individual-pay]');
    if (payButton) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      openPayment(findRow(payButton.getAttribute('data-nx-individual-pay'))); return;
    }
    var startButton = target.closest('[data-nx-individual-start]');
    if (startButton) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      var row = findRow(startButton.getAttribute('data-nx-individual-start'));
      if (row) start(row, startButton); return;
    }
    var resumeButton = target.closest('[data-nx-individual-resume]');
    if (resumeButton) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      var resumeRow = findRow(resumeButton.getAttribute('data-nx-individual-resume'));
      if (resumeRow) openPayment(resumeRow); return;
    }
    var resultPayButton = target.closest('[data-nx-individual-result-pay]');
    if (resultPayButton) {
      event.preventDefault();
      var resultModalNode = document.getElementById('nxIndividualModal');
      var resultRow = resultModalNode ? findRow(resultModalNode.dataset.challengeId) : null;
      closeModal();
      if (resultRow) openPayment(resultRow);
      return;
    }
    if (target.closest('[data-nx-individual-view-gift]')) {
      event.preventDefault();
      var resultModalElement = document.getElementById('nxIndividualModal');
      var keyToView = canonical(resultModalElement && resultModalElement.dataset.gameKey || '');
      closeModal();
      var giftSlot = document.querySelector('[data-nx-individual-game-slot="' + keyToView + '"]');
      if (giftSlot) giftSlot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (target.closest('[data-nx-individual-payment-close]')) { event.preventDefault(); closePaymentPage(); return; }
    if (target.closest('[data-nx-individual-close]')) { event.preventDefault(); closeModal(); return; }
    var submit = target.closest('[data-nx-individual-submit-payment]');
    if (submit) { event.preventDefault(); event.stopPropagation(); submitPayment(submit); }
  }, true);

  document.addEventListener('input', function (event) {
    var input = event.target && event.target.closest ? event.target.closest('#nxIndividualPayerPhone,#nxIndividualContact,#nxIndividualFirstName,#nxIndividualLastName') : null;
    if (!input) return;
    if (input.matches('[data-nx-kdo-phone-v375]')) {
      var digits = String(input.value || '').replace(/\D/g, '').slice(0, 15);
      input.value = digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
    }
    input.removeAttribute('aria-invalid');
    var feedback = document.querySelector('[data-nx-individual-feedback]');
    if (feedback) feedback.textContent = '';
  });

  window.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var paymentPage = document.getElementById('nxIndividualPaymentPage');
    if (paymentPage && !paymentPage.hidden) { closePaymentPage(); return; }
    var modal = document.getElementById('nxIndividualModal');
    if (modal && !modal.hidden) closeModal();
  });

  window.addEventListener('message', function (event) {
    /* V500 : ce message vient du plateau embarque, jamais d'ailleurs.
       Sans ce controle, n'importe quelle fenetre pouvait ecrire dans la
       progression d'une partie en cours. */
    if (event.origin !== window.location.origin) return;
    var interne = (event.source === window);
    if (!interne) {
      for (var f = 0; f < window.frames.length; f++) {
        if (event.source === window.frames[f]) { interne = true; break; }
      }
    }
    if (!interne) return;
    var data = event && event.data || {};
    if (data.type !== 'nx-adams-progress-action') return;
    var context = window.__NEXORA_ADAMS_PLAY_CONTEXT;
    if (!context || context.type !== 'individual_challenge' || context.phase !== 'started' || !context.attempt_id) return;
    saveProgressActionV395(context.attempt_id, data.action || {});
  });

  window.addEventListener('nexora:adams-frame-ready', function (event) { confirmStart(event.detail || {}); });
  window.addEventListener('nexora:adams-load-failed', function (event) {
    var detail = event.detail || {};
    var context = window.__NEXORA_ADAMS_PLAY_CONTEXT;
    if (!context || context.type !== 'individual_challenge') return;
    if (canonical(detail.game_key) !== canonical(context.game_key)) return;
    closeGame();
    var wasConfirmed = !!(active && active.confirmed);
    clearContext();
    notify(wasConfirmed
      ? 'Le plateau s’est interrompu après le démarrage. Contactez Nexora pour une reprise technique.'
      : 'Le plateau n’a pas chargé. Votre paiement reste disponible : réessayez sans payer.');
    refresh();
  });

  window.addEventListener('nexora:adams-result', function (event) {
    var context = window.__NEXORA_ADAMS_PLAY_CONTEXT;
    var detail = event.detail || {};
    if (!context || context.type !== 'individual_challenge' || context.phase !== 'started') return;
    if (canonical(detail.game_key) !== canonical(context.game_key)) return;
    verificationPending = true;
    notify('Score terminé. Vérification sécurisée par Nexora…');
  });

  window.addEventListener('nexora:individual-result-verified', function (event) {
    var context = window.__NEXORA_ADAMS_PLAY_CONTEXT;
    var detail = event.detail || {};
    if (!context || context.type !== 'individual_challenge' || !context.attempt_id) return;
    if (canonical(detail.game_key) !== canonical(context.game_key)) return;
    verificationPending = false;
    finish(detail, context);
  });

  window.addEventListener('nexora:individual-result-rejected', function (event) {
    verificationPending = false;
    clearVerificationTimer();
    closeGame();
    clearContext();
    notify(event.detail && event.detail.message || 'La partie est fermée. Contactez Nexora pour une vérification technique.');
    refresh();
  });

  window.addEventListener('nexora:adams-closed', function () {
    var context = window.__NEXORA_ADAMS_PLAY_CONTEXT;
    if (!context || context.type !== 'individual_challenge') return;
    if (context.phase === 'prepared') {
      clearContext();
      notify('Le jeu a été fermé avant son démarrage. Votre paiement reste disponible.');
      refresh();
      return;
    }
    if (verificationPending) {
      notify('Votre score est en cours de vérification.');
      clearVerificationTimer();
      verificationTimer = window.setTimeout(function () {
        if (!verificationPending) return;
        verificationPending = false;
        clearContext();
        notify('La vérification du score a échoué. Contactez Nexora pour une reprise technique.');
        refresh();
      }, 15000);
      return;
    }
    clearContext();
    notify('La partie officielle a été fermée. Une reprise nécessite une validation technique de Nexora.');
    refresh();
  });

  document.addEventListener('nexora:rendered', function () { if(challengeSurfaceActive())window.setTimeout(refresh, 80); });
  document.addEventListener('nx-screen-change', function (event) {
    var screen=event&&event.detail&&String(event.detail.screen||'');
    if(screen==='access')window.setTimeout(function(){refresh(true);},80);
    else if(!officialGameActive()){
      window.clearTimeout(approvalPollTimer);
      window.clearTimeout(connectionRetryTimer);
      unsubscribe();
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      if (officialGameActive()) keepScreenAwake();
      else if(challengeSurfaceActive()) refresh(true);
    } else {
      window.clearTimeout(approvalPollTimer);
      unsubscribe();
    }
  });
  window.addEventListener('online', function () { if (!officialGameActive()&&challengeSurfaceActive()) refresh(true); });
  window.addEventListener('beforeunload', function (event) {
    var context = window.__NEXORA_ADAMS_PLAY_CONTEXT;
    if (!context || context.type !== 'individual_challenge' || context.phase !== 'started') return;
    event.preventDefault();
    event.returnValue = '';
  });
  window.addEventListener('pagehide', function () {
    window.clearTimeout(approvalPollTimer);
    window.clearTimeout(connectionRetryTimer);
    unsubscribe();
  });

  window.NexoraIndividualChallenge = { refresh: function(){return refresh(true);}, resetGameContext: clearContext, openPaymentByChallenge: async function(id){ clearContext(); await refresh(true); var row=findRow(id); if(row) openPayment(row); else notify('Défi introuvable. Actualisez Nexora.'); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { if(challengeSurfaceActive())window.setTimeout(function(){refresh(true);},120); }, { once: true });
  else if(challengeSurfaceActive())window.setTimeout(function(){refresh(true);},120);
})();

/* ===== assets/js/nexora-ux-v275.js ===== */
/* NEXORA V275 — recherche, filtres et confort KDO. */
(function(){
  'use strict';
  var activeFilter='all';
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function category(key){
    key=String(key||'').toLowerCase();
    if(['preuniv','maternelle','ecole','7e','8e','9e','10e','11e','12e','terminale'].indexOf(key)>=0)return 'school';
    if(['univ','pro'].indexOf(key)>=0)return 'higher';
    return 'culture';
  }
  function normalize(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  function prepareCards(){
    qa('.nx-kdo-game-card-v246').forEach(function(card){
      var key=card.getAttribute('data-adams-game')||'';
      card.dataset.nxKdoCategory=category(key);
      card.dataset.nxKdoText=normalize(card.textContent+' '+key);
    });
    applyFilters();
  }
  function applyFilters(){
    var input=q('[data-nx-kdo-search]');
    var term=normalize(input&&input.value);
    var cards=qa('.nx-kdo-game-card-v246');
    var visible=0;
    cards.forEach(function(card){
      var categoryOk=activeFilter==='all'||card.dataset.nxKdoCategory===activeFilter;
      var searchOk=!term||String(card.dataset.nxKdoText||normalize(card.textContent)).indexOf(term)>=0;
      card.hidden=!(categoryOk&&searchOk);
      if(!card.hidden)visible++;
    });
    var count=q('[data-nx-kdo-games-count]');
    if(count){var label=count.querySelector('span');var text=visible+' jeu'+(visible>1?'x':'')+' affiché'+(visible>1?'s':'');if(label)label.textContent=text;else count.textContent=text;}
    var empty=q('[data-nx-kdo-empty]');if(empty)empty.hidden=visible!==0;
  }
  function init(){
    var search=q('[data-nx-kdo-search]');
    if(search&&!search.dataset.nxReady){search.dataset.nxReady='1';search.addEventListener('input',applyFilters)}
    qa('[data-nx-kdo-filter]').forEach(function(button){
      if(button.dataset.nxReady)return;button.dataset.nxReady='1';
      button.addEventListener('click',function(){
        activeFilter=button.getAttribute('data-nx-kdo-filter')||'all';
        qa('[data-nx-kdo-filter]').forEach(function(item){item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',item===button?'true':'false')});
        applyFilters();
      });
    });
    prepareCards();
  }
  window.addEventListener('nexora:kdo-cards-updated',prepareCards);
  document.addEventListener('nexora:rendered',function(){setTimeout(init,60)});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(init,120)},{once:true}); else setTimeout(init,120);
  window.addEventListener('pageshow',init);
})();

//# sourceURL=assets/js/nexora-ux-v275.js

/* ===== nexora-kdo-quiz-script ===== */
(function(){
'use strict';
var SUBJECTS={"math":{"name":"Mathématiques","icon":"➗"},"francais":{"name":"Français","icon":"📘"},"histoire":{"name":"Histoire","icon":"🏺"},"geographie":{"name":"Géographie","icon":"🌍"},"physique":{"name":"Physique","icon":"⚛️"},"chimie":{"name":"Chimie","icon":"🧪"},"svt":{"name":"Biologie (SVT)","icon":"🌿"},"anglais":{"name":"Anglais","icon":"🇬🇧"},"culture":{"name":"Culture générale","icon":"🌐"}};
var overlay=null,state=null,timer=null,busy=false,activeRow=null,activeAttempt=null;
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function client(){try{return window.NexoraApp&&window.NexoraApp.getSupabaseClient?window.NexoraApp.getSupabaseClient():null}catch(e){return null}}
async function rpc(n,a){var c=client();if(!c)throw new Error('Connexion à Nexora indisponible.');var r=await c.rpc(n,a||{});if(r.error)throw r.error;var d=r.data;if(Array.isArray(d)&&d.length===1)d=d[0];if(typeof d==='string')try{d=JSON.parse(d)}catch(e){window.nxLog&&window.nxLog(e)}return d}
function clear(id){try{localStorage.removeItem('nexora-kdo-quiz-v397:'+String(id||''))}catch(e){window.nxLog&&window.nxLog(e)}}
function hash(v){var s=String(v||''),h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rnd(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffled(a,r){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),x=a[i];a[i]=a[j];a[j]=x}return a}
function shell(){return ensure().querySelector('.nxq397-shell')}
/* V443 : les regles du defi ne sont plus ecrites en dur, elles viennent de la partie envoyee par le serveur. */
function ruleTotal(){var n=state&&Array.isArray(state.questions)?state.questions.length:0;if(n)return n;n=Number(activeRow&&activeRow.max_score||0);return n>0?n:10}
function ruleTarget(){var t=Number(activeRow&&activeRow.target_points||0);if(t>0)return t;return Math.ceil(ruleTotal()*0.8)}
function ruleFee(){return Number(activeRow&&activeRow.entry_fee_gnf||0)}
function ruleIsFree(){return ruleFee()<=0}
function feeText(){return ruleIsFree()?'':new Intl.NumberFormat('fr-FR').format(ruleFee())+' GNF'}
function replayText(){return ruleIsFree()?'Pour rejouer, une nouvelle inscription est nécessaire.':'Pour rejouer, effectuez un nouveau paiement de '+feeText()+'.'}
function closeLocal(){if(timer)clearInterval(timer);timer=null;if(overlay)overlay.hidden=true;document.body.classList.remove('nx-quiz-open-v399');document.body.style.overflow='';busy=false;activeRow=null;activeAttempt=null;state=null;try{window.NexoraIndividualChallenge&&window.NexoraIndividualChallenge.resetGameContext&&window.NexoraIndividualChallenge.resetGameContext()}catch(e){window.nxLog&&window.nxLog(e)}}
async function abandon(){if(!state||state.phase!=='playing')return;state.phase='abandoning';if(timer)clearInterval(timer);timer=null;try{await rpc('nexora_kdo_quiz_abandon_v445',{p_attempt_id:state.attempt_id,p_session_id:state.session_id})}catch(e){window.nxLog&&window.nxLog(e)}}
async function requestClose(){if(state&&state.phase==='playing'){if(!confirm('En quittant maintenant, cette partie sera définitivement terminée. '+replayText()+' Quitter ?'))return;await abandon()}closeLocal();window.NexoraIndividualChallenge&&window.NexoraIndividualChallenge.refresh&&window.NexoraIndividualChallenge.refresh()}
function ensure(){if(overlay)return overlay;overlay=document.createElement('section');overlay.className='nxq397';overlay.hidden=true;overlay.innerHTML='<header class="nxq397-head"><button class="nxq397-close" type="button" aria-label="Fermer">←</button><div class="nxq397-head-copy"><small>KDO — Défi Nexora</small><strong>15 secondes par question</strong></div></header><div class="nxq397-body"><div class="nxq397-shell"></div></div>';document.body.appendChild(overlay);overlay.querySelector('.nxq397-close').onclick=requestClose;return overlay}
function open(){try{window.__NEXORA_FORCE_GAME_CLOSE=true;if(window.NexoraAdamsGames&&typeof window.NexoraAdamsGames.close==='function')window.NexoraAdamsGames.close()}catch(e){window.nxLog&&window.nxLog(e)}finally{window.__NEXORA_FORCE_GAME_CLOSE=false}document.querySelectorAll('#screen-access [data-nx-kdo-board-preview-v297],#screen-access .nx-kdo-board-section-v308,#screen-access .nx-kdo-board-frame-wrap-v297,#screen-access .nx-kdo-board-frame-v297,#screen-access [data-nx-board-preview-v432],#screen-access .nx-board-preview-v432,#screen-access [data-nx-adams-game-frame-wrap],#screen-access [data-nx-individual-game-slot] iframe,#screen-access [data-nx-individual-game-slot] .plateau').forEach(function(n){n.remove()});document.querySelectorAll('[data-nx-adams-game-modal],.nx-adams-game-modal').forEach(function(n){n.hidden=true;n.setAttribute('aria-hidden','true')});ensure().hidden=false;document.body.classList.add('nx-quiz-open-v399');document.body.style.overflow='hidden';try{navigator.wakeLock&&navigator.wakeLock.request('screen')}catch(e){window.nxLog&&window.nxLog(e)}}
function subjectCounts(){return rpc('nexora_kdo_subjects_v445',{}).then(function(d){var m={};(Array.isArray(d)?d:[]).forEach(function(x){m[String(x.key)]=Number(x.questions||0)});return m}).catch(function(){return null})}
function selectScreen(row,attempt){activeRow=row;activeAttempt=attempt;open();applySubjectAvailability();shell().innerHTML='<div class="nxq397-intro"><div style="font-size:46px">🎯</div><h2>Choisissez une matière</h2><p>Les questions et le score sont contrôlés par le serveur.</p><div class="nxq397-rules"><div class="nxq397-rule"><b>'+ruleTotal()+'</b><span>questions</span></div><div class="nxq397-rule"><b>15 s</b><span>par question</span></div><div class="nxq397-rule"><b>'+ruleTarget()+'/'+ruleTotal()+'</b><span>pour gagner</span></div></div><div class="nxq397-subjects">'+Object.keys(SUBJECTS).map(function(k){var b=SUBJECTS[k];return '<button type="button" class="nxq397-subject" data-subject="'+k+'"><i>'+b.icon+'</i><span>'+esc(b.name)+'</span><small>Ouvrir</small></button>'}).join('')+'</div></div>';shell().querySelectorAll('[data-subject]').forEach(function(b){b.onclick=function(){beginSubject(b.dataset.subject)}})}
function applySubjectAvailability(){var besoin=ruleTotal();subjectCounts().then(function(map){if(!map)return;var box=shell();if(!box)return;box.querySelectorAll('[data-subject]').forEach(function(b){var n=Number(map[b.dataset.subject]||0),small=b.querySelector('small');if(n>=besoin){if(small)small.textContent='Ouvrir';b.disabled=false;b.classList.remove('nxq397-subject-off');}else{if(small)small.textContent=n?('Bientôt — '+n+'/'+besoin+' questions'):'Bientôt disponible';b.disabled=true;b.classList.add('nxq397-subject-off');}})})}
async function beginSubject(subject){if(busy)return;busy=true;shell().innerHTML='<div class="nxq397-result"><div class="icon">⏳</div><h2>Préparation du défi…</h2><p>Supabase sélectionne vos questions.</p></div>';try{var attemptId=activeAttempt&&activeAttempt.attempt_id||activeRow&&activeRow.my_attempt_id;if(!attemptId)throw new Error('Tentative introuvable.');var d=await rpc('nexora_kdo_quiz_start_v445',{p_attempt_id:attemptId,p_subject:subject});if(!d||d.success!==true)throw new Error(d&&d.message||'Démarrage impossible.');if(!Array.isArray(d.questions)||!d.questions.length)throw new Error('Les questions sécurisées ne sont pas disponibles. Exécutez le SQL du KDO dans Supabase.');state={attempt_id:attemptId,challenge_id:activeRow&&activeRow.id,subject:subject,session_id:d.session_id,questions:d.questions,pos:0,score:0,answers:[],phase:'playing',remaining:15,started_at:Date.now()};showQuestion()}catch(e){shell().innerHTML='<div class="nxq397-result"><div class="icon">⚠️</div><h2>Démarrage impossible</h2><p>'+esc(String(e&&e.message||e))+'</p><div class="nxq397-actions"><button class="nxq397-btn secondary" id="nxqBackSubjects">Retour aux matières</button></div></div>';var back=document.getElementById('nxqBackSubjects');if(back)back.onclick=function(){busy=false;selectScreen(activeRow,activeAttempt)};busy=false}}
function resume(row,attemptId){activeRow=row;activeAttempt={attempt_id:attemptId};state={attempt_id:attemptId,challenge_id:row&&row.id,phase:'closed'};open();shell().innerHTML='<div class="nxq397-result"><div class="icon">🔒</div><h2>Partie terminée</h2><p>Une partie commencée ne peut pas être reprise. '+replayText()+'</p><div class="nxq397-actions"><button class="nxq397-btn" id="nxqNewPayClosed">'+(ruleIsFree()?'Nouvelle partie':'Nouvelle partie — payer '+feeText())+'</button><button class="nxq397-btn secondary" id="nxqCloseClosed">Fermer</button></div></div>';document.getElementById('nxqCloseClosed').onclick=closeLocal;document.getElementById('nxqNewPayClosed').onclick=function(){var challengeId=row&&row.id;closeLocal();if(window.NexoraIndividualChallenge&&window.NexoraIndividualChallenge.openPaymentByChallenge)window.NexoraIndividualChallenge.openPaymentByChallenge(challengeId)}}
function showQuestion(){busy=false;if(timer)clearInterval(timer);var bank=SUBJECTS[state.subject],question=state.questions[state.pos],r=rnd(hash(state.session_id+':'+state.pos)),opts=shuffled(Array.isArray(question.o)?question.o:[],r);state.remaining=15;shell().innerHTML='<div class="nxq397-top"><div class="nxq397-pill">'+bank.icon+' '+esc(bank.name)+' · Question '+(state.pos+1)+'/'+ruleTotal()+'</div><div class="nxq397-pill score">Score provisoire : '+state.score+'/'+ruleTotal()+'</div><div class="nxq397-timer" id="nxq397Timer">15</div></div><div class="nxq397-progress"><span style="width:'+((state.pos)/Math.max(1,ruleTotal())*100)+'%"></span></div><div class="nxq397-card"><div class="nxq397-question">'+esc(question.q)+'</div><div class="nxq397-options">'+opts.map(function(o){return '<button type="button" class="nxq397-option" data-answer="'+esc(o)+'">'+esc(o)+'</button>'}).join('')+'</div><div class="nxq397-feedback"></div></div>';shell().querySelectorAll('[data-answer]').forEach(function(b){b.onclick=function(){submitAnswer(b.dataset.answer,b)}});timer=setInterval(function(){state.remaining--;var el=document.getElementById('nxq397Timer');if(el){el.textContent=state.remaining;el.classList.toggle('danger',state.remaining<=5)}if(state.remaining<=0)submitAnswer(null,null)},1000)}
async function submitAnswer(value,button){if(busy)return;busy=true;if(timer)clearInterval(timer);timer=null;var question=state.questions[state.pos],buttons=shell().querySelectorAll('[data-answer]'),fb=shell().querySelector('.nxq397-feedback');buttons.forEach(function(b){b.disabled=true});if(fb)fb.textContent='Vérification de la réponse…';try{var d=await rpc('nexora_kdo_quiz_answer_v445',{p_attempt_id:state.attempt_id,p_session_id:state.session_id,p_question_id:question.id,p_answer:value,p_time_left:state.remaining});if(!d||d.success!==true)throw new Error(d&&d.message||'Réponse non enregistrée.');buttons.forEach(function(b){if(b.dataset.answer===String(d.correct_answer||''))b.classList.add('correct');else if(b===button&&!d.correct)b.classList.add('wrong')});if(d.correct===true)state.score++;state.answers.push({question_id:question.id,answer:value,correct:d.correct===true});if(fb)fb.textContent=value===null?'Temps écoulé. Bonne réponse : '+String(d.correct_answer||''):(d.correct?'Bonne réponse !':'Réponse incorrecte. Bonne réponse : '+String(d.correct_answer||''));setTimeout(function(){state.pos++;if(state.pos>=ruleTotal())finish();else showQuestion()},900)}catch(e){if(fb)fb.innerHTML='<span>'+esc(String(e&&e.message||e))+'</span><br><button type="button" class="nxq397-btn secondary" id="nxqAnswerRetry">Réessayer l’enregistrement</button>';var retry=document.getElementById('nxqAnswerRetry');if(retry)retry.onclick=function(){busy=false;submitAnswer(value,button)}}}
async function finish(){state.phase='finishing';busy=true;if(timer)clearInterval(timer);timer=null;shell().innerHTML='<div class="nxq397-result"><div class="icon">⏳</div><h2>Calcul du résultat officiel…</h2><p>Le serveur vérifie vos réponses.</p></div>';try{var d=await rpc('nexora_kdo_quiz_finish_v445',{p_attempt_id:state.attempt_id,p_session_id:state.session_id,p_subject:state.subject});if(!d||d.success!==true)throw new Error(d&&d.message||'Résultat non enregistré.');state.phase='finished';result(d)}catch(e){state.phase='playing';busy=false;var msg=String(e&&e.message||e||'');shell().innerHTML='<div class="nxq397-result"><div class="icon">⚠️</div><h2>Résultat non enregistré</h2><p>'+esc(msg)+'</p><div class="nxq397-actions"><button class="nxq397-btn" id="nxqRetry">Réessayer</button></div></div>';document.getElementById('nxqRetry').onclick=finish}}
function result(d){var won=d.won===true,score=Number(d.score||0);clear(state&&state.attempt_id);busy=false;shell().innerHTML='<div class="nxq397-result"><div class="icon">'+(won?'🏆':'👏')+'</div><h2>'+(won?'Félicitations, vous avez gagné !':'Courage, continuez à apprendre !')+'</h2><div class="nxq397-score">'+score+'/'+ruleTotal()+'</div><p>'+(won?'Le serveur a confirmé au moins '+ruleTarget()+' bonnes réponses sur '+ruleTotal()+'. Votre victoire est enregistrée.':'Le serveur a confirmé un score inférieur à '+ruleTarget()+'/'+ruleTotal()+'. '+replayText())+'</p><div class="nxq397-actions"><button class="nxq397-btn" id="nxqNewPay">'+(ruleIsFree()?'Nouvelle partie':'Nouvelle partie — payer '+feeText())+'</button><button class="nxq397-btn secondary" id="nxqClose">Fermer</button></div></div>';document.getElementById('nxqClose').onclick=function(){closeLocal();window.NexoraIndividualChallenge&&window.NexoraIndividualChallenge.refresh&&window.NexoraIndividualChallenge.refresh()};document.getElementById('nxqNewPay').onclick=function(){var challengeId=state&&state.challenge_id;closeLocal();if(window.NexoraIndividualChallenge&&window.NexoraIndividualChallenge.openPaymentByChallenge)window.NexoraIndividualChallenge.openPaymentByChallenge(challengeId)}}
window.NexoraKdoQuiz={startPrepared:function(row,attempt){selectScreen(row,attempt)},resume:resume,close:requestClose,banks:SUBJECTS};
})();


