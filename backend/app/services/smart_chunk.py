import os
from typing import List
from datetime import datetime, timezone
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (UnstructuredWordDocumentLoader, PyMuPDFLoader)

from app.utils.hash_text import hash_text
from app.utils.sanitize_metadata import sanitize_metadata
from app.utils.normalize_whitespace import normalize_whitespace
from app.utils.resume_metadata import LLMResumeMetadataExtractor

class SmartChunk:
    def __init__(self, chunk_size, chunk_overlap, llm):
        self.extractor = LLMResumeMetadataExtractor(llm)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ".", " ", ""],
        )

    def get_loader(self, path: str):
        ext = os.path.splitext(path)[1].lower()
        if ext == ".pdf":
            return PyMuPDFLoader(path)
        elif ext in (".docx", ".doc"):
            return UnstructuredWordDocumentLoader(path)
        else:
            raise ValueError(f"Unsupported file type: {ext} (only .pdf, .docx supported)")

    def process_pdf(self, path: str) -> List[Document]:
        loader = self.get_loader(path)
        pages = loader.load()

        # Join pages / elements into clean full text
        full_text = normalize_whitespace(" ".join(d.page_content for d in pages))
        resume_hash = hash_text(full_text)

        # LLM extracts metadata once from full text
        raw_metadata = self.extractor.extract(full_text)
        metadata = sanitize_metadata(raw_metadata)

        base_metadata = {
            **metadata,
            "resume_hash": resume_hash,
            "source_type": "resume",
            "source_format": "pdf" if path.lower().endswith(".pdf") else "docx",
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }

        # Split into overlapping chunks
        chunks = self.text_splitter.split_text(full_text)

        chunk_docs = [
            Document(
                page_content=chunk,
                metadata={
                    **base_metadata,
                    "doc_level": "chunk",
                    "chunk_index": i
                }
            )
            for i, chunk in enumerate(chunks)
        ]

        return chunk_docs

