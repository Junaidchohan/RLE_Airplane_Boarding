import sys
import os
import random
import contextlib
import gymnasium as gym
import airplane_boarding
from sb3_contrib import MaskablePPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import DummyVecEnv

def get_state(env, step_count, reward_step, reward_total, terminated, action, message=None):
    unwrapped = env.unwrapped
    cabin = []
    for row in unwrapped.airplane_rows:
        row_data = []
        for seat in row.seats:
            state = "empty"
            passenger_str = None
            if seat.passenger is not None:
                state = "seated"
                passenger_str = str(seat.passenger)
            row_data.append({
                "seat_num": seat.seat_num,
                "state": state,
                "passenger": passenger_str
            })
        cabin.append(row_data)
        
    aisle = []
    moving_count = 0
    stalled_count = 0
    stowing_count = 0
    
    for i, p in enumerate(unwrapped.boarding_line.line):
        if p is not None:
            status_str = str(p.status)
            if p.status == airplane_boarding.PassengerStatus.MOVING:
                moving_count += 1
            elif p.status == airplane_boarding.PassengerStatus.STALLED:
                stalled_count += 1
            elif p.status == airplane_boarding.PassengerStatus.STOWING:
                stowing_count += 1
                
            aisle.append({
                "row": i,
                "passenger": str(p),
                "status": status_str
            })
            if p.status == airplane_boarding.PassengerStatus.STOWING:
                target_row = p.row_num
                for s in cabin[target_row]:
                    if s["seat_num"] == p.seat_num:
                        s["state"] = "stowing"
                        s["passenger"] = str(p)
                        
    lobby = []
    for r in unwrapped.lobby.lobby_rows:
        lobby.append({
            "row": r.row_num,
            "passengers": [str(p) for p in r.passengers]
        })
        
    total = unwrapped.num_of_seats
    seated = total - unwrapped.lobby.count_passengers() - len([p for p in unwrapped.boarding_line.line if p is not None])
    mask = unwrapped.action_masks()
    
    return {
        "ok": True,
        "step": step_count,
        "reward_step": float(reward_step),
        "reward_total": float(reward_total),
        "terminated": terminated,
        "action": action,
        "cabin": cabin,
        "aisle": aisle,
        "lobby": lobby,
        "stats": {
            "seated": seated,
            "total": total,
            "stalled": stalled_count,
            "moving": moving_count,
            "stowing": stowing_count,
            "mask": mask
        },
        "message": message
    }

class AirplaneBoardingSession:
    def __init__(self):
        self.env = None
        self.model = None
        self.step_count = 0
        self.reward_total = 0.0
        self.reward_step = 0.0
        self.terminated = False
        self.last_action = None
        self.message = None
        self.has_model = False
        
        self.load_model()
        
    def load_model(self):
        project_root = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(project_root, "models", "frontend_10x5", "model.zip")
        self.has_model = os.path.exists(model_path)
        if self.has_model:
            try:
                with contextlib.redirect_stdout(sys.stderr):
                    dummy_env = gym.make("airplane-boarding-v0", num_of_rows=10, seats_per_row=5)
                    self.model = MaskablePPO.load(model_path, env=dummy_env)
                sys.stderr.write(f"[rle_core] Successfully loaded trained model from {model_path}\n")
            except Exception as e:
                sys.stderr.write(f"[rle_core] Model loading failed: {e}\n")
                self.model = None
                self.has_model = False
        else:
            sys.stderr.write(f"[rle_core] Trained model not found at {model_path}\n")

    def reset(self, seed=42, num_of_rows=10, seats_per_row=5):
        self.env = gym.make("airplane-boarding-v0", num_of_rows=num_of_rows, seats_per_row=seats_per_row)
        if self.has_model and self.model is not None:
            try:
                with contextlib.redirect_stdout(sys.stderr):
                    self.model.set_env(self.env)
            except Exception as e:
                sys.stderr.write(f"[rle_core] model.set_env failed: {e}\n")
        
        self.env.reset(seed=seed)
        self.step_count = 0
        self.reward_total = 0.0
        self.reward_step = 0.0
        self.terminated = False
        self.last_action = None
        self.message = None
        return get_state(self.env, self.step_count, self.reward_step, self.reward_total, self.terminated, self.last_action, self.message)

    def step(self, action=None, policy="random"):
        if self.env is None:
            self.reset()
            
        if self.terminated:
            return {"ok": False, "error": "Episode is terminated"}
            
        mask = self.env.unwrapped.action_masks()
        message = None
        
        if action is None:
            if policy == "trained" and self.model is not None:
                obs = self.env.unwrapped._get_observation()
                action, _ = self.model.predict(obs, action_masks=mask, deterministic=True)
                action = int(action)
            else:
                if policy == "trained":
                    message = "Trained model not found, falling back to random."
                valid_actions = [i for i, m in enumerate(mask) if m]
                action = random.choice(valid_actions)
                
        self.last_action = action
        obs, reward, self.terminated, truncated, _ = self.env.step(action)
        self.reward_step = reward
        self.reward_total += reward
        self.step_count += 1
        self.message = message
        return get_state(self.env, self.step_count, self.reward_step, self.reward_total, self.terminated, self.last_action, self.message)

    def state(self):
        if self.env is None:
            return self.reset()
        return get_state(self.env, self.step_count, self.reward_step, self.reward_total, self.terminated, self.last_action, self.message)

    def train(self, timesteps=20000, stream_callback=None):
        train_env = make_vec_env(
            airplane_boarding.AirplaneEnv,
            n_envs=2,
            env_kwargs={"num_of_rows": 10, "seats_per_row": 5},
            vec_env_cls=DummyVecEnv,
        )
        train_model = MaskablePPO("MlpPolicy", train_env, verbose=0, device="cpu", ent_coef=0.05)
        
        if stream_callback:
            train_model.learn(total_timesteps=timesteps, callback=stream_callback)
        else:
            train_model.learn(total_timesteps=timesteps)
            
        project_root = os.path.dirname(os.path.abspath(__file__))
        out_dir = os.path.join(project_root, "models", "frontend_20k")
        os.makedirs(out_dir, exist_ok=True)
        save_path = os.path.join(out_dir, "model")
        train_model.save(save_path)
        
        # Reload model into session
        self.model = train_model
        self.has_model = True
        return {
            "ok": True,
            "training": False,
            "done": True,
            "saved_to": save_path + ".zip"
        }
