"use client";

import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { githubLight } from "@uiw/codemirror-theme-github";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save, Key, Settings2, Shield } from "lucide-react";
import { toast } from "sonner";
import { SupabaseService } from "@/lib/supabase-service";
import { useMockUserProfile } from "@/hooks/useMockUserProfile";

interface CodeAgentConfig {
    claudeCode?: {
        env?: Record<string, string>;
        credentials?: Record<string, any> | null;
        oauth?: {
            access_token?: string;
            refresh_token?: string;
            expires_at?: number;
        } | null;
        useOAuth?: boolean;
    };
    codex?: {
        env?: Record<string, string>;
    };
}

const DEFAULT_CLAUDE_ENV = {
    ANTHROPIC_API_KEY: "",
    // Add other Claude-specific env vars here if needed
};

const DEFAULT_CLAUDE_CREDENTIALS = {
    // Example structure - user can customize
};

const DEFAULT_CLAUDE_OAUTH = {
    access_token: "",
    refresh_token: "",
    expires_at: 0
};

const DEFAULT_CODEX_ENV = {
    OPENAI_API_KEY: "",
    DISABLE_SANDBOX: "yes",
    CONTINUE_ON_BROWSER: "no",
    // Add other Codex-specific env vars here if needed
};

// Helper function to check if credentials is meaningful (not empty/null/undefined)
const hasMeaningfulCredentials = (creds: any): boolean => {
    if (!creds || creds === null || creds === undefined || creds === '') {
        return false;
    }
    if (typeof creds === 'object' && Object.keys(creds).length === 0) {
        return false;
    }
    return true;
};

