import { useState } from 'react'
import * as fcl from '@onflow/fcl'
import * as t from '@onflow/types'

// Script to check if CircleManager exists
const CHECK_CIRCLE_MANAGER = `
import EsusuChain from 0xa89655a0f8e3d113

access(all) fun main(address: Address): Bool {
    let account = getAccount(address)
    let managerRef = account.capabilities
        .get<&EsusuChain.CircleManager>(EsusuChain.CircleManagerPublicPath)
        .borrow()

    return managerRef != nil
}
`

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
// AUTOMATIC: If this is the last member joining, Flow Transaction Scheduler is automatically set up
const JOIN_CIRCLE = `
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import EsusuChain from 0xa89655a0f8e3d113
import FlowTransactionScheduler from 0x8c5303eaa26202d6
import FlowTransactionSchedulerUtils from 0x8c5303eaa26202d6
import EsusuChainTransactionHandler from 0xa89655a0f8e3d113

transaction(circleId: UInt64) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        log("=== JOIN CIRCLE TRANSACTION START (FIXED VERSION v2) ===")
        log("Circle ID: ".concat(circleId.toString()))
        log("Signer address: ".concat(signer.address.toString()))

        // Get provider capability for FlowToken vault
        let vaultPath = /storage/flowTokenVault

        // Check if vault exists
        let vaultRef = signer.storage.borrow<&FlowToken.Vault>(from: vaultPath)
            ?? panic("Could not borrow FlowToken vault reference")

        log("Vault balance: ".concat(vaultRef.balance.toString()))

        // Get circle info to check requirements
        let circleInfo = EsusuChain.getCircleInfo(circleId: circleId)
            ?? panic("Circle does not exist")

        let contributionAmount = circleInfo["contributionAmount"] as! UFix64? ?? 0.0
        let numberOfMembers = circleInfo["numberOfMembers"] as! UInt64? ?? 0
        let memberCount = circleInfo["memberCount"] as! Int? ?? 0
        let cycleDuration = circleInfo["cycleDuration"] as! UFix64? ?? 0.0
        let statusEnum = circleInfo["status"] as! EsusuChain.CircleStatus?
        let status = statusEnum?.rawValue ?? 0

        log("Circle contribution amount: ".concat(contributionAmount.toString()))
        log("Circle number of members: ".concat(numberOfMembers.toString()))
        log("Circle current member count: ".concat(memberCount.toString()))
        log("Circle status rawValue: ".concat(status.toString()))

        let totalRequired = contributionAmount * UFix64(numberOfMembers)
        log("Total FLOW required: ".concat(totalRequired.toString()))

        // Verify balance
        if vaultRef.balance < totalRequired {
            panic("Insufficient balance. You have ".concat(vaultRef.balance.toString())
                .concat(" FLOW but need ").concat(totalRequired.toString()).concat(" FLOW"))
        }

        log("Balance check passed!")

        // Issue a new capability for the vault
        let provider = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(vaultPath)

        // Verify the capability works
        assert(provider.check(), message: "Failed to create valid vault capability")

        log("Capability created and verified")

        // Check if this will make the circle full
        let willBeFull = (memberCount + 1) == Int(numberOfMembers)
        log("Will circle be full after joining? ".concat(willBeFull ? "true" : "false"))

        // Join the circle
        log("Calling EsusuChain.joinCircle...")
        EsusuChain.joinCircle(
            circleId: circleId,
            member: signer.address,
            vaultCap: provider
        )

        log("✅ Successfully joined circle!")

        // If circle is now full, automatically set up the scheduler
        if willBeFull {
            log("🤖 Circle is now FULL! Automatically setting up Flow Transaction Scheduler...")

            // Create handler for automated pulls
            let handler <- EsusuChainTransactionHandler.createHandler(
                circleId: circleId,
                cycleDuration: cycleDuration
            )

            // Save handler to storage
            let handlerPath = StoragePath(identifier: "EsusuChainHandler_".concat(circleId.toString()))!
            signer.storage.save(<-handler, to: handlerPath)

            // Issue handler capability
            let handlerCap = signer.capabilities.storage.issue<
                auth(FlowTransactionScheduler.Execute) &FlowTransactionScheduler.TransactionHandler
            >(handlerPath)

            log("Handler created and saved")

            // Ensure scheduler manager exists
            if signer.storage.borrow<&AnyResource>(from: FlowTransactionSchedulerUtils.managerStoragePath) == nil {
                let manager <- FlowTransactionSchedulerUtils.createManager()
                signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)

                let managerCapPublic = signer.capabilities.storage.issue<&FlowTransactionSchedulerUtils.Manager>(
                    FlowTransactionSchedulerUtils.managerStoragePath
                )
                signer.capabilities.publish(managerCapPublic, at: FlowTransactionSchedulerUtils.managerPublicPath)

                log("Scheduler manager created")
            }

            // Borrow manager
            let manager = signer.storage.borrow<
                auth(FlowTransactionSchedulerUtils.Owner) &FlowTransactionSchedulerUtils.Manager
            >(
                from: FlowTransactionSchedulerUtils.managerStoragePath
            ) ?? panic("Could not borrow Manager")

            // Borrow vault for fees
            let flowVault = signer.storage.borrow<
                auth(FungibleToken.Withdraw) &FlowToken.Vault
            >(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")

            // Schedule pulls for each cycle
            var cycleNumber: UInt64 = 0
            while cycleNumber < numberOfMembers {
                // Calculate execution time (cycle 1 = now + cycleDuration, cycle 2 = now + 2*cycleDuration, etc.)
                let executeAt = getCurrentBlock().timestamp + (cycleDuration * UFix64(cycleNumber + 1))

                // Estimate fees
                let est = FlowTransactionScheduler.estimate(
                    data: nil,
                    timestamp: executeAt,
                    priority: FlowTransactionScheduler.Priority.Medium,
                    executionEffort: 1000
                )

                // Withdraw fees
                let fees <- flowVault.withdraw(amount: est.flowFee ?? 0.0) as! @FlowToken.Vault

                // Schedule pull
                let txId = manager.schedule(
                    handlerCap: handlerCap,
                    data: nil,
                    timestamp: executeAt,
                    priority: FlowTransactionScheduler.Priority.Medium,
                    executionEffort: 1000,
                    fees: <-fees
                )

                log("📅 Scheduled pull #".concat((cycleNumber + 1).toString())
                    .concat(" at ").concat(executeAt.toString())
                    .concat(" (txId: ").concat(txId.toString()).concat(")"))

                cycleNumber = cycleNumber + 1
            }

            log("🎉 Successfully scheduled ".concat(numberOfMembers.toString()).concat(" automated pulls!"))
            log("🤖 Flow blockchain will execute them automatically - no further action needed!")
        }

        log("=== JOIN CIRCLE TRANSACTION SUCCESS ===")
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

// Transaction to setup automated scheduler for a circle
const SCHEDULE_CIRCLE = `
import FlowTransactionScheduler from 0x8c5303eaa26202d6
import FlowTransactionSchedulerUtils from 0x8c5303eaa26202d6
import EsusuChain from 0xa89655a0f8e3d113
import EsusuChainTransactionHandler from 0xa89655a0f8e3d113
import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

