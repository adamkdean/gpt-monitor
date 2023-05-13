// Copyright (C) 2023 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.

import cron from 'node-cron'
import { BasicChatAPI } from './chatapi.js'

export class Monitor {
  constructor(config) {
    this.config = config
    this.api = new BasicChatAPI(config.openai.apiKey, config.openai.model)
  }

  async initialize() {
    cron.schedule(this.config.monitor.pattern, this.checkLatency.bind(this))
  }

  async checkLatency() {
    try {
      console.log('Checking latency...')
      const start = Date.now()
      // TODO: get data
      const elapsed = Date.now() - start
      // TODO: store latency data
      console.log('Completed in', elapsed, 'ms')
    } catch (error) {
      console.error('Error checking latency:', error)
    }
  }
}
