"use client";

import { useState, useEffect } from "react";
import { Github, RefreshCw, Plus, Lock, Unlock, Star, GitFork, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ApiService } from "@/lib/api-service";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  fork: boolean;
  html_url: string;
  default_branch: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

interface GitHubRepoSelectorProps {
  onRepositorySelect: (repo: GitHubRepository) => void;
  onClose: () => void;
}

export function GitHubRepoSelector({ onRepositorySelect, onClose }: GitHubRepoSelectorProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [githubToken, setGithubToken] = useState("");

  useEffect(() => {
    // Get GitHub token from localStorage
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('github-token');
      if (savedToken) {
        setGithubToken(savedToken);
        fetchRepositories(savedToken);
      }
    }
  }, []);

  const fetchRepositories = async (token?: string) => {
    const tokenToUse = token || githubToken;
    
    if (!tokenToUse) {
      toast.error('Please configure your GitHub token in Settings first');
      return;
    }

    setLoading(true);
    try {
      const data = await ApiService.fetchGitHubRepositories(tokenToUse);
      setRepositories(data.repositories);
      toast.success(`Loaded ${data.total_count} repositories`);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error(`Failed to fetch repositories: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.language?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRepositorySelect = (repo: GitHubRepository) => {
    onRepositorySelect(repo);
    onClose();
    toast.success(`Selected repository: ${repo.full_name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Github className="w-5 h-5" />
            Select GitHub Repository
          </h3>
          <p className="text-sm text-slate-600">
            Choose a repository to create a new project
          </p>
        </div>
        <Button
          onClick={() => fetchRepositories()}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Input
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Repository List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
            <p className="text-slate-600">Loading repositories...</p>
          </div>
        ) : filteredRepositories.length === 0 ? (
          <div className="text-center py-8">
            <Github className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h4 className="text-lg font-medium text-slate-900 mb-2">
              {repositories.length === 0 ? 'No repositories found' : 'No matching repositories'}
            </h4>
            <p className="text-slate-600 mb-4">
              {repositories.length === 0 
                ? 'Make sure your GitHub token is configured in Settings'
                : 'Try adjusting your search terms'
              }
            </p>
            {repositories.length === 0 && (
              <Button
                onClick={() => fetchRepositories()}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Load Repositories
              </Button>
            )}
          </div>
        ) : (
          filteredRepositories.map((repo) => (
            <Card 
              key={repo.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRepositorySelect(repo)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-slate-900">{repo.name}</h4>
                      <div className="flex items-center gap-1">
                        {repo.private ? (
                          <Lock className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Unlock className="w-3 h-3 text-green-600" />
                        )}
                        {repo.fork && (
                          <Badge variant="secondary" className="text-xs">
                            Fork
                          </Badge>
                        )}
                        {repo.language && (
                          <Badge variant="outline" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {repo.description && (
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {repo.stargazers_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="w-3 h-3" />
                        {repo.forks_count}
                      </div>
                      <span>
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(repo.html_url, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRepositorySelect(repo);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {repositories.length > 0 && (
        <div className="text-center text-sm text-slate-500">
          Showing {filteredRepositories.length} of {repositories.length} repositories
        </div>
      )}
    </div>
  );
}