/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  mockProfiles, mockCustomers, mockProjects, mockActivities,
  mockTasks, mockTargets, mockNotifications, mockProjectDocuments,
} from '../data/mock'
import type { Profile, Customer, Project, Activity, Task, Target, Notification, ProjectDocument, ProjectMemo } from '../types'

// ─── ユーティリティ ──────────────────────────────────────────────────────────

function genId() {
  return crypto.randomUUID()
}

function now() {
  return new Date().toISOString()
}

function load<T>(key: string, seed: T[]): T[] {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T[]
  } catch {
    // ignore
  }
  return seed
}

function loadWithNewSeeds<T extends { id: string }>(key: string, mockSeeds: T[]): T[] {
  const loaded = load(key, mockSeeds)
  const existingIds = new Set(loaded.map((item) => item.id))
  const newSeeds = mockSeeds.filter((item) => !existingIds.has(item.id))
  return [...loaded, ...newSeeds]
}

function loadProjects() {
  const loaded = loadWithNewSeeds(KEYS.projects, mockProjects)
  const seedById = new Map(mockProjects.map((project) => [project.id, project]))
  return loaded.map((project) => {
    const seed = seedById.get(project.id)
    if (!seed) return project
    return {
      ...project,
      labels: project.labels ?? seed.labels,
      next_action_date: project.next_action_date ?? seed.next_action_date,
    }
  })
}

const DEFAULT_ACQUISITION_SOURCE = '手動登録'

function loadCustomers() {
  const loaded = loadWithNewSeeds(KEYS.customers, mockCustomers)
  const seedById = new Map(mockCustomers.map((customer) => [customer.id, customer]))
  return loaded.map((customer) => {
    const seed = seedById.get(customer.id)
    const acquisitionSource = customer.acquisition_source?.trim() || seed?.acquisition_source || DEFAULT_ACQUISITION_SOURCE
    
    let normalizedIndustry: string[] = []
    if (Array.isArray(customer.industry)) {
      normalizedIndustry = customer.industry
    } else if (typeof customer.industry === 'string') {
      normalizedIndustry = [customer.industry]
    } else if (seed?.industry) {
      normalizedIndustry = seed.industry
    }

    if (!seed) {
      return {
        ...customer,
        industry: normalizedIndustry,
        acquisition_source: acquisitionSource,
      }
    }
    return {
      ...customer,
      industry: normalizedIndustry,
      company_code: customer.company_code ?? seed.company_code,
      email: customer.email ?? seed.email,
      status: customer.status ?? seed.status,
      labels: customer.labels ?? seed.labels,
      acquisition_source: acquisitionSource,
    }
  })
}

function loadTasks() {
  const loaded = loadWithNewSeeds(KEYS.tasks, mockTasks)
  const seedById = new Map(mockTasks.map((task) => [task.id, task]))
  return loaded.map((task) => {
    const seed = seedById.get(task.id)
    return {
      ...task,
      project_id: task.project_id ?? seed?.project_id,
      progress_percent: task.progress_percent ?? seed?.progress_percent ?? (task.is_completed ? 100 : 0),
      progress_updated_at: task.progress_updated_at ?? seed?.progress_updated_at,
    }
  })
}

const KEYS = {
  profiles:      'show-nin-profiles',
  customers:     'show-nin-customers',
  projects:      'show-nin-projects',
  activities:    'show-nin-activities',
  tasks:         'show-nin-tasks',
  targets:       'show-nin-targets',
  notifications: 'show-nin-notifications',
  documents:     'show-nin-documents',
  memos:         'show-nin-memos',
}


// ─── 型定義 ──────────────────────────────────────────────────────────────────

interface DataStoreContextValue {
  profiles:      Profile[]
  customers:     Customer[]
  projects:      Project[]
  activities:    Activity[]
  tasks:         Task[]
  targets:       Target[]
  notifications: Notification[]
  documents:     ProjectDocument[]
  memos:         ProjectMemo[]

  // ProjectMemo CRUD
  addProjectMemo:    (projectId: string, content: string, useForAi?: boolean) => ProjectMemo
  updateProjectMemo: (id: string, data: Partial<ProjectMemo>) => void
  deleteProjectMemo: (id: string) => void

  // Profile CRUD
  addProfile:    (data: Omit<Profile, 'id' | 'sidebar_settings' | 'dashboard_layout'>) => Profile

  // Customer CRUD
  addCustomer:    (data: Omit<Customer, 'id' | 'last_accessed_at'>) => Customer
  updateCustomer: (id: string, data: Partial<Customer>) => void
  deleteCustomer: (id: string) => void

