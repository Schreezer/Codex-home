import { Project, Task } from "@/types";

// Mock API service for SimpleAuth mode
export class MockApiService {
    private static tasks: Task[] = [];
    private static projects: Project[] = [];
    private static taskIdCounter = 1;
    private static projectIdCounter = 1;

    // Task methods
    static async getTasks(projectId?: number, options?: { limit?: number; offset?: number }): Promise<Task[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        let filteredTasks = this.tasks;
        if (projectId) {
            filteredTasks = this.tasks.filter(task => task.project_id === projectId);
        }
        
        // Apply pagination
        const { limit = 10, offset = 0 } = options || {};
        return filteredTasks.slice(offset, offset + limit);
    }

    static async getTask(taskId: number): Promise<Task | null> {
        await new Promise(resolve => setTimeout(resolve, 50));
        return this.tasks.find(task => task.id === taskId) || null;
    }

    static async createTask(taskData: Partial<Task>): Promise<Task> {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const newTask: Task = {
            id: this.taskIdCounter++,
            user_id: 'mock-user-chirag',
            project_id: taskData.project_id || null,
            repo_url: taskData.repo_url || null,
            target_branch: taskData.target_branch || 'main',
            agent: taskData.agent || 'claude',
            status: 'pending',
            chat_messages: taskData.chat_messages || [],
            execution_metadata: taskData.execution_metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            container_id: null,
            commit_hash: null,
            git_diff: null,
            git_patch: null,
            changed_files: [],
            error: null,
            pr_branch: null,
            pr_number: null,
            pr_url: null,
            ...taskData
        };
        
        this.tasks.unshift(newTask); // Add to beginning for newest first
        return newTask;
    }

    static async updateTask(taskId: number, updates: Partial<Task>): Promise<Task | null> {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return null;
        
        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        return this.tasks[taskIndex];
    }

    // Project methods
    static async getProjects(): Promise<Project[]> {
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.projects;
    }

    static async getProject(projectId: number): Promise<Project | null> {
        await new Promise(resolve => setTimeout(resolve, 50));
        return this.projects.find(project => project.id === projectId) || null;
    }

    static async createProject(projectData: Partial<Project>): Promise<Project> {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const newProject: Project = {
            id: this.projectIdCounter++,
            user_id: 'mock-user-chirag',
            name: projectData.name || 'Untitled Project',
            description: projectData.description || '',
            repo_url: projectData.repo_url || '',
            repo_name: projectData.repo_name || '',
            repo_owner: projectData.repo_owner || '',
            settings: projectData.settings || {},
            is_active: projectData.is_active !== false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...projectData
        };
        
        this.projects.unshift(newProject);
        return newProject;
    }

    static async updateProject(projectId: number, updates: Partial<Project>): Promise<Project | null> {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const projectIndex = this.projects.findIndex(project => project.id === projectId);
        if (projectIndex === -1) return null;
        
        this.projects[projectIndex] = {
            ...this.projects[projectIndex],
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        return this.projects[projectIndex];
    }

    static async deleteProject(projectId: number): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const projectIndex = this.projects.findIndex(project => project.id === projectId);
        if (projectIndex === -1) return false;
        
        this.projects.splice(projectIndex, 1);
        return true;
    }

    // User profile methods (for compatibility)
    static async getUserProfile() {
        return {
            id: 'mock-user-chirag',
            email: 'chirag@narraite.xyz',
            name: 'Chirag',
            preferences: {}
        };
    }

    static async updateUserProfile(updates: any) {
        // This is handled by the mock user profile hook
        return { success: true };
    }

    // Reset methods for testing
    static resetData() {
        this.tasks = [];
        this.projects = [];
        this.taskIdCounter = 1;
        this.projectIdCounter = 1;
    }

    // Seed with sample data
    static seedSampleData() {
        this.resetData();
        
        // Add a sample project
        this.projects.push({
            id: 1,
            user_id: 'mock-user-chirag',
            name: 'Sample Project',
            description: 'A sample project for testing',
            repo_url: 'https://github.com/user/sample-repo',
            repo_name: 'sample-repo',
            repo_owner: 'user',
            settings: {},
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        this.projectIdCounter = 2;
    }
}