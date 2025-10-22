import { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'
import * as t from '@onflow/types'

// Script to get circle info
const GET_CIRCLE_INFO = `
import EsusuChain from 0xa89655a0f8e3d113

access(all) fun main(circleId: UInt64): {String: AnyStruct}? {
    return EsusuChain.getCircleInfo(circleId: circleId)
}
`

// Script to get all circle IDs (we'll need to implement this or track them)
const GET_ALL_CIRCLES = `
import EsusuChain from 0xa89655a0f8e3d113

access(all) fun main(): [UInt64] {
    return EsusuChain.getAllCircleIds()
}
`

export function useCircleInfo(circleId) {
  const [circle, setCircle] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (circleId === null || circleId === undefined) {
      setIsLoading(false)
      return
    }

    async function fetchCircle() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fcl.query({
          cadence: GET_CIRCLE_INFO,
          args: (arg, t) => [arg(circleId.toString(), t.UInt64)],
        })

        if (response) {
          // Transform the response to match our frontend format
          setCircle({
            id: parseInt(response.id),
            creator: response.creator,
            numberOfMembers: parseInt(response.numberOfMembers),
            contributionAmount: parseFloat(response.contributionAmount),
            cycleDuration: parseFloat(response.cycleDuration),
            currentCycle: parseInt(response.currentCycle),
            isActive: response.isActive,
            members: response.members || [],
            lastContributionTime: parseFloat(response.lastContributionTime),
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

    fetchCircle()
  }, [circleId])

  return { circle, isLoading, error }
}

export function useAllCircles() {
  const [circles, setCircles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCircles = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // For now, we'll try to fetch circles 0-10
      // In production, you'd want a contract method to return all circle IDs
      const circlePromises = []
      for (let i = 0; i < 10; i++) {
        circlePromises.push(
          fcl.query({
            cadence: GET_CIRCLE_INFO,
            args: (arg, t) => [arg(i.toString(), t.UInt64)],
          }).catch(() => null) // Return null if circle doesn't exist
        )
      }

      const results = await Promise.all(circlePromises)
      const validCircles = results
        .filter((circle) => circle !== null)
        .map((circle) => ({
          id: parseInt(circle.id),
          creator: circle.creator,
          numberOfMembers: parseInt(circle.numberOfMembers),
          contributionAmount: parseFloat(circle.contributionAmount),
          cycleDuration: parseFloat(circle.cycleDuration),
          currentCycle: parseInt(circle.currentCycle),
          isActive: circle.isActive,
          members: circle.members || [],
          lastContributionTime: parseFloat(circle.lastContributionTime),
        }))

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
