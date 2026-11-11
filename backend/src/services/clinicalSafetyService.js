// Clinical safety service for drug interactions, allergy warnings, and duplicates

const DRUG_INTERACTIONS = [
  {
    drugs: ['warfarin', 'aspirin'],
    severity: 'severe',
    description: 'Concurrent use of Warfarin and Aspirin significantly increases the risk of severe gastrointestinal and internal bleeding.',
    recommendation: 'Avoid combination unless closely monitored by cardiology/hematology with frequent INR checks.',
  },
  {
    drugs: ['warfarin', 'ibuprofen'],
    severity: 'severe',
    description: 'NSAIDs like Ibuprofen increase bleeding risk and may cause gastric ulceration in patients taking Warfarin.',
    recommendation: 'Use Paracetamol for pain relief or add gastric protection if NSAID is essential.',
  },
  {
    drugs: ['metformin', 'contrast'],
    severity: 'severe',
    description: 'Iodinated radiocontrast with Metformin may precipitate contrast-induced nephropathy and severe lactic acidosis.',
    recommendation: 'Withhold Metformin 48 hours before and after radiocontrast imaging; verify renal function before restarting.',
  },
  {
    drugs: ['amoxicillin', 'methotrexate'],
    severity: 'moderate',
    description: 'Penicillins decrease the renal clearance of Methotrexate, increasing the risk of Methotrexate toxicity.',
    recommendation: 'Monitor complete blood count and serum methotrexate levels closely.',
  },
  {
    drugs: ['ibuprofen', 'ramipril'],
    severity: 'moderate',
    description: 'NSAIDs attenuate the antihypertensive effect of ACE inhibitors and increase the risk of acute renal impairment.',
    recommendation: 'Monitor blood pressure and serum creatinine / potassium levels.',
  },
  {
    drugs: ['ibuprofen', 'enalapril'],
    severity: 'moderate',
    description: 'NSAIDs attenuate the antihypertensive effect of ACE inhibitors and increase the risk of acute renal impairment.',
    recommendation: 'Monitor renal function and blood pressure regularly.',
  },
  {
    drugs: ['ciprofloxacin', 'theophylline'],
    severity: 'severe',
    description: 'Ciprofloxacin inhibits theophylline clearance via CYP1A2, potentially causing cardiac arrhythmias and seizures.',
    recommendation: 'Reduce theophylline dosage by 50% and monitor plasma concentrations.',
  },
  {
    drugs: ['atorvastatin', 'clarithromycin'],
    severity: 'severe',
    description: 'Clarithromycin strongly inhibits CYP3A4, substantially increasing Atorvastatin exposure and rhabdomyolysis risk.',
    recommendation: 'Temporarily withhold Atorvastatin while taking Clarithromycin, or use Azithromycin.',
  },
  {
    drugs: ['tramadol', 'fluoxetine'],
    severity: 'severe',
    description: 'Combined use increases the risk of Serotonin Syndrome and lowers the seizure threshold.',
    recommendation: 'Avoid combination or monitor for autonomic instability, hyperreflexia, and agitation.',
  },
  {
    drugs: ['paracetamol', 'ibuprofen'],
    severity: 'mild',
    description: 'Co-administration of Paracetamol and Ibuprofen is generally safe for short-term multimodal analgesia but requires caution with cumulative doses.',
    recommendation: 'Adhere to maximum daily doses for each medication (Paracetamol <= 4g/day, Ibuprofen <= 1200mg/day).',
  },
];

