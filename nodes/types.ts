export type PayerID = `pay_${string}`;
export type SubscriptionID = `sub_${string}`;
export type ReceivableID = `rcv_${string}`;

export interface Payer {
  id: PayerID;
  name?: string;
  mobile_number?: number;
  email?: string;
  status: 'active' | 'pending' | 'rejected' | 'terminated' | 'aborted' | 'checkout' | 'completed';
  address_street?: string;
  address_zip?: string;
  address_city?: string;
  personal_identity_number?: string;
  contact_consent?: boolean;
  external_id?: string;
}

export interface Subscription {
  id: SubscriptionID;
  payer_id: PayerID;
  amount: number;
  receivable_date: string | 'last_bank_date';
  payment_method_type: 'swish_recurring' | 'autogiro_external';
  status: 'active' | 'terminated';
  reference: string;
  source: 'repejo';
  index_adjustment_consent: boolean;
}

export interface Receivable {
  id: ReceivableID;
  subscription: SubscriptionID;
  amount: number;
  status: 'paid' | 'rejected' | 'insufficient_funds' | 'retry';
  type: 'onetime' | 'recurring';
  payment_method: 'swish_recurring';
  receivable_date: string;
  reference: string;
}

export type EventType =
  | 'payer.created'
  | 'payer.updated'
  | 'subscription.created'
  | 'subscription.updated'
  | 'receivable.created'
  | 'receivable.updated';

export interface WebhookPayload {
  sent_at: string;
  event_type: EventType;
  data: Payer | Subscription | Receivable;
}

export interface RepejoResponse<T> {
  data: T | T[];
}
