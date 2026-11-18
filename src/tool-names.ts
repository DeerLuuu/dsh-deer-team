/** Stable business API names; exposure changes never rename these operations. */
export const TEAM_TOOL_NAMES = [
  'deers_team_create', 'deers_team_approve', 'deers_team_edit_plan',
  'deers_team_add_member', 'deers_team_remove_member', 'deers_team_edit_member', 'deers_team_set_model',
  'deers_team_create_task',
  'deers_team_reassign_task', 'deers_team_claim_task', 'deers_team_update_task',
  'deers_team_amend_task',
  'deers_team_send_message', 'deers_team_status', 'deers_team_wait', 'deers_team_resume', 'deers_team_delete',
  'deers_team_import',
  'deers_team_blackboard_post', 'deers_team_blackboard_read', 'deers_team_blackboard_vote',
  'deers_team_blackboard_clear',
  'deers_team_progress', 'deers_team_digest', 'deers_team_recall',
  'deers_team_vote_create', 'deers_team_vote_cast', 'deers_team_vote_read', 'deers_team_vote_close',
] as const

export const MEMBER_TOOL_NAMES: readonly string[] = [
  'deers_team_claim_task', 'deers_team_update_task', 'deers_team_send_message', 'deers_team_status',
  'deers_team_blackboard_post', 'deers_team_blackboard_read', 'deers_team_blackboard_vote',
  'deers_team_progress', 'deers_team_digest', 'deers_team_recall',
  'deers_team_vote_cast', 'deers_team_vote_read',
]

export const CAPTAIN_TOOL_NAMES = TEAM_TOOL_NAMES.filter(name => !MEMBER_TOOL_NAMES.includes(name))
