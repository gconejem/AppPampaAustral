'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AddEnsayo from '@/views/apps/ecommerce/products/add/AddEnsayo'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario está autenticado aquí si es necesario
  }, [])

  return (
    <div className='content-center'>
      <AddEnsayo />
    </div>
  )
}
