import * as migration_20260825_155010_initial_schema from './20260825_155010_initial_schema';
import * as migration_20260826_220331_phase_10_related_words from './20260826_220331_phase_10_related_words';
import * as migration_20260905_114923_phase_12_grammar_topics from './20260905_114923_phase_12_grammar_topics';
import * as migration_20260905_223054_phase_13_scenarios from './20260905_223054_phase_13_scenarios';
import * as migration_20260910_001218_phase_15_feedback from './20260910_001218_phase_15_feedback';

export const migrations = [
  {
    up: migration_20260825_155010_initial_schema.up,
    down: migration_20260825_155010_initial_schema.down,
    name: '20260825_155010_initial_schema',
  },
  {
    up: migration_20260826_220331_phase_10_related_words.up,
    down: migration_20260826_220331_phase_10_related_words.down,
    name: '20260826_220331_phase_10_related_words',
  },
  {
    up: migration_20260905_114923_phase_12_grammar_topics.up,
    down: migration_20260905_114923_phase_12_grammar_topics.down,
    name: '20260905_114923_phase_12_grammar_topics',
  },
  {
    up: migration_20260905_223054_phase_13_scenarios.up,
    down: migration_20260905_223054_phase_13_scenarios.down,
    name: '20260905_223054_phase_13_scenarios',
  },
  {
    up: migration_20260910_001218_phase_15_feedback.up,
    down: migration_20260910_001218_phase_15_feedback.down,
    name: '20260910_001218_phase_15_feedback'
  },
];
