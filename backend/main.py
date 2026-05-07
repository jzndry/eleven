import os
from dotenv import load_dotenv
from supabase import create_client, Client
import processor 

# Load environment variables from the .env file in the backend directory
load_dotenv()

# Using os.getenv to fetch credentials; we check for None to satisfy type checkers
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if url is None or key is None:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env file.")

# Initialise the Supabase client with the Service Role Key for admin access
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
        # We use .single() because we only want one team's record
        team_query = supabase.table("teams") \
            .select("summary_last_4") \
            .eq("id", team_id) \
            .single() \
            .execute()
        
        current_last_4 = []
        
        # We are doing this check to prevent the 'Attribute get is unknown' error
        # By verifying it is a dict, Python allows us to use .get() safely
        if team_query.data and isinstance(team_query.data, dict):
            # If the column is NULL in the database, .get() returns None
            raw_history = team_query.data.get("summary_last_4")
            current_last_4 = raw_history if isinstance(raw_history, list) else []
        else:
            current_last_4 = []

        # We are doing this to maintain the rolling list of the last 4 event summaries
        updated_last_4 = processor.format_history(current_last_4, event_text)
        
        # Generate the 'Big Picture' summary based on the recent history
        overall_text = processor.generate_overall_summary(updated_last_4)

        # 5. Save to Team table
        # We are doing this to update the team dashboard with the latest insights
        supabase.table("teams").update({
            "summary_overall": overall_text,
            "summary_last_4": updated_last_4
        }).eq("id", team_id).execute()

        print(f"--- Analysis Complete: Team {team_id} updated successfully ---")

    except Exception as e:
        # We are doing this to catch database timeouts or schema mismatches
        print(f"Analysis failed for event {event_id}: {e}")

if __name__ == "__main__":
    # Replace these with real UUIDs from your Supabase dashboard to test
    RUN_EVENT_ID = ""
    RUN_TEAM_ID = ""
    run_event_analysis(RUN_EVENT_ID, RUN_TEAM_ID)