const ALLERGY_MAP = {
  penicillin: ['amoxicillin', 'ampicillin', 'penicillin', 'augmentin', 'piperacillin', 'ceftriaxone'],
  amoxicillin: ['amoxicillin', 'ampicillin', 'penicillin', 'augmentin'],
  sulfa: ['sulfamethoxazole', 'bactrim', 'septra', 'sulfasalazine'],
  nsaid: ['ibuprofen', 'aspirin', 'naproxen', 'diclofenac', 'indomethacin', 'ketorolac'],
  aspirin: ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac'],
  paracetamol: ['paracetamol', 'acetaminophen', 'dolo', 'crocin', 'calpol'],
  ciprofloxacin: ['ciprofloxacin', 'levofloxacin', 'ofloxacin', 'norfloxacin'],
  cephalosporin: ['cephalexin', 'ceftriaxone', 'cefixime', 'cefuroxime'],
};

const normalizeName = (name) => String(name || '').toLowerCase().trim();

/**
 * Checks for drug-drug interactions in a list of medicines.
 */
function checkDrugInteractions(medicines = []) {
  const warnings = [];
  const names = medicines.map((m) => normalizeName(typeof m === 'string' ? m : m.medicineName || m.name));

  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const drug1 = names[i];
      const drug2 = names[j];

      for (const interaction of DRUG_INTERACTIONS) {
        const matchesDrug1 = interaction.drugs.some((d) => drug1.includes(d));
        const matchesDrug2 = interaction.drugs.some((d) => drug2.includes(d));

        if (matchesDrug1 && matchesDrug2) {
          warnings.push({
            drugPair: [drug1, drug2],
            severity: interaction.severity,
            description: interaction.description,
            recommendation: interaction.recommendation,
          });
        }
      }
    }
  }

  return warnings;
}

/**
 * Checks for conflicts between patient allergies and prescribed medicines.
 */
function checkAllergyConflicts(medicines = [], patientAllergies = []) {
  const alerts = [];
  const medNames = medicines.map((m) => normalizeName(typeof m === 'string' ? m : m.medicineName || m.name));

  for (const allergy of patientAllergies) {
    const allergen = normalizeName(typeof allergy === 'string' ? allergy : allergy.allergen || allergy.name);
    if (!allergen) continue;

    for (const medName of medNames) {
      // Direct match
      if (medName.includes(allergen) || allergen.includes(medName)) {
        alerts.push({
          medication: medName,
          allergen,
          severity: allergy.severity || 'severe',
          reaction: allergy.reaction || 'Hypersensitivity / Anaphylaxis risk',
          message: `CRITICAL ALLERGY ALERT: Patient has documented allergy to "${allergen}". Prescribed medication "${medName}" may trigger severe allergic reaction.`,
        });
        continue;
      }

      // Group cross-reaction match
      for (const [groupKey, groupMeds] of Object.entries(ALLERGY_MAP)) {
        if (allergen.includes(groupKey) || groupKey.includes(allergen)) {
          if (groupMeds.some((gm) => medName.includes(gm))) {
            alerts.push({
              medication: medName,
              allergen,
              severity: allergy.severity || 'severe',
              reaction: allergy.reaction || 'Cross-reactive hypersensitivity risk',
              message: `CROSS-REACTIVITY ALERT: Patient is allergic to "${allergen}" (${groupKey} class). Prescribed drug "${medName}" carries cross-allergy risk.`,
            });
          }
        }
      }
    }
  }

  return alerts;
}

/**
 * Checks for duplicate medicines in prescription.
 */
function checkDuplicateMedicines(medicines = []) {
  const seen = new Set();
  const duplicates = [];

  for (const m of medicines) {
    const name = normalizeName(typeof m === 'string' ? m : m.medicineName || m.name);
    if (!name) continue;
    // Extract primary active molecule (first word or stripped dosage)
    const baseName = name.replace(/\d+\s*(mg|ml|g|mcg|iu).*/i, '').trim();

    if (seen.has(baseName)) {
      duplicates.push({
        medicineName: name,
        baseName,
        message: `DUPLICATE WARNING: "${name}" appears to be a duplicate or same class medication in this prescription.`,
      });
    } else {
      seen.add(baseName);
    }
  }

  return duplicates;
}

module.exports = {
  checkDrugInteractions,
  checkAllergyConflicts,
  checkDuplicateMedicines,
};
