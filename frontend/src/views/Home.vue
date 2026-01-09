<template>
  <div class="panel">
    <div class="panel-header">
      <h2 class="panel-title">Games database</h2>
      <p class="panel-subtitle">
        Press <span class="kbd">/</span> to focus search. Sorting is local. Search uses the API text index.
      </p>
    </div>

    <div class="panel-body">
      <div class="row" style="margin-bottom:12px;">
        <input
            ref="searchInput"
            class="input"
            v-model="q"
            placeholder="Search by title or genre..."
            style="flex: 1; min-width: 260px;"
        />
        <button class="btn" @click="searchNow">Search</button>
        <button class="btn btn-primary" @click="goNew">New</button>
        <button class="btn btn-muted" @click="resetAll">Reset</button>
      </div>

      <div class="row" style="margin-bottom:12px;">
        <select class="select" v-model="selectedDeveloperId" @change="applyDeveloperFilter" style="min-width: 280px;">
          <option value="">All developers</option>
          <option v-for="d in developers" :key="d._id" :value="d._id">{{ d.name }}</option>
        </select>

        <div class="chips">
          <div class="chip" v-if="qTrim">
            Search: <span>{{ qTrim }}</span>
            <button @click="clearSearch" aria-label="Clear search">×</button>
          </div>

          <div class="chip" v-if="selectedDeveloperId">
            Developer: <span>{{ selectedDeveloperName }}</span>
            <button @click="clearDeveloper" aria-label="Clear developer">×</button>
          </div>

          <div class="chip">
            Sort: <span>{{ sortLabel }}</span>
            <button @click="resetSort" aria-label="Reset sort">×</button>
          </div>

          <span class="badge badge-good">
            Results: <span style="color: var(--text);">{{ displayGames.length }}</span>
          </span>
        </div>

        <div class="spacer"></div>
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <table class="table" v-if="displayGames.length">
        <thead>
        <tr>
          <th class="sortable" @click="sortBy('title')" style="width: 56%;">
            Title <span class="sort-indicator">{{ indicator('title') }}</span>
          </th>
          <th class="sortable" @click="sortBy('genre')" style="width: 16%;">
            Genre <span class="sort-indicator">{{ indicator('genre') }}</span>
          </th>
          <th class="sortable" @click="sortBy('releaseYear')" style="width: 10%;">
            Year <span class="sort-indicator">{{ indicator('releaseYear') }}</span>
          </th>
          <th class="sortable" @click="sortBy('developer')" style="width: 18%;">
            Developer <span class="sort-indicator">{{ indicator('developer') }}</span>
          </th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="g in displayGames" :key="g._id" @click="open(g._id)" style="cursor:pointer;">
          <td>
            <div class="title-cell">
              <img class="thumb" :src="coverUrl(g)" :alt="g.title" loading="lazy" />
              <div class="title-main">
                <a href="#" @click.prevent="open(g._id)">{{ g.title }}</a>

                <div class="chips">
                  <span class="badge">{{ g.genre }}</span>
                  <span class="badge">{{ g.releaseYear }}</span>
                  <span v-if="developerMap[g.developerId]" class="badge badge-warn">{{ developerMap[g.developerId].name }}</span>
                  <span v-else class="badge">Unknown</span>
                  <span v-if="g.steamAppId" class="badge">Steam: <span class="mono">{{ g.steamAppId }}</span></span>
                </div>

                <div class="subid mono">{{ g._id }}</div>
              </div>
            </div>
          </td>

          <td>
            <span class="badge">{{ g.genre }}</span>
          </td>

          <td class="mono">{{ g.releaseYear }}</td>

          <td>
              <span v-if="developerMap[g.developerId]" class="badge badge-warn">
                {{ developerMap[g.developerId].name }}
              </span>
            <span v-else class="badge">Unknown</span>
          </td>
        </tr>
        </tbody>
      </table>

      <div v-else style="margin-top:14px; color: var(--muted);">
        No data to display.
      </div>

      <div class="small-muted" style="margin-top:12px;">
        Instant search is enabled. API calls are debounced.
      </div>
    </div>
  </div>
</template>

<script>
import { api } from "../api";

