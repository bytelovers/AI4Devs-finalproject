/* eslint-disable react-refresh/only-export-components */ // entry point: defines local components, nothing to fast-refresh
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './styles/variables.css';
import './styles/global.css';
import { AppShell } from '@/components/layout/AppShell';
import { HomeView } from '@/views/HomeView';
import { TicketsListView } from '@/views/TicketsListView';
import { NewTicketShell } from '@/views/NewTicketShell';
import { NewTicketCaptureView } from '@/views/NewTicketCaptureView';
import { NewTicketReviewView } from '@/views/NewTicketReviewView';
import { NewTicketParticipantsView } from '@/views/NewTicketParticipantsView';
import { NewTicketAssignView } from '@/views/NewTicketAssignView';
import { NewTicketSummaryView } from '@/views/NewTicketSummaryView';
import { ContactsView } from '@/views/ContactsView';
import { GroupsView, GroupDetailView } from '@/views/GroupsView';
import { TicketDetailView } from '@/views/TicketDetailView';
import { SettingsView } from '@/views/SettingsView';
import { FeatureFlagsView } from '@/views/FeatureFlagsView';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
      <p className="text-muted-foreground mt-2">Página no encontrada</p>
      <button
        onClick={() => window.history.back()}
        className="mt-4 btn btn-primary"
      >
        Volver
      </button>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomeView /> },
      { path: 'contacts', element: <ContactsView /> },
      { path: 'groups', element: <GroupsView /> },
      { path: 'groups/:groupId', element: <GroupDetailView /> },
      { path: 'tickets', element: <TicketsListView /> },
      {
        path: 'tickets/new',
        element: <NewTicketShell />,
        children: [
          { index: true, element: <Navigate to="capture" replace /> },
          { path: 'capture', element: <NewTicketCaptureView /> },
          { path: 'review', element: <NewTicketReviewView /> },
          { path: 'participants', element: <NewTicketParticipantsView /> },
          { path: 'assign', element: <NewTicketAssignView /> },
          { path: 'summary', element: <NewTicketSummaryView /> },
        ],
      },
      { path: 'tickets/:ticketId', element: <TicketDetailView /> },
      { path: 'settings', element: <SettingsView /> },
      { path: 'settings/feature-flags', element: <FeatureFlagsView /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);