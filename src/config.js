// Copyright (C) 2023 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.

import dotenv from 'dotenv'
dotenv.config()

export default {
  flexdb: {
    apiKey: process.env.FLEXDB_API_KEY,
    store: process.env.FLEXDB_STORE || 'gpt-monitor'
  },
  monitor: {
    pattern: process.env.MONITOR_PATTERN || '*/15 * * * *'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  server: {
    port: process.env.HTTP_PORT || 3000
  }
}