import { motion } from 'framer-motion'
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
import { useCircleInfo } from '../hooks/useCircles'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../hooks/useAuth'
import { CONTRACT_ADDRESS } from '../config/flow'

export default function CircleDetails({ circle: initialCircle, onNavigate }) {
  const { addr } = useAuth()
  const { joinCircle, isLoading: txLoading } = useTransactions()

  // Use the hook to get real-time data if we have a circle ID
  const { circle: liveCircle, isLoading, error } = useCircleInfo(initialCircle?.id)

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

  // Transform blockchain members data
  const members = (circle.members || []).map((address, i) => ({
    address: `${address.slice(0, 6)}...${address.slice(-4)}`,
    fullAddress: address,
    position: i + 1,
    contributed: circle.contributionAmount * circle.currentCycle,
    hasReceived: i < circle.currentCycle,
  }))

  const isUserMember = addr && circle.members?.includes(addr)
  const userPosition = isUserMember ? circle.members.indexOf(addr) + 1 : null
  const totalPool = circle.contributionAmount * circle.numberOfMembers
  const progress = (circle.currentCycle / circle.numberOfMembers) * 100

  const handleJoinCircle = async () => {
    try {
      await joinCircle(circle.id)
      alert('Successfully joined circle!')
      // Refresh the page or refetch data
      window.location.reload()
    } catch (err) {
      alert('Failed to join circle: ' + err.message)
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
              <h1 className="text-4xl font-bold mb-2">Circle #{circle.id}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{members.length} / {circle.numberOfMembers} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{Math.round(circle.cycleDuration / 86400)} day cycles</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-3 rounded-xl glass-effect border border-white/10 hover:border-primary-500/50 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
              <div className={`px-4 py-2 rounded-xl ${
                circle.isActive
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
              } font-medium flex items-center gap-2`}>
                <Zap className="w-4 h-4" />
                {circle.isActive ? 'Active' : 'Completed'}
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
                <div className="text-sm text-gray-400 mb-2">Your Position</div>
                <div className="text-2xl font-bold">
                  {isUserMember ? `#${userPosition}` : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">in queue</div>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-400 mb-2">Cycle Duration</div>
                <div className="text-2xl font-bold">{Math.round(circle.cycleDuration / 86400)}</div>
                <div className="text-sm text-gray-500">days</div>
              </div>
            </div>

            {/* Members List */}
            <div className="glass-effect rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Members ({members.length})</h3>
              <div className="space-y-3">
                {members.map((member, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        i < circle.currentCycle
                          ? 'bg-gradient-to-r from-flow-500 to-primary-600 text-white'
                          : 'bg-white/10 text-gray-400'
                      }`}>
                        {member.position}
                      </div>
                      <div>
                        <div className="font-mono font-medium">{member.address}</div>
                        <div className="text-sm text-gray-400">
                          Contributed: {member.contributed.toFixed(2)} FLOW
                        </div>
                      </div>
                    </div>

                    <div>
                      {i < circle.currentCycle ? (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Received
                        </div>
                      ) : i === circle.currentCycle ? (
                        <div className="flex items-center gap-2 text-primary-400 text-sm">
                          <Zap className="w-4 h-4" />
                          Next
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Clock className="w-4 h-4" />
                          Waiting
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="glass-effect rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                {[
                  { event: "Payout distributed", recipient: "Member #2", amount: "500 FLOW", time: "2 days ago", icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
                  { event: "Contributions pulled", count: "5 members", amount: "500 FLOW", time: "2 days ago", icon: <DollarSign className="w-4 h-4 text-blue-400" /> },
                  { event: "Payout distributed", recipient: "Member #1", amount: "500 FLOW", time: "9 days ago", icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
                  { event: "Circle started", count: "5 members joined", amount: "", time: "9 days ago", icon: <CheckCircle2 className="w-4 h-4 text-purple-400" /> },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{activity.event}</div>
                      <div className="text-sm text-gray-400">
                        {activity.recipient || activity.count}
                        {activity.amount && ` • ${activity.amount}`}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Details */}
          <div className="space-y-6">
            {/* Your Status or Join Button */}
            <div className="glass-effect rounded-2xl p-6 border border-white/10">
              {isUserMember ? (
                <>
                  <h3 className="text-lg font-bold mb-4">Your Status</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Position in Queue</div>
                      <div className="text-2xl font-bold">#{userPosition}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Total Contributed</div>
                      <div className="text-2xl font-bold">{(circle.contributionAmount * circle.currentCycle).toFixed(2)} FLOW</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Expected Payout</div>
                      <div className="text-2xl font-bold text-primary-400">{totalPool.toFixed(2)} FLOW</div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="text-sm text-gray-400 mb-2">Payout Status</div>
                      {userPosition && userPosition <= circle.currentCycle ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Received</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-4">Join Circle</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    You are not a member of this circle yet. Join to participate in the savings rotation.
                  </p>
                  {members.length < circle.numberOfMembers ? (
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
                  ) : (
                    <div className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm">
                      Circle is full. No more members can join.
                    </div>
                  )}
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

            {/* Actions */}
            <div className="space-y-3">
              <button className="w-full py-3 rounded-xl glass-effect border border-white/10 hover:border-primary-500/50 transition-all flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Circle
              </button>
              <button className="w-full py-3 rounded-xl glass-effect border border-white/10 hover:border-primary-500/50 transition-all flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View on Explorer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
