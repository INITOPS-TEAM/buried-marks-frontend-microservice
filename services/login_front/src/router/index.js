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
        {
            path: '/register',
            name: 'Register',
            component: () => import('../views/RegistView.vue')
        }
    ]
})

router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    if (['Login', 'Register'].includes(to.name) && auth.isLoggedIn) {
    window.location.href = `${import.meta.env.VITE_MAP_SERVICE_URL}/map/`
    return
    }

    next()
})

export default router
