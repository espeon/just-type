import { SidebarWrapper } from '@/features/sidebar'
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
    component: () => (
        <SidebarWrapper>
            <Outlet />
        </SidebarWrapper>
    )
})
