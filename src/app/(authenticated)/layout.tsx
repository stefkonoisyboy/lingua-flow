import { ReactNode } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
