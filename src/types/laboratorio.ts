/**
 * Tipos y interfaces para el sistema de reportes de laboratorio de café
 * Soporta análisis físico, sensorial (SCA) y gestión de muestras internas/externas
 */

// ============================================
// ENUMS
// ============================================

export type SampleType = 'internal' | 'external';

export type ReportType = 'physical' | 'cupping' | 'complete';

export type ReportStatus = 'draft' | 'completed' | 'approved';

export type DefectType = 'taint' | 'fault';

export type QualityClassification =
    | 'Outstanding'
    | 'Excellent'
    | 'Very Good (Specialty)'
    | 'Good'
    | 'Commercial';

// ============================================
// INTERFACE: Lab Report (Tabla Maestra)
// ============================================

export interface LabReport {
    id: string;
    organization_id: string;
    report_date: string;
    analyst_name: string | null;
    report_type: ReportType;
    status: ReportStatus;

    // Sample identification
    sample_type: SampleType;

    // Internal sample (from inventory)
    batch_id?: string | null;

    // External sample (from external clients)
    external_client_name?: string | null;
    external_sample_id?: string | null;
    external_origin?: string | null;
    external_variety?: string | null;
    external_process?: string | null;
    external_notes?: string | null;

    created_at: string;
    updated_at: string;
}

// ============================================
// INTERFACE: Physical Analysis
// ============================================

export interface PhysicalAnalysis {
    id: string;
    lab_report_id: string;

    // Weights
    sample_weight_grams: number;
    green_weight_grams: number | null;

    // Moisture and density
    humidity_percentage: number;
    density_value: number | null;

    // Particle size analysis (mesh percentages)
    mesh_18: number;
    mesh_16: number;
    mesh_14: number;
    base_mesh: number;

    // Defects
    category_1_defects: number;
    category_2_defects: number;
    defects_notes: string | null;

    // Calculations
    yield_factor: number | null;

    // Additional notes
    color_notes: string | null;
    aroma_notes: string | null;

    created_at: string;
}

// ============================================
// INTERFACE: Cupping Analysis (SCA Protocol)
// ============================================

export interface CuppingAnalysis {
    id: string;
    lab_report_id: string;

    // Preparation parameters
    coffee_grams: number;
    water_ml: number;
    water_temp_celsius: number;
    cups_evaluated: number;

    // Scorable attributes (6.00 - 10.00)
    fragrance_aroma: number;
    flavor: number;
    aftertaste: number;
    acidity: number;
    body: number;
    balance: number;
    overall: number;

    // Presence attributes (0-10, multiples of 2)
    uniformity: number;
    clean_cup: number;
    sweetness: number;

    // Scores (calculated automatically)
    total_score: number;
    defects_score: number;
    final_score: number;

    // Notes and descriptors
    flavor_descriptors: string[];
    cupper_notes: string | null;

    created_at: string;
}

// ============================================
// INTERFACE: Cupping Defect
// ============================================

export interface CuppingDefect {
    id: string;
    cupping_report_id: string;
    cup_number: number;
    defect_type: DefectType;
    defect_intensity: 2 | 4;
    description: string | null;
    created_at: string;
}

// ============================================
// INTERFACE: Complete Lab Report (Vista Completa)
// ============================================

export interface LabReportComplete extends LabReport {
    // Batch information (if internal)
    batch_code?: string | null;
    batch_variety?: string | null;
    batch_process?: string | null;
    farm_name?: string | null;

    // Physical analysis (if present)
    physical_id?: string | null;
    sample_weight_grams?: number | null;
    green_weight_grams?: number | null;
    humidity_percentage?: number | null;
    density_value?: number | null;
    mesh_18?: number | null;
    mesh_16?: number | null;
    mesh_14?: number | null;
    base_mesh?: number | null;
    category_1_defects?: number | null;
    category_2_defects?: number | null;
    defects_notes?: string | null;
    yield_factor?: number | null;

    // Cupping analysis (if present)
    cupping_id?: string | null;
    coffee_grams?: number | null;
    water_ml?: number | null;
    cups_evaluated?: number | null;
    fragrance_aroma?: number | null;
    flavor?: number | null;
    aftertaste?: number | null;
    acidity?: number | null;
    body?: number | null;
    balance?: number | null;
    overall?: number | null;
    uniformity?: number | null;
    clean_cup?: number | null;
    sweetness?: number | null;
    total_score?: number | null;
    defects_score?: number | null;
    final_score?: number | null;
    flavor_descriptors?: string[] | null;
    cupper_notes?: string | null;

