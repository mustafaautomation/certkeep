"use client";

import { DashboardView, type DashboardData } from "@/components/dashboard-view";
import { PanelState, useApi } from "@/components/use-api";

export default function OverviewPage() {
  const { data, error, loading, reload } = useApi<DashboardData>("/api/dashboard");
  return (
    <PanelState loading={loading} error={error} onRetry={reload}>
      {data ? <DashboardView data={data} /> : null}
    </PanelState>
  );
}
