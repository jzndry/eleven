import os
from dotenv import load_dotenv
from supabase import create_client

# Loading the keys from the .env file in the same folder
load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

# Check if keys actually loaded to avoid type errors
if not url or not key:
    raise ValueError("Check your .env file, the keys didn't load.")

supabase = create_client(url, key)

def run_test():
    try:
        # just pulling one row from teams to see if the door is open
        response = supabase.table("teams").select("*").limit(1).execute()
        
        print("Connection Successful")
        print("Data retrieved:", response.data)
        
    except Exception as e:
        print("Connection Failed")
        print("Error details:", e)

if __name__ == "__main__":
    run_test()