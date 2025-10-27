# models.py
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, func
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(32), nullable=True)
    password_hash = Column(String(255), nullable=False)
    balance = Column(Integer, nullable=False, default=4)  # saldos em horas
    created_at = Column(DateTime, server_default=func.now())

    services = relationship(
        "Service", back_populates="owner", cascade="all, delete-orphan")
    # histórico de transações recebidas/enviadas via trans table relations


class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"),
                      nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    value = Column(Integer, nullable=False)  # horas como inteiro
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="services")


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey(
        "users.id"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey(
        "users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    # PENDING, PROCESSED, FAILED
    status = Column(String(20), nullable=False, default="PENDING")
    created_at = Column(DateTime, server_default=func.now())
    processed_at = Column(DateTime, nullable=True)
    note = Column(String(255), nullable=True)


class Audit(Base):
    __tablename__ = "audits"
    id = Column(Integer, primary_key=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
