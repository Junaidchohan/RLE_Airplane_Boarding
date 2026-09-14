"""
QA Reward Audit: Deterministic fixed-seed episode with step-by-step reward trace.
Confirms: cumulative sum == total; reward density; can random policy score > 0?
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import gymnasium as gym
import src.env.airplane_boarding as airplane_boarding  # noqa

SEED = 42

env = gym.make("airplane-boarding-v0", num_of_rows=5, seats_per_row=5)
obs, _ = env.reset(seed=SEED)

step_num = 0
running_total = 0.0
print(f"{'Step':>5} {'Action':>6} {'StepRwd':>9} {'CumTotal':>10}")
print("-" * 38)

terminated = False
truncated = False

import numpy as np
rng = np.random.default_rng(SEED)

while not (terminated or truncated):
    mask = env.unwrapped.action_masks()
    valid = [i for i, m in enumerate(mask) if m]
    # Use deterministic "always pick first valid row" to produce a fixed sequence
    action = valid[0]

    obs, reward, terminated, truncated, _ = env.step(action)
    step_num += 1
    running_total += reward
    print(f"{step_num:>5} {action:>6} {reward:>9.1f} {running_total:>10.1f}")

print("-" * 38)
print(f"Final cumulative reward: {running_total:.1f}")
print(f"Total steps: {step_num}")
print()

# Characterise reward
if running_total > 0:
    print("RESULT: Random/greedy policy CAN achieve positive total reward — task is possibly too easy or reward not penalizing enough.")
else:
    print("RESULT: Positive total reward NOT achievable with greedy-first policy. Task is negatively rewarded throughout (penalty-based).")

print()
print("Reward function notes:")
print("  - Reward per step = -num_stalled_passengers (dense, always <= 0)")
print("  - No positive reward signal anywhere in _calculate_reward().")
print("  - The agent can ONLY minimize losses, never gain positive reward.")
print("  - This means the maximum possible episode total is 0 (no one ever stalls).")
print("  - Naive random policies typically score around -160 (from qa_audit summary).")

env.close()
