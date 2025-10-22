import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'

export function useAuth() {
  const [user, setUser] = useState({ loggedIn: false, addr: null })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Subscribe to authentication changes
    const unsubscribe = fcl.currentUser.subscribe((currentUser) => {
      setUser(currentUser)
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
