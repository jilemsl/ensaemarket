"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function StatsPage() {
  const [user, setUser] = useState<any>(null);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [globalAbsences, setGlobalAbsences] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'classement' | 'absences'>('classement');
  const [loading, setLoading] = useState(true);
  const [aSync, setASync] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data: users } = await supabase
        .from('profiles')
        .select('pseudo, golembucks, avatar_url')
        .eq('is_validated', true)
        .order('golembucks', { ascending: false })
        .limit(10);
      setTopUsers(users || []);

      if (authUser) {
        const { data: monAbsence } = await supabase
          .from('absences')
          .select('id')
          .eq('user_id', authUser.id)
          .limit(1);

        setASync(!!(monAbsence && monAbsence.length > 0));

        if (monAbsence && monAbsence.length > 0) {
          const { data: absData } = await supabase
            .from('absences')
            .select('nb_absences, nb_retards, user_id');

          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, pseudo, avatar_url');

          if (absData) {
            const profileMap = (allProfiles || []).reduce((acc: any, p: any) => {
              acc[p.id] = { pseudo: p.pseudo, avatar_url: p.avatar_url };
              return acc;
            }, {});

            const aggregation = absData.reduce((acc: any, curr: any) => {
              const profil = profileMap[curr.user_id];
              const pseudo = profil?.pseudo || "Anonyme";
              const avatar_url = profil?.avatar_url || '/avatars/golem.png';
              if (!acc[pseudo]) acc[pseudo] = { username: pseudo, avatar_url, abs: 0, ret: 0 };
              acc[pseudo].abs += (curr.nb_absences || 0);
              acc[pseudo].ret += (curr.nb_retards || 0);
              return acc;
            }, {});

            setGlobalAbsences(Object.values(aggregation));
          }
        }
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

      <div style={{ display: 'flex', gap: '5px', marginTop: '30px' }}>
        <div style={tabStyle('classement')} onClick={() => setActiveTab('classement')}>RICHESSE</div>
        <div style={tabStyle('absences')} onClick={() => setActiveTab('absences')}>ABSENCES</div>
      </div>

      <div style={{ border: '2px solid black', padding: '20px', backgroundColor: 'white', minHeight: '400px' }}>

        {activeTab === 'classement' && (
          <section>
            <h2 style={{ marginTop: 0 }}>RICHESSE</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {topUsers.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', width: '50px' }}>#{i + 1}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={u.avatar_url || '/avatars/golem.png'}
                          alt=""
                          style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #ccc' }}
                        />
                        @{u.pseudo}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{u.golembucks} GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'absences' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>ABSTENTIONS</h2>
              <a href="/sync" style={{ padding: '8px 15px', backgroundColor: 'black', color: 'white', textDecoration: 'none', fontSize: '0.8em', fontWeight: 'bold', border: '1px solid black' }}>
                SYNCHRONISER PAMPLEMOUSSE
              </a>
            </div>

            {!aSync ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed #aaa' }}>
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  Tu n'as pas encore synchronisé tes données Pamplemousse.
                </p>
                <a href="/sync" style={{ padding: '10px 20px', backgroundColor: 'black', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
                  SYNCHRONISER MAINTENANT
                </a>
              </div>
            ) : (
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
                        <td style={{ fontWeight: 'bold' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={row.avatar_url || '/avatars/golem.png'}
                              alt=""
                              style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #ccc' }}
                            />
                            @{row.username}
                          </span>
                        </td>
                        <td>{row.abs}</td>
                        <td>{row.ret}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>
    </main>
  );
}