import { properties } from './properties'

// Team & roles. Two roles only: Revenue Assistant (owns a portfolio) and
// Lead/Admin (oversees all RAs, sets global recommendation limits).
export const currentUser = {
  id: 'ra-01',
  name: 'Dewi Anjani',
  role: 'ra',
  title: 'Revenue Assistant',
  avatar: 'DA',
  capacity: 20,
}

export const team = [
  {
    id: 'ra-01',
    name: 'Dewi Anjani',
    role: 'ra',
    title: 'Revenue Assistant',
    avatar: 'DA',
    capacity: 20,
    assignedPropertyIds: properties.map((p) => p.id),
  },
  {
    id: 'ra-02',
    name: 'Bagus Pratama',
    role: 'ra',
    title: 'Revenue Assistant',
    avatar: 'BP',
    capacity: 20,
    assignedPropertyIds: [],
  },
  {
    id: 'admin-01',
    name: 'Sinta Wijaya',
    role: 'admin',
    title: 'Revenue Lead',
    avatar: 'SW',
    capacity: null,
    assignedPropertyIds: [],
  },
]
