import Test
import "EsusuChain"
import "FungibleToken"
import "FlowToken"

access(all) let admin = Test.getAccount(0x0000000000000007)
access(all) var alice = Test.createAccount()
access(all) var bob = Test.createAccount()
access(all) var charlie = Test.createAccount()

access(all) fun setup() {
    let err = Test.deployContract(
        name: "EsusuChain",
        path: "../contracts/EsusuChain.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
}

// ========================================
// Circle Creation Tests
// ========================================

access(all) fun testCreateCircleManager() {
    let manager <- EsusuChain.createCircleManager()
    Test.assertEqual(0, manager.getCircleIds().length)
    destroy manager
}

access(all) fun testCreateSingleCircle() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 4,
        contributionAmount: 100.0,
        cycleDuration: 604800.0
    )

    Test.assertEqual(1, manager.getCircleIds().length)
    destroy manager
}

access(all) fun testCreateMultipleCircles() {
    let manager <- EsusuChain.createCircleManager()

    let circleId1 = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 3,
        contributionAmount: 50.0,
        cycleDuration: 86400.0
    )

    let circleId2 = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 4,
        contributionAmount: 100.0,
        cycleDuration: 604800.0
    )

    let circleId3 = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 5,
        contributionAmount: 75.0,
        cycleDuration: 3600.0
    )

    Test.assertEqual(3, manager.getCircleIds().length)

    let ids = manager.getCircleIds()
    Test.assertEqual(circleId1, ids[0])
    Test.assertEqual(circleId2, ids[1])
    Test.assertEqual(circleId3, ids[2])

    destroy manager
}

access(all) fun testCircleParameterValidation() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 2,
        contributionAmount: 10.0,
        cycleDuration: 60.0
    )

    Test.assertEqual(1, manager.getCircleIds().length)
    destroy manager
}

access(all) fun testNonExistentCircle() {
    let circleInfo = EsusuChain.getCircleInfo(circleId: 999)
    Test.assert(circleInfo == nil, message: "Non-existent circle should return nil")
}

access(all) fun testCircleIdIncrementsAcrossManagers() {
    let manager1 <- EsusuChain.createCircleManager()
    let circleId1 = manager1.createCircle(
        creator: admin.address,
        numberOfMembers: 3,
        contributionAmount: 50.0,
        cycleDuration: 86400.0
    )
    destroy manager1

    let manager2 <- EsusuChain.createCircleManager()
    let circleId2 = manager2.createCircle(
        creator: admin.address,
        numberOfMembers: 4,
        contributionAmount: 100.0,
        cycleDuration: 604800.0
    )
    destroy manager2

    Test.assert(circleId2 > circleId1, message: "Circle IDs should increment")
}

// ========================================
// Member Joining Tests (using executeTransaction)
// ========================================

access(all) fun testMemberJoinCircleViaTransaction() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 3,
        contributionAmount: 10.0,
        cycleDuration: 100.0
    )

    // Execute join transaction as Alice
    let joinTx = Test.Transaction(
        code: "import EsusuChain from 0x0000000000000007\nimport FungibleToken from 0x0000000000000002\nimport FlowToken from 0x0000000000000003\n\ntransaction(circleId: UInt64) {\n    prepare(signer: auth(Storage, Capabilities) &Account) {\n        let vaultPath = /storage/flowTokenVault\n        let provider = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(vaultPath)\n        EsusuChain.joinCircle(circleId: circleId, member: signer.address, vaultCap: provider)\n    }\n}",
        authorizers: [alice.address],
        signers: [alice],
        arguments: [circleId]
    )

    let joinResult = Test.executeTransaction(joinTx)
    Test.expect(joinResult, Test.beSucceeded())

    // Verify member was added
    let memberInfo = EsusuChain.getMemberInfo(circleId: circleId, address: alice.address)
    Test.assert(memberInfo != nil, message: "Member should exist")
    Test.assertEqual(alice.address, memberInfo!.address)
    Test.assertEqual(0 as UInt64, memberInfo!.position)
    Test.assertEqual(30.0, memberInfo!.approvedAmount)

    destroy manager
}

