const mongoose = require('mongoose');
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

const VERIFIED_HOSPITAL_DOCTORS = [
  { name: 'Dr. Ishaan Singh', specialization: 'Orthopedics', department: 'Orthopedics', experience: '12 years', consultationFee: '₹600', rating: '4.9 / 5.0', availableDays: 'Monday - Saturday (10:00 AM - 06:00 PM)' },
  { name: 'Dr. Kiara Kapoor', specialization: 'Orthopedics', department: 'Orthopedics', experience: '10 years', consultationFee: '₹600', rating: '4.8 / 5.0', availableDays: 'Monday, Wednesday, Friday (08:00 AM - 04:00 PM)' },
  { name: 'Dr. Arjun Joshi', specialization: 'Cardiology', department: 'Cardiology', experience: '14 years', consultationFee: '₹600', rating: '4.9 / 5.0', availableDays: 'Monday - Friday (09:00 AM - 05:00 PM)' },
  { name: 'Dr. Vihaan Patel', specialization: 'Neurology', department: 'Neurology', experience: '15 years', consultationFee: '₹700', rating: '5.0 / 5.0', availableDays: 'Monday - Friday (10:00 AM - 05:00 PM)' },
  { name: 'Dr. Aanya Sharma', specialization: 'Dermatology', department: 'Dermatology', experience: '8 years', consultationFee: '₹500', rating: '4.8 / 5.0', availableDays: 'Tuesday, Thursday, Saturday (11:00 AM - 07:00 PM)' },
  { name: 'Dr. Pooja Mishra', specialization: 'Pediatrics', department: 'Pediatrics', experience: '11 years', consultationFee: '₹500', rating: '4.9 / 5.0', availableDays: 'Monday - Saturday (09:00 AM - 03:00 PM)' },
  { name: 'Dr. Anika Gupta', specialization: 'Gynecology', department: 'Obstetrics and Gynecology', experience: '13 years', consultationFee: '₹600', rating: '4.9 / 5.0', availableDays: 'Monday - Saturday (10:00 AM - 06:00 PM)' },
  { name: 'Dr. Kabir Khan', specialization: 'ENT', department: 'Otolaryngology', experience: '9 years', consultationFee: '₹500', rating: '4.7 / 5.0', availableDays: 'Monday - Friday (09:30 AM - 04:30 PM)' },
  { name: 'Dr. Rohan Mehta', specialization: 'General Surgery', department: 'Surgery', experience: '16 years', consultationFee: '₹700', rating: '4.9 / 5.0', availableDays: 'Monday - Friday (08:00 AM - 04:00 PM)' },
  { name: 'Dr. Nikhil Bose', specialization: 'Oncology', department: 'Oncology', experience: '14 years', consultationFee: '₹800', rating: '4.9 / 5.0', availableDays: 'Tuesday, Thursday, Friday (10:00 AM - 04:00 PM)' },
  { name: 'Dr. Priya Nair', specialization: 'Psychiatry', department: 'Mental Health', experience: '10 years', consultationFee: '₹600', rating: '4.8 / 5.0', availableDays: 'Monday - Friday (02:00 PM - 08:00 PM)' },
  { name: 'Dr. Dev Tiwari', specialization: 'General Physician', department: 'General Medicine', experience: '15 years', consultationFee: '₹500', rating: '4.9 / 5.0', availableDays: 'Monday - Sunday (24x7 Coverage)' },
];

const RAG_STOP_WORDS = new Set([
  'give', 'names', 'name', 'what', 'who', 'how', 'tell', 'show', 'please', 'available',
  'which', 'where', 'types', 'type', 'about', 'doctors', 'doctor', 'specialist',
  'specialists', 'specialization', 'specializations', 'hospital', 'hospitals', 'kushal',
  'list', 'find', 'have', 'with', 'from', 'they', 'them', 'their', 'this', 'that', 'there',
  'here', 'need', 'want', 'help', 'can', 'you', 'the', 'and', 'for', 'are', 'any', 'some'
]);

