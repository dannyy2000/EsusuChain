import EsusuChain from 0xa89655a0f8e3d113

/// Transaction to create a new savings circle
transaction(numberOfMembers: UInt64, contributionAmount: UFix64, cycleDuration: UFix64) {

    let circleManager: &EsusuChain.CircleManager
    let creatorAddress: Address

    prepare(signer: auth(Storage) &Account) {
        self.creatorAddress = signer.address

        // Borrow reference to CircleManager
        self.circleManager = signer.storage.borrow<&EsusuChain.CircleManager>(from: EsusuChain.CircleManagerStoragePath)
            ?? panic("CircleManager not found")
    }

    execute {
        // Create the circle
        let circleId = self.circleManager.createCircle(
            creator: self.creatorAddress,
            numberOfMembers: numberOfMembers,
            contributionAmount: contributionAmount,
            cycleDuration: cycleDuration
        )

        log("Circle created with ID: ".concat(circleId.toString()))
    }
}
