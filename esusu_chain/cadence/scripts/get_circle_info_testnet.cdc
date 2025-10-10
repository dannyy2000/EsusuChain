import EsusuChain from 0xa89655a0f8e3d113

access(all) fun main(circleId: UInt64): {String: AnyStruct}? {
    return EsusuChain.getCircleInfo(circleId: circleId)
}
