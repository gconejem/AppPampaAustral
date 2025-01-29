import axios from 'axios'

const axiosInstance = axios.create({
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json'
  }
})

export default axiosInstance