access(all) fun testMultipleMembersJoinCircle() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 3,
        contributionAmount: 10.0,
        cycleDuration: 100.0
    )

    // Create join transaction code
    let joinCode = "import EsusuChain from 0x0000000000000007\nimport FungibleToken from 0x0000000000000002\nimport FlowToken from 0x0000000000000003\n\ntransaction(circleId: UInt64) {\n    prepare(signer: auth(Storage, Capabilities) &Account) {\n        let vaultPath = /storage/flowTokenVault\n        let provider = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(vaultPath)\n        EsusuChain.joinCircle(circleId: circleId, member: signer.address, vaultCap: provider)\n    }\n}"

    // Alice joins
    let aliceTx = Test.Transaction(
        code: joinCode,
        authorizers: [alice.address],
        signers: [alice],
        arguments: [circleId]
    )
    Test.expect(Test.executeTransaction(aliceTx), Test.beSucceeded())

    // Bob joins
    let bobTx = Test.Transaction(
        code: joinCode,
        authorizers: [bob.address],
        signers: [bob],
        arguments: [circleId]
    )
    Test.expect(Test.executeTransaction(bobTx), Test.beSucceeded())

    // Charlie joins - circle should start
    let charlieTx = Test.Transaction(
        code: joinCode,
        authorizers: [charlie.address],
        signers: [charlie],
        arguments: [circleId]
    )
    Test.expect(Test.executeTransaction(charlieTx), Test.beSucceeded())

    // Verify all members
    let aliceInfo = EsusuChain.getMemberInfo(circleId: circleId, address: alice.address)
    let bobInfo = EsusuChain.getMemberInfo(circleId: circleId, address: bob.address)
    let charlieInfo = EsusuChain.getMemberInfo(circleId: circleId, address: charlie.address)

    Test.assert(aliceInfo != nil, message: "Alice should be a member")
    Test.assert(bobInfo != nil, message: "Bob should be a member")
    Test.assert(charlieInfo != nil, message: "Charlie should be a member")

    Test.assertEqual(0 as UInt64, aliceInfo!.position)
    Test.assertEqual(1 as UInt64, bobInfo!.position)
    Test.assertEqual(2 as UInt64, charlieInfo!.position)

    destroy manager
}

// ========================================
// Contribution Tracking Tests
// ========================================

access(all) fun testMemberContributionInitialState() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 2,
        contributionAmount: 10.0,
        cycleDuration: 100.0
    )

    let joinCode = "import EsusuChain from 0x0000000000000007\nimport FungibleToken from 0x0000000000000002\nimport FlowToken from 0x0000000000000003\n\ntransaction(circleId: UInt64) {\n    prepare(signer: auth(Storage, Capabilities) &Account) {\n        let vaultPath = /storage/flowTokenVault\n        let provider = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(vaultPath)\n        EsusuChain.joinCircle(circleId: circleId, member: signer.address, vaultCap: provider)\n    }\n}"

    let aliceTx = Test.Transaction(
        code: joinCode,
        authorizers: [alice.address],
        signers: [alice],
        arguments: [circleId]
    )
    Test.expect(Test.executeTransaction(aliceTx), Test.beSucceeded())

    let memberInfo = EsusuChain.getMemberInfo(circleId: circleId, address: alice.address)

    // Verify initial state
    Test.assertEqual(0.0, memberInfo!.contributedAmount)
    Test.assertEqual(0 as UInt64, memberInfo!.cyclesPaid)
    Test.assertEqual(false, memberInfo!.hasReceivedPayout)

    destroy manager
}

access(all) fun testGetMemberInfoForNonMember() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 3,
        contributionAmount: 10.0,
        cycleDuration: 100.0
    )

    // Query member that hasn't joined
    let memberInfo = EsusuChain.getMemberInfo(circleId: circleId, address: alice.address)
    Test.assert(memberInfo == nil, message: "Non-member should return nil")

    destroy manager
}

access(all) fun testCanPullContributionsOnFormingCircle() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 3,
        contributionAmount: 10.0,
        cycleDuration: 100.0
    )

    // Circle is still forming, cannot pull
    let canPull = EsusuChain.canPullContributions(circleId: circleId)
    Test.assertEqual(false, canPull)

    destroy manager
}

access(all) fun testCanPullContributionsTimingOnActiveCircle() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 2,
        contributionAmount: 10.0,
        cycleDuration: 1.0  // 1 second cycle
    )

    let joinCode = "import EsusuChain from 0x0000000000000007\nimport FungibleToken from 0x0000000000000002\nimport FlowToken from 0x0000000000000003\n\ntransaction(circleId: UInt64) {\n    prepare(signer: auth(Storage, Capabilities) &Account) {\n        let vaultPath = /storage/flowTokenVault\n        let provider = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(vaultPath)\n        EsusuChain.joinCircle(circleId: circleId, member: signer.address, vaultCap: provider)\n    }\n}"

    // Fill the circle
    let aliceTx = Test.Transaction(code: joinCode, authorizers: [alice.address], signers: [alice], arguments: [circleId])
    Test.expect(Test.executeTransaction(aliceTx), Test.beSucceeded())

    let bobTx = Test.Transaction(code: joinCode, authorizers: [bob.address], signers: [bob], arguments: [circleId])
    Test.expect(Test.executeTransaction(bobTx), Test.beSucceeded())

    // Initially cannot pull (just started)
    let canPullBefore = EsusuChain.canPullContributions(circleId: circleId)
    Test.assertEqual(false, canPullBefore)

    // Move time forward
    Test.moveTime(by: 2.0)

    // Now can pull
    let canPullAfter = EsusuChain.canPullContributions(circleId: circleId)
    Test.assertEqual(true, canPullAfter)

    destroy manager
}

