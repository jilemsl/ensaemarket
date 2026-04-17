"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ==========================================================
// PAGE PRINCIPALE
// ==========================================================
export default function StatsPage() {
  const [user, setUser] = useState<any>(null);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [globalAbsences, setGlobalAbsences] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'classement' | 'absences'>('classement');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // A. Récupérer l'utilisateur connecté
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // B. Top 10 Riches
      const { data: users } = await supabase
        .from('profiles')
        .select('pseudo, golembucks')
        .eq('is_validated', true)
        .order('golembucks', { ascending: false })
        .limit(10);
      setTopUsers(users || []);

      // C. Classement Absences (Global)
      const { data: absData } = await supabase
        .from('absences')
        .select(`nb_absences, nb_retards, profiles ( pseudo )`);

      if (absData) {
        const aggregation = absData.reduce((acc: any, curr: any) => {
          const name = curr.profiles?.pseudo || "Anonyme";
          if (!acc[name]) {
            acc[name] = { username: name, abs: 0, ret: 0 };
          }
          acc[name].abs += curr.nb_absences;
          acc[name].ret += curr.nb_retards;
          return acc;
        }, {});
        setGlobalAbsences(Object.values(aggregation));
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const tabStyle = (tab: string) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    border: '2px solid black',
    borderBottom: activeTab === tab ? 'none' : '2px solid black',
    backgroundColor: activeTab === tab ? '#fff' : '#eee',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: '-2px',
    zIndex: activeTab === tab ? 2 : 1
  });

  if (loading) return <div style={{ padding: '20px', fontFamily: 'monospace' }}>Chargement des données...</div>;

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1>[ STATISTIQUES ]</h1>
      <a href="/" style={{ textDecoration: 'none', color: 'blue' }}>{"<- Retour"}</a>

      {/* NAVIGATION ONGLETS */}
      <div style={{ display: 'flex', gap: '5px', marginTop: '30px' }}>
        <div style={tabStyle('classement')} onClick={() => setActiveTab('classement')}>RICHESSE</div>
        <div style={tabStyle('absences')} onClick={() => setActiveTab('absences')}>ABSENCES</div>
      </div>

      {/* CONTENU DE L'ONGLET */}
      <div style={{ border: '2px solid black', padding: '20px', backgroundColor: 'white', minHeight: '400px', position: 'relative' }}>
        
        {/* SECTION RICHESSE */}
        {activeTab === 'classement' && (
          <section>
            <h2 style={{ marginTop: 0 }}> RICHESSE </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {topUsers.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', width: '50px' }}>#{i + 1}</td>
                    <td>@{u.pseudo}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{u.golembucks} GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* SECTION ABSENCES */}
        {activeTab === 'absences' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}> ABSTENTIONS </h2>
              
              <a href="/sync" style={{ 
                padding: '8px 15px', 
                backgroundColor: 'black', 
                color: 'white', 
                textDecoration: 'none',
                fontSize: '0.8em',
                fontWeight: 'bold',
                border: '1px solid black'
              }}>
                SYNCHRONISER PAMPLEMOUSSE
              </a>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid black', backgroundColor: '#f9f9f9' }}>
                  <th style={{ padding: '10px' }}>RANG</th>
                  <th>USERNAME</th>
                  <th>ABS</th>
                  <th>RET</th>
                </tr>
              </thead>
              <tbody>
                {globalAbsences
                  .sort((a, b) => (b.abs + b.ret / 3) - (a.abs + a.ret / 3))
                  .map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>#{index + 1}</td>
                      <td style={{ fontWeight: 'bold' }}>@{row.username}</td>
                      <td>{row.abs}</td>
                      <td>{row.ret}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}