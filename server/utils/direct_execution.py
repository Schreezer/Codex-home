import os
import subprocess
import tempfile
import logging
import shutil
from pathlib import Path
from datetime import datetime
from database import DatabaseOperations
from .claude_oauth import ClaudeOAuthManager

logger = logging.getLogger(__name__)

class DirectTaskExecutor:
    """Execute Claude Code tasks directly on host VM without Docker containers"""
    
    def __init__(self, work_dir="/tmp/claude-tasks"):
        self.work_dir = Path(work_dir)
        self.work_dir.mkdir(exist_ok=True, parents=True)
        self.claude_cli_path = None
        self._ensure_claude_cli()
    
    def _ensure_claude_cli(self):
        """Ensure Claude Code CLI is installed on the host"""
        try:
            # Check if Claude CLI is already available
            result = subprocess.run(['which', 'claude'], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                self.claude_cli_path = result.stdout.strip()
                logger.info(f"✅ Found existing Claude CLI at: {self.claude_cli_path}")
                return
                
            # Check if npm is available
            result = subprocess.run(['which', 'npm'], capture_output=True, text=True, timeout=10)
            if result.returncode != 0:
                raise Exception("npm not found - please install Node.js first")
            
            # Install Claude Code CLI globally
            logger.info("📦 Installing Claude Code CLI...")
            result = subprocess.run([
                'npm', 'install', '-g', '@anthropic-ai/claude-code'
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                raise Exception(f"Failed to install Claude CLI: {result.stderr}")
            
            # Verify installation
            result = subprocess.run(['which', 'claude'], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                self.claude_cli_path = result.stdout.strip()
                logger.info(f"✅ Successfully installed Claude CLI at: {self.claude_cli_path}")
            else:
                raise Exception("Claude CLI installation failed - command not found after install")
                
        except Exception as e:
            logger.error(f"❌ Failed to ensure Claude CLI: {e}")
            raise
    
    def _setup_workspace(self, task_id: int) -> Path:
        """Create isolated workspace for task"""
        workspace = self.work_dir / f"task-{task_id}-{int(datetime.now().timestamp())}"
        workspace.mkdir(exist_ok=True, parents=True)
        
        # Set permissions so claude-user can access the workspace
        subprocess.run(['chmod', '755', str(workspace)], timeout=10)
        subprocess.run(['chown', '-R', 'claude-user:claude-user', str(workspace)], timeout=30)
        
        return workspace
    
    def _setup_credentials(self, workspace: Path, oauth_tokens: dict = None, api_key: str = None):
        """Setup Claude credentials in workspace"""
        claude_dir = workspace / ".claude"
        claude_dir.mkdir(exist_ok=True)
        
        if oauth_tokens:
            # Use OAuth tokens
            credentials = {
                "access_token": oauth_tokens['access_token'],
                "refresh_token": oauth_tokens['refresh_token'],
                "expires_at": oauth_tokens['expires_at'],
                "token_type": "Bearer"
            }
            
            with open(claude_dir / ".credentials.json", 'w') as f:
                import json
                json.dump(credentials, f, indent=2)
            
            logger.info("✅ OAuth credentials configured")
            
        elif api_key:
            # Use API key via environment variable
            os.environ['ANTHROPIC_API_KEY'] = api_key
            logger.info("✅ API key configured")
            
        else:
            raise Exception("No authentication method provided")
    
    def _clone_repository(self, workspace: Path, repo_url: str, branch: str, github_token: str) -> Path:
        """Clone repository into workspace"""
        repo_dir = workspace / "repo"
        
        # Add token to URL for authentication
        if github_token and 'github.com' in repo_url:
            auth_url = repo_url.replace('https://github.com/', f'https://{github_token}@github.com/')
        else:
            auth_url = repo_url
        
        logger.info(f"🔄 Cloning repository: {repo_url} (branch: {branch})")
        
        result = subprocess.run([
            'git', 'clone', '-b', branch, auth_url, str(repo_dir)
        ], capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            raise Exception(f"Git clone failed: {result.stderr}")
        
        # Configure git as claude-user
        subprocess.run(['sudo', '-u', 'claude-user', 'git', 'config', 'user.email', 'claude-code@automation.com'], 
                      cwd=repo_dir, timeout=10)
        subprocess.run(['sudo', '-u', 'claude-user', 'git', 'config', 'user.name', 'Claude Code Automation'], 
                      cwd=repo_dir, timeout=10)
        
        logger.info("✅ Repository cloned successfully")
        return repo_dir
    
    def _execute_claude(self, workspace: Path, repo_dir: Path, prompt: str) -> tuple:
        """Execute Claude Code CLI with the prompt"""
        
        # Set HOME to workspace so Claude finds credentials
        env = os.environ.copy()
        env['HOME'] = str(workspace)
        env['CI'] = 'true'
        env['NO_COLOR'] = '1'
        
        logger.info(f"🚀 Executing Claude Code with prompt: {prompt[:100]}...")
        
        # Run Claude CLI as claude-user (not root) with automation flags
        # Use a longer timeout and better error handling
        logger.info(f"🔧 Running: sudo -u claude-user -E claude --dangerously-skip-permissions '{prompt[:50]}...'")
        logger.info(f"🗂️ Working directory: {repo_dir}")
        logger.info(f"🏠 HOME directory: {env.get('HOME', 'not set')}")
        
        result = subprocess.run([
            'sudo', '-u', 'claude-user', '-E', 'claude', '--dangerously-skip-permissions', prompt
        ], cwd=repo_dir, capture_output=True, text=True, timeout=900, env=env)
        
        logger.info(f"📤 Claude stdout: {result.stdout[:200]}...")
        logger.info(f"📥 Claude stderr: {result.stderr[:200]}..."))
        
        logger.info(f"🔍 Claude CLI exit code: {result.returncode}")
        
        if result.returncode != 0:
            logger.error(f"❌ Claude CLI failed: {result.stderr}")
            raise Exception(f"Claude execution failed: {result.stderr}")
        
        return result.stdout, result.stderr
    
    def _extract_changes(self, repo_dir: Path) -> dict:
        """Extract git changes after Claude execution"""
        
        # Check if there are any changes (as claude-user)
        result = subprocess.run(['sudo', '-u', 'claude-user', 'git', 'status', '--porcelain'], 
                               cwd=repo_dir, capture_output=True, text=True, timeout=10)
        
        if not result.stdout.strip():
            logger.info("ℹ️ No changes made by Claude")
            return {
                'commit_hash': None,
                'git_diff': '',
                'git_patch': '',
                'changed_files': []
            }
        
        # Add and commit changes (as claude-user)
        subprocess.run(['sudo', '-u', 'claude-user', 'git', 'add', '.'], cwd=repo_dir, timeout=30)
        
        commit_result = subprocess.run([
            'sudo', '-u', 'claude-user', 'git', 'commit', '-m', 'Claude Code: Automated changes'
        ], cwd=repo_dir, capture_output=True, text=True, timeout=30)
        
        if commit_result.returncode != 0:
            raise Exception(f"Git commit failed: {commit_result.stderr}")
        
        # Get commit hash (as claude-user)
        hash_result = subprocess.run(['sudo', '-u', 'claude-user', 'git', 'rev-parse', 'HEAD'], 
                                   cwd=repo_dir, capture_output=True, text=True, timeout=10)
        commit_hash = hash_result.stdout.strip()
        
        # Get diff (as claude-user)
        diff_result = subprocess.run(['sudo', '-u', 'claude-user', 'git', 'diff', 'HEAD~1'], 
                                   cwd=repo_dir, capture_output=True, text=True, timeout=30)
        git_diff = diff_result.stdout
        
        # Get patch (as claude-user)
        patch_result = subprocess.run(['sudo', '-u', 'claude-user', 'git', 'format-patch', 'HEAD~1', '--stdout'], 
                                    cwd=repo_dir, capture_output=True, text=True, timeout=30)
        git_patch = patch_result.stdout
        
        # Get changed files (as claude-user)
        files_result = subprocess.run(['sudo', '-u', 'claude-user', 'git', 'diff', '--name-only', 'HEAD~1'], 
                                    cwd=repo_dir, capture_output=True, text=True, timeout=10)
        changed_files = [f.strip() for f in files_result.stdout.split('\n') if f.strip()]
        
        logger.info(f"✅ Changes extracted - {len(changed_files)} files modified")
        
        return {
            'commit_hash': commit_hash,
            'git_diff': git_diff,
            'git_patch': git_patch,
            'changed_files': changed_files
        }
    
    def _cleanup_workspace(self, workspace: Path):
        """Clean up workspace after task completion"""
        try:
            if workspace.exists():
                shutil.rmtree(workspace)
                logger.info(f"🧹 Cleaned up workspace: {workspace}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to cleanup workspace {workspace}: {e}")
    
    def execute_task(self, task_id: int, user_id: str, github_token: str) -> bool:
        """Main execution method for a task"""
        workspace = None
        
        try:
            # Get task details
            task = DatabaseOperations.get_task_by_id(task_id, user_id)
            if not task:
                raise Exception(f"Task {task_id} not found")
            
            # Update status to running
            DatabaseOperations.update_task(task_id, user_id, {'status': 'running'})
            
            # Extract prompt from chat messages
            prompt = ""
            if task.get('chat_messages'):
                for msg in task['chat_messages']:
                    if msg.get('role') == 'user':
                        prompt = msg.get('content', '')
                        break
            
            if not prompt:
                raise Exception("No prompt found in task")
            
            logger.info(f"🚀 Starting direct execution for task {task_id}")
            
            # Setup workspace
            workspace = self._setup_workspace(task_id)
            
            # Get user preferences for authentication
            user = DatabaseOperations.get_user_by_id(user_id)
            user_preferences = user.get('preferences', {}) if user else {}
            claude_config = user_preferences.get('claudeCode', {})
            
            # Setup authentication
            oauth_tokens = claude_config.get('oauth', {}) if claude_config else {}
            use_oauth = claude_config.get('useOAuth', False) if claude_config else False
            
            if use_oauth and oauth_tokens.get('access_token'):
                logger.info("🔐 Using OAuth authentication")
                self._setup_credentials(workspace, oauth_tokens=oauth_tokens)
            else:
                # Fallback to API key
                api_key = os.getenv('ANTHROPIC_API_KEY')
                if not api_key:
                    raise Exception("No authentication method available")
                logger.info("🔑 Using API key authentication")
                self._setup_credentials(workspace, api_key=api_key)
            
            # Clone repository
            repo_dir = self._clone_repository(
                workspace, task['repo_url'], task['target_branch'], github_token
            )
            
            # Execute Claude
            stdout, stderr = self._execute_claude(workspace, repo_dir, prompt)
            
            # Extract changes
            changes = self._extract_changes(repo_dir)
            
            # Update task with results
            update_data = {
                'status': 'completed',
                'commit_hash': changes['commit_hash'],
                'git_diff': changes['git_diff'],
                'git_patch': changes['git_patch'],
                'changed_files': changes['changed_files'],
                'execution_metadata': {
                    'stdout': stdout,
                    'stderr': stderr,
                    'completed_at': datetime.now().isoformat(),
                    'execution_method': 'direct_host'
                }
            }
            
            DatabaseOperations.update_task(task_id, user_id, update_data)
            
            logger.info(f"🎉 Task {task_id} completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Task {task_id} failed: {e}")
            
            # Update task status to failed
            try:
                DatabaseOperations.update_task(task_id, user_id, {
                    'status': 'failed',
                    'error': str(e)
                })
            except:
                logger.error(f"Failed to update task {task_id} status after error")
            
            return False
            
        finally:
            # Cleanup workspace
            if workspace:
                self._cleanup_workspace(workspace)


def run_direct_task(task_id: int, user_id: str, github_token: str):
    """Entry point for direct task execution"""
    executor = DirectTaskExecutor()
    return executor.execute_task(task_id, user_id, github_token)