"""Banking knowledge base endpoint (powers the guidance UI)."""

from __future__ import annotations

from fastapi import APIRouter

from app.models.turn import BankingProcess
from app.services import banking_knowledge

router = APIRouter(tags=["banking"])


@router.get("/banking-processes", response_model=list[BankingProcess])
async def list_banking_processes() -> list[BankingProcess]:
    return banking_knowledge.all_processes()
