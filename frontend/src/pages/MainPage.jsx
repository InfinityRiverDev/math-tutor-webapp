import UserPage from "./UserPage"
import AdminPage from "./AdminPage"

const ADMIN_IDS = [1991833177]

export default function MainPage({ user, subscription, reloadSubscription }) {
  const isAdmin = ADMIN_IDS.includes(user.id)

  if (isAdmin) {
    return <AdminPage user={user} subscription={subscription} reloadSubscription={reloadSubscription} />
  }

  return <UserPage user={user} subscription={subscription} reloadSubscription={reloadSubscription} />
}