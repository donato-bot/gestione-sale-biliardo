'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function DashboardSmistatore() {
  const router = useRouter()

  useEffect(() => {
    const smistaManager = async () => {
      // 1. Controlliamo chi è appena entrato
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const userEmail = session.user.email

      // 2. Tasto Segreto / Salto alla Torre di Controllo per il SuperAdmin
      if (userEmail === 'donatorzz1946@gmail.com' || userEmail === 'donatorzz1946+1@gmail.com') {
        router.push('/admin/dashboard')
        return
      }

      // 3. Cerchiamo la sala del manager nel Database
      const { data: sala, error } = await supabase
        .from('sale')
        .select('nome_sala')
        .eq('manager_email', userEmail)
        .single()

      if (sala) {
        // Formattiamo il nome (es: "Il Campione" -> "il-campione")
        const urlSala = sala.nome_sala.toLowerCase().replace(/\s+/g, '-')
        router.push(`/dashboard/${urlSala}`)
      } else {
        console.error("Nessuna sala trovata per questa email:", error)
        router.push('/login') // O una pagina di errore dedicata
      }
    }

    smistaManager()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-green-400 font-bold tracking-widest">CALCOLO COORDINATE SALA IN CORSO...</p>
      </div>
    </div>
  )
}