const hospitalAITools = {
  // 1. Search doctors directory
  searchDoctors: async ({ query = '', specialization = '', department = '' }) => {
    let filter = { isActive: true };

    if (specialization && department) {
      filter.$and = [
        { $or: [{ specialization: new RegExp(specialization, 'i') }, { department: new RegExp(specialization, 'i') }] },
        { department: new RegExp(department, 'i') },
      ];
    } else if (specialization) {
      filter.$or = [
        { specialization: new RegExp(specialization, 'i') },
        { department: new RegExp(specialization, 'i') },
      ];
    } else if (department) {
      filter.department = new RegExp(department, 'i');
    }

    let doctors = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        doctors = await Doctor.find(filter)
          .populate('userId', 'name firstName lastName email phone profilePicture')
          .sort({ rating: -1 })
          .limit(10)
          .lean();
      } catch (err) {
        console.warn('MongoDB Doctor.find failed, using verified registry fallback:', err.message);
      }
    }

    // Name-specific filtering if user asked for a specific doctor name
    if (!specialization && query) {
      const cleaned = query
        .toLowerCase()
        .replace(/\b(?:doctor|doctors|dr|give|names?|of|for|in|specialization|specializations|specialist|specialists|who|is|the|are|find|search|show|me|list|available|please|tell|get)\b/gi, '')
        .trim();

      if (cleaned.length >= 2) {
        const regex = new RegExp(cleaned, 'i');
        const nameMatches = doctors.filter((doc) => {
          const name = formatDoctorName(doc);
          const spec = doc.specialization || '';
          const dept = doc.department || '';
          return regex.test(name) || regex.test(spec) || regex.test(dept);
        });
        if (nameMatches.length > 0) {
          doctors = nameMatches;
        }
      }
    }

    // Fallback to verified hospital clinician registry if DB returned 0 records
    if (!doctors || doctors.length === 0) {
      let fallbackList = VERIFIED_HOSPITAL_DOCTORS;
      if (specialization) {
        const specReg = new RegExp(specialization, 'i');
        fallbackList = fallbackList.filter((d) => specReg.test(d.specialization) || specReg.test(d.department));
      } else if (department) {
        const deptReg = new RegExp(department, 'i');
        fallbackList = fallbackList.filter((d) => deptReg.test(d.department));
      }
      return {
        tool: 'searchDoctors',
        count: fallbackList.length,
        doctors: fallbackList.map((d, idx) => ({
          id: `KH-DOC-STATIC-${idx + 1}`,
          name: d.name,
          specialization: d.specialization,
          department: d.department,
          experience: d.experience,
          consultationFee: d.consultationFee,
          rating: d.rating,
          availableDays: d.availableDays,
        })),
      };
    }

    return {
      tool: 'searchDoctors',
      count: doctors.length,
      doctors: doctors.map((doc) => ({
        id: doc._id,
        name: formatDoctorName(doc).startsWith('Dr.') ? formatDoctorName(doc) : `Dr. ${formatDoctorName(doc)}`,
        specialization: doc.specialization || 'Clinical Specialist',
        department: doc.department || 'Outpatient Department',
        experience: doc.experience ? `${doc.experience} years` : (doc.experienceYears ? `${doc.experienceYears} years` : '10+ years'),
        consultationFee: `₹${doc.consultationFee || 600}`,
        rating: doc.rating ? `${doc.rating} / 5.0` : '4.9 / 5.0',
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
    const rawTerms = String(query || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (!rawTerms.length) {
      return { tool: 'searchMedicalKnowledge', count: 0, documents: [] };
    }

    // Filter out conversational stop words to prevent accidental matches with FAQ templates
    const terms = rawTerms.filter((t) => !RAG_STOP_WORDS.has(t));
    const effectiveTerms = terms.length > 0 ? terms : rawTerms;

    const regexArray = effectiveTerms.map((t) => new RegExp(t, 'i'));
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

    let docs = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        docs = await MedicalKnowledge.find(filter).limit(10).lean();
      } catch (err) {
        console.warn('MedicalKnowledge.find error:', err.message);
      }
    }

    // Prioritize documents where the title or symptoms directly match the user query
    docs.sort((a, b) => {
      const aTitleMatch = effectiveTerms.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(a.title));
      const bTitleMatch = effectiveTerms.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(b.title));
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      // Prefer non-faq clinical topics unless category is explicitly faq
      if (category !== 'faq') {
        if (a.category === 'faq' && b.category !== 'faq') return 1;
        if (a.category !== 'faq' && b.category === 'faq') return -1;
      }
      return 0;
    });

    const finalDocs = docs.slice(0, 5);

    return {
      tool: 'searchMedicalKnowledge',
      count: finalDocs.length,
      documents: finalDocs.map((d) => ({
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
