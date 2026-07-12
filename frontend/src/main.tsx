import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/variables.css';
import './styles/global.css';
import { AppShell } from '@/components/layout/AppShell';
import { HomeView } from '@/views/HomeView';
import { useAppStore } from '@/lib/store';
import {
  ContactsPlaceholder,
  GroupsPlaceholder,
  NewTicketPlaceholder,
  TicketDetailPlaceholder,
  SettingsPlaceholder,
  FeatureFlagsPlaceholder,
  GroupDetailPlaceholder,
} from '@/views/PlaceholderViews';

function AppRouter() {
  const currentView = useAppStore((s) => s.currentView);

  return (
    <AppShell>
      {currentView === 'home' && <HomeView />}
      {currentView === 'contacts' && <ContactsPlaceholder />}
      {currentView === 'groups' && <GroupsPlaceholder />}
      {currentView === 'new-ticket' && <NewTicketPlaceholder />}
      {currentView === 'ticket-detail' && <TicketDetailPlaceholder />}
      {currentView === 'settings' && <SettingsPlaceholder />}
      {currentView === 'feature-flags' && <FeatureFlagsPlaceholder />}
      {currentView === 'group-detail' && <GroupDetailPlaceholder />}
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
