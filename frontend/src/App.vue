<template>
  <div class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <div class="brand-badge"></div>
        <div>
          <div class="brand-title">GameDB</div>
          <div class="brand-sub">Create, find and change your game library</div>
        </div>
      </div>

      <div class="nav">
        <router-link to="/">Database</router-link>
      </div>
    </div>
  </div>

  <div class="container">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App"
};
</script>
