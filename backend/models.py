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
    
    # Método para converter o objeto em dicionário (JSON)
    def to_dict(self, include_private=False):
        data = {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
        }
        if include_private:
            data["phone"] = self.phone
            data["balance"] = self.balance
            data["created_at"] = self.created_at.isoformat() if self.created_at else None
            # Inclui os serviços do usuário no JSON
            data["services"] = [s.to_dict() for s in self.services]
        return data


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

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "value": self.value,
            "owner_id": self.owner_id,
            # Pega o nome do dono através do relacionamento
            "owner_name": f"{self.owner.first_name} {self.owner.last_name}" if self.owner else "Desconhecido"
        }


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

    # Relacionamentos para facilitar o acesso aos nomes/emails na API
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])

    def to_dict(self):
        return {
            "id": self.id,
            "remetente": self.sender.email if self.sender else "Desconhecido",
            "destinatario": self.recipient.email if self.recipient else "Desconhecido",
            "valor": self.amount,
            "status": self.status,
            "data": self.created_at.strftime("%d/%m/%Y %H:%M") if self.created_at else ""
        }


class Audit(Base):
    __tablename__ = "audits"
    id = Column(Integer, primary_key=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())