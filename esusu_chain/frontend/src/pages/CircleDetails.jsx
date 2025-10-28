import { motion } from 'framer-motion'
import { useEffect } from 'react'
import {
  ArrowLeft,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
  Calendar,
  Zap,
  ExternalLink,
  Copy,
  Share2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import * as fcl from '@onflow/fcl'
import { useCircleInfo, useIsMember } from '../hooks/useCircles'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../hooks/useAuth'
import { CONTRACT_ADDRESS } from '../config/flow'
import { getCircleDisplayName } from '../utils/circleNames'

export default function CircleDetails({ circle: initialCircle, onNavigate }) {
  const { addr } = useAuth()
  const { joinCircle, isLoading: txLoading } = useTransactions()

  // Use the hook to get real-time data if we have a circle ID
  const { circle: liveCircle, isLoading, error, refetch } = useCircleInfo(initialCircle?.id)

  // Check if current user is a member
  const { isMember, memberInfo, isLoading: memberCheckLoading } = useIsMember(initialCircle?.id, addr)

  // Diagnostic function to test wallet
  const testWalletConnection = async () => {
    console.log('🧪 Testing wallet connection...')
    try {
      const user = await fcl.currentUser.snapshot()
      console.log('👤 User snapshot:', user)

      if (user.loggedIn) {
        console.log('✅ Wallet is connected')
        console.log('📍 Address:', user.addr)
        console.log('🔧 Services:', user.services)

        // Detect wallet type
        const walletService = user.services?.find(s => s.type === 'authn')
        console.log('💳 Wallet service:', walletService)

        if (walletService) {
          console.log('💳 Wallet provider:', walletService.provider?.name || 'Unknown')
          console.log('💳 Wallet endpoint:', walletService.endpoint)
        }

        // Try to get account info
        const account = await fcl.account(user.addr)
        console.log('💼 Account info:', account)
        console.log('💰 Account balance:', account.balance)

        alert(`Wallet connected!\nAddress: ${user.addr}\nWallet: ${walletService?.provider?.name || 'Unknown'}\nBalance: ${account.balance} FLOW`)
      } else {
        console.log('❌ Wallet not connected')
        alert('Wallet not connected. Please connect first.')
      }
    } catch (err) {
      console.error('❌ Wallet test failed:', err)
      alert('Wallet test failed: ' + err.message)
    }
  }

  // Refresh circle data when user address changes (e.g., switching accounts)
  useEffect(() => {
    if (addr && refetch) {
      console.log('🔄 User address changed, refreshing circle data...')
      refetch()
    }
  }, [addr])

  // Use live data if available, otherwise fall back to initial data
  const circle = liveCircle || initialCircle

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        <span className="ml-3 text-gray-400">Loading circle details...</span>
      </div>
    )
  }

  if (error || !circle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {error ? 'Error loading circle' : 'Circle not found'}
          </h2>
          {error && <p className="text-gray-400 mb-4">{error}</p>}
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-primary-400 hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Calculate circle stats
  const isCreator = addr && circle.creator === addr
  const isFull = circle.memberCount >= circle.numberOfMembers
  const totalPool = circle.contributionAmount * circle.numberOfMembers
  const progress = (circle.currentCycle / circle.numberOfMembers) * 100

  console.log('🔍 Circle stats calculated:', {
    circleId: circle.id,
    memberCount: circle.memberCount,
    numberOfMembers: circle.numberOfMembers,
    isFull,
    isCreator,
    currentUser: addr
  })

  // Status helpers
  const getStatusLabel = (status) => {
    switch (status) {
      case 0: return 'Forming'
      case 1: return 'Active'
      case 2: return 'Completed'
      case 3: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  const canJoin = circle.status === 0 && !isFull && !isCreator && !isMember && !memberCheckLoading

  console.log('🔍 Join eligibility check:', {
    circleId: circle.id,
    userAddress: addr,
    isCreator,
    isFull,
    memberCount: circle.memberCount,
    numberOfMembers: circle.numberOfMembers,
    isMember,
    memberCheckLoading,
    status: circle.status,
    canJoin
  })

  const handleJoinCircle = async () => {
    console.log('🔵 handleJoinCircle called')
    console.log('🔍 Current user address:', addr)
    console.log('🔍 Circle ID:', circle.id)
    console.log('🔍 txLoading state:', txLoading)

    // Verify user is still connected
    const userSnapshot = await fcl.currentUser.snapshot()
    if (!userSnapshot.loggedIn) {
      console.error('❌ User not logged in!')
      alert('Please connect your wallet first')
      return
    }

    // Variables for error reporting
    let freshMemberCount = 0
    let freshNumberOfMembers = 0

    try {
      // IMPORTANT: Fetch fresh circle data from blockchain first
      console.log('🔄 Fetching fresh circle data from blockchain...')
      const freshCircleData = await fcl.query({
        cadence: `
          import EsusuChain from 0xa89655a0f8e3d113
          access(all) fun main(circleId: UInt64): {String: AnyStruct}? {
            return EsusuChain.getCircleInfo(circleId: circleId)
          }
        `,
        args: (arg, t) => [arg(circle.id.toString(), t.UInt64)]
      })

      if (!freshCircleData) {
        alert('Circle not found on blockchain')
        return
      }

      freshMemberCount = parseInt(freshCircleData.memberCount || 0)
      freshNumberOfMembers = parseInt(freshCircleData.numberOfMembers)

      // Extract status properly - handle Cadence enum format
      let freshStatus = null

      console.log('🔍 Extracting status from blockchain:', {
        statusData: freshCircleData.status,
        statusType: typeof freshCircleData.status,
        hasRawValue: freshCircleData.status?.rawValue !== undefined,
        rawValueType: typeof freshCircleData.status?.rawValue
      })

      if (typeof freshCircleData.status === 'number') {
        freshStatus = freshCircleData.status
        console.log('✅ Status is direct number:', freshStatus)
      } else if (freshCircleData.status && typeof freshCircleData.status === 'object') {
        // Try to access rawValue directly (Cadence enum format)
        try {
          if (freshCircleData.status.rawValue !== undefined && freshCircleData.status.rawValue !== null) {
            freshStatus = Number(freshCircleData.status.rawValue)
            console.log('✅ Extracted status from rawValue:', freshStatus)
          }
        } catch (e) {
          console.error('Error accessing rawValue:', e)
        }
      } else if (typeof freshCircleData.status === 'string') {
        const statusMap = { 'Forming': 0, 'Active': 1, 'Completed': 2, 'Cancelled': 3 }
        freshStatus = statusMap[freshCircleData.status] ?? null
        console.log('✅ Status mapped from string:', freshStatus)
      }

      // If status extraction failed, log detailed error
      if (freshStatus === null || freshStatus === undefined || isNaN(freshStatus)) {
        console.error('❌ Failed to extract status from blockchain data:', {
          statusData: freshCircleData.status,
          statusType: typeof freshCircleData.status,
          freshStatus,
          fullData: freshCircleData
        })
        alert(`Error: Could not determine circle status from blockchain.\n\nStatus data: ${JSON.stringify(freshCircleData.status)}\n\nPlease check the console and try refreshing.`)
        return
      }

      const freshIsFull = freshMemberCount >= freshNumberOfMembers

      console.log('📊 Fresh blockchain data:', {
        circleId: circle.id,
        memberCount: freshMemberCount,
        numberOfMembers: freshNumberOfMembers,
        statusRaw: freshCircleData.status,
        statusExtracted: freshStatus,
        statusLabel: getStatusLabel(freshStatus),
        isFull: freshIsFull
      })

      // TEMPORARY DEBUG - Show alert with fresh data
      alert(`DEBUG: Fresh Blockchain Data

Circle ID: ${circle.id}
Members: ${freshMemberCount}/${freshNumberOfMembers}
Status: ${freshStatus} (${getStatusLabel(freshStatus)})
Is Full: ${freshIsFull}

Click OK to continue joining...`)

      // Calculate total FLOW needed
      const totalRequired = circle.contributionAmount * circle.numberOfMembers

      console.log(`💰 Joining circle ${circle.id}...`)
      console.log(`💵 Total FLOW required: ${totalRequired} FLOW (${circle.contributionAmount} x ${circle.numberOfMembers} cycles)`)

      // PRE-FLIGHT CHECK: Verify user has enough balance
      console.log('🔍 Checking wallet balance...')
      const account = await fcl.account(addr)
      const balance = parseFloat(account.balance)
      console.log(`💰 Current balance: ${balance} FLOW`)
      console.log(`💵 Required: ${totalRequired} FLOW`)

      if (balance < totalRequired) {
        const shortfall = totalRequired - balance
        alert(`Insufficient FLOW balance!\n\nYou have: ${balance} FLOW\nYou need: ${totalRequired} FLOW\nShortfall: ${shortfall.toFixed(2)} FLOW\n\nPlease add more FLOW to your wallet and try again.`)
        return
      }

      console.log('✅ Balance check passed!')

      // PRE-FLIGHT CHECK: Verify circle status with FRESH data
      console.log('🔍 Checking circle status (FRESH DATA)...')
      console.log(`   Status: ${freshStatus} (${getStatusLabel(freshStatus)})`)
      console.log(`   Members: ${freshMemberCount}/${freshNumberOfMembers}`)
      console.log(`   Is Full: ${freshIsFull}`)

      if (freshStatus !== 0) {
        alert(`Cannot join circle: Circle status is "${getStatusLabel(freshStatus)}".\n\nOnly circles with "Forming" status can accept new members.`)
        return
      }

      if (freshIsFull) {
        alert(`Cannot join circle: Circle is already full.\n\nCurrent members: ${freshMemberCount}\nTotal slots: ${freshNumberOfMembers}\n\nThe circle has reached its maximum capacity.`)
        return
      }

      console.log('✅ Pre-flight checks passed with FRESH blockchain data!')

      // Set flag to track transaction in progress (in both window and localStorage)
      window.txInProgress = true
      localStorage.setItem('txInProgress', 'true')
      localStorage.setItem('txFlagTime', Date.now().toString())
      console.log('🚩 Transaction flag set at', new Date().toISOString())

      // Add timeout warning
      const timeoutWarning = setTimeout(() => {
        console.warn('⚠️ Transaction is taking longer than expected...')
        console.warn('⚠️ Check your wallet for a popup to approve the transaction')
        console.warn('⚠️ If wallet is disconnecting, this might be a wallet compatibility issue')
      }, 5000)

      const result = await joinCircle(circle.id)
      clearTimeout(timeoutWarning)

      // Clear transaction flags
      window.txInProgress = false
      localStorage.removeItem('txInProgress')
      localStorage.removeItem('txFlagTime')
      console.log('🚩 Transaction flag cleared - success')

      console.log('✅ Join successful at:', new Date().toISOString())
      alert('Successfully joined circle! Redirecting to dashboard...')

      // Navigate back to dashboard instead of reloading
      // This prevents the wallet disconnect issue
      onNavigate('dashboard')
    } catch (err) {
      // Clear transaction flags
      window.txInProgress = false
      localStorage.removeItem('txInProgress')
      localStorage.removeItem('txFlagTime')
      console.log('🚩 Transaction flag cleared - error')

      console.error('❌ Join error:', err)
      console.error('❌ Full error object:', JSON.stringify(err, null, 2))

      // Show user-friendly error message
      let errorMsg = err.message
      const originalError = errorMsg // Keep original for debugging

      if (errorMsg.includes('insufficient balance') || errorMsg.includes('Insufficient balance')) {
        const totalRequired = circle.contributionAmount * circle.numberOfMembers
        errorMsg = `You need at least ${totalRequired} FLOW in your wallet to join this circle. Each member must have enough to cover all ${circle.numberOfMembers} cycles upfront.`
      } else if (errorMsg.includes('user rejected') || errorMsg.includes('User rejected')) {
        errorMsg = 'Transaction was cancelled. Please approve the transaction in your wallet to join the circle.'
      } else if (errorMsg.includes('Circle is full') || errorMsg.includes('circle is full')) {
        // IMPORTANT: Show the actual error, not a generic message
        errorMsg = `Transaction failed with "full" error.\n\nActual error: ${originalError}\n\nBlockchain shows ${freshMemberCount}/${freshNumberOfMembers} members.\n\nThis might be a different error being misinterpreted.`
      }

      alert('Failed to join circle: ' + errorMsg)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-flow-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 glass-effect">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{getCircleDisplayName(circle.id)}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{circle.memberCount} / {circle.numberOfMembers} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {circle.cycleDuration < 3600
                      ? `${Math.round(circle.cycleDuration / 60)} min`
                      : circle.cycleDuration < 86400
                      ? `${Math.round(circle.cycleDuration / 3600)} hr`
                      : `${Math.round(circle.cycleDuration / 86400)} day`
                    } cycles
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl border font-medium flex items-center gap-2 ${
                circle.status === 0
                  ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                  : circle.status === 1
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : circle.status === 2
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                  : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
              }`}>
                {circle.status === 0 && <Clock className="w-4 h-4" />}
                {circle.status === 1 && <Zap className="w-4 h-4" />}
                {circle.status === 2 && <CheckCircle2 className="w-4 h-4" />}
                {getStatusLabel(circle.status)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="glass-effect rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Circle Progress</div>
                <div className="text-2xl font-bold">
                  Cycle {circle.currentCycle} of {circle.numberOfMembers}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Completion</div>
                <div className="text-2xl font-bold text-primary-400">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-flow-500 to-primary-600"
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-sm text-gray-400">
              <span>Creator: {circle.creator.slice(0, 6)}...{circle.creator.slice(-4)}</span>
              <span>{circle.numberOfMembers - circle.currentCycle} cycles remaining</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-effect rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-400 mb-2">Contribution</div>
                <div className="text-2xl font-bold">{circle.contributionAmount}</div>
                <div className="text-sm text-gray-500">FLOW</div>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-400 mb-2">Total Pool</div>
                <div className="text-2xl font-bold">{totalPool.toFixed(2)}</div>
                <div className="text-sm text-gray-500">FLOW</div>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-400 mb-2">Your Role</div>
                <div className="text-2xl font-bold">
                  {isCreator ? 'Creator' : 'Visitor'}
                </div>
                <div className="text-sm text-gray-500">{isCreator ? 'You created this' : 'Not joined'}</div>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-400 mb-2">Cycle Duration</div>
                <div className="text-2xl font-bold">
                  {circle.cycleDuration < 3600
                    ? Math.round(circle.cycleDuration / 60)
                    : circle.cycleDuration < 86400
                    ? Math.round(circle.cycleDuration / 3600)
                    : Math.round(circle.cycleDuration / 86400)
                  }
                </div>
                <div className="text-sm text-gray-500">
                  {circle.cycleDuration < 3600
                    ? 'minutes'
                    : circle.cycleDuration < 86400
                    ? 'hours'
                    : 'days'
                  }
                </div>
              </div>
            </div>

            {/* Circle Information */}
            <div className="glass-effect rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Circle Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary-400" />
                    <span className="text-gray-400">Member Count</span>
                  </div>
                  <span className="font-semibold">{circle.memberCount} / {circle.numberOfMembers}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-primary-400" />
                    <span className="text-gray-400">Vault Balance</span>
                  </div>
                  <span className="font-semibold">{circle.vaultBalance.toFixed(2)} FLOW</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary-400" />
                    <span className="text-gray-400">Status</span>
                  </div>
                  <span className="font-semibold">{getStatusLabel(circle.status)}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Circle className="w-5 h-5 text-primary-400" />
                    <span className="text-gray-400">Current Cycle</span>
                  </div>
                  <span className="font-semibold">{circle.currentCycle}</span>
                </div>

                {circle.status === 1 && (isCreator || isMember) && (() => {
                  console.log('🕒 Circle timing data:', {
                    status: circle.status,
                    startedAt: circle.startedAt,
                    cycleDuration: circle.cycleDuration,
                    startedAtDate: circle.startedAt ? new Date(circle.startedAt * 1000) : 'NOT SET'
                  })

                  return (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30">
                      <div className="flex items-center gap-2 text-green-400 mb-3">
                        <Zap className="w-5 h-5" />
                        <span className="font-semibold">Circle is Active!</span>
                      </div>

                      {circle.startedAt ? (() => {
                        const startTime = new Date(circle.startedAt * 1000)
                        const cycleDurationMs = circle.cycleDuration * 1000
                        const firstPullTime = new Date(startTime.getTime() + cycleDurationMs)
                        const secondPullTime = new Date(startTime.getTime() + (2 * cycleDurationMs))
                        const now = new Date()

                        const secondsUntilFirst = Math.max(0, Math.round((firstPullTime - now) / 1000))
                        const secondsUntilSecond = Math.max(0, Math.round((secondPullTime - now) / 1000))

                        // Format time remaining based on duration
                        const formatTimeRemaining = (seconds) => {
                          if (seconds < 60) return `${seconds} sec`
                          if (seconds < 3600) return `${Math.round(seconds / 60)} min`
                          if (seconds < 86400) return `${Math.round(seconds / 3600 * 10) / 10} hrs`
                          return `${Math.round(seconds / 86400 * 10) / 10} days`
                        }

                        const timeUntilFirst = formatTimeRemaining(secondsUntilFirst)
                        const timeUntilSecond = formatTimeRemaining(secondsUntilSecond)

                        return (
                          <div className="mb-4 p-4 rounded-lg bg-black/40 border border-green-500/20 space-y-2">
                            <div className="text-sm">
                              <div className="text-gray-300 font-semibold mb-1">⏰ Automated Schedule</div>
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <div>
                                <span className="text-green-400 font-semibold">Started:</span> {startTime.toLocaleString()}
                              </div>
                              <div className={now < firstPullTime ? 'text-yellow-300' : 'text-gray-500'}>
                                <span className="text-blue-400 font-semibold">Cycle 1 Pull:</span> {firstPullTime.toLocaleString()}
                                {now < firstPullTime && (
                                  <span className="ml-2 font-bold">
                                    (in {timeUntilFirst})
                                  </span>
                                )}
                                {now >= firstPullTime && <span className="ml-2 text-green-400">✓ Should have executed</span>}
                              </div>
                              <div className={now < secondPullTime ? 'text-yellow-300' : 'text-gray-500'}>
                                <span className="text-purple-400 font-semibold">Cycle 2 Pull:</span> {secondPullTime.toLocaleString()}
                                {now < secondPullTime && (
                                  <span className="ml-2 font-bold">
                                    (in {timeUntilSecond})
                                  </span>
                                )}
                                {now >= secondPullTime && <span className="ml-2 text-green-400">✓ Should have executed</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })() : (
                        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-300">
                          ⚠️ Circle is active but startedAt timestamp is missing. Check blockchain data.
                        </div>
                      )}

                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="text-blue-400 font-semibold mb-1">Fully Automated</div>
                          <p className="text-gray-300 text-xs leading-relaxed">
                            Flow Transaction Scheduler was automatically set up when the last member joined.
                            The blockchain will automatically pull contributions and distribute payouts at the scheduled times.
                            No further action needed!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )})()}

                {isFull && circle.status === 0 && (
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="text-yellow-400 font-semibold mb-1">Circle Full - Starting Soon!</div>
                        <p className="text-gray-300 text-xs leading-relaxed">
                          When the last member joins, the circle will automatically become Active and
                          Flow Transaction Scheduler will be set up to handle all contributions and payouts automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!isFull && circle.status === 0 && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                      <Users className="w-4 h-4" />
                      <span>Waiting for {circle.numberOfMembers - circle.memberCount} more member(s) to join</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Details */}
          <div className="space-y-6">
            {/* Your Status or Join Button */}
            <div className="glass-effect rounded-2xl p-6 border border-white/10">
              {isCreator ? (
                <>
                  <h3 className="text-lg font-bold mb-4">Creator Status</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-flow-500/20 to-primary-600/20 border border-primary-500/30">
                      <div className="flex items-center gap-2 text-primary-400 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">You created this circle</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Share this circle with friends to fill up the member slots.
                      </p>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Expected Payout</div>
                      <div className="text-2xl font-bold text-primary-400">{totalPool.toFixed(2)} FLOW</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Status</div>
                      <div className="text-lg font-semibold">{getStatusLabel(circle.status)}</div>
                    </div>
                  </div>
                </>
              ) : isMember ? (
                <>
                  <h3 className="text-lg font-bold mb-4">Member Status</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">You are a member!</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        You successfully joined this circle.
                      </p>
                    </div>

                    {memberInfo && (
                      <>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Your Position</div>
                          <div className="text-2xl font-bold text-green-400">#{memberInfo.position + 1}</div>
                          <div className="text-xs text-gray-500">You'll receive payout in cycle {memberInfo.position + 1}</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-400 mb-1">Approved Amount</div>
                          <div className="text-lg font-semibold">{memberInfo.approvedAmount} FLOW</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-400 mb-1">Cycles Paid</div>
                          <div className="text-lg font-semibold">{memberInfo.cyclesPaid} of {circle.numberOfMembers}</div>
                        </div>

                        {memberInfo.hasReceivedPayout && (
                          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>You have received your payout!</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-4">Join Circle</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    You are not a member of this circle yet. Join to participate in the savings rotation.
                  </p>

                  {/* Required FLOW Info */}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-4">
                    <div className="text-sm text-blue-400 mb-2 font-medium">Required Balance</div>
                    <div className="text-2xl font-bold text-blue-300 mb-1">{totalPool.toFixed(2)} FLOW</div>
                    <div className="text-xs text-gray-400">
                      You need enough FLOW to cover all {circle.numberOfMembers} cycles upfront
                      ({circle.contributionAmount} FLOW × {circle.numberOfMembers} cycles)
                    </div>
                  </div>

                  {/* Debug info */}
                  <button
                    onClick={() => {
                      refetch()
                      alert(`Circle Debug Info:\n\nCircle ID: ${circle.id}\nMembers: ${circle.memberCount}/${circle.numberOfMembers}\nStatus: ${getStatusLabel(circle.status)}\nIs Full: ${isFull}\nYou are creator: ${isCreator}\nYou are member: ${isMember}\nCan Join: ${canJoin}\n\nRefreshing data...`)
                    }}
                    className="w-full py-2 mb-3 rounded-lg glass-effect border border-gray-500/30 text-gray-400 text-xs hover:border-gray-400 transition-all"
                  >
                    🔍 Debug Circle State
                  </button>

                  {canJoin ? (
                    <button
                      onClick={handleJoinCircle}
                      disabled={txLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {txLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <Users className="w-5 h-5" />
                          Join Circle
                        </>
                      )}
                    </button>
                  ) : isFull ? (
                    <div className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm">
                      Circle is full. No more members can join.
                    </div>
                  ) : circle.status !== 0 ? (
                    <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm">
                      Circle is {getStatusLabel(circle.status).toLowerCase()}. Cannot join now.
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Automation Info */}
            <div className="glass-effect rounded-2xl p-6 border border-primary-500/30 bg-gradient-flow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-flow-500 to-primary-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">Fully Automated</div>
                  <div className="text-xs text-gray-400">Flow Transaction Scheduler</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Auto contribution pulls</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Auto payout distribution</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>24/7 active monitoring</span>
                </div>
              </div>
            </div>

            {/* Contract Info */}
            <div className="glass-effect rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold mb-4">Contract Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Circle ID</div>
                  <div className="font-mono">{circle.id}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Contract Address</div>
                  <a
                    href={`https://testnet.flowscan.io/contract/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary-400 hover:underline flex items-center gap-2"
                  >
                    {CONTRACT_ADDRESS.slice(0, 10)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Network</div>
                  <div>Flow Testnet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
