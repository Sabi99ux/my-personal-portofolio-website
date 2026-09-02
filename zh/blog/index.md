---
title: 文章
description: 我记录下来的笔记与思考。

---

<script setup>

import { data as posts } from './blog.data'

import LedgerList from '../../.vitepress/theme/components/LedgerList.vue'

</script>

# 文章

<LedgerList :items="posts" lang="zh" />