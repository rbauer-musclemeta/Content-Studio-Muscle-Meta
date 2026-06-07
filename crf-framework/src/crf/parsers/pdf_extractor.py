"""PDF text extraction utilities.

This module handles extracting raw text from PDF documents such as lab reports
and DEXA scans. It supports multiple PDF libraries and common lab report formats.

DISCLAIMER:
    Extracted text is used for biomarker pattern matching. Users must verify
    all extracted values against their original documents. This is NOT a
    medical device.
"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text content from a PDF file.

    This function attempts to extract text using pdfplumber (preferred) with
    fallback to PyMuPDF if available. The extracted text is cleaned and
    normalized for downstream pattern matching.

    Args:
        file_path: Absolute or relative path to the PDF file.

    Returns:
        str: Extracted text content from all pages, concatenated with page
             separators. Returns empty string if extraction fails.

    Raises:
        FileNotFoundError: If the specified file does not exist.
        ValueError: If the file is not a PDF or cannot be read.

    Example:
        >>> text = extract_text_from_pdf("/path/to/lab_report.pdf")
        >>> "albumin" in text.lower()
        True

    Note:
        - Scanned PDFs without OCR text layer will return minimal/no text
        - Password-protected PDFs are not supported
        - Very large PDFs (>100 pages) may be slow to process
    """
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    if path.suffix.lower() != ".pdf":
        raise ValueError(f"File is not a PDF: {file_path}")

    # Try pdfplumber first (preferred for lab reports)
    text = _extract_with_pdfplumber(file_path)

    # Fallback to PyMuPDF if pdfplumber fails or returns empty
    if not text or len(text.strip()) < 50:
        pymupdf_text = _extract_with_pymupdf(file_path)
        if pymupdf_text and len(pymupdf_text) > len(text or ""):
            text = pymupdf_text

    if not text:
        logger.warning(f"No text extracted from PDF: {file_path}")
        return ""

    return _clean_extracted_text(text)


def _extract_with_pdfplumber(file_path: str) -> Optional[str]:
    """Extract text using pdfplumber library.

    pdfplumber excels at extracting text from PDFs with complex layouts,
    including tables commonly found in lab reports.

    Args:
        file_path: Path to the PDF file.

    Returns:
        Extracted text or None if pdfplumber is not available.
    """
    try:
        import pdfplumber
    except ImportError:
        logger.debug("pdfplumber not installed, skipping")
        return None

    try:
        pages_text = []
        with pdfplumber.open(file_path) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    pages_text.append(f"--- PAGE {i + 1} ---\n{page_text}")

                # Also try to extract tables (common in lab reports)
                tables = page.extract_tables()
                for table in tables:
                    if table:
                        table_text = _format_table(table)
                        if table_text:
                            pages_text.append(table_text)

        return "\n\n".join(pages_text)

    except Exception as e:
        logger.warning(f"pdfplumber extraction failed: {e}")
        return None


def _extract_with_pymupdf(file_path: str) -> Optional[str]:
    """Extract text using PyMuPDF (fitz) library.

    PyMuPDF is fast and handles a wide variety of PDF formats.
    Used as a fallback when pdfplumber fails.

    Args:
        file_path: Path to the PDF file.

    Returns:
        Extracted text or None if PyMuPDF is not available.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        logger.debug("PyMuPDF not installed, skipping")
        return None

    try:
        pages_text = []
        with fitz.open(file_path) as doc:
            for i, page in enumerate(doc):
                page_text = page.get_text()
                if page_text:
                    pages_text.append(f"--- PAGE {i + 1} ---\n{page_text}")

        return "\n\n".join(pages_text)

    except Exception as e:
        logger.warning(f"PyMuPDF extraction failed: {e}")
        return None


def _format_table(table: list) -> str:
    """Format an extracted table into text.

    Converts a 2D list (table) into a text representation suitable
    for biomarker pattern matching.

    Args:
        table: 2D list of cell values.

    Returns:
        Formatted table as text with columns separated by tabs.
    """
    if not table:
        return ""

    lines = []
    for row in table:
        if row:
            # Filter out None values and join with tabs
            cells = [str(cell).strip() if cell else "" for cell in row]
            if any(cells):  # Only include non-empty rows
                lines.append("\t".join(cells))

    return "\n".join(lines)


def _clean_extracted_text(text: str) -> str:
    """Clean and normalize extracted PDF text.

    Performs text normalization to improve pattern matching:
    - Normalizes whitespace
    - Removes excessive blank lines
    - Standardizes common lab report formatting

    Args:
        text: Raw extracted text.

    Returns:
        Cleaned text suitable for biomarker pattern matching.
    """
    if not text:
        return ""

    # Replace multiple spaces with single space (but preserve newlines)
    import re
    text = re.sub(r"[ \t]+", " ", text)

    # Replace multiple newlines with double newline
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Strip leading/trailing whitespace from each line
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines)

    # Remove page headers/footers that commonly appear in lab reports
    # These patterns may need adjustment based on actual lab formats
    text = re.sub(r"Page \d+ of \d+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"Continued on next page", "", text, flags=re.IGNORECASE)

    return text.strip()


def get_pdf_metadata(file_path: str) -> dict:
    """Extract metadata from a PDF file.

    Retrieves document metadata which may include lab name, date, and
    other identifying information useful for parsing.

    Args:
        file_path: Path to the PDF file.

    Returns:
        dict: Metadata including title, author, creation date, etc.
              Returns empty dict if metadata cannot be extracted.

    Example:
        >>> metadata = get_pdf_metadata("/path/to/lab_report.pdf")
        >>> print(metadata.get('title', 'Unknown'))
    """
    metadata = {}

    # Try pdfplumber
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            if pdf.metadata:
                metadata = dict(pdf.metadata)
    except (ImportError, Exception):
        pass

    # Fallback to PyMuPDF
    if not metadata:
        try:
            import fitz
            with fitz.open(file_path) as doc:
                metadata = dict(doc.metadata) if doc.metadata else {}
        except (ImportError, Exception):
            pass

    return metadata
