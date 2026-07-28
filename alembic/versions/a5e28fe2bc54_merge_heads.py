"""merge heads

Revision ID: a5e28fe2bc54
Revises: 26cb4211fc5a, 6d010df2f12e
Create Date: 2026-07-23 12:50:34.114900

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5e28fe2bc54'
down_revision: Union[str, None] = ('26cb4211fc5a', '6d010df2f12e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
