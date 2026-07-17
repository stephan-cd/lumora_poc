export interface ProviderSyncResult {
  status: 'SUCCESS' | 'FAILED';
  recordsImported: number;
  errorLogs?: string;
}

export interface LearningProvider {
  name: string;
  testConnection(credentials: { clientId: string; clientSecret: string; orgId: string }): Promise<boolean>;
  syncCourses(credentials: { clientId: string; clientSecret: string; orgId: string }): Promise<ProviderSyncResult>;
  syncUserProgress(
    credentials: { clientId: string; clientSecret: string; orgId: string },
    userMapping: { email: string; id: string }[]
  ): Promise<ProviderSyncResult>;
}
