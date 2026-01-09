import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Details from "./views/Details.vue";

export default createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "home", component: Home },
        { path: "/game/new", name: "game-new", component: Details, props: { isNew: true } },
        { path: "/game/:id", name: "game-details", component: Details, props: true }
    ]
});
