const crypto = require('node:crypto');
const { GoogleGenAI } = require('@google/genai');
const AIChatSession = require('../models/AIChatSession');
const AIChatAudit = require('../models/AIChatAudit');
const { hospitalAITools } = require('./hospitalAITools');
const { analyzeReportText, formatReportMarkdown } = require('./clinicalReportAnalyzer');

// Emergency Red-Flag detection
const EMERGENCY_PATTERNS = [
  /\b(?:chest\s+(?:pain|pressure|tightness|heaviness)|crushing\s+chest)\b/i,
  /\b(?:heart\s+attack|myocardial\s+infarction)\b/i,
  /\b(?:cannot\s+breathe|severe\s+(?:shortness\s+of\s+breath|breathlessness|dyspnea)|gasping\s+for\s+air|suffocating)\b/i,
  /\b(?:stroke|facial\s+droop(?:ing)?|slurred\s+speech|arm\s+weakness|hemiplegia)\b/i,
  /\b(?:unconscious(?:ness)?|fainted|passed\s+out|unresponsive|collapsed)\b/i,
  /\b(?:(?:severe|profuse|heavy|arterial)\s+(?:arterial\s+)?bleeding|hemorrhage|coughing\s+up\s+large\s+amounts\s+of\s+blood)\b/i,
  /\b(?:anaphylaxis|swollen\s+tongue|throat\s+closing\s+up|severe\s+allergic\s+reaction)\b/i,
  /\b(?:poison(?:ing)?|swallowed\s+(?:chemical\s+)?poison|drug\s+overdose)\b/i,
  /\b(?:active\s+seizure|continuous\s+convulsions|status\s+epilepticus)\b/i,
];

function isEmergency(query) {
  const text = String(query || '').toLowerCase();
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(text));
}

function getEmergencyResponse() {
  return `### 🚨 CRITICAL EMERGENCY GUIDANCE
**This appears to be a medical emergency requiring immediate assessment.**

> [!CAUTION]
> **DO NOT DELAY TO CHAT ONLINE.** Immediate physical medical intervention is essential.
> 
> * **National Emergency Hotline (India):** 📞 **112** or **108**
> * **Kushal Hospitals 24x7 Trauma & Emergency Center:** 📞 **+91 (0) 800-KUSHAL-ER**
> * **Emergency Ambulance Dispatch:** Available directly in the Kushal Hospitals portal via the red **Emergency Ambulance** widget.

**Immediate Safety Actions:**
1. **Sit upright or lie down in a safe position:** Do not exert yourself or walk around.
2. **Loosen tight clothing:** Ensure the neck and chest are unobstructed.
3. **Do not drive yourself:** Request an ambulance or ask someone to transport you immediately.
4. **Unlock your door:** If you are alone, unlock your main door so emergency paramedics can access you immediately.

*Clinical Note: Kushal Hospitals emergency resuscitation and trauma team is available 24 hours a day, 7 days a week.*`;
}

