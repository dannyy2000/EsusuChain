import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  DollarSign,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  Info,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { saveCircleName } from '../utils/circleNames'

export default function CreateCircle({ onNavigate }) {
  const { loggedIn } = useAuth()
  const { createCircle, isLoading, error, txId } = useTransactions()
  const [step, setStep] = useState(1)
  const [txStatus, setTxStatus] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    numberOfMembers: '',
    contributionAmount: '',
    cycleDuration: 'weekly',
    customDays: ''
  })

  // Redirect if not logged in
  if (!loggedIn) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const cycleDurations = [
    { value: '1min', label: '1 Minute', seconds: 60, isDemo: true },
    { value: '5min', label: '5 Minutes', seconds: 300, isDemo: true },
    { value: '10min', label: '10 Minutes', seconds: 600, isDemo: true },
    { value: 'daily', label: 'Daily', seconds: 86400 },
    { value: 'weekly', label: 'Weekly', seconds: 604800 },
    { value: 'biweekly', label: 'Bi-weekly', seconds: 1209600 },
    { value: 'monthly', label: 'Monthly', seconds: 2592000 },
    { value: 'custom', label: 'Custom', seconds: null }
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const getTotalPerMember = () => {
    const amount = parseFloat(formData.contributionAmount) || 0
    const members = parseInt(formData.numberOfMembers) || 0
    return (amount * members).toFixed(2)
  }

  const getDuration = () => {
    if (formData.cycleDuration === 'custom') {
      // Custom is in days, convert to seconds
      return (parseInt(formData.customDays) || 0) * 86400
    }
    const duration = cycleDurations.find(d => d.value === formData.cycleDuration)
    return duration?.seconds || 0
  }

  const getDurationDisplay = () => {
    const seconds = getDuration()
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minutes`
    } else if (seconds < 86400) {
      return `${Math.round(seconds / 3600)} hours`
    } else {
      return `${Math.round(seconds / 86400)} days`
    }
  }

  const getTotalDuration = () => {
    const members = parseInt(formData.numberOfMembers) || 0
    const seconds = getDuration()
    const totalSeconds = members * seconds
    // Return in most appropriate unit
    if (totalSeconds < 3600) {
      return `${Math.round(totalSeconds / 60)} minutes`
    } else if (totalSeconds < 86400) {
      return `${Math.round(totalSeconds / 3600)} hours`
    } else {
      return `${Math.round(totalSeconds / 86400)} days`
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-flow-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 glass-effect">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-6 border border-primary-500/30"
          >
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-300">Create New Circle</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Start a <span className="text-gradient">Savings Circle</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg"
          >
            Create an automated savings circle for your community
          </motion.p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step >= s
                  ? 'bg-gradient-to-r from-flow-500 to-primary-600 text-white glow-effect'
                  : 'bg-white/5 text-gray-500'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-20 h-1 rounded-full transition-all ${
                  step > s ? 'bg-gradient-to-r from-flow-500 to-primary-600' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-3xl p-8 border border-white/10"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Circle Details</h2>

              {/* Circle Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Circle Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Family Savings Circle"
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-white/10 focus:border-primary-500/50 outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Give your circle a memorable name to identify it easily
                </p>
              </div>

              {/* Number of Members */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Number of Members
                </label>
                <input
                  type="number"
                  name="numberOfMembers"
                  value={formData.numberOfMembers}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-white/10 focus:border-primary-500/50 outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-2">
                  The circle will run for {formData.numberOfMembers || '0'} cycles (one per member)
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.numberOfMembers || parseInt(formData.numberOfMembers) < 1}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/50 transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Financial Settings</h2>

              {/* Contribution Amount */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Contribution Amount (FLOW)
                </label>
                <input
                  type="number"
                  name="contributionAmount"
                  value={formData.contributionAmount}
                  onChange={handleChange}
                  placeholder="e.g., 100"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl glass-effect border border-white/10 focus:border-primary-500/50 outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Each member contributes this amount per cycle
                </p>
              </div>

              {/* Cycle Duration */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Cycle Duration
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {cycleDurations.map((duration) => (
                    <button
                      key={duration.value}
                      onClick={() => setFormData({ ...formData, cycleDuration: duration.value })}
                      className={`p-3 rounded-xl border transition-all ${
                        formData.cycleDuration === duration.value
                          ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="font-medium text-sm">{duration.label}</div>
                    </button>
                  ))}
                </div>

                {formData.cycleDuration === 'custom' && (
                  <input
                    type="number"
                    name="customDays"
                    value={formData.customDays}
                    onChange={handleChange}
                    placeholder="Enter number of days"
                    min="1"
                    className="w-full px-4 py-3 rounded-xl glass-effect border border-white/10 focus:border-primary-500/50 outline-none transition-colors"
                  />
                )}
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-gradient-flow border border-primary-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-primary-400" />
                  <span className="text-sm font-medium text-primary-400">Important</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total per member:</span>
                    <span className="font-semibold">{getTotalPerMember()} FLOW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payout amount:</span>
                    <span className="font-semibold text-primary-400">{getTotalPerMember()} FLOW</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-xl glass-effect border border-white/10 font-semibold hover:border-white/20 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.contributionAmount}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/50 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Review & Create</h2>

              {/* Summary */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-sm text-gray-400 mb-1">Circle Name</div>
                  <div className="font-semibold">{formData.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-sm text-gray-400 mb-1">Members</div>
                    <div className="font-semibold">{formData.numberOfMembers}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-sm text-gray-400 mb-1">Contribution</div>
                    <div className="font-semibold">{formData.contributionAmount} FLOW</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-sm text-gray-400 mb-1">Cycle Duration</div>
                    <div className="font-semibold">{getDurationDisplay()}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-sm text-gray-400 mb-1">Total Duration</div>
                    <div className="font-semibold">{getTotalDuration()}</div>
                  </div>
                </div>
              </div>

              {/* Automation Info */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-flow-500/20 via-primary-500/20 to-flow-600/20 border border-primary-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-flow-500 to-primary-600 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">Fully Automated</div>
                    <div className="text-sm text-gray-400">Powered by Flow Transaction Scheduler</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Automatic contribution pulls every cycle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Automated payout distribution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>No manual intervention required</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-xl glass-effect border border-white/10 font-semibold hover:border-white/20 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    try {
                      setTxStatus('creating')

                      // Validate contribution amount
                      const contribution = parseFloat(formData.contributionAmount)
                      if (!contribution || contribution <= 0) {
                        setTxStatus('error')
                        alert('Please enter a valid contribution amount greater than 0 FLOW')
                        return
                      }

                      const cycleDurationInSeconds = getDuration() // Already in seconds

                      console.log('Creating circle with params:', {
                        numberOfMembers: formData.numberOfMembers,
                        contributionAmount: contribution,
                        cycleDuration: cycleDurationInSeconds,
                        cycleDurationDisplay: getDurationDisplay(),
                        name: formData.name
                      })

                      const result = await createCircle(
                        parseInt(formData.numberOfMembers),
                        contribution,
                        cycleDurationInSeconds
                      )

                      console.log('Create circle result:', result)

                      // Save circle name to localStorage if we got a circle ID
                      if (result.circleId !== null && result.circleId !== undefined) {
                        saveCircleName(result.circleId, formData.name)
                        console.log(`✅ Saved circle name: "${formData.name}" for Circle #${result.circleId}`)
                      } else {
                        console.warn('⚠️ Circle created but circleId not found in response. Name not saved.')
                      }

                      setTxStatus('success')
                      setTimeout(() => {
                        onNavigate('dashboard')
                      }, 2000)
                    } catch (err) {
                      setTxStatus('error')
                      console.error('Failed to create circle:', err)
                      // Error is already user-friendly from the hook
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create Circle
                    </>
                  )}
                </button>
              </div>

              {/* Transaction Status */}
              {txStatus === 'creating' && (
                <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <div>
                    <div className="font-medium text-blue-400">Creating circle...</div>
                    <div className="text-sm text-gray-400">Please confirm the transaction in your wallet</div>
                  </div>
                </div>
              )}

              {txStatus === 'success' && (
                <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="font-medium text-green-400">Circle created successfully!</div>
                    <div className="text-sm text-gray-400">Redirecting to dashboard...</div>
                    {txId && (
                      <div className="text-xs text-gray-500 mt-1">TX: {txId.slice(0, 10)}...</div>
                    )}
                  </div>
                </div>
              )}

              {txStatus === 'error' && error && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="font-medium text-red-400">Failed to create circle</div>
                    <div className="text-sm text-gray-400">{error}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
