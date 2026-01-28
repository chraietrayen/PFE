/**
 * Zod Validation Schemas
 * Comprehensive input validation for all API endpoints
 */

import { z } from "zod";

// ==================== USER SCHEMAS ====================

export const UserCreateSchema = z.object({
  email: z.string()
    .email("Email invalide")
    .max(255, "Email trop long"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(100, "Mot de passe trop long")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  name: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Prénom trop long")
    .optional(),
  lastName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Nom trop long")
    .optional(),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  image: z.string().url().optional().nullable(),
  telephone: z.string()
    .regex(/^(\+33|0)[1-9](\d{2}){4}$/, "Numéro de téléphone invalide")
    .optional()
    .nullable(),
  adresse: z.string().max(500).optional().nullable(),
  role: z.enum(["SUPER_ADMIN", "RH", "USER"]).optional(),
  status: z.enum(["INACTIVE", "PENDING", "ACTIVE", "REJECTED", "SUSPENDED"]).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
});

// ==================== EMPLOYEE SCHEMAS ====================

export const EmployeeProfileSchema = z.object({
  nom: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Nom trop long"),
  prenom: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(100, "Prénom trop long"),
  email: z.string().email("Email invalide").optional(),
  birthday: z.string()
    .transform(val => new Date(val))
    .refine(date => date < new Date(), "La date de naissance doit être dans le passé")
    .refine(date => {
      const age = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return age >= 16 && age <= 100;
    }, "L'âge doit être entre 16 et 100 ans")
    .optional(),
  sexe: z.enum(["HOMME", "FEMME"]).optional(),
  rib: z.string()
    .length(24, "Le RIB doit contenir exactement 24 caractères")
    .regex(/^\d+$/, "Le RIB ne doit contenir que des chiffres")
    .optional()
    .nullable(),
  adresse: z.string().max(500, "Adresse trop longue").optional().nullable(),
  telephone: z.string()
    .regex(/^(\+216|0)[0-9]{8}$/, "Numéro de téléphone tunisien invalide")
    .optional()
    .nullable(),
  position: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  typeContrat: z.enum(["CDI", "CDD", "Stage", "Freelance"]).optional(),
  dateEmbauche: z.string().optional().nullable(),
  photo: z.string().optional().nullable(), // Base64 or URL
  cv: z.string().optional().nullable(), // Base64 or URL
});

export const EmployeeStatusUpdateSchema = z.object({
  status: z.enum(["EN_ATTENTE", "APPROUVE", "REJETE"]),
  reason: z.string().max(1000).optional(),
});

// ==================== LEAVE REQUEST SCHEMAS ====================

export const LeaveRequestCreateSchema = z.object({
  type: z.enum(["PAID", "UNPAID", "MATERNITE", "MALADIE", "PREAVIS"]),
  dateDebut: z.string()
    .transform(val => new Date(val))
    .refine(date => date >= new Date(new Date().setHours(0, 0, 0, 0)), 
      "La date de début doit être aujourd'hui ou dans le futur"),
  dateFin: z.string()
    .transform(val => new Date(val)),
  commentaire: z.string().max(1000, "Commentaire trop long").optional(),
}).refine(data => data.dateFin >= data.dateDebut, {
  message: "La date de fin doit être après la date de début",
  path: ["dateFin"],
});

export const LeaveRequestUpdateSchema = z.object({
  status: z.enum(["EN_ATTENTE", "VALIDE", "REFUSE"]),
  commentaire: z.string().max(1000).optional(),
});

// ==================== POINTAGE SCHEMAS ====================

export const PointageCreateSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  capturedPhoto: z.string().optional(), // Base64 photo
  geolocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().optional(),
  }).optional(),
  deviceFingerprint: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const PointageUpdateSchema = z.object({
  status: z.enum(["VALID", "PENDING_REVIEW", "REJECTED", "CORRECTED"]),
  notes: z.string().max(500).optional(),
});

// ==================== NOTIFICATION SCHEMAS ====================

export const NotificationCreateSchema = z.object({
  userId: z.string().min(1, "User ID requis"),
  type: z.enum([
    "PROFILE_APPROVED",
    "PROFILE_REJECTED",
    "PROFILE_SUBMITTED",
    "POINTAGE_ANOMALY",
    "POINTAGE_SUCCESS",
    "LEAVE_REQUEST",
    "SYSTEM_ALERT",
    "RH_ACTION_REQUIRED",
    "DOCUMENT_REQUIRED",
    "GENERAL"
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ==================== ROLE & PERMISSION SCHEMAS ====================

export const RoleCreateSchema = z.object({
  name: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Nom trop long")
    .regex(/^[A-Z_]+$/, "Le nom doit être en majuscules avec underscores"),
  description: z.string().max(500).optional(),
});

export const PermissionAssignSchema = z.object({
  roleId: z.string().min(1),
  permissions: z.array(z.object({
    module: z.string().min(1),
    actions: z.array(z.enum(["ADD", "DELETE", "EDIT", "VIEW", "ACTIVATE", "VALIDATE", "VERIFY", "PROCESS"])),
  })),
});

// ==================== EXPORT SCHEMAS ====================

export const ExportRequestSchema = z.object({
  type: z.enum(["employees", "pointages", "conges", "audit", "monthly", "personal"]),
  format: z.enum(["csv", "excel", "pdf"]).optional().default("csv"),
  dateRange: z.object({
    start: z.string().transform(val => new Date(val)),
    end: z.string().transform(val => new Date(val)),
  }).optional(),
  year: z.number().min(2000).max(2100).optional(),
  month: z.number().min(1).max(12).optional(),
  filters: z.object({
    status: z.string().optional(),
    department: z.string().optional(),
    userId: z.string().optional(),
  }).optional(),
});

// ==================== DOCUMENT SCHEMAS ====================

export const DocumentUploadSchema = z.object({
  type: z.enum(["DIPLOME", "CERTIFICAT", "ATTESTATION"]),
  titre: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dateObtention: z.string().optional(),
  fichier: z.string().min(1), // Base64 or URL
});

// ==================== PAGINATION & FILTER SCHEMAS ====================

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const DateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "La date de début doit être avant la date de fin",
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate data against a schema and return formatted errors
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: { field: string; message: string }[];
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  
  return { success: false, errors };
}

/**
 * Create a validated API handler
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T) => Promise<Response>
) {
  return async (data: unknown): Promise<Response> => {
    const validation = validateData(schema, data);
    
    if (!validation.success) {
      return Response.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }
    
    return handler(validation.data!);
  };
}

// ==================== TYPE EXPORTS ====================

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type EmployeeProfile = z.infer<typeof EmployeeProfileSchema>;
export type LeaveRequestCreate = z.infer<typeof LeaveRequestCreateSchema>;
export type PointageCreate = z.infer<typeof PointageCreateSchema>;
export type NotificationCreate = z.infer<typeof NotificationCreateSchema>;
export type ExportRequest = z.infer<typeof ExportRequestSchema>;
