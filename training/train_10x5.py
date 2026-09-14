import os
import time
from pathlib import Path

import numpy as np
import gymnasium as gym
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import DummyVecEnv
from sb3_contrib import MaskablePPO
from src.env.airplane_boarding import AirplaneEnv


def evaluate(model, num_episodes=10, is_random=False):
    eval_env = gym.make("airplane-boarding-v0", num_of_rows=10, seats_per_row=5)
    rewards = []
    
    for ep in range(num_episodes):
        seed = 2000 + ep
        obs, _ = eval_env.reset(seed=seed)
        rng = np.random.default_rng(seed)
        ep_reward = 0.0
        terminated = False
        truncated = False
        
        while not (terminated or truncated):
            mask = eval_env.unwrapped.action_masks()
            if is_random:
                valid = [i for i, m in enumerate(mask) if m]
                action = int(rng.choice(valid))
            else:
                action, _ = model.predict(obs, deterministic=True, action_masks=mask)
                action = int(action)
                
            obs, reward, terminated, truncated, _ = eval_env.step(action)
            ep_reward += reward
            
        rewards.append(ep_reward)
    eval_env.close()
    return rewards


def main():
    repo_root = Path(__file__).resolve().parent.parent
    model_dir = os.path.join(repo_root, "models", "frontend_10x5")
    os.makedirs(model_dir, exist_ok=True)
    save_path = os.path.join(model_dir, "model.zip")
    
    print(f"Training MaskablePPO for 20,000 steps on num_of_rows=10, seats_per_row=5...")
    
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
        ent_coef=0.05,
        seed=42,
    )
    
    t0 = time.time()
    model.learn(total_timesteps=20_000)
    print(f"Training finished in {time.time() - t0:.2f}s")
    
    # Save model
    model.save(save_path)
    print(f"Model saved to {save_path}")
    
    # Evaluate
    print("Evaluating 10 episodes Random...")
    rnd_rewards = evaluate(None, num_episodes=10, is_random=True)
    rnd_mean = np.mean(rnd_rewards)
    print(f"Random Mean: {rnd_mean:.2f} (Episodes: {rnd_rewards})")
    
    print("Evaluating 10 episodes Trained...")
    trn_rewards = evaluate(model, num_episodes=10, is_random=False)
    trn_mean = np.mean(trn_rewards)
    print(f"Trained Mean: {trn_mean:.2f} (Episodes: {trn_rewards})")
    
    diff = trn_mean - rnd_mean
    print(f"Improvement: {diff:+.2f}")
    if trn_mean > rnd_mean:
        print("PASS: Trained policy outperforms random policy.")
    else:
        print("WARNING: Trained policy did not outperform random policy.")


if __name__ == "__main__":
    main()
