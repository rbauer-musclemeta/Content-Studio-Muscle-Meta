"""EWGSOP2 (2019) sarcopenia case-finding and staging algorithm.

This is a staged algorithm, not a summed score:

    Find      -> SARC-F / clinical concern (entry point)
    Assess    -> low muscle STRENGTH  => "Probable sarcopenia"
    Confirm   -> low muscle QUANTITY  => "Confirmed sarcopenia"
    Severity  -> low PERFORMANCE      => "Severe sarcopenia"

Sex-specific cut-offs (Cruz-Jentoft et al., EWGSOP2, Age Ageing 2019;48(1):16-31):

    Low strength:    grip < 27 kg (M) / < 16 kg (F)  OR  5-rise chair-stand > 15 s
    Low quantity:    ASM/height^2 < 7.0 kg/m^2 (M) / < 5.5 kg/m^2 (F)
    Low performance: gait speed <= 0.8 m/s

The algorithm stops (and reports the corresponding stage) when a downstream
measure is missing, rather than assuming a normal result — so absence of
muscle-mass data yields "Probable sarcopenia (muscle mass not assessed)", never
a false "no sarcopenia".
"""

from typing import Optional

from crf.instruments.base import BaseInstrument, InstrumentResult
from crf.models.patient import Patient, Sex

# Sex-specific cut-offs.
GRIP_CUTOFF_KG = {Sex.MALE: 27.0, Sex.FEMALE: 16.0}
ASM_INDEX_CUTOFF = {Sex.MALE: 7.0, Sex.FEMALE: 5.5}
CHAIR_STAND_CUTOFF_SEC = 15.0
GAIT_SPEED_CUTOFF_M_S = 0.8


class Ewgsop2(BaseInstrument):
    """EWGSOP2 sarcopenia staging instrument."""

    name = "EWGSOP2"
    citation = "Cruz-Jentoft et al., EWGSOP2, Age Ageing 2019;48(1):16-31"

    def score(self, patient: Patient) -> InstrumentResult:
        phys = patient.physical
        sex = patient.profile.sex

        # A strength measure is the minimum required to assess anything.
        if phys.grip_strength_kg is None and phys.chair_stand_5_sec is None:
            return self.not_assessable(["grip_strength_kg or chair_stand_5_sec"])

        low_strength, strength_notes = self._assess_strength(phys, sex)

        if not low_strength:
            return self._result(
                "No sarcopenia",
                f"Muscle strength normal ({'; '.join(strength_notes)}). "
                "Sarcopenia not indicated by EWGSOP2; reassess if function declines.",
            )

        # Low strength => at least Probable sarcopenia. Try to confirm with mass.
        asm_index = self._asm_index(patient)
        if asm_index is None:
            return self._result(
                "Probable sarcopenia",
                f"Low muscle strength ({'; '.join(strength_notes)}); muscle mass "
                "not assessed. Confirm with DXA/BIA (ASM/height^2).",
            )

        mass_cutoff = ASM_INDEX_CUTOFF[sex]
        mass_note = f"ASM index {asm_index:.2f} kg/m^2 (cut-off <{mass_cutoff})"
        if asm_index >= mass_cutoff:
            return self._result(
                "Probable sarcopenia (not confirmed)",
                f"Low muscle strength ({'; '.join(strength_notes)}) but muscle mass "
                f"normal ({mass_note}). Sarcopenia not confirmed.",
            )

        # Low strength + low mass => Confirmed. Try to stage severity with gait.
        if phys.gait_speed_m_s is None:
            return self._result(
                "Confirmed sarcopenia (severity not assessed)",
                f"Low strength ({'; '.join(strength_notes)}) and low mass ({mass_note}); "
                "physical performance not assessed (e.g. gait speed).",
            )

        gait_note = f"gait speed {phys.gait_speed_m_s} m/s (cut-off <={GAIT_SPEED_CUTOFF_M_S})"
        if phys.gait_speed_m_s <= GAIT_SPEED_CUTOFF_M_S:
            return self._result(
                "Severe sarcopenia",
                f"Low strength ({'; '.join(strength_notes)}), low mass ({mass_note}), "
                f"and low performance ({gait_note}).",
            )

        return self._result(
            "Confirmed sarcopenia",
            f"Low strength ({'; '.join(strength_notes)}) and low mass ({mass_note}); "
            f"physical performance preserved ({gait_note}).",
        )

    def _assess_strength(self, phys, sex: Sex) -> tuple[bool, list[str]]:
        """Low strength if grip is below cut-off OR chair-stand exceeds cut-off."""
        low = False
        notes: list[str] = []
        if phys.grip_strength_kg is not None:
            cutoff = GRIP_CUTOFF_KG[sex]
            if phys.grip_strength_kg < cutoff:
                low = True
            notes.append(f"grip {phys.grip_strength_kg} kg (cut-off <{cutoff})")
        if phys.chair_stand_5_sec is not None:
            if phys.chair_stand_5_sec > CHAIR_STAND_CUTOFF_SEC:
                low = True
            notes.append(
                f"5-rise chair-stand {phys.chair_stand_5_sec} s "
                f"(cut-off >{CHAIR_STAND_CUTOFF_SEC})"
            )
        return low, notes

    @staticmethod
    def _asm_index(patient: Patient) -> Optional[float]:
        """ASM divided by height squared (kg/m^2), if ASM was measured."""
        asm = patient.physical.appendicular_skeletal_muscle_kg
        if asm is None:
            return None
        height_m = patient.profile.height_cm / 100
        if height_m <= 0:
            return None
        return asm / (height_m**2)

    def _result(self, category: str, interpretation: str) -> InstrumentResult:
        return InstrumentResult(
            instrument=self.name,
            applicable=True,
            category=category,
            raw_score=None,  # staged algorithm; no single numeric score
            interpretation=interpretation,
            citation=self.citation,
        )
