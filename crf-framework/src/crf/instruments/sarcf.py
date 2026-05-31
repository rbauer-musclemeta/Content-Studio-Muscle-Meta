"""SARC-F sarcopenia screening questionnaire.

A five-item self-report screen (Strength, Assistance walking, Rise from a chair,
Climb stairs, Falls), each item 0-2, total 0-10. A total of >= 4 is a positive
screen suggestive of sarcopenia risk (high specificity, lower sensitivity), and
is the "Find" step of the EWGSOP2 (2019) algorithm.

Reference: Malmstrom TK, Morley JE. SARC-F: a simple questionnaire to rapidly
diagnose sarcopenia. J Am Med Dir Assoc. 2013;14(8):531-2. Cut-off per
Cruz-Jentoft et al., EWGSOP2, Age Ageing. 2019;48(1):16-31.
"""

from crf.instruments.base import BaseInstrument, InstrumentResult
from crf.models.patient import Patient

#: Total at or above which the screen is positive.
POSITIVE_THRESHOLD = 4


class SarcF(BaseInstrument):
    """SARC-F screening instrument."""

    name = "SARC-F"
    citation = (
        "Malmstrom & Morley, J Am Med Dir Assoc 2013;14(8):531-2; "
        "EWGSOP2, Age Ageing 2019;48(1):16-31 (cut-off >=4)"
    )

    def score(self, patient: Patient) -> InstrumentResult:
        if patient.sarcf is None:
            return self.not_assessable(["sarcf"])

        total = patient.sarcf.total
        positive = total >= POSITIVE_THRESHOLD

        if positive:
            category = "Screen positive (suggestive of sarcopenia)"
            interpretation = (
                f"SARC-F {total}/10 (>= {POSITIVE_THRESHOLD}). Positive screen — "
                "proceed to strength/performance assessment (e.g. grip strength, "
                "chair-stand) per EWGSOP2."
            )
        else:
            category = "Screen negative"
            interpretation = (
                f"SARC-F {total}/10 (< {POSITIVE_THRESHOLD}). Sarcopenia unlikely "
                "by this screen; reassess if function declines."
            )

        return InstrumentResult(
            instrument=self.name,
            applicable=True,
            category=category,
            raw_score=float(total),
            interpretation=interpretation,
            citation=self.citation,
        )
