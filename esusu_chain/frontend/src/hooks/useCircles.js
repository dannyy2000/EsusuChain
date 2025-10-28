import { useState, useEffect, useRef } from 'react'
import * as fcl from '@onflow/fcl'
import * as t from '@onflow/types'
import { getCircleName } from '../utils/circleNames'

// Helper function to extract status value from various formats
function extractStatus(statusData) {
  // Handle different possible formats:
  // 1. Direct number: 0, 1, 2, 3
  // 2. Object with rawValue: { rawValue: 0 }
  // 3. String enum: "Forming", "Active", etc.

  if (typeof statusData === 'number') {
    return statusData
  }

  if (statusData && typeof statusData === 'object') {
    if ('rawValue' in statusData && typeof statusData.rawValue === 'number') {
      return statusData.rawValue
    }
  }

  // If it's a string, try to map it
  if (typeof statusData === 'string') {
    const statusMap = {
      'Forming': 0,
      'Active': 1,
      'Completed': 2,
      'Cancelled': 3
    }
    return statusMap[statusData] ?? null
  }

  console.warn('Unknown status format:', statusData)
  return null
}

// Script to get circle info
const GET_CIRCLE_INFO = `
import EsusuChain from 0xa89655a0f8e3d113

access(all) fun main(circleId: UInt64): {String: AnyStruct}? {
    return EsusuChain.getCircleInfo(circleId: circleId)
}
`

// Script to get the next circle ID (to know how many circles exist)
const GET_NEXT_CIRCLE_ID = `
import EsusuChain from 0xa89655a0f8e3d113

access(all) fun main(): UInt64 {
    return EsusuChain.nextCircleId
}
`

// Script to check if user is a member of a circle
const CHECK_MEMBER = `
import EsusuChain from 0xa89655a0f8e3d113

access(all) fun main(circleId: UInt64, address: Address): Bool {
    let memberInfo = EsusuChain.getMemberInfo(circleId: circleId, address: address)
    return memberInfo != nil
}
`

// Script to get member info
const GET_MEMBER_INFO = `
import EsusuChain from 0xa89655a0f8e3d113

access(all) fun main(circleId: UInt64, address: Address): {String: AnyStruct}? {
    let memberInfo = EsusuChain.getMemberInfo(circleId: circleId, address: address)
    if memberInfo == nil {
        return nil
    }

    let info = memberInfo!
    return {
        "address": info.address,
        "position": info.position,
        "approvedAmount": info.approvedAmount,
        "contributedAmount": info.contributedAmount,
        "cyclesPaid": info.cyclesPaid,
        "hasReceivedPayout": info.hasReceivedPayout
    }
}
`

