import EsusuChain from "../contracts/EsusuChain.cdc"

/// Transaction to set up a CircleManager resource in the signer's account
transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Check if CircleManager already exists
        if signer.storage.borrow<&EsusuChain.CircleManager>(from: EsusuChain.CircleManagerStoragePath) == nil {
            // Create a new CircleManager
            let circleManager <- EsusuChain.createCircleManager()

            // Store it in the account storage
            signer.storage.save(<-circleManager, to: EsusuChain.CircleManagerStoragePath)

            // Create a public capability for the CircleManager
            let cap = signer.capabilities.storage.issue<&EsusuChain.CircleManager>(EsusuChain.CircleManagerStoragePath)
            signer.capabilities.publish(cap, at: EsusuChain.CircleManagerPublicPath)

            log("CircleManager created and stored")
        } else {
            log("CircleManager already exists")
        }
    }
}
