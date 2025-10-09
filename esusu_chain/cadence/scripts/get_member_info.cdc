import EsusuChain from "../contracts/EsusuChain.cdc"

/// Script to get member information in a circle
/// @param circleId: The ID of the circle
/// @param memberAddress: The address of the member
/// @return MemberInfo struct or nil if not found
access(all) fun main(circleId: UInt64, memberAddress: Address): EsusuChain.MemberInfo? {
    return EsusuChain.getMemberInfo(circleId: circleId, address: memberAddress)
}
