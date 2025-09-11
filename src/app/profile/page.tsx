"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Prefs {
  domain: string;
  location: string;
  skills: string;
}

const defaultPrefs: Prefs = { domain: "", location: "", skills: "" };

export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Suggested popular skills
  const suggestedSkills = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "SQL",
  "Figma",
  "Data Analysis",
  "Machine Learning",
  "Marketing",
  "UI/UX"];


  // Indian states + common options
  const states = [
  "Remote",
  "Any",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep"];


  useEffect(() => {
    try {
      const raw = localStorage.getItem("ls_prefs");
      if (raw) setPrefs({ ...defaultPrefs, ...JSON.parse(raw) });
      setName(session?.user?.name || "");
    } catch {}
  }, [session?.user?.name]);

  const onChange = (key: keyof Prefs, val: string) => setPrefs((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("ls_prefs", JSON.stringify(prefs));
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Unable to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    const list = prefs.skills.
    split(",").
    map((s) => s.trim()).
    filter(Boolean);
    if (!list.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      const next = [...list, skill].join(", ");
      onChange("skills", next);
    }
  };

  const initials = (session?.user?.name || session?.user?.email || "U").
  split(" ").
  map((n: string) => n[0]).
  slice(0, 2).
  join("").
  toUpperCase();

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 lg:col-start-2">
          <CardHeader>
            <CardTitle className="font-display">Edit Profile</CardTitle>
            <CardDescription>Update your basic info and recommendation preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="transition-all duration-200 focus:ring-2 focus:ring-ring" />

              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input value={session?.user?.email || ""} disabled placeholder="Email" />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg font-display">Preferences for Recommendations</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Preferred Domain / Field</label>
                  <Select value={prefs.domain} onValueChange={(v) => onChange("domain", v)}>
                    <SelectTrigger className="transition-all duration-200 hover:border-border/60">
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
                  <Select value={prefs.location} onValueChange={(v) => onChange("location", v)}>
                    <SelectTrigger className="transition-all duration-200 hover:border-border/60">
                      <SelectValue placeholder="Select state / Remote" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((st) =>
                      <SelectItem key={st} value={st}>{st}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Interests / Skills (optional)</label>
                  <Input
                    placeholder="e.g. React, SQL, Content, Figma"
                    value={prefs.skills}
                    onChange={(e) => onChange("skills", e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-ring" />

                  {!!prefs.skills &&
                  <div className="flex flex-wrap gap-1 mt-2">
                      {prefs.skills.split(",").map((s, i) =>
                    <Badge key={i} variant="secondary" className="text-xs animate-in fade-in-0">
                          {s.trim()}
                        </Badge>
                    )}
                    </div>
                  }
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Suggested skills</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSkills.map((s) =>
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSkill(s)}
                        className="px-2 py-1 rounded-full border border-border text-xs hover:bg-accent/60">

                          + {s}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="transition-all duration-200 hover:scale-105 active:scale-95">

                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/recommendations" className="transition-all duration-200 hover:bg-accent">
                  See Recommendations
                </Link>
              </Button>
              <Button variant="ghost" onClick={() => router.push("/")}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="!w-96 !h-[429px] !flex-col !items-stretch">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="font-display">Summary</CardTitle>
                <CardDescription>Your current preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span> {name || session?.user?.name || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span> {session?.user?.email || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Domain:</span> {prefs.domain || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span> {prefs.location || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Skills:</span> {prefs.skills || "—"}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>);

}