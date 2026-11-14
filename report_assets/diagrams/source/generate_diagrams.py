import os
import tempfile
os.environ['MPLCONFIGDIR'] = tempfile.mkdtemp()
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

os.makedirs('report_assets/diagrams', exist_ok=True)
os.makedirs('report_assets/diagrams/source', exist_ok=True)

plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'

# -------------------------------------------------------------
# 1. High-Level Architecture
# -------------------------------------------------------------
def gen_01_architecture():
    fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - High-Level System Architecture", fontsize=18, fontweight='bold', color='#1e3a8a', pad=20)

    # Layers
    layers = [
        ("Presentation Layer (Frontend)", "#eff6ff", "#3b82f6", [
            "React 18 SPA (Vite 7, TypeScript)",
            "Tailwind CSS 3.3 UI Components",
            "Zustand State Store (Auth & Portal)",
            "Axios HTTP Client + Interceptors"
        ], 0.05, 0.72, 0.9, 0.22),
        ("Application & API Gateway Layer (Backend)", "#f0fdf4", "#22c55e", [
            "Express 5.2 REST API Server",
            "JWT Authentication & RBAC Middleware",
            "Clinical Business Logic & Controllers",
            "Intelligent AI Assistant & RAG Engine",
            "Node-Cron Background Tasks & Mailer"
        ], 0.05, 0.40, 0.9, 0.26),
        ("Data Persistence & Storage Layer", "#faf5ff", "#a855f7", [
            "MongoDB Atlas Cluster0 (Mongoose 9.9)",
            "19 Schemas (Patients, Doctors, Appointments, EMR, Billing, Wards)",
            "Audit Trail & AI Conversation Session Storage",
            "Local / Multer File Upload Storage"
        ], 0.05, 0.10, 0.9, 0.24)
    ]

    for title, bg_col, border_col, items, x, y, w, h in layers:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.03",
                                      linewidth=2, edgecolor=border_col, facecolor=bg_col)
        ax.add_patch(rect)
        ax.text(x + 0.02, y + h - 0.04, title, fontsize=13, fontweight='bold', color='#0f172a')
        for i, item in enumerate(items):
            box_x = x + 0.03 + (i % 2) * 0.43
            box_y = y + h - 0.09 - (i // 2) * 0.065
            sub_rect = patches.FancyBboxPatch((box_x, box_y - 0.04), 0.41, 0.055, boxstyle="round,pad=0.01,rounding_size=0.02",
                                              linewidth=1, edgecolor='#cbd5e1', facecolor='#ffffff')
            ax.add_patch(sub_rect)
            ax.text(box_x + 0.02, box_y - 0.015, f"• {item}", fontsize=10, color='#334155', va='center')

    # Arrows
    ax.annotate('', xy=(0.5, 0.67), xytext=(0.5, 0.72),
                arrowprops=dict(arrowstyle="<->", color='#2563eb', lw=2.5))
    ax.text(0.52, 0.69, "HTTPS REST Requests / JWT Bearer", fontsize=10, fontweight='bold', color='#2563eb')

    ax.annotate('', xy=(0.5, 0.35), xytext=(0.5, 0.40),
                arrowprops=dict(arrowstyle="<->", color='#16a34a', lw=2.5))
    ax.text(0.52, 0.37, "Mongoose ODM / MongoDB Wire Protocol", fontsize=10, fontweight='bold', color='#16a34a')

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/01_high_level_architecture.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 2. Use Case Diagram
# -------------------------------------------------------------
def gen_02_use_case():
    fig, ax = plt.subplots(figsize=(14, 9), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - System Use Case Diagram", fontsize=18, fontweight='bold', color='#1e3a8a', pad=20)

    # Boundary
    system_rect = patches.FancyBboxPatch((0.24, 0.05), 0.52, 0.88, boxstyle="round,pad=0.02,rounding_size=0.03",
                                        linewidth=2, edgecolor='#94a3b8', facecolor='#f8fafc', linestyle='--')
    ax.add_patch(system_rect)
    ax.text(0.5, 0.90, "Hospital Management System Boundary", ha='center', fontsize=12, fontweight='bold', color='#475569')

    # Actors
    actors = [
        ("Patient", 0.08, 0.75, "#3b82f6"),
        ("Doctor", 0.08, 0.35, "#10b981"),
        ("Admin / Staff", 0.92, 0.65, "#8b5cf6"),
        ("Nurse", 0.92, 0.25, "#f59e0b")
    ]

    for name, x, y, col in actors:
        circle = patches.Circle((x, y + 0.04), 0.03, color=col)
        ax.add_patch(circle)
        ax.plot([x, x], [y + 0.01, y - 0.04], color=col, lw=2.5)
        ax.plot([x - 0.03, x + 0.03], [y - 0.01, y - 0.01], color=col, lw=2.5)
        ax.plot([x, x - 0.02], [y - 0.04, y - 0.08], color=col, lw=2.5)
        ax.plot([x, x + 0.02], [y - 0.04, y - 0.08], color=col, lw=2.5)
        ax.text(x, y - 0.11, name, ha='center', fontsize=11, fontweight='bold', color='#0f172a')

    # Use cases
    use_cases = [
        ("Register & Login (JWT Auth)", 0.5, 0.82),
        ("Book & Reschedule Appointments", 0.42, 0.73),
        ("View EHR & Lab Reports", 0.40, 0.63),
        ("Consultation Notes & Prescriptions", 0.46, 0.53),
        ("AI Clinical Assistant & Report Analyzer", 0.52, 0.43),
        ("Bed & Ward Occupancy Management", 0.58, 0.33),
        ("Pharmacy Inventory & Dispense", 0.52, 0.23),
        ("Billing & Razorpay Online Payment", 0.48, 0.14),
        ("Emergency Ambulance Dispatch", 0.58, 0.07),
    ]

    for uc, x, y in use_cases:
        ellipse = patches.Ellipse((x, y), 0.28, 0.065, edgecolor='#2563eb', facecolor='#ffffff', lw=1.5)
        ax.add_patch(ellipse)
        ax.text(x, y, uc, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#1e293b')

    # Connections
    # Patient connections
    ax.plot([0.13, 0.36], [0.75, 0.82], color='#3b82f6', lw=1.2)
    ax.plot([0.13, 0.28], [0.75, 0.73], color='#3b82f6', lw=1.2)
    ax.plot([0.13, 0.26], [0.73, 0.63], color='#3b82f6', lw=1.2)
    ax.plot([0.13, 0.38], [0.70, 0.43], color='#3b82f6', lw=1.2)
    ax.plot([0.13, 0.34], [0.68, 0.14], color='#3b82f6', lw=1.2)

    # Doctor connections
    ax.plot([0.13, 0.36], [0.38, 0.82], color='#10b981', lw=1.2)
    ax.plot([0.13, 0.32], [0.35, 0.53], color='#10b981', lw=1.2)
    ax.plot([0.13, 0.26], [0.36, 0.63], color='#10b981', lw=1.2)
    ax.plot([0.13, 0.38], [0.35, 0.43], color='#10b981', lw=1.2)

    # Admin connections
    ax.plot([0.87, 0.64], [0.65, 0.82], color='#8b5cf6', lw=1.2)
    ax.plot([0.87, 0.56], [0.65, 0.73], color='#8b5cf6', lw=1.2)
    ax.plot([0.87, 0.72], [0.63, 0.33], color='#8b5cf6', lw=1.2)
    ax.plot([0.87, 0.66], [0.62, 0.23], color='#8b5cf6', lw=1.2)
    ax.plot([0.87, 0.62], [0.61, 0.14], color='#8b5cf6', lw=1.2)
    ax.plot([0.87, 0.72], [0.60, 0.07], color='#8b5cf6', lw=1.2)

    # Nurse connections
    ax.plot([0.87, 0.72], [0.26, 0.33], color='#f59e0b', lw=1.2)
    ax.plot([0.87, 0.66], [0.25, 0.23], color='#f59e0b', lw=1.2)
    ax.plot([0.87, 0.54], [0.27, 0.63], color='#f59e0b', lw=1.2)

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/02_use_case_diagram.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 3. DFD Level 0 (Context Diagram)
# -------------------------------------------------------------
def gen_03_dfd_0():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - Data Flow Diagram (DFD Level 0: Context)", fontsize=18, fontweight='bold', color='#1e3a8a', pad=20)

    # Central Process
    circ = patches.Circle((0.5, 0.5), 0.15, edgecolor='#1e40af', facecolor='#dbeafe', lw=2.5)
    ax.add_patch(circ)
    ax.text(0.5, 0.53, "0.0", ha='center', fontsize=14, fontweight='bold', color='#1e40af')
    ax.text(0.5, 0.48, "Kushal Hospitals\nManagement\nSystem", ha='center', va='center', fontsize=11, fontweight='bold', color='#0f172a')

    # External Entities
    entities = [
        ("Patient", 0.12, 0.75, "#f1f5f9"),
        ("Doctor", 0.12, 0.25, "#f1f5f9"),
        ("Hospital Staff\n& Admin", 0.88, 0.75, "#f1f5f9"),
        ("Payment Gateway\n(Razorpay)", 0.88, 0.25, "#f1f5f9"),
        ("AI Knowledge Base\n& LLM API", 0.5, 0.12, "#f1f5f9"),
    ]

    for name, x, y, bg in entities:
        rect = patches.FancyBboxPatch((x - 0.08, y - 0.05), 0.16, 0.1, boxstyle="square,pad=0",
                                      edgecolor='#334155', facecolor=bg, lw=2)
        ax.add_patch(rect)
        ax.text(x, y, name, ha='center', va='center', fontsize=10, fontweight='bold', color='#0f172a')

    # Data flows
    # Patient flows
    ax.annotate("Appointment Request,\nMedical Queries", xy=(0.38, 0.58), xytext=(0.20, 0.75),
                arrowprops=dict(arrowstyle="->", color='#2563eb', lw=1.5), fontsize=8.5, color='#1e293b')
    ax.annotate("Confirmation, Prescriptions,\nAI Guidance, Invoices", xy=(0.18, 0.70), xytext=(0.36, 0.52),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5), fontsize=8.5, color='#1e293b')

    # Doctor flows
    ax.annotate("Availability, Diagnosis,\nRx & Consultation Notes", xy=(0.38, 0.42), xytext=(0.20, 0.28),
                arrowprops=dict(arrowstyle="->", color='#2563eb', lw=1.5), fontsize=8.5, color='#1e293b')
    ax.annotate("Patient Records,\nAppointment Schedule", xy=(0.18, 0.22), xytext=(0.36, 0.38),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5), fontsize=8.5, color='#1e293b')

    # Staff flows
    ax.annotate("Ward Allocations,\nPharmacy & Billing Data", xy=(0.62, 0.58), xytext=(0.75, 0.73),
                arrowprops=dict(arrowstyle="->", color='#2563eb', lw=1.5), fontsize=8.5, color='#1e293b')
    ax.annotate("Operations Analytics,\nInventory Alerts", xy=(0.78, 0.78), xytext=(0.64, 0.64),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5), fontsize=8.5, color='#1e293b')

    # Razorpay flows
    ax.annotate("Order Creation & Verification", xy=(0.78, 0.28), xytext=(0.62, 0.42),
                arrowprops=dict(arrowstyle="->", color='#2563eb', lw=1.5), fontsize=8.5, color='#1e293b')
    ax.annotate("Payment Webhook & Status", xy=(0.62, 0.38), xytext=(0.75, 0.22),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5), fontsize=8.5, color='#1e293b')

    # LLM flows
    ax.annotate("Prompt Context & RAG Chunks", xy=(0.52, 0.18), xytext=(0.52, 0.35),
                arrowprops=dict(arrowstyle="->", color='#2563eb', lw=1.5), fontsize=8.5, color='#1e293b')
    ax.annotate("Generated Clinical Answers", xy=(0.48, 0.35), xytext=(0.48, 0.18),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5), fontsize=8.5, color='#1e293b')

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/03_dfd_level_0.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 4. DFD Level 1
# -------------------------------------------------------------
def gen_04_dfd_1():
    fig, ax = plt.subplots(figsize=(15, 9), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - Data Flow Diagram (DFD Level 1)", fontsize=18, fontweight='bold', color='#1e3a8a', pad=20)

    # Processes
    procs = [
        ("1.0\nAuth & RBAC", 0.18, 0.75),
        ("2.0\nAppointments", 0.42, 0.75),
        ("3.0\nConsultations", 0.66, 0.75),
        ("4.0\nWard & Beds", 0.88, 0.75),
        ("5.0\nAI Assistant", 0.28, 0.30),
        ("6.0\nBilling & Pay", 0.58, 0.30),
        ("7.0\nPharmacy", 0.88, 0.30)
    ]

    for label, x, y in procs:
        circ = patches.Circle((x, y), 0.065, edgecolor='#1d4ed8', facecolor='#eff6ff', lw=2)
        ax.add_patch(circ)
        ax.text(x, y, label, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#0f172a')

    # Data Stores
    stores = [
        ("D1: Users & Profiles", 0.18, 0.52),
        ("D2: Appointments & Slots", 0.42, 0.52),
        ("D3: EMR & Prescriptions", 0.66, 0.52),
        ("D4: Wards & Bed Status", 0.88, 0.52),
        ("D5: Medical Knowledge & Vectors", 0.28, 0.12),
        ("D6: Billing & Transactions", 0.58, 0.12),
        ("D7: Medicine Inventory", 0.88, 0.12)
    ]

    for label, x, y in stores:
        # Open ended rectangle for DFD data store
        ax.plot([x - 0.08, x + 0.08], [y + 0.025, y + 0.025], color='#475569', lw=2)
        ax.plot([x - 0.08, x + 0.08], [y - 0.025, y - 0.025], color='#475569', lw=2)
        ax.plot([x - 0.08, x - 0.08], [y - 0.025, y + 0.025], color='#475569', lw=2)
        ax.fill_between([x - 0.08, x + 0.08], [y - 0.025, y - 0.025], [y + 0.025, y + 0.025], color='#f8fafc')
        ax.text(x, y, label, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#1e293b')

    # Arrows between processes and data stores
    links = [
        ((0.18, 0.68), (0.18, 0.55)),
        ((0.42, 0.68), (0.42, 0.55)),
        ((0.66, 0.68), (0.66, 0.55)),
        ((0.88, 0.68), (0.88, 0.55)),
        ((0.28, 0.23), (0.28, 0.15)),
        ((0.58, 0.23), (0.58, 0.15)),
        ((0.88, 0.23), (0.88, 0.15)),
    ]

    for p1, p2 in links:
        ax.annotate('', xy=p2, xytext=p1, arrowprops=dict(arrowstyle="<->", color='#0284c7', lw=1.8))

    # Cross process arrows
    ax.annotate('Confirmed booking', xy=(0.58, 0.37), xytext=(0.42, 0.68),
                arrowprops=dict(arrowstyle="->", color='#16a34a', lw=1.5, connectionstyle="arc3,rad=-0.2"), fontsize=8, color='#166534')
    ax.annotate('Prescription items', xy=(0.88, 0.37), xytext=(0.66, 0.68),
                arrowprops=dict(arrowstyle="->", color='#16a34a', lw=1.5, connectionstyle="arc3,rad=-0.2"), fontsize=8, color='#166534')
    ax.annotate('Clinical context check', xy=(0.34, 0.32), xytext=(0.40, 0.49),
                arrowprops=dict(arrowstyle="->", color='#7c3aed', lw=1.5, connectionstyle="arc3,rad=0.2"), fontsize=8, color='#6b21a8')

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/04_dfd_level_1.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 5. Entity Relationship (ER) Diagram
# -------------------------------------------------------------
def gen_05_er():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - Entity Relationship (ER) Diagram", fontsize=18, fontweight='bold', color='#1e3a8a', pad=20)

    entities = [
        ("USER", 0.50, 0.85, ["_id (PK)", "email, password", "role, phone", "isVerified"]),
        ("PATIENT", 0.22, 0.65, ["_id (PK)", "userId (FK)", "patientId", "bloodGroup, allergies"]),
        ("DOCTOR", 0.78, 0.65, ["_id (PK)", "userId (FK)", "specialization", "consultationFee", "availableSlots"]),
        ("APPOINTMENT", 0.50, 0.50, ["_id (PK)", "patientId (FK)", "doctorId (FK)", "appointmentDate, timeSlot", "status, paymentStatus"]),
        ("CONSULTATION", 0.22, 0.30, ["_id (PK)", "appointmentId (FK)", "diagnosis", "clinicalNotes", "vitalSigns"]),
        ("PRESCRIPTION", 0.22, 0.10, ["_id (PK)", "consultationId (FK)", "medicines[]", "instructions"]),
        ("BILLING", 0.78, 0.30, ["_id (PK)", "patientId (FK)", "appointmentId (FK)", "amount, paymentStatus", "razorpayPaymentId"]),
        ("WARD / BED", 0.50, 0.10, ["_id (PK)", "wardName, wardType", "bedNumber", "status (available/occupied)"]),
    ]

    for name, x, y, fields in entities:
        w, h = 0.20, 0.035 * (len(fields) + 1.2)
        rect = patches.FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.01,rounding_size=0.02",
                                      edgecolor='#2563eb', facecolor='#f8fafc', lw=1.8)
        ax.add_patch(rect)
        header = patches.FancyBboxPatch((x - w/2, y + h/2 - 0.035), w, 0.035, boxstyle="round,pad=0.005,rounding_size=0.01",
                                        edgecolor='#1d4ed8', facecolor='#1d4ed8', lw=1)
        ax.add_patch(header)
        ax.text(x, y + h/2 - 0.018, name, ha='center', va='center', fontsize=10, fontweight='bold', color='#ffffff')
        for i, f in enumerate(fields):
            ax.text(x - w/2 + 0.015, y + h/2 - 0.055 - i * 0.028, f"• {f}", fontsize=8, color='#334155')

    # Relationships
    def draw_rel(p1, p2, label1, label2):
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color='#64748b', lw=1.5)
        ax.text(p1[0], p1[1], label1, fontsize=8, fontweight='bold', color='#0f172a')
        ax.text(p2[0], p2[1], label2, fontsize=8, fontweight='bold', color='#0f172a')

    # User -> Patient (1:1)
    draw_rel((0.42, 0.82), (0.28, 0.72), "1", "1")
    # User -> Doctor (1:1)
    draw_rel((0.58, 0.82), (0.72, 0.72), "1", "1")
    # Patient -> Appointment (1:N)
    draw_rel((0.28, 0.58), (0.42, 0.52), "1", "N")
    # Doctor -> Appointment (1:N)
    draw_rel((0.72, 0.58), (0.58, 0.52), "1", "N")
    # Appointment -> Consultation (1:1)
    draw_rel((0.42, 0.46), (0.28, 0.36), "1", "1")
    # Consultation -> Prescription (1:1)
    draw_rel((0.22, 0.22), (0.22, 0.16), "1", "1")
    # Appointment -> Billing (1:1)
    draw_rel((0.58, 0.46), (0.72, 0.36), "1", "1")
    # Patient -> Ward/Bed (1:N)
    draw_rel((0.42, 0.44), (0.45, 0.15), "N", "1")

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/05_er_diagram.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 6. Sequence Diagram: Authentication
# -------------------------------------------------------------
def gen_06_seq_auth():
    fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - Sequence Diagram: User Login & Role-Based Authentication", fontsize=16, fontweight='bold', color='#1e3a8a', pad=20)

    lifelines = [
        ("User / Client", 0.15),
        ("React UI (Frontend)", 0.38),
        ("Auth Controller (Express)", 0.62),
        ("MongoDB Atlas", 0.85)
    ]

    for name, x in lifelines:
        box = patches.FancyBboxPatch((x - 0.1, 0.88), 0.2, 0.05, boxstyle="round,pad=0.01,rounding_size=0.01",
                                     edgecolor='#2563eb', facecolor='#eff6ff', lw=1.5)
        ax.add_patch(box)
        ax.text(x, 0.905, name, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#1e3a8a')
        ax.plot([x, x], [0.88, 0.08], color='#cbd5e1', linestyle='--', lw=1.5)

    steps = [
        (0.80, 0.15, 0.38, "1. Enters email & password, clicks 'Sign In'", '#2563eb', True),
        (0.72, 0.38, 0.62, "2. POST /api/auth/login { email, password }", '#2563eb', True),
        (0.64, 0.62, 0.85, "3. User.findOne({ email }).select('+password')", '#0284c7', True),
        (0.56, 0.85, 0.62, "4. Return user document with hashed password", '#059669', False),
        (0.48, 0.62, 0.62, "5. bcrypt.compare(password, user.password)", '#7c3aed', 'self'),
        (0.40, 0.62, 0.62, "6. jwt.sign({ id, role }, JWT_SECRET, 30d)", '#7c3aed', 'self'),
        (0.32, 0.62, 0.38, "7. 200 OK + { success: true, token, user }", '#059669', False),
        (0.24, 0.38, 0.38, "8. Zustand store token & role in localStorage", '#7c3aed', 'self'),
        (0.16, 0.38, 0.15, "9. Redirect to role dashboard (/admin, /doctor, /patient)", '#2563eb', False),
    ]

    for y, x1, x2, msg, col, is_forward in steps:
        if is_forward == 'self':
            ax.annotate('', xy=(x1, y - 0.03), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", color=col, lw=1.5, connectionstyle="arc3,rad=-1.2"))
            ax.text(x1 + 0.02, y - 0.015, msg, fontsize=8.5, fontweight='bold', color='#1e293b')
        else:
            ls = "-" if is_forward else "--"
            ax.annotate('', xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", linestyle=ls, color=col, lw=1.5))
            ax.text((x1 + x2)/2, y + 0.015, msg, ha='center', fontsize=8.5, fontweight='bold', color='#1e293b')

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/06_sequence_login_auth.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 7. Sequence Diagram: Appointment Booking
# -------------------------------------------------------------
def gen_07_seq_booking():
    fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - Sequence Diagram: Patient Appointment Booking Workflow", fontsize=16, fontweight='bold', color='#1e3a8a', pad=20)

    lifelines = [
        ("Patient Portal", 0.15),
        ("Appointment API", 0.40),
        ("Doctor Availability", 0.65),
        ("Billing / Database", 0.90)
    ]

    for name, x in lifelines:
        box = patches.FancyBboxPatch((x - 0.1, 0.88), 0.2, 0.05, boxstyle="round,pad=0.01,rounding_size=0.01",
                                     edgecolor='#16a34a', facecolor='#f0fdf4', lw=1.5)
        ax.add_patch(box)
        ax.text(x, 0.905, name, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#166534')
        ax.plot([x, x], [0.88, 0.08], color='#cbd5e1', linestyle='--', lw=1.5)

    steps = [
        (0.80, 0.15, 0.40, "1. Select Doctor, Date, Time Slot & Symptoms", '#2563eb', True),
        (0.72, 0.40, 0.65, "2. Verify Doctor Schedule & Slot Availability", '#0284c7', True),
        (0.64, 0.65, 0.40, "3. Slot available (24/7 or active schedule)", '#059669', False),
        (0.56, 0.40, 0.90, "4. Save Appointment document (Status: Confirmed)", '#2563eb', True),
        (0.48, 0.90, 0.40, "5. Appointment created (_id, appointmentId)", '#059669', False),
        (0.40, 0.40, 0.90, "6. Auto-generate Billing invoice for consultationFee", '#2563eb', True),
        (0.32, 0.90, 0.40, "7. Invoice created (Status: pending)", '#059669', False),
        (0.24, 0.40, 0.15, "8. Return 201 Created + Appointment Details", '#059669', False),
        (0.16, 0.15, 0.15, "9. Render Booking Confirmation Modal with Checkmark", '#7c3aed', 'self'),
    ]

    for y, x1, x2, msg, col, is_forward in steps:
        if is_forward == 'self':
            ax.annotate('', xy=(x1, y - 0.03), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", color=col, lw=1.5, connectionstyle="arc3,rad=-1.2"))
            ax.text(x1 + 0.02, y - 0.015, msg, fontsize=8.5, fontweight='bold', color='#1e293b')
        else:
            ls = "-" if is_forward else "--"
            ax.annotate('', xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", linestyle=ls, color=col, lw=1.5))
            ax.text((x1 + x2)/2, y + 0.015, msg, ha='center', fontsize=8.5, fontweight='bold', color='#1e293b')

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/07_sequence_appointment_booking.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 8. Sequence Diagram: AI Clinical Assistant RAG & Tool Workflow
# -------------------------------------------------------------
def gen_08_seq_ai_rag():
    fig, ax = plt.subplots(figsize=(15, 8.5), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - Sequence Diagram: Intelligent AI Assistant RAG & Tool Workflow", fontsize=16, fontweight='bold', color='#1e3a8a', pad=20)

    lifelines = [
        ("User (Patient/Doc)", 0.12),
        ("AI Chat Controller", 0.34),
        ("Emergency Triage", 0.54),
        ("RAG Engine / Vector DB", 0.74),
        ("Gemini 2.5 LLM", 0.92)
    ]

    for name, x in lifelines:
        box = patches.FancyBboxPatch((x - 0.09, 0.88), 0.18, 0.05, boxstyle="round,pad=0.01,rounding_size=0.01",
                                     edgecolor='#9333ea', facecolor='#faf5ff', lw=1.5)
        ax.add_patch(box)
        ax.text(x, 0.905, name, ha='center', va='center', fontsize=9, fontweight='bold', color='#6b21a8')
        ax.plot([x, x], [0.88, 0.08], color='#cbd5e1', linestyle='--', lw=1.5)

    steps = [
        (0.80, 0.12, 0.34, "1. POST /api/ai-chat/message { message, reportText }", '#2563eb', True),
        (0.72, 0.34, 0.54, "2. Check Emergency Red-Flags (Heart attack, Stroke, etc.)", '#dc2626', True),
        (0.64, 0.54, 0.34, "3. Red-flag check passed (No immediate life-threat)", '#059669', False),
        (0.56, 0.34, 0.74, "4. Retrieve Medical Knowledge Chunks & DB Tools", '#0284c7', True),
        (0.48, 0.74, 0.34, "5. Return Top-3 Grounded Knowledge Chunks + Doctor Data", '#059669', False),
        (0.40, 0.34, 0.92, "6. Generate Structured Response (RAG Prompt + Context)", '#7c3aed', True),
        (0.32, 0.92, 0.34, "7. Stream / Return formatted reply with citations", '#059669', False),
        (0.24, 0.34, 0.34, "8. Append Clinical Disclaimer & Log to AIChatAudit", '#7c3aed', 'self'),
        (0.16, 0.34, 0.12, "9. Return 200 OK { success: true, response, sources }", '#059669', False),
    ]

    for y, x1, x2, msg, col, is_forward in steps:
        if is_forward == 'self':
            ax.annotate('', xy=(x1, y - 0.03), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", color=col, lw=1.5, connectionstyle="arc3,rad=-1.2"))
            ax.text(x1 + 0.02, y - 0.015, msg, fontsize=8.5, fontweight='bold', color='#1e293b')
        else:
            ls = "-" if is_forward else "--"
            ax.annotate('', xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", linestyle=ls, color=col, lw=1.5))
            ax.text((x1 + x2)/2, y + 0.015, msg, ha='center', fontsize=8.5, fontweight='bold', color='#1e293b')

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/08_sequence_ai_rag_tool_workflow.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 9. Module Decomposition
# -------------------------------------------------------------
def gen_09_module_decomp():
    fig, ax = plt.subplots(figsize=(15, 9), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - Subsystem & Module Decomposition", fontsize=18, fontweight='bold', color='#1e3a8a', pad=20)

    # Core Root
    root = patches.FancyBboxPatch((0.35, 0.86), 0.30, 0.08, boxstyle="round,pad=0.01,rounding_size=0.02",
                                 edgecolor='#1e40af', facecolor='#dbeafe', lw=2)
    ax.add_patch(root)
    ax.text(0.5, 0.90, "Kushal Hospitals System", ha='center', va='center', fontsize=13, fontweight='bold', color='#1e3a8a')

    # 4 Main Pillars
    pillars = [
        ("Clinical & Patient Portal", 0.14, 0.70, "#eff6ff", "#3b82f6", [
            "Patient Profile & History",
            "Doctor Search & Booking",
            "Medical Records & EMR",
            "Prescriptions & Downloads",
            "Payments & Invoicing"
        ]),
        ("Doctor & Care Delivery", 0.38, 0.70, "#f0fdf4", "#22c55e", [
            "Doctor Daily Schedule",
            "Consultation Encounter",
            "Digital Rx Generation",
            "Lab Investigation Orders",
            "Patient EMR Timeline"
        ]),
        ("Hospital Operations", 0.62, 0.70, "#faf5ff", "#a855f7", [
            "Wards & Bed Allocation",
            "Pharmacy & Drug Inventory",
            "Emergency & Ambulance Dispatch",
            "Staff & Nurse Duty Roster",
            "Financial Revenue Analytics"
        ]),
        ("Intelligent AI Engine", 0.86, 0.70, "#fff7ed", "#f97316", [
            "RAG Medical Knowledge Base",
            "Clinical Lab Report Analyzer",
            "Emergency Red-Flag Guardrails",
            "Hospital Real-Time DB Tools",
            "Conversational Memory & Audit"
        ])
    ]

    for title, x, y, bg, border, subs in pillars:
        rect = patches.FancyBboxPatch((x - 0.11, y - 0.45), 0.22, 0.45, boxstyle="round,pad=0.01,rounding_size=0.02",
                                      edgecolor=border, facecolor=bg, lw=1.8)
        ax.add_patch(rect)
        ax.text(x, y - 0.03, title, ha='center', va='center', fontsize=10.5, fontweight='bold', color='#0f172a')
        ax.plot([x - 0.1, x + 0.1], [y - 0.06, y - 0.06], color=border, lw=1)
        for i, s in enumerate(subs):
            sub_rect = patches.FancyBboxPatch((x - 0.10, y - 0.12 - i * 0.065), 0.20, 0.05,
                                              boxstyle="round,pad=0.005,rounding_size=0.01",
                                              edgecolor='#cbd5e1', facecolor='#ffffff', lw=1)
            ax.add_patch(sub_rect)
            ax.text(x, y - 0.095 - i * 0.065, s, ha='center', va='center', fontsize=8.5, color='#334155')

        # Link from root
        ax.plot([0.5, x], [0.86, y + 0.02], color='#94a3b8', lw=1.5)

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/09_module_decomposition.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 10. Deployment Diagram
# -------------------------------------------------------------
def gen_10_deployment():
    fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.axis('off')

    plt.title("Kushal Hospitals - Cloud & Local Deployment Architecture", fontsize=18, fontweight='bold', color='#1e3a8a', pad=20)

    nodes = [
        ("Client Devices / Browser", 0.06, 0.25, 0.24, 0.55, "#f8fafc", "#64748b", [
            "Desktop / Laptop Web Browsers",
            "Mobile Responsive Viewports",
            "HTTP/2 + TLS 1.3 Encryption",
            "React Static Bundles (HTML/JS/CSS)"
        ]),
        ("Application Server (Render / Node.js)", 0.38, 0.25, 0.26, 0.55, "#eff6ff", "#3b82f6", [
            "Linux Container (Ubuntu / Node 22)",
            "Express 5 API Server (Port 5000)",
            "Vite Production Build Static Server",
            "Environment Variables (.env)",
            "CORS & Security Middleware"
        ]),
        ("Cloud Services & Databases", 0.72, 0.15, 0.24, 0.72, "#f0fdf4", "#22c55e", [
            "MongoDB Atlas Cluster0 (AWS Mumbai)",
            "Mongoose Replica Set Connection",
            "Google Gemini API (Generative AI)",
            "Razorpay Payment Gateway (Test/Live)",
            "Nodemailer SMTP Mail Service"
        ])
    ]

    for title, x, y, w, h, bg, border, items in nodes:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.02",
                                      edgecolor=border, facecolor=bg, lw=2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.05, title, ha='center', va='center', fontsize=11, fontweight='bold', color='#0f172a')
        for i, it in enumerate(items):
            box_y = y + h - 0.12 - i * 0.09
            sub = patches.FancyBboxPatch((x + 0.015, box_y), w - 0.03, 0.07, boxstyle="round,pad=0.01,rounding_size=0.01",
                                         edgecolor='#cbd5e1', facecolor='#ffffff', lw=1)
            ax.add_patch(sub)
            ax.text(x + w/2, box_y + 0.035, it, ha='center', va='center', fontsize=8.5, color='#334155')

    # Connections
    ax.annotate('', xy=(0.38, 0.52), xytext=(0.30, 0.52),
                arrowprops=dict(arrowstyle="<->", color='#2563eb', lw=2.5))
    ax.text(0.34, 0.55, "HTTPS / REST", ha='center', fontsize=8.5, fontweight='bold', color='#2563eb')

    ax.annotate('', xy=(0.72, 0.52), xytext=(0.64, 0.52),
                arrowprops=dict(arrowstyle="<->", color='#16a34a', lw=2.5))
    ax.text(0.68, 0.55, "TLS / API Calls", ha='center', fontsize=8.5, fontweight='bold', color='#16a34a')

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/10_deployment_diagram.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 11. Project Timeline Gantt Chart
# -------------------------------------------------------------
def gen_11_gantt():
    fig, ax = plt.subplots(figsize=(14, 7), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    plt.title("Kushal Hospitals - Project Engineering Timeline & Milestones", fontsize=16, fontweight='bold', color='#1e3a8a', pad=20)

    phases = [
        "1. Requirements Analysis & Domain Study",
        "2. Database Schema & Architecture Design",
        "3. Core REST API & Authentication Implementation",
        "4. Frontend UI/UX & Tailwind Component Library",
        "5. Patient Portal & Booking Engine",
        "6. Doctor Portal, EMR & Consultation Workflow",
        "7. Hospital Operations (Wards, Pharmacy, Billing)",
        "8. Intelligent AI Assistant & RAG Implementation",
        "9. System Integration & Automated Quality Testing",
        "10. Cloud Deployment (Render/Atlas) & Final Report"
    ]

    starts = [1, 3, 5, 8, 12, 16, 20, 24, 28, 31]
    durations = [3, 3, 5, 6, 6, 6, 5, 5, 4, 3]
    colors = ['#3b82f6', '#0284c7', '#0d9488', '#16a34a', '#84cc16', '#eab308', '#f97316', '#9333ea', '#ec4899', '#64748b']

    y_pos = np.arange(len(phases))

    for i in range(len(phases)):
        ax.barh(y_pos[i], durations[i], left=starts[i], height=0.55, align='center', color=colors[i], edgecolor='#334155', lw=1)
        ax.text(starts[i] + durations[i] / 2, y_pos[i], f"{durations[i]} wks", ha='center', va='center', color='#ffffff', fontsize=9, fontweight='bold')

    ax.set_yticks(y_pos)
    ax.set_yticklabels(phases, fontsize=10, fontweight='bold', color='#1e293b')
    ax.invert_yaxis()
    ax.set_xlabel("Project Timeline (Weeks / Sprints)", fontsize=11, fontweight='bold', color='#1e3a8a')
    ax.set_xlim(0, 36)
    ax.grid(axis='x', linestyle='--', alpha=0.5)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/11_project_timeline_gantt.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# 12. Test Results Chart
# -------------------------------------------------------------
def gen_12_test_chart():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=300)
    fig.patch.set_facecolor('#ffffff')

    fig.suptitle("Kushal Hospitals - Automated Verification & Test Results", fontsize=16, fontweight='bold', color='#1e3a8a')

    # Bar chart of test modules
    modules = [
        "AI Emergency\nRed-Flags",
        "Lab Report\nAnalyzer",
        "RAG Medical\nRetrieval",
        "Database\nTools",
        "Safety &\nGuardrails",
        "Backend REST\nEndpoints"
    ]
    counts = [8, 12, 20, 4, 4, 16]

    y_pos = np.arange(len(modules))
    bars = ax1.bar(y_pos, counts, color='#10b981', edgecolor='#047857', width=0.55)
    for bar in bars:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2, yval + 0.4, f"{yval} Passed\n(100%)", ha='center', va='bottom', fontsize=8.5, fontweight='bold', color='#065f46')

    ax1.set_xticks(y_pos)
    ax1.set_xticklabels(modules, fontsize=9, fontweight='bold', color='#1e293b')
    ax1.set_ylabel("Number of Verified Test Cases", fontsize=10, fontweight='bold', color='#1e3a8a')
    ax1.set_ylim(0, 25)
    ax1.set_title("Test Cases Passed Per Subsystem (Total = 64)", fontsize=12, fontweight='bold', pad=15)
    ax1.grid(axis='y', linestyle='--', alpha=0.5)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)

    # Donut chart
    ax2.pie([64, 0], labels=["Passed (64 / 100%)", "Failed (0 / 0%)"],
            colors=['#10b981', '#ef4444'], autopct='%1.0f%%', startangle=90,
            textprops={'fontsize': 11, 'fontweight': 'bold'}, pctdistance=0.75,
            wedgeprops=dict(width=0.4, edgecolor='white', lw=2))
    ax2.set_title("Overall Test Suite Pass Rate", fontsize=12, fontweight='bold', pad=15)

    plt.tight_layout()
    plt.savefig('report_assets/diagrams/12_test_results_chart.png', dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.close()

# -------------------------------------------------------------
# Generate Source MMD files
# -------------------------------------------------------------
def write_mmd_sources():
    sources = {
        "01_high_level_architecture.mmd": """graph TD
    subgraph Presentation_Layer["Presentation Layer (Frontend)"]
        UI["React 18 SPA (TypeScript + Vite 7)"]
        Tailwind["Tailwind CSS 3.3 UI Components"]
        Zustand["Zustand Store (Auth & Portal)"]
        Axios["Axios HTTP Client"]
    end

    subgraph Backend_Layer["Application & API Gateway (Express 5)"]
        API["Express 5.2 REST Endpoints"]
        Auth["JWT Auth & Role-Based Access Control"]
        Biz["Clinical & Operational Logic"]
        AIEngine["Intelligent AI Assistant & RAG"]
        Cron["Background Schedulers & Mailer"]
    end

    subgraph Data_Layer["Data & Persistence Layer"]
        Atlas[("MongoDB Atlas Cloud Database")]
        Models["19 Mongoose Schemas"]
        Uploads[("Local/Multer File Storage")]
    end

    Presentation_Layer -->|HTTPS / JWT Bearer| Backend_Layer
    Backend_Layer -->|Mongoose Connection| Data_Layer
""",
        "02_use_case_diagram.mmd": """graph LR
    Patient((Patient))
    Doctor((Doctor))
    Admin((Admin / Staff))
    Nurse((Nurse))

    subgraph HMS["Kushal Hospitals System"]
        UC1([Register & Login])
        UC2([Book & Manage Appointments])
        UC3([View EHR & Lab Reports])
        UC4([Consultation Notes & Rx])
        UC5([AI Clinical Assistant])
        UC6([Bed & Ward Management])
        UC7([Pharmacy Inventory])
        UC8([Billing & Online Payments])
        UC9([Emergency Ambulance Dispatch])
    end

    Patient --> UC1
    Patient --> UC2
    Patient --> UC3
    Patient --> UC5
    Patient --> UC8

    Doctor --> UC1
    Doctor --> UC3
    Doctor --> UC4
    Doctor --> UC5

    Admin --> UC1
    Admin --> UC2
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9

    Nurse --> UC3
    Nurse --> UC6
    Nurse --> UC7
""",
        "03_dfd_level_0.mmd": """graph TD
    Patient["Patient"]
    Doctor["Doctor"]
    Staff["Hospital Admin & Staff"]
    Razorpay["Payment Gateway (Razorpay)"]
    LLM["Google Gemini 2.5 API"]

    HMS(("0.0 Kushal Hospitals Management System"))

    Patient -->|Appointment Requests, Medical Queries| HMS
    HMS -->|Confirmations, Prescriptions, AI Advice, Bills| Patient

    Doctor -->|Availability, Diagnosis, Rx, Notes| HMS
    HMS -->|Patient EMR, Daily Schedule| Doctor

    Staff -->|Ward Updates, Pharmacy Stock, Billing Data| HMS
    HMS -->|Revenue Reports, Operational Alerts| Staff

    HMS -->|Order Details| Razorpay
    Razorpay -->|Payment Verification Webhook| HMS

    HMS -->|Context & Knowledge Chunks| LLM
    LLM -->|Grounded Responses| HMS
""",
        "04_dfd_level_1.mmd": """graph TD
    P1(("1.0 Auth & RBAC"))
    P2(("2.0 Appointments"))
    P3(("3.0 Consultations"))
    P4(("4.0 Ward & Bed"))
    P5(("5.0 AI Assistant"))
    P6(("6.0 Billing & Pay"))
    P7(("7.0 Pharmacy"))

    D1[("D1 Users & Profiles")]
    D2[("D2 Appointments & Slots")]
    D3[("D3 EMR & Prescriptions")]
    D4[("D4 Wards & Bed Status")]
    D5[("D5 Medical Knowledge")]
    D6[("D6 Billing Invoices")]
    D7[("D7 Medicine Inventory")]

    P1 <--> D1
    P2 <--> D2
    P3 <--> D3
    P4 <--> D4
    P5 <--> D5
    P6 <--> D6
    P7 <--> D7

    P2 -.->|Confirmed Appointment| P6
    P3 -.->|Prescription Medicines| P7
    P2 -.->|Schedule Data| P5
""",
        "05_er_diagram.mmd": """erDiagram
    USER ||--o| PATIENT : "has"
    USER ||--o| DOCTOR : "has"
    PATIENT ||--o{ APPOINTMENT : "books"
    DOCTOR ||--o{ APPOINTMENT : "attends"
    APPOINTMENT ||--o| CONSULTATION : "results_in"
    CONSULTATION ||--o| PRESCRIPTION : "generates"
    APPOINTMENT ||--o| BILLING : "creates"
    WARD ||--o{ BED : "contains"
    PATIENT ||--o{ EMERGENCY_REQUEST : "requests"
""",
        "06_sequence_login_auth.mmd": """sequenceDiagram
    autonumber
    actor User as User / Client
    participant Frontend as React UI (Zustand)
    participant Backend as Express Auth Controller
    participant DB as MongoDB Atlas

    User->>Frontend: Enters credentials & submits login
    Frontend->>Backend: POST /api/auth/login { email, password }
    Backend->>DB: User.findOne({ email }).select('+password')
    DB-->>Backend: User document
    Backend->>Backend: bcrypt.compare(password, user.password)
    Backend->>Backend: jwt.sign({ id, role }, JWT_SECRET)
    Backend-->>Frontend: 200 OK { token, user }
    Frontend->>Frontend: Store token in localStorage & Zustand
    Frontend-->>User: Navigate to Role Dashboard
""",
        "07_sequence_appointment_booking.mmd": """sequenceDiagram
    autonumber
    actor Patient
    participant Frontend as Patient Portal UI
    participant Backend as Appointment Controller
    participant DB as MongoDB Atlas

    Patient->>Frontend: Select doctor, date, slot & symptoms
    Frontend->>Backend: POST /api/appointments { doctorId, date, timeSlot }
    Backend->>DB: Check doctor availability & slot collision
    DB-->>Backend: Slot available
    Backend->>DB: Appointment.create(status: "confirmed")
    Backend->>DB: Billing.create(status: "pending", amount: fee)
    DB-->>Backend: Saved records
    Backend-->>Frontend: 201 Created { appointment, billing }
    Frontend-->>Patient: Display Booking Confirmation Modal
""",
        "08_sequence_ai_rag_tool_workflow.mmd": """sequenceDiagram
    autonumber
    actor User as Patient / Doctor
    participant UI as Chat Widget UI
    participant Controller as AI Chat Controller
    participant Triage as Emergency Detector
    participant RAG as Medical Knowledge RAG
    participant LLM as Google Gemini API

    User->>UI: Submits medical query or report text
    UI->>Controller: POST /api/ai-chat/message { message, reportText }
    Controller->>Triage: evaluateEmergency(message)
    alt Emergency Red-Flag Triggered
        Triage-->>Controller: Critical emergency alert
        Controller-->>UI: Immediate 911/108 guidance + hospital helpline
    else Normal Clinical Query
        Controller->>RAG: searchMedicalKnowledge(message)
        RAG-->>Controller: Relevant clinical chunks & verified guidelines
        Controller->>LLM: Prompt with RAG context & hospital facts
        LLM-->>Controller: Structured answer with disclaimers
        Controller-->>UI: Render markdown response + citations
    end
""",
        "09_module_decomposition.mmd": """graph TD
    Root["Kushal Hospitals System"]
    M1["Patient Subsystem"]
    M2["Doctor Subsystem"]
    M3["Operational Subsystem"]
    M4["AI Intelligence Subsystem"]

    Root --> M1
    Root --> M2
    Root --> M3
    Root --> M4

    M1 --> M1_1["Appointments"]
    M1 --> M1_2["EHR Records"]
    M1 --> M1_3["Invoicing"]

    M2 --> M2_1["Schedule"]
    M2 --> M2_2["Consultations"]
    M2 --> M2_3["Prescriptions"]

    M3 --> M3_1["Wards & Beds"]
    M3 --> M3_2["Pharmacy"]
    M3 --> M3_3["Emergency Dispatch"]

    M4 --> M4_1["RAG Medical Engine"]
    M4 --> M4_2["Lab Report Analyzer"]
    M4 --> M4_3["Emergency Guardrails"]
""",
        "10_deployment_diagram.mmd": """graph LR
    subgraph Client_Tier["Client Devices"]
        Browser["Desktop & Mobile Web Browsers"]
    end

    subgraph Cloud_Tier["Render Cloud Platform"]
        App["Node.js 22 / Express 5 API Server"]
        Static["Vite Production Frontend Bundle"]
    end

    subgraph Data_Tier["External Services & DB"]
        Atlas[("MongoDB Atlas (AWS Mumbai)")]
        Gemini["Google Gemini 2.5 API"]
        Razorpay["Razorpay Payment Gateway"]
    end

    Browser -->|HTTPS / WSS| App
    Browser -->|HTTPS| Static
    App -->|Mongoose Wire Protocol| Atlas
    App -->|HTTPS REST| Gemini
    App -->|HTTPS REST| Razorpay
""",
        "11_project_timeline_gantt.mmd": """gantt
    title Kushal Hospitals Engineering Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Requirements & Domain Study       :done, 2025-08-01, 2025-08-21
    Database Schema & System Design   :done, 2025-08-22, 2025-09-12
    section Phase 2
    REST API & JWT Authentication    :done, 2025-09-13, 2025-10-17
    Frontend Components & UI Design   :done, 2025-10-01, 2025-11-12
    section Phase 3
    Patient & Doctor Workflows        :done, 2025-11-13, 2025-12-24
    Hospital Operations & Pharmacy    :done, 2025-12-25, 2026-01-29
    section Phase 4
    Intelligent AI Assistant & RAG    :done, 2026-02-01, 2026-03-07
    Verification, Testing & Report   :done, 2026-03-08, 2026-04-04
""",
        "12_test_results_chart.mmd": """pie title Automated Verification Test Distribution (64 Passed, 0 Failed)
    "AI Emergency Red-Flags" : 8
    "Lab Report Analyzer" : 12
    "RAG Medical Retrieval" : 20
    "Database Tools" : 4
    "Safety & Guardrails" : 4
    "Backend REST Endpoints" : 16
"""
    }

    for filename, content in sources.items():
        with open(os.path.join('report_assets/diagrams/source', filename), 'w', encoding='utf-8') as f:
            f.write(content)

print("Generating 12 diagrams...")
gen_01_architecture()
print("Generated 01_high_level_architecture.png")
gen_02_use_case()
print("Generated 02_use_case_diagram.png")
gen_03_dfd_0()
print("Generated 03_dfd_level_0.png")
gen_04_dfd_1()
print("Generated 04_dfd_level_1.png")
gen_05_er()
print("Generated 05_er_diagram.png")
gen_06_seq_auth()
print("Generated 06_sequence_login_auth.png")
gen_07_seq_booking()
print("Generated 07_sequence_appointment_booking.png")
gen_08_seq_ai_rag()
print("Generated 08_sequence_ai_rag_tool_workflow.png")
gen_09_module_decomp()
print("Generated 09_module_decomposition.png")
gen_10_deployment()
print("Generated 10_deployment_diagram.png")
gen_11_gantt()
print("Generated 11_project_timeline_gantt.png")
gen_12_test_chart()
print("Generated 12_test_results_chart.png")

write_mmd_sources()
print("All Mermaid source files written!")
