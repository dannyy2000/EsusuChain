import EsusuChain from 0xa89655a0f8e3d113

/// Pull contributions and distribute payout for a circle
transaction(circleId: UInt64) {
    execute {
        // Pull contributions from all members and distribute payout
        EsusuChain.scheduledPullContributions(circleId: circleId)
        log("Contributions pulled and payout distributed!")
    }
}