    // Quality classification
    quality_classification?: QualityClassification | null;
}

// ============================================
// FORM DATA INTERFACES
// ============================================

export interface LabReportFormData {
    report_date: string;
    analyst_name: string;
    sample_type: SampleType;
    report_type: ReportType;

    // For internal samples
    batch_id?: string;

    // For external samples
    external_client_name?: string;
    external_sample_id?: string;
    external_origin?: string;
    external_variety?: string;
    external_process?: string;
    external_notes?: string;
}

export interface PhysicalAnalysisFormData {
    sample_weight_grams: number | string;
    green_weight_grams: number | string;
    humidity_percentage: number | string;
    density_value: number | string;
    mesh_18: number | string;
    mesh_16: number | string;
    mesh_14: number | string;
    base_mesh: number | string;
    category_1_defects: number | string;
    category_2_defects: number | string;
    defects_notes: string;
    color_notes: string;
    aroma_notes: string;
}

export interface CuppingAnalysisFormData {
    coffee_grams: number | string;
    water_ml: number | string;
    water_temp_celsius: number | string;
    cups_evaluated: number | string;

    fragrance_aroma: number | string;
    flavor: number | string;
    aftertaste: number | string;
    acidity: number | string;
    body: number | string;
    balance: number | string;
    overall: number | string;

    uniformity: number | string;
    clean_cup: number | string;
    sweetness: number | string;

    flavor_descriptors: string[];
    cupper_notes: string;
}

export interface CuppingDefectFormData {
    cup_number: number | string;
    defect_type: DefectType;
    defect_intensity: 2 | 4;
    description: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface BatchQualityHistory {
    report_date: string;
    report_id: string;
    final_score: number | null;
    humidity_percentage: number | null;
    category_1_defects: number | null;
    category_2_defects: number | null;
    analyst_name: string | null;
}

export interface ExternalClient {
    client_name: string;
    total_samples: number;
    avg_score: number | null;
    last_sample_date: string;
}

export interface LabReportFilters {
    sample_type?: SampleType;
    report_type?: ReportType;
    status?: ReportStatus;
    start_date?: string;
    end_date?: string;
    batch_id?: string;
    external_client_name?: string;
    min_score?: number;
    max_score?: number;
}

// ============================================
// HELPER FUNCTIONS (Type Guards)
// ============================================

export function isInternalSample(report: LabReport): report is LabReport & { batch_id: string } {
    return report.sample_type === 'internal' && !!report.batch_id;
}

export function isExternalSample(report: LabReport): report is LabReport & {
    external_client_name: string;
    external_sample_id: string;
} {
    return report.sample_type === 'external'
        && !!report.external_client_name
        && !!report.external_sample_id;
}

export function hasPhysicalAnalysis(report: LabReportComplete): boolean {
    return !!report.physical_id;
}

export function hasCuppingAnalysis(report: LabReportComplete): boolean {
    return !!report.cupping_id;
}

export function getQualityClassification(score: number): QualityClassification {
    if (score >= 90) return 'Outstanding';
    if (score >= 85) return 'Excellent';
    if (score >= 80) return 'Very Good (Specialty)';
    if (score >= 70) return 'Good';
    return 'Commercial';
}

export function isSpecialtyCoffee(score: number): boolean {
    return score >= 80;
}

// ============================================
// CONSTANTS
// ============================================

export const SCA_SCORE_MIN = 6.0;
export const SCA_SCORE_MAX = 10.0;
export const SCA_SCORE_INCREMENT = 0.25;

export const HUMIDITY_MIN = 8.0;
export const HUMIDITY_MAX = 14.0;
export const HUMIDITY_IDEAL_MIN = 10.5;
export const HUMIDITY_IDEAL_MAX = 12.0;

export const DEFAULT_COFFEE_GRAMS = 8.25;
export const DEFAULT_WATER_ML = 150;
export const DEFAULT_WATER_TEMP = 92.0;
export const DEFAULT_CUPS_EVALUATED = 5;

export const SPECIALTY_COFFEE_THRESHOLD = 80;
