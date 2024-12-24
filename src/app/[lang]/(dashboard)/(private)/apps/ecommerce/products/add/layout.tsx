import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agregar Ensayo',
  description: 'Página para agregar un nuevo ensayo o paquete de ensayos'
}

export default function Layout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className='content-wrapper'>
      {children}
    </div>
  )
} 