  // Project CRUD
  addProject:    (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Project
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Activity CRUD
  addActivity:    (data: Omit<Activity, 'id' | 'created_at'>) => Activity
  updateActivity: (id: string, data: Partial<Activity>) => void
  deleteActivity: (id: string) => void

  // Task CRUD
  addTask:    (data: Omit<Task, 'id'>) => Task
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Target CRUD
  addTarget:    (data: Omit<Target, 'id'>) => Target
  updateTarget: (id: string, data: Partial<Target>) => void
  deleteTarget: (id: string) => void

  // Notification operations
  addNotification:            (data: Omit<Notification, 'id' | 'created_at'>) => Notification
  markNotificationRead:       (id: string) => void
  markAllNotificationsRead:   (userId: string) => void

  // Document Operations
  addProjectDocument:         (data: Omit<ProjectDocument, 'id' | 'uploaded_at'>) => ProjectDocument
  updateProjectDocument:      (id: string, data: Partial<ProjectDocument>) => void
  deleteProjectDocument:      (id: string) => void

  // デフォルトデータにリセット
  resetToDefaults: () => void
}


// ─── Context ─────────────────────────────────────────────────────────────────

const DataStoreContext = createContext<DataStoreContextValue | null>(null)

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [profiles,      setProfiles]      = useState<Profile[]>     (() => loadWithNewSeeds(KEYS.profiles, mockProfiles))
  const [customers,     setCustomers]     = useState<Customer[]>    (() => loadCustomers())
  const [projects,      setProjects]      = useState<Project[]>     (() => loadProjects())
  const [activities,    setActivities]    = useState<Activity[]>    (() => loadWithNewSeeds(KEYS.activities,    mockActivities))
  const [tasks,         setTasks]         = useState<Task[]>        (() => loadTasks())
  const [targets,       setTargets]       = useState<Target[]>      (() => loadWithNewSeeds(KEYS.targets,       mockTargets))
  const [notifications, setNotifications] = useState<Notification[]>(() => loadWithNewSeeds(KEYS.notifications, mockNotifications))
  const [documents,     setDocuments]     = useState<ProjectDocument[]>(() => loadWithNewSeeds(KEYS.documents, mockProjectDocuments))
  const [memos,         setMemos]         = useState<ProjectMemo[]>(() => {
    const loaded = load(KEYS.memos, [] as ProjectMemo[])
    if (loaded.length > 0) return loaded
    const seeds: ProjectMemo[] = mockProjects
      .filter((p) => p.note)
      .map((p) => ({
        id: `memo-seed-${p.id}`,
        project_id: p.id,
        content: p.note || '',
        created_at: p.updated_at || now(),
        created_by: p.user_id,
        use_for_ai: p.note_use_for_ai || false,
      }))
    return seeds
  })

  // localStorage への自動保存
  useEffect(() => { localStorage.setItem(KEYS.profiles,      JSON.stringify(profiles)) },      [profiles])
  useEffect(() => { localStorage.setItem(KEYS.customers,     JSON.stringify(customers)) },     [customers])
  useEffect(() => { localStorage.setItem(KEYS.projects,      JSON.stringify(projects)) },      [projects])
  useEffect(() => { localStorage.setItem(KEYS.activities,    JSON.stringify(activities)) },    [activities])
  useEffect(() => { localStorage.setItem(KEYS.tasks,         JSON.stringify(tasks)) },         [tasks])
  useEffect(() => { localStorage.setItem(KEYS.targets,       JSON.stringify(targets)) },       [targets])
  useEffect(() => { localStorage.setItem(KEYS.notifications, JSON.stringify(notifications)) }, [notifications])
  useEffect(() => { localStorage.setItem(KEYS.documents,     JSON.stringify(documents)) },     [documents])
  useEffect(() => { localStorage.setItem(KEYS.memos,         JSON.stringify(memos)) },         [memos])


  // ─── Customer CRUD ──────────────────────────────────────────────────────

  function addProfile(data: Omit<Profile, 'id' | 'sidebar_settings' | 'dashboard_layout'>): Profile {
    const record: Profile = {
      ...data,
      id: genId(),
      sidebar_settings: {
        order: [
          "home",
          "customers",
          "projects",
          "minutes",
          "tasks",
          "budget",
          "reports",
        ],
        is_fixed: true,
      },
      dashboard_layout: { card_order: [1, 2, 3, 4, 5] },
    }
    setProfiles((prev) => [...prev, record])
    return record
  }

  function addCustomer(data: Omit<Customer, 'id' | 'last_accessed_at'>): Customer {
    const record: Customer = {
      ...data,
      id: genId(),
      acquisition_source: data.acquisition_source?.trim() || DEFAULT_ACQUISITION_SOURCE,
      last_accessed_at: now(),
    }
    setCustomers((prev) => [...prev, record])
    return record
  }

