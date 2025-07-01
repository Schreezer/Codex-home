"use client";

import { useState, useCallback } from "react";

// Mock user profile for SimpleAuth
const MOCK_USER = {
    id: 'mock-user-chirag',
    email: 'chirag@narraite.xyz',
    name: 'Chirag',
    preferences: {} as Record<string, any>
};

export function useMockUserProfile() {
    const [profile, setProfile] = useState(MOCK_USER);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const refreshProfile = useCallback(async () => {
        // For mock implementation, just return the stored profile
        setIsLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Load preferences from localStorage if available
        try {
            const stored = localStorage.getItem('mock-user-preferences');
            if (stored) {
                const preferences = JSON.parse(stored);
                setProfile(prev => ({ ...prev, preferences }));
            }
        } catch (err) {
            console.warn('Failed to load stored preferences:', err);
        }
        
        setIsLoading(false);
    }, []);

    const updateProfile = useCallback(async (updates: { preferences?: Record<string, any> }) => {
        setIsLoading(true);
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const updatedProfile = { ...profile, ...updates };
            setProfile(updatedProfile);
            
            // Store preferences in localStorage
            if (updates.preferences) {
                localStorage.setItem('mock-user-preferences', JSON.stringify(updates.preferences));
            }
            
            setError(null);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [profile]);

    return {
        profile,
        isLoading,
        error,
        refreshProfile,
        updateProfile,
    };
}