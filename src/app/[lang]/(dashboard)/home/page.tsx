// Component Imports
import Home from '@/views/home'

interface Props {
  params: {
    lang: string
  }
}

const HomePage = ({ params: { lang } }: Props) => {
  return <Home />
}

export default HomePage
