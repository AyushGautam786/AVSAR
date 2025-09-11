"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface FormState {
  nationality: string;
  age: string;
  familyIncome: string;
  employmentStatus: "not_employed" | "not_full_time_edu" | "both" | "";
  education: "hs_12" | "iti" | "poly" | "grad" | "";
  excludedAffiliation: "yes" | "no" | "";
  prevGovtApprenticeship: "yes" | "no" | "";
  fullName: string;
  email: string;
  instituteName?: string;
  instituteLocation?: string;
  graduationYear?: string;
  password?: string;
  confirmPassword?: string;
}

export const EligibilityRegistrationForm: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    nationality: "",
    age: "",
    familyIncome: "",
    employmentStatus: "",
    education: "",
    excludedAffiliation: "",
    prevGovtApprenticeship: "",
    fullName: "",
    email: "",
    instituteName: "",
    instituteLocation: "",
    graduationYear: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; errors: string[] } | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();

  const onChange = (key: keyof FormState, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const validate = () => {
    const errors: string[] = [];
    if (form.nationality.toLowerCase() !== "indian") errors.push("Nationality must be Indian");

    const ageNum = Number(form.age);
    if (!ageNum || ageNum < 21 || ageNum > 24) errors.push("Age must be between 21 and 24");

    const incomeNum = Number(form.familyIncome.toString().replace(/[\,\s]/g, ""));
    if (!incomeNum || incomeNum >= 800000) errors.push("Family income must be less than ₹8,00,000");

    if (!form.employmentStatus) errors.push("Select employment/education status");
    if (!form.education) errors.push("Select education");

    if (form.education) {
      if (!form.instituteName?.trim()) errors.push("Institute name is required");
      if (!form.instituteLocation?.trim()) errors.push("Institute location is required");
      if (!form.graduationYear?.trim()) errors.push("Graduation year is required");
    }

    if (form.excludedAffiliation !== "no") errors.push("You must NOT be enrolled in excluded programs (CA/CMA/CS/MBBS/BDS/MBA/IITs/IIMs/NLUs/IISERs/NIDs/IIITs)");

    if (form.prevGovtApprenticeship !== "no") errors.push("Must not have participated in govt apprenticeship/internship schemes");

    if (!form.fullName.trim()) errors.push("Full name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push("Valid email is required");

    const eligible = errors.length === 0;
    setEligibility({ eligible, errors });
    return eligible;
  };

  const handleSignup = async () => {
    if (!eligibility?.eligible) {
      toast.error("Please pass eligibility first");
      return;
    }
    if (!form.password || form.password.length < 6) {
      toast.error("Password required", { description: "Minimum 6 characters" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: form.email,
        password: form.password,
        name: form.fullName,
      });
      if (signUpError?.code) {
        toast.error(signUpError.code === "USER_ALREADY_EXISTS" ? "Email already registered" : "Registration failed");
        setSubmitting(false);
        return;
      }

      // Auto sign-in
      const { error: signInError } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
        rememberMe: true,
        callbackURL: "/dashboard",
      });
      if (signInError?.code) {
        toast.error("Login failed", { description: "Try signing in manually" });
      } else {
        toast.success("Account created! Redirecting...");
      }
    } catch {
      toast.error("Unexpected error");
    } finally {
      setSubmitting(false);
      router.push("/dashboard");
    }
  };

  const inputVariants = {
    focus: { scale: 1.02, transition: { type: "spring", stiffness: 300 } },
    blur: { scale: 1 },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card className="w-full max-w-2xl mx-auto bg-card shadow-xl border border-border/50">
        <CardHeader className="pb-6">
          <CardTitle className="font-display text-3xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Create Account — Eligibility
          </CardTitle>
          <CardDescription className="text-base">
            Eligibility is checked inline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              className="space-y-2"
              whileFocus="focus"
              variants={inputVariants}
            >
              <Label className="font-medium">Full Name</Label>
              <Input 
                placeholder="Your full name" 
                value={form.fullName} 
                onChange={(e) => onChange("fullName", e.target.value)}
                onFocus={() => setFocusedField("fullName")}
                onBlur={() => setFocusedField(null)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </motion.div>

            <motion.div 
              className="space-y-2"
              whileFocus="focus"
              variants={inputVariants}
            >
              <Label className="font-medium">Email</Label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                value={form.email} 
                onChange={(e) => onChange("email", e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </motion.div>

            <motion.div className="space-y-2">
              <Label className="font-medium">Nationality</Label>
              <Select value={form.nationality} onValueChange={(v) => onChange("nationality", v)}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indian">Indian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Must be Indian</p>
            </motion.div>

            <motion.div 
              className="space-y-2"
              whileFocus="focus"
              variants={inputVariants}
            >
              <Label className="font-medium">Age</Label>
              <Input 
                type="number" 
                min={21} 
                max={24} 
                placeholder="21-24" 
                value={form.age} 
                onChange={(e) => onChange("age", e.target.value)}
                onFocus={() => setFocusedField("age")}
                onBlur={() => setFocusedField(null)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">Must be between 21 and 24</p>
            </motion.div>

            <motion.div 
              className="space-y-2"
              whileFocus="focus"
              variants={inputVariants}
            >
              <Label className="font-medium">Family Annual Income (₹)</Label>
              <Input 
                type="number" 
                placeholder="e.g., 450000" 
                value={form.familyIncome} 
                onChange={(e) => onChange("familyIncome", e.target.value)}
                onFocus={() => setFocusedField("familyIncome")}
                onBlur={() => setFocusedField(null)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">Must be less than ₹8,00,000</p>
            </motion.div>

            <motion.div className="space-y-2">
              <Label className="font-medium">Employment / Education Status</Label>
              <Select value={form.employmentStatus} onValueChange={(v) => onChange("employmentStatus", v)}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_employed">Not fully employed</SelectItem>
                  <SelectItem value="not_full_time_edu">Not in full-time education</SelectItem>
                  <SelectItem value="both">Both of the above</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div className="space-y-2 md:col-span-2">
              <Label className="font-medium">Education</Label>
              <Select value={form.education} onValueChange={(v) => onChange("education", v)}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Choose education" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hs_12">Higher Secondary (12th)</SelectItem>
                  <SelectItem value="iti">ITI certificate</SelectItem>
                  <SelectItem value="poly">Polytechnic Diploma</SelectItem>
                  <SelectItem value="grad">Graduate degree (BA, BSc, BCom, BCA, BBA, BPharma)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Exclusions: CA, CMA, CS, MBBS, BDS, MBA, IITs/IIMs/NLUs/IISERs/NIDs/IIITs, etc.</p>
            </motion.div>

            {/* Conditional institute details when education is selected */}
            {form.education && (
              <>
                <motion.div className="space-y-2 md:col-span-2">
                  <Label className="font-medium">Institute Name</Label>
                  <Input
                    placeholder="e.g., XYZ College of Engineering"
                    value={form.instituteName}
                    onChange={(e) => onChange("instituteName", e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </motion.div>
                <motion.div className="space-y-2">
                  <Label className="font-medium">Institute Location (City/State)</Label>
                  <Input
                    placeholder="e.g., Pune, Maharashtra"
                    value={form.instituteLocation}
                    onChange={(e) => onChange("instituteLocation", e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </motion.div>
                <motion.div className="space-y-2">
                  <Label className="font-medium">Graduation / Completion Year</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 2024"
                    value={form.graduationYear}
                    onChange={(e) => onChange("graduationYear", e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </motion.div>
              </>
            )}

            <motion.div className="space-y-2 md:col-span-2">
              <Label className="font-medium">Are you enrolled in any excluded programs listed above?</Label>
              <Select value={form.excludedAffiliation} onValueChange={(v) => onChange("excludedAffiliation", v)}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div className="space-y-2 md:col-span-2">
              <Label className="font-medium">Have you participated in any government apprenticeship/internship schemes?</Label>
              <Select value={form.prevGovtApprenticeship} onValueChange={(v) => onChange("prevGovtApprenticeship", v)}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Must be "No" to be eligible.</p>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {eligibility && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className={`border-2 ${eligibility.eligible 
                  ? "border-green-300 bg-green-50/80 text-green-900" 
                  : "border-red-300 bg-red-50/80 text-red-900"}`}>
                  <div className="flex items-start gap-3">
                    {eligibility.eligible ? (
                      <Check className="h-5 w-5 mt-0.5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 mt-0.5 text-red-600" />
                    )}
                    <AlertDescription className="text-sm">
                      {eligibility.eligible ? (
                        <div className="space-y-2">
                          <span className="font-display font-bold text-base">🎉 You're Eligible!</span>
                          <p className="text-green-800">All criteria met. Set a password to create your account.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <span className="font-display font-bold text-base">❌ Not Eligible</span>
                          <div>
                            <span className="font-medium">Please correct:</span>
                            <ul className="mt-2 list-disc list-inside space-y-1">
                              {eligibility.errors.map((error, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="text-red-800"
                                >
                                  {error}
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password section visible only when eligible */}
          {eligibility?.eligible && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium">Password</Label>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Confirm Password</Label>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => onChange("confirmPassword", e.target.value)}
                />
              </div>
            </div>
          )}

          <motion.div 
            className="flex items-center gap-3 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => setEligibility(null)}
              className="hover:bg-secondary/80 transition-colors"
            >
              Reset
            </Button>
            <Button 
              type="button" 
              onClick={() => validate()} 
              variant="secondary"
              className="hover:bg-secondary/80 transition-colors"
            >
              Check Eligibility
            </Button>
            {/* When eligible, turn Create Account into submit with signup */}
            {!eligibility?.eligible ? (
              <Button 
                type="button" 
                onClick={() => {
                  const ok = validate();
                  if (ok) toast.success("Eligible! Set password below");
                }} 
                className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                Validate & Continue
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleSignup} 
                disabled={submitting} 
                className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Creating...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EligibilityRegistrationForm;