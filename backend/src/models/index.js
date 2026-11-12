// Centralized models registry to ensure all schemas are loaded in Mongoose before queries/populates
const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const Billing = require('./Billing');
const Consultation = require('./Consultation');
const LabTest = require('./LabTest');
const Prescription = require('./Prescription');
const MedicalRecord = require('./MedicalRecord');
const EMR = require('./EMR');
const FamilyMember = require('./FamilyMember');
const Feedback = require('./Feedback');
const LeaveRequest = require('./LeaveRequest');
const Referral = require('./Referral');
const Message = require('./Message');
const Notification = require('./Notification');
const Medicine = require('./Medicine');
const Ward = require('./Ward');
const Ambulance = require('./Ambulance');
const AmbulanceUnit = require('./AmbulanceUnit');
const EmergencyRequest = require('./EmergencyRequest');
const MedicalKnowledge = require('./MedicalKnowledge');
const ActivityLog = require('./ActivityLog');
const AIChatAudit = require('./AIChatAudit');
const AIChatSession = require('./AIChatSession');

module.exports = {
  User,
  Patient,
  Doctor,
  Appointment,
  Billing,
  Consultation,
  LabTest,
  Prescription,
  MedicalRecord,
  EMR,
  FamilyMember,
  Feedback,
  LeaveRequest,
  Referral,
  Message,
  Notification,
  Medicine,
  Ward,
  Ambulance,
  AmbulanceUnit,
  EmergencyRequest,
  MedicalKnowledge,
  ActivityLog,
  AIChatAudit,
  AIChatSession,
};

