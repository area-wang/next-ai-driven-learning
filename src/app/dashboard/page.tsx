import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"

export const metadata = {
  title: "仪表板 - AI学习平台",
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  return <DashboardClient userName={session.user.name || "学习者"} />
}
