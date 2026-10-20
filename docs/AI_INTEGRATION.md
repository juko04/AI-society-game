# Emergent Nations - AI Integration & Local Model Guide

This guide is maintained for **Julian** (Local AI lead) and the team to configure, test, and benchmark local LLM inference with **Ollama**.

---

## 1. Local AI Hosting Setup (Ollama)

We use **Ollama** because it is free, runs locally on macOS (Apple Silicon M2 / Metal acceleration), and exposes a clean local HTTP API (`http://localhost:11434`).

### Installing Ollama (Mac)
```bash
brew install ollama
# Or download directly from https://ollama.com
```

### Pulling Recommended Models
```bash
# Primary target model (approx 5GB VRAM)
ollama pull qwen2.5:7b
# or when Qwen3 is available:
# ollama pull qwen3:8b

# Lightweight test alternative (approx 2.5GB VRAM)
ollama pull qwen2.5:3b
```

### Verifying Ollama API
```bash
curl http://localhost:11434/api/tags
```

---

## 2. Environment Configuration

To enable live local AI agents in the simulation, update `.env` or `backend/.env`:

```env
USE_MOCK_AGENTS=false
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_AI_MODEL=qwen2.5:7b
```

When `USE_MOCK_AGENTS=true` (the default in Phase 0), the simulation uses `MockScriptedAgent`, allowing teammates to test frontend, game engine, and persistence without running Ollama.

---

## 3. Observation & Decision Prompt Pipeline

### System Prompt Template
```text
You are {leader_name}, the supreme ruler of the nation of {nation_name}.
Your personality archetype is: {personality}.
Your duty is to guide your civilization to survive, prosper, and advance its interests.
You will be provided with an observation of the world, your treasury, controlled lands, and recent events.
You must respond with valid JSON adhering to the specified schema.
```

### Observation Input Schema (`AgentObservation`)
```json
{
  "turn": 3,
  "nation": {
    "id": "nation_solaria",
    "name": "Solaria",
    "gold": 120,
    "food": 72,
    "military_units": 14,
    "territory_ids": ["T01", "T02", "T03"]
  },
  "current_goals": ["Secure border passes", "Expand agriculture"],
  "recent_events": ["Borealis offered a trade agreement"],
  "relationships": { "nation_borealis": "Cooperative" },
  "visible_messages": [...],
  "available_actions": ["claim", "recruit", "develop", "move", "attack", "transfer", "pass"]
}
```

### Required Decision Output Format (`AgentDecision`)
```json
{
  "nation_id": "nation_solaria",
  "turn": 3,
  "actions": [
    {
      "action_type": "claim",
      "target_territory_id": "T04",
      "reasoning_note": "Expand towards eastern valley for food production."
    },
    {
      "action_type": "develop",
      "target_territory_id": "T01",
      "develop_target": "food",
      "reasoning_note": "Ensure food stability for army upkeep."
    }
  ],
  "outgoing_messages": [
    {
      "recipient_id": "nation_borealis",
      "is_private": true,
      "content": "Solaria agrees to your trade proposal. We will not encroach north."
    }
  ],
  "strategy_note": "Securing eastern flank while maintaining peace with northern neighbor."
}
```

---

## 4. Robustness & Fallback Rules

1. **Output Validation:** The backend checks the model's response against `AgentDecision`.
2. **Invalid Action Handling:** If an AI proposes an illegal action (e.g., claiming territory it cannot afford or does not border), the action is rejected and converted to a safe `pass`, recording an event in the log.
3. **Network/Timeout Fallback:** If Ollama times out (> 15 seconds) or fails to respond, `OllamaAgentAdapter` falls back to `MockScriptedAgent` so the simulation loop never crashes.

---

## 5. Benchmarking on Apple Silicon M2 (24 GB)

Julian will benchmark inference performance across:
1. **Single-agent latency:** Time to return decision (target: < 2.0s per agent).
2. **Sequential turn latency:** 6 agents queried in sequence (target: < 12s per turn).
3. **Context window usage:** Ensuring prompt + history stays within 2048-4096 tokens.