// ========================================
// End-to-End Contribution and Payout Test
// ========================================

access(all) fun testPullContributionsAndPayoutCycle() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 2,
        contributionAmount: 10.0,
        cycleDuration: 1.0
    )

    let joinCode = "import EsusuChain from 0x0000000000000007\nimport FungibleToken from 0x0000000000000002\nimport FlowToken from 0x0000000000000003\n\ntransaction(circleId: UInt64) {\n    prepare(signer: auth(Storage, Capabilities) &Account) {\n        let vaultPath = /storage/flowTokenVault\n        let provider = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(vaultPath)\n        EsusuChain.joinCircle(circleId: circleId, member: signer.address, vaultCap: provider)\n    }\n}"

    // Members join
    Test.expect(Test.executeTransaction(
        Test.Transaction(code: joinCode, authorizers: [alice.address], signers: [alice], arguments: [circleId])
    ), Test.beSucceeded())
    Test.expect(Test.executeTransaction(
        Test.Transaction(code: joinCode, authorizers: [bob.address], signers: [bob], arguments: [circleId])
    ), Test.beSucceeded())

    // Move time and pull contributions
    Test.moveTime(by: 2.0)
    EsusuChain.scheduledPullContributions(circleId: circleId)

    // Verify contributions were pulled
    let aliceInfo = EsusuChain.getMemberInfo(circleId: circleId, address: alice.address)
    let bobInfo = EsusuChain.getMemberInfo(circleId: circleId, address: bob.address)

    Test.assertEqual(10.0, aliceInfo!.contributedAmount)
    Test.assertEqual(10.0, bobInfo!.contributedAmount)
    Test.assertEqual(1 as UInt64, aliceInfo!.cyclesPaid)
    Test.assertEqual(1 as UInt64, bobInfo!.cyclesPaid)

    // First member should have received payout
    Test.assertEqual(true, aliceInfo!.hasReceivedPayout)
    Test.assertEqual(false, bobInfo!.hasReceivedPayout)

    destroy manager
}

access(all) fun testCompleteCircleLifecycleTwoCycles() {
    let manager <- EsusuChain.createCircleManager()

    let circleId = manager.createCircle(
        creator: admin.address,
        numberOfMembers: 2,
        contributionAmount: 10.0,
        cycleDuration: 1.0
    )

    let joinCode = "import EsusuChain from 0x0000000000000007\nimport FungibleToken from 0x0000000000000002\nimport FlowToken from 0x0000000000000003\n\ntransaction(circleId: UInt64) {\n    prepare(signer: auth(Storage, Capabilities) &Account) {\n        let vaultPath = /storage/flowTokenVault\n        let provider = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(vaultPath)\n        EsusuChain.joinCircle(circleId: circleId, member: signer.address, vaultCap: provider)\n    }\n}"

    // Members join
    Test.expect(Test.executeTransaction(
        Test.Transaction(code: joinCode, authorizers: [alice.address], signers: [alice], arguments: [circleId])
    ), Test.beSucceeded())
    Test.expect(Test.executeTransaction(
        Test.Transaction(code: joinCode, authorizers: [bob.address], signers: [bob], arguments: [circleId])
    ), Test.beSucceeded())

    // Cycle 1
    Test.moveTime(by: 2.0)
    EsusuChain.scheduledPullContributions(circleId: circleId)

    let aliceInfo1 = EsusuChain.getMemberInfo(circleId: circleId, address: alice.address)
    Test.assertEqual(true, aliceInfo1!.hasReceivedPayout)

    // Cycle 2
    Test.moveTime(by: 2.0)
    EsusuChain.scheduledPullContributions(circleId: circleId)

    let bobInfo2 = EsusuChain.getMemberInfo(circleId: circleId, address: bob.address)
    Test.assertEqual(true, bobInfo2!.hasReceivedPayout)

    // Final verification - both paid twice, both received once
    let aliceInfoFinal = EsusuChain.getMemberInfo(circleId: circleId, address: alice.address)
    let bobInfoFinal = EsusuChain.getMemberInfo(circleId: circleId, address: bob.address)

    Test.assertEqual(20.0, aliceInfoFinal!.contributedAmount)
    Test.assertEqual(20.0, bobInfoFinal!.contributedAmount)
    Test.assertEqual(2 as UInt64, aliceInfoFinal!.cyclesPaid)
    Test.assertEqual(2 as UInt64, bobInfoFinal!.cyclesPaid)

    destroy manager
}
