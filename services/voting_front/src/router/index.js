import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
    history: createWebHistory('/voting/'), 
    routes: [
        {
            path: '/',
            name: 'Voting',
            component: () => import('../views/VotingView.vue')
        }
    ]
})

router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    if (!auth.isLoggedIn) {
        window.location.href = import.meta.env.VITE_LOGIN_SERVICE_URL
        return
    }

    next()
})

export default router