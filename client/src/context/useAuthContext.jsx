import { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'
import { useAtom } from 'jotai'
import userAtom from '@/atoms/userAtom'
import useShowModal from '@/hooks/useShowModal'

axios.defaults.withCredentials = true
// const BASE_URL = 'https://api.vertex-engineering.co/api/v1/'
const BASE_URL = 'http://localhost:5005/api/v1/'

const AuthContext = createContext(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const showModal = useShowModal()
  const [, setUser] = useAtom(userAtom)

  const handleSignup = async (firstname, lastname, username, email, password, role) => {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showModal('Error', 'Please enter a valid email address.', 'error')
      return // Don't proceed with signup if email is invalid
    }

    try {
      const res = await axios.post(`${BASE_URL}signup`, {
        firstname,
        lastname,
        username,
        email,
        password,
        role,
      })

      // log full response for debugging
      console.log('signup response:', res.status, res.data)

      const data = res.data

      if (res.status < 200 || res.status >= 300) {
        // show backend message if available
        showModal('Error', data?.error || data?.message || `Signup failed (status ${res.status})`, 'error')
        return
      }

      if (data?.error) {
        showModal('Error', data.error, 'error')
        return
      }

      // Store a message or status in localStorage to show to the user
      localStorage.setItem(
        'signup-status',
        JSON.stringify({
          message: 'Signup successful! Please check your email to verify your account.',
        }),
      )

      window.location.href = '/'
    } catch (error) {
      // print full error (network / CORS / server) for debugging
      console.error('Signup error:', error)

      const backendMessage = error?.response?.data?.error || error?.response?.data?.message || error?.response?.data || null

      if (backendMessage) {
        showModal('Error', backendMessage, 'error')
      } else {
        // network or unexpected error
        showModal('Error', error.message || 'An error occurred. Please try again.', 'error')
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        // user,
        // isAuthenticated: hasCookie(authSessionKey),
        // saveSession,
        // removeSession,
        handleSignup,
      }}>
      {children}
    </AuthContext.Provider>
  )
}
