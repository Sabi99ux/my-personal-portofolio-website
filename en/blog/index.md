---
title: Writing
description: Notes and thoughts I write down.
---

<script setup>
import { data as posts } from './blog.data'
import LedgerList from '../../.vitepress/theme/components/LedgerList.vue'
</script>

# Writing

<LedgerList :items="posts" lang="en" />
