"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'

/**
 * Socket.IO Context for Real-Time Communication
 * Manages WebSocket connections and real-time updates
 * Provides submission and batch-related real-time events
 */

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinBatch: (batchId: string) => void
  leaveBatch: (batchId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Only connect when user is authenticated
    if (user) {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        timeout: 20000,
        forceNew: true
      })

      socketInstance.on('connect', () => {
        console.log('Connected to Socket.IO server')
        setIsConnected(true)
      })

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server')
        setIsConnected(false)
      })

      socketInstance.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error)
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
        setIsConnected(false)
      })

      socketInstance.on('error', (error) => {
        console.error('Socket.IO error:', error)
        setIsConnected(false)
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [user])

  /**
   * Join a batch room for real-time updates
   */
  const joinBatch = (batchId: string) => {
    if (socket && isConnected) {
      socket.emit('joinBatch', batchId)
      console.log(`Joined batch room: ${batchId}`)
    }
  }

  /**
   * Leave a batch room
   */
  const leaveBatch = (batchId: string) => {
    if (socket && isConnected) {
      socket.emit('leaveBatch', batchId)
      console.log(`Left batch room: ${batchId}`)
    }
  }

  const value = {
    socket,
    isConnected,
    joinBatch,
    leaveBatch
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

/**
 * Hook to use Socket.IO context
 */
export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
