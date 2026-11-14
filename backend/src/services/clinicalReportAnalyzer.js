/**
 * Clinical Report Analyzer Engine
 * Parses laboratory report text, identifies measured test parameters and values,
 * compares against reference intervals, flags abnormalities, and provides structured explanations.
 */

const TEST_DEFINITIONS = [
  // --- COMPLETE BLOOD COUNT (CBC) ---
  {
    key: 'hemoglobin',
    patterns: [/\b(?:hemoglobin|haemoglobin|hb|hgb)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Hemoglobin (Hb)',
    unit: 'g/dL',
    low: 12.0,
    high: 17.5,
    criticalLow: 7.0,
    criticalHigh: 20.0,
    description: 'Protein in red blood cells that transports oxygen from lungs throughout the body.',
    lowReason: 'May indicate anemia (iron deficiency, vitamin B12 deficiency), blood loss, bone marrow suppression, or chronic illness.',
    highReason: 'May indicate chronic hypoxia, dehydration, congenital heart disease, polycythemia vera, or heavy smoking.',
  },
  {
    key: 'wbc',
    patterns: [/\b(?:wbc|tlc|total\s+leukocyte\s+count|white\s+blood\s+cell(?:s)?)\b[:\s=-]*([0-9]+(?:,[0-9]+)?(?:\.[0-9]+)?)/i],
    name: 'Total Leukocyte Count (WBC)',
    unit: 'cells/mcL',
    low: 4000,
    high: 11000,
    criticalLow: 2000,
    criticalHigh: 30000,
    normalize: (val) => val > 100 ? val : val * 1000,
    description: 'Immune cells that defend the body against infectious organisms and foreign substances.',
    lowReason: 'Leukopenia may suggest viral infection, autoimmune condition, bone marrow suppression, or drug effect.',
    highReason: 'Leukocytosis commonly indicates acute bacterial infection, systemic inflammation, physical stress, tissue trauma, or hematologic disorder.',
  },
  {
    key: 'platelets',
    patterns: [/\b(?:platelet(?:s)?(?:\s+count)?|plt)\b[:\s=-]*([0-9]+(?:,[0-9]+)?(?:\.[0-9]+)?)/i],
    name: 'Platelet Count',
    unit: 'mcL',
    low: 150000,
    high: 450000,
    criticalLow: 20000,
    criticalHigh: 1000000,
    normalize: (val) => val > 1000 ? val : val * 100000,
    description: 'Cellular fragments critical for physiological blood clotting and wound repair.',
    lowReason: 'Thrombocytopenia increases bleeding risk; causes include viral illness (e.g. dengue), autoimmune destruction (ITP), splenic sequestration, or medications.',
    highReason: 'Thrombocytosis may occur reactively after acute infection, chronic inflammation, iron deficiency, or primary bone marrow disease.',
  },
  {
    key: 'rbc',
    patterns: [/\b(?:rbc(?:\s+count)?|red\s+blood\s+cell(?:s)?)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Red Blood Cell (RBC) Count',
    unit: 'million/mcL',
    low: 4.0,
    high: 5.9,
    description: 'Total number of circulating red blood cells carrying oxygen.',
    lowReason: 'Indicates anemia, hemolysis, or bone marrow insufficiency.',
    highReason: 'Indicates polycythemia, chronic pulmonary hypoxia, or dehydration.',
  },
  {
    key: 'pcv',
    patterns: [/\b(?:packed\s+cell\s+volume|pcv|hematocrit|hct)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Hematocrit (PCV)',
    unit: '%',
    low: 36.0,
    high: 50.0,
    description: 'Percentage of blood volume occupied by red blood cells.',
    lowReason: 'Indicates hemodilution, bleeding, or nutritional anemia.',
    highReason: 'Indicates hemoconcentration (dehydration) or polycythemia.',
  },

  // --- GLYCEMIC / DIABETES ---
  {
    key: 'fbs',
    patterns: [/\b(?:fasting\s+(?:blood\s+)?(?:glucose|sugar)|fbs)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Fasting Blood Glucose (FBS)',
    unit: 'mg/dL',
    low: 70,
    high: 99,
    criticalLow: 50,
    criticalHigh: 300,
    description: 'Circulating blood glucose measured after an overnight fast (minimum 8 hours).',
    lowReason: 'Hypoglycemia: excess diabetic medication, prolonged starvation, intense unaccustomed exercise, or insulinoma.',
    highReason: '100-125 mg/dL indicates Impaired Fasting Glucose (Prediabetes); >= 126 mg/dL on repeated testing suggests Diabetes Mellitus.',
  },
  {
    key: 'ppbs',
    patterns: [/\b(?:post\s+prandial\s+(?:blood\s+)?(?:glucose|sugar)|ppbs|2\s*hr\s*pp)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Post-Prandial Glucose (PPBS)',
    unit: 'mg/dL',
    low: 70,
    high: 139,
    criticalHigh: 350,
    description: 'Circulating blood glucose measured precisely 2 hours following a meal.',
    lowReason: 'Reactive hypoglycemia or excess medication.',
    highReason: '140-199 mg/dL indicates Impaired Glucose Tolerance; >= 200 mg/dL indicates Diabetes.',
  },
  {
    key: 'hba1c',
    patterns: [/\b(?:hba1c|glycated\s+hemoglobin|glycosylated\s+hemoglobin|a1c)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Glycated Hemoglobin (HbA1c)',
    unit: '%',
    low: 4.0,
    high: 5.6,
    criticalHigh: 12.0,
    description: 'Reflects average blood glucose concentration over the preceding 2-3 months.',
    lowReason: 'May reflect recurrent hypoglycemia, hemolytic anemia, or hemoglobin variants.',
    highReason: '5.7%-6.4% indicates Prediabetes; >= 6.5% confirms Diabetes Mellitus. In known diabetics, targets are individualized (usually < 7.0%).',
  },

  // --- KIDNEY FUNCTION TEST (KFT / RFT) ---
  {
    key: 'creatinine',
    patterns: [/\b(?:serum\s+)?creatinine\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Serum Creatinine',
    unit: 'mg/dL',
    low: 0.6,
    high: 1.2,
    criticalHigh: 4.0,
    description: 'Waste product from muscle metabolism filtered entirely by healthy renal glomeruli.',
    lowReason: 'Reduced muscle mass, severe malnutrition, or advanced liver disease.',
    highReason: 'Key indicator of renal impairment (acute kidney injury or chronic kidney disease), severe dehydration, urinary tract obstruction, or nephrotoxic medications.',
  },
  {
    key: 'blood_urea',
    patterns: [/\b(?:blood\s+urea(?:\s+nitrogen)?|bun|urea)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Blood Urea / BUN',
    unit: 'mg/dL',
    low: 15,
    high: 45,
    criticalHigh: 100,
    description: 'Byproduct of protein catabolism produced by the liver and excreted by kidneys.',
    lowReason: 'Low protein diet, overhydration, or severe liver dysfunction.',
    highReason: 'Renal dysfunction, hypovolemia/dehydration, upper gastrointestinal bleeding, or high protein catabolism.',
  },
  {
    key: 'uric_acid',
    patterns: [/\b(?:serum\s+)?uric\s+acid\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Serum Uric Acid',
    unit: 'mg/dL',
    low: 3.5,
    high: 7.2,
    description: 'End product of purine nucleotide degradation.',
    lowReason: 'Rarely clinically significant; seen in Wilson disease or Fanconi syndrome.',
    highReason: 'Hyperuricemia predisposes to Gout (acute inflammatory arthritis) and urate nephrolithiasis (kidney stones).',
  },

  // --- LIVER FUNCTION TEST (LFT) ---
  {
    key: 'bilirubin_total',
    patterns: [/\b(?:total\s+bilirubin|bilirubin\s+total|s\.?\s*bilirubin)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Total Bilirubin',
    unit: 'mg/dL',
    low: 0.2,
    high: 1.2,
    criticalHigh: 15.0,
    description: 'Yellow breakdown pigment of heme catabolism processed by hepatocytes.',
    lowReason: 'Not clinically concerning.',
    highReason: 'Causes clinical jaundice (yellow eyes/skin); causes include biliary obstruction, viral hepatitis, hemolysis, or Gilbert syndrome.',
  },
  {
    key: 'sgpt',
    patterns: [/\b(?:sgpt|alt|alanine\s+aminotransferase)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'SGPT / ALT',
    unit: 'U/L',
    low: 7,
    high: 56,
    criticalHigh: 500,
    description: 'Enzyme primarily localized in liver cells; highly specific marker of hepatocellular injury.',
    lowReason: 'Normal physiological finding.',
    highReason: 'Suggests hepatocellular injury: non-alcoholic fatty liver disease (NAFLD), viral hepatitis, alcohol consumption, drug-induced hepatotoxicity, or ischemic hepatitis.',
  },
  {
    key: 'sgot',
    patterns: [/\b(?:sgot|ast|aspartate\s+aminotransferase)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'SGOT / AST',
    unit: 'U/L',
    low: 10,
    high: 40,
    criticalHigh: 500,
    description: 'Enzyme found in liver, cardiac myocytes, skeletal muscle, and kidneys.',
    lowReason: 'Normal physiological finding.',
    highReason: 'Liver injury, strenuous unaccustomed exercise, acute myocardial infarction, or skeletal muscle trauma.',
  },
  {
    key: 'alp',
    patterns: [/\b(?:alkaline\s+phosphatase|alk\s+phos|alp)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Alkaline Phosphatase (ALP)',
    unit: 'U/L',
    low: 44,
    high: 147,
    description: 'Enzyme associated with biliary tract epithelium and active bone osteoblasts.',
    lowReason: 'Nutritional zinc deficiency or hypophosphatasia.',
    highReason: 'Biliary tree obstruction (gallstones, stricture), infiltrative liver disease, or high bone turnover (Paget disease, healing fractures, adolescents).',
  },

  // --- LIPID PROFILE ---
  {
    key: 'cholesterol_total',
    patterns: [/\b(?:total\s+cholesterol|serum\s+cholesterol)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Total Cholesterol',
    unit: 'mg/dL',
    low: 120,
    high: 200,
    description: 'Total circulating sterol molecules essential for cell membranes and steroid hormones.',
    lowReason: 'Hyperthyroidism, severe malnutrition, or malabsorption.',
    highReason: 'Hypercholesterolemia accelerates atherosclerotic plaque formation, elevating risk of coronary artery disease and ischemic stroke.',
  },
  {
    key: 'triglycerides',
    patterns: [/\b(?:triglycerides|tg|serum\s+triglycerides)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Serum Triglycerides',
    unit: 'mg/dL',
    low: 50,
    high: 150,
    criticalHigh: 500,
    description: 'Storage form of excess dietary fat and carbohydrates circulating in lipoproteins.',
    lowReason: 'Low-fat diet, malnutrition, or hyperthyroidism.',
    highReason: 'Hypertriglyceridemia is linked to metabolic syndrome, obesity, uncontrolled diabetes; severe elevation (>500 mg/dL) risks acute pancreatitis.',
  },
  {
    key: 'ldl',
    patterns: [/\b(?:ldl(?:\s+cholesterol)?|bad\s+cholesterol)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'LDL Cholesterol',
    unit: 'mg/dL',
    low: 40,
    high: 100,
    description: 'Low-Density Lipoprotein ("bad" cholesterol) that deposits lipids into arterial walls.',
    lowReason: 'Optimal or seen in intensive lipid-lowering therapy.',
    highReason: 'Major atherogenic risk factor for coronary heart disease, stroke, and peripheral arterial disease.',
  },
  {
    key: 'hdl',
    patterns: [/\b(?:hdl(?:\s+cholesterol)?|good\s+cholesterol)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'HDL Cholesterol',
    unit: 'mg/dL',
    low: 40,
    high: 90,
    description: 'High-Density Lipoprotein ("good" cholesterol) mediating reverse cholesterol transport back to liver.',
    lowReason: 'Increases cardiovascular risk; associated with physical inactivity, smoking, obesity, and diabetes.',
    highReason: 'Cardioprotective factor against coronary atherosclerosis.',
  },

  // --- THYROID PROFILE ---
  {
    key: 'tsh',
    patterns: [/\b(?:tsh|thyroid\s+stimulating\s+hormone)\b[:\s=-]*([0-9]+(?:\.[0-9]+)?)/i],
    name: 'Thyroid Stimulating Hormone (TSH)',
    unit: 'uIU/mL',
    low: 0.4,
    high: 4.2,
    criticalLow: 0.05,
    criticalHigh: 20.0,
    description: 'Pituitary hormone directing the thyroid gland to produce thyroxine (T4) and triiodothyronine (T3).',
    lowReason: 'Primary Hyperthyroidism (Grave\'s disease, toxic adenoma) or excessive thyroid hormone replacement. Symptoms include palpitations, weight loss, heat intolerance.',
    highReason: 'Primary Hypothyroidism (Hashimoto thyroiditis, iodine deficiency). Symptoms include fatigue, weight gain, cold intolerance, dry skin, constipation.',
  },
];

/**
 * Extracts and analyzes clinical report parameters from raw text.
 */
function analyzeReportText(text) {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      message: 'No text provided for analysis.',
    };
  }

  const cleanText = text.replace(/,/g, '');
  const findings = [];

  for (const def of TEST_DEFINITIONS) {
    for (const pattern of def.patterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        let value = parseFloat(match[1]);
        if (isNaN(value)) continue;

        if (def.normalize) {
          value = def.normalize(value);
        }

        let status = 'NORMAL';
        let isCritical = false;

        if (def.criticalLow !== undefined && value <= def.criticalLow) {
          status = 'CRITICAL_LOW';
          isCritical = true;
        } else if (def.criticalHigh !== undefined && value >= def.criticalHigh) {
          status = 'CRITICAL_HIGH';
          isCritical = true;
        } else if (value < def.low) {
          status = 'LOW';
        } else if (value > def.high) {
          status = 'HIGH';
        }

        findings.push({
          key: def.key,
          name: def.name,
          value,
          unit: def.unit,
          referenceRange: `${def.low} - ${def.high} ${def.unit}`,
          status,
          isCritical,
          description: def.description,
          clinicalExplanation:
            status === 'LOW' || status === 'CRITICAL_LOW'
              ? def.lowReason
              : status === 'HIGH' || status === 'CRITICAL_HIGH'
              ? def.highReason
              : 'Within the expected standard physiological reference interval.',
        });
        break; // Match first valid pattern per test
      }
    }
  }

  const normalCount = findings.filter((f) => f.status === 'NORMAL').length;
  const abnormalCount = findings.filter((f) => f.status !== 'NORMAL').length;
  const criticalCount = findings.filter((f) => f.isCritical).length;

  return {
    success: true,
    totalTestsDetected: findings.length,
    summary: {
      normal: normalCount,
      abnormal: abnormalCount,
      critical: criticalCount,
    },
    findings,
  };
}

/**
 * Formats report analysis findings into a professional markdown explanation.
 */
function formatReportMarkdown(analysisResult) {
  if (!analysisResult.success || !analysisResult.findings.length) {
    return `### Medical Report Text Extraction
No standard laboratory parameters could be definitively identified from the provided document text. 
Please ensure the uploaded document is a legible medical laboratory report (such as a Complete Blood Count, Liver Function Test, Kidney Function Test, Lipid Profile, or Thyroid Panel).

*Clinical Note: You can discuss any laboratory report directly with our hospital specialists.*`;
  }

  const { findings, summary } = analysisResult;

  let md = `### 📋 Clinical Laboratory Report Analysis\n\n`;
  md += `**Detected Parameters:** ${findings.length} test(s) identified (${summary.normal} Normal, ${summary.abnormal} Outside Standard Reference Interval${summary.critical > 0 ? `, ⚠️ **${summary.critical} Critical**` : ''}).\n\n`;

  // Markdown Table
  md += `| Test Parameter | Measured Value | Reference Interval | Status |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;

  for (const f of findings) {
    let statusBadge = `🟢 Normal`;
    if (f.status === 'CRITICAL_HIGH' || f.status === 'CRITICAL_LOW') {
      statusBadge = `🚨 **Critical ${f.status.replace('CRITICAL_', '')}**`;
    } else if (f.status === 'HIGH') {
      statusBadge = `🔴 **High**`;
    } else if (f.status === 'LOW') {
      statusBadge = `🟡 **Low**`;
    }

    md += `| **${f.name}** | \`${f.value} ${f.unit}\` | ${f.referenceRange} | ${statusBadge} |\n`;
  }

  md += `\n---\n\n`;
  md += `#### 🩺 Detailed Parameter Explanations\n\n`;

  for (const f of findings) {
    if (f.status !== 'NORMAL') {
      md += `* **${f.name}** (\`${f.value} ${f.unit}\` — **${f.status}**):\n`;
      md += `  * *What it measures:* ${f.description}\n`;
      md += `  * *Clinical observation:* ${f.clinicalExplanation}\n\n`;
    }
  }

  if (summary.abnormal === 0) {
    md += `✨ **Great news:** All detected parameters in this report are currently within their standard reference intervals.\n\n`;
  }

  md += `> [!IMPORTANT]\n`;
  md += `> **Clinical Disclaimer:** This automated report analysis is an educational summary designed to assist your understanding. Laboratory reference ranges may vary slightly across clinical testing platforms. **Never adjust medication doses or self-treat based on automated analysis.** Please review these findings with your attending physician or specialist at Kushal Hospitals.\n`;

  return md;
}

module.exports = {
  TEST_DEFINITIONS,
  analyzeReportText,
  formatReportMarkdown,
};

