import FungibleToken from 0xFUNGIBLETOKENADDRESS
import FiatToken from 0xFIATTOKENADDRESS
import EsusuChain from "../contracts/EsusuChain.cdc"

/// Transaction to execute payout to the next member in rotation
/// This can be called by Forte Workflow for automated payouts
/// @param circleId: The ID of the circle
/// @param recipientAddress: The address of the recipient (for verification)
transaction(circleId: UInt64, recipientAddress: Address) {

    let payout: @{FungibleToken.Vault}
    let recipientReceiver: &{FungibleToken.Receiver}

    prepare(signer: auth(Storage) &Account) {
        // Execute payout from circle
        self.payout <- EsusuChain.executePayout(circleId: circleId)

        // Get recipient's USDC receiver capability
        self.recipientReceiver = getAccount(recipientAddress)
            .capabilities.get<&{FungibleToken.Receiver}>(FiatToken.ReceiverPublicPath)
            .borrow()
            ?? panic("Could not borrow receiver reference")
    }

    execute {
        // Deposit payout to recipient
        self.recipientReceiver.deposit(from: <- self.payout)

        log("Payout executed for circle: ".concat(circleId.toString()).concat(" to recipient: ").concat(recipientAddress.toString()))
    }
}
