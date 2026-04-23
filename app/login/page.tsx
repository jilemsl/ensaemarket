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
        // Inscription — le trigger handle_new_user crée automatiquement le profil
        // avec pseudo (via metadata), golembucks=100, is_admin=false
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { pseudo: pseudo }
          }
        })
        
        if (error) throw error
        
        // ✅ Plus d'INSERT manuel ici — le trigger s'en charge
        alert("Inscription réussie ! Vérifie tes emails (ou attends la validation).")

      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        })
        
        if (error) throw error
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
      <h1>{isSignUp ? 'REJOINDRE ENSAE MARKET' : 'CONNEXION'}</h1>
      
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