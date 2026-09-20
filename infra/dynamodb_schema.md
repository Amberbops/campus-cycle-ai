# CampusCycle AI — DynamoDB Schema Reference

All tables use `PAY_PER_REQUEST` billing mode (no provisioned capacity to manage for MVP).
All primary keys are `string` type.

---

## CampusCycle_Users
| Attribute | Type | Key | Notes |
|---|---|---|---|
| user_id | S | PK | UUID |
| name_alias | S | | Display name (no real name stored) |
| hostel | S | | Block A, Block B, etc. |
| block | S | | Room block |
| role | S | | student \| moderator \| facilities |
| created_at | S | | ISO 8601 UTC |

---

## CampusCycle_Items
| Attribute | Type | Key | Notes |
|---|---|---|---|
| item_id | S | PK | UUID |
| item_name | S | | Human-readable name |
| category | S | | electronics\|furniture\|clothing\|books\|kitchen\|misc |
| condition | S | | new-like\|usable\|repairable-looking\|damaged\|unknown |
| image_uri | S | | s3://bucket/key |
| owner_id | S | | FK → Users |
| hostel | S | | Hostel location |
| status | S | | available\|matched\|removed\|manual_review\|escalated |
| chosen_path | S | | reuse\|repair\|donate\|recycle\|manual_review |
| recommendation | S | | JSON of full AgentRecommendation |
| created_at | S | | ISO 8601 UTC |

---

## CampusCycle_DemandRequests
| Attribute | Type | Key | Notes |
|---|---|---|---|
| request_id | S | PK | UUID |
| requester_id | S | | FK → Users |
| requester_alias | S | | Display name |
| category | S | | Item category needed |
| keywords | L | | List of keyword strings |
| hostel | S | | Where requester is |
| active | BOOL | | True = still looking |
| created_at | S | | ISO 8601 UTC |

---

## CampusCycle_Matches
| Attribute | Type | Key | Notes |
|---|---|---|---|
| match_id | S | PK | UUID |
| item_id | S | | FK → Items |
| request_id | S | | FK → DemandRequests |
| score | N | | Keyword match score 0-1 |
| status | S | | pending\|accepted\|declined |
| created_at | S | | ISO 8601 UTC |

---

## CampusCycle_Tasks
| Attribute | Type | Key | Notes |
|---|---|---|---|
| task_id | S | PK | UUID |
| item_id | S | | Reference item |
| item_name | S | | Human-readable |
| task_type | S | | recycle\|disposal\|inspect |
| location | S | | Hostel/block |
| reason | S | | Why routed here |
| status | S | | pending\|in_progress\|done |
| assigned_to | S | | User ID or null |
| created_at | S | | ISO 8601 UTC |

---

## CampusCycle_ImpactEvents
| Attribute | Type | Key | Notes |
|---|---|---|---|
| impact_id | S | PK | UUID |
| item_id | S | | Reference |
| decision | S | | reuse\|repair\|donate\|recycle\|manual_review |
| category | S | | Item category |
| diverted_from_disposal | BOOL | | True for reuse/repair/donate |
| estimated_weight_kg | S | | Stored as string; clearly an estimate |
| is_estimate | BOOL | | Always true |
| created_at | S | | ISO 8601 UTC |

---

## CampusCycle_AuditEvents
| Attribute | Type | Key | Notes |
|---|---|---|---|
| event_id | S | PK | UUID |
| request_id | S | | Workflow request ID |
| actor | S | | user_id or 'agent' or 'system' |
| event_type | S | | analyze_requested\|analyze_completed\|review_approved\|etc |
| payload_summary | S | | Max 500 chars of sanitised payload |
| timestamp | S | | ISO 8601 UTC |

---

## CampusCycle_Config
| Attribute | Type | Key | Notes |
|---|---|---|---|
| config_id | S | PK | Pattern: `rules#{campus_id}#{category}` |
| allowed_paths | L | | List of allowed circularity paths |
| restricted_categories | L | | Blocked sub-categories |
| wording_guidance | S | | Agent prompt supplement |
