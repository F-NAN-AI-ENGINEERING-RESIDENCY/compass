"""Add consent_status to students and join_code to classes

Revision ID: 529a3fdae802
Revises: 594ddf0f5ca6
Create Date: 2026-07-07 22:34:53.546252

"""
import secrets
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '529a3fdae802'
down_revision: Union[str, None] = '594ddf0f5ca6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Mirrors app.models.class_'s alphabet/length. Duplicated rather than imported
# so this migration stays a self-contained snapshot — it must keep working
# even if the model's generator changes shape later.
_JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
_JOIN_CODE_LENGTH = 7


def _generate_code() -> str:
    return "".join(secrets.choice(_JOIN_CODE_ALPHABET) for _ in range(_JOIN_CODE_LENGTH))


def upgrade() -> None:
    op.add_column('students', sa.Column('consent_status', sa.String(), server_default='not_required', nullable=False))

    # join_code can't use a single server_default (every row needs a distinct
    # value), so: add nullable, backfill each existing row with a unique code,
    # then tighten to NOT NULL + unique index.
    op.add_column('classes', sa.Column('join_code', sa.String(length=_JOIN_CODE_LENGTH), nullable=True))

    bind = op.get_bind()
    classes = sa.table('classes', sa.column('class_id', sa.Integer), sa.column('join_code', sa.String))
    used_codes = set(
        code for (code,) in bind.execute(sa.text("SELECT join_code FROM classes WHERE join_code IS NOT NULL"))
    )
    for (class_id,) in bind.execute(sa.text("SELECT class_id FROM classes")):
        code = _generate_code()
        while code in used_codes:
            code = _generate_code()
        used_codes.add(code)
        bind.execute(classes.update().where(classes.c.class_id == class_id).values(join_code=code))

    op.alter_column('classes', 'join_code', nullable=False)
    op.create_index(op.f('ix_classes_join_code'), 'classes', ['join_code'], unique=True)


def downgrade() -> None:
    op.drop_column('students', 'consent_status')
    op.drop_index(op.f('ix_classes_join_code'), table_name='classes')
    op.drop_column('classes', 'join_code')
