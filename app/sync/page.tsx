"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SyncPage() {
  const [userId, setUserId] = useState("Chargement...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const getUID = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUID();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '600px', margin: '0 auto' }}>
      <h1>[ COMMENT SYNCHRONISER LES DONNEES ]</h1>
      <a href="/stats" style={{ color: 'blue' }}>{"<- Retour aux stats"}</a>

      <div style={{ border: '2px solid black', padding: '20px', marginTop: '20px', backgroundColor: '#f0f0f0' }}>
        <h3>MODE D'EMPLOI</h3>
        <p>1. Connectez-vous à Pamplemousse <strong>sur firefox</strong></p>
            

        <p>2. Téléchargez le .exe ci-dessous</p>
        <p>3. Lancez le .exe (ayez confiance)</p>
        <a href="/downloads/ENSAEMARKET_Sync.exe" download style={{ display: 'block', textAlign: 'center', padding: '15px', backgroundColor: 'black', color: 'white', textDecoration: 'none', fontWeight: 'bold', marginTop: '20px' }}>
          TÉLÉCHARGER LE SCRAPER (.EXE)
        </a>
      </div>
    </main>
  );
}