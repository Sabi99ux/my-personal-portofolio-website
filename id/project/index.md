---
title: Project
description: Daftar proyek yang pernah saya kerjakan.
---

<script setup>
import { data as projects } from './project.data'
import LedgerList from '../../.vitepress/theme/components/LedgerList.vue'
</script>

# Project

<LedgerList :items="projects" lang="id" />
