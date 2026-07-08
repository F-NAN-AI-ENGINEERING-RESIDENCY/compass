"""Make confusion_signals.student_id required

Revision ID: 0a3ffefc2683
Revises: 529a3fdae802
Create Date: 2026-07-07 22:45:59.295588

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a3ffefc2683'
down_revision: Union[str, None] = '529a3fdae802'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('confusion_signals', 'student_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_constraint('confusion_signals_student_id_fkey', 'confusion_signals', type_='foreignkey')
    # Explicit name (not None): autogenerate's default here left the downgrade
    # path unable to compile a DROP CONSTRAINT for an unnamed constraint.
    op.create_foreign_key(
        'confusion_signals_student_id_fkey', 'confusion_signals', 'students',
        ['student_id'], ['student_id'], ondelete='RESTRICT',
    )


def downgrade() -> None:
    op.drop_constraint('confusion_signals_student_id_fkey', 'confusion_signals', type_='foreignkey')
    op.create_foreign_key(
        'confusion_signals_student_id_fkey', 'confusion_signals', 'students',
        ['student_id'], ['student_id'], ondelete='SET NULL',
    )
    op.alter_column('confusion_signals', 'student_id',
               existing_type=sa.INTEGER(),
               nullable=True)