// Hook to check if user is a member of a circle
export function useIsMember(circleId, userAddress) {
  const [isMember, setIsMember] = useState(false)
  const [memberInfo, setMemberInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!circleId || !userAddress) {
      setIsMember(false)
      setMemberInfo(null)
      setIsLoading(false)
      return
    }

    async function checkMembership() {
      setIsLoading(true)
      try {
        console.log(`🔍 Checking membership for circle ${circleId}, user ${userAddress}`)
        const memberData = await fcl.query({
          cadence: GET_MEMBER_INFO,
          args: (arg, t) => [
            arg(circleId.toString(), t.UInt64),
            arg(userAddress, t.Address)
          ],
        })

        if (memberData) {
          console.log(`✅ User ${userAddress} IS a member of circle ${circleId}`)
          setIsMember(true)
          setMemberInfo({
            address: memberData.address,
            position: parseInt(memberData.position),
            approvedAmount: parseFloat(memberData.approvedAmount),
            contributedAmount: parseFloat(memberData.contributedAmount),
            cyclesPaid: parseInt(memberData.cyclesPaid),
            hasReceivedPayout: memberData.hasReceivedPayout
          })
        } else {
          console.log(`❌ User ${userAddress} is NOT a member of circle ${circleId}`)
          setIsMember(false)
          setMemberInfo(null)
        }
      } catch (err) {
        console.error('Error checking membership:', err)
        setIsMember(false)
        setMemberInfo(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkMembership()
  }, [circleId, userAddress])

  return { isMember, memberInfo, isLoading }
}

export function useCircleInfo(circleId) {
  const [circle, setCircle] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchCircle = async (force = false) => {
    if (circleId === null || circleId === undefined) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fcl.query({
        cadence: GET_CIRCLE_INFO,
        args: (arg, t) => [arg(circleId.toString(), t.UInt64)],
      })

      if (response) {
        // Transform the response to match our frontend format
        const status = extractStatus(response.status)
        const id = parseInt(response.circleId)

        console.log(`Circle ${id} data:`, {
          rawStatus: response.status,
          extractedStatus: status,
          statusType: typeof status,
          memberCount: response.memberCount,
          allData: response
        })

        setCircle({
          id,
          name: getCircleName(id), // Get saved name from localStorage
          creator: response.creator,
          numberOfMembers: parseInt(response.numberOfMembers),
          contributionAmount: parseFloat(response.contributionAmount),
          cycleDuration: parseFloat(response.cycleDuration),
          currentCycle: parseInt(response.currentCycle),
          status: status ?? 0, // Default to Forming if status is null
          isActive: status === 1, // Active status
          members: [], // Contract doesn't expose member list
          memberCount: parseInt(response.memberCount || 0),
          createdAt: parseFloat(response.createdAt),
          startedAt: response.startedAt ? parseFloat(response.startedAt) : null,
          vaultBalance: parseFloat(response.vaultBalance || 0),
        })
      } else {
        setCircle(null)
      }
    } catch (err) {
      console.error('Error fetching circle:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCircle()
  }, [circleId, refreshTrigger])

  const refetch = () => {
    console.log('🔄 Manually refetching circle data...')
    setRefreshTrigger(prev => prev + 1)
  }

  return { circle, isLoading, error, refetch }
}

export function useAllCircles() {
  const [circles, setCircles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCircles = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First, get the next circle ID to know how many circles exist
      const nextCircleId = await fcl.query({
        cadence: GET_NEXT_CIRCLE_ID,
      })

      const totalCircles = parseInt(nextCircleId)
      console.log(`Total circles to fetch: ${totalCircles}`)

      if (totalCircles === 0) {
        setCircles([])
        setIsLoading(false)
        return
      }

      // Fetch all circles
      const circlePromises = []
      for (let i = 0; i < totalCircles; i++) {
        circlePromises.push(
          fcl.query({
            cadence: GET_CIRCLE_INFO,
            args: (arg, t) => [arg(i.toString(), t.UInt64)],
          }).catch((err) => {
            console.error(`Error fetching circle ${i}:`, err)
            return null
          })
        )
      }

      const results = await Promise.all(circlePromises)
      const validCircles = results
        .filter((circle) => circle !== null)
        .map((circle) => {
          // Parse status
          const status = extractStatus(circle.status)
          const id = parseInt(circle.circleId)

          console.log(`Circle ${id} data:`, {
            rawStatus: circle.status,
            extractedStatus: status,
            statusType: typeof status
          })

          return {
            id,
            name: getCircleName(id), // Get saved name from localStorage
            creator: circle.creator,
            numberOfMembers: parseInt(circle.numberOfMembers),
            contributionAmount: parseFloat(circle.contributionAmount),
            cycleDuration: parseFloat(circle.cycleDuration),
            currentCycle: parseInt(circle.currentCycle),
            status: status ?? 0, // Default to Forming if status is null
            isActive: status === 1, // Active status
            members: [], // Will be empty for now, contract doesn't expose member list
            memberCount: parseInt(circle.memberCount || 0),
            createdAt: parseFloat(circle.createdAt),
            startedAt: circle.startedAt ? parseFloat(circle.startedAt) : null,
            vaultBalance: parseFloat(circle.vaultBalance || 0),
          }
        })

      console.log(`Fetched ${validCircles.length} circles:`, validCircles)
      setCircles(validCircles)
    } catch (err) {
      console.error('Error fetching circles:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCircles()
  }, [])

  return { circles, isLoading, error, refetch: fetchCircles }
}
