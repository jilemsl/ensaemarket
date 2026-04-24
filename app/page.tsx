"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';


export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [profil, setProfil] = useState<any>(null);
  const [paris, setParis] = useState<any[]>([]);
  const [parisTermines, setParisTermines] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);

        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfil(p);

        if (p && p.is_validated) {
          const now = new Date().toISOString();

          const { data: enCours } = await supabase
            .from('paris')
            .select('*, mises(*)')
            .eq('status', 'valide')
            .gt('echeance', now)
            .order('created_at', { ascending: false });
          setParis(enCours || []);

          const { data: termines } = await supabase
            .from('paris')
            .select('*, mises(*)')
            .eq('status', 'termine')
            .order('created_at', { ascending: false })
            .limit(5);
          setParisTermines(termines || []);

          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, pseudo, avatar_url')
          const map: Record<string, any> = (allProfiles || []).reduce((acc: any, pr: any) => {
            acc[pr.id] = { pseudo: pr.pseudo, avatar_url: pr.avatar_url }
            return acc
          }, {})
          setProfileMap(map);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const miser = async (pariId: string, issue: number) => {
    const reponse = window.prompt("Combien de Golembucks (GB) veux-tu miser ?");
    const montant = parseInt(reponse || "0");
    if (!montant || montant <= 0 || isNaN(montant)) return alert("Montant invalide !");
    if (montant > profil.golembucks) return alert("Solde insuffisant !");

    const { error } = await supabase
      .from('mises')
      .insert([{ pari_id: pariId, user_id: user.id, issue_choisie: issue, montant }]);

    if (error) alert("Erreur : " + error.message);
    else { alert("Mise validée !"); window.location.reload(); }
  };

  const calculerCotes = (mises: any[]) => {
    const total1 = mises.filter(m => m.issue_choisie === 1).reduce((acc, m) => acc + m.montant, 0);
    const total2 = mises.filter(m => m.issue_choisie === 2).reduce((acc, m) => acc + m.montant, 0);
    const totalGlobal = total1 + total2;
    return {
      total1,
      total2,
      totalGlobal,
      cote1: total1 > 0 ? (totalGlobal / total1).toFixed(2) : "2.00",
      cote2: total2 > 0 ? (totalGlobal / total2).toFixed(2) : "2.00",
    };
  };

  const AvatarPseudo = ({ id }: { id: string }) => {
    const data = profileMap[id]
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <img
          src={data?.avatar_url || '/avatars/golem.png'}
          alt=""
          style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #ccc' }}
        />
        @{data?.pseudo ?? '?'}
      </span>
    )
  }

  if (loading) return <p style={{ fontFamily: 'monospace', padding: '20px' }}>Chargement...</p>;
  if (!user) return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'monospace' }}><a href="/login">[ CONNEXION REQUISE ]</a></div>;

  if (profil && !profil.is_validated) {
    return (
      <main style={{ padding: '50px', textAlign: 'center', fontFamily: 'monospace' }}>
        <h2 style={{ color: 'red' }}>[ COMPTE EN ATTENTE DE VALIDATION ]</h2>
        <p>Désolé <strong>@{profil.pseudo}</strong>, ton accès n'a pas encore été approuvé.</p>
        <p style={{ fontSize: '0.8em', color: '#666' }}>L'administrateur doit valider ton inscription.</p>
        <button
          onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
          style={{ marginTop: '20px', padding: '10px', cursor: 'pointer', border: '1px solid black', background: 'none', fontFamily: 'monospace' }}
        >
          [ SE DÉCONNECTER ]
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>

      <nav style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '10px', alignItems: 'center' }}>
        <span style={{ color: 'violet', fontFamily: 'Comic Sans', fontWeight: 'bold', fontSize: '1.1em', letterSpacing: '0.05em', marginRight: '5px', borderRight: '2px solid black', paddingRight: '15px', lineHeight: '1.2' }}>
          ensaemarket
        </span>
        <a href="/profil">[ PROFIL ]</a>
        <a href="/creer">[ + PARI ]</a>
        <a href="/stats">[ STATS ]</a>
        {profil?.is_admin && <a href="/admin" style={{ color: 'red' }}>[ ADMIN ]</a>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={profil?.avatar_url || '/avatars/golem.png'}
            alt=""
            style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #ccc' }}
          />
          <strong>@{profil?.pseudo}</strong> | {profil?.golembucks} GB
        </div>
      </nav>

      <h2 style={{ textDecoration: 'underline' }}>PARIS EN COURS</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {paris.length > 0 ? paris.map((pari) => {
          const misesDuPari = pari.mises || [];
          const maMise = misesDuPari.find((m: any) => m.user_id === user.id);
          const { total1, total2, totalGlobal, cote1, cote2 } = calculerCotes(misesDuPari);

          return (
            <div key={pari.id} style={{ border: '2px solid black', padding: '15px', backgroundColor: 'white' }}>
              <h3 style={{ marginTop: 0, marginBottom: '4px' }}>{pari.titre}</h3>
              <p style={{ fontSize: '0.75em', color: '#666', margin: '0 0 4px' }}>
                proposé par <AvatarPseudo id={pari.createur_id} />
              </p>
              <p style={{ fontSize: '0.75em', color: '#666', margin: '0 0 8px' }}>
                fin : {new Date(pari.echeance).toLocaleString('fr-FR')} — pot total : {totalGlobal} GB
              </p>
              <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }}>
                <div style={{ opacity: maMise && maMise.issue_choisie !== 1 ? 0.3 : 1 }}>
                  <button onClick={() => miser(pari.id, 1)} disabled={!!maMise}
                    style={{ fontWeight: 'bold', padding: '5px 10px', cursor: maMise ? 'not-allowed' : 'pointer' }}>
                    {pari.issue_1} {maMise?.issue_choisie === 1 && "✓"}
                  </button>
                  <span style={{ backgroundColor: 'red', color: 'white', padding: '5px', marginLeft: '5px', fontWeight: 'bold' }}>{cote1}</span>
                  <span style={{ fontSize: '0.75em', color: '#666', marginLeft: '6px' }}>{total1} GB misés</span>
                </div>
                <div style={{ opacity: maMise && maMise.issue_choisie !== 2 ? 0.3 : 1 }}>
                  <button onClick={() => miser(pari.id, 2)} disabled={!!maMise}
                    style={{ fontWeight: 'bold', padding: '5px 10px', cursor: maMise ? 'not-allowed' : 'pointer' }}>
                    {pari.issue_2} {maMise?.issue_choisie === 2 && "✓"}
                  </button>
                  <span style={{ backgroundColor: 'red', color: 'white', padding: '5px', marginLeft: '5px', fontWeight: 'bold' }}>{cote2}</span>
                  <span style={{ fontSize: '0.75em', color: '#666', marginLeft: '6px' }}>{total2} GB misés</span>
                </div>
              </div>
            </div>
          );
        }) : <p>[ AUCUN PARI DISPONIBLE ]</p>}
      </div>

      {parisTermines.length > 0 && (
        <>
          <h2 style={{ textDecoration: 'underline', marginTop: '40px', color: '#666' }}>HISTORIQUE</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {parisTermines.map((pari) => {
              const misesDuPari = pari.mises || [];
              const { total1, total2, totalGlobal } = calculerCotes(misesDuPari);
              const maMise = misesDuPari.find((m: any) => m.user_id === user.id);

              return (
                <div key={pari.id} style={{ border: '1px solid #aaa', padding: '15px', backgroundColor: '#f9f9f9', opacity: 0.85 }}>
                  <h3 style={{ marginTop: 0, marginBottom: '4px', color: '#444' }}>{pari.titre}</h3>
                  <p style={{ fontSize: '0.75em', color: '#888', margin: '0 0 8px' }}>
                    proposé par <AvatarPseudo id={pari.createur_id} /> — pot total : {totalGlobal} GB
                  </p>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ padding: '5px 12px', fontWeight: 'bold', border: '2px solid', borderColor: pari.gagnant === 1 ? '#2e7d32' : '#aaa', backgroundColor: pari.gagnant === 1 ? '#e8f5e9' : 'transparent', color: pari.gagnant === 1 ? '#2e7d32' : '#888' }}>
                      {pari.issue_1} {pari.gagnant === 1 && '✓'}
                      <span style={{ fontSize: '0.75em', marginLeft: '6px' }}>{total1} GB</span>
                    </div>
                    <div style={{ padding: '5px 12px', fontWeight: 'bold', border: '2px solid', borderColor: pari.gagnant === 2 ? '#2e7d32' : '#aaa', backgroundColor: pari.gagnant === 2 ? '#e8f5e9' : 'transparent', color: pari.gagnant === 2 ? '#2e7d32' : '#888' }}>
                      {pari.issue_2} {pari.gagnant === 2 && '✓'}
                      <span style={{ fontSize: '0.75em', marginLeft: '6px' }}>{total2} GB</span>
                    </div>
                    {maMise && (
                      <div style={{ fontSize: '0.8em', color: '#666', alignSelf: 'center' }}>
                        ma mise : {maMise.montant} GB sur {maMise.issue_choisie === 1 ? pari.issue_1 : pari.issue_2}
                        {maMise.issue_choisie === pari.gagnant
                          ? <span style={{ color: '#2e7d32', marginLeft: '4px' }}>✓ gagné</span>
                          : <span style={{ color: '#c62828', marginLeft: '4px' }}>✗ perdu</span>
                        }
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <button
        onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
        style={{ marginTop: '50px', padding: '5px 10px', cursor: 'pointer', border: '1px solid #000', background: 'none', fontFamily: 'monospace' }}
      >
        [ DECONNEXION ]
      </button>
    </main>
  );
}