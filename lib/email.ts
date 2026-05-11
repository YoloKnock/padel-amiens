// ============================================
// Envoi d'emails transactionnels via Resend
// ============================================
// Squelette générique. Pour activer en prod, Hugo doit :
//   1. Créer un compte sur resend.com (gratuit jusqu'à 100 mails/jour)
//   2. Vérifier le domaine padel-amiens.fr (DNS) ou utiliser onboarding@resend.dev
//      pour les tests
//   3. Générer une API key
//   4. Ajouter RESEND_API_KEY et CONTACT_FROM_EMAIL aux env vars Vercel
//
// Sans ces vars, `sendEmail` log et retourne false sans crasher — comme ça
// l'app tourne en dev/staging même si Resend pas configuré.

interface EmailOptions {
  to: string;
  subject: string;
  /** Corps texte simple (sera converti en HTML basique) */
  text: string;
  /** Adresse "From" — par défaut CONTACT_FROM_EMAIL si défini, sinon
   *  onboarding@resend.dev qui fonctionne sans domaine vérifié */
  from?: string;
  /** Optionnel : adresse Reply-To pour que la réponse aille à l'expéditeur
   *  de l'annonce et pas à notre infra */
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  /** ID Resend si envoyé, ou message d'erreur sinon */
  info: string;
}

/**
 * Envoie un email via l'API Resend.
 * Si RESEND_API_KEY n'est pas définie, on log et on retourne success=false
 * sans lancer d'erreur — l'appelant doit gérer (toast utilisateur, etc).
 */
export async function sendEmail(opts: EmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY manquante — email NON envoyé', {
      to: opts.to,
      subject: opts.subject,
    });
    return { success: false, info: 'RESEND_API_KEY non configurée' };
  }

  const from =
    opts.from ?? process.env.CONTACT_FROM_EMAIL ?? 'Padel Amiens <onboarding@resend.dev>';

  // Conversion text → HTML basique pour que l'email soit lisible dans les
  // clients qui ne supportent pas le text/plain (Gmail web en headless, etc.)
  const html = `<div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; color: #0f172a;">${opts.text
    .split('\n\n')
    .map((p) => `<p style="margin: 0 0 12px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')}<hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;"><p style="font-size: 12px; color: #64748b;">Envoyé via <a href="https://padel-amiens.fr" style="color: #059669;">Padel Amiens</a></p></div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[email] Resend HTTP', response.status, detail);
      return { success: false, info: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as { id?: string };
    return { success: true, info: data.id ?? 'envoyé' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erreur inconnue';
    console.error('[email] Exception:', message);
    return { success: false, info: message };
  }
}
