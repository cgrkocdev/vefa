"use client";

import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <Card><ErrorState onRetry={reset} description="İşlem sırasında bir sorun oluştu. Verileriniz etkilenmedi." /></Card>;
}
