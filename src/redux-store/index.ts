// Third-party Imports
import { configureStore } from '@reduxjs/toolkit'

// Slice Imports
import calendarReducer from '@/redux-store/slices/calendar'
import chatReducer from '@/redux-store/slices/chat'
import kanbanReducer from '@/redux-store/slices/kanban'
import emailReducer from '@/redux-store/slices/email'

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
    chat: chatReducer,
    kanban: kanbanReducer,
    email: emailReducer
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
