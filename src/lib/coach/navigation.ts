// NavigationResolver: converts actionId → URL.
// Renderer returns actionId; only this file knows application routes.

export type CoachActionId =
  | 'see_plan'
  | 'see_strategy'
  | 'see_dashboard'
  | 'see_assessment'

export class NavigationResolver {
  resolve(actionId: CoachActionId, cluster: string, lang: string): string {
    switch (actionId) {
      case 'see_plan':       return `/${lang}/plan/${cluster}`
      case 'see_strategy':   return `/${lang}/plan/${cluster}`
      case 'see_dashboard':  return `/${lang}/dashboard`
      case 'see_assessment': return `/${lang}/assessment/${cluster}`
      default:               return `/${lang}/dashboard`
    }
  }
}

export const navigationResolver = new NavigationResolver()
