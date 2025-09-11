"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Component, PanelRight, TableOfContents, LayoutTemplate } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { LoginDialog } from "@/components/LoginDialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  description: string;
  roles: string[];
  eligibility: string[];
}

interface Review {
  id: string;
  name: string;
  initials: string;
  rating: number;
  text: string;
  date: string;
  company?: string;
}

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "TechCorp",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
    industry: "Technology",
    description: "Leading software development company focused on AI and machine learning solutions.",
    roles: ["Software Engineering Intern", "Data Science Intern", "Product Management Intern"],
    eligibility: ["Computer Science or related field", "GPA 3.0+", "Programming experience"]
  },
  {
    id: "2",
    name: "FinanceFirst",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop",
    industry: "Finance",
    description: "Investment banking and financial services with global reach and innovative solutions.",
    roles: ["Investment Banking Intern", "Financial Analyst Intern", "Risk Management Intern"],
    eligibility: ["Finance, Economics, or Business major", "Strong analytical skills", "Excel proficiency"]
  },
  {
    id: "3",
    name: "HealthTech Solutions",
    logo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=200&h=200&fit=crop",
    industry: "Healthcare",
    description: "Digital health platform improving patient outcomes through technology innovation.",
    roles: ["Healthcare IT Intern", "Clinical Research Intern", "UX Design Intern"],
    eligibility: ["Healthcare, IT, or Design background", "Interest in digital health", "Team collaboration skills"]
  },
  {
    id: "4",
    name: "GreenEnergy Co",
    logo: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=200&h=200&fit=crop",
    industry: "Energy",
    description: "Renewable energy solutions and sustainable technology development company.",
    roles: ["Environmental Engineering Intern", "Sustainability Analyst Intern", "Project Management Intern"],
    eligibility: ["Engineering or Environmental Science", "Sustainability focus", "Project experience preferred"]
  },
  {
    id: "5",
    name: "MediaMakers",
    logo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=200&fit=crop",
    industry: "Media",
    description: "Creative content production and digital marketing agency with award-winning campaigns.",
    roles: ["Marketing Intern", "Content Creation Intern", "Social Media Intern"],
    eligibility: ["Marketing, Communications, or Design", "Creative portfolio", "Social media savvy"]
  },
  {
    id: "6",
    name: "RetailRevolution",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    industry: "Retail",
    description: "E-commerce platform revolutionizing online shopping experiences worldwide.",
    roles: ["E-commerce Analyst Intern", "Supply Chain Intern", "Customer Experience Intern"],
    eligibility: ["Business, Supply Chain, or related field", "Analytical mindset", "Customer service experience"]
  },
  {
    id: "7",
    name: "EduTech Innovations",
    logo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop",
    industry: "Education",
    description: "Educational technology platform making learning accessible and engaging for all students.",
    roles: ["EdTech Product Intern", "Learning Design Intern", "Data Analytics Intern"],
    eligibility: ["Education, Psychology, or Technology", "Passion for learning", "User research interest"]
  },
  {
    id: "8",
    name: "AutoFuture",
    logo: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=200&fit=crop",
    industry: "Automotive",
    description: "Electric vehicle manufacturer pioneering autonomous driving technology.",
    roles: ["Automotive Engineering Intern", "AI Research Intern", "Manufacturing Intern"],
    eligibility: ["Engineering or Computer Science", "Interest in autonomous systems", "Problem-solving skills"]
  }
];

const mockReviews: Review[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    initials: "SJ",
    rating: 5,
    text: "Amazing experience! The AI recommendations were spot-on and helped me land my dream internship at a tech startup.",
    date: "2024-01-15",
    company: "TechCorp"
  },
  {
    id: "2",
    name: "Michael Chen",
    initials: "MC",
    rating: 4,
    text: "Great platform with comprehensive company information. The eligibility checker saved me a lot of time.",
    date: "2024-01-10",
    company: "FinanceFirst"
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    initials: "ER",
    rating: 5,
    text: "The personalized recommendations matched perfectly with my skills and career goals. Highly recommend!",
    date: "2024-01-08",
    company: "HealthTech Solutions"
  },
  {
    id: "4",
    name: "David Kim",
    initials: "DK",
    rating: 4,
    text: "User-friendly interface and excellent company insights. Found several internships I wouldn't have discovered otherwise.",
    date: "2024-01-05",
    company: "GreenEnergy Co"
  }
];

