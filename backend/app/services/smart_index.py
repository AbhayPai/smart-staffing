import logging
import os

from typing import List
from dotenv import load_dotenv
from langchain_core.documents import Document
from supabase import create_client, Client
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SmartIndexing:
    def __init__(self, supabase_url: str, supabase_key: str, dimension: int):
        self.supabase: Client = create_client(
            supabase_url,
            supabase_key
        )
        self.dimension = dimension

    def insert(self, docs: List[Document]):
        if not docs:
            logger.warning("No documents provided for ingestion.")
            return

        resume_hash = docs[0].metadata.get("resume_hash")

        if not resume_hash:
            logger.warning("Missing resume_hash in metadata.")
            return

        # ─────────────────────────────────────
        # 1. Check if resume already exists
        # ─────────────────────────────────────
        existing = (
            self.supabase
            .table("documents")
            .select("id")
            .eq("metadata->>resume_hash", resume_hash)
            .limit(1)
            .execute()
        )

        if existing.data:
            # delete old version
            self.supabase.table("documents") \
                .delete() \
                .eq("metadata->>resume_hash", resume_hash) \
                .execute()

            logger.info(f"Deleted existing resume: {resume_hash}")

        # ─────────────────────────────────────
        # 2. Prepare rows for insertion
        # ─────────────────────────────────────
        rows = []

        for doc in docs:
            embedding = doc.metadata.get("embedding")

            # safety check (important in production)
            if not embedding:
                raise ValueError("Missing embedding in document metadata")

            if len(embedding) != self.dimension:
                raise ValueError(
                    f"Embedding dimension mismatch: {len(embedding)} != {self.dimension}"
                )

            rows.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "embedding": embedding
            })

        # ─────────────────────────────────────
        # 3. Batch insert into Supabase
        # ─────────────────────────────────────
        result = self.supabase.table("documents").insert(rows).execute()

        if result.data:
            logger.info(
                f"Indexed {len(rows)} chunks for resume_hash={resume_hash}"
            )
        else:
            logger.error(f"Failed to insert documents: {result}")
            raise Exception("Supabase insertion failed")