"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code2, Shield } from "lucide-react";
import { toast } from "sonner";

const CORRECT_USERNAME = "chirag";
const CORRECT_PASSWORD = "CHIRAG1313vadercoder";

interface SimpleAuthProps {
    children: React.ReactNode;
}

export function SimpleAuth({ children }: SimpleAuthProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Check if user is already authenticated
    useEffect(() => {
        const authStatus = localStorage.getItem('simple-auth');
        if (authStatus === 'authenticated') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate login delay for security
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
            localStorage.setItem('simple-auth', 'authenticated');
            setIsAuthenticated(true);
            toast.success("Welcome back, Chirag!");
        } else {
            toast.error("Invalid credentials. Please try again.");
            setPassword("");
        }
        
        setIsLoading(false);
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('simple-auth');
        setIsAuthenticated(false);
        setUsername("");
        setPassword("");
        toast.success("Logged out successfully");
    }, []);

    // Make logout available globally
    useEffect(() => {
        if (isAuthenticated) {
            (window as any).simpleAuthLogout = handleLogout;
        }
        return () => {
            // Cleanup on unmount
            if ((window as any).simpleAuthLogout) {
                delete (window as any).simpleAuthLogout;
            }
        };
    }, [isAuthenticated, handleLogout]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center space-y-4">
                        <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto">
                            <Code2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">Async Code</CardTitle>
                            <CardDescription className="text-base">
                                Sign in to access AI code automation
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full gap-2" 
                                size="lg"
                                disabled={isLoading || !username || !password}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        Sign In
                                    </>
                                )}
                            </Button>
                        </form>
                        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 text-center">
                                🔒 Secure access to AI code generation platform
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div>
            {children}
        </div>
    );
}