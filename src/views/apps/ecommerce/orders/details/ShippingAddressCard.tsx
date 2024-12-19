'use client'

// React Imports
import { useEffect, useState, useMemo, forwardRef } from 'react'

// MUI Imports

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel
} from '@tanstack/react-table'

// DatePicker Imports
import 'react-datepicker/dist/react-datepicker.css'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { UsersType } from '@/types/apps/userTypes'

// Styled Components

// Simulated Data
const data = [
  {
    id: 1,
    name: 'Galen Slixby',
    email: 'gslixby0@abc.net.au',
    role: 'Editor',
    plan: 'Enterprise',
    status: 'Inactive'
  },
  {
    id: 2,
    name: 'Halsey Redmore',
    email: 'hredmore1@imgur.com',
    role: 'Author',
    plan: 'Team',
    status: 'Pending'
  },
  {
    id: 3,
    name: 'Marjory Sicely',
    email: 'msicely2@who.int',
    role: 'Maintainer',
    plan: 'Enterprise',
    status: 'Active'
  }
]

// Column Definitions
const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('id', {
    header: 'ID SOLICITUD',
    cell: info => <Checkbox />
  }),
  columnHelper.accessor('name', {
    header: 'CLIENTE',
    cell: info => (
      <div>
        <Typography>{info.getValue()}</Typography>
        <Typography variant='caption' color='textSecondary'>
          {data[info.row.index].email}
        </Typography>
      </div>
    )
  }),
  columnHelper.accessor('role', {
    header: 'ROL',
    cell: info => <Typography>{info.getValue()}</Typography>
  }),
  columnHelper.accessor('plan', {
    header: 'PLAN',
    cell: info => <Typography>{info.getValue()}</Typography>
  }),
  columnHelper.accessor('status', {
    header: 'ESTADO',
    cell: info => (
      <Typography
        color={info.getValue() === 'Active' ? 'success' : info.getValue() === 'Pending' ? 'warning' : 'textSecondary'}
      >
        {info.getValue()}
      </Typography>
    )
  })
]

// Main Component
const ExampleTable = () => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })
}

export default ExampleTable
