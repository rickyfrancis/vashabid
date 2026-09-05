import 'server-only'

import { cache } from 'react'
import { GrammarService } from './service'

export const getGrammarDetail = cache((slug: string) =>
  new GrammarService().getDetailPage(slug),
)
