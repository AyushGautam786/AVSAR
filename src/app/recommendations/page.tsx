"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Sparkles, MapPin, Briefcase, Percent } from "lucide-react";

interface Prefs {
  domain: string;
  location: string;
  skills: string;
}

interface RecommendationItem {
  id: string;
  company: string;
  role: string;
  location: string;
  match: number;
  duration?: string;
  stipend?: string;
  startDate?: string;
}

const defaultPrefs: Prefs = { domain: "", location: "", skills: "" };

export default function Page() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ls_prefs");
      if (raw) setPrefs({ ...defaultPrefs, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    if (!isPending && !session?.user) {
      toast.message("Login for personalized recommendations");
    }
  }, [isPending, session]);

  const onChange = (key: keyof Prefs, val: string) => setPrefs((p) => ({ ...p, [key]: val }));

  const handleSubmit = () => {
    if (!prefs.domain || !prefs.location) {
      toast.error("Please fill domain and location");
      return;
    }
    try {
      localStorage.setItem("ls_prefs", JSON.stringify(prefs));
    } catch {}
    setSubmitted(true);
    toast.success("Recommendations updated");
  };

  const recommendations: RecommendationItem[] = useMemo(() => {
    const base: RecommendationItem[] = [
      { id: "1", company: "TechCorp", role: "Software Engineering Intern", location: prefs.location || "Remote", match: 92, duration: "3-6 months", stipend: "₹15,000/mo", startDate: "Oct 1" },
      { id: "2", company: "DataWorks AI", role: "AI/ML Intern", location: prefs.location || "Remote", match: 88, duration: "4 months", stipend: "₹18,000/mo", startDate: "Nov 10" },
      { id: "3", company: "MarketGenius", role: "Marketing Intern", location: prefs.location || "Remote", match: 81, duration: "8 weeks", stipend: "₹10,000/mo", startDate: "Sep 20" },
      { id: "4", company: "EduTech Innovations", role: "Learning Design Intern", location: prefs.location || "Remote", match: 77 },
    ];
    if (!prefs.domain) return base;
    const term = prefs.domain.toLowerCase();
    return base
      .filter((r) => `${r.company} ${r.role}`.toLowerCase().includes(term))
      .concat(
        base.filter((r) => !`${r.company} ${r.role}`.toLowerCase().includes(term)).slice(0, 2)
      )
      .slice(0, 4);
  }, [prefs.domain, prefs.location]);

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Get Recommendations</CardTitle>
            <CardDescription>Tell us your interests to tailor internship matches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Domain / Field</label>
              <Select value={prefs.domain} onValueChange={(v) => onChange("domain", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web Development">Web Development</SelectItem>
                  <SelectItem value="AI/ML">AI/ML</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="Product">Product Management</SelectItem>
                  <SelectItem value="Design">Design / UX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Location</label>
              <Input
                placeholder="City/Region or Remote"
                value={prefs.location}
                onChange={(e) => onChange("location", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Interests / Skills (optional)</label>
              <Input
                placeholder="e.g. React, SQL, Content, Figma"
                value={prefs.skills}
                onChange={(e) => onChange("skills", e.target.value)}
              />
              {!!prefs.skills && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {prefs.skills.split(",").map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>
            <Button className="w-full" onClick={handleSubmit}>Update Recommendations</Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>Back to Home</Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Recommended Internships</h2>
            <p className="text-sm text-muted-foreground">Based on your preferences{prefs.domain || prefs.location ? 
              `: ${[prefs.domain, prefs.location].filter(Boolean).join(" • ")}` : 
              ""}</p>
          </div>

          {(submitted || prefs.domain || prefs.location) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{rec.company}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="h-4 w-4" /> {rec.role}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Percent className="h-4 w-4" />
                        <span className="font-semibold">{rec.match}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" /> {rec.location}</div>
                    <div className="h-2 w-full bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${rec.match}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {rec.duration && <span>Duration: {rec.duration}</span>}
                      {rec.stipend && <span>Stipend: {rec.stipend}</span>}
                      {rec.startDate && <span>Start: {rec.startDate}</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Fill your preferences to see recommendations.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}