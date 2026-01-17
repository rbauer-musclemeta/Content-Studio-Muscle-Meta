"""Tests for the risk scoring system."""

import pytest

from crf.models.risk_factors import RiskFactors, RiskCategory
from crf.assessment.scoring import (
    RiskScore,
    RiskLevel,
    ScoringEngine,
    CategoryScore,
)


@pytest.fixture
def scoring_engine():
    """Create a scoring engine instance."""
    return ScoringEngine()


@pytest.fixture
def risk_factors_with_issues():
    """Create risk factors with some present."""
    factors = RiskFactors()

    # Set some factors as present
    factors.inadequate_protein.present = True
    factors.inadequate_protein.severity = 0.8

    factors.low_physical_activity.present = True
    factors.low_physical_activity.severity = 0.6

    factors.poor_sleep.present = True
    factors.poor_sleep.severity = 0.5

    return factors


class TestRiskLevel:
    """Tests for risk level classification."""

    def test_low_risk_threshold(self):
        """Test low risk classification."""
        assert RiskScore.calculate_risk_level(0) == RiskLevel.LOW
        assert RiskScore.calculate_risk_level(10) == RiskLevel.LOW
        assert RiskScore.calculate_risk_level(19.9) == RiskLevel.LOW

    def test_moderate_risk_threshold(self):
        """Test moderate risk classification."""
        assert RiskScore.calculate_risk_level(20) == RiskLevel.MODERATE
        assert RiskScore.calculate_risk_level(30) == RiskLevel.MODERATE
        assert RiskScore.calculate_risk_level(39.9) == RiskLevel.MODERATE

    def test_high_risk_threshold(self):
        """Test high risk classification."""
        assert RiskScore.calculate_risk_level(40) == RiskLevel.HIGH
        assert RiskScore.calculate_risk_level(50) == RiskLevel.HIGH
        assert RiskScore.calculate_risk_level(59.9) == RiskLevel.HIGH

    def test_severe_risk_threshold(self):
        """Test severe risk classification."""
        assert RiskScore.calculate_risk_level(60) == RiskLevel.SEVERE
        assert RiskScore.calculate_risk_level(80) == RiskLevel.SEVERE
        assert RiskScore.calculate_risk_level(100) == RiskLevel.SEVERE


class TestScoringEngine:
    """Tests for ScoringEngine."""

    def test_category_score_calculation(self, scoring_engine, risk_factors_with_issues):
        """Test scoring for a specific category."""
        all_factors = risk_factors_with_issues.get_all_factors()

        nutritional_score = scoring_engine.calculate_category_score(
            all_factors, RiskCategory.NUTRITIONAL
        )

        assert nutritional_score.category == RiskCategory.NUTRITIONAL
        assert nutritional_score.score > 0
        assert nutritional_score.max_score > 0
        assert "Inadequate Protein Intake" in nutritional_score.contributing_factors

    def test_total_score_calculation(self, scoring_engine, risk_factors_with_issues):
        """Test total score calculation."""
        all_factors = risk_factors_with_issues.get_all_factors()

        score = scoring_engine.calculate_total_score(all_factors)

        assert score.total_score > 0
        assert score.max_possible_score > score.total_score
        assert 0 <= score.percentage <= 100
        assert score.risk_level is not None

    def test_biomarker_penalty(self, scoring_engine):
        """Test biomarker penalty calculation."""
        abnormal_biomarkers = [
            ("crp", "high"),
            ("albumin", "low"),
            ("testosterone", "critical"),
        ]

        penalty = scoring_engine.calculate_biomarker_penalty(abnormal_biomarkers)

        assert penalty > 0
        # Critical biomarkers should add more penalty
        critical_penalty = scoring_engine.calculate_biomarker_penalty([("crp", "critical")])
        high_penalty = scoring_engine.calculate_biomarker_penalty([("crp", "high")])
        assert critical_penalty > high_penalty

    def test_empty_factors_returns_zero(self, scoring_engine):
        """Test scoring with no present factors."""
        factors = RiskFactors()
        all_factors = factors.get_all_factors()

        score = scoring_engine.calculate_total_score(all_factors)

        assert score.total_score == 0
        assert score.risk_level == RiskLevel.LOW

    def test_all_factors_maximum_score(self, scoring_engine):
        """Test scoring with all factors present at maximum severity."""
        factors = RiskFactors()
        for factor in factors.get_all_factors():
            factor.present = True
            factor.severity = 1.0

        all_factors = factors.get_all_factors()
        score = scoring_engine.calculate_total_score(all_factors, biomarker_penalty=15)

        assert score.percentage > 60  # Should be severe
        assert score.risk_level == RiskLevel.SEVERE


class TestCategoryScore:
    """Tests for CategoryScore model."""

    def test_category_score_creation(self):
        """Test creating a category score."""
        cat_score = CategoryScore(
            category=RiskCategory.NUTRITIONAL,
            score=5.0,
            max_score=10.0,
            contributing_factors=["Factor 1", "Factor 2"],
            percentage=50.0,
        )

        assert cat_score.category == RiskCategory.NUTRITIONAL
        assert cat_score.percentage == 50.0
        assert len(cat_score.contributing_factors) == 2


class TestRiskScore:
    """Tests for RiskScore model."""

    def test_get_category_ranking(self):
        """Test category ranking by percentage."""
        score = RiskScore(
            total_score=10,
            max_possible_score=50,
            percentage=20,
            risk_level=RiskLevel.MODERATE,
            category_scores=[
                CategoryScore(
                    category=RiskCategory.NUTRITIONAL,
                    score=3,
                    max_score=10,
                    percentage=30,
                ),
                CategoryScore(
                    category=RiskCategory.PHYSICAL,
                    score=5,
                    max_score=10,
                    percentage=50,
                ),
                CategoryScore(
                    category=RiskCategory.LIFESTYLE,
                    score=2,
                    max_score=10,
                    percentage=20,
                ),
            ],
        )

        ranking = score.get_category_ranking()

        assert ranking[0].category == RiskCategory.PHYSICAL
        assert ranking[1].category == RiskCategory.NUTRITIONAL
        assert ranking[2].category == RiskCategory.LIFESTYLE

    def test_get_highest_risk_category(self):
        """Test getting highest risk category."""
        score = RiskScore(
            total_score=10,
            max_possible_score=50,
            percentage=20,
            risk_level=RiskLevel.MODERATE,
            category_scores=[
                CategoryScore(
                    category=RiskCategory.MEDICAL,
                    score=8,
                    max_score=10,
                    percentage=80,
                ),
                CategoryScore(
                    category=RiskCategory.NUTRITIONAL,
                    score=3,
                    max_score=10,
                    percentage=30,
                ),
            ],
        )

        highest = score.get_highest_risk_category()

        assert highest is not None
        assert highest.category == RiskCategory.MEDICAL
        assert highest.percentage == 80
