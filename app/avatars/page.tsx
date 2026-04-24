'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const TOUS_LES_AVATARS = [
  { url: '/avatars/pikshark_5.png', label: 'PXK', prix: 5 },
  { url: '/avatars/4ever_100.png', label: '4Ever', prix: 100 },
  { url: '/avatars/macro_100.png', label: 'Macro', prix: 100 },
  { url: '/avatars/micro_100.png', label: 'Micro', prix: 100 },
  { url: '/avatars/econo_100.png', label: 'Econo', prix: 100 },
  { url: '/avatars/kfet_200.png', label: 'Kfet', prix: 200 },
  { url: '/avatars/zarch_200.png', label: 'Zarch', prix: 200 },
  { url: '/avatars/chouffe_300.png', label: 'Chouffe', prix: 300 },
  { url: '/avatars/ocho.png', label: 'Ocho', prix: 350 },
  { url: '/avatars/jnr.png', label: 'jnr', prix: 350 },
  { url: '/avatars/putin_550.png', label: 'VLAD', prix: 550 },
  { url: '/avatars/xi_600.png', label: 'Xi', prix: 600 },
  { url: '/avatars/voile_999.png', label: 'Voile', prix: 999 },
  { url: '/avatars/darby_1000.png', label: 'Darby', prix: 1000 },
  { url: '/avatars/dio_9999.png', label: 'dio', prix: 9999 },
]

export default function AvatarsPage() {
  const [user, setUser] = useState<any>(null)
  const [profil, setProfil] = useState<any>(null)
  const [possedes, setPossedes] = useState<string[]>([])
  const [message, setMessage] = useState<{ texte: string, ok: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }
      setUser(authUser)

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setProfil(p)

      const { data: av } = await supabase
        .from('avatars_possedes')
        .select('avatar_url')
        .eq('user_id', authUser.id)
      setPossedes((av || []).map((a: any) => a.avatar_url))

      setLoading(false)
    }
    fetchData()
  }, [])

  const selectionnerAvatar = async (url: string) => {
    if (!user || profil?.avatar_url === url) return
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
    setProfil({ ...profil, avatar_url: url })
    setMessage({ texte: 'Avatar sélectionné !', ok: true })
    setTimeout(() => setMessage(null), 2000)
  }

  const acheterAvatar = async (avatar: typeof TOUS_LES_AVATARS[0]) => {
    if (!user || !profil) return
    if (profil.golembucks < avatar.prix) {
      setMessage({ texte: 'Solde insuffisant !', ok: false })
      setTimeout(() => setMessage(null), 2000)
      return
    }
    if (!confirm(`Acheter "${avatar.label}" pour ${avatar.prix} GB ?`)) return

    const { error } = await supabase.rpc('acheter_avatar', {
      p_user_id: user.id,
      p_avatar_url: avatar.url,
      p_prix: avatar.prix
    })

    if (error) {
      setMessage({ texte: 'Erreur : ' + error.message, ok: false })
    } else {
      setPossedes([...possedes, avatar.url])
      setProfil({ ...profil, golembucks: profil.golembucks - avatar.prix })
      setMessage({ texte: `"${avatar.label}" acheté !`, ok: true })
    }
    setTimeout(() => setMessage(null), 2000)
  }

  const avatarsPossedes = TOUS_LES_AVATARS.filter(a => possedes.includes(a.url))
  const avatarsNonPossedes = TOUS_LES_AVATARS
    .filter(a => !possedes.includes(a.url))
    .sort((a, b) => a.prix - b.prix)

  if (loading) return <p style={{ fontFamily: 'monospace', padding: '20px' }}>Chargement...</p>
  if (!user) return <div style={{ padding: '20px', fontFamily: 'monospace' }}><a href="/login">[ CONNEXION REQUISE ]</a></div>

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <a href="/profil" style={{ color: 'blue' }}>{'<- Retour au profil'}</a>
      <h1 style={{ borderBottom: '2px solid black', paddingBottom: '10px' }}>[ AVATARS ]</h1>
      <p style={{ color: '#666' }}>Solde : <strong>{profil?.golembucks} GB</strong></p>

      {message && (
        <p style={{ color: message.ok ? '#2e7d32' : '#c62828', fontWeight: 'bold', marginBottom: '10px' }}>
          {message.texte}
        </p>
      )}

      {/* AVATARS POSSÉDÉS */}
      <section style={{ marginTop: '20px' }}>
        <h3>PHOTOS DE PROFIL</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '10px' }}>
          {avatarsPossedes.map((avatar) => {
            const estActuel = profil?.avatar_url === avatar.url
            return (
              <div
                key={avatar.url}
                onClick={() => selectionnerAvatar(avatar.url)}
                style={{
                  border: estActuel ? '3px solid #2e7d32' : '2px solid #ccc',
                  padding: '10px',
                  textAlign: 'center',
                  cursor: estActuel ? 'default' : 'pointer',
                  width: '90px'
                }}
              >
                <img
                  src={avatar.url}
                  alt={avatar.label}
                  style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                />
                <p style={{ margin: '6px 0 0', fontSize: '0.75em' }}>
                  {avatar.label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.7em', color: estActuel ? '#2e7d32' : '#888' }}>
                  {estActuel ? '✓ actif' : 'sélectionner'}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* AVATARS NON POSSÉDÉS */}
      {avatarsNonPossedes.length > 0 && (
        <section style={{ marginTop: '30px' }}>
          <h3>BOUTIQUE</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid black', backgroundColor: '#f9f9f9' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>NOM</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>PRIX</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {avatarsNonPossedes.map((avatar) => {
                const peutAcheter = profil?.golembucks >= avatar.prix
                return (
                  <tr key={avatar.url} style={{ borderBottom: '1px solid #eee', opacity: peutAcheter ? 1 : 0.5 }}>
                    <td style={{ padding: '10px' }}>{avatar.label}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{avatar.prix} GB</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        onClick={() => acheterAvatar(avatar)}
                        disabled={!peutAcheter}
                        style={{ padding: '5px 12px', cursor: peutAcheter ? 'pointer' : 'not-allowed', backgroundColor: peutAcheter ? 'black' : '#ccc', color: 'white', border: 'none', fontFamily: 'monospace' }}
                      >
                        ACHETER
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  )
}