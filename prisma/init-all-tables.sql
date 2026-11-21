CREATE TABLE IF NOT EXISTS "TwoFactorRecoveryCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TwoFactorRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "StorageAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'general',
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StorageAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EmailCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" DATETIME,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "ApiEndpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authType" TEXT NOT NULL DEFAULT 'BEARER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "healthStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "lastLatencyMs" INTEGER,
    "lastPingAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Webhook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT '["*"]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS "TwoFactorRecoveryCode_userId_idx" ON "TwoFactorRecoveryCode"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_sessionToken_idx" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE UNIQUE INDEX IF NOT EXISTS "StorageAsset_key_key" ON "StorageAsset"("key");
CREATE INDEX IF NOT EXISTS "StorageAsset_folder_idx" ON "StorageAsset"("folder");
CREATE INDEX IF NOT EXISTS "StorageAsset_createdAt_idx" ON "StorageAsset"("createdAt");
CREATE INDEX IF NOT EXISTS "EmailCampaign_status_idx" ON "EmailCampaign"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key");
CREATE TABLE IF NOT EXISTS "EmployeeProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "personalEmail" TEXT,
    "phone" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "managerName" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Lagos, Nigeria',
    "emergencyContact" TEXT,
    "annualLeaveBalance" INTEGER NOT NULL DEFAULT 20,
    "usedLeaveDays" INTEGER NOT NULL DEFAULT 0,
    "compensation" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "EmployeeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "daysCount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "handoverNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewerNotes" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaveRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "CredentialRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "userId" TEXT,
    "requesterEmail" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'GENERAL',
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "reason" TEXT NOT NULL,
    "temporaryCode" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "itNotes" TEXT,
    "reviewedById" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CredentialRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CredentialRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "CrmClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PROSPECT',
    "stage" TEXT NOT NULL DEFAULT 'INQUIRY',
    "estimatedValue" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "assignedTo" TEXT,
    "location" TEXT DEFAULT 'Lagos, Nigeria',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "CrmDeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stage" TEXT NOT NULL DEFAULT 'PROPOSAL',
    "probability" INTEGER NOT NULL DEFAULT 60,
    "expectedCloseDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrmDeal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CrmClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "CrmActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "outcome" TEXT,
    "activityDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmActivity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CrmClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrmActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeProfile_employeeNumber_key" ON "EmployeeProfile"("employeeNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeProfile_workEmail_key" ON "EmployeeProfile"("workEmail");
CREATE INDEX IF NOT EXISTS "EmployeeProfile_department_idx" ON "EmployeeProfile"("department");
CREATE INDEX IF NOT EXISTS "EmployeeProfile_status_idx" ON "EmployeeProfile"("status");
CREATE INDEX IF NOT EXISTS "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");
CREATE INDEX IF NOT EXISTS "EmployeeDocument_category_idx" ON "EmployeeDocument"("category");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX IF NOT EXISTS "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CredentialRequest_ticketNumber_key" ON "CredentialRequest"("ticketNumber");
CREATE INDEX IF NOT EXISTS "CredentialRequest_status_idx" ON "CredentialRequest"("status");
CREATE INDEX IF NOT EXISTS "CredentialRequest_requestType_idx" ON "CredentialRequest"("requestType");
CREATE UNIQUE INDEX IF NOT EXISTS "CrmClient_email_key" ON "CrmClient"("email");
CREATE INDEX IF NOT EXISTS "CrmClient_stage_idx" ON "CrmClient"("stage");
CREATE INDEX IF NOT EXISTS "CrmClient_category_idx" ON "CrmClient"("category");
CREATE INDEX IF NOT EXISTS "CrmDeal_clientId_idx" ON "CrmDeal"("clientId");
CREATE INDEX IF NOT EXISTS "CrmActivity_clientId_idx" ON "CrmActivity"("clientId");
CREATE TABLE IF NOT EXISTS "PolicyAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actorEmail" TEXT,
    "targetResource" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedAt" DATETIME,
    "resolutionNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS "PolicyAlert_status_idx" ON "PolicyAlert"("status");
