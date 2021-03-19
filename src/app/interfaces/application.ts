import { SystemHealth } from "./system-health";

export interface Application {
  id: number
  name: string
  context: string
  monitoringUrl: string
  isActive: boolean
  systemHealth?: SystemHealth
}