transaction(circleId: UInt64) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        log("=== SETTING UP AUTOMATED SCHEDULER ===")

        // Get circle info
        let circleInfo = EsusuChain.getCircleInfo(circleId: circleId)
            ?? panic("Circle does not exist")

        let cycleDuration = circleInfo["cycleDuration"] as! UFix64
        let numberOfMembers = circleInfo["numberOfMembers"] as! UInt64
        let status = circleInfo["status"] as! EsusuChain.CircleStatus

        // Verify circle is active
        assert(status == EsusuChain.CircleStatus.Active, message: "Circle must be active")

        log("Circle ID: ".concat(circleId.toString()))
        log("Cycle duration: ".concat(cycleDuration.toString()).concat(" seconds"))
        log("Number of cycles: ".concat(numberOfMembers.toString()))

        // Create handler
        let handler <- EsusuChainTransactionHandler.createHandler(
            circleId: circleId,
            cycleDuration: cycleDuration
        )

        // Save handler to storage
        let handlerPath = StoragePath(identifier: "EsusuChainHandler_".concat(circleId.toString()))!
        signer.storage.save(<-handler, to: handlerPath)

        // Issue handler capability
        let handlerCap = signer.capabilities.storage.issue<
            auth(FlowTransactionScheduler.Execute) &FlowTransactionScheduler.TransactionHandler
        >(handlerPath)

        log("Handler created and saved")

        // Ensure scheduler manager exists
        if signer.storage.borrow<&AnyResource>(from: FlowTransactionSchedulerUtils.managerStoragePath) == nil {
            let manager <- FlowTransactionSchedulerUtils.createManager()
            signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)

            let managerCapPublic = signer.capabilities.storage.issue<&FlowTransactionSchedulerUtils.Manager>(
                FlowTransactionSchedulerUtils.managerStoragePath
            )
            signer.capabilities.publish(managerCapPublic, at: FlowTransactionSchedulerUtils.managerPublicPath)

            log("Scheduler manager created")
        }

        // Borrow manager
        let manager = signer.storage.borrow<
            auth(FlowTransactionSchedulerUtils.Owner) &FlowTransactionSchedulerUtils.Manager
        >(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) ?? panic("Could not borrow Manager")

        // Borrow vault for fees
        let flowVault = signer.storage.borrow<
            auth(FungibleToken.Withdraw) &FlowToken.Vault
        >(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")

        // Schedule pulls for each cycle
        var cycleNumber: UInt64 = 0
        while cycleNumber < numberOfMembers {
            // Calculate execution time
            let executeAt = getCurrentBlock().timestamp + (cycleDuration * UFix64(cycleNumber + 1))

            // Estimate fees
            let est = FlowTransactionScheduler.estimate(
                data: nil,
                timestamp: executeAt,
                priority: FlowTransactionScheduler.Priority.Medium,
                executionEffort: 1000
            )

            // Withdraw fees
            let fees <- flowVault.withdraw(amount: est.flowFee ?? 0.0) as! @FlowToken.Vault

            // Schedule pull
            let txId = manager.schedule(
                handlerCap: handlerCap,
                data: nil,
                timestamp: executeAt,
                priority: FlowTransactionScheduler.Priority.Medium,
                executionEffort: 1000,
                fees: <-fees
            )

            log("Scheduled pull #".concat((cycleNumber + 1).toString())
                .concat(" at ").concat(executeAt.toString())
                .concat(" (txId: ").concat(txId.toString()).concat(")"))

            cycleNumber = cycleNumber + 1
        }

        log("=== SUCCESSFULLY SCHEDULED ".concat(numberOfMembers.toString()).concat(" PULLS ==="))
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

  const checkCircleManager = async (address) => {
    try {
      const hasManager = await fcl.query({
        cadence: CHECK_CIRCLE_MANAGER,
        args: (arg, t) => [arg(address, t.Address)],
      })
      return hasManager
    } catch (err) {
      console.error('Check CircleManager failed:', err)
      return false
    }
  }

  const createCircle = async (numberOfMembers, contributionAmount, cycleDuration) => {
    setIsLoading(true)
    setError(null)
    setTxId(null)

    try {
      // Get current user address
      const currentUser = await fcl.currentUser.snapshot()
      const userAddress = currentUser?.addr

      if (!userAddress) {
        throw new Error('No user address found. Please connect your wallet.')
      }

      // Check if CircleManager exists, if not, set it up first
      const hasManager = await checkCircleManager(userAddress)

      if (!hasManager) {
        console.log('CircleManager not found. Setting up...')
        setError('Setting up your account... Please approve the setup transaction.')

        // Setup CircleManager first
        await setupCircleManager()

        console.log('CircleManager setup complete. Creating circle...')
        setError('Account setup complete. Creating circle...')
      }

      // Now create the circle
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

      // Extract circle ID from events
      let circleId = null
      if (result.events) {
        console.log('Transaction events:', result.events)

        // Try to find CircleCreated event
        const circleCreatedEvent = result.events.find(e =>
          e.type.includes('EsusuChain.CircleCreated')
        )

        if (circleCreatedEvent && circleCreatedEvent.data) {
          console.log('CircleCreated event found:', circleCreatedEvent.data)
          circleId = parseInt(circleCreatedEvent.data.circleId)
        }
      }

      // Fallback: extract from logs
      if (circleId === null && result.status === 4) { // 4 = SEALED
        console.log('Trying to extract circleId from logs...')
        // Check transaction logs
        if (result.events && result.events.length > 0) {
          // Log all event types for debugging
          result.events.forEach(e => console.log('Event type:', e.type, 'Data:', e.data))
        }

        // Alternative: Query the next circle ID and subtract 1
        // This works because the contract increments nextCircleId after creating
        try {
          const nextId = await fcl.query({
            cadence: `
              import EsusuChain from 0xa89655a0f8e3d113
              access(all) fun main(): UInt64 {
                return EsusuChain.nextCircleId
              }
            `
          })
          circleId = parseInt(nextId) - 1
          console.log('Circle ID extracted from nextCircleId:', circleId)
        } catch (err) {
          console.error('Failed to get nextCircleId:', err)
        }
      }

      console.log('Final circleId:', circleId)
      setIsLoading(false)
      setError(null)
      return { success: true, transactionId, result, circleId }
    } catch (err) {
      console.error('Create circle failed:', err)

      // Parse error message to make it user-friendly
      let userMessage = err.message
      if (userMessage.includes('Contribution amount must be greater than 0')) {
        userMessage = 'Contribution amount must be greater than 0 FLOW'
      } else if (userMessage.includes('pre-condition failed')) {
        userMessage = 'Invalid input parameters. Please check your values and try again.'
      } else if (userMessage.includes('declined') || userMessage.includes('User rejected')) {
        userMessage = 'Transaction was cancelled'
      }

      setError(userMessage)
      setIsLoading(false)
      throw new Error(userMessage)
    }
  }

  const joinCircle = async (circleId) => {
    console.log('🔵 joinCircle function called with circleId:', circleId)

    setIsLoading(true)
    setError(null)
    setTxId(null)

    try {
      // Check user connection first
      console.log('🔍 Checking user connection...')
      const currentUser = await fcl.currentUser.snapshot()
      console.log('👤 Current user:', currentUser)

      if (!currentUser?.addr) {
        throw new Error('No wallet connected. Please connect your wallet first.')
      }

      console.log(`✅ User connected: ${currentUser.addr}`)
      console.log(`🔵 Attempting to join circle ${circleId}...`)
      console.log('📝 Transaction cadence length:', JOIN_CIRCLE.length)
      console.log('🔍 JOIN_CIRCLE imports check:', JOIN_CIRCLE.substring(0, 400))

      console.log('⏳ Calling fcl.mutate...')

      let transactionId
      try {
        transactionId = await fcl.mutate({
          cadence: JOIN_CIRCLE,
          args: (arg, t) => [arg(circleId.toString(), t.UInt64)],
          limit: 999,
        })
      } catch (mutateError) {
        console.error('❌ fcl.mutate failed:', mutateError)

        if (mutateError.message?.includes('Declined') || mutateError.message?.includes('declined')) {
          throw new Error('Transaction was declined in wallet')
        }
        if (mutateError.message?.includes('User rejected')) {
          throw new Error('Transaction was rejected by user')
        }

        throw mutateError
      }

      console.log('✅ fcl.mutate returned successfully')
      console.log(`📝 Transaction ID: ${transactionId}`)

      if (!transactionId) {
        throw new Error('Transaction ID is null - transaction may have been cancelled')
      }

      setTxId(transactionId)

      // Wait for transaction to be sealed with status updates
      console.log('⏳ Waiting for transaction to be sealed...')

      const result = await fcl.tx(transactionId).onceSealed()

      console.log('📋 Join circle transaction result:', result)
      console.log('📊 Transaction status code:', result.status)
      console.log('📊 Status (4=SEALED):', result.status === 4 ? 'SEALED ✅' : `OTHER (${result.status})`)

      // Check if transaction actually succeeded
      if (result.errorMessage) {
        console.error('❌ Transaction failed with error:', result.errorMessage)
        console.error('❌ Full error object:', result)

        // Try to extract more detailed error info
        let detailedError = result.errorMessage

        // Check for common errors and make them user-friendly
        if (detailedError.includes('Insufficient balance')) {
          detailedError = 'You do not have enough FLOW in your wallet to join this circle.'
        } else if (detailedError.includes('Circle is full')) {
          detailedError = 'This circle is already full and cannot accept more members.'
        } else if (detailedError.includes('Circle is not accepting members')) {
          detailedError = 'This circle is no longer accepting new members (it may have already started).'
        } else if (detailedError.includes('Member already exists')) {
          detailedError = 'You are already a member of this circle.'
        }

        throw new Error(detailedError)
      }

      if (result.status === 4) {
        console.log('✅ Transaction SEALED successfully!')

        // Check for join event
        if (result.events) {
          console.log(`📡 Found ${result.events.length} events:`)
          result.events.forEach(e => {
            console.log(`   - ${e.type}`, e.data)
          })

          const joinEvent = result.events.find(e => e.type.includes('MemberJoined'))
          if (joinEvent) {
            console.log('✅ MemberJoined event found!', joinEvent.data)
          } else {
            console.warn('⚠️ No MemberJoined event found - join may have failed')
          }
        }
      } else {
        console.warn('⚠️ Transaction sealed with unexpected status:', result.status)
        console.warn('⚠️ Status codes: 0=Unknown, 1=Pending, 2=Finalized, 3=Executed, 4=Sealed, 5=Expired')
      }

      setIsLoading(false)
      return { success: result.status === 4 && !result.errorMessage, transactionId, result }
    } catch (err) {
      console.error('❌ Join circle failed:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        errorCode: err.errorCode
      })
      setError(err.message)
      setIsLoading(false)
      throw err
    }
  }

  const scheduleCircleAutomation = async (circleId) => {
    console.log('🤖 scheduleCircleAutomation called for circle:', circleId)

    setIsLoading(true)
    setError(null)
    setTxId(null)

    try {
      console.log('⏳ Calling fcl.mutate to schedule automation...')

      const transactionId = await fcl.mutate({
        cadence: SCHEDULE_CIRCLE,
        args: (arg, t) => [arg(circleId.toString(), t.UInt64)],
        limit: 999,
      })

      console.log('✅ Schedule transaction submitted:', transactionId)
      setTxId(transactionId)

      // Wait for transaction to be sealed
      console.log('⏳ Waiting for transaction to be sealed...')
      const result = await fcl.tx(transactionId).onceSealed()

      console.log('📋 Schedule transaction result:', result)

      if (result.errorMessage) {
        console.error('❌ Scheduling failed:', result.errorMessage)
        throw new Error(`Scheduling failed: ${result.errorMessage}`)
      }

      if (result.status === 4) {
        console.log('✅ Automated scheduler set up successfully!')
        console.log('🤖 Flow blockchain will now automatically execute contribution pulls and payouts!')
      }

      setIsLoading(false)
      return { success: result.status === 4 && !result.errorMessage, transactionId, result }
    } catch (err) {
      console.error('❌ Schedule automation failed:', err)
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
    checkCircleManager,
    createCircle,
    joinCircle,
    scheduleCircleAutomation,
  }
}