CREATE INDEX IF NOT EXISTS "PolicyAlert_severity_idx" ON "PolicyAlert"("severity");
CREATE INDEX IF NOT EXISTS "PolicyAlert_createdAt_idx" ON "PolicyAlert"("createdAt");
CREATE TABLE IF NOT EXISTS "InterDeptApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fromDepartment" TEXT NOT NULL,
    "toDepartment" TEXT NOT NULL,
    "requesterId" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "approvedById" TEXT,
    "approvedByName" TEXT,
    "decisionNotes" TEXT,
    "decidedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "DashboardNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "department" TEXT NOT NULL DEFAULT 'ALL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM_ALERT',
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "CorporateEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromDepartment" TEXT NOT NULL DEFAULT 'OPERATIONS',
    "toEmail" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "toDepartment" TEXT,
    "cc" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "smtpMessageId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OPERATIONS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "FinancialTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "department" TEXT NOT NULL DEFAULT 'TREASURY',
    "status" TEXT NOT NULL DEFAULT 'SETTLED',
    "recipientOrEntity" TEXT NOT NULL,
    "authorizedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "transactionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "WorkflowAutomationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "conditions" TEXT,
    "actionType" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastTriggeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "InterDeptApproval_ticketNumber_key" ON "InterDeptApproval"("ticketNumber");
CREATE INDEX IF NOT EXISTS "InterDeptApproval_status_idx" ON "InterDeptApproval"("status");
CREATE INDEX IF NOT EXISTS "InterDeptApproval_fromDepartment_idx" ON "InterDeptApproval"("fromDepartment");
CREATE INDEX IF NOT EXISTS "InterDeptApproval_toDepartment_idx" ON "InterDeptApproval"("toDepartment");
CREATE INDEX IF NOT EXISTS "InterDeptApproval_createdAt_idx" ON "InterDeptApproval"("createdAt");
CREATE INDEX IF NOT EXISTS "DashboardNotification_userId_idx" ON "DashboardNotification"("userId");
CREATE INDEX IF NOT EXISTS "DashboardNotification_department_idx" ON "DashboardNotification"("department");
CREATE INDEX IF NOT EXISTS "DashboardNotification_isRead_idx" ON "DashboardNotification"("isRead");
CREATE INDEX IF NOT EXISTS "DashboardNotification_createdAt_idx" ON "DashboardNotification"("createdAt");
CREATE INDEX IF NOT EXISTS "CorporateEmail_direction_idx" ON "CorporateEmail"("direction");
CREATE INDEX IF NOT EXISTS "CorporateEmail_fromDepartment_idx" ON "CorporateEmail"("fromDepartment");
CREATE INDEX IF NOT EXISTS "CorporateEmail_toDepartment_idx" ON "CorporateEmail"("toDepartment");
CREATE INDEX IF NOT EXISTS "CorporateEmail_category_idx" ON "CorporateEmail"("category");
CREATE INDEX IF NOT EXISTS "CorporateEmail_createdAt_idx" ON "CorporateEmail"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "FinancialTransaction_reference_key" ON "FinancialTransaction"("reference");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_type_idx" ON "FinancialTransaction"("type");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_department_idx" ON "FinancialTransaction"("department");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_status_idx" ON "FinancialTransaction"("status");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_transactionDate_idx" ON "FinancialTransaction"("transactionDate");
CREATE INDEX IF NOT EXISTS "WorkflowAutomationRule_triggerEvent_idx" ON "WorkflowAutomationRule"("triggerEvent");
CREATE INDEX IF NOT EXISTS "WorkflowAutomationRule_isEnabled_idx" ON "WorkflowAutomationRule"("isEnabled");
CREATE TABLE IF NOT EXISTS "ReportDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cadence" TEXT NOT NULL DEFAULT 'DAILY',
    "department" TEXT NOT NULL DEFAULT 'OPERATIONS',
    "authorName" TEXT NOT NULL,
    "authorTitle" TEXT,
    "authorEmail" TEXT NOT NULL,
    "lineManagerName" TEXT,
    "lineManagerTitle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reportDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT,
    "sections" TEXT,
    "spreadsheetData" TEXT,
    "images" TEXT,
    "managerNotes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReportDocument_reference_key" ON "ReportDocument"("reference");