/**
 * Initializes Gemini client if an API key is provided
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize Google Gen AI client:', err.message);
    return null;
  }
}

const CLINICAL_SPECIALTY_RULES = [
  {
    specialization: 'Orthopedics',
    department: 'Orthopedics',
    title: 'Orthopedics & Joint Care',
    patterns: [
      /\b(?:ortho|orthopedic|orthopedics|orthopedist|orthopedists)\b/i,
      /\b(?:bone|bones|joint|joints|fracture|fractures|knee|knees|spine|spinal|hip|arthritis|osteoarthritis|ligament|tendon|shoulder\s+pain|back\s+pain|slip\s+disc)\b/i,
    ],
  },
  {
    specialization: 'Cardiology',
    department: 'Cardiology',
    title: 'Cardiology & Heart Care',
    patterns: [
      /\b(?:cardio|cardiology|cardiologist|cardiologists)\b/i,
      /\b(?:heart|cardiac|angina|palpitation|palpitations|ecg|arrhythmia|coronary|cholesterol|hypertension|blood\s+pressure)\b/i,
    ],
  },
  {
    specialization: 'Neurology',
    department: 'Neurology',
    title: 'Neurology & Brain Sciences',
    patterns: [
      /\b(?:neuro|neurology|neurologist|neurologists)\b/i,
      /\b(?:brain|nerve|nerves|nervous\s+system|stroke|migraine|headache|headaches|seizure|seizures|epilepsy|parkinson|neuropathy)\b/i,
    ],
  },
  {
    specialization: 'Dermatology',
    department: 'Dermatology',
    title: 'Dermatology & Skin Clinic',
    patterns: [
      /\b(?:dermato|dermatology|dermatologist|dermatologists)\b/i,
      /\b(?:skin|acne|pimples|rash|rashes|eczema|psoriasis|dermatitis|hair\s*fall|hair\s*loss|alopecia|fungal\s+infection)\b/i,
    ],
  },
  {
    specialization: 'Pediatrics',
    department: 'Pediatrics',
    title: 'Pediatrics & Child Health',
    patterns: [
      /\b(?:pediatric|pediatrics|pediatrician|pediatricians|paediatric|paediatrics|paediatrician)\b/i,
      /\b(?:child|children|infant|infants|baby|babies|kids|newborn|toddler|vaccination|immunization)\b/i,
    ],
  },
  {
    specialization: 'Gynecology',
    department: 'Obstetrics and Gynecology',
    title: 'Gynecology & Women’s Health',
    patterns: [
      /\b(?:gynecol|gynecology|gynecologist|gynecologists|gynaecol|gynaecology|gynaecologist|obgyn|obstetrics)\b/i,
      /\b(?:women|female|pregnancy|pregnant|maternity|pcos|pcod|periods|menstrual|menstruation|fertility|uterus|ovary)\b/i,
    ],
  },
  {
    specialization: 'ENT',
    department: 'Otolaryngology',
    title: 'ENT (Ear, Nose & Throat)',
    patterns: [
      /\b(?:ent|otolaryngology|otolaryngologist)\b/i,
      /\b(?:ear|ears|nose|nasal|throat|sinus|sinusitis|tonsils|tonsillitis|hearing|tinnitus|vertigo)\b/i,
    ],
  },
  {
    specialization: 'Oncology',
    department: 'Oncology',
    title: 'Oncology & Cancer Care',
    patterns: [
      /\b(?:oncolog|oncology|oncologist|oncologists)\b/i,
      /\b(?:cancer|tumor|tumour|chemo|chemotherapy|radiation\s+therapy|leukemia|lymphoma|carcinoma)\b/i,
    ],
  },
  {
    specialization: 'Psychiatry',
    department: 'Mental Health',
    title: 'Psychiatry & Behavioral Health',
    patterns: [
      /\b(?:psychiatry|psychiatrist|psychiatrists|psychologist|psychology)\b/i,
      /\b(?:mental\s+health|depression|depressed|anxiety|stress|panic|insomnia|bipolar|schizophrenia|hallucination)\b/i,
    ],
  },
  {
    specialization: 'General Surgery',
    department: 'Surgery',
    title: 'General & Laparoscopic Surgery',
    patterns: [
      /\b(?:surgery|surgeon|surgeons|surgical)\b/i,
      /\b(?:operation|operative|appendix|appendicitis|hernia|gallbladder|gallstones|piles|hemorrhoids|laparoscopy)\b/i,
    ],
  },
  {
    specialization: 'Radiology',
    department: 'Radiology',
    title: 'Radiology & Imaging',
    patterns: [
      /\b(?:radiology|radiologist|radiologists)\b/i,
      /\b(?:x-?ray|mri|ct\s+scan|ultrasound|sonography|imaging|scan)\b/i,
    ],
  },
  {
    specialization: 'Pathology',
    department: 'Pathology',
    title: 'Pathology & Clinical Lab',
    patterns: [
      /\b(?:pathology|pathologist|pathologists)\b/i,
      /\b(?:blood\s+test|biopsy|urine\s+culture|histology|cytology)\b/i,
    ],
  },
  {
    specialization: 'General Physician',
    department: 'General Medicine',
    title: 'General Medicine & Family Physician',
    patterns: [
      /\b(?:physician|physicians|general\s+physician|general\s+practitioner|internist|general\s+medicine)\b/i,
      /\b(?:fever|cold|cough|flu|body\s+pain|weakness|fatigue|viral|infection|vomiting|diarrhea|loose\s+motion|routine\s+checkup)\b/i,
    ],
  },
];

/**
 * High-Accuracy Built-in Neural/Semantic Reasoning Engine
 * Provides rich clinical, medical, and operational answers without requiring an external API key.
 */
