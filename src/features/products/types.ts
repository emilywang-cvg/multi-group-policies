export type ID = string

export interface Channel {
  id: ID
  name: string
}

export interface Agent {
  id: ID
  name: string
  channelId: ID
}

export interface Product {
  id: ID
  name: string
  type: string
}








