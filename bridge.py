import sys
import json
import os
import gymnasium as gym
import airplane_boarding
from sb3_contrib import MaskablePPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import DummyVecEnv

def get_state(env, step_count, reward_step, reward_total, terminated, action, message=None):
    
    unwrapped = env.unwrapped
    num_rows = unwrapped.num_of_rows
    seats_per_row = unwrapped.seats_per_row
    
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
            # If passenger is stowing in the aisle, find their target seat and mark it as stowing
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

def main():
    env = None
    model = None
    step_count = 0
    reward_total = 0.0
    reward_step = 0.0
    terminated = False
    last_action = None
    message = None
    
    # Preload model if available
    project_root = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(project_root, "models", "frontend_10x5", "model.zip")
    has_model = os.path.exists(model_path)
    if has_model:
        import contextlib
        with contextlib.redirect_stdout(sys.stderr):
            # Dummy env for loading (must match trained model's shape)
            dummy_env = gym.make("airplane-boarding-v0", num_of_rows=10, seats_per_row=5)
            model = MaskablePPO.load(model_path, env=dummy_env)
        sys.stderr.write(f"[bridge] Successfully loaded trained model from {model_path}\n")
    else:
        sys.stderr.write(f"[bridge] Trained model not found at {model_path}\n")
        
    sys.stderr.write("BRIDGE READY\n")
    sys.stderr.flush()

    for line in sys.stdin:
        try:
            req = json.loads(line)
            cmd = req.get("cmd")
            
            if cmd == "reset":
                seed = req.get("seed", 42)
                num_rows = req.get("num_of_rows", 10)
                seats_per_row = req.get("seats_per_row", 5)
                
                env = gym.make("airplane-boarding-v0", num_of_rows=num_rows, seats_per_row=seats_per_row)
                if has_model and model is not None:
                    try:
                        import contextlib
                        with contextlib.redirect_stdout(sys.stderr):
                            model.set_env(env)
                    except ValueError as e:
                        # Observation space mismatch
                        sys.stderr.write(f"[bridge] model.set_env failed: {e}\n")
                        model = None
                    
                obs, _ = env.reset(seed=seed)
                step_count = 0
                reward_total = 0.0
                reward_step = 0.0
                terminated = False
                last_action = None
                message = None
                
                print(json.dumps(get_state(env, step_count, reward_step, reward_total, terminated, last_action, message)), flush=True)
                
            elif cmd == "step":
                if env is None:
                    print(json.dumps({"ok": False, "error": "Must call reset first"}), flush=True)
                    continue
                    
                if terminated:
                    print(json.dumps({"ok": False, "error": "Episode is terminated"}), flush=True)
                    continue
                    
                policy = req.get("policy", "random")
                action = req.get("action")
                message = None
                
                mask = env.unwrapped.action_masks()
                
                if action is None:
                    if policy == "trained" and model is not None:
                        obs = env.unwrapped._get_observation()
                        action, _ = model.predict(obs, action_masks=mask, deterministic=True)
                        action = int(action)
                    else:
                        if policy == "trained":
                            message = "Trained model not found, falling back to random."
                        valid_actions = [i for i, m in enumerate(mask) if m]
                        import random
                        action = random.choice(valid_actions)
                
                last_action = action
                obs, reward, terminated, truncated, _ = env.step(action)
                
                reward_step = reward
                reward_total += reward
                step_count += 1
                
                print(json.dumps(get_state(env, step_count, reward_step, reward_total, terminated, last_action, message)), flush=True)
                
            elif cmd == "state":
                if env is None:
                    print(json.dumps({"ok": False, "error": "Must call reset first"}), flush=True)
                    continue
                print(json.dumps(get_state(env, step_count, reward_step, reward_total, terminated, last_action, message)), flush=True)
                
            elif cmd == "train":
                timesteps = req.get("timesteps", 20000)
                
                train_env = make_vec_env(
                    airplane_boarding.AirplaneEnv,
                    n_envs=2,
                    env_kwargs={"num_of_rows": 10, "seats_per_row": 5},
                    vec_env_cls=DummyVecEnv,
                )
                
                train_model = MaskablePPO("MlpPolicy", train_env, verbose=0, device="cpu", ent_coef=0.05)
                
                # We need a custom callback to stream the lines
                from stable_baselines3.common.callbacks import BaseCallback
                class StreamCallback(BaseCallback):
                    def __init__(self, verbose=0):
                        super().__init__(verbose)
                        self.last_reported = 0
                        
                    def _on_step(self) -> bool:
                        if self.num_timesteps - self.last_reported >= 500:
                            ep_rew_mean = -1.0
                            ep_len_mean = -1.0
                            if len(self.model.ep_info_buffer) > 0:
                                ep_rew_mean = sum([ep_info["r"] for ep_info in self.model.ep_info_buffer]) / len(self.model.ep_info_buffer)
                                ep_len_mean = sum([ep_info["l"] for ep_info in self.model.ep_info_buffer]) / len(self.model.ep_info_buffer)
                            
                            print(json.dumps({
                                "ok": True, 
                                "training": True, 
                                "timesteps_done": self.num_timesteps,
                                "ep_rew_mean": ep_rew_mean,
                                "ep_len_mean": ep_len_mean
                            }), flush=True)
                            self.last_reported = self.num_timesteps
                        return True
                        
                train_model.learn(total_timesteps=timesteps, callback=StreamCallback())
                
                project_root = os.path.dirname(os.path.abspath(__file__))
                out_dir = os.path.join(project_root, "models", "frontend_20k")
                os.makedirs(out_dir, exist_ok=True)
                save_path = os.path.join(out_dir, "model")
                train_model.save(save_path)
                
                print(json.dumps({
                    "ok": True,
                    "training": False,
                    "done": True,
                    "saved_to": save_path + ".zip"
                }), flush=True)

            elif cmd == "quit":
                break
            else:
                print(json.dumps({"ok": False, "error": f"Unknown command: {cmd}"}), flush=True)
        except Exception as e:
            print(json.dumps({"ok": False, "error": str(e)}), flush=True)

if __name__ == "__main__":
    main()
