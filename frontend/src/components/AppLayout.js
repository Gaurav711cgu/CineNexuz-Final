import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileSidebar } from './EnhancedSidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <MobileSidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden lg:pt-0 pt-14">
        <TopBar />
        <div className="flex-1 overflow-auto">
          <div className="min-h-full pb-12">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
