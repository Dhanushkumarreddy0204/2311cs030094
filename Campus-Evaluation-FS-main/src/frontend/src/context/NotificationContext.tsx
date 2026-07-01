// ============================================================
// Stage 7 – Notification Context
// Global state management via React Context API.
// ============================================================
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Notification, NotificationFilter } from "../types/notification";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
export interface NotificationState {
  notifications: Notification[];
  priorityNotifications: Notification[];
  unreadCount: number;
  currentPage: number;
  totalPages: number;
  totalNotifications: number;
  filter: NotificationFilter;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  snackbarOpen: boolean;
  snackbarMessage: string;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------
type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "SET_NOTIFICATIONS";
      payload: {
        notifications: Notification[];
        totalPages: number;
        totalNotifications: number;
      };
    }
  | { type: "SET_PRIORITY_NOTIFICATIONS"; payload: Notification[] }
  | { type: "SET_UNREAD_COUNT"; payload: number }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_FILTER"; payload: NotificationFilter }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "MARK_READ"; payload: number }
  | { type: "MARK_ALL_READ" }
  | { type: "DELETE_NOTIFICATION"; payload: number }
  | { type: "PREPEND_NOTIFICATION"; payload: Notification }
  | { type: "SHOW_SNACKBAR"; payload: string }
  | { type: "HIDE_SNACKBAR" };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const initialState: NotificationState = {
  notifications: [],
  priorityNotifications: [],
  unreadCount: 0,
  currentPage: 1,
  totalPages: 1,
  totalNotifications: 0,
  filter: "All",
  searchQuery: "",
  loading: false,
  error: null,
  snackbarOpen: false,
  snackbarMessage: "",
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function notificationReducer(state: NotificationState, action: Action): NotificationState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload.notifications,
        totalPages: action.payload.totalPages,
        totalNotifications: action.payload.totalNotifications,
        loading: false,
        error: null,
      };

    case "SET_PRIORITY_NOTIFICATIONS":
      return { ...state, priorityNotifications: action.payload };

    case "SET_UNREAD_COUNT":
      return { ...state, unreadCount: action.payload };

    case "SET_PAGE":
      return { ...state, currentPage: action.payload };

    case "SET_FILTER":
      return { ...state, filter: action.payload, currentPage: 1 };

    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload, currentPage: 1 };

    case "MARK_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.notification_id === action.payload ? { ...n, is_read: true } : n
        ),
        priorityNotifications: state.priorityNotifications.map((n) =>
          n.notification_id === action.payload ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        priorityNotifications: state.priorityNotifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      };

    case "DELETE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.notification_id !== action.payload
        ),
        priorityNotifications: state.priorityNotifications.filter(
          (n) => n.notification_id !== action.payload
        ),
        totalNotifications: Math.max(0, state.totalNotifications - 1),
      };

    case "PREPEND_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };

    case "SHOW_SNACKBAR":
      return { ...state, snackbarOpen: true, snackbarMessage: action.payload };

    case "HIDE_SNACKBAR":
      return { ...state, snackbarOpen: false };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface NotificationContextValue {
  state: NotificationState;
  dispatch: React.Dispatch<Action>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useNotificationContext(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotificationContext must be used inside <NotificationProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Dispatch helpers (avoid prop-drilling action types at call sites)
// ---------------------------------------------------------------------------
export function useNotificationDispatch() {
  const { dispatch } = useNotificationContext();

  return useCallback(
    () => ({
      setLoading: (val: boolean) => dispatch({ type: "SET_LOADING", payload: val }),
      setError: (val: string | null) => dispatch({ type: "SET_ERROR", payload: val }),
      setNotifications: (
        notifications: Notification[],
        totalPages: number,
        totalNotifications: number
      ) =>
        dispatch({
          type: "SET_NOTIFICATIONS",
          payload: { notifications, totalPages, totalNotifications },
        }),
      setPriorityNotifications: (val: Notification[]) =>
        dispatch({ type: "SET_PRIORITY_NOTIFICATIONS", payload: val }),
      setUnreadCount: (val: number) => dispatch({ type: "SET_UNREAD_COUNT", payload: val }),
      setPage: (val: number) => dispatch({ type: "SET_PAGE", payload: val }),
      setFilter: (val: NotificationFilter) => dispatch({ type: "SET_FILTER", payload: val }),
      setSearch: (val: string) => dispatch({ type: "SET_SEARCH", payload: val }),
      markRead: (id: number) => dispatch({ type: "MARK_READ", payload: id }),
      markAllRead: () => dispatch({ type: "MARK_ALL_READ" }),
      deleteNotification: (id: number) =>
        dispatch({ type: "DELETE_NOTIFICATION", payload: id }),
      prependNotification: (n: Notification) =>
        dispatch({ type: "PREPEND_NOTIFICATION", payload: n }),
      showSnackbar: (msg: string) => dispatch({ type: "SHOW_SNACKBAR", payload: msg }),
      hideSnackbar: () => dispatch({ type: "HIDE_SNACKBAR" }),
    }),
    [dispatch]
  );
}
