def build_used_permissions(activities):
    used_permissions = {}

    for activity in activities:
        account_id = activity["account_id"]
        used_permission = activity["action"] + ":" + activity["resource"]

        if account_id not in used_permissions:
            used_permissions[account_id] = []

        used_permissions[account_id].append(used_permission)

    return used_permissions


def check_risks(identities, activities, used_permissions):

    purpose_resources = {
        "Invoice Processing": ["invoices", "payments"],
        "Generate Reports": ["reports"]
    }

    risks = []

    for identity in identities:

        account_id = identity["account_id"]
        granted_permissions = identity["permissions"]

        # Orphan Identity
        if identity.get("agent") is None:
            risks.append({
                "account_id": account_id,
                "risk_type": "Orphan Identity",
                "severity": "High",
                "reason": (
                    f"'{account_id}' is an active identity with no assigned agent or owner. "
                    "Nobody is accountable for what this credential can access."
                )
            })

        # Used permissions
        used = used_permissions.get(account_id, [])

        # Least Privilege
        unused_permissions = []

        for permission in granted_permissions:
            if permission not in used:
                unused_permissions.append(permission)

        if unused_permissions:
            risks.append({
                "account_id": account_id,
                "risk_type": "Least Privilege",
                "severity": "Medium",
                "details": unused_permissions,
                "reason": (
                    f"'{account_id}' was granted {unused_permissions} but has not used "
                    "these permissions in the last 30 days. Consider revoking unused access."
                )
            })

        # Separation of Duties
        if (
            "write:payments" in granted_permissions
            and "approve:payments" in granted_permissions
        ):
            risks.append({
                "account_id": account_id,
                "risk_type": "Separation of Duties",
                "severity": "High",
                "reason": (
                    f"'{account_id}' can both create (write:payments) and approve "
                    "(approve:payments) payments. A single identity should not be able "
                    "to complete a financial transaction alone."
                )
            })

        # Purpose Boundary
        purpose = identity["purpose"]
        allowed_resources = purpose_resources.get(purpose, [])

        for activity in activities:
            if activity["account_id"] == account_id:

                resource = activity["resource"]

                if resource not in allowed_resources:
                    risks.append({
                        "account_id": account_id,
                        "risk_type": "Purpose Boundary",
                        "severity": "Medium",
                        "details": resource,
                        "reason": (
                            f"'{account_id}' is registered for '{purpose}' but was seen "
                            f"accessing '{resource}', which is outside its intended purpose."
                        )
                    })

    return risks