from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import json

from app.db import get_identities, get_activities, insert_identities, insert_activities
from app.risk_engine import build_used_permissions, check_risks


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "NHI Governance API is running"
    }

@app.get("/identities")
def list_identities():
    try:
        identities = get_identities()
        return {"identities": identities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/risks")
def get_risks():
    try:
        identities = get_identities()
        activities = get_activities()

        used_permissions = build_used_permissions(activities)

        risks = check_risks(
            identities,
            activities,
            used_permissions
        )

        return {
            "total_risks": len(risks),
            "risks": risks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not calculate risks: {str(e)}")


@app.post("/ingest")
async def ingest_data(
    directory_file: UploadFile = File(...),
    activity_file: UploadFile = File(...)
):
    # Read the uploaded files (they arrive as raw bytes)
    directory_bytes = await directory_file.read()
    activity_bytes = await activity_file.read()

    # Try to parse the JSON - this is where bad files would fail
    try:
        identities_list = json.loads(directory_bytes)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="directory_file is not valid JSON. Please check the file and try again."
        )

    try:
        activities_list = json.loads(activity_bytes)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="activity_file is not valid JSON. Please check the file and try again."
        )

    # Basic shape check - make sure required fields exist
    required_identity_fields = {"account_id", "type", "purpose", "permissions"}
    for acc in identities_list:
        missing = required_identity_fields - acc.keys()
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"An identity is missing required fields: {missing}"
            )

    required_activity_fields = {"account_id", "timestamp", "action", "resource"}
    for event in activities_list:
        missing = required_activity_fields - event.keys()
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"An activity event is missing required fields: {missing}"
            )

    try:
        identities_count = insert_identities(identities_list)
        activities_count = insert_activities(activities_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error while saving data: {str(e)}")

    return {
        "message": "Data ingested successfully",
        "identities_inserted": identities_count,
        "activities_inserted": activities_count
    }


@app.get("/identities/{account_id}")
def get_identity_detail(account_id: str):

    try:
        identities = get_identities()
        activities = get_activities()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Find the one identity we're looking for
    identity = None
    for i in identities:
        if i["account_id"] == account_id:
            identity = i
            break

    if identity is None:
        raise HTTPException(
            status_code=404,
            detail=f"No identity found with account_id '{account_id}'"
        )

    # Get only this identity's activity events
    identity_activities = [
        a for a in activities if a["account_id"] == account_id
    ]

    used_permissions = build_used_permissions(activities)

    # Reuse the same risk engine, but only for this one identity
    risks = check_risks([identity], activities, used_permissions)

    return {
        "identity": identity,
        "granted_permissions": identity["permissions"],
        "used_permissions": used_permissions.get(account_id, []),
        "activity_timeline": identity_activities,
        "risks": risks
    }