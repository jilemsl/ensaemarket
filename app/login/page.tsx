'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // 1. Inscription
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { pseudo: pseudo } // Optionnel : stocke le pseudo dans metadata
          }
        })
        
        if (error) throw error

        // 2. Création du profil dans la table 'profiles'
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            { 
              id: data.user.id, 
              pseudo: pseudo, 
              golembucks: 1000,
              is_admin: false 
            }
          ])
          if (profileError) console.error("Erreur profil:", profileError.message)
        }
        
        alert("Inscription réussie ! Vérifie tes emails (ou attends la validation).")
      } else {
        // 3. Connexion
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        })
        
        if (error) throw error

        // IMPORTANT : On utilise window.location pour forcer le navigateur 
        // à envoyer les nouveaux cookies au serveur sur la page d'accueil
        window.location.href = '/'
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '2px solid black', fontFamily: 'monospace' }}>
      <h1>{isSignUp ? 'REJOINDRE LE GOLEM' : 'CONNEXION'}</h1>
      
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {isSignUp && (
          <input 
            placeholder="Pseudo" 
            value={pseudo} 
            onChange={e => setPseudo(e.target.value)} 
            required 
            style={{ padding: '8px' }}
          />
        )}
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          style={{ padding: '8px' }}
        />
        <input 
          type="password" 
          placeholder="Mot de passe" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          style={{ padding: '8px' }}
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px', background: 'black', color: 'white', cursor: 'pointer' }}
        >
          {loading ? 'CHARGEMENT...' : (isSignUp ? 'CRÉER MON COMPTE' : 'SE CONNECTER')}
        </button>
      </form>
      
      <button 
        onClick={() => setIsSignUp(!isSignUp)} 
        style={{ marginTop: '20px', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
      >
        {isSignUp ? "J'ai déjà un compte" : "Pas de compte ? S'inscrire"}
      </button>
    </main>
  )
}