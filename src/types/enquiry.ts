export type EnquiryType = 'viewing' | 'general' | 'private_acquisition' | 'consignment';

export interface EnquirySubmission {
  propertyId?: string;
  propertyTitle?: string;
  fullName: string;
  email: string;
  phone: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  type: EnquiryType;
}

export interface EnquiryRecord extends EnquirySubmission {
  id: string;
  created_at: string;
  status: 'pending' | 'contacted' | 'scheduled' | 'archived';
}
