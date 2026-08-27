---
title: Projects
description: Projects I've worked on.
---

<script setup>
import { data as projects } from './project.data'
import LedgerList from '../../.vitepress/theme/components/LedgerList.vue'
</script>

# Projects

<LedgerList :items="projects" lang="en" />
