import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from "../stores/auth"

const router = createRouter({
    history: createWebHistory('/map/'),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: () => import('../views/HomeView.vue')
        }
    ]
})

router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    if (!auth.isLoggedIn) {
        window.location.href = '/'
        return
    }

    next()
})

export default router
