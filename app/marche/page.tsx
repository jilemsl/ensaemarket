"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
];

const NATURES_MAP: Record<string, string> = {
  'Hardi':'neutre','Solitaire':'+Atq/-Déf','Brave':'+Atq/-Vit','Rigide':'+Atq/-ASpé','Mauvais':'+Atq/-DSpé',
  'Audacieux':'+Déf/-Atq','Docile':'neutre','Relax':'+Déf/-Vit','Malin':'+Déf/-ASpé','Laxiste':'+Déf/-DSpé',
  'Timide':'+Vit/-Atq','Pressé':'+Vit/-Déf','Sérieux':'neutre','Jovial':'+Vit/-ASpé','Naïf':'+Vit/-DSpé',
  'Modeste':'+ASpé/-Atq','Doux':'+ASpé/-Déf','Discret':'+ASpé/-Vit','Badin':'neutre','Fougueux':'+ASpé/-DSpé',
  'Calme':'+DSpé/-Atq','Gentil':'+DSpé/-Déf','Brusque':'+DSpé/-Vit','Prudent':'+DSpé/-ASpé','Bizarre':'neutre',
};

const ivColor = (v: number) => v === 31 ? '#2e7d32' : v === 0 ? '#c62828' : '#444';

const daysLeft = (expires: string) => {
  const d = Math.ceil((new Date(expires).getTime() - Date.now()) / 86400000);
  return d <= 0 ? 'expire bientôt' : `${d}j`;
};

const spriteUrl = (mk: any) => SPRITES[mk.sprite_id ?? 9][mk.is_shiny ? 'shiny' : 'normal'];
const mkName    = (mk: any) => (mk.is_shiny ? '✨ ' : '') + (mk.surnom ?? mk.nom);

type Tab = 'annonces' | 'creer' | 'mes';

