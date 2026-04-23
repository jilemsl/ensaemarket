'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreerPari() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    // Récupérer l'utilisateur connecté (fonctionne car côté client)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Tu dois être connecté !')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('paris').insert([{
      titre: formData.get('titre'),
      issue_1: formData.get('issue_1'),
      issue_2: formData.get('issue_2'),
      echeance: formData.get('echeance'),
      status: 'en_attente',
      createur_id: user.id  // ✅ récupéré proprement
    }])

    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main style={{ padding: '20px', maxWidth: '500px', margin: 'auto', fontFamily: 'serif' }}>
      <h2>Proposer un nouveau pari</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input name="titre" placeholder="Titre du pari" required />
        <input name="issue_1" placeholder="Issue 1 (ex: Oui)" required />
        <input name="issue_2" placeholder="Issue 2 (ex: Non)" required />
        <label>
          Échéance : <input type="datetime-local" name="echeance" required />
        </label>
        <button type="submit" disabled={loading} style={{ padding: '10px', cursor: 'pointer' }}>
          {loading ? 'Envoi...' : 'Soumettre pour validation admin'}
        </button>
      </form>
      <br />
      <a href="/">[ Retour ]</a>
    </main>
  )
}