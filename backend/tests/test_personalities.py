from app.agents.personalities import (
    PERSONALITIES,
    get_personality,
    create_personality_prompt,
)


def test_all_three_personalities_exist():
    assert set(PERSONALITIES.keys()) == {
        "opportunist",
        "altruist",
        "skeptic",
    }


def test_personalities_have_different_goals():
    goals = [
        personality.primary_goal
        for personality in PERSONALITIES.values()
    ]

    assert len(set(goals)) == 3


def test_personalities_have_different_risk_tolerances():
    assert get_personality("Opportunist").risk_tolerance == "High"
    assert get_personality("Altruist").risk_tolerance == "Moderate"
    assert get_personality("Skeptic").risk_tolerance == "Low"


def test_each_personality_generates_prompt():
    for name in PERSONALITIES:
        prompt = create_personality_prompt(name)

        assert len(prompt) > 100
        assert name.lower() in prompt.lower()
        assert "DECISION-MAKING GUIDELINES" in prompt


def test_personality_lookup_is_case_insensitive():
    assert get_personality("OPPORTUNIST") == get_personality(
        "opportunist"
    )