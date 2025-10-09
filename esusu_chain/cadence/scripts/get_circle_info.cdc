import EsusuChain from "../contracts/EsusuChain.cdc"

/// Script to get information about a specific circle
/// @param circleId: The ID of the circle to query
/// @return Dictionary containing circle information
access(all) fun main(circleId: UInt64): {String: AnyStruct}? {
    return EsusuChain.getCircleInfo(circleId: circleId)
}
