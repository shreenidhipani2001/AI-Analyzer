import re

# NOTE: The broad \d{6,12} pattern was intentionally narrowed (see edge-cases EC-1.6).
# A bare large number like 500000 (investment amount) or 20250528 (date) must NOT trigger rejection.
# Account/folio/OTP detection requires a context keyword prefix.
PII_PATTERNS = [
    r"\b[A-Z]{5}\d{4}[A-Z]\b",                              # PAN: ABCDE1234F
    r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",                    # Aadhaar: 1234 5678 9012
    r"\b[\w.+]+@[\w.]+\.[a-z]{2,}\b",                       # Email
    r"\b(\+91[\s-]?|0)?[6-9]\d{9}\b",                       # Indian mobile (10-digit, starts 6-9)
    r"(?i)\b(folio|account|otp|a\/c)[\s:#]*\d{6,16}\b",    # Account/folio/OTP with context prefix
]


def contains_pii(text: str) -> bool:
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in PII_PATTERNS)
