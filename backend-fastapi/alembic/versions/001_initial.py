"""initial — placeholder sincronizado com init.sql

Revision ID: 001_initial
Revises: 
Create Date: 2026-05-13

Este arquivo é placeholder; o schema real já é criado via infra/postgres/init.sql.
Para criar migrações futuras: alembic revision --autogenerate -m "descricao"
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Schema já criado via init.sql; nada a fazer nesta revision inicial.
    # Mantido como placeholder para histórico Alembic.
    # Exemplo de como criar nova tabela no futuro:
    # op.create_table("example", sa.Column("id", sa.UUID, primary_key=True), ...)
    pass


def downgrade() -> None:
    pass
