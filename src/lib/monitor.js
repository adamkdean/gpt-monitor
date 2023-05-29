// Copyright (C) 2023 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.

import cron from 'node-cron'
import { FlexDB } from 'node-flexdb'
import { StreamChatAPI } from './openai/stream.js'

export class Monitor {
  constructor(config) {
    this.config = config
    this.gpt3t = new StreamChatAPI(config.openai.apiKey, 'gpt-3.5-turbo', !!process.env.DEBUG)
    this.gpt4 = new StreamChatAPI(config.openai.apiKey, 'gpt-4', !!process.env.DEBUG)
    this.models = {
      'gpt35t': this.gpt3t,
      'gpt4': this.gpt4
    }

    // Generate a relatively small mundane response to get a baseline.
    this.messages = [{ role: 'user', content: `Please write a simple paragraph (max 50 tokens) about copper.` }]
    this.options = { max_tokens: 50 }
  }

  async initialize() {
    if (!this.config.monitor.enabled) {
      console.log('Monitor is disabled, skipping initialization')
      return
    }

    console.log('Initializing FlexDB...')
    try {
      this.flexdb = new FlexDB({ apiKey: this.config.flexdb.apiKey })
      console.log(`Ensuring store exists ${this.config.flexdb.store}`)
      this.store = await this.flexdb.ensureStoreExists(this.config.flexdb.store)
      this.collections = {}
      for (const [name, api] of Object.entries(this.models)) {
        console.log(`Ensuring collection exists: ${name}`)
        this.collections[name] = this.store.collection(name)
      }
      console.log(`FlexDB initialized (store: ${this.store.id})`)
    } catch (error) {
      console.error('Error initializing FlexDB:', error.message)
    }

    if (!process.env.DEBUG) {
      console.log(`Scheduling monitor to run every ${this.config.monitor.pattern}`)
      cron.schedule(this.config.monitor.pattern, this.performCheck.bind(this))
      return
    }

    // debug
    console.log('Running in debug mode, performing check now...')
    this.performCheck()
  }

  async performCheck() {
    try {
      for (const [name, api] of Object.entries(this.models)) {
        console.log(`----\nPerforming API test for ${name}...`)
        const response = await api.generateCompletion(this.messages, this.options)
        const msPerToken = this.roundToTwoDecimals(response.timeToLastByte / response.tokens)
        const tokensPerMinute = this.roundToTwoDecimals(response.tokens / (response.timeToLastByte / 1000 / 60))
        console.log(`Response: "${response.content}"`)
        console.log(`${response.model}: ${response.tokens} tokens`)
        console.log(`${msPerToken} ms/token`)
        console.log(`${tokensPerMinute} tokens/minute`)
        console.log(`timeToFirstByte: ${response.timeToFirstByte} ms`)
        console.log(`timeToLastByte: ${response.timeToLastByte} ms`)

        console.log(`Saving results to FlexDB collection: ${name}...`)
        await this.collections[name].create({
          model: response.model,
          tokens: response.tokens,
          bytes: response.content.length,
          timeToFirstByte: response.timeToFirstByte,
          timeToLastByte: response.timeToLastByte,
          msPerToken,
          tokensPerMinute
        })
      }
    } catch (error) {
      console.error('Error checking API:', error)
    }
  }

  roundToTwoDecimals(number) {
    return Math.round((number + Number.EPSILON) * 100) / 100
  }
}
