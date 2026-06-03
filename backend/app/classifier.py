ADVISORY_KEYWORDS = [
    "should i", "is it good", "recommend", "better than", "is better", "which is better",
    "which fund", "worth investing", "best fund", "buy or sell",
    "good time", "right time", "when to invest", "is now",
    "best time", "right time to", "time to invest", "time to start",
]

# Performance keywords route to PERFORMANCE_REFUSAL (factsheet link), NOT advisory (AMFI link).
# Keeping these separate ensures the correct follow-up resource is sent. See edge-cases EC-2.4.
PERFORMANCE_KEYWORDS = [
    "return", "returns", "performance", "growth", "profit", "gain",
    "what will i get", "how much will i earn", "how much will i make",
    "will this fund give", "past performance", "historical",
]


def classify_query(query: str) -> str:
    """
    Returns one of: 'factual', 'advisory', 'performance'
    """
    q = query.lower()
    if any(kw in q for kw in ADVISORY_KEYWORDS):
        return "advisory"
    if any(kw in q for kw in PERFORMANCE_KEYWORDS):
        return "performance"
    return "factual"
