import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import HeaderNav from "@/components/HeaderNav";

export default function DashboardPage() {
  const recommendations = [
    {
      company: "Tata Consultancy Services",
      role: "Software Development Intern", 
      location: "Pune (Hybrid)",
      match: 92,
      duration: "6 months",
      stipend: "₹20,000/mo",
      startDate: "Oct 2025",
    },
    {
      company: "HDFC Bank",
      role: "Data Analytics Intern",
      location: "Mumbai",
      match: 88,
      duration: "3 months",
      stipend: "₹18,000/mo",
      startDate: "Nov 2025",
    },
    {
      company: "Infosys",
      role: "IT Support / Helpdesk Intern",
      location: "Remote",
      match: 84,
      duration: "4 months",
      stipend: "₹15,000/mo",
      startDate: "Immediate",
    },
    {
      company: "Byju's",
      role: "Operations Intern",
      location: "Bengaluru",
      match: 81,
      duration: "3-6 months",
      stipend: "₹12,000-18,000/mo",
      startDate: "Oct 2025",
    },
  ];

  return (
    <>
      <HeaderNav />
      <div className="container mx-auto max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your personal dashboard</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>View and edit your personal profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Your profile data will appear here</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Recommended Internships</CardTitle>
              <CardDescription>Personalized matches based on your eligibility and background</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4 bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">{rec.company}</div>
                        <div className="font-medium text-base">{rec.role}</div>
                        <div className="text-sm text-muted-foreground">{rec.location}</div>
                      </div>
                      <div className="text-right min-w-[88px]">
                        <div className="text-xs text-muted-foreground">Match</div>
                        <div className="font-bold text-lg">{rec.match}<span className="text-xs font-normal">/100</span></div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${rec.match}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {rec.duration && <span className="px-2 py-1 rounded-full bg-secondary">Duration: {rec.duration}</span>}
                      {rec.stipend && <span className="px-2 py-1 rounded-full bg-secondary">Stipend: {rec.stipend}</span>}
                      {rec.startDate && <span className="px-2 py-1 rounded-full bg-secondary">Start: {rec.startDate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}