const faqs = [
  {
    question: "What is the minimum age requirement?",
    answer: "You must be at least 16 years old to apply for internships through our platform."
  },
  {
    question: "Do I need to be enrolled in college?",
    answer: "Most internships require current enrollment in a college or university program, though some accept high school students."
  },
  {
    question: "Can international students apply?",
    answer: "Yes, many companies welcome international students. Visa requirements vary by company and location."
  },
  {
    question: "What if I don't meet all eligibility requirements?",
    answer: "Requirements are often flexible. We recommend applying if you meet most criteria and can demonstrate relevant skills or passion."
  }
];

export default function HomeContent() {
  const { data: session, isPending } = useSession();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyFilter, setCompanyFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [reviewSort, setReviewSort] = useState<"recent" | "rating">("recent");
  const [eligibilityAge, setEligibilityAge] = useState("");
  const [eligibilityEducation, setEligibilityEducation] = useState("");
  const [eligibilityResult, setEligibilityResult] = useState<{ eligible: boolean; reason: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const router = useRouter();

  const handleScrollTo = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleGetRecommendations = () => {
    if (!isPending && !session?.user) {
      setShowLoginDialog(true);
      return;
    }

    if (session?.user) {
      router.push("/recommendations");
    }
  };

  const filteredCompanies = mockCompanies.filter(company => {
    const matchesName = company.name.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
    return matchesName && matchesIndustry;
  });

  const sortedReviews = [...mockReviews].sort((a, b) => {
    if (reviewSort === "rating") {
      return b.rating - a.rating;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const industries = Array.from(new Set(mockCompanies.map(c => c.industry)));

  const checkEligibility = () => {
    if (!eligibilityAge || !eligibilityEducation) return;

    const age = parseInt(eligibilityAge);
    let eligible = true;
    let reason = "";

    if (age < 16) {
      eligible = false;
      reason = "Minimum age requirement is 16 years old.";
    } else if (age > 25) {
      eligible = false;
      reason = "Most internships target students under 25.";
    } else if (eligibilityEducation === "high-school" && age < 18) {
      eligible = false;
      reason = "High school students must be at least 18 years old.";
    } else {
      reason = "You meet the basic eligibility requirements!";
    }

    setEligibilityResult({ eligible, reason });
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-sm ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}>
          ★
        </span>
      ))}
    </div>
  );

  const LoadingSkeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  );

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section id="home" className="py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-display font-bold leading-tight">
              AI-Based Internship Recommendation Engine
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Find the perfect internship match with our intelligent recommendation system. 
              We analyze your skills, interests, and career goals to connect you with 
              opportunities that align with your professional development journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={handleGetRecommendations}>
                Get Recommended Internships
              </Button>
              <Button variant="outline" size="lg" onClick={() => handleScrollTo("companies")}>
                Browse Companies
              </Button>
            </div>
            {!isPending && !session?.user && (
              <p className="text-sm text-muted-foreground">
                Please log in to get personalized internship recommendations
              </p>
            )}
          </div>
          <div className="relative">
            <Card className="p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Component className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">Smart Matching</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes 50+ factors including your academic background, 
                  skills, location preferences, and career interests to find the 
                  most relevant internship opportunities.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">95%</div>
                    <div className="text-xs text-muted-foreground">Match Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">2.5k+</div>
                    <div className="text-xs text-muted-foreground">Companies</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section id="companies" className="py-16">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-display font-bold">Browse Companies</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore leading companies offering internship opportunities across various industries
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search companies..."
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Companies Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-4">
                    <LoadingSkeleton className="w-16 h-16 rounded-lg" />
                    <div className="space-y-2">
                      <LoadingSkeleton className="h-5 w-32" />
                      <LoadingSkeleton className="h-4 w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCompanies.map(company => (
                <Card 
                  key={company.id} 
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-ring"
                  tabIndex={0}
                  onClick={() => setSelectedCompany(company)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCompany(company);
                    }
                  }}
                >
                  <div className="space-y-4">
                    <img 
                      src={company.logo} 
                      alt={`${company.name} logo`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">{company.industry}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {company.roles.length} positions
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No companies match your search criteria.</p>
            </Card>
          )}
        </div>

        {/* Company Detail Dialog */}
        <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
          <DialogContent className="max-w-2xl">
            {selectedCompany && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={selectedCompany.logo} 
                      alt={`${selectedCompany.name} logo`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <DialogTitle>{selectedCompany.name}</DialogTitle>
                      <Badge variant="secondary">{selectedCompany.industry}</Badge>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-6">
                  <DialogDescription className="text-base">
                    {selectedCompany.description}
                  </DialogDescription>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Available Internship Roles</h4>
                    <div className="grid gap-2">
                      {selectedCompany.roles.map((role, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <PanelRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Eligibility Requirements</h4>
                    <div className="grid gap-2">
                      {selectedCompany.eligibility.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <TableOfContents className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {session?.user && (
                    <div className="pt-4 border-t border-border">
                      <Button className="w-full">
                        Apply to {selectedCompany.name}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-16">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-display font-bold">Student Reviews</h2>
              <p className="text-muted-foreground">See what students say about their experience</p>
            </div>
            <Select value={reviewSort} onValueChange={(value: "recent" | "rating") => setReviewSort(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="flex gap-4">
                    <LoadingSkeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <LoadingSkeleton className="h-5 w-32" />
                        <LoadingSkeleton className="h-4 w-24" />
                      </div>
                      <LoadingSkeleton className="h-4 w-full" />
                      <LoadingSkeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : sortedReviews.length > 0 ? (
            <div className="space-y-6">
              {sortedReviews.map(review => (
                <Card key={review.id} className="p-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      {review.initials}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h4 className="font-semibold">{review.name}</h4>
                        <StarRating rating={review.rating} />
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                        {review.company && (
                          <Badge variant="outline">{review.company}</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{review.text}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No reviews available at this time.</p>
            </Card>
          )}
        </div>
      </section>

      {/* Eligibility Section */}
      <section id="eligibility" className="py-16">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-display font-bold">Eligibility Requirements</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Check if you meet the basic requirements for internship opportunities
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Requirements Card */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5" />
                  Basic Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Age Limits</h4>
                  <p className="text-sm text-muted-foreground">Minimum: 16 years old | Maximum: 25 years old</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Education Levels</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• High School (18+ years required)</li>
                    <li>• College/University (any year)</li>
                    <li>• Graduate Programs</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Preferred Skills</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Strong communication abilities</li>
                    <li>• Relevant coursework or projects</li>
                    <li>• Passion for learning and growth</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Checker */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle>Am I Eligible?</CardTitle>
                <CardDescription>
                  Enter your information to get an instant eligibility check
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Age</label>
                  <Input
                    type="number"
                    placeholder="Enter your age"
                    value={eligibilityAge}
                    onChange={(e) => setEligibilityAge(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Education Level</label>
                  <Select value={eligibilityEducation} onValueChange={setEligibilityEducation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="college">College/University</SelectItem>
                      <SelectItem value="graduate">Graduate Program</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={checkEligibility} className="w-full">
                  Check Eligibility
                </Button>
                
                {eligibilityResult && (
                  <div className={`p-4 rounded-lg ${eligibilityResult.eligible ? 'bg-success-soft text-success' : 'bg-destructive/10 text-destructive'}`}>
                    <p className="text-sm font-medium">
                      {eligibilityResult.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                    </p>
                    <p className="text-sm mt-1">{eligibilityResult.reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FAQs */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-6">
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {faqs.map((faq, index) => (
                <Collapsible key={index} open={openFaq === faq.question} onOpenChange={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left font-medium hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring rounded">
                    {faq.question}
                    <span className="ml-2 text-muted-foreground">
                      {openFaq === faq.question ? '−' : '+'}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pb-4">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLoginSuccess={() => {
          toast.success("Now you can get personalized recommendations!");
          setShowLoginDialog(false);
        }}
      />
    </div>
  );
}