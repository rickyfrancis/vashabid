import 'server-only'

import { cache } from 'react'
import { ScenarioService } from './service'

export const getScenarioDetail = cache((slug: string) =>
  new ScenarioService().getDetailPage(slug),
)
