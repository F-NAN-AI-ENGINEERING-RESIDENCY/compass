from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.material import Material


class MaterialNotFoundError(Exception):
    pass


class NotMaterialOwnerError(Exception):
    pass


class InvalidReorderError(Exception):
    pass


def create_material(db: Session, class_id: int, unit: str, display_name: str) -> Material:
    next_position = (
        db.query(func.coalesce(func.max(Material.position), -1))
        .filter(Material.class_id == class_id, Material.unit == unit, Material.is_active.is_(True))
        .scalar()
        + 1
    )
    material = Material(class_id=class_id, unit=unit, display_name=display_name, position=next_position)
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


def list_materials_for_class(db: Session, class_id: int) -> List[Material]:
    return (
        db.query(Material)
        .filter(Material.class_id == class_id, Material.is_active.is_(True))
        .order_by(Material.unit, Material.position)
        .all()
    )


def get_material_or_404(db: Session, material_id: int) -> Material:
    material = (
        db.query(Material)
        .filter(Material.material_id == material_id, Material.is_active.is_(True))
        .first()
    )
    if material is None:
        raise MaterialNotFoundError(f"Material {material_id} not found")
    return material


def assert_teacher_owns_material(material: Material, teacher_id: int) -> None:
    if material.class_.teacher_id != teacher_id:
        raise NotMaterialOwnerError("You do not own this material")


def rename_material(db: Session, material: Material, display_name: str) -> Material:
    material.display_name = display_name
    db.commit()
    db.refresh(material)
    return material


def soft_delete_material(db: Session, material: Material) -> None:
    material.is_active = False
    db.commit()


def reorder_materials(db: Session, class_id: int, unit: str, material_ids: List[int]) -> List[Material]:
    """Reassigns position 0..n-1 to follow material_ids' order. The caller must
    supply exactly the current set of active material ids for (class_id, unit)
    — a partial or mismatched list is rejected rather than silently applied,
    since a partial reorder would leave stale positions for the omitted rows."""
    current = (
        db.query(Material)
        .filter(Material.class_id == class_id, Material.unit == unit, Material.is_active.is_(True))
        .all()
    )
    current_by_id = {material.material_id: material for material in current}

    if set(material_ids) != set(current_by_id.keys()) or len(material_ids) != len(current):
        raise InvalidReorderError(
            f"materialIds must be exactly the current active materials in unit '{unit}' for class {class_id}"
        )

    for position, material_id in enumerate(material_ids):
        current_by_id[material_id].position = position
    db.commit()

    return sorted(current, key=lambda material: material.position)
