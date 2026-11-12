const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');
const LabTest = require('../models/LabTest');
const Prescription = require('../models/Prescription');
const { Ward, Bed } = require('../models/Ward');
const Ambulance = require('../models/Ambulance');
const EmergencyRequest = require('../models/EmergencyRequest');
const MedicalKnowledge = require('../models/MedicalKnowledge');

const formatDoctorName = (doctor) => {
  const user = doctor?.userId;
  if (!user) return 'Doctor';
  return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Doctor';
};

const hospitalAITools = {
  // 1. Search doctors directory
  searchDoctors: async ({ query = '', specialization = '', department = '' }) => {
    const filter = { isActive: true };
    if (specialization) {
      filter.specialization = new RegExp(specialization, 'i');
    }
    if (department) {
      filter.department = new RegExp(department, 'i');
    }

    const doctors = await Doctor.find(filter)
      .populate('userId', 'name firstName lastName email phone profilePicture')
      .sort({ rating: -1 })
      .limit(10)
      .lean();

    const q = query.trim().toLowerCase();
    const filtered = q
      ? doctors.filter((doc) => {
          const name = formatDoctorName(doc).toLowerCase();
          const spec = (doc.specialization || '').toLowerCase();
          const dept = (doc.department || '').toLowerCase();
          return name.includes(q) || spec.includes(q) || dept.includes(q);
        })
      : doctors;

    return {
      tool: 'searchDoctors',
      count: filtered.length,
      doctors: filtered.map((doc) => ({
        id: doc._id,
        name: formatDoctorName(doc),
        specialization: doc.specialization,
        department: doc.department || 'Outpatient Department',
        experience: doc.experienceYears ? `${doc.experienceYears} years` : 'Experienced clinician',
        consultationFee: `₹${doc.consultationFee || 500}`,
        rating: doc.rating ? `${doc.rating} / 5.0` : '5.0 / 5.0',
        availableDays: (doc.availability || []).map((a) => a.day).join(', ') || 'Monday - Sunday (24x7 Coverage)',
      })),
    };
  },

  // 2. Check doctor availability slots
  checkDoctorAvailability: async ({ doctorId, dateStr }) => {
    let doc = null;
    if (doctorId) {
      doc = await Doctor.findById(doctorId).populate('userId', 'name firstName lastName').lean();
    }
    if (!doc) {
      return { tool: 'checkDoctorAvailability', available: false, message: 'Please specify a doctor to check slot availability.' };
    }

    const date = dateStr ? new Date(dateStr) : new Date();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

    const existingAppointments = await Appointment.find({
      doctorId: doc._id,
      appointmentDate: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
      status: { $nin: ['cancelled', 'completed', 'no-show'] },
    }).select('startTime').lean();

    const bookedSlots = new Set(existingAppointments.map((a) => a.startTime));

    // Standard hourly consultation slots
    const allSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
      '06:00 PM', '07:00 PM', '08:00 PM'
    ];

    const freeSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

    return {
      tool: 'checkDoctorAvailability',
      doctorName: formatDoctorName(doc),
      specialization: doc.specialization,
      day: dayName,
      date: date.toISOString().slice(0, 10),
      consultationFee: `₹${doc.consultationFee || 500}`,
      availableSlotsCount: freeSlots.length,
      availableSlots: freeSlots,
    };
  },

  // 3. Get user appointments
  getUserAppointments: async ({ user, status = 'all' }) => {
    let filter = {};

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id }).lean();
      if (!patient) return { tool: 'getUserAppointments', count: 0, appointments: [] };
      filter.patientId = patient._id;
    } else if (user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: user._id }).lean();
      if (!doc) return { tool: 'getUserAppointments', count: 0, appointments: [] };
      filter.doctorId = doc._id;
    }

    if (status !== 'all') {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate('doctorId', 'userId specialization consultationFee department')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName' } })
      .populate('patientId', 'userId emergencyContact')
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name firstName lastName email phone' } })
      .sort({ appointmentDate: -1 })
      .limit(10)
      .lean();

    return {
      tool: 'getUserAppointments',
      count: appointments.length,
      appointments: appointments.map((apt) => ({
        id: apt._id,
        appointmentDate: apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'N/A',
        timeSlot: apt.startTime || apt.timeSlot || 'Scheduled',
        doctorName: formatDoctorName(apt.doctorId),
        specialization: apt.doctorId?.specialization || 'Clinical Specialist',
        patientName: apt.patientId?.userId?.name || 'Patient',
        status: apt.status,
        type: apt.type || apt.consultationType || 'in-person',
        reason: apt.reason || 'Medical Consultation',
      })),
    };
  },

  // 4. Get patient billing & invoices
  getUserBilling: async ({ user }) => {
    const patient = await Patient.findOne({ userId: user._id }).lean();
    if (!patient && user.role === 'patient') {
      return { tool: 'getUserBilling', totalBilled: 0, totalPaid: 0, totalOutstanding: 0, invoices: [] };
    }

    const filter = user.role === 'patient' ? { patientId: patient._id } : {};
    const billings = await Billing.find(filter)
      .sort({ invoiceDate: -1 })
      .limit(10)
      .lean();

    const totalBilled = billings.reduce((sum, b) => sum + (b.summary?.totalAmount || 0), 0);
    const totalPaid = billings
      .filter((b) => b.paymentDetails?.paymentStatus === 'completed' || b.status === 'paid')
      .reduce((sum, b) => sum + (b.summary?.totalAmount || 0), 0);
    const totalOutstanding = billings
      .filter((b) => b.paymentDetails?.paymentStatus === 'pending' || b.status === 'issued')
      .reduce((sum, b) => sum + (b.summary?.totalAmount || 0), 0);

    return {
      tool: 'getUserBilling',
      totalBilled: `₹${totalBilled.toLocaleString()}`,
      totalPaid: `₹${totalPaid.toLocaleString()}`,
      totalOutstanding: `₹${totalOutstanding.toLocaleString()}`,
      invoices: billings.map((inv) => ({
        invoiceNumber: inv.invoiceNumber || String(inv._id).slice(-8).toUpperCase(),
        date: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : 'N/A',
        total: `₹${inv.summary?.totalAmount || 0}`,
        status: inv.paymentDetails?.paymentStatus || inv.status || 'pending',
      })),
    };
  },

  // 5. Get laboratory reports
  getUserLabReports: async ({ user }) => {
    const patient = await Patient.findOne({ userId: user._id }).lean();
    if (!patient && user.role === 'patient') {
      return { tool: 'getUserLabReports', count: 0, reports: [] };
    }

    const filter = user.role === 'patient' ? { patientId: patient._id } : {};
    const reports = await LabTest.find(filter)
      .populate('doctorId', 'userId specialization')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName' } })
      .sort({ orderDate: -1 })
      .limit(10)
      .lean();

    return {
      tool: 'getUserLabReports',
      count: reports.length,
      reports: reports.map((r) => ({
        id: r._id,
        testName: r.testName,
        orderDate: r.orderDate ? new Date(r.orderDate).toLocaleDateString() : 'N/A',
        status: r.status,
        prescribingDoctor: formatDoctorName(r.doctorId),
        resultsSummary: r.results?.notes || r.notes || (r.status === 'completed' ? 'Results available for clinical review' : 'Sample processed / In progress'),
      })),
    };
  },

  // 6. Get prescriptions
  getUserPrescriptions: async ({ user }) => {
    const patient = await Patient.findOne({ userId: user._id }).lean();
    if (!patient && user.role === 'patient') {
      return { tool: 'getUserPrescriptions', count: 0, prescriptions: [] };
    }

    const filter = user.role === 'patient' ? { patientId: patient._id } : {};
    const prescriptions = await Prescription.find(filter)
      .populate('doctorId', 'userId specialization')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName' } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      tool: 'getUserPrescriptions',
      count: prescriptions.length,
      prescriptions: prescriptions.map((p) => ({
        id: p._id,
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
        prescribingDoctor: formatDoctorName(p.doctorId),
        medicinesCount: (p.medicines || []).length,
        medicines: (p.medicines || []).map((m) => `${m.name || m.medicineName} (${m.dosage || ''} ${m.frequency || ''} ${m.duration || ''})`.trim()),
        instructions: p.generalInstructions || p.notes || 'Follow prescribing clinician guidance.',
      })),
    };
  },

  // 7. Get Hospital Bed Availability
  getWardBedAvailability: async () => {
    const wards = await Ward.find({ isActive: true })
      .select('wardName wardType totalBeds occupiedBeds availableBeds floorNumber')
      .lean();

    const totalBeds = wards.reduce((sum, w) => sum + (w.totalBeds || 0), 0);
    const availableBeds = wards.reduce((sum, w) => sum + (w.availableBeds ?? Math.max((w.totalBeds || 0) - (w.occupiedBeds || 0), 0)), 0);
    const occupiedBeds = totalBeds - availableBeds;

    return {
      tool: 'getWardBedAvailability',
      summary: {
        totalHospitalBeds: totalBeds,
        availableBeds,
        occupiedBeds,
        occupancyRate: totalBeds > 0 ? `${Math.round((occupiedBeds / totalBeds) * 100)}%` : '0%',
      },
      wardBreakdown: wards.map((w) => ({
        ward: w.wardName,
        type: w.wardType || 'General Care',
        total: w.totalBeds,
        free: w.availableBeds ?? Math.max((w.totalBeds || 0) - (w.occupiedBeds || 0), 0),
      })),
    };
  },

  // 8. Search RAG Knowledge Repository
  searchMedicalKnowledge: async ({ query, category = '' }) => {
    const terms = String(query || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (!terms.length) {
      return { tool: 'searchMedicalKnowledge', count: 0, documents: [] };
    }

    const regexArray = terms.map((t) => new RegExp(t, 'i'));
    const filter = {
      approved: true,
      $or: [
        { title: { $in: regexArray } },
        { content: { $in: regexArray } },
        { symptoms: { $in: regexArray } },
      ],
    };

    if (category) {
      filter.category = category;
    }

    const docs = await MedicalKnowledge.find(filter).limit(5).lean();

    return {
      tool: 'searchMedicalKnowledge',
      count: docs.length,
      documents: docs.map((d) => ({
        id: d._id,
        sourceId: d.sourceId,
        title: d.title,
        category: d.category,
        symptoms: d.symptoms,
        precautions: d.precautions,
        warnings: d.warnings,
        content: d.content,
      })),
    };
  },
};

module.exports = { hospitalAITools, formatDoctorName };
