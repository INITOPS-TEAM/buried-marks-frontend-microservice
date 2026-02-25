import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from "../stores/auth"

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Login',
            component: () => import('../views/LoginView.vue')
        },
    ]
})

router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    if (to.name === 'Login' && auth.isLoggedIn) {
        window.location.href = import.meta.env.VITE_MAP_SERVICE_URL
        return
    }

    next() 
})

export default router