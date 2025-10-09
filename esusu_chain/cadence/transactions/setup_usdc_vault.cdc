import FungibleToken from 0xFUNGIBLETOKENADDRESS
import FiatToken from 0xFIATTOKENADDRESS

/// Transaction to set up a USDC vault in the signer's account
transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {

        // Check if USDC Vault already exists
        if signer.storage.borrow<&FiatToken.Vault>(from: FiatToken.VaultStoragePath) == nil {
            // Create a new USDC Vault
            let vault <- FiatToken.createEmptyVault(vaultType: Type<@FiatToken.Vault>())

            // Store it in the account storage
            signer.storage.save(<-vault, to: FiatToken.VaultStoragePath)

            // Create a public capability for receiving USDC
            let receiverCap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(FiatToken.VaultStoragePath)
            signer.capabilities.publish(receiverCap, at: FiatToken.ReceiverPublicPath)

            // Create a public capability for checking balance
            let balanceCap = signer.capabilities.storage.issue<&{FungibleToken.Balance}>(FiatToken.VaultStoragePath)
            signer.capabilities.publish(balanceCap, at: FiatToken.BalancePublicPath)

            log("USDC Vault created and stored")
        } else {
            log("USDC Vault already exists")
        }
    }
}
