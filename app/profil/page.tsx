'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AVATARS = [
  { url: '/avatars/pikshark_5.png', label: 'PXK', prix: 5 },
  { url: '/avatars/4ever_100.png', label: '4Ever', prix: 100 },
  { url: '/avatars/macro_100.png', label: 'Macro', prix: 100 },
  { url: '/avatars/micro_100.png', label: 'Micro', prix: 100 },
  { url: '/avatars/econo_100.png', label: 'Econo', prix: 100 },
  { url: '/avatars/kfet_200.png', label: 'Kfet', prix: 200 },
  { url: '/avatars/zarch_200.png', label: 'Zarch', prix: 200 },
  { url: '/avatars/putin_550.png', label: 'VLAD', prix: 550 },
  { url: '/avatars/xi_600.png', label: 'Xi', prix: 600 },
  { url: '/avatars/voile_999.png', label: 'Voile', prix: 999 },
  { url: '/avatars/darby_1000.png', label: 'Darby', prix: 1000 },
  { url: '/avatars/dio_9999.png', label: 'dio', prix: 9999 },
]

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null)
  const [profil, setProfil] = useState<any>(null)
  const [mises, setMises] = useState<any[]>([])
  const [paris, setParis] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }
      setUser(authUser)

      const { data: profilData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setProfil(profilData)

      // Historique des mises
      const { data: m } = await supabase
        .from('mises')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setMises(m || [])

      // Récupérer les paris associés aux mises
      if (m && m.length > 0) {
        const pariIds = [...new Set(m.map((mise: any) => mise.pari_id))]
        const { data: parisData } = await supabase
          .from('paris')
          .select('id, titre, issue_1, issue_2, gagnant, status')
          .in('id', pariIds)
        const map: Record<string, any> = {}
        parisData?.forEach((par: any) => { map[par.id] = par })
        setParis(map)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const gainTotal = mises.reduce((acc, mise) => {
    const pari = paris[mise.pari_id]
    if (!pari || pari.status !== 'termine') return acc
    return acc + (mise.issue_choisie === pari.gagnant ? mise.montant : -mise.montant)
  }, 0)

  if (loading) return <p style={{ fontFamily: 'monospace', padding: '20px' }}>Chargement...</p>
  if (!user) return <div style={{ padding: '20px', fontFamily: 'monospace' }}><a href="/login">[ CONNEXION REQUISE ]</a></div>

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <a href="/" style={{ color: 'blue' }}>{"<- Retour"}</a>

      {/* INFOS PROFIL */}
      <section style={{ border: '2px solid black', padding: '20px', marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <img
          src={profil?.avatar_url || '/avatars/golem.png'}
          alt="avatar"
          style={{ width: '80px', height: '80px', objectFit: 'cover', border: '2px solid black' }}
        />
        <div>
          <h2 style={{ margin: '0 0 6px' }}>@{profil?.pseudo}</h2>
          <p style={{ margin: '0 0 4px' }}>
            <strong>{profil?.golembucks} GB</strong>
          </p>
          <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>
            Statut : {profil?.is_validated ? '✓ validé' : '⏳ en attente'}
            {profil?.is_admin && ' — ADMIN'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.8em', color: gainTotal >= 0 ? '#2e7d32' : '#c62828' }}>
            Bilan paris terminés : {gainTotal >= 0 ? '+' : ''}{gainTotal} GB
          </p>
        </div>
      </section>

      <section style={{ marginTop: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>AVATAR</h3>
        <a href="/avatars" style={{ display: 'inline-block', marginTop: '10px', padding: '8px 15px', backgroundColor: 'black', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
            GÉRER MES AVATARS
        </a>
      </section>

      {/* HISTORIQUE DES MISES */}
      <section style={{ marginTop: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>HISTORIQUE DES MISES</h3>
        {mises.length === 0 ? (
          <p style={{ color: '#666' }}>Aucune mise pour l'instant.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid black', backgroundColor: '#f9f9f9' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>PARI</th>
                <th style={{ padding: '8px' }}>MISE</th>
                <th style={{ padding: '8px' }}>ISSUE</th>
                <th style={{ padding: '8px' }}>RÉSULTAT</th>
              </tr>
            </thead>
            <tbody>
              {mises.map((mise) => {
                const pari = paris[mise.pari_id]
                const termine = pari?.status === 'termine'
                const gagne = termine && mise.issue_choisie === pari?.gagnant
                const perdu = termine && mise.issue_choisie !== pari?.gagnant
                return (
                  <tr key={mise.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', fontSize: '0.85em' }}>
                      {pari?.titre ?? '—'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                      {mise.montant} GB
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '0.85em' }}>
                      {pari ? (mise.issue_choisie === 1 ? pari.issue_1 : pari.issue_2) : '—'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {!termine && <span style={{ color: '#888' }}>en cours</span>}
                      {gagne && <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ gagné</span>}
                      {perdu && <span style={{ color: '#c62828', fontWeight: 'bold' }}>✗ perdu</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}