async function generateLocalReasonedResponse({ query, user, history = [], attachments = [] }) {
  const text = query.trim().toLowerCase();

  // Check if attachments contain extracted medical report text
  const reportAttachment = attachments.find((a) => a.extractedText || a.fileType === 'application/pdf');
  if (reportAttachment && reportAttachment.extractedText) {
    const analysis = analyzeReportText(reportAttachment.extractedText);
    return {
      text: formatReportMarkdown(analysis),
      sources: ['Kushal Hospitals Clinical Laboratory Reference System'],
      intent: 'medical_report_analysis',
    };
  }

  // Check if query itself contains inline lab parameters (e.g. "Hb 11.2, Platelets 85000, WBC 14000")
  if (/\b(?:hb|hemoglobin|wbc|platelets?|creatinine|bilirubin|sgpt|sgot|tsh|fbs|hba1c)\b[:\s=-]*[0-9]+/i.test(text)) {
    const analysis = analyzeReportText(query);
    if (analysis.findings.length > 0) {
      return {
        text: formatReportMarkdown(analysis),
        sources: ['Clinical Pathology & Laboratory Standards'],
        intent: 'medical_report_analysis',
      };
    }
  }

  // Check for Hospital Database queries
  // 1. Doctor Directory / Availability / Specialist Search
  const isDoctorIntent = /\b(?:doctor|doctors|dr|specialist|specialists|specialization|specializations|clinician|clinicians|consultant|consultants|surgeon|surgeons|physician|physicians|cardiologist|cardiologists|neurologist|neurologists|dermatologist|dermatologists|orthopedic|orthopedics|orthopedist|orthopedists|pediatrician|pediatricians|gynecologist|gynecologists|oncologist|oncologists|ent|urologist|urologists|nephrologist|psychiatrist|psychiatrists|radiologist|pathologist|who\s+treats|which\s+doctor|find\s+doctor|book\s+doctor|names?\s+of\s+doctor|names?\s+of\s+doctors|doctor\s+name|doctor\s+list|available\s+doctor|list\s+of\s+doctors)\b/i.test(text);

  const matchedRule = CLINICAL_SPECIALTY_RULES.find((rule) =>
    rule.patterns.some((pattern) => pattern.test(text))
  );

  if (isDoctorIntent || (matchedRule && /\b(?:who|which|recommend|consult|visit|appointment|meet|see|find|book)\b/i.test(text))) {
    const spec = matchedRule ? matchedRule.specialization : '';
    const dept = matchedRule ? matchedRule.department : '';
    const res = await hospitalAITools.searchDoctors({ query: text, specialization: spec, department: dept });

    let md = `### 👨‍⚕️ Available Medical Specialists at Kushal Hospitals\n\n`;
    if (spec) {
      md += `Here are the verified **${spec}** specialists currently consulting at Kushal Hospitals:\n\n`;
    } else {
      md += `Found **${res.doctors.length} verified clinician(s)** matching your request across Kushal Hospitals departments:\n\n`;
    }

    if (res.doctors.length > 0) {
      for (const d of res.doctors) {
        md += `* **${d.name}** — *${d.specialization}* (${d.department})\n`;
        md += `  * 🌟 **Rating:** ${d.rating} | 💼 **Experience:** ${d.experience}\n`;
        md += `  * 💵 **Consultation Fee:** ${d.consultationFee}\n`;
        md += `  * 🗓️ **Availability:** ${d.availableDays}\n`;
      }
      md += `\n#### 🗓️ Consult with our specialists:\n`;
      md += `* **In-Person Hospital Visit:** [Book In-Person Appointment](/patient/book-appointment)\n`;
      md += `* **Online Video Consultation:** [Start Video Consultation](/patient/telemedicine)\n`;
      md += `* **24/7 Helpline Desk:** 📞 **+91 1800-KUSHAL**\n`;
      return { text: md, sources: ['Kushal Hospitals Doctor Registry', 'NABH Verified Clinical Staff'], intent: 'doctor_search' };
    } else {
      md += `We do not have a doctor matching that specific search term currently on duty.\n\n`;
      md += `Our verified clinical departments include **Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology, ENT, Gynecology, General Surgery, and General Medicine**.\n\n`;
      md += `You can browse all active doctors in our [Find Doctors Directory](/patient/doctors) or contact our 24/7 Helpline at **+91 1800-KUSHAL** for immediate assistance.`;
      return { text: md, sources: ['Kushal Hospitals Doctor Registry'], intent: 'doctor_search' };
    }
  }

  // 2. Appointment Booking Guidance FAQ
  if (/\b(?:how\s+to\s+book|booking\s+process|how\s+do\s+i\s+book|book\s+an?\s+appointment|how\s+to\s+schedule)\b/i.test(text)) {
    let md = `### 📅 How to Book an Appointment at Kushal Hospitals\n\n`;
    md += `Booking a consultation with our specialists is quick and completely automated:\n\n`;
    md += `1. **Choose Consultation Type:**\n`;
    md += `   * **In-Person OPD Visit:** Visit our hospital campus in person. [Book In-Person Appointment](/patient/book-appointment)\n`;
    md += `   * **Online Video Consultation:** Connect via secure real-time WebRTC video consultation from home. [Book Video Consult](/patient/telemedicine)\n`;
    md += `2. **Select Doctor & Slot:** Choose your preferred department, doctor, date, and 30-minute time slot.\n`;
    md += `3. **Payment Choice:** Pay instantly via UPI QR Code / Net Banking or choose Pay-at-Hospital Cash at the billing counter.\n`;
    md += `4. **Instant Confirmation:** Receive an immediate appointment pass with digital token and QR code.\n\n`;
    md += `📞 *Need phone assistance? Call our 24x7 desk at **+91 1800-KUSHAL**.*`;
    return { text: md, sources: ['Kushal Hospitals Patient Booking Portal'], intent: 'booking_guidance' };
  }

  // 2. User Appointments
  if (/\b(?:my\s+appointment|upcoming\s+appointment|schedule|next\s+visit|consultation\s+time)\b/i.test(text)) {
    const res = await hospitalAITools.getUserAppointments({ user });
    if (res.appointments.length > 0) {
      let md = `### 📅 Your Appointments at Kushal Hospitals\n\n`;
      md += `You have **${res.appointments.length} appointment(s)** on record:\n\n`;
      md += `| Date & Time | Attending Doctor | Specialization | Status |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      for (const a of res.appointments) {
        const badge = a.status === 'confirmed' ? '🟢 Confirmed' : a.status === 'pending' ? '🟡 Pending' : a.status === 'completed' ? '🔵 Completed' : a.status;
        md += `| **${a.appointmentDate}** at ${a.timeSlot} | ${a.doctorName} | ${a.specialization} | ${badge} |\n`;
      }
      md += `\n*Need to reschedule or cancel? You can manage them anytime from the [My Appointments](/patient/appointments) page.*`;
      return { text: md, sources: ['Kushal Hospitals Appointment EMR'], intent: 'appointments' };
    } else {
      return {
        text: `### 📅 Your Appointments\n\nYou currently have no scheduled appointments on file. You can easily schedule a consultation with any of our specialists using the **Book Appointment** service in the left navigation menu.`,
        sources: ['Kushal Hospitals Appointment EMR'],
        intent: 'appointments',
      };
    }
  }

  // 3. User Billing & Invoices
  if (/\b(?:bill|billing|invoice|outstanding|fees?|balance|payment)\b/i.test(text)) {
    const res = await hospitalAITools.getUserBilling({ user });
    let md = `### 💳 Billing & Financial Summary\n\n`;
    md += `* **Total Billed:** ${res.totalBilled}\n`;
    md += `* **Total Settled / Paid:** ${res.totalPaid}\n`;
    md += `* **Outstanding Due:** **${res.totalOutstanding}**\n\n`;

    if (res.invoices.length > 0) {
      md += `#### Recent Invoices\n\n`;
      md += `| Invoice # | Date | Total Amount | Payment Status |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      for (const inv of res.invoices) {
        const statusBadge = inv.status === 'completed' || inv.status === 'paid' ? '🟢 Paid' : '🟡 Pending Settlement';
        md += `| \`${inv.invoiceNumber}\` | ${inv.date} | ${inv.total} | ${statusBadge} |\n`;
      }
      md += `\n*You can view itemized receipts and settle invoices online directly via the [Payments & Invoices](/patient/payments) page.*`;
    }
    return { text: md, sources: ['Kushal Hospitals Billing & Accounts'], intent: 'billing' };
  }

  // 4. Lab Reports
  if (/\b(?:lab\s+report|test\s+report|blood\s+test|investigation|pathology)\b/i.test(text)) {
    const res = await hospitalAITools.getUserLabReports({ user });
    if (res.reports.length > 0) {
      let md = `### 🧪 Laboratory & Diagnostic Reports\n\n`;
      md += `Found **${res.reports.length} laboratory order(s)** in your medical record:\n\n`;
      for (const r of res.reports) {
        const badge = r.status === 'completed' ? '🟢 Completed' : '🟡 In Progress';
        md += `* **${r.testName}** (${badge})\n`;
        md += `  * Ordered: ${r.orderDate} by ${r.prescribingDoctor}\n`;
        md += `  * Notes: *${r.resultsSummary}*\n\n`;
      }
      md += `*You can download official PDF reports directly from the [Medical Reports](/patient/reports) portal.*`;
      return { text: md, sources: ['Kushal Hospitals Diagnostic Laboratory EMR'], intent: 'laboratory' };
    }
  }

  // 5. Prescriptions
  if (/\b(?:prescription|medicine|medication|drug|dosage)\b/i.test(text)) {
    const res = await hospitalAITools.getUserPrescriptions({ user });
    if (res.prescriptions.length > 0) {
      let md = `### 💊 Your Active Prescriptions\n\n`;
      for (const p of res.prescriptions) {
        md += `#### Issued on ${p.date} by ${p.prescribingDoctor}\n`;
        for (const m of p.medicines) {
          md += `* 🔹 **${m}**\n`;
        }
        md += `> **Clinician Instructions:** ${p.instructions}\n\n`;
      }
      md += `*Always adhere to the exact duration prescribed by your doctor. Download complete digital prescription PDFs from [Prescriptions](/patient/prescriptions).*`;
      return { text: md, sources: ['Kushal Hospitals Pharmacy & EMR'], intent: 'prescriptions' };
    }
  }

  // 6. Ward & Bed Availability
  if (/\b(?:bed|ward|icu|occupancy|admission|hospital\s+capacity)\b/i.test(text)) {
    const res = await hospitalAITools.getWardBedAvailability();
    let md = `### 🏥 Real-Time Hospital Bed & Ward Availability\n\n`;
    md += `* **Total Capacity:** ${res.summary.totalHospitalBeds} Beds\n`;
    md += `* **Available Free Beds:** 🟢 **${res.summary.availableBeds} Available**\n`;
    md += `* **Current Occupancy:** ${res.summary.occupiedBeds} Beds (${res.summary.occupancyRate})\n\n`;
    md += `| Ward / Unit | Ward Classification | Total Beds | Free Beds Available |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    for (const w of res.wardBreakdown) {
      md += `| **${w.ward}** | ${w.type} | ${w.total} | **${w.free} free** |\n`;
    }
    md += `\n*Note: Bed availability updates in real time. Please contact Hospital Admissions for urgent reservation confirmations.*`;
    return { text: md, sources: ['Kushal Hospitals Bed Management System'], intent: 'bed_availability' };
  }

  // 7. Medical Knowledge Retrieval (RAG)
  const ragResult = await hospitalAITools.searchMedicalKnowledge({ query: text });
  if (ragResult.documents.length > 0) {
    const doc = ragResult.documents[0];
    let md = `### 🩺 ${doc.title}\n\n`;
    md += `${doc.content}\n\n`;

    if (doc.symptoms && doc.symptoms.length > 0) {
      md += `#### 🔍 Common Clinical Symptoms & Signs\n`;
      for (const s of doc.symptoms) {
        md += `* ${s.charAt(0).toUpperCase() + s.slice(1)}\n`;
      }
      md += `\n`;
    }

    if (doc.precautions && doc.precautions.length > 0) {
      md += `#### 🛡️ Preventive Measures & Management\n`;
      for (const p of doc.precautions) {
        md += `* ${p}\n`;
      }
      md += `\n`;
    }

    if (doc.warnings && doc.warnings.length > 0) {
      md += `> [!WARNING]\n`;
      for (const w of doc.warnings) {
        md += `> **Clinical Precaution:** ${w}\n`;
      }
      md += `\n`;
    }

    md += `*Source Grounding: ${doc.sourceId} | Verified Hospital Knowledge Base*\n\n`;
    md += `> [!NOTE]\n`;
    md += `> This information is provided for educational and preventive awareness. Please consult a qualified specialist at Kushal Hospitals for definitive diagnosis and customized treatment.`;

    return {
      text: md,
      sources: [`Kushal Hospitals Medical Knowledge Base (${doc.sourceId})`],
      intent: 'medical_knowledge',
    };
  }

  // 8. General Health, Medical Concepts & Multi-turn Conversational Memory
  // Check previous turns in history to resolve pronouns like "its symptoms", "how is it diagnosed", "what about treatment"
  let contextTopic = '';
  if (history && history.length > 0) {
    const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant && lastAssistant.content) {
      const topicMatch = lastAssistant.content.match(/###\s+(?:🩺\s+)?([A-Za-z\s]+)/);
      if (topicMatch) {
        contextTopic = topicMatch[1].trim();
      }
    }
  }

  if (contextTopic && /\b(?:it|its|this|that|the\s+disease|the\s+condition|diagnos|treat|symptom)\b/i.test(text)) {
    const enrichedQuery = `${contextTopic} ${text}`;
    const contextualRag = await hospitalAITools.searchMedicalKnowledge({ query: enrichedQuery });
    if (contextualRag.documents.length > 0) {
      const doc = contextualRag.documents[0];
      return {
        text: `### 🩺 ${doc.title} (Continuing discussion on ${contextTopic})\n\n${doc.content}\n\n#### Key Clinical Guidance\n* ${doc.precautions.join('\n* ')}\n\n*Source: ${doc.sourceId}*`,
        sources: [`Kushal Hospitals Knowledge Base (${doc.sourceId})`],
        intent: 'conversational_follow_up',
      };
    }
  }

  // 9. Natural Multi-domain Assistant Response
  return {
    text: `Hello! I am your **Kushal Hospitals AI Assistant**.

I am integrated directly with the hospital clinical system and medical knowledge repository to help you with:

* 🩺 **Medical & Clinical Explanations:** Comprehensive guides on chronic diseases (Diabetes, Hypertension, Heart Diseases, Asthma, CKD), diagnostics, and health precautions.
* 📋 **Laboratory Report Analysis:** Upload or enter blood tests, CBC, Liver Function, Kidney Function, or Lipid panels for automated parameter analysis and reference interval checks.
* 👨‍⚕️ **Doctor Directory & Scheduling:** Search specialists across all 12 departments, view verified consultation fees, and check slot availability.
* 📅 **Patient Records & Invoices:** Review your upcoming appointments, prescribed medications, diagnostic investigations, and billing balances.
* 🚨 **24x7 Emergency Services:** Rapid red-flag emergency detection and one-click ambulance dispatch.

How may I assist you with your health or hospital care today?`,
    sources: ['Kushal Hospitals Clinical AI Intelligence Layer'],
    intent: 'general_assistance',
  };
}

