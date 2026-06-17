export interface BetaWaitlistFormData {
  name: string;
  email: string;
  organization?: string;
  reason: string;
}

export interface BetaWaitlistEntry extends BetaWaitlistFormData {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}
