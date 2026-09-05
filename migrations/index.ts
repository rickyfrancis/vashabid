import * as migration_20260825_155010_initial_schema from './20260825_155010_initial_schema';
import * as migration_20260826_220331_phase_10_related_words from './20260826_220331_phase_10_related_words';
import * as migration_20260905_114923_phase_12_grammar_topics from './20260905_114923_phase_12_grammar_topics';

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
    name: '20260905_114923_phase_12_grammar_topics'
  },
];
