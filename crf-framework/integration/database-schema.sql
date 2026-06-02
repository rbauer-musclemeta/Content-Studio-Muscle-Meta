-- Muscle-Meta Assessment Ecosystem Database Schema
-- PostgreSQL 14+ with JSON support
-- Version 1.0 | June 2026
--
-- Educational risk assessment platform - not a medical device
-- Basic security best practices applied

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  gender VARCHAR(10),
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'basic', 'premium', 'vip'
  subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  stripe_customer_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  height_cm DECIMAL(5,2),
  current_weight_kg DECIMAL(5,2),
  occupation VARCHAR(255),
  activity_level VARCHAR(50), -- 'sedentary', 'lightly_active', 'moderately_active', 'very_active'
  health_conditions JSONB DEFAULT '[]'::jsonb,
  medications JSONB DEFAULT '[]'::jsonb,
  goals JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For clinical assessments
  assessment_type VARCHAR(50) NOT NULL, -- 'CRA', 'CCRAF', 'GLP1', 'GMMBB', '4P-MMA', etc.
  version VARCHAR(10) DEFAULT '1.0',
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Scoring
  total_score INTEGER,
  max_score INTEGER,
  score_percent DECIMAL(5,2),
  risk_tier INTEGER CHECK (risk_tier BETWEEN 1 AND 5), -- 1=Optimal, 2=Low, 3=Moderate, 4=High, 5=Critical
  risk_tier_label VARCHAR(20), -- 'MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'
  age_adjusted_tier INTEGER CHECK (age_adjusted_tier BETWEEN 1 AND 5),

  -- Detailed breakdowns (JSONB)
  section_scores JSONB DEFAULT '{}'::jsonb, -- { "domain_name": { "score": 12, "max": 20, "percent": 60 } }
  domain_breakdown JSONB DEFAULT '[]'::jsonb, -- For radar/breakdown charts

  -- Flags
  clinical_flags JSONB DEFAULT '[]'::jsonb, -- [{ "type": "urgent", "text": "..." }]
  critical_flags JSONB DEFAULT '[]'::jsonb,
  warning_flags JSONB DEFAULT '[]'::jsonb,
  info_flags JSONB DEFAULT '[]'::jsonb,

  -- Protective factors
  protective_factors JSONB DEFAULT '[]'::jsonb,

  -- Cross-referrals
  recommended_assessments JSONB DEFAULT '[]'::jsonb, -- [{ "assessment": "GLP1", "reason": "..." }]

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  question_id VARCHAR(100) NOT NULL,
  section_id VARCHAR(100),
  domain VARCHAR(100),
  question_type VARCHAR(20), -- 'radio', 'checkbox', 'text', 'number'
  response_value JSONB NOT NULL, -- Single value or array for checkbox
  score INTEGER,
  max_score INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VALIDATED INSTRUMENT RESULTS
-- Stores results from clinically validated instruments (SARC-F, MUST, EWGSOP2)
-- ============================================================================

CREATE TABLE validated_instrument_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  instrument_name VARCHAR(50) NOT NULL, -- 'SARC-F', 'MUST', 'EWGSOP2'
  instrument_version VARCHAR(20),

  -- Scoring
  total_score INTEGER,
  max_score INTEGER,

  -- Result category (instrument-specific)
  category VARCHAR(50), -- e.g., 'Screen positive', 'High risk', 'Confirmed sarcopenia'
  severity VARCHAR(20), -- 'normal', 'mild', 'moderate', 'severe'

  -- Component scores (JSONB for flexibility)
  component_scores JSONB DEFAULT '{}'::jsonb, -- e.g., { "strength": 2, "assistance": 1, ... }

  -- Clinical interpretation
  interpretation TEXT,
  clinical_action TEXT,

  -- Citation/validation info
  citation VARCHAR(255),

  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BIOMARKERS
-- Lab values with timestamps for longitudinal tracking
-- ============================================================================

CREATE TABLE biomarkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL, -- Optional link to assessment

  -- Lab identification
  lab_date DATE NOT NULL,
  lab_source VARCHAR(100), -- 'manual_entry', 'pdf_upload', 'ehr_integration'

  -- Biomarker values (using JSONB for flexibility)
  -- Each key is a biomarker name, value contains value, unit, reference range
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    Example structure:
    {
      "crp": { "value": 2.5, "unit": "mg/L", "ref_low": 0, "ref_high": 3.0, "flag": "normal" },
      "glucose_fasting": { "value": 105, "unit": "mg/dL", "ref_low": 70, "ref_high": 99, "flag": "high" },
      "vitamin_d": { "value": 28, "unit": "ng/mL", "ref_low": 30, "ref_high": 100, "flag": "low" }
    }
  */

  -- Summary flags
  abnormal_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,

  notes TEXT,
  verified_by UUID REFERENCES users(id), -- Provider verification
  verified_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recommendation_type VARCHAR(50), -- 'course', 'blog_post', 'tool', 'resource', 'referral'
  content_id VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  priority INTEGER CHECK (priority BETWEEN 1 AND 10), -- 1 = highest priority
  reason TEXT,
  pillar VARCHAR(50), -- 'exercise_mobility', 'nutrition_metabolism', etc.
  category VARCHAR(50),
  target_risk_tier INTEGER[],
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'viewed', 'started', 'completed', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROGRESS METRICS
-- Longitudinal tracking of physical measurements
-- ============================================================================

