import { motion } from 'framer-motion'
import {
  Coins,
  Users,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react'

export default function LandingPage({ onNavigate }) {
  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community Savings",
      description: "Join trusted savings circles with friends and community members"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Automated Pulls",
      description: "Flow Transaction Scheduler handles everything automatically"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Trustless Security",
      description: "Smart contracts eliminate the need for trust - code is law"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Flexible Cycles",
      description: "Choose daily, weekly, or monthly contribution cycles"
    }
  ]

  const stats = [
    { value: "100%", label: "Automated" },
    { value: "0", label: "Manual Triggers" },
    { value: "∞", label: "Scalability" },
    { value: "24/7", label: "Active" }
  ]

  const howItWorks = [
    {
      step: "1",
      title: "Create or Join",
      description: "Start a new savings circle or join an existing one",
      icon: <Users className="w-5 h-5" />
    },
    {
      step: "2",
      title: "Approve Funds",
      description: "Approve total contribution amount upfront via vault capability",
      icon: <Shield className="w-5 h-5" />
    },
    {
      step: "3",
      title: "Relax & Earn",
      description: "Sit back while the scheduler automatically pulls and distributes",
      icon: <Sparkles className="w-5 h-5" />
    }
  ]

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-flow-500/20 via-primary-500/10 to-transparent blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary-500/20 via-flow-500/10 to-transparent blur-3xl animate-pulse-slow" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 glass-effect">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-flow-500 to-primary-600 flex items-center justify-center glow-effect">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">EsusuChain</span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300"
          >
            Launch App
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-6 border border-primary-500/30">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300">Powered by Flow Transaction Scheduler</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Traditional{' '}
            <span className="text-gradient">Savings</span>
            <br />
            Reimagined for{' '}
            <span className="text-gradient">Web3</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Join automated savings circles (ROSCAs) on Flow blockchain.
            No manual triggers, no intermediaries, just pure blockchain automation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => onNavigate('dashboard')}
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="px-8 py-4 rounded-xl glass-effect text-white font-semibold text-lg border border-white/10 hover:border-primary-500/50 transition-all duration-300"
            >
              View Demo
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat, i) => (
              <div key={i} className="glass-effect rounded-2xl p-6 border border-white/10 hover:border-primary-500/30 transition-colors">
                <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why <span className="text-gradient">EsusuChain</span>?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Built on Flow blockchain with cutting-edge automation technology
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="glass-effect rounded-2xl p-6 border border-white/10 hover:border-primary-500/30 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-flow-500/20 to-primary-600/20 flex items-center justify-center mb-4 text-primary-400">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {howItWorks.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connection Line */}
              {i < howItWorks.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent -z-10" />
              )}

              <div className="glass-effect rounded-2xl p-8 border border-white/10 hover:border-primary-500/30 transition-all h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-flow-500 to-primary-600 flex items-center justify-center mb-6 glow-effect">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-primary-400">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                </div>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="glass-effect rounded-3xl p-12 border border-white/10 text-center bg-gradient-flow"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Start <span className="text-gradient">Saving</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join the future of community savings on Flow blockchain
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="group px-10 py-5 rounded-xl bg-gradient-to-r from-flow-500 to-primary-600 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 inline-flex items-center gap-2"
          >
            Launch EsusuChain
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 glass-effect">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-flow-500 to-primary-600 flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold">EsusuChain</span>
            </div>
            <div className="text-gray-400 text-sm">
              Built on Flow • Powered by Transaction Scheduler
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
