// Next Imports
import { redirect } from 'next/navigation'

const EquiposPage = ({ params }: { params: { lang: string } }) => {
  return redirect(`/${params.lang}/apps/equipos/list`)
}

export default EquiposPage
