import sys
import os
import traceback
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import gymnasium as gym
from gymnasium import spaces
import src.env.airplane_boarding as airplane_boarding
from src.env.airplane_boarding import AirplaneEnv, PassengerStatus


def check_1_task():
    print("\n--- CHECK 1: TASK is well-defined ---")
    env = gym.make("airplane-boarding-v0", num_of_rows=5, seats_per_row=5)
    obs, info = env.reset(seed=42)
    unwrapped = env.unwrapped
    
    total_passengers = unwrapped.num_of_seats
    lobby_passengers = unwrapped.lobby.count_passengers()
    boarding_line_passengers = sum(1 for p in unwrapped.boarding_line.line if p is not None)
    
    total_seated = sum(
        1 for row in unwrapped.airplane_rows for seat in row.seats if seat.passenger is not None
    )
    
    print(f"Total plane seats: {total_passengers}")
    print(f"Initial state: Lobby passengers={lobby_passengers}, Aisle line passengers={boarding_line_passengers}, Seated={total_seated}")
    print(f"Task Objective: Board all {total_passengers} passengers from lobby to plane seats while minimizing aisle stalling.")
    
    assert lobby_passengers == total_passengers, f"Expected {total_passengers} in lobby, got {lobby_passengers}"
    assert boarding_line_passengers == 0, f"Expected empty aisle line at reset, got {boarding_line_passengers}"
    assert total_seated == 0, f"Expected 0 seated at reset, got {total_seated}"
    
    # Check that after running to completion, objective is confirmed (all passengers seated)
    terminated = False
    while not terminated:
        masks = unwrapped.action_masks()
        valid = [i for i, m in enumerate(masks) if m]
        obs, r, terminated, truncated, _ = env.step(valid[0])
    
    final_seated = sum(
        1 for row in unwrapped.airplane_rows for seat in row.seats if seat.passenger is not None
    )
    print(f"Final state: Seated={final_seated}/{total_passengers}, Lobby={unwrapped.lobby.count_passengers()}, Aisle={sum(1 for p in unwrapped.boarding_line.line if p is not None)}")
    assert final_seated == total_passengers, f"Objective failed: only {final_seated}/{total_passengers} seated"
    env.close()
    print("CHECK 1 RESULT: PASS")
    return True


def check_2_state_changes():
    print("\n--- CHECK 2: STATE changes on action ---")
    env = gym.make("airplane-boarding-v0", num_of_rows=5, seats_per_row=5)
    obs_initial, _ = env.reset(seed=123)
    snapshot_initial = obs_initial.copy()
    
    print(f"Snapshot initial obs (first 10 values): {snapshot_initial[:10]}")
    
    for step in range(3):
        masks = env.unwrapped.action_masks()
        valid = [i for i, m in enumerate(masks) if m]
        action = valid[0]
        obs_after, reward, terminated, truncated, _ = env.step(action)
        print(f"  Step {step + 1}: Action={action}, Reward={reward}")
    
    snapshot_after_3 = obs_after.copy()
    print(f"Snapshot after 3 steps (first 10 values): {snapshot_after_3[:10]}")
    
    diff_indices = np.where(snapshot_initial != snapshot_after_3)[0]
    print(f"Obs indices changed: {diff_indices.tolist()}")
    print(f"Differences (initial vs after 3 steps):")
    for idx in diff_indices[:6]:
        print(f"  Index {idx}: {snapshot_initial[idx]} -> {snapshot_after_3[idx]}")
    
    assert len(diff_indices) > 0, "State did not change after taking 3 steps!"
    assert not np.array_equal(snapshot_initial, snapshot_after_3), "Observation array is identical before and after 3 steps!"
    env.close()
    print("CHECK 2 RESULT: PASS")
    return True


def check_3_action_space():
    print("\n--- CHECK 3: ACTION space is meaningful ---")
    num_rows = 5
    seats_per_row = 3
    env = gym.make("airplane-boarding-v0", num_of_rows=num_rows, seats_per_row=seats_per_row)
    env.reset(seed=99)
    unwrapped = env.unwrapped
    
    # 1. Verify action space is Discrete(num_of_rows)
    assert isinstance(env.action_space, spaces.Discrete), f"Action space is not Discrete: {type(env.action_space)}"
    assert env.action_space.n == num_rows, f"Action space size is {env.action_space.n}, expected {num_rows}"
    print(f"Action space confirmed: Discrete({env.action_space.n})")
    
    # 2. Initially all rows have passengers, so all actions should be True
    initial_masks = unwrapped.action_masks()
    print(f"Initial action masks: {initial_masks}")
    assert len(initial_masks) == num_rows, f"Mask length {len(initial_masks)} != num_rows {num_rows}"
    assert all(initial_masks), f"Expected all True initially, got: {initial_masks}"
    
    # 3. Exhaust all passengers from row 2
    row_to_empty = 2
    for _ in range(seats_per_row):
        assert unwrapped.action_masks()[row_to_empty] == True, "Row should be valid before exhausting"
        env.step(row_to_empty)
    
    # 4. Now row 2 must be masked out (False), and others must be True
    masks_after_empty = unwrapped.action_masks()
    print(f"Action masks after exhausting row {row_to_empty}: {masks_after_empty}")
    assert masks_after_empty[row_to_empty] == False, f"Row {row_to_empty} should be masked out (False)"
    for r in range(num_rows):
        if r != row_to_empty:
            assert masks_after_empty[r] == True, f"Row {r} should still be True"
            
    env.close()
    print("CHECK 3 RESULT: PASS")
    return True


