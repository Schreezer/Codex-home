'use client'

import React, { createContext, useContext, useState } from 'react'

interface User {
    id: string
    email: string
}

interface AuthContextType {
    user: User | null
    session: { user: User } | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    // Mock user for demonstration
    const mockUser: User = {
        id: 'mock-user-1',
        email: 'chirag@narraite.xyz'
    }

    const [user] = useState<User | null>(mockUser)
    const [session] = useState<{ user: User } | null>({ user: mockUser })
    const [loading] = useState(false)

    const signOut = async () => {
        // This will be handled by SimpleAuth logout
        console.log('Mock auth signOut called')
    }

    const value = {
        user,
        session,
        loading,
        signOut,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}