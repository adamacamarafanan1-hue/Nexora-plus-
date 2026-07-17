
(function(){
  'use strict';
  window.NEXORA_SECURITY_VERSION='auth-anti-abus-v1';
  window.NEXORA_SECURITY_RULES={
    softDelete:true,
    hardDeleteBlockedByDatabase:true,
    hideSoftDeletedRowsInInterface:true,
    adminActionsMustBeLogged:true,
    ownerActionsMustUseRls:true,
    rateLimitsEnabled:true,
    authEventsLogged:true,
    antiSpamRpcEnabled:true
  };
})();

