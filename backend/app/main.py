from fastapi import FastAPI
from app.api import smart_ingest

app = FastAPI(title="Document Processing API")

app.include_router(smart_ingest.router)
