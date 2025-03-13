'use client'

import { styled } from '@mui/material/styles'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import es from 'date-fns/locale/es'

const AppReactDatepicker = styled(DatePicker)(({ theme }) => ({
  '& .react-datepicker': {
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
    width: '280px',
    padding: '16px',

    '& .react-datepicker__header': {
      backgroundColor: 'transparent',
      border: 'none',
      padding: 0,

      '& .react-datepicker__current-month': {
        fontSize: '0.875rem',
        color: theme.palette.text.primary,
        marginBottom: '8px',
        textTransform: 'capitalize'
      },

      '& .react-datepicker__day-names': {
        display: 'flex',
        justifyContent: 'space-around',
        margin: '8px 0'
      }
    },

    '& .react-datepicker__navigation': {
      top: '18px',

      '&--previous': {
        left: '20px'
      },
      '&--next': {
        right: '20px'
      }
    },

    '& .react-datepicker__day-name': {
      color: theme.palette.text.secondary,
      width: '34px',
      margin: 0,
      fontSize: '0.75rem',
      textTransform: 'lowercase'
    },

    '& .react-datepicker__month': {
      margin: 0
    },

    '& .react-datepicker__day': {
      color: theme.palette.text.primary,
      width: '34px',
      height: '34px',
      margin: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      borderRadius: 0,

      '&:hover': {
        backgroundColor: theme.palette.action.hover
      },

      '&.react-datepicker__day--selected': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        fontWeight: 500
      },

      '&.react-datepicker__day--keyboard-selected': {
        backgroundColor: 'transparent',
        color: theme.palette.text.primary
      },

      '&.react-datepicker__day--in-range': {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.main
      },

      '&.react-datepicker__day--in-selecting-range': {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.main
      },

      '&.react-datepicker__day--outside-month': {
        color: theme.palette.text.disabled
      }
    },

    '& .react-datepicker__month-container': {
      float: 'left'
    },

    // Estilos para el selector de tiempo
    '& .react-datepicker__time-container': {
      borderLeft: `1px solid ${theme.palette.divider}`,
      width: '85px',

      '& .react-datepicker__time': {
        backgroundColor: 'transparent',

        '& .react-datepicker__time-box': {
          width: '100%',

          '& ul.react-datepicker__time-list': {
            height: '210px !important',
            padding: 0,

            '& .react-datepicker__time-list-item': {
              height: 'auto',
              padding: '8px',
              color: theme.palette.text.primary,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              '&:hover': {
                backgroundColor: theme.palette.action.hover
              },

              '&--selected': {
                backgroundColor: `${theme.palette.primary.main} !important`,
                color: `${theme.palette.common.white} !important`,
                fontWeight: 500
              }
            }
          }
        }
      }
    }
  },

  '& .react-datepicker-popper': {
    zIndex: 2,
    '& .react-datepicker__triangle': {
      display: 'none'
    }
  }
}))

// Configurar el locale por defecto
AppReactDatepicker.defaultProps = {
  locale: es
}

export default AppReactDatepicker
