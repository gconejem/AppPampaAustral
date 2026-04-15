'use client'

import { useParams } from 'next/navigation'
import EditRcmView from '@views/apps/rcm-edit'

export default function EditRCMPage() {
    const params = useParams()
    const rcmId = (params?.id as string) || ''

    return <EditRcmView rcmId={rcmId} />
}
