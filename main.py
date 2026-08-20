from app.data_loader import load_json
from app.risk_engine import build_used_permissions, check_risks


# Load project data
identities = load_json("data/directory.json")
activities = load_json("data/activity.json")


# Build used permissions
used_permissions = build_used_permissions(activities)


# Run risk checks
risks = check_risks(
    identities,
    activities,
    used_permissions
)


# Display risk results
for risk in risks:
    print(risk)