'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import TablePagination from '@mui/material/TablePagination'
import Checkbox from '@mui/material/Checkbox'

// TanStack/React-Table Imports
import {
  createColumnHelper,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel
} from '@tanstack/react-table'

// Data Example for Table
const data = [
  {
    id: 1,
    document: 'Nombre Documento',
    minutas: 'Texto',
    factura: 'Nombre Factura'
  },
  {
    id: 2,
    document: 'Nombre Documento',
    minutas: 'Texto',
    factura: 'Nombre Factura'
  },
  {
    id: 3,
    document: 'Nombre Documento',
    minutas: 'Texto',
    factura: 'Nombre Factura'
  }
]

// Column Definitions
const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('id', {
    header: () => <Checkbox />, // Encabezado con checkbox
    cell: () => <Checkbox /> // Checkbox en cada fila
  }),
  columnHelper.accessor('document', {
    header: 'DOCUMENTOS',
    cell: info => <Typography>{info.getValue()}</Typography>
  }),
  columnHelper.accessor('minutas', {
    header: 'MINUTAS',
    cell: info => <Typography>{info.getValue()}</Typography>
  }),
  columnHelper.accessor('factura', {
    header: 'FACTURA',
    cell: info => <Typography>{info.getValue()}</Typography>
  })
]

const OrderDetailHeader = () => {
  // Table states
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      {/* Tabla Insertada */}
      <Card sx={{ width: '100%', backgroundColor: '#fff', marginTop: 4 }}>
        <CardHeader title='Facturación y Cobranza' />
        <Divider />
        <div className='overflow-x-auto'>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      style={{
                        padding: '8px',
                        textAlign: 'left',
                        borderBottom: '1px solid #ddd'
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #ddd'
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </Card>
    </>
  )
}

export default OrderDetailHeader
