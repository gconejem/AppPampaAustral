import { Suspense } from 'react'

import WorkList from '@/views/apps/works/list'
import { getUserData } from '@/app/server/actions'

export default async function WorksPage() {
  const data = await getUserData()

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <WorkList userData={data} />
    </Suspense>
  )
}
