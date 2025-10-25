import { createContext, useContext, useMemo } from 'react'
import axios from 'axios'

axios.defaults.withCredentials = true
// const BASE_URL = 'https://api.vertex-engineering.co/api/v1/'
const BASE_URL = 'http://localhost:5005/api/v1/'

const GlobalContext = createContext()

export const GlobalProvider = ({ children }) => {
  // Create a memoized axios instance
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response || error.message)
        return Promise.reject(error)
      },
    )

    return instance
  }, [])

  const createService = async (data) => {
    const response = await axiosInstance.post('/services', data)
    return response.data
  }

  return (
    <GlobalContext.Provider
      value={{
        createService,
      }}>
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobalContext = () => useContext(GlobalContext)