export function CodeAgentSettings() {
    const { profile, refreshProfile, updateProfile } = useMockUserProfile();
    const [claudeEnv, setClaudeEnv] = useState("");
    const [claudeCredentials, setClaudeCredentials] = useState("");
    const [claudeOAuth, setClaudeOAuth] = useState("");
    const [useOAuth, setUseOAuth] = useState(false);
    const [codexEnv, setCodexEnv] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ 
        claudeEnv?: string; 
        claudeCredentials?: string; 
        claudeOAuth?: string;
        codexEnv?: string; 
    }>({});

    // Load settings from profile on mount
    useEffect(() => {
        if (profile?.preferences) {
            const prefs = profile.preferences as any; // Use any for backward compatibility
            
            // Handle backward compatibility for Claude config
            let claudeConfig: any = {};
            if (prefs.claudeCode) {
                // Check if it's the new structure (has env/credentials properties)
                if (prefs.claudeCode.env || prefs.claudeCode.credentials) {
                    claudeConfig = prefs.claudeCode;
                } else {
                    // Old structure - migrate to new format
                    const { credentials, ...envVars } = prefs.claudeCode;
                    
                    claudeConfig = {
                        env: envVars,
                        credentials: hasMeaningfulCredentials(credentials) ? credentials : null
                    };
                }
            }
            
            // Handle backward compatibility for Codex config  
            let codexConfig: any = {};
            if (prefs.codex) {
                // Check if it's the new structure
                if (prefs.codex.env) {
                    codexConfig = prefs.codex;
                } else {
                    // New structure for codex
                    codexConfig = { env: prefs.codex };
                }
            } else if (prefs.codexCLI) {
                // Old codexCLI key - migrate to new codex key
                codexConfig = { env: prefs.codexCLI };
            }
            
            setClaudeEnv(JSON.stringify(claudeConfig.env || DEFAULT_CLAUDE_ENV, null, 2));
            setClaudeCredentials(JSON.stringify(claudeConfig.credentials || DEFAULT_CLAUDE_CREDENTIALS, null, 2));
            setClaudeOAuth(JSON.stringify(claudeConfig.oauth || DEFAULT_CLAUDE_OAUTH, null, 2));
            setUseOAuth(claudeConfig.useOAuth || false);
            setCodexEnv(JSON.stringify(codexConfig.env || DEFAULT_CODEX_ENV, null, 2));
        } else {
            setClaudeEnv(JSON.stringify(DEFAULT_CLAUDE_ENV, null, 2));
            setClaudeCredentials(JSON.stringify(DEFAULT_CLAUDE_CREDENTIALS, null, 2));
            setClaudeOAuth(JSON.stringify(DEFAULT_CLAUDE_OAUTH, null, 2));
            setUseOAuth(false);
            setCodexEnv(JSON.stringify(DEFAULT_CODEX_ENV, null, 2));
        }
    }, [profile]);

    const validateJSON = (value: string, key: string) => {
        try {
            JSON.parse(value);
            setErrors(prev => ({ ...prev, [key]: undefined }));
            return true;
        } catch (e) {
            setErrors(prev => ({ ...prev, [key]: "Invalid JSON format" }));
            return false;
        }
    };

    const handleSave = async () => {
        // Validate all JSONs
        const isClaudeEnvValid = validateJSON(claudeEnv, "claudeEnv");
        const isClaudeCredentialsValid = validateJSON(claudeCredentials, "claudeCredentials");
        const isClaudeOAuthValid = validateJSON(claudeOAuth, "claudeOAuth");
        const isCodexEnvValid = validateJSON(codexEnv, "codexEnv");

        if (!isClaudeEnvValid || !isClaudeCredentialsValid || !isClaudeOAuthValid || !isCodexEnvValid) {
            toast.error("Please fix JSON errors before saving");
            return;
        }

        setIsLoading(true);
        try {
            const claudeEnvConfig = JSON.parse(claudeEnv);
            const claudeCredentialsConfig = JSON.parse(claudeCredentials);
            const claudeOAuthConfig = JSON.parse(claudeOAuth);
            const codexEnvConfig = JSON.parse(codexEnv);

            const preferences: CodeAgentConfig = {
                claudeCode: {
                    env: claudeEnvConfig,
                    credentials: hasMeaningfulCredentials(claudeCredentialsConfig) ? claudeCredentialsConfig : null,
                    oauth: hasMeaningfulCredentials(claudeOAuthConfig) ? claudeOAuthConfig : null,
                    useOAuth: useOAuth,
                },
                codex: {
                    env: codexEnvConfig,
                },
            };

            // Merge with existing preferences if any
            const existingPrefs = (profile?.preferences || {}) as Record<string, any>;
            
            // Clean up old keys during migration
            const { codexCLI, ...cleanedPrefs } = existingPrefs;
            
            const mergedPrefs = {
                ...cleanedPrefs,
                ...preferences,
            };

            // Save to both localStorage (mock) and Supabase (real persistence)
            await updateProfile({ preferences: mergedPrefs });
            
            // Also save to Supabase for real persistence
            try {
                await SupabaseService.ensureMockUser('mock-user-chirag');
                await SupabaseService.updateUserProfile({ preferences: mergedPrefs });
            } catch (error) {
                console.warn('Could not save to Supabase, using localStorage only:', error);
            }
            
            await refreshProfile();
            
            // Provide feedback about credentials handling
            const credentialsMessage = hasMeaningfulCredentials(claudeCredentialsConfig) 
                ? "Claude credentials will be configured" 
                : "Claude credentials are empty and will be skipped";
            
            toast.success(`Code agent settings saved successfully. ${credentialsMessage}`);
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Code Agent Settings</CardTitle>
                    <CardDescription>
                        Configure environment variables and credentials for each code agent. These settings will be used when creating containers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Important:</strong> Environment variables and credentials are stored separately. Store sensitive API keys in environment variables, and authentication configs in credentials.
                        </AlertDescription>
                    </Alert>

                    {/* Claude Code Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <Settings2 className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">Claude Code Configuration</h3>
                        </div>
                        
                        {/* Claude Environment Variables */}
                        <div className="space-y-2">
                            <Label htmlFor="claude-env" className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4" />
                                Environment Variables
                            </Label>
                            <div className="border rounded-lg overflow-hidden">
                                <CodeMirror
                                    id="claude-env"
                                    value={claudeEnv}
                                    height="200px"
                                    extensions={[javascript({ jsx: false })]}
                                    theme={githubLight}
                                    onChange={(value) => {
                                        setClaudeEnv(value);
                                        validateJSON(value, "claudeEnv");
                                    }}
                                    placeholder={JSON.stringify(DEFAULT_CLAUDE_ENV, null, 2)}
                                />
                            </div>
                            {errors.claudeEnv && (
                                <p className="text-sm text-red-500 mt-1">{errors.claudeEnv}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Configure environment variables for Claude Code CLI (@anthropic-ai/claude-code)
                            </p>
                        </div>

                        {/* Claude Credentials */}
                        <div className="space-y-2">
                            <Label htmlFor="claude-credentials" className="flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                Credentials (Optional)
                            </Label>
                            <div className="border rounded-lg overflow-hidden">
                                <CodeMirror
                                    id="claude-credentials"
                                    value={claudeCredentials}
                                    height="150px"
                                    extensions={[javascript({ jsx: false })]}
                                    theme={githubLight}
                                    onChange={(value) => {
                                        setClaudeCredentials(value);
                                        validateJSON(value, "claudeCredentials");
                                    }}
                                    placeholder={JSON.stringify(DEFAULT_CLAUDE_CREDENTIALS, null, 2)}
                                />
                            </div>
                            {errors.claudeCredentials && (
                                <p className="text-sm text-red-500 mt-1">{errors.claudeCredentials}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Configure authentication credentials for Claude Code CLI (will be saved to ~/.claude/.credentials.json)
                            </p>
                        </div>

                        {/* Claude OAuth Settings */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="use-oauth"
                                    checked={useOAuth}
                                    onChange={(e) => setUseOAuth(e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor="use-oauth" className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Use Claude OAuth (Claude Max subscribers)
                                </Label>
                            </div>
                            
                            {useOAuth && (
                                <div className="space-y-2 ml-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                                    <Label htmlFor="claude-oauth" className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        OAuth Tokens
                                    </Label>
                                    <div className="border rounded-lg overflow-hidden">
                                        <CodeMirror
                                            id="claude-oauth"
                                            value={claudeOAuth}
                                            height="120px"
                                            extensions={[javascript({ jsx: false })]}
                                            theme={githubLight}
                                            onChange={(value) => {
                                                setClaudeOAuth(value);
                                                validateJSON(value, "claudeOAuth");
                                            }}
                                            placeholder={JSON.stringify(DEFAULT_CLAUDE_OAUTH, null, 2)}
                                        />
                                    </div>
                                    {errors.claudeOAuth && (
                                        <p className="text-sm text-red-500 mt-1">{errors.claudeOAuth}</p>
                                    )}
                                    <div className="text-sm text-blue-700">
                                        <p className="font-medium">How to get your OAuth tokens:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            <li><strong>Linux:</strong> ~/.claude/.credentials.json</li>
                                            <li><strong>macOS:</strong> Keychain → search "claude" → show password</li>
                                        </ul>
                                        <p className="mt-2 text-xs">
                                            Note: OAuth tokens will be automatically refreshed when they expire.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            <Alert>
                                <Shield className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Authentication Priority:</strong> When OAuth is enabled, it takes precedence over API keys and credentials. 
                                    This allows Claude Max subscribers to use their existing subscription instead of separate API billing.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>

                    {/* Codex CLI Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <Settings2 className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold">Codex CLI Configuration</h3>
                        </div>
                        
                        {/* Codex Environment Variables */}
                        <div className="space-y-2">
                            <Label htmlFor="codex-env" className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4" />
                                Environment Variables
                            </Label>
                            <div className="border rounded-lg overflow-hidden">
                                <CodeMirror
                                    id="codex-env"
                                    value={codexEnv}
                                    height="200px"
                                    extensions={[javascript({ jsx: false })]}
                                    theme={githubLight}
                                    onChange={(value) => {
                                        setCodexEnv(value);
                                        validateJSON(value, "codexEnv");
                                    }}
                                    placeholder={JSON.stringify(DEFAULT_CODEX_ENV, null, 2)}
                                />
                            </div>
                            {errors.codexEnv && (
                                <p className="text-sm text-red-500 mt-1">{errors.codexEnv}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Configure environment variables for Codex CLI (@openai/codex)
                            </p>
                        </div>
                        
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Codex CLI does not require separate credentials configuration. All settings are handled via environment variables.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isLoading || !!errors.claudeEnv || !!errors.claudeCredentials || !!errors.claudeOAuth || !!errors.codexEnv}
                        className="w-full"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Settings"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}