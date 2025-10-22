import { motion } from 'framer-motion'
import {
  Coins,
  Plus,
  Users,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle2,
  Circle,
  XCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Wallet,
  LogOut,
  Loader2
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAllCircles } from '../hooks/useCircles'
import { useTransactions } from '../hooks/useTransactions'

export default function Dashboard({ onNavigate, onSelectCircle }) {
  const { user, loggedIn, addr, isLoading: authLoading, logIn, logOut } = useAuth()
  const { circles, isLoading: circlesLoading, error: circlesError, refetch } = useAllCircles()
  const { setupCircleManager, isLoading: txLoading } = useTransactions()

  // If not logged in, show auth UI
  if (!authLoading && !loggedIn) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-flow-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 border-b border-white/10 glass-effect">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-flow-500 to-primary-600 flex items-center justify-center glow-effect">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">EsusuChain</span>
            </div>
          </div>
        </nav>

        {/* Auth Prompt */}
        <div className="relative z-10 max-w-md mx-auto px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-2xl p-8 border border-white/10"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-flow-500 to-primary-600 flex items-center justify-center mx-auto mb-6 glow-effect">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">
              Connect your Flow wallet to access the dashboard and manage your savings circles.
            </p>
            <button
              onClick={logIn}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all"
            >
              Connect Wallet
            </button>
            <button
              onClick={() => onNavigate('landing')}
              className="w-full mt-3 px-6 py-3 rounded-xl glass-effect border border-white/10 hover:border-primary-500/50 transition-all"
            >
              Back to Home
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Handle initial setup
  const handleSetup = async () => {
    try {
      await setupCircleManager()
      alert('CircleManager setup complete! You can now create circles.')
      refetch()
    } catch (error) {
      alert('Setup failed: ' + error.message)
    }
  }

  // Mock data for demo purposes (will be replaced with real data)
  const mockCircles = [
    {
      id: 0,
      name: "Family Savings Circle",
      members: 5,
      contributionAmount: 100,
      cycleDuration: "30 days",
      currentCycle: 2,
      status: "Active",
      nextPayout: "5 days",
      totalPool: 500,
      yourPosition: 3,
      hasReceived: false
    },
    {
      id: 1,
      name: "Friends Investment Pool",
      members: 3,
      contributionAmount: 50,
      cycleDuration: "7 days",
      currentCycle: 1,
      status: "Active",
      nextPayout: "2 days",
      totalPool: 150,
      yourPosition: 1,
      hasReceived: false
    },
    {
      id: 2,
      name: "Community Growth Fund",
      members: 10,
      contributionAmount: 25,
      cycleDuration: "14 days",
      currentCycle: 5,
      status: "Active",
      nextPayout: "10 days",
      totalPool: 250,
      yourPosition: 7,
      hasReceived: false
    }
  ]

  const stats = [
    {
      label: "Total Saved",
      value: "1,250 FLOW",
      change: "+12%",
      icon: <DollarSign className="w-5 h-5" />,
      color: "from-green-500 to-emerald-600"
    },
    {
      label: "Active Circles",
      value: "3",
      change: "+1",
      icon: <Circle className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-600"
    },
    {
      label: "Next Payout",
      value: "2 days",
      change: "Friends Pool",
      icon: <Clock className="w-5 h-5" />,
      color: "from-purple-500 to-pink-600"
    },
    {
      label: "Total Members",
      value: "18",
      change: "Across circles",
      icon: <Users className="w-5 h-5" />,
      color: "from-orange-500 to-red-600"
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'Forming':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'Completed':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active':
        return <Zap className="w-4 h-4" />
      case 'Forming':
        return <Clock className="w-4 h-4" />
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return <Circle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-flow-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 glass-effect">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-flow-500 to-primary-600 flex items-center justify-center glow-effect">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">EsusuChain</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-lg glass-effect text-sm border border-white/10">
              {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Not connected'}
            </div>
            <button
              onClick={logOut}
              className="px-4 py-2 rounded-lg glass-effect text-sm border border-white/10 hover:border-red-500/50 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-gray-400">
              Manage your savings circles and track your progress
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('create')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-primary-500/50 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Circle
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-effect rounded-2xl p-6 border border-white/10 hover:border-primary-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
                <span className="text-xs text-green-400 font-medium">{stat.change}</span>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Loading/Error States */}
        {circlesLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            <span className="ml-3 text-gray-400">Loading circles...</span>
          </div>
        )}

        {circlesError && (
          <div className="glass-effect rounded-2xl p-6 border border-red-500/30 mb-8">
            <p className="text-red-400">Error loading circles: {circlesError}</p>
            <button onClick={refetch} className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Setup Prompt */}
        {!circlesLoading && circles.length === 0 && (
          <div className="glass-effect rounded-2xl p-8 border border-white/10 mb-8 text-center">
            <h3 className="text-xl font-semibold mb-4">No circles found</h3>
            <p className="text-gray-400 mb-6">
              {circlesError ? 'There was an error loading circles. You may need to setup your account first.' : 'Get started by creating your first savings circle or setting up your account.'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSetup}
                disabled={txLoading}
                className="px-6 py-3 rounded-xl glass-effect border border-primary-500/50 hover:bg-primary-500/10 transition-all flex items-center gap-2"
              >
                {txLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Setup Account'}
              </button>
              <button
                onClick={() => onNavigate('create')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all"
              >
                Create Circle
              </button>
            </div>
          </div>
        )}

        {/* Circles Grid */}
        {!circlesLoading && circles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Your Circles ({circles.length})</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {circles.map((circle, i) => (
              <motion.div
                key={circle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => {
                  onSelectCircle(circle)
                  onNavigate('details')
                }}
                className="glass-effect rounded-2xl p-6 border border-white/10 hover:border-primary-500/50 transition-all cursor-pointer group"
              >
                {/* Circle Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1 group-hover:text-primary-400 transition-colors">
                      Circle #{circle.id}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{circle.members?.length || 0} / {circle.numberOfMembers} members</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getStatusColor(circle.isActive ? 'Active' : 'Completed')}`}>
                    {getStatusIcon(circle.isActive ? 'Active' : 'Completed')}
                    {circle.isActive ? 'Active' : 'Completed'}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Contribution</span>
                    <span className="font-semibold">{circle.contributionAmount} FLOW</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Cycle Duration</span>
                    <span className="font-semibold">{Math.round(circle.cycleDuration / 86400)} days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Current Cycle</span>
                    <span className="font-semibold">{circle.currentCycle} of {circle.numberOfMembers}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Creator</span>
                    <span className="font-semibold">{circle.creator.slice(0, 6)}...{circle.creator.slice(-4)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{Math.round((circle.currentCycle / circle.numberOfMembers) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(circle.currentCycle / circle.numberOfMembers) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-flow-500 to-primary-600"
                    />
                  </div>
                </div>

                {/* View Details */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Click to view details</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
              ))}

              {/* Create New Circle Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mockCircles.length * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => onNavigate('create')}
              className="glass-effect rounded-2xl p-6 border border-dashed border-white/20 hover:border-primary-500/50 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-flow-500/20 to-primary-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                Create New Circle
              </h3>
              <p className="text-gray-400 text-sm text-center">
                Start a new savings circle with your community
              </p>
            </motion.div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {!circlesLoading && circles.length > 0 && (
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: "Contribution pulled", circle: "Family Savings Circle", amount: "100 FLOW", time: "2 hours ago", icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
              { action: "Payout received", circle: "Friends Investment Pool", amount: "150 FLOW", time: "1 day ago", icon: <CheckCircle2 className="w-4 h-4 text-blue-400" /> },
              { action: "Joined circle", circle: "Community Growth Fund", amount: "", time: "3 days ago", icon: <Users className="w-4 h-4 text-purple-400" /> },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    {activity.icon}
                  </div>
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-gray-400">{activity.circle}</div>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <div className="font-semibold text-primary-400">{activity.amount}</div>
                  )}
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
