import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const makeClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' })
    }
  }
)

export default async function AdminPage() {
  const now = new Date().toISOString()
  const adminClient = makeClient()

  const { data: usersEnAttente } = await adminClient
    .from('profiles')
    .select('id, pseudo')
    .eq('is_validated', false)

  const { data: authData } = await adminClient.auth.admin.listUsers()
  const emailMap: Record<string, string> = (authData?.users || []).reduce((acc: any, u: any) => {
    acc[u.id] = u.email
    return acc
  }, {})

  const { data: enAttente } = await adminClient
    .from('paris')
    .select('*')
    .eq('status', 'en_attente')

  const { data: aResoudre } = await adminClient
    .from('paris')
    .select('*')
    .eq('status', 'valide')
    .lt('echeance', now)

  const { data: allProfiles } = await adminClient
    .from('profiles')
    .select('id, pseudo')

  const profileMap: Record<string, string> = (allProfiles || []).reduce((acc: any, p: any) => {
    acc[p.id] = p.pseudo
    return acc
  }, {})

  async function validerUtilisateur(id: string) {
    'use server'
    await makeClient().from('profiles').update({ is_validated: true }).eq('id', id)
    revalidatePath('/admin')
  }

  async function validerPari(id: string) {
    'use server'
    await makeClient().from('paris').update({ status: 'valide' }).eq('id', id)
    revalidatePath('/admin')
    revalidatePath('/')
  }

  async function supprimerPari(id: string) {
    'use server'
    await makeClient().from('paris').delete().eq('id', id)
    revalidatePath('/admin')
  }

  async function resoudreGains(id: string, issue: number) {
    'use server'
    const { error } = await makeClient().rpc('distribuer_gains', {
      pari_id_input: id,
      issue_gagnante: issue
    })
    if (error) console.error('Erreur résolution:', error.message)
    revalidatePath('/admin')
    revalidatePath('/')
  }

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #000' }}>PANEL ADMIN GLOBAL</h1>
      <a href="/">[ RETOUR ACCUEIL ]</a>

      <section style={{ marginTop: '40px', border: '2px solid #555', padding: '15px' }}>
        <h2 style={{ color: '#8a2be2' }}>0. Validation des Inscriptions</h2>
        {!usersEnAttente?.length && <p>Aucun nouvel utilisateur à valider.</p>}
        {usersEnAttente?.map((u) => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f0f0', padding: '10px', marginBottom: '5px' }}>
            <div>
              <strong>@{u.pseudo}</strong> — <span style={{ color: '#666' }}>{emailMap[u.id] ?? 'email inconnu'}</span>
            </div>
            <form action={validerUtilisateur.bind(null, u.id)}>
              <button type="submit" style={{ background: '#8a2be2', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                [ ACCEPTER ]
              </button>
            </form>
          </div>
        ))}
      </section>

      <section style={{ marginTop: '40px' }}>
        <h2 style={{ color: '#0070f3' }}>1. Modération des Paris</h2>
        {!enAttente?.length && <p>RAS.</p>}
        {enAttente?.map((pari) => (
          <div key={pari.id} style={{ border: '1px solid black', padding: '15px', marginBottom: '10px' }}>
            <p><strong>{pari.titre}</strong> ({pari.issue_1} vs {pari.issue_2})</p>
            <p style={{ fontSize: '0.8em', color: '#555', margin: '4px 0' }}>
              👤 @{profileMap[pari.createur_id] ?? 'Inconnu'} — 📅 {new Date(pari.echeance).toLocaleString('fr-FR')}
            </p>
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

      <section style={{ marginTop: '40px' }}>
        <h2 style={{ color: '#e00' }}>2. Résultats & Gains</h2>
        {!aResoudre?.length && <p>Rien à résoudre pour le moment.</p>}
        {aResoudre?.map((pari) => (
          <div key={pari.id} style={{ border: '2px solid red', padding: '15px', marginBottom: '10px' }}>
            <p><strong>{pari.titre}</strong> ({pari.issue_1} vs {pari.issue_2})</p>
            <p style={{ fontSize: '0.8em', color: '#555', margin: '4px 0' }}>
              👤 @{profileMap[pari.createur_id] ?? 'Inconnu'} — 📅 {new Date(pari.echeance).toLocaleString('fr-FR')}
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <form action={resoudreGains.bind(null, pari.id, 1)}>
                <button type="submit" style={{ background: '#000', color: '#fff', cursor: 'pointer' }}>
                  Vainqueur : {pari.issue_1}
                </button>
              </form>
              <form action={resoudreGains.bind(null, pari.id, 2)}>
                <button type="submit" style={{ background: '#000', color: '#fff', cursor: 'pointer' }}>
                  Vainqueur : {pari.issue_2}
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}