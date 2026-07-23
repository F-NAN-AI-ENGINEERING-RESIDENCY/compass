from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, get_db, require_teacher
from app.schemas.materials import (
    MaterialCreateRequest,
    MaterialReorderRequest,
    MaterialRenameRequest,
    MaterialResponse,
)
from app.services import auth_service, class_service, material_service

router = APIRouter(tags=["materials"])


def _to_material_response(material) -> MaterialResponse:
    return MaterialResponse(
        material_id=material.material_id,
        class_id=material.class_id,
        unit=material.unit,
        display_name=material.display_name,
        position=material.position,
        created_at=material.created_at,
    )


@router.post(
    "/api/classes/{class_id}/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED
)
def create_material(
    class_id: int,
    payload: MaterialCreateRequest,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> MaterialResponse:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        class_ = class_service.get_class_or_404(db, class_id)
        class_service.assert_teacher_owns_class(class_, teacher_id)
    except class_service.ClassNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except class_service.NotClassOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    material = material_service.create_material(db, class_id, payload.unit, payload.display_name)
    return _to_material_response(material)


@router.get("/api/classes/{class_id}/materials", response_model=List[MaterialResponse])
def list_materials(
    class_id: int,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> List[MaterialResponse]:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        class_ = class_service.get_class_or_404(db, class_id)
        class_service.assert_teacher_owns_class(class_, teacher_id)
    except class_service.ClassNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except class_service.NotClassOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    materials = material_service.list_materials_for_class(db, class_id)
    return [_to_material_response(material) for material in materials]


@router.patch("/api/materials/{material_id}", response_model=MaterialResponse)
def rename_material(
    material_id: int,
    payload: MaterialRenameRequest,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> MaterialResponse:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        material = material_service.get_material_or_404(db, material_id)
        material_service.assert_teacher_owns_material(material, teacher_id)
    except material_service.MaterialNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except material_service.NotMaterialOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    material = material_service.rename_material(db, material, payload.display_name)
    return _to_material_response(material)


@router.delete("/api/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> None:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        material = material_service.get_material_or_404(db, material_id)
        material_service.assert_teacher_owns_material(material, teacher_id)
    except material_service.MaterialNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except material_service.NotMaterialOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    material_service.soft_delete_material(db, material)


@router.patch("/api/classes/{class_id}/materials/reorder", response_model=List[MaterialResponse])
def reorder_materials(
    class_id: int,
    payload: MaterialReorderRequest,
    current_user: CurrentUser = Depends(require_teacher),
    db: Session = Depends(get_db),
) -> List[MaterialResponse]:
    teacher_id = auth_service.user_id_of(current_user.principal)
    try:
        class_ = class_service.get_class_or_404(db, class_id)
        class_service.assert_teacher_owns_class(class_, teacher_id)
        materials = material_service.reorder_materials(db, class_id, payload.unit, payload.material_ids)
    except class_service.ClassNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except class_service.NotClassOwnerError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except material_service.InvalidReorderError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return [_to_material_response(material) for material in materials]
