import { supabase } from "@/lib/supabase";

export default async function ProfilPage({ params }: { params: { pseudo: string } }) {
  // 1. Récupérer les infos du profil
  const { data: profil } = await supabase
    .from('profiles')
    .select('*')
    .eq('pseudo', params.pseudo)
    .single();

  // 2. Récupérer les mises de cet utilisateur
  const { data: mises } = await supabase
    .from('mises')
    .select('*, paris(titre)')
    .eq('user_id', profil?.id);

  return (
    <main style={{ padding: '20px', fontFamily: 'serif', maxWidth: '600px', margin: 'auto' }}>
      <div style={{ border: '1px solid black', padding: '10px', marginBottom: '20px' }}>
        <h2>Profil : @{params.pseudo}</h2>
        <p>Solde actuel : <strong>{profil?.golembucks} Golembucks</strong></p>
        <p><small>Compte créé le : {new Date(profil?.created_at).toLocaleDateString()}</small></p>
        <button>Modifier photo de profil</button>
      </div>

      <h3>Mes paris en cours / pris</h3>
      <div style={{ borderTop: '1px solid black' }}>
        {mises?.map((m, i) => (
          <div key={i} style={{ padding: '10px', borderBottom: '1px dotted black' }}>
            <p><strong>{m.paris?.titre}</strong></p>
            <p>Mise : {m.montant} GB sur l'issue {m.issue_choisie}</p>
          </div>
        ))}
      </div>
      <br />
      <a href="/">[ Retour à l'accueil ]</a>
    </main>
  );
}