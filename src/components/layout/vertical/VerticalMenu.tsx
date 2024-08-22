// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { getDictionary } from '@/utils/getDictionary'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'

// import { GenerateVerticalMenu } from '@components/GenerateMenu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Menu Data Imports
// import menuData from '@/data/navigation/verticalMenuData'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ dictionary, scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const params = useParams()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const { lang: locale } = params

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 10 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
      >
        <MenuSection label={dictionary['navigation'].formsAndTables}>
          <MenuItem href={`/${locale}/apps/invoice/list`} icon={<i className='ri-calendar-line' />}>
            Cotizaciones
          </MenuItem>

          <MenuItem href={`/${locale}/apps/user/solicitudes`} icon={<i className='ri-calendar-line' />}>
            Solicitudes
          </MenuItem>
          <MenuItem href={`/${locale}/apps/calendar`} icon={<i className='ri-calendar-line' />}>
            Agenda
          </MenuItem>
        </MenuSection>

        <MenuSection label={dictionary['navigation'].appsPages}>
          <MenuItem href={`/${locale}/apps/user/list`} icon={<i className='ri-book-line' />}>
            Clientes
          </MenuItem>
          <MenuItem href={`/${locale}/apps/user/obras`} icon={<i className='ri-pantone-line' />}>
            Obras
          </MenuItem>
          <MenuItem href={`/${locale}/apps/user/`} icon={<i className='ri-user-line' />}>
            Contactos
          </MenuItem>
          <MenuItem href={`/${locale}/apps/user/`} icon={<i className='ri-bill-line' />}>
            Lista de Precios
          </MenuItem>
        </MenuSection>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
