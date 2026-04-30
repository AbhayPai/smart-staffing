import logging
import os
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
DIMENSION = int(os.environ.get("DIMENSION", 1024))
PINECONE_MATRIX_INDEX_NAME = os.environ.get("PINECONE_MATRIX_INDEX_NAME")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")

# ────────────────────────────────────────────────
# PINECONE INTEGRATION
# ────────────────────────────────────────────────

class PineconeManager:
    def __init__(self):
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        self.index = self.pc.Index(PINECONE_MATRIX_INDEX_NAME)
        self.embedding = OpenAIEmbeddings(model=EMBEDDING_MODEL, dimensions=DIMENSION)
        self.vectorstore = PineconeVectorStore(
            index=self.index,
            embedding=self.embedding,
            text_key="text"
        )