CREATE TABLE progress_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Metric identification
  metric_type VARCHAR(50) NOT NULL, -- 'weight', 'grip_strength', 'gait_speed', 'chair_stand_time', etc.
  metric_category VARCHAR(50), -- 'anthropometric', 'strength', 'function', 'balance'

  -- Value
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,

  -- Context
  measurement_method VARCHAR(100), -- 'self_reported', 'clinical', 'device'
  notes TEXT,

  -- Comparison to baseline
  baseline_value DECIMAL(10,2),
  percent_change DECIMAL(6,2),

  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  recorded_by UUID REFERENCES users(id) -- If measured by provider
);

-- ============================================================================
-- INTERVENTION PLANS
-- ============================================================================

CREATE TABLE intervention_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Plan details
  risk_tier INTEGER,
  plan_type VARCHAR(50), -- 'self_guided', 'coached', 'clinical'
  start_date DATE,
  target_end_date DATE,

  -- Protocols (JSONB)
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  specialist_referrals JSONB DEFAULT '[]'::jsonb,
  monitoring_schedule JSONB DEFAULT '{}'::jsonb,

  -- Nutrition targets
  protein_target_g DECIMAL(5,2),
  calorie_target INTEGER,
  supplement_protocol JSONB DEFAULT '[]'::jsonb,

  -- Exercise targets
  exercise_protocol JSONB DEFAULT '{}'::jsonb,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'draft', 'active', 'completed', 'paused'

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- REASSESSMENTS
-- Track progress between assessments
-- ============================================================================

CREATE TABLE reassessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  baseline_assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  followup_assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,

  -- Scores
  baseline_score INTEGER,
  followup_score INTEGER,
  score_change INTEGER,
  percent_improvement DECIMAL(6,2),

  -- Tiers
  baseline_tier INTEGER,
  followup_tier INTEGER,
  tier_improved BOOLEAN,
  tiers_improved INTEGER, -- How many tiers improved (negative if worsened)

  -- Domain-level changes
  domain_changes JSONB DEFAULT '{}'::jsonb,

  -- Timing
  intervention_period_days INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_status);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- User profiles
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);

-- Assessments
CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_risk_tier ON assessments(risk_tier);
CREATE INDEX idx_assessments_completed ON assessments(completed_at) WHERE status = 'completed';
CREATE INDEX idx_assessments_user_type ON assessments(user_id, assessment_type);
CREATE INDEX idx_assessments_created ON assessments(created_at DESC);

-- Assessment responses
CREATE INDEX idx_responses_assessment ON assessment_responses(assessment_id);
CREATE INDEX idx_responses_question ON assessment_responses(question_id);

-- Validated instruments
CREATE INDEX idx_validated_results_assessment ON validated_instrument_results(assessment_id);
CREATE INDEX idx_validated_results_user ON validated_instrument_results(user_id);
CREATE INDEX idx_validated_results_instrument ON validated_instrument_results(instrument_name);
CREATE INDEX idx_validated_results_user_instrument ON validated_instrument_results(user_id, instrument_name);

-- Biomarkers
CREATE INDEX idx_biomarkers_user ON biomarkers(user_id);
CREATE INDEX idx_biomarkers_user_date ON biomarkers(user_id, lab_date DESC);
CREATE INDEX idx_biomarkers_assessment ON biomarkers(assessment_id);

-- Recommendations
CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_assessment ON recommendations(assessment_id);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_recommendations_user_status ON recommendations(user_id, status);

-- Progress metrics
CREATE INDEX idx_progress_user ON progress_metrics(user_id);
CREATE INDEX idx_progress_type ON progress_metrics(metric_type);
CREATE INDEX idx_progress_user_type ON progress_metrics(user_id, metric_type);
CREATE INDEX idx_progress_user_recorded ON progress_metrics(user_id, recorded_at DESC);

-- Intervention plans
CREATE INDEX idx_intervention_user ON intervention_plans(user_id);
CREATE INDEX idx_intervention_status ON intervention_plans(status);

-- Reassessments
CREATE INDEX idx_reassessments_user ON reassessments(user_id);
CREATE INDEX idx_reassessments_baseline ON reassessments(baseline_assessment_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_biomarkers_updated_at
  BEFORE UPDATE ON biomarkers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_plans_updated_at
  BEFORE UPDATE ON intervention_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Latest assessment per user per type
CREATE VIEW latest_assessments AS
SELECT DISTINCT ON (user_id, assessment_type)
  id,
  user_id,
  assessment_type,
  version,
  status,
  completed_at,
  score_percent,
  risk_tier,
  risk_tier_label,
  age_adjusted_tier
FROM assessments
WHERE status = 'completed'
ORDER BY user_id, assessment_type, completed_at DESC;

-- User risk summary (latest tier per assessment type)
CREATE VIEW user_risk_summary AS
SELECT
  user_id,
  jsonb_object_agg(assessment_type, risk_tier) as risk_tiers,
  MAX(risk_tier) as highest_risk_tier,
  array_agg(DISTINCT assessment_type) as completed_assessments
FROM latest_assessments
GROUP BY user_id;

-- Latest biomarkers per user
CREATE VIEW latest_biomarkers AS
SELECT DISTINCT ON (user_id)
  id,
  user_id,
  lab_date,
  values,
  abnormal_count,
  critical_count,
  created_at
FROM biomarkers
ORDER BY user_id, lab_date DESC;