export default {
  name: "Home",
  data() {
    return {
      games: [],
      developers: [],
      q: "",
      selectedDeveloperId: "",
      error: "",
      debounceTimer: null,
      sortKey: "title",
      sortDir: "asc"
    };
  },
  computed: {
    developerMap() {
      const map = {};
      for (const d of this.developers) map[d._id] = d;
      return map;
    },
    selectedDeveloperName() {
      if (!this.selectedDeveloperId) return "";
      const d = this.developerMap[this.selectedDeveloperId];
      return d ? d.name : "Unknown";
    },
    qTrim() {
      return String(this.q || "").trim();
    },
    sortLabel() {
      const name =
          this.sortKey === "title" ? "Title" :
              this.sortKey === "genre" ? "Genre" :
                  this.sortKey === "releaseYear" ? "Year" :
                      "Developer";
      return `${name} (${this.sortDir.toUpperCase()})`;
    },
    displayGames() {
      const list = Array.isArray(this.games) ? [...this.games] : [];
      const dir = this.sortDir === "asc" ? 1 : -1;
      const key = this.sortKey;

      const devName = (g) => {
        const d = this.developerMap[g.developerId];
        return d ? d.name : "";
      };

      list.sort((a, b) => {
        if (key === "releaseYear") {
          const av = Number(a.releaseYear) || 0;
          const bv = Number(b.releaseYear) || 0;
          return (av - bv) * dir;
        }

        if (key === "developer") {
          const av = devName(a).toLowerCase();
          const bv = devName(b).toLowerCase();
          return av.localeCompare(bv) * dir;
        }

        const av = String(a[key] || "").toLowerCase();
        const bv = String(b[key] || "").toLowerCase();
        return av.localeCompare(bv) * dir;
      });

      return list;
    }
  },
  watch: {
    q() {
      this.scheduleInstantSearch();
    }
  },
  methods: {
    coverUrl(g) {
      const url = String(g?.coverUrl || "").trim();
      if (url) return url;

      const appId = g?.steamAppId ? String(g.steamAppId).trim() : "";
      if (appId) return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;

      const t = String(g?.title || "").trim().slice(0, 18);
      const text = encodeURIComponent(t || "Game");
      return `https://placehold.co/184x69/0f1522/66c0f4?text=${text}`;
    },
    indicator(key) {
      if (this.sortKey !== key) return "";
      return this.sortDir === "asc" ? "▲" : "▼";
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
      } else {
        this.sortKey = key;
        this.sortDir = key === "releaseYear" ? "desc" : "asc";
      }
    },
    resetSort() {
      this.sortKey = "title";
      this.sortDir = "asc";
    },
    scheduleInstantSearch() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.searchNow();
      }, 350);
    },
    async loadDevelopers() {
      try {
        const res = await api.get("/developers");
        this.developers = res.data || [];
      } catch {
        this.developers = [];
      }
    },
    async loadGames() {
      this.error = "";
      try {
        const params = {};
        if (this.selectedDeveloperId) params.developerId = this.selectedDeveloperId;
        const res = await api.get("/games", { params });
        this.games = res.data || [];
      } catch {
        this.error = "Failed to load games.";
      }
    },
    async searchNow() {
      this.error = "";
      const query = this.qTrim;

      if (!query) {
        await this.loadGames();
        return;
      }

      try {
        const params = { q: query };
        if (this.selectedDeveloperId) params.developerId = this.selectedDeveloperId;
        const res = await api.get("/games/search", { params });
        this.games = res.data || [];
      } catch {
        this.error = "Search failed.";
      }
    },
    async applyDeveloperFilter() {
      await this.searchNow();
    },
    async resetAll() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.q = "";
      this.selectedDeveloperId = "";
      this.resetSort();
      await this.loadGames();
      if (this.$refs.searchInput) this.$refs.searchInput.focus();
    },
    async clearSearch() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.q = "";
      await this.loadGames();
      if (this.$refs.searchInput) this.$refs.searchInput.focus();
    },
    async clearDeveloper() {
      this.selectedDeveloperId = "";
      await this.searchNow();
    },
    open(id) {
      this.$router.push({ name: "game-details", params: { id } });
    },
    goNew() {
      this.$router.push({ name: "game-new" });
    },
    onKeydown(e) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const el = this.$refs.searchInput;
        if (el && document.activeElement !== el) {
          e.preventDefault();
          el.focus();
        }
      }
      if (e.key === "Escape") {
        if (this.qTrim) this.clearSearch();
      }
    }
  },
  async mounted() {
    window.addEventListener("keydown", this.onKeydown);
    await this.loadDevelopers();
    await this.loadGames();
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeydown);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
};
</script>
