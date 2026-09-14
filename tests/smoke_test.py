import os
from pathlib import Path


from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import DummyVecEnv
from sb3_contrib import MaskablePPO

from src.env.airplane_boarding import AirplaneEnv

REPO_ROOT = Path(__file__).resolve().parent.parent


def main():
    env = make_vec_env(
        AirplaneEnv,
        n_envs=2,
        env_kwargs={"num_of_rows": 5, "seats_per_row": 5},
        vec_env_cls=DummyVecEnv,
    )

    model = MaskablePPO(
        "MlpPolicy",
        env,
        verbose=1,
        device="cpu",
        ent_coef=0.05,
    )

    print("Starting smoke-test training: 2000 timesteps...")
    model.learn(total_timesteps=2000)

    out_dir = os.path.join(REPO_ROOT, "models", "smoke_test_model")
    os.makedirs(out_dir, exist_ok=True)
    model.save(os.path.join(out_dir, "model"))

    print("SMOKE TEST PASSED")
    print("Model saved to:", out_dir)


if __name__ == "__main__":
    main()
