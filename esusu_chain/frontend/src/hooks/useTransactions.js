import { useState } from 'react'
import * as fcl from '@onflow/fcl'
import * as t from '@onflow/types'

// Transaction to create a circle
const CREATE_CIRCLE = `
import EsusuChain from 0xa89655a0f8e3d113

transaction(numberOfMembers: UInt64, contributionAmount: UFix64, cycleDuration: UFix64) {

    let circleManager: &EsusuChain.CircleManager
    let creatorAddress: Address

    prepare(signer: auth(Storage) &Account) {
        self.creatorAddress = signer.address

        // Borrow reference to CircleManager
        self.circleManager = signer.storage.borrow<&EsusuChain.CircleManager>(from: EsusuChain.CircleManagerStoragePath)
            ?? panic("CircleManager not found")
    }

    execute {
        // Create the circle
        let circleId = self.circleManager.createCircle(
            creator: self.creatorAddress,
            numberOfMembers: numberOfMembers,
            contributionAmount: contributionAmount,
            cycleDuration: cycleDuration
        )

        log("Circle created with ID: ".concat(circleId.toString()))
    }
}
`

// Transaction to join a circle
const JOIN_CIRCLE = `
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import EsusuChain from 0xa89655a0f8e3d113

transaction(circleId: UInt64) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Get provider capability for FlowToken vault
        let vaultPath = /storage/flowTokenVault
        let provider = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(vaultPath)

        // Join the circle
        EsusuChain.joinCircle(
            circleId: circleId,
            member: signer.address,
            vaultCap: provider
        )

        log("Member joined circle")
    }
}
`

// Transaction to setup CircleManager (one-time setup)
const SETUP_CIRCLE_MANAGER = `
import EsusuChain from 0xa89655a0f8e3d113

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Check if CircleManager already exists
        if signer.storage.borrow<&EsusuChain.CircleManager>(from: EsusuChain.CircleManagerStoragePath) == nil {
            // Create and save CircleManager
            let circleManager <- EsusuChain.createCircleManager()
            signer.storage.save(<-circleManager, to: EsusuChain.CircleManagerStoragePath)

            // Create and publish public capability
            let cap = signer.capabilities.storage.issue<&EsusuChain.CircleManager>(EsusuChain.CircleManagerStoragePath)
            signer.capabilities.publish(cap, at: EsusuChain.CircleManagerPublicPath)

            log("CircleManager setup complete")
        } else {
            log("CircleManager already exists")
        }
    }
}
`

export function useTransactions() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [txId, setTxId] = useState(null)

  const setupCircleManager = async () => {
    setIsLoading(true)
    setError(null)
    setTxId(null)

    try {
      const transactionId = await fcl.mutate({
        cadence: SETUP_CIRCLE_MANAGER,
        limit: 999,
      })

      setTxId(transactionId)

      // Wait for transaction to be sealed
      const result = await fcl.tx(transactionId).onceSealed()

      setIsLoading(false)
      return { success: true, transactionId, result }
    } catch (err) {
      console.error('Setup CircleManager failed:', err)
      setError(err.message)
      setIsLoading(false)
      throw err
    }
  }

  const createCircle = async (numberOfMembers, contributionAmount, cycleDuration) => {
    setIsLoading(true)
    setError(null)
    setTxId(null)

    try {
      const transactionId = await fcl.mutate({
        cadence: CREATE_CIRCLE,
        args: (arg, t) => [
          arg(numberOfMembers.toString(), t.UInt64),
          arg(contributionAmount.toFixed(8), t.UFix64),
          arg(cycleDuration.toFixed(8), t.UFix64),
        ],
        limit: 999,
      })

      setTxId(transactionId)

      // Wait for transaction to be sealed
      const result = await fcl.tx(transactionId).onceSealed()

      setIsLoading(false)
      return { success: true, transactionId, result }
    } catch (err) {
      console.error('Create circle failed:', err)
      setError(err.message)
      setIsLoading(false)
      throw err
    }
  }

  const joinCircle = async (circleId) => {
    setIsLoading(true)
    setError(null)
    setTxId(null)

    try {
      const transactionId = await fcl.mutate({
        cadence: JOIN_CIRCLE,
        args: (arg, t) => [arg(circleId.toString(), t.UInt64)],
        limit: 999,
      })

      setTxId(transactionId)

      // Wait for transaction to be sealed
      const result = await fcl.tx(transactionId).onceSealed()

      setIsLoading(false)
      return { success: true, transactionId, result }
    } catch (err) {
      console.error('Join circle failed:', err)
      setError(err.message)
      setIsLoading(false)
      throw err
    }
  }

  return {
    isLoading,
    error,
    txId,
    setupCircleManager,
    createCircle,
    joinCircle,
  }
}
