import os
import sys
import time
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import numpy as np
import gymnasium as gym
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import DummyVecEnv
from sb3_contrib import MaskablePPO
from src.env.airplane_boarding import AirplaneEnv


def main():
    repo_root = Path(__file__).resolve().parent.parent
    out_dir = os.path.join(repo_root, "models", "frontend_10x5")
    os.makedirs(out_dir, exist_ok=True)
    save_path = os.path.join(out_dir, "model")

    print("Training 20k steps MaskablePPO on num_of_rows=10, seats_per_row=5...")
    train_env = make_vec_env(
        AirplaneEnv,
        n_envs=4,
        env_kwargs={"num_of_rows": 10, "seats_per_row": 5},
        vec_env_cls=DummyVecEnv,
        seed=42,
    )

    model = MaskablePPO(
        "MlpPolicy",
        train_env,
        verbose=1,
        device="cpu",
        n_steps=64,
        batch_size=32,
        n_epochs=10,
        learning_rate=0.002,
        ent_coef=0.005,
        seed=42,
    )

    t0 = time.time()
    model.learn(total_timesteps=20000)
    print(f"Training completed in {time.time() - t0:.2f}s")

    model.save(save_path)
    print(f"Saved model to {save_path}.zip")

    # Evaluation on seed 42
    eval_env = gym.make("airplane-boarding-v0", num_of_rows=10, seats_per_row=5)
    obs, _ = eval_env.reset(seed=42)
    tot = 0
    steps = 0
    while True:
        mask = eval_env.unwrapped.action_masks()
        act, _ = model.predict(obs, deterministic=True, action_masks=mask)
        obs, r, term, _, _ = eval_env.step(int(act))
        tot += r
        steps += 1
        if term:
            break
    print(f"Trained Deterministic Reward on seed 42: {tot} (steps: {steps})")


if __name__ == "__main__":
    main()
