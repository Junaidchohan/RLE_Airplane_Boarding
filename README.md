# RLE Airplane Boarding

A small Reinforcement Learning Environment (RLE) built with Gymnasium 
and trained with MaskablePPO (sb3-contrib). The agent learns the 
optimal order to board passengers into an airplane to minimize aisle 
stalling.

## What this is
A verifiable RLE: a task, an environment, an agent, a reward, and a 
programmatic evaluator. It is a demonstration of the environment-
building side of RL for agent training.

## The RLE loop
    Task → Observation → Action → Environment change → Reward → Evaluation

## Environment
- Registered as: `airplane-boarding-v0`
- Action space: Discrete(num_of_rows) — pick which lobby row to board next
- Observation: pairs of (seat_num, status) for each slot in the aisle
- Reward: `-num_passengers_stalled` per step (higher is better, 0 is perfect)
- Terminal: lobby empty AND boarding line empty

## Files
    airplane_boarding.py   Gymnasium environment
    agent.py               MaskablePPO training + test script
    bridge.py              stdin/stdout JSON bridge for the frontend
    check_env.py           Gymnasium env_checker smoke test
    smoke_test.py          2k-step training smoke test
    eval_smoke.py          Load a checkpoint and play one episode
    frontend/              Next.js dashboard (live visualization)
    models/                (gitignored) trained checkpoints
    logs/                  (gitignored) tensorboard logs

## Setup (Python)
    python -m venv .venv
    .venv\Scripts\activate     # Windows
    pip install "numpy<2" gymnasium torch stable-baselines3 sb3-contrib tensorboard

## Run
    python check_env.py       # verify the env
    python smoke_test.py      # train 2k steps (proof of life)
    python eval_smoke.py      # load the model and play one episode

## Frontend dashboard
    cd frontend
    npm install
    npm run dev
    # open http://localhost:3000

## Status
- [x] Environment passes gymnasium check_env
- [x] MaskablePPO trains and saves a checkpoint
- [x] Evaluator (reward.json-style) computes objective score
- [x] Live Next.js visualization
- [ ] Full-length training run (current smoke test = 2k steps)

## License
Apache 2.0
