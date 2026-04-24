'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SPRITES = [
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/129.png',      shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/129.png' },
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/yellow/129.png',         shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/129.png' },
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/129.png',          shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/shiny/129.png' },
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/silver/129.png',        shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/129.png' },
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/ruby-sapphire/129.png',shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/ruby-sapphire/shiny/129.png' },
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/129.png',      shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/ruby-sapphire/shiny/129.png' },
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/diamond-pearl/129.png', shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/diamond-pearl/shiny/129.png' },
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/129.png',      shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/shiny/129.png' },
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/129.png',    shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/shiny/129.png' },
  { normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png',                                      shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/129.png' },
]

const NATURES_MAP: Record<string, string> = {
  'Hardi':'neutre','Solitaire':'+Atq / -Déf','Brave':'+Atq / -Vit','Rigide':'+Atq / -Atq Spé','Mauvais':'+Atq / -Déf Spé',
  'Audacieux':'+Déf / -Atq','Docile':'neutre','Relax':'+Déf / -Vit','Malin':'+Déf / -Atq Spé','Laxiste':'+Déf / -Déf Spé',
  'Timide':'+Vit / -Atq','Pressé':'+Vit / -Déf','Sérieux':'neutre','Jovial':'+Vit / -Atq Spé','Naïf':'+Vit / -Déf Spé',
  'Modeste':'+Atq Spé / -Atq','Doux':'+Atq Spé / -Déf','Discret':'+Atq Spé / -Vit','Badin':'neutre','Fougueux':'+Atq Spé / -Déf Spé',
  'Calme':'+Déf Spé / -Atq','Gentil':'+Déf Spé / -Déf','Brusque':'+Déf Spé / -Vit','Prudent':'+Déf Spé / -Atq Spé','Bizarre':'neutre',
}

const ivColor = (v: number) => v === 31 ? '#2e7d32' : v === 0 ? '#c62828' : '#444'

