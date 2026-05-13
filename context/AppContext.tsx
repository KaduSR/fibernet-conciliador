'use client'
import React, { createContext, useContext, useState } from 'react'

type AppContextType = {
  activeTab: string
  setActiveTab: (tab: string) => void
  hasData: boolean
  setHasData: (value: boolean) => void
  screen: string
  setScreen: (value: string) => void
  periodo: string
  setPeriodo: (value: string) => void
  showSaldo: boolean
  setShowSaldo: (value: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('import')
  const [hasData, setHasData] = useState(false)
  const [screen, setScreen] = useState('upload')
  const [periodo, setPeriodo] = useState('')
  const [showSaldo, setShowSaldo] = useState(true)

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      hasData,
      setHasData,
      screen,
      setScreen,
      periodo,
      setPeriodo,
      showSaldo,
      setShowSaldo,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext