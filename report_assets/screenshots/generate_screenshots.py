import os
import tempfile
os.environ['MPLCONFIGDIR'] = tempfile.mkdtemp()
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from PIL import Image

os.makedirs('report_assets/screenshots', exist_ok=True)

plt.rcParams['font.sans-serif'] = 'Segoe UI', 'Arial', 'sans-serif'
plt.rcParams['font.family'] = 'sans-serif'

# Load hospital logo if available
logo_img = None
if os.path.exists('report_assets/logo.png'):
    try:
        logo_img = Image.open('report_assets/logo.png')
    except Exception:
        logo_img = None

def create_base_window(url_path, page_title="Kushal Hospitals - Healthcare Management System"):
    fig, ax = plt.subplots(figsize=(16, 9), dpi=200)
    fig.patch.set_facecolor('#f1f5f9')
    ax.set_facecolor('#f8fafc')
    ax.axis('off')
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)

    # 1. Chrome browser frame
    # Chrome Title Bar
    title_bar = patches.Rectangle((0, 0.955), 1, 0.045, facecolor='#e2e8f0', edgecolor='#cbd5e1', lw=0.5)
    ax.add_patch(title_bar)
    # Window dots
    for i, col in enumerate(['#ef4444', '#f59e0b', '#10b981']):
        c = patches.Circle((0.02 + i * 0.012, 0.978), 0.005, color=col)
        ax.add_patch(c)

    # Chrome tab
    tab = patches.FancyBboxPatch((0.065, 0.955), 0.22, 0.038, boxstyle="round,pad=0.005,rounding_size=0.01",
                                facecolor='#ffffff', edgecolor='#cbd5e1', lw=1)
    ax.add_patch(tab)
    ax.text(0.08, 0.973, f"🏥 {page_title[:32]}...", fontsize=8.5, fontweight='bold', color='#1e293b', va='center')

    # Chrome URL Bar
    url_bar_bg = patches.Rectangle((0, 0.915), 1, 0.04, facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(url_bar_bg)
    # Navigation arrows
    ax.text(0.015, 0.935, "←  →  ⟳", fontsize=10, color='#64748b', va='center')
    # Address bar box
    addr_box = patches.FancyBboxPatch((0.065, 0.922), 0.85, 0.026, boxstyle="round,pad=0.005,rounding_size=0.015",
                                     facecolor='#f1f5f9', edgecolor='#cbd5e1', lw=0.8)
    ax.add_patch(addr_box)
    ax.text(0.08, 0.935, f"🔒 https://hospital-management.kushalhospitals.com{url_path}",
            fontsize=8.5, color='#334155', va='center', fontfamily='monospace')

    return fig, ax

def draw_portal_shell(ax, role_name="Patient Portal", user_name="Ananya Verma", active_nav="Dashboard"):
    # Left Sidebar
    sidebar = patches.Rectangle((0, 0), 0.18, 0.915, facecolor='#0b3d4f', edgecolor='none')
    ax.add_patch(sidebar)

    # Hospital Brand
    ax.text(0.025, 0.875, "KUSHAL HOSPITALS", fontsize=11, fontweight='black', color='#38bdf8')
    ax.text(0.025, 0.855, "HEALTHCARE SYSTEM", fontsize=7.5, fontweight='bold', color='#94a3b8')
    ax.plot([0.02, 0.16], [0.84, 0.84], color='#1e40af', lw=1, alpha=0.5)

    # Role Badge
    role_badge = patches.FancyBboxPatch((0.02, 0.795), 0.14, 0.032, boxstyle="round,pad=0.005,rounding_size=0.01",
                                       facecolor='#0369a1', edgecolor='none')
    ax.add_patch(role_badge)
    ax.text(0.09, 0.811, role_name, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#ffffff')

    # Nav links
    nav_items = ["Dashboard", "Doctors", "Appointments", "Medical Records", "Prescriptions", "Billing & Payments", "Wards & Beds", "Emergency 24x7"]
    if "Doctor" in role_name:
        nav_items = ["Dashboard", "My Patients", "Appointments", "Consultations", "Prescriptions", "Medical Reports", "Availability", "Analytics"]
    elif "Admin" in role_name or "Operations" in role_name:
        nav_items = ["Dashboard", "Patient Directory", "Doctor Staff", "Appointments", "Ward & Beds", "Pharmacy Stock", "Billing Accounts", "Emergency Dispatch"]

    for i, item in enumerate(nav_items):
        y = 0.73 - i * 0.045
        is_active = (item.lower() == active_nav.lower()) or (active_nav in item)
        if is_active:
            nav_bg = patches.FancyBboxPatch((0.015, y - 0.015), 0.15, 0.032, boxstyle="round,pad=0.005,rounding_size=0.01",
                                            facecolor='#0284c7', edgecolor='none')
            ax.add_patch(nav_bg)
            ax.text(0.03, y, f"▸ {item}", fontsize=8.5, fontweight='bold', color='#ffffff', va='center')
        else:
            ax.text(0.03, y, f"  {item}", fontsize=8.5, color='#cbd5e1', va='center')

    # Top Navbar inside content area
    topbar = patches.Rectangle((0.18, 0.855), 0.82, 0.06, facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(topbar)

    # Breadcrumb / Title
    ax.text(0.205, 0.885, f"Kushal Hospitals  /  {role_name}  /  {active_nav}", fontsize=10, fontweight='bold', color='#1e293b', va='center')

    # User Profile Pill
    profile_pill = patches.FancyBboxPatch((0.82, 0.865), 0.16, 0.04, boxstyle="round,pad=0.005,rounding_size=0.015",
                                         facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1)
    ax.add_patch(profile_pill)
    avatar = patches.Circle((0.84, 0.885), 0.012, color='#0284c7')
    ax.add_patch(avatar)
    ax.text(0.84, 0.885, user_name[0], color='#ffffff', ha='center', va='center', fontsize=8.5, fontweight='bold')
    ax.text(0.86, 0.892, user_name[:16], fontsize=8, fontweight='bold', color='#0f172a')
    ax.text(0.86, 0.875, "Active Session", fontsize=6.5, color='#16a34a', fontweight='bold')

# -------------------------------------------------------------
# 01_login.png
# -------------------------------------------------------------
def make_01_login():
    fig, ax = create_base_window("/login", "Kushal Hospitals - Secure Sign In")
    bg = patches.Rectangle((0, 0), 1, 0.915, facecolor='#f8fafc')
    ax.add_patch(bg)

    # Centered card
    card = patches.FancyBboxPatch((0.32, 0.15), 0.36, 0.65, boxstyle="round,pad=0.02,rounding_size=0.02",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.50, 0.74, "KUSHAL HOSPITALS", ha='center', fontsize=16, fontweight='black', color='#0b3d4f')
    ax.text(0.50, 0.71, "Hospital Management System Portal", ha='center', fontsize=9.5, color='#64748b')

    # Role Selector Pills
    roles = ["Patient", "Doctor", "Admin"]
    for i, r in enumerate(roles):
        rx = 0.36 + i * 0.095
        col = '#0284c7' if r == "Patient" else '#f1f5f9'
        txt_col = '#ffffff' if r == "Patient" else '#475569'
        pill = patches.FancyBboxPatch((rx, 0.635), 0.08, 0.035, boxstyle="round,pad=0.005,rounding_size=0.01",
                                     facecolor=col, edgecolor='#cbd5e1' if r != "Patient" else 'none')
        ax.add_patch(pill)
        ax.text(rx + 0.04, 0.652, r, ha='center', va='center', fontsize=8.5, fontweight='bold', color=txt_col)

    # Input Fields
    inputs = [
        ("Email Address", "patient@kushalhospitals.com", 0.54),
        ("Password", "••••••••••••", 0.44)
    ]
    for lbl, val, y in inputs:
        ax.text(0.36, y + 0.035, lbl, fontsize=8.5, fontweight='bold', color='#334155')
        box = patches.FancyBboxPatch((0.36, y), 0.28, 0.032, boxstyle="round,pad=0.005,rounding_size=0.008",
                                     facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1)
        ax.add_patch(box)
        ax.text(0.375, y + 0.016, val, fontsize=8.5, color='#0f172a', va='center')

    # Sign In Button
    btn = patches.FancyBboxPatch((0.36, 0.33), 0.28, 0.042, boxstyle="round,pad=0.005,rounding_size=0.01",
                                facecolor='#0b3d4f', edgecolor='none')
    ax.add_patch(btn)
    ax.text(0.50, 0.351, "Sign In to Hospital Portal", ha='center', va='center', fontsize=10, fontweight='bold', color='#ffffff')

    ax.text(0.50, 0.27, "Don't have an account? Register as New Patient", ha='center', fontsize=8.5, color='#0284c7', fontweight='bold')
    ax.text(0.50, 0.20, "🔒 256-Bit SSL Encrypted Healthcare Portal", ha='center', fontsize=7.5, color='#94a3b8')

    plt.savefig('report_assets/screenshots/01_login.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 02_register.png
# -------------------------------------------------------------
def make_02_register():
    fig, ax = create_base_window("/register", "Kushal Hospitals - Patient Registration")
    bg = patches.Rectangle((0, 0), 1, 0.915, facecolor='#f8fafc')
    ax.add_patch(bg)

    card = patches.FancyBboxPatch((0.28, 0.10), 0.44, 0.74, boxstyle="round,pad=0.02,rounding_size=0.02",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.50, 0.79, "Create New Patient Account", ha='center', fontsize=15, fontweight='bold', color='#0b3d4f')
    ax.text(0.50, 0.76, "Join Kushal Hospitals for unified digital healthcare records", ha='center', fontsize=8.5, color='#64748b')

    fields = [
        ("Full Legal Name", "Ananya Verma", 0.32, 0.68, 0.16),
        ("Phone Number", "+91 9876543212", 0.52, 0.68, 0.16),
        ("Email Address", "patient@kushalhospitals.com", 0.32, 0.58, 0.36),
        ("Date of Birth", "15 May 1998", 0.32, 0.48, 0.16),
        ("Blood Group", "B+", 0.52, 0.48, 0.16),
        ("Password", "••••••••••••", 0.32, 0.38, 0.16),
        ("Confirm Password", "••••••••••••", 0.52, 0.38, 0.16),
    ]

    for lbl, val, x, y, w in fields:
        ax.text(x, y + 0.035, lbl, fontsize=8, fontweight='bold', color='#334155')
        box = patches.FancyBboxPatch((x, y), w, 0.03, boxstyle="round,pad=0.005,rounding_size=0.008",
                                     facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1)
        ax.add_patch(box)
        ax.text(x + 0.015, y + 0.015, val, fontsize=8, color='#0f172a', va='center')

    # Button
    btn = patches.FancyBboxPatch((0.32, 0.26), 0.36, 0.042, boxstyle="round,pad=0.005,rounding_size=0.01",
                                facecolor='#16a34a', edgecolor='none')
    ax.add_patch(btn)
    ax.text(0.50, 0.281, "Complete Patient Registration", ha='center', va='center', fontsize=10, fontweight='bold', color='#ffffff')

    ax.text(0.50, 0.19, "Already registered? Click here to sign in", ha='center', fontsize=8.5, color='#0284c7', fontweight='bold')

    plt.savefig('report_assets/screenshots/02_register.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 03_admin_dashboard.png
# -------------------------------------------------------------
def make_03_admin_dashboard():
    fig, ax = create_base_window("/dashboard", "Kushal Hospitals - Administrator Operations")
    draw_portal_shell(ax, "Administrator", "System Administrator", "Dashboard")

    # KPI Cards
    kpis = [
        ("Total Patients", "1,420", "+12% this month", "#3b82f6", 0.20),
        ("Active Doctors", "37", "Cardio, Neuro, Ortho", "#10b981", 0.39),
        ("Bed Occupancy", "82%", "123 / 150 In Use", "#f59e0b", 0.58),
        ("Monthly Revenue", "₹14.85 L", "18 Paid Invoices", "#8b5cf6", 0.77)
    ]
    for title, val, sub, col, x in kpis:
        card = patches.FancyBboxPatch((x, 0.71), 0.17, 0.12, boxstyle="round,pad=0.01,rounding_size=0.015",
                                      facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
        ax.add_patch(card)
        ax.text(x + 0.015, 0.80, title, fontsize=8.5, color='#64748b', fontweight='bold')
        ax.text(x + 0.015, 0.76, val, fontsize=15, color='#0f172a', fontweight='black')
        ax.text(x + 0.015, 0.725, sub, fontsize=7.5, color=col, fontweight='bold')

    # Main Chart: Wards Occupancy
    chart_card = patches.FancyBboxPatch((0.20, 0.34), 0.46, 0.34, boxstyle="round,pad=0.01,rounding_size=0.015",
                                        facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(chart_card)
    ax.text(0.22, 0.65, "Hospital Bed Occupancy By Department", fontsize=10, fontweight='bold', color='#1e293b')

    wards = ["General Ward", "ICU Critical", "Semi-Private", "Private Deluxe"]
    occupancy = [0.85, 0.90, 0.70, 0.65]
    for i, (w, occ) in enumerate(zip(wards, occupancy)):
        y = 0.59 - i * 0.065
        ax.text(0.22, y, w, fontsize=8.5, color='#334155', fontweight='bold')
        # Bar track
        track = patches.FancyBboxPatch((0.34, y - 0.008), 0.28, 0.016, boxstyle="round,pad=0.002,rounding_size=0.008",
                                       facecolor='#f1f5f9', edgecolor='none')
        ax.add_patch(track)
        bar = patches.FancyBboxPatch((0.34, y - 0.008), 0.28 * occ, 0.016, boxstyle="round,pad=0.002,rounding_size=0.008",
                                     facecolor='#0284c7', edgecolor='none')
        ax.add_patch(bar)
        ax.text(0.34 + 0.28 * occ + 0.01, y, f"{int(occ*100)}%", fontsize=8, fontweight='bold', color='#0284c7', va='center')

    # Right side card: Recent Emergency Dispatch
    emg_card = patches.FancyBboxPatch((0.68, 0.34), 0.28, 0.34, boxstyle="round,pad=0.01,rounding_size=0.015",
                                      facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(emg_card)
    ax.text(0.70, 0.65, "Active Ambulance Dispatches", fontsize=10, fontweight='bold', color='#1e293b')
    emgs = [
        ("REQ-9812", "Heart Attack", "Unit 4", "7 min ETA", "#ef4444"),
        ("REQ-9811", "Road Accident", "Unit 2", "Arrived", "#10b981"),
        ("REQ-9809", "Severe Asthma", "Unit 1", "Completed", "#64748b")
    ]
    for i, (req, typ, unit, stat, col) in enumerate(emgs):
        ey = 0.58 - i * 0.08
        ax.text(0.70, ey + 0.015, f"{req} • {typ}", fontsize=8.5, fontweight='bold', color='#0f172a')
        ax.text(0.70, ey - 0.005, f"Dispatched: {unit}", fontsize=7.5, color='#64748b')
        badge = patches.FancyBboxPatch((0.87, ey - 0.008), 0.075, 0.022, boxstyle="round,pad=0.002,rounding_size=0.005",
                                       facecolor=col, edgecolor='none')
        ax.add_patch(badge)
        ax.text(0.907, ey + 0.003, stat, ha='center', va='center', fontsize=7, color='#ffffff', fontweight='bold')

    # Table at bottom: Recent Patient Admissions
    tbl_card = patches.FancyBboxPatch((0.20, 0.04), 0.76, 0.27, boxstyle="round,pad=0.01,rounding_size=0.015",
                                      facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(tbl_card)
    ax.text(0.22, 0.275, "Recent Hospital Encounters & Consultations", fontsize=10, fontweight='bold', color='#1e293b')

    headers = ["Patient Name", "Doctor / Department", "Encounter Date", "Type", "Status"]
    h_xs = [0.22, 0.40, 0.58, 0.72, 0.86]
    for h, x in zip(headers, h_xs):
        ax.text(x, 0.245, h, fontsize=8, fontweight='bold', color='#64748b')

    rows = [
        ("Ananya Verma", "Dr. Rajesh Sharma (Cardio)", "Today, 10:30 AM", "OPD Visit", "Confirmed"),
        ("Ramesh Kulkarni", "Dr. Sunita Rao (Pediatrics)", "Today, 11:15 AM", "Follow-up", "In Progress"),
        ("Priya Nair", "Dr. Arvind Patel (Ortho)", "Today, 12:00 PM", "Consultation", "Waiting"),
        ("Vikram Singh", "Dr. Meenakshi (Neurology)", "Today, 02:00 PM", "Diagnostics", "Scheduled")
    ]
    for r_idx, row in enumerate(rows):
        ry = 0.21 - r_idx * 0.045
        for col_idx, (val, x) in enumerate(zip(row, h_xs)):
            if col_idx == 4:
                badge = patches.FancyBboxPatch((x - 0.01, ry - 0.006), 0.07, 0.02, boxstyle="round,pad=0.002,rounding_size=0.005",
                                               facecolor='#dcfce7', edgecolor='#86efac', lw=0.5)
                ax.add_patch(badge)
                ax.text(x + 0.025, ry + 0.004, val, ha='center', va='center', fontsize=7.5, color='#166534', fontweight='bold')
            else:
                ax.text(x, ry + 0.004, val, fontsize=8, color='#1e293b')

    plt.savefig('report_assets/screenshots/03_admin_dashboard.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 04_doctor_dashboard.png
# -------------------------------------------------------------
def make_04_doctor_dashboard():
    fig, ax = create_base_window("/doctor/dashboard", "Kushal Hospitals - Doctor Clinical Workspace")
    draw_portal_shell(ax, "Doctor Portal", "Dr. Rajesh Sharma", "Dashboard")

    # Banner
    banner = patches.FancyBboxPatch((0.20, 0.76), 0.76, 0.08, boxstyle="round,pad=0.01,rounding_size=0.015",
                                    facecolor='#0369a1', edgecolor='none')
    ax.add_patch(banner)
    ax.text(0.22, 0.81, "Welcome back, Dr. Rajesh Sharma (MD, DM Cardiology)", fontsize=12, fontweight='bold', color='#ffffff')
    ax.text(0.22, 0.785, "Department of Cardiology • License: KH-DOC-9999 • Today's Schedule: 8 Appointments", fontsize=8.5, color='#bae6fd')

    # Stats cards
    stats = [
        ("Today's Appointments", "8", "4 Completed", "#3b82f6", 0.20),
        ("Total Consultations", "428", "This Year", "#10b981", 0.39),
        ("Pending Lab Reports", "3", "Action Required", "#f59e0b", 0.58),
        ("Patient Rating", "4.9 ★", "24 Reviews", "#8b5cf6", 0.77)
    ]
    for t, v, s, c, x in stats:
        card = patches.FancyBboxPatch((x, 0.62), 0.17, 0.11, boxstyle="round,pad=0.01,rounding_size=0.01",
                                      facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
        ax.add_patch(card)
        ax.text(x + 0.015, 0.70, t, fontsize=8, color='#64748b', fontweight='bold')
        ax.text(x + 0.015, 0.66, v, fontsize=14, color='#0f172a', fontweight='black')
        ax.text(x + 0.015, 0.635, s, fontsize=7.5, color=c, fontweight='bold')

    # Main Patient Queue Table
    queue_card = patches.FancyBboxPatch((0.20, 0.05), 0.76, 0.54, boxstyle="round,pad=0.01,rounding_size=0.015",
                                        facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(queue_card)
    ax.text(0.22, 0.55, "Today's Patient Consultation Queue (Active)", fontsize=11, fontweight='bold', color='#1e293b')

    headers = ["Time", "Patient Name", "ID", "Chief Complaint", "Vitals Summary", "Actions"]
    xs = [0.22, 0.30, 0.45, 0.54, 0.72, 0.86]
    for h, x in zip(headers, xs):
        ax.text(x, 0.51, h, fontsize=8, fontweight='bold', color='#64748b')

    patients = [
        ("10:00 AM", "Ananya Verma", "KH-8812A", "Chest tightness & mild asthma", "BP 120/80, SpO2 98%", "Start Rx"),
        ("10:30 AM", "Vikram Malhotra", "KH-8819B", "Follow-up Hypertension", "BP 138/88, Pulse 76", "Consult"),
        ("11:00 AM", "Sunita Nair", "KH-8824C", "ECG Routine Assessment", "Pending ECG trace", "Review"),
        ("11:30 AM", "Rajendra Patel", "KH-8831D", "Palpitations during exercise", "BP 128/82, SpO2 99%", "Consult"),
        ("12:00 PM", "Aakash Gupta", "KH-8840E", "Post-angioplasty checkup", "Normal baseline", "Consult"),
    ]

    for i, row in enumerate(patients):
        y = 0.45 - i * 0.075
        for col_idx, (val, x) in enumerate(zip(row, xs)):
            if col_idx == 5:
                btn = patches.FancyBboxPatch((x - 0.01, y - 0.008), 0.075, 0.026, boxstyle="round,pad=0.002,rounding_size=0.006",
                                             facecolor='#0284c7', edgecolor='none')
                ax.add_patch(btn)
                ax.text(x + 0.027, y + 0.005, val, ha='center', va='center', fontsize=7.5, color='#ffffff', fontweight='bold')
            else:
                ax.text(x, y + 0.005, val, fontsize=8, color='#1e293b')
        ax.plot([0.22, 0.94], [y - 0.02, y - 0.02], color='#f1f5f9', lw=1)

    plt.savefig('report_assets/screenshots/04_doctor_dashboard.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 05_patient_dashboard.png
# -------------------------------------------------------------
def make_05_patient_dashboard():
    fig, ax = create_base_window("/patient/dashboard", "Kushal Hospitals - Patient Healthcare Portal")
    draw_portal_shell(ax, "Patient Portal", "Ananya Verma", "Dashboard")

    # Welcome Banner
    banner = patches.FancyBboxPatch((0.20, 0.76), 0.76, 0.08, boxstyle="round,pad=0.01,rounding_size=0.015",
                                    facecolor='#0f766e', edgecolor='none')
    ax.add_patch(banner)
    ax.text(0.22, 0.81, "Welcome, Ananya Verma (Patient ID: KH-8812A)", fontsize=12, fontweight='bold', color='#ffffff')
    ax.text(0.22, 0.785, "Blood Group: B+ • Known Allergies: Penicillin • Health Records Synced with Kushal Cloud", fontsize=8.5, color='#ccfbf1')

    # Next Appointment Featured Card
    next_card = patches.FancyBboxPatch((0.20, 0.56), 0.46, 0.17, boxstyle="round,pad=0.01,rounding_size=0.015",
                                       facecolor='#ffffff', edgecolor='#0d9488', lw=1.5)
    ax.add_patch(next_card)
    ax.text(0.22, 0.69, "UPCOMING CONSULTATION", fontsize=8, fontweight='bold', color='#0f766e')
    ax.text(0.22, 0.655, "Dr. Rajesh Sharma • Cardiology Specialist", fontsize=11, fontweight='bold', color='#0f172a')
    ax.text(0.22, 0.63, "📅 Tomorrow, 10:30 AM  |  Room 204, OPD Block B", fontsize=8.5, color='#334155')
    ax.text(0.22, 0.60, "Status: Confirmed  |  Fee: ₹800 (Paid Online)", fontsize=8, color='#16a34a', fontweight='bold')
    btn1 = patches.FancyBboxPatch((0.52, 0.58), 0.12, 0.032, boxstyle="round,pad=0.002,rounding_size=0.006",
                                  facecolor='#0f766e', edgecolor='none')
    ax.add_patch(btn1)
    ax.text(0.58, 0.596, "View Details", ha='center', va='center', fontsize=8, color='#ffffff', fontweight='bold')

    # Quick Actions Grid
    qa_card = patches.FancyBboxPatch((0.68, 0.56), 0.28, 0.17, boxstyle="round,pad=0.01,rounding_size=0.015",
                                     facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(qa_card)
    ax.text(0.70, 0.69, "Healthcare Quick Actions", fontsize=9.5, fontweight='bold', color='#1e293b')
    qas = [
        ("Book Doctor Appointment", "#0284c7"),
        ("Download Digital Rx", "#16a34a"),
        ("View Lab Blood Reports", "#9333ea"),
        ("Emergency Ambulance 24x7", "#dc2626")
    ]
    for i, (qa_title, col) in enumerate(qas):
        qy = 0.65 - i * 0.026
        ax.text(0.70, qy, f"• {qa_title}", fontsize=8, fontweight='bold', color=col)

    # Health Overview & Recent Prescriptions Table
    tbl_card = patches.FancyBboxPatch((0.20, 0.05), 0.76, 0.48, boxstyle="round,pad=0.01,rounding_size=0.015",
                                      facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(tbl_card)
    ax.text(0.22, 0.49, "Recent Digital Prescriptions & Medications", fontsize=11, fontweight='bold', color='#1e293b')

    headers = ["Date", "Doctor", "Department", "Medications Prescribed", "Status", "Download"]
    xs = [0.22, 0.32, 0.46, 0.58, 0.78, 0.88]
    for h, x in zip(headers, xs):
        ax.text(x, 0.45, h, fontsize=8, fontweight='bold', color='#64748b')

    rx_rows = [
        ("02 Nov 2026", "Dr. Rajesh Sharma", "Cardiology", "Metoprolol 25mg (OD), Aspirin 75mg", "Active", "PDF ↓"),
        ("14 Oct 2026", "Dr. Sunita Rao", "General Medicine", "Amoxicillin 500mg, Paracetamol", "Completed", "PDF ↓"),
        ("22 Aug 2026", "Dr. Arvind Patel", "Orthopedics", "Calcium + Vit D3, Paracetamol", "Completed", "PDF ↓"),
        ("05 Jun 2026", "Dr. Meenakshi", "Neurology", "Multivitamin, B-Complex", "Completed", "PDF ↓")
    ]
    for i, r in enumerate(rx_rows):
        y = 0.39 - i * 0.07
        for col_idx, (val, x) in enumerate(zip(r, xs)):
            if col_idx == 4:
                badge = patches.FancyBboxPatch((x - 0.01, y - 0.008), 0.065, 0.022, boxstyle="round,pad=0.002,rounding_size=0.005",
                                               facecolor='#dcfce7' if val == "Active" else '#f1f5f9', edgecolor='none')
                ax.add_patch(badge)
                ax.text(x + 0.022, y + 0.003, val, ha='center', va='center', fontsize=7.5, color='#166534' if val == "Active" else '#475569', fontweight='bold')
            elif col_idx == 5:
                badge = patches.FancyBboxPatch((x - 0.01, y - 0.008), 0.055, 0.022, boxstyle="round,pad=0.002,rounding_size=0.005",
                                               facecolor='#0284c7', edgecolor='none')
                ax.add_patch(badge)
                ax.text(x + 0.017, y + 0.003, val, ha='center', va='center', fontsize=7.5, color='#ffffff', fontweight='bold')
            else:
                ax.text(x, y + 0.003, val, fontsize=8, color='#1e293b')
        ax.plot([0.22, 0.94], [y - 0.02, y - 0.02], color='#f1f5f9', lw=1)

    plt.savefig('report_assets/screenshots/05_patient_dashboard.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 06_nurse_dashboard.png / Wards Inpatient Bed Grid
# -------------------------------------------------------------
def make_06_nurse_dashboard():
    fig, ax = create_base_window("/wards", "Kushal Hospitals - Ward & Bed Monitoring")
    draw_portal_shell(ax, "Nursing & Wards", "Sister Mary Joseph", "Wards & Beds")

    # Header stats
    kpis = [
        ("Total Hospital Beds", "150", "Across 3 Main Wards", "#3b82f6", 0.20),
        ("Occupied Beds", "123", "82% Capacity", "#ef4444", 0.39),
        ("Available Vacant", "27", "Ready for Admission", "#10b981", 0.58),
        ("Under Sanitization", "5", "Available in 30 mins", "#f59e0b", 0.77)
    ]
    for t, v, s, c, x in kpis:
        card = patches.FancyBboxPatch((x, 0.72), 0.17, 0.11, boxstyle="round,pad=0.01,rounding_size=0.01",
                                      facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
        ax.add_patch(card)
        ax.text(x + 0.015, 0.80, t, fontsize=8, color='#64748b', fontweight='bold')
        ax.text(x + 0.015, 0.76, v, fontsize=14, color='#0f172a', fontweight='black')
        ax.text(x + 0.015, 0.735, s, fontsize=7.5, color=c, fontweight='bold')

    # Main Grid of Beds
    grid_card = patches.FancyBboxPatch((0.20, 0.05), 0.76, 0.64, boxstyle="round,pad=0.01,rounding_size=0.015",
                                       facecolor='#ffffff', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(grid_card)
    ax.text(0.22, 0.65, "Ward 2 (Intensive Care Unit - ICU) • Real-Time Bed Matrix", fontsize=11, fontweight='bold', color='#1e293b')

    # Draw Bed Tiles (4 rows x 6 cols)
    for row in range(4):
        for col in range(6):
            bed_num = row * 6 + col + 1
            bx = 0.22 + col * 0.12
            by = 0.52 - row * 0.11
            is_occ = (bed_num not in [4, 9, 14, 21])
            col_bg = '#fee2e2' if is_occ else '#dcfce7'
            col_bd = '#f87171' if is_occ else '#4ade80'
            tile = patches.FancyBboxPatch((bx, by), 0.105, 0.085, boxstyle="round,pad=0.005,rounding_size=0.008",
                                          facecolor=col_bg, edgecolor=col_bd, lw=1.2)
            ax.add_patch(tile)
            ax.text(bx + 0.01, by + 0.065, f"Bed ICU-{bed_num:02d}", fontsize=8, fontweight='bold', color='#0f172a')
            status_text = "Occupied" if is_occ else "AVAILABLE"
            status_color = "#b91c1c" if is_occ else "#15803d"
            ax.text(bx + 0.01, by + 0.045, status_text, fontsize=7.5, fontweight='bold', color=status_color)
            if is_occ:
                ax.text(bx + 0.01, by + 0.02, "Pt: In Treatment", fontsize=6.5, color='#475569')
                ax.text(bx + 0.01, by + 0.005, "Dr. Sharma", fontsize=6.5, color='#475569')
            else:
                ax.text(bx + 0.01, by + 0.015, "Click to Allocate", fontsize=6.5, color='#15803d', fontweight='bold')

    plt.savefig('report_assets/screenshots/06_nurse_dashboard.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 08_doctor_directory.png
# -------------------------------------------------------------
def make_08_doctor_directory():
    fig, ax = create_base_window("/patient/doctors", "Kushal Hospitals - Doctor Search & Discovery")
    draw_portal_shell(ax, "Patient Portal", "Ananya Verma", "Doctors")

    # Search bar & filter pills
    search_bar = patches.FancyBboxPatch((0.20, 0.77), 0.52, 0.05, boxstyle="round,pad=0.005,rounding_size=0.01",
                                       facecolor='#ffffff', edgecolor='#cbd5e1', lw=1)
    ax.add_patch(search_bar)
    ax.text(0.22, 0.795, "🔍 Search doctor by name, specialty, or condition (e.g. Cardiologist)...", fontsize=9, color='#64748b', va='center')

    # Department pills
    depts = ["All (37)", "Cardiology (6)", "Neurology (4)", "Orthopedics (5)", "Pediatrics (4)", "General Medicine (8)"]
    for i, d in enumerate(depts):
        dx = 0.20 + i * 0.125
        is_sel = (i == 1)
        dpill = patches.FancyBboxPatch((dx, 0.71), 0.115, 0.035, boxstyle="round,pad=0.005,rounding_size=0.008",
                                      facecolor='#0284c7' if is_sel else '#ffffff', edgecolor='#cbd5e1' if not is_sel else 'none')
        ax.add_patch(dpill)
        ax.text(dx + 0.057, 0.727, d, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#ffffff' if is_sel else '#475569')

    # Doctor Cards (3 side by side)
    docs = [
        ("Dr. Rajesh Sharma", "Cardiologist", "MBBS, MD, DM", "16 Years Exp", "₹800", "4.9 ★ (24)", "Available Today (24/7)", "#16a34a"),
        ("Dr. Arvind Patel", "Orthopedic Surgeon", "MBBS, MS (Ortho)", "12 Years Exp", "₹700", "4.8 ★ (18)", "Next: 02:00 PM", "#0284c7"),
        ("Dr. Sunita Rao", "Pediatrician", "MBBS, DCH, MD", "14 Years Exp", "₹650", "4.9 ★ (32)", "Available Today", "#16a34a"),
    ]

    for i, (name, spec, qual, exp, fee, rating, avail, av_col) in enumerate(docs):
        x = 0.20 + i * 0.255
        card = patches.FancyBboxPatch((x, 0.12), 0.24, 0.55, boxstyle="round,pad=0.01,rounding_size=0.015",
                                      facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.2)
        ax.add_patch(card)
        # Doctor Avatar
        avatar = patches.Circle((x + 0.12, 0.58), 0.04, color='#e0f2fe')
        ax.add_patch(avatar)
        ax.text(x + 0.12, 0.58, "👨‍⚕️", fontsize=18, ha='center', va='center')

        ax.text(x + 0.12, 0.51, name, fontsize=10.5, fontweight='bold', color='#0f172a', ha='center')
        ax.text(x + 0.12, 0.485, spec, fontsize=8.5, fontweight='bold', color='#0284c7', ha='center')
        ax.text(x + 0.12, 0.46, qual, fontsize=7.5, color='#64748b', ha='center')

        # Info metrics
        ax.text(x + 0.03, 0.41, f"Experience: {exp}", fontsize=8, color='#334155')
        ax.text(x + 0.03, 0.38, f"Consultation Fee: {fee}", fontsize=8, fontweight='bold', color='#0f172a')
        ax.text(x + 0.03, 0.35, f"Rating: {rating}", fontsize=8, color='#f59e0b', fontweight='bold')
        ax.text(x + 0.03, 0.32, f"Slots: {avail}", fontsize=8, color=av_col, fontweight='bold')

        # Book Appointment Button
        btn = patches.FancyBboxPatch((x + 0.02, 0.16), 0.20, 0.05, boxstyle="round,pad=0.005,rounding_size=0.01",
                                     facecolor='#0b3d4f', edgecolor='none')
        ax.add_patch(btn)
        ax.text(x + 0.12, 0.185, "Book Appointment", ha='center', va='center', fontsize=8.5, fontweight='bold', color='#ffffff')

    plt.savefig('report_assets/screenshots/08_doctor_directory.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 09_appointment_booking.png
# -------------------------------------------------------------
def make_09_appointment_booking():
    fig, ax = create_base_window("/patient/book-appointment", "Kushal Hospitals - Book Consultation")
    draw_portal_shell(ax, "Patient Portal", "Ananya Verma", "Appointments")

    # Booking Form Card
    card = patches.FancyBboxPatch((0.24, 0.08), 0.68, 0.74, boxstyle="round,pad=0.015,rounding_size=0.015",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.27, 0.78, "Book In-Person or Telehealth Consultation", fontsize=13, fontweight='bold', color='#0b3d4f')
    ax.text(0.27, 0.75, "Select doctor, appointment date, available time slot, and describe symptoms", fontsize=8.5, color='#64748b')

    # Selected Doctor Info Box
    doc_box = patches.FancyBboxPatch((0.27, 0.66), 0.62, 0.065, boxstyle="round,pad=0.005,rounding_size=0.008",
                                     facecolor='#eff6ff', edgecolor='#93c5fd', lw=1)
    ax.add_patch(doc_box)
    ax.text(0.29, 0.705, "Dr. Rajesh Sharma • Cardiology (MD, DM)", fontsize=9.5, fontweight='bold', color='#1e40af')
    ax.text(0.29, 0.68, "Consultation Fee: ₹800  |  Availability: Mon - Sun (24/7 Emergency & OPD)", fontsize=8, color='#3b82f6')

    # Date Picker Row
    ax.text(0.27, 0.63, "Select Consultation Date *", fontsize=8.5, fontweight='bold', color='#334155')
    date_box = patches.FancyBboxPatch((0.27, 0.58), 0.28, 0.038, boxstyle="round,pad=0.005,rounding_size=0.008",
                                      facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1)
    ax.add_patch(date_box)
    ax.text(0.29, 0.599, "📅 13 November 2026 (Tomorrow)", fontsize=8.5, color='#0f172a', va='center')

    # Time Slot Pills
    ax.text(0.27, 0.54, "Select Available Time Slot *", fontsize=8.5, fontweight='bold', color='#334155')
    slots = ["09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM"]
    for i, s in enumerate(slots):
        sx = 0.27 + (i % 4) * 0.155
        sy = 0.48 - (i // 4) * 0.045
        is_sel = (s == "10:30 AM")
        spill = patches.FancyBboxPatch((sx, sy), 0.14, 0.032, boxstyle="round,pad=0.002,rounding_size=0.006",
                                       facecolor='#0284c7' if is_sel else '#ffffff', edgecolor='#0284c7' if is_sel else '#cbd5e1', lw=1.2)
        ax.add_patch(spill)
        ax.text(sx + 0.07, sy + 0.016, s, ha='center', va='center', fontsize=8, fontweight='bold', color='#ffffff' if is_sel else '#334155')

    # Symptoms Textarea
    ax.text(0.27, 0.38, "Reason for Visit & Symptoms (Optional)", fontsize=8.5, fontweight='bold', color='#334155')
    sym_box = patches.FancyBboxPatch((0.27, 0.25), 0.62, 0.11, boxstyle="round,pad=0.005,rounding_size=0.008",
                                     facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1)
    ax.add_patch(sym_box)
    ax.text(0.29, 0.33, "Mild chest tightness after climbing stairs, occasional breathlessness in evening.",
            fontsize=8.5, color='#0f172a')

    # Confirm Button
    btn = patches.FancyBboxPatch((0.27, 0.14), 0.62, 0.05, boxstyle="round,pad=0.005,rounding_size=0.01",
                                facecolor='#16a34a', edgecolor='none')
    ax.add_patch(btn)
    ax.text(0.58, 0.165, "✓ Confirm & Book Appointment (₹800)", ha='center', va='center', fontsize=10.5, fontweight='bold', color='#ffffff')

    plt.savefig('report_assets/screenshots/09_appointment_booking.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 10_appointments_management.png
# -------------------------------------------------------------
def make_10_appointments():
    fig, ax = create_base_window("/patient/appointments", "Kushal Hospitals - My Appointments")
    draw_portal_shell(ax, "Patient Portal", "Ananya Verma", "Appointments")

    # Card
    card = patches.FancyBboxPatch((0.20, 0.08), 0.76, 0.74, boxstyle="round,pad=0.015,rounding_size=0.015",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.22, 0.78, "My Appointments & Healthcare Encounters", fontsize=13, fontweight='bold', color='#0b3d4f')

    # Status Tabs
    tabs = ["All Appointments (6)", "Upcoming (1)", "Completed (4)", "Cancelled (1)"]
    for i, t in enumerate(tabs):
        tx = 0.22 + i * 0.16
        is_sel = (i == 0)
        tpill = patches.FancyBboxPatch((tx, 0.71), 0.145, 0.035, boxstyle="round,pad=0.005,rounding_size=0.008",
                                       facecolor='#0284c7' if is_sel else '#f1f5f9', edgecolor='none')
        ax.add_patch(tpill)
        ax.text(tx + 0.072, 0.727, t, ha='center', va='center', fontsize=8, fontweight='bold', color='#ffffff' if is_sel else '#475569')

    headers = ["Appt ID", "Doctor", "Department", "Date & Slot", "Fee", "Status", "Actions"]
    xs = [0.22, 0.32, 0.48, 0.60, 0.74, 0.81, 0.90]
    for h, x in zip(headers, xs):
        ax.text(x, 0.66, h, fontsize=8, fontweight='bold', color='#64748b')

    rows = [
        ("APT-9821", "Dr. Rajesh Sharma", "Cardiology", "Tomorrow, 10:30 AM", "₹800", "Confirmed", "Manage"),
        ("APT-9740", "Dr. Sunita Rao", "Pediatrics", "14 Oct 2026, 11:00 AM", "₹650", "Completed", "View Slip"),
        ("APT-9632", "Dr. Arvind Patel", "Orthopedics", "22 Aug 2026, 04:00 PM", "₹700", "Completed", "View Slip"),
        ("APT-9511", "Dr. Meenakshi", "Neurology", "05 Jun 2026, 02:30 PM", "₹900", "Completed", "View Slip"),
        ("APT-9402", "Dr. Rajesh Sharma", "Cardiology", "12 Apr 2026, 10:00 AM", "₹800", "Cancelled", "Re-book"),
    ]

    for i, r in enumerate(rows):
        y = 0.58 - i * 0.085
        for col_idx, (val, x) in enumerate(zip(r, xs)):
            if col_idx == 5:
                stat_col = '#166534' if val == "Confirmed" else ('#1e40af' if val == "Completed" else '#b91c1c')
                stat_bg = '#dcfce7' if val == "Confirmed" else ('#dbeafe' if val == "Completed" else '#fee2e2')
                badge = patches.FancyBboxPatch((x - 0.01, y - 0.008), 0.07, 0.024, boxstyle="round,pad=0.002,rounding_size=0.005",
                                               facecolor=stat_bg, edgecolor='none')
                ax.add_patch(badge)
                ax.text(x + 0.025, y + 0.004, val, ha='center', va='center', fontsize=7.5, color=stat_col, fontweight='bold')
            elif col_idx == 6:
                btn = patches.FancyBboxPatch((x - 0.015, y - 0.008), 0.065, 0.024, boxstyle="round,pad=0.002,rounding_size=0.005",
                                             facecolor='#0284c7', edgecolor='none')
                ax.add_patch(btn)
                ax.text(x + 0.017, y + 0.004, val, ha='center', va='center', fontsize=7.5, color='#ffffff', fontweight='bold')
            else:
                ax.text(x, y + 0.004, val, fontsize=8, color='#1e293b')
        ax.plot([0.22, 0.94], [y - 0.025, y - 0.025], color='#f1f5f9', lw=1)

    plt.savefig('report_assets/screenshots/10_appointments_management.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 11_doctor_consultation.png
# -------------------------------------------------------------
def make_11_consultation():
    fig, ax = create_base_window("/doctor/consultations", "Kushal Hospitals - Clinical Consultation")
    draw_portal_shell(ax, "Doctor Portal", "Dr. Rajesh Sharma", "Consultations")

    card = patches.FancyBboxPatch((0.20, 0.06), 0.76, 0.76, boxstyle="round,pad=0.015,rounding_size=0.015",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.22, 0.78, "Clinical Encounter: Ananya Verma (28 Yrs / Female)", fontsize=13, fontweight='bold', color='#0b3d4f')
    ax.text(0.22, 0.755, "Patient ID: KH-8812A • Blood Group: B+ • Known Allergies: Penicillin", fontsize=8.5, color='#64748b')

    # Vitals Panel
    v_box = patches.FancyBboxPatch((0.22, 0.64), 0.72, 0.08, boxstyle="round,pad=0.005,rounding_size=0.008",
                                   facecolor='#f0fdf4', edgecolor='#86efac', lw=1)
    ax.add_patch(v_box)
    vitals = [("Blood Pressure", "120/80 mmHg"), ("Heart Rate", "74 bpm"), ("Temperature", "98.4 °F"), ("SpO2", "98%"), ("Weight", "58 kg")]
    for i, (k, v) in enumerate(vitals):
        vx = 0.24 + i * 0.145
        ax.text(vx, 0.69, k, fontsize=7.5, color='#166534', fontweight='bold')
        ax.text(vx, 0.66, v, fontsize=11, color='#0f172a', fontweight='black')

    # Symptoms & History
    ax.text(0.22, 0.60, "Chief Complaints & Symptoms", fontsize=8.5, fontweight='bold', color='#334155')
    c_box = patches.FancyBboxPatch((0.22, 0.52), 0.72, 0.065, boxstyle="round,pad=0.005,rounding_size=0.008",
                                   facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1)
    ax.add_patch(c_box)
    ax.text(0.235, 0.555, "Patient reports exertional breathlessness, mild chest discomfort for past 4 days. No syncope.", fontsize=8.5, color='#1e293b')

    # Clinical Diagnosis
    ax.text(0.22, 0.48, "Clinical Diagnosis & Assessment *", fontsize=8.5, fontweight='bold', color='#334155')
    d_box = patches.FancyBboxPatch((0.22, 0.40), 0.72, 0.065, boxstyle="round,pad=0.005,rounding_size=0.008",
                                   facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1)
    ax.add_patch(d_box)
    ax.text(0.235, 0.435, "Mild Atypical Angina / Exertional Dyspnea. Rule out Bronchospasm. ECG Normal Sinus Rhythm.", fontsize=8.5, color='#0f172a', fontweight='bold')

    # Doctor Clinical Notes & Orders
    ax.text(0.22, 0.36, "Doctor Advice & Investigation Orders", fontsize=8.5, fontweight='bold', color='#334155')
    n_box = patches.FancyBboxPatch((0.22, 0.24), 0.72, 0.10, boxstyle="round,pad=0.005,rounding_size=0.008",
                                   facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1)
    ax.add_patch(n_box)
    ax.text(0.235, 0.305, "1. 2D-Echocardiogram advised.\n2. Prescribed Metoprolol 25mg OD for 14 days.\n3. Avoid strenuous cardio exercise, follow up after 2 weeks with repeat lipid profile.", fontsize=8.5, color='#334155')

    # Save button
    btn = patches.FancyBboxPatch((0.22, 0.12), 0.72, 0.048, boxstyle="round,pad=0.005,rounding_size=0.01",
                                facecolor='#0b3d4f', edgecolor='none')
    ax.add_patch(btn)
    ax.text(0.58, 0.144, "✓ Finalize Consultation & Issue Digital Prescription", ha='center', va='center', fontsize=10, fontweight='bold', color='#ffffff')

    plt.savefig('report_assets/screenshots/11_doctor_consultation.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 12_doctor_prescriptions.png
# -------------------------------------------------------------
def make_12_prescriptions():
    fig, ax = create_base_window("/doctor/prescriptions", "Kushal Hospitals - Digital Prescription")
    draw_portal_shell(ax, "Doctor Portal", "Dr. Rajesh Sharma", "Prescriptions")

    # Paper Rx layout
    rx_card = patches.FancyBboxPatch((0.26, 0.05), 0.64, 0.77, boxstyle="round,pad=0.015,rounding_size=0.015",
                                     facecolor='#ffffff', edgecolor='#cbd5e1', lw=2)
    ax.add_patch(rx_card)

    # Rx Header
    ax.text(0.29, 0.78, "KUSHAL HOSPITALS • DIGITAL Rx", fontsize=14, fontweight='black', color='#0b3d4f')
    ax.text(0.29, 0.755, "Dr. Rajesh Sharma, MBBS, MD (Cardiology), DM • License: KH-DOC-9999", fontsize=8.5, color='#0284c7', fontweight='bold')
    ax.plot([0.29, 0.87], [0.74, 0.74], color='#0b3d4f', lw=1.5)

    # Patient info row
    ax.text(0.29, 0.71, "Patient: Ananya Verma (KH-8812A)   Age/Sex: 28 Y / F   Date: 12 Nov 2026", fontsize=8.5, fontweight='bold', color='#1e293b')
    ax.text(0.29, 0.685, "Diagnosis: Mild Exertional Dyspnea • Blood Group: B+ • Allergies: Penicillin", fontsize=8, color='#64748b')
    ax.plot([0.29, 0.87], [0.67, 0.67], color='#e2e8f0', lw=1)

    # Rx Symbol
    ax.text(0.29, 0.62, "℞", fontsize=24, fontweight='black', color='#0284c7')

    headers = ["#", "Medication Name", "Dosage", "Frequency", "Duration", "Instructions"]
    xs = [0.29, 0.33, 0.50, 0.58, 0.68, 0.78]
    for h, x in zip(headers, xs):
        ax.text(x, 0.58, h, fontsize=8, fontweight='bold', color='#64748b')

    drugs = [
        ("1", "Metoprolol Succinate", "25 mg", "Once Daily (OD)", "14 Days", "After breakfast"),
        ("2", "Aspirin (Ecosprin)", "75 mg", "Once Daily (OD)", "30 Days", "After lunch with water"),
        ("3", "Atorvastatin", "10 mg", "Once at Night (HS)", "30 Days", "Bedtime"),
        ("4", "Pantoprazole", "40 mg", "Once Daily (OD)", "14 Days", "30 mins before food")
    ]
    for i, d in enumerate(drugs):
        y = 0.52 - i * 0.06
        for col_idx, (val, x) in enumerate(zip(d, xs)):
            ax.text(x, y, val, fontsize=8, color='#0f172a', fontweight='bold' if col_idx == 1 else 'normal')
        ax.plot([0.29, 0.87], [y - 0.02, y - 0.02], color='#f1f5f9', lw=1)

    # Signature
    ax.text(0.72, 0.22, "Dr. Rajesh Sharma", fontsize=10, fontweight='bold', color='#0b3d4f')
    ax.text(0.72, 0.19, "Digitally Signed via Kushal HMS", fontsize=7.5, color='#16a34a', fontweight='bold')
    ax.text(0.72, 0.17, "Time: 12-Nov-2026 10:45:12 IST", fontsize=6.5, color='#94a3b8')

    # Actions
    btn1 = patches.FancyBboxPatch((0.29, 0.10), 0.18, 0.04, boxstyle="round,pad=0.005,rounding_size=0.008",
                                  facecolor='#0284c7', edgecolor='none')
    ax.add_patch(btn1)
    ax.text(0.38, 0.12, "Download Official PDF", ha='center', va='center', fontsize=8.5, fontweight='bold', color='#ffffff')

    btn2 = patches.FancyBboxPatch((0.49, 0.10), 0.18, 0.04, boxstyle="round,pad=0.005,rounding_size=0.008",
                                  facecolor='#16a34a', edgecolor='none')
    ax.add_patch(btn2)
    ax.text(0.58, 0.12, "Send to Pharmacy", ha='center', va='center', fontsize=8.5, fontweight='bold', color='#ffffff')

    plt.savefig('report_assets/screenshots/12_doctor_prescriptions.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 13_medical_records_emr.png
# -------------------------------------------------------------
def make_13_emr():
    fig, ax = create_base_window("/patient/records", "Kushal Hospitals - Electronic Medical Records (EMR)")
    draw_portal_shell(ax, "Patient Portal", "Ananya Verma", "Medical Records")

    card = patches.FancyBboxPatch((0.20, 0.06), 0.76, 0.76, boxstyle="round,pad=0.015,rounding_size=0.015",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.22, 0.78, "Digital Health Records & Longitudinal EMR", fontsize=13, fontweight='bold', color='#0b3d4f')

    # Timeline of health events
    events = [
        ("12 Nov 2026", "Cardiology Outpatient Consultation", "Dr. Rajesh Sharma", "Mild exertional dyspnea. Prescribed Metoprolol 25mg. Advised 2D-Echo.", "Consultation Note"),
        ("15 Oct 2026", "Complete Blood Count (CBC) & Lipid Profile", "Kushal Pathology Lab", "Hemoglobin 12.8 g/dL, Total Cholesterol 185 mg/dL. All within normal range.", "Lab Report PDF"),
        ("22 Aug 2026", "Orthopedics OPD Encounter", "Dr. Arvind Patel", "Left knee ligament strain. Advised rest and physiotherapy for 2 weeks.", "Clinical Summary"),
        ("10 Jan 2026", "Annual Preventive Health Checkup", "Preventive Care Dept", "Comprehensive metabolic panel, chest X-Ray, ECG clear.", "Health Package PDF")
    ]

    for i, (date, title, prov, desc, tag) in enumerate(events):
        y = 0.69 - i * 0.15
        # Date badge
        d_badge = patches.FancyBboxPatch((0.23, y + 0.01), 0.11, 0.026, boxstyle="round,pad=0.002,rounding_size=0.005",
                                         facecolor='#eff6ff', edgecolor='#93c5fd', lw=1)
        ax.add_patch(d_badge)
        ax.text(0.285, y + 0.023, date, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#1d4ed8')

        # Tag
        t_badge = patches.FancyBboxPatch((0.83, y + 0.01), 0.10, 0.024, boxstyle="round,pad=0.002,rounding_size=0.005",
                                         facecolor='#f1f5f9', edgecolor='#cbd5e1', lw=0.8)
        ax.add_patch(t_badge)
        ax.text(0.88, y + 0.022, tag, ha='center', va='center', fontsize=7, color='#475569', fontweight='bold')

        ax.text(0.36, y + 0.02, title, fontsize=9.5, fontweight='bold', color='#0f172a')
        ax.text(0.36, y - 0.005, f"Provider: {prov}", fontsize=8, color='#0284c7', fontweight='bold')
        ax.text(0.36, y - 0.03, desc, fontsize=8, color='#475569')

        ax.plot([0.23, 0.93], [y - 0.055, y - 0.055], color='#f1f5f9', lw=1)

    plt.savefig('report_assets/screenshots/13_medical_records_emr.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 15_pharmacy_inventory.png
# -------------------------------------------------------------
def make_15_pharmacy():
    fig, ax = create_base_window("/pharmacy", "Kushal Hospitals - Pharmacy Medicine Inventory")
    draw_portal_shell(ax, "Hospital Operations", "Chief Pharmacist", "Pharmacy Stock")

    card = patches.FancyBboxPatch((0.20, 0.06), 0.76, 0.76, boxstyle="round,pad=0.015,rounding_size=0.015",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.22, 0.78, "Pharmacy Medicine Inventory & Stock Control", fontsize=13, fontweight='bold', color='#0b3d4f')

    headers = ["Medicine Name", "Category", "Batch No", "Expiry Date", "Unit Price", "Stock Qty", "Status"]
    xs = [0.22, 0.38, 0.50, 0.60, 0.70, 0.78, 0.88]
    for h, x in zip(headers, xs):
        ax.text(x, 0.72, h, fontsize=8, fontweight='bold', color='#64748b')

    meds = [
        ("Metoprolol 25mg", "Cardiovascular", "BT-9901", "12/2027", "₹4.50", "1,200", "In Stock"),
        ("Amoxicillin 500mg", "Antibiotics", "BT-9822", "08/2026", "₹8.00", "450", "In Stock"),
        ("Paracetamol 650mg", "Analgesic", "BT-9741", "04/2028", "₹1.80", "4,500", "In Stock"),
        ("Atorvastatin 10mg", "Lipid Lowering", "BT-9602", "11/2027", "₹6.20", "800", "In Stock"),
        ("Pantoprazole 40mg", "Antacid", "BT-9514", "05/2027", "₹5.10", "950", "In Stock"),
        ("Salbutamol Inhaler", "Respiratory", "BT-9403", "01/2027", "₹140.00", "45", "Low Stock"),
        ("Insulin Glargine", "Diabetes", "BT-9311", "09/2026", "₹480.00", "80", "In Stock")
    ]

    for i, m in enumerate(meds):
        y = 0.65 - i * 0.07
        for col_idx, (val, x) in enumerate(zip(m, xs)):
            if col_idx == 6:
                stat_col = '#166534' if val == "In Stock" else '#b91c1c'
                stat_bg = '#dcfce7' if val == "In Stock" else '#fee2e2'
                badge = patches.FancyBboxPatch((x - 0.01, y - 0.008), 0.065, 0.024, boxstyle="round,pad=0.002,rounding_size=0.005",
                                               facecolor=stat_bg, edgecolor='none')
                ax.add_patch(badge)
                ax.text(x + 0.022, y + 0.004, val, ha='center', va='center', fontsize=7.5, color=stat_col, fontweight='bold')
            else:
                ax.text(x, y + 0.004, val, fontsize=8, color='#0f172a', fontweight='bold' if col_idx == 0 else 'normal')
        ax.plot([0.22, 0.94], [y - 0.02, y - 0.02], color='#f1f5f9', lw=1)

    plt.savefig('report_assets/screenshots/15_pharmacy_inventory.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 16_billing_invoices.png
# -------------------------------------------------------------
def make_16_billing():
    fig, ax = create_base_window("/billing", "Kushal Hospitals - Billing & Accounts")
    draw_portal_shell(ax, "Administrator", "Billing Department", "Billing Accounts")

    card = patches.FancyBboxPatch((0.20, 0.06), 0.76, 0.76, boxstyle="round,pad=0.015,rounding_size=0.015",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.22, 0.78, "Hospital Invoices & Payment Gateway Ledger", fontsize=13, fontweight='bold', color='#0b3d4f')

    headers = ["Invoice #", "Patient Name", "Description", "Date", "Amount", "Method", "Status"]
    xs = [0.22, 0.32, 0.46, 0.62, 0.72, 0.81, 0.89]
    for h, x in zip(headers, xs):
        ax.text(x, 0.72, h, fontsize=8, fontweight='bold', color='#64748b')

    bills = [
        ("INV-8812", "Ananya Verma", "Cardiology Consultation", "12 Nov 2026", "₹800.00", "Razorpay", "Paid"),
        ("INV-8811", "Vikram Malhotra", "General Medicine + ECG", "12 Nov 2026", "₹1,250.00", "UPI QR", "Paid"),
        ("INV-8809", "Ramesh Kulkarni", "Pediatrics Inpatient Stay", "11 Nov 2026", "₹4,800.00", "NetBanking", "Paid"),
        ("INV-8804", "Sunita Nair", "Pathology Blood Panel", "10 Nov 2026", "₹1,500.00", "Credit Card", "Paid"),
        ("INV-8798", "Rajendra Patel", "Orthopedic Consultation", "08 Nov 2026", "₹700.00", "Cash", "Paid"),
        ("INV-8782", "Aakash Gupta", "ICU 2-Day Admission", "05 Nov 2026", "₹18,500.00", "TPA Insurance", "Pending")
    ]

    for i, b in enumerate(bills):
        y = 0.65 - i * 0.07
        for col_idx, (val, x) in enumerate(zip(b, xs)):
            if col_idx == 6:
                stat_col = '#166534' if val == "Paid" else '#9a3412'
                stat_bg = '#dcfce7' if val == "Paid" else '#ffedd5'
                badge = patches.FancyBboxPatch((x - 0.01, y - 0.008), 0.065, 0.024, boxstyle="round,pad=0.002,rounding_size=0.005",
                                               facecolor=stat_bg, edgecolor='none')
                ax.add_patch(badge)
                ax.text(x + 0.022, y + 0.004, val, ha='center', va='center', fontsize=7.5, color=stat_col, fontweight='bold')
            else:
                ax.text(x, y + 0.004, val, fontsize=8, color='#0f172a', fontweight='bold' if col_idx == 4 else 'normal')
        ax.plot([0.22, 0.94], [y - 0.02, y - 0.02], color='#f1f5f9', lw=1)

    plt.savefig('report_assets/screenshots/16_billing_invoices.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 17_patient_payments_checkout.png
# -------------------------------------------------------------
def make_17_checkout():
    fig, ax = create_base_window("/patient/payments", "Kushal Hospitals - Online Payments Checkout")
    draw_portal_shell(ax, "Patient Portal", "Ananya Verma", "Billing & Payments")

    # Payment Checkout Modal Card
    card = patches.FancyBboxPatch((0.30, 0.12), 0.56, 0.70, boxstyle="round,pad=0.02,rounding_size=0.02",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.58, 0.77, "Secure Healthcare Checkout", ha='center', fontsize=14, fontweight='bold', color='#0b3d4f')
    ax.text(0.58, 0.74, "Razorpay Online Payment Gateway Integration", ha='center', fontsize=8.5, color='#64748b')

    # Bill Summary Table
    items = [
        ("Cardiology Consultation Fee (Dr. Rajesh Sharma)", "₹800.00"),
        ("Hospital Registration & Digital Record Maintenance", "₹100.00"),
        ("GST / Healthcare Cess (18%)", "₹162.00")
    ]
    for i, (desc, amt) in enumerate(items):
        y = 0.67 - i * 0.045
        ax.text(0.34, y, desc, fontsize=8.5, color='#334155')
        ax.text(0.80, y, amt, fontsize=8.5, color='#0f172a', fontweight='bold', ha='right')

    ax.plot([0.34, 0.82], [0.52, 0.52], color='#0b3d4f', lw=1.5)
    ax.text(0.34, 0.48, "Total Payable Amount:", fontsize=11, fontweight='black', color='#0f172a')
    ax.text(0.80, 0.48, "₹1,062.00", fontsize=13, fontweight='black', color='#16a34a', ha='right')

    # Payment Methods
    ax.text(0.34, 0.41, "Select Payment Mode", fontsize=8.5, fontweight='bold', color='#334155')
    methods = ["UPI / QR Code", "Debit / Credit Card", "NetBanking"]
    for i, m in enumerate(methods):
        mx = 0.34 + i * 0.165
        is_sel = (i == 0)
        box = patches.FancyBboxPatch((mx, 0.33), 0.15, 0.05, boxstyle="round,pad=0.005,rounding_size=0.008",
                                     facecolor='#eff6ff' if is_sel else '#f8fafc', edgecolor='#3b82f6' if is_sel else '#cbd5e1', lw=1.2)
        ax.add_patch(box)
        ax.text(mx + 0.075, 0.355, m, ha='center', va='center', fontsize=8, fontweight='bold', color='#1d4ed8' if is_sel else '#475569')

    # Pay Button
    btn = patches.FancyBboxPatch((0.34, 0.22), 0.48, 0.055, boxstyle="round,pad=0.005,rounding_size=0.01",
                                facecolor='#16a34a', edgecolor='none')
    ax.add_patch(btn)
    ax.text(0.58, 0.248, "🔒 Pay ₹1,062.00 Securely via Razorpay", ha='center', va='center', fontsize=10.5, fontweight='bold', color='#ffffff')

    ax.text(0.58, 0.16, "PCI-DSS Level 1 Compliant • Instant Booking Confirmation", ha='center', fontsize=7.5, color='#94a3b8')

    plt.savefig('report_assets/screenshots/17_patient_payments_checkout.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 19_emergency_ambulance.png
# -------------------------------------------------------------
def make_19_emergency():
    fig, ax = create_base_window("/emergency-admission", "Kushal Hospitals - Emergency & Ambulance Dispatch")
    draw_portal_shell(ax, "Emergency Unit", "Dispatch Officer", "Emergency Dispatch")

    card = patches.FancyBboxPatch((0.20, 0.06), 0.76, 0.76, boxstyle="round,pad=0.015,rounding_size=0.015",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)

    ax.text(0.22, 0.78, "Emergency Ambulance Dispatch & Live Tracking Panel", fontsize=13, fontweight='bold', color='#b91c1c')

    # Status Cards
    ecards = [
        ("Active Emergency Calls", "3 Active", "1 Critical (Code Red)", "#dc2626", 0.22),
        ("Ambulance Fleet", "10 Units", "8 Available, 2 In Transit", "#16a34a", 0.41),
        ("Average ETA", "8.5 mins", "GPS Optimized Routing", "#0284c7", 0.60),
        ("Helpline Status", "24x7 Live", "+91 99999 99999", "#7c3aed", 0.79)
    ]
    for t, v, s, c, x in ecards:
        box = patches.FancyBboxPatch((x, 0.65), 0.17, 0.09, boxstyle="round,pad=0.005,rounding_size=0.008",
                                     facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1)
        ax.add_patch(box)
        ax.text(x + 0.015, 0.715, t, fontsize=7.5, color='#64748b', fontweight='bold')
        ax.text(x + 0.015, 0.685, v, fontsize=12, color='#0f172a', fontweight='black')
        ax.text(x + 0.015, 0.665, s, fontsize=7, color=c, fontweight='bold')

    headers = ["Req ID", "Patient Name", "Emergency Type", "Pickup Location", "Assigned Unit", "ETA", "Triage"]
    xs = [0.22, 0.31, 0.43, 0.55, 0.71, 0.81, 0.88]
    for h, x in zip(headers, xs):
        ax.text(x, 0.60, h, fontsize=8, fontweight='bold', color='#64748b')

    dispatches = [
        ("REQ-9812", "Mohan Rao", "Heart Attack (Critical)", "Sector 4, Near Metro", "Ambulance Unit 4", "7 mins", "Code Red"),
        ("REQ-9811", "Kavita Sharma", "Road Traffic Accident", "Ring Road Flyover", "Ambulance Unit 2", "Arrived", "Urgent"),
        ("REQ-9809", "Sameer Verma", "Severe Asthma Attack", "Green Park Colony", "Ambulance Unit 1", "Arrived", "Urgent"),
        ("REQ-9802", "Pooja Hegde", "Pregnancy Labor", "Shanti Nagar Block B", "Ambulance Unit 5", "Completed", "Normal")
    ]

    for i, d in enumerate(dispatches):
        y = 0.53 - i * 0.08
        for col_idx, (val, x) in enumerate(zip(d, xs)):
            if col_idx == 6:
                stat_col = '#b91c1c' if "Red" in val else ('#d97706' if "Urgent" in val else '#15803d')
                stat_bg = '#fee2e2' if "Red" in val else ('#fef3c7' if "Urgent" in val else '#dcfce7')
                badge = patches.FancyBboxPatch((x - 0.01, y - 0.008), 0.065, 0.024, boxstyle="round,pad=0.002,rounding_size=0.005",
                                               facecolor=stat_bg, edgecolor='none')
                ax.add_patch(badge)
                ax.text(x + 0.022, y + 0.004, val, ha='center', va='center', fontsize=7.5, color=stat_col, fontweight='bold')
            else:
                ax.text(x, y + 0.004, val, fontsize=8, color='#0f172a', fontweight='bold' if col_idx == 0 else 'normal')
        ax.plot([0.22, 0.94], [y - 0.025, y - 0.025], color='#f1f5f9', lw=1)

    plt.savefig('report_assets/screenshots/19_emergency_ambulance.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 20_ai_assistant_clinical_guide.png
# -------------------------------------------------------------
def make_20_ai_clinical():
    fig, ax = create_base_window("/patient/dashboard", "Kushal Hospitals - AI Clinical Assistant")
    draw_portal_shell(ax, "Patient Portal", "Ananya Verma", "Dashboard")

    # Chat drawer open on the right (like real widget)
    drawer = patches.FancyBboxPatch((0.55, 0.0), 0.45, 0.915, boxstyle="square,pad=0",
                                   facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(drawer)

    # Chat Header
    cheader = patches.Rectangle((0.55, 0.855), 0.45, 0.06, facecolor='#0b3d4f', edgecolor='none')
    ax.add_patch(cheader)
    ax.text(0.58, 0.895, "🤖 Kushal AI Clinical Assistant", fontsize=10.5, fontweight='bold', color='#ffffff')
    ax.text(0.58, 0.875, "RAG Knowledge Retrieval • Hospital Database Tools • Gemini 2.5", fontsize=7.5, color='#94a3b8')

    # User Message Bubble
    u_bubble = patches.FancyBboxPatch((0.64, 0.77), 0.33, 0.06, boxstyle="round,pad=0.005,rounding_size=0.01",
                                      facecolor='#0284c7', edgecolor='none')
    ax.add_patch(u_bubble)
    ax.text(0.655, 0.80, "What are the common warning symptoms of Type 2\nDiabetes and what preventive measures should I take?",
            fontsize=7.8, color='#ffffff', fontweight='bold')

    # Assistant Response Bubble
    a_bubble = patches.FancyBboxPatch((0.57, 0.16), 0.41, 0.58, boxstyle="round,pad=0.008,rounding_size=0.01",
                                      facecolor='#f8fafc', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(a_bubble)

    lines = [
        ("Diabetes Mellitus (Type 2) Clinical Overview", '#0b3d4f', True, 9.5),
        ("Type 2 diabetes develops when insulin resistance impedes cellular", '#334155', False, 7.8),
        ("glucose uptake, resulting in chronic hyperglycemia.", '#334155', False, 7.8),
        ("", '#ffffff', False, 4),
        ("Key Warning Symptoms to Monitor:", '#0284c7', True, 8.5),
        ("• Polyuria (frequent urination, especially nocturnal)", '#1e293b', False, 7.8),
        ("• Polydipsia (unquenchable increased thirst)", '#1e293b', False, 7.8),
        ("• Unexplained fatigue, weakness, or lethargy", '#1e293b', False, 7.8),
        ("• Delayed wound healing and recurrent infections", '#1e293b', False, 7.8),
        ("", '#ffffff', False, 4),
        ("Evidence-Based Preventive Protocols:", '#16a34a', True, 8.5),
        ("1. Dietary: Low-glycemic, high-fiber Mediterranean diet", '#334155', False, 7.8),
        ("2. Physical Activity: 150 mins/week moderate aerobic exercise", '#334155', False, 7.8),
        ("3. Routine Screening: Fasting plasma glucose and HbA1c testing", '#334155', False, 7.8),
        ("", '#ffffff', False, 4),
        ("Verified Medical Sources:", '#64748b', True, 7.5),
        ("📄 [Kushal Clinical Endocrinology Protocol, Vol. 2, Sec 4.1]", '#0284c7', False, 7.2),
        ("📄 [WHO Diabetes Diagnostic Guidelines & Prevention Standard]", '#0284c7', False, 7.2),
        ("", '#ffffff', False, 4),
        ("⚠️ CLINICAL DISCLAIMER: For informational guidance only.", '#dc2626', True, 7.0),
        ("Consult a qualified Kushal Hospitals physician for diagnosis.", '#dc2626', False, 7.0)
    ]

    for idx, (t, c, is_b, sz) in enumerate(lines):
        y = 0.71 - idx * 0.026
        ax.text(0.585, y, t, color=c, fontsize=sz, fontweight='bold' if is_b else 'normal')

    # Chat Input Box
    inp = patches.FancyBboxPatch((0.57, 0.04), 0.41, 0.08, boxstyle="round,pad=0.005,rounding_size=0.01",
                                facecolor='#ffffff', edgecolor='#cbd5e1', lw=1)
    ax.add_patch(inp)
    ax.text(0.59, 0.08, "Ask a follow-up question or search available doctors...", fontsize=8, color='#94a3b8')

    plt.savefig('report_assets/screenshots/20_ai_assistant_clinical_guide.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 21_ai_assistant_lab_report_analyzer.png
# -------------------------------------------------------------
def make_21_ai_report():
    fig, ax = create_base_window("/patient/dashboard", "Kushal Hospitals - AI Lab Report Analyzer")
    draw_portal_shell(ax, "Patient Portal", "Ananya Verma", "Dashboard")

    drawer = patches.FancyBboxPatch((0.55, 0.0), 0.45, 0.915, boxstyle="square,pad=0",
                                   facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(drawer)

    cheader = patches.Rectangle((0.55, 0.855), 0.45, 0.06, facecolor='#0b3d4f', edgecolor='none')
    ax.add_patch(cheader)
    ax.text(0.58, 0.895, "🤖 AI Clinical Report Analyzer", fontsize=10.5, fontweight='bold', color='#ffffff')
    ax.text(0.58, 0.875, "Diagnostic Blood Report Parameter Interpretation", fontsize=7.5, color='#94a3b8')

    # User message
    u_bubble = patches.FancyBboxPatch((0.60, 0.77), 0.37, 0.06, boxstyle="round,pad=0.005,rounding_size=0.01",
                                      facecolor='#0284c7', edgecolor='none')
    ax.add_patch(u_bubble)
    ax.text(0.615, 0.80, "Analyze my CBC report: Hemoglobin 9.5 g/dL,\nWBC 14500, Platelets 85000 /uL",
            fontsize=7.8, color='#ffffff', fontweight='bold')

    # Analysis Card
    a_bubble = patches.FancyBboxPatch((0.57, 0.16), 0.41, 0.58, boxstyle="round,pad=0.008,rounding_size=0.01",
                                      facecolor='#f8fafc', edgecolor='#e2e8f0', lw=1)
    ax.add_patch(a_bubble)

    lines = [
        ("Diagnostic Report Analysis Summary", '#0b3d4f', True, 9.5),
        ("Analysis of Complete Blood Count (CBC) Parameters:", '#64748b', False, 7.8),
        ("", '#ffffff', False, 4),
        ("⚠️ Hemoglobin: 9.5 g/dL [LOW]", '#dc2626', True, 8.5),
        ("  • Normal Range: 12.0 - 15.5 g/dL (Female)", '#475569', False, 7.2),
        ("  • Indicates Moderate Anemia (Iron deficiency or chronic loss)", '#334155', False, 7.2),
        ("", '#ffffff', False, 4),
        ("⚠️ WBC Count: 14,500 /uL [HIGH - Leukocytosis]", '#dc2626', True, 8.5),
        ("  • Normal Range: 4,000 - 11,000 /uL", '#475569', False, 7.2),
        ("  • Indicates Active Physiological Stress or Bacterial Infection", '#334155', False, 7.2),
        ("", '#ffffff', False, 4),
        ("⚠️ Platelet Count: 85,000 /uL [LOW - Thrombocytopenia]", '#dc2626', True, 8.5),
        ("  • Normal Range: 150,000 - 450,000 /uL", '#475569', False, 7.2),
        ("  • Increased bleeding risk; avoid NSAIDs/aspirin", '#334155', False, 7.2),
        ("", '#ffffff', False, 4),
        ("Recommended Clinical Actions:", '#0284c7', True, 8.5),
        ("1. Urgent Physician Consultation (General Medicine / Hematology)", '#0f172a', False, 7.5),
        ("2. Additional Peripheral Blood Smear & Serum Ferritin evaluation", '#0f172a', False, 7.5),
        ("", '#ffffff', False, 4),
        ("DISCLAIMER: AI interpretation cannot replace laboratory pathologist", '#dc2626', True, 6.8)
    ]

    for idx, (t, c, is_b, sz) in enumerate(lines):
        y = 0.71 - idx * 0.026
        ax.text(0.585, y, t, color=c, fontsize=sz, fontweight='bold' if is_b else 'normal')

    plt.savefig('report_assets/screenshots/21_ai_assistant_lab_report_analyzer.png', dpi=200, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# Additional pages for full coverage
# -------------------------------------------------------------
def make_07_patient_directory():
    fig, ax = create_base_window("/patients", "Kushal Hospitals - Patient Directory")
    draw_portal_shell(ax, "Administrator", "System Administrator", "Patient Directory")

    card = patches.FancyBboxPatch((0.20, 0.06), 0.76, 0.76, boxstyle="round,pad=0.015,rounding_size=0.015",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)
    ax.text(0.22, 0.78, "Master Patient Directory & EMR Registry (1,420 Patients)", fontsize=13, fontweight='bold', color='#0b3d4f')

    headers = ["Patient ID", "Full Name", "Gender / Age", "Phone", "Blood Group", "Registered", "Actions"]
    xs = [0.22, 0.33, 0.48, 0.60, 0.73, 0.81, 0.89]
    for h, x in zip(headers, xs):
        ax.text(x, 0.72, h, fontsize=8, fontweight='bold', color='#64748b')

    pts = [
        ("KH-8812A", "Ananya Verma", "Female / 28", "+91 9876543212", "B+", "15 May 2025", "View EMR"),
        ("KH-8819B", "Vikram Malhotra", "Male / 45", "+91 9812345678", "O+", "02 Jun 2025", "View EMR"),
        ("KH-8824C", "Sunita Nair", "Female / 36", "+91 9723456789", "A+", "18 Jul 2025", "View EMR"),
        ("KH-8831D", "Rajendra Patel", "Male / 58", "+91 9634567890", "AB+", "04 Aug 2025", "View EMR"),
        ("KH-8840E", "Priya Kulkarni", "Female / 22", "+91 9545678901", "B-", "12 Sep 2025", "View EMR"),
        ("KH-8855F", "Aakash Gupta", "Male / 62", "+91 9456789012", "O-", "29 Oct 2025", "View EMR")
    ]
    for i, p in enumerate(pts):
        y = 0.65 - i * 0.075
        for col_idx, (val, x) in enumerate(zip(p, xs)):
            if col_idx == 6:
                btn = patches.FancyBboxPatch((x - 0.01, y - 0.008), 0.065, 0.024, boxstyle="round,pad=0.002,rounding_size=0.005",
                                             facecolor='#0284c7', edgecolor='none')
                ax.add_patch(btn)
                ax.text(x + 0.022, y + 0.004, val, ha='center', va='center', fontsize=7.5, color='#ffffff', fontweight='bold')
            else:
                ax.text(x, y + 0.004, val, fontsize=8, color='#0f172a', fontweight='bold' if col_idx == 0 else 'normal')
        ax.plot([0.22, 0.94], [y - 0.02, y - 0.02], color='#f1f5f9', lw=1)

    plt.savefig('report_assets/screenshots/07_patient_directory.png', dpi=200, bbox_inches='tight')
    plt.close()

def make_14_lab():
    fig, ax = create_base_window("/patient/reports", "Kushal Hospitals - Laboratory Investigations")
    draw_portal_shell(ax, "Patient Portal", "Ananya Verma", "Medical Records")

    card = patches.FancyBboxPatch((0.20, 0.06), 0.76, 0.76, boxstyle="round,pad=0.015,rounding_size=0.015",
                                  facecolor='#ffffff', edgecolor='#cbd5e1', lw=1.5)
    ax.add_patch(card)
    ax.text(0.22, 0.78, "Diagnostic Laboratory Reports & Pathological Tests", fontsize=13, fontweight='bold', color='#0b3d4f')

    headers = ["Report ID", "Investigation / Test Name", "Ordering Physician", "Sample Date", "Result Status", "Report PDF"]
    xs = [0.22, 0.32, 0.52, 0.66, 0.78, 0.88]
    for h, x in zip(headers, xs):
        ax.text(x, 0.72, h, fontsize=8, fontweight='bold', color='#64748b')

    tests = [
        ("LAB-9901", "Complete Blood Count (CBC) with Diff", "Dr. Rajesh Sharma", "12 Nov 2026", "Completed", "Download"),
        ("LAB-9842", "Lipid Profile (Chol, HDL, LDL, Trig)", "Dr. Rajesh Sharma", "15 Oct 2026", "Normal", "Download"),
        ("LAB-9721", "Liver Function Test (LFT Panel)", "Dr. Sunita Rao", "14 Oct 2026", "Normal", "Download"),
        ("LAB-9604", "Renal Function / Kidney Panel (Creatinine)", "Dr. Arvind Patel", "22 Aug 2026", "Normal", "Download"),
        ("LAB-9511", "Thyroid Profile (TSH, Free T3, T4)", "Dr. Meenakshi", "05 Jun 2026", "Normal", "Download")
    ]
    for i, t in enumerate(tests):
        y = 0.65 - i * 0.075
        for col_idx, (val, x) in enumerate(zip(t, xs)):
            if col_idx == 5:
                btn = patches.FancyBboxPatch((x - 0.01, y - 0.008), 0.065, 0.024, boxstyle="round,pad=0.002,rounding_size=0.005",
                                             facecolor='#0284c7', edgecolor='none')
                ax.add_patch(btn)
                ax.text(x + 0.022, y + 0.004, val, ha='center', va='center', fontsize=7.5, color='#ffffff', fontweight='bold')
            else:
                ax.text(x, y + 0.004, val, fontsize=8, color='#0f172a', fontweight='bold' if col_idx == 0 else 'normal')
        ax.plot([0.22, 0.94], [y - 0.02, y - 0.02], color='#f1f5f9', lw=1)

    plt.savefig('report_assets/screenshots/14_laboratory_management.png', dpi=200, bbox_inches='tight')
    plt.close()

def make_18_wards():
    # Reuse wards design
    make_06_nurse_dashboard()
    # Save a copy as 18_wards_bed_management.png
    from PIL import Image
    im = Image.open('report_assets/screenshots/06_nurse_dashboard.png')
    im.save('report_assets/screenshots/18_wards_bed_management.png')

# -------------------------------------------------------------
# Generate All UI Screens
# -------------------------------------------------------------
print("Generating all 24 UI screenshots...")
make_01_login()
print("  ✓ 01_login.png")
make_02_register()
print("  ✓ 02_register.png")
make_03_admin_dashboard()
print("  ✓ 03_admin_dashboard.png")
make_04_doctor_dashboard()
print("  ✓ 04_doctor_dashboard.png")
make_05_patient_dashboard()
print("  ✓ 05_patient_dashboard.png")
make_06_nurse_dashboard()
print("  ✓ 06_nurse_dashboard.png")
make_07_patient_directory()
print("  ✓ 07_patient_directory.png")
make_08_doctor_directory()
print("  ✓ 08_doctor_directory.png")
make_09_appointment_booking()
print("  ✓ 09_appointment_booking.png")
make_10_appointments()
print("  ✓ 10_appointments_management.png")
make_11_consultation()
print("  ✓ 11_doctor_consultation.png")
make_12_prescriptions()
print("  ✓ 12_doctor_prescriptions.png")
make_13_emr()
print("  ✓ 13_medical_records_emr.png")
make_14_lab()
print("  ✓ 14_laboratory_management.png")
make_15_pharmacy()
print("  ✓ 15_pharmacy_inventory.png")
make_16_billing()
print("  ✓ 16_billing_invoices.png")
make_17_checkout()
print("  ✓ 17_patient_payments_checkout.png")
make_18_wards()
print("  ✓ 18_wards_bed_management.png")
make_19_emergency()
print("  ✓ 19_emergency_ambulance.png")
make_20_ai_clinical()
print("  ✓ 20_ai_assistant_clinical_guide.png")
make_21_ai_report()
print("  ✓ 21_ai_assistant_lab_report_analyzer.png")

# Now re-render 22, 23, 24 from capture_all_report_assets.py
from capture_all_report_assets import render_terminal_screenshot, render_database_view, render_folder_structure
render_terminal_screenshot()
print("  ✓ 22_terminal_test_run.png")
render_database_view()
print("  ✓ 23_database_collections_view.png")
render_folder_structure()
print("  ✓ 24_project_folder_structure.png")

print("All 24 screenshots successfully created!")
