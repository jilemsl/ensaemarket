"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function StatsPage() {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [globalAbsences, setGlobalAbsences] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'classement' | 'notes' | 'absences'>('classement');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Top 10 Riches
      const { data: users } = await supabase
        .from('profiles')
        .select('pseudo, golembucks')
        .eq('is_validated', true)
        .order('golembucks', { ascending: false })
        .limit(10);
      setTopUsers(users || []);

      // 2. Classement Absences (Global)
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
    marginBottom: '-2px'
  });

  if (loading) return <p style={{padding:'20px', fontFamily:'monospace'}}>Chargement des stats...</p>;

  return (
    <main style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1>[ STATISTIQUES ]</h1>
      <a href="/">{"<- Retour"}</a>

      <div style={{ display: 'flex', gap: '5px', marginTop: '30px' }}>
        <div style={tabStyle('classement')} onClick={() => setActiveTab('classement')}>RICHES</div>
        <div style={tabStyle('absences')} onClick={() => setActiveTab('absences')}>ABSENCES</div>
      </div>

      <div style={{ border: '2px solid black', padding: '20px', backgroundColor: 'white', minHeight: '400px' }}>
        
        {/* ONGLET RICHES */}
        {activeTab === 'classement' && (
          <section>
            <h2 style={{ marginTop: 0 }}> RICHESSE </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {topUsers.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>#{i + 1}</td>
                    <td>@{u.pseudo}</td>
                    <td style={{ textAlign: 'right' }}>{u.golembucks} GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ONGLET ABSENCES (Classement Global) */}
        {activeTab === 'absences' && (
          <section>
            <h2 style={{ marginTop: 0 }}> ABSTENTION </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid black' }}>
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