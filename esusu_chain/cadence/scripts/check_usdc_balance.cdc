import FungibleToken from 0xFUNGIBLETOKENADDRESS
import FiatToken from 0xFIATTOKENADDRESS

/// Script to check USDC balance of an account
/// @param address: The address to check
/// @return The USDC balance
access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)

    let balanceCap = account.capabilities.get<&{FungibleToken.Balance}>(FiatToken.BalancePublicPath)

    if let balance = balanceCap.borrow() {
        return balance.balance
    }

    return 0.0
}
