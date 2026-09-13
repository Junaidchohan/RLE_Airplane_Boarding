import gymnasium as gym
import airplane_boarding  # noqa: F401  (registers the env)
from gymnasium.utils.env_checker import check_env

if __name__ == "__main__":
    env = gym.make(
        "airplane-boarding-v0",
        num_of_rows=3,
        seats_per_row=5,
        render_mode=None,
    )
    check_env(env.unwrapped, skip_render_check=True)
    print("ENV CHECK PASSED")
