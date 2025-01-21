export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user?: {
        id: number;
        username: string;
    };
}

export interface Patient {
    id?: number;
    name: string;
    age: number;
    contact: string;
}

export interface Prescription {
    id?: number;
    patientId: number;
    medication: string;
    dosage: string;
    notes?: string;
}