import { HomePageContent } from '@/features/home/home-page-content'
import { HomeService } from '@/features/home/service'

export default async function HomePage() {
  const home = await new HomeService().getHomePage()

  return <HomePageContent home={home} />
}
