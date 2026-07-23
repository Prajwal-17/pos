import { FileBarChart } from "lucide-react";

const ReportsPage = () => {
  return (
    <div className="bg-background flex h-full min-h-0 items-center justify-center p-3">
      <section className="border-border bg-card w-full max-w-md rounded-[var(--radius-panel)] border p-4 text-center">
        <span className="bg-brand-soft text-brand-foreground mx-auto flex size-10 items-center justify-center rounded-[var(--radius-control)]">
          <FileBarChart className="size-5" />
        </span>
        <h1 className="text-foreground mt-3 text-lg font-semibold">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Reporting tools are not available yet. Sales and estimate summaries remain available from
          their dashboards.
        </p>
      </section>
    </div>
  );
};

export default ReportsPage;
