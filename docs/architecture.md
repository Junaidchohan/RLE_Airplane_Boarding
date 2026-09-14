# System Architecture & Design

This document details the architectural principles, execution flow, component isolation, and extension pathways for the **RLE Airplane Boarding** platform.

---

## 1. The RLE Closed Loop

Reinforcement Learning Environments (RLEs) provide a formalized closed-loop framework for agent training and benchmark evaluation. The cycle executes deterministically:

```
    ┌────────────────────────────────────────────────────────┐
    │ 1. Task Definition (num_of_rows, seats_per_row, seed)  │
    └───────────────────────────┬────────────────────────────┘
                                │
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │ 2. Agent Observes State (Aisle occupancy & statuses)   │
    └───────────────────────────┬────────────────────────────┘
                                │
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │ 3. Agent Selects Action (Candidate row index)          │
    └───────────────────────────┬────────────────────────────┘
                                │
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │ 4. Environment Updates (State transition & stepping)   │
    └───────────────────────────┬────────────────────────────┘
                                │
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │ 5. Evaluator Computes Reward (-stalled passengers)     │
    └───────────────────────────┬────────────────────────────┘
                                │
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │ 6. Termination Verification (Lobby empty & aisle clear)│
    └───────────────────────────┬────────────────────────────┘
                                │
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │ 7. Repeat / Benchmark Summary                          │
    └────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Module Separation

The repository is decoupled into discrete functional boundaries:

| Package | Purpose & Boundary |
| :--- | :--- |
| `src/env/` | Pure Gymnasium environment implementation (`AirplaneEnv`), state definitions, observation spaces, action spaces, and stepping logic. Independent of training frameworks and web servers. |
| `src/core/` | Headless RLE session management (`AirplaneBoardingSession`), deterministic state extraction, metric aggregation, and model checkpoint inference. |
| `src/server/` | Web & IPC layer. Houses FastAPI endpoints (`server.py`) and standard I/O streaming bridges (`bridge.py`) for live frontend telemetry and human inspection. |
| `training/` | Policy optimization workflows, MaskablePPO hyperparameter configurations, evaluation callbacks, and checkpoint generators. |
| `tests/` | Formal verification suites (`accept_rle.py`, `accept_learn.py`), Gymnasium compliance checks (`check_env.py`), smoke tests, and reward audits. |
| `docs/` | Architectural documentation, test results, benchmarks, and media assets. |
| `frontend/` | Next.js/React real-time visual boarding dashboard. |

### Rationale for Decoupling

1. **Production Parity**: Frontier AI environments must run efficiently in headless distributed training setups without UI or server overhead.
2. **Deterministic Verification**: Isolation allows `tests/` to run strict regression verification without dependencies on web servers.
3. **Pluggable Agent Interfaces**: Agents interface with standard Gymnasium methods without needing knowledge of bridge or UI code.

---

## 3. How to Add a New Environment

To introduce a new environment variant (e.g. twin-aisle aircraft, priority boarding, or cargo loading):

1. **Implement Environment in `src/env/`**:
   - Subclass `gymnasium.Env`.
   - Define `observation_space` (e.g. `Box`) and `action_space` (e.g. `Discrete`).
   - Implement `action_masks()` for invalid action filtering.
   - Register the environment ID using `gymnasium.envs.registration.register`.

2. **Wrap in `src/core/`**:
   - Extend `AirplaneBoardingSession` (or create a dedicated session class) to expose JSON-serializable state representations.

3. **Expose in `src/server/`**:
   - Add routes in `server.py` and commands in `bridge.py` if frontend dashboard streaming is desired.

4. **Add Formal Verification Tests in `tests/`**:
   - Implement task definition verification, observation bounds checks, mask validation, reward consistency checks, and terminal state assertions.
