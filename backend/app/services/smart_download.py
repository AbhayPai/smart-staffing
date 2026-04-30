import tempfile
import os
import logging
import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)


class SmartDownload:

    async def download_pdf(self, pdf_url: str) -> str:
        """
        Downloads a PDF from a URL and returns the temp file path.
        """

        tmp_path = None

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                async with client.stream("GET", pdf_url) as response:

                    if response.status_code != 200:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Failed to download PDF. Status: {response.status_code}"
                        )

                    content_type = response.headers.get("content-type", "")

                    if "pdf" not in content_type.lower():
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid content type: {content_type}"
                        )

                    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                        tmp_path = tmp.name
                        total_bytes = 0

                        async for chunk in response.aiter_bytes():
                            if chunk:
                                tmp.write(chunk)
                                total_bytes += len(chunk)

            if not tmp_path or not os.path.exists(tmp_path):
                raise HTTPException(status_code=500, detail="Failed to create temp file")

            file_size = os.path.getsize(tmp_path)

            if file_size == 0:
                raise HTTPException(status_code=400, detail="Downloaded PDF is empty")

            logger.info(f"Downloaded PDF size: {file_size} bytes")

            return tmp_path

        except Exception:
            # clean up if partially created
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise