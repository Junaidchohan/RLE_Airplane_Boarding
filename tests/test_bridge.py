import sys
import subprocess
import json
from pathlib import Path

REPO_ROOT = str(Path(__file__).resolve().parent.parent)

def run_episode(policy):
    p = subprocess.Popen(
        [sys.executable, '-m', 'src.server.bridge'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=REPO_ROOT
    )
    
    # reset
    p.stdin.write(json.dumps({'cmd': 'reset', 'seed': 42, 'num_of_rows': 10, 'seats_per_row': 5}) + '\n')
    p.stdin.flush()
    res = json.loads(p.stdout.readline())
    
    tot_reward = 0.0
    steps = 0
    terminated = False
    
    while not terminated:
        p.stdin.write(json.dumps({'cmd': 'step', 'policy': policy}) + '\n')
        p.stdin.flush()
        step_res = json.loads(p.stdout.readline())
        tot_reward = step_res['reward_total']
        steps = step_res['step']
        terminated = step_res['terminated']
        
    p.stdin.write(json.dumps({'cmd': 'quit'}) + '\n')
    p.stdin.flush()
    p.wait()
    return tot_reward, steps

rnd_rew, rnd_steps = run_episode('random')
print(f"Random Policy on seed 42: Total Reward = {rnd_rew}, Steps = {rnd_steps}")

trn_rew, trn_steps = run_episode('trained')
print(f"Trained Policy on seed 42: Total Reward = {trn_rew}, Steps = {trn_steps}")

diff = trn_rew - rnd_rew
print(f"Difference (Trained - Random): {diff:+.2f}")
if trn_rew > rnd_rew:
    print("CONFIRMED: Trained reward > Random reward!")
else:
    print("NOTE: Trained reward <= Random reward")
