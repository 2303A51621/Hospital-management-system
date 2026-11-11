import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Activity,
  Sparkles,
  Mic,
  MicOff,
  Save,
  CheckCircle2,
  User,
  ShieldCheck,
  Calendar,
  Trash2,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { doctorPortalAPI, patientAPI, doctorAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function DoctorConsultationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const appointmentId = searchParams.get('appointmentId');
  const initialPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');

  // Form State
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [symptomsInput, setSymptomsInput] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [preliminaryDiagnosis, setPreliminaryDiagnosis] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [icdCode, setIcdCode] = useState('');

  // Vitals
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [pulseRate, setPulseRate] = useState<number | ''>(72);
  const [temperature, setTemperature] = useState<number | ''>(98.6);
  const [oxygenSaturation, setOxygenSaturation] = useState<number | ''>(98);
  const [respiratoryRate, setRespiratoryRate] = useState<number | ''>(16);
  const [height, setHeight] = useState<number | ''>(170);
  const [weight, setWeight] = useState<number | ''>(68);

  const [physicalExam, setPhysicalExam] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [treatment, setTreatment] = useState('');

  // Follow-up
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  // Referral
  const [referralDoctorId, setReferralDoctorId] = useState('');
  const [referralDepartment, setReferralDepartment] = useState('');
  const [referralReason, setReferralReason] = useState('');

  // Digital Signature
  const [signature, setSignature] = useState('Dr. Authorized Clinician');

  // AI Assistant State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Voice to text
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [saving, setSaving] = useState(false);
  const [pastConsultations, setPastConsultations] = useState<any[]>([]);

  // Calculate BMI
  const bmi = (typeof height === 'number' && typeof weight === 'number' && height > 0)
    ? Number((weight / ((height / 100) * (height / 100))).toFixed(1))
    : null;

  // Load patient list & doctors
  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        const [patRes, docRes] = await Promise.all([
          patientAPI.getAll(1),
          doctorAPI.getAll(1, '', 50),
        ]);
        const patientData = patRes.data.patients || patRes.data.data || [];
        setPatients(patientData);
        setDoctorsList(docRes.data.data || []);

        if (!selectedPatientId && patientData.length > 0) {
          setSelectedPatientId(patientData[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPrerequisites();
  }, []);

  // Load consultations list
  const loadConsultations = async () => {
    try {
      const res = await doctorPortalAPI.getConsultations();
      setPastConsultations(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  // Voice recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0].transcript;
        }
        setClinicalNotes((prev) => `${prev} ${transcript}`.trim());
      };

      recog.onerror = () => setIsRecording(false);
      recog.onend = () => setIsRecording(false);
      recognitionRef.current = recog;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome/Edge or type directly.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast('Voice recording paused');
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success('Listening... speak your clinical notes clearly');
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleAddSymptom = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && symptomsInput.trim()) {
      e.preventDefault();
      if (!symptoms.includes(symptomsInput.trim())) {
        setSymptoms([...symptoms, symptomsInput.trim()]);
      }
      setSymptomsInput('');
    }
  };

  const removeSymptom = (s: string) => {
    setSymptoms(symptoms.filter((item) => item !== s));
  };

  const runAiAssistant = async () => {
    setAiLoading(true);
    setAiPanelOpen(true);
    try {
      const res = await doctorPortalAPI.aiClinicalAssist({
        symptoms,
        notes: `${physicalExam} ${clinicalNotes}`,
        patientId: selectedPatientId,
      });
      setAiSuggestions(res.data.data.suggestions || []);
      setAiSummary(res.data.data.formattedNoteDraft || '');
      toast.success('Clinical suggestions drafted by AI assistant');
    } catch (err: any) {
      toast.error('AI assistant currently unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiNoteDraft = () => {
    if (aiSummary) {
      setClinicalNotes(aiSummary);
      toast.success('AI draft transferred to Clinical Notes');
    }
  };

  const handleSave = async (isComplete = false) => {
    if (!selectedPatientId) {
      toast.error('Please select a patient for this consultation');
      return;
    }

    setSaving(true);
    const payload = {
      _id: consultationId || undefined,
      appointmentId: appointmentId || undefined,
      patientId: selectedPatientId,
      symptoms,
      preliminaryDiagnosis,
      finalDiagnosis,
      icdCode,
      vitalSigns: {
        bloodPressure,
        pulseRate: Number(pulseRate) || undefined,
        temperature: Number(temperature) || undefined,
        oxygenSaturation: Number(oxygenSaturation) || undefined,
        respiratoryRate: Number(respiratoryRate) || undefined,
        height: Number(height) || undefined,
        weight: Number(weight) || undefined,
        bmi,
      },
      physicalExamination: physicalExam,
      clinicalNotes,
      treatmentRecommendations: treatment,
      followUp: {
        isRequired: followUpRequired,
        date: followUpDate ? new Date(followUpDate) : undefined,
        instructions: followUpInstructions,
      },
      referral: referralDoctorId
        ? {
            referredDoctorId: referralDoctorId,
            department: referralDepartment,
            reason: referralReason,
          }
        : undefined,
      digitalSignature: signature,
      voiceDictated: isRecording,
      aiAssisted: aiSuggestions.length > 0,
    };

    try {
      if (isComplete) {
        await doctorPortalAPI.completeConsultation(payload);
        toast.success('Consultation finalized, signed, and saved to patient record');
      } else {
        const res = await doctorPortalAPI.saveConsultationDraft(payload);
        setConsultationId(res.data.data._id);
        toast.success('Consultation draft saved');
      }
      loadConsultations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving consultation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-auto p-4 md:p-7">
          <div className="mx-auto max-w-[1550px] space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Clinical Workflow</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Patient Consultation</h1>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                  Record patient vitals, diagnosis, symptoms, physical examination, voice dictation, and digital sign-off.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={runAiAssistant}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-teal-700 text-white shadow hover:opacity-95 flex items-center gap-1.5 transition"
                >
                  <Sparkles size={14} />
                  AI Clinical Assistant
                </button>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition shadow-sm ${
                    isRecording
                      ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} className="text-rose-500" />}
                  {isRecording ? 'Listening (Stop)' : 'Voice Dictation'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 flex items-center gap-1.5 transition"
                >
                  <Save size={14} />
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 size={14} />
                  Finalize & Sign
                </button>
              </div>
            </div>

            {/* Patient Selector Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 whitespace-nowrap">
                <User size={18} className="text-teal-600" /> Attending Patient:
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full sm:w-80 text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 font-semibold"
              >
                <option value="">-- Select Patient --</option>
                {patients.map((p) => {
                  const u = p.userId || {};
                  return (
                    <option key={p._id} value={p._id}>
                      {u.name || `${u.firstName || ''} ${u.lastName || ''}`} ({p.patientId || 'ID'}) - Blood: {p.bloodGroup || 'N/A'}
                    </option>
                  );
                })}
              </select>

              {selectedPatientId && (
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-xs text-slate-500 font-medium">
                    Total Visits: <strong className="text-teal-700">{pastConsultations.length}</strong>
                  </span>
                  <button
                    onClick={() => navigate(`/doctor/patient-history?patientId=${selectedPatientId}`)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 underline"
                  >
                    View Full History Timeline →
                  </button>
                </div>
              )}
            </div>

            {/* Main Form: 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Symptoms, Vitals & Physical Exam */}
              <div className="lg:col-span-2 space-y-6">
                {/* Vitals Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Activity size={16} className="text-teal-600" /> Patient Vital Signs
                    </h3>
                    {bmi && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        Calculated BMI: {bmi} ({bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : 'Overweight'})
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Blood Pressure (mmHg)</label>
                      <input
                        type="text"
                        value={bloodPressure}
                        onChange={(e) => setBloodPressure(e.target.value)}
                        placeholder="120/80"
                        className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Pulse Rate (bpm)</label>
                      <input
                        type="number"
                        value={pulseRate}
                        onChange={(e) => setPulseRate(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="72"
                        className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Temp (°F)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="98.6"
                        className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">SpO2 (%)</label>
                      <input
                        type="number"
                        value={oxygenSaturation}
                        onChange={(e) => setOxygenSaturation(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="98"
                        className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Resp. Rate (/min)</label>
                      <input
                        type="number"
                        value={respiratoryRate}
                        onChange={(e) => setRespiratoryRate(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="16"
                        className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="170"
                        className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="68"
                        className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Symptoms & Diagnosis Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-1.5">
                    <Stethoscope size={16} className="text-teal-600" /> Symptoms & Clinical Diagnosis
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Presenting Symptoms (Type & press Enter)</label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 min-h-[42px]">
                      {symptoms.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-lg font-medium">
                          {s}
                          <button type="button" onClick={() => removeSymptom(s)} className="text-teal-900 hover:text-rose-600">
                            <Trash2 size={11} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={symptomsInput}
                        onChange={(e) => setSymptomsInput(e.target.value)}
                        onKeyDown={handleAddSymptom}
                        placeholder={symptoms.length === 0 ? "Type symptom and press Enter (e.g. Chest tightness, Fever, Dry cough)..." : "Add more..."}
                        className="flex-1 bg-transparent text-xs outline-none min-w-[140px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Preliminary Assessment / Differential</label>
                      <input
                        type="text"
                        value={preliminaryDiagnosis}
                        onChange={(e) => setPreliminaryDiagnosis(e.target.value)}
                        placeholder="e.g. Acute Bronchitis vs Asthma"
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Final Clinical Diagnosis</label>
                      <input
                        type="text"
                        value={finalDiagnosis}
                        onChange={(e) => setFinalDiagnosis(e.target.value)}
                        placeholder="e.g. Acute Viral Bronchitis"
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ICD-10 Diagnostic Code</label>
                      <input
                        type="text"
                        value={icdCode}
                        onChange={(e) => setIcdCode(e.target.value)}
                        placeholder="e.g. J20.9 / I10"
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Examination Notes & Treatment */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center justify-between">
                    <span>Clinical Examination & Care Plan</span>
                    {isRecording && (
                      <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" /> Dictating...
                      </span>
                    )}
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Physical Examination Findings</label>
                    <textarea
                      rows={3}
                      value={physicalExam}
                      onChange={(e) => setPhysicalExam(e.target.value)}
                      placeholder="e.g. S1 S2 heard, clear breath sounds bilaterally, no pedal edema, abdomen soft and non-tender..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes & Physician Summary</label>
                    <textarea
                      rows={4}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Comprehensive physician notes, disease progression, observations, patient education given..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Treatment Recommendations & Advice</label>
                    <textarea
                      rows={3}
                      value={treatment}
                      onChange={(e) => setTreatment(e.target.value)}
                      placeholder="e.g. Adequate oral hydration, salt restriction, rest for 3 days, review if symptoms worsen..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Follow-up, Referrals, Digital Signature & AI Panel */}
              <div className="space-y-6">
                {/* Follow-up & Referral Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-1.5">
                    <Calendar size={16} className="text-teal-600" /> Follow-up & Referrals
                  </h3>

                  <div className="space-y-3 text-xs">
                    <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={followUpRequired}
                        onChange={(e) => setFollowUpRequired(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      Schedule Clinical Follow-up Visit
                    </label>

                    {followUpRequired && (
                      <div className="space-y-2 p-3 bg-slate-50 rounded-xl border">
                        <input
                          type="date"
                          value={followUpDate}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200"
                        />
                        <input
                          type="text"
                          value={followUpInstructions}
                          onChange={(e) => setFollowUpInstructions(e.target.value)}
                          placeholder="e.g. Bring fasting blood sugar report"
                          className="w-full p-2 text-xs rounded-lg border border-slate-200"
                        />
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <label className="block font-bold text-slate-700 mb-1">Refer to Specialist Doctor</label>
                      <select
                        value={referralDoctorId}
                        onChange={(e) => {
                          const doc = doctorsList.find((d) => d._id === e.target.value);
                          setReferralDoctorId(e.target.value);
                          if (doc) setReferralDepartment(doc.department || doc.specialization);
                        }}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 mb-2"
                      >
                        <option value="">-- No Referral --</option>
                        {doctorsList.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.userId?.name || `Dr. ${d.userId?.firstName || ''} ${d.userId?.lastName || ''}`} ({d.specialization})
                          </option>
                        ))}
                      </select>

                      {referralDoctorId && (
                        <input
                          type="text"
                          value={referralReason}
                          onChange={(e) => setReferralReason(e.target.value)}
                          placeholder="Reason for specialist referral..."
                          className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Digital Signature Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-teal-600" /> Doctor Digital Signature
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Consultation notes and digital records will be cryptographically certified under this name.
                  </p>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold text-teal-900 bg-teal-50/50 rounded-xl border border-teal-200"
                  />
                </div>

                {/* AI Assistant Output Drawer */}
                {aiPanelOpen && (
                  <div className="bg-gradient-to-br from-cyan-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-cyan-800/60 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <Sparkles size={14} /> AI Clinical Support
                      </span>
                      <button onClick={() => setAiPanelOpen(false)} className="text-xs text-slate-400 hover:text-white">
                        Close
                      </button>
                    </div>

                    {aiLoading ? (
                      <p className="text-xs text-cyan-200 animate-pulse">Analyzing symptoms and generating structured notes...</p>
                    ) : (
                      <>
                        <div className="space-y-2 text-xs text-slate-200">
                          <p className="font-bold text-cyan-300">Differentials to Consider:</p>
                          {aiSuggestions.map((s, idx) => (
                            <div key={idx} className="p-2.5 bg-white/10 rounded-xl">
                              <p className="font-bold text-white">{s.provisionalDiagnosis}</p>
                              <p className="text-[11px] text-cyan-200 mt-0.5">Rec. Vitals: {s.recommendedVitals?.join(', ')}</p>
                              <p className="text-[11px] text-slate-300">Rec. Tests: {s.recommendedInvestigations?.join(', ')}</p>
                            </div>
                          ))}
                        </div>

                        {aiSummary && (
                          <div className="pt-2 border-t border-cyan-800/60">
                            <button
                              type="button"
                              onClick={applyAiNoteDraft}
                              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white shadow transition"
                            >
                              Transfer Draft into Clinical Notes
                            </button>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 leading-tight">
                          Note: AI assistance is supportive only. Diagnosis and decisions are reserved exclusively for the physician.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