export default function ProfilPage() {
  const [user, setUser]           = useState<any>(null)
  const [profil, setProfil]       = useState<any>(null)
  const [mises, setMises]         = useState<any[]>([])
  const [paris, setParis]         = useState<Record<string, any>>({})
  const [magikarps, setMagikarps] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [renamingId, setRenamingId]   = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }
      setUser(authUser)

      const { data: profilData } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      setProfil(profilData)

      const { data: m } = await supabase.from('mises').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(20)
      setMises(m || [])

      if (m && m.length > 0) {
        const pariIds = [...new Set(m.map((mise: any) => mise.pari_id))]
        const { data: parisData } = await supabase.from('paris').select('id, titre, issue_1, issue_2, gagnant, status').in('id', pariIds)
        const map: Record<string, any> = {}
        parisData?.forEach((par: any) => { map[par.id] = par })
        setParis(map)
      }

      const { data: mkData } = await supabase.from('magikarps').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false })
      setMagikarps(mkData || [])

      setLoading(false)
    }
    fetchData()
  }, [])

  const gainTotal = mises.reduce((acc, mise) => {
    const pari = paris[mise.pari_id]
    if (!pari || pari.status !== 'termine') return acc
    return acc + (mise.issue_choisie === pari.gagnant ? mise.montant : -mise.montant)
  }, 0)

  const startRename = (mk: any) => {
    setRenamingId(mk.id)
    setRenameValue(mk.surnom ?? mk.nom)
  }

  const submitRename = async (id: string) => {
    const trimmed = renameValue.trim()
    if (trimmed) {
      const { error } = await supabase.from('magikarps').update({ surnom: trimmed }).eq('id', id)
      if (!error) setMagikarps(prev => prev.map(mk => mk.id === id ? { ...mk, surnom: trimmed } : mk))
    }
    setRenamingId(null)
  }

  const relacher = async (mk: any) => {
    const nom = mk.surnom ?? mk.nom
    if (!window.confirm(`Relâcher ${nom} définitivement ? Cette action est irréversible.`)) return
    if (profil?.featured_magikarp_id === mk.id) {
      await supabase.from('profiles').update({ featured_magikarp_id: null }).eq('id', user.id)
      setProfil((prev: any) => ({ ...prev, featured_magikarp_id: null }))
    }
    const { error } = await supabase.from('magikarps').delete().eq('id', mk.id)
    if (error) { alert('Erreur : ' + error.message); return }
    setMagikarps(prev => prev.filter(m => m.id !== mk.id))
  }

  const toggleFeatured = async (id: string) => {
    const newId = profil?.featured_magikarp_id === id ? null : id
    const { error } = await supabase.from('profiles').update({ featured_magikarp_id: newId }).eq('id', user.id)
    if (!error) setProfil((prev: any) => ({ ...prev, featured_magikarp_id: newId }))
  }

  if (loading) return <p style={{ fontFamily: 'monospace', padding: '20px' }}>Chargement...</p>
  if (!user)   return <div style={{ padding: '20px', fontFamily: 'monospace' }}><a href="/login">[ CONNEXION REQUISE ]</a></div>

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <a href="/" style={{ color: 'blue' }}>{'<- Retour'}</a>

      {/* INFOS PROFIL */}
      {(() => {
        const featuredMk = profil?.featured_magikarp_id
          ? magikarps.find(mk => mk.id === profil.featured_magikarp_id)
          : null
        const fSprite = featuredMk ? SPRITES[featuredMk.sprite_id ?? 9][featuredMk.is_shiny ? 'shiny' : 'normal'] : null
        const fName   = featuredMk ? (featuredMk.surnom ?? featuredMk.nom) : null

        return (
          <section style={{ border: '2px solid black', padding: '20px', marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <img src={profil?.avatar_url || '/avatars/golem.png'} alt="avatar" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '2px solid black' }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 6px' }}>@{profil?.pseudo}</h2>
              <p style={{ margin: '0 0 4px' }}><strong>{profil?.golembucks} GB</strong></p>
              <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>
                Statut : {profil?.is_validated ? '✓ validé' : '⏳ en attente'}
                {profil?.is_admin && ' — ADMIN'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8em', color: gainTotal >= 0 ? '#2e7d32' : '#c62828' }}>
                Bilan paris terminés : {gainTotal >= 0 ? '+' : ''}{gainTotal} GB
              </p>
            </div>
            {featuredMk && fSprite && (
              <div style={{ textAlign: 'center', borderLeft: '1px solid #eee', paddingLeft: '20px', flexShrink: 0 }}>
                <img src={fSprite} alt={fName!} style={{ width: '64px', imageRendering: 'pixelated', display: 'block', margin: '0 auto' }} />
                <div style={{ fontSize: '0.72em', fontWeight: 'bold', color: featuredMk.is_shiny ? '#e65100' : '#c0392b', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {featuredMk.is_shiny ? '✨ ' : '⭐ '}{fName}
                </div>
              </div>
            )}
          </section>
        )
      })()}

      {/* AVATAR */}
      <section style={{ marginTop: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>AVATAR</h3>
        <a href="/avatars" style={{ display: 'inline-block', marginTop: '10px', padding: '8px 15px', backgroundColor: 'black', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
          GÉRER MES AVATARS
        </a>
      </section>

      {/* ÉQUIPE MAGIKARPE */}
      <section style={{ marginTop: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          ÉQUIPE MAGIKARPE
          <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: magikarps.filter((m: any) => !m.en_vente).length >= 6 ? 'red' : '#666' }}>
            {magikarps.filter((m: any) => !m.en_vente).length} / 6
          </span>
        </h3>

        {magikarps.length === 0 ? (
          <p style={{ color: '#666' }}>
            Équipe vide. <a href="/casino" style={{ color: 'purple' }}>Aller pêcher au Lac de l'X →</a>
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', marginTop: '12px' }}>
            {magikarps.map((mk: any) => {
              const spriteUrl = SPRITES[mk.sprite_id ?? 9][mk.is_shiny ? 'shiny' : 'normal']
              const displayName = mk.surnom ?? mk.nom
              const effet = NATURES_MAP[mk.nature] ?? '—'
              const isRenaming = renamingId === mk.id

              return (
                <div key={mk.id} style={{ border: `2px solid ${mk.is_shiny ? '#f9a825' : '#c0392b'}`, padding: '10px', backgroundColor: mk.is_shiny ? '#fffde7' : '#fff8f8', fontSize: '0.82em' }}>

                  {/* Header: sprite + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img src={spriteUrl} alt="" style={{ width: '48px', imageRendering: 'pixelated', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isRenaming ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') submitRename(mk.id); if (e.key === 'Escape') setRenamingId(null); }}
                            autoFocus
                            style={{ fontFamily: 'monospace', fontSize: '0.9em', border: '1px solid #999', padding: '2px 4px', width: '100%' }}
                          />
                          <button onClick={() => submitRename(mk.id)} style={{ fontFamily: 'monospace', fontSize: '0.8em', border: '1px solid #333', padding: '2px 6px', cursor: 'pointer', backgroundColor: '#000', color: '#fff' }}>✓</button>
                          <button onClick={() => setRenamingId(null)} style={{ fontFamily: 'monospace', fontSize: '0.8em', border: '1px solid #999', padding: '2px 6px', cursor: 'pointer' }}>✗</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ color: mk.is_shiny ? '#e65100' : '#c0392b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mk.is_shiny && '✨ '}{displayName}
                          </strong>
                          <button
                            onClick={() => startRename(mk)}
                            title="Renommer"
                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85em', padding: '0 2px', color: '#888', flexShrink: 0 }}
                          >✏️</button>
                          <button
                            onClick={() => toggleFeatured(mk.id)}
                            title={profil?.featured_magikarp_id === mk.id ? 'Retirer de la vitrine' : 'Mettre en vitrine'}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85em', padding: '0 2px', flexShrink: 0, opacity: profil?.featured_magikarp_id === mk.id ? 1 : 0.35 }}
                          >⭐</button>
                          {!mk.en_vente && (
                            <button
                              onClick={() => relacher(mk)}
                              title="Relâcher"
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85em', padding: '0 2px', color: '#c62828', flexShrink: 0 }}
                            >🌊</button>
                          )}
                        </div>
                      )}
                      {mk.is_shiny && <span style={{ fontSize: '0.75em', backgroundColor: '#f9a825', color: '#000', padding: '0 4px' }}>CHROMATIQUE</span>}
            {mk.en_vente && <span style={{ fontSize: '0.75em', backgroundColor: '#2e7d32', color: '#fff', padding: '0 4px', marginLeft: '2px' }}>EN VENTE</span>}
                      <div style={{ color: '#666', marginTop: '2px' }}>{mk.nature} ({effet})</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ color: '#555', marginBottom: '6px' }}>
                    {mk.poids} kg — {mk.taille} m
                  </div>

                  {/* IVs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 8px' }}>
                    {([['PV', mk.iv_pv],['Atq', mk.iv_atq],['Déf', mk.iv_def],['ASpé', mk.iv_atq_spe],['DSpé', mk.iv_def_spe],['Vit', mk.iv_vit]] as [string,number][]).map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>{label}</span>
                        <strong style={{ color: ivColor(val) }}>{val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
                const pari    = paris[mise.pari_id]
                const termine = pari?.status === 'termine'
                const gagne   = termine && mise.issue_choisie === pari?.gagnant
                const perdu   = termine && mise.issue_choisie !== pari?.gagnant
                return (
                  <tr key={mise.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', fontSize: '0.85em' }}>{pari?.titre ?? '—'}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{mise.montant} GB</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '0.85em' }}>
                      {pari ? (mise.issue_choisie === 1 ? pari.issue_1 : pari.issue_2) : '—'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {!termine && <span style={{ color: '#888' }}>en cours</span>}
                      {gagne   && <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ gagné</span>}
                      {perdu   && <span style={{ color: '#c62828', fontWeight: 'bold' }}>✗ perdu</span>}
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
