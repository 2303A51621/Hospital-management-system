import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      globalThis.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const toSearchParams = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.append(key, String(value));
    }
  });
  return search.toString();
};

export type UserRole = 'admin' | 'doctor' | 'patient' | (string & {});

export interface AuthUser {
  id: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: UserRole;
  profilePicture?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'patient';
  phone?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface Doctor {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    profilePicture?: string;
  };
  specialization: string;
  experience?: number;
  qualification?: string[];
  department?: string;
  availability?: Array<{ day: string; startTime: string; endTime: string }>;
  availableDays?: string[];
  availableSlots?: { startTime: string; endTime: string; slotDuration?: number };
  consultationFee?: number;
  rating?: number;
  totalReviews?: number;
}

export interface PatientProfile {
  _id: string;
  patientId?: string;
  userId: string | AuthUser;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  createdAt?: string;
}

export interface Appointment {
  _id: string;
  appointmentId?: string;
  patientId?: string | PatientProfile;
  userId?: string | AuthUser;
  doctorId?: {
    _id?: string;
    specialization?: string;
    userId?: {
      _id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  appointmentDate?: string;
  date?: string;
  startTime: string;
  endTime: string;
  reason?: string;
  consultationType?: 'in-person' | 'telemedicine';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | 'scheduled';
  reminderLeadMinutes?: number;
  reminderChannels?: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  rating?: number | null;
  createdAt?: string;
  updatedAt?: string;
  consultationFee?: number;
  billingId?: string | null;
  billing?: {
    summary?: { totalAmount?: number };
    paymentDetails?: { paymentMethod?: string; paymentStatus?: string; paymentId?: string };
  };
}

export interface AppointmentPayload {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  consultationType?: 'in-person' | 'telemedicine';
  reminderLeadMinutes?: number;
  reminderChannels?: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  status?: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod?: 'online' | 'pay_at_hospital';
}

export interface DoctorReview {
  _id: string;
  rating: number;
  review?: string;
  reviewSubmittedAt?: string;
  createdAt: string;
  appointmentDate?: string;
  userId?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface EmergencyLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface EmergencyRequestPayload {
  patientName: string;
  phoneNumber: string;
  emergencyType: 'accident' | 'heart-attack' | 'pregnancy' | 'other';
  pickupLocation: EmergencyLocation;
  dropLocation?: EmergencyLocation;
  priorityLevel: 'normal' | 'critical';
}

export interface EmergencyAmbulanceUnit {
  _id: string;
  unitCode: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  status: 'available' | 'busy' | 'maintenance';
  currentLocation: {
    latitude: number;
    longitude: number;
    lastUpdatedAt: string;
  };
}

export interface EmergencyRequestRecord {
  _id: string;
  requestCode: string;
  patientName: string;
  phoneNumber: string;
  emergencyType: 'accident' | 'heart-attack' | 'pregnancy' | 'other';
  priorityLevel: 'normal' | 'critical';
  pickupLocation: EmergencyLocation;
  dropLocation?: EmergencyLocation;
  status: 'waiting-assignment' | 'ambulance-dispatched' | 'on-the-way' | 'arrived' | 'completed' | 'cancelled';
  estimatedArrivalMinutes: number | null;
  assignedAmbulance?: EmergencyAmbulanceUnit;
  createdAt: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  agent: string;
  groundedIn: string[];
}

export const authAPI = {
  register: (data: RegisterPayload) => api.post<AuthResponse>('/auth/register', data),
  createAdmin: (data: { name: string; email: string; phone?: string; password: string }) =>
    api.post('/auth/admin', data),
  login: (data: LoginPayload) => api.post<AuthResponse>('/auth/login', data),
  getMe: () => api.get<{ user: AuthUser }>('/auth/me'),
  logout: () => api.post('/auth/logout'),
  getStaff: () => api.get<{ success: boolean; data: StaffMember[]; count: number; groups: Record<string, StaffMember[]> }>('/auth/staff'),
  createStaff: (data: unknown) => api.post('/auth/staff', data),
};

export interface StaffMember {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  doctorProfile?: {
    specialization?: string;
    department?: string;
    availability?: Array<{ day: string; startTime: string; endTime: string }>;
  } | null;
}

export const patientAPI = {
  getAll: (page = 1) => api.get<{ count: number; patients: PatientProfile[]; data: PatientProfile[] }>(`/patients?page=${page}`),
  getById: (id: string) => api.get(`/patients/${id}`),
  getByUserId: (userId: string) => api.get<{ success: boolean; data: PatientProfile | null }>(`/patients/user/${userId}`),
  create: (data: unknown) => api.post('/patients', data),
  update: (id: string, data: unknown) => api.put(`/patients/${id}`, data),
  delete: (id: string) => api.delete(`/patients/${id}`),
};

export const doctorAPI = {
  getAll: (page = 1, specialization = '', limit?: number) =>
    api.get<{ success: boolean; count: number; data: Doctor[] }>(`/doctors?${toSearchParams({ page, specialization, limit })}`),
  getById: (id: string) => api.get<{ doctor: Doctor }>(`/doctors/${id}`),
  getReviews: (id: string, page = 1, limit = 10) =>
    api.get<{ doctor: { rating: number; totalReviews: number }; reviews: DoctorReview[] }>(
      `/doctors/${id}/reviews?${toSearchParams({ page, limit })}`
    ),
  getByUserId: (userId: string) => api.get<{ doctor: Doctor }>(`/doctors/user/${userId}`),
  create: (data: unknown) => api.post('/doctors', data),
  update: (id: string, data: unknown) => api.put(`/doctors/${id}`, data),
};

export const appointmentAPI = {
  getAll: (filters: Record<string, string | number | undefined> = {}) =>
    api.get<{ success: boolean; count: number; data: Appointment[] }>(`/appointments?${toSearchParams(filters)}`),
  getById: (id: string) => api.get(`/appointments/${id}`),
  book: (data: AppointmentPayload) => api.post('/appointments', data),
  reschedule: (id: string, data: { newAppointmentDate: string; newStartTime: string; newEndTime: string }) =>
    api.put(`/appointments/${id}/reschedule`, data),
  cancel: (id: string) => api.put(`/appointments/${id}/cancel`),
  complete: (id: string) => api.put(`/appointments/${id}/complete`),
  submitReview: (id: string, data: { rating: number; review?: string }) => api.post(`/appointments/${id}/review`, data),
  createVideoSession: (id: string, data?: { provider?: 'webrtc' | 'zoom'; regenerate?: boolean }) =>
    api.post<{ canJoin: boolean; session: { joinUrl: string; provider: string; roomId?: string } }>(
      `/appointments/${id}/video-session`,
      data || {}
    ),
  getDoctorAvailability: (doctorId: string, date: string) =>
    api.get<{ availableSlots: Array<{ startTime: string; endTime: string }> }>(
      `/appointments/doctor/${doctorId}/availability?${toSearchParams({ date })}`
    ),
};

export const billingAPI = {
  getAll: () => api.get<{ success: boolean; data: Array<{ summary?: { totalAmount?: number }; status?: string; paymentDetails?: { paymentStatus?: string } }>; count: number }>('/billing'),
  createOnlineOrder: (invoiceId: string) =>
    api.post<{ success: boolean; data: { orderId: string; amount: number; currency: string; keyId: string } }>(
      `/billing/${invoiceId}/payment/order`
    ),
  verifyOnlinePayment: (invoiceId: string, data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post(`/billing/${invoiceId}/payment/verify`, data),
};

export interface Medicine {
  _id: string;
  medicineName: string;
  genericName?: string;
  medicineType: string;
  strength?: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  cost?: { purchasePrice?: number; sellingPrice?: number; discount?: number };
  stock: { quantity: number; unit?: string; minThreshold?: number; maxThreshold?: number };
  supplier?: { supplierName?: string; supplierPhone?: string; supplierEmail?: string };
  isActive: boolean;
}

export const medicineAPI = {
  getAll: (search = '') => api.get<{ success: boolean; data: Medicine[]; count: number; summary: { lowStock: number; expiringSoon: number } }>(
    `/medicines?${toSearchParams({ search, active: 'true' })}`
  ),
  create: (data: unknown) => api.post<{ data: Medicine }>('/medicines', data),
  update: (id: string, data: unknown) => api.put<{ data: Medicine }>(`/medicines/${id}`, data),
  archive: (id: string) => api.delete(`/medicines/${id}`),
};

export interface BedRecord {
  _id: string;
  bedNumber: string;
  wardId: string;
  bedType: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  currentPatient?: { patientId?: string; admissionDate?: string; expectedDischargeDate?: string };
  costPerDay?: number;
}

export interface WardRecord {
  _id: string;
  wardName: string;
  wardType: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
}

export const wardAPI = {
  getDashboard: () => api.get<{ success: boolean; data: Array<{ ward: WardRecord; beds: BedRecord[] }>; summary: { totalBeds: number; occupiedBeds: number; availableBeds: number; maintenanceBeds: number } }>('/wards'),
  updateBedStatus: (id: string, status: BedRecord['status']) => api.patch(`/wards/beds/${id}/status`, { status }),
};

export interface MedicalRecord {
  _id: string;
  patientId: string;
  recordType: 'prescription' | 'report' | 'other';
  title: string;
  notes?: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  doctorId?: { userId?: { name?: string; firstName?: string; lastName?: string } };
}

export const medicalRecordAPI = {
  getAll: (patientId?: string) => api.get<{ success: boolean; data: MedicalRecord[]; count: number }>(`/medical-records?${toSearchParams({ patientId })}`),
  upload: (data: FormData) => api.post<{ success: boolean; data: MedicalRecord }>('/medical-records/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFile: (id: string) => api.get<{ data: { fileName: string; fileType: string; fileData: string } }>(`/medical-records/${id}/file`),
};

export const notificationAPI = {
  getAll: (limit = 20) =>
    api.get<{ unreadCount: number; notifications: NotificationItem[] }>(`/notifications?${toSearchParams({ limit })}`),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const emergencyAPI = {
  createRequest: (data: EmergencyRequestPayload) =>
    api.post<{
      success: boolean;
      message: string;
      request: EmergencyRequestRecord;
      ambulance: {
        id: string;
        unitCode: string;
        vehicleNumber: string;
        driverName: string;
        driverPhone: string;
        status: string;
      } | null;
      liveTracking: { etaMinutes: number; status: string } | null;
      emergencyPhone: string;
    }>('/emergency/requests', data),

  getAvailability: (latitude: number, longitude: number) =>
    api.get<{
      success: boolean;
      availableCount: number;
      nearest: {
        ambulanceId: string;
        unitCode: string;
        driverName: string;
        distanceKm: number;
        etaMinutes: number;
      } | null;
      emergencyPhone: string;
    }>(`/emergency/availability?${toSearchParams({ latitude, longitude })}`),

  getTracking: (requestId: string) =>
    api.get<{ success: boolean; request: EmergencyRequestRecord | null; emergencyPhone: string }>(
      `/emergency/requests/${requestId}/status`
    ),

  seedAmbulances: () => api.post('/emergency/admin/seed-ambulances'),
  getAdminRequests: () =>
    api.get<{ success: boolean; count: number; requests: EmergencyRequestRecord[] }>('/emergency/admin/requests'),
  getAdminAmbulances: () =>
    api.get<{ success: boolean; count: number; ambulances: EmergencyAmbulanceUnit[] }>('/emergency/admin/ambulances'),
  updateRequestStatus: (id: string, status: string, note?: string) =>
    api.patch(`/emergency/admin/requests/${id}/status`, { status, note }),
  reassignAmbulance: (id: string, ambulanceId: string) =>
    api.patch(`/emergency/admin/requests/${id}/assign`, { ambulanceId }),
};

export const aiChatAPI = {
  ask: (question: string, context: { currentPage?: string } = {}) =>
    api.post<ChatResponse>('/ai/chat', { question, ...context }),
};

export default api;
