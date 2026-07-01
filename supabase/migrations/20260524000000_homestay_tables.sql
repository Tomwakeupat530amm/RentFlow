-- Create Enum Types
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid', 'refunded');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE task_type AS ENUM ('cleaning', 'maintenance', 'inspection');

-- Create Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    guest_phone TEXT,
    guest_email TEXT,
    guest_id_number TEXT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    status booking_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Housekeeping Tasks Table
CREATE TABLE housekeeping_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    task_type task_type NOT NULL,
    status task_status NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view bookings in their org" ON bookings FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert bookings in their org" ON bookings FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update bookings in their org" ON bookings FOR UPDATE USING (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete bookings in their org" ON bookings FOR DELETE USING (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));

-- RLS Policies for Housekeeping Tasks
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tasks in their org" ON housekeeping_tasks FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert tasks in their org" ON housekeeping_tasks FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update tasks in their org" ON housekeeping_tasks FOR UPDATE USING (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete tasks in their org" ON housekeeping_tasks FOR DELETE USING (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));
