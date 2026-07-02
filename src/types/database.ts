// ============================================================
// Database entity types — maps directly to Supabase tables
// ============================================================

export interface Organization {
    id: string;
    name: string;
    invite_code: string;
    plan_type: 'free' | 'premium';
    created_at: string;
    updated_at: string;
}

export interface UserProfile {
    id: string;
    org_id: string | null;
    full_name: string | null;
    phone: string | null;
    role: 'owner' | 'member';
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaymentSettings {
    id: string;
    org_id: string;
    bank_name: string;
    bank_bin: string;
    bank_account: string;
    account_name: string;
    payos_client_id: string | null;
    payos_api_key: string | null;
    payos_checksum_key: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaymentSettingsFormData {
    bank_name: string;
    bank_bin: string;
    bank_account: string;
    account_name: string;
    payos_client_id?: string;
    payos_api_key?: string;
    payos_checksum_key?: string;
}

export type BuildingStatus = 'active' | 'inactive';
export type BuildingRentalType = 'long_term' | 'short_term' | 'mixed';

export interface Building {
    id: string;
    org_id: string;
    name: string;
    address: string | null;
    num_floors: number;
    description: string | null;
    status: BuildingStatus;
    rental_type: BuildingRentalType;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    // Virtual fields (from joins/counts)
    room_count?: number;
    occupied_count?: number;
    vacant_count?: number;
}

export type RoomStatus = 'vacant' | 'occupied' | 'maintenance';
export type RoomType = 'single' | 'double' | 'studio' | 'other';
export type RoomRentalType = 'long_term' | 'short_term';

export interface Room {
    id: string;
    building_id: string;
    name: string;
    floor: number;
    area_m2: number | null;
    room_type: RoomType;
    default_rent: number;
    status: RoomStatus;
    rental_type: RoomRentalType;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    // Virtual fields
    building?: Building;
}

// ============================================================
// Form/input types — used when creating or updating entities
// ============================================================

export interface BuildingFormData {
    name: string;
    address?: string;
    num_floors: number;
    description?: string;
    status: BuildingStatus;
    rental_type?: BuildingRentalType;
}

export interface RoomFormData {
    name: string;
    floor: number;
    area_m2?: number;
    room_type: RoomType;
    default_rent: number;
    status: RoomStatus;
    rental_type?: RoomRentalType;
    notes?: string;
}

// ============================================================
// Sprint 2 — Tenants, Contracts, Service Prices, Meter Records
// ============================================================

export interface Tenant {
    id: string;
    org_id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    id_number: string | null;
    id_image_url: string | null;
    date_of_birth: string | null;
    permanent_address: string | null;
    notes: string | null;
    is_active: boolean;
    access_code: string | null;
    room_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Roommate {
    id: string;
    org_id: string;
    contract_id: string;
    full_name: string;
    phone: string | null;
    id_number: string | null;
    id_image_url: string | null;
    created_at: string;
    updated_at: string;
}

export type ContractStatus = 'active' | 'expired' | 'terminated';

export interface Contract {
    id: string;
    org_id: string;
    room_id: string;
    tenant_id: string;
    rent_amount: number;
    deposit: number;
    start_date: string;
    end_date: string | null;
    status: ContractStatus;
    scan_url: string | null;
    signed_by_owner: boolean;
    signed_by_tenant: boolean;
    owner_signed_at: string | null;
    tenant_signed_at: string | null;
    signature_data: unknown | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    // Virtual fields (from joins)
    room?: Room;
    tenant?: Tenant;
    building?: Building;
    roommates?: Roommate[];
}

export type ServiceType = 'electricity' | 'water' | 'internet' | 'parking' | 'garbage' | 'other';

export interface ServicePrice {
    id: string;
    building_id: string;
    service_type: ServiceType;
    label: string;
    unit_price: number;
    unit: string;
    is_metered: boolean;
    created_at: string;
    updated_at: string;
}

export interface MeterRecord {
    id: string;
    room_id: string;
    record_month: string;
    electricity_old: number;
    electricity_new: number;
    electricity_usage: number;
    water_old: number;
    water_new: number;
    water_usage: number;
    image_urls: string[] | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Virtual fields
    room?: Room;
}

// ============================================================
// Sprint 2 — Form/input types
// ============================================================

export interface TenantFormData {
    full_name: string;
    phone?: string;
    email?: string;
    id_number?: string;
    id_image_url?: string;
    date_of_birth?: string;
    permanent_address?: string;
    notes?: string;
}

export interface ContractFormData {
    room_id: string;
    tenant_id: string;
    rent_amount: number;
    deposit?: number;
    start_date: string;
    end_date?: string;
    status: ContractStatus;
    notes?: string;
}

export interface RoommateFormData {
    full_name: string;
    phone?: string;
    id_number?: string;
    id_image_url?: string;
}

export interface ServicePriceFormData {
    building_id: string;
    service_type: ServiceType;
    label: string;
    unit_price: number;
    unit?: string;
    is_metered: boolean;
}

export interface MeterRecordFormData {
    room_id: string;
    record_month: string;
    electricity_old: number;
    electricity_new: number;
    electricity_usage: number;
    water_old: number;
    water_new: number;
    water_usage: number;
    notes?: string;
}

// ============================================================
// Sprint 3 — Invoices and Payments
// ============================================================

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid';

export interface Invoice {
    id: string;
    org_id: string;
    building_id: string;
    room_id: string;
    contract_id: string | null;
    tenant_id: string | null;
    month: string;
    title: string;
    total_amount: number;
    paid_amount: number;
    status: InvoiceStatus;
    due_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Virtual fields
    room?: Room;
    building?: Building;
    tenant?: Tenant;
    contract?: Contract;
}

export type InvoiceItemType = 'rent' | 'electricity' | 'water' | 'service' | 'other';

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    type: InvoiceItemType;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    reference_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvoiceFormData {
    building_id: string;
    room_id: string;
    contract_id?: string;
    tenant_id?: string;
    month: string;
    title: string;
    due_date?: string;
    notes?: string;
}

export interface InvoiceItemFormData {
    invoice_id: string;
    type: InvoiceItemType;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    reference_id?: string;
}

// ============================================================
// Sprint 4 — Incidents and Reminders
// ============================================================

export type IncidentStatus = 'open' | 'in_progress' | 'resolved';
export type IncidentPriority = 'high' | 'medium' | 'low';
export type ReporterType = 'owner' | 'member' | 'tenant';

export interface Incident {
    id: string;
    org_id: string;
    building_id: string;
    room_id: string | null;
    reporter_type: ReporterType;
    reported_by: string | null;
    title: string;
    description: string | null;
    image_urls: string[] | null;
    status: IncidentStatus;
    priority: IncidentPriority;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    // Virtual fields
    building?: Building;
    room?: Room;
    reporter?: UserProfile | Tenant;
}

export type ReminderEntityType = 'contract' | 'invoice' | 'incident' | 'other';

export interface Reminder {
    id: string;
    org_id: string;
    entity_type: ReminderEntityType;
    entity_id: string | null;
    message: string;
    due_date: string | null;
    is_read: boolean;
    created_at: string;
}

export interface IncidentFormData {
    building_id: string;
    room_id?: string | null;
    reporter_type: ReporterType;
    reported_by?: string;
    title: string;
    description?: string;
    status: IncidentStatus;
    priority: IncidentPriority;
    admin_notes?: string;
    image_urls?: string[];
}

// ============================================================
// Sprint 5 — Expenses
// ============================================================

export type ExpenseCategory = 'electricity' | 'water' | 'internet' | 'garbage' | 'maintenance' | 'salary' | 'marketing' | 'other';

export interface Expense {
    id: string;
    org_id: string;
    building_id: string | null;
    category: ExpenseCategory;
    amount: number;
    date: string;
    description: string | null;
    receipt_url: string | null;
    created_at: string;
    updated_at: string;
    // Virtual fields
    building?: Building;
}

export interface ExpenseFormData {
    building_id?: string | null;
    category: ExpenseCategory;
    amount: number;
    date: string;
    description?: string;
    receipt_url?: string;
}

// ============================================================
// Sprint 5 — Subscriptions & Premium Gate
// ============================================================

export type PlanType = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Subscription {
    id: string;
    org_id: string;
    plan_type: PlanType;
    starts_at: string;
    expires_at: string | null;
    status: SubscriptionStatus;
    amount_paid: number;
    payment_ref: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrgUsage {
    building_count: number;
    room_count: number;
}

// Free tier limits
export const FREE_TIER_LIMITS = {
    MAX_BUILDINGS: 2,
    MAX_ROOMS: 30,
} as const;

// Premium feature keys
export type PremiumFeature =
    | 'ai_ocr'
    | 'auto_payment'
    | 'e_signature'
    | 'advanced_kanban'
    | 'advanced_reporting'
    | 'excel_export'
    | 'rbac'
    | 'unlimited_buildings';

// ============================================================
// Sprint 6 — Homestay Module
// ============================================================

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

export interface Booking {
    id: string;
    org_id: string;
    building_id: string;
    room_id: string;
    guest_name: string;
    guest_phone: string | null;
    guest_email: string | null;
    guest_id_number: string | null;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    paid_amount: number;
    status: BookingStatus;
    payment_status: PaymentStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Virtual fields
    room?: Room;
    building?: Building;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskType = 'cleaning' | 'maintenance' | 'inspection';

export interface HousekeepingTask {
    id: string;
    org_id: string;
    building_id: string;
    room_id: string;
    task_type: TaskType;
    status: TaskStatus;
    assigned_to: string | null;
    scheduled_date: string;
    completed_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Virtual fields
    room?: Room;
    building?: Building;
    assignee?: UserProfile;
}

export interface BookingFormData {
    building_id: string;
    room_id: string;
    guest_name: string;
    guest_phone?: string;
    guest_email?: string;
    guest_id_number?: string;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    status: BookingStatus;
    payment_status: PaymentStatus;
    notes?: string;
}

export interface HousekeepingTaskFormData {
    building_id: string;
    room_id: string;
    task_type: TaskType;
    status: TaskStatus;
    assigned_to?: string;
    scheduled_date: string;
    notes?: string;
}
