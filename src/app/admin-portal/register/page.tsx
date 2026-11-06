"use client";

import * as React from "react";
import { EnterpriseProfileWizard } from "@/components/auth/EnterpriseProfileWizard";

export default function AdminPortalRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-[#07080b]">
      <EnterpriseProfileWizard initialDepartment="IT" portalType="systems" />
    </div>
  );
}
