export interface Student {
  id: number;
  user_id?: string; // Supabase user ID
  name: string;
  email: string;
  preferred_domains: string[];
  preferred_locations: string[];
  skills: string[];
  interests: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Internship {
  id: number;
  company_name: string;
  role_title: string;
  title?: string; // Alternative field name
  domain: string;
  location: string;
  is_remote: boolean;
  required_skills: string[];
  description: string;
  duration_weeks: number;
  stipend: number;
  company_size: number;
  start_date: string;
  application_deadline: string;
  company_logo: string;
  created_at?: string;
  updated_at?: string;
}

export interface Recommendation {
  internship_id: number;
  company_name: string;
  role_title: string;
  domain: string;
  location: string;
  match_score: number;
  predicted_rating: number;
  duration_weeks: number;
  stipend: number;
  start_date: string;
  is_remote: boolean;
}

export interface CustomFormData {
  name: string;
  preferred_domains: string[];
  preferred_locations: string[];
  skills: string[];
  interests: string[];
}

export interface Stats {
  total_students: number;
  total_internships: number;
  domain_distribution: Record<string, number>;
  location_distribution: Record<string, number>;
  avg_stipend_by_domain: Record<string, number>;
  model_trained: boolean;
}