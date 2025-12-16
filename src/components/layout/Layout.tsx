import { Outlet } from 'react-router-dom';
import { SubscriptionGuard } from '../auth/SubscriptionGuard';

export const Layout = () => {
  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      <main className="flex-1 h-full overflow-y-auto relative flex flex-col">
        {/* Outlet renderiza la página hija correspondiente (Dashboard, Ventas, etc.) */}
                      <SubscriptionGuard><Outlet/></SubscriptionGuard>
      </main>
    </div>
  );
};