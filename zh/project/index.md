---
title: 项目
description: 我曾经完成和参与过的项目。

---

<script setup>

import { data as projects } from './project.data'

import LedgerList from '../../.vitepress/theme/components/LedgerList.vue'

</script>

# 项目

<LedgerList :items="projects" lang="zh" />