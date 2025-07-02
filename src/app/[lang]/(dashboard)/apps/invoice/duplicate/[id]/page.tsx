'use client'

import { useParams } from 'next/navigation'

import DuplicateCard from '@views/apps/invoice/duplicate/DuplicateCard'

const DuplicatePage = () => {
  const params = useParams()
  const id = params?.id as string || ''

  return <DuplicateCard id={id} />
}

export default DuplicatePage 
