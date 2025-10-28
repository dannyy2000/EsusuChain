import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'

export function useAuth() {
  const [user, setUser] = useState({ loggedIn: false, addr: null })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Subscribe to authentication changes
    const unsubscribe = fcl.currentUser.subscribe((currentUser) => {
      console.log('🔐 Auth state changed:', {
        loggedIn: currentUser.loggedIn,
        addr: currentUser.addr,
        timestamp: new Date().toISOString()
      })

      setUser((prevUser) => {
        // If user was logged in and now isn't, log warning
        if (prevUser.loggedIn && !currentUser.loggedIn) {
          console.warn('⚠️ User was logged out! This might be due to:')
          console.warn('   1. Wallet extension issue')
          console.warn('   2. Transaction approval flow')
          console.warn('   3. Session timeout')
        }
        return currentUser
      })
      setIsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const logIn = async () => {
    try {
      await fcl.authenticate()
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logOut = async () => {
    try {
      await fcl.unauthenticate()
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  return {
    user,
    loggedIn: user.loggedIn,
    addr: user.addr,
    isLoading,
    logIn,
    logOut,
  }
}
