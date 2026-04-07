import UserPage from "./UserPage"
import AdminPage from "./AdminPage"

const ADMIN_IDS = [1991833177] // твой telegram id

export default function MainPage({ user }) {
  if (ADMIN_IDS.includes(user.id)) {
    return <AdminPage user={user} />
  }

  return <UserPage user={user} />
}