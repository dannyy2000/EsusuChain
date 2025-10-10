import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"

/// EsusuChain: Automated ROSCA using Flow Transaction Scheduler
/// Members approve funds upfront, scheduler automatically pulls contributions and distributes payouts
access(all) contract EsusuChain {

    // Events
    access(all) event CircleCreated(circleId: UInt64, creator: Address, numberOfMembers: UInt64, contributionAmount: UFix64, cycleDuration: UFix64)
    access(all) event MemberJoined(circleId: UInt64, member: Address, position: UInt64, approvedAmount: UFix64)
    access(all) event ContributionPulled(circleId: UInt64, member: Address, amount: UFix64, cycle: UInt64)
    access(all) event PayoutDistributed(circleId: UInt64, recipient: Address, amount: UFix64, cycle: UInt64)
    access(all) event CircleStarted(circleId: UInt64, startTime: UFix64)
    access(all) event CycleCompleted(circleId: UInt64, cycle: UInt64)
    access(all) event CircleCompleted(circleId: UInt64)

    // Named Paths
    access(all) let CircleManagerStoragePath: StoragePath
    access(all) let CircleManagerPublicPath: PublicPath

    // Contract state
    access(all) var nextCircleId: UInt64
    access(self) let circles: @{UInt64: Circle}

    /// Circle Status
    access(all) enum CircleStatus: UInt8 {
        access(all) case Forming      // Waiting for members
        access(all) case Active       // Running cycles
        access(all) case Completed    // All payouts done
        access(all) case Cancelled    // Circle cancelled
    }

    /// Member information with capability for auto-withdrawal
    access(all) struct MemberInfo {
        access(all) let address: Address
        access(all) let position: UInt64
        access(all) let approvedAmount: UFix64  // Total approved for all cycles
        access(all) var contributedAmount: UFix64
        access(all) var cyclesPaid: UInt64
        access(all) var hasReceivedPayout: Bool

        init(address: Address, position: UInt64, approvedAmount: UFix64) {
            self.address = address
            self.position = position
            self.approvedAmount = approvedAmount
            self.contributedAmount = 0.0
            self.cyclesPaid = 0
            self.hasReceivedPayout = false
        }

        access(contract) fun recordContribution(amount: UFix64) {
            self.contributedAmount = self.contributedAmount + amount
            self.cyclesPaid = self.cyclesPaid + 1
        }

        access(contract) fun markPayoutReceived() {
            self.hasReceivedPayout = true
        }
    }

    /// Main Circle resource with scheduler integration
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
        access(all) var startedAt: UFix64?
        access(all) var lastCycleTime: UFix64

        access(all) let members: {Address: MemberInfo}
        access(all) let memberOrder: [Address]

        // Store member vault capabilities for auto-withdrawal
        access(self) let memberVaultCaps: {Address: Capability<auth(FungibleToken.Withdraw) &FlowToken.Vault>}
        access(self) let vault: @FlowToken.Vault

        init(
            circleId: UInt64,
            creator: Address,
            numberOfMembers: UInt64,
            contributionAmount: UFix64,
            cycleDuration: UFix64
        ) {
            pre {
                numberOfMembers >= 1: "Circle must have at least 1 member"
                contributionAmount > 0.0: "Contribution amount must be greater than 0"
                cycleDuration > 0.0: "Cycle duration must be greater than 0"
            }

            self.circleId = circleId
            self.creator = creator
            self.numberOfMembers = numberOfMembers
            self.contributionAmount = contributionAmount
            self.cycleDuration = cycleDuration
            self.status = CircleStatus.Forming
            self.currentCycle = 0
            self.currentPayoutPosition = 0
            self.createdAt = getCurrentBlock().timestamp
            self.startedAt = nil
            self.lastCycleTime = 0.0
            self.members = {}
            self.memberOrder = []
            self.memberVaultCaps = {}
            self.vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()) as! @FlowToken.Vault
        }

        /// Add member with provider capability for auto-withdrawal
        access(all) fun joinCircle(
            member: Address,
            vaultCap: Capability<auth(FungibleToken.Withdraw) &FlowToken.Vault>
        ): UInt64 {
            pre {
                self.status == CircleStatus.Forming: "Circle is not accepting members"
                self.members.length < Int(self.numberOfMembers): "Circle is full"
                self.members[member] == nil: "Member already exists"
                vaultCap.check(): "Invalid vault capability"
            }

            // Calculate total amount member needs to approve
            let totalRequired = self.contributionAmount * UFix64(self.numberOfMembers)

            // Verify member has sufficient balance
            let vaultRef = vaultCap.borrow()!
            assert(vaultRef.balance >= totalRequired, message: "Insufficient balance for all cycles")

            let position = UInt64(self.members.length)
            let memberInfo = MemberInfo(
                address: member,
                position: position,
                approvedAmount: totalRequired
            )

            self.members[member] = memberInfo
            self.memberOrder.append(member)
            self.memberVaultCaps[member] = vaultCap

            emit MemberJoined(
                circleId: self.circleId,
                member: member,
                position: position,
                approvedAmount: totalRequired
            )

            // Start circle if full
            if self.members.length == Int(self.numberOfMembers) {
                self.startCircle()
            }

            return position
        }

        /// Start the circle and begin first cycle
        /// NOTE: After this is called, a TransactionHandler should be created and scheduled
        /// to automate contribution pulls. See EsusuChainTransactionHandler contract.
        access(self) fun startCircle() {
            pre {
                self.status == CircleStatus.Forming: "Circle already started"
                self.members.length == Int(self.numberOfMembers): "Circle not full"
            }

            self.status = CircleStatus.Active
            self.startedAt = getCurrentBlock().timestamp
            self.lastCycleTime = getCurrentBlock().timestamp
            self.currentCycle = 1

            emit CircleStarted(circleId: self.circleId, startTime: self.startedAt!)
        }

        /// AUTOMATED: Pull contributions from all members (called by scheduler)
        access(all) fun pullContributions() {
            pre {
                self.status == CircleStatus.Active: "Circle is not active"
                self.canPullContributions(): "Not time to pull contributions yet"
            }

            // Pull from each member
            for address in self.memberOrder {
                let vaultCap = self.memberVaultCaps[address]!
                let vaultRef = vaultCap.borrow()
                    ?? panic("Cannot borrow member vault")

                // Check if member has already paid this cycle
                let memberInfo = self.members[address]!
                if memberInfo.cyclesPaid >= self.currentCycle {
                    continue // Already paid this cycle
                }

                // Withdraw contribution
                let payment <- vaultRef.withdraw(amount: self.contributionAmount)
                self.vault.deposit(from: <- payment)

                // Update member info
                self.members[address]!.recordContribution(amount: self.contributionAmount)

                emit ContributionPulled(
                    circleId: self.circleId,
                    member: address,
                    amount: self.contributionAmount,
                    cycle: self.currentCycle
                )
            }

            // After pulling all contributions, immediately distribute payout
            self.distributePayout()
        }

        /// AUTOMATED: Distribute payout to next member (called after contributions pulled)
        access(self) fun distributePayout() {
            pre {
                self.status == CircleStatus.Active: "Circle is not active"
                self.currentPayoutPosition < self.numberOfMembers: "All payouts completed"
            }

            let recipientAddress = self.memberOrder[self.currentPayoutPosition]
            let payoutAmount = self.contributionAmount * UFix64(self.numberOfMembers)

            // Get recipient's receiver capability
            let receiverCap = getAccount(recipientAddress)
                .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                .borrow()
                ?? panic("Cannot borrow receiver capability")

            // Withdraw and send payout
            let payout <- self.vault.withdraw(amount: payoutAmount)
            receiverCap.deposit(from: <- payout)

            // Update member status
            self.members[recipientAddress]!.markPayoutReceived()

            emit PayoutDistributed(
                circleId: self.circleId,
                recipient: recipientAddress,
                amount: payoutAmount,
                cycle: self.currentCycle
            )

            emit CycleCompleted(circleId: self.circleId, cycle: self.currentCycle)

            // Move to next position
            self.currentPayoutPosition = self.currentPayoutPosition + 1

            // Check if circle is complete
            if self.currentPayoutPosition >= self.numberOfMembers {
                self.status = CircleStatus.Completed
                emit CircleCompleted(circleId: self.circleId)
            } else {
                // Advance to next cycle
                self.currentCycle = self.currentCycle + 1
                self.lastCycleTime = getCurrentBlock().timestamp
            }
        }

        /// Check if it's time to pull contributions
        access(all) view fun canPullContributions(): Bool {
            if self.status != CircleStatus.Active {
                return false
            }

            let timeSinceLastCycle = getCurrentBlock().timestamp - self.lastCycleTime
            return timeSinceLastCycle >= self.cycleDuration
        }

        /// Get next scheduled pull time
        access(all) view fun getNextPullTime(): UFix64? {
            if self.status != CircleStatus.Active {
                return nil
            }
            return self.lastCycleTime + self.cycleDuration
        }

        /// Get circle info
        access(all) view fun getCircleInfo(): {String: AnyStruct} {
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
                "startedAt": self.startedAt,
                "memberCount": self.members.length,
                "vaultBalance": self.vault.balance,
                "nextPullTime": self.getNextPullTime()
            }
        }

        access(all) view fun getMemberInfo(address: Address): MemberInfo? {
            return self.members[address]
        }

        access(all) view fun isCircleFull(): Bool {
            return self.members.length == Int(self.numberOfMembers)
        }
    }

    /// Public interface for circle operations
    access(all) resource interface CircleManagerPublic {
        access(all) fun getCircleIds(): [UInt64]
        access(all) fun getCircleInfo(circleId: UInt64): {String: AnyStruct}?
    }

    /// Circle Manager resource
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

            EsusuChain.circles[circleId] <-! circle
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

    // Public contract functions
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

    access(all) fun joinCircle(
        circleId: UInt64,
        member: Address,
        vaultCap: Capability<auth(FungibleToken.Withdraw) &FlowToken.Vault>
    ) {
        let circleRef = &self.circles[circleId] as &Circle?
            ?? panic("Circle does not exist")

        circleRef.joinCircle(member: member, vaultCap: vaultCap)
    }

    /// SCHEDULER CALLS THIS: Pull contributions from all members
    access(all) fun scheduledPullContributions(circleId: UInt64) {
        let circleRef = &self.circles[circleId] as &Circle?
            ?? panic("Circle does not exist")

        circleRef.pullContributions()
    }

    access(all) fun getMemberInfo(circleId: UInt64, address: Address): MemberInfo? {
        let circleRef = &self.circles[circleId] as &Circle?
        if circleRef != nil {
            return circleRef!.getMemberInfo(address: address)
        }
        return nil
    }

    access(all) fun canPullContributions(circleId: UInt64): Bool {
        let circleRef = &self.circles[circleId] as &Circle?
        if circleRef != nil {
            return circleRef!.canPullContributions()
        }
        return false
    }

    init() {
        self.nextCircleId = 0
        self.circles <- {}

        self.CircleManagerStoragePath = /storage/EsusuChainCircleManager
        self.CircleManagerPublicPath = /public/EsusuChainCircleManager
    }
}
