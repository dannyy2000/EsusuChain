import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"

/// Initialize the Flow Transaction Scheduler Manager for an account
/// This must be done once before scheduling any transactions
transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {

        // Check if manager already exists
        if signer.storage.borrow<&{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) != nil {
            log("Scheduler manager already exists")
            return
        }

        // Create and save the manager
        let manager <- FlowTransactionSchedulerUtils.createManager()
        signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)

        // Create and publish public capability
        let managerCap = signer.capabilities.storage.issue<&{FlowTransactionSchedulerUtils.Manager}>(
            FlowTransactionSchedulerUtils.managerStoragePath
        )
        signer.capabilities.publish(managerCap, at: FlowTransactionSchedulerUtils.managerPublicPath)

        log("Scheduler manager initialized successfully")
    }
}
