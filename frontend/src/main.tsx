import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { OcrReviewView } from '@/views/OcrReviewView';
import { ContactsView } from '@/views/ContactsView';
import { GroupsView, GroupDetailView } from '@/views/GroupsView';
import { TicketDetailView } from '@/views/TicketDetailView';
import { SettingsView } from '@/views/SettingsView';
import { FeatureFlagsView } from '@/views/FeatureFlagsView';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import {
  newTicketParentLoader,
  captureLoader,
  reviewLoader,
  participantsLoader,
  assignLoader,
  summaryLoader,
  scanningLoader,
  ocrReviewLoader,
} from '@/lib/wizard-loaders';

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

function AppRouter() {
  return (
    <>
      <ServiceWorkerRegister />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<HomeView />} />
            <Route path="contacts" element={<ContactsView />} />
            <Route path="groups" element={<GroupsView />} />
            <Route path="groups/:groupId" element={<GroupDetailView />} />
            <Route path="tickets" element={<TicketsListView />} />
            <Route path="tickets/new" element={<NewTicketShell />} loader={newTicketParentLoader as any} />
            <Route path="tickets/new/capture" element={<NewTicketCaptureView />} loader={captureLoader as any} />
            <Route path="tickets/new/review" element={<NewTicketReviewView />} loader={reviewLoader as any} />
            <Route path="tickets/new/participants" element={<NewTicketParticipantsView />} loader={participantsLoader as any} />
            <Route path="tickets/new/assign" element={<NewTicketAssignView />} loader={assignLoader as any} />
            <Route path="tickets/new/summary" element={<NewTicketSummaryView />} loader={summaryLoader as any} />
            <Route path="tickets/new/scanning" element={<div />} loader={scanningLoader as any} />
            <Route path="tickets/new/ocr-review" element={<OcrReviewView />} loader={ocrReviewLoader as any} />
            <Route path="tickets/:ticketId" element={<TicketDetailView />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="settings/feature-flags" element={<FeatureFlagsView />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);