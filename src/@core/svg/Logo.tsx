// React Imports
import Image from 'next/image'

const Logo = () => {
  return (
    <div style={{ height: '48px', display: 'flex', alignItems: 'center', padding: 0, margin: 0, minWidth: 0 }}>
      <Image
        src="/images/logos/PAMPA_MG_2025_017-2.png"
        alt="Pampa Austral Logo"
        width={48}
        height={48}
        style={{ objectFit: 'contain', marginRight: 0, padding: 0, display: 'block' }}
      />
    </div>
  )
}

export default Logo
