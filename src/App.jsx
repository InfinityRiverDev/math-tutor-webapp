import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    WebApp.ready()
    setUser(WebApp.initDataUnsafe?.user)
  }, [])

  return (
    <div>
      <h1>Привет, {user?.first_name ?? 'гость'}!</h1>
    </div>
  )
}

export default App