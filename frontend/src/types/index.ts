// NOTE: every `id` here is a Postgres uuid (see supabase/migrations/0001_init.sql),
// so it is a string on the wire — never a number.

export interface Student {
  id: string;
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
  id: string;
  company_name: string;
  company_logo?: string;
  role_title: string;
  title?: string; // Alternative field name
  domain: string;
  location: string;
  is_remote: boolean;
  required_skills: string[];
  description: string;
  duration_weeks: number;
  stipend: number;
  stipend_currency?: string;
  company_size?: number;
  start_date?: string;
  application_deadline?: string;
  apply_url?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Recommendation {
  internship_id: string;
  company_name: string;
  company_logo?: string;
  role_title: string;
  domain: string;
  location: string;
  match_score: number;
  predicted_rating: number;
  duration_weeks: number;
  stipend: number;
  start_date?: string;
  is_remote: boolean;
  apply_url?: string;
  // Explainability — returned by the recommender so the score isn't a black box.
  matched_skills?: string[];
  missing_skills?: string[];
  match_reasons?: string[];
}

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'rejected'
  | 'offered';

export interface Application {
  id: string;
  student_id: string;
  internship_id: string;
  status: ApplicationStatus;
  applied_at?: string | null;
  created_at?: string;
  internship?: Partial<Internship> & { company_name?: string; company_logo?: string };
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