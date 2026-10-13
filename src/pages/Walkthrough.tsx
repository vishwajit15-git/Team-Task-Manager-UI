import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, UserCheck, Sparkles, Building, Mail, Award, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";

export interface DemoMember {
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  title: string;
  department: string;
  bio: string;
  skills: string[];
  avatar: string;
  permissions: string;
}

export const DEMO_MEMBERS: DemoMember[] = [
  {
    name: "Elena Rostova",
    email: "admin.elena@cloudscale.io",
    role: "ADMIN",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    title: "Engineering Director & Enterprise Architect",
    department: "Engineering Leadership",
    bio: "Leads technical strategy, team staffing, project roadmaps, and cross-functional engineering delivery.",
    skills: ["Distributed Systems", "Zero-Trust Security", "System Architecture", "Leadership"],
    permissions: "Full Administrator: Project Settings, Member Invites & Removal, Task Creation & Deletion, File Management, Poll Creation"
  },
  {
    name: "Marcus Vance",
    email: "marcus.v@cloudscale.io",
    role: "MEMBER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    title: "Principal Cloud Architect",
    department: "Backend Platform",
    bio: "Architecting high-concurrency microservices, event streaming, Redis caching, and database schemas.",
    skills: ["High-Concurrency Backends", "Redis Pub/Sub", "PostgreSQL", "Node.js"],
    permissions: "Member: Task Updates, Code Collaboration, Team Chat, File Uploads, Poll Voting"
  },
  {
    name: "Sophia Lin",
    email: "sophia.l@cloudscale.io",
    role: "MEMBER",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    title: "Principal Frontend Engineer",
    department: "Frontend Engineering",
    bio: "Designs modern UI component libraries, timeline visualizations, and frontend architecture performance.",
    skills: ["React 19", "TypeScript", "Tailwind CSS", "Timeline Engine"],
    permissions: "Member: Task Workflow, Kanban Management, Comments, Timeline View"
  },
  {
    name: "David O'Connor",
    email: "david.devops@cloudscale.io",
    role: "MEMBER",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    title: "DevOps & SRE Lead",
    department: "Infrastructure & Reliability",
    bio: "Manages multi-region Kubernetes clusters, CI/CD deployment pipelines, and high-availability SLAs.",
    skills: ["Kubernetes", "Helm", "GitOps", "Disaster Recovery", "Terraform"],
    permissions: "Member: Infrastructure Tasks, Deployment Tracking, Status Monitoring"
  },
  {
    name: "Amara Okafor",
    email: "amara.design@cloudscale.io",
    role: "MEMBER",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
    title: "Principal Product Designer",
    department: "Product & UX",
    bio: "Champions user experience, design systems, design-to-code consistency, and token architectures.",
    skills: ["Design Systems", "Figma Token Systems", "Enterprise UX", "Design Audit"],
    permissions: "Member: Design Assets, Brand Files, Review Workflows, Feedback"
  },
  {
    name: "Kenji Takahashi",
    email: "kenji.sec@cloudscale.io",
    role: "MEMBER",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    title: "Senior Security Engineer",
    department: "Infosec & Compliance",
    bio: "Oversees SOC2 Type II compliance, encryption at rest/in transit, KMS keys, and penetration testing.",
    skills: ["SOC2 Type II", "KMS Secrets", "RBAC", "Vulnerability Auditing"],
    permissions: "Member: Security Reviews, Policy Tasks, Team Communication"
  },
  {
    name: "Rachel Green",
    email: "rachel.qa@cloudscale.io",
    role: "MEMBER",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    title: "Lead QA & Automation Engineer",
    department: "Quality Engineering",
    bio: "Builds comprehensive automated E2E testing suites, integration pipelines, and regression gates.",
    skills: ["Playwright", "Cypress", "Automation Suites", "Regression CI"],
    permissions: "Member: Quality Assurance Tasks, Bug Tracking, Release Signoff"
  },
  {
    name: "Tariq Al-Mansoor",
    email: "tariq.data@cloudscale.io",
    role: "MEMBER",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    title: "Staff Data Engineer",
    department: "Data Engineering",
    bio: "Scales real-time Kafka event buses, analytics pipelines, and data warehouse queries.",
    skills: ["Kafka Streaming", "ClickHouse OLAP", "ETL Pipelines", "Python"],
    permissions: "Member: Data Tasks, Analytics Reviews, Collaboration"
  }
];

