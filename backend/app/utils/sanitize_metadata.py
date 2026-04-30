from typing import Dict, Any

def sanitize_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
    sanitized = {}
    for k, v in metadata.items():
        if v is None:
            if k in ["skills", "companies", "certifications"]:
                sanitized[k] = []
            else:
                sanitized[k] = ""
        else:
            sanitized[k] = v
    return sanitized