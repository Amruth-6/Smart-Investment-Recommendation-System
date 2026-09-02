@router.put("/profile")
async def update_profile(payload: PersonalProfile, user: dict = Depends(get_current_user)):
    data = payload.model_dump()
    data["user_id"] = user["id"]
    await db.user_profiles.update_one({"user_id": user["id"]}, {"$set": data}, upsert=True)
    return {"message": "Profile updated", "profile": data}


@router.post("/onboarding/complete")
async def complete_onboarding(user: dict = Depends(get_current_user)):
    from bson import ObjectId

    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": {"onboarded": True}})
    return {"message": "Onboarding complete"}
