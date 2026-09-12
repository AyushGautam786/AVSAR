import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Student, Recommendation, CustomFormData, Internship, Stats } from '../types';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface PaginatedInternships {
  data: Internship[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Reads from env var — set VITE_API_URL=http://localhost:5000 in .env for local dev
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .toString()
  .trim()
  .replace(/['"]/g, '')
  .replace(/\/+$/, '');

/** Returns the Bearer token for the current Supabase session, or null. */
async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const useApi = () => {
  const [students] = useState<Student[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [internshipsMeta, setInternshipsMeta] = useState<Omit<PaginatedInternships, 'data'> | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [myApplications, setMyApplications] = useState<any[]>([]);

  // Available options for dropdowns
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  // ── Student profile (Supabase direct) ────────────────────────────────────

  const fetchStudentProfile = useCallback(async (user: User): Promise<ApiResponse<Student>> => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCurrentStudent(data);
        return { data };
      }

      // Create a blank profile if none exists
      const newProfile = {
        user_id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Student',
        email: user.email || '',
        skills: [],
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('students')
        .insert(newProfile)
        .select()
        .single();

      if (createError) throw createError;
      setCurrentStudent(createdProfile);
      return { data: createdProfile };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch student profile' };
    }
  }, []);

  const createOrUpdateStudentProfile = useCallback(async (profileData: Partial<Student>): Promise<ApiResponse<Student>> => {
    try {
      const { data, error } = await supabase
        .from('students')
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;
      setCurrentStudent(data);
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update student profile' };
    }
  }, []);

  // ── Internships (Flask API, paginated) ───────────────────────────────────

  const fetchInternships = useCallback(async (
    filters: { domain?: string; location?: string; remote?: boolean; q?: string; page?: number; page_size?: number } = {}
  ): Promise<ApiResponse<PaginatedInternships>> => {
    try {
      const params = new URLSearchParams();
      if (filters.domain)    params.set('domain', filters.domain);
      if (filters.location)  params.set('location', filters.location);
      if (filters.remote !== undefined) params.set('remote', String(filters.remote));
      if (filters.q)         params.set('q', filters.q);
      if (filters.page)      params.set('page', String(filters.page));
      if (filters.page_size) params.set('page_size', String(filters.page_size));

      const response = await fetch(`${API_BASE_URL}/api/internships?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json: PaginatedInternships = await response.json();
      setInternships(json.data ?? []);
      setInternshipsMeta({ total: json.total, page: json.page, page_size: json.page_size, total_pages: json.total_pages });
      return { data: json };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch internships' };
    }
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async (): Promise<ApiResponse<Stats>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) return { error: data.error };
      setStats(data);
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch stats' };
    }
  }, []);

  // ── Available options ────────────────────────────────────────────────────

  const fetchAvailableOptions = useCallback(async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/available-options`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) return { error: data.error };
      setAvailableDomains(data.domains ?? []);
      setAvailableLocations(data.locations ?? []);
      setAvailableSkills(data.skills ?? []);
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch available options' };
    }
  }, []);

  // ── Recommendations (auth-protected) ────────────────────────────────────

  const fetchRecommendations = useCallback(async (studentId: string): Promise<ApiResponse<Recommendation[]>> => {
    try {
      const authHeaders = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/api/recommendations/${studentId}`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) return { error: data.error };
      return Array.isArray(data) ? { data } : { error: 'Invalid response format' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch recommendations' };
    }
  }, []);

  const fetchCustomRecommendations = useCallback(async (formData: CustomFormData): Promise<ApiResponse<Recommendation[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) return { error: data.error };
      return Array.isArray(data) ? { data } : { error: 'Invalid response format' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch custom recommendations' };
    }
  }, []);

  // ── Applications (auth-protected) ────────────────────────────────────────

  const saveApplication = useCallback(async (
    internshipId: string,
    status: 'saved' | 'applied' | 'interviewing' | 'rejected' | 'offered' = 'saved'
  ): Promise<ApiResponse<any>> => {
    try {
      const authHeaders = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ internship_id: internshipId, status }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to save application' };
    }
  }, []);

  const fetchMyApplications = useCallback(async (): Promise<ApiResponse<any[]>> => {
    try {
      const authHeaders = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/api/applications/me`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMyApplications(data);
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch applications' };
    }
  }, []);

  // ── Interaction events ────────────────────────────────────────────────────

  const logEvent = useCallback(async (
    internshipId: string,
    eventType: 'view' | 'click' | 'save' | 'apply' | 'dismiss'
  ): Promise<void> => {
    try {
      const authHeaders = await getAuthHeader();
      if (!authHeaders.Authorization) return; // not logged in, skip silently
      await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ internship_id: internshipId, event_type: eventType }),
      });
    } catch {
      // Silently ignore — event logging should never crash the UI
    }
  }, []);

  // ── Legacy compat (numeric student IDs for old pages) ────────────────────

  const fetchStudents = useCallback(async () => {
    // Students are now sourced from Supabase directly via fetchStudentProfile.
    // This stub is kept for backward compatibility.
    return { data: students };
  }, [students]);

  const parseResumeToProfile = useCallback(async (file: File): Promise<ApiResponse<any>> => {
    try {
      const authHeaders = await getAuthHeader();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/resume/parse-profile`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { error: `Server returned status ${response.status}` };
      }

      if (!response.ok) throw new Error(data.error || `Failed to parse resume (Status ${response.status})`);
      return { data: data.profile };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to parse resume' };
    }
  }, []);

  return {
    students,
    internships,
    internshipsMeta,
    stats,
    currentStudent,
    myApplications,
    availableDomains,
    availableLocations,
    availableSkills,
    fetchStudents,
    fetchStudentProfile,
    createOrUpdateStudentProfile,
    parseResumeToProfile,
    fetchInternships,
    fetchStats,
    fetchAvailableOptions,
    fetchRecommendations,
    fetchCustomRecommendations,
    saveApplication,
    fetchMyApplications,
    logEvent,
  };
};