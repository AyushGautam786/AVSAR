"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserRoundPlus, ChevronRight, CircleChevronLeft, CheckCheck, FileInput } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  // Step 1 - Personal Details
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  profilePicture?: File;
  
  // Step 2 - Qualification
  education: string;
  institution: string;
  graduationYear: string;
  gpa: string;
  
  // Step 3 - Skills & Resume
  skills: string[];
  primarySkill: string;
  experienceLevel: number;
  resume?: File;
}

interface ValidationErrors {
  [key: string]: string;
}

const SUGGESTED_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
  'C++', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker',
  'Kubernetes', 'Git', 'HTML/CSS', 'Vue.js', 'Angular', 'PHP'
];

const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' }
];

const EXPERIENCE_LEVELS = ['Beginner (0-1 years)', 'Intermediate (1-3 years)', 'Advanced (3-5 years)', 'Expert (5+ years)'];

export default function RegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    education: '',
    institution: '',
    graduationYear: '',
    gpa: '',
    skills: [],
    primarySkill: '',
    experienceLevel: 0
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [skillInput, setSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: boolean;
    reasons: string[];
  } | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [currentStep]);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Validation functions
  const validateStep1 = (): ValidationErrors => {
    const stepErrors: ValidationErrors = {};
    
    if (!formData.fullName.trim()) {
      stepErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      stepErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      stepErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      stepErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      stepErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.dateOfBirth) {
      stepErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 16) {
        stepErrors.dateOfBirth = 'You must be at least 16 years old to register';
      }
    }
    
    return stepErrors;
  };

  const validateStep2 = (): ValidationErrors => {
    const stepErrors: ValidationErrors = {};
    
    if (!formData.education) {
      stepErrors.education = 'Education level is required';
    }
    
    if (!formData.institution.trim()) {
      stepErrors.institution = 'Institution name is required';
    }
    
    if (!formData.graduationYear.trim()) {
      stepErrors.graduationYear = 'Graduation year is required';
    } else {
      const year = parseInt(formData.graduationYear);
      const currentYear = new Date().getFullYear();
      if (year < 1950 || year > currentYear + 10) {
        stepErrors.graduationYear = 'Please enter a valid graduation year';
      }
    }
    
    return stepErrors;
  };

  const validateStep3 = (): ValidationErrors => {
    const stepErrors: ValidationErrors = {};
    
    if (formData.skills.length === 0) {
      stepErrors.skills = 'Please add at least one skill';
    }
    
    if (!formData.primarySkill) {
      stepErrors.primarySkill = 'Please select your primary skill';
    }
    
    return stepErrors;
  };

  // Check eligibility
  const checkEligibility = () => {
    const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : 0;
    const reasons: string[] = [];
    let eligible = true;

    if (age < 18) {
      eligible = false;
      reasons.push('Must be at least 18 years old for full eligibility');
    } else if (age >= 16) {
      reasons.push('Age requirement met');
    }

    if (!formData.education || formData.education === 'high_school') {
      reasons.push('Higher education preferred but not required');
    } else {
      reasons.push('Education requirement exceeded');
    }

    if (formData.skills.length >= 3) {
      reasons.push('Strong skill set demonstrated');
    } else if (formData.skills.length > 0) {
      reasons.push('Basic skills present');
    }

    setEligibilityResult({ eligible, reasons });
  };

  // Handle form field changes
  const handleInputChange = (field: keyof FormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle file uploads
  const handleFileChange = (field: 'profilePicture' | 'resume', file: File | null) => {
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  // Handle skill input
  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput.trim());
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      handleInputChange('skills', [...formData.skills, skill]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    handleInputChange('skills', formData.skills.filter(skill => skill !== skillToRemove));
  };

  // Navigation functions
  const nextStep = () => {
    let stepErrors: ValidationErrors = {};
    
    if (currentStep === 1) {
      stepErrors = validateStep1();
    } else if (currentStep === 2) {
      stepErrors = validateStep2();
    } else if (currentStep === 3) {
      stepErrors = validateStep3();
    }
    
    setErrors(stepErrors);
    
    if (Object.keys(stepErrors).length === 0) {
      if (currentStep === 2) {
        checkEligibility();
      }
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Submit form
  const handleSubmit = async () => {
    const stepErrors = validateStep3();
    setErrors(stepErrors);
    
    if (Object.keys(stepErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call to POST /api/register
      // This would include form data and files as FormData
      const formDataToSubmit = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'skills') {
          formDataToSubmit.append(key, JSON.stringify(value));
        } else if (value instanceof File) {
          formDataToSubmit.append(key, value);
        } else if (value !== undefined) {
          formDataToSubmit.append(key, value.toString());
        }
      });

      // Simulate network delay and random success/failure
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (Math.random() > 0.3) { // 70% success rate for demo
        toast.success('Registration completed successfully! Welcome aboard.', {
          description: 'You can now log in with your credentials.'
        });
        
        // Reset form or redirect
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          education: '',
          institution: '',
          graduationYear: '',
          gpa: '',
          skills: [],
          primarySkill: '',
          experienceLevel: 0
        });
        setCurrentStep(1);
      } else {
        // Simulate server errors
        toast.error('Registration failed', {
          description: 'Please check your information and try again.'
        });
        setErrors({
          email: 'This email is already registered',
          phone: 'Invalid phone number format'
        });
      }
    } catch (error) {
      toast.error('An error occurred during registration', {
        description: 'Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl font-display">
          <UserRoundPlus className="h-6 w-6" />
          Create Your Account
        </CardTitle>
        <CardDescription>
          Step {currentStep} of 3 - Complete your registration to get started
        </CardDescription>
        
        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          Step {currentStep} of 3: {
            currentStep === 1 ? 'Personal Details' :
            currentStep === 2 ? 'Qualification' :
            'Skills and Resume'
          }
        </div>

        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                ref={firstInputRef}
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={errors.dateOfBirth ? 'border-destructive' : ''}
              />
              {formData.dateOfBirth && (
                <p className="text-sm text-muted-foreground">
                  Age: {calculateAge(formData.dateOfBirth)} years 
                  {calculateAge(formData.dateOfBirth) < 16 && ' (minimum age is 16)'}
                </p>
              )}
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePicture">Profile Picture (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('profilePicture', e.target.files?.[0] || null)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Qualification */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="education">Highest Education Level *</Label>
              <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
                <SelectTrigger className={errors.education ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your education level" ref={firstInputRef} />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.education && (
                <p className="text-sm text-destructive">{errors.education}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution Name *</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => handleInputChange('institution', e.target.value)}
                placeholder="Enter your institution name"
                className={errors.institution ? 'border-destructive' : ''}
              />
              {errors.institution && (
                <p className="text-sm text-destructive">{errors.institution}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year *</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 10}
                  value={formData.graduationYear}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  placeholder="e.g., 2023"
                  className={errors.graduationYear ? 'border-destructive' : ''}
                />
                {errors.graduationYear && (
                  <p className="text-sm text-destructive">{errors.graduationYear}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpa">GPA/Percentage (Optional)</Label>
                <Input
                  id="gpa"
                  value={formData.gpa}
                  onChange={(e) => handleInputChange('gpa', e.target.value)}
                  placeholder="e.g., 3.8 or 85%"
                />
              </div>
            </div>

            {/* Eligibility check result */}
            {eligibilityResult && (
              <Alert className={eligibilityResult.eligible ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                <CheckCheck className="h-4 w-4" />
                <AlertDescription>
                  <strong>
                    {eligibilityResult.eligible ? 'Eligible for registration' : 'May have eligibility restrictions'}
                  </strong>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {eligibilityResult.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 3: Skills & Resume */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skillInput">Skills *</Label>
              <Input
                id="skillInput"
                ref={firstInputRef}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter to add"
                className={errors.skills ? 'border-destructive' : ''}
              />
              <p className="text-sm text-muted-foreground">
                Type skills and press Enter to add them. Click suggested skills below to add quickly.
              </p>
              {errors.skills && (
                <p className="text-sm text-destructive">{errors.skills}</p>
              )}
            </div>

            {/* Suggested skills */}
            <div className="space-y-2">
              <Label className="text-sm">Suggested Skills</Label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.filter(skill => !formData.skills.includes(skill)).slice(0, 10).map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSkill(skill)}
                    className="h-8 text-xs"
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>

            {/* Added skills */}
            {formData.skills.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Your Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 text-xs hover:text-destructive"
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="primarySkill">Primary Skill *</Label>
              <Select value={formData.primarySkill} onValueChange={(value) => handleInputChange('primarySkill', value)}>
                <SelectTrigger className={errors.primarySkill ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your primary skill" />
                </SelectTrigger>
                <SelectContent>
                  {formData.skills.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                  {formData.skills.length === 0 && (
                    <SelectItem value="placeholder" disabled>
                      Add skills first to select primary skill
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.primarySkill && (
                <p className="text-sm text-destructive">{errors.primarySkill}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <div className="px-2">
                <Slider
                  id="experienceLevel"
                  value={[formData.experienceLevel]}
                  onValueChange={(value) => handleInputChange('experienceLevel', value[0])}
                  max={3}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                  <span>Expert</span>
                </div>
                <p className="text-sm text-center mt-1 font-medium">
                  {EXPERIENCE_LEVELS[formData.experienceLevel]}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Resume (PDF) *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange('resume', e.target.files?.[0] || null)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                />
                <FileInput className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <CircleChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Submitting...' : 'Complete Registration'}
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}