import os
import re
from typing import Tuple, Dict, Any

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

def clean_extracted_text(text: str) -> str:
    """Clean whitespace, remove line breaks in middle of sentences, and normalize text."""
    if not text:
        return ""
    
    # Replace non-breaking spaces and tabs
    text = text.replace('\xa0', ' ').replace('\t', ' ')
    
    # Remove excessive repeated characters like dashes or underscores
    text = re.sub(r'[-_]{3,}', ' ', text)
    
    # Normalize multiple newlines into paragraph breaks
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        line_str = line.strip()
        # Filter out standalone page numbers like "Page 1" or just "1"
        if re.match(r'^(page\s+\d+|\d+)$', line_str, re.IGNORECASE):
            continue
        if line_str:
            cleaned_lines.append(line_str)
            
    # Join with appropriate spacing
    combined = " ".join(cleaned_lines)
    # Collapse multiple spaces
    combined = re.sub(r'\s{2,}', ' ', combined).strip()
    return combined

def parse_pdf_bytes(file_bytes: bytes, filename: str = "document.pdf") -> Tuple[str, Dict[str, Any]]:
    """Extract and validate text from PDF bytes using PyMuPDF."""
    if not fitz:
        raise RuntimeError("PyMuPDF (fitz) is not installed on the system.")
    
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Uploaded PDF file is empty (0 bytes).")
    
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Unable to read PDF file '{filename}'. The file may be corrupt or encrypted: {str(e)}")
    
    if doc.page_count == 0:
        raise ValueError(f"PDF '{filename}' contains 0 pages.")
        
    extracted_pages = []
    total_raw_chars = 0
    
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)
        page_text = page.get_text("text")
        if page_text:
            total_raw_chars += len(page_text)
            extracted_pages.append(page_text)
            
    doc.close()
    
    raw_text = "\n".join(extracted_pages)
    cleaned_text = clean_extracted_text(raw_text)
    
    word_count = len(cleaned_text.split())
    if word_count < 25:
        raise ValueError(
            f"The uploaded PDF yielded only {word_count} words. "
            "Please ensure the document contains searchable text (not purely scanned images) "
            "and sufficient educational material to generate questions."
        )
        
    metadata = {
        "page_count": len(extracted_pages),
        "word_count": word_count,
        "char_count": len(cleaned_text),
        "filename": filename
    }
    
    return cleaned_text, metadata

def parse_txt_bytes(file_bytes: bytes, filename: str = "document.txt") -> Tuple[str, Dict[str, Any]]:
    """Extract and validate text from TXT bytes using multiple encoding fallbacks."""
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Uploaded text file is empty (0 bytes).")
        
    text = None
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
    for enc in encodings:
        try:
            text = file_bytes.decode(enc)
            break
        except UnicodeDecodeError:
            continue
            
    if text is None:
        raise ValueError(f"Unable to decode text file '{filename}' with supported encodings (UTF-8, Latin-1).")
        
    cleaned_text = clean_extracted_text(text)
    word_count = len(cleaned_text.split())
    
    if word_count < 25:
        raise ValueError(
            f"The uploaded file contains only {word_count} words. "
            "A minimum of 25 words is required to extract meaningful educational concepts."
        )
        
    metadata = {
        "page_count": 1,
        "word_count": word_count,
        "char_count": len(cleaned_text),
        "filename": filename
    }
    
    return cleaned_text, metadata
