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
  Share2
} from 'lucide-react'

export default function CircleDetails({ circle, onNavigate }) {
  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Circle not found</h2>
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

  const members = [
    { address: '0xa8965...d113', position: 1, contributed: circle.contributionAmount * circle.currentCycle, hasReceived: false },
    { address: '0xb7856...a224', position: 2, contributed: circle.contributionAmount * circle.currentCycle, hasReceived: false },
    { address: '0xc6745...f335', position: 3, contributed: circle.contributionAmount * circle.currentCycle, hasReceived: false },
    { address: '0xd5634...e446', position: 4, contributed: circle.contributionAmount * circle.currentCycle, hasReceived: false },
    { address: '0xe4523...b557', position: 5, contributed: circle.contributionAmount * circle.currentCycle, hasReceived: false },
  ].slice(0, circle.members)

  const totalContributed = members.reduce((sum, m) => sum + m.contributed, 0)
  const progress = (circle.currentCycle / circle.members) * 100

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
              <h1 className="text-4xl font-bold mb-2">{circle.name}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{circle.members} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{circle.cycleDuration} cycles</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-3 rounded-xl glass-effect border border-white/10 hover:border-primary-500/50 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
              <div className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {circle.status}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="glass-effect rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Circle Progress</div>
                <div className="text-2xl font-bold">
                  Cycle {circle.currentCycle} of {circle.members}
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
              <span>Started {circle.currentCycle} cycles ago</span>
              <span>{circle.members - circle.currentCycle} cycles remaining</span>
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
                <div className="text-2xl font-bold">{circle.totalPool}</div>
                <div className="text-sm text-gray-500">FLOW</div>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-400 mb-2">Your Position</div>
                <div className="text-2xl font-bold">#{circle.yourPosition}</div>
                <div className="text-sm text-gray-500">in queue</div>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-400 mb-2">Next Payout</div>
                <div className="text-2xl font-bold">{circle.nextPayout}</div>
                <div className="text-sm text-gray-500">remaining</div>
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
                          Contributed: {member.contributed} FLOW
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
            {/* Your Status */}
            <div className="glass-effect rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold mb-4">Your Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Position in Queue</div>
                  <div className="text-2xl font-bold">#{circle.yourPosition}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Contributed</div>
                  <div className="text-2xl font-bold">{circle.contributionAmount * circle.currentCycle} FLOW</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Expected Payout</div>
                  <div className="text-2xl font-bold text-primary-400">{circle.totalPool} FLOW</div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="text-sm text-gray-400 mb-2">Payout Status</div>
                  {circle.hasReceived ? (
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
                  <button className="font-mono text-primary-400 hover:underline flex items-center gap-2">
                    0xa8965...d113
                    <ExternalLink className="w-3 h-3" />
                  </button>
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
