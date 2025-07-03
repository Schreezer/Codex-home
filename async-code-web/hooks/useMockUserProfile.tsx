"use client";

import { useState, useCallback, useEffect } from "react";

// Mock user profile for SimpleAuth (using proper UUID)
const MOCK_USER = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'chirag@narraite.xyz',
    name: 'Chirag',
    preferences: {} as Record<string, any>
};

export function useMockUserProfile() {
    const [profile, setProfile] = useState(MOCK_USER);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const refreshProfile = useCallback(async () => {
        // For mock implementation, load from both localStorage and Supabase
        setIsLoading(true);
        
        let preferences = {};
        
        // Try to load from Supabase first (more reliable)
        try {
            const { SupabaseService } = await import("@/lib/supabase-service");
            await SupabaseService.ensureMockUser(MOCK_USER.id);
            
            const { getSupabase } = await import("@/lib/supabase");
            const supabase = getSupabase();
            
            const { data: user, error } = await supabase
                .from('users')
                .select('preferences')
                .eq('id', MOCK_USER.id)
                .single();
            
            if (!error && user?.preferences) {
                preferences = user.preferences;
                // Also save to localStorage as backup
                localStorage.setItem('mock-user-preferences', JSON.stringify(preferences));
            }
        } catch (err) {
            console.warn('Failed to load from Supabase, trying localStorage:', err);
        }
        
        // Fallback to localStorage if Supabase failed
        if (Object.keys(preferences).length === 0) {
            try {
                const stored = localStorage.getItem('mock-user-preferences');
                if (stored) {
                    preferences = JSON.parse(stored);
                }
            } catch (err) {
                console.warn('Failed to load stored preferences:', err);
            }
        }
        
        setProfile(prev => ({ ...prev, preferences }));
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

    // Auto-load preferences from localStorage on mount
    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    return {
        profile,
        isLoading,
        error,
        refreshProfile,
        updateProfile,
    };
}