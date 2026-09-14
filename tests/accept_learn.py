import sys
import time
from pathlib import Path


import numpy as np
import gymnasium as gym
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import DummyVecEnv
from sb3_contrib import MaskablePPO
from sb3_contrib.common.maskable.utils import get_action_masks
from src.env.airplane_boarding import AirplaneEnv


def evaluate_policy(model, num_episodes=10, is_random=False):
    rewards = []
    eval_env = gym.make("airplane-boarding-v0", num_of_rows=5, seats_per_row=5)
    
    for ep in range(num_episodes):
        seed = 1000 + ep
        obs, _ = eval_env.reset(seed=seed)
        rng = np.random.default_rng(seed)
        ep_reward = 0.0
        terminated = False
        truncated = False
        
        while not (terminated or truncated):
            masks = eval_env.unwrapped.action_masks()
            if is_random:
                valid_actions = [i for i, m in enumerate(masks) if m]
                action = int(rng.choice(valid_actions))
            else:
                action, _ = model.predict(obs, deterministic=True, action_masks=masks)
                action = int(action)
                
            obs, reward, terminated, truncated, _ = eval_env.step(action)
            ep_reward += reward
            
        rewards.append(ep_reward)
        
    eval_env.close()
    return rewards


def main():
    print("=" * 60)
    print("RUNNING ACCEPTANCE TEST: accept_learn.py")
    print("=" * 60)
    
    num_rows = 5
    seats_per_row = 5
    timesteps = 20_000
    
    print(f"Config: num_of_rows={num_rows}, seats_per_row={seats_per_row}")
    print(f"Training MaskablePPO for {timesteps} timesteps...")
    
    train_env = make_vec_env(
        AirplaneEnv,
        n_envs=4,
        env_kwargs={"num_of_rows": num_rows, "seats_per_row": seats_per_row},
        vec_env_cls=DummyVecEnv,
        seed=42,
    )
    
    model = MaskablePPO(
        "MlpPolicy",
        train_env,
        verbose=0,
        device="cpu",
        ent_coef=0.05,
        seed=42,
    )
    
    t0 = time.time()
    model.learn(total_timesteps=timesteps)
    train_time = time.time() - t0
    print(f"Training completed in {train_time:.2f}s.")
    
    print("\nEvaluating Random (Masked) Policy over 10 episodes...")
    random_rewards = evaluate_policy(model=None, num_episodes=10, is_random=True)
    random_mean = float(np.mean(random_rewards))
    print(f"Random episode rewards: {random_rewards}")
    print(f"Random Policy Mean Reward: {random_mean:.2f}")
    
    print("\nEvaluating Trained Policy over 10 deterministic episodes...")
    trained_rewards = evaluate_policy(model=model, num_episodes=10, is_random=False)
    trained_mean = float(np.mean(trained_rewards))
    print(f"Trained episode rewards: {trained_rewards}")
    print(f"Trained Policy Mean Reward: {trained_mean:.2f}")
    
    print("\n" + "=" * 60)
    print("COMPARISON & VERDICT:")
    print(f"Random Mean Reward : {random_mean:.2f}")
    print(f"Trained Mean Reward: {trained_mean:.2f}")
    diff = trained_mean - random_mean
    print(f"Difference (Trained - Random): {diff:+.2f}")
    
    if trained_mean > random_mean:
        print(f"Result: PASS (Agent learned! Improvement of {diff:+.2f} points)")
    else:
        print("POLICY DID NOT IMPROVE")
        print("Result: FAIL")
        sys.exit(1)
        
    print("=" * 60)


if __name__ == "__main__":
    main()
