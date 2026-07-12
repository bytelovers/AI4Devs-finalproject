import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/variables.css';
import './styles/global.css';
import { AppShell } from '@/components/layout/AppShell';
import { HomeView } from '@/views/HomeView';
import { useAppStore } from '@/lib/store';
import { NewTicketView } from '@/views/NewTicketView';
import { ContactsView } from '@/views/ContactsView';
import { GroupsView, GroupDetailView } from '@/views/GroupsView';
import { TicketDetailView } from '@/views/TicketDetailView';
import { SettingsView } from '@/views/SettingsView';
import { FeatureFlagsView } from '@/views/FeatureFlagsView';

function AppRouter() {
  const currentView = useAppStore((s) => s.currentView);

  return (
    <AppShell>
      {currentView === 'home' && <HomeView />}
      {currentView === 'contacts' && <ContactsView />}
      {currentView === 'groups' && <GroupsView />}
      {currentView === 'new-ticket' && <NewTicketView />}
      {currentView === 'ticket-detail' && <TicketDetailView />}
      {currentView === 'settings' && <SettingsView />}
      {currentView === 'feature-flags' && <FeatureFlagsView />}
      {currentView === 'group-detail' && <GroupDetailView />}
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
