'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { Cliente } from '@/types/forms/cliente'

// Component Imports
import ClientListTable from './ClientListTable'
import { getUserData } from '@/app/server/actions'
import { useEffect } from 'react'
import { useState } from 'react'

const UserListApp = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<Cliente[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const result = await getUserData()
        setData(result)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    isLoading ? (
      <div className='flex justify-center items-center h-[400px]'>
        <CircularProgress />
      </div>
    ) : (
      <ClientListTable userData={data} setData={setData} />
    )
  )
}

export default UserListApp