def check_4_reward_consistency():
    print("\n--- CHECK 4: REWARD is programmatic and consistent ---")
    rewards_run1 = []
    rewards_run2 = []
    
    # Run 5 episodes with fixed seeds, then repeat to verify determinism
    for seed in range(5):
        # Run 1
        env = gym.make("airplane-boarding-v0", num_of_rows=5, seats_per_row=5)
        obs, _ = env.reset(seed=seed)
        rng = np.random.default_rng(seed * 100)
        tot_r1 = 0.0
        terminated = False
        while not terminated:
            masks = env.unwrapped.action_masks()
            valid = [i for i, m in enumerate(masks) if m]
            action = int(rng.choice(valid))
            obs, r, terminated, _, _ = env.step(action)
            assert isinstance(r, (int, float, np.number)), f"Reward is not numeric: {type(r)}"
            tot_r1 += r
        rewards_run1.append(tot_r1)
        env.close()
        
        # Run 2 (repeat with same seed)
        env2 = gym.make("airplane-boarding-v0", num_of_rows=5, seats_per_row=5)
        obs2, _ = env2.reset(seed=seed)
        rng2 = np.random.default_rng(seed * 100)
        tot_r2 = 0.0
        terminated2 = False
        while not terminated2:
            masks2 = env2.unwrapped.action_masks()
            valid2 = [i for i, m in enumerate(masks2) if m]
            action2 = int(rng2.choice(valid2))
            obs2, r2, terminated2, _, _ = env2.step(action2)
            tot_r2 += r2
        rewards_run2.append(tot_r2)
        env2.close()
    
    print(f"5 Masked-random episode rewards (Run 1): {rewards_run1}")
    print(f"5 Masked-random episode rewards (Run 2): {rewards_run2}")
    
    assert rewards_run1 == rewards_run2, f"Rewards were not deterministic! {rewards_run1} vs {rewards_run2}"
    
    min_r = min(rewards_run1)
    mean_r = float(np.mean(rewards_run1))
    max_r = max(rewards_run1)
    print(f"Reward stats over 5 episodes: Min={min_r:.1f}, Mean={mean_r:.2f}, Max={max_r:.1f}")
    print("CHECK 4 RESULT: PASS")
    return True


def check_5_terminal_condition():
    print("\n--- CHECK 5: TERMINAL condition works ---")
    env = gym.make("airplane-boarding-v0", num_of_rows=5, seats_per_row=5)
    obs, _ = env.reset(seed=777)
    unwrapped = env.unwrapped
    
    step_count = 0
    total_reward = 0.0
    terminated = False
    
    while not terminated:
        masks = unwrapped.action_masks()
        valid = [i for i, m in enumerate(masks) if m]
        # Step
        action = valid[0]
        obs, reward, terminated, truncated, _ = env.step(action)
        total_reward += reward
        step_count += 1
        
        lobby_count = unwrapped.lobby.count_passengers()
        line_count = sum(1 for p in unwrapped.boarding_line.line if p is not None)
        
        if not terminated:
            assert (lobby_count > 0 or line_count > 0), (
                f"Step {step_count}: terminated is False but lobby={lobby_count} and line={line_count} are both empty!"
            )
        else:
            assert lobby_count == 0 and line_count == 0, (
                f"Step {step_count}: terminated is True but lobby={lobby_count} or line={line_count} not empty!"
            )
    
    print(f"Episode completed in {step_count} steps.")
    print(f"At terminal state: Lobby count={unwrapped.lobby.count_passengers()}, Boarding line count={sum(1 for p in unwrapped.boarding_line.line if p is not None)}")
    print(f"Final total reward: {total_reward}")
    env.close()
    print("CHECK 5 RESULT: PASS")
    return True


def main():
    checks = [
        ("CHECK 1 (TASK is well-defined)", check_1_task),
        ("CHECK 2 (STATE changes on action)", check_2_state_changes),
        ("CHECK 3 (ACTION space is meaningful)", check_3_action_space),
        ("CHECK 4 (REWARD is programmatic and consistent)", check_4_reward_consistency),
        ("CHECK 5 (TERMINAL condition works)", check_5_terminal_condition),
    ]
    
    results = {}
    print("=" * 60)
    print("RUNNING ACCEPTANCE TEST: accept_rle.py")
    print("=" * 60)
    
    all_passed = True
    for name, func in checks:
        try:
            passed = func()
            results[name] = "PASS" if passed else "FAIL"
        except Exception as e:
            results[name] = "FAIL"
            all_passed = False
            print(f"\n[!] FAILURE in {name}: {e}")
            traceback.print_exc()
            
    print("\n" + "=" * 60)
    print("ACCEPT_RLE SUMMARY:")
    for name, res in results.items():
        print(f"  {name}: {res}")
    print("=" * 60)
    
    if not all_passed:
        sys.exit(1)


if __name__ == "__main__":
    main()
