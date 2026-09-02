"""update schema

Revision ID: 002
Revises: 001
Create Date: 2026-09-02

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to user_settings
    with op.batch_alter_table('user_settings') as batch_op:
        batch_op.add_column(sa.Column('business_email', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('business_address', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('business_phone', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('tax_rate', sa.Float(), nullable=False, server_default='0.0'))
        batch_op.add_column(sa.Column('payment_terms', sa.Text(), nullable=True))

    # Rename rate to unit_price in invoice_line_items (SQLite-compatible).
    # Batch mode rebuilds the table, so the existing type must be spelled out.
    with op.batch_alter_table('invoice_line_items') as batch_op:
        batch_op.alter_column(
            'rate',
            new_column_name='unit_price',
            existing_type=sa.Float(),
            existing_nullable=False,
        )


def downgrade():
    # Remove columns from user_settings
    with op.batch_alter_table('user_settings') as batch_op:
        batch_op.drop_column('payment_terms')
        batch_op.drop_column('tax_rate')
        batch_op.drop_column('business_phone')
        batch_op.drop_column('business_address')
        batch_op.drop_column('business_email')

    # Rename unit_price back to rate
    with op.batch_alter_table('invoice_line_items') as batch_op:
        batch_op.alter_column(
            'unit_price',
            new_column_name='rate',
            existing_type=sa.Float(),
            existing_nullable=False,
        )
