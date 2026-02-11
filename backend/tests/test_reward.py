from main import calculate_engagement_reward


def test_reward_low_watch_unverified():
    cents = calculate_engagement_reward(10, 60, 'IN', False)
    assert isinstance(cents, int)
    assert cents >= 0


def test_reward_full_watch_verified_us():
    cents = calculate_engagement_reward(60, 60, 'US', True)
    # base 0.015 * 1.2 * 1.2 = 0.0216 => 2.16 cents ~ 2
    assert cents >= 2


def test_reward_handles_zero_duration():
    cents = calculate_engagement_reward(0, 0, 'US', False)
    assert isinstance(cents, int)
    assert cents == 0