  function updateCustomer(id: string, data: Partial<Customer>) {
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, ...data } : c))
  }

  function deleteCustomer(id: string) {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }

  // ─── Project CRUD ───────────────────────────────────────────────────────

  function addProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const ts = now()
    const record: Project = { ...data, id: genId(), created_at: ts, updated_at: ts }
    setProjects((prev) => [...prev, record])
    return record
  }

  function updateProject(id: string, data: Partial<Project>) {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...data, updated_at: now() } : p))
  }

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  // ─── Activity CRUD ──────────────────────────────────────────────────────

  function addActivity(data: Omit<Activity, 'id' | 'created_at'>): Activity {
    const record: Activity = { ...data, id: genId(), created_at: now() }
    setActivities((prev) => [...prev, record])
    return record
  }

  function updateActivity(id: string, data: Partial<Activity>) {
    setActivities((prev) => prev.map((a) => a.id === id ? { ...a, ...data } : a))
  }

  function deleteActivity(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  // ─── Task CRUD ──────────────────────────────────────────────────────────

  function addTask(data: Omit<Task, 'id'>): Task {
    const record: Task = {
      progress_percent: data.is_completed ? 100 : 0,
      progress_updated_at: now().slice(0, 10),
      ...data,
      id: genId(),
    }
    setTasks((prev) => [...prev, record])
    return record
  }

  function updateTask(id: string, data: Partial<Task>) {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t
      const progressChanged = data.progress_percent !== undefined && data.progress_percent !== t.progress_percent
      return {
        ...t,
        ...data,
        ...(data.progress_percent === 100 ? { is_completed: true } : {}),
        ...(progressChanged ? { progress_updated_at: now().slice(0, 10) } : {}),
      }
    }))
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  // ─── Target CRUD ────────────────────────────────────────────────────────

  function addTarget(data: Omit<Target, 'id'>): Target {
    const record: Target = { ...data, id: genId() }
    setTargets((prev) => [...prev, record])
    return record
  }

  function updateTarget(id: string, data: Partial<Target>) {
    setTargets((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t))
  }

  function deleteTarget(id: string) {
    setTargets((prev) => prev.filter((t) => t.id !== id))
  }

  // ─── Notification operations ─────────────────────────────────────────────

  function addNotification(data: Omit<Notification, 'id' | 'created_at'>): Notification {
    const record: Notification = { ...data, id: genId(), created_at: now() }
    setNotifications((prev) => [...prev, record])
    return record
  }

  function markNotificationRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  function markAllNotificationsRead(userId: string) {
    setNotifications((prev) => prev.map((n) => n.user_id === userId ? { ...n, is_read: true } : n))
  }

  // ─── Document Operations ─────────────────────────────────────────────────

  function addProjectDocument(data: Omit<ProjectDocument, 'id' | 'uploaded_at'>): ProjectDocument {
    const record: ProjectDocument = { ...data, id: genId(), uploaded_at: now() }
    setDocuments((prev) => [...prev, record])
    return record
  }

  function updateProjectDocument(id: string, data: Partial<ProjectDocument>) {
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, ...data } : d))
  }

  function deleteProjectDocument(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  function addProjectMemo(projectId: string, content: string, useForAi = false): ProjectMemo {
    const record: ProjectMemo = {
      id: genId(),
      project_id: projectId,
      content,
      created_at: now(),
      created_by: 'user-001',
      use_for_ai: useForAi,
    }
    setMemos((prev) => [...prev, record])
    return record
  }

  function updateProjectMemo(id: string, data: Partial<ProjectMemo>) {
    setMemos((prev) => prev.map((m) => m.id === id ? { ...m, ...data } : m))
  }

  function deleteProjectMemo(id: string) {
    setMemos((prev) => prev.filter((m) => m.id !== id))
  }

  // ─── デフォルトにリセット ────────────────────────────────────────────────

  function resetToDefaults() {
    setProfiles(mockProfiles)
    setCustomers(mockCustomers)
    setProjects(mockProjects)
    setActivities(mockActivities)
    setTasks(mockTasks)
    setTargets(mockTargets)
    setNotifications(mockNotifications)
    setDocuments(mockProjectDocuments)
    setMemos(mockProjects
      .filter((p) => p.note)
      .map((p) => ({
        id: `memo-seed-${p.id}`,
        project_id: p.id,
        content: p.note || '',
        created_at: p.updated_at || now(),
        created_by: p.user_id,
        use_for_ai: p.note_use_for_ai || false,
      }))
    )
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key))
  }


  return (
    <DataStoreContext.Provider value={{
      profiles,
      customers, projects, activities, tasks, targets, notifications, documents, memos,
      addProfile,
      addCustomer, updateCustomer, deleteCustomer,
      addProject, updateProject, deleteProject,
      addActivity, updateActivity, deleteActivity,
      addTask, updateTask, deleteTask,
      addTarget, updateTarget, deleteTarget,
      addNotification, markNotificationRead, markAllNotificationsRead,
      addProjectDocument, updateProjectDocument, deleteProjectDocument,
      addProjectMemo, updateProjectMemo, deleteProjectMemo,
      resetToDefaults,
    }}>
      {children}
    </DataStoreContext.Provider>
  )

}

export function useDataStore() {
  const ctx = useContext(DataStoreContext)
  if (!ctx) throw new Error('useDataStore must be used within DataStoreProvider')
  return ctx
}
