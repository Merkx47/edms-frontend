import { MdArrowDownward, MdApartment, MdCloud, MdCompareArrows, MdDns, MdExpandMore, MdHelpOutline, MdAccountTree, MdInventory2, MdLan, MdMenuBook, MdStorage } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const TenantBuildingIcon = ({ className }: { className?: string }) => <MdApartment className={className} />;

// Type styling configuration
const typeConfig: Record<string, { bg: string; border: string; text: string; icon: React.FC<{ className?: string }> }> = {
  root: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-400 dark:border-red-600', text: 'text-red-700 dark:text-red-400', icon: MdCloud },
  zone: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-400 dark:border-blue-600', text: 'text-blue-700 dark:text-blue-400', icon: MdDns },
  tenant: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-400 dark:border-purple-600', text: 'text-purple-700 dark:text-purple-400', icon: TenantBuildingIcon },
  vdc1: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-400 dark:border-green-600', text: 'text-green-700 dark:text-green-400', icon: MdLan },
  vdc2: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-400 dark:border-amber-600', text: 'text-amber-700 dark:text-amber-400', icon: MdLan },
  vdc3: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-400 dark:border-cyan-600', text: 'text-cyan-700 dark:text-cyan-400', icon: MdLan },
  vdc4: { bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-400 dark:border-pink-600', text: 'text-pink-700 dark:text-pink-400', icon: MdLan },
  vdc5: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-400 dark:border-indigo-600', text: 'text-indigo-700 dark:text-indigo-400', icon: MdInventory2 },
  resource: { bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-slate-400 dark:border-slate-600', text: 'text-slate-700 dark:text-slate-400', icon: MdStorage },
};

// Simple CSS-based organogram - no dynamic SVG
function Organogram() {
  const NodeBox = ({
    label,
    sublabel,
    type
  }: {
    label: string;
    sublabel?: string;
    type: keyof typeof typeConfig;
  }) => {
    const config = typeConfig[type];
    const Icon = config.icon;

    return (
      <div className={cn(
        "px-3 py-2 rounded-lg border-2 bg-background",
        "min-w-[130px] text-center",
        config.border
      )}>
        <div className="flex items-center gap-2 justify-center">
          <Icon className={cn("h-4 w-4 flex-shrink-0", config.text)} />
          <div>
            <p className={cn("text-xs font-semibold", config.text)}>{label}</p>
            {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Vertical connector line with optional label
  const VLine = ({ height = 'h-6', label }: { height?: string; label?: string }) => (
    <div className="flex flex-col items-center">
      <div className={cn("w-0.5 bg-border mx-auto", label ? 'h-2' : height)} />
      {label && (
        <>
          <div className="flex items-center gap-1 py-0.5 px-2 rounded bg-muted/50 text-[9px] text-muted-foreground font-medium">
            <MdArrowDownward className="h-2.5 w-2.5" />
            {label}
          </div>
          <div className="w-0.5 bg-border mx-auto h-2" />
        </>
      )}
    </div>
  );

  // Tenant column with its VDC hierarchy
  const TenantColumn = ({
    tenant,
    levels
  }: {
    tenant: { label: string; sublabel: string };
    levels: { label: string; sublabel: string; type: keyof typeof typeConfig }[];
  }) => (
    <div className="flex flex-col items-center">
      <NodeBox label={tenant.label} sublabel={tenant.sublabel} type="tenant" />
      {levels.map((level, i) => {
        // Determine relationship label
        let relationLabel: string | undefined;
        if (i === 0) relationLabel = 'contains VDC';
        else if (level.type === 'resource') relationLabel = 'deploys';
        else if (level.type.startsWith('vdc')) relationLabel = 'child VDC';

        return (
          <div key={i} className="flex flex-col items-center">
            <VLine label={i === 0 ? relationLabel : undefined} />
            <NodeBox label={level.label} sublabel={level.sublabel} type={level.type} />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(typeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded border-2", config.bg, config.border)} />
            <span className="text-muted-foreground capitalize">
              {type.startsWith('vdc') ? `VDC L${type.slice(3)}` : type === 'zone' ? 'region' : type}
            </span>
          </div>
        ))}
      </div>

      {/* Organogram */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[900px] flex flex-col items-center">
          {/* ROOT */}
          <NodeBox label="ROOT (ManageOne)" sublabel="Cloud Platform Admin" type="root" />
          <VLine label="manages Regions" />

          {/* ZONE */}
          <NodeBox label="Region - Lagos MTN-1" sublabel="Region" type="zone" />

          {/* Zone to Tenants label */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 bg-border h-2" />
            <div className="flex items-center gap-1 py-0.5 px-2 rounded bg-purple-100 dark:bg-purple-950/50 text-[9px] text-purple-700 dark:text-purple-400 font-medium border border-purple-200 dark:border-purple-800">
              <MdExpandMore className="h-2.5 w-2.5" />
              contains TENANTS
            </div>
            <div className="w-0.5 bg-border h-2" />
          </div>

          {/* Horizontal bar connecting to tenants */}
          <div className="relative w-[800px]">
            <div className="h-0.5 bg-border w-full" />
            {/* 4 vertical drops */}
            <div className="absolute top-0 left-0 right-0 flex justify-between px-[88px]">
              <div className="w-0.5 h-4 bg-border" />
              <div className="w-0.5 h-4 bg-border" />
              <div className="w-0.5 h-4 bg-border" />
              <div className="w-0.5 h-4 bg-border" />
            </div>
          </div>

          {/* Tenants row with their VDC flows */}
          <div className="grid grid-cols-4 gap-6 mt-4 w-[800px]">
            {/* Tenant 1: Bank Corp - Full 5 levels */}
            <TenantColumn
              tenant={{ label: "Bank Corp", sublabel: "Financial Services" }}
              levels={[
                { label: "VDC L1", sublabel: "Enterprise", type: "vdc1" },
                { label: "VDC L2", sublabel: "IT Division", type: "vdc2" },
                { label: "VDC L3", sublabel: "Infrastructure", type: "vdc3" },
                { label: "VDC L4", sublabel: "Network Team", type: "vdc4" },
                { label: "VDC L5", sublabel: "Project Alpha", type: "vdc5" },
                { label: "Resources", sublabel: "ECS, EVS, VPC", type: "resource" },
              ]}
            />

            {/* Tenant 2: Telco Inc - 3 levels */}
            <TenantColumn
              tenant={{ label: "Telco Inc", sublabel: "Telecommunications" }}
              levels={[
                { label: "VDC L1", sublabel: "Operations", type: "vdc1" },
                { label: "VDC L2", sublabel: "Network Ops", type: "vdc2" },
                { label: "VDC L3", sublabel: "5G Core", type: "vdc3" },
                { label: "Resources", sublabel: "ECS, CCE, RDS", type: "resource" },
              ]}
            />

            {/* Tenant 3: Gov Agency - 2 levels */}
            <TenantColumn
              tenant={{ label: "Gov Agency", sublabel: "Government" }}
              levels={[
                { label: "VDC L1", sublabel: "Services", type: "vdc1" },
                { label: "VDC L2", sublabel: "Portal", type: "vdc2" },
                { label: "Resources", sublabel: "ECS, OBS, WAF", type: "resource" },
              ]}
            />

            {/* Tenant 4: Retail Co - 4 levels */}
            <TenantColumn
              tenant={{ label: "Retail Co", sublabel: "E-Commerce" }}
              levels={[
                { label: "VDC L1", sublabel: "Platform", type: "vdc1" },
                { label: "VDC L2", sublabel: "Engineering", type: "vdc2" },
                { label: "VDC L3", sublabel: "Backend", type: "vdc3" },
                { label: "VDC L4", sublabel: "Microservices", type: "vdc4" },
                { label: "Resources", sublabel: "CCE, DCS, DMS", type: "resource" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-muted-foreground">
        Note: Resources (ECS, EVS, VPC, etc.) can be deployed at ANY VDC level (L1-L5), not just the bottom. The diagram shows them at the end for simplicity.
      </p>

      {/* Cross-Tenant Structural Comparison */}
      <div className="mt-6 rounded-lg border border-card-border bg-card/50 backdrop-blur-sm p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <MdCompareArrows className="h-4 w-4 text-primary" />
          Cross-Tenant Structural Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Tenant Name</th>
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Industry</th>
                <th className="text-center py-2 px-3 font-semibold text-muted-foreground">VDC Depth</th>
                <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Total Services</th>
                <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Has L5 VDCs</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Bank Corp', industry: 'Financial Services', depth: 5, services: 3, hasL5: true },
                { name: 'Telco Inc', industry: 'Telecommunications', depth: 3, services: 3, hasL5: false },
                { name: 'Gov Agency', industry: 'Government', depth: 2, services: 3, hasL5: false },
                { name: 'Retail Co', industry: 'E-Commerce', depth: 4, services: 3, hasL5: false },
              ].map((t) => (
                <tr key={t.name} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-3 font-medium">{t.name}</td>
                  <td className="py-2 px-3 text-muted-foreground">{t.industry}</td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant="secondary">{t.depth}</Badge>
                  </td>
                  <td className="py-2 px-3 text-center">{t.services}</td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant={t.hasL5 ? 'default' : 'secondary'}>
                      {t.hasL5 ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Guide() {
  const faqs = [
    {
      question: "What is the Root level in Huawei Cloud Stack?",
      answer: "The Root level (ManageOne) is the top-level cloud platform administrator. It manages global policies, billing, monitoring, and has visibility across all regions, tenants, and VDCs. This is where cloud platform administrators configure the overall infrastructure."
    },
    {
      question: "What are Regions?",
      answer: "Regions are physical or logical separations of infrastructure within a data center or across data centers. They provide high availability and disaster recovery capabilities. A single Root can have multiple regions (e.g., Lagos MTN-1, AF South), and each region can host multiple tenants."
    },
    {
      question: "What is a Tenant?",
      answer: "A Tenant represents an isolated organization or enterprise within the cloud platform. Each tenant has its own administrators, quotas, and resources that are logically separated from other tenants. Multiple tenants can exist within the same region, and a tenant can span multiple regions for disaster recovery."
    },
    {
      question: "What are VDC Levels 1-5?",
      answer: "VDC (Virtual Data Center) levels provide hierarchical resource allocation and management:\n\n• Level 1 (Enterprise): Top-level quota pool for the entire organization\n• Level 2 (Division): Business unit allocation (e.g., IT, Finance)\n• Level 3 (Department): Functional team allocation\n• Level 4 (Team): Sub-team allocation\n• Level 5 (Project): Individual project allocation\n\nEach level inherits quota from its parent and can subdivide it further."
    },
    {
      question: "Can both Upper and Lower VDCs have resources deployed?",
      answer: "Yes, resources can be deployed at any VDC level. Upper-level VDCs typically host shared infrastructure (common databases, monitoring systems), while lower-level VDCs host project-specific resources. The quota flows down from upper to lower levels."
    },
    {
      question: "Can a Resource Space be created at any VDC level?",
      answer: "Yes! A Resource Space can be created at ANY VDC level (1-5), not just at the bottom. Common patterns:\n\n• Level 1: Shared VPC, Central Monitoring, DR Storage\n• Level 2: Shared Dev Environment, CI/CD\n• Level 3: Kubernetes Clusters, Team Databases\n• Level 4: Load Balancers, Firewalls\n• Level 5: Project-specific VMs, Databases"
    },
    {
      question: "How does quota inheritance work?",
      answer: "Each level can only allocate UP TO what its parent allocated:\n\n• Child VDC quota ≤ Parent VDC quota\n• Sum of children quotas can exceed parent (overcommitment)\n• Quotas cascade: Compute (vCPU, RAM), Storage (EVS, OBS), Network (VPCs, EIPs)"
    },
    {
      question: "Can a Tenant span multiple Regions?",
      answer: "Yes, a tenant can have presence in multiple regions for high availability and disaster recovery. For example, 'Bank Corp' could have resources in both Lagos MTN-1 (primary) and AF South (DR) regions."
    },
    {
      question: "What admin roles exist at each level?",
      answer: "• Cloud Admin: Root/ManageOne level - platform-wide control\n• Infrastructure Admin: Region level - physical infrastructure\n• Tenant Admin: Tenant level - organization-wide\n• VDC Admin: Each VDC level has its own admin with scope limited to that VDC and below\n• Users: Deploy and manage resources within their allocated VDC"
    },
    {
      question: "How does this relate to FinOps?",
      answer: "Understanding this hierarchy is crucial for FinOps because:\n\n• Cost allocation follows the VDC hierarchy\n• Budgets can be set at any level\n• Chargeback/showback reports by tenant, VDC, or project\n• Resource optimization recommendations are context-aware\n• Quota utilization tracking ensures efficient resource use"
    },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1600px] mx-auto" data-testid="guide-page">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <MdMenuBook className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">HCS Architecture Guide</h1>
              <p className="text-sm text-muted-foreground">Understand the Huawei Cloud Stack hierarchy, VDC levels, and resource organization</p>
            </div>
          </div>
        </div>

        {/* Architecture Organogram */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MdAccountTree className="h-5 w-5 text-primary" />
              Architecture Hierarchy
              <Badge variant="secondary" className="ml-2">Cloud Stack 8.x</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Organogram />
          </CardContent>
        </Card>

        {/* Summary Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MdAccountTree className="h-5 w-5 text-primary" />
              Hierarchy Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Level</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Purpose</th>
                    <th className="text-left py-3 px-4 font-semibold">Admin Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Can Have Resources?</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { level: 'Root', name: 'ManageOne', purpose: 'Platform management', admin: 'Cloud Admin', resources: 'N/A', color: 'bg-red-500' },
                    { level: 'Region', name: 'Region', purpose: 'Physical separation', admin: 'Infra Admin', resources: 'N/A', color: 'bg-blue-500' },
                    { level: 'Tenant', name: 'Organization', purpose: 'Enterprise isolation', admin: 'Tenant Admin', resources: 'N/A', color: 'bg-purple-500' },
                    { level: 'VDC L1', name: 'Enterprise', purpose: 'Top quota pool', admin: 'Enterprise Admin', resources: 'Yes', color: 'bg-green-500' },
                    { level: 'VDC L2', name: 'Division', purpose: 'Business unit', admin: 'Division Admin', resources: 'Yes', color: 'bg-amber-500' },
                    { level: 'VDC L3', name: 'Department', purpose: 'Functional team', admin: 'Dept Admin', resources: 'Yes', color: 'bg-cyan-500' },
                    { level: 'VDC L4', name: 'Team', purpose: 'Sub-team', admin: 'Team Admin', resources: 'Yes', color: 'bg-pink-500' },
                    { level: 'VDC L5', name: 'Project', purpose: 'Individual project', admin: 'Project Admin', resources: 'Yes', color: 'bg-indigo-500' },
                  ].map((row) => (
                    <tr
                      key={row.level}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", row.color)} />
                          <span className="font-medium">{row.level}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{row.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.purpose}</td>
                      <td className="py-3 px-4">{row.admin}</td>
                      <td className="py-3 px-4">
                        <Badge variant={row.resources === 'Yes' ? 'default' : 'secondary'}>
                          {row.resources}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MdHelpOutline className="h-5 w-5 text-primary" />
              Frequently Asked Questions
              <Badge variant="secondary" className="ml-2">{faqs.length} Questions</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-8 text-muted-foreground whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
