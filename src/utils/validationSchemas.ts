import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.string().email('Por favor ingresa un correo válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const RegisterSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    email: z.string().email('Correo inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export const ProveedorSchema = z.object({
    nombre_completo: z.string().min(3, "El nombre es obligatorio"),
    ci_nit: z.string().min(3, "NIT/CI es obligatorio"),
    tipo_proveedor: z.enum(["productor", "cooperativa", "importador"]),
    nombre_finca: z.string().min(3, "Nombre de finca obligatorio"),
    nombre_productor: z.string().optional(),
    pais: z.string().min(2, "País obligatorio"),
    region: z.string().min(2, "Región obligatoria"),
    sub_region: z.string().optional().default(""),
    altura_msnm: z.preprocess((val) => Number(val), z.number().min(0).max(5000)),
    latitude: z.preprocess((val) => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().min(-90).max(90)).optional(),
    longitude: z.preprocess((val) => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().min(-180).max(180)).optional()
});

export type ProveedorFormData = z.infer<typeof ProveedorSchema>;
export const LoteSchema = z.object({
    finca_id: z.string().uuid("Finca no válida"),
    fecha_compra: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    peso: z.preprocess((val) => Number(val), z.number().positive("El peso debe ser mayor a 0")),
    precio_total: z.preprocess((val) => Number(val), z.number().min(0, "El precio no puede ser negativo")),
    estado: z.enum(['cereza', 'pergamino_seco', 'oro_verde', 'pergamino_humedo', 'inferior']),
    variedad: z.string().min(2, "Variedad requerida"),
    proceso: z.string().min(2, "Proceso requerido"),
    humedad: z.preprocess((val) => Number(val), z.number().min(0).max(100)).optional(),
    notas: z.string().optional()
});

export type LoteFormData = z.infer<typeof LoteSchema>;

// ============================================
// LAB REPORTS SCHEMAS
// ============================================

// Helper to convert string to number for form inputs
const stringToNumber = (val: unknown) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return Number(val);
};

// Lab Report Master Schema
export const LabReportSchema = z.object({
    report_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    analyst_name: z.string().min(2, "Nombre del analista requerido"),
    sample_type: z.enum(['internal', 'external']),
    report_type: z.enum(['physical', 'cupping', 'complete']),

    // Internal sample fields
    batch_id: z.string().uuid("Lote no válido").optional(),

    // External sample fields
    external_client_name: z.string().min(3, "Nombre del cliente requerido").optional(),
    external_sample_id: z.string().min(1, "ID de muestra requerido").optional(),
    external_origin: z.string().optional(),
    external_variety: z.string().optional(),
    external_process: z.string().optional(),
    external_notes: z.string().optional(),
}).superRefine((data, ctx) => {
    // Validate internal samples must have batch_id
    if (data.sample_type === 'internal' && !data.batch_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe seleccionar un lote para muestras internas",
            path: ['batch_id'],
        });
    }

    // Validate external samples must have client info
    if (data.sample_type === 'external' && (!data.external_client_name || !data.external_sample_id)) {
        if (!data.external_client_name) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Nombre del cliente es obligatorio para muestras externas",
                path: ['external_client_name'],
            });
        }
        if (!data.external_sample_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "ID de muestra es obligatorio para muestras externas",
                path: ['external_sample_id'],
            });
        }
    }
});

