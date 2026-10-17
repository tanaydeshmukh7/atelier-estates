export type EnquiryType = 'viewing' | 'general' | 'private_acquisition' | 'consignment';

export type EnquiryStatus = 'pending' | 'contacted' | 'qualified' | 'scheduled' | 'closed' | 'archived';

export interface EnquirySubmission {
  propertyId?: string | null;
  propertyTitle?: string | null;
  fullName: string;
  email: string;
  phone?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  message?: string;
  notes?: string;
  type: EnquiryType;
  website?: string; // Honeypot field
  visitorId?: string | null;
  sessionId?: string | null;
}

export interface EnquiryRecord {
  id: string;
  reference_id: string;
  property_id: string | null;
  property_title: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string;
  type: EnquiryType;
  status: EnquiryStatus;
  created_at: string;
  updated_at?: string;
  visitor_id?: string | null;
  session_id?: string | null;
  properties?: {
    title?: string;
    slug?: string;
  } | null;
  browsing?: {
    title: string;
    slug: string;
    visitedAt: string;
  }[];
}

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  pending: 'New',
  contacted: 'Contacted',
  scheduled: 'Viewing Scheduled',
  qualified: 'Converted',
  closed: 'Closed',
  archived: 'Archived',
};

export const ENQUIRY_TYPE_LABELS: Record<EnquiryType, string> = {
  general: 'General Enquiry',
  viewing: 'Viewing Request',
  private_acquisition: 'Private Acquisition',
  consignment: 'Property Consignment',
};
