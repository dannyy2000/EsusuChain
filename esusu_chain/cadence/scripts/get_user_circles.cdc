import EsusuChain from "../contracts/EsusuChain.cdc"

/// Script to get all circles managed by a user
/// @param userAddress: The address of the user
/// @return Array of circle IDs
access(all) fun main(userAddress: Address): [UInt64] {
    // Get CircleManager capability
    let circleManagerCap = getAccount(userAddress)
        .capabilities.get<&EsusuChain.CircleManager>(EsusuChain.CircleManagerPublicPath)

    if let circleManager = circleManagerCap.borrow() {
        return circleManager.getCircleIds()
    }

    return []
}
