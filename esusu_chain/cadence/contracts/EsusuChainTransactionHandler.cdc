import "FlowTransactionScheduler"
import "EsusuChain"

/// Transaction Handler for automated contribution pulls in EsusuChain circles
/// This contract implements the TransactionHandler interface required by Flow Transaction Scheduler
access(all) contract EsusuChainTransactionHandler {

    /// Handler resource that executes contribution pulls
    access(all) resource Handler: FlowTransactionScheduler.TransactionHandler {
        access(all) let circleId: UInt64
        access(all) let cycleDuration: UFix64
        access(all) var executionCount: UInt64

        init(circleId: UInt64, cycleDuration: UFix64) {
            self.circleId = circleId
            self.cycleDuration = cycleDuration
            self.executionCount = 0
        }

        /// Called by the scheduler to execute the transaction
        /// This is the correct signature that matches testnet!
        access(FlowTransactionScheduler.Execute)
        fun executeTransaction(id: UInt64, data: AnyStruct?) {
            // Check if circle can pull contributions
            if !EsusuChain.canPullContributions(circleId: self.circleId) {
                log("Circle ".concat(self.circleId.toString()).concat(" not ready for contribution pull"))
                return
            }

            // Get circle info to check if completed
            let circleInfo = EsusuChain.getCircleInfo(circleId: self.circleId)
            if circleInfo == nil {
                log("Circle ".concat(self.circleId.toString()).concat(" does not exist"))
                return
            }

            let status = circleInfo!["status"] as! EsusuChain.CircleStatus
            if status == EsusuChain.CircleStatus.Completed || status == EsusuChain.CircleStatus.Cancelled {
                log("Circle ".concat(self.circleId.toString()).concat(" is completed/cancelled, stopping"))
                return
            }

            // Pull contributions and distribute payout
            EsusuChain.scheduledPullContributions(circleId: self.circleId)

            self.executionCount = self.executionCount + 1
            log("Executed contribution pull #".concat(self.executionCount.toString())
                .concat(" for circle ").concat(self.circleId.toString())
                .concat(" (txId: ").concat(id.toString()).concat(")"))
        }

        /// Required by TransactionHandler interface
        access(all) view fun getViews(): [Type] {
            return [Type<StoragePath>(), Type<PublicPath>()]
        }

        /// Required by TransactionHandler interface
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<StoragePath>():
                    return /storage/EsusuChainHandler
                case Type<PublicPath>():
                    return /public/EsusuChainHandler
                default:
                    return nil
            }
        }
    }

    /// Create a new transaction handler for a circle
    access(all) fun createHandler(circleId: UInt64, cycleDuration: UFix64): @Handler {
        return <- create Handler(circleId: circleId, cycleDuration: cycleDuration)
    }

    init() {}
}
