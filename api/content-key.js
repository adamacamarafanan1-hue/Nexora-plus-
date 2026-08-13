/* NEXORA V525 — endpoint historique désactivé.
   La clé maître ne doit plus quitter Vercel. Les contenus passent par /api/secure-content. */
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ success: false, message: "Méthode refusée." });
  }
  return response.status(410).json({
    success: false,
    message: "Cette ancienne méthode d’activation a été remplacée par la sécurité V525. Recharge Nexora."
  });
}
