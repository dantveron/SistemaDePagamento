// Tipos para autenticação aprimorada

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country: string;
  businessType: BusinessType;
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  mfaEnabled: boolean;
  mfaMethods: MFAMethod[];
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  loginAttempts: number;
  isBlocked: boolean;
  blockExpiresAt?: string;
  preferredLanguage: string;
  timezone: string;
  avatar?: string;
  kycStatus: KYCStatus;
  riskLevel: RiskLevel;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
  ipAddress: string;
  userAgent: string;
  country: string;
  city?: string;
  device: DeviceInfo;
  isActive: boolean;
  mfaVerified: boolean;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  fingerprint: string;
  isTrusted: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  country: string;
  success: boolean;
  failureReason?: string;
  timestamp: string;
  riskScore: number;
}

export interface MFAChallenge {
  id: string;
  userId: string;
  method: MFAMethod;
  code: string;
  expiresAt: string;
  attempts: number;
  verified: boolean;
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  type: SecurityEventType;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  timestamp: string;
  resolved: boolean;
}

export interface APIKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: Permission[];
  environment: 'sandbox' | 'production';
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  rateLimit: {
    requests: number;
    window: number; // em segundos
  };
}

export interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

// Enums e tipos auxiliares

export type BusinessType = 
  | 'individual'
  | 'small_business'
  | 'medium_business'
  | 'large_enterprise'
  | 'non_profit'
  | 'government';

export type UserRole = 
  | 'user'
  | 'merchant'
  | 'admin'
  | 'super_admin'
  | 'support'
  | 'developer';

export type Permission = 
  | 'read_profile'
  | 'write_profile'
  | 'read_transactions'
  | 'write_transactions'
  | 'read_reports'
  | 'write_reports'
  | 'read_api_keys'
  | 'write_api_keys'
  | 'read_webhooks'
  | 'write_webhooks'
  | 'read_users'
  | 'write_users'
  | 'read_audit_logs'
  | 'admin_access';

export type MFAMethod = 
  | 'sms'
  | 'email'
  | 'authenticator'
  | 'biometric'
  | 'backup_codes';

export type KYCStatus = 
  | 'not_started'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired';

export type RiskLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

export type SecurityEventType = 
  | 'login_success'
  | 'login_failure'
  | 'password_change'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'api_key_created'
  | 'api_key_deleted'
  | 'suspicious_activity'
  | 'account_locked'
  | 'account_unlocked'
  | 'data_export'
  | 'permission_change';

export type WebhookEvent = 
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.completed'
  | 'transaction.failed'
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.refunded'
  | 'dispute.created'
  | 'dispute.updated'
  | 'account.updated'
  | 'kyc.completed'
  | 'security.alert';

// Interfaces para requests/responses da API

export interface LoginRequest {
  email: string;
  password: string;
  country?: string;
  userAgent?: string;
  timestamp?: string;
  deviceFingerprint?: string;
}

export interface LoginResponse {
  success: boolean;
  requiresMFA?: boolean;
  sessionToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  error?: string;
  nextStep?: 'mfa' | 'kyc' | 'dashboard';
}

export interface MFAVerificationRequest {
  code: string;
  sessionToken: string;
  method: MFAMethod;
}

export interface MFAVerificationResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  error?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  businessType: BusinessType;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  marketingConsent?: boolean;
}

export interface RegisterResponse {
  success: boolean;
  userId?: string;
  verificationRequired?: boolean;
  error?: string;
}

export interface PasswordRecoveryRequest {
  email: string;
  captcha?: string;
}

export interface PasswordRecoveryResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface PasswordResetRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Configurações de segurança

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventCommonPasswords: boolean;
    preventPersonalInfo: boolean;
    maxAge: number; // dias
  };
  sessionPolicy: {
    maxDuration: number; // minutos
    idleTimeout: number; // minutos
    maxConcurrentSessions: number;
    requireMFAForSensitiveActions: boolean;
  };
  loginPolicy: {
    maxFailedAttempts: number;
    lockoutDuration: number; // minutos
    requireCaptchaAfterFailures: number;
    allowedCountries: string[];
    blockedCountries: string[];
  };
  mfaPolicy: {
    required: boolean;
    allowedMethods: MFAMethod[];
    backupCodesCount: number;
    codeExpirationMinutes: number;
  };
  apiPolicy: {
    rateLimit: {
      requests: number;
      window: number; // segundos
    };
    allowedIPs: string[];
    requireHTTPS: boolean;
    maxKeyAge: number; // dias
  };
}

// Contexto de autenticação para React

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  verifyMFA: (data: MFAVerificationRequest) => Promise<MFAVerificationResponse>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  enableMFA: (method: MFAMethod) => Promise<boolean>;
  disableMFA: () => Promise<boolean>;
  getSecurityEvents: () => Promise<SecurityEvent[]>;
  getActiveSessions: () => Promise<Session[]>;
  revokeSession: (sessionId: string) => Promise<boolean>;
}

// Hooks personalizados

export interface UseAuthReturn extends AuthContextType {}

export interface UseSecurityReturn {
  securityEvents: SecurityEvent[];
  activeSessions: Session[];
  isLoading: boolean;
  refreshSecurityData: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  enableMFA: (method: MFAMethod) => Promise<boolean>;
  disableMFA: () => Promise<boolean>;
}

export interface UseAPIKeysReturn {
  apiKeys: APIKey[];
  isLoading: boolean;
  createAPIKey: (name: string, permissions: Permission[]) => Promise<APIKey>;
  revokeAPIKey: (keyId: string) => Promise<boolean>;
  refreshAPIKeys: () => Promise<void>;
}

// Utilitários de validação

export interface PasswordStrengthResult {
  score: number;
  strength: 'weak' | 'medium' | 'strong';
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
    noCommon: boolean;
    noPersonal: boolean;
  };
  suggestions: string[];
}

export interface RiskAssessmentResult {
  score: number;
  level: RiskLevel;
  factors: {
    newDevice: boolean;
    newLocation: boolean;
    unusualTime: boolean;
    multipleFailures: boolean;
    vpnDetected: boolean;
    botDetected: boolean;
  };
  recommendation: 'allow' | 'challenge' | 'block';
}

