export const ACTUAL_COMPARISON = [
  {
    'model': 'TF-IDF logistic baseline',
    'threshold': 0.35,
    'rows': [
      {
        'fixture_id': 'after_hours_access_override',
        'score': 0.5047147000657676,
      },
      {
        'fixture_id': 'freeze_window_ticket',
        'score': 0.6060682702228029,
      },
      {
        'fixture_id': 'takeover_recovery_request',
        'score': 0.5784971243732356,
      },
      {
        'fixture_id': 'routine_rotation_followup',
        'score': 0.3816848218150899,
      },
      {
        'fixture_id': 'routine_access_question',
        'score': 0.49415042078077825,
      },
      {
        'fixture_id': 'routine_status_request',
        'score': 0.4185656471976275,
      },
    ],
    'tp': 3,
    'fp': 3,
    'fn': 0,
    'decision': 'hold',
    'reason': 'false_positives:3>max:1',
  },
  {
    'model': 'Six-row random tiny encoder',
    'threshold': 0.35,
    'rows': [
      {
        'fixture_id': 'after_hours_access_override',
        'score': 0.003090639365836978,
      },
      {
        'fixture_id': 'freeze_window_ticket',
        'score': 0.05148908868432045,
      },
      {
        'fixture_id': 'takeover_recovery_request',
        'score': 0.5802147388458252,
      },
      {
        'fixture_id': 'routine_rotation_followup',
        'score': 0.00031452852999791503,
      },
      {
        'fixture_id': 'routine_access_question',
        'score': 0.001024771947413683,
      },
      {
        'fixture_id': 'routine_status_request',
        'score': 0.0009471360826864839,
      },
    ],
    'tp': 1,
    'fp': 0,
    'fn': 2,
    'decision': 'hold',
    'reason': 'missed:after_hours_access_override,freeze_window_ticket',
  },
];
