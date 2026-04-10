import { ADMIN_IDS } from "../App"
import UserPage  from "./UserPage"
import AdminPage from "./AdminPage"

export default function MainPage({ user, subscription, reloadSub }) {
  if (ADMIN_IDS.includes(user.id))
    return <AdminPage user={user} subscription={subscription} reloadSub={reloadSub} />
  return <UserPage user={user} subscription={subscription} reloadSub={reloadSub} />
}