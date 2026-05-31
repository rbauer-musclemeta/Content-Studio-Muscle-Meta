"""Validated clinical screening instruments.

Phase 2 ships SARC-F (sarcopenia) and MUST (malnutrition) behind a common
interface, plus a :class:`ScreeningPanel` to run them together. These reproduce
published, validated instruments and are reported separately from the heuristic
composite score.
"""

from crf.instruments.base import (
    BaseInstrument,
    InstrumentResult,
    ScreeningPanel,
    default_instruments,
)
from crf.instruments.sarcf import SarcF
from crf.instruments.must import Must

__all__ = [
    "BaseInstrument",
    "InstrumentResult",
    "ScreeningPanel",
    "default_instruments",
    "SarcF",
    "Must",
]
