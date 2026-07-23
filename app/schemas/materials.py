from datetime import datetime
from typing import List

from app.schemas.base import CamelModel


class MaterialCreateRequest(CamelModel):
    unit: str
    display_name: str


class MaterialRenameRequest(CamelModel):
    display_name: str


class MaterialReorderRequest(CamelModel):
    # unit travels in the body, not the path: it's teacher-typed free text
    # (arbitrary characters), not a URL-safe identifier.
    unit: str
    # Ordered list of every active material id in the unit, first to last.
    material_ids: List[int]


class MaterialResponse(CamelModel):
    material_id: int
    class_id: int
    unit: str
    display_name: str
    position: int
    created_at: datetime
