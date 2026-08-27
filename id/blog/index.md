---
title: Tulisan
description: Catatan dan pemikiran yang saya tuliskan.
---

<script setup>
import { data as posts } from './blog.data'
import LedgerList from '../../.vitepress/theme/components/LedgerList.vue'
</script>

# Tulisan

<LedgerList :items="posts" lang="id" />
