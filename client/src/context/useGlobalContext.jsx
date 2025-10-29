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
    const response = await axiosInstance.post('/services', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  const getAllServices = async () => {
    const response = await axiosInstance.get('/services')
    return response.data.services
  }

  const getServiceById = async (id) => {
    const response = await axiosInstance.get(`/services/${id}`)
    return response.data.service
  }

  const updateService = async (id, data) => {
    const response = await axiosInstance.put(`/services/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.service
  }

  const deleteService = async (id) => {
    const response = await axiosInstance.delete(`/services/${id}`)
    return response.data
  }

  const createProject = async (data) => {
    const response = await axiosInstance.post('/projects', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  const getAllProjects = async () => {
    const response = await axiosInstance.get('/projects')
    return response.data.projects
  }

  const deleteProject = async (id) => {
    const response = await axiosInstance.delete(`/projects/${id}`)
    return response.data
  }

  return (
    <GlobalContext.Provider
      value={{
        createService,
        getAllServices,
        getServiceById,
        updateService,
        deleteService,
        createProject,
        getAllProjects,
        deleteProject,
      }}>
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobalContext = () => useContext(GlobalContext)
