<template>
  <div class="panel">
    <div class="panel-header">
      <h2 class="panel-title">{{ header }}</h2>
      <p class="panel-subtitle">
        Select an existing developer or type a new one. You can set the country for new developers.
      </p>
    </div>

    <div class="panel-body">
      <div class="grid grid-2" style="margin-bottom: 12px;">
        <div class="panel" style="padding: 14px;">
          <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;">
            <div>
              <div style="font-size: 12px; color: var(--muted);">Game ID</div>
              <div class="mono" style="margin-top:6px;">
                {{ isNewMode ? "New document" : $route.params.id }}
              </div>
            </div>
            <span class="badge badge-good">{{ isNewMode ? "Create" : "Edit" }}</span>
          </div>
        </div>

        <div class="panel" style="padding: 14px;">
          <div style="display:flex;gap:12px;align-items:center;">
            <img class="thumb" :src="previewUrl()" :alt="form.title || 'Game'" />
            <div style="min-width:0;">
              <div style="font-size: 12px; color: var(--muted);">Preview</div>
              <div style="margin-top: 6px; font-weight: 800; overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                {{ form.title || "Untitled" }}
              </div>
              <div class="chips" style="margin-top: 8px;">
                <span class="badge" v-if="form.genre">{{ form.genre }}</span>
                <span class="badge" v-if="form.releaseYear">{{ form.releaseYear }}</span>

                <span class="badge badge-warn" v-if="developer">
                  {{ developer.name }}
                </span>
                <span class="badge" v-else-if="developerNameTrim">
                  {{ developerNameTrim }}
                </span>
                <span class="badge" v-else>
                  Developer not selected
                </span>

                <span class="badge" v-if="developerCountryShown">
                  {{ developerCountryShown }}
                </span>

                <span class="badge" v-if="steamAppIdTrim">
                  Steam: <span class="mono">{{ steamAppIdTrim }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-2">
        <div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Title</div>
          <input class="input" v-model="form.title" placeholder="Game title" />
        </div>

        <div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Genre</div>
          <input class="input" v-model="form.genre" placeholder="Genre" />
        </div>

        <div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Release year</div>
          <input class="input" v-model.number="form.releaseYear" type="number" placeholder="Release year" />
        </div>

        <div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Developer (existing)</div>
          <select class="select" v-model="form.developerId" :disabled="Boolean(developerNameTrim)">
            <option value="">Select developer</option>
            <option v-for="d in developers" :key="d._id" :value="d._id">
              {{ d.name }} ({{ d.country || "Unknown" }})
            </option>
          </select>
        </div>

        <div style="grid-column: 1 / -1;">
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Developer (new)</div>
          <input class="input" v-model="developerName" placeholder="Type a new developer name to auto-create it" />
        </div>

        <div style="grid-column: 1 / -1;">
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Developer country (new)</div>
          <input class="input" v-model="developerCountry" :disabled="!developerNameTrim" placeholder="Example: USA" />
        </div>

        <div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Steam App ID (optional)</div>
          <input class="input" v-model="form.steamAppId" placeholder="Example: 730" />
        </div>

        <div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Cover URL (optional)</div>
          <input class="input" v-model="form.coverUrl" placeholder="Direct image URL or Steam Store URL" />
          <div class="small-muted" style="margin-top:8px;">
            Examples:
            <span class="mono">https://store.steampowered.com/app/730/Counter-Strike_2/</span> or
            <span class="mono">https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg</span>
          </div>
        </div>
      </div>

      <div class="row" style="margin-top: 14px;">
        <button class="btn btn-primary" v-if="isNewMode" @click="createGame">New</button>
        <button class="btn btn-primary" v-else @click="updateGame">Edit</button>
        <button class="btn btn-danger" v-if="!isNewMode" @click="deleteGame">Delete</button>
        <div class="spacer"></div>
        <button class="btn btn-muted" @click="goHome">Back</button>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { api } from "../api";

export default {
  name: "Details",
  props: {
    isNew: { type: Boolean, default: false }
  },
  data() {
    return {
      developers: [],
      developer: null,
      developerName: "",
      developerCountry: "",
      form: {
        title: "",
        genre: "",
        releaseYear: 2000,
        developerId: "",
        steamAppId: "",
        coverUrl: ""
      },
      error: ""
    };
  },
  computed: {
    isNewMode() {
      return this.isNew === true;
    },
    header() {
      return this.isNewMode ? "Create new game" : "Game details";
    },
    steamAppIdTrim() {
      return String(this.form.steamAppId || "").trim();
    },
    coverUrlTrim() {
      return String(this.form.coverUrl || "").trim();
    },
    developerNameTrim() {
      return String(this.developerName || "").trim();
    },
    developerCountryTrim() {
      return String(this.developerCountry || "").trim();
    },
    developerCountryShown() {
      if (this.developer && this.developer.country) return this.developer.country;
      if (this.developerNameTrim) return this.developerCountryTrim || "Unknown";
      return "";
    }
  },
  methods: {
    extractSteamAppId(text) {
      const s = String(text || "").trim();
      if (!s) return "";
      const m1 = s.match(/\/app\/(\d+)\b/);
      if (m1 && m1[1]) return m1[1];
      const m2 = s.match(/steam\/apps\/(\d+)\b/);
      if (m2 && m2[1]) return m2[1];
      return "";
    },
    previewUrl() {
      const url = this.coverUrlTrim;
      const fromUrl = this.extractSteamAppId(url);

      if (fromUrl) return `https://cdn.akamai.steamstatic.com/steam/apps/${fromUrl}/header.jpg`;

      const appId = this.steamAppIdTrim;
      if (appId) return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;

      if (url) return url;

      const t = String(this.form.title || "").trim().slice(0, 18);
      const text = encodeURIComponent(t || "Game");
      return `https://placehold.co/184x69/0f1522/66c0f4?text=${text}`;
    },
    payload() {
      const derived = this.extractSteamAppId(this.coverUrlTrim);
      const steamAppIdFinal = derived || this.steamAppIdTrim;

      const base = {
        title: this.form.title,
        genre: this.form.genre,
        releaseYear: this.form.releaseYear,
        steamAppId: steamAppIdFinal,
        coverUrl: derived ? "" : this.coverUrlTrim
      };

      if (this.developerNameTrim) {
        return {
          ...base,
          developerName: this.developerNameTrim,
          developerCountry: this.developerCountryTrim
        };
      }

      return { ...base, developerId: this.form.developerId };
    },
    async loadDevelopers() {
      try {
        const res = await api.get("/developers");
        this.developers = res.data || [];
      } catch {
        this.developers = [];
      }
    },
    async loadDeveloper(developerId) {
      this.developer = null;
      const id = String(developerId || "").trim();
      if (!id) return;
      try {
        const res = await api.get(`/developers/${id}`);
        this.developer = res.data;
      } catch {
        this.developer = null;
      }
    },
    async loadGame() {
      this.error = "";
      this.developer = null;
      this.developerName = "";
      this.developerCountry = "";

      if (this.isNewMode) return;

      try {
        const res = await api.get(`/games/${this.$route.params.id}`);
        this.form = {
          title: res.data.title || "",
          genre: res.data.genre || "",
          releaseYear: res.data.releaseYear || 2000,
          developerId: res.data.developerId || "",
          steamAppId: res.data.steamAppId ? String(res.data.steamAppId) : "",
          coverUrl: res.data.coverUrl || ""
        };
        await this.loadDeveloper(this.form.developerId);
      } catch {
        this.error = "Failed to load game.";
      }
    },
    async createGame() {
      this.error = "";
      try {
        await api.post("/games", this.payload());
        this.goHome();
      } catch (e) {
        this.error = e?.response?.data?.message || "Failed to create game.";
      }
    },
    async updateGame() {
      this.error = "";
      try {
        await api.put(`/games/${this.$route.params.id}`, this.payload());
        this.goHome();
      } catch (e) {
        this.error = e?.response?.data?.message || "Failed to update game.";
      }
    },
    async deleteGame() {
      this.error = "";
      try {
        await api.delete(`/games/${this.$route.params.id}`);
        this.goHome();
      } catch (e) {
        this.error = e?.response?.data?.message || "Failed to delete game.";
      }
    },
    goHome() {
      this.$router.push({ name: "home" });
    }
  },
  watch: {
    "form.developerId"(val) {
      if (this.developerNameTrim) return;
      this.loadDeveloper(val);
    },
    developerName(val) {
      const v = String(val || "").trim();
      if (v) {
        this.developer = null;
        this.form.developerId = "";
      } else if (this.form.developerId) {
        this.loadDeveloper(this.form.developerId);
      }
    },
    "form.coverUrl"(val) {
      const appId = this.extractSteamAppId(val);
      if (appId) this.form.steamAppId = appId;
    }
  },
  async mounted() {
    await this.loadDevelopers();
    await this.loadGame();
  }
};
</script>