export default function MarchePage() {
  const [user, setUser]     = useState<any>(null);
  const [profil, setProfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState<Tab>('annonces');

  // Annonces
  const [annonces, setAnnonces]   = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [buying, setBuying]       = useState<string | null>(null);

  // Créer
  const [mesKarps, setMesKarps]         = useState<any[]>([]);
  const [selectedKarpId, setSelectedKarpId] = useState('');
  const [prix, setPrix]                 = useState('');
  const [creating, setCreating]         = useState(false);

  // Mes annonces
  const [mesAnnonces, setMesAnnonces] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: cu } }) => {
      if (cu) {
        setUser(cu);
        supabase.from('profiles').select('*').eq('id', cu.id).single().then(({ data }) => setProfil(data));
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    if (tab === 'annonces') fetchAnnonces();
    if (tab === 'creer')    fetchMesKarps();
    if (tab === 'mes')      fetchMesAnnonces();
  }, [tab, user]); // eslint-disable-line

  const fetchAnnonces = async () => {
    const { data } = await supabase
      .from('annonces')
      .select('*, magikarp:magikarps(*), vendeur:profiles!vendeur_id(pseudo)')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    setAnnonces(data || []);
  };

  const fetchMesKarps = async () => {
    const { data } = await supabase
      .from('magikarps').select('*')
      .eq('user_id', user.id).eq('en_vente', false)
      .order('created_at', { ascending: false });
    setMesKarps(data || []);
  };

  const fetchMesAnnonces = async () => {
    const { data } = await supabase
      .from('annonces')
      .select('*, magikarp:magikarps(*)')
      .eq('vendeur_id', user.id)
      .order('created_at', { ascending: false });
    setMesAnnonces(data || []);
  };

  const acheter = async (annonce: any) => {
    const nom = mkName(annonce.magikarp);
    if (!window.confirm(`Acheter ${nom} pour ${annonce.prix} GB ?`)) return;
    if (profil.golembucks < annonce.prix) { alert('Solde insuffisant !'); return; }

    const { count } = await supabase.from('magikarps').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('en_vente', false);
    if ((count || 0) >= 6) { alert("Ton équipe est pleine (6/6) !"); return; }

    setBuying(annonce.id);
    const { error: e1 } = await supabase.from('profiles').update({ golembucks: profil.golembucks - annonce.prix }).eq('id', user.id);
    if (e1) { alert('Erreur paiement : ' + e1.message); setBuying(null); return; }

    const { error: e2 } = await supabase.from('annonces').update({ status: 'vendue', acheteur_id: user.id }).eq('id', annonce.id);
    if (e2) { alert('Erreur annonce : ' + e2.message); setBuying(null); return; }

    const { error: e3 } = await supabase.from('magikarps').update({ user_id: user.id, en_vente: false }).eq('id', annonce.magikarp_id);
    if (e3) { alert('Erreur transfert : ' + e3.message); setBuying(null); return; }

    setProfil((p: any) => ({ ...p, golembucks: p.golembucks - annonce.prix }));
    alert(`${nom} rejoint ton équipe !`);
    setBuying(null);
    fetchAnnonces();
  };

  const creerAnnonce = async () => {
    if (!selectedKarpId) { alert('Sélectionne un Magikarpe.'); return; }
    const prixNum = parseInt(prix);
    if (!prixNum || prixNum <= 0) { alert('Prix invalide.'); return; }

    setCreating(true);
    const { error: e1 } = await supabase.from('annonces').insert([{ vendeur_id: user.id, magikarp_id: selectedKarpId, prix: prixNum }]);
    if (e1) { alert('Erreur : ' + e1.message); setCreating(false); return; }

    await supabase.from('magikarps').update({ en_vente: true }).eq('id', selectedKarpId);
    setSelectedKarpId(''); setPrix(''); setCreating(false);
    setTab('annonces');
  };

  const annuler = async (annonce: any) => {
    if (!window.confirm('Annuler cette annonce et récupérer ton Magikarpe ?')) return;
    await supabase.from('annonces').update({ status: 'annulee' }).eq('id', annonce.id);
    await supabase.from('magikarps').update({ en_vente: false }).eq('id', annonce.magikarp_id);
    fetchMesAnnonces();
  };

  const reclamerGB = async (annonce: any) => {
    const { data: fresh } = await supabase.from('profiles').select('golembucks').eq('id', user.id).single();
    const newBal = (fresh?.golembucks || 0) + annonce.prix;
    await supabase.from('profiles').update({ golembucks: newBal }).eq('id', user.id);
    await supabase.from('annonces').update({ gb_reclame: true }).eq('id', annonce.id);
    setProfil((p: any) => ({ ...p, golembucks: newBal }));
    setMesAnnonces(prev => prev.map(a => a.id === annonce.id ? { ...a, gb_reclame: true } : a));
  };

  const tabStyle = (t: Tab) => ({
    padding: '8px 16px', cursor: 'pointer',
    border: '2px solid black', borderBottom: tab === t ? 'none' : '2px solid black',
    backgroundColor: tab === t ? '#fff' : '#eee',
    fontWeight: 'bold' as const, fontFamily: 'monospace',
    marginBottom: '-2px', position: 'relative' as const, zIndex: tab === t ? 2 : 1,
  });

  const thStyle: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid black', backgroundColor: '#f4f4f4', fontWeight: 'bold', whiteSpace: 'nowrap' };
  const tdStyle: React.CSSProperties = { padding: '7px 10px', borderBottom: '1px solid #eee', verticalAlign: 'middle' };

  if (loading) return <p style={{ fontFamily: 'monospace', padding: '20px' }}>Chargement...</p>;
  if (!user)   return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'monospace' }}><a href="/login">[ CONNEXION REQUISE ]</a></div>;

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '960px', margin: '0 auto' }}>

      <nav style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '10px', alignItems: 'center' }}>
        <span style={{ color: 'violet', fontFamily: 'Comic Sans', fontWeight: 'bold', fontSize: '1.1em', letterSpacing: '0.05em', marginRight: '5px', borderRight: '2px solid black', paddingRight: '15px', lineHeight: '1.2' }}>
          ensaemarket
        </span>
        <a href="/profil">[ PROFIL ]</a>
        <a href="/creer">[ + PARI ]</a>
        <a href="/stats">[ STATS ]</a>
        <a href="/casino" style={{ color: 'purple', fontWeight: 'bold' }}>[ CASINO ]</a>
        <a href="/marche" style={{ color: 'green', fontWeight: 'bold' }}>[ MARCHÉ ]</a>
        {profil?.is_admin && <a href="/admin" style={{ color: 'red' }}>[ ADMIN ]</a>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={profil?.avatar_url || '/avatars/golem.png'} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #ccc' }} />
          <strong>@{profil?.pseudo}</strong> | {profil?.golembucks} GB
        </div>
      </nav>

      <h1>[ MARCHÉ ]</h1>

      <div style={{ display: 'flex', gap: '5px', marginTop: '20px' }}>
        <div style={tabStyle('annonces')} onClick={() => setTab('annonces')}>ANNONCES</div>
        <div style={tabStyle('creer')}    onClick={() => setTab('creer')}>CRÉER ANNONCE</div>
        <div style={tabStyle('mes')}      onClick={() => setTab('mes')}>VOS ANNONCES</div>
      </div>

      <div style={{ border: '2px solid black', padding: '20px', backgroundColor: 'white', minHeight: '400px' }}>

        {/* ── ANNONCES ── */}
        {tab === 'annonces' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0 }}>Annonces actives</h2>
              <button onClick={fetchAnnonces} style={{ fontFamily: 'monospace', border: '1px solid #ccc', padding: '4px 10px', cursor: 'pointer', background: 'none' }}>↺ Actualiser</button>
            </div>

            {annonces.length === 0 ? (
              <p style={{ color: '#888' }}>Aucune annonce active pour l'instant.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Magikarpe</th>
                      <th style={thStyle}>Nature</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>PV</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Atq</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Déf</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>ASpé</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>DSpé</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Vit</th>
                      <th style={thStyle}>Prix</th>
                      <th style={thStyle}>Vendeur</th>
                      <th style={thStyle}>Fin</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {annonces.map((a: any) => {
                      const mk = a.magikarp;
                      const isExpanded = expandedId === a.id;
                      const isMine = a.vendeur_id === user.id;
                      return (
                        <>
                          <tr key={a.id} style={{ backgroundColor: isExpanded ? '#f0f4ff' : 'white' }}>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img src={spriteUrl(mk)} alt="" style={{ width: '36px', imageRendering: 'pixelated' }} />
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', color: mk.is_shiny ? '#e65100' : '#c0392b', textDecoration: 'underline', padding: 0 }}
                                >
                                  {mkName(mk)}
                                </button>
                              </div>
                            </td>
                            <td style={tdStyle}>{mk.nature} <span style={{ color: '#888', fontSize: '0.85em' }}>({NATURES_MAP[mk.nature] ?? '—'})</span></td>
                            {([mk.iv_pv, mk.iv_atq, mk.iv_def, mk.iv_atq_spe, mk.iv_def_spe, mk.iv_vit] as number[]).map((v, i) => (
                              <td key={i} style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: ivColor(v) }}>{v}</td>
                            ))}
                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{a.prix} GB</td>
                            <td style={tdStyle}>@{a.vendeur?.pseudo ?? '—'}</td>
                            <td style={{ ...tdStyle, color: '#888' }}>{daysLeft(a.expires_at)}</td>
                            <td style={tdStyle}>
                              <button
                                onClick={() => acheter(a)}
                                disabled={isMine || buying === a.id}
                                title={isMine ? 'Vous ne pouvez pas acheter votre propre annonce' : ''}
                                style={{
                                  fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.85em',
                                  padding: '4px 10px', cursor: (isMine || buying) ? 'not-allowed' : 'pointer',
                                  border: '2px solid black',
                                  backgroundColor: isMine ? '#eee' : '#000',
                                  color: isMine ? '#aaa' : '#fff',
                                }}
                              >
                                {buying === a.id ? '...' : 'ACHETER'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={a.id + '-details'} style={{ backgroundColor: '#f0f4ff' }}>
                              <td colSpan={12} style={{ padding: '10px 16px', borderBottom: '1px solid #dde' }}>
                                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', fontSize: '0.85em' }}>
                                  <div><strong>Poids :</strong> {mk.poids} kg</div>
                                  <div><strong>Taille :</strong> {mk.taille} m</div>
                                  {mk.is_shiny && <div style={{ color: '#e65100', fontWeight: 'bold' }}>✨ CHROMATIQUE</div>}
                                  <div><strong>Obtenu le :</strong> {new Date(mk.created_at).toLocaleDateString('fr-FR')}</div>
                                  <div><strong>Annonce postée :</strong> {new Date(a.created_at).toLocaleDateString('fr-FR')}</div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── CRÉER ANNONCE ── */}
        {tab === 'creer' && (
          <div style={{ maxWidth: '440px' }}>
            <h2 style={{ marginTop: 0 }}>Mettre un Magikarpe en vente</h2>

            {mesKarps.length === 0 ? (
              <p style={{ color: '#888' }}>
                Ton équipe est vide ou tous tes Magikarpes sont déjà en vente.{' '}
                <a href="/casino" style={{ color: 'purple' }}>Va pêcher →</a>
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Select Magikarp */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Magikarpe</label>
                  <select
                    value={selectedKarpId}
                    onChange={e => setSelectedKarpId(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '0.9em', border: '2px solid black', padding: '6px 10px', width: '100%', backgroundColor: 'white' }}
                  >
                    <option value="">— Sélectionner —</option>
                    {mesKarps.map((mk: any) => (
                      <option key={mk.id} value={mk.id}>
                        {mk.is_shiny ? '✨ ' : ''}{mk.surnom ?? mk.nom} — {mk.nature} — IVs: {mk.iv_pv}/{mk.iv_atq}/{mk.iv_def}/{mk.iv_atq_spe}/{mk.iv_def_spe}/{mk.iv_vit}
                      </option>
                    ))}
                  </select>
                  {selectedKarpId && (() => {
                    const mk = mesKarps.find(k => k.id === selectedKarpId);
                    return mk ? (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #eee', padding: '8px' }}>
                        <img src={spriteUrl(mk)} alt="" style={{ width: '48px', imageRendering: 'pixelated' }} />
                        <div style={{ fontSize: '0.82em' }}>
                          <div style={{ fontWeight: 'bold', color: mk.is_shiny ? '#e65100' : '#c0392b' }}>{mkName(mk)}</div>
                          <div style={{ color: '#666' }}>{mk.nature} ({NATURES_MAP[mk.nature]})</div>
                          <div style={{ color: '#666' }}>{mk.poids} kg — {mk.taille} m</div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Prix */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Prix demandé (GB)</label>
                  <input
                    type="number" min="1" value={prix}
                    onChange={e => setPrix(e.target.value)}
                    placeholder="ex: 500"
                    style={{ fontFamily: 'monospace', fontSize: '0.9em', border: '2px solid black', padding: '6px 10px', width: '100%' }}
                  />
                </div>

                {/* Durée */}
                <div style={{ fontSize: '0.85em', color: '#666', border: '1px dashed #ccc', padding: '8px 12px' }}>
                  Durée de l'annonce : <strong>1 mois</strong>. Après expiration, le Magikarpe revient dans ton équipe.
                </div>

                <button
                  onClick={creerAnnonce}
                  disabled={creating || !selectedKarpId || !prix}
                  style={{
                    fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1em',
                    padding: '10px 20px', border: '2px solid black',
                    backgroundColor: (creating || !selectedKarpId || !prix) ? '#eee' : '#000',
                    color: (creating || !selectedKarpId || !prix) ? '#888' : '#fff',
                    cursor: (creating || !selectedKarpId || !prix) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creating ? 'Publication...' : '[ METTRE EN VENTE ]'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── VOS ANNONCES ── */}
        {tab === 'mes' && (
          <>
            <h2 style={{ marginTop: 0 }}>Vos annonces</h2>

            {mesAnnonces.length === 0 ? (
              <p style={{ color: '#888' }}>Vous n'avez aucune annonce.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Magikarpe</th>
                      <th style={thStyle}>Prix</th>
                      <th style={thStyle}>Statut</th>
                      <th style={thStyle}>Postée le</th>
                      <th style={thStyle}>Fin</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesAnnonces.map((a: any) => {
                      const mk = a.magikarp;
                      const expired = a.status === 'active' && new Date(a.expires_at) < new Date();
                      const effectiveStatus = expired ? 'expiree' : a.status;
                      const statusLabel: Record<string, string> = { active: 'ACTIVE', vendue: 'VENDUE', annulee: 'ANNULÉE', expiree: 'EXPIRÉE' };
                      const statusColor: Record<string, string> = { active: '#2e7d32', vendue: '#1565c0', annulee: '#888', expiree: '#888' };

                      return (
                        <tr key={a.id}>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <img src={spriteUrl(mk)} alt="" style={{ width: '36px', imageRendering: 'pixelated' }} />
                              <span style={{ fontWeight: 'bold', color: mk.is_shiny ? '#e65100' : '#c0392b' }}>{mkName(mk)}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 'bold' }}>{a.prix} GB</td>
                          <td style={tdStyle}>
                            <span style={{ backgroundColor: statusColor[effectiveStatus], color: 'white', padding: '2px 8px', fontSize: '0.8em', fontWeight: 'bold' }}>
                              {statusLabel[effectiveStatus]}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: '#888' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                          <td style={{ ...tdStyle, color: '#888' }}>
                            {effectiveStatus === 'active' ? daysLeft(a.expires_at) : '—'}
                          </td>
                          <td style={tdStyle}>
                            {effectiveStatus === 'active' && (
                              <button onClick={() => annuler(a)} style={{ fontFamily: 'monospace', fontSize: '0.8em', padding: '3px 8px', border: '1px solid #c62828', color: '#c62828', background: 'none', cursor: 'pointer' }}>
                                ANNULER
                              </button>
                            )}
                            {a.status === 'vendue' && !a.gb_reclame && (
                              <button onClick={() => reclamerGB(a)} style={{ fontFamily: 'monospace', fontSize: '0.8em', padding: '3px 8px', border: '2px solid #2e7d32', backgroundColor: '#2e7d32', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                RÉCUPÉRER {a.prix} GB
                              </button>
                            )}
                            {a.status === 'vendue' && a.gb_reclame && (
                              <span style={{ color: '#888' }}>✓ récupéré</span>
                            )}
                            {(effectiveStatus === 'annulee' || effectiveStatus === 'expiree') && (
                              <span style={{ color: '#aaa' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
