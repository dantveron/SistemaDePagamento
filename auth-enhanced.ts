import { z } from "zod";

// Schema para login básico
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .max(255, "E-mail muito longo"),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(128, "Senha muito longa")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial"
    ),
  country: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
});

// Schema para MFA
export const MFASchema = z.object({
  code: z
    .string()
    .min(6, "Código deve ter 6 dígitos")
    .max(6, "Código deve ter 6 dígitos")
    .regex(/^\d{6}$/, "Código deve conter apenas números"),
});

// Schema para registro com validações internacionais
export const RegisterSchema = z.object({
  firstName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  lastName: z
    .string()
    .min(2, "Sobrenome deve ter pelo menos 2 caracteres")
    .max(50, "Sobrenome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Sobrenome deve conter apenas letras"),
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .max(255, "E-mail muito longo"),
  password: z
    .string()
    .min(12, "Senha deve ter pelo menos 12 caracteres")
    .max(128, "Senha muito longa")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial"
    ),
  confirmPassword: z.string(),
  phone: z
    .string()
    .min(10, "Telefone inválido")
    .max(20, "Telefone muito longo")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Formato de telefone inválido"),
  country: z
    .string()
    .min(2, "País é obrigatório")
    .max(2, "Código de país inválido"),
  businessType: z.enum([
    "individual",
    "small_business",
    "medium_business",
    "large_enterprise",
    "non_profit",
    "government"
  ]),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, "Você deve aceitar os termos de serviço"),
  acceptPrivacy: z
    .boolean()
    .refine(val => val === true, "Você deve aceitar a política de privacidade"),
  marketingConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema para recuperação de senha
export const PasswordRecoverySchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .max(255, "E-mail muito longo"),
  captcha: z.string().optional(),
});

// Schema para redefinição de senha
export const PasswordResetSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z
    .string()
    .min(12, "Senha deve ter pelo menos 12 caracteres")
    .max(128, "Senha muito longa")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema para configuração de MFA
export const MFASetupSchema = z.object({
  method: z.enum(["sms", "email", "authenticator", "biometric"]),
  phoneNumber: z.string().optional(),
  backupCodes: z.array(z.string()).optional(),
});

// Schema para verificação de identidade
export const IdentityVerificationSchema = z.object({
  documentType: z.enum(["passport", "national_id", "driver_license"]),
  documentNumber: z.string().min(5, "Número do documento é obrigatório"),
  documentCountry: z.string().min(2, "País do documento é obrigatório"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
  address: z.object({
    street: z.string().min(5, "Endereço é obrigatório"),
    city: z.string().min(2, "Cidade é obrigatória"),
    state: z.string().min(2, "Estado é obrigatório"),
    postalCode: z.string().min(5, "CEP é obrigatório"),
    country: z.string().min(2, "País é obrigatório"),
  }),
});

// Schema para configurações de segurança
export const SecuritySettingsSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z
    .string()
    .min(12, "Nova senha deve ter pelo menos 12 caracteres")
    .max(128, "Nova senha muito longa")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial"
    )
    .optional(),
  confirmNewPassword: z.string().optional(),
  enableMFA: z.boolean().optional(),
  mfaMethod: z.enum(["sms", "email", "authenticator", "biometric"]).optional(),
  sessionTimeout: z.number().min(5).max(1440).optional(), // 5 minutos a 24 horas
  allowedIPs: z.array(z.string().ip()).optional(),
  notificationSettings: z.object({
    loginAlerts: z.boolean(),
    securityAlerts: z.boolean(),
    transactionAlerts: z.boolean(),
    marketingEmails: z.boolean(),
  }).optional(),
}).refine((data) => {
  if (data.newPassword && data.confirmNewPassword) {
    return data.newPassword === data.confirmNewPassword;
  }
  return true;
}, {
  message: "Novas senhas não coincidem",
  path: ["confirmNewPassword"],
});

// Tipos TypeScript derivados dos schemas
export type LoginFormData = z.infer<typeof LoginSchema>;
export type MFAFormData = z.infer<typeof MFASchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type PasswordRecoveryFormData = z.infer<typeof PasswordRecoverySchema>;
export type PasswordResetFormData = z.infer<typeof PasswordResetSchema>;
export type MFASetupFormData = z.infer<typeof MFASetupSchema>;
export type IdentityVerificationFormData = z.infer<typeof IdentityVerificationSchema>;
export type SecuritySettingsFormData = z.infer<typeof SecuritySettingsSchema>;

// Validadores de força de senha
export const validatePasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
    noCommon: !isCommonPassword(password),
    noPersonal: true, // Implementar verificação contra dados pessoais
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    score,
    strength: score < 4 ? 'weak' : score < 6 ? 'medium' : 'strong',
    checks,
  };
};

// Lista de senhas comuns (implementar com lista mais completa)
const commonPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey'
];

const isCommonPassword = (password: string): boolean => {
  return commonPasswords.includes(password.toLowerCase());
};

// Validador de país baseado em ISO 3166-1 alpha-2
export const validateCountryCode = (code: string): boolean => {
  const validCodes = [
    'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
    'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
    'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
    'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
    'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
    'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
    'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
    'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
    'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
    'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
    'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
    'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
    'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
    'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
    'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
    'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
    'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
    'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
    'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
    'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
    'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
  ];
  
  return validCodes.includes(code.toUpperCase());
};

