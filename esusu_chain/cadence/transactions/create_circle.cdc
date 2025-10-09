import EsusuChain from "../contracts/EsusuChain.cdc"

/// Transaction to create a new savings circle
/// @param numberOfMembers: Total number of members in the circle
/// @param contributionAmount: Amount each member contributes per cycle (in USDC)
/// @param cycleDuration: Duration of each cycle in seconds
transaction(numberOfMembers: UInt64, contributionAmount: UFix64, cycleDuration: UFix64) {

    let circleManager: &EsusuChain.CircleManager
    let signerAddress: Address

    prepare(signer: auth(Storage) &Account) {
        self.signerAddress = signer.address

        // Borrow reference to CircleManager
        self.circleManager = signer.storage.borrow<&EsusuChain.CircleManager>(from: EsusuChain.CircleManagerStoragePath)
            ?? panic("CircleManager not found. Please run setup_circle_manager.cdc first")
    }

    execute {
        // Create the circle
        let circleId = self.circleManager.createCircle(
            creator: self.signerAddress,
            numberOfMembers: numberOfMembers,
            contributionAmount: contributionAmount,
            cycleDuration: cycleDuration
        )

        log("Circle created with ID: ".concat(circleId.toString()))
    }
}
