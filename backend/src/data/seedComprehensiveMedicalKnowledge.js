const MedicalKnowledge = require('../models/MedicalKnowledge');

const comprehensiveKnowledgeBase = [
  // 1. DIABETES
  {
    sourceId: 'HMS-MED-DIABETES-001',
    version: '2.0',
    title: 'Diabetes Mellitus: Types, Diagnostics, Symptoms and Clinical Management',
    category: 'disease',
    symptoms: ['frequent urination', 'excessive thirst', 'extreme hunger', 'unexplained weight loss', 'fatigue', 'blurred vision', 'slow healing sores', 'frequent infections', 'tingling hands feet', 'polyuria', 'polydipsia'],
    precautions: [
      'Maintain regular physical activity (at least 150 minutes of moderate aerobic exercise weekly)',
      'Follow a balanced low-glycemic, fiber-rich diet with portion control',
      'Monitor blood glucose regularly as advised by your endocrinologist or diabetologist',
      'Inspect feet daily for cuts, blisters, redness, or swelling to prevent diabetic foot complications',
      'Schedule annual HbA1c testing, retinal eye exams, and kidney function panels'
    ],
    warnings: [
      'Urgent medical care is required for symptoms of Diabetic Ketoacidosis (DKA): fruity breath, nausea, vomiting, confusion, rapid deep breathing, or blood glucose > 250 mg/dL',
      'Treat hypoglycemia immediately (Rule of 15: 15g fast-acting sugar like fruit juice, recheck in 15 mins) if blood glucose drops below 70 mg/dL'
    ],
    content: `Diabetes Mellitus is a chronic metabolic disorder characterized by elevated blood glucose (hyperglycemia) due to defects in insulin secretion, insulin action, or both.
- Type 1 Diabetes: Autoimmune destruction of pancreatic beta cells leading to absolute insulin deficiency. Requires lifelong insulin replacement.
- Type 2 Diabetes: Progressive secretory defect on the background of insulin resistance. Strongly associated with genetics, overweight, and sedentary lifestyle.
- Gestational Diabetes: Glucose intolerance with onset during pregnancy.
Diagnostic Thresholds:
- Fasting Blood Sugar (FBS): Normal < 100 mg/dL; Prediabetes 100-125 mg/dL; Diabetes >= 126 mg/dL.
- 2-Hour Post-Prandial (PPBS): Normal < 140 mg/dL; Prediabetes 140-199 mg/dL; Diabetes >= 200 mg/dL.
- HbA1c (Glycated Hemoglobin): Normal < 5.7%; Prediabetes 5.7%-6.4%; Diabetes >= 6.5%.`,
    approved: true,
  },

  // 2. HYPERTENSION / BLOOD PRESSURE
  {
    sourceId: 'HMS-MED-HYPERTENSION-001',
    version: '2.0',
    title: 'Hypertension (High Blood Pressure): Stages, Risks and Management',
    category: 'disease',
    symptoms: ['often asymptomatic silent killer', 'morning headaches', 'dizziness', 'chest tightness', 'shortness of breath', 'nosebleeds', 'visual changes', 'flushing'],
    precautions: [
      'Adopt the DASH diet (Dietary Approaches to Stop Hypertension) rich in fruits, vegetables, whole grains, and low-fat dairy',
      'Restrict dietary sodium intake to under 2,000 mg (approx. 1 teaspoon of table salt) per day',
      'Engage in 30 minutes of daily moderate aerobic exercise like brisk walking or swimming',
      'Limit alcohol consumption and eliminate tobacco smoking entirely',
      'Practice stress reduction techniques including deep breathing, yoga, and adequate sleep'
    ],
    warnings: [
      'Hypertensive Crisis (Systolic > 180 mmHg or Diastolic > 120 mmHg) accompanied by chest pain, shortness of breath, back pain, numbness, vision changes, or difficulty speaking requires IMMEDIATE emergency room care'
    ],
    content: `Hypertension is a chronic elevation of systemic arterial blood pressure that forces the heart to work harder to circulate blood, increasing the risk of myocardial infarction, stroke, heart failure, and renal disease.
AHA/ACC Blood Pressure Categories:
- Normal: Systolic < 120 mmHg AND Diastolic < 80 mmHg.
- Elevated: Systolic 120-129 mmHg AND Diastolic < 80 mmHg.
- Stage 1 Hypertension: Systolic 130-139 mmHg OR Diastolic 80-89 mmHg.
- Stage 2 Hypertension: Systolic >= 140 mmHg OR Diastolic >= 90 mmHg.
- Hypertensive Crisis: Systolic > 180 mmHg and/or Diastolic > 120 mmHg.
Lifestyle modifications are foundational for all stages, combined with antihypertensive pharmacotherapy when clinically prescribed.`,
    approved: true,
  },

  // 3. HEART DISEASES / CORONARY ARTERY DISEASE
  {
    sourceId: 'HMS-MED-CARDIOLOGY-001',
    version: '2.0',
    title: 'Cardiovascular Diseases: Coronary Artery Disease, Heart Failure and Heart Attack',
    category: 'disease',
    symptoms: ['chest pressure', 'angina', 'pain radiating to left arm shoulder neck jaw back', 'shortness of breath', 'cold sweats', 'lightheadedness', 'palpitations', 'ankle swelling', 'fatigue'],
    precautions: [
      'Follow a heart-healthy Mediterranean diet low in saturated and trans fats',
      'Maintain an optimal lipid profile (keep LDL cholesterol within clinician-targeted ranges)',
      'Manage comorbid conditions including diabetes, hypertension, and sleep apnea',
      'Undergo regular cardiac assessments including ECG, Echocardiogram, and Treadmill Stress Tests as indicated'
    ],
    warnings: [
      'RED ALERT: Sudden severe chest pressure, crushing retrosternal pain, radiating pain to jaw/arm, diaphoresis (cold sweating), and acute dyspnea indicate potential ACUTE MYOCARDIAL INFARCTION (Heart Attack). Call emergency services (112) immediately.'
    ],
    content: `Cardiovascular disease encompasses disorders of the heart and blood vessels, most commonly Coronary Artery Disease (CAD) caused by atherosclerotic plaque buildup narrowing the coronary arteries.
- Angina Pectoris: Temporary chest discomfort triggered by exertion or emotional stress when myocardial oxygen demand exceeds supply.
- Myocardial Infarction: Complete occlusion of a coronary artery leading to myocardial necrosis. Time is muscle; immediate reperfusion therapy is vital.
- Heart Failure: The inability of the ventricles to pump adequate blood volume, causing pulmonary congestion and peripheral edema.
Diagnostic Investigations: High-sensitivity Troponin I/T, Electrocardiography (ECG), Transthoracic Echocardiogram, CT Coronary Angiography, and Cardiac Catheterization.`,
    approved: true,
  },

  // 4. CANCER EDUCATION & WARNING SIGNS
  {
    sourceId: 'HMS-MED-ONCOLOGY-001',
    version: '2.0',
    title: 'Oncology Overview: Common Cancers, Detection and CAUTION Signs',
    category: 'education',
    symptoms: ['unexplained weight loss', 'persistent fatigue', 'unexplained lump', 'chronic cough or hoarseness', 'change in bowel or bladder habits', 'unusual bleeding or discharge', 'difficulty swallowing', 'non-healing sores', 'skin mole changes'],
    precautions: [
      'Undergo routine age-appropriate cancer screenings: Mammography (breast), Pap smear/HPV test (cervix), Colonoscopy (colorectal), and Low-dose CT for high-risk smokers',
      'Avoid all forms of tobacco and second-hand smoke exposure',
      'Protect skin from ultraviolet (UV) radiation with broad-spectrum sunscreens',
      'Receive recommended immunizations including HPV vaccine and Hepatitis B vaccine',
      'Maintain a nutritious diet rich in antioxidants, cruciferous vegetables, and minimize ultra-processed foods'
    ],
    warnings: [
      'Any unexplained persistent lump, sudden hemoptysis (coughing blood), rectal bleeding, post-menopausal bleeding, or rapid unintentional loss of >10% body weight requires urgent specialist evaluation by an oncologist.'
    ],
    content: `Cancer represents a large group of diseases characterized by abnormal cellular proliferation with potential to invade or spread to other tissue (metastasis).
American Cancer Society 'CAUTION' Early Warning Acronym:
- C: Change in bowel or bladder habits
- A: A sore that does not heal
- U: Unusual bleeding or discharge
- T: Thickening or lump in the breast, testicles, or elsewhere
- I: Indigestion or difficulty in swallowing
- O: Obvious change in the size, color, shape, or thickness of a wart, mole, or mouth sore
- N: Nagging cough or hoarseness
Treatment modalities include surgery, medical oncology (chemotherapy, targeted molecular therapy, immunotherapy), and radiation therapy tailored by multidisciplinary tumor boards.`,
    approved: true,
  },

  // 5. TUBERCULOSIS (TB)
  {
    sourceId: 'HMS-MED-PULMONOLOGY-001',
    version: '2.0',
    title: 'Tuberculosis (TB): Transmission, Diagnosis and DOTS Treatment',
    category: 'disease',
    symptoms: ['persistent cough lasting more than 2-3 weeks', 'coughing up blood hemoptysis', 'chest pain while breathing', 'evening rise of fever', 'night sweats', 'unexplained weight loss', 'loss of appetite', 'fatigue'],
    precautions: [
      'Ensure proper ventilation in living spaces to disperse airborne droplets',
      'Practice cough etiquette: cover nose and mouth with a tissue or elbow when coughing or sneezing',
      'Undergo household contact tracing if a family member is diagnosed with active pulmonary TB',
      'Complete the ENTIRE prescribed course of anti-TB medications without skipping a single dose'
    ],
    warnings: [
      'Premature discontinuation or irregular intake of anti-TB drugs can lead to Multi-Drug Resistant TB (MDR-TB), which requires prolonged, toxic, and expensive second-line therapy. Never stop medication without pulmonologist clearance.'
    ],
    content: `Tuberculosis is a bacterial communicable disease caused by Mycobacterium tuberculosis, primarily affecting the lungs (pulmonary TB), though it can infect any organ including lymph nodes, spine, brain, and kidneys (extrapulmonary TB).
Transmission occurs via airborne droplet nuclei generated when an individual with active pulmonary TB coughs, sneezes, or talks.
Diagnostic Modalities:
- Sputum Smear Microscopy for Acid-Fast Bacilli (AFB)
- GeneXpert MTB/RIF (Cartridge Based Nucleic Acid Amplification Test) for rapid detection of TB and Rifampicin resistance
- Chest X-Ray showing upper lobe infiltrates or cavitation
- Tuberculin Skin Test (Mantoux) or Interferon Gamma Release Assay (IGRA)
Management: Directly Observed Treatment Short-course (DOTS) utilizing fixed-dose combinations of First-Line Anti-TB Drugs: Isoniazid (H), Rifampicin (R), Pyrazinamide (Z), and Ethambutol (E) over 6 months.`,
    approved: true,
  },

  // 6. ASTHMA AND CHRONIC RESPIRATORY DISEASE
  {
    sourceId: 'HMS-MED-ASTHMA-001',
    version: '2.0',
    title: 'Bronchial Asthma: Triggers, Inhaler Techniques and Acute Flare Management',
    category: 'disease',
    symptoms: ['wheezing high pitched whistling sound', 'shortness of breath', 'chest tightness', 'nocturnal or early morning coughing', 'exercise-induced breathlessness'],
    precautions: [
      'Identify and minimize personal environmental triggers: pollen, dust mites, pet dander, tobacco smoke, cold air, strong perfumes, and air pollutants',
      'Use a spacer device with metered-dose inhalers (MDIs) to maximize drug deposition in lower airways',
      'Keep your quick-relief rescue inhaler (e.g. Salbutamol / Albuterol) accessible at all times',
      'Track Peak Expiratory Flow (PEF) using a home peak flow meter to monitor airway narrowing before symptoms become severe',
      'Stay updated on annual influenza and pneumococcal vaccinations'
    ],
    warnings: [
      'EMERGENCY: Severe asthma exacerbation characterized by inability to speak in full sentences, cyanosis (bluish lips or fingernails), silent chest (no breath sounds), or retractions (ribs/neck straining to breathe) requires immediate emergency hospitalization.'
    ],
    content: `Asthma is a chronic inflammatory disorder of the airways characterized by recurrent episodes of reversible airflow obstruction, bronchial hyperresponsiveness, and excessive mucus secretion.
Pharmacological Management:
- Controller / Maintenance Medications: Inhaled Corticosteroids (ICS) e.g., Budesonide, Fluticasone; Long-Acting Beta Agonists (LABA) e.g., Formoterol, Salmeterol; Leukotriene Receptor Antagonists.
- Reliever / Rescue Medications: Short-Acting Beta-2 Agonists (SABA) e.g., Salbutamol / Levosalbutamol for rapid bronchodilation during acute bronchospasm.
Never alter controller steroid doses without consulting your pulmonologist.`,
    approved: true,
  },

  // 7. CHRONIC KIDNEY DISEASE (CKD)
  {
    sourceId: 'HMS-MED-NEPHROLOGY-001',
    version: '2.0',
    title: 'Chronic Kidney Disease (CKD): Staging, Glomerular Filtration and Renal Care',
    category: 'disease',
    symptoms: ['often silent in early stages', 'swelling in feet ankles legs face edema', 'fatigue from anemia', 'frothy or foamy urine', 'decreased urine output or nocturia', 'nausea metallic taste in mouth', 'persistent skin itching', 'muscle cramps'],
    precautions: [
      'Strictly control underlying risk factors, especially hypertension and diabetes mellitus',
      'Avoid nephrotoxic substances: NEVER take over-the-counter NSAIDs (Ibuprofen, Diclofenac, Naproxen) chronically without nephrologist approval',
      'Follow renal dietary recommendations: moderate protein intake, limit dietary potassium, phosphorus, and sodium according to CKD stage',
      'Monitor fluid intake based on clinician advice if oliguria or edema is present',
      'Measure Serum Creatinine, Blood Urea Nitrogen (BUN), and Urine Albumin-to-Creatinine Ratio (uACR) every 3-6 months'
    ],
    warnings: [
      'Signs of Uremic Encephalopathy or Severe Fluid Overload (severe pulmonary edema, shortness of breath while lying flat, pericardial rub, profound confusion) represent medical emergencies requiring immediate dialysis assessment.'
    ],
    content: `Chronic Kidney Disease is defined by abnormalities of kidney structure or function present for greater than 3 months, with implications for health.
KDIGO Staging by Estimated Glomerular Filtration Rate (eGFR in mL/min/1.73m²):
- Stage 1: eGFR >= 90 with kidney damage (e.g. persistent proteinuria)
- Stage 2: eGFR 60-89 (mildly decreased)
- Stage 3a: eGFR 45-59 (mild to moderately decreased)
- Stage 3b: eGFR 30-44 (moderately to severely decreased)
- Stage 4: eGFR 15-29 (severely decreased; prep for renal replacement therapy)
- Stage 5: eGFR < 15 (End-Stage Renal Disease; requires maintenance hemodialysis, peritoneal dialysis, or kidney transplantation).`,
    approved: true,
  },

  // 8. LIVER DISEASES AND HEPATOLOGY
  {
    sourceId: 'HMS-MED-HEPATOLOGY-001',
    version: '2.0',
    title: 'Liver Disorders: Fatty Liver (NAFLD/MASLD), Hepatitis and Cirrhosis',
    category: 'disease',
    symptoms: ['yellowing of skin and eyes jaundice', 'dark colored tea colored urine', 'pale clay colored stools', 'abdominal swelling ascites', 'right upper quadrant pain tenderness', 'chronic fatigue', 'easy bruising and bleeding', 'itchy skin pruritus'],
    precautions: [
      'Limit or eliminate alcoholic beverages to prevent toxic hepatocyte injury',
      'For Non-Alcoholic Fatty Liver Disease (NAFLD): achieve gradual weight loss (7-10% body weight reduction) via balanced nutrition and physical activity',
      'Get vaccinated against Hepatitis A and Hepatitis B',
      'Avoid indiscriminate herbal supplements and excessive Acetaminophen (Paracetamol) > 2-3g daily to prevent acute liver injury',
      'Undergo periodic abdominal ultrasound and Liver Function Tests (LFT)'
    ],
    warnings: [
      'Vomiting blood (hematemesis from esophageal varices), black tarry stools (melena), acute mental confusion or inverted sleep-wake cycle (hepatic encephalopathy) are life-threatening complications of decompensated cirrhosis requiring immediate ICU admission.'
    ],
    content: `The liver performs over 500 vital metabolic, synthetic, and detoxifying functions.
Major Liver Conditions:
- Metabolic Dysfunction-Associated Steatotic Liver Disease (MASLD / Fatty Liver): Hepatic lipid accumulation linked to metabolic syndrome, obesity, and insulin resistance.
- Viral Hepatitis (A, B, C, D, E): Infectious inflammation of liver parenchyma.
- Cirrhosis: Late-stage progressive fibrosis replacing healthy parenchyma with regenerative nodules and fibrous scar tissue, leading to portal hypertension.
Laboratory Evaluation: Serum Bilirubin (Total & Direct), Aspartate Aminotransferase (AST/SGOT), Alanine Aminotransferase (ALT/SGPT), Alkaline Phosphatase (ALP), Gamma-Glutamyl Transferase (GGT), Serum Albumin, and Prothrombin Time/INR.`,
    approved: true,
  },

  // 9. DERMATOLOGY AND SKIN CONDITIONS
  {
    sourceId: 'HMS-MED-DERMATOLOGY-001',
    version: '2.0',
    title: 'Dermatology: Eczema, Psoriasis, Fungal Infections and Skin Lesion Care',
    category: 'disease',
    symptoms: ['intense itching pruritus', 'red inflamed erythematous patches', 'silvery scaly plaques', 'ring-shaped lesions with clear center tinea', 'skin peeling cracking oozing', 'blisters vesicles', 'burning sensation'],
    precautions: [
      'Keep skin hydrated by applying unscented emollient creams or ointments within 3 minutes of bathing',
      'Bathe in lukewarm water rather than hot water, avoiding harsh sulfates or fragrant soaps',
      'Wear loose-fitting, breathable cotton clothing to prevent friction and sweat buildup',
      'For fungal infections (e.g. Ringworm, Athlete foot): keep affected areas completely dry and do not share towels or combs',
      'Never apply high-potency topical steroid creams to the face or groin without explicit dermatologist prescription'
    ],
    warnings: [
      'Seek prompt clinical review for rapidly spreading skin redness with high fever (cellulitis), skin blistering over a large body surface area (possible Stevens-Johnson syndrome / TEN), or changing moles (asymmetry, irregular border, multiple colors, diameter >6mm indicating possible melanoma).'
    ],
    content: `Dermatology addresses diseases of the skin, hair, nails, and mucous membranes.
Common Inflammatory and Infectious Skin Conditions:
- Atopic Dermatitis (Eczema): Chronic relapsing pruritic dermatitis linked to skin barrier dysfunction and immune dysregulation.
- Psoriasis: Autoimmune accelerated keratinocyte turnover producing well-demarcated erythematous plaques with thick silvery scales, commonly over extensor surfaces (knees, elbows, scalp).
- Dermatophytosis (Tinea / Ringworm): Fungal infection of keratinized tissue (Tinea corporis, Tinea cruris, Tinea pedis).
- Contact Dermatitis: Irritant or allergic reaction to external substances like nickel, cosmetics, or plants.`,
    approved: true,
  },

  // 10. NEUROLOGICAL DISORDERS
  {
    sourceId: 'HMS-MED-NEUROLOGY-001',
    version: '2.0',
    title: 'Neurology: Stroke FAST Protocol, Migraines, Epilepsy and Neuropathies',
    category: 'disease',
    symptoms: ['sudden facial weakness drooping', 'unilateral arm leg weakness or paralysis', 'speech difficulty slurring aphasia', 'sudden severe thunderclap headache', 'throbbing one-sided headache with aura nausea photophobia', 'unprovoked seizures convulsions', 'numbness tingling pins and needles', 'loss of balance coordination'],
    precautions: [
      'Manage vascular risk factors (hypertension, smoking, diabetes, hyperlipidemia) to prevent cerebrovascular events',
      'For Migraines: maintain a headache diary to identify dietary, hormonal, sleep, and stress triggers; take abortive triptans or preventive therapy as prescribed',
      'For Epilepsy: take anticonvulsants consistently; ensure adequate sleep and avoid seizure triggers like flashing lights or extreme exhaustion'
    ],
    warnings: [
      'ACUTE STROKE EMERGENCY (FAST): Face drooping, Arm weakness, Speech difficulty, Time to call 112 immediately. Intravenous thrombolysis must be administered within the 4.5-hour golden window of symptom onset to save brain tissue.'
    ],
    content: `Neurology encompasses disorders of the central (brain, spinal cord) and peripheral nervous systems.
Key Conditions:
- Acute Ischemic Stroke & Intracerebral Hemorrhage: Interruption of cerebral blood flow causing focal neurological deficit.
- Migraine: Neurovascular headache disorder characterized by unilateral, throbbing moderate-to-severe pain, often with nausea, vomiting, photophobia, and phonophobia.
- Epilepsy: Neurological condition featuring recurrent unprovoked seizures arising from abnormal synchronous neuronal firing in the cerebral cortex.
- Peripheral Neuropathy: Damage to peripheral nerves commonly secondary to diabetes, nutritional deficiencies (B12), or toxins.`,
    approved: true,
  },

  // 11. BONE AND JOINT DISORDERS
  {
    sourceId: 'HMS-MED-ORTHOPEDICS-001',
    version: '2.0',
    title: 'Orthopedics: Osteoarthritis, Rheumatoid Arthritis, Osteoporosis and Joint Health',
    category: 'disease',
    symptoms: ['joint pain stiffness after rest', 'morning joint stiffness lasting over 30-60 minutes', 'joint swelling redness warmth', 'crepitus cracking sensation on movement', 'reduced range of motion', 'bone tenderness back pain stooped posture'],
    precautions: [
      'Perform regular low-impact joint exercises: swimming, cycling, and resistance training to strengthen surrounding musculature',
      'Maintain an optimal body weight to significantly reduce mechanical stress on weight-bearing joints (knees, hips)',
      'Ensure adequate daily dietary intake of Calcium (1,000-1,200 mg) and Vitamin D3 (600-2,000 IU)',
      'Undergo Bone Mineral Density (DEXA) scans for post-menopausal women or older adults to evaluate osteoporosis risk'
    ],
    warnings: [
      'Acute single-joint swelling with excruciating pain, redness, high fever, and inability to bear weight suggests possible Septic Arthritis or Acute Gouty Attack, requiring urgent joint fluid aspiration and clinician evaluation.'
    ],
    content: `Orthopedic disorders affect the musculoskeletal system: bones, joints, ligaments, tendons, and muscles.
Primary Conditions:
- Osteoarthritis (OA): Degenerative joint disease involving progressive breakdown of articular cartilage, subchondral bone remodeling, and osteophyte formation.
- Rheumatoid Arthritis (RA): Chronic systemic autoimmune disease featuring symmetrical inflammatory polyarthritis, synovial hypertrophy (pannus), and progressive joint erosions. Key markers: Rheumatoid Factor (RF) and Anti-CCP.
- Osteoporosis: Skeletal disorder characterized by compromised bone strength predisposing to an increased risk of fragility fractures (hip, spine, wrist). T-score <= -2.5 on DEXA scan.`,
    approved: true,
  },

  // 12. LABORATORY INVESTIGATIONS AND REFERENCE INTERVALS
  {
    sourceId: 'HMS-MED-LABORATORY-001',
    version: '2.0',
    title: 'Clinical Laboratory Panels: Complete Blood Count, Metabolic Profiles and Reference Values',
    category: 'education',
    symptoms: ['anemia', 'infection', 'thrombocytopenia', 'leukocytosis', 'electrolyte imbalance', 'elevated liver enzymes', 'abnormal creatinine'],
    precautions: [
      'Observe required fasting instructions (typically 8-12 hours for lipid profiles and fasting blood glucose)',
      'Inform laboratory staff of all active prescription drugs, over-the-counter medications, and supplements that may influence test values',
      'Discuss test results in clinical context with your attending doctor; isolated numerical deviations do not equate to a diagnosis'
    ],
    warnings: [
      'Critically abnormal values (e.g., Hemoglobin < 7 g/dL, Platelets < 20,000/uL, Potassium < 2.5 or > 6.0 mEq/L, Blood Glucose < 50 mg/dL or > 400 mg/dL) require immediate hospital emergency notification and urgent medical intervention.'
    ],
    content: `Standard Clinical Laboratory Panels & Reference Intervals (Adult Reference Norms):
1. Complete Blood Count (CBC):
- Hemoglobin (Hb): Men 13.5 - 17.5 g/dL; Women 12.0 - 15.5 g/dL
- Total Leukocyte Count (WBC): 4,000 - 11,000 cells/mcL
- Platelet Count: 150,000 - 450,000 /mcL
- Hematocrit (PCV): Men 41% - 50%; Women 36% - 46%
2. Kidney Function Test (KFT / RFT):
- Serum Creatinine: 0.7 - 1.3 mg/dL (men); 0.5 - 1.1 mg/dL (women)
- Blood Urea Nitrogen (BUN): 7 - 20 mg/dL
- Serum Uric Acid: 3.5 - 7.2 mg/dL
3. Liver Function Test (LFT):
- Total Bilirubin: 0.2 - 1.2 mg/dL
- SGOT (AST): 10 - 40 U/L
- SGPT (ALT): 7 - 56 U/L
- Alkaline Phosphatase (ALP): 44 - 147 U/L
- Total Protein: 6.0 - 8.3 g/dL; Albumin: 3.5 - 5.0 g/dL
4. Lipid Profile:
- Total Cholesterol: Desirable < 200 mg/dL
- LDL Cholesterol: Optimal < 100 mg/dL
- HDL Cholesterol: High (Protective) > 50 mg/dL (women), > 40 mg/dL (men)
- Serum Triglycerides: Normal < 150 mg/dL
5. Thyroid Profile:
- TSH: 0.4 - 4.2 uIU/mL
- Free T4: 0.8 - 1.8 ng/dL; Free T3: 2.3 - 4.2 pg/mL`,
    approved: true,
  },

  // 13. SPECIALIZATIONS DIRECTORY
  {
    sourceId: 'HMS-MED-SPECIALTIES-001',
    version: '2.0',
    title: 'Hospital Medical Specialties and Clinical Departments at Kushal Hospitals',
    category: 'education',
    symptoms: ['specialist lookup', 'find doctor', 'department inquiry'],
    precautions: ['Consult a General Physician for initial triage and specialist referral when symptoms are diffuse or undiagnosed'],
    warnings: ['For sudden trauma, chest pain, or stroke, proceed directly to the 24x7 Emergency Department without waiting for an outpatient appointment'],
    content: `Clinical Departments & Specialties Available at Kushal Hospitals:
- Cardiology: Disorders of heart and vascular system (angina, hypertension, arrhythmia, heart failure).
- Neurology: Disorders of the brain, spinal cord, nerves, and muscles (stroke, epilepsy, migraine, neuropathy).
- Dermatology: Skin, hair, nail, and cosmetic disorders (acne, eczema, psoriasis, fungal infections).
- Orthopedics: Musculoskeletal trauma, joint replacements, sports injuries, spine care, arthritis.
- General Medicine: Comprehensive primary adult care, diabetes, hypertension, infectious diseases, preventive health.
- Pediatrics: Comprehensive medical care for infants, children, and adolescents, including developmental assessment and immunizations.
- Gynecology & Obstetrics: Women's reproductive health, prenatal/maternal care, deliveries, menstrual disorders.
- Oncology: Multidisciplinary cancer care (medical, surgical, radiation oncology, hematology).
- ENT (Otorhinolaryngology): Ear, nose, throat, sinuses, head and neck conditions.
- Ophthalmology: Eye care, visual testing, cataracts, glaucoma, refractive surgery.
- Psychiatry: Mental health conditions, depression, anxiety disorders, bipolar disorder, psychotherapy.
- Urology: Urinary tract conditions in men and women, and male reproductive health (kidney stones, prostate, incontinence).`,
    approved: true,
  },

  // 14. EMERGENCY RED-FLAG PROTOCOL
  {
    sourceId: 'HMS-MED-EMERGENCY-PROTOCOL-001',
    version: '2.0',
    title: 'Emergency Red-Flag Symptoms & Immediate Hospital Action Protocol',
    category: 'education',
    symptoms: ['chest pain', 'severe breathlessness', 'choking', 'unconsciousness', 'profuse bleeding', 'seizures', 'severe burns', 'suspected poisoning', 'acute paralysis', 'anaphylaxis'],
    precautions: [
      'Call National Emergency 112 or Kushal Hospitals 24x7 Emergency line immediately',
      'Do not attempt to drive yourself; arrange an ambulance with trained paramedics',
      'Loosen tight clothing, stay calm, and ensure the airway remains open and unobstructed'
    ],
    warnings: [
      'These conditions represent immediate life threats. Every minute counts. Do not wait or search online when red-flag emergency symptoms are present.'
    ],
    content: `Kushal Hospitals 24x7 Emergency Department Protocol:
Red-flag indicators requiring immediate ambulance dispatch or emergency resuscitation:
1. Chest Pain or Discomfort: Crushing retrosternal sensation radiating to arm or jaw.
2. Acute Severe Dyspnea: Gasping, blue discoloration, inability to speak.
3. Neurological Deficits: Sudden loss of consciousness, facial drop, arm weakness, inability to speak (FAST).
4. Major Hemorrhage: Uncontrolled bleeding not stopping with direct pressure.
5. Severe Allergic Reaction (Anaphylaxis): Swelling of tongue/lips, hives, airway constriction.
6. Suspected Poisoning or Drug Overdose.
General Emergency Number (India): 112.
Kushal Hospitals Emergency Ambulance: Available directly in the app or via 24x7 Emergency Helpline.`,
    approved: true,
  }
];

module.exports = { comprehensiveKnowledgeBase };
