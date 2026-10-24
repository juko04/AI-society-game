from app.agents.personalities import get_personality


# A scenario that all three agents will face
scenario = {
    "name": "Food Shortage",
    "description": (
        "A severe drought has reduced food production. "
        "Your nation currently has 50 units of food. "
        "A neighboring nation has only 10 units and "
        "requests 15 units of food."
    ),
    "available_actions": [
        "Share food",
        "Offer a trade",
        "Refuse the request",
        "Negotiate a smaller amount"
    ]
}


# Expected tendencies, not predetermined AI decisions
expected_behaviors = {
    "Opportunist": (
        "May offer food in exchange for resources, "
        "influence, or a favorable agreement."
    ),
    "Altruist": (
        "May share food to support the neighboring nation, "
        "provided its own survival is not threatened."
    ),
    "Skeptic": (
        "May request more information or preserve reserves "
        "until the risks are better understood."
    )
}


def run_scenario():
    print("\n" + "=" * 55)
    print("EMERGENT NATIONS — PERSONALITY SCENARIO TEST")
    print("=" * 55)

    print(f"\nSCENARIO: {scenario['name']}")
    print(scenario["description"])

    print("\nAVAILABLE ACTIONS:")
    for action in scenario["available_actions"]:
        print(f"- {action}")

    for name in ["Opportunist", "Altruist", "Skeptic"]:
        personality = get_personality(name)

        print("\n" + "-" * 55)
        print(f"AGENT: {personality.name}")
        print("-" * 55)

        print(f"Primary Goal: {personality.primary_goal}")
        print(f"Risk Tolerance: {personality.risk_tolerance}")
        print(f"Trust Level: {personality.trust_level}")

        print("\nExpected Behavioral Tendency:")
        print(expected_behaviors[name])

    print("\n" + "=" * 55)
    print("SCENARIO REVIEW COMPLETE")
    print("=" * 55)


if __name__ == "__main__":
    run_scenario()