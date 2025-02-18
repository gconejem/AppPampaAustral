'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

const InvoiceListTable = ({ invoiceData }: { invoiceData?: InvoiceType[] }) => {
  return (
    <Card>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={invoiceData?.length > 0 && invoiceData.length < invoiceData.length}
                  checked={invoiceData?.length > 0 && invoiceData.length === invoiceData.length}
                  onChange={(event) => {
                    if (event.target.checked) {
                      // Handle select all
                    } else {
                      // Handle select none
                    }
                  }}
                  inputProps={{ 'aria-label': 'select all' }}
                />
              </TableCell>
              <TableCell>N° COTIZACIÓN</TableCell>
              <TableCell>CLIENTE</TableCell>
              <TableCell>FECHA</TableCell>
              <TableCell>ESTADO</TableCell>
              <TableCell>ACCIONES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceData?.map(row => (
              <TableRow key={row.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={invoiceData.includes(row.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        // Handle select individual
                      } else {
                        // Handle deselect individual
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{row.numeroCotizacion}</TableCell>
                <TableCell>{row.cliente}</TableCell>
                <TableCell>{row.fecha}</TableCell>
                <TableCell>
                  <Chip
                    label={row.estado}
                    color={row.estado === 'PENDIENTE' ? 'warning' : 'success'}
                    variant='outlined'
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Ver">
                      <IconButton
                        size="small"
                        href={`/apps/invoice/preview/${row.id}`}
                      >
                        <i className="ri-eye-line" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        href={`/apps/invoice/edit/${row.id}`}
                      >
                        <i className="ri-pencil-line" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                      >
                        <i className="ri-delete-bin-line" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default InvoiceListTable
