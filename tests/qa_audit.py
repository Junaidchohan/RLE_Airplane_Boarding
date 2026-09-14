"""
QA Audit: Stress-tests AirplaneEnv over 100 episodes with a valid random policy.
Checks observation bounds, mask length, terminal state consistency.
"""
import sys
import os
import traceback
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np

import gymnasium as gym
import src.env.airplane_boarding as airplane_boarding  # noqa: registers the env


def main():
    NUM_EPISODES = 100
    results = []
    obs_out_of_bounds = 0
    mask_length_mismatches = 0
    exceptions = 0
    rewards = []

    for ep in range(NUM_EPISODES):
        env = gym.make("airplane-boarding-v0", num_of_rows=10, seats_per_row=5)
        ep_reward = 0.0
        ep_steps = 0
        ep_terminated = False
        ep_truncated = False
        ep_exception = None

        try:
            obs, info = env.reset(seed=ep)
            # Check reset obs bounds
            if not env.observation_space.contains(obs):
                obs_out_of_bounds += 1
                print(f"Ep {ep}: OUT-OF-BOUNDS obs at reset. obs min={obs.min()}, max={obs.max()}, space=({env.observation_space.low.min()},{env.observation_space.high.max()})")

            terminated = False
            truncated = False

            while not (terminated or truncated):
                mask = env.unwrapped.action_masks()
                # Check mask length
                if len(mask) != env.action_space.n:
                    mask_length_mismatches += 1
                    print(f"Ep {ep}: MASK LENGTH MISMATCH: got {len(mask)}, expected {env.action_space.n}")

                # Check all-False deadlock
                if not any(mask):
                    print(f"Ep {ep}: DEADLOCK — all mask entries are False at step {ep_steps}")
                    break

                valid_actions = [i for i, m in enumerate(mask) if m]
                rng = np.random.default_rng(ep * 10000 + ep_steps)
                action = int(rng.choice(valid_actions))

                obs, reward, terminated, truncated, info = env.step(action)
                ep_reward += reward
                ep_steps += 1

                # Check obs bounds after step
                if not env.observation_space.contains(obs):
                    obs_out_of_bounds += 1
                    print(f"Ep {ep} step {ep_steps}: OUT-OF-BOUNDS obs. min={obs.min()}, max={obs.max()}")

                # Check mask length after step (unless done)
                if not (terminated or truncated):
                    mask2 = env.unwrapped.action_masks()
                    if len(mask2) != env.action_space.n:
                        mask_length_mismatches += 1

            ep_terminated = terminated
            ep_truncated = truncated

            # Terminal state consistency check
            if terminated:
                lobby_count = env.unwrapped.lobby.count_passengers()
                boarding_line_count = sum(1 for p in env.unwrapped.boarding_line.line if p is not None)
                if lobby_count != 0 or boarding_line_count != 0:
                    print(f"Ep {ep}: TERMINAL INCONSISTENCY — lobby={lobby_count}, aisle={boarding_line_count} but terminated=True")

        except Exception as e:
            ep_exception = str(e)
            exceptions += 1
            print(f"Ep {ep}: EXCEPTION — {e}")
            traceback.print_exc()
        finally:
            env.close()

        rewards.append(ep_reward)
        results.append({
            "ep": ep,
            "steps": ep_steps,
            "reward": ep_reward,
            "terminated": ep_terminated,
            "truncated": ep_truncated,
            "exception": ep_exception,
        })

    # Summary
    print("\n" + "="*60)
    print("QA AUDIT SUMMARY — 100 Episodes")
    print("="*60)
    rewards_arr = np.array(rewards)
    print(f"Reward  — min: {rewards_arr.min():.1f}  mean: {rewards_arr.mean():.1f}  max: {rewards_arr.max():.1f}")
    print(f"Steps   — min: {min(r['steps'] for r in results)}  max: {max(r['steps'] for r in results)}")
    print(f"Exceptions:               {exceptions}")
    print(f"Out-of-bounds obs:        {obs_out_of_bounds}")
    print(f"Mask-length mismatches:   {mask_length_mismatches}")
    terminated_count = sum(1 for r in results if r['terminated'])
    print(f"Episodes terminated=True: {terminated_count}/{NUM_EPISODES}")


if __name__ == "__main__":
    main()
