import pandas as pd
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

# new client automatically looks for the GEMINI_API_KEY environment variable
try:
    client = genai.Client()
    print("GenAI client initialised successfully.")
except Exception as e:
    client = None
    raise RuntimeError(f"Failed to initialise GenAI client: {e}")
    

def generate_event_summary(responses):
    """Summarises a single training session or match using Gemini."""
    df = pd.DataFrame(responses)
    count = len(df)
    
    if count == 0:
        return "No player feedback recorded for this event."

    # Change the relevant columns into a string format for the AI to read
    if 'team_performance_rating' in df.columns:
        relevant_cols = [c for c in ['team_performance_rating', 'player_performance_satisfaction', 'tactics_comment', 'further_comments'] if c in df.columns]
        data_string = df[relevant_cols].to_string(index=False)
    else:
        data_string = df.to_string(index=False)

    prompt = f"""
    You are a UEFA-license expert football coach assistant. 
    Analyse the following post-match/training feedback from {count} players. 
    Provide a concise, professional 2-3 sentence summary of the squad's performance, morale, and any key tactical feedback mentioned. 
    Use British English spelling and do not use emojis.
    
    Raw Player Data:
    {data_string}
    """
    
    if client:
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response.text:
                return response.text.strip()
            else:
                print("Gemini API Error: Response text was None")
        except Exception as e:
            print(f"Gemini API Error (Event): {e}")
            
    # In case if AI fails or client isn't loaded, we can at least provide a basic summary based on average ratings
    avg_team_eval = df['team_performance_rating'].mean() if 'team_performance_rating' in df.columns else 5
    summary = f"Event Analysis ({count} responses): "
    if avg_team_eval >= 7:
        return summary + "The group felt the performance was high-level and cohesive."
    elif avg_team_eval <= 4:
        return summary + "The squad identified significant tactical gaps or low energy."
    return summary + "Standard performance with room for tactical adjustment."

def generate_overall_summary(last_4_summaries):
    """Combines the last 4 event summaries into one 'Monthly' outlook using Gemini."""
    if not last_4_summaries:
        return "Not enough recent event data to generate a monthly trend."
    
    count = len(last_4_summaries)
    summaries_text = "\n".join([f"- {s}" for s in last_4_summaries])
    
    prompt = f"""
    You are a UEFA-license expert football coach assistant. 
    Read the following summaries from the team's last {count} events.
    Provide a concise 2-3 sentence monthly trend analysis highlighting consistency, improvements, or recurring tactical issues.
    Use British English spelling and do not use emojis.
    
    Recent Event Summaries:
    {summaries_text}
    """
    
    if client:
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response.text:
                return response.text.strip()
            else:
                print("Gemini API Error: Response text was None")
        except Exception as e:
            print(f"Gemini API Error (Overall): {e}")
            
    return f"Based on the last {count} events: The team is maintaining a consistent feedback loop. {last_4_summaries[0]}"

def format_history(existing_history, new_event_summary):
    """Manages the rolling list of 4 summaries."""
    history = existing_history if isinstance(existing_history, list) else []
    history.insert(0, new_event_summary)
    return history[:4]