"use client";

import { useState, useEffect } from "react";
import { Github, GitBranch, Code2, ExternalLink, CheckCircle, Clock, XCircle, AlertCircle, FileText, Eye, GitCommit, Bell, Settings, LogOut, User, FolderGit2, Plus, RefreshCw, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProtectedRoute } from "@/components/protected-route";
import { TaskStatusBadge } from "@/components/task-status-badge";
import { PRStatusBadge } from "@/components/pr-status-badge";
import { useAuth } from "@/contexts/mock-auth-context";
import { ApiService } from "@/lib/api-service";
import { SupabaseService } from "@/lib/supabase-service";
import { Project, Task } from "@/types";
import { ClaudeIcon } from "@/components/icon/claude";
import { OpenAIIcon } from "@/components/icon/openai";
import { toast } from "sonner";
import { SimpleAuth } from "@/components/simple-auth";

interface TaskWithProject extends Task {
    project?: Project
}

export default function Home() {
    const { user, signOut } = useAuth();
    
    // Enhanced logout that handles both simple auth and supabase auth
    const handleLogout = () => {
        // First logout from simple auth
        if (typeof window !== 'undefined' && (window as any).simpleAuthLogout) {
            (window as any).simpleAuthLogout();
        }
        // Then logout from supabase
        signOut();
    };
    const [prompt, setPrompt] = useState("");
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [branch, setBranch] = useState("main");
    const [githubToken, setGithubToken] = useState("");
    const [model, setModel] = useState("claude");
    const [tasks, setTasks] = useState<TaskWithProject[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [githubRepos, setGithubRepos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreTasks, setHasMoreTasks] = useState(true);
    const [taskPage, setTaskPage] = useState(0);
    const TASKS_PER_PAGE = 10;

    // Initialize GitHub token from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedToken = localStorage.getItem('github-token');
            if (savedToken) {
                setGithubToken(savedToken);
            }
        }
    }, []);

    // Load initial data
    useEffect(() => {
        if (user?.id) {
            loadProjects();
            loadTasks();
        }
    }, [user?.id]);

    // Save GitHub token to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (githubToken.trim()) {
                localStorage.setItem('github-token', githubToken);
            } else {
                localStorage.removeItem('github-token');
            }
        }
    }, [githubToken]);

    // Load real data from Supabase
    useEffect(() => {
        if (user?.id) {
            // Ensure mock user exists in database, then load data
            SupabaseService.ensureMockUser(user.id).then(() => {
                loadProjects();
                loadTasks();
            });
        }
    }, [user?.id]);

    // Poll task status for running tasks
    useEffect(() => {
        if (!user?.id) return;

        const runningTasks = tasks.filter(task => task.status === "running" || task.status === "pending");
        if (runningTasks.length === 0) return;

        const interval = setInterval(async () => {
            try {
                const updatedTasks = await Promise.all(
                    runningTasks.map(task => SupabaseService.getTask(task.id))
                );

                setTasks(prevTasks => 
                    prevTasks.map(task => {
                        const updated = updatedTasks.find(t => t && t.id === task.id);
                        if (updated) {
                            // Check for status changes to show notifications
                            if (task.status !== updated.status) {
                                if (updated.status === "completed") {
                                    setNotificationMessage(`🎉 Task #${task.id} completed successfully!`);
                                    setShowNotification(true);
                                    setTimeout(() => setShowNotification(false), 5000);
                                } else if (updated.status === "failed") {
                                    setNotificationMessage(`❌ Task #${task.id} failed. Check details for more info.`);
                                    setShowNotification(true);
                                    setTimeout(() => setShowNotification(false), 5000);
                                }
                            }
                            return { ...task, ...updated };
                        }
                        return task;
                    })
                );
            } catch (error) {
                console.error('Error polling task status:', error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [tasks, user?.id]);

    const loadProjects = async () => {
        if (!user?.id) return;
        
        try {
            const projectData = await ApiService.getProjects(user.id);
            setProjects(projectData);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const loadGitHubRepositories = async () => {
        if (!githubToken.trim()) {
            toast.error('Please configure your GitHub token in Settings first');
            return;
        }

        setIsLoadingRepos(true);
        try {
            const data = await ApiService.fetchGitHubRepositories(githubToken);
            setGithubRepos(data.repositories);
            toast.success(`Loaded ${data.total_count} GitHub repositories`);
        } catch (error) {
            console.error('Error fetching GitHub repositories:', error);
            toast.error(`Failed to fetch GitHub repositories: ${error}`);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const loadTasks = async (reset: boolean = true) => {
        if (!user?.id) return;
        
        try {
            const taskData = await SupabaseService.getTasks(undefined, {
                limit: TASKS_PER_PAGE,
                offset: 0
            }, user.id);
            
            if (reset) {
                setTasks(taskData);
                setTaskPage(0);
                setHasMoreTasks(taskData.length === TASKS_PER_PAGE);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    const loadMoreTasks = async () => {
        if (!user?.id || isLoadingMore || !hasMoreTasks) return;
        
        try {
            setIsLoadingMore(true);
            const nextPage = taskPage + 1;
            const taskData = await SupabaseService.getTasks(undefined, {
                limit: TASKS_PER_PAGE,
                offset: nextPage * TASKS_PER_PAGE
            }, user.id);
            
            if (taskData.length > 0) {
                setTasks(prev => [...prev, ...taskData]);
                setTaskPage(nextPage);
                setHasMoreTasks(taskData.length === TASKS_PER_PAGE);
            } else {
                setHasMoreTasks(false);
            }
        } catch (error) {
            console.error('Error loading more tasks:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleStartTask = async () => {
        if (!prompt.trim() || !githubToken.trim()) {
            toast.error('Please provide both a prompt and GitHub token');
            return;
        }

        if (!user?.id) {
            toast.error('User not authenticated');
            return;
        }

        let repoUrl = "";
        let projectId = undefined;

        if (selectedProject.startsWith("project-")) {
            // Using an existing project
            const projectIdStr = selectedProject.replace("project-", "");
            const project = projects.find(p => p.id.toString() === projectIdStr);
            if (project) {
                repoUrl = project.repo_url;
                projectId = project.id;
            }
        } else if (selectedProject.startsWith("repo-")) {
            // Using a GitHub repository
            const repoIdStr = selectedProject.replace("repo-", "");
            const repo = githubRepos.find(r => r.id.toString() === repoIdStr);
            if (repo) {
                repoUrl = repo.html_url;
                // We could optionally create a project for this repo
            }
        } else {
            toast.error('Please select a repository from the dropdown.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await ApiService.startTask(user.id, {
                prompt: prompt.trim(),
                repo_url: repoUrl,
                branch: branch,
                github_token: githubToken,
                model: model,
                project_id: projectId
            });

            // Create a new task object for immediate display
            const newTask = {
                id: response.task_id,
                status: "pending",
                repo_url: repoUrl,
                target_branch: branch,
                agent: model,
                chat_messages: [{
                    role: 'user',
                    content: prompt.trim(),
                    timestamp: new Date().toISOString()
                }],
                created_at: new Date().toISOString(),
                user_id: user.id,
                project_id: projectId || null,
                project: projects.find(p => p.id === projectId)
            } as unknown as TaskWithProject;

            setTasks(prev => [newTask, ...prev]);
            setPrompt("");
            
            // Show success notification
            setNotificationMessage(`🚀 Task #${response.task_id} started successfully!`);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
        } catch (error) {
            toast.error(`Error starting task: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "pending": return "secondary";
            case "running": return "default";
            case "completed": return "default";
            case "failed": return "destructive";
            default: return "outline";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending": return <Clock className="w-3 h-3" />;
            case "running": return <AlertCircle className="w-3 h-3" />;
            case "completed": return <CheckCircle className="w-3 h-3" />;
            case "failed": return <XCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    const getAgentIcon = (agent: string) => {
        switch (agent) {
            case "claude": return <ClaudeIcon className="w-3 h-3" />;
            case "codex": return <OpenAIIcon className="w-3 h-3" />;
            default: return null;
        }
    };

    return (
        <SimpleAuth>
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Notification Banner */}
            {showNotification && (
                <div className="bg-green-600 text-white px-6 py-3 text-center relative">
                    <div className="flex items-center justify-center gap-2">
                        <Bell className="w-4 h-4" />
                        <span>{notificationMessage}</span>
                    </div>
                    <button
                        onClick={() => setShowNotification(false)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 safe-top">
                <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                                <Code2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">Async Code</h1>
                                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Manage parallel AI code agents (Codex & Claude)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Desktop navigation */}
                            <div className="hidden sm:flex items-center gap-4">
                                <Link href="/projects">
                                    <Button variant="outline" className="gap-2">
                                        <FolderGit2 className="w-4 h-4" />
                                        Projects
                                    </Button>
                                </Link>
                                
                                <Link href="/settings">
                                    <Button variant="outline" className="gap-2">
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </Button>
                                </Link>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Avatar className="cursor-pointer">
                                            <AvatarFallback>
                                                {user?.email ? 
                                                    user.email.split('@')[0].slice(0, 2).toUpperCase() : 
                                                    'U'
                                                }
                                            </AvatarFallback>
                                        </Avatar>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <div className="p-2">
                                            <p className="text-sm font-medium">{user?.email}</p>
                                            <p className="text-xs text-slate-500">Signed in</p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600">
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {/* Mobile navigation */}
                            <div className="sm:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm">
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <div className="p-2">
                                            <p className="text-sm font-medium">{user?.email}</p>
                                            <p className="text-xs text-slate-500">Signed in</p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/projects" className="flex items-center gap-2">
                                                <FolderGit2 className="w-4 h-4" />
                                                Projects
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/settings" className="flex items-center gap-2">
                                                <Settings className="w-4 h-4" />
                                                Settings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600">
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl lg:max-w-6xl safe-bottom">
                <div className="space-y-6 sm:space-y-8">
                    {/* Task Creation Section */}
                    <div className="space-y-6">
                        {/* Main Input Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Code Generation Prompt</CardTitle>
                                <CardDescription>
                                    Describe the feature, bug fix, or enhancement you want AI to implement
                                </CardDescription>
                                {!githubToken.trim() && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                        <div className="flex items-start gap-2 text-amber-800">
                                            <Github className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm">
                                                <strong>GitHub Token Required:</strong> Please configure your GitHub token in{" "}
                                                <Link href="/settings" className="underline hover:text-amber-900">
                                                    Settings
                                                </Link>{" "}
                                                to enable code generation.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="prompt">Your Prompt</Label>
                                    <Textarea
                                        id="prompt"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="e.g., Add a dark mode toggle to the navigation bar with persistent user preferences..."
                                        className="min-h-[120px] resize-none"
                                    />
                                </div>

                                <Separator />

                                {/* Repository Configuration */}
                                <div className="space-y-4">
                                    <h3 className="font-medium text-slate-900 flex items-center gap-2">
                                        <Github className="w-4 h-4" />
                                        Repository Settings
                                    </h3>
                                    
                                    {/* Project Selection - Full Width */}
                                    <div className="space-y-2">
                                        <Label htmlFor="project" className="flex items-center gap-2">
                                            <FolderGit2 className="w-3 h-3" />
                                            Project / Repository
                                        </Label>
                                        <div className="flex gap-2">
                                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                                <SelectTrigger id="project" className="flex-1">
                                                    <SelectValue placeholder="Select a repository" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Existing Projects */}
                                                    {projects.length > 0 && (
                                                        <>
                                                            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                                Saved Projects
                                                            </div>
                                                            {projects.map((project) => (
                                                                <SelectItem key={`project-${project.id}`} value={`project-${project.id}`}>
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <FolderGit2 className="w-3 h-3 flex-shrink-0 text-blue-600" />
                                                                        <span className="truncate">{project.name}</span>
                                                                        <span className="text-slate-500 text-xs flex-shrink-0">
                                                                            ({project.repo_owner}/{project.repo_name})
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                            <div className="h-px bg-slate-200 my-1" />
                                                        </>
                                                    )}
                                                    
                                                    {/* GitHub Repositories */}
                                                    {githubRepos.length > 0 && (
                                                        <>
                                                            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                                GitHub Repositories
                                                            </div>
                                                            {githubRepos.slice(0, 20).map((repo) => (
                                                                <SelectItem key={`repo-${repo.id}`} value={`repo-${repo.id}`}>
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <Github className="w-3 h-3 flex-shrink-0 text-gray-600" />
                                                                        <span className="truncate">{repo.name}</span>
                                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                                            {repo.private && <Lock className="w-2 h-2 text-amber-600" />}
                                                                            {repo.language && (
                                                                                <span className="text-slate-500 text-xs">
                                                                                    {repo.language}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                            {githubRepos.length > 20 && (
                                                                <div className="px-2 py-1 text-xs text-slate-500">
                                                                    ... and {githubRepos.length - 20} more repositories
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={loadGitHubRepositories}
                                                disabled={isLoadingRepos || !githubToken.trim()}
                                                title="Load GitHub repositories"
                                            >
                                                {isLoadingRepos ? (
                                                    <div className="animate-spin">
                                                        <RefreshCw className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <RefreshCw className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                        {projects.length === 0 && githubRepos.length === 0 && (
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                                                <div className="text-sm text-slate-600">
                                                    {!githubToken.trim() ? (
                                                        <>
                                                            Configure your GitHub token in{" "}
                                                            <Link href="/settings" className="text-blue-600 hover:underline">
                                                                Settings
                                                            </Link>{" "}
                                                            to load your repositories.
                                                        </>
                                                    ) : (
                                                        <>
                                                            Click the refresh button to load your GitHub repositories, or{" "}
                                                            <Link href="/projects" className="text-blue-600 hover:underline">
                                                                create a project
                                                            </Link>.
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Branch and Model in a responsive grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="branch" className="flex items-center gap-2">
                                                <GitBranch className="w-3 h-3" />
                                                Branch
                                            </Label>
                                            <Input
                                                id="branch"
                                                value={branch}
                                                onChange={(e) => setBranch(e.target.value)}
                                                placeholder="main"
                                                className="w-full"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="model" className="flex items-center gap-2">
                                                <Code2 className="w-3 h-3" />
                                                Code Agent
                                            </Label>
                                            <Select value={model} onValueChange={setModel}>
                                                <SelectTrigger id="model" className="w-full">
                                                    <SelectValue placeholder="Select an AI model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="claude">
                                                        <div className="flex items-center gap-3">
                                                            <ClaudeIcon className="w-4 h-4 flex-shrink-0" />
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">Claude Code</span>
                                                                <span className="text-xs text-slate-500">• Anthropic's agentic coding tool</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="codex">
                                                        <div className="flex items-center gap-3">
                                                            <OpenAIIcon className="w-4 h-4 flex-shrink-0" />
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">Codex</span>
                                                                <span className="text-xs text-slate-500">• OpenAI's lightweight coding agent</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center sm:justify-start pt-2">
                                    <Button
                                        onClick={handleStartTask}
                                        disabled={isLoading || !selectedProject || !prompt.trim() || !githubToken.trim()}
                                        className="w-full sm:w-auto gap-2 rounded-full min-w-[100px]"
                                        size="lg"
                                    >
                                        <Code2 className="w-4 h-4" />
                                        {isLoading ? 'Coding...' : 'Start Coding'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Running Tasks Summary */}
                        {tasks.filter(task => task.status === "running" || task.status === "pending").length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-blue-600" />
                                        Active Tasks
                                    </CardTitle>
                                    <CardDescription>
                                        {tasks.filter(task => task.status === "running" || task.status === "pending").length} tasks currently running
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="animate-spin">
                                                <AlertCircle className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-blue-900">AI agents are working on your code...</div>
                                                <div className="text-sm text-blue-700 mt-1">
                                                    You can start additional tasks or check individual task progress in the task list.
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 bg-blue-100 rounded-full h-2">
                                            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Task List Section */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">All Tasks</CardTitle>
                                    <div className="text-sm text-slate-500">
                                        {tasks.length} tasks loaded
                                    </div>
                                </div>
                                <CardDescription>
                                    Track all your automation tasks
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {tasks.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No tasks yet</p>
                                        <p className="text-xs">Start your first automation above</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                            {tasks.map((task) => (
                                                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <TaskStatusBadge status={task.status || ''} />
                                                            {task.pr_url && task.pr_number && (
                                                                <PRStatusBadge 
                                                                    prUrl={task.pr_url}
                                                                    prNumber={task.pr_number}
                                                                    prBranch={task.pr_branch}
                                                                    variant="badge"
                                                                    size="sm"
                                                                />
                                                            )}
                                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                #{task.id} • {getAgentIcon(task.agent || '')} {task.agent?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-900 truncate">
                                                            {(task.chat_messages as any[])?.[0]?.content?.substring(0, 50) || ''}...
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                            {task.project ? (
                                                                <>
                                                                    <FolderGit2 className="w-3 h-3" />
                                                                    {task.project.repo_name}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Github className="w-3 h-3" />
                                                                    Custom
                                                                </>
                                                            )}
                                                            <span>•</span>
                                                            <span>{new Date(task.created_at || '').toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {task.status === "completed" && (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        )}
                                                        {task.status === "running" && (
                                                            <div className="animate-spin">
                                                                <AlertCircle className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                        )}
                                                        <Link href={`/tasks/${task.id}`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="w-3 h-3" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Load More Button */}
                                        {hasMoreTasks && (
                                            <div className="flex justify-center pt-4">
                                                <Button 
                                                    onClick={loadMoreTasks}
                                                    disabled={isLoadingMore}
                                                    variant="outline"
                                                    className="gap-2"
                                                >
                                                    {isLoadingMore ? (
                                                        <>
                                                            <div className="animate-spin">
                                                                <AlertCircle className="w-4 h-4" />
                                                            </div>
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-4 h-4" />
                                                            Load More
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
            </ProtectedRoute>
        </SimpleAuth>
    );
}