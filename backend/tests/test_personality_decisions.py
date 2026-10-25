import pytest

from app.agents.base import MockScriptedAgent
from app.schemas.contracts import AgentObservation, Nation


def create_test_observation(personality):
    """Create identical game conditions for each personality."""

    nation = Nation(
        id="nation_1",
        name="Test Nation",
        color="#3B82F6",
        leader_name="Test Leader",
        personality=personality,
        gold=100,
        food=60,
        military_units=12,
        territory_ids=["territory_1"],
        current_goals=[],
        is_alive=True,
    )

    return AgentObservation(
        turn=1,
        nation=nation,
        known_territories=[],
        current_goals=[],
        recent_events=[
            "A drought has reduced food production.",
            "A neighboring nation requests food assistance.",
        ],
        relationships={},
        visible_messages=[],
        available_actions=[
            "develop",
            "recruit",
            "claim",
            "pass",
        ],
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "personality, expected_action",
    [
        ("Opportunist", "recruit"),
        ("Altruist", "develop"),
        ("Skeptic", "recruit"),
    ],
)
async def test_personality_decision(personality, expected_action):
    observation = create_test_observation(personality)

    agent = MockScriptedAgent(
        nation_id="nation_1",
        leader_name="Test Leader",
        personality=personality,
    )

    decision = await agent.generate_decision(observation)

    assert decision.nation_id == "nation_1"
    assert len(decision.actions) > 0

    first_action = decision.actions[0]

    assert first_action.action_type == expected_action

    print(f"\n{personality}")
    print(f"Action: {first_action.action_type}")
    print(f"Reason: {first_action.reasoning_note}")


@pytest.mark.asyncio
async def test_altruist_prioritizes_food():
    observation = create_test_observation("Altruist")

    agent = MockScriptedAgent(
        nation_id="nation_1",
        leader_name="Test Leader",
        personality="Altruist",
    )

    decision = await agent.generate_decision(observation)

    assert decision.actions[0].action_type == "develop"
    assert decision.actions[0].develop_target == "food"


@pytest.mark.asyncio
async def test_skeptic_prioritizes_defense():
    observation = create_test_observation("Skeptic")

    agent = MockScriptedAgent(
        nation_id="nation_1",
        leader_name="Test Leader",
        personality="Skeptic",
    )

    decision = await agent.generate_decision(observation)

    assert decision.actions[0].action_type == "recruit"