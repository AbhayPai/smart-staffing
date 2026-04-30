def clean_text(text: str) -> str:
    text = " ".join(text.split())
    text = text.replace("ﬁ", "fi").replace("ﬂ", "fl")
    return text