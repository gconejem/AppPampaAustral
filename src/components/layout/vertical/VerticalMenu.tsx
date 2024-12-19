// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
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

          <SubMenu label='Agenda' icon={<i className='ri-home-smile-line' />}>
            <MenuItem href={`/${locale}/apps/calendar`} icon={<i className='ri-calendar-line' />}>
              Agenda
            </MenuItem>
            <MenuItem href={`/${locale}/apps/user/agenda`} icon={<i className='ri-pantone-line' />}>
              Gestión de Agenda
            </MenuItem>
          </SubMenu>
          <SubMenu label='Control Interno' icon={<i className='ri-home-smile-line' />}>
            <MenuItem href={`/${locale}/apps/user/control`} icon={<i className='ri-home-smile-line' />}>
              Control Interno
            </MenuItem>
            <MenuItem href={`/${locale}/apps/user/registro1`} icon={<i className='ri-home-smile-line' />}>
              Navegador
            </MenuItem>
            <MenuItem href={`/${locale}/apps/user/registro2`} icon={<i className='ri-home-smile-line' />}>
              Navegador Detalle
            </MenuItem>
          </SubMenu>

          <MenuItem href={`/${locale}/apps/invoice2/list`} icon={<i className='ri-home-smile-line' />}>
            Facturación
          </MenuItem>
        </MenuSection>

        <MenuSection label={dictionary['navigation'].appsPages}>
          <SubMenu label='Empresa' icon={<i className='ri-home-smile-line' />}>
            <MenuItem href={`/${locale}/apps/clients`} icon={<i className='ri-book-line' />}>
              Clientes
            </MenuItem>
            <MenuItem href={`/${locale}/apps/works`} icon={<i className='ri-pantone-line' />}>
              Obras
            </MenuItem>
            <MenuItem href={`/${locale}/apps/contacts`} icon={<i className='ri-book-line' />}>
              Contactos
            </MenuItem>
          </SubMenu>
          <SubMenu label='Productos' icon={<i className='ri-home-smile-line' />}>
            <MenuItem href={`/${locale}/apps/ecommerce/products/list`} icon={<i className='ri-bill-line' />}>
              Productos
            </MenuItem>
            <MenuItem href={`/${locale}/apps/ecommerce/products/list2`} icon={<i className='ri-bill-line' />}>
              Lista de Precios
            </MenuItem>
          </SubMenu>
          <MenuItem href={`/${locale}/apps/roles`} icon={<i className='ri-layout-left-line' />}>
            Roles
          </MenuItem>
          <MenuItem href={`/${locale}/apps/permissions`} icon={<i className='ri-lock-2-line' />}>
            Permisos
          </MenuItem>
        </MenuSection>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
