// src/types/index.ts

export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  cpf: string;
  phone: string;
  email?: string;
  address: string;
  responsibleName: string;
  responsibleCpf: string;
  responsiblePhone: string;
  consentLGPD?: boolean;
  specialAlert?: string;
  createdAt?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  code: string;
  basePrice: number;
  operationalCost: number;
  estimatedTime: string;
  instructions: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  services: Service[];
  status: string;
  totalAmount: number;
  createdAt: string;
  sampleIds?: string[];
}
