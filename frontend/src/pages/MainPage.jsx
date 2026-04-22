import { ADMIN_IDS, MANAGER_IDS } from "../App"
import UserPage  from "./UserPage"
import AdminPage from "./AdminPage"

export default function MainPage({ user, subscription, reloadSub, startParams }) {
  // Менеджеры видят AdminPage (там вкладка Заказы)
  if (ADMIN_IDS.includes(user.id) || MANAGER_IDS.includes(user.id))
    return <AdminPage user={user} subscription={subscription} reloadSub={reloadSub} startParams={startParams} />
  return <UserPage user={user} subscription={subscription} reloadSub={reloadSub} startParams={startParams} />
}