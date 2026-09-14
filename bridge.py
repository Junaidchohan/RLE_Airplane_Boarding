import sys
import json
from rle_core import AirplaneBoardingSession
from stable_baselines3.common.callbacks import BaseCallback

def main():
    session = AirplaneBoardingSession()
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
                res = session.reset(seed=seed, num_of_rows=num_rows, seats_per_row=seats_per_row)
                print(json.dumps(res), flush=True)
                
            elif cmd == "step":
                policy = req.get("policy", "random")
                action = req.get("action")
                res = session.step(action=action, policy=policy)
                print(json.dumps(res), flush=True)
                
            elif cmd == "state":
                res = session.state()
                print(json.dumps(res), flush=True)
                
            elif cmd == "train":
                timesteps = req.get("timesteps", 20000)
                
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
                        
                res = session.train(timesteps=timesteps, stream_callback=StreamCallback())
                print(json.dumps(res), flush=True)

            elif cmd == "quit":
                break
            else:
                print(json.dumps({"ok": False, "error": f"Unknown command: {cmd}"}), flush=True)
        except Exception as e:
            print(json.dumps({"ok": False, "error": str(e)}), flush=True)

if __name__ == "__main__":
    main()
