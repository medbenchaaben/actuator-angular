export interface MemoryManagement {
  memoryUsed: MemoryUsed,
  memoryMax: MemoryMax
}

export interface MemoryUsed {
  name: string,
  measurements: [
    {
      value: number
    }
  ]
}

export interface MemoryMax {
  name: string,
  measurements: [
    {
      value: number
    }
  ]
}
