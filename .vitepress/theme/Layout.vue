<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import Landing from './components/Landing.vue'

const { frontmatter, lang } = useData()
</script>

<template>
  <Landing v-if="frontmatter.layout === 'landing'" :key="lang" />
  <DefaultTheme.Layout v-else />
</template>