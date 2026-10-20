"""Diplomacy and communication manager for Emergent Nations.

Handles public broadcasts, private direct messaging, and formal treaties.
Maintains privacy boundaries for AI observations while providing complete
transparency to the spectator.
"""

from typing import List, Dict, Optional
from datetime import datetime, timezone
from app.schemas.contracts import (
    DiplomaticMessage,
    DiplomaticAgreement,
    AgreementType,
    AgreementStatus,
)


class DiplomacyManager:
    """Manages diplomatic messages, treaties, and visibility filtering."""

    def __init__(self):
        self.messages: List[DiplomaticMessage] = []
        self.agreements: Dict[str, DiplomaticAgreement] = {}

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def post_message(
        self,
        turn: int,
        sender_id: str,
        content: str,
        recipient_id: Optional[str] = None,
        is_private: bool = False,
    ) -> DiplomaticMessage:
        """Route a new public or private diplomatic message."""
        msg_id = f"msg_{turn}_{sender_id}_{len(self.messages) + 1}"
        msg = DiplomaticMessage(
            message_id=msg_id,
            turn=turn,
            sender_id=sender_id,
            recipient_id=recipient_id,
            is_private=is_private,
            content=content,
            timestamp=self._now_iso(),
        )
        self.messages.append(msg)
        return msg

    def get_messages_for_agent(self, nation_id: str) -> List[DiplomaticMessage]:
        """Return only messages the nation is authorized to see (public or addressed to/from it)."""
        return [
            m for m in self.messages
            if not m.is_private or m.sender_id == nation_id or m.recipient_id == nation_id
        ]

    def get_spectator_messages(self) -> List[DiplomaticMessage]:
        """Omniscient spectator view: all communications, including private whispers."""
        return list(self.messages)

    def create_agreement(
        self,
        turn: int,
        parties: List[str],
        agreement_type: AgreementType,
        terms: str,
    ) -> DiplomaticAgreement:
        """Establish a formal treaty recorded in the game state."""
        agr_id = f"agr_{turn}_{'_'.join(parties)}"
        agreement = DiplomaticAgreement(
            agreement_id=agr_id,
            turn_formed=turn,
            parties=parties,
            agreement_type=agreement_type,
            terms=terms,
            status="active",
        )
        self.agreements[agr_id] = agreement
        return agreement

    def get_active_agreements(self) -> List[DiplomaticAgreement]:
        return [a for a in self.agreements.values() if a.status == "active"]
