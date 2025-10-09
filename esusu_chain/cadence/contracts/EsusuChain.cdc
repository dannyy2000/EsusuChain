import FungibleToken from 0xFUNGIBLETOKENADDRESS
import FiatToken from 0xFIATTOKENADDRESS

/// EsusuChain: A decentralized rotating savings and credit association (ROSCA) platform
/// Built on Flow blockchain with automated contributions and payouts using Forte Workflow
access(all) contract EsusuChain {

    // Events
    access(all) event CircleCreated(circleId: UInt64, creator: Address, numberOfMembers: UInt64, contributionAmount: UFix64, cycleDuration: UFix64)
    access(all) event MemberJoined(circleId: UInt64, member: Address, position: UInt64)
    access(all) event ContributionMade(circleId: UInt64, member: Address, amount: UFix64, cycle: UInt64)
    access(all) event PayoutExecuted(circleId: UInt64, recipient: Address, amount: UFix64, cycle: UInt64)
    access(all) event CircleCompleted(circleId: UInt64)
    access(all) event CycleAdvanced(circleId: UInt64, newCycle: UInt64)

    // Named Paths
    access(all) let CircleManagerStoragePath: StoragePath
    access(all) let CircleManagerPublicPath: PublicPath

    // Contract state
    access(all) var nextCircleId: UInt64
    access(contract) let circles: @{UInt64: Circle}

    /// Circle Status enum
    access(all) enum CircleStatus: UInt8 {
        access(all) case Active
        access(all) case Completed
        access(all) case Cancelled
    }

    /// Member information in a circle
    access(all) struct MemberInfo {
        access(all) let address: Address
        access(all) let position: UInt64
        access(all) var totalContributed: UFix64
        access(all) var hasPaidCurrentCycle: Bool
        access(all) var hasReceivedPayout: Bool

        init(address: Address, position: UInt64) {
            self.address = address
            self.position = position
            self.totalContributed = 0.0
            self.hasPaidCurrentCycle = false
            self.hasReceivedPayout = false
        }

        access(contract) fun recordContribution(amount: UFix64) {
            self.totalContributed = self.totalContributed + amount
            self.hasPaidCurrentCycle = true
        }

        access(contract) fun resetCyclePayment() {
            self.hasPaidCurrentCycle = false
        }

        access(contract) fun markPayoutReceived() {
            self.hasReceivedPayout = true
        }
    }

    /// Main Circle resource that holds the savings circle state
    access(all) resource Circle {
        access(all) let circleId: UInt64
        access(all) let creator: Address
        access(all) let numberOfMembers: UInt64
        access(all) let contributionAmount: UFix64
        access(all) let cycleDuration: UFix64
        access(all) var status: CircleStatus
        access(all) var currentCycle: UInt64
        access(all) var currentPayoutPosition: UInt64
        access(all) let createdAt: UFix64
        access(all) var lastCycleTimestamp: UFix64

        access(all) let members: {Address: MemberInfo}
        access(all) let memberOrder: [Address]
        access(self) let vault: @FiatToken.Vault

        init(
            circleId: UInt64,
            creator: Address,
            numberOfMembers: UInt64,
            contributionAmount: UFix64,
            cycleDuration: UFix64
        ) {
            pre {
                numberOfMembers >= 2: "Circle must have at least 2 members"
                contributionAmount > 0.0: "Contribution amount must be greater than 0"
                cycleDuration > 0.0: "Cycle duration must be greater than 0"
            }

            self.circleId = circleId
            self.creator = creator
            self.numberOfMembers = numberOfMembers
            self.contributionAmount = contributionAmount
            self.cycleDuration = cycleDuration
            self.status = CircleStatus.Active
            self.currentCycle = 0
            self.currentPayoutPosition = 0
            self.createdAt = getCurrentBlock().timestamp
            self.lastCycleTimestamp = getCurrentBlock().timestamp
            self.members = {}
            self.memberOrder = []

            // Initialize empty vault for holding contributions
            self.vault <- FiatToken.createEmptyVault(vaultType: Type<@FiatToken.Vault>()) as! @FiatToken.Vault
        }

        /// Add a member to the circle
        access(all) fun addMember(address: Address): UInt64 {
            pre {
                self.members.length < Int(self.numberOfMembers): "Circle is full"
                self.members[address] == nil: "Member already exists"
                self.status == CircleStatus.Active: "Circle is not active"
            }

            let position = UInt64(self.members.length)
            let memberInfo = MemberInfo(address: address, position: position)
            self.members[address] = memberInfo
            self.memberOrder.append(address)

            emit MemberJoined(circleId: self.circleId, member: address, position: position)
            return position
        }

        /// Check if circle is ready to start (all members joined)
        access(all) fun isCircleFull(): Bool {
            return self.members.length == Int(self.numberOfMembers)
        }

        /// Check if it's time to advance to next cycle
        access(all) fun shouldAdvanceCycle(): Bool {
            let timeSinceLastCycle = getCurrentBlock().timestamp - self.lastCycleTimestamp
            return timeSinceLastCycle >= self.cycleDuration && self.allMembersPaidCurrentCycle()
        }

        /// Check if all members have paid for current cycle
        access(all) fun allMembersPaidCurrentCycle(): Bool {
            for address in self.memberOrder {
                let member = self.members[address]!
                if !member.hasPaidCurrentCycle {
                    return false
                }
            }
            return true
        }

        /// Process a member's contribution
        access(all) fun deposit(from: @{FungibleToken.Vault}, memberAddress: Address) {
            pre {
                self.status == CircleStatus.Active: "Circle is not active"
                self.isCircleFull(): "Circle is not full yet"
                self.members[memberAddress] != nil: "Not a member of this circle"
                from.balance == self.contributionAmount: "Incorrect contribution amount"
            }

            let member = self.members[memberAddress]!

            // Cast to FiatToken.Vault to ensure type safety
            let usdcVault <- from as! @FiatToken.Vault
            let amount = usdcVault.balance

            // Deposit into circle vault
            self.vault.deposit(from: <- usdcVault)

            // Update member info
            self.members[memberAddress]!.recordContribution(amount: amount)

            emit ContributionMade(circleId: self.circleId, member: memberAddress, amount: amount, cycle: self.currentCycle)

            // Check if ready to advance cycle and payout
            if self.shouldAdvanceCycle() {
                self.advanceCycle()
            }
        }

        /// Advance to next cycle and trigger payout
        access(contract) fun advanceCycle() {
            pre {
                self.allMembersPaidCurrentCycle(): "Not all members have paid"
            }

            // Reset payment status for all members
            for address in self.memberOrder {
                self.members[address]!.resetCyclePayment()
            }

            self.currentCycle = self.currentCycle + 1
            self.lastCycleTimestamp = getCurrentBlock().timestamp

            emit CycleAdvanced(circleId: self.circleId, newCycle: self.currentCycle)
        }

        /// Execute payout to next member in rotation
        access(all) fun payoutNextMember(): @{FungibleToken.Vault} {
            pre {
                self.status == CircleStatus.Active: "Circle is not active"
                self.allMembersPaidCurrentCycle(): "Not all members have paid"
                self.currentPayoutPosition < self.numberOfMembers: "All payouts completed"
            }

            let recipientAddress = self.memberOrder[self.currentPayoutPosition]
            let payoutAmount = self.contributionAmount * UFix64(self.numberOfMembers)

            // Mark member as having received payout
            self.members[recipientAddress]!.markPayoutReceived()

            // Withdraw from vault
            let payout <- self.vault.withdraw(amount: payoutAmount)

            emit PayoutExecuted(circleId: self.circleId, recipient: recipientAddress, amount: payoutAmount, cycle: self.currentCycle)

            // Move to next payout position
            self.currentPayoutPosition = self.currentPayoutPosition + 1

            // Check if circle is completed
            if self.currentPayoutPosition >= self.numberOfMembers {
                self.status = CircleStatus.Completed
                emit CircleCompleted(circleId: self.circleId)
            }

            return <- payout
        }

        /// Get circle details
        access(all) fun getCircleInfo(): {String: AnyStruct} {
            return {
                "circleId": self.circleId,
                "creator": self.creator,
                "numberOfMembers": self.numberOfMembers,
                "contributionAmount": self.contributionAmount,
                "cycleDuration": self.cycleDuration,
                "status": self.status,
                "currentCycle": self.currentCycle,
                "currentPayoutPosition": self.currentPayoutPosition,
                "createdAt": self.createdAt,
                "memberCount": self.members.length,
                "vaultBalance": self.vault.balance
            }
        }

        /// Get member info
        access(all) fun getMemberInfo(address: Address): MemberInfo? {
            return self.members[address]
        }

        access(all) fun getVaultBalance(): UFix64 {
            return self.vault.balance
        }

        destroy() {
            destroy self.vault
        }
    }

    /// Public interface for circle operations
    access(all) resource interface CircleManagerPublic {
        access(all) fun getCircleIds(): [UInt64]
        access(all) fun getCircleInfo(circleId: UInt64): {String: AnyStruct}?
    }

    /// Circle Manager resource for managing multiple circles
    access(all) resource CircleManager: CircleManagerPublic {
        access(all) let circleIds: [UInt64]

        init() {
            self.circleIds = []
        }

        access(all) fun createCircle(
            creator: Address,
            numberOfMembers: UInt64,
            contributionAmount: UFix64,
            cycleDuration: UFix64
        ): UInt64 {
            let circleId = EsusuChain.nextCircleId
            let circle <- create Circle(
                circleId: circleId,
                creator: creator,
                numberOfMembers: numberOfMembers,
                contributionAmount: contributionAmount,
                cycleDuration: cycleDuration
            )

            // Add creator as first member
            circle.addMember(address: creator)

            // Store circle in contract
            let oldCircle <- EsusuChain.circles[circleId] <- circle
            destroy oldCircle

            self.circleIds.append(circleId)
            EsusuChain.nextCircleId = EsusuChain.nextCircleId + 1

            emit CircleCreated(
                circleId: circleId,
                creator: creator,
                numberOfMembers: numberOfMembers,
                contributionAmount: contributionAmount,
                cycleDuration: cycleDuration
            )

            return circleId
        }

        access(all) fun getCircleIds(): [UInt64] {
            return self.circleIds
        }

        access(all) fun getCircleInfo(circleId: UInt64): {String: AnyStruct}? {
            return EsusuChain.getCircleInfo(circleId: circleId)
        }
    }

    // Public functions
    access(all) fun createCircleManager(): @CircleManager {
        return <- create CircleManager()
    }

    access(all) fun getCircleInfo(circleId: UInt64): {String: AnyStruct}? {
        let circleRef = &self.circles[circleId] as &Circle?
        if circleRef != nil {
            return circleRef!.getCircleInfo()
        }
        return nil
    }

    access(all) fun joinCircle(circleId: UInt64, member: Address) {
        let circleRef = &self.circles[circleId] as &Circle?
        ?? panic("Circle does not exist")

        circleRef.addMember(address: member)
    }

    access(all) fun makeContribution(circleId: UInt64, memberAddress: Address, payment: @{FungibleToken.Vault}) {
        let circleRef = &self.circles[circleId] as &Circle?
        ?? panic("Circle does not exist")

        circleRef.deposit(from: <- payment, memberAddress: memberAddress)
    }

    access(all) fun executePayout(circleId: UInt64): @{FungibleToken.Vault} {
        let circleRef = &self.circles[circleId] as &Circle?
        ?? panic("Circle does not exist")

        return <- circleRef.payoutNextMember()
    }

    access(all) fun getMemberInfo(circleId: UInt64, address: Address): MemberInfo? {
        let circleRef = &self.circles[circleId] as &Circle?
        if circleRef != nil {
            return circleRef!.getMemberInfo(address: address)
        }
        return nil
    }

    init() {
        self.nextCircleId = 0
        self.circles <- {}

        self.CircleManagerStoragePath = /storage/EsusuChainCircleManager
        self.CircleManagerPublicPath = /public/EsusuChainCircleManager
    }
}