// Physical Analysis Schema
export const PhysicalAnalysisSchema = z.object({
    sample_weight_grams: z.preprocess(
        stringToNumber,
        z.number().positive("El peso debe ser mayor a 0")
    ),
    green_weight_grams: z.preprocess(
        stringToNumber,
        z.number().positive("El peso en oro debe ser mayor a 0").optional()
    ),
    humidity_percentage: z.preprocess(
        stringToNumber,
        z.number()
            .min(8, "La humedad no puede ser menor a 8%")
            .max(14, "La humedad no puede ser mayor a 14%")
    ),
    density_value: z.preprocess(
        stringToNumber,
        z.number().positive("La densidad debe ser mayor a 0").optional()
    ),

    // Particle size (mesh percentages)
    mesh_18: z.preprocess(
        stringToNumber,
        z.number().min(0).max(100, "El porcentaje no puede ser mayor a 100").default(0)
    ),
    mesh_16: z.preprocess(
        stringToNumber,
        z.number().min(0).max(100).default(0)
    ),
    mesh_14: z.preprocess(
        stringToNumber,
        z.number().min(0).max(100).default(0)
    ),
    base_mesh: z.preprocess(
        stringToNumber,
        z.number().min(0).max(100).default(0)
    ),

    // Defects
    category_1_defects: z.preprocess(
        stringToNumber,
        z.number().int().min(0, "Los defectos no pueden ser negativos").default(0)
    ),
    category_2_defects: z.preprocess(
        stringToNumber,
        z.number().int().min(0).default(0)
    ),
    defects_notes: z.string().default(""),

    // Additional notes
    color_notes: z.string().default(""),
    aroma_notes: z.string().default(""),
}).superRefine((data, ctx) => {
    // Validate mesh percentages sum to ~100%
    const total = Number(data.mesh_18) + Number(data.mesh_16) + Number(data.mesh_14) + Number(data.base_mesh);
    if (total > 100.5 || total < 99.5) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `La suma de los porcentajes de mallas debe ser 100% (actual: ${total.toFixed(1)}%)`,
            path: ['mesh_18'],
        });
    }
});

// SCA Score helper schema (6.00 - 10.00, increments of 0.25)
const scaScoreSchema = z.preprocess(
    stringToNumber,
    z.number()
        .min(6.0, "La puntuación mínima es 6.00")
        .max(10.0, "La puntuación máxima es 10.00")
        .refine((val) => {
            if (val === undefined) return true;
            const decimal = (val % 1);
            return decimal === 0 || decimal === 0.25 || decimal === 0.5 || decimal === 0.75;
        }, "La puntuación debe ser en incrementos de 0.25")
);

// Presence attribute schema (0-10, multiples of 2)
const presenceScoreSchema = z.preprocess(
    stringToNumber,
    z.number()
        .int()
        .min(0)
        .max(10)
        .refine((val) => val % 2 === 0, "Debe ser un múltiplo de 2 (0, 2, 4, 6, 8, 10)")
);

// Cupping Analysis Schema (SCA Protocol)
export const CuppingAnalysisSchema = z.object({
    // Preparation parameters
    coffee_grams: z.preprocess(
        stringToNumber,
        z.number().positive("La cantidad de café debe ser mayor a 0").default(8.25)
    ),
    water_ml: z.preprocess(
        stringToNumber,
        z.number().positive("La cantidad de agua debe ser mayor a 0").default(150)
    ),
    water_temp_celsius: z.preprocess(
        stringToNumber,
        z.number().min(85).max(96, "La temperatura debe estar entre 85°C y 96°C").default(92)
    ),
    cups_evaluated: z.preprocess(
        stringToNumber,
        z.number().int().min(1).max(10).default(5)
    ),

    // Scorable attributes (6.00 - 10.00)
    fragrance_aroma: scaScoreSchema,
    flavor: scaScoreSchema,
    aftertaste: scaScoreSchema,
    acidity: scaScoreSchema,
    body: scaScoreSchema,
    balance: scaScoreSchema,
    overall: scaScoreSchema,

    // Presence attributes (0-10, multiples of 2)
    uniformity: presenceScoreSchema.default(0),
    clean_cup: presenceScoreSchema.default(0),
    sweetness: presenceScoreSchema.default(0),

    // Notes
    flavor_descriptors: z.array(z.string()).default([]),
    cupper_notes: z.string().default(""),
});

// Cupping Defect Schema
export const CuppingDefectSchema = z.object({
    cup_number: z.preprocess(
        stringToNumber,
        z.number().int().min(1).max(10)
    ),
    defect_type: z.enum(['taint', 'fault']),
    defect_intensity: z.union([z.literal(2), z.literal(4)]),
    description: z.string().default(""),
});

// Export inferred types
export type LabReportFormData = z.infer<typeof LabReportSchema>;
export type PhysicalAnalysisFormData = z.infer<typeof PhysicalAnalysisSchema>;
export type CuppingAnalysisFormData = z.infer<typeof CuppingAnalysisSchema>;
export type CuppingDefectFormData = z.infer<typeof CuppingDefectSchema>;
