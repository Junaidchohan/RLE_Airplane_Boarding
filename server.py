import os
from typing import Optional, Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from rle_core import AirplaneBoardingSession

app = FastAPI(title="Airplane Boarding RLE Backend", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session = AirplaneBoardingSession()

class ResetRequest(BaseModel):
    seed: Optional[int] = 42
    num_of_rows: Optional[int] = 10
    seats_per_row: Optional[int] = 5

class StepRequest(BaseModel):
    action: Optional[int] = None
    policy: Literal["random", "trained"] = "trained"

class TrainRequest(BaseModel):
    timesteps: int = Field(default=20000, ge=100)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/state")
def state():
    return session.state()

@app.post("/reset")
def reset(req: ResetRequest = ResetRequest()):
    return session.reset(
        seed=req.seed if req.seed is not None else 42,
        num_of_rows=req.num_of_rows if req.num_of_rows is not None else 10,
        seats_per_row=req.seats_per_row if req.seats_per_row is not None else 5
    )

@app.post("/step")
def step(req: StepRequest = StepRequest()):
    return session.step(action=req.action, policy=req.policy)

@app.post("/train")
def train(req: TrainRequest = TrainRequest()):
    return session.train(timesteps=req.timesteps)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
