import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import EsusuChain from 0xa89655a0f8e3d113

/// Join a circle with provider capability
transaction(circleId: UInt64) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Get provider capability for FlowToken vault
        let vaultPath = /storage/flowTokenVault
        let provider = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(vaultPath)

        // Join the circle
        EsusuChain.joinCircle(
            circleId: circleId,
            member: signer.address,
            vaultCap: provider
        )

        log("Member joined circle")
    }
}
