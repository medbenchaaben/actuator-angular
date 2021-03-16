import { SystemHealth } from "./system-health";

export interface Application {
  id: number
  name: string
  context: string
  url: string
  isActive: boolean
  systemHealth?: SystemHealth
}
