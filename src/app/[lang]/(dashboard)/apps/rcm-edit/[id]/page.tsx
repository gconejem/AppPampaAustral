'use client'

// React Imports
import { useParams } from 'next/navigation'

// Component Imports
import StepperVerticalWithNumbersEdit from '@views/apps/encoder/StepperVerticalWithNumbersEdit'

export default function EditRCMPage() {
    const params = useParams()
    const rcmId = params.id as string

    return (
        <div>
            <StepperVerticalWithNumbersEdit rcmId={rcmId} />
        </div>
    )
}
