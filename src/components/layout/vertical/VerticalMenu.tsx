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
import { permisos } from '@/permisos/permisos'
import { usePermissions } from '@/hooks/usePermissions'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'

// Menu Data Imports
// import menuData from '@/data/navigation/verticalMenuData'

// Modificar el tipo Dictionary para hacerlo más seguro
type Dictionary =
  | {
    navigation: {
      formsAndTables: string
      appsPages: string
      [key: string]: string
    }
  }
  | undefined

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = () => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const params = useParams()
  const { hasPermission, hasRole } = usePermissions()
  const soloLectura = hasRole('Consulta')

  // Si el diccionario no está disponible, podemos mostrar valores por defecto
  const defaultLabels = {
    formsAndTables: 'Principal',
    appsPages: 'Mantenedores'
  }

  // Usar el operador de coalescencia nula para manejar el caso undefined
  const labels = defaultLabels

  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const locale = (params?.lang as string) || 'en'

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <div className='layout-vertical-nav'>
      <div className='nav-items'>
        <ScrollWrapper
          {...(isBreakpointReached
            ? { className: 'bs-full overflow-y-auto overflow-x-hidden' }
            : { options: { wheelPropagation: false, suppressScrollX: true } })}
        >
          {/* Vertical Menu */}
          <Menu
            popoutMenuOffset={{ mainAxis: 10 }}
            menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
            renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
          >
            <MenuSection label={labels.formsAndTables}>
              {hasPermission(permisos.cotizaciones.ver) && (
                <MenuItem href={`/${locale}/apps/invoice/list`} icon={<i className='ri-file-list-3-line' />}>
                  Cotizaciones
                </MenuItem>
              )}

              {hasPermission(permisos.solicitudes.ver) && (
                <MenuItem href={`/${locale}/apps/requests`} icon={<i className='ri-calendar-line' />}>
                  Solicitudes
                </MenuItem>
              )}

              {hasPermission(permisos.agenda.ver) && (
                <SubMenu label='Agenda' icon={<i className='ri-home-smile-line' />}>
                  <MenuItem href={`/${locale}/apps/calendar`} icon={<i className='ri-calendar-line' />}>
                    Agenda
                  </MenuItem>
                  <MenuItem href={`/${locale}/apps/otmanagement`} icon={<i className='ri-pantone-line' />}>
                    Gestión de Agenda
                  </MenuItem>
                </SubMenu>
              )}

              {hasPermission(permisos.control.ver) && (
                <SubMenu label='Control Interno' icon={<i className='ri-home-smile-line' />}>
                  <MenuItem href={`/${locale}/apps/user/control`} icon={<i className='ri-home-smile-line' />}>
                    Control Interno
                  </MenuItem>
                  <MenuItem href={`/${locale}/apps/rcmnavigator`} icon={<i className='ri-home-smile-line' />}>
                    Navegador
                  </MenuItem>
                  <MenuItem href={`/${locale}/apps/rcmnavigatordetail`} icon={<i className='ri-home-smile-line' />}>
                    Navegador Detalle
                  </MenuItem>
                </SubMenu>
              )}

              <MenuItem href={`/${locale}/apps/json-upload`} icon={<i className='ri-upload-2-line' />}>
                App
              </MenuItem>

              <MenuItem href={`/${locale}/apps/api`} icon={<i className='ri-calendar-schedule-line' />}>
                API Agenda
              </MenuItem>
            </MenuSection>

            <MenuSection label={labels.appsPages}>
              {hasPermission(permisos.empresa.ver) && (
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
              )}
              {hasPermission(permisos.productos.ver) && (
                <SubMenu label='Productos' icon={<i className='ri-shopping-bag-line' />}>
                  <MenuItem href={`/${locale}/apps/products`} icon={<i className='ri-price-tag-3-line' />}>
                    Productos
                  </MenuItem>
                  <MenuItem
                    href={`/${locale}/apps/products/pricelist`}
                    icon={<i className='ri-money-dollar-circle-line' />}
                  >
                    Lista de Precios
                  </MenuItem>
                </SubMenu>
              )}
              <SubMenu label='Equipos' icon={<i className='ri-tools-line' />}>
                <MenuItem href={`/${locale}/apps/equipos/list`} icon={<i className='ri-list-check' />}>
                  Equipos
                </MenuItem>
              </SubMenu>
            </MenuSection>
          </Menu>
        </ScrollWrapper>
      </div>

      <div className='nav-footer'>
        <div className='user-info'>{/* ... información del usuario ... */}</div>
      </div>
    </div>
  )
}

export default VerticalMenu