export function Walkthrough() {
  const navigate = useNavigate();

  const handleSelectUser = (member: DemoMember) => {
    navigate(`/login?email=${encodeURIComponent(member.email)}&name=${encodeURIComponent(member.name)}`);
  };

  const adminMember = DEMO_MEMBERS.find((m) => m.role === "ADMIN")!;
  const regularMembers = DEMO_MEMBERS.filter((m) => m.role !== "ADMIN");

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#111111] p-4 sm:p-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D1CDC4] pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              className="rounded-none border-[#D1CDC4] hover:bg-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Button>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1F4D3A] text-white text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-[#C6A15B]" />
              Interactive Walkthrough
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#1F4D3A]" />
            Credentials automatically managed & pre-filled
          </div>
        </div>

        {/* Title & Instructions */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            Select a Team Persona
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
            Experience <strong>Team Task Manager</strong> from any role. Select an Administrator or a Team Member below—you will be redirected to the sign-in page with their credentials pre-filled so you can enter with one click.
          </p>
        </div>

        {/* SECTION 1: ADMIN PERSONA */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1F4D3A]">
            <ShieldCheck className="h-4 w-4 text-[#C6A15B]" />
            Administrator Role (Full Permissions)
          </div>

          <div className="bg-white border-2 border-[#1F4D3A] p-6 shadow-md hover:shadow-lg transition-shadow relative">
            <div className="absolute top-0 right-0 bg-[#1F4D3A] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 flex items-center gap-1">
              <Award className="h-3 w-3 text-[#C6A15B]" />
              Recommended for full demo
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={adminMember.avatar}
                  alt={adminMember.name}
                  className="w-16 h-16 object-cover border-2 border-[#C6A15B] shrink-0"
                />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-[#111111]">{adminMember.name}</h2>
                    <span className="bg-[#C6A15B] text-[#111111] text-[10px] font-bold uppercase px-2 py-0.5">
                      {adminMember.role}
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Building className="h-3 w-3 text-slate-400" />
                      {adminMember.department}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#1F4D3A]">{adminMember.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{adminMember.bio}</p>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {adminMember.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-1 text-[11px] text-slate-500">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">{adminMember.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                <Button
                  onClick={() => handleSelectUser(adminMember)}
                  className="bg-[#1F4D3A] hover:bg-[#1F4D3A]/90 text-white font-bold uppercase tracking-widest text-xs px-6 py-5 rounded-none flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <UserCheck className="h-4 w-4" />
                  Select Admin & Continue
                </Button>
                <span className="text-[10px] text-center text-slate-400 font-medium">
                  Includes project settings & member management
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: TEAM MEMBERS */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-[#1F4D3A]" />
              Team Members ({regularMembers.length} Personas)
            </div>
            <span className="text-xs text-slate-500">Choose any member to test task & role isolation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularMembers.map((member) => (
              <div
                key={member.email}
                className="bg-white border border-[#D1CDC4] p-5 flex flex-col justify-between hover:border-[#1F4D3A] transition-all hover:shadow-md group"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 object-cover border border-[#D1CDC4] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-sm text-[#111111] group-hover:text-[#1F4D3A] transition-colors truncate">
                          {member.name}
                        </h3>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {member.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#C6A15B] font-bold truncate">{member.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{member.department}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {member.bio}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {member.skills.slice(0, 3).map((s) => (
                      <span key={s} className="px-1.5 py-0.5 bg-slate-50 text-slate-600 text-[10px] border border-slate-200">
                        {s}
                      </span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="px-1 py-0.5 text-slate-400 text-[10px]">
                        +{member.skills.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="font-mono text-[10px] truncate">{member.email}</span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100">
                  <Button
                    onClick={() => handleSelectUser(member)}
                    variant="outline"
                    className="w-full rounded-none border-[#1F4D3A] text-[#1F4D3A] hover:bg-[#1F4D3A] hover:text-white font-bold uppercase tracking-wider text-[11px] py-2 cursor-pointer transition-colors"
                  >
                    Select {member.name.split(" ")[0]} & Sign In
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
