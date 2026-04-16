"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [profil, setProfil] = useState<any>(null);
  const [paris, setParis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        setUser(currentUser);
        
        // On récupère le profil avec tes vrais noms de colonnes
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfil(p);

        // Sécurité : on charge les paris uniquement si is_validated est true
        if (p && p.is_validated) {
          const now = new Date().toISOString();
          const { data: b } = await supabase
            .from('paris')
            .select(`*, mises ( * )`)
            .eq('status', 'valide')
            .gt('echeance', now)
            .order('created_at', { ascending: false });
          
          setParis(b || []);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const miser = async (pariId: string, issue: number) => {
    const reponse = window.prompt("Combien de GolemBucks (GB) veux-tu miser ?");
    const montant = parseInt(reponse || "0");

    if (!montant || montant <= 0 || isNaN(montant)) return alert("Montant invalide !");
    if (montant > profil.golembucks) return alert("Solde insuffisant !");

    const { error: errorMise } = await supabase
      .from('mises')
      .insert([{ 
        pari_id: pariId, 
        user_id: user.id, 
        issue_choisie: issue, 
        montant: montant 
      }]);

    if (errorMise) {
      alert("Erreur : " + errorMise.message);
    } else {
      alert("Mise validée !");
      window.location.reload();
    }
  };

  // --- LOGIQUE D'AFFICHAGE CONDITIONNEL ---

  if (loading) return <p style={{fontFamily:'monospace', padding:'20px'}}>Chargement...</p>;

  if (!user) return <div style={{padding:'20px', textAlign:'center', fontFamily:'monospace'}}><a href="/login">[ CONNEXION REQUISE ]</a></div>;

  // UTILISATION DE TA VARIABLE : is_validated
  if (profil && !profil.is_validated) {
    return (
      <main style={{ padding: '50px', textAlign: 'center', fontFamily: 'monospace' }}>
        <h2 style={{ color: 'red' }}>[ COMPTE EN ATTENTE DE VALIDATION ]</h2>
        <p>Désolé <strong>@{profil.pseudo}</strong>, ton accès n'a pas encore été approuvé.</p>
        <p style={{ fontSize: '0.8em', color: '#666' }}>L'administrateur doit valider ton inscription sur le Panel Admin.</p>
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
      
      <nav style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
        <a href="/">[ ACCUEIL ]</a>
        <a href="/creer">[ + PARI ]</a>
        <a href="/stats">[ STATS ]</a>
        {/* UTILISATION DE TA VARIABLE : is_admin */}
        {profil?.is_admin && <a href="/admin" style={{ color: 'red' }}>[ ADMIN ]</a>}
        <div style={{ marginLeft: 'auto' }}>
          <strong>@{profil?.pseudo}</strong> | {profil?.golembucks} GB
        </div>
      </nav>

      <h2 style={{ textDecoration: 'underline' }}>PARIS DISPONIBLES</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {paris.length > 0 ? (
          paris.map((pari) => {
            const misesDuPari = pari.mises || [];
            const maMise = misesDuPari.find((m: any) => m.user_id === user.id);
            const total1 = misesDuPari.filter((m: any) => m.issue_choisie === 1).reduce((acc: number, m: any) => acc + m.montant, 0) || 0;
            const total2 = misesDuPari.filter((m: any) => m.issue_choisie === 2).reduce((acc: number, m: any) => acc + m.montant, 0) || 0;
            const totalGlobal = total1 + total2;
            const cote1 = total1 > 0 ? (totalGlobal / total1).toFixed(2) : "2.00";
            const cote2 = total2 > 0 ? (totalGlobal / total2).toFixed(2) : "2.00";

            return (
              <div key={pari.id} style={{ border: '2px solid black', padding: '15px', backgroundColor: 'white' }}>
                <h3 style={{ marginTop: 0 }}>{pari.titre}</h3>
                <p style={{ fontSize: '0.9em' }}><strong>Fin :</strong> {new Date(pari.echeance).toLocaleString()}</p>
                <div style={{ display: 'flex', gap: '40px', marginTop: '15px' }}>
                  <div style={{ opacity: maMise && maMise.issue_choisie !== 1 ? 0.3 : 1 }}>
                    <button onClick={() => miser(pari.id, 1)} disabled={!!maMise} style={{ fontWeight: 'bold', padding: '5px 10px', cursor: maMise ? 'not-allowed' : 'pointer' }}>
                      {pari.issue_1} {maMise?.issue_choisie === 1 && "✓"}
                    </button>
                    <span style={{ backgroundColor: 'red', color: 'white', padding: '5px', marginLeft: '5px', fontWeight: 'bold' }}>{cote1}</span>
                  </div>
                  <div style={{ opacity: maMise && maMise.issue_choisie !== 2 ? 0.3 : 1 }}>
                    <button onClick={() => miser(pari.id, 2)} disabled={!!maMise} style={{ fontWeight: 'bold', padding: '5px 10px', cursor: maMise ? 'not-allowed' : 'pointer' }}>
                      {pari.issue_2} {maMise?.issue_choisie === 2 && "✓"}
                    </button>
                    <span style={{ backgroundColor: 'red', color: 'white', padding: '5px', marginLeft: '5px', fontWeight: 'bold' }}>{cote2}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>[ AUCUN PARI DISPONIBLE ]</p>
        )}
      </div>

      <button 
        onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
        style={{ marginTop: '50px', padding: '5px 10px', cursor: 'pointer', border: '1px solid #000', background: 'none', fontFamily: 'monospace' }}
      >
        [ DECONNEXION ]
      </button>
    </main>
  );
}