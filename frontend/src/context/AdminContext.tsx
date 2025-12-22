import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type AdminContextValue = {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined)
const STORAGE_KEY = 'bgpiesa_admin_token'

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  )

  const login = (nextToken: string) => {
    localStorage.setItem(STORAGE_KEY, nextToken)
    setToken(nextToken)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token]
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export const useAdmin = (): AdminContextValue => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin трябва да се използва в AdminProvider')
  }
  return context
}

