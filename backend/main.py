import os
from dotenv import load_dotenv
from supabase import create_client, Client
import processor 

# Load credentials
load_dotenv()
url: str = os.environ.get("SUPABASE_URL") or ""
key: str = os.environ.get("SUPABASE_KEY") or ""

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env file.")

supabase: Client = create_client(url, key)

def run_event_analysis(event_id: str, team_id: str):
    print(f"--- Processing Event: {event_id} ---")
    
    try:
        # 1. Get questionnaires for THIS specific event
        # We are doing this to isolate the feedback for just one training or match
        resp = supabase.table("questionnaires").select("*").eq("event_id", event_id).execute()
        
        if not resp.data:
            print(f"No player responses found for event {event_id}.")
            return

        # 2. Generate the summary for this specific event using processor.py
        event_text = processor.generate_event_summary(resp.data)

        # 3. Update the Events table
        # We are doing this so every event has its own permanent text summary
        supabase.table("events").update({"event_summary": event_text}).eq("id", event_id).execute()

        # 4. Update the Team's "Last 4" and "Overall" summary
        team_query = supabase.table("teams") \
            .select("summary_last_4") \
            .eq("id", team_id) \
            .single() \
            .execute()
        
        current_last_4 = []
        
        # By verifying it is a dict, Python allows us to use .get() safely
        if team_query.data and isinstance(team_query.data, dict):
            raw_history = team_query.data.get("summary_last_4")
            current_last_4 = raw_history if isinstance(raw_history, list) else []
        else:
            current_last_4 = []

        # We are doing this to maintain the rolling list of the last 4 event summaries
        updated_last_4 = processor.format_history(current_last_4, event_text)
        
        # Generate the 'Big Picture' summary based on the recent history
        overall_text = processor.generate_overall_summary(updated_last_4)

        # 5. Save to Team table
        # We are doing this to update the team dashboard with the latest qualitative insights
        supabase.table("teams").update({
            "summary_overall": overall_text,
            "summary_last_4": updated_last_4
        }).eq("id", team_id).execute()

        print(f"--- Analysis Complete: Team {team_id} updated successfully ---")

    except Exception as e:
        print(f"Analysis failed for event {event_id}: {e}")

if __name__ == "__main__":
    RUN_EVENT_ID = "6ece6d5c-e77e-4542-bf5c-18e04d8eda02"
    RUN_TEAM_ID = "4e73f290-d6f5-42e9-8d96-48bb41b2fd9b"
    run_event_analysis(RUN_EVENT_ID, RUN_TEAM_ID)