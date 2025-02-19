// Component Imports
import CreateRequest from '@/views/apps/requests/create'

interface PageProps {
  params: {
    lang: string
  }
}

const CreateRequestPage = async ({ params }: PageProps) => {
  return <CreateRequest />
}

export default CreateRequestPage



