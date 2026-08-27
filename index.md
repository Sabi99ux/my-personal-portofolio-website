---
layout: false
title: Portfolio
---

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const base = import.meta.env.BASE_URL
  const preferred = (navigator.language || 'id').toLowerCase().startsWith('id') ? 'id' : 'en'
  window.location.replace(`${base}${preferred}/`)
})
</script>

<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:ui-sans-serif,system-ui,sans-serif;">
  <p>
    Redirecting —
    <a href="/id/">Bahasa Indonesia</a> ·
    <a href="/en/">English</a>
  </p>
</div>
