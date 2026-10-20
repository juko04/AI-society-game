"""Memory management system for AI civilizations in Emergent Nations.

Separates objective historical facts from subjective relationship beliefs
and transient context. Implements memory decay stubs.
"""

from typing import List, Dict, Optional
from app.schemas.contracts import MemoryEntry, MemoryType


class MemoryManager:
    """Stores and updates long-term memories and current relationship beliefs."""

    def __init__(self):
        # Map of nation_id -> List[MemoryEntry]
        self._memories: Dict[str, List[MemoryEntry]] = {}

    def record_memory(
        self,
        nation_id: str,
        memory_type: MemoryType,
        summary: str,
        turn: int,
        subject_nation_id: Optional[str] = None,
        importance: float = 0.5,
    ) -> MemoryEntry:
        """Add a new memory entry for a civilization."""
        if nation_id not in self._memories:
            self._memories[nation_id] = []

        mem_id = f"mem_{nation_id}_{turn}_{len(self._memories[nation_id]) + 1}"
        entry = MemoryEntry(
            memory_id=mem_id,
            nation_id=nation_id,
            memory_type=memory_type,
            subject_nation_id=subject_nation_id,
            summary=summary,
            importance=importance,
            turn_recorded=turn,
            last_updated_turn=turn,
        )
        self._memories[nation_id].append(entry)
        return entry

    def get_memories_for_nation(
        self, nation_id: str, memory_type: Optional[MemoryType] = None
    ) -> List[MemoryEntry]:
        """Fetch memories for a nation, optionally filtered by type."""
        entries = self._memories.get(nation_id, [])
        if memory_type:
            return [m for m in entries if m.memory_type == memory_type]
        return list(entries)

    def apply_memory_decay(self, current_turn: int, decay_rate: float = 0.05) -> None:
        """Gradually reduce the importance of older, non-critical memories."""
        for nation_id, entries in self._memories.items():
            for m in entries:
                if m.memory_type == "recent_context":
                    age = current_turn - m.turn_recorded
                    m.importance = max(0.1, m.importance - (age * decay_rate))
