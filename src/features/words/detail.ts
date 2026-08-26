import 'server-only'

import { cache } from 'react'
import { WordService } from './service'

export const getWordDetail = cache((slug: string) =>
  new WordService().getDetailPage(slug),
)
