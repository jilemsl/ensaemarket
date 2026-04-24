"use client";
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const COUT_PECHE = 50;
const TAILLE_BOITE = 6;
const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

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

const NATURES = [
  { nom: 'Hardi',     effet: 'neutre' },
  { nom: 'Solitaire', effet: '+Atq / -Déf' },
  { nom: 'Brave',     effet: '+Atq / -Vit' },
  { nom: 'Rigide',    effet: '+Atq / -Atq Spé' },
  { nom: 'Mauvais',   effet: '+Atq / -Déf Spé' },
  { nom: 'Audacieux', effet: '+Déf / -Atq' },
  { nom: 'Docile',    effet: 'neutre' },
  { nom: 'Relax',     effet: '+Déf / -Vit' },
  { nom: 'Malin',     effet: '+Déf / -Atq Spé' },
  { nom: 'Laxiste',   effet: '+Déf / -Déf Spé' },
  { nom: 'Timide',    effet: '+Vit / -Atq' },
  { nom: 'Pressé',    effet: '+Vit / -Déf' },
  { nom: 'Sérieux',   effet: 'neutre' },
  { nom: 'Jovial',    effet: '+Vit / -Atq Spé' },
  { nom: 'Naïf',      effet: '+Vit / -Déf Spé' },
  { nom: 'Modeste',   effet: '+Atq Spé / -Atq' },
  { nom: 'Doux',      effet: '+Atq Spé / -Déf' },
  { nom: 'Discret',   effet: '+Atq Spé / -Vit' },
  { nom: 'Badin',     effet: 'neutre' },
  { nom: 'Fougueux',  effet: '+Atq Spé / -Déf Spé' },
  { nom: 'Calme',     effet: '+Déf Spé / -Atq' },
  { nom: 'Gentil',    effet: '+Déf Spé / -Déf' },
  { nom: 'Brusque',   effet: '+Déf Spé / -Vit' },
  { nom: 'Prudent',   effet: '+Déf Spé / -Atq Spé' },
  { nom: 'Bizarre',   effet: 'neutre' },
];

const NOMS_POOL = [
  'Gausskarpe','Eulerkarpe','Newtonkarpe','Fourierkarpe','Laplacekarpe',
  'Bernoullikarpe','Poissonkarpe','Bayeskarpe','Fermatkarpe','Pascalkarpe',
  'Leibnizkarpe','Descarteskarpe','Archimèdekarpe','Pythagorkarpe','Euclidekarpe',
  'Copernickarpe','Galiléekarpe','Keplerkarpe','Hubblekarpe','Curiekarpe',
  'Lovelacekarpe','Turingkarpe','Shannonkarpe','Gödelkarpe','Cantorkarpe',
  'Hilbertkarpe','Poincarékarpe','Galoiskarpe','Noetherkarpe','Ramanujankarpe',
  'Dirackarpe','Heisenbergkarpe','Schrödingerkarpe','Bohrkarpe','Planckkarpe',
  'Einsteinkarpe','Lorentzkarpe','Maxwellkarpe','Faradaykarpe','Ampèrekarpe',
  'Ohmskarpe','Voltakarpe','Coulombkarpe','Avogadrokarpe','Mendeleïevkarpe',
  'Darwinkarpe','Mendélkarpe','Pasteurkarpe','Flemingkarpe','Crickkarpe',
];

function randomIV() { return Math.floor(Math.random() * 32); }

function randomMagikarp() {
  const n = NATURES[Math.floor(Math.random() * NATURES.length)];
  const sprite_id = Math.floor(Math.random() * 10);
  const is_shiny = Math.random() < 1 / 1024;
  const mk: any = {
    nature: n.nom, effet: n.effet,
    poids: parseFloat((5 + Math.random() * 25).toFixed(1)),
    taille: parseFloat((0.4 + Math.random() * 1.2).toFixed(2)),
    iv_pv: randomIV(), iv_atq: randomIV(), iv_def: randomIV(),
    iv_atq_spe: randomIV(), iv_def_spe: randomIV(), iv_vit: randomIV(),
    sprite_id, is_shiny,
  };
  if (is_shiny) {
    const keys = ['iv_pv','iv_atq','iv_def','iv_atq_spe','iv_def_spe','iv_vit'];
    const minKey = keys.reduce((a, b) => mk[a] < mk[b] ? a : b);
    mk[minKey] = 31;
  }
  return mk;
}

