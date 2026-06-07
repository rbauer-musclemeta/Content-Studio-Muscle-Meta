/**
 * CRF Assessment API Client
 *
 * Communicates with /api/crf/* endpoints for clinical assessments.
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Submit a quick screening assessment
 * Returns panel-first output: validated instruments as headline, exploratory composite secondary.
 *
 * @param {Object} patientData - Patient profile and responses
 * @returns {Promise<Object>} Quick screen response with validated_instruments, validated_summary, exploratory_composite
 */
export async function submitQuickScreen(patientData) {
  const response = await fetch(`${API_BASE}/api/crf/quick-screen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient: patientData }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Assessment failed' }));
    throw new Error(error.detail || 'Assessment submission failed');
  }

  return response.json();
}

/**
 * Submit a full assessment with optional biomarkers
 *
 * @param {Object} patientData - Patient profile and responses
 * @param {Object} biomarkers - Optional biomarker values
 * @returns {Promise<Object>} Full assessment response with risk_score and validated_instruments
 */
export async function submitFullAssessment(patientData, biomarkers = null) {
  const response = await fetch(`${API_BASE}/api/crf/assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient: patientData, biomarkers }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Assessment failed' }));
    throw new Error(error.detail || 'Assessment submission failed');
  }

  return response.json();
}

/**
 * Run validated instruments only (SARC-F, MUST, EWGSOP2)
 *
 * @param {Object} patientData - Patient profile with instrument-specific responses
 * @returns {Promise<Object>} Validated instruments response
 */
export async function runValidatedInstruments(patientData) {
  const response = await fetch(`${API_BASE}/api/crf/validated-instruments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient: patientData }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Validation failed' }));
    throw new Error(error.detail || 'Instrument validation failed');
  }

  return response.json();
}

/**
 * Generate personalized intervention recommendations
 *
 * @param {Object} patientData - Patient profile
 * @param {Object} biomarkers - Optional biomarker values
 * @returns {Promise<Object>} Intervention plan with prioritized recommendations
 */
export async function getRecommendations(patientData, biomarkers = null) {
  const response = await fetch(`${API_BASE}/api/crf/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient: patientData, biomarkers }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Recommendation failed' }));
    throw new Error(error.detail || 'Recommendation generation failed');
  }

  return response.json();
}

/**
 * Build patient data object from assessment responses
 * Maps frontend question schema to CRF API format.
 *
 * @param {Object} profile - Basic profile (id, dob, sex, height, weight)
 * @param {Object} responses - Question ID -> answer value mapping
 * @param {Object} options - Additional options (activity_level, conditions, medications)
 * @returns {Object} Patient data formatted for CRF API
 */
export function buildPatientData(profile, responses, options = {}) {
  return {
    profile: {
      patient_id: profile.id || `anon_${Date.now()}`,
      date_of_birth: profile.dateOfBirth,
      sex: profile.sex || 'male',
      height_cm: profile.heightCm || 170,
      weight_kg: profile.weightKg || 70,
      assessment_date: new Date().toISOString().split('T')[0],
    },
    activity_level: options.activityLevel || 'sedentary',
    chronic_conditions: options.conditions || [],
    medications: options.medications || [],
    protein_intake_g_per_kg: options.proteinIntake,
    sleep_hours: options.sleepHours,
    stress_level: options.stressLevel,
    recent_weight_loss_kg: options.recentWeightLoss,
    // SARC-F responses if provided
    sarcf: responses.sarcf || null,
    // Physical measurements if provided
    physical: responses.physical || null,
  };
}
