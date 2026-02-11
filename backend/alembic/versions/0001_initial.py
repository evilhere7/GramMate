"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2026-02-11 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create users
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('email_verified', sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('country_code', sa.String(length=2), nullable=True),
        sa.Column('is_creator', sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column('creator_verified_tier', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('is_banned', sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
    )

    # Additional tables simplified for MVP
    op.create_table('videos',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('creator_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('video_url', sa.String(length=500), nullable=False),
        sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('is_monetized', sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column('view_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('like_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('comment_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('share_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    op.create_table('wallets',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('balance_cents', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('currency', sa.String(length=3), nullable=True, server_default='USD'),
        sa.Column('pending_payout_cents', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

    op.create_table('wallet_transactions',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('transaction_type', sa.String(length=20), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('external_reference_id', sa.String(length=255), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('wallet_transactions')
    op.drop_table('wallets')
    op.drop_table('videos')
    op.drop_table('users')
