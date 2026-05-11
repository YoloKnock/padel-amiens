// ============================================
// Page de connexion admin — /admin/login
// ============================================
// On redirige vers /login (la page user) avec next=/admin. Tout le monde
// passe par le même formulaire (Google + Email/Password). Le filtrage
// admin se fait après auth via la whitelist ADMIN_EMAILS dans lib/admin.

import { redirect } from 'next/navigation';

export default function AdminLoginPage() {
  redirect('/login?next=/admin');
}
