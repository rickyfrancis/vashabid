import * as migration_20260825_155010_initial_schema from './20260825_155010_initial_schema'
import * as migration_20260826_220331_phase_10_related_words from './20260826_220331_phase_10_related_words'

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
]