CREATE INDEX IF NOT EXISTS "ReportDocument_department_idx" ON "ReportDocument"("department");
CREATE INDEX IF NOT EXISTS "ReportDocument_status_idx" ON "ReportDocument"("status");
CREATE INDEX IF NOT EXISTS "ReportDocument_reportDate_idx" ON "ReportDocument"("reportDate");
CREATE INDEX IF NOT EXISTS "ReportDocument_createdAt_idx" ON "ReportDocument"("createdAt");
CREATE TABLE IF NOT EXISTS "InfrastructureProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientOrEntity" TEXT,
    "location" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'INFRASTRUCTURE',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "targetEndDate" DATETIME,
    "leadEngineer" TEXT,
    "contractorTeam" TEXT,
    "budget" REAL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "summary" TEXT,
    "milestones" TEXT,
    "images" TEXT,
    "createdByEmail" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "InfrastructureProject_code_key" ON "InfrastructureProject"("code");
CREATE INDEX IF NOT EXISTS "InfrastructureProject_status_idx" ON "InfrastructureProject"("status");
CREATE INDEX IF NOT EXISTS "InfrastructureProject_category_idx" ON "InfrastructureProject"("category");
CREATE INDEX IF NOT EXISTS "InfrastructureProject_createdAt_idx" ON "InfrastructureProject"("createdAt");
CREATE TABLE IF NOT EXISTS "AudienceSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "category" TEXT NOT NULL DEFAULT 'NEWSLETTER',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBSCRIBED',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "AudienceSubscriber_email_key" ON "AudienceSubscriber"("email");
CREATE INDEX IF NOT EXISTS "AudienceSubscriber_status_idx" ON "AudienceSubscriber"("status");
CREATE INDEX IF NOT EXISTS "AudienceSubscriber_category_idx" ON "AudienceSubscriber"("category");
CREATE TABLE IF NOT EXISTS "CareerOpening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Full-Time',
    "summary" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "benefits" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_IT_APPROVAL',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "initiatedById" TEXT,
    "initiatedByName" TEXT,
    "initiatedByEmail" TEXT,
    "itApprovedById" TEXT,
    "itApprovedByName" TEXT,
    "itApprovedAt" DATETIME,
    "takedownRequestedAt" DATETIME,
    "takedownNotes" TEXT,
    "takenDownById" TEXT,
    "takenDownByName" TEXT,
    "takenDownAt" DATETIME,
    "applicantClickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "CareerInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "careerOpeningId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "resumeUrl" TEXT,
    "coverLetter" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE_CLICK',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerInquiry_careerOpeningId_fkey" FOREIGN KEY ("careerOpeningId") REFERENCES "CareerOpening" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CareerOpening_slug_key" ON "CareerOpening"("slug");
CREATE INDEX IF NOT EXISTS "CareerOpening_status_idx" ON "CareerOpening"("status");
CREATE INDEX IF NOT EXISTS "CareerOpening_published_idx" ON "CareerOpening"("published");
CREATE INDEX IF NOT EXISTS "CareerOpening_department_idx" ON "CareerOpening"("department");
CREATE INDEX IF NOT EXISTS "CareerOpening_createdAt_idx" ON "CareerOpening"("createdAt");
CREATE INDEX IF NOT EXISTS "CareerInquiry_careerOpeningId_idx" ON "CareerInquiry"("careerOpeningId");
CREATE INDEX IF NOT EXISTS "CareerInquiry_createdAt_idx" ON "CareerInquiry"("createdAt");
CREATE TABLE IF NOT EXISTS "CustomForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "formType" TEXT NOT NULL DEFAULT 'event',
    "status" TEXT NOT NULL DEFAULT 'active',
    "coverImageUrl" TEXT DEFAULT '',
    "eventDate" DATETIME,
    "eventLocation" TEXT DEFAULT '',
    "fields" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "sendConfirmationEmail" BOOLEAN NOT NULL DEFAULT true,
    "confirmationSubject" TEXT DEFAULT '',
    "confirmationMessage" TEXT DEFAULT '',
    "consentNotice" TEXT DEFAULT 'I hereby consent to Dexta Africa collecting, storing, and processing my personal data strictly in accordance with NDPR & GDPR regulatory standards. I acknowledge this information will only be used for official enterprise communications and event coordination.',
    "requireConsent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
