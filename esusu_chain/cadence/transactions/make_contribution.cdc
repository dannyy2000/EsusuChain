import FungibleToken from 0xFUNGIBLETOKENADDRESS
import FiatToken from 0xFIATTOKENADDRESS
import EsusuChain from "../contracts/EsusuChain.cdc"

/// Transaction to make a contribution to a circle
/// @param circleId: The ID of the circle
/// @param amount: The amount to contribute (should match circle's contribution amount)
transaction(circleId: UInt64, amount: UFix64) {

    let signerAddress: Address
    let payment: @{FungibleToken.Vault}

    prepare(signer: auth(Storage) &Account) {
        self.signerAddress = signer.address

        // Borrow reference to USDC vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FiatToken.Vault>(from: FiatToken.VaultStoragePath)
            ?? panic("Could not borrow reference to USDC vault")

        // Withdraw contribution amount
        self.payment <- vaultRef.withdraw(amount: amount)
    }

    execute {
        // Make contribution to circle
        EsusuChain.makeContribution(
            circleId: circleId,
            memberAddress: self.signerAddress,
            payment: <- self.payment
        )

        log("Contribution made to circle: ".concat(circleId.toString()))
    }
}
