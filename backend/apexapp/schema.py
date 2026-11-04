"""Generated data model. Edit here to evolve the schema."""
ENTITIES = {
  "merchantapplication": {
    "name": "MerchantApplication",
    "columns": [
      {
        "name": "merchant_name",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "business_type",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "country",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "monthly_volume_estimate",
        "type": "number",
        "sqlite": "REAL"
      },
      {
        "name": "documents_complete",
        "type": "boolean",
        "sqlite": "INTEGER"
      },
      {
        "name": "kyc_result",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "aml_result",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "credit_result",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "risk_tier",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "reasoning",
        "type": "text",
        "sqlite": "TEXT"
      },
      {
        "name": "recommendation",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "status",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "received_at",
        "type": "date",
        "sqlite": "TEXT"
      }
    ]
  },
  "reconexception": {
    "name": "ReconException",
    "columns": [
      {
        "name": "transaction_id",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "amount",
        "type": "number",
        "sqlite": "REAL"
      },
      {
        "name": "variance_amount",
        "type": "number",
        "sqlite": "REAL"
      },
      {
        "name": "currency",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "source",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "reason_code",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "processor_record",
        "type": "text",
        "sqlite": "TEXT"
      },
      {
        "name": "bank_record",
        "type": "text",
        "sqlite": "TEXT"
      },
      {
        "name": "ledger_record",
        "type": "text",
        "sqlite": "TEXT"
      },
      {
        "name": "explanation",
        "type": "text",
        "sqlite": "TEXT"
      },
      {
        "name": "proposed_fix",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "status",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "opened_at",
        "type": "date",
        "sqlite": "TEXT"
      }
    ]
  },
  "flaggedtransaction": {
    "name": "FlaggedTransaction",
    "columns": [
      {
        "name": "transaction_id",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "merchant_name",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "amount",
        "type": "number",
        "sqlite": "REAL"
      },
      {
        "name": "currency",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "risk_score",
        "type": "number",
        "sqlite": "REAL"
      },
      {
        "name": "signals",
        "type": "text",
        "sqlite": "TEXT"
      },
      {
        "name": "customer_history",
        "type": "text",
        "sqlite": "TEXT"
      },
      {
        "name": "verdict",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "confidence",
        "type": "number",
        "sqlite": "REAL"
      },
      {
        "name": "status",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "flagged_at",
        "type": "date",
        "sqlite": "TEXT"
      }
    ]
  },
  "decision": {
    "name": "Decision",
    "columns": [
      {
        "name": "agent",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "item_type",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "item_id",
        "type": "id",
        "sqlite": "TEXT"
      },
      {
        "name": "action",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "reason",
        "type": "text",
        "sqlite": "TEXT"
      },
      {
        "name": "decided_by",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "decided_at",
        "type": "date",
        "sqlite": "TEXT"
      }
    ]
  },
  "chatmessage": {
    "name": "ChatMessage",
    "columns": [
      {
        "name": "agent",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "role",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "content",
        "type": "text",
        "sqlite": "TEXT"
      },
      {
        "name": "linked_item_id",
        "type": "id",
        "sqlite": "TEXT"
      }
    ]
  },
  "activitylogentry": {
    "name": "ActivityLogEntry",
    "columns": [
      {
        "name": "agent",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "timestamp",
        "type": "date",
        "sqlite": "TEXT"
      },
      {
        "name": "actor",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "actor_type",
        "type": "enum",
        "sqlite": "TEXT"
      },
      {
        "name": "action",
        "type": "string",
        "sqlite": "TEXT"
      },
      {
        "name": "target",
        "type": "id",
        "sqlite": "TEXT"
      },
      {
        "name": "decision_id",
        "type": "id",
        "sqlite": "TEXT"
      }
    ]
  }
}

ROLES = ["admin", "manager", "employee", "viewer"]
WRITE_ROLES = ["admin", "manager", "employee"]
DELETE_ROLES = ["admin"]
