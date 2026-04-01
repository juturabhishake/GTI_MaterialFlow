"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ClipboardCheck, AlertCircle, CheckCircle2, UserCheck, Timer, FileText, TrendingUp, BarChart3 } from "lucide-react";
import { Pie, PieChart, Cell, Label } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { useAccessCheck } from '@/lib/useAccessCheck';
// import { cn } from "@/lib/utils";

const pieColors = {
  ncGrade: { "Major": "#f43f5e", "Minor": "#fbbf24", "OFI": "#3b82f6" },
  approval: { "Approved": "#10b981", "Pending": "#94a3b8" },
};

const kpiIcons = {
  "Total Audits": ClipboardCheck,
  "Total NCs": AlertCircle,
  "Pending Why-Analysis": Timer,
  "HOD Approved": CheckCircle2,
  "HOS Approved": UserCheck
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

function DashboardFilterControls({ timeRange, monthYear, onTimeRangeChange, onMonthYearChange }) {
  return (
    <div className="flex flex-wrap sm:flex-row items-center gap-3 bg-secondary/30 p-2 rounded-xl border border-border/50 backdrop-blur-md">
      <div className="w-full sm:w-auto">
        <Input 
          type="month" 
          value={monthYear} 
          onChange={(e) => { onMonthYearChange(e.target.value); onTimeRangeChange("custom"); }} 
          className="h-9 w-full sm:w-full bg-background/50 border-none shadow-inner focus-visible:ring-primary/30"
        />
      </div>
      <div className="h-6 w-[1px] bg-border/60 mx-1 hidden sm:block" />
      <ToggleGroup 
        type="single" 
        value={timeRange} 
        onValueChange={(v) => v && onTimeRangeChange(v)} 
        variant="outline" 
        size="sm" 
        className="flex w-full sm:w-auto bg-background/40 rounded-lg p-0.5"
      >
        {["7d", "30d", "90d", "180d"].map((val) => (
          <ToggleGroupItem 
            key={val} 
            value={val} 
            className="flex-1 sm:flex-none px-3 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all duration-200"
          >
            {val === "7d" ? "1W" : val === "30d" ? "1M" : val === "90d" ? "3M" : "6M"}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

function StatusPieChart({ data, title, description }) {
  const chartConfig = { value: { label: "Count" } };
  const total = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

  return (
    <motion.div variants={itemVariants}>
      <Card className="flex h-full flex-col border-none shadow-xl bg-gradient-to-b from-card to-secondary/20 overflow-hidden group">
        <CardHeader className="pb-0 pt-6 px-6 items-start">
          <CardTitle className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">{title}</CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-6 relative">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[220px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie 
                data={data} 
                dataKey="value" 
                nameKey="name" 
                innerRadius={65} 
                outerRadius={85}
                paddingAngle={5}
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} className="hover:opacity-80 transition-opacity outline-none" />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">{total}</tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-xs font-medium uppercase tracking-widest">Total</tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="grid grid-cols-2 gap-3 px-2 mt-2">
            {data.map((item) => (
              <div key={item.name} className="flex flex-col items-center p-2 rounded-lg bg-background/40 border border-border/40 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground truncate">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const KpiCard = ({ title, value, icon: Icon } ) => (
  <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
    <Card className="h-full border-none shadow-lg bg-gradient-to-br from-card via-card to-secondary/30 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        {/* <Icon size={64} className="text-primary" /> */}
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground/80">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tighter mb-1">{value}</div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
          <TrendingUp size={12} />
          <span>Live updates</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function AuditDashboard() {
  const PAGE_ID_FOR_THIS_FORM = 1;
  const { isLoading: isAccessLoading, hasAccess } = useAccessCheck(PAGE_ID_FOR_THIS_FORM);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7));
  useEffect(() => {
      if (isAccessLoading) {
          return;
      }
  }, [isAccessLoading, hasAccess]);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard/analytics?timeRange=${timeRange}&monthYear=${monthYear}`);
        setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [timeRange, monthYear]);

  const kpis = useMemo(() => data.filter(i => i.Category === 'kpiCard'), [data]);
  const ncData = useMemo(() => data.filter(i => i.Category === 'ncGradePie').map(i => ({
    name: i.Name, value: i.Value,
    fill: i.Name.includes("Major") ? pieColors.ncGrade.Major : i.Name.includes("Minor") ? pieColors.ncGrade.Minor : pieColors.ncGrade.OFI
  })), [data]);
  const hodData = useMemo(() => data.filter(i => i.Category === 'hodStatusPie').map(i => ({ name: i.Name, value: i.Value, fill: pieColors.approval[i.Name] || "#94a3b8" })), [data]);
  const hosData = useMemo(() => data.filter(i => i.Category === 'hosStatusPie').map(i => ({ name: i.Name, value: i.Value, fill: pieColors.approval[i.Name] || "#94a3b8" })), [data]);

  return (
    <div>
      {isLoading || isAccessLoading ? (
        <motion.div 
          key="loader"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex h-[50vh] flex-col items-center justify-center gap-4"
        >
          <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
          </div>
          <p className="text-sm font-bold text-muted-foreground animate-pulse tracking-widest uppercase">Fetching Data...</p>
        </motion.div>
      ) : (
        <div>
      {!hasAccess ? (
        <div className="text-center text-destructive">
            <Card className="w-full mx-auto">
              <CardHeader>
                <CardTitle className="text-primary">Dashboard Access Denied</CardTitle>
                <CardDescription>You do not have permission to view this page.</CardDescription>
              </CardHeader>
            </Card>
        </div>
      ) : (
        <div className="space-y-8 bg-background min-h-screen selection:bg-primary/20">
          <div className="p-4 px-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary mb-1">
                <BarChart3 size={20} className="animate-pulse" />
                <span className="text-sm font-black uppercase tracking-widest">Enterprise Analytics</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Process Audit Dashboard</h1>
              <p className="text-sm font-medium text-muted-foreground/80">Monitor compliance, why-analysis, and cross-departmental approvals.</p>
            </div>
            <DashboardFilterControls timeRange={timeRange} monthYear={monthYear} onTimeRangeChange={setTimeRange} onMonthYearChange={setMonthYear} />
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex h-[50vh] flex-col items-center justify-center gap-4"
              >
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                </div>
                <p className="text-sm font-bold text-muted-foreground animate-pulse tracking-widest uppercase">Fetching Intelligence...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                variants={containerVariants} initial="hidden" animate="visible" 
                className="space-y-2"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 md:grid-cols-3">
                  {kpis.map((k) => <KpiCard key={k.Name} title={k.Name} value={k.Value} icon={kpiIcons[k.Name] || FileText} />)}
                </div>
            
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                  <StatusPieChart data={ncData} title="Non-Compliance Distribution" description="Severity levels within selected range" />
                  <StatusPieChart data={hodData} title="HOD Approval Stream" description="Department head verification status" />
                  <StatusPieChart data={hosData} title="HOS Approval Stream" description="Section head verification status" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )        
      }
    </div>
      )}
    </div>
  );
}