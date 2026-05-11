// ============================================
// Génération de fichiers .ics (iCalendar)
// ============================================
// Format standard RFC 5545 — supporté nativement par iCal, Google Calendar,
// Outlook, et toutes les apps mobiles. On génère le contenu à la main parce
// que les libs npm pour ça sont surdimensionnées pour notre besoin (un seul
// VEVENT par fichier, pas de récurrence, pas d'attendees).
//
// Le but : que cliquer sur "Ajouter à mon agenda" depuis Padel Amiens fasse
// littéralement apparaître l'événement dans l'app calendrier du téléphone
// en un clic.

interface IcsEvent {
  /** Identifiant unique stable (UUID, ou tournament fingerprint). */
  uid: string;
  /** Titre affiché dans le calendrier. */
  title: string;
  /** Description longue (lieu, JA, lien). Saut de ligne autorisé. */
  description: string;
  /** Date de début au format YYYY-MM-DD (événement journée entière). */
  startDate: string;
  /** Date de fin au format YYYY-MM-DD (exclusive). Si null, +1 jour. */
  endDate?: string | null;
  /** Lieu affiché dans le calendrier (ex: "Amiens Padel, Cagny"). */
  location?: string;
  /** URL canonique de l'événement sur notre site. */
  url?: string;
}

/**
 * Génère le contenu texte d'un fichier .ics pour un événement.
 *
 * On reste en "événement journée entière" (VALUE=DATE) puisque Padel
 * Magazine ne donne pas les heures précises. L'utilisateur ajustera dans
 * son calendrier s'il connaît l'heure exacte.
 */
export function buildIcs(event: IcsEvent): string {
  const dtStart = event.startDate.replaceAll('-', '');
  // Pour un VEVENT all-day, DTEND est exclusive : +1 jour si pas d'endDate
  const dtEnd = (() => {
    if (event.endDate) return event.endDate.replaceAll('-', '');
    // Ajoute 1 jour à startDate (manipulation simple en string ISO)
    const d = new Date(event.startDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10).replaceAll('-', '');
  })();

  // DTSTAMP doit refléter l'instant de génération (UTC)
  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  // Échappement RFC 5545 : virgules, points-virgules, retours ligne
  const escape = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Padel Amiens//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@padel-amiens.fr`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description)}`,
  ];

  if (event.location) lines.push(`LOCATION:${escape(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');

  // Séparateur CRLF requis par RFC 5545
  return lines.join('\r\n');
}