async function generateUniqueName(): Promise<string> {
  const { data: existing } = await supabase.from('magikarps').select('nom');
  const taken = new Set((existing || []).map((m: any) => m.nom));
  const shuffled = [...NOMS_POOL].sort(() => Math.random() - 0.5);
  for (const nom of shuffled) { if (!taken.has(nom)) return nom; }
  for (let i = 2; i < 9999; i++) {
    const nom = `${NOMS_POOL[Math.floor(Math.random() * NOMS_POOL.length)]} ${i}`;
    if (!taken.has(nom)) return nom;
  }
  return `Karpe${Date.now()}`;
}

type PecheState = 'idle' | 'casting' | 'waiting' | 'nibble' | 'caught' | 'empty';

export default function CasinoPage() {
  const [user, setUser]           = useState<any>(null);
  const [profil, setProfil]       = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [nbMagikarps, setNbMagikarps] = useState(0);
  const [peche, setPeche]         = useState<PecheState>('idle');
  const [magikarp, setMagikarp]   = useState<any>(null);
  const [magikarpNom, setMagikarpNom] = useState('');
  const [magikarpId, setMagikarpId]   = useState<string | null>(null);
  const [dialogText, setDialogText]   = useState('Appuyez sur le bouton pour lancer la canne...');
  const [peching, setPeching]     = useState(false);
  const [dotCount, setDotCount]   = useState(1);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: cu } } = await supabase.auth.getUser();
      if (cu) {
        setUser(cu);
        const { data: p } = await supabase.from('profiles').select('*').eq('id', cu.id).single();
        setProfil(p);
        const { count } = await supabase.from('magikarps').select('id', { count: 'exact', head: true }).eq('user_id', cu.id).eq('en_vente', false);
        setNbMagikarps(count || 0);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (peche !== 'waiting') return;
    const id = setInterval(() => setDotCount(p => (p % 6) + 1), 350);
    return () => clearInterval(id);
  }, [peche]);

  useEffect(() => () => { if (typeRef.current) clearInterval(typeRef.current); }, []);

  const typeText = (text: string) => {
    if (typeRef.current) clearInterval(typeRef.current);
    setDialogText('');
    let i = 0;
    typeRef.current = setInterval(() => {
      i++;
      setDialogText(text.slice(0, i));
      if (i >= text.length) { clearInterval(typeRef.current!); typeRef.current = null; }
    }, 28);
  };

  const lancerLigne = async () => {
    if (peching) return;
    if (nbMagikarps >= TAILLE_BOITE) { alert("Ton équipe est pleine (6/6) ! Libère une place dans ton profil."); return; }
    if (!profil || profil.golembucks < COUT_PECHE) { alert(`Solde insuffisant ! Il faut ${COUT_PECHE} GB.`); return; }

    setPeching(true);
    setMagikarp(null);
    setMagikarpNom('');

    await supabase.from('profiles').update({ golembucks: profil.golembucks - COUT_PECHE }).eq('id', user.id);
    setProfil((prev: any) => ({ ...prev, golembucks: prev.golembucks - COUT_PECHE }));

    setPeche('casting');
    typeText('Ligne lancée...');
    await sleep(1200);

    setPeche('waiting');
    setDotCount(1);
    await sleep(2200 + Math.random() * 2500);

    if (Math.random() > 0.6) {
      setPeche('empty');
      typeText("Rien n'a mordu...");
      await sleep(2200);
      setPeche('idle');
      typeText('Appuyez sur le bouton pour lancer la canne...');
      setPeching(false);
      return;
    }

    setPeche('nibble');
    typeText('Oh ! Un Pokémon mord !');
    await sleep(1100);

    const mk = randomMagikarp();
    const nom = await generateUniqueName();

    const { data: inserted, error } = await supabase.from('magikarps').insert([{
      user_id: user.id, nom,
      nature: mk.nature, poids: mk.poids, taille: mk.taille,
      iv_pv: mk.iv_pv, iv_atq: mk.iv_atq, iv_def: mk.iv_def,
      iv_atq_spe: mk.iv_atq_spe, iv_def_spe: mk.iv_def_spe, iv_vit: mk.iv_vit,
      is_shiny: mk.is_shiny, sprite_id: mk.sprite_id,
    }]).select('id').single();

    if (error) {
      // Refund GB
      await supabase.from('profiles').update({ golembucks: profil.golembucks }).eq('id', user.id);
      setProfil((prev: any) => ({ ...prev, golembucks: prev.golembucks + COUT_PECHE }));
      typeText(`Erreur : ${error.message.slice(0, 60)}`);
      await sleep(3500);
      setPeche('idle');
      typeText('Appuyez sur le bouton pour lancer la canne...');
      setPeching(false);
      return;
    }

    setNbMagikarps(p => p + 1);
    setMagikarp(mk);
    setMagikarpNom(nom);
    setMagikarpId(inserted?.id ?? null);
    setPeche('caught');
    typeText(mk.is_shiny ? '✨ Un Magikarpe chromatique est apparu !' : 'Un Magikarpe sauvage est apparu !');
    setPeching(false);
  };

  const ivColor = (v: number) => v === 31 ? '#2e7d32' : v === 0 ? '#c62828' : '#444';

  const relacherCapture = async () => {
    if (!magikarpId) return;
    if (!window.confirm(`Relâcher ${magikarpNom} définitivement ? Cette action est irréversible.`)) return;
    await supabase.from('magikarps').delete().eq('id', magikarpId);
    setNbMagikarps(p => p - 1);
    setMagikarpId(null);
    setPeche('idle');
    typeText('Appuyez sur le bouton pour lancer la canne...');
  };

  const btnDisabled = peching || !profil || profil.golembucks < COUT_PECHE || nbMagikarps >= TAILLE_BOITE;

  if (loading) return <p style={{ fontFamily: 'monospace', padding: '20px' }}>Chargement...</p>;
  if (!user)   return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'monospace' }}><a href="/login">[ CONNEXION REQUISE ]</a></div>;

  const spriteUrl = magikarp ? SPRITES[magikarp.sprite_id][magikarp.is_shiny ? 'shiny' : 'normal'] : null;

  const showLine  = peche === 'casting' || peche === 'waiting' || peche === 'nibble';
  const showFloat = peche === 'waiting';
  const showNibble = peche === 'nibble';

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        @keyframes waterTile {
          0%   { background-position: 0px 0px; }
          25%  { background-position: 8px 0px; }
          50%  { background-position: 16px 4px; }
          75%  { background-position: 8px 4px; }
        }
        @keyframes rodCast {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0); }
        }
        @keyframes bob      { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-5px);} }
        @keyframes nibblePop{ 0%,100%{ transform:scale(1) translateY(0);} 50%{ transform:scale(1.35) translateY(-4px);} }
        @keyframes cursor   { 0%,100%{ opacity:1;} 50%{ opacity:0;} }
        @keyframes lineGrow { from{ height:0;} to{ height:56px;} }
      `}</style>

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

      <h1>[ CASINO ]</h1>

      <div style={{ display: 'flex', gap: '5px', marginTop: '20px' }}>
        <div style={{ padding: '8px 16px', border: '2px solid black', borderBottom: 'none', backgroundColor: '#fff', fontWeight: 'bold', fontFamily: 'monospace', position: 'relative', zIndex: 2 }}>
          LAC DE L'X
        </div>
      </div>

      <div style={{ border: '2px solid black', padding: '20px', backgroundColor: 'white', minHeight: '400px' }}>
        <p style={{ color: '#555', fontSize: '0.85em', margin: '0 0 14px' }}>
          Coût : <strong>{COUT_PECHE} GB</strong> par lancer &nbsp;—&nbsp; Équipe : <strong>{nbMagikarps}/6</strong>
          {nbMagikarps >= TAILLE_BOITE && <span style={{ color: 'red', marginLeft: '10px' }}>[ ÉQUIPE PLEINE ]</span>}
        </p>

        {/* ── Lake scene — Pokemon HGSS side view ── */}
        <div style={{ position: 'relative', height: '240px', border: '3px solid #1a3060', overflow: 'hidden' }}>

          {/* Water — tuiles diamant style HGSS */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, right: '36%',
            backgroundColor: '#2840b0',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%232840b0'/%3E%3Cellipse cx='8' cy='16' rx='6.5' ry='11' fill='%233858cc'/%3E%3Cellipse cx='24' cy='0' rx='6.5' ry='11' fill='%233858cc'/%3E%3Cellipse cx='24' cy='32' rx='6.5' ry='11' fill='%233858cc'/%3E%3Cellipse cx='6' cy='11' rx='3' ry='4' fill='%235878e8' opacity='0.65'/%3E%3Cellipse cx='22' cy='27' rx='3' ry='4' fill='%235878e8' opacity='0.65'/%3E%3Cellipse cx='5.5' cy='9' rx='1.8' ry='2.2' fill='%23ffffff' opacity='0.18'/%3E%3C/svg%3E")`,
            backgroundSize: '32px 32px',
            animation: 'waterTile 1.2s steps(4) infinite',
          }} />

          {/* Terrain / falaise — côté droit */}
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '36%', backgroundColor: '#b8885a', zIndex: 2 }}>
            {/* Texture rocheuse */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: [
                'radial-gradient(ellipse 18px 10px at 30% 25%, rgba(0,0,0,0.12) 0%, transparent 100%)',
                'radial-gradient(ellipse 14px 8px at 65% 55%, rgba(0,0,0,0.08) 0%, transparent 100%)',
                'radial-gradient(ellipse 10px 6px at 20% 75%, rgba(0,0,0,0.07) 0%, transparent 100%)',
                'radial-gradient(ellipse 20px 5px at 50% 40%, rgba(255,255,255,0.06) 0%, transparent 100%)',
              ].join(','),
            }} />
            {/* Ombre sur le bord gauche du terrain */}
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '8px', background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)' }} />
          </div>

          {/* Bord de falaise (entre eau et terre) */}
          <div style={{ position: 'absolute', top: 0, right: '36%', bottom: 0, width: '6px', backgroundColor: '#7a5830', zIndex: 3 }} />

          {/* Canne à pêche — s'étend horizontalement vers l'eau */}
          {showLine && (
            <div style={{
              position: 'absolute',
              top: '72px',
              right: 'calc(36% + 6px)',
              width: '115px',
              height: '3px',
              backgroundColor: '#3a2010',
              transformOrigin: 'right center',
              animation: peche === 'casting' ? 'rodCast 0.55s ease-out forwards' : 'none',
              zIndex: 4,
            }} />
          )}

          {/* Ligne de pêche — tombe du bout de la canne */}
          {showLine && (
            <div style={{
              position: 'absolute',
              top: '75px',
              right: 'calc(36% + 6px + 115px)',
              width: '1px',
              height: '56px',
              background: 'linear-gradient(to bottom, rgba(220,220,220,0.9), rgba(220,220,220,0.4))',
              transformOrigin: 'top',
              animation: peche === 'casting' ? 'lineGrow 0.4s 0.45s ease-out both' : 'none',
              zIndex: 4,
            }} />
          )}

          {/* Flotteur */}
          {showFloat && (
            <div style={{
              position: 'absolute',
              top: '126px',
              right: 'calc(36% + 6px + 109px)',
              width: '12px', height: '12px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #ff6b6b, #c62828)',
              border: '2px solid white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
              animation: 'bob 1.1s ease-in-out infinite',
              zIndex: 4,
            }} />
          )}

          {/* Morsure — flotteur plonge */}
          {showNibble && (
            <div style={{
              position: 'absolute',
              top: '120px',
              right: 'calc(36% + 6px + 103px)',
              width: '18px', height: '18px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #ff6b6b, #c62828)',
              border: '3px solid white',
              boxShadow: '0 0 10px rgba(255,100,100,0.9)',
              animation: 'nibblePop 0.22s ease-in-out infinite',
              zIndex: 4,
            }} />
          )}

          {/* Magikarpe capturé — remonte de l'eau */}
          {peche === 'caught' && spriteUrl && (
            <div style={{
              position: 'absolute',
              bottom: '60px',
              right: 'calc(36% + 6px + 60px)',
              zIndex: 4,
              textAlign: 'center',
            }}>
              <img src={spriteUrl} alt="Magikarp" style={{ width: '88px', imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
            </div>
          )}

          {/* Boîte de dialogue — style Pokemon HGSS */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
            backgroundColor: '#f8f4e8',
            borderTop: '5px solid #a87830',
            borderBottom: 'none',
            padding: '10px 18px',
            fontFamily: 'monospace',
            fontSize: '0.92em',
            display: 'flex', alignItems: 'center',
            zIndex: 5,
            boxShadow: 'inset 0 3px 0 #c8a040',
          }}>
            <div style={{ borderLeft: '3px solid #a87830', paddingLeft: '10px', width: '100%' }}>
              {peche === 'waiting'
                ? <span style={{ letterSpacing: '5px', fontSize: '1.05em', color: '#333' }}>{'▪'.repeat(dotCount)}</span>
                : <span style={{ color: '#1a1a1a' }}>{dialogText}<span style={{ animation: 'cursor 0.8s step-start infinite', display: 'inline-block', marginLeft: '1px' }}>▋</span></span>
              }
            </div>
          </div>
        </div>

        {/* Button */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={lancerLigne}
            disabled={btnDisabled}
            style={{
              padding: '10px 30px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '1em',
              border: '2px solid black',
              backgroundColor: btnDisabled ? '#eee' : '#000',
              color: btnDisabled ? '#888' : '#fff',
              cursor: btnDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {peche === 'caught' || peche === 'empty' ? '[ RELANCER ]' : '[ LANCER LA LIGNE ]'}
          </button>
          <div style={{ fontSize: '0.75em', color: '#888', marginTop: '5px' }}>
            Coût : {COUT_PECHE} GB &nbsp;|&nbsp; Solde : {profil?.golembucks ?? 0} GB
          </div>
        </div>

        {/* Magikarp card */}
        {peche === 'caught' && magikarp && spriteUrl && (
          <div style={{ marginTop: '20px', border: `2px solid ${magikarp.is_shiny ? '#f9a825' : '#c0392b'}`, padding: '16px', backgroundColor: magikarp.is_shiny ? '#fffde7' : '#fff8f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', borderBottom: `1px solid ${magikarp.is_shiny ? '#ffe082' : '#f5c6c6'}`, paddingBottom: '10px' }}>
              <img src={spriteUrl} alt="Magikarp" style={{ width: '72px', imageRendering: 'pixelated' }} />
              <div>
                <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: magikarp.is_shiny ? '#e65100' : '#c0392b' }}>
                  {magikarp.is_shiny && '✨ '}{magikarpNom}
                  {magikarp.is_shiny && <span style={{ fontSize: '0.65em', marginLeft: '8px', backgroundColor: '#f9a825', color: '#000', padding: '1px 6px', verticalAlign: 'middle' }}>CHROMATIQUE</span>}
                </div>
                <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                  {magikarp.nature} ({magikarp.effet})
                </div>
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  {magikarp.poids} kg &nbsp;—&nbsp; {magikarp.taille} m
                </div>
                <button
                  onClick={relacherCapture}
                  style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '0.8em', padding: '3px 10px', border: '1px solid #c62828', color: '#c62828', background: 'none', cursor: 'pointer' }}
                >
                  [ RELÂCHER ]
                </button>
              </div>
            </div>
            <div style={{ fontSize: '0.82em' }}>
              <strong>IVs</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                {([['PV', magikarp.iv_pv],['Atq', magikarp.iv_atq],['Déf', magikarp.iv_def],['Atq Spé', magikarp.iv_atq_spe],['Déf Spé', magikarp.iv_def_spe],['Vit', magikarp.iv_vit]] as [string,number][]).map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '56px', color: '#555' }}>{label}</span>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#eee', border: '1px solid #ddd' }}>
                      <div style={{ height: '100%', width: `${(val / 31) * 100}%`, backgroundColor: ivColor(val) }} />
                    </div>
                    <span style={{ width: '22px', textAlign: 'right', fontWeight: 'bold', color: ivColor(val) }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
