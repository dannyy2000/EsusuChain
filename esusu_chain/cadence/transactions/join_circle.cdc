import EsusuChain from "../contracts/EsusuChain.cdc"

/// Transaction to join an existing circle
/// @param circleId: The ID of the circle to join
transaction(circleId: UInt64) {

    let signerAddress: Address

    prepare(signer: auth(Storage) &Account) {
        self.signerAddress = signer.address
    }

    execute {
        // Join the circle
        EsusuChain.joinCircle(circleId: circleId, member: self.signerAddress)

        log("Successfully joined circle: ".concat(circleId.toString()))
    }
}