, "activeFrom" DATETIME, "activeUntil" DATETIME);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomForm_slug_key" ON "CustomForm"("slug");
CREATE INDEX IF NOT EXISTS "CustomForm_slug_idx" ON "CustomForm"("slug");
CREATE INDEX IF NOT EXISTS "CustomForm_formType_idx" ON "CustomForm"("formType");
CREATE INDEX IF NOT EXISTS "CustomForm_status_idx" ON "CustomForm"("status");
CREATE INDEX IF NOT EXISTS "CustomForm_createdAt_idx" ON "CustomForm"("createdAt");
CREATE TABLE IF NOT EXISTS "FormSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT DEFAULT '',
    "company" TEXT DEFAULT '',
    "jobTitle" TEXT DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Attendee',
    "attendanceMode" TEXT NOT NULL DEFAULT 'in-person',
    "answers" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'registered',
    "consentAcknowledged" BOOLEAN NOT NULL DEFAULT true,
    "consentTimestamp" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT DEFAULT '',
    "userAgent" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "FormSubmission_formId_idx" ON "FormSubmission"("formId");
CREATE INDEX IF NOT EXISTS "FormSubmission_email_idx" ON "FormSubmission"("email");
CREATE INDEX IF NOT EXISTS "FormSubmission_category_idx" ON "FormSubmission"("category");
CREATE INDEX IF NOT EXISTS "FormSubmission_createdAt_idx" ON "FormSubmission"("createdAt");
CREATE TABLE IF NOT EXISTS "ProductionReleaseRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetSystem" TEXT NOT NULL DEFAULT 'PORTAL_CORE',
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "superAdminId" TEXT,
    "superAdminName" TEXT,
    "superAdminEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_SUPER_ADMIN',
    "stage" INTEGER NOT NULL DEFAULT 1,
    "justification" TEXT NOT NULL,
    "payloadDiff" TEXT,
    "rejectionReason" TEXT,
    "scheduledFor" DATETIME,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductionReleaseRequest_ticketNumber_key" ON "ProductionReleaseRequest"("ticketNumber");
CREATE INDEX IF NOT EXISTS "ProductionReleaseRequest_status_idx" ON "ProductionReleaseRequest"("status");
CREATE INDEX IF NOT EXISTS "ProductionReleaseRequest_adminId_idx" ON "ProductionReleaseRequest"("adminId");
CREATE INDEX IF NOT EXISTS "ProductionReleaseRequest_superAdminId_idx" ON "ProductionReleaseRequest"("superAdminId");
CREATE INDEX IF NOT EXISTS "ProductionReleaseRequest_createdAt_idx" ON "ProductionReleaseRequest"("createdAt");
CREATE TABLE IF NOT EXISTS "DashboardAccessRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jobTitle" TEXT,
    "requestedModules" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "signatureType" TEXT NOT NULL DEFAULT 'DRAWN',
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING_IT_APPROVAL',
    "reviewedById" TEXT,
    "approvedModules" TEXT,
    "itNotes" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DashboardAccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DashboardAccessRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "department" TEXT NOT NULL DEFAULT 'OPERATIONS',
    "seniorityLevel" TEXT NOT NULL DEFAULT 'SENIOR',
    "jobTitle" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "activationKey" TEXT,
    "lastLoginAt" DATETIME,
    "assignedModules" TEXT NOT NULL DEFAULT '["operations","approvals","personal"]',
    "signatureUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "DashboardAccessRequest_ticketNumber_key" ON "DashboardAccessRequest"("ticketNumber");
CREATE INDEX IF NOT EXISTS "DashboardAccessRequest_userId_idx" ON "DashboardAccessRequest"("userId");
CREATE INDEX IF NOT EXISTS "DashboardAccessRequest_status_idx" ON "DashboardAccessRequest"("status");
CREATE INDEX IF NOT EXISTS "DashboardAccessRequest_ticketNumber_idx" ON "DashboardAccessRequest"("ticketNumber");
