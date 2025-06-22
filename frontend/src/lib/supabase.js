import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Project operations
export const projectsApi = {
  // Get all public projects, newest first
  async getPublicProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'public')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
    
    console.log('Fetched projects:', data);
    return data;
  },

  // Get single project by ID
  async getProjectById(id) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
    
    console.log('Fetched project:', data);
    return data;
  },

  // Insert new project
  async createProject(projectData) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        title: projectData.title,
        budget: projectData.budget,
        deadline: projectData.deadline,
        description: projectData.description,
        contact_email: projectData.contact_email,
        contact_line: projectData.contact_line || null,
        contact_slack: projectData.contact_slack || null,
        internal_tag: projectData.internal_tag || null,
        status: 'public'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }
    
    console.log('Created project:', data);
    return data;
  }
};

// Application operations
export const applicationsApi = {
  // Get applications for a specific project
  async getApplicationsByProjectId(projectId) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
    
    console.log('Fetched applications:', data);
    return data;
  },

  // Insert new application
  async createApplication(applicationData) {
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        project_id: applicationData.project_id,
        appeal: applicationData.appeal,
        org_name: applicationData.org_name || null,
        rep_name: applicationData.rep_name || null,
        contact_email: applicationData.contact_email || null
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating application:', error);
      throw error;
    }
    
    console.log('Created application:', data);
    return data;
  },

  // Get all applications (for admin)
  async getAllApplications() {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        projects (
          title,
          budget,
          deadline
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all applications:', error);
      throw error;
    }
    
    console.log('Fetched all applications:', data);
    return data;
  }
};

// Admin operations
export const adminApi = {
  // Get all projects (including non-public for admin)
  async getAllProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all projects:', error);
      throw error;
    }
    
    console.log('Fetched all projects:', data);
    return data;
  },

  // Update project status
  async updateProjectStatus(projectId, status) {
    const { data, error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
    
    console.log('Updated project:', data);
    return data;
  },

  // Delete project
  async deleteProject(projectId) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
    
    console.log('Deleted project:', projectId);
    return true;
  }
};