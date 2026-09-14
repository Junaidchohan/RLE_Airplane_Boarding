import sys
import os
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import gymnasium as gym
import src.env.airplane_boarding  # noqa: F401
from sb3_contrib import MaskablePPO
from sb3_contrib.common.maskable.utils import get_action_masks

REPO_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = os.path.join(REPO_ROOT, "models", "smoke_test_model", "model")

env = gym.make("airplane-boarding-v0", num_of_rows=5, seats_per_row=5)
model = MaskablePPO.load(MODEL_PATH, env=env)

obs, _ = env.reset()
total_reward = 0.0
steps = 0
terminated = False

while not terminated:
    masks = get_action_masks(env)
    action, _ = model.predict(obs, deterministic=True, action_masks=masks)
    obs, reward, terminated, truncated, _ = env.step(action)
    total_reward += reward
    steps += 1
    if truncated:
        break

print(f"Episode finished in {steps} steps.")
print(f"Total reward (untrained 2k model): {total_reward}")