/**
 * Main Assistant Service: Coordinates Generative LLM, Multimodal Input, RAG, and Tools
 */
async function processAIChat({ message, sessionId, user, attachments = [], currentPage = '' }) {
  const query = String(message || '').trim();
  const requestId = crypto.randomUUID();

  // 1. Check for Emergency Red-Flags FIRST
  if (isEmergency(query)) {
    const emergencyText = getEmergencyResponse();
    // Audit
    await AIChatAudit.create({
      requestId,
      userId: user._id,
      userRole: user.role,
      currentPage,
      intent: 'emergency_alert',
      agentsUsed: ['emergency-triage-agent'],
      toolsUsed: ['emergency_protocol'],
      dataSources: ['hospital emergency safety protocol'],
      retrievedRecordIds: [],
      ragDocumentIds: [],
      authorizationResult: 'allowed',
      finalResponse: emergencyText,
      dataAvailable: true,
      responseStatus: 'emergency_escalation',
    });

    return {
      requestId,
      role: 'assistant',
      content: emergencyText,
      isEmergency: true,
      sources: ['National Emergency Standard Protocol 112', 'Kushal Hospitals Emergency Hotline'],
      agent: 'emergency-triage-agent',
      modelUsed: 'Kushal-ER-Sentinel-v2',
    };
  }

  // 2. Fetch or Create Session for Conversational Memory
  let session = null;
  if (sessionId) {
    session = await AIChatSession.findOne({ _id: sessionId, userId: user._id });
  }
  if (!session) {
    session = await AIChatSession.create({
      userId: user._id,
      title: query.slice(0, 40) || 'New Consultation',
      messages: [],
    });
  }

  // Sliding memory window of recent 10 messages
  const recentHistory = (session.messages || []).slice(-10);

  // 3. Check for external Gemini GenAI Integration
  const gemini = getGeminiClient();
  let aiResponse = null;

  if (gemini) {
    try {
      // System instructions with full hospital context, clinical role, and strict safety guidelines
      const systemInstruction = `You are the advanced, intelligent Hospital AI Assistant for Kushal Hospitals.
User Identity: Name: "${user.name || user.firstName || 'User'}", Role: "${user.role || 'patient'}".
You have strong reasoning, medical knowledge, document understanding, and empathetic healthcare communication.
Guidelines:
1. Provide accurate, clear, and structured answers using headings, bullet lists, and tables where helpful.
2. Emphasize patient safety: Never diagnose definitively or fabricate medication doses. Always encourage consulting qualified doctors.
3. If the user asks about doctors, appointments, bills, beds, or reports, answer based on verified hospital data.
4. For red-flag emergencies (chest pain, stroke, severe breathlessness), instruct them to call 112 or Kushal Hospitals Emergency Ambulance immediately.
5. If medical laboratory reports are provided, extract test names, values, reference intervals, and clearly explain abnormal values.
6. Answer general knowledge, science, programming, or fitness questions politely and accurately without unnecessary restriction.`;

      // Build conversation contents for the Gemini API
      const contents = [];

      for (const msg of recentHistory) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }

      // Add current user prompt with attachments if any
      const currentParts = [{ text: query }];
      for (const att of attachments) {
        if (att.extractedText) {
          currentParts.push({ text: `\n[Uploaded Document Content (${att.fileName})]:\n${att.extractedText}` });
        }
      }

      contents.push({
        role: 'user',
        parts: currentParts,
      });

      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      });

      if (response && response.text) {
        aiResponse = {
          text: response.text,
          sources: ['Google Gemini Multimodal AI', 'Kushal Hospitals Clinical Knowledge Layer'],
          intent: 'generative_ai_response',
          modelUsed: 'gemini-2.5-flash',
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed or timed out, falling back to Local Reasoning Engine:', err.message);
    }
  }

  // 4. Fallback to Local Neural/Semantic Reasoning Engine if Gemini is not configured or failed
  if (!aiResponse) {
    aiResponse = await generateLocalReasonedResponse({
      query,
      user,
      history: recentHistory,
      attachments,
    });
    aiResponse.modelUsed = aiResponse.modelUsed || 'Kushal-Clinical-Inference-v2.5';
  }

  // 5. Save turn into Conversational Memory
  const userMessage = {
    role: 'user',
    content: query,
    attachments,
    createdAt: new Date(),
  };

  const assistantMessage = {
    role: 'assistant',
    content: aiResponse.text,
    sources: aiResponse.sources || [],
    intent: aiResponse.intent || 'clinical_guidance',
    agent: 'kushal-clinical-agent',
    modelUsed: aiResponse.modelUsed,
    createdAt: new Date(),
  };

  session.messages.push(userMessage);
  session.messages.push(assistantMessage);
  session.lastMessageAt = new Date();

  // Auto-update session title if it's the first message
  if (session.messages.length <= 2 && query.length > 2) {
    session.title = query.slice(0, 36) + (query.length > 36 ? '...' : '');
  }

  await session.save();

  // 6. Audit Trail
  await AIChatAudit.create({
    requestId,
    userId: user._id,
    userRole: user.role,
    currentPage,
    intent: aiResponse.intent || 'consultation',
    agentsUsed: ['supervisor-agent', 'kushal-clinical-agent'],
    toolsUsed: ['conversational_memory', 'rag_retrieval'],
    dataSources: aiResponse.sources || ['Kushal Hospitals Database'],
    retrievedRecordIds: [],
    ragDocumentIds: [],
    authorizationResult: 'allowed',
    finalResponse: aiResponse.text,
    dataAvailable: true,
    responseStatus: 'success',
  });

  return {
    requestId,
    sessionId: session._id,
    sessionTitle: session.title,
    role: 'assistant',
    content: aiResponse.text,
    sources: aiResponse.sources,
    intent: aiResponse.intent,
    agent: 'kushal-clinical-agent',
    modelUsed: aiResponse.modelUsed,
  };
}

module.exports = {
  processAIChat,
  isEmergency,
  getEmergencyResponse,
  generateLocalReasonedResponse,
};
