from app.schemas.base import CamelModel


class TranscriptChunkResponse(CamelModel):
    chunk_id: int
    text: str
    start_offset_seconds: float
    end_offset_seconds: float
