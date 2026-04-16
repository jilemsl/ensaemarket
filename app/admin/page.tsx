import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export default async function AdminPage() {
  const now = new Date().toISOString();

  // 1. Récupérer les utilisateurs non validés
  // Note : L'email est dans auth.users, on récupère les profils qui attendent
  const { data: usersEnAttente } = await supabase
    .from('profiles')
    .select('id, pseudo, email') // Assure-tu que l'email est copié dans 'profiles' à l'inscription
    .eq('is_validated', false);

  // 2. Récupérer les paris en attente de modération
  const { data: enAttente } = await supabase
    .from('paris')
    .select('*')
    .eq('status', 'en_attente');

  // 3. Récupérer les paris expirés à résoudre
  const { data: aResoudre } = await supabase
    .from('paris')
    .select('*')
    .eq('status', 'valide')
    .lt('echeance', now);

  // --- ACTIONS SERVEUR ---

  async function validerUtilisateur(id: string) {
    "use server";
    await supabase.from('profiles').update({ is_validated: true }).eq('id', id);
    revalidatePath('/admin');
  }

  async function validerPari(id: string) {
    "use server";
    await supabase.from('paris').update({ status: 'valide' }).eq('id', id);
    revalidatePath('/admin');
    revalidatePath('/');
  }

  async function supprimerPari(id: string) {
    "use server";
    await supabase.from('paris').delete().eq('id', id);
    revalidatePath('/admin');
  }

  async function resoudreGains(id: string, issue: number) {
    "use server";
    const { error } = await supabase.rpc('resoudre_pari', {
      pari_id_input: id,
      issue_gagnante_input: issue
    });
    if (error) console.error(error);
    revalidatePath('/admin');
    revalidatePath('/');
  }

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #000' }}>PANEL ADMIN GLOBAL</h1>
      <a href="/">[ RETOUR ACCUEIL ]</a>

      {/* SECTION : VALIDATION UTILISATEURS */}
      <section style={{ marginTop: '40px', border: '2px solid #555', padding: '15px' }}>
        <h2 style={{ color: '#8a2be2' }}>0. Validation des Inscriptions</h2>
        {usersEnAttente?.length === 0 && <p>Aucun nouvel utilisateur à valider.</p>}
        
        {usersEnAttente?.map((u) => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f0f0', padding: '10px', marginBottom: '5px' }}>
            <div>
              <strong>@{u.pseudo}</strong> — <span style={{ color: '#666' }}>{u.email}</span>
            </div>
            <form action={validerUtilisateur.bind(null, u.id)}>
              <button type="submit" style={{ background: '#8a2be2', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                [ ACCEPTER ]
              </button>
            </form>
          </div>
        ))}
      </section>

      {/* SECTION : MODÉRATION PARIS */}
      <section style={{ marginTop: '40px' }}>
        <h2 style={{ color: '#0070f3' }}>1. Modération des Paris</h2>
        {enAttente?.length === 0 && <p>RAS.</p>}
        {enAttente?.map((pari) => (
          <div key={pari.id} style={{ border: '1px solid black', padding: '15px', marginBottom: '10px', background: '#fff' }}>
            <p><strong>{pari.titre}</strong> ({pari.issue_1} vs {pari.issue_2})</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <form action={validerPari.bind(null, pari.id)}>
                <button type="submit" style={{ background: '#90ee90', cursor: 'pointer' }}>[ APPROUVER ]</button>
              </form>
              <form action={supprimerPari.bind(null, pari.id)}>
                <button type="submit" style={{ background: '#ffcccb', cursor: 'pointer' }}>[ REFUSER ]</button>
              </form>
            </div>
          </div>
        ))}
      </section>

      {/* SECTION : RÉSOLUTION GAINS */}
      <section style={{ marginTop: '40px' }}>
        <h2 style={{ color: '#e00' }}>2. Résultats & Gains</h2>
        {aResoudre?.length === 0 && <p>Rien à résoudre pour le moment.</p>}
        {aResoudre?.map((pari) => (
          <div key={pari.id} style={{ border: '2px solid red', padding: '15px', marginBottom: '10px' }}>
            <p><strong>{pari.titre}</strong> terminé.</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <form action={resoudreGains.bind(null, pari.id, 1)}>
                <button type="submit" style={{ background: '#000', color: '#fff', cursor: 'pointer' }}>Vainqueur : {pari.issue_1}</button>
              </form>
              <form action={resoudreGains.bind(null, pari.id, 2)}>
                <button type="submit" style={{ background: '#000', color: '#fff', cursor: 'pointer' }}>Vainqueur : {pari.issue_2}</button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}