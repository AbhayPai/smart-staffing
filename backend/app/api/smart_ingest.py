import os
import uuid
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, HttpUrl
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

from app.services.smart_chunk import SmartChunk
from app.services.smart_download import SmartDownload
from app.services.smart_index import SmartIndexing
from app.services.smart_embedding import SmartEmbedding

load_dotenv()

# ---------------- CONFIG ---------------- #
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 1000))
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 200))
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-large")
DIMENSION = int(os.getenv("DIMENSION", 1024))

# ---------------- LOGGING ---------------- #
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingest-service")

# ---------------- ROUTER ---------------- #
router = APIRouter(prefix="/ingest", tags=["Ingest"])

# ---------------- SERVICES ---------------- #
llm = ChatOpenAI(model=LLM_MODEL, api_key=OPENAI_API_KEY)

processor = SmartChunk(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    llm=llm,
)

downloader = SmartDownload()
indexing = SmartIndexing()

# ---------------- INGESTION ---------------- #
ingestion_id = str(uuid.uuid4())


# ---------------- SCHEMAS ---------------- #
class IngestRequest(BaseModel):
    fileUrl: HttpUrl


class ChunkResponse(BaseModel):
    content: str
    metadata: Dict[str, Any]


class IngestResponse(BaseModel):
    status: str
    message: str
    num_chunks: Optional[int] = None
    chunks: Optional[List[ChunkResponse]] = None
    ingestion_id: str

# ---------------- ROUTE ---------------- #
@router.post("/", response_model=IngestResponse)
async def smart_ingest(payload: IngestRequest):
    tmp_path = None

    try:
        logger.info(f"Starting ingestion for file: {payload.fileUrl}")

        # 1. Download
        tmp_path = await downloader.download_pdf(str(payload.fileUrl))
        if not tmp_path:
            raise RuntimeError("Failed to download file")

        # 2. Process
        chunks = processor.process_pdf(tmp_path)

        if not chunks:
            return IngestResponse(
                status="failed",
                message="No chunks extracted from document",
                ingestion_id=ingestion_id,
                num_chunks=0,
            )

        # 3. Embed
        smart_embedding = SmartEmbedding(model_name=EMBEDDING_MODEL, dimension=DIMENSION)

        texts = [c.page_content for c in chunks]
        embeddings = smart_embedding.embed_texts(texts)

        # attach embeddings to metadata
        for chunk, embedding in zip(chunks, embeddings):
            chunk.metadata["embedding"] = embedding

        # 4. Index
        try:
            indexing.insert(chunks)
        except Exception as e:
            logger.exception("Indexing failed")
            raise HTTPException(
                status_code=500,
                detail=f"Indexing failed: {str(e)}"
            )

        logger.info(f"Successfully ingested {len(chunks)} chunks")

        return IngestResponse(
            status="success",
            message="File processed and indexed successfully",
            num_chunks=len(chunks),
            ingestion_id=ingestion_id,
            chunks=[
                ChunkResponse(
                    content=c.page_content,
                    metadata=c.metadata
                )
                for c in chunks
            ],
        )

    except Exception as e:
        logger.exception("Ingestion pipeline failed")

        return IngestResponse(
            status="failed",
            ingestion_id=ingestion_id,
            message=f"Ingestion failed: {str(e)}",
        )

    finally:
        # cleanup
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
                logger.info(f"Cleaned up temp file: {tmp_path}")
            except Exception as cleanup_err:
                logger.warning(f"Temp file cleanup failed: {cleanup_err}")