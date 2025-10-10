import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "EsusuChain"
import "EsusuChainTransactionHandler"
import "FlowToken"
import "FungibleToken"

/// Schedule automated contribution pulls for a circle using Flow Transaction Scheduler
/// Based on the working RecurringDeposit pattern
///
/// This transaction:
/// 1. Creates a handler for the circle
/// 2. Schedules pulls for each cycle automatically
/// 3. Flow blockchain executes them at the scheduled times
///
/// Parameters:
/// - circleId: The circle to automate
transaction(circleId: UInt64) {
    prepare(signer: auth(Storage, Capabilities) &Account) {

        // Get circle info
        let circleInfo = EsusuChain.getCircleInfo(circleId: circleId)
            ?? panic("Circle does not exist")

        let cycleDuration = circleInfo["cycleDuration"] as! UFix64
        let numberOfMembers = circleInfo["numberOfMembers"] as! UInt64
        let status = circleInfo["status"] as! EsusuChain.CircleStatus

        // Verify circle is active
        assert(status == EsusuChain.CircleStatus.Active, message: "Circle must be active")

        log("Setting up automated pulls for circle ".concat(circleId.toString()))
        log("  Cycle duration: ".concat(cycleDuration.toString()).concat(" seconds"))
        log("  Number of cycles: ".concat(numberOfMembers.toString()))

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
            auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}
        >(handlerPath)

        log("Handler created and saved")

        // Ensure scheduler manager exists
        if signer.storage.borrow<&AnyResource>(from: FlowTransactionSchedulerUtils.managerStoragePath) == nil {
            let manager <- FlowTransactionSchedulerUtils.createManager()
            signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)

            let managerCapPublic = signer.capabilities.storage.issue<&{FlowTransactionSchedulerUtils.Manager}>(
                FlowTransactionSchedulerUtils.managerStoragePath
            )
            signer.capabilities.publish(managerCapPublic, at: FlowTransactionSchedulerUtils.managerPublicPath)

            log("Scheduler manager created")
        }

        // Borrow manager
        let manager = signer.storage.borrow<
            auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}
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

            log("Scheduled pull #".concat((cycleNumber + 1).toString())
                .concat(" at ").concat(executeAt.toString())
                .concat(" (txId: ").concat(txId.toString()).concat(")"))

            cycleNumber = cycleNumber + 1
        }

        log("✅ Successfully scheduled ".concat(numberOfMembers.toString())
            .concat(" automated contribution pulls!"))
        log("⏰ Flow blockchain will execute them automatically!")
    }
}
