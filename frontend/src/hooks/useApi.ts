import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Student, Recommendation, CustomFormData, Internship, Stats } from '../types';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Define the base API URL - adjust this to match your Flask server
const API_BASE_URL = 'http://localhost:5000';

export const useApi = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  
  // Available options for dropdowns
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  const fetchStudents = useCallback(async (): Promise<ApiResponse<Student[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // The API returns an array directly, not wrapped in an object
      if (Array.isArray(data)) {
        setStudents(data);
        return { data };
      } else {
        return { error: 'Invalid response format' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch students';
      return { error: errorMessage };
    }
  }, []);

  const fetchStudentProfile = useCallback(async (user: User): Promise<ApiResponse<Student>> => {
    try {
      const { data, error } = await supabase
        .from('students') // Updated table name to match schema
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        setCurrentStudent(data);
        return { data };
      } else {
        // No profile found, create a basic one
        const newProfile = {
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email || 'Student',
          email: user.email || '',
          preferred_domains: [],
          preferred_locations: [],
          skills: [],
          interests: []
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('students')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;

        setCurrentStudent(createdProfile);
        return { data: createdProfile };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch student profile';
      return { error: errorMessage };
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to update student profile';
      return { error: errorMessage };
    }
  }, []);

  const fetchInternships = useCallback(async (): Promise<ApiResponse<Internship[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/internships`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // The API returns an array directly
      if (Array.isArray(data)) {
        setInternships(data);
        return { data };
      } else {
        return { error: 'Invalid response format' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch internships';
      return { error: errorMessage };
    }
  }, []);

  const fetchStats = useCallback(async (): Promise<ApiResponse<Stats>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        return { error: data.error };
      }
      
      setStats(data);
      return { data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
      return { error: errorMessage };
    }
  }, []);

  const fetchAvailableOptions = useCallback(async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/available-options`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        return { error: data.error };
      }
      
      setAvailableDomains(data.domains || []);
      setAvailableLocations(data.locations || []);
      setAvailableSkills(data.skills || []);
      return { data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch available options';
      return { error: errorMessage };
    }
  }, []);

  const fetchRecommendations = useCallback(async (studentId: number): Promise<ApiResponse<Recommendation[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/${studentId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        return { error: data.error };
      }
      
      // The API returns an array of recommendations directly
      if (Array.isArray(data)) {
        return { data };
      } else {
        return { error: 'Invalid response format' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recommendations';
      return { error: errorMessage };
    }
  }, []);

  const fetchCustomRecommendations = useCallback(async (formData: CustomFormData): Promise<ApiResponse<Recommendation[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        return { error: data.error };
      }
      
      // The API returns an array of recommendations directly
      if (Array.isArray(data)) {
        return { data };
      } else {
        return { error: 'Invalid response format' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch custom recommendations';
      return { error: errorMessage };
    }
  }, []);

  return {
    students,
    internships,
    stats,
    currentStudent,
    availableDomains,
    availableLocations,
    availableSkills,
    fetchStudents,
    fetchStudentProfile,
    createOrUpdateStudentProfile,
    fetchInternships,
    fetchStats,
    fetchAvailableOptions,
    fetchRecommendations,
    fetchCustomRecommendations,
  };
};