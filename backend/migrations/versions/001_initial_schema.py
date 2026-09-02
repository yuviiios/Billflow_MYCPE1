"""Initial schema: users clients invoices

Revision ID: 001
Revises:
Create Date: 2024-09-02 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('hashed_password', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.create_table('user_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('business_name', sa.String(), server_default='My Business', nullable=False),
    sa.Column('currency', sa.String(), server_default='USD', nullable=False),
    sa.Column('invoice_prefix', sa.String(), server_default='INV', nullable=False),
    sa.Column('logo_url', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', name='uq_user_settings_user_id')
    )

    op.create_table('clients',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('company', sa.String(), nullable=True),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('phone', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clients_name'), 'clients', ['name'], unique=False)
    op.create_index(op.f('ix_clients_user_id'), 'clients', ['user_id'], unique=False)

    op.create_table('invoices',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('client_id', sa.Integer(), nullable=False),
    sa.Column('invoice_number', sa.String(), nullable=False),
    sa.Column('status', sa.String(), server_default='draft', nullable=False),
    sa.Column('issue_date', sa.DateTime(), nullable=False),
    sa.Column('due_date', sa.DateTime(), nullable=False),
    sa.Column('subtotal', sa.Float(), server_default='0.0', nullable=False),
    sa.Column('tax_rate', sa.Float(), server_default='0.0', nullable=False),
    sa.Column('tax_amount', sa.Float(), server_default='0.0', nullable=False),
    sa.Column('discount', sa.Float(), server_default='0.0', nullable=False),
    sa.Column('total', sa.Float(), server_default='0.0', nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    # Plain string so the same schema works on SQLite and Postgres.
    sa.Column('public_token', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('public_token'),
    sa.UniqueConstraint('user_id', 'invoice_number', name='uq_invoices_user_invoice_number')
    )
    op.create_index(op.f('ix_invoices_invoice_number'), 'invoices', ['invoice_number'], unique=False)
    op.create_index(op.f('ix_invoices_public_token'), 'invoices', ['public_token'], unique=False)
    op.create_index(op.f('ix_invoices_user_id'), 'invoices', ['user_id'], unique=False)
    op.create_index(op.f('ix_invoices_client_id'), 'invoices', ['client_id'], unique=False)

    op.create_table('invoice_line_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('invoice_id', sa.Integer(), nullable=False),
    sa.Column('description', sa.String(), nullable=False),
    sa.Column('quantity', sa.Float(), nullable=False),
    sa.Column('rate', sa.Float(), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invoice_line_items_invoice_id'), 'invoice_line_items', ['invoice_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_invoice_line_items_invoice_id'), table_name='invoice_line_items')
    op.drop_table('invoice_line_items')
    op.drop_index(op.f('ix_invoices_client_id'), table_name='invoices')
    op.drop_index(op.f('ix_invoices_user_id'), table_name='invoices')
    op.drop_index(op.f('ix_invoices_public_token'), table_name='invoices')
    op.drop_index(op.f('ix_invoices_invoice_number'), table_name='invoices')
    op.drop_table('invoices')
    op.drop_index(op.f('ix_clients_user_id'), table_name='clients')
    op.drop_index(op.f('ix_clients_name'), table_name='clients')
    op.drop_table('clients')
    op.drop_table('user_settings')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
