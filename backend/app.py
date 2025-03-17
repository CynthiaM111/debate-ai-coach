from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

#initialize FASTAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#OpenAI API key
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
print("OPENAI_API_KEY:", os.getenv("OPENAI_API_KEY"))

#Pydantic model for the request body structure
class DebateRequest(BaseModel):
    user_argument: str
    
#debate coach endpoint

@app.post("/debate")
async def debate_coach(request: DebateRequest):
    context = "You are an expert debater, critical thinker, and persuasive speaker. Your task is to analyze the user's argument, identify its key claims, and construct a compelling counter-argument that is logical, well-reasoned, and concise. Use strong reasoning, relevant examples, and, if necessary, rhetorical techniques to challenge the argument effectively. Your response should be direct and structured but avoid unnecessary complexity. Always assume an opposing stance and avoid agreeing with the user's argument."
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        temperature=0.5,
        messages=[
            {"role": "system", "content": context},
            {"role": "user", "content": request.user_argument}
        ]
    )
    return {"counter_argument": response.choices[0].message.content}