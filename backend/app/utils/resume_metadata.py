import os, logging
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.utils.format_list_for_prompt import format_list_for_prompt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CHUNK_SIZE = int(os.environ.get("CHUNK_SIZE", 1000))
CHUNK_OVERLAP = int(os.environ.get("CHUNK_OVERLAP", 200))
DIMENSION = int(os.environ.get("DIMENSION", 1024))
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-large")


# Guidance lists for LLM prompt
COMMON_SKILLS = [
    "python", "java", "c++", "sql", "aws", "docker", "kubernetes",
    "react", "node.js", "tensorflow", "pandas", "numpy", "excel",
    "project management", "communication", "leadership"
]

COMMON_DEPARTMENTS = [
    "engineering", "marketing", "sales", "finance", "operations",
    "hr", "product", "design", "it", "customer success"
]

COMMON_CERTIFICATIONS = [
    "pmp", "aws certified", "azure certified", "cpa", "scrum master",
    "six sigma", "ccna", "ccnp", "google cloud certified", "cissp"
]

EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert resume parser.
		Extract structured metadata from the resume text below.
		Be conservative — only extract information that is clearly present.
		Do NOT invent or assume values.

		Guidelines:
		- name: usually first line / header
		- email: look for @ pattern
		- role: current/most senior title or "seeking …"
		- department: infer from role/context (Engineering, Sales, Marketing, Finance, HR, etc.)
		- years_experience: largest clear number of years (e.g. "8+ years" → 8)
		- companies: actual employers (prefer org names over schools if possible)
		- skills: technologies, tools, frameworks, soft skills
		- certifications: official credentials (PMP, AWS Certified, etc.)

		Common examples to guide you (not exhaustive):
		Skills: {common_skills}
		Departments: {common_depts}
		Certifications: {common_certs}

		Return ONLY valid JSON matching the schema. No extra text."""),
			("user", "Resume text:\n\n{resume_text}")
	])

# ────────────────────────────────────────────────
# STRUCTURED OUTPUT SCHEMA
# ────────────────────────────────────────────────

class ResumeMetadata(BaseModel):
    name: str | None = Field(description = "Full name of the person")
    email: str | None = Field(description = "Email address")
    role: str | None = Field(description = "Most recent or target job title")
    department: str | None = Field(description = "Inferred department")
    years_experience: int | None = Field(description = "Estimated total years of experience")
    companies: List[str] = Field(default_factory=list, description = "Companies worked at")
    skills: List[str] = Field(default_factory=list, description = "Technical and soft skills")
    certifications: List[str] = Field(default_factory=list, description = "Certifications")


# ────────────────────────────────────────────────
# LLM-BASED METADATA EXTRACTION
# ────────────────────────────────────────────────
class LLMResumeMetadataExtractor:
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm.with_structured_output(ResumeMetadata)
        self.prompt = EXTRACTION_PROMPT.partial(
            common_skills=format_list_for_prompt(COMMON_SKILLS),
            common_depts=format_list_for_prompt(COMMON_DEPARTMENTS),
            common_certs=format_list_for_prompt(COMMON_CERTIFICATIONS),
        )

    def extract(self, text: str) -> Dict[str, Any]:
        try:
            chain = self.prompt | self.llm
            structured = chain.invoke({"resume_text": text[:30000]})
            return structured.model_dump(exclude_none=True)
        except Exception as e:
            logger.warning(f"Metadata extraction failed: {e}")
            return {}