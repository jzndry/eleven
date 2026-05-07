import pandas as pd

def generate_event_summary(responses):
    """Summarises a single training session or match."""
    df = pd.DataFrame(responses)
    count = len(df)
    
    if count == 0:
        return "No player feedback recorded for this event."

    avg_team_eval = df['team_performance_rating'].mean() if 'team_performance_rating' in df.columns else 5

    summary = f"Event Analysis ({count} responses): "
    if avg_team_eval >= 7:
        summary += "The group felt the performance was high-level and cohesive."
    elif avg_team_eval <= 4:
        summary += "The squad identified significant tactical gaps or low energy during this event."
    else:
        summary += "Feedback suggests a standard performance with room for tactical adjustment."
    
    return summary

def generate_overall_summary(last_4_summaries):
    """Combines the last 4 event summaries into one 'Monthly' outlook."""
    if not last_4_summaries:
        return "Not enough recent event data to generate a monthly trend."
    
    count = len(last_4_summaries)
    # We are doing a simple concatenation or synthesis for the overall view
    combined_text = " ".join(last_4_summaries)
    
    # In a more advanced version, you'd use an LLM here. For now, we provide a trend intro.
    return f"Based on the last {count} events: The team is maintaining a consistent feedback loop. {last_4_summaries[0]}"

def format_history(existing_history, new_event_summary):
    """Manages the rolling list of 4 summaries."""
    history = existing_history if isinstance(existing_history, list) else []
    history.insert(0, new_event_summary)
    return history[:4]