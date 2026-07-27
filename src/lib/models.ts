export type DonationKind = "KURBAN" | "ZEKAT" | "KURAN" | "GENEL";
export type PaymentMethod = "NAKIT" | "HAVALE" | "KART" | "DIGER";
export type ShareStatus = "BOS" | "BEKLEYEN" | "DOLU" | "IPTAL";
export type UserRole = "YONETICI" | "BAGIS_PERSONELI" | "RAPOR";

export interface Donor {
  id: string;
  fullName: string;
  phone: string;
  total: number;
  donationCount: number;
  lastDonationAt: string;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  phone: string;
  kind: DonationKind;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  createdAt: string;
  createdBy: string;
  sacrificeId?: string;
  shareNo?: number;
}

export interface SacrificeShare {
  no: number;
  status: ShareStatus;
  donorId?: string;
  donorName?: string;
  donationId?: string;
}

export interface Sacrifice {
  id: string;
  number: number;
  country: string;
  sharePrice: number;
  shares: SacrificeShare[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface MessageLog {
  id: string;
  phone: string;
  donorName: string;
  message: string;
  createdAt: string;
  status: "HAZIRLANDI" | "ACILDI";
  donationId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  detail: string;
  userName: string;
  createdAt: string;
}

export interface VefaData {
  donors: Donor[];
  donations: Donation[];
  sacrifices: Sacrifice[];
  users: AppUser[];
  messages: MessageLog[];
  audit: AuditLog[];
  currentUserId: string;
  organizationName: